---
title: 'PostgreSQL 与 MogDB/openGauss 之核心进/线程'

date: '2022-11-04'

tags: ['openGauss与postgresql对比']

archives: '2022-11'
category: 'blog'
author: '高云龙'

summary: 'PostgreSQL 与 MogDB/openGauss 之核心进/线程'

img: '/zh/post/gaoyunlong/title/img21.png'

times: '18:00'
---

# PostgreSQL 与 MogDB/openGauss 之核心进/线程

MogDB/openGauss 基于 PostgreSQL 进行的二次开发，但两种数据库的执行模型已经不同，PostgreSQL 是基于进程模型的数据库，而 MogDB/openGauss 是基于线程模型的数据库，但核心程序目前还是基本保持一致的，这里对 PG14 和 MogDB 3.0 做一下对比

PS：感谢田兵老师答疑解惑，帮忙整理

| PG14                         | MogDB 3.0       | 备注                                                                                                                                                                                      |
| ---------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| postgres                     | mogdb           | 初始化（内存，全局信息，信号，线程池等），启动辅助进/线程，循环监听辅助进/线程，处理客户端的连接请求，执行相关 sql 业务其他线程                                                           |
| walwriter                    | WALwriter       | 后台 WAL 写。主要功能是周期性的把日志缓冲区的内容同步到磁盘上                                                                                                                             |
| -                            | WALwriteraux    | wal writer 辅助线程                                                                                                                                                                       |
| checkpointer                 | checkpointer    | 检查点线程。进行检查点操作，完成数据库的周期性检查点和执行检查点命令                                                                                                                      |
| background writer            | pagewriter      | 后台数据写线程。周期性的把数据库数据缓冲区的内容同步到磁盘上                                                                                                                              |
| logger                       | syslogger       | 运行日志写。主要功能是把各个线程的运行日志信息写到运行日志文件中                                                                                                                          |
| stats collector              | statscollector  | 统计信息收集，负责收集、保存、持久化数据库运行中产生的各种 metric 信息，包括物理硬件资源使用信息、对象属性及使用信息、SQL 运行信息、会话信息、锁信息、线程信息等。PS：PG15 优化掉了此进程 |
| walsender                    | WalSender       | WAL 日志信息发送，负责物理复制和逻辑复制的 wal 文件信息发送                                                                                                                               |
| walreciver                   | WALreceiver     | 下游接收 wal 信息，物理复制下游节点接受 wal 文件信息                                                                                                                                      |
| logical replication launcher | -               | 启动逻辑复制工作进程                                                                                                                                                                      |
| autovacuum launcher          | AVClauncher     | 启动维护清理进/线程对数据库回收清理                                                                                                                                                       |
| -                            | Jobscheduler    | 根据 pg_job 表里面定义的 JOB 周期，对 JOB 进行调用                                                                                                                                        |
| -                            | 2pccleaner      | 2 阶段清理                                                                                                                                                                                |
| -                            | ashworker       | 统计历史活动会话信息                                                                                                                                                                      |
| -                            | snapshotworker  | 收集 snapshot 信息，用于生成 WDR 报告                                                                                                                                                     |
| -                            | undorecycler    | 回收 undo 空间数据                                                                                                                                                                        |
| -                            | reaper          | 回收处于 die 状态的子线程                                                                                                                                                                 |
| -                            | percentworker   | 根据 percentile 参数值计算 sql 响应时间百分比，目前 percentile 参数仅支持 80 和 95                                                                                                        |
| -                            | jemalloc_bg_thd | Jemalloc 开源库的后台线程                                                                                                                                                                 |
| -                            | faultmonitor    | 监控系统故障                                                                                                                                                                              |
| -                            | auditor         | 审计线程，将审计信息写到文件                                                                                                                                                              |
| -                            | alarm           | 告警检测                                                                                                                                                                                  |
| -                            | WLMarbiter      | 待确认                                                                                                                                                                                    |
| -                            | WLMmonitor      | 监控工作负载                                                                                                                                                                              |
| -                            | WLMworker       | 收集工作负载数据                                                                                                                                                                          |
| -                            | heartbeat       | content3                                                                                                                                                                                  |
| -                            | Spbgwriter      | content3                                                                                                                                                                                  |
| -                            | applylauncher   | content3                                                                                                                                                                                  |
| -                            | asyncundolaunch | content3                                                                                                                                                                                  |
| -                            | globalstats     | content3                                                                                                                                                                                  |
