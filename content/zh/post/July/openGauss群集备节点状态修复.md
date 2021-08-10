+++

title =  "openGauss群集备节点Standby Need repair\(Disconnected\)状态修复" 

date = "2021-08-08" 

tags = [ "openGauss群集备节点Standby Need repair\(Disconnected\)状态修复"] 

archives = "2021-08" 

author = "Walrus" 

summary = "openGauss群集备节点Standby Need repair\(Disconnected\)状态修复"

img = "/zh/post/July/title/img7.png" 

times = "12:30"

+++

# openGauss群集备节点Standby Need repair\(Disconnected\)状态修复<a name="ZH-CN_TOPIC_0000001127317628"></a>

## 模拟openGauss群集备节点出现Standby Need repair\(Disconnected\)状态<a name="section757813258541"></a>

1.  破坏群集文件

    首先备份主节点文件；再删除主节点重要的文件，重启群集后发现，主节点未启动，备节点启动后会出现Standby Need repair状态，如果此时恢复文件，重启后，群集状态会正常。

    ```
    [omm@wzsy01 d1]$ gs_om -t status --detail
    [   Cluster State   ]
    
    cluster_state   : Normal
    redistributing  : No
    current_az      : AZ_ALL
    
    
    [  Datanode State   ]
    
    
    node      node_ip         instance                            state            | node      node_ip         instance                            state
    --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    1  wzsy01 9.1.14.39       6001 opt/huawei/install/data/d1 P Primary Normal | 2  wzsy02 9.1.14.40       6002 opt/huawei/install/data/d2 S Standby Normal
    [omm@wzsy01 backup]$ gs_basebackup -D home/omm/backup/ -h wzsy01 -p 15400
    INFO:  The starting position of the xlog copy of the full build is: 0/4F000028. The slot minimum LSN is: 0/4F000140.
    [2021-07-26 15:14:04]:begin build tablespace list
    [2021-07-26 15:14:04]:finish build tablespace list
    [2021-07-26 15:14:04]:begin get xlog by xlogstream
    [2021-07-26 15:14:04]: check identify system success                                                
    [2021-07-26 15:14:04]: send START_REPLICATION 0/4F000000 success                                    
    [2021-07-26 15:14:04]: keepalive message is received                                                
    [2021-07-26 15:14:04]: keepalive message is received                                                
    [2021-07-26 15:14:09]:gs_basebackup: base backup successfully
    [omm@wzsy01 backup]$ ls
    backup_label          cacert.pem          mot.conf     pg_errorinfo      pg_ident.conf  pg_replslot   pg_tblspc    postgresql.conf       server.crt         term_file
    backup_label.old      full_backup_label   pg_clog      pg_hba.conf       pg_llog        pg_serial     pg_twophase  postgresql.conf.bak   server.key
    base                  global              pg_csnlog    pg_hba.conf.bak   pg_multixact   pg_snapshots  PG_VERSION   postgresql.conf.lock  server.key.cipher
    build_completed.done  gswlm_userinfo.cfg  pg_ctl.lock  pg_hba.conf.lock  pg_notify      pg_stat_tmp   pg_xlog      rewind_lable          server.key.rand
    [omm@wzsy01 backup]$ cd -
    /opt/huawei/install/data/d1
    [omm@wzsy01 d1]$ ls
    backup_label.old      gaussdb.state       pg_clog       pg_hba.conf.bak   pg_multixact       pg_snapshots  pg_xlog               postmaster.pid     server.key.rand
    base                  global              pg_csnlog     pg_hba.conf.lock  pg_notify          pg_stat_tmp   postgresql.conf       rewind_lable       term_file
    build_completed.done  gs_build.pid        pg_ctl.lock   pg_ident.conf     pg_replslot        pg_tblspc     postgresql.conf.bak   server.crt
    cacert.pem            gswlm_userinfo.cfg  pg_errorinfo  pg_llog           pg_rewind_filemap  pg_twophase   postgresql.conf.lock  server.key
    full_backup_label     mot.conf            pg_hba.conf   pg_location       pg_serial          PG_VERSION    postmaster.opts       server.key.cipher
    [omm@wzsy01 d1]$ rm -rf pg_hba.conf*
    [omm@wzsy01 d1]$ gs_om -t stop
    Stopping cluster.
    =========================================
    Successfully stopped cluster.
    =========================================
    End stop cluster.
    [omm@wzsy01 d1]$ gs_om -t status --detail
    [   Cluster State   ]
    
    
    cluster_state   : Unavailable
    redistributing  : No
    current_az      : AZ_ALL
    
    
    [  Datanode State   ]
    
    
    node      node_ip         instance                            state            | node      node_ip         instance                            state
    --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    1  wzsy01 9.1.14.39       6001 opt/huawei/install/data/d1 P Down    Manually stopped | 2  wzsy02 9.1.14.40       6002 opt/huawei/install/data/d2 S Down    Manually stopped
    [omm@wzsy01 d1]$ gs_om -t start
    Starting cluster.
    =========================================
    [SUCCESS] wzsy02
    2021-07-26 15:15:58.513 60fe612e.1 [unknown] 139773867022080 [unknown] 0 dn_6001_6002 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (4250 Mbytes) is larger.
    =========================================
    [GAUSS-53600]: Can not start the database, the cmd is source home/omm/.bashrc; python3 '/opt/huawei/install/om/script/local/StartInstance.py' -U omm -R opt/huawei/install/app -t 300 --security-mode=off,  Error:
    [FAILURE] wzsy01:
    [GAUSS-51607] : Failed to start instance. Error: Please check the gs_ctl log for failure details.
    [2021-07-26 15:15:54.178][15696][][gs_ctl]: gs_ctl started,datadir is opt/huawei/install/data/d1 
    [2021-07-26 15:15:54.362][15696][][gs_ctl]: waiting for server to start...
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
    2021-07-26 15:15:54.716 60fe612a.1 [unknown] 140709682288384 [unknown] 0 dn_6001_6002 DB010  0 [REDO] LOG:  Recovery parallelism, cpu count = 4, max = 4, actual = 4
    2021-07-26 15:15:54.716 60fe612a.1 [unknown] 140709682288384 [unknown] 0 dn_6001_6002 DB010  0 [REDO] LOG:  ConfigRecoveryParallelism, true_max_recovery_parallelism:4, max_recovery_parallelism:4
    2021-07-26 15:15:54.716 60fe612a.1 [unknown] 140709682288384 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.
    2021-07-26 15:15:54.716 60fe612a.1 [unknown] 140709682288384 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Host Name: wzsy01 
    2021-07-26 15:15:54.716 60fe612a.1 [unknown] 140709682288384 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Host IP: 9.1.14.39 
    2021-07-26 15:15:54.716 60fe612a.1 [unknown] 140709682288384 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Cluster Name: Cluster_template 
    2021-07-26 15:15:54.716 60fe612a.1 [unknown] 140709682288384 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 52
    2021-07-26 15:15:54.716 60fe612a.1 [unknown] 140709682288384 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  Transparent encryption disabled.
    2021-07-26 15:15:54.720 60fe612a.1 [unknown] 140709682288384 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  loaded library "security_plugin"
    2021-07-26 15:15:54.722 60fe612a.1 [unknown] 140709682288384 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  InitNuma numaNodeNum: 1 numa_distribute_mode: none inheritThreadPool: 0.
    2021-07-26 15:15:54.722 60fe612a.1 [unknown] 140709682288384 [unknown] 0 dn_6001_6002 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (4250 Mbytes) is larger.
    2021-07-26 15:15:54.843 60fe612a.1 [unknown] 140709682288384 [unknown] 0 dn_6001_6002 00000  0 [CACHE] LOG:  set data cache  size(805306368)
    2021-07-26 15:15:54.896 60fe612a.1 [unknown] 140709682288384 [unknown] 0 dn_6001_6002 00000  0 [CACHE] LOG:  set metadata cache  size(268435456)
    2021-07-26 15:15:55.365 60fe612a.1 [unknown] 140709682288384 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  gaussdb: fsync file "/opt/huawei/install/data/d1/gaussdb.state.temp" success
    2021-07-26 15:15:55.365 60fe612a.1 [unknown] 140709682288384 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  create gaussdb state file success: db state(STARTING_STATE), server mode(Primary)
    2021-07-26 15:15:55.389 60fe612a.1 [unknown] 140709682288384 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  max_safe_fds = 979, usable_fds = 1000, already_open = 11
    The core dump path is an invalid directory
    2021-07-26 15:15:55.394 60fe612a.1 [unknown] 140709682288384 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  the configure file opt/huawei/install/app/etc/gscgroup_omm.cfg doesn't exist or the size of configure file has changed. Please create it by root user!
    2021-07-26 15:15:55.394 60fe612a.1 [unknown] 140709682288384 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  Failed to parse cgroup config file.
    .[2021-07-26 15:15:57.160][15696][][gs_ctl]:  waitpid 15700 failed, exitstatus is 256, ret is 2
    
    
    [2021-07-26 15:15:57.160][15696][][gs_ctl]: stopped waiting
    [2021-07-26 15:15:57.160][15696][][gs_ctl]:  could not start server
    Examine the log output..
    [omm@wzsy01 d1]$ gs_om -t status --detail
    [   Cluster State   ]
    
    
    cluster_state   : Unavailable
    redistributing  : No
    current_az      : AZ_ALL
    
    
    [  Datanode State   ]
    
    
    node      node_ip         instance                            state            | node      node_ip         instance                            state
    --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    1  wzsy01 9.1.14.39       6001 opt/huawei/install/data/d1 P Down    Manually stopped | 2  wzsy02 9.1.14.40       6002 opt/huawei/install/data/d2 S Standby Need repair(Disconnected)
    ```

