+++

title =  "openGauss数据与PostgreSQL的差异对比" 

date = "2021-08-21" 

tags = [ "openGauss数据与PostgreSQL的差异对比"] 

archives = "2021-08" 

author = "Walrus" 

summary = "openGauss数据与PostgreSQL的差异对比"

img = "/zh/post/July/title/img3.png" 

times = "12:30"

+++

# **openGauss数据与PostgreSQL的差异对比**<a name="ZH-CN_TOPIC_0000001127317632"></a>

## 1. 前言<a name="section34511110143014"></a>

openGauss数据库已经发布2.0.1版本了，中启乘数科技是一家专业的专注于极致性能的数据库服务提供商，所以也关注openGauss数据库的特性。因为openGauss是从PostgreSQL发展出来的，所以我们详细讲解对比一下openGauss与原生PostgreSQL数据库的对比。

## 2. openGauss大功能方面的变化<a name="section14276101713015"></a>

openGauss是基于PostgreSQL9.2版本开发的，基本包括了PostgreSQL9.4的功能。目前PostgreSQL正式版本已经到13了， 14的beta版本也发布了。openGauss只把PostgreSQL9.4之后的新版本的极少数功能移植进来了，绝大多数功能都没有纳入。

openGauss最大的变化就是把PostgreSQL的进程模式改成了线程模式，当然这两个模式其实各有优缺点。线程模式对短连接有优势，比进程模式的数据库可以承担更大的并发短请求，但线程模式也有明显的缺点，所有的线程共享内存，如果一个线程的的野指针把别人的内存改了，不会报错，一时半会可能还发现不了，极端情况下会导致数据损坏而不被发现。所以说这个改变不能说有什么明显的好处，某些情况下可能还是一个退步。为了改成线程模式，openGauss的把C语言的源代码改成了C++。C++的好处是容易封装，坏处是移植性降低了。

当然openGauss增加了线程池的功能，目前还不清楚这个功能是否稳定可靠。如果稳定可靠可以不使用第三方的连接池工具了。

openGauss另一个变化是把事务ID\(XID\)从32bit改成了64bit，64bit的xid的好处是永远不可能耗尽，好处是我们永远不用担心会发生xid回卷宕机的风险。注意，虽然xid改为了64bit，但是过期的事务ID依旧需要清理。实际上PostgreSQL数据库默认达到2亿事务就强制整理，而32bit的xid可以达到20亿，所以我们实际上可以修改autovacuum\_freeze\_max\_age为10亿来推迟对xid的整理。

我们知道磁盘扇区大小是512字节，一些SSD可以是4k大小，而数据库一般是8k/16k/32k，一个数据库数据块刷到操作系统的过程中可能发生宕机造成这样有块断裂问题，即块中一半是新数据，另一半还是旧数据，这就是块的逻辑损坏，这可能导致数据库无法启动。

MySQL通过双写double write来解决这个问题，PostgreSQL是通过full\_page\_write来解决这个问题，就是在数据页第一次发生变更的时候将整个页面记录到xlog日志中，这样出了问题就有了完整的数据页加xlog日志进行恢复，这样做的缺点是大大增加了xlog的日志量，也对性能有一定影响。当然我们可以通过延长checkpoint的间隔时间来缓解这个问题。而openGauss实现了类似MySQL的双写，写数据块的同时将脏页也写到一个共享的双写空间里，如果发生问题会从双写空间里找到完整的数据页进行恢复。双写特性参数enable\_double\_write需要配合增量检查点一起使用。openGauss这个功能有一定的实际价值。

openGauss主备库的模式与PostgreSQL有比较大的不同，PostgreSQL的备库模式是拉的模式，即备库主动到主库上拉WAL日志，而openGauss改成了推的模式，推的模式是主库主动把WAL模式推到备库。而实际上改成这样，导致搭建备库更不方便了，因为搭建备库时必须到主库上修改参数replconninfo1或replconninfo2，即replconninfoN, N=1\~8，而可以配置的参数只有8个，所以感觉openGauss后面最多只能挂8个备库。当年从Oracle转到PostgreSQL上时，还比较庆幸不用动主库了，一用openGauss感觉又回到了解放前。

