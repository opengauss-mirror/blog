+++

title =  "openGauss物理备份恢复之gs\_basebackup" 

date = "2021-08-09" 

tags = [ "openGauss物理备份恢复之gs\_basebackup"] 

archives = "2021-08" 

author = "Walrus" 

summary = "openGauss物理备份恢复之gs\_basebackup"

img = "/zh/post/July/title/img8.png" 

times = "12:30"

+++



# openGauss物理备份恢复之gs\_basebackup<a name="ZH-CN_TOPIC_0000001127157812"></a>

## gs\_basebackup背景说明<a name="section544616422307"></a>

-   gs\_basebackup仅支持全量备份，不支持增量。
-   gs\_basebackup当前支持热备份模式和压缩格式备份模式。
-   gs\_basebackup在备份包含绝对路径的表空间时，如果在同一台机器上进行备份，可以通过tablespace-mapping重定向表空间路径，或使用归档模式进行备份。

## gs\_basebackup参数说明<a name="section934511512307"></a>

gs\_basebackup参数可以分为如下几类：

-   -D directory     备份文件输出的目录，必选项。

常用参数：

-   -c，–checkpoint=fast|spread   设置检查点模式为fast或者spread\(默认\)。
-   -l，–label=LABEL  为备份设置标签。
-   -P，–progress  启用进展报告。
-   -v， –verbose  启用冗长模式。
-   -V， –version  打印版本后退出。
-   -?，–help  显示gs\_basebackup命令行参数。
-   -T，–tablespace-mapping=olddir=newdir

    在备份期间将目录olddir中的表空间重定位到newdir中。为使之有效，olddir必须正好匹配表空间所在的路径（但如果备份中没有包含olddir中的表空间也不是错误）。olddir和newdir必须是绝对路径。如果一个路径凑巧包含了一个=符号，可用反斜线对它转义。对于多个表空间可以多次使用这个选项。

-   -F，–format=plain|tar

    设置输出格式为plain\(默认\)或者tar。没有设置该参数的情况下，默认–format=plain。plain格式把输出写成平面文件，使用和当前数据目录和表空间相同的布局。当集簇没有额外表空间时，整个数据库将被放在目标目录中。如果集簇包含额外的表空间，主数据目录将被放置在目标目录中，但是所有其他表空间将被放在它们位于服务器上的相同的绝对路径中。tar模式将输出写成目标目录中的 tar 文件。主数据目录将被写入到一个名为base.tar的文件中，并且其他表空间将被以其 OID 命名。生成的tar包，需要用gs\_tar命令解压。

-   -X， –xlog-method=fetch|stream

    设置xlog传输方式。没有设置该参数的情况下，默认–xlog-method=stream。在备份中包括所需的预写式日志文件（WAL文件）。这包括所有在备份期间产生的预写式日志。fetch方式在备份末尾收集预写式日志文件。因此，有必要把wal\_keep\_segments参数设置得足够高，这样在备份末尾之前日志不会被移除。如果在要传输日志时它已经被轮转，备份将失败并且是不可用的。stream方式在备份被创建时流传送预写式日志。这将开启一个到服务器的第二连接并且在运行备份时并行开始流传输预写式日志。因此，它将使用最多两个由max\_wal\_senders参数配置的连接。只要客户端能保持接收预写式日志，使用这种模式不需要在主控机上保存额外的预写式日志。

-   -x，–xlog 使用这个选项等效于和方法fetch一起使用-X。
-   -Z –compress=level

    启用对 tar 文件输出的 gzip 压缩，并且制定压缩级别（0 到 9，0 是不压缩，9 是最佳压缩）。只有使用 tar 格式时压缩才可用，并且会在所有tar文件名后面自动加上后缀.gz。

-   -z   启用对 tar 文件输出的 gzip 压缩，使用默认的压缩级别。只有使用 tar 格式时压缩才可用，并且会在所有tar文件名后面自动加上后缀.gz。
-   -t，–rw-timeout  设置备份期间checkpoint的时间限制，默认限制时间为120s。当数据库全量checkpoint耗时较长时，可以适当增大rw-timeout限制时间。

连接参数

-   -h, –host=HOSTNAME  指定正在运行服务器的主机名或者Unix域套接字的路径。
-   -p，–port=PORT  指定数据库服务器的端口号
-   -U，–username=USERNAME  指定连接数据库的用户。
-   -s, –status-interval=INTERVAL  发送到服务器的状态包的时间\(以秒为单位\)
-   -w,–no-password  不出现输入密码提示。
-   -W, –password 当使用-U参数连接本地数据库或者连接远端数据库时，可通过指定该选项出现输入密码提示。

