+++

title = "openGauss基于自定义条件下的高级恢复"

date = "2022-11-17"

tags = ["openGauss技术文章征集"]

archives = "2022-11"

author = "李宏达"

summary = "openGauss基于自定义条件下的高级恢复"

img = "/zh/post/lihongda/title/title.png"

times = "10:00"

+++

# 前言

gs_probackup是一个用于管理openGauss数据库备份和恢复的工具。它对openGauss实例进行定期备份，以便在数据库出现故障时能够恢复服务器。

- 可用于备份单机数据库，也可对主机或者主节点数据库备机进行备份，为物理备份。
- 可备份外部目录的内容，如脚本文件、配置文件、日志文件、dump文件等。
- 支持增量备份、定期备份和远程备份。
- 可设置备份的留存策略。

本文是对gs_probackup的基于特定条件下的增量恢复测试

## 前提条件
- 可以正常连接openGauss数据库。
- 若要使用PTRACK增量备份，需在postgresql.conf中手动添加参数“enable_cbm_tracking = on”。
- 为了防止xlog在传输结束前被清理，请适当调高postgresql.conf文件中wal_keep_segements的值。



# 一、 高级恢复

## 1. 构建环境

> 准备一个有gs_probackup的单机环境


### (1) 备份

- 备份
```sql
[omm@node1 ~]$ gs_probackup backup -B /opt/mogdb/backup_dir --instance instance1 -b FULL
INFO: Backup start, gs_probackup version: 2.4.2, instance: instance1, backup ID: RJ5YES, backup mode: FULL, wal mode: STREAM, remote: false, compress-algorithm: none, compress-level: 1
LOG: Backup destination is initialized
LOG: This openGauss instance was initialized with data block checksums. Data block corruption will be detected
LOG: Database backup start
INFO: Cannot parse path "base"
LOG: started streaming WAL at 0/1D000000 (timeline 1)
[2022-10-03 14:08:52]: check identify system success
[2022-10-03 14:08:52]: send START_REPLICATION 0/1D000000 success
[2022-10-03 14:08:52]: keepalive message is received
[2022-10-03 14:08:52]: keepalive message is received
INFO: PGDATA size: 619MB
INFO: Start transferring data files
LOG: Creating page header map "/opt/mogdb/backup_dir/backups/instance1/RJ5YES/page_header_map"
INFO: Data files are transferred, time elapsed: 0
INFO: wait for pg_stop_backup()
INFO: pg_stop backup() successfully executed
LOG: stop_lsn: 0/1D000308
LOG: Looking for LSN 0/1D000308 in segment: 00000001000000000000001D
LOG: Found WAL segment: /opt/mogdb/backup_dir/backups/instance1/RJ5YES/database/pg_xlog/00000001000000000000001D
LOG: Thread [0]: Opening WAL segment "/opt/mogdb/backup_dir/backups/instance1/RJ5YES/database/pg_xlog/00000001000000000000001D"
LOG: Found LSN: 0/1D000308
[2022-10-03 14:08:57]:(null): not renaming "/opt/mogdb/backup_dir/backups/instance1/RJ5YES/database/pg_xlog/00000001000000000000001E", segment is not complete.
LOG: finished streaming WAL at 0/1E0000C8 (timeline 1)
LOG: Getting the Recovery Time from WAL
LOG: Thread [0]: Opening WAL segment "/opt/mogdb/backup_dir/backups/instance1/RJ5YES/database/pg_xlog/00000001000000000000001D"
INFO: Syncing backup files to disk
INFO: Backup files are synced, time elapsed: 0
INFO: Validating backup RJ5YES
INFO: Backup RJ5YES data files are valid
INFO: Backup RJ5YES resident size: 651MB
INFO: Backup RJ5YES completed

```



### (2) 构建测试环境

- 创建一个还原点
```sql
[omm@node1 ~]$ gsql -d postgres -p26000 -r
gsql ((openGauss 3.1.0 build 2c0ccaf9) compiled at 2022-09-25 19:32:58 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=# select pg_create_restore_point('restore_1');
 pg_create_restore_point
-------------------------
 0/1E0001B8
(1 row)

```
- 创建测试表 t1

```sql
openGauss=# create table t1(id int);
CREATE TABLE
openGauss=# insert into t1 values(1);
INSERT 0 1
openGauss=# select pg_switch_xlog();
 pg_switch_xlog
----------------
 0/1E002038
(1 row)

openGauss=# select pg_switch_xlog();
 pg_switch_xlog
----------------
 0/1F000208
(1 row)


openGauss=#

```

- 记录位置

