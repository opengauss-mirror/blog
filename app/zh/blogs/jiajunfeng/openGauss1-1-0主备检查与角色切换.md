---
title: 'openGauss1.1.0主备检查与角色切换'

date: '2021-01-29'

category: 'blog'
tags: ['openGauss主备集群']

archives: '2021-01'

author: '贾军锋'

summary: 'openGauss1.1.0主备检查与角色切换'

img: '/zh/blogs/jiajunfeng/title/img20.png'

times: '15:30'
---

# openGauss1.1.0 主备检查与角色切换<a name="ZH-CN_TOPIC_0000001116618877"></a>

在上一篇文章《[openGauss 1.1.0 主备部署\(1 主+2 备+1 级联备\)](https://www.modb.pro/db/43407)》中，我们已经搭建了常见于生产环境的数据库架构\(1 主 2 备 1 级联备\)，如下图所示：

<img src='./figures/20210125-713121ac-8f15-4f9f-a033-be4b7036e950.jpg'>

本文将基于已搭建的主备环境进行日常维护操作演示，如：健康检查、Switchover、Failover 等常见操作。希望文章内容对大家有所帮助。

## 健康状态检查<a name="section184430118116"></a>

**1. 通过 gs_om 工具检查集群健康状态**

查询集群整体状态

```
[omm@prod ~]$ gs_om -t status --detail

[   Cluster State   ]
cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]
node                    node_ip         instance                state
-------------------------------------------------------------------------------
1  prod.opengauss.com   192.168.0.11    6001 /gauss/data/db1 P Primary Normal
2  stb1.opengauss.com   192.168.0.12    6002 /gauss/data/db1 S Standby Normal
3  stb2.opengauss.com   192.168.0.13    6003 /gauss/data/db1 S Standby Normal
4  casstb.opengauss.com 192.168.0.14    6004 /gauss/data/db1 C Cascade Normal

## 说明：--detail参数通过在每个数据库节点执行gs_ctl query命令进行查询并汇总结果，来获取openGauss的详细信息。
```

<a name="table731103314125"></a>

<table><thead ><tr id="row103111233121210"><th class="cellrowborder"  width="23.37233723372337%" id="mcps1.1.4.1.1"><p id="p931223381217"><a name="p931223381217"></a><a name="p931223381217"></a>字段</p>
</th>
<th class="cellrowborder"  width="24.93249324932493%" id="mcps1.1.4.1.2"><p id="p13312123341211"><a name="p13312123341211"></a><a name="p13312123341211"></a>字段含义</p>
</th>
<th class="cellrowborder"  width="51.6951695169517%" id="mcps1.1.4.1.3"><p id="p1931211330129"><a name="p1931211330129"></a><a name="p1931211330129"></a>字段值</p>
</th>
</tr>
</thead>
<tbody><tr id="row203121033131210"><td class="cellrowborder"  width="23.37233723372337%" headers="mcps1.1.4.1.1 "><p id="p27671846191218"><a name="p27671846191218"></a><a name="p27671846191218"></a>cluster_state</p>
</td>
<td class="cellrowborder"  width="24.93249324932493%" headers="mcps1.1.4.1.2 "><p id="p876734618126"><a name="p876734618126"></a><a name="p876734618126"></a>openGauss状态</p>
</td>
<td class="cellrowborder"  width="51.6951695169517%" headers="mcps1.1.4.1.3 "><p id="p197678467129"><a name="p197678467129"></a><a name="p197678467129"></a>Normal：表示openGauss可用，且数据有冗余备份。所有进程都在运行，主备关系正常。</p>
<p id="p676704631213"><a name="p676704631213"></a><a name="p676704631213"></a>Unavailable：表示openGauss不可用。</p>
<p id="p1676717467124"><a name="p1676717467124"></a><a name="p1676717467124"></a>Degraded：表示openGauss可用，但数据没有冗余备份。</p>
</td>
</tr>
<tr id="row163129332124"><td class="cellrowborder"  width="23.37233723372337%" headers="mcps1.1.4.1.1 "><p id="p07674469123"><a name="p07674469123"></a><a name="p07674469123"></a>redistributing</p>
</td>
<td class="cellrowborder"  width="24.93249324932493%" headers="mcps1.1.4.1.2 "><p id="p2767184691211"><a name="p2767184691211"></a><a name="p2767184691211"></a>数据重分布状态</p>
</td>
<td class="cellrowborder"  width="51.6951695169517%" headers="mcps1.1.4.1.3 "><p id="p1576734610124"><a name="p1576734610124"></a><a name="p1576734610124"></a>Yes：表示openGauss处于数据重分布状态。</p>
<p id="p13767154671219"><a name="p13767154671219"></a><a name="p13767154671219"></a>No：表示openGauss未处于数据重分步状态。</p>
</td>
</tr>
<tr id="row173131733111219"><td class="cellrowborder"  width="23.37233723372337%" headers="mcps1.1.4.1.1 "><p id="p207681346191212"><a name="p207681346191212"></a><a name="p207681346191212"></a>node</p>
</td>
<td class="cellrowborder"  width="24.93249324932493%" headers="mcps1.1.4.1.2 "><p id="p276844641219"><a name="p276844641219"></a><a name="p276844641219"></a>主机名称</p>
</td>
<td class="cellrowborder"  width="51.6951695169517%" headers="mcps1.1.4.1.3 "><p id="p7768046141215"><a name="p7768046141215"></a><a name="p7768046141215"></a>表示该实例所在的主机名称。多AZ时会显示AZ编号。</p>
</td>
</tr>
<tr id="row113131133141220"><td class="cellrowborder"  width="23.37233723372337%" headers="mcps1.1.4.1.1 "><p id="p16768134615127"><a name="p16768134615127"></a><a name="p16768134615127"></a>node_ip</p>
</td>
<td class="cellrowborder"  width="24.93249324932493%" headers="mcps1.1.4.1.2 "><p id="p1976874671214"><a name="p1976874671214"></a><a name="p1976874671214"></a>主机IP</p>
</td>
<td class="cellrowborder"  width="51.6951695169517%" headers="mcps1.1.4.1.3 "><p id="p47681446101212"><a name="p47681446101212"></a><a name="p47681446101212"></a>表示该实例所在的主机IP。</p>
</td>
</tr>
<tr id="row2314193391215"><td class="cellrowborder"  width="23.37233723372337%" headers="mcps1.1.4.1.1 "><p id="p107689460122"><a name="p107689460122"></a><a name="p107689460122"></a>instance</p>
</td>
<td class="cellrowborder"  width="24.93249324932493%" headers="mcps1.1.4.1.2 "><p id="p11768194615123"><a name="p11768194615123"></a><a name="p11768194615123"></a>实例ID</p>
</td>
<td class="cellrowborder"  width="51.6951695169517%" headers="mcps1.1.4.1.3 "><p id="p376812463126"><a name="p376812463126"></a><a name="p376812463126"></a>表示该实例的ID。</p>
</td>
</tr>
<tr id="row143141339123"><td class="cellrowborder"  width="23.37233723372337%" headers="mcps1.1.4.1.1 "><p id="p157687469127"><a name="p157687469127"></a><a name="p157687469127"></a>state</p>
<p id="p1176813460129"><a name="p1176813460129"></a><a name="p1176813460129"></a></p>
</td>
<td class="cellrowborder"  width="24.93249324932493%" headers="mcps1.1.4.1.2 "><p id="p14769246121211"><a name="p14769246121211"></a><a name="p14769246121211"></a>实例状态</p>
</td>
<td class="cellrowborder"  width="51.6951695169517%" headers="mcps1.1.4.1.3 "><p id="p187692462126"><a name="p187692462126"></a><a name="p187692462126"></a>P: 节点的初始角色是Primary，数据库安装后就不再变动，从系统静态文件读取。</p>
<p id="p107691146131211"><a name="p107691146131211"></a><a name="p107691146131211"></a>S: 节点的初始角色是Standby，数据库安装后就不再变动，从系统静态文件读取。</p>
<p id="p10769154631214"><a name="p10769154631214"></a><a name="p10769154631214"></a>C: 节点的初始角色是 Cascade Standby，数据库安装后就不再变动，从系统静态文件读取。</p>
<p id="p1876994613123"><a name="p1876994613123"></a><a name="p1876994613123"></a>Primary：表示实例为主实例。</p>
<p id="p6769146171212"><a name="p6769146171212"></a><a name="p6769146171212"></a>Standby：表示实例为备实例。</p>
<p id="p9769174614121"><a name="p9769174614121"></a><a name="p9769174614121"></a>Cascade Standby：表示实例为级联备实例。</p>
<p id="p15769546131217"><a name="p15769546131217"></a><a name="p15769546131217"></a>Secondary：表示实例为从备实例。</p>
<p id="p5769146161213"><a name="p5769146161213"></a><a name="p5769146161213"></a>Pending：表示该实例在仲裁阶段。</p>
<p id="p9769164681219"><a name="p9769164681219"></a><a name="p9769164681219"></a>Unknown：表示实例状态未知。</p>
<p id="p127691546161213"><a name="p127691546161213"></a><a name="p127691546161213"></a>Down：表示实例处于宕机状态。</p>
</td>
</tr>
</tbody>
</table>

查询集群各个节点信息

```
[omm@prod ~]$ gs_om -t status --all
-----------------------------------------------------------------------

cluster_state             : Normal
redistributing            : No

-----------------------------------------------------------------------

node                      : 1
node_name                 : prod.opengauss.com
instance_id               : 6001
node_ip                   : 192.168.0.11
data_path                 : /gauss/data/db1
type                      : Datanode
instance_state            : Normal
static_connections        : 3

HA_state                  : Normal
instance_role             : Primary
-----------------------------------------------------------------------

node                      : 2
node_name                 : stb1.opengauss.com
instance_id               : 6002
node_ip                   : 192.168.0.12
data_path                 : /gauss/data/db1
type                      : Datanode
instance_state            : Normal
instance_role             : Standby
HA_state                  : Streaming
sender_sent_location      : 0/7006260
sender_write_location     : 0/7006260
sender_flush_location     : 0/7006260
sender_replay_location    : 0/7006260
receiver_received_location: 0/7006260
receiver_write_location   : 0/7006260
receiver_flush_location   : 0/7006260
receiver_replay_location  : 0/7006260
sync_percent              : 100%
sync_state                : Async

-----------------------------------------------------------------------

node                      : 3
node_name                 : stb2.opengauss.com
instance_id               : 6003
node_ip                   : 192.168.0.13
data_path                 : /gauss/data/db1
type                      : Datanode
instance_state            : Normal
instance_role             : Standby
HA_state                  : Streaming
sender_sent_location      : 0/7006260
sender_write_location     : 0/7006260
sender_flush_location     : 0/7006260
sender_replay_location    : 0/7006260
receiver_received_location: 0/7006260
receiver_write_location   : 0/7006260
receiver_flush_location   : 0/7006260
receiver_replay_location  : 0/7006260
sync_percent              : 100%
sync_state                : Async

-----------------------------------------------------------------------

node                      : 4
node_name                 : casstb.opengauss.com
instance_id               : 6004
node_ip                   : 192.168.0.14
data_path                 : /gauss/data/db1
type                      : Datanode
instance_state            : Normal
instance_role             : Cascade Standby

## 说明：--all参数将在每个数据库节点查询系统表并汇总结果，从而获取openGauss所有节点的信息
```

<a name="table324215371512"></a>

<table><thead ><tr id="row112436318153"><th class="cellrowborder"  width="39.93%" id="mcps1.1.3.1.1"><p id="p1624473161519"><a name="p1624473161519"></a><a name="p1624473161519"></a>字段名称</p>
</th>
<th class="cellrowborder"  width="60.07%" id="mcps1.1.3.1.2"><p id="p1224415318154"><a name="p1224415318154"></a><a name="p1224415318154"></a>字段说明</p>
</th>
</tr>
</thead>
<tbody><tr id="row62441932153"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p66468971616"><a name="p66468971616"></a><a name="p66468971616"></a>pid</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p3646149131611"><a name="p3646149131611"></a><a name="p3646149131611"></a>walsender的线程号。</p>
</td>
</tr>
<tr id="row1924411361520"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p96471592166"><a name="p96471592166"></a><a name="p96471592166"></a>sender_pid</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p164789111620"><a name="p164789111620"></a><a name="p164789111620"></a>walsender的pid相对的轻量级线程号。</p>
</td>
</tr>
<tr id="row132449341516"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p1464759161615"><a name="p1464759161615"></a><a name="p1464759161615"></a>local_role</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p1564749191612"><a name="p1564749191612"></a><a name="p1564749191612"></a>主节点类型。</p>
</td>
</tr>
<tr id="row17244837154"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p1664739141618"><a name="p1664739141618"></a><a name="p1664739141618"></a>peer_role</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p19647179101614"><a name="p19647179101614"></a><a name="p19647179101614"></a>备节点类型。</p>
</td>
</tr>
<tr id="row17244193131513"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p1648159111619"><a name="p1648159111619"></a><a name="p1648159111619"></a>peer_state</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p364839201613"><a name="p364839201613"></a><a name="p364839201613"></a>备节点状态。</p>
</td>
</tr>
<tr id="row20245183111512"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p1864818991612"><a name="p1864818991612"></a><a name="p1864818991612"></a>state</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p1364849111618"><a name="p1364849111618"></a><a name="p1364849111618"></a>walsender状态。</p>
</td>
</tr>
<tr id="row7245637155"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p1864819121614"><a name="p1864819121614"></a><a name="p1864819121614"></a>catchup_start</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p264813901615"><a name="p264813901615"></a><a name="p264813901615"></a>catchup启动时间。</p>
</td>
</tr>
<tr id="row276411218151"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p264959191612"><a name="p264959191612"></a><a name="p264959191612"></a>catchup_end</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p4649494167"><a name="p4649494167"></a><a name="p4649494167"></a>catchup结束时间。</p>
</td>
</tr>
<tr id="row16765621161519"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p146499915160"><a name="p146499915160"></a><a name="p146499915160"></a>sender_sent_location</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p3649699162"><a name="p3649699162"></a><a name="p3649699162"></a>主节点发送位置。</p>
</td>
</tr>
<tr id="row1276532110154"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p16649189121617"><a name="p16649189121617"></a><a name="p16649189121617"></a>sender_write_location</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p26497911167"><a name="p26497911167"></a><a name="p26497911167"></a>主节点落盘位置。</p>
</td>
</tr>
<tr id="row15766142141518"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p1165017915168"><a name="p1165017915168"></a><a name="p1165017915168"></a>sender_flush_location</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p9650209191614"><a name="p9650209191614"></a><a name="p9650209191614"></a>主节点flush磁盘位置。</p>
</td>
</tr>
<tr id="row157661321121510"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p1365059191612"><a name="p1365059191612"></a><a name="p1365059191612"></a>sender_replay_location</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p26506914168"><a name="p26506914168"></a><a name="p26506914168"></a>主节点redo位置。</p>
</td>
</tr>
<tr id="row19766721121512"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p265013951616"><a name="p265013951616"></a><a name="p265013951616"></a>receiver_received_location</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p1965017981611"><a name="p1965017981611"></a><a name="p1965017981611"></a>备节点接收位置。</p>
</td>
</tr>
<tr id="row19766021201517"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p16650109111613"><a name="p16650109111613"></a><a name="p16650109111613"></a>receiver_write_location</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p86510911618"><a name="p86510911618"></a><a name="p86510911618"></a>备节点落盘位置。</p>
</td>
</tr>
<tr id="row12207135161515"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p1265179161616"><a name="p1265179161616"></a><a name="p1265179161616"></a>receiver_flush_location</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p56511299163"><a name="p56511299163"></a><a name="p56511299163"></a>备节点flush磁盘位置。</p>
</td>
</tr>
<tr id="row62081535111512"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p165114913166"><a name="p165114913166"></a><a name="p165114913166"></a>receiver_replay_location</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p465117981613"><a name="p465117981613"></a><a name="p465117981613"></a>备节点redo磁盘位置。</p>
</td>
</tr>
<tr id="row720817352154"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p8651189131619"><a name="p8651189131619"></a><a name="p8651189131619"></a>sync_percent</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p565119981610"><a name="p565119981610"></a><a name="p565119981610"></a>同步百分比。</p>
</td>
</tr>
<tr id="row2209335111510"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p186524911611"><a name="p186524911611"></a><a name="p186524911611"></a>sync_state</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p176525941617"><a name="p176525941617"></a><a name="p176525941617"></a>同步状态。</p>
</td>
</tr>
<tr id="row1220923551519"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p265212911619"><a name="p265212911619"></a><a name="p265212911619"></a>sync_priority</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p146521599162"><a name="p146521599162"></a><a name="p146521599162"></a>同步复制的优先级。</p>
</td>
</tr>
<tr id="row7209153531515"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p86521892160"><a name="p86521892160"></a><a name="p86521892160"></a>sync_most_available</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p126525951611"><a name="p126525951611"></a><a name="p126525951611"></a>最大可用模式设置。</p>
</td>
</tr>
<tr id="row102101335161511"><td class="cellrowborder"  width="39.93%" headers="mcps1.1.3.1.1 "><p id="p1765220931616"><a name="p1765220931616"></a><a name="p1765220931616"></a>channel</p>
</td>
<td class="cellrowborder"  width="60.07%" headers="mcps1.1.3.1.2 "><p id="p565314961620"><a name="p565314961620"></a><a name="p565314961620"></a>walsender信道信息。</p>
</td>
</tr>
</tbody>
</table>

**2. 通过系统函数检查数据同步状态**

查询 wal 日志传送状态

```
## 主节点(192.168.0.11) 信息查询
postgres=# \pset expanded
postgres=# select * from pg_stat_get_wal_senders();
-[ RECORD 1 ]--------------+----------------------------------------
pid                        | 140307005830912
sender_pid                 | 3734
local_role                 | Primary
peer_role                  | Standby
peer_state                 | Normal
state                      | Streaming
catchup_start              | 2021-01-21 11:09:21.015018+08
catchup_end                | 2021-01-21 11:09:21.015136+08
sender_sent_location       | 0/7006E68
sender_write_location      | 0/7006E68
sender_flush_location      | 0/7006E68
sender_replay_location     | 0/7006E68
receiver_received_location | 0/7006E68
receiver_write_location    | 0/7006E68
receiver_flush_location    | 0/7006E68
receiver_replay_location   | 0/7006E68
sync_percent               | 100%
sync_state                 | Async
sync_priority              | 0
sync_most_available        | Off
channel                    | 192.168.0.11:26001-->192.168.0.12:40076
-[ RECORD 2 ]--------------+----------------------------------------
pid                        | 140306989049600
sender_pid                 | 3735
local_role                 | Primary
peer_role                  | Standby
peer_state                 | Normal
state                      | Streaming
catchup_start              | 2021-01-21 11:09:21.018418+08
catchup_end                | 2021-01-21 11:09:21.018525+08
sender_sent_location       | 0/7006E68
sender_write_location      | 0/7006E68
sender_flush_location      | 0/7006E68
sender_replay_location     | 0/7006E68
receiver_received_location | 0/7006E68
receiver_write_location    | 0/7006E68
receiver_flush_location    | 0/7006E68
receiver_replay_location   | 0/7006E68
sync_percent               | 100%
sync_state                 | Async
sync_priority              | 0
sync_most_available        | Off
channel                    | 192.168.0.11:26001-->192.168.0.13:58760


## 级联备节点(192.168.0.14) 信息查询
postgres=# \pset x
postgres=# select * from pg_stat_get_wal_receiver();
-[ RECORD 1 ]--------------+----------------------------------------
receiver_pid               | 2533
local_role                 | Cascade Standby
peer_role                  | Standby
peer_state                 | Normal
state                      | Normal
sender_sent_location       | 0/7006E68
sender_write_location      | 0/7006E68
sender_flush_location      | 0/7006E68
sender_replay_location     | 0/7006D50
receiver_received_location | 0/7006E68
receiver_write_location    | 0/7006E68
receiver_flush_location    | 0/7006E68
receiver_replay_location   | 0/7006E68
sync_percent               | 100%
channel                    | 192.168.0.14:42128<--192.168.0.13:26001
```

查询复制状态

```
postgres=# select * from pg_stat_get_stream_replications();
 local_role | static_connections | db_state | detail_information
------------+--------------------+----------+--------------------
 Primary    |                  3 | Normal   | Normal

postgres=# select * from dbe_perf.get_global_replication_slots();
     node_name     | slot_name | plugin | slot_type | datoid | database | active | x_min | catalog_xmin | restart_lsn | dummy_standby
-------------------+-----------+--------+-----------+--------+----------+--------+-------+--------------+-------------+---------------
 dn_6001_6002_6003 | dn_6003   |        | physical  |      0 |          | t      |       |              | 0/7007958   | f
 dn_6001_6002_6003 | dn_6002   |        | physical  |      0 |          | t      |       |              | 0/7007958   | f


postgres=# \pset x
Expanded display is on.
postgres=# select * from dbe_perf.get_global_replication_stat();
-[ RECORD 1 ]------------+-------------------
node_name                | dn_6001_6002_6003
pid                      | 140307005830912
usesysid                 | 10
usename                  | omm
application_name         |
client_addr              | 192.168.0.12
client_hostname          | stb1.opengauss.com
client_port              | 40076
backend_start            |
state                    | Streaming
sender_sent_location     | 0/7007A70
receiver_write_location  | 0/7007A70
receiver_flush_location  | 0/7007A70
receiver_replay_location | 0/7007A70
sync_priority            | 0
sync_state               | Async
-[ RECORD 2 ]------------+-------------------
node_name                | dn_6001_6002_6003
pid                      | 140306989049600
usesysid                 | 10
usename                  | omm
application_name         |
client_addr              | 192.168.0.13
client_hostname          | stb2.opengauss.com
client_port              | 58760
backend_start            |
state                    | Streaming
sender_sent_location     | 0/7007A70
receiver_write_location  | 0/7007A70
receiver_flush_location  | 0/7007A70
receiver_replay_location | 0/7007A70
sync_priority            | 0
sync_state               | Async
```

**3. 检查远程复制相关参数**

```
postgres=# select name,setting from pg_settings where name like  '%replconninfo%';
     name      |                                                                                  setting
---------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 replconninfo1 | localhost=192.168.0.11 localport=26001 localheartbeatport=26005 localservice=26004 remotehost=192.168.0.12 remoteport=26001 remoteheartbeatport=26005 remoteservice=26004
 replconninfo2 | localhost=192.168.0.11 localport=26001 localheartbeatport=26005 localservice=26004 remotehost=192.168.0.13 remoteport=26001 remoteheartbeatport=26005 remoteservice=26004
 replconninfo3 | localhost=192.168.0.11 localport=26001 localheartbeatport=26005 localservice=26004 remotehost=192.168.0.14 remoteport=26001 remoteheartbeatport=26005 remoteservice=26004
## 说明：
## localport          --> 同步日志传输端口
## localheartbeatport --> 集群心跳端口
## localservice       --> 主备通讯端口

postgres=# select name,setting from pg_settings where name like  '%standby%';
              name               |        setting
---------------------------------+------------------------
 hot_standby                     | on
 hot_standby_feedback            | off
 max_standby_archive_delay       | 3000
 max_standby_streaming_delay     | 3000
 standby_shared_buffers_fraction | 0.3
 synchronous_standby_names       | ANY 1(dn_6002,dn_6003)
## 参数说明：
## hot_standby                      -->  是否允许备机在恢复过程中连接和查询
## hot_standby_feedback             -->  是否允许将备机上执行查询的最小事务号反馈给主机，当该参数为on时，主机仅允许清理小于备机反馈回来的事务号的旧版本数据
## max_standby_archive_delay和max_standby_streaming_delay  -->  备机查询冲突时，设置备机取消查询之前所等待的时间(默认3s)
## standby_shared_buffers_fraction  -->  备机可以使用的最大shared_buffers百分比
## synchronous_standby_names        -->  备机名称列表

postgres=# select name,setting from pg_settings where name like  '%repli%';
            name            | setting
----------------------------+---------
 data_replicate_buffer_size | 131072
 enable_data_replicate      | off
 enable_mix_replication     | off
 enable_stream_replication  | on
 max_replication_slots      | 8
 replication_type           | 1
 session_replication_role   | origin

 ## 参数说明：
 ## data_replicate_buffer_size  -->  发送端与接收端传递数据页时，队列所占用的内存大小(默认128MB)
 ## enable_data_replicate       -->  on表示导入数据行存表时主备数据采用数据页的方式进行同步 || off表示导入数据行存表时主备数据采用WAL日志方式进行同步
 ## enable_mix_replication      -->  控制主备、主从之间WAL日志及数据复制的方式，默认off表示，关闭WAL日志、数据页混合复制模式
 ## enable_stream_replication   -->  控制主备是否进行数据和日志同步，默认on表示打开主备同步
 ## max_replication_slots       -->  设置主机端日志复制最大slot数
 ## session_replication_role    -->  会话复制角色(origin(源端)||replica(目标端)||local表示函数执行复制时会检测当前登录数据库的角色并采取相应的操作)
 ## replication_type            -->  标记当前HA模式是单主机模式、主备从模式还是一主多备模式(用户无法修改该参数)
 ##     2 表示单主机模式，此模式无法扩展备机。
 ##     1 表示使用一主多备模式，全场景覆盖，推荐使用。当设置为1时，会强制把enable_data_replicate参数设置为off。
 ##     0 表示主备从模式，目前此模式暂不支持。
```

## 主备角色切换\(switchover\)<a name="section59581451122115"></a>

在实际工作中，偶尔会碰到主节点系统或硬件需要维护的场景。在此时，我们需要实现数据零丢失进行主备切换，将主节点的业务迁移到备节点去，然后关闭原先的主节点进行维护。

**switchover 的注意事项：**

- 对于同一数据库，上一次主备切换未完成，不能执行下一次切换。
- 对于业务正在操作时，发起 switchover，可能主机的线程无法停止导致 switchover 显示超时，实际后台仍然在运行，等主机线程停止后，switchover 即可完成。比如在主机删除一个大的分区表时，可能无法响应 switchover 发起的信号。

**1. 检查主备集群状态**

```
[omm@prod ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

node                    node_ip         instance                state         |
-------------------------------------------------------------------------------
1  prod.opengauss.com   192.168.0.11    6001 /gauss/data/db1 P Primary Normal |
2  stb1.opengauss.com   192.168.0.12    6002 /gauss/data/db1 S Standby Normal |
3  stb2.opengauss.com   192.168.0.13    6003 /gauss/data/db1 S Standby Normal |
4  casstb.opengauss.com 192.168.0.14    6004 /gauss/data/db1 C Cascade Normal
## 集群状态正常，可以进行switchover操作

## 级联备库状态查询(在级联备库查询)  || 备库192.168.0.13目前正在向级联备库192.168.0.14同步数据
postgres=# \pset x
Expanded display is on.
postgres=# select * from pg_stat_get_wal_receiver();
-[ RECORD 1 ]--------------+----------------------------------------
receiver_pid               | 2245
local_role                 | Cascade Standby
peer_role                  | Standby
peer_state                 | Normal
state                      | Normal
sender_sent_location       | 0/7005640
sender_write_location      | 0/7005640
sender_flush_location      | 0/7005640
sender_replay_location     | 0/7005528
receiver_received_location | 0/7005640
receiver_write_location    | 0/7005640
receiver_flush_location    | 0/7005640
receiver_replay_location   | 0/7005640
sync_percent               | 100%
channel                    | 192.168.0.14:46578<--192.168.0.13:26001
```

**2. 切换主/备角色**

本次在备库 192.168.0.13 上执行 switchover 操作。

```
[omm@stb2 ~]$ gs_ctl switchover -D /gauss/data/db1
[2021-01-21 17:03:52.629][2996][][gs_ctl]: gs_ctl switchover ,datadir is /gauss/data/db1
[2021-01-21 17:03:52.629][2996][][gs_ctl]: switchover term (1)
[2021-01-21 17:03:52.633][2996][][gs_ctl]: waiting for server to switchover...............
[2021-01-21 17:04:04.698][2996][][gs_ctl]: done
[2021-01-21 17:04:04.698][2996][][gs_ctl]: switchover completed (/gauss/data/db1)
```

**3. 检查集群状态**

```
[omm@prod ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

node                    node_ip         instance                state         |
-------------------------------------------------------------------------------
1  prod.opengauss.com   192.168.0.11    6001 /gauss/data/db1 P Standby Normal |
2  stb1.opengauss.com   192.168.0.12    6002 /gauss/data/db1 S Standby Normal |
3  stb2.opengauss.com   192.168.0.13    6003 /gauss/data/db1 S Primary Normal |
4  casstb.opengauss.com 192.168.0.14    6004 /gauss/data/db1 C Cascade Normal

## 级联备库状态查询(在级联备库查询)    || 此时级联备库自动切换数据源，从新的备库(192.168.0.11)同步日志数据
postgres=# \pset x
Expanded display is on.
postgres=# select * from pg_stat_get_wal_receiver();
-[ RECORD 1 ]--------------+----------------------------------------
receiver_pid               | 2505
local_role                 | Cascade Standby
peer_role                  | Standby
peer_state                 | Normal
state                      | Normal
sender_sent_location       | 0/7005F00
sender_write_location      | 0/7005F00
sender_flush_location      | 0/7005F00
sender_replay_location     | 0/7005F00
receiver_received_location | 0/7005F00
receiver_write_location    | 0/7005F00
receiver_flush_location    | 0/7005F00
receiver_replay_location   | 0/7005F00
sync_percent               | 100%
channel                    | 192.168.0.14:58796<--192.168.0.11:26001
```

**4. 保存集群主备机器信息\(刷新动态配置文件\)**

```
[omm@stb2 ~]$ gs_om -t refreshconf
Generating dynamic configuration file for all nodes.
Successfully generated dynamic configuration file.
## 将集群配置信息写入集群动态配置文件：/gauss/app/bin/cluster_dynamic_config
## 如果不执行该操作，下次主备集群启动时会报错
```

## 故障切换至级联备机\(Failover\)<a name="section8224194211408"></a>

当生产环境对于灾备级别的 RPO 要求不是非常严格时，为了降低容灾成本，最大限度减小灾备数据同步对生产环境的影响，往往会选择将灾备数据中心的备库设置为级联备机的角色。

那么，当生产环境数据中心发生灾难，全部故障时，只能使用灾备数据中心的级联备机进行 Failover，接管生产业务。前提：模拟生产数据中心故障，强行关闭实验环境中的主节点和两个备节点，仅剩级联备机一个节点。

**Failover 注意事项：**

- 级联备机不能直接转换为主机，只能先通过 switchover 或 failover 成为备机，然后再成为主机；
- 在执行主、备切换测试前，请确保已经更改默认的初始用户密码，否则可能测试失败。

**1. 查询集群状态\(在级联备机操作\)**

**Tips：** 这里需要吐槽一下/当主备集群的操作系统全部挂掉，仅剩级联备份时，使用 gs_om 工具的等待时间竟然需要 15 分钟之久，这个简直无法接受，这个等待时间需要优化。

```
[omm@casstb ~]$ date && gs_om -t status --detail && date      ## 为了测试需要多长时间，特意使用date标记......
Thu Jan 21 17:50:19 CST 2021
[   Cluster State   ]

cluster_state   : Unavailable
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

node                    node_ip         instance                state          |
--------------------------------------------------------------------------------
1  prod.opengauss.com   192.168.0.11    6001 /gauss/data/db1 P Unknown Unknown |
2  stb1.opengauss.com   192.168.0.12    6002 /gauss/data/db1 S Unknown Unknown |
3  stb2.opengauss.com   192.168.0.13    6003 /gauss/data/db1 S Unknown Unknown |
4  casstb.opengauss.com 192.168.0.14    6004 /gauss/data/db1 C Cascade Need repair(Disconnected)
Thu Jan 21 18:05:47 CST 2021
```

- 手动检查集群各节点状态

gs_om 工具等待时间太长，可以手动根据配置信息检查所有节点状态

```
## 查询集群静态配置文件信息
[omm@prod ~]$ gs_om -t view
NodeHeader:
version:301
time:1609922310
nodeCount:4
node:1
azName:AZ1
azPriority:1
node :1
nodeName:prod.opengauss.com
ssh channel :
sshChannel 1:192.168.0.11
datanodeCount :1
datanode 1:
datanodeLocalDataPath :/gauss/data/db1
datanodeXlogPath :
datanodeListenIP 1:192.168.0.11
datanodePort :26000
datanodeLocalHAIP 1:192.168.0.11
datanodeLocalHAPort :26001
dn_replication_num: 4
datanodePeer0DataPath :/gauss/data/db1
datanodePeer0HAIP 1:192.168.0.12
datanodePeer0HAPort :26001
datanodePeer1DataPath :/gauss/data/db1
datanodePeer1HAIP 1:192.168.0.13
datanodePeer1HAPort :26001
datanodePeer2DataPath :/gauss/data/db1
datanodePeer2HAIP 1:192.168.0.14
datanodePeer2HAPort :26001
azName:AZ1
azPriority:1
node :2
... ...
node :3
... ...
node :4
... ...

## 查询流复制状态
postgres=# select * from pg_stat_get_stream_replications();
   local_role    | static_connections |  db_state   | detail_information
-----------------+--------------------+-------------+--------------------
 Cascade Standby |                  3 | Need repair | Disconnected

## 最后分别登陆各个集群节点，检查节点的健康状态
```

**2. 级联备节点执行 failover**

```
[omm@casstb ~]$ gs_ctl failover -D /gauss/data/db1
[2021-01-21 18:09:34.613][8529][][gs_ctl]: gs_ctl failover ,datadir is /gauss/data/db1
[2021-01-21 18:09:34.613][8529][][gs_ctl]: failover term (1)
[2021-01-21 18:09:34.618][8529][][gs_ctl]:  waiting for server to failover.....
[2021-01-21 18:09:36.635][8529][][gs_ctl]:  done
[2021-01-21 18:09:36.635][8529][][gs_ctl]:  failover completed (/gauss/data/db1)
```

**Tips:** 官方文档说“级联备机不能直接转换为主机，只能先通过 switchover 或 failover 成为备机，然后再成为主机”，然而，gs_ctl 的 switchover 命令和 failover 命令并没有参数设置级联备为普通备，只能直接对级联备进行 failover 操作，并没有发现什么异常。

**3. 刷新动态配置文件报错\(当其他节点操作系统故障时，这一步就不用做了\)**

**Tips：** 当主备集群操作系统全部关闭，仅剩级联备份时，使用 gs_om 工具时，等待时间竟然需要 15 分钟之久，这个简直无法接受，代码还需要完善。\(操作系统启动后，gs_om 工具恢复正常，不再需要等待那么久\)

```
[omm@casstb ~]$ date && gs_om -t refreshconf && date
Thu Jan 21 18:13:01 CST 2021
Generating dynamic configuration file for all nodes.
[GAUSS-50205] : Failed to write dynamic configuration file. Error:
[GAUSS-51230] : The number of master dn must equal to 1.
## 将集群配置信息写入集群动态配置文件：/gauss/app/bin/cluster_dynamic_config
```

**4. 重启数据库\(新 Primary\)**

```
## 关闭数据库
[omm@casstb ~]$ gs_ctl stop -D /gauss/data/db1
[2021-01-21 18:33:57.786][12292][][gs_ctl]: gs_ctl stopped ,datadir is /gauss/data/db1
waiting for server to shut down........ done
server stopped

## 以Primary模式启动数据库
[omm@casstb ~]$ gs_ctl start -D /gauss/data/db1 -M primary
```

**5. 查看集群状态**

```
[omm@casstb ~]$ gs_om -t status --detail  ## 其他节点操作系统未启动，依然需要等待15分钟
[   Cluster State   ]

cluster_state   : Unavailable
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

node                    node_ip         instance                state          |
--------------------------------------------------------------------------------
1  prod.opengauss.com   192.168.0.11    6001 /gauss/data/db1 P Unknown Unknown |
2  stb1.opengauss.com   192.168.0.12    6002 /gauss/data/db1 S Unknown Unknown |
3  stb2.opengauss.com   192.168.0.13    6003 /gauss/data/db1 S Unknown Unknown |
4  casstb.opengauss.com 192.168.0.14    6004 /gauss/data/db1 C Primary Normal

## 查询复制状态
postgres=# select * from pg_stat_get_stream_replications();
 local_role | static_connections | db_state | detail_information
------------+--------------------+----------+--------------------
 Primary    |                  3 | Normal   | Normal
```

**6. 故障节点恢复**

检查集群状态

```
## 其他节点的操作系统恢复后，gs_om功能恢复正常
[omm@casstb ~]$ gs_om -t status  --detail
[   Cluster State   ]

cluster_state   : Degraded
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

node                    node_ip         instance                state                   |
-----------------------------------------------------------------------------------------
1  prod.opengauss.com   192.168.0.11    6001 /gauss/data/db1 P Down    Manually stopped |
2  stb1.opengauss.com   192.168.0.12    6002 /gauss/data/db1 S Down    Manually stopped |
3  stb2.opengauss.com   192.168.0.13    6003 /gauss/data/db1 S Down    Manually stopped |
4  casstb.opengauss.com 192.168.0.14    6004 /gauss/data/db1 C Primary Normal
```

刷新动态配置文件并重启集群

```
## 刷新动态配置文件
[omm@casstb ~]$ gs_om -t refreshconf
Generating dynamic configuration file for all nodes.
Successfully generated dynamic configuration file.

## 重启集群
[omm@casstb ~]$ gs_om -t restart
Stopping cluster.
=========================================
Successfully stopped cluster.
=========================================
End stop cluster.
Starting cluster.
=========================================
Waiting for check cluster state...
Waiting for check cluster state...
Waiting for check cluster state...
Waiting for check cluster state...
Waiting for check cluster state...
[GAUSS-51607] : Failed to start cluster. After startup, the last check results were Degraded. Please check manually.

## 查看集群状态
[omm@casstb ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Degraded
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

node                    node_ip         instance                state            |
----------------------------------------------------------------------------------
1  prod.opengauss.com   192.168.0.11    6001 /gauss/data/db1 P Standby Normal |
2  stb1.opengauss.com   192.168.0.12    6002 /gauss/data/db1 S Standby Normal |
3  stb2.opengauss.com   192.168.0.13    6003 /gauss/data/db1 S  Standby Need repair(WAL) |
4  casstb.opengauss.com 192.168.0.14    6004 /gauss/data/db1 C Primary Normal
```

重建问题备节点\(在问题节点 192.168.0.13 上处理\)

```
[omm@stb1 ~]$ gs_ctl build -D /gauss/data/db1 -b full
[omm@casstb ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

node                    node_ip         instance                state         |
-------------------------------------------------------------------------------
1  prod.opengauss.com   192.168.0.11    6001 /gauss/data/db1 P Standby Normal |
2  stb1.opengauss.com   192.168.0.12    6002 /gauss/data/db1 S Standby Normal |
3  stb2.opengauss.com   192.168.0.13    6003 /gauss/data/db1 S Standby Normal |
4  casstb.opengauss.com 192.168.0.14    6004 /gauss/data/db1 C Primary Normal

## 说明：虽然集群状态角色已经切换完毕，但是集群标签(如：P/S/C)并没有变更过来，这个需要修改
```

## 附录：集群“双主”问题处理<a name="section198711846184915"></a>

```
## 检查集群状态
[omm@casstb ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Unavailable
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

node                    node_ip         instance                state         |
-------------------------------------------------------------------------------
1  prod.opengauss.com   192.168.0.11    6001 /gauss/data/db1 P Standby Normal |
2  stb1.opengauss.com   192.168.0.12    6002 /gauss/data/db1 S Standby Normal |
3  stb2.opengauss.com   192.168.0.13    6003 /gauss/data/db1 S Primary Normal |
4  casstb.opengauss.com 192.168.0.14    6004 /gauss/data/db1 C Primary Normal

## 重启问题旧的主节点(192.168.0.13)
[omm@stb2 ~]$ gs_ctl stop -D /gauss/data/db1
[omm@stb2 ~]$ gs_ctl start -D /gauss/data/db1 -M standby

## 查看集群状态
[omm@casstb ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Degraded
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

node                    node_ip         instance                state                            |
--------------------------------------------------------------------------------------------------
1  prod.opengauss.com   192.168.0.11    6001 /gauss/data/db1 P Standby Need repair(Disconnected) |
2  stb1.opengauss.com   192.168.0.12    6002 /gauss/data/db1 S Standby Need repair(WAL) |
3  stb2.opengauss.com   192.168.0.13    6003 /gauss/data/db1 S Standby Need repair(WAL) |
4  casstb.opengauss.com 192.168.0.14    6004 /gauss/data/db1 C Primary Normal

## 重建备节点
[omm@prod ~]$ gs_ctl build -D /gauss/data/db1
[omm@stb1 ~]$ gs_ctl build -D /gauss/data/db1
[omm@stb2 ~]$ gs_ctl build -D /gauss/data/db1 -M cascade_standby   ## 重建级联备机需要加上-M cascade_standby参数

## 查看集群状态(已恢复正常)
[omm@casstb ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

node                    node_ip         instance                state         |
-------------------------------------------------------------------------------
1  prod.opengauss.com   192.168.0.11    6001 /gauss/data/db1 P Standby Normal |
2  stb1.opengauss.com   192.168.0.12    6002 /gauss/data/db1 S Standby Normal |
3  stb2.opengauss.com   192.168.0.13    6003 /gauss/data/db1 S Cascade Normal |
4  casstb.opengauss.com 192.168.0.14    6004 /gauss/data/db1 C Primary Normal

## 刷新动态配置文件
[omm@casstb ~]$ gs_om -t refreshconf
Generating dynamic configuration file for all nodes.
Successfully generated dynamic configuration file.
## 将集群配置信息写入集群动态配置文件：/gauss/app/bin/cluster_dynamic_config
```
