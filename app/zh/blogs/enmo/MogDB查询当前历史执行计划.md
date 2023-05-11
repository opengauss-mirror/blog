---
title: 'MogDB查询当前/历史执行计划'

date: '2023-04-19'
category: 'blog'
tags: ['MogDB']

archives: '2023-04'

author: '云和恩墨东区交付团队'

summary: 'MogDB查询当前/历史执行计划'

img: '/zh/post/enmo/title/img6.png'

times: '10:20'
---

# 1. 概述

SQL 执行计划是一个节点树，显示 MogDB 执行一条 SQL 语句时执行的详细步骤。每一个步骤为一个数据库运算符。执行计划对于我们进行 SQL 调优可以说是必不可少的关键信息。以下是总结的关于如何查看 MogDB 数据库当前、历史执行 SQL 的执行计划以及定位执行缓慢算子的方法。首先介绍 MogDB 与 SQL 密切相关的两个特性：ASP 和全量 SQL&慢查询。

# 2. ASP

## 2.1 特性简介

ASP(Active Session Profile) 活跃会话概要信息，通过采样实例活跃会话的状态信息，低成本复现过去一段时间的系统活动，主要包含会话基本信息、会话事务、语句、等待事件、会话状态(active、idle 等)，当前正阻塞在哪个事件上，正在等待哪个锁，或被哪个会话阻塞。可以获取以下信息：

1. 最近用户 session 最耗资源的的事件
2. 最近比较占资源的 session/SQL 把资源都消耗在哪些 event 上
3. 最近执行时间/执行次数最多的是哪些 SQL（进而可以找出表，数据库）
4. 最近最耗资源的用户的信息
5. 最近阻塞其他 session 最多的 session

## 2.2 工作机制

### 2.2.1 step1：周期采集信息

MogDB 启动后会启动一个后台 worker 采样线程，为避免浪费资源，该采样线程不会时刻采样，而是每隔一个采样周期对 MogDB 进行采样，收集 MogDB 当时的运行快照保存到内存中，查询视图 dbe_perf.local_active_session 可以查询到实时的采样信息，该采样周期由 guc 参数 asp_sample_interval 控制，默认采样周期为 1s。只有语句执行时间大于采样时间(1s)，才会被采样线程收集到运行信息。

### 2.2.2 step2：信息持久化

MogDB 每在内存中采样 100000 行（由 guc 参数 asp_sample_num 控制）会将内存中的采样数据刷新到 GS_ASP 表中以供历史查询。

## 2.3 相关视图

### 2.3.1 dbe_perf.local_active_session

