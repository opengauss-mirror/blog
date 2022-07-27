+++ 
title = "openGauss 单实例安装部署" 
date = "2020-07-25" 
tags = ["openGauss安装部署"] 
archives = "2020-07" 
author = "贾军锋" 
summary = "openGauss 单实例安装部署" 
img = "/zh/post/jiajunfeng/title/img4.png" 
times = "19:00" 
+++

# openGauss 单实例安装部署文档(CentOS7.6+openGauss 1.0.0)

**说明:** 

- openGauss 支持单机部署和单机HA部署; 
- openGauss HA部署时，备机数量为1~4台; 
- openGauss 脚本安装仅支持单实例部署，如果一台主机部署多个实例，建议手动使用命令安装; 
- openGauss Connectors的Linux版本:JDBC、ODBC、libpq.



## 一、环境准备

### **1.1 硬件需求**

<div class="wiz-table-container" style="position: relative; padding: 0px;" contenteditable="false"><div class="wiz-table-body" contenteditable="true"><table><tbody><tr><td align="center" valign="middle" style="width:119px;background-color:rgb(255, 236, 198);" data-background-color="#ffecc6"><b>组件</b></td><td align="center" valign="middle" style="width:119px;background-color:rgb(255, 236, 198);" data-background-color="#ffecc6"><b>最小配置要求</b></td><td align="center" valign="middle" style="width:399px;background-color:rgb(255, 236, 198);" data-background-color="#ffecc6"><b>备注</b></td></tr><tr><td align="left" valign="middle" style="width:119px;"><b>CPU</b></td><td align="left" valign="middle" style="width:119px;">8c</td><td align="left" valign="middle" style="width:399px;"><br></td></tr><tr><td align="left" valign="middle" style="width:119px;"><b>内存</b></td><td align="left" valign="middle" style="width:119px;">32GB</td><td align="left" valign="middle" style="width:399px;">如果小于32GB，需要调整数据库内存参数</td></tr><tr><td align="left" valign="middle" style="width:119px;"><b>硬盘</b></td><td align="left" valign="middle" style="width:119px;">1.5GB</td><td align="left" valign="middle" style="width:399px;">禁用磁盘的Disk Cache Policy<br></td></tr><tr><td align="left" valign="middle" style="width:119px;"><b>网卡速率</b></td><td align="left" valign="middle" style="width:119px;">300MB</td><td align="left" valign="middle" style="width:399px;">建议做网卡bond<br></td></tr></tbody></table></div></div> 

```shell
## 检查硬件配置
cat /proc/cpuinfo |grep processor
cat /etc/redhat-release
free -m 
## 如果内存小于32GB，会因为内存不足导致数据库无法启动，此时需要修改shared_buffers和max_connections调整openGauss所需的内存
```

### **1.2 软件需求**

<div class="wiz-table-container" contenteditable="false" style="position: relative; padding: 0px;"><div class="wiz-table-body" contenteditable="true"><table><tbody><tr><td align="center" valign="middle" style="width:151px;background-color:rgb(255, 236, 198);" data-background-color="#ffecc6"><b>条目</b></td><td align="center" valign="middle" style="width:369px;background-color:rgb(255, 236, 198);" data-background-color="#ffecc6"><b>要求</b></td></tr><tr><td align="left" valign="middle" style="width:151px;" class=""><span><span data-wiz-span="data-wiz-span" style="">Linux操作系统</span></span><span data-wiz-span="data-wiz-span" style="><br></span></td><td align="left" valign="middle" style="width:369px;" class=""><span data-wiz-span="data-wiz-span"><span data-wiz-span="data-wiz-span" style="">openEuler 20.3LTS/CentOS 7.6</span><br></span></td></tr><tr><td align="left" valign="middle" style="width:151px;" class=""><span data-wiz-span="data-wiz-span" style="">Linux文件系统<br></span></td><td align="left" valign="middle" style="width:369px;" class=""><span data-wiz-span="data-wiz-span"><span data-wiz-span="data-wiz-span" style="">剩余inode个数 &gt; 15亿</span><br></span></td></tr><tr><td align="left" valign="middle" style="width:151px;" class=""><span data-wiz-span="data-wiz-span" style="">工具<br></span></td><td align="left" valign="middle" style="width:369px;" class=""><span data-wiz-span="data-wiz-span"><span data-wiz-span="data-wiz-span" style="">Huawei JDK 1.8.0、psmisc、bzip2</span><br></span></td></tr><tr><td align="left" valign="middle" style="width:151px;" class=""><span data-wiz-span="data-wiz-span" style="">Python<br></span></td><td align="left" valign="middle" style="width:369px;" class=""><span><span data-wiz-span="data-wiz-span" style="">openEuler:&nbsp; &nbsp; &nbsp;支持Python 3.7.x <br>CentOS 7.6：支持Python 3.6.x</span></span><span data-wiz-span="data-wiz-span" style="><br></span></td></tr><tr><td align="left" valign="middle" style="width:151px;" class=""><span><span data-wiz-span="data-wiz-span" style="">其他依赖软件包</span></span><span data-wiz-span="data-wiz-span" style="><br></span></td><td align="left" valign="middle" style="width:369px;" class=""><div><span data-wiz-span="data-wiz-span" style="">libaio-devel &gt;= 0.3.109-13&nbsp;</span></div><div><span data-wiz-span="data-wiz-span" style="">flex &gt;= 2.5.31&nbsp;</span></div><div><span data-wiz-span="data-wiz-span" style="">bison &gt;= 2.7.4&nbsp;</span></div><div><span data-wiz-span="data-wiz-span" style="">ncurses-devel &gt;= 5.9-13.20130511&nbsp;</span></div><div><span data-wiz-span="data-wiz-span" style="">glibc-devel &gt;= 2.17-111&nbsp;</span></div><div><span data-wiz-span="data-wiz-span" style="">patch &gt;= 2.7.1-10&nbsp;</span></div><div><span data-wiz-span="data-wiz-span" style="">lsb_release &gt;= 4.1</span></div></td></tr></tbody></table></div></div>

