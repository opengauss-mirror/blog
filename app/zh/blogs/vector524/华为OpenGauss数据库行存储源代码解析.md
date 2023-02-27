---
title: '华为OpenGauss数据库行存储源代码解析'
date: '2021-12-01'
category: 'blog'
tags: ['华为OpenGauss数据库行存储源代码解析']
archives: '2021-12'
author: 'vector'
summary: '华为OpenGauss数据库行存储源代码解析'
times: '17:30'
---

# 华为 OpenGauss 数据库行存储源代码解析

​ 根据存储介质和并发控制机制，存储引擎分为磁盘引擎和内存引擎两大类。磁盘引擎主要面向通用的、大容量的业务场景，内存引擎主要面向容量可控的、追求极致性能的业务场景。在磁盘引擎中，为了满足不同业务场景对于数据不同的访问和使用模式，openGauss 进一步提供了 astore（append-store，追加写优化格式）、cstore（column store，列存储格式）以及可拓展的数据元组和数据页面组织格式。astore 为行存储格式，向上提供元组形式的读、写。

## 1. 数据库表的创建

​ 查找到了关于数据库创建表的内容：在 opengauss 数据库源码中位于`src\gausskernel\optimizer\commands\tablecmds.cpp`，DefineRelation 此函数是最终创建表结构的函数，最主要的参数是 CreateStmt 这个结构，该结构如下：

```
typedef struct CreateStmt {
    NodeTag type;
    RangeVar *relation;             /* relation to create */
    List *tableElts;                /* column definitions (list of ColumnDef) */
    List *inhRelations;             /* relations to inherit from (list of
                                     * inhRelation) */
    TypeName *ofTypename;           /* OF typename */
    List *constraints;              /* constraints (list of Constraint nodes) */
    List *options;                  /* options from WITH clause */
    List *clusterKeys;              /* partial cluster key for table */
    OnCommitAction oncommit;        /* what do we do at COMMIT? */
    char *tablespacename;           /* table space to use, or NULL */
    bool if_not_exists;             /* just do nothing if it already exists? */
    bool ivm;                       /* incremental view maintenance is used by materialized view */
    int8 row_compress;              /* row compression flag */
    PartitionState *partTableState; /* the PartitionState */
#ifdef PGXC
    DistributeBy *distributeby; /* distribution to use, or NULL */
    PGXCSubCluster *subcluster; /* subcluster of table */
#endif

    List *tableEltsDup; /* Used for cstore constraint check */
    char *internalData; /* Used for create table like */

    List *uuids;        /* list of uuid, used for create sequence(like 'create table t(a serial))' */
    Oid oldBucket;      /* bucketoid of resizing table */
    List *oldNode;      /* relfilenode of resizing table */
    List *oldToastNode; /* toastnode of resizing table  */
    char relkind;       /* type of object */
} CreateStmt;
```

​ 结构中 relation 中包含了 catalogname,schemaname,relname 此时的 relname 就能够顺利的拿到。`DefineRelation`函数中用到的函数的功能和执行流程如下（参考了 postgre 数据库的执行流程）：

DefineRelation->

| Permission check               | 进行权限检査，确定当前用户是否有权限创建表。                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| transformRelOptions()          | 对表创建语句中的 WITH 子句进行解析                                                                              |
| heap_reloptions()              | 调用 heap_reloptions 对参数进行合法性验证。                                                                     |
| MergeAttributes()              | 使用 MergeAttributes，将继承的属性合并到表属性定义中。                                                          |
| BuildDescForRelation()         | 调用 BuildDescForRelation 利用合并后的属性定义链表创建 tupleDesc 结构（这个结构用于描述元组各属性结构等信息）。 |
| interpretOidsOption()          | 决定是否使用系统属性 OID (interpretOidsOption)。                                                                |
| CONSTR_DEFAULT or CONSTR_CHECK | 对属性定义链表中的每一个属性进行处理，査看是否有默认值、表达式或约束检査。                                      |
| heap_create_with_catalog()     | 使用 heap_create_with_catalog 创建表的物理文件并在相应的系统表中注册。                                          |
| StoreCatalogInheritance()      | 用 StoreCataloglnheritance 存储表的继承关系。                                                                   |
| AddRelationNewConstraints()    | 处理表中新增的约束与默认值                                                                                      |
| ObjectAddressSet()             |                                                                                                                 |

