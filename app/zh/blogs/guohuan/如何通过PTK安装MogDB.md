---
title: '如何通过PTK安装MogDB'

date: '2022-07-08'

category: 'blog'
tags: ['MogDB']

archives: '2022-07'

author: '云和恩墨-郭欢'

summary: '如何通过PTK安装MogDB'

img: '/zh/blogs/guohuan/title/img.png'

times: '10:20'
---

# 如何通过 PTK 安装 MogDB

PTK (Provisioning Toolkit)是一款针对 MogDB 数据库开发的软件安装和运维工具，旨在帮助用户更便捷地安装部署 MogDB 数据库。

以下操作记录通过 PTK 安装 MogDB 的流程、遇到的问题以及解决办法。

操作系统：CentOS 7.6

机器架构：x86

```shell
# 下载PTK
[gh@localhost ~]$ curl --proto '=https' --tlsv1.2 -sSf https://cdn-mogdb.enmotech.com/ptk/install.sh | sh
Downloading ptk package...
Detected shell: bash
Shell profile: /home/gh/.bash_profile
ptk has been added to PATH in /home/gh/.bash_profile
open a new terminal or source /home/gh/.bash_profile to active it
Installed path: /home/gh/.ptk/bin/ptk
# 执行source命令使PTK PATH环境变量生效
[gh@localhost ~] source /home/gh/.bashprofile
# 生成配置文件
[gh@localhost ] ptk template --local > config.yaml
# 安装MogDB
[gh@localhost ~]$ ptk install -f config.yaml
INFO[2022-07-08T10:02:58.843] 未指定安装包路径，默认使用在线包: https://cdn-mogdb.enmotech.com/mogdb-media/3.0.0/MogDB-3.0.0-CentOS-x86_64.tar.gz
INFO[2022-07-08T10:02:58.843] 正在下载安装包...

download MogDB-3.0.0-CentOS...: 132.71 MiB / 132.71 MiB [-----------------------------------------] 100.00% 2.46 MiB p/s 54s
INFO[2022-07-08T10:03:54.008] 安装包下载成功
WARN[2022-07-08T10:03:54.571] vendor does not provide sha256 file for MogDB-3.0.0-CentOS-64bit-tools, skip validate
WARN[2022-07-08T10:03:54.814] vendor does not provide sha256 file for MogDB-3.0.0-CentOS-64bit-Libpq, skip validate
INFO[2022-07-08T10:03:54.828] the installation package files are safe
INFO[2022-07-08T10:03:54.828] parse version.cfg from MogDB-3.0.0-CentOS-64bit.tar.gz

INFO[2022-07-08T10:03:56.579] detected db version: MogDB-3.0.0, number: 92.605, commit_id: 62408a0f
=============================

global:
cluster_name: cluster_XjnqLF
user: omm
group: omm
app_dir: /opt/mogdb/app
data_dir: /opt/mogdb/data
log_dir: /opt/mogdb/log
tool_dir: /opt/mogdb/tool
tmp_dir: /opt/mogdb/tmp
db_servers:

host: 172.17.172.162
db_port: 26000
role: primary
az_name: AZ1

az_priority: 1
=============================

请确认集群拓扑配置是否正确?Y|Yes y
请输入数据库初始密码(需8到16位)
请再次输入数据库初始密码:
WARN[2022-07-08T10:04:17.740] the number of instances is less than 3, CM will not be installed
INFO[2022-07-08T10:04:17.740] start check operating system
INFO[2022-07-08T10:04:17.740] local ip: 172.17.172.162
[host 172.17.172.162]: not found package: numactl
Please installed the above missing packages first before do other operations
[PTK-4010] the system does not meet installation requirements
# 安装numactl
[gh@localhost ~]$ sudo yum install numactl -y
已加载插件：fastestmirror, langpacks
Loading mirror speeds from cached hostfile

base: mirrors.aliyun.com
extras: mirrors.aliyun.com
updates: mirrors.aliyun.com
正在解决依赖关系
--> 正在检查事务
---> 软件包 numactl.x86_64.0.2.0.12-5.el7 将被 安装
--> 解决依赖关系完成
依赖关系解决

==============================================================================================================================
Package 架构 版本 源 大小
正在安装:
numactl x86_64 2.0.12-5.el7 base 66 k

事务概要
安装 1 软件包

总下载量：66 k
安装大小：141 k
Downloading packages:
numactl-2.0.12-5.el7.x86_64.rpm | 66 kB 00:00:00
Running transaction check
Running transaction test
Transaction test succeeded
Running transaction
正在安装 : numactl-2.0.12-5.el7.x86_64 1/1
验证中 : numactl-2.0.12-5.el7.x86_64 1/1

已安装:
numactl.x86_64 0:2.0.12-5.el7

完毕！
# 进行系统检查，检查结果全部为OK或warning可继续执行安装
[gh@localhost ~]$ ptk checkos -f config.yaml
INFO[2022-07-08T10:14:10.019] local ip: 172.17.172.162
INFO[2022-07-08T10:14:15.643] platform: centos_7_64bit host=172.17.172.162
INFO[2022-07-08T10:14:15.655] kernel version: 3.10.0-957.el7.x86_64 host=172.17.172.162
INFO[2022-07-08T10:14:15.679] locale: LANG=zh_CN.UTF-8 host=172.17.172.162
INFO[2022-07-08T10:14:15.693] timezone: +0800 host=172.17.172.162
INFO[2022-07-08T10:14:15.708] swap memory 2097148kB, total memory 7645940kB host=172.17.172.162
WARN[2022-07-08T10:14:15.875] net.ipv4.tcp_retries1=3, expect 5 host=172.17.172.162
WARN[2022-07-08T10:14:16.015] net.ipv4.tcp_syn_retries=6, expect 5 host=172.17.172.162
WARN[2022-07-08T10:14:16.148] device(/dev/sda) readahead value=8192, expect 16384. host=172.17.172.162
WARN[2022-07-08T10:14:16.234] device(dm-0) 'IO Request'=128, expect 512 host=172.17.172.162
WARN[2022-07-08T10:14:16.234] device(dm-1) 'IO Request'=128, expect 512 host=172.17.172.162
WARN[2022-07-08T10:14:16.234] device(dm-2) 'IO Request'=128, expect 512 host=172.17.172.162
WARN[2022-07-08T10:14:16.234] device(sda) 'IO Request'=32768, expect 512 host=172.17.172.162
WARN[2022-07-08T10:14:16.234] device(sr0) 'IO Request'=32768, expect 512 host=172.17.172.162
INFO[2022-07-08T10:14:21.945] write fix os script to root_fix_os.2022.0708.101421.sh successfully
INFO[2022-07-08T10:14:21.945] all checkers finished

Check Results
            Item                |  Level
------------------------------------+----------
A1.Check_OS_Version | OK
A2.Check_Kernel_Version | OK
A3.Check_Unicode | OK
A4.Check_TimeZone | OK
A5.Check_Swap_Memory_Configure | OK
A6.Check_SysCtl_Parameter | Warning
A7.Check_FileSystem_Configure | OK
A8.Check_Disk_Configure | OK
A9.Check_BlockDev_Configure | Warning
A9.Check_Logical_Block | OK
A10.Check_IO_Request | Warning
A10.Check_Asynchronous_IO_Request | OK
A10.Check_IO_Configure | OK
A11.Check_Network_Configure | OK
A12.Check_Time_Consistency | OK
A13.Check_Firewall_Service | OK
A14.Check_THP_Service | OK
A15.Check_Dependent_Package | Warning
A16.Check_CPU_Instruction_Set | OK
Total count 19, abnormal count 0, warning count 4
# 安装MogDB
[gh@localhost ~]$ ptk install -f config.yaml
INFO[2022-07-08T10:14:55.282] 未指定安装包路径，默认使用在线包: https://cdn-mogdb.enmotech.com/mogdb-media/3.0.0/MogDB-3.0.0-CentOS-x86_64.tar.gz
INFO[2022-07-08T10:14:55.282] 使用缓存 /home/gh/.ptk/cache/MogDB-3.0.0-CentOS-x86_64.tar.gz
WARN[2022-07-08T10:14:55.807] vendor does not provide sha256 file for MogDB-3.0.0-CentOS-64bit-Libpq, skip validate
WARN[2022-07-08T10:14:55.856] vendor does not provide sha256 file for MogDB-3.0.0-CentOS-64bit-tools, skip validate
INFO[2022-07-08T10:14:56.098] the installation package files are safe
INFO[2022-07-08T10:14:56.099] parse version.cfg from MogDB-3.0.0-CentOS-64bit.tar.gz
INFO[2022-07-08T10:14:57.861] detected db version: MogDB-3.0.0, number: 92.605, commit_id: 62408a0f
global:
cluster_name: cluster_XjnqLF
user: omm
group: omm
app_dir: /opt/mogdb/app
data_dir: /opt/mogdb/data
log_dir: /opt/mogdb/log
tool_dir: /opt/mogdb/tool
tmp_dir: /opt/mogdb/tmp
db_servers:

host: 172.17.172.162
db_port: 26000
role: primary
az_name: AZ1

az_priority: 1
=============================

请确认集群拓扑配置是否正确?Y|Yes y
请输入数据库初始密码(需8到16位)
请再次输入数据库初始密码:
WARN[2022-07-08T10:15:08.585] the number of instances is less than 3, CM will not be installed
INFO[2022-07-08T10:15:08.585] start check operating system
INFO[2022-07-08T10:15:08.585] local ip: 172.17.172.162
INFO[2022-07-08T10:15:14.149] platform: centos_7_64bit host=172.17.172.162
INFO[2022-07-08T10:15:14.161] kernel version: 3.10.0-957.el7.x86_64 host=172.17.172.162
INFO[2022-07-08T10:15:14.185] locale: LANG=zh_CN.UTF-8 host=172.17.172.162
INFO[2022-07-08T10:15:14.199] timezone: +0800 host=172.17.172.162
INFO[2022-07-08T10:15:14.215] swap memory 2097148kB, total memory 7645940kB host=172.17.172.162
WARN[2022-07-08T10:15:14.519] net.ipv4.tcp_syn_retries=6, expect 5 host=172.17.172.162
WARN[2022-07-08T10:15:14.557] net.ipv4.tcp_retries1=3, expect 5 host=172.17.172.162
WARN[2022-07-08T10:15:14.651] device(/dev/sda) readahead value=8192, expect 16384. host=172.17.172.162
WARN[2022-07-08T10:15:14.739] device(dm-1) 'IO Request'=128, expect 512 host=172.17.172.162
WARN[2022-07-08T10:15:14.739] device(dm-2) 'IO Request'=128, expect 512 host=172.17.172.162
WARN[2022-07-08T10:15:14.739] device(sda) 'IO Request'=32768, expect 512 host=172.17.172.162
WARN[2022-07-08T10:15:14.739] device(sr0) 'IO Request'=32768, expect 512 host=172.17.172.162
WARN[2022-07-08T10:15:14.739] device(dm-0) 'IO Request'=128, expect 512 host=172.17.172.162
INFO[2022-07-08T10:15:20.436] [stage=precheck]: start host=172.17.172.162
INFO[2022-07-08T10:15:20.436] check core pattern value host=172.17.172.162
ERRO[2022-07-08T10:15:20.465] [stage=precheck]: failed, err: [PTK-508003] bad sysctl config 'kernel.core_pattern', because 不允许连接 'abrt-hook-ccpp' 字符串 host=172.17.172.162
cluste_name | host | user | port | stage | status | message
-----------------+----------------+------+-------+----------+-----------------+---------------------------------------------------------------------------------------------------
cluster_XjnqLF | 172.17.172.162 | omm | 26000 | precheck | precheck_failed | [PTK-508003] bad sysctl config 'kernel.core_pattern', because 不允许连接 'abrt-hook-ccpp' 字符串
precheck failed
# 遇到以上报错的原因如下：使用 abrt 服务代理coredump 文件，有可能导致数据库core文件丢失或者数据库宕机的风险。所以在 PTK 里面都是禁止开启的。可通过修改 kernel.core_pattern 参数修复。
[gh@localhost ~] sudo sysctl −w kernel.corepattern=/var/log/coredump/kernel.corepattern=/var/log/coredump/
# 继续执行安装
[gh@localhost ] ptk install -f config.yaml
INFO[2022-07-08T10:34:07.376] 未指定安装包路径，默认使用在线包: https://cdn-mogdb.enmotech.com/mogdb-media/3.0.0/MogDB-3.0.0-CentOS-x86_64.tar.gz
INFO[2022-07-08T10:34:07.376] 使用缓存 /home/gh/.ptk/cache/MogDB-3.0.0-CentOS-x86_64.tar.gz
WARN[2022-07-08T10:34:07.930] vendor does not provide sha256 file for MogDB-3.0.0-CentOS-64bit-tools, skip validate
WARN[2022-07-08T10:34:08.176] vendor does not provide sha256 file for MogDB-3.0.0-CentOS-64bit-Libpq, skip validate
INFO[2022-07-08T10:34:08.191] the installation package files are safe
INFO[2022-07-08T10:34:08.191] parse version.cfg from MogDB-3.0.0-CentOS-64bit.tar.gz
INFO[2022-07-08T10:34:09.945] detected db version: MogDB-3.0.0, number: 92.605, commit_id: 62408a0f
global:
cluster_name: cluster_XjnqLF
user: omm
group: omm
app_dir: /opt/mogdb/app
data_dir: /opt/mogdb/data
log_dir: /opt/mogdb/log
tool_dir: /opt/mogdb/tool
tmp_dir: /opt/mogdb/tmp
db_servers:

host: 172.17.172.162
db_port: 26000
role: primary
az_name: AZ1

az_priority: 1
=============================

请确认集群拓扑配置是否正确?Y|Yes y
请输入数据库初始密码(需8到16位)
请再次输入数据库初始密码:
WARN[2022-07-08T10:34:17.780] the number of instances is less than 3, CM will not be installed
INFO[2022-07-08T10:34:17.780] start check operating system
INFO[2022-07-08T10:34:17.780] local ip: 172.17.172.162
INFO[2022-07-08T10:34:23.354] platform: centos_7_64bit host=172.17.172.162
INFO[2022-07-08T10:34:23.368] kernel version: 3.10.0-957.el7.x86_64 host=172.17.172.162
INFO[2022-07-08T10:34:23.393] locale: LANG=zh_CN.UTF-8 host=172.17.172.162
INFO[2022-07-08T10:34:23.407] timezone: +0800 host=172.17.172.162
INFO[2022-07-08T10:34:23.422] swap memory 2097148kB, total memory 7645940kB host=172.17.172.162
WARN[2022-07-08T10:34:23.628] net.ipv4.tcp_retries1=3, expect 5 host=172.17.172.162
WARN[2022-07-08T10:34:23.667] net.ipv4.tcp_syn_retries=6, expect 5 host=172.17.172.162
WARN[2022-07-08T10:34:23.865] device(/dev/sda) readahead value=8192, expect 16384. host=172.17.172.162
WARN[2022-07-08T10:34:23.956] device(sda) 'IO Request'=32768, expect 512 host=172.17.172.162
WARN[2022-07-08T10:34:23.956] device(sr0) 'IO Request'=32768, expect 512 host=172.17.172.162
WARN[2022-07-08T10:34:23.956] device(dm-0) 'IO Request'=128, expect 512 host=172.17.172.162
WARN[2022-07-08T10:34:23.956] device(dm-1) 'IO Request'=128, expect 512 host=172.17.172.162
WARN[2022-07-08T10:34:23.956] device(dm-2) 'IO Request'=128, expect 512 host=172.17.172.162
INFO[2022-07-08T10:34:29.684] [stage=precheck]: start host=172.17.172.162
INFO[2022-07-08T10:34:29.684] check core pattern value host=172.17.172.162
INFO[2022-07-08T10:34:29.709] check RemoveIPC value host=172.17.172.162
INFO[2022-07-08T10:34:29.724] check user 'omm' host=172.17.172.162
ERRO[2022-07-08T10:34:29.738] [stage=precheck]: failed, err: [PTK-50301] user omm already exist host=172.17.172.162
cluste_name | host | user | port | stage | status | message
-----------------+----------------+------+-------+----------+-----------------+-------------------------------------
cluster_XjnqLF | 172.17.172.162 | omm | 26000 | precheck | precheck_failed | [PTK-50301] user omm already exist
precheck failed
# 此时报错提示omm用户已存在，修改配置文件，将用户改为omm1即可
[gh@localhost ~] vim config.yaml
# 再次安装
[gh@localhost ] ptk install -f config.yaml
INFO[2022-07-08T10:36:29.630] 未指定安装包路径，默认使用在线包: https://cdn-mogdb.enmotech.com/mogdb-media/3.0.0/MogDB-3.0.0-CentOS-x86_64.tar.gz
INFO[2022-07-08T10:36:29.630] 使用缓存 /home/gh/.ptk/cache/MogDB-3.0.0-CentOS-x86_64.tar.gz
WARN[2022-07-08T10:36:30.413] vendor does not provide sha256 file for MogDB-3.0.0-CentOS-64bit-Libpq, skip validate
WARN[2022-07-08T10:36:30.462] vendor does not provide sha256 file for MogDB-3.0.0-CentOS-64bit-tools, skip validate
INFO[2022-07-08T10:36:30.462] the installation package files are safe
INFO[2022-07-08T10:36:30.462] parse version.cfg from MogDB-3.0.0-CentOS-64bit.tar.gz
INFO[2022-07-08T10:36:32.190] detected db version: MogDB-3.0.0, number: 92.605, commit_id: 62408a0f
global:
cluster_name: cluster_XjnqLF
user: omm1
group: omm
app_dir: /opt/mogdb/app
data_dir: /opt/mogdb/data
log_dir: /opt/mogdb/log
tool_dir: /opt/mogdb/tool
tmp_dir: /opt/mogdb/tmp
db_servers:

host: 172.17.172.162
db_port: 26000
role: primary
az_name: AZ1

az_priority: 1
=============================

请确认集群拓扑配置是否正确?Y|Yes y
请输入数据库初始密码(需8到16位)
请再次输入数据库初始密码:
WARN[2022-07-08T10:36:40.125] the number of instances is less than 3, CM will not be installed
INFO[2022-07-08T10:36:40.125] start check operating system
INFO[2022-07-08T10:36:40.125] local ip: 172.17.172.162
INFO[2022-07-08T10:36:45.623] platform: centos_7_64bit host=172.17.172.162
INFO[2022-07-08T10:36:45.636] kernel version: 3.10.0-957.el7.x86_64 host=172.17.172.162
INFO[2022-07-08T10:36:45.658] locale: LANG=zh_CN.UTF-8 host=172.17.172.162
INFO[2022-07-08T10:36:45.672] timezone: +0800 host=172.17.172.162
INFO[2022-07-08T10:36:45.685] swap memory 2097148kB, total memory 7645940kB host=172.17.172.162
WARN[2022-07-08T10:36:45.938] net.ipv4.tcp_syn_retries=6, expect 5 host=172.17.172.162
WARN[2022-07-08T10:36:45.992] net.ipv4.tcp_retries1=3, expect 5 host=172.17.172.162
WARN[2022-07-08T10:36:46.124] device(/dev/sda) readahead value=8192, expect 16384. host=172.17.172.162
WARN[2022-07-08T10:36:46.213] device(dm-2) 'IO Request'=128, expect 512 host=172.17.172.162
WARN[2022-07-08T10:36:46.213] device(sda) 'IO Request'=32768, expect 512 host=172.17.172.162
WARN[2022-07-08T10:36:46.213] device(sr0) 'IO Request'=32768, expect 512 host=172.17.172.162
WARN[2022-07-08T10:36:46.213] device(dm-0) 'IO Request'=128, expect 512 host=172.17.172.162
WARN[2022-07-08T10:36:46.213] device(dm-1) 'IO Request'=128, expect 512 host=172.17.172.162
INFO[2022-07-08T10:36:51.906] [stage=precheck]: start host=172.17.172.162
INFO[2022-07-08T10:36:51.906] check core pattern value host=172.17.172.162
INFO[2022-07-08T10:36:51.932] check RemoveIPC value host=172.17.172.162
INFO[2022-07-08T10:36:51.945] check user 'omm1' host=172.17.172.162
INFO[2022-07-08T10:36:51.960] check port 26000 host=172.17.172.162
INFO[2022-07-08T10:36:52.081] port 26000 is free host=172.17.172.162
INFO[2022-07-08T10:36:52.081] [stage=precheck]: successful host=172.17.172.162
INFO[2022-07-08T10:36:52.081] scp file from /home/gh/.ptk/cache/MogDB-3.0.0-CentOS-x86_64.tar.gz to 172.17.172.162:/tmp/MogDB-3.0.0-CentOS-x86_64.tar.gz host=172.17.172.162
INFO[2022-07-08T10:36:52.145] [stage=initial]: start host=172.17.172.162
INFO[2022-07-08T10:36:52.161] create os user omm1, group omm host=172.17.172.162
INFO[2022-07-08T10:36:52.215] set ulimits host=172.17.172.162
INFO[2022-07-08T10:36:52.227] set user omm1 profiles host=172.17.172.162
INFO[2022-07-08T10:36:52.301] add c library /usr/local/lib to /etc/ld.so.conf.d/libc.conf host=172.17.172.162
INFO[2022-07-08T10:36:52.315] mkdir /opt/mogdb/tool host=172.17.172.162
INFO[2022-07-08T10:36:52.397] decompress MogDB-3.0.0-CentOS-x86_64.tar.gz to dir /opt/mogdb/tool host=172.17.172.162
INFO[2022-07-08T10:36:53.148] remove files /tmp/MogDB-3.0.0-CentOS-x86_64.tar.gz host=172.17.172.162
INFO[2022-07-08T10:36:53.176] decompress *-om.tar.gz to dir /opt/mogdb/tool host=172.17.172.162
INFO[2022-07-08T10:36:53.484] fix psutil lib host=172.17.172.162
INFO[2022-07-08T10:36:53.514] change /opt/mogdb/tool owner to omm1 host=172.17.172.162
INFO[2022-07-08T10:36:53.530] mkdir /opt/mogdb/app host=172.17.172.162
INFO[2022-07-08T10:36:53.608] decompress MogDB-3.0.0-CentOS-64bit.tar.gz to dir /opt/mogdb/app host=172.17.172.162
INFO[2022-07-08T10:36:55.616] fix dynamic library host=172.17.172.162
INFO[2022-07-08T10:36:55.629] change /opt/mogdb/app owner to omm1 host=172.17.172.162
INFO[2022-07-08T10:36:55.645] mkdir /opt/mogdb/log/gs_profile,/opt/mogdb/log/pg_log,/opt/mogdb/log/pg_audit,/opt/mogdb/log/bin,/opt/mogdb/log/pg_log/dn_6001,/opt/mogdb/log/pg_audit/dn_6001 host=172.17.172.162
INFO[2022-07-08T10:36:56.345] mkdir /opt/mogdb/tmp host=172.17.172.162
INFO[2022-07-08T10:36:56.426] save version to /opt/mogdb/app/bin/upgrade_version host=172.17.172.162
INFO[2022-07-08T10:36:56.461] create cluster_manual_start file host=172.17.172.162
INFO[2022-07-08T10:36:56.493] generate static config to /opt/mogdb/app/bin/cluster_static_config host=172.17.172.162
INFO[2022-07-08T10:36:56.522] change /opt/mogdb/app/bin/cluster_static_config owner to omm1 host=172.17.172.162
INFO[2022-07-08T10:36:56.535] mkdir /opt/mogdb/data host=172.17.172.162
INFO[2022-07-08T10:36:56.613] change /opt/mogdb/data owner to omm1 host=172.17.172.162
INFO[2022-07-08T10:36:56.627] initial database host=172.17.172.162
INFO[2022-07-08T10:37:06.343] set 172.17.172.162 postgresql.conf host=172.17.172.162
INFO[2022-07-08T10:37:06.405] set 172.17.172.162 hba config host=172.17.172.162
INFO[2022-07-08T10:37:06.447] [stage=initial]: successful host=172.17.172.162
INFO[2022-07-08T10:37:06.448] [stage=launch]: start host=172.17.172.162
INFO[2022-07-08T10:37:06.448] start 172.17.172.162 database by gs_ctl host=172.17.172.162
INFO[2022-07-08T10:37:07.542] alter initial user password host=172.17.172.162
INFO[2022-07-08T10:37:07.600] [stage=launch]: successful host=172.17.172.162
cluste_name | host | user | port | stage | status | message
-----------------+----------------+------+-------+--------+---------------+----------
cluster_XjnqLF | 172.17.172.162 | omm1 | 26000 | launch | start_success | success
# 安装成功
[gh@localhost ~]su root
密码：
[root@localhost gh]# su - omm1
上一次登录：五 7月  8 10:37:07 CST 2022
最后一次失败的登录：五 7月  8 10:45:53 CST 2022pts/0 上
最有一次成功登录后有 12 次失败的登录尝试。
[omm1@localhost ~] gsql -d postgres -p 26000
gsql ((MogDB 3.0.0 build 62408a0f) compiled at 2022-06-30 14:21:11 commit 0 last mr )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

MogDB=#
```
