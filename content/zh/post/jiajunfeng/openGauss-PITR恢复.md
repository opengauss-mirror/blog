+++

title = "openGauss PITR恢复"
date = "2020-01-12"
tags = ["openGauss备份与恢复"]
archives = "2021-01"
author = "贾军锋"
summary = "openGauss PITR恢复"
img =  "/zh/post/jiajunfeng/title/img33.png" 
times = "16:00"

+++

# openGauss PITR恢复<a name="ZH-CN_TOPIC_0000001073530568"></a>

当数据库崩溃或希望回退到数据库之前的某一状态时，openGauss的即时恢复功能\( Point-In-Time Recovery，简称PITR \)可以支持恢复到备份归档数据之后的任意时间点。

## 前提条件<a name="section1253973781011"></a>

基于物理备份的全量数据文件。  基于归档的WAL日志文件。

## 限制要求<a name="section446411566109"></a>

PITR仅支持恢复到物理备份数据之后的某一时间点。  仅主节点可以进行PITR恢复，备机需要进行全量build达成与主机数据同步。

## PITR恢复流程<a name="section8875141351114"></a>

1.  将物理备份的文件替换目标数据库目录。
2.  删除数据库目录下pg\_xlog/中的所有文件。
3.  将归档的WAL日志文件复制到pg\_xlog文件中（此步骤可以省略，通过配置recovery.conf恢复命令文件中的restore\_command项替代）。
4.  在数据库目录下创建恢复命令文件recovery.conf，指定数据库恢复的程度。
5.  启动数据库。
6.  连接数据库，查看是否恢复到希望预期的状态。
7.  若已经恢复到预期状态，通过pg\_xlog\_replay\_resume\(\)指令使主节点对外提供服务。

## recovery.conf 文件配置介绍<a name="section996910563114"></a>

```
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

## 物理备份\(源库\)并恢复\(至目标库\)<a name="section1566212417124"></a>

```
-- 源库物理备份
[omm@db1 ~]$ gs_basebackup -D /home/omm/gs_bak -h 192.168.0.225 -p 26000 -U omm -W
Password:
INFO:  The starting position of the xlog copy of the full build is: 0/10000028. The slot minimum LSN is: 0/0.
begin build tablespace list
finish build tablespace list
begin get xlog by xlogstream
 check identify system success
 send START_REPLICATION 0/10000000 success
 keepalive message is received
 keepalive message is received
 keepalive message is received

