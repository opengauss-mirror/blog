---
title: 'Mogdb备机处于standby need-repair(WAL)状态怎么处理'
category: 'blog'
date: '2023-04-30'

tags: ['openGauss安装']

archives: '2023-04'

author: '张翠娉'

summary: 'Mogdb备机处于standby need-repair(WAL)状态怎么处理'

img: '/zh/post/zhangcuiping/title/img.png'

times: '14:20'
---

# Mogdb 备机处于 standby need-repair 状态怎么处理？

**背景介绍**：

Mogdb 主备环境，备机检查发现 Standby Need repair 故障。

**报错原因**：

因网络故障、磁盘满等原因造成主备实例连接断开，主备日志不同步，导致数据库集群在启动时异常。

**主备状态检查**：

```bash
[root@hostname data]# ptk cluster -n mogdb12 status
[   Cluster State   ]
cluster_name                            : mogdb12
cluster_state                           : Degraded
database_version                        : MogDB 3.0.0 (build 62408a0f)

[  Datanode State   ]
  cluster_name |  id  |      ip      | port  | user  | nodename | db_role |               state                | upstream
---------------+------+--------------+-------+-------+----------+---------+------------------------------------+-----------
  mogdb12      | 6001 | 172.16.0.245 | 26007 | omm12 | dn_6001  | primary | Normal                             | -
               | 6002 | 172.16.0.127 | 26007 | omm12 | dn_6002  | standby | Need repair(System id not matched) | -
```

**解决办法**：

通过 gs_ctl build -D 命令对故障节点进行重建。在此例中我们切换到 need repair 的主机上，执行如下命令进行修复：

```
gs_ctl build -D /home/omm12/mogdb/data
```

**恢复后主备状态检查**：

```
[root@hostname data]# ptk cluster -n mogdb12 status
[   Cluster State   ]
cluster_name                            : mogdb12
cluster_state                           : Normal
database_version                        : MogDB 3.0.0 (build 62408a0f)

[  Datanode State   ]
  cluster_name |  id  |      ip      | port  | user  | nodename | db_role | state  | upstream
---------------+------+--------------+-------+-------+----------+---------+--------+-----------
  mogdb12      | 6001 | 172.16.0.245 | 26007 | omm12 | dn_6001  | primary | Normal | -
               | 6002 | 172.16.0.127 | 26007 | omm12 | dn_6002  | standby | Normal | -
```
