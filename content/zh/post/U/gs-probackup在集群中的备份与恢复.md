+++

title = "gs-probackup在集群中的备份与恢复" 

date = "2021-01-28" 

tags = ["openGauss备份与恢复"] 

archives = "2021-01" 

author = "U" 

summary = "gs-probackup在集群中的备份与恢复"

img = "/zh/post/U/title/img37.png" 

times = "17:30"

+++

# gs-probackup在集群中的备份与恢复<a name="ZH-CN_TOPIC_0000001116438643"></a>

集群状态（一主一备）：

```
[omm@ecs-268e-0004 ~]$ gs_om -t status --detail
[ Cluster State ]
cluster_state : Normal
redistributing : No
current_az : AZ_ALL
[ Datanode State ]
node node_ip instance state | node node_ip instance state
------------------------------------------------------------------------------------------------------------------------------------------------------
1 ecs-268e-0004 192.168.1.213 6001 /opt/data/dn1 P Primary Normal | 2 ecs-268e-0005 192.168.1.176 6002 /opt/data/dn1 S Standby Normal
```

Standby Normal备份列表：

```
[omm@ecs-268e-0004 ~]$ gs_probackup show -B /opt/probackupdir/

BACKUP INSTANCE 'opengauss0111'
======================================================================================================================================
Instance Version ID Recovery Time Mode WAL Mode TLI Time Data WAL Zratio Start LSN Stop LSN Status
======================================================================================================================================
opengauss0111 9.2 QMRYNK 2021-01-11 22:52:33+08 FULL STREAM 1/0 13s 587MB 16MB 0.97 0/8000028 0/80001E0 OK
opengauss0111 9.2 QMRY1K 2021-01-11 22:39:22+08 FULL STREAM 1/0 14s 587MB 16MB 0.97 0/6000028 0/60001E0 OK
```

## 主库恢复成其他集群单主库<a name="section8962640123715"></a>

```
[omm@ecs-268e-0004 ~]$ cd /opt/data/
[omm@ecs-268e-0004 data]$ gs_probackup restore -B /opt/probackupdir/ --instance opengauss0111 -D /opt/data/db1 -i QMRYNK
LOG: Restore begin.
LOG: there is no file tablespace_map
LOG: check tablespace directories of backup QMRYNK
LOG: check external directories of backup QMRYNK
WARNING: Process 535458 which used backup QMRYNK no longer exists
INFO: Validating backup QMRYNK
INFO: Backup QMRYNK data files are valid
LOG: Thread [1]: Opening WAL segment "/opt/probackupdir/backups/opengauss0111/QMRYNK/database/pg_xlog/000000010000000000000008"
INFO: Backup QMRYNK WAL segments are valid
INFO: Backup QMRYNK is valid.
INFO: Restoring the database from backup at 2021-01-11 22:52:32+08
LOG: there is no file tablespace_map
LOG: Restore directories and symlinks...
INFO: Start restoring backup files. PGDATA size: 587MB
LOG: Start thread 1
INFO: Backup files are restored. Transfered bytes: 603MB, time elapsed: 0
INFO: Restore incremental ratio (less is better): 103% (603MB/587MB)
INFO: Syncing restored files to disk
INFO: Restored backup files are synced, time elapsed: 9s
INFO: Restore of backup QMRYNK completed.
```

修改端口和replinfo：

修改为与当前集群不同的端口号：

```
[omm@ecs-268e-0004 ~]$ cd /opt/data/db1
[omm@ecs-268e-0004 db1]$ cat postgresql.conf | grep 'port '
port = 25000 # (change requires restart)
```

作为单主启动，注释replconninfo1这一行：

