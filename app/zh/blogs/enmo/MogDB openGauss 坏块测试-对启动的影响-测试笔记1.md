---
title: 'MogDB/openGauss 坏块测试-对启动的影响-测试笔记1'

date: '2022-05-18'

category: 'blog'
tags: ['MogDB/openGauss 坏块测试-对启动的影响-测试笔记1']

archives: '2022-05'

author: '云和恩墨-范计杰'

summary: 'MogDB/openGauss 坏块测试-对启动的影响-测试笔记1'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# MogDB/openGauss 坏块测试-对启动的影响-测试笔记 1

本文出处：[https://www.modb.pro/db/398511](https://www.modb.pro/db/398511)

在 UPDATE 操作提交后，脏块落盘前 kill 掉 mogdb 数据库，然后对 UPDATE 修改的坏进行以下破坏操作，仍然能够启动数据库，数据未丢失。

1、用旧数据文件替换，可以启动
2、修改成错误的 checksum，可以启动
3、数据块修改成错误的 lsn,可以启动
4、dd 一个数据块为 0,可以启动

full_page_writes 打开时，每次 checkpoint 后第一次修改的块，会在 wal 中记录完整副本，recover 时直接使用该副本重写数据文件中的块。

```
[omm2@og01 ~]$ gsql
gsql ((MogDB 2.1.0 build 56189e20) compiled at 2022-01-07 18:47:53 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.



omm2=# drop table t;
DROP TABLE


omm2=# create table t(id numeric,c varchar(100)) with (fillfactor=50);
CREATE TABLE
omm2=# insert into t select i,'test'||i from generate_series(1,1000)i;
INSERT 0 100
omm2=# checkpoint;
CHECKPOINT


select (select setting from pg_settings where name='data_directory')||'/'||pg_relation_filepath('t');


omm2=# select (select setting from pg_settings where name='data_directory')||'/'||pg_relation_filepath('t');
             ?column?
----------------------------------
 /home/omm2/data/base/16385/73775
(1 row)



[omm2@og01 ~]$ cp /home/omm2/data/base/16385/73775 /home/omm2/data/base/16385/73775_old
[omm2@og01 ~]$



omm2=# select ctid,id from t;
  ctid  | id
--------+-----
 (0,1)  |   1
 (0,2)  |   2
 (0,3)  |   3
 (0,4)  |   4
 (0,5)  |   5
 (0,6)  |   6
 (0,7)  |   7
 (0,8)  |   8
 (0,9)  |   9
 (0,10) |  10
 (0,11) |  11
 (0,12) |  12
 (0,13) |  13
 (0,14) |  14
 (0,15) |  15


omm2=# update t set c='a' where id<3;
UPDATE 2
omm2=#
omm2=# checkpoint;
CHECKPOINT


[omm2@og01 ~]$ ps -ef |grep mogdb
omm2     25231     1  3 15:17 pts/0    00:00:04 /home/omm2/mogdb210/bin/mogdb
omm2     26265 20027  0 15:19 pts/1    00:00:00 grep --color=auto mogdb




omm2=# update t set c='b' where id<500;
UPDATE 499


[omm2@og01 ~]$  kill -9 25231


---用旧数据文件替换，可以启动

cp /home/omm2/data/base/16385/73775 /home/omm2/data/base/16385/73775_bak

cp /home/omm2/data/base/16385/73775_old /home/omm2/data/base/16385/73775


gs_ctl start



2022-04-26 15:21:26.028 [unknown] [unknown] localhost 139810735888128 0[0:0#0]  0 [BACKEND] LOG:  undo launcher started
2022-04-26 15:21:26.066 omm2 postgres localhost 139810614208256 0[0:0#0]  0 [BACKEND] LOG:  instrumention percentile started
2022-04-26 15:21:26.067 [unknown] [unknown] localhost 139810414786304 0[0:0#0]  0 [UNDO] LOG:  [UndoRecycleMain:362]undo recycle started.
2022-04-26 15:21:26.069 omm2 postgres localhost 139810580645632 0[0:0#0]  0 [BACKEND] LOG:  statement flush thread start
2022-04-26 15:21:26.069 omm2 postgres localhost 139810479863552 0[0:0#0]  0 [BACKEND] LOG:  process wlm thread starting up.
2022-04-26 15:21:26.069 omm2 postgres localhost 139810479863552 0[0:0#0]  0 [BACKEND] LOG:  build user data finished
2022-04-26 15:21:26.070 omm2 postgres localhost 139810463082240 0[0:0#0]  0 [BACKEND] LOG:  WLMmonitor thread is starting up.
2022-04-26 15:21:26.070 omm2 postgres localhost 139810446300928 0[0:0#0]  0 [BACKEND] LOG:  WLMarbiter thread is starting up.
2022-04-26 15:21:26.076 omm2 postgres localhost 139810597426944 0[0:0#0]  0 [BACKEND] LOG:  ASP thread start
2022-04-26 15:21:40.996 [unknown] [unknown] localhost 139810836576000 0[0:0#0]  0 [BACKEND] LOG:  database first startup and recovery finish,so do checkpointer
2022-04-26 15:21:40.997 [MOT] <TID:27119/-----> <SID:-----/-----> [INFO]     <Checkpoint>         Creating MOT checkpoint snapshot: id: 1650957700
2022-04-26 15:21:40.997 [MOT] <TID:27119/-----> <SID:-----/-----> [INFO]     <Checkpoint>         MOT snapshot ready. id: 1650957700, lsn: 0
2022-04-26 15:21:40.997 [unknown] [unknown] localhost 139810836576000 0[0:0#0]  0 [SLRU] LOG:  remove old segments(<0) under pg_csnlog
2022-04-26 15:21:40.997 [unknown] [unknown] localhost 139810836576000 0[0:0#0]  0 [BACKEND] LOG:  truncate CSN log oldestXact 46536, next xid 46539
2022-04-26 15:21:41.000 [unknown] [unknown] localhost 139810836576000 0[0:0#0]  0 [SLRU] LOG:  remove old segments(<0) under pg_multixact/offsets
2022-04-26 15:21:41.000 [unknown] [unknown] localhost 139810836576000 0[0:0#0]  0 [SLRU] LOG:  remove old segments(<0) under pg_multixact/members
2022-04-26 15:21:41.005 [unknown] [unknown] localhost 139810836576000 0[0:0#0]  0 [UNDO] LOG:  [CheckPointUndoSystemMeta:353]undo metadata checkPointRedo = 349161880.
2022-04-26 15:21:41.009 [MOT] <TID:27119/-----> <SID:-----/-----> [INFO]     <Checkpoint>         MOT begin checkpoint capture. id: 1650957700, lsn: 349161880
2022-04-26 15:21:41.010 [MOT] <TID:27257/00000> <SID:00004/00000> [INFO]     <GC>                 GC PARAMS: isGcEnabled = true, limboSizeLimit = 524288, limboSizeLimitHigh = 8388608, rcuFreeCount = 8192
2022-04-26 15:21:41.011 [MOT] <TID:27258/00000> <SID:00006/00000> [INFO]     <GC>                 GC PARAMS: isGcEnabled = true, limboSizeLimit = 524288, limboSizeLimitHigh = 8388608, rcuFreeCount = 8192
2022-04-26 15:21:41.113 [MOT] <TID:27119/-----> <SID:-----/-----> [INFO]     <Checkpoint>         Checkpoint [1650957700] completed
2022-04-26 15:21:41.112 [unknown] [unknown] localhost 139810836576000 0[0:0#0]  0 [BACKEND] WARNING:  replicationSlotMinLSN is InvalidXLogRecPtr!!!
2022-04-26 15:21:41.112 [unknown] [unknown] localhost 139810836576000 0[0:0#0]  0 [BACKEND] WARNING:  replicationSlotMaxLSN is InvalidXLogRecPtr!!!
2022-04-26 15:21:41.113 [unknown] [unknown] localhost 139810836576000 0[0:0#0]  0 [BACKEND] LOG:  CreateCheckPoint PrintCkpXctlControlFile: [checkPoint] oldCkpLoc:0/14CA2AC8, oldRedo:0/14CA2A48, newCkpLoc:0/14CFCA18, newRedo:0/14CFC998, preCkpLoc:0/14CA2AC8
2022-04-26 15:21:41.113 [unknown] [unknown] localhost 139810836576000 0[0:0#0]  0 [BACKEND] LOG:  will update control file (create checkpoint), shutdown:0
2022-04-26 15:21:41.115 [unknown] [unknown] localhost 139810836576000 0[0:0#0]  0 [BACKEND] LOG:  attempting to remove WAL segments older than log file 000000010000000000000002
2022-04-26 15:22:29.772 omm2 postgres localhost 139810250028800 0[0:0#0]  0 [BACKEND] LOG:  clean statement thread start


omm2=# select * from t where id<10;
 id | c
----+---
  3 | b
  4 | b
  5 | b
  6 | b
  7 | b
  8 | b
  9 | b
  1 | b
  2 | b
(9 rows)


omm2=# vacuum t;
VACUUM


omm2=# checkpoint;
CHECKPOINT

---修改成错误的checksum，可以启动


[omm2@og01 dump]$ ./dump -file /home/omm2/data/base/16385/73775  -bs 8192 -n 0 -decoder pg_header
{0 [] 24 map[Pd_checksum:0xc0000682d0 Pd_flags:0xc000068330 Pd_lower:0xc000068390 Pd_lsn:0xc000068240 Pd_pagesize_version:0xc0000684b0 Pd_prune_xid:0xc000068510 Pd_special:0xc000068450 Pd_upper:0xc0000683f0] [0xc000068240 0xc0000682d0 0xc000068330 0xc000068390 0xc0000683f0 0xc000068450 0xc0000684b0 0xc000068510]}
======read and dump block 0=======
@0    Pd_lsn                         size:8    hex:0x14d4834000000000             val:1500968886722363392
@8    Pd_checksum                    size:2    hex:0x4263                         val:16995
@10   Pd_flags                       size:2    hex:0x45                           val:69
@12   Pd_lower                       size:2    hex:0x310                          val:784
@14   Pd_upper                       size:2    hex:0x1480                         val:5248
@16   Pd_special                     size:2    hex:0x2000                         val:8192
@18   Pd_pagesize_version            size:2    hex:0x2006                         val:8198
@20   Pd_prune_xid                   size:4    hex:0x0                            val:0
[omm2@og01 dump]$


omm2=# update t set c='c' where id<500;
UPDATE 499


[omm2@og01 dump]$ kill -9 27074

./dump -file /home/omm2/data/base/16385/73775  -bs 8192 -n 0 -decoder pg_header
{0 [] 24 map[Pd_checksum:0xc00008c2d0 Pd_flags:0xc00008c330 Pd_lower:0xc00008c390 Pd_lsn:0xc00008c240 Pd_pagesize_version:0xc00008c4b0 Pd_prune_xid:0xc00008c510 Pd_special:0xc00008c450 Pd_upper:0xc00008c3f0] [0xc00008c240 0xc00008c2d0 0xc00008c330 0xc00008c390 0xc00008c3f0 0xc00008c450 0xc00008c4b0 0xc00008c510]}
======read and dump block 0=======
@0    Pd_lsn                         size:8    hex:0x14d4834000000000             val:1500968886722363392
@8    Pd_checksum                    size:2    hex:0x4263                         val:16995
@10   Pd_flags                       size:2    hex:0x45                           val:69
@12   Pd_lower                       size:2    hex:0x310                          val:784
@14   Pd_upper                       size:2    hex:0x1480                         val:5248
@16   Pd_special                     size:2    hex:0x2000                         val:8192
@18   Pd_pagesize_version            size:2    hex:0x2006                         val:8198
@20   Pd_prune_xid                   size:4    hex:0x0                            val:0
[omm2@og01 dump]$


./dump -file /home/omm2/data/base/16385/73775  -bs 8192 -n 0 -decoder pg_header -setname Pd_checksum -setval uint16#10

[omm2@og01 dump]$ ./dump -file /home/omm2/data/base/16385/73775  -bs 8192 -n 0 -decoder pg_header -setname Pd_checksum -setval uint16#10
{0 [] 24 map[Pd_checksum:0xc00008e2d0 Pd_flags:0xc00008e330 Pd_lower:0xc00008e390 Pd_lsn:0xc00008e240 Pd_pagesize_version:0xc00008e4b0 Pd_prune_xid:0xc00008e510 Pd_special:0xc00008e450 Pd_upper:0xc00008e3f0] [0xc00008e240 0xc00008e2d0 0xc00008e330 0xc00008e390 0xc00008e3f0 0xc00008e450 0xc00008e4b0 0xc00008e510]}
======read and dump block 0=======
@0    Pd_lsn                         size:8    hex:0x14d4834000000000             val:1500968886722363392
@8    Pd_checksum                    size:2    hex:0x4263                         val:16995
@10   Pd_flags                       size:2    hex:0x45                           val:69
@12   Pd_lower                       size:2    hex:0x310                          val:784
@14   Pd_upper                       size:2    hex:0x1480                         val:5248
@16   Pd_special                     size:2    hex:0x2000                         val:8192
@18   Pd_pagesize_version            size:2    hex:0x2006                         val:8198
@20   Pd_prune_xid                   size:4    hex:0x0                            val:0
===============after modify================
@0    Pd_lsn                         size:8    hex:0x14d4834000000000             val:1500968886722363392
@8    Pd_checksum                    size:2    hex:0xa                            val:10
@10   Pd_flags                       size:2    hex:0x45                           val:69
@12   Pd_lower                       size:2    hex:0x310                          val:784
@14   Pd_upper                       size:2    hex:0x1480                         val:5248
@16   Pd_special                     size:2    hex:0x2000                         val:8192
@18   Pd_pagesize_version            size:2    hex:0x2006                         val:8198
@20   Pd_prune_xid                   size:4    hex:0x0                            val:0
[omm2@og01 dump]$

gs_ctl start


2022-04-26 15:29:50.790 [unknown] [unknown] localhost 139845378766592 0[0:0#0]  0 [UNDO] LOG:  [CheckPointUndoSystemMeta:353]undo metadata checkPointRedo = 350150888.
2022-04-26 15:29:50.794 [MOT] <TID:30886/-----> <SID:-----/-----> [INFO]     <Checkpoint>         MOT begin checkpoint capture. id: 1650958190, lsn: 350150888
2022-04-26 15:29:50.795 [MOT] <TID:31029/00000> <SID:00004/00000> [INFO]     <GC>                 GC PARAMS: isGcEnabled = true, limboSizeLimit = 524288, limboSizeLimitHigh = 8388608, rcuFreeCount = 8192
2022-04-26 15:29:50.797 [MOT] <TID:31030/00000> <SID:00006/00000> [INFO]     <GC>                 GC PARAMS: isGcEnabled = true, limboSizeLimit = 524288, limboSizeLimitHigh = 8388608, rcuFreeCount = 8192
2022-04-26 15:29:50.897 [MOT] <TID:30886/-----> <SID:-----/-----> [INFO]     <Checkpoint>         Checkpoint [1650958190] completed
2022-04-26 15:29:50.897 [unknown] [unknown] localhost 139845378766592 0[0:0#0]  0 [BACKEND] WARNING:  replicationSlotMinLSN is InvalidXLogRecPtr!!!
2022-04-26 15:29:50.897 [unknown] [unknown] localhost 139845378766592 0[0:0#0]  0 [BACKEND] WARNING:  replicationSlotMaxLSN is InvalidXLogRecPtr!!!
2022-04-26 15:29:50.898 [unknown] [unknown] localhost 139845378766592 0[0:0#0]  0 [BACKEND] LOG:  CreateCheckPoint PrintCkpXctlControlFile: [checkPoint] oldCkpLoc:0/14D7B110, oldRedo:0/14D7B090, newCkpLoc:0/14DEE168, newRedo:0/14DEE0E8, preCkpLoc:0/14D7B110
2022-04-26 15:29:50.898 [unknown] [unknown] localhost 139845378766592 0[0:0#0]  0 [BACKEND] LOG:  will update control file (create checkpoint), shutdown:0
2022-04-26 15:29:50.900 [unknown] [unknown] localhost 139845378766592 0[0:0#0]  0 [BACKEND] LOG:  attempting to remove WAL segments older than log file 000000010000000000000002


omm2=# select * from t where id<10;
 id | c
----+---
  3 | c
  4 | c
  5 | c
  6 | c
  7 | c
  8 | c
  9 | c
  1 | c
  2 | c
(9 rows)


[omm2@og01 dump]$ ./dump -file /home/omm2/data/base/16385/73775  -bs 8192 -n 0 -decoder pg_header
{0 [] 24 map[Pd_checksum:0xc00008c2d0 Pd_flags:0xc00008c330 Pd_lower:0xc00008c390 Pd_lsn:0xc00008c240 Pd_pagesize_version:0xc00008c4b0 Pd_prune_xid:0xc00008c510 Pd_special:0xc00008c450 Pd_upper:0xc00008c3f0] [0xc00008c240 0xc00008c2d0 0xc00008c330 0xc00008c390 0xc00008c3f0 0xc00008c450 0xc00008c4b0 0xc00008c510]}
======read and dump block 0=======
@0    Pd_lsn                         size:8    hex:0x14dc3c0000000000             val:1503142346332569600
@8    Pd_checksum                    size:2    hex:0x2269                         val:8809
@10   Pd_flags                       size:2    hex:0x41                           val:65
@12   Pd_lower                       size:2    hex:0x478                          val:1144
@14   Pd_upper                       size:2    hex:0x900                          val:2304
@16   Pd_special                     size:2    hex:0x2000                         val:8192
@18   Pd_pagesize_version            size:2    hex:0x2006                         val:8198
@20   Pd_prune_xid                   size:4    hex:0x2ad                          val:68



omm2=# vacuum t;
VACUUM
omm2=# checkpoint;
CHECKPOINT
omm2=#


omm2=#  update t set c='d' where id<500;
UPDATE 499


[omm2@og01 dump]$ kill -9 30834


---数据块修改成错误的lsn,可以启动

./dump -file /home/omm2/data/base/16385/73775  -bs 8192 -n 0 -decoder pg_header -setname Pd_lsn -setval uint64#10

gs_ctl start


2022-04-26 15:34:02.760 omm2 postgres localhost 140324014712576 0[0:0#0]  0 [BACKEND] LOG:  instrumention percentile started
2022-04-26 15:34:02.765 omm2 postgres localhost 140323895105280 0[0:0#0]  0 [BACKEND] LOG:  process wlm thread starting up.
2022-04-26 15:34:02.766 omm2 postgres localhost 140323895105280 0[0:0#0]  0 [BACKEND] LOG:  build user data finished
2022-04-26 15:34:02.766 omm2 postgres localhost 140323856250624 0[0:0#0]  0 [BACKEND] LOG:  WLMmonitor thread is starting up.
2022-04-26 15:34:02.767 [unknown] [unknown] localhost 140323790059264 0[0:0#0]  0 [UNDO] LOG:  [UndoRecycleMain:362]undo recycle started.
2022-04-26 15:34:02.770 omm2 postgres localhost 140323981149952 0[0:0#0]  0 [BACKEND] LOG:  statement flush thread start
2022-04-26 15:34:02.772 omm2 postgres localhost 140323997931264 0[0:0#0]  0 [BACKEND] LOG:  ASP thread start
2022-04-26 15:34:02.778 omm2 postgres localhost 140323832067840 0[0:0#0]  0 [BACKEND] LOG:  WLMarbiter thread is starting up.
2022-04-26 15:34:17.694 [unknown] [unknown] localhost 140324246648576 0[0:0#0]  0 [BACKEND] LOG:  database first startup and recovery finish,so do checkpointer
2022-04-26 15:34:17.694 [MOT] <TID:00551/-----> <SID:-----/-----> [INFO]     <Checkpoint>         Creating MOT checkpoint snapshot: id: 1650958457
2022-04-26 15:34:17.694 [MOT] <TID:00551/-----> <SID:-----/-----> [INFO]     <Checkpoint>         MOT snapshot ready. id: 1650958457, lsn: 0
2022-04-26 15:34:17.694 [unknown] [unknown] localhost 140324246648576 0[0:0#0]  0 [SLRU] LOG:  remove old segments(<0) under pg_csnlog
2022-04-26 15:34:17.694 [unknown] [unknown] localhost 140324246648576 0[0:0#0]  0 [BACKEND] LOG:  truncate CSN log oldestXact 47616, next xid 47619
2022-04-26 15:34:17.698 [unknown] [unknown] localhost 140324246648576 0[0:0#0]  0 [SLRU] LOG:  remove old segments(<0) under pg_multixact/offsets
2022-04-26 15:34:17.698 [unknown] [unknown] localhost 140324246648576 0[0:0#0]  0 [SLRU] LOG:  remove old segments(<0) under pg_multixact/members
2022-04-26 15:34:17.707 [unknown] [unknown] localhost 140324246648576 0[0:0#0]  0 [UNDO] LOG:  [CheckPointUndoSystemMeta:353]undo metadata checkPointRedo = 350849296.
2022-04-26 15:34:17.713 [MOT] <TID:00551/-----> <SID:-----/-----> [INFO]     <Checkpoint>         MOT begin checkpoint capture. id: 1650958457, lsn: 350849296
2022-04-26 15:34:17.715 [MOT] <TID:00700/00000> <SID:00004/00000> [INFO]     <GC>                 GC PARAMS: isGcEnabled = true, limboSizeLimit = 524288, limboSizeLimitHigh = 8388608, rcuFreeCount = 8192
2022-04-26 15:34:17.816 [MOT] <TID:00551/-----> <SID:-----/-----> [INFO]     <Checkpoint>         Checkpoint [1650958457] completed
2022-04-26 15:34:17.816 [unknown] [unknown] localhost 140324246648576 0[0:0#0]  0 [BACKEND] WARNING:  replicationSlotMinLSN is InvalidXLogRecPtr!!!
2022-04-26 15:34:17.816 [unknown] [unknown] localhost 140324246648576 0[0:0#0]  0 [BACKEND] WARNING:  replicationSlotMaxLSN is InvalidXLogRecPtr!!!
2022-04-26 15:34:17.817 [unknown] [unknown] localhost 140324246648576 0[0:0#0]  0 [BACKEND] LOG:  CreateCheckPoint PrintCkpXctlControlFile: [checkPoint] oldCkpLoc:0/14E41FC8, oldRedo:0/14E41F48, newCkpLoc:0/14E98990, newRedo:0/14E98910, preCkpLoc:0/14E41FC8
2022-04-26 15:34:17.817 [unknown] [unknown] localhost 140324246648576 0[0:0#0]  0 [BACKEND] LOG:  will update control file (create checkpoint), shutdown:0
2022-04-26 15:34:17.819 [unknown] [unknown] localhost 140324246648576 0[0:0#0]  0 [BACKEND] LOG:  attempting to remove WAL segments older than log file 000000010000000000000002


omm2=# select * from t where id<10;
 id | c
----+---
  3 | d
  4 | d
  5 | d
  6 | d
  7 | d
  8 | d
  9 | d
  1 | d
  2 | d
(9 rows)


omm2=# update t set c='e' where id<500;
UPDATE 499

[omm2@og01 dump]$ kill -9  499

---dd一个数据块为0,可以启动

dd if=/dev/zero of=/home/omm2/data/base/16385/73775 conv=notrunc bs=8192 count=1
记录了1+0 的读入
记录了1+0 的写出
8192字节(8.2 kB)已复制，0.00013172 秒，62.2 MB/秒


2022-04-26 15:39:24.369 [unknown] [unknown] localhost 140529590335232 0[0:0#0]  0 [SLRU] LOG:  remove old segments(<0) under pg_csnlog
2022-04-26 15:39:24.369 [unknown] [unknown] localhost 140529590335232 0[0:0#0]  0 [BACKEND] LOG:  truncate CSN log oldestXact 48052, next xid 48055
2022-04-26 15:39:24.373 [unknown] [unknown] localhost 140529590335232 0[0:0#0]  0 [SLRU] LOG:  remove old segments(<0) under pg_multixact/offsets
2022-04-26 15:39:24.373 [unknown] [unknown] localhost 140529590335232 0[0:0#0]  0 [SLRU] LOG:  remove old segments(<0) under pg_multixact/members
2022-04-26 15:39:24.379 [unknown] [unknown] localhost 140529590335232 0[0:0#0]  0 [UNDO] LOG:  [CheckPointUndoSystemMeta:353]undo metadata checkPointRedo = 351319280.
2022-04-26 15:39:24.384 [MOT] <TID:02911/-----> <SID:-----/-----> [INFO]     <Checkpoint>         MOT begin checkpoint capture. id: 1650958764, lsn: 351319280
2022-04-26 15:39:24.386 [MOT] <TID:03050/00000> <SID:00004/00000> [INFO]     <GC>                 GC PARAMS: isGcEnabled = true, limboSizeLimit = 524288, limboSizeLimitHigh = 8388608, rcuFreeCount = 8192
2022-04-26 15:39:24.387 [MOT] <TID:03052/00000> <SID:00006/00000> [INFO]     <GC>                 GC PARAMS: isGcEnabled = true, limboSizeLimit = 524288, limboSizeLimitHigh = 8388608, rcuFreeCount = 8192
2022-04-26 15:39:24.488 [MOT] <TID:02911/-----> <SID:-----/-----> [INFO]     <Checkpoint>         Checkpoint [1650958764] completed
2022-04-26 15:39:24.487 [unknown] [unknown] localhost 140529590335232 0[0:0#0]  0 [BACKEND] WARNING:  replicationSlotMinLSN is InvalidXLogRecPtr!!!
2022-04-26 15:39:24.487 [unknown] [unknown] localhost 140529590335232 0[0:0#0]  0 [BACKEND] WARNING:  replicationSlotMaxLSN is InvalidXLogRecPtr!!!
2022-04-26 15:39:24.488 [unknown] [unknown] localhost 140529590335232 0[0:0#0]  0 [BACKEND] LOG:  CreateCheckPoint PrintCkpXctlControlFile: [checkPoint] oldCkpLoc:0/14E98990, oldRedo:0/14E98910, newCkpLoc:0/14F0B570, newRedo:0/14F0B4F0, preCkpLoc:0/14E98990
2022-04-26 15:39:24.488 [unknown] [unknown] localhost 140529590335232 0[0:0#0]  0 [BACKEND] LOG:  will update control file (create checkpoint), shutdown:0
2022-04-26 15:39:24.490 [unknown] [unknown] localhost 140529590335232 0[0:0#0]  0 [BACKEND] LOG:  attempting to remove WAL segments older than log file 000000010000000000000002
[omm2@og01 pg_log]$


omm2=# select * from t where id<10;
 id | c
----+---
  3 | e
  4 | e
  5 | e
  6 | e
  7 | e
  8 | e
  9 | e
  1 | e
  2 | e
(9 rows)


omm2=# select (select setting from pg_settings where name='data_directory')||'/'||pg_relation_filepath('t');
             ?column?
----------------------------------
 /home/omm2/data/base/16385/73775

--full_page_writes 打开时，每次checkpoint后第一次修改的块，会在wal中记录完整副本，recover时直接重写数据文件中的块。
[omm2@og01 pg_log]$ gsql -c "show all"|grep full_page_writes
 full_page_writes                                 | on
```
