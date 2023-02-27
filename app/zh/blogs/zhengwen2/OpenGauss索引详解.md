---
title: 'openGauss索引详解'

date: '2021-07-10'
category: 'blog'
tags: ['openGauss索引详解']

archives: '2021-07'

author: '吴松'

summary: 'OpenGauss索引详解'

img: '/zh/blogs/zhengwen2/img/img22.jpg'

times: '12:30'
---

本文主要介绍 openGauss 中常见的索引结构，索引相关元数据，并结合代码重点讲解 B-tree 索引使用过程中的重要流程，希望对大家理解 openGauss 中的索引有所帮助。

## 索引方法

### B-Tree 索引

B-tree 索引适合比较查询和范围查询，当查询条件使用(`&gt;,=,&lt;,&gt;=,&lt;=`)时，可以使用 B-tree 索引。B-tree 索引是 PostgreSQL 和 OpenGauss 的默认索引方式。

<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210708-38cc07a3-f562-49d2-8b56-8267d1f7ffe0.png" alt="image.png" />

#### 图-1 B-tree 索引结构

B-tree 索引页分为几种：meta-page、root-page、branch-page 和 leaf-page，如图-1 所示。

- meta-page: B-tree 索引的元数据页，主要存储 B-tree 索引的元数据信息，可以通过 meta page 找到 root page 信息。
- root-page：B-tree 的根节点。
- branch-page：内部节点，B-tree 中根节点和叶子节点外的其他节点。
- leaf-page：叶子节点，其中的 ctid 指向 heap tuple，非叶子节点的 ctid 指向其子节点。

安装 pageinspect 后，可以通过

```
select _ from bt_metap(‘tab_pkey’) 查看 meta-page 信息
select _ from bt_page_stats(‘tab_pkey’,1) 查看索引页信息
select \* from bt_page_items(‘tab_pkey’,1) 查看页内 tuple 信息
```

index page 结构如图-2 所示，
High-Key 表示此 page 的右兄弟节点的最小值，由于 page 之间数据是有序的，当前 page 内所有 `key &lt;= High-Key` 的值。
对 unique index 而言，当前 page 内所有 `key &lt; High-Key` 的值。
每一层的最右侧节点，由于没有右兄弟节点，因此 page 内没有 High-Key。

Special Space 为索引页特有，由于存储每个 page 左右两边 page 的页号，可通过 Special Space 找到左右 page。

<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210708-d12f8d1f-b9e0-42ec-aec8-4a262b545b78.png" alt="image.png" />

#### 图-2 B-tree 索引页结构

以上是行存引擎的 B-tree 索引结构，列存的 B-tree 索引整体结构上与行存相同。leaf-page 上行存存储的是 key 到 ctid 的映射关系，行存可以直接 ctid 中的 block number 及 offset 找到 heap tuple 的位置。列存的 ctid 中记录的是（cu_id, offset），还需要再对应的 CUDesc 表中根据 cu_id 列的索引找到对应的 CUDesc 记录，打开对应的 CU 文件，根据 offset 找到数据。
列存上的 B-tree 索引不支持创建表达式索引、部分索引和唯一索引。

GiST 索引

> GiST(Generalized Search Tree)也是一棵平衡树，B-tree 和比较语义强关联，适用于（`&gt;、&gt;=、=、&lt;=、&lt;`）这五个操作符。但现代数据库中存储的一些数据，如地理位置、图像数据等这五个操作符可能没有实际意义，GiST 索引允许定义规则来将数据分布到平衡树中，并允许定义方法来访问数据。例如，GiST 索引可以定义一棵存储空间数据的 R-Tree，支持相对位置运算符（如 位于左侧、右侧、包含等）。
> GiST 屏蔽了数据库的内部工作机制，比如锁的机制和预写日志，使得实现新的 GiST 索引实例（或称作索引操作符类）的工作相对比较轻松。基于 GiST 架构的索引操作符类只需实现预定义的几个接口。

GIN 索引

> Generalized Inverted Tree 倒排索引。主要用于多值类型，如数组、全文索引等。如果对应的 TID 的列表很小，可以和元素放在一个页面内（称为 posting list）。如果 TID 列表很大，需要使用更高效的数据结构 B-tree，这棵 B-tree 存储在单独的页面中（称为 posting tree）。

<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210708-c8cea678-9d44-4338-9429-74034a4094e2.png" alt="image.png" />

#### 图-3 GIN 索引结构

行存表支持的索引类型：B-tree（缺省值）、GIN、GiST。列存表支持的索引类型：Psort（缺省值）、B-tree、GIN。

## 索引相关系统表

