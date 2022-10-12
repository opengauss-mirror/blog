# 环境准备（所有节点操作）

## 环境说明

| os-release    | hostname | ip            | 角色    |
| ------------- | -------- | ------------- | ------- |
| centos7.6 x86 | primary  | 192.168.1.100 | primary |
| centos7.6 x86 | standby1 | 192.168.1.101 | standby |
| centos7.6 x86 | standby2 | 192.168.1.102 | standby |
| centos7.6 x86 | standby3 | 192.168.1.103 | standby |
| centos7.6 x86 | standby4 | 192.168.1.104 | standby |
| centos7.6 x86 | standby5 | 192.168.1.105 | standby |
| centos7.6 x86 | standby6 | 192.168.1.106 | standby |
| centos7.6 x86 | standby7 | 192.168.1.107 | standby |
| centos7.6 x86 | standby8 | 192.168.1.108 | standby |

## 安装依赖包

| 所需软件                      | 建议版本                  |
| ----------------------------- | ------------------------- |
| libaio-devel                  | 建议版本：0.3.109-13      |
| flex                          | 要求版本：2.5.31 以上     |
| bison                         | 建议版本：2.7-4           |
| ncurses-devel                 | 建议版本：5.9-13.20130511 |
| glibc-devel                   | 建议版本：2.17-111        |
| patch                         | 建议版本：2.7.1-10        |
| redhat-lsb-core               | 建议版本：4.1             |
| readline-devel                | 建议版本：7.0-13          |
| libnsl（openEuler+x86环境中） | 建议版本 ：2.28-36        |



~~~shell
#配置本地yum源
mount /dev/cdrom /mnt
cd /etc/yum.repos.d
mkdir bk
mv *.repo bk/
echo "[CentOS]" >> /etc/yum.repos.d/test.repo
echo "name =CentOS 7.x DVD" >> /etc/yum.repos.d/test.repo
echo "baseurl=file:///mnt" >> /etc/yum.repos.d/test.repo
echo "gpgcheck=0" >> /etc/yum.repos.d/test.repo
echo "enabled=1" >> /etc/yum.repos.d/test.repo
cat /etc/yum.repos.d/test.repo



#配置在线yum源
cp /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.bak

#直接覆盖原有的Centos-Base.repo


# CentOS-Base.repo
#
# The mirror system uses the connecting IP address of the client and the
# update status of each mirror to pick mirrors that are updated to and
# geographically close to the client.  You should use this for CentOS updates
# unless you are manually picking other mirrors.
#
# If the mirrorlist= does not work for you, as a fall back you can try the
# remarked out baseurl= line instead.
#
#

[base]
name=CentOS-$releasever - Base
baseurl=https://mirrors.tuna.tsinghua.edu.cn/centos/$releasever/os/$basearch/
#mirrorlist=http://mirrorlist.centos.org/?release=$releasever&arch=$basearch&repo=os
enabled=1
gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-7

#released updates
[updates]
name=CentOS-$releasever - Updates
baseurl=https://mirrors.tuna.tsinghua.edu.cn/centos/$releasever/updates/$basearch/
#mirrorlist=http://mirrorlist.centos.org/?release=$releasever&arch=$basearch&repo=updates
enabled=1
gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-7

#additional packages that may be useful
[extras]
name=CentOS-$releasever - Extras
baseurl=https://mirrors.tuna.tsinghua.edu.cn/centos/$releasever/extras/$basearch/
#mirrorlist=http://mirrorlist.centos.org/?release=$releasever&arch=$basearch&repo=extras
enabled=1
gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-7

#additional packages that extend functionality of existing packages
[centosplus]
name=CentOS-$releasever - Plus
baseurl=https://mirrors.tuna.tsinghua.edu.cn/centos/$releasever/centosplus/$basearch/
#mirrorlist=http://mirrorlist.centos.org/?release=$releasever&arch=$basearch&repo=centosplus
gpgcheck=0
enabled=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-7

#更新软件包缓存
yum makecache
~~~

~~~shell
#安装依赖包
yum install -y libaio-devel
yum install -y flex
yum install -y bison
yum install -y ncurses-devel
yum install -y glibc-devel
yum install -y patch
yum install -y redhat-lsb-core
yum install -y readline-devel
yum install -y python3
#采用交互式预安装的时候需要安装expect包
yum install -y expect
~~~

检查依赖包安装情况

~~~
rpm -q --qf '%{NAME}-%{VERSION}-%{RELEASE} (%{ARCH})\n' libaio-devel flex bison ncurses-devel glibc-devel patch redhat-lsb-core readline-devel python3 expect
~~~

## 修改操作系统配置

