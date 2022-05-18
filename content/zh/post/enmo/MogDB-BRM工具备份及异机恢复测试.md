+++

title = "MogDB-BRM工具备份及异机恢复测试" 

date = "2022-05-18" 

tags = ["MogDB-BRM工具备份及异机恢复测试"] 

archives = "2022-05" 

author = "云和恩墨" 

summary = "MogDB-BRM工具备份及异机恢复测试"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# MogDB-BRM工具备份及异机恢复测试

本文出处：[https://www.modb.pro/db/336213](https://www.modb.pro/db/336213)

### BRM工具简介

BRM备份恢复工具全称为：Backup and Recovery Manager，面向MogDB数据库实现备份和恢复运维管理工作。

BRM工具支持的备份方式：数据库全备，增量备份以及归档备份。

BRM工具支持的恢复方式：基于时间点恢复，以及事务ID恢复以及基于备份id恢复。

下面绍使用BRM工具进行全备和归档备份并在异机实现恢复数据库到指定时间点的例子。

### 解压BRM工具

登录数据库主机，解压安装介质并授权

```
# cd /home/omm/software/brm
# unzip brm_0.0.12_linux_amd64.zip
# chown omm: -R /home/omm/software/brm
```

### 配置brm工具参数文件

/home/omm/下创建.brm目录并将配置文件复制到/home/omm/.brm目录下

```
# su - omm
$ mkdir /home/omm/.brm
$ cp /home/omm/software/conf/brm.yaml /home/omm/.brm/
```

修改BRM配置文件brm.yaml，指定备份文件存放路径和日志存放路径，存放路径需具有omm用户创建目录权限。

```
# 没有启用
backup_user: omm
# 备份文件存放目录
backup_home: /home/omm/brm
# 日志目录
log_file: /home/omm/log/brm/brm.log
# 日志级别
log_level: DEBUG
# 没有启用
lock_directory: /home/omm/log/run
# wal全局备份几次 default 1
wal_retention_redundancy: 1
# 是否允许主库进行备份. default:false
no_allow_primary_backup: false
network_limit_rate: 10m
# default on
enable_backup_wal_file_check: on
## 启动备份文件中心同步
#enable_backup_push: on
## 当前Brm节点名称，当enable_backup_center_push为on时此项为必填
#brm_node_name: 127.0.0.1:5434
## brm 备份文件集中存储配置
#backup_center:
#  - host: 127.0.0.1
#   port: 44332
#  - host: 127.0.0.1
#   port: 44333
```

### BRM工具验证

使用omm用户执行如下验证工具安装成功

```
$ /home/omm/software/brm/brm version

time="2022-02-18 11:21:36.291979" level=info msg="Using config file:/home/omm2/.brm/brm.yaml"

Release version: 0.0.12

Git Commit hash: 8bcf8b7

Git Tag     : v0.0.12

Build timestamp: 2021-11-15T05:00:20ZZ
```

### 数据库开启归档

使用omm用户登录主库确认归档是否开启

```
postgres=# show archive_mode; archive_mode  -------------- on (1 row) postgres=# show archive_dest; archive_dest  -------------- /home/omm/arch (1 row) 
```

如主库归档未开启，通过如下方式登录主库开启归档

```
postgres=# show archive_mode;
 archive_mode 
--------------
 on
(1 row)

postgres=# show archive_dest;
 archive_dest 
--------------
 /home/omm/arch
(1 row)
```

### BRM创建备份服务

使用omm用户创建备份服务

```
$ ./brm add-server --instance=dn_6001 --pgdata=/home/omm/mogdata/db1 --retention-redundancy=3 --retention-window=3 --pgdatabase=postgres --pgport=26000  --archive-timeout 2min --archive-dir=/home/omm/arch\
time="2022-02-18 13:44:42.180559" level=info msg="Using config file:/home/omm/.brm/brm.yaml"
time="2022-02-18 13:44:42.180836" level=info msg="add server begin"
time="2022-02-18 13:44:42.181034" level=info msg="the gs_probackup path /home/omm/mogdb/app/bin/gs_probackup"
time="2022-02-18 13:44:42.185983" level=info msg="the gs_probackup version 2.1.0"
time="2022-02-18 13:44:42.186054" level=info msg="the gs_ctl path /home/omm/mogdb/app/bin/gs_ctl"
time="2022-02-18 13:44:42.190809" level=info msg="gs_ctl version 9.2.4 "
time="2022-02-18 13:44:42.196368" level=info msg="Instance 'dn_6001' version 2.1.0"
time="2022-02-18 13:44:42.200305" level=info msg="Instance 'dn_6001' XLogSegSize 16777216"
time="2022-02-18 13:44:42.218946" level=info msg="Check params archive_dest"
time="2022-02-18 13:44:42.221207" level=info msg="add server end "
```

### 数据库全备

使用omm用户进行数据库全备操作

```
$ ./brm add-server --instance=dn_6001 --pgdata=/home/omm/mogdata/db1  
```

### 数据库进行修改数据操作

全备后，登录数据库进行创建表和插入数据的操作

```
$ gsql -p26000 -Uusername dbname
Password for user username:
gsql ((MogDB 2.1.0 build 56189e20) compiled at 2022-01-07 18:47:34 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

dbname=> create table test_P as select * from P;
INSERT 0 1056321

dbname=> \c - omm
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "dbname" as user "omm".

dbname=# select pg_switch_xlog();
 pg_switch_xlog
----------------
 3/37807ED0
(1 row)

dbname=# \c - username
Password for user username:
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "dbname" as user "username".

dbname=> select count(*) from test_P;
 count
---------
 1056321
(1 row)

dbname=> \q 

```

### 数据库归档备份

使用omm用户进行备份数据库归档文件操作

```
$ ./brm backup-wal --instance=dn_6001  --clear=on --delete-wal -j 4 
```

### 再次修改数据库数据

登录数据库多测进行数据修改操作

```
$ gsql -p26000 -Uusername dbname
Password for user username:
gsql ((MogDB 2.1.0 build 56189e20) compiled at 2022-01-07 18:47:34 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.
......

dbname=> select count(*) from test_P;
 count
---------
 1056312
(1 row)

dbname=> select sysdate from dual; --有少数据
 sysdate
---------------------
 2022-02-18 16:48:22
(1 row)
 
dbname=> delete from test_P;
DELETE 1056312
dbname-> \q

[omm@HDTYV-testdb-1T ~]$ gsql -p26000 -Uusername dbname
Password for user username:
gsql ((MogDB 2.1.0 build 56189e20) compiled at 2022-01-07 18:47:34 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

dbname=> select count(*) from test_P;
 count
-------
   0
(1 row)

openGauss=# select pg_switch_xlog(); --没数据
 pg_switch_xlog
----------------
 3/54605338
(1 row)

openGauss=# select sysdate;
 sysdate
---------------------
 2022-02-18 16:50:48
(1 row)
.....

dbname=> select count(*) from test_P;
 count
---------
 1056321
(1 row)

dbname=> select sysdate;--有数据
 sysdate
---------------------
 2022-02-18 17:15:04
(1 row)

dbname=>

openGauss=# select pg_switch_xlog();--有数据
 pg_switch_xlog
----------------
 3/6A21D228
(1 row)

openGauss=# select sysdate;
 sysdate
---------------------
 2022-02-18 17:15:20
(1 row)
```

### 数据库归档备份

使用omm用户再次进行备份数据库归档文件操作

```
$ ./brm backup-wal --instance=dn_6001  --clear=on --delete-wal -j 4 
```

### 数据库恢复到指定时间点

将/home/omm/backup/brm文件夹拷贝到进行恢复数据库的主机

注：恢复数据库的主机要提前安装过mogdb数据库并配置好BRM工具；如果使用数据库归档备份文件恢复数据库，要求数据库安装用户和源库相同，且源库使用的端口号在目标库不能被占用。

恢复主机上BRM工具配置文件内容：

```
$ cat ~/.brm/brm.yaml
# 没有启用
backup_user: omm
# 备份文件存放目录
backup_home: /home/omm/backup/brm
# 日志目录
log_file: /home/omm/backup/log/brm/brm.log
# 日志级别
log_level: DEBUG
# 没有启用
lock_directory: /home/omm/backup/lib/run
# wal全局备份几次 default 1
wal_retention_redundancy: 1
# 是否允许主库进行备份. default:false
no_allow_primary_backup: false
network_limit_rate: 10m
# default on
enable_backup_wal_file_check: on
## 启动备份文件中心同步
#enable_backup_push: on
## 当前BRM节点名称，当enable_backup_center_push为on时此项为必填
#brm_node_name: 127.0.0.1:5434
## BRM 备份文件集中存储配置
#backup_center:
#  - host: 127.0.0.1
#   port: 44332
#  - host: 127.0.0.1
#   port: 44333
```

将源库的BRM备份文件复制到目标服务器BRM工具的备份目录下

```
$ pwd
/home/omm/backup
$ scp omm@<IP>:/home/omm/brm.tar ./
brm.tar                                                          100%  15GB 196.0MB/s  01:17
$ tar -xf brm.tar
$ ll
total 15513360
drwx------ 4 omm2 dbgrp      43 Feb 18 14:14 .
drwx------ 8 omm2 dbgrp     297 Feb 18 14:11 ..
drwx------ 4 omm2 dbgrp      32 Feb 18 14:04 brm
-rw------- 1 omm2 dbgrp 15885680640 Feb 18 14:12 brm.tar
drwx------ 3 omm2 dbgrp      17 Feb 18 11:21 log
$ rm brm.tar
```

基于时间点恢复数据库

```
$ ./brm restore -i dn_6001 -D /home/omm/mogdata/db5 --recovery-target-time='2022-02-18 16:47:22' -j 4 
```

### 查看恢复后的数据库中的数据

恢复数据库操作完成后，检查数据库数据，确认与恢复时间点时的源库数据库数据一致。

```
$ gsql -p26000 dbname -Uusername
Password for user username:
gsql ((MogDB 2.1.0 build 56189e20) compiled at 2022-01-07 18:47:34 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

dbname=> select count(*) from test_P;
 count
---------
 1056312
(1 row)
```
