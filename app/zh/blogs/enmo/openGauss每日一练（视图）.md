---
title: 'openGauss每日一练（视图）'

date: '2022-04-21'

category: 'blog'
tags: ['openGauss每日一练（视图）']

archives: '2022-04'

author: '云和恩墨'

summary: 'openGauss每日一练（视图）'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# openGauss 每日一练（视图）

本文出处：[https://www.modb.pro/db/222619](https://www.modb.pro/db/222619)

## 学习地址

[https://www.modb.pro/course/133](https://www.modb.pro/course/133)

## 学习目标

**学习 openGauss 视图**

视图与基本表不同，是一个虚拟的表。数据库中仅存放视图的定义，而不存放视图对应的数据，这些数据仍存放在原来的基本表中。

## 课后作业

### **1.为系统表 PG_DATABASE 创建视图，重命名视图并修改 owner 为 jim,**

```
--SQL文本
create view v_pg_database as select * from pg_database;
alter view v_pg_database rename to v_pg_database_new
create user jim identified by 'jim@1234';
alter view v_pg_database_new owner to jim;

omm=# create view v_pg_database as select * from pg_database;
CREATE VIEW
omm=# alter view v_pg_database rename to v_pg_database_new;
ALTER VIEW
omm=# create user jim identified by 'jim@1234';
CREATE ROLE
omm=# alter view v_pg_database_new owner to jim;
ALTER VIEW
omm=#

```

### **2.创建一个用户表 student，并在用户表上创建视图，修改视图 schema;**

```
--SQL文本
create table student
(id integer,
name char(10)
);
create view v_student as select * from student;
create schema schema1;
alter view v_student set schema schema1;

omm=# create table student
omm-# (id integer,
omm(# name char(10)
omm(# );
CREATE TABLE                        ^
omm=# create view v_student as select * from student;
CREATE VIEW
omm=# create schema schema1;
CREATE SCHEMA
omm=# alter view v_student set schema schema1;
ALTER VIEW
omm=#

```

### **3.使用 pg_views 查看视图信息**

```
--SQL文本
select schemaname,viewname,viewowner from pg_views where viewname in ('v_pg_database_new','v_student');

omm=# select schemaname,viewname,viewowner from pg_views where viewname in ('v_pg_database_new','v_student');
 schemaname |     viewname      | viewowner
------------+-------------------+-----------
 public     | v_pg_database_new | jim
 schema1    | v_student         | omm
(2 rows)

omm=#

```

### **4.删除视图、表、用户**

```
--SQL文本
drop view v_pg_database_new;
drop view schema1.v_student;
drop table student;
drop user jim;

omm=# drop view v_pg_database_new;
DROP VIEW
omm=# drop view schema1.v_student;
DROP VIEW
omm=# drop table student;
DROP TABLE
omm=# drop user jim;
DROP ROLE
omm=#

```
