---
title: 'MogDB 2.0.1补丁升级方案'

date: '2022-06-27'

category: 'blog'
tags: ['MogDB 2.0.1补丁升级方案']

archives: '2022-06'

author: '云和恩墨'

summary: 'MogDB 2.0.1补丁升级方案'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# MogDB 2.0.1 补丁升级方案

本文出处：[https://www.modb.pro/db/420586](https://www.modb.pro/db/420586)

### 适用版本

MogDB 2.0.1

MogDB 2.1 及以后的版本不存在这个问题。

### 补丁版本

MogDB 2.0.3（联系云和恩墨获取补丁包）

### 修复内容

MogDB 主备架构，当备库启动归档(archive_mode = on)后，walsender 线程需要发送 archive lsn 消息。此逻辑执行时，用于获取备库列表的链表数据结构用完后没有被释放，因此产生了内存泄漏，这导致 walsender 产生了缓慢的内存占用增长的现象。

### 适用数据库安装方式

1、[手工安装（om）](https://docs.mogdb.io/zh/mogdb/v2.0.1/manual-installation)

2、[标准安装（om）](https://docs.mogdb.io/zh/mogdb/v2.0.1/1-installation-overview)

### 前提条件

1、数据库稳定运行，各功能及状态正常

2、允许数据库暂停对外提供服务

### 升级步骤

两种升级方式：

1、数据库可以停止连续对外服务，主库关闭后，替换数据库安装包后再启动

2、数据库不能停止连续对外服务，可以先升级备库，然后通过 switchover 切换主备角色，将备库提升为主库继续对外提供服务，切换过程中会短暂停止对外提供服务

#### 解压安装包

```
--将MogDB2.0.3安装包解压到/opt/mogdb203（目录可自定义）
mkdir -p /opt/mogdb203

--解压安装包
tar -xvf MogDB-2.0.3-CentOS-x86_64.tar.gz -C /opt/mogdb203/
cd /opt/mogdb203

--再次解压并修改属组
tar -xvf MogDB-2.0.3-CentOS-64bit.tar.bz2
chown -R omm: /opt/mogdb203

--查看bin和lib目录
ls -l |egrep -i 'bin|lib'
drwxr-xr-x 3 omm dbgrp     4096 Jun 17 00:25 bin
drwxr-xr-x 5 omm dbgrp     4096 Jun 17 00:25 lib
```

#### 关闭 MogHA

如果主备节点部署了高可用工具 MogHA，在操作之前需要先收工停止，否则 MogHA 会自动拉起关闭的数据库节点。

```
sudo systemctl stop mogha systemctl status mogha
```

#### 关闭数据库

```
--单节点 gs_ctl -D $PGDATA stop --所有节点 gs_om -t stop
```

#### 替换安装包

仅需要替换 bin 目录和 lib 目录即可

```
--进入MogDB的安装目录 或 app目录
mv bin bin_201 && cp -r /opt/mogdb203/bin .
mv lib lib_201 && cp -r /opt/mogdb203/lib .

--om安装的数据库还需要copy一下文件
cp bin_201/cluster_static_config bin/
cp bin_201/upgrade_version bin/

```

#### 备库执行 switchover(可选)

```
gs_ctl switchover -D $PGDATA --刷新配置文件，每次切换必做步骤 gs_om -t refreshconf
```

#### 启动数据库

```
--手工启动主库 gs_ctl -D $PGDATA start -M primary --手工启动备库 gs_ctl -D $PGDATA start -M standby --gsom启动，任何节点都可以 gs_om -t start
```

#### 启动 MogHA

```
sudo systemctl start mogha systemctl status mogha
```

### 验证

#### 数据库状态

```
gs_ctl query -D $PGADATA 或 gs_om -t status --detail
```

#### walsender 占用内存情况

定期执行观察

```
select contextname,pg_size_pretty(sum(totalsize)),pg_size_pretty(sum(freesize))
from gs_session_memory_detail
where contextname ='Wal Sender';
```
