+++

title = "openGauss社区入门（opengauss-事务管理和MVVC学习总结)"

date = "2022-08-01"

tags = ["openGauss社区开发入门"]

archives = "2022-08"

author = "rentc"

summary = "openGauss社区开发入门"

img = "/zh/post/Rentc/title/title.jpg"

times = "10:50"

+++
<a name="nqFIe"></a>
## 一．事务
<a name="Z2N1g"></a>
## 1.事务的定义
访问并可能更新数据库中各种[数据项](https://baike.baidu.com/item/%E6%95%B0%E6%8D%AE%E9%A1%B9/3227309)的一个程序[执行单元](https://baike.baidu.com/item/%E6%89%A7%E8%A1%8C%E5%8D%95%E5%85%83/22689638)
<a name="8Z60H"></a>
## 1 事务的属性
原子性(Atomicity):同一个事务下,事务是不可被分割的<br />一致性(Consistency):一致性,事务的的前后数据的完整性需一致<br />隔离性(Isolation):不同事务之间相互隔离,互不影响<br />持久性(Durability):事务一旦执行,数据库的变化就是永久性的
<a name="Zxxkv"></a>
## 2 事务的隔离级别
![](https://cdn.nlark.com/yuque/0/2022/png/29767082/1659077473013-72ed1da1-8b33-4379-b631-ae64edc40a75.png#crop=0&crop=0&crop=1&crop=1&id=nIfMW&originHeight=164&originWidth=514&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)<br />脏读:一个事务还未提交的时候,另一个事务读到了该事务中未提交的数据<br />不可重复读:同一个事务中,两次读取的结果,由于其他事务的提交,导致读取结果不一致<br />幻读:事务A进行某条件下的数据变更操作,事务B对相同搜索条件的数据发生了数据新增的操作,导致事务A提交以后仿佛发生了"诡异",有数据没有被修改<br />可重复读与幻读的区别:<br />不可重复读,是同一个事务中,两次读取操作导致数据不一致,幻读指的是事务不是独立执行时发生的一种现象,例如,第一个事务对全部数据做修改,第二个事务在第一个事务执行期间,新增了数据,当第一个事务提交以后发现有数据没有被修改,如同发生了幻觉
<a name="AEkmC"></a>
## 二．Mvvc
<a name="Zsr0v"></a>
## **1.openGauss中MVCC的实现**思路

- 定义多版本的数据——使用元组头部信息的字段来标示元组的版本号
- 定义数据的有效性、可见性、可更新性——通过当前的事务快照和对应元组的版本号判断
- 实现不同的数据库隔离级别——通过在不同时机获取快照实现
<a name="oNCUK"></a>
## 2.基本概念
<a name="fNnaY"></a>
### 1.事务号
当事务开始（执行begin第一条命令时），事务管理器会为该事务分配一个txid（transaction id）作为唯一标识符。txid是一个32位无符号整数，取值空间大小约42亿（2^32-1）。<br />txid可通过txid_current()函数获取<br />![](https://cdn.nlark.com/yuque/0/2022/png/29767082/1659077473678-d72dd5d7-c734-4ffd-8408-24a308f6adae.png#crop=0&crop=0&crop=1&crop=1&id=IY3me&originHeight=172&originWidth=468&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
<a name="QnEMV"></a>
### 3 其中与MVCC相关的重要信息
t_xmin：保存插入该元组的事务txid（该元组由哪个事务插入）<br />t_xmax：保存更新或删除该元组的事务txid。若该元组尚未被删除或更新，则t_xmax=0，即invalid<br />t_cid：保存命令标识（command id,cid），指在该事务中，执行当前命令之前还执行过几条sql命令（从0开始计算）<br />t_ctid：一个指针，保存指向自身或新元组的元组的标识符（tid）


<a name="FI14H"></a>
### 4 事务实现
每行上有xmin和xmax两个系统字段<br />当插入一行数据时，将这行上的xmin设置为当前的事务id，而xmax设置为0<br />当更新一行时，实际上是插入新行，把旧行上的xmax设置为当前事务id，新插入行的xmin设置为当前事务id，新行的xmax设置为0<br />当删除一行时，把当前行的xmax设置为当前事务id<br />当读到一行时，查询xmin和xmax对应的事务状态是否是已提交还是回滚了， 就能判断出此行对当前行是否是可见。<br />![](https://cdn.nlark.com/yuque/0/2022/png/29767082/1659077474190-f784237e-0e83-4988-9d5b-d8c83cda9106.png#crop=0&crop=0&crop=1&crop=1&id=V06aP&originHeight=288&originWidth=1287&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)<br />查看指定表对应的page header内容

![](https://cdn.nlark.com/yuque/0/2022/png/29767082/1659077474889-483b9f2e-ae76-43ec-9362-728079680ff2.png#crop=0&crop=0&crop=1&crop=1&id=Mu1WX&originHeight=702&originWidth=893&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
<a name="sEGPO"></a>
### 4.事务ID的增长
1.事务ID不能无限增长<br />2.txid到最大值，又会从最小值3开始<br />0: 无效事务ID<br />1: 表示系统表初使化时的事务ID，比任务普通的事务ID都旧。<br />2:冻结的事务ID，比任务普通的事务ID都旧。<br />同一个数据库中，存在的最旧和最新两个事务之间的年龄允许的最多是2^31，即20亿。<br />![](https://cdn.nlark.com/yuque/0/2022/png/29767082/1659077475269-01d834dc-ad06-49a8-b39e-8be48d527b62.png#crop=0&crop=0&crop=1&crop=1&id=yFHJ2&originHeight=407&originWidth=452&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)<br />可用的有效最小事务ID为3。VACUUM时将所有已提交的事务ID均设置为2，即frozon。之后所有的事务都比frozon事务新，因此VACUUM之前的所有已提交的数据都对之后的事务可见。通过这种方式实现了事务ID的循环利用。

