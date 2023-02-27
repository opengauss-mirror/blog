---
title: '根据openGauss/MogDB的lwtid查看线程堆栈'

date: '2022-07-28'

category: 'blog'
tags: ['MogDB']

archives: '2022-07'

author: '云和恩墨'

summary: '根据openGauss/MogDB的lwtid查看线程堆栈'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# 根据 openGauss/MogDB 的 lwtid 查看线程堆栈

本文出处：https://www.modb.pro/db/448030

在 openGauss/MogDB 数据库 THREAD_WAIT_STATUS、PG_THREAD_WAIT_STATUS、GLOBAL_THREAD_WAIT_STATUS、LOCAL_ACTIVE_SESSION 的几个视图里都有 lwtid 这一列，他是当前线程的轻量级线程号。可以根据这一列通过 pstack 命令去抓取堆栈，供问题的分析。

如下所示，可以用 pg_stat_activity 和 dbe_perf.thread_wait_status 结合，查询当前正在运行的一些 SQL，通过

```
MogDB=# select  pid,lwtid,state,wait_event,query from pg_stat_activity a,dbe_perf.thread_wait_status s where a.pid=s.tid;
      pid       |  lwtid  | state  | wait_event |                                                       query

----------------+---------+--------+------------+-------------------------------------------------------------------------------------------------------------
------
 23043933468416 | 1724740 | active | none       | select  pid,lwtid,state,wait_event,query from pg_stat_activity a,dbe_perf.thread_wait_status s where a.pid=s
.tid;
 23044103272192 | 1724300 | active | none       | select pg_sleep(30);
 23044453037824 | 1526848 |        | none       |
 23044479776512 | 1526847 |        | none       |
 23044508612352 | 1526846 | active | none       | WLM fetch collect info from data nodes
 23044674287360 | 1526842 | idle   | none       |
 23044771804928 | 1526839 | idle   | none       |
 23044739823360 | 1526840 | active | none       |
 23044698928896 | 1526841 | active | none       |
 23044832098048 | 1526837 |        | none       |
 23044928567040 | 1526834 | active | none       |
(11 rows)
```

我们通过 pstack 去查看上边 lwtid=1724300 对应的 select pg_sleep(30);的堆栈。

```
[ptk1@mogdb-kernel-0005 ~]$ pstack 1724300
Thread 1 (Thread 0x14f55f96f700 (LWP 1724300)):
#0  0x000014f98e8d829f in select () from /lib64/libc.so.6
#1  0x0000555ba97ae25d in pg_usleep(long) ()
#2  0x0000555ba87cef4a in pg_sleep(FunctionCallInfoData*) ()
#3  0x0000555ba8fad525 in ?? ()
#4  0x0000555ba8fadb59 in ExecProject(ProjectionInfo*, ExprDoneCond*) ()
#5  0x0000555ba8ffb948 in ExecResult(ResultState*) ()
#6  0x0000555ba8f9c6ee in ExecProcNode(PlanState*) ()
#7  0x0000555ba8f95318 in standard_ExecutorRun(QueryDesc*, ScanDirection, long) ()
#8  0x0000555ba8e25ed5 in ?? ()
#9  0x0000555ba8f956ad in ExecutorRun(QueryDesc*, ScanDirection, long) ()
#10 0x0000555ba8f148b3 in ?? ()
#11 0x0000555ba8f14fa0 in PortalRun(PortalData*, long, bool, _DestReceiver*, _DestReceiver*, char*) ()
#12 0x0000555ba8f095a2 in ?? ()
#13 0x0000555ba8f0ce97 in PostgresMain(int, char**, char const*, char const*) ()
#14 0x0000555ba8e6b501 in ?? ()
#15 0x0000555ba8e89fb8 in int GaussDbThreadMain<(knl_thread_role)1>(knl_thread_arg*) ()
#16 0x0000555ba8e6b585 in ?? ()
#17 0x000014f98ebb117a in start_thread () from /lib64/libpthread.so.0
#18 0x000014f98e8e0dc3 in clone () from /lib64/libc.so.6
```

