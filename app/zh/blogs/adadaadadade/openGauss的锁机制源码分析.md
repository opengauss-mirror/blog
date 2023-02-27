---
title: 'openGauss的锁机制源码分析 '
date: '2021-12-13'
category: 'blog'
tags: ['openGauss的锁机制源码分析 ']
archives: '2021-12'
author: 'adadaadadade'
summary: 'openGauss的锁机制源码分析 '
times: '17:30'
---

# 锁机制

在数据库中，会存在大量线程访问公共资源的情况，为保证安全性和高效性，引入锁机制为这一情况做并发控制。在 openGauss 中，根据锁的用途不同，和对于性能的要求不同，有 3 种：自旋锁（spinlock）、轻量级锁（LWLock）和常规锁，使用锁管理器 lmgr 提供常规锁的调用。使用锁的一般操作流程可以简述为 3 步：加锁、临界区操作、放锁。

# 文件目录

头文件目录： src/include/storage/lock/
cpp 文件目录： src/gausskernel/storage/lmgr/

```
s_lock.cpp					# 自旋锁的硬件相关实现
spin.cpp					# 自旋锁的硬件独立实现

lwlock_be.cpp				# 轻量级锁和pgstat之间的桥梁
lwlock.cpp					# 轻量级锁管理器
lwlocknames.txt				# 轻量级锁名及编号 115个
generate-lwlocknames.pl		# 从lwlocknames.txt生成lwlocknames.h和lwlocknames.cpp

lock.cpp					# 常规锁
lmgr.cpp					# 锁管理器
deadlock.cpp				# 死锁检测

predicate.cpp				# postgres谓词锁
proc.cpp					# 管理每个进程共享内存数据结构的例程
```

## 自旋锁（SpinLock）

自旋锁在 openGauss 中，使用 CPU 的原子指令 TAS 实现，使用场合为：修改或读取标志位等时间短，情况简单的场合。没有死锁检测，使用中由编码避免死锁。

自旋锁的 CPU TAS 指令调用实现，以下代码是 x86_64 的例子。

```
#ifdef __x86_64__ /* AMD Opteron, Intel EM64T */
#define HAS_TEST_AND_SET

typedef unsigned char slock_t;

#define TAS(lock) tas(lock)

static __inline__ int tas(volatile slock_t* lock)
{
    register slock_t _res = 1;

    /*
     * On Opteron, using a non-locking test before the locking instruction
     * is a huge loss.  On EM64T, it appears to be a wash or small loss,
     * so we needn't bother to try to distinguish the sub-architectures.
     */
    __asm__ __volatile__("	lock			\n"
                         "	xchgb	%0,%1	\n"
                         : "+q"(_res), "+m"(*lock)
                         :
                         : "memory", "cc");
    return (int)_res;
}
......
#define TAS_SPIN(lock) TAS(lock)
# TAS_SPIN是等待锁时使用的TAS指令，有些架构，如IA64中不同于TAS
```

自旋锁的主要函数有：

```
#define SpinLockInit(lock) S_INIT_LOCK(lock)

#define SpinLockAcquire(lock) S_LOCK(lock)

#define SpinLockRelease(lock) S_UNLOCK(lock)

#define SpinLockFree(lock) S_LOCK_FREE(lock)
```

主要学习请求和释放锁的过程。

请求锁：

可以看到使用简单的 while 语句和 TAS_SPIN(lock)来作阻塞

```
#if !defined(S_LOCK)
#define S_LOCK(lock)                            \
    do {                                        \
        if (TAS(lock))                          \
            s_lock((lock), __FILE__, __LINE__); \
    } while (0)
#endif /* S_LOCK */

int s_lock(volatile slock_t* lock, const char* file, int line)
{
    SpinDelayStatus delayStatus = init_spin_delay((void*)lock);
	// 在这里等待锁
    while (TAS_SPIN(lock)) {
        perform_spin_delay(&delayStatus);
    }

    finish_spin_delay(&delayStatus);

    return delayStatus.delays;
}
```

释放锁：

```
void s_unlock(volatile slock_t* lock)
{
#ifdef TAS_ACTIVE_WORD
    /* HP's PA-RISC */
    *TAS_ACTIVE_WORD(lock) = -1;
#else
    *lock = 0;
#endif
}
```

### 无锁原子操作

