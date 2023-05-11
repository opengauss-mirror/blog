---
title: 'openGauss使能paxos特性实践'

date: '2021-10-21'

category: 'blog'
tags: ['openGauss使能paxos特性']

archives: '2021-10'

author: 'yanghaiyan'

summary: 'openGauss使能paxos'

img: '/zh/blogs/yanghaiyan/title/img1.png'

times: '17:00'
---

# openGauss 使能 paxos 特性实践

#### 前言

GaussDB(for openGauss)推出了基于 Paxos 协议的 DCF 高可用组件，该组件使得 GaussDB(for openGauss)在保证数据一致性的同时，在高可用方面可进一步得到增强，包括：
(1)通过自仲裁、多数派选主能力摆脱第三方仲裁组件，极大缩短 RTO 时间，且可预防任何故障下的脑裂双主；
(2)支持节点同步、同异步混合部署的多集群部署模式；
(3)提升主备间节点日志复制效率，提升系统的最大吞吐能力。
借助 GaussDB(for openGauss)的 DCF 高可用组件，用户不仅可以免去系统脑裂的风险，还可以提升可用性。

#### 社区版本说明

GaussDB(for openGauss)当前 930 开源计划已实施，包括正式推出了基于 Paxos 协议的 DCF 高可用组件内核新特性; 在此本文详细说明了 openGauss 使能 paxos 特性实践操作流程,让用户通过自适配能够使能 paxos 特性，体检集群高可用增强能力。

#### 使能 paxos 特性实践

##### 1、版本下载与安装

1.  从官方社区下载最新 2.1.0 版本

    下载链接：[https://opengauss.org/zh/download/](http://)

2.  创建配置文件和解压缩安装包

    具体可参考 openGauss 安装流程: [https://gitee.com/opengauss/openGauss-server#%E5%AE%89%E8%A3%85）](http://)

3.  初始化安装环境：修改 initdb 配置参数(增加-c 参数，使能 dn 创建 paxosIndex 信息文件)

    具体的修改文件: script/gspylib/component/Kernel/DN_OLAP/DN_OLAP.py；修改函数：initInstance(搜索关键字“gs_initdb”有两处 match 位置)

    修改示例：

```c{.line-num}
cmd = "%s/gs_initdb --locale=C -D %s -X %s --nodename=%s %s  -c  -C %s"
```

4.  执行预安装和正式安装

##### 2、使能 DCF 配置

1.  进入到 DN 目录，通过修改 postgresql.conf 文件配置使能 paxos dcf 特性

    配置示例（在此以集群 3 节点配置为例, **注意：每个节点均需要修改** ）:

```c{.line-num}
#1. 使能dcf特性开关
enable_dcf = on
#2. 当前节点id, 如果集群为3节点则每个节点可分别配置为1、2、3
dcf_node_id = 1
#3. 指定dcf数据目录
dcf_data_path = '/xxx/cluster/data1/dn1/dcf_data'
#4. 指定dcf集群配置信息，每个节点上dcf_config内容一致，其中配置的ip/端口专用于dcf节点间通信链路，注意与所有其他已使用的ip/端口不要配置冲突
dcf_config = '[{"stream_id":1,"node_id":1,"ip":"x.x.x.21","port":xx,"role":"LEADER"},{"stream_id":1,"node_id":2,"ip":"x.x.x.22","port":xx,"role":"FOLLOWER"},{"stream_id":1,"node_id":3,"ip":"x.x.x.23","port":xx,"role":"FOLLOWER"}]'
```

##### 3、集群 DCF 模式运行

- 切换到用户角色，依次启动节点 1/2/3：

```c{.line-num}
gaussdb -D /xxx/cluster/data1/dn1 -M standby &
```

待集群多数派节点启动成功后，即可以 paxos 模式运行；

通过：gs_om -t status --detail 指令可查询节点状态信息；

##### 4、（可选）集群故障模式恢复参考

集群故障模式下，可通过以下少数派和重建流程来恢复集群 paxos 模式正常运行：

- 手动设置存活节点为少数派模式运行

```c{.line-num}
gs_ctl setrunmode -D PATH  -v 1 -x minority
```

- 集群其他节点主动重建拉起

```c{.line-num}
gs_ctl build -b full -Z single_node -D PATH
```

- 存活节点重回多数派

```c{.line-num}
gs_ctl setrunmode -D PATH -x normal
```

至此，集群已经可以 paxos 多数派模式正常运行，对外提供服务了；

- 状态信息验证查询

```c{.line-num}
gs_ctl query -D PATH
```

通过该指令可以验证查询到本节点 HA 状态和 Paxos 复制状态相关信息。
