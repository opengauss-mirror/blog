+++

title = "MogDB/opengauss中的连接操作-1" 

date = "2022-07-13" 

tags = ["MogDB"] 

archives = "2022-07" 

author = "云和恩墨-郭欢" 

summary = "MogDB/opengauss中的连接操作-1"

img = "/zh/post/guohuan/title/img.png" 

times = "10:20"

+++

# MogDB/opengauss中的连接操作-1

如果FROM关键字后由超过2个及以上（含2个）的表参与连接操作，则该查询可以成为连接查询，也可以叫作多表查询。

连接查询是SQL种最基本的操作，它的本质是多个表之间做笛卡尔积，借由这个思想又衍生出自然连接、θ连接等。

以下以t1、t2、t3几个基本表作为示例。

t1：

| C1   | C2   |
| ---- | ---- |
| 1    | 2    |
| 1    | NULL |
| 2    | 2    |

t2：

| C1   | C2   |
| ---- | ---- |
| 1    | 2    |
| 1    | 1    |
| NULL | 2    |

t3：

| C1   | C2   |
| ---- | ---- |
| 1    | 1    |
| 1    | 2    |

具体语句如下：

```sql
MogDB=#create table t1 (c1 int, c2 int);
CREATE TABLE
MogDB=#create table t2 (c1 int, c2 int);
CREATE TABLE
MogDB=#create table t3 (c1 int, c2 int);
CREATE TABLE
MogDB=#insert into t1 values (1,2);
INSERT 0 1
MogDB=#insert into t1 values (1);
INSERT 0 1
MogDB=#insert into t1 values (2,2);
INSERT 0 1
MogDB=#select * from t1;
 c1 | c2
----+----
  1 |  2
  1 |
  2 |  2
(3 rows)

MogDB=#insert into t2 values (1,2);
INSERT 0 1
MogDB=#insert into t2 values (1,1);
INSERT 0 1
MogDB=#insert into t2 values (null,2);
INSERT 0 1
MogDB=#select * from t2;
 c1 | c2
----+----
  1 |  2
  1 |  1
    |  2
(3 rows)

MogDB=#insert into t3 values (1,1);
INSERT 0 1
MogDB=#insert into t3 values (1,2);
INSERT 0 1
MogDB=#select * from t3;
 c1 | c2
----+----
  1 |  1
  1 |  2
(2 rows)
```

通常的多表连接可以通过如下形式来实现，具体语句如下：

```SQL
SELECT projection FROM t1, t2, t3 WHERE selection;
```

对这三个表做连接操作，通过“，”间隔，位于FROM关键字的后面，表示需要将这3个表做连接操作。具体语句如下：

```sql
MogDB=# SELECT * FROM t1, t2, t3 WHERE t1.c1 = 1;
 c1 | c2 | c1 | c2 | c1 | c2
----+----+----+----+----+----
  1 |  2 |  1 |  2 |  1 |  1
  1 |  2 |  1 |  2 |  1 |  2
  1 |    |  1 |  2 |  1 |  1
  1 |    |  1 |  2 |  1 |  2
  1 |  2 |  1 |  1 |  1 |  1
  1 |  2 |  1 |  1 |  1 |  2
  1 |    |  1 |  1 |  1 |  1
  1 |    |  1 |  1 |  1 |  2
  1 |  2 |    |  2 |  1 |  1
  1 |  2 |    |  2 |  1 |  2
  1 |    |    |  2 |  1 |  1
  1 |    |    |  2 |  1 |  2
(12 rows)
```

如果2个基本表确定做笛卡尔积操作，则可以在SQL中显式地指定做笛卡尔积的关键字。具体语句如下：

```sql
MogDB=# SELECT * FROM t1 CROSS JOIN t2;
 c1 | c2 | c1 | c2
----+----+----+----
  1 |  2 |  1 |  2
  1 |  2 |  1 |  1
  1 |  2 |    |  2
  1 |    |  1 |  2
  1 |    |  1 |  1
  1 |    |    |  2
  2 |  2 |  1 |  2
  2 |  2 |  1 |  1
  2 |  2 |    |  2
(9 rows)
```

连接操作还能指定连接条件，如果连接条件中是等值条件，那么这种连接可以称为等值连接。对表t1、t2做等值内连接，具体语句如下：

```sql
MogDB=# SELECT * FROM t1 INNER JOIN t2 ON t1.c1 = t2.c1;
 c1 | c2 | c1 | c2
----+----+----+----
  1 |  2 |  1 |  1
  1 |  2 |  1 |  2
  1 |    |  1 |  1
  1 |    |  1 |  2
(4 rows)
```

