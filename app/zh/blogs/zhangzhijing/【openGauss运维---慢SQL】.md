---
title: 'openGauss运维---慢SQL'
date: '2023-01-30'
category: 'blog'
tags: ['openGauss运维---慢SQL']
archives: '2023-01'
author: 'zhangzhijing'
summary: '慢SQL问题常见定位方法'
img: '/zh/blogs/zhangzhijing/title/img1.png'
times: '00:40'
---

# openGauss运维---慢SQL



## 1、statement_history视图

获得当前节点的执行语句的信息。查询系统表必须具有sysadmin权限。只可在系统库中查询到结果，用户库中无法查询。

- 必须在postgres库内查询，其它库中不存数据。
- 此系统表受track_stmt_stat_level控制，默认为"OFF,L0"，第一部分控制Full SQL，第二部分控制Slow SQL，具体字段记录级别见下表。
- 对于Slow SQL，当track_stmt_stat_level的值为非OFF时，且SQL执行时间超过log_min_duration_statement，会记录为慢SQL。

| 名称                 | 类型                     |                             描述                             | 记录级别 |
| -------------------- | ------------------------ | :----------------------------------------------------------: | -------- |
| db_name              | name                     |                         数据库名称。                         | L0       |
| schema_name          | name                     |                         schema名称。                         | L0       |
| origin_node          | integer                  |                          节点名称。                          | L0       |
| user_name            | name                     |                           用户名。                           | L0       |
| application_name     | text                     |                用户发起的请求的应用程序名称。                | L0       |
| client_addr          | text                     |                 用户发起的请求的客户端地址。                 | L0       |
| client_port          | integer                  |                 用户发起的请求的客户端端口。                 | L0       |
| unique_query_id      | bigint                   |                        归一化SQL ID。                        | L0       |
| debug_query_id       | bigint                   |                         唯一SQL ID。                         | L0       |
| query                | text                     |                         归一化SQL。                          | L0       |
| start_time           | timestamp with time zone |                       语句启动的时间。                       | L0       |
| finish_time          | timestamp with time zone |                       语句结束的时间。                       | L0       |
| slow_sql_threshold   | bigint                   |                   语句执行时慢SQL的标准。                    | L0       |
| transaction_id       | bigint                   |                           事务ID。                           | L0       |
| thread_id            | bigint                   |                         执行线程ID。                         | L0       |
| session_id           | bigint                   |                       用户session id。                       | L0       |
| n_soft_parse         | bigint                   | 软解析次数，n_soft_parse + n_hard_parse可能大于n_calls，因为子查询未计入n_calls。 | L0       |
| n_hard_parse         | bigint                   | 硬解析次数，n_soft_parse + n_hard_parse可能大于n_calls，因为子查询未计入n_calls。 | L0       |
| query_plan           | text                     |                        语句执行计划。                        | L1       |
| n_returned_rows      | bigint                   |                   SELECT返回的结果集行数。                   | L0       |
| n_tuples_fetched     | bigint                   |                         随机扫描行。                         | L0       |
| n_tuples_returned    | bigint                   |                         顺序扫描行。                         | L0       |
| n_tuples_inserted    | bigint                   |                           插入行。                           | L0       |
| n_tuples_updated     | bigint                   |                           更新行。                           | L0       |
| n_tuples_deleted     | bigint                   |                           删除行。                           | L0       |
| n_blocks_fetched     | bigint                   |                     buffer的块访问次数。                     | L0       |
| n_blocks_hit         | bigint                   |                     buffer的块命中次数。                     | L0       |
| db_time              | bigint                   |        有效的DB时间花费，多线程将累加（单位：微秒）。        | L0       |
| cpu_time             | bigint                   |                   CPU时间（单位：微秒）。                    | L0       |
| execution_time       | bigint                   |               执行器内执行时间（单位：微秒）。               | L0       |
| parse_time           | bigint                   |                 SQL解析时间（单位：微秒）。                  | L0       |
| plan_time            | bigint                   |               SQL生成计划时间（单位：微秒）。                | L0       |
| rewrite_time         | bigint                   |                 SQL重写时间（单位：微秒）。                  | L0       |
| pl_execution_time    | bigint                   |             plpgsql上的执行时间（单位：微秒）。              | L0       |
| pl_compilation_time  | bigint                   |             plpgsql上的编译时间（单位：微秒）。              | L0       |
| data_io_time         | bigint                   |                IO上的时间花费（单位：微秒）。                | L0       |
| net_send_info        | text                     | 通过物理连接发送消息的网络状态，包含时间（微秒）、调用次数、吞吐量（字节）。通过该字段可以分析SQL在分布式系统下的网络开销，单机模式下不支持该字段。例如：{"time":xxx, "n_calls":xxx, "size":xxx}。 | L0       |
| net_recv_info        | text                     | 通过物理连接接收消息的网络状态，包含时间（微秒）、调用次数、吞吐量（字节）。通过该字段可以分析SQL在分布式系统下的网络开销，单机模式下不支持该字段。例如：{"time":xxx, "n_calls":xxx, "size":xxx}。 | L0       |
| net_stream_send_info | text                     | 通过逻辑连接发送消息的网络状态，包含时间（微秒）、调用次数、吞吐量（字节）。通过该字段可以分析SQL在分布式系统下的网络开销，单机模式下不支持该字段。例如：{"time":xxx, "n_calls":xxx, "size":xxx}。 | L0       |
| net_stream_recv_info | text                     | 通过逻辑连接接收消息的网络状态，包含时间（微秒）、调用次数、吞吐量（字节）。通过该字段可以分析SQL在分布式系统下的网络开销，单机模式下不支持该字段。例如：{"time":xxx, "n_calls":xxx, "size":xxx}。 | L0       |
| lock_count           | bigint                   |                          加锁次数。                          | L0       |
| lock_time            | bigint                   |                          加锁耗时。                          | L1       |
| lock_wait_count      | bigint                   |                        加锁等待次数。                        | L0       |
| lock_wait_time       | bigint                   |                        加锁等待耗时。                        | L1       |
| lock_max_count       | bigint                   |                        最大持锁数量。                        | L0       |
| lwlock_count         | bigint                   |                   轻量级加锁次数（预留）。                   | L0       |
| lwlock_wait_count    | bigint                   |                       轻量级等锁次数。                       | L0       |
| lwlock_time          | bigint                   |                   轻量级加锁时间（预留）。                   | L1       |
| lwlock_wait_time     | bigint                   |                       轻量级等锁时间。                       | L1       |
| details              | bytea                    | 语句锁事件的列表，该列表按时间顺序记录事件，记录的数量受参数track_stmt_details_size的影响。该字段为二进制，需要借助解析函数pg_catalog.statement_detail_decode读取。事件包括：加锁开始加锁结束等锁开始等锁结束放锁开始放锁结束轻量级等锁开始轻量级等锁结束 | L2       |
| is_slow_sql          | boolean                  | 该SQL是否为slow SQL。t（true）：表示是。f（false）：表示不是。 | L0       |
| trace_id             | text                     |         驱动传入的trace id，与应用的一次请求相关联。         | L0       |



