+++

title = "在x86_64架构+VMware16.2.3 Pro+openEuler20.3-LTS上快速部署openGauss 3.1.1企业版数据库指导手册" 

date = "2023-02-11"

tags = ["VMware", "openEuler","PostgreSQL", "openGauss", "openGauss安装部署"]

archives = "2023-02"

author = "flydreamfishymy"

summary = "在x86_64架构+VMware16.2.3 Pro+openEuler20.3-LTS上快速装部署openGauss 3.1.1企业版数据库指导手册"

img = "/zh/post/flydreamfishymy/title/马到成功.png" 

times = "12:30"

+++

# 在x86_64架构+VMware16.2.3 Pro+openEuler20.3-LTS上快速部署openGauss 3.1.1企业版数据库指导手册

## 0. 前言
openGauss是关系型数据库，采用客户端/服务器，单进程多线程架构，支持单机和一主多备部署方式，备机可读，支持双机高可用和读扩展。但openGauss 部署对于进一步学习带来了困难。通过学习并参考整理一份快速部署指导手册，以方便大家进一步学习与提高。
![image.png](images/openGauss/快速部署openGauss311.png)
## 1. openGauss企业版数据库安装
### 1.1~1.6请参考
https://my.oschina.net/flydreamfish/blog/7679500
### 1.7 openGauss的安装
#### 步骤1、软硬件环境要求。
(1)硬件环境要求
 ![image.png](images/openGauss/hardware.png)
(2)软件环境要求
 ![image.png](images/openGauss/software.png)
●openEuler-20.03-LTS操作系统
为了操作方便，可以使用SSH工具（比如：XSHELL或PuTTY等）从本地电脑通过配置ens33网卡的IP地址（如：192.168.138.152）来连接虚拟机，并使用ROOT用户来登录。Xshell工具中通过uname -r查看系统内核版本，通过cat /etc/os-release查看openEuler版本信息，执行“hostname”确认服务器用户名（本案例为host1），执行“ip addr”确认IP地址（本案例为192.168.138.152）。
```
[root@host1 ~]# cat /etc/os-release
NAME="openEuler"
VERSION="20.03 (LTS)"
ID="openEuler"
VERSION_ID="20.03"
PRETTY_NAME="openEuler 20.03 (LTS)"
ANSI_COLOR="0;31"
[root@host1 ~]# uname -r
4.19.90-2003.4.0.0036.oe1.x86_64
[root@host1 ~]# hostname
host1
[root@host1 ~]# ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
  …….
2: ens33: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 00:0c:29:69:41:4b brd ff:ff:ff:ff:ff:ff
    inet 192.168.138.152/24 brd 192.168.138.255 scope global dynamic noprefixroute ens33
       valid_lft 1556sec preferred_lft 1556sec
    inet6 fe80::511c:27eb:97cd:4298/64 scope link noprefixroute 
       valid_lft forever preferred_lft forever
………
[root@host1 ~]# ifconfig
ens33: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.138.152  netmask 255.255.255.0  broadcast 192.168.138.255
        inet6 fe80::511c:27eb:97cd:4298  prefixlen 64  scopeid 0x20<link>
       …………
lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
```
  
#### 步骤2、建立autoinstall.sh文件。

用Vi在/root目录下建立autoinstall.sh文件

