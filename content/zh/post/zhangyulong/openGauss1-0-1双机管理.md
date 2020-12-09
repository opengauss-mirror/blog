+++

title = "openGauss1.0.1双机管理" 

date = "2020-12-01" 

tags = ["openGauss1.0.1双机管理"] 

archives = "2020-12" 

author = "张玉龙" 

summary = "openGauss1.0.1双机管理"

img = "/zh/post/zhangyulong/title/title.png" 

times = "10:30"

+++

# openGauss1.0.1双机管理<a name="ZH-CN_TOPIC_0293240563"></a>

## 停止openGauss \(主节点操作\)<a name="section1433718237162"></a>

```
[omm@enmo ~]$ gs_om -t stop
Stopping cluster.
=========================================
Successfully stopped cluster.
=========================================
End stop cluster.
```

## 启动openGauss \(主节点操作\)<a name="section336714344177"></a>

```
[omm@enmo ~]$ gs_om -t start
Starting cluster.
=========================================
=========================================
Successfully started.
```

说明： 双机启动必须以双机模式启动, 若中间过程以单机模式启动, 则必须用gs\_ctl build修复才能恢复双机关系。

**用gs\_ctl build修复双机关系，需要在备节点执行命令**

```
[omm@backup dn]$ gs_ctl build -D /opt/enmo/openGauss/101/data/dn -b full
[2020-10-26 17:59:34.741][26963][][gs_ctl]: gs_ctl full build ,datadir is -D "/opt/enmo/openGauss/101/data/dn" 
waiting for server to shut down.... done
server stopped
[2020-10-26 17:59:35.787][26963][][gs_ctl]: set gaussdb state file when full build:db state(BUILDING_STATE), server mode(STANDBY_MODE), build mode(FULL_BUILD).
gs_ctl: set the connection xc_maintenance_mode to on error.
[2020-10-26 17:59:36.116][26963][dn_6001_6002][gs_ctl]: check connect to server success
[2020-10-26 17:59:36.265][26963][dn_6001_6002][gs_ctl]: clear old target dir success
[2020-10-26 17:59:36.296][26963][dn_6001_6002][gs_ctl]: connect to server success, build started.
[2020-10-26 17:59:36.296][26963][dn_6001_6002][gs_ctl]: create build tag file success
[2020-10-26 17:59:36.297][26963][dn_6001_6002][gs_ctl]: get system identifier success
[2020-10-26 17:59:36.297][26963][dn_6001_6002][gs_ctl]: receiving and unpacking files...
[2020-10-26 17:59:36.297][26963][dn_6001_6002][gs_ctl]: create backup label success
[2020-10-26 17:59:38.807][26963][dn_6001_6002][gs_ctl]: xlog start point: 0/304B1A8
[2020-10-26 17:59:38.808][26963][dn_6001_6002][gs_ctl]: begin build tablespace list
[2020-10-26 17:59:38.808][26963][dn_6001_6002][gs_ctl]: finish build tablespace list
[2020-10-26 17:59:38.808][26963][dn_6001_6002][gs_ctl]: begin get xlog by xlogstream
[2020-10-26 17:59:38.808][26963][dn_6001_6002][gs_ctl]: starting background WAL receiver
[2020-10-26 17:59:38.808][26963][dn_6001_6002][gs_ctl]: starting walreceiver
[2020-10-26 17:59:38.808][26963][dn_6001_6002][gs_ctl]: begin receive tar files
[2020-10-26 17:59:38.809][26963][dn_6001_6002][gs_ctl]: receiving and unpacking files...
[2020-10-26 17:59:38.864][26963][dn_6001_6002][gs_ctl]:  check identify system success
[2020-10-26 17:59:38.865][26963][dn_6001_6002][gs_ctl]:  send START_REPLICATION 0/3000000 success
 keepalive message is received
[2020-10-26 17:59:39.256][26963][dn_6001_6002][gs_ctl]: finish receive tar files
[2020-10-26 17:59:39.256][26963][dn_6001_6002][gs_ctl]: xlog end point: 0/4000160
[2020-10-26 17:59:39.256][26963][dn_6001_6002][gs_ctl]: waiting for background process to finish streaming...
[2020-10-26 17:59:39.428][26963][dn_6001_6002][gs_ctl]: fetching MOT checkpoint
[2020-10-26 17:59:39.476][26963][dn_6001_6002][gs_ctl]: build dummy dw file success
[2020-10-26 17:59:39.476][26963][dn_6001_6002][gs_ctl]: rename build status file success
[2020-10-26 17:59:39.476][26963][dn_6001_6002][gs_ctl]: build completed(/opt/enmo/openGauss/101/data/dn).
[2020-10-26 17:59:39.567][26963][dn_6001_6002][gs_ctl]: waiting for server to start...
.0 LOG:  The core dump path in core_pattern is an invalid directory.
0 [BACKEND] LOG:  Begin to start openGauss Database.
2020-10-26 17:59:39.754 5f969e0b.1 [unknown] 140698244056128 [unknown] 0 dn_6001_6002 DB001 0 [REDO] LOG:  Recovery parallelism, cpu count = 4, max = 4, actual = 4
2020-10-26 17:59:39.754 5f969e0b.1 [unknown] 140698244056128 [unknown] 0 dn_6001_6002 DB001 0 [REDO] LOG:  ConfigRecoveryParallelism, true_max_recovery_parallelism:4, max_recovery_parallelism:4
2020-10-26 17:59:39.754 5f969e0b.1 [unknown] 140698244056128 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG:  Transparent encryption disabled.
2020-10-26 17:59:39.783 5f969e0b.1 [unknown] 140698244056128 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG:  InitNuma numaNodeNum: 1 numa_distribute_mode: none inheritThreadPool: 0.
2020-10-26 17:59:39.783 5f969e0b.1 [unknown] 140698244056128 [unknown] 0 dn_6001_6002 01000 0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (4215 Mbytes) is larger.
2020-10-26 17:59:39.988 5f969e0b.1 [unknown] 140698244056128 [unknown] 0 dn_6001_6002 00000 0 [CACHE] LOG:  set data cache  size(805306368)
2020-10-26 17:59:40.244 5f969e0b.1 [unknown] 140698244056128 [unknown] 0 dn_6001_6002 00000 0 [CACHE] LOG:  set metadata cache  size(268435456)
.2020-10-26 17:59:45.710 5f969e0b.1 [unknown] 140698244056128 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG:  gaussdb: fsync file "/opt/enmo/openGauss/101/data/dn/gaussdb.state.temp" success
2020-10-26 17:59:45.711 5f969e0b.1 [unknown] 140698244056128 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG:  create gaussdb state file success: db state(STARTING_STATE), server mode(Standby)
2020-10-26 17:59:45.735 5f969e0b.1 [unknown] 140698244056128 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG:  max_safe_fds = 976, usable_fds = 1000, already_open = 14
2020-10-26 17:59:45.736 5f969e0b.1 [unknown] 140698244056128 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG:  The core dump path in core_pattern is an invalid directory.
2020-10-26 17:59:45.764 5f969e0b.1 [unknown] 140698244056128 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG:  Success to start openGauss Database. If you specify "&", please press any key to exit...
.
[2020-10-26 17:59:47.625][26963][dn_6001_6002][gs_ctl]:  done
[2020-10-26 17:59:47.625][26963][dn_6001_6002][gs_ctl]: server started (/opt/enmo/openGauss/101/data/dn)
```

