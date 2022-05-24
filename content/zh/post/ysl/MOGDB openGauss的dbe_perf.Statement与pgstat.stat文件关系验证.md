+++

title = "MOGDB/openGauss的dbe_perf.Statement与pgstat.stat文件关系验证" 

date = "2022-05-24" 

tags = ["MOGDB/openGauss的dbe_perf.Statement与pgstat.stat文件关系验证"] 

archives = "2022-05" 

author = "云和恩墨-阎书利" 

summary = "MOGDB/openGauss的dbe_perf.Statement与pgstat.stat文件关系验证"

img = "/zh/post/ysl/title/img39.png" 

times = "10:20"
+++

# MOGDB/openGauss的dbe_perf.Statement与pgstat.stat文件关系验证

本文出处：[https://www.modb.pro/db/228364](https://www.modb.pro/db/228364)

数据目录的/global下在数据库stop之后会自动生成一个pgstat.stat文件。保存着DBE_PERF_Schema下query记录statement相关的dbe_perf.Statement（获得当前节点的执行语句(归一化SQL)的信息。查询视图必须具有sysadmin权限。
数据库主节点上可以看到此数据库主节点接收到的归一化的SQL的全量统计信息（包含数据库节点）；数据库节点上仅可看到归一化的SQL的此节点执行的统计信息）、dbe_perf.STATEMENT_WLMSTAT_COMPLEX_RUNTIME（STATEMENT_WLMSTAT_COMPLEX_RUNTIME视图显示和当前用户执行作业正在运行时的负载管理相关信息）视图静态记录。在数据库拉起后文件自动清理。

# 一、Statement所有相关的视图有：

```
select count(*) from dbe_perf.Statement;
select count(*) from dbe_perf.STATEMENT_COUNT;
select count(*) from dbe_perf.GLOBAL_STATEMENT_COUNT;
select count(*) from dbe_perf.SUMMARY_STATEMENT_COUNT;
select count(*) from dbe_perf.GLOBAL_STATEMENT_COMPLEX_HISTORY;
select count(*) from dbe_perf.GLOBAL_STATEMENT_COMPLEX_HISTORY_TABLE;
select count(*) from dbe_perf.GLOBAL_STATEMENT_COMPLEX_RUNTIME;
select count(*) from dbe_perf.STATEMENT_RESPONSETIME_PERCENTILE;
select count(*) from dbe_perf.STATEMENT_COMPLEX_RUNTIME;
select count(*) from dbe_perf.STATEMENT_COMPLEX_HISTORY_TABLE;
select count(*) from dbe_perf.STATEMENT_COMPLEX_HISTORY;
select count(*) from dbe_perf.STATEMENT_WLMSTAT_COMPLEX_RUNTIME;

```

验证情况如下，从现象看只有dbe_perf.Statement、dbe_perf.STATEMENT_WLMSTAT_COMPLEX_RUNTIME受影响。

# 二、第一轮测试

![image.png](../figures/20211230-745cea46-2659-4095-b6c7-f97af7e3f8b3.png)

```
select count(*) from dbe_perf.Statement;
-------
    47
(1 row)

postgres=# select count(*) from dbe_perf.STATEMENT_COUNT;
 count
-------
     4
(1 row)

postgres=# select count(*) from dbe_perf.GLOBAL_STATEMENT_COUNT;
 count
-------
     4
(1 row)

postgres=# select count(*) from dbe_perf.SUMMARY_STATEMENT_COUNT;
 count
-------
     4
(1 row)

postgres=# select count(*) from dbe_perf.GLOBAL_STATEMENT_COMPLEX_HISTORY;
 count
-------
     0
(1 row)

postgres=# select count(*) from dbe_perf.GLOBAL_STATEMENT_COMPLEX_HISTORY_TABLE;
 count
-------
     0
(1 row)

postgres=# select count(*) from dbe_perf.GLOBAL_STATEMENT_COMPLEX_RUNTIME;
 count
-------
     0
(1 row)

postgres=# select count(*) from dbe_perf.STATEMENT_RESPONSETIME_PERCENTILE;
 count
-------
     1
(1 row)

postgres=# select count(*) from dbe_perf.STATEMENT_COMPLEX_RUNTIME;
 count
-------
     0
(1 row)

postgres=# select count(*) from dbe_perf.STATEMENT_COMPLEX_HISTORY_TABLE;
 count
-------
     0
(1 row)

postgres=# select count(*) from dbe_perf.STATEMENT_COMPLEX_HISTORY;
 count
-------
     0
(1 row)

postgres=# select count(*) from dbe_perf.STATEMENT_WLMSTAT_COMPLEX_RUNTIME;
 count
-------
     9
(1 row)


```

可能会报 **WARNING: workload manager is not valid.**，需要将use_workload_manager参数打开，该参数表示是否开启资源管理功能。

> use_workload_manager参数由off变为on状态后，不会统计off时的存储资源。如果需要统计off时用户使用的存储资源，请在数据库中执行以下命令：select gs_wlm_readjust_user_space(0);

![image.png](../figures/20211230-a25fb65b-778f-47c9-992e-91e9596792ba.png)

Stop 库后，删除pgstat.stat文件后再次查询

![image.png](../figures/20211230-e5e1d3a5-b787-4062-9524-73b31a384755.png)

```
postgres=# select count(*) from dbe_perf.Statement;
 count
-------
    27
(1 row)

postgres=# select count(*) from dbe_perf.STATEMENT_COUNT;
 count
-------
     4
(1 row)

postgres=# select count(*) from dbe_perf.GLOBAL_STATEMENT_COUNT;
 count
-------
     4
(1 row)

postgres=# select count(*) from dbe_perf.SUMMARY_STATEMENT_COUNT;
 count
-------
     4
(1 row)

postgres=# select count(*) from dbe_perf.GLOBAL_STATEMENT_COMPLEX_HISTORY;
 count
-------
     0
(1 row)

postgres=# select count(*) from dbe_perf.GLOBAL_STATEMENT_COMPLEX_HISTORY_TABLE;
 count
-------
     0
(1 row)

postgres=# select count(*) from dbe_perf.GLOBAL_STATEMENT_COMPLEX_RUNTIME;
 count
-------
     0
(1 row)

postgres=# select count(*) from dbe_perf.STATEMENT_RESPONSETIME_PERCENTILE;
 count
-------
     1
(1 row)

postgres=# select count(*) from dbe_perf.STATEMENT_COMPLEX_RUNTIME;
 count
-------
     0
(1 row)

postgres=# select count(*) from dbe_perf.STATEMENT_COMPLEX_HISTORY_TABLE;
 count
-------
     0
(1 row)

postgres=# select count(*) from dbe_perf.STATEMENT_COMPLEX_HISTORY;
 count
-------
     0
(1 row)

postgres=# select count(*) from dbe_perf.STATEMENT_WLMSTAT_COMPLEX_RUNTIME;
 count
-------
     9
(1 row)

```

第一轮里看到dbe_perf.Statement在删除pgstat.stat后数量从47变成了27.三、第二轮测试第二轮测试，发现dbe_perf.STATEMENT_WLMSTAT_COMPLEX_RUNTIME的信息也受到了影响
