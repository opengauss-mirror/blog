+++

title = "openGauss内存管理初探" 

date = "2021-07-10" 

tags = [ "openGauss内存管理初探"] 

archives = "2021-07" 

author = "李士福" 

summary = "openGauss内存管理初探"

img = "/zh/post/zhengwen2/img/img5.jpg" 

times = "12:30"

+++

# openGauss内存管理初探<a name="ZH-CN_TOPIC_0000001085018737"></a> 

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;上周，有小伙伴在openGauss技术交流群里问在编码开发过程中如何进行内存分配，使用时感觉和PostgreSQL使用方式有些不同。的确如这位同学所想，openGauss的内存管理尽管继承了PostgreSQL的内存管理机制，但进行了多方面的扩展和改造，目的是适配多线程架构，更好的满足企业化应用诉求。openGauss内存管理主要做了如下的功能：

 - 引入jemalloc开源库，替换glibc的内存分配和释放，减少内存碎片 
 - 引入逻辑内存管理机制，控制进程内存使用，避免出现OOM问题
 - 引入多种内存上下文（共享内存上下文、栈式内存上下文、对齐内存上下文），满足不同场景代码开发诉求 
 - 引入ASAN（Address Sanitizer）开源库，在Debug版本下定位内存泄漏和内存越界问题 
   引入丰富的内存查询视图，方便观察内存使用情况，定位潜在内存问题

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;下面基于上面的功能特性，从开发和使用者两方面阐述一下如何在编码过程中使用内存以及如在问题出现时快速定位问题。

#### 1. openGauss内存管理开发注意事项

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;openGauss中内存分配和释放接口，仍然同PostgresSQL内存上下文使用方式一样；通用内存上下文使用的数据结构和算法没有大的变化，新增内存上下文使用新的数据结构来实现，大家可以先看看相关文章了解PostgreSQL的内存上下文机制。
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;默认情况下，使用“AllocSetContextCreate”函数创建内存上下文。在这需要注意是否指定内存上下文的类型，默认不指定，则使用“STANDARD_CONTEXT”标识符来创建通用内存上下文，该内存上下文的作用域仅用于单个线程内，随着线程退出或者作业重置，需要进行内存上下文清理，防止内存堆积。线程中的内存上下文的根节点是TopMemoryContext（即代码中的t_thrd.top_mem_cxt），通常在代码中禁止从TopMemoryContext内存上下文上申请内存，在使用时根据内存作用域从相应的内存上下文节点上创建子节点，父子节点均为通用内存上下文。
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;因为openGauss是多线程架构，通常会使用共享内存来保存关键信息用于多线程访问和更新。在创建内存上下文时，需要明确指定“SHARED_CONTEXT”标识符，同时需要保证父节点均为共享内存上下文。共享内存上下文的根节点为“ProcessMemory”（即代码中的g_instance.instance_context），默认情况下不在该内存上下文上分配内存。共享内存上下文的可分配内存通常是受限的，因为内存使用的主体在作业执行过程，所以开发人员需要自行限制共享内存上下文最大可申请内存的大小（可通过成员数量限制或者淘汰机制实现），建议不超过200MB。在共享内存上下文上分配内存或者释放内存的操作，不需要额外加锁，直接调用palloc或者pfree即可，但申请内存后返回的指针后续操作需要用户根据调用逻辑来决定是否需要锁保护。
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;栈式内存上下文的实现机理很简单，和传统内存上下文不同，没有使用buddy算法进行2幂次方对齐，故分配内存时仅需8字节对齐，可以节省大量内存空间。栈式内存上下文适用于仅调用palloc分配内存，不需要进行pfree操作，在内存上下文不再进行使用时一次进行MemoryContextDelete或者MemoryContextReset，可以参考hashjoin算子使用内存的逻辑。对齐内存上下文用于内存页对齐，适用于ADIO场景，当前代码中很少应用。
除了上述指定MemoryContextCreate创建内存上下文场景，还有通过hash_create函数创建hash表时隐含创建的内存上下文，故hash_create创建的hash表也分为通用hash表（用于单个线程内部）以及共享hash表（可以用于整个进程共享），创建共享hash表时，需要指定HASH_SHRCTX参数，且参数中指定的父内存上下文也需要是共享内存上下文。
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;上述总结了内存上下文创建和使用的基本方法，对于内存上下文的分配和释放还有如下要求，总结如下：

 - 内存上下文分为线程级别（如TopMemoryContext)、Session级别（MessageMemoryContext）、作业级别（ExecutorState)、算子级别（HashJoin），不允许执行作业时到高级别的内存上下文上申请内存
 - 不允许频繁申请和释放同一内存上下文，即使是临时内存上下文，最低力度做到每个算子只申请和释放一次
 - 对于不使用的内存及内存上下文，要及时释放；算子执行完成后，算子内存上下文 及时释放
 - 非重度内存消耗算子（hashjoin/hashagg/setop/material/windowsagg）消耗内存原则上不允许超过10MB；若超过该限额，需给出评估依据
 - 共享内存上下文使用时需要进行总量的控制，原则上不允许超过200MB的内存使用若超过，需要进行评估
 - 全局变量指针在内存释放后置空，即调用pfree_ext函数进行置空 
 - 一次性分配数组内存时，访问、写入数组的下标对应内存时，对数组下标加入Assert判断，防止越界