### **1.3 安装示例**

```shell
## 当系统环境仅限内网使用时，可以配置系统镜像ISO作为默认YUM源，但是该YUM源(CentOS 7.6)默认不包含python3，需要手动编译安装。
yum install -y lksctp*
yum install -y java-1.8.0-openjdk* psmisc bzip2 python3 python3-devel
yum install -y libaio-devel flex bison ncurses-devel glibc-devel patch redhat-lsb-core

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

### **1.4 Python3源码编译安装**

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



## 二、操作系统配置

### **1.编辑Hosts文件**

```shell
vi /etc/hosts
--------------------
192.168.100.11  db1 db1.opengauss.com   #Gauss OM IP Hosts Mapping
--------------------
```

### **2.关闭防火墙**

```shell
systemctl status firewalld
systemctl disable firewalld.service
systemctl stop firewalld.service
```

### **3.关闭SELinux**

```shell
vi /etc/selinux/config
---------------------------
SELINUX=disabled
---------------------------
## SELinux的配置文件需要重启操作系统才可以生效，可以使用setenforce 0 使SELinux临时变更为Permissive状态，降低SELinux的影响。
```

### **4.修改字符集参数**

```shell
vi ~/.bash_profile
---------------------------
export LANG=en_US.UTF-8
---------------------------

source ~/.bash_profile
```

### **5.设置时区并统一主机时间**

```shell
## 检查时区和时间是否正确(建议生产环境开启NTP服务同步时间)
[root@db1 ~]# ll /etc/localtime
lrwxrwxrwx. 1 root root 35 Apr 27 22:06 /etc/localtime -> ../usr/share/zoneinfo/Asia/Shanghai
[root@db1 ~]# date
Fri Jul 17 15:49:08 CST 2020

## 如果时区不正确，则copy时区模板至/etc/localtime(此处以上海时间为例)
[root@db1 ~]# cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
```

### **6.关闭SWAP**

```shell
vi /etc/fstab   ## 注释掉swap分区挂载
swapoff -a      ## 关闭swap
```

### **7.[可选]设置backupIP网卡的MTU值(建议8192)**

```shell
vi /etc/sysconfig/network-scripts/ifcfg-ens34
---------------------------------------
MTU=8192     ## 可能需要网络工程师协助修改网络设备端口MTU配置，操作系统修改该参数后，建议重启服务器，否则可能造成SSH互信添加有问题
---------------------------------------

