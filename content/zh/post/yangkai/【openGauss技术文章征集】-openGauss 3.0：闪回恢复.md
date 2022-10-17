    闪回概念是Oracle最先提出来的，其本质是为了回退错误操作产生的，避免人为的“灾难”，并且要能够快速回退。

    闪回恢复功能是数据库恢复技术的一环，可以有选择性的撤销一个已提交事务的影响，将数据从人为不正确的操作中进行恢复。在采用闪回技术之前，只能通过备份恢复、PITR等手段找回已提交的数据库修改，恢复时长需要数分钟甚至数小时。采用闪回技术后，恢复已提交的数据库修改前的数据，只需要秒级，而且恢复时间和数据库大小无关。

openGauss的闪回分为一下两类：

闪回查询
闪回表

一、闪回查询
    基于MVCC多版本的数据恢复：适用于误删除、误更新、误插入数据的查询和恢复，用户通过配置旧版本保留时间，并执行相应的查询或恢复命令，查询或恢复到指定的时间点或CSN点。

前提条件（下面三个缺一不可）

undo_retention_time：参数用于设置undo旧版本的保留时间。

undo_zone_count=16384 ---代表的时候undo log的一种资源个数

enable_default_ustore_table=on --默认指定用户创建表时使用USTORE存储引擎。

存储引擎:Ustore
Ustore存储引擎将最新版本的“有效数据”和历史版本的“垃圾数据”分离存储。将最新版本的“有效数据”存储在数据页面上，并单独开辟一段UNDO空间，用于统一管理历史版本的“垃圾数据”，因此数据空间不会由于频繁更新而膨胀，“垃圾数据”集中回收效率更高。

设置参数命令如下：

gs_guc set -N all -I all -c "undo_retention_time=2000s"
gs_guc set -N all -I all -c "undo_zone_count=16384"
gs_guc set -N all -I all -c "enable_default_ustore_table=on"

设置完重启数据库：

gs_om -t restart

重启后验证参数：

openGauss=# show undo_retention_time;
undo_retention_time
---------------------
2000s
(1 row)

openGauss=# show undo_zone_count;
undo_zone_count
-----------------
16384
(1 row)

openGauss=# show enable_default_ustore_table;
enable_default_ustore_table
-----------------------------
on
(1 row)

openGauss=# 

下面开始演示：

创建表：

openGauss=# CREATE TABLE flashback_tab(
id int not null,
name text not null);
openGauss-# 
CREATE TABLE

查看表存储引擎：

openGauss=# \d+ flashback_tab;
Table "public.flashback_tab"
Column | Type | Modifiers | Storage | Stats target | Description
--------+---------+-----------+----------+--------------+-------------
id | integer | not null | plain | |
name | text | not null | extended | |
Has OIDs: no
Options: orientation=row, compression=no, storage_type=USTORE, toast.storage_type=USTORE

插入数据：

insert into flashback_tab values (1,'ybj');

查询当前日期;

openGauss=# select current_timestamp;
pg_systimestamp
-------------------------------
2022-09-29 01:13:32.691158+08
(1 row)

查询数据：

openGauss=# select * from flashback_tab;
id | name
----+------
1 | ybj
(1 row)
插入数据：
openGauss=# insert into flashback_tab values (2,'yangkai');
INSERT 0 1

查询结果：
openGauss=# select * from flashback_tab;
id | name
----+---------
1 | ybj
2 | yangkai
(2 rows)

---基于timestamp的闪回查询：

openGauss=# SELECT * FROM flashback_tab TIMECAPSULE TIMESTAMP to_timestamp ('2022-09-29 01:13:32.691158', 'YYYY-MM-DD HH24:MI:SS.FF');
id | name
----+------
1 | ybj
(1 row)

---查询timestamp对应的CSN

