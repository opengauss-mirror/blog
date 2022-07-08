+++

title = "MogDB 日常维护项目" 

date = "2022-06-27" 

tags = ["MogDB 日常维护项目"] 

archives = "2022-06" 

author = "云和恩墨" 

summary = "MogDB 日常维护项目"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# MogDB 日常维护项目

本文出处：https://www.modb.pro/db/421975

## 检查MogDB状态

通过MogDB提供的工具查询数据库和实例状态，确认数据库和实例都处于正常的运行状态，可以对外提供数据服务。

- 检查实例状态

  ```
  gs_check -U omm -i CheckClusterState
  ```

- 检查参数

  ```
  mogdb=# SHOW parameter_name;
  上述命令中，parameter_name需替换成具体的参数名称。
  ```

- 修改参数

  ```
  gs_guc reload  -D /mogdb/data/dbnode -c "paraname=value"
  ```

## 检查锁信息

锁机制是数据库保证数据一致性的重要手段，检查相关信息可以检查数据库的事务和运行状况。

- 查询数据库中的锁信息

  ```
  mogdb=# SELECT * FROM pg_locks;
  ```

- 查询等待锁的线程状态信息

  ```
  mogdb=# SELECT * FROM pg_thread_wait_status WHERE wait_status = 'acquire lock';
  ```

- 结束系统进程

  查找正在运行的系统进程，然后使用kill命令结束此进程。

  ```
  ps ux
  kill -9 pid
  ```

## 统计事件数据

SQL语句长时间运行会占用大量系统资源，用户可以通过查看事件发生的时间，占用内存大小来了解现在数据库运行状态。

- 查询事件的时间

  查询事件的线程启动时间、事务启动时间、SQL启动时间以及状态变更时间。

  ```
  mogdb=# SELECT backend_start,xact_start,query_start,state_change FROM pg_stat_activity;
  ```

- 查询当前服务器的会话计数信息

  ```
  mogdb=# SELECT count(*) FROM pg_stat_activity;
  ```

- 系统级统计信息

  查询当前使用内存最多的会话信息。

  ```
  mogdb=# SELECT * FROM pv_session_memory_detail() ORDER BY usedsize desc limit 10;
  ```

## 对象检查

表、索引、分区、约束等是数据库的核心存储对象，其核心信息和对象维护是DBA重要的日常工作。

- 查看表的详细信息

  ```
  mogdb=# \d+ table_name
  ```

- 查询表统计信息

  ```
  mogdb=# SELECT * FROM pg_statistic;
  ```

- 查看索引的详细信息

  ```
  mogdb=# \d+ index_name
  ```

- 查询分区表信息

  ```
  mogdb=# SELECT * FROM pg_partition;
  ```

- 收集统计信息

  使用ANALYZE语句收集数据库相关的统计信息。

  使用VACUUM语句可以回收空间并更新统计信息。

- 查询约束信息

  ```
  mogdb=# SELECT * FROM pg_constraint;
  ```

## SQL报告检查

使用EXPLAIN语句查看执行计划。

### 备份

数据备份重于一切，日常应检查备份执行情况，并检查备份有效性，确保备份能够保障数据安全，备份安全加密也应兼顾。

- 指定用户导出数据库

  ```
  gs_dump dbname -p port -f out.sql -U user_name -W password
  ```

- 导出schema

  ```
  gs_dump dbname -p port -n schema_name -f out.sql
  ```

- 导出table:

  ```
  gs_dump dbname -p port -t table_name -f out.sql
  ```

### 基本信息检查

基本信息包括版本、组件、补丁集等信息，定期检查数据库信息并登记在案是数据库生命周期管理的重要内容之一。

- 版本信息

  ```
  mogdb=# SELECT version();
  ```

- 容量检查

  ```
  mogdb=# SELECT pg_table_size('table_name');
  mogdb=# SELECT pg_database_size('database_name');
  ```
