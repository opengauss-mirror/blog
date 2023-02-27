---
title: 'openGauss修改服务器IP'

date: '2022-04-02'

category: 'blog'
tags: ['openGauss修改服务器IP']

archives: '2022-04'

author: '李宏达'

summary: 'openGauss修改服务器IP'

img: '/zh/blogs/lihongda/title/img39.png'

times: '10:21'
---

# openGauss 修改服务器 IP

## 一 、测试环境概述

### 1. 机器配置

- 配置截图

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220120-4af715e1-5acd-480e-bb55-ebb6ca39db6b.png'>

- 两台华为云 ECS，kc1.xlarge.4，规格 4c/16g，openEuler 20.03 系统。

## 二、安装 openGauss

略

## 三 、修改内网地址

### 1. 修改 ECS IP

- 修改 IP 前要解绑 NAT，关闭服务器。

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220120-a7023299-d549-4938-bb5c-7ad7c1072ec7.png'>

- 修改 IP

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220120-66f736f3-7f49-49b0-bfda-0d1c5f24609e.png'>

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220120-23eab59b-c7cd-4c57-a26f-769891339c0e.png'>

- 另一台同样

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220120-c3c39dfb-97db-4ce1-9056-aee9fea6f66b.png'>

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220120-5843c6be-af18-4615-838c-1ffb31ff7d10.png'>

### 2. 开机

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220120-5c40c9ab-4c7f-46de-bfc8-f025a4429e4c.png'>

### 3. 恢复 NAT

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220120-a6dc3156-5f15-45a0-ac2b-28c58ecff3d5.png'>

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220120-e8c9fb70-ed6c-4482-9218-794eb98e40b5.png'>

## 四、数据库端操作

### 1. 直接启动数据库

- 发现报错

```
[omm@ecs-0001 ~]$ gs_om -t start
Starting cluster.
=========================================
[GAUSS-51400] : Failed to execute the command: scp ecs-0002:/appdata/app/opengauss_f892ccb7/bin/cluster_dynamic_config /appdata/app/opengauss_f892ccb7/bin/cluster_dynamic_config_ecs-0002. Error:
ssh: connect to host ecs-0002 port 22: No route to host
```

### 2. 修改配置文件

- postgresql.conf
- pg_hba.conf
- clusterconfig.xml （用于生成 static configuration）
- /etc/hosts

```
[root@ecs-0001 ~]# sed -i 's/192.168.0.10/192.168.0.30/g' /appdata/data/postgresql.conf /appdata/data/pg_hba.conf /opt/software/opengauss/clusterconfig.xml /etc/hosts
[root@ecs-0001 ~]# sed -i 's/192.168.0.20/192.168.0.40/g' /appdata/data/postgresql.conf /appdata/data/pg_hba.conf /opt/software/opengauss/clusterconfig.xml /etc/hosts
[root@ecs-0002 ~]# sed -i 's/192.168.0.10/192.168.0.30/g' /appdata/data/postgresql.conf /appdata/data/pg_hba.conf /opt/software/opengauss/clusterconfig.xml /etc/hosts
[root@ecs-0002 ~]# sed -i 's/192.168.0.20/192.168.0.40/g' /appdata/data/postgresql.conf /appdata/data/pg_hba.conf /opt/software/opengauss/clusterconfig.xml /etc/hosts
```

### 3. 生成集群文件并发送到备库

- 自动发送到备库

```
[omm@ecs-0001 ~]$ gs_om -t generateconf -X /opt/software/opengauss/clusterconfig.xml --distribute
Generating static configuration files for all nodes.
Creating temp directory to store static configuration files.
Successfully created the temp directory.
Generating static configuration files.
Successfully generated static configuration files.
Static configuration files for all nodes are saved in /appdata/app/tools/script/static_config_files.
Distributing static configuration files to all nodes.
Successfully distributed static configuration files.
```

### 4. 启动数据库验证

- 主库启动

```
[omm@ecs-0001 ~]$ gs_om -t start
Starting cluster.
=========================================
[SUCCESS] ecs-0001
2022-01-20 12:45:15.721 [unknown] [unknown] localhost 281457640472592 0 0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (16 Mbytes) or shared memory (8004 Mbytes) is larger.
[SUCCESS] ecs-0002
2022-01-20 12:45:18.071 [unknown] [unknown] localhost 281465901482000 0 0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (16 Mbytes) or shared memory (8004 Mbytes) is larger.
=========================================
Successfully started.
```

- 备库查看状态

```
[omm@ecs-0002 ~]$ gs_om -t status --all
-----------------------------------------------------------------------

cluster_state             : Normal
redistributing            : No

-----------------------------------------------------------------------

node                      : 1
node_name                 : ecs-0001
instance_id               : 6001
node_ip                   : 192.168.0.30
data_path                 : /appdata/data
type                      : Datanode
instance_state            : Normal
az_name                   : AZ1
static_connections        : 1
HA_state                  : Normal
instance_role             : Primary

-----------------------------------------------------------------------

node                      : 2
node_name                 : ecs-0002
instance_id               : 6002
node_ip                   : 192.168.0.40
data_path                 : /appdata/data
type                      : Datanode
instance_state            : Normal
az_name                   : AZ1
instance_role             : Standby
HA_state                  : Streaming
sender_sent_location      : 0/452D3E8
sender_write_location     : 0/452D3E8
sender_flush_location     : 0/452D3E8
sender_replay_location    : 0/452D3E8
receiver_received_location: 0/452D3E8
receiver_write_location   : 0/452D3E8
receiver_flush_location   : 0/452D3E8
receiver_replay_location  : 0/452D3E8
sync_percent              : 100%
sync_state                : Sync

-----------------------------------------------------------------------
```
