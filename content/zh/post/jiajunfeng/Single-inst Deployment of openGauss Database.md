+++
title = "openGauss数据库安装部署(单实例)"
date = "2020-07-22"
tags = ["openGauss安装部署"]
archives = "2020-07"
author = "贾军锋"
summary = "openGauss安装部署"
img = "/zh/post/jiajunfeng/title/img4.png"
times = "17:00"
+++

# openGauss单机部署文档(CentOS7.6+openGauss 1.0.0)<br>

**说明:<br>**
openGauss 支持单机部署和单机HA部署;<br>
openGauss HA部署时，备机数量为1~4台;<br>
openGauss 脚本安装仅支持单实例部署，如果一台主机部署多个实例，建议手动使用命令安装;<br>
openGauss Connectors的Linux版本:JDBC、ODBC、libpq.<br>

## 一、环境准备<br>

**硬件需求：**<br>
CPU   >= 8c<br>
内存  >= 32GB<br>
硬盘  >= 1.5GB  (禁用磁盘的Disk Cache Policy)<br>
网卡  >= 300MB  (建议做网卡bond)<br>

```shell
## 检查硬件配置
cat /proc/cpuinfo |grep processor
cat /etc/redhat-release
free -m  
## 如果内存小于32GB，会因为内存不足导致数据库无法启动，此时需要修改shared_buffers和max_connections调整openGauss所需的内存
```

**软件需求：**<br>

|               |                                                              |
| ------------- | ------------------------------------------------------------ |
| Linux操作系统 | openEuler 20.3LTS/CentOS 7.6                                 |
| Linux文件系统 | 剩余inode个数>15亿                                           |
| 工具          | Huawei JDK 1.8.0、psmisc、bzip2                              |
| Python        | openEuler:    支持Python 3.7.x <br />CentOS 7.6：支持Python 3.6.x |
| 其他软件包    | libaio-devel  >= 0.3.109-13<br />flex          >= 2.5.31<br />bison         >= 2.7.4<br/>ncurses-devel >= 5.9-13.20130511<br/>glibc-devel   >= 2.17-111<br/>patch         >= 2.7.1-10<br/>lsb_release   >= 4.1 |

**示例：**<br>

```shell
yum install -y lksctp*
yum install -y java-1.8.0-openjdk* psmisc bzip2 python3 python3-devel
yum install -y libaio-devel flex bison ncurses-devel glibc-devel patch redhat-lsb-core
## 当系统环境仅限内网使用时，可以配置系统镜像ISO作为默认YUM源，但是该YUM源(CentOS 7.6)默认不包含python3，需要手动编译安装。

[root@ecs-7777 ~]# rpm -qa java-1.8.0-openjdk psmisc bzip2 libaio-devel flex bison ncurses-devel glibc-devel patch redhat-lsb-core lksctp-tools* python3 python3-devel
psmisc-22.20-16.el7.x86_64
flex-2.5.37-6.el7.x86_64
redhat-lsb-core-4.1-27.el7.centos.1.x86_64
bzip2-1.0.6-13.el7.x86_64
java-1.8.0-openjdk-1.8.0.252.b09-2.el7_8.x86_64
libaio-devel-0.3.109-13.el7.x86_64
bison-3.0.4-2.el7.x86_64
ncurses-devel-5.9-14.20130511.el7_4.x86_64
lksctp-tools-devel-1.0.17-2.el7.x86_64
patch-2.7.1-12.el7_7.x86_64
lksctp-tools-1.0.17-2.el7.x86_64
glibc-devel-2.17-307.el7.1.x86_64
lksctp-tools-doc-1.0.17-2.el7.x86_64

[root@ecs-7777 ~]# checksctp
SCTP supported
```


######**Python3源码编译安装**