在 Xshell工具中执行“ vi  /root/autoinstall.sh”，输入“i”切换到INSERT模式，复制如下内容后，右击粘贴到终端，粘贴完成后，按上一步查到的**主机名、IP和想要安装的openGauss版本【如修改为3.1.1。从测试来看，目前可以安装发布以来到3.1.1的任何版本】进行三项(host1、192.168.138.152，2.1.0)**修改，然后按下ESC键退出INSERT模式，输入“:wq”保存并退出文档。
```
[root@host1 ~]#vi  /root/autoinstall.sh
 #!/bin/bash 
####################################################################################################################################
## Author：  flydreamfishymy                                                                                                              
## Date：    2022-01-13                                                                                                          
## OS:       openEuler-20.03-LTS[最小硬件配置：2*CPU (1 core)2.0GHz/4G内存/10G硬盘]                                               
## Database：openGauss-X.X.X-openEuler-64bit-all.tar企业版                                                                        
## Description：一键式实现 openEuler-20.03-LTS环境配置+openGauss-X.X.X-openEuler-64bit软件安装。
## Tips:     请确保操作系统可以连接外网                                                                                           
####################################################################################################################################
##一、安装前的准备                                                                                                               
##准备软硬件安装环境                                                                                                             
##硬件要求最小配置：2*CPU (1 core)2.0GHz/4G内存/10G硬盘]；                                                                        
##软件要求：操作系统 openEuler-20.03-LTS准备；获取openGauss安装包。                                                               
##          linux、工具bzip2、Python3(openEuler 20.03LTS：Python 3.7.X;CentOS 7.6：Python 3.6.X,python需要通过--enable-shared方式编译)        
##1.定义主机信息、安装的openGauss位置、配置文件、版本以及要安装的openGauss下载URL【请根据实际情况修改】；
##2.设置主机名并配置hosts文件；3.关闭操作系统防火墙；4. 检查主机信息                                                                                                               
####################################################################################################################################

##1.定义主机信息、安装的openGauss、位置、配置文件、版本以及要安装的openGauss下载URL【请根据实际情况修改】
export MY_HOSTNAME=host1
export MY_HOSTIP=192.168.138.152
export MY_SOFTWARE_DIRECTORY=/opt/software
export MY_openGauss_DIRECTORY=/opt/software/openGauss
export MY_openGauss_XML=/opt/software/openGauss/clusterconfig.xml
export MY_openGauss_Version=2.1.0
export openGauss_Download_url=https://opengauss.obs.cn-south-1.myhuaweicloud.com/$MY_openGauss_Version/x86_openEuler/openGauss-$MY_openGauss_Version-openEuler-64bit-all.tar.gz 
echo "1.Define Host info completed."
echo -e "\n"

##2. 设置主机名、IP并配置hosts文件
hostnamectl set-hostname $MY_HOSTNAME
sed -i '/$MY_HOSTIP/d' /etc/hosts
echo "$MY_HOSTIP  $MY_HOSTNAME   #Gauss OM IP Hosts Mapping" >> /etc/hosts
cat /etc/hosts
echo "2.Configure /etc/hosts ，Gauss OM IP Hosts Mapping completed."
echo -e "\n"

## 3. 关闭SELINUX及关闭防火墙
##目前仅支持在防火墙关闭的状态下进行安装。
sed -i '/^SELINUX=/d' /etc/selinux/config
echo "SELINUX=disabled">>/etc/selinux/config
cat /etc/selinux/config|grep "SELINUX=disabled"
systemctl disable firewalld.service
systemctl stop firewalld.service
echo "Firewalld"`systemctl status firewalld|grep Active`
echo "3.Disable  SELINUX  and firewalld service completed."
echo -e "\n"
 
## 4. 检查主机信息
##root登录到openEuler，查看系统Linux内核版本和openEuler 20.03 LTS的版本信息为确保成功安装
##检查主机名，hostname与/etc/hostname是否一致。
##预安装过程中，会对hostname进行检查。
uname -r
cat /etc/hosts
hostname
echo "4.List Linux kernel and  os-release info ，Check  hostname infocompleted."
echo -e "\n"

####################################################################################################################################
##二、安装准备                                                                                                                     
##5.设置字符集参数及环境变量；6.设置操作系统时区和时间；7.关闭swap交换内存(可选）; 8.设置网卡MTU值; 
##9. 关闭virbr0网卡 [centos 7.8]；10. 关闭RemoveIPC[Only for openEuler]；11.关闭HISTORY记录(可选，建议不关);                                                                    
##12. 设置root用户远程登录、配置SSH服务及修改Banner配置;13. 创建用户和用户组(此步省略)                                                                  
####################################################################################################################################

## 5. 设置字符集参数及环境变量
cat >>/etc/profile<<EOF
export LANG=en_US.UTF‐8
export packagePath=$MY_openGauss_DIRECTORY
EOF
source /etc/profile
cat >>/etc/profile<<EOF
export LD_LIBRARY_PATH=$packagePath/script/gspylib/clib:
EOF
source /etc/profile
echo $LANG
echo $LD_LIBRARY_PATH
echo "5.Configure encoding and Environment variables completed."
echo -e "\n"

## 6. 设置操作系统时区和时间
##将各数据库节点的时区设置为相同时区，
##可以将/usr/share/zoneinfo/目录下的时区文件拷贝为/etc/localtime文件，
##若只有一个节点该步可省略，保持默认时区Asia/Shanghai。
##/$地区/$时区为需要设置时区的信息，例如：/Asia/Shanghai。
##使用date -s命令将设置服务器时间，例：date -s "2022/10/03 19:39:20"
rm -fr /etc/localtime
ln -s /usr/share/zoneinfo/Asia/Shanghai  /etc/localtime
date -R
hwclock
echo "6.Configure Timezone completed."
echo -e "\n"

##7.关闭swap交换内存 (可选）
##[对于2G内存的设备，建议待安装完毕后再打开SWAP以间接 “扩容内存容量”]
##闭swap交换内存是为了保障数据库的访问性能，避免把数据库的缓冲区内存淘汰到磁盘上。 
##如果服务器内存比较小，内存过载时，可打开swap交换内存保障正常运行。
sed -i '/swap/s/^/#/' /etc/fstab
swapoff -a
free -m
echo "7.Close swap partition completed."
echo -e "\n"

## 8. 设置网卡MTU值。
##MTU值推荐8192，要求不小于1500
ifconfig | grep mtu
ifconfig ens33 mtu 8192
cat >>/etc/sysconfig/network-scripts/ifcfg-ens33<<EOF
MTU="8192"
EOF
nmcli c reload /etc/sysconfig/network-scripts/ifcfg-ens33
ifconfig | grep mtu
echo "8.Set Netcard ens33 mtucompleted."
echo -e "\n"

## 9.关闭virbr0网卡 [centos 7.8]
## ifconfig virbr0 down
##systemctl disable libvirtd.service
## echo "9.Net device virbr0 is disabled."
##echo -e "\n"

## 10. 关闭RemoveIPC[Only for openEuler]
##CentOS操作系统无该参数，可以跳过该步骤
sed -i '/^RemoveIPC/d' /etc/systemd/logind.conf
sed -i '/^RemoveIPC/d' /usr/lib/systemd/system/systemd-logind.service
echo "RemoveIPC=no"  >> /etc/systemd/logind.conf
echo "RemoveIPC=no"  >> /usr/lib/systemd/system/systemd-logind.service
systemctl daemon-reload
systemctl restart systemd-logind
loginctl show-session | grep RemoveIPC
systemctl show systemd-logind | grep RemoveIPC
echo "10.Disable RemoveIPC completed."
echo -e "\n"

## 11. 关闭HISTORY记录(可选，建议安装完成后再修改)
##为避免指令历史记录安全隐患，需关闭各主机的history指令。
##为了使用Xshell,建议跳过这步
#sed -i '/^HISTSIZE=/d' /etc/profile
#echo "HISTSIZE=0" >> /etc/profile
#cat /etc/profile|grep "HISTSIZE=0"
#source /etc/profile
#echo "11.Disable HISTORY record completed."
#echo -e "\n"

## 12. 设置root用户远程登录、配置SSH服务及修改Banner配置
##在openGauss安装时需要root帐户远程登录访问权限，
##数据库需要root互信时才开启远程连接。
##配置SSH服务，关闭Banner，允许root远程登录
sed -i '/Banner/s/^/#/'  /etc/ssh/sshd_config
sed -i '/PermitRootLogin/s/^/#/'  /etc/ssh/sshd_config
echo -e "\n" >> /etc/ssh/sshd_config
echo "Banner none " >> /etc/ssh/sshd_config
echo "PermitRootLogin yes" >> /etc/ssh/sshd_config
cat /etc/ssh/sshd_config |grep -v ^#|grep -E 'PermitRoot|Banner'
systemctl restart sshd.service
echo "12.Configure SSH Service and RootLogin completed."
echo -e "\n"

## 13. 创建用户和用户组(此步省略)
##为了实现安装过程中安装帐户权限最小化，
##及安装后openGauss的系统运行安全性，安装脚本在安装过程中会自动按照用户指定内容创建安装用户，
##并将此用户作为后续运行和维护openGauss的管理员帐户。
##在安装openGauss过程中运行“gs_preinstall”时，
##会创建与安装用户同名的数据库用户，即数据库用户omm。
##此用户具备数据库的最高操作权限，此用户初始密码由用户指定。
#groupadd dbgrp 
#useradd -g dbgrp omm
#echo 'omm@123' | passwd --stdin omm
#echo "13.Creat user and usergroup completed."
#echo -e "\n"

####################################################################################################################################
##三、安装openGauss
##14.创建安装目录；15.创建XML配置文件；16.配置YUM源、软件依赖包yum环境检查与安装;
##17.配置操作系统参数sysctl.conf 和 performance.sh；18.配置资源限制；
##19.Network Time Service（ntp）服务开机自启设置；20.关闭透明大页[Only for CentOS]；
##21.修改默认Python3版本；22.获取安装包并解压安装包；23.执行gs_preinstall准备好安装环境及检查预安装环境；
##24.执行gs_install进行安装；25.清理软件安装包初始化数据库；26.（可选）设置备机可读
####################################################################################################################################

##14.创建安装目录；
##以root用户登录待安装openGauss的任意主机，按规划创建存放安装包的目录并修改权限
echo "Begin to Set openGauss Directory and Modify directory permissions:"
mkdir -p $MY_openGauss_DIRECTORY
chmod 755 -R $MY_SOFTWARE_DIRECTORY
echo "14.Set openGauss Directory and  Modify directory permissions completed."
echo -e "\n"

## 15. 配置XML文件
rm -fr $MY_openGauss_XML
cat >> $MY_openGauss_XML <<EOF
<?xml version="1.0" encoding="UTF-8"?> 
<!-- 配置数据库名称及各项目录 -->
<ROOT> 
    <!-- 整体信息 --> 
    <CLUSTER> 
    <!-- 数据库名称 --> 
        <PARAM name="clusterName" value="dbCluster" /> 
    <!-- 数据库节点名称 （hostname）--> 
        <PARAM name="nodeNames" value="$MY_HOSTNAME" /> 
     <!--数据库节点IP （hostIP）-->    
       <PARAM name="backIp1s" value="$MY_HOSTIP"/> 
     <!-- 数据库安装目录--> 
        <PARAM name="gaussdbAppPath" value="/opt/gaussdb/app" />  
     <!-- 数据库日志目录--> 
        <PARAM name="gaussdbLogPath" value="/var/log/gaussdb" />  
     <!-- 数据库工具目录--> 
        <PARAM name="gaussdbToolPath" value="/opt/gaussdb/om" />  
     <!-- 数据库临时文件目录--> 
        <PARAM name="tmpMppdbPath" value="/opt/gaussdb/tmp"/>   
     <!-- 数据库core文件目录--> 
        <PARAM name="corePath" value="/opt/gaussdb/corefile"/>  
     <!-- 单一clusterType--> 
        <PARAM name="clusterType" value="single-inst"/> 
    </CLUSTER> 
 <!-- 配置Host基本信息：每台服务器上的节点部署信息 --> 
    <DEVICELIST> 
        <!-- 节点1上的部署信息 --> 
        <DEVICE sn="1000001"> 
        <!-- 节点1的主机名称 -->
            <PARAM name="name" value="$MY_HOSTNAME"/> 
        <!-- 节点1所在的AZ及AZ优先级 -->
            <PARAM name="azName" value="AZ1"/> 
            <PARAM name="azPriority" value="1"/> 
        <!-- 节点1的IP，如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP --> 
            <PARAM name="backIp1" value="$MY_HOSTIP"/> 
            <PARAM name="sshIp1" value="$MY_HOSTIP"/> 
  <!-- 配置数据库主节点信息 -->           
         <!--dbnode-->
             <PARAM name="dataNum" value="1"/> 
         <!--数据库端口号-->
             <PARAM name="dataPortBase" value="26000"/> 
         <!--数据库主节点上的数据目录，及备机数据目录-->
             <PARAM name="dataNode1" value="/gaussdb/data/$MY_HOSTNAME"/> 
        </DEVICE> 
    </DEVICELIST> 
</ROOT>
EOF
cat $MY_openGauss_XML
echo "15.Configure XML file completed."
echo -e "\n"


##16.配置YUM源、软件依赖包yum环境检查与安装
mv /etc/yum.repos.d/openEuler_x86_64.repo /etc/yum.repos.d/openEuler_x86_64.repo.bak
curl -o /etc/yum.repos.d/openEuler_x86_64.repo https://mirrors.huaweicloud.com/repository/conf/openeuler_x86_64.repo
yum clean all   #清除所有 yum 缓存
#rpm -q libaio-devel  flex  bison  ncurses-devel  glibc-devel  patch  redhat-lsb-core  readline-devel libnsl net-tools tar
yum install -y libaio* flex bison ncurses-devel glibc-devel patch readline-devel libnsl* net-tools tar
#yum install -y libaio-devel flex bison ncurses-devel glibc-devel patch redhat-lsb-core  readline-devel libnsl net-tools tar
yum install -y bzip2 python3

echo "16.Configure Install Packages andCheck Packages  completed."
echo -e "\n"


## 17. 配置操作系统参数
##配置 sysctl.conf 和 performance.sh
cat >> /etc/sysctl.conf << EOF
net.ipv4.tcp_retries1 = 5
net.ipv4.tcp_syn_retries = 5
net.sctp.path_max_retrans = 10
net.sctp.max_init_retransmits = 10
EOF
sysctl -p
lsmod |grep sctp
yum -y install lksctp*
modprobe sctp
sysctl -p
sed -i '/vm.min_free_kbytes/s/^/#/' /etc/profile.d/performance.sh   ## Only for openEuler
cat /etc/profile.d/performance.sh|grep vm.min_free_kbytes
echo "17.Configure sysctl.conf and performance.sh  completed."
echo -e "\n"

## 18. 配置资源限制
ulimit -a
echo "* soft stack 3072" >>/etc/security/limits.conf
echo "* hard stack 3072" >>/etc/security/limits.conf
echo "* soft nofile 1000000" >>/etc/security/limits.conf
echo "* hard nofile 1000000" >>/etc/security/limits.conf
echo "* soft nproc unlimited" >>/etc/security/limits.d/90-nproc.conf
tail -n 4 /etc/security/limits.conf
tail -n 1 /etc/security/limits.d/90-nproc.conf
ulimit -s 3072
ulimit -n 1000000
ulimit -u unlimited
ulimit -a
echo "18.Configure resource limits completed."
echo -e "\n"

##  19.Network Time Service（ntp）服务开机自启设置
##systemctl status ntpd
yum install -y ntp
systemctl status ntpd
systemctl start ntpd
systemctl enable ntpd
systemctl status ntpd
echo "19.Set Network Time Service（ntp）self start  completed."
echo -e "\n"

## 20. 关闭透明大页[Only for CentOS]
<<COMMENT
cat >>/etc/rc.d/rc.local<<EOF
if test -f /sys/kernel/mm/transparent_hugepage/enabled; then
   echo never > /sys/kernel/mm/transparent_hugepage/enabled
fi
if test -f /sys/kernel/mm/transparent_hugepage/defrag; then
   echo never > /sys/kernel/mm/transparent_hugepage/defrag
fi
EOF
chmod +x /etc/rc.d/rc.local
/usr/bin/sh /etc/rc.d/rc.local
cat /sys/kernel/mm/transparent_hugepage/enabled
cat /sys/kernel/mm/transparent_hugepage/defrag
COMMENT
echo "20.Close transparent_hugepage completed."
echo -e "\n"

## 21. 修改默认Python3版本
python -V
mv /usr/bin/python  /usr/bin/python.bak
ln -s /usr/bin/python3 /usr/bin/python
#sed -i 's/if not pythonVersion == (3, 6):/if not pythonVersion >= (3, 6):/' gspylib/common/CheckPythonVersion.py
python -V
echo "21.Change default Python version completed."
echo -e "\n"

##22.获取安装包并解压安装包：
##获取openGauss安装包，或提前下载好安装包，用Xftp上传到位置$MY_openGauss_DIRECTORY。
##在安装包所在的目录下，解压安装包
echo "Begin to Download and  Uncompress openGauss Package:"
cd $MY_openGauss_DIRECTORY
wget $openGauss_Download_url
tar -zxvf  *all.tar.gz
tar -zxvf  *om.tar.gz
ls
echo "22.openGauss  Package download and  Uncompresscompleted."
echo -e "\n"

## 23. 执行gs_preinstall准备好安装环境及检查预安装环境
echo "Begin to execute openGauss preinstall:"
cd $MY_openGauss_DIRECTORY
python $MY_openGauss_DIRECTORY/script/gs_preinstall -U omm -G dbgrp -X $MY_openGauss_XML
echo "Begin to Check OS environment:"
 $MY_openGauss_DIRECTORY/script/gs_checkos -i A -h $MY_HOSTNAME --detail
echo "23.openGauss preinstall and Check os completed."
echo -e "\n"

## 24. 执行gs_install进行安装
echo "Begin to execute openGauss install:"
touch /home/omm/install_db
cat >> /home/omm/install_db <<EOF
source ~/.bashrc
gs_install -X  $MY_openGauss_XML --gsinit-parameter="--encoding=UTF8"  --dn-guc="max_process_memory=4GB" --dn-guc="shared_buffers=128MB" --dn-guc="bulk_write_ring_size=128MB" --dn-guc="cstore_buffers=16MB"
EOF
chown -R omm:dbgrp /home/omm/install_db
su - omm -c "sh /home/omm/install_db"
echo "24.openGauss install completed."
echo -e "\n"

## 25. 清理软件安装包
echo "Begin Clear the openGauss installation package:"
ll $MY_openGauss_DIRECTORY -al
rm -rf $MY_openGauss_DIRECTORY/openGauss-$MY_openGauss_Version-openEuler-64bit-all.tar.gz
rm -rf $MY_openGauss_DIRECTORY/openGauss-$MY_openGauss_Version-openEuler-64bit-om.tar.gz
ll $MY_openGauss_DIRECTORY -al
echo "25.Clear the openGauss installation package completed."
echo -e "\n"


## 安装完毕！
echo "openGauss Install completed congratulations"
echo "Congratulations!!!"
```
#### 步骤3、一键部署openGauss3.1.1。
运行“autoinstall.sh” 文件，完成一键部署openGauss3.1.1。在执行过程中，用户根据提示选择是否创建互信，并输入操作系统omm用户的密码。
```
[root@ host1 ~]# sh /root/autoinstall.sh
…..
Parsing the configuration file.
Successfully parsed the configuration file.
Installing the tools on the local node.
Successfully installed the tools on the local node.
Setting pssh path
Successfully set core path.
Are you sure you want to create the user[omm] and create trust for it (yes/no)? yes
Please enter password for cluster user.
Password: 
Please enter password for cluster user again.
Password: 
Successfully created [omm] user on all nodes.
Preparing SSH service.
Successfully prepared SSH service. 
Please enter password for database:
Please repeat for database:
………..
25.Clear the openGauss installation package completed.
openGauss Install completed congratulations
Congratulations!!!"
```
期间需要创建操作系统omm用户及设置密码（如密码：openGauss@123），输入操作数据库的omm密码（如密码：openGauss@123）。
#### 步骤4、打开swap交换内存。
[对于2G内存的设备，建议待安装完毕后再打开SWAP以间接 “扩容内存容量”]
关闭swap交换内存是为了保障数据库的访问性能，避免把数据库的缓冲区内存淘汰到磁盘上。 如果服务器内存比较小，内存过载时，可打开swap交换内存保障正常运行。
```
[root@host1 ~]# swapon -a
```
数据库安装结束。

