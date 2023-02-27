---
title: 'MogDB数据库入门使用尝鲜'

date: '2022-05-24'

category: 'blog'
tags: ['MogDB数据库入门使用尝鲜']

archives: '2022-05'

author: '云和恩墨'

summary: 'MogDB数据库入门使用尝鲜'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# MogDB 数据库入门使用尝鲜

本文出处：[https://www.modb.pro/db/154087](https://www.modb.pro/db/154087)

# 一、概述

## 1.1、什么是 MogDB

MogDB 是 EnMotech openGauss DataBase Enterprise Edition 的缩写，是云和恩墨以华为 openGauss 开源数据库为基础，投入研发力量，围绕高可用、安全、自动化运维、数据库一体机、SQL 审核优化等企业需求推出的整体解决方案。云和恩墨致力于发挥企业自身优势，优先支持鲲鹏算力，在 openGauss 的运维服务、平台工具等方向为用户提供可信赖的企业级服务和产品，为 openGauss 的开源生态持续贡献力量。

## 1.2、了解更多

更多关于 MogDB 的科普，请参看 👇🏻

[墨天轮 MogDB 百科](https://www.modb.pro/wiki/641)

[云和恩墨官网 MogDB 产品介绍](https://enmotech.com/products/MogDB)

[MogDB 官方文档](https://docs.mogdb.io/zh/mogdb/v2.0.1/overview)

[MogDB 线上免费实操](https://www.modb.pro/terminal)
<img src='./images/20211102-0ab6692e-6bb4-498b-a2e9-58fe4f0b720d.png'>

# 二、入门实操

## 2.1、容器化安装

1、输入以下命令连接华为云 SWR：

```
docker login -u cn-east-3@MLI3I6DMIETZS9H5N2VI -p c2ebf043f73720aabada13b8a3ae0f7c152bbe32515389a4f60ceede8857ce51 swr.cn-east-3.myhuaweicloud.com
```

2、根据您的系统架构输入以下命令之一获取最新版 MogDB 镜像文件：

- x86-64 架构的机器：

```
docker pull swr.cn-east-3.myhuaweicloud.com/enmotech/mogdb:2.0.1_amd
```

- ARM64 架构的机器：

```
docker pull swr.cn-east-3.myhuaweicloud.com/enmotech/mogdb:2.0.1_arm
```

3、创建一个要挂载的目录

```
mkdir /mymogdb
```

4、启动容器

```
docker run --name mymogdb --privileged=true -d -e GS_PASSWORD=Secretpassword@123 -v /mymogdb:/var/lib/opengauss -p 15432:5432  swr.cn-east-3.myhuaweicloud.com/enmotech/mogdb:2.0.1_amd
```

【注意 📢】

> 1、这里是 x86 架构机器的，ARM64 的把 amd 的镜像换成
> 2、添加-v 参数指定挂载的目录，防止容器意外被删除导致数据丢失
> 3、密码需要包含大小写和特殊符号，不然启动失败

## 2.2、测试使用

1、进入容器

```
docker exec -it mymogdb bash
```

2、简单使用

```
root@modb:~# su - omm
omm@modb:~$ gsql
gsql ((MogDB 2.0.1 build f892ccb7) compiled at 2021-07-09 16:15:21 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

omm=# \l
                              List of databases
   Name    | Owner | Encoding |   Collate   |    Ctype    | Access privileges
-----------+-------+----------+-------------+-------------+-------------------
 omm       | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 |
 postgres  | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 |
 template0 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +
           |       |          |             |             | omm=CTc/omm
 template1 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +
           |       |          |             |             | omm=CTc/omm
(4 rows)
```

# 三、遇到问题及解决

## 3.1、ERROR: permission denied for schema public

**1、需求**

> 我想要新建一个用户，再新建一个数据库并把 owner 设置为新建的用户，然后在该数据库中新建表

**2、操作**

```
# 通过omm用户连上数据库 su - omm gsql # 创建一个新用户 CREATE USER tom WITH PASSWORD 'xxx'; # 创建一个新的数据库并把owner设置为新建的用户 CREATE DATABASE demo OWNER tom; # 退出 \q # 使用新用户登录 gsql -U tom -d demo # 创建一个表 create table my_table (id integer);
```

这时候报错了！

```
ERROR:  permission denied for schema public
```

**3、问题解决**

有幸搜到盖老师的文章，问题直接解决，Nice !!!
[循序渐进 openGauss : 新用户权限和 permission denied for schema public](https://www.modb.pro/db/27573)

这是因为安全原因，不允许普通客户在 public 模式下操作。

可以将 ALL PRIVILEGES 授予 deom 用户，需要使用超级用户授权，这里是 omm 用户：

```
omm=# GRANT ALL PRIVILEGES TO demo; ALTER ROLE
```

再次测试

```
create table my_table (id integer); CREATE TABLE
```

问题解决！

## 3.2、[28000] FATAL: The account has been locked.

【原因】
原因是由于多次密码输入错误，导致用户被锁。
【解决】
解锁即可

```
# 解锁
omm=# alter user tom account unlock;
ALTER ROLE

# 需要的也可以重置密码
postgres=# alter user tom password 'xxx';
ALTER ROLE
```
