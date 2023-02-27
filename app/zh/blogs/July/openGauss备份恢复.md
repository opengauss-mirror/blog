---
title: 'openGauss备份恢复'

date: '2021-09-20'

category: 'blog'
tags: ['openGauss备份恢复']

archives: '2021-09'

author: '李宏达'

summary: 'openGauss备份恢复'

img: '/zh/blogs/July/title/img7.png'

times: '12:30'
---

# openGauss 备份恢复<a name="ZH-CN_TOPIC_0000001200514121"></a>

## gs_probackup<a name="section374152918366"></a>

- docker

  - 1.0.1

  ```
  docker run --name brm_opengauss \
  --privileged=true -d -e GS_PASSWORD=mtkOP@123 \
  -v `pwd`/conf/brm.yaml:/etc/brm.yaml \
  -v `pwd`/var/lib/brm:/var/lib/brm \
  -v `pwd`/var/log/brm:/var/log/brm \
  enmotech/opengauss:1.0.1
  ```

  - 1.1.0

    ```
    docker run --name brm_opengauss_1230 \
      --privileged=true -d -e GS_PASSWORD=mtkOP@123 \
      -v `pwd`/conf/brm.yaml:/etc/brm.yaml \
      -v `pwd`/var/lib/brm:/var/lib/brm \
      -v `pwd`/var/log/brm:/var/log/brm \
      enmotech/opengauss:1.1.0
    ```

## 初始化<a name="section4391114720374"></a>

```
export BACKUP_PATH=/home/omm/backup
gs_probackup init
```

## 添加实例<a name="section13254219380"></a>

```
gs_probackup add-instance --instance testdb --pgdata <openData的数据目录>
```

## 备份<a name="section19730171313818"></a>

```
gs_probackup backup --instance testdb -b full
```

## 配置数据库归档<a name="section13885163310382"></a>

设置参数

目录为 <gs_probackup 的 backup_path\>/wal/

```
archive_mode = on
archive_command = 'cp %p <gs_probackup的backup_path>/wal/<instance>/%f'
# cp %p /usr/local/pgsql/data/pg_archive/%f'
```

## 查看备份<a name="section181092030392"></a>

```
gs_probackup show --instance testdb
```

- 查看归档备份

  ```
  gs_probackup show --instance testdb --archive
  ```

## 恢复<a name="section13716183343918"></a>

```
gs_probackup restore -B backup-path --instance=instance_name
                 [-D pgdata-path] [-i backup-id] [-j threads_num] [--progress]
                 [--force] [--no-sync] [--no-validate] [--skip-block-validation]
                 [--external-mapping=OLDDIR=NEWDIR] [-T OLDDIR=NEWDIR]
                 [--skip-external-dirs] [-I incremental_mode]
                 [--recovery-target-time=time|--recovery-target-xid=xid
                  |--recovery-target-lsn=lsn|--recovery-target-name=target-name]
                 [--recovery-target-inclusive=boolean]
                 [--recovery-target-timeline=timeline]
                 [--recovery-target=immediate|latest]
                 [--recovery-target-action=pause|promote|shutdown]
                 [--restore-command=cmdline]
                 [--remote-proto=protocol] [--remote-host=destination]
                 [--remote-path=path] [--remote-user=username]
                 [--remote-port=port] [--ssh-options=ssh_options]
                 [--log-level-console=log-level-console]
                 [--log-level-file=log-level-file]
                 [--log-filename=log-filename]
                 [--error-log-filename=error-log-filename]
                 [--log-directory=log-directory]
                 [--log-rotation-size=log-rotation-size]
                 [--log-rotation-age=log-rotation-age]

  -B, --backup-path=backup-path    location of the backup storage area
      --instance=instance_name     name of the instance
  -D, --pgdata=pgdata-path         location of the database storage area
  -i, --backup-id=backup-id        backup to restore
  -j, --threads=threads_num        number of parallel threads
      --progress                   show progress
      --force                      ignore invalid status of the restored backup
      --no-sync                    do not sync restored files to disk
      --no-validate                disable backup validation during restore
      --skip-block-validation      set to validate only file-level checksum
      --external-mapping=OLDDIR=NEWDIR
                                   relocate the external directory from OLDDIR to NEWDIR
  -T, --tablespace-mapping=OLDDIR=NEWDIR
                                   relocate the tablespace from directory OLDDIR to NEWDIR
      --skip-external-dirs         do not restore all external directories
  -I, --incremental-mode=none|checksum|lsn
                                   reuse valid pages available in PGDATA if they have not changed
                                   (default: none)
```

