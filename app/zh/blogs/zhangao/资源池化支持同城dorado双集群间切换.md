---
title: '资源池化支持同城dorado双集群间切换'
date: '2023-09-26'
category: 'blog'
tags: ['资源池化支持同城dorado双集群间切换']
archives: '2023-09-26'
author: 'zhangao_za'
summary: '资源池化支持同城dorado双集群间切换'
times: '9:30'
---

资源池化支持同城 dorado 双集群间部署方式：cm 模拟(手动部署 dd 模拟+有 cm)、磁阵(手动部署)、集群管理工具部署

## 1.集群间切换

    基于《资源池化+同城dorado双集群》部署方式，集群间切换设计如下：

### &nbsp;&nbsp;1.1.主备集群状态
前提条件：已经部署资源池化同城双集群环境

<table>
<tbody>
    <tr>
        <td>集群中心</td>
        <td>端</td>
        <td>节点类型</td>
        <td>local role</td>
        <td>run mode</td>
    </tr>
    <tr>
        <td rowspan='2'>生产中心</td>
        <td rowspan='2'>主端</td>
        <td>主节点0</td>
        <td>primary</td>
        <td>primary (资源池化+传统主)</td>
    </tr>
        <td>备节点1</td>
        <td>standby</td>
        <td>normal (资源池化+传统单机)</td>
    <tr>
        <td rowspan='2'>容灾中心</td>
        <td rowspan='2'>备端</td>
        <td>首备节点0</td>
        <td>standby</td>
        <td>standby(资源池化+传统备)</td>
    </tr>
        <td>从备节点1</td>
        <td>standby</td>
        <td>normal (资源池化+传统单机)</td>
</tbody>
</table>

local role 从系统函数 pg_stat_get_stream_replications 中获取的 local_role 参数：

```
openGauss=# select * from pg_stat_get_stream_replications();
 local_role | static_connections | db_state | detail_information
------------+--------------------+----------+--------------------
 Primary    |                  1 | Normal   | Normal
(1 row)
```

`Tips`:run mode 指数据库内核运行模式是primary还是standby还是normal，是t_thrd.postmaster_cxt.HaShmData->current_mode或t_thrd.xlog_cxt.server_mode参数指代的主备运行模式类型

### &nbsp;&nbsp;1.2.failover
&emsp;以下提到的/home/omm/ss_hatest/dn0为数据库dn目录，解释如下：
<table>
<tbody>
    <tr>
        <td>集群中心</td>
        <td>端</td>
        <td>节点类型</td>
        <td>local role</td>
        <td>dn目录</td>
    </tr>
    <tr>
        <td rowspan='2'>生产中心</td>
        <td rowspan='2'>主端</td>
        <td>主节点0</td>
        <td>primary</td>
        <td>/home/omm/ss_hatest/dn0</td>
    </tr>
        <td>备节点1</td>
        <td>standby</td>
        <td>/home/omm/ss_hatest/dn1</td>
    <tr>
        <td rowspan='2'>容灾中心</td>
        <td rowspan='2'>备端</td>
        <td>首备节点0</td>
        <td>Main Standby</td>
        <td>/home/omm/ss_hatest1/dn0</td>
    </tr>
        <td>从备节点1</td>
        <td>standby</td>
        <td>/home/omm/ss_hatest1/dn1</td>
</tbody>
</table>

&emsp;双集群间failover即主集群故障，备集群升为主集群的过程，操作过程如下：

(1) kill 主集群
&emsp;将主集群节点全部 kill 掉
(2) stop 备集群

```
gs_ctl stop -D /home/omm/ss_hatest1/dn0
gs_ctl stop -D /home/omm/ss_hatest1/dn1
```

(3) 分裂同步复制关系，取消从资源写保护，使从端可写

&emsp;如果是cm模拟部署方式(博客：博客资源池化同城dorado双集群部署二之cm模拟部署)，不需要在管控平台做操作。

