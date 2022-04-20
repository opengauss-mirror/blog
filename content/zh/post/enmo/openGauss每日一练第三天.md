+++

title = "openGauss每日一练第三天" 

date = "2022-04-19" 

tags = ["openGauss每日一练第三天"] 

archives = "2022-04" 

author = "云和恩墨" 

summary = "openGauss每日一练第三天"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# openGauss每日一练第三天

本文出处：[https://www.modb.pro/db/193083](https://www.modb.pro/db/193083)

<br/>

## 学习目标

学习openGauss创建数据库、修改数据库属性和删除数据库

## 课后作业

### **1.分别创建名为tpcc1和tpcc2的数据库**

```
SQL文本：
create database tpcc1;
create database tpcc2;
\l

omm=# create database tpcc1;
CREATE DATABASE
omm=# create database tpcc2;
CREATE DATABASE
omm=# omm=# \l
                              List of databases
   Name    | Owner | Encoding |   Collate   |    Ctype    | Access privileges 
-----------+-------+----------+-------------+-------------+-------------------
 omm       | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | 
 postgres  | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | 
 template0 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +
           |       |          |             |             | omm=CTc/omm
 template1 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +
           |       |          |             |             | omm=CTc/omm
 tpcc1     | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | 
 tpcc2     | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | 
(6 rows)

omm=# 
```

### **2.将tpcc1数据库重命名为tpcc10**

```
SQL文本：
alter database tpcc1 rename to tpcc10;

omm=# alter database tpcc1 rename to tpcc10;
ALTER DATABASE
omm=# 
```

### **3.分别使用\l和\l+两个元命令查看数据库信息**

```
SQL文本：
\l
\l+

omm=# \l
                              List of databases
   Name    | Owner | Encoding |   Collate   |    Ctype    | Access privileges 
-----------+-------+----------+-------------+-------------+-------------------
 omm       | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | 
 postgres  | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | 
 template0 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +
           |       |          |             |             | omm=CTc/omm
 template1 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +
           |       |          |             |             | omm=CTc/omm
 tpcc10    | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | 
 tpcc2     | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | 
(6 rows)

omm=# \l+
                                                               List of databases
   Name    | Owner | Encoding |   Collate   |    Ctype    | Access privileges | Size  | Tablespace |                Description                 
-----------+-------+----------+-------------+-------------+-------------------+-------+------------+--------------------------------------------
 omm       | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 |                   | 11 MB | pg_default | 
 postgres  | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 |                   | 41 MB | pg_default | default administrative connection database
 template0 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +| 10 MB | pg_default | default template for new databases
           |       |          |             |             | omm=CTc/omm       |       |            | 
 template1 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +| 10 MB | pg_default | unmodifiable empty database
           |       |          |             |             | omm=CTc/omm       |       |            | 
 tpcc10    | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 |                   | 10 MB | pg_default | 
 tpcc2     | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 |                   | 10 MB | pg_default | 
(6 rows)

omm=# 
```

### **4.在数据库tpcc2中创建customer表，字段自定义**

```
SQL文本：
\c tpcc2
create table customer_t
(c_customer_sk             integer,   
 c_customer_id             char(5),    
 c_first_name              char(6),    
 c_last_name               char(8) 
 ) ;
 \d

tpcc2=# \c tpcc2
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "tpcc2" as user "omm".
tpcc2=# create table customer_t
tpcc2-# (c_customer_sk             integer,   
tpcc2(#  c_customer_id             char(5),    
tpcc2(#  c_first_name              char(6),    
tpcc2(#  c_last_name               char(8) 
tpcc2(#  ) ;
CREATE TABLE
tpcc2=# \d
                            List of relations
 Schema  |    Name    | Type  | Owner |             Storage              
---------+------------+-------+-------+----------------------------------
 schema2 | customer_t | table | omm   | {orientation=row,compression=no}
(1 row)

tpcc2=# 
```

### **5.删除新创建的数据库**

```
SQL文本：
\c omm
drop database tpcc2;
drop database tpcc10;

tpcc2=# \c omm
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "omm" as user "omm".
omm=# drop database tpcc2;
DROP DATABASE
omm=# drop database tpcc10;
DROP DATABASE
omm=# 
```

### **6.退出gsql程序**

```
SQL文本：
\q 

omm=# \q
[omm@modb ~]$ 
```
