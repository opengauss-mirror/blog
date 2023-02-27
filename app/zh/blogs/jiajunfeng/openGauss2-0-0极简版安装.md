---
title: 'openGauss2.0.0极简版安装'

date: '2021-04-01'

category: 'blog'
tags: ['openGauss安装部署']

archives: '2021-04'

author: '贾军锋'

summary: 'openGauss2.0.0极简版安装'

img: '/zh/blogs/jiajunfeng/title/img4.png'

times: '15:30'
---

# openGauss2.0.0 极简版安装<a name="ZH-CN_TOPIC_0000001095662012"></a>

openGauss 的安装在官方文档的描述中，一直以企业生产环境为标准进行安装部署。但在个人基本的功能测试需求下，这样的安装操作显得有些复杂。

在 openGauss 2.0.0 版本中\(2021.03.31 发布\)新增了极简版的软件包，极简版安装的使用主体主要针对高校和个人测试环境，相对企业安装流程更简单快捷，更加适合高校学生或者个人功能测试的场景，该软件包中并不包含 OM 工具，采用脚本可以实现一键式安装部署。

本文通过使用极简版进行安装部署，希望基本的操作示例对大家能有所帮助。

软件环境： 包含了上一版本要求的软件依赖包，新增了 openEuler x86 环境下需要的 libnsl 软件包。

硬件环境： 极简版中对于硬件环境要求描述“个人开发者最低配置 2 核 4G, 推荐配置 4 核 8G。”，本次安装实验采用最低配置 2c/4GB，操作系统使用 CentOS7.6.1810。

极简版为了适应小内存机器，在部署时将部分重要内存参数设置较低，如：“shared_buffers = 32MB”、“cstore_buffers = 512MB”。

另外，极简版安装的数据库字符集将原先默认的 SQL_ACSII 字符集改为 en_US.UTF-8，同时初始用户密码不做强制修改\[modify_initial_password = false\]。

## 运行环境配置<a name="section71142951920"></a>

**1. 配置 YUM 源**

```
mkdir /etc/yum.repos.d/bak
mv /etc/yum.repos.d/*.repo  /etc/yum.repos.d/bak/
wget -O /etc/yum.repos.d/CentOS-Base.repo https://repo.huaweicloud.com/repository/conf/CentOS-7-reg.repo
yum clean all
```

**2. 安装依赖的软件包**

```
yum install libaio-devel flex bison ncurses-devel glibc-devel patch redhat-lsb-core readline-devel -y
```

**3. 关闭安全设置**

```
## 关闭防火墙
systemctl status firewalld
systemctl disable firewalld.service
systemctl stop firewalld.service
## 关闭SELinux
sed -i '/SELINUX=/d' /etc/selinux/config
echo "SELINUX=disabled" >> /etc/selinux/config
cat /etc/selinux/config|grep -v ^#|grep -v '^$'
```

**4. 设置时区**

```
rm -fr /etc/localtime
ln -s /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
ll /etc/localtime
```

**5. 关闭 SWAP**

```
## 修改分区表文件，删除SWAP挂载信息
cp /etc/fstab  /etc/fstab.bak
sed -i '/swap/s/^/#/' /etc/fstab
cat /etc/fstab|grep -v ^#|grep -v '^$'
## 关闭swap
swapoff -a
```

**6. 配置操作系统内核参数**

