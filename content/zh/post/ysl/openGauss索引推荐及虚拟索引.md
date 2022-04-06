+++

title = "openGauss索引推荐及虚拟索引" 

date = "2022-04-02" 

tags = ["openGauss索引推荐及虚拟索引"] 

archives = "2022-04" 

author = "阎书利" 

summary = "openGauss索引推荐及虚拟索引"

img = "/zh/post/ysl/title/img39.png" 

times = "11:37"

+++

# openGauss索引推荐及虚拟索引



## 索引推荐

在ORACLE的优化中，可能大家有接触过SQL Tuning Advisor(SQL调优顾问，STA)，类似的openGauss的索引推荐(Index-advisor)功能也可以对你的查询进行分析，并提出合理的创建索引的建议。

如下是我对openGauss的索引推荐(Index-advisor)功能的使用测试，包括单条SQL查询索引推荐、Workload级别索引推荐(针对一批SQL语句的索引推荐)等。

### 一、测试数据导入

```
postgres=# create database ysla;
CREATE DATABASE
postgres=# \c ysla
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "ysla" as user "omm".
ysla=# CREATE TABLE tab_ysl_1 (col1 int, col2 int, col3 text);
CREATE TABLE
ysla=# INSERT INTO tab_ysl_1 VALUES(generate_series(1, 3000),generate_series(1, 3000),repeat( chr(int4(random()*26)+65),4));
INSERT 0 3000
ysla=# ANALYZE tab_ysl_1;
ANALYZE
ysla=# CREATE TABLE tab_ysl_2 (col1 int, col2 int);
CREATE TABLE
ysla=# INSERT INTO tab_ysl_2 VALUES(generate_series(1, 1000),generate_series(1, 1000));
INSERT 0 1000
ysla=# ANALYZE tab_ysl_2;
ANALYZE
```

### 二、单条SQL查询索引推荐

如下面所示，用gs_index_advise函数即可使用索引推荐，结果中包含表和可以创建索引的列。

#### 1.测试where

```
ysla=# SELECT  * FROM gs_index_advise('SELECT * FROM tab_ysl_1 WHERE col1 = 10');
   table   | column
-----------+--------
 tab_ysl_1 | (col1)
(1 row)
```

#### 2.测试join

```
ysla=# SELECT  * FROM gs_index_advise('SELECT * FROM tab_ysl_1 join tab_ysl_2 on tab_ysl_1.col1 = tab_ysl_2.col1');
   table   | column
-----------+--------
 tab_ysl_1 | (col1)
 tab_ysl_2 |
(2 rows)
```

#### 3.测试多表

```
ysla=# SELECT  * FROM gs_index_advise('SELECT count(*), tab_ysl_2.col1 FROM tab_ysl_1 join tab_ysl_2 on tab_ysl_1.col2 = tab_ysl_2.col2 WHERE tab_ysl_2.col2 > 2 GROUP BY tab_ysl_2.col1 ORDER BY tab_ysl_2.col1');
   table   | column
-----------+--------
 tab_ysl_1 | (col2)
 tab_ysl_2 | (col1)
(2 rows)
```

#### 4.测试order by

```
ysla=# SELECT  * FROM gs_index_advise('SELECT *, col2 FROM tab_ysl_1 ORDER BY 1, 3');
   table   | column
-----------+--------
 tab_ysl_1 |
(1 row)


ysla=# SELECT  * FROM gs_index_advise('SELECT * FROM tab_ysl_1 WHERE col1 > 10 ORDER BY 1,col2');
   table   | column
-----------+--------
 tab_ysl_1 |
(1 row)
```

#### 5.测试过长字符串

```
ysla=# SELECT  * FROM gs_index_advise('SELECT * FROM tab_ysl_1 where col3 in (''aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'',''bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'',''ccccccccccccccccccccccccccccccccccccccc'',''ddddddddddddddddddddddddddddddddddddddd'',''ffffffffffffffffffffffffffffffffffffffff'',''ggggggggggggggggggggggggggggggggggggggggggggggggggg'',''ttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt'',''vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv'',''ggmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm'')');
ERROR:  index_advisor.cpp : 983 : The parameter destMax is too small or parameter count is larger than macro parameter SECUREC_STRING_MAX_LEN. The second case only occures in functions strncat_s/strncpy_s.
```

### 三、Workload级别索引推荐

这种方式可以针对多条SQL,可以将待优化的SQL写到文件里，通过脚本获得推荐索引。

脚本目录在安装目录的bin/dbmind/index_advisor下边，我的目录为

/opt/gaussdb/app/bin/dbmind/index_advisor/index_advisor_workload.py

