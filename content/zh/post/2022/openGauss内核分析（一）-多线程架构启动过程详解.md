+++

title = "openGauss内核分析（一）：多线程架构启动过程详"

date = "2022-05-17"

tags = [ "内核分析"]

archives = "2022-05"

author = "酷哥"

summary = "内核分析"

img = "/zh/post/2022/title/img7.png"

times = "12:30"

+++

# openGauss内核分析（一）：多线程架构启动过程详解<a name="ZH-CN_TOPIC_0000001245215477"></a>"

openGauss数据库自2020年6月30日开源以来，吸引了众多内核开发者的关注。那么openGauss的多线程是如何启动的，一条SQL语句在 SQL引擎，执行引擎和存储引擎的执行过程是怎样的，酷哥做了一些总结，第一期内容主要分析openGauss 多线程架构启动过程。

openGauss数据库是一个单进程多线程的数据库，客户端可以使用JDBC/ODBC/Libpq/Psycopg等驱动程序，向openGauss的主线程（Postmaster）发起连接请求。

![](figures/openGauss内核分析（一）-多线程架构启动过程详解1.png)

## **01** **openGauss为什么要使用多线程架构**<a name="section18832744194319"></a>

随着计算机领域多核技术的发展，如何充分有效的利用多核的并行处理能力，是每个服务器端应用程序都必须考虑的问题。由于数据库服务器的服务进程或线程间存在着大量数据共享和同步，而多线程可以充分利用多CPU来并行执行多个强相关任务，例如执行引擎可以充分的利用线程的并发执行以提供性能。在多线程的架构下，数据共享的效率更高，能提高服务器访问的效率和性能，同时维护开销和复杂度更低，这对于提高数据库系统的并行处理能力非常重要。

**多线程的三大主要优势：**

**优势一：**线程启动开销远小于进程启动开销。与进程相比，它是一种非常“节俭”的多任务操作方式。在Linux系统下，启动一个新的进程必须分配给它独立的地址空间，建立众多的数据表来维护它的代码段、堆栈段和数据段，这是一种“昂贵”的多任务工作方式。而运行于一个进程中的多个线程，它们彼此之间使用相同的地址空间，共享大部分数据，启动一个线程所花费的空间远远小于启动一个进程所花费的空间。

**优势二：**线程间方便的通信机制：对不同进程来说，它们具有独立的数据空间，要进行数据的传递只能通过通信的方式进行，这种方式不仅费时，而且很不方便。线程则不然，由于同一进程下的线程之间共享数据空间，所以一个线程的数据可以直接为其他线程所用，这不仅快捷，而且方便。

**优势三：**线程切换开销小于进程切换开销，对于Linux系统来讲，进程切换分两步：1.切换页目录以使用新的地址空间；2.切换内核栈和硬件上下文。对线程切换，第1步是不需要做的，第2步是进程和线程都要做的，所以明显线程切换开销小。

## **02 openGauss主要线程有哪些**<a name="section17951726446"></a>

