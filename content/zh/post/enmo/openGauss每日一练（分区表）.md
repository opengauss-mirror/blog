+++

title = "openGauss每日一练（分区表）" 

date = "2022-04-21" 

tags = ["openGauss每日一练（分区表）"] 

archives = "2022-04" 

author = "云和恩墨" 

openGauss每日一练（分区表）

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# openGauss每日一练（分区表）

本文出处：[https://www.modb.pro/db/218257](https://www.modb.pro/db/218257)

## 学习地址

[https://www.modb.pro/course/133](https://www.modb.pro/course/133)

## 学习目标

**学习openGauss分区表**

分区表是把逻辑上的一张表根据某种方案分成几张物理块进行存储，这张逻辑上的表称之为分区表，物理块称之为分区。

分区表是一张逻辑表，不存储数据，数据实际是存储在分区上的。

## 课后作业

### **1.创建一个含有5个分区的范围分区表store，在每个分区中插入记录**

```
SQL文本：
建表语句
create table store
( id integer,   
  name char(8) 
)
partition by range (id)
(partition store_p1 values less than (10),
 partition store_p2 values less than (20),
 partition store_p3 values less than (30),
 partition store_p4 values less than (40),
 partition store_p5 values less than (50)
);
插入语句
insert into store select n,'test'||n from generate_series(1,45) n;

omm=# create table store
omm-# ( id integer,   
omm(#   name char(8) 
omm(# )
omm-# partition by range (id)
omm-# (partition store_p1 values less than (10),
omm(#  partition store_p2 values less than (20),
omm(#  partition store_p3 values less than (30),
omm(#  partition store_p4 values less than (40),
omm(#  partition store_p5 values less than (50)
omm(# );
CREATE TABLE
omm=# insert into store select n,'test'||n from generate_series(1,45) n;
INSERT 0 45
omm=# 

```

### **2.查看分区1上的数据**

```
SQL文本：
select count(*) from store paratition(store_p1);

omm=# select count(*) from store paratition(store_p1);
 count 
-------
    9
(1 row)

omm=# 

```

### **3.重命名分区2**

```
SQL文本：
alter table store rename partition store_p2 to store_p2_new;
select relname,parttype,boundaries from pg_partition;

omm=# alter table store rename partition store_p2 to store_p2_new;
ALTER TABLE
omm=# select relname,parttype,boundaries from pg_partition;
   relname    | parttype | boundaries 
--------------+----------+------------
 store        | r        | 
 store_p1     | p        | {10}
 store_p3     | p        | {30}
 store_p4     | p        | {40}
 store_p5     | p        | {50}
 store_p2_new | p        | {20}
(6 rows)

omm=# 
```

### **4.删除分区5**

```
SQL文本：
alter table store drop partition store_p5;
select relname,parttype,boundaries from pg_partition;

omm=# alter table store drop partition store_p5;
ALTER TABLE
omm=# select relname,parttype,boundaries from pg_partition;
   relname    | parttype | boundaries 
--------------+----------+------------
 store        | r        | 
 store_p1     | p        | {10}
 store_p3     | p        | {30}
 store_p4     | p        | {40}
 store_p2_new | p        | {20}
(5 rows)

omm=# 

```

### **5.增加分区6**

```
SQL文本：
alter table store add partition store_p6 values less than (60);
select relname,parttype,boundaries from pg_partition;

omm=# alter table store add partition store_p6 values less than (60);
ALTER TABLE
omm=# select relname,parttype,boundaries from pg_partition;
   relname    | parttype | boundaries 
--------------+----------+------------
 store        | r        | 
 store_p1     | p        | {10}
 store_p3     | p        | {30}
 store_p4     | p        | {40}
 store_p2_new | p        | {20}
 store_p6     | p        | {60}
(6 rows)

omm=# 

```

### **6.在系统表pg_partition中查看分区信息**

```
SQL文本：
select * from pg_partition;

omm=# select * from pg_partition;
   relname    | parttype | parentid | rangenum | intervalnum | partstrategy | relfilenode | reltablespace | relpages | reltuples | relallvisible | reltoastrelid | reltoastidxid | indextblid | indisusable | reldeltarelid | reldeltaidx
 | relcudescrelid | relcudescidx | relfrozenxid | intspnum | partkey | intervaltablespace | interval | boundaries | transit |                    reloptions                     | relfrozenxid64 
--------------+----------+----------+----------+-------------+--------------+-------------+---------------+----------+-----------+---------------+---------------+---------------+------------+-------------+---------------+------------
-+----------------+--------------+--------------+----------+---------+--------------------+----------+------------+---------+---------------------------------------------------+----------------
 store        | r        |    33243 |        0 |           0 | r            |           0 |             0 |        0 |         0 |             0 |             0 |             0 |          0 | t           |             0 |           0
 |              0 |            0 | 0            |          | 1       |                    |          |            |         | {orientation=row,compression=no,wait_clean_gpi=n} |              0
 store_p1     | p        |    33243 |        0 |           0 | r            |       33247 |             0 |        0 |         0 |             0 |             0 |             0 |          0 | t           |             0 |           0
 |              0 |            0 | 193289       |          |         |                    |          | {10}       |         | {orientation=row,compression=no}                  |         193289
 store_p3     | p        |    33243 |        0 |           0 | r            |       33249 |             0 |        0 |         0 |             0 |             0 |             0 |          0 | t           |             0 |           0
 |              0 |            0 | 193289       |          |         |                    |          | {30}       |         | {orientation=row,compression=no}                  |         193289
 store_p4     | p        |    33243 |        0 |           0 | r            |       33250 |             0 |        0 |         0 |             0 |             0 |             0 |          0 | t           |             0 |           0
 |              0 |            0 | 193289       |          |         |                    |          | {40}       |         | {orientation=row,compression=no}                  |         193289
 store_p2_new | p        |    33243 |        0 |           0 | r            |       33248 |             0 |        0 |         0 |             0 |             0 |             0 |          0 | t           |             0 |           0
 |              0 |            0 | 193289       |          |         |                    |          | {20}       |         | {orientation=row,compression=no}                  |         193289
 store_p6     | p        |    33243 |        0 |           0 | r            |       33252 |             0 |        0 |         0 |             0 |             0 |             0 |          0 | t           |             0 |           0
 |              0 |            0 | 193294       |          |         |                    |          | {60}       |         | {orientation=row,compression=no}                  |         193294
(6 rows)

omm=# 

```

### **7.删除分区表**

```
SQL文本：
drop table store;

omm=# drop table store;
DROP TABLE
omm=# 

```