修改hosts文件

~~~shell
echo '192.168.1.100 primary' >> /etc/hosts
echo '192.168.1.101 standby1' >> /etc/hosts
echo '192.168.1.102 standby2' >> /etc/hosts
echo '192.168.1.103 standby3' >> /etc/hosts
echo '192.168.1.104 standby4' >> /etc/hosts
echo '192.168.1.105 standby5' >> /etc/hosts
echo '192.168.1.106 standby6' >> /etc/hosts
echo '192.168.1.107 standby7' >> /etc/hosts
echo '192.168.1.108 standby8' >> /etc/hosts
~~~



修改SELINUX值

~~~shell
vim /etc/selinux/config
SELINUX=disabled
#sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config
~~~

关闭防火墙：

~~~
systemctl status firewalld
systemctl disable firewalld.service
systemctl stop firewalld.service
reboot
~~~

设置字符集参数

```shell
#将各数据库节点的字符集设置为相同的字符集，可以在/etc/profile文件中添加“export LANG=XXX”（XXX为Unicode编码）。
echo 'export LANG=en_US.UTF8' >> /etc/profile
#echo 'export LANG=zh_CN.UTF8' >> /etc/profile
source /etc/profile
```

拷贝时区文件

~~~shell
#cp /usr/share/zoneinfo/$地区/$时区 /etc/localtime
cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
~~~

检查各数据库节点时间和时区是否一致

~~~shell
date
#如果不一致使用如下命令模板修改
date -s "Sat Sep 27 16:00:07 CST 2020"
~~~

可选）关闭swap交换内存

```
swapoff -a
```

关闭RemoveIPC。CentOS操作系统默认为关闭，可以跳过该步骤。

~~~shell
#1.修改/etc/systemd/logind.conf文件中的“RemoveIPC”值为“no”。
a.使用VIM打开logind.conf文件。
vim  /etc/systemd/logind.conf
b.修改“RemoveIPC”的值“no”。
RemoveIPC=no
#2.修改/usr/lib/systemd/system/systemd-logind.service文件中的“RemoveIPC”值为“no”。
a.使用VIM打开systemd-logind.service文件。
vim /usr/lib/systemd/system/systemd-logind.service
b.修改“RemoveIPC”的值“no”。
RemoveIPC=no
#3.重新加载配置参数。
systemctl daemon-reload
systemctl restart systemd-logind
#4.检查修改是否生效。
loginctl show-session | grep RemoveIPC
systemctl show systemd-logind | grep RemoveIPC
~~~

设置网卡MTU值，将各数据库节点的网卡MTU值设置为相同大小。

~~~shell
ifconfig
#使用如下命令将各数据库节点的网卡MTU值设置为相同大小。对于X86，MTU值推荐1500；对于ARM，MTU值推荐8192。
#ifconfig 网卡名称 mtu mtu值
~~~

关闭HISTORY记录，为避免指令历史记录安全隐患，需关闭各主机的history指令。

~~~shell
vim /etc/profile
HISTSIZE=0
#sed -i 's/HISTSIZE=1000/HISTSIZE=0/g' /etc/profile
cat /etc/profile|grep HISTSIZE
source /etc/profile
~~~

## 设置root用户远程登录

修改PermitRootLogin配置，允许用户远程登录。

~~~shell
vim /etc/ssh/sshd_config
#PermitRootLogin no
OR：
PermitRootLogin yes

cat /etc/ssh/sshd_config|grep PermitRootLogin
~~~

修改Banner配置，去掉连接到系统时，系统提示的欢迎信息。欢迎信息会干扰安装时远程操作的返回结果，影响安装正常执行。

~~~shell
vim /etc/ssh/sshd_config
#Banner XXXX

cat /etc/ssh/sshd_config|grep Banner
~~~

使设置生效

~~~
systemctl restart sshd.service
~~~



# 安装openGauss

## 创建XML配置文件

vim /tmp/8standby.xml