<a name="table10229142719426"></a>
<table><thead align="left"><tr id="row1744572774211"><th class="cellrowborder" valign="top" width="25.61%" id="mcps1.1.3.1.1"><p id="p344512274427"><a name="p344512274427"></a><a name="p344512274427"></a>后台线程</p>
</th>
<th class="cellrowborder" valign="top" width="74.39%" id="mcps1.1.3.1.2"><p id="p644522713425"><a name="p644522713425"></a><a name="p644522713425"></a>功能介绍</p>
</th>
</tr>
</thead>
<tbody><tr id="row144542718426"><td class="cellrowborder" valign="top" width="25.61%" headers="mcps1.1.3.1.1 "><p id="p2044632774217"><a name="p2044632774217"></a><a name="p2044632774217"></a>Postmaster主线程</p>
</td>
<td class="cellrowborder" valign="top" width="74.39%" headers="mcps1.1.3.1.2 "><p id="p184462027154218"><a name="p184462027154218"></a><a name="p184462027154218"></a>入口函数PostmasterMain，主要负责内存、全局信息、信号、线程池等的初始化，启动辅助线程并监控线程状态，循环监听接收新的连接</p>
</td>
</tr>
<tr id="row2446102717427"><td class="cellrowborder" valign="top" width="25.61%" headers="mcps1.1.3.1.1 "><p id="p1844692744215"><a name="p1844692744215"></a><a name="p1844692744215"></a>Walwriter日志写线程</p>
</td>
<td class="cellrowborder" valign="top" width="74.39%" headers="mcps1.1.3.1.2 "><p id="p12446122724215"><a name="p12446122724215"></a><a name="p12446122724215"></a>入口函数WalWriterMain，将内存的预写日志页数据刷新到预写日志文件中，保证已提交的事物永久记录，不会丢失</p>
</td>
</tr>
<tr id="row1844632724219"><td class="cellrowborder" valign="top" width="25.61%" headers="mcps1.1.3.1.1 "><p id="p6446142704213"><a name="p6446142704213"></a><a name="p6446142704213"></a>Startup数据库启动线程</p>
</td>
<td class="cellrowborder" valign="top" width="74.39%" headers="mcps1.1.3.1.2 "><p id="p644612279425"><a name="p644612279425"></a><a name="p644612279425"></a>入口函数StartupProcessMain，数据库启动时Postmaster主线程拉起的第一个子线程，主要完成数据库的日志REDO（重做）操作，进行数据库的恢复。日志REDO操作结束，数据库完成恢复后，如果不是备机，Startup线程就退出了。如果是备机，那么Startup线程一直在运行，REDO备机接收到新的日志</p>
</td>
</tr>
<tr id="row1944672734217"><td class="cellrowborder" valign="top" width="25.61%" headers="mcps1.1.3.1.1 "><p id="p644632724219"><a name="p644632724219"></a><a name="p644632724219"></a>Bgwriter后台数据写线程</p>
</td>
<td class="cellrowborder" valign="top" width="74.39%" headers="mcps1.1.3.1.2 "><p id="p10446122715423"><a name="p10446122715423"></a><a name="p10446122715423"></a>入口函数BackgroundWriterMain，对共享缓冲区的脏页数据进行下盘</p>
</td>
</tr>
<tr id="row184467273426"><td class="cellrowborder" valign="top" width="25.61%" headers="mcps1.1.3.1.1 "><p id="p2446162754212"><a name="p2446162754212"></a><a name="p2446162754212"></a>PageWriter</p>
</td>
<td class="cellrowborder" valign="top" width="74.39%" headers="mcps1.1.3.1.2 "><p id="p15446132720428"><a name="p15446132720428"></a><a name="p15446132720428"></a>入口函数ckpt_pagewriter_main，将脏页数据拷贝至双写区域并落盘</p>
</td>
</tr>
<tr id="row6446152744214"><td class="cellrowborder" valign="top" width="25.61%" headers="mcps1.1.3.1.1 "><p id="p11446132784212"><a name="p11446132784212"></a><a name="p11446132784212"></a>Checkpointer检查点线程</p>
</td>
<td class="cellrowborder" valign="top" width="74.39%" headers="mcps1.1.3.1.2 "><p id="p24462279421"><a name="p24462279421"></a><a name="p24462279421"></a>入口函数CheckpointerMain，周期性检查点，所有数据文件被更新，将数据脏页刷新到磁盘，确保数据库一致；崩溃回复后，做过checkpointer更改不需要从预写日志中恢复</p>
</td>
</tr>
<tr id="row84471927104214"><td class="cellrowborder" valign="top" width="25.61%" headers="mcps1.1.3.1.1 "><p id="p10447172794217"><a name="p10447172794217"></a><a name="p10447172794217"></a>StatCollector统计线程</p>
</td>
<td class="cellrowborder" valign="top" width="74.39%" headers="mcps1.1.3.1.2 "><p id="p344712754210"><a name="p344712754210"></a><a name="p344712754210"></a>入口函数PgstatCollectorMain，统计信息，包括对象、sql、会话、锁等，保存到pgstat.stat文件中，用于性能、故障、状态分析</p>
</td>
</tr>
<tr id="row1344752754218"><td class="cellrowborder" valign="top" width="25.61%" headers="mcps1.1.3.1.1 "><p id="p204471427104215"><a name="p204471427104215"></a><a name="p204471427104215"></a>WalSender日志发送线程</p>
</td>
<td class="cellrowborder" valign="top" width="74.39%" headers="mcps1.1.3.1.2 "><p id="p544772764218"><a name="p544772764218"></a><a name="p544772764218"></a>入口函数WalSenderMain，主机发送预写日志</p>
</td>
</tr>
<tr id="row1444742714212"><td class="cellrowborder" valign="top" width="25.61%" headers="mcps1.1.3.1.1 "><p id="p644792720422"><a name="p644792720422"></a><a name="p644792720422"></a>WalReceiver日志接收线程</p>
</td>
<td class="cellrowborder" valign="top" width="74.39%" headers="mcps1.1.3.1.2 "><p id="p1744742713421"><a name="p1744742713421"></a><a name="p1744742713421"></a>入口函数WalReceiverMain，备机接收预写日志</p>
</td>
</tr>
<tr id="row1044752744215"><td class="cellrowborder" valign="top" width="25.61%" headers="mcps1.1.3.1.1 "><p id="p13447152716420"><a name="p13447152716420"></a><a name="p13447152716420"></a>Postgres业务处理线程</p>
</td>
<td class="cellrowborder" valign="top" width="74.39%" headers="mcps1.1.3.1.2 "><p id="p2447827164217"><a name="p2447827164217"></a><a name="p2447827164217"></a>入口函数PostgresMain：处理客户端连接请求，执行相关SQL业务</p>
</td>
</tr>
</tbody>
</table>

