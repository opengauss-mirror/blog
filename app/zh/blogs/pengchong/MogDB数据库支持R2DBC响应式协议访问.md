---
title: 'MogDB数据库支持R2DBC响应式协议访问'

date: '2022-04-12'

category: 'blog'
tags: ['MogDB数据库支持R2DBC响应式协议访问']

archives: '2022-04'

author: '彭冲'

summary: 'MogDB数据库支持R2DBC响应式协议访问'

img: '/zh/blogs/pengchong/title/img9.png'

times: '10:20'
---

# MogDB 数据库支持 R2DBC 响应式协议访问

本文出处：https://www.modb.pro/db/232405

我们知道使用 JDBC 协议是阻塞式的连接，为了解决这个问题，出现了两个标准，一个是 oracle 提出的 ADBC (Asynchronous Database Access API)，另一个就是 Pivotal 提出的 R2DBC (Reactive Relational Database Connectivity)。

目前有部分关系型数据库实现了 R2DBC 协议，包括 mysql、mssql、postgresql 等。MogDB 数据库兼容 PostgreSQL R2DBC Driver，下面通过样例进行测试。

### 首先快速搭建 MogDB 环境

使用 docker 命令一键搭建

```
docker run --name mogdb \ --privileged=true \ --detach \ --env GS_PASSWORD=Admin@1234 \ --publish 15400:5432 \ swr.cn-east-3.myhuaweicloud.com/enmotech/mogdb:2.0.1_amd
```

### 数据库结构化准备

```
create database productdb;
\c productdb
create user moguser password 'Admin@1234';
\c productdb moguser

CREATE TABLE product
(
id integer,
description character varying(255),
price numeric,
PRIMARY KEY (id)
);

insert into product values(1,'PostgreSQL',0),
(2,'MogDB',1);

```

### Java 项目工程

参考如下链接：https://github.com/vinsguru/vinsguru-blog-code-samples/tree/master/r2dbc/crud

### 配置 MogDB 数据库连接信息

修改工程项目下的 application.properties 文件

```java
spring.r2dbc.url=r2dbc:postgresql://192.168.137.227:15400/productdb
spring.r2dbc.username=moguser
spring.r2dbc.password=Admin@1234
运行程序进行测试点击R2dbcApplication文件，Run As运行
然后我们可以打开浏览器，输入接口地址进行测试：
下面是查询所有产品(http://localhost:8080/product/all)
更多R2DBC用法可以参考github上pgjdbc/r2dbc-postgresql
```