# 命令临时修改方法：
ifconfig  ens34  mtu 8192
```

### **8.配置SSH服务(允许root登录，关闭Banner)**

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

### **9.创建管理用户组(管理用户稍后使用脚本gs_preinstall创建)**

```shell
groupadd dbgrp
```

### **10.配置内核参数**

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

### **11.修改系统资源限制**

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

### **12.关闭透明页transparent_hugepage**

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

### **13.[可选]网卡参数配置(配置万兆业务网卡[backIp1])**

```shell
rx = 4096   # 预安装时是否由脚本自动设置
tx = 4096   # 预安装时是否由脚本自动设置
mtu = 8192  # 推荐值：8192，同时需要协调对网络端口做出相应调整
```



## 三、预安装openGauss软件

### **1.配置clusterconfig.xml文件**

```shell
# vi clusterconfig.xml
---------------------------------------------------------
<?xml version="1.0" encoding="UTF-8"?>
<ROOT>
    <!-- openGauss整体信息 -->
    <CLUSTER>
        <!-- 数据库名称 -->
        <PARAM name="clusterName" value="gsCluster" />
        <!-- 数据库节点名称(hostname) -->
        <PARAM name="nodeNames" value="db1.opengauss.com" />
        <!-- 节点后端通讯IP，与nodeNames对应 -->
        <PARAM name="backIp1s" value="192.168.0.11"/>
        <!-- 数据库安装目录 与其他路径相互独立-->
        <PARAM name="gaussdbAppPath" value="/gauss/app" />
        <!-- 日志目录,与其他路径相互独立,默认路径"$GAUSSLOG/安装用户名"-->
        <PARAM name="gaussdbLogPath" value="/gauss/log/omm" />
        <!-- 临时文件目录,默认位置在/opt/huawei/wisequery/perfadm_db-->
        <PARAM name="tmpMppdbPath" value="/gauss/tmp" />
        <!--数据库工具目录,与其他路径相互独立,默认路径在"/opt/huawei/wisequery"-->
        <PARAM name="gaussdbToolPath" value="/gauss/om" />
        <!--数据库core文件目录-->
        <PARAM name="corePath" value="/gauss/corefile" />
        <!-- openGauss类型，此处示例为单机类型，“single-inst”表示单机或单击主备部署形态-->
        <PARAM name="clusterType" value="single-inst"/>
    </CLUSTER>
    <!-- 每台服务器上的节点部署信息 -->
    <DEVICELIST>
        <!-- node1上的节点部署信息 -->
        <DEVICE sn="1000001">
            <PARAM name="name" value="db1.opengauss.com"/>
            <!-- 节点所在的AZ及AZ优先级 -->
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <!-- 如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
            <PARAM name="backIp1" value="192.168.0.11"/>
            <PARAM name="sshIp1" value="192.168.0.11"/>

        <!--dbnode-->
        <!--当前主机上需要部署的数据库节点个数-->
        <PARAM name="dataNum" value="1"/>
        <!--DBnode端口号-->
        <PARAM name="dataPortBase" value="26000"/>
        <!--DBnode节点数据存储目录-->
        <PARAM name="dataNode1" value="/gauss/data/db1"/>
        </DEVICE>
    </DEVICELIST>
</ROOT>
---------------------------------------------------------
```

**说明：**

- "/gauss/om"存放互信等工具，避免权限问题，不要把实例数据目录放在此目录下。
- 安装目录和数据目录必须为空或者不存在，否则可能导致安装失败。
- 确保配置的目录之间不相互耦合。
- 若需要安装脚本自动创建安装用户时，各配置的目录需保证不与系统创建的默认用户目录耦合关联。
- 配置openGauss路径和实例路径时，路径中不能包含"|",";","&","$","<",">","`","","","'","{","}","(",")","[","]","~","*","?"特殊字符。
- 配置数据库节点名称时，请通过hostname命令获取数据库节点的主机名称，替换示例中的node1、node2。
- 配置文件中所有IP参数(backIP、sshIP、listenIP等)均只支持配置一个IP，如果配置第二个IP参数，则不会读取第二个参数的配置值。

### 2.环境初始化

```shell
## 创建相关目录
mkdir /gauss
chgrp dbgrp -R /gauss
chmod 775 -R /gauss

## 解压数据库安装包
mkdir -p /soft/openGauss
chmod 775 -R /soft
mv clusterconfig.xml   /soft/openGauss
mv openGauss-1.0.0-CentOS-64bit.tar.gz  /soft/openGauss
cd /soft/openGauss
tar -zxvf openGauss-1.0.0-CentOS-64bit.tar.gz
```

**交互式安装**

注： 若是共用的环境，需要加入--sep-env-file=ENVFILE参数分离环境变量，避免与其他用户相互影响。

```shell
export LD_LIBRARY_PATH=/soft/openGauss/script/gspylib/clib:/usr/python3.6.11/lib:$LD_LIBRARY_PATH
cd /soft/openGauss/script
./gs_preinstall -U omm -G dbgrp -X /soft/openGauss/clusterconfig.xml
```

​    安装时，preinstall脚本会自动创建root用户的互信(单实例是本机root互信)，当不允许创建root用户互信时，在主机上使用创建的omm用户执行本地模式前置，然后用户手动创建openGauss用户互信：如果预安装指定-L参数，预安装前需手动将节点的主机名和IP映射关系写入/etc/hosts文件，并在映射关系后添加注释内容"*#Gauss OM IP Hosts Mapping*".

```shell
cd /soft/openGauss/script
./gs_preinstall -U omm -G dbgrp -L -X /soft/openGauss/clusterconfig.xml  ##在每个节点手动执行
```

**手动使用脚本创建互信(参考)**

```shell
vi /soft/hostfile
-----------------------
192.168.0.11
-----------------------

cd  /soft/openGauss/script
./gs_sshexkey -f /soft/hostfile
```

**非交互式安装(参考)**