数据库启动后，可以通过操作系统命令ps查看线程信息\(进程号为17012\)

![](figures/openGauss内核分析（一）-多线程架构启动过程详解2.png)

## **03** **openGauss启动过程**<a name="section13657042134413"></a>

下面主要介绍openGauss数据库的启动过程，包括主线程，辅助线程及业务处理线程的启动过程。

-   **gs\_ctl启动数据库**

    gs\_ctl是openGauss提供的数据库服务控制工具，可以用来启停数据库服务和查询数据库状态。主要供数据库管理模块调用，启动数据库使用如下命令：

    ```

    ```

    gs\_ctl的入口函数在“src/bin/pg\_ctl/pg\_ctl.cpp”，gs\_ctl进程fork一个进程来运行 gaussdb进程，通过shell命令启动。

    ![](figures/openGauss内核分析（一）-多线程架构启动过程详解3.png)

    上图中的cmd为“**/opt/software/openGauss/bin/gaussdb -D /opt/software/openGauss/data”，进入到数据库运行调用的第一个函数是main函数，**在“src/gausskernel/process/main/main.cpp”文件中，在main.cpp文件中，主要完成实例Context（上下文）的初始化、本地化设置，根据main.cpp文件的入口参数调用BootStrapProcessMain函数、GucInfoMain函数、PostgresMain函数和PostmasterMain函数。BootStrapProcessMain函数和PostgresMain函数是在initdb场景下初始化数据库使用的。GucInfoMain函数作用是显示GUC（grand unified configuration，配置参数，在数据库中指的是运行参数）参数信息。正常的数据库启动会进入PostmasterMain函数。下面对这个函数进行更详细的介绍。

    ![](figures/openGauss内核分析（一）-多线程架构启动过程详解4.png)

    1.MemoryContextInit：内存上下文系统初始化，主要完成对ThreadTopMemoryContext，ErrorContext，AlignContext和ProfileLogging等全局变量的初始化。

    2.pg\_perm\_setlocale：设置程序语言环境相关的全局变量。

    3.check\_root: 确认程序运行者无操作系统的root权限，防止的意外文件覆盖等问题。

    4.如果gaussdb后的第一个参数是—boot,则进行数据库初始化，如果gaussdb后的第一个参数是--single，则调用PostgresMain\(\)，进入（本地）单用户版服务端程序。之后，与普通服务器端线程类似，循环等待用户输入SQL语句，直至用户输入EOF（Ctrl+D），退出程序。如果没有指定额外启动选项，程序进入PostmasterMain函数，开始一系列服务器端的正常初始化工作。

