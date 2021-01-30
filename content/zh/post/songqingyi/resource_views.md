+++
title = "openGauss资源监控视图简介"
date = "2021-01-29"
tags = ["openGauss资源监控"]
archives = "2021-01"
author = "songqingyi"
summary = "openGauss资源监控视图"
img = "/zh/post/songqingyi/images/img31.png"
times = "23:30"
+++

## openGauss 资源监控相关视图介绍

### DBE_PERF schema

DBE_PERF Schema内视图主要用来诊断性能问题，也是WDR Snapshot的数据来源。数据库安装后，默认只有初始用户和监控管理员具有模式dbe_perf的权限。若是由旧版本升级而来，为保持权限的前向兼容，模式dbe_perf的权限与旧版本保持一致。


### 1.实时 TOP SQL 

openGauss提供了query级别和算子级别的资源监控实时视图用来查询实时TopSQL。资源监控实时视图记录了查询作业运行时的资源使用情况(包括内存、下盘、CPU时间、IO等)以及性能告警信息。

| 视图级别     | 查询视图                           |
| ------------ | ---------------------------------- |
| Query级别    | DBE_PERF.STATEMENT_COMPLEX_RUNTIME |
| Operator级别 | DBE_PERF.OPERATOR_RUNTIME          |

```sql
1.1 查看当前用户在数据库主节点上正在执行的作业的负载管理记录：
postgres=# select * from dbe_perf.STATEMENT_COMPLEX_RUNTIME;
1.2 查看当前用户正在执行的作业的算子相关信息：
postgres=# select * from dbe_perf.OPERATOR_RUNTIME;
```


### 2.历史TOP SQL

openGauss提供了query级别和算子级别的资源监控历史视图用例查询历史TopSQL。资源监控历史视图记录了查询作业运行结束时的资源使用情况(包括内存、下盘、CPU时间、IO等)和运行状态信息(包括报错、终止、异常等)以及性能告警信息。但对于由于FATAL、PANIC错误导致查询异常结束时，状态信息列只显示aborted，无法记录详细异常信息。默认三分钟gs_wlm_session_history的数据会转储到gs_wlm_session_info中。

**使用workload manager相关视图监控功能，需开启use_workload_manager、enable_resource_track参数。并同时根据需求设置如下其他阈值控制参数：**

| GUC参数                 | 功能                                                         | 默认值 |
| ----------------------- | ------------------------------------------------------------ | ------ |
| use_workload_manager    | 是否开启资源管理功能。                                       | on     |
| enable_resource_track   | 是否开启资源实时监控功能，on表示打开资源监控；off表示关闭资源监控。 | on     |
| resource_track_level    | 设置资源监控的等级。none表示不开启资源记录功能；query表示开启query级别资源记录功能；operator表示开启query级别和算子级别资源记录功能。 | query  |
| resource_track_cost     | 设置语句进行资源监控的最小执行代价。取值范围：-1 ～ INT_MAX，-1时表示所有语句都不进行资源监控；大于或等于0时表示执行语句的代价超过这个值就会进行资源监控。 | 100000 |
| resource_track_duration | 设置资源监控实时视图中记录的语句执行结束后进行历史信息转存的最小执行时间。 | 1min   |
| enable_resource_record  | 是否开启资源记录功能。on表示打开资源记录；off表示关闭资源记录。 | off    |

##### 2.1 系统视图 DBE_PERF.STATEMENT_COMPLEX_HISTORY

DBE_PERF 相关视图定义：src/common/backend/catalog/performance_views.sql

DBE_PERF.STATEMENT_COMPLEX_HISTORY 视图显示在数据库主节点上执行作业结束后的负载管理记录。

```
收集GUC参数：
use_workload_manager = on
enable_resource_track = on
过滤参数设置举例：
resource_track_duration = 1min
resource_track_cost = 0
resource_track_level = 'query'
```

```sql
查看当前执行作业结束后的负载管理记录：
postgres=# select * from DBE_PERF.STATEMENT_COMPLEX_HISTORY;
```


### 2.2 系统视图 DBE_PERF.STATEMENT_COMPLEX_HISTORY_TABLE

STATEMENT_COMPLEX_HISTORY_TABLE 系统视图显示数据库主节点执行作业结束后的负载管理记录，显示的数据是从内核中转储到系统表中的数据。当设置GUC参数enable_resource_record为on时，系统会定时（周期为3分钟）将中的记录DBE_PERF.STATEMENT_COMPLEX_HISTORY转储到系统表中。