~~~xml
<?xml version="1.0" encoding="UTF-8"?>
<ROOT>
    <!-- openGauss整体信息 -->
    <CLUSTER>
        <PARAM name="clusterName" value="8standby" />
        <PARAM name="nodeNames" value="primary,standby1,standby2,standby3,standby4,standby5,standby6,standby7,standby8" />
   
        <PARAM name="gaussdbAppPath" value="/openGauss3.1/cluster/app" />
        <PARAM name="gaussdbLogPath" value="/openGauss3.1/cluster/gaussdb_log" />
        <PARAM name="tmpMppdbPath" value="/openGauss3.1/cluster/tmp"/>
        <PARAM name="gaussdbToolPath" value="/openGauss3.1/cluster/tool" />
        <PARAM name="corePath" value="/home/core"/>
        <PARAM name="backIp1s" value="192.168.1.100,192.168.1.101,192.168.1.102,192.168.1.103,192.168.1.104,192.168.1.105,192.168.1.106,192.168.1.107,192.168.1.108"/>
        
    </CLUSTER>
    <!-- 每台服务器上的节点部署信息 -->
    <DEVICELIST>
        <!-- node1上的节点部署信息 -->
        <DEVICE sn="primary">
            <PARAM name="name" value="primary"/>
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <!-- 如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
            <PARAM name="backIp1" value="192.168.1.100"/>
            <PARAM name="sshIp1" value="192.168.1.100"/>
            <!--CM节点部署信息-->
            <PARAM name="cmsNum" value="1"/>
            <PARAM name="cmServerPortBase" value="15000"/>
            <PARAM name="cmServerListenIp1" value="192.168.1.100,192.168.1.101,192.168.1.102,192.168.1.103,192.168.1.104,192.168.1.105,192.168.1.106,192.168.1.107,192.168.1.108"/>
            <PARAM name="cmServerHaIp1" value="192.168.1.100,192.168.1.101,192.168.1.102,192.168.1.103,192.168.1.104,192.168.1.105,192.168.1.106,192.168.1.107,192.168.1.108"/>
            <PARAM name="cmServerlevel" value="1"/>
            <PARAM name="cmServerRelation" value="primary,standby1,standby2,standby3,standby4,standby5,standby6,standby7,standby8"/>
            <PARAM name="cmDir" value="/openGauss3.1/cluster/cmserver"/>
	    <!--dn-->
            <PARAM name="dataNum" value="1"/>
	    <PARAM name="dataPortBase" value="15400"/>
	    <PARAM name="dataNode1" value="/openGauss3.1/cluster/dn,standby1,/openGauss3.1/cluster/dn,standby2,/openGauss3.1/cluster/dn,standby3,/openGauss3.1/cluster/dn,standby4,/openGauss3.1/cluster/dn,standby5,/openGauss3.1/cluster/dn,standby6,/openGauss3.1/cluster/dn,standby7,/openGauss3.1/cluster/dn,standby8,/openGauss3.1/cluster/dn"/>
            <PARAM name="dataNode1_syncNum" value="0"/>
        </DEVICE>

        <!-- node2上的节点部署信息，其中“name”的值配置为主机名称 -->
        <DEVICE sn="standby1">
            <PARAM name="name" value="standby1"/>
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <!-- 如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
            <PARAM name="backIp1" value="192.168.1.101"/>
            <PARAM name="sshIp1" value="192.168.1.101"/>
            <!-- cm -->
            <PARAM name="cmServerPortStandby" value="15000"/>
            <PARAM name="cmDir" value="/openGauss3.1/cluster/cmserver"/>
	</DEVICE>

        <!-- node3上的节点部署信息，其中“name”的值配置为主机名称 -->
        <DEVICE sn="standby2">
            <PARAM name="name" value="standby2"/>
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <!-- 如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
            <PARAM name="backIp1" value="192.168.1.102"/>
            <PARAM name="sshIp1" value="192.168.1.102"/>
            <!-- cm -->
            <PARAM name="cmServerPortStandby" value="15000"/>
            <PARAM name="cmDir" value="/openGauss3.1/cluster/cmserver"/>
	</DEVICE>

        <!-- node4上的节点部署信息，其中“name”的值配置为主机名称 -->
        <DEVICE sn="standby3">
            <PARAM name="name" value="standby3"/>
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <!-- 如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
            <PARAM name="backIp1" value="192.168.1.103"/>
            <PARAM name="sshIp1" value="192.168.1.103"/>
            <!-- cm -->
            <PARAM name="cmServerPortStandby" value="15000"/>
            <PARAM name="cmDir" value="/openGauss3.1/cluster/cmserver"/>
	</DEVICE>

        <!-- node5上的节点部署信息，其中“name”的值配置为主机名称 -->
        <DEVICE sn="standby4">
            <PARAM name="name" value="standby4"/>
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <!-- 如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
            <PARAM name="backIp1" value="192.168.1.104"/>
            <PARAM name="sshIp1" value="192.168.1.104"/>
            <!-- cm -->
            <PARAM name="cmServerPortStandby" value="15000"/>
            <PARAM name="cmDir" value="/openGauss3.1/cluster/cmserver"/>
	</DEVICE>
	
        <!-- node6上的节点部署信息，其中“name”的值配置为主机名称 -->
        <DEVICE sn="standby5">
            <PARAM name="name" value="standby5"/>
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <!-- 如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
            <PARAM name="backIp1" value="192.168.1.105"/>
            <PARAM name="sshIp1" value="192.168.1.105"/>
            <!-- cm -->
            <PARAM name="cmServerPortStandby" value="15000"/>
            <PARAM name="cmDir" value="/openGauss3.1/cluster/cmserver"/>
	</DEVICE>

        <!-- node7上的节点部署信息，其中“name”的值配置为主机名称 -->
        <DEVICE sn="standby6">
            <PARAM name="name" value="standby6"/>
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <!-- 如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
            <PARAM name="backIp1" value="192.168.1.106"/>
            <PARAM name="sshIp1" value="192.168.1.106"/>
            <!-- cm -->
            <PARAM name="cmServerPortStandby" value="15000"/>
            <PARAM name="cmDir" value="/openGauss3.1/cluster/cmserver"/>
	</DEVICE>

        <!-- node8上的节点部署信息，其中“name”的值配置为主机名称 -->
        <DEVICE sn="standby7">
            <PARAM name="name" value="standby7"/>
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <!-- 如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
            <PARAM name="backIp1" value="192.168.1.107"/>
            <PARAM name="sshIp1" value="192.168.1.107"/>
            <!-- cm -->
            <PARAM name="cmServerPortStandby" value="15000"/>
            <PARAM name="cmDir" value="/openGauss3.1/cluster/cmserver"/>
	</DEVICE>

        <!-- node9上的节点部署信息，其中“name”的值配置为主机名称 -->
        <DEVICE sn="standby8">
            <PARAM name="name" value="standby8"/>
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <!-- 如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
            <PARAM name="backIp1" value="192.168.1.108"/>
            <PARAM name="sshIp1" value="192.168.1.108"/>
            <!-- cm -->
            <PARAM name="cmServerPortStandby" value="15000"/>
            <PARAM name="cmDir" value="/openGauss3.1/cluster/cmserver"/>
	</DEVICE>


    </DEVICELIST>