```sql
openGauss=# select pg_current_xlog_location(),pg_xlogfile_name(pg_current_xlog_location()),txid_current(),now();
 pg_current_xlog_location |     pg_xlogfile_name     | txid_current |              now
--------------------------+--------------------------+--------------+-------------------------------
 0/200001E8               | 000000010000000000000020 |        21140 | 2022-10-03 14:09:52.749551+08
(1 row)

```

- 创建测试表 t2

```sql
openGauss=# create table t2(id int);
CREATE TABLE
openGauss=# insert into t2 values(2);
INSERT 0 1
openGauss=# select pg_switch_xlog();
 pg_switch_xlog
----------------
 0/20002088
(1 row)

openGauss=# select pg_switch_xlog();
 pg_switch_xlog
----------------
 0/21000288
(1 row)

```

- 记录位置

```sql
openGauss=# select pg_current_xlog_location(),pg_xlogfile_name(pg_current_xlog_location()),txid_current(),now();
 pg_current_xlog_location |     pg_xlogfile_name     | txid_current |              now
--------------------------+--------------------------+--------------+-------------------------------
 0/220001E8               | 000000010000000000000022 |        21145 | 2022-10-03 14:10:09.813644+08
(1 row)

```


### (3) 恢复

```sql
[omm@node1 ~]$ gs_ctl stop -D /opt/mogdb/data
[2022-10-03 14:10:29.933][18256][][gs_ctl]: gs_ctl stopped ,datadir is /opt/mogdb/data
waiting for server to shut down.... done
server stopped
[omm@node1 ~]$ mv /opt/mogdb/data /opt/mogdb/data.bak
[omm@node1 ~]$ gs_probackup show -B /opt/mogdb/backup_dir/

BACKUP INSTANCE 'instance1'
====================================================================================================================================
 Instance   Version  ID      Recovery Time           Mode  WAL Mode  TLI  Time   Data   WAL  Zratio  Start LSN   Stop LSN    Status
====================================================================================================================================
 instance1  9.2      RJ5YES  2022-10-03 14:08:52+08  FULL  STREAM    1/0    5s  635MB  16MB    0.97  0/1D000028  0/1D000308  OK
[omm@node1 ~]$  gs_probackup restore -B /opt/mogdb/backup_dir/ -D /opt/mogdb/data --instance instance1 -i RJ5YES
LOG: Restore begin.
LOG: there is no file tablespace_map
LOG: check tablespace directories of backup RJ5YES
LOG: check external directories of backup RJ5YES
WARNING: Process 18188 which used backup RJ5YES no longer exists
INFO: Validating backup RJ5YES
INFO: Backup RJ5YES data files are valid
LOG: Thread [1]: Opening WAL segment "/opt/mogdb/backup_dir/backups/instance1/RJ5YES/database/pg_xlog/00000001000000000000001D"
INFO: Backup RJ5YES WAL segments are valid
INFO: Backup RJ5YES is valid.
INFO: Restoring the database from backup at 2022-10-03 14:08:52+08
LOG: there is no file tablespace_map
LOG: Restore directories and symlinks...
INFO: Start restoring backup files. PGDATA size: 635MB
LOG: Start thread 1
INFO: Backup files are restored. Transfered bytes: 651MB, time elapsed: 1s
INFO: Restore incremental ratio (less is better): 103% (651MB/635MB)
INFO: Syncing restored files to disk
INFO: Restored backup files are synced, time elapsed: 0
INFO: Restore of backup RJ5YES completed.


```


### (4) recovery.conf

- 文件配置介绍

```sql
####  归档恢复配置  ####
restore_command = 'cp /gauss/bak/archive/%f %p'                      ## 该SHELL命令获取已归档的WAL文件。
archive_cleanup_command = 'pg_archivecleanup /gauss/bak/archive %r'  ## 清理备库WAL归档日志的shell命令，每次重启时会执行
recovery_end_command = string                                        ## (可选) 在恢复完成时执行的SHELL命令,为以后的复制或恢复提供一个清理机制
## 说明：
##  %f即归档检索中的文件名，%p即复制目的地的路径名，%r最新可用重启点的文件名
##  如果多个备机从相同的归档路径恢复时，需要确保该路径存在所有备机恢复所需要的WAL文件。
 
#### 恢复目标设置(四选一) ####
recovery_target_name = 'restore_point_1'      ## 还原到一个使用pg_create_restore_point()创建的还原点
recovery_target_time = '2020-01-01 12:00:00'  ## 还原到一个指定时间戳
recovery_target_xid = '3000'                  ## 还原到一个事务ID
recovery_target_lsn = '0/0FFFFFF'             ## 还原到日志的指定LSN点
recovery_target_inclusive = true              ## 声明是否在指定恢复目标之后停止(true) 或 之前停止(false),不支持recovery_target_name 配置
## 注意：如果不配置任何恢复目标 或 配置目标不存在，则默认恢复到最新的WAL日志点。
```
## 2. 基于还原点

