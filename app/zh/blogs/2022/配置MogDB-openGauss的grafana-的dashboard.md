---
title: '配置MogDB/openGauss的grafana 的dashboard'

date: '2021-12-27'

category: 'blog'
tags: ['配置MogDB/openGauss的grafana 的dashboard']

archives: '2021-12'

author: '高云龙'

summary: '配置MogDB/openGauss的grafana 的dashboard'

img: '/zh/blogs/2022/title/img8.png'

times: '12:30'
---

# 配置 MogDB/openGauss 的 grafana 的 dashboard<a name="ZH-CN_TOPIC_0000001187373548"></a>

## **概述**<a name="section7728422181918"></a>

我们已经介绍了prometheus + grafana + opengauss_exporter完成对 MogDB/openGauss 数据库的监控,但这只是第一步，我们还需要通过 grafana 的 dashboard 查看各个关注的指标项，本文主要介绍 dashboard 的配置。

## **监控指标汇总**<a name="section19632156141915"></a>

数据源选择的是 prometheus，主要关注的监控指标分为：基础信息、内存信息、连接信息、复制信息、锁及等待事件、统计信息、query 信息以及数据库对象

<img src='./figures/20211204-cfc47e9a-4272-48e2-9fba-ab5a17c9b323.png'>

- **基础信息**

  基础信息是运维人员比较关注的，有变化第一时间可以看到的信息，比如实例 IP、数据库版本、数据库运行时间、exporter 状态、exporter 运行时间等等

  <img src='./figures/20211204-183e159b-ef0f-4134-b134-71f99ba6e89a.png'>

- **内存信息**

  展示数据库内存总体使用情况，按会话状态分组占用内存情况，内存上下文占用内存情况以及占用内存最多的 session 及 sql 文本

  <img src='./figures/20211204-ffad91b6-007a-441c-8af8-835a9c0e0597.png'>

  <img src='./figures/20211204-b6e374da-906c-4f47-bc31-96f0ca3037fa.png'>

- **连接信息**

  连接数总体使用情况，各状态连接使用情况以及各应用连接数

  <img src='./figures/20211204-ec617df5-639c-43a2-a45e-5d84738909c5.png'>

- **复制信息**

  复制槽使用占比、复制槽延时、备节点信息及主备之间的延迟

  <img src='./figures/20211204-c0cfe4c4-d76b-4a8c-bd04-7a2f81f603a6.png'>

- **锁及等待事件**

  锁阻塞源信息，锁阻塞详情，锁类型分布情况，锁冲突及死锁检测，等待事件汇总及等待时间汇总信息

  <img src='./figures/20211204-aec67dd0-2b24-4f75-8d74-9ea4b2a22edd.png'>

  <img src='./figures/20211204-cf9d6243-d31c-4e37-aa26-953e2822e0c1.png'>

- **统计信息**

  <img src='./figures/20211204-c8674984-9927-4b9d-bdde-fb9725ea88ee.png'>

- **query 信息**

  <img src='./figures/20211204-41c59db9-f61d-4dae-b29d-7036223ba567.png'>

- **数据库对象**

  <img src='./figures/20211204-25c40a97-f135-48be-af18-f1fe9986db5b.png'>

## **json 文件下载地址**<a name="section140718333201"></a>

[exporter 监控单数据库实例](https://www.modb.pro/download/272899)

[exporter 监控多数据库实例](https://www.modb.pro/download/293587)