```
[omm@ecs-268e-0004 db1]$ cat postgresql.conf | grep 'replconninfo1'
#replconninfo1 = 'localhost=192.168.1.213 localport=26001 localheartbeatport=26005 localservice=26004 remotehost=192.168.1.176 remoteport=26001 remoteheartbeatport=26005 remoteservice=26004' # replication connection information used to connect primary on standby, or standby on primary,

[omm@ecs-268e-0004 data]$ gs_ctl -D /opt/data/db1/ start
[2021-01-12 10:14:46.150][553923][][gs_ctl]: gs_ctl started,datadir is /opt/data/db1
[2021-01-12 10:14:46.193][553923][][gs_ctl]: waiting for server to start...
.0 LOG: [Alarm Module]can not read GAUSS_WARNING_TYPE env.

0 LOG: [Alarm Module]Host Name: ecs-268e-0004

0 LOG: [Alarm Module]Host IP: 127.0.0.1

0 LOG: [Alarm Module]Cluster Name: gauss_omm

0 LOG: [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 52

0 WARNING: failed to open feature control file, please check whether it exists: FileName=gaussdb.version, Errno=2, Errmessage=No such file or directory.
0 WARNING: failed to parse feature control file: gaussdb.version.
0 WARNING: Failed to load the product control file, so gaussdb cannot distinguish product version.
0 LOG: Failed to initialze environment for codegen.
0 WARNING: bbox_dump_path is set to /opt/data/corefile/

2021-01-12 10:14:46.282 5ffd0616.1 [unknown] 281457534107664 [unknown] 0 dn_6001_6002 DB010 0 [REDO] LOG: Recovery parallelism, cpu count = 4, max = 4, actual = 4
2021-01-12 10:14:46.282 5ffd0616.1 [unknown] 281457534107664 [unknown] 0 dn_6001_6002 DB010 0 [REDO] LOG: ConfigRecoveryParallelism, true_max_recovery_parallelism:4, max_recovery_parallelism:4
2021-01-12 10:14:46.282 5ffd0616.1 [unknown] 281457534107664 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: [Alarm Module]can not read GAUSS_WARNING_TYPE env.

2021-01-12 10:14:46.282 5ffd0616.1 [unknown] 281457534107664 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: [Alarm Module]Host Name: ecs-268e-0004

2021-01-12 10:14:46.282 5ffd0616.1 [unknown] 281457534107664 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: [Alarm Module]Host IP: 127.0.0.1

2021-01-12 10:14:46.282 5ffd0616.1 [unknown] 281457534107664 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: [Alarm Module]Cluster Name: gauss_omm

2021-01-12 10:14:46.282 5ffd0616.1 [unknown] 281457534107664 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 52

2021-01-12 10:14:46.282 5ffd0616.1 [unknown] 281457534107664 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: Transparent encryption disabled.

2021-01-12 10:14:46.287 5ffd0616.1 [unknown] 281457534107664 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: loaded library "security_plugin"
2021-01-12 10:14:46.289 5ffd0616.1 [unknown] 281457534107664 [unknown] 0 dn_6001_6002 01000 0 [BACKEND] WARNING: could not create any HA TCP/IP sockets
2021-01-12 10:14:46.294 5ffd0616.1 [unknown] 281457534107664 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: InitNuma numaNodeNum: 1 numa_distribute_mode: none inheritThreadPool: 0.
2021-01-12 10:14:46.294 5ffd0616.1 [unknown] 281457534107664 [unknown] 0 dn_6001_6002 01000 0 [BACKEND] WARNING: Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (4359 Mbytes) is larger.
2021-01-12 10:14:46.372 5ffd0616.1 [unknown] 281457534107664 [unknown] 0 dn_6001_6002 00000 0 [CACHE] LOG: set data cache size(805306368)
2021-01-12 10:14:46.438 5ffd0616.1 [unknown] 281457534107664 [unknown] 0 dn_6001_6002 00000 0 [CACHE] LOG: set metadata cache size(268435456)
2021-01-12 10:14:46.517 5ffd0616.1 [unknown] 281457534107664 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: gaussdb: fsync file "/opt/data/db1/gaussdb.state.temp" success
2021-01-12 10:14:46.517 5ffd0616.1 [unknown] 281457534107664 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: create gaussdb state file success: db state(STARTING_STATE), server mode(Normal)
2021-01-12 10:14:46.732 5ffd0616.1 [unknown] 281457534107664 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: max_safe_fds = 979, usable_fds = 1000, already_open = 11
bbox_dump_path is set to /opt/data/corefile/
2021-01-12 10:14:46.733 5ffd0616.1 [unknown] 281457534107664 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: the configure file /opt/data/app/etc/gscgroup_omm.cfg doesn't exist or the size of configure file has changed. Please create it by root user!
2021-01-12 10:14:46.733 5ffd0616.1 [unknown] 281457534107664 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: Failed to parse cgroup config file.

[2021-01-12 10:14:47.197][553923][][gs_ctl]: done
[2021-01-12 10:14:47.197][553923][][gs_ctl]: server started (/opt/data/db1)
```

