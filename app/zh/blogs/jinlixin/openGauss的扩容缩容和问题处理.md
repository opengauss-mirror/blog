---
title: 'openGauss的扩容缩容和问题处理'

date: '2021-03-29'

category: 'blog'
tags: ['openGauss故障处理']

archives: '2021-03'

author: '金立新'

summary: 'openGauss的扩容缩容和问题处理'

img: '/zh/blogs/jinlixin/title/img5.png'

times: '12:30'
---

# openGauss 的扩容缩容和问题处理<a name="ZH-CN_TOPIC_0000001116438647"></a>

openGauss 提供了优秀的集群管理工具 gs_om,集群管理信息写在二进制文件中，从而牺牲了增加节点和摘除节点的便利性（相对 PG 而言）。好在 openGauss-1.1.0 提供了节点扩容和缩容的工具，gs_dropnode 和 gs_expansion。

生产主库服务器出现硬件故障，无法启动，所以需要摘除故障老主节点和新增一台备机，以恢复集群架构。

集群状态：主库无法访问，gs_om 显示主库 unknow,备机显示连接中。

操作：先将主节点切换至同步备机，使集群恢复正常。

在需要切换为新主库的节点执行命令：

```
gs_ctl failover -D /home/omm/dn1/
```

其中：/home/omm/dn1/为新主库的数据目录。

切换完成之后查看数据库状态是否正常。

```
gs_om -t status --detail
```

后续处理：

执行以下下命令清除坏死节点，避免对依赖 gs_om 的工具产生影响。

```
gs_dropnode -U omm -G dbgrp -h 192.168.1.1

```

说明：

- -U 指定集群的安装的用户
- -G 指定集群的安装用户的用户组
- -h 需要摘除的节点的 IP

摘除节点过程中产生的问题处理：目前社区官方 1.1.0 版本中的 gs_dropnode 执行时需要 gs_om 在每台机器上查询状态，服务器无法连接时会等待机器响应，导致超时，造成摘除节点卡死现象。与开发者沟通后，开发者会缩短等待无响应机器的时间为 10s，超时后不再等待坏死节点响应，直接更新正常节点的集群管理信息存储文件。需要在 gitee 里下载新的 gs_dropnode 脚本替换原脚本再执行。

新版本链接地址：https://gitee.com/struggle\_hw/openGauss-OM/blob/c0212048050453c57955b342dada5b6de6803622/script/gs\_dropnode

```
gs_dropnode -U omm -G dbgrp -h 192.168.1.1
```

如下图所示，摘除节点日志如下，成功。

```
[omm@kvm-yl1 ~]$ gs_dropnode -U omm -G dbgrp -h 192.168.122.92
The target node to be dropped is (['kvm-yl2'])
Do you want to continue to drop the target node (yes/no)? yes
The cluster will have only one standalone node left after the operation!
Do you want to continue to drop the target node (yes/no)? yes
[gs_dropnode]Start to drop nodes of the cluster.
[gs_dropnode]Start to stop the target node kvm-yl2.
[gs_dropnode]End of stop the target node kvm-yl2.
[gs_dropnode]Start to backup parameter config file on kvm-yl1.
[gs_dropnode]End to backup parameter config file on kvm-yl1.
[gs_dropnode]The backup file of kvm-yl1 is /tmp/gs_dropnode_backup20210223085218/parameter_kvm-yl1.tar
[gs_dropnode]Start to parse parameter config file on kvm-yl1.
[gs_dropnode]End to parse parameter config file on kvm-yl1.
[gs_dropnode]Start to parse backup parameter config file on kvm-yl1.
[gs_dropnode]End to parse backup parameter config file kvm-yl1.
[gs_dropnode]Start to set postgresql config file on kvm-yl1.
[gs_dropnode]End of set postgresql config file on kvm-yl1.
[gs_dropnode]Start to get repl slot on primary node.
[gs_dropnode]Start to set repl slot on primary node.
[gs_dropnode]End of set repl slot on primary node.
[gs_dropnode]Start of set pg_hba config file on kvm-yl1.
[gs_dropnode]End of set pg_hba config file on kvm-yl1.
[gs_dropnode]Start to modify the cluster static conf.
[gs_dropnode]End of modify the cluster static conf.
[gs_dropnode]Remove the dynamic conf.
Only one primary node is left.It is recommended to restart the node.
Do you want to restart the primary node now (yes/no)? yes
[gs_dropnode]Start to stop the target node kvm-yl1.
[gs_dropnode]End of stop the target node kvm-yl1.
[gs_dropnode]Start to start the target node.
[gs_dropnode]End of start the target node.
[gs_dropnode]Success to drop the target nodes.
```

tips：节点摘除之后，为了保证数据安全，被摘除节点的数据不会被清理，如果确定不需要，可以手动清理节点，执行清理本地数据命令并清理环境变量。

```
gs_uninstall --delete-data -L
```

扩容一台机器，以便于恢复集群原有架构。

1.  新节点创建 omm 用户和用户组 dbgrp。
2.  检查新节点环境变量，清理和 openGauss 相关的环境变量配置。主要检查/etc/profile 和/home/omm/.bashrc 两个文件。如果清理不干净，会导致扩容不成功。或者提示待扩容备机节点已经安装。
3.  创建互信，包括 root 和 omm 用户，这里使用 opengauss 提供的工具创建互信。
4.  如果是同一台机器恢复后再加入集群，需要清理 root 用户和 omm 用户的\~/.ssh/know_host 和\~/.ssh/authorized_keys 里的相关信息，都则创建互信会失败。
5.  分别在 root 用户和 omm 用户下执行，各节点密码需要一致，后期可以再修改。
6.  全新的机器需要安装 python3。

```
gs_sshexkey -f /home/omm/hostfile
```

执行结果提示如下代表成功

```
Successfully distributed SSH trust file to all node.
Verifying SSH trust on all hosts.
Successfully verified SSH trust on all hosts.
Successfully created SSH trust.
```

hostfile 如下：

集群内所有的 ip，每个 ip 一行：

```
cat hostfile
192.168.1.1
192.168.1.2
192.168.1.3
```

创建新的 xml 文件，将老节点剔除，新节点加入。

```
./gs_expansion -U omm -G dbgrp -h 192.168.122.92 -X ./clusterconfig.xml
```

扩容日志如下，代表扩容成功。

```
Start to preinstall database on the new standby nodes.
Successfully preinstall database on the new standby nodes.
Start to install database on the new standby nodes.
installing database on node 192.168.1.1:
Please enter the password of user [omm] on node [192.168.1.1]:
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
The sslcert will be generated in /data/opengauss/app/share/sslcert/om
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
Successfully install database on node ['192.168.1.1']
Database on standby nodes installed finished. Start to establish the primary-standby relationship.
Success to expansion standby nodes.
```

问题处理：扩容后，gs_om 显示新备机状态异常的情况，可能有以下几种情况：

1.  集群数据目录比较大，导致扩容脚本超时后，备机执行 build 还未执行完毕，需要等待备机执行完。
2.  扩容过程中，主库配置文件更新失败，需要检查 postgresql.conf 文件的 replconninfo 和 hba 的集群内状态是否正常。
