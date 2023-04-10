+++

title = "【MogDB优化系列】如何获取Top SQL -- 特定时间内的" 

date = "2023-01-30" 

tags = ["mogdb"] 

archives = "2023-01" 

author = "云和恩墨-罗海雄" 

summary = "【MogDB优化系列】如何获取Top SQL -- 特定时间内的"

img = "/zh/post/luohaixiong/title/img.png" 

times = "10:20"
+++

本文出处：[https://www.modb.pro/db/606370](https://www.modb.pro/db/606370)



[上一篇文章](https://www.modb.pro/db/606278)说的是获取整个数据库至运行以来的Top SQL, 但是这个对于长时间运行的系统来说，显然是不够的，总有一些需求，是获取一段时间内的Top SQL. 下面列举出集中获取一段时间内的Top SQL的方法。

# 最近一段时间的 – 活动会话历史

最常见的一个需求，是获取最近时间段，比如，我刚刚1分钟之内运行的Top SQL.
MogDB的"ACTIVE SESSION PROFILE"功能，会以秒为单位，将活动会话收集起来，以方便性能诊断。这个数据保存在表dbe_perf.local_active_session中（要求初始化参数enable_asp=on）。
通过这个表，我们可以轻松获取最近一段时间数据库内部的Top SQL信息。

```sql
select count(*),unique_query_id,unique_query 
from dbe_perf.local_active_session
where sample_time > sysdate - 5/24/60
group by unique_query_id,unique_query
order by 1 desc 
limit 30;
```

上面的SQL用sample_time > sysdate - 5/24/60作为限制条件，意思是当前时间5分钟内的，运行时间最长的30条SQL. 当然，你也可以根据需要定制SQL获取更适合你的信息，比如调整不同时间段，增加group by字段，增加其他过滤条件等。

关于local_active_session的其他列，可以参考https://docs.mogdb.io/zh/mogdb/v3.0/LOCAL_ACTIVE_SESSION
这里就不详细展开了。

不过值得一提的是，相对于Opengauss, MogDB为了更准确的观测历史会话信息，在LOCAL_ACTIVE_SESSION里增加了plan_node_id信息，你可以观察到相关SQL被采样捕获时，处于执行计划的哪一步，对性能优化来说更为方便，具体可以参考https://docs.mogdb.io/zh/mogdb/v3.0/22-sql-running-status-observation，

顺便说一下，dbe_perf.local_active_session其实是个view, 其原始数据来自于函数get_local_active_session(), 目的是增加final_block_sessionid, 有时候访问起来会有点慢。所以，在无特殊需求的情况下，其实访问它的原始数据会更快一些。

```sql
select count(*)"SQL数量",unique_query_id,unique_query 
from get_local_active_session()
where sample_time > sysdate - 5/24/60
group by unique_query_id,unique_query
order by 1 desc 
limit 30;
```

# 相对长一些的时间 – 持久化的活动会话历史

local_active_session底层其实是使用了一块内存区域，所以，需要控制总行数,默认控制为10万行。对于相对久远一点的数据，MogDB通过更稀疏的采样比（默认10秒一次），将其保存在gs_asp里面。

可以用以下SQL获取local_active_session的最早时间点

```sql
select min(sample_time) from get_local_active_session();
```

关于这一点，可以参考Kamus的这一篇文章https://cdn.modb.pro/db/532958。

因此，当我们发现，local_active_session里面最早的数据已经无法满足需求时，就需要访问gs_asp. 值得注意的是，local_active_session可以在任意database中访问，而gs_asp需要在postgres库中才能获取到数据。

```sql
select count(*)*10 "SQL执行时间",unique_query_id,unique_query 
from gs_asp
where sample_time > sysdate - 5/24/60
group by unique_query_id,unique_query
order by 1 desc 
limit 30;
```

SQL和访问local_active_session基本类似，里面的count(*)加了乘以10的表达式，是为了更好体现采样比的问题。

# 历史的Top SQL – snapshot.snap_summary_statement

相比起上一篇文章中的statement, 活动会话历史其实是有一些小缺陷,比如，你无法知道它的准确执行次数（毕竟活动会话历史基于采样，持久化的甚至是10秒才采1次），无法知道它的逻辑读、物理读等信息，因此，有时候还是希望从statement中获取相关信息.

MogDB通过WDR功能（需要enable_wdr_snapshot=on），定期以快照形式将dbe_perf里的相关内容持久化到snapshot schema下，因此，我们可以通过snapshot里的快照信息来获取特定时间段的Top SQL.
与gs_asp类似，需要在postgres库中才能获取到数据。

## 第一步，获取需要时间对应的snapshot_id

```sql
select * from snapshot.snapshot 
where start_ts between .. and ..
order by snap_id;
```

## 然后根据替换下面的SQL的snap_id部分，就可以获取需要的Top SQL了。

```sql
with wdr_statement as 
(
select  snapshot_id             
,snap_node_name            node_name          
,snap_node_id              node_id            
,snap_user_name            user_name          
,snap_user_id              user_id            
,snap_unique_sql_id        unique_sql_id      
,snap_query                query              
,snap_n_calls              n_calls            
,snap_min_elapse_time      min_elapse_time    
,snap_max_elapse_time      max_elapse_time    
,snap_total_elapse_time    total_elapse_time  
,snap_n_returned_rows      n_returned_rows    
,snap_n_tuples_fetched     n_tuples_fetched   
,snap_n_tuples_returned    n_tuples_returned  
,snap_n_tuples_inserted    n_tuples_inserted  
,snap_n_tuples_updated     n_tuples_updated   
,snap_n_tuples_deleted     n_tuples_deleted   
,snap_n_blocks_fetched     n_blocks_fetched   
,snap_n_blocks_hit         n_blocks_hit       
,snap_n_soft_parse         n_soft_parse       
,snap_n_hard_parse         n_hard_parse       
,snap_db_time              db_time            
,snap_cpu_time             cpu_time           
,snap_execution_time       execution_time     
,snap_parse_time           parse_time         
,snap_plan_time            plan_time          
,snap_rewrite_time         rewrite_time       
,snap_pl_execution_time    pl_execution_time  
,snap_pl_compilation_time  pl_compilation_time
,snap_data_io_time         data_io_time       
,snap_last_updated         last_updated       
,snap_sort_count           sort_count         
,snap_sort_time            sort_time          
,snap_sort_mem_used        sort_mem_used      
,snap_sort_spill_count     sort_spill_count   
,snap_sort_spill_size      sort_spill_size    
,snap_hash_count           hash_count         
,snap_hash_time            hash_time          
,snap_hash_mem_used        hash_mem_used      
,snap_hash_spill_count     hash_spill_count   
,snap_hash_spill_size      hash_spill_size    
from
snapshot.snap_summary_statement
) 
,statement1 as (select * from wdr_statement where snapshot_id =1)
,statement2 as (select * from wdr_statement where snapshot_id =2 )
select unique_sql_id,round(total_elapse_time/1e6,1) "总执行时间",n_calls "执行次数",round(total_elapse_time/n_calls/1e3,2) "单次时间"
,round(cpu_time/n_calls/1e3,2) "单次CPU时间" ,round(data_io_time/n_calls/1e3,1) "单次IO时间"
,round(n_blocks_fetched/n_calls,1) "单次内存块",round((n_blocks_fetched-n_blocks_hit)/n_calls,1) "单次物理块"
,round(n_tuples_fetched/n_calls,1) "单次访问行数",round(n_tuples_returned/n_calls,1) "单次返回行数"
,substr(query,1,1024) "SQL文本"
from (
select a.unique_sql_id,a.  query,
a.total_elapse_time - nvl(b.total_elapse_time,0) as total_elapse_time,
a.n_calls - nvl(b.n_calls,0) as n_calls,
a.cpu_time - nvl(b.cpu_time,0) as cpu_time,
a.data_io_time - nvl(b.data_io_time,0) as data_io_time,
a.sort_time - nvl(b.sort_time,0) as sort_time,
a.n_blocks_fetched - nvl(b.n_blocks_fetched,0) as n_blocks_fetched,
a.n_blocks_hit - nvl(b.n_blocks_hit,0) as n_blocks_hit,
a.n_tuples_fetched - nvl(b.n_tuples_fetched,0) as n_tuples_fetched,
a.n_tuples_returned - nvl(b.n_tuples_returned,0) as n_tuples_returned
from  statement2 a , statement1 b
where a.unique_sql_id = b.unique_sql_id(+)
)
where n_calls > 10 
order by  1 desc limit 30;
```

SQL看起来异常复杂，其实可以写得更简单，其中大版篇幅在改动snapshot.snap_summary_statement的列名上面。

在一个自己控制的数据库内，完全可以创建一个view, 以简化整段SQL.

```sql
create view wdr_statement as 
select  snapshot_id             
,snap_node_name            node_name          
,snap_node_id              node_id            
,snap_user_name            user_name          
,snap_user_id              user_id            
,snap_unique_sql_id        unique_sql_id      
,snap_query                query              
,snap_n_calls              n_calls            
,snap_min_elapse_time      min_elapse_time    
,snap_max_elapse_time      max_elapse_time    
,snap_total_elapse_time    total_elapse_time  
,snap_n_returned_rows      n_returned_rows    
,snap_n_tuples_fetched     n_tuples_fetched   
,snap_n_tuples_returned    n_tuples_returned  
,snap_n_tuples_inserted    n_tuples_inserted  
,snap_n_tuples_updated     n_tuples_updated   
,snap_n_tuples_deleted     n_tuples_deleted   
,snap_n_blocks_fetched     n_blocks_fetched   
,snap_n_blocks_hit         n_blocks_hit       
,snap_n_soft_parse         n_soft_parse       
,snap_n_hard_parse         n_hard_parse       
,snap_db_time              db_time            
,snap_cpu_time             cpu_time           
,snap_execution_time       execution_time     
,snap_parse_time           parse_time         
,snap_plan_time            plan_time          
,snap_rewrite_time         rewrite_time       
,snap_pl_execution_time    pl_execution_time  
,snap_pl_compilation_time  pl_compilation_time
,snap_data_io_time         data_io_time       
,snap_last_updated         last_updated       
,snap_sort_count           sort_count         
,snap_sort_time            sort_time          
,snap_sort_mem_used        sort_mem_used      
,snap_sort_spill_count     sort_spill_count   
,snap_sort_spill_size      sort_spill_size    
,snap_hash_count           hash_count         
,snap_hash_time            hash_time          
,snap_hash_mem_used        hash_mem_used      
,snap_hash_spill_count     hash_spill_count   
,snap_hash_spill_size      hash_spill_size    
from
snapshot.snap_summary_statement;
```

然后上面的SQL就简化成了：

```sql
with statement1 as (select * from wdr_statement where snapshot_id =1)
,statement2 as (select * from wdr_statement where snapshot_id =2 )
select unique_sql_id,round(total_elapse_time/1e6,1) "总执行时间",n_calls "执行次数",round(total_elapse_time/n_calls/1e3,2) "单次时间"
,round(cpu_time/n_calls/1e3,2) "单次CPU时间" ,round(data_io_time/n_calls/1e3,1) "单次IO时间"
,round(n_blocks_fetched/n_calls,1) "单次内存块",round((n_blocks_fetched-n_blocks_hit)/n_calls,1) "单次物理块"
,round(n_tuples_fetched/n_calls,1) "单次访问行数",round(n_tuples_returned/n_calls,1) "单次返回行数"
,substr(query,1,1024) "SQL文本"
from (
select a.unique_sql_id,a.  query,
a.total_elapse_time - nvl(b.total_elapse_time,0) as total_elapse_time,
a.n_calls - nvl(b.n_calls,0) as n_calls,
a.cpu_time - nvl(b.cpu_time,0) as cpu_time,
a.data_io_time - nvl(b.data_io_time,0) as data_io_time,
a.sort_time - nvl(b.sort_time,0) as sort_time,
a.n_blocks_fetched - nvl(b.n_blocks_fetched,0) as n_blocks_fetched,
a.n_blocks_hit - nvl(b.n_blocks_hit,0) as n_blocks_hit,
a.n_tuples_fetched - nvl(b.n_tuples_fetched,0) as n_tuples_fetched,
a.n_tuples_returned - nvl(b.n_tuples_returned,0) as n_tuples_returned
from  statement2 a , statement1 b
where a.unique_sql_id = b.unique_sql_id(+)
)
where n_calls > 10 
order by  1 desc limit 30;
```

当然，你也可以通过内置的select generate_wdr_report()函数来生成完整的WDR报告，但可定化程度就会差了许多。

前面之所以特意修改列名，其实是为了更方便SQL的重用。

比如下面一个场景：

## 获取某个snapshot到当前时间区间内的Top SQL

有时候，我们先看看最近一两个小时的Top SQL, 但是，WDR还没做，而我们不想去主动调用一次WDR的生成快照功能。那怎么办呢？可以拿snapshot.snap_summary_statement的数据和内存里的dbe_perf.statement数据做对比

和上一条SQL相比，仅需改动一个点即可

```sql
,statement1 as (select * from wdr_statement where snapshot_id =1)
=>
,statement1 as (select * from dbe_perf.statement)
```

也就是

```sql
with 
,statement1 as (select * from dbe_perf.statement)
,statement2 as (select * from wdr_statement where snapshot_id =2 )
select unique_sql_id,round(total_elapse_time/1e6,1) "总执行时间",n_calls "执行次数",round(total_elapse_time/n_calls/1e3,2) "单次时间"
,round(cpu_time/n_calls/1e3,2) "单次CPU时间" ,round(data_io_time/n_calls/1e3,1) "单次IO时间"
,round(n_blocks_fetched/n_calls,1) "单次内存块",round((n_blocks_fetched-n_blocks_hit)/n_calls,1) "单次物理块"
,round(n_tuples_fetched/n_calls,1) "单次访问行数",round(n_tuples_returned/n_calls,1) "单次返回行数"
,substr(query,1,1024) "SQL文本"
from (
select a.unique_sql_id,a.  query,
a.total_elapse_time - nvl(b.total_elapse_time,0) as total_elapse_time,
a.n_calls - nvl(b.n_calls,0) as n_calls,
a.cpu_time - nvl(b.cpu_time,0) as cpu_time,
a.data_io_time - nvl(b.data_io_time,0) as data_io_time,
a.sort_time - nvl(b.sort_time,0) as sort_time,
a.n_blocks_fetched - nvl(b.n_blocks_fetched,0) as n_blocks_fetched,
a.n_blocks_hit - nvl(b.n_blocks_hit,0) as n_blocks_hit,
a.n_tuples_fetched - nvl(b.n_tuples_fetched,0) as n_tuples_fetched,
a.n_tuples_returned - nvl(b.n_tuples_returned,0) as n_tuples_returned
from  statement2 a , statement1 b
where a.unique_sql_id = b.unique_sql_id(+)
)
where n_calls > 10 
order by  1 desc limit 30;
```

## 手动生成statement的快照，获取到当前时间区间内的Top SQL

WDR数据，毕竟是系统定期生成，时间点上相对不好把握，我们也可以变通一下，手动去生成 statement的快照, 并替换刚才SQL里的表名。

```sql
create table statement_01121137 
as select * from statement_01121137 
；
```

然后

```sql
with 
,statement1 as (select * from dbe_perf.statement)
,statement2 as (select * from statement_01121137)
select unique_sql_id,round(total_elapse_time/1e6,1) "总执行时间",n_calls "执行次数",round(total_elapse_time/n_calls/1e3,2) "单次时间"
,round(cpu_time/n_calls/1e3,2) "单次CPU时间" ,round(data_io_time/n_calls/1e3,1) "单次IO时间"
,round(n_blocks_fetched/n_calls,1) "单次内存块",round((n_blocks_fetched-n_blocks_hit)/n_calls,1) "单次物理块"
,round(n_tuples_fetched/n_calls,1) "单次访问行数",round(n_tuples_returned/n_calls,1) "单次返回行数"
,substr(query,1,1024) "SQL文本"
from (
select a.unique_sql_id,a.  query,
a.total_elapse_time - nvl(b.total_elapse_time,0) as total_elapse_time,
a.n_calls - nvl(b.n_calls,0) as n_calls,
a.cpu_time - nvl(b.cpu_time,0) as cpu_time,
a.data_io_time - nvl(b.data_io_time,0) as data_io_time,
a.sort_time - nvl(b.sort_time,0) as sort_time,
a.n_blocks_fetched - nvl(b.n_blocks_fetched,0) as n_blocks_fetched,
a.n_blocks_hit - nvl(b.n_blocks_hit,0) as n_blocks_hit,
a.n_tuples_fetched - nvl(b.n_tuples_fetched,0) as n_tuples_fetched,
a.n_tuples_returned - nvl(b.n_tuples_returned,0) as n_tuples_returned
from  statement2 a , statement1 b
where a.unique_sql_id = b.unique_sql_id(+)
)
where n_calls > 10 
order by  1 desc limit 30;
```