&emsp;如果是om部署方式(博客：资源池化同城dorado双集群部署四之om部署)，则在拉起集群之前，需要在管控平台分裂远程复制pair，操作如下：
&emsp;登录到备存储管控平台，操作：数据保护 -> LUN -> 远程复制Pair -> 找到远程同步复制xlog对应的lun -> 更多 -> 分裂 && 取消从资源保护。

(4) 将拟升主的备集群CM及DSS参数设置为主集群

```
CM:
cm_ctl set --param --server -k backup_open=0
cm_ctl set --param --agent -k agent_backup_open=0
cm_ctl set --param --agent -k dorado_cluster_mode=1
DSS:
在$DSS_HOME/cfg/dss_inst.ini文件中修改CLUSTER_RUN_MODE（拟升主的备集群所有节点）
CLUSTER_RUN_MODE=cluster_primary
```

(5) 拟升主的备集群的首备节点升主
```
gs_ctl failover -D /home/omm/ss_hatest1/dn0
```

(6) 切换同步复制关系

&emsp;在管控平台切换同步复制对方向的操作，操作如下：
&emsp;登录到备存储管控平台，操作：数据保护 -> LUN -> 远程复制Pair -> 找到远程同步复制xlog对应的lun -> 更多 -> 主从切换 && 启用从资源保护 && 同步。

(7) 重新拉起新备集群

设置新备集群CM和DSS参数

```
CM:
cm_ctl set --param --server -k backup_open=1
cm_ctl set --param --agent -k agent_backup_open=1
cm_ctl set --param --agent -k dorado_cluster_mode=2
DSS:
在$DSS_HOME/cfg/dss_inst.ini文件中增加CLUSTER_RUN_MODE参数
CLUSTER_RUN_MODE=cluster_standby
```

启动新备集群

```
cm_ctl start
```

### &nbsp;&nbsp;1.2.switchover
&emsp;双集群间switchover即主集群降为备集群，备集群升为主集群的过程，操作过程如下：

(1) stop 主集群

```
gs_ctl stop -D /home/omm/ss_hatest/dn0
gs_ctl stop -D /home/omm/ss_hatest/dn1
```

(2) stop 备集群

```
gs_ctl stop -D /home/omm/ss_hatest1/dn0
gs_ctl stop -D /home/omm/ss_hatest1/dn1
```

(3) 备集群设置 cluster_run_mode

```
gs_guc set -Z datanode -D /home/omm/ss_hatest1/dn0 -c "cluster_run_mode=cluster_primary"
```

(4) 切换远程同步复制主从端
&emsp;如果是cm模拟部署方式(博客：博客资源池化同城dorado双集群部署二之cm模拟部署)，不需要在管控平台切换同步复制对方向的操作。

&emsp;如果是om部署方式(博客：资源池化同城dorado双集群部署四之om部署)，则在拉起集群之前，需要在管控平台切换同步复制对方向的操作，操作如下：
&emsp;登录到备存储管控平台，操作data protection -> luns -> remote replication pairs(远程复制对) -> 找到远程同步复制xlog对应的lun -> More -> Primary/Standby Switchover，操作完后，即可看到Local Resource从Secondary变成Primary。

(5) 以主集群模式重启备集群的节点
```
gs_ctl start -D /home/omm/ss_hatest1/dn0 -M primary
gs_ctl start -D /home/omm/ss_hatest1/dn1
```

(5) 查询新主集群

```
gs_ctl query -D /home/omm/ss_hatest1/dn0
```

(6) 主集群设置 cluster_run_mode=cluster_standby

```
gs_guc set -Z datanode -D /home/zx/ss_hatest/dn0 -c "cluster_run_mode=cluster_standby"
```

(7) 以备集群模式重启备集群的节点

```
gs_ctl start -D /home/omm/ss_hatest/dn0 -M standby
gs_ctl start -D /home/omm/ss_hatest/dn1
```

(8) 查询新备集群

```
gs_ctl query -D /home/omm/ss_hatest/dn0
```

***Notice:不推荐直接用于生产环境***
***作者：zhangao_za***
