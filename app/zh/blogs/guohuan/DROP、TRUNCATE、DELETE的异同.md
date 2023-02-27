---
title: 'DROP、TRUNCATE、DELETE的异同'

date: '2022-07-13'

category: 'blog'
tags: ['MogDB']

archives: '2022-07'

author: '云和恩墨-郭欢'

summary: 'DROP、TRUNCATE、DELETE的异同'

img: '/zh/blogs/guohuan/title/img.png'

times: '10:20'
---

# DROP、TRUNCATE、DELETE 的异同

truncate table 命令将快速删除数据表中的所有记录，但保留数据表结构。这种快速删除与 delete from 数据表的删除全部数据表记录不一样，delete 命令删除的数据将存储在系统回滚段中，需要的时候，数据可以回滚恢复，而 truncate 命令删除的数据是不可以恢复的。

**相同点：**

truncate 和不带 where 子句的 delete，以及 drop 都会删除表内的数据。

**不同点:**

1. truncate 和 delete 只删除数据不删除表的结构（定义），drop 语句将删除表的结构被依赖的约束（constrain）, 触发器（trigger）, 索引（index）; 依赖于该表的存储过程/函数将保留，但是变为 invalid 状态。
2. delete 语句是 DML，这个操作会放到 rollback segement 中，事务提交之后才生效；如果有相应的 trigger，执行的时候将被触发。truncate、drop 是 ddl，操作立即生效，原数据不放到 rollback segment 中，不能回滚。操作不触发 trigger。
3. 速度：一般来说，drop > truncate > delete 。
4. 安全性：小心使用 drop 和 truncate，尤其是没有备份的时候。

使用上，想删除部分数据行用 delete，注意带上 where 子句。回滚段要足够大。

想删除表用 drop。

想保留表而将所有数据删除。如果和事务无关，用 truncate 即可。 如果和事务有关，或者想触发 trigger，还是用 delete。

如果是整理表内部的碎片, 可以用 truncate 跟上 reuse stroage，再重新导入/插入数据。

**总结**

- delete：删除表的内容，表的结构还存在，不释放空间，可以回滚恢复；
- drop：删除表内容和结构，释放空间，没有备份表之前要慎用；
- truncate：删除表的内容，表的结构存在，可以释放空间，没有备份表之前要慎用。
