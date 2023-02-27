---
title: 'openGauss每日一练（普通表索引）'

date: '2022-04-21'

category: 'blog'
tags: ['openGauss每日一练（普通表索引）']

archives: '2022-04'

author: '云和恩墨'

summary: 'openGauss每日一练（普通表索引）'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# openGauss 每日一练（普通表索引）

本文出处：[https://www.modb.pro/db/218262](https://www.modb.pro/db/218262)

## 学习地址

[https://www.modb.pro/course/133](https://www.modb.pro/course/133)

## 学习目标

**学习 openGauss 普通表索引**

索引是对数据库表中一列或多列的值进行排序的一种结构，使用索引可快速访问数据库表中的特定信息

## 课后作业

### **1.创建表 products, 分别为表创建一个 unique 索引 1，指定 b-tree 索引 2 和表达式索引 3**

```
--SQL文本：
create table products
(product_id integer,
 product_name char(30),
 category char(20)
);
create unique index idx_products_id on products(product_id);
create index idx_products_name on products using btree(product_name);
create index idx_products_category on products(category)where category='toys';

omm=# create table products
omm-# (product_id integer,
omm(#  product_name char(30),
omm(#  category char(20)
omm(# );
CREATE TABLE
omm=# create unique index idx_products_id on products(product_id);
CREATE INDEX
omm=# create index idx_products_name on products using btree(product_name);
CREATE INDEX
omm=# create index idx_products_category on products(category)where category='toys';
CREATE INDEX
omm=#

```

### **2.设置索引 1 不可用，修改索引 2 的表空间，重命名索引 3**

```
--SQL文本：
alter index idx_products_id unusable;
create tablespace tspc1 relative location 'tbs/tspc1';
alter index idx_products_name set tablespace tspc1;
alter index idx_products_category rename to idx_products_category_new;

omm=# alter index idx_products_id unusable;
ALTER INDEX
omm=# create tablespace tspc1 relative location 'tbs/tspc1';
CREATE TABLESPACE
omm=# alter index idx_products_name set tablespace tspc1;
ALTER INDEX
omm=# alter index idx_products_category rename to idx_products_category_new;
ALTER INDEX
omm=#

```

### **3.重建索引 2 和 products 的所有索引**

```
--SQL文本：
alter index idx_products_name rebuild;
reindex index idx_products_name;
reindex table products;

omm=# alter index idx_products_name rebuild;
REINDEX
omm=# reindex index idx_products_name;
REINDEX
omm=# reindex table products;
REINDEX
omm=#

```

### **4.使用\d+和系统视图 pg_indexes 查看索引信息**

```
--SQL文本：
\d+
select * from pg_indexes where tablename='products';

omm=# \d+
                                      List of relations
 Schema |   Name   | Type  | Owner |  Size   |             Storage              | Description
--------+----------+-------+-------+---------+----------------------------------+-------------
 public | products | table | omm   | 0 bytes | {orientation=row,compression=no} |
(1 rows)

omm=# select * from pg_indexes where tablename='products';
 schemaname | tablename |         indexname         | tablespace |                                                             indexdef
------------+-----------+---------------------------+------------+-----------------------------------------------------------------------------------------------------------------------------------
 public     | products  | idx_products_id           |            | CREATE UNIQUE INDEX idx_products_id ON products USING btree (product_id) TABLESPACE pg_default
 public     | products  | idx_products_name         | tspc1      | CREATE INDEX idx_products_name ON products USING btree (product_name) TABLESPACE tspc1
 public     | products  | idx_products_category_new |            | CREATE INDEX idx_products_category_new ON products USING btree (category) TABLESPACE pg_default WHERE (category = 'toys'::bpchar)
(3 rows)

omm=#

```

### **5.删除索引、表和表空间**

```
--SQL文本：
drop index idx_products_id;
drop index idx_products_name;
drop index idx_products_category_new;
drop table products;
drop tablespace tspc1;

omm=# drop index idx_products_id;
DROP INDEX
omm=# drop index idx_products_name;
DROP INDEX
omm=# drop index idx_products_category_new;
DROP INDEX
omm=# drop table products;
DROP TABLE
omm=# drop tablespace tspc1;
DROP TABLESPACE
omm=#

```
