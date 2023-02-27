---
title: 'openGauss数据库维护管理.md'

date: '2021-07-09'
category: 'blog'
tags: ['openGauss数据库维护管理.md']

archives: '2021-07'

author: '七月'

summary: 'openGauss数据库维护管理.md'

img: '/zh/blogs/zhengwen2/img/img25.png'

times: '12:30'
---

### 1 操作系统参数检查

#### 1.1 实验介绍

##### 1.1.1 关于本实验

gs_checkos 工具用来帮助检查操作系统、控制参数、磁盘配置等内容，并对系统控制参数、I/O 配置、网络配置和 THP 服务等信息进行配置。
本实验主要是通过 gs_checkos 工具来检查操作系统参数设置是否合理。先进行场景设置，然后根据检查结果进行参数调整。

##### 1.1.2 实验目的

掌握 gs_checkos 工具的基本使用；

#### 1.2 场景设置及操作步骤

##### 步骤 1 用 ROOT 用户登录装有 openGauss 数据库服务的操作系统，登录后信息如下：

```
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64
System information as of time: 	Mon Jul 20 16:41:11 CST 2020
System load: 	0.00
Processes: 	113
Memory used: 	7.0%
Swap used: 	0.0%
Usage On: 	15%
IP address: 	192.168.0.96
Users online: 	2
[root@ecs-e1b3 ~]#
```

##### 步骤 2 在 ROOT 用户下执行 gs_checkos 先对系统参数进行检查。

```
[root@ecs-e1b3 ~]# gs_checkos -i A
Checking items:
A1. [ OS version status ]                                   : Normal
A2. [ Kernel version status ]                               : Normal
A3. [ Unicode status ]                                      : Normal
A4. [ Time zone status ]                                    : Normal
A5. [ Swap memory status ]                                  : Normal
A6. [ System control parameters status ]                    : Warning
A7. [ File system configuration status ]                    : Normal
A8. [ Disk configuration status ]                           : Normal
A9. [ Pre-read block size status ]                          : Normal
A10.[ IO scheduler status ]                                 : Normal
BondMode Null
A11.[ Network card configuration status ]                   : Warning
A12.[ Time consistency status ]                             : Warning
A13.[ Firewall service status ]                             : Normal
A14.[ THP service status ]                                  : Normal
Total numbers:14. Abnormal numbers:0. Warning numbers:3.
```

说明事项：

- Normal 为正常项，Abnormal 为必须处理项，Warning 可以不处理。
- Total numbers:14. Abnormal numbers:0. Warning numbers:3。
- 表示：总共检查 14 项，其中 Abnormal 必须处理项为 0，Warning 告警项为 3。

##### 步骤 3 调整系统参数值。

在参数配置文件（`/etc/sysctl.conf`）中将参数 `vm.min_free_kbytes`(表示：内核内存分配保留的内存量) 的值调整为 3488。输入“i”进入 INSERT 模式，进行修改。

```
[root@ecs-e1b3 ~]# vi /etc/sysctl.conf
net.ipv4.conf.default.accept_redirects=0
net.ipv4.conf.all.secure_redirects=0
net.ipv4.conf.default.secure_redirects=0
net.ipv4.icmp_echo_ignore_broadcasts=1
net.ipv4.icmp_ignore_bogus_error_responses=1
…………
net.ipv4.tcp_rmem = 8192 250000 16777216
net.ipv4.tcp_wmem = 8192 250000 16777216
vm.min_free_kbytes = 3488
net.core.netdev_max_backlog = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.core.somaxconn = 65535
```

参数值修改好后，按 `ESC`键退出编辑模式，然后输入`:wq`后回车进行保存。接着通过执行 `sysctl -p` 命令使刚才修改的参数生效，具体如下：

```
[root@ecs-e1b3 ~]# sysctl -p
kernel.sysrq = 0
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
……………
net.core.rmem_default = 21299200
net.sctp.sctp_mem = 94500000 915000000 927000000
net.sctp.sctp_rmem = 8192 250000 16777216
net.sctp.sctp_wmem = 8192 250000 16777216
kernel.sem = 250 6400000 1000 25600
net.ipv4.tcp_rmem = 8192 250000 16777216
net.ipv4.tcp_wmem = 8192 250000 16777216
vm.min_free_kbytes = 3488
net.core.netdev_max_backlog = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.core.somaxconn = 65535
kernel.shmall = 1152921504606846720
kernel.shmmax = 18446744073709551615

```

##### 步骤 4 再执行 gs_checkos 对系统参数进行检查。

```
[root@ecs-e1b3 ~]# gs_checkos -i A
Checking items:
A1. [ OS version status ] : Normal
A2. [ Kernel version status ] : Normal
A3. [ Unicode status ] : Normal
A4. [ Time zone status ] : Normal
A5. [ Swap memory status ] : Normal
A6. [ System control parameters status ] : Abnormal
A7. [ File system configuration status ] : Normal
A8. [ Disk configuration status ] : Normal
A9. [ Pre-read block size status ] : Normal
A10.[ IO scheduler status ] : Normal
BondMode Null
A11.[ Network card configuration status ] : Warning
A12.[ Time consistency status ] : Warning
A13.[ Firewall service status ] : Normal
A14.[ THP service status ] : Normal
Total numbers:14. Abnormal numbers:1. Warning numbers:2.
Do checking operation finished. Result: Abnormal.

```

此时 A6. [ System control parameters status ] 的状态为 Abnormal 为必须处理项；
Total numbers:14. Abnormal numbers:1. Warning numbers:2。
表示：总共检查 14 项，其中 Abnormal 必须处理项为 1，Warning 告警项为 2。

##### 步骤 5 通过执行`gs_checkos -i A --detail` 查看更详细的信息。

```
[root@ecs-e1b3 ~]# gs_checkos -i A --detail
Checking items:
A1. [ OS version status ]                                   : Normal
[ecs-e1b3]
openEuler_20.03_64bit
A2. [ Kernel version status ]                               : Normal
The names about all kernel versions are same. The value is “4.19.90-2003.4.0.0036.oe1.aarch64”.
A3. [ Unicode status ]                                      : Normal
The values of all unicode are same. The value is “LANG=en_US.UTF-8”.
A4. [ Time zone status ]                                    : Normal
The informations about all timezones are same. The value is “+0800”.
A5. [ Swap memory status ]                                  : Normal
The value about swap memory is correct.
A6. [ System control parameters status ]                    : Abnormal
[ecs-e1b3]
Abnormal reason: variable ‘vm.min_free_kbytes’ RealValue ‘3488’ ExpectedValue ‘348844’.
Warning reason: variable ‘net.ipv4.tcp_retries1’ RealValue ‘3’ ExpectedValue ‘5’.
Warning reason: variable ‘net.ipv4.tcp_syn_retries’ RealValue ‘6’ ExpectedValue ‘5’.
Warning reason: variable ‘net.sctp.path_max_retrans’ RealValue ‘5’ ExpectedValue ‘10’.
Warning reason: variable ‘net.sctp.max_init_retransmits’ RealValue ‘8’ ExpectedValue ‘10’.
Check_SysCtl_Parameter failed.
A7. [ File system configuration status ]                    : Normal
Both soft nofile and hard nofile are correct.
A8. [ Disk configuration status ]                           : Normal
The value about XFS mount parameters is correct.
A9. [ Pre-read block size status ]                          : Normal
The value about Logical block size is correct.
A10.[ IO scheduler status ]                                 : Normal
The value of IO scheduler is correct.
BondMode Null
A11.[ Network card configuration status ]                   : Warning
[ecs-e1b3]
BondMode Null
Warning reason: Failed to obtain the network card speed value. Maybe the network card “eth0” is not working.
A12.[ Time consistency status ]                             : Warning
[ecs-e1b3]
The NTPD not detected on machine and local time is “2020-07-20 17:16:41”.
A13.[ Firewall service status ]                             : Normal
The firewall service is stopped.
A14.[ THP service status ]                                  : Normal
The THP service is stopped.
Total numbers:14. Abnormal numbers:1. Warning numbers:2.
Do checking operation finished. Result: Abnormal.

```

