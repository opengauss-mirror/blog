---
title: '关于集群节点timeline不一致的处理方式'

date: '2022-05-18'

category: 'blog'
tags: ['关于集群节点timeline不一致的处理方式']

archives: '2022-05'

author: '高云龙'

summary: '关于集群节点timeline不一致的处理方式'

img: '/zh/blogs/gaoyunlong/title/img24.png'

times: '10:20'
---

# 关于集群节点 timeline 不一致的处理方式

本文出处：[https://www.modb.pro/db/400223](https://www.modb.pro/db/400223)

在 PostgreSQL/MogDB/openGauss 数据库日常维护过程中，如果多次对数据库进行角色切换，可能会出现 timeline 不一致的情况，导致备库不能正常加入到数据库集群，现在以 PG 为例对这些可能发生的情况进行复现，并进行整理。

### timeline 介绍

为了将基于时间点恢复后生成的 WAL 记录序列与初始数据库历史中产生的 WAL 记录序列区分开来，避免原来的 wal 文件被覆盖，同时也为了避免管理混乱，PostgreSQL 数据库引入了“时间线”的概念，使其可以通过备份恢复到任何之前的状态，包括早先被放弃的时间线分支中的状态。

当一次归档恢复完成，一个新的时间线被创建来标识恢复之后生成的 WAL 记录序列。时间线 ID 号是 WAL 段文件名的一部分，因此一个新的时间线不会重写由之前的时间线生成的 WAL 数据。

#### 场景一

```
--主库日志
ERROR:  requested starting point 0/8000000 on timeline 1 is not in this server's history
DETAIL:  This server's history forked from timeline 1 at 0/6018D98.
STATEMENT:  START_REPLICATION 0/8000000 TIMELINE 1

--备库日志
LOG:  new timeline 2 forked off current database system timeline 1 before current recovery point 0/80000A0
FATAL:  could not start WAL streaming: ERROR:  requested starting point 0/8000000 on timeline 1 is not in this server's history
DETAIL:  This server's history forked from timeline 1 at 0/6018D98.
```

**发生场景**

- 备库 promote 为主库，源主库以备库的方式重新加入集群
- 以备份的方式恢复为新主库，源主库以备库的方式加入集群

**处理方式**

- 重建备库，适用数据量较小的数据库
- 借助 pg_rewind 工具，推荐使用这种方式
  pg_rewind 会把所有的配置文件都覆盖，建议提前做好备份 并在启动前添加 recovery.conf 或 standby.signal 文件

**pg_rewind 相关报错**

```
pg_rewind: fatal: target server needs to use either data checksums or "wal_log_hints = on"
即使数据库已经开启了wal_log_hints = on，依然报这个错，这时需要以primary的形式重启一下数据库。

pg_rewind: source and target cluster are on the same timeline
pg_rewind: no rewind required
主备时间线一致，无法直接使用，这时需要让目标节点先以备库的方式运行，然后通过promote提升为主节点，增加timeline，再次执行pg_rewind

pg_rewind: fatal: could not find common ancestor of the source and target cluster's timelines
建议直接重建备库
```

#### 场景二

```
--备库启动失败
LOG:  entering standby mode
FATAL:  requested timeline 2 is not a child of this server's history
DETAIL:  Latest checkpoint is at 0/8000028 on timeline 1, but in the history of the requested timeline, the server forked off from that timeline at 0/6018D98.
LOG:  startup process (PID 1059) exited with exit code 1

```

**发生场景**

- 在场景一中启动数据库，会将新主库的 00000002.history 传输到备库本地

```
[postgres@bogon pg_wal]$ ls -l
total 49160
-rw-------. 1 postgres postgres      332 May  5 20:52 000000010000000000000004.00000028.backup
-rw-------. 1 postgres postgres 16777216 May  6 08:54 000000010000000000000008
-rw-------. 1 postgres postgres 16777216 May  6 08:49 000000010000000000000009
-rw-------. 1 postgres postgres 16777216 May  6 08:54 00000001000000000000000A
-rw-------. 1 postgres postgres       32 May  6 08:58 00000002.history
drwx------. 2 postgres postgres       88 May  6 08:58 archive_status

```

**处理方式**

- 将**pg_wal、archive_status 和 归档目录** 中的 00000002.history 删除即可

```
[postgres@bogon pg_wal]$ rm -f 00000002.history
[postgres@bogon pg_wal]$ cd archive_status/
[postgres@bogon archive_status]$ ls -l
total 0
-rw-------. 1 postgres postgres 0 May  5 20:52 000000010000000000000004.00000028.backup.done
-rw-------. 1 postgres postgres 0 May  6 08:58 00000002.history.done
[postgres@bogon archive_status]$ rm -rf *
[postgres@bogon archive_status]$

```

#### 场景三

```
LOG:  started streaming WAL from primary at 0/7000000 on timeline 2
FATAL:  could not receive data from WAL stream: ERROR:  requested starting point 0/7000000 is ahead of the WAL flush position of this server 0/601A5D8
cp: cannot stat ‘/data/pgarchive/00000003.history’: No such file or directory
cp: cannot stat ‘/data/pgarchive/000000020000000000000007’: No such file or directory

```

**发生场景**

- 备库以单机（未加入集群，以 primary 的角色）的方式启动过，虽然时间线没变，但是 wal 文件已经不一致

**处理方式**
此时由于备库的需要从 0/7000000 开始进行重放，已经比主库的 0/601A5D8 提前，说明此时数据库已经不一致。
尝试过修改通过 pg_resetwal 修改 timeline，也尝试过通过 pg_switch_wal()切换 wal 文件，依然无法通过 pg_rewind 进行处理，原因是 wal 不连续，只能**选择重建**

```
--修改timeline
postgres=# SELECT timeline_id,redo_wal_file FROM pg_control_checkpoint();
 timeline_id |      redo_wal_file
-------------+--------------------------
           2 | 00000002000000000000000F
(1 row)

$pg_resetwal -l 000000030000000000000010 /data/pgdata14/
Write-ahead log reset

--修改时间线
postgres=# SELECT timeline_id,redo_wal_file FROM pg_control_checkpoint();
 timeline_id |      redo_wal_file
-------------+--------------------------
           3 | 000000030000000000000012
(1 row)

--切换wal
postgres=# select pg_switch_wal();
$ pg_ctl promote -D /data/pgdata14

```

### 总结

- 备库在运行过程中，以 promote 的方式提升为主，即使有数据写入，只要 wal 完整，也可以使用 pg_rewind 回退.
  **在 pg_rewind 完成后启动，注意修改参数文件、hba 文件、清理归档日志及添加 standby.signal/recovery.conf**
- 备库在运行过程中，以主库的方式重启过，即使没有任何操作，也没有办法回退，只能重建
  **只要中间以主库运行过，wal 就没有办法连续了**