```shell
# 手动使用脚本创建互信
vi /soft/hostfile
-----------------------
192.168.0.11
-----------------------

cd  /soft/openGauss/script
./gs_sshexkey -f /soft/hostfile

cd /soft/openGauss/script
./gs_preinstall -U omm -G dbgrp -X /soft/openGauss/clusterconfig.xml  --non-interactive
```

**# 错误排查：**

​        如果准备安装环境失败请根据openGauss日志目录“`$GAUSSLOG/om`”下的“`gs_preinstall-YYYY-MM-DD_HHMMSS.log`”和“`gs_local-YYYY-MM-DD_HHMMSS.log`”中的日志信息排查错误。例如配置文件中“`$gaussdbLogPath`”参数指定的路径为“`/var/log/gaussdb`”，则“`$GAUSSLOG/om`”路径为“`/var/log/gaussdb/omm/om`”，omm用户为运行openGauss的用户。



## 四、部署安装openGauss软件

```shell
## 执行安装脚本
chmod -R 775 /soft/
chown omm:dbgrp /soft -R
su - omm
cd /soft/openGauss/script
./gs_install -X /soft/openGauss/clusterconfig.xml  ## 密码复杂度要求：大写+小写+数字+特殊字符(任选3类，至少8位)
```

**说明：**

- 默认字符集与操作系统设置保持一致，也可以在数据库初始化时使用-E参数指定数据库的字符集为GBK/UTF-8/Latinl，默认字符集为SQL_ASCII
- openGauss支持字符集的多种写法：gbk/GBK、UTF-8/UTF8/utf8/utf-8、Latinel/latinel
- 执行gs_install脚本时，如果输入参数–autostart=no， 则工具脚本在配置（config）步骤完成后退出，不会自动启动openGauss，需要用户通过执行gs_om -t start命令手动启动。
- 安装过程中会生成ssl证书，证书存放路径为{gaussdbAppPath}/share/sslcert/om，其中{gaussdbAppPath}为集群openGauss配置文件中指定的程序安装目录。日志文件路径下会生成两个日志文件：“gs_install-YYYY-MMDD_HHMMSS.log”和“gs_local-YYYY-MM-DD_HHMMSS.log”



## 五、安装验证

```shell
su - root
cd /soft/openGauss/script/
./gs_checkos -i A
./gs_checkos -i B
```



## 六、初始化数据库

**方法一：脚本初始化 (*<u>经测试，该脚本运行异常，执行初始化后又自动将文件删除，最终初始化无效</u>*)**

```shell
## 命令示例：
gs_initdb  -E  UTF-8 --locale=zh_CN.UTF-8 /opt/gaussdb/data/data_n1 --nodename dn1 -w "Bigdata@123"

## 当前测试使用的数据库版本
[omm@db1 ~]$ gaussdb -V
gaussdb (openGauss 1.0.0 build 0bd0ce80) compiled at 2020-06-30 18:19:27 commit 0 last mr

## 初始化命令示例(结束时清空了数据目录，脚本可能存在异常，暂时不使用该方法)
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
loading system objects' descriptions ... gs_initdb: removing data directory "/gauss/data/db1/tmp"  ## 自动删除了数据目录
```

**方法二：gsql方式**

```shell
# gsql -d postgres -p 26000
postgres=# alter role omm identified by 'Gauss@123' replace 'Gauss_111';
postgres=# CREATE DATABASE mydb WITH ENCODING 'GBK' template = template0;
```

**简单查询测试：**

```shell
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



## 七、卸载数据库

```shell
## 登录主节点执行
su - omm
gs_uninstall --delete-data     # 卸载集群所有数据库
gs_uninstall --delete-data -L  # 仅卸载本地数据库

# 如果卸载失败请根据“$GAUSSLOG/om/gs_uninstall-YYYY-MM-DD_HHMMSS.log”中的日志信息排查错误。
```



## 八、清理系统环境配置

​        在openGauss卸载完成后，如果不需要在环境上重新部署openGauss，可以运行脚本gs_postuninstall对openGauss服务器上环境信息做清理。openGauss环境清理是对环境准备脚本gs_preinstall所做设置的清理。

1> 确保root用户SSH互信

2> 执行清理脚本，如下：

```shell
cd /opt/software/openGauss/script
./gs_postuninstall -U omm -X /opt/software/openGauss/clusterconfig.xml --delete-user --delete-group
./gs_postuninstall -U omm -X /opt/software/openGauss/clusterconfig.xml --delete-user --delete-group -L ## 仅清理本地环境
## 若为环境变量分离的模式安装的集群需删除之前source的环境变量分离的env参数
```

3> 删除root的SSH互信，并删除ENVFILE环境变量：unset MPPDB_ENV_SEPARATE_PATH

注意：若是共用的环境，需要加入--sep-env-file