在详细信息中，可以明确看出那些参数设置有问题，并给出了问题参数要求修改的参考值，如下：

```
A6. [ System control parameters status ] : Abnormal
[ecs-e1b3]
Abnormal reason: variable ‘vm.min_free_kbytes’ RealValue ‘3488’ ExpectedValue ‘348844’.
Warning reason: variable ‘net.ipv4.tcp_retries1’ RealValue ‘3’ ExpectedValue ‘5’.
Warning reason: variable ‘net.ipv4.tcp_syn_retries’ RealValue ‘6’ ExpectedValue ‘5’.
Warning reason: variable ‘net.sctp.path_max_retrans’ RealValue ‘5’ ExpectedValue ‘10’.
Warning reason: variable ‘net.sctp.max_init_retransmits’ RealValue ‘8’ ExpectedValue ‘10’.
Check_SysCtl_Parameter failed.

```

##### 步骤 6 按详细信息中的修改说明对系统参数进行修改。

```
vm.min_free_kbytes的值由3488调整为348844
net.ipv4.tcp_retries1的值由3调整为5.
net.ipv4.tcp_syn_retries的值由6调整为5.
net.sctp.path_max_retrans的值由5调整为10
net.sctp.max_init_retransmits的值由8调整为10

```

具体设置如下：

```
vm.min_free_kbytes = 348844
net.ipv4.tcp_retries1 = 5
net.ipv4.tcp_syn_retries = 5
net.sctp.path_max_retrans = 10
net.sctp.max_init_retransmits = 10
```

在系统参数文件中进行修改（输入“i”进入 INSERT 模式，进行修改。）：
`[root@ecs-e1b3 ~]# vi /etc/sysctl.conf`

```
sysctl settings are defined through files in
/usr/lib/sysctl.d/, /run/sysctl.d/, and /etc/sysctl.d/.

Vendors settings live in /usr/lib/sysctl.d/.
To override a whole file, create a new file with the same in
/etc/sysctl.d/ and put new settings there. To override
only specific settings, add a file with a lexically later
name in /etc/sysctl.d/ and put new settings there.
For more information, see sysctl.conf(5) and sysctl.d(5).


kernel.sysrq=0
net.ipv4.ip_forward=0
net.ipv4.conf.all.send_redirects=0
net.ipv4.conf.default.send_redirects=0
net.ipv4.conf.all.accept_source_route=0
net.ipv4.conf.default.accept_source_route=0
net.ipv4.conf.all.accept_redirects=0

/etc/sysctl.d/ and put new settings there. To override
only specific settings, add a file with a lexically later
name in /etc/sysctl.d/ and put new settings there.

For more information, see sysctl.conf(5) and sysctl.d(5).
kernel.sysrq=0
net.ipv4.ip_forward=0
net.ipv4.conf.all.send_redirects=0
net.ipv4.conf.default.send_redirects=0
net.ipv4.conf.all.accept_source_route=0</p>
/etc/sysctl.d/ and put new settings there. To override
only specific settings, add a file with a lexically later
name in /etc/sysctl.d/ and put new settings there.

For more information, see sysctl.conf(5) and sysctl.d(5).
kernel.sysrq=0
net.ipv4.ip_forward=0
net.ipv4.conf.all.send_redirects=0
net.ipv4.conf.default.send_redirects=0
net.ipv4.conf.all.accept_source_route=0
net.ipv4.conf.default.accept_source_route=0
……………
net.sctp.sctp_rmem = 8192 250000 16777216
net.sctp.sctp_wmem = 8192 250000 16777216
kernel.sem = 250 6400000 1000 25600
net.ipv4.tcp_rmem = 8192 250000 16777216
net.ipv4.tcp_wmem = 8192 250000 16777216
vm.min_free_kbytes = 348844
net.core.netdev_max_backlog = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.core.somaxconn = 65535
kernel.shmall = 1152921504606846720
kernel.shmmax = 18446744073709551615
net.ipv4.tcp_retries1 = 5
net.ipv4.tcp_syn_retries = 5
net.sctp.path_max_retrans = 10
net.sctp.max_init_retransmits = 10
```

参数值修改好后，按`ECS`键退出编辑模式，然后输入`:wq`后回车进行保存。接着通过执行 `sysctl -p` 命令使刚才修改的参数生效，具体如下：

```
[root@ecs-e1b3 ~]# sysctl -p
kernel.sysrq = 0
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.tcp_syncookies = 1
kernel.dmesg_restrict = 1
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
vm.swappiness = 0
net.ipv4.tcp_max_tw_buckets = 10000
net.ipv4.tcp_tw_reuse = 1
…………….
net.ipv4.tcp_rmem = 8192 250000 16777216
net.ipv4.tcp_wmem = 8192 250000 16777216
vm.min_free_kbytes = 348844
net.core.netdev_max_backlog = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.core.somaxconn = 65535
kernel.shmall = 1152921504606846720
kernel.shmmax = 18446744073709551615
net.ipv4.tcp_retries1 = 5
net.ipv4.tcp_syn_retries = 5
net.sctp.path_max_retrans = 10
net.sctp.max_init_retransmits = 10
```

##### 步骤 7 再次通过执行`gs_checkos -i A` 查看系统参数检查是否能通过。

```
[root@ecs-e1b3 ~]# gs_checkos -i A
Checking items:
A1. [ OS version status ]                                   : Normal
A2. [ Kernel version status ]                               : Normal
A3. [ Unicode status ]                                      : Normal
A4. [ Time zone status ]                                    : Normal
A5. [ Swap memory status ]                                  : Normal
A6. [ System control parameters status ]                    : Normal
A7. [ File system configuration status ]                    : Normal
A8. [ Disk configuration status ]                           : Normal
A9. [ Pre-read block size status ]                          : Normal
A10.[ IO scheduler status ]                                 : Normal
BondMode Null
A11.[ Network card configuration status ]                   : Warning
A12.[ Time consistency status ]                             : Warning
A13.[ Firewall service status ]                             : Normal
A14.[ THP service status ]                                  : Normal
Total numbers:14. Abnormal numbers:0. Warning numbers:2.
```

从检查结果可以看出，系统参数检查已经通过。其中 A6. [ System control parameters status ]的状态由原来的 Abnormal 变为了 Normal。
操作系统参数检查实验结束。

### 2 openGauss 运行健康状态检查

#### 2.1 实验介绍

##### 2.1.1 关于本实验

gs_check 能够帮助用户在 openGauss 运行过程中，全量的检查 openGauss 运行环境，操作系统环境，网络环境及数据库执行环境，也有助于在 openGauss 重大操作之前对各类环境进行全面检查，有效保证操作执行成功。
本实验主要是通过 gs_check 工具来检查 openGauss 数据库运行状态。先进行场景设置，然后根据检查结果进行数据库调整。

语法如下：

单项检查：

```
gs_check -i ITEM […] [-U USER] [-L] [-l LOGFILE] [-o OUTPUTDIR] [–skip-root-items][–set][–routing]
```

场景检查：

```
gs_check -e SCENE_NAME [-U USER] [-L] [-l LOGFILE] [-o OUTPUTDIR] [–hosts] [–skip-root-items] [–time-out=SECS][–set][–routing][–skip-items]
```

场景检查项。默认的场景有 inspect（例行巡检）、upgrade（升级前巡检）、binary_upgrade（就地升级前巡检）、health（健康检查巡检）、install(安装)，等，用户可以根据需求自己编写场景。
显示帮助信息。

