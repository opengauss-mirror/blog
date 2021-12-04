\+++

title = "openGauss安装与使用"

date = "2021-12-4"

tags = ["openGauss开发入门"]

archives = "2021-12"

author = "foreverdragon"

summary = "openGauss的安装与使用的"

img = "/zh/post/foreverdragon/title/title1.jpg"

times = "19:20"

\+++

**一、opengauss数据库安装：**

1.1实验环境：Virtual BOX 6.1.26+centos 7.8+openGauss1.1.0

1.2虚拟机Virtual BOX安装：

在virtualbox.org/wiki/Downloads上下载WINDOS
hosts版本的安装包并安装（全部下一步默认安装）

![](media/2897e5d2e80f1355a5b12fd9ad7dd511.png)

1.3Centos7.8镜像下载

在华为开源镜像站下载：<https://mirrors.huaweicloud.com/centos-vault/7.8.2003/isos/x86_64/>

![](media/eb0b6463c550ce32bb7c57be4a305be6.png)

1.4在virtualbox上安装centos7.8

①新建虚拟机：  
![](media/350d9e06fecc01aa00cc57781bb16886.png)

![](media/3dd46b4f5f324aa30da2ac3636237dc2.png)

设置虚拟机并安装：

1.  在系统里修改处理器数量为2，启动顺序为光驱、硬盘

2.  在存储里选择下载的虚拟机的镜像

3.  网络设置：网卡一：仅主机网络，网卡二：网络地址转换

4.  开始启动（选择第一个）

5.  设置分区、在网络选项中如下设置：enp0s3,、enp0s8介如下

![](media/61f6f52d9cbf3ff117ca4ff819e3803a.png)

![](media/211c50736b67aca6eee093b295622585.png)

6软件选择如下：

![](media/c22c65f519cc9e38260e633d20d3a2a1.png)

7创建用户，设置root密码

8进入系统后通过ifconfig和ping命令查看是否联网

1.5操作系统环境准备

①：修改操作系统版本：

[root@db1 \~]\# **vi /etc/redhat-release**

