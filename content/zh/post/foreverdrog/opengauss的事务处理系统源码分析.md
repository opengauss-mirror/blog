+++

title = "openGauss事务管理系统分析"

date = "2021-12-04"

tags = ["openGauss系统源码分析"]

archives = "2021-12"

author = "foreverdragon"

summary = "openGauss源码分析"

img = "/zh/post/foreverdragon/title/title2.jpg"

times = "19:25"

+++

Opengauss事务管理系统分析

**一、概述：**

opengauss的事务处理系统一共有三层：顶层、中层、底层。

顶层可以理解为进入事务处理机制这个系统的一些函数；

中层可以理解为事务块的处理，这些事务块中包含了子事务块；

底层就是内核层，是以内核视角处理子事务块中的内容。

具体的事务处理系统可以说就是一个状态机，进入系统中之后函数先判断系统什么状态，再进行处理，然后以一个状态结束，然后接下来的事务以前一个事务结束的状态运行。

**1.1：顶层模块分析**

1.1.1简述：

顶层：每次要执行一个query语句的前后，都要调用xact.c文件里的事务执行函数来进行事务处理：函数有三个，分别是：

![IMG_256](media/d8d7cc55f49c2cdecf87749a063f7282.png)

1.1.2函数分析：

1.  StartTransactionCommand（开始事务处理函数）

![IMG_256](media/9844859663f5d938bcec175f2e55edb3.png)

很明显，进入这个command函数后，系统要先判断此时的状态，如果是TBLOCK_DEFAULT状态，也就是默认的状态，那么就运行startTransaction函数，这就是真正开始处理事务。如果是其他状态，则可能会回滚或者中止。

1.  CommitTransactionCommand（结束\\完成事务处理函数）

![IMG_256](media/c103c622bdff3aeef24f6616d2147aff.png)

这个函数，也类似，先判断TBlockstate的状态进行commit操作。

3、AbortCurrentTransaction（中止当前事务函数：回滚）

![IMG_256](media/ae50a2be4a4e32336f0bba89edc600a7.png)

**1.2：中层模块分析**

1.2.1：简述：

中层：上层事务状态机控制函数：比如begin，commint，rollback，savepoint,rollback
to,release等操作，系统就会通过mainloop来改变当前状态并调用状态机内其他函数。

他们在opengauss系统中的函数是：

![IMG_256](media/6b4737d7e621146fc5a0dd0872a2f929.png)

1.2.2函数分析：

具体的函数说明如下：

![IMG_256](media/f485f33be872868822b3e9c33710bff0.png)

上层事务状态机的状态声明在代码中如下：

![IMG_256](media/6b85720f4fec1a77229bb07583a2a317.png)

后缀的意思：

Begin:开始一个事务块或者子事务

Inprogress:子事务或者事务块在运行中

End:commit命令被接受

Abort:子事务或者事务块中止，等待rollback

Abort_End:子事务或者事务块中止，rollback被接受

Abort_Pending:事务运行中，处于回滚等待状态

Prepare:事务运行中，prepare命令被接受

Undo:子事务或事务块需要进行回滚

Release：子事务release命令被接受

Commit：子事务commit命令被接受

Restart：处于运行中的子事务需要被回滚

Abort_Restart：中止的子事务需要被回滚

加了sub代表子事务块状态。

1.3底层模块分析

1.3.1简述：

底层：上面说的是中层和顶层，但底层事务处理才是真正进行事务处理，以内核的视角，通过如下函数来运行。

![IMG_256](media/3f1b0159ba8d241cfb09ffa6b3eae7df.png)

1.3.2函数分析：

具体说明如下:

![IMG_256](media/4f4e88e214d39d6631add06691eed5c1.png)

状态如下：

![IMG_256](media/3cdcb2d6b9e59f9e289df15dfc1f8630.png)

和事务块的状态声明类似。

以上的那些函数都在xact.c文件中，我们可以举个简单的例子来说明：

1.  BEGIN

2.  SELECT \* FROM foo

3.  INSERT INTO foo VALUES (...)

4.  COMMIT

一共四条指令，每条指令调用的函数如下：

![IMG_256](media/f45c7081f457205d3b00dbf6c35b5c90.png)

