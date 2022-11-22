+++

title = "openGauss容器版本升级指南——抽丝剥茧"

date = "2022-11-21"

tags = ["openGauss技术文章征集"]

archives = "2022-11"

author = "李宏达"

summary = "openGauss容器版本升级指南——抽丝剥茧"

img = "/zh/post/lihongda/title/title.png"

times = "11:00"

+++

# 前言

目前openGauss容器版本除了数据的导入导出没有一个很好的升级方式，虽然容器版本的初衷是为了更方便快捷的使用数据库，但是一旦产生了大量的数据或者在生产环境使用了之后做导入导出升级是不方便的，为此开发了容器版本的升级脚本，此脚本的内容源自openGauss lite版本升级脚本，经过一些处理加工迭代后适配到openGauss容器版本，本文涉及openGauss容器版本2.0.0 ~ 2.1.0，2.1.0 ~ 3.0.0的升级流程及一些代码处理和文件解释。

# 一、文件目录及介绍

```s
[gaussdb@ecs-lee upgrade]$ ls -lrt
total 72
-rw-r--r-- 1 gaussdb gaussdb  1100 Apr  1  2022 upgrade_GAUSSV5.sh
-rw-r--r-- 1 gaussdb gaussdb   392 Apr  1  2022 upgrade_errorcode.sh
-rw-r--r-- 1 gaussdb gaussdb 38662 Jun 22 14:55 upgrade_common.sh
-rw-r--r-- 1 gaussdb gaussdb   731 Jun 22 16:26 upgrade_config.sh
drwxrwxr-x 2 gaussdb gaussdb  4096 Nov 21 09:06 pkg_2.1.0
drwxrwxr-x 2 gaussdb gaussdb  4096 Nov 21 09:06 pkg_3.0.0
drwxrwxr-x 2 gaussdb gaussdb  4096 Nov 21 09:19 upgrade.log
drwxrwxr-x 2 gaussdb gaussdb  4096 Nov 21 09:19 tmp
drwxrwxr-x 2 gaussdb gaussdb  4096 Nov 21 09:19 bak
```

# 二、文件解释

```s
- upgrade_GAUSSV5.sh :主控文件，调用upgrade_common.sh。  
- upgrade_errorcode.sh:错误代码  
- upgrade_config.sh:配置信息  
- upgrade_common.sh:实际升级文件  
- upgrade.log:升级日志
- pkg_2.1.0,pkg_3.0.0:数据库升级根位置
- bak:数据库低版本备份位置
- tmp:数据库临时目录
```

# 三、配置文件解释

```s
[mogdb@ecs-lee upgrade]$ cat upgrade_config.sh
#!/bin/bash
# Copyright (c) Huawei Technologies Co., Ltd. 2010-2022. All rights reserved.
# date: 2021-12-22
# version: 1.0

# 数据库监听端口
GAUSS_LISTEN_PORT="5432"

# 数据库管理员用户名
GAUSS_ADMIN_USER="mogdb"

#数据库升级回退日志路径
GAUSS_LOG_PATH="/home/mogdb/upgrade"

#数据库升级根位置
GAUSS_UPGRADE_BASE_PATH="/home/mogdb/upgrade/pkg_3.0.0_beta2"

#数据库SQL包位置
GAUSS_SQL_TAR_PATH="/home/mogdb/upgrade/pkg_3.0.0_beta2"

#数据库低版本备份位置
GAUSS_BACKUP_BASE_PATH="/home/mogdb/upgrade/bak"

#数据库临时目录
GAUSS_TMP_PATH="/home/mogdb/upgrade/tmp"

#是否使用存在的bin解压包
GAUSS_UPGRADE_BIN_PATH=""

#需要同步的cluster config 列表
GAUSS_UPGRADE_SYNC_CONFIG_LIST=""
```


# 四、升级流程追溯

## 1. 整体升级流程

大致分四步，其中前三步对应相应的回滚。

