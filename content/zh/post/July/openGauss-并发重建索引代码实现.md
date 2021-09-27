+++

title =  "openGauss 并发重建索引代码实现" 

date = "2021-09-22" 

tags = [ "openGauss 并发重建索引代码实现"] 

archives = "2021-09" 

author = "李宏达" 

summary = "openGauss 并发重建索引代码实现"

img = "/zh/post/July/title/img9.png" 

times = "12:30"

+++

# openGauss 并发重建索引代码实现<a name="ZH-CN_TOPIC_0000001154554658"></a>

本文主要讲解并发创建索引过程中，索引数据追加部分的原理和代码实现。

先看一下代码中关于这部分功能实现的注释。

```
/*

validate_index - support code for concurrent index builds We do a concurrent index build by first inserting the catalog entry for the index via index_create(), marking it not indisready and not indisvalid.
Then we commit our transaction and start a new one, then we wait for all transactions that could have been modifying the table to terminate. Now we know that any subsequently-started transactions will see the index and honor its constraints on HOT updates; so while existing HOT-chains might be broken with respect to the index, no currently live tuple will have an incompatible HOT update done to it. We now build the index normally via index_build(), while holding a weak lock that allows concurrent insert/update/delete. Also, we index only tuples that are valid as of the start of the scan (see IndexBuildHeapScan), whereas a normal build takes care to include recently-dead tuples. This is OK because we won’t mark the index valid until all transactions that might be able to see those tuples are gone. The reason for doing that is to avoid bogus unique-index failures due to concurrent UPDATEs (we might see different versions of the same row as being valid when we pass over them, if we used HeapTupleSatisfiesVacuum). This leaves us with an index that does not contain any tuples added to the table while we built the index.
Next, we mark the index “indisready” (but still not “indisvalid”) and commit the second transaction and start a third. Again we wait for all transactions that could have been modifying the table to terminate. Now we know that any subsequently-started transactions will see the index and insert their new tuples into it. We then take a new reference snapshot which is passed to validate_index(). Any tuples that are valid according to this snap, but are not in the index, must be added to the index.
(Any tuples committed live after the snap will be inserted into the index by their originating transaction. Any tuples committed dead before the snap need not be indexed, because we will wait out all transactions that might care about them before we mark the index valid.)
validate_index() works by first gathering all the TIDs currently in the index, using a bulkdelete callback that just stores the TIDs and doesn’t ever say “delete it”. (This should be faster than a plain indexscan; also, not all index AMs support full-index indexscan.) Then we sort the TIDs, and finally scan the table doing a “merge join” against the TID list to see which tuples are missing from the index. Thus we will ensure that all tuples valid according to the reference snapshot are in the index.
Building a unique index this way is tricky: we might try to insert a tuple that is already dead or is in process of being deleted, and we mustn’t have a uniqueness failure against an updated version of the same row. We could try to check the tuple to see if it’s already dead and tell index_insert() not to do the uniqueness check, but that still leaves us with a race condition against an in-progress update. To handle that,we expect the index AM to recheck liveness of the to-be-inserted tuple
before it declares a uniqueness error.
After completing validate_index(), we wait until all transactions that were alive at the time of the reference snapshot are gone; this is necessary to be sure there are none left with a transaction snapshot older than the reference (and hence possibly able to see tuples we did not index). Then we mark the index “indisvalid” and commit. Subsequent transactions will be able to use it for queries.
Doing two full table scans is a brute-force strategy. We could try to be cleverer, eg storing new tuples in a special area of the table (perhaps making the table append-only by setting use_fsm). However that would add yet more locking issues.
*/
```

以上是代码中的官方注释，可以看出整个并发建索引过程中需要两次 table scan：

第一次获取 snapshot1，然后 scan table 中 snapshot1 可见的 heap tuple，据此构建索引，然后将索引标记为可写。这部分代码相对比较容易理解，主要是 scan table 基于 snapshot 判断 heap tuple 的可见性，然后基于 scan 出的 heap tuple，根据索引类型创建索引。代码实现主要在 index\_build 中。

以 B-tree 索引为例，核心代码如下：