2.  切换备节点为主节点

    ```
    [omm@wzsy02 d2]$ gs_om -t stop
    Stopping cluster.
    =========================================
    Successfully stopped cluster.
    =========================================
    End stop cluster.
    [omm@wzsy02 d2]$ gs_ctl start -D opt/huawei/install/data/d2/ -M primary
    [2021-07-26 15:45:05.449][129349][][gs_ctl]: gs_ctl started,datadir is opt/huawei/install/data/d2 
    [2021-07-26 15:45:05.617][129349][][gs_ctl]: waiting for server to start...
    .0 LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.
    
    0 LOG:  [Alarm Module]Host Name: wzsy02 
    
    0 LOG:  [Alarm Module]Host IP: 9.1.14.40 
    
    0 LOG:  [Alarm Module]Cluster Name: Cluster_template 
    
    0 LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 52
    
    0 WARNING:  failed to open feature control file, please check whether it exists: FileName=gaussdb.version, Errno=2, Errmessage=No such file or directory.
    0 WARNING:  failed to parse feature control file: gaussdb.version.
    0 WARNING:  Failed to load the product control file, so gaussdb cannot distinguish product version.
    0 LOG:  Failed to initialze environment for codegen.
    The core dump path is an invalid directory
    2021-07-26 15:45:05.976 60fe6801.1 [unknown] 140434066839296 [unknown] 0 dn_6001_6002 DB010  0 [REDO] LOG:  Recovery parallelism, cpu count = 4, max = 4, actual = 4
    2021-07-26 15:45:05.976 60fe6801.1 [unknown] 140434066839296 [unknown] 0 dn_6001_6002 DB010  0 [REDO] LOG:  ConfigRecoveryParallelism, true_max_recovery_parallelism:4, max_recovery_parallelism:4
    2021-07-26 15:45:05.976 60fe6801.1 [unknown] 140434066839296 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.
    
    2021-07-26 15:45:05.976 60fe6801.1 [unknown] 140434066839296 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Host Name: wzsy02 
    
    2021-07-26 15:45:05.976 60fe6801.1 [unknown] 140434066839296 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Host IP: 9.1.14.40 
    
    2021-07-26 15:45:05.976 60fe6801.1 [unknown] 140434066839296 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Cluster Name: Cluster_template 
    
    2021-07-26 15:45:05.977 60fe6801.1 [unknown] 140434066839296 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 52
    
    2021-07-26 15:45:05.977 60fe6801.1 [unknown] 140434066839296 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  Transparent encryption disabled.
    
    2021-07-26 15:45:05.980 60fe6801.1 [unknown] 140434066839296 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  loaded library "security_plugin"
    2021-07-26 15:45:05.981 60fe6801.1 [unknown] 140434066839296 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  InitNuma numaNodeNum: 1 numa_distribute_mode: none inheritThreadPool: 0.
    2021-07-26 15:45:05.981 60fe6801.1 [unknown] 140434066839296 [unknown] 0 dn_6001_6002 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (4250 Mbytes) is larger.
    2021-07-26 15:45:06.088 60fe6801.1 [unknown] 140434066839296 [unknown] 0 dn_6001_6002 00000  0 [CACHE] LOG:  set data cache  size(805306368)
    2021-07-26 15:45:06.138 60fe6801.1 [unknown] 140434066839296 [unknown] 0 dn_6001_6002 00000  0 [CACHE] LOG:  set metadata cache  size(268435456)
    2021-07-26 15:45:06.581 60fe6801.1 [unknown] 140434066839296 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  gaussdb: fsync file "/opt/huawei/install/data/d2/gaussdb.state.temp" success
    2021-07-26 15:45:06.581 60fe6801.1 [unknown] 140434066839296 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  create gaussdb state file success: db state(STARTING_STATE), server mode(Primary)
    2021-07-26 15:45:06.607 60fe6801.1 [unknown] 140434066839296 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  max_safe_fds = 978, usable_fds = 1000, already_open = 12
    The core dump path is an invalid directory
    2021-07-26 15:45:06.610 60fe6801.1 [unknown] 140434066839296 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  the configure file opt/huawei/install/app/etc/gscgroup_omm.cfg doesn't exist or the size of configure file has changed. Please create it by root user!
    2021-07-26 15:45:06.610 60fe6801.1 [unknown] 140434066839296 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  Failed to parse cgroup config file.
    .
    [2021-07-26 15:45:07.645][129349][][gs_ctl]:  done
    [2021-07-26 15:45:07.645][129349][][gs_ctl]: server started (/opt/huawei/install/data/d2)
    [omm@wzsy02 d2]$ gs_om -t status --detail
    [   Cluster State   ]
    
    
    cluster_state   : Degraded
    redistributing  : No
    current_az      : AZ_ALL
    
    
    [  Datanode State   ]
    
    
    node      node_ip         instance                            state            | node      node_ip         instance                            state
    --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    1  wzsy01 9.1.14.39       6001 opt/huawei/install/data/d1 P Down    Manually stopped | 2  wzsy02 9.1.14.40       6002 opt/huawei/install/data/d2 S Primary Normal
    ```

