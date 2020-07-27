+++ 
title = "openGauss 单实例 HA 安装部署 " 
date = "2020-07-25" 
tags = ["openGauss安装部署"] 
archives = "2020-07" 
author = "贾军锋" 
summary = "openGauss 单实例 HA 安装部署" 
img = "/zh/post/jiajunfeng/img/DBlogo-20200722.png" 
times = "19:00" 
+++

# openGauss 单实例 HA 安装部署文档(CentOS7.6+openGauss 1.0.0)

**说明:** 

- openGauss 支持单机部署和单机HA部署; 
- openGauss HA部署时，备机数量为1~4台; 
- openGauss 脚本安装仅支持单实例部署，如果一台主机部署多个实例，建议手动使用命令安装; 
- openGauss Connectors的Linux版本:JDBC、ODBC、libpq.



## 一、环境准备

<div class="wiz-table-container" style="position: relative; padding: 0px;"><div class="wiz-table-body"><table><tbody><tr><td align="center" valign="middle" style="width:491px;background-color:rgb(255, 236, 198);" rowspan="1" colspan="3" data-background-color="#ffecc6"><span style="font-family:&quot;Open Sans&quot;, &quot;Clear Sans&quot;, &quot;Helvetica Neue&quot;, Helvetica, Arial, sans-serif;"><b>IP地址规划</b></span><br></td></tr><tr><td align="left" valign="middle" style="width:120px;"><span style="font-family:&quot;Open Sans&quot;, &quot;Clear Sans&quot;, &quot;Helvetica Neue&quot;, Helvetica, Arial, sans-serif;"><b>主机名</b></span><br></td><td align="left" valign="middle" style="width:187px;">db1.opengauss.com<br></td><td align="left" valign="middle" style="width:184px;">db2.opengauss.com<br></td></tr><tr><td align="left" valign="middle" style="width:120px;"><b>外网IP地址</b><br></td><td align="left" valign="middle" style="width:187px;">192.168.124.11<br></td><td align="left" valign="middle" style="width:184px;">192.168.124.12<br></td></tr><tr><td align="left" valign="middle" style="width:120px;"><b>内网IP地址</b><br></td><td align="left" valign="middle" style="width:187px;">192.168.100.11<br></td><td align="left" valign="middle" style="width:184px;">192.168.100.12<br></td></tr></tbody></table></div></div>

**1.1 硬件需求**

<div class="wiz-table-container" style="position: relative; padding: 0px;" contenteditable="false"><div class="wiz-table-body" contenteditable="true"><table><tbody><tr><td align="center" valign="middle" style="width: 117px; background-color: rgb(255, 236, 198);" data-background-color="#ffecc6"><b>组件</b></td><td align="center" valign="middle" style="width: 197px; background-color: rgb(255, 236, 198);" data-background-color="#ffecc6" class=""><b>最小配置要求</b></td><td align="center" valign="middle" style="width: 432px; background-color: rgb(255, 236, 198);" data-background-color="#ffecc6"><b>备注</b></td></tr><tr><td align="left" valign="middle" style="width: 117px;" class=""><b>CPU</b></td><td align="left" valign="middle" style="width: 197px;">8c</td><td align="left" valign="middle" style="width: 432px;"><br></td></tr><tr><td align="left" valign="middle" style="width: 117px;"><b>内存</b></td><td align="left" valign="middle" style="width: 197px;" class="">32GB</td><td align="left" valign="middle" style="width: 432px;" class=""><span>如果小于32GB，需要调整数据库内存参数</span><br></td></tr><tr><td align="left" valign="middle" style="width: 117px;"><b>硬盘</b></td><td align="left" valign="middle" style="width: 197px;">1.5GB</td><td align="left" valign="middle" style="width: 432px;">禁用磁盘的Disk Cache Policy<br></td></tr><tr><td align="left" valign="middle" style="width: 117px;"><b>网卡速率</b></td><td align="left" valign="middle" style="width: 197px;">300MB</td><td align="left" valign="middle" style="width: 432px;">建议做网卡bond<br></td></tr></tbody></table></div></div>

```shell
## 检查硬件配置
cat /proc/cpuinfo |grep processor
cat /etc/redhat-release
free -m 
## 如果内存小于32GB，会因为内存不足导致数据库无法启动，此时需要修改shared_buffers和max_connections调整openGauss所需的内存
```

**1.2 软件需求**

