+++

title =  "MogDB/openGauss常用查询汇总" 

date = "2021-12-04" 

tags = [ "MogDB/openGauss常用查询汇总"] 

archives = "2021-12" 

author = "高云龙" 

summary = "MogDB/openGauss常用查询汇总"

img = "/zh/post/July/title/img2.png" 

times = "12:30"

+++

# MogDB/openGauss常用查询汇总<a name="ZH-CN_TOPIC_0000001187213632"></a>

## 概述<a name="section87911133717"></a>

在MogDB/openGauss日常运维过程中，会经常通过SQL来获取想要查看的信息，这些SQL可以作为监控指标、巡检指标，也可以临时查询使用。

## 通过系统线程id查对应的query<a name="section16361221193712"></a>

```
#!/bin/bash

source ~/.bashrc

thread_sets=`ps -ef |grep -i gaussdb |grep -v grep|awk -F ' ' '{print $2}'|xargs top -n 1 -bHp |grep -i ' worker'|awk -F ' ' '{print $1}'|tr "\n" ","|sed -e 's/,$/\n/'`

gsql -p 26000 postgres -c "select  pid,lwtid,state,query from pg_stat_activity a,dbe_perf.thread_wait_status s where a.pid=s.tid and lwtid in($thread_sets);"
```

## 查看复制槽<a name="section42958330377"></a>

```
select slot_name,coalesce(plugin,'_') as plugin,slot_type,datoid,coalesce(database,'_') as database,
       (case active when 't' then 1 else 0 end)as active,coalesce(xmin,'_') as xmin,dummy_standby,
       pg_xlog_location_diff(CASE WHEN pg_is_in_recovery() THEN restart_lsn ELSE pg_current_xlog_location() END , restart_lsn)  AS delay_lsn
from pg_replication_slots;
```

## 查看主备延迟<a name="section1330134643710"></a>

```
--主库
select client_addr,sync_state,pg_xlog_location_diff(pg_current_xlog_location(),receiver_replay_location) from pg_stat_replication;

--备库
select now() AS now, 
       coalesce(pg_last_xact_replay_timestamp(), now()) replay,
       extract(EPOCH FROM (now() - coalesce(pg_last_xact_replay_timestamp(), now()))) AS diff;
```

## 慢SQL查询<a name="section12943013380"></a>

```
select datname,usename,client_addr,pid,query_start::text,extract(epoch from (now() - query_start)) as query_runtime,xact_start::text,extract(epoch from(now() - xact_start)) as xact_runtime,state,query 
from pg_stat_activity 
where state not in('idle') and query_start is not null;
```

## 锁阻塞详情<a name="section2088615811383"></a>

```
with tl as (select usename,granted,locktag,query_start,query 
            from pg_locks l,pg_stat_activity a 
            where l.pid=a.pid and locktag in(select locktag from pg_locks where granted='f')) 
select ts.usename locker_user,ts.query_start locker_query_start,ts.granted locker_granted,ts.query locker_query,tt.query locked_query,tt.query_start locked_query_start,tt.granted locked_granted,tt.usename locked_user,extract(epoch from now() - tt.query_start) as locked_times
from (select * from tl where granted='t') as ts,(select * from tl where granted='f') tt 
where ts.locktag=tt.locktag 
order by 1;
```

## 锁阻塞源统计<a name="section935161853813"></a>

```
with tl as (select usename,granted,locktag,query_start,query 
            from pg_locks l,pg_stat_activity a 
            where l.pid=a.pid and locktag in(select locktag from pg_locks where granted='f')) 
select usename,query_start,granted,query,count(query) count 
from tl 
where granted='t' 
group by usename,query_start,granted,query 
order by 5 desc;
```

## 数据表大小排序<a name="section9768172719382"></a>

```
SELECT CURRENT_CATALOG AS datname,nsp.nspname,rel.relname,
             pg_total_relation_size(rel.oid)       AS bytes,
             pg_relation_size(rel.oid)             AS relsize,
             pg_indexes_size(rel.oid)              AS indexsize,
             pg_total_relation_size(reltoastrelid) AS toastsize
FROM pg_namespace nsp JOIN pg_class rel ON nsp.oid = rel.relnamespace
WHERE nspname NOT IN ('pg_catalog', 'information_schema','snapshot') AND rel.relkind = 'r'
order by 4 desc limit 100; 
```

## 索引大小排序<a name="section17618103853810"></a>

```
select CURRENT_CATALOG AS datname,schemaname schema_name,relname table_name,indexrelname index_name,pg_table_size(indexrelid) as index_size 
from pg_stat_user_indexes 
where schemaname not in('pg_catalog', 'information_schema','snapshot')
order by 4 desc limit 100;
```

## 表膨胀率排序<a name="section97265117382"></a>

```
select CURRENT_CATALOG AS datname,schemaname,relname,n_live_tup,n_dead_tup,round((n_dead_tup::numeric/(case (n_dead_tup+n_live_tup) when 0 then 1 else (n_dead_tup+n_live_tup) end ) *100),2) as dead_rate
from pg_stat_user_tables
where (n_live_tup + n_dead_tup) > 10000
order by 5 desc limit 100;
```

## session按状态分类所占用内存大小<a name="section118401006399"></a>

```
select state,sum(totalsize)::bigint as totalsize
from gs_session_memory_detail m,pg_stat_activity a 
where substring_inner(sessid,position('.' in sessid) +1)=a.sessionid and usename<>'mondb' and pid != pg_backend_pid() 
group by state order by sum(totalsize) desc;
```

## 查看session中query占用内存大小<a name="section3403810133916"></a>

```
select sessionid, coalesce(application_name,'')as application_name,
       coalesce(client_addr::text,'') as client_addr,sum(usedsize)::bigint as usedsize, 
       sum(totalsize)::bigint as totalsize,query 
from gs_session_memory_detail s,pg_stat_activity a 
where substring_inner(sessid,position('.' in sessid) +1)=a.sessionid 
group by sessionid,query,application_name,client_addr 
order by sum(totalsize) desc limit 10;
```

