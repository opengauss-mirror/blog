**Mysql与openGauss性能视图比较**

# 1.简介 

 与Mysql的Performance_schema类似，openGauss本身也提供类似的性能监控视图。但与Mysql也存在差异，本文就针对两者异同做个比较。

  Mysql的性能监控视图保存在performance_schema schema下，openGauss主要保存在dbe_perf schema下。本人主要比较statement，wait event和io相关视图。

# 2.语句相关视图

   Mysql通过performance_schema.events_statements_current显示当前运行或者刚刚完成的语句，可以显示成功或者失败的语句。与此功能对应的openGauss视图是pg_catalog.pg_stat_activity。但两者的统计信息还是有很多差异的，比如Mysql会记录语句执行报错信息，但openGauss 当前版本（3.0.1）系统表并不显示该信息。

下面看一下两个系统显示信息的差别：

```
mysql> select * from performance_schema.events_statements_current\G
*************************** 1. row ***************************
              THREAD_ID: 67
               EVENT_ID: 3
           END_EVENT_ID: NULL
             EVENT_NAME: statement/sql/select
                 SOURCE: init_net_server_extension.cc:95
            TIMER_START: 1832456036100746000
              TIMER_END: 1832456036738383000
             TIMER_WAIT: 637637000
              LOCK_TIME: 3000000
               SQL_TEXT: select * from performance_schema.events_statements_current
                 DIGEST: 91caf112a1e8c015485be7c90b3abc04f3aa12909461daf3d3c002cc88ed6f0f
            DIGEST_TEXT: SELECT * FROM `performance_schema` . `events_statements_current`
         CURRENT_SCHEMA: NULL
            OBJECT_TYPE: NULL
          OBJECT_SCHEMA: NULL
            OBJECT_NAME: NULL
  OBJECT_INSTANCE_BEGIN: NULL
            MYSQL_ERRNO: 0
      RETURNED_SQLSTATE: NULL
           MESSAGE_TEXT: NULL
                 ERRORS: 0
               WARNINGS: 0
          ROWS_AFFECTED: 0
              ROWS_SENT: 0
          ROWS_EXAMINED: 0
CREATED_TMP_DISK_TABLES: 0
     CREATED_TMP_TABLES: 0
       SELECT_FULL_JOIN: 0
 SELECT_FULL_RANGE_JOIN: 0
           SELECT_RANGE: 0
     SELECT_RANGE_CHECK: 0
            SELECT_SCAN: 1
      SORT_MERGE_PASSES: 0
             SORT_RANGE: 0
              SORT_ROWS: 0
              SORT_SCAN: 0
          NO_INDEX_USED: 1
     NO_GOOD_INDEX_USED: 0
       NESTING_EVENT_ID: NULL
     NESTING_EVENT_TYPE: NULL
    NESTING_EVENT_LEVEL: 0
           STATEMENT_ID: 1090
               CPU_TIME: 0
  MAX_CONTROLLED_MEMORY: 0
       MAX_TOTAL_MEMORY: 0
       EXECUTION_ENGINE: PRIMARY
1 row in set (0.00 sec)
```

```
openGauss=#  select *from pg_stat_activity;
-[ RECORD 1 ]----+----------------------------------------------------------------------------------------------------------------------------
datid            | 15630
datname          | postgres
pid              | 140516278662912
sessionid        | 140516278662912
usesysid         | 10
usename          | omm1
application_name | gsql
client_addr      | 
client_hostname  | 
client_port      | -1
backend_start    | 2023-04-26 06:50:29.843509+08
xact_start       | 2023-04-26 06:50:41.311718+08
query_start      | 2023-04-26 06:50:41.311718+08
state_change     | 2023-04-26 06:50:41.311735+08
waiting          | f
enqueue          | 
state            | active
resource_pool    | default_pool
query_id         | 1688849860305527
query            | select *from pg_stat_activity;
connection_info  | {"driver_name":"libpq","driver_version":"(openGauss 3.1.1 build ) compiled at 2023-04-22 01:42:25 commit 0 last mr  debug"}
unique_sql_id    | 3800022352
trace_id         | 
```

  在pg_stat_activity中，query_id与unique_sql_id在语句执行完成后都会清零，只有在执行中的语句才能看到query_id与unique_sql_id。

  Mysql中显示历史执行语句的视图是performance_schema.events_statmements_history。列定义与events_statements_current 相同。 而openGauss对应该功能的视图是dbe_perf.statement_history。表定义与pg_stat_activityc差异较大。performance_schema.events_statements_history表并不显示关闭进程的信息，而openGauss存储所有的信息，重启实例后也能查询到相关信息。需要配置相关参数，track_stmt_stat_level、track_stmt_parameter等，另外特权用户（sysadmin权限或者monitor admin权限）在系统库（postgres）中查询才能看到相关记录。两者虽然都记录历史信息，但openGauss历史表中不记录失败语句，只记录成功执行的语句，而Mysql也会保存执行失败语句。Mysql通过配置参数（  performance_schema_events_statements_history_size、  performance_schema_events_statements_history_long_size ）可以控制保存记录的数量，超过配置参数后会替换更早执行的语句。

 经过归一化处理后的语句，Mysql保存在performance_schema.events_statements_summary_by_digest中，而openGauss保存在dbe_perf.statement中。openGauss要求特权用户才可以查看，并且只记录执行正确的语句。