## 2、statement视图

 获得当前节点的执行语句（归一化SQL）的信息。查询视图必须具有sysadmin权限或者monitor admin权限。数据库主节点上可以看到此数据库主节点接收到的归一化的SQL的全量统计信息（包含数据库节点）；数据库节点上仅可看到归一化的SQL的此节点执行的统计信息。

| **名称**            | **类型**                 | **描述**                                                     |
| ------------------- | ------------------------ | ------------------------------------------------------------ |
| node_name           | name                     | 数据库进程名称。                                             |
| node_id             | integer                  | 节点的ID。                                                   |
| user_name           | name                     | 用户名称。                                                   |
| user_id             | oid                      | 用户OID。                                                    |
| unique_sql_id       | bigint                   | 归一化的SQL ID。                                             |
| query               | text                     | 归一化的SQL。                                                |
| n_calls             | bigint                   | 调用次数。                                                   |
| min_elapse_time     | bigint                   | SQL在内核内的最小运行时间（单位：微秒）。                    |
| max_elapse_time     | bigint                   | SQL在内核内的最大运行时间（单位：微秒）。                    |
| total_elapse_time   | bigint                   | SQL在内核内的总运行时间（单位：微秒）。                      |
| n_returned_rows     | bigint                   | SELECT返回的结果集行数。                                     |
| n_tuples_fetched    | bigint                   | 随机扫描行。                                                 |
| n_tuples_returned   | bigint                   | 顺序扫描行。                                                 |
| n_tuples_inserted   | bigint                   | 插入行。                                                     |
| n_tuples_updated    | bigint                   | 更新行。                                                     |
| n_tuples_deleted    | bigint                   | 删除行。                                                     |
| n_blocks_fetched    | bigint                   | buffer的块访问次数。                                         |
| n_blocks_hit        | bigint                   | buffer的块命中次数。                                         |
| n_soft_parse        | bigint                   | 软解析次数，n_soft_parse + n_hard_parse可能大于n_calls，因为子查询未计入n_calls。 |
| n_hard_parse        | bigint                   | 硬解析次数，n_soft_parse + n_hard_parse可能大于n_calls，因为子查询未计入n_calls。 |
| db_time             | bigint                   | 有效的DB时间花费，多线程将累加（单位：微秒）。               |
| cpu_time            | bigint                   | CPU时间（单位：微秒）。                                      |
| execution_time      | bigint                   | 执行器内执行时间（单位：微秒）。                             |
| parse_time          | bigint                   | SQL解析时间（单位：微秒）。                                  |
| plan_time           | bigint                   | SQL生成计划时间（单位：微秒）。                              |
| rewrite_time        | bigint                   | SQL重写时间（单位：微秒）。                                  |
| pl_execution_time   | bigint                   | plpgsql上的执行时间（单位：微秒）。                          |
| pl_compilation_time | bigint                   | plpgsql上的编译时间（单位：微秒）。                          |
| net_send_time       | bigint                   | 网络上的时间花费（单位：微秒）。                             |
| data_io_time        | bigint                   | IO上的时间花费（单位：微秒）。                               |
| sort_count          | bigint                   | 排序执行的次数。                                             |
| sort_time           | bigint                   | 排序执行的时间（单位：微秒）。                               |
| sort_mem_used       | bigint                   | 排序过程中使用的work memory大小（单位：KB）。                |
| sort_spill_count    | bigint                   | 排序过程中，若发生落盘，写文件的次数。                       |
| sort_spill_size     | bigint                   | 排序过程中，若发生落盘，使用的文件大小（单位：KB）。         |
| hash_count          | bigint                   | hash执行的次数。                                             |
| hash_time           | bigint                   | hash执行的时间（单位：微秒）。                               |
| hash_mem_used       | bigint                   | hash过程中使用的work memory大小（单位：KB）。                |
| hash_spill_count    | bigint                   | hash过程中，若发生落盘，写文件的次数。                       |
| hash_spill_size     | bigint                   | hash过程中，若发生落盘，使用的文件大小（单位：KB）。         |
| last_updated        | timestamp with time zone | 最后一次更新该语句的时间。                                   |