## 场景<a name="section82961648133916"></a>

- 环境配置

  ```
  gs_probackup

  export BACKUP_PATH=/var/lib/brm
  gs_probackup init
  gs_probackup add-instance --instance testdb01 -D /var/lib/opengauss/data
  gs_probackup set-config --instance testdb01 --pgdatabase postgres
  gs_probackup show-config --instance testdb01
  # Backup instance information
  pgdata = /var/lib/opengauss/data
  system-identifier = 6910097200378281726
  # Connection parameters
  pgdatabase = postgres
  # Archive parameters
  archive-timeout = 5min
  # Logging parameters
  log-level-console = LOG
  log-level-file = OFF
  log-filename = pg_probackup.log
  log-rotation-size = 0TB
  log-rotation-age = 0d
  # Retention parameters
  retention-redundancy = 0
  retention-window = 0
  wal-depth = 0
  # Compression parameters
  compress-algorithm = none
  compress-level = 1
  # Remote access parameters
  remote-proto = ssh
  ```

- 数据库设置

  ```
  [omm@0150b32d2461 ~]$ gsql
  gsql ((openGauss 1.0.1 build e9da9fb9) compiled at 2020-10-01 13:58:32 commit 0 last mr  )
  Non-SSL connection (SSL connection is recommended when requiring high-security)
  Type "help" for help.

  omm=# show archive_mode;
   archive_mode
  --------------
   on
  (1 row)

  omm=# show archive_command;
            archive_command
  ------------------------------------
  cp %p /var/lib/brm/wal/testdb01/%f
  (1 row)

  omm=# select pg_switch_xlog();
  pg_switch_xlog
  ----------------
  0/72000150
  (1 row)
  ```

- 查看归档

  ```
  [omm@0150b32d2461 ~]$ ls -l /var/lib/brm/wal/testdb01/
  total 49152
  -rw------- 1 omm omm 16777216 Jan 11 03:30 00000001000000000000002F
  -rw------- 1 omm omm 16777216 Jan 11 03:30 000000010000000000000071
  -rw------- 1 omm omm 16777216 Jan 11 03:30 000000010000000000000072
  ```

- 模拟基础环境

  ```
  [omm@0150b32d2461 ~]$ gsql
  gsql ((openGauss 1.0.1 build e9da9fb9) compiled at 2020-10-01 13:58:32 commit 0 last mr  )
  Non-SSL connection (SSL connection is recommended when requiring high-security)
  Type "help" for help.

  omm=# create table brm_test(t timestamp);
  CREATE TABLE

  omm=# insert into brm_test values(now());
  INSERT 0 1
  omm=# select * from brm_test;
  t
  ----------------------------
   2021-01-11 03:33:40.737837
   2021-01-11 03:38:46.32794
   2021-01-11 03:39:42.466014
   2021-01-11 03:40:02.816579
   2021-01-11 07:29:21.98839
  (5 rows)
  ```

