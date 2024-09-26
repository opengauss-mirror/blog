+++
title = "CM运维指南"
date = "2021-12-20"
tags = ["CM"]
archives = "2024-03-20"
author = "xuemengen"
summary = "CM运维指南"
img = "/zh/post/xuemengen/title/img1.png"
times = "10:00"
+++

# 1、基础知识
## 1.1多数派
CM默认DN选主模式基于分布式协议Quorum，cm_server选主基于分布式协议paxos，基于分布式协议运行的系统均需要正常运行的节点数量满足多数派才可以正常运行和选主，数据始终同步到了多数派节点也是保证分布式系统数据不丢失的必要条件。
多数派的计算方法，假设集群节点数量为n，那么多数派的计算方法为：  
n/2+1
## 1.2约束条件
有CM的情况，必须要保证数据始终都能同步到多数派节点，否则可能会丢失数据，所以数据库以下参数必须满足
```
synchronous_commit>=on(remote_flush)
most_available_sync=off
synchronous_standby_names配置的同步备数量大于等于n/2（n为节点总数），ANY、first或强制指定同步备的方式均可
```
## 1.3 CM各组件作用
**om_monitor**：长驻在所有节点中，负责
  >- cm_agent的进程拉起、保活以及进程状态监控  
  >- om_monitor进程状态的监控

**cm_agent**：运行在所有节点，负责
  >- 所在节点上cm_server、dn以及其他用户自定义资源等实例进程的拉起、保活以及进程状态监控
  >- 采集所在节点的dn状态信息并上报给cm_server主
  >- 接收cm_server下发的指令并执行

**cm_server**：运行在指定节点，负责
  >- 接收各节点的cm_agent上报的信息
  >- 提供数据库实例整体状态的查询功能
  >- 判断是否发生异常，若发生异常则综合各节点的信息进行决策
  >- 根据决策结果下发待执行的指令到指定节点
  >- 与其他cm_server节点同步集群的状态信息以及一些dcc数据库中的信息

## 1.4 CM工作原理简介
对于大部分场景，CM的工作原理可简单总结如下：
  1. 各节点cm_agent采集各自所在节点的dn信息、环境信息以及自定义资源的信息，并上报给cm_server主
  2. cm_server主根据各节点上报的信息，判断是否发生异常，若发生异常则综合各节点的信息进行决策，并将决策信息下发到指定节点的cm_agent
  3. cm_agent接收到来自cm_server主下发的指令后在其所在节点执行指令

## 1.5主要的CM日志包含的日志信息的简要介绍
**om_monitor日志**：主要记录om_monitor进程启动和运行的日志  

**cm_agent日志**：  
  >- cm_agent启动日志；  
  >- 拉起dn、cms_server以及其他自定义资源等进程的信息；  
  >- 采集dn、cms_server以及其他自定义资源等进程状态的信息；  
  >- 采集环境的信息；  
  >- 向cms主发送消息以及接收cms主消息的日志信息；  
  >- 执行cms主下发指令的信息；  
  >- cma在后台执行的指令（如拉起dn、拉起cms、拉起自定义资源等，这些指令在前台执行的话正常是会打屏的）的日志会输出到cma日志同级目录下的systerm_call日志中  

**cm_server日志**：  
  >- cm_server启动日志；  
  >- 仲裁过程及结果信息，仲裁结果或者称为关键事件日志也会单独记录在cms主日志目录同目录下的key-event日志中；  
  >- 向cma下发指令的日志信息；

## 1.6启动依赖关系/进程守护关系
系统任务-->om_monitor-->cm_agent-->cm_server或DN或其他自定义资源进程

## 1.7仲裁依赖关系
```
cm_server-->DN
```
即DN选主依赖于cm_server有主


## 1.8选主流程
>1. 检测不到主机，触发选主流程
>2. 尝试锁定多数派个备机（备机锁定条件：lock1命令执行成功，需要：与主机已断开连接且回放完成）
>3. 锁定备机数量满足多数派后，开始选主
>4. 选主规则：优先静态主，其次term和lsn最大的备机，再次AZ优先级高的备机，最后nodeid小的备机
>5. 向新主下发failover命令
>6. 新主升主完成后，向备机下发lock2解锁命令（即告诉所有备机新主是哪个节点），向新主下发unlock命令
>7. 判断旧主拉起为备机后是否需要build，如果需要则自动做build