##2. 3. 4.参考
https://my.oschina.net/flydreamfish/blog/7684590
##5.卸载openGauss
卸载openGauss的过程包含卸载openGauss和对openGauss服务器的环境做清理。
### 5.1 执行卸载
openGauss提供了卸载脚本帮助用户完整的卸载openGauss，使用gs_uninstall卸载openGauss。
### 5.2 操作步骤
以操作系统用户omm登录数据库主节点，使用gs_uninstall卸载openGauss。
#### (1)、卸载openGauss
```
[root@host1 ~]# su – omm
[omm@host1 ~]$ gs_uninstall --delete-data # 卸载集群所有数据库
[omm@host1 ~]$ gs_uninstall --delete-data -L # 仅卸载本地数据库
# 如果卸载失败请根据“$GAUSSLOG/om/gs_uninstall-YYYY-MM-DD_HHMMSS.log”中的日志信息排查错误。
[omm@host1 ~]#exit
```
#### (2)、清理环境
在openGauss卸载完成后，如果不需要在环境上重新部署openGauss，可以运行脚本gs_postuninstall对openGauss服务器上环境信息做清理。openGauss环境清理是对环境准备脚本gs_preinstall所做设置的清理。
前提条件：openGauss卸载执行成功；root用户互信可用
操作步骤: 
<1> 确保 root 用户 SSH 互信
<2> 执行清理脚本，如下：
```
[root@host1 ~]$ cd /opt/software/openGauss/script
[root@host1 ~]$./gs_postuninstall -U omm -X /opt/software/open.xml --delete-user --delete-group
[root@host1 ~]$../gs_postuninstall -U omm -X /opt/software/openGauss/clusterconfig.xml --delete-user --delete-group -L   ## 仅清理本地环境
## 若为环境变量分离的模式安装的集群需删除之前source的环境变量分离的env参数
```
<3> 删除 root 的 SSH 互信，并删除 ENVFILE 环境变量：```
```
unset MPPDB_ENV_SEPARATE_PATH
```
注意：若是共用的环境，需要加入--sep-env-file
## 参考资料：

###[1]、openGauss
openGauss  https://www.opengauss.org/zh
###[2]、一键部署openGauss2.0.0-贾军锋
https://www.opengauss.org/zh/blogs/jiajunfeng/%E4%B8%80%E9%94%AE%E9%83%A8%E7%BD%B2openGauss2-0-0.html
###[3]、猿创征文｜国产数据库-基于openEuler环境的opengauss企业版安装以及安装警告解决
https://blog.csdn.net/xust_Hankey/article/details/127153396
###[4]、手把手教你安装openGauss 3.1.0
https://cdn.modb.pro/db/545504#2_399