- upgrade_pre/rollback_pre
> 升级预处理，进行磁盘检查，版本检查，准备升级文件，安装检查，备份gauss，解压安装包，检查数据库进程，更改升级参数，执行升级前置SQL，更改step。
- upgrade_bin/rollback_bin
> 查询数据库角色，停库，备份家目录，拷贝安装包，备份config，guc删除废弃参数，开启数据库，更改step。
- upgrade_post/rollback_post
> 检查数据库进程，执行upgrade sql,更改step。
- upgrade_commit
> 更改升级参数，更改step。

## 2. 升级关键流程梳理

- upgrade_pre
  
  - current_step < 0 die "Step file may be changed invalid"
  - current_step < 1 
    - upgrade_pre_step1 (check_disk check_version prepare_sql_all check_pkg bak_gauss decompress_pkg record_step 1)
    - upgrade_pre_step2 (check_db_process 'reload_upgrade_config upgrade_mode 2' exec_sql record_step 2)
  - current_step = 1 
    - rollback_pre,upgrade_pre_step2
  - other "no need do upgrade_pre step"


- upgrade_bin
  
  - current_step < 0 die "Step file may be changed invalid"
  - current_step < 2 die "exec upgrade pre first"
  - current_step < 3 
    - upgrade_bin_step4 (record_step 3 query_dn_role stop_dbnode cp_gauss_home_config_to_temp cp_pkg cp_temp_config_to_gauss_home guc_delete start_dbnode record_step 4)

- upgrade_post
  
  - current_step < 0 die "Step file may be changed invalid"
  - current_step < 4 die "You should exec upgrade_bin first"
  - current_step = 4 
    - upgrade_post_step56 (check_db_process record_step 5 exec_sql record_step 6)
  - current_step = 5 
    - rollback_post,upgrade_post_step56
  - other "no need do upgrade_post step"

- upgrade_commit
  
  - current_step = 0 die "No need commit,upgrade directly"
  - current_step -ne 6  die "Now you can't commit because the steps are wrong"
  - other 
    - 'reload_upgrade_config upgrade_mode 0' record_step 0

- rollback_pre

  - current_step < 1 "no need do rollback_pre step"
  - current_step > 2 die "You should rollback_bin first"
  - other 
    - check_db_process 'reload_upgrade_config upgrade_mode 2' record_step 1 exec_sql 'reload_upgrade_config upgrade_mode 0' record_step 0

- rollback_bin

  - current_step < 3 "no need do rollback_pre step"
  - current_step > 4 die "You should rollback_post first"
  - other 
    - record_step 3  query_dn_role stop_dbnode cp_gauss_home_config_to_temp cp_temp_config_to_gauss_home 'set_upgrade_config upgrade_mode 2' start_dbnode record_step 2

- rollback_post
  - current_step < 5 "Cannot do rollback_post step"
  - other
    - check_db_process 'reload_upgrade_config upgrade_mode 2' record_step 5 exec_sql record_step 4

- prepare_sql_all
  - prepare_sql 
    - upgrade_sql_file="upgrade_sql/upgrade_catalog_${dbname}/${action}_catalog_${dbname}_${temp_old:0:2}_${temp_old:2}.sql"
    - upgrade_sql_file="upgrade_sql/rollback_catalog_${dbname}/${action}_catalog_${dbname}_${temp_new:0:2}_${temp_new:2}.sql"
    - temp_old 92299 temp_new 92421

- exec_sql
  - rollback_pre 
    - postgres temp_rollback_maindb.sql
    - others   temp_rollback_otherdb.sql
  - rollback_post 
    - postgres temp_rollback-post_maindb.sql
    - others   temp_rollback-post_otherdb.sql
  - upgrade_pre 
    - postgres temp_upgrade_maindb.sql
    - others   temp_upgrade_otherdb.sql
  - upgrade_post
    - postgres temp_upgrade-post_maindb.sql
    - others   temp_upgrade-post_otherdb.sql


