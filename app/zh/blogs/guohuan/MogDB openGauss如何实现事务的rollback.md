---
title: 'MogDB/openGauss如何实现事务的rollback'

date: '2022-04-12'

category: 'blog'
tags: ['MogDB/openGauss如何实现事务的rollback']

archives: '2022-04'

author: '郭欢'

summary: 'MogDB/openGauss如何实现事务的rollback'

img: '/zh/blogs/guohuan/title/img6.png'

times: '10:20'
---

# MogDB/openGauss 如何实现事务的 rollback

本文出处：https://www.modb.pro/db/113262

数据库最主要的功能就是存储数据，然而我们在进行数据库操作时，却很容易发生误操作数据的情况，那么在 MogDB 中该如何实现误操作数据恢复呢？本文通过具体示例简要介绍如何通过回滚还原到误操作前的状态。

使用 gsql 连接 MogDB 时，SQL 语句执行完毕会自动提交，我们可以通过开启事务来避免误操作。事务的提交与回滚体现事务的原子性特征，事务语句要么提交，要么回滚。

**准备工作：**

登录数据库。

**示例步骤：**

1. 创建测试表并插入数据

   ```
   create table test (id int,name char(10));
   insert into test values(1,'aa');
   insert into test values(2,'bb');
   ```

2. 表中插入数据回滚

   ```plsql
   --查看当前表中数据
   select * from test;
   --开启事务并插入数据，之后回滚操作
   begin;
   insert into test values(3,'cc');
   select * from test;
   rollback;
   --查看insert已经回滚
   select * from test;
   ```

通过上述示例可以看出，执行回滚之后，新插入的一行数据并未存入表中，更新和删除操作也是同样。

除此之外，事务执行过程中还可以创建保存点，如果不指定保存点，回滚操作会回滚到事务起始点，即 begin 开始的地方。在比较大的事务中，可以把执行过程分为几个步骤，每个步骤执行完成后创建一个保存点，后续步骤执行失败时，可回滚到之前的保存点，而不必回滚整个事务。

1. 开启事务，在上表中继续插入数据，并创建两个保存点

   ```plsql
   begin;
   insert into test values(3,'cc');
   savepoint savepoint1;
   insert into test values(4,'dd');
   savepoint savepoint2;
   insert into test values(5,'ee');
   ```

2. 回滚至保存点

   ```
   --查看当前表数据
   select * from test;
   --回滚到保存点savepoint2，查看数据
   rollback to savepoint savepoint2;
   select * from test;
   --回滚到保存点savepoint1，查看数据
   rollback to savepoint savepoint1;
   select * from test;
   ```

3. 提交事务，查看数据

   ```
   commit;
   select * from test;
   ```

通过上述示例可以看出，回滚到保存点 1 后，后续操作未提交，而保存点 1 之前的操作会提交，即最终表中存有 3 行数据。

显示开启事务并利用回顾机制是一种能够有效避免误操作的方法。
