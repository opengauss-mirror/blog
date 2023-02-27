---
title: 'openGauss数据库执行计划缓存/失效机制的测试'

date: '2022-04-06'

category: 'blog'
tags: ['openGauss数据库执行计划缓存/失效机制的测试']

archives: '2022-04'

author: '阎书利'

summary: 'openGauss数据库执行计划缓存/失效机制的测试'

img: '/zh/blogs/ysl/title/img39.png'

times: '11:37'
---

# openGauss 数据库执行计划缓存/失效机制的测试

## 1.强制对临时对象使用 COMMIT 而不是 2PC

```
postgres=# SET enforce_two_phase_commit TO off;
SET
```

## 2.创建测试表并插入测试数据

```
postgres=# CREATE TEMP TABLE tab_test_plancache(q1 int8, q2 int8);
CREATE TABLE
postgres=# INSERT INTO tab_test_plancache VALUES('  123   ','  456');
INSERT 0 1
postgres=# INSERT INTO tab_test_plancache VALUES('123   ','4567890123456789');
INSERT 0 1
postgres=# INSERT INTO tab_test_plancache VALUES('4567890123456789','123');
INSERT 0 1
postgres=# INSERT INTO tab_test_plancache VALUES(+4567890123456789,'4567890123456789');
INSERT 0 1
postgres=# INSERT INTO tab_test_plancache VALUES('+4567890123456789','-4567890123456789');
INSERT 0 1
```

## 3.创建并使用缓存的计划

```
postgres=# PREPARE prepstmt AS SELECT * FROM tab_test_plancache ORDER BY q1, q2;
PREPARE
postgres=# EXECUTE prepstmt;
        q1        |        q2
------------------+-------------------
              123 |               456
              123 |  4567890123456789
 4567890123456789 | -4567890123456789
 4567890123456789 |               123
 4567890123456789 |  4567890123456789
(5 rows)
```

并且包含一个带有绑定变量的

```
postgres=# PREPARE prepstmt2(bigint) AS SELECT * FROM tab_test_plancache WHERE q1 = $1 ORDER BY q1, q2;
PREPARE
postgres=# EXECUTE prepstmt2(123);
 q1  |        q2
-----+------------------
 123 |              456
 123 | 4567890123456789
(2 rows)
```

## 4.删除临时表，查看现象

```
postgres=# DROP TABLE tab_test_plancache;
DROP TABLE
postgres=# EXECUTE prepstmt;
ERROR:  relation "tab_test_plancache" does not exist on dn_6001_6002
postgres=# EXECUTE prepstmt2(123);
ERROR:  relation "tab_test_plancache" does not exist on dn_6001_6002
```

重建临时表

```
postgres=# select * from tab_test_plancache;
        q1        |        q2
------------------+-------------------
              123 |               456
              123 |  4567890123456789
 4567890123456789 | -4567890123456789
 4567890123456789 |               123
 4567890123456789 |  4567890123456789
(5 rows)

postgres=# EXECUTE prepstmt;
        q1        |        q2
------------------+-------------------
              123 |               456
              123 |  4567890123456789
 4567890123456789 | -4567890123456789
 4567890123456789 |               123
 4567890123456789 |  4567890123456789
(5 rows)

postgres=# EXECUTE prepstmt2(123);
 q1  |        q2
-----+------------------
 123 |              456
 123 | 4567890123456789
(2 rows)
```

这表明原始计划是纯文本的，不依赖于 OID

## 5.prepared statements 应该防止在输出的 tupdesc 中更改， 因为 clients 可能不希望这种情况瞬间改变

```
postgres=# ALTER TABLE tab_test_plancache ADD COLUMN q3 bigint;
ALTER TABLE
postgres=# EXECUTE prepstmt;
ERROR:  cached plan must not change result type
postgres=# EXECUTE prepstmt2(123);
ERROR:  cached plan must not change result type
```

例子里增加了一列，但是报出了缓存的计划不能更改结果类型，可以通过还原原来表的结构解决

```
postgres=# ALTER TABLE tab_test_plancache ADD COLUMN q3 bigint;
ALTER TABLE
postgres=# select * from tab_test_plancache;
        q1        |        q2         | q3
------------------+-------------------+----
              123 |               456 |
              123 |  4567890123456789 |
 4567890123456789 | -4567890123456789 |
 4567890123456789 |               123 |
 4567890123456789 |  4567890123456789 |
(5 rows)

postgres=# ALTER TABLE tab_test_plancache DROP COLUMN q3;
ALTER TABLE
postgres=# EXECUTE prepstmt;
        q1        |        q2
------------------+-------------------
              123 |               456
              123 |  4567890123456789
 4567890123456789 | -4567890123456789
 4567890123456789 |               123
 4567890123456789 |  4567890123456789
(5 rows)

postgres=# EXECUTE prepstmt2(123);
 q1  |        q2
-----+------------------
 123 |              456
 123 | 4567890123456789
(2 rows)
```

## 6.检查使用视图的有效性

如果尝试使用一个视图的话，这个视图不会直接用于生成的计划中，但也是有效的