openGauss 还封装了一些 32,64,128 的简单原子操作来实现简单变量的原子更新，看代码应该只是支持 armv8.1-a 的硬件实现。

以下为 32,64 位加和 128 位交换的例子：

```
// src/include/utils/atomic.h
static inline int32 gs_atomic_add_32(volatile int32* ptr, int32 inc)
{
    return __sync_fetch_and_add(ptr, inc) + inc;
}
static inline int64 gs_atomic_add_64(int64* ptr, int64 inc)
{
    return __sync_fetch_and_add(ptr, inc) + inc;
}
static inline bool gs_compare_and_swap_32(int32* dest, int32 oldval, int32 newval)
{
    if (oldval == newval)
        return true;
	volatile bool res = __sync_bool_compare_and_swap(dest, oldval, newval);
	return res;
}
// src/include/utils/atomic_lse.h
static inline uint32 __lse_atomic_fetch_add_u32(volatile uint32 *ptr, uint32 val)
{
    register uint32 w0 asm ("w0") = val;                                        \
    register uint32 *x1 asm ("x1") = (uint32 *)(unsigned long)ptr;              \
                                                                                \
    asm volatile(".arch_extension lse\n"                                        \
        "       ldaddal  %w[val], %w[val], %[v]\n"                              \
        : [val] "+r" (w0), [v] "+Q" (*ptr)                                      \
        : "r" (x1)                                                              \
        : "x16", "x17", "x30", "memory");                                       \
    return w0;                                                                  \
}
```

## 轻量级锁（LWLock）

轻量级锁主要用于 openGauss 内部临界区操作相对较久的场合，存在共享锁和排他锁两种类型。应由编码保证不会出现死锁，但 openGauss 也提供了死锁检测机制。

一些常用的轻量级锁在 lwlocknames.txt 中定义，使用 generate-lwlocknames.pl 来生成 wlocknames.h 和 lwlocknames.cpp 文件

lwlocknames.h 中有一个宏定义 NUM_INDIVIDUAL_LWLOCKS 和 对应每一个锁名
#define $lockname (&t_thrd.shemem_ptr_cxt.mainLWLockArray[$lockidx].lock)

lwlocknames.cpp 中有字符串常量数组 MainLWLockNames

通过 GetMainLWLockByIndex(i)来对常用的轻量级锁作调用

```
// src/include/storage/lock/lwlock.h
#define GetMainLWLockByIndex(i) \
    (&t_thrd.shemem_ptr_cxt.mainLWLockArray[i].lock)

```

锁的数据结构：

```
// src/include/storage/lock/lwlock.h
typedef enum LWLockMode {
    LW_EXCLUSIVE,		// 排他锁
    LW_SHARED,			// 共享锁
    LW_WAIT_UNTIL_FREE /* A special mode used in PGPROC->lwlockMode,
                        * when waiting for lock to become free. Not
                        * to be used as LWLockAcquire argument */
} LWLockMode;

typedef struct LWLock {
    uint16      tranche;            /* 锁标识 ID */
    pg_atomic_uint32 state; /* 状态位*/
    dlist_head waiters;     /* 等待线程的列表*/
#ifdef LOCK_DEBUG
    pg_atomic_uint32 nwaiters; /* 等待线程的个数 */
    struct PGPROC* owner;      /* 最后独占的线程 */
#endif
#ifdef ENABLE_THREAD_CHECK
    pg_atomic_uint32 rwlock;
    pg_atomic_uint32 listlock;
#endif
} LWLock;

```

请求锁：

```
// src/gausskernel/storage/lmgr/lwlock.cpp
bool LWLockAcquire(LWLock *lock, LWLockMode mode, bool need_update_lockid)
……
for (;;) {
        bool mustwait = false;
        mustwait = LWLockAttemptLock(lock, mode); /* 第一次尝试 */
        if (!mustwait) {
            LOG_LWDEBUG("LWLockAcquire", lock, "immediately acquired lock");
            break; /* got the lock */
        }
        instr_stmt_report_lock(LWLOCK_WAIT_START, mode, NULL, lock->tranche);
        pgstat_report_waitevent(PG_WAIT_LWLOCK | lock->tranche);

        LWLockQueueSelf(lock, mode); /* 加入队列等待解锁 */
        mustwait = LWLockAttemptLock(lock, mode);/* ok, grabbed the lock the second time round, need to undo queueing */
……
}

```

