---
title: 'openGauss启动、停止、查看状态、切换主备'

date: '2021-07-21'

category: 'blog'
tags: ['openGauss启动、停止、查看状态、切换主备']

archives: '2021-07'

author: 'Walrus'

summary: 'openGauss启动、停止、查看状态、切换主备'

img: '/zh/blogs/July/title/img2.png'

times: '12:30'
---

# openGauss 启动、停止、查看状态、切换主备<a name="ZH-CN_TOPIC_0000001179212179"></a>

## 1.查看各节点状态<a name="section1087316189198"></a>

```
Last login: Mon Jul 19 17:27:53 CST 2021 on pts/0
[omm@node1 ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

node     node_ip         instance        state            | node     node_ip         instance        state      | node     node_ip         instance          state
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
1  node1 192.168.59.26   6001 opt/huawei/install/data/d1 P Primary Normal | 2  node2 192.168.59.27   6002 opt/huawei/install/data/d2 S Standby Normal | 3  node3 192.168.59.28   6003 opt/huawei/install/data/d3 C Cascade Normal
[omm@node1 ~]$ gs_om -t status -h node2
-----------------------------------------------------------------------

cluster_state             : Normal
redistributing            : No

-----------------------------------------------------------------------

node                      : 2
node_name                 : node2
instance_id               : 6002
node_ip                   : 192.168.59.27
data_path                 : /opt/huawei/install/data/d2
type                      : Datanode
instance_state            : Normal
az_name                   : AZ1
instance_role             : Standby
HA_state                  : Streaming
sender_sent_location      : 0/6845098
sender_write_location     : 0/6845098
sender_flush_location     : 0/6845098
sender_replay_location    : 0/6845098
receiver_received_location: 0/6845098
receiver_write_location   : 0/6845098
receiver_flush_location   : 0/6845098
receiver_replay_location  : 0/6845098
sync_percent              : 100%
sync_state                : Async

-----------------------------------------------------------------------

[omm@node1 ~]$
[omm@node1 ~]$
[omm@node1 ~]$
[omm@node1 ~]$ gs_om -t status -h node3
-----------------------------------------------------------------------

cluster_state             : Normal
redistributing            : No

-----------------------------------------------------------------------

node                      : 3
node_name                 : node3
instance_id               : 6003
node_ip                   : 192.168.59.28
data_path                 : /opt/huawei/install/data/d3
type                      : Datanode
instance_state            : Normal
az_name                   : AZ1
instance_role             : Cascade Standby
HA_state                  : Normal
sender_sent_location      : 0/68451B0
sender_write_location     : 0/68451B0
sender_flush_location     : 0/68451B0
sender_replay_location    : 0/68451B0
receiver_received_location: 0/68451B0
receiver_write_location   : 0/68451B0
receiver_flush_location   : 0/68451B0
receiver_replay_location  : 0/68451B0
sync_percent              : 100%
sync_state                : Async
upstream_nodeIp           : 192.168.59.27:15401

-----------------------------------------------------------------------

[omm@node1 ~]$ gs_om -t status -h node1
-----------------------------------------------------------------------

cluster_state             : Normal
redistributing            : No

-----------------------------------------------------------------------

node                      : 1
node_name                 : node1
instance_id               : 6001
node_ip                   : 192.168.59.26
data_path                 : /opt/huawei/install/data/d1
type                      : Datanode
instance_state            : Normal
az_name                   : AZ1
static_connections        : 2
HA_state                  : Normal
instance_role             : Primary

-----------------------------------------------------------------------
```

## 2.关闭、启动、重启 openGauss 群集<a name="section17621133022015"></a>

