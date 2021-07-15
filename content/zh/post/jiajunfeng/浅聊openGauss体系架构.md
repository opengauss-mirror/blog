+++

title = "浅聊openGauss体系架构" 

date = "2021-04-19" 

tags = ["openGauss安装部署"] 

archives = "2021-06" 

author = "贾军锋" 

summary = "浅聊openGauss体系架构"

img = "/zh/post/jiajunfeng/title/img33.png" 

times = "15:30"

+++

# **浅聊openGauss体系架构**<a name="ZH-CN_TOPIC_0000001142142053"></a>

2020年7月openGauss刚刚开源，我便开始对openGauss数据库的学习。根据以往学习数据库的经验，最先想了解的是openGauss数据库的架构，希望对即将使用的数据库各个模块有所了解。但鉴于时间有限，仅有的资料图是源码doc目录内的“openGauss逻辑结构图”，便针对该图做了简单介绍，并形成文档[《浅聊openGauss逻辑架构》](https://www.modb.pro/db/41842)，感兴趣的小伙伴可以参考。

虽然已发表关于openGauss逻辑架构介绍的文章供大家参考，但总感觉缺少点什么\(想念学习Oracle时的那张体系架构图\)。今年初准备培训资料时参考相关资料绘制了一份简易的openGauss体系架构图，后来因为忙于其他工作，把这个事情忘记了。借着本次墨天轮举办的“我的国产数据库之路”，使我重新想起了这件事情，希望将这张图和相关介绍分享出来供大家参考。

**说明：**  本文内容仅代表个人观点。

![](figures/20210616-ec5e1c95-e663-4973-9626-e1d4316db95b.png)

## **一、首先了解一下架构图中的Instance部分**<a name="section642104513523"></a>

学习过Oracle等主流数据库的小伙伴都清楚，Instance部分其实主要指的是数据库运行时的内存部分。    openGauss属于单进程多线程模型的数据库，客户端可以使用JDBC/ODBC/Libpq/Psycopg等驱动程序，向openGauss的后端管理线程GaussMaster发起连接请求。

**补充知识点：**

-   **JDBC**

    JDBC\(Java Database Connectivity，Java数据库连接\)是一种用于执行SQL语句的Java API，可以为多种关系数据库提供统一访问接口，应用程序可基于它操作数据。openGauss库提供了对JDBC 4.0特性的支持，需要使用JDK1.8版本编译程序代码，不支持JDBC桥接ODBC方式。

-   **ODBC**

    ODBC\(Open Database Connectivity，开放数据库互连\)是由Microsoft公司基于X/OPEN CLI提出的用于访问数据库的应用程序编程接口。应用程序通过ODBC提供的API与数据库进行交互，增强了应用程序的可移植性、扩展性和可维护性。openGauss目前提供对ODBC 3.5的支持。但需要注意的是，当前数据库ODBC驱动基于开源版本，对于tinyint、smalldatetime、nvarchar2类型，在获取数据类型的时候，可能会出现不兼容。

-   **Libpq**

    Libpq是openGauss的C语言程序接口。 客户端应用程序可以通过Libpq向openGauss后端服务进程发送查询请求并且获得返回的结果。需要注意的是，在官方文档中提到，openGauss没有对这个接口在应用程序开发场景下的使用做验证，不推荐用户使用这个接口做应用程序开发，建议用户使用ODBC或JDBC接口来替代。

-   **Psycopg**

    Psycopg可以为openGauss数据库提供统一的Python访问接口，用于执行SQL语句。openGauss数据库支持Psycopg2特性，Psycopg2是对libpq的封装，主要使用C语言实现，既高效又安全。它具有客户端游标和服务器端游标、异步通信和通知、支持“COPY TO/COPY FROM”功能。支持多种类型Python开箱即用，适配PostgreSQL数据类型；通过灵活的对象适配系统，可以扩展和定制适配。Psycopg2兼容Unicode和Python 3。


当  **GaussMaster**  线程接收到客户端程序发送过来的服务请求后，会根据收到的信息会立即fork\(\)一个子线程，这个子线程对请求进行身份验证成功后成为对应的后端业务处理子线程\(  **gaussdb**  \)。之后该客户端发送的请求将由此业务处理子线程\(gaussdb\)负责处理。当业务处理子线程\(gaussdb\)接收到客户端发送过来的查询\(SQL\)后，会调用openGauss的SQL引擎对SQL语句进行词法解析、语法解析、语义解析、查询重写等处理操作，然后使用查询优化器生成最小代价的查询路径计划。之后，SQL执行器会按照已制定的最优执行计划对SQL语句进行执行，并将执行结果反馈给客户端。

在SQL执行器的执行过程中通常会先访问内存的共享缓冲区\(如：shared buffer、cstore buffer、MOT等\)，内存共享缓冲区缓存数据库常被访问的索引、表数据、执行计划等内容， 共享缓冲区的高速RAM硬件，为SQL的执行提供了高效的运行环境，大幅减少了磁盘IO，极大地提升了数据库性能，是数据库非常重要的组件之一。

**如图所示：**

-   **shared buffer**  是行存引擎默认使用的缓冲区，openGauss的行存引擎是将表按行存储到硬盘分区上，采用MVCC多版本并发控制，事务之间读写互不冲突，有着很好的并发性能，适合于OLTP场景。
-   **cstore buffers**  是列存引擎默认使用的缓冲区，列存引擎将整个表按照不同列划分为若干个CU\(Compression Unit,压缩单元\)，以CU为单位进行管理，适合于OLAP场景。
-   **MOT**  是内存引擎默认使用的缓冲区，openGauss的MOT内存引擎的索引结构以及整体的数据组织都是基于Masstree模型实现的，其乐观并发控制和高效的缓存块利用率使得openGauss可以充分发挥内存的性能，同时，在确保高性能的前提下，内存引擎有着与openGauss原有机制相兼容的并行持久化和检查点能力\(CALC逻辑一致性异步检查点\)，确保数据的永久存储，适合于高吞吐低时延的业务处理场景。

SQL执行器在共享缓冲区中对数据页的操作会被记录到  **WAL buffer**  中，当客户端发起事务的commit请求时，WAL buffer的内容将被WalWriter线程刷新到磁盘并保存在WAL日志文件中，确保那些已提交的事务都被永久记录，不会丢失。    但需要注意的是，当walwriter的写操作跟不上时数据库实际的需求时，常规后端线程仍然有权进行WAL日志的刷盘动作。这意味着WALWriter不是一个必要的进程，可以在请求时快速关闭。

-   **maintenance\_work\_mem**  一般是在openGauss执行维护性操作时使用，如：VACUUM、CREATE INDEX、ALTER TABLE ADD FOREIGN KEY等操作，maintenance\_work\_mem内存区域的大小决定了维护操作的执行效率。
-   **temp\_buffer**  是每个数据库会话使用的LOCAL临时缓冲区，主要缓存会话所访问的临时表数据。需要注意的是，openGauss支持全局临时表和会话级临时表，全局临时表的表定义是全局的，而临时表的数据是各个会话私有的。
-   **work\_mem**  是事务执行内部排序或Hash表写入临时文件之前使用的内存缓冲区。

## **二、接下来我们再了解一下openGauss的后台辅助线程**<a name="section71779121541"></a>

<a name="table9863183525016"></a>
<table><thead align="left"><tr id="row1819336125017"><th class="cellrowborder" valign="top" width="24.34%" id="mcps1.1.3.1.1"><p id="p72011368503"><a name="p72011368503"></a><a name="p72011368503"></a>线程名称</p>
</th>
<th class="cellrowborder" valign="top" width="75.66000000000001%" id="mcps1.1.3.1.2"><p id="p120736165020"><a name="p120736165020"></a><a name="p120736165020"></a>描述</p>
</th>
</tr>
</thead>
<tbody><tr id="row220103620503"><td class="cellrowborder" valign="top" width="24.34%" headers="mcps1.1.3.1.1 "><p id="p92053618506"><a name="p92053618506"></a><a name="p92053618506"></a>jemalloc_bg_thd</p>
</td>
<td class="cellrowborder" valign="top" width="75.66000000000001%" headers="mcps1.1.3.1.2 "><p id="p12019362501"><a name="p12019362501"></a><a name="p12019362501"></a>管理并实现内存的动态分配</p>
</td>
</tr>
<tr id="row42023610503"><td class="cellrowborder" valign="top" width="24.34%" headers="mcps1.1.3.1.1 "><p id="p7205361502"><a name="p7205361502"></a><a name="p7205361502"></a>StatCollector</p>
</td>
<td class="cellrowborder" valign="top" width="75.66000000000001%" headers="mcps1.1.3.1.2 "><p id="p9201836165019"><a name="p9201836165019"></a><a name="p9201836165019"></a>负责统计openGauss数据库的信息，包括：物理硬件资源使用信息、对象属性及使用信息、SQL运行信息、会话信息、锁信息、线程信息等，并且将这些收集到的统计信息保存在pgstat.stat文件中</p>
</td>
</tr>
<tr id="row132013665011"><td class="cellrowborder" valign="top" width="24.34%" headers="mcps1.1.3.1.1 "><p id="p132013368502"><a name="p132013368502"></a><a name="p132013368502"></a>Auditor</p>
</td>
<td class="cellrowborder" valign="top" width="75.66000000000001%" headers="mcps1.1.3.1.2 "><p id="p020123635014"><a name="p020123635014"></a><a name="p020123635014"></a>使用重定向的方式从管理线程、后台线程以及其他子线程获取审计数据，并保存在审计文件中</p>
</td>
</tr>
<tr id="row120736125017"><td class="cellrowborder" valign="top" width="24.34%" headers="mcps1.1.3.1.1 "><p id="p12003655010"><a name="p12003655010"></a><a name="p12003655010"></a>LWLockMonitor</p>
</td>
<td class="cellrowborder" valign="top" width="75.66000000000001%" headers="mcps1.1.3.1.2 "><p id="p1920163615015"><a name="p1920163615015"></a><a name="p1920163615015"></a>负责检测轻量级锁(LWLock)产生的死锁，轻量级锁主要提供对共享内存的互斥访问控制，比如Clog buffer（事务提交状态缓存）、Shared buffers（数据页缓存）、Substran buffer（子事务缓存）等</p>
</td>
</tr>
<tr id="row220183615501"><td class="cellrowborder" valign="top" width="24.34%" headers="mcps1.1.3.1.1 "><p id="p4201036145015"><a name="p4201036145015"></a><a name="p4201036145015"></a>sysLogger</p>
</td>
<td class="cellrowborder" valign="top" width="75.66000000000001%" headers="mcps1.1.3.1.2 "><p id="p122020364508"><a name="p122020364508"></a><a name="p122020364508"></a>使用重定向的方式捕获管理线程、后台线程以及其他子线程的stderr输出，并写入日志文件中</p>
</td>
</tr>
<tr id="row192053611504"><td class="cellrowborder" valign="top" width="24.34%" headers="mcps1.1.3.1.1 "><p id="p17201536205010"><a name="p17201536205010"></a><a name="p17201536205010"></a>Jobworker</p>
</td>
<td class="cellrowborder" valign="top" width="75.66000000000001%" headers="mcps1.1.3.1.2 "><p id="p5201736115017"><a name="p5201736115017"></a><a name="p5201736115017"></a>JOB线程分为调度线程和工作线程。调度线程(JobScheduler)会根据pg_job表里面定义的JOB周期，对已经过期的JOB进行调用，由工作线程(Jobworker)执行实际的JOB任务</p>
</td>
</tr>
<tr id="row202023620502"><td class="cellrowborder" valign="top" width="24.34%" headers="mcps1.1.3.1.1 "><p id="p4201336165014"><a name="p4201336165014"></a><a name="p4201336165014"></a>percentworker</p>
</td>
<td class="cellrowborder" valign="top" width="75.66000000000001%" headers="mcps1.1.3.1.2 "><p id="p32173616507"><a name="p32173616507"></a><a name="p32173616507"></a>根据percentile参数设置的值计算sql响应时间的百分比信息，目前percentile参数仅支持80和95</p>
</td>
</tr>
<tr id="row1521236115011"><td class="cellrowborder" valign="top" width="24.34%" headers="mcps1.1.3.1.1 "><p id="p132163645016"><a name="p132163645016"></a><a name="p132163645016"></a>snapshotworker</p>
</td>
<td class="cellrowborder" valign="top" width="75.66000000000001%" headers="mcps1.1.3.1.2 "><p id="p621143610503"><a name="p621143610503"></a><a name="p621143610503"></a>收集snapshot信息，openGauss数据库的WDR报告依赖于snapshot</p>
</td>
</tr>
<tr id="row921153615507"><td class="cellrowborder" valign="top" width="24.34%" headers="mcps1.1.3.1.1 "><p id="p19211936105011"><a name="p19211936105011"></a><a name="p19211936105011"></a>ashworker</p>
</td>
<td class="cellrowborder" valign="top" width="75.66000000000001%" headers="mcps1.1.3.1.2 "><p id="p52143613502"><a name="p52143613502"></a><a name="p52143613502"></a>统计历史活动会话相关信息</p>
</td>
</tr>
<tr id="row82153617501"><td class="cellrowborder" valign="top" width="24.34%" headers="mcps1.1.3.1.1 "><p id="p1621123616507"><a name="p1621123616507"></a><a name="p1621123616507"></a>alarm</p>
</td>
<td class="cellrowborder" valign="top" width="75.66000000000001%" headers="mcps1.1.3.1.2 "><p id="p2218362504"><a name="p2218362504"></a><a name="p2218362504"></a>openGauss的告警检测线程</p>
</td>
</tr>
<tr id="row521153615010"><td class="cellrowborder" valign="top" width="24.34%" headers="mcps1.1.3.1.1 "><p id="p102111364501"><a name="p102111364501"></a><a name="p102111364501"></a>清理线程(AutoVacLauncher+AutoVacWorker)</p>
</td>
<td class="cellrowborder" valign="top" width="75.66000000000001%" headers="mcps1.1.3.1.2 "><p id="p122173614504"><a name="p122173614504"></a><a name="p122173614504"></a>AutoVacLauncher线程由Postmaster线程启动，它不断地将数据库需要做vacuum的对象信息保存在共享内存中，当表上被删除或更新的记录数超过设定的阈值时，会调用AutoVacWorker线程对表的存储空间执行回收清理工作</p>
</td>
</tr>
<tr id="row1321193645010"><td class="cellrowborder" valign="top" width="24.34%" headers="mcps1.1.3.1.1 "><p id="p821143611502"><a name="p821143611502"></a><a name="p821143611502"></a>WalSender</p>
</td>
<td class="cellrowborder" valign="top" width="75.66000000000001%" headers="mcps1.1.3.1.2 "><p id="p821183619502"><a name="p821183619502"></a><a name="p821183619502"></a>运行在openGauss主备环境中主节点，发送预写日志给备节点</p>
</td>
</tr>
<tr id="row821133610502"><td class="cellrowborder" valign="top" width="24.34%" headers="mcps1.1.3.1.1 "><p id="p1421183665019"><a name="p1421183665019"></a><a name="p1421183665019"></a>WalReceiver</p>
</td>
<td class="cellrowborder" valign="top" width="75.66000000000001%" headers="mcps1.1.3.1.2 "><p id="p18211136115016"><a name="p18211136115016"></a><a name="p18211136115016"></a>运行在openGauss主备环境中备节点，接收预写日志记录</p>
</td>
</tr>
<tr id="row1211736115016"><td class="cellrowborder" valign="top" width="24.34%" headers="mcps1.1.3.1.1 "><p id="p821143619508"><a name="p821143619508"></a><a name="p821143619508"></a>pagewriter</p>
</td>
<td class="cellrowborder" valign="top" width="75.66000000000001%" headers="mcps1.1.3.1.2 "><p id="p1621123619506"><a name="p1621123619506"></a><a name="p1621123619506"></a>负责将脏页数据拷贝至双写(double-writer)区域并落盘，然后将脏页转发给bgwriter子线程进行数据下盘操作，如果发生数据页"折断"的问题，就会从双写空间里找到完整的数据页进行恢复</p>
</td>
</tr>
<tr id="row62103655019"><td class="cellrowborder" valign="top" width="24.34%" headers="mcps1.1.3.1.1 "><p id="p15219365506"><a name="p15219365506"></a><a name="p15219365506"></a>bgwriter</p>
</td>
<td class="cellrowborder" valign="top" width="75.66000000000001%" headers="mcps1.1.3.1.2 "><p id="p522173675016"><a name="p522173675016"></a><a name="p522173675016"></a>负责对共享缓冲区的脏页数据持续的进行刷盘操作，目的是让数据库线程在进行用户查询时可以很少或者几乎不等待写动作的发生，这样的机制同样也减少了检查点造成的性能下降</p>
</td>
</tr>
<tr id="row1222143695019"><td class="cellrowborder" valign="top" width="24.34%" headers="mcps1.1.3.1.1 "><p id="p02233612503"><a name="p02233612503"></a><a name="p02233612503"></a>Checkpointer</p>
</td>
<td class="cellrowborder" valign="top" width="75.66000000000001%" headers="mcps1.1.3.1.2 "><p id="p422103620508"><a name="p422103620508"></a><a name="p422103620508"></a>周期性的发起数据库检查点，在这个检查点时刻，所有的数据文件都被更新，脏数据页也被刷新到磁盘，此刻数据库是一致的。openGauss支持全量检查点和增量检查点，增量检查点打开后会小批量的分阶段的滚筒式的去进行脏页刷盘</p>
</td>
</tr>
</tbody>
</table>

关于其他后台辅助线程的介绍，可以参考文章[《浅聊openGauss逻辑架构》](https://www.modb.pro/db/41842)。

## **三、Database相关文件**<a name="section599811384560"></a>

<a name="table16885193511507"></a>
<table><thead align="left"><tr id="row92216369500"><th class="cellrowborder" valign="top" width="12.920000000000002%" id="mcps1.1.3.1.1"><p id="p62233614505"><a name="p62233614505"></a><a name="p62233614505"></a>目录名称</p>
</th>
<th class="cellrowborder" valign="top" width="87.08%" id="mcps1.1.3.1.2"><p id="p2226363501"><a name="p2226363501"></a><a name="p2226363501"></a>描述</p>
</th>
</tr>
</thead>
<tbody><tr id="row12221236145018"><td class="cellrowborder" valign="top" width="12.920000000000002%" headers="mcps1.1.3.1.1 "><p id="p142213695011"><a name="p142213695011"></a><a name="p142213695011"></a>base</p>
</td>
<td class="cellrowborder" valign="top" width="87.08%" headers="mcps1.1.3.1.2 "><p id="p17221836155017"><a name="p17221836155017"></a><a name="p17221836155017"></a>openGauss数据库对象默认存储在该目录，如默认的数据库postgres、用户创建的数据库及关联的表等对象</p>
</td>
</tr>
<tr id="row62214368507"><td class="cellrowborder" valign="top" width="12.920000000000002%" headers="mcps1.1.3.1.1 "><p id="p322193605016"><a name="p322193605016"></a><a name="p322193605016"></a>global</p>
</td>
<td class="cellrowborder" valign="top" width="87.08%" headers="mcps1.1.3.1.2 "><p id="p8227365502"><a name="p8227365502"></a><a name="p8227365502"></a>存储openGauss共享的系统表或者说是共享的数据字典表</p>
</td>
</tr>
<tr id="row1222163695012"><td class="cellrowborder" valign="top" width="12.920000000000002%" headers="mcps1.1.3.1.1 "><p id="p1522036195010"><a name="p1522036195010"></a><a name="p1522036195010"></a>pg_tblspc</p>
</td>
<td class="cellrowborder" valign="top" width="87.08%" headers="mcps1.1.3.1.2 "><p id="p62253619503"><a name="p62253619503"></a><a name="p62253619503"></a>即是openGauss的表空间目录，里面存储openGauss定义的表空间的目录软链接，这些软链接指向openGauss数据库表空间文件的实际存储目录</p>
</td>
</tr>
<tr id="row822113665010"><td class="cellrowborder" valign="top" width="12.920000000000002%" headers="mcps1.1.3.1.1 "><p id="p622143613505"><a name="p622143613505"></a><a name="p622143613505"></a>pg_xlog</p>
</td>
<td class="cellrowborder" valign="top" width="87.08%" headers="mcps1.1.3.1.2 "><p id="p52317366508"><a name="p52317366508"></a><a name="p52317366508"></a>存储openGauss数据库的WAL日志文件</p>
</td>
</tr>
<tr id="row4235364501"><td class="cellrowborder" valign="top" width="12.920000000000002%" headers="mcps1.1.3.1.1 "><p id="p623133635013"><a name="p623133635013"></a><a name="p623133635013"></a>pg_clog</p>
</td>
<td class="cellrowborder" valign="top" width="87.08%" headers="mcps1.1.3.1.2 "><p id="p17231936145016"><a name="p17231936145016"></a><a name="p17231936145016"></a>存储openGauss数据库事务提交状态信息</p>
</td>
</tr>
<tr id="row202310367506"><td class="cellrowborder" valign="top" width="12.920000000000002%" headers="mcps1.1.3.1.1 "><p id="p7235364507"><a name="p7235364507"></a><a name="p7235364507"></a>pg_csnlog</p>
</td>
<td class="cellrowborder" valign="top" width="87.08%" headers="mcps1.1.3.1.2 "><p id="p172343620508"><a name="p172343620508"></a><a name="p172343620508"></a>存储openGauss数据库的快照信息，openGauss事务启动时会创建一个CSN快照，在MVCC机制下，CSN作为openGauss的逻辑时间戳，模拟数据库内部的时序，用来判断其他事务对于当前事务是否可见</p>
</td>
</tr>
<tr id="row192312362506"><td class="cellrowborder" valign="top" width="12.920000000000002%" headers="mcps1.1.3.1.1 "><p id="p1223183685019"><a name="p1223183685019"></a><a name="p1223183685019"></a>pg_twophase</p>
</td>
<td class="cellrowborder" valign="top" width="87.08%" headers="mcps1.1.3.1.2 "><p id="p5231136175010"><a name="p5231136175010"></a><a name="p5231136175010"></a>存储两阶段事务提交信息，用来确保数据一致性</p>
</td>
</tr>
<tr id="row142314363507"><td class="cellrowborder" valign="top" width="12.920000000000002%" headers="mcps1.1.3.1.1 "><p id="p92323645012"><a name="p92323645012"></a><a name="p92323645012"></a>pg_serial</p>
</td>
<td class="cellrowborder" valign="top" width="87.08%" headers="mcps1.1.3.1.2 "><p id="p623136135010"><a name="p623136135010"></a><a name="p623136135010"></a>存储已提交的可序列化事务信息</p>
</td>
</tr>
<tr id="row5231636205010"><td class="cellrowborder" valign="top" width="12.920000000000002%" headers="mcps1.1.3.1.1 "><p id="p1023103655017"><a name="p1023103655017"></a><a name="p1023103655017"></a>pg_multixact</p>
</td>
<td class="cellrowborder" valign="top" width="87.08%" headers="mcps1.1.3.1.2 "><p id="p523133625011"><a name="p523133625011"></a><a name="p523133625011"></a>存储多事务状态信息，一般用于共享行级锁(shared row locks)</p>
</td>
</tr>
</tbody>
</table>

## **四、openGauss配置相关文件**<a name="section33691954145615"></a>

<a name="table5895203516505"></a>
<table><thead align="left"><tr id="row023133611504"><th class="cellrowborder" valign="top" width="13.77%" id="mcps1.1.3.1.1"><p id="p1223736125013"><a name="p1223736125013"></a><a name="p1223736125013"></a>文件名称</p>
</th>
<th class="cellrowborder" valign="top" width="86.22999999999999%" id="mcps1.1.3.1.2"><p id="p323936125018"><a name="p323936125018"></a><a name="p323936125018"></a>描述</p>
</th>
</tr>
</thead>
<tbody><tr id="row8232036125014"><td class="cellrowborder" valign="top" width="13.77%" headers="mcps1.1.3.1.1 "><p id="p1524136115012"><a name="p1524136115012"></a><a name="p1524136115012"></a>postgresql.conf</p>
</td>
<td class="cellrowborder" valign="top" width="86.22999999999999%" headers="mcps1.1.3.1.2 "><p id="p424636175013"><a name="p424636175013"></a><a name="p424636175013"></a>openGauss的配置文件，在gaussmaster线程启动时会读取该文件，获取监听地址、服务端口、内存分配、功能设置等配置信息，并且根据该文件，在openGauss启动时创建共享内存和信号量池等</p>
</td>
</tr>
<tr id="row52413625017"><td class="cellrowborder" valign="top" width="13.77%" headers="mcps1.1.3.1.1 "><p id="p16248369501"><a name="p16248369501"></a><a name="p16248369501"></a>pg_hba.conf</p>
</td>
<td class="cellrowborder" valign="top" width="86.22999999999999%" headers="mcps1.1.3.1.2 "><p id="p172463615502"><a name="p172463615502"></a><a name="p172463615502"></a>基于主机的接入认证配置文件，主要保存鉴权信息(如：允许访问的数据库、用户、IP段、加密方式等)</p>
</td>
</tr>
<tr id="row142416366505"><td class="cellrowborder" valign="top" width="13.77%" headers="mcps1.1.3.1.1 "><p id="p1724163615509"><a name="p1724163615509"></a><a name="p1724163615509"></a>pg_ident.conf</p>
</td>
<td class="cellrowborder" valign="top" width="86.22999999999999%" headers="mcps1.1.3.1.2 "><p id="p1724236155017"><a name="p1724236155017"></a><a name="p1724236155017"></a>客户端认证的配置文件，主要保存用户映射信息，将主机操作系统的用户与openGauss数据库用户做映射</p>
</td>
</tr>
<tr id="row172433616507"><td class="cellrowborder" valign="top" width="13.77%" headers="mcps1.1.3.1.1 "><p id="p1424336145016"><a name="p1424336145016"></a><a name="p1424336145016"></a>gaussdb.state</p>
</td>
<td class="cellrowborder" valign="top" width="86.22999999999999%" headers="mcps1.1.3.1.2 "><p id="p824183612508"><a name="p824183612508"></a><a name="p824183612508"></a>主要保存数据库当前的状态信息(如：主备HA的角色、rebuild进度及原因、sync状态、LSN信息等)</p>
</td>
</tr>
</tbody>
</table>

## **五、openGauss其他重要文件**<a name="section7973189165712"></a>

<a name="table1790353515017"></a>
<table><thead align="left"><tr id="row224173615501"><th class="cellrowborder" valign="top" width="15.8%" id="mcps1.1.3.1.1"><p id="p1224193610509"><a name="p1224193610509"></a><a name="p1224193610509"></a>目录名称</p>
</th>
<th class="cellrowborder" valign="top" width="84.2%" id="mcps1.1.3.1.2"><p id="p202493612506"><a name="p202493612506"></a><a name="p202493612506"></a>描述</p>
</th>
</tr>
</thead>
<tbody><tr id="row824836165015"><td class="cellrowborder" valign="top" width="15.8%" headers="mcps1.1.3.1.1 "><p id="p1524183635012"><a name="p1524183635012"></a><a name="p1524183635012"></a>Archived WAL</p>
</td>
<td class="cellrowborder" valign="top" width="84.2%" headers="mcps1.1.3.1.2 "><p id="p192473655019"><a name="p192473655019"></a><a name="p192473655019"></a>openGauss数据库WAL日志的归档目录，保存openGauss的历史WAL日志</p>
</td>
</tr>
<tr id="row5241436115013"><td class="cellrowborder" valign="top" width="15.8%" headers="mcps1.1.3.1.1 "><p id="p524136105012"><a name="p524136105012"></a><a name="p524136105012"></a>pg_audit</p>
</td>
<td class="cellrowborder" valign="top" width="84.2%" headers="mcps1.1.3.1.2 "><p id="p624236155018"><a name="p624236155018"></a><a name="p624236155018"></a>存储openGauss数据库的审计日志文件</p>
</td>
</tr>
<tr id="row2259366503"><td class="cellrowborder" valign="top" width="15.8%" headers="mcps1.1.3.1.1 "><p id="p2025193618508"><a name="p2025193618508"></a><a name="p2025193618508"></a>pg_replslot</p>
</td>
<td class="cellrowborder" valign="top" width="84.2%" headers="mcps1.1.3.1.2 "><p id="p1525173617500"><a name="p1525173617500"></a><a name="p1525173617500"></a>存储openGauss数据库的复制事务槽数据</p>
</td>
</tr>
<tr id="row11255364508"><td class="cellrowborder" valign="top" width="15.8%" headers="mcps1.1.3.1.1 "><p id="p152593616507"><a name="p152593616507"></a><a name="p152593616507"></a>pg_llog</p>
</td>
<td class="cellrowborder" valign="top" width="84.2%" headers="mcps1.1.3.1.2 "><p id="p10251436165011"><a name="p10251436165011"></a><a name="p10251436165011"></a>保存逻辑复制时的状态数据</p>
</td>
</tr>
</tbody>
</table>

关于openGauss体系架构就为大家介绍到这里，鉴于笔者并非openGauss内核开发人员，这里仅从DBA的角度粗浅的对openGauss数据库体系架构为大家做一个简单介绍，若文章有描述错误之处，欢迎指正。将及时修正以免误导大家。

## **文末寄语：**<a name="section199051738205711"></a>

openGauss开源至今已将近1年，合作伙伴和广大数据库爱好者的努力使得openGauss数据库得以快速健康地向前发展，openGauss目前已发布至 2.0.0 版本，按照发布计划应该会在6月31日发布新的版本，欢迎各位小伙伴关注。    在个人的工作中，偶尔有小伙伴反馈openGauss有些不足之处使其对国产数据库失去了信心，为国产数据库的发展前景画了一个问号。这里我想阐述一下个人观点：    Oracle起源于1977年，MySQL起源于1979年，SQL Server1987年，那么我们国产数据库呢？    根据墨天轮发布的2021年6月份[《国产数据库流行度排行榜》](https://www.modb.pro/dbRank)，前三甲国产数据库中，2016年12月TiDB RC1发布，2011年OceanBase 0.1发布，2017年PolarDB发布。而国产数据库真正的发力时间点个人认为应该是在2020年，从2020年至今，国产数据库可谓是百家争鸣，无论是开源建设、技术发展还是生态建设都处于突飞猛进的状态。从时间上看，国产数据库真正的发展时间比国外主流数据库晚将近40载，在一个良好的数据库技术生态环境下，经历40载的光阴打磨，形成一款优秀的数据库软件是理所当然。所以，综合起来看，以Oracle为代表的数据库无论是生态建设还是技术成熟度都比国产数据库有一定的先天优势。    但当今的国产数据库发展现状已经不可同日而语，IT从业人员基本也都意识到核心IT技术国产化的重要性。无论是传统数据库厂商、互联网厂商还是其他IT厂商等等诸多厂商都在做属于自己的数据库产品，仅墨天轮《国产数据库流行度排行榜》所统计的数据库就多达130+种，而且这些数据库的技术起点已经处于一个较高且成熟的水平。在互联网、金融、政府、能源、电信等诸多核心行业中都在不断地尝试国产数据库在核心业务场景下的使用。    为了打造一个更好的国产数据库技术生态，openGauss、TiDB、OceanBase等优秀的数据库源代码已对外开放，合作伙伴可以根据源代码，发行属于自己的商业版本数据库，促进国产数据库的生态建设。    同时，我国的各大高等院校也增加了大量国产数据库的课程内容，为国产数据库后续的人才建设提供了有力保障，这些是国产数据库的未来。    所以，理性且客观的看，国产数据库和全球主流数据库存在些许差距，但国产数据库的发展环境已经不可同日而语，生态建设、人才发展、技术演进正在紧锣密鼓的向前“奔跑”，对国产数据库未来的发展应该有绝对的信心和自信，国产数据库与全球主流数据库的差距正在迅速缩小，至于什么时候与全球主流数据库比肩甚至超越，我相信只是时间问题，但不会太久。

**关于国产数据库，您怎么看？ 欢迎留言讨论。**

