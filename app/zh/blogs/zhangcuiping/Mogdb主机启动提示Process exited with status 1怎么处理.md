---
title: 'Mogdb主机启动提示Process exited with status 1怎么处理'

date: '2023-04-30'

tags: ['openGauss安装']

archives: '2023-04'

author: '张翠娉'

summary: 'Mogdb主机启动提示Process exited with status 1怎么处理'

img: '/zh/post/zhangcuiping/title/img.png'

times: '14:20'
---

# Mogdb 主机启动提示 Process exited with status 1 怎么处理？

**背景介绍**：

Mogdb 主备环境，主机启动提示 Process exited with status 1

**报错原因**：

根据提示，显示 FATAL: could not create shared memory segment: Cannot allocate memory，意思是无法分配内存

```
[root@mogdb-kernel-0002 mogdb]# ptk cluster -n mogdb12 start
INFO[2023-05-16T10:59:09.208] operation: start
INFO[2023-05-16T10:59:09.209] ========================================
INFO[2023-05-16T10:59:09.209] start db [172.16.0.245:26007] ...
ERRO[2023-05-16T10:59:10.331] start db [172.16.0.245:26007] failed
ERROR: Process exited with status 1
OUTPUT: [2023-05-16 10:59:09.298][3905515][][gs_ctl]: gs_ctl started,datadir is /home/omm12/mogdb/data
[2023-05-16 10:59:09.329][3905515][][gs_ctl]: waiting for server to start...
.0 LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.

0 LOG:  [Alarm Module]Host Name: mogdb-kernel-0002

0 LOG:  [Alarm Module]Host IP: 172.16.0.245

0 LOG:  [Alarm Module]Cluster Name: mogdb12

0 WARNING:  failed to open feature control file, please check whether it exists: FileName=gaussdb.version, Errno=2, Errmessage=No such file or directory.
0 WARNING:  failed to parse feature control file: gaussdb.version.
0 WARNING:  Failed to load the product control file, so gaussdb cannot distinguish product version.
The core dump path from /proc/sys/kernel/core_pattern is an invalid directory:/opt/mogdb/corefile/
2023-05-16 10:59:09.388 [unknown] [unknown] localhost 70372950802448 0[0:0#0] 0 [BACKEND] LOG:  when starting as multi_standby mode, we couldn't support data replicaton.
gaussdb.state does not exist, and skipt setting since it is optional.2023-05-16 10:59:09.394 [unknown] [unknown] localhost 70372950802448 0[0:0#0] 0 [BACKEND] LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.

2023-05-16 10:59:09.394 [unknown] [unknown] localhost 70372950802448 0[0:0#0] 0 [BACKEND] LOG:  [Alarm Module]Host Name: mogdb-kernel-0002

2023-05-16 10:59:09.394 [unknown] [unknown] localhost 70372950802448 0[0:0#0] 0 [BACKEND] LOG:  [Alarm Module]Host IP: 172.16.0.245

2023-05-16 10:59:09.394 [unknown] [unknown] localhost 70372950802448 0[0:0#0] 0 [BACKEND] LOG:  [Alarm Module]Cluster Name: mogdb12

2023-05-16 10:59:09.399 [unknown] [unknown] localhost 70372950802448 0[0:0#0] 0 [BACKEND] LOG:  loaded library "security_plugin"
2023-05-16 10:59:09.402 [unknown] [unknown] localhost 70372950802448 0[0:0#0] 0 [BACKEND] WARNING:  could not create any HA TCP/IP sockets
2023-05-16 10:59:09.405 [unknown] [unknown] localhost 70372950802448 0[0:0#0] 0 [BACKEND] LOG:  gstrace initializes with failure. errno = 1.
2023-05-16 10:59:09.405 [unknown] [unknown] localhost 70372950802448 0[0:0#0] 0 [BACKEND] LOG:  InitNuma numaNodeNum: 1 numa_distribute_mode: none inheritThreadPool: 0.
2023-05-16 10:59:09.405 [unknown] [unknown] localhost 70372950802448 0[0:0#0] 0 [BACKEND] LOG:  reserved memory for backend threads is: 340 MB
2023-05-16 10:59:09.405 [unknown] [unknown] localhost 70372950802448 0[0:0#0] 0 [BACKEND] LOG:  reserved memory for WAL buffers is: 320 MB
2023-05-16 10:59:09.405 [unknown] [unknown] localhost 70372950802448 0[0:0#0] 0 [BACKEND] LOG:  Set max backend reserve memory is: 660 MB, max dynamic memory is: 27323 MB
2023-05-16 10:59:09.405 [unknown] [unknown] localhost 70372950802448 0[0:0#0] 0 [BACKEND] LOG:  shared memory 16032 Mbytes, memory context 27983 Mbytes, max process memory 44032 Mbytes
2023-05-16 10:59:09.405 [unknown] [unknown] localhost 70372950802448 0[0:0#0] 0 [BACKEND] FATAL:  could not create shared memory segment: Cannot allocate memory
2023-05-16 10:59:09.405 [unknown] [unknown] localhost 70372950802448 0[0:0#0] 0 [BACKEND] DETAIL:  Failed system call was shmget(key=26007001, size=16811745280, 03600).
2023-05-16 10:59:09.405 [unknown] [unknown] localhost 70372950802448 0[0:0#0] 0 [BACKEND] HINT:  This error usually means that openGauss's request for a shared memory segment exceeded available memory or swap space, or exceeded your kernel's SHMALL parameter.  You can either reduce the request size or reconfigure the kernel with larger SHMALL.  To reduce the request size (currently 16811745280 bytes), reduce openGauss's shared memory usage, perhaps by reducing shared_buffers.
        The openGauss documentation contains more information about shared memory configuration.
2023-05-16 10:59:09.408 [unknown] [unknown] localhost 70372950802448 0[0:0#0] 0 [BACKEND] LOG:  FiniNuma allocIndex: 0.
[2023-05-16 10:59:10.330][3905515][][gs_ctl]: waitpid 3905594 failed, exitstatus is 256, ret is 2

[2023-05-16 10:59:10.330][3905515][][gs_ctl]: stopped waiting
[2023-05-16 10:59:10.330][3905515][][gs_ctl]: could not start server
Examine the log output.
Process exited with status 1
```

**主备状态检查**：

```bash
[root@hostname data]# ptk cluster -n mogdb12 status
[   Cluster State   ]
cluster_name                            : mogdb12
cluster_state                           : Degraded
database_version                        : MogDB 3.0.0 (build 62408a0f)

[  Datanode State   ]
  cluster_name |  id  |      ip      | port  | user  | nodename | db_role |               state                | upstream
---------------+------+--------------+-------+-------+----------+---------+------------------------------------+-----------
  mogdb12      | 6001 | 172.16.0.245 | 26007 | omm12 | dn_6001  | primary | stopped

```

**解决办法**：

进入数据库安装目录/home/omm12/mogdb/data，打开 postgresql.conf, 发现 shared_buffers 参数值为 12GB，改小后， 改为 2GB 后启动数据库，发现启动成功。