[LOCAL_ACTIVE_SESSION](https://docs.mogdb.io/zh/mogdb/v3.1/LOCAL_ACTIVE_SESSION)视图显示本节点上的 ACTIVE SESSION PROFILE 内存中的样本。

### 2.3.2 pg_catalog.gs_asp

[GS_ASP](https://docs.mogdb.io/zh/mogdb/v3.1/GS_ASP)显示被持久化的 ACTIVE SESSION PROFILE 样本，该表只在系统库(postgres)下查询，在用户库下查询无数据。

## 2.4 相关重要参数

### 2.4.1 enable_asp

> 参数说明：是否开启活跃会话信息 active session profile。重新加载参数后，立即生效。

可选项：

- enable_asp=on --开启
- enable_asp=off --关闭

### 2.4.2 asp_sample_interval

> 参数说明：信息采样的间隔。重新加载参数后，立即生效。

- asp_sample_interval=1s --默认 1s

### 2.4.3 asp_sample_num

> 参数说明：LOCAL_ACTIVE_SESSION 视图最大的样本个（行）数，超过该数值，数据会刷新到 GS_ASP 表。数据库重启后生效。

- asp_sample_interval=100000 --默认 100000

# 3. Full SQL TRACE & Slow SQL

## 3.1 特性简介

- MogDB 会记录全量 SQL 信息，分为 L0、L1、L2 三个等级，可以获取以下信息：

  1. 可以获取实例信息、客户端信息、语句概要信息、执行信息、行活动信息、Cache/IO、时间模型、网络统计信息、锁概要信息、锁详细信息等。
  2. 通过全量 SQL，可以得到整个系统所有语句的执行流水以及他们的详细性能数据（持久化的）。
  3. 除 Statement 视图提供的能力外，还额外提供了详细加放锁信息，可以诊断到单语句级别的性能波动。

- 达到慢查询阈值([log_min_duration_statement](https://docs.mogdb.io/zh/mogdb/v3.1/2-logging-time#log_min_duration_statement))设置的语句性能信息，性能要素和全量 SQL 一致。

## 3.2 相关视图

### 3.2.1 dbe_perf.statement

获得当前节点的执行语句（归一化 SQL）的信息。查询视图必须具有 sysadmin 权限或者 monitor admin 权限。主要目的是保留数据库启动后，运行的 SQL 的状态记录。

> 需要打开 enable_resource_track 参数：允许运行时候的资源使用追踪。

### 3.2.2 dbe_perf.statement_complex_runtime

视图显示当前用户在数据库主节点上正在执行的作业的负载管理记录。

> 我们可以利用此试图来查看当前执行 SQL 的执行计划、语句执行状态等详细信息来排查 SQL 性能问题。

### 3.2.3 dbe_perf.statement_history

获得当前节点的执行语句的信息。查询视图必须具有 sysadmin 权限或者 monitor admin 权限。只可在系统库中查询到结果，用户库中无法查询。主要目的是记录数据库运行中产生的 SQL 与其运行信息，保证即便数据库重启，SQL 信息也依然可以查询到。

> 我们可以利用此视图来查询历史 SQL 的的详细运行信息。此视图受 log_duration、log_min_duration_statement、track_stmt_stat_level 等参数控制。并且需要判断：

以下各个条件为或判定，满足其一即可：

- 打开了动态语句追踪功能：采用 dynamic_func_control 追踪 STMT。
- track_stmt_stat_level 追踪第一个 level 为 L0 或者更高。
- track_stmt_stat_level 追踪第二个 level 为 L0 或者更高，且语句运行时间大于 log_min_duration_statement 设定值，且 log_min_duration_statement 大于等于 0，并且没有打开 track_stmt_parameter。
- 打开 track_stmt_parameter，并且时间模式第一个值（消耗的 DBTIME）大于 0。

## 3.3 相关重要参数

### 3.3.1 enable_resource_track

> 参数说明：是否开启资源实时监控功能。重新加载参数后，立即生效。

可选项：

- 1. enable_resource_track=on --开启
- 2. enable_resource_track=off --关闭

### 3.3.2 track_stmt_stat_level

> 参数说明：控制语句执行跟踪的级别。该参数分为两部分，形式为’full sql stat level, slow sql stat level’；
> full sql stat level 为全量 SQL 跟踪级别，取值范围为 OFF、L0、L1、L2
> slow sql stat level 为慢 SQL 的跟踪级别，取值范围为 OFF、L0、L1、L2
> 若全量 SQL 跟踪级别值为非 OFF 时，当前 SQL 跟踪级别值为全量 SQL 和慢 SQL 的较高级别（L2 > L1 > L0）
> L1 在 L0 的基础上记录了执行计划，L2 在 L1 的基础上记录了锁的详细信息，详情见[statement_history](https://docs.mogdb.io/zh/mogdb/v3.1/STATEMENT_HISTORY)中的 details

- track_stmt_stat_level=OFF,L0 --默认配置，表示关闭全量 SQL 跟踪，开启 L0 级别的慢 SQL 跟踪
- track_stmt_stat_level=L2,L0 --表示此时 SQL 跟踪级别都为 L2

### 3.3.3 resource_track_cost

> 参数说明：设置对当前会话的语句进行资源监控的最小执行代价。该参数只有当参数 enable_resource_track 为 on 时才有效。

可选项：

- resource_track_cost=-1 --不进行资源监控。
- resource_track_cost=0 --【0-9】对执行代价大于等于 10 的语句进行资源监控。
- resource_track_cost=10 --【>10】,对执行代价超过该参数值的语句进行资源监控。

### 3.3.4 log_min_duration_statement

> 参数说明：当某条语句的持续时间大于或者等于特定的毫秒数时，log_min_duration_statement 参数用于控制记录每条完成语句的持续时间。
> 设置 log_min_duration_statement 可以很方便地跟踪需要优化的查询语句。对于使用扩展查询协议的客户端，语法分析、绑定、执行每一步所花时间被独立记录。

可选项：

- log_min_duration_statement=1000ms --所有运行时间不短于 1000ms 的 SQL 语句都会被记录。
- log_min_duration_statement=0 --所有语句都会被记录
- log_min_duration_statement=-1 --关闭此功能

### 3.3.5 log_duration

> 参数说明：控制记录每个已完成 SQL 语句的执行时间。对使用扩展查询协议的客户端、会记录语法分析、绑定和执行每一步所花费的时间。
> 当此参数为 on，且 log_min_duration_statement 大于零，记录所有持续时间，但是仅记录超过阈值的语句。这可用于在高负载情况下搜集统计信息。

可选项：

- log_duration=on --默认，开启
- log_duration=off --关闭

# 4. 确认参数

根据以上特性相关参数，为了测试直观，修改以下参数至合适值：

```
enable_asp = on
--开启ASP采样
enable_resource_track = on
--开启资源实时监控
log_duration = on
--开启【记录SQL执行时间】功能
log_min_duration_statement = 1000
--1000ms，即1s，执行时长超过该参数，会记录为慢SQL
track_stmt_stat_level = 'L2,L0'
--资源追踪级别为L2
resource_track_cost = 10
--当前会话的语句执行cost需要大于该参数值，才会被记录到相关视图
#其他相关参数可保持默认
```

# 5. 测试

## 5.1 查看当前执行计划

对于查看当前执行计划，我们可以选择使用[“explain sql\]”语句的方式来获取其执行计划。但对于哪些耗时长的慢 SQL，执行很长时间都不能通过 explain analyze 分析的语句，而且只有在执行完成后才能看到相关执行计划。这个时候我们可以利用前面介绍的两大特性来帮助我们检测 SQL 执行过程中的详细情况，并根据相关结果进行下一步调优。

### 5.1.1 官方示例

> 详细信息可参考官方文档：[SQL 运行状态观测](https://docs.mogdb.io/zh/mogdb/v3.0/22-sql-running-status-observation#特性简介)。

- session 1 创建测试表并插入数据

```
MogDB=# create table test1(id int);
CREATE TABLE
MogDB=# insert into test1 select generate_series(1, 10000000);
```

- session 2 通过 pg_stat_activity 查询到 query_id

> 通过活跃会话视图查询到正在执行 SQL 的 query_id（执行完毕的 SQL 是不会记录在该视图）

```
MogDB=# select query,query_id from pg_stat_activity where query like 'insert into test1 select%';

                         query                          |     query_id
--------------------------------------------------------+------------------
 insert into test1 select generate_series(1, 10000000); | 3940649673950800
(1 row)
```

- session 2 查看当前 SQL 执行计划

> 根据该 query_id 从活跃作业管理视图中查询出该语句的带 plan_node_id（执行计划树的算子 id）的执行计划（该语句执行 cost 需要大于 guc 值 resource_track_cost 才会被记录到该视图中，该 guc 参数默认值为 100000，session 级别可更新，所以为了方便测试，可在测试中将该值改成 10）

```
MogDB=# select query_plan from dbe_perf.statement_complex_runtime where queryid =3940649673950800 ;

                        query_plan
-----------------------------------------------------------
 Coordinator Name: dn_6001                                +
 1 | Insert on test1  (cost=0.00..15.01 rows=1000 width=4)+
 2 |  ->  Result  (cost=0.00..5.01 rows=1000 width=0)     +
                                                        +
```

- session 2 查询算子采样详情

> 根据 query_id 从采样视图 dbe_perf.local_active_session 中查询出该语句的采样情况，结合上面查询的执行计划做性能分析。

```
MogDB=# select plan_node_id, count(plan_node_id) from dbe_perf.local_active_session where query_id =3940649673950800 group by plan_node_id;
 plan_node_id | count
--------------+-------
            1 |    39
            2 |     1
```

- 有可能上一步查询没有结果，很有可能内存数据到达了上限值（由 guc 参数 asp_sample_num 控制），此时需要查询 gs_asp 表。

```
select plan_node_id, count(plan_node_id) from dbe_perf.local_active_session where query_id =3940649673950800 group by plan_node_id;
```

- 结论
  当发现 insert into test select generate_series(1, 10000000)存在性能瓶颈，通过以上的步骤定位发现，insert 操作在整个 SQL 语句执行过程中被采样的数值最高（ plan_node_id =1 ，count=39），可以对其进行优化。

### 5.1.2 实际应用

> 多表关联，对多表中的相同数据进行计数

- session 1 统计 test1 和 test2 中相同数据的个数

```
MogDB=# select count(*)
MogDB-# from test1 t1,test2 t2
MogDB-# where t1.id = t2.id;
```

- session 2 查询执行计划及算子采样详情

```
MogDB=# select query,query_id,unique_sql_id from pg_stat_activity where query like 'select count(*)%';
         query          |     query_id     | unique_sql_id
------------------------+------------------+---------------
 select count(*)       +| 3940649673951393 |    4071767743
 from test1 t1,test2 t2+|                  |
 where t1.id = t2.id;   |                  |

MogDB=# select query_plan,query,duration from dbe_perf.statement_complex_runtime where queryid = 3940649673951393;
                                  query_plan                                   |         query          | duration
-------------------------------------------------------------------------------+------------------------+----------
 Coordinator Name: dn_6001                                                    +| select count(*)       +|    65740
 1 | Aggregate  (cost=955172.77..955172.78 rows=1 width=8)                    +| from test1 t1,test2 t2+|
 2 |  ->  Hash Join  (cost=357141.08..928597.94 rows=10629931 width=0)        +| where t1.id = t2.id;   |
   |   Hash Cond: (t2.id = t1.id)                                             +|                        |
 3 |   ->  Seq Scan on test2 t2  (cost=0.00..150547.31 rows=10629931 width=4) +|                        |
 4 |   ->  Hash  (cost=144248.48..144248.48 rows=10000048 width=4)            +|                        |
 5 |    ->  Seq Scan on test1 t1  (cost=0.00..144248.48 rows=10000048 width=4)+|                        |
                                                                              +|                        |
                                                                               |                        |

MogDB=# select plan_node_id, count(plan_node_id) from dbe_perf.local_active_session where query_id =3940649673951393 group by plan_node_id;
 plan_node_id | count
--------------+-------
            5 |    44
            3 |    55
            2 |     6
```

- 结论：
  当发现该多表关联语句执行缓慢、存在性能瓶颈时，按照以上步骤获取执行计划和算子采样信息，可以发现改 SQL 主要消耗在了对两张表的全表扫，这时建议对 test1 和 test2 创建相关索引。

> 对两个表的 id 字段都创建索引：
> create index test_index1 on test1(id);
> create index test_index2 on test2(id);
> 对比一下创建索引与创建索引之前的 SQL 执行用时，还是有很大的差距。

```
MogDB=# select query_plan,query,is_slow_sql,start_time,finish_time
from dbe_perf.statement_history sh
where sh.query like 'select count(*)%' ;

-[ RECORD 1 ]------------------------------------------------------------------------------------------------------------------------------------------------------------
query_plan  | Datanode Name: dn_6001
            | Aggregate  (cost=783458.91..783458.92 rows=1 width=8) (actual time=12565.353..12565.354 rows=1 loops=1)
            |   ->  Merge Join  (cost=11.79..758458.91 rows=10000000 width=0) (actual time=0.259..11674.363 rows=10000000 loops=1)
            |         Merge Cond: (t1.id = t2.id)
            |         ->  Index Only Scan using test_index1 on test1 t1  (cost=0.00..304239.25 rows=10000000 width=4) (actual time=0.116..3775.731 rows=10000000 loops=1)
            |         ->  Index Only Scan using test_index2 on test2 t2  (cost=0.00..304239.25 rows=10000000 width=4) (actual time=0.082..4418.354 rows=10000000 loops=1)
            |
            |
query       | select count(*)
            | from test1 t1,test2 t2
            | where t1.id = t2.id;
is_slow_sql | t
start_time  | 2022-09-10 20:03:39.300469+08
finish_time | 2022-09-10 20:03:51.893721+08
-[ RECORD 2 ]------------------------------------------------------------------------------------------------------------------------------------------------------------
query_plan  | Datanode Name: dn_6001
            | Aggregate  (cost=955172.77..955172.78 rows=1 width=8) (actual time=109007.337..109007.338 rows=1 loops=1)
            |   ->  Hash Join  (cost=357141.08..928597.94 rows=10629931 width=0) (actual time=45339.277..108223.237 rows=10000000 loops=1)
            |         Hash Cond: (t2.id = t1.id)
            |         ->  Seq Scan on test2 t2  (cost=0.00..150547.31 rows=10629931 width=4) (actual time=0.128..54984.720 rows=10000000 loops=1)
            |         ->  Hash  (cost=144248.48..144248.48 rows=10000048 width=4) (actual time=45278.900..45278.900 rows=10000000 loops=1)
            |                Buckets: 2097152  Batches: 16  Memory Usage: 21976kB
            |               ->  Seq Scan on test1 t1  (cost=0.00..144248.48 rows=10000048 width=4) (actual time=1.324..43240.923 rows=10000000 loops=1)
            |
            |
query       | select count(*)
            | from test1 t1,test2 t2
            | where t1.id = t2.id;
is_slow_sql | t
start_time  | 2022-09-10 18:24:45.876048+08
finish_time | 2022-09-10 18:26:34.899024+08
```

## 5.2 查看历史 SQL 执行计划

对于执行中的 SQL 我们可以利用 statement_complex_runtime 视图获取当前语句的执行计划，以便我们进行分析。但是这个视图只是针对正在执行的作业的负载管理记录。而对于执行完成后的 SQL，我们想获取执行计划，进行分析就需要借助 dbe_perf.statement_history 这个视图。

### 5.2.1 实际应用

接 5.1.2 小节，当 select 执行完成后

```
MogDB=# select count(*)
MogDB-# from test1 t1,test2 t2
MogDB-# where t1.id = t2.id;
-[ RECORD 1 ]---
count | 10000000
```

- 根据 unique_sql_id/query_id 获取执行计划

> 5.1.2 小结中我们查询了当时正在执行 SQL 的 unique_sql_id，它对应 statement_history 中的 unique_query_id。query_id 对应此视图的 debug_query_id

```
MogDB=# \x
Expanded display is on.
MogDB=# select query_plan,sh.*
MogDB-# from dbe_perf.statement_history sh
MogDB-# where sh.unique_query_id='4071767743';
-[ RECORD 1 ]--------+--------------------------------------------------------------------------------------------
query_plan           | Datanode Name: dn_6001
                     | Aggregate  (cost=955172.77..955172.78 rows=1 width=8) (actual time=109007.337..109007.338 rows=1 loops=1)
                     |   ->  Hash Join  (cost=357141.08..928597.94 rows=10629931 width=0) (actual time=45339.277..108223.237 rows=10000000 loops=1)
                     |         Hash Cond: (t2.id = t1.id)
                     |         ->  Seq Scan on test2 t2  (cost=0.00..150547.31 rows=10629931 width=4) (actual time=0.128..54984.720 rows=10000000 loops=1)
                     |         ->  Hash  (cost=144248.48..144248.48 rows=10000048 width=4) (actual time=45278.900..45278.900 rows=10000000 loops=1)
                     |                Buckets: 2097152  Batches: 16  Memory Usage: 21976kB
                     |               ->  Seq Scan on test1 t1  (cost=0.00..144248.48 rows=10000048 width=4) (actual time=1.324..43240.923 rows=10000000 loops=1)
                     |
                     |
db_name              | postgres
schema_name          | "$user",public
origin_node          | 0
user_name            | omm
application_name     | gsql
client_addr          |
client_port          | -1
unique_query_id      | 4071767743
debug_query_id       | 3940649673951393
query                | select count(*)
                     | from test1 t1,test2 t2
                     | where t1.id = t2.id;
start_time           | 2022-09-10 18:24:45.876048+08
finish_time          | 2022-09-10 18:26:34.899024+08
slow_sql_threshold   | 1000000
transaction_id       | 0
thread_id            | 70371368087664
session_id           | 70371368087664
n_soft_parse         | 0
n_hard_parse         | 1
query_plan           | Datanode Name: dn_6001
                     | Aggregate  (cost=955172.77..955172.78 rows=1 width=8) (actual time=109007.337..109007.338 rows=1 loops=1)
                     |   ->  Hash Join  (cost=357141.08..928597.94 rows=10629931 width=0) (actual time=45339.277..108223.237 rows=10000000 loops=1)
                     |         Hash Cond: (t2.id = t1.id)
                     |         ->  Seq Scan on test2 t2  (cost=0.00..150547.31 rows=10629931 width=4) (actual time=0.128..54984.720 rows=10000000 loops=1)
                     |         ->  Hash  (cost=144248.48..144248.48 rows=10000048 width=4) (actual time=45278.900..45278.900 rows=10000000 loops=1)
                     |                Buckets: 2097152  Batches: 16  Memory Usage: 21976kB
                     |               ->  Seq Scan on test1 t1  (cost=0.00..144248.48 rows=10000048 width=4) (actual time=1.324..43240.923 rows=10000000 loops=1)
                     |
                     |
n_returned_rows      | 1
n_tuples_fetched     | 12
n_tuples_returned    | 20000006
n_tuples_inserted    | 0
n_tuples_updated     | 0
n_tuples_deleted     | 0
n_blocks_fetched     | 88524
n_blocks_hit         | 26
db_time              | 109023716
cpu_time             | 87062876
execution_time       | 109008897
parse_time           | 537
plan_time            | 3121
rewrite_time         | 34
pl_execution_time    | 0
pl_compilation_time  | 0
data_io_time         | 2073831
net_send_info        | {"time":42193, "n_calls":932, "size":74606}
net_recv_info        | {"time":262575283, "n_calls":1, "size":65}
net_stream_send_info | {"time":0, "n_calls":0, "size":0}
net_stream_recv_info | {"time":0, "n_calls":0, "size":0}
lock_count           | 42
lock_time            | 204
lock_wait_count      | 0
lock_wait_time       | 0
lock_max_count       | 6
lwlock_count         | 0
lwlock_wait_count    | 0
lwlock_time          | 0
lwlock_wait_time     | 0
details              | \x120c0000010001a91419d74e8b020000000000ec0400000000000000000000000000010100000002201519d74e8b0200056c1619d74e8b020000000000ec04000000000000000000000.........
is_slow_sql          | t
trace_id             |
```

- 根据其他字段信息获取执行计划

> 如果不清楚有关该 SQL 的 query_id 等信息，也可以利用其他知晓的字段信息，如 SQL 语句（query）、开始执行时间（start_time）等信息进行查询。下方为示例

```
MogDB=# select query_plan
MogDB-# from dbe_perf.statement_history sh
MogDB-# where sh.query like 'select count(*)%' and start_time='2022-09-10 18:24:45.876048+08';
-[ RECORD 1 ]-----------------------------------------------------------------------------------------------------------------------------------------
query_plan | Datanode Name: dn_6001
           | Aggregate  (cost=955172.77..955172.78 rows=1 width=8) (actual time=109007.337..109007.338 rows=1 loops=1)
           |   ->  Hash Join  (cost=357141.08..928597.94 rows=10629931 width=0) (actual time=45339.277..108223.237 rows=10000000 loops=1)
           |         Hash Cond: (t2.id = t1.id)
           |         ->  Seq Scan on test2 t2  (cost=0.00..150547.31 rows=10629931 width=4) (actual time=0.128..54984.720 rows=10000000 loops=1)
           |         ->  Hash  (cost=144248.48..144248.48 rows=10000048 width=4) (actual time=45278.900..45278.900 rows=10000000 loops=1)
           |                Buckets: 2097152  Batches: 16  Memory Usage: 21976kB
           |               ->  Seq Scan on test1 t1  (cost=0.00..144248.48 rows=10000048 width=4) (actual time=1.324..43240.923 rows=10000000 loops=1)
           |
           |
```

### 5.2.2 [慢 SQL 诊断](https://docs.mogdb.io/zh/mogdb/v3.1/slow-sql-diagnosis#前提条件)

在 SQL 语句执行性能不符合预期时，可以查看 SQL 语句执行信息，便于事后分析 SQL 语句执行时的行为，从而诊断 SQL 语句执行出现的相关问题。
示例：

```
MogDB=# select * from dbe_perf.get_global_full_sql_by_timestamp('2022-09-10 18:24:45','2022-09-10 18:26:45') ;
-[ RECORD 1 ]--------+--------------------------------------------------------------------------------------------
node_name            | dn_6001
db_name              | postgres
schema_name          | "$user",public
origin_node          | 0
user_name            | omm
application_name     | gsql
client_addr          |
client_port          | -1
unique_query_id      | 4071767743
debug_query_id       | 3940649673951393
query                | select count(*)
                     | from test1 t1,test2 t2
                     | where t1.id = t2.id;
start_time           | 2022-09-10 18:24:45.876048+08
finish_time          | 2022-09-10 18:26:34.899024+08
slow_sql_threshold   | 1000000
transaction_id       | 0
thread_id            | 70371368087664
session_id           | 70371368087664
n_soft_parse         | 0
n_hard_parse         | 1
query_plan           | Datanode Name: dn_6001
                     | Aggregate  (cost=955172.77..955172.78 rows=1 width=8) (actual time=109007.337..109007.338 rows=1 loops=1)
                     |   ->  Hash Join  (cost=357141.08..928597.94 rows=10629931 width=0) (actual time=45339.277..108223.237 rows=10000000 loops=1)
                     |         Hash Cond: (t2.id = t1.id)
                     |         ->  Seq Scan on test2 t2  (cost=0.00..150547.31 rows=10629931 width=4) (actual time=0.128..54984.720 rows=10000000 loops=1)
                     |         ->  Hash  (cost=144248.48..144248.48 rows=10000048 width=4) (actual time=45278.900..45278.900 rows=10000000 loops=1)
                     |                Buckets: 2097152  Batches: 16  Memory Usage: 21976kB
                     |               ->  Seq Scan on test1 t1  (cost=0.00..144248.48 rows=10000048 width=4) (actual time=1.324..43240.923 rows=10000000 loops=1)
                     |
                     |
n_returned_rows      | 1
n_tuples_fetched     | 12
n_tuples_returned    | 20000006
n_tuples_inserted    | 0
n_tuples_updated     | 0
n_tuples_deleted     | 0
n_blocks_fetched     | 88524
n_blocks_hit         | 26
db_time              | 109023716
cpu_time             | 87062876
execution_time       | 109008897
parse_time           | 537
plan_time            | 3121
rewrite_time         | 34
pl_execution_time    | 0
pl_compilation_time  | 0
data_io_time         | 2073831
net_send_info        | {"time":42193, "n_calls":932, "size":74606}
net_recv_info        | {"time":262575283, "n_calls":1, "size":65}
net_stream_send_info | {"time":0, "n_calls":0, "size":0}
net_stream_recv_info | {"time":0, "n_calls":0, "size":0}
lock_count           | 42
lock_time            | 204
lock_wait_count      | 0
lock_wait_time       | 0
lock_max_count       | 6
lwlock_count         | 0
lwlock_wait_count    | 0
lwlock_time          | 0
lwlock_wait_time     | 0
details              | \x120c0000010001a91419d74e8b020000000000ec0400000000000000000000000000010100000002201519d74e8b0200056c1619d74e8b020000000000ec04000000000000000000000.......
is_slow_sql          | t
trace_id             |
```

# 6. 总结

综上，我们可以灵活地使用多个视图去查看 SQL 的执行计划以及其他相关信息，以下总结了本文使用的查询语句：

## 6.1 查询当前正在执行 SQL 的执行计划

- 定位 SQL 以及对应的 query_id

```
select query,query_id,unique_sql_id
from pg_stat_activity
where query like 'select count(*)%';
```

- 获取目标 SQL 的执行计划

```
select query_plan,query
from dbe_perf.statement_complex_runtime
where query_id = $query_id;
```

## 6.2 查询历史 SQL 执行计划

- 通过 query_id,unique_query_id 获取执行计划

> pg_stat_activity 中的 query_id 对应 statement_history 的 debug_query_id;
> pg_stat_activity 中的 unique_sql_id 对应 statement_history 的 unique_query_id;

```
select query_plan,sh.*
from dbe_perf.statement_history sh
where sh.unique_query_id=$unique_sql_id;
```

- 通过其他已知条件获取执行计划

```
select query,query_plan
from dbe_perf.statement_history sh
where sh.query like 'xxxxx' and sh.start_time='xxxx';
```

## 6.3 分析算子采样信息

- 通过 local_active_session/gs_asp 视图来获取算子采样信息

```
select plan_node_id, count(plan_node_id)
from dbe_perf.local_active_session
where query_id =$query_ID
group by plan_node_id;
```

> 计数越大的 plan_node_id，对应的算子执行时间越长。

## 6.4 通过其他函数获取 SQL 信息

- 可以通过 get_global_full_sql_by_timestamp()类函数来获取某一时间段内所有 SQL 的信息，包括执行计划

```
select * from dbe_perf.get_global_full_sql_by_timestamp('2022-09-10 18:24:45','2022-09-10 18:26:45') ;
```