## **实验示例**<a name="section379319118314"></a>

**主节点丢失重要文件模拟实验：**

-   查看群集状态：

    ```
    [omm@wzsy01 ~]$ gs_om -t status --detail
    [   Cluster State   ]
    
    
    cluster_state   : Normal
    redistributing  : No
    current_az      : AZ_ALL
    
    
    [  Datanode State   ]
    node      node_ip         instance                            state            | node      node_ip         instance                            state
    --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    1  wzsy01 9.1.14.39       6001 opt/huawei/install/data/d1 P Primary Normal | 2  wzsy02 9.1.14.40       6002 opt/huawei/install/data/d2 S Standby Normal
    
    ```


-   备份主节点：

    ```
    [omm@wzsy01 ~]$ gs_basebackup -D home/omm/backup/ -h wzsy01 -p 15400
    INFO:  The starting position of the xlog copy of the full build is: 0/4B000028. The slot minimum LSN is: 0/4B000140.
    [2021-07-26 11:22:00]:begin build tablespace list
    [2021-07-26 11:22:00]:finish build tablespace list
    [2021-07-26 11:22:00]:begin get xlog by xlogstream
    [2021-07-26 11:22:00]: check identify system success
    [2021-07-26 11:22:00]: send START_REPLICATION 0/4B000000 success
    [2021-07-26 11:22:00]: keepalive message is received
    [2021-07-26 11:22:00]: keepalive message is received
    [2021-07-26 11:22:03]: keepalive message is received
    [2021-07-26 11:22:11]:gs_basebackup: base backup successfully
    [omm@wzsy01 ~]$ cd backup/
    [omm@wzsy01 backup]$ ls -lh
    total 4.9M
    -rw------- 1 omm dbgrp  208 Jul 26 11:22 backup_label
    drwx------ 6 omm dbgrp   54 Jul 26 11:22 base
    -rw------- 1 omm dbgrp 4.3K Jul 26 11:22 cacert.pem
    drwx------ 2 omm dbgrp 4.0K Jul 26 11:22 global
    -rw------- 1 omm dbgrp 4.7M Jul 26 11:22 gswlm_userinfo.cfg
    -rw------- 1 omm dbgrp  20K Jul 26 11:22 mot.conf
    drwx------ 2 omm dbgrp   26 Jul 26 11:22 pg_clog
    drwx------ 2 omm dbgrp   26 Jul 26 11:22 pg_csnlog
    -rw------- 1 omm dbgrp    0 Jul 26 11:22 pg_ctl.lock
    drwx------ 2 omm dbgrp    6 Jul 26 11:22 pg_errorinfo
    -rw------- 1 omm dbgrp 4.5K Jul 26 11:22 pg_hba.conf
    -rw------- 1 omm dbgrp 4.5K Jul 26 11:22 pg_hba.conf.bak
    -rw------- 1 omm dbgrp 1.0K Jul 26 11:22 pg_hba.conf.lock
    -rw------- 1 omm dbgrp 1.6K Jul 26 11:22 pg_ident.conf
    drwx------ 4 omm dbgrp   39 Jul 26 11:22 pg_llog
    drwx------ 4 omm dbgrp   36 Jul 26 11:22 pg_multixact
    drwx------ 2 omm dbgrp   26 Jul 26 11:22 pg_notify
    drwx------ 2 omm dbgrp    6 Jul 26 11:22 pg_replslot
    drwx------ 2 omm dbgrp    6 Jul 26 11:22 pg_serial
    drwx------ 2 omm dbgrp    6 Jul 26 11:22 pg_snapshots
    drwx------ 2 omm dbgrp   25 Jul 26 11:22 pg_stat_tmp
    drwx------ 2 omm dbgrp    6 Jul 26 11:22 pg_tblspc
    drwx------ 2 omm dbgrp    6 Jul 26 11:22 pg_twophase
    -rw------- 1 omm dbgrp    4 Jul 26 11:22 PG_VERSION
    drwx------ 3 omm dbgrp   92 Jul 26 11:22 pg_xlog
    -rw------- 1 omm dbgrp  38K Jul 26 11:22 postgresql.conf
    -rw------- 1 omm dbgrp  38K Jul 26 11:22 postgresql.conf.bak
    -rw------- 1 omm dbgrp 1.0K Jul 26 11:22 postgresql.conf.lock
    -rw------- 1 omm dbgrp 4.3K Jul 26 11:22 server.crt
    -rw------- 1 omm dbgrp 1.8K Jul 26 11:22 server.key
    -rw------- 1 omm dbgrp   56 Jul 26 11:22 server.key.cipher
    -rw------- 1 omm dbgrp   24 Jul 26 11:22 server.key.rand
    ```

