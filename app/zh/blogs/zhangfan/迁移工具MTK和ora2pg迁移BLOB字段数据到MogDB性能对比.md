---
title: '迁移工具MTK和ora2pg迁移BLOB字段数据到MogDB性能对比'

date: '2022-04-25'

category: 'blog'
tags: ['迁移工具MTK和ora2pg迁移BLOB字段数据到MogDB性能对比']

archives: '2022-04'

author: '张凡'

summary: '迁移工具MTK和ora2pg迁移BLOB字段数据到MogDB性能对比'

img: '/zh/blogs/zhangfan/title/img20.png'

times: '10:20'
---

# 迁移工具 MTK 和 ora2pg 迁移 BLOB 字段数据到 MogDB 性能对比

本文出处：[https://www.modb.pro/db/240146](https://www.modb.pro/db/240146)

背景介绍：
mtk 全称为 The Database Migration Toolkit，是一个云和恩墨自主研发的可以将 Oracle/DB2/MySQL/openGauss 数据库的数据结构，全量数据高速导入到 MogDB 的工具。ora2pg 是一款免费迁移工具，能将 oracle 迁移到 pg。以下是迁移数据说明,在 Oracle 中创建 25 张带有 BLOB 字段的表，每张表数据 50000 条，用迁移工具 MTK 和 ora2pg，分别对比迁移 1 张表、5 张表、10 张表、20 张表的迁移时间，从而对比其迁移性能。数据库磁盘使用的是 nvme 磁盘，写入速度高达 1400M/s,不用考虑 i/o 对其性能的影响。

## 一、容器版 oracle 安装部署

### 1、Oracle 容器部署

```
docker pull registry.cn-hangzhou.aliyuncs.com/lhrbest/oracle_11g_ee_lhr_11.2.0.4:1.0
docker run -itd --name oracle -h oracle --privileged=true -p 1521:1521 -p 222:22 -p 1158:1158 lhrbest/oracle_11g_ee_lhr_11.2.0.4:1.0 init
```

### 2、安装 Oracle 客户端

```
wget https://download.oracle.com/otn_software/linux/instantclient/214000/oracle-instantclient-basic-21.4.0.0.0-1.el8.x86_64.rpm
wget https://download.oracle.com/otn_software/linux/instantclient/214000/oracle-instantclient-sqlplus-21.4.0.0.0-1.el8.x86_64.rpm
wget https://download.oracle.com/otn_software/linux/instantclient/214000/oracle-instantclient-devel-21.4.0.0.0-1.x86_64.rpm
wget https://download.oracle.com/otn_software/linux/instantclient/214000/oracle-instantclient-jdbc-21.4.0.0.0-1.x86_64.rpm
[root@ecs-1b06 oracle]# rpm -ivh oracle-instantclient-basic-21.4.0.0.0-1.x86_64.rpm
[root@ecs-1b06 oracle]# rpm -ivh oracle-instantclient-sqlplus-21.4.0.0.0-1.x86_64.rpm
[root@ecs-1b06 oracle]# rpm -iv oracle-instantclient-jdbc-21.4.0.0.0-1.x86_64.rpm
[root@ecs-1b06 oracle]# rpm -iv oracle-instantclient-devel-21.4.0.0.0-1.x86_64.rpm
[root@ecs-1b06 oracle]# export LD_LIBRARY_PATH=/usr/lib/oracle/21/client64/lib
[root@ecs-1b06 oracle]# export ORACLE_HOME=/usr/lib/oracle/21/client64
```

## 二、安装 ora2pg

### 1、安装依赖

```
[root@ecs-1b06 ora2pg]# yum install -y perl perl-ExtUtils-CBuilder perl-ExtUtils-MakeMaker
```

### 2、安装 DBI 模块

```
[root@ecs-1b06 local]# wget https://cpan.metacpan.org/authors/id/T/TI/TIMB/DBI-1.643.tar.gz
[root@ecs-1b06 local]# pwd
[root@ecs-1b06 local]# tar -xf DBI-1.643.tar.gz
[root@ecs-1b06 local]# cd DBI-1.643/
[root@ecs-1b06 DBI-1.643]# perl Makefile.PL
[root@ecs-1b06 DBI-1.643]#make
[root@ecs-1b06 DBI-1.643]#make insatll
```

### 3、安装 DBD:oracle 模块

```
[root@ecs-1b06 DBD-Oracle-1.80]# wget https://cpan.metacpan.org/authors/id/M/MJ/MJEVANS/DBD-Oracle-1.80.tar.gz
[root@ecs-1b06 dbd]# tar -xf DBD-Oracle-1.80.tar.gz
[root@ecs-1b06 oracle]# export LD_LIBRARY_PATH=/usr/lib/oracle/21/client64/lib/
[root@ecs-1b06 oracle]# export ORACLE_HOME=/usr/lib/oracle/21/client64
[root@ecs-1b06 dbd]#cd DBD-Oracle-1.80
[root@ecs-1b06 dbd]perl Makefile.PL
[root@ecs-1b06 dbd]make && make
```

### 4、安装 DBD:pg 模块

```
[root@ecs-1b06 DBI-1.643]# yum install -y postgresql*
[root@ecs-1b06 local]# wget  https://cpan.metacpan.org/authors/id/T/TU/TURNSTEP/DBD-Pg-3.15.0.tar.gz
[root@ecs-1b06 DBD-Pg-3.15.0]# tar -xf DBD-Pg-3.15.0.tar.gz
[root@ecs-1b06 DBD-Pg-3.15.0]#  cd DBD-Pg-3.15.0
[root@ecs-1b06 DBD-Pg-3.15.0]# perl Makefile.PL
[root@ecs-1b06 DBD-Pg-3.15.0]# make && make install
```

### 5、安装 ORA2PG

```
[root@ecs-1b06 local]# wget https://sourceforge.net/projects/ora2pg/files/23.0/ora2pg-23.0.tar.bz2  --no-check-certificate
[root@ecs-1b06 ora2pg-23.0]#  perl Makefile.PL
[root@ecs-1b06 ora2pg-23.0]# make && make install
```

### 6、检查是否安装成功

```
[root@mogdb-kernel-0004 ~]# cat check.pl
#!/usr/bin/perl
use strict;
use ExtUtils::Installed;
my $inst=ExtUtils::Installed->new();
my @modules = $inst->modules();
foreach(@modules){
       my $ver = $inst->version($_) || "???";
       printf("%-12s -- %s\n",$_,$ver);
       }
exit;
[root@ecs-1b06 dbd]# perl check.pl
DBD::Oracle  -- 1.80
DBD::Pg      -- 3.15.0
DBI          -- 1.643
Ora2Pg       -- 23.0
Perl         -- 5.16.3
```

## 三、MTK 安装

### 1.下载软件

```
根据系统架构选择对应的版本
wget https://cdn-mogdb.enmotech.com//mtk/v2.2.1/mtk_2.2.1_linux_arm64.tar.gz
tar -xf mtk_2.2.1_linux_arm64.tar.gz
```

### 2.申请 license

```
生成license.json，即可使用
[root@node151 mtk_2.2.1_linux_arm64]# ./mtk license gen
License File Not Found (default license.json)
许可证无效,开始申请
✗ Email: █
[root@node151 mtk_2.2.1_linux_arm64]# vi license.json
[root@node151 mtk_2.2.1_linux_arm64]# ll
总用量 33M
-rw-r--r-- 1 root root  29K  1月 21 10:09 CHANGELOG.md
drwxr-xr-x 2 root root 4.0K  1月 24 13:52 example
-rw-r--r-- 1 root root  531  1月 24 13:57 license.json
-rwxr-xr-x 1 root root  33M  1月 21 10:08 mtk
-rw-r--r-- 1 root root 2.1K  1月 11 16:51 README.md
```

## 四、Oracle 准备数据

### 1、docker 进入 oracle

```
[root@ecs-1b06 ~]# docker ps
CONTAINER ID        IMAGE                                    COMMAND             CREATED             STATUS              PORTS                                                                 NAMES
52dcc856bf99        lhrbest/oracle_11g_ee_lhr_11.2.0.4:1.0   "init"              36 minutes ago      Up 36 minutes       0.0.0.0:1158->1158/tcp, 0.0.0.0:1521->1521/tcp, 0.0.0.0:222->22/tcp   oracle
[root@ecs-1b06 ~]# docker exec -it 52dcc856bf99 bash
[root@oracle /]# su - oracle
[oracle@oracle ~]$ sqlplus /nolog
@> conn / as sysdba
Connected to an idle instance.
SYS@LHR11G> startup
ORACLE instance started.
SYS@LHR11G> create user test identified by test123;
User created.
SYS@LHR11G> grant dba to test;
Grant succeeded.
```

### 2、生成数据

```
[oracle@oracle image]$ ll|wc -l
50000
[oracle@oracle image]$ pwd
/home/oracle/image
[oracle@oracle image]$ du -sh .
7.3G	.
[oracle@oracle ~]$ sqlplus / as sysdba
SYS@LHR11G> conn test/test123
Connected.
SYS@LHR11G> create table testimg1(id int,photo blob);
SYS@LHR11G> create or replace directory imgpath as '/home/oracle/image';
Directory created.
declare
l_blob blob;
l_bfile bfile;
begin
for i in 1..5000 loop
insert into testimg1(id,photo)
values(1,empty_blob())
returning photo into l_blob;
l_bfile :=bfilename('IMGPATH',i||'.jpg');
dbms_lob.fileopen(l_bfile);
dbms_lob.loadfromfile(l_blob,l_bfile,dbms_lob.getlength(l_bfile));
dbms_lob.fileclose(l_bfile);
end loop;
commit;
end;
 16  /
PL/SQL procedure successfully completed.
.....省略生成数据的部分内容
SQL> SELECT  TABLE_NAME,NUM_ROWS FROM USER_TABLES;

TABLE_NAME			 NUM_ROWS
------------------------------ ----------
TESTIMG1				50000
TESTIMG2				50000
TESTIMG3				50000
TESTIMG4				50000
TESTIMG5				50000
TESTIMG6				50000
TESTIMG7				50000
TESTIMG8				50000
TESTIMG9				50000
TESTIMG10				50000
共循环生成25张表。每张表数据50000条
```

## 四、总结

## 结论

从表格数据对比，ora2pg 迁移带有 BLOB 字段的表性能略优于 MTK。从安装部署来看，ora2pg 的安装部署过于复杂，MTK 的安装则非常简便。在对性能要求不那么严格的情况下,可以选择性能和 ora2pg 相差不多，部署方式简单的 MTK 进行数据迁移。