查看进程：

```
[omm@ecs-268e-0004 data]$ ps ax | grep gaussdb
548647 ? Sl 636:57 /opt/data/app/bin/gaussdb -D /opt/data/dn1 -M primary
553926 pts/1 Sl 0:02 /opt/data/app/bin/gaussdb -D /opt/data/db1
554026 pts/1 S+ 0:00 grep --color=auto gaussdb
```

## 主库恢复成当前集群中一台从库<a name="section111375267123"></a>

```
[omm@ecs-268e-0004 ~]$ scp -r /opt/data/db1/ ecs-268e-0005:/opt/data/

Authorized users only. All activities may be monitored and reported.
000000000000 100% 8192 16.5MB/s 00:00
000000000000 100% 8192 22.4MB/s 00:00
gswlm_userinfo.cfg 100% 4800KB 325.2MB/s 00:00
000000000000 100% 8192 24.2MB/s 00:00
cacert.pem 100% 4399 14.4MB/s 00:00
postgresql.conf.lock 100% 1024 3.7MB/s 00:00
server.crt 100% 4402 14.1MB/s 00:00
backup_label.old 100% 228 750.0KB/s 00:00
postgresql.conf 100% 38KB 85.0MB/s 00:00
postmaster.opts 100% 47 159.6KB/s 00:00
pg_hba.conf.lock 100% 1024 3.7MB/s 00:00
server.key 100% 1766 5.4MB/s 00:00
pg_hba.conf.bak 100% 4582 14.9MB/s 00:00
000000000000 100% 256KB 250.0MB/s 00:00
...
```

将之前从库配置文件覆盖到db1目录：

```
[omm@ecs-268e-0005 ~]$ gs_ctl stop -D /opt/data/dn1/ -m f
[2021-01-12 10:19:47.793][148295][][gs_ctl]: gs_ctl stopped ,datadir is /opt/data/dn1
waiting for server to shut down.... done
server stopped
[omm@ecs-268e-0005 ~]$ cd /opt/data/db1/
[omm@ecs-268e-0005 db1]$ ls
backup_label.old gswlm_userinfo.cfg pg_errorinfo pg_llog pg_serial PG_VERSION postmaster.opts server.key.rand
base mot.conf pg_hba.conf pg_location pg_snapshots pg_xlog postmaster.pid
cacert.pem pg_clog pg_hba.conf.bak pg_multixact pg_stat_tmp postgresql.conf server.crt
gaussdb.state pg_csnlog pg_hba.conf.lock pg_notify pg_tblspc postgresql.conf.bak server.key
global pg_ctl.lock pg_ident.conf pg_replslot pg_twophase postgresql.conf.lock server.key.cipher
[omm@ecs-268e-0005 db1]$ mv postgresql.conf postgresql.conf.primary
[omm@ecs-268e-0005 db1]$ cp ../dn1/postgresql.conf ./
[omm@ecs-268e-0005 db1]$ cd ..
[omm@ecs-268e-0005 data]$ ls
app app_392c0438 corefile db1 dn1 dn1.cp gaussdb_log tmp tool
[omm@ecs-268e-0005 data]$ mv dn1 dn1.org
[omm@ecs-268e-0005 data]$ mv db1 dn1
```

启动并查看集群状态：

