---
title: 'openGauss每日一练（行存和列存）'

date: '2022-04-25'

category: 'blog'
tags: ['openGauss每日一练（行存和列存）']

archives: '2022-04'

author: '云和恩墨'

summary: 'openGauss每日一练（行存和列存）'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# openGauss 每日一练（行存和列存）

本文出处：[https://www.modb.pro/db/224180](https://www.modb.pro/db/224180)

## 学习地址

[https://www.modb.pro/course/133](https://www.modb.pro/course/133)

## 学习目标

**学习 openGauss 存储模型-行存和列存**

行存储是指将表按行存储到硬盘分区上，列存储是指将表按列存储到硬盘分区上。默认情况下，创建的表为行存储。

行、列存储模型各有优劣，通常用于 TP 场景的数据库，默认使用行存储，仅对执行复杂查询且数据量大的 AP 场景时，才使用列存储

## 课后作业

### **1.创建行存表和列存表，并批量插入 10 万条数据(行存表和列存表数据相同)**

```
omm=# create table test1 (id integer,name varchar2(20));
CREATE TABLE                        ^
omm=# insert into test1 select n,'test'||n from generate_series(1,100000) n;
INSERT 0 100000
omm=# create table test2 (id integer,name varchar2(20)) with (orientation = column);
CREATE TABLE
omm=# insert into test2 select * from test1;
INSERT 0 100000
omm=#
```

### **2.对比行存表和列存表空间大小**

```
omm=# \d+
                                                List of relations
 Schema |         Name         | Type  | Owner |    Size    |               Storage                | Description
--------+----------------------+-------+-------+------------+--------------------------------------+-------------
 public | test1                | table | omm   | 4352 kB    | {orientation=row,compression=no}     |
 public | test2                | table | omm   | 648 kB     | {orientation=column,compression=low} |
(2 rows)

omm=#
```

### **3.对比查询一列和插入一行的速度**

```
omm=# explain analyze insert into test1 values(1,'zhang');
                                         QUERY PLAN
---------------------------------------------------------------------------------------------
 [Bypass]
 Insert on test1  (cost=0.00..0.01 rows=1 width=0) (actual time=0.067..0.068 rows=1 loops=1)
   ->  Result  (cost=0.00..0.01 rows=1 width=0) (actual time=0.000..0.001 rows=1 loops=1)
 Total runtime: 0.119 ms
(4 rows)

omm=# explain analyze insert into test2 values(1,'zhang');
                                         QUERY PLAN
---------------------------------------------------------------------------------------------
 Insert on test2  (cost=0.00..0.01 rows=1 width=0) (actual time=0.216..0.217 rows=1 loops=1)
   ->  Result  (cost=0.00..0.01 rows=1 width=0) (actual time=0.001..0.001 rows=1 loops=1)
 Total runtime: 0.262 ms
(3 rows)

omm=#
```

### **4.清理数据**

```
omm=# drop table test1;
DROP TABLE
omm=# drop table test2;
DROP TABLE
omm=#
```