```
gs_check -? | --help
```

##### 2.1.2 实验目的

掌握 gs_check 工具的基本使用；

#### 2.2 场景设置及操作步骤

##### 步骤 1 用 ROOT 用户登录装有 openGauss 数据库服务的操作系统然后用 su – omm 命令切换至 OMM 用户环境，登录后信息如下。

```
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64
System information as of time: Tue Jul 21 09:21:11 CST 2020
System load: 0.01
Processes: 109
Memory used: 6.7%
Swap used: 0.0%
Usage On: 15%
IP address: 192.168.0.96
Users online: 1
[root@ecs-e1b3 ~]# su - omm
Last login: Fri Jul 10 19:05:39 CST 2020 on pts/0
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64
System information as of time: Tue Jul 21 09:21:25 CST 2020
System load: 0.01
Processes: 111
Memory used: 7.0%
Swap used: 0.0%
Usage On: 15%
IP address: 192.168.0.96
Users online: 1
[omm@ecs-e1b3 ~]$
```

##### 步骤 2 确认 openGauss 数据库服务是否启动。

```
[omm@ecs-e1b3 ~]$ gs_om -t status;
cluster_state : Normal
redistributing : No
```

cluster_state : Normal 表示已启动，可以正常使用。如果状态为非 Normal 表示不可用
为了实验场景设置，如果数据库服务已经启动，请执行步骤 3 先关闭服务。

##### 步骤 3 关闭 openGauss 数据库服务。

```
[omm@ecs-e1b3 ~]$ gs_om -t stop;
Stopping cluster.

Successfully stopped cluster.
End stop cluster.

```

##### 步骤 4 检查 openGauss 实例连接。

```
[omm@ecs-e1b3 ~]$ gs_check -i CheckDBConnection
Parsing the check items config file successfully
Distribute the context file to remote hosts successfully
Start to health check for the cluster. Total Items:1 Nodes:1
Checking…               [=========================] 1/1
Start to analysis the check result
CheckDBConnection…NG
The item run on 1 nodes.  ng: 1
The ng[ecs-e1b3] value:
The database can not be connected.
Analysis the check result successfully
Failed.	All check items run completed. Total:1     NG:1
For more information please refer to /opt/huawei/wisequery/script/gspylib/inspection/output/CheckReport_2020072139449163171.tar.gz
```

说明：

- CheckDBConnection…NG 表示连接检查项无用；
- The database can not be connected. 表示实例不能连接；
- Failed. All check items run completed. Total:1 NG:1 表示共检查 1 项并且检查结果未通过。

##### 步骤 5 启动 openGauss 数据库服务。

```
[omm@ecs-e1b3 ~]$ gs_om -t start;
Starting cluster.
=========================================
Successfully started.
[omm@ecs-e1b3 ~]$
```

##### 步骤 6 确认 openGauss 数据库服务已启动。

```
cluster_state : Normal
redistributing : No<
[omm@ecs-e1b3 ~]$
```

##### 步骤 7 再次检查 openGauss 实例连接。

```
[omm@ecs-e1b3 ~]$ gs_check -i CheckDBConnection
Parsing the check items config file successfully
Distribute the context file to remote hosts successfully
Start to health check for the cluster. Total Items:1 Nodes:1
 Checking…               [=========================] 1/1
Start to analysis the check result
CheckDBConnection…OK
The item run on 1 nodes.  success: 1
 Analysis the check result successfully
Success.	All check items run completed. Total:1   Success:1
For more information please refer to /opt/huawei/wisequery/script/gspylib/inspection/output/CheckReport_2020072140672174672.tar.gz
```

说明：

- CheckDBConnection…OK 表示连接检查项正常；
- Success. All check items run completed. Total:1 Success:1 表示共检查 1 项并且检查结果成功。
- openGauss 数据库运行健康状态检查实验结束。

### 3 数据库性能检查

#### 3.1 实验介绍

##### 3.1.1 关于本实验

openGauss 不仅提供了 gs_checkperf 工具来帮助用户了解 openGauss 的负载情况。
本实验主要是通过 gs_checkperf 工具来检查 openGauss 数据库性能以及通过 EXPLAIN 来进行 SQL 语句优化。

##### 3.1.2 实验目的

掌握 gs_checkperf 工具的基本使用；

#### 3.2 通过 gs_checkperf 工具来检查数据库性能

说明：

- gs_checkperf 可以对以下级别进行检查：
- openGauss 级别（主机 CPU 占用率、Gauss CPU 占用率、I/O 使用情况等）、
- 节点级别（CPU 使用情况、内存使用情况、I/O 使用情况）、
- 会话/进程级别（CPU 使用情况、内存使用情况、I/O 使用情况）、
- SSD 性能（写入、读取性能）
  其中检查 SSD 性能要用 root 用户执行，检查 openGauss 性能要用 openGauss 安装用户执行
  本实验为检查 openGauss 性能。

##### 步骤 1 用 ROOT 用户登录装有 openGauss 数据库服务的操作系统然后用 su – omm 命令切换至 OMM 用户环境，登录后信息如下。

```
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64
System information as of time: 	Tue Jul 21 09:21:11 CST 2020
System load: 	0.01
Processes: 	109
Memory used: 	6.7%
Swap used: 	0.0%
Usage On: 	15%
IP address: 	192.168.0.96
Users online: 	1
[root@ecs-e1b3 ~]# su - omm
Last login: Fri Jul 10 19:05:39 CST 2020 on pts/0
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64
System information as of time: 	Tue Jul 21 09:21:25 CST 2020
System load: 	0.01
Processes: 	111
Memory used: 	7.0%
Swap used: 	0.0%
Usage On: 	15%
IP address: 	192.168.0.96
Users online: 	1
[omm@ecs-e1b3 ~]$
```

##### 步骤 2 先启动数据库服务，再用 gs_checkperf 检查下，再使用 gsql 客户端以管理员用户身份连接 postgres 数据库，假设端口号为 26000。

先启动数据库服务。

```
[omm@ecs-e1b3 ~]$ gs_om -t start;
Starting cluster.


=========================================
Successfully started.
```

用 gs_checkperf 检查下。

```
[omm@ecs-e1b3 ~]$ gs_checkperf
Cluster statistics information:
Host CPU busy time ratio                     :    .72        %
MPPDB CPU time % in busy time                :    .33        %
Shared Buffer Hit ratio                      :    97.33      %
In-memory sort ratio                         :    0
Physical Reads                               :    466
Physical Writes                              :    175
DB size                                      :    47         MB
Total Physical writes                        :    175
Active SQL count                             :    3
Session count                                :    4
```

确认 openGauss 数据库服务是否正常。

```
[omm@ecs-e1b3 ~]$ gs_om -t status;

cluster_state : Unavailable
redistributing : No
```

cluster_state : Normal 表示已启动，可以正常使用。如果状态为 Unavailable 表示不可用
为了实验继续进行，请先启动数据库服务。
启动数据库服务（如果数据库服务是正常的，此步骤可以不执行）。

```
[omm@ecs-e1b3 ~]$ gs_om -t start;
Starting cluster.

=========================================
Successfully started.
```

然后连接 postgres 数据库。

```
[omm@ecs-e1b3 ~]$ gsql -d postgres -p 26000 -r
gsql ((openGauss 1.0.0 build 38a9312a) compiled at 2020-05-27 14:57:08 commit 472 last mr 549 )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type “help” for help.
postgres=#
```

##### 步骤 3 对 PMK 模式下的表进行统计信息收集。

```
postgres=# analyze pmk.pmk_configuration;
ANALYZE
postgres=# analyze pmk.pmk_meta_data;
ANALYZE
postgres=# analyze pmk.pmk_snapshot;
ANALYZE
postgres=# analyze pmk.pmk_snapshot_datanode_stat;
ANALYZE
postgres=#
```

