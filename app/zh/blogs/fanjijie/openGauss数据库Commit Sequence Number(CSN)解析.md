---
title: 'openGauss数据库Commit Sequence Number(CSN)解析'

date: '2022-04-07'

category: 'blog'
tags: ['openGauss数据库Commit Sequence Number(CSN)解析']

archives: '2022-04'

author: '范计杰'

summary: 'openGauss数据库Commit Sequence Number(CSN)解析'

img: '/zh/blogs/fanjijie/title/img20.png'

times: '10:20'
---

# openGauss 数据库 Commit Sequence Number(CSN)解析

openGauss 数据库中 Commit Sequence Number 简称 CSN，使用一个全局自增的长整数作为逻辑的时间戳,模拟数据库内部的时序，与 ORACLE 中的 SCN 类似,该逻辑时间戳被称为提交顺序号。每当一个事务提交的时候,在提交序列号日志中(CSN LOG)会记录该事务号 XID(事务的全局唯-标识)对应的逻辑时间戳(CSN 值)。

CSN 日志中记录的 XID 值与 CSN 值的对应关系,即决定了所有事务的状态函数 f(t)。

如图所示，在一个事务的实际执行过程中，并不会在开始就加载全部的 CSN 日志，而是在扫描到某条记录以后，才会去 CSN 日志中查询该条记录头部 xmin 和 xmax 这两个事务号对应的 CSN 值,并基于此进行可见性判断。称为基于逻辑提交时间戳的可见性判断。是对 PG 中可见性判断时查询活跃事务组的改进。

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20211124-001517a0-5e70-4400-bccd-dff81afc852c.png'>

PG 的可见性判断如下：

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20211124-904243f0-ee56-4fe7-afc6-0a8560af54b3.png'>

PG 在获取查询快照时需要获取活跃事务列表，openGauss 虽然不用获取活跃事务列表，但在读取 tuple 后需要查询 XMIN,XMAX 对应的 CSN。哪种方式更高效个人还没有搞清楚，可能 openGauss 在高并发的事务处理时更有优势，因为 OLTP 环境中活跃事务较多，并且多数基于索引的查询，需要 XMIN,XMAX 转 CSN 的记录很少。