3.  恢复主节点丢失文件，并手动启动原主节点为备节点

    ```
    [omm@wzsy01 d1]$ cp home/omm/backup/pg_hba.conf* opt/huawei/install/data/d1/
    [omm@wzsy01 d1]$ gs_ctl start -D opt/huawei/install/data/d1/ -M standby
    [2021-07-26 15:46:01.894][40444][][gs_ctl]: gs_ctl started,datadir is opt/huawei/install/data/d1 
    [2021-07-26 15:46:02.090][40444][][gs_ctl]: waiting for server to start...
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
    2021-07-26 15:46:02.433 60fe683a.1 [unknown] 139749337880320 [unknown] 0 dn_6001_6002 DB010  0 [REDO] LOG:  Recovery parallelism, cpu count = 4, max = 4, actual = 4
    2021-07-26 15:46:02.433 60fe683a.1 [unknown] 139749337880320 [unknown] 0 dn_6001_6002 DB010  0 [REDO] LOG:  ConfigRecoveryParallelism, true_max_recovery_parallelism:4, max_recovery_parallelism:4
    2021-07-26 15:46:02.433 60fe683a.1 [unknown] 139749337880320 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.
    
    2021-07-26 15:46:02.433 60fe683a.1 [unknown] 139749337880320 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Host Name: wzsy01 
    
    2021-07-26 15:46:02.434 60fe683a.1 [unknown] 139749337880320 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Host IP: 9.1.14.39 
    
    2021-07-26 15:46:02.434 60fe683a.1 [unknown] 139749337880320 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Cluster Name: Cluster_template 
    
    2021-07-26 15:46:02.434 60fe683a.1 [unknown] 139749337880320 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 52
    
    2021-07-26 15:46:02.434 60fe683a.1 [unknown] 139749337880320 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  Transparent encryption disabled.
    
    2021-07-26 15:46:02.437 60fe683a.1 [unknown] 139749337880320 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  loaded library "security_plugin"
    2021-07-26 15:46:02.438 60fe683a.1 [unknown] 139749337880320 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  InitNuma numaNodeNum: 1 numa_distribute_mode: none inheritThreadPool: 0.
    2021-07-26 15:46:02.439 60fe683a.1 [unknown] 139749337880320 [unknown] 0 dn_6001_6002 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (4250 Mbytes) is larger.
    2021-07-26 15:46:02.543 60fe683a.1 [unknown] 139749337880320 [unknown] 0 dn_6001_6002 00000  0 [CACHE] LOG:  set data cache  size(805306368)
    2021-07-26 15:46:02.592 60fe683a.1 [unknown] 139749337880320 [unknown] 0 dn_6001_6002 00000  0 [CACHE] LOG:  set metadata cache  size(268435456)
    2021-07-26 15:46:03.055 60fe683a.1 [unknown] 139749337880320 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  gaussdb: fsync file "/opt/huawei/install/data/d1/gaussdb.state.temp" success
    2021-07-26 15:46:03.055 60fe683a.1 [unknown] 139749337880320 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  create gaussdb state file success: db state(STARTING_STATE), server mode(Standby)
    2021-07-26 15:46:03.081 60fe683a.1 [unknown] 139749337880320 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  max_safe_fds = 978, usable_fds = 1000, already_open = 12
    The core dump path is an invalid directory
    2021-07-26 15:46:03.085 60fe683a.1 [unknown] 139749337880320 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  the configure file opt/huawei/install/app/etc/gscgroup_omm.cfg doesn't exist or the size of configure file has changed. Please create it by root user!
    2021-07-26 15:46:03.085 60fe683a.1 [unknown] 139749337880320 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  Failed to parse cgroup config file.
    .
    [2021-07-26 15:46:04.140][40444][][gs_ctl]:  done
    [2021-07-26 15:46:04.140][40444][][gs_ctl]: server started (/opt/huawei/install/data/d1)
    [omm@wzsy01 d1]$ gs_om -t status --detail
    [   Cluster State   ]
    
    
    cluster_state   : Degraded
    redistributing  : No
    current_az      : AZ_ALL
    
    
    [  Datanode State   ]
    
    
    node      node_ip         instance                            state            | node      node_ip         instance                            state
    --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    1  wzsy01 9.1.14.39       6001 /opt/huawei/install/data/d1 P Standby Need repair(WAL) | 2  wzsy02 9.1.14.40       6002 /opt/huawei/install/data/d2 S Primary Normal
    ```