```shell
## Python3 源码编译安装耗时约30分钟
yum install gcc zlib* openssl* -y
tar -zxvf Python-3.6.11.tgz
cd Python-3.6.11
./configure --prefix=/usr/python3.6.11 --enable-optimizations --enable-shared
make
make install

ln -s /usr/python3.6.11/bin/python3.6 /usr/bin/python3
ln -s /usr/python3.6.11/bin/pip3 /usr/bin/pip3
ln -s /usr/python3.6.11/lib/libpython3.6m.so.1.0 /usr/lib64/
export LD_LIBRARY_PATH=/usr/python3.6.11/lib:$LD_LIBRARY_PATH

[root@db1 bin]# python3 -V
Python 3.6.11
```



## 二、操作系统配置<br>

**1.编辑Hosts文件**<br>

```shell
vi /etc/hosts
--------------------
192.168.0.11  db1.opengauss.com   #Gauss OM IP Hosts Mapping
192.168.0.12  db2.opengauss.com   #Gauss OM IP Hosts Mapping
--------------------
```

**2.关闭防火墙**<br>

```shell
systemctl status firewalld
systemctl disable firewalld.service
systemctl stop firewalld.service
```

**3.关闭SELinux**<br>

```shell
vi /etc/selinux/config
---------------------------
SELINUX=disabled
---------------------------

## SELinux的配置文件需要重启操作系统才可以生效，可以使用setenforce 0 使SELinux临时变更为Permissive状态，降低SELinux的影响。
```

**4.修改字符集参数**<br>

```shell
vi ~/.bash_profile
---------------------------
export LANG=en_US.UTF-8
---------------------------

source ~/.bash_profile
```

**5.设置时区并统一主机时间**<br>

```shell
## 检查时区和时间是否正确
[root@ecs-7777 ~]# ll /etc/localtime
lrwxrwxrwx. 1 root root 35 Apr 27 22:06 /etc/localtime -> ../usr/share/zoneinfo/Asia/Shanghai
[root@ecs-7777 ~]# date
Fri Jul 17 15:49:08 CST 2020

## 如果时区不正确，则copy时区模板至/etc/localtime(此处以上海时间为例)
[root@ecs-7777 ~]# cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
```

**6.关闭SWAP**<br>

```shell
vi /etc/fstab   ## 注释掉swap分区挂载
swapoff -a      ## 关闭swap
```

**7.[可选]设置网卡的MTU值(建议8192)**<br>

```shell
ifconfig  eth0  mtu 8192
## 也可在ifcfg-eth0网络配置文件设置"MTU=8192"，使之永久生效[需要网络工程师协助修改网络设备配置]
```

**8.配置SSH服务(允许root登录，关闭Banner)**<br>

检查root登录配置和Banner的配置<br>

```
cat /etc/ssh/sshd_config |grep -v ^#|grep -E 'PermitRoot|Banner'
```

如果不满足要求，应修改配置如下：<br>

```shell
vi /etc/ssh/sshd_config
--------------------------
#Banner none         ## 注释ssh登录的欢迎信息
PermitRootLogin yes  ## 允许root用户远程登录
--------------------------

systemctl restart sshd.service
```

**9.创建管理用户组(管理用户稍后使用脚本gs_preinstall创建)**<br>

```
groupadd dbgrp
```

**10.配置内核参数**<br>

```shell
# vi /etc/sysctl.conf
---------------------------
net.ipv4.tcp_max_tw_buckets = 10000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_tw_recycle = 1
net.ipv4.tcp_keepalive_time = 30
net.ipv4.tcp_keepalive_probes = 9
net.ipv4.tcp_keepalive_intvl = 30
net.ipv4.tcp_retries1 = 5
net.ipv4.tcp_syn_retries = 5
net.ipv4.tcp_synack_retries = 5
net.sctp.path_max_retrans = 10
net.sctp.max_init_retransmits = 10
net.sctp.association_max_retrans = 10
net.sctp.hb_interval = 30000
net.ipv4.tcp_retries2 = 12
vm.overcommit_memory = 0
net.sctp.sndbuf_policy = 0
net.sctp.rcvbuf_policy = 0
net.sctp.sctp_mem = 94500000 915000000 927000000
net.sctp.sctp_rmem = 8192 250000 16777216
net.sctp.sctp_wmem = 8192 250000 16777216
net.ipv4.tcp_rmem = 8192 250000 16777216
net.ipv4.tcp_wmem = 8192 250000 16777216
net.core.wmem_max = 21299200
net.core.rmem_max = 21299200
net.core.wmem_default = 21299200
net.core.rmem_default = 21299200
net.ipv4.ip_local_port_range = 26000 65535
kernel.sem = 250 6400000 1000 25600
vm.min_free_kbytes = 102400    ## 内存*5%
net.core.somaxconn = 65535
net.ipv4.tcp_syncookies = 1
net.sctp.addip_enable = 0
net.core.netdev_max_backlog = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 60
kernel.shmall = 1152921504606846720
kernel.shmmax = 18446744073709551615
net.ipv4.tcp_sack = 1
net.ipv4.tcp_timestamps = 1
vm.extfrag_threshold = 500
vm.overcommit_ratio = 90
----------------------------------------
```