# 五、容器外正常输出及流程


- upgrade_pre
```s
[mogdb@ecs-lee upgrade]$ sh upgrade_GAUSSV5.sh -t upgrade_pre
Current env value: GAUSSHOME is /home/mogdb/2.0.0, PGDATA is /home/mogdb/2.0.0_data/data.
Parse cmd line successfully.
Check available disk space successfully.
Big upgrade is needed!
Old version commitId is f892ccb7, version info is 92299
New version commitId is 03211457, version info is 92421
decompress upgrade_sql.tar.gz successfully.
kernel: CentOS
Bak gausshome successfully.
Bak postgresql.conf successfully.
Bak pg_hba.conf successfully.
begin decompress pkg in /home/mogdb/upgrade/tmp/install_bin_03211457
Decompress MogDB-2.1.1-CentOS-64bit.tar.bz2 successfully.
cp version.cfg successfully
input sql password:
input sql password:
The upgrade_pre step is executed successfully. 
```
- upgrade_bin

```s
[mogdb@ecs-lee upgrade]$ sh upgrade_GAUSSV5.sh -t upgrade_bin
Current env value: GAUSSHOME is /home/mogdb/2.0.0, PGDATA is /home/mogdb/2.0.0_data/data.
Parse cmd line successfully.
Binfile upgrade to new version successfully.
Delete guc successfully
start gaussdb by cmd: gs_ctl start  -D /home/mogdb/2.0.0_data/data  -o '-u 92299' --single_node
The upgrade_bin step is executed successfully. 
```
- upgrade_post
```s
[mogdb@ecs-lee upgrade]$ sh upgrade_GAUSSV5.sh -t upgrade_post
Current env value: GAUSSHOME is /home/mogdb/2.0.0, PGDATA is /home/mogdb/2.0.0_data/data.
Parse cmd line successfully.
input sql password:
input sql password:
The upgrade_post step is executed successfully. 
```
- upgrade_commit
```s
[mogdb@ecs-lee upgrade]$ sh upgrade_GAUSSV5.sh -t upgrade_commit
Current env value: GAUSSHOME is /home/mogdb/2.0.0, PGDATA is /home/mogdb/2.0.0_data/data.
Parse cmd line successfully.
The upgrade_commit step is executed successfully. 
```

- help
```s
[mogdb@ecs-lee upgrade]$ sh upgrade_GAUSSV5.sh --help
Current env value: GAUSSHOME is /home/mogdb/2.0.0, PGDATA is /home/mogdb/2.0.0_data/data.

Usage: upgrade_GAUSSV5.sh [OPTION]
Arguments:
   -h|--help                   show this help, then exit
   -t                          upgrade_pre,upgrade_bin,upgrade_post,rollback_pre,rollback_bin,rollback_post,upgrade_commit
                               query_start_mode,switch_over
   --min_disk                  reserved upgrade disk space in MB, default 2048
   -m|--mode                   normal、primary、standby and cascade_standby
```

- upgrade_mode

```s
upgrade_mode
参数说明: 标示升级模式。该参数不建议用户自己修改。

**取值范围:**整数，0~INT_MAX

0表示不在升级过程中。
1表示在就地升级过程中。
2表示在灰度升级过程中。
默认值: 0
```

# 六、容器升级操作流程（2.0.1~2.1.0）

## 1. 下载解压安装包