### pg_am

PG_AM 系统表存储有关索引访问方法的信息。系统支持的每种索引访问方法都有一行。表中各个字段的含义可以参考官方文档：
<a href="https://opengauss.org/zh/docs/2.0.0/docs/Developerguide/PG_AM.html" target="_blank">https://opengauss.org/zh/docs/2.0.0/docs/Developerguide/PG_AM.html</a>

### pg_index

PG_INDEX 系统表存储索引的一部分信息，其他的信息大多数在 PG_CLASS 中。

对于分区表的 partition local index，除了在 pg_index 中有一行数据外，每个分区的索引信息存储在 pg_partition 中。
表中具体字段含义参考官方文档：

<a href="https://opengauss.org/zh/docs/2.0.0/docs/Developerguide/PG_INDEX.html" target="_blank">https://opengauss.org/zh/docs/2.0.0/docs/Developerguide/PG_INDEX.html</a>

其中 indisvalid、indisready、indcheckxmin 等字段会在后续内容详细介绍。
除了上述两张表外，索引使用流程中涉及的相关的系统表还有很多，如 `pg_class、pg_attribute、pg_depend、pg_constraint` 等不一一介绍了，大家参考官方文档。

## 索引使用流程

### 创建索引

创建索引入口函数

#### DefineIndex

- 创建索引相关参数检查及校验
- 调用 index_create 完成索引创建主要工作。所有索引创建都需要调用 index_create，通过入参决定是不是需要构建索引结构。有一些流程，如 create index concurrently，或者 分区表的 partition local index，在这一步实际只是创建索引相关元数据，构建索引结构在后续流程完成。非分区表的 index、分区表的 global index 构建索引结构在这一步完成。
- 如果是创建分区表的 partition local index ，遍历所有分区，逐个分区调用 partition_index_create 创建分区索引。
- 如果是 create index concurrently，执行 create index concurrently 的流程。此流程中表上加的锁类型是 ShareUpdateExclusiveLock，不会阻塞对表的 read 及 DML 操作，普通建索引流程加的锁类型是 ShareLock，会阻塞 DML 操作。分区表不允许 create index concurrently。

#### index_create

- 参数检查及校验
- 创建 index tuple descriptor，tuple descriptor 用于描述 tuple 的结构，index tuple descriptor 中很多属性是从对应的表的 tuple descriptor 中拷贝过来的。最终 relcache 中索引的 tuple descriptor 很多信息来自这里创建的 tuple descriptor。 ConstructTupleDescriptor
- 为索引生成新的 OID。 GetNewRelFileNode
- 将索引信息插入 relcache 中；在磁盘上创建索引文件，新建索引文件会记录 WAL，新建索引时 relfilenode 设置为和 OID 相同；如果是 concurrent create index 或者创建分区表的 partition local index，会跳过创建索引文件。heap_create
- 插入 pg_class 、pg_attribute、pg_index、pg_constraint、pg_depend 等系统表。
- 执行构建索引流程，非分区表的 index，及分区表的 global index 会在这一步真正构建索引结构。分区表的 partition local index，会跳过这一步；如果是 create index concurrently，跳过这一步。 index_build
- 在 pg_object 中记录索引创建时间。

#### index_build

执行构建索引，在调用 index_build 之前，索引相关元数据已经插入，空的索引文件已经创建。index_build 根据 pg_am 中 ambuild 指定的创建索引的处理函数，执行构建索引的流程。

- 根据 pg_am 和索引类型找到构建索引对应的 procedure，例如：btree 索引的 ambuild 是 btbuild、gin 索引的 ambuild 是 ginbuild。调用对应的处理函数。index_build_storage
- 索引构建完成后，如果构建过程中不是 hot safe 的，需要将 pg_index 中索引的 indcheckxmin 设置为 true。设置 indcheckxmin 的目的是告诉其他事务，本索引可能是 unsafe 的。对应的事务在生成执行计划的收，如果发现索引的 indcheckxmin 标记为 true，则需要比较创建索引的事务和当前事务的先后顺序，决定是否能使用索引。
- 更新 pg_class 中表和索引相关字段，如表中是否有索引的字段 relhasindex 设置为 true，relallvisible 设置为 true。

#### btbuild

不同类型的索引，对应的建索引的处理函数不同。btbuild 是 B-tree 索引对应的处理函数。

