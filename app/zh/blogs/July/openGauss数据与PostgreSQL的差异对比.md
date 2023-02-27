---
title: 'openGauss数据与PostgreSQL的差异对比'

date: '2021-08-21'

category: 'blog'
tags: ['openGauss数据与PostgreSQL的差异对比']

archives: '2021-08'

author: 'Walrus'

summary: 'openGauss数据与PostgreSQL的差异对比'

img: '/zh/blogs/July/title/img3.png'

times: '12:30'
---

# **openGauss 数据与 PostgreSQL 的差异对比**<a name="ZH-CN_TOPIC_0000001127317632"></a>

## 1. 前言<a name="section34511110143014"></a>

openGauss 数据库已经发布 2.0.1 版本了，中启乘数科技是一家专业的专注于极致性能的数据库服务提供商，所以也关注 openGauss 数据库的特性。因为 openGauss 是从 PostgreSQL 发展出来的，所以我们详细讲解对比一下 openGauss 与原生 PostgreSQL 数据库的对比。

## 2. openGauss 大功能方面的变化<a name="section14276101713015"></a>

openGauss 是基于 PostgreSQL9.2 版本开发的，基本包括了 PostgreSQL9.4 的功能。目前 PostgreSQL 正式版本已经到 13 了， 14 的 beta 版本也发布了。openGauss 只把 PostgreSQL9.4 之后的新版本的极少数功能移植进来了，绝大多数功能都没有纳入。

openGauss 最大的变化就是把 PostgreSQL 的进程模式改成了线程模式，当然这两个模式其实各有优缺点。线程模式对短连接有优势，比进程模式的数据库可以承担更大的并发短请求，但线程模式也有明显的缺点，所有的线程共享内存，如果一个线程的的野指针把别人的内存改了，不会报错，一时半会可能还发现不了，极端情况下会导致数据损坏而不被发现。所以说这个改变不能说有什么明显的好处，某些情况下可能还是一个退步。为了改成线程模式，openGauss 的把 C 语言的源代码改成了 C++。C++的好处是容易封装，坏处是移植性降低了。

当然 openGauss 增加了线程池的功能，目前还不清楚这个功能是否稳定可靠。如果稳定可靠可以不使用第三方的连接池工具了。

openGauss 另一个变化是把事务 ID\(XID\)从 32bit 改成了 64bit，64bit 的 xid 的好处是永远不可能耗尽，好处是我们永远不用担心会发生 xid 回卷宕机的风险。注意，虽然 xid 改为了 64bit，但是过期的事务 ID 依旧需要清理。实际上 PostgreSQL 数据库默认达到 2 亿事务就强制整理，而 32bit 的 xid 可以达到 20 亿，所以我们实际上可以修改 autovacuum_freeze_max_age 为 10 亿来推迟对 xid 的整理。

我们知道磁盘扇区大小是 512 字节，一些 SSD 可以是 4k 大小，而数据库一般是 8k/16k/32k，一个数据库数据块刷到操作系统的过程中可能发生宕机造成这样有块断裂问题，即块中一半是新数据，另一半还是旧数据，这就是块的逻辑损坏，这可能导致数据库无法启动。

MySQL 通过双写 double write 来解决这个问题，PostgreSQL 是通过 full_page_write 来解决这个问题，就是在数据页第一次发生变更的时候将整个页面记录到 xlog 日志中，这样出了问题就有了完整的数据页加 xlog 日志进行恢复，这样做的缺点是大大增加了 xlog 的日志量，也对性能有一定影响。当然我们可以通过延长 checkpoint 的间隔时间来缓解这个问题。而 openGauss 实现了类似 MySQL 的双写，写数据块的同时将脏页也写到一个共享的双写空间里，如果发生问题会从双写空间里找到完整的数据页进行恢复。双写特性参数 enable_double_write 需要配合增量检查点一起使用。openGauss 这个功能有一定的实际价值。

