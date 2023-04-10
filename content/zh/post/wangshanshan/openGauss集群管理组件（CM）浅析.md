+++
title = "openGauss集群管理组件（CM）浅析"
date = "2023-04-10"
tags = ["openGauss社区开发入门"]
archives = "2023-04"
author = "wangshanshan"
summary = "openGauss集群管理组件（CM）浅析"
img = "/zh/post/wangshanshan/title/img.png"
times = "10:30"

+++

openGauss作为面向OLTP业务的关系型数据库，在主备集群模式下，如何实现对节点的监控，感知故障，实现自动主备切换，保证集群的高可用，是至关重要的，相信大家也非常感兴趣，下面我们就一起来揭秘openGauss集群管理组件Cluster Manager。

## **【1. 简介】**

Cluster Manager（CM）是openGauss集群管理组件，是openGauss集群高可用的保障。CM的主要功能有：

	- 数据库主备节点状态监控，故障自动主备切换
	- 网络通信故障、文件系统故障等故障监控
	- 支持集群、节点查询、配置、操作等

此外，还支持自定义资源纳管，如分布式中间件ShardingSphere等。

### **1.1 高可用组网**

CM组件包含CM Agent（CMA），CM Server（CMS），OM Monitor（CMM）三个核心模块。为保证openGauss节点（DN）的高可用，需要满足以下组网条件：

	- 每个节点都需要部署CMM、CMA：CMM监控本节点CMA实例；CMA监控本节点的DN、CMS实例，采集信息上报CMS主
	- CMS、DN不需要每个节点都部署
	- CMS、DN实例组成各自的集群
	- CMS集群实个数>=3，基于Quorum协议实现自仲裁，以及DN仲裁，需要保证一半以上实例存活

openGauss 3.0.0推荐的高可用部署方案为一主两备，组网如下图所示。除此之外，CM还支持双中心组网方案，并支持优先同中心选主。

![1681094076324](/zh/post/wangshanshan/images/1681094076324.png)

### **1.2 进程保活机制**

CM组件包含cm_server，cm_agent，以及om_monitor三个进程，分别为CMS、CMA，以及CMM模块。openGauss（DN）进程为gaussdb。如下图所示：

![img](/zh/post/wangshanshan/images/wps1.jpg) 

**DN、CMS保活：由CMA来负责**

CMA每秒检查一次DN、CMS健康状态。若进程不存在，拉起进程；通过检查DN、CMS进程状态，以及时间阈值内多次查询检测进程是否僵死，并负责杀死僵死进程，重新拉起。

**CMA保活：由CMM来负责**

CMM每秒检查一次CMA健康状态。若进程不存在，拉起进程；若进程僵死，则杀死僵死进程，重新拉起。

**CMM保活：由系统定时任务来兜底**

系统定时任务每分钟第0秒执行一次。若进程不存在，下一轮定时任务执行时拉起进程；若进程僵死，则下一轮定时任务执行时杀死僵死进程，再下一轮重新拉起。

![img](/zh/post/wangshanshan/images/wps2.jpg) 

## **【2. 主要模块及功能】**

CM组件整体架构，以及模块核心功能如下图所示：

![img](/zh/post/wangshanshan/images/wps3.jpg) 

### **2.1 CM Agent**

CM Agent在多线程模式下，实现对本地DN、CMS的看护，以及CMS与DN的交互。主要功能如下：

**检查保持与CMS主的连接**

CMA的ConnCmsPMain线程负责循环检查与CMS主的连接状态，检查的间隔AGENT_RECV_CYCLE为200ms。若连接不存在，则重新建立连接。

**检查与所有peer DN的连接**

CMA的DNConnectionStatusCheckMain线程负责循环ping所有peer DN节点，检查的间隔由agent_report_interval参数控制，默认为1s。若与所有peer DN节点断连，且本节点为DN主，则上报CMS，并杀死本节点DN，CMS将启动DN仲裁。

**检查上报DN的状态**

CMA的DNStatusCheckMain线程负责循环检查DN状态，检查的间隔由agent_report_interval参数控制，默认为1s。若进程不存在，则上报CMS，并拉起进程，CMS仲裁模块将启动DN仲裁。

**检查上报CMS的状态**

CMA同样循环检测本节点CMS状态，每次检查的间隔为1s。若进程不存在，则上报CMS，并拉起进程，CMS HA模块将启动主备自仲裁。若进程出现T状态，则判定为进程僵死，则将僵死情况上报CMS，并杀死进程，重新拉起，CMS HA模块也将启动主备自仲裁。

**检测磁盘使用率、磁盘故障**

CMA通过在数据、日志路径下创建临时文件，进行读写测试（fopen，fwrite，fread），来检测DN、CMS磁盘故障，若出现失败，则将disc damage状态上报CMS。

**检测CPU、MEM、磁盘IO使用率**

CMA还负责检测节点cpu、mem，以及所有磁盘io使用是否达阈值。

**检测进程僵死**

CMA的DNPhonyDeadStatusCheckMain线程负责循环检测DN、CMS进程是否僵死，检测的间隔由agent_phony_dead_check_interval参数控制，默认为10s，其中包含检测时间。

若DN进程出现T、D、Z状态，则判定为进程僵死，将T、Z状态上报CMS，若为T状态，则将检测间隔更新为36s。若非以上状态，则连接数据库，执行查询语句，若执行失败，则判定为进程僵死。当上报次数达到阈值，CMS仲裁模块将启动僵死处理。

**向CMS主上报消息**

CMA的SendCmsMsgMain线程负责循环将DN、CMS状态上报CMS主，每次上报的间隔为200ms。

**处理CMS主下发的命令**