-   **PostmasterMain 函数**

    **下面具体介绍PostmasterMain。**

    ![](figures/openGauss内核分析（一）-多线程架构启动过程详解5.png)

    1.设置线程号相关的全局变量MyProcPid、PostmasterPid、MyProgName和程序运行环境相关的全局变量IsPostmasterEnvironment。

    2.调用postmaster\_mem\_cxt = AllocSetContextCreate\(t\_thrd.top\_mem\_cxt,...\)，在目前线程的top\_mem\_cxt下创建postmaster\_mem\_cxt全局变量和相应的内存上下文。

    3. MemoryContextSwitchTo\(postmaster\_mem\_cxt\)切换到postmaster\_mem\_cxt内存上下文。

    4.调用getInstallationPaths\(\)，设置my\_exec\_path（一般即为gaussdb可执行文件所在路径）。

    5.调用InitializeGUCOptions\(\)，根据代码中各个GUC参数的默认值生成ConfigureNamesBool、ConfigureNamesInt、ConfigureNamesReal、ConfigureNamesString、ConfigureNamesEnum等 GUC参数的全局变量数组，以及统一管理GUC参数的guc\_variables、num\_guc\_variables、size\_guc\_variables全局变量，并设置与具体操作系统环境相关的GUC参数。

    6. while \(opt = ...\) SetConfigOption, 若在启动gaussdb时用指定了非默认的GUC参数，则在此时加载至上一步中创建的全局变量中。

    7.调用checkDataDir\(\)，确认数据库安装成功以及PGDATA目录的有效性。

    8.调用CreateDataDirLockFile\(\)，创建数据目录的锁文件。

    9.调用process\_shared\_preload\_libraries\(\)，处理预加载库。

    10.为每个ListenSocket创建监听。

    11. reset\_shared，设置共享内存和信号，主要包括页面缓存池、各种锁缓存池、WAL日志缓存池、事务日志缓存池、事务（号）概况缓存池、各后台线程（锁使用）概况缓存池、各后台线程等待和运行状态缓存池、两阶段状态缓存池、检查点缓存池、WAL日志复制和接收缓存池、数据页复制和接收缓存池等。在后续阶段创建出的客户端后台线程以及各个辅助线程均使用该共享内存空间，不再单独开辟。

    12.将启动时手动设置的GUC参数以文件形式保存下来，以供后续后台服务端线程启动时使用。

    13.为不同信号设置handler。

    14.调用pgstat\_init\(\)，初始化状态收集子系统。

    15.调用load\_hba\(\)，加载pg\_hba.conf文件，该文件记录了允许连接（指定或全部）数据库的客户端物理机的地址和端口；调用load\_ident\(\)，加载pg\_ident.conf文件，该文件记录了操作系统用户名与数据库系统用户名的对应关系，以便后续处理客户端连接时的身份认证。

    16.调用 StartupPID = initialize\_util\_thread\(STARTUP\)，进行数据一致性校验。对于服务端主机来说，查看pg\_control文件，若上次关闭状态为DB\_SHUTDOWNED且recovery.conf文件没有指定进行恢复，则认为数据一致性成立；否则，根据pg\_control中检查点的redo位置或者recovery.conf文件中指定的位置，读取WAL日志或归档日志进行replay（回放），直至数据达到预期的一致性状，主要函数StartupXLOG。

    17. 最后进入ServerLoop\(\)函数，循环响应客户端连接请求。