| Mysql                                                        | openGauss对应系统表/视图                                     | 区别                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| events_statements_current 显示当前运行语句，每个进程一条，显示当前运行或刚刚完成的语句。 | pg_catalog.pg_stat_activity 显示当前运行语句，每个进程一条，显示当前运行或刚刚完成的语句。 | 1、系统表不保存错误或警告相关信息 2、统计指标不尽相同        |
| events_statements_history 每个线程最近结束的N条语句,不显示关闭线程 | dbe_perf.statement_history 是记录数据库运行中产生的sql与其运行信息，保证即便数据库重启，SQL信息也依然可以查询到。 需要打开相关配置参数: track_stmt_stat_level = 'L1,L0' track_stmt_parameter = on 需要在系统库查询 | 1、dbe_perf.statement_history，需要在系统库查询，若不删除记录，会显示关闭线程。需要打开相关oG相关参数。 2、oG不记录执行失败语句。mysql会记录失败语句。 3、oG必须具有sysadmin权限或者monitor admin权限。mysql不需要 4、统计指标不尽相同 |
| events_statements_summary_by_digest 按照归一化语句对执行信息进行汇总 | dbe_perf.statement 按照归一化语句对执行信息进行汇总          | 1、统计指标不尽相同 2、oG必须具有sysadmin权限或者monitor admin权限，mysql不需要 3、oG只记录正确执行的语句，mysql也存错误语句 |

# 3.等待事件相关视图

  Mysql查看当前正在执行的等待事件的系统表为performance_schema.events_waits_current。对应的历史表为events_waits_history和events_wait_history_long。记录已经执行完的等待事件历史。各种等待事件的统计保存在events_waits_summary_global_by_event_name中。

  openGauss查看当前等待事件的视图为pg_catalog.pg_thread_wait_status。但openGauss没有保存等待事件历史。各种等待事件的统计信息保存在dbe_perf.wait_events中。

下面看一下两个系统显示信息的差别：

```
mysql> select * from performance_schema.events_waits_current\G
*************************** 1. row ***************************
            THREAD_ID: 67
             EVENT_ID: 61
         END_EVENT_ID: NULL
           EVENT_NAME: wait/lock/metadata/sql/mdl
               SOURCE: mdl.cc:3429
          TIMER_START: 1834596125174160296
            TIMER_END: 1834601588671364336
           TIMER_WAIT: 5463497204040
                SPINS: NULL
        OBJECT_SCHEMA: mysql
          OBJECT_NAME: t1
           INDEX_NAME: NULL
          OBJECT_TYPE: TABLE
OBJECT_INSTANCE_BEGIN: 140237528633264
     NESTING_EVENT_ID: 60
   NESTING_EVENT_TYPE: STATEMENT
            OPERATION: metadata lock
      NUMBER_OF_BYTES: NULL
                FLAGS: NULL
...
```

```
openGauss=# select *from pg_catalog.pg_thread_wait_status;
...
-[ RECORD 14 ]---+-----------------------
node_name        | db1
db_name          | postgres
thread_name      | gsql
query_id         | 1688849860305936
tid              | 140516163778304
sessionid        | 140516163778304
lwtid            | 220949
psessionid       | 
tlevel           | 0
smpid            | 0
wait_status      | acquire lock
wait_event       | relation
locktag          | 3d0e:58aa:0:0:0:0
lockmode         | AccessExclusiveLock
block_sessionid  | 140516278662912
global_sessionid | 0:0#0
...
```



| Mysql                                                        | openGauss对应系统表/视图                                     | 区别                    |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ----------------------- |
| events_waits_current 显示当前等待事件，每个线程一条，显示当前的等待事件 | pg_catalog.pg_thread_wait_status 检测当前实例中工作线程（backend thread）以及辅助线程（auxiliary thread）的阻塞等待情况 | 1、等待事件标识方式不同 |
| events_waits_history                                         | 无                                                           | 1、oG不存储等待事件历史 |
| events_waits_history_long                                    | 无                                                           | 1、oG不存储等待事件历史 |
| events_waits_summary_global_by_event_name 列出所有等待时间的统计信息 | dbe_perf.wait_events 列出所有等待时间的统计信息              | 1、等待事件标识方式不同 |

# 4.IO相关视图

Mysql通过performance_schema.file_summary_by_instance表统计文件IO事件，除了数据文件IO，也包含日志文件，系统元信息文件等IO信息。openGauss类似系统表为dbe_perf.file_iostat,但他仅统计数据文件IO。并且读写也没有分别统计。

下面看一下两个系统显示信息的差别：

