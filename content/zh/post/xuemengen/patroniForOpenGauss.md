+++
title = "patroniForOpenGauss高可用方案基本原理"
date = "2021-09-01"
tags = ["openGauss分布式解决方案"]
archives = "2021-09-01"
author = "xuemengen"
summary = "patroniForOpenGauss高可用方案基本原理"
img = "/zh/post/xuemengen/title/patroni_principle.png"
times = "9:30"
+++

# 1 patroni简介

　　Patroni是一个由Zalando研发的，完全由python开发的开源产品，其能够通过分布式存储系统（Distributed configuration system, DCS）来检测存储数据库集群各个节点的状态和配置，并且能够对数据库集群进行自动管理和故障切换。
# 2 patroni原理介绍

　　一个高可用集群由patroni、DCS和数据库组成，本方案中DCS选用etcd，数据库为openGauss。  
　　etcd是一个分布式键值对存储，设计用来可靠而快速的保存关键数据并提供访问，通过分布式锁，leader选举和写屏障(write barriers)来实现可靠的分布式协作，etcd集群是为高可用，持久性数据存储和检索而准备。  
　　patroni通过一个api接口连接到etcd，向其插入键值对记录patroni参数、数据库参数、主备信息以及连接信息，平常通过etcd对其它节点做心跳检测，通过从etcd获取键值对中存储的主备信息来判断各节点的状态对集群进行自动管理，其基本原理如下图所示。  
![patroni基本原理图](../images/patroni_principle.png#pic_center)  
　　如图所示，同一时刻最多只能有一个patroni节点成为leader，即最多只能有一个patroni节点能够持有leader锁，因此能够避免脑裂的发生。
集群会出现的四种主要的故障如下：
1. 主数据库意外停止，但可以通过重启恢复，立即自动启动主数据库；
2. 主数据库意外故障，且无法启动，首先当前主机释放leader锁降备，然后自动选择一个最健康的备机即同步情况与主机最接近的备机，提升为主机；
3. 备库意外挂机，重启后可立即恢复正常并与主机连接，则立即进行重启恢复；
4. 备库意外故障，可正常启动但是启动后落后于主机状态 ，则对其进行重建操作以恢复其状态。