-   模拟主节点丢失文件

    ```
    [omm@wzsy01 ~]$ cd opt/huawei/install/data/d1/
    [omm@wzsy01 d1]$ ls
    base                pg_csnlog         pg_llog       pg_stat_tmp          postgresql.conf.lock
    cacert.pem          pg_ctl.lock       pg_location   pg_tblspc            postmaster.opts
    gaussdb.state       pg_errorinfo      pg_multixact  pg_twophase          postmaster.pid
    global              pg_hba.conf       pg_notify     PG_VERSION           server.crt
    gswlm_userinfo.cfg  pg_hba.conf.bak   pg_replslot   pg_xlog              server.key
    mot.conf            pg_hba.conf.lock  pg_serial     postgresql.conf      server.key.cipher
    pg_clog             pg_ident.conf     pg_snapshots  postgresql.conf.bak  server.key.rand
    [omm@wzsy01 d1]$ rm -rf server.*
    [omm@wzsy01 d1]$ rm -rf pg_hba.conf*
    [omm@wzsy01 d1]$ ls
    base                pg_clog        pg_location   pg_stat_tmp      postgresql.conf.bak
    cacert.pem          pg_csnlog      pg_multixact  pg_tblspc        postgresql.conf.lock
    gaussdb.state       pg_ctl.lock    pg_notify     pg_twophase      postmaster.opts
    global              pg_errorinfo   pg_replslot   PG_VERSION       postmaster.pid
    gswlm_userinfo.cfg  pg_ident.conf  pg_serial     pg_xlog
    mot.conf            pg_llog        pg_snapshots  postgresql.conf
    [omm@wzsy01 d1]$ gs_om -t status --detail
    [   Cluster State   ]
    
    cluster_state   : Normal
    redistributing  : No
    current_az      : AZ_ALL
    
    [  Datanode State   ]
    
    node      node_ip         instance                            state            | node      node_ip         instance                            state
    --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    1  wzsy01 9.1.14.39       6001 opt/huawei/install/data/d1 P Primary Normal | 2  wzsy02 9.1.14.40       6002 opt/huawei/install/data/d2 S Standby Normal
    ```