可以清晰地看到，堆栈从 PostgresMain 到后来调用了 pg_sleep 的各个部分，以及后来的 pg_usleep 休眠部分。

也可以根据 lwtid 找到想分析的一些关键线程，例如一些特殊功能的线程，如 WDRSnapshot、ASP、CheckPointer 等、或者是在数据库中有长时间在跑的 SQL 的线程以及需要分析的等待事件对应的线程。

```
 node_name | db_name  |      thread_name       |     query_id     |      tid       |   sessionid    |  lwtid  | psessionid | tlevel | smpid | wait_status | wa
it_event | locktag | lockmode | block_sessionid | global_sessionid
-----------+----------+------------------------+------------------+----------------+----------------+---------+------------+--------+-------+-------------+---
---------+---------+----------+-----------------+------------------
 dn_6001   | postgres | gsql                   | 1407374883636205 | 23044103272192 | 23044103272192 | 1724935 |            |      0 |     0 | none        | no
ne       |         |          |                 | 0:0#0
 dn_6001   | postgres | WLMArbiter             |                0 | 23044453037824 | 23044453037824 | 1526848 |            |      0 |     0 | none        | no
ne       |         |          |                 | 0:0#0
 dn_6001   | postgres | WorkloadMonitor        |                0 | 23044479776512 | 23044479776512 | 1526847 |            |      0 |     0 | none        | no
ne       |         |          |                 | 0:0#0
 dn_6001   | postgres | workload               |                0 | 23044508612352 | 23044508612352 | 1526846 |            |      0 |     0 | none        | no
ne       |         |          |                 | 0:0#0
 dn_6001   | postgres | statement flush thread |                0 | 23044674287360 | 23044674287360 | 1526842 |            |      0 |     0 | none        | no
ne       |         |          |                 | 0:0#0
 dn_6001   | postgres | WDRSnapshot            | 1407374883553280 | 23044771804928 | 23044771804928 | 1526839 |            |      0 |     0 | none        | no
ne       |         |          |                 | 0:0#0
 dn_6001   | postgres | PercentileJob          |                0 | 23044739823360 | 23044739823360 | 1526840 |            |      0 |     0 | none        | no
ne       |         |          |                 | 0:0#0
 dn_6001   | postgres | Asp                    |                0 | 23044698928896 | 23044698928896 | 1526841 |            |      0 |     0 | none        | no
ne       |         |          |                 | 0:0#0
 dn_6001   | postgres | ApplyLauncher          |                0 | 23044832098048 | 23044832098048 | 1526837 |            |      0 |     0 | none        | no
ne       |         |          |                 | 0:0#0
 dn_6001   | postgres | JobScheduler           |                0 | 23044928567040 | 23044928567040 | 1526834 |            |      0 |     0 | none        | no
ne       |         |          |                 | 0:0#0
(10 rows)
```

如下所示，可以看到 lwtid=1526839 对应的是 WDRSnapshot 线程它当前的一个堆栈情况。

```
[ptk1@mogdb-kernel-0005 ~]$ pstack 1526839
Thread 1 (Thread 0x14f5876ff700 (LWP 1526839)):
#0  0x000014f98e8d829f in select () from /lib64/libc.so.6
#1  0x0000555ba97ae25d in pg_usleep(long) ()
#2  0x0000555ba8a83e83 in SnapshotNameSpace::SubSnapshotMain() ()
#3  0x0000555ba8a843c5 in SnapshotMain() ()
#4  0x0000555ba8e87e41 in int GaussDbThreadMain<(knl_thread_role)35>(knl_thread_arg*) ()
#5  0x0000555ba8e6b585 in ?? ()
#6  0x000014f98ebb117a in start_thread () from /lib64/libpthread.so.0
#7  0x000014f98e8e0dc3 in clone () from /lib64/libc.so.6
```
