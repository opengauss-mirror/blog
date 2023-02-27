---
title: 'openGauss 2.1.0 闪回特性'

date: '2021-10-21'

category: 'blog'
tags: ['openGauss 2.1.0 闪回特性']

archives: '2021-10'

author: '贾军锋'

summary: ' openGauss 2.1.0 闪回特性'

img: '/zh/blogs/July/title/img11.png'

times: '12:30'
---

# openGauss 2.1.0 闪回特性<a name="ZH-CN_TOPIC_0000001174334910"></a>

openGauss 2.1.0 于 2021 年 9 月 30 日发布，是 openGauss 的一个 Preview 版本，该版本生命周期仅为半年。该版本的新增功能如下：

- 存储过程兼容性增强
- SQL 引擎能力增强
- 支持 Ustore 存储引擎
- 支持段页式存储
- 基于 Paxos 分布式一致性协议的高可用
- AI4DB 和 DB4AI 竞争力持续构筑
- 日志框架及错误码整改
- JDBC 客户端负载均衡及读写分离
- 支持 cmake 脚本编译
- 列存表支持主键唯一键约束
- 支持 jsonb 数据类型
- 支持 unique sql 自动淘汰
- UCE 故障感知
- 支持 GB18030 字符集
- 备机 catch 优化
- 客户端工具 gsql 支持 readline 命令自动补齐
- 动态数据脱敏
- 支持国密算法
- 防篡改账本数据库
- 内置角色和权限管理机制
- 透明加密
- 全密态数据库增强
- 支持 dblink
- 支持 Ubuntu 系统
- 支持 Hash 索引
- upsert 支持子查询
- min/max 函数支持 ip 地址类型
- 增加 array_remove/array_replace/first/last 函数
- Data Studio 客户端工具适配内核特性

虽然以上官方文档中描述的新增特性中并没有提及闪回特性，但在《管理员指南》中已经明确提及该特性的使用方法。

闪回恢复其实是利用回收站的闪回恢复删除的表。利用 MVCC 机制闪回恢复到指定时间点或者 CSN 点\(commit sequence number\)。

闪回技术能够有选择性的高效撤销一个已提交事务的影响，从人为错误中恢复。在采用闪回技术之前，只能通过备份恢复、PITR 等手段找回已提交的数据库修改，恢复时长需要数分钟甚至数小时。采用闪回技术后，恢复已提交的数据库修改前的数据，只需要秒级，而且恢复时间和数据库大小无关。

**闪回恢复适用于：**

- 误删除表的场景；
- 需要将表中的数据恢复到指定时间点或者 CSN。

**闪回支持两种恢复模式：**

- 基于 MVCC 多版本的数据恢复：适用于误删除、误更新、误插入数据的查询和恢复，用户通过配置旧版本保留时间，并执行相应的查询或恢复命令，查询或恢复到指定的时间点或 CSN 点。
- 基于类似 windows 系统回收站的恢复：适用于误 DROP、误 TRUNCATE 的表的恢复。用户通过配置回收站开关，并执行相应的恢复命令，可以将误 DROP、误 TRUNCATE 的表找回。

**重要提示：**

遗憾的是，官方文档关于闪回恢复的前提条件并没有描述到位，导致初次接触该功能的小伙伴有些茫然\(我也是\)，无法复现闪回恢复的特性操作。这里，需要向大家明确的是：关于 openGauss 的闪回，仅支持 Ustore 存储引擎\(和 Oracle 一样，闪回的数据存储在 UNDO 表空间\)，也就是说，我们需要创建 Ustore 存储引擎的表才可以使用 openGauss 的闪回功能。

下面我们来看看 openGauss 的闪回测试。

## 一、创建测试数据<a name="section419121322319"></a>

- 1. 设置 Ustore 闪回相关参数

  ```
  gs_guc set -N all -I all -c "undo_zone_count=16384"           ## 内存中可分配的undo zone数量，0代表禁用undo和Ustore表，建议取值为max_connections*4
  gs_guc set -N all -I all -c "enable_default_ustore_table=on"  ## 开启默认支持Ustore存储引擎
  gs_guc set -N all -I all -c "version_retention_age=10000"     ## 旧版本保留的事务数，超过该事务数的旧版本将被回收清理
  gs_guc set -N all -I all -c "enable_recyclebin=on"            ## 打开回收站
  gs_guc set -N all -I all -c "recyclebin_retention_time=15min" ## 置回收站对象保留时间，超过该时间的回收站对象将被自动清理
  gs_om -t restart
  ```

- 2. 创建测试表

  ```
  gsql -d postgres -p 26000 -r
  openGauss=# create table t1(a int,b int,c int,d int);
  openGauss=# insert into t1 values(1,2,3,4),(21,22,23,24),(31,32,33,34);
  openGauss=# select * from t1;
   a  | b  | c  | d
  ----+----+----+----
    1 |  2 |  3 |  4
   21 | 22 | 23 | 24
   31 | 32 | 33 | 34
  openGauss=# \d+ t1
                            Table "public.t1"
   Column |  Type   | Modifiers | Storage | Stats target | Description
  --------+---------+-----------+---------+--------------+-------------
   a      | integer |           | plain   |              |
   b      | integer |           | plain   |              |
   c      | integer |           | plain   |              |
   d      | integer |           | plain   |              |
  Has OIDs: no
  Options: orientation=row, compression=no, storage_type=USTORE
  ```

