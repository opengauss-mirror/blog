---
title: 'openGauss/MogDB 学习笔记之 -- PITR恢复'

date: '2022-08-25'

tags: ['openGauss']

archives: '2022-08'

author: '恩墨'

summary: 'openGauss/MogDB 学习笔记'

img: ''
category: 'blog'
times: '15:20'
---

# openGauss/MogDB 学习笔记之 -- PITR 恢复

## 概念描述

### 背景信息

当数据库崩溃或希望回退到数据库之前的某一状态时，MogDB 的即时恢复功能（Point-In-Time Recovery，简称 PITR）可以支持恢复到备份归档数据之后的任意时间点。

### 说明

PITR 仅支持恢复到物理备份数据之后的某一时间点。
仅主节点可以进行 PITR 恢复，备机需要进行全量 build 达成与主机数据同步。

### 前提条件

基于经过物理备份的全量数据文件。
基于已归档的 WAL 日志文件。

### PITR 恢复流程

将物理备份的文件替换目标数据库目录。
删除数据库目录下 pg_xlog/中的所有文件。
将归档的 WAL 日志文件复制到 pg_xlog 文件中（此步骤可以省略，通过配置 recovery.conf 恢复命令文件中的 restore_command 项替代）。
在数据库目录下创建恢复命令文件 recovery.conf，指定数据库恢复的程度。
启动数据库。
连接数据库，查看是否恢复到希望预期的状态。
若已经恢复到预期状态，通过 pg_xlog_replay_resume()指令使主节点对外提供服务。

### 恢复目标设置(四选一)

recovery_target_name = ‘restore_point_1’ ## 还原到一个使用 pg_create_restore_point()创建的还原点
recovery_target_time = ‘2020-01-01 12:00:00’ ## 还原到一个指定时间戳
recovery_target_xid = ‘3000’ ## 还原到一个事务 ID
recovery_target_lsn = ‘0/0FFFFFF’ ## 还原到日志的指定 LSN 点
recovery_target_inclusive = true ## 声明是否在指定恢复目标之后停止(true) 或 之前停止(false),不支持 recovery_target_name 配置#注意：如果不配置任何恢复目标 或 配置目标不存在，则默认恢复到最新的 WAL 日志点。

## 测试验证

### 1、环境准备(gs_baasebackup 备份)

```
[omm@db1 db1]$ gs_basebackup -U em_ljc -W -h 192.168.3.24 -p 26000 -D /home/omm/gs_pitr
Password:
INFO:  The starting position of the xlog copy of the full build is: 4/EA000028. The slot minimum LSN is: 0/0.
[2022-10-29 14:18:24]:begin build tablespace list
[2022-10-29 14:18:24]:finish build tablespace list
[2022-10-29 14:18:24]:begin get xlog by xlogstream
[2022-10-29 14:18:24]: check identify system success
[2022-10-29 14:18:24]: send START_REPLICATION 4/EA000000 success
[2022-10-29 14:18:24]: keepalive message is received
[2022-10-29 14:18:24]: keepalive message is received
[2022-10-29 14:18:27]: keepalive message is received
[2022-10-29 14:18:30]: keepalive message is received
[2022-10-29 14:18:30]: keepalive message is received
[2022-10-29 14:18:33]: keepalive message is received
[2022-10-29 14:18:36]: keepalive message is received
[2022-10-29 14:18:36]: keepalive message is received
[2022-10-29 14:18:39]: keepalive message is received
[2022-10-29 14:18:42]: keepalive message is received
[2022-10-29 14:18:42]: keepalive message is received
[2022-10-29 14:18:45]: keepalive message is received
[2022-10-29 14:18:47]: keepalive message is received
[2022-10-29 14:18:50]: keepalive message is received
[2022-10-29 14:18:53]: keepalive message is received
[2022-10-29 14:18:56]: keepalive message is received
[2022-10-29 14:18:59]: keepalive message is received
[2022-10-29 14:18:59]: keepalive message is received
[2022-10-29 14:19:02]: keepalive message is received
[2022-10-29 14:19:05]: keepalive message is received
[2022-10-29 14:19:05]: keepalive message is received
[2022-10-29 14:19:08]: keepalive message is received
[2022-10-29 14:19:11]: keepalive message is received
[2022-10-29 14:19:11]: keepalive message is received
[2022-10-29 14:19:14]: keepalive message is received
[2022-10-29 14:19:17]: keepalive message is received
[2022-10-29 14:19:17]: keepalive message is received
[2022-10-29 14:19:20]: keepalive message is received
[2022-10-29 14:19:23]: keepalive message is received
[2022-10-29 14:19:23]: keepalive message is received
[2022-10-29 14:19:29]:gs_basebackup: base backup successfully
[omm@db1 db1]$
```