```
[2021-01-12 10:21:58.576][148447][][gs_ctl]: gs_ctl started,datadir is /opt/data/dn1 -M standby
[2021-01-12 10:21:58.620][148447][][gs_ctl]: waiting for server to start...
.0 LOG: [Alarm Module]can not read GAUSS_WARNING_TYPE env.

0 LOG: [Alarm Module]Host Name: ecs-268e-0005

0 LOG: [Alarm Module]Host IP: 127.0.0.1

0 LOG: [Alarm Module]Cluster Name: gauss_omm

0 LOG: [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 52

0 WARNING: failed to open feature control file, please check whether it exists: FileName=gaussdb.version, Errno=2, Errmessage=No such file or directory.
0 WARNING: failed to parse feature control file: gaussdb.version.
0 WARNING: Failed to load the product control file, so gaussdb cannot distinguish product version.
0 LOG: Failed to initialze environment for codegen.
0 WARNING: bbox_dump_path is set to /opt/data/corefile/

2021-01-12 10:21:58.709 5ffd07c6.1 [unknown] 281462476636176 [unknown] 0 dn_6001_6002 DB010 0 [REDO] LOG: Recovery parallelism, cpu count = 4, max = 4, actual = 4
2021-01-12 10:21:58.709 5ffd07c6.1 [unknown] 281462476636176 [unknown] 0 dn_6001_6002 DB010 0 [REDO] LOG: ConfigRecoveryParallelism, true_max_recovery_parallelism:4, max_recovery_parallelism:4
2021-01-12 10:21:58.709 5ffd07c6.1 [unknown] 281462476636176 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: [Alarm Module]can not read GAUSS_WARNING_TYPE env.

2021-01-12 10:21:58.709 5ffd07c6.1 [unknown] 281462476636176 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: [Alarm Module]Host Name: ecs-268e-0005

2021-01-12 10:21:58.709 5ffd07c6.1 [unknown] 281462476636176 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: [Alarm Module]Host IP: 127.0.0.1

2021-01-12 10:21:58.709 5ffd07c6.1 [unknown] 281462476636176 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: [Alarm Module]Cluster Name: gauss_omm

2021-01-12 10:21:58.709 5ffd07c6.1 [unknown] 281462476636176 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 52

2021-01-12 10:21:58.709 5ffd07c6.1 [unknown] 281462476636176 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: Transparent encryption disabled.

2021-01-12 10:21:58.712 5ffd07c6.1 [unknown] 281462476636176 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: loaded library "security_plugin"
2021-01-12 10:21:58.718 5ffd07c6.1 [unknown] 281462476636176 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: InitNuma numaNodeNum: 1 numa_distribute_mode: none inheritThreadPool: 0.
2021-01-12 10:21:58.718 5ffd07c6.1 [unknown] 281462476636176 [unknown] 0 dn_6001_6002 01000 0 [BACKEND] WARNING: Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (4359 Mbytes) is larger.
2021-01-12 10:21:58.718 5ffd07c6.1 [unknown] 281462476636176 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: choose next key because the shm of key 26000001 is not one of mine
2021-01-12 10:21:58.810 5ffd07c6.1 [unknown] 281462476636176 [unknown] 0 dn_6001_6002 00000 0 [CACHE] LOG: set data cache size(805306368)
2021-01-12 10:21:58.880 5ffd07c6.1 [unknown] 281462476636176 [unknown] 0 dn_6001_6002 00000 0 [CACHE] LOG: set metadata cache size(268435456)
2021-01-12 10:21:58.961 5ffd07c6.1 [unknown] 281462476636176 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: gaussdb: fsync file "/opt/data/dn1/gaussdb.state.temp" success
2021-01-12 10:21:58.961 5ffd07c6.1 [unknown] 281462476636176 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: create gaussdb state file success: db state(STARTING_STATE), server mode(Normal)
2021-01-12 10:21:59.045 5ffd07c6.1 [unknown] 281462476636176 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: max_safe_fds = 979, usable_fds = 1000, already_open = 11
bbox_dump_path is set to /opt/data/corefile/
2021-01-12 10:21:59.047 5ffd07c6.1 [unknown] 281462476636176 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: the configure file /opt/data/app/etc/gscgroup_omm.cfg doesn't exist or the size of configure file has changed. Please create it by root user!
2021-01-12 10:21:59.047 5ffd07c6.1 [unknown] 281462476636176 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: Failed to parse cgroup config file.

[2021-01-12 10:21:59.624][148447][][gs_ctl]: done
[2021-01-12 10:21:59.624][148447][][gs_ctl]: server started (/opt/data/dn1)
```

查看集群状态：

```
[omm@ecs-268e-0005 data]$ gs_om -t status --detail
[omm@ecs-268e-0004 opengauss0125]$ gs_om -t status --detail
[ Cluster State ]

cluster_state : Normal
redistributing : No
current_az : AZ_ALL

[ Datanode State ]

node node_ip instance state | node node_ip instance state
------------------------------------------------------------------------------------------------------------------------------------------------------
1 ecs-268e-0004 192.168.1.213 6001 /opt/data/dn1 P Primary Normal | 2 ecs-268e-0005 192.168.1.176 6002 /opt/data/dn1 S Standby Normal
```

