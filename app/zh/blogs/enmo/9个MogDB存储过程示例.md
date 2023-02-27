---
title: '9个MogDB存储过程示例'

date: '2022-05-12'

category: 'blog'
tags: ['9个MogDB存储过程示例']

archives: '2022-05'

author: '云和恩墨交付团队'

summary: '9个MogDB存储过程示例'

img: '/zh/blogs/enmo/title/img6.png'

times: '10:20'
---

# 9 个 MogDB 存储过程示例

本文出处：[https://www.modb.pro/db/400634](https://www.modb.pro/db/400634)

存储过程是一组结构化的查询和语句，例如控制语句和声明。这里介绍 9 个在不同情况下很有用的存储过程示例。

创建测试表：

```
create table public.test1(id int,name varchar(10));
```

## 1. 使用存储过程插入数据

```
CREATE OR REPLACE PROCEDURE genre_insert_data(GenreId integer, Name character varying)
AS
begin
 INSERT INTO public.test1 VALUES (GenreId, Name);
end;
```

测试：

```
openGauss=# CREATE OR REPLACE PROCEDURE genre_insert_data(GenreId integer, Name character varying)
openGauss-# AS
openGauss$# begin
openGauss$#  INSERT INTO public.test1 VALUES (GenreId, Name);
openGauss$# end;
openGauss$# /
CREATE PROCEDURE
openGauss=# call genre_insert_data(1,'aaa');
 genre_insert_data
-------------------

(1 row)

openGauss=# select * from test1;
 id | name
----+------
  1 | aaa
(1 row)
```

## 2. 在屏幕上显示消息

```
 CREATE OR REPLACE PROCEDURE display_message (INOUT msg TEXT) AS  BEGIN RAISE NOTICE 'Procedure Parameter: %', msg ; END ;
```

测试：

```
openGauss=# CREATE OR REPLACE PROCEDURE genre_insert_data(GenreId integer, Name character varying)
openGauss-# AS
openGauss$# begin
openGauss$#  INSERT INTO public.test1 VALUES (GenreId, Name);
openGauss$# end;
openGauss$# /
CREATE PROCEDURE
openGauss=# call genre_insert_data(1,'aaa');
 genre_insert_data
-------------------

(1 row)

openGauss=# select * from test1;
 id | name
----+------
  1 | aaa
(1 row)
```

## 3.使用事务控制

```
 CREATE OR REPLACE PROCEDURE control_transaction()
  AS
 DECLARE
 BEGIN
   CREATE TABLE test2 (id int);
   INSERT INTO test2 VALUES (1);
   COMMIT;
   CREATE TABLE test3 (id int);
   INSERT INTO test2 VALUES (1);
   ROLLBACK;
 END;
```

测试：

```
openGauss=# CREATE OR REPLACE PROCEDURE control_transaction()
openGauss-#   AS
openGauss$#  DECLARE
openGauss$#  BEGIN
openGauss$#    CREATE TABLE test2 (id int);
openGauss$#    INSERT INTO test2 VALUES (1);
openGauss$#    COMMIT;
openGauss$#    CREATE TABLE test3 (id int);
openGauss$#    INSERT INTO test2 VALUES (1);
openGauss$#    ROLLBACK;
openGauss$#  END;
openGauss$# /
CREATE PROCEDURE
openGauss=# select * from test2;
ERROR:  relation "test2" does not exist on dn_6001
LINE 1: select * from test2;
                      ^
openGauss=# call control_transaction();
 control_transaction
---------------------

(1 row)
openGauss=# select * from test2;
 id
----
  1
(1 row)
openGauss=# select * from test3;
ERROR:  relation "test3" does not exist on dn_6001
LINE 1: select * from test3;
                      ^
```

在这里我们可以看到提交之前的数据是可用的，但是没有提交和回滚的数据会从数据库中删除。

## 4.使用列数据类型

```
 CREATE OR REPLACE PROCEDURE genre_id_max() AS
 DECLARE
 Genreid test1.Id%type;
 BEGIN
 select max(Id) into Genreid from public.test1;
 RAISE NOTICE 'Maximum of GenreId is : %', Genreid ;
 END;
```

测试：

```
openGauss=# CREATE OR REPLACE PROCEDURE genre_id_max() AS
openGauss$#  DECLARE
openGauss$#  Genreid test1.Id%type;
openGauss$#  BEGIN
openGauss$#  select max(Id) into Genreid from public.test1;
openGauss$#  RAISE NOTICE 'Maximum of GenreId is : %', Genreid ;
openGauss$#  END;
openGauss$# /
CREATE PROCEDURE
openGauss=# call genre_id_max();
NOTICE:  Maximum of GenreId is : 1
 genre_id_max
--------------

(1 row)
```

## 5. 发出 NOTICE、WARING 和 INFO 消息

```
 CREATE OR REPLACE PROCEDURE raise_warning() AS
 DECLARE
 warn INT := 10;
 BEGIN
 RAISE NOTICE 'value of warn : % at %: ', warn, now();
 warn := warn + 10;
 RAISE WARNING 'value of warn : % at %: ', warn, now();
 warn := warn + 10;
 RAISE INFO 'value of warn : % at %: ', warn, now();
 END;
```

测试：

```
openGauss=#  CREATE OR REPLACE PROCEDURE raise_warning() AS
openGauss$#  DECLARE
openGauss$#  warn INT := 10;
openGauss$#  BEGIN
openGauss$#  RAISE NOTICE 'value of warn : % at %: ', warn, now();
openGauss$#  warn := warn + 10;
openGauss$#  RAISE WARNING 'value of warn : % at %: ', warn, now();
openGauss$#  warn := warn + 10;
openGauss$#  RAISE INFO 'value of warn : % at %: ', warn, now();
openGauss$#  END;
openGauss$# /
CREATE PROCEDURE
openGauss=# call raise_warning();
NOTICE:  value of warn : 10 at 2022-05-07 14:35:24.810364+08:
WARNING:  value of warn : 20 at 2022-05-07 14:35:24.810364+08:
INFO:  value of warn : 30 at 2022-05-07 14:35:24.810364+08:
 raise_warning
---------------

(1 row)
```

## 6. 引发异常

```
 CREATE OR REPLACE PROCEDURE genre_id_exception() AS
 DECLARE
 Genreid test1.Id%type ;
 BEGIN
 select max(Id) into Genreid from public.test1;
 RAISE EXCEPTION 'Maximum of GenreId is : %', Genreid  USING HINT = 'Test For Raising exception.';
 END;
```

测试：

```
openGauss=#  CREATE OR REPLACE PROCEDURE genre_id_exception() AS
openGauss$#  DECLARE
openGauss$#  Genreid test1.Id%type ;
openGauss$#  BEGIN
openGauss$#  select max(Id) into Genreid from public.test1;
openGauss$#  RAISE EXCEPTION 'Maximum of GenreId is : %', Genreid  USING HINT = 'Test For Raising exception.';
openGauss$#  END;
openGauss$# /
CREATE PROCEDURE
openGauss=# call genre_id_exception();
ERROR:  Maximum of GenreId is : 1
```

## 7. 使用 FOR 循环遍历表中的数据

```
 CREATE OR REPLACE PROCEDURE genre_traverse() AS
 DECLARE
 genre_rec record;
 BEGIN
 for genre_rec in (select Id,Name from public.test1 order by 1)
   loop
 RAISE NOTICE 'Id is : % , Name is : %', genre_rec.Id,genre_rec.Name;
   end loop;
 END;
```

测试：

```
openGauss=# CREATE OR REPLACE PROCEDURE genre_traverse() AS
openGauss$#  DECLARE
openGauss$#  genre_rec record;
openGauss$#  BEGIN
openGauss$#  for genre_rec in (select Id,Name from public.test1 order by 1)
openGauss$#    loop
openGauss$#  RAISE NOTICE 'Id is : % , Name is : %', genre_rec.Id,genre_rec.Name;
openGauss$#    end loop;
openGauss$#  END;
openGauss$# /
CREATE PROCEDURE
openGauss=# call genre_traverse();
NOTICE:  Id is : 1 , Name is : aaa
NOTICE:  Id is : 1 , Name is : <NULL>
 genre_traverse
----------------

(1 row)
```

## 8. 使用 SECURITY INVOKER

SECURITY INVOKER 指示该过程将以调用它的用户的权限执行。这是默认设置。

```
CREATE OR REPLACE PROCEDURE genre_traverse() SECURITY INVOKER
 AS
 DECLARE
 genre_rec record;
 BEGIN
 for genre_rec in (select Id,Name from public.test1 order by 1)
   loop
 RAISE NOTICE 'Genre Id is : % , Name is : %', genre_rec.Id,genre_rec.Name;
   end loop;
 END;
```

测试：

```
openGauss=# CREATE OR REPLACE PROCEDURE genre_traverse() SECURITY INVOKER
openGauss-#  AS
openGauss$#  DECLARE
openGauss$#  genre_rec record;
openGauss$#  BEGIN
openGauss$#  for genre_rec in (select Id,Name from public.test1 order by 1)
openGauss$#    loop
openGauss$#  RAISE NOTICE 'Genre Id is : % , Name is : %', genre_rec.Id,genre_rec.Name;
openGauss$#    end loop;
openGauss$#  END;
openGauss$# /
CREATE PROCEDURE
openGauss=# \c - test
Password for user test:
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "postgres" as user "test".
openGauss=> call genre_traverse();
ERROR:  permission denied for relation test1
DETAIL:  N/A
CONTEXT:  PL/pgSQL function genre_traverse() line 4 at FOR over SELECT rows
```

## 9. 使用 SECURITY DEFINER

SECURITY DEFINER 指定该过程将以拥有它的用户的权限执行。SECURITY DEFINER 过程不能执行事务控制语句（例如，COMMIT 和 ROLLBACK，取决于语言）。

在此示例中，我们使用用户“postgres”创建了一个存储过程，并使用无权访问该表的“test”用户调用它。

```
 CREATE OR REPLACE PROCEDURE genre_traverse() SECURITY DEFINER
 AS
 DECLARE
 genre_rec record;
 BEGIN
 for genre_rec in (select Id,Name from public.test1 order by 1)
   loop
 RAISE NOTICE 'Genre Id is : % , Name is : %', genre_rec.Id,genre_rec.Name;
   end loop;
 END;
```

测试：

```
openGauss=# CREATE OR REPLACE PROCEDURE genre_traverse() SECURITY DEFINER
openGauss-#  AS
openGauss$#  DECLARE
openGauss$#  genre_rec record;
openGauss$#  BEGIN
openGauss$#  for genre_rec in (select Id,Name from public.test1 order by 1)
openGauss$#    loop
openGauss$#  RAISE NOTICE 'Genre Id is : % , Name is : %', genre_rec.Id,genre_rec.Name;
openGauss$#    end loop;
openGauss$#  END;
openGauss$# /
CREATE PROCEDURE
openGauss=# \c - test
Password for user test:
FATAL:  Invalid username/password,login denied.
Previous connection kept
openGauss=# \c - test
Password for user test:
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "postgres" as user "test".
openGauss=> call genre_traverse();
NOTICE:  Genre Id is : 1 , Name is : aaa
NOTICE:  Genre Id is : 1 , Name is : <NULL>
 genre_traverse
----------------

(1 row)
```
