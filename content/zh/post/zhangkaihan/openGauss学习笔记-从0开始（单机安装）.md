    缘起，2021年底有个客户计划采购华为的分布式数据库GuassDB（openGauss），于是去官方翻了翻文档，发现有点难以理解，我本人之前对PG派系的数据库一无所知，看上去就更吃力。后来客户选择了其他厂商的分布式数据库也就没有进行学习研究。
    第二次接触openGauss是通过MogDB的征文活动，不仅可以学习MogDB数据库，还能赚几包烟钱，写了十多篇学习笔记，对MogDB有了一个大致的了解，因为MogDB是openGauss的一个商业发行版本，在学习的时候也去翻阅了一些openGauss的支持，所有也算间接的学习了openGauss。
    第三次接触就是现在和将来，感谢官方推出了这次的征文活动，既可以学习opengauss又可以加深自己对MogDB的了解，学习的过程还能顺便买一包烟。本人也想通过这两次学习，可以进一步学习华为的分布式数据库GuassDB for openGauss。
高可用、高性能、主从、备份恢复等概念所有的关系型数据基本一致，这里学习还是本着先实战再总结的思路出发，附一张我本人openGauss的学习图谱，IT圈子里一直有一个PG和Mysql孰高孰低的讨论，为什么总是对比这两个关系型数据库，个人认为因为他们量级差不多，并且都是开源，很多理念都有一些相同的架构。

![输入图片说明](image.png)

安装企业版
1、准备Linux服务器
    这里就不在赘述Linux的安装和配置了，可以参考《https://www.modb.pro/db/453770》，我的Linux操作系统是CentOS，选择操作系统的时候候去官网查看支持的操作系统。

2、下载openGauss数据库企业版
    下载地址：https://opengauss.org/zh/download.html

3、上传包并解压
[root@localhost ~]# cd /soft/
[root@localhost soft]# ls
openGauss-3.0.0-CentOS-64bit-all.tar.gz
[root@localhost soft]# tar -zxvf openGauss-3.0.0-CentOS-64bit-all.tar.gz 
openGauss-3.0.0-CentOS-64bit-cm.tar.gz
openGauss-3.0.0-CentOS-64bit-om.tar.gz
openGauss-3.0.0-CentOS-64bit.tar.bz2
openGauss-3.0.0-CentOS-64bit-cm.sha256
openGauss-3.0.0-CentOS-64bit-om.sha256
openGauss-3.0.0-CentOS-64bit.sha256
upgrade_sql.tar.gz
upgrade_sql.sha256

4、安装依赖包

yum install libaio-devel flex bison ncurses-devel glibc-devel patch redhat-lsb-core readline-devel libnsl python3

5、关闭防火墙
systemctl status firewalld.service
systemctl stop firewalld.service
systemctl status firewalld.service
systemctl disable firewalld.service
6、禁用selinux

vi /etc/selinux/config
#修改“SELINUX”的值“disabled”
#需要重启生效，也可以使用命令临时生效：setenforce 0

7、配置本机root到root的互信

[root@localhost ~]# ssh-keygen -t rsa
[root@localhost ~]# cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
#使用ssh命令不需要输入密码的时候就表示互信成功
[root@localhost .ssh]# ssh 172.20.10.8
Last login: Wed Sep 14 17:40:53 2022 from opengauss

8、创建安装openGauss的配置文件