```
mysql> select * from performance_schema.file_summary_by_instance

...

*************************** 76. row ***************************
                FILE_NAME: /var/lib/mysql/mysql/slow_log.CSV
               EVENT_NAME: wait/io/file/csv/data
    OBJECT_INSTANCE_BEGIN: 140239856545536
               COUNT_STAR: 3
           SUM_TIMER_WAIT: 98207256
           MIN_TIMER_WAIT: 32359920
           AVG_TIMER_WAIT: 32735752
           MAX_TIMER_WAIT: 33246744
               COUNT_READ: 0
           SUM_TIMER_READ: 0
           MIN_TIMER_READ: 0
           AVG_TIMER_READ: 0
           MAX_TIMER_READ: 0
 SUM_NUMBER_OF_BYTES_READ: 0
              COUNT_WRITE: 0
          SUM_TIMER_WRITE: 0
          MIN_TIMER_WRITE: 0
          AVG_TIMER_WRITE: 0
          MAX_TIMER_WRITE: 0
SUM_NUMBER_OF_BYTES_WRITE: 0
               COUNT_MISC: 3
           SUM_TIMER_MISC: 98207256
           MIN_TIMER_MISC: 32359920
           AVG_TIMER_MISC: 32735752
           MAX_TIMER_MISC: 33246744

...
```

```
openGauss=# select * from dbe_perf.file_iostat;
-[ RECORD 1 ]----
filenum   | 15039
dbid      | 
spcid     | 1664
phyrds    | 2
phywrts   | 0
phyblkrd  | 2
phyblkwrt | 0
readtim   | 62
writetim  | 0
avgiotim  | 31
lstiotim  | 5
miniotim  | 5
maxiowtm  | 57

...
```

Mysql可以按照table或index对IO事件进行分类统计，对应系统表为table_io_waits_summary_by_table和table_io_waits_summary_by_index_usage。openGauss没有单独的系统视图，但可以通过filenum与pg_class的relfilenode信息关联，然后按照表或者索引进行聚合查询分析。

| Mysql                                                        | openGauss对应系统表                                       | 区别                                                         |
| ------------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------ |
| file_summary_by_instance 按照文件名和event_name进行统计，包括等待时间，读、写、其他的max，min,max,avg等统计信息 | dbe_perf.file_iostat 对数据文件IO的统计，反映数据的IO性能 | 1、oG仅统计数据库文件，没有event_name概念 2、oG仅统计读写相关信息，没有等待时间，其他，并且读写不分开 |
| table_io_waits_summary_by_table 按照table对io进行统计，包括等待时间，读、写、其他的max，min,max,avg等统计信息 | dbe_perf.file_iostat 对数据文件IO的统计，反映数据的IO性能 | 1、没有按照table进行汇总，但可以通过relfilenode连接后找到对应表 |
| table_io_waits_summary_by_index_usage， 按照table,index对IO进行统计，包括等待时间，读、写、其他的max，min,max,avg等统计信息 | dbe_perf.file_iostat 对数据文件IO的统计，反映数据的IO性能 | 1、没有按照table，index进行汇总，但可以通过relfilenode连接后找到对应索引及表 |

# 5.总结

  从上面的分析可以看出Mysql的系统监控表与openGauss还是有挺大差别。Mysql中用X_current查询事件当前状态，每个线程一条。执行完成后转存到X_history与X_history_long表。相关表定义类似。openGauss中查询当前执行与执行历史的表并不对应。

另外两个系统开启相关记录的方式也不尽相同。Mysql通过更新performance_schema.setup_consumers表，可以控制开启与关闭相关视图。更新后立即影响监控。

```
mysql> SELECT * FROM performance_schema.setup_consumers;
+----------------------------------+---------+
| NAME                             | ENABLED |
+----------------------------------+---------+
| events_stages_current            | NO      |
| events_stages_history            | NO      |
| events_stages_history_long       | NO      |
| events_statements_current        | YES     |
| events_statements_history        | YES     |
| events_statements_history_long   | NO      |
| events_transactions_current      | YES     |
| events_transactions_history      | YES     |
| events_transactions_history_long | NO      |
| events_waits_current             | NO      |
| events_waits_history             | NO      |
| events_waits_history_long        | NO      |
| global_instrumentation           | YES     |
| thread_instrumentation           | YES     |
| statements_digest                | YES     |
+----------------------------------+---------+
```

openGauss则通过修改系统参数，且各个事件都不尽相同。

比如记录归一化语句的dbe_perf.statement的条件为：1 enable_resource_track打开且 2 instr_unique_sql_count大于0.

记录语句执行历史的dbe_perf.statement_history的条件为：

1.打开了动态语句追踪功能：采用dynamic_func_control追踪STMT。

2.track_stmt_stat_level追踪第一个level为L0或者更高。

3.track_stmt_stat_level追踪第二个level为L0或者更高，且语句运行时间大于log_min_duration_statement设定值，且log_min_duration_statement大于等于0，并且没有打开track_stmt_parameter

4.打开track_stmt_parameter，并且时间模式第一个值（消耗的DBTIME）大于0。

