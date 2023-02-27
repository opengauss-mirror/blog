---
title: 'openGauss分区使用样例'

date: '2021-04-19'

category: 'blog'
tags: ['openGauss分区']

archives: '2021-04'

author: '高云龙'

summary: 'openGauss分区使用样例'

img: '/zh/blogs/gaoyunlong/title/img24.png'

times: '16:30'
---

# openGauss 分区使用样例<a name="ZH-CN_TOPIC_0000001095502050"></a>

## 概述<a name="section712025675512"></a>

openGauss1.1.0 版本开始，分区方式分为三种，分别是 RANGE、HASH 和 LIST，官方文档中对于分区表的使用样例比较少，这里对各种分区使用方式做一下整理，方便以后快速调整使用。

## 范围分区<a name="section1689421615562"></a>

**VALUES LESS THAN 语法格式**

分区策略的分区键最多支持 4 列

分区键支持的数据类型为：SMALLINT、INTEGER、BIGINT、DECIMAL、NUMERIC、REAL、DOUBLE PRECISION、CHARACTER VARYING\(n\)、VARCHAR\(n\)、CHARACTER\(n\)、CHAR\(n\)、CHARACTER、CHAR、TEXT、NVARCHAR2、NAME、TIMESTAMP\[§\] \[WITHOUT TIME ZONE\]、TIMESTAMP\[§\] \[WITH TIME ZONE\]、DATE。

**数字类型**

```
create table part_range_lessthan_int(
id serial primary key,
col1 varchar(8))
partition by range(id)
(
partition p1 values less than(10),
partition p2 values less than(20),
partition p3 values less than(30),
partition p4 values less than(maxvalue)
);

--唯一索引不需要包含分区字段
create unique index on part_range_lessthan_int(col1);

--测试数据
insert into part_range_lessthan_int values(10,'col1');
insert into part_range_lessthan_int values(21,'tuple2');
insert into part_range_lessthan_int values(91,'tuple3');

--查看数据所属分区
postgres=# select * from part_range_lessthan_int partition(p1);
 id | col1
----+------
(0 rows)

postgres=# select * from part_range_lessthan_int partition(p2);
 id | col1
----+------
 10 | col1
(1 row)

postgres=# select * from part_range_lessthan_int partition(p3);
 id |  col1
----+--------
 21 | tuple2
(1 row)

postgres=# select * from part_range_lessthan_int partition(p4);
 id |  col1
----+--------
 91 | tuple3
(1 row)
```

**字符类型**

```
create table part_range_lessthan_char(
id varchar(8) primary key,
col1 varchar(8))
partition by range(id)
(
partition p1 values less than('eabcd123'),
partition p2 values less than('nabcd123'),
partition p3 values less than('tabcd123'),
partition p4 values less than(maxvalue)
);

--测试数据
insert into part_range_lessthan_char values('12345678','col1');
insert into part_range_lessthan_char values('gabc','col1');
insert into part_range_lessthan_char values('z1234567','col1');

--查看数据所属分区
postgres=# select * from part_range_lessthan_char partition(p1);
    id    | col1
----------+------
 12345678 | col1
(1 row)

postgres=# select * from part_range_lessthan_char partition(p2);
  id  | col1
------+------
 gabc | col1
(1 row)

postgres=# select * from part_range_lessthan_char partition(p4);
    id    | col1
----------+------
 z1234567 | col1
(1 row)
```

**时间类型**

```
create table part_range_lessthan_time(
id timestamptz primary key,
col1 varchar(8))
partition by range(id)
(
partition p1 values less than('2021-01-01'),
partition p2 values less than('2021-03-01'),
partition p3 values less than('2021-06-01'),
partition p4 values less than(maxvalue)
);

--测试数据
insert into part_range_lessthan_time values('2020-01-01','tuple1');
insert into part_range_lessthan_time values('2021-02-20 13:14:59.123456','tuple2');
insert into part_range_lessthan_time values(now(),'tuple3');

--查看数据所属分区
postgres=# select * from part_range_lessthan_time partition(p1);
           id           |  col1
------------------------+--------
 2020-01-01 00:00:00+08 | tuple1
(1 row)

postgres=# select * from part_range_lessthan_time partition(p2);
              id               |  col1
-------------------------------+--------
 2021-02-20 13:14:59.123456+08 | tuple2
(1 row)

postgres=# select * from part_range_lessthan_time partition(p3);
              id               |  col1
-------------------------------+--------
 2021-04-01 18:22:17.071359+08 | tuple3
(1 row)
```