```
postgres=# CREATE TEMP VIEW pcacheview AS
postgres-#   SELECT * FROM tab_test_plancache;
CREATE VIEW
postgres=# PREPARE vprep AS SELECT * FROM pcacheview ORDER BY q1, q2;
PREPARE
postgres=# EXECUTE vprep;
        q1        |        q2
------------------+-------------------
              123 |               456
              123 |  4567890123456789
 4567890123456789 | -4567890123456789
 4567890123456789 |               123
 4567890123456789 |  4567890123456789
(5 rows)

postgres=# CREATE OR REPLACE TEMP VIEW pcacheview AS
  SELECT q1, q2+1 AS q2 FROM tab_test_plancache ORDER BY q1, q2;
CREATE VIEW
postgres=# EXECUTE vprep;
        q1        |        q2
------------------+-------------------
              123 |               457
              123 |  4567890123456790
 4567890123456789 | -4567890123456788
 4567890123456789 |               124
 4567890123456789 |  4567890123456790
(5 rows)
```

## 7.检查基本 SPI plan 是否有效

```
postgres=# create function cache_test(int) returns int as $$
postgres$# declare total int;
postgres$# begin
postgres$# create table t1_plancache(f1 int);
postgres$# insert into t1_plancache values($1);
postgres$# insert into t1_plancache values(11);
postgres$# insert into t1_plancache values(12);
postgres$# insert into t1_plancache values(13);
postgres$# select sum(f1) into total from t1_plancache;
postgres$# drop table t1_plancache;
postgres$# return total;
postgres$# end
postgres$# $$ language plpgsql;
CREATE FUNCTION

postgres=# select cache_test(1);
 cache_test
------------
         37
(1 row)

postgres=# select cache_test(2);
 cache_test
------------
         38
(1 row)

postgres=# select cache_test(3);
 cache_test
------------
         39
(1 row)

```

## 8.检查 plpgsql“简单表达式”的有效性

```
postgres=# create temp view v1 as
postgres-#   select 2+2 as f1;
CREATE VIEW

postgres=# create function cache_test_2() returns int as $$
postgres$# begin
postgres$# return f1 from v1;
postgres$# end$$ language plpgsql;
CREATE FUNCTION

postgres=# select cache_test_2();
 cache_test_2
--------------
            4
(1 row)

postgres=# create or replace temp view v1 as
postgres-#   select 2+2+4 as f1;
CREATE VIEW
postgres=# select cache_test_2();
 cache_test_2
--------------
            8
(1 row)
```

## 9.检查缓存执行计划使用与 search_path 影响

可以看到，两个 schema 下都有同一张表，修改了 search_path 后，缓存执行计划执行的是 search_path 下的表，所以缓存执行计划会受 search_path 影响。

```
postgres=# create schema s1
postgres-#   create table abc (f1 int);
CREATE SCHEMA
postgres=# create schema s2
postgres-#   create table abc (f1 int);
CREATE SCHEMA
postgres=# insert into s1.abc values(123);
INSERT 0 1
postgres=# insert into s2.abc values(456);
INSERT 0 1
postgres=# set search_path = s1;
SET
postgres=# prepare p1 as select f1 from abc;
PREPARE
postgres=# execute p1;
 f1
-----
 123
(1 row)

postgres=# set search_path = s2;
SET
postgres=# select f1 from abc;
 f1
-----
 456
(1 row)

postgres=# execute p1;
 f1
-----
 456
(1 row)

postgres=# alter table s1.abc add column f2 float8;
ALTER TABLE
postgres=# execute p1;
 f1
-----
 456
(1 row)

postgres=# drop schema s1 cascade;
NOTICE:  drop cascades to table s1.abc
DROP SCHEMA
postgres=# drop schema s2 cascade;
NOTICE:  drop cascades to table abc
DROP SCHEMA
postgres=# reset search_path;
RESET
```

## 10.检查 regclass 常量是否有效

````
postgres=# create  sequence seq;
CREATE SEQUENCE
postgres=# prepare p2 as select nextval('seq');
PREPARE
postgres=# execute p2;

##  nextval

```
   1
```

(1 row)

postgres=# drop sequence seq;
DROP SEQUENCE
postgres=# create  sequence seq;
CREATE SEQUENCE
postgres=# execute p2;

##  nextval

```
   1
```

(1 row)

````

## 11.检查 DDL，然后立即重新使用 SPI plan

```
postgres=# create function cachebug() returns void as $$
postgres$# declare r int;
postgres$# begin
postgres$#   drop table if exists temptable cascade;
postgres$#   create temp table temptable as select * from generate_series(1,3) as f1;
postgres$#   create temp view vv as select * from temptable;
postgres$#   for r in select * from vv order by 1 loop
postgres$#     raise notice '%', r;
postgres$#   end loop;
postgres$# end$$ language plpgsql;
CREATE FUNCTION

postgres=# select cachebug();
NOTICE:  table "temptable" does not exist, skipping
CONTEXT:  SQL statement "drop table if exists temptable cascade"
PL/pgSQL function cachebug() line 4 at SQL statement
referenced column: cachebug
NOTICE:  1
CONTEXT:  referenced column: cachebug
NOTICE:  2
CONTEXT:  referenced column: cachebug
NOTICE:  3
CONTEXT:  referenced column: cachebug
 cachebug
----------

(1 row)

postgres=# select cachebug();
NOTICE:  drop cascades to view vv
CONTEXT:  SQL statement "drop table if exists temptable cascade"
PL/pgSQL function cachebug() line 4 at SQL statement
referenced column: cachebug
NOTICE:  1
CONTEXT:  referenced column: cachebug
NOTICE:  2
CONTEXT:  referenced column: cachebug
NOTICE:  3
CONTEXT:  referenced column: cachebug
 cachebug
----------

(1 row)
```
