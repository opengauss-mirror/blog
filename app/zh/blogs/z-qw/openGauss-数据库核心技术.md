---
title: 'openGauss社区入门（openGauss-数据库核心技术）'

date: '2022-09-16'

tags: ['openGauss社区开发入门']

archives: '2022-09'
category: 'blog'
author: 'z-qw'

summary: 'openGauss社区开发入门'

img: '/zh/post/z-qw/title/title.jpg'

times: '23:00'
---

## 系统架构

openGauss 是单机系统，在这样的系统架构中，业务数据存储在单个物理节点上，数据访问任务被推送到服务节点执行，通过服务器的高并发，实现对数据处理的快速响应。同时通过日志复制可以把数据复制到备机，提供数据的高可靠和读扩展。

## 软件架构

openGauss 是单机系统，支持主备部署。 OM：运维管理模块（Operation Manager）。提供数据库日常运维、配置管理的管理接口、工具。 客户端驱动：客户端驱动（Client Driver）。负责接收来自应用的访问请求，并向应用返回执行结果。客户端驱动负责与 openGauss 实例通信，发送应用的 SQL 命令，接收 openGauss 实例的执行结果。 openGauss（主备）：openGauss 主备（Datanode）。负责存储业务数据、执行数据查询任务以及向客户端返回执行结果。openGauss 实例包含主、备两种类型，支持一主多备。建议将主、备 openGauss 实例分散部署在不同的物理节点中。 Storage：服务器的本地存储资源，持久化存储数据。

## 线程管理

### 1.**业务处理线程**

业务处理线程负责处理客户端请求的任务，当客户端发送连接请求给 postmaster 管理线程后，postmaster 线程会分配相应的业务处理子线程(命名为 gaussdb)给客户端使用，后面该客户端的请求和操作由该业务处理子线程负责。当业务处理子线程接收到前端发送过来的查询(SQL)后，会使用 openGauss 的 SQL 引擎对 SQL 语句进行词法解析、语法解析、语义解析、查询重写等处理操作，然后使用查询优化器生成最小代价的查询路径计划。SQL 执行器会按照已制定的最优执行计划对 SQL 语句进行执行，并将执行结果反馈给客户端。

### 2.**日志写线程**

日志写线程在 openGauss 中被命名为 WalWriter 线程。该线程负责将内存中的预写日志(WAL)页数据刷新到预写日志文件中，确保那些已提交的事务都被永久记录，不会丢失。 预写日志(WAL)和主流数据库中常见的重做日志功能类似，里面记录了 openGauss 数据文件的变更操作，数据库在执行 SQL 操作时会先将这些变更操作记录在预写日志文件中，然后才定期刷数据至数据文件中。 日志写线程在 postmaster 线程启动后就会启动，当这个线程的刷盘频率无法满足系统需求时，其他常规的后端线程仍然有权限执行预写日志页的刷盘操作。如果日志写线程意外崩溃，则 Postmaster 线程会认为整个 openGauss 后端线程崩溃，此时将调用 SIGQUIT 强制关闭所有后端线程，重置共享内存以恢复后端线程。

### 3.数据页写线程

数据页写线程在 openGauss 数据库中应该包含两个线程：PageWriter 和 BgWriter。 操作系统数据块大小一般是 4k，数据库一般是 8k/16k/32k，openGauss 默认是 8kb，这样就有可能造成页面断裂问题，一个数据库数据块刷到操作系统的过程中可能发生因宕机而造成块损坏从而导致数据库无法启动的问题。pagewriter 线程负责将脏页数据拷贝至双写(double-writer)区域并落盘，然后将脏页转发给 bgwriter 子线程进行数据下盘操作，这样可以防止该现象的发生，因为如果发生数据页”折断”的问题，就会从双写空间里找到完整的数据页进行恢复。 bgwriter 线程(BgWriter)主要负责对共享缓冲区的脏页数据进行下盘操作，目的是让数据库线程在进行用户查询时可以很少或者几乎不等待写动作的发生（写动作由后端写线程完成）。这样的机制同样也减少了检查点造成的性能下降。后端写线程将持续的把脏页面刷新到磁盘上，所以在检查点到来的时候，只有少量页面需要刷新到磁盘上。但是这样还是增加了 I/O 的总净负荷，因为以前的检查点间隔里，一个重复弄脏的页面可能只会冲刷一次，而现在一个检查点间隔内，后端写进程可能会写好几次。但在大多数情况下，连续的低负荷要比周期性的尖峰负荷好一些，毕竟数据库稳定十分重要。 如果 bgwriter 的刷盘操作不能保证数据库拥有充足的可用共享缓冲区，那么常规的后端线程仍然有权发出刷盘操作。 bgwriter 线程也是随着 Postmaster 线程启动而启动，我们在执行 recovery 操作的时候也会启动该线程。Postmaster 线程可以调用 SIGTERM 正常关闭，也可以调用 SIGQUIT 强制关闭。如果 bgwriter 线程意外崩溃，则 Postmaster 线程会认为整个 openGauss 后端线程崩溃，此时将调用 SIGQUIT 强制关闭所有后端线程，重置共享内存以恢复后端线程。

### 4.检查点线程