释放锁：

```
// src/gausskernel/storage/lmgr/lwlock.cpp
void LWLockRelease(LWLock *lock)
{
……
    /* We're still waiting for backends to get scheduled, don't wake them up again. */
    check_waiters =
        ((oldstate & (LW_FLAG_HAS_WAITERS | LW_FLAG_RELEASE_OK)) == (LW_FLAG_HAS_WAITERS | LW_FLAG_RELEASE_OK))
        && ((oldstate & LW_LOCK_MASK) == 0);
    /* As waking up waiters requires the spinlock to be acquired, only do so
     * if necessary. */
    if (check_waiters) {
        /* XXX: remove before commit? */
        LOG_LWDEBUG("LWLockRelease", lock, "releasing waiters");
        // 唤醒队列中的线程，应该是使用信号量实现
        LWLockWakeup(lock);
    }
……
}
```

openGauss 中的死锁检测通过一个例程来实现

死锁检测：

```
// src/gausskernel/process/postmaster/lwlockmonitor.cpp
NON_EXEC_STATIC void FaultMonitorMain()
{
……
for (;;) {
……
if (u_sess->attr.attr_common.fault_mon_timeout > 0) {
 	if (NULL != prev_snapshot) {
		……
		 /* phase 1: light-weight detect using fast changcount */

		// 从统计信息结构体中读取线程及锁id相关的时间戳，并记录到指针队列中。
           curr_snapshot = pgstat_read_light_detect();
		// 跟几秒检测之前的时间对比，如果找到可能发生死锁的线程及锁id则返回true，否则返回false。
           continue_next = lwm_compare_light_detect(prev_snapshot, curr_snapshot);
        if (continue_next) {
		 /* phase 2 if needed: heavy-weight diagnosis for lwlock deadlock */
               .....
		}
		 if (continue_next) {
                    /* phase 3 if needed: auto healing for lwlock deadlock */
                    lw_deadlock_auto_healing(&deadlock);
           }

……
}

void lw_deadlock_auto_healing(lwm_deadlock* deadlock)
{
    /* choose one thread to be victim */
    int info_idx = 0;
    int backend_victim = choose_one_victim(deadlock, &info_idx);
    if (backend_victim >= 0) {
        if (backend_victim >= MAX_BACKEND_SLOT) {
            ereport(PANIC, (errmsg("process suicides because the victim of lwlock deadlock is an auxiliary thread")));
            return;
        }
        /* wake up this victim */
        lw_deadlock_info* info = deadlock->info + info_idx;
	// 处理方法为找一个 线程wakeup
        wakeup_victim(info->lock, info->waiter.thread_id);
    } else {
        /* LOG, maybe deadlock disappear */
        ereport(LOG, (errmsg("victim not found, maybe lwlock deadlock disappear")));
    }
}

```

## 常规锁（Lock）

常规锁主要用于给业务访问中的数据库对象加锁，使用 tag 哈希的方式来找到锁，支持多种锁的模式，有死锁检测，当检测到死锁发生时选择一个事务进行回滚。

1 级锁一般用于 SELECT 查询操作；3 级锁一般用于基本的 INSERT、UPDATE、DELETE 操作；4 级锁用于 VACUUM、analyze 等操作；8 级锁一般用于各类 DDL 语句。

常规锁的级别模式：

```
/* NoLock is not a lock mode, but a flag value meaning "don't get a lock" */
#define NoLock 0
#define AccessShareLock 1  /* SELECT */
#define RowShareLock 2     /* SELECT FOR UPDATE/FOR SHARE */
#define RowExclusiveLock 3 /* INSERT, UPDATE, DELETE */
#define ShareUpdateExclusiveLock                         \
    4               /* VACUUM (non-FULL),ANALYZE, CREATE \
                     * INDEX CONCURRENTLY */
#define ShareLock 5 /* CREATE INDEX (WITHOUT CONCURRENTLY) */
#define ShareRowExclusiveLock                \
    6 /* like EXCLUSIVE MODE, but allows ROW \
       * SHARE */
#define ExclusiveLock                  \
    7 /* blocks ROW SHARE/SELECT...FOR \
       * UPDATE */
#define AccessExclusiveLock              \
    8 /* ALTER TABLE, DROP TABLE, VACUUM \
       * FULL, and unqualified LOCK TABLE */
```

