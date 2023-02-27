---
title: '高并发报错too many clients already或无法创建线程'

date: '2022-07-14'

category: 'blog'
tags: ['高并发报错too many clients already或无法创建线程']

archives: '2022-07'

author: '云和恩墨'

summary: '高并发报错too many clients already或无法创建线程'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# MogDB 常见故障解决 重建索引失败

本文出处：[https://www.modb.pro/db/432237](https://www.modb.pro/db/432237)

## 问题现象

当 Desc 表的索引出现损坏时，无法进行一系列操作，可能的报错信息如下。

```
index \"%s\" contains corrupted page at block %u" ,RelationGetRelationName(rel),BufferGetBlockNumber(buf), please reindex it.
```

## 原因分析

在实际操作中，索引会由于软件问题或者硬件问题引起崩溃。例如，当索引分裂完而磁盘空间不足、出现页面损坏等问题时，会导致索引损坏。

## 处理办法

如果此表是以 pg_cudesc_xxxxx_index 进行命名则为列存表，则说明 desc 表的索引表损坏。通过 desc 表的索引表表名，找到对应主表的 oid 和表，执行如下语句重建表的索引。

```
REINDEX INTERNAL TABLE name;
```
