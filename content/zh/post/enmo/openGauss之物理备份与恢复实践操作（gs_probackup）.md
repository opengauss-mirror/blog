+++

title = "openGauss之物理备份与恢复实践操作（gs_probackup）" 

date = "2022-06-30" 

tags = ["openGauss之物理备份与恢复实践操作（gs_probackup）"] 

archives = "2022-06" 

author = "云和恩墨" 

summary = "openGauss之物理备份与恢复实践操作（gs_probackup）"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# openGauss之物理备份与恢复实践操作（gs_probackup）

本文出处：https://www.modb.pro/db/426207

### 一、gs_probackup简单介绍

  gs_probackup是一个用于管理openGauss数据库备份和恢复的工具,支持全量备份、增量备份、定期备份和远程备份，还可以设置备份的留存策略。

### 二、gs_probackup使用简单说明

查看gs_probackup工具的帮助信息：

```
gs_probackup --help 
```

子命令说明：
 init
  初始化备份路径
 add-instance
  添加新的备份实例
 del-instance
  删除指定实例相关的备份内容
 set-config
  将指定的连接、压缩、日志等相关设置添加到pg_probackup.conf配置文件中,或修改已设置的值
 set-backup
  将备份相关设置添加到backup.control配置文件中，或修改已设置的值
 backup
  创建指定实例的备份
 restore
  从备份目录中的备份副本恢复指定实例
 merge
  将指定的增量备份与其父完全备份之间的所有增量备份合并到父完全备份
 delete
  删除指定备份，或删除不满足当前保留策略的备份。
参数说明：
  -B   指定备份路径
  -D   指定数据库数据目录
  -b   指定备份模式（FULL和PTRACK）
  -i   指定备份ID（备份文件合并和恢复时指定）
  -d   指定要连接的数据库名（备份时指定）
  -p   指定数据库服务监听的端口号（备份时指定）
  --instance   指定实例名
  --remote-host   指定要远程备份的远程主机IP

### 三、实践操作

#### （0）备份策略

  周日全备，周一到周六增量备份,环境为一主一备，这里对主备库都做了备份，备份目录设在主库主机上，备份备库的目的是为了测试远程备份，具体操作如下：

#### （1）修改postgresql.conf配置文件

```
#使其支持PTRACK增量备份 vim postgresql.conf enable_cbm_tracking = on #执行如下命令使配置生效或者重启数据库 gs_ctl reload -D /data/og1 
```

#### （2）模拟周日操作