结束。

## 1.9 CM相关文件说明
**启停标志文件**  
  >- cluster_manual_start集群/AZ/节点启停标志文件，该文件存在则说明集群处于停止状态，不存在说明集群处于运行状态  
  >- instance_manual_start_xxx实例启停标志文件，xxx为对应对应实例id  
存储位置为$GAUSSHOME/bin/

**静态及动态配置文件**  
  >- cluster_static_config集群静态配置文件，存储集群的静态配置信息，即安装时xml中配置信息，查看命令为```cm_ctl view```或```gs_om -t view```  
  >- cluster_dynamic_config集群动态配置文件，主要保存集群的动态信息如集群和节点状态等，查看命令```gs_om -t view --dynamic```  

存储位置为DN数据目录

**CM组件配置文件**  
  >- cm_agent.conf    cm_agent配置文件  
  >- cm_server.conf    cm_server配置文件  
  >- cmdir/dcf_data/metadata/_dcf_metadata    cm_server基于的dcf的配置文件  

存储位置为cmdir目录下对应的目录中

# 2 CM常用操作
## 2.1启动和停止
```
cm_ctl start|stop [-z AVAILABILITY_ZONE [--cm_arbitration_mode = ARBITRATION_MODE]] | [-n NODEID [-D DATADIR]] [-t SECS]
```

启停集群
```
cm_ctl start|stop
```

启停指定az
```
cm_ctl start|stop -z AVAILABILITY_ZONE
其中AVAILABILITY_ZONE为AZ名称
```

启停节点
```
cm_ctl start|stop -n nodeid
其中nodeid为节点id
```

启停指定DN实例
```
cm_ctl stop -n nodeid –D datapath
其中datapath为DN的数据目录地址
```

## 2.2状态查询
```
cm_ctl query [-z ALL] [-l FILENAME] [-v [-C [-w] [-s] [-S] [-d] [-i] [-F] [-x] [-p]] | [-r]] [-t SECS] [--minorityAz=AZ_NAME]

一些常用的选项说明：
-v：显示详细数据库实例状态
-C：按主备关系成对显示数据库实例状态
-z AZNAME：显示数据库实例所在AZ名称
-d：显示实例数据目录
-i：显示物理节点ip
-p：显示数据库实例所有节点端口
-w：纵向分行显示数据库实例状态
```

## 2.3参数和配置相关
```
设置CM参数
cm_ctl set --param --agent|--server [-n NODEID] -k "PARAMETER_NAME='value'"
```

设置CM参数后动态加载CM参数使生效
```
cm_ctl reload --param --agent|--server
```

列出所有CM参数
```
cm_ctl list --param --agent|--server [-n NODEID]

其中
--agent表示操作cm_agent参数
--server表示操作cm_server参数
```

查看集群配置文件
```
cm_ctl view [-N]  [-n NODEID] [-l FILENAME]
```

2.4切换和重建
切换
```
cm_ctl switchover [-z AVAILABILITY_ZONE] | [-n NODEID -D DATADIR [-f]] | [-a] [-t SECS]
```

将主机切换到指定节点
```
cm_ctl switchover -n NODEID -D DATADIR
```

将主机切换到指定的AZ上
```
cm_ctl switchover -z AVAILABILITY_ZONE
```

将DN集群切换回初始状态
```
cm_ctl switchover –a
```

重建指定备机
```
cm_ctl build -n NODEID -D DATADIR -b full -f
```

# 3故障场景及处理措施
## 3.1故障节点数少于多数派
1. 主机未故障，写业务不受影响，故障备节点的读业务受影响
2. 主机故障，写业务受短暂影响，可自动恢复

修复故障节点即可

## 3.2多数派AZ故障
**将未故障的少数派az以少数派模式强起**
```
cm_ctl start -z AZ2 --cm_arbitration_mode=MINORITY
```

如果后续多数派AZ环境仍能恢复，则待多数派AZ修复后恢复多数派模式，命令：
```
cm_ctl start -z AZ2 --cm_arbitration_mode=MAJORITY
```
如果后续多数派AZ服务器完全挂掉无法恢复，只能重装新机器，则需要暂时先将多数派AZ所有节点缩容掉，使少数派AZ成为一个独立的集群。

