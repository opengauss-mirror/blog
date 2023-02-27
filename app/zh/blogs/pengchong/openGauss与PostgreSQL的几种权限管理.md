---
title: 'openGauss与PostgreSQL的几种权限管理'

date: '2022-10-19'
category: 'blog'
tags: ['openGauss']

archives: '2022-10'

author: '彭冲'

summary: 'openGauss与PostgreSQL的几种权限管理'

img: '/zh/post/pengchong/title/img9.png'

times: '10:20'
---

# openGauss 与 PostgreSQL 的几种权限管理

本文出处：[https://www.modb.pro/db/516180](https://www.modb.pro/db/516180)

### 一、schema 级权限管理

#### 细粒度权限 grant

数据库不同数据库对象的细化权限通过如下语句来最小化管控

```
grant XXX on Object to user
```

Object 为 table、sequence 等，XXX 为 select、update、delete 等。

#### view 封装权限

对于多个对象的权限管理，例如报表查询几张关联表，如果使用单个对象的 grant 语句会比较繁琐，此时可以创建视图，再对视图进行 grant 操作，这也是使用视图非常方便的特性，可以减少视图里相关对象的权限设置而允许用户有部分访问权限。

#### 函数动态返回数据

使用函数封装权限，可以很灵活的返回数据，也能保护数据结构的隐私，后期也很方便对结构进行维护，而不会影响接口数据的获取，因为函数接口没有改变。

#### 应用行级访问控制特性

行级访问控制特性是控制表中行级数据可见性，用户可以在数据表创建时开启行访问控制策略，该策略是指针对特定数据库用户、特定 SQL 操作生效的表达式，不同的用户共享结构而独立管理数据。

#### 批量对象权限管理

对 schema 里的某一类对象进行权限管理，例如所有 table 的查询权限：

```
grant USAGE on SCHEMA xxx to user;
grant SELECT on ALL TABLES in schema xxx to user;
alter DEFAULT PRIVILEGES in schema xxx grant SELECT on TABLES to user;
```

第一条语句对 schema 赋予使用权限，第二条语句对当前所有表赋予查询权限，第三条对新建表的默认权限增加查询权限。

以上几种的权限管理方式在 openGauss 与 PostgreSQL 是通用的。

### 二、db 级权限管理

#### 合理使用 public schema

单个 db 内不同的 user(或 schema，推荐 user 与 schema 保持一对一的映射关系)之间如果有对象交集权限管理，可以使用 public 模式，避免多个 schema 之间互相依赖，这种设计在 openGauss 与 PostgreSQL 也是通用的。

#### openGauss 新增 any 权限

openGauss 3.0 新增了 any 权限的特性，any 权限属于数据库内的权限，user 被授予任何一种 any 权限后，除了对系统模式没有权限，对 public 模式和 user 模式自动具有相应的权限，例如 SELECT ANY TABLE 只允许用户查看当前数据库内的所有 user 模式下的表数据。

当前最新的 openGauss 3.1 共支持以下 8 种对象的 26 个 any 权限

- TABLE 的 7 种 any 权限，包括 CREATE、ALTER、DROP、SELECT、INSERT、UPDATE、UPDATE
- SEQUENCE 的 4 种 any 权限，包括 CREATE、ALTER、DROP、SELECT
- TYPE 的 3 种 any 权限，包括 CREATE、ALTER、DROP
- INDEX 的 3 种 any 权限，包括 CREATE、ALTER、DROP
- TRIGGER 的 3 种 any 权限，包括 CREATE、ALTER、DROP
- FUNCTION 的 2 种 any 权限，包括 CREATE、EXECUTE
- PACKAGE 的 2 种 any 权限，包括 CREATE、EXECUTE
- SYNONYM 的 2 种 any 权限，包括 CREATE、EXECUTE

注意：openGauss 的 any 权限需要使用新的系统表 gs_db_privilege 进行查询。

### 三、cluster 级权限管理

#### 角色权限管理

数据库角色是全局的，可以基于角色继承来进行数据库对象的权限管理，创建用户时可以使用 INHERIT 属性来获得权限，这种方式在 openGauss 与 PostgreSQL 也是通用的。

注意：基于角色的依赖传递性较复杂，建议谨慎使用。

#### 预置角色

PostgreSQL 14 新增了两个内置角色 pg_read_all_data、pg_write_all_data 可以在 cluster 级跨 db 对 tables, views, sequences 进行读写权限控制。