```
## 极简安装但没有实现内核参数的自动化配置，这个有些不足，希望后续将参数配置写入脚本。
## 此处参考之前的配置吧
cat >> /etc/sysctl.conf << EOF
net.ipv4.tcp_max_tw_buckets = 10000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_tw_recycle = 1
net.ipv4.tcp_keepalive_time = 30
net.ipv4.tcp_keepalive_probes = 9
net.ipv4.tcp_keepalive_intvl = 30
net.ipv4.tcp_retries1 = 5
net.ipv4.tcp_syn_retries = 5
net.ipv4.tcp_synack_retries = 5
net.ipv4.tcp_retries2 = 12
vm.overcommit_memory = 0
net.ipv4.tcp_rmem = 8192 250000 16777216
net.ipv4.tcp_wmem = 8192 250000 16777216
net.core.wmem_max = 21299200
net.core.rmem_max = 21299200
net.core.wmem_default = 21299200
net.core.rmem_default = 21299200
net.ipv4.ip_local_port_range = 26000 65535
kernel.sem = 250 6400000 1000 25600
vm.min_free_kbytes = 102400  ##suggest to set as physical memory * 5%
net.core.somaxconn = 65535
net.ipv4.tcp_syncookies = 1
net.core.netdev_max_backlog = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 60
kernel.shmall = 1152921504606846720
kernel.shmmax = 18446744073709551615
net.ipv4.tcp_sack = 1
net.ipv4.tcp_timestamps = 1
vm.extfrag_threshold = 500
vm.overcommit_ratio = 90
EOF
sysctl -p
```

备注： openEuler 操作系统需要关闭 RemoveIPC，操作请参考官方文档。

## 创建普通用户和目录，并授权<a name="section6430052162110"></a>

```
groupadd -g 1001 dbgrp
useradd -u 2001 -g dbgrp omm
mkdir -p /opt/software/openGauss
chown -R omm:dbgrp /opt
```

## 解压并一键式安装单机 openGauss<a name="section1316615201228"></a>

极简版软件包：openGauss-2.0.0-CentOS-64bit.tar.bz2

企业版软件包：openGauss-2.0.0-CentOS-64bit-all.tar.gz \(包含 om 工具\)

单机部署的数据目录 --\> /opt/software/openGauss/data/single_node

主备部署的数据目录 --\> /opt/software/openGauss/data/master 和 /opt/software/openGauss/data/slave