常规锁的数据结构：

```

typedef struct LOCK {
    /* hash key */
    LOCKTAG tag; /* 锁对象的唯一标识 */
    /* data */
    LOCKMASK grantMask;           /* 已经获取锁对象的位掩码 */
    LOCKMASK waitMask;            /* 等待锁对象的位掩码 */
    SHM_QUEUE procLocks;          /* 与锁关联的PROCLOCK对象链表 */
    PROC_QUEUE waitProcs;         /* 等待锁的PGPROC对象链表 */
    int requested[MAX_LOCKMODES]; /* counts of requested locks */
    int nRequested;               /* total of requested[] array */
    int granted[MAX_LOCKMODES];   /* counts of granted locks */
    int nGranted;                 /* total of granted[] array */
} LOCK;

// PROCLOCK结构，主要是将同一锁对象等待和持有者的线程信息串联起来的结构体。
typedef struct PROCLOCK {
    /* tag */
    PROCLOCKTAG tag; /* proclock对象的唯一标识 */
    /* data */
    PGPROC  *groupLeader; /* group leader, or NULL if no lock group */
    LOCKMASK holdMask;    /* 已获取锁类型的位掩码 */
    LOCKMASK releaseMask; /* 预释放锁类型的位掩码 */
    SHM_QUEUE lockLink;   /* 指向锁对象链表的指针 */
    SHM_QUEUE procLink;   /* 指向PGPROC链表的指针 */
} PROCLOCK;

```

以锁管理器中给一个元组作请求、释放锁的操作为例子.

请求锁：

```
// src/gausskernel/storage/lmgr/lmgr.cpp
void LockTuple(Relation relation, ItemPointer tid, LOCKMODE lockmode, bool allow_con_update)
{
    LOCKTAG tag;
    SET_LOCKTAG_TUPLE(tag,
                      relation->rd_lockInfo.lockRelId.dbId,
                      relation->rd_lockInfo.lockRelId.relId,
                      relation->rd_lockInfo.lockRelId.bktId,
                      ItemPointerGetBlockNumber(tid),
                      ItemPointerGetOffsetNumber(tid));
    // 请求一个常规锁
    (void)LockAcquire(&tag, lockmode, false, false, allow_con_update);
}

// src/gausskernel/storage/lmgr/lock.cpp
// LockAcquire 内调用 LockAcquireExtended， LockAcquireExtended 内调用 LockAcquireExtendedXC
static LockAcquireResult LockAcquireExtendedXC(const LOCKTAG *locktag, LOCKMODE lockmode, bool sessionLock, bool dontWait, bool reportMemoryError, bool only_increment,bool allow_con_update)
{
……
    localtag.lock = *locktag;
    localtag.mode = lockmode;
	// 寻找需要的lock
    locallock = (LOCALLOCK *)hash_search(t_thrd.storage_cxt.LockMethodLocalHash, (void *)&localtag, HASH_ENTER, &found);
	if (!found) { // 如果找不到锁
	//初始化
        ...
	}
	else {
        ...
	//添加自己为锁的拥有者之一
	}
	if (locallock->nLocks > 0) { // 如果自己已经持有该锁
	// 加锁，报告，return
        ...
	}
	// 多个if语句 根据lockmode等各种情况做分支
……
}
```

释放锁：

```
// src/gausskernel/storage/lmgr/lmgr.cpp
void UnlockTuple(Relation relation, ItemPointer tid, LOCKMODE lockmode)
{
    LOCKTAG tag;
    SET_LOCKTAG_TUPLE(tag,
                      relation->rd_lockInfo.lockRelId.dbId,
                      relation->rd_lockInfo.lockRelId.relId,
                      relation->rd_lockInfo.lockRelId.bktId,
                      ItemPointerGetBlockNumber(tid),
                      ItemPointerGetOffsetNumber(tid));
    (void)LockRelease(&tag, lockmode, false);
}

// src/gausskernel/storage/lmgr/lock.cpp
bool LockRelease(const LOCKTAG *locktag, LOCKMODE lockmode, bool sessionLock)
{
……
        /*
     * Do the releasing.  CleanUpLock will waken any now-wakable waiters.
     */
    wakeupNeeded = UnGrantLock(lock, lockmode, proclock, lockMethodTable);
    CleanUpLock(lock, proclock, lockMethodTable, locallock->hashcode, wakeupNeeded);
    LWLockRelease(partitionLock);
    instr_stmt_report_lock(LOCK_RELEASE, lockmode, locktag);
    RemoveLocalLock(locallock);
……
}
static void CleanUpLock(LOCK *lock, PROCLOCK *proclock, LockMethod lockMethodTable, uint32 hashcode, bool wakeupNeeded)
{
……
    if (lock->nRequested == 0) {
         ……//The caller just released the last lock, so garbage-collect the lockobject.
	} else if (wakeupNeeded) {
        // 唤醒一个线程
        ProcLockWakeup(lockMethodTable, lock, proclock);
    }
……
}

```