- 恢复
```sql
[omm@node1 data]$ cat /opt/mogdb/data/recovery.conf
restore_command = 'cp /opt/mogdb/data.bak/pg_xlog/%f %p'
recovery_target_name = 'restore_1'      ## 恢复到指定的还原点restore_point_1,此时还没有创建表t1和t2
##recovery_target_xid = '21140' ## 表t1存在,t2不存在
##recovery_target_lsn = '0/220001E8' ## 表t1,t2在
##recovery_target_time = '2022-10-03 14:10:10' ## 表t1存在,t2存在
recovery_target_inclusive = true
```
```sql
[omm@node1 data]$ gs_ctl start -D /opt/mogdb/data
[2022-10-03 13:18:41.285][14515][][gs_ctl]: gs_ctl started,datadir is /opt/mogdb/data
[2022-10-03 13:18:41.310][14515][][gs_ctl]: waiting for server to start...
...
...
[2022-10-03 13:18:42.331][14515][][gs_ctl]:  done
[2022-10-03 13:18:42.331][14515][][gs_ctl]: server started (/opt/mogdb/data)
```

- 查看数据
```sql
[omm@node1 data]$ gsql -d postgres -p26000 -r
gsql ((openGauss 3.1.0 build 2c0ccaf9) compiled at 2022-09-25 19:32:58 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=# \d
```

- 查看日志
```sql
[omm@node1 data]$ grep -C 3 "restore_1" /opt/mogdb/log/pg_log/dn_6001/postgresql-2022-10-03_141216.log
2022-10-03 14:12:16.326 [unknown] [unknown] localhost 47291718698752 0[0:0#0] 0 [BACKEND] LOG:  database system timeline: 11
2022-10-03 14:12:16.326 [unknown] [unknown] localhost 47291718698752 0[0:0#0] 0 [BACKEND] LOG:  database system was interrupted; last known up at 2022-10-03 14:08:52 CST
2022-10-03 14:12:16.326 [unknown] [unknown] localhost 47291718698752 0[0:0#0] 0 [BACKEND] LOG:  creating missing WAL directory "pg_xlog/archive_status"
2022-10-03 14:12:16.327 [unknown] [unknown] localhost 47291718698752 0[0:0#0] 0 [BACKEND] LOG:  starting point-in-time recovery to "restore_1"
2022-10-03 14:12:16.327 [unknown] [unknown] localhost 47291718698752 0[0:0#0] 0 [BACKEND] LOG:  request archive recovery due to backup label file
2022-10-03 14:12:16.337 [unknown] [unknown] localhost 47291718698752 0[0:0#0] 0 [BACKEND] LOG:  restored log file "00000001000000000000001D" from archive
2022-10-03 14:12:16.352 [unknown] [unknown] localhost 47291718698752 0[0:0#0] 0 [DBL_WRT] LOG:  Init of double write for ext finished.
```


## 3. 基于xid

- 恢复

```sql
[omm@node1 data]$ cat /opt/mogdb/data/recovery.conf
restore_command = 'cp /opt/mogdb/data.bak/pg_xlog/%f %p'
##recovery_target_name = 'restore_1'      ## 恢复到指定的还原点restore_point_1,此时还没有创建表t1和t2
recovery_target_xid = '21140' ## 表t1存在,t2不存在
##recovery_target_lsn = '0/220001E8' ## 表t1,t2在
##recovery_target_time = '2022-10-03 14:10:10' ## 表t1存在,t2存在
recovery_target_inclusive = true
```

```sql
[omm@node1 data]$ gs_ctl restart -D /opt/mogdb/data
[2022-10-03 14:13:12.721][18392][][gs_ctl]: gs_ctl restarted ,datadir is /opt/mogdb/data
waiting for server to shut down... done
server stopped
[2022-10-03 14:13:13.737][18392][][gs_ctl]: waiting for server to start...
...
...
[2022-10-03 14:13:14.754][18392][][gs_ctl]:  done
[2022-10-03 14:13:14.754][18392][][gs_ctl]: server started (/opt/mogdb/data)

```