## 此时备节点为Standby Need repair\(WAL\)状态，此状态不支持主备切换<a name="section72414338574"></a>

1.  主备切换状态报错

    ```
    [omm@wzsy01 d1]$ gs_ctl switchover -D /opt/huawei/install/data/d1/
    [2021-07-26 15:46:47.883][41371][][gs_ctl]: gs_ctl switchover ,datadir is /opt/huawei/install/data/d1 
    [2021-07-26 15:46:47.883][41371][][gs_ctl]: switchover term (1)
    [2021-07-26 15:46:47.891][41371][][gs_ctl]: waiting for server to switchover...............................................................
    [2021-07-26 15:47:48.376][41371][][gs_ctl]: 
     switchover timeout after 60 seconds. please manually check the cluster status.
    [omm@wzsy01 d1]$ gs_om -t status --detail
    [   Cluster State   ]
    
    
    cluster_state   : Degraded
    redistributing  : No
    current_az      : AZ_ALL
    
    
    [  Datanode State   ]
    
    
    node      node_ip         instance                            state            | node      node_ip         instance                            state
    --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    1  wzsy01 9.1.14.39       6001 /opt/huawei/install/data/d1 P Standby Need repair(WAL) | 2  wzsy02 9.1.14.40       6002 /opt/huawei/install/data/d2 S Primary Normal
    ```

