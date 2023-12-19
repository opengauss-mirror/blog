---
title: 'openGauss事务回滚时清理xid流程分析'
date: '2023-12-19'
tags: ['openGauss事务回滚时清理xid流程分析']
archives: '2023-12-19'
author: 'zhoucong'
category: 'blog'
summary: 'openGauss事务回滚时清理xid流程分析'
img: ''
times: '16:00'
---

# openGauss事务回滚时清理xid流程分析

# 背景知识

## ProcArray

*   procArray：对应ProcArrayStruct结构体，用来维护当前系统中所有backend的PGPROC和PGXACT。
*   PGPROC：每个连接的backend都会在共享内存中有一个对应的PGPROC结构体，记录这个backend的一些状态信息，如pid，加锁信息，事务状态信息等等。
    *   用法：t_thrd.pgxact
*   PGXACT：在PG9.2之前，PGXACT的这个结构体所保存的信息存储在PGPROC中。当前，这个结构体记录了backend的xid，xmin还有vacuum和checkpoint的一些相关信息。后来，测试发现，在CPU core很多的机器上面，如果将它与PGPROC分开存储可以有效加速GetSnapshotData的执行时间，因为可以减少因为cacheline失效而加载到cacheline中的数据量。
    *   用法：t_thrd.pgxact

knl_instance_context g_instance是全局共享的变量，包含成员变量proc_base_all_procs、proc_base_all_xacts，这两个变量，里面是所有backend的PGPROC和PGXACT，`proc->pgprocno`这个变量里面存的是该proc在`proc_base_all_procs`和`proc_base_all_xacts`里的位置。

```c++
typedef struct knl_instance_context {
	...
    struct PGPROC** proc_base_all_procs;
    struct PGXACT* proc_base_all_xacts;
}
```

# 事务回滚流程

子事务回滚流程，从新往旧依次回滚，依次回滚新创建的savepoint，最后回滚主事务。

```
create table t1 (id int, value varchar);
begin;
insert into t1 values (1m,'11');
savepoint sp1;
insert into t1 values (1m,'11');
savepoint sp2;
insert into t1 values (1m,'11');
savepoint sp3;
insert into t1 values (1m,'11');
savepoint sp4;
insert into t1 values (1m,'11');
savepoint sp5;
insert into t1 values (1m,'11');
rollback;
```


# 事务回滚时清理xid的流程

大致流程如所示，如果当前线程能抢到锁，直接执行`ProcArrayEndTransactionInternal`清理xid，如果抢不到锁，则执行ProcArrayGroupClearXid，基于ProcArrayGroup数据结构，由group leader负责抢锁，并清理所有group member的xid。

```
  ProcArrayEndTransaction -> 
  	if LWLockConditionalAcquire(ProcArrayLock, LW_EXCLUSIVE)
  		ProcArrayGroupClearXid -> 
  			ProcArrayEndTransactionInternal
  	else 
  		ProcArrayEndTransactionInternal
```

## ProcArrayEndTransaction

commitTransaction和abortTransaction时调用。

标记事务已经不在运行（提交或终止），该事务的提交或终止此时必须已经被记录到WAL和pg_clog中了。该函数需要：1. 请求ProcArrayLock锁。2. 清理PGDATA和PGPROC的关于该事务的信息。3. 计算最新的本地快照。4. 更新latestCompletedXid。

**为什么要在清理PGPROC前，请求ProcArray锁**：每个事务都有一个`advertised XID`，表示该事务已经提交并且可以被其他事务看到。在清除`advertised XID` 时，需要加锁以避免在其他事务正在获取快照时退出正在运行的事务集合。这是为了避免其他事务看到不一致的快照，因为它们可能会看到已经提交但还没有被清除 `advertised XID` 的事务。