openGauss=# select snptime,snpcsn from gs_txn_snapshot where snptime between '2022-09-29 01:13:32.691158' and ' 2022-09-29 01:15:24.921426'
openGauss-# ;
snptime | snpcsn
-------------------------------+--------
2022-09-29 01:13:32.841985+08 | 2112
2022-09-29 01:13:35.87922+08 | 2114
2022-09-29 01:13:38.924031+08 | 2116
2022-09-29 01:13:41.966247+08 | 2118
2022-09-29 01:13:45.013022+08 | 2120
2022-09-29 01:13:48.04741+08 | 2122
2022-09-29 01:13:51.078498+08 | 2124
2022-09-29 01:13:54.101686+08 | 2126
2022-09-29 01:13:57.123891+08 | 2128
2022-09-29 01:14:00.147156+08 | 2130
2022-09-29 01:14:03.169433+08 | 2132
2022-09-29 01:14:06.192879+08 | 2134
2022-09-29 01:14:09.216963+08 | 2136
2022-09-29 01:14:12.240249+08 | 2138
2022-09-29 01:14:15.26606+08 | 2140
2022-09-29 01:14:18.288409+08 | 2142
2022-09-29 01:14:21.309986+08 | 2144
2022-09-29 01:14:24.332801+08 | 2146
2022-09-29 01:14:27.378095+08 | 2148
2022-09-29 01:14:30.416234+08 | 2151
2022-09-29 01:14:33.460251+08 | 2153
2022-09-29 01:14:36.508431+08 | 2155

---基于CSN的闪回查询

openGauss=# SELECT * FROM flashback_tab TIMECAPSULE CSN 2116;
id | name
----+------
1 | ybj
(1 row)

二、闪回表
    基于类似windows系统回收站的恢复：适用于误DROP、误TRUNCATE的表的恢复。用户通过配置回收站开关，并执行相应的恢复命令，可以将误DROP、误TRUNCATE的表找回。

前置条件：开启回收站、设置回收站对象保留时间

enable_recyclebin=on 启用回收站。 

recyclebin_retention_time=30min 参数用于设置回收站对象保留时间，超过该时间的回收站对象将被自动清理。

命令如下：

 gs_guc set -N all -I all -c "enable_recyclebin=on"

 gs_guc set -N all -I all -c "recyclebin_retention_time=30min"

设置完重启数据库：

gs_om -t restart

[omm@huaweidb ~]$ gsql -d postgres -p 15400
gsql ((openGauss 3.0.0 build 02c14696) compiled at 2022-04-01 18:12:34 commit 0 last mr )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=# show recyclebin_retention_time;
recyclebin_retention_time
---------------------------
30min
(1 row)

openGauss=# show enable_recyclebin;
enable_recyclebin
-------------------
on
(1 row)

openGauss=# 

下面开始操作演示：

[omm@huaweidb ~]$ gsql -d postgres -p 15400
gsql ((openGauss 3.0.0 build 02c14696) compiled at 2022-04-01 18:12:34 commit 0 last mr )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.
--查询当前表
openGauss=# select * from flashback_tab ;
id | name
----+---------
1 | ybj
2 | yangkai
(2 rows)
--truncate表
openGauss=# truncate flashback_tab;
TRUNCATE TABLE
openGauss=# select * from flashback_tab ;
id | name
----+------
(0 rows)
---闪回表
openGauss=# timecapsule table flashback_tab to before truncate;
TimeCapsule Table

--查询结果
openGauss=# select * from flashback_tab ;
id | name
----+---------
1 | ybj
2 | yangkai
(2 rows)
--drop 表
openGauss=# drop table flashback_tab;
DROP TABLE
openGauss=# select * from flashback_tab;
ERROR: relation "flashback_tab" does not exist on dn_6001
LINE 1: select * from flashback_tab;
^

--查看回收站：
openGauss=# sELECT rcyname,rcyoriginname,rcytablespace FROM GS_RECYCLEBIN;
rcyname | rcyoriginname | rcytablespace
------------------------------+----------------------+---------------
BIN$3C7C4EB8014$30BE34C8==$0 | pg_toast_32783_index | 0
BIN$3C7C4EB8012$30BE3AA0==$0 | pg_toast_32783 | 0
BIN$3C7C4EB800F$30BE40B0==$0 | flashback_tab | 0
BIN$3C7C4EB800F$30BEA658==$0 | flashback_tab | 0
BIN$3C7C4EB8014$30BEAF78==$0 | pg_toast_32783_index | 0
BIN$3C7C4EB8012$30BEB560==$0 | pg_toast_32783 | 0
(6 rows)
--通过回收站闪回表并命名flashback_yangkai;
openGauss=# timecapsule table flashback_tab to before drop rename to flashback_yangkai;
TimeCapsule Table
openGauss=# select * from flashback_yangkai;
id | name
----+---------
1 | ybj
2 | yangkai
(2 rows)

三、总结
    openGauss 闪回非常强大，可以秒杀国产大部分数据库，基本可以满足日常运维需求，希望后期可以推出类似oracle数据库级别闪回、snapshot standby就完美了。