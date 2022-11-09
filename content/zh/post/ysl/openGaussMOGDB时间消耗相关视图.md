+++

title = "openGauss/MOGDB时间消耗相关视图" 

date = "2022-05-23" 

tags = ["openGauss/MOGDB时间消耗相关视图"] 

archives = "2022-05" 

author = "云和恩墨-阎书利" 

summary = "openGauss/MOGDB时间消耗相关视图"

img = "/zh/post/ysl/title/img39.png" 

times = "10:20"
+++

# openGauss/MOGDB时间消耗相关视图

本文出处：[https://www.modb.pro/db/388212](https://www.modb.pro/db/388212)

> 数据库版本openGauss/MOGDB-2.1.1

## 一、显示当前用户在各个节点上正在执行的作业的负载管理记录（单位：ms）

包含：
语句执行前的阻塞时间、语句执行的开始时间、语句已经执行的时间、语句执行预估总时间、语句执行预估剩余时间。语句在数据库节点上的最小执行时间，语句在数据库节点上的最大执行时间，语句在数据库节点上的平均执行时间，语句在数据库节点上的最小CPU时间，语句在数据库节点上的最大CPU时间，语句在数据库节点上的CPU总时间等。

```sql
select datid,dbname,schemaname,username,block_time,start_time,duration,estimate_total_time,estimate_left_time,min_dn_time,max_dn_time,average_dn_time,min_cpu_time,max_cpu_time,total_cpu_time,queryid,query,query_plan from dbe_perf.global_statement_complex_runtime;
```

![image.png](./figures/20220331-d9db98ca-66fb-470b-9e80-4774ccd0cab3.png)

## 二、显示和当前用户执行作业正在运行时的负载管理相关信息（单位：s）

如查询语句当前为止的pending的时间, 语句当前为止的实际执行时间, 语句在上一时间周期内的数据库节点上CPU使用的总时间

```
select datid,datname,threadid,usesysid,usename,block_time,elapsed_time,total_cpu_time,query from dbe_perf.statement_wlmstat_complex_runtime; 
```

我们在一个终端用pg_sleep()模拟一个慢SQL
![image.png](./figures/20220331-98b179b6-20a4-4d42-9b32-22f825220533.png)
在另一个终端可以查询这个SQL到目前为止的执行时间，可以查看当前查询时刻，这个未完成的SQL的实际运行时间等。
![image.png](./figures/20220331-b5fb66b0-95d4-49a5-8a83-f943ca50625e.png)

## 三、统计workload（业务负载）上的DML的最大，最小，总时间花费（单位：微秒）。

```
select * from dbe_perf.workload_sql_elapse_time; 
```

![image.png](./figures/20220331-13faf984-6b73-489a-9555-7845c340c078.png)
![image.png](./figures/20220331-49e215b6-640a-486b-94b1-ade088207adf.png)

## 四、查看当前数据库节点下的各种时间消耗信息（单位：微秒）

```
select * from dbe_perf.instance_time; 
```

![image.png](./figures/20220331-b17b1585-d3de-4c92-834d-3e2faf635e10.png)

> DB_TIME：作业在多核下的有效时间花销。
> CPU_TIME：CPU的时间花销。
> EXECUTION_TIME：执行器内的时间花销。
> PARSE_TIME：SQL解析的时间花销。
> PLAN_TIME：生成Plan的时间花销。
> REWRITE_TIME：SQL重写的时间花销。
> PL_EXECUTION_TIME ：plpgsql（存储过程）执行的时间花销。
> PL_COMPILATION_TIME：plpgsql（存储过程）编译的时间花销。
> NET_SEND_TIME：网络上的时间花销。
> DATA_IO_TIME：IO上的时间花销。

## 五、统计当前节点会话线程的运行时间信息，及各执行阶段所消耗时间

```
select * from dbe_perf.session_time;
```

![img](./figures/20220331-10ca4255-8a32-4508-bccd-4cb80f3123ec.png)
