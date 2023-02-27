---
title: 'MogDB/openGauss wal日志解析工具 mog_xlogdump'

date: '2022-05-05'

category: 'blog'
tags: ['MogDB/openGauss wal日志解析工具 mog_xlogdump']

archives: '2022-05'

author: '高云龙'

summary: 'MogDB/openGauss wal日志解析工具 mog_xlogdump'

img: '/zh/blogs/gaoyunlong/title/img24.png'

times: '10:20'
---

# MogDB/openGauss wal 日志解析工具 mog_xlogdump

本文出处：[https://www.modb.pro/db/398124](https://www.modb.pro/db/398124)

## 概述

mog_xlogdump 是云和恩墨独立开发的 wal 日志离线解析工具。熟悉 PG 的小伙伴应该都使用 pg_xlogdump/pg_waldump 查看过 PG 数据库的 wal 文件，解析的 wal 数据结果是没有办法直接拿来使用的；mog_xlogdump 在此基础上可以用于在主备集群场景中，数据库永久性宕机且无法恢复的情况下，反向解析无法启动的数据库，然后在集群中恢复 wal 日志尾部没有同步的数据。

**使用场景：**
数据库故障且无法恢复，但 wal 保存完整。
1、单机情况，知道待恢复表的 oid、字段顺序及字段类型。
2、主备集群，至少有一个备库可用，可以对全部数据对象进行解析。

**前提条件**
1、wal_level=logical
2、对表进行修改: alter table table_name **replica identity** full;

```
REPLICA IDENTITY {DEFAULT | USING INDEX index_name | FULL | NOTHING} 调整逻辑复制时写入WAL日志中的信息量，该选项仅在wal_level配置为logical时才有效。
当原数据表发生更新时，默认的逻辑复制流只包含主键的历史记录，如果需要输出所需字段更新或删除的历史记录，可修改本参数。
- DEFAULT（非系统表的默认值）: 会记录主键字段的旧值。
- USING INDEX : 会记录名为index_name索引包含的字段的旧值，索引的所有列必须NOT NULL。
- FULL : 记录了所有列的旧值。
- NOTHING（系统表默认值）: 不记录旧值的信息。
```

## 下载

MogDB 官网下载页面下载对应版本的工具包，将工具放在**MogDB 安装路径的 bin 目录下**即可。如下图所示，toolkits-xxxxxx.tar.gz 即为包含 mog_xlogdump 的工具包。
<img src='./figures/20220425-e31dceda-8e73-4018-bf8c-73277ed82198.png'>

## 功能测试

### 类似 pg_xlogdump 的基础功能

我们向 astore 表 xlogdump 中插入一条数据，通过 xmin 可以看到这条数据属于事务 952425（ustore 不支持查看 xmin）；
通过 pg_relation_filenode()函数获取到表 xlogdump 的 filenode 是 24791；
通过 pg_current_xlog_location()函数可以看到当前使用的 wal 文件是 000000010000000000000064
<img src='./figures/20220425-49418c23-785a-4cfc-af28-464b9f59c7eb.png'>

我们根据上图获取的信息去对应 wal 查询制定事务，与我们的操作一致。
<img src='./figures/20220425-b3d5bf9f-f5b3-47bb-9261-a294e337fce1.png'>
我们直接去解析 wal 文件，可以看到我们做了哪些操作，但是并不能知道具体操作内容，解析的数据也无法直接使用。

### 解析指定的表

#### 数据写入

```
--查看表结构
mogdb=# \d+ xlogdump
                                                          Table "public.xlogdump"
   Column    |            Type             |                       Modifiers                       | Storage  | Stats target | Description
-------------+-----------------------------+-------------------------------------------------------+----------+--------------+-------------
 id          | integer                     | not null default nextval('xlogdump_id_seq'::regclass) | plain    |              |
 col1        | character varying(8)        |                                                       | extended |              |
 create_time | timestamp without time zone | default now()                                         | plain    |              |
Has OIDs: no
Options: orientation=row, storage_type=astore, compression=no

--查看表数据
mogdb=# select xmin,xmax,* from xlogdump;
  xmin  | xmax | id | col1 |        create_time
--------+------+----+------+----------------------------
 952425 |    0 |  1 | t1   | 2022-04-25 19:54:04.329156
 952880 |    0 |  2 | t2   | 2022-04-25 20:05:28.159008
(2 rows)

--指定事务id查看具体操作数据
[o3m@mogdb01 pg_xlog]$ mog_xlogdump -x 952425 -o 24791 -R int,varchar,timestamp 000000010000000000000064
'insert','tuple':{'(null)':'1','(null)':'t1','(null)':'2022-04-25 19:54:04.329156'}
mog_xlogdump: FATAL:  error in WAL record at 0/649FEA50: invalid record length at 0/649FEA98: wanted 32, got 0

--不指定事务id，查看指定表在当前wal下的所有操作
[o3m@mogdb01 pg_xlog]$ mog_xlogdump -o 24791 -R int,varchar,timestamp 000000010000000000000064
'insert','tuple':{'(null)':'1','(null)':'t1','(null)':'2022-04-25 19:54:04.329156'}
'insert','tuple':{'(null)':'2','(null)':'t2','(null)':'2022-04-25 20:05:28.159008'}
mog_xlogdump: FATAL:  error in WAL record at 0/64A0D980: invalid record length at 0/64A0D9C8: wanted 32, got 0

```

#### 数据更新:未设置 wal_level=logical，未修改 replica identity

```
mogdb=# show wal_level;
  wal_level
-------------
 hot_standby
(1 row)
mogdb=# update xlogdump set col1='tt' where id=2;
UPDATE 1
mogdb=# select xmin,xmax,* from xlogdump;
  xmin  | xmax | id | col1 |        create_time
--------+------+----+------+----------------------------
 952425 |    0 |  1 | t1   | 2022-04-25 19:54:04.329156
 953615 |    0 |  2 | tt   | 2022-04-25 20:05:28.159008
(2 rows)

[o3m@mogdb01 pg_xlog]$ mog_xlogdump -x 953615 -o 24791 -R int,varchar,timestamp 000000010000000000000064
'update',,'new_tuple':{'(null)':'2','(null)':'tt','(null)':'2022-04-25 20:05:28.159008'}
mog_xlogdump: FATAL:  error in WAL record at 0/64A41108: invalid record length at 0/64A41150: wanted 32, got 0

```

#### 数据更新:设置 wal_level=logical，未修改 replica identity

**未添加主键**

```
mogdb=# select xmin,xmax,* from xlogdump;
  xmin  | xmax | id | col1 |        create_time
--------+------+----+------+----------------------------
 952425 |    0 |  1 | t1   | 2022-04-25 19:54:04.329156
 954337 |    0 |  2 | ttt  | 2022-04-25 20:05:28.159008
(2 rows)

[o3m@mogdb01 pg_xlog]$ mog_xlogdump -x 954337 -o 24791 -R int,varchar,timestamp 000000010000000000000064
'update',,'new_tuple':{'(null)':'2','(null)':'ttt','(null)':'2022-04-25 20:05:28.159008'}
mog_xlogdump: FATAL:  error in WAL record at 0/64D2E120: invalid record length at 0/64D2E180: wanted 32, got 0

--添加主键
mogdb=# alter table xlogdump add primary key(id);
NOTICE:  ALTER TABLE / ADD PRIMARY KEY will create implicit index "xlogdump_pkey" for table "xlogdump"
ALTER TABLE
mogdb=# \d+ xlogdump
                                                          Table "public.xlogdump"
   Column    |            Type             |                       Modifiers                       | Storage  | Stats target | Description
-------------+-----------------------------+-------------------------------------------------------+----------+--------------+-------------
 id          | integer                     | not null default nextval('xlogdump_id_seq'::regclass) | plain    |              |
 col1        | character varying(8)        |                                                       | extended |              |
 create_time | timestamp without time zone | default now()                                         | plain    |              |
Indexes:
    "xlogdump_pkey" PRIMARY KEY, btree (id) TABLESPACE pg_default
Has OIDs: no
Options: orientation=row, storage_type=astore, compression=no

```

**更新非主键列**
更新非主键列，不会有历史记录

```
mogdb=# update xlogdump set col1='tttt' where id=2;
UPDATE 1
mogdb=# select xmin,xmax,* from xlogdump;
  xmin  | xmax | id | col1 |        create_time
--------+------+----+------+----------------------------
 952425 |    0 |  1 | t1   | 2022-04-25 19:54:04.329156
 954513 |    0 |  2 | tttt | 2022-04-25 20:05:28.159008
(2 rows)

[o3m@mogdb01 pg_xlog]$ mog_xlogdump -x 954513 -o 24791 -R int,varchar,timestamp 000000010000000000000064
'update',,'new_tuple':{'(null)':'2','(null)':'tttt','(null)':'2022-04-25 20:05:28.159008'}
mog_xlogdump: FATAL:  error in WAL record at 0/64D51198: invalid record length at 0/64D511F8: wanted 32, got 0

```

**更新主键列**
更新主键列，会记录主键的历史记录

```
mogdb=# update xlogdump set id=3,col1='ttttt' where id=2;
UPDATE 1
mogdb=# select xmin,xmax,* from xlogdump;
  xmin  | xmax | id | col1  |        create_time
--------+------+----+-------+----------------------------
 952425 |    0 |  1 | t1    | 2022-04-25 19:54:04.329156
 954582 |    0 |  3 | ttttt | 2022-04-25 20:05:28.159008
(2 rows)

[o3m@mogdb01 pg_xlog]$ mog_xlogdump -x 954582 -o 24791 -R int,varchar,timestamp 000000010000000000000064
'update','old_tuple':{'(null)':'2',},'new_tuple':{'(null)':'3','(null)':'ttttt','(null)':'2022-04-25 20:05:28.159008'}
mog_xlogdump: FATAL:  error in WAL record at 0/64D5AC50: invalid record length at 0/64D5ACB0: wanted 32, got 0

```

#### 数据更新:设置 wal_level=logical，修改 replica identity

<img src='./figures/20220425-9a843f77-3597-455c-a4e6-8c68f3159f58.png'>

**更新数据**

```
mogdb=# update xlogdump set col1='t6' where id=3;
UPDATE 1
mogdb=# select xmin,xmax,* from xlogdump;
  xmin  | xmax | id | col1 |        create_time
--------+------+----+------+----------------------------
 952425 |    0 |  1 | t1   | 2022-04-25 19:54:04.329156
 955195 |    0 |  3 | t6   | 2022-04-25 20:05:28.159008
(2 rows)

[o3m@mogdb01 pg_xlog]$ mog_xlogdump -x 955195 -o 24791 -R int,varchar,timestamp 000000010000000000000064
'update','old_tuple':{'(null)':'3','(null)':'ttttt','(null)':'2022-04-25 20:05:28.159008'},'new_tuple':{'(null)':'3','(null)':'t6','(null)':'2022-04-25 20:05:28.159008'}
mog_xlogdump: FATAL:  error in WAL record at 0/64DCC108: invalid record length at 0/64DCC168: wanted 32, got 0

```

**删除数据**

```
mogdb=# select xmin,xmax,* from xlogdump;
  xmin  | xmax | id | col1 |        create_time
--------+------+----+------+----------------------------
 952425 |    0 |  1 | t1   | 2022-04-25 19:54:04.329156
(1 row)

[o3m@mogdb01 pg_xlog]$ mog_xlogdump  -o 24791 -R int,varchar,timestamp 000000010000000000000064
.
.省略之前的操作步骤
.
'delete','tuple':{'(null)':'3','(null)':'t6','(null)':'2022-04-25 20:05:28.159008'}mog_xlogdump: FATAL:  error in WAL record at 0/64DD5148: invalid record length at 0/64DD51A8: wanted 32, got 0

```

### 解析所有表

-c postgres://yunlong:Yunlong123@192.168.122.101:15500/mogdb
建议使用具有 sysadmin 权限的用户连接到数据库，可以获取到所有的数据库对象

```
{'table_name':'gs_txn_snapshot', 'schema_name':'pg_catalog', 'transaction id':'957984', 'action':'insert','tuple':{'snptime':'2022-04-14 00:18:11.205123-277:46:40','snpxmin':'957984','snpcsn':'938806','snpsnapshot':'xmin:957984
{'table_name':'gs_txn_snapshot', 'schema_name':'pg_catalog', 'transaction id':'957985', 'action':'insert','tuple':{'snptime':'2022-04-14 00:18:14.216348-277:46:40','snpxmin':'957984','snpcsn':'938807','snpsnapshot':'xmin:957984
{'table_name':'gs_txn_snapshot', 'schema_name':'pg_catalog', 'transaction id':'957986', 'action':'insert','tuple':{'snptime':'2022-04-14 00:18:14.226067-277:46:40','snpxmin':'957986','snpcsn':'938808','snpsnapshot':'xmin:957986
{'table_name':'gs_txn_snapshot', 'schema_name':'pg_catalog', 'transaction id':'957987', 'action':'insert','tuple':{'snptime':'2022-04-14 00:18:17.236834-277:46:40','snpxmin':'957986','snpcsn':'938809','snpsnapshot':'xmin:957986

--
[o3m@mogdb01 pg_xlog]$ mog_xlogdump -c postgres://yunlong:Yunlong123@192.168.122.101:15500/mogdb -s 0/64F8A220 000000010000000000000064 |grep -v gs_txn_snapshot |grep -i table_name
--

{'table_name':'pg_authid', 'schema_name':'pg_catalog', 'transaction id':'958293', 'action':'insert','tuple':{'rolname':'yunlong','rolsuper':false,'rolinherit':true,'rolcreaterole':false,'rolcreatedb':false,'rolcatupdate':false,'rolcanlogin':true,'rolreplication':false,'rolauditadmin':false,'rolsystemadmin':true,'rolconnlimit':'-1','rolpassword':'sha2565030b85f459cf837ab2ede05944250b43adda3c2e499a86e1f9fa349d8bc033fb1833614f8c65680bf1ea2047354dbe02493fe13ff8b94a0e2861994f933e40ac0a770e165ab9a7a2eb66ffe8bd4490ceb3f7168d7631b249b4fed559d426e00ecdfecefade',nullnull'rolrespool':'default_pool','roluseft':false,'rolparentid':'0',null'rolkind':'n',nullnullnullnull'rolmonitoradmin':false,'roloperatoradmin':false,'rolpolicyadmin':false}}
{'table_name':'pg_auth_history', 'schema_name':'pg_catalog', 'transaction id':'958293', 'action':'insert','tuple':{'roloid':'24800','passwordtime':'2022-04-14 00:25:56.896461-277:46:40','rolpassword':'sha2565030b85f459cf837ab2ede05944250b43adda3c2e499a86e1f9fa349d8bc033fb1833614f8c65680bf1ea2047354dbe02493fe13ff8b94a0e2861994f933e40ac0a770e165ab9a7a2eb66ffe8bd4490ceb3f7168d7631b249b4fed559d426e00'}}
{'table_name':'pg_namespace', 'schema_name':'pg_catalog', 'transaction id':'958293', 'action':'insert','tuple':{'nspname':'yunlong','nspowner':'24800','nsptimeline':'0','nspacl':'UnSupport Type','in_redistribution':'n','nspblockchain':false}}
{'table_name':'pg_shdepend', 'schema_name':'pg_catalog', 'transaction id':'958293', 'action':'insert','tuple':{'dbid':'16444','classid':'2615','objid':'24802','objsubid':'0','refclassid':'1260','refobjid':'24800','deptype':'o',null}}
{'table_name':'pg_user_status', 'schema_name':'pg_catalog', 'transaction id':'958293', 'action':'insert','tuple':{'roloid':'24800','failcount':'0','locktime':'2022-04-14 00:25:56.904328-277:46:40','rolstatus':'0','permspace':'0','tempspace':'0','passwordexpired':'0'}}
```
