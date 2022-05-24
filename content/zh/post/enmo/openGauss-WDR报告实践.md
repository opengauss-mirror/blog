+++

title = "openGauss-WDR报告实践" 

date = "2022-05-24" 

tags = ["openGauss-WDR报告实践"] 

archives = "2022-05" 

author = "云和恩墨" 

summary = "openGauss-WDR报告实践"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# openGauss-WDR报告实践

本文出处：[https://www.modb.pro/db/403529](https://www.modb.pro/db/403529)

## 简介

今天参加了《8小时玩转openGauss训练营》的课程，感谢各位openGauss的讲师和布道者精彩的分享，每个主题内容都很丰富，受益匪浅。每一个主题都值得进一步的学习和了解，其中《WDR报告和性能调优》我做了简单的实践。
Oracle的awr报告在日常解决问题中起到了很大的便利，在遇到问题时，我们通常会查看有无对应时间段的快照，生成awr报告并进一步分析。通过分析数据库的状态，资源消耗以及等待事件等初步定位问题，
并在此基础上进行验证。在opengauss数据库中，也有着这样的“awr”，它叫做WDR（Workload Diagnostic Report）负载诊断报告，是openGauss的工作负载诊断报告，常用于判断openGauss长期性能问题。WDR报告基于两次不同时间点系统的性能快照数据，生成这两个时间点之间的性能表现报表。

## 实践

#### 1.打开参数enable_wdr_snapshot

```
postgres=# show enable_wdr_snapshot;
enable_wdr_snapshot
\---------------------
on
(1 row)WDR Snasphot在启动后,会在用户表空间"pg_default"，数据库"postgres"下新建schema “snapshot”，用于持久化WDR快照数据。
```

#### 2.WDR Snasphot性能快照数量大于等于2。

操作步骤：
1.执行以下命令查询已经生成的快照

```
postgres=# select * from snapshot.snapshot;
snapshot_id | start_ts | end_ts 
-------------+-------------------------------+-------------------------------
1 | 2022-05-15 15:02:15.990876+08 | 2022-05-15 15:02:18.555272+08
2 | 2022-05-15 15:08:12.470218+08 | 2022-05-15 15:08:14.514862+08
3 | 2022-05-15 16:02:16.709364+08 | 2022-05-15 16:02:17.643546+08
4 | 2022-05-15 17:02:17.617386+08 | 2022-05-15 17:02:20.626552+08
............
43 | 2021-07-10 07:02:36.418031+08 | 2021-07-10 07:02:37.380217+08
44 | 2021-08-05 00:21:09.062745+08 | 2021-08-05 00:21:10.33016+08
(44 rows)
```


2.可以选择手从创建快照，该命令需要用户具有sysadmin权限。或者直接选取数据库中已有的快照。

```
postgres=# select create_wdr_snapshot();
create_wdr_snapshot 
\-----------------------------------------
WDR snapshot request has been submitted
(1 row)
postgres=# select * from snapshot.snapshot;
snapshot_id | start_ts | end_ts 
-------------+-------------------------------+-------------------------------
1 | 2022-05-15 15:02:15.990876+08 | 2022-05-15 15:02:18.555272+08
2 | 2022-05-15 15:08:12.470218+08 | 2022-05-15 15:08:14.514862+08
3 | 2022-05-15 16:02:16.709364+08 | 2022-05-15 16:02:17.643546+08
4 | 2022-05-15 17:02:17.617386+08 | 2022-05-15 17:02:20.626552+08
............
43 | 2021-07-10 07:02:36.418031+08 | 2021-07-10 07:02:37.380217+08
44 | 2021-08-05 00:21:09.062745+08 | 2021-08-05 00:21:10.33016+08
45 | 2021-08-05 00:39:43.777341+08 | 2021-08-05 00:39:44.760498+08 //这一快照为刚才手动执行生成的
(45 rows)
```

3.执行如下步骤，生成node级别wdr报告

1）查询 pgxc_node_name参数值

```
[omm@node1 ~]$ gsql -p 26000 postgres -c "show pgxc_node_name"
pgxc_node_name
\----------------
dn_6001_6002
(1 row)
```

2） \a \t \o 服务器文件路径生成格式化性能报告
例如

```
postgres=# \a \t \o /home/omm/wdr_sarah.html
Output format is unaligned.
Showing only tuples.
```

上述命令涉及参数说明如下：
\a：切换非对齐模式。
\t：切换输出的字段名的信息和行计数脚注。
\o：把所有的查询结果发送至服务器文件里。
服务器文件路径：生成性能报告文件存放路径。用户需要拥有此路径的读写权限。

3）向性能报告wdr_sarah.html中写入数据。
gsql -p 26000 -d postgres
select generate_wdr_report(快照id1,快照id2,‘all’,‘node’,‘pgxc_node_name参数值’);
例如
postgres=# select generate_wdr_report(44,45,'all','node','dn_6001_6002');
目录下生成对应的wdr报告
拿到浏览器上查看：
opengauss的awr报告类似于oracle的wdr，拥有资源消耗、等待事件、TOPSQL，以及参数设置等。
快照相关参数

enable_wdr_snapshot
参数说明：是否开启数据库监控快照功能。
wdr_snapshot_retention_days
参数说明：系统中数据库监控快照数据的保留天数。当数据库运行过程期间所生成的快照量数超过保留天数内允许生成的快照数量的最大值时，系统将每隔wdr_snapshot_interval时间间隔，清理snapshot_id最小的快照数据。
wdr_snapshot_interval
参数说明：后台线程Snapshot自动对数据库监控数据执行快照操作的时间间隔。
wdr_snapshot_query_timeout
参数说明：系统执行数据库监控快照操作时，设置快照操作相关的sql语句的执行超时时间。如果语句超过设置的时间没有执行完并返回结果，则本次快照操作失败。