### 2、创建测试数据（还原点 recovery_target_name ）

```
miao=> create table t1 (id int,tm timestamp,LSN varchar(20));
insert into t1 values(1,now(),'Started');
select * from t1;
select * from  pg_switch_xlog();
CREATE TABLE
miao=> insert into t1 values(1,now(),'Started');
INSERT 0 1
miao=> select * from t1;
 id |             tm             |   lsn
----+----------------------------+---------
  1 | 2022-10-29 14:22:52.273009 | Started
(1 row)

miao=> select * from  pg_switch_xlog();
 pg_switch_xlog
----------------
 4/EC0029F8
(1 row)

miao=>
-- 创建一个还原点 restore_point_1

miao=> select pg_create_restore_point('restore_point_1');
 pg_create_restore_point
-------------------------
 4/ED00EF40
(1 row)
```

### 3、第 2 次插入数据（时间 recovery_target_time ）

```
miao=> insert into t1 values(2,now(),'First Insert');
INSERT 0 1
miao=> select * from t1;
 id |             tm             |     lsn
----+----------------------------+--------------
  1 | 2022-10-29 14:22:52.273009 | Started
  2 | 2022-10-29 14:26:10.55628  | First Insert
(2 rows)

miao=> select  pg_switch_xlog();
select now();
 pg_switch_xlog
----------------
 4/ED017848
(1 row)

miao=> select now();
              now
-------------------------------
 2022-10-29 14:26:10.754567+08
(1 row)

```

### 4、第 3 次插入数据（LSN recovery_target_lsn ）

```
miao=> insert into t1 values(3,now(),'Second Insert');
INSERT 0 1
miao=> select * from t1;
 id |             tm             |      lsn
----+----------------------------+---------------
  1 | 2022-10-29 14:22:52.273009 | Started
  2 | 2022-10-29 14:26:10.55628  | First Insert
  3 | 2022-10-29 14:31:13.220708 | Second Insert
(3 rows)

miao=> select pg_switch_xlog();

select * from pg_current_xlog_location();
 pg_switch_xlog
----------------
 4/EE0230C0
(1 row)

miao=>
miao=> select * from pg_current_xlog_location();
 pg_current_xlog_location
--------------------------
 4/EF000148
(1 row)
```

### 5、模拟故障删除目录

```
[omm@db1 gs_pitr]$ cp /archivelog/* /home/omm/gs_pitr/archivelog/

[omm@db1 gs_pitr]$ gs_om -t stop
Stopping cluster.
=========================================
Successfully stopped cluster.
=========================================
End stop cluster.
[omm@db1 gs_pitr]$ rm -fr /mogdb/data/db1/
```

### 6、第一阶段恢复（按照还原点进行恢复）

```
[omm@db1 data]$ mkdir /mogdb/data/db1/
[omm@db1 db1]$ cp -fr /home/omm/gs_pitr/* /mogdb/data/db1/

[omm@db1 db1]$ vi recovery.conf

restore_command = 'cp /mogdb/data/db1/archivelog/%f %p'
recovery_target_name = 'restore_point_1'      ## 恢复到指定的还原点restore_point_1,此时后面2条数据
recovery_target_inclusive = true
[omm@db1 db1]$ gs_om -t start
Starting cluster.
=========================================
[SUCCESS] db1
2022-10-29 15:22:47.061 635cd4c6.1 [unknown] 140295007823424 [unknown] 0 dn_6001 01000  0 [BACKEND] WARNING:  could not create any HA TCP/IP sockets
2022-10-29 15:22:47.064 635cd4c6.1 [unknown] 140295007823424 [unknown] 0 dn_6001 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (1967 Mbytes) is larger.
=========================================
Successfully started.


[omm@db1 db1]$ gsql -d miao -p 26000 -U dbmt -r
Password for user dbmt:
gsql ((MogDB 2.1.1 build b5f25b20) compiled at 2022-03-21 14:42:30 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

miao=> \d
                                               List of relations
 Schema |              Name              | Type  | Owner |                       Storage
--------+--------------------------------+-------+-------+------------------------------------------------------
 dbmt   | b1921101_bak                   | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | cc_chx                         | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | cd_material                    | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | customer_me_degree_wbinfo      | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | customer_me_degree_wbinfo_test | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | erp_i_contract_class           | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | scm_warning_reauidt_detail     | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | sm_filemanagerconfig           | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | t_o                            | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | t_o_t                          | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | t_p_t                          | table | dbmt  | {orientation=row,compression=no,storage_type=USTORE}
 dbmt   | temp1                          | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | tiji_update                    | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | tmp_mis_code_zq                | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | tmp_mul_stock_detail_20200614  | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | tmp_output_bill_20190821       | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | tmp_project_party              | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | tmp_unit_vol                   | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | tmp_user_rep                   | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | ur_s_role                      | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | w_work_cooperate_gjback0721    | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 dbmt   | yang_tempate3                  | table | dbmt  | {orientation=row,compression=no,storage_type=ustore}
 public | t1                             | table | omm   | {orientation=row,compression=no,storage_type=USTORE}
(105 rows)

miao=> select * from t1;
 id |             tm             |   lsn
----+----------------------------+---------
  1 |  2022-10-29 14:22:52.273009 | Started
(1 row)

miao=>
```

