+++

title = "openGauss的管理与维护"

date = "2022-10-10"

tags = ["openGauss技术撰稿活动", "openGauss"]

archives = "2022-10"

author = "knighthoob2001"

summary = "openGauss的管理与维护."

+++



笔者对openGauss的了解：

①openGauss是一款高性能、高安全、高可靠的企业级开源关系型数据库。它具有多核高性能、智能运维等特色，凝聚了华为数据库内核研发团队多年的经验。

②openGauss是一款开源关系型数据库管理系统。其内核源自PostgreSQL，深度融合华为在数据库领域多年的经验，结合企业级场景需求，持续构建竞争力特性。同时openGauss也是一个开源的数据库平台，鼓励社区贡献、合作。

③其具有高性能、高安全、易运维、全开放的特点，非常不错。

本文笔者主要讲述openGauss的管理维护

    原因：为保证openGauss数据库中的数据安全，满足日常业务对数据库软件的稳定性要求、可靠性要求、高效性要求，必须对数据库进行定期的管理维护。


# 检查openGauss状态

    通过openGauss提供的工具查询数据库和实例状态，确认数据库和实例都处于正常的运行状态，可以对外提供数据服务。

# 检查实例状态

`gs_check -U omm -i CheckClusterState`

# 检查参数

`postgres=# SHOW parameter_name；`

# 修改参数

`gs_guc [ set | reload ] [-N NODE-NAME] [-I INSTANCE-NAME | -D DATADIR] -c "parameter“`

# 检查锁信息

    锁机制是数据库保证数据一致性的重要手段，检查相关信息可以检查数据库的事务和运行状况。

# 查询数据库中的锁信息。

```

postgres=# SELECT * FROM pg_locks;
```


查询等待锁的线程状态信息。

```

postgres=# SELECT * FROM pg_thread_wait_status WHERE wait_status = 'acquire lock';
```


查询等待锁的事件信息。

```

postgres=# SELECT node_name, thread_name, tid, wait_status, query_id FROM pg_thread_wait_status WHERE wait_status = 'acquire lock';
```


结束系统进程:查找正在运行的系统进程，然后使用kill命令结束此进程。

# 统计事件数据

    SQL语句长时间运行会占用大量系统资源，用户可以通过查看事件发生的时间，占用内存大小来了解现在数据库运行状态。

查询事件的时间:查询事件的线程启动时间、事务启动时间、SQL启动时间以及状态变更时间。

`postgres=# SELECT backend_start,xact_start,query_start,state_change FROM pg_stat_activity;`

查询当前服务器的会话计数信息

``` 
postgres=# SELECT count(*) FROM pg_stat_activity;

```


# SQL报告检查

    使用EXPLAIN语句查看执行计划。
备份

    数据备份重于一切，日常应检查备份执行情况，并检查备份有效性，确保备份能够保障数据安全，备份安全加密也应兼顾。

导出指定用户

```

gs_dump dbname -p port -f out.sql -U user_name -W password
```


导出table


```
gs_dump dbname -p port -t table_name -f out.sql

```

# 基本信息检查

    基本信息包括版本、组件、补丁集等信息，定期检查数据库信息并登记在案是数据库生命周期管理的重要内容之一。

# 版本信息

``postgres=# SELECT version();``

# 容量检查

```

postgres=# SELECT pg_table_size('table_name'); 
postgres=# SELECT pg_database_size('database_name');

```