#单节点安装
[root@opengauss soft]# cat cluster_config.xml 
<?xml version="1.0" encoding="UTF-8"?>
<ROOT>
    <!-- openGauss整体信息 -->
    <CLUSTER>
        <!-- 数据库名称 -->
        <PARAM name="clusterName" value="dbsingle" />
        <!-- 数据库节点名称(hostname) -->
        <PARAM name="nodeNames" value="opengauss" />
        <!-- 数据库安装目录-->
        <PARAM name="gaussdbAppPath" value="/opt/random/install/app" />
        <!-- 日志目录-->
        <PARAM name="gaussdbLogPath" value="/var/log/omm" />
        <!-- 临时文件目录-->
        <PARAM name="tmpMppdbPath" value="/opt/random/tmp" />
        <!-- 数据库工具目录-->
        <PARAM name="gaussdbToolPath" value="/opt/random/install/om" />
        <!-- 数据库core文件目录-->
        <PARAM name="corePath" value="/opt/random/corefile" />
        <!-- 节点IP，与数据库节点名称列表一一对应 -->
        <PARAM name="backIp1s" value="172.20.10.8"/> 
    </CLUSTER>
    <!-- 每台服务器上的节点部署信息 -->
    <DEVICELIST>
        <!-- 节点1上的部署信息 -->
        <DEVICE sn="opengauss">
            <!-- 节点1的主机名称 -->
            <PARAM name="name" value="opengauss"/>
            <!-- 节点1所在的AZ及AZ优先级 -->
            <PARAM name="azName" value="AZ1"/>
            <PARAM name="azPriority" value="1"/>
            <!-- 节点1的IP，如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
            <PARAM name="backIp1" value="172.20.10.8"/>
            <PARAM name="sshIp1" value="172.20.10.8"/>
               
	    <!--dbnode-->
	    <PARAM name="dataNum" value="1"/>
	    <PARAM name="dataPortBase" value="15400"/>
	    <PARAM name="dataNode1" value="/opt/random/install/data/dn"/>
            <PARAM name="dataNode1_syncNum" value="0"/>
        </DEVICE>
    </DEVICELIST>
</ROOT>

9、解压可执行程序所在的包

tar -zxvf openGauss-3.0.0-CentOS-64bit-all.tar.gz
tar -zxvf openGauss-3.0.0-CentOS-64bit-om.tar.gz
#会解压出script文件夹
10、执行预安装
#进入刚才解压得到的script文件夹cd /soft/script
./gs_preinstall -U omm -G dbgrp -X /soft/cluster_config.xml
#期间只需要输入是否需要创建omm用户，选择yes，并且输入omm的密码
[root@opengauss script]# ./gs_preinstall -U omm -G dbgrp -X /soft/cluster_config.xml
Parsing the configuration file.
Successfully parsed the configuration file.
Installing the tools on the local node.
Successfully installed the tools on the local node.
Setting host ip env
Successfully set host ip env.
Are you sure you want to create the user[omm] (yes/no)? yes
Please enter password for cluster user.
Password: 
Please enter password for cluster user again.
Password: 
Generate cluster user password files successfully.

Successfully created [omm] user on all nodes.
Preparing SSH service.
Successfully prepared SSH service.
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
Please get more details by "/soft/script/gs_checkos -i A -h opengauss --detail".
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

11、执行安装
切换到omm用户,期间要输入数据库的密码
su - omm
[root@opengauss script]# su - omm
Last login: Wed Sep 14 18:50:50 CST 2022
[omm@opengauss ~]$ gs_install
[GAUSS-50001] : Incorrect parameter. Parameter '-X' is required.
[omm@opengauss ~]$ ^C
[omm@opengauss ~]$ gs_install -X /soft/cluster_config.xml 
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
The sslcert will be generated in /opt/random/install/app/share/sslcert/om
NO cm_server instance, no need to create CA for CM.
Cluster installation is completed.
Configuring.
Deleting instances from all nodes.
Successfully deleted instances from all nodes.
Checking node configuration on all nodes.
Initializing instances on all nodes.
Updating instance configuration on all nodes.
Check consistence of memCheck and coresCheck on database nodes.
Configuring pg_hba on all nodes.
Configuration is completed.
Successfully started cluster.
Successfully installed application.
end deploy..
[omm@opengauss ~]$ 

12、连接数据库

[omm@opengauss ~]$ gsql -d postgres -p 15400
gsql ((openGauss 3.0.0 build 02c14696) compiled at 2022-04-01 18:12:34 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=# 
