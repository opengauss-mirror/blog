+++

title = "DROP、TRUNCATE、DELETE的异同" 

date = "2022-07-13" 

tags = ["MogDB"] 

archives = "2022-07" 

author = "云和恩墨-郭欢" 

summary = "DROP、TRUNCATE、DELETE的异同"

img = "/zh/post/guohuan/title/img.png" 

times = "10:20"

+++

# DROP、TRUNCATE、DELETE的异同

truncate table命令将快速删除数据表中的所有记录，但保留数据表结构。这种快速删除与delete from数据表的删除全部数据表记录不一样，delete命令删除的数据将存储在系统回滚段中，需要的时候，数据可以回滚恢复，而truncate命令删除的数据是不可以恢复的。

**相同点：**

truncate和不带where子句的delete，以及drop都会删除表内的数据。

**不同点:**

1. truncate和delete只删除数据不删除表的结构（定义），drop语句将删除表的结构被依赖的约束（constrain）, 触发器（trigger）, 索引（index）; 依赖于该表的存储过程/函数将保留，但是变为invalid状态。
2. delete语句是DML，这个操作会放到rollback segement中，事务提交之后才生效；如果有相应的trigger，执行的时候将被触发。truncate、drop是ddl，操作立即生效，原数据不放到rollback segment中，不能回滚。操作不触发trigger。
4. 速度：一般来说，drop > truncate > delete 。
5. 安全性：小心使用drop和truncate，尤其是没有备份的时候。

使用上，想删除部分数据行用delete，注意带上where子句。回滚段要足够大。

想删除表用drop。

想保留表而将所有数据删除。如果和事务无关，用truncate即可。 如果和事务有关，或者想触发trigger，还是用delete。

如果是整理表内部的碎片, 可以用truncate跟上reuse stroage，再重新导入/插入数据。

**总结**

- delete：删除表的内容，表的结构还存在，不释放空间，可以回滚恢复；
- drop：删除表内容和结构，释放空间，没有备份表之前要慎用；
- truncate：删除表的内容，表的结构存在，可以释放空间，没有备份表之前要慎用。