```s
[gaussdb@ecs-lee upgrade]$ ls -lrt
total 68
-rw-r--r-- 1 gaussdb gaussdb  1100 Apr  1  2022 upgrade_GAUSSV5.sh
-rw-r--r-- 1 gaussdb gaussdb   392 Apr  1  2022 upgrade_errorcode.sh
-rw-r--r-- 1 gaussdb gaussdb 38662 Jun 22 14:55 upgrade_common.sh
-rw-r--r-- 1 gaussdb gaussdb   731 Jun 22 16:26 upgrade_config.sh
drwxrwxr-x 2 gaussdb gaussdb  4096 Nov 21 09:06 pkg_3.0.0
drwxrwxr-x 2 gaussdb gaussdb  4096 Nov 21 09:19 tmp
drwxrwxr-x 2 gaussdb gaussdb  4096 Nov 21 09:19 bak
drwxrwxr-x 2 gaussdb gaussdb  4096 Nov 21 09:49 pkg_2.1.0
-rw-rw-r-- 1 gaussdb gaussdb     0 Nov 21 09:51 upgrade.log

[gaussdb@ecs-lee upgrade]$ cd pkg_2.1.0/
[gaussdb@ecs-lee pkg_2.1.0]$ wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/2.1.0/x86/openGauss-2.1.0-CentOS-64bit-all.tar.gz
--2022-11-21 09:46:39--  https://opengauss.obs.cn-south-1.myhuaweicloud.com/2.1.0/x86/openGauss-2.1.0-CentOS-64bit-all.tar.gz
Resolving opengauss.obs.cn-south-1.myhuaweicloud.com (opengauss.obs.cn-south-1.myhuaweicloud.com)... 139.159.208.230, 139.159.208.243, 121.37.63.33, ...
Connecting to opengauss.obs.cn-south-1.myhuaweicloud.com (opengauss.obs.cn-south-1.myhuaweicloud.com)|139.159.208.230|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 100623501 (96M) [application/gzip]
Saving to: ‘openGauss-2.1.0-CentOS-64bit-all.tar.gz’

100%[=====================================================================>] 100,623,501 1.19MB/s   in 60s

2022-11-21 09:47:39 (1.61 MB/s) - ‘openGauss-2.1.0-CentOS-64bit-all.tar.gz’ saved [100623501/100623501]

[gaussdb@ecs-lee pkg_2.1.0]$ tar -xf openGauss-2.1.0-CentOS-64bit-all.tar.gz
[gaussdb@ecs-lee pkg_2.1.0]# tar -xf openGauss-2.1.0-CentOS-64bit.tar.bz2
```

## 2. 生成原容器环境

```s
[gaussdb@ecs-lee upgrade]$ pwd
/opt/upgrade
[gaussdb@ecs-lee upgrade]$ docker run --name opengauss201_old --privileged=true -d -e GS_PASSWORD=Enmo@123 \
> -v /opt/data/2.0.1/:/var/lib/opengauss \
> -v /opt/upgrade:/home/omm/upgrade \
> -u root enmotech/opengauss:2.0.1
Unable to find image 'enmotech/opengauss:2.0.1' locally
2.0.1: Pulling from enmotech/opengauss
feac53061382: Pull complete
ae19558530c7: Pull complete
d3f06f3dc8f3: Pull complete
4347c4b43dc1: Pull complete
0cd7bd9662a6: Pull complete
427dabd2d7d9: Pull complete
22ca5922910f: Pull complete
d43e649d84e9: Pull complete
9634b869cc59: Pull complete
3057a2dfffa7: Pull complete
6921c2bb9882: Pull complete
Digest: sha256:d156596b2900f7eda102aadfd951daad97412b610b96d3dd97d2cdd9d5b70024
Status: Downloaded newer image for enmotech/opengauss:2.0.1
aaaec386db56e5aa2a271d92dcfb2e97a7e008eb991609b9383f7baad3aafc0b
[gaussdb@ecs-lee upgrade]$ docker exec -it opengauss201_old bash
root@aaaec386db56:/# su - omm
omm@aaaec386db56:~$ gsql -d postgres -p5432 -r
gsql ((openGauss 2.0.1 build d97c0e8a) compiled at 2021-06-02 19:37:17 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

postgres=# select version();
                                                                                version

---------------------------------------------------------------------------------------------------------------
--------------------------------------------------------
 PostgreSQL 9.2.4 (openGauss 2.0.1 build d97c0e8a) compiled at 2021-06-02 19:37:17 commit 0 last mr   on x86_64
-unknown-linux-gnu, compiled by g++ (GCC) 7.3.0, 64-bit
(1 row)

postgres=#
```