<div class="wiz-table-container" style="position: relative; padding: 0px;" contenteditable="false"><div class="wiz-table-body" contenteditable="true"><table><tbody><tr><td align="center" valign="middle" style="width:151px;background-color:rgb(255, 236, 198);" data-background-color="#ffecc6"><b>条目</b></td><td align="center" valign="middle" style="width:369px;background-color:rgb(255, 236, 198);" data-background-color="#ffecc6"><b>要求</b></td></tr><tr><td align="left" valign="middle" style="width:151px;"><span><b>Linux操作系统</b></span><br></td><td align="left" valign="middle" style="width:369px;">openEuler 20.3LTS/CentOS 7.6<br></td></tr><tr><td align="left" valign="middle" style="width:151px;"><b>Linux文件系统</b><br></td><td align="left" valign="middle" style="width:369px;">剩余inode个数&gt;15亿<br></td></tr><tr><td align="left" valign="middle" style="width:151px;"><b>工具</b><br></td><td align="left" valign="middle" style="width:369px;">Huawei JDK 1.8.0、psmisc、bzip2<br></td></tr><tr><td align="left" valign="middle" style="width:151px;"><b>Python</b><br></td><td align="left" valign="middle" style="width:369px;"><span>openEuler:&nbsp; &nbsp; &nbsp;支持Python 3.7.x <br>CentOS 7.6：支持Python 3.6.x</span><br></td></tr><tr><td align="left" valign="middle" style="width:151px;"><span><b>其他依赖软件包</b></span><br></td><td align="left" valign="middle" style="width:369px;"><div>libaio-devel &gt;= 0.3.109-13&nbsp;</div><div>flex &gt;= 2.5.31 bison &gt;= 2.7.4&nbsp;</div><div>ncurses-devel &gt;= 5.9-13.20130511&nbsp;</div><div>glibc-devel &gt;= 2.17-111&nbsp;</div><div>patch &gt;= 2.7.1-10&nbsp;</div><div>lsb_release &gt;= 4.1</div></td></tr></tbody></table></div></div>

**1.3 安装示例**

```shell
## 当系统环境仅限内网使用时，可以配置系统镜像ISO作为默认YUM源，但是该YUM源(CentOS 7.6)默认不包含python3，需要手动编译安装。
yum install -y lksctp*
yum install -y java-1.8.0-openjdk* psmisc bzip2 python3 python3-devel
yum install -y libaio-devel flex bison ncurses-devel glibc-devel patch redhat-lsb-core

[root@db1 ~]# rpm -qa java-1.8.0-openjdk psmisc bzip2 libaio-devel flex bison ncurses-devel glibc-devel patch redhat-lsb-core lksctp-tools* python3 python3-devel
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

[root@db1 ~]# checksctp
SCTP supported
```

**1.4 Python3源码编译安装**

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



# 二、操作系统配置 

**1.编辑Hosts文件**

```shell
vi /etc/hosts
--------------------
192.168.100.11  db1 db1.opengauss.com   #Gauss OM IP Hosts Mapping
192.168.100.12  db2 db2.opengauss.com   #Gauss OM IP Hosts Mapping
--------------------
```

**2.关闭防火墙**

```shell
systemctl status firewalld
systemctl disable firewalld.service
systemctl stop firewalld.service
```

**3.关闭SELinux**

```shell
vi /etc/selinux/config
---------------------------
SELINUX=disabled
---------------------------
## SELinux的配置文件需要重启操作系统才可以生效，可以使用setenforce 0 使SELinux临时变更为Permissive状态，降低SELinux的影响。
```

**4.修改字符集参数**

```shell
vi ~/.bash_profile
---------------------------
export LANG=en_US.UTF-8
---------------------------

source ~/.bash_profile
```

**5.设置时区并统一主机时间**

```shell
## 检查时区和时间是否正确(建议生产环境开启NTP服务同步时间)
[root@db1 ~]# ll /etc/localtime
lrwxrwxrwx. 1 root root 35 Apr 27 22:06 /etc/localtime -> ../usr/share/zoneinfo/Asia/Shanghai
[root@db1 ~]# date
Fri Jul 17 15:49:08 CST 2020

## 如果时区不正确，则copy时区模板至/etc/localtime(此处以上海时间为例)
[root@db1 ~]# cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
```

**6.关闭SWAP**

```shell
vi /etc/fstab   ## 注释掉swap分区挂载
swapoff -a      ## 关闭swap
```

**7.[可选]设置backupIP网卡的MTU值(建议8192)**