​ <img src="https://pic.imgdb.cn/item/6183804b2ab3f51d91a6ca14.jpg">

## 2. 页面组织和元组结构

astore 的设计遵从段页式，存储结构以页面为单位，页面大小一般默认为 8KB。

### 2.1 页面组织结构

<img src="https://pic.imgdb.cn/item/617a5d052ab3f51d91df7009.jpg">

​ `\src\include\storage\buf\bufpage.h`

```
typedef struct {
    PageXLogRecPtr pd_lsn;    /* 页面最新一次修改的日志lsn */
    uint16 pd_checksum;       /* 页面CRC */
    uint16 pd_flags;           /* 标志位 */
    LocationIndex pd_lower;   /* 空闲位置开始出（距离页头） */
    LocationIndex pd_upper;   /* 空闲位置结尾处（距离页头） */
    LocationIndex pd_special; /* 特殊位置起始处（距离页头） */
    uint16 pd_pagesize_version;
    ShortTransactionId pd_prune_xid;
    TransactionId pd_xid_base;
    TransactionId pd_multi_base;
    ItemIdData pd_linp[FLEXIBLE_ARRAY_MEMBER];
} HeapPageHeaderData;
```

1.  pd_lsn：该页面最后一次修改操作的预写日志结束位置的下一个字节，用于检查点推进和保持恢复操作的幂等性（幂等指对接口的多次调用所产生的结果和调用一次是一致的）。
2.  pd_checksum：页面的 CRC 校验值。
3.  pd_flags：页面标记位，用于保存各类页面相关的辅助信息，如页面是否有空闲的元组指针、页面是否已满、页面元组是否都可见、页面是否被压缩、页面是否是批量导入的、页面是否加密、页面采用的 CRC 校验算法等。
4.  pd_lower：页面中间空洞的起始位置，即当前已使用的元组指针数组的尾部。
5.  pd_upper：页面中间空洞的结束位置，即下一个可以插入元组的起始位置。
6.  pd_special：页面尾部特殊区域的起始位置。该特殊位置位于第一条元组记录和页面结尾之间，用于存储一些变长的页面级元信息，如采用的压缩算法信息、索引的辅助信息等。
7.  pd_pagesize_version：页面的大小和版本号。
8.  pd_prune_xid：页面清理辅助事务号（32 位），通常为该页面内现存最老的删除或更新操作的事务号，用于判断是否要触发页面级空闲空间整理。实际使用的 64 位 prune 事务号由“pd_prune_xid”字段和“pd_xid_base”字段相加得到。
9.  pd_xid_base：该页面内所有元组的基准事务号（64 位）。该页面所有元组实际生效的 64 位 xmin/xmax 事务号由“pd_xid_base”（64 位）和元组头部的“t_xmin/t_xmax”字段（32 位）相加得到。
10. pd_multi_base：类似“pd_xid_base”字段，当对元组加锁时，会将持锁的事务号写入元组中，该 64 位事务号由“pd_multi_base”字段（64 位）和元组头部的“t_xmax”字段（32 位）相加得到。
11. pd_linp：元组指针变长数组。

​ 页面头部分对应 HeapPageHeaderData 结构体。其中，pd_multi_base 以及之前的部分对应定长成员，存储了整个页面的重要元信息；pd_multi_base 之后的部分对应元组指针变长数组，其每个数组成员存储了页面中从后往前的、每个元组的起始偏移和元组长度。如图所示，真正的元组内容从页面尾部开始插入，向页面头部扩展；相应的，记录每条元组的元组指针从页面头定长成员之后插入，往页面尾部扩展；整个页面中间形成一个空洞，供后续插入的元组和元组指针使用。
​ 对于一个一条具体元组，有一个全局唯一的逻辑地址，即元组头部的 t_ctid，其由元组所在的页面号和页面内元组指针数组下标组成；该逻辑地址对应的物理地址，则由 ctid 和对应的元组指针成员共同给出。通过页面、对应元组指针数组成员、页面内偏移和元组长度的访问顺序，就可以完整获取到一条元组的完整内容。t_ctid 结构体和元组指针结构体的定义代码如下。

​ `src\include\storage\item\itemid.h`

