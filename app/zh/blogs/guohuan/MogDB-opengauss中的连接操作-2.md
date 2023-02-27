---
title: 'MogDB/opengauss中的连接操作-2'

date: '2022-07-13'

category: 'blog'
tags: ['MogDB']

archives: '2022-07'

author: '云和恩墨-郭欢'

summary: 'MogDB/opengauss中的连接操作-2'

img: '/zh/blogs/guohuan/title/img.png'

times: '10:20'
---

# MogDB/opengauss 中的连接操作-2

从连接结果的角度来划分，连接又可以分为内连接（Inner Join）、外连接（Outer Join）、半连接（Semi Join）。

内连接：只有符合连接条件的结果才会作为最终的连接结果。

外连接：又可以分为左外连接(Left Outer Join)、右外连接(Right Outer Join) 和全连接(Full Outer Join）。其中左外连接不但显式符合连接条件的结果，而且对于外表（左表）中不符合连接条件的元组也会生成连接结果，由于这些元组在内表（右表）中没有符合连接条件的元组，因此在投影时，对内表的投影为 NULL 值。同理，右外连接显式的是内表（右表）中不符合连接条件的元组，全连接则同时显示内表（左表）和内表（右表）中的元组。

半连接：SQL 语法中不能直接使用半连接，通常数据库的优化器会将连接条件中的子查询提升成连接操作，这时候连接的方式就是半连接；基于连接条件谓词中是否含有否定谓词，半连接还可以分为 Semi Join 和 Anti-Semi Join。

对表 t2、t3 做等值内连接，具体语句如下：

```
MogDB=# SELECT * FROM t2 INNER JOIN t3 ON t2.c1 = t3.c1;
 c1 | c2 | c1 | c2
----+----+----+----
  1 |  2 |  1 |  2
  1 |  2 |  1 |  1
  1 |  1 |  1 |  2
  1 |  1 |  1 |  1
(4 rows)
```

对表 t1、t2 做等值左外连接，具体语句如下：

```
MogDB=# SELECT * FROM t1 LEFT JOIN t2 ON t1.c1 = t2.c1;
 c1 | c2 | c1 | c2
----+----+----+----
  1 |  2 |  1 |  1
  1 |  2 |  1 |  2
  1 |    |  1 |  1
  1 |    |  1 |  2
  2 |  2 |    |
(5 rows)
```

对表 t1、t2 做等值右外连接，具体语句如下：

```
MogDB=# SELECT * FROM t1 RIGHT JOIN t2 ON t1.c1 = t2.c1;
 c1 | c2 | c1 | c2
----+----+----+----
  1 |    |  1 |  2
  1 |  2 |  1 |  2
  1 |    |  1 |  1
  1 |  2 |  1 |  1
    |    |    |  2
(5 rows)
```

对表 t1、t2 做等值全连接，具体语句如下：

```
MogDB=# SELECT * FROM t1 FULL JOIN t2 ON t1.c1 = t2.c1;
 c1 | c2 | c1 | c2
----+----+----+----
  1 |  2 |  1 |  1
  1 |  2 |  1 |  2
  1 |    |  1 |  1
  1 |    |  1 |  2
  2 |  2 |    |
    |    |    |  2
(6 rows)
```

对表 t1、t2 做 Semi Join 操作，对于 t1 表中的 t1.c1，都在 t2 表中探测有没有和其相等的 t2.c1，如果能找到就代表符合条件，和普通的连接不同的是，只要找到第一个和其相等的 t2.c1 就代表满足连接条件。具体语句如下：

```
MogDB=# SELECT * FROM t1 WHERE t1.c1 IN (SELECT t2.c1 FROM t2);
 c1 | c2
----+----
  1 |  2
  1 |
(2 rows)
```

对表 t1、t2 做 Anti-Semi Join 操作，和 Semi Join 操作相对应，对于 t1 中的 t1.c1，只要在 t2 表中找到一个相等的 t2.c1，就不满足连接条件。具体语句如下：

```
MogDB=# SELECT * FROM t1 WHERE t1.c1 NOT IN (SELECT t2.c1 FROM t2 WHERE t2.c1 IS NOT NULL);
 c1 | c2
----+----
  2 |  2
(1 row)
```