```shell
vi /etc/sysconfig/network-scripts/ifcfg-ens34
---------------------------------------
MTU=8192     ## 可能需要网络工程师协助修改网络设备端口MTU配置，操作系统修改后，建议重启服务器，否则可能造成ssh互信异常
---------------------------------------

# 命令临时修改方法：
ifconfig  ens34  mtu 8192
```

**8.配置SSH服务(允许root登录，关闭Banner)**

```shell
# 检查root登录配置和Banner的配置
cat /etc/ssh/sshd_config |grep -v ^#|grep -E 'PermitRoot|Banner'

# 如果不满足要求，应修改配置如下
vi /etc/ssh/sshd_config
--------------------------
#Banner none         ## 注释ssh登录的欢迎信息
PermitRootLogin yes  ## 允许root用户远程登录
--------------------------

systemctl restart sshd.service
```

**9.创建管理用户组(管理用户稍后使用脚本gs_preinstall创建)**

```shell
groupadd dbgrp
```

**10.配置内核参数**

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

# 注意：redhat 6.4&6.5需要打开sctp的checksums，否则可能引起创建表或数据库失败
[root@db1 ~]# echo 0 >  /sys/module/sctp/parameters/no_checksums
[root@db1 ~]# cat /sys/module/sctp/parameters/no_checksums
N
```

**11.修改系统资源限制**

```shell
vi /etc/security/limits.conf
----------------------------
* soft stack 3072
* hard stack 3072
* soft nofile 1000000  ## gs_preinstall脚本自动设置,可以不手动设置
* hard nofile 1000000  ## gs_preinstall脚本自动设置,可以不手动设置
 ----------------------------

vi /etc/security/limits.d/90-nproc.conf
----------------------------
* soft nproc unlimited  ## 系统支持的最大进程数
----------------------------

## 说明：在使用gs_preinstall脚本后，limits资源虽然已经设置，但可能存在暂时不生效的情况，需要重启系统使之生效。
```

**12.关闭透明页transparent_hugepage**

```shell
vi /etc/default/grub
----------------------------
#修改：
GRUB_CMDLINE_LINUX="rhgb quiet transparent_hugepage=never"
----------------------------
grub2-mkconfig  -o  /boot/grub2/grub.cfg    ## 重新编译grub，关闭透明页

reboot

cat /proc/meminfo |grep Huge

## 临时关闭透明页方法
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
```

**13.[可选]网卡参数配置(配置万兆业务网卡[backIp1])**

```shell
rx = 4096   # 预安装时是否由脚本自动设置
tx = 4096   # 预安装时是否由脚本自动设置
mtu = 8192  # 推荐值：8192，同时需要协调对网络端口做出相应调整
```



# 三、预安装openGauss软件 

#### **1.Single-inst HA 配置clusterconfig.xml文件(仅在主节点配置即可)**

```shell
# vi clusterconfig.xml
------------------------------------------------
<?xml version="1.0" encoding="UTF-8"?>
<ROOT>
    <!-- openGauss整体信息 -->
    <CLUSTER>
        <PARAM name="clusterName" value="gsCluster" />
        <PARAM name="nodeNames" value="db1.opengauss.com,db2.opengauss.com" />
        <PARAM name="backIp1s" value="192.168.100.11,192.168.100.12"/>
        <PARAM name="gaussdbAppPath" value="/gauss/app" />
        <PARAM name="gaussdbLogPath" value="/gauss/log/omm" />
        <PARAM name="tmpMppdbPath" value="/gauss/tmp"/>
        <PARAM name="gaussdbToolPath" value="/gauss/om" />
        <PARAM name="corePath" value="/gauss/corefile"/>
        <PARAM name="clusterType" value="single-inst"/>
    </CLUSTER>
    <!-- 每台服务器上的节点部署信息 -->
    <DEVICELIST>
        <!-- node1上的节点部署信息 -->
        <DEVICE sn="1000001">
            <PARAM name="name" value="db1.opengauss.com"/>
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <!-- 如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
            <!-- 主机后端存储网络通讯IP地址和HA通讯IP地址-->
            <PARAM name="backIp1" value="192.168.100.11"/>
            <!-- 设置SSH可信通道IP地址(外网IP),若无外网,则可以不设置该选项或者同backIp1设置相同IP -->
            <PARAM name="sshIp1" value="192.168.124.11"/>
           
        <!--DBnode 数据库主节点信息-->
        <!-- 当前主机上需要部署的数据库节点个数 -->  
        <PARAM name="dataNum" value="1"/>
        <!-- 数据库节点的基础端口号 -->
        <PARAM name="dataPortBase" value="26000"/>
        <!-- 指定当前主机上的数据库节点的数据存储目录 -->
        <PARAM name="dataNode1" value="/gauss/data/db1,db2.opengauss.com,/gauss/data/slavedb2"/>
        <!--DBnode节点上设定同步模式的节点数-->
        <PARAM name="dataNode1_syncNum" value="1"/>
        </DEVICE>

        <!-- node2上的节点部署信息，其中“name”的值配置为主机名称 -->
        <DEVICE sn="1000002">
            <PARAM name="name" value="db2.opengauss.com"/>
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <!-- 如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
            <!-- 主机后端存储网络通讯IP地址和HA通讯IP地址-->
            <PARAM name="backIp1" value="192.168.100.12"/>
            <!-- 设置SSH可信通道IP地址(外网IP),若无外网,则可以不设置该选项或者同backIp1设置相同IP -->
            <PARAM name="sshIp1" value="192.168.124.12"/>
    </DEVICE>
    </DEVICELIST>