### 7、 第二阶段恢复(按照时间进行还原)

```
[omm@db1 db1]$ vi recovery.conf
restore_command = 'cp /mogdb/data/db1/archivelog/%f %p'
recovery_target_time = '2022-10-29 14:26:44'
recovery_target_inclusive = true
~

"recovery.conf" [New] 3L, 137C written
[omm@db1 db1]$ gs_om -t start
Starting cluster.
=========================================
[SUCCESS] db1
2022-10-29 15:22:47.061 635cd4c6.1 [unknown] 140295007823424 [unknown] 0 dn_6001 01000  0 [BACKEND] WARNING:  could not create any HA TCP/IP sockets
2022-10-29 15:22:47.064 635cd4c6.1 [unknown] 140295007823424 [unknown] 0 dn_6001 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (1967 Mbytes) is larger.
=========================================
Successfully started.
[omm@db1 db1]$ gsql -d miao -U dbmt -p 26999 -r
failed to connect /opt/mogdb/tools/omm_mppdb:26999.
[omm@db1 db1]$ gsql -d miao -U dbmt -p 26000 -r
Password for user dbmt:
gsql ((MogDB 2.1.1 build b5f25b20) compiled at 2022-03-21 14:42:30 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

miao=> select * from t1;
 id |             tm             |     lsn
----+----------------------------+--------------
  1 | 2022-10-29 14:22:52.273009 | Started
  2 | 2022-10-29 14:26:10.55628  | First Insert
(2 rows)
```

### 8、 第三阶段恢复(按照 lsn 进行恢复)

```
restore_command = 'cp /mogdb/data/db1/archivelog/%f %p'
recovery_target_lsn = '4/EE0230C0'
recovery_target_inclusive = true



[omm@db1 archivelog]$ gs_om -t stop
Stopping cluster.



[omm@db1 db1]$ gs_om -t start
Starting cluster.
=========================================
[SUCCESS] db1
2022-10-29 16:08:54.842 635cdf96.1 [unknown] 140627704972864 [unknown] 0 dn_6001 01000  0 [BACKEND] WARNING:  could not create any HA TCP/IP sockets
2022-10-29 16:08:54.887 635cdf96.1 [unknown] 140627704972864 [unknown] 0 dn_6001 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (1967 Mbytes) is larger.
=========================================
Successfully started.
[omm@db1 db1]$ gsql -d miao -U dbmt -p 26000
Password for user dbmt:
gsql ((MogDB 2.1.1 build b5f25b20) compiled at 2022-03-21 14:42:30 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

miao=> select 8 from t1;
 ?column?
----------
        8
        8
        8
(3 rows)

miao=> select * from t1;
 id |             tm             |      lsn
----+----------------------------+---------------
  1 | 2022-10-29 14:22:52.273009 | Started
  2 | 2022-10-29 14:26:10.55628  | First Insert
  3 | 2022-10-29 14:31:13.220708 | Second Insert
(3 rows)

miao=>
```

### 9、 手动结束 PITR 状态

```
miao=> select pg_is_in_recovery();
 pg_is_in_recovery
-------------------
 t
(1 row)

miao=>  select pg_xlog_replay_resume();
 pg_xlog_replay_resume
-----------------------

(1 row)
[omm@db1 db1]$ gsql -d miao -U dbmt -p 26000 -r
Password for user dbmt:
gsql ((MogDB 2.1.1 build b5f25b20) compiled at 2022-03-21 14:42:30 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

miao=> select pg_is_in_recovery();
 pg_is_in_recovery
-------------------
 f
(1 row)

miao=>
```
