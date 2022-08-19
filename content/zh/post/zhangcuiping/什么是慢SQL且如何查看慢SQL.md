+++

title = "什么是慢SQL且如何查看慢SQL" 

date = "2022-08-11" 

tags = ["什么是慢SQL且如何查看慢SQL"] 

archives = "2022-04" 

author = "张翠娉" 

summary = "什么是慢SQL且如何查看慢SQL"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "10:20"

+++

# 什么是慢SQL且如何查看慢SQL？



## **介绍**

某个SQL执行时间超过指定时间时称为慢SQL。我们可以查看慢SQL，包括历史慢SQL以及当前慢SQL。

## 查看历史慢SQL

首先要设置log_min_duration_statement，记录慢SQL。  

然后在参数log_directory 指定的目录中查看日志。  

进入数据库的数据目录，找到postgresql.conf配置文件，设置log_min_duration_statement参数。

```bash
cd /opt/mogdb/data
```

## 查看当前慢SQL

例如查询执行时间超过1秒的SQL 

``` sql
MogDB=# select * from pg_stat_activity where state<>'idle' and now()-query_start > interval '1 s' order by query_start; 
 datid | datname  |      pid       |   sessionid    | usesysid | usename | application_name | client_addr | client_hostname | client_port |         back
end_start         |          xact_start           |          query_start          |         state_change          | waiting | enqueue | state  | resourc
e_pool | query_id |                 query                  | connection_info | unique_sql_id | trace_id 
-------+----------+----------------+----------------+----------+---------+------------------+-------------+-----------------+-------------+-------------
------------------+-------------------------------+-------------------------------+-------------------------------+---------+---------+--------+--------
-------+----------+----------------------------------------+-----------------+---------------+----------
 16019 | postgres | 70396694860272 | 70396694860272 |       10 | ommdoc  | workload         |             |                 |             | 2022-07-25 1
5:15:34.954987+08 | 2022-07-25 15:15:34.957823+08 | 2022-07-25 15:15:34.957823+08 | 2022-07-25 15:15:34.959476+08 | f       |         | active | default
_pool  |        0 | WLM fetch collect info from data nodes |                 |             0 | 
(1 row)

MogDB=# 
```