-- 在目标库物理恢复(物理恢复后暂不启动数据库)
mkdir /gauss1/data/db1
cp -r /home/omm/gs_bak/*  /gauss1/data/db1/
```

## 准备测试数据\(源库\)<a name="section3907133101313"></a>

**记录操作的起始位置**

```
-- 创建一个还原点restore_point_1
mydb=# select pg_create_restore_point('restore_point_1');
 pg_create_restore_point
-------------------------
 0/110003B0
```

**创建测试数据t1表\(源库\)**

```
-- 创建表t1并插入数据
mydb=# create table t1(name varchar(20));
CREATE TABLE
mydb=# insert into t1 values('This is 0/110004B8');
INSERT 0 1
mydb=# select pg_switch_xlog();
 pg_switch_xlog
----------------
 0/11001ED0
mydb=# select pg_switch_xlog();
 pg_switch_xlog
----------------
 0/12000150
```

**记录第一次数据插入后的数据库位置**

```
-- 查看最近提交的XID(latestCompletedXid-->10006 || nextXid-->10007)
mydb=# \pset expanded
Expanded display is on.
mydb=# select * from pg_get_variable_info();
-[ RECORD 1 ]---------+------------
node_name             | db1
nextOid               | 16550
nextXid               | 10007
oldestXid             | 6742
xidVacLimit           | 20000006742
oldestXidDB           | 14853
lastExtendCSNLogpage  | 9
startExtendCSNLogpage | 0
nextCommitSeqNo       | 2128
latestCompletedXid    | 10006
startupMaxXid         | 10005
mydb=# \pset expanded
Expanded display is off.
```

**创建测试数据t2表\(源库\)**

```
-- 创建表t2并插入数据
mydb=# create table t2(name varchar(20));
CREATE TABLE
mydb=# insert into t2 values('This is 0/130002A8');
INSERT 0 1
mydb=# select pg_current_xlog_location();
 pg_current_xlog_location
--------------------------
 0/13001C98
mydb=# select pg_switch_xlog();
 pg_switch_xlog
----------------
 0/13001CB8
mydb=# select pg_switch_xlog();
 pg_switch_xlog
----------------
 0/14000150
```

**记录第二次数据插入后的数据库位置**

```
-- 查询当前LSN
mydb=# select pg_current_xlog_location();
 pg_current_xlog_location
--------------------------
 0/150002A8
```

## PITR恢复测试<a name="section214934101718"></a>

**拷贝源库的WAL日志至目标机器**

```
-- 拷贝源库的WAL日志至目标机器的归档路径下(/gauss1/bak/archive)
[omm@client ~]$ scp  192.168.0.225:/gauss/data/db1/pg_xlog/*  /gauss1/bak/archive
```

**配置recovery.conf文件\(目标库基于还原点restore\_point\_1恢复\)**

```
[omm@client ~]$ cd /gauss1/data/db1/
[omm@client db1]$ vi recovery.conf
--------------------------
restore_command = 'cp /gauss1/bak/archive/%f %p'
archive_cleanup_command = 'pg_archivecleanup /gauss1/bak/archive  %r'
recovery_target_name = 'restore_point_1'      ## 恢复到指定的还原点restore_point_1,此时还没有创建表t1和t2
recovery_target_inclusive = true
--------------------------
```

**第一阶段恢复\(恢复至还原点:restore\_point\_1\)**

```
-- 启动数据库并查看数据
[omm@client dn_6001]$ gs_ctl start -D /gauss1/data/db1/
[omm@client dn_6001]$ gsql -d mydb -p 26000 -U omm -r
mydb=# select pg_is_in_recovery();    -- 检查当前数据库是否处于恢复状态
 pg_is_in_recovery
-------------------
 t

-- 表t1和t2都不存在，且处于恢复状态数据库无法使用函数查看LSN位置，该数据库只读
mydb=# \d t1
Did not find any relation named "t1".
mydb=# \d t2
Did not find any relation named "t2".
mydb=# select pg_current_xlog_location();
ERROR:  recovery is in progress
HINT:  WAL control functions cannot be executed during recovery.
CONTEXT:  referenced column: pg_current_xlog_location

-- 通过日志可以看到，我们指定的还原点restore_point_1已生效，数据库恢复至该还原点后，恢复任务已暂停(paused)
[omm@client db1]$ grep -C 3 "restore_point_1" /gauss1/data/db1/pg_log/postgresql-2020-12-29_155116.log
2020-12-29 15:51:16.898 [MOT] <TID:27615/01023> <SID:-----/-----> [INFO]     <JitExec>            Using native LLVM version 7.0.0
2020-12-29 15:51:16.899 [unknown] [unknown] localhost 140086181410560 0 0 [BACKEND] LOG:  database system timeline: 14
2020-12-29 15:51:16.899 [unknown] [unknown] localhost 140086181410560 0 0 [BACKEND] LOG:  database system was interrupted; last known up at 2020-12-29 15:41:06 CST
2020-12-29 15:51:16.906 [unknown] [unknown] localhost 140086181410560 0 0 [BACKEND] LOG:  starting point-in-time recovery to "restore_point_1"
2020-12-29 15:51:16.906 [unknown] [unknown] localhost 140086181410560 0 0 [BACKEND] LOG:  request archive recovery due to backup label file
2020-12-29 15:51:16.949 [unknown] [unknown] localhost 140086181410560 0 0 [BACKEND] LOG:  restored log file "000000010000000000000010" from archive
2020-12-29 15:51:17.038 [unknown] [unknown] localhost 140086181410560 0 0 [DBL_WRT] LOG:  Double write init
--
2020-12-29 15:51:20.212 [unknown] [unknown] localhost 140086875776064 0 0 [BACKEND] LOG:  auditor process started, pid=140085970310912
2020-12-29 15:51:20.214 [unknown] [unknown] localhost 140085987092224 0 0 [BACKEND] LOG:  [Pgstat] statfile global/pgstat.stat is missing, using empty dbhash.
2020-12-29 15:51:20.257 [unknown] [unknown] localhost 140086181410560 0 0 [BACKEND] LOG:  restored log file "000000010000000000000011" from archive
2020-12-29 15:51:20.293 [unknown] [unknown] localhost 140086181410560 0 0 [BACKEND] LOG:  recovery stopping at restore point "restore_point_1", time 2020-12-29 15:42:57.37431+08
2020-12-29 15:51:20.293 [unknown] [unknown] localhost 140086181410560 0 0 [BACKEND] LOG:  recovery has paused
2020-12-29 15:51:20.293 [unknown] [unknown] localhost 140086181410560 0 0 [BACKEND] HINT:  Execute pg_xlog_replay_resume() to continue.
2020-12-29 15:51:20.521 omm postgres db1.opengauss.com 140085919975168 0 0 [BACKEND] FATAL:  no pg_hba.conf entry for host "192.168.0.225", user "omm", database "postgres", SSL off
```

**第二阶段恢复\(恢复至xid = ‘10006’\)**

```
-- 修改recovery_target，继续往前恢复
[omm@client db1]$ vi recovery.conf
--------------------------
# 根据前面的信息得知，xid=10006这个事务完毕时，仅有t1表，没有t2表
# 我们这一阶段仅恢复t1表即可
# 修改：
recovery_target_xid = '10006'  
--------------------------

-- 重启恢复测试数据
[omm@client db1]$ gs_ctl stop -D /gauss1/data/db1/
[omm@client db1]$ gs_ctl start -D /gauss1/data/db1/
[omm@client db1]$ gsql -d mydb -p 26000 -U omm -r
mydb=# select pg_is_in_recovery();
 pg_is_in_recovery
-------------------
 t

-- 此时数据仅恢复了表t1，并未恢复表t2，实验结果满足预期目标
mydb=# select * from t1;
        name
--------------------
 This is 0/110004B8
mydb=# select * from t2;
ERROR:  relation "t2" does not exist on db1
LINE 1: select * from t2;
                      ^

-- 从日志中我们也可以看到，数据库恢复至xid=10006后，恢复任务暂停(paused)
[omm@client db1]$ grep -C 3 "10006" /gauss1/data/db1/pg_log/postgresql-2020-12-29_161204.log
2020-12-29 16:12:04.855 [MOT] <TID:28299/01023> <SID:-----/-----> [INFO]     <JitExec>            Using native LLVM version 7.0.0
2020-12-29 16:12:04.855 [unknown] [unknown] localhost 140390247479040 0 0 [BACKEND] LOG:  database system timeline: 15
2020-12-29 16:12:04.855 [unknown] [unknown] localhost 140390247479040 0 0 [BACKEND] LOG:  database system was shut down in recovery at 2020-12-29 16:11:44 CST
2020-12-29 16:12:04.862 [unknown] [unknown] localhost 140390247479040 0 0 [BACKEND] LOG:  starting point-in-time recovery to XID 10006
2020-12-29 16:12:04.895 [unknown] [unknown] localhost 140390247479040 0 0 [BACKEND] LOG:  restored log file "000000010000000000000011" from archive
2020-12-29 16:12:05.001 [unknown] [unknown] localhost 140390247479040 0 0 [DBL_WRT] LOG:  Double write init
2020-12-29 16:12:05.010 [unknown] [unknown] localhost 140390247479040 0 0 [DBL_WRT] LOG:  Found a valid file header: id 0, file_head[dwn 2, start 1]
--
2020-12-29 16:12:05.147 [unknown] [unknown] localhost 140390105601792 0 0 [INCRE_CKPT] LOG:  PageWriter started, thread id is 1
2020-12-29 16:12:05.149 [unknown] [unknown] localhost 140390088820480 0 0 [INCRE_BG_WRITER] LOG:  bgwriter started, thread id is 0
2020-12-29 16:12:05.150 [unknown] [unknown] localhost 140390072039168 0 0 [INCRE_BG_WRITER] LOG:  bgwriter started, thread id is 1
2020-12-29 16:12:05.158 [unknown] [unknown] localhost 140390247479040 0 0 [BACKEND] LOG:  recovery stopping after commit of transaction 10006, time 2020-12-29 15:44:43.750625+08
2020-12-29 16:12:05.158 [unknown] [unknown] localhost 140390247479040 0 0 [BACKEND] LOG:  recovery has paused
2020-12-29 16:12:05.158 [unknown] [unknown] localhost 140390247479040 0 0 [BACKEND] HINT:  Execute pg_xlog_replay_resume() to continue.
2020-12-29 16:12:05.158 [unknown] [unknown] localhost 140390942086208 0 0 [BACKEND] LOG:  gaussdb: fsync file "/gauss1/data/db1/gaussdb.state.temp" success
```

**第三阶段恢复\(恢复至lsn = ‘0/150002A8’\)**

```
-- 修改recovery_target，继续往前恢复
[omm@client db1]$ vi recovery.conf
--------------------------
# 根据前面的信息得知，lsn='0/150002A8'这个LSN位置时，t1表和t2表已经创建完毕
# 修改：
recovery_target_lsn = '0/150002A8'
--------------------------

-- 重启恢复测试数据
[omm@client db1]$ gs_ctl stop -D /gauss1/data/db1/
[omm@client db1]$ gs_ctl start -D /gauss1/data/db1/
[omm@client db1]$ gsql -d mydb -p 26000 -U omm -r
mydb=# select pg_is_in_recovery();
 pg_is_in_recovery
-------------------
 t

-- 此时t1表和t2表已恢复，实验结果满足预期目标
mydb=# select * from t1;
        name
--------------------
 This is 0/110004B8
mydb=# select * from t2;
        name
--------------------
 This is 0/130002A8

-- 从日志中我们也可以看到，数据库恢复至LSN=0/150002A8后，检测到Double-write日志后续内容为空(Empty)，则认为数据库已恢复至最新状态，此时恢复任务结束(Finish)
[omm@client db1]$ grep -A 5 "0/150002A8" /gauss1/data/db1/pg_log/postgresql-2020-12-29_161921.log
2020-12-29 16:19:21.809 [unknown] [unknown] localhost 140439224366848 0 0 [BACKEND] LOG:  starting point-in-time recovery to WAL location (LSN) "0/150002A8"
2020-12-29 16:19:21.846 [unknown] [unknown] localhost 140439224366848 0 0 [BACKEND] LOG:  restored log file "000000010000000000000011" from archive
2020-12-29 16:19:21.929 [unknown] [unknown] localhost 140439224366848 0 0 [DBL_WRT] LOG:  Double write init
2020-12-29 16:19:21.946 [unknown] [unknown] localhost 140439224366848 0 0 [DBL_WRT] LOG:  Found a valid file header: id 0, file_head[dwn 4, start 26]
2020-12-29 16:19:21.992 [unknown] [unknown] localhost 140439224366848 0 0 [DBL_WRT] LOG:  DW recovery state: "Empty", file start page[dwn 4, start 26], now access page 0, current [page_id 26, dwn 2, checksum verify res is 1, page_num orig 0, page_num fixed 0]
2020-12-29 16:19:21.992 [unknown] [unknown] localhost 140439224366848 0 0 [DBL_WRT] LOG:  DW recovery state: "Finish", file start page[dwn 4, start 26], now access page 0, current [page_id 26, dwn 2, checksum verify res is 1, page_num orig 0, page_num fixed 0]
```

**手动结束PITR状态**

当未将数据库恢复至最新时刻状态时，此时需要手动结束PITR恢复任务。

```
-- 查询数据库恢复状态
postgres=# select pg_is_in_recovery();
 pg_is_in_recovery
-------------------
 t

-- 结束恢复，使机器对外提供读写服务
postgres=# select pg_xlog_replay_resume();
 pg_xlog_replay_resume
-----------------------

-- 查询数据库恢复状态(已结束)
postgres=# select pg_is_in_recovery();
 pg_is_in_recovery
-------------------
 f
```

