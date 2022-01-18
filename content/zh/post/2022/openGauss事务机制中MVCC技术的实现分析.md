+++

title =  "openGauss事务机制中MVCC技术的实现分析" 

date = "2021-12-27" 

tags = [ "openGauss事务机制中MVCC技术的实现分析"] 

archives = "2021-12" 

author = "luooofan" 

summary = "openGauss事务机制中MVCC技术的实现分析"

img = "/zh/post/2022/title/img16.png" 

times = "12:30"

+++

# openGauss事务机制中MVCC技术的实现分析<a name="ZH-CN_TOPIC_0000001232693237"></a>

## 概述<a name="section16781324111020"></a>

1.  **事务**

    事务是为用户提供的最核心、最具吸引力的数据库功能之一。简单地说,事务是用户定义的一系列数据库操作\(如查询、插入、修改或删除等\)的集合，从数据库内部保证了该操作集合作为一个整体的原子性\(Atomicity\)、一致性\(Consistency\)、隔离性\(Isolation\)和持久性\(Durability\)，这些特性统称事务的ACID特性。

2.  **DBMS中的并发控制**

    并发控制旨在针对数据库中对事务并行的场景，保证 ACID 中的一致性（Consistency）与隔离性（Isolation）。数据库技术中主流的三种并发控制技术分别是： Multi-version Concurrency Control \(MVCC\), Strict Two-Phase Locking \(S2PL\), 以及 Optimistic Concurrency Control \(OCC\)，每种技术也都有很多的变种。

3.  **MVCC**

    MVCC的基本机制是：写事务不会原地修改元组内容，每次写操作都会在旧的版本之上创建新的版本，并且会保留旧的版本。当某个事务需要读取数据时，数据库系统会从所有的版本中选取出符合该事务隔离级别要求的版本。

    MVCC 的主要优点是读数据的锁请求与写数据的锁请求不冲突，以此来实现读不阻塞写，写也不阻塞读。


-   openGauss事务整体架构

    ![](figures/20211017-210839-v2-58a3a0df18e1a92b9cc209036fb149ab_b.jpg)

    在openGauss中，事务的实现与存储引擎的实现有很强关联，代码主要集中在src/gausskernel/storage/access/transam及src/gausskernel/storage/lmgr下，关键文件如图所示。

    -   （1） 事务管理器：事务系统的中枢，它的实现是一个有限循环状态机，通过接受外部系统的命令并根据当前事务所处的状态决定事务的下一步执行过程。
    -   （2） 日志管理器：用来记录事务执行的状态以及数据变化的过程，包括事务提交日志\(CLOG\)、事务提交序列日志（CSNLOG）以及事务日志（XLOG）。其中CLOG日志只用来记录事务执行的结果状态，CSNLOG记录日志提交的顺序，用于可见性判断；XLOG是数据的redo日志，用于恢复及持久化。
    -   （3） 线程管理机制：通过一片内存区域记录所有线程的事务信息，任何一个线程可以通过访问该区域获取其他事务的状态信息。
    -   （4） MVCC机制：openGauss系统中，事务执行读流程结合各事务提交的CSN序列号，采用了多版本并发控制机制，实现了元组的读和写互不阻塞。
    -   （5） 锁管理器：实现系统的写并发控制，通过锁机制来保证事务写流程的隔离性。


## MVCC的实现<a name="section1226195111103"></a>

-   我们需要关注：
    -   元组版本号的实现
    -   快照的实现
    -   判断数据有效性、可见性、可更新性的算法的实现
    -   不同的隔离级别的实现

