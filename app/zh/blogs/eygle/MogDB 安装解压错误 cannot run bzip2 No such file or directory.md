---
title: 'MogDB 安装解压错误：cannot run bzip2: No such file or directory'

date: '2022-05-18'

category: 'blog'
tags: ['MogDB 安装解压错误：cannot run bzip2: No such file or directory']

archives: '2022-05'

author: 'eygle'

summary: 'MogDB 安装解压错误：cannot run bzip2: No such file or directory'

img: '/zh/blogs/eygle/title/img6.png'

times: '10:20'
---

# MogDB 安装解压错误：cannot run bzip2: No such file or directory

本文出处：[https://www.modb.pro/db/403662](https://www.modb.pro/db/403662)

## 问题症状

MogDB 安装时，涉及两个步骤解压，第一步解压缩 tar 包：

```
[root@enmotech ~]# tar -xvf MogDB-2.1.1-CentOS-x86_64.tar
upgrade_sql.tar.gz
MogDB-2.1.1-CentOS-64bit.sha256
MogDB-2.1.1-CentOS-64bit.tar.bz2
MogDB-2.1.1-CentOS-64bit-Libpq.tar.gz
MogDB-2.1.1-CentOS-64bit-om.sha256
MogDB-2.1.1-CentOS-64bit-om.tar.gz
MogDB-2.1.1-CentOS-64bit-tools.tar.gz
upgrade_sql.sha256
```

第二步，解压缩 bz2 文件包，在这一步骤遇到错误，提示 bzip2 不能执行，这是因为操作系统上没有安装 bz2 解压缩工具：

```
[root@enmotech MogDB]# tar -jxf MogDB-2.1.1-CentOS-64bit.tar.bz2
tar (child): bzip2: Cannot exec: No such file or directory
tar (child): Error is not recoverable: exiting now
tar: Child returned status 2
tar: Error is not recoverable: exiting now
```

## 问题分析

手工安装，如果配置了 yum 源，通过命令

> yum -y install bzip2

来安装 bzip2 工具。

```
[root@enmotech MogDB]# yum -y install bzip2
Failed to set locale, defaulting to C
Loaded plugins: fastestmirror
Determining fastest mirrors
base                                                                                                                                                                                                              | 3.6 kB  00:00:00
epel                                                                                                                                                                                                              | 4.7 kB  00:00:00
extras                                                                                                                                                                                                            | 2.9 kB  00:00:00
mysql-connectors-community                                                                                                                                                                                        | 2.6 kB  00:00:00
mysql-tools-community                                                                                                                                                                                             | 2.6 kB  00:00:00
mysql57-community                                                                                                                                                                                                 | 2.6 kB  00:00:00
nginx                                                                                                                                                                                                             | 2.9 kB  00:00:00
updates                                                                                                                                                                                                           | 2.9 kB  00:00:00
webtatic                                                                                                                                                                                                          | 3.6 kB  00:00:00
(1/9): epel/x86_64/group_gz                                                                                                                                                                                       |  96 kB  00:00:00
(2/9): epel/x86_64/updateinfo                                                                                                                                                                                     | 1.0 MB  00:00:00
(3/9): extras/7/x86_64/primary_db                                                                                                                                                                                 | 246 kB  00:00:00
(4/9): epel/x86_64/primary_db                                                                                                                                                                                     | 7.0 MB  00:00:00
(5/9): updates/7/x86_64/primary_db                                                                                                                                                                                |  15 MB  00:00:00
(6/9): mysql-tools-community/x86_64/primary_db                                                                                                                                                                    |  86 kB  00:00:00
(7/9): mysql-connectors-community/x86_64/primary_db                                                                                                                                                               |  87 kB  00:00:01
(8/9): mysql57-community/x86_64/primary_db                                                                                                                                                                        | 306 kB  00:00:01
(9/9): nginx/x86_64/primary_db                                                                                                                                                                                    |  72 kB  00:00:01
Resolving Dependencies
--> Running transaction check
---> Package bzip2.x86_64 0:1.0.6-13.el7 will be installed
--> Finished Dependency Resolution

Dependencies Resolved

=========================================================================================================================================================================================================================================
 Package                                               Arch                                                   Version                                                         Repository                                            Size
=========================================================================================================================================================================================================================================
Installing:
 bzip2                                                 x86_64                                                 1.0.6-13.el7                                                    base                                                  52 k

Transaction Summary
=========================================================================================================================================================================================================================================
Install  1 Package

Total download size: 52 k
Installed size: 82 k
Downloading packages:
bzip2-1.0.6-13.el7.x86_64.rpm                                                                                                                                                                                     |  52 kB  00:00:00
Running transaction check
Running transaction test
Transaction test succeeded
Running transaction
  Installing : bzip2-1.0.6-13.el7.x86_64                                                                                                                                                                                             1/1
  Verifying  : bzip2-1.0.6-13.el7.x86_64                                                                                                                                                                                             1/1

Installed:
  bzip2.x86_64 0:1.0.6-13.el7

Complete!
```

## 问题解决

现在可以正常解压缩 bz2 文件：

```
[root@enmotech MogDB]# tar -xvf MogDB-2.1.1-CentOS-64bit.tar.bz2
./bin/
./bin/gstrace
./bin/kdb5_util
./bin/gs_dumpall
./bin/krb5kdc
./bin/gs_initdb
./bin/klist
./bin/mogdb
./bin/kinit
./bin/gs_basebackup
./bin/openssl
./bin/encrypt
...
```