```
## 解压软件包
[root@db1 ~]# su - omm
[omm@db1 ~]$ cd /opt/software/openGauss/
[omm@db1 openGauss]$ tar -jxf openGauss-2.0.0-CentOS-64bit.tar.bz2 -C /opt/software/openGauss/
## 一键式脚本安装
[omm@db1 openGauss]$ cd /opt/software/openGauss/simpleInstall/
[omm@db1 simpleInstall]$ sh install.sh -w gauss@123  -p 26000      ## -w指定数据库初始用户密码、-p指定数据库端口
[step 1]: check parameter
[step 2]: check install env and os setting
[step 3]: change_gausshome_owner
[step 4]: set environment variables
/home/omm/.bashrc: line 16: ulimit: open files: cannot modify limit: Operation not permitted
[step 6]: init datanode
The files belonging to this database system will be owned by user "omm".
This user must also own the server process.
The database cluster will be initialized with locale "en_US.UTF-8".
The default database encoding has accordingly been set to "UTF8".
The default text search configuration will be set to "english".

creating directory /opt/software/openGauss/data/single_node ... ok
creating subdirectories ... ok
selecting default max_connections ... 100
selecting default shared_buffers ... 32MB
creating configuration files ... ok
creating template1 database in /opt/software/openGauss/data/single_node/base/1 ... The core dump path is an invalid directory
2021-04-01 09:58:57.927 [unknown] [unknown] localhost 139899531253504 0  [BACKEND] WARNING:  macAddr is 64022/1040773698, sysidentifier is 4195761672/4064452798, randomNum is 486318270
... ...
WARNING: enabling "trust" authentication for local connections
You can change this by editing pg_hba.conf or using the option -A, or
--auth-local and --auth-host, the next time you run gs_initdb.
Success. You can now start the database server of single node using:

    gaussdb -D /opt/software/openGauss/data/single_node --single_node
or
    gs_ctl start -D /opt/software/openGauss/data/single_node -Z single_node -l logfile

[step 7]: start datanode
[2021-04-01 09:59:21.027][8464][][gs_ctl]: gs_ctl started,datadir is /opt/software/openGauss/data/single_node
[2021-04-01 09:59:21.136][8464][][gs_ctl]: waiting for server to start...
0 LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.
0 LOG:  [Alarm Module]Host Name: db1
0 LOG:  [Alarm Module]Host IP: 127.0.0.1
0 LOG:  [Alarm Module]Cluster Name: dbCluster
0 LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 52
0 WARNING:  failed to open feature control file, please check whether it exists: FileName=gaussdb.version, Errno=2, Errmessage=No such file or directory.
0 WARNING:  failed to parse feature control file: gaussdb.version.
0 WARNING:  Failed to load the product control file, so gaussdb cannot distinguish product version.
0 LOG:  Failed to initialze environment for codegen.
The core dump path is an invalid directory
2021-04-01 09:59:21.359 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] LOG:  when starting as multi_standby mode, we couldn't support data replicaton.
gaussdb.state does not exist, and skipt setting since it is optional.2021-04-01 09:59:21.359 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.

2021-04-01 09:59:21.359 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] LOG:  [Alarm Module]Host Name: db1
2021-04-01 09:59:21.359 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] LOG:  [Alarm Module]Host IP: 127.0.0.1
2021-04-01 09:59:21.359 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] LOG:  [Alarm Module]Cluster Name: dbCluster
2021-04-01 09:59:21.359 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 52
2021-04-01 09:59:21.359 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] LOG:  Transparent encryption disabled.
2021-04-01 09:59:21.365 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] LOG:  loaded library "security_plugin"
2021-04-01 09:59:21.365 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] WARNING:  could not create any HA TCP/IP sockets
2021-04-01 09:59:21.374 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] WARNING:  No explicit IP is configured for listen_addresses GUC.
2021-04-01 09:59:21.374 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] LOG:  InitNuma numaNodeNum: 1 numa_distribute_mode: none inheritThreadPool: 0.
2021-04-01 09:59:21.374 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] LOG:  reserved memory for backend threads is: 220 MB
2021-04-01 09:59:21.374 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] LOG:  reserved memory for WAL buffers is: 128 MB
2021-04-01 09:59:21.374 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] LOG:  Set max backend reserve memory is: 348 MB, max dynamic memory is: 11097 MB
2021-04-01 09:59:21.374 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] LOG:  shared memory 330 Mbytes, memory context 11445 Mbytes, max process memory 12288 Mbytes
2021-04-01 09:59:21.404 [unknown] [unknown] localhost 140033854506752 0  0 [CACHE] LOG:  set data cache  size(402653184)
2021-04-01 09:59:21.415 [unknown] [unknown] localhost 140033854506752 0  0 [CACHE] LOG:  set metadata cache  size(134217728)
2021-04-01 09:59:21.462 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] LOG:  gaussdb: fsync file "/opt/software/openGauss/data/single_node/gaussdb.state.temp" success
2021-04-01 09:59:21.462 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] LOG:  create gaussdb state file success: db state(STARTING_STATE), server mode(Normal)
2021-04-01 09:59:21.483 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] LOG:  max_safe_fds = 977, usable_fds = 1000, already_open = 13
The core dump path is an invalid directory
2021-04-01 09:59:21.484 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] LOG:  user configure file is not found, it will be created.
2021-04-01 09:59:21.488 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] LOG:  the configure file /opt/software/openGauss/etc/gscgroup_omm.cfg doesn't exist or the size of configure file has changed. Please create it by root user!
2021-04-01 09:59:21.488 [unknown] [unknown] localhost 140033854506752 0  0 [BACKEND] LOG:  Failed to parse cgroup config file.

[2021-04-01 09:59:22.143][8464][][gs_ctl]:  done
[2021-04-01 09:59:22.143][8464][][gs_ctl]: server started (/opt/software/openGauss/data/single_node)
import sql file
Would you like to create a demo database (yes/no)? yes       ## 创建Demo数据库
Load demoDB [school,finance] success.
[complete successfully]: You can start or stop the database server using:
    gs_ctl start|stop|restart -D $GAUSSHOME/data/single_node -Z single_node
```

## 检查数据库<a name="section1069342432314"></a>

