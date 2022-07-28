+++

title = "MogDB 分析表" 

date = "2022-07-28" 

tags = ["MogDB"] 

archives = "2022-07" 

author = "云和恩墨" 

summary = "MogDB 分析表"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"

+++

# MogDB 分析表

本文出处：[https://www.modb.pro/db/443142](https://www.modb.pro/db/443142)

执行计划生成器需要使用表的统计信息，以生成最有效的查询执行计划，提高查询性能。因此数据导入完成后，建议执行ANALYZE语句生成最新的表统计信息。统计结果存储在系统表PG_STATISTIC中。

## 分析表

ANALYZE支持的表类型有行/列存表。ANALYZE同时也支持对本地表的指定列进行信息统计。下面以表的ANALYZE为例，更多关于ANALYZE的信息，请参见[ANALYZE | ANALYSE](https://docs.mogdb.io/zh/mogdb/v3.0/ANALYZE-ANALYSE)。

更新表统计信息。

以表product_info为例，ANALYZE命令如下:

```sql
ANALYZE product_info; 
ANALYZE
```

## 表自动分析

MogDB提供了GUC参数autovacuum用于控制数据库自动清理功能的启动。autovacuum设置为on时，系统定时启动autovacuum线程来进行表自动分析，如果表中数据量发生较大变化达到阈值时，会触发表自动分析，即autoanalyze。对于空表而言，当表中插入数据的行数大于50时，会触发表自动进行ANALYZE。对于表中已有数据的情况，阈值设定为50+10%*reltuples，其中reltuples是表的总行数。autovacuum自动清理功能的生效还依赖于下面两个GUC参数:track_counts 参数需要设置为on，表示开启收集收据库统计数据功能。autovacuum_max_workers参数需要大于0，该参数表示能同时运行的自动清理线程的最大数量。须知:autoanalyze只支持默认采样方式，不支持百分比采样方式。多列统计信息仅支持百分比采样，因此autoanalyze不收集多列统计信息。autoanalyze支持行存表和列存表，不支持外表、临时表、unlogged表和toast表。
