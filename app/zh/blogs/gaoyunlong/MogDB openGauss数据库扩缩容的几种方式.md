---
title: 'MogDB/openGauss 数据库扩缩容的几种方式'

date: '2022-11-04'

tags: ['MogDB/openGauss 数据库扩缩容的几种方式']

archives: '2022-11'

author: '高云龙'

summary: 'MogDB/openGauss 数据库扩缩容的几种方式'

img: '/zh/post/gaoyunlong/title/img33.png'

times: '10:20'
category: 'blog'
---

# MogDB/openGauss 数据库扩缩容的几种方式

文本出处：[https://www.modb.pro/db/453105](https://www.modb.pro/db/453105)

随着业务的发展，业务系统对数据库的架构要求也在变化，比如需要读负载均衡、机房搬迁、服务器硬件替换等等，这需要在原数据库主备架构的基础上进行扩/缩容操作，目前 MogDB 数据库安装方式有三种，分别是手工安装（非 om）、标准安装（om）和 PTK 安装。

- 手工安装数据库集群扩缩容，**适用 MogDB/openGauss 数据库集群**，需要初始化新节点，修改参数文件，build 添加备库或者直接删除备库节点即可
- 标准安装数据库集群扩缩容，**适用 MogDB/openGauss 数据库集群**，需要修改 xml 配置文件，借助 gs_expansion/gs_dropnode 工具进行操作，不可直接添加/删除节点
- PTK 安装数据库集群扩缩容，**仅支持 MogDB 数据库集群**，PTK0.3 版本开始支持，使用 ptk cluster scale-out/scale-in -h 可以快速方便的完成扩缩容

## 工具介绍

### PTK

[PTK 官方文档](https://docs.mogdb.io/zh/ptk/v0.3/overview)
[PTK 一键部署示例](https://www.modb.pro/db/429683)

### gs_expansion

gs_expansion 工具对数据库的备机进行扩容。支持从单机或者一主多备最多扩容到一主八备（包括级联备）。

**注意事项**

- 扩容后不会自动更新 synchronous_standby_names 参数。如果需要为该参数增加扩容的机器，请在扩容完成后手动更新。
- 扩容级联备之前要确保原集群中有处于同一 AZ（Available Zone）且状态正常的备机，或扩容级联备的同时也扩容了处于同 AZ 的备机。

### gs_dropnode

gs_dropnode 工具从一主多备的数据库中移除不需要的备机，最多可以删除到只剩下单机。

**注意事项**

- 仅支持使用 om 方式安装的主备数据库实例中移除备机，不支持使用编译方式安装组建的主备数据库。
- 从主备数据库实例中移除当前仍可连通的备机时，会自动停止目标备机上正在运行的数据库服务，并删除备机上的 GRPC 证书（证书位置：$GAUSSHOME/share/sslcert/grpc/），但是不会删除备机上的应用。
- 如果目标备机在执行操作前处于不可连通的状态，需要用户在目标备机恢复后手动停止或删除目标备机的数据库服务，并删除备机上的 GRPC 证书。
- 如果删除后数据库实例中只剩下一个主机时，会提示建议重启当前主机，此时建议用户根据当前业务运行环境重启主机。
- 当移除的备机处于同步复制模式时，如果执行删除命令的同时主机上存在事务操作，事务提交时会出现短暂卡顿，删除完成后事务处理可继续。
- 当目标备机被移除后，如果需要以备机方式使用目标备机，请参考 gs_expansion 命令重新将目标备机添加到集群中。
- 当目标备机被移除后，如果不再需要目标备机，请在目标备机上使用 gs_uninstall -delete-data -L 命令单点卸载，请注意**务必添加-L 选项**。
- 当目标备机被移除后，如果暂时不确定是否需要目标备机，可以选择如下方法拒绝从目标备机的远程 ssh 连接，避免在目标备机上的误操作。
  - 方式一：在当前主机上使用 root 用户修改/etc/ssh/sshd_config 文件，添加如下记录（如果已存在 DenyUsers 记录，请在后面追加）DenyUsers omm@10.11.12.13，修改后需要重启 ssh 服务使其生效，修改后限制从目标备机不能使用 omm 用户远程到该主机。
  - 方式二：在当前主机上将目标备机加入到/etc/hosts.deny 文件中（例如：sshd:10.11.12.13:deny），拒绝从目标备机的远程 ssh 连接（对所有用户生效），此方法需要系统 sshd 服务绑定到 libwrap 库。
- 当目标备机被移除后，如果需要以单机方式使用目标备机且无需保留原数据，请先执行 gs_uninstall -delete-data -L 命令卸载后重新安装。如果保留原数据，请在目标备机上先执行 gs_guc set -D /gaussdb/data/dbnode -c “replconninfoX“ ，
  - /gaussdb/data/dbnode 表示数据目录，
  - replconninfoX 表示主备集群中的除本节点外的其他节点，
    比如一主一备则需要配置 replconninfo1, 一主两备需要配置 replconninfo1 和 replconninfo2, 以此类推

## 示例

### 环境检查

#### 集群状态

```
[omm@node1 ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

    node node_ip         port      instance            state
----------------------------------------------------------------------------
1  node1 192.168.122.221 25000      6001 /data/mogdb   P Primary Normal
2  node2 192.168.122.157 25000      6002 /data/mogdb   S Standby Normal
```

#### xml 配置文件

```
<?xml version="1.0" encoding="UTF-8"?>
<ROOT>
    <CLUSTER>
        <PARAM name="clusterName" value="dbCluster" />
        <PARAM name="nodeNames" value="node1,node2" />
        <PARAM name="backIp1s" value="192.168.122.221,192.168.122.157"/>
        <PARAM name="gaussdbAppPath" value="/opt/mogdb/app" />
        <PARAM name="gaussdbLogPath" value="/var/log/mogdb" />
        <PARAM name="gaussdbToolPath" value="/opt/mogdb/tools" />
        <PARAM name="corePath" value="/opt/mogdb/corefile"/>
        <PARAM name="clusterType" value="single-inst"/>
    </CLUSTER>
    <DEVICELIST>
        <DEVICE sn="1000001">
            <PARAM name="name" value="node1"/>
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <PARAM name="backIp1" value="192.168.122.221"/>
            <PARAM name="sshIp1" value="192.168.122.221"/>

        <PARAM name="dataNum" value="1"/>
        <PARAM name="dataPortBase" value="25000"/>
        <PARAM name="dataNode1" value="/data/mogdb,node2,/data/mogdb"/>
        </DEVICE>

        <DEVICE sn="1000002">
            <PARAM name="name" value="node2"/>
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <PARAM name="backIp1" value="192.168.122.157"/>
            <PARAM name="sshIp1" value="192.168.122.157"/>
    </DEVICE>
    </DEVICELIST>
</ROOT>
```

### 扩容

**前提条件**

- 扩容备机的操作系统与主机保持一致。
- 在扩容备机上创建好与主机上相同的用户和用户组。
- 已存在的节点和新增节点之间建立好 root 用户互信以及数据库管理用户（如 omm）的互信。
- 正确配置 xml 文件，在已安装数据库配置文件的基础上，添加需要扩容的备机信息。
- 扩容备节点的操作只能在主节点上执行，且只能使用 root 用户在解压 MogDB 镜像包后的 script 目录下执行 gs_expansion 命令。
- 执行扩容命令前需要通过 source 命令导入主机数据库的环境变量。一般该文件路径为：/home/[user]/.bashrc
- 不允许与 gs_dropnode 命令同时执行。
- 不允许并发执行相同的 gs_expansion 命令。
- 操作过程中不允许同时在其他备节点上执行主备倒换或者故障倒换的操作。

#### 扩容节点准备

扩容节点：192.168.122.68
参考 [操作系统配置](https://docs.mogdb.io/zh/mogdb/v3.0/os-configuration)

```
--创建omm用户及用户组
[root@node3 ~]# groupadd dbgrp
[root@node3 ~]# useradd -g dbgrp omm
[root@node3 ~]# passwd omm

--建立互信，第一次需要先相互登陆确认一下
[root@node2 ~]# scp -r .ssh root@192.168.122.68:/root
[omm@node2 ~]$ scp -r .ssh omm@192.168.122.68:/home/omm/

--python3 版本要保持一致，如果不一致需要重新安装
```

#### 配置 xml 文件

```
<?xml version="1.0" encoding="UTF-8"?>
<ROOT>
    <CLUSTER>
        <PARAM name="clusterName" value="dbCluster" />
        <PARAM name="nodeNames" value="node1,node2,node3" />
        <PARAM name="backIp1s" value="192.168.122.221,192.168.122.157,192.168.122.68"/>
        <PARAM name="gaussdbAppPath" value="/opt/mogdb/app" />
        <PARAM name="gaussdbLogPath" value="/var/log/mogdb" />
        <PARAM name="gaussdbToolPath" value="/opt/mogdb/tools" />
        <PARAM name="corePath" value="/opt/mogdb/corefile"/>
        <PARAM name="clusterType" value="single-inst"/>
    </CLUSTER>
    <DEVICELIST>
        <DEVICE sn="1000001">
            <PARAM name="name" value="node1"/>
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <PARAM name="backIp1" value="192.168.122.221"/>
            <PARAM name="sshIp1" value="192.168.122.221"/>

        <PARAM name="dataNum" value="1"/>
        <PARAM name="dataPortBase" value="25000"/>
        <PARAM name="dataNode1" value="/data/mogdb,node2,/data/mogdb,node3,/data/mogdb"/>
        </DEVICE>

        <DEVICE sn="1000002">
            <PARAM name="name" value="node2"/>
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <PARAM name="backIp1" value="192.168.122.157"/>
            <PARAM name="sshIp1" value="192.168.122.157"/>
    	</DEVICE>

        <DEVICE sn="1000003">
            <PARAM name="name" value="node3"/>
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <PARAM name="backIp1" value="192.168.122.68"/>
            <PARAM name="sshIp1" value="192.168.122.68"/>
        </DEVICE>
    </DEVICELIST>
</ROOT>
```

#### 集群扩容

```
[root@node1 ~]# cd /opt/mogdb300
[root@node1 mogdb300]# source /home/omm/.bashrc
[root@node1 mogdb300]# ./script/gs_expansion -U omm -G dbgrp -X /opt/mogdb300/config.xml -h 192.168.122.68
Start expansion without cluster manager component.
Start to preinstall database on new nodes.
Start to send soft to each standby nodes.
End to send soft to each standby nodes.
Start to preinstall database step.
Preinstall 192.168.122.68 success
End to preinstall database step.
End to preinstall database on new nodes.

Start to install database on new nodes.
Installing database on node 192.168.122.68:
Parsing the configuration file.
Check preinstall on every node.
Successfully checked preinstall on every node.
Creating the backup directory.
Successfully created the backup directory.
begin deploy..
Installing the cluster.
begin prepare Install Cluster..
Checking the installation environment on all nodes.
begin install Cluster..
Installing applications on all nodes.
Successfully installed APP.
begin init Instance..
encrypt cipher and rand files for database.
Please enter password for database:
Please repeat for database:
begin to create CA cert files
The sslcert will be generated in /opt/mogdb/app/share/sslcert/om
NO cm_server instance, no need to create CA for CM.
Cluster installation is completed.
Configuring.
Deleting instances from all nodes.
Successfully deleted instances from all nodes.
Checking node configuration on all nodes.
Initializing instances on all nodes.
Updating instance configuration on all nodes.
Check consistence of memCheck and coresCheck on database nodes.
Configuring pg_hba on all nodes.
Configuration is completed.
Successfully started cluster.
Successfully installed application.
end deploy..
192.168.122.68 install success.
Finish to install database on all nodes.
Database on standby nodes installed finished.

Checking mogdb and gs_om version.
End to check mogdb and gs_om version.

Start to establish the relationship.
Start to build standby 192.168.122.68.
Build standby 192.168.122.68 success.
Start to generate and send cluster static file.
End to generate and send cluster static file.

Expansion results:
192.168.122.68:	Success
Expansion Finish.
```

#### 扩容验证

```
--主节点查询
[root@node1 mogdb300]# su - omm
[omm@node1 ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

    node node_ip         port      instance            state
----------------------------------------------------------------------------
1  node1 192.168.122.221 25000      6001 /data/mogdb   P Primary Normal
2  node2 192.168.122.157 25000      6002 /data/mogdb   S Standby Normal
3  node3 192.168.122.68  25000      6003 /data/mogdb   S Standby Normal

--扩容节点查询
[root@node3 ~]# su - omm
Last login: Fri Aug  5 10:16:20 HKT 2022 from node1 on pts/1
[omm@node3 ~]$ gs_ctl query  -D /data/mogdb
[2022-08-05 10:24:17.047][17791][][gs_ctl]: gs_ctl query ,datadir is /data/mogdb
 HA state:
	local_role                     : Standby
	static_connections             : 2
	db_state                       : Normal
	detail_information             : Normal

 Senders info:
No information
 Receiver info:
	receiver_pid                   : 6141
	local_role                     : Standby
	peer_role                      : Primary
	peer_state                     : Normal
	state                          : Normal
	sender_sent_location           : 0/6000808
	sender_write_location          : 0/6000808
	sender_flush_location          : 0/6000808
	sender_replay_location         : 0/6000808
	receiver_received_location     : 0/6000808
	receiver_write_location        : 0/6000808
	receiver_flush_location        : 0/6000808
	receiver_replay_location       : 0/6000808
	sync_percent                   : 100%
	channel                        : 192.168.122.68:44046<--192.168.122.221:25001

[omm@node3 ~]$
```

### 缩容

**前提条件**

- 执行前需要确保主节点和备节点之间 omm 用户(数据库管理用户)的互信正常。
- 删除备节点的操作只能在主节点上执行，需要使用数据库管理用户（比如 omm）执行该命令。
- 不允许与 gs_expansion 命令同时执行。
- 不允许并发执行相同的 gs_dropnode 命令。
- 不允许同时在其他备节点上执行主备倒换或者故障倒换的操作。
- 执行命令前需要通过 source 命令导入主机数据库的环境变量。如果当前数据库是分离环境变量方式安装，则 source 导入分离的环境变量。如果未进行分离，则需要 source 导入子用户的.bashrc 配置文件。一般该文件路径为：/home/[user]/.bashrc

#### 集群缩容

将新扩容节点当目标备库再删除掉，为了防止误操作，需要删除目标备库与原集群内其他节点的 ssh 互信，操作方式参考注意事项

```
--主库执行
[omm@node1 ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

    node node_ip         port      instance            state
----------------------------------------------------------------------------
1  node1 192.168.122.221 25000      6001 /data/mogdb   P Primary Normal
2  node2 192.168.122.157 25000      6002 /data/mogdb   S Standby Normal
3  node3 192.168.122.68  25000      6003 /data/mogdb   S Standby Normal

[omm@node1 ~]$ gs_dropnode -U omm -G dbgrp -h 192.168.122.68
The target node to be dropped is (['node3'])
Do you want to continue to drop the target node (yes/no)?yes
Drop node start without CM node.
[gs_dropnode]Start to drop nodes of the cluster.
[gs_dropnode]Start to stop the target node node3.
[gs_dropnode]End of stop the target node node3.
[gs_dropnode]Start to backup parameter config file on node1.
[gs_dropnode]End to backup parameter config file on node1.
[gs_dropnode]The backup file of node1 is /opt/mogdb/tools/omm_mppdb/gs_dropnode_backup20220805102606/parameter_node1.tar
[gs_dropnode]Start to parse parameter config file on node1.
[gs_dropnode]End to parse parameter config file on node1.
[gs_dropnode]Start to parse backup parameter config file on node1.
[gs_dropnode]End to parse backup parameter config file node1.
[gs_dropnode]Start to set openGauss config file on node1.
[gs_dropnode]End of set openGauss config file on node1.
[gs_dropnode]Start to backup parameter config file on node2.
[gs_dropnode]End to backup parameter config file on node2.
[gs_dropnode]The backup file of node2 is /opt/mogdb/tools/omm_mppdb/gs_dropnode_backup20220805102607/parameter_node2.tar
[gs_dropnode]Start to parse parameter config file on node2.
[gs_dropnode]End to parse parameter config file on node2.
[gs_dropnode]Start to parse backup parameter config file on node2.
[gs_dropnode]End to parse backup parameter config file node2.
[gs_dropnode]Start to set openGauss config file on node2.
[gs_dropnode]End of set openGauss config file on node2.
[gs_dropnode]Start of set pg_hba config file on node1.
[gs_dropnode]End of set pg_hba config file on node1.
[gs_dropnode]Start of set pg_hba config file on node2.
[gs_dropnode]End of set pg_hba config file on node2.
[gs_dropnode]Start to set repl slot on node1.
[gs_dropnode]Start to get repl slot on node1.
[gs_dropnode]End of set repl slot on node1.
[gs_dropnode]Start to modify the cluster static conf.
[gs_dropnode]End of modify the cluster static conf.
[gs_dropnode]Success to drop the target nodes.

[omm@node1 ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

    node node_ip         port      instance            state
----------------------------------------------------------------------------
1  node1 192.168.122.221 25000      6001 /data/mogdb   P Primary Normal
2  node2 192.168.122.157 25000      6002 /data/mogdb   S Standby Normal
[omm@node1 ~]$
```

#### 目标备库单独服务（可选）

通过 gs_dropnode 工具已经将 node3 节点从集群内移除，并关闭了数据库实例，但是数据目录依然保留，而且数据库配置文件中 replconninfo 信息也没有清理。

```
--状态检查
[omm@node3 ~]$ gs_ctl query  -D /data/mogdb
[2022-08-05 10:27:53.100][24663][][gs_ctl]: gs_ctl query ,datadir is /data/mogdb
[2022-08-05 10:27:53.100][24663][][gs_ctl]:  PID file "/data/mogdb/postmaster.pid" does not exist
[2022-08-05 10:27:53.100][24663][][gs_ctl]: Is server running?

[omm@node3 ~]$ cat /data/mogdb/postgresql.conf |grep -i replconninfo
replconninfo1 = 'localhost=192.168.122.68 localport=25001 localheartbeatport=25003 localservice=25004 remotehost=192.168.122.157 remoteport=25001 remoteheartbeatport=25003 remoteservice=25004'
replconninfo2 = 'localhost=192.168.122.68 localport=25001 localheartbeatport=25003 localservice=25004 remotehost=192.168.122.221 remoteport=25001 remoteheartbeatport=25003 remoteservice=25004'

--注释复制信息
[omm@node3 ~]$ gs_guc set -D /data/mogdb/ -c "replconninfo1"
[omm@node3 ~]$ gs_guc set -D /data/mogdb/ -c "replconninfo2"

[omm@node3 ~]$ cat /data/mogdb/postgresql.conf |grep -i replconninfo
#replconninfo1 = 'localhost=192.168.122.68 localport=25001 localheartbeatport=25003 localservice=25004 remotehost=192.168.122.157 remoteport=25001 remoteheartbeatport=25003 remoteservice=25004'
#replconninfo2 = 'localhost=192.168.122.68 localport=25001 localheartbeatport=25003 localservice=25004 remotehost=192.168.122.221 remoteport=25001 remoteheartbeatport=25003 remoteservice=25004'

--启动数据库
[omm@node3 ~]$ gs_ctl -D /data/mogdb start
[omm@node3 ~]$ gsql -p 25000 postgres -r
gsql ((MogDB 3.0.0 build 62408a0f) compiled at 2022-06-30 14:21:11 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

MogDB=# select pg_is_in_recovery();
 pg_is_in_recovery
-------------------
 f
(1 row)

MogDB=#
```

####

#### 目标备库清理数据（可选）

```
[omm@node3 ~]$ ls /data/mogdb
backup_label.old      gaussdb.state       mot.conf      pg_hba.conf       pg_location   pg_serial     PG_VERSION            postmaster.opts      server.key
base                  global              pg_clog       pg_hba.conf.bak   pg_logical    pg_snapshots  pg_xlog               postmaster.pid       server.key.cipher
build_completed.done  gs_build.pid        pg_csnlog     pg_hba.conf.lock  pg_multixact  pg_stat_tmp   postgresql.conf       postmaster.pid.lock  server.key.rand
cacert.pem            gs_gazelle.conf     pg_ctl.lock   pg_ident.conf     pg_notify     pg_tblspc     postgresql.conf.bak   rewind_lable         undo
full_backup_label     gswlm_userinfo.cfg  pg_errorinfo  pg_llog           pg_replslot   pg_twophase   postgresql.conf.lock  server.crt

--删除数据目录
[omm@node3 ~]$ gs_uninstall --delete-data -L
Checking uninstallation.
Successfully checked uninstallation.
Stopping the cluster.
Successfully stopped the cluster.
Successfully deleted instances.
Uninstalling application.
Successfully uninstalled application.
Uninstallation succeeded.

[omm@node3 ~]$ ls /data/mogdb
[omm@node3 ~]$
```

### PTK 安装集群扩容

```
[root@node1 .ptk]# ptk cluster scale-out -h
Scale out a MogDB cluster

Usage:
  ptk cluster scale-out [flags]

Examples:
ptk cluster -n CLUSTER_NAME scale-out -c add.yaml [--force] [--skip-check-distro] [--skip-check-os] [--skip-create-user]

Flags:
  -c, --config string       Scale config path
      --default-guc         Disable optimize guc config, use default value
      --force               If scale operation had failed or interruptted. you can use --force to scale again. it will clear the old dirty directory
      --gen-template        Generate a scale add template config
  -h, --help                help for scale-out
  -n, --name string         Cluster name
      --skip-check-distro   Skip check distro
      --skip-check-os       Skip check os
      --skip-create-user    Skip create user
  -t, --timeout duration    Opration timeout (default 10m0s)

Global Flags:
  -f, --file string         Specify a configuration file of cluster
      --log-file string     Specify a log output file
      --log-format string   Specify the log message format. Options: [text, json] (default "text")
      --log-level string    Specify the log level. Options: [debug, info, warning, error, panic] (default "info")
  -v, --version             Print version of ptk
```

#### 检查集群状态

```
[root@node1 ~]# ptk cluster -n M30 status
[   Cluster State   ]
database_version			: MogDB-MogDB
cluster_name				: M30
cluster_state   			: Normal
current_az      			: AZ_ALL

[  Datanode State   ]
   id  |       ip        | port  | user | instance | db_role | state
-------+-----------------+-------+------+----------+---------+---------
  6001 | 192.168.122.221 | 25000 | omm  | dn_6001  | primary | Normal
  6002 | 192.168.122.157 | 25000 | omm  | dn_6002  | standby | Normal
```

#### 生成扩容配置文件

```
[root@node1 .ptk]# ptk cluster -n M30 scale-out --gen-template > add.yaml
[root@node1 .ptk]# cat add.yaml
- host: 192.168.122.68
  db_port: 25000
  role: standby
  ssh_option:
    host: 192.168.122.68
    port: 22
    user: root
    password: "pTk6MDQ2Y2U0ZDE8QzxCPEU/RE8ycy1UZFpEZ0xSMU9PQzRZMkpoY2JuT0x2Z05FbG9pZDlBMm5hZlFEVzQ="
```

#### 集群扩容

```
[root@node1 .ptk]# ptk cluster -n M30 scale-out -c add.yaml
scale [stage=preCheck]
INFO[2022-08-05T14:19:52.162] start check operating system
INFO[2022-08-05T14:19:52.633] prechecking dependent tools...
INFO[2022-08-05T14:19:52.932] platform: centos_7_64bit                      host=192.168.122.68
.
.
.
INFO[2022-08-05T14:20:25.432] reload 192.168.122.157 database by gs_ctl     host=192.168.122.157
INFO[2022-08-05T14:20:25.504] set 192.168.122.68 postgresql.conf            host=192.168.122.68
INFO[2022-08-05T14:20:25.582] generate static config to /opt/mogdb/app/bin/cluster_static_config  host=192.168.122.68
INFO[2022-08-05T14:20:25.612] change /opt/mogdb/app/bin/cluster_static_config owner to omm  host=192.168.122.68
INFO[2022-08-05T14:20:25.625] set 192.168.122.68 hba config                 host=192.168.122.68
INFO[2022-08-05T14:20:25.709] build 192.168.122.68 database by gs_ctl       host=192.168.122.68
Scale success.

[root@node1 .ptk]# ptk cluster -n M30 status
[   Cluster State   ]
database_version			: MogDB-MogDB
cluster_name				: M30
cluster_state   			: Normal
current_az      			: AZ_ALL

[  Datanode State   ]
   id  |       ip        | port  | user | instance | db_role | state
-------+-----------------+-------+------+----------+---------+---------
  6001 | 192.168.122.221 | 25000 | omm  | dn_6001  | primary | Normal
  6002 | 192.168.122.157 | 25000 | omm  | dn_6002  | standby | Normal
  6003 | 192.168.122.68  | 25000 | omm  | dn_6003  | standby | Normal
```

### PTK 集群缩容

```
[root@node1 .ptk]# ptk cluster scale-in -h
Scale in a MogDB cluster

Usage:
  ptk cluster scale-in [flags]

Examples:
ptk cluster -n CLUSTER_NAME scale-in  -H 10.0.0.1 [--stop-db] [--clear-user] [--clear-dir] [--clear-env] [-t 120]

Flags:
      --clear-dir          Clear relevant dir
      --clear-env          Clear env value
      --clear-user         Clear user in delete hosts
  -h, --help               help for scale-in
  -H, --host stringArray   Scale delete hosts
  -n, --name string        Cluster name
      --stop-db            Stop the database
  -t, --timeout duration   Opration timeout (default 5m0s)

Global Flags:
  -f, --file string         Specify a configuration file of cluster
      --log-file string     Specify a log output file
      --log-format string   Specify the log message format. Options: [text, json] (default "text")
      --log-level string    Specify the log level. Options: [debug, info, warning, error, panic] (default "info")
  -v, --version             Print version of ptk
```

#### 集群缩容

```
[root@node1 .ptk]# ptk cluster -n M30 scale-in -H 192.168.122.68 --stop-db
scale [stage=preCheck]
scale [stage=exec]
modify the instance[192.168.122.68]:/data/mogdb/postgres.conf replconninfo value
INFO[2022-08-05T14:41:46.280] reload 192.168.122.68 database by gs_ctl      host=192.168.122.68
modify the instance[192.168.122.157]:/data/mogdb/postgres.conf replconninfo value
INFO[2022-08-05T14:41:46.385] reload 192.168.122.157 database by gs_ctl     host=192.168.122.157
modify the instance[192.168.122.221]:/data/mogdb/postgres.conf replconninfo value
INFO[2022-08-05T14:41:46.458] reload 192.168.122.221 database by gs_ctl     host=192.168.122.221
scale [stage=postExec]
Would you want delete directory(AppDir,DataDir,ToolDir,LogDir)?[Y|Yes](default=N) Y
Would you want delete the user?[Y|Yes](default=N) Y
Would you want clear the env?[Y|Yes](default=N) Y
INFO[2022-08-05T14:42:06.251] stop 192.168.122.68 database by gs_ctl        host=192.168.122.68
INFO[2022-08-05T14:42:06.321] remove files /opt/mogdb/app,/data/mogdb,/opt/mogdb/tool,/opt/mogdb/log  host=192.168.122.68
INFO[2022-08-05T14:42:06.587] remove user profiles                          host=192.168.122.68
INFO[2022-08-05T14:42:06.607] delete os user omm                            host=192.168.122.68
Scale success.
[root@node1 .ptk]# ptk cluster -n M30 status
[   Cluster State   ]
database_version			: MogDB-MogDB
cluster_name				: M30
cluster_state   			: Normal
current_az      			: AZ_ALL

[  Datanode State   ]
   id  |       ip        | port  | user | instance | db_role | state
-------+-----------------+-------+------+----------+---------+---------
  6001 | 192.168.122.221 | 25000 | omm  | dn_6001  | primary | Normal
  6002 | 192.168.122.157 | 25000 | omm  | dn_6002  | standby | Normal
[root@node1 .ptk]#
```