```C++
void ProcArrayEndTransaction(PGPROC* proc, TransactionId latestXid, bool isCommit)
{
    PGXACT* pgxact = &g_instance.proc_base_all_xacts[proc->pgprocno]; // g_instance是全局的，proc_base_allxacts是一个pg->xact的列表。

#ifndef ENABLE_DISTRIBUTE_TEST
    if (ENABLE_WORKLOAD_CONTROL && WLMIsInfoInit()) {
        if (isCommit) {
            UpdateWlmCatalogInfoHash();
        } else {
            ResetWlmCatalogFlag();
        }
    }
#endif

    if (TransactionIdIsValid(latestXid)) {
        /*
         * We must lock ProcArrayLock while clearing our advertised XID, so
         * that we do not exit the set of "running" transactions while someone
         * else is taking a snapshot.  See discussion in
         * src/backend/access/transam/README.
         */
#ifdef PGXC
        /*
         * Remove this assertion. We have seen this failing because a ROLLBACK
         * statement may get canceled by a Coordinator, leading to recursive
         * abort of a transaction. This must be a openGauss issue, highlighted
         * by XC. See thread on hackers with subject "Canceling ROLLBACK
         * statement"
         */
#else
        Assert(TransactionIdIsValid(allPgXact[proc->pgprocno].xid));
#endif
        /*
         * If we can immediately acquire ProcArrayLock, we clear our own XID
         * and release the lock.  If not, use group XID clearing to improve
         * efficiency.
         */
        if (LWLockConditionalAcquire(ProcArrayLock, LW_EXCLUSIVE)) { // 如果可以加到ProcArray的LWLock排他锁，立刻加锁并且进行事务清理
            TransactionId xid;
            uint32 nsubxids;

            ProcArrayEndTransactionInternal(proc, pgxact, latestXid, &xid, &nsubxids);
            CalculateLocalLatestSnapshot(false);
            LWLockRelease(ProcArrayLock);
        } else 
            ProcArrayGroupClearXid(proc, latestXid); // 否则加入到group中，由group leader统一清理
    } else {
		...
    }

    /*
     * Reset isInResetUserName to false. isInResetUserName is set true in case 'O' so as to mask the log
     * in GetPGXCSnapshotData and GetSnapshotData.
     */
    t_thrd.postgres_cxt.isInResetUserName = false;
}
```

## ProcArrayEndTransactionInternal

清理PGPROC和PGXACT中该事务的上下文信息，并且保存xid（事务id）和nsubxids（子事务的数量）。

```C++
static inline void ProcArrayEndTransactionInternal(PGPROC* proc, PGXACT* pgxact, TransactionId latestXid,
                                                   TransactionId* xid, uint32* nsubxids)
{   // 清理PGPROC和PGXACT中该事务的上下文信息，并且保存xid（事务id）和nsubxids（子事务的数量）
    /* Store xid and nsubxids to update csnlog */
    *xid = pgxact->xid;
    *nsubxids = pgxact->nxids;

    /* Clear xid from ProcXactHashTable. We can ignore BootstrapTransactionId */
    if (TransactionIdIsNormal(*xid)) {
        ProcXactHashTableRemove(*xid);
    }

	......

    /* Clear the subtransaction-XID cache too while holding the lock */
    pgxact->nxids = 0;

    /* Also advance global latestCompletedXid while holding the lock */
    if (TransactionIdPrecedes(t_thrd.xact_cxt.ShmemVariableCache->latestCompletedXid, latestXid))
        t_thrd.xact_cxt.ShmemVariableCache->latestCompletedXid = latestXid;

    /* Clear commit csn after csn update */
    proc->commitCSN = 0;
    pgxact->needToSyncXid = 0;

    ResetProcXidCache(proc, true);
}
```

## ProcArrayGroupClearXid

用于在事务提交时清除事务ID（XID）。当无法立即以独占模式获取 ProcArrayLock 时，将自己添加到需要清除 XID 的进程列表中。第一个添加到列表中的进程将以独占模式获取 ProcArrayLock，并代表所有组成员执行 ProcArrayEndTransactionInternal。这避免了在许多进程尝试同时提交时 ProcArrayLock 周围的大量争用，因为锁不需要从一个提交进程重复地移交给下一个。