```sql
查看归档的负载管理记录：
postgres=# select * from DBE_PERF.STATEMENT_COMPLEX_HISTORY_TABLE;
```

### 3. 系统视图 DBE_PERF.STATEMENT

获得当前节点的执行语句(归一化SQL)的信息。查询视图必须具有sysadmin权限。数据库主节点上可以看到此数据库主节点接收到的归一化的SQL的全量统计信息（包含数据库节点）；数据库节点上仅可看到归一化的SQL的此节点执行的统计信息。

```sql
CREATE VIEW dbe_perf.statement AS
  SELECT * FROM get_instr_unique_sql();
```

```
GUC参数：
enable_resource_track = on
instr_unique_sql_count > 0
```

### 4. 系统视图 DBE_PERF.WAIT_EVENTS

WAIT_EVENTS显示当前节点的event的等待相关的统计信息。

```sql
CREATE VIEW dbe_perf.wait_events AS
  SELECT * FROM get_instr_wait_event(NULL);
```

```
GUC参数：
enable_instr_track_wait = on
```



### 转储机制

GUC 参数 **enable_resource_record** ：

是否开启资源监控记录归档功能。开启(on)时，对于history视图（DBE_PERF.STATEMENT_COMPLEX_HISTORY 和DBE_PERF.OPERATOR_HISTORY）中的记录，每隔3分钟会分别被归档到相应的table视图（ DBE_PERF.STATEMENT_COMPLEX_HISTORY_TABLE 和 DBE_PERF.OPERATOR_HISTORY_TABLE），归档后history视图中的记录会被清除。



![](../images/structure.png)

以session中query级别的资源监控为例，主要对象之间的逻辑关系如上图。虚线表示对象之间的关系（如系统表gs_wlm_query_info_all 为 系统视图gs_wlm_session_info的基表）。

当开启enable_record_on参数时，系统每隔三分钟调用CREATE_WLE_SESSION_INFO()函数，将pg_stat_get_wlm_session_info()函数的返回内容（即DBE_PERF.STATEMENT_COMPLEX_HISTORY视图记录）转储到系统表GS_WLM_SESSION_QUERY_INFO_ALL(即DBE_PERF.STATMENT_COMPLEX_HISTORY_TABLE视图记录)中，同时将视图中的记录删掉：

system_views.sql

```sql
CREATE OR REPLACE FUNCTION create_wlm_session_info(IN flag int)
RETURNS int
AS $$
DECLARE
        query_str text;
        record_cnt int;
        BEGIN
                record_cnt := 0;
                query_str := 'SELECT * FROM pg_stat_get_wlm_session_info(1)'; 
                IF flag > 0 THEN
                        EXECUTE 'INSERT INTO gs_wlm_session_query_info_all ' || query_str; --删除视图中记录，转储到gs_wlm_session_query_info_all系统表
                ELSE
                        EXECUTE query_str; --直接返回结果，删除视图中记录
                END IF;
                RETURN record_cnt;
        END; $$
LANGUAGE plpgsql NOT FENCED;
```

内核调用接口：

![](../images/code.png)



### 其他内核相关函数

1.session信息query级函数：

pg_stat_get_wlm_session_info(PG_FUNCTION_ARGS)

WLMGetSessionInfo(const Qid* qid, int removed, int* num) 

维护的hash表：g_instance.wlm_cxt->stat_manager.session_info_hashtbl



2.session信息operator级函数：

pg_stat_get_wlm_operator_info(PG_FUNCTION_ARGS)

ExplainGetSessionInfo(const Qpid* qid, int removed, int* num)

维护的hash表：g_operator_table.collected_info_hashtbl



3.unique  sql：

get_instr_unique_sql(PG_FUNCTION_ARGS)

GetUniqueSQLStat(long* num)

维护的hash表：g_instance.stat_cxt.UniqueSQLHashtbl



其他方面的主要函数可以通过函数的底层接口查看内核代码，再通过其维护的hash表，自主梳理资源统计相关的流程。

### 总结：

DBE_PERF Schema提供主要的资源管理、性能监控方面的相关视图，相关视图的定义在源码 ./src/common/backend/catalog/system_views.sql， ./src/common/backend/catalog/performance_views.sql 中，可以通过视图定义进一步查看底层调用的函数接口、GUC参数的要求以及各个视图之间的关系。
