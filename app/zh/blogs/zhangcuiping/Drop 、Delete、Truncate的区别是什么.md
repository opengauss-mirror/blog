---
title: 'Drop 、Delete、Truncate的区别是什么'

date: '2022-09-16'

category: 'blog'
tags: ['数据库入门']

archives: '2022-09'

author: '张翠娉'

summary: 'Drop 、Delete、Truncate的区别是什么'

img: '/zh/blogs/zhangcuiping/title/img.png'

times: '15:20'
---

# Drop 、Delete、Truncate 的区别是什么？

- DROP 删除表结构和数据，truncate 和 delete 只删除数据
- truncate 操作，表和索引所占用的空间会恢复到初始大小；delete 操作不会减小表或索引所占用的空间；drop 操作释放表或索引的占用空间。
- truncate 和 drop 是 DDL，操作立即生效，delete 是 DML，手动提交操作才生效。delete 操作可以结合 where 条件，并且删除操作会被记录到日志，后续可以回滚恢复。
- 一般速度上来说，drop>truncate>delete
- truncate 只能对 table，delete 可以是 table 和 view

**示例**

```
MogDB=# select * from test_city;
id |   city
----+-----------
  1 | 上海
  2 | 北京
  3 | 广州
  4 | 猋
  5 | 巭
  6 | 孬
  7 | 舙
  8 | 畾
  9 | 皛
 10 | 龘
 11 | 孨
 12 | 毳
 13 | 雥
 14 | 飍
 15 | 飝
(15 rows)
MogDB=# Delete from test_city where city = '上海';
DELETE 1
MogDB=# select * from test_city;
 id |   city
----+-----------
  2 | 北京
  3 | 广州
  4 | 猋
  5 | 巭
  6 | 孬
  7 | 舙
  8 | 畾
  9 | 皛
 10 | 龘
 11 | 孨
 12 | 毳
 13 | 雥
 14 | 飍
 15 | 飝
(14 rows)
MogDB=# TRUNCATE test_city;
TRUNCATE TABLE
MogDB=# select * from test_city;
 id | city
----+------
(0 rows)

MogDB=# drop table test_city;
DROP TABLE
```