```C++
static void ProcArrayGroupClearXid(PGPROC* proc, TransactionId latestXid)
{   // 当无法以独占模式获取ProcArrayLock时，将自己添加到需要清楚XID的进程列表中。第一个添加到列表中的进程将以独占模式获取ProcArrayLock，并代表所有组员执行ProcArrayEndTransactionInternal。
    uint32 nextidx;
    uint32 wakeidx;
    TransactionId xid[PROCARRAY_MAXPROCS]; // group里所有事务的xid，实际未被使用
    uint32 nsubxids[PROCARRAY_MAXPROCS]; //  group里所有事务的subxids
    uint32 index = 0;
    uint32 commitcsn[PROCARRAY_MAXPROCS]; // group里所有事务的commitcsn
    CommitSeqNo maxcsn = 0; // group里的commitcsn最大值

    /* We should definitely have an XID to clear. */
    /* Add ourselves to the list of processes needing a group XID clear. */
    proc->procArrayGroupMember = true; // 表示该连接的事务正在group中等待清理xid。
    proc->procArrayGroupMemberXid = latestXid; // 本事务内主事务或者子事务的最新id。
    while (true) { // group队列的队尾保存在全局共享变量g_instance.proc_base->procArrayGroupFirst,下一个节点的位置存在会话级别共享变量proc->procArrayGroupNext这里,这里做的事情是把会话id（proc->pgprocno）加入到group队列的队尾。
        nextidx = pg_atomic_read_u32(&g_instance.proc_base->procArrayGroupFirst); // procArrayGroupFirst: First pgproc waiting for group XID clear, 这个变量是线程共享的。
        pg_atomic_write_u32(&proc->procArrayGroupNext, nextidx); // procArrayGroupNext: next ProcArray group member waiting for XID clear, 这个变量是会话私有的。

        if (pg_atomic_compare_exchange_u32(  // 这里是检查一下，是否有其他人改了procArrayGroupFirst。
                &g_instance.proc_base->procArrayGroupFirst, &nextidx, (uint32)proc->pgprocno))
            break;
    }

    /*
     * If the list was not empty, the leader will clear our XID.  It is
     * impossible to have followers without a leader because the first process
     * that has added itself to the list will always have nextidx as
     * INVALID_PGPROCNO.
     */
    if (nextidx != INVALID_PGPROCNO) { // nextidx == INVALID_PGPROCNO，即队头，group的leader负责抢锁。非队头的线程则等待队头抢锁。
        int extraWaits = 0;

        /* Sleep until the leader clears our XID. */
        for (;;) {
            /* acts as a read barrier */
            PGSemaphoreLock(&proc->sem, false); // 通过信号量控制锁，sema>=0可以加锁，否则被阻塞，对sema递减计数。
            if (!proc->procArrayGroupMember)
                break;
            extraWaits++;
        }

        Assert(pg_atomic_read_u32(&proc->procArrayGroupNext) == INVALID_PGPROCNO);

        /* Fix semaphore count for any absorbed wakeups */
        while (extraWaits-- > 0)
            PGSemaphoreUnlock(&proc->sem);
        return;
    }

    /* We are the leader.  Acquire the lock on behalf of everyone. */
    LWLockAcquire(ProcArrayLock, LW_EXCLUSIVE); // leader负责抢锁

    /*
     * Now that we've got the lock, clear the list of processes waiting for
     * group XID clearing, saving a pointer to the head of the list.  Trying
     * to pop elements one at a time could lead to an ABA problem.
     */
    while (true) { // nextidx = g_instance.proc_base->procArrayGroupFirst, 并把procArrayGroupFirst置为INVALID_PGPROCNO,相当于把队列剪断了。
        nextidx = pg_atomic_read_u32(&g_instance.proc_base->procArrayGroupFirst);
        if (pg_atomic_compare_exchange_u32(&g_instance.proc_base->procArrayGroupFirst, &nextidx, INVALID_PGPROCNO))
            break;
    }

    /* Remember head of list so we can perform wakeups after dropping lock. */
    wakeidx = nextidx; // wakeidx是队尾

    /* Walk the list and clear all XIDs. */
    while (nextidx != INVALID_PGPROCNO) { // 遍历队列
        PGPROC* proc_member = g_instance.proc_base_all_procs[nextidx];
        PGXACT* pgxact = &g_instance.proc_base_all_xacts[nextidx];

        /* Don't need to update csn each loop, just update once after the loop. */
        commitcsn[index] = proc_member->commitCSN; // 收集了group里所有backend的commitcsn，取了最大值。
        if (proc_member->commitCSN > maxcsn)
            maxcsn = proc_member->commitCSN;
        ProcArrayEndTransactionInternal( /** 本方法的主要实现目标——清理proc_member的xid **/
            proc_member, pgxact, proc_member->procArrayGroupMemberXid, &xid[index], &nsubxids[index]);
        /* Move to next proc in list. */
        nextidx = pg_atomic_read_u32(&proc_member->procArrayGroupNext); // 后移队列下标。
        index++;
    }

    /* already hold lock, caculate snapshot after last invocation */
    CalculateLocalLatestSnapshot(false);

    /* We're done with the lock now. */
    LWLockRelease(ProcArrayLock); // 放锁

    /*
     * Now that we've released the lock, go back and wake everybody up.  We
     * don't do this under the lock so as to keep lock hold times to a
     * minimum.  The system calls we need to perform to wake other processes
     * up are probably much slower than the simple memory writes we did while
     * holding the lock.
     */
    index = 0;
    while (wakeidx != INVALID_PGPROCNO) {
        PGPROC* proc_member = g_instance.proc_base_all_procs[wakeidx];

        wakeidx = pg_atomic_read_u32(&proc_member->procArrayGroupNext);
        pg_atomic_write_u32(&proc_member->procArrayGroupNext, INVALID_PGPROCNO); // 将已经清理过xid的各个backend的group相关上下文清理掉

        /* ensure all previous writes are visible before follower continues. */
        pg_write_barrier();

        proc_member->procArrayGroupMember = false;

        if (proc_member != t_thrd.proc)
            PGSemaphoreUnlock(&proc_member->sem);

        index++;
    }
}
```