-   重启群集

    ```
    [omm@wzsy01 d1]$ gs_om -t stop
    Stopping cluster.
    =========================================
    Successfully stopped cluster.
    =========================================
    End stop cluster.
    [omm@wzsy01 d1]$ gs_om -t start
    Starting cluster.
    =========================================
    [SUCCESS] wzsy02
    2021-07-26 11:25:03.656 60fe2b0f.1 [unknown] 139725014521600 [unknown] 0 dn_6001_6002 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (4250 Mbytes) is larger.
    =========================================
    [GAUSS-53600]: Can not start the database, the cmd is source home/omm/.bashrc; python3 '/opt/huawei/install/om/script/local/StartInstance.py' -U omm -R opt/huawei/install/app -t 300 --security-mode=off,  Error:
    [FAILURE] wzsy01:
    [GAUSS-51607] : Failed to start instance. Error: Please check the gs_ctl log for failure details.
    [2021-07-26 11:24:59.261][90121][][gs_ctl]: gs_ctl started,datadir is opt/huawei/install/data/d1 
    [2021-07-26 11:24:59.434][90121][][gs_ctl]: waiting for server to start...
    .0 LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.
    
    0 LOG:  [Alarm Module]Host Name: wzsy01 
    
    0 LOG:  [Alarm Module]Host IP: 9.1.14.39 
    
    0 LOG:  [Alarm Module]Cluster Name: Cluster_template 
    
    0 LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 52
    
    0 WARNING:  failed to open feature control file, please check whether it exists: FileName=gaussdb.version, Errno=2, Errmessage=No such file or directory.
    0 WARNING:  failed to parse feature control file: gaussdb.version.
    0 WARNING:  Failed to load the product control file, so gaussdb cannot distinguish product version.
    0 LOG:  Failed to initialze environment for codegen.
    The core dump path is an invalid directory
    2021-07-26 11:24:59.789 60fe2b0b.1 [unknown] 140465425811200 [unknown] 0 dn_6001_6002 DB010  0 [REDO] LOG:  Recovery parallelism, cpu count = 4, max = 4, actual = 4
    2021-07-26 11:24:59.789 60fe2b0b.1 [unknown] 140465425811200 [unknown] 0 dn_6001_6002 DB010  0 [REDO] LOG:  ConfigRecoveryParallelism, true_max_recovery_parallelism:4, max_recovery_parallelism:4
    2021-07-26 11:24:59.789 60fe2b0b.1 [unknown] 140465425811200 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.
    
    2021-07-26 11:24:59.789 60fe2b0b.1 [unknown] 140465425811200 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Host Name: wzsy01 
    
    2021-07-26 11:24:59.790 60fe2b0b.1 [unknown] 140465425811200 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Host IP: 9.1.14.39 
    
    2021-07-26 11:24:59.790 60fe2b0b.1 [unknown] 140465425811200 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Cluster Name: Cluster_template 
    
    2021-07-26 11:24:59.790 60fe2b0b.1 [unknown] 140465425811200 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 52
    
    2021-07-26 11:24:59.790 60fe2b0b.1 [unknown] 140465425811200 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  Transparent encryption disabled.
    
    2021-07-26 11:24:59.797 60fe2b0b.1 [unknown] 140465425811200 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  loaded library "security_plugin"
    2021-07-26 11:24:59.799 60fe2b0b.1 [unknown] 140465425811200 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  InitNuma numaNodeNum: 1 numa_distribute_mode: none inheritThreadPool: 0.
    2021-07-26 11:24:59.799 60fe2b0b.1 [unknown] 140465425811200 [unknown] 0 dn_6001_6002 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (4250 Mbytes) is larger.
    2021-07-26 11:24:59.907 60fe2b0b.1 [unknown] 140465425811200 [unknown] 0 dn_6001_6002 00000  0 [CACHE] LOG:  set data cache  size(805306368)
    2021-07-26 11:24:59.960 60fe2b0b.1 [unknown] 140465425811200 [unknown] 0 dn_6001_6002 00000  0 [CACHE] LOG:  set metadata cache  size(268435456)
    2021-07-26 11:25:00.451 60fe2b0b.1 [unknown] 140465425811200 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  gaussdb: fsync file "/opt/huawei/install/data/d1/gaussdb.state.temp" success
    2021-07-26 11:25:00.452 60fe2b0b.1 [unknown] 140465425811200 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  create gaussdb state file success: db state(STARTING_STATE), server mode(Standby)
    2021-07-26 11:25:00.478 60fe2b0b.1 [unknown] 140465425811200 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  max_safe_fds = 979, usable_fds = 1000, already_open = 11
    The core dump path is an invalid directory
    2021-07-26 11:25:00.482 60fe2b0b.1 [unknown] 140465425811200 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  the configure file /opt/huawei/install/app/etc/gscgroup_omm.cfg doesn't exist or the size of configure file has changed. Please create it by root user!
    2021-07-26 11:25:00.482 60fe2b0b.1 [unknown] 140465425811200 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  Failed to parse cgroup config file.
    .[2021-07-26 11:25:02.249][90121][][gs_ctl]:  waitpid 90124 failed, exitstatus is 256, ret is 2
    
    
    [2021-07-26 11:25:02.250][90121][][gs_ctl]: stopped waiting
    [2021-07-26 11:25:02.250][90121][][gs_ctl]:  could not start server
    Examine the log output..
    ```

-   群集启动过程中主节点报错，备节点启动，但备节点状态需要修复：

    ```
    [omm@wzsy01 d1]$ gs_om -t status --detail
    [   Cluster State   ]
    
    
    cluster_state   : Unavailable
    redistributing  : No
    current_az      : AZ_ALL
    
    
    [  Datanode State   ]
    
    
    node      node_ip         instance                            state            | node      node_ip         instance                            state
    --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    1  wzsy01 9.1.14.39       6001 /opt/huawei/install/data/d1 P Down    Manually stopped | 2  wzsy02 9.1.14.40       6002 /opt/huawei/install/data/d2 S Standby Need repair(Disconnected)
    ```