- 全备份

  ```
  [omm@0150b32d2461 ~]$ gs_probackup backup --instance testdb01 -b full
  INFO: Backup start, pg_probackup version: 2.4.2, instance: testdb01, backup ID: QMRFD9, backup mode: FULL, wal mode: STREAM, remote: false, compress-algorithm: none, compress-level: 1
  LOG: Backup destination is initialized
  WARNING: This PostgreSQL instance was initialized without data block checksums. pg_probackup have no way to detect data block corruption without them. Reinitialize PGDATA with option '--data-checksums'.
  LOG: Database backup start
  LOG: started streaming WAL at 0/86000000 (timeline 1)
   check identify system success
   send START_REPLICATION 0/86000000 success
   keepalive message is received
  INFO: PGDATA size: 317MB
  INFO: Start transferring data files
  LOG: Creating page header map "/var/lib/brm/backups/testdb01/QMRFD9/page_header_map"
   keepalive message is received
   keepalive message is received
   keepalive message is received
   keepalive message is received
   keepalive message is received
   keepalive message is received
   keepalive message is received
   keepalive message is received
   keepalive message is received
   keepalive message is received
   keepalive message is received
   keepalive message is received
   keepalive message is received
   keepalive message is received
   keepalive message is received
   keepalive message is received
  INFO: Data files are transferred, time elapsed: 31s
  INFO: wait for pg_stop_backup()
   keepalive message is received
  INFO: pg_stop backup() successfully executed
  LOG: stop_lsn: 0/860001D0
  LOG: Looking for LSN 0/860001D0 in segment: 000000010000000000000086
  LOG: Found WAL segment: /var/lib/brm/backups/testdb01/QMRFD9/database/pg_xlog/000000010000000000000086
  LOG: Thread [0]: Opening WAL segment "/var/lib/brm/backups/testdb01/QMRFD9/database/pg_xlog/000000010000000000000086"
  LOG: Found LSN: 0/860001D0
  (null): not renaming 000000010000000000000087, segment is not complete.
  LOG: finished streaming WAL at 0/87000130 (timeline 1)
  LOG: Getting the Recovery Time from WAL
  LOG: Thread [0]: Opening WAL segment "/var/lib/brm/backups/testdb01/QMRFD9/database/pg_xlog/000000010000000000000086"
  INFO: Syncing backup files to disk
  INFO: Backup files are synced, time elapsed: 2s
  INFO: Validating backup QMRFD9
  INFO: Backup QMRFD9 data files are valid
  INFO: Backup QMRFD9 resident size: 349MB
  INFO: Backup QMRFD9 completed
  ```

- 模拟增量数据

  ```
  gsql ((openGauss 1.0.1 build e9da9fb9) compiled at 2020-10-01 13:58:32 commit 0 last mr  )
  Non-SSL connection (SSL connection is recommended when requiring high-security)
  Type "help" for help.
  omm=# select pg_current_xlog_location(),
               pg_xlogfile_name(pg_current_xlog_location()),
               pg_xlogfile_name(pg_current_xlog_location()),
               txid_current(),
               now();omm-# omm-# omm-# omm-#
   pg_current_xlog_location |     pg_xlogfile_name     |     pg_xlogfile_name     | txid_current |              now
  --------------------------+--------------------------+--------------------------+--------------+-------------------------------
   0/87000130               | 000000010000000000000087 | 000000010000000000000087 |        11209 | 2021-01-11 07:57:25.414668+00
  (1 row)

  omm=#  select pg_switch_xlog();
  pg_switch_xlog
  ----------------
  0/870001D0
  (1 row)

  omm=# insert into brm_test values(now());
  INSERT 0 1
  omm=# select pg_current_xlog_location(),
               pg_xlogfile_name(pg_current_xlog_location()),
               pg_xlogfile_name(pg_current_xlog_location()),
               txid_current(),
               now();
  omm-# omm-# omm-# omm-#  pg_current_xlog_location |     pg_xlogfile_name     |     pg_xlogfile_name     | txid_current |              now
  --------------------------+--------------------------+--------------------------+--------------+-------------------------------
   0/88000208               | 000000010000000000000088 | 000000010000000000000088 |        11211 | 2021-01-11 07:57:40.428398+00
  (1 row)

  omm=# select pg_switch_xlog();
  pg_switch_xlog
  ----------------
  0/880002A8
  (1 row)

  omm=# select pg_switch_xlog();
  pg_switch_xlog
  ----------------
  0/89000150
  (1 row)

  omm=# insert into brm_test values(now());
  INSERT 0 1
  omm=#
  omm=# select pg_current_xlog_location(),
               pg_xlogfile_name(pg_current_xlog_location()),
               pg_xlogfile_name(pg_current_xlog_location()),
               txid_current(),
               now();omm-# omm-# omm-# omm-#
   pg_current_xlog_location |     pg_xlogfile_name     |     pg_xlogfile_name     | txid_current |              now
  --------------------------+--------------------------+--------------------------+--------------+-------------------------------
   0/8A000208               | 00000001000000000000008A | 00000001000000000000008A |        11213 | 2021-01-11 07:58:06.702327+00
  (1 row)

  omm=# select pg_switch_xlog();
  pg_switch_xlog
  ----------------
  0/8A0002A8
  (1 row)

  omm=# select pg_current_xlog_location(),
               pg_xlogfile_name(pg_current_xlog_location()),
               pg_xlogfile_name(pg_current_xlog_location()),
               txid_current(),
               now();
  omm-# omm-# omm-# omm-#  pg_current_xlog_location |     pg_xlogfile_name     |     pg_xlogfile_name     | txid_current |              now
  --------------------------+--------------------------+--------------------------+--------------+-------------------------------
   0/8B000130               | 00000001000000000000008B | 00000001000000000000008B |        11214 | 2021-01-11 07:58:15.204024+00
  (1 row)

  omm=#
  ```

