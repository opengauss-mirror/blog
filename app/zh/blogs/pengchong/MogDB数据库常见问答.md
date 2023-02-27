---
title: 'MogDB数据库常见问答'

date: '2022-05-18'

category: 'blog'
tags: ['MogDB数据库常见问答']

archives: '2022-05'

author: '彭冲'

summary: 'MogDB数据库常见问答'

img: '/zh/blogs/pengchong/title/img9.png'

times: '10:20'
---

# MogDB 数据库常见问答

本文出处：[https://www.modb.pro/db/393741](https://www.modb.pro/db/393741)

本文将不断汇总 MogDB 日常使用过程中遇到的一些常见问题。

### Q1.创建普通用户之后，为什么没有创建表的权限？

参考下面这段代码

```
[omm@mogdb ~]$ gsql -Uomm postgres -r
gsql ((openGauss 3.0.0 build 02c14696) compiled at 2022-04-01 18:12:34 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=# create database mydb1;
CREATE DATABASE
openGauss=# create user user1 password 'Admin@1234';
CREATE ROLE
openGauss=# alter database mydb1 owner to user1;
ALTER DATABASE
openGauss=# \q
[omm@mogdb ~]$ gsql -d mydb1 -U user1 -r --password='Admin@1234'
gsql ((openGauss 3.0.0 build 02c14696) compiled at 2022-04-01 18:12:34 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

mydb1=> create table t1(id int);
ERROR:  permission denied for schema public
DETAIL:  N/A
mydb1=> create table user1.t1(id int);
ERROR:  schema "user1" does not exist

```

分析：MogDB 里创建用户时会自动创建一个同名的 schema，按理来说用户可以在自己的 schema 下创建对象，为什么上面 create table user1.t1(id int)执行不成功呢，从提示来看，当前连接的 database 下并没有这个 schema，因为自动创建用户的 schema 是在当前连接的数据库里。我们前面使用 omm 管理用户所做的操作都在默认的 postgres 数据库下。

第一个报错 ERROR: permission denied for schema public 也很正常

```
mydb1=> show search_path;
  search_path
----------------
 "$user",public
(1 row)
```

用户的增删改查操作会参照默认查询路径设置值的顺序去查找，用户同名的 schema 在当前 mydb1 里没有，就查找 public 模式，上面的 create 操作就自然创建到 public 模式下了，而 public 模式的默认权限为空，也就是需要对 public 模式赋权后才能使用。

针对上面的问题，我们使用管理用户连接 mydb1，然后手工创建用户的 schema，并设置绑定给 user1 之后就可以正常使用了。

```
[omm@mogdb ~]$ gsql -Uomm mydb1 -r
gsql ((openGauss 3.0.0 build 02c14696) compiled at 2022-04-01 18:12:34 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

mydb1=# create schema user1 authorization user1;
CREATE SCHEMA
mydb1=# \q
```

### Q2.不同的 database 之间可以跨库访问吗？

不可以，数据库连接不能跨 database，例如 gsql 访问其它数据库需要使用\connect 切换连接

```
openGauss=# \connect mydb1 Non-SSL connection (SSL connection is recommended when requiring high-security) You are now connected to database "mydb1" as user "omm". mydb1=# \conninfo You are connected to database "mydb1" as user "omm" via socket in "/tmp" at port "3000".
```

跨库访问需要使用 dblink 或者 postgres_fdw，参考：[MogDB 插件之跨库访问](https://www.modb.pro/db/336337)

### Q3.database 的 owner 为什么对 schema 里的对象没有权限？

database 的权限与表、视图等对象权限之间隔着一层 schema 的权限。database 的 owner 只代表对其直属对象：schema、event trigger 等有全部权限，并不具有 schema 里表、视图等对象的权限。

### Q4.为什么 function 不像 schema 那样需要授权就能直接访问呢？

参考下面的操作步骤，schema 需要授予权限后才可以访问，而 function 就可以直接调用呢？
<img src='./images/20220413-52da4846-5d24-4a95-b24e-86dc22032a03.png'>
因为不同的数据库对象有不同的默认权限，可以参考下面 PG 文档里的这张图
<img src='./images/20220413-ba76382b-6682-4b86-8830-f93d14f127a0.png'>

### Q5.如何像 MySQL 数据库那样设置 readonly 只读用户？

MySQL 里的 database 之间是可以互相访问，没有隔离，MogDB 里面 database 之间是隔离的。MySQL 里的 database 相当于 MogDB 里面的 schema，可以在 MogDB 的 schema 级别设置数据只读，使用默认权限：

```
alter default privileges for role user1 in schema s1 grant select on tables to user2;
```

上面是对于 user1 用户在 schema s1 下新建的表，user2 用户都有 select 权限。注意：并不能实现以后任何用户(以后新增用户)在 s1 下新建的表，user2 用户都有权限。