</ROOT>
------------------------------------------------
```

<div class="wiz-table-container" style="position: relative; padding: 0px;" contenteditable="false"><div class="wiz-table-body" contenteditable="true"><table><tbody><tr><td align="center" valign="middle" style="width:120px;background-color:rgb(255, 236, 198);" data-background-color="#ffecc6"><b>实例名称</b><br></td><td align="center" valign="middle" style="width:177px;background-color:rgb(255, 236, 198);" data-background-color="#ffecc6"><b>实例数据目录</b><br></td><td align="center" valign="middle" style="width:285px;background-color:rgb(255, 236, 198);" data-background-color="#ffecc6"><b>备注</b><br></td></tr><tr><td align="left" valign="middle" style="width:120px;"><b>主DBnode</b><br></td><td align="left" valign="middle" style="width:177px;">/gauss/data/xxx<br></td><td align="left" valign="middle" style="width:285px;">其中，xxx为当前主DBnode的名称<br></td></tr><tr><td align="left" valign="middle" style="width:120px;"><b>备DBnode</b><br></td><td align="left" valign="middle" style="width:177px;">/gauss/data/slaveX<br></td><td align="left" valign="middle" style="width:285px;">其中，xxx为当前备DBnode的名称<br></td></tr></tbody></table></div></div>

**备注：**

- dataListenIp1 ---> 监听的IP地址，用于接受其他数据库节点的连接。未设置时，使用对应主机上的backIp1生成。
- dataHaIp1 ---> 主、备DBnode通讯的IP地址。未设置时，使用对应主机上的backIp生成。value中需要设置主、备DBnode所在主机的IP地址。
- "/gauss/om"存放互信等工具，避免权限问题，不要把实例数据目录放在此目录下。
- 安装目录和数据目录需为空或者不存在，否则可能导致安装失败。
- 确保配置的目录之间不相互耦合。
- 若需要安装脚本自动创建安装用户时，各配置的目录需保证不与系统创建的默认用户目录耦合关联。
- 配置openGauss路径和实例路径时，路径中不能包含"|",";","&","$","<",">","`","","","'","{","}","(",")","[","]","~","*","?"特殊字符。
- 配置数据库节点名称时，"name"和"nodeNames"的值应该与hostname命令获取数据库节点的主机名称保持一致。
- 配置文件中所有IP参数(backIP、sshIP、listenIP等)均只支持配置一个IP，如果配置第二个IP参数，则不会读取第二个参数的配置值。

#### 2.环境初始化

**2.1 在主、备节点创建数据目录**

```shell
mkdir /gauss
chgrp dbgrp -R /gauss
chmod 775 -R /gauss
```

**2.2 解压安装包文件**

```shell
mkdir -p /soft/openGauss
chmod 775 -R /soft
mv clusterconfig.xml   /soft/openGauss
mv openGauss-1.0.0-CentOS-64bit.tar.gz  /soft/openGauss
cd /soft/openGauss
tar -zxvf openGauss-1.0.0-CentOS-64bit.tar.gz
```

**2.3 交互式安装**

   若是共用的环境，需要加入--sep-env-file=ENVFILE参数分离环境变量，避免与其他用户相互影响。

   在openGauss的安装过程中，需要在openGauss中主机间执行命令，传送文件等操作，故在普通用户安装前需要确保互信是连通的。前置脚本中会先建立root用户间的互信，然后创建普通用户，并建立普通用户间的互信，安装完毕后即可删除root用户的互信。

