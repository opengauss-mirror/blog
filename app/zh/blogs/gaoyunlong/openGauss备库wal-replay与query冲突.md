---
title: 'openGauss备库wal replay与query冲突'

date: '2020-11-25'

category: 'blog'
tags: ['openGauss故障处理']

archives: '2020-11'

author: '高云龙'

summary: 'openGauss备库wal replay与query冲突'

img: '/zh/blogs/gaoyunlong/title/img33.png'

times: '15:30'
---

# openGauss 备库 wal replay 与 query 冲突<a name="ZH-CN_TOPIC_0293240560"></a>

## 概述<a name="section15222171311307"></a>

openGauss 的物理流复制逻辑继承了 PostgreSQL，当一条数据从主库做变更到可以在备库查询到最新的值，在 PostgreSQL 备库分为三个阶段，分别是写入备库操作系统（remote_write），将缓存中的数据刷入到磁盘（on == flush），从磁盘将数据库回放\(remote_apply\)；在 openGauss（自编译 1116 版本）备库中的三个阶段分别是接收 wal（remote_receive），写入\(remote_write\)，回放（remote_apply）。

日常生产环境中，为了分担主库的访问压力，备库（hot_standby=on）常常需要对外提供只读服务，此时备库既要接受并重放通过流协议传过来的 wal 数据，同时也要对外提供只读查询服务，这两个任务同时进行难免会产生冲突，有时我们会发现备库的查询直接被取消中断，当数据库集群备库中出现如下所示的报错。

```
ERROR: canceling statement due to conflict with recovery
Detail: User query might have needed to see row versions that must be removed
```

当日志中出现这个报错，说明 wal apply 的操作与 query 冲突，查询的 sql 被取消，按常规来说 wal 数据回放级别应该是最高的，要保证备库第一时间获取并重放最新数据，与主库的数据保持一致，但是考虑到备库可以提供对外只读查询服务，添加参数 max_standby_streaming_delay 来告诉备库，如果发现与备库当前查询冲突，需要等待 max_standby_streaming_delay 的时长，如果超过这个时长，查询还没结束，就直接取消掉查询操作，而这种冲突常常出现在主库执行 vacuum 和 ddl 操作。

## 冲突原因<a name="section138214453114"></a>

出现冲突报错的原因可能是由以下几种情况产生：

1.  max_standby_streaming_delay 参数值设置过低 PostgreSQL 的默认值是 30s，openGauss 的默认值是 3s，这个值需根据不同的业务应用去设置。
2.  备库 sql 执行时间过长由于数据量增加或数据倾斜、表或索引膨胀等因素导致 sql 执行变慢。
3.  备机服务器压力过大，处理慢主库开启了 full_page_writes，wal 的数据量变大，备库需要处理的数据增多，是备库的负载增加。

## 优化建议<a name="section146054193519"></a>

1.  调整参数值

    1.  适当增加 max_standby_streaming_delay 参数值，根据使用场景自定义设置。
    2.  设置参数 hot_standby_feedback = on，告诉主库执行 vacuum 操作时需要跳过哪些历史数据（不建议使用，会造成主库表膨胀）。
    3.  主节点设置 vacuum_defer_cleanup_age 参数，延迟清理 dead row（不建议使用，不好控制有效值）。
    4.  关闭 full_page_writes 参数，开启 enable_double_write 和 enable_incremental_checkpoint 参数来替代，openGauss 特性。

2.  优化 sql 可通过执行计划查找 sql 变慢，执行效率变差的原因，并修复。
3.  提升硬件配置查看服务器硬件资源使用情况，并做适当优化及调整。
4.  开启并发 apply（opengauss 特有）开启并发回放参数 recovery_max_workers（默认值是 1，最大值是 4），来快速恢复 wal 数据并重放，提升效率。
