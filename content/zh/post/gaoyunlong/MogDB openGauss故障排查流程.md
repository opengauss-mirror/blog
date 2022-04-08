+++

title = "MogDB/openGauss故障排查流程" 

date = "2022-04-07" 

tags = ["MogDB/openGauss故障排查流程"] 

archives = "2022-04" 

author = "高云龙" 

summary = "MogDB/openGauss故障排查流程"

img = "/zh/post/gaoyunlong/title/img33.png" 

times = "10:20"

+++

# MogDB/openGauss故障排查流程

## 前提

如果有反馈说数据库响应慢或者压测过程中数据库有报错，第一步先收集数据库服务器资源使用情况，这一步是处理所有故障的前提。

```sql
--负载
top 命令
htop 命令

--cpu
lscpu 命令

--内存大小
free -g

--磁盘大小
df-Th 

--磁盘使用跟踪
nohup iostat -xmt 1 > iostat.log 2>&1 &

--网络延时
应用程序与数据库之间的网络延时，集群内主库与同步备库之间的网络延时
nohup ping 目标ip | awk '{ print $0"\t" strftime("%Y-%m-%d %H:%M:%S",systime())}' > ping.log 2>&1 &

*模拟网络延时小知识*
模拟同城机房网络延迟在0.7ms ~ 0.9ms
添加网络延迟模拟：tc qdisc add dev enp23s0f1(网卡) root netem delay 0.8ms 0.1ms
删除网络延时模拟：tc qdisc dev dev enp23s0f1(网卡) root netem delay 0.8ms 0.1ms
```

## 常见问题

### xlog目录磁盘空间不足

xlog 日志目录满的原因有以下几个

1、集群内有宕机的备节点，或者主备节点之间的网络不通
2、无效的复制槽未及时清理
3、开启归档，但归档失败
4、xlog 保留数量过多

##### 备节点故障

通过网络及数据库日志信息，判断节点故障原因，并尽快恢复主备节点之间的复制关系，当故障无法快速解决时，建议修改数据库参数来改变主库xlog保留大小

```sql
enable_xlog_prune = on
max_size_for_xlog_prune：默认是2T，建议修改值为104857600 （100GB），或根据磁盘空间自行调整
```

##### 无效复制槽

查看是否存在无效的复制槽导致xlog 清理不及时，需要将延时最大的复制槽删除

```sql
--查看复制槽
select slot_name,coalesce(plugin,'_') as plugin,
       slot_type,datoid,coalesce(database,'_') as database,
       active,coalesce(xmin,'_') as xmin,
       pg_size_pretty(pg_xlog_location_diff(CASE WHEN pg_is_in_recovery() THEN pg_last_xlog_receive_location() ELSE pg_current_xlog_location() END , restart_lsn))  AS retained_bytes
from pg_replication_slots;

--清理复制槽
select pg_drop_replication_slot('slot_name');
```

##### 归档失效

先检查归档目录是否有归档日志，如果没有，需要查看数据库日志归档失效的原因。

##### xlog参数不合理

检查数据库xlog保留参数值是否合理: wal_keep_segments

### CPU使用率高

除了数据库BUG、其他程序耗cpu高影响数据库外，绝大部分原因是SQL执行慢且并发量大引起

```sql
1、当前正在执行的SQL汇总 
select query,count(*) from pg_stat_activity group by query order by 2 desc limit 5;

2、查看sql的执行计划
explain (analyze,costs,buffers,timing) QUERY 

3、sql涉及的表是否有表膨胀、索引失效或缺失或重复 的情况，这步可以处理80%的慢sql

--表结构
\d+ 表名

--表及索引占空间大小
SELECT CURRENT_CATALOG AS datname,nsp.nspname,rel.relname,
        pg_size_pretty(pg_total_relation_size(rel.oid))       AS totalsize,
        pg_size_pretty(pg_relation_size(rel.oid))             AS relsize,
        pg_size_pretty(pg_indexes_size(rel.oid))              AS indexsize,
        pg_size_pretty(pg_total_relation_size(reltoastrelid)) AS toastsize
FROM pg_namespace nsp
JOIN pg_class rel ON nsp.oid = rel.relnamespace
WHERE nspname NOT IN ('pg_catalog', 'information_schema') AND rel.relkind = 'r'
order by pg_total_relation_size(rel.oid) desc
limit 20;

--表膨胀
select schemaname,relname,n_live_tup,n_dead_tup,
	round((n_dead_tup::numeric/(case (n_dead_tup+n_live_tup) when 0 then 1 else (n_dead_tup+n_live_tup) end ) *100),2) as dead_rate
from pg_stat_user_tables
where n_live_tup > 0 and (n_dead_tup::numeric/(n_dead_tup+n_live_tup))>0
order by 5 desc limit 50;

--索引使用率
select schemaname||'.'||relname tablename,schemaname||'.'||indexrelname indexname,idx_scan,idx_tup_read,idx_tup_fetch from pg_stat_user_indexes;

--重复索引
SELECT pg_size_pretty(SUM(pg_relation_size(idx))::BIGINT) AS SIZE,
       (array_agg(idx))[1] AS idx1, (array_agg(idx))[2] AS idx2,
       (array_agg(idx))[3] AS idx3, (array_agg(idx))[4] AS idx4
FROM (
    SELECT indexrelid::regclass AS idx, (indrelid::text ||E'\n'|| indclass::text ||E'\n'|| indkey::text ||E'\n'||COALESCE(indexprs::text,'')||E'\n' || COALESCE(indpred::text,'')) AS KEY
    FROM pg_index) sub
GROUP BY KEY HAVING COUNT(*)>1
ORDER BY SUM(pg_relation_size(idx)) DESC;

4、根据执行计划判断sql是否需要改写
```

### 内存不足

1、查看服务器物理内存整体使用情况。
2、检查数据库内存参数设置是否合理：
max_process_memory 建议设置物理内存80%
shared_buffers 建议设置为物理内存的40%

#### 数据库内存使用分布

查看整体内存使用情况,当dynamic_used_memory 与 max_dynamic_memory 的值接近时说明动态内存可能不足，如果dynamic_peak_memory超过了max_dynamic_memory，说明曾经发生过oom

```
select * from gs_total_memory_detail; 
```

##### 连接过多耗尽内存

主要排除是连接数过多导致内存不足的场景

```sql
查看连接数分布
select state,count(*) from pg_stat_activity group by state;

各状态连接占用总内存情况
select state,pg_size_pretty(sum(totalsize))
from gs_session_memory_detail m,pg_stat_activity a 
where substring_inner(sessid,position('.' in sessid)+1)=a.sessionid
group by state;

单会话占用内存排序
select sessid,pg_size_pretty(sum(totalsize)),pg_size_pretty(sum(freesize)) from gs_session_memory_detail group by sessid order by sum(totalsize) desc limit 10;
```

##### 缓存机制

会话的缓存机制不合理，也会导致内存无法快速释放，可能与参数local_syscache_threshold 有关系。

```sql
内存上下文使用内存分布
select contextname,pg_size_pretty(sum(totalsize)),pg_size_pretty(sum(freesize)) from gs_session_memory_detail group by contextname order by sum(totalsize) desc limit 10;
```

##### 总结

动态内存高一般有以下几个原因：
1、连接数过多会导致动态内存耗尽，
如果是idle连接多，可能是开发端长连接保留数量不合理；
如果是active连接多，可能是硬件内存不足，需要扩内存。

2、单个会话占用内存多，需要根据sql去分析占用内存情况
