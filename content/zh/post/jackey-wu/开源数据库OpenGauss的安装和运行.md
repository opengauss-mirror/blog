+++
title = "开源数据库OpenGauss的安装和运行"
date = "2021-12-06"
tags = ["OpenGauss入门"]
archives = "2021-12"
author = "Jackey WU"
summary = "开源数据库OpenGauss的安装和运行"
+++

# 开源数据库OpenGauss的安装和运行

## 安装环境
### OpenGauss版本
openGauss-2.1.0-openEuler-64bit
下载地址：
```
https://opengauss.obs.cn-south-1.myhuaweicloud.com/2.0.1/x86/openGauss-2.1.0-openEuler-64bit.tar.bz2

```

### 虚拟机信息
虚拟机软件：VMware Workstation 16 Player
虚拟机软件版本：16.1.2 build-17966106
虚拟机配置信息：内存8GB、处理器1核、硬盘40GB

![](/figures/1-1.png "虚拟机信息")

### 操作系统信息
openEuler-20.03-LTS
下载链接：
```
https://mirror.iscas.ac.cn/openeuler/openEuler-20.03-LTS/ISO/x86_64/openEuler-20.03-LTS-x86_64-dvd.iso

```

## 安装详细步骤
首先需要说明，这一块儿大部分都没有截图，因为安装OpenGauss已经是很久以前的事情了，下面有的截图也只是后面补截取的。
### 虚拟机准备
本次实验我选择了VMware Workstation 16 Player软件搭建虚拟机，在虚拟机器的准备中，和一般部署虚拟机的操作没有什么区别，资源设定如下：
   内存 8GB
   硬盘 40GB
   处理器内核数量 1个

### 安装openEuler
这里也就是下载好openeuler的完整镜像之后在VM中正常安装即可，安装过程中是有详细的引导的，需要自行操作基本只有分区设置（自动分区）和地区设置，以及用户和密码的设置。
安装完成后以预设用户登录即可。
需要说明的是，我选择了使用无图形界面的openEuler，并通过SSH连接的方式在MobaXterm软件中对服务器（也就是部署好openEuler的虚拟机）进行操作。

![](/figures/1-2.png "安装好的openEuler")

### 系统环境配置
1. **关闭防火墙**
```
[root@node1 ~]# systemctl disable firewalld.service
[root@node1 ~]# systemctl stop firewalld.service
```
2. **关闭selinux**
```
[root@node1 ~]# sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config
```
3. **设置字符集**
```
[root@node1 ~]#cat >> /etc/profile <<EOF
export LANG=en_US.UTF-8
EOF
```
4. **修改地区和时区**
```
[root@node1 ~]# cp /etc/share/zoneinfo/Asia/Shanghai /etc/localtime
```
5. **关闭交换内存**
```
[root@node1 ~]# swapoff -a
```
6. **设置网卡MTU值**
推荐值是8192虚拟机环境是1500可以不修改
```
[root@node1 ~]# ifconfig | grep ens33
   ens33: flags=4163<UP,BROADCAST,RUNNING,MULTICAST> mtu 1500
```
7. **设置root为远程用户**
去掉sshd_config文件（这个文件是关于ssh链接的配置）中PermitRootLogin的注释符#并把no改为yes
```
[root@node1 ~]# vim /etc/ssh/sshd_config
   PermitRootLogin yes
```
8. **操作系统参数设置**
```
[root@node1 ~]# cat >> /etc/sysctl.conf <<EOF
   net.ipv4.tcp_retrises1=5
   net.ipv4.tcp_syn_retries=5
   net.sctp.path_max_retrans=10
   net.sctp.max_init_retransmits=10
EOF
[root@node1 ~]# echo "* soft nofile 1000000" >> /etc/security/limits.conf
[root@node1 ~]# echo "* hard nofile 1000000" >> /etc/security/limits.conf
[root@node1 ~]# echo "* soft nprc 60000" >> /etc/security/limits.d/90-nproc.conf
```
9. **修改主机名**
```
[root@node1 ~]# echo "node1" > /etc/hostname
[root@node1 ~]# echo "192.168.111.132 node1" >>/etc/hosts
```
10. **重启**
```
[root@node1 ~]# reboot
```

### 安装openGauss
1. **创建配置文件**
```
[root@node1 ~]# vim /opt/clusterconfig.xml
```
以下为预先编辑好的配置文件内容，我通过WinSCP直接进行了修改和覆盖（最开始做实验的时候是XShell配合着WinSCP用的）。
<br>![](/figures/1-3.png "配置文件内容")<br>
2. **下载安装包（1.0.0版本）**
<br>下载地址
```
https://opengauss.obs.cn-south-1.myhuaweicloud.com/2.0.1/x86/openGauss-2.1.0-openEuler-64bit.tar.bz2
```
下载完之后提前传到虚拟机中并记录好路径。<br>
3. **创建用户组和目录**
```
[root@node1 ~]# groupadd dbgrp
[root@node1 ~]# useradd -g dbgrp -d /home/omm -m -s /bin/bash omm
[root@node1 ~]# echo "omm" | passwd --stdin omm
[root@node1 ~]# mkdir -p /opt/software/openGauss
[root@node1 ~]# chmod 755 -R /opt/software
[root@node1 ~]# chown -R omm:dbgrp /opt/software/openGauss
```
4. **解压安装包到指定目录**
```
[root@node1 ~]# tar -xvf /mnt/hgfs/share/ openGauss-2.1.0-openEuler-64bit.tar.bz2 /opt/software/openGauss
```
5. **设置lib库**
```
[root@node1 ~]# vim /etc/profile
   export LD_LIBRARY_PATH=/opt/software/openGauss/script/gspylib/clib:$LD_LIBRARY_PATH
```
6. **预安装**
```
[root@node1 ~]# cd /opt/software/script
[root@node1 ~]# python3 gs_preinstall -U omm -G dbgrp -X /opt/clusterconfig.xml
```
之后初始化过程中需要进行交互，具体而言：
   遇到[yes/no]，就选yes；
   让输入root密码，就输入root密码；
   让输入omm密码，就输入omm密码。
