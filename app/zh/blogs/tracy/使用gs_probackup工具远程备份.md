---
title: '使用gs_probackup工具远程备份'

date: '2022-04-19'

category: 'blog'
tags: ['使用gs_probackup工具远程备份']

archives: '2022-04'

author: 'tracy'

summary: '使用gs_probackup工具远程备份'

img: '/zh/blogs/tracy/title/img20.png'

times: '10:20'
---

# 使用 gs_probackup 工具远程备份

本文出处：[https://www.modb.pro/db/336103](https://www.modb.pro/db/336103)

## gs_probackup 简介

gs_probackup 是一个用于管理 openGauss 数据库备份和恢复的工具。它对 openGauss 实例进行定期备份，以便在数据库出现故障时能够恢复服务器。
•可用于备份单机数据库或者主节点数据库，为物理备份。
•可备份外部目录的内容，如脚本文件、配置文件、日志文件、dump 文件等。
•支持增量备份、定期备份和远程备份。
•可设置备份的留存策略。

前提条件
•可以正常连接 openGauss 数据库。
•若要使用 PTRACK 增量备份，需在 postgresql.conf 中手动添加参数“enable_cbm_tracking = on”。
•为了防止 xlog 在传输结束前被清理，请适当调高 postgresql.conf 文件中 wal_keep_segments 的值。

限制说明
•备份必须由运行数据库服务器的用户执行。
•备份和恢复的数据库服务器的主版本号必须相同。
•如果要通过 ssh 在远程模式下备份数据库，需要在本地和远程主机安装相同主版本的数据库，并通过 ssh-copy-id remote_user@remote_host 命令设置本地主机备份用户和远程主机数据库用户的无密码 ssh 连接。
•远程模式下只能执行 add-instance、backup、restore 子命令。
•使用 restore 子命令前，应先停止 gaussdb 进程。
•当存在用户自定义表空间时，备份的时候要加上 --external-dirs 参数，否则，该表空间不会被备份。
•当备份的规模比较大时，为了防止备份过程中 timeout 发生，请适当调整 postgresql.conf 文件的参数 session_timeout、wal_sender_timeout。并且在备份的命令行参数中适当调整参数–rw-timeout 的值。
•恢复时，使用-T 选项把备份中的外部目录重定向到新目录时，请同时指定参数–external-mapping。
•增量备份恢复后，之前创建的逻辑复制槽不可用，需删除重建。

本文主要介绍如何使用 gs_probackup 工具进行远程备份。

## gs_probackup 远程备份相关参数

进行远程备份时，主要需要设置两个远程连接参数：(其他远程连接参数，使用默认值即可。)
•–remote-host=destination :指定要连接的远程主机的 IP 地址或主机名。
•–remote-user=username :指定 SSH 连接的远程主机用户。如果省略此参数，则使用当前发起 SSH 连接的用户。默认值：当前用户

## gs_probackup 远程备份举例

### 初始化备份目录

```
$ gs_probackup init -B /home/omm2/backup1
INFO: Backup catalog '/home/omm2/backup1' successfully inited
```

### 添加一个新的备份实例

```
$ /u01/mogdb2.1.0/app/bin/gs_probackup add-instance -B /home/omm2/backup1 --instance=dn_6001 --remote-host=192.168.2.150  --remote-user=omm2  -D /u01/mogdb2.1.0/data/db1 -Urepl -p30000 -dpostgres
LOG: Start SSH client process, pid 10597
INFO: Instance 'dn_6001' successfully inited

LOG: Start SSH client process, pid 28068
INFO: Instance 'dn_6001' successfully inited
```

### 数据库全备

```
$ gs_probackup backup -B /home/omm2/backup1 --instance=dn_6001 -b FULL --remote-host=192.168.2.150  --remote-user=omm2
INFO: Backup start, gs_probackup version: 2.4.2, instance: dn_6001, backup ID: R80P6X, backup mode: FULL, wal mode: STREAM, remote: true, compress-algorithm: none, compress-level: 1
LOG: Backup destination is initialized
Password for user repl:
WARNING: This openGauss instance was initialized without data block checksums. gs_probackup have no way to detect data block corruption without them. Reinitialize PGDATA with option '--data-checksums'.
LOG: Start SSH client process, pid 10732
LOG: Database backup start
LOG: started streaming WAL at 0/D000000 (timeline 1)
[2022-02-28 21:52:14]: check identify system success
[2022-02-28 21:52:14]: send START_REPLICATION 0/D000000 success
[2022-02-28 21:52:14]: keepalive message is received
[2022-02-28 21:52:14]: keepalive message is received
LOG: SSH process 10732 is terminated with status 0
INFO: PGDATA size: 619MB
INFO: Start transferring data files
LOG: Start SSH client process, pid 10736
LOG: Creating page header map "/home/omm2/backup1/backups/dn_6001/R80P6X/page_header_map"
[2022-02-28 21:52:17]: keepalive message is received
[2022-02-28 21:52:20]: keepalive message is received
[2022-02-28 21:52:20]: keepalive message is received
[2022-02-28 21:52:23]: keepalive message is received
[2022-02-28 21:52:26]: keepalive message is received
[2022-02-28 21:52:26]: keepalive message is received
LOG: SSH process 10736 is terminated with status 0
INFO: Data files are transferred, time elapsed: 14s
[2022-02-28 21:52:29]: keepalive message is received
INFO: wait for pg_stop_backup()
INFO: pg_stop backup() successfully executed
LOG: stop_lsn: 0/D0001E8
LOG: Looking for LSN 0/D0001E8 in segment: 00000001000000000000000D
LOG: Found WAL segment: /home/omm2/backup1/backups/dn_6001/R80P6X/database/pg_xlog/00000001000000000000000D
LOG: Thread [0]: Opening WAL segment "/home/omm2/backup1/backups/dn_6001/R80P6X/database/pg_xlog/00000001000000000000000D"
LOG: Found LSN: 0/D0001E8
LOG: finished streaming WAL at 0/E000000 (timeline 1)
LOG: Getting the Recovery Time from WAL
LOG: Thread [0]: Opening WAL segment "/home/omm2/backup1/backups/dn_6001/R80P6X/database/pg_xlog/00000001000000000000000D"
INFO: Syncing backup files to disk
INFO: Backup files are synced, time elapsed: 0
INFO: Validating backup R80P6X
INFO: Backup R80P6X data files are valid
INFO: Backup R80P6X resident size: 635MB
INFO: Backup R80P6X completed
```

### 显示备份信息

```
$ gs_probackup show -B /home/omm2/backup1

BACKUP INSTANCE 'dn_6001'
=================================================================================================================================
 Instance  Version  ID      Recovery Time           Mode  WAL Mode  TLI  Time   Data   WAL  Zratio  Start LSN  Stop LSN   Status
=================================================================================================================================
 dn_6001   9.2      R80P6X  2022-02-28 21:52:28+08  FULL  STREAM    1/0   24s  619MB  16MB    1.00  0/D000028  0/D0001E8  OK

$ gs_probackup show -B /home/omm2/backup1 --instance dn_6001 -i R80P6X
#Configuration
backup-mode = FULL
stream = true
compress-alg = none
compress-level = 1
from-replica = false

#Compatibility
block-size = 8192
xlog-block-size = 8192
checksum-version = 0
program-version = 2.4.2
server-version = 9.2

#Result backup info
timelineid = 1
start-lsn = 0/D000028
stop-lsn = 0/D0001E8
start-time = '2022-02-28 21:52:09+08'
end-time = '2022-02-28 21:52:33+08'
recovery-xid = 42848
recovery-time = '2022-02-28 21:52:28+08'
recovery-name = 'backup R80P6X'
data-bytes = 649266705
wal-bytes = 16777216
uncompressed-bytes = 649218794
pgdata-bytes = 649218794
status = OK
content-crc = 4089751389
```