说明：

- gs_checkperf 工具的监控信息依赖于 pmk 模式下的表的数据，如果 pmk 模式下的表未执行 analyze 操作，则可能导致 gs_checkperf 工具执行失败。

##### 步骤 4 执行简要性能检查。

用 `\q` 先退出 postgres 数据库，然后在操作系统用户 omm 环境下去执行 gs_checkperf 检查工具，具体如下：

```
postgres=#
postgres=# \q
[omm@ecs-e1b3 ~]$ gs_checkperf
Cluster statistics information:
Host CPU busy time ratio : 1.66 % -----主机 CPU 占用率
MPPDB CPU time % in busy time : 2.51 % ----Gauss CPU 占用率
Shared Buffer Hit ratio : 99.14 % ----共享内存命中率
In-memory sort ratio : 0 —内存中排序比率
Physical Reads : 504 —物理读次数
Physical Writes : 162 —物理写次数
DB size : 57 MB —DB 大小
Total Physical writes : 162 —总物理写次数
Active SQL count : 4 —当前 SQL 执行数
Session count : 5 —Session 数量</p>
```

##### 步骤 5 执行详细性能检查。

```
[omm@ecs-e1b3 ~]$ gs_checkperf --detail
Cluster statistics information:
Host CPU usage rate:
Host total CPU time                          :    45719980.000 Jiffies
Host CPU busy time                           :    761060.000 Jiffies
Host CPU iowait time                         :    6640.000   Jiffies
Host CPU busy time ratio                     :    1.66       %
Host CPU iowait time ratio                   :    .01        %
MPPDB CPU usage rate:
MPPDB CPU time % in busy time                :    5.12       %
MPPDB CPU time % in total time               :    .09        %
Shared buffer hit rate:
Shared Buffer Reads                          :    1057
Shared Buffer Hits                           :    139798
Shared Buffer Hit ratio                      :    99.25      %
In memory sort rate:
In-memory sort count                         :    0
In-disk sort count                           :    0
In-memory sort ratio                         :    0
I/O usage:
Number of files                              :    106
Physical Reads                               :    584
Physical Writes                              :    362
Read Time                                    :    5794       ms
Write Time                                   :    4046       ms
Disk usage:
DB size                                      :    57         MB
Total Physical writes                        :    362
Average Physical write                       :    89471.08
Maximum Physical write                       :    362
Activity statistics:
Active SQL count                             :    4
Session count                                :    5
Node statistics information:
dn_6001:
MPPDB CPU Time                               :    38960      Jiffies
Host CPU Busy Time                           :    761060     Jiffies
Host CPU Total Time                          :    45719980   Jiffies
MPPDB CPU Time % in Busy Time                :    5.12       %
MPPDB CPU Time % in Total Time               :    .09        %
Physical memory                              :    7144341504 Bytes
DB Memory usage                              :    14922285056 Bytes
Shared buffer size                           :    1073741824 Bytes
Shared buffer hit ratio                      :    99.25      %
Sorts in memory                              :    0
Sorts in disk                                :    0
In-memory sort ratio                         :    0
Number of files                              :    106
Physical Reads                               :    584
Physical Writes                              :    362
Read Time                                    :    5794
Write Time                                   :    4046
Session statistics information(Top 10):
Session CPU statistics:
1 dn_6001-postgres-omm:
Session CPU time                             :    2
Database CPU time                            :    39020
Session CPU time %                           :    .01        %
……………
Session Memory statistics:
1 dn_6001-postgres-omm:
Buffer Reads                                 :    1309
Shared Buffer Hit ratio                      :    93.03
In Memory sorts                              :    0
In Disk sorts                                :    0
In Memory sorts ratio                        :    0
Total Memory Size                            :    7433136
Used Memory Size                             :    6443268
…………………
Session IO statistics:
1 dn_6001-postgres-omm:
Physical Reads                               :    98
Read Time                                    :    1069
2 dn_6001-postgres-omm:
Physical Reads                               :    13
Read Time                                    :    173
…………
[omm@ecs-e1b3 ~]$
```

gs_checkperf 检查实验结束。

#### 3.3 通过 EXPLAIN 进行 SQL 语句优化

说明：

- 使用 explain 能显示 SQL 语句的执行计划;
- 执行计划将显示 SQL 语句所引用的表会采用什么样的扫描方式，如：简单的顺序扫描、索引扫描等。如果引用了多个表，执行计划还会显示用到的 JOIN 算法;
- 执行计划的最关键的部分是语句的预计执行开销，这是计划生成器估算执行该语句将花费多长的时间;
- 若指定了 ANALYZE 选项，则该语句模拟执行并形成最优的执行计划（并非真正执行），然后根据实际的运行结果显示统计数据，包括每个计划节点内时间总开销（毫秒为单位）和实际返回的总行数。这对于判断计划生成器的估计是否接近现实非常有用。

##### 步骤 1 用 ROOT 用户登录装有 openGauss 数据库服务的操作系统然后用 `su – omm `命令切换至 OMM 用户环境，登录后信息如下。

```
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64
System information as of time: Tue Jul 21 09:21:11 CST 2020
System load: 0.01
Processes: 109
Memory used: 6.7%
Swap used: 0.0%
Usage On: 15%
IP address: 192.168.0.96
Users online: 1
[root@ecs-e1b3 ~]# su - omm
Last login: Fri Jul 10 19:05:39 CST 2020 on pts/0
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64
System information as of time: Tue Jul 21 09:21:25 CST 2020
System load: 0.01
Processes: 111
Memory used: 7.0%
Swap used: 0.0%
Usage On: 15%
IP address: 192.168.0.96
Users online: 1
[omm@ecs-e1b3 ~]$
```

##### 步骤 2 先启动数据库服务，然后使用 gsql 客户端以管理员用户身份连接 postgres 数据库，假设端口号为 26000。

启动数据库服务。

```
[omm@ecs-e1b3 ~]$ gs_om -t start;
Starting cluster.

=========================================
Successfully started.
```

然后连接 postgres 数据库。

```
[omm@ecs-e1b3 ~]$ gsql -d postgres -p 26000 -r
gsql ((openGauss 1.0.0 build 38a9312a) compiled at 2020-05-27 14:56:08 commit 472 last mr 549 )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type “help” for help.
postgres=#
```

##### 步骤 3 创建 student 表。

```
postgres=# CREATE TABLE student
(       std_id INT NOT NULL,
std_name VARCHAR(20) NOT NULL,
std_sex VARCHAR(6),
std_birth DATE,
std_in DATE NOT NULL,
std_address VARCHAR(100)
);
 CREATE TABLE
```

##### 步骤 4 表数据插入。