- 查看数据
```sql
[omm@node1 data]$ gsql -d postgres -p26000 -r
gsql ((openGauss 3.1.0 build 2c0ccaf9) compiled at 2022-09-25 19:32:58 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=# \d
                        List of relations
 Schema | Name | Type  | Owner |             Storage
--------+------+-------+-------+----------------------------------
 public | t1   | table | omm   | {orientation=row,compression=no}
(1 row)

openGauss=# \q

```
- 查看日志
```sql
[omm@node1 data]$ grep -C 3 "21140" /opt/mogdb/log/pg_log/dn_6001/postgresql-2022-10-03_141314.log
2022-10-03 14:13:14.384 [unknown] [unknown] localhost 47760400254720 0[0:0#0] 0 [BACKEND] LOG:  StartupXLOG: biggest_lsn_in_page is set to FFFFFFFF/FFFFFFFF, enable_update_max_page_flush_lsn:0
2022-10-03 14:13:14.384 [unknown] [unknown] localhost 47760400254720 0[0:0#0] 0 [BACKEND] LOG:  database system timeline: 12
2022-10-03 14:13:14.384 [unknown] [unknown] localhost 47760400254720 0[0:0#0] 0 [BACKEND] LOG:  database system was shut down in recovery at 2022-10-03 14:13:12 CST
2022-10-03 14:13:14.384 [unknown] [unknown] localhost 47760400254720 0[0:0#0] 0 [BACKEND] LOG:  starting point-in-time recovery to XID 21140
2022-10-03 14:13:14.393 [unknown] [unknown] localhost 47760400254720 0[0:0#0] 0 [BACKEND] LOG:  restored log file "00000001000000000000001D" from archive
2022-10-03 14:13:14.407 [unknown] [unknown] localhost 47760400254720 0[0:0#0] 0 [DBL_WRT] LOG:  Init of double write for ext finished.
2022-10-03 14:13:14.407 [unknown] [unknown] localhost 47760400254720 0[0:0#0] 0 [DBL_WRT] LOG:  Double Write init
--
2022-10-03 14:13:14.546 omm postgres localhost 47760799241984 0[0:0#0] 0 [BACKEND] LOG:  Mem-file chain of standby_statement_history_slow init done and online.
2022-10-03 14:13:14.556 [unknown] [unknown] localhost 47760400254720 0[0:0#0] 0 [BACKEND] LOG:  restored log file "000000010000000000000020" from archive
2022-10-03 14:13:14.569 [unknown] [unknown] localhost 47760400254720 0[0:0#0] 0 [BACKEND] LOG:  startup shut down walreceiver.
2022-10-03 14:13:14.589 [unknown] [unknown] localhost 47760400254720 0[0:0#0] 0 [BACKEND] LOG:  recovery stopping after commit of transaction 21140, time 2022-10-03 14:09:52.749923+08
2022-10-03 14:13:14.589 [unknown] [unknown] localhost 47760400254720 0[0:0#0] 0 [BACKEND] LOG:  recovery has paused
2022-10-03 14:13:14.589 [unknown] [unknown] localhost 47760400254720 0[0:0#0] 0 [BACKEND] HINT:  Execute pg_xlog_replay_resume() to continue.

```



## 4. 基于lsn

- 恢复
```sql
[omm@node1 data]$ cat /opt/mogdb/data/recovery.conf
restore_command = 'cp /opt/mogdb/data.bak/pg_xlog/%f %p'
##recovery_target_name = 'restore_1'      ## 恢复到指定的还原点restore_point_1,此时还没有创建表t1和t2
##recovery_target_xid = '21140' ## 表t1存在,t2不存在
recovery_target_lsn = '0/220001E8' ## 表t1,t2在
##recovery_target_time = '2022-10-03 14:10:10' ## 表t1存在,t2存在
recovery_target_inclusive = true
```
```sql
[2022-10-03 14:15:41.773][18494][][gs_ctl]: gs_ctl restarted ,datadir is /opt/mogdb/data
waiting for server to shut down... done
server stopped
[2022-10-03 14:15:42.790][18494][][gs_ctl]: waiting for server to start...
...
...

[2022-10-03 14:15:43.815][18494][][gs_ctl]:  done
[2022-10-03 14:15:43.815][18494][][gs_ctl]: server started (/opt/mogdb/data)

```


