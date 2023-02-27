---
title: 'MogDB/openGauss 3.0 扩容及缩容'

date: '2022-08-12'

category: 'blog'
tags: ['MogDB']

archives: '2022-08'

author: '李宏达'

summary: 'MogDB/openGauss 3.0 扩容及缩容'

img: '/zh/blogs/lihongda/title/img6.png'

times: '10:20'
---

# MogDB/openGauss 3.0 扩容及缩容

本文出处：[https://www.modb.pro/db/452139](https://www.modb.pro/db/452139)

## 一、概述

### 背景信息

**gs_expansion 工具对数据库的备机进行扩容，支持从单机或者一主多备最多扩容到一主八备，本文从一主一备扩容到一主两备。**

**gs_dropnode 工具从一主多备的数据库中移除不需要的备机，最多可以删除到只剩下单机，本文从一主两备缩容到一主一备。**

### 扩容注意事项

- 扩容后不会自动更新 synchronous_standby_names 参数。如果需要为该参数增加扩容的机器，请在扩容完成后手动更新。
- 扩容级联备之前要确保原集群中有处于同一 AZ（Available Zone）且状态正常的备机，或扩容级联备的同时也扩容了处于同 AZ 的备机。
- 对数据库集群进行扩容前，需要关注主机及新扩容节点 CPU、IO、网络等情况，不建议在硬件压力较大时执行扩容，否则可能导致扩容耗时较长甚至扩容失败。
- 当原集群数据量较大时，在进行扩容操作前应当在主机上先执行 checkpoint，否则可能导致扩容耗时较长甚至扩容失败。
- 在单节点扩容时，如果节点 hot_standby 被关闭过，则需要在每个备节点上也按照如下流程修改
  - 备节点需要先修改 wal_level 大于等于 hot_standby 后重启
  - 然后再修改 hot_standby 为 on 重启，之后主机扩容才能成功。否则扩容时备机会启动失败

### 扩容前提条件

- 数据库主机上存在 MogDB 镜像包，解压镜像包后，在 script 目录下执行./gs_expansion 命令进行扩容。
- 在新增的扩容备机上创建好与主机上相同的用户和用户组。
- 已存在的数据库节点和新增的扩容节点之间需要建立好 root 用户互信以及数据库管理用户（如 omm）的互信。
- 正确配置 xml 文件，在已安装数据库配置文件的基础上，添加需要扩容的备机信息。
- 只能使用 root 用户执行 gs_expansion 命令。
- 不允许同时在主节点上执行 gs_dropnode 命令删除其他备机。
- 执行扩容命令前需要通过 source 命令导入主机数据库的环境变量。如果当前数据库是分离环境变量方式安装，则 source 导入分离的环境变量。如果未进行分离，则需要 source 导入子用户的.bashrc 配置文件。一般该文件路径为：/home/[user]/.bashrc。
- 扩容备机的操作系统与主机保持一致。
- 操作过程中不允许同时在其他备节点上执行主备倒换或者故障倒换的操作。
- 不允许同时执行 2 次相同的 gs_expansion 命令。
- 扩容备节点的操作只能在主节点上执行。

### 缩容注意事项

- 从主备数据库实例中移除当前仍可连通的备机时，会自动停止目标备机上正在运行的数据库服务，并删除备机上的 GRPC 证书（证书位置：$GAUSSHOME/share/sslcert/grpc/），但是不会删除备机上的应用。
  如果删除后数据库实例中只剩下一个主机时，会提示建议重启当前主机，此时建议用户根据当前业务运行环境重启主机。
- 如果目标备机在执行操作前处于不可连通的状态，需要用户在目标备机恢复后手动停止或删除目标备机的数据库服务，并删除备机上的 GRPC 证书（证书位置：$GAUSSHOME/share/sslcert/grpc/）。
- 仅支持使用 om 方式安装的主备数据库实例中移除备机，不支持使用编译方式安装组建的主备数据库。
- 当移除的备机处于同步复制模式时，如果执行删除命令的同时主机上存在事务操作，事务提交时会出现短暂卡顿，删除完成后事务处理可继续。
- 当目标备机被移除后，如果暂时不确定是否需要目标备机，可以选择如下方法拒绝从目标备机的远程 ssh 连接，避免在目标备机上的误操作。
  - 方式一：在当前主机上使用 root 用户修改/etc/ssh/sshd_config 文件，添加如下记录（如果已存在 DenyUsers 记录，请在后面追加）DenyUsers omm@xx.xx.xx.xx,修改后需要重启 ssh 服务使其生效，修改后限制从目标备机不能使用 omm 用户远程到该主机。
  - 方式二：在当前主机上将目标备机加入到/etc/hosts.deny 文件中（例如：sshd:10.11.12.13:deny），拒绝从目标备机的远程 ssh 连接（对所有用户生效），此方法需要系统 sshd 服务绑定到 libwrap 库。
    - 当目标备机被移除后，如果不再需要目标备机，请在目标备机上使用 gs_uninstall -delete-data -L 命令单点卸载，请注意务必添加-L 选项。
    - 当目标备机被移除后，如果需要以单机方式使用目标备机且保留原数据，请在目标备机上先执行 gs_guc set -D /gaussdb/data/dbnode -c “replconninfoX”，其中/gaussdb/data/dbnode 表示数据目录，replconninfoX 表示主备集群中的除本节点外的其他节点，比如一主一备则需要配置 replconninfo1, 一主两备需要配置 replconninfo1 和 replconninfo2, 以此类推；如果无需保留原数据，请先执行 gs_uninstall -delete-data -L 命令卸载后重新安装。
- 当目标备机被移除后，如果需要以备机方式使用目标备机，请参考 gs_expansion 命令重新将目标备机添加到集群中。

### 缩容前提条件

- 删除备节点的操作只能在主节点上执行。
- 操作过程中不允许同时在其他备节点上执行主备倒换或者故障倒换的操作。
- 不允许同时在主节点上执行 gs_expansion 命令进行扩容。
- 不允许同时执行 2 次相同的 gs_dropnode 命令。
- 执行删除操作前，需要确保主节点和备节点之间建立好 omm 用户（数据库管理用户）的互信。
- 需要使用数据库管理用户（比如 omm）执行该命令。
- 执行命令前需要通过 source 命令导入主机数据库的环境变量。如果当前数据库是分离环境变量方式安装，则 source 导入分离的环境变量。如果未进行分离，则需要 source 导入子用户的.bashrc 配置文件。一般该文件路径为：/home/[user]/.bashrc.

_在新节点进行相关配置_

## 二、关闭防火墙 selinux

```
[root@test3 ~]# setenforce 0
[root@test3 ~]# sed -i '/^SELINUX=/c'SELINUX=disabled /etc/selinux/config
[root@test3 ~]# systemctl disable firewalld.service
[root@test3 ~]# systemctl stop firewalld.service
```

## 三、创建用户和组

```
[root@test3 ~]# groupadd -g 1001 dbgrp
[root@test3 ~]# useradd -g dbgrp omm
[root@test3 ~]# passwd omm
```

## 四、配置三个节点的互信

```
[root@test3 ~]# ssh-keygen
[root@test3 ~]# ssh-copy-id xx.xxx.xx.xx
[root@test3 ~]# ssh-copy-id xx.xxx.xx.xx
```

**其余两机器一样**

## 五、安装 Python3 及依赖包

```
[root@test3 ~]# yum install -y libaio-devel gcc gcc-c++ zlib-devel expect
[root@test3 ~]# mkdir -p /usr/local/python3
[root@test3 ~]# tar -zxvf Python-3.6.5.tgz
[root@test3 ~]# cd Python-3.6.5
[root@test3 ~]# ./configure --prefix=/usr/local/python3 --enable-shared CFLAGS=-fPIC && make && make install
[root@test3 ~]# ln -s /usr/local/python3/bin/python3 /usr/bin/python3
[root@test3 ~]# ln -s /usr/local/python3/bin/pip3 /usr/bin/pip3
[root@test3 ~]# cp /usr/local/python3/lib/libpython3.6m.so.1.0 /lib64/
```

_在主库进行相关配置_

## 六、编写 clusterconfig.xml

- 添加新节点信息

```
[omm@test1 script]$ cat clusterconfig.xml
<?xml version="1.0" encoding="UTF-8"?>
<ROOT>
    <!-- MogDB整体信息 -->
    <CLUSTER>
        <!-- 数据库名称 -->
        <PARAM name="clusterName" value="test" />
        <!-- 数据库节点名称(hostname) -->
        <PARAM name="nodeNames" value="test1,test2,test3" />
        <!-- 数据库安装目录-->
        <PARAM name="gaussdbAppPath" value="/dbdata/app/mogdb" />
        <!-- 日志目录-->
        <PARAM name="gaussdbLogPath" value="/dbdata/log" />
        <!-- 临时文件目录-->
        <PARAM name="tmpMppdbPath" value="/dbdata/mogdb/tmp"/>
        <!-- 数据库工具目录-->
        <PARAM name="gaussdbToolPath" value="/dbdata/mogdb/om" />
        <!-- 数据库core文件目录-->
        <PARAM name="corePath" value="/dbdata/mogdb/corefile"/>
        <!-- 节点IP，与数据库节点名称列表一一对应 -->
        <PARAM name="backIp1s" value="xx.xxx.xx.xx,xx.xxx.xx.xx,xx.xxx.xx.xx"/>
    </CLUSTER>
    <!-- 每台服务器上的节点部署信息 -->
    <DEVICELIST>
        <!-- 节点1上的部署信息 -->
        <DEVICE sn="test1">
            <!-- 节点1的主机名称 -->
            <PARAM name="name" value="test1"/>
            <!-- 节点1所在的AZ及AZ优先级 -->
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <!-- 节点1的IP，如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
            <PARAM name="backIp1" value="xx.xxx.xx.xx"/>
            <PARAM name="sshIp1" value="xx.xxx.xx.xx"/>

      <!--dn-->
            <PARAM name="dataNum" value="1"/>
      <PARAM name="dataPortBase" value="26000"/>
      <PARAM name="dataNode1" value="/dbdata/data,test2,/dbdata/data/,test3,/dbdata/data/"/>
      <!--数据库主节点上的xlog目录，及备机xlog目录-->
       <PARAM name="dataNodeXlogPath1" value="/dbdata/xlog,/dbdata/xlog,/dbdata/xlog "/>
            <PARAM name="dataNode1_syncNum" value="0"/>
        </DEVICE>

        <!-- 节点2上的节点部署信息，其中“name”的值配置为主机名称 -->
        <DEVICE sn="test2">
            <!-- 节点2的主机名称 -->
            <PARAM name="name" value="test2"/>
            <!-- 节点2所在的AZ及AZ优先级 -->
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <!-- 节点2的IP，如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
            <PARAM name="backIp1" value="xx.xxx.xx.xx"/>
            <PARAM name="sshIp1" value="xx.xxx.xx.xx"/>
  </DEVICE>

        <!-- 节点3上的节点部署信息，其中“name”的值配置为主机名称 -->
        <DEVICE sn="test3">
            <!-- 节点3的主机名称 -->
            <PARAM name="name" value="test3"/>
            <!-- 节点3所在的AZ及AZ优先级 -->
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <!-- 节点2的IP，如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
            <PARAM name="backIp1" value="xx.xxx.xx.xx"/>
            <PARAM name="sshIp1" value="xx.xxx.xx.xx"/>
  </DEVICE>
    </DEVICELIST>
</ROOT>
```

## 七、扩容

```
[root@test1 script]# ./gs_expansion -U omm -G dbgrp -X clusterconfig.xml -h xx.xxx.xx.xx
Start expansion without cluster manager component.
Start to preinstall database on new nodes.
Start to send soft to each standby nodes.
End to send soft to each standby nodes.
Start to preinstall database step.
Preinstall xx.xxx.xx.xx success
End to preinstall database step.
End to preinstall database on new nodes.

Start to install database on new nodes.
Installing database on node xx.xxx.xx.xx:
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
The sslcert will be generated in /dbdata/app/mogdb/share/sslcert/om
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
xx.xxx.xx.xx install success.
Finish to install database on all nodes.
Database on standby nodes installed finished.

Checking mogdb and gs_om version.
End to check mogdb and gs_om version.

Start to establish the relationship.
Start to build standby xx.xxx.xx.xx.
Build standby xx.xxx.xx.xx success.
Start to generate and send cluster static file.
End to generate and send cluster static file.

Expansion results:
xx.xxx.xx.xx:   Success
Expansion Finish.
[omm@test1 ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

    node          node_ip         port      instance             state
--------------------------------------------------------------------------------------
1  test1 xx.xxx.xx.xx    26000      6001 /dbdata/data   P Primary Normal
2  test2 xx.xxx.xx.xx    26000      6002 /dbdata/data   S Standby Normal
3  test3 xx.xxx.xx.xx    26000      6003 /dbdata/data   S Standby Normal
```

## 八、缩容

```
[omm@test1 ~]$ gs_dropnode -U omm -G dbgrp -h xx.xxx.xx.xx
The target node to be dropped is (['sticmesdbtest3'])
Do you want to continue to drop the target node (yes/no)?yes
Drop node start without CM node.
[gs_dropnode]Start to drop nodes of the cluster.
[gs_dropnode]Start to stop the target node sticmesdbtest3.
[gs_dropnode]End of stop the target node sticmesdbtest3.
[gs_dropnode]Start to backup parameter config file on test1.
[gs_dropnode]End to backup parameter config file on test1.
[gs_dropnode]The backup file of test1 is /dbdata/mogdb/tmp/gs_dropnode_backup20220804104024/parameter_test1.tar
[gs_dropnode]Start to parse parameter config file on test1.
[gs_dropnode]End to parse parameter config file on test1.
[gs_dropnode]Start to parse backup parameter config file on test1.
[gs_dropnode]End to parse backup parameter config file test1.
[gs_dropnode]Start to set openGauss config file on test1.
[gs_dropnode]End of set openGauss config file on test1.
[gs_dropnode]Start to backup parameter config file on test2.
[gs_dropnode]End to backup parameter config file on test2.
[gs_dropnode]The backup file of test2 is /dbdata/mogdb/tmp/gs_dropnode_backup20220804104026/parameter_test2.tar
[gs_dropnode]Start to parse parameter config file on test2.
[gs_dropnode]End to parse parameter config file on test2.
[gs_dropnode]Start to parse backup parameter config file on test2.
[gs_dropnode]End to parse backup parameter config file test2.
[gs_dropnode]Start to set openGauss config file on test2.
[gs_dropnode]End of set openGauss config file on test2.
[gs_dropnode]Start of set pg_hba config file on test1.
[gs_dropnode]End of set pg_hba config file on test1.
[gs_dropnode]Start of set pg_hba config file on test2.
[gs_dropnode]End of set pg_hba config file on test2.
[gs_dropnode]Start to set repl slot on test1.
[gs_dropnode]Start to get repl slot on test1.
[gs_dropnode]End of set repl slot on test1.
[gs_dropnode]Start to modify the cluster static conf.
[gs_dropnode]End of modify the cluster static conf.
[gs_dropnode]Success to drop the target nodes.
[omm@test1 ~]$  gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

    node          node_ip         port      instance             state
--------------------------------------------------------------------------------------
1  test1 xx.xxx.xx.xx    26000      6001 /dbdata/data   P Primary Normal
2  test2 xx.xxx.xx.xx    26000      6002 /dbdata/data   S Standby Normal
```
