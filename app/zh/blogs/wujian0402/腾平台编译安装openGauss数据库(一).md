---
title: 'openGuass技术文章征集 飞腾平台编译安装openGauss数据库一'
date: '2023-07-20'
category: 'blog'
tags: ['飞腾平台', '编译安装', 'openGauss']
archives: '2023-07'
author: 'wujian0402'
summary: 'openGuass技术文章征集 飞腾平台编译安装openGauss数据库一'
img: ''
times: '16:30'
---


1. 环境检查

   1.1 检查OS版本

  openGauss支持的操作系统：

  CentOS 7.6（x86_64 架构）

  openEuler-20.03-LTS（aarch64 架构）

  openEuler-20.03-LTS（x86_64架构）

  Kylin-V10（aarch64 架构）

  Asianux 7.6（x86_64架构）

  Asianux 7.5（aarch64 架构）

  FusionOS 22 (aarch64 架构)

  FusionOS 22 (x86 架构)

 #cat /etc/os-release 

  NAME="openEuler"

  VERSION="20.03 (LTS-SP3)"

  ID="openEuler"

  VERSION_ID="20.03"

  PRETTY_NAME="openEuler 20.03 (LTS-SP3)"

  ANSI_COLOR="0;31"

  操作系统为openEuler-20.03-LTS（aarch64 架构）

  1.2 检查cpu型号

  lscpu | grep "Vendor ID"

  Vendor ID:                       0x70

  安装平台Vendor ID:0x70为飞腾CPU

  1.3. 禁用防火墙和selinux

  systemctl status firewalld

  systemctl stop firewalld

  systemctl disable firewalld

  systemctl is-enabled firewalld

  禁用SELINUX

