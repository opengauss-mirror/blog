+++

title = "openGauss版本升级" 

date = "2021-02-09" 

tags = ["openGauss版本升级"] 

archives = "2021-02" 

author = "贾军锋" 

summary = "openGauss版本升级"

img = "/zh/post/jiajunfeng/title/img4.png" 

times = "12:30"

+++

# openGauss版本升级<a name="ZH-CN_TOPIC_0000001116221615"></a>

本文针对openGauss1.0.1版本进行了就地升级，升级目标为2020年12月31日发布的openGauss1.1.0版本。

目前几乎所有的数据库通用的一个升级方法为备份恢复，即在停止原数据库业务后进行备份，然后在目标数据库进行恢复，这种简单有效的数据库版本升级往往可以实现跨大版本、跨操作系统的数据库升级，关于备份恢复的操作这里不再做复述。

本文记录的是openGauss就地升级的操作，一般适合小版本升级，且升级期间需要停止业务、做好数据备份。

**注意事项:**

-   就地升级需要停止业务进行，会一次性升级openGauss中所有节点。
-   openGauss运行正常且数据库节点的数据完全同步。
-   升级过程中不允许打开kerberos开关。
-   请不要修改安装包中解压出来的version.cfg文件。
-   升级成功后，原归档日志文件将失效。
-   升级成功后，原来的二进制目录将会被删除，请不要在二进制目录中存放个人数据文件。
-   如果升级过程中出现异常导致升级失败，并且自动回滚失败时，需要用户自动执行回滚命令进行手动回滚。升级回滚成功后，升级过程中设置的GUC参数将失效。
-   升级过程中，不允许对wal\_level，max\_connections，max\_prepared\_transactions，max\_locks\_per\_transaction这四个GUC参数的值进行修改。
-   数据库节点磁盘使用率低于50%时才可以执行升级操作。

**1. 备份现有环境的程序及数据**

```
## 备份是救命稻草，在做所有的变更前一定一定要做好备份，这是一个好习惯
[omm@ogdb1 ~]$ gs_om -t stop
[omm@ogdb1 ~]$ tar -czvf  opengauss20210207.tar.gz /gauss   ## 冷备份整个openGauss程序和数据
```

**2. 上传并解压新版本的软件包**

```
[root@ogdb1 ~]# ls /soft/openGauss/
clusterconfig.xml  openGauss-1.1.0-CentOS-64bit-all.tar.gz
[root@ogdb1 ~]# cd /soft/openGauss/
[root@ogdb1 openGauss]# tar -zxvf openGauss-1.1.0-CentOS-64bit-all.tar.gz
[root@ogdb1 openGauss]# tar -zxvf openGauss-1.1.0-CentOS-64bit-om.tar.gz
[root@ogdb1 openGauss]# ls
clusterconfig.xml                        openGauss-1.1.0-CentOS-64bit-om.sha256  script              upgrade_sql.tar.gz
lib                                      openGauss-1.1.0-CentOS-64bit-om.tar.gz  simpleInstall       version.cfg
openGauss-1.0.1-CentOS-64bit.tar.gz      openGauss-1.1.0-CentOS-64bit.sha256     upgrade_sql
openGauss-1.1.0-CentOS-64bit-all.tar.gz  openGauss-1.1.0-CentOS-64bit.tar.bz2    upgrade_sql.sha256
```

**3. 执行gs\_preinstall脚本进行预安装**

```
## 在执行gs_preinstall后, 会在二进制程序的目录中生成新版本的二进制程序app_392c0438，omm工具中也生成相应的升级脚本和版本配置。
[root@ogdb1 ~]# cd /soft/openGauss/script/
[root@ogdb1 script]# ./gs_preinstall -U omm -G dbgrp -X /soft/openGauss/clusterconfig.xml
[omm@ogdb1 ~]$ ll /gauss/
total 28
lrwxrwxrwx 1 omm dbgrp   19 Feb  7 09:43 app -> /gauss/app_13b34b53
drwx------ 7 omm dbgrp 4096 Feb  7 10:00 app_13b34b53
drwx------ 2 omm dbgrp 4096 Feb  7 10:02 app_392c0438
drwxr-x--- 2 omm dbgrp 4096 Feb  7 09:41 corefile
drwx------ 3 omm dbgrp 4096 Feb  7 09:41 data
drwxr-x--- 3 omm dbgrp 4096 Feb  7 09:40 log
drwx------ 4 omm dbgrp 4096 Feb  7 10:02 om
drwx------ 3 omm dbgrp 4096 Feb  7 10:02 tmp
[omm@ogdb1 ~]$ ll /gauss/om
total 299540
drwx------ 15 omm dbgrp      4096 Feb  7 10:02 lib
-r--------  1 omm dbgrp        65 Oct 12 02:09 openGauss-1.0.1-CentOS-64bit.sha256
-r--------  1 omm dbgrp  54571301 Oct 12 02:09 openGauss-1.0.1-CentOS-64bit.tar.bz2
-r--------  1 omm dbgrp        65 Dec 31 20:40 openGauss-1.1.0-CentOS-64bit.sha256
-r--------  1 omm dbgrp  87084796 Dec 31 20:40 openGauss-1.1.0-CentOS-64bit.tar.bz2
-r--------  1 omm dbgrp  64150225 Feb  7 09:41 openGauss-Package-bak_13b34b53.tar.gz
-r--------  1 omm dbgrp 100757271 Feb  7 10:02 openGauss-Package-bak_392c0438.tar.gz
drwx------  6 omm dbgrp      4096 Feb  7 10:02 script
-r--------  1 omm dbgrp        65 Dec 31 20:40 upgrade_sql.sha256
-r--------  1 omm dbgrp    134579 Dec 31 20:40 upgrade_sql.tar.gz
-r--------  1 omm dbgrp        32 Dec 31 20:40 version.cfg
```