```
#连接数据库（设置了相关环境变量,如：PGDATABASE、PGPORT，所以连接命令才那么简单）
gsql
#插入数据，并改变Lisi的年龄
openGauss=> insert into student values('7702118013','WangEr',14);
INSERT 0 1
openGauss=> update student set sage=17 where sid='7702118033';
UPDATE 1
openGauss=> select * from student;
    sid     | sname  | sage 
------------+--------+------
 7702118013 | WangEr | 14
 7702118033 | Lisi   | 17
(2 rows)

#模拟周日全备：
### og1操作:
#1.初始化备份目录,注意：如果备份目录存在，必须为空：
[omm@OG1 ~]$ gs_probackup init -B /backup
INFO: Backup catalog '/backup' successfully inited #说明初始化成功
[omm@OG1 ~]$ ll /backup/    #会在指定目录下创建两个子目录
total 0
drwx------ 2 omm dbgrp 6 Feb 23 09:46 backups  #用于备份文件
drwx------ 2 omm dbgrp 6 Feb 23 09:46 wal       #用于备份WAL



#2.添加新的备份实例：
[omm@OG1 ~]$ gs_probackup add-instance -B /backup -D /data/og1 --instance OG1
INFO: Instance 'OG1' successfully inited   #说明添加成功
[omm@OG1 ~]$ tree /backup
/backup
├── backups
│   └── OG1   #增加OG1目录
    │   └── pg_probackup.conf   #自动生成pg_probackup.conf配置文件
└── wal
    └── OG1

4 directories, 1 file


#3.将指定的连接、压缩、日志等相关设置添加到pg_probackup.conf配置文件中:
[omm@OG1 ~]$ gs_probackup set-config -B /backup --instance OG1

#4.显示位于备份目录中的pg_probackup.conf配置文件的内容。
#可以通过指定–format=json选项，
#以json格式显示。默认情况下，显示为纯文本格式。
[omm@OG1 ~]$ gs_probackup show-config -B /backup --instance OG1 --format json
{
    "pgdata": "/data/og1",
    "system-identifier": "3422839540866569",
    "pgdatabase": "omm",
    "archive-timeout": "5min",
    "log-level-console": "LOG",
    "log-level-file": "OFF",
    "log-filename": "pg_probackup.log",
    "log-rotation-size": "0TB",
    "log-rotation-age": "0d",
    "retention-redundancy": "0",
    "retention-window": "0",
    "wal-depth": "0",
    "compress-algorithm": "none",
    "compress-level": "1",
    "remote-proto": "ssh"
}


#5.创建指定实例的备份，在进行增量备份之前，必须至少创建一次全备
[omm@OG1 ~]$ gs_probackup backup -B /backup --instance OG1 -b FULL -d postgres -p 15400
INFO: Backup start, gs_probackup version: 2.4.2, instance: OG1, backup ID: R7QMXH, backup mode: FULL, wal mode: STREAM, remote: false, compress-algorithm: none, compress-level: 1
LOG: Backup destination is initialized

#记住备份ID，恢复的时候需要使用，backup ID:R7QMXH

### og2操作：
gs_probackup add-instance -B /backup -D /data/og2 --instance OG2 --remote-host 10.0.0.101
#在备份目录中添加新实例OG2
[omm@OG1 ~]$ gs_probackup add-instance -B /backup -D /data/og2 --instance OG2 --remote-host
 10.0.0.101
LOG: Start SSH client process, pid 19802
INFO: Instance 'OG2' successfully inited
#查看一下备份目录中的目录结构
[omm@OG1 ~]$ tree -L 3 /backup
/backup
├── backups
│   ├── OG1
│   │   ├── pg_probackup.conf
│   │   └── R7QMXH
│   └── OG2
│       └── pg_probackup.conf
└── wal
    ├── OG1
    └── OG2

7 directories, 2 files
#配置OG2备份实例中pg_probackup.conf配置文件
[omm@OG1 ~]$ gs_probackup set-config -B /backup --instance OG2
#对OG2进行全备,备份之前需要修改客户端认证策略：
#因为使用OG1连接OG2，所以修改的是OG2的配置文件
#将host    all    all    10.0.0.100/32    trust
#改为：host    all    all    10.0.0.100/32    sha256
#然后重启OG2实例：gs_ctl restart -D /data/og2
[omm@OG1 ~]$ gs_probackup backup -B /backup --instance OG2 -b FULL -d postgres -p 15400 -r
emote-host 10.0.0.101 -U jack -W Test@123
INFO: Backup start, gs_probackup version: 2.4.2, instance: OG2, backup ID: R7QO3S, backup mode: FULL, wal mode: STREAM, remote: true, compress-algorithm: none, compress-level: 1


  远程备份需要添加--remote-host参数,连接参数：-d,-p,-U,-W
backup ID :R7QO3S

```

#### （3）模拟周一操作：

```
插入记录：
openGauss=> insert into student values('7702118088','张五',21);
INSERT 0 1
openGauss=> select * from student;
    sid     | sname  | sage 
------------+--------+------
 7702118013 | WangEr | 14
 7702118033 | Lisi   | 17
 7702118088 | 张五   | 21
(3 rows)



模拟周一增量备份：
OG1:
[omm@OG1 ~]$ gs_probackup backup -B /backup --instance OG1 -b PTRACK -d postgres -p 15400
INFO: Backup start, gs_probackup version: 2.4.2, instance: OG1, backup ID: R7QXWH, backup mode: PTRACK, wal mode: STREAM, remote: false, compress-algorithm: none, compress-level: 1

OG2增量备份：
[omm@OG1 ~]$ gs_probackup backup -B /backup --instance OG2 -b PTRACK  -D /data/og2 -d postg
res -p 15400 --remote-host 10.0.0.101 -U jack -W Test@123
INFO: Backup start, gs_probackup version: 2.4.2, instance: OG2, backup ID: R7QYT5, backup mode: PTRACK, wal mode: STREAM, remote: true, compress-algorithm: none, compress-level: 1
```

#### （4）模拟周二用户操作：

```
插入数据：insert into student values('7702118099','Linux',22);
openGauss=> insert into student values('7702118099','Linux',22);
INSERT 0 1
openGauss=> select * from student;
    sid     | sname  | sage 
------------+--------+------
 7702118013 | WangEr | 14
 7702118033 | Lisi   | 17
 7702118088 | 张五   | 21
 7702118099 | Linux  | 22
(4 rows)

模拟周二增量备份：
OG1：
[omm@OG1 ~]$ gs_probackup backup -B /backup --instance OG1 -b PTRACK -d postgres -p 15400
INFO: Backup start, gs_probackup version: 2.4.2, instance: OG1, backup ID: R7QZ2H, backup mode: PTRACK, wal mode: STREAM, remote: false, compress-algorithm: none, compress-level: 1

OG2：
[omm@OG1 ~]$ gs_probackup backup -B /backup --instance OG2 -b PTRACK  -D /data/og2 -d postg
res -p 15400 --remote-host 10.0.0.101 -U jack -W Test@123
INFO: Backup start, gs_probackup version: 2.4.2, instance: OG2, backup ID: R7QZ49, backup mode: PTRACK, wal mode: STREAM, remote: true, compress-algorithm: none, compress-level: 1


增量备份的时候，备份主库很快，但是从库较慢。

```