**redhat 6.4&6.5需要打开sctp的checksums，否则可能引起创建表或数据库失败**<br>

```
[root@ecs-7777 ~]# echo 0 >  /sys/module/sctp/parameters/no_checksums
[root@ecs-7777 ~]# cat /sys/module/sctp/parameters/no_checksums
N
```

**11.修改系统资源限制**<br>

```shell
vi /etc/security/limits.conf
----------------------------
* soft stack 3072
* hard stack 3072
* soft nofile 1000000  ## 安装时脚本自动设置
* hard nofile 1000000  ## 安装时脚本自动设置
 ----------------------------

vi /etc/security/limits.d/90-nproc.conf
----------------------------
* soft nproc unlimited  ## 系统支持的最大进程数
----------------------------

## 说明：在使用gs_preinstall脚本后，limits资源虽然已经设置，但可能存在暂时不生效的情况，需要重启系统使之生效。
```

**12.关闭透明页transparent_hugepage**<br>

```shell
vi /etc/default/grub
----------------------------
#修改：
GRUB_CMDLINE_LINUX="rhgb quiet transparent_hugepage=never"
----------------------------
grub2-mkconfig  -o  /boot/grub2/grub.cfg    ## 重新编译grub，关闭透明页

cat /proc/meminfo |grep Huge

## 临时关闭透明页方法
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
```

**13.[可选]网卡参数配置(配置万兆业务网卡[backIp1])**<br>

```shell
rx = 4096   # 预安装时是否由脚本自动设置
tx = 4096   # 预安装时是否由脚本自动设置
mtu = 8192  # 推荐值：8192，同时需要协调对网络端口做出相应调整
```



## 三、预安装openGauss软件<br>

**1.配置clusterconfig.xml文件**<br>

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ROOT>
  <!-- 整体信息 -->
  <CLUSTER>
  <!-- 数据库名称 -->
    <PARAM name="clusterName" value="Sample1" />
  <!-- 数据库节点名称(hostname) -->
    <PARAM name="nodeNames" value="node1,node2" />
  <!-- 节点IP，与nodeNames一一对应 -->
    <PARAM name="backIp1s" value="192.168.0.11,192.168.0.12"/>
  <!-- 数据库安装目录 与其他路径相互独立-->
    <PARAM name="gaussdbAppPath" value="/gauss/app" />
  <!-- 日志目录 与其他路径相互独立 默认路径"$GAUSSLOG/安装用户名"-->
    <PARAM name="gaussdbLogPath" value="/gauss/log/omm" />
  <!-- 临时文件目录 默认位置在/opt/huawei/wisequery/perfadm_db-->
    <PARAM name="tmpMppdbPath" value="/gauss/tmp" />
  <!--数据库工具目录 与其他路径相互独立 默认路径在"/opt/huawei/wisequery"-->
    <PARAM name="gaussdbToolPath" value="/gauss/om" />
  <!--数据库core文件目录-->
    <PARAM name="corePath" value="/gauss/corefile"/>
  <!-- openGauss类型，此处示例为单机类型，“single-inst”表示单机一主多备部署形态-->
    <PARAM name="clusterType" value="single-inst"/>
  </CLUSTER>

  <!-- 每台服务器上的节点部署信息 -->
    <DEVICELIST>
  <!-- node1上的节点部署信息 -->
    <DEVICE sn="1000001">
  <!-- node1的hostname -->
    <PARAM name="name" value="node1"/>
  <!-- node1所在的AZ及AZ优先级 -->
    <PARAM name="azName" value="AZ1"/>
    <PARAM name="azPriority" value="1"/>
  <!-- node1的IP，如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
  <!-- 主机在后端存储网络中的IP地址(内网IP),所有openGauss主机使用后端存储网络通讯 -->
    <PARAM name="backIp1" value="192.168.0.11"/>
  <!-- 设置SSH可信通道IP地址(外网IP),若无外网,则可以不设置该选项或者同backIp1设置相同IP -->
    <PARAM name="sshIp1" value="192.168.0.11"/>

  <!--DBnode 数据库主节点信息-->
    <PARAM name="dataNum" value="1"/>
  <!--DBnode端口号-->
    <PARAM name="dataPortBase" value="26000"/>
  <!--DBnode主节点上数据目录，及备机数据目录-->
    <PARAM name="dataNode1" value="/gauss/data/db1,node2,/gauss/data/db1"/>
  <!--DBnode节点上设定同步模式的节点数-->
    <PARAM name="dataNode1_syncNum" value="0"/>