```
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (1,‘张一’,‘男’,‘1993-01-01’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (2,‘张二’,‘男’,‘1993-01-02’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (3,‘张三’,‘男’,‘1993-01-03’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (4,‘张四’,‘男’,‘1993-01-04’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (5,‘张五’,‘男’,‘1993-01-05’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (6,‘张六’,‘男’,‘1993-01-06’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (7,‘张七’,‘男’,‘1993-01-07’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (8,‘张八’,‘男’,‘1993-01-08’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (9,‘张九’,‘男’,‘1993-01-09’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (10,‘李一’,‘男’,‘1993-01-10’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (11,‘李二’,‘男’,‘1993-01-11’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (12,‘李三’,‘男’,‘1993-01-12’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (13,‘李四’,‘男’,‘1993-01-13’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (14,‘李五’,‘男’,‘1993-01-14’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (15,‘李六’,‘男’,‘1993-01-15’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (16,‘李七’,‘男’,‘1993-01-16’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (17,‘李八’,‘男’,‘1993-01-17’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (18,‘李九’,‘男’,‘1993-01-18’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (19,‘王一’,‘男’,‘1993-01-19’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (20,‘王二’,‘男’,‘1993-01-20’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (21,‘王三’,‘男’,‘1993-01-21’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (22,‘王四’,‘男’,‘1993-01-22’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (23,‘王五’,‘男’,‘1993-01-23’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (24,‘王六’,‘男’,‘1993-01-24’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (25,‘王七’,‘男’,‘1993-01-25’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (26,‘王八’,‘男’,‘1993-01-26’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (27,‘王九’,‘男’,‘1993-01-27’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (28,‘钱一’,‘男’,‘1993-01-28’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (29,‘钱二’,‘男’,‘1993-01-29’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (30,‘钱三’,‘男’,‘1993-01-30’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (31,‘钱四’,‘男’,‘1993-02-01’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (32,‘钱五’,‘男’,‘1993-02-02’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (33,‘钱六’,‘男’,‘1993-02-03’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (34,‘钱七’,‘男’,‘1993-02-04’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (35,‘钱八’,‘男’,‘1993-02-05’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (36,‘钱九’,‘男’,‘1993-02-06’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (37,‘吴一’,‘男’,‘1993-02-07’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (38,‘吴二’,‘男’,‘1993-02-08’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (39,‘吴三’,‘男’,‘1993-02-09’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (40,‘吴四’,‘男’,‘1993-02-10’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (41,‘吴五’,‘男’,‘1993-02-11’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (42,‘吴六’,‘男’,‘1993-02-12’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (43,‘吴七’,‘男’,‘1993-02-13’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (44,‘吴八’,‘男’,‘1993-02-14’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (45,‘吴九’,‘男’,‘1993-02-15’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (46,‘柳一’,‘男’,‘1993-02-16’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (47,‘柳二’,‘男’,‘1993-02-17’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (48,‘柳三’,‘男’,‘1993-02-18’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (49,‘柳四’,‘男’,‘1993-02-19’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (50,‘柳五’,‘男’,‘1993-02-20’,‘2011-09-01’,‘江苏省南京市雨花台区’);</p>

```

##### 步骤 5 数据查询统计。

```
postgres=# select count(\*) from student;
count 50
 (1 row)
 postgres=# select * from student order by std_id;
std_id | std_name | std_sex |      std_birth      |       std_in        |     std_address
--------±---------±--------±--------------------±--------------------±---------------------
1 | 张一     | 男      | 1993-01-01 00:00:00 | 2011-09-01 00:00:00 | 江苏省南京市雨花台区
2 | 张二     | 男      | 1993-01-02 00:00:00 | 2011-09-01 00:00:00 | 江苏省南京市雨花台区
3 | 张三     | 男      | 1993-01-03 00:00:00 | 2011-09-01 00:00:00 | 江苏省南京市雨花台区
4 | 张四     | 男      | 1993-01-04 00:00:00 | 2011-09-01 00:00:00 | 江苏省南京市雨花台区
………………
```

##### 步骤 6 查看表信息。

```
postgres=# \d student
Table “public.student”
Column    |              Type              | Modifiers
-------------±-------------------------------±----------
std_id      | integer                        | not null
std_name    | character varying(20)          | not null
std_sex     | character varying(6)           |
std_birth   | timestamp(0) without time zone |
std_in      | timestamp(0) without time zone | not null
std_address | character varying(100)         |
```

##### 步骤 7 收集表的统计信息。

```
postgres=# ANALYZE VERBOSE student;
INFO: analyzing “public.student”(dn_6001 pid=48036)
INFO: ANALYZE INFO : “student”: scanned 1 of 1 pages, containing 50 live rows and 0 dead rows; 50 rows in sample, 50 estimated total rows(dn_6001 pid=48036)
ANALYZE
```

使用 ANALYZE VERBOSE 语句更新统计信息，会同时输出表的相关信息。

##### 步骤 8 查看语句的执行计划。

```
postgres=# explain select \* from student where std_id=30;
QUERY PLAN

Seq Scan on student  (cost=0.00…1.62 rows=1 width=62)
Filter: (std_id = 30)
(2 rows)
```

Seq Scan on student 表示使用的是全表扫描。

##### 步骤 9 给表添加主键。

```
postgres=# alter table student add primary key (std_id);
NOTICE:  ALTER TABLE / ADD PRIMARY KEY will create implicit index “student_pkey” for table “student”
ALTER TABLE
```

##### 步骤 10 再次查看表信息。

确定主键是否建好。

```
postgres=# \d student
Table “public.student”
Column | Type | Modifiers
-------------±-------------------------------±----------
std_id | integer | not null
std_name | character varying(20) | not null
std_sex | character varying(6) |
std_birth | timestamp(0) without time zone |
std_in | timestamp(0) without time zone | not null
std_address | character varying(100) |
Indexes:
“student_pkey” PRIMARY KEY, btree (std_id) TABLESPACE pg_default
```

student_pkey 为主键名称。

##### 步骤 11 通过 hint 来优化语句扫描方式。

通过加 hint 来使查询语句进行索引扫描。

```
postgres=# explain select /<em>+indexscan(student student_pkey)</em>/ \* from student where std_id=30;
QUERY PLAN

 [Bypass]
Index Scan using student_pkey on student  (cost=0.00…8.27 rows=1 width=62)
Index Cond: (std_id = 30)
(3 rows)
 postgres=#
```

Index Scan using student_pkey on student 表示语句通过 student 表上的主键索引 student_pkey 进行了索引扫描。

##### 步骤 12 退出数据库

```
postgres=# \q
```

EXPLAIN 进行 SQL 优化实验结束。

### 4 日志检查

#### 4.1 实验介绍

##### 4.1.1 关于本实验

数据库运行时，某些操作在执行过程中可能会出现错误，数据库依然能够运行。但是此时数据库中的数据可能已经发生不一致的情况。建议检查 openGauss 运行日志，及时发现隐患。
当 openGauss 发生故障时，使用 gs_collector 此工具收集 OS 信息、日志信息以及配置文件等信息，来定位问题。
本实验主要是先手工设置收集配置信息，然后通过 gs_collector 工具调整用配置来收集相关日志信息。

##### 4.1.2 实验目的

掌握 gs_collector 工具的基本使用；

#### 4.2 通过 gs_collector 工具来收集日志信息

##### 步骤 1 设置收集配置文件。

```
[omm@ecs-e1b3 ~]$ pwd
/home/omm
[omm@ecs-e1b3 ~]$ vi collector.json
在用 vi collector.json 创建配置文件后，输入”i”进入 INSERT 模式，并将以下文本内容添加至配置文件中，具体如下：
{
“Collect”:
[
{“TypeName”: “System”, “Content”:“RunTimeInfo, HardWareInfo”,“Interval”:“0”, “Count”:“1”},
{“TypeName”: “Log”, “Content” : “Coordinator,DataNode,Gtm,ClusterManager”, “Interval”:“0”, “Count”:“1”},
{“TypeName”: “Database”, “Content”: “pg_locks,pg_stat_activity,pg_thread_wait_status”,“Interval”:“0”, “Count”:“1”},
{“TypeName”: “Config”, “Content”: “Coordinator,DataNode,Gtm”, “Interval”:“0”, “Count”:“1”}
]
}
```

内容添加好后，按下“`Esc`”键，然后输入“`:wq`”进行保存文件退出。

配置文件中

- 利用 TypeName 指定需要收集的信息类型；
- 利用 Content 指定每一类信息的具体内容；
- 利用 Count 指定此类信息收集的次数；
- 利用 Interval 指定收集间隔，单位为秒；
- TypeName 和 Content 不允许缺失或者内容为空；
- Interval 和 Count 可以不指定，如果没有指定 Count，则默认收集一次；
- 如果没有指定 Interval 则表示间隔为 0 秒，Interval 和 Count 的值不能小于 0；
- 如果不指定则使用默认的配置文件；
- 可以根据 gs_collector 内容收集对照表进行个性化定制配置；
- 配置文件格式采用 json 格式。

