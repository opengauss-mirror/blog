+++

title = "openGauss与PostgreSQL的对比" 

date = "2020-11-27" 

tags = ["openGauss与PG对比"] 

archives = "2020-11" 

author = "数据库架构之美" 

summary = "openGauss与PostgreSQL的对比"

img = "/zh/post/shujukujiagouzhimei/title/img34.png" 

times = "17:30"

+++

# openGauss与PostgreSQL的对比<a name="ZH-CN_TOPIC_0293240562"></a>

华为公司今年6.30开源了openGauss数据库，openGauss数据库内核基于postgresql9.2.4演进而来，pg11.3版本数据库中共有290个数据库参数，而openGauss目前有515个数据库参数，每个参数对应一个数据库内核功能，所以可以看到华为公司对pg的内核还是做了非常大的改造和增强。

这篇文章对比了openGauss数据库相比pg做了哪些增强和相比pg的不足之处，本文只列举一些较大的增强。

## 内核增强<a name="section191401257132216"></a>

**1.最大可用模式most\_available\_sync**

pg流复制一直有个痛点就是在一主一从同步模式下，如果备库宕机，主库会hang，同步模式不会自动降级，需要依靠第三方工具进行判断和监控，或者使用一主多备quorum的方式来防止备库异常对主库的影响。openGauss中支持了最大可用模式，开启该参数后在主从连接正常的情况下处于同步模式，如果备机断连会立刻切为异步模式，如果备机再次启动会自动连接并切为同步模式。这个降级切换时间非常快，切换过程甚至不会hang，而且没有超时窗口参数来进行设置，这一点是个不足的地方。

**2.xid不可耗尽**

这个大家都知道了，openGauss将transactionid由int32改为了int64,64位的xid永远不可能耗尽，虽然xid改为了64位，但是过期的xid依旧需要freeze清理，只是永远不用担心会发生xid回卷宕机的风险。

**3.流复制环境自动创建物理复制槽**

openGauss中搭建主从流复制环境后会默认自动创建一个slot\_name为对端nodename的物理复制槽，为了防住备库需要的xlog被主库删除或清理。

**4.增量检查点**

openGauss支持了增量检查点，通过enable\_incremental\_checkpoint参数开启。Pg中的检查点执行时会将buffer中所有的脏页刷到磁盘，需要在checkpoint\_timeout\*checkpoint\_completion\_target时间内完成刷脏页动作。刷脏对数据库是消耗非常大的动作，高斯中的增量检查点会小批量的分阶段的滚筒式的去进行脏页刷盘，同时更新lsn信息，回收不需要的xlog日志。

**5.双写double write**

我们知道操作系统数据块是4k，数据库一般是8k/16k/32k，这样有可能造成页面断裂问题，一个数据库数据块刷到操作系统的过程中可能发生宕机造成块损坏数据库无法启动。mysql通过双写double write来解决这个问题，oracle不管这个问题，出了事情通过rman或者dg备库来恢复，pg通过full\_page\_write来解决这个问题，就是在数据页第一次发生变更的时候将整个页面记录到xlog日志中，这样出了问题就有了完整的数据页加xlog日志进行恢复，但是这样带来的问题就是大大增加了xlog的日志量，也对性能有一定影响。openGauss实现了类似mysql的双写，写数据块的同时将脏页也写到一个共享的双写空间里，如果发生问题会从双写空间里找到完整的数据页进行恢复。双写特性参数enable\_double\_write需要配合增量检查点一起使用。

**6.客户端密码认证增强**

pg默认的密码加密算法为md5，openGauss增强为sha256，该功能需要配合客户端改造才能兼容。

**7.xlog预分配**

pg中的xlog日志是在写满后才会分配下一个日志，这样带来的问题是在操作系统写一个16M的xlog日志时会有等待，那时候可能会卡一下，这也是为什么pg在做并发insert测试的时候性能抖动的原因。openGauss中实现了xlog预分配，在xlog未写满时就分配下面一个或者几个xlog，经压测性能较稳定。

**8.流复制线程连接认证**

openGauss中主备的复制线程要连接对端服务器时默认需要进行ssl认证，pg是不需要的，增强了安全，可以通过将remote\_read\_mode设置为non\_authentication关闭认证（如果不关闭就需要配置相关ca证书密钥，否则以-M primary/standby方式启动数据库会失败）。

**9.dbe\_perf性能监控schema**

openGauss在每个库下面会默认存在一个dbe\_perf的性能监控视图，类似mysql的performance\_schema，里面有几百个性能视图，虽然这些视图大部分pg里面都有，但是单独做到一个schema里方便查看和管理。