**4. 修改目录权限**

```
[root@ogdb1 script]# chown -R omm:dbgrp /gauss/      
## 必须确保二进制程序的目录权限正确，否则可能会导致升级失败。
## 当升级失败后，脚本会自动进行rollback操作，此时也会删除gs_preinstall生成的新版本二进制包和其他文件。
## 当升级失败后，如果要进行第二次的升级尝试，需要再一次先执行gs_preinstall脚本。
```

**5. 执行gs\_upgradectl脚本升级**

```
[root@ogdb1 script]# su - omm
[omm@ogdb1 ~]$ gsql --version
gsql (openGauss 1.0.1 build 13b34b53) compiled at 2020-10-12 02:00:59 commit 0 last mr
[omm@ogdb1 ~]$ gs_upgradectl -t auto-upgrade -X /soft/openGauss/clusterconfig.xml
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
Backing up cluster configuration.
Successfully backup hotpatch config file.
Successfully backed up cluster configuration.
Installing new binary.
Restoring cluster configuration.
Successfully restored cluster configuration.
Successfully started cluster.
Modifying the socket path.
Successfully modified socket path.
Successfully started cluster.
copy certs from /gauss/app_13b34b53 to /gauss/app_392c0438.
Successfully copy certs from /gauss/app_13b34b53 to /gauss/app_392c0438.
Switch symbolic link to new binary directory.
Successfully switch symbolic link to new binary directory.
Successfully started cluster.
Successfully started cluster.
Start to do health check.
Successfully checked cluster status.
Upgrade main process has been finished, user can do some check now.
Once the check done, please execute following command to commit upgrade:
    gs_upgradectl -t commit-upgrade -X /soft/openGauss/clusterconfig.xml
```

**6. 检查数据库版本是否已升级为目标版本**

```
[omm@ogdb1 ~]$ gsql --version
gsql (openGauss 1.1.0 build 392c0438) compiled at 2020-12-31 20:07:42 commit 0 last mr
[omm@ogdb1 ~]$ gsql -d postgres -p 26000 -r
gsql ((openGauss 1.1.0 build 392c0438) compiled at 2020-12-31 20:07:42 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.
postgres=# select version();
                                                version
---------------------------------------------------------------------------------------------------------------------------
 PostgreSQL 9.2.4 (openGauss 1.1.0 build 392c0438) compiled at 2020-12-31 20:07:42 commit 0 last mr   on x86_64-unknown-linux-gnu, compiled by g++ (GCC) 7.3.0, 64-bit
-- 检查数据是否正确
postgres=# \c - jack
Password for user jack:
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "postgres" as user "jack".
postgres=> select * from t1;
 id |                     name
----+----------------------------------------------
  1 | This is test for upgrade from 1.0.1 to 1.1.0

-- 在未提交升级前，数据库处于可读写状态
postgres=# create table t2(id int,name varchar(20));
postgres=# insert into t2 values(123,'This is 1.1.0');
postgres=# select * from t2;
 id  |     name
-----+---------------
 123 | This is 1.1.0
```

**7. 确认提交升级**

**注意：**  一旦提交操作完成，则不能再执行回滚操作。

```
[omm@ogdb1 ~]$ gs_upgradectl -t commit-upgrade -X /soft/openGauss/clusterconfig.xml
Clean up backup catalog files.
Successfully cleaned old install path.
Successfully started cluster.
Commit binary upgrade succeeded.
[omm@ogdb1 ~]$ ll /gauss/
total 24
lrwxrwxrwx 1 omm dbgrp   19 Feb  7 10:05 app -> /gauss/app_392c0438
drwx------ 9 omm dbgrp 4096 Feb  7 10:08 app_392c0438
drwxr-x--- 2 omm dbgrp 4096 Feb  7 09:41 corefile
drwx------ 3 omm dbgrp 4096 Feb  7 09:41 data
drwxr-x--- 3 omm dbgrp 4096 Feb  7 09:40 log
drwx------ 4 omm dbgrp 4096 Feb  7 10:02 om
drwx------ 3 omm dbgrp 4096 Feb  7 10:08 tmp
## 当提交升级后，升级完毕且生效，二进制程序仅保留新版本的程序，旧版本的程序被删除。
```

升级完毕，总体而言从1.0.1-\>1.1.0的升级操作并没有什么报错和难度，脚本运行比较顺畅。

