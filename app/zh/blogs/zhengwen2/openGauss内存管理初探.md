---
title: 'openGauss内存管理初探'

date: '2021-07-10'
category: 'blog'
tags: ['openGauss内存管理初探']

archives: '2021-07'

author: '李士福'

summary: 'openGauss内存管理初探'

img: '/zh/blogs/zhengwen2/img/img5.png'

times: '12:30'
---

上周，有小伙伴在 openGauss 技术交流群里问在编码开发过程中如何进行内存分配，使用时感觉和 PostgreSQL 使用方式有些不同。的确如这位同学所想，openGauss 的内存管理尽管继承了 PostgreSQL 的内存管理机制，但进行了多方面的扩展和改造，目的是适配多线程架构，更好的满足企业化应用诉求。openGauss 内存管理主要做了如下的功能：

- 引入 jemalloc 开源库，替换 glibc 的内存分配和释放，减少内存碎片
- 引入逻辑内存管理机制，控制进程内存使用，避免出现 OOM 问题
- 引入多种内存上下文（共享内存上下文、栈式内存上下文、对齐内存上下文），满足不同场景代码开发诉求
- 引入 ASAN（Address Sanitizer）开源库，在 Debug 版本下定位内存泄漏和内存越界问题
  引入丰富的内存查询视图，方便观察内存使用情况，定位潜在内存问题

下面基于上面的功能特性，从开发和使用者两方面阐述一下如何在编码过程中使用内存以及如在问题出现时快速定位问题。

### 1. openGauss 内存管理开发注意事项

openGauss 中内存分配和释放接口，仍然同 PostgresSQL 内存上下文使用方式一样；通用内存上下文使用的数据结构和算法没有大的变化，新增内存上下文使用新的数据结构来实现，大家可以先看看相关文章了解 PostgreSQL 的内存上下文机制。

默认情况下，使用`AllocSetContextCreate`函数创建内存上下文。在这需要注意是否指定内存上下文的类型，默认不指定，则使用`STANDARD_CONTEXT`标识符来创建通用内存上下文，该内存上下文的作用域仅用于单个线程内，随着线程退出或者作业重置，需要进行内存上下文清理，防止内存堆积。线程中的内存上下文的根节点是 `TopMemoryContext（即代码中的 t_thrd.top_mem_cxt）`，通常在代码中禁止从 `TopMemoryContext` 内存上下文上申请内存，在使用时根据内存作用域从相应的内存上下文节点上创建子节点，父子节点均为通用内存上下文。

因为 openGauss 是多线程架构，通常会使用共享内存来保存关键信息用于多线程访问和更新。

在创建内存上下文时，需要明确指定`SHARED_CONTEXT`标识符，同时需要保证父节点均为共享内存上下文。

共享内存上下文的根节点为`ProcessMemory（即代码中的 g_instance.instance_context）`，默认情况下不在该内存上下文上分配内存。

共享内存上下文的可分配内存通常是受限的，因为内存使用的主体在作业执行过程，所以开发人员需要自行限制共享内存上下文最大可申请内存的大小（可通过成员数量限制或者淘汰机制实现），建议不超过 200MB。

在共享内存上下文上分配内存或者释放内存的操作，不需要额外加锁，直接调用 palloc 或者 pfree 即可，但申请内存后返回的指针后续操作需要用户根据调用逻辑来决定是否需要锁保护。

栈式内存上下文的实现机理很简单，和传统内存上下文不同，没有使用 buddy 算法进行 2 幂次方对齐，故分配内存时仅需 8 字节对齐，可以节省大量内存空间。栈式内存上下文适用于仅调用 palloc 分配内存，不需要进行 pfree 操作，在内存上下文不再进行使用时一次进行 `MemoryContextDelete` 或者 `MemoryContextReset，可以参考` hashjoin 算子使用内存的逻辑。对齐内存上下文用于内存页对齐，适用于 ADIO 场景，当前代码中很少应用。

除了上述指定 `MemoryContextCreate` 创建内存上下文场景，还有通过 hash_create 函数创建 hash 表时隐含创建的内存上下文，故 hash_create 创建的 hash 表也分为通用 hash 表（用于单个线程内部）以及共享 hash 表（可以用于整个进程共享），创建共享 hash 表时，需要指定 HASH_SHRCTX 参数，且参数中指定的父内存上下文也需要是共享内存上下文。

上述总结了内存上下文创建和使用的基本方法，对于内存上下文的分配和释放还有如下要求，总结如下：