- 查看备份信息

  ```
  [omm@0150b32d2461 ~]$ gs_probackup show --archive

  ARCHIVE INSTANCE 'testdb01'
  ===============================================================================================================================
  TLI  Parent TLI  Switchpoint  Min Segno                 Max Segno                 N segments  Size  Zratio  N backups  Status
  ===============================================================================================================================
  1    0           0/0          000000010000000000000086  00000001000000000000008A  5           80MB  1.00    1          OK
  [omm@0150b32d2461 ~]$ gs_probackup show

  BACKUP INSTANCE 'testdb01'
  ===================================================================================================================================
  Instance  Version  ID      Recovery Time           Mode  WAL Mode  TLI  Time   Data   WAL  Zratio  Start LSN   Stop LSN    Status
  ===================================================================================================================================
  testdb01  9.2      QMRFD9  2021-01-11 07:56:30+00  FULL  STREAM    1/0   41s  333MB  16MB    0.95  0/86000028  0/860001D0  OK
  ```

- 基于时间点的恢复

  恢复全量备份 —\> 2 .用户指定了 xid/time/lsn. brm 进行遍历所有备份,找出最近的备份集通过 gs_probackup 进行恢复

  ```
  [omm@0150b32d2461 ~]$  gs_probackup restore --instance testdb01 -D /home/omm/a1/ -i QMRFD9
  LOG: Restore begin.
  LOG: there is no file tablespace_map
  LOG: check tablespace directories of backup QMRFD9
  LOG: check external directories of backup QMRFD9
  INFO: Validating backup QMRFD9
  INFO: Backup QMRFD9 data files are valid
  LOG: Thread [1]: Opening WAL segment "/var/lib/brm/backups/testdb01/QMRFD9/database/pg_xlog/000000010000000000000086"
  INFO: Backup QMRFD9 WAL segments are valid
  INFO: Backup QMRFD9 is valid.
  INFO: Restoring the database from backup at 2021-01-11 07:55:57+00
  LOG: there is no file tablespace_map
  LOG: Restore directories and symlinks...
  INFO: Start restoring backup files. PGDATA size: 333MB
  LOG: Start thread 1
  INFO: Backup files are restored. Transfered bytes: 349MB, time elapsed: 2s
  INFO: Restore incremental ratio (less is better): 105% (349MB/333MB)
  INFO: Syncing restored files to disk
  INFO: Restored backup files are synced, time elapsed: 0
  INFO: Restore of backup QMRFD9 completed.
  ```