```
[omm@db1 ~]$ echo "PATH=/opt/software/openGauss/bin:\$PATH" >> /home/omm/.bash_profile   ## 配置PATH
[omm@db1 ~]$ source ~/.bash_profile
-bash: ulimit: open files: cannot modify limit: Operation not permitted      ## 这里提示打开文件数量限制不能修改，这...... 代表resource limit参数脚本也没有做相应的配置
[omm@db1 ~]$ gsql -d postgres -p 26000 -r
gsql ((openGauss 2.0.0 build 78689da9) compiled at 2021-03-31 21:04:03 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

postgres=# \l
                              List of databases
   Name    | Owner | Encoding |   Collate   |    Ctype    | Access privileges
-----------+-------+----------+-------------+-------------+-------------------
 finance   | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 |                          -- 金融场景数据库示例
 postgres  | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 |
 school    | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 |                          -- 学校场景数据库示例
 template0 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +
           |       |          |             |             | omm=CTc/omm
 template1 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +
           |       |          |             |             | omm=CTc/omm
(5 rows)
```

## 总结<a name="section18599115532313"></a>

openGauss 的极简安装没有使用 OM 工具，即不能使用 OM 工具对 openGauss 实例进行管理和配置。

openGauss 极简版免去了用户配置 XML 文件的操作，也免去了配置 1 主+1 备的配置操作，这简化了少许安装操作。

但是极简版个人感觉稍有些失望，所谓的"极"字并没有得到充分体现，系统内核参数、资源限制参数、环境变量配置、用户创建、目录创建和权限等等这些操作并没有实现自动化配置，脚本很简单但是并没有写入 install 脚本中。

个人对“极简”的期待是 90 分，实际感觉是 60 分，还有待完善，但值得期待。

## 附录：极简安装主备环境<a name="section225171816255"></a>

```
openGauss极简主备部署，脚本的基本操作就是分别单机安装主、备节点，然后配置主备关系并重建备库。同时，极简安装也会部署测试库finance和school。
[omm@db1 ~]$ cd /opt/software/openGauss/
[omm@db1 openGauss]$ tar -jxf openGauss-2.0.0-CentOS-64bit.tar.bz2 -C /opt/software/openGauss/
[omm@db1 openGauss]$ cd /opt/software/openGauss/simpleInstall/

## 主备部署需要配合--multinode参数
[omm@db1 simpleInstall]$ sh install.sh -w gauss@123  -p 26000   --multinode
[step 1]: check parameter
[step 2]: check install env and os setting
[step 3]: change_gausshome_owner
[step 4]: set environment variables

/home/omm/.bashrc: line 16: ulimit: open files: cannot modify limit: Operation not permitted
[init primary datanode.]
The files belonging to this database system will be owned by user "omm".
This user must also own the server process.

The database cluster will be initialized with locale "en_US.UTF-8".
The default text search configuration will be set to "english".

creating directory /opt/software/openGauss/data/master ... ok
creating subdirectories ... ok
selecting default max_connections ... 100
selecting default shared_buffers ... 32MB
creating configuration files ... ok
creating template1 database in /opt/software/openGauss/data/master/base/1 ... The core dump path is an invalid directory
... ...
WARNING: enabling "trust" authentication for local connections
You can change this by editing pg_hba.conf or using the option -A, or
--auth-local and --auth-host, the next time you run gs_initdb.

Success. You can now start the database server of single node using:

    gaussdb -D /opt/software/openGauss/data/master --single_node
or
    gs_ctl start -D /opt/software/openGauss/data/master -Z single_node -l logfile

[init slave datanode.]
The files belonging to this database system will be owned by user "omm".
This user must also own the server process.

The database cluster will be initialized with locale "en_US.UTF-8".
The default text search configuration will be set to "english".

creating directory /opt/software/openGauss/data/slave ... ok
creating subdirectories ... ok
selecting default max_connections ... 100
selecting default shared_buffers ... 32MB
creating configuration files ... ok
creating template1 database in /opt/software/openGauss/data/slave/base/1 ... The core dump path is an invalid directory
2021-04-01 10:16:31.046 [unknown] [unknown] localhost 140719588914944 0  [BACKEND] WARNING:  macAddr is 64022/1040773698, sysidentifier is 4195761672/4064474332, randomNum is 2212623580
... ...
WARNING: enabling "trust" authentication for local connections
You can change this by editing pg_hba.conf or using the option -A, or
--auth-local and --auth-host, the next time you run gs_initdb.

Success. You can now start the database server of single node using:

    gaussdb -D /opt/software/openGauss/data/slave --single_node
or
    gs_ctl start -D /opt/software/openGauss/data/slave -Z single_node -l logfile

[config datanode.]
remote_read_mode = non_authentication
host    all             all             192.168.0.100/32            trust
[start primary datanode.]
[2021-04-01 10:16:53.293][1997][][gs_ctl]: gs_ctl started,datadir is /opt/software/openGauss/data/master
[2021-04-01 10:16:53.400][1997][][gs_ctl]: waiting for server to start...
......
[2021-04-01 10:17:10.092][2063][datanode2][gs_ctl]:  done
[2021-04-01 10:17:10.092][2063][datanode2][gs_ctl]: server started (/opt/software/openGauss/data/slave)
[2021-04-01 10:17:10.092][2063][datanode2][gs_ctl]:  fopen build pid file "/opt/software/openGauss/data/slave/gs_build.pid" success
[2021-04-01 10:17:10.092][2063][datanode2][gs_ctl]:  fprintf build pid file "/opt/software/openGauss/data/slave/gs_build.pid" success
[2021-04-01 10:17:10.095][2063][datanode2][gs_ctl]:  fsync build pid file "/opt/software/openGauss/data/slave/gs_build.pid" success
import sql file
Would you like to create a demo database (yes/no)? yes
Load demoDB [school,finance] success.
[complete successfully]: You can start or stop the database server using:
    primary: gs_ctl start|stop|restart -D $GAUSSHOME/data/master -M primary
    standby: gs_ctl start|stop|restart -D $GAUSSHOME/data/slave -M standby
```