##### 步骤 2 确定数据库服务是否启动。

```
[omm@ecs-e1b3 ~]$ gs_om -t status;
cluster_state : Unavailable
redistributing : No
cluster_state : Normal 表示已启动，可以正常使用。如果状态为 Unavailable 表示不可用
```

为了实验继续进行，请先启动数据库服务。
启动数据库服务（如果数据库服务是正常状态，此步骤可以不执行）。

```
[omm@ecs-e1b3 ~]$ gs_om -t start;
Starting cluster.

=========================================
Successfully started.
```

##### 步骤 3 收集 OS 信息及日志信息。

begin-time、end-time 的值根据自己实际想收集的时间来设置。

```
[omm@ecs-e1b3 ~]$ gs_collector --begin-time=“20200720 23:00” --end-time=“20200729 20:00” -C /home/omm/collector.json
Successfully parsed the configuration file.
create Dir.
Successfully create dir.
do system check interval 0 : count 1
Collecting OS information.
Failed to collect OS information.
do database check interval 0 : count 1
Collecting catalog statistics.
Successfully collected catalog statistics.
do log check interval 0 : count 1
Collecting Log files.
Successfully collected Log files.
do Config check 0:1
Collecting Config files.
Successfully collected Config files.
Collecting files.
Successfully collected files.
All results are stored in /opt/huawei/wisequery/omm_mppdb/collector_20200727_094932.tar.gz.
```

收集完后，所有的结果存放在`/opt/huawei/wisequery/omm_mppdb/collector_20200727_094932.tar.gz` 包中，请注意自己生成的文件包名称，因为每次的文件包名不一样。

##### 步骤 4 查看日志信息。

先进入日志包所在的目录，然后将日志包进行解压。

```
[omm@ecs-e1b3 omm_mppdb]$ cd /opt/huawei/wisequery/omm_mppdb/
[omm@ecs-e1b3 omm_mppdb]$ ll
total 48K
-rw------- 1 omm dbgrp 46K Jul 27 09:49 collector_20200727_094932.tar.gz
[omm@ecs-e1b3 omm_mppdb]$ tar -zxvf collector_20200727_094932.tar.gz
collector_20200727_094932/
collector_20200727_094932/ecs-e1b3.tar.gz
collector_20200727_094932/Summary.log
collector_20200727_094932/Detail.log
```

接下来，进入解压后的文件夹 `collector_20200727_094932`，并对 `ecs-e1b3.tar.gz` 包进一步解压。

```
[omm@ecs-e1b3 omm_mppdb]$ cd collector_20200727_094932
[omm@ecs-e1b3 collector_20200727_094932]$ ll
total 24K
-rw-------. 1 omm dbgrp 16K Feb 7 15:16 db1.tar.gz
-rw-------. 1 omm dbgrp 2.7K Feb 7 15:16 Detail.log
-rw-------. 1 omm dbgrp 1.1K Feb 7 15:16 Summary.log
[omm@ecs-e1b3 collector_20200727_094932]$ tar -zxvf db1.tar.gz
ecs-e1b3/
ecs-e1b3/logfiles/
ecs-e1b3/logfiles/log_20200727_094935975042.tar.gz
ecs-e1b3/planSimulatorfiles/
ecs-e1b3/catalogfiles/
ecs-e1b3/catalogfiles/dn_6001_pg_thread_wait_status_20200727_094935303146.csv
ecs-e1b3/catalogfiles/gs_clean_20200727_094935470508.txt
…………………………
ecs-e1b3/systemfiles/
ecs-e1b3/systemfiles/OS_information_20200727_094933424734.txt
ecs-e1b3/systemfiles/database_system_info_20200727_094933446671.txt
[omm@ecs-e1b3 collector_20200727_094932]$
```

在解压的 db1（指的是服务器名，各自的不一样，请注意观察）下有各种定制收集的日志类型目录如下：

```
[omm@ecs-e1b3 collector_20200727_094932]$ cd db1
[omm@ecs-e1b3 ecs-e1b3]$ ll
total 32K
drwx------ 2 omm dbgrp 4.0K Jul 27 09:49 catalogfiles
drwx------ 2 omm dbgrp 4.0K Jul 27 09:49 configfiles
drwx------ 2 omm dbgrp 4.0K Jul 27 09:49 coreDumpfiles
drwx------ 2 omm dbgrp 4.0K Jul 27 09:49 gstackfiles
drwx------ 2 omm dbgrp 4.0K Jul 27 09:49 logfiles
drwx------ 2 omm dbgrp 4.0K Jul 27 09:49 planSimulatorfiles
drwx------ 2 omm dbgrp 4.0K Jul 27 09:49 systemfiles
drwx------ 2 omm dbgrp 4.0K Jul 27 09:49 xlogfiles
[omm@ecs-e1b3 ecs-e1b3]$ cd catalogfiles/
[omm@ecs-e1b3 catalogfiles]$ ll
total 16K
-rw------- 1 omm dbgrp 389 Jul 27 09:49 dn_6001_pg_locks_20200727_094934961507.csv
-rw------- 1 omm dbgrp 1.4K Jul 27 09:49 dn_6001_pg_stat_activity_20200727_094935134988.csv
-rw------- 1 omm dbgrp 878 Jul 27 09:49 dn_6001_pg_thread_wait_status_20200727_094935303146.csv
-rw------- 1 omm dbgrp 281 Jul 27 09:49 gs_clean_20200727_094935470508.txt
```

##### 步骤 5 下载收集后的日志文件。

根据自己需要比如可以通过 WinSCP 或者 XFTP 等 SSH 工具将日志文件下载至自己本地电脑。
使用 root 用户和密码登录数据库服务器（主机名为 ecs 的弹性公网 IP）：

- 点击“`打开目录/书签`”，输入目录路径“`/opt/huawei/wisequery/omm_mppdb/`”，点击确定后进入此目录：
- 逐层查找到“`catalogfiles`”文件夹，点击选中文件夹，然后点击“`下载`”，下载到 Windows 对应文件夹下：
- 查看下载后的文件夹内容：
- 图 4-1 日志文件下载

### 5 最大连接数设置

#### 5.1 实验介绍

##### 5.1.1 关于本实验

当应用程序与数据库的连接数超过最大值，则新的连接无法建立。建议对连接数进行监控，及时释放空闲的连接或者增加最大连接数。
本实验主要是讲如何来设置数据库最大连接个数。

##### 5.1.2 实验目的

掌握对数据库最大连接数的设置方法。

#### 5.2 场景设置及操作步骤

##### 步骤 1 用 ROOT 用户登录装有 openGauss 数据库服务的操作系统然后用 `su – omm` 命令切换至 OMM 用户环境，登录后信息如下。

```
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64
System information as of time: Mon Jul 27 11:22:46 CST 2020
System load: 0.03
Processes: 154
Memory used: 2.3%
Swap used: 0.0%
Usage On: 14%
IP address: 192.168.0.12
Users online: 3
[root@ecs-e1b3 ~]# su - omm
Last login: Mon Jul 27 09:23:44 CST 2020 on pts/0
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64
System information as of time: Mon Jul 27 11:23:37 CST 2020
System load: 0.01
Processes: 156
Memory used: 2.4%
Swap used: 0.0%
Usage On: 14%
IP address: 192.168.0.12
Users online: 3
```

##### 步骤 2 确认 openGauss 数据库服务是否启动

