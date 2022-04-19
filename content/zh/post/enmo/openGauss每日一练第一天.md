+++

title = "openGauss每日一练第一天" 

date = "2022-04-19" 

tags = ["openGauss每日一练第一天"] 

archives = "2022-04" 

author = "云和恩墨" 

summary = "openGauss每日一练第一天"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# openGauss每日一练第一天

本文出处：[https://www.modb.pro/db/192962](https://www.modb.pro/db/192962)

<br/>

## 学习地址

[https://www.modb.pro/course/133](https://www.modb.pro/course/133)

## 学习目标

 学习openGauss数据库创建表、插入记录、查询记录和删除表基本使用。

## 课后作业

### 1.创建一个表products

| 字段名       | 数据类型 | 含义     |
| ------------ | -------- | -------- |
| product_id   | INTEGER  | 产品编号 |
| product_name | Char(30) | 产品名   |
| category     | Char(20) | 种类     |

```
SQL文本：
create table products
(product_id integer,
 product_name char(30),
 category char(20)
);
```

### 2.向表中插入数据，采用一次插入一条和多条记录的方式

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

### 3.查询表中所有记录及记录数

```
SQL文本：
查询表中所有记录：
select * from products;

查询表中记录数：
select count(*) from products;

查询表中所有记录：
omm=# select * from products;
 product_id |          product_name          |       category       
------------+--------------------------------+----------------------
       1502 | olympus camera                 | electrncs           
       1601 | lamaze                         | toys                
       1700 | wait interface                 | Books               
       1666 | harry potter                   | toys                
(4 rows)
omm=# 

查询表中记录数：
omm=# select count(*) from products;
 count 
-------
     4
(1 row)

omm=# 
```

### 4.查询表中所有category记录，并将查询结果按升序排序

```
SQL文本：
select category from products order by category; --利用order by进行升序排序

omm=# select category from products order by category;
       category       
----------------------
 Books               
 electrncs           
 toys                
 toys                
(4 rows)

omm=# 
```

### 5.查询表中category为toys的记录

```
SQL文本：
select category from products order by category; --利用order by进行升序排序

omm=# select category from products order by category;
       category       
----------------------
 Books               
 electrncs           
 toys                
 toys                
(4 rows)

omm=# 
```

### 6.删除表products

```
SQL文本：
drop table products;

omm=# drop table products;
DROP TABLE
omm=# 
```
