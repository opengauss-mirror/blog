---
title: 'opengauss2.1升级到opengauss3.0简单指南'

date: '2022-04-15'

category: 'blog'
tags: ['opengauss2.1升级到opengauss3.0简单指南']

archives: '2022-04'

author: '云和恩墨'

summary: 'opengauss2.1升级到opengauss3.0简单指南'

img: '/zh/blogs/enmo/title/img6.png'

times: '10:20'
---

# opengauss2.1 升级到 opengauss3.0 简单指南

本文出处：[https://www.modb.pro/db/391240](https://www.modb.pro/db/391240)

本文记录升级中主要步骤，生产中升级需要做很多的准备工作，主要步骤具体参考官方的升级指南https://opengauss.org/zh/blogs/blogs.html?post/shine/opengauss%E5%8D%87%E7%BA%A7%E6%8C%87%E5%AF%BC%E4%B9%A6/

## 1.root 用户登录节点，创建升级目录

```
[zf@mogdb-kernel-0003 dblink]$ gsql -d postgres -p 15400 -r
gsql ((openGauss 2.1.0 build 590b0f8e) compiled at 2021-09-30 14:29:27 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.
[root@mogdb-kernel-0003 dblink]$ mkdir -p /opt/software/gaussdb_upgrade
[root@mogdb-kernel-0003 dblink]$ cd /opt/software/gaussdb_upgrade
[root@mogdb-kernel-0003 gaussdb_upgrade]$ ls
[root@mogdb-kernel-0003 gaussdb_upgrade]$

```

## 2.下载升级包，并解压

下载地址:https://opengauss.org/zh/download.html

```
[root@mogdb-kernel-0003 gaussdb_upgrade]# wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/3.0.0/arm/openGauss-3.0.0-openEuler-64bit-all.tar.gz
openGauss-3.0.0-openEuler-64bit-all.tar.gz 100%[======================================================================================>] 107.10M  2.63MB/s    in 27s
[root@mogdb-kernel-0003 gaussdb_upgrade]# ls
openGauss-3.0.0-openEuler-64bit-all.tar.gz
[root@mogdb-kernel-0003 gaussdb_upgrade]# tar -xf openGauss-3.0.0-openEuler-64bit-all.tar.gz
[root@mogdb-kernel-0003 gaussdb_upgrade]# ls
openGauss-3.0.0-openEuler-64bit-all.tar.gz  openGauss-3.0.0-openEuler-64bit-om.sha256  openGauss-3.0.0-openEuler-64bit.tar.bz2
openGauss-3.0.0-openEuler-64bit-cm.sha256   openGauss-3.0.0-openEuler-64bit-om.tar.gz  upgrade_sql.sha256
openGauss-3.0.0-openEuler-64bit-cm.tar.gz   openGauss-3.0.0-openEuler-64bit.sha256     upgrade_sql.tar.gz
[root@mogdb-kernel-0003 gaussdb_upgrade]# tar -xf openGauss-3.0.0-openEuler-64bit-om.tar.gz

```

## 3.进去升级目录，执行升级安装

```
cd /opt/software/gaussdb_upgrade/script
[root@mogdb-kernel-0003 script]# ./gs_preinstall -U zf -G zf  -X /data1/softwarezf/mogdb/clusterconfig.xml
Parsing the configuration file.
Successfully parsed the configuration file.
Installing the tools on the local node.
Successfully installed the tools on the local node.
Setting host ip env
Successfully set host ip env.
Are you sure you want to create the user[zf] (yes/no)? yes
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
Please get more details by "/opt/software/gaussdb_upgrade/script/gs_checkos -i A -h mogdb-kernel-0003 --detail".
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
Successfully set ARM Optimization.
Fixing server package owner.
Setting finish flag.
Successfully set finish flag.
Preinstallation succeeded.
```

## 4.执行就地升级或者灰度升级

就地升级：升级期间需停止业务进行，一次性升级所有节点。

```
gs_upgradectl -t auto-upgrade -X   /data1/softwarezf/mogdb/clusterconfig.xml
```

灰度升级：灰度升级支持全业务操作，也是一次性升级所有节点。

```
gs_upgradectl -t auto-upgrade -X /opt/software/GaussDB_Kernel/clusterconfig.xml --grey
```

切换至数据库用户，我这里是 zf,执行升级操作，这里采用就地升级

```
[zf@mogdb-kernel-0003 ~]$ gs_upgradectl -t auto-upgrade -X   /data1/softwarezf/mogdb/clusterconfig.xml
Static configuration matched with old static configuration files.
Performing inplace rollback.
Rollback succeeded.
Checking upgrade environment.
Successfully checked upgrade environment.
Successfully started cluster.
Start to do health check.
Successfully checked cluster status.
Backing up current application and configurations.
Successfully backed up current application and configurations.
Stop cluster with gs_om successfully.
Backing up cluster configuration.
Successfully backup hotpatch config file.
Successfully backed up cluster configuration.
Installing new binary.
Restoring cluster configuration.
Successfully restored cluster configuration.
Successfully started cluster.
Stop cluster with gs_om successfully.
Modifying the socket path.
Successfully modified socket path.
NOTICE: Failed to set upgrade_mode to 1, please set it manually.
Successfully started cluster.
copy certs from /data1/mogdbzf/app_compiled to /data1/mogdbzf/app_02c14696.
Successfully copy certs from /data1/mogdbzf/app_compiled to /data1/mogdbzf/app_02c14696.
Stop cluster with gs_om successfully.
Switch symbolic link to new binary directory.
Successfully switch symbolic link to new binary directory.
Successfully started cluster.
Stop cluster with gs_om successfully.
Successfully started cluster.
Waiting for the cluster status to become normal.
.
The cluster status is normal.
Start to do health check.
Successfully checked cluster status.
Upgrade main process has been finished, user can do some check now.
Once the check done, please execute following command to commit upgrade:

    gs_upgradectl -t commit-upgrade -X /data1/softwarezf/mogdb/clusterconfig.xml
```

## 5.检查升级是否成功

```
[zf@mogdb-kernel-0003 ~]$ gsql -d postgres -p 15400 -r
gsql ((openGauss 3.0.0 build 02c14696) compiled at 2022-04-01 18:12:00 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.
openGauss=#

```

## 6.进行提交升级或者回滚

一旦提交操作完成，则不能再执行回滚操作。

```
gs_upgradectl -t commit-upgrade  -X  /data1/softwarezf/mogdb/clusterconfig.xml
[zf@mogdb-kernel-0003 ~]$ gs_upgradectl -t commit-upgrade -X /data1/softwarezf/mogdb/clusterconfig.xml
NOTICE: Start to commit binary upgrade.
Start to check whether can be committed.
Can be committed.
Start to set commit flag.
Set commit flag succeeded.
Start to do operations that cannot be rollback.
Cancel the upgrade status succeeded.
Start to clean temp files for upgrade.
Clean up backup catalog files.
Successfully cleaned old install path.
Stop cluster with gs_om successfully.
Successfully started cluster.
Clean temp files for upgrade succeeded.
NOTICE: Commit binary upgrade succeeded.
```

回滚

```
[zf@mogdb-kernel-0003 ~]$ gs_upgradectl -t auto-rollback  -X /data1/softwarezf/mogdb/clusterconfig.xml
Static configuration matched with old static configuration files.
Performing inplace rollback.
Checking static configuration files.
Successfully checked static configuration files.
Successfully started cluster.
Restoring cluster configuration.
Successfully rollback hotpatch config file.
Successfully restored cluster configuration.
Start roll back CM instance.
Switch symbolic link to old binary directory.
Successfully switch symbolic link to old binary directory.
Successfully started cluster.
Stop cluster with gs_om successfully.
Restoring application and configurations.
Successfully restored application and configuration.
Restoring cluster configuration.
Successfully rollback hotpatch config file.
Successfully restored cluster configuration.
Clean up backup catalog files.
Successfully started cluster.
Successfully cleaned new install path.
Rollback succeeded.
[zf@mogdb-kernel-0003 ~]$ gsql -d postgres -p 15400 -r
gsql ((openGauss 2.1.0 build 590b0f8e) compiled at 2021-09-30 14:29:27 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=#

```

强制回滚，如果数据库异常，可强制回滚

```
 gs_upgradectl -t auto-rollback -X /opt/software/GaussDB_Kernel/clusterconfig.xml
```
