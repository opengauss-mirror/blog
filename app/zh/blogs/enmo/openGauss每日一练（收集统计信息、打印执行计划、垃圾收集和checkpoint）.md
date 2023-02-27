---
title: 'openGauss每日一练（收集统计信息、打印执行计划、垃圾收集和checkpoint）'

date: '2022-04-25'

category: 'blog'
tags: ['openGauss每日一练（收集统计信息、打印执行计划、垃圾收集和checkpoint）']

archives: '2022-04'

author: '云和恩墨'

summary: 'openGauss每日一练（收集统计信息、打印执行计划、垃圾收集和checkpoint）'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# openGauss 每日一练（收集统计信息、打印执行计划、垃圾收集和 checkpoint）

本文出处：[https://www.modb.pro/db/224177](https://www.modb.pro/db/224177)

## 学习地址

[https://www.modb.pro/course/133](https://www.modb.pro/course/133)

## 学习目标

**学习 openGauss 收集统计信息、打印执行计划、垃圾收集和 checkpoint**

## 课后作业

### **1.创建分区表，并用 generate_series(1,N)函数对表插入数据**

```
omm=# create table store
omm-# ( id integer,
omm(#   name char(8)
omm(# )
omm-# partition by range (id)
omm-# (partition store_p1 values less than (10),
omm(#  partition store_p2 values less than (50),
omm(#  partition store_p3 values less than (100),
omm(#  partition store_p4 values less than (150),
omm(#  partition store_p5 values less than (200)
The connection to the server was lost. Attempting reset:
CREATE TABLE
omm=# insert into store select n,'test'||n from generate_series(1,180) n;
INSERT 0 180
omm=#
```

### **2.收集表统计信息**

```
omm=# select relname,relpages,reltuples from pg_class where relname='store';
 relname | relpages | reltuples
---------+----------+-----------
 store   |        0 |         0
(1 row)

omm=# analyze verbose store;
INFO:  analyzing "public.store"(dn_6001_6002 pid=71262)
INFO:  ANALYZE INFO : "store": scanned 1 of 1 pages, containing 9 live rows and 0 dead rows; 9 rows in sample, 9 estimated total rows(dn_6001_6002 pid=71262)
INFO:  ANALYZE INFO : "store": scanned 1 of 1 pages, containing 40 live rows and 0 dead rows; 40 rows in sample, 40 estimated total rows(dn_6001_6002 pid=71262)
INFO:  ANALYZE INFO : "store": scanned 1 of 1 pages, containing 50 live rows and 0 dead rows; 50 rows in sample, 50 estimated total rows(dn_6001_6002 pid=71262)
INFO:  ANALYZE INFO : "store": scanned 1 of 1 pages, containing 50 live rows and 0 dead rows; 50 rows in sample, 50 estimated total rows(dn_6001_6002 pid=71262)
INFO:  ANALYZE INFO : "store": scanned 1 of 1 pages, containing 31 live rows and 0 dead rows; 31 rows in sample, 31 estimated total rows(dn_6001_6002 pid=71262)
ANALYZE
omm=# select relname,relpages,reltuples from pg_class where relname='store';
 relname | relpages | reltuples
---------+----------+-----------
 store   |        5 |       180
(1 row)

omm=#
```

### **3.显示简单查询的执行计划；建立索引并显示有索引条件的执行计划**

```
omm=# explain select * from store;
                                QUERY PLAN
--------------------------------------------------------------------------
 Partition Iterator  (cost=0.00..6.80 rows=180 width=13)
   Iterations: 5
   ->  Partitioned Seq Scan on store  (cost=0.00..6.80 rows=180 width=13)
         Selected Partitions:  1..5
(4 rows)

omm=#omm=# create index store_index1 on store(id) local
omm-# (
omm(# partition id_index1,
omm(# partition id_index2,
omm(# partition id_index3,
omm(# partition id_index4,
omm(# partition id_index5
omm(# );
CREATE INDEX
omm=# explain select * from store where id=100;
                               QUERY PLAN
------------------------------------------------------------------------
 Partition Iterator  (cost=0.00..3.25 rows=1 width=13)
   Iterations: 1
   ->  Partitioned Seq Scan on store  (cost=0.00..3.25 rows=1 width=13)
         Filter: (id = 100)
         Selected Partitions:  4
(5 rows)

omm=#
```

### **4.更新表数据，并做垃圾收集**

```
omm=# update store set id=id+1;
UPDATE 180
omm=# vacuum (verbose,analyze) store;
INFO:  vacuuming "public.store"(dn_6001_6002 pid=71262)
INFO:  index "store_index1" now contains 17 row versions in 2 pages(dn_6001_6002 pid=71262)
DETAIL:  0 index row versions were removed.
0 index pages have been deleted, 0 are currently reusable.
CPU 0.00s/0.00u sec elapsed 0.00 sec.
INFO:  "store": found 0 removable, 17 nonremovable row versions in 1 out of 1 pages(dn_6001_6002 pid=71262)
DETAIL:  9 dead row versions cannot be removed yet.
There were 0 unused item pointers.
0 pages are entirely empty.
CPU 0.00s/0.00u sec elapsed 0.00 sec.
INFO:  vacuuming "public.store"(dn_6001_6002 pid=71262)
INFO:  index "store_index1" now contains 80 row versions in 2 pages(dn_6001_6002 pid=71262)
DETAIL:  0 index row versions were removed.
0 index pages have been deleted, 0 are currently reusable.
CPU 0.00s/0.00u sec elapsed 0.00 sec.
INFO:  "store": found 0 removable, 80 nonremovable row versions in 1 out of 1 pages(dn_6001_6002 pid=71262)
DETAIL:  40 dead row versions cannot be removed yet.
There were 0 unused item pointers.
0 pages are entirely empty.
CPU 0.00s/0.00u sec elapsed 0.00 sec.
INFO:  vacuuming "public.store"(dn_6001_6002 pid=71262)
INFO:  index "store_index1" now contains 100 row versions in 2 pages(dn_6001_6002 pid=71262)
DETAIL:  0 index row versions were removed.
0 index pages have been deleted, 0 are currently reusable.
CPU 0.00s/0.00u sec elapsed 0.00 sec.
INFO:  "store": found 0 removable, 100 nonremovable row versions in 1 out of 1 pages(dn_6001_6002 pid=71262)
DETAIL:  50 dead row versions cannot be removed yet.
There were 0 unused item pointers.
0 pages are entirely empty.
CPU 0.00s/0.00u sec elapsed 0.00 sec.
INFO:  vacuuming "public.store"(dn_6001_6002 pid=71262)
INFO:  index "store_index1" now contains 100 row versions in 2 pages(dn_6001_6002 pid=71262)
DETAIL:  0 index row versions were removed.
0 index pages have been deleted, 0 are currently reusable.
CPU 0.00s/0.00u sec elapsed 0.00 sec.
INFO:  "store": found 0 removable, 100 nonremovable row versions in 1 out of 1 pages(dn_6001_6002 pid=71262)
DETAIL:  50 dead row versions cannot be removed yet.
There were 0 unused item pointers.
0 pages are entirely empty.
CPU 0.00s/0.00u sec elapsed 0.00 sec.
INFO:  vacuuming "public.store"(dn_6001_6002 pid=71262)
INFO:  index "store_index1" now contains 63 row versions in 2 pages(dn_6001_6002 pid=71262)
DETAIL:  0 index row versions were removed.
0 index pages have been deleted, 0 are currently reusable.
CPU 0.00s/0.00u sec elapsed 0.00 sec.
INFO:  "store": found 0 removable, 63 nonremovable row versions in 1 out of 1 pages(dn_6001_6002 pid=71262)
DETAIL:  31 dead row versions cannot be removed yet.
There were 0 unused item pointers.
0 pages are entirely empty.
CPU 0.00s/0.00u sec elapsed 0.00 sec.
INFO:  analyzing "public.store"(dn_6001_6002 pid=71262)
INFO:  ANALYZE INFO : "store": scanned 1 of 1 pages, containing 8 live rows and 9 dead rows; 8 rows in sample, 8 estimated total rows(dn_6001_6002 pid=71262)
INFO:  ANALYZE INFO : "store": scanned 1 of 1 pages, containing 40 live rows and 40 dead rows; 40 rows in sample, 40 estimated total rows(dn_6001_6002 pid=71262)
INFO:  ANALYZE INFO : "store": scanned 1 of 1 pages, containing 50 live rows and 50 dead rows; 50 rows in sample, 50 estimated total rows(dn_6001_6002 pid=71262)
INFO:  ANALYZE INFO : "store": scanned 1 of 1 pages, containing 50 live rows and 50 dead rows; 50 rows in sample, 50 estimated total rows(dn_6001_6002 pid=71262)
INFO:  ANALYZE INFO : "store": scanned 1 of 1 pages, containing 32 live rows and 31 dead rows; 32 rows in sample, 32 estimated total rows(dn_6001_6002 pid=71262)
VACUUM
omm=#
```

### **5.清理数据**

```
omm=# drop index store_index1;
DROP INDEX
omm=# drop table store;
DROP TABLE
omm=#
```
