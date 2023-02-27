---
title: 'MogDB-opengauss中的集合操作'

date: '2022-07-20'

category: 'blog'
tags: ['MogDB']

archives: '2022-07'

author: '云和恩墨-郭欢'

summary: 'MogDB-opengauss中的集合操作'

img: '/zh/blogs/guohuan/title/img.png'

times: '10:20'
---

# MogDB/opengauss 中的集合操作

UNION：并操作，将 UNION 关键字两段的结果集做并集操作。

EXCEPT：差操作，从左侧的结果集中排除掉右侧的结果集。

INTERSECT：交集，对两个结果集做取交集操作。

对表 t1、t2 做 UNION 操作，具体语句如下：

```
MogDB=# SELECT * FROM t1 UNION SELECT * FROM t2;
 c1 | c2
----+----
  1 |  1
  1 |
    |  2
  1 |  2
  2 |  2
(5 rows)
```

对表 t1、t2 做 EXCEPT 操作，具体语句如下：

```
MogDB=# SELECT * FROM t1 EXCEPT SELECT * FROM t2;
 c1 | c2
----+----
  1 |
  2 |  2
(2 rows)
```

对表 t1、t2 做 INTERSECT 操作，具体语句如下：

```
MogDB=# SELECT * FROM t1 INTERSECT SELECT * FROM t2;
 c1 | c2
----+----
  1 |  2
(1 row)
```

从结果可以看出，结果集中还做了去重的操作。也就是说，UNION、EXCEPT、INTERSECT 中还隐式地隐含 DISTINCT 操作，如果显式地指定上 DISTINCT 关键字，它们将得到相同的结果。

对表 t1、t2 做 UNION DISTINCT 操作，具体语句如下：

```
MogDB=# SELECT * FROM t1 UNION DISTINCT SELECT * FROM t2;
 c1 | c2
----+----
  1 |  1
  1 |
    |  2
  1 |  2
  2 |  2
(5 rows)
```

如果不需要去重，可以通过指定 ALL 关键字实现。

对表 t1、t2 做 UNION ALL 操作，具体语句如下：

```
MogDB=# SELECT * FROM t1 UNION ALL SELECT * FROM t2;
 c1 | c2
----+----
  1 |  2
  1 |
  2 |  2
  1 |  2
  1 |  1
    |  2
(6 rows)
```
