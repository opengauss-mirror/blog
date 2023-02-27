---
title: 'openGauss之数据库对象简单管理'

date: '2022-05-12'

category: 'blog'
tags: ['openGauss之数据库对象简单管理']

archives: '2022-05'

author: '云和恩墨'

summary: 'openGauss之数据库对象简单管理'

img: '/zh/blogs/enmo/title/img6.png'

times: '10:20'
---

# openGauss 之数据库对象简单管理

本文出处：[https://www.modb.pro/db/401060](https://www.modb.pro/db/401060)

### 1.数据库管理

#### （1）创建数据库

基本语法：create database database_name 选项;

```
//简单创建一个库，默认会通过复制标准系统数据库template0来创建
create database dbtest;
//创建自定义数据库
create database dbtest1 encoding 'utf-8' template template0 owner test;
选项说明：
encoding		指定数据库的编码格式
template		指定从哪个标准数据库复制
owner			指定数据库的拥有者
```

#### （2）查看数据库

```
//简单创建一个库，默认会通过复制标准系统数据库template0来创建
create database dbtest;
//创建自定义数据库
create database dbtest1 encoding 'utf-8' template template0 owner test;
选项说明：
encoding		指定数据库的编码格式
template		指定从哪个标准数据库复制
owner			指定数据库的拥有者
```

#### （3）修改数据库

```
//修改数据库名字
alter database dbtest rename to dbtest2;
//修改数据库的所有者
alter database dbtest2 owner to test1;
//修改数据库的连接数限制
alter database dbtest1 connection limit 10;
```

#### （4）删除数据库

```
drop database dbtest1;
drop database dbtest2;
```

更多信息详见官网：[https://docs.mogdb.io/zh/mogdb/v2.1/overview](https://docs.mogdb.io/zh/mogdb/v2.1/overview)

### 2.表管理

#### （1）创建表

基本语法：create table 表名（字段名 字段类型 字段约束，…）

```
//默认创建的是行存表，如果不指定模式，会在search_path中的第一个模式下创建
create table student(id int, name varchar(20));

//通过like子句快速创建表，并指定模式
create table test.student1 (like student);

//gsql客户端查看表结构
\d+ student

//查看表的定义
select pg_get_tabledef('student2');

//查看表信息
select * from pg_tables where tablename='student2';
```

#### （2）修改表

```
//修改表名
alter table student rename to student2;
//增加字段
alter table student2 add age int;
//修改字段类型
alter table student2 alter column name type varchar(10);
alter table student2 modify (name varchar(15));
//删除字段
alter table student2 drop column age;
```

#### （3）向表中插入数据

```
//插入一条记录
insert into student2 values (1,'张三');
//向表中插入多条记录
insert into student2 values (2,'李四'),(3,'王五');
//通过select子句向表中插入数据
insert into student1 select * from student2;
```

#### （4）删除表中的数据

```
//删除满足指定条件的记录
delete from student1 where name = '张三';

//删除表中所有数据
delete from student1;
或
truncate table student2;(推荐使用，对于大表速度明显快)

delete和truncate区别：
delete:会进行表扫描，每删除一行，就会在事务日志中添加一条记录，删除内容，不删除定义，不释放空间，所以当表执行了大量的delete操作之后，记得执行vacuum进行垃圾回收(vacuum 表名)。
Truncate：不会进行表扫描，删除内容，释放空间，不删除定义。
```

#### （5）修改表中的数据

```
//将name为张三的记录的name字段改为张三1
update student2 set name = '张三1' where name = '张三';
```

#### （6）删除表

```
drop table student1;
```

### 3.索引管理

#### （1）创建索引

```
//创建普通索引
create index stu_idx1 on student2(id);

//创建唯一索引
create unique index stu_unq_indx1 on student2(name);

//查看索引信息
select * from pg_indexes where indexname='stu_idx1';
```

#### （2）修改索引

```
//重命名索引
alter index stu_unq_indx1 rename to stu_unq;
//设置索引不可用
alter index stu_unq unusable;
//重建索引
alter index stu_unq rebuild;
```

#### （3）删除索引

```
drop index stu_unq;
```

### 4.视图管理

#### （1）创建视图

```
//创建student2表中id小于2的视图
create view stu_view as select * from student2 where id <= 2;
```

#### （2）查看视图

```
select * from stu_view;
//通过系统表pg_views查看视图
select * from pg_views where viewname='stu_view';
```

#### （3）删除视图

```
drop view stu_view;
```

### 5.存储过程管理

#### （1）创建存储过程

```
//创建一个指定id然后返回年龄的存储过程（在gsql中执行）
alter table student2 add age int default 18;
insert into student2 values(4,'小明',20);
reate or replace procedure get_age(i in out int)
as
begin
select age into i from student2 where id = i;
end;
/

//通过navicat查看刚刚创建的存储过程，定义如下：
CREATE OR REPLACE FUNCTION "test"."get_age"(INOUT "i" int4)
  RETURNS "pg_catalog"."int4" AS $BODY$ DECLARE
begin
select age into i from student2 where id = i;
end $BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100
//可以发现存储过程和函数是一样的

//查看存储过程信息
select * from pg_proc where proname='get_age';
```

#### （2）调用存储过程

```
call get_age(4);
select * from get_age(4);
```

#### （3）删除存储过程

```
drop procedure get_age;
```

### 6.用户管理

#### （1）创建用户

```
//简单创建一个用户
create user u1 password 'u1@12345';
//创建具有管理员权限的用户
create user u2 sysadmin identified by 'u2@12345';

//创建用户u3，要求u3用户第一次登录就要改密码
create user u3 password 'u3@12345' expired;

//通过系统视图查看用户信息
select * from pg_user where usename='test';
```

#### （2）修改用户

```
//修改u1用户的密码为‘u1@23456’
alter user u1 identified by 'u1@23456' replace 'u1@12345';
//为u1用户追加createrole权限
alter user u1 createrole;
//锁定u1用户
alter user u1 account lock;
//解锁u1用户
alter user u2 account unlock;
```

#### （3）删除用户

```
drop user u1;
drop user u2;
drop user u3;
```

### 7.表空间管理

#### （1）创建表空间

```
//创建一个表空间，通过relative关键字，会相对于数据库节点数据目录下的pg_location目录创建响应的目录
create tablespace test_nsp relative location 'test';

//创建表空间并指定所有者
create tablespace test_nsp1 location '/mogdb/data/pg_test';

//查看表空间信息
select * from pg_tablespace a,pg_user b where a.spcowner = b.usesysid and a.spcname = 'test_nsp';
```

#### （2）修改表空间

```
//修改表空间的所有者
alter tablespace test_nsp owner to test1;

//修改表空间名字
alter tablespace test_nsp rename to test_nsp_new;
```

#### （3）删除表空间

```
drop tablespace test_nsp1;
drop tablespace test_nsp_new;
```

### 8.权限管理

#### （1）授权

```
//创建一个测试用户
create user jack password 'jack@123';
//将对表的insert、select权限授予用户jack之前，需要将表student2所在模式的usage权限授予test
grant usage on schema test to jack;
grant insert,select on table test.student2 to jack;

//将对表student2的age字段update权限授予jack用户
grant update(age) on table test.student2 to jack;

//将系统权限授予jack用户
openGauss=> grant all privileges to jack;
ALTER ROLE
//发现授权之后的结果是alter role，说明对于系统权限的授予我们可以使用alter //user进行。
//系统权限有：SYSADMIN、CREATEDB、CREATEROLE、AUDITADMIN、MONADMIN、OPRADMIN、POLADMIN和LOGIN。

//将createrole权限授予jack用户
alter user jack createrole;
```

#### （2）查看权限

```
//1.查看某用户的系统权限
select * from pg_roles where rolname = 'jack';
//2.查看某用户的表权限
select * from information_schema.table_privileges where grantee = 'jack';
//3.查看某用户的usage权限
select * from information_schema.usage_privileges where grantee = 'jack';
//4.查看某个用户在表的列上的权限
select * from information_schema.column_privileges where grantee = 'jack';
```

#### （3）撤销权限

```
//撤销上述授予的权限
revoke select,insert on table test.student2 from jack;
revoke update(age) on table test.student2 from jack;
revoke all privileges from jack;
revoke usage on schema test from jack;
```

### 9.模式管理

#### （1）创建模式

```
//简单的创建一个模式
create schema test_sch1;
//新建一个角色，然后创建一个与该角色同名的模式，并在该模式下创建一张表
create role test2 identified by 'test@123';
create schema authorization test2 create table student3(id int,name varchar(15));

//通过information_schema模式下的视图schemata查看模式
select * from information_schema.schemata where schema_name='test_sch1';
```

#### （2）修改模式

```
//修改模式名 alter schema test_sch1 rename to test_sch2; //修改模式的所有者 alter schema test2 owner to test;
```

### （3）删除模式

```
drop schema test_sch2;
//当模式下有对象时，需要使用cascade进行删除
drop schema test2 cascade;
```