```
/* t_ctid结构体*/
typedef struct ItemPointerData {
    BlockIdData ip_blkid;  /* 页号 */
    OffsetNumber ip_posid; /* 页面偏移，即对应的页内元组指针下标 */
} ItemPointerData;
/* 页面内元组指针结构体 */
typedef struct ItemIdData {
    unsigned lp_off : 15, /* 元组起始位置（距离页头） */
        lp_flags : 2,     /* 元组指针状态 */
        lp_len : 15;      /* 元组长度 */
} ItemIdData;
```

​ 如上两级的元组访问设计，主要有两个优点。

- 在索引结构中，只需要保存元组的 t_ctid 值即可，无须精确到具体字节偏移，从而降低了索引元组的大小（节约两个字节），提升索引查找效率；
- 将页面内元组的地址查找关系自封闭在页面内部的元组指针数组中，和外部索引解耦，从而在某些场景下可以让页面级空闲空间整理对外部索引数据没有影响，降低空闲空间回收的开销和设计复杂度。

### 2.2 元组数据部分结构

<img src="https://pic.imgdb.cn/item/617bdc8c2ab3f51d9126d0dc.png">

​ `src\include\access\htup.h`

```
typedef struct HeapTupleFields {
    ShortTransactionId t_xmin; /* 插入元组事务的事务号 */
    ShortTransactionId t_xmax; /* 删除元组事务的事务号 */
    union {
        CommandId t_cid;           /* 插入或删除命令在事务中的命令号 */
        ShortTransactionId t_xvac;
    } t_field3;
} HeapTupleFields;

typedef struct HeapTupleHeaderData {
    union {
        HeapTupleFields t_heap;
        DatumTupleFields t_datum;
    } t_choice;
    ItemPointerData t_ctid; /* 当前元组或更新后元组的行号 */
    uint16 t_infomask2; /* 字段个数和标记位 */
    uint16 t_infomask; /* 标记位 */
    uint8 t_hoff; /* 包括NULL字段位图、对齐填充在内的元组头部大小 */
    bits8 t_bits[FLEXIBLE_ARRAY_MEMBER]; /* NULL字段位图 */
    /* 实际元组数据再该元组头部结构体之后，距离元组头部处偏移t_hoff字节 */
} HeapTupleHeaderData;
```

下面是元组头部结构体定义：

1.  插入元组的事务号
2.  t_xmax，如果元组还没有被删除，那么为零。
3.  t_cid，插入或删除元组的命令号。
4.  t_ctid，当前元组的页面和页面内元组指针下标。如果该元组被更新，为更新后元组的页面号和页面内元组指针下标。
5.  t_hoff，元组数据距离元组头部结构体起始位置的偏移。
6.  t_bits，所有字段的 NULL 空值 bitmap。每个字段对应 t_bits 中的一个 bit 位，因此是变长数组。

​ 数据结构中并没有出现存储元组实际数据的属性，这是因为通过编程技巧，巧妙的将数组的实际数据存放在 heapTupleHeaderData 结构后面的空间。

### 2.3 元组结构

​ 上述元组结构体在内存中使用时嵌入在一个更大的元组数据结构体中，该结构体的定义代码如下。除了保存元组内容的 t_data 成员之外，其他的成员保存了该元组的一些其他系统信息，这些信息构成了该元组剩余的一些系统字段内容：

​ `src\include\access\htup.h`

```
typedef struct HeapTupleData {
    uint32 t_len;           /* 包括元组头部和数据在内的元组总大小 */
    ItemPointerData t_self; /* 元组行号 */
    Oid t_tableOid;         /* 元组所属表的OID */
    TransactionId t_xid_base;
    TransactionId t_multi_base;
    HeapTupleHeader t_data; /* 指向元组头部 */
} HeapTupleData;
```

​ HeapTupleData 是元组在内存中的拷贝，它是磁盘格式的元组读入内存后的存在方式。

## 3. 元组的插入

​ 代码位于`src\gausskernel\storage\access\heap\heapam.cpp`

插入元组之前，首先根据元组内数据和描述符等信息初始化 HeapTuple 结构，函数 heap_form_tuple 实现了这一功能，函数如下：

```
HeapTuple heap_form_tuple(TupleDesc tupleDescriptor, Datum *values, bool *isnull)
```

​ 其中，values 参数是将要插入的元组的各属性数组，isnull 数组用于标识哪些属性为空值。heap_form_tuple 根据 values 和 isnull 数组调用函数`tableam_tops_computedatasize_tuple`，计算形成元组所需要的内存大小，然后为元组分配足够的空间。

