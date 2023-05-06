+++
title = "资源池化支持同城dorado双集群切换"
date = "2023-04-01"
tags = ["资源池化支持同城dorado双集群切换"]
archives = "2023-04-01"
author = "shirley_zhengx"
summary = "资源池化支持同城dorado双集群切换"
img = "/zh/post/zhengxue/title/img1.png"
times = "9:30"
+++


<!-- TOC -->
- [1. 集群间切换](#1.集群间切换)
  - [1.1.主备集群状态](#1.1.主备集群状态)
  - [1.2.环境配置](#1.2.环境配置)
- [2. 主集群内切换](#2.主集群内切换)
  - [2.1.创建lun](#2.1.创建lun)
  - [2.2.下载源码编译](#2.2.下载源码编译)
  - [2.3.环境变量](#2.3.环境变量) 
- [3. 备集群内切换](#3.备集群内切换)
  - [3.1.集群状态查询](#3.1.集群状态查询)
  - [3.2.主集群一写多读](#3.2.主集群一写多读)
  - [3.2.备集群只读](#3.2.备集群只读)

<!-- /TOC -->



# 资源池化支持同城dorado双集群切换

资源池化支持同城dorado双集群部署方式：dd模拟(手动部署+无cm)、cm模拟(手动部署dd模拟+有cm)、磁阵(手动部署)、集群管理工具部署
          

## 1.集群间切换

    基于《资源池化+同城dorado双集群》部署方式，集群间切换设计如下：

### &nbsp;&nbsp;1.1.主备集群状态
<table>
<tbody>
    <tr>
        <td>集群中心</td>
        <td>端</td>
        <td>节点类型</td>
        <td>local role</td>
        <td>run mode</td>
    </tr>
    <tr>
        <td rowspan='2'>生产中心</td>
        <td rowspan='2'>主端</td>
        <td>主节点0</td>
        <td>primary</td>
        <td>primary (资源池化+传统主)</td>
    </tr>
        <td>备节点1</td>
        <td>standby</td>
        <td>normal (资源池化+传统单机)</td>
    <tr>
        <td rowspan='2'>容灾中心</td>
        <td rowspan='2'>备端</td>
        <td>首备节点0</td>
        <td>standby</td>
        <td>standby(资源池化+传统备)</td>
    </tr>
        <td>从备节点1</td>
        <td>standby</td>
        <td>normal (资源池化+传统单机)</td>
</tbody>
</table>

local role从系统函数pg_stat_get_stream_replications中获取的local_role参数：
```
openGauss=# select * from pg_stat_get_stream_replications();
 local_role | static_connections | db_state | detail_information
------------+--------------------+----------+--------------------
 Primary    |                  1 | Normal   | Normal
(1 row)
```

run mode 指数据库内核运行模式是primary还是standby还是normal，是t_thrd.postmaster_cxt.HaShmData->current_mode或t_thrd.xlog_cxt.server_mode参数指代的主备运行模式类型

### &nbsp;&nbsp;1.2.failover
&emsp;基于cm模拟部署方式，因此没有管控平台切换同步复制对方向的操作。
&emsp;双集群间failover即主集群故障，备集群升为主集群的过程，操作过程如下：

(1) kill 主集群
&emsp;将主集群节点全部kill掉
(2) stop 备集群
```
gs_ctl stop -D /home/omm/ss_hatest1/dn0
gs_ctl stop -D /home/omm/ss_hatest1/dn1
```
(3) 备集群设置cluster_run_mode
```
gs_guc set -Z datanode -D /home/omm/ss_hatest1/dn0 -c "cluster_run_mode=cluster_primary"
```
(4) 以主集群模式重启备集群的节点
```
gs_ctl start -D /home/omm/ss_hatest1/dn0 -M primary
gs_ctl start -D /home/omm/ss_hatest1/dn1
```
(5) 查询新主集群
```
gs_ctl query -D /home/omm/ss_hatest1/dn0
```

### &nbsp;&nbsp;1.2.switchover
&emsp;基于cm模拟部署方式，因此没有管控平台切换同步复制对方向的操作。
&emsp;双集群间switchover即主集群降为备集群，备集群升为主集群的过程，操作过程如下：

(1) stop 主集群
```
gs_ctl stop -D /home/omm/ss_hatest/dn0
gs_ctl stop -D /home/omm/ss_hatest/dn1
```
(2) stop 备集群
```
gs_ctl stop -D /home/omm/ss_hatest1/dn0
gs_ctl stop -D /home/omm/ss_hatest1/dn1
```
(3) 备集群设置cluster_run_mode
```
gs_guc set -Z datanode -D /home/omm/ss_hatest1/dn0 -c "cluster_run_mode=cluster_primary"
```
(4) 以主集群模式重启备集群的节点
```
gs_ctl start -D /home/omm/ss_hatest1/dn0 -M primary
gs_ctl start -D /home/omm/ss_hatest1/dn1
```
(5) 查询新主集群
```
gs_ctl query -D /home/omm/ss_hatest1/dn0
```
(6) 主集群设置cluster_run_mode=cluster_standby
```
gs_guc set -Z datanode -D /home/zx/ss_hatest/dn0 -c "cluster_run_mode=cluster_standby"
```
(7) 以备集群模式重启备集群的节点
```
gs_ctl start -D /home/omm/ss_hatest/dn0 -M standby
gs_ctl start -D /home/omm/ss_hatest/dn1
```
(8) 查询新备集群
```
gs_ctl query -D /home/omm/ss_hatest/dn0
```

## 2. 主集群内切换


### &nbsp;&nbsp;2.1.failover
&emsp;基于cm模拟部署方式
&emsp;主集群内failover即主集群主节点降为备节点，备节点升为主节点的过程，操作过程如下：

&emsp;(1) 检查节点状态
&emsp;查询状态
```
主集群主节点0
gs_ctl query -D /home/omm/ss_hatest/dn0
HA state:
        local_role                     : Primary
        static_connections             : 1
        db_state                       : Normal
        detail_information             : Normal

 Senders info:
        sender_pid                     : 1456376
        local_role                     : Primary
        peer_role                      : StandbyCluster_Standby
        peer_state                     : Normal
        state                          : Streaming
        sender_sent_location           : 2/5C8
        sender_write_location          : 2/5C8
        sender_flush_location          : 2/5C8
        sender_replay_location         : 2/5C8
        receiver_received_location     : 2/5C8
        receiver_write_location        : 2/5C8
        receiver_flush_location        : 2/5C8
        receiver_replay_location       : 2/5C8
        sync_percent                   : 100%
        sync_state                     : Async
        sync_priority                  : 0
        sync_most_available            : Off
        channel                        : 127.0.0.1:6600-->127.0.0.1:43350

 Receiver info:
No information

主集群备节点1
gs_ctl query -D /home/omm/ss_hatest/dn1
HA state:
        local_role                     : Standby
        static_connections             : 0
        db_state                       : Normal
        detail_information             : Normal

 Senders info:
No information
 Receiver info:
No information

备集群首备节点0
gs_ctl query -D /home/omm/ss_hatest1/dn0
HA state:
        local_role                     : Standby
        static_connections             : 1
        db_state                       : Normal
        detail_information             : Normal

 Senders info:
No information
 Receiver info:
        receiver_pid                   : 1901181
        local_role                     : Standby
        peer_role                      : Primary
        peer_state                     : Normal
        state                          : Normal
        sender_sent_location           : 2/A458
        sender_write_location          : 2/A458
        sender_flush_location          : 2/A458
        sender_replay_location         : 2/A458
        receiver_received_location     : 2/A458
        receiver_write_location        : 2/A458
        receiver_flush_location        : 2/A458
        receiver_replay_location       : 2/A458
        sync_percent                   : 100%
        channel                        : 127.0.0.1:41952<--127.0.0.1:6600

备集群备节点1
gs_ctl query -D /home/omm/ss_hatest1/dn1
HA state:
        local_role                     : Standby
        static_connections             : 0
        db_state                       : Normal
        detail_information             : Normal

 Senders info:
No information
 Receiver info:
No information

```

&emsp;(2) 配置参数
&emsp;<font color='red'>主集群节点的postgresql.conf文件</font>
```
主集群主节点0
port = 6600
xlog_file_path = '/home/zx/ss_hatest/dorado_shared_disk'
xlog_lock_file_path = '/home/zx/ss_hatest/shared_lock_primary'
application_name = 'dn_master_0'
cross_cluster_replconninfo1='localhost=127.0.0.1 localport=6600 remotehost=127.0.0.1 remoteport=9600'
cross_cluster_replconninfo2='localhost=127.0.0.1 localport=6600 remotehost=127.0.0.1 remoteport=9700'
cluster_run_mode = 'cluster_primary'
ha_module_debug = off
ss_log_level = 255
ss_log_backup_file_count = 100
ss_log_max_file_size = 1GB

主集群备节点1
port = 6700
xlog_file_path = '/home/zx/ss_hatest/dorado_shared_disk'
xlog_lock_file_path = '/home/zx/ss_hatest/shared_lock_primary'
application_name = 'dn_master_1'
cross_cluster_replconninfo1='localhost=127.0.0.1 localport=6700 remotehost=127.0.0.1 remoteport=9600'
cross_cluster_replconninfo2='localhost=127.0.0.1 localport=6700 remotehost=127.0.0.1 remoteport=9700'
cluster_run_mode = 'cluster_primary'
ha_module_debug = off
ss_log_level = 255
ss_log_backup_file_count = 100
ss_log_max_file_size = 1GB
```
&emsp;<font color='red'>备集群节点的postgresql.conf文件</font>
```
备集群首备节点0
port = 9600
xlog_file_path = '/home/zx/ss_hatest/dorado_shared_disk'
xlog_lock_file_path = '/home/zx/ss_hatest/shared_lock_primary'
application_name = 'dn_standby_0'
cross_cluster_replconninfo1='localhost=127.0.0.1 localport=9600 remotehost=127.0.0.1 remoteport=6600'
cross_cluster_replconninfo2='localhost=127.0.0.1 localport=9600 remotehost=127.0.0.1 remoteport=6700'
cluster_run_mode = 'cluster_standby'
ha_module_debug = off
ss_log_level = 255
ss_log_backup_file_count = 100
ss_log_max_file_size = 1GB

备集群备节点1
port = 9700
xlog_file_path = '/home/zx/ss_hatest/dorado_shared_disk'
xlog_lock_file_path = '/home/zx/ss_hatest/shared_lock_primary'
application_name = 'dn_standby_1'
cross_cluster_replconninfo1='localhost=127.0.0.1 localport=9700 remotehost=127.0.0.1 remoteport=6600'
cross_cluster_replconninfo2='localhost=127.0.0.1 localport=9700 remotehost=127.0.0.1 remoteport=6700'
cluster_run_mode = 'cluster_standby'
ha_module_debug = off
ss_log_level = 255
ss_log_backup_file_count = 100
ss_log_max_file_size = 1GB
```

&emsp;双集群所有节点必须提前都配置xlog_file_path、xlog_lock_file_path、cross_cluster_replconninfo1、cluster_run_mode这些容灾关系建立的参数

&emsp;(3) 导入用于切换的环境变量CM_CONFIG_PATH
```
export CM_CONFIG_PATH=/opt/omm/openGauss-server/src/test/ss/cm_config.ini
```

&emsp;(4) 模拟failover
+ 当前节点0是主节点，kill -9 pid (pid是主节点0的进程号)
+ 修改 cm_config.ini
  ```
  REFORMER_ID = 1
  BITMAP_ONLINE = 2 
  ```

**说明**：模拟主节点0故障，REFORMER_ID模拟reform锁被备节点1抢到，即为将要做failover的节点，BITMAP_ONLINE模拟cm获取的在线节点是节点1(bitmap = 2 = 0b10)

### &nbsp;&nbsp;2.1.failover
&emsp;基于cm模拟部署方式
&emsp;主集群内failover即主集群主节点降为备节点，备节点升为主节点的过程，操作过程如下：

&emsp;(1) 检查节点状态
同failover检查一致

&emsp;(2) 配置参数
同failover配置一致

&emsp;(3) 执行switchover命令

```
[omm@nodename dn0]$ gs_ctl switchover -D /home/zx/ss_hatest/dn1
[2023-04-24 15:49:04.785][3815633][][gs_ctl]: gs_ctl switchover ,datadir is /home/zx/ss_hatest/dn1
[2023-04-24 15:49:04.786][3815633][][gs_ctl]: switchover term (1)
[2023-04-24 15:49:04.954][3815633][][gs_ctl]: waiting for server to switchover....[2023-04-24 15:49:06.122][3815633][][gs_ctl]: Getting state from gaussdb.state!
.[2023-04-24 15:49:07.123][3815633][][gs_ctl]: Getting state from gaussdb.state!
.[2023-04-24 15:49:08.125][3815633][][gs_ctl]: Getting state from gaussdb.state!
.[2023-04-24 15:49:09.126][3815633][][gs_ctl]: Getting state from gaussdb.state!
.[2023-04-24 15:49:10.198][3815633][][gs_ctl]: Getting state from gaussdb.state!
...
[2023-04-24 15:49:13.353][3815633][][gs_ctl]: done
[2023-04-24 15:49:13.353][3815633][][gs_ctl]: switchover completed (/home/zx/ss_hatest/dn1)
```

**说明**：/home/zx/ss_hatest/dn1是主集群备节点1的数据库，做switchover将主集群主节点0降备，将主集群备节点1升主

查看目录/opt/omm/openGauss-server/src/test/ss/：
```
[omm@nodename ss]$ ll
总用量 56
-rwxrwxrwx 1 zx zx 3749  4月 24 14:29 build_ss_database_common.sh
-rwxrwxrwx 1 zx zx 2952  4月 24 14:29 build_ss_database.sh
-rw------- 1 zx zx   34  4月 24 15:49 cm_config.ini
-rw------- 1 zx zx   33  4月 24 15:49 cm_config.ini_bak
```
cm_config.ini是switchcover后的新生成的集群列表，主节点REFORMER_ID是1
```
BITMAP_ONLINE = 3
REFORMER_ID = 1
```

cm_config.ini_bak是switchcover前的集群列表，主节点REFORMER_ID是0
```
REFORMER_ID = 0
BITMAP_ONLINE = 3
```

&emsp;(4) 双集群状态查询
```
主集群备节点0
[omm@nodename dn0]$ gs_ctl query -D /home/zx/ss_hatest/dn0
[2023-04-24 15:52:33.134][3862235][][gs_ctl]: gs_ctl query ,datadir is /home/zx/ss_hatest/dn0
 HA state:
        local_role                     : Standby
        static_connections             : 2
        db_state                       : Normal
        detail_information             : Normal

 Senders info:
No information
 Receiver info:
No information

主集群主节点1
[zx@node1host54 dn0]$ gs_ctl query -D /home/zx/ss_hatest/dn1
[2023-04-24 15:52:35.777][3862851][][gs_ctl]: gs_ctl query ,datadir is /home/zx/ss_hatest/dn1
 HA state:
        local_role                     : Primary
        static_connections             : 2
        db_state                       : Normal
        detail_information             : Normal

 Senders info:
        sender_pid                     : 3817397
        local_role                     : Primary
        peer_role                      : StandbyCluster_Standby
        peer_state                     : Normal
        state                          : Streaming
        sender_sent_location           : 2/43EA678
        sender_write_location          : 2/43EA678
        sender_flush_location          : 2/43EA678
        sender_replay_location         : 2/43EA678
        receiver_received_location     : 2/43EA678
        receiver_write_location        : 2/43EA678
        receiver_flush_location        : 2/43EA678
        receiver_replay_location       : 2/43EA678
        sync_percent                   : 100%
        sync_state                     : Async
        sync_priority                  : 0
        sync_most_available            : Off
        channel                        : 127.0.0.1:9700-->127.0.0.1:37904

 Receiver info:
No information

备集群首备节点0
[zx@node1host54 pg_log]$ gs_ctl query -D /home/zx/ss_hatest1/dn0
[2023-04-24 15:53:44.305][3878378][][gs_ctl]: gs_ctl query ,datadir is /home/zx/ss_hatest1/dn0
 HA state:
        local_role                     : Standby
        static_connections             : 2
        db_state                       : Normal
        detail_information             : Normal

 Senders info:
No information
 Receiver info:
        receiver_pid                   : 3816277
        local_role                     : Standby
        peer_role                      : Primary
        peer_state                     : Normal
        state                          : Normal
        sender_sent_location           : 2/43EA798
        sender_write_location          : 2/43EA798
        sender_flush_location          : 2/43EA798
        sender_replay_location         : 2/43EA798
        receiver_received_location     : 2/43EA798
        receiver_write_location        : 2/43EA798
        receiver_flush_location        : 2/43EA798
        receiver_replay_location       : 2/43EA798
        sync_percent                   : 100%
        channel                        : 127.0.0.1:37904<--127.0.0.1:9700

备集群从备节点1
[omm@nodename pg_log]$ gs_ctl query -D /home/zx/ss_hatest1/dn1
[2023-04-24 15:53:46.779][3879076][][gs_ctl]: gs_ctl query ,datadir is /home/zx/ss_hatest1/dn1
 HA state:
        local_role                     : Standby
        static_connections             : 1
        db_state                       : Normal
        detail_information             : Normal

 Senders info:
No information
 Receiver info:
No information
```

**说明**：switchover成功后，备集群的首备节点0与主集群新主节点1容灾关系自动连接成功，同步复制功能正常，备集群首备回放正常

***Notice:不推荐直接用于生产环境***
