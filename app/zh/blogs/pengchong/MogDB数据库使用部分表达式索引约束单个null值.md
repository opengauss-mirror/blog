---
title: 'MogDB数据库使用部分表达式索引约束单个null值'

date: '2022-04-14'

category: 'blog'
tags: ['MogDB数据库使用部分表达式索引约束单个null值']

archives: '2022-04'

author: '彭冲'

summary: 'MogDB数据库使用部分表达式索引约束单个null值'

img: '/zh/blogs/pengchong/title/img9.png'

times: '10:20'
---

# MogDB 数据库使用部分表达式索引约束单个 null 值

本文出处：https://www.modb.pro/db/49802

> SQL 标准允许在唯一约束列上插入多个 null 值,有些数据库是支持在唯一约束列上只允许插入单个 null 值的。MogDB 数据库遵守 SQL 标准，是可以插入多个 null 值。

### 默认行为

快速搭建 MogDB 环境

```
docker run --name mogdb \ --privileged=true \ --detach \ --env GS_PASSWORD=Admin@1234 \ --publish 15400:5432 \ swr.cn-east-3.myhuaweicloud.com/enmotech/mogdb:2.0.1_amd
```

进入容器

```
docker exec -it mogdb bash
```

测试插入 null 值，使用 gsql 登录数据库

```
omm=# create table abc(a2 varchar(10) unique);
NOTICE:  CREATE TABLE / UNIQUE will create implicit index "abc_a2_key" for table "abc"
CREATE TABLE
omm=#
omm=# insert into abc values('1');
INSERT 0 1
omm=#
omm=# insert into abc values(null);
INSERT 0 1
omm=#
omm=# insert into abc values(null);
INSERT 0 1

```

可以看到默认情况下是可以插入多个 null 值的，因为 PG 里唯一索引是基于 equal 等值比较的，null 不等于任何值（包括 null 值）。Java 开发定义实体类时也是需要重写 equal 方法，进行 null 判断。

### 使用部分表达式索引

```
omm=# drop table if exists abc;
DROP TABLE
omm=#
omm=# create table abc(a2 varchar(10));
CREATE TABLE
omm=#
omm=# CREATE UNIQUE INDEX idx_abc ON abc ((a2 is null)) WHERE a2 IS NULL;
CREATE INDEX
omm=#
omm=# insert into abc values('1');
INSERT 0 1
omm=#
omm=# insert into abc values(null);
INSERT 0 1
omm=#
omm=# insert into abc values(null);
ERROR:  duplicate key value violates unique constraint "idx_abc"
DETAIL:  Key ((a2 IS NULL))=(t) already exists.

```

可以看到使用 where 条件对 a2 列为 null 值创建了唯一索引并存储为 true 值，上面第二条插入 null 值语句报错。

下面是对组合索引使用同样的方法

```
omm=# drop table if exists abc;
DROP TABLE
omm=#
omm=# create table abc(a1 int4, a2 varchar(10));
CREATE TABLE
omm=#
omm=# CREATE UNIQUE INDEX idx_abc_1 ON abc (a1,a2) WHERE a2 IS NOT NULL;
CREATE INDEX
omm=#
omm=# insert into abc values(1,'1');
INSERT 0 1
omm=#
omm=# insert into abc values(1,'1');
ERROR:  duplicate key value violates unique constraint "idx_abc_1"
DETAIL:  Key (a1, a2)=(1, 1) already exists.
omm=#
omm=# CREATE UNIQUE INDEX idx_abc_2 ON abc (a1,(a2 is null)) WHERE a2 is NULL;
CREATE INDEX
omm=#
omm=# insert into abc values(1,null);
INSERT 0 1
omm=#
omm=# insert into abc values(1,null);
ERROR:  duplicate key value violates unique constraint "idx_abc_2"
DETAIL:  Key (a1, (a2 IS NULL))=(1, t) already exists.
omm=#
```
