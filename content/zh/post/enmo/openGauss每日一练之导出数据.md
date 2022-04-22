+++

title = "openGauss每日一练之导出数据" 

date = "2022-04-22" 

tags = ["openGauss每日一练之导出数据"] 

archives = "2022-04" 

author = "云和恩墨" 

summary = "openGauss每日一练之导出数据"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# openGauss每日一练之导出数据

本文出处：[https://www.modb.pro/db/222633](https://www.modb.pro/db/222633)

## 学习地址

[https://www.modb.pro/course/133](https://www.modb.pro/course/133)

## 学习目标

**学习openGauss导出数据**

## 课后作业

### **1.创建数据库tpcc，在数据库tpcc中创建模式schema1，在模式schema1中建表products**

```sql
omm=# create database tpcc;
CREATE DATABASE
omm=# \c tpcc
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "tpcc" as user "omm".
tpcc=# create schema schema1;
CREATE SCHEMA
tpcc=# create table products
tpcc-# (id integer,
tpcc(# name char(10),
tpcc(# age integer
tpcc(# );
CREATE TABLE
tpcc=# insert into products values
tpcc-# (1,'zhang',25),
tpcc-# (2,'qian',27),
tpcc-# (3,'shun',29),
tpcc-# (4,'li',30);
INSERT 0 4
tpcc=#

```

### **2.使用gs_dump工具以文本格式导出数据库tpcc的全量数据**

```sql
[omm@mogdb ~]$ gs_dump -f '/home/omm/tpcc_all.sql' -F p tpcc
gs_dump[port='26000'][tpcc][2021-12-24 20:31:39]: The total objects number is 389.
gs_dump[port='26000'][tpcc][2021-12-24 20:31:39]: [100.00%] 389 objects have been dumped.
gs_dump[port='26000'][tpcc][2021-12-24 20:31:39]: dump database tpcc successfully
gs_dump[port='26000'][tpcc][2021-12-24 20:31:39]: total time: 170  ms
[omm@mogdb ~]$ 

```

### **3.使用gs_dump工具以文本格式导出模式schema1的定义**

```sql
[omm@mogdb ~]$ gs_dump -f '/home/omm/schema1_define.sql' -F p -n schema1 -s
gs_dump[port='26000'][omm][2021-12-24 20:34:30]: The total objects number is 378.
gs_dump[port='26000'][omm][2021-12-24 20:34:30]: [100.00%] 378 objects have been dumped.
gs_dump[port='26000'][omm][2021-12-24 20:34:30]: dump database omm successfully
gs_dump[port='26000'][omm][2021-12-24 20:34:30]: total time: 137  ms
[omm@mogdb ~]$ 

```

### **4.使用gs_dump工具以文本格式导出数据库tpcc的数据，不包含定义**

```sql
[omm@mogdb ~]$ gs_dump -f '/home/omm/tpcc_data.sql' -F p tpcc -a
gs_dump[port='26000'][tpcc][2021-12-24 20:35:33]: dump database tpcc successfully
gs_dump[port='26000'][tpcc][2021-12-24 20:35:33]: total time: 115  ms
[omm@mogdb ~]$ 

```

### **5.删除表、模式和数据库**

```sql
tpcc=# drop table products;
DROP TABLE
tpcc=# drop schema schema1;
DROP SCHEMA
tpcc=# \c omm
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "omm" as user "omm".
omm=# drop database tpcc;
DROP DATABASE
omm=# 

```
