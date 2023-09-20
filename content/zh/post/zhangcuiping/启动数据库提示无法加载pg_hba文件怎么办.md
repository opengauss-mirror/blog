+++

title = "启动数据库提示无法加载pg_hba文件怎么办？" 

date = "2023-09-20" 

tags = ["启动数据库提示无法加载pg_hba文件？"] 

archives = "2023-09" 

author = "张翠娉" 

summary = "启动数据库提示无法加载pg_hba文件怎么办？"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "16:50"
+++

# 启动数据库提示无法加载pg_hba文件怎么办？



**背景介绍**：

PTK (Provisioning Toolkit)是一款针对 MogDB 数据库开发的软件安装和运维工具，旨在帮助用户更便捷地安装部署MogDB数据库。

如果用户想要运行 MogDB 或者 MogDB 的相关组件时，仅需要执行一行命令即可实现。

PTK 支持安装 MogDB 的操作系统众多，后期还会不断增多。

本次在启动数据库时遇到如下报错。

报错内容：

```bash
[root@mogdv-kernel-001 pg_xlog]# ptk cluster -n mogdb305 restart
INFO[2023-09-20T14:38:51.002] operation: stop
INFO[2023-09-20T14:38:51.002] ========================================
INFO[2023-09-20T14:38:51.003] stop db [172.23.1.xx:28000] ...
INFO[2023-09-20T14:38:51.201] stop db [172.23.1.xx:28000] successfully
INFO[2023-09-20T14:38:51.201] ========================================
INFO[2023-09-20T14:38:51.201] stop successfully

INFO[2023-09-20T14:38:51.454] operation: start
INFO[2023-09-20T14:38:51.455] ========================================
INFO[2023-09-20T14:38:51.455] start db [172.23.1.xx:28000] ...
INFO[2023-09-20T14:38:52.569] start db [172.23.1.xx:28000] successfully
INFO[2023-09-20T14:38:52.834] ========================================
INFO[2023-09-20T14:38:52.834] start cluster successfully
[root@mogdv-kernel-001 pg_xlog]# ptk cluster -n mogdb5 start
INFO[2023-09-20T14:39:11.019] operation: start
INFO[2023-09-20T14:39:11.019] ========================================
INFO[2023-09-20T14:39:11.019] start db [172.23.1.xx:27000] ...
ERRO[2023-09-20T14:39:12.118] start db [172.23.1.xx:27000] failed
ERROR: Error: [exited status: 1] Command: "bash -c \". ~/.ptk_mogdb_env; /opt/mogdb500/app/bin/gs_ctl start -M primary  -D /opt/mogdb500/data \"": [2023-09-20 14:39:11.096][2125452][][gs_ctl]: gs_ctl started,datadir is /opt/mogdb500/data
[2023-09-20 14:39:11.117][2125452][][gs_ctl]: waiting for server to start...
.0 LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.

0 LOG:  [Alarm Module]Host Name: mogdv-kernel-001

0 LOG:  [Alarm Module]Host IP: mogdv-kernel-001. Copy hostname directly in case of taking 10s to use 'gethostbyname' when /etc/hosts does not contain <HOST IP>

0 LOG:  [Alarm Module]Cluster Name: mogdb5

0 WARNING:  failed to open feature control file, please check whether it exists: FileName=gaussdb.version, Errno=2, Errmessage=No such file or directory.
0 WARNING:  failed to parse feature control file: gaussdb.version.
0 WARNING:  Failed to load the product control file, so gaussdb cannot distinguish product version.
The core dump path from /proc/sys/kernel/core_pattern is an invalid directory:|/usr/lib/systemd/
2023-09-20 14:39:11.163 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  when starting as multi_standby mode, we couldn't support data replicaton.
2023-09-20 14:39:11.168 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.

2023-09-20 14:39:11.168 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  [Alarm Module]Host Name: mogdv-kernel-001

2023-09-20 14:39:11.168 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  [Alarm Module]Host IP: mogdv-kernel-001. Copy hostname directly in case of taking 10s to use 'gethostbyname' when /etc/hosts does not contain <HOST IP>

2023-09-20 14:39:11.168 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  [Alarm Module]Cluster Name: mogdb5

2023-09-20 14:39:11.169 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  loaded library "security_plugin"
2023-09-20 14:39:11.169 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  invalid authentication method "sha"
2023-09-20 14:39:11.169 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] CONTEXT:  line 93 of configuration file "/opt/mogdb500/data/pg_hba.conf"
2023-09-20 14:39:11.370 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  invalid authentication method "sha"
2023-09-20 14:39:11.370 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] CONTEXT:  line 93 of configuration file "/opt/mogdb500/data/pg_hba.conf"
2023-09-20 14:39:11.570 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  invalid authentication method "sha"
2023-09-20 14:39:11.570 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] CONTEXT:  line 93 of configuration file "/opt/mogdb500/data/pg_hba.conf"
2023-09-20 14:39:11.570 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] FATAL:  could not load pg_hba.conf
[2023-09-20 14:39:12.117][2125452][][gs_ctl]: waitpid 2125455 failed, exitstatus is 256, ret is 2

[2023-09-20 14:39:12.117][2125452][][gs_ctl]: stopped waiting
[2023-09-20 14:39:12.117][2125452][][gs_ctl]: could not start server
Examine the log output.
 Stdout: [2023-09-20 14:39:11.096][2125452][][gs_ctl]: gs_ctl started,datadir is /opt/mogdb500/data
[2023-09-20 14:39:11.117][2125452][][gs_ctl]: waiting for server to start...
.0 LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.

0 LOG:  [Alarm Module]Host Name: mogdv-kernel-001

0 LOG:  [Alarm Module]Host IP: mogdv-kernel-001. Copy hostname directly in case of taking 10s to use 'gethostbyname' when /etc/hosts does not contain <HOST IP>

0 LOG:  [Alarm Module]Cluster Name: mogdb5

0 WARNING:  failed to open feature control file, please check whether it exists: FileName=gaussdb.version, Errno=2, Errmessage=No such file or directory.
0 WARNING:  failed to parse feature control file: gaussdb.version.
0 WARNING:  Failed to load the product control file, so gaussdb cannot distinguish product version.
The core dump path from /proc/sys/kernel/core_pattern is an invalid directory:|/usr/lib/systemd/
2023-09-20 14:39:11.163 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  when starting as multi_standby mode, we couldn't support data replicaton.
2023-09-20 14:39:11.168 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.

2023-09-20 14:39:11.168 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  [Alarm Module]Host Name: mogdv-kernel-001

2023-09-20 14:39:11.168 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  [Alarm Module]Host IP: mogdv-kernel-001. Copy hostname directly in case of taking 10s to use 'gethostbyname' when /etc/hosts does not contain <HOST IP>

2023-09-20 14:39:11.168 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  [Alarm Module]Cluster Name: mogdb5

2023-09-20 14:39:11.169 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  loaded library "security_plugin"
2023-09-20 14:39:11.169 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  invalid authentication method "sha"
2023-09-20 14:39:11.169 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] CONTEXT:  line 93 of configuration file "/opt/mogdb500/data/pg_hba.conf"
2023-09-20 14:39:11.370 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  invalid authentication method "sha"
2023-09-20 14:39:11.370 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] CONTEXT:  line 93 of configuration file "/opt/mogdb500/data/pg_hba.conf"
2023-09-20 14:39:11.570 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  invalid authentication method "sha"
2023-09-20 14:39:11.570 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] CONTEXT:  line 93 of configuration file "/opt/mogdb500/data/pg_hba.conf"
2023-09-20 14:39:11.570 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] FATAL:  could not load pg_hba.conf
[2023-09-20 14:39:12.117][2125452][][gs_ctl]: waitpid 2125455 failed, exitstatus is 256, ret is 2

[2023-09-20 14:39:12.117][2125452][][gs_ctl]: stopped waiting
[2023-09-20 14:39:12.117][2125452][][gs_ctl]: could not start server
Examine the log output.
OUTPUT: [2023-09-20 14:39:11.096][2125452][][gs_ctl]: gs_ctl started,datadir is /opt/mogdb500/data
[2023-09-20 14:39:11.117][2125452][][gs_ctl]: waiting for server to start...
.0 LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.

0 LOG:  [Alarm Module]Host Name: mogdv-kernel-001

0 LOG:  [Alarm Module]Host IP: mogdv-kernel-001. Copy hostname directly in case of taking 10s to use 'gethostbyname' when /etc/hosts does not contain <HOST IP>

0 LOG:  [Alarm Module]Cluster Name: mogdb5

0 WARNING:  failed to open feature control file, please check whether it exists: FileName=gaussdb.version, Errno=2, Errmessage=No such file or directory.
0 WARNING:  failed to parse feature control file: gaussdb.version.
0 WARNING:  Failed to load the product control file, so gaussdb cannot distinguish product version.
The core dump path from /proc/sys/kernel/core_pattern is an invalid directory:|/usr/lib/systemd/
2023-09-20 14:39:11.163 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  when starting as multi_standby mode, we couldn't support data replicaton.
2023-09-20 14:39:11.168 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.

2023-09-20 14:39:11.168 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  [Alarm Module]Host Name: mogdv-kernel-001

2023-09-20 14:39:11.168 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  [Alarm Module]Host IP: mogdv-kernel-001. Copy hostname directly in case of taking 10s to use 'gethostbyname' when /etc/hosts does not contain <HOST IP>

2023-09-20 14:39:11.168 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  [Alarm Module]Cluster Name: mogdb5

2023-09-20 14:39:11.169 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  loaded library "security_plugin"
2023-09-20 14:39:11.169 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  invalid authentication method "sha"
2023-09-20 14:39:11.169 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] CONTEXT:  line 93 of configuration file "/opt/mogdb500/data/pg_hba.conf"
2023-09-20 14:39:11.370 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  invalid authentication method "sha"
2023-09-20 14:39:11.370 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] CONTEXT:  line 93 of configuration file "/opt/mogdb500/data/pg_hba.conf"
2023-09-20 14:39:11.570 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] LOG:  invalid authentication method "sha"
2023-09-20 14:39:11.570 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] CONTEXT:  line 93 of configuration file "/opt/mogdb500/data/pg_hba.conf"
2023-09-20 14:39:11.570 [unknown] [unknown] localhost 140182002713600 0[0:0#0] 0 [BACKEND] FATAL:  could not load pg_hba.conf
[2023-09-20 14:39:12.117][2125452][][gs_ctl]: waitpid 2125455 failed, exitstatus is 256, ret is 2

[2023-09-20 14:39:12.117][2125452][][gs_ctl]: stopped waiting
[2023-09-20 14:39:12.117][2125452][][gs_ctl]: could not start server
Examine the log output.
error message is too long
Open file ptk_error.2023-09-20T14_39_12 to checkout error detail
```

**解决办法**：

进入数据库数据目录，打开pg_hba文件，确保配置如下所示，重新启动即可成功。

```
# "local" is for Unix domain socket connections only
local   all             all                                     trust
host    all    omm5    ip address/32   trust
# IPv4 local connections:
host    all             all             127.0.0.1/32           trust
host    all    all   ip address/32   sha256
host     all    all     0.0.0.0/0      trust
# IPv6 local connections:
host    all             all             ::1/128                 trust
```