</ROOT>
~~~



检查xml文件里面的端口是否被占用

~~~
lsof -i:15400
lsof -i:15000
~~~

## 下载解压软件包

~~~
mkdir -p /software/unzip
cd /software
wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/3.1.0/x86/openGauss-3.1.0-CentOS-64bit-all.tar.gz
cd unzip
tar -zxvf ../openGauss-3.1.0-CentOS-64bit-all.tar.gz
tar -zxvf openGauss-3.1.0-CentOS-64bit-om.tar.gz
~~~



## 初始化安装环境

创建用户和组（**主节点操作即可**）

~~~shell
groupadd dbgrp
useradd -g dbgrp -d /home/omm -m -s /bin/bash omm
echo test@123|passwd --stdin omm
~~~

预安装

~~~shell
cd /software/unzip/script/
./gs_preinstall -U omm -G dbgrp -X /tmp/8standby.xml --sep-env-file=/home/omm/env

#预安装完整流程
[root@primary script]# ./gs_preinstall -U omm -G dbgrp -X /tmp/8standby.xml --sep-env-file=/home/omm/env
Parsing the configuration file.
Successfully parsed the configuration file.
Installing the tools on the local node.
Successfully installed the tools on the local node.
Are you sure you want to create trust for root (yes/no)?yes
Please enter password for root
Password: 
Successfully created SSH trust for the root permission user.
Setting host ip env
Successfully set host ip env.
Distributing package.
Begin to distribute package to tool path.
Successfully distribute package to tool path.
Begin to distribute package to package path.
Successfully distribute package to package path.
Successfully distributed package.
Are you sure you want to create the user[omm] and create trust for it (yes/no)? yes
Preparing SSH service.
Successfully prepared SSH service.
Installing the tools in the cluster.
Successfully installed the tools in the cluster.
Checking hostname mapping.
Successfully checked hostname mapping.
Creating SSH trust for [omm] user.
Please enter password for current user[omm].
Password: 
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
Distributing trust keys file to all node successfully.
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
Set and check OS parameter.
Setting OS parameters.
Successfully set OS parameters.
Warning: Installation environment contains some warning messages.
Please get more details by "/software/unzip/script/gs_checkos -i A -h primary,standby1,standby2,standby3,standby4,standby5,standby6,standby7,standby8 --detail".
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
Setting Cgroup.
Successfully set Cgroup.
Set ARM Optimization.
No need to set ARM Optimization.
Fixing server package owner.
Setting finish flag.
Successfully set finish flag.
Preinstallation succeeded.
[root@primary script]# 
~~~



安装

~~~shell
su - omm
source /home/omm/env
gs_install -X /tmp/8standby.xml