/usr/sbin/sestatus -v

  如果selinux为enable状态，则修改/etc/selinux/config文件：

  SELINUX=disabled

  或使用下面命令：

 sed -i '/^SELINUX=.*/ s//SELINUX=disabled/' /etc/selinux/config

  并重启服务器


  1.4 配置yum源并安装依赖包

  上传操作系统iso到/tmp目录

  配置本地yum源

  mkdir /mnt/iso

  mount -o loop /tmp/openeuler20.03LTS.iso /mnt/iso

   cd /etc/yum.repos.d

   vi media.repo

  [InstallMedia]

  name=openeuler20.03LTS

  gpgcheck=0

  enabled=1

  baseurl=file:///mnt/iso

  yum clean all

  yum makecache

  yum list

  yum -y install libaio-devel flex bison ncurses-devel glibc-devel patch openeuler-lsb readline-devel unzip dos2unix vim git wget lrzsz net-tools bzip2 gcc tree zlib*

  1.5 安装Python3

  建议安装Python3.6+

  yum install python3 python3-pip

  连接python命令为python3.7

  ln -s  /usr/bin/python3.7 /usr/bin/python

  python -V

  Python 3.7.9

  1.6 设置字符集参数

  cat>>/etc/profile<<EOF

  export LANG=en_US.UTF-8

  EOF

  1.7 设置时区和时间

  [root@localhost ~] timedatectl set-timezone Asia/Shanghai

  [root@localhost ~] timedatectl status


  2. 下载软件包

  cd /soft2/

  git clone https://gitee.com/opengauss/openGauss-server.git openGauss-server -b 5.0.0

  wget -c https://opengauss.obs.cn-south-1.myhuaweicloud.com/5.0.0/binarylibs/openGauss-third_party_binarylibs_openEuler_arm.tar.gz

  3. 脚本编译安装

  3.1 openGauss-server编译

  tar -xvf openGauss-third_party_binarylibs_openEuler_arm.tar.gz

  mv openGauss-third_party_binarylibs_openEuler_arm binarylibs

  cd openGauss-server/

  sh build.sh  -m debug -3rd /soft/binarylibs -pkg

    显示如下内容，表示编译成功。

  make server(all) package success!

  packaging libpq...

  success!

  packaging tools...

  success!

  Begin to install upgrade_sql files...

  Successfully packaged upgrade_sql files.

  End package opengauss.

  now, all packages has finished!


  生成的安装包会存放在./output目录下。

  编译和打包日志为：./build/script/makemppdb_pkg.log。


  4. 编译后验证

  编译结束后，可按以下方式对编译后的openGauss进行验证:

  4.1 创建用户

  groupadd dbgrp

  useradd omm -g dbgrp

  passwd omm


  4.2 使用omm用户，在~/.bashrc中增加以下环境变量

  su - omm

  vi ~/.bashrc

  export GAUSSHOME=/soft2/openGauss-server/mppdb_temp_install 

  export LD_LIBRARY_PATH=$GAUSSHOME/lib:$LD_LIBRARY_PATH

  export PATH=$GAUSSHOME/bin:$PATH


  使环境变量生效

  $ source .bashrc 

  4.3 建立数据目录和日志目录

  su - root

  chown -R omm:dbgrp /soft2/openGauss-server

  su - omm

  mkdir ~/data

  mkdir ~/log


  4.4 数据库初始化

  su - omm                                   

  $ gs_initdb -D /home/omm/data --nodename=db1 

  The files belonging to this database system will be owned by user "omm".

  This user must also own the server process.

  The database cluster will be initialized with locale "en_US.UTF-8".

  The default database encoding has accordingly been set to "UTF8".

  The default text search configuration will be set to "english".


  fixing permissions on existing directory /home/omm/data ... ok

  creating subdirectories ... in ordinary occasionok

  creating configuration files ... ok

  selecting default max_connections ... 100

    selecting default shared_buffers ... 1024MB

  Begin init undo subsystem meta.

  [INIT UNDO] Init undo subsystem meta successfully.

  creating template1 database in /home/omm/data/base/1 ... The core dump path is an invalid directory

  2023-07-20 16:10:19.012 [unknown] [unknown] localhost 281468516106256 0[0:0#0]  [BACKEND] WARNING:  macAddr is 64174/3171074048, sysidentifier
   
   is 4205755650/3221270315, randomNum is 96513835ok

  initializing pg_authid ... ok

  setting password ... ok

  initializing dependencies ... ok

  loading PL/pgSQL server-side language ... ok

  creating system views ... ok

  creating performance views ... ok

  loading system objects' descriptions ... ok

  creating collations ... ok

  creating conversions ... ok

  creating dictionaries ... ok

  setting privileges on built-in objects ... ok

  initialize global configure for bucketmap length ... ok

  creating information schema ... ok

  loading foreign-data wrapper for distfs access ... ok

  loading foreign-data wrapper for log access ... ok

  loading hstore extension ... ok

  loading foreign-data wrapper for MOT access ... ok

  loading security plugin ... ok

  update system tables ... ok

  creating snapshots catalog ... ok

  vacuuming database template1 ... ok

  copying template1 to template0 ... ok

  copying template1 to postgres ... ok

  freezing database template0 ... ok

  freezing database template1 ... ok

  freezing database postgres ... ok

  WARNING: enabling "trust" authentication for local connections

  You can change this by editing pg_hba.conf or using the option -A, or

  --auth-local and --auth-host, the next time you run gs_initdb.

  Success. You can now start the database server of single node using:

      gaussdb -D /home/omm/data --single_node

  or

      gs_ctl start -D /home/omm/data -Z single_node -l logfile

  


  4.5 启动数据库

  $ gs_ctl start -D /home/omm/data -Z single_node -l /home/omm/log/opengauss.log

  

  启动完毕后可通过 ps -ef | grep gaussdb检查数据库进程情况，或通过 gs_ctl query -D /home/omm/data检查数据库状态，或使用 gsql -d postgres 进入gsql命令行查看数据库的相关信息。

  [omm@localhost ~]$ ps -ef | grep gaussdb

  omm       145417       1  8 16:11 ?        00:00:01 /soft2/openGauss-server/mppdb_temp_install/bin/gaussdb -D /home/omm/data
  
  omm       145495  145148  0 16:11 pts/2    00:00:00 grep --color=auto gaussdb

  [omm@localhost ~]$  gs_ctl query -D /home/omm/data

  [2023-07-20 16:12:06.283][145500][][gs_ctl]: gs_ctl query ,datadir is /home/omm/data 

   HA state:           

  	local_role                     : Normal

  	static_connections             : 0

  	db_state                       : Normal

  	detail_information             : Normal

   Senders info:       

  No information 

   Receiver info:      

  No information 



  [omm@localhost ~]$ gsql -d postgres

  gsql ((openGauss 5.0.0 build ) compiled at 2023-07-20 15:50:36 commit 0 last mr  debug)
  Non-SSL connection (SSL connection is recommended when requiring high-security)

  Type "help" for help.

  openGauss=# \l

  ERROR:  Please use "ALTER ROLE "omm" PASSWORD 'password';" to set the password of the user before other operations!
  
  openGauss=# ALTER ROLE "omm" PASSWORD 'Wj@19873625';

  ALTER ROLE

  openGauss=# \l   

                                List of databases

     Name    | Owner | Encoding |   Collate   |    Ctype    | Access privileges 

  -----------+-------+----------+-------------+-------------+-------------------

   postgres  | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | 

   template0 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +

             |       |          |             |             | omm=CTc/omm

   template1 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +

             |       |          |             |             | omm=CTc/omm

  (3 rows)