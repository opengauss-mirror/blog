---
title: '手工安装部署openGauss3.0一主一备（非om工具安装）'

date: '2022-06-30'

category: 'blog'
tags: ['手工安装部署openGauss3.0一主一备（非om工具安装）']

archives: '2022-06'

author: '云和恩墨'

summary: '手工安装部署openGauss3.0一主一备（非om工具安装）'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# 手工安装部署 openGauss3.0 一主一备（非 om 工具安装）

本文出处：[https://www.modb.pro/db/425385](https://www.modb.pro/db/425385)

### 一、操作系统配置(centos7.6)

#### 1.关闭防火墙

```
systemctl stop firewalld systemctl disable firewalld
```

#### 2.关闭 selinux 服务

```
setenforce 0 vim /etc/selinux/config SELINUX=disabled
```

#### 3.关闭透明大页

```
echo never > /sys/kernel/mm/transparent_hugepage/enabled cat /sys/kernel/mm/transparent_hugepage/enabled
```

#### 4.安装依赖包

```
yum install libaio-devel -y
```

### 二、安装环境准备

#### 1.创建相关目录、用户和组

```
#创建数据库初始化用户组和用户
groupadd dbgrp -g 1000
useradd omm -u 1000 -g 1000
echo "test@123" | passwd --stdin omm
#创建安装包存放目录
mkdir -p /opt/software/openGauss3.0
#创建数据库初始化数据目录
mkdir -p /data/openGauss3.0
chown omm.dbgrp /data/openGauss3.0
```

#### 2.下载安装包

```
cd /opt/software/openGauss3.0
wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/3.0.0/x86/openGauss-3.0.0-CentOS-64bit-all.tar.gz
#依次解压
tar -zxvf openGauss-3.0.0-CentOS-64bit-all.tar.gz
tar -jxvf openGauss-3.0.0-CentOS-64bit.tar.bz2
```

#### 3.配置 omm 用户环境变量

```
su - omm
vim .bashrc
export GAUSSHOME=/opt/software/openGauss3.0
export LD_LIBRARY_PATH=$GAUSSHOME/lib:$LD_LIBRARY_PATH
export PATH=$GAUSSHOME/bin:$PATH
#加载使配置生效
source .bashrc
```

**以上所有操作在两台主机上均要操作。**

### 三、开始搭建主库（在 OG1 上操作）

#### 1.初始化数据库

```
su - omm
gs_initdb -D /data/openGauss3.0 --nodename=primary -E UTF-8 -w test@123
cd /data/openGauss3.0
#编辑postgresql.conf配置文件，将相关信息添加到最后一行
vim postgresql.conf
port=26000
listen_addresses = '0.0.0.0'
log_directory = 'pg_log'
remote_read_mode=non_authentication
replconninfo1='localhost=10.0.0.100 localport=26001 localheartbeatport=26005 localservice=26004 remotehost=10.0.0.101 remoteport=26001 remoteheartbeatport=26005 remoteservice=26004'

#localhost为主库IP,remotehost为备库IP
#编辑pg_hba.conf配置文件，将相关信息添加到最后一行
vim pg_hba.conf
host all all 0.0.0.0/0 sha256
```

#### 2.以 primary 方式启动数据库

```
gs_ctl start -D /data/openGauss3.0/ -M primary
```

### 四、操作备库

#### 1.将主库的 postgresql.conf 文件传到备库，编辑连接通道信息

```
[omm@OG1 /data/openGauss3.0]$ scp postgresql.conf 10.0.0.101:/data/openGauss3.0
#然后在备库上操作
cd /data/openGauss3.0
vim postgresql.conf
replconninfo1='localhost=10.0.0.101 localport=26001 localheartbeatport=26005 localservice=26004 remotehost=10.0.0.100 remotepo
rt=26001 remoteheartbeatport=26005 remoteservice=26004'
#localhost为备库IP,remotehost为主库IP
```

#### 2.构建主备关系

```
gs_ctl build -D /data/openGauss3.0/ -b full -M standby
```

#### 3.查看主库信息

```
[omm@OG1 /data/openGauss3.0]$ gs_ctl query -D /data/openGauss3.0/
[2022-06-28 12:42:24.316][8790][][gs_ctl]: gs_ctl query ,datadir is /data/openGauss3.0
 HA state:
	local_role                     : Primary
	static_connections             : 1
	db_state                       : Normal
	detail_information             : Normal

 Senders info:
	sender_pid                     : 8784
	local_role                     : Primary
	peer_role                      : Standby
	peer_state                     : Normal
	state                          : Streaming
	sender_sent_location           : 0/4000148
	sender_write_location          : 0/4000148
	sender_flush_location          : 0/4000148
	sender_replay_location         : 0/4000148
	receiver_received_location     : 0/4000148
	receiver_write_location        : 0/4000148
	receiver_flush_location        : 0/4000148
	receiver_replay_location       : 0/4000148
	sync_percent                   : 100%
	sync_state                     : Sync
	sync_priority                  : 1
	sync_most_available            : Off
	channel                        : 10.0.0.100:26001-->10.0.0.101:51926

 Receiver info:
No information
```

查看备库状态信息：

```
[omm@OG2 /data/openGauss3.0]$ gs_ctl query -D /data/openGauss3.0/
[2022-06-28 12:43:10.070][8469][][gs_ctl]: gs_ctl query ,datadir is /data/openGauss3.0
 HA state:
	local_role                     : Standby
	static_connections             : 1
	db_state                       : Normal
	detail_information             : Normal

 Senders info:
No information
 Receiver info:
	receiver_pid                   : 8465
	local_role                     : Standby
	peer_role                      : Primary
	peer_state                     : Normal
	state                          : Normal
	sender_sent_location           : 0/4000268
	sender_write_location          : 0/4000268
	sender_flush_location          : 0/4000268
	sender_replay_location         : 0/4000268
	receiver_received_location     : 0/4000268
	receiver_write_location        : 0/4000268
	receiver_flush_location        : 0/4000268
	receiver_replay_location       : 0/4000268
	sync_percent                   : 100%
	channel                        : 10.0.0.101:51926<--10.0.0.100:26001
```

### 五、验证主备关系

#### 1.主库中创建表

```
gsql -d postgres-p 26000  create table test(id int);
```

#### 2.备库中查看

```
gsql -d postgres -p 26000
openGauss=# \dt
                        List of relations
 Schema | Name | Type  | Owner |             Storage
--------+------+-------+-------+----------------------------------
 public | test | table | omm   | {orientation=row,compression=no}
(1 row)
说明主备状态正常，操作到此结束。
```