-   多版本元组存储结构
    -   src/include/access/htup.h

        为了定义MVCC 中不同版本的数据，Opengauss在每个元组的头部信息HeapTupleHeaderData中引入了一些字段如下：

        ```
        typedef struct HeapTupleHeaderData {
            union {
                HeapTupleFields t_heap; /* 存储该元组的一些描述信息 */
                DatumTupleFields t_datum;
            } t_choice;
        
            ItemPointerData t_ctid; /* (块号，块内偏移) 存储用来记录当前元组或新元组的物理位置 */
        
            /* Fields below here must match MinimalTupleData! */
        
            uint16 t_infomask2;
        
            uint16 t_infomask; /* various flag bits, see below */
        
            uint8 t_hoff;
        
            /* ^ - 23 bytes - ^ */
        
            bits8 t_bits[FLEXIBLE_ARRAY_MEMBER];
        
            /* MORE DATA FOLLOWS AT END OF STRUCT */
        } HeapTupleHeaderData;
        typedef HeapTupleHeaderData* HeapTupleHeader
        ```

    -   HeapTupleFields

        ```
        typedef struct HeapTupleFields {
            ShortTransactionId t_xmin; /* 存放插入该 Tuple 时的 txid */
            ShortTransactionId t_xmax; /* 存放删除或者更新该 Tuple 时的 txid，如果还没更新或者删除，那么置 0，表示无效 */ 
        
            union {
                CommandId t_cid;           /* 创建或更新/删除该 Tuple 的命令在该事务内执行的所有 SQL 命令中的编号 */
                ShortTransactionId t_xvac; /* old-style VACUUM FULL xact ID */
            } t_field3;
        } HeapTupleFields;
        ```

    -   t\_infomask

        ```
        #define HEAP_HASNULL 0x0001          /* has null attribute(s) */
        #define HEAP_HASVARWIDTH 0x0002      /* has variable-width attribute(s) */
        #define HEAP_HASEXTERNAL 0x0004      /* has external stored attribute(s) */
        #define HEAP_HASOID 0x0008           /* has an object-id field */
        #define HEAP_COMPRESSED 0x0010       /* has compressed data */
        #define HEAP_COMBOCID 0x0020         /* t_cid is a combo cid */
        #define HEAP_XMAX_EXCL_LOCK 0x0040   /* xmax is exclusive locker */
        #define HEAP_XMAX_SHARED_LOCK 0x0080 /* xmax is shared locker */
        /* if either LOCK bit is set, xmax hasn't deleted the tuple, only locked it */
        #define HEAP_IS_LOCKED (HEAP_XMAX_EXCL_LOCK | HEAP_XMAX_SHARED_LOCK)
        #define HEAP_XMIN_COMMITTED 0x0100 /* t_xmin committed */
        #define HEAP_XMIN_INVALID 0x0200   /* t_xmin invalid/aborted */
        #define HEAP_XMIN_FROZEN (HEAP_XMIN_INVALID | HEAP_XMIN_COMMITTED)
        #define HEAP_XMAX_COMMITTED 0x0400 /* t_xmax committed */
        #define HEAP_XMAX_INVALID 0x0800   /* t_xmax invalid/aborted */
        ...
        ```


-   插入、删除、更新元组
    -   元组在页中是如何存放的

        ![](figures/20211015-225510-fig-5-03.png)

        ![](figures/20211015-225127-update.png)

    -   插入

        假设一个txid为99的事务插入一个元组

        ![](figures/20211015-225511-fig-5-04.png)

    -   删除

        假设一个txid为111的事务删除一个元组

        ![](figures/20211015-225511-fig-5-05.png)

    -   更新

        假设99号事务插入的元组被100号事务更新了两次

        ![](figures/20211015-225511-fig-5-06.png)

        openGauss通过HeapTupleHeaderData 的几个特殊的字段，给元组设置了不同的版本号，元组的每次更新操作都会产生一条新版本的元组，版本之间从旧到新形成了一条版本链（旧的ctid指向新的元组）。