**-\> 数据库检查**

```
[omm@db1 ~]$ echo "PATH=/opt/software/openGauss/bin:\$PATH" >> /home/omm/.bash_profile   ## 配置PATH
[omm@db1 ~]$ source ~/.bash_profile
[omm@db1 master]$ gsql -d postgres -p 26000 -r
postgres=# \l
                              List of databases
   Name    | Owner | Encoding |   Collate   |    Ctype    | Access privileges
-----------+-------+----------+-------------+-------------+-------------------
 finance   | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 |
 postgres  | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 |
 school    | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 |
 template0 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +
           |       |          |             |             | omm=CTc/omm
 template1 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +
           |       |          |             |             | omm=CTc/omm
```

**-\> 主备状态检查**

```
[omm@db1 master]$ gs_ctl query -D /opt/software/openGauss/data/master
[2021-04-01 10:32:43.785][2239][][gs_ctl]: gs_ctl query ,datadir is /opt/software/openGauss/data/master
 HA state:
        local_role                     : Primary
        static_connections             : 1
        db_state                       : Normal
        detail_information             : Normal

 Senders info:
        sender_pid                     : 2151
        local_role                     : Primary
        peer_role                      : Standby
        peer_state                     : Normal
        state                          : Streaming
        sender_sent_location           : 0/403B850
        sender_write_location          : 0/403B850
        sender_flush_location          : 0/403B850
        sender_replay_location         : 0/403B850
        receiver_received_location     : 0/403B850
        receiver_write_location        : 0/403B850
        receiver_flush_location        : 0/403B850
        receiver_replay_location       : 0/403B850
        sync_percent                   : 100%
        sync_state                     : Sync
        sync_priority                  : 1
        sync_most_available            : Off
        channel                        : 192.168.0.100:26001-->192.168.0.100:37014

 Receiver info:
No information
```