## 3. 执行upgrade_pre

```s
postgres=# \q
omm@aaaec386db56:~$ echo "export GAUSSDATA=/var/lib/opengauss/data" >> /home/omm/.bashrc
omm@aaaec386db56:~$ source /home/omm/.bashrc
omm@aaaec386db56:~$ logout
root@aaaec386db56:/# chown -R omm:omm /home/omm/upgrade/
root@aaaec386db56:/# su - omm
omm@aaaec386db56:~$ cd /home/omm/upgrade
omm@aaaec386db56:~/upgrade$ bash upgrade_GAUSSV5.sh -t upgrade_pre
Current env value: GAUSSHOME is /usr/local/opengauss, PGDATA is /var/lib/opengauss/data.
Parse cmd line successfully.
Check available disk space successfully.
Big upgrade is needed!
Old version commitId is d97c0e8a, version info is 92299
New version commitId is compiled, version info is 92421
decompress upgrade_sql.tar.gz successfully.
/home/omm/upgrade/upgrade_common.sh: line 394: lsb_release: command not found
kernel:
Bak gausshome successfully.
Bak postgresql.conf successfully.
Bak pg_hba.conf successfully.
begin decompress pkg in /home/omm/upgrade/tmp/install_bin_compiled
Decompress openGauss-2.1.0-CentOS-64bit.tar.bz2 successfully.
cp version.cfg successfully
input sql password:
input sql password:
The upgrade_pre step is executed successfully.
```

## 4. 停止原容器

```s
[gaussdb@ecs-lee upgrade]$ docker stop opengauss201_old
opengauss201_old
```

## 5. 中间容器操作（upgrade_post,upgrade_commit）

- 删除两个废弃参数

```s
[root@ecs-lee pkg_2.1.0]# vi /opt/data/2.0.1/data/postgresql.conf
default_storage_nodegroup
expected_computing_nodegroup
```

- 启动中间容器

```s
[gaussdb@ecs-lee upgrade]$ docker run --name opengauss210_mid --privileged=true -d -e GS_PASSWORD=Enmo@123 \
> -v /opt/data/2.0.1/:/var/lib/opengauss \
> -v /opt/upgrade:/home/omm/upgrade \
> -u root enmotech/opengauss:2.1.0 \
> gaussdb -u 92299
Unable to find image 'enmotech/opengauss:2.1.0' locally
2.1.0: Pulling from enmotech/opengauss
Digest: sha256:d5a3e38fa2553a44e7fa1cd5cad0b4f0845a679858764067d7b0052a228578a0
Status: Downloaded newer image for enmotech/opengauss:2.1.0
625ed4d2801221a4db733ea10e51bcd9e8a8b9a2e99fbc743eb45244a126e569
```

- 执行upgrade_post,upgrade_commit