-   事务快照的实现

    为了实现元组对事务的可见性判断，openGauss引入了事务快照SnapshotData

    在openGauss中，有两种方式来实现快照。

    -   （1）活跃事务数组方法

        在数据库进程中，维护一个全局的数组，其中的成员为正在执行的事务信息，包括事务的事务号，该数组即活跃事务数组。

        在每个事务开始的时候，复制一份该数组内容。

        当事务执行过程中扫描到某个元组时，需要通过判断元组xmin和xmax这两个事务对于查询事务的可见性，来决定该元组是否对查询事务可见。

        ![](figures/20211015-225512-d34f1a911a8804c0b1f8d791a65f175e.png)

    -   （2）时间戳方法

        ![](figures/20211015-225512-72285f7db5051f38a7940e7f235f49df.png)

        在openGauss内部，使用一个全局自增的长整数作为逻辑的时间戳，模拟数据库内部的时序，该逻辑时间戳被称为提交顺序号（Commit Sequence Number，简称CSN）。

        每当一个事务提交的时候，在CSN日志中会记录该事务号 XID对应的逻辑时间戳 CSN 值。

        ![](figures/20211015-225513-64eaedd1d1501b104652b104bd3152b2.png)

        ```
        #define COMMITSEQNO_INPROGRESS UINT64CONST(0x0) // 表示该事务还未提交或回滚
        #define COMMITSEQNO_ABORTED UINT64CONST(0x1) // 表示该事务已经回滚
        #define COMMITSEQNO_FROZEN UINT64CONST(0x2) // 表示该事务已提交，且对任何快照可见
        #define COMMITSEQNO_FIRST_NORMAL UINT64CONST(0x3) // 事务正常的CSN号起始值
        #define COMMITSEQNO_COMMIT_INPROGRESS (UINT64CONST(1) << 62) // 事务正在提交中
        ```

    -   事务快照数据结构SnapshotData

        src/include/utils/snapshot.h

        获取快照时会记录当前活跃的最小的xid，记为snapshot.xmin。当前最新提交的“事务id\(latestCompleteXid\) + 1”，记为snapshot.xmax。当前最新提交的“CSN号 + 1”\(NextCommitSeqNo\)，记为snapshot.csn。

        ```
        typedef struct SnapshotData {
            SnapshotSatisfiesFunc satisfies;  /* 判断可见性的函数；通常使用MVCC，即HeapTupleSatisfiesMVCC */
            TransactionId xmin; /*当前活跃事务最小值，小于该值的事务说明已结束  */
            TransactionId xmax; /*最新提交事务id（latestCompeleteXid）+1，大于等于改值说明事务还未开始，该事务id不可见  */
            TransactionId* xip; /*记录当前活跃事务链表，在CSN版本中该值无用  */
            TransactionId* subxip; /* 记录缓存子事务活跃链表，在CSN版本中该值无用  */
            uint32 xcnt; /* 记录活跃事务的个数（xip中元组数）在CSN版本中该值无用  */
            ...
        
            CommitSeqNo snapshotcsn; /* 快照的CSN号，一般为最新提交事务的CSN号+1(NextCommitSeqNo)，CSN号严格小于该值的事务可见。  */
            ...
        
            CommandId curcid; /*事务块中的命令序列号，即同一事务中，前面插入的数据，后面可见。  */
            uint32 active_count; /* ActiveSnapshot stack的refcount */
            uint32 regd_count;   /* RegisteredSnapshotList 的refcount*/
            void* user_data;     /* 本地多版本快照使用，标记该快照还有线程使用，不能直接释放 */
            SnapshotType snapshot_type; /*  openGauss单机无用  */
        } SnapshotData;
        ```

    -   satisfies是openGauss提供的对于事务可见性判断的统一操作接口。

        src/gausskernel/storage/access/heap/heapam\_visibility.c

        -   HeapTupleSatisfiesMVCC：判断元组对某一快照版本是否有效
        -   HeapTupleSatisfiesUpdate：判断元组是否可更新
        -   HeapTupleSatisfiesDirty：判断当前元组是否已脏
        -   HeapTupleSatisfiesSelf：判断tuple对自身信息是否有效
        -   HeapTupleSatisfiesToast：用于TOAST表（参考文档）的判断
        -   HeapTupleSatisfiesVacuum：用在VACUUM，判断某个元组是否对任何正在运行的事务可见，如果是，则该元组不能被VACUUM删除
        -   HeapTupleSatisfiesAny：所有元组都可见
        -   HeapTupleSatisfiesHistoricMVCC：用于CATALOG 表
        -   ……

    -   MVCC可见性判断机制

        <a name="table12833732162513"></a>
        <table><thead align="left"><tr id="row118331732142511"><th class="cellrowborder" valign="top" width="33.33333333333333%" id="mcps1.1.4.1.1"><p id="p9833132182516"><a name="p9833132182516"></a><a name="p9833132182516"></a>状态</p>
        </th>
        <th class="cellrowborder" valign="top" width="33.33333333333333%" id="mcps1.1.4.1.2"><p id="p1183443212519"><a name="p1183443212519"></a><a name="p1183443212519"></a>xmax对于查询可见</p>
        </th>
        <th class="cellrowborder" valign="top" width="33.33333333333333%" id="mcps1.1.4.1.3"><p id="p983483212259"><a name="p983483212259"></a><a name="p983483212259"></a>xmax对于查询不可见</p>
        </th>
        </tr>
        </thead>
        <tbody><tr id="row7834113210257"><td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.1 "><p id="p14834232112513"><a name="p14834232112513"></a><a name="p14834232112513"></a>xmin对于查询可见</p>
        </td>
        <td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.2 "><p id="p883403252511"><a name="p883403252511"></a><a name="p883403252511"></a>记录不可见（先插入，后删除）</p>
        </td>
        <td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.3 "><p id="p1983473252510"><a name="p1983473252510"></a><a name="p1983473252510"></a>记录可见（先插入，未删除）</p>
        </td>
        </tr>
        <tr id="row1883423212516"><td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.1 "><p id="p138341532112517"><a name="p138341532112517"></a><a name="p138341532112517"></a>xmin对于查询不可见</p>
        </td>
        <td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.2 "><p id="p108341326259"><a name="p108341326259"></a><a name="p108341326259"></a>不可能发生</p>
        </td>
        <td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.3 "><p id="p88341324258"><a name="p88341324258"></a><a name="p88341324258"></a>记录不可见（未插入，未删除）</p>
        </td>
        </tr>
        </tbody>
        </table>

    -   XidVisibleInSnapshot

        src/gausskernel/storage/access/heap/heapam\_visibility.c

        ```
        bool XidVisibleInSnapshot(TransactionId xid, Snapshot snapshot, TransactionIdStatus* hintstatus, Buffer buffer, bool* sync)
        {
            bool looped = false;
            *hintstatus = XID_INPROGRESS;
            if (GTM_MODE && TransactionIdFollowsOrEquals(xid, snapshot->xmax)) {
        	return false;
            }
        loop:
            csn = TransactionIdGetCommitSeqNo(xid, false, true, false);
            if (COMMITSEQNO_IS_COMMITTED(csn)) {
                *hintstatus = XID_COMMITTED;
                if (csn < snapshot->snapshotcsn)
                    return true;
                else
                    return false;
            } else if (COMMITSEQNO_IS_COMMITTING(csn)) {
                ...
            } else {
                if (csn == COMMITSEQNO_ABORTED)
                    *hintstatus = XID_ABORTED;
                return false;
            }
        }
        ```

        如果xid事务正在执行：

        ```
        if (looped) {
            ereport(DEBUG1, (errmsg("transaction id %lu's csn %ld is changed to ABORT after lockwait.", xid, csn)));
            RecheckXidFinish(xid, csn);
            CSNLogSetCommitSeqNo(xid, 0, NULL, COMMITSEQNO_ABORTED);
            SetLatestFetchState(xid, COMMITSEQNO_ABORTED);
            *hintstatus = XID_ABORTED;
            return false;
        } else {
            if (!COMMITSEQNO_IS_SUBTRANS(csn)) {
                ...
                CommitSeqNo latestCSN = GET_COMMITSEQNO(csn);
                if (latestCSN >= snapshot->snapshotcsn) {
                    ...
                    return false;
                }
            } else {
                parentXid = (TransactionId)GET_PARENTXID(csn);
            }
            ...
            if (TransactionIdIsValid(parentXid))
                SyncWaitXidEnd(parentXid, buffer);
            else
                SyncWaitXidEnd(xid, buffer);
            looped = true;
            parentXid = InvalidTransactionId;
            goto loop;
        }
        ```

        HeapTupleSatisfiesMVCC

        ```
        static bool HeapTupleSatisfiesMVCC(HeapTuple htup, Snapshot snapshot, Buffer buffer)
        {
            // 取元组头
            HeapTupleHeader tuple = htup->t_data;
            ...
            // 根据hint bit，若xmin没有被标记为已提交：可能被标记为回滚，或者还未标记
            if (!HeapTupleHeaderXminCommitted(tuple)) {
                // 如果xmin已经被标记为invalid，说明插入该元组的事务已经回滚，直接返回不可见
                if (HeapTupleHeaderXminInvalid(tuple))  
                    return false;
                // xmin还未标记，并且xmin为当前事务，说明是在同一个事务内的插入命令和扫描命令，则需要去判断CID
                // 同一个事务内，后面的查询可以查到当前事务之前命令插入的并且未删除的结果
                if (TransactionIdIsCurrentTransactionId(HeapTupleHeaderGetXmin(page, tuple))) {
                    if ((tuple->t_infomask & HEAP_COMBOCID) && CheckStreamCombocid(tuple, snapshot->curcid, page))
                        return true; /* delete after stream producer thread scan started */
        
                    // 当前扫描命令之后的某条命令才插入
                    if (HeapTupleHeaderGetCmin(tuple, page) >= snapshot->curcid)
                        return false; /* inserted after scan started */
                    // 到这里说明当前扫描命令之前已经插入
                    // 根据hint bit，xmax被标记为invalid
                    if (tuple->t_infomask & HEAP_XMAX_INVALID)
                        return true;
        
                    ...
        
                    // 当前扫描命令之后的某条命令删除了该元组
                    if (HeapTupleHeaderGetCmax(tuple, page) >= snapshot->curcid)
                        return true; /* deleted after scan started */
                    else
                        return false; /* deleted before scan started */
                } 
                // xmin还没打标记，并且不是当前事务
                else {
                    // 通过csnlog判断事务是否可见，并且返回该事务的最终提交状态
                    visible = XidVisibleInSnapshot(HeapTupleHeaderGetXmin(page, tuple), snapshot, &hintstatus, buffer, NULL);
                    // 如果该事务提交，则打上提交的hint bit用于加速判断
                    if (hintstatus == XID_COMMITTED)
                        SetHintBits(tuple, buffer, HEAP_XMIN_COMMITTED, HeapTupleHeaderGetXmin(page, tuple));
                    // 如果事务回滚，则打上回滚标记
                    if (hintstatus == XID_ABORTED) {
                        ...
                        SetHintBits(tuple, buffer, HEAP_XMIN_INVALID, InvalidTransactionId);
                    }
                    // 如果xmin不可见，则该元组不可见
                    if (!visible) {
                        ...
                        return false;
                    }
                }
            } 
            // 根据hint bit，若xmin已经被标记为已提交，则通过函数接口CommittedXidVisibleInSnapshot判断是否对本次快照可见
            else {
                /* xmin is committed, but maybe not according to our snapshot */
                if (!HeapTupleHeaderXminFrozen(tuple) &&
                    !CommittedXidVisibleInSnapshot(HeapTupleHeaderGetXmin(page, tuple), snapshot, buffer)) {
                    if (...) {
                        return false; /* treat as still in progress */
                    }
                }
            }
        	// 到此为止认为xmin visible，继续判断xmax的可见性
        
        recheck_xmax:
            // 根据hint bit，xmax已经被标记为invalid，即已经回滚
            if (tuple->t_infomask & HEAP_XMAX_INVALID) /* xid invalid or aborted */
                return true;
        
            ... // 还有一些其他状态判断
        
            // 根据hint bit，xmax没有被标记为commited
            if (!(tuple->t_infomask & HEAP_XMAX_COMMITTED)) {
                bool sync = false;
                TransactionId xmax = HeapTupleHeaderGetXmax(page, tuple);
        
                // 如果xmax为当前事务
                if (TransactionIdIsCurrentTransactionId(HeapTupleHeaderGetXmax(page, tuple))) {
                    // 如果删除该元组的命令后发生于快照扫描时刻
                    if (HeapTupleHeaderGetCmax(tuple, page) >= snapshot->curcid)
                        return true; /* deleted after scan started */
                    else
                        return false; /* deleted before scan started */
                }
        
                visible = XidVisibleInSnapshot(HeapTupleHeaderGetXmax(page, tuple), snapshot, &hintstatus, buffer, &sync);
                /*
                 * If sync wait, xmax may be modified by others. So we need to check xmax again after acquiring the page lock.
                 */
                if (sync && (xmax != HeapTupleHeaderGetXmax(page, tuple))) {
                    goto recheck_xmax;
                }
                // 根据hintstatus在元组头部打标记 hint bit
                if (hintstatus == XID_COMMITTED) {
                    SetHintBits(tuple, buffer, HEAP_XMAX_COMMITTED, HeapTupleHeaderGetXmax(page, tuple));
                }
                if (hintstatus == XID_ABORTED) {
                    ...
                    SetHintBits(tuple, buffer, HEAP_XMAX_INVALID, InvalidTransactionId);
                }
                if (!visible) {
                    if (...) {
                        if (sync && (xmax != HeapTupleHeaderGetXmax(page, tuple))) {
                            goto recheck_xmax;
                        }    
                        return true; /* treat as still in progress */
                    }
                }
            } 
            // 根据hint bit，xmax被标记为commited
            else {
                /* xmax is committed, but maybe not according to our snapshot */
                if (!CommittedXidVisibleInSnapshot(HeapTupleHeaderGetXmax(page, tuple), snapshot, buffer)) {
                    if (...) {
                        return true; /* treat as still in progress */
                    }
                }
            }
            return false;
        }
        ```