CMA同时负责接收并处理CMS下发的命令，根据命令类型，执行对DN的操作。

### **2.2 CM Server**

CM Server通过CMA是实现与DN的交互。CMS集群基于Quorum协议，实现对DN集群的仲裁选主，以及自仲裁。核心功能如下：

**处理DN节点仲裁**

服务线程接收CMA定时上报的DN节点状态，感知DN异常。若为主故障，则启动仲裁，确定候选DN后，启动升主流程。若进程被判定为僵死，则进行僵死处理，若僵死进程为主节点，处理完成后，进入仲裁选主。

**处理CMS节点自仲裁**

服务线程接收CMA定时上报的CMS节点状态，感知CMS故障，若为主故障，则根据Quorum协议实现CMS集群选主。

**处理存储达阈值、磁盘故障**

服务线程接收CMA定时上报的DN数据、日志路径磁盘使用情况，循环处理，间隔由datastorage_threshold_check_interval参数控制，默认为10s，每分钟输出检测日志。

当磁盘用量超过只读阈值的80%（只读阈值由datastorage_threshold_value_check控制，默认为85%）时，发送预告警，否则清除预告警。当超过只读阈值时，则向所有DN实例发送只读命令（通过CMA），发送只读告警，否则清除所有DN实例只读命令状态（通过CMA），清除只读告警。

需要注意的是，只读状态为集群级设置，因此集群中任何一个节点磁盘使用达到阈值，集群都会被设置为只读模式，导致写请求返回失败。

![img](/zh/post/wangshanshan/images/wps4.jpg) 

![img](/zh/post/wangshanshan/images/wps5.jpg) 

## **【3. 常见故障场景处理】**

下面介绍常见故障场景下，CM的处理流程。

### **3.1 主节点故障处理**

CM故障处理由状态驱动。主节点故障的主要状态，以及相应的处理流程如下：

**状态1：感知到DN主故障**

**1. 向所有DN备发送LOCK1命令**

LOCK1成功的条件为：

	- DN备与DN主复制链路永久断开，并不再主动重连
	- DN备完成全部日志回放，并不再新增

**2. 定候选DN备**

	- 获取DN仲裁所需信息
	- 根据信息确定候选DN备：判断原主是否满足候选条件。若原主不满足,则从其他DN备中选择

候选DN备的选择策略为：

	- 发送Failover命令次数未达到上限（MAX_SEND_FAILOVER_TIMES=3）
	- 已进入LOCK1状态
	- 选择日志最多的同步备：Term和LSN最新

当多个DN满足条件时，选择顺序为：原主同AZ的备 > AZ ID顺序 > node ID顺序

**状态2：检测到过半DN备进入LOCK1状态（Quorum协议，>=(n+1)/2）**

向候选DN备发送Failover命令。若候选DN备不是原主，则等待6s（6轮仲裁，每轮约1s）。若候选DN备不是同AZ，则等待delay_arbitrate_timeout轮仲裁（默认为0），该配置用于配置优先同AZ选主策略。

**状态3：检测到新DN主升主成功**

若DN主处于LOCK1状态，则向其发送UNLOCK命令。若DN备处于LOCK1状态，则向其发送LOCK2命令，更新主IP，使其连接新主，完成后，向其发送UNLOCK命令。

### **3.2 主节点僵死处理**

前面提到，CMA负责循环检测DN进程是否僵死，若DN进程出现T、D、Z状态，则判定为进程僵死，上报CMS。当CMA上报进程僵死次数大于等于phony_dead_effective_time（默认为5次）时，CMS开始处理僵死，重启僵死DN。完成后，CMS标记完成僵死处理，并将延迟处理僵死时间由初始值0s更新为instance_phony_dead_restart_interval（默认为21600s，6小时，至少设置为1800s），从设置时间点开始递减，为下次处理僵死需要等待的时间。此时集群进入无主状态，启动主故障处理。

下面为1主4备，3+2双中心组网方案下，一次CM感知与处理DN主进程僵死的关键日志，全流程耗时157s：

![1681102910353](/zh/post/wangshanshan/images/1681102910353.png)

![1681103140932](/zh/post/wangshanshan/images/1681103140932.png)

![1681103317706](/zh/post/wangshanshan/images/1681103317706.png)

### **3.3 脑裂预防**

CM认为集群的正常状态为CMA正常定时上报DN主状态，否则为异常状态，如：

**CMA不能上报，DN主存在，且与DN备连接正常**

首先CMS认为主故障，启动选主。由于DN主与备机连接正常，会导致备机LOCK1失败。超时后CMS将通过SSH向DN主远程发送KILL命令，杀死原主，选主流程正常进行。超时阈值设置的公式为：

cmsNum * agent_connect_timeout * agent_connect_retries + agent_heartbeat_timeout + 10，默认为3 * 1 * 15 + 8 + 10=63s。

**CMA不能上报，DN主存在，但与DN备断连**

此时CMS认为主故障，启动选主。若完成升主后，CMA恢复上报，将出现双主，CMS将杀死原主。

### **3.4 网络隔离处理**

多AZ部署时，若某个AZ被网络故障隔离，剩余的CMS节点如仍满足多数派条件，则可以触发自仲裁选主和DN仲裁选主流程，即在多数派的节点中产生新的CMS主和DN主。被隔离的少数派中的CMS主将主动降备，并杀死被隔离的DN主。若网络隔离快速恢复，被隔离的DN主还未被杀死，该DN主将被新CMS主杀死。

## **【4. 结语】**

CM组件是openGauss高可用特性的保障，目前主要服务于裸金属部署的openGauss集群。希望未来可以实现openGauss+CM组件的云原生部署，顺应基础服务云原生的趋势，满足更广大的业务需求。