CentOS Linux release \*\*7.6.\*\*2003 (Core

②执行以下二个命令将防火墙关闭，

[root@db1 \~]\# **systemctl stop firewalld.service**

[root@db1 \~]\# **systemctl disable firewalld.service**

Removed symlink /etc/systemd/system/multi-user.target.wants/firewalld.service.

Removed symlink /etc/systemd/system/dbus-org.fedoraproject.FirewallD1.service.

[root@db1 \~]\#

③设置字符集及环境变量。

![](media/baf2664904d1792d50b3f758f5dae03e.png)

④验证变量是否生效。

![](media/0d756cd8a7cbc470362a92066548e838.png)

⑤关闭swap交换内存

![](media/ce24d288e5e88dfef329c87504eb51fc.png)

⑥准备yum环境

先备份一下:

![](media/2f7f6c983d8f33ab61835760430a88f3.png)

⑦下载可用源的repo文件

![](media/859c503011ec793d3e73f1faa536fcc6.png)

查看repo文件内容是否正确：

cat /etc/yum.repos.d/CentOS-Base.repo

⑧：yum安装相关包。

执行以下命令，安装所需的包

yum install -y libaio-devel flex bison ncurses-devel glibc.devel patch
lsb_release wget python3

⑨：设置默认Python版本为3.x。

[root@db1 \~]\# cd /usr/bin

[root@db1 bin]\# mv python python.bak

[root@db1 bin]\# ln -s python3 /usr/bin/python

[root@db1 bin]\# python -V

Python 3.6.8

修改/usr/bin/yum文件，把\#!/usr/bin/python这行修改为\#!/usr/bin/python2.7（或者对应的python
2.x的版本）

用yum -help确定yum是否能用。如下：

![](media/ead7a1208ca580bbe2f34772131aaf49.png)

⑩创建存放数据库安装目录

![](media/196bd6f4f6071e6305e125a9aba74890.png)

11：下载数据库安装包

wget
<https://opengauss.obs.cn-south-1.myhuaweicloud.com/1.1.0/x86/openGauss-1.1.0-CentOS-64bit-all.tar.gz>

结果如下：

![](media/db5239d495b2d10fadcb8f939c7ca7b8.png)

1.6安装opengauss数据库：

1:创建XML配置文件，用于数据库安装

我在这里遇到了问题，无法复制粘贴，也无法输入中文。

解决：我通过安装图形界面解决了粘贴和中文的的问题。

①安装X(X Window System)，命令如下：

yum groupinstall "X Window System"

②安装图形界面软件：

yum groupinstall "GNOME Desktop"

③设置开机自启图形化界面

systemctl get-default

systemctl set-default graphical.target

解决之后可以复制以下内容到/opt/software/openGauss/clusterconfig.xml中

\<?xml version="1.0" encoding="UTF-8"?\>

\<ROOT\>

\<!-- openGauss整体信息 --\>

\<CLUSTER\>

\<PARAM name="clusterName" value="dbCluster" /\>

\<PARAM name="nodeNames" value="**db1**" /\>

\<PARAM name="backIp1s" value="**10.0.3.15**"/\>

\<PARAM name="gaussdbAppPath" value="/opt/gaussdb/app" /\>

\<PARAM name="gaussdbLogPath" value="/var/log/gaussdb" /\>

\<PARAM name="gaussdbToolPath" value="/opt/huawei/wisequery" /\>

\<PARAM name="corePath" value="/opt/opengauss/corefile"/\>

\<PARAM name="clusterType" value="single-inst"/\>

\</CLUSTER\>

\<!-- 每台服务器上的节点部署信息 --\>

\<DEVICELIST\>

\<!-- node1上的节点部署信息 --\>

\<DEVICE sn="1000001"\>

\<PARAM name="name" value="**db1**"/\>

\<PARAM name="azName" value="AZ1"/\>

\<PARAM name="azPriority" value="1"/\>

\<!-- 如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP --\>

\<PARAM name="backIp1" value="**10.0.3.15**"/\>

\<PARAM name="sshIp1" value="**10.0.3.15**"/\>

\<!--dbnode--\>

\<PARAM name="dataNum" value="1"/\>

\<PARAM name="dataPortBase" value="26000"/\>

\<PARAM name="dataNode1" value="/gaussdb/data/**db1**"/\>

\</DEVICE\>

\</DEVICELIST\>

\</ROOT\>

2：将下载好的安装包解压至存放目录。

先解压openGauss-1.1.0-CentOS-64bit-all.tar.gz包。

[root@db1 openGauss]\# **tar -zxvf openGauss-1.1.0-CentOS-64bit-all.tar.gz**

再先解压openGauss-1.1.0-CentOS-64bit-om.tar.gz包。

[root@db1 openGauss]\# **tar -zxvf openGauss-1.1.0-CentOS-64bit-om.tar.gz**

解压后如下，用ls命令查看如下：

[root@db1 openGauss]\# **ls**

clusterconfig.xml openGauss-Package-bak_392c0438.tar.gz

lib script

openGauss-1.1.0- CentOS-64bit-all.tar.gz simpleInstall

openGauss-1.1.0- CentOS-64bit-om.sha256 upgrade_sql.sha256

openGauss-1.1.0- CentOS-64bit-om.tar.gz upgrade_sql.tar.gz

openGauss-1.1.0-CentOS-64bit.sha256 version.cfg

openGauss-1.1.0-CentOS-64bit.tar.bz2

安装包解压后，会在/opt/software/openGauss路径下自动生成script子目录，并且在script目录下生成gs_preinstall等各种OM工具脚本。

更改权限。

[root@db1 openGauss]\# **chmod 755 -R /opt/software**

[root@db1 openGauss]\#

3：执行初始化脚本。

[root@db1 openGauss]\# **cd /opt/software/openGauss/script**

[root@db1 script]\# **python3 gs_preinstall -U omm -G dbgrp -X
/opt/software/openGauss/clusterconfig.xml**

Parsing the configuration file.

Successfully parsed the configuration file.

Installing the tools on the local node.

Are you sure you want to create trust for **root** (yes/no)? **yes**

Please enter password for root.

Password:

Creating SSH trust for the root permission user.

Checking network information.

……………………………………..

Are you sure you want to create the user[**omm**] and create trust for it
(yes/no)? **yes**

Please enter password for cluster user.

Password:

Please enter password for cluster user again.

Password:

Successfully created [omm] user on all nodes.

Preparing SSH service.

Successfully prepared SSH service.

……………………………………..

Successfully set finish flag.

Preinstallation succeeded.

期间需要输入操作系统root用户的密码（如密码：openGauss@123）和创建操作系统omm用户及设置密码（如密码：openGauss@123）。密码依然不回显，直接输入密码并回车即可。

当返回Preinstallation succeeded内容时，表明初始化完成。

4：初始化数据库。

用init 6 重启下虚拟机（主要是为了释放一些内存资源）。

[root@db1 script]\# **init 6**

Connection closing...Socket close.

Connection closed by foreign host.

Disconnected from remote host(ONE) at 10:51:59.

Type \`help' to learn how to use Xshell prompt.

过段时间虚拟机重启好后，再次使用SSH工具（我用的PuTTy）从本地电脑通过配置enp0s3网卡的IP地址（ifconfig指令）（我是**192.168.56.101**）来连接虚拟机，并使用ROOT用户来登录，然后接着以下操作。

![](media/f6a43d559eb5074679405e74158a96f0.png)

![](media/14de59bb91db841057b88f11c2f74f04.png)

先更新下权限。

[root@db1 script]\# **chmod 755 -R /opt/software**

[root@db1 openGauss]\#

然后使用omm用户进行数据库初始化。

注意：根据用户实际内存大小设置对应的共享内存的大小，如果对该参数进行了设置，会在数据库启动时候报错，本实验虚拟机总内存大小是2G。

gs_install -X /opt/software/openGauss/clusterconfig.xml
\--gsinit-parameter="--encoding=UTF8" --dn-guc="max_process_memory=**2GB**"
\--dn-guc="shared_buffers=**128MB**" --dn-guc="bulk_write_ring_size=**128MB**"
\--dn-guc="cstore_buffers=**16MB**"

具体如下：

[root@db1 openGauss]\# **su - omm**

Last login: Thu Sep 10 15:26:21 CST 2020 on pts/0

[omm@db1 \~]\$ **cd /opt/software/openGauss/script**

[omm@db1 script]\$ **gs_install -X /opt/software/openGauss/clusterconfig.xml
\--gsinit-parameter="--encoding=UTF8" --dn-guc="max_process_memory=2GB"
\--dn-guc="shared_buffers=128MB" --dn-guc="bulk_write_ring_size=128MB"
\--dn-guc="cstore_buffers=16MB"**

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

**Please enter password for database:**

**Please repeat for database:**

begin to create CA cert files

The sslcert will be generated in /opt/gaussdb/app/share/sslcert/om

Cluster installation is completed.

Configuring.

………………………….

Successfully started cluster.

Successfully installed application.

end deploy..

注意：输入omm用户密码时，不要输入错误（如密码：openGauss@123）。

结果：

![](media/5d12a280791a40edbad70bb2d69102ba.png)

5：清理软件安装包。

[omm@db1 openGauss]\$ **exit**

logout

[root@db1 script]\# **cd /opt/software/openGauss/**

[root@db1 openGauss]\# **ll**

total 288M

\-rwxr-xr-x. 1 omm dbgrp 1334 Jan 11 11:15 clusterconfig.xml

drwxr-xr-x. 15 root root 4096 Jan 11 11:14 lib

\-rwxr-xr-x. 1 root root 99521627 Dec 31 20:58
openGauss-1.1.0-CentOS-64bit-all.tar.gz

\-rwxr-xr-x. 1 root root 65 Dec 31 20:41 openGauss-1.1.0-CentOS-64bit-om.sha256

\-rwxr-xr-x. 1 root root 13446137 Dec 31 20:41
openGauss-1.1.0-CentOS-64bit-om.tar.gz

\-rwxr-xr-x. 1 root root 65 Dec 31 20:40 openGauss-1.1.0-CentOS-64bit.sha256

\-rwxr-xr-x. 1 root root 87084796 Dec 31 20:40
openGauss-1.1.0-CentOS-64bit.tar.bz2

\-rwxr-xr-x. 1 root root 100584223 Jan 11 11:14
openGauss-Package-bak_392c0438.tar.gz

drwxr-xr-x. 6 root root 4096 Dec 31 20:41 script

drwxr-xr-x. 2 root root 115 Dec 31 20:41 simpleInstall

\-rwxr-xr-x. 1 root root 65 Dec 31 20:40 upgrade_sql.sha256

\-rwxr-xr-x. 1 root root 134579 Dec 31 20:40 upgrade_sql.tar.gz

\-rwxr-xr-x. 1 root root 32 Dec 31 20:40 version.cfg

[root@db1 openGauss]\# **rm -rf openGauss-1.1.0-CentOS-64bit-all.tar.gz**

[root@db1 openGauss]\# **rm -rf openGauss-1.1.0-CentOS-64bit-om.tar.gz**

数据库安装结束。

结果：

![](media/a3a4e53d60c610afaecdef28b073ea9a.png)

1.  通过SSH软件连接使用数据库：

    1.  以操作系统用户omm登录数据库主节点。

    2.  [root@ecs-c9bf script]\# **su - omm**

    3.  若不确定数据库主节点部署在哪台服务器，请确认连接信息。

结果：

![](media/1c6d47d11d8dff2f33758cd97b204ac2.png)

1.  启动服务。

2.  启动服务命令：

3.  [omm@ecs-c9bf \~]\$ **gs_om -t start**

4.  Starting cluster.

5.  =========================================

6.  =========================================

7.  Successfully started.

结果：

![](media/15cac7d59f2d53738e4f61d38cc83cb0.png)

1.  连接数据库。

2.  [omm@ecs-c9bf \~]\$ **gsql -d postgres -p 26000 -r**

3.  当结果显示为如下信息，则表示连接成功。

4.  gsql ((openGauss 1.1.0 build 290d125f) compiled at 2020-05-08 02:59:43
    commit 2143 last mr 131  
    Non-SSL connection (SSL connection is recommended when requiring
    high-security)  
    Type "help" for help.

5.  postgres=\#

6.  其中，postgres为openGauss安装完成后默认生成的数据库。初始可以连接到此数据库进行新数据库的创建。26000为数据库主节点的端口号，需根据openGauss的实际情况做替换，请确认连接信息获取。

7.  **引申信息：**

-   使用数据库前，需先使用客户端程序或工具连接到数据库，然后就可以通过客户端程序或工具执行SQL来使用数据库了。

-   gsql是openGauss数据库提供的命令行方式的数据库连接工具。

结果：

![](media/3b5b635cf4fb86d84ecb63a5e417253f.png)

1.  第一次连接数据库时，需要先修改omm用户密码，新密码修改为Bigdata@123（建议用户自定义密码）。

2.  postgres=\# **alter role omm identified by 'Bigdata@123' replace
    'openGauss@123';**

3.  ALTER ROLE

4.  结果

5.  ![](media/cfc420f0ead7c3b9da63793faa548e9c.png)

    1.  创建数据库用户。

    2.  默认只有openGauss安装时创建的管理员用户可以访问初始数据库，您还可以创建其他数据库用户帐号。

    3.  postgres=\# **CREATE USER joe WITH PASSWORD "Bigdata@123";**

    4.  当结果显示为如下信息，则表示创建成功。

    5.  CREATE ROLE

    6.  如上创建了一个用户名为joe，密码为Bigdata@123的用户。

结果：

![](media/800ce0053fd6ad37a1af6742b3df550a.png)

1.  创建数据库。

2.  postgres=\# **CREATE DATABASE db_tpcc OWNER joe;**

3.  当结果显示为如下信息，则表示创建成功。

4.  CREATE DATABASE

![](media/d16ba2a0c973f956d66cf1e722cd0409.png)

创建完db_tpcc数据库后，就可以按如下方法退出postgres数据库，使用新用户连接到此数据库执行接下来的创建表等操作。当然，也可以选择继续在默认的postgres数据库下做后续的体验。

退出postgres数据库。

postgres=\# **\\q**

使用新用户连接到此数据库。

[omm@ecs-c9bf \~]\$ **gsql -d db_tpcc -p 26000 -U joe -W Bigdata@123 -r**

当结果显示为如下信息，则表示连接成功

gsql ((openGauss 1.1.0 build 290d125f) compiled at 2020-05-08 02:59:43 commit
2143 last mr 131  
Non-SSL connection (SSL connection is recommended when requiring high-security)

Type "help" for help.

db_tpcc=\>

结果：

![](media/b134e24f3616718f1ca20179996fbe60.png)

1.  创建SCHEMA。

2.  db_tpcc=\> **CREATE SCHEMA joe AUTHORIZATION joe;**

3.  当结果显示为如下信息，则表示创建SCHEMA成功。

4.  CREATE SCHEMA

结果：

![](media/75be65536d826719a5c41f4d3c4ad343.png)

1.  创建表。

2.  创建一个名称为mytable，只有一列的表。字段名为firstcol，字段类型为integer。

3.  db_tpcc=\> **CREATE TABLE mytable (firstcol int);**

4.  CREATE TABLE

结果：

![](media/93de1915dbd4c3652d1217a9607c3023.png)

1.  向表中插入数据：

2.  db_tpcc=\> **INSERT INTO mytable values (100);**

3.  当结果显示为如下信息，则表示插入数据成功。

4.  INSERT 0 1

5.  查看表中数据：

6.  db_tpcc=\> **SELECT \* from mytable;**  
    firstcol  
    \----------  
    100  
    (1 row)

结果：

![](media/8783314f00e687f9f650d4ffdf6ddd09.png)

1.  退出postgres数据库。

2.  postgres=\# **\\q**

三、通过jdbc连接使用数据库

1.1环境：

主机（客户端）windows10，虚拟机（服务端）centos 7.8

语言java（JavaSE-13），IDE：Eclipse

1.2使用过程

1.首先加载jdbc驱动从网上下（叫openGauss-1.1.0-JDBC.tar）下下来解压，在eclipse里新建一个项目，创建一个lib文件夹，把刚刚解压的文件复制到lib文件夹下，然后

右击 项目名，依次点击 Build Path \> Configure Build Path…

选中 Libraries，点击右边的按钮 add JARs…

选中复制到项目中的jar包

最后点击 Apply and Close 即可

结果如图：

![](media/24da5fcab619dae18c7ea080ceac3af0.png)

1.  设置数据库的监听地址和端口

gs_guc set -I all -c "listen_addresses='10.0.3.15'"

gs_guc set -I all -c "port='26000'"

![](media/64c9d2d6982720f3f5c0cb899ff7d85c.png)

我选的enp0s8中的ip地址

端口为26000

1.  配置客户端接入认证

gs_guc set -N all -I all -h "host all jack 169.254.54.211/32 sha256"

其中的ip地址为主机的IP

![](media/faa9bf78e7a056df48488167ac27f919.png)

1.  写java程序

//DBtest.java

//演示基于JDBC开发的主要步骤，会涉及创建数据库、创建表、插入数据等。

import java.sql.Connection;

import java.sql.DriverManager;

import java.sql.PreparedStatement;

import java.sql.SQLException;

import java.sql.Statement;

import java.sql.CallableStatement;

public class DBTest {

//创建数据库连接。

public static Connection GetConnection(String username, String passwd) {

String driver = "org.postgresql.Driver";

String sourceURL = "jdbc:postgresql://10.0.3.15:26000/postgres";

Connection conn = null;

try {

//加载数据库驱动。

Class.forName(driver).newInstance();

} catch (Exception e) {

e.printStackTrace();

return null;

}

try {

//创建数据库连接。

conn = DriverManager.getConnection(sourceURL, username, passwd);

System.out.println("Connection succeed!");

} catch (Exception e) {

e.printStackTrace();

return null;

}

return conn;

};

//执行普通SQL语句，创建customer_t1表。

public static void CreateTable(Connection conn) {

Statement stmt = null;

try {

stmt = conn.createStatement();

//执行普通SQL语句。

int rc = stmt

.executeUpdate("CREATE TABLE customer_t1(c_customer_sk INTEGER, c_customer_name
VARCHAR(32));");

stmt.close();

} catch (SQLException e) {

if (stmt != null) {

try {

stmt.close();

} catch (SQLException e1) {

e1.printStackTrace();

e.printStackTrace();

//执行预处理语句，批量插入数据。

public static void BatchInsertData(Connection conn) {

PreparedStatement pst = null;

try {

//生成预处理语句。

pst = conn.prepareStatement("INSERT INTO customer_t1 VALUES (?,?)");

for (int i = 0; i \< 3; i++) {

//添加参数。

pst.setInt(1, i);

pst.setString(2, "data " + i);

pst.addBatch();

}

//执行批处理。

pst.executeBatch();

pst.close();

} catch (SQLException e) {

if (pst != null) {

try {

pst.close();

} catch (SQLException e1) {

e1.printStackTrace();

e.printStackTrace();

//执行预编译语句，更新数据。

public static void ExecPreparedSQL(Connection conn) {

PreparedStatement pstmt = null;

try {

pstmt = conn

.prepareStatement("UPDATE customer_t1 SET c_customer_name = ? WHERE
c_customer_sk = 1");

pstmt.setString(1, "new Data");

int rowcount = pstmt.executeUpdate();

pstmt.close();

} catch (SQLException e) {

if (pstmt != null) {

try {

pstmt.close();

} catch (SQLException e1) {

e1.printStackTrace();

e.printStackTrace();

/\*\*

\* 主程序，逐步调用各静态方法。

\* @param args

\*/

public static void main(String[] args) {

//创建数据库连接。

Connection conn = GetConnection("jack", "Test@123");

//创建表。

CreateTable(conn);

//批插数据。

BatchInsertData(conn);

//执行预编译语句，更新数据。

ExecPreparedSQL(conn);

//关闭数据库连接。

try {

conn.close();

} catch (SQLException e) {

e.printStackTrace();

}

5运行程序

结果：

![](media/f502ae967b86f1b5394c410c21c171ed.png)
