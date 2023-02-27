---
title: 'openGauss监控场景处理'

date: '2021-01-28'

category: 'blog'
tags: ['openGauss异常处理']

archives: '2021-01'

author: '王鑫佳'

summary: 'openGauss监控场景处理'

img: '/zh/blogs/wangxinjia/title/img18.png'

times: '15:30'
---

# openGauss 监控场景处理<a name="ZH-CN_TOPIC_0000001116503039"></a>

## 死锁数量异常<a name="section1536920477357"></a>

**判断方法：**

```
select sum(deadlocks) as deadlocks from dbe_perf.GLOBAL_STAT_DATABASE
```

**异常分析：**

1.  请求与保持条件：获取资源的进程可以同时申请新的资源。
2.  非剥夺条件：已经分配的资源不能从该进程剥夺。
3.  循环等待条件：多个进程构成环路，并且每个进程都在等待相邻进程正占用的资源。
4.  互斥条件：资源只能被一个进程使用。

**解决方案**

1.  检索出死锁进程的 ID（select oid,relname from pg_class where relname=‘all_date’;），检索出来的字段中，waiting 字段数据为 t 的那条就是死锁进程，找到对应的 procpid 列的值。
2.  将进程杀掉，select pg_cancel_backend\(‘死锁那条数据的 procpid 值’\)，运行之后再次更新这个表，sql 顺利执行。
3.  如果 pg_stat_activity 没有记录，则查询 pg_locks 是否有这个对象的锁，select pid_locks where relation=‘上面查询出来的 oid’;然后杀掉进程。

**运维建议**

1.  在所有事务中都以相同的次序使用资源。
2.  使事务尽可能简单并在一个批处理中。
3.  为死锁超时参数设置一个合理范围。
4.  避免在事务内和用户进行交互，减少资源锁定时间。
5.  使用较低的隔离级别。

## 主备复制状态异常<a name="section9764640113617"></a>

**判断方法**

```
gs_om -t status|grep cluster_state|grep Normal|wc -l
```

**异常分析**

1.  可能存在批量处理大量数据导致主从节点宕机，主节点重启后从节点 WAL 同步信息不完整。
2.  主库宕机或者失联 3.备库宕机或者失联。

**解决方案**

1.  通过查看主备状态判断是主节点还是备节点故障。
2.  主节点故障可以尝试重启主节点，若不生效，可以再备节点使用 gs_ctl failover -D “备节点的数据目录”，然后刷新机器（gs_om -t refreshconf），这时如果主机好了，直接启动出现两主，这时使用 gs_ctl build -D “主节点的数据目录” -b incremental。
3.  -b 参数为指定重建备机的模式，incremental 为取主备差异的数据增量修复备机。

## 备机回放 gap 使用空间异常<a name="section27651211184015"></a>

**判断方法**

```
select read_ptr-last_replayed_read_ptr as replay_gap from dbe_perf.GLOBAL_REDO_STATUS
```

**异常分析**

1.  开启了数据文件的 checksum，因为回放时需要大量的 CPU 资源，在进行 checksum 时会消耗 startup 进程的资源。
2.  主库频繁的离散 IO 操作，如大量的索引变更，大量的 vacuum 操作。
3.  频繁和大量的系统调用。

**解决方案**

1.  关闭 checksum，除非要防御物理篡改。
2.  删除没有必要的索引。
3.  根据业务调整垃圾回收的调度。
4.  检查点拉长，可以减少 full page 的量。
5.  加大备库的 shared buffer。
6.  关闭 IO 时间的跟踪。
7.  备库使用 IOPS 能力更强，IO 延迟更低的机器。
8.  调整内核参数，使用并行 apply。
9.  如果有多个备库，备库可以关闭 fsync。
10. 将冻结年龄加大，可以减少冻结产生的 redo。
11. 增加单个进程可打开的文件数。

## 长查询时间异常<a name="section1258313214439"></a>

**判断方法**

```
select EXTRACT (epoch from max(current_timestamp - query_start)) from dbe_perf.SESSION_STAT_SCTIVITY where query_start is not null and state=‘active’ and application_name not like ‘dn_%’;
```

**异常分析**

1.  SQL 未经过优化，没有走合适的索引。
2.  可能存在锁争用问题。
3.  可能存在全表扫描问题。

**解决方案**

1.  查看对应语句的执行计划并作出相应的优化。
2.  创建合适的索引。