```s
[gaussdb@ecs-lee upgrade]$ docker run --name opengauss210_mid --privileged=true -d -e GS_PASSWORD=Enmo@123 \
> -v /opt/data/2.0.1/:/var/lib/opengauss \
> -v /opt/upgrade:/home/omm/upgrade \
> -u root enmotech/opengauss:2.1.0 \
> gaussdb -u 92299
Unable to find image 'enmotech/opengauss:2.1.0' locally
2.1.0: Pulling from enmotech/opengauss
Digest: sha256:d5a3e38fa2553a44e7fa1cd5cad0b4f0845a679858764067d7b0052a228578a0
Status: Downloaded newer image for enmotech/opengauss:2.1.0
625ed4d2801221a4db733ea10e51bcd9e8a8b9a2e99fbc743eb45244a126e569
[gaussdb@ecs-lee upgrade]$ docker exec -it opengauss210_mid bash
root@625ed4d28012:/# su - omm
omm@625ed4d28012:~$ echo "export GAUSSDATA=/var/lib/opengauss/data" >> /home/omm/.bashrc
omm@625ed4d28012:~$ source /home/omm/.bashrc
omm@625ed4d28012:~$ cd /home/omm/upgrade
omm@625ed4d28012:~/upgrade$ echo 4 > /home/omm/upgrade/tmp/record_step.txt
omm@625ed4d28012:~/upgrade$ bash upgrade_GAUSSV5.sh -t upgrade_post
Current env value: GAUSSHOME is /usr/local/opengauss, PGDATA is /var/lib/opengauss/data.
Parse cmd line successfully.
input sql password:
input sql password:
The upgrade_post step is executed successfully.
omm@625ed4d28012:~/upgrade$ bash upgrade_GAUSSV5.sh -t upgrade_commit
Current env value: GAUSSHOME is /usr/local/opengauss, PGDATA is /var/lib/opengauss/data.
Parse cmd line successfully.
The upgrade_commit step is executed successfully.
omm@625ed4d28012:~/upgrade$ logout
root@625ed4d28012:/# exit
```

## 6. 停止中间容器
```s
[gaussdb@ecs-lee upgrade]$ docker stop opengauss210_mid
opengauss210_mid
```

## 7. 启动新容器

```s
[gaussdb@ecs-lee upgrade]$ docker run --name opengauss210_new --privileged=true -d -e GS_PASSWORD=Enmo@123 \
> -v /opt/data/2.0.1/:/var/lib/opengauss \
> -u root enmotech/opengauss:2.1.0
31e7168f9646d35c3f81f4467c2fa53c73566dbe9f6907df0a696ea6ff77cb61
```

## 8. 校验

```s
[gaussdb@ecs-lee upgrade]$ docker exec -it opengauss210_new bash
root@31e7168f9646:/# su - omm
omm@31e7168f9646:~$ gsql -d postgres -p5432 -r
gsql ((openGauss 2.1.0 build 590b0f8e) compiled at 2021-09-30 14:29:04 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=# select version();
                                                                       version

---------------------------------------------------------------------------------------------------------------
---------------------------------------
 (openGauss 2.1.0 build 590b0f8e) compiled at 2021-09-30 14:29:04 commit 0 last mr   on x86_64-unknown-linux-gn
u, compiled by g++ (GCC) 7.3.0, 64-bit
(1 row)
```

# 七、容器升级操作流程（2.1.0~3.0.0）

## 1. 修改config配置文件,清空tmp，bak目录，下载解压安装包