2.  重建备节点

    ```
    [omm@wzsy01 d1]$ gs_ctl build -D /opt/huawei/install/data/d1/
    [2021-07-26 15:48:44.087][43045][][gs_ctl]: gs_ctl incremental build ,datadir is /opt/huawei/install/data/d1
    waiting for server to shut down............. done
    server stopped
    [2021-07-26 15:48:54.113][43045][][gs_ctl]:  fopen build pid file "/opt/huawei/install/data/d1/gs_build.pid" success
    [2021-07-26 15:48:54.113][43045][][gs_ctl]:  fprintf build pid file "/opt/huawei/install/data/d1/gs_build.pid" success
    [2021-07-26 15:48:54.113][43045][][gs_ctl]:  fsync build pid file "/opt/huawei/install/data/d1/gs_build.pid" success
    [2021-07-26 15:48:54.120][43045][dn_6001_6002][gs_rewind]: set gaussdb state file when rewind:db state(BUILDING_STATE), server mode(STANDBY_MODE), build mode(INC_BUILD).
    [2021-07-26 15:48:54.201][43045][dn_6001_6002][gs_rewind]: connected to server: host=9.1.14.40 port=15401 dbname=postgres application_name=gs_rewind connect_timeout=5
    [2021-07-26 15:48:54.204][43045][dn_6001_6002][gs_rewind]: connect to primary success
    [2021-07-26 15:48:54.205][43045][dn_6001_6002][gs_rewind]: get pg_control success
    [2021-07-26 15:48:54.205][43045][dn_6001_6002][gs_rewind]: target server was interrupted in mode 2.
    [2021-07-26 15:48:54.205][43045][dn_6001_6002][gs_rewind]: sanityChecks success
    [2021-07-26 15:48:54.205][43045][dn_6001_6002][gs_rewind]: find last checkpoint at 0/500062D0 and checkpoint redo at 0/50006250 from source control file
    [2021-07-26 15:48:54.205][43045][dn_6001_6002][gs_rewind]: find last checkpoint at 0/500060A0 and checkpoint redo at 0/50006020 from target control file
    [2021-07-26 15:48:54.207][43045][dn_6001_6002][gs_rewind]: find max lsn success, find max lsn rec (0/500060A0) success.
    
    
    [2021-07-26 15:48:54.213][43045][dn_6001_6002][gs_rewind]: request lsn is 0/500060A0 and its crc(source, target):[1826941517, 2969834311]
    [2021-07-26 15:48:54.219][43045][dn_6001_6002][gs_rewind]: request lsn is 0/50005F70 and its crc(source, target):[1279685734, 2286271583]
    [2021-07-26 15:48:54.225][43045][dn_6001_6002][gs_rewind]: request lsn is 0/50005E58 and its crc(source, target):[3699854113, 3699854113]
    [2021-07-26 15:48:54.225][43045][dn_6001_6002][gs_rewind]: find common checkpoint 0/50005E58
    [2021-07-26 15:48:54.225][43045][dn_6001_6002][gs_rewind]: find diverge point success
    [2021-07-26 15:48:54.225][43045][dn_6001_6002][gs_rewind]: read checkpoint redo (0/50005DD8) success before rewinding.
    [2021-07-26 15:48:54.225][43045][dn_6001_6002][gs_rewind]: rewinding from checkpoint redo point at 0/50005DD8 on timeline 1
    [2021-07-26 15:48:54.225][43045][dn_6001_6002][gs_rewind]: diverge xlogfile is 000000010000000000000050, older ones will not be copied or removed.
    [2021-07-26 15:48:54.226][43045][dn_6001_6002][gs_rewind]: targetFileStatThread success pid 140525638383360.
    [2021-07-26 15:48:54.227][43045][dn_6001_6002][gs_rewind]: traverse_datadir start.
    [2021-07-26 15:48:54.227][43045][dn_6001_6002][gs_rewind]: reading source file list
    [2021-07-26 15:48:54.234][43045][dn_6001_6002][gs_rewind]: filemap_list_to_array start.
    [2021-07-26 15:48:54.234][43045][dn_6001_6002][gs_rewind]: filemap_list_to_array end sort start. length is 2586 
    [2021-07-26 15:48:54.235][43045][dn_6001_6002][gs_rewind]: sort end.
    [2021-07-26 15:48:54.243][43045][dn_6001_6002][gs_rewind]: targetFileStatThread return success.
    [2021-07-26 15:48:54.263][43045][dn_6001_6002][gs_rewind]: reading target file list
    [2021-07-26 15:48:54.268][43045][dn_6001_6002][gs_rewind]: traverse target datadir success
    [2021-07-26 15:48:54.268][43045][dn_6001_6002][gs_rewind]: reading WAL in target
    [2021-07-26 15:48:54.268][43045][dn_6001_6002][gs_rewind]: could not read WAL record at 0/50006138: invalid record length at 0/50006138: wanted 32, got 0
    [2021-07-26 15:48:54.270][43045][dn_6001_6002][gs_rewind]: calculate totals rewind success
    [2021-07-26 15:48:54.270][43045][dn_6001_6002][gs_rewind]: need to copy 16MB (total source directory size is 657MB)
    [2021-07-26 15:48:54.270][43045][dn_6001_6002][gs_rewind]: starting background WAL receiver
    [2021-07-26 15:48:54.270][43045][dn_6001_6002][gs_rewind]: Starting copy xlog, start point: 0/50005DD8
    [2021-07-26 15:48:54.271][43045][dn_6001_6002][gs_rewind]: in gs_rewind proecess,so no need remove.
    [2021-07-26 15:48:54.277][43045][dn_6001_6002][gs_rewind]:  check identify system success
    [2021-07-26 15:48:54.277][43045][dn_6001_6002][gs_rewind]:  send START_REPLICATION 0/50000000 success
    [2021-07-26 15:48:54.309][43045][dn_6001_6002][gs_rewind]: receiving and unpacking files...
    [2021-07-26 15:48:54.413][43045][dn_6001_6002][gs_rewind]: execute file map success
    [2021-07-26 15:48:54.414][43045][dn_6001_6002][gs_rewind]: find minRecoveryPoint success from xlog insert location 0/5000A858
    [2021-07-26 15:48:54.414][43045][dn_6001_6002][gs_rewind]: update pg_control file success, minRecoveryPoint: 0/5000A858, ckpLoc:0/500062D0, ckpRedo:0/50006250, preCkp:0/500061B8
    [2021-07-26 15:48:54.416][43045][dn_6001_6002][gs_rewind]: update pg_dw file success
    [2021-07-26 15:48:54.416][43045][dn_6001_6002][gs_rewind]: xlog end point: 0/5000A858
    [2021-07-26 15:48:54.416][43045][dn_6001_6002][gs_rewind]: waiting for background process to finish streaming...
    [2021-07-26 15:48:59.281][43045][dn_6001_6002][gs_rewind]: creating backup label and updating control file
    [2021-07-26 15:48:59.281][43045][dn_6001_6002][gs_rewind]: create backup label success
    [2021-07-26 15:48:59.281][43045][dn_6001_6002][gs_rewind]: read checkpoint redo (0/50005DD8) success.
    [2021-07-26 15:48:59.281][43045][dn_6001_6002][gs_rewind]: read checkpoint rec (0/50005E58) success.
    [2021-07-26 15:48:59.281][43045][dn_6001_6002][gs_rewind]: dn incremental build completed.
    [2021-07-26 15:48:59.287][43045][dn_6001_6002][gs_rewind]: fetching MOT checkpoint
    [2021-07-26 15:48:59.462][43045][dn_6001_6002][gs_ctl]: waiting for server to start...
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
    2021-07-26 15:48:59.849 60fe68eb.1 [unknown] 140413211043584 [unknown] 0 dn_6001_6002 DB010  0 [REDO] LOG:  Recovery parallelism, cpu count = 4, max = 4, actual = 4
    2021-07-26 15:48:59.849 60fe68eb.1 [unknown] 140413211043584 [unknown] 0 dn_6001_6002 DB010  0 [REDO] LOG:  ConfigRecoveryParallelism, true_max_recovery_parallelism:4, max_recovery_parallelism:4
    2021-07-26 15:48:59.850 60fe68eb.1 [unknown] 140413211043584 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.
    
    2021-07-26 15:48:59.850 60fe68eb.1 [unknown] 140413211043584 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Host Name: wzsy01 
    
    2021-07-26 15:48:59.850 60fe68eb.1 [unknown] 140413211043584 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Host IP: 9.1.14.39 
    
    2021-07-26 15:48:59.850 60fe68eb.1 [unknown] 140413211043584 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Cluster Name: Cluster_template 
    
    2021-07-26 15:48:59.850 60fe68eb.1 [unknown] 140413211043584 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 52
    
    2021-07-26 15:48:59.850 60fe68eb.1 [unknown] 140413211043584 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  Transparent encryption disabled.
    
    2021-07-26 15:48:59.857 60fe68eb.1 [unknown] 140413211043584 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  loaded library "security_plugin"
    2021-07-26 15:48:59.859 60fe68eb.1 [unknown] 140413211043584 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  InitNuma numaNodeNum: 1 numa_distribute_mode: none inheritThreadPool: 0.
    2021-07-26 15:48:59.859 60fe68eb.1 [unknown] 140413211043584 [unknown] 0 dn_6001_6002 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (4250 Mbytes) is larger.
    2021-07-26 15:48:59.968 60fe68eb.1 [unknown] 140413211043584 [unknown] 0 dn_6001_6002 00000  0 [CACHE] LOG:  set data cache  size(805306368)
    2021-07-26 15:49:00.020 60fe68eb.1 [unknown] 140413211043584 [unknown] 0 dn_6001_6002 00000  0 [CACHE] LOG:  set metadata cache  size(268435456)
    2021-07-26 15:49:00.503 60fe68eb.1 [unknown] 140413211043584 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  gaussdb: fsync file "/opt/huawei/install/data/d1/gaussdb.state.temp" success
    2021-07-26 15:49:00.504 60fe68eb.1 [unknown] 140413211043584 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  create gaussdb state file success: db state(STARTING_STATE), server mode(Standby)
    2021-07-26 15:49:00.526 60fe68eb.1 [unknown] 140413211043584 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  max_safe_fds = 976, usable_fds = 1000, already_open = 14
    The core dump path is an invalid directory
    2021-07-26 15:49:00.531 60fe68eb.1 [unknown] 140413211043584 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  the configure file /opt/huawei/install/app/etc/gscgroup_omm.cfg doesn't exist or the size of configure file has changed. Please create it by root user!
    2021-07-26 15:49:00.531 60fe68eb.1 [unknown] 140413211043584 [unknown] 0 dn_6001_6002 00000  0 [BACKEND] LOG:  Failed to parse cgroup config file.
    .
    [2021-07-26 15:49:01.581][43045][dn_6001_6002][gs_ctl]:  done
    [2021-07-26 15:49:01.581][43045][dn_6001_6002][gs_ctl]: server started (/opt/huawei/install/data/d1)
    [2021-07-26 15:49:01.581][43045][dn_6001_6002][gs_ctl]:  fopen build pid file "/opt/huawei/install/data/d1/gs_build.pid" success
    [2021-07-26 15:49:01.581][43045][dn_6001_6002][gs_ctl]:  fprintf build pid file "/opt/huawei/install/data/d1/gs_build.pid" success
    [2021-07-26 15:49:01.582][43045][dn_6001_6002][gs_ctl]:  fsync build pid file "/opt/huawei/install/data/d1/gs_build.pid" success
    [omm@wzsy01 d1]$ gs_om -t status --detail
    [   Cluster State   ]
    
    
    cluster_state   : Normal
    redistributing  : No
    current_az      : AZ_ALL
    
    
    [  Datanode State   ]
    
    
    node      node_ip         instance                            state            | node      node_ip         instance                            state
    --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    1  wzsy01 9.1.14.39       6001 /opt/huawei/install/data/d1 P Standby Normal | 2  wzsy02 9.1.14.40       6002 /opt/huawei/install/data/d2 S Primary Normal
    ```

