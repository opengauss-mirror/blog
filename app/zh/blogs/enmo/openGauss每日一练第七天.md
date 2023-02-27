---
title: 'openGauss每日一练第7天'

date: '2022-04-20'

category: 'blog'
tags: ['openGauss每日一练第7天']

archives: '2022-04'

author: '云和恩墨'

summary: 'openGauss每日一练第7天'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# openGauss 每日一练第 7 天

本文出处：[https://www.modb.pro/db/193181](https://www.modb.pro/db/193181)

## 学习地址

[https://www.modb.pro/course/133](https://www.modb.pro/course/133)

## 学习目标

学习 openGauss 表空间

表空间用于管理数据对象，与磁盘上的一个目录对应

## 课后作业

### **1.创建表空间，表空间 tspc1 使用相对路径指定所在目录，表空间 tspc2 指定 owner 为 Lucy**

```
SQL文本：
create tablespace tspc1 relative location 'tbs/tspc1';
create user lucy password 'lucy_123';
alter tablespace tspc1 owner to lucy;
\db+

omm=# create tablespace tspc1 relative location 'tbs/tspc1';
CREATE TABLESPACE
omm=# create user lucy password 'lucy_123';
CREATE ROLE
omm=# alter tablespace tspc1 owner to lucy;
ALTER TABLESPACE
omm=# \db+
                       List of tablespaces
    Name    | Owner | Location  | Access privileges | Description
------------+-------+-----------+-------------------+-------------
 pg_default | omm   |           |                   |
 pg_global  | omm   |           |                   |
 tspc1      | lucy  | tbs/tspc1 |                   |
(3 rows)

omm=#

```

### **2.在表空间 tspc1 中建表，并使用视图 pg_tables 查看信息**

```
SQL文本：
create table customer
( c_customer_sk             integer,
  c_customer_id             char(5),
  c_first_name              char(6),
  c_last_name               char(8)
)
tablespace tspc1;
select * from pg_tables where tablename = 'customer';

omm=# create table customer
omm-# ( c_customer_sk             integer,
omm(#   c_customer_id             char(5),
omm(#   c_first_name              char(6),
omm(#   c_last_name               char(8)
omm(# )
omm-# tablespace tspc1;
CREATE TABLE
omm=# select * from pg_tables where tablename = 'customer';
 schemaname | tablename | tableowner | tablespace | hasindexes | hasrules | hastriggers | tablecreator |            created            |         last_ddl_time
------------+-----------+------------+------------+------------+----------+-------------+--------------+-------------------------------+-------------------------------
 public     | customer  | omm        | tspc1      | f          | f        | f           | omm          | 2021-12-08 15:07:35.751084+08 | 2021-12-08 15:07:35.751084+08
(1 row)

omm=#

```

### **3.重命名 tspc1，修改 tspc2 的用户为 Lily，使用\db 查看表空间信息**

```
SQL文本：
alter tablespace tspc1 rename to tspc2;
create user lily password 'lily_123';
alter tablespace tspc2 owner to lily;
\db+

omm=# alter tablespace tspc1 rename to tspc2;
ALTER TABLESPACE
omm=# create user lily password 'lily_123';
CREATE ROLE
omm=# alter tablespace tspc2 owner to lily;
ALTER TABLESPACE
omm=# \db+
                       List of tablespaces
    Name    | Owner | Location  | Access privileges | Description
------------+-------+-----------+-------------------+-------------
 pg_default | omm   |           |                   |
 pg_global  | omm   |           |                   |
 tspc2      | lily  | tbs/tspc1 |                   |
(3 rows)

omm=#
```

### **4.删除表空间**

```
SQL文本：
drop tablespace if exists tspc2;
drop table customer;
drop tablespace if exists tspc2;

omm=# drop tablespace if exists tspc2;
ERROR:  tablespace "tspc2" is not empty
omm=# drop table customer;
DROP TABLE
omm=# drop tablespace if exists tspc2;
DROP TABLESPACE
omm=#

```