openGauss 主备库的模式与 PostgreSQL 有比较大的不同，PostgreSQL 的备库模式是拉的模式，即备库主动到主库上拉 WAL 日志，而 openGauss 改成了推的模式，推的模式是主库主动把 WAL 模式推到备库。而实际上改成这样，导致搭建备库更不方便了，因为搭建备库时必须到主库上修改参数 replconninfo1 或 replconninfo2，即 replconninfoN, N=1\~8，而可以配置的参数只有 8 个，所以感觉 openGauss 后面最多只能挂 8 个备库。当年从 Oracle 转到 PostgreSQL 上时，还比较庆幸不用动主库了，一用 openGauss 感觉又回到了解放前。

openGauss 内置的了主备库切换功能，让使用者用起来更方便。但这个功能是和数据库本身紧耦合的，同时不太稳定。笔者在测试中，备库就报从主库中断开了，报大量的日志把空间给撑爆了：

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

openGauss 摒除 recovery.conf 文件。当然 PostgreSQL12 的版本也是摒除 recovery.conf 文件。openGauss 是启动数据库是指定是备库还是主库：

```
gs_ctl start -D $GAUSSHOME/data/master -M standby
```

这个改变实际上是一个非常糟糕的改变，如果 DBA 忘加了“-M standby”，这个备库就废掉了，需要重新搭建。而原生 PostgreSQL 是建立了一个文件来指示这个数据库是主库还是备库，不会有这种误操作的风险。好在 openGauss 提供了 gs_ctl build 命令重新搭建备库，部分缓解了这个问题。

openGauss 有一个最大可用模式 most_available_sync，openGauss 认为原生 PostgreSQL 的流复制有一个痛点就是在一主一备的同步模式下，如果备库宕机，主库会 hang，同步模式不会自动降级。所以 openGauss 设计了最大可用模式，即开启该参数后在主从连接正常的情况下处于同步模式，如果备机断连会立刻切为异步模式，如果备机再次启动会自动连接并切为同步模式。但实际上这种设计是一种奇怪的设计，如果出现问题立即降级，那么与异步模式有什么区别？同步模式本身就是要保证故障切换后不丢失数据，当故障时主库立即降级了，这时再切换了，直接就丢失数据了。如果允许丢数据，直接使用异步复制就可以了，如果需要不丢数据，使用同步模式，如果一个备库坏了主库也不 hang，那么就做两个备库的同步模式，这个 most_available_sync 模式感觉不太实用。

openGauss 支持了列存表，列存表支持压缩。列存表使用中需要注意膨胀的一些问题，如果了解不深，建议不要使用。

openGauss 在每个库下面会默认有个叫 dbe_perf 的 schema，这个 schema 下有有几百个性能视图，这些视图大部分 pg 里面都有，但是放在单独的 schema 中方便查看和管理，这个设计还不错。

openGauss 中实现了 xlog 预分配，在 xlog 未写满时就分配下面一个或者几个 xlog。网上有人说 PostgreSQL 不能预分配 WAL，这是错误的认识，实际上 PostgreSQL 是可以把原先使用的 WAL 日志改名成预分配的 WAL 日志的，参数 min_wal_size 就是指定了需要预先预留的 WAL 文件数，这个参数默认是 80MB，这个值对于一些需要灌大量数据的数据库来说，有点小了，可以把此值改大。

openGauss 实现了增量 checkpoint，官方称让数据库更平滑。

openGauss 实现了并行恢复，默认是关闭的。

由于 openGauss 的物理备库也会建复制槽，为了防止备库把主库的空间撑爆，openGauss 又增加了两个参数：enable_xlog_prune 和 max_size_for_xlog_prune，允许删除掉过多的 WAL 日志防止把主库撑爆：

```
postgres=# show max_size_for_xlog_prune;
 max_size_for_xlog_prune
-------------------------
 2147483647kB
(1 row)
```