其中有一个函数叫：CommitCounterIncrement，这个函数作用是允许将来的指令查看过去操作过的的指令的效果（通俗的讲就是让后来者知道前者在干什么），也是个顶层函数。另外process开头的函数应该都是过程中的执行操作，具体操作得看query语句要干什么。

这样就比较清楚的看出事务处理的层次了。即顶层-\>中层-\>底层的实现，由前一层来决定下一层要干什么。

**二：事务处理机制：**

2.1子事务的处理机制：

开始执行一个子事务的时候：使用TransactionState(子事务状态)结构堆栈实现，每个子事务都有指向它的父事务的指针，当打开一个新的子事务时，调用PushTransaction,将创建一个新的TransactionState（状态）这个通过ResetUndoActionInfo函数来实现，父链接指向当前的状态，然后调用StartSubTransaction函数来将新的TransactionState（状态）定义一个合适的值，并将其他子事务的状态也更新。

StartsubTransaction函数如下：

开始一个子事务前，需要先给它在资源管理器中进行初始化（下图中的AtSubStart开头的函数），然后创建一个新的状态：ResetUndoActionInfo函数实现

![IMG_256](media/0c10a8b67d056e1475ec0cfcab2b01e9.png)

Pushtransaction函数：

![IMG_256](media/0b58730ad3537fc81142fd10b7f61530.png)

结束一个子事务时：可以调用CommitSubTransaction或者调用AbortsubTransaction和CleanupsubTransaction。然后调用PopTransaction将当前的子事务状态弹出并回到父事务那去。

CommitSubTransaction函数：

![IMG_256](media/27591553ba4dba3de1303a7ed9f8dc3c.png)

很明显，通过if语句中的子事务的状态来决定接下来的操作。这个函数也调用函数来对handler和cache的清理。

注：堆栈结构的好处是，当我们在弹出状态堆栈顶时出错的话，剩下的堆栈条目仍能显示我们需要完成的操作。

2.2事务提交机制

当我们首次引用一个事务或者一个子事务时，会给他标记一个XID用以区分，当一个事务有子事务时，先给父事务标记，再给子事务标记，来确保子事务先被处理。

这些XID占用shared
memory,同时也会对它们进行加锁处理，如果碰到一个没有XID的事务的话，一般会给它分配一个VXID（虚拟XID），不占用共享内存。

当事务结束后，使用CLOG记录是否提交，使用CSNLOG记录该事务提交的序列，用于可见性判断。

这是CommitTransaction函数中的一条，用于记录已经提交的事务ID

![IMG_256](media/3b96e41ce10fabc2a799ea909f353e9d.png)

RecordTransactonCommit函数就是向CLOG提交记录的函数，如下：

![IMG_256](media/2c01a0b4471537c198125f260779bbe6.png)

它首先是初始化记录，然后向XLOG（事务日志）索取要提交指令的记录的data，然后获取事务提交序列来保证一致性和持久性，一系列操作下来决定那个传输的判定句的真值是否是真（markXidCommitted这个参数的值是否是真），最后将记录传给CLOG。

传输操作如下：

![IMG_256](media/ad1462575748ffef6b815097a4031f70.png)

由此也可见LOG文件是以树的形式进行储存数据的。

通过CLogSetPageStatus函数可以看出来：

![IMG_256](media/71d16cab76818065f345a392061fb2ec.png)

同时，我们也可以来看CLOG等日志文件是如何存储事务状态的。

1：首先，openGauss中对于每个事务id使用4个bit位来标识它的状态。CLOG定义代码如下：

![IMG_256](media/1043138b5a090c121a1013d323e645b6.png)

![QQ截图20211017201026](media/f40ae6de0cb2dc88018d8788453ba406.png)

物理组织形式如下例：

![IMG_256](media/c6b5ec6f2ec7a33eb6102deada5d6727.png)

事务1、4、5还在运行中，事务2已经提交，事务3已经回滚。

2：openGauss为每个事务id分配8个字节uint64的CSN号，CSNLOG状态识别代码如下：

![IMG_256](media/a4ff79062cc5744563beafb51dcfba86.png)

物理结构同CLOG：

![IMG_256](media/0e1e8e1a118d4827763b9a7d6a631198.jpeg)

事务id
2048、2049、2050、2051、2052、2053的对应的CSN号依次是5、4、7、10、6、8；也就是说事务提交的次序依次是2049-\>2048-\>2052-\>2050-\>2053-\>2051