```
bt_build
{
    // table scan 
    // 表扫描，基于 snapshot 判断 heap tuple 可见性
    if (RelationIsGlobalIndex(index)) {
        allPartTuples = GlobalIndexBuildHeapScan(heap, index, indexInfo, btbuildCallback, (void*)&buildstate);
    } else {
        reltuples = tableam_index_build_scan(heap, index, indexInfo, true, btbuildCallback, (void*)&buildstate);
    }
    // 按照索引 key 对 tuple 进行排序
    // 基于排完序的 tuple 构建 btree
    _bt_leafbuild(buildstate.spool, buildstate.spool2);
    ...
}
```

第二次获取 snapshot2，在索引数据中追加 snapshot1 及 snpashot2 之间插入且不在索引中的数据。做法是首先获取当前索引中索引到的所有tids （用的 bulkdelete callback 而不是 index scan，因为前者速度更快，且不是所有的索引都支持 full-index indexscan），然后 scan table 中 snapshot2 可见的所有 heap tuple，获得 tids’，最后 tids’ 和 tids 的差集就是需要在索引中追加的 heap tuple 的 tids。

唯一索引处理起来要更麻烦一些，在一条数据的多个版本时，不应该误报违反唯一原则，这可能需要在发现违反唯一原则的时候重新做一次检查。

这部分代码的实现是 validate\_index，这里列出其中的关键代码

```
validate_index 
{
    ...
    // scan index and gather all the tids into a tuplesort object
    // 这段代码收集索引中的 tids 走的是 vacuum 流程中扫描索引的流程，是按照 physical order 扫描 index pages，
    // 但在 callback 中只是收集 tids 并不会真正删除任何内容
    state.tuplesort = tuplesort_begin_datum(
        TIDOID, TIDLessOperator, InvalidOid, false, u_sess->attr.attr_memory.maintenance_work_mem, false);
    state.htups = state.itups = state.tups_inserted = 0;
    (void)index_bulk_delete(&ivinfo, NULL, validate_index_callback, (void*)&state);
    /* Execute the sort */
    // 按照 tid 大小排序
    tuplesort_performsort(state.tuplesort);
    /*
     * Now scan the heap and "merge" it with the index
     */
    // 第二次 table scan ，每个 scan 出的 tuple， 如果是在 hot-chain 上则是
    // hot-chain 的 root tuple ，在 索引 scan 出的 tuple 中(已经按照 tid 排序)查找，找不到则说明不在索引中，应该追加到索引中。
    // 调用 index_insert 将这个 heap tuple 的索引数据插入索引
    tableam_index_validate_scan(heapRelation, indexRelation, indexInfo, snapshot, &state);
    ...
}

validate_index_heapscan 的主要代码逻辑如下：

validate_index_heapscan
{
    ...
    // 遍历 heap tuple
    while ((heapTuple = heap_getnext(scan, ForwardScanDirection)) != NULL) 
    {
        ...
        // 如果在 hot-chain，用 hot-chain 的 root tuple 的 tid 在索引中查找 
        if (HeapTupleIsHeapOnly(heapTuple)) {
            root_offnum = root_offsets[root_offnum - 1];
            Assert(OffsetNumberIsValid(root_offnum));
            ItemPointerSetOffsetNumber(&rootTuple, root_offnum);
        }
        ...
        // 在 索引的 tids 中查找，由于索引的 tids 是有序的，
        // 当 heap tuple 的 tid 小于索引的 tid 继续查找，否则
        // 1. 在索引中找到（tid相等），不需要再插入索引
        // 2. 不在索引中，需要插入
        while (!tuplesort_empty && (!indexcursor || ItemPointerCompare(indexcursor, &rootTuple) < 0)) {
            ...
        }
        // 没有找到对应的 tid，需要插入索引
        if ((tuplesort_empty || ItemPointerCompare(indexcursor, &rootTuple) > 0) && !in_index[root_offnum - 1]) {
            ...
            // 追加索引
            (void)index_insert(indexRelation,
                values,
                isnull,
                &rootTuple,
                heapRelation,
                indexInfo->ii_Unique ? UNIQUE_CHECK_YES : UNIQUE_CHECK_NO);
        }
    }
}
```

本文主要内容是结合代码详解 并发创建索引 过程中第二次 table scan 追加索引部分的实现，希望能对理解这部分的代码有所帮助。