-   隔离级别的实现

    ![](figures/zh-cn_image_0000001197508006.png)

    -   （1）脏写（dirty write）：两个事务分别写入，两个事务分别提交或回滚，则事务的结果无法确定，即一个事务可以回滚另一个事务的提交。
    -   （2）脏读（dirty read）：一个事务可以读取另一个事务未提交的修改数据。
    -   （3）不可重复读（fuzzy read）：一个事务重复读取前面读取过的数据，数据的结果被另外的事务修改。
    -   （4）幻读（phantom）：一个事务重复执行范围查询，返回一组符合条件的数据，每次查询的结果集因为其他事务的修改发生改变\(条数\)。
    -   （5）更新丢失\(lost update\)：一个事务在读取元组并更新该元组的过程中，有另一个事务修改了该元组的值，导致最终这次修改丢失。
    -   （6）读偏斜\(read skew\)：假设数据x，y有隐式的约束x+y=100；事务一读取x=50；事务二写x=25并更新y=75保证约束成立，事务二提交，事务一再读取y=75，导致事务一中读取x+y=125，不满足约束。
    -   （7）写偏斜\(write skew\)：假设数据x，y有隐式的约束x+y<=100；事务一读取x=50，并写入y=50；事务二读取y=30并写入x=70，并提交；事务一再提交；最终导致x=70，y=50不满足x+y<=100的约束。

        隔离级别越高，在一个事务执行过程中，它能“感知”到的并发事务的影响越小。在最高的可串行化隔离级别下，任意一个事务的执行，均“感知”不到有任何其他并发事务执行的影响，并且所有事务执行的效果就和一个个顺序执行的效果完全相同。

        在openGauss中，隔离级别的实现基于MVCC和快照机制，因此这种隔离方式被称为快照隔离\(Snapshot Isolation，SI\)。目前，openGauss支持读已提交和可重复读这两种隔离级别。两者实现上的差别在于在一个事务中获取快照的次数。\(在实现上可重复读隔离级别无幻读问题，有A5B写偏斜问题\)

        如果采用读已提交的隔离级别，那么在一个事务块中每条语句的执行开始阶段，都会去获取一次最新的快照，从而可以看到那些在本事务块开始以后、在前面语句执行过程中提交的并发事务的效果。

        如果采用可重复读的隔离级别，那么在一个事务块中，只会在第一条语句的执行开始阶段，获取一次快照，后面执行的所有语句都会采用这个快照，整个事务块中的所有语句均不会看到该快照之后提交的并发事务的效果。

        ![](figures/20211017-204222-dc83a9cc72803e849caa49dae027369f.png)



## 总结<a name="section86720051120"></a>

-   元组版本号的实现：使用元组头部信息的字段来标示元组的版本号
-   快照的实现：活跃事务数组方法和时间戳方法
-   判断数据有效性、可见性、可更新性的算法的实现： XidVisibleInSnapshot和HeapTupleSatisfiesMVCC
-   不同隔离级别的实现：在一个事务中获取快照的次数