openGauss内置的了主备库切换功能，让使用者用起来更方便。但这个功能是和数据库本身紧耦合的，同时不太稳定。笔者在测试中，备库就报从主库中断开了，报大量的日志把空间给撑爆了：

```
2021-06-24 08:38:43.824 [unknown] [unknown] localhost 47427058550848 0  0 [BACKEND] LOG:  configuration file "/opt/software/openGauss
/data/slave/postgresql.conf" contains errors; unaffected changes were applied
2021-06-24 08:38:43.832 [unknown] [unknown] localhost 47428485064448 0  0 [BACKEND] LOG:  Connect failed.
2021-06-24 08:38:43.833 [unknown] [unknown] localhost 47428485064448 0  0 [BACKEND] LOG:  Connect failed.
2021-06-24 08:38:43.833 [unknown] [unknown] localhost 47428485064448 0  0 [BACKEND] LOG:  Connect failed.
2021-06-24 08:38:43.833 [unknown] [unknown] localhost 47428485064448 0  0 [BACKEND] LOG:  Connect failed.
2021-06-24 08:38:43.833 [unknown] [unknown] localhost 47428485064448 0  0 [BACKEND] LOG:  Connect failed.
2021-06-24 08:38:43.833 [unknown] [unknown] localhost 47428485064448 0  0 [BACKEND] LOG:  Connect failed.
```

从上面的日志可以看出，打印日志时，没有任何间隔，不断的打印，很快就会把空间给撑满。这是一个很糟糕的设计，在生产系统中这也是一个很危险的情况，虽然有空间告警，但有可能还没有等工程师来处理，空间就给撑满了。

openGauss摒除recovery.conf文件。当然PostgreSQL12的版本也是摒除recovery.conf文件。openGauss是启动数据库是指定是备库还是主库：

```
gs_ctl start -D $GAUSSHOME/data/master -M standby
```

这个改变实际上是一个非常糟糕的改变，如果DBA忘加了“-M standby”，这个备库就废掉了，需要重新搭建。而原生PostgreSQL是建立了一个文件来指示这个数据库是主库还是备库，不会有这种误操作的风险。好在openGauss提供了gs\_ctl build命令重新搭建备库，部分缓解了这个问题。

openGauss有一个最大可用模式most\_available\_sync，openGauss认为原生PostgreSQL的流复制有一个痛点就是在一主一备的同步模式下，如果备库宕机，主库会hang，同步模式不会自动降级。所以openGauss设计了最大可用模式，即开启该参数后在主从连接正常的情况下处于同步模式，如果备机断连会立刻切为异步模式，如果备机再次启动会自动连接并切为同步模式。但实际上这种设计是一种奇怪的设计，如果出现问题立即降级，那么与异步模式有什么区别？同步模式本身就是要保证故障切换后不丢失数据，当故障时主库立即降级了，这时再切换了，直接就丢失数据了。如果允许丢数据，直接使用异步复制就可以了，如果需要不丢数据，使用同步模式，如果一个备库坏了主库也不hang，那么就做两个备库的同步模式，这个most\_available\_sync模式感觉不太实用。

openGauss支持了列存表，列存表支持压缩。列存表使用中需要注意膨胀的一些问题，如果了解不深，建议不要使用。

openGauss在每个库下面会默认有个叫dbe\_perf的schema，这个schema下有有几百个性能视图，这些视图大部分pg里面都有，但是放在单独的schema中方便查看和管理，这个设计还不错。

openGauss中实现了xlog预分配，在xlog未写满时就分配下面一个或者几个xlog。网上有人说PostgreSQL不能预分配WAL，这是错误的认识，实际上PostgreSQL是可以把原先使用的WAL日志改名成预分配的WAL日志的，参数min\_wal\_size就是指定了需要预先预留的WAL文件数，这个参数默认是80MB，这个值对于一些需要灌大量数据的数据库来说，有点小了，可以把此值改大。

openGauss实现了增量checkpoint，官方称让数据库更平滑。

openGauss实现了并行恢复，默认是关闭的。