## 从库恢复为集群中其他从库<a name="section44251457217"></a>

查看当前从库备份情况：

```
[omm@ecs-268e-0005 data]$ gs_probackup show -B /opt/probackupdir/

BACKUP INSTANCE 'opengauss0111'
============================================================================
Instance Version ID Recovery Time Mode WAL Mode TLI Time Data WAL Zratio Start LSN Stop LSN Status
============================================================================
opengauss0111 9.2 QMS0OU 2021-01-11 23:36:35+08 FULL STREAM 1/0 1m:7s 571MB 16MB 1.00 0/C000028 0/C0000A8 OK
opengauss0111 9.2 QMS07L 2021-01-11 23:26:10+08 FULL STREAM 1/0 1m:2s 571MB 16MB 1.00 0/B0006B8 0/B000738 OK
opengauss0111 9.2 QMRZXH ---- FULL STREAM 1/0 11h:4m 96kB 0 1.00 0/A000028 0/0 RUNNING
```

恢复到指定目录：

```
[omm@ecs-268e-0005 data]$ gs_probackup restore -B /opt/probackupdir/ --instance opengauss0111 -D /opt/data/dm1 -i QMS0OU
LOG: Restore begin.
LOG: there is no file tablespace_map
LOG: check tablespace directories of backup QMS0OU
LOG: check external directories of backup QMS0OU
WARNING: Process 135121 which used backup QMS0OU no longer exists
INFO: Validating backup QMS0OU
INFO: Backup QMS0OU data files are valid
LOG: Thread [1]: Opening WAL segment "/opt/probackupdir/backups/opengauss0111/QMS0OU/database/pg_xlog/00000001000000000000000C"
INFO: Backup QMS0OU WAL segments are valid
INFO: Backup QMS0OU is valid.
INFO: Restoring the database from backup at 2021-01-11 23:36:30+08
LOG: there is no file tablespace_map
LOG: Restore directories and symlinks...
INFO: Start restoring backup files. PGDATA size: 587MB
LOG: Start thread 1
INFO: Backup files are restored. Transfered bytes: 587MB, time elapsed: 0
INFO: Restore incremental ratio (less is better): 100% (587MB/587MB)
INFO: Syncing restored files to disk
INFO: Restored backup files are synced, time elapsed: 7s
INFO: Restore of backup QMS0OU completed.
```

关闭当前从库，启动恢复的从库，查看集群状态：