将待优化的SQL放到文件里

```
[omm@node1 index_advisor]$ cat 1.sql
SELECT * FROM tab_ysl_1 WHERE col1 = 10;
SELECT count(*), tab_ysl_2.col1 FROM tab_ysl_1 join tab_ysl_2 on tab_ysl_1.col2 = tab_ysl_2.col2 WHERE tab_ysl_2.col2 > 2 GROUP BY tab_ysl_2.col1 ORDER BY tab_ysl_2.col1;
SELECT * FROM tab_ysl_1 join tab_ysl_2 on tab_ysl_1.col1 = tab_ysl_2.col1;
```

使用如下方式调用脚本，可以批量获取推荐索引，26000为我的数据库端口，ysla为我的数据库名，1.sql为我待优化的SQL存放的文件

```
[omm@node1 index_advisor]$ pwd
/opt/gaussdb/app/bin/dbmind/index_advisor
[omm@node1 index_advisor]$ python3 ./index_advisor_workload.py 26000 ysla 1.sql

###### ############################################################## Generate candidate indexes

table:  tab_ysl_1 columns:  col1
table:  tab_ysl_1 columns:  col2
table:  tab_ysl_2 columns:  col1

###### ############################################################### Determine optimal indexes

create index ind0 on tab_ysl_1(col1);
```

### 四、索引效率查看

这里验证下索引推荐给我们推荐的索引究竟是否起到优化作用。

```
[omm@node1 index_advisor]$ cat 1.sql
SELECT * FROM tab_ysl_1 WHERE col1 = 10;

[omm@node1 index_advisor]$  time gsql -d ysla -p 26000 -f 1.sql
 col1 | col2 | col3
------+------+------
   10 |   10 | SSSS
(1 row)

total time: 35  ms

real    0m0.050s
user    0m0.007s
sys     0m0.002s
```

可以看到上边未优化的SQL执行时间为0m0.050s

```
[omm@node1 index_advisor]$ python3 ./index_advisor_workload.py 26000 ysla 1.sql

###### ############################################################## Generate candidate indexes

table:  tab_ysl_1 columns:  col1

###### ############################################################### Determine optimal indexes

create index ind0 on tab_ysl_1(col1);
```

通过Index-advisor获取推荐索引。并创建索引

```
ysla=# create index ind0 on tab_ysl_1(col1);
CREATE INDEX
```

可以看到查询的时间明显减少。

```
[omm@node1 index_advisor]$  time gsql -d ysla -p 26000 -f 1.sql
 col1 | col2 | col3
------+------+------
   10 |   10 | SSSS
(1 row)

total time: 0  ms

real    0m0.016s
user    0m0.009s
sys     0m0.000s
```

## 虚拟索引

一般在加索引时，会堵塞DML（不过PG支持并发加索引，不堵塞DML） 。只有索引真正能起到优化作用，我们建立索引才是有意义的。虚拟索引是一个很有用的东西，没有副作用，只是虚拟的索引，建立虚拟索引后，可以通过EXPLAIN来查看加索引后的成本估算，判断是否加索引COST会降低。

可以用虚拟索引检验索引的效果，根据效果可选择是否创建真实的索引优化查询。

```
#测试建立虚拟索引（hypopg_create_index）
ysla=# SELECT * FROM hypopg_create_index('CREATE INDEX ON tab_ysl_1(col1)');
 indexrelid |          indexname
------------+-----------------------------
      41453 | <41453>btree_tab_ysl_1_col1
(1 row)

#显示所有创建的虚拟索引信息（enable_hypo_index）
ysla=# select * from hypopg_display_index();
          indexname          | indexrelid |   table   | column
-----------------------------+------------+-----------+--------
 <41454>btree_tab_ysl_1_col1 |      41454 | tab_ysl_1 | (col1)
(1 row)

ysla=# set enable_hypo_index = on;explain SELECT * FROM tab_ysl_1 WHERE col1 = 100;
SET
                                          QUERY PLAN
----------------------------------------------------------------------------------------------
 Index Scan using <41453>btree_tab_ysl_1_col1 on tab_ysl_1  (cost=0.00..8.27 rows=1 width=13)
   Index Cond: (col1 = 100)
(2 rows)

#测试删除指定虚拟索引（hypopg_display_index）
使用函数hypopg_drop_index删除指定oid的虚拟索引
ysla=# select * from hypopg_drop_index(41454);
 hypopg_drop_index
-------------------
 t
(1 row)

#使用函数hypopg_reset_index一次性清除所有创建的虚拟索引
ysla=# SELECT * FROM hypopg_reset_index();
 hypopg_reset_index
--------------------
```
