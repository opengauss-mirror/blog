---
title: 'openGauss中的sequence跟Oracle的sequence有什么区别？'

date: '2022-04-06'

category: 'blog'
tags: ['openGauss中的sequence跟Oracle的sequence有什么区别？']

archives: '2022-04'

author: '李真旭'

summary: 'openGauss中的sequence跟Oracle的sequence有什么区别？'

img: '/zh/blogs/lizhenxu/title/img.png'

times: '10:30'
---

# openGauss 中的 sequence 跟 Oracle 的 sequence 有什么区别？

openGauss 中也提供了 sequence 序列功能，使用 Oracle 的用户应该都非常喜欢使用这个功能。所以如果从 Oracle 迁移到 openGauss，那么这项功能可以完全替代了。

接下来我们简单测试一下：

```
enmotech=> drop table test;
DROP TABLE
enmotech=> create table test(id serial,name varchar(20));
NOTICE: CREATE TABLE will create implicit sequence "test_id_seq" for serial column "test.id"
CREATE TABLE
enmotech=> \d+ test
Table "public.test"
Column | Type | Modifiers | Storage | Stats target | Description
--------+-----------------------+---------------------------------------------------+----------+--------------+-------------
id | integer | not null default nextval('test_id_seq'::regclass) | plain | |
name | character varying(20) | | extended | |
Has OIDs: no
Options: orientation=row, compression=no

enmotech=> insert into test values (nextval('test_id_seq'),'enmotech');
INSERT 0 1
enmotech=> insert into test values (nextval('test_id_seq'),'killdb.com');
INSERT 0 1
enmotech=> insert into test values (nextval('test_id_seq'),'www.killdb.com');
INSERT 0 1
enmotech=> select * from test;
id | name
----+----------------
2 | enmotech
3 | killdb.com
4 | www.killdb.com
(3 rows)
```

同时我们也可以单独创建序列，然后指定给某个表所使用，如下是 create sequence 的语法：

```
CREATE SEQUENCE name [ INCREMENT [ BY ] increment ]
[ MINVALUE minvalue | NO MINVALUE | NOMINVALUE ] [ MAXVALUE maxvalue | NO MAXVALUE | NOMAXVALUE]
[ START [ WITH ] start ] [ CACHE cache ] [ [ NO ] CYCLE | NOCYCLE ]
[ OWNED BY { table_name.column_name | NONE } ];
```

接下来我们单独创建使用 sequence 试试：

```
enmotech=> create sequence kill_seq cache 1000;
CREATE SEQUENCE
enmotech=>
enmotech=> drop table test;
DROP TABLE
enmotech=> create table test(id int not null default nextval('kill_seq'),name varchar(200));
CREATE TABLE
enmotech=>
enmotech=> \d+ test
                                                   Table "public.test"
 Column |          Type          |                   Modifiers                    | Storage  | Stats target | Description
--------+------------------------+------------------------------------------------+----------+--------------+-------------
 id     | integer                | not null default nextval('kill_seq'::regclass) | plain    |              |
 name   | character varying(200) |                                                | extended |              |
Has OIDs: no
Options: orientation=row, compression=no

enmotech=> alter sequence kill_seq increment by 10 NOCYCLE;
ERROR:  ALTER SEQUENCE is not yet supported.
enmotech=>
enmotech=> \d+ kill_seq
               Sequence "public.kill_seq"
    Column     |  Type   |        Value        | Storage
---------------+---------+---------------------+---------
 sequence_name | name    | kill_seq            | plain
 last_value    | bigint  | 1000                | plain
 start_value   | bigint  | 1                   | plain
 increment_by  | bigint  | 1                   | plain
 max_value     | bigint  | 9223372036854775807 | plain
 min_value     | bigint  | 1                   | plain
 cache_value   | bigint  | 1000                | plain
 log_cnt       | bigint  | 32                  | plain
 is_cycled     | boolean | f                   | plain
 is_called     | boolean | t                   | plain
 uuid          | bigint  | 0                   | plain

enmotech=>   alter sequence kill_seq nomaxvalue;
ALTER SEQUENCE                         ^
enmotech=> alter sequence kill_seq cache 10000;
ERROR:  ALTER SEQUENCE is not yet supported.
enmotech=> alter sequence kill_seq start 888;
ERROR:  ALTER SEQUENCE is not yet supported.
enmotech=> \d+ kill_seq
               Sequence "public.kill_seq"
    Column     |  Type   |        Value        | Storage
---------------+---------+---------------------+---------
 sequence_name | name    | kill_seq            | plain
 last_value    | bigint  | 1000                | plain
 start_value   | bigint  | 1                   | plain
 increment_by  | bigint  | 1                   | plain
 max_value     | bigint  | 9223372036854775807 | plain
 min_value     | bigint  | 1                   | plain
 cache_value   | bigint  | 1000                | plain
 log_cnt       | bigint  | 0                   | plain
 is_cycled     | boolean | f                   | plain
 is_called     | boolean | t                   | plain
 uuid          | bigint  | 0                   | plain
```

尽管 sequence 的属性跟 Oracle 类似，但是我们可以看到，目前 openGauss 暂时还不支持 alter sequence 的方式去修改序列增长步长或其他属性。只能修改 owner 属主。
查了一下官方文档，发现 alter sequence 只支持如下的语法操作：

```
ALTER SEQUENCE [ IF EXISTS ] name
[MAXVALUE maxvalue | NO MAXVALUE | NOMAXVALUE]
[ OWNED BY { table_name.column_name | NONE } ] ;
```

需要注意的是，openGauss 中的 sequence 跟 Oracle 中的序列不一样的是，Oracle 由于集群的原因，序列还存在一个 order 或 noorder 选项。但在 openGauss 中 sequence 是不存在这个属性的。
