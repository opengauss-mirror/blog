---
title: 'CentOS7.3安装openGauss1.0.1主备'

date: '2021-01-29'

category: 'blog'
tags: ['openGauss主备安装']

archives: '2021-01'

author: '13J43QKKKAA'

summary: 'CentOS7.3安装openGauss1.0.1主备'

img: '/zh/blogs/13J43QKKKAA/title/img19.png'

times: '15:30'
---

# CentOS7.3 安装 openGauss1.0.1 主备<a name="ZH-CN_TOPIC_0000001116618871"></a>

**1.硬件环境（最低配置）**

用于安装 openGauss 的硬盘需最少满足如下要求：

至少 1GB 用于安装 openGauss 的应用程包。

每个主机需大约 300MB 用于元数据存储。

预留 70%以上的磁盘剩余空间用于数据存储。

CPU：功能调试最小 1×8 核 2.0GHz。

内存：2G

网络：300 兆以上以太网。

**2.软件环境（两台机器都要做）**

python3.7 的版本下载

```
wget https://www.python.org/ftp/python/3.7.1/Python-3.7.1.tgz
tar -zxvf Python-3.7.1.tgz
mkdir /usr/local/python3
cd Python-3.7.1
./configure --prefix=/usr/local/python3
make && make install
ln -s /usr/local/python3/bin/python3.7 /usr/bin/python3
ln -s /usr/local/python3/bin/pip3.7 /usr/bin/pip3
```

检查软件依赖的包

```
rpm -qa libaio-devel flex bison ncurses-devel glibc-devel patch lsb_release readline-devel
```

安装软件依赖包

```
yum install libaio-devel flex bison ncurses-devel glibc-devel patch lsb_release readline-devel
```

**3.操作系统相关设置（两台机器都要做）**

1）操作系统参数设置

```
##添加如下参数：
cat>>/etc/sysctl.conf <<EOF
net.ipv4.tcp_fin_timeout=60
net.ipv4.tcp_retries1=5
net.ipv4.tcp_syn_retries=5
net.sctp.path_max_retrans=10
net.sctp.max_init_retransmits=10
EOF
sysctl -p
```

2）关闭透明大页（transparent_hugepage）设置

```
cat >> /etc/rc.d/rc.local<<EOF
if test -f /sys/kernel/mm/transparent_hugepage/enabled;
then
echo never > /sys/kernel/mm/transparent_hugepage/enabled
fi
if test -f /sys/kernel/mm/transparent_hugepage/defrag;
then
echo never > /sys/kernel/mm/transparent_hugepage/defrag
fi
EOF
#查看是否关闭
cat /sys/kernel/mm/transparent_hugepage/enabled
cat /sys/kernel/mm/transparent_hugepage/defrag
```

3）关闭防火墙及 SELINUX

```
systemctl status firewalld
systemctl disable firewalld.service
systemctl stop firewalld.service
```

4）修改/etc/selinux/config 文件中的“SELINUX”值为“disabled”

```
cat /etc/selinux/config | grep disabled
```

5）修改字符集

```
cat>> /etc/profile<<EOF
export LANG=en_US.UTF-8
EOF
```

\#检查

```
cat /etc/profile | grep LANG
```

6）关闭 swap 交换内存

```
swapoff -a（重启失效）
```

**4.安装规划主机名**

ip 端口

Gauss1 192.168.134.145 26000

Gauss2 192.168.134.146 26000

**5.用户名和密码**

执行 gs_install 会创建和数据库一样的用户

**6.软件安装（主库执行就行，从库会自动更新）**

mkdir -p /opt/software/openGausschmod 755 -R /opt/softwaretar -zxvf openGauss-Package-bak_0bd0ce80.tar.gz

生成配置文件 clusterconfig.xml

执行安装预检测 export LD_LIBRARY_PATH=/opt/software/openGauss/script/gspylib/clib:$LD_LIBRARY_PATH root

用户执行 python3 /opt/software/openGauss/script/gs_preinstall -U omm -G dbgrp -X /opt/software/openGauss/clusterconfig.xml Successfully set finish flag. Preinstallation succeeded.

执行数据库安装 omm 用户执行。

cd /opt/software/openGauss/script chmod -R 755 /opt/software/openGauss/script chown -R omm:dbgrp /opt/software/openGauss/script gs_install -X /opt/software/openGauss/clusterconfig.xml

Successfully started cluster.Successfully installed application.end deploy…安装成功。

**6.查看数据库进程和修改密码**

```
ps -ef | grep gaussdb
gsql -d postgres -p 26000
ALTER ROLE omm IDENTIFIED BY ‘newpasswd’ REPLACE ‘oldpasswd’;
```

**7.数据库启动和停止，数据库状态查看**

```
[omm@Gauss1 ~]$ gs_om -t status --detail[ Cluster State ]
cluster_state : Normalredistributing : Nocurrent_az : AZ_ALL
[ Datanode State ]
node node_ip instance state | node node_ip instance state
1 Gauss1 192.168.134.145 6001 /opt/huawei/install/opt/db1 P Primary Normal | 2 Gauss2 192.168.134.139 6002 /opt/huawei/install/opt/db1 S Standby Normal
gs_om -t start -启动
gs_om -t stop -停止
```

**8.数据库卸载**

```
gs_uninstall --delete-data
```

**9.复制链接配置检查**

```
postgres=# show replconninfo1;replconninfo1
localhost=192.168.134.145 localport=26001 localheartbeatport=26005 localservice=26004
remotehost=192.168.134.139 remotep(1 row)
```

**10.检查日志传送线程状态**

```
postgres=# \pset expanded
Expanded display is on.
postgres=# select * from pg_stat_get_wal_senders();
-[ RECORD 1 ]--------------±---------------------------------------------
pid | 140107453511424
sender_pid | 52184
local_role | Primary
peer_role | Standby
peer_state | Normal
state | Streaming
catchup_start | 2021-01-06 23:17:41.647524-05
catchup_end | 2021-01-06 23:17:41.653131-05
sender_sent_location | 0/30262D0
sender_write_location | 0/30262D0
sender_flush_location | 0/30262D0
sender_replay_location | 0/30262D0
receiver_received_location | 0/30262D0
receiver_write_location | 0/30262D0
receiver_flush_location | 0/30262D0
receiver_replay_location | 0/30262D0
sync_percent | 100%
sync_state | Async
sync_priority | 0
sync_most_available | Off
channel | 192.168.134.145:26001–>192.168.134.139:49386
```

**11.查看日志接收线程**

```
postgres=# \pset x
Expanded display is on.
postgres=# select * from pg_stat_get_wal_receiver();
-[ RECORD 1 ]--------------±---------------------------------------------
receiver_pid | 23823
local_role | Standby
peer_role | Primary
peer_state | Normal
state | Normal
sender_sent_location | 0/F026470
sender_write_location | 0/F026470
sender_flush_location | 0/F026470
sender_replay_location | 0/F026470
receiver_received_location | 0/F026470
receiver_write_location | 0/F026470
receiver_flush_location | 0/F026470
receiver_replay_location | 0/F026470
sync_percent | 100%
channel | 192.168.134.139:49480<–192.168.134.145:26001
```