检查点线程(Checkpointer)一般会周期性的发起数据库检查点，检查点(CHECKPOINT)是一个事务日志中的点，所有数据文件都在这个点被更新，然后将数据脏页刷新到磁盘的数据文件中，确保数据库一致。 当数据库从崩溃状态恢复后，已经做过 checkpoint 的更改就不再需要从预写日志中恢复，这大大加快了数据库系统 crash 后的恢复速度。 openGauss 的检查点有全量检查点和增量检查点。增量检查点开关打开的时候将不再使用 full_page_writes 防止页面折断，而是依赖双(double-writer)特性保护，当增量检查点打开后会小批量分阶段的滚筒式进行脏页刷盘，同时更新 lsn 信息，回收不需要的 xlog 日志。

### 5.统计线程

统计线程在 openGauss 数据库中被命名为 StatCollector，该线程负责统计 openGauss 数据库的信息，这些信息包括：物理硬件资源使用信息、对象属性及使用信息、SQL 运行信息、会话信息、锁信息、线程信息等，并且将这些收集到的统计信息保存在 pgstat.stat 文件中。这些统计信息经常被用来做性能分析、故障分析、健康检查和状态监控等。

### 6.日志发送线程和日志接收线程

日志发送线程在 openGauss 中被命名为 WalSender，这个线程主要是在 openGauss 主备环境中，主节点上运行，发送预写日志给备节点。 日志接收线程在 openGauss 中被命名为 WalReceiver，这个线程主要是在 openGauss 主备环境中，备节点上运行，接收预写日志记录。说到主备，还有以下几个线程：

- 主备通讯线程(RemoteSrv)
- 日志下盘线程(WalRcvWriter) ：将接收到的 WAL records 刷新到备机的 WAL 日志里
- 并行恢复线程(ParallelRecov) ：读取 WAL 日志内容，在备机进行并行恢复
- 集群心跳监测线程(Heartbeater)

### 7.清理线程

openGauss 默认使用 MVCC(Multi-Version Concurrency Control)保证事务的原子性和隔离性。而 MVCC 机制使得数据库的更新和删除记录实际不会被立即删除并释放存储空间，而是标记为历史快照版本，openGauss 使用 MVCC 机制和这些历史快照实现数据的读写不冲突。但是这样会使得操作频繁的表积累大量的过期数据，占用磁盘空间，当扫描查询数据时，需要更多的 IO 消耗，降低查询效率。所以需要一个线程对这些过期数据进行清理，并回收存储空间。 autovacuum 线程就是这个后台清理线程，负责回收表或 B-Tree 索引中已经删除的行所占据的存储空间，这个线程也是由一个发起线程和一个执行线程组成，在 openGauss 中分别被命名为 AutoVacLauncher 和 AutoVacWorker。 当 autovacuum 参数打开后，AutoVacLauncher 线程会由 Postmaster 线程启动，并且会不断地将数据库需要做 vacuum 的对象信息保存在共享内存中，当表上被删除或更新的记录数超过设定的阈值( 表中(update,delte 记录) >= autovacuum_vacuum_scale_factor\* reltuples(表上记录数) + autovacuum_vacuum_threshold ) 时，调用 AutoVacWorker 线程对这个表的存储空间执行回收清理工作。 当需要发起数据库 vacuum 的时候，AutoVacLauncher 线程会在共享内存设置相应的 flag，然后发送信号给 Postmaster 线程，postmaster 线程收到信号后，只知道需要启动一个 AutoVacWorker 子线程连接共享内存，AutoVacWorker 子线程将从共享内存获取待清理的任务信息，并执行对象的清理回收工作。

### 8.归档线程

归档线程在 openGauss 数据库中被命名为 WalWriter，当数据库归档周期(archive_timeout)到达的时候，由 postmaster 调用归档线程(WalWriter)，强制切换预写日志，并执行归档操作。

### 9.管理线程

管理线程也就是指 postmaster 线程，在 openGauss 中被命名为 GaussMaster。 管理线程可以看作是一个消息转发中心，比如说，前端程序发送一个启动信息给管理线程，管理线程根据收到的信息会立即 fork()一个子线程，这个子线程对请求进行身份验证成功后成为后端线程。 管理线程也会参与操作系统方面的操作，比如，启停数据库。但其本身不参与 openGauss 数据库内的基本操作，它只是在必要的时刻启动相应的子线程去完成操作，当某些后台线程 Crash 掉后，管理线程还会负责重置该线程。 管理线程在启动时会创建共享内存和信号量池，但原则上是不会干涉它们。另外，它也不是后端 PGPROC 数组的成员，因此它不参与锁管理器操作也不做共享内存的操作，这样会使其更简单、更可靠。 管理线程几乎都是通过重置共享内存使得单个后端线程从崩溃中恢复过来，如果它对共享内存也做大量操作，那么它很容易与后端线程一起崩溃。

## 参考文档

1.[https://www.bookstack.cn/read/openGauss-2.1-zh/Description-%E7%B3%BB%E7%BB%9F%E6%9E%B6%E6%9E%84.md](https://www.bookstack.cn/read/openGauss-2.1-zh/Description-%E7%B3%BB%E7%BB%9F%E6%9E%B6%E6%9E%84.md) 2.[https://zhuanlan.zhihu.com/p/365418014](https://zhuanlan.zhihu.com/p/365418014) 3.[https://blog.csdn.net/a1114906894/article/details/119492523](https://blog.csdn.net/a1114906894/article/details/119492523)