但默认 max_size_for_xlog_prune 设置的比较大，起不到保护作用。

openGauss 支持与 oracle 使用方法基本相同的定时任务 dbms_job。

openGauss 有初步的逻辑解码功能，但不如 PostgreSQL 完善。没有完整的 PostgreSQL 的逻辑复制功能。

openGauss 的索引支持比新版本的 PostgreSQL 弱一些，如不支持 brin 索引，PostgreSQL 新版本对 Btree 索引有比较大的优化，这一块 openGauss 也有一些缺失，也没有布隆过滤器的功能。

## 3. openGauss 一些硬伤<a name="section13205591319"></a>

首先是不支持并行。这也很好理解，PostgreSQL 是从 9.6 开始支持并行了，而 openGauss 是基于 PostgreSQL9.4 的。目前 PostgreSQL 有强大的并行功能。目前不清楚 openGauss 什么时候可以支持并行。

编译过于复杂，依赖过多：编译需要很多依赖，而且版本固定，造成跨平台编译的难度非常大，同时改成 C++，通用性差，你可能发现编译华为的第三方编译工具比编译数据库还麻烦。当然编译数据库方便是因为数据库是从 PostgreSQL 中继承过来的。

openGauss 把原生的 psql 命令改名为 gsql，gsql 需要加参数“-r”才能支持上下翻命令和自动补全。原先使用 oracle 时，oracle 的 sqlplus 就不支持这些功能被一堆人吐槽，后来用 rlwrap 勉强好一些了。当转到 PostgreSQL 后，psql 的命令自动补全功能让 DBA 幸福满满的。当初学者不知道“-r”参数时，一用 openGauss 又回到了 Oracle 的 sqlplus 时代。

openGauss 目前对插件的支持不好，原生的 PostgreSQL 可以使用很多的插件，也吸引了很多开发者开发插件。而 openGauss 的“CREATE EXTENSION”还处于内部支持的阶段。目前可以勉强支持 PostGIS。当然 openGauss 把一些常用的插件内置在数据库内部了，缓解了此问题。

openGauss 不支持表继承，同时把原生 PostgreSQL 中的一些非常有用的工具都给去掉了，如 pg_waldump（或 pg_xlogdump）、pg_receivewal。

openGauss 相对于 PostgreSQL 数据库来说臃肿一些，在 openGauss2.0 版本之前内存至少要 8GB，小了根本启动不了，2.0 版本之后这一块有比较大的改进，小内存也可以启动了。原生 PostgreSQL 主程序小于 10MB，而 openGauss 则为 100MB：

```
[root@pg01 ~]# ls -l /usr/pgsql-12/bin/postgres
-rwxr-xr-x 1 root root 7731856 Aug 12  2020 /usr/pgsql-12/bin/postgres
[root@pg01 ~]#
[gauss@pgtrain bin]$ ls -l gaussdb
-rwxr-xr-x 1 gauss gauss 102432784 Jun  2 19:45 gaussdb
```

openGauss 比较大的问题是很多地方对 PostgreSQL 做了改动，感觉有些为了改动而改动，导致与很多 PostgreSQL 生态的软件不能兼容，这对于使用者是一个很大的问题。

当然最大的硬伤是文档不足。openGauss 对 PostgreSQL 做了很多的一些改变，却没有提供文档或提供的文档不全，openGauss 的官方文档基本是一个残次品，如官方文档中居然没有搭建备库的说明，安装手册中提供的卸载方法是用 gs_uninstall 命令，但极简版根本没有 gs_uninstall 命令，实际上极简版很多命令都没有，文档中对此无任何提示，这一点很让人无语。所以 openGauss 的文档比较原生的 PostgreSQL 基本是一个天上一个地上，比一些其它的著名开源软件如 VUE、element-ui 的文档也根本没法比，与 tidb 的文档相比也是差的非常远。希望 openGauss 社区重视文档，让文档的质量上一个台阶。