#### （5）模拟故障

```
直接将表删除 openGauss=> drop table student; DROP TABLE 
```

#### （6）开始数据恢复

```
a)将数据库服务关闭
[omm@OG1 ~]$ gs_om -t stop

b)将指定的增量备份与其父完全备份之间的所有增量备份合并到父完全备份。
父完全备份将接收所有合并的数据，而已合并的增量备份将作为冗余被删除。
OG1合并所有增量备份到全备中，只需要指定最后一个增量备份的id，然后会自动将其与全备之间的增量备份进行合并:
gs_probackup merge -B /backup --instance OG1 -i R7QZ2H
[omm@OG1 ~]$ gs_probackup merge -B /backup --instance OG1 -i R7QZ2H
INFO: Merge started
WARNING: Process 22880 which used backup R7QXOL no longer exists
WARNING: Process 22925 which used backup R7QXWH no longer exists
WARNING: Process 23073 which used backup R7QZ2H no longer exists
INFO: Merging backup R7QZ2H with parent chain
INFO: Validate parent chain for backup R7QZ2H
INFO: Validating backup R7QXOL
INFO: Backup R7QXOL data files are valid
INFO: Validating backup R7QXWH
INFO: Backup R7QXWH data files are valid
INFO: Validating backup R7QZ2H
INFO: Backup R7QZ2H data files are valid
LOG: Restore directories and symlinks...
INFO: Start merging backup files
LOG: Creating page header map "/backup/backups/OG1/R7QXOL/page_header_map_tmp"
INFO: Backup files are successfully merged, time elapsed: 2s
INFO: Delete: R7QXWH 2022-02-23 15:24:20+08
INFO: Delete: R7QZ2H 2022-02-23 15:49:31+08
LOG: Rename /backup/backups/OG1/R7QXOL to /backup/backups/OG1/R7QZ2H
INFO: Rename merged full backup R7QXOL to R7QZ2H
INFO: Validating backup R7QZ2H
INFO: Backup R7QZ2H data files are valid
INFO: Merge of backup R7QZ2H completed

OG2合并所有增量备份到全备中：
gs_probackup merge -B /backup --instance OG2 -i R7QZ49
[omm@OG1 ~]$ gs_probackup merge -B /backup --instance OG2 -i R7QZ49
INFO: Merge started
WARNING: Process 22905 which used backup R7QXRT no longer exists
WARNING: Process 23039 which used backup R7QYT5 no longer exists
WARNING: Process 23094 which used backup R7QZ49 no longer exists
INFO: Merging backup R7QZ49 with parent chain
INFO: Validate parent chain for backup R7QZ49
INFO: Validating backup R7QXRT
INFO: Backup R7QXRT data files are valid
INFO: Validating backup R7QYT5
INFO: Backup R7QYT5 data files are valid
INFO: Validating backup R7QZ49
INFO: Backup R7QZ49 data files are valid
LOG: Restore directories and symlinks...
INFO: Start merging backup files
LOG: Creating page header map "/backup/backups/OG2/R7QXRT/page_header_map_tmp"
INFO: Backup files are successfully merged, time elapsed: 2s
INFO: Delete: R7QYT5 2022-02-23 15:43:58+08
INFO: Delete: R7QZ49 2022-02-23 15:50:37+08
LOG: Rename /backup/backups/OG2/R7QXRT to /backup/backups/OG2/R7QZ49
INFO: Rename merged full backup R7QXRT to R7QZ49
INFO: Validating backup R7QZ49
INFO: Backup R7QZ49 data files are valid
INFO: Merge of backup R7QZ49 completed



合并完成之后，不妨查看一下备份目录的目录结构：
[omm@OG1 ~]$ tree -L 3 /backup
/backup
├── backups
│   ├── OG1
│   │   ├── pg_probackup.conf
│   │   └── R7QZ2H
│   └── OG2
│       ├── pg_probackup.conf
│       └── R7QZ49
└── wal
    ├── OG1
    └── OG2

8 directories, 2 files

可以发现，合并之后，每个备份实例下只剩下一个备份，且备份id为最后一次增量备份的ID，并且这个留下的备份属于全备，可以查看这个文件:
[omm@OG1 ~]$ cd /backup/backups/OG1/R7QZ2H/
[omm@OG1 /backup/backups/OG1/R7QZ2H]$ cat backup.control 
#Configuration
backup-mode = FULL
#截取了部分内容


c)清空数据目录中的内容
OG1主机上操作：
rsync -av /data/og1/* /data/backup/og1	#简单备份
rm -rf /data/og1/*
OG2主机上操作：
rsync -av /data/og2/* /data/backup/og2
rm -rf /data/og2/*

d)进行数据恢复
OG1:
[omm@OG1 ~]$ gs_probackup restore -B /backup --instance OG1 -D /data/og1 -i R7QZ2H
LOG: Restore begin.
LOG: there is no file tablespace_map
LOG: check tablespace directories of backup R7QZ2H
LOG: check external directories of backup R7QZ2H
INFO: Validating backup R7QZ2H
INFO: Backup R7QZ2H data files are valid
LOG: Thread [1]: Opening WAL segment "/backup/backups/OG1/R7QZ2H/database/pg_xlog/000000010000000000000036"
INFO: Backup R7QZ2H WAL segments are valid
INFO: Backup R7QZ2H is valid.
INFO: Restoring the database from backup at 2022-02-23 15:49:29+08
LOG: there is no file tablespace_map
LOG: Restore directories and symlinks...
INFO: Start restoring backup files. PGDATA size: 620MB
LOG: Start thread 1
INFO: Backup files are restored. Transfered bytes: 966MB, time elapsed: 1s
INFO: Restore incremental ratio (less is better): 156% (966MB/620MB)
INFO: Syncing restored files to disk
INFO: Restored backup files are synced, time elapsed: 0
INFO: Restore of backup R7QZ2H completed.


OG2：
gs_probackup restore -B /backup --instance OG2 -D /data/og2 --remote-host 10.0.0.101 -i R7QZ49
[omm@OG1 ~]$ gs_probackup restore -B /backup --instance OG2 -D /data/og2 --remote-host 10.0
.0.101 -i R7QZ49
LOG: Start SSH client process, pid 23718
LOG: Restore begin.
LOG: there is no file tablespace_map
LOG: check tablespace directories of backup R7QZ49
LOG: check external directories of backup R7QZ49
INFO: Validating backup R7QZ49
INFO: Backup R7QZ49 data files are valid
LOG: Thread [1]: Opening WAL segment "/backup/backups/OG2/R7QZ49/database/pg_xlog/000000010000000000000037"
INFO: Backup R7QZ49 WAL segments are valid
INFO: Backup R7QZ49 is valid.
INFO: Restoring the database from backup at 2022-02-23 15:50:33+08
LOG: there is no file tablespace_map
LOG: Restore directories and symlinks...
LOG: SSH process 23718 is terminated with status 0
INFO: Start restoring backup files. PGDATA size: 620MB
LOG: Start thread 1
LOG: Start SSH client process, pid 23722
LOG: SSH process 23722 is terminated with status 0
INFO: Backup files are restored. Transfered bytes: 965MB, time elapsed: 10s
INFO: Restore incremental ratio (less is better): 156% (965MB/620MB)
INFO: Syncing restored files to disk
LOG: Start SSH client process, pid 23723
INFO: Restored backup files are synced, time elapsed: 2s
LOG: SSH process 23723 is terminated with status 0
INFO: Restore of backup R7QZ49 completed.


5)启动数据库检验：
[omm@OG1 ~]$(reverse-i-search)`gsql': gsql -d postgres -p 15400 -U jack -W Test@123
openGauss=> select * from student;
    sid     | sname  | sage 