```s
[root@ecs-lee upgrade]# ls -lrt
total 108
-rw-r--r-- 1 avahi avahi  1100 Apr  1  2022 upgrade_GAUSSV5.sh
-rw-r--r-- 1 avahi avahi   392 Apr  1  2022 upgrade_errorcode.sh
-rw-r--r-- 1 avahi avahi   731 Jun 22 16:26 upgrade_config.sh
drwxrwxr-x 2 avahi avahi  4096 Nov 21 09:06 pkg_3.0.0
-rw-r--r-- 1 avahi avahi 38662 Nov 21 09:56 upgrade_common.sh
drwxrwxr-x 9 avahi avahi  4096 Nov 21 10:03 pkg_2.1.0
drwxrwxr-x 3 avahi avahi  4096 Nov 21 10:05 bak
drwxrwxr-x 4 avahi avahi  4096 Nov 21 10:13 tmp
-rw------- 1 avahi avahi 39985 Nov 21 10:13 upgrade.log
[root@ecs-lee upgrade]# rm -rf upgrade.log tmp/* bak/* pkg_2.1.0/*
[root@ecs-lee upgrade]# vi upgrade_config.sh
[root@ecs-lee upgrade]# vi upgrade_common.sh
[root@ecs-lee upgrade]# ls
pkg_2.1.0  pkg_3.0.0  upgrade_common.sh  upgrade_config.sh  upgrade_errorcode.sh  upgrade_GAUSSV5.sh
tmp bak
[root@ecs-lee upgrade]# cd pkg_3.0.0/
[root@ecs-lee pkg_3.0.0]# wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/3.0.0/x86/openGauss-3.0.0-CentOS-64bit-all.tar.gz
--2022-11-21 10:22:20--  https://opengauss.obs.cn-south-1.myhuaweicloud.com/3.0.0/x86/openGauss-3.0.0-CentOS-64bit-all.tar.gz
Resolving opengauss.obs.cn-south-1.myhuaweicloud.com (opengauss.obs.cn-south-1.myhuaweicloud.com)... 121.37.63.33, 139.159.208.243, 139.159.208.230, ...
Connecting to opengauss.obs.cn-south-1.myhuaweicloud.com (opengauss.obs.cn-south-1.myhuaweicloud.com)|121.37.63.33|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 116068945 (111M) [application/gzip]
Saving to: ‘openGauss-3.0.0-CentOS-64bit-all.tar.gz’

100%[=====================================================================>] 116,068,945 1.03MB/s   in 67s

2022-11-21 10:23:27 (1.66 MB/s) - ‘openGauss-3.0.0-CentOS-64bit-all.tar.gz’ saved [116068945/116068945]

[root@ecs-lee pkg_3.0.0]# tar -xf openGauss-3.0.0-CentOS-64bit-all.tar.gz
[root@ecs-lee pkg_3.0.0]# tar -xf openGauss-3.0.0-CentOS-64bit.tar.bz2

```


## 2. 原容器操作

```s
[gaussdb@ecs-lee ~]$ docker exec -it opengauss210_old bash
root@96e887765049:/# chown -R omm:omm /home/omm/upgrade/
root@96e887765049:/# su - omm
omm@96e887765049:~$ echo "export GAUSSDATA=/var/lib/opengauss/data" >> /home/omm/.bashrc
omm@96e887765049:~$ source /home/omm/.bashrc
omm@96e887765049:~$ cd /home/omm/upgrade
omm@96e887765049:~/upgrade$ bash upgrade_GAUSSV5.sh -t upgrade_pre
Current env value: GAUSSHOME is /usr/local/opengauss, PGDATA is /var/lib/opengauss/data.
Parse cmd line successfully.
Check available disk space successfully.
Big upgrade is needed!
Old version commitId is compiled, version info is 92421
New version commitId is 02c14696, version info is 92605
decompress upgrade_sql.tar.gz successfully.
/home/omm/upgrade/upgrade_common.sh: line 394: lsb_release: command not found
kernel:
Bak gausshome successfully.
Bak postgresql.conf successfully.
Bak pg_hba.conf successfully.
begin decompress pkg in /home/omm/upgrade/tmp/install_bin_02c14696
Decompress openGauss-3.0.0-CentOS-64bit.tar.bz2 successfully.
cp version.cfg successfully
input sql password:
input sql password:
The upgrade_pre step is executed successfully.
omm@96e887765049:~/upgrade$ logout
root@96e887765049:/# exit
[gaussdb@ecs-lee ~]$ docker stop opengauss210_old
opengauss210_old
```

## 3. 中间容器操作

- 修改 temp_sql

gsql:/opt/upgrade/tmp/temp_sql/temp_upgrade-post_maindb.sql: 6761--6775: ERROR:  cannot drop type jsonb because other objects depend on it
gsql:/opt/upgrade/tmp/temp_sql/temp_upgrade-post_otherdb.sql: 6763--6777: ERROR:  cannot drop type jsonb because other objects depend on it