```shell
export LD_LIBRARY_PATH=/soft/openGauss/script/gspylib/clib:/usr/python3.6.11/lib:$LD_LIBRARY_PATH
cd /soft/openGauss/script
./gs_preinstall -U omm -G dbgrp -X /soft/openGauss/clusterconfig.xml  ## 建议执行完毕后，重启系统，使部分参数生效

## 执行示例
[root@db1 script]# ./gs_preinstall -U omm -G dbgrp -X /soft/openGauss/clusterconfig.xml
Parsing the configuration file.
Successfully parsed the configuration file.
Installing the tools on the local node.
Successfully installed the tools on the local node.
Are you sure you want to create trust for root (yes/no)? yes
Please enter password for root.
Password:
Creating SSH trust for the root permission user.
Checking network information.
All nodes in the network are Normal.
Successfully checked network information.
Creating SSH trust.
Creating the local key file.
Successfully created the local key files.
Appending local ID to authorized_keys.
Successfully appended local ID to authorized_keys.
Updating the known_hosts file.
Successfully updated the known_hosts file.
Appending authorized_key on the remote node.
Successfully appended authorized_key on all remote node.
Checking common authentication file content.
Successfully checked common authentication content.
Distributing SSH trust file to all node.
Successfully distributed SSH trust file to all node.
Verifying SSH trust on all hosts.
Successfully verified SSH trust on all hosts.
Successfully created SSH trust.
Successfully created SSH trust for the root permission user.
Setting pssh path
Successfully set core path.
Distributing package.
Begin to distribute package to tool path.
Successfully distribute package to tool path.
Begin to distribute package to package path.
Successfully distribute package to package path.
Successfully distributed package.
Are you sure you want to create the user[omm] and create trust for it (yes/no)? yes
Please enter password for cluster user.  ## 输入集群管理用户omm的密码
Password:
Please enter password for cluster user again.
Password:
Successfully created [omm] user on all nodes.
Preparing SSH service.
Successfully prepared SSH service.
Installing the tools in the cluster.
Successfully installed the tools in the cluster.
Checking hostname mapping.
Successfully checked hostname mapping.
Creating SSH trust for [omm] user.
Checking network information.
All nodes in the network are Normal.
Successfully checked network information.
Creating SSH trust.
Creating the local key file.
Successfully created the local key files.
Appending local ID to authorized_keys.
Successfully appended local ID to authorized_keys.
Updating the known_hosts file.
Successfully updated the known_hosts file.
Appending authorized_key on the remote node.
Successfully appended authorized_key on all remote node.
Checking common authentication file content.
Successfully checked common authentication content.
Distributing SSH trust file to all node.
Successfully distributed SSH trust file to all node.
Verifying SSH trust on all hosts.
Successfully verified SSH trust on all hosts.
Successfully created SSH trust.
Successfully created SSH trust for [omm] user.
Checking OS software.
Successfully check os software.
Checking OS version.
Successfully checked OS version.
Creating cluster's path.
Successfully created cluster's path.
Setting SCTP service.
Successfully set SCTP service.
Set and check OS parameter.
Setting OS parameters.
Successfully set OS parameters.
Warning: Installation environment contains some warning messages.
Please get more details by "/soft/openGauss/script/gs_checkos -i A -h db1.opengauss.com,db2.opengauss.com --detail".
Set and check OS parameter completed.
Preparing CRON service.
Successfully prepared CRON service.
Setting user environmental variables.
Successfully set user environmental variables.
Setting the dynamic link library.
Successfully set the dynamic link library.
Setting Core file
Successfully set core path.
Setting pssh path
Successfully set pssh path.
Set ARM Optimization.
No need to set ARM Optimization.
Fixing server package owner.
Setting finish flag.
Successfully set finish flag.
Preinstallation succeeded.
```

**2.4 执行脚本对主、备节点进行检查**