- 构建一个 BTBuildState 对象，用于 btbuild。BTBuildState 中包含两个 BTSpool 对象指针，用于将 heap tuple 加载到内存中，以及 heap tuple 的排序。BTSpool 中包含一个 Tuplesortstate 类型的指针，Tuplesortstate 中用于记录 tuple sort 过程中的状态，维护 tuple sort 所需的内存空间/磁盘空间。
- 执行 heap scan。如果是普通建索引，需要读取所有 heap tuple（SNAPSHOT_ANY），然后判断 heap tuple 是否需要被索引。如果是 create index concurrently 基于 MVCC snapshot 读取 heap tuple（SNAPSHOT_MVCC），每个读取出来的 heap tuple 抽取出索引需要的列信息。 对于 heap-only-tuple，index tuple 中的 tid 指向 hot-chain 的 root。IndexBuildHeapScan ? GlobalIndexBuildHeapScan
- 对扫描出的 heap tuple 进行排序；基于排完序的 index tuple，构建完整的 B-tree 索引。\_bt_leafbuild

#### \_bt_leafbuid

- 对 index tuple 进行排序。tuplesort_performsort
- 基于排完序的 index tuple，构建完整的 B-tree 索引。\_bt_load

#### \_bt_load

- 遍历所有排好序的 index tuple，逐个调用\_bt_buildadd 加入到 B-tree page 中。B-tree 从叶子节点开始构建，每一层从左向右构建。如果 page 写满了会触发下盘，同时创建同层右侧 page；如果上层父 page 不存在，还会创建父 page；如果已经存在父 page，则将本 page 的 minkey 和 页号插入父节点。插入父节点的过程和插入子节点类似，可能触发父节点下盘等动作。index page 会在 special space 记录左右两侧 page 的页号。每个 page 都会记 WAL。
  <img src="https://oss-emcsprod-public.modb.pro/image/editor/20210708-341c9dc8-4f5e-4f3a-b05d-bd924173a32b.png" alt="image.png" />

#### 图-4 B-tree 索引页构建

- 由于构建 B-tree 的过程是自左向右、自底向上，触发 page 下盘是 page 写满时，所以所有 index tuple 遍历完后，每一层的最右侧 page 可能还没有下盘及加入父节点。因此所有 index tuple 遍历完成后，还需要对每一层的最右侧节点做一次处理。每一层的最右侧节点没有 HK，所以最终所有的 ItemPointer 需要向左移动一个位置。 B-tree 索引构建完成后，还需要构建 meta-page，所有 page 都会写 WAL，在流程结束前会主动调一次 fsync，让 WAL 下盘。 \_bt_uppershutdown
  <img src="https://oss-emcsprod-public.modb.pro/image/editor/20210708-cc2deeed-e301-4ac5-9f35-8df7b79480d9.png" alt="image.png" />

#### 图-5 B-tree 索引每层最右侧 page 结构

#### partition_index_create

用于创建分区表的 partition local index。创建分区表的 partition local index 时，先获取分区信息，然后遍历每一个分区执行 partition_index_create。

- 为 partition local index 生成新的 OID
- 向 partcache 中插入索引相关信息，创建 partition local index 索引文件，记录 WAL。 heapCreatePartition
- 在 pg_partition 中插入 partition local index 相关信息。insertPartitionEntry
- 执行索引构建。index_build
- 更新 pg_class 中表和索引信息。

#### create index concurrently

用于在不阻塞 DML 操作的情况下创建索引。
**Phase 1**

- 开启事务 tx1
- 插入 relcache，插入索引相关元数据 pg_class… ，和普通建索引相同，只是其中 pg_index 的 indisvalid、indisready 设置为 false
- 在表上 加一个 session-level ShareUpdateExclusiveLock，加锁目的是防止在建索引的流程中表和索引元数据被其他流程修改
- 提交事务 tx1。tx1 提交后，新开启的事务将会看到索引信息，索引状态为不可读(indisvalid = false)、不可写(indisready = false)，看到索引元数据的事务在插入数据时会考虑 HOT-safe。

**Phase 2**

