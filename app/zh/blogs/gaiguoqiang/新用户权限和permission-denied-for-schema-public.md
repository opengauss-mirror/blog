---
title: '新用户权限和permission denied for schema public'

date: '2020-11-19'

category: 'blog'
tags: ['新用户权限和permission denied for schema public']

archives: '2020-11'

author: '盖国强'

summary: '新用户权限和permission denied for schema public'

img: '/zh/blogs/gaiguoqiang/title/img29.png'

times: '15:30'
---

# 新用户权限和 permission denied for schema public<a name="ZH-CN_TOPIC_0293240556"></a>

openGauss 安装完成后，会自动创建自定义的帐号，名称默认为 omm。默认用户名 omm 和操作系统用户同名，我们可以通过**REPLACE**修改其密码。

```
omm=# alter role omm identified by 'Open6au55' replace 'Gauss@123';
NOTICE:  The encrypted password contains MD5 ciphertext, which is not secure.
ALTER ROLE
omm=# alter role omm identified by 'Open6au55' replace 'Gauss@123';
ERROR:  The old password is invalid.
```

可以使用 omm 登录，创建一个新的用户，我们可以看到 openGauss 对于密码安全的要求：

```
omm=# create user enmotech with password 'enmotech';
ERROR:  Password must contain at least three kinds of characters.
omm=#
omm=# create user enmotech with password 'Enm0t3ch';
NOTICE:  The encrypted password contains MD5 ciphertext, which is not secure.
CREATE ROLE
```

创建独立的数据库，给用户授权：

```
omm=# create database enmotech owner enmotech;
CREATE DATABASE
omm=# GRANT ALL PRIVILEGES ON DATABASE enmotech to enmotech;
GRANT
omm=# ALTER ROLE enmotech CREATEDB;
ALTER ROLE

omm=# \q
```

在操作系统上，连接到容器数据库中：

```
[root@ecs-514e-0004 ~]# gsql -d enmotech -U enmotech -W'Enm0t3ch' -h 192.168.1.94 -p 8888
gsql ((openGauss 1.0 build ec0e781b) compiled at 2020-04-27 17:25:57 commit 2144 last mr 131 )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

enmotech=>
```

注意，此时创建数据表还是遇到错误，不允许在 public 上创建：

```
enmotech=> create table yunhe (id number);
ERROR:  permission denied for schema public
```

类似的建表失败报错可能还累死：

```
[Err] ERROR: permission denied for schema public
LINE 1: create table xxxx
```

这是因为安全原因，不允许普通客户在 public 模式下操作。

在测试需要下，可以将 ALL PRIVILEGES 授予 enmotech 用户，需要使用超级用户授权，这里是 omm 用户：

```
omm=# GRANT ALL PRIVILEGES TO enmotech;
ALTER ROLE
```

系统权限又称为用户属性，包括 SYSADMIN、CREATEDB、CREATEROLE、AUDITADMIN 和 LOGIN。

```
omm=# \du
                                         List of roles
 Role name |                               Attributes                               | Member of
-----------+------------------------------------------------------------------------+-----------
 enmotech  | Sysadmin                                                               | {}
 gaussdb   |                                                                        | {}
 omm       | Sysadmin, Create role, Create DB, Replication, Administer audit, UseFT | {}
```

现在 enmotech 这个用户，可以继续测试了：

```
eygle=> create table eygle(id number);
CREATE TABLE
eygle=> drop table eygle;
DROP TABLE
```

在 openGauss 中，通过 sql 文件，加载数据也非常简单：

```
eygle=> \i /tmp/dan.sql
INSERT 0 1
INSERT 0 1
...
```