-   恢复删除文件，手动启动原主节点

    ```
    [omm@wzsy01 d1]$ cp /home/omm/backup/server.* /opt/huawei/install/data/d1/
    [omm@wzsy01 d1]$ cp /home/omm/backup/pg_hba.conf* /opt/huawei/install/data/d1/
    [omm@wzsy01 d1]$ gs_ctl start -D /opt/huawei/install/data/d1/ -M primary
    [2021-07-26 14:51:40.756][7855][][gs_ctl]: gs_ctl started,datadir is /opt/huawei/install/data/d1 
    [2021-07-26 14:51:40.933][7855][][gs_ctl]: waiting for server to start...
    .0 LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.
    
    0 LOG:  [Alarm Module]Host Name: wzsy01 
    
    0 LOG:  [Alarm Module]Host IP: 9.1.14.39 
    
    0 LOG:  [Alarm Module]Cluster Name: Cluster_template 
    
    0 LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 52
    
    0 WARNING:  failed to open feature control file, please check whether it exists: FileName=gaussdb.version, Errno=2, Errmessage=No such file or directory.
    0 WARNING:  failed to parse feature control file: gaussdb.version.
    0 WARNING:  Failed to load the product control file, so gaussdb cannot distinguish product version.
    0 LOG:  Failed to initialze environment for codegen.
    The core dump path is an invalid directory
    2021-07-26 14:51:41.300 60fe5b7d.1 [unknown] 139948390721280 [unknown] 0 dn_6001_6002 DB010  0 [REDO] LOG:  Recovery parallelism, cpu count = 4, max = 4, actual = 4
    2021-07-26 14:51:41.300 60fe5b7d.1 [unknown] 139948390721280 [unknown] 0 dn_6001_6002 DB010  0 [REDO] LOG:  ConfigRecoveryParallelism, true_max_recovery_parallelism:4, max_recovery_parallelism:4
    2021-07-26 14:51:41.300 60fe5b7d.1 [unknown] 139948390721280 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.
    
    2021-07-26 14:51:41.301 60fe5b7d.1 [unknown] 139948390721280 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Host Name: wzsy01 
    
    2021-07-26 14:51:41.301 60fe5b7d.1 [unknown] 139948390721280 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Host IP: 9.1.14.39 
    
    2021-07-26 14:51:41.301 60fe5b7d.1 [unknown] 139948390721280 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Cluster Name: Cluster_template 
    
    2021-07-26 14:51:41.301 60fe5b7d.1 [unknown] 139948390721280 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 52
    
    2021-07-26 14:51:41.301 60fe5b7d.1 [unknown] 139948390721280 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  Transparent encryption disabled.
    
    2021-07-26 14:51:41.305 60fe5b7d.1 [unknown] 139948390721280 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  loaded library "security_plugin"
    2021-07-26 14:51:41.307 60fe5b7d.1 [unknown] 139948390721280 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  InitNuma numaNodeNum: 1 numa_distribute_mode: none inheritThreadPool: 0.
    2021-07-26 14:51:41.307 60fe5b7d.1 [unknown] 139948390721280 [unknown] 0 dn_6001_6002 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (4250 Mbytes) is larger.
    2021-07-26 14:51:41.412 60fe5b7d.1 [unknown] 139948390721280 [unknown] 0 dn_6001_6002 00000  0 [CACHE] LOG:  set data cache  size(805306368)
    2021-07-26 14:51:41.464 60fe5b7d.1 [unknown] 139948390721280 [unknown] 0 dn_6001_6002 00000  0 [CACHE] LOG:  set metadata cache  size(268435456)
    2021-07-26 14:51:41.944 60fe5b7d.1 [unknown] 139948390721280 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  gaussdb: fsync file "/opt/huawei/install/data/d1/gaussdb.state.temp" success
    2021-07-26 14:51:41.944 60fe5b7d.1 [unknown] 139948390721280 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  create gaussdb state file success: db state(STARTING_STATE), server mode(Primary)
    2021-07-26 14:51:41.971 60fe5b7d.1 [unknown] 139948390721280 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  max_safe_fds = 978, usable_fds = 1000, already_open = 12
    The core dump path is an invalid directory
    2021-07-26 14:51:41.975 60fe5b7d.1 [unknown] 139948390721280 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  the configure file /opt/huawei/install/app/etc/gscgroup_omm.cfg doesn't exist or the size of configure file has changed. Please create it by root user!
    2021-07-26 14:51:41.975 60fe5b7d.1 [unknown] 139948390721280 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  Failed to parse cgroup config file.
    [2021-07-26 14:51:43.017][7855][][gs_ctl]:  done
    [2021-07-26 14:51:43.017][7855][][gs_ctl]: server started (/opt/huawei/install/data/d1)
    ```

-   群集状态恢复正常

    ```
    [omm@wzsy01 d1]$ gs_om -t status --detail
    [   Cluster State   ]
    
    
    cluster_state   : Normal
    redistributing  : No
    current_az      : AZ_ALL
    
    
    [  Datanode State   ]
    
    
    node      node_ip         instance                            state            | node      node_ip         instance                            state
    --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    1  wzsy01 9.1.14.39       6001 /opt/huawei/install/data/d1 P Primary Normal | 2  wzsy02 9.1.14.40       6002 /opt/huawei/install/data/d2 S Standby Normal
    ```