```

| 实例名称 |    实例数据目录    |             备注              |
| :------: | :----------------: | :---------------------------: |
| 主DBnode |  /gauss/data/xxx   | 其中，xxx为当前主DBnode的名称 |
| 备DBnode | /gauss/data/slaveX | 其中，xxx为当前备DBnode的名称 |

**备注：**<br>

- dataListenIp1   ---> 侦听的IP地址，用于接受其他数据库节点的连接。未设置时，使用对应主机上的backIp1生成。
- dataHaIp1       ---> 主、备DBnode通讯的IP地址。未设置时，使用对应主机上的backIp生成。value中需要设置主、备DBnode所在主机的IP地址。
- "/gauss/om"存放互信等工具，避免权限问题，不要把实例数据目录放在此目录下。
- 安装目录和数据目录需为空或者不存在，否则可能导致安装失败。
- 确保配置的目录之间不相互耦合。
- 若需要安装脚本自动创建安装用户时，各配置的目录需保证不与系统创建的默认用户目录耦合关联。
- 配置openGauss路径和实例路径时，路径中不能包含"|",";","&","$","<",">","`","","","'","{","}","(",")","[","]","~","*","?"特殊字符。
- 配置数据库节点名称时，请通过hostname命令获取数据库节点的主机名称，替换示例中的node1、node2。
- 配置文件中所有IP参数(backIP、sshIP、listenIP等)均只支持配置一个IP，如果配置第二个IP参数，则不会读取第二个参数的配置值。

**单节点配置文件示例**<br>
***# vi clusterconfig.xml***<br>

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ROOT>
    <!-- openGauss整体信息 -->
    <CLUSTER>
        <PARAM name="clusterName" value="dbCluster" />
        <PARAM name="nodeNames" value="node1" />
        <PARAM name="backIp1s" value="192.168.0.11"/>
        <PARAM name="gaussdbAppPath" value="/gauss/app" />
        <PARAM name="gaussdbLogPath" value="/gauss/log/omm" />
        <PARAM name="tmpMppdbPath" value="/gauss/tmp" />
        <PARAM name="gaussdbToolPath" value="/gauss/om" />
        <PARAM name="corePath" value="/gauss/corefile" />
        <PARAM name="clusterType" value="single-inst"/>
    </CLUSTER>
    <!-- 每台服务器上的节点部署信息 -->
    <DEVICELIST>
        <!-- node1上的节点部署信息 -->
        <DEVICE sn="1000001">
            <PARAM name="name" value="node1"/>
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <!-- 如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
            <PARAM name="backIp1" value="192.168.0.11"/>
            <PARAM name="sshIp1" value="192.168.0.11"/>

	    <!--dbnode-->
	    <PARAM name="dataNum" value="1"/>
	    <PARAM name="dataPortBase" value="26000"/>
	    <PARAM name="dataNode1" value="/gauss/data/db1"/>
        </DEVICE>
    </DEVICELIST>