**START END 的语法格式**

分区策略的分区键仅支持 1 列

分区键支持的数据类型为：SMALLINT、INTEGER、BIGINT、DECIMAL、NUMERIC、REAL、DOUBLE PRECISION、TIMESTAMP\[§\] \[WITHOUT TIME ZONE\]、TIMESTAMP\[§\] \[WITH TIME ZONE\]、DATE。

**数字类型**

```
create table part_range_startend_int(
id serial primary key,
col1 varchar(8))
partition by range(id)
(
partition p1 start(1) end(50) every(10),
partition p2 end(80),
partition p3 start(80),
partition p4 start(90) end(100)
);
--测试数据
insert into part_range_startend_int values(1,'tuple1');
insert into part_range_startend_int values(11,'tuple2');
insert into part_range_startend_int values(80,'tuple3');
insert into part_range_startend_int values(100,'tuple4');
--查看数据所在分区
postgres=# select relname,parentid from pg_partition where parentid=16555;
         relname         | parentid
-------------------------+----------
 part_range_startend_int |    16555
 p1_0                    |    16555
 p1_1                    |    16555
 p1_2                    |    16555
 p1_3                    |    16555
 p1_4                    |    16555
 p1_5                    |    16555
 p2                      |    16555
 p3                      |    16555
 p4                      |    16555
(10 rows)
```

**日期类型**

与数字类型相似。

## 间隔分区<a name="section20279161817817"></a>

分区策略的分区键仅支持 1 列；

分区键支持数据类型为：TIMESTAMP\[§\] \[WITHOUT TIME ZONE\]、TIMESTAMP\[§\] \[WITH TIME ZONE\]、DATE；

唯一可自动添加分区的方式。

```
create table part_range_interval(
partid int not null,
col2 date not null,
)partition by range(col2)
interval('1 day')
(
partition part1 values less than ('20210331'),
partition part2 values less than ('20210401')
);
```

## 哈希分区<a name="section69681411986"></a>

分区策略的分区键仅支持 1 列；

分区键支持的数据类型为：INT1、INT2、INT4、INT8、NUMERIC、VARCHAR\(n\)、CHAR、BPCHAR、TEXT、NVARCHAR2、TIMESTAMP\[§\] \[WITHOUT TIME ZONE\]、TIMESTAMP\[§\] \[WITH TIME ZONE\]、DATE；

分区个数不能超过 64；

所有数据类型的 HASH 分区方式都一样。

```
create table part_hash(
partid int not null,
col2 varchar(16))
partition by hash(partid)
(partition part_hash_1,
partition part_hash_2,
partition part_hash_3,
partition part_hash_4,
partition part_hash_5,
·
·
·
partition part_hash_60,
partition part_hash_61,
partition part_hash_62,
partition part_hash_63,
partition part_hash_64);
```

## 列表分区<a name="section7821334488"></a>

分区策略的分区键仅支持 1 列；

分区键支持的数据类型为：INT1、INT2、INT4、INT8、NUMERIC、VARCHAR\(n\)、CHAR、BPCHAR、NVARCHAR2、TIMESTAMP\[§\] \[WITHOUT TIME ZONE\]、TIMESTAMP\[§\] \[WITH TIME ZONE\]、DATE；

分区个数不能超过 64 个；

对于从句是 VALUES \(list_values_clause\)的语法格式，list_values_clause 中包含了对应分区存在的键值，推荐每个分区的键值数量不超过 64 个。

```
create table part_list(
partid int not null,
col2 varchar(16))
partition by list(partid)
(partition part_list_1 values(1,2,3),
partition part_list_2 values(4,5,6),
partition part_list_3 values(7,8,9));
```