```shell
[root@db1 script]# /soft/openGauss/script/gs_checkos -i A -h db1.opengauss.com,db2.opengauss.com --detail
Checking items:
    A1. [ OS version status ]                                   : Normal
        [db1.opengauss.com]
        centos_7.6.1810_64bit
        [db2.opengauss.com]
        centos_7.6.1810_64bit

    A2. [ Kernel version status ]                               : Normal
        The names about all kernel versions are same. The value is "3.10.0-957.el7.x86_64".
    A3. [ Unicode status ]                                      : Normal
        The values of all unicode are same. The value is "LANG=en_US.UTF-8".
    A4. [ Time zone status ]                                    : Normal
        The informations about all timezones are same. The value is "+0800".
    A5. [ Swap memory status ]                                  : Normal
        The value about swap memory is correct.
    A6. [ System control parameters status ]                    : Normal
        All values about system control  parameters are correct.
    A7. [ File system configuration status ]                    : Normal
        Both soft nofile and hard nofile are correct.
    A8. [ Disk configuration status ]                           : Normal
        The value about XFS mount parameters is correct.
    A9. [ Pre-read block size status ]                          : Normal
        The value about Logical block size is correct.
    A10.[ IO scheduler status ]                                 : Normal
        The value of IO scheduler is correct.
    A11.[ Network card configuration status ]                   : Normal
        The configuration about network card is correct.
    A12.[ Time consistency status ]                             : Warning
        [db1.opengauss.com]
        The NTPD not detected on machine and local time is "2020-07-22 18:52:57".
        [db2.opengauss.com]
        The NTPD not detected on machine and local time is "2020-07-22 18:52:57".

    A13.[ Firewall service status ]                             : Normal
        The firewall service is stopped.
    A14.[ THP service status ]                                  : Normal
        The THP service is stopped.
Total numbers:14. Abnormal numbers:0. Warning numbers:1.

## 由于没有使用NTP服务器，所以告警提示时间同步存在问题，考虑到系统时间对数据库的重要性，建议生产环境启用NTP服务，确保系统时间同步
[root@db1 ~]# reboot
[root@db2 ~]# reboot
```

   当不允许创建root用户互信时，在各主机上使用创建的omm用户执行本地模式前置，然后用户手动创建openGauss用户互信：如果预安装指定-L参数，预安装前需手动将所有节点的主机名和IP映射关系，写入各个主机的/etc/hosts文件，并在每个映射关系后添加注释内容"*#Gauss OM IP Hosts Mapping*".

**2.5 (可选)使用脚本手动创建互信，并执行本地预安装脚本**

```shell
vi /soft/hostfile
-----------------------
192.168.100.11
192.168.100.12
-----------------------
cd  /soft/openGauss/script
./gs_sshexkey -f /soft/hostfile

## 指定preinstall脚本
cd /soft/openGauss/script
./gs_preinstall -U omm -G dbgrp -L -X /soft/openGauss/clusterconfig.xml  ##在每个节点手动执行
```

**2.6 (可选参考)非交互式安装**

```shell
## 手动创建互信(脚本)
vi /soft/hostfile
-----------------------
192.168.100.11
192.168.100.12
-----------------------
cd  /soft/openGauss/script
./gs_sshexkey -f /soft/hostfile

## 以非交互式的方式执行preinstall脚本
cd /soft/openGauss/script
./gs_preinstall -U omm -G dbgrp -X /soft/openGauss/clusterconfig.xml  --non-interactive
```

**错误排查：**

​    如果准备安装环境失败请根据openGauss日志目录“`$GAUSSLOG/om`”下的“`gs_preinstall-YYYY-MM-DD_HHMMSS.log`”和“`gs_local-YYYY-MM-DD_HHMMSS.log`”中的日志信息排查错误。例如配置文件中“`$gaussdbLogPath`”参数指定的路径为“`/var/log/gaussdb`”，则“`$GAUSSLOG/om`”路径为“`/var/log/gaussdb/omm/om`”，omm用户为运行openGauss的用户。



## 四、部署安装openGauss软件

#### 4.1 执行安装脚本(仅在主节点执行即可)

```shell
## 执行完毕preinstall脚本后，建议重启操作系统，否则请手动设置max user process参数
## 参考命令： ulimit -u unlimited
chmod -R 775 /soft/
chown omm:dbgrp /soft -R
su - omm
cd /soft/openGauss/script
./gs_install -X /soft/openGauss/clusterconfig.xml  ## 密码复杂度要求：大写+小写+数字+特殊字符(任选3类，至少8位)

## 执行示例如下：
[omm@db1 script]$ ./gs_install -X /soft/openGauss/clusterconfig.xml
Parsing the configuration file.
Check preinstall on every node.
Successfully checked preinstall on every node.
Creating the backup directory.
Successfully created the backup directory.
begin deploy..
Installing the cluster.
begin prepare Install Cluster..
Checking the installation environment on all nodes.
begin install Cluster..
Installing applications on all nodes.
Successfully installed APP.
begin init Instance..
encrypt cipher and rand files for database.
Please enter password for database:  ##输入数据库密码
Please repeat for database:
begin to create CA cert files
The sslcert will be generated in /gauss/app/share/sslcert/om
Cluster installation is completed.
Configuring.
Deleting instances from all nodes.
Successfully deleted instances from all nodes.
Checking node configuration on all nodes.
Initializing instances on all nodes.
Updating instance configuration on all nodes.
Check consistence of memCheck and coresCheck on database nodes.
Successful check consistence of memCheck and coresCheck on all nodes.
Configuring pg_hba on all nodes.
Configuration is completed.
Successfully started cluster.
Successfully installed application.
end deploy..
```