***注意***：
  >- 以少数派模式强起时，cm会修改同步备机列表即synchronous_standby_names参数，以保证新主业务不受故障备机的阻塞，恢复时需要把该参数恢复回多数派配置

## 3.3 多数派节点故障
多数派节点故障，但是故障的节点处于不同的AZ，此种场景无法使用强启命令，cm_server与DN均无法进行自选主。

1. 首先判断主机状态，优先处理业务即DN状态
  >- 1.**主机未故障**：  
主机业务会阻塞，首先修改同步备机列表参数，删掉阻塞主机业务的故障备机，使业务不再阻塞得以推进下去。
  >- 2.**主机故障**：  
首先恢复业务，手动查询未故障的备机的LSN位置，选择LSN位置最大的备机作为新主，修改新主的同步备机列表，使用gs_ctl failover 命令将新主升主

2. 处理cm_server状态，cm_server多数派故障以后会自动降备，并且无法自动选主，因此需要手动强制指定一个cm_server主，命令：
```
cm_ctl set --cmsPromoteMode=PRIMARY_F -I nodeid
```

3. 待多数派恢复后
  > 1. 恢复同步备机列表参数
  > 2. 取消cm_server选主的强制模式，改为自动模式，命令
```
cm_ctl set --cmsPromoteMode=AUTO -I nodeid
```

## 3.4 磁盘使用率达到阈值导致集群只读
优先清理磁盘空间使磁盘空间使用率降低，但是如果是数据太多导致使用率过高，则使用以下措施之一使集群取消只读：
1. 调大cm的磁盘只读阈值，命令：
```
cm_ctl set --param --server -k datastorage_threshold_value_check=95
cm_ctl reload --param --server
```

2. 手动取消主机只读，在主机上执行如下命令
```
gs_guc reload -D datapath -c "default_transaction_read_only=off"
```
然后清理数据或扩充磁盘。

***注意***：
  >- 手动取消主机只读后，磁盘会继续增长，需要尽快处理并持续监控，否则磁盘最终可能会满导致挂掉

# 4 问题定位思路简介
## 4.1安装及启动失败相关问题定位思路
1. 首先查看各进程状态，按照启动路径依次查看各组件进程是否正常启动，若未正常启动则查看负责拉起该进程的进程的日志以及未启动进程的日志，根据日志内容该进程启动失败的原因
2. 若所有进程均已启动，首先查看cm_server集群的状态，若cm_server集群状态不正常，则查看cm_server日志和dcc日志，根据日志内容定位cm_server集群状态不正常的原因
3. 若cm_server集群状态正常，即有稳定的cms主，但是dn集群状态不正常，则依据CM工作原理依次查看各环节是否存在问题：  
>1. 查看cma日志确认各节点cma是否正常采集信息，以及是否检测到异常情况  
>2. cma是否正常上报信息  
>3. 查看cm_server主的日志确认cms主是否正常接收cma的消息，以及是否做出了正确的仲裁，以及是否正常下发了仲裁结果  
>4. 查看接收仲裁结果的cma是否正常接收到cms主下发的仲裁结果，以及是否正常执行了正确的指令  
>5. 查看cma以及dn的日志确认是否执行了指令以及指令的执行情况

