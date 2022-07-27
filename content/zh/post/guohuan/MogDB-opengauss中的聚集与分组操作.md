+++

title = "MogDB-opengauss中的聚集与分组操作" 

date = "2022-07-20" 

tags = ["MogDB"] 

archives = "2022-07" 

author = "云和恩墨-郭欢" 

summary = "MogDB-opengauss中的聚集与分组操作"

img = "/zh/post/guohuan/title/img.png" 

times = "10:20"

+++

# MogDB/opengauss中的聚集与分组操作

COUNT：对结果集中的元组数量进行计数，如果是COUNT(*)，那么会统计所有元组（包括NULL值）的数量，如果是COUNT(colname)，那么会忽略NULL值，只统计非NULL值的数量。

SUM：对参数中属性的所有值求和。

AVG：对参数中属性的而所有值取平均值，要求列的类型必须是数值类型，其中NULL值将会被忽略。

MAX：对参数中属性求最大值，NULL值会被忽略。

MIN：对参数中属性求最小值，NULL值会被忽略。

对表t1的所有元组数量进行统计，具体语句如下：

```sql
MogDB=# SELECT COUNT(*) FROM t1;
 count
-------
     3
(1 row)
```

如果给COUNT函数的参数指定为表达式（或列值），则只统计表达式结果为非NULL值的个数。

对表t1的c2列中非NULL值的个数进行统计，具体语句如下：

```sql
MogDB=# SELECT COUNT(c2) FROM t1;
 count
-------
     2
(1 row)
```

如果在参数中指定了DISTINCT关键字，则先对结果中的值去掉重复值，然后再统计数量，如果不指定DISTINCT，则默认为ALL。

对表t1的c1列中非NULL值的个数进行统计，去掉重复值，具体语句如下：

```sql
SELECT COUNT(DISTINCT t1.c2) FROM t1;

```

AVG、SUM、MIN/MAX函数同理。

对表t1的c1列做求和操作，具体语句如下：

```sql
MogDB=# SELECT COUNT(DISTINCT t1.c1) FROM t1;
 count
-------
     2
(1 row)
```

对表t1的c1列求平均值，具体语句如下：

```sql
MogDB=# SELECT AVG(c1) FROM t1;
        avg
--------------------
 1.3333333333333333
(1 row)
```

根据表t1的c2列做分组，求每个分组内c1的个数，具体语句如下：

```sql
MogDB=# SELECT c2, COUNT(c1) FROM t1 GROUP BY c2;
 c2 | count
----+-------
    |     1
  2 |     2
(2 rows)
```

根据表t1的c2列做分组，求每个分组内c1的个数，将个数大于1的分组投影出来，具体语句如下：

```sql
MogDB=# SELECT c2, COUNT(c1) FROM t1 GROUP BY c2 HAVING count(c1) >1;
 c2 | count
----+-------
  2 |     2
(1 row)
```