Ps：如果在预安装失败 就执行 gs_checkos -i A -h node1 --detail 命令 查看失败原因
7. **安装openGauss**
```
[root@node1 ~]# su - omm
[omm@node1 ~]# gs_install -X /opt/clusterconfig.xml
```
执行的时候需要设置初始密码，复杂度要求和openEuler系统一样比较高，要至少三种字符和最少8个字符。
8. **重启数据库**
```
[root@node1 ~]# su - omm
[omm@node1 ~]# gs_ctl start -D "/opt/huawei/install/data/db1"
```
9. **登录数据库**
```
[root@node1 ~]# gsql -d postgres -p 26000
```

### 基本数据库操作验证
1. **启停数据库**
```
[root@node1 ~]#gs_ctl start -D /opt/huawei/install/data/db1/
[root@node1 ~]#gs_ctl stop -D /opt/huawei/install/data/db1/
```
2. **切换omm系统用户登录数据库**
```
[root@node1 ~]#gs_guc set -N all -I all -h "host all jack 192.168.111.132/32 sha256"
[root@node1 ~]#gsql -d postgres -p 26000 
```
3. **创建用户并赋予用户管理权限**<br>
   i.	创建用户jack 并设置密码为jack@123
   ```
   [root@node1 ~]#create user jackey identified by '123321jackey.';
   ```
   ii.	默认用户没有创建数据库表权限需要修改其权限   
   ```
   [root@node1 ~]#ALTER ROLE gaussadmin SYSADMIN;
   ```

### 通过JDBC执行SQL
1. **JDBC包与驱动类**<br>
在linux服务器端源代码目录下执行build.sh，获得驱动jar包postgresql.jar，包位置在源代码目录下。从发布包中获取，包名为openGauss-x.x.x-操作系统版本号-64bit-Jdbc.tar.gz。<br>
驱动包与PostgreSQL保持兼容，其中类名、类结构与PostgreSQL驱动完全一致，曾经运行于PostgreSQL的应用程序可以直接移植到当前系统使用。<br>
就驱动类而言，在创建数据库连接之前，需要加载数据库驱动类“org.postgresql.Driver”。<br><br>
2. **加载驱动**<br>
在创建数据库连接之前，需要先加载数据库驱动程序。加载驱动有两种方法：<br>
   i.	在代码中创建连接之前任意位置隐含装载：Class.forName(“org.postgresql.Driver”);
   ii.	在JVM启动时参数传递：java -Djdbc.drivers=org.postgresql.Driver jdbctest<br><br>
3. **连接数据库**<br>
在创建数据库连接之后，才能使用它来执行SQL语句操作数据。JDBC提供了三个方法，用于创建数据库连接。<br>
   i.	DriverManager.getConnection(String url);
   ii.	DriverManager.getConnection(String url, Properties info);
   iii.	DriverManager.getConnection(String url, String user, String password);<br><br>
4. **示例：基于openGauss提供的JDBC接口连接数据库。**<br>
![](/figures/1-4.png "使用JDBC接口连接数据库")
![](/figures/1-5.png "使用JDBC接口连接数据库")
 
## 遇到的问题和解决办法
1. **通过SSH连接虚拟机进行操作时提示access denied无法成功连接**<br>
![](/figures/1-6.png "access denied")
这个问题很早就出现过，我最开始考虑的自然是密码输错了，后来查阅资料发现是前面提到过的sshd_config文件的配置有问题，主要是这几个点：<br>
   UsePAM yes #需要打开
   PasswordAuthentication yes #需要打开
   ChallengeResponseAuthentication no #需要打开<br>
在修改之后自然也就得到了解决，能够顺利进行下去。<br>
但是值得一说的是，最近写报告的时候想着要截图放报告里，结果发现又连接不上了，还是同样的SSH访问提示access denied拒绝访问，我首先就检查了/etc/ssh/sshd_config文件，发现UsePAM yes 变成了UsePAM no，据网上的说法是和修改过系统密码有关，总之我是把no又改回了yes，但是这次却无法解决问题，直到目前我也无法重新通过SSH连上虚拟机。<br><br>
2. **用户组部署出错**<br>
如前面所说，数据库安装完成后，默认生成名称为postgres的数据库。第一次连接数据库时，通过gsql -d postgres -p 26000命令（其中postgres为需要连接的数据库名称，26000为数据库主节点的端口号，即XML配置文件中的dataPortBase的值）就可以连接到此数据库。<br>
如果成功连接则会显示类似如下的信息。
```
gsql ((openGauss x.x.x build 290d125f) compiled at 2021-03-08 02:59:43 commit 2143 last mr 131
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.
```
但我当时多次尝试后其实并没有成功，所以我参考了opengauss松鼠会的技术人员撰写的安装脚本，对照着修改了用户组部署那一部分的内容，最后问题得到了解决，能够正常安装完成并得到上述信息验证。

## References & Thanks
<https://developer.huaweicloud.com/hero/forum.php?mod=viewthread&tid=121436>;
<https://opengauss.org/zh/docs/2.1.0/docs/installation/installation.html>.
