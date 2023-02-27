---
title: 'patroniForOpenGauss高可用方案基本原理'
date: '2021-09-01'
category: 'blog'
tags: ['openGauss分布式解决方案']
archives: '2021-09-01'
author: 'xuemengen'
summary: 'patroniForOpenGauss高可用方案基本原理'
img: '/zh/blogs/xuemengen/title/img.png'
times: '9:30'
---

## 1 patroni 简介

Patroni 是一个由 Zalando 研发的，完全由 python 开发的开源产品，其能够通过分布式存储系统（Distributed configuration system, DCS）来检测存储数据库集群各个节点的状态和配置，并且能够对数据库集群进行自动管理和故障切换。

## 2 patroni 原理介绍

一个高可用集群由 patroni、DCS 和数据库组成，本方案中 DCS 选用 etcd，数据库为 openGauss。  
　　 etcd 是一个分布式键值对存储，设计用来可靠而快速的保存关键数据并提供访问，通过分布式锁，leader 选举和写屏障(write barriers)来实现可靠的分布式协作，etcd 集群是为高可用，持久性数据存储和检索而准备。  
　　 patroni 通过一个 api 接口连接到 etcd，向其插入键值对记录 patroni 参数、数据库参数、主备信息以及连接信息，平常通过 etcd 对其它节点做心跳检测，通过从 etcd 获取键值对中存储的主备信息来判断各节点的状态对集群进行自动管理，其基本原理如下图所示。  
<img src='./image/patroni_principle.png'>  
　　如图所示，同一时刻最多只能有一个 patroni 节点成为 leader，即最多只能有一个 patroni 节点能够持有 leader 锁，因此能够避免脑裂的发生。
当前 patroni-for-openGauss 支持修复的故障场景如下：

1. 主数据库意外停止，但可以通过重启恢复，立即自动启动主数据库；
2. 主数据库意外故障，且无法启动，首先当前主机释放 leader 锁降备，然后自动选择一个最健康的备机即同步情况与主机最接近的备机，提升为主机；
3. 备库意外挂机，重启后可立即恢复正常并与主机连接，则立即进行重启恢复；
4. 备库意外故障，可正常启动但是启动后落后于主机状态 ，则对其进行重建操作以恢复其状态。