```
[omm@node1 ~]$ gs_om -t stop
Stopping cluster.
=========================================
Successfully stopped cluster.
=========================================
End stop cluster.
[omm@node1 ~]$ gs_om -t status
-----------------------------------------------------------------------

cluster_name    : Cluster_openGauss
cluster_state   : Unavailable
redistributing  : No

-----------------------------------------------------------------------
[omm@node1 ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Unavailable
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

node     node_ip       instance         state           | node     node_ip        instance         state            | node     node_ip         instance        state
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
1  node1 192.168.59.26   6001 opt/huawei/install/data/d1 P Down    Manually stopped | 2  node2 192.168.59.27   6002 opt/huawei/install/data/d2 S Down    Manually stopped | 3  node3 192.168.59.28   6003 opt/huawei/install/data/d3 C Down    Manually stopped
[omm@node1 ~]$ gs_om -t start
Starting cluster.
=========================================
[SUCCESS] node1
2021-07-20 17:53:25.332 60f69d15.1 [unknown] 139907310331648 [unknown] 0 dn_6001_6002 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (16 Mbytes) or shared memory (1496 Mbytes) is larger.
[SUCCESS] node2
2021-07-20 17:53:28.046 60f69d17.1 [unknown] 140135379003136 [unknown] 0 dn_6001_6002 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (16 Mbytes) or shared memory (1496 Mbytes) is larger.
[SUCCESS] node3
2021-07-20 17:53:30.896 60f69d1a.1 [unknown] 139820708103936 [unknown] 0 dn_6001_6002 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (16 Mbytes) or shared memory (1496 Mbytes) is larger.
=========================================
Successfully started.
[omm@node1 ~]$ gs_om -t status
-----------------------------------------------------------------------

cluster_name    : Cluster_openGauss
cluster_state   : Normal
redistributing  : No
-----------------------------------------------------------------------
[omm@node1 ~]$
[omm@node1 ~]$ gs_om -t stop & gs_om -t start
[1] 7772
Stopping cluster.
=========================================
Starting cluster.
=========================================
[SUCCESS] node1
2021-07-20 17:54:48.867 60f69d68.1 [unknown] 139885120349952 [unknown] 0 dn_6001_6002 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (16 Mbytes) or shared memory (1496 Mbytes) is larger.
Successfully stopped cluster.
=========================================
End stop cluster.
[SUCCESS] node2
2021-07-20 17:54:51.576 60f69d6b.1 [unknown] 140327226377984 [unknown] 0 dn_6001_6002 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (16 Mbytes) or shared memory (1496 Mbytes) is larger.
[SUCCESS] node3
2021-07-20 17:54:53.604 60f69d6d.1 [unknown] 140109769361152 [unknown] 0 dn_6001_6002 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (16 Mbytes) or shared memory (1496 Mbytes) is larger.
=========================================
Successfully started.
[1]+  Done                    gs_om -t stop
[omm@node1 ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

node     node_ip         instance                            state            | node     node_ip         instance                            state            | node     node_ip         instance                            state
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
1  node1 192.168.59.26   6001 opt/huawei/install/data/d1 P Standby Normal | 2  node2 192.168.59.27   6002 opt/huawei/install/data/d2 S Primary Normal | 3  node3 192.168.59.28   6003 opt/huawei/install/data/d3 C Cascade Normal
```

## 3. 切换主备<a name="section197031047192118"></a>

登录备机，在 omm 用户下操作。

```
[omm@node1 ~]$ gs_ctl switchover -D /opt/huawei/install/data/d1/
[2021-07-20 17:59:51.465][9769][][gs_ctl]: gs_ctl switchover ,datadir is opt/huawei/install/data/d1
[2021-07-20 17:59:51.465][9769][][gs_ctl]: switchover term (1)
[2021-07-20 17:59:51.474][9769][][gs_ctl]: waiting for server to switchover.........
[2021-07-20 17:59:57.527][9769][][gs_ctl]: done
[2021-07-20 17:59:57.527][9769][][gs_ctl]: switchover completed (/opt/huawei/install/data/d1)
[omm@node1 ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

node     node_ip         instance     state            | node     node_ip         instance      state            | node     node_ip         instance                state
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
1  node1 192.168.59.26   6001 opt/huawei/install/data/d1 P Primary Normal | 2  node2 192.168.59.27   6002 opt/huawei/install/data/d2 S Standby Normal | 3  node3 192.168.59.28   6003 opt/huawei/install/data/d3 C Cascade Normal
[omm@node1 ~]$ gs_om -t status -h node1
-----------------------------------------------------------------------

cluster_state             : Normal
redistributing            : No

-----------------------------------------------------------------------

node                      : 1
node_name                 : node1
instance_id               : 6001
node_ip                   : 192.168.59.26
data_path                 : /opt/huawei/install/data/d1
type                      : Datanode
instance_state            : Normal
az_name                   : AZ1
static_connections        : 2
HA_state                  : Normal
instance_role             : Primary

-----------------------------------------------------------------------

[omm@node1 ~]$ gs_om -t status -h node2
-----------------------------------------------------------------------

cluster_state             : Normal
redistributing            : No

-----------------------------------------------------------------------

node                      : 2
node_name                 : node2
instance_id               : 6002
node_ip                   : 192.168.59.27
data_path                 : /opt/huawei/install/data/d2
type                      : Datanode
instance_state            : Normal
az_name                   : AZ1
instance_role             : Standby
HA_state                  : Streaming
sender_sent_location      : 0/68475E0
sender_write_location     : 0/68475E0
sender_flush_location     : 0/68475E0
sender_replay_location    : 0/68475E0
receiver_received_location: 0/68475E0
receiver_write_location   : 0/68475E0
receiver_flush_location   : 0/68475E0
receiver_replay_location  : 0/68475E0
sync_percent              : 100%
sync_state                : Async

-----------------------------------------------------------------------

[omm@node1 ~]$ gs_om -t status -h node3
-----------------------------------------------------------------------

cluster_state             : Normal
redistributing            : No

-----------------------------------------------------------------------

node                      : 3
node_name                 : node3
instance_id               : 6003
node_ip                   : 192.168.59.28
data_path                 : /opt/huawei/install/data/d3
type                      : Datanode
instance_state            : Normal
az_name                   : AZ1
instance_role             : Cascade Standby
HA_state                  : Normal
sender_sent_location      : 0/68475E0
sender_write_location     : 0/68475E0
sender_flush_location     : 0/68475E0
sender_replay_location    : 0/68475E0
receiver_received_location: 0/68475E0
receiver_write_location   : 0/68475E0
receiver_flush_location   : 0/68475E0
receiver_replay_location  : 0/68475E0
sync_percent              : 100%
sync_state                : Async
upstream_nodeIp           : 192.168.59.27:15401

-----------------------------------------------------------------------
```
