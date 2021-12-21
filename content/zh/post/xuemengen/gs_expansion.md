+++
title = "openGauss数据库扩容指导"
date = "2021-12-20"
tags = ["openGauss数据库扩容指导"]
archives = "2021-12-20"
author = "xuemengen"
summary = "openGauss数据库扩容指导"
img = "/zh/post/xuemengen/title/img1.png"
times = "20:00"
+++

## 前置条件  
当前集群状态正常  
## 操作步骤  
1、新节点创建用户和用户组，注意需要与当前集群的用户与用户组一致，密码也要保持一致。假设当前集群用户为omm。  
2、检查新节点环境变量，清理和openGauss相关的环境变量配置。主要检查/etc/profile和/home/omm/.bashrc两个文件。如果清理不干净，会导致扩容不成功。或者提示待扩容备机节点已经安装。  
3、在主节点准备与当前主节点版本相同的安装包并解压，进入script目录。  
4、创建主节点与其他节点互信，包括root用户和omm用户，可以使用opengauss提供的工具`gs_sshexkey`创建互信。  
```
./gs_sshexkey -f /home/omm/hostfile
```
集群内所有的ip，每个ip及主机名一行：
```
192.168.1.1
192.168.1.2
192.168.1.3
Host1
Host2
Host3
```

执行结果提示如下代表互信建立成功
```
Successfully distributed SSH trust file to all node.
Verifying SSH trust on all hosts.
Successfully verified SSH trust on all hosts.
Successfully created SSH trust.
```
`注意：`  
如果是同一台机器恢复后再加入集群，需要清理root用户和omm用户的~/.ssh/know_host和~/.ssh/authorized_keys里的相关信息，否则创建互信会失败。
需要分别在root用户和omm用户下执行，各节点密码需要一致，后期可以再修改。
全新的机器需要安装python3。  
5、创建新的xml文件，将新节点信息加入其中。

6、执行扩容操作  
切换到root用户，务必要首先导入当前集群环境变量，`source /home/omm/env`
```
./gs_expansion -U omm -G dbgrp -h 192.168.1.2 -X ./clusterconfig.xml
```
最后显示如下
```
Expansion results:
192.168.1.2:     Success
Expansion Finish.
```
即扩容成功  
## 常见问题
如果数据量较大，建立主备联系过程可能较长，如果中途由于网络中断等原因导致建联失败，但是此时新节点的数据库是已经安装成功的，所以再次执行扩容的时候无需再次进行安装，需要在扩容命令末尾加上-L表示跳过安装过程