# 子事务回滚

子事务清理xid流程，一个事务内存在多个子事务，每个子事务都需要串行回滚并清理xid

```
AbortSubTransaction|AbortTransaction --> 
	RecordTransactionAbort --> 
		if(isSubXact) 
			XidCacheRemoveRunningXids
```

## XidCacheRemoveRunningXids

子事务回滚时调用

用于从当前进程的正在运行的子事务列表中移除一组事务 ID。该函数首先获取 ProcArrayLock 排他锁，然后在当前进程的子事务列表 subxids 中查找并移除指定的事务 ID 和 xids 数组中的所有事务 ID。如果在列表中找不到指定的事务 ID，则会发出一个警告。最后，该函数还会更新全局变量 latestCompletedXid 的值。

```C++
void XidCacheRemoveRunningXids(TransactionId xid, int nxids, const TransactionId* xids, TransactionId latestXid)
{ // 从当前进程正在运行的子事务列表中移除一组事务id
    int i, j;

    Assert(TransactionIdIsValid(xid));

    LWLockAcquire(ProcArrayLock, LW_EXCLUSIVE); // 在删除事务时，必须独占地持有 ProcArrayLock 锁，以确保事务的安全性。这是因为在删除事务时，需要从 PGPROC 数组中删除事务，而 PGPROC 数组是用于跟踪数据库中所有进程的数组。因此，为了保证事务的正确性，必须独占地持有 ProcArrayLock 锁。

    /*
     * Under normal circumstances xid and xids[] will be in increasing order,
     * as will be the entries in subxids.  Scan backwards to avoid O(N^2)
     * behavior when removing a lot of xids.
     */
    for (i = nxids - 1; i >= 0; i--) { // 遍历传入的事务id列表
        TransactionId anxid = xids[i];

        for (j = t_thrd.pgxact->nxids - 1; j >= 0; j--) { // 从当前进程的子事务列表中查到对应的事务id
            if (TransactionIdEquals(t_thrd.proc->subxids.xids[j], anxid)) {
                XidCacheRemove(j); // 从t_thrd.proc->subxids.xids里移除第j个xid。
                break;
            }
        }

        if (j < 0)
            ereport(WARNING, (errmsg("did not find subXID " XID_FMT " in t_thrd.proc", anxid)));
    }

    for (j = t_thrd.pgxact->nxids - 1; j >= 0; j--) { // 根据xid查找
        if (TransactionIdEquals(t_thrd.proc->subxids.xids[j], xid)) {
            XidCacheRemove(j);
            break;
        }
    }

    /* Ordinarily we should have found it, unless the cache has overflowed */
    if (j < 0)
        ereport(WARNING, (errmsg("did not find subXID " XID_FMT " in t_thrd.proc", xid)));

    /* Also advance global latestCompletedXid while holding the lock */
    if (TransactionIdPrecedes(t_thrd.xact_cxt.ShmemVariableCache->latestCompletedXid, latestXid))
        t_thrd.xact_cxt.ShmemVariableCache->latestCompletedXid = latestXid;

    LWLockRelease(ProcArrayLock);
}
```

