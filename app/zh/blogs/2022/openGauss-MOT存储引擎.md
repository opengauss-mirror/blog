---
title: 'openGauss MOT存储引擎'

date: '2022-01-07'

category: 'blog'
tags: ['openGauss MOT存储引擎']

archives: '2022-01'

author: 'ORA-DBA'

summary: 'openGauss MOT存储引擎'

img: '/zh/blogs/2022/title/img15.jpg'

times: '12:30'
---

# openGauss MOT 存储引擎<a name="ZH-CN_TOPIC_0000001186895104"></a>

## 介绍<a name="section128581147112818"></a>

MOT 存储引擎，是一种事务性行存储，针对多核和大内存服务器进行了优化。MOT 为事务性工作负载提供更高的性能。

MOT 支持 ACID 特性，并包括严格的持久性和高可用性支持。企业可以在关键任务、性能敏感的在线事务处理（OLTP）中使用 MOT，以实现高性能、高吞吐、可预测低延迟以及多核服务器的高利用率。

MOT 适合在多路和多核处理器的现代服务器上运行。

## openGauss 内存优化存储引擎结构<a name="section199213111296"></a>

openGauss 内存优化存储引擎结构图

<img src='./figures/openGauss内存优化存储引擎结构图.png'>

openGauss 内存优化存储引擎组件负责管理 MOT 和事务。

MOT 与基于磁盘的普通表并排创建。MOT 实现了几乎完全的 SQL 覆盖，并且支持完整的数据库功能集，如存储过程和自定义函数。

通过完全存储在内存中的数据和索引、非统一内存访问感知（NUMA-aware）设计、消除锁和锁存争用的算法以及查询原生编译，MOT 可提供更快的数据访问和更高效的事务执行。

MOT 有效的几乎无锁的设计和高度调优的实现，使其在多核服务器上实现了卓越的近线性吞吐量扩展。

**MOT 完全支持 ACID 特性：**

- 原子性（Atomicity）：原子事务是一系列不可分割的数据库操作。在事务完成（分别提交或中止）之后，这些操作要么全部发生，要么全部不发生。
- 一致性（Consistency）：事务结束后，数据库处于一致状态，保留数据完整性。
- 隔离性（Isolation）：事务之间不能相互干扰。MOT 支持不同的重复读和读提交隔离级别。在下一个版本中，MOT 还将支持可序列化隔离。
- 持久性（Durability）：即使发生崩溃和失败，成功完成（提交）的事务效果持久保存。MOT 完全集成了 openGauss 的基于 WAL 的日志记录。同时支持同步和异步日志记录选项。MOT 还支持同步+面向 NUMA 优化的组提交。
