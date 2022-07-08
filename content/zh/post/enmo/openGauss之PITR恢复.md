+++

title = "openGauss之PITR恢复" 

date = "2022-06-30" 

tags = ["openGauss之PITR恢复"] 

archives = "2022-06" 

author = "云和恩墨" 

summary = "openGauss之PITR恢复"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# openGauss之PITR恢复

本文出处：https://www.modb.pro/db/426464

### 一、PITR介绍

  PITR(point-in-time recovery)及时恢复，是基于全量的物理备份数据文件和已归档的wal日志进行数据恢复，可以将数据恢复到备份归档之后的任意时间点。
  仅支持恢复到物理备份数据之后的某一时间点，仅主节点可以进行PITR，备机需要全量build达成与主机数据同步

### 二、PITR恢复流程介绍

0）进行物理全备
1）将原来的wal日志做备份
2）将物理备份的文件替换目标数据库目录
3）在数据库数据目录下创建恢复命令文件recovery.conf,指定数据库恢复的程度
4）启动数据库
5）连接数据库，查看是否恢复到预期的状态
6）若已经恢复到预期的状态，使用指令pg_xlog_replay_resume()使主节点向外提供服务.

recovery.conf文件中相关恢复参数说明：
restore_command = ‘cp /mnt/server/archivedir/%f %p’
这个SHELL命令是获取WAL文件系列中已归档的WAL文件。字符串中的任何一个%f是用归档检索中的文件名替换， 并且%p是用服务器上的复制目的地的路径名替换。

archive_cleanup_command = ‘pg_archivecleanup /mnt/server/archivedir %r’
在每次重启时会执行这个shell命令。 archive_cleanup_command为清理备库不需要的归档WAL文件提供一个机制。 任何一个%r由包含最新可用重启点的文件名代替。这是最早的文件，因此必须保留以允许恢复能够重新启动，因此所有早于%r的文件可以安全的移除。

recovery_target_name = ‘restore_point_1’
此参数声明还原到一个使用pg_create_restore_point()创建的还原点

recovery_target_time = ‘2020-01-01 12:00:00’
此参数声明还原到一个指定时间戳。

recovery_target_xid = ‘3000’
这个参数声明还原到一个事务ID。

recovery_target_lsn = ‘0/0FFFFFF’
这个参数声明还原到日志的指定LSN点。

recovery_target_inclusive = true
声明是否在指定恢复目标（true）之后停止，或在这（false）之前停止。改声明仅支持恢复目标为recovery_target_time、recovery_target_xid和recovery_target_lsn的配置。

### 三、实践操作

#### 1.环境介绍：

集群为一主一备，PITR恢复操作我只在主节点上进行,此时主备都还在运行。
主库基本信息：
数据目录:/data/og1
系统日志：/var/log/omm/omm/pg_log/dn_6001/
xlog备份目录：/backup_xlog
物理备份目录：/backup
IP：10.0.0.100(外网)，192.168.1.100（内网）

#### 2.操作流程：

##### （1）使用gs_basebackup进行物理全备

```
[omm@OG1 ~]$ gs_basebackup -D /backup/ -p 15400 -X stream -F plain 
```

##### （2）登录数据库进行如下一系列操作操作：

```
[omm@OG1 ~]$ gsql -d test -p 15400 -r
#test_2最开始的信息
test=# select * from test_2;
 id |  name  
----+--------
  1 | XXX
  2 | XXX
  3 | haha
  4 | Zhang
  5 | Hua
  6 | AAA
  7 | heihei
  8 | Get
(8 rows)
#插入数据之后创建还原点restore_point_0,(测试参数recovery_target_name)
test=# insert into test_2 values(9,'BBB');
INSERT 0 1
test=# select pg_create_restore_point('restore_point_0');
 pg_create_restore_point 
-------------------------
 0/52000410
(1 row)

#操作完之后记得切换到下一个事务日志
test=# select pg_switch_xlog();
 pg_switch_xlog 
----------------
 0/52000940
(1 row)

#再次插入数据，记录插入之后的xid，（测试参数：recovery_target_xid）
test=# insert into test_2 values(10,'CCC');
INSERT 0 1
test=# select pg_switch_xlog();
 pg_switch_xlog 
----------------
 0/530003C0
(1 row)

test=# \x
Expanded display is on.
test=# select * from pg_get_variable_info();
-[ RECORD 1 ]------------+-------------
node_name                | dn_6001_6002
next_oid                 | 33082
next_xid                 | 216185
oldest_xid               | 13006
xid_vac_limit            | 4000013006
oldest_xid_db            | 15354
last_extend_csn_logpage  | 223
start_extend_csn_logpage | 0
next_commit_seqno        | 2310
latest_completed_xid     | 216184
startup_max_xid          | 216182

test=# \x
Expanded display is off.

#再次插入数据，并记录插入数据之后的lsn,(测试参数recovery_target_lsn)
test=# insert into test_2 values (11,'DDD');
INSERT 0 1
test=# select pg_current_xlog_location();
 pg_current_xlog_location 
--------------------------
 0/540004C0
(1 row)

```

