+++
title = "openGauss使能paxos特性实践"

date = "2021-10-21"

tags = ["openGauss使能paxos特性"]

archives = "2021-10"

author = "yanghaiyan"

summary = "openGauss使能paxos"

img = "/zh/post/yanghaiyan/title/img1.png"

times = "17:00"
+++

# openGauss使能paxos特性实践

#### 前言
GaussDB(for openGauss)推出了基于Paxos协议的DCF高可用组件，该组件使得GaussDB(for openGauss)在保证数据一致性的同时，在高可用方面可进一步得到增强，包括：
(1)通过自仲裁、多数派选主能力摆脱第三方仲裁组件，极大缩短RTO时间，且可预防任何故障下的脑裂双主；
(2)支持节点同步、同异步混合部署的多集群部署模式；
(3)提升主备间节点日志复制效率，提升系统的最大吞吐能力。
借助GaussDB(for openGauss)的DCF高可用组件，用户不仅可以免去系统脑裂的风险，还可以提升可用性。
#### 社区版本说明
GaussDB(for openGauss)当前930开源计划已实施，包括正式推出了基于Paxos协议的DCF高可用组件内核新特性; 在此本文详细说明了openGauss使能paxos特性实践操作流程,让用户通过自适配能够使能paxos特性，体检集群高可用增强能力。

#### 使能paxos特性实践
##### 1、安装适配
- 从官方社区下载最新2.1.0版本（当前已发布版本支持centos_x86_64、openeuler_aarch64、openeuler_x86_64环境），同一般安装流程解压缩；<br>
- 修改initdb配置参数(增加-c参数)，使能dn创建paxosIndex信息文件；具体的修改文件路径：
script/gspylib/component/Kernel/DN_OLAP/DN_OLAP.py；修改函数：initInstance<br>
修改示例：
```c{.line-num}
cmd = "%s/gs_initdb --locale=C -D %s -X %s --nodename=%s %s  -c  -C %s"
```
- 预置和正式安装
（备注： 如果本地是euler2.9环境，当前社区版本安装过程遇到互信建立问题（ssh不支持rsa），可将script/gs_sshexkey文件中的 -t rsa改成-t ed25519）
##### 2、使能paxos dcf相关配置
通过修改postgresql.conf文件配置使能paxos dcf特性<br>
配置示例（在此以集群3节点配置为例, 注意每个节点都需要修改该配置）:
```c{.line-num}
(1. 使能dcf特性开关)
enable_dcf = on  
(2. 当前节点id, 如果集群为3节点则每个节点可分别配置为1、2、3)
dcf_node_id = 3  
(3. 指定dcf数据目录)
dcf_data_path = '/xxx/cluster/data1/dn1/dcf_data'  
(4. 指定dcf集群配置信息，每个节点上dcf_config内容一致，其中配置的ip/端口用于新指定dcf节点间通信链路信息，注意与其他已使用的ip/端口不要配置冲突)
dcf_config = '[{"stream_id":1,"node_id":1,"ip":"x.x.x.21","port":xx,"role":"LEADER"},{"stream_id":1,"node_id":2,"ip":"x.x.x.22","port":xx,"role":"FOLLOWER"},{"stream_id":1,"node_id":3,"ip":"x.x.x.23","port":xx,"role":"FOLLOWER"}]'
```
##### 3、集群paxos模式运行
重启集群，此时由于涉及到quorum到dcf模式切换，集群节点启动参数变更和可能的build过程误触发，在此通过以下手动启动和操作流程来恢复集群paxos模式正常运行;
- 手动启动节点1并且设置为少数派模式运行
```c{.line-num}
/xxx/cluster_app/app/bin/gaussdb -D /xxx/cluster/data1/dn1 -M standby &
gs_ctl setrunmode -D PATH  -v 1 -x minority
```
- 集群其他节点主动重建拉起
```c{.line-num}
gs_ctl build -b full -Z single_node -D PATH
```
- 节点1重回多数派
```c{.line-num}
gs_ctl setrunmode -D PATH -x normal
```
至此，集群已经可以paxos多数派模式正常运行，对外提供服务了；
- 状态信息验证查询
```c{.line-num}
gs_ctl query -D PATH
```
通过该指令可以验证查询到本节点HA状态和Paxos复制状态相关信息。