## 3、推荐参数配置

参数设置：

| 参数配置                                          | 参数介绍                                                     |
| ------------------------------------------------- | ------------------------------------------------------------ |
| enable_stmt_track=on                              | 控制是否启用Full /Slow SQL特性                               |
| track_stmt_stat_level=’L0,L0’                     | 基础设置L0,L0即可，L1可记录执行计划                          |
| track_stmt_session_slot=1000                      | 设置一个session缓存的最大的全量/慢SQL的数量，超过这个数量，新的语句执行将不会被跟踪，直到落盘线程将缓存语句落盘，留出空闲的空间。 |
| track_stmt_details_size=4096                      | 设置单语句可以收集的最大的执行事件的大小                     |
| track_stmt_retention_time=’ 3600,604800’          | 慢SQL和full SQL的保留时长(s)                                 |
| log_min_duration_statement =   3s  需要设置的较小 | 设置记录SQL执行时长的阈值，设置为0时，记录所有执行过的SQL    |
| track_activity_query_size = 1024                  | query字段长度                                                |

## 4、查询方式

周期性查询statement视图，并记录归一化SQL的波动情况，并绘制增长曲线。

```sql
select * from dbe_perf.statement;
```

在出现慢SQL问题后，记录问未清理之前，查看statement_history视图。

