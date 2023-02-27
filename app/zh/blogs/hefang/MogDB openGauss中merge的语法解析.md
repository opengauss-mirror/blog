---
title: 'MogDB/openGauss中merge的语法解析'

date: '2022-04-11'

category: 'blog'
tags: ['MogDB/openGauss中merge的语法解析']

archives: '2022-04'

author: '何放'

summary: 'MogDB/openGauss中merge的语法解析'

img: '/zh/blogs/hefang/title/img6.png'

times: '10:20'
---

# MogDB/openGauss 中 merge 的语法解析

近期了解学习了 MogDB/openGauss 中 merge 的使用，merge 语法是根据源表对目标表进行匹配查询，匹配成功时更新，不成功时插入。简单来说就是有则更新，无则插入，语句简洁，效率高。

下面展示 MogDB/openGauss 中 merge 的语法

```
openGauss=# \h merge
Command:     MERGE
Description: insert, update, or delete rows of a table based upon source data
Syntax:
MERGE [/*+ plan_hint */] INTO table_name [ [ AS ] alias ]
USING { { table_name | view_name } | subquery } [ [ AS ] alias ]
ON ( condition )
[
  WHEN MATCHED THEN
  UPDATE SET { column_name = { expression | DEFAULT } |
          ( column_name [, ...] ) = ( { expression | DEFAULT } [, ...] ) } [, ...]
  [ WHERE condition ]
]
[
  WHEN NOT MATCHED THEN
  INSERT { DEFAULT VALUES |
  [ ( column_name [, ...] ) ] VALUES ( { expression | DEFAULT } [, ...] ) [, ...] [ WHERE condition ] }
];
```

### 创建测试表

merge 有几种匹配条件可以交叉选择。
作用: 判断源表和目标表是否满足合并的条件
如果满足

1. 用源表去更新目标表
2. 用源表去删除目标表
3. 什么也不干

如果不满足

1. 用源表去插入目标表
2. 什么也不干

创建出满足的表

```
create table a_merge (
    id   int not null,
    name varchar not null,
    year int
);

create table b_merge (
    id   int not null,
    aid  int not null,
    name varchar not null,
    year int,
    city varchar
);

create table c_merge (
    id   int not null,
    name varchar not null,
    city varchar not null
);
```

#### 测试一：匹配则修改，无则插入

```
--插入数据
insert into a_merge values(1,'liuwei',20);
insert into a_merge values(2,'zhangbin',21);
insert into a_merge values(3,'fuguo',20);

insert into b_merge values(1,2,'zhangbin',30,'吉林');
insert into b_merge values(2,4,'yihe',33,'黑龙江');
insert into b_merge (id,aid,name,city) values(3,3,'fuguo','山东');
--数据对比
select * from a_merge; select * from b_merge;
 id |   name   | year
----+----------+------
  1 | liuwei   |   20
  2 | zhangbin |   21
  3 | fuguo    |   20
(3 rows)

 id | aid |   name   | year |  city
----+-----+----------+------+--------
  1 |   2 | zhangbin |   30 | 吉林
  2 |   4 | yihe     |   33 | 黑龙江
  3 |   3 | fuguo    |      | 山东
(3 rows)
--merge语句
merge into a_merge a
using (select b.aid,b.name,b.year from b_merge b) c on (a.id=c.aid)
when matched then
  update set year=c.year
when not matched then
  insert values(c.aid,c.name,c.year);
--更新后的a_merge表
select * from a_merge;
 id |   name   | year
----+----------+------
  1 | liuwei   |   20
  2 | zhangbin |   30
  3 | fuguo    |
  4 | yihe     |   33
(4 rows)
```

#### 测试二：匹配则修改，无则不操作

```
--插入数据
insert into b_merge values(4,1,'liuwei',80,'江西');
insert into b_merge values(5,5,'tiantian',23,'河南');
--核对数据
select * from a_merge;select * from b_merge;
 id |   name   | year
----+----------+------
  1 | liuwei   |   20
  2 | zhangbin |   30
  3 | fuguo    |
  4 | yihe     |   33
(4 rows)

 id | aid |   name   | year |  city
----+-----+----------+------+--------
  1 |   2 | zhangbin |   30 | 吉林
  2 |   4 | yihe     |   33 | 黑龙江
  3 |   3 | fuguo    |      | 山东
  4 |   1 | liuwei   |   80 | 江西
  5 |   5 | tiantian |   23 | 河南
(5 rows)
--merge语句
merge into a_merge a
using (select b.aid,b.name,b.year from b_merge b) c on (a.id=c.aid)
when matched then
  update set year=c.year;
--数据对比
select * from a_merge;
 id |   name   | year
----+----------+------
  1 | liuwei   |   80
  2 | zhangbin |   30
  3 | fuguo    |
  4 | yihe     |   33
(4 rows)
```

#### 测试三：匹配无操作，不匹配进行 insert

```
--修改测试数据
update b_merge set year=70 where aid=2;
--两表对比
select * from a_merge;select * from b_merge;
 id |   name   | year
----+----------+------
  1 | liuwei   |   80
  2 | zhangbin |   30
  3 | fuguo    |
  4 | yihe     |   33
(4 rows)

 id | aid |   name   | year |  city
----+-----+----------+------+--------
  2 |   4 | yihe     |   33 | 黑龙江
  3 |   3 | fuguo    |      | 山东
  4 |   1 | liuwei   |   80 | 江西
  5 |   5 | tiantian |   23 | 河南
  1 |   2 | zhangbin |   70 | 吉林
(5 rows)
--merge语句
merge into a_merge a
using (select b.aid,b.name,b.year from b_merge b) c on (a.id=c.aid)
when not matched then
  insert values(c.aid,c.name,c.year);
--查看a_merge表
select * from a_merge;
 id |   name   | year
----+----------+------
  1 | liuwei   |   80
  2 | zhangbin |   30
  3 | fuguo    |
  4 | yihe     |   33
  5 | tiantian |   23
(5 rows)
```

#### 测试四：一律 insert

```
--merge语句
merge into c_merge c
using (select b.aid,b.name,b.city from b_merge b) b on (1=0)
when not matched then
    insert values(b.aid,b.name,b.city);
--查看两表，条数相同
select * from c_merge ;select * from b_merge ;
 id |   name   |  city
----+----------+--------
  3 | fuguo    | 山东
  5 | tiantian | 河南
  2 | zhangbin | 吉林
  4 | yihe++   | 黑龙江
  1 | liuwei++ | 江西
  6 | ningqin  | 江西
  7 | bing     | 吉安
(7 rows)

 id | aid |   name   | year |  city
----+-----+----------+------+--------
  3 |   3 | fuguo    |      | 山东
  5 |   5 | tiantian |   23 | 河南
  1 |   2 | zhangbin |   70 | 吉林
  2 |   4 | yihe++   |   33 | 黑龙江
  4 |   1 | liuwei++ |   80 | 江西
  6 |   6 | ningqin  |   23 | 江西
  7 |   7 | bing     |   24 | 吉安
(7 rows)
```
