---
title: 'openGauss社区入门（openGauss-对象管理）'

date: '2022-08-19'

category: 'blog'
tags: ['openGauss社区开发入门']

archives: '2022-08'

author: 'z-qw'

summary: 'openGauss社区开发入门'

img: ''

times: '18:30'
---

### 数据库

1. 创建数据库
   CREATE DATABASE db_name
   [[WITH]OWNER[=]user_name]--数据库的所有者
   [ TEMPLATE [=] template ]--选择数据库的模板
   [ ENCODING[=] encoding ]--数据库的编码
   [ LC_COLLATE [=] lc_collate ]
   [ LC_CTYPE [=] lc_ctype ]
   [ TABLESPACE [=] tablespace ]--数据库的表空间
   [ CONNECTION LIMIT [=] connlimit ] ]
   \c db_name --切换到指定数据库 2.修改数据库
   ALTER DATABASE name RENAME TO new_name;
   ALTER DATABASE name OWNER TO new_owner;
   ALTER DATABASE name SET TABLESPACE new_tablespace;
   ALTER DATABASE name RESET ALL; 3.删除数据库
   drop database name;
   drop database if exists name;

### 模式

1.创建模式
create schema name; 2.修改模式
alter schema name rename to newname;
alter schema name owner to newowner; 3.删除模式
drop schema name;

### 表

1.创建表
create table name(id int,name varchar(60)); 2.修改表
alter table table_name add d int；--增加索引 3.删除表
DROP TABLE table_name;
delete from table_name where id=1;
