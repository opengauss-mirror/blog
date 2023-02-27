---
title: 'openGauss之主备切换'

date: '2022-05-12'

category: 'blog'
tags: ['openGauss之主备切换']

archives: '2022-05'

author: '云和恩墨'

summary: 'openGauss之主备切换'

img: '/zh/blogs/enmo/title/img6.png'

times: '10:20'
---

# openGauss 之主备切换

本文出处：[https://www.modb.pro/db/401852](https://www.modb.pro/db/401852)

### 1.主备切换

主备节点都处于正常状态，主备切换只是交换双方在数据库集簇中的角色，通过 gs_ctl 工具实现主备实例切换，操作步骤如下：
1）查看主备情况，以 omm 用户登录任意节点主机：

```
gs_om -t status --detail
```

2)以 omm 用户登录备节点主机 OG2：
准确来说，执行下述命令的意思是将当前节点升主，其他节点降备，如果在主库上执行，本来就是主库，执行之后当然没有影响了。所以为了达到试验效果，我们在备库上执行下述命令：

```
gs_ctl switchover -D /data/og2
[omm@OG2 ~]$ gs_ctl switchover -D /data/og2
[2022-05-11 10:51:07.804][19219][][gs_ctl]: gs_ctl switchover ,datadir is /data/og2
[2022-05-11 10:51:07.804][19219][][gs_ctl]: switchover term (1)
[2022-05-11 10:51:07.821][19219][][gs_ctl]: waiting for server to switchover...........
[2022-05-11 10:51:15.916][19219][][gs_ctl]: done
[2022-05-11 10:51:15.916][19219][][gs_ctl]: switchover completed (/data/og2)

```

/data/og2 为备节点的数据目录

3)记录主备机器信息

```
gs_om -t refreshconf
[omm@OG2 ~]$ gs_om -t refreshconf
Generating dynamic configuration file for all nodes.
Successfully generated dynamic configuration file.

```

4)查验

```
[omm@OG2 ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

    nodenode_ip         port      instance          state
------------------------------------------------------------------------
1  OG1 192.168.1.100   15400      6001 /data/og1   P Standby Normal
2  OG2 192.168.1.101   15400      6002 /data/og2   S Primary Normal

```

经查，备节点 OG2 确实切换成了主节点。

### 2.使用场景：

需要进行主备切换时，例如数据库进行故障转移后需要恢复原来的主备关系，或发现数据库主机硬件异常，需要进行主备切换，保证数据库业务的持续性。
说明：
（1）级联备机不能直接转换为主机，只能先通过 switchover 或者 failover 成为备机，然后再切换为主机
（2）主备切换为维护操作，确保 openGauss 状态正常，所有业务结束后，再进行切换操作。

### 3.双主现象

#### 1）解决双主现象的基本步骤

如果由于网络故障、磁盘满等导致主备连接断开，出现双主现象，恢复步骤如下，否则会导致数据丢失：
（1）查看主备状态，如果都是两个数据库节点都为 primary，说明出现故障

```
gs_om -t status --detail
```

（2）以 omm 用户登录待降备的节点，然后关闭服务:

```
gs_ctl stop -D /data/og2
```

（3）然后以 standby 模式启动服务:

```
gs_ctl start -D /data/og2 -M standby
```

（4）保存数据库主备机器信息

```
gs_om -t refreshconf
```

（5）检查确认

```
gs_om -t status --detail
```

#### 2)模拟双主现象

为了做上面的双主现象实验，在 og1 和 og2 成功进行主备切换之后，现在的状态为：
og1 备
og2 主
（1）为了达到双主,登录 OG1 主机，执行如下命令：

```
gs_ctl stop -D /data/og1 gs_ctl start -D /data/og1 -M primary	//以primary模式启动OG1
```

然后查看状态:

```
gs_om -t status --detail
[omm@OG1 ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Unavailable
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

    nodenode_ip         port      instance          state
------------------------------------------------------------------------
1  OG1 192.168.1.100   15400      6001 /data/og1   P Primary Normal
2  OG2 192.168.1.101   15400      6002 /data/og2   S Primary Normal

```

确实出现了双主现象。
   当然我们可以通过 failover 模拟双主现象，例如：在主备正常的情况下，在备库下执行 gs_ctl failover 故障转移，将当前备库提升为主，此时查看数据库集簇的状态就会发现，两个节点都是主节点。当然 failover 故障转移是用在，当主库挂掉了，在备库上执行，将备库提升为主，继续向外提供服务，保持业务的持续稳定性。

#### 3）恢复

此时我想要将数据库集簇恢复到一主一备的状态，且 og1 为主，og2 为备，根据恢复基本步骤，登录 og2 节点，进行如下操作：

```
gs_ctl stop -D /data/og2  gs_ctl start -D /data/og2 -M standby gs_om -t refreshconf
```

操作完毕之后，查看数据库集簇状态：

```
[omm@OG2 ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Degraded
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

    nodenode_ip         port      instance          state
------------------------------------------------------------------------
1  OG1 192.168.1.100   15400      6001 /data/og1   P Primary Normal
2  OG2 192.168.1.101   15400      6002 /data/og2   S Standby Need repair(WAL)

```

发现一主一备的关系恢复了，但是 OG2 出现故障需要恢复，可能是主备不一致导致的问题。

#### 4）修复 Standby Need repair

方法一：重新安装 openGauss：
卸载：
(1)以 omm 用户登录任意主机执行：
gs_uninstall --delete-data
(2)安装 openGauss
gs_install -X /opt/software/openGauss/cluster_config.xml --gsinit-parameter="–
locale=en_US.utf8"
其中要求输入数据库密码。
这种方法你估计不喜欢。

方法二：
概述：备份 og2 节点数据目录下的配置文件，将 og2 节点的数据库数据目录清空，然后将 og1 节点的数据目录下的文件拷贝过来，使用备份的配置文件替换拷贝过来的配置文件。
（0）关闭数据库集簇

```
gs_om -t stop
```

（1）备份 og2 节点数据目录下的配置文件

```
[root@OG2 ~]# mkdir /og2conf [root@OG2 ~]# chown omm.dbgrp /og2conf [root@OG2 ~]# su - omm Last login: Wed May 11 09:49:38 CST 2022 on pts/0 [omm@OG2 ~]$ cp /data/og2/*.conf /og2conf
```

（2）清空 og2 节点的数据目录

```
[omm@OG2 ~]$ rm -rf /data/og2/*
```

（3）登录 og1，将 og1 节点的数据目录下的所有文件拷贝到 og2 节点的数据目录下：

```
[omm@OG1 ~]$ scp -rp /data/og1/* og2:/data/og2
```

（4）登录 og2，替换配置文件

```
[omm@OG2 ~]$ cp /og2conf/* /data/og2
```

（5）启动数据库集簇,并检查集簇状态

```
[omm@OG1 ~]$ gs_om -t start
Starting cluster.
=========================================
[SUCCESS] OG1
2022-05-11 11:23:30.967 627b2c32.1 [unknown] 140707753452480 [unknown] 0 dn_6001_6002 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (2462 Mbytes) is larger.
[SUCCESS] OG2
2022-05-11 11:23:34.410 627b2c36.1 [unknown] 140529291215808 [unknown] 0 dn_6001_6002 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (2462 Mbytes) is larger.
Waiting for check cluster state...
=========================================
Successfully started.
[omm@OG1 ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

    nodenode_ip         port      instance          state
------------------------------------------------------------------------
1  OG1 192.168.1.100   15400      6001 /data/og1   P Primary Normal
2  OG2 192.168.1.101   15400      6002 /data/og2   S Standby Normal
可以发现，Standby Need repair故障就解决了。
```