- 查看数据
```sql
[omm@node1 data]$ gsql -d postgres -p26000 -r
gsql ((openGauss 3.1.0 build 2c0ccaf9) compiled at 2022-09-25 19:32:58 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=# \d
                        List of relations
 Schema | Name | Type  | Owner |             Storage
--------+------+-------+-------+----------------------------------
 public | t1   | table | omm   | {orientation=row,compression=no}
 public | t2   | table | omm   | {orientation=row,compression=no}
(2 rows)


```
- 查看日志
```sql
[omm@node1 data]$ grep -A 5 "0/220001E8" /opt/mogdb/log/pg_log/dn_6001/postgresql-2022-10-03_141543.log
2022-10-03 14:15:43.465 [unknown] [unknown] localhost 47684535781120 0[0:0#0] 0 [BACKEND] LOG:  starting point-in-time recovery to WAL location (LSN) "0/220001E8"
2022-10-03 14:15:43.474 [unknown] [unknown] localhost 47684535781120 0[0:0#0] 0 [BACKEND] LOG:  restored log file "000000010000000000000020" from archive
2022-10-03 14:15:43.489 [unknown] [unknown] localhost 47684535781120 0[0:0#0] 0 [DBL_WRT] LOG:  Init of double write for ext finished.
2022-10-03 14:15:43.489 [unknown] [unknown] localhost 47684535781120 0[0:0#0] 0 [DBL_WRT] LOG:  Double Write init
2022-10-03 14:15:43.489 [unknown] [unknown] localhost 47684535781120 0[0:0#0] 0 [DBL_WRT] LOG:  Found a valid batch meta file info: dw_file_num [1], dw_file_size [256] MB, dw_version [92568]
2022-10-03 14:15:43.490 [unknown] [unknown] localhost 47684535781120 0[0:0#0] 0 [DBL_WRT] LOG:  Found a valid batch meta file info: dw_file_num [1], dw_file_size [256] MB, dw_version [92568]

```


## 5. 基于时间点

- 恢复

```sql
[omm@node1 data]$ cat /opt/mogdb/data/recovery.conf
restore_command = 'cp /opt/mogdb/data.bak/pg_xlog/%f %p'
##recovery_target_name = 'restore_1'      ## 恢复到指定的还原点restore_point_1,此时还没有创建表t1和t2
##recovery_target_xid = '21140' ## 表t1存在,t2不存在
##recovery_target_lsn = '0/220001E8' ## 表t1,t2在
recovery_target_time = '2022-10-03 14:10:10' ## 表t1存在,t2存在
recovery_target_inclusive = true
```

```sql
[omm@node1 data]$ gs_ctl restart -D /opt/mogdb/data
[2022-10-03 14:21:03.512][18649][][gs_ctl]: gs_ctl restarted ,datadir is /opt/mogdb/data
waiting for server to shut down... done
server stopped
[2022-10-03 14:21:04.528][18649][][gs_ctl]: waiting for server to start...
...
...
[2022-10-03 14:22:29.420][18711][][gs_ctl]:  done
[2022-10-03 14:22:29.420][18711][][gs_ctl]: server started (/opt/mogdb/data)


```
- 查看数据
```sql
[omm@node1 data]$ gsql -d postgres -p26000 -r
gsql ((openGauss 3.1.0 build 2c0ccaf9) compiled at 2022-09-25 19:32:58 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=# \d
                        List of relations
 Schema | Name | Type  | Owner |             Storage
--------+------+-------+-------+----------------------------------
 public | t1   | table | omm   | {orientation=row,compression=no}
 public | t2   | table | omm   | {orientation=row,compression=no}
(2 rows)
```
- 查看日志
```sql
[omm@node1 data]$ grep -C 3 "2022-10-03 14:10:10" /opt/mogdb/log/pg_log/dn_6001/postgresql-2022-10-03_142229.log
2022-10-03 14:22:29.082 [unknown] [unknown] localhost 47686791206656 0[0:0#0] 0 [BACKEND] LOG:  database system timeline: 15
2022-10-03 14:22:29.082 [unknown] [unknown] localhost 47686791206656 0[0:0#0] 0 [BACKEND] LOG:  database system was interrupted while in recovery at log time 2022-10-03 14:10:05 CST
2022-10-03 14:22:29.082 [unknown] [unknown] localhost 47686791206656 0[0:0#0] 0 [BACKEND] HINT:  If this has occurred more than once some data might be corrupted and you might need to choose an earlier recovery target.
2022-10-03 14:22:29.082 [unknown] [unknown] localhost 47686791206656 0[0:0#0] 0 [BACKEND] LOG:  starting point-in-time recovery to 2022-10-03 14:10:10+08
2022-10-03 14:22:29.091 [unknown] [unknown] localhost 47686791206656 0[0:0#0] 0 [BACKEND] LOG:  restored log file "000000010000000000000022" from archive
2022-10-03 14:22:29.100 [unknown] [unknown] localhost 47686791206656 0[0:0#0] 0 [DBL_WRT] LOG:  Init of double write for ext finished.
2022-10-03 14:22:29.100 [unknown] [unknown] localhost 47686791206656 0[0:0#0] 0 [DBL_WRT] LOG:  Double Write init

```