**10.流复制环境主库归档xlog数量最大值限制**

xlog最大值的硬限制，通过max\_size\_for\_xlog\_prune参数控制，他不管xlog的删除会不会影响备机，只要超过该值就进行删除。可以防止主备长期断连造成主库目录爆掉。

**11.public schema安全权限增强**

openGauss将每个数据库下的默认的public schema做了安全增强，默认普通用户没有权限在public下创建对象，需要进行授权。不敢说这个是不是改进，因为既然叫public，就是给大家用的。

**12.摒除recovery.conf文件**

使用replconninfo配置主备连接信息，application\_name等相关配置并入postgresql.conf，简化流程，方便主备进行来回切换，pg12的流复制也摒弃了recovery.conf文件。

**13.基于数据页的复制**

openGauss支持基于redo的复制、基于数据页的复制以及两种混合复制，通过enable\_data\_replicate和enable\_mix\_replication参数进行控制。

**14.支持列存表，列存缓冲区**

openGauss支持了列存表，通过cstore\_buffers控制列存缓冲区大小，列存表支持压缩。并且当前版本的高斯优化了列存表的并发插入性能，解决了插入时一行数据占一个cu造成空间急剧膨胀的问题。通过开启enable\_delta\_store参数控制列存表的插入使用临时表向主表merge的方式进行，既保证了性能，也解决了膨胀的问题。

**15.内存表**

支持基于llvm的内存查询引擎，支持高吞吐、低延迟访问。

**16.NUMA架构优化**

通过numa绑核，减少跨核内存访问的时延问题，提升CPU利用率，提升多线程间同步性能，xlog日志批量插入，热点数据分散处理。

**17.用户资源管理**

支持多租户环境下的cpu内存限制，配置资源池，调用操作系统cgroup实现。

**18.wdr报告**

支持类似oracle awr性能报告。

**19.内存池memorypool**

在更上一层管理数据库内存使用，限制一个数据库节点可用的最大物理内存。

**20.查询内存限制query\_mem**

可以对某个查询使用的内存进行限制。

**21.异步直接io**

开启磁盘预分配，io预取，提升写入性能。

**22.列存表delta merge性能增强**

开启enable\_delta\_store参数控制列存表的插入使用临时表向主表merge，提升性能，解决膨胀。

**23.并行回放**

支持备机并行回放日志，提高复制性能。

**24.会话超时**

Session\_timeout参数控制会话超时时间，防止由于线程长期不释放造成数据库意外宕机。

**25.主备从与一主多备**

除了支持一主多备模式，也支持主备从模式，主备机直接物理复制，从机默认没有数据，当主库宕，备机和从机组成新的复制关系，从机开始复制数据，这样节省了空间的同时保证了高可用。

**26.线程池**

进程模型改为线程模型，线程池支持上万的并发，通过线程池实现session和thread之间的解耦，提高线程的利用率，高并发下不会导致线程的频繁切换。

**27.commit log由256k改为16M**

为了配合64位xid。

## 正视不足<a name="section9855151719312"></a>

**1.pg\_stat\_replication视图丢失**

pg中查看复制状态的基本视图被丢掉了，虽然使用gs\_ctl query命令也可以复制状态，但是pg\_stat\_replication还可以查看主从lag信息，高斯中无法查询。

**2.编译过于复杂，依赖过多**

编译需要很多依赖，而且版本固定，造成跨平台编译难度很大，平台通用性差，你可能发现编译华为的第三方编译工具比编译数据库还麻烦。

**3.不支持并行**

目前高斯还不支持并行，希望后续引入pg9.6开始支持的并行功能。

**4.没有postgresql.auto.conf**

无法使用alter system set配置相关参数。

**5.不支持pitr**

目前还不支持基于时间点的恢复，据说830版本会支持。

**6.不支持插件**

这是一个极大的劣势，pg良好的扩展性在于他支持插件，吸引了很多开发者开发基于pg的插件，而openGauss中已经不支持插件。

**7.社区刚刚起步，参与度不高**

openGauss社区刚刚起步，目前活跃度不高，希望未来越来越好吧，也希望高斯中的优秀特性也能被pg吸收。

**8.周边工具**

高可用工具、数据同步工具不具备。

**9.性能与原生pg存在差距**

使用并发工具压测数据库代码速度发现与原生pg存在差距，同时目前不支持并行，所以分析类场景也有不足。

**8.copydir限制**

openGauss中将数据库数据导入目录限制到数据目录下的pg\_copydir中，这个是很不人性化的设计，试想生产环境需要导数，需要先拷贝到数据目录下，容易造成数据目录满。

