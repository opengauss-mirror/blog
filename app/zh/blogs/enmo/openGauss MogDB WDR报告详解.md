---
title: 'openGauss/MogDB WDR报告详解'

date: '2022-05-12'

category: 'blog'
tags: ['openGauss/MogDB WDR报告详解']

archives: '2022-05'

author: '云和恩墨'

summary: 'openGauss/MogDB WDR报告详解'

img: '/zh/blogs/enmo/title/img6.png'

times: '10:20'
---

# openGauss/MogDB WDR 报告详解

本文出处：[https://www.modb.pro/db/401290](https://www.modb.pro/db/401290)

# 摘要

> WDR(Workload Diagnosis Report)**负载诊断报告**，是 openGauss 的工作负载诊断报告，常用于判断 openGauss 长期性能问题。WDR 报告基于两次不同时间点系统的性能快照数据，生成这两个时间点之间的性能表现报表。

# 开启 WDR 快照

## 参数简介

### enable_wdr_snapshot

**参数说明**: 是否开启数据库监控快照功能。

该参数属于 SIGHUP 类型参数，请参考表[GUC 参数分类](https://docs.mogdb.io/zh/mogdb/v2.1/30-appendix)中对应设置方法进行设置。

**取值范围**: 布尔型

- on: 打开数据库监控快照功能。
- off: 关闭数据库监控快照功能。

**默认值**: off

### wdr_snapshot_retention_days

**参数说明**: 系统中数据库监控快照数据的保留天数，超过设置的值之后，系统每隔 wdr_snapshot_interval 时间间隔，清理 snapshot_id 最小的快照数据。

该参数属于 SIGHUP 类型参数，请参考表[GUC 参数分类](https://docs.mogdb.io/zh/mogdb/v2.1/30-appendix)中对应设置方法进行设置。

**取值范围:** 整型，1 ～ 8。

**默认值**: 8

### wdr_snapshot_query_timeout

**参数说明**: 系统执行数据库监控快照操作时，设置快照操作相关的 sql 语句的执行超时时间。如果语句超过设置的时间没有执行完并返回结果，则本次快照操作失败。

该参数属于 SIGHUP 类型参数，请参考表[GUC 参数分类](https://docs.mogdb.io/zh/mogdb/v2.1/30-appendix)中对应设置方法进行设置。

**取值范围:** 整型，100 ～ INT_MAX（秒）。

**默认值**: 100s

### wdr_snapshot_interval

**参数说明**: 后台线程 Snapshot 自动对数据库监控数据执行快照操作的时间间隔。

该参数属于 SIGHUP 类型参数，请参考表[GUC 参数分类](https://docs.mogdb.io/zh/mogdb/v2.1/30-appendix)中对应设置方法进行设置。

**取值范围:** 整型，10 ～ 60（分钟）。

**默认值**: 1h

## 查看当前 wdr 相关配置

```
postgres@omm:local=#select name, setting from pg_settings where name like '%wdr%';
            name             | setting
-----------------------------+---------
 enable_wdr_snapshot         | off
 wdr_snapshot_interval       | 60
 wdr_snapshot_query_timeout  | 100
 wdr_snapshot_retention_days | 8
(4 rows)
```

## 开启 wdr 日志

```
omm@107707f966f0:/var/lib/mogdb/data$ gs_guc reload -D $PGDATA -c "enable_wdr_snapshot=on"
expected instance path: [/var/lib/mogdb/data/postgresql.conf]
gs_guc reload: enable_wdr_snapshot=on: [/var/lib/mogdb/data/postgresql.conf]
server signaled

Total instances: 1. Failed instances: 0.
Success to perform gs_guc!

omm@107707f966f0:/var/lib/mogdb/data$ gsql -d postgres -r
gsql ((MogDB 2.1.1 build b5f25b20) compiled at 2022-03-21 14:42:30 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

postgres@omm:local=#select name, setting from pg_settings where name like '%wdr%';
            name             | setting
-----------------------------+---------
 enable_wdr_snapshot         | on
 wdr_snapshot_interval       | 60
 wdr_snapshot_query_timeout  | 100
 wdr_snapshot_retention_days | 8
(4 rows)

```

## 查看快照统计表

```
postgres@omm:local=#show search_path;
  search_path
----------------
 "$user",public
(1 row)

postgres@omm:local=#alter session set search_path=snapshot;
SET
postgres@omm:local=#show search_path;
 search_path
-------------
 snapshot
(1 row)

postgres@omm:local=#\d
                                             List of relations
  Schema  |                   Name                   |   Type   | Owner |             Storage
----------+------------------------------------------+----------+-------+----------------------------------
 snapshot | snap_class_vital_info                    | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_bgwriter_stat                | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_ckpt_status                  | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_config_settings              | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_double_write_status          | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_file_iostat                  | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_file_redo_iostat             | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_instance_time                | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_memory_node_detail           | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_os_runtime                   | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_os_threads                   | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_pagewriter_status            | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_record_reset_time            | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_recovery_status              | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_redo_status                  | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_rel_iostat                   | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_replication_slots            | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_replication_stat             | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_rto_status                   | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_shared_memory_detail         | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_stat_all_indexes             | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_stat_all_tables              | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_stat_bad_block               | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_stat_database                | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_stat_database_conflicts      | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_stat_db_cu                   | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_stat_user_functions          | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_statement_count              | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_statio_all_indexes           | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_statio_all_sequences         | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_statio_all_tables            | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_thread_wait_status           | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_threadpool_status            | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_transactions_prepared_xacts  | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_transactions_running_xacts   | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_wait_events                  | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_global_workload_transaction         | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_seq                                 | sequence | omm   |
 snapshot | snap_statement_responsetime_percentile   | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_file_iostat                 | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_file_redo_iostat            | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_rel_iostat                  | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_stat_all_indexes            | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_stat_all_tables             | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_stat_bad_block              | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_stat_database               | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_stat_database_conflicts     | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_stat_user_functions         | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_statement                   | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_statement_count             | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_statio_all_indexes          | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_statio_all_sequences        | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_statio_all_tables           | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_transactions_prepared_xacts | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_transactions_running_xacts  | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_user_login                  | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_workload_sql_count          | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_workload_sql_elapse_time    | table    | omm   | {orientation=row,compression=no}
 snapshot | snap_summary_workload_transaction        | table    | omm   | {orientation=row,compression=no}
 snapshot | snapshot                                 | table    | omm   | {orientation=row,compression=no}
 snapshot | tables_snap_timestamp                    | table    | omm   | {orientation=row,compression=no}
(61 rows)

```

# 手动生产快照

### SNAPSHOT.SNAPSHOT

SNAPSHOT 表记录当前系统中存储的 WDR 快照数据的索引信息、开始、结束时间。只能在系统库中查询到结果，在用户库中无法查询。

**表 1** SNAPSHOT 表属性

| 名称        | 类型      | 描述                 | 示例                          |
| ----------- | --------- | -------------------- | ----------------------------- |
| snapshot_id | bigint    | WDR 快照序号。       | 1                             |
| start_ts    | timestamp | WDR 快照的开始时间。 | 2019-12-28 17:11:27.423742+08 |
| end_ts      | timestamp | WDR 快照的结束时间。 | 2019-12-28 17:11:43.67726+08  |

```
postgres@omm:local=#select * from snapshot.snapshot;
 snapshot_id |           start_ts            |            end_ts
-------------+-------------------------------+-------------------------------
           1 | 2022-05-02 11:19:37.239977+00 | 2022-05-02 11:19:37.865708+00
(1 row)

postgres@omm:local=#select create_wdr_snapshot();
           create_wdr_snapshot
-----------------------------------------
 WDR snapshot request has been submitted
(1 row)

postgres@omm:local=#select * from snapshot.snapshot;
 snapshot_id |           start_ts            |            end_ts
-------------+-------------------------------+-------------------------------
           1 | 2022-05-02 11:19:37.239977+00 | 2022-05-02 11:19:37.865708+00
           2 | 2022-05-02 11:42:28.047396+00 | 2022-05-02 11:42:28.617173+00
(2 rows)

```

# 生成性能报告

## a. 执行如下命令生成格式化性能报告文件。

```
\a \t \o 服务器文件路径
```

上述命令涉及参数说明如下:

- \a: 切换非对齐模式。
- \t: 切换输出的字段名的信息和行计数脚注。
- \o: 把所有的查询结果发送至服务器文件里。
- 服务器文件路径：生成性能报告文件存放路径。用户需要拥有此路径的读写权限。

## b. 执行如下命令将查询到的信息写入性能报告中。

```
select generate_wdr_report(begin_snap_id bigint, end_snap_id bigint, report_type cstring, report_scope cstring, node_name cstring);
```

命令中涉及的参数说明如下。

**表 3** generate_wdr_report 函数参数说明

| 参数          | 说明                                                                                                                                                                                     | 取值范围                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| begin_snap_id | 查询时间段开始的 snapshot 的 id（表 snapshot.snaoshot 中的 snapshot_id）。                                                                                                               | -                                                                    |
| end_snap_id   | 查询时间段结束 snapshot 的 id。默认 end_snap_id 大于 begin_snap_id（表 snapshot.snaoshot 中的 snapshot_id）。                                                                            | -                                                                    |
| report_type   | 指定生成 report 的类型。例如，summary/detail/all。                                                                                                                                       | summary: 汇总数据。 detail: 明细数据。 all: 包含 summary 和 detail。 |
| report_scope  | 指定生成 report 的范围，可以为 cluster 或者 node。                                                                                                                                       | cluster: 数据库级别的信息。 node: 节点级别的信息。                   |
| node_name     | 在 report_scope 指定为 node 时，需要把该参数指定为对应节点的名称。(节点名称可以执行 select \* from pg_node_env;查询)。在 report_scope 为 cluster 时，该值可以指定为省略、空或者为 NULL。 |                                                                      |

执行操作

```
postgres@omm:local=#select * from pg_node_env;
 node_name |   host    | process | port |   installpath    |      datapath       | log_directory
-----------+-----------+---------+------+------------------+---------------------+---------------
 mogdb     | localhost |       1 | 5432 | /usr/local/mogdb | /var/lib/mogdb/data | pg_log
(1 row)
postgres@omm:local=#
postgres@omm:local=#\a \t \o wdr_20220502.html
postgres@omm:local=#select generate_wdr_report(1,2,'all','node','mogdb');
```

## c.执行如下命令关闭输出选项及格式化输出命令。

```
\o \a \t
查看报告
```
