+++

title = "openGauss每日一练（分区表索引）" 

date = "2022-04-21" 

tags = ["openGauss每日一练（分区表索引）"] 

archives = "2022-04" 

author = "云和恩墨" 

summary = "openGauss每日一练（分区表索引）"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# openGauss每日一练（分区表索引）

本文出处：[https://www.modb.pro/db/222617](https://www.modb.pro/db/222617)

## 学习地址

[https://www.modb.pro/course/133](https://www.modb.pro/course/133)

## 学习目标

**学习openGauss分区表索引**

## 课后作业

### **1.创建范围分区表products, 为表创建分区表索引1，不指定索引分区的名称，创建分区表索引2，并指定索引分区的名称，创建GLOBAL分区索引3**

```
--SQL文本：
create table products
( id integer,   
  name char(8) 
)
partition by range (id)
(partition products_p1 values less than (10),
 partition products_p2 values less than (20),
 partition products_p3 values less than (30),
 partition products_p4 values less than (40),
 partition products_p5 values less than (50)
);
create index products_index1 on products(id) local;
create index products_index2 on products(id) local
(
partition id_index1,
partition id_index2,
partition id_index3,
partition id_index4,
partition id_index5
);
create index products_index3 on products(name) global;

omm=# create table products
omm-# ( id integer,   
omm(#   name char(8) 
omm(# )
omm-# partition by range (id)
omm-# (partition products_p1 values less than (10),
omm(#  partition products_p2 values less than (20),
omm(#  partition products_p3 values less than (30),
omm(#  partition products_p4 values less than (40),
omm(#  partition products_p5 values less than (50)
omm(# );
CREATE TABLE
omm=# create index products_index1 on products(id) local;
CREATE INDEX
omm=# create index products_index2 on products(id) local
omm-# (
omm(# partition id_index1,
omm(# partition id_index2,
omm(# partition id_index3,
omm(# partition id_index4,
omm(# partition id_index5
omm(# );
CREATE INDEX
omm=# create index products_index3 on products(name) global;
CREATE INDEX
omm=# 

```

### **2.在分区表索引1上，修改分区表索引的表空间，重命名分区表索引**

```
--SQL文本：
alter index products_index1 move partition products_p1_id_idx tablespace pgtbs1;
alter index products_index1 move partition products_p2_id_idx tablespace pgtbs1;
alter index products_index1 move partition products_p3_id_idx tablespace pgtbs1;
alter index products_index1 move partition products_p4_id_idx tablespace pgtbs1;
alter index products_index1 move partition products_p5_id_idx tablespace pgtbs1;
alter index products_index1 rename partition products_p1_id_idx to products_p1_id_idx_new;
alter index products_index1 rename partition products_p2_id_idx to products_p2_id_idx_new;
alter index products_index1 rename partition products_p3_id_idx to products_p3_id_idx_new;
alter index products_index1 rename partition products_p4_id_idx to products_p4_id_idx_new;
alter index products_index1 rename partition products_p5_id_idx to products_p5_id_idx_new;

omm=# alter index products_index1 move partition products_p1_id_idx tablespace pgtbs1;
ALTER INDEX
omm=# alter index products_index1 move partition products_p2_id_idx tablespace pgtbs1;
ALTER INDEX
omm=# alter index products_index1 move partition products_p3_id_idx tablespace pgtbs1;
ALTER INDEX
omm=# alter index products_index1 move partition products_p4_id_idx tablespace pgtbs1;
ALTER INDEX
omm=# alter index products_index1 move partition products_p5_id_idx tablespace pgtbs1;
ALTER INDEX
omm=# alter index products_index1 rename partition products_p1_id_idx to products_p1_id_idx_new;
ALTER INDEX
omm=# alter index products_index1 rename partition products_p2_id_idx to products_p2_id_idx_new;
ALTER INDEX
omm=# alter index products_index1 rename partition products_p3_id_idx to products_p3_id_idx_new;
ALTER INDEX
omm=# alter index products_index1 rename partition products_p4_id_idx to products_p4_id_idx_new;
ALTER INDEX
omm=# alter index products_index1 rename partition products_p5_id_idx to products_p5_id_idx_new;
ALTER INDEX
omm=# 

```

### **3.在分区表索引2上，重建单个索引分区和分区上的所有索引**

```
--SQL文本：
reindex index products_index2 partition id_index1;
reindex index products_index2 partition id_index2;
reindex index products_index2 partition id_index3;
reindex index products_index2 partition id_index4;
reindex index products_index2 partition id_index5;

omm=# reindex index products_index2 partition id_index5;
REINDEX
omm=# reindex index products_index2 partition id_index1;
REINDEX
omm=# reindex index products_index2 partition id_index2;
REINDEX
omm=# reindex index products_index2 partition id_index3;
REINDEX
omm=# reindex index products_index2 partition id_index4;
REINDEX
omm=# reindex index products_index2 partition id_index5;
REINDEX
omm=# 

```

### **4.使用\d+、系统视图pg_indexes和pg_partition查看索引信息**

```
--SQL文本：
\d+ products
select * from pg_indexes where tablename='products';
select * from pg_partition where tablename='products';

omm=# \d+ products
                          Table "public.products"
 Column |     Type     | Modifiers | Storage  | Stats target | Description 
--------+--------------+-----------+----------+--------------+-------------
 id     | integer      |           | plain    |              | 
 name   | character(8) |           | extended |              | 
Indexes:
    "products_index1" btree (id) LOCAL(PARTITION products_p1_id_idx_new TABLESPACE pgtbs1, PARTITION products_p2_id_idx_new TABLESPACE pgtbs1, PARTITION products_p3_id_idx_new TABLESPACE pgtbs1, PARTITION products_p4_id_idx_new TABLESPACE pgtbs1, PARTITION products_p5_id_idx_new TABLESPACE pgtbs1)  TABLESPACE pg_default
    "products_index2" btree (id) LOCAL(PARTITION id_index1, PARTITION id_index2, PARTITION id_index3, PARTITION id_index4, PARTITION id_index5)  TABLESPACE pg_default
    "products_index3" btree (name) TABLESPACE pg_default
Range partition by(id)
Number of partition: 5 (View pg_partition to check each partition range.)
Has OIDs: no
Options: orientation=row, compression=no

omm=# select * from pg_indexes where tablename='products';
 schemaname | tablename |    indexname    | tablespace |                                                                                                                                                                          indexde
f                                                                                                                                                                          
------------+-----------+-----------------+------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 public     | products  | products_index1 |            | CREATE INDEX products_index1 ON products USING btree (id) LOCAL(PARTITION products_p1_id_idx_new TABLESPACE pgtbs1, PARTITION products_p2_id_idx_new TABLESPACE pgtbs1, PARTITIO
N products_p3_id_idx_new TABLESPACE pgtbs1, PARTITION products_p4_id_idx_new TABLESPACE pgtbs1, PARTITION products_p5_id_idx_new TABLESPACE pgtbs1)  TABLESPACE pg_default
 public     | products  | products_index2 |            | CREATE INDEX products_index2 ON products USING btree (id) LOCAL(PARTITION id_index1, PARTITION id_index2, PARTITION id_index3, PARTITION id_index4, PARTITION id_index5)  TABLES
PACE pg_default
 public     | products  | products_index3 |            | CREATE INDEX products_index3 ON products USING btree (name) TABLESPACE pg_default
(3 rows)

omm=# select * from pg_partition;
        relname         | parttype | parentid | rangenum | intervalnum | partstrategy | relfilenode | reltablespace | relpages | reltuples | relallvisible | reltoastrelid | reltoastidxid | indextblid | indisusable | reldeltarelid | r
eldeltaidx | relcudescrelid | relcudescidx | relfrozenxid | intspnum | partkey | intervaltablespace | interval | boundaries | transit |                    reloptions                     | relfrozenxid64 
------------------------+----------+----------+----------+-------------+--------------+-------------+---------------+----------+-----------+---------------+---------------+---------------+------------+-------------+---------------+--
-----------+----------------+--------------+--------------+----------+---------+--------------------+----------+------------+---------+---------------------------------------------------+----------------
 products               | r        |    33404 |        0 |           0 | r            |           0 |             0 |        0 |         0 |             0 |             0 |             0 |          0 | t           |             0 |  
         0 |              0 |            0 | 0            |          | 1       |                    |          |            |         | {orientation=row,compression=no,wait_clean_gpi=n} |              0
 products_p1            | p        |    33404 |        0 |           0 | r            |       33408 |             0 |        0 |         0 |             0 |             0 |             0 |          0 | t           |             0 |  
         0 |              0 |            0 | 213746       |          |         |                    |          | {10}       |         | {orientation=row,compression=no}                  |         213746
 products_p2            | p        |    33404 |        0 |           0 | r            |       33409 |             0 |        0 |         0 |             0 |             0 |             0 |          0 | t           |             0 |  
         0 |              0 |            0 | 213746       |          |         |                    |          | {20}       |         | {orientation=row,compression=no}                  |         213746
 products_p3            | p        |    33404 |        0 |           0 | r            |       33410 |             0 |        0 |         0 |             0 |             0 |             0 |          0 | t           |             0 |  
         0 |              0 |            0 | 213746       |          |         |                    |          | {30}       |         | {orientation=row,compression=no}                  |         213746
 products_p4            | p        |    33404 |        0 |           0 | r            |       33411 |             0 |        0 |         0 |             0 |             0 |             0 |          0 | t           |             0 |  
         0 |              0 |            0 | 213746       |          |         |                    |          | {40}       |         | {orientation=row,compression=no}                  |         213746
 products_p5            | p        |    33404 |        0 |           0 | r            |       33412 |             0 |        0 |         0 |             0 |             0 |             0 |          0 | t           |             0 |  
         0 |              0 |            0 | 213746       |          |         |                    |          | {50}       |         | {orientation=row,compression=no}                  |         213746
 id_index5              | x        |    33419 |        0 |           0 | n            |       33441 |             0 |        1 |         0 |             0 |             0 |             0 |      33412 | t           |             0 |  
         0 |              0 |            0 | 0            |          |         |                    |          |            |         |                                                   |              0
 products_p1_id_idx_new | x        |    33413 |        0 |           0 | n            |       33427 |         33426 |        1 |         0 |             0 |             0 |             0 |      33408 | t           |             0 |  
         0 |              0 |            0 | 0            |          |         |                    |          |            |         |                                                   |              0
 products_p2_id_idx_new | x        |    33413 |        0 |           0 | n            |       33428 |         33426 |        1 |         0 |             0 |             0 |             0 |      33409 | t           |             0 |  
         0 |              0 |            0 | 0            |          |         |                    |          |            |         |                                                   |              0
 products_p3_id_idx_new | x        |    33413 |        0 |           0 | n            |       33429 |         33426 |        1 |         0 |             0 |             0 |             0 |      33410 | t           |             0 |  
         0 |              0 |            0 | 0            |          |         |                    |          |            |         |                                                   |              0
 products_p4_id_idx_new | x        |    33413 |        0 |           0 | n            |       33430 |         33426 |        1 |         0 |             0 |             0 |             0 |      33411 | t           |             0 |  
         0 |              0 |            0 | 0            |          |         |                    |          |            |         |                                                   |              0
 products_p5_id_idx_new | x        |    33413 |        0 |           0 | n            |       33431 |         33426 |        1 |         0 |             0 |             0 |             0 |      33412 | t           |             0 |  
         0 |              0 |            0 | 0            |          |         |                    |          |            |         |                                                   |              0
 id_index1              | x        |    33419 |        0 |           0 | n            |       33437 |             0 |        1 |         0 |             0 |             0 |             0 |      33408 | t           |             0 |  
         0 |              0 |            0 | 0            |          |         |                    |          |            |         |                                                   |              0
 id_index2              | x        |    33419 |        0 |           0 | n            |       33438 |             0 |        1 |         0 |             0 |             0 |             0 |      33409 | t           |             0 |  
         0 |              0 |            0 | 0            |          |         |                    |          |            |         |                                                   |              0
 id_index3              | x        |    33419 |        0 |           0 | n            |       33439 |             0 |        1 |         0 |             0 |             0 |             0 |      33410 | t           |             0 |  
         0 |              0 |            0 | 0            |          |         |                    |          |            |         |                                                   |              0
 id_index4              | x        |    33419 |        0 |           0 | n            |       33440 |             0 |        1 |         0 |             0 |             0 |             0 |      33411 | t           |             0 |  
         0 |              0 |            0 | 0            |          |         |                    |          |            |         |                                                   |              0
(16 rows)

omm=# 

```

### **5.删除索引、表和表空间**

```
--SQL文本：drop index products_index1;
drop index products_index2;
drop index products_index3;drop table products;
drop tablespace pgtbs1;

omm=# drop index products_index1;
DROP INDEX
omm=# drop index products_index2;
DROP INDEX
omm=# drop index products_index3;
DROP INDEX
omm=# drop table products;
DROP TABLE
omm=# drop tablespace pgtbs1;
DROP TABLESPACEomm=# 

```
