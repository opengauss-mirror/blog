+++

title = "openGauss每日一练（定义游标）" 

date = "2022-04-25" 

tags = ["openGauss每日一练（定义游标）"] 

archives = "2022-04" 

author = "云和恩墨" 

summary ="openGauss每日一练（定义游标）"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# openGauss每日一练（定义游标）

本文出处：[https://www.modb.pro/db/224157](https://www.modb.pro/db/224157)

## 学习地址

[https://www.modb.pro/course/133](https://www.modb.pro/course/133)

## 学习目标

**学习openGauss定义游标**

为了处理SQL语句，存储过程进程分配一段内存区域来保存上下文联系，游标是指向上下文区域的句柄或指针。借助游标，存储过程可以控制上下文区域的变化。

## 课后作业

### **1.创建游标，且使用select子句指定游标返回的行，分别使用FETCH抓取数据，MOVE重定位游标**

```
omm=# create table t1(id integer,name varchar(20));
CREATE TABLE
omm=# insert into t1 values
omm-# (1,'zhao'),(2,'qian'),(3,'sun'),(4,'li');
INSERT 0 4
omm=# begin;
BEGIN
omm=# cursor cursor1 for select  * from t1 order by id;
DECLARE CURSOR
omm=# fetch forward 1 from cursor1;
 id | name 
----+------
  1 | zhao
(1 row)

omm=# move forward 2 from cursor1;
MOVE 2
omm=# fetch forward 1 from cursor1;
 id | name 
----+------
  4 | li
(1 row)
omm=# 
```

### **2.在系统视图pg_cursors中查看游标**

```
omm=# select * from pg_cursors;
  name   |                     statement                     | is_holdable | is_binary | is_scrollable |         creation_time         
---------+---------------------------------------------------+-------------+-----------+---------------+-------------------------------
 cursor1 | cursor cursor1 for select  * from t1 order by id; | f           | f         | t             | 2021-12-27 15:39:12.614502+08
(1 row)

omm=# close cursor1;
CLOSE CURSOR
omm=# end;
COMMIT
omm=# select * from pg_cursors;
 name | statement | is_holdable | is_binary | is_scrollable | creation_time 
------+-----------+-------------+-----------+---------------+---------------
(0 rows)

omm=# 
```

### **3.创建一个使用游标的存储过程**

```
omm=# create table company(name varchar(100), loc varchar(100), no integer);
CREATE TABLE
omm=# insert into company values ('macrosoft',    'usa',          001);
INSERT 0 1
omm=# insert into company values ('oracle',       'usa',          002);
INSERT 0 1
omm=# insert into company values ('backberry',    'canada',       003);
INSERT 0 1
omm=# create or replace procedure test_cursor_1
omm-# as
omm$#     company_name    varchar(100);
omm$#     company_loc varchar(100);
omm$#     company_no  integer;
omm$# 
omm$#     cursor c1_all is --cursor without args
omm$#         select name, loc, no from company order by 1, 2, 3;
omm$# begin
omm$#     if not c1_all%isopen then
omm$#         open c1_all;
omm$#     end if;
omm$#     loop
omm$#         fetch c1_all into company_name, company_loc, company_no;
omm$# RAISE INFO 'company_name: %' ,company_name;
omm$#         exit when c1_all%notfound;
omm$#     end loop;
omm$#     if c1_all%isopen then
omm$#         close c1_all;
omm$#     end if;
omm$# end;
omm$# /
CREATE PROCEDURE
omm=# call test_cursor_1();
INFO:  company_name: backberry
INFO:  company_name: macrosoft
INFO:  company_name: oracle
INFO:  company_name: oracle
 test_cursor_1 
---------------
 
(1 row)

omm=# 
```

### **4.清理数据**

```
omm=# drop table company;
DROP TABLE
omm=# 
```