- 内存上下文分为线程级别（如 TopMemoryContext)、Session 级别（MessageMemoryContext）、作业级别（ExecutorState)、算子级别（HashJoin），不允许执行作业时到高级别的内存上下文上申请内存
- 不允许频繁申请和释放同一内存上下文，即使是临时内存上下文，最低力度做到每个算子只申请和释放一次
- 对于不使用的内存及内存上下文，要及时释放；算子执行完成后，算子内存上下文 及时释放
- 非重度内存消耗算子（hashjoin/hashagg/setop/material/windowsagg）消耗内存原则上不允许超过 10MB；若超过该限额，需给出评估依据
- 共享内存上下文使用时需要进行总量的控制，原则上不允许超过 200MB 的内存使用若超过，需要进行评估
- 全局变量指针在内存释放后置空，即调用 pfree_ext 函数进行置空
- 一次性分配数组内存时，访问、写入数组的下标对应内存时，对数组下标加入 Assert 判断，防止越界

### 2.openGauss 内存定位方法介绍

#### 1 出现报错 “memory is temporarily unavailable”

观察日志，是否为`reaching the database memory limitation`，表示为数据库的逻辑内存管 理机制保护引起，需要进一步分析数据库的视图；若为`reaching the OS memory limitation` ，表示为操作系统内存分配失败引起，需要查看操作系统参数配置及内存硬件情况等。

**数据库逻辑内存保护需要查看下列视图：**

- pg_total_memory_detail 观察当前数据库内部模块使用内存情况。当 dynamic_used_memory 大于 max_dynamic_memory 就会报内存不足。如果此时 dynamic_used_memory 小 max_dynamic_memory，而 dynamic_peak_memory 大于 max_dynamic_memory 表明曾经出现内存不足的情况。如果是 other_used_memory 较大，则只能通过更换 Debug 版本进一步定位。SQL 语句为： `Select \* from pg_total_memory_detail`;
- 如果 dynamic_used_shrctx 较大，则查询 gs_shared_memory_detail 视图，观察是哪个 MemoryContext 使用内存较多。SQL 语句为：`Select \* from gs_shared_memory_detail`;
- 如果 dynamic_used_shrctx 不大，则查询 gs_session_memory_detail 视图，观察是哪个 MemoryContext 使用内存较多。SQL 语句为：`Select \* from gs_session_memory_detail order by totalsize desc limit 20`;
- 发现内存上下文后，若不好定位，进一步排查内存上下文上哪个地方问题，需要在 Debug 版本使用 memory_tracking_mode 进一步定位文件和行号；
- 若内存上下文无异常，需要查看线程数量是否很高，可能是由于 CacheMemoryContext 引起。
- 可以在 debug 版本下，通过 gdb 脚本，把内存上下文上的分配信息打印出来

#### 2 出现数据库节点 RES 很高或者节点宕机“Out of Memory”

- 首先读取`/var/log/messages` 中的信息，看看是哪个进程引起的，通常是由 gaussdb 引起；若 gaussdb 进程内存引起，进一步看是否正确配置 max_process_memory 参数
- 若配置合理，进一步观察 pg_total_memory_detail 视图是否为 Other 内存占用 过高
- 若内存增长快速，且主要为内存上下文使用，可以通过 jemalloc profiling 快 速定位哪个地方申请的内存；
- 若 Other 内存过高，可能是由于第三方组件或者 libpq 等直接 malloc 内存引起的 ，需要通过 ASAN 工具进一步排查；若不能直接定位，只能逐步关闭参数（如 ssl/llvm 等），进行排查

### 3.附录：

#### 1 jemalloc 使用方法：

- 在 debug 版本下，设置环境变量：
  `export MALLOC_CONF=prof:true,prof_final:false,prof_gdump:true,lg_prof_sample:20`
  其中最后的 20 表示每 `2^20B（1MB）`产生一个 heap 文件，该值可以调，但是调大以后，虽然 heap 文件会减少，但也会丢失一些内存申请信息。
- source 环境变量后，启动集群。
- 使用 jeprof 处理 heap 文件，生成 pdf。jeprof 在开源第三方二进制目录下，`binarylibs/${platForm}/jemalloc/debug/bin `下可以获取，此外使用该二进制需要安装 graphviz，可以通过 `yum install graphviz` 安装。
- 生成 pdf 的命令：
  全量：`jeprof –show_bytes –pdf gaussdb \*.heap > out.pdf`
  增量：`jeprof –pdf gaussdb –base=start.heap end.heap > out.pdf`

#### 2 ASAN 使用方法：

- 检查操作系统配置：`ulimit -v unlimited && vm.overcommit_memory 不为 0`
- 停止集群，在环境变量加入（单机部署中的.bashrc 文件中)： `export ASAN_OPTIONS=halt_on_error=0:alloc_dealloc_mismatch=0:log_path=/tmp/memcheck/memcheck` 其中 log_path 设置错误信息输出位置，目录为`/tmp/memcheck/`，文件名前缀为“memcheck”。