</ROOT>
```

**2.环境初始化**<br>

```shell
mkdir /gauss
chgrp dbgrp -R /gauss 
chmod 775 -R /gauss

mkdir -p /soft/openGauss
chmod 775 -R /soft
mv clusterconfig.xml   /soft/openGauss
mv openGauss-1.0.0-CentOS-64bit.tar.gz  /soft/openGauss
cd /soft/openGauss
tar -zxvf openGauss-1.0.0-CentOS-64bit.tar.gz
```



**交互式安装**<br>

​    若是共用的环境，需要加入--sep-env-file=ENVFILE参数分离环境变量，避免与其他用户相互影响。

​    在openGauss的安装过程中，需要在openGauss中主机间执行命令，传送文件等操作，故在普通用户安装前需要确保互信是连通的。前置脚本中会先建立root用户间的互信，然后创建普通用户，并建立普通用户间的互信，安装完毕后即可删除root用户的互信。<br>

```shell
export LD_LIBRARY_PATH=/soft/openGauss/script/gspylib/clib:/usr/python3.6.11/lib:$LD_LIBRARY_PATH
cd /soft/openGauss/script
./gs_preinstall -U omm -G dbgrp -X /soft/openGauss/clusterconfig.xml
```

​    当不允许创建root用户互信时，在各主机上使用创建的omm用户执行本地模式前置，然后用户手动创建openGauss用户互信：如果预安装指定-L参数，预安装前需手动将所有节点的主机名和IP映射关系，写入各个主机的/etc/hosts文件，并在每个映射关系后添加注释内容"#Gauss OM IP Hosts Mapping".<br>

```shell
cd /soft/openGauss/script
./gs_preinstall -U omm -G dbgrp -L -X /soft/openGauss/clusterconfig.xml  ##在每个节点手动执行
```

**手动创建互信(脚本)**

```shell
vi /soft/hostfile
-----------------------
192.168.0.11
192.168.0.12
-----------------------
cd  /soft/openGauss/script
./gs_sshexkey -f /soft/hostfile
```



**非交互式安装(可选)**

**手动创建互信(脚本)**

```shell
vi /soft/hostfile
-----------------------
192.168.0.11
192.168.0.12
-----------------------

cd  /soft/openGauss/script
./gs_sshexkey -f /soft/hostfile

cd /soft/openGauss/script
./gs_preinstall -U omm -G dbgrp -X /soft/openGauss/clusterconfig.xml  --non-interactive

## 错误排查：
   如果准备安装环境失败请根据openGauss日志目录“$GAUSSLOG/om”下的“gs_preinstall-YYYY-MM-DD_HHMMSS.log”和“gs_local-YYYY-MM-DD_HHMMSS.log”中的日志信息排查错误。例如配置文件中“gaussdbLogPath”参数指定的路径为“/var/log/gaussdb”，则“$GAUSSLOG/om”路径为“/var/log/gaussdb/omm/om”，omm用户为运行openGauss的用户。
