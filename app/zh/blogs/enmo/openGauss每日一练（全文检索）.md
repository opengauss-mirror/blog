---
title: 'openGauss每日一练（全文检索）'

date: '2022-04-25'

category: 'blog'
tags: ['openGauss每日一练（全文检索）']

archives: '2022-04'

author: '云和恩墨'

summary: 'openGauss每日一练（全文检索）'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# openGauss 每日一练（全文检索）

本文出处：[https://www.modb.pro/db/224179](https://www.modb.pro/db/224179)

## 学习目标

**学习 openGauss 全文检索**

openGauss 提供了两种数据类型用于支持全文检索。tsvector 类型表示为文本搜索优化的文件格式，tsquery 类型表示文本查询

## 课后作业

### **1.用 tsvector @@ tsquery 和 tsquery @@ tsvector 完成两个基本文本匹配**

```
omm=# SELECT 'a fat cat sat on a mat and ate a fat rat'::tsvector @@ 'cat & rat'::tsquery AS RESULT;
 result
--------
 t
(1 row)

omm=# SELECT 'fat & cow'::tsquery @@ 'a fat cat sat on a mat and ate a fat rat'::tsvector AS RESULT;
 result
--------
 f
(1 row)

omm=#
```

### **2.创建表且至少有两个字段的类型为 text 类型，在创建索引前进行全文检索**

```
omm=# CREATE SCHEMA tsearch;
CREATE TABLE tsearch.pgweb(id int, body text, title text, last_mod_date date);
CREATE SCHEMA
omm=# CREATE TABLE tsearch.pgweb(id int, body text, title text, last_mod_date date);
INSERT INTO tsearch.pgweb VALUES(1, 'China, officially the People''s Republic of China(PRC), located in Asia, is the world''s most populous state.', 'China', '2010-1-1');
CREATE TABLE
omm=# INSERT INTO tsearch.pgweb VALUES(1, 'China, officially the People''s Republic of China(PRC), located in Asia, is the world''s most populous state.', 'China', '2010-1-1');
INSERT INTO tsearch.pgweb VALUES(2, 'America is a rock band, formed in England in 1970 by multi-instrumentalists Dewey Bunnell, Dan Peek, and Gerry Beckley.', 'America', '2010-1-1');
INSERT 0 1
omm=# INSERT INTO tsearch.pgweb VALUES(2, 'America is a rock band, formed in England in 1970 by multi-instrumentalists Dewey Bunnell, Dan Peek, and Gerry Beckley.', 'America', '2010-1-1');
INSERT 0 1
omm=# INSERT INTO tsearch.pgweb VALUES(3, 'England is a country that is part of the United Kingdom. It shares land borders with Scotland to the north and Wales to the west.', 'England','2010-1-1');
INSERT 0 1
omm=#
omm=# SELECT id, body, title FROM tsearch.pgweb WHERE to_tsvector(body) @@ to_tsquery('america');

 id |                                                          body                                                           |  title
----+-------------------------------------------------------------------------------------------------------------------------+---------
  2 | America is a rock band, formed in England in 1970 by multi-instrumentalists Dewey Bunnell, Dan Peek, and Gerry Beckley. | America
(1 row)

omm=#
```

### **3.创建 GIN 索引**

```
omm=# CREATE INDEX pgweb_idx_1 ON tsearch.pgweb USING gin(to_tsvector('english', body));
CREATE INDEX
omm=#
```

### **4.清理数据**

```
omm=# drop schema tsearch;
DROP SCHEMA
omm=#
```
