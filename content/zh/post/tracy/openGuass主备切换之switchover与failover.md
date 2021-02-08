+++

title = "openGuass主备切换之switchover与failover" 

date = "2021-02-05" 

tags = ["openGauss主备"] 

archives = "2021-02" 

author = "tracy" 

summary = "openGuass主备切换之switchover与failover"

img = "/zh/post/tracy/title/img20.png" 

times = "10:30"

+++

# openGuass主备切换之switchover与failover<a name="ZH-CN_TOPIC_0000001116221613"></a>

## switchover<a name="section12121328133916"></a>

在主备机正常时，出于维护的需要，将备机切换为主机，可保证切换过程中数据不丢失。

查看集群实例主备状态：1节点为主库，2节点为备库。

```
$ gs_om -t status --detail
[   Cluster State   ]
cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL
[  Datanode State   ]
node           node_ip         instance                       state            | node           node_ip         instance                       state
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
1  cen7-og1-02 192.168.229.53  6001 /opt/openGuass/data/dn P Primary Normal | 2  cen7-og1-03 192.168.229.54  6002 /opt/openGuass/data/dn S Standby Normal
```

在备节点执行切换主备操作：

```
$  gs_ctl switchover -D /opt/openGuass/data/dn
[2021-01-15 02:44:55.125][1034][][gs_ctl]: gs_ctl switchover ,datadir is /opt/openGuass/data/dn
[2021-01-15 02:44:55.125][1034][][gs_ctl]: switchover term (1)
[2021-01-15 02:44:55.137][1034][][gs_ctl]: waiting for server to switchover..............
[2021-01-15 02:45:06.250][1034][][gs_ctl]: done
[2021-01-15 02:45:06.250][1034][][gs_ctl]: switchover completed (/opt/openGuass/data/dn)
```

确认集群主备状态：1节点为备库，2节点为主库。

```
$  gs_om -t status --detail
[   Cluster State   ]
cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL
[  Datanode State   ]
node           node_ip         instance                       state            | node           node_ip         instance                       state
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
1  cen7-og1-02 192.168.229.53  6001 /opt/openGuass/data/dn P Standby Normal | 2  cen7-og1-03 192.168.229.54  6002 /opt/openGuass/data/dn S Primary Normal
```

保存数据库主备机器信息：确保gs\_om -t refreshconf 命令执行成功，否则再次重启会影响数据库状态。

```
$ gs_om -t refreshconf
Generating dynamic configuration file for all nodes.
Successfully generated dynamic configuration file.
```

## failover<a name="section16322181618464"></a>

在主机异常时，将备机切换为主机。

查看集群实例主备状态：1节点为备库，2节点为主库。

```
$  gs_om -t status --detail
[   Cluster State   ]
cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL
[  Datanode State   ]
node           node_ip         instance                       state            | node           node_ip         instance                       state
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
1  cen7-og1-02 192.168.229.53  6001 /opt/openGuass/data/dn P Standby Normal | 2  cen7-og1-03 192.168.229.54  6002 /opt/openGuass/data/dn S Primary Normal
```

备节点执行主备切换操作：

```
$ gs_ctl failover -D /opt/openGuass/data/dn
[2021-01-15 03:33:13.803][17292][][gs_ctl]: gs_ctl failover ,datadir is /opt/openGuass/data/dn
[2021-01-15 03:33:13.803][17292][][gs_ctl]: failover term (1)
[2021-01-15 03:33:13.810][17292][][gs_ctl]:  waiting for server to failover...
[2021-01-15 03:33:14.823][17292][][gs_ctl]:  done
[2021-01-15 03:33:14.823][17292][][gs_ctl]:  failover completed (/opt/openGuass/data/dn)
```

确认集群主备状态：双主状态。

```
$ gs_om -t status --detail
[   Cluster State   ]
cluster_state   : Unavailable
redistributing  : No
current_az      : AZ_ALL
[  Datanode State   ]
node           node_ip         instance                       state            | node           node_ip         instance                       state
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
1  cen7-og1-02 192.168.229.53  6001 /opt/openGuass/data/dn P Primary Normal | 2  cen7-og1-03 192.168.229.54  6002 /opt/openGuass/data/dn S Primary Normal
```

在确定降为备机的节点关闭并以standy模式启动OpenGuass服务：

```
$ gs_ctl start -D /opt/openGuass/data/dn -M standby
[2021-01-15 03:03:08.695][9126][][gs_ctl]: gs_ctl started,datadir is /opt/openGuass/data/dn
[2021-01-15 03:03:08.864][9126][][gs_ctl]: waiting for server to start...
......
[2021-01-15 03:03:10.921][9126][][gs_ctl]:  done
[2021-01-15 03:03:10.921][9126][][gs_ctl]: server started (/opt/openGuass/data/dn)
```

确认集群状态：1节点为主库，2节点为备库，但备库需要修复。

```
$  gs_om -t status --detail
[   Cluster State   ]
cluster_state   : Degraded
redistributing  : No
current_az      : AZ_ALL
[  Datanode State   ]
node           node_ip         instance                       state            | node           node_ip         instance                       state
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
1  cen7-og1-02 192.168.229.53  6001 /opt/openGuass/data/dn P Primary Normal | 2  cen7-og1-03 192.168.229.54  6002 /opt/openGuass/data/dn S Standby Need repair(WAL)
```

在备库所在节点执行修复命令：

```
[omm@cen7-og1-03 ~]$ gs_ctl build -D /opt/openGuass/data/dn
[2021-01-15 03:23:57.702][30784][][gs_ctl]: gs_ctl incremental build ,datadir is /opt/openGuass/data/dn
waiting for server to shut down.... done
server stopped
[2021-01-15 03:23:58.726][30784][][gs_ctl]:  fopen build pid file "/opt/openGuass/data/dn/gs_build.pid" success
[2021-01-15 03:23:58.726][30784][][gs_ctl]:  fprintf build pid file "/opt/openGuass/data/dn/gs_build.pid" success
[2021-01-15 03:23:58.727][30784][][gs_ctl]:  fsync build pid file "/opt/openGuass/data/dn/gs_build.pid" success
......
[2021-01-15 03:24:02.833][30784][dn_6001_6002][gs_ctl]:  done
[2021-01-15 03:24:02.833][30784][dn_6001_6002][gs_ctl]: server started (/opt/openGuass/data/dn)
[2021-01-15 03:24:02.833][30784][dn_6001_6002][gs_ctl]:  fopen build pid file "/opt/openGuass/data/dn/gs_build.pid" success
[2021-01-15 03:24:02.833][30784][dn_6001_6002][gs_ctl]:  fprintf build pid file "/opt/openGuass/data/dn/gs_build.pid" success
[2021-01-15 03:24:02.835][30784][dn_6001_6002][gs_ctl]:  fsync build pid file "/opt/openGuass/data/dn/gs_build.pid" success
```

确认集群状态：正常。

```
$  gs_om -t status --detail
[   Cluster State   ]
cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL
[  Datanode State   ]
node           node_ip         instance                       state            | node           node_ip         instance                       state
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
1  cen7-og1-02 192.168.229.53  6001 /opt/openGuass/data/dn P Primary Normal | 2  cen7-og1-03 192.168.229.54  6002 /opt/openGuass/data/dn S Standby Normal
```

保存数据库主备机器信息：确保gs\_om -t refreshconf 命令执行成功，否则再次重启会影响数据库状态。

```
$ gs_om -t refreshconf
Generating dynamic configuration file for all nodes.
Successfully generated dynamic configuration file.
```

