+++

title = "openGauss的MVCC以及vacuum机制源码解析—CSN LOG" 

date = "2020-12-02" 

tags = ["openGauss源码解析"] 

archives = "2020-12" 

author = "民生运维人" 

summary = "openGauss的MVCC以及vacuum机制源码解析—CSN LOG"

img = "/zh/post/minshengyunwei/title/img37.png" 

times = "17:30"

+++

# openGauss的MVCC以及vacuum机制源码解析—CSN LOG<a name="ZH-CN_TOPIC_0293240564"></a>

## 背景介绍<a name="section1170834616431"></a>

openGauss数据库于2020年6月30日开源，当时就下载了该数据库的源代码，但因为其他重要项目工作的原因，一直没有抽出时间对其进行研究。最近，项目阶段性任务已经完成，现对其进行简浅地学习跟研究。业内人士可能都了解过，openGauss数据库是基于PostgreSQL研发出来的，应该也知道openGauss/PostgreSQL跟MySQL等数据库最大的区别是MVCC以及vacuum的机制不同，作者也非常想了解这块的内容。所以，研究openGauss的时候，就从这块内容入手。

openGauss数据库中包含表数据文件，clog\(事务提交状态日志，commit Log ）, CSN\(COMMIT SEQUENCE NUM\)日志，VM文件等等。提到的这些文件跟MVCC以及VACUUM机制有直接的关系，是实现这两个功能的基石。\(对于openGauss/postgreSQL的MVCC以及vacuum机制的基本原理还不太了解的朋友，可以先查阅相关的资料，例如《openGauss数据库核心技术》书籍中介绍MVCC以及VACUUM机制的章节。虽然MVCC以及VACUUM的机制的原理很简单，但是，如果深挖，细节却非常的多。因为介绍原理的资料已经很多，所以我们不再去重复写关于这两个机制的实现原理的文章。我们将介绍机制的实现细节。鉴于这两个功能模块的实现细节多而且复杂,作者没法一口气写完所有内容,读者们也不太可能有这么大片的时间去读完,所以采用类似于写长篇小说的那种模式,分章节去介绍.单独阅读某个章节，可能会相对比较片面,所以建议读者朋友们提前了解mvcc以及vacuum 机制的基本原理以及所涉及的各个模块。

## CSN LOG解析<a name="section342817274810"></a>

本篇将介绍有关MVCC的最小的一个模块CSN LOG的实现，这个模块就是数据库内部的逻辑时钟，可以用来判断某条记录是否对当前执行的SQL可见。因为判断一个记录对当前SQL是否可见，不能单纯地以产生该条记录的事务是否已经提交来判断，即使已经提交，也得判断该事务是否在当前SQL的快照时钟之前提交，如果是之前提交，则可见。如果是之后提交，则不可见。

CSN\(COMMIT SEQUENCE NUM\) 日志，采用全局自增的长整数作为逻辑的时间戳，模拟数据库内部的时序，当SQL执行的时候，首先会获取一个快照时间戳snapshot，当扫描数据页面的时候，会根据snapshot.CSN和事务状态来判断哪个元组（记录）版本可见，或者都不可见。这句话非常简单，也很好理解。但是该如何实现？实现时需要考虑哪些问题？

1.  CSN是一个自增长的数值，但如何建立事务跟这个数值之间的关系。
2.  数据库会一直执行事务，如果要记录每个事物的CSN，该怎么存放这些信息。
3.  因为判断一行记录的提交时间戳，也就是该条记录对应的事务号\(xmin或者xmax\)所对应的CSN很可能是否高频操作，所以如何快速获取这个信息？

带着这些问题，我们来逐步解析源代码，来寻找答案。

首先找到第一个问题的答案， CSN是一个步长为1的自增长的全局变量，在事务提交阶段，获取该值。

```
653    CommitSeqNo getNextCSN()
654     {
655        returnpg_atomic_fetch_add_u64(&t_thrd.xact_cxt.ShmemVariableCache->nextCommitSeqNo,1);
656     }
```

![](../figures/modb_6df2e862-0c6f-11eb-b0b9-5254001c05fe.png)

上一步是获取即将提交完成的事务的CSN号，接下来，将保存这个事务的CSN号，具体如何保存？继续往下看。

通过CSNlogSetCSN函数，将xid（事务号）所对应的提交时间戳（CSN）保存下来。

![](../figures/modb_6e1225ba-0c6f-11eb-b0b9-5254001c05fe.png)

上面的函数，已体现出如何将SCN保存下来，以及通过int entryno = TransactionIdToCSNPgIndex\(xid\); 该代码， 知道事务号跟页面的offset 之间的关系，TransactionIdToCSNPgIndex 宏定义如下：\#defineTransactionIdToCSNPgIndex\(xid\) \(\(xid\) % \(TransactionId\)CSNLOG\_XACTS\_PER\_PAGE\) ，通过 \#defineCSNLOG\_XACTS\_PER\_PAGE \(BLCKSZ sizeof\(CommitSeqNo\)\) 知道CSNLOG\_XACTS\_PER\_PAGE 为1024,即8K/8。

页面内offset的值为485=27109 % 1024

```
382         ptr= (CommitSeqNo*)(ctl->shared->page_buffer[slotno] + entryno *sizeof(CommitSeqNo));
(gdb) l
377     {
378         intentryno = TransactionIdToCSNPgIndex(xid);
379        CommitSeqNo* ptr = NULL;
380        CommitSeqNo value = 0;
381
382         ptr= (CommitSeqNo*)(ctl->shared->page_buffer[slotno] + entryno *sizeof(CommitSeqNo));
383        value = *ptr;
384
385         *
386          *Two state changes don't allowed:
(gdb) p entryno
$4 = 48
```

而根据事务号计算保存该事务的CSN的页面号的计算方法，由这个宏确定：

\#defineTransactionIdToCSNPage\(xid\) \(\(xid\) \(TransactionId\)CSNLOG\_XACTS\_PER\_PAGE\) ， 因为一个CSN占据8字节，所以8K的页面可以保存1024个CSN号。根据事务号27109/1024得到的页面号就是26（请参考下面调试堆栈图的第二行，pageno=26） 。在数据库中，对于文件的修改，都是基于WAL的原则，即在buffer中完成修改并记录日志即可\(对临时文件页面的修改例外，可以不记日志）。所以需要根据pageno=26，找到对应的在内存中的页面，即slotno,然后在内存中完成修改即可。

**图 1**  CSNLogSetCSN函数的堆栈<a name="fig1620687132119"></a>  
![](../figures/CSNLogSetCSN函数的堆栈.png "CSNLogSetCSN函数的堆栈")

解析到这里，基本回答了前面提到的3个问题。对第二个问题在延伸一下，我们知道一个8K的页面可以保存1024个事务的CSN。如果数据库已经执行了10亿个事务，我们来计算一下所需要的空间：1000000000/1024=976562,即976562个8K的页面，共7812496K，高斯数据库已经将事务号修改成64位，如果是100亿的事务号，则需要78124960K,将会消耗大量的空间。因此，需要有清理机制，清理不再需要的CSN日志,这个清理的任务由checkpoint线程来完成。请看下面的堆栈：

![](../figures/modb_6e5060be-0c6f-11eb-b0b9-5254001c05fe.png)

清理工作，由函数TruncateCSNLOG来完成，该函数唯一的入参为oldestxact ， 也就是最小的活跃事务号，事务号小于该值的事务，对任何用户会话都是可见的，所以它们的CSN记录是可以清理的。

下面我们来解析这个TruncateCSNLOG函数：

![](../figures/modb_6e7171aa-0c6f-11eb-b0b9-5254001c05fe.png)

（注：为了显示方便，以上代码删除了非关键逻辑的代码）。

该函数首先根据oldestXact 值（也就是事务号），定位到清除CSN日志页面的终止位置\(cutoffPage\) ，在清除页面之前，需要将相关页面设置为SLRU\_PAGE\_EMPTY. 如果页面号大于cutoffPage ,则跳过  （这两行代码 if\(shared-\>page\_number\[slotno\] \>= cutoffPage\);continue; 为pageno 大于cutoffpage的页面进行跳过处理）。因为页面号大于cutoffpage的页面，记录着事务号大于oldestXact的事务的CSN，当前SQL可能需要使用到这些SCN的信息，用来判断某条记录（行）对当前执行的SQL是否可见。为什么在清理文件之前，需要将相关的页面设置为SLRU\_PAGE\_EMPTY？这是为了释放缓存，因为文件即将被删除，所以在buffer中的页面也将设置为SLRU\_PAGE\_EMPTY状态，也就是将对应的页面设置为空闲页面，以便buffer中的页面可以重新利用。

设置完相关页面的状态之后，调用SlruScanDirCbDeleteCutoff进行清理。我们来看看SlruScanDirCbDeleteCutoff函数的栈：

SlruScanDirCbDeleteCutoff 函数代码：

![](../figures/modb_6e819710-0c6f-11eb-b0b9-5254001c05fe.png)

调用unlink函数，将csn log 的文件删除，以段为单位进行删除。

关于CSN 日志文件的工作机制的实现细节到这里基本解析完毕，希望看完此篇文章后，对理解这块内容所有帮助。