```
[omm@ecs-268e-0005 data]$ gs_ctl stop -m f -D /opt/data/dn1
[2021-01-12 10:27:54.035][148973][][gs_ctl]: gs_ctl stopped ,datadir is /opt/data/dn1
waiting for server to shut down......... done
server stopped

[2021-01-12 10:28:09.339][148991][][gs_ctl]: gs_ctl started,datadir is /opt/data/dm1
[2021-01-12 10:28:09.383][148991][][gs_ctl]: waiting for server to start...
.0 LOG: [Alarm Module]can not read GAUSS_WARNING_TYPE env.

0 LOG: [Alarm Module]Host Name: ecs-268e-0005

0 LOG: [Alarm Module]Host IP: 127.0.0.1

0 LOG: [Alarm Module]Cluster Name: gauss_omm

0 LOG: [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 52

0 WARNING: failed to open feature control file, please check whether it exists: FileName=gaussdb.version, Errno=2, Errmessage=No such file or directory.
0 WARNING: failed to parse feature control file: gaussdb.version.
0 WARNING: Failed to load the product control file, so gaussdb cannot distinguish product version.
0 LOG: Failed to initialze environment for codegen.
0 WARNING: bbox_dump_path is set to /opt/data/corefile/

2021-01-12 10:28:09.473 5ffd0939.1 [unknown] 281473532821520 [unknown] 0 dn_6001_6002 DB010 0 [REDO] LOG: Recovery parallelism, cpu count = 4, max = 4, actual = 4
2021-01-12 10:28:09.473 5ffd0939.1 [unknown] 281473532821520 [unknown] 0 dn_6001_6002 DB010 0 [REDO] LOG: ConfigRecoveryParallelism, true_max_recovery_parallelism:4, max_recovery_parallelism:4
2021-01-12 10:28:09.473 5ffd0939.1 [unknown] 281473532821520 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: [Alarm Module]can not read GAUSS_WARNING_TYPE env.

2021-01-12 10:28:09.473 5ffd0939.1 [unknown] 281473532821520 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: [Alarm Module]Host Name: ecs-268e-0005

2021-01-12 10:28:09.473 5ffd0939.1 [unknown] 281473532821520 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: [Alarm Module]Host IP: 127.0.0.1

2021-01-12 10:28:09.473 5ffd0939.1 [unknown] 281473532821520 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: [Alarm Module]Cluster Name: gauss_omm

2021-01-12 10:28:09.473 5ffd0939.1 [unknown] 281473532821520 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 52

2021-01-12 10:28:09.473 5ffd0939.1 [unknown] 281473532821520 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: Transparent encryption disabled.

2021-01-12 10:28:09.476 5ffd0939.1 [unknown] 281473532821520 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: loaded library "security_plugin"
2021-01-12 10:28:09.482 5ffd0939.1 [unknown] 281473532821520 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: InitNuma numaNodeNum: 1 numa_distribute_mode: none inheritThreadPool: 0.
2021-01-12 10:28:09.482 5ffd0939.1 [unknown] 281473532821520 [unknown] 0 dn_6001_6002 01000 0 [BACKEND] WARNING: Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (4359 Mbytes) is larger.
2021-01-12 10:28:09.482 5ffd0939.1 [unknown] 281473532821520 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: choose next key because the shm of key 26000001 is not one of mine
2021-01-12 10:28:09.571 5ffd0939.1 [unknown] 281473532821520 [unknown] 0 dn_6001_6002 00000 0 [CACHE] LOG: set data cache size(805306368)
2021-01-12 10:28:09.646 5ffd0939.1 [unknown] 281473532821520 [unknown] 0 dn_6001_6002 00000 0 [CACHE] LOG: set metadata cache size(268435456)
2021-01-12 10:28:09.728 5ffd0939.1 [unknown] 281473532821520 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: gaussdb: fsync file "/opt/data/dm1/gaussdb.state.temp" success
2021-01-12 10:28:09.728 5ffd0939.1 [unknown] 281473532821520 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: create gaussdb state file success: db state(STARTING_STATE), server mode(Normal)
2021-01-12 10:28:09.789 5ffd0939.1 [unknown] 281473532821520 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: max_safe_fds = 979, usable_fds = 1000, already_open = 11
bbox_dump_path is set to /opt/data/corefile/
2021-01-12 10:28:09.791 5ffd0939.1 [unknown] 281473532821520 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: the configure file /opt/data/app/etc/gscgroup_omm.cfg doesn't exist or the size of configure file has changed. Please create it by root user!
2021-01-12 10:28:09.791 5ffd0939.1 [unknown] 281473532821520 [unknown] 0 dn_6001_6002 00000 0 [BACKEND] LOG: Failed to parse cgroup config file.

[2021-01-12 10:28:10.387][148991][][gs_ctl]: done
[2021-01-12 10:28:10.387][148991][][gs_ctl]: server started (/opt/data/dm1)

[omm@ecs-268e-0005 data]$ gs_om -t status --detail
[ Cluster State ]

cluster_state : Degraded
redistributing : No
current_az : AZ_ALL

[ Datanode State ]

node node_ip instance state | node node_ip instance state
------------------------------------------------------------------------------------------------------------------------------------------------------
1 ecs-268e-0004 192.168.1.213 6001 /opt/data/dn1 P Primary Normal | 2 ecs-268e-0005 192.168.1.176 6002 /opt/data/dn1 S Down Manually stopped
```

查看集群状态：

```
[omm@ecs-268e-0004 ~]$ gs_om -t status --detail
[ Cluster State ]

cluster_state : Degraded
[omm@ecs-268e-0004 opengauss0125]$ gs_om -t status --detail
[ Cluster State ]

cluster_state : Normal
redistributing : No
current_az : AZ_ALL

[ Datanode State ]

node node_ip instance state | node node_ip instance state
------------------------------------------------------------------------------------------------------------------------------------------------------
1 ecs-268e-0004 192.168.1.213 6001 /opt/data/dn1 P Primary Normal | 2 ecs-268e-0005 192.168.1.176 6002 /opt/data/dn1 S Standby Normal

[omm@ecs-268e-0004 ~]$
```

正常。

