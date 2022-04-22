+++

title = "openGauss每日一练之导入数据" 

date = "2022-04-22" 

tags = ["openGauss每日一练之导入数据"] 

archives = "2022-04" 

author = "云和恩墨" 

summary = "openGauss每日一练之导入数据"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# openGauss每日一练之导入数据

本文出处：[https://www.modb.pro/db/222633](https://www.modb.pro/db/222633)

## 学习地址

[https://www.modb.pro/course/133](https://www.modb.pro/course/133)

## 学习目标

**学习openGauss导入数据**

## 课后作业

### **1.创建表1并在表中插入数据，分别指定字段和整行为缺省值**

```
omm=# create table emp1 (
omm(# id integer,
omm(# name char(10),
omm(# age integer
omm(# );
CREATE TABLE
omm=# insert into emp1 values (1,'zhao',25);
INSERT 0 1
omm=# insert into emp1 values (2,'qian',default);
INSERT 0 1
omm=# insert into emp1 default values ;
INSERT 0 1
omm=# 

```

### **2.创建表2并将表1的数据全部导入表2中**

```
omm=# create table emp2 (
omm(# id integer,
omm(# name char(10),
omm(# age integer
omm(# );
CREATE TABLE
omm=# insert into emp2 select * from emp1;
INSERT 0 3
omm=# 

```

### **3.创建表3和表4，并合并两个表的数据到表3**

```
omm=# create table emp3 (
omm(# id integer,
omm(# name char(10),
omm(# age integer
omm(# );
CREATE TABLE
omm=# create table emp4 (
omm(# id integer,
omm(# name char(10),
omm(# age integer
omm(# );
CREATE TABLE
omm=# insert into emp3 values
omm-# (1,'zhao',25),
omm-# (2,'qian',27),
omm-# (3,'shun',29);
INSERT 0 3
omm=# insert into emp4 values
omm-# (1,'zhao',25),
omm-# (2,'li',26),
omm-# (4,'zhou',28);
INSERT 0 3
omm=# merge into emp3
omm-# using emp4
omm-# on (emp3.id=emp4.id)
omm-# when matched then
omm-# update set emp3.name=emp4.name,emp3.age=emp4.age
omm-# when not matched then
omm-# insert values (emp4.id,emp4.name,emp4.age);
MERGE 3
omm=# select * from emp3;
 id |    name    | age 
----+------------+-----
  3 | shun       |  29
  1 | zhao       |  25
  2 | li         |  26
  4 | zhou       |  28
(4 rows)

omm=# 

```

### **4.将表3的数据输出到文件，再将文件中的数据导入到表5**

```
omm=# copy emp3 to '/home/omm/emp3.dat';
COPY 4
omm=# create table emp5 (like emp3);
CREATE TABLE
omm=# 
omm=# copy emp5 from '/home/omm/emp3.dat';
COPY 4
omm=# select * from emp5;
 id |    name    | age 
----+------------+-----
  3 | shun       |  29
  1 | zhao       |  25
  2 | li         |  26
  4 | zhou       |  28
(4 rows)

omm=# 
```