```s
[gaussdb@ecs-lee ~]$ docker run --name opengauss300_mid --privileged=true -d -e GS_PASSWORD=Enmo@123 \
> -v /opt/data/2.1.0/:/var/lib/opengauss \
> -v /opt/upgrade:/home/omm/upgrade \
> -u root enmotech/opengauss:3.0.0_EE \
> gaussdb -u 92421
Unable to find image 'enmotech/opengauss:3.0.0_EE' locally
3.0.0_EE: Pulling from enmotech/opengauss
Digest: sha256:1a45cb1150203a22f9df7a71134e2ca48431d04ad3137d0e106c9b5f18eb3c45
Status: Downloaded newer image for enmotech/opengauss:3.0.0_EE
ce4fa39ad75a937ad0f850468d945778c65106c096aef17b491b3122b1406565
[gaussdb@ecs-lee ~]$ docker exec -it opengauss300_mid bash
root@ce4fa39ad75a:/# su - omm
omm@ce4fa39ad75a:~$ echo "export GAUSSDATA=/var/lib/opengauss/data" >> /home/omm/.bashrc
omm@ce4fa39ad75a:~$ source /home/omm/.bashrc
omm@ce4fa39ad75a:~$ cd /home/omm/upgrade
omm@ce4fa39ad75a:~/upgrade$ echo 4 > /home/omm/upgrade/tmp/record_step.txt
omm@ce4fa39ad75a:~/upgrade$ bash upgrade_GAUSSV5.sh -t upgrade_post
Current env value: GAUSSHOME is /usr/local/opengauss, PGDATA is /var/lib/opengauss/data.
Parse cmd line successfully.
input sql password:
input sql password:
The upgrade_post step is executed successfully.
omm@ce4fa39ad75a:~/upgrade$ bash upgrade_GAUSSV5.sh -t upgrade_commit
Current env value: GAUSSHOME is /usr/local/opengauss, PGDATA is /var/lib/opengauss/data.
Parse cmd line successfully.
The upgrade_commit step is executed successfully.
omm@ce4fa39ad75a:~/upgrade$ logout
root@ce4fa39ad75a:/# exit
[gaussdb@ecs-lee ~]$ docker stop opengauss300_mid
opengauss300_mid
[gaussdb@ecs-lee ~]$ docker run --name opengauss300_mid_2 --privileged=true -d -e GS_PASSWORD=Enmo@123 \
> -v /opt/data/2.1.0/:/var/lib/opengauss \
> -u root enmotech/opengauss:3.0.0_EE \
> gaussdb -u 92568
03465ee3be41e75e41e90a8b84f1c53e3cecd3e5b1628fffc70c1b2cb6fc2002
[gaussdb@ecs-lee ~]$ docker stop opengauss300_mid_2
opengauss300_mid_2
```

## 4. 新容器验证

```s
[gaussdb@ecs-lee ~]$ docker run --name opengauss300_new --privileged=true -d -e GS_PASSWORD=Enmo@123 \
> -v /opt/data/2.1.0/:/var/lib/opengauss \
> -u root enmotech/opengauss:3.0.0_EE
68cf2493fc2f78147f51e6b5733bd199b2416ed138ca4a28f4eab9c0acc79b68
[gaussdb@ecs-lee ~]$ docker exec -it opengauss300_new bash
root@68cf2493fc2f:/# su - omm
omm@68cf2493fc2f:~$ gsql -d postgres -p5432 -r
gsql ((openGauss 3.0.0 build 02c14696) compiled at 2022-04-01 18:12:34 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=# select version();
                                                                       version

---------------------------------------------------------------------------------------------------------------
---------------------------------------
 (openGauss 3.0.0 build 02c14696) compiled at 2022-04-01 18:12:34 commit 0 last mr   on x86_64-unknown-linux-gn
u, compiled by g++ (GCC) 7.3.0, 64-bit
(1 row)

openGauss=#
```

# 总结

容器的整体升级步骤还是比较清晰的，upgrade_pre,upgrade_bin,upgrade_post,upgrade_commit。容器脚本虽然有每个步骤的rollback，但是中间容器的引入更方便我们升级失败回退，另外可以保证升级过程中产生的一些“垃圾文件”不会升级后的容器。