## 4.2自动故障切换或者其他仲裁事件发生后问题定位思路
1. 首先到cms主所在节点，进入到`cm_server主`日志目录下，首先可以通过key-event日志查看发生的事件以及事件发生时间等信息，例如以下为key-event日志中的一条事件日志
```
2023-10-16 10:33:03.706 tid=27902 AGENT_WORKER: [KeyEvent: KEY_EVENT_FAILOVER] [Instance: 6002] [Details: Failover message has sent to instance 6002, term 5, sendFailoverTimes is 0.]
```
2. 根据此关键事件日志信息，可以在`cm_server主`日志中搜索该条日志信息，便可以找到该事件发生的日志上文，向上文查看便可以看到cms主的仲裁过程，其中包括各节点的实时状态信息，例如
```
2023-10-16 10:33:02.703 tid=27900 CTL_WORKER LOG: [SendFailoverQuarm], Cannot failover (isDegrade=0) instance 6002, because time(5) is smaller than 6.
2023-10-16 10:33:03.644 tid=27901 CTL_WORKER LOG: [InstanceIsUnheal], current report instance is 6001, node 1, instId[6001: 6002], node[1: 2], staticRole[1=Primary: 2=Standby], dynamicRole[2=Standby: 2=Standby], term[4: 4], lsn[1/610AC558: 1/610AC558], dbState[2=Need repair: 2=Need repair], buildReason[9=Connecting: 2=Disconnected], doubleRestarting[0: 0], disconn_mode[1=polling_connection: 3=prohibit_connection], disconn[:0, :0], local[192.168.0.16:15101, 192.168.0.17:15101], redoFinished[1: 1], arbiTime[5: 5], syncList[cur: (sync list is empty), exp: (sync list is empty), vote: (dynamic status is empty)], groupTerm[3], sync_standby_mode[0: 0: 0], sendFailoverTimes[0: 0].
2023-10-16 10:33:03.644 tid=27901 CTL_WORKER LOG: [PrintCandiMsg], instanceId(0: 6001), mode is 0, find the best candicate is 1,  primary Idx is [static: 0:1, dynamic: -1:0, dynormal: -1:0, vaildPrim: -1, demoting: 0], isReduced is [isReduced: 0, vaildCandiCount: 1, vaildCount: 2, onlineCount:2], sameAz is [2: 1], lock msg is [lock1: 1, lock2: 0, redoFinish: [local: 1, group: 0]], arbitrateTime is [local: 5, max: 5, delay is 0], termAndLsn is [InCond:[max: (4, 1/610AC558), local: (4, 1/610AC558)], noCond:[term: 4], group: 3], listStr is [curSync: [sync list is empty], expSync: [sync list is empty], voteAz: [dynamic status is empty]], cascade is [sta: [insInfo is empty], dy: [insInfo is empty]]localMsg is [dbState: 2=Need repair, maxSendTime: 0, dbRestart: 0, buildReason: 9=Connecting, disconn is [mode: 1=polling_connection, host: , port: 0]], azIndex is [cur: 0, master: 1, slave: 4294967295, arbiter: 4294967295] azName is AZ1, minorityAzName is (null).
2023-10-16 10:33:03.644 tid=27901 CTL_WORKER LOG: send lock1 message to instance(6001).
```
其中一些关键字，例如：  
[SendFailoverQuarm]为发送failover函数的日志信息；  
[PrintCandiMsg]为打印候选实例信息函数的日志信息；  
[SendLockMsg]为发送lock消息函数的日志信息；  
[InstanceIsUnheal]表示实例或集群状态异常，以及上报节点及对端状态信息，其中关键的一些状态信息包括：  
current report instance is 6001, node 1：  当前上报状态的实例为dn_6001，节点1  
instId[6001: 6002], node[1: 2] ： instanceid为6001, nodeid为1，对端实例instanceid为6002，nodeid为2，后续所有冒号后面的信息即为对端实例的信息  
```staticRole[1=Primary: 2=Standby], dynamicRole[2=Standby: 2=Standby]```：6001的静态角色为primary，动态角色为standby，6002的静态角色为standby，动态角色为standby，静态角色即为当前角色之前的历史角色，动态角色为当前角色  
```term[4: 4], lsn[1/610AC558: 1/610AC558]```：6001的term为4，lsn为1/610AC558，6002的term为4，lsn为1/610AC558
```dbState[2=Need repair: 2=Need repair], buildReason[9=Connecting: 2=Disconnected]```：6001的节点状态为Need repair, buildReaseon为Connecting，6002的节点状态为Need repair, buildReason为Disconnected  
```doubleRestarting[0: 0]```：6001的重启次数为0，6002的重启次数为0  
```disconn_mode[1=polling_connection: 3=prohibit_connection]```：6001的disconn_mode即连接模式为polling_connection，6002的连接模式为prohibit_connection  
```disconn[:0, :0], local[192.168.0.16:15101, 192.168.0.17:15101]```：6001的连接信息为192.168.0.16:15101，6002的连接信息为192.168.0.17:15101
```redoFinished[1: 1]```：redoFinished表示redo回放是否完成，6001和6002的redoFinished均为1，表示均已回放完成  
```arbiTime[5: 5]```：6001仲裁次数为5，6002仲裁次数为5  
3.  根据事件的大概时间，在对应故障节点的cm_agent日志中可以看到cm_agent检测到的故障情况，一般还需要结合DN的pg_log日志来确定问题原因