-   **ServerLoop函数**

    **下面来讲ServerLoop函数主流程**

    ![](figures/openGauss内核分析（一）-多线程架构启动过程详解6.png)

    1.调用gs\_signal\_setmask\(&UnBlockSig, NULL\)和gs\_signal\_unblock\_sigusr2\(\)，使得线程可以响应用户或其它线程的、指定的信号集。

    2.每隔PM\_POLL\_TIMEOUT\_MINUTE时间修改一次socket文件和socket锁文件的访问和修改时间，以免被操作系统淘汰。

    3.判断线程状态（pmState），若为PM\_WAIT\_DEAD\_END，则休眠100毫秒，并且不接收任何连接；否则，通过系统调用poll\(\)或select\(\)来阻塞地读取监听端口上传入的数据，最长阻塞时间PM\_POLL\_TIMEOUT\_SECOND。

    4.调用gs\_signal\_setmask\(&BlockSig, NULL\)和gs\_signal\_block\_sigusr2\(\)不再接收外源信号。

    5.判断poll\(\)或select\(\)函数的返回值，若小于零，监听出错，服务端进程退出；若大于零，则创建连接ConnCreate\(\)，并进入后台服务线程启动流程BackendStartup\(\)。对于父线程，即postmaster线程，在结束BackendStartup\(\)的调用以后，会调用ConnFree\(\)，清除连接信息；若poll\(\)或select\(\)的返回值为零，即没有信息传入，则不进行任何操作。

    6.调用ADIO\_RUN\(\)、ADIO\_END\(\) ，若AioCompleters没有启动，则启动之。

    7.检查各个辅助线程的线程号是否为零，若为零，则调用initialize\_util\_thread启动。

    以非线程池模式为例，介绍线程的启动逻辑。BackendStartup函数是通过调用initialize\_worker\_thread\(WORKE，port\)创建一个后台线程处理客户请求。后台线程的启动函数initialize\_util\_thread和工作线程的启动函数initialize\_worker\_thread，最后都是调用initialize\_thread函数完成线程的启动。

    ![](figures/openGauss内核分析（一）-多线程架构启动过程详解7.png)

    1.initialize\_thread函数调用gs\_thread\_create函数创建线程，调用InternalThreadFunc函数处理线程。

    ```
    ThreadId initialize_thread(ThreadArg* thr_argv)
    {
    
    
    gs_thread_t thread;
    int error_code = gs_thread_create(&thread, InternalThreadFunc, 1, (void*)thr_argv);
    if (error_code != 0) {
    ereport(LOG,
    (errmsg("can not fork thread[%s], errcode:%d, %m",
    GetThreadName(thr_argv->m_thd_arg.role), error_code)));
    gs_thread_release_args_slot(thr_argv);
    return InvalidTid;
    }
    
    
    return gs_thread_id(thread);
    }
    ```

    2.InternalThreadFunc函数根据角色调用GetThreadEntry函数，GetThreadEntry函数直接以角色为下标，返回对应GaussdbThreadEntryGate数组对应的元素。数组的元素是处理具体任务的回调函数指针，指针指向的函数为GaussDbThreadMain。

    ```
    static void* InternalThreadFunc(void* args)
    {
    knl_thread_arg* thr_argv = (knl_thread_arg*)args;
    gs_thread_exit((GetThreadEntry(thr_argv->role))(thr_argv));
    return (void*)NULL;
    }
    GaussdbThreadEntry GetThreadEntry(knl_thread_role role)
    {
    Assert(role > MASTER && role < THREAD_ENTRY_BOUND);
    return GaussdbThreadEntryGate[role];
    }
    static GaussdbThreadEntry GaussdbThreadEntryGate[] = {GaussDbThreadMain<MASTER>,
    GaussDbThreadMain<WORKER>,
    GaussDbThreadMain<THREADPOOL_WORKER>,
    GaussDbThreadMain<THREADPOOL_LISTENER>,
    ......};
    ```

    3.在GaussDbThreadMain函数中，首先初始化线程基本信息，Context和信号处理函数，接着就是根据thread\_role角色的不同调用不同角色的处理函数，进入各个线程的main函数，角色为WORKER会进入PostgresMain函数,下面具体介绍PostgresMain函数。

