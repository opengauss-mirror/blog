---
title: 'openGauss社区入门（opengauss-事务管理和MVVC学习总结)'

date: '2022-08-01'

category: 'blog'
tags: ['openGauss社区开发入门']

archives: '2022-08'

author: 'rentc'

summary: 'openGauss社区开发入门'

img: '/zh/blogs/Rentc/title/title.jpg'

times: '10:50'
---

## 一．事务

## 1.事务的定义

访问并可能更新数据库中各种[数据项](https://baike.baidu.com/item/%E6%95%B0%E6%8D%AE%E9%A1%B9/3227309)的一个程序[执行单元](https://baike.baidu.com/item/%E6%89%A7%E8%A1%8C%E5%8D%95%E5%85%83/22689638)

## 1 事务的属性

- 原子性(Atomicity):同一个事务下,事务是不可被分割的
- 一致性(Consistency):一致性,事务的的前后数据的完整性需一致
- 隔离性(Isolation):不同事务之间相互隔离,互不影响
- 持久性(Durability):事务一旦执行,数据库的变化就是永久性的

## 2 事务的隔离级别

<img src='https://cdn.nlark.com/yuque/0/2022/png/29767082/1659077473013-72ed1da1-8b33-4379-b631-ae64edc40a75.png#crop=0&crop=0&crop=1&crop=1&id=nIfMW&originHeight=164&originWidth=514&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title='>
脏读:一个事务还未提交的时候,另一个事务读到了该事务中未提交的数据
不可重复读:同一个事务中,两次读取的结果,由于其他事务的提交,导致读取结果不一致
幻读:事务 A 进行某条件下的数据变更操作,事务 B 对相同搜索条件的数据发生了数据新增的操作,导致事务 A 提交以后仿佛发生了"诡异",有数据没有被修改
可重复读与幻读的区别:
不可重复读,是同一个事务中,两次读取操作导致数据不一致,幻读指的是事务不是独立执行时发生的一种现象,例如,第一个事务对全部数据做修改,第二个事务在第一个事务执行期间,新增了数据,当第一个事务提交以后发现有数据没有被修改,如同发生了幻觉

## 二．Mvvc

## **1.openGauss 中 MVCC 的实现**思路

- 定义多版本的数据——使用元组头部信息的字段来标示元组的版本号
- 定义数据的有效性、可见性、可更新性——通过当前的事务快照和对应元组的版本号判断
- 实现不同的数据库隔离级别——通过在不同时机获取快照实现

## 2.基本概念

### 1.事务号

当事务开始（执行 begin 第一条命令时），事务管理器会为该事务分配一个 txid（transaction id）作为唯一标识符。txid 是一个 32 位无符号整数，取值空间大小约 42 亿（2^32-1）。
txid 可通过 txid_current()函数获取
<img src='https://cdn.nlark.com/yuque/0/2022/png/29767082/1659077473678-d72dd5d7-c734-4ffd-8408-24a308f6adae.png#crop=0&crop=0&crop=1&crop=1&id=IY3me&originHeight=172&originWidth=468&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title'>
<a name="QnEMV"></a>

### 3 其中与 MVCC 相关的重要信息

t_xmin：保存插入该元组的事务 txid（该元组由哪个事务插入）
t_xmax：保存更新或删除该元组的事务 txid。若该元组尚未被删除或更新，则 t_xmax=0，即 invalid
t_cid：保存命令标识（command id,cid），指在该事务中，执行当前命令之前还执行过几条 sql 命令（从 0 开始计算）
t_ctid：一个指针，保存指向自身或新元组的元组的标识符（tid）

<a name="FI14H"></a>

### 4 事务实现

每行上有 xmin 和 xmax 两个系统字段
当插入一行数据时，将这行上的 xmin 设置为当前的事务 id，而 xmax 设置为 0
当更新一行时，实际上是插入新行，把旧行上的 xmax 设置为当前事务 id，新插入行的 xmin 设置为当前事务 id，新行的 xmax 设置为 0
当删除一行时，把当前行的 xmax 设置为当前事务 id
当读到一行时，查询 xmin 和 xmax 对应的事务状态是否是已提交还是回滚了， 就能判断出此行对当前行是否是可见。
<img src='https://cdn.nlark.com/yuque/0/2022/png/29767082/1659077474190-f784237e-0e83-4988-9d5b-d8c83cda9106.png#crop=0&crop=0&crop=1&crop=1&id=V06aP&originHeight=288&originWidth=1287&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title'>
查看指定表对应的 page header 内容

<img src='https://cdn.nlark.com/yuque/0/2022/png/29767082/1659077474889-483b9f2e-ae76-43ec-9362-728079680ff2.png#crop=0&crop=0&crop=1&crop=1&id=Mu1WX&originHeight=702&originWidth=893&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title'>
<a name="sEGPO"></a>

### 4.事务 ID 的增长

1. 事务 ID 不能无限增长
2. txid 到最大值，又会从最小值
3. 开始 0: 无效事务 ID
   1: 表示系统表初使化时的事务 ID，比任务普通的事务 ID 都旧。
   2: 冻结的事务 ID，比任务普通的事务 ID 都旧。
   同一个数据库中，存在的最旧和最新两个事务之间的年龄允许的最多是 2^31，即 20 亿。
   <img src='https://cdn.nlark.com/yuque/0/2022/png/29767082/1659077475269-01d834dc-ad06-49a8-b39e-8be48d527b62.png#crop=0&crop=0&crop=1&crop=1&id=yFHJ2&originHeight=407&originWidth=452&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title='>
   可用的有效最小事务 ID 为
   3。VACUUM 时将所有已提交的事务 ID 均设置为 2，即 frozon。之后所有的事务都比 frozon 事务新，因此 VACUUM 之前的所有已提交的数据都对之后的事务可见。通过这种方式实现了事务 ID 的循环利用。