## 二、闪回查询<a name="section156531956152315"></a>

闪回查询可以查询过去某个时间点表的某个 snapshot 数据，这一特性可用于查看和逻辑重建意外删除或更改的受损数据。闪回查询基于 MVCC 多版本机制，通过检索查询旧版本，获取指定老版本数据。

示例：

1. 更新元组

```
openGauss=# select current_timestamp;
       pg_systimestamp
------------------------------
 2021-10-12 10:03:08.272344+08

openGauss=# update t1 set a=99;
openGauss=# select * from t1;
 a  | b  | c  | d
----+----+----+----
 99 |  2 |  3 |  4
 99 | 22 | 23 | 24
 99 | 32 | 33 | 34
```

2. 查询 timestamp 对应的 CSN

```
openGauss=# select snptime,snpcsn from gs_txn_snapshot
            where snptime between '2021-10-12 10:03:05.272344+08' and '2021-10-12 10:03:18.272344+08';
            snptime            | snpcsn
-------------------------------+--------
 2021-10-12 10:03:07.583368+08 |   2213
 2021-10-12 10:03:10.595467+08 |   2214
 2021-10-12 10:03:13.606675+08 |   2215
 2021-10-12 10:03:16.619061+08 |   2216
```

3. 执行闪回查询命令，查看闪回结果

- 基于 timestamp 的闪回查询

  ```
  select * from t1 timecapsule timestamp to_timestamp('2021-10-12 10:03:08.272344','YYYY-MM-DD HH24:MI:SS.FF');
   a  | b  | c  | d
  ----+----+----+----
    1 |  2 |  3 |  4
   21 | 22 | 23 | 24
   31 | 32 | 33 | 34
  ```

- 基于 CSN 的闪回查询

  ```
  select * from t1 timecapsule csn 2213;
   a  | b  | c  | d
  ----+----+----+----
    1 |  2 |  3 |  4
   21 | 22 | 23 | 24
  31 | 32 | 33 | 34
  ```

说明：

- TIMESTAMP 参数：指要查询某个表在 TIMESTAMP 这个时间点上的数据，TIMESTAMP 指一个具体的历史时间。
- CSN 参数：CSN 是一个逻辑提交时间点，数据库中的 CSN 是一个写一致性点，查询某个 CSN 下的数据代表 SQL 查询数据库在该一致性点的相关数据。

## 三、回收站<a name="section043954362515"></a>

在拥有回收站之前，当用户误将表 drop 或 truncate 后，只能使用全库备份恢复的方式来解决这种逻辑错误。

在 openGauss 2.1.0 版本中，引入了回收站功能，用户通过该功能可以从回收站中闪回 TRUNCATE 或 DROP 的表对象，将数据恢复到错误操作前，大大提高了用户数据的可靠性。

- 闪回 drop： 可以恢复意外删除的表，从回收站\(recyclebin\)中恢复被删除的表及其附属结构如索引、表约束等。闪回 drop 是基于回收站机制，通过还原回收站中记录的表的物理文件，实现已 drop 表的恢复。
- 闪回 truncate： 可以恢复误操作或意外被进行 truncate 的表，从回收站中恢复被 truncate 的表及索引的物理数据。闪回 truncate 基于回收站机制，通过还原回收站中记录的表的物理文件，实现已 truncate 表的恢复。

官方文档没有强调到的坑需要注意：recyclebin 不支持 Ustore，只支持 Astore\[详见下面测试示例\] – 需要找开发确认，更新官方文档

示例：

1. 误操作删除表

```
-- 创建测试数据
openGauss=# create table t1(id int,name varchar(200)) with (STORAGE_TYPE=USTORE);
openGauss=# insert into t1 values(1,'t1_Tom'),(2,'t1_Jerry');
openGauss=# select * from t1;
 id |   name
----+----------
  1 | t1_Tom
  2 | t1_Jerry
openGauss=# create table t2(id int,name varchar(200)) with (STORAGE_TYPE=ASTORE);
openGauss=# insert into t2 values(1,'t2_Tom'),(2,'t2_Jerry');
openGauss=# select * from t2;
 id |   name
----+----------
  1 | t2_Tom
  2 | t2_Jerry
-- 模拟误删表
openGauss=# drop table t1;
openGauss=# drop table t2;
```

2. 查询回收站对象

```
openGauss=# SELECT rcyname,rcyoriginname,rcytablespace FROM GS_RECYCLEBIN;
           rcyname           | rcyoriginname | rcytablespace
-----------------------------+---------------+---------------
 BIN$3BFF4EB403B$4C71318==$0 | t2            |             0   -- 仅看见Astore存储的t2表，并没有看到Ustore存储的t1表，注意！！
(1 row)
```

3. 闪回操作

```
openGauss=# timecapsule table t2 to before drop rename to t2_bak;
TimeCapsule Table
openGauss=# select * from t2_bak;
 id |   name
----+----------
  1 | t2_Tom
  2 | t2_Jerry
```

和 Oracle 一样，也可以使用 recyname 恢复表，如“timecapsule table “BIN$3BFF4EB403B$4C71318==$0” to before drop rename to t2;”。

其他闪回操作详见官方文档。

## 4. 清空回收站<a name="section143432044142612"></a>

```
openGauss=# purge recyclebin;
PURGE RECYCLEBIN
```

以上是本人对 openGauss 2.1.0 版本闪回特性的基本测试，希望能帮助到有需要的小伙伴。