-   **PostgresMain函数**

    ![](figures/openGauss内核分析（一）-多线程架构启动过程详解8.png)

    1.process\_postgres\_switches\(\)，加载传入的启动选项和GUC参数。

    2.为不同信号设置handler。

    3.调用sigdelset\(&BlockSig, SIGQUIT\)，允许响应SIGQUIT信号。

    4.调用BaseInit\(\)，初始化存储管理系统和页面缓存池计数。

    5.调用on\_shmem\_exit\(\)，设置线程退出前需要进行的内存清理动作。这些清理动作构成一个链表（on\_shmem\_exit\_list全局变量），每次调用该函数都向链表尾端添加一个节点，链表长度由on\_shmem\_exit\_index记录，且不可超过MAX\_ON\_EXITS宏。在线程退出时，从后往前调用各个节点中的动作（函数指针），完成清理工作。

    6.调用gs\_signal\_setmask \(&UnBlockSig\)，设置屏蔽的信号类型。

    7.调用InitBackendWorker进行统计系统初始化、syscache初始化工作。

    8. BeginReportingGUCOptions如有需要则打印GUC参数。

    9.调用on\_proc\_exit\(\)，设置线程退出前需要进行的线程清理动作。设置和调用机制与on\_shmem\_exit\(\)类似。

    10.调用process\_local\_preload\_libraries\(\)，处理GUC参数设定后的预加载库。

    11. AllocSetContextCreate创建MessageContext、RowDescriptionContext、MaskPasswordCtx上下文。

    12.调用sigsetjmp\(\)，设置longjump点，若后续查询执行中出错，在某些情况下可以返回此处重新开始。

    13.调用gs\_signal\_unblock\_sigusr2\(\)，允许线程响应指定的信号集。

    14.然后进入for循环，进行查询执行。

    ![](figures/openGauss内核分析（一）-多线程架构启动过程详解9.png)

    1.调用pgstat\_report\_activity\(\)、pgstat\_report\_waitstatus\(\)，告诉统计系统后台线程正处于idle状态。

    2.设置全局变量DoingCommandRead = true。

    3.调用ReadCommand\(\),读取客户端SQL语句。

    4.设置全局变量DoingCommandRead=false。

    5.若在上述过程中收到SIGHUP信号，表示线程需要重新加载修改过的postgresql.conf配置文件。

    6.进入switch \(firstchar\)，根据接收到的信息进行分支判断。


## **04思考如何新增一个辅助线程**<a name="section7925133120539"></a>

**参考其他线程完成**

<a name="table16260122704210"></a>
<table><tbody><tr id="row1645112714424"><td class="cellrowborder" valign="top" width="50%"><p id="p1245115272422"><a name="p1245115272422"></a><a name="p1245115272422"></a>涉及修改文件</p>
</td>
<td class="cellrowborder" valign="top" width="50%"><p id="p24517270428"><a name="p24517270428"></a><a name="p24517270428"></a>Postmaster.cpp</p>
</td>
</tr>
<tr id="row145115278420"><td class="cellrowborder" valign="top" width="50%"><p id="p845172774213"><a name="p845172774213"></a><a name="p845172774213"></a>涉及修改函数</p>
</td>
<td class="cellrowborder" valign="top" width="50%"><p id="p13451202744213"><a name="p13451202744213"></a><a name="p13451202744213"></a>GaussdbThreadGate – 定义</p>
<p id="p1945118274428"><a name="p1945118274428"></a><a name="p1945118274428"></a>Serverloop – 启动线程</p>
<p id="p10451427134218"><a name="p10451427134218"></a><a name="p10451427134218"></a>Reaper – 回收线程</p>
<p id="p645182717421"><a name="p645182717421"></a><a name="p645182717421"></a>GaussDBThreadMain – 入口函数</p>
</td>
</tr>
</tbody>
</table>

