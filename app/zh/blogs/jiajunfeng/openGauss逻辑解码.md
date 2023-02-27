---
title: 'openGauss逻辑解码'

date: '2021-06-01'

category: 'blog'
tags: ['openGauss核心技术']

archives: '2021-06'

author: '贾军锋'

summary: 'openGauss逻辑解码'

img: '/zh/blogs/jiajunfeng/title/img4.png'

times: '12:30'
---

# openGauss 逻辑解码<a name="ZH-CN_TOPIC_0000001095342236"></a>

逻辑复制由两部分组成：逻辑解码和数据复制。逻辑解码会输出以事务为单位组织的逻辑日志。业务或数据库中间件将会对逻辑日志进行解析并最终实现数据复制。

openGauss 当前只提供逻辑解码功能，因此文只对逻辑解码进行简单说明和测试。

逻辑解码为逻辑复制提供事务解码的基础能力，openGauss 使用 SQL 函数接口进行逻辑解码。此方法调用方便，不需使用工具，对接外部工具接口也比较清晰，不需要额外适配。

由于逻辑日志是以事务为单位的，在事务提交后才能输出，且逻辑解码是由用户驱动的；因此为了防止事务开始时的 xlog 被系统回收，或所需的事务信息被 VACUUM 回收，openGauss 新增了逻辑复制槽，用于阻塞 xlog 的回收。

## 注意事项<a name="section0322186163014"></a>

- 不支持 DDL 语句解码。
- 不支持列存、数据页复制的解码。
- 不支持备机与级联备机进行逻辑解码。
- 当执行 DDL 语句（如 alter table）后，该 DDL 语句前尚未解码的物理日志可能会丢失。
- 使用逻辑解码功能时，禁止进行数据库在线扩容。
- 使用逻辑解码功能时，禁止执行 VACUUM FULL。
- 单条元组大小不超过 1GB，考虑解码结果可能大于插入数据，因此建议单条元组大小不超过 500MB。
- openGauss 支持解码的数据类型为：INTEGER、BIGINT、SMALLINT、TINYINT、SERIAL、SMALLSERIAL、BIGSERIAL、FLOAT、DOUBLE PRECISION、DATE、TIME\[WITHOUT TIME ZONE\]、TIMESTAMP\[WITHOUT TIME ZONE\]、CHAR\(n\)、VARCHAR\(n\)、TEXT。
- 目前默认不支持 ssl 连接，如果需要 ssl 连接需要设置 guc 参数 ssl=on。
- 如果使用 JDBC 创建逻辑复制槽，则逻辑复制槽名称必须小于 64 个字符，且只包含字母、数字或者下划线中的一种或几种。
- 当前逻辑复制不支持 MOT 特性。
- 当逻辑复制槽所在数据库被删除后，这些复制槽变为不可用状态，需要用户手动删除。
- 仅支持 utf-8 字符集。
- 对多库的解码需要分别在库内创建流复制槽并开始解码，每个库的解码都需要单独扫一遍日志。
- 不支持强起，强起后需要重新全量导出数据。

## 准备工作<a name="section1541165553012"></a>

```
$ gs_guc reload -N all -I all -c "ssl=on"
$ gs_guc reload -N all -I all -c "wal_level=logical"
$ gs_guc reload -N all -I all -c "max_replication_slots=10"    ## max_replication_slots>每个节点所需的(物理流复制槽数+逻辑复制槽数)
$ gs_om -t stop && gs_om -t start
```

Tips:

- 物理流复制槽用于支撑主备 HA。数据库所需要的物理流复制槽数为：备节点\(包括从备\)与主节点之间的比例\(假设数据库的高可用方案为 1 主 3 备，则所需物理流复制槽数为 3\)。
- 一个逻辑复制槽只能解码一个 Database 的修改，如果需要解码多个 Database，则需要创建多个逻辑复制槽。
- 如果需要多路逻辑复制同步给多个目标数据库，在源端数据库需要创建多个逻辑复制槽，每个逻辑复制槽对应一条逻辑复制链路。
- 仅限数据库管理员和拥有 REPLICATION 权限的用户进行操作。

## 创建逻辑复制槽<a name="section11755163223117"></a>

```
$ gsql -d postgres -p 26000 -r -q
-- 创建一个名为slot1的逻辑复制槽，plugin_name当前仅支持mppdb_decoding
postgres=# SELECT * FROM pg_create_logical_replication_slot('slot1', 'mppdb_decoding');
 slotname | xlog_position
----------+---------------
 slot1    | 0/8948D100      -- 逻辑复制槽解码的起始LSN位置
```

## 创建测试数据<a name="section6129144020311"></a>

```
postgres=# create table logic_test(id int,date1 date);
postgres=# insert into logic_test values(1,now());
postgres=# select * from logic_test ;
 id |        date1
----+---------------------
  1 | 2021-05-31 10:02:59
```

## 读取复制槽逻辑解码结果<a name="section643964643112"></a>

```
postgres=# select * from pg_replication_slots;
 slot_name |     plugin     | slot_type | datoid | database | active | xmin | catalog_xmin | restart_lsn | dummy_standby
-----------+----------------+-----------+--------+----------+--------+------+--------------+-------------+---------------
 slot1     | mppdb_decoding | logical   |  15103 | postgres | f      |      |        13620 | 0/8948D080  | f
postgres=# select * from pg_logical_slot_peek_changes('slot1',null,4096);    -- (slot_name,LSN,upto_nchanges)
  location  |  xid  |     data
------------+-------+------------------------------------------------------------------------------------------------------------------
 0/8948D278 | 13620 | BEGIN 13620
 0/8948F088 | 13620 | COMMIT 13620 CSN 2277
 0/8948F1F8 | 13621 | BEGIN 13621
 0/8948F1F8 | 13621 | {"table_name":"public.logic_test","op_type":"INSERT","columns_name":["id","date1"],"columns_type":["integer","tim
estamp without time zone"],"columns_val":["1","'2021-05-31 10:02:59'"],"old_keys_name":[],"old_keys_type":[],"old_keys_val":[]}
 0/8948F300 | 13621 | COMMIT 13621 CSN 2278
```

Tips:

- slot_name: 流复制槽名称
- LSN: 日志的 LSN，表示只解码小于等于此 LSN 的日志, NULL 表示不对解码截止的日志位置做限制
- upto_nchanges: 解码条数。假设一共有 3 条事务，分别包含 3、5、7 条记录，如果 upto_nchanges 为 4，那么会解码出前两个事务共 8 条记录。

## 删除逻辑复制槽 slot1<a name="section2396195311311"></a>

```
postgres=# select * from pg_drop_replication_slot('slot1');
```
