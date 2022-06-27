+++

title = "Mogdb - 安装报错Failed to encrypt the password for databaseError" 

date = "2022-06-27" 

tags = ["Mogdb - 安装报错Failed to encrypt the password for databaseError"] 

archives = "2022-06" 

author = "云和恩墨" 

summary = "Mogdb - 安装报错Failed to encrypt the password for databaseError"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# Mogdb - 安装报错Failed to encrypt the password for databaseError

本文出处：[https://www.modb.pro/db/418363](https://www.modb.pro/db/418363)

### 版本

Mogdb V2.0.1
红旗 V6

### 故障现象

安装过程中出现报错[GAUSS-50322] : Failed to encrypt the password for databaseError:
/dbdata/app/mogdb/bin/gs_guc: error while loading shared libraries: liblzma.so.5: cannot open shared object file: No such file or directory

```
[omm@ngdpetl01 /opt/software]$/opt/software/script/gs_install -X /opt/software/clusterconfig.xml -l /home/omm/gs_install.log --gsinit-parameter="--encoding=UTF8" --gsinit-parameter="--locale=en_US.UTF8" --gsinit-parameter="--lc-collate=en_US.UTF8" --gsinit-parameter="--lc-ctype=en_US.UTF8" --gsinit-parameter="--lc-messages=en_US.UTF8" --gsinit-parameter="--dbcompatibility=PG" --gsinit-parameter="--pwpasswd=Mogdb@1234" Parsing the configuration file. Check preinstall on every node. Successfully checked preinstall on every node. Creating the backup directory. Last time end with Install cluster. Continue this step. Successfully created the backup directory. begin deploy.. Rolling back. Rollback succeeded. Installing the cluster. begin prepare Install Cluster.. Checking the installation environment on all nodes. begin install Cluster.. Installing applications on all nodes. Successfully installed APP. begin init Instance.. encrypt cipher and rand files for database. [GAUSS-50322] : Failed to encrypt the password for databaseError: /dbdata/app/mogdb/bin/gs_guc: error while loading shared libraries: liblzma.so.5: cannot open shared object file: No such file or directory Please enter password for database: 
```

### 故障分析：

liblzma.so.5对应解压缩XZ，使用命令查看当前系统安装的XZ版本，发现只安装了XZ4,进一步检查，发现操作系统对应CnetOS 6，在查找数据源之后，返现CentOS 6目前只支持到XZ 4.999

```
[root@ngdpetl01 /root]#xz -V
xz (XZ Utils) 4.999.9beta
liblzma 4.999.9beta
[root@ngdpetl01 /root]#rpm -qa|grep xz-lzma-compat
xz-lzma-compat-4.999.9-0.3.beta.20091007git.el6.x86_64
[root@ngdpetl01 /root]#cat /etc/redhat-release
Red Hat Enterprise Linux Server release 6.5 (Santiago)
检查数据库安装要求后，发现当前Mogdb V2.0.1版本不支持CentOS 7以下版本
故障处理更换系统版本后，问题消失
```