- 编辑 recover.conf —\> 3. 如果没有指定 time/lsn/xid 不生成 recover.conf 文件.如果指定了生成 recover.conf.

  ```
  vi a1/recover.conf
  # recovery_target_time = '2021-01-11 03:40:02+00'
  recovery_target_lsn = '0/880002A8'
  #recovery_target_action = 'pause'
  %p --> pg_xlog/000000010000000000000001
  %f --> 000000010000000000000001
  restore_command = 'cp /var/lib/brm/wal/testdb01/%f %p'
  # restore_command = 'brm get-wal -f %f -p %p'
  pause_at_recovery_target = true
  ```

- 编辑配置文件（同一台防止端口冲突关闭归档 —\> 4. 是否需要配置 postgres.conf 文件

  ```
  echo "port=6433" >> a1/postgresql.conf
  echo "archive_mode=off" >> a1/postgresql.conf
  ```

- 启动实例

  gs_ctl start -D /home/omm/a1 —\> 5. 恢复成功进行 gs_ctl start -D 恢复目录

  ```
  [2021-01-11 08:14:56.533][313][][gs_ctl]: gs_ctl started,datadir is -D "/home/omm/a1"
  [2021-01-11 08:14:56.576][313][][gs_ctl]: port:5432 already in use. /proc/net/tcp:
    sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode
     0: 00000000:1538 00000000:0000 0A 00000000:00000000 00:00000000 00000000    70        0 2236132 1 0000000000000000 100 0 0 10 0
  [2021-01-11 08:14:56.576][313][][gs_ctl]: CheckPort: popen(command:lsof -i:5432 | grep -E 'COMMAND|LISTEN').
  COMMAND   PID USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME

  GaussMast   1  omm    7u  IPv4 2236132      0t0  TCP *:postgres (LISTEN)

  GaussMast   1  omm    8u  IPv6 2236133      0t0  TCP *:postgres (LISTEN)

  [2021-01-11 08:14:56.673][313][][gs_ctl]: port conflict when start server
  [2021-01-11 08:14:56.674][313][][gs_ctl]: waiting for server to start...
  .0 LOG:  The core dump path in core_pattern is an invalid directory.
  0 [BACKEND] LOG:  Begin to start openGauss Database.
  2021-01-11 08:14:56.761 [unknown] [unknown] localhost 139701065868352 0 0 [BACKEND] LOG:  Transparent encryption disabled.
  2021-01-11 08:14:56.763 [unknown] [unknown] localhost 139701065868352 0 0 [BACKEND] WARNING:  could not create any HA TCP/IP sockets
  2021-01-11 08:14:56.765 [unknown] [unknown] localhost 139701065868352 0 0 [BACKEND] WARNING:  No explicit IP is configured for listen_addresses GUC.
  2021-01-11 08:14:56.765 [unknown] [unknown] localhost 139701065868352 0 0 [BACKEND] LOG:  InitNuma numaNodeNum: 1 numa_distribute_mode: none inheritThreadPool: 0.
  2021-01-11 08:14:56.765 [unknown] [unknown] localhost 139701065868352 0 0 [BACKEND] LOG:  shared memory 321 Mbytes, memory context 11454 Mbytes, max process memory 12288 Mbytes
  2021-01-11 08:14:56.765 [unknown] [unknown] localhost 139701065868352 0 0 [BACKEND] LOG:  Initilize the memory protect with Process Chunks number 11454, change bits 20
  2021-01-11 08:14:56.785 [unknown] [unknown] localhost 139701065868352 0 0 [CACHE] LOG:  set data cache  size(402653184)
  2021-01-11 08:14:56.796 [unknown] [unknown] localhost 139701065868352 0 0 [CACHE] LOG:  set metadata cache  size(134217728)
  2021-01-11 08:14:56.848 [unknown] [unknown] localhost 139701065868352 0 0 [BACKEND] LOG:  gaussdb: fsync file "/home/omm/a1/gaussdb.state.temp" success
  2021-01-11 08:14:56.849 [unknown] [unknown] localhost 139701065868352 0 0 [BACKEND] LOG:  create gaussdb state file success: db state(STARTING_STATE), server mode(Normal)
  2021-01-11 08:14:56.908 [unknown] [unknown] localhost 139701065868352 0 0 [BACKEND] LOG:  max_safe_fds = 976, usable_fds = 1000, already_open = 14
  2021-01-11 08:14:56.909 [unknown] [unknown] localhost 139701065868352 0 0 [BACKEND] LOG:  The core dump path in core_pattern is an invalid directory.
  2021-01-11 08:14:56.910 [unknown] [unknown] localhost 139701065868352 0 0 [BACKEND] LOG:  Success to start openGauss Database. If you specify "&", please press any key to exit...
  [2021-01-11 08:14:57.675][313][][gs_ctl]:  waitpid 319 failed, exitstatus is 256, ret is 2

  [2021-01-11 08:14:57.675][313][][gs_ctl]: stopped waiting
  [2021-01-11 08:14:57.675][313][][gs_ctl]: could not start server
  [2021-01-11 08:14:57.675][313][][gs_ctl]: Examine the log output.
  [omm@0150b32d2461 ~]$ vi a1/recovery.conf
  [omm@0150b32d2461 ~]$ gs_ctl start -D /home/omm/a1/
  [2021-01-11 08:15:29.342][352][][gs_ctl]: gs_ctl started,datadir is -D "/home/omm/a1"
  [2021-01-11 08:15:29.401][352][][gs_ctl]: port:5432 already in use. /proc/net/tcp:
    sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode
     0: 00000000:1538 00000000:0000 0A 00000000:00000000 00:00000000 00000000    70        0 2236132 1 0000000000000000 100 0 0 10 0
  [2021-01-11 08:15:29.401][352][][gs_ctl]: CheckPort: popen(command:lsof -i:5432 | grep -E 'COMMAND|LISTEN').
  COMMAND   PID USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME

  GaussMast   1  omm    7u  IPv4 2236132      0t0  TCP *:postgres (LISTEN)

  GaussMast   1  omm    8u  IPv6 2236133      0t0  TCP *:postgres (LISTEN)

  [2021-01-11 08:15:29.500][352][][gs_ctl]: port conflict when start server
  [2021-01-11 08:15:29.500][352][][gs_ctl]: waiting for server to start...
  .0 LOG:  The core dump path in core_pattern is an invalid directory.
  0 [BACKEND] LOG:  Begin to start openGauss Database.
  2021-01-11 08:15:29.627 [unknown] [unknown] localhost 140439454434368 0 0 [BACKEND] LOG:  Transparent encryption disabled.
  2021-01-11 08:15:29.628 [unknown] [unknown] localhost 140439454434368 0 0 [BACKEND] WARNING:  could not create any HA TCP/IP sockets
  2021-01-11 08:15:29.631 [unknown] [unknown] localhost 140439454434368 0 0 [BACKEND] WARNING:  No explicit IP is configured for listen_addresses GUC.
  2021-01-11 08:15:29.631 [unknown] [unknown] localhost 140439454434368 0 0 [BACKEND] LOG:  InitNuma numaNodeNum: 1 numa_distribute_mode: none inheritThreadPool: 0.
  2021-01-11 08:15:29.631 [unknown] [unknown] localhost 140439454434368 0 0 [BACKEND] LOG:  shared memory 321 Mbytes, memory context 11454 Mbytes, max process memory 12288 Mbytes
  2021-01-11 08:15:29.631 [unknown] [unknown] localhost 140439454434368 0 0 [BACKEND] LOG:  Initilize the memory protect with Process Chunks number 11454, change bits 20
  2021-01-11 08:15:29.659 [unknown] [unknown] localhost 140439454434368 0 0 [CACHE] LOG:  set data cache  size(402653184)
  2021-01-11 08:15:29.674 [unknown] [unknown] localhost 140439454434368 0 0 [CACHE] LOG:  set metadata cache  size(134217728)
  2021-01-11 08:15:29.741 [unknown] [unknown] localhost 140439454434368 0 0 [BACKEND] LOG:  gaussdb: fsync file "/home/omm/a1/gaussdb.state.temp" success
  2021-01-11 08:15:29.741 [unknown] [unknown] localhost 140439454434368 0 0 [BACKEND] LOG:  create gaussdb state file success: db state(STARTING_STATE), server mode(Normal)
  2021-01-11 08:15:29.775 [unknown] [unknown] localhost 140439454434368 0 0 [BACKEND] LOG:  max_safe_fds = 976, usable_fds = 1000, already_open = 14
  2021-01-11 08:15:29.775 [unknown] [unknown] localhost 140439454434368 0 0 [BACKEND] LOG:  The core dump path in core_pattern is an invalid directory.
  2021-01-11 08:15:29.777 [unknown] [unknown] localhost 140439454434368 0 0 [BACKEND] LOG:  Success to start openGauss Database. If you specify "&", please press any key to exit...

  [2021-01-11 08:15:30.517][352][][gs_ctl]:  done
  [2021-01-11 08:15:30.517][352][][gs_ctl]: server started (/home/omm/a1)
  ```