**说明：**

- 默认字符集与操作系统设置保持一致，也可以在数据库初始化时使用-E参数指定数据库的字符集为GBK/UTF-8/Latinl，默认字符集为SQL_ASCII
- openGauss支持字符集的多种写法：gbk/GBK、UTF-8/UTF8/utf8/utf-8、Latinel/latinel
- 执行gs_install脚本时，如果输入参数–autostart=no， 则工具脚本在配置（config）步骤完成后退出，不会自动启动openGauss，需要用户通过执行gs_om -t start命令手动启动
- 安装过程中会生成ssl证书，证书存放路径为{gaussdbAppPath}/share/sslcert/om，其中{gaussdbAppPath}为集群openGauss配置文件中指定的程序安装目录。日志文件路径下会生成两个日志文件：“gs_install-YYYY-MMDD_HHMMSS.log”和“gs_local-YYYY-MM-DD_HHMMSS.log”
- 主、备数据库Single-inst HA安装完毕后，节点间互通则使用omm用户，从安全角度考虑，可以删除root用户的SSH互信

#### 4.2 备机可读(可选)

**1> 关闭cluster集群(仅在主节点执行即可)**

```shell
[omm@db1 ~]$ gs_om -t stop
Stopping cluster.
=========================================
Successfully stopped cluster.
=========================================
End stop cluster.
```

**2> 分别修改主、备库postgres.conf文件**

```shell
cd /gauss/data/db1/  ## 备库路径在/gauss/data/slavedb2/
vi postgresql.conf
-----------------------------------
## 内容如下：
wal_level=hot_standby      ## 默认值 hot_standby
hot_standby = on           ## 默认值 on
hot_standby_feedback = on  ## 默认值 off
-----------------------------------
```

**3> 启动cluster集群(仅在主节点执行即可)**

```shell
[omm@db1 db1]$ gs_om -t start
Starting cluster.
=========================================
=========================================
Successfully started.
```



## 五、安装验证 

```shell
su - root
cd /soft/openGauss/script/
./gs_checkos -i A
./gs_checkos -i B

## 示例如下：
[root@db1 script]# ./gs_checkos -i A
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
    A11.[ Network card configuration status ]                   : Normal
    A12.[ Time consistency status ]                             : Warning
    A13.[ Firewall service status ]                             : Normal
    A14.[ THP service status ]                                  : Normal
Total numbers:14. Abnormal numbers:0. Warning numbers:1.

[root@db1 script]# ./gs_checkos -i B
Setting items:
    B1. [ Set system control parameters ]                       : Normal
    B2. [ Set file system configuration value ]                 : Normal
    B3. [ Set pre-read block size value ]                       : Normal
    B4. [ Set IO scheduler value ]                              : Normal
    B5. [ Set network card configuration value ]                : Normal
    B6. [ Set THP service ]                                     : Normal
    B7. [ Set RemoveIPC value ]                                 : Normal
NOTICE: MTU value and some warning items can NOT be set. Please do it manually.
Total numbers:7. Abnormal numbers:0. Warning numbers:0.
```



## 六、集群的基本管理操作

**6.1 启动集群**

```shell
[omm@db1 ~]$ gs_om -t start
Starting cluster.
=========================================
=========================================
Successfully started.
```

**6.2 停止集群** 

```shell
[omm@db1 ~]$ gs_om -t stop
Stopping cluster.
=========================================
Successfully stopped cluster.
=========================================
End stop cluster.
```

**6.3 集群状态检查**

```shell
[omm@db1 ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

node                 node_ip         instance                     state
-----------------------------------------------------------------------------------------------------------
1  db1.opengauss.com 192.168.100.11  6001 /gauss/data/db1      P Primary Normal
2  db2.opengauss.com 192.168.100.12  6002 /gauss/data/slavedb2 S Standby Normal
```

**6.4 集群的主/备切换测试**

