---
title: 'MogDB/openGauss事务处理语句'

date: '2022-07-28'

category: 'blog'
tags: ['MogDB']

archives: '2022-07'

author: '云和恩墨-郭欢'

summary: 'MogDB/openGauss事务处理语句'

img: '/zh/blogs/guohuan/title/img.png'

times: '10:20'
---

# MogDB/openGauss 事务处理语句

事务是由一组 SQL 语句序列构成的原子操作集合，它具有原子性、一致性、隔离性和持久性的特点。用户在开始执行一个 SQL 语句时,实际上就已经开始了一个隐式的事务，而 SQL 语句执行结束，隐式的事务也会根据 SQL 语句的执行成功与否分別进行提交(Commit)或者回滚(Rollback）操作。

但是对于多条 SQL 语句组成的事务，则需要显式地指定事务块 (Transaction Block）的边界，通常通过如下 SQL 命令来指定事务块。

(1) BEGIN： 开始一个事务

(2) COMMIT：在事务块中的所有 SQL 语句成功执行后，将事务提交，事务一旦提交，事务块中的所有修改就会被记录下来，不会产生数据丢失，保证事务的持久性。

(3) ROLLBACK：在事务执行失败时，需要将已经在事务块中执行过的 SQL 语句所产生的修改进行回滚，或者应用程序需要临时中断事务时，也可以显式地通过 ROLLBACK 命令回滚事务，在数据库重启时也会对未完成的事务做 ROLLBACK 处理。

对 warehouse 表中的 w-name(仓库名称)进行修改，然后事务提交，名称修改成功。具体语句如下：

```
BEGIN;
UPDATE warehouse SET w_name = 'W_LF' WHERE w_id = 1;
COMMIT;
```

对 warehouse 表中的 w-name(仓库名称)进行修改，然后事务提交，名称没有被真正修改。具体语句如下：

```
BEGIN;
UPDATE warehouse SET w_name = 'W_LF' WHERE w_id = 1;
ROLLBACK;
```
