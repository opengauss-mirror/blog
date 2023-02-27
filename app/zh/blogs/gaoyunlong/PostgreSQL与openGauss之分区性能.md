---
title: 'PostgreSQL与openGauss之分区性能'

date: '2021-03-08'

category: 'blog'
tags: ['openGauss与PostgreSQL对比']

archives: '2021-03'

author: '高云龙'

summary: 'PostgreSQL与openGauss之分区性能'

img: '/zh/blogs/gaoyunlong/title/img25.png'

times: '10:40'
---

# PostgreSQL 与 openGauss 之分区性能<a name="ZH-CN_TOPIC_0000001116438645"></a>

## 概述<a name="section696395820455"></a>

PostgreSQL 与 openGauss 分区表定义差异，请参考https://www.modb.pro/db/41393。

openGauss1.1.0 开始支持 hash/list 分区，hash 分区表最多支持 64 个分区，否则会报：

```
ERROR: Un-support feature
DETAIL: The partition’s length should be less than 65.
```

本次对 PostgreSQL 和 openGauss 64 个子分区表的常规操作对比。

服务器配置：虚拟机 8G4C50G

数据库版本：PostgreSQL13.1、openGauss1.1.0

## 添加分区表<a name="section7153339144613"></a>

PostgreSQL 数据库：

```
--创建父表
CREATE TABLE partition_table(
 id          int,
 col1        character varying(16),
 create_time timestamptz
) PARTITION BY HASH(id);

--添加分区
SELECT 'CREATE TABLE partition_table_' || n || ' PARTITION of partition_table FOR VALUES WITH (MODULUS 64, REMAINDER  ' || n || ');' FROM generate_series(0,63) as n ;\gexec

--初始化数据
INSERT INTO partition_table(id,col1,create_time) SELECT round(100000000*random()), n || '_col1',now() FROM generate_series(1,10000000) n;

--添加索引
CREATE INDEX ON partition_table USING BTREE(id);
CREATE INDEX ON partition_table USING BTREE(col1);
```

openGauss 数据库：

```
--创建分区表
create table partition_table(
	id int,
	col1 varchar(16),
	create_time timestamptz default now())
partition by hash(id)
(partition part_hash_1,
partition part_hash_2,
partition part_hash_3,
partition part_hash_4,
partition part_hash_5,
partition part_hash_6,
partition part_hash_7,
partition part_hash_8,
partition part_hash_9,
partition part_hash_10,
partition part_hash_11,
partition part_hash_12,
partition part_hash_13,
partition part_hash_14,
partition part_hash_15,
partition part_hash_16,
partition part_hash_17,
partition part_hash_18,
partition part_hash_19,
partition part_hash_20,
partition part_hash_21,
partition part_hash_22,
partition part_hash_23,
partition part_hash_24,
partition part_hash_25,
partition part_hash_26,
partition part_hash_27,
partition part_hash_28,
partition part_hash_29,
partition part_hash_30,
partition part_hash_31,
partition part_hash_32,
partition part_hash_33,
partition part_hash_34,
partition part_hash_35,
partition part_hash_36,
partition part_hash_37,
partition part_hash_38,
partition part_hash_39,
partition part_hash_40,
partition part_hash_41,
partition part_hash_42,
partition part_hash_43,
partition part_hash_44,
partition part_hash_45,
partition part_hash_46,
partition part_hash_47,
partition part_hash_48,
partition part_hash_49,
partition part_hash_50,
partition part_hash_51,
partition part_hash_52,
partition part_hash_53,
partition part_hash_54,
partition part_hash_55,
partition part_hash_56,
partition part_hash_57,
partition part_hash_58,
partition part_hash_59,
partition part_hash_60,
partition part_hash_61,
partition part_hash_62,
partition part_hash_63,
partition part_hash_64);

--初始化数据
INSERT INTO partition_table(id,col1,create_time) SELECT round(100000000*random()), n || '_col1',now() FROM generate_series(1,10000000) n;

--添加全局索引
CREATE INDEX ON partition_table USING BTREE(id);
CREATE INDEX ON partition_table USING BTREE(col1);

--添加本地索引
CREATE INDEX ON partition_table USING BTREE(id) local;
CREATE INDEX ON partition_table USING BTREE(col1) local;
```

## 测试方法<a name="section159331916194915"></a>

采用 pgbench 压测工具，自定义压测脚本的方式来对比。

```
cat bench.sql
\set idpp random(1,100000)
--insert into partition_table values(:idpp,:idpp||'_col1',now());
--update partition_table set create_time=now() where id=:idpp;
--update partition_table set create_time=now() where col1=:idpp||'_col1';
--select * from partition_table where id=:idpp;
--select * from partition_table where col1=:idpp||'_col1';

pgbench -p 5432 -j 30 -c 30 -M prepared -T 30 -n yunlong -f bench.sql
```

## 结果对比<a name="section181821732185013"></a>

<a name="table156682410513"></a>