------------+--------+------
 7702118013 | WangEr | 14
 7702118033 | Lisi   | 17
 7702118088 | 张五   | 21
 7702118099 | Linux  | 22
(4 rows)


主库从库，都登陆了，并且数据都恢复了，但是集群出现问题，状态为degraded:
[omm@OG1 ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Degraded
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

    nodenode_ip         port      instance          state
------------------------------------------------------------------------
1  OG1 192.168.1.100   15400      6001 /data/og1   P Primary Normal
2  OG2 192.168.1.101   15400      6002 /data/og2   S Standby Need repair(WAL)


```

#### （7）恢复备库

解决办法：
从库既然需要wal日志，也称为xlog，那我干脆将主库OG1数据目录下的pg_xlog目录拷贝给从库，操作如下：

```
[omm@OG1 /data/og1]$ gs_om -t stop
[omm@OG1 /data/og1]$ rsync -avz pg_xlog 10.0.0.101:/data/og2
[omm@OG1 /data/og1]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

    nodenode_ip         port      instance          state
------------------------------------------------------------------------
1  OG1 192.168.1.100   15400      6001 /data/og1   P Primary Normal
2  OG2 192.168.1.101   15400      6002 /data/og2   S Standby Normal

可见主备状态恢复正常，操作到此结束。
```