- 验证

  ```
  [omm@0150b32d2461 ~]$ gsql -p6433
  gsql ((openGauss 1.0.1 build e9da9fb9) compiled at 2020-10-01 13:58:32 commit 0 last mr  )
  Non-SSL connection (SSL connection is recommended when requiring high-security)
  Type "help" for help.

  omm=# select * from brm_test;
  t
  ----------------------------
  2021-01-11 03:33:40.737837
  2021-01-11 03:38:46.32794
  2021-01-11 03:39:42.466014
  2021-01-11 03:40:02.816579
  2021-01-11 07:29:21.98839
  2021-01-11 07:57:36.799356
  (6 rows)
  ```

## lsn<a name="section9970162834512"></a>

```
[omm@7ec0d4302ea3 ~]$ gs_probackup validate --instance testdb01 -D /home/omm/a1/ --recovery-target-lsn=0/79000228
LOG: Validate begin.
INFO: Validating backup QMR39R
INFO: Backup QMR39R data files are valid
LOG: Thread [1]: Opening WAL segment "/var/lib/brm/backups/testdb01/QMR39R/database/pg_xlog/000000010000000000000076"
LOG: Extracting pagemap from tli 1 on range from 0/760001D0 to 0/0
LOG: Thread [1]: Opening WAL segment "/var/lib/brm/wal/testdb01/000000010000000000000076"
WARNING: Thread [1]: Could not read WAL record at 0/77000000: read xlog page failed at 0/77000028
ERROR: Thread [1]: WAL segment "/var/lib/brm/wal/testdb01/000000010000000000000076" is absent
WARNING: Recovery can be done up to time 2021-01-11 03:35:03+00, xid 9930 and LSN 0/760001D0
ERROR: Not enough WAL records to lsn 0/79000228
[omm@7ec0d4302ea3 ~]$ ls -l /var/lib/brm/wal/testdb01/000000010000000000000076
-rw------- 1 omm omm 16777216 Jan 11 03:35 /var/lib/brm/wal/testdb01/000000010000000000000076
[omm@0150b32d2461 ~]$ gs_probackup restore --instance testdb01 --recovery-target-lsn='0/880002A8' --restore-command='cp /var/lib/brm/wal/testdb01/%f %p' --no-validate -D /home/omm/a1/
LOG: Restore begin.
LOG: there is no file tablespace_map
LOG: check tablespace directories of backup QMRFD9
# recovery.conf generated by pg_probackup 2.4.2
LOG: check external directories of backup QMRFD9
WARNING: Backup QMRFD9 is used without validation.
ERROR: Backup QMRFD9 was created for version 9.2 which doesn't support recovery_target_lsn   --->
```