<img src="https://pic.imgdb.cn/item/617be18c2ab3f51d912bb9d2.jpg">

<img src="https://pic.imgdb.cn/item/617be1d32ab3f51d912bfde7.jpg">

​ 在进行必要的头部设置后，调用函数`tableam_heap_fill_tuple`向元组中填充实际数据。

​ <img src="https://pic.imgdb.cn/item/617be1ff2ab3f51d912c3193.jpg">

当完成元组在内存的构成后，下一步就可以准备向表中插入元组了，插入元组的接口为`tableam_heap_insert`，但最终真正起作用的是使用 heap_insert 函数向表中插入元组。heap_insert 的作用流程如下：

<img src="https://pic.imgdb.cn/item/617be2252ab3f51d912c5f91.jpg">

1. 首先我们会为新插入的元组（tup）调用 newoid 函数为其分配一个 OID。

2. 初始化 tup，包括设置 t_xmin 和 t_cmin 为当前事务 ID 和当前命令 ID、将 t_xmax 置为无效、设置 tableOid（包含此元组的表的 OID）。

3. 找到属于该表且空闲空间（freespace）大于 newtup 的文件块，将其载入缓冲区以用来插入 tup（调用函数 RelationGetBufferForTuple）。

4. 有了插入的元组 tup 和存放元组的缓冲区后，就会调用 RelationPutHeapTuple 函数将新元组插入至选中的缓冲区。

5. 向事务日志（XLog）写入一条 XLog。

6. 当完成上述过程后，将缓冲区解锁并释放，并返回插入元组的 OID。

   流程如下：

   <img src="https://pic.imgdb.cn/item/617c1fa52ab3f51d9183d626.jpg">

## 4. 元组的删除

​ `src\gausskernel\storage\access\heap\heapam.cpp`

```
TM_Result heap_delete(Relation relation, ItemPointer tid, CommandId cid,
  Snapshot crosscheck, bool wait, TM_FailureData *tmfd, bool allow_delete_self)
```

​ 这是删除一个元组的详细流程，使用 heap_delete 完成，这是我看的有关 postgre 删除元组流程，在刚刚删除元组流程图上多出来一步，就是判断是否则正在被当前事务修改，如果是要将元组的 ctid 指向被修改后的元组物理位置，然后对缓冲区解锁释放，
​ 删除元组主要调用函数 heap_delete 来实现，其主要流程如下:

1.  根据要删除的元组 tid 得到相关的缓冲区，并对其加排他锁。

2.  调用 HeapTupleSatisfiesUpdate 函数检查元组对当前事务的可见性。如果元组对当前事务是不可见的（HeapTupleSatisfiesUpdate 函数返回 HeapTupleInvisible），那么对缓冲区解锁并释放，再返回错误信息。

3.  如果元组正在被本事务修改（HeapTupleSatisfiesUpdate 函数返回 HeapTupleSelfUpdated）或已经修改（HeapTupleSatisfiesUpdate 函数返回 HeapTupleUpdated），则将元组的 ctid 字段指向被修改后的元组物理位置，并对缓冲区解锁、释放，再分别返回 HeapTupleSelfUpdated 和 HeapTupleUpdated 信息。

   <img src="https://pic.imgdb.cn/item/617d09ba2ab3f51d91546c2e.jpg">

4.  如果元组正在被其他事务修改（HeapTupleSatisfiesUpdate 函数返回 HeapTupleBeingUpdated），那么将等待该事务结束再检测。如果事务可以修改（HeapTupleSatisfiesUpdate 函数返回 HeapTupleMayBeUpdated），那么 heap_delete 会继续向下执行。

5.  设置 t_max 为当前事务 ID。到此为止该元组已经被标记删除，或者可以说该元组已经被删除了。

6.  记录 XLog。

7.  如果此元组存在线外数据，即经过 TOAST（过长字段存储技术）的数据，那么还需要将其 TOAST 表中对应的数据删除。调用函数 toast_delete 完成相关工作。

8.  如果是系统表元组，则发送无效消息。

9.  设置 FSM 表中该元组所处文件块的空闲空间值。

<img src="https://pic.imgdb.cn/item/617d09312ab3f51d9153dde8.jpg">

## 5. 多版本元组机制

​ `src\gausskernel\storage\access\heap\heapam.cpp`

