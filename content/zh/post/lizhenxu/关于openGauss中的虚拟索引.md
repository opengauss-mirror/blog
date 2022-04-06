+++

title = "关于openGauss中的虚拟索引" 

date = "2022-04-06" 

tags = ["关于openGauss中的虚拟索引"] 

archives = "2022-04" 

author = "李真旭" 

summary = "关于openGauss中的虚拟索引"

img = "/zh/post/lizhenxu/title/img6.png" 

times = "11:37"

+++

# 关于openGauss中的虚拟索引

作为曾经的Oracle资深使用者，对于Oracle 11gR2版本推出的invisible Index感觉一直很良好；因为这对于大部分情况下做优化是比较友好的。实际上openGauss2.0版本中也提供了类似的功能，下面我们来进行简单测试。首先我们创建一个测试表用来验证openGauss的虚拟索引功能：

```sql
enmotech=# create table test as select * from pg_settings;

INSERT 0 637
enmotech=# select count(1) from test;
count
-------
637
(1 row)
```

openGauss中对于虚拟索引的创建，需要借助相关函数来实现，如下:

```sql
enmotech=# select * from hypopg_create_index('create index on test(name)');
indexrelid | indexname
------------+-------------------------
24643 | <24643>ubtree_test_name
(1 row)


enmotech=# set enable_hypo_index = on;
SET
enmotech=#
```

通过hypopg_create_index 创建了基于test（name）的虚拟索引之后，我们打开会话级参数，让优化器能够识别索引。

接下来验证一下索引是否能够起作用：

```sql
enmotech=# explain select name,setting from test where name='checkpoint_timeout';
QUERY PLAN
-------------------------------------------------------------------------------------
Index Scan using <24643>ubtree_test_name on test (cost=0.00..8.27 rows=1 width=64)
Index Cond: (name = 'checkpoint_timeout'::text)
(2 rows)

enmotech=#
```

可以看到通过explain的结果来看，该查询语句能够使用Index scan，用到我们所创建的虚拟索引16395.

那么对于虚拟索引，是否会分配空间，占据文件系统大小呢？同样也可以使用openGauss提供的相关函数进行查询：

```sql
enmotech=# select * from hypopg_estimate_size(24643);
hypopg_estimate_size
----------------------
8192
(1 row)

enmotech=#
```

除此之后还提供了一些其他的函数：

hypopg_reset_index  清除所有虚拟索引

hypopg_drop_index  删除某个虚拟索引

hypopg_display_index 查看所有创建的虚拟索引

```sql
enmotech=# select * from hypopg_estimate_size(24643);
hypopg_estimate_size
----------------------
8192
(1 row)

enmotech=#
```

虚拟索引创建后，属于实例级别、会话级别（其他会话也可以共享）。如果我们没有手工进行删除或者清除操作；那么当重启数据库实例之后，openGauss会自动删除所有的虚拟索引。

这里我们重启了openGauss集群之后，再登录数据库查看是否是这样：

```sql
enmotech=# \l
                              List of databases
   Name    | Owner | Encoding |   Collate   |    Ctype    | Access privileges 
-----------+-------+----------+-------------+-------------+-------------------
 enmotech  | roger | UTF8     | en_US.UTF-8 | en_US.UTF-8 | 
 postgres  | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | 
 template0 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +
           |       |          |             |             | omm=CTc/omm
 template1 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +
           |       |          |             |             | omm=CTc/omm
(4 rows)

enmotech=# select * from hypopg_display_index(); 
 indexname | indexrelid | table | column 
-----------+------------+-------+--------
(0 rows)


```

可以看到，openGauss实例重启之后，之前所创建的虚拟索引自动被清除。这实际上也openGauss AI功能方面的一个小点。非常赞！
