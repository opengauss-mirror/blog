---
title: 'openGauss常用gsql命令集合'
date: '2021-12-27'
category: 'blog'
tags: ['openGauss常用gsql命令集合']
archives: '2021-12-27'
author: 'zhangxb'
summary: 'openGauss常用gsql命令集合'
img: '/zh/blogs/zhangxb/title/img.png'
times: '19:30'
---

### 概述

openGauss 与其他数据库一样，都遵标准的 SQL 规范。即其增删改查以及存储过程等语法与其他数据库基本相似。

有区别的点在与 openGauss 的 gsql 工具的使用，例如数据库查询、增加，表的查看等方面。 因此本章节重点介绍下 gsql 工具的常用命令。

### 命令介绍

1. 登录

   命令： `gsql -d postgres -p 5432 -r` \
   说明： 该命令登录到数据库客户端， `-d postgres` 执行要链接的数据库。 `-p 5432` 链接数据库的端口。 `-r` 开启快捷键。

2. 退出

   命令: `\q` \
   说明： 退出 gsql 客户端。

3. 查看数据库

   命令: `\l` `\l+` \
   说明： 查看所有的数据库， `\l+`可以看每个库的空间大小。

4. 切换数据库

   命令: `\c dbname` \
   说明： dbname 为要切换的数据库名称。切换到指定的数据库里面。

5. 数据库增删

   创建数据库: `create database db_test;` \
   删除数据库: `drop database db_test;`

6. 查看所有表

   命令： `\d` `\d+` \
   说明: 查看当前库下所有表。 `\d+`可以看到每个表占用空间大小。

   命令: `\d table_name` \
   说明： 显示指定表的表结构

7. 查看表空间

   命令: `\db` \
   说明： 查看所有表空间

8. 查看索引

   命令: `\di` \
   说明: 查看所有索引

9. 查看所有用户

   命令： `\du` \
   说明: 查看所有用户

10. 设置 GUC 参数

    命令: `\set KEY VALUE` \
    说明： 设置参数，在当前会话生效。 例如 `\set schema public`设置当亲模式为 public。

    命令: `ALTER SYSTEM SET parameter TO value;` \
    说明： 此命令会将参数写入配置文件，永久生效。 例如 `ALTER SYSTEM SET PORT TO 8000;`设置端口为 8000，写入到配置文件中。

11. 批量执行脚本

    命令: `gsql -d postgres -p 5432 -c "insert into t1 values(1)"` \
    说明: 使用 gsql 执行一条 sql 语句.

    命令: `gsql -d postgres -p 5432 -f /home/omm/test.sql` \
    说明: 使用 gsql 命令，一次执行一个 sql 文件。执行到指定的 postgres 数据库中。

12. 系统表

    命令: `\dS` \
    说明： 查看所有的系统表，其中每一个表都可以使用 select 语句查看详细信息。

#### 系统函数

1. 字符串

   (1)字符串长度： `select char_length('hello word');`

   (2)字符串出现位置： `select position(substring in string)` 如 `select position('word' in 'helloword');`

   (3)逆序字符串: `select reverse('hello');`

   (4)拼接字符串： `select 'aaa' || 'aaa';`

   (5)转换为大写： `select upper('tom');`

   (6)转换为小写： `select lower('TOM');`

2. 数字

   (1)加、减、乘、除、取余

   ```
   select 10 + 2;
   select 10 - 2;
   select 10 * 2;
   select 10 / 2;
   select 10 % 3;
   ```

   (2)绝对值: `select abs(-5);`

   (3)阶乘： `select 10!;`

   (4)0-1 之前随机数: `select random();`

3. 聚集函数

   (1)所有输入行的和 sum 函数： `select sum(expression);`

   例如 `select sum(id) from t1;`

   (2)输入行的最大值： `select max(expression);`

   例如 `select max(id) from t1;`

   (3)输入行的最小值： `select min(expression);`

   例如 `select min(id) from t1;`

   (4)输入行的平均值： `select avg(expression);`

   例如 `select avg(id) from t1;`

   (5)输入行的总数: `select count(expression);`

   例如 `select count(id) from t1;`

   (6)输入行的中位数: `select median(expression);`

   例如 `select median(id) from t1;`