##### （3）关闭数据库

```
[omm@OG1 ~]$ gs_om -t stop  #随便把备库也给关掉 
```

##### （4）开始PITR恢复：

###### a，通过recovery_target_name参数恢复数据

```
#先备份xlog日志
[omm@OG1 ~]$ cp -a /data/og1/pg_xlog/* /backup_xlog/
#清空数据目录中的内容
[omm@OG1 ~]$ rm -rf /data/og1/*
#拷贝物理全备的文件到数据目录中
[omm@OG1 ~]$ cp -a /backup/* /data/og1/
[omm@OG1 ~]$ cd /data/og1
[omm@OG1 /data/og1]$ vim recovery.conf
#归档恢复设置
restore_command='cp /backup_xlog/%f %p'

#恢复目标设置
recovery_target_name='restore_point_0'
recovery_target_inclusive=true

#启动数据库检验：
[omm@OG1 /data/og1]$ gs_ctl start -D /data/og1
[omm@OG1 /data/og1]$ gsql -d test -p 15400 -r
test=# select * from test_2;
 id |  name  
----+--------
  1 | XXX
  2 | XXX
  3 | haha
  4 | Zhang
  5 | Hua
  6 | AAA
  7 | heihei
  8 | Get
  9 | BBB
(9 rows)

test=# select pg_is_in_recovery();
 pg_is_in_recovery 
-------------------
 t
(1 row)
#可以发现数据已经恢复到restore_point_0这个还原点，此时插入了数据'BBB',
#查看日志发现，还原点确实应用到了。
[omm@OG1 /data/og1]$ grep -C 3 restore_point_0 /var/log/omm/omm/pg_log/dn_6001/postg
resql-2022-03-04_102311.log
2022-03-04 10:23:11.977 6221780f.6125 [unknown] 140043955402496 dn_6001 0 dn_6001_6002 DB010  0 [BACKEND] LOG:  StartupXLOG: biggest_lsn_in_page is set to FFFFFFFF/FFFFFFFF, enable_update_max_page_flush_lsn:0
2022-03-04 10:23:11.977 6221780f.6125 [unknown] 140043955402496 dn_6001 0 dn_6001_6002 00000  0 [BACKEND] LOG:  database system timeline: 33
2022-03-04 10:23:11.977 6221780f.6125 [unknown] 140043955402496 dn_6001 0 dn_6001_6002 00000  0 [BACKEND] LOG:  database system was interrupted; last known up at 2022-03-02 18:43:46 CST
2022-03-04 10:23:11.979 6221780f.6125 [unknown] 140043955402496 dn_6001 0 dn_6001_6002 00000  0 [BACKEND] LOG:  starting point-in-time recovery to "restore_point_0"
2022-03-04 10:23:11.980 6221780f.6125 [unknown] 140043955402496 dn_6001 0 dn_6001_6002 00000  0 [BACKEND] LOG:  request archive recovery due to backup label file
2022-03-04 10:23:12.008 6221780f.6125 [unknown] 140043955402496 dn_6001 0 dn_6001_6002 00000  0 [BACKEND] LOG:  restored log file "000000010000000000000051" from archive
2022-03-04 10:23:12.023 6221780f.6125 [unknown] 140043955402496 dn_6001 0 dn_6001_6002 00000  0 [DBL_WRT] LOG:  Double write initializing after build

#查看数据目录，会发现在数据目录下生成一个文件recovery.done
```

###### b,使用recovery_target_xid进行恢复

```
关闭数据库后
[omm@OG1 ~]$ vim /data/og1/recovery.conf 
#归档恢复设置
restore_command='cp /backup_xlog/%f %p'

#恢复目标设置
recovery_target_xid = '216184'
recovery_target_inclusive=true

#启动数据库检验：
[omm@OG1 ~]$ gsql -d test -p 15400 -r 
test=# select * from test_2;
 id |  name  
----+--------
  1 | XXX
  2 | XXX
  3 | haha
  4 | Zhang
  5 | Hua
  6 | AAA
  7 | heihei
  8 | Get
  9 | BBB
 10 | CCC
(10 rows)

test=# select pg_is_in_recovery();
 pg_is_in_recovery 
-------------------
 t
(1 row)
```

###### c，使用recovery_target_lsn进行恢复

