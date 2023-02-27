---
title: 'openGauss数据库xlog目录满问题处理'

date: '2021-09-21'

category: 'blog'
tags: ['openGauss数据库xlog目录满问题处理']

archives: '2021-09'

author: '阎书利'

summary: 'openGauss数据库xlog目录满问题处理'

img: '/zh/blogs/July/title/img11.png'

times: '12:30'
---

# openGauss 数据库 xlog 目录满问题处理<a name="ZH-CN_TOPIC_0000001200594229"></a>

openGauss 数据库 xlog 满通常为以下几个原因：

1.主备状态不正常，存在网络问题，集群内有宕机的节点

2.xlog 保留数量过多

3.逻辑复制槽失效，且未及时清理

4.开启归档，但归档失败导致 xlog 不清理

**首先，确认数据库状态**

```
gs_om -t query
```

确认主备状态，是否存在宕机的节点。

查看是否存在 down，Standby Need repair\(WAL\)或者 unkown 的状态。

如果数据库状态不正常，xlog 目录 100%

需要手动移走一部分 xlog 后，检查数据库状态后将库拉起，并排查相关问题。

如果数据库状态正常，仅 xlog 目录大，则继续排查其他问题。

**清理：**

1.找一个空间大的目录

例如：

```
su  - omm
cd /opengauss_bak
mkdir xlog_mv_0919
```

2.移走部分 xlog，到 xlog 路径下

```
cd /ogdata/data/dn1/pg_xlog
```

查看 xlog 数量,看是否 xlog 保留过多

```
ls | wc -l
```

！！！为了恢复环境，移动一小部分 xlog，其余等处理之后，自己清理

生成移动 xlog 语句，并检查（前 1000 条）

```
ls -ltr | head -n 1000 | awk '{print "mv "$9  " /opengauss_bak/xlog_mv_0919/"}'
```

3.\#实际执行移动操作

```
ls -ltr | head -n 1000 | awk '{print "mv "$9  " /opengauss_bak/xlog_mv_0919/"}' | sh
```

4.移动之后 df -Th 看空间是否下来

5.gs_om -t query 查看数据库状态

如果不正常，需要先尝试拉起主数据库

```
gs_ctl start -D /ogdata/data/dn1
```

然后依次拉起备机数据库

```
gs_ctl start -D /ogdata/data/dn1 -M standby
```

备库拉不起来则先不处理，等找到 xlog 目录满源头后（例如主库删除失效逻辑复制后）,考虑做 build\(先尝试增量不行再用增量）

```
gs_ctl build -D /ogdata/data/dn1 -b incremental
gs_ctl build -D /ogdata/data/dn1 -b full
```

6.登录主数据库查看逻辑复制槽状态，查看有无失效逻辑复制槽

```
select * from pg_replication_slots;
```

7.在主库删除失效逻辑复制槽

```
select * from pg_drop_replication_slot('aohdoasdaoiodiandoan');
---------aohdoasdaoiodiandoan为逻辑复制槽名字
```

删除失效的逻辑复制槽，主库和备库的 xlog 目录应该都会释放一部分空间

8.删除后 df -Th 看空间是否下来

9.参数调整

（1）查看 wal_keep_segments 参数，该参数为 Xlog 日志文件段数量,“pg_xlog”目录下保留事务日志文件的最小数目。

（2）查看 max_size_for_xlog_prune 参数，在 enable_xlog_prune 打开时生效，如果有备机断连且 xlog 日志大小大于此阈值，则回收日志。

根据实际状况，可进行修改。

（3）如果是 PG13 版本，可考虑开启 max_slot_wal_keep_size 参数，他是允许 replication slot 保留的 wal 文件的最大

大小，用于防止 wal 无限增大导致主库的文件系统空间被撑爆，设置该参数之后如果超过该参数值，PostgreSQL 将开始删除最

早的 WAL 文件。默认值是-1，-1 表示表示禁用本功能。单位是 MB。

10.检查归档模式是否开启

```
show archive_mode;
```

到归档目录下，看开启归档参数时，是否有归档。并检查归档空间，排除归档相关问题。
