---
title: 'openGauss--MOT配置'

date: '2022-05-24'

category: 'blog'
tags: ['openGauss--MOT配置']

archives: '2022-05'

author: '云和恩墨'

summary: 'openGauss--MOT配置'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# openGauss---MOT 配置

本文出处：[https://www.modb.pro/db/53508](https://www.modb.pro/db/53508)

### MOT 配置

预置 MOT 用于创建工作 MOT。为了获得最佳效果，建议根据应用程序的特定要求和偏好自定义 MOT 配置（在 mot.conf 文件中定义）。

该文件在服务器启动时只读。如果在系统运行中编辑此文件，则必须重新加载服务器才能使修改内容生效。

mot.conf 文件与 postgres.conf 配置文件在同一文件夹下。

阅读总体原则，根据需要查看和配置 mot.conf 文件。

> 说明： 以上描述了 mot.conf 文件中的各个设置。除上述内容外，要了解特定 MOT 功能（如恢复），可参考本用户手册的相关章节。例如，MOT 恢复说明了 mot.conf 文件的恢复，包含影响 MOT 恢复的设置。此外，有关恢复的完整说明，请参阅“MOT 管理”章节的 MOT 恢复。下文各相关章节中还提供了参考链接。

以下介绍了 mot.conf 文件中的各个部分，其包含的设置以及默认值。

### 总体原则

以下是编辑 mot.conf 文件的总体原则。

- 每个设置项都带有默认值，如下所示：

```
# name = value
```

- 可以接受空格或留空。
- 在各行添加#号可进行注释。
- 每个设置项的默认值将作为注释显示在整个文件中。
- 如果参数没有注释并且置入了新值，则定义新设置。
- 对 mot.conf 文件的更改仅在数据库服务器启动或重装时生效。

内存单元的表示如下：

- KB：千字节
- MB：兆字节
- GB：吉字节
- TB：太字节

某些内存单位为 postgresql.conf 中的 max_process_memory 的百分比值。例如，20%。

时间单位表示如下：

- us：微秒
- ms：毫秒
- s：秒
- min：分钟
- h：小时
- d：天

### 重做日志（MOT）

- enable_redo_log = true

指定是否使用重做日志以获得持久性。有关重做日志的详细信息，请参阅 MOT 日志记录：WAL 重做日志。

- enable_group_commit = false

是否使用组提交。

该选项仅在 openGauss 配置为使用同步提交时相关，即仅当 postgresql.conf 中的 synchronization_commit 设置为除 off 以外的任何值时相关。

有关 WAL 重做日志的详细信息，请参阅 MOT 日志记录：WAL 重做日志。

- group_commit_size = 16
- group_commit_timeout = 10 ms

只有当 MOT 引擎配置为同步组提交日志记录时，此选项才相关。即 postgresql.conf 中的 synchronization_commit 配置为 True，mot.conf 配置文件中的 enable_group_commit 配置为 True。

当一组事务记录在 WAL 重做日志中时，需确定以下设置项取值：

group_commit_size：一组已提交的事务数。例如，16 表示当同一组中的 16 个事务已由它们的客户端应用程序提交时，则针对 16 个事务中的每个事务，在磁盘的 WAL 重做日志中写入一个条目。

group_commit_timeout：超时时间，单位为毫秒。例如，10 表示在 10 毫秒之后，为同一组由客户端应用程序在最近 10 毫秒内提交的每个事务，在磁盘的 WAL 重做日志中写入一个条目。

提交组在到达配置的事务数后或者在超时后关闭。组关闭后，组中的所有事务等待一个组落盘完成执行，然后通知客户端每个事务都已经结束。

有关同步组提交日志记录的详细信息，请参阅 MOT 日志类型。

### 检查点（MOT）

- enable_checkpoint = true

是否使用周期检查点。

- checkpoint_dir =

指定检查点数据存放目录。默认位置在每个数据节点的 data 文件夹中。

- checkpoint_segsize = 16 MB

指定检查点时使用的段大小。分段执行检查点。当一个段已满时，它将被序列化到磁盘，并为后续的检查点数据打开一个新的段。

- checkpoint_workers = 3

指定在检查点期间要使用的工作线程数。

检查点由多个 MOT 引擎工作线程并行执行。工作线程的数量可能会大大影响整个检查点操作的整体性能，以及其它正在运行的事务的操作。为了实现较短的检查点持续时间，应使用更多线程，直至达到最佳数量（根据硬件和工作负载的不同而不同）。但请注意，如果这个数目太大，可能会对其他正在运行的事务的执行时间产生负面影响。尽可能低这个数字，以最小化对其他运行事务的运行时的影响。当此数目过高时，检查点持续时间会较长。

> 说明： 有关配置的更多信息，请参阅 MOT 检查点。

### 恢复（MOT）

- checkpoint_recovery_workers = 3

指定在检查点数据恢复期间要使用的工作线程数。每个 MOT 引擎工作线程在自己的核上运行，通过将不同的表读入内存，可以并行处理不同的表。缺省值为 3，可将此参数设置为可处理的核数。恢复后，将停止并杀死这些线程。

> 有关配置的详细信息，请参阅 MOT 恢复。

### 统计（MOT）

- enable_stats = false

设置周期性统计打印信息。

- print_stats_period = 10 minute

设置汇总统计报表打印的时间范围。

- print_full_stats_period = 1 hours

设置全量统计报表打印的时间范围。

以下设置为周期性统计报表中的各个部分。如果没有配置，则抑制统计报表。

- enable_log_recovery_stats = false

日志恢复统计信息包含各种重做日志的恢复指标。

- enable_db_session_stats = false

数据库会话统计信息包含事务事件，如提交、回滚等。

- enable_network_stats = false

网络统计信息包括连接/断连事件。

- enable_log_stats = false

日志统计信息包含重做日志详情。

- enable_memory_stats = false

内存统计信息包含内存层详情。

- enable_process_stats = false

进程统计信息包含当前进程的内存和 CPU 消耗总量。

- enable_system_stats = false

系统统计信息包含整个系统的内存和 CPU 消耗总量。

- enable_jit_stats = false

JIT 统计信息包含有关 JIT 查询编译和执行的信息。

### 错误日志（MOT）

- log_level = INFO

设置 MOT 引擎下发的消息在数据库服务器的错误日志中记录的日志级别。有效值为 PANIC、ERROR、WARN、INFO、TRACE、DEBUG、DIAG1、DIAG2。

- Log/COMPONENT/LOGGER=LOG_LEVEL

使用以下语法设置特定的日志记录器。

例如，要为系统组件中的 ThreadIdPool 日志记录器配置 TRACE 日志级别，请使用以下语法：

```
Log/System/ThreadIdPool=TRACE
```

要为某个组件下的所有记录器配置日志级别，请使用以下语法：

```
Log/COMPONENT=LOG_LEVEL
```

例如：

```
Log/System=DEBUG
```

### 内存（MOT）

- enable_numa = true

指定是否使用可识别 NUMA 的内存。 禁用时，所有亲和性配置也将被禁用。 MOT 引擎假定所有可用的 NUMA 节点都有内存。 如果计算机具有某些特殊配置，其中某些 NUMA 节点没有内存，则 MOT 引擎初始化将因此失败，因此数据库服务器启动将失败。 在此类计算机中，建议将此配置值设置为 false，以防止启动失败并让 MOT 引擎在不使用可识别 NUMA 的内存分配的情况下正常运行。

- affinity_mode = fill-physical-first

设置用户会话和内部 MOT 任务的线程亲和模式。

使用线程池时，用户会话将忽略此值，因为它们的亲和性由线程池控制。但内部 MOT 任务仍然使用。

有效值为 fill-socket-first、equal-per-socket、fill-physical-first、none。

Fill-socket-first 将线程连接到同一个槽位的核上，直到槽位已满，然后移动到下一个槽位。
Equal-per-socket 使线程均匀分布在所有槽位中。
Fill-physical-first 将线程连接到同一个槽位中的物理核，直到用尽所有物理核，然后移动到下一个槽位。当所有物理核用尽时，该过程再次从超线程核开始。
None 禁用任何亲和配置，并让系统调度程序确定每个线程调度在哪个核上运行。

- lazy_load_chunk_directory = true

设置块目录模式，用于内存块查找。

Lazy 模式将块目录设置为按需加载部分目录，从而减少初始内存占用（大约从 1GB 减少到 1MB）。然而，这可能会导致轻微的性能损失和极端情况下的内存损坏。相反，使用 non-lazy 块目录会额外分配 1GB 的初始内存，产生略高的性能，并确保在内存损坏期间避免块目录错误。

- reserve_memory_mode = virtual

设置内存预留模式（取值为 physical 或 virtual）。

每当从内核分配内存时，都会参考此配置值来确定所分配的内存是常驻（physical）还是非常驻（virtual）。这主要与预分配有关，但也可能影响运行时分配。对于 physical 保留模式，通过强制内存区域所跨越的所有页出现页错误，使整个分配的内存区域常驻。配置 virtual 内存预留可加速内存分配（特别是在预分配期间），但可能在初始访问期间出现页错误（因此导致轻微的性能影响），并在物理内存不可用时出现更多服务器错误。相反，物理内存分配速度较慢，但后续访问速度更快且有保障。

- store_memory_policy = compact

设置内存存储策略（取值为 compact 或 expanding）。

当定义了 compact 策略时，未使用的内存会释放回内核，直到达到内存下限（请参见下面的 min_mot_memory）。在 expanding 策略中，未使用的内存存储在 MOT 引擎中，以便后续再使用。compact 存储策略可以减少 MOT 引擎的内存占用，但偶尔会导致性能轻微下降。此外，在内存损坏时，它还可能导致内存不可用。相反，expanding 模式会占用更多的内存，但是会更快地分配内存，并且能够更好地保证在解分配后能够重新分配内存。

- chunk_alloc_policy = auto

设置全局内存的块分配策略。

MOT 内存以 2MB 的块为单位组织。源 NUMA 节点和每个块的内存布局会影响表数据在 NUMA 节点间的分布，因此对数据访问时间有很大影响。在特定 NUMA 节点上分配块时，会参考分配策略。

可用值包括 auto、local、page-interleaved、chunk-interleaved、native。

Auto 策略根据当前硬件情况选择块分配策略。
Local 策略在各自的 NUMA 节点上分配每个数据块。
Page-interleaved 策略从所有 NUMA 节点分配由交插内存 4 千字节页组成的数据块。
Chunk-interleaved 策略以轮循调度方式从所有 NUMA 节点分配数据块。
Native 策略通过调用原生系统内存分配器来分配块。

- chunk_prealloc_worker_count = 8

设置每个 NUMA 节点参与内存预分配的工作线程数。

- max_mot_global_memory = 80%

设置 MOT 引擎全局内存的最大限制。

指定百分比值与 postgresql.conf 中 max_process_memory 定义的总量有关。

MOT 引擎内存分为全局（长期）内存，主要用于存储用户数据，以及本地（短期）内存，主要用于用户会话，以满足本地需求。

任何试图分配超出此限制的内存的尝试将被拒绝，并向用户报告错误。请确保 max_mot_global_memory 与 max_mot_local_memory 之和不超过 postgresql.conf 中配置的 max_process_memory。

- min_mot_global_memory = 0 MB

设置 MOT 引擎全局内存的最小限制。

指定百分比值与 postgresql.conf 中 max_process_memory 定义的总量有关。

此值用于启动期间的内存预分配，以及确保 MOT 引擎在正常运行期间有最小的内存可用量。当使用 compact 存储策略时（参阅上文 store_memory_policy），该值指定了下限，超过下限的内存不会释放回内核，而是保留在 MOT 引擎中以便后续重用。

- max_mot_local_memory = 15%

设置 MOT 引擎本地内存的最大限制。

指定百分比值与 postgresql.conf 中 max_process_memory 定义的总量有关。

MOT 引擎内存分为全局（长期）内存，主要用于存储用户数据，以及本地（短期）内存，主要用于用户会话，以满足本地需求。

任何试图分配超出此限制的内存的尝试将被拒绝，并向用户报告错误。请确保 max_mot_global_memory 与 max_mot_local_memory 之和不超过 postgresql.conf 中配置的 max_process_memory。

- min_mot_local_memory = 0 MB

设置 MOT 引擎本地内存的最小限制。

指定百分比值与 postgresql.conf 中 max_process_memory 定义的总量有关。

此值用于在启动期间预分配内存，以及确保 MOT 引擎在正常运行期间有最小的可用内存。当使用 compact 存储策略时（参阅上文 store_memory_policy），该值指定了下限，超过下限的内存不会释放回内核，而是保留在 MOT 引擎中以便后续重用。

- max_mot_session_memory = 0 MB

设置 MOT 引擎中单个会话的最大内存限制。

指定百分比值与 postgresql.conf 中 max_process_memory 定义的总量有关。

通常，MOT 引擎中的会话可以根据需要分配尽可能多的本地内存，只要没有超出本地内存限制即可。为了避免单个会话占用过多的内存，从而拒绝其他会话的内存，通过该配置项限制小会话的本地内存分配（最大 1022KB）。

请确保该配置项不影响大会话的本地内存分配。

0 表示不会限制每个小会话的本地分配，除非是由 max_mot_local_memory 配置的本地内存分配限制引起的。

- min_mot_session_memory = 0 MB

设置 MOT 引擎中单个会话的最小内存预留。

指定百分比值与 postgresql.conf 中 max_process_memory 定义的总量有关。

此值用于在会话创建期间预分配内存，以及确保会话有最小的可用内存量来执行其正常操作。

- high_red_mark_percent = 90

设置内存分配的高红标记。

这是按照由 max_mot_memory 设置的 MOT 引擎的最大值百分比计算的。默认值为 90，即 90%。当 MOT 占用内存总量达到此值时，只允许进行破坏性操作。其它操作都向用户报告错误。

- session_large_buffer_store_size = 0 MB

设置会话的大缓冲区存储。

当用户会话执行需要大量内存的查询时（例如，使用许多行），大缓冲区存储用于增加此类内存可用的确定级别，并更快地为这个内存请求提供服务。对于超过 1022KB 的会话，任何内存分配都是大内存分配。如果未使用或耗尽了大缓冲区存储，则这些分配将被视为直接从内核提供的巨大分配。

- session_large_buffer_store_max_object_size = 0 MB

设置会话的大分配缓冲区存储中的最大对象大小。

大缓冲区存储内部被划分为不同大小的对象。此值用于对源自大缓冲区存储的对象设置上限，以及确定缓冲区存储内部划分为不同大小的对象。

此大小不能超过 session_large_buffer_store_size 的 1/8。如果超过，则将其调整到最大可能。

- session_max_huge_object_size = 1 GB

设置会话单个大内存分配的最大尺寸。

巨大分配直接从内核中提供，因此不能保证成功。

此值也适用于全局（非会话相关）内存分配。

### 垃圾收集（MOT）

- enable_gc = true

是否使用垃圾收集器（Garbage Collector，GC）。

- reclaim_threshold = 512 KB

设置垃圾收集器的内存阈值。

每个会话管理自己的待回收对象列表，并在事务提交时执行自己的垃圾回收。此值决定了等待回收的对象的总内存阈值，超过该阈值，会话将触发垃圾回收。

一般来说，这里是在权衡未回收对象与垃圾收集频率。设置低值会使未回收的内存保持在较少的水平，但会导致频繁的垃圾回收，从而影响性能。设置高值可以减少触发垃圾回收的频率，但会导致未回收的内存过多。此设置取决于整体工作负载。

- reclaim_batch_size = 8000

设置垃圾回收的批次大小。

垃圾收集器从对象中批量回收内存，以便限制在一次垃圾收集传递中回收的对象数量。此目的是最小化单个垃圾收集传递的操作时间。

- high_reclaim_threshold = 8 MB

设置垃圾回收的高内存阈值。

由于垃圾收集是批量工作的，因此会话可能有许多可以回收的对象，但这些对象不能回收。在这种情况下，为了防止垃圾收集列表变得过于膨胀，尽管已经达到批处理大小限制，此值继续单独回收对象，直到待回收对象小于该阈值，或者没有更多符合回收条件的对象。

### JIT（MOT）

- enable_mot_codegen = true

指定是否对计划查询使用 JIT 查询编译和执行。

JIT 查询执行为在计划阶段准备好的查询准备了 JIT 编译的代码。每当调用准备好的查询时，都会执行生成的 JIT 编译函数。JIT 编译通常以 LLVM 的形式进行。在原生不支持 LLVM 的平台上，MOT 提供了基于软件的回退（Tiny Virtual Machine，TVM）。

- force_mot_pseudo_codegen = false

当前平台支持 LLVM 时，是否使用 TVM（伪 LLVM）。

在原生不支持 LLVM 的平台上，MOT 自动默认为 TVM。

在原生支持 LLVM 的平台上，默认使用 LLVM。该配置项允许在支持 LLVM 的平台上使用 TVM 进行 JIT 编译和执行。

- enable_mot_codegen_print = false

指定是否为 JIT 编译的查询打印发出的 LLVM/TVM IR 代码。

- mot_codegen_limit = 100

限制每个用户会话允许的 JIT 查询数。

### 存储（MOT）

allow_index_on_nullable_column = true

指定是否允许在可空列上定义索引。

### 默认 MOT.conf 文件

最小设置和配置指定将 Postgresql.conf 文件指向 MOT.conf 文件的位置：

```
Postgresql.conf
mot_config_file = '/tmp/gauss/ MOT.conf'

确保max_process_memory设置的值足够包含MOT的全局（数据和索引）和本地（会话）内存。MOT.conf的默认内容满足开始使用的需求。设置内容后续可以优化。
```