```



## 四、部署安装openGauss软件<br>

**执行安装脚本**<br>

```shell
chmod -R 775 /soft/
chown omm:dbgrp /soft -R
su - omm
cd /soft/openGauss/script
./gs_install -X /soft/openGauss/clusterconfig.xml  ## 密码复杂度要求：大写+小写+数字+特殊字符(任选3类，至少8位)
```

**说明：**<br>

- 默认字符集与操作系统设置保持一致，也可以在数据库初始化时使用-E参数指定数据库的字符集为GBK/UTF-8/Latinl，默认字符集为SQL_ASCII
- openGauss支持字符集的多种写法：gbk/GBK、UTF-8/UTF8/utf8/utf-8、Latinel/latinel
- 执行gs_install脚本时，如果输入参数–autostart=no， 则工具脚本在配置（config）步骤完成后退出，不会自动启动openGauss，需要用户通过执行gs_om -t start命令手动启动。
- 安装过程中会生成ssl证书，证书存放路径为{gaussdbAppPath}/share/sslcert/om，其中{gaussdbAppPath}为集群openGauss配置文件中指定的程序安装目录。日志文件路径下会生成两个日志文件：“gs_install-YYYY-MMDD_HHMMSS.log”和“gs_local-YYYY-MM-DD_HHMMSS.log”

**删除root的SSH互信**<br>

```shell
su - root
rm -fr ~/.ssh
```

**备机可读(可选)**<br>

1> 停止主、备数据库<br>

2> 分别修改主、备库postgres.conf文件<br>

```shell
## 内容如下：
wal_level=hot_standby
hot_standby = on
hot_standby_feedback = on
```

3> 重启主、备数据库<br>



## 五、安装验证<br>

```shell
su - root
cd /soft/openGauss/script/
./gs_checkos -i A
./gs_checkos -i B
```



## 六、初始化数据库<br>

**方法一：脚本初始化**<br>

```
gs_initdb  -E  UTF-8 --locale=zh_CN.UTF-8 /opt/gaussdb/data/data_n1 --nodename dn1 -w "Bigdata@123"
```

**方法二：gsql方式**<br>

```
# gsql -d postgres -p 26000
postgres=# alter role omm identified by 'Gauss@123' replace 'Gauss_111';
postgres=# CREATE DATABASE mydb WITH ENCODING 'GBK' template = template0;
```

**简单查询测试：**

```
postgres=# select version();
postgres=# \l
                          List of databases

   Name    | Owner | Encoding  | Collate | Ctype | Access privileges
-----------+-------+-----------+---------+-------+-------------------
 mydb      | omm   | UTF8      | C       | C     |
 postgres  | omm   | SQL_ASCII | C       | C     |
 template0 | omm   | SQL_ASCII | C       | C     | =c/omm           +
           |       |           |         |       | omm=CTc/omm
 template1 | omm   | SQL_ASCII | C       | C     | =c/omm           +
           |       |           |         |       | omm=CTc/omm
```



## 七、卸载数据库<br>

**登录主节点执行**<br>

```shell
su - omm
gs_uninstall --delete-data     # 卸载集群所有数据库
gs_uninstall --delete-data -L  # 仅卸载本地数据库

# 如果卸载失败请根据“$GAUSSLOG/om/gs_uninstall-YYYY-MM-DD_HHMMSS.log”中的日志信息排查错误。
```



## 八、清理系统环境配置<br>

​        在openGauss卸载完成后，如果不需要在环境上重新部署openGauss，可以运行脚本gs_postuninstall对openGauss服务器上环境信息做清理。openGauss环境清理是对环境准备脚本gs_preinstall所做设置的清理。<br>
1> 确保root用户SSH互信<br>
2> 执行清理脚本，如下：<br>

```shell
cd /opt/software/openGauss/script
./gs_postuninstall -U omm -X /opt/software/openGauss/clusterconfig.xml --delete-user --delete-group
./gs_postuninstall -U omm -X /opt/software/openGauss/clusterconfig.xml --delete-user --delete-group -L ## 仅清理本地环境
## 若为环境变量分离的模式安装的集群需删除之前source的环境变量分离的env参数
```

3> 删除root的SSH互信，并删除ENVFILE环境变量：unset MPPDB_ENV_SEPARATE_PATH<br>

注意：若是共用的环境，需要加入--sep-env-file<br>



## 附录：【手动创建SSH互信的方法】<br>

**1> 生成本地秘钥Key(每个主机执行一遍)**<br>

```shell
ssh-keygen -t rsa
cat .ssh/id_rsa.pub  >> .ssh/authorized_keys   ##生成本机授权
```

**2> 收集各节点公钥至本机的known_hosts**<br>

```shell
ssh-keyscan -t rsa plat1 >> ~/.ssh/known_hosts
ssh-keyscan -t rsa plat2 >> ~/.ssh/known_hosts
ssh-keyscan -t rsa plat3 >> ~/.ssh/known_hosts
```

**3> 将互信文件分发给其他所有主机**<br>

```shell
scp -r  .ssh  plat2:~
scp -r  .ssh  plat3:~
```

**4> ssh登录测试**<br>