#### 2.openGauss内存定位方法介绍

###### 1> 出现报错“memory is temporarily unavailable”
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;观察日志，是否为“reaching the database memory limitation”，表示为数据库的逻辑内存管 理机制保护引起，需要进一步分析数据库的视图；若为“reaching the OS memory limitation” ，表示为操作系统内存分配失败引起，需要查看操作系统参数配置及内存硬件情况等。
**数据库逻辑内存保护需要查看下列视图：**
- pg_total_memory_detail 观察当前数据库内部模块使用内存情况。当dynamic_used_memory大于max_dynamic_memory就会报内存不足。如果此时dynamic_used_memory小max_dynamic_memory，而dynamic_peak_memory大于max_dynamic_memory表明曾经出现内存不足的情况。如果是other_used_memory较大，则只能通过更换Debug版本进一步定位。SQL语句为： Select * from pg_total_memory_detail;
- 如果dynamic_used_shrctx较大，则查询gs_shared_memory_detail视图，观察是哪个MemoryContext使用内存较多。SQL语句为：Select * from gs_shared_memory_detail;
- 如果dynamic_used_shrctx不大，则查询gs_session_memory_detail视图，观察是哪个MemoryContext使用内存较多。SQL语句为：Select * from gs_session_memory_detail order by totalsize desc limit 20;
- 发现内存上下文后，若不好定位，进一步排查内存上下文上哪个地方问题，需要在Debug版本使用 memory_tracking_mode进一步定位文件和行号；
- 若内存上下文无异常，需要查看线程数量是否很高，可能是由于CacheMemoryContext引起。
- 可以在debug版本下，通过gdb脚本，把内存上下文上的分配信息打印出来

###### 2> 出现数据库节点RES很高或者节点宕机“Out of Memory”
- 首先读取/var/log/messages中的信息，看看是哪个进程引起的，通常是由 gaussdb引起；若gaussdb进程内存引起，进一步看是否正确配置 max_process_memory参数
- 若配置合理，进一步观察pg_total_memory_detail视图是否为Other内存占用 过高
- 若内存增长快速，且主要为内存上下文使用，可以通过jemalloc profiling快 速定位哪个地方申请的内存；
- 若Other内存过高，可能是由于第三方组件或者libpq等直接malloc内存引起的 ，需要通过ASAN工具进一步排查；若不能直接定位，只能逐步关闭参数（如 ssl/llvm等），进行排查
#### 3.附录：
###### 1> jemalloc使用方法：
- 在debug版本下，设置环境变量：
export MALLOC_CONF=prof:true,prof_final:false,prof_gdump:true,lg_prof_sample:20
其中最后的20表示每2^20B（1MB）产生一个heap文件，该值可以调，但是调大以后，虽然heap文件会减少，但也会丢失一些内存申请信息。
- source 环境变量后，启动集群。
- 使用jeprof处理heap文件，生成pdf。jeprof在开源第三方二进制目录下，binarylibs/${platForm}/jemalloc/debug/bin下可以获取，此外使用该二进制需要安装graphviz，可以通过yum install graphviz安装。
- 生成pdf的命令：
全量：jeprof –show_bytes –pdf gaussdb *.heap > out.pdf
增量：jeprof –pdf gaussdb –base=start.heap end.heap > out.pdf
###### 2> ASAN使用方法：
- 检查操作系统配置：ulimit -v unlimited && vm.overcommit_memory不为0
- 停止集群，在环境变量加入（单机部署中的.bashrc文件中)： export ASAN_OPTIONS=halt_on_error=0:alloc_dealloc_mismatch=0:log_path=/tmp/memcheck/memcheck 其中log_path设置错误信息输出位置，目录为“/tmp/memcheck/”，文件名前缀为“memcheck”。
