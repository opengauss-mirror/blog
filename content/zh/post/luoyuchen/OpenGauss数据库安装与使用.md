+++

title = "OpenGauss数据库安装与使用" 

date = "2021-11-27" 

tags = ["OpenGauss数据库安装与使用"] 

archives = "2021-11" 

author = "罗宇辰" 

summary = "OpenGauss数据库安装与使用"

img = "/zh/post/luoyuchen/title/1.png" 

times = "13:50"

+++

# OpenGauss数据库安装与使用报告

### 1.获取openGauss安装包

在 https://opengauss.org/zh/download.html 官网上下载安装包

![1.png](../figures/1.png "1")

这里我安装的是极简版。

![2.png](../figures/2.png "2")

### 2.CentOS设置

####1）CentOS版本  
CentOS7
![3.png](../figures/3.png "3")

####2）centos网络连接设置
>cd /etc/sysconfig/network-scripts    #进入网络配置文件目录
ls                                   #找到目录下第一个文件
vi 文件名                            #用vi修改配置

![4.png](../figures/4.png "4")
最后一行改为yes。
>service network restart             #重启网卡，使配置生效

####3）yum安装图形化界面（非必须）
>yum groupinstall -y "GNOME Desktop"

安装完重启。在命令行界面输入
>startx

进入图形化界面。
![5.png](../figures/5.png "5")

####4）配置yum源
![6.png](../figures/6.png "6")
####5）yum安装依赖的软件包
以下环境配置均参考 https://zhuanlan.zhihu.com/p/402928515
>yum install libaio-devel flex bison ncurses-devel glibc-devel patch redhat-lsb-core readline-devel -y

####6）关闭防火墙

>systemctl status firewalld
systemctl disable firewalld.service
systemctl stop firewalld.service 

![7.png](../figures/7.png "7")
####7）关闭SELinux

>sed -i '/SELINUX=/d' /etc/selinux/config
echo "SELINUX=disabled" >> /etc/selinux/config
cat /etc/selinux/config|grep -v ^#|grep -v '^$'

![8.png](../figures/8.png "8")

####8）设置时区

>rm -fr /etc/localtime
ln -s /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
ll /etc/localtime

![9.png](../figures/9.png "9")

####9）关闭swap
修改分区表文件，删除SWAP挂载信息
>cp /etc/fstab  /etc/fstab.bak
sed -i '/swap/s/^/#/' /etc/fstab
cat /etc/fstab|grep -v ^#|grep -v '^$'

关闭swap
>swapoff -a

####10）创建dbgrp的组，创建新用户omm并授权

>groupadd -g 1001 dbgrp
useradd -u 2001 -g dbgrp omm
chown -R omm:dbgrp /opt

####11)配置操作系统内核参数

>cat >> /etc/sysctl.conf << EOF
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

###3.安装OpenGauss
####1）创建用于安装openGauss的文件夹
>mkdir -p /opt/software/openGauss

将本机上下载的xxx.tar.bz2拖动到图形化界面中的任意文件夹
右键打开properties找到压缩包所在位置
![10.png](../figures/10.png "10")

![11.png](../figures/11.png "11")）

解压到创建的文件夹
>cd /home/louie
tar -jxf openGauss-2.0.1-CentOS-64bit.tar.bz2 -C   /opt/software/openGauss/

####2）安装OpenGauss
进入解压好的文件夹中
>cd /opt/software/openGauss/simpleInstall/

根据文件夹中readme文件中的指导开始安装
>sh install.sh -w gauss@123 

极简版采用安装脚本
![12.png](../figures/12.png "12")

####3）安装成功
![13.png](../figures/13.png "13")

###4.OpenGauss使用测试
####1）加入PATH
![14.png](../figures/14.png "14")

####2）连接默认数据库测试
![15.png](../figures/15.png "15")

####3）创建新数据库test（指令后要加分号）
![16.png](../figures/16.png "16")
####4）测试直接建表
![17.png](../figures/17.png "17")
####5）测试使用JDBC连接数据库
Ifconfig命令查找安装opengauss的虚拟机所在IP地址（inet后面的地址）
![18.png](../figures/18.png "18")
根据找到的ip地址修改pg_hba.conf文件
![19.png](../figures/19.png "19")
![20.png](../figures/20.png "20")
在原电脑编写测试连接的java文件，例如openGaussDemo.java
![21.png](../figures/21.png "21")
配置好jdk，解压下载好的jdbc，获得postgresql.jar文件。
将postgresql.jar openGaussDemo.java放在同一文件夹中，在cmd中进入该目录，执行：
>javac -encoding utf-8 -cp d:\Download\postgresql.jar openGaussDemo.java

编译java文件。
再执行：
>java -cp .;D:/Download/postgresql.jar openGaussDemo

运行测试代码。
![22.png](../figures/22.png "22")
连接成功。

###5.过程中遇到的问题
####1）安装step1报错
![23.png](../figures/23.png "23")
解决：不能在root下进行安装。

####2）安装step2报错
![24.png](../figures/24.png "24")
解决：在/etc/sysctl.conf中加入语句kernel.sem = 250 32000 100 999，然后执行sysctl -p。
实际上这个报错是在没有进行系统内核参数修改时出现的，执行完上面centos的环境配置后可以一步到位。

####3）step3报错 
解决：需要用chown -R 用户名:dbgrp /opt授权。

####4）创建用户组dbgrp时报错
![25.png](../figures/25.png "25")
解决：在root下操作

####5）测试新建数据库，发现没完成指令。
解决：sql指令后加分号。

####6）虚拟机卡死
原因：原先设置的分配虚拟机内存为2G，估计是安装了centos的图形化界面，导致卡死。
解决：虚拟机分配4G内存。

####7）jdbc连接虚拟机上的数据库报错：FATAL: Forbid remote connection with trust method!
![26.png](../figures/26.png "26")
解决：参考https://bbs.huaweicloud.com/forum/thread-102401-1-1.html
进入安装目录中/opt/software/openGauss/data/single_node中修改pg_hba.conf 将其中trust改为sha56