#安装完整流程
[omm@primary ~]$ gs_install -X /tmp/8standby.xml
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
Please enter password for database:
Please repeat for database:
begin to create CA cert files
The sslcert will be generated in /openGauss3.1/cluster/app/share/sslcert/om
Create CA files for cm beginning.
Create CA files on directory [/openGauss3.1/cluster/app_6ba4c95f/share/sslcert/cm]. file list: ['cacert.pem', 'server.key', 'server.crt', 'client.key', 'client.crt', 'server.key.cipher', 'server.key.rand', 'client.key.cipher', 'client.key.rand']
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
Starting cluster.
======================================================================
Successfully started primary instance. Wait for standby instance.
======================================================================
.
Successfully started cluster.
======================================================================
cluster_state      : Normal
redistributing     : No
node_count         : 9
Datanode State
    primary           : 1
    standby           : 8
    secondary         : 0
    cascade_standby   : 0
    building          : 0
    abnormal          : 0
    down              : 0

Successfully installed application.
end deploy..
[omm@primary ~]$ 
~~~



安装后配置

~~~shell
su - omm
source /home/omm/env
#gsql终端设置
cd
cat >.gsqlrc <<EOF
\set PROMPT1 '%n@%~%R%#'
\pset border 2
EOF
#修改会话超时时间
gs_guc reload -N all -I all -c "session_timeout = 86400s"
gs_om -t restart
#查看集群状态
gs_om -t status --detail
[omm@primary ~]$ gs_om -t status --detail
[  CMServer State   ]

node        node_ip         instance                                      state
---------------------------------------------------------------------------------
1  primary  192.168.1.100   1    /openGauss3.1/cluster/cmserver/cm_server Standby
2  standby1 192.168.1.101   2    /openGauss3.1/cluster/cmserver/cm_server Standby
3  standby2 192.168.1.102   3    /openGauss3.1/cluster/cmserver/cm_server Standby
4  standby3 192.168.1.103   4    /openGauss3.1/cluster/cmserver/cm_server Standby
5  standby4 192.168.1.104   5    /openGauss3.1/cluster/cmserver/cm_server Primary
6  standby5 192.168.1.105   6    /openGauss3.1/cluster/cmserver/cm_server Standby
7  standby6 192.168.1.106   7    /openGauss3.1/cluster/cmserver/cm_server Standby
8  standby7 192.168.1.107   8    /openGauss3.1/cluster/cmserver/cm_server Standby
9  standby8 192.168.1.108   9    /openGauss3.1/cluster/cmserver/cm_server Standby

[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
balanced        : Yes
current_az      : AZ_ALL

[  Datanode State   ]

node        node_ip         instance                      state            
---------------------------------------------------------------------------
1  primary  192.168.1.100   6001 /openGauss3.1/cluster/dn P Primary Normal
2  standby1 192.168.1.101   6002 /openGauss3.1/cluster/dn S Standby Normal
3  standby2 192.168.1.102   6003 /openGauss3.1/cluster/dn S Standby Normal
4  standby3 192.168.1.103   6004 /openGauss3.1/cluster/dn S Standby Normal
5  standby4 192.168.1.104   6005 /openGauss3.1/cluster/dn S Standby Normal
6  standby5 192.168.1.105   6006 /openGauss3.1/cluster/dn S Standby Normal
7  standby6 192.168.1.106   6007 /openGauss3.1/cluster/dn S Standby Normal
8  standby7 192.168.1.107   6008 /openGauss3.1/cluster/dn S Standby Normal
9  standby8 192.168.1.108   6009 /openGauss3.1/cluster/dn S Standby Normal
[omm@primary ~]$ 

#连接数据库
gsql -p 15400 -d postgres -r
#查看数据库版本
[omm@primary ~]$ gaussdb -V
gaussdb (openGauss 3.1.0 build 4e931f9a) compiled at 2022-09-29 14:19:24 commit 0 last mr
openGauss=# select version();
                                                                       version                                                                    
--------------------------------------------------------------------------------------------------------------------------------
 (openGauss 3.1.0 build 4e931f9a) compiled at 2022-09-29 14:19:24 commit 0 last mr   on x86_64-unknown-linux-gnu, compiled by g++ (GCC) 7.3.0, 64-bit
(1 row)
~~~



# 卸载

~~~shell
su - omm
source /home/omm/env
gs_uninstall --delete-data
su - root
source /home/omm/env
cd /software/unzip/script/
./gs_postuninstall -U omm -X /tmp/1standby.xml --delete-user --delete-group -L
unset MPPDB_ENV_SEPARATE_PATH
~~~