```
[omm@ecs-e1b3 ~]$ gs_om -t status;
cluster_name : dbCluster
cluster_state : Normal
redistributing : No
cluster_state : Normal 表示已启动，可以正常使用。如果状态为非 Normal 表示不可用
```

为了实验场景设置，如果数据库服务没有启动，请执行步 `gs_om -t start` 命令启动服务。

##### 步骤 3 登录数据库

使用 gsql 客户端以管理员用户身份连接 postgres 数据库，假设端口号为 26000。

```
[omm@ecs-e1b3 ~]$ gsql -d postgres -p 26000 -r
gsql ((openGauss 1.0.0 build 38a9312a) compiled at 2020-05-27 14:57:08 commit 472 last mr 549 )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type “help” for help.

postgres=#
```

##### 步骤 4 查看当前数据库已使用的连接数

```
postgres=# select count(1) from pg_stat_activity;
count 10
 (1 row)
```

10 表示当前有 10 个应用已连接到数据库

##### 步骤 5 查看数据库设置的最大连接数

```
postgres=# SHOW max_connections;
max_connections

 5000
(1 row)
```

5000 表示数据库设置的最大连接个数为 5000。如果当前数据库已使用的连接数快接近于最大连接数时，运维人员先要果断的增加最大连接数以防系统新的连接无法建立。

##### 步骤 6 调整最大连接数参数

参数修改方式一：

先 `\q` 退出数据库，然后在 omm 用户环境下通过 gs_guc 工具来增大参数值，如下：

```
[omm@ecs-e1b3 ~]$ gs_guc reload -I all -c “max_connections= 6000”;
expected instance path: [/gaussdb/data/db1/postgresql.conf]
gs_guc reload: max_connections=6000: [/gaussdb/data/db1/postgresql.conf]
server signaled
Total instances: 1. Failed instances: 0.
Success to perform gs_guc!
```

参数修改方式二：
也可以用 alter system set 语句来设置此参数，如下：

```
[omm@ecs-e1b3 ~]$ gsql -d postgres -p 26000 -r
gsql ((openGauss 1.0.0 build 38a9312a) compiled at 2020-05-27 14:57:08 commit 472 last mr 549 )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type “help” for help.

postgres=# alter system set max_connections=6000;
NOTICE:  please restart the database for the POSTMASTER level parameter to take effect.
ALTER SYSTEM SET
postgres=#\q
```

##### 步骤 7 重启数据库

`gs_om -t stop`先关闭数据库,然后用 `gs_om -t start` 再启动数据库

```
[omm@ecs-e1b3 ~]$ gs_om -t stop;
Stopping cluster.

 Successfully stopped cluster.
 End stop cluster.
[omm@ecs-e1b3 ~]$ gs_om -t start;
Starting cluster.
 =========================================
Successfully started.
```

##### 步骤 8 验证参数设置是否成功

使用 gsql 客户端以管理员用户身份连接 postgres 数据库，然后查看参数值。

```
[omm@ecs-e1b3 ~]$ gsql -d postgres -p 26000 -r
gsql ((openGauss 1.0.0 build 38a9312a) compiled at 2020-05-27 14:57:08 commit 472 last mr 549 )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type “help” for help.

 postgres=# SHOW max_connections;
max_connections
6000
(1 row)

```

这里显示 max_connections 为 6000，说明前面参数的修改已经生效。

##### 步骤 9 退出数据库

`postgres=#\q`
最大连接数设置实验结束。

### 6 例行表、索引的维护

#### 6.1 实验介绍

##### 6.1.1 关于本实验

为了保证数据库的有效运行，数据库必须在插入/删除操作后，基于客户场景，定期做 VACUUM FULL 和 ANALYZE，更新统计信息，以便获得更优的性能；

- VACUUM FULL 可回收已更新或已删除的数据所占据的磁盘空间，同时将小数据文件合并；
- VACUUM 对每个表维护了一个可视化映射来跟踪包含对别的活动事务可见的数组的页。一个普通的索引扫描首先通过可视化映射来获取对应的数组，来检查是否对当前事务可见。若无法获取，再通过堆数组抓取的方式来检查。因此更新表的可视化映射，可加速唯一索引扫描；
- ANALYZE 可收集与数据库中表内容相关的统计信息。统计结果存储在系统表 PG_STATISTIC 中。查询优化器会使用这些统计数据，生成最有效的执行计划。
- 数据库经过多次删除操作后，索引页面上的索引键将被删除，造成索引膨胀。例行重建索引，可有效的提高查询效率。

本实验主要是通过使用 VACUUM、VACUUM FULL FULL 来收缩表，用 ANALYZE 来收集表的统计信息以及对表上的索引进行重建。

##### 6.1.2 实验目的

掌握 VACUUM、VACUUM FULL FULL、ANALYZE 基本的使用及如何重建索引；

#### 6.2 场景设置及操作步骤

##### 步骤 1 用 ROOT 用户登录装有 openGauss 数据库服务的操作系统然后用 `su – omm` 命令切换至 OMM 用户环境，登录后信息如下。

```
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64
System information as of time: Tue Jul 27 16:21:11 CST 2020
System load: 0.01
Processes: 109
Memory used: 6.7%
Swap used: 0.0%
Usage On: 15%
IP address: 192.168.0.96
Users online: 1
[root@ecs-e1b3 ~]# su - omm
Last login: Fri Jul 27 16:22:11 CST 2020 on pts/0
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64
System information as of time: Tue Jul 27 16:21:11 CST 2020
System load: 0.01
Processes: 111
Memory used: 7.0%
Swap used: 0.0%
Usage On: 15%
IP address: 192.168.0.96
Users online: 1
[omm@ecs-e1b3 ~]$
```

##### 步骤 2 启动服务器后，然后使用 gsql 客户端以管理员用户身份连接 postgres 数据库，假设端口号为 26000。

启动数据库服务。

```
[omm@ecs-e1b3 ~]$ gs_om -t start;
Starting cluster.

=========================================
Successfully started.
```

连接 postgres 数据库。

```
[omm@ecs-e1b3 ~]$ gsql -d postgres -p 26000 -r
gsql ((openGauss 1.0.0 build 38a9312a) compiled at 2020-05-27 14:56:08 commit 472 last mr 549 )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type “help” for help.

postgres=#
```

##### 步骤 3 创建 student 表

```
postgres=# drop table student;
postgres=# CREATE TABLE student
( std_id INT NOT NULL,
std_name VARCHAR(20) NOT NULL,
std_sex VARCHAR(6),
std_birth DATE,
std_in DATE NOT NULL,
std_address VARCHAR(100)
);
```

CREATE TABLE

##### 步骤 4 表数据插入