3.  再切换主备，使群集恢复原始状态

    ```
    [omm@wzsy01 d1]$ gs_ctl switchover -D /opt/huawei/install/data/d1/
    [2021-07-26 15:49:38.594][43597][][gs_ctl]: gs_ctl switchover ,datadir is /opt/huawei/install/data/d1 
    [2021-07-26 15:49:38.594][43597][][gs_ctl]: switchover term (1)
    [2021-07-26 15:49:38.601][43597][][gs_ctl]: waiting for server to switchover................
    [2021-07-26 15:49:51.713][43597][][gs_ctl]: done
    [2021-07-26 15:49:51.713][43597][][gs_ctl]: switchover completed (/opt/huawei/install/data/d1)
    [omm@wzsy01 d1]$ gs_om -t status --detail
    [   Cluster State   ]
    
    
    cluster_state   : Normal
    redistributing  : No
    current_az      : AZ_ALL
    
    
    [  Datanode State   ]
    
    
    node      node_ip         instance                            state            | node      node_ip         instance                            state
    --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    1  wzsy01 9.1.14.39       6001 /opt/huawei/install/data/d1 P Primary Normal | 2  wzsy02 9.1.14.40       6002 /opt/huawei/install/data/d2 S Standby Normal
    [omm@wzsy01 d1]$ gs_om refreshconf
    [GAUSS-50001] : Incorrect parameter. Parameter '-t' is required.
    [omm@wzsy01 d1]$ gs_om -t refreshconf
    Generating dynamic configuration file for all nodes.
    Successfully generated dynamic configuration file.
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


