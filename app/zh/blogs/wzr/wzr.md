---
title: 'openGauss社区入门(opengauss-事务管理小结)'
date: '2022-08-11'
tags: ['openGauss社区开发入门']
archives: '2022-08'
author: 'wangrururu'
summary: 'openGauss社区开发入门'
img: '/zh/blogs/wzr/title/title.jpg'
times: '10:06'
---

## 1.事务概念：

在日常操作中，对于一组相关操作通常需要其全部成功或全部失败，在关系型数据库中，这组相关操作称为事务。

## 2.事务特性：

**原子性（atomicity，A）：** 事务必须以一个整体单元的形式工作，对于其数据的修改，要么全部执行，要么全都不执行。如果只执行事务中多个操作的前半部分就会出现错误，那么必须回滚所有操作，让数据在逻辑上回滚到先前的状态。
**一致性(consistency，C)：** 事务在完成时，必须使所有的数据都保持一致状态。
**隔离性（isolation，I）：** 事务查看数据时数据所处的状态，要么是零一并发事务修改它之前的状态，要么是另一事务修改它之后的状态，事务是不会查看中间状态的数据的。
**持久性（durability，D）：** 事务完成之后，对于系统的影响是永久性的。即使今后出现致命的系统故障，数据也将一直保持。

## 3. 事务的隔离级别

openGauss 支持的事务隔离级别有两个：
Read Committed（读提交）：只有在事务提交后，其更新结果才会被其他事务看见。可以解决脏读问题。
Repeateble Read（重复读）：在一个事务中，对于同一份数据的读取结果总是相同的，无论是否有其他事务对这份数据进行操作，以及这个事务是否提交。可以解决脏读、不可重复读。

## 4.事务语法参数：

1. transaction\*isolation：设置当前事务的隔离级别。
   取值范围：字符串，只识别以下字符串，大小写空格敏感：
   serializable：等价于 REPEATABLE READ。
   read committed：只能读取已提交的事务的数据（缺省），不能读取到未提交的数据。
   repeatable read：仅能读取事务开始之前提交的数据，不能读取未提交的数据以及在事务执行期间由其它并发事务提交的修改。
   default：设置为 default_transaction_isolation 所设隔离级别。
   默认值：read committed
2. transaction_read_only：设置当前事务是只读事务。该参数在数据库恢复过程中/在备机里固定为 on；否则为 default_transaction_read_only 的值。
   取值范围：布尔型
   on 表示设置当前事务为只读事务。
   off 表示该事务可以是非只读事务。
   默认值：off
3. xc_maintenance_mode：设置系统进入维护模式。（谨慎打开这个开关，避免引起 openGauss 数据不一致）
   取值范围：布尔型
   on 表示该功能启用。
   off 表示该功能被禁用。
   默认值：off
4. allow_concurrent_tuple_update：设置是否允许并发更新。
   取值范围：布尔型
   on 表示该功能启用。
   off 表示该功能被禁用。
   默认值：on
5. transaction_deferrable：指定是否允许一个只读串行事务延迟执行，使其不会执行失败。
   取值范围：布尔型
   on 表示允许执行。
   off 表示不允许执行。
   默认值：off
6. enable_show_any_tuples：该参数只有在只读事务中可用，用于分析。
   取值范围：布尔型
   on/true 表示表中元组的所有版本都会可见。
   off/false 表示表中元组的所有版本都不可见。
   默认值：off
7. replication_type：标记当前 HA 模式是单主机模式、主备从模式还是一主多备模式。该参数用户不能自己去设置参数值。
   取值范围：0~2
   2 表示单主机模式，此模式无法扩展备机。
   1 表示使用一主多备模式，全场景覆盖，推荐使用。
   0 表示主备从模式，目前此模式暂不支持。
   默认值：1
8. pgxc_node_name：指定节点名称。在备机请求主机进行日志复制时，如果 application_name 参数没有被设置，那么 pgxc_node_name 参数会被用来作为备机在主机上的流复制槽名字。
   该流复制槽的命名方式为 "该参数值\*备机 ip\_备机 port"。其中，备机 ip 和备机 port 取自 replconninfo 参数中指定的备机 ip 和端口号。
   该流复制槽最大长度为 61 个字符，如果拼接后的字符串超过该长度，则会使用截断后的 pgxc\*node_name 进行拼接，以保证流复制槽名字长度小于等于 61 个字符。此参数修改后会导致连接数据库实例失败，不建议进行修改。
   取值范围：字符串
   默认值：当前节点名称
9. enable_defer_calculate_snapshot：延迟计算快照的 xmin 和 oldestxmin，执行 1000 个事务或者间隔 1s 才触发计算，设置为 on 时可以在高负载场景下减少计算快照的开销，但是会导致 oldestxmin 推进较慢，影响垃圾元组回收，设置为 off 时 xmin 和 oldestxmin 可以实时推进，但是会增加计算快照时的开销。
   取值范围：布尔型。
   on 表示延迟计算快照 xmin 和 oldestxmin。
   off 表示实时计算快照 xmin 和 oldestxmin。
   默认值：on。 5.自治事务
   在主事务执行过程中新启的独立的事务。自治事务的提交和回滚不会影响主事务已提交的数据，同时自治事务也不受主事务影响。自治事务在存储过程、函数和匿名块中定义，用 PRAGMA AUTONOMOUS_TRANSACTION 关键字来声明。
   例如存储过程中含自治事务：

- 建表

  ```
  create table t2(a int, b int);
  insert into t2 values(1,2);
  select \* from t2;

  ```

- 创建包含自治事务的存储过程

  ```
  CREATE OR REPLACE PROCEDURE autonomous*4(a int, b int)  AS
  DECLARE
  num3 int := a;
  num4 int := b;
  PRAGMA AUTONOMOUS_TRANSACTION;
  BEGIN
  insert into t2 values(num3, num4);
  END;

  ```

- 创建调用自治事务存储过程的普通存储过程

  ```
  CREATE OR REPLACE PROCEDURE autonomous_5(a int, b int)  AS
  DECLARE
  BEGIN
  insert into t2 values(666, 666);
  autonomous_4(a,b);
  rollback;
  END;
  ```

- 调用普通存储过程
  `select autonomous_5(11,22);`
- 查看表结果
  `select * from t2 order by a;`

结果为：主事务的回滚，不会影响自治事务已经提交的内容。
<img src='https://cdn.nlark.com/yuque/0/2022/png/32435345/1660125046688-639e17e6-4b7c-44fc-a2ed-e3e912d89862.png#clientId=ufa95ed29-d1f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=102&id=u33d53ed8&margin=%5Bobject%20Object%5D&name=image.png&originHeight=127&originWidth=310&originalType=binary&ratio=1&rotation=0&showTitle=false&size=26237&status=done&style=none&taskId=ub4c309b7-988c-4de2-a59e-7c8390fb9e3&title=&width=248'/>
