---
title: 'openGauss运维---内存'
date: '2023-01-30'
category: 'blog'
tags: ['openGauss运维---内存']
archives: '2023-01'
author: 'zhangzhijing'
summary: '内存问题常见定位方法'
img: '/zh/blogs/zhangzhijing/title/img1.png'
times: '00:40'
---

# openGauss 运维---内存

## 1、物理内存

```shell
#建议关闭swap
swapoff -a
#监控手段
free -g
```

## 2、数据库内存

​ openGauss 中的内存主要分为两个部分，一是以 Buffer pool 为主的内存，用于加载数据文件；一是基于内存上下文的动态内存，用于数据文件以外的所有模块。

​ Buffer pool 本质是若干块固定的共享内存块，主要是存储数据文件（主表、索引，及其对应的 FreeSpaceMap，VictimMap）。这部分内存基于淘汰算法管理，即申请后不会释放，当达到设置的上限后，下次申请内存会先选择一块内存将其中的内容淘汰掉做替换。Buffer Pool 的大小是通过 GUC 参数来控制的，其中行存通过 GUC 参数 shared_buffers 控制，列存通过 GUC 参数 cstore_buffers 控制。

​ 动态内存的管理是源于 PG 的内存上下文机制。在 openGauss 数据库中除了 Buffer Pool 外，所有的动态内存申请，都是从内存上下文中申请的。动态内存的演进历史如下：

1、在内存上下文的机制上，openGauss 引入逻辑内存管理机制，实现对数据库实例使用内存上限的管理，同时提供多项视图来追踪内存使用情况。

2、其后进一步优化内存上下文使用逻辑，提供共享内存上下文，实现进程级的内存管理；以及栈式内存上下文，低开销的内存管理。

​ openGauss 数据库能够使用的最大内存通过 GUC 参数 max_process_memory 设置，Buffer Pool 的大小通过 GUC 参数 shared_buffers（行存）和 cstore_buffers（列存）设置，而动态内存能够使用的大小是（ max_process_memory – shared_buffers – cstore_buffers – max_backend_memory – 关键数据结构占用内存）。当动态内存申请的大小达到上限，就会出现内存不足的报错，使得数据库内存使用受控，避免系统 OOM。

### 2.1 推荐参数配置

| 参数               | 推荐设置                  | 参数说明                                                                                     |
| ------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| max_process_memory | 物理内存的 70%            | 数据库节点可用的最大物理内存                                                                 |
| shared_buffers     | max_process_memory 的 40% | 数据库共享内存大小，共享内存在使用过程中会不断增长，只到占满分配的内存空间后开始不断换入换出 |

### 2.2 GS_TOTAL_MEMORY_DETAIL

GS_TOTAL_MEMORY_DETAIL 视图统计当前数据库节点使用内存的信息，单位为 MB。当 GUC 参数 enable_memory_limit 的值为 off 时，本视图不可用。

| 名称         | 类型    | 描述                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| nodename     | text    | 节点名称。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| memorytype   | text    | max_process_memory：guc 参数设置，表示数据库总共能够使用的最大内存 process_used_memory：进程实际使用的内存大小，对应 top 中的 RES max_dynamic_memory：数据库能够使用的动态内存大小，计算得到： max_process_memory - max_backend_memory - max_shared_memory - max_cstore_memory dynamic_used_memory：动态内存使用的内存大小 dynamic_peak_memory：动态内存曾经达到的峰值内存大小 dynamic_used_shrctx：共享上下文使用的内存大小 max_backend_memory：为+1 端口及 WAL 线程预留的内存 backend_used_memory：+1 端口及 WAL 线程使用的预留内存大小 max_shared_memory：shared_buffers + 关键数据结构信息 shared_used_memory：进程使用的共享内存大小，对应 top 中的 SHR max_cstore_memory：cstore_buffers other_used_memory：process_used_memory - dynamic_used_memory - backend_used_memory - shared_used_memory - cstore_used_memory 当 dynamic_used_memory 大于 max_dynamic_memory 就会报内存不足。如果此时 dynamic_used_memory 小于 max_dynamic_memory，而 dynamic_peak_memory 大于 max_dynamic_memory 表明曾经出现内存不足的情况。 |
| memorymbytes | integer | process_used_memory：进程实际使用的内存大小，对应 top 中的 RES 内存类型分配内存的大小。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

### 2.3 会话内存问题分析视图 GS_SESSION_MEMORY_DETAIL

​ GS_SESSION_MEMORY_DETAIL 统计会话的内存使用情况，以 MemoryContext 节点来统计。当开启线程池（enable_thread_pool = on）时，该视图包含所有的线程和会话的内存使用情况。当 GUC 参数 enable_memory_limit 的值为 off 时，本视图不可用。

