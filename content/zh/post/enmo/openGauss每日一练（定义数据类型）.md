+++

title = "openGauss每日一练（定义数据类型）" 

date = "2022-04-21" 

tags = ["openGauss每日一练（定义数据类型）"] 

archives = "2022-04" 

author = "云和恩墨" 

openGauss每日一练（定义数据类型）

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# openGauss每日一练（定义数据类型）

本文出处：[https://www.modb.pro/db/222625](https://www.modb.pro/db/222625)

## 学习地址

[https://www.modb.pro/course/133](https://www.modb.pro/course/133)

## 学习目标

**学习openGauss定义数据类型**

## 课后作业

**1.创建一个复合类型，重命名复合类型，为复合类型增加属性、删除属性**

```sql
--SQL文本
create type comtype as (id integer,name char(10));
alter type comtype rename to comtype_new;
alter type comtype_new add attribute age integer;
alter type comtype_new drop attribute name;

omm=# create type comtype as (id integer,name char(10));
CREATE TYPE
omm=# alter type comtype rename to comtype_new;
ALTER TYPE
omm=# alter type comtype_new add attribute age integer;
ALTER TYPE
omm=# alter type comtype_new drop attribute name;
ALTER TYPE
omm=# 

```

**2.创建一个枚举类型，新增标签值，重命名标签值**

```sql
--SQL文本 create type enumtype as enum ('Monday','Tuesday','Friday'); alter type enumtype add value if not exists 'Wednesday' before 'Friday'; alter type enumtype rename value 'Friday' to 'Thursday'; select * from pg_enum; 
omm=# create type comtype as (id integer,name char(10));
CREATE TYPE
omm=# alter type comtype rename to comtype_new;
ALTER TYPE
omm=# alter type comtype_new add attribute age integer;
ALTER TYPE
omm=# alter type comtype_new drop attribute name;
ALTER TYPE
omm=# create type enumtype as enum ('Monday','Tuesday','Friday');
CREATE TYPE
omm=# alter type enumtype add value if not exists 'Wednesday' before 'Friday';
ALTER TYPE
omm=# alter type enumtype rename value 'Friday' to 'Thursday';
ALTER TYPE
omm=# select * from pg_enum;
 enumtypid | enumsortorder | enumlabel 
-----------+---------------+-----------
     33462 |             1 | Monday
     33462 |             2 | Tuesday
     33462 |           2.5 | Wednesday
     33462 |             3 | Thursday
(4 rows)

omm=# 
```

**3.使用新创建的类型创建表**

```sql
--SQL文本
create table t_enumtype (a integer,b comtype_new,c enumtype);

omm=# create table t_enumtype (a integer,b comtype_new,c enumtype); CREATE TABLE omm=#  
```

**4.删除类型**

```sql
--SQL文本 drop table t_enumtype; drop type comtype_new; drop type enumtype; 
omm=# drop table t_enumtype;
DROP TABLE
omm=# drop type comtype_new;
DROP TYPE
omm=# drop type enumtype;
DROP TYPE
omm=# 
```