```
TM_Result heap_update(Relation relation, Relation parentRelation, ItemPointer otid, HeapTuple newtup,
    CommandId cid, Snapshot crosscheck, bool wait, TM_FailureData *tmfd, bool allow_update_self)
```

​ 下面是对元组的修改，因为 opengauss 是进行更新元组是不是就地修改，所以会存在一个页面会存在元组的多个版本。
多版本元组机制，即为同一条记录保留多个历史版本的物理元组以解决对同一条记录的读、写并发冲突（读事务和写事务工作在不同版本的物理元组上）。下面是举例插入一个元组之后，两次进行更新:

<img src="https://pic.imgdb.cn/item/617d0a462ab3f51d9154fecc.jpg">

<img src="https://pic.imgdb.cn/item/617d0a982ab3f51d915543f8.jpg">

1. 首先事务号为 10 的事务插入一条值为 value1 的新记录。对应的页面修改为：在 0 号物理页面的第一个元组指针指向位置，插入一条“xmin”字段为 10、“xmax”字段为 0、“ctid”字段为（0，1）、“data”字段为 value1 的物理元组。该事务提交，将 CSN 从 3 推进到 4，并且在 CSN 日志中对应事务号 10 的槽位处记下该 CSN 的值。
2. 然后事务号为 12 的事务将上面这条记录的值从 value1 修改为 value2。对应的页面修改为：在 0 号物理页面的第二个元组指针指向位置，插入另一条“xmin”字段为 12、“xmax”字段为 0、“ctid”字段为（0，2）、“data”为 value2 的物理元组。同时保留上面第一条插入的物理元组，但是将其“xmax”字段从 0 修改为 12，将其“ctid”字段修改为（0，2），即新版本元组的物理位置。该事务提交，将 CSN 从 7 推进到 8，并且在 CSN 日志中对应事务号 12 的槽位处记下该 CSN 的值。
3. 最后事务号为 15 的事务将上面这条记录的值从 value2 又修改为 value3，对应的页面修改为：（假设 0 号页面已满）在 1 号物理页面的第一个元组指针指向位置，插入一条“xmin”字段为 15、“xmax”字段为 0、“ctid”字段为（1，1）、“data”字段为 value3 的物理元组；同时，保留上面第 1、第 2 条插入的物理元组，但是将第 2 条物理元组的“xmax”字段从 0 修改为 15，将其“ctid”字段修改为（1，1），即最新版本元组的物理位置。该事务提交，将 CSN 从 9 推进到 10，并且在 CSN 日志中对应事务号 15 的槽位处记下该 CSN 的值。
4. 对于并发的读事务，其在查询执行开始时，会获取当前的全局 CSN 值作为查询的快照 CSN。对于上面同一条记录的 3 个版本的物理元组来说，该读查询操作只能看到同时满足如下两个条件的这个物理元组版本。
   元组“xmin”字段对应的 CSN 值小于等于读查询的快照 CSN。
   元组“xmax”字段为 0，或者元组“xmax”字段对应的 CSN 值大于读查询的快照 CSN。

​ 那么如何知道应该读取哪一个版本的记录？ 与 CSN 有关，CSN 是一个步长为 1 的自增长的全局变量，在事务提交阶段，获取该值，每个非只读事务在运行过程中会取得一个 xid 号，在事务提交时会推进 CSN，同时会将当前 CSN 与事务的 xid 映射关系保存起来（CSNLOG）。
对于上面同一条记录的 3 个版本的物理元组来说，该读查询操作只能看到同时满足如下两个条件的这个物理元组版本。

- 元组“xmin”字段对应的 CSN 值小于等于读查询的快照 CSN。
- 元组“xmax”字段为 0，或者元组“xmax”字段对应的 CSN 值大于读查询的快照 CSN。

​ 并发的读事务会根据自己的查询快照在同一个记录的多个历史版本元组中选择合适的那个来返回。并且即使是在可重复读的事务隔离级别下，只要使用相同的快照总可以筛选出相同的那个历史版本元组。在整个过程中读事务不阻塞任何对该记录的并发写操作（更新和删除）。
可重复读的事务隔离级别，可能发生幻读：一个事务(同一个 read view)在前后两次查询同一范围的时候，后一次查询看到了前一次查询没有看到的行。

​ 如下是更新元组的详细流程：

<img src="https://pic.imgdb.cn/item/617d0c7d2ab3f51d9156f95b.jpg">
