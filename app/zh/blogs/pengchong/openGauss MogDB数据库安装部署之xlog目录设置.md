---
title: 'openGauss/MogDB数据库安装部署之xlog目录设置'

date: '2022-05-24'

category: 'blog'
tags: ['openGauss/MogDB数据库安装部署之xlog目录设置']

archives: '2022-05'

author: '云和恩墨'

summary: 'openGauss/MogDB数据库安装部署之xlog目录设置'

img: '/zh/blogs/pengchong/title/img9.png'

times: '10:20'
---

# openGauss/MogDB 数据库安装部署之 xlog 目录设置

本文出处：[https://www.modb.pro/db/176915](https://www.modb.pro/db/176915)

### 关于 xlog

xlog 文件是一个记录事务日志的文件，它记录数据库系统中所有的更改操作，当发生主机电源故障或其他导致服务器崩溃的服务器故障时，由于 xlog 日志包含了关于已经执行的每个事务的足够信息，所以数据库能够通过在事务日志中 replay 操作来恢复数据库中的数据。为了提高写入性能需要将 xlog 从数据目录分离出来。

下面介绍几种 xlog 目录设置方式

### 手工调整

如果我们安装初始化过程中没有单独指定，或者数据库服务运行之后要进行调整，可以先停止数据库服务，然后手工通过软链接方式来调整。

调整之前原来规划的数据目录如下

```
/mogdb_data/data15400
```

增加下面的分区目录作为单独的 xlog 路径

```
/mogdb_xlog/xlog15400
```

那我们需要关闭数据库服务之后，使用如下命令调整

```
mv /mogdb_data/data15400/pg_xlog /mogdb_xlog/xlog15400 ln -s /mogdb_xlog/xlog15400 /mogdb_data/data15400/pg_xlog
```

### 初始化调整

初始化 gs_initdb 时可以通过–xlogdir 指定，参考如下：

```
gs_initdb --nodename=og_69 \
--pgdata=/mogdb_data/data15400 \
--xlogdir=/mogdb_xlog/xlog15400
--encoding=UTF-8 \
--username=omm \
--pwpasswd=Mogdb@1234 \
--security
```

### clusterconfig.xml 提前配置

当我们使用 clusterconfig.xml 文件进行配置安装时，可以使用 dataNodeXlogPath1 参数预先进行设置。

xml 参数说明请参考官网[https://docs.mogdb.io/zh/mogdb/v2.0.1/4-installing-mogdb](https://docs.mogdb.io/zh/mogdb/v2.0.1/4-installing-mogdb)

参考如下片段
<img src='./images/20211124-d1ecad30-f82d-4b04-937d-f587b5cf68bc.png'>

注意 dataNode1 数据目录的格式里有各个主机的 hostname 名称，dataNodeXlogPath1 参数里只需要重复配置多个 xlog 的路径即可，不需要有各主机 hostname 的设置。这点需要注意一样。

比如我们每台机器规划的路径是/mogdb_xlog/xlog15400，那一主三备的配置值就是

```
 <PARAM name="dataNodeXlogPath1" value="/mogdb_xlog/xlog15400,/mogdb_xlog/xlog15400,/mogdb_xlog/xlog15400"/>
```