openGauss 在获取锁时如果没有冲突可以直接上锁；如果有冲突则设置一个定时器 timer，并进入等待，过一段时间会被 timer 唤起进行死锁检测。

死锁检测：

```
// src/gausskernel/storage/lmgr/proc.cpp
// 由信号量,函数 void handle_sig_alarm(SIGNAL_ARGS) 调用 内判断是否超时
static void CheckDeadLock(void)
{
    int i;
    // 获取对整个共享锁数据结构的排他锁。
    for (i = 0; i < NUM_LOCK_PARTITIONS; i++)
        (void)LWLockAcquire(GetMainLWLockByIndex(FirstLockMgrLock + i), LW_EXCLUSIVE);
	// 二次检测是否可以继续运行
    if (t_thrd.proc->links.prev == NULL || t_thrd.proc->links.next == NULL)
        goto check_done;
#ifdef LOCK_DEBUG
    if (u_sess->attr.attr_storage.Debug_deadlocks)
        DumpAllLocks();
#endif    // 执行死锁检测， 返回死锁的类型
    t_thrd.storage_cxt.deadlock_state = DeadLockCheck(t_thrd.proc);
	 if (t_thrd.storage_cxt.deadlock_state == DS_HARD_DEADLOCK) { // 是一个hard死锁
        Assert(t_thrd.proc->waitLock != NULL);
        // 从等待队列中移除再睡眠
        RemoveFromWaitQueue(t_thrd.proc, LockTagHashCode(&(t_thrd.proc->waitLock->tag)));
        PGSemaphoreUnlock(&t_thrd.proc->sem);
    } else if (u_sess->attr.attr_storage.log_lock_waits ||
               t_thrd.storage_cxt.deadlock_state == DS_BLOCKED_BY_AUTOVACUUM ||
               t_thrd.storage_cxt.deadlock_state == DS_BLOCKED_BY_REDISTRIBUTION) {
        PGSemaphoreUnlock(&t_thrd.proc->sem); // 发送睡眠信号量
    } else if (u_sess->attr.attr_storage.LockWaitTimeout > 0) {
        PGSemaphoreUnlock(&t_thrd.proc->sem); // 发送睡眠信号量
    }
}
// src/gausskernel/storage/lmgr/deadlock.cpp
DeadLockState DeadLockCheck(PGPROC *proc)
{
……
    /* 搜索死锁和是否存在解决方案， 不存在解决方案返回 True， 无死锁返回 Fasle， 如果True是一个Hard死锁*/
    if (DeadLockCheckRecurse(proc)) {
        /*
         * Call FindLockCycle one more time, to record the correct
         * deadlockDetails[] for the basic state with no rearrangements.
         */
        int nSoftEdges;
        TRACE_POSTGRESQL_DEADLOCK_FOUND();
        t_thrd.storage_cxt.nWaitOrders = 0;
        if (!FindLockCycle(proc, t_thrd.storage_cxt.possibleConstraints, &nSoftEdges)) {
            elog(FATAL, "deadlock seems to have disappeared");
        }
         return DS_HARD_DEADLOCK; /* cannot find a non-deadlocked state */
    }
    // 之后判断具体是哪种死锁
……
}


```

## 参考资料

openGauss 源码

https://gitee.com/opengauss/openGauss-server

openGauss 数据库源码解析系列文章—— 事务机制源码解析（二）
https://blog.csdn.net/GaussDB/article/details/119532011

openGauss 数据库源码解析系列文章—— 事务机制源码解析（一）
https://blog.csdn.net/GaussDB/article/details/119388841