- 开启事务 tx2
- 等待当前在执行的 DML 事务结束。具体实现是：找出当前所有持有的锁与 ShareLock 冲突的事务 ID，等待这些事务提交或者 Abort 。这一步等待的目的是什么？ 举例：表有两列{id, name}，数据如图-6 所示，在 id 字段建索引。在 Phase 1 结束前开始的事务 tx，无法看到索引元数据，所以在更新数据时做 HOT update；Case1：由于流程中没有等待事务结束，建索引流程扫描 heap tuple 时，对应的 heap tuple 为{id：3，name: ‘dd’}，index 中对应的 key 是 3，tx 在索引扫描完后更新{id：3，name: ‘dd’} 这行数据为 {id：4，name: ‘dd’}，因此索引中的数据实际是错误的。普通建索引流程，因为阻塞 DML 操作，因此不会出现该问题。 Case2： 如果 tx 是一个在 Phase 1 之后开启的事务，由于索引元数据可见，update 操作发现对应的列上有索引，在更新数据时不会知道这不是一个 HOT update，此时因为建索引和 update 的执行顺序，也会出现索引数据遗漏，索引数据如图-7 所示。 由于现在索引本身还是一个中间状态，对读写操作都不可见，所以这里数据有偏差不是什么大问题，只需要最终索引数据正确即可。Case2 索引数据出现的遗漏，会在 Phase 3 中补全；而 Case1 出现的错误不会被修复，因为一条 hot-chain 上的所有 tuple 只会有一个 index entry。
  <img src="https://oss-emcsprod-public.modb.pro/image/editor/20210708-d9733e93-43a4-4e5e-9682-ea5dd008d01c.png" alt="image.png" />

#### 图-6 不等待 Phase 1 之前的 DML 结束导致的索引数据错误

<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210708-745a4bc3-c8f1-485f-b28d-90e6c3514af4.png" alt="image.png" />

#### 图-7 不等待 Phase 1 之后的 DML 结束导致的索引数据遗漏

- 获取快照 snapshot1
- 扫描表中的所有可见元组，构建索引
- 设置索引的 indisready 为 true（索引对写操作可见）
- 提交 tx2。tx2 提交后新开启的事务更新数据时，会同时更新索引。

  **Phase 3**

- 开启事务 tx3
- 等待当前在执行的 DML 事务结束。这里时为了等待 Phase 2 结束前开始的事务，这些事务看不到索引 `indisready = true`，在更新数据时没有更新索引。
- 获取快照 snapshot2
- 为 Phase2 开始后没有更新索引的 DML 操作执行索引更新。 validate_index
- 记录 snapshot2’s 中的 xmin
- 提交事务 tx3
  **Phase 4**
- 开启事务 tx4
- 等待 Phase 3 之前开启的事务结束，这些事务可能持有一个比较老的 snapshot，如果不等待这些事务结束就将索引的 indisvalid 设置为 true，这些事务可能出现读不一致的情况。如图-8 所示，事务 txA 在 Phase 3 之前开启，读取数据 r1，紧接着 txB delete r1；Phase 3 中 tx3 执行建索引时，由于对应的数据删除了，因此索引中没有 r1 的记录，tx3 提交后索引的 indisvalid 设置为 true，索引读可见，t’xA 第二次读数据时使用索引，发现没有对应的数据，出现数据读一致的情况。为防止这种情况，需要在把索引的 indisvalid 设置为 true 之前，等待这些事务结束。
  <img src="https://oss-emcsprod-public.modb.pro/image/editor/20210708-7ae2be57-5c11-4256-abe7-6758f2e8622c.png" alt="image.png" >

#### 图-8 等待读事务结束

- 将索引的 indisvalid 设置为 true
- 提交 tx4

### 删除索引

和创建索引类似，删除索引也有 concurrent 和非 concurrent 两种方式，对应的加锁类型分别是 ShareUpdateExclusiveLock 和 AccessExclusiveLock。

#### index_drop

#### concurrently

- 开启事务 tx1
- 索引 indisvalid 设置为 false，记 WAL。`index_set_state_flags(indexId, INDEX_DROP_CLEAR_VALID)`
- 表的 relcache 失效，表和索引上加会话级别的 ShareUpdateExclusiveLock，防止流程执行期间，其他流程修改元数据，例如 drop table
- 提交事务 tx1。tx1 提交后，新的事务查询不会使用该索引。
- 开启事务 tx2
- 等待所有的事务结束，有一些事务在 tx1 提交前已经开启，要确保没有事务查询使用该索引，需要等这些事务结束。
- 设置索引的 indisready 为 false，indisvalid 为 true ? 有疑问，表的 relcache 失效
- 提交事务 tx2
- 开启事务 tx3
- 等待所有的事务结束，有一些事务在 tx2 提交前已经开启，要确保没有事务更新该索引，需要等这些事务结束。
- 表加 ShareUpdateExclusiveLock，索引上加 AccessExclusiveLock，为删除索引文件做准备
- 删除索引文件
- 删除 pg_index 中索引数据，删除 pg_class、pg_attribute 中索引相关数据，刷新缓存
- 释放会话级 ShareUpdateExclusiveLock

非 concurrent 删除索引流程上更简单一些，在表和索引上加 AccessExclusiveLock，删除索引文件和相关元数据，刷新缓存。
限于篇幅，索引相关其他内容，如重建索引，索引插入，索引的读写并发等内容下次再补充。