```sql
--主
select query,db_time,pg_catalog.statement_detail_decode(details,'plaintext',true) 
from dbe_perf.statement_history
where start_time >= '2000-01-01 00:00:00'
and finish_time <= '2000-01-01 00:00:00';
--备
select query,db_time,pg_catalog.statement_detail_decode(details,'plaintext',true)
from dbe_perf.statement_history(true,'2000-01-01 00:00:00','2000-01-01 00:00:00');
```

## 5、运维分析思路

第一步：排查异常时刻应用（特殊业务）、数据库（备机）、操作系统（定时任务）是否有特殊业务。

第二步：根据业务受到影响的时刻，查看statement和statement_history视图排查业务影响是否因为数据库慢SQL导致。分别查看异常时刻和异常前相同业务量时间段的。

```sql
--按区间输出
select
    sum(case when db_time < 20*1000 then 1 else 0 end)  as "(0,20)",
    sum(case when db_time >= 20*1000 and db_time < 40*1000 then 1 else 0 end)  as "[20,40)",
    sum(case when db_time >= 40*1000 and db_time < 60*1000 then 1 else 0 end)  as "[40,60)",
    sum(case when db_time >= 60*1000 and db_time < 80*1000 then 1 else 0 end)  as "[60,80)",
    sum(case when db_time >= 80*1000 and db_time < 100*1000 then 1 else 0 end)  as "[80,100)",
	sum(case when db_time >= 100*1000 and db_time < 120*1000 then 1 else 0 end)  as "[100,120)",
    sum(case when db_time >= 120*1000 then 1 else 0 end)  as "[120,+∞)"
from statement_history
where 1=1
and start_time >= '2022-01-19 00:00:00'
and finish_time <= '2022-01-19 00:10:00'
;
--输出
 (0,20) | [20,40) | [40,60) | [60,80) | [80,100) | [100,120) | [120,+∞)
--------+---------+---------+---------+----------+-----------+----------
        |         |         |         |          |           |
```

第三步：

在异常时刻发下明显的慢SQL，则对慢SQL等待事件和执行计划展开分析。

| 常见等待事件    | 等待事件描述                                                 |
| --------------- | ------------------------------------------------------------ |
| wait_wal_sync   | 等待特定的LSN的wal log到完成到备机的同步；该等待事件较多时，可能因为主/备的io上出现异常，或主备之间的网络出现异常 |
| proc_array_lock | 当有大量的建连请求时产生该锁。                               |

第四步：

系统排查：message日志，资源（CPU、网络、IO）

推荐使用OSW工具：https://blog.csdn.net/lichangzai/article/details/8362727

| 监控项  | 采集方式                                                    |
| ------- | ----------------------------------------------------------- |
| message | /var/log/message                                            |
| CPU     | top                                                         |
| 网络    | 主节点：ping 备节点；主节点：ping 应用；备节点：ping 应用。 |
| IO      | iostat -xm 1                                                |

常见结论：

| 慢SQL类型 | 可能的排查点及排查思路                                       |
| --------- | ------------------------------------------------------------ |
| 偶发一次  | 可能由于操作系统或物理资源上的波动引起，通过数据库慢SQL记录和系统资源监控信息获取 |
| 频繁出现  | 可能由于特殊业务、数据库内核动作，物理连接持续重建导致执行计划重新生成导致；通过排查业务，数据库进程，连接池信息。 |

