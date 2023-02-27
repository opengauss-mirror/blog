---
title: '如何使用pgloader迁移MySQL数据库至openGauss'
date: '2021-06-15'
category: 'blog'
tags: ['openGauss数据迁移']
archives: '2021-06'
author: '彭炯'
summary: '如何使用pgloader迁移MySQL数据库至openGauss'
img: '/zh/blogs/totaj/title/img.png'
times: '11:30'
---

# pgloader 介绍

pgloader 是一个数据导入工具，使用 COPY 命令将数据导入到 PostgreSQL。pgloader 有两种工作模式，一种是从文件导入，一种是迁移数据库。pgloader 在两种情况下都使用 PostgreSQL 的 COPY 协议高效的传输数据。

openGauss 兼容 PostgreSQL 的通信协议以及绝大部分语法，可使用 pgloader 将 MySQL 数据库迁移至 openGauss。

# pgloader 在 openGauss 上的问题

由于 openGauss 对原生 PostgreSQL 的通信协议进行了安全加固，这导致与 PostgreSQL 的默认通信协议互相不兼容了，因此，使用 pgloader 的 PostgreSQL 原生版本默认是不能连接 openGauss 的。会报类似下述错误：

<img src='./images/connect_failed.png'>

处理方式是通过修改 GUC 进行规避，涉及的 GUC 参数是 password_encryption_type，PostgreSQL 默认的加密方式是 md5，由于 md5 已经不安全了，为了提高 openGauss 的安全能力，openGauss 支持 sha256, 并且默认是 sha256 的加密方式，这就导致了上述报错。但是 openGauss 并没有删除 md5 的加密和验证逻辑，因此，是可以通过修改该 GUC 参数开启 md5 加密方式的。

开启方法：

```shell
 gs_guc reload -D $PGDATA -c "password_encryption_type = 1"
```

**一定要在设置完上述参数后，再新建用户。** 然后就可以使用该新建用户登录数据库了。

接下来我们将演示如何使用 pgloader 迁移 MySQL 数据库至 openGauss。

# 安装 pgloader

您可以直接从 [apt.postgresql.org](https://wiki.postgresql.org/wiki/Apt) 和官方 debian 存储库 [packages.debian.org/pgloader](https://packages.debian.org/search?keywords=pgloader) 安装 pgloader。

```shell
$ apt-get install pgloader
```

同时，您也可以通过 docker image 使用 pgloader。

```shell
$ docker pull dimitri/pgloader
$ docker run --rm --name pgloader dimitri/pgloader:latest pgloader --version
$ docker run --rm --name pgloader dimitri/pgloader:latest pgloader --help
```

# 配置 pgloader

pgloader 提供丰富的配置项，您可以自由定义迁移时的各类动作，如通过 include drop，删除目标数据库中名称出现在 MySQL 数据库中的所有表，以允许连续多次使用同一命令，从干净的环境自动启动。

这里简单介绍几个常用的配置项。

**FROM** ：源数据库的连接 URL，格式如下：

```
mysql://[user[:password]@][netloc][:port][/dbname][?option=value&...]
```

**INTO** ：目标数据库的连接 URL，格式如下：

```
postgresql://[user[:password]@][netloc][:port][/dbname][?option=value&...]
```

**WITH** ：从 MySQL 数据库加载时的选项。有 **include drop、create tables、create indexes** 等选项。
**CAST** ：用户自定义类型转换规则。允许用户覆盖已有的默认转换规则或者使用特殊情况修改它们。

部分迁移：用户可以通过 **including only table names matching** 和 **excluding table names matching** 实现只迁移特定的表或者在迁移过程中排除特定的表。

详细的配置项解读，可查看官网的说明：

[https://pgloader.readthedocs.io/en/latest/ref/mysql.html](https://pgloader.readthedocs.io/en/latest/ref/mysql.html)

下面是一份从 MySQL 迁移到 openGauss 的配置文件示例：

```
LOAD DATABASE
FROM mysql://mysql_test:password123@1.1.1.1:3306/mysql_database
INTO postgresql://opengauss_test:password_123@1.1.1.1:5432/opengauss_database
WITH include drop, create tables, create indexes, reset no sequences,
     workers = 8, concurrency = 1,
     multiple readers per thread, rows per range = 50000
CAST
type varchar when(= 1 precision) to "boolean" drop typemod keep default keep not null;
```

以上配置文件的含义是，迁移数据时，MySQL 侧使用的用户名密码分别是 **mysql_test** 和 **password123** 。MySQL 服务器的 IP 和 port 分别是 **1.1.1.1** 和 **3306** ，待迁移的数据库是 **mysql_database** 。

openGauss 侧使用的用户名密码分别是 **opengauss_test** 和 **password_123** 。openGauss 服务器的 IP 和 port 分别是 **1.1.1.1** 和 **5432** ，目标数据库是 **opengauss_database** 。

需要注意的是，这里使用的用户需要有远程连接 MySQL 和 openGauss 的权限，以及对对应数据库的读写权限。同时对于 openGauss，运行 pgloader 所在的机器需要在 openGauss 的远程访问白名单中。

# 创建用户及 database

在 openGauss 侧创建迁移时需要用到的用户以及 database。

<img src='./images/create_database.png'>

# 运行 pgloader 进行数据迁移

以下演示基于使用 docker image 方式安装的 pgloader。将前面准备好的配置文件命名为 openGauss.loader。

<img src='./images/opengauss.loader.png'>

启动 docker：

```shell
docker run -tid --name pgloader_test dimitri/pgloader
```

复制配置文件到 docker：

```shell
docker cp ./openGauss.loader pgloader_test:/
```

进入 docker 环境：

```shell
docker exec -it pgloader_test /bin/bash
```

<img src='./images/docker_run.png'>

启动 pgloader，等待数据迁移完成，查看迁移结果报告：

```shell
pgloader openGauss.loader
```

<img src='./images/pgloder.png'>

在 openGauss 侧查看迁移结果：

<img src='./images/opengauss_results.png'>