```
关闭数据库之后
[omm@OG1 ~]$ vim /data/og1/recovery.conf
#归档恢复设置
restore_command='cp /backup_xlog/%f %p'

#恢复目标设置
recovery_target_lsn = '0/540004C0'
recovery_target_inclusive=true
[omm@OG1 ~]$ gs_ctl start -D /data/og1
[omm@OG1 ~]$ gsql -d test -p 15400 -r
test=# select * from test_2;
 id |  name  
----+--------
  1 | XXX
  2 | XXX
  3 | haha
  4 | Zhang
  5 | Hua
  6 | AAA
  7 | heihei
  8 | Get
  9 | BBB
 10 | CCC
 11 | DDD
(11 rows)

test=# select pg_is_in_recovery();
 pg_is_in_recovery 
-------------------
 f
(1 row)
```

##### （5）恢复完成之后，使主节点向外提供服务

```
#发现数据恢复到了最新之后，数据库就不会处于恢复状态，可以进行正常的读写
#如果数据库处于恢复状态，想让它向外提供服务的话，可以执行如下命令
test=# select pg_xlog_replay_resume();
ERROR:  recovery is not in progress
HINT:  Recovery control functions can only be executed during recovery.
CONTEXT:  referenced column: pg_xlog_replay_resume
#因为当前不处于恢复状态，所以报错

恢复完成之后：数据目录中的recovery.conf文件就会被自动删除，只剩下recovery.done:
[omm@OG1 /data/og1]$ cat recovery.done 
#归档恢复设置
restore_command='cp /backup_xlog/%f %p'

#恢复目标设置
recovery_target_lsn = '0/540004C0'
recovery_target_inclusive=true
```

##### （6）恢复备库

###### 方法一：

1）备份备库相关配置文件：

```
[omm@OG2 ~]$ mkdir OG2_conf
[omm@OG2 ~]$ cp -a /data/og2/*.conf OG2_conf/
[omm@OG2 ~]$ ll OG2_conf/
total 64
-rw------- 1 omm dbgrp 20218 Mar  2 18:44 mot.conf
-rw------- 1 omm dbgrp  4824 Mar  2 18:44 pg_hba.conf
-rw------- 1 omm dbgrp  1636 Mar  2 18:44 pg_ident.conf
-rw------- 1 omm dbgrp 31999 Mar  2 18:44 postgresql.conf
```

2)清空OG2数据目录，然后将OG1数据目录中的内容拷贝过来：

```
[omm@OG2 ~]$ rm -rf /data/og2/* [omm@OG2 ~]$ rsync -avz 10.0.0.100:/data/og1/* /data/og2 
```

3）将备份的配置文件覆盖掉拷贝过来的配置文件

```
[omm@OG2 ~]$ cp OG2_conf/* /data/og2/ 
```

4）启动主备集群,检查主备状态

```
[omm@OG2 ~]$ gs_om -t start
[omm@OG2 ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

    nodenode_ip         port      instance          state
------------------------------------------------------------------------
1  OG1 192.168.1.100   15400      6001 /data/og1   P Primary Normal
2  OG2 192.168.1.101   15400      6002 /data/og2   S Standby Normal
#主备正常，连接数据库之后，查看数据也是正常的。
```

###### 方法二：

（1）启动主库

```
gs_ctl start -D /data/og1 -M primary 
```

（2）在备库主机上执行命令，全量build主备关系

```
gs_ctl build -D /data/og2 -b full -M standby 
```

（3）查看主备状态

```
OG1: gs_ctl query -D /data/og1 OG2： gs_ctl query -D /data/og2 #经查看可以发现，主备关系恢复正常。 
```

恢复操作到此结束。

##### 附：

  openGauss提供了很多系统函数供我们使用，方便我们管理和查看数据库相关信息，单这些函数名又有些长，记住这些函数名，显然是一个难题，但是如果我们记得函数名中的几个关键字，这里以pg_xlog_replay_resume为例，假如我模糊记得这个函数中有个resume关键字，那么我们可以通过如下方法找出我们想要的函数：

```
方法一：通过系统表pg_proc进行查找
openGauss=# select proname from pg_proc where proname like '%resume%';
        proname        
-----------------------
 pg_resume_bkp_flag
 pg_xlog_replay_resume
(2 rows)

方法二：通过gsql提供的元命令进行查找
openGauss=# \dfS *resume*
                                                                                                       List of functions
   Schema   |         Name          | Result data type |                                                    Argument data types          
                                          |  Type  | fencedmode | propackage | prokind 
------------+-----------------------+------------------+---------------------------------------------------------------------------------
------------------------------------------+--------+------------+------------+---------
 pg_catalog | pg_resume_bkp_flag    | record           | slot_name name, OUT start_backup_flag boolean, OUT to_delay boolean, OUT ddl_del
ay_recycle_ptr text, OUT rewind_time text | normal | f          | f          | f
 pg_catalog | pg_xlog_replay_resume | void             |                                                                                 
                                          | normal | f          | f          | f
(2 rows)
```
