---
title: 'MogDB 分析表'

date: '2022-07-28'

category: 'blog'
tags: ['MogDB']

archives: '2022-07'

author: '云和恩墨'

summary: 'MogDB 分析表'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# MogDB 分析表

本文出处：[https://www.modb.pro/db/443142](https://www.modb.pro/db/443142)

执行计划生成器需要使用表的统计信息，以生成最有效的查询执行计划，提高查询性能。因此数据导入完成后，建议执行 ANALYZE 语句生成最新的表统计信息。统计结果存储在系统表 PG_STATISTIC 中。

## 分析表

ANALYZE 支持的表类型有行/列存表。ANALYZE 同时也支持对本地表的指定列进行信息统计。下面以表的 ANALYZE 为例，更多关于 ANALYZE 的信息，请参见[ANALYZE | ANALYSE](https://docs.mogdb.io/zh/mogdb/v3.0/ANALYZE-ANALYSE)。

更新表统计信息。

以表 product_info 为例，ANALYZE 命令如下:

```
ANALYZE product_info;
ANALYZE
```

## 表自动分析

MogDB 提供了 GUC 参数 autovacuum 用于控制数据库自动清理功能的启动。autovacuum 设置为 on 时，系统定时启动 autovacuum 线程来进行表自动分析，如果表中数据量发生较大变化达到阈值时，会触发表自动分析，即 autoanalyze。对于空表而言，当表中插入数据的行数大于 50 时，会触发表自动进行 ANALYZE。对于表中已有数据的情况，阈值设定为 50+10%\*reltuples，其中 reltuples 是表的总行数。autovacuum 自动清理功能的生效还依赖于下面两个 GUC 参数:track_counts 参数需要设置为 on，表示开启收集收据库统计数据功能。autovacuum_max_workers 参数需要大于 0，该参数表示能同时运行的自动清理线程的最大数量。须知:autoanalyze 只支持默认采样方式，不支持百分比采样方式。多列统计信息仅支持百分比采样，因此 autoanalyze 不收集多列统计信息。autoanalyze 支持行存表和列存表，不支持外表、临时表、unlogged 表和 toast 表。