​ 其中内存上下文“TempSmallContextGroup”，记录当前线程中所有内存上下文字段“totalsize”小于 8192 字节的信息汇总，并且内存上下文统计计数记录到“usedsize”字段中。所以在视图中，“TempSmallContextGroup”内存上下文中的“totalsize”和“freesize”是该线程中所有内存上下文“totalsize”小于 8192 字节的汇总总和，usedsize 字段表示统计的内存上下文个数。

​ 可通过"select \* from gs_session_memctx_detail(threadid, '');"将某个线程所有内存上下文信息记录到“$GAUSSLOG/pg_log/${node_name}/dumpmem”目录下的“threadid_timestamp.log”文件中。其中 threadid 可通过下表 sessid 中获得。

| 名称        | 类型     | 描述                                                                                                   |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------ |
| sessid      | text     | 线程启动时间+线程标识（字符串信息为 timestamp.threadid）。                                             |
| sesstype    | text     | 线程名称。                                                                                             |
| contextname | text     | 内存上下文名称。                                                                                       |
| level       | smallint | 当前上下文在整体内存上下文中的层级。                                                                   |
| parent      | text     | 父内存上下文名称。                                                                                     |
| totalsize   | bigint   | 当前内存上下文的内存总数，单位 Byte。                                                                  |
| freesize    | bigint   | 当前内存上下文中已释放的内存总数，单位 Byte。                                                          |
| usedsize    | bigint   | 当前内存上下文中已使用的内存总数，单位 Byte；“TempSmallContextGroup”内存上下文中该字段含义为统计计数。 |

### 2.4 共享内存分析视图 GS_SHARED_MEMORY_DETAIL

查询当前节点所有已产生的共享内存上下文的使用信息。

| **名称**    | **类型** | **描述**                         |
| ----------- | -------- | -------------------------------- |
| contextname | text     | 内存上下文的名称。               |
| level       | smallint | 内存上下文的级别。               |
| parent      | text     | 上级内存上下文。                 |
| totalsize   | bigint   | 共享内存总大小（单位：字节）。   |
| freesize    | bigint   | 共享内存剩余大小（单位：字节）。 |
| usedsize    | bigint   | 共享内存使用大小（单位：字节）。 |

## 3、常见内存问题分析思路

```sql
--当动态内存占用较大时，查看占用较高的内存上下文，排查是否存在内存泄漏，如果与session有关可能是因为连接数较多引起的正常占用
select contextname,
sum(totalsize)/1024/1024 sum,
sum(freesize)/1024/1024,
count(*) count
from gs_session_memory_detail
group by contextname order by sum desc limit 10;
--当共享内存较大时可查看
select contextname,
sum(totalsize)/1024/1024 sum,
sum(freesize)/1024/1024,
count(*) count
from gs_shared_memory_detail
group by contextname order by sum desc limit 10;
--分析所有连接的sessionCacheMoryContext分布情况
create temp table memoryInfo as
select total, cache from
(select sessid as sessid, sum(totalsize)/1024/1024 as total
from gs_session_memory_detail
where sesstype='postgres'
group by sessid) as a,
(select sessid, totalsize/1024/1024 as cache
from gs_session_memory_detail
where contextname='SessionCacheMemoryContext') as b
where a.sessid=b.sessid
order by total desc;
select '0-10' as range, sum(total) as total, sum(cache) as cache, sum(cache)/sum(total) as ratio, count(*) as count
from memoryInfo where total>=0 and total<10;
select '10-20' as range, sum(total) as total, sum(cache) as cache, sum(cache)/sum(total) as ratio, count(*) as count
from memoryInfo where total>=10 and total<20;
select '20-30' as range, sum(total) as total, sum(cache) as cache, sum(cache)/sum(total) as ratio, count(*) as count
from memoryInfo where total>=20 and total<30;
select '30-40' as range, sum(total) as total, sum(cache) as cache, sum(cache)/sum(total) as ratio, count(*) as count
from memoryInfo where total>=30 and total<40;
select '40-50' as range, sum(total) as total, sum(cache) as cache, sum(cache)/sum(total) as ratio, count(*) as count
from memoryInfo where total>=40 and total<50;
select '50-max' as range, sum(total) as total, sum(cache) as cache, sum(cache)/sum(total) as ratio, count(*) as count
from memoryInfo where total>=50;

--查看索引占用内存大小
select * from gs_session_memory_detail
where contextname like '%index%' or contextname like '%idx%'
order by totalsize desc limit 50;

--查看某session占用的总内存
select sum(totalsize)/1024/1024 from gs_session_memory_detail
where sessid like '%sessionid%';

--内存泄漏排查
select dbe_perf.track_memory_context('某内存上下文');
select * from dbe_perf.track_memory_context_detail();
select pg_sleep(时间间隔);
select * from dbe_perf.track_memory_context_detail();
select dbe_perf.track_memory_context(' ');
```
