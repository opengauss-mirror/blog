+++

title = "openGauss每日一练第6天" 

date = "2022-04-20" 

tags = ["openGauss每日一练第6天"] 

archives = "2022-04" 

author = "云和恩墨" 

summary = "openGauss每日一练第6天"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# openGauss每日一练第6天

本文出处：[https://www.modb.pro/db/193150](https://www.modb.pro/db/193150)

## 学习地址

[https://www.modb.pro/course/133](https://www.modb.pro/course/133)

## 学习目标

学习openGauss创建模式、修改模式属性和删除模式

模式是一组数据库对象的集合，主要用于控制对数据库对象的访问

## 课后作业

### **1.创建一个名为tpcds的模式**

```sql
SQL文本：
create schema tpcds;
\dn tpcds

omm=# create schema tpcds;
CREATE SCHEMA
omm=# \dn tpcds
List of schemas
 Name  | Owner 
-------+-------
 tpcds | omm
(1 row)

omm-# 
```

### **2.创建一个用户tim, 并将tpcds的owner修改为tim，且修改owner前后分别使用\dn+查看模式信息**

```
SQL文本：
create user tim password 'tim_1234';
\dn+
alter schema tpcds owner to tim;
\dn+

omm=# create user tim password 'tim_1234';
omm=# CREATE ROLE
omm=# \dn+
                              List of schemas
    Name     | Owner | Access privileges |           Description            
-------------+-------+-------------------+----------------------------------
 cstore      | omm   |                   | reserved schema for DELTA tables
 dbe_perf    | omm   |                   | dbe_perf schema
 pkg_service | omm   |                   | pkg_service schema
 public      | omm   | omm=UC/omm       +| standard public schema
             |       | =U/omm            | 
 schema2     | omm   |                   | 
 snapshot    | omm   |                   | snapshot schema
 tim         | tim   |                   | 
 tpcds       | omm   |                   | 
(8 rows)

omm=# alter schema tpcds owner to tim;
ALTER SCHEMA
omm=# \dn+
                              List of schemas
    Name     | Owner | Access privileges |           Description            
-------------+-------+-------------------+----------------------------------
 cstore      | omm   |                   | reserved schema for DELTA tables
 dbe_perf    | omm   |                   | dbe_perf schema
 pkg_service | omm   |                   | pkg_service schema
 public      | omm   | omm=UC/omm       +| standard public schema
             |       | =U/omm            | 
 schema2     | omm   |                   | 
 snapshot    | omm   |                   | snapshot schema
 tim         | tim   |                   | 
 tpcds       | tim   |                   | 
(8 rows)

omm=# 

```

### **3.重命名tpcds为tpcds1**

```sql
SQL文本：
alter schema tpcds rename to tpcds1;
\dn+

omm=# alter schema tpcds rename to tpcds1;
ALTER SCHEMA
omm=# \dn+ 
                              List of schemas
    Name     | Owner | Access privileges |           Description            
-------------+-------+-------------------+----------------------------------
 cstore      | omm   |                   | reserved schema for DELTA tables
 dbe_perf    | omm   |                   | dbe_perf schema
 pkg_service | omm   |                   | pkg_service schema
 public      | omm   | omm=UC/omm       +| standard public schema
             |       | =U/omm            | 
 schema2     | omm   |                   | 
 snapshot    | omm   |                   | snapshot schema
 tim         | tim   |                   | 
 tpcds1      | tim   |                   | 
(8 rows)

omm=# 
```

### **4.在模式tpcds1中建表customer、插入记录和查询记录**

```sql
SQL文本：
建表
create table tpcds1.customer
( c_customer_sk             integer,   
  c_customer_id             char(5),    
  c_first_name              char(6),    
  c_last_name               char(8) 
);

插入记录
INSERT INTO tpcds1.customer (c_customer_sk, c_customer_id, c_first_name,c_last_name) VALUES    
(6885, 1, 'Joes', 'Hunter'),    
(4321, 2, 'Lily','Carter'),    
(9527, 3, 'James', 'Cook'),
(9500, 4, 'Lucy', 'Baker');

查询记录
select * from tpcds1.customer;

omm=# create table tpcds1.customer
omm-# ( c_customer_sk             integer,   
omm(#   c_customer_id             char(5),    
omm(#   c_first_name              char(6),    
omm(#   c_last_name               char(8) 
omm(# );
CREATE TABLE
omm=# INSERT INTO tpcds1.customer (c_customer_sk, c_customer_id, c_first_name,c_last_name) VALUES    
omm-# (6885, 1, 'Joes', 'Hunter'),    
omm-# (4321, 2, 'Lily','Carter'),    
omm-# (9527, 3, 'James', 'Cook'),
omm-# (9500, 4, 'Lucy', 'Baker');
INSERT 0 4
omm=# select * from tpcds1.customer;
 c_customer_sk | c_customer_id | c_first_name | c_last_name 
---------------+---------------+--------------+-------------
          6885 | 1             | Joes         | Hunter  
          4321 | 2             | Lily         | Carter  
          9527 | 3             | James        | Cook    
          9500 | 4             | Lucy         | Baker   
(4 rows)

omm=# \dt customer
                          List of relations
 Schema |   Name   | Type  | Owner |             Storage              
--------+----------+-------+-------+----------------------------------
 tpcds1 | customer | table | omm   | {orientation=row,compression=no}
(1 row)

omm=# 
```

### **5.删除模式tpcds1**

```sql
SQL文本： drop schema tpcds1; drop schema tpcds1 cascade; \dn+ 
omm=# drop schema tpcds1;
ERROR:  cannot drop schema tpcds1 because other objects depend on it
DETAIL:  table customer depends on schema tpcds1
HINT:  Use DROP ... CASCADE to drop the dependent objects too.
omm=# drop schema tpcds1 cascade;
NOTICE:  drop cascades to table customer
DROP SCHEMA
omm=# \dn+
                              List of schemas
    Name     | Owner | Access privileges |           Description            
-------------+-------+-------------------+----------------------------------
 cstore      | omm   |                   | reserved schema for DELTA tables
 dbe_perf    | omm   |                   | dbe_perf schema
 pkg_service | omm   |                   | pkg_service schema
 public      | omm   | omm=UC/omm       +| standard public schema
             |       | =U/omm            | 
 schema2     | omm   |                   | 
 snapshot    | omm   |                   | snapshot schema
 tim         | tim   |                   | 
(7 rows)

omm=# 
```