```
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (1,‘张一’,‘男’,‘1993-01-01’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (2,‘张二’,‘男’,‘1993-01-02’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (3,‘张三’,‘男’,‘1993-01-03’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (4,‘张四’,‘男’,‘1993-01-04’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (5,‘张五’,‘男’,‘1993-01-05’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (6,‘张六’,‘男’,‘1993-01-06’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (7,‘张七’,‘男’,‘1993-01-07’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (8,‘张八’,‘男’,‘1993-01-08’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (9,‘张九’,‘男’,‘1993-01-09’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (10,‘李一’,‘男’,‘1993-01-10’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (11,‘李二’,‘男’,‘1993-01-11’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (12,‘李三’,‘男’,‘1993-01-12’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (13,‘李四’,‘男’,‘1993-01-13’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (14,‘李五’,‘男’,‘1993-01-14’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (15,‘李六’,‘男’,‘1993-01-15’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (16,‘李七’,‘男’,‘1993-01-16’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (17,‘李八’,‘男’,‘1993-01-17’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (18,‘李九’,‘男’,‘1993-01-18’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (19,‘王一’,‘男’,‘1993-01-19’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (20,‘王二’,‘男’,‘1993-01-20’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (21,‘王三’,‘男’,‘1993-01-21’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (22,‘王四’,‘男’,‘1993-01-22’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (23,‘王五’,‘男’,‘1993-01-23’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (24,‘王六’,‘男’,‘1993-01-24’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (25,‘王七’,‘男’,‘1993-01-25’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (26,‘王八’,‘男’,‘1993-01-26’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (27,‘王九’,‘男’,‘1993-01-27’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (28,‘钱一’,‘男’,‘1993-01-28’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (29,‘钱二’,‘男’,‘1993-01-29’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (30,‘钱三’,‘男’,‘1993-01-30’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (31,‘钱四’,‘男’,‘1993-02-01’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (32,‘钱五’,‘男’,‘1993-02-02’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (33,‘钱六’,‘男’,‘1993-02-03’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (34,‘钱七’,‘男’,‘1993-02-04’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (35,‘钱八’,‘男’,‘1993-02-05’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (36,‘钱九’,‘男’,‘1993-02-06’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (37,‘吴一’,‘男’,‘1993-02-07’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (38,‘吴二’,‘男’,‘1993-02-08’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (39,‘吴三’,‘男’,‘1993-02-09’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (40,‘吴四’,‘男’,‘1993-02-10’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (41,‘吴五’,‘男’,‘1993-02-11’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (42,‘吴六’,‘男’,‘1993-02-12’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (43,‘吴七’,‘男’,‘1993-02-13’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (44,‘吴八’,‘男’,‘1993-02-14’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (45,‘吴九’,‘男’,‘1993-02-15’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (46,‘柳一’,‘男’,‘1993-02-16’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (47,‘柳二’,‘男’,‘1993-02-17’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (48,‘柳三’,‘男’,‘1993-02-18’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (49,‘柳四’,‘男’,‘1993-02-19’,‘2011-09-01’,‘江苏省南京市雨花台区’);
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (50,‘柳五’,‘男’,‘1993-02-20’,‘2011-09-01’,‘江苏省南京市雨花台区’);
```

##### 步骤 5 数据查询统计

```
postgres=# select count(\*) from student;
count  50

 (1 row)
 postgres=# select * from student order by std_id;
std_id | std_name | std_sex |      std_birth      |       std_in        |     std_address
--------±---------±--------±--------------------±--------------------±---------------------
1 | 张一     | 男      | 1993-01-01 00:00:00 | 2011-09-01 00:00:00 | 江苏省南京市雨花台区
2 | 张二     | 男      | 1993-01-02 00:00:00 | 2011-09-01 00:00:00 | 江苏省南京市雨花台区
3 | 张三     | 男      | 1993-01-03 00:00:00 | 2011-09-01 00:00:00 | 江苏省南京市雨花台区
4 | 张四     | 男      | 1993-01-04 00:00:00 | 2011-09-01 00:00:00 | 江苏省南京市雨花台区
5 | 张五     | 男      | 1993-01-05 00:00:00 | 2011-09-01 00:00:00 | 江苏省南京市雨花台区
………………
```

##### 步骤 6 查看表信息

```
postgres=# \d student
Table “public.student”
Column | Type | Modifiers
-------------±-------------------------------±----------
std_id | integer | not null
std_name | character varying(20) | not null
std_sex | character varying(6) |
std_birth | timestamp(0) without time zone |
std_in | timestamp(0) without time zone | not null
std_address | character varying(100) |
```

##### 步骤 7 使用 VACUUM 命令，进行磁盘空间回收

```
postgres=# vacuum student;
VACUUM
```

##### 步骤 8 删除表中数据

```
postgres=# delete from student where std_id&gt;30;
DELETE 20
```

##### 步骤 9 使用 VACUUM FULL 命令，进行磁盘空间回收

```
postgres=# vacuum full student;
VACUUM
```

##### 步骤 10 使用 ANALYZE 语句更新统计信息

```
postgres=# analyze student;
ANALYZE
```

##### 步骤 11 使用 ANALYZE VERBOSE 语句更新统计信息，并输出表的相关信息

```
postgres=# analyze verbose student;
INFO: analyzing “public.student”(dn_6001 pid=37195)
INFO: ANALYZE INFO : “student”: scanned 1 of 1 pages, containing 30 live rows and 20 dead rows; 30 rows in sample, 30 estimated total rows(dn_6001 pid=37195)
ANALYZE
```

##### 步骤 12 执行 VACUUM ANALYZE 命令进行查询优化

```
postgres=# vacuum analyze student;
VACUUM
```

##### 步骤 13 查看特定表的统计信息

```
postgres=# select relname,n_tup_ins,n_tup_upd,n_tup_del,last_analyze,vacuum_count from PG_STAT_ALL_TABLES where relname=‘student’;
relname | n_tup_ins | n_tup_upd | n_tup_del | last_analyze | vacuum_count
---------±----------±----------±----------±-----------------------------±-------------
student | 50 | 0 | 20 | 2020-07-27 17:07:19.17167+08 | 3
(1 row)
postgres=#
PG_STAT_ALL_TABLES 视图将包含当前数据库中每个表的一行统计信息，以上查询结果中各列分别表示：
Relname 表名
n_tup_ins 插入行数
n_tup_upd 更新行数
n_tup_del 删除行数
last_analyze 上次手动分析该表的时间
vacuum_count 这个表被手动清理的次数
```

##### 步骤 14 索引维护

说明：

- 如果数据发生大量删除后，索引页面上的索引键将被删除，导致索引页面数量的减少，造成索引膨胀。重建索引可回收浪费的空间。
- 新建的索引中逻辑结构相邻的页面，通常在物理结构中也是相邻的，所以一个新建的索引比更新了多次的索引访问速度要快。
- 重建索引有以下两种方式：

1、使用 REINDEX 语句重建索引；
2、先删除索引（DROP INDEX），再创建索引（CREATE INDEX）。
先在 student 表的 std_name 列上创建一个索引，如下：

```
postgres=# create index inx_stu01 on student(std_name);
CREATE INDEX
postgres=#
```

方式 1：使用 REINDEX 语句重建索引，具体如下：

```
postgres=# reindex table student;
REINDEX
postgres=#
```

方式 2：先删除索引（DROP INDEX），再创建索引（CREATE INDEX），具体如下：

```
postgres=# drop index inx_stu01;
DROP INDEX
postgres=# create index inx_stu01 on student(std_name);
CREATE INDEX
postgres=#
```

查看表结构信息，具体如下：

```
postgres=# \d student;
Table “public.student”
Column | Type | Modifiers
-------------±-------------------------------±----------
std_id | integer | not null
std_name | character varying(20) | not null
std_sex | character varying(6) |
std_birth | timestamp(0) without time zone |
std_in | timestamp(0) without time zone | not null
std_address | character varying(100) |
Indexes:
“inx_stu01” btree (std_name) TABLESPACE pg_default
```

##### 步骤 15 退出数据库

```
postgres=#\q
```

例行表、索引的维护实验结束。

实验结果：
截图一：操作系参数检查截图

<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-94212ef2-85e6-4e4c-8114-62b60aa8a00d.png" alt="图片1.png" />

<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-cd3b1b2a-46b5-44d3-83ed-42e8e6b1c3fd.png" alt="图片2.png" />

截图二：设置最大连接数

<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-84bb372d-e900-4137-926b-6ec3fe6bd279.png" alt="图片3.png" />

<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-e03e3a3d-1a57-4ac5-9e80-4b0449e41719.png" alt="图片4.png" />

截图三：

<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-4c443d78-a102-4d12-887a-6ee5223f6cf1.png" alt="图片5.png" />

---

分析总结：

本次实验我掌握了系统参数检查、openGauss 健康状态检查、数据库性能检查、日志检查和清理等操作。实验比较简单，没有遇到什么问题。
