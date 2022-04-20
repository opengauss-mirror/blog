+++

title = "openGauss每日一练第二天" 

date = "2022-04-19" 

tags = ["openGauss每日一练第二天"] 

archives = "2022-04" 

author = "云和恩墨" 

summary = "openGauss每日一练第二天"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# openGauss每日一练第二天

本文出处：[https://www.modb.pro/db/193083](https://www.modb.pro/db/193083)

<br/>

## 学习地址

[https://www.modb.pro/course/133](https://www.modb.pro/course/133)

## 学习目标

学习openGauss数据库查询、更新和删除基本使用。

## 课后作业

#### 1.创建一个表products

| 字段名       | 数据类型 | 含义     |
| ------------ | -------- | -------- |
| product_id   | INTEGER  | 产品编号 |
| product_name | Char(20) | 产品名   |
| category     | Char(30) | 种类     |

```
SQL文本：
create table products
(product_id integer,
 product_name char(30),
 category char(20)
);

omm=# create table products
omm-# (product_id integer,
omm(#  product_name char(30),
omm(#  category char(20)
omm(# );
CREATE TABLE
omm=# 
omm=# \dt+ products
                                       List of relations
 Schema  |   Name   | Type  | Owner |  Size   |             Storage              | Description 
---------+----------+-------+-------+---------+----------------------------------+-------------
 schema2 | products | table | omm   | 0 bytes | {orientation=row,compression=no} | 
(1 row)

omm=# 
omm=# \d+ products
                             Table "schema2.products"
    Column    |     Type      | Modifiers | Storage  | Stats target | Description 
--------------+---------------+-----------+----------+--------------+-------------
 product_id   | integer       |           | plain    |              | 
 product_name | character(30) |           | extended |              | 
 category     | character(20) |           | extended |              | 
Has OIDs: no
Options: orientation=row, compression=no

omm=# 

```

#### 2.向表中插入数据，采用一次插入一条和多条记录的方式

| product_id | product_name   | category  |
| ---------- | -------------- | --------- |
| 1502       | olympus camera | electrncs |
| 1601       | lamaze         | toys      |
| 1700       | wait interface | Books     |
| 1666       | harry potter   | toys      |

```
SQL文本：
insert into products(product_id,product_name,category) values (1502,'olympus camera','electrncs');
insert into products values (1601,'lamaze','toys');
insert into products(product_id,product_name,category) values 
(1700,'wait interface','Books'),
(1666,'harry potter','toys');

omm=# insert into products(product_id,product_name,category) values (1502,'olympus camera','electrncs');
INSERT 0 1
omm=# insert into products values (1601,'lamaze','toys');
INSERT 0 1
omm=# insert into products(product_id,product_name,category) values 
omm-# (1700,'wait interface','Books'),
omm-# (1666,'harry potter','toys');
INSERT 0 2
omm=# 

```

#### 3.获取表中一条记录、三条记录和所有记录

```
SQL文本：
select * from products limit 1;
select * from products limit 3;
select * from products;

omm=# select * from products limit 1;
 product_id |          product_name          |       category       
------------+--------------------------------+----------------------
       1502 | olympus camera                 | electrncs           
(1 row)

omm=# select * from products limit 3;
 product_id |          product_name          |       category       
------------+--------------------------------+----------------------
       1502 | olympus camera                 | electrncs           
       1601 | lamaze                         | toys                
       1700 | wait interface                 | Books               
(3 rows)

omm=# select * from products; 
 product_id |          product_name          |       category       
------------+--------------------------------+----------------------
       1502 | olympus camera                 | electrncs           
       1601 | lamaze                         | toys                
       1700 | wait interface                 | Books               
       1666 | harry potter                   | toys                
(4 rows)

omm=# 

```

#### 4.将满足product_id > 1600的记录的product_id更新为product_id – 1000，并查看products中所有记录是否更新成功

```
SQL文本：
update products set product_id = product_id - 1000 where product_id > 1600;

omm=# update products set product_id = product_id - 1000 where product_id > 1600;
UPDATE 3
omm=# select * from products;
 product_id |          product_name          |       category       
------------+--------------------------------+----------------------
       1502 | olympus camera                 | electrncs           
        601 | lamaze                         | toys                
        700 | wait interface                 | Books               
        666 | harry potter                   | toys                
(4 rows)

omm=# 

```

#### 5.删除category为toys的所有记录，并查看products中数据是否删除成功

```
SQL文本：
delete from products where category = 'toys';

omm=# delete from products where category = 'toys';
DELETE 2
omm=# select * from products;
 product_id |          product_name          |       category       
------------+--------------------------------+----------------------
       1502 | olympus camera                 | electrncs           
        700 | wait interface                 | Books               
(2 rows)

omm=# 
```

#### 6.删除products中所有数据，并查看数据是否删除成功

```
SQL文本：
delete from products;

omm=# delete from products;
DELETE 2
omm=# select * from products;
 product_id | product_name | category 
------------+--------------+----------
(0 rows)

omm=# 
```

#### 7.删除表products

```
SQL文本：
drop table products;

omm=# drop table products;
DROP TABLE
omm=# 
```