## 查看整个openGauss的状态<a name="section1027110137205"></a>

```
[omm@enmo ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

node      node_ip         instance                                state            | node      node_ip         instance                                state
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
1  enmo   192.168.6.7     6001 /opt/enmo/openGauss/101/data/dn P Primary Normal | 2  backup 192.168.6.8     6002 /opt/enmo/openGauss/101/data/dn S Standby Normal
```

## 查看某个主机上实例的状态<a name="section15880243182618"></a>

```
[omm@enmo ~]$ gs_om -t status -h backup
-----------------------------------------------------------------------

cluster_state             : Normal
redistributing            : No

-----------------------------------------------------------------------

node                      : 2
node_name                 : backup

node                      : 2
instance_id               : 6002
node_ip                   : 192.168.6.8
data_path                 : /opt/enmo/openGauss/101/data/dn
type                      : Datanode
instance_state            : Standby
static_connections        : 1
HA_state                  : Normal
reason                    : Normal
sender_sent_location      : 0/5000C88
sender_write_location     : 0/5000C88
sender_flush_location     : 0/5000C88
sender_replay_location    : 0/5000C88
receiver_received_location: 0/5000C88
receiver_write_location   : 0/5000C88
receiver_flush_location   : 0/5000C88
receiver_replay_location  : 0/5000C88
sync_state                : Async

-----------------------------------------------------------------------
```

## 双机主备切换<a name="section5241131012286"></a>

以操作系统用户omm登录准备切换为主节点的备节点。

```
[omm@backup dn]$ gs_ctl switchover -D /opt/enmo/openGauss/101/data/dn
[2020-10-26 21:59:54.273][28075][][gs_ctl]: gs_ctl switchover ,datadir is -D "/opt/enmo/openGauss/101/data/dn"  
[2020-10-26 21:59:54.273][28075][][gs_ctl]: switchover term (1)
[2020-10-26 21:59:54.354][28075][][gs_ctl]: waiting for server to switchover................
[2020-10-26 22:00:07.954][28075][][gs_ctl]: done
[2020-10-26 22:00:07.954][28075][][gs_ctl]: switchover completed (/opt/enmo/openGauss/101/data/dn)
```

Switchover成功后，执行如下命令记录当前主备机器信息。

```
[omm@backup dn]$ gs_om -t refreshconf
Generating dynamic configuration file for all nodes.
Successfully generated dynamic configuration file.
```

查看切换后的状态。

```
[omm@backup dn]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

node      node_ip         instance                                state            | node      node_ip         instance                                state
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
1  enmo   192.168.6.7     6001 /opt/enmo/openGauss/101/data/dn P Standby Normal | 2  backup 192.168.6.8     6002 /opt/enmo/openGauss/101/data/dn S Primary Normal
```