```shell
## 检查集群状态
[omm@db1 ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

node                 node_ip         instance                     state
-----------------------------------------------------------------------------------------------------------
1  db1.opengauss.com 192.168.100.11  6001 /gauss/data/db1      P Primary Normal
2  db2.opengauss.com 192.168.100.12  6002 /gauss/data/slavedb2 S Standby Normal

## 切换主/备角色(在备库执行)
[omm@db2 slavedb2]$ gs_ctl switchover -D /gauss/data/slavedb2/
[2020-07-22 20:59:04.701][12415][][gs_ctl]: gs_ctl switchover ,datadir is -D "/gauss/data/slavedb2"
[2020-07-22 20:59:04.701][12415][][gs_ctl]: switchover term (1)
[2020-07-22 20:59:04.784][12415][][gs_ctl]: waiting for server to switchover............
[2020-07-22 20:59:14.435][12415][][gs_ctl]: done
[2020-07-22 20:59:14.435][12415][][gs_ctl]: switchover completed (/gauss/data/slavedb2)

## 检查集群状态
[omm@db2 slavedb2]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

node                 node_ip         instance                     state
-------------------------------------------------------------------------------------------------------
1  db1.opengauss.com 192.168.100.11  6001 /gauss/data/db1      S Standby Normal
2  db2.opengauss.com 192.168.100.12  6002 /gauss/data/slavedb2 P Primary Normal

## 保存集群主备机器信息
[omm@db2 slavedb2]$ gs_om -t refreshconf
Generating dynamic configuration file for all nodes.
Successfully generated dynamic configuration file.
```



## 七、配置数据库区域和字符集

**示例一：脚本初始化数据库(*<u>脚本可能存在异常，测试时不生效</u>*)**

```shell
######目前官方提供的软件包版本如下所示：
[omm@db1 ~]$ gaussdb -V
gaussdb (openGauss 1.0.0 build 0bd0ce80) compiled at 2020-06-30 18:19:27 commit 0 last mr
## 测试时，该版本的gs_initdb脚本存在异常，暂时不使用该方法。

## 初始化数据库时，请确保对应的数据目录为空
gs_initdb  -E  UTF-8 --locale=en_US.UTF-8 /gauss/data/db1/tmp --nodename db1.opengauss.com -w "Bigdata@123"

## 初始化操作示例如下：
[omm@db1 ~]$ gs_initdb -E UTF-8 --locale=en_US.UTF-8 /gauss/data/db1/tmp --nodename db1.opengauss.com -w "gauss@111"
The files belonging to this database system will be owned by user "omm".
This user must also own the server process.

The database cluster will be initialized with locale "en_US.UTF-8".
The default text search configuration will be set to "english".

creating directory /gauss/data/db1/tmp ... ok
creating subdirectories ... ok
selecting default max_connections ... 100
selecting default shared_buffers ... 32MB
creating configuration files ... ok
creating template1 database in /gauss/data/db1/tmp/base/1 ... ok
initializing pg_authid ... ok
setting password ... ok
initializing dependencies ... ok
loading PL/pgSQL server-side language ... ok
creating system views ... ok
creating performance views ... ok
loading system objects' descriptions ... gs_initdb: removing data directory "/gauss/data/db1/tmp"   ## 最终自动清空了数据目录，不生效
```

**示例二：gsql方式新建库**

```shell
# gsql -d postgres -p 26000
postgres=# alter role omm identified by 'Gauss@123' replace 'Gauss_111';
postgres=# CREATE DATABASE mydb WITH ENCODING 'GBK' template = template0;

## 简单查询测试
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



## 附录1：【手动创建SSH互信的方法】

**1> 生成本地秘钥Key(每个主机执行一遍)**

```shell
ssh-keygen -t rsa
cat .ssh/id_rsa.pub  >> .ssh/authorized_keys   ##生成本机授权
```

**2> 收集各节点公钥至本机的known_hosts**

```shell
ssh-keyscan -t rsa db1 >> ~/.ssh/known_hosts
ssh-keyscan -t rsa db2 >> ~/.ssh/known_hosts
```

**3> 将互信文件分发给其他所有主机**

```shell
scp -r  .ssh  db2:~
```

**4> ssh登录测试**



## 附录2：【卸载数据库】

```shell
su - omm
gs_uninstall --delete-data     # 卸载集群所有数据库
gs_uninstall --delete-data -L  # 仅卸载本地数据库
# 如果卸载失败请根据“$GAUSSLOG/om/gs_uninstall-YYYY-MM-DD_HHMMSS.log”中的日志信息排查错误。

## 示例：
[omm@db1 ~]$ gs_uninstall --delete-data
Checking uninstallation.
Successfully checked uninstallation.
Stopping the cluster.
Successfully stopped cluster.
Successfully deleted instances.
Uninstalling application.
Successfully uninstalled application.
Uninstallation succeeded.
```