由于openGauss的物理备库也会建复制槽，为了防止备库把主库的空间撑爆，openGauss又增加了两个参数：enable\_xlog\_prune和 max\_size\_for\_xlog\_prune，允许删除掉过多的WAL日志防止把主库撑爆：

```
postgres=# show max_size_for_xlog_prune;
 max_size_for_xlog_prune
-------------------------
 2147483647kB
(1 row)
```

但默认max\_size\_for\_xlog\_prune设置的比较大，起不到保护作用。

openGauss支持与oracle使用方法基本相同的定时任务dbms\_job。

openGauss有初步的逻辑解码功能，但不如PostgreSQL完善。没有完整的PostgreSQL的逻辑复制功能。

openGauss的索引支持比新版本的PostgreSQL弱一些，如不支持brin索引，PostgreSQL新版本对Btree索引有比较大的优化，这一块openGauss也有一些缺失，也没有布隆过滤器的功能。

## 3. openGauss一些硬伤<a name="section13205591319"></a>

首先是不支持并行。这也很好理解，PostgreSQL是从9.6开始支持并行了，而openGauss是基于PostgreSQL9.4的。目前PostgreSQL有强大的并行功能。目前不清楚openGauss什么时候可以支持并行。

编译过于复杂，依赖过多：编译需要很多依赖，而且版本固定，造成跨平台编译的难度非常大，同时改成C++，通用性差，你可能发现编译华为的第三方编译工具比编译数据库还麻烦。当然编译数据库方便是因为数据库是从PostgreSQL中继承过来的。

openGauss把原生的psql命令改名为gsql，gsql需要加参数“-r”才能支持上下翻命令和自动补全。原先使用oracle时，oracle的sqlplus就不支持这些功能被一堆人吐槽，后来用rlwrap勉强好一些了。当转到PostgreSQL后，psql的命令自动补全功能让DBA幸福满满的。当初学者不知道“-r”参数时，一用openGauss又回到了Oracle的sqlplus时代。

openGauss目前对插件的支持不好，原生的PostgreSQL可以使用很多的插件，也吸引了很多开发者开发插件。而openGauss的“CREATE EXTENSION”还处于内部支持的阶段。目前可以勉强支持PostGIS。当然openGauss把一些常用的插件内置在数据库内部了，缓解了此问题。

openGauss不支持表继承，同时把原生PostgreSQL中的一些非常有用的工具都给去掉了，如pg\_waldump（或pg\_xlogdump）、pg\_receivewal。

openGauss相对于PostgreSQL数据库来说臃肿一些，在openGauss2.0版本之前内存至少要8GB，小了根本启动不了，2.0版本之后这一块有比较大的改进，小内存也可以启动了。原生PostgreSQL主程序小于10MB，而openGauss则为100MB：

```
[root@pg01 ~]# ls -l /usr/pgsql-12/bin/postgres
-rwxr-xr-x 1 root root 7731856 Aug 12  2020 /usr/pgsql-12/bin/postgres
[root@pg01 ~]#
[gauss@pgtrain bin]$ ls -l gaussdb
-rwxr-xr-x 1 gauss gauss 102432784 Jun  2 19:45 gaussdb
```

openGauss比较大的问题是很多地方对PostgreSQL做了改动，感觉有些为了改动而改动，导致与很多PostgreSQL生态的软件不能兼容，这对于使用者是一个很大的问题。

当然最大的硬伤是文档不足。openGauss对PostgreSQL做了很多的一些改变，却没有提供文档或提供的文档不全，openGauss的官方文档基本是一个残次品，如官方文档中居然没有搭建备库的说明，安装手册中提供的卸载方法是用gs\_uninstall命令，但极简版根本没有gs\_uninstall命令，实际上极简版很多命令都没有，文档中对此无任何提示，这一点很让人无语。所以openGauss的文档比较原生的PostgreSQL基本是一个天上一个地上，比一些其它的著名开源软件如VUE、element-ui的文档也根本没法比，与tidb的文档相比也是差的非常远。希望openGauss社区重视文档，让文档的质量上一个台阶。

