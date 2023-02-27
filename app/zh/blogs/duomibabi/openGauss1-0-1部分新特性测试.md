---
title: 'openGauss1.0.1部分新特性测试'

date: '2020-11-25'

category: 'blog'
tags: ['openGauss功能测试']

archives: '2020-11'

author: '多米爸比'

summary: 'openGauss1.0.1部分新特性测试'

img: '/zh/blogs/duomibabi/title/img31.png'

times: '11:30'
---

# openGauss1.0.1 部分新特性测试<a name="ZH-CN_TOPIC_0293240558"></a>

## 支持全局临时表<a name="section43741428104511"></a>

PostgreSQL 原生不支持全局临时表，需要借助第三方插件。具体使用可参考：[PostgreSQL 全局临时表插件 pgtt 的使用](https://www.modb.pro/db/31555)

opengauss 原生支持全局临时表，下面进行测试。

**全局临时表：数据会话级可见**

```
建表语句，使用ON COMMIT PRESERVE ROWS
CREATE GLOBAL  TEMPORARY TABLE test_gtt_table (
	id integer,
	lbl text
) ON COMMIT PRESERVE ROWS;

当前会话插入数据并查询
omm=# insert into test_gtt_table values(1,'data1');
INSERT 0 1
omm=# insert into test_gtt_table values(2,'data2');
INSERT 0 1
omm=# select * from test_gtt_table ;
 id |  lbl
----+-------
  1 | data1
  2 | data2
(2 rows)

退出会话再查看
omm=# \dt test_gtt_table
                                           List of relations
 Schema |      Name      | Type  | Owner |                           Storage
--------+----------------+-------+-------+--------------------------------------------------------------
 public | test_gtt_table | table | omm   | {orientation=row,compression=no,on_commit_delete_rows=false}
(1 row)

omm=# select * from test_gtt_table ;
 id | lbl
----+-----
(0 rows)
```

数据会话级可见，其他会话看不到数据，但表结构可见。

**全局临时表：数据事务级可见**

```
omm=# drop table test_gtt_table;
DROP TABLE

建表语句，使用ON COMMIT DELETE ROWS
CREATE GLOBAL  TEMPORARY TABLE test_gtt_table (
	id integer,
	lbl text
) ON COMMIT DELETE ROWS;

mm=# begin;
BEGIN
omm=# insert into test_gtt_table values(1,'data1');
INSERT 0 1
omm=#  select * from test_gtt_table ;
 id |  lbl
----+-------
  1 | data1
(1 row)

omm=# commit;
COMMIT
omm=# select * from test_gtt_table ;
 id | lbl
----+-----
(0 rows)
```

数据事务级可见，事务提交后数据删除。

## 支持 xml 和 json 类型<a name="section11621164975110"></a>

**测试例子**

```
create table test_xml(j json,x xml);

insert into test_xml(j,x) values('{"key":"opengauss1.0.0"}','<value>one</value>');

insert into test_xml(j,x) values('{"key":"opengauss1.0.1"}','<value>two</value>');

select * from test_xml;

输出结果
            j             |         x
--------------------------+--------------------
 {"key":"opengauss1.0.0"} | <value>one</value>
 {"key":"opengauss1.0.1"} | <value>two</value>
(2 rows)
```

使用 xml 数据类型时需要编译 openGauss-server 时打开–with-libxml 选项，否则使用时会报错：

```
omm=# insert into test_xml(j,x) values('{"key":"opengauss1.0.0"}','<value>one</value>');
ERROR:  unsupported XML feature
LINE 1: ...o test_xml(j,x) values('{"key":"opengauss1.0.0"}','<value>on...
                                                             ^
DETAIL:  This functionality requires the server to be built with libxml support.
CONTEXT:  referenced column: x
```

## 支持聚合函数 median<a name="section7328112712127"></a>

**opengauss 使用例子**

```
WITH t(value) AS (
  SELECT 1   FROM DUAL UNION ALL
  SELECT 2   FROM DUAL UNION ALL
  SELECT 100 FROM DUAL
)
SELECT
  avg(value),
  median(value)
FROM
  t;

输出结果
         avg         | median
---------------------+--------
 34.3333333333333333 |      2
```

**postgresql 等效使用**

```
WITH t(value) AS (
  SELECT 1   UNION ALL
  SELECT 2   UNION ALL
  SELECT 100
)
SELECT
  avg(value),
  percentile_cont(0.5) WITHIN GROUP (ORDER BY value)
FROM
  t;

输出结果
         avg         | percentile_cont
---------------------+-----------------
 34.3333333333333333 |               2
(1 row)
```

## 支持物化视图<a name="section1984804019143"></a>

物化视图使用场景：报表统计、大表统计等，定期固化数据快照， 避免对多表重复跑相同的查询。

物化视图使用注意事项：

- 不可以在临时表或全局临时表上创建。
- 当基表数据发生变化时，需要使用刷新命令保持物化视图与基表同步。

**物化视图例子**

准备基表及创建物化视图统计总记录数。

```
create table big_tab (id int, info varchar);

insert into big_tab select t,clock_timestamp() from generate_series(1,100000) as t;

create MATERIALIZED VIEW mv_big_tab_count as select count(1) as num from big_tab;
```

查询对比。

```
omm=# \timing
Timing is on.
omm=# select count(1) from big_tab;
 count
--------
 100000
(1 row)

Time: 18.140 ms
omm=# select num from  mv_big_tab_count ;
  num
--------
 100000
(1 row)

Time: 0.565 ms
```

性能有 30 倍的提高。

数据变化时刷新。

```
insert into big_tab select t,clock_timestamp() from generate_series(100000,150000) as t;

REFRESH MATERIALIZED VIEW mv_big_tab_count ;
```

PostgreSQL 9.4+ 支持并发更新，opengauss 还不支持。

```
omm=# REFRESH MATERIALIZED VIEW CONCURRENTLY mv_big_tab_count;
ERROR:  syntax error at or near "CONCURRENTLY"
LINE 1: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_big_tab_count ;
                                  ^
Time: 0.322 ms
```

再次查看统计数据。

```
omm=# select num from  mv_big_tab_count ;
  num
--------
 150001
(1 row)

Time: 0.550 ms
```

## 支持 UPSERT（INSERT or UPDATE）<a name="section13644104611187"></a>

upsert 语法使用上与 PostgreSQL 有一点差异。

**PostgreSQL 例子**

```
create table test_upsert (id int primary key, info varchar);

postgres=# insert into test_upsert  (id,info)
postgres-# values (1,'aaa');
INSERT 0 1

下面插入主键重复的数据
postgres=# insert into test_upsert  (id,info)
postgres-# values (1,'bbb');
ERROR:  duplicate key value violates unique constraint "test_upsert_pkey"
DETAIL:  Key (id)=(1) already exists.

不使用upsert语法，会报错返回给客户端，不太友好

postgres=# insert into test_upsert  (id,info)
postgres-# values (1,'bbb')
postgres-# on conflict(id) do update set info=excluded.info;
INSERT 0 1
postgres=# select * from test_upsert;
 id | info
----+------
  1 | bbb
(1 row)

使用upsert语法，有冲突时可选择do nothing跳过或者do update覆盖更新
```

**opengauss 例子**

```
omm=# create table test_upsert (id int primary key, info varchar);
NOTICE:  CREATE TABLE / PRIMARY KEY will create implicit index "test_upsert_pkey" for table "test_upsert"
CREATE TABLE
omm=# insert into test_upsert  (id,info)
values (1,'aaa');omm-#
INSERT 0 1
omm=# insert into test_upsert  (id,info)
values (1,'bbb');
ERROR:  duplicate key value violates unique constraint "test_upsert_pkey"
DETAIL:  Key (id)=(1) already exists.

omm=# insert into test_upsert  (id,info)
values (1,'bbb')
 ON DUPLICATE KEY  update  info=excluded.info;
INSERT 0 1
omm=# select * from test_upsert;
 id | info
----+------
  1 | bbb
(1 row)
```

opengauss 语法比 postgresql 更简洁一些。

## 支持外键引用<a name="section523355502013"></a>

opengauss1.0.1 之前使用外键功能会提示下面的错误：

```
ERROR:  FOREIGN KEY ... REFERENCES constraint is not yet supported.
```

下面测试外键引用

```
产品表
CREATE TABLE products (
    product_no integer PRIMARY KEY,
    name text,
    price numeric
);

产品订单表,我们希望保证订单表中只包含真正存在的产品订单。因此我们在订单表中定义一个引用产品表的外键约束：
CREATE TABLE orders (
    order_id integer PRIMARY KEY,
    product_no integer REFERENCES products (product_no),
    quantity integer
);

创建产品编号为1001的产品
omm=# insert into products values(1001,'opengauss',0);
INSERT 0 1

创建订单产品编号为1001的订单，可成功创建
omm=# insert into orders values(2001,1001,100);
INSERT 0 1

创建订单产品编号为1002的订单，由于产品表没有产品编号为1002的产品，同时订单表有外键约束检查，因此该订单将创建失败
omm=# insert into orders values(2002,1002,100);
ERROR:  insert or update on table "orders" violates foreign key constraint "orders_product_no_fkey"
DETAIL:  Key (product_no)=(1002) is not present in table "products".
```