<table><thead ><tr id="row19671724145118"><th class="cellrowborder"  width="16.666666666666664%" id="mcps1.1.7.1.1">&nbsp;&nbsp;</th>
<th class="cellrowborder"  width="16.666666666666664%" id="mcps1.1.7.1.2"><p id="p1967172417518"><a name="p1967172417518"></a><a name="p1967172417518"></a>分区键查询</p>
</th>
<th class="cellrowborder"  width="16.666666666666664%" id="mcps1.1.7.1.3"><p id="p1367824105113"><a name="p1367824105113"></a><a name="p1367824105113"></a>非分区键查询</p>
</th>
<th class="cellrowborder"  width="16.666666666666664%" id="mcps1.1.7.1.4"><p id="p8671224155120"><a name="p8671224155120"></a><a name="p8671224155120"></a>分区键更新</p>
</th>
<th class="cellrowborder"  width="16.666666666666664%" id="mcps1.1.7.1.5"><p id="p46712247515"><a name="p46712247515"></a><a name="p46712247515"></a>非分区键更新</p>
</th>
<th class="cellrowborder"  width="16.666666666666664%" id="mcps1.1.7.1.6"><p id="p36792445111"><a name="p36792445111"></a><a name="p36792445111"></a>插入</p>
</th>
</tr>
</thead>
<tbody><tr id="row1267202412510"><td class="cellrowborder"  width="16.666666666666664%" headers="mcps1.1.7.1.1 "><p id="p184641141205114"><a name="p184641141205114"></a><a name="p184641141205114"></a>PostgreSQL</p>
</td>
<td class="cellrowborder"  width="16.666666666666664%" headers="mcps1.1.7.1.2 "><p id="p2464114115113"><a name="p2464114115113"></a><a name="p2464114115113"></a>0.594 ms</p>
</td>
<td class="cellrowborder"  width="16.666666666666664%" headers="mcps1.1.7.1.3 "><p id="p246434145111"><a name="p246434145111"></a><a name="p246434145111"></a>7.978 ms</p>
</td>
<td class="cellrowborder"  width="16.666666666666664%" headers="mcps1.1.7.1.4 "><p id="p174641241105115"><a name="p174641241105115"></a><a name="p174641241105115"></a>1.612 ms</p>
</td>
<td class="cellrowborder"  width="16.666666666666664%" headers="mcps1.1.7.1.5 "><p id="p174646412512"><a name="p174646412512"></a><a name="p174646412512"></a>17.413 ms</p>
</td>
<td class="cellrowborder"  width="16.666666666666664%" headers="mcps1.1.7.1.6 "><p id="p34641141125118"><a name="p34641141125118"></a><a name="p34641141125118"></a>17.2ms</p>
</td>
</tr>
<tr id="row36872495120"><td class="cellrowborder"  width="16.666666666666664%" headers="mcps1.1.7.1.1 "><p id="p17464134185112"><a name="p17464134185112"></a><a name="p17464134185112"></a>openGauss（全局索引）</p>
</td>
<td class="cellrowborder"  width="16.666666666666664%" headers="mcps1.1.7.1.2 "><p id="p5465641145113"><a name="p5465641145113"></a><a name="p5465641145113"></a>0.612 ms</p>
</td>
<td class="cellrowborder"  width="16.666666666666664%" headers="mcps1.1.7.1.3 "><p id="p1546514119518"><a name="p1546514119518"></a><a name="p1546514119518"></a>0.758 ms</p>
</td>
<td class="cellrowborder"  width="16.666666666666664%" headers="mcps1.1.7.1.4 "><p id="p16465041175111"><a name="p16465041175111"></a><a name="p16465041175111"></a>10.450 ms</p>
</td>
<td class="cellrowborder"  width="16.666666666666664%" headers="mcps1.1.7.1.5 "><p id="p11465204155115"><a name="p11465204155115"></a><a name="p11465204155115"></a>88.151 ms</p>
</td>
<td class="cellrowborder"  width="16.666666666666664%" headers="mcps1.1.7.1.6 "><p id="p134652410514"><a name="p134652410514"></a><a name="p134652410514"></a>78.082 ms</p>
</td>
</tr>
<tr id="row106815240517"><td class="cellrowborder"  width="16.666666666666664%" headers="mcps1.1.7.1.1 "><p id="p14465184165110"><a name="p14465184165110"></a><a name="p14465184165110"></a>openGauss（本地索引）</p>
</td>
<td class="cellrowborder"  width="16.666666666666664%" headers="mcps1.1.7.1.2 "><p id="p16465541195110"><a name="p16465541195110"></a><a name="p16465541195110"></a>5.635 ms</p>
</td>
<td class="cellrowborder"  width="16.666666666666664%" headers="mcps1.1.7.1.3 "><p id="p3465114155112"><a name="p3465114155112"></a><a name="p3465114155112"></a>6.765 ms</p>
</td>
<td class="cellrowborder"  width="16.666666666666664%" headers="mcps1.1.7.1.4 "><p id="p1246519416510"><a name="p1246519416510"></a><a name="p1246519416510"></a>15.187 ms</p>
</td>
<td class="cellrowborder"  width="16.666666666666664%" headers="mcps1.1.7.1.5 "><p id="p246634135112"><a name="p246634135112"></a><a name="p246634135112"></a>94.614 ms</p>
</td>
<td class="cellrowborder"  width="16.666666666666664%" headers="mcps1.1.7.1.6 "><p id="p2466154125118"><a name="p2466154125118"></a><a name="p2466154125118"></a>84.927 ms</p>
</td>
</tr>
</tbody>
</table>

结果对比发现，

1、Postgresql13.1 版本在分区方面总来看优越于 openGauss1.1.0。

2、opengauss 全局索引会比本地索引性能更好，但全局索引维护成本高。

3、非分区键查询，带全局索引的 opengauss 查询性能最快。

此测试受限于服务器环境，数据仅做参考比对。
