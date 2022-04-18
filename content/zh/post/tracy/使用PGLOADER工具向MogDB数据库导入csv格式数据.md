+++

title = "使用PGLOADER工具向mogdb数据库导入csv格式数据" 

date = "2022-04-18" 

tags = ["使用PGLOADER工具向mogdb数据库导入csv格式数据"] 

archives = "2022-04" 

author = "tracy" 

summary = "使用PGLOADER工具向mogdb数据库导入csv格式数据"

img = "/zh/post/tracy/title/img20.png" 

times = "10:20"
+++

# 使用PGLOADER工具向mogdb数据库导入csv格式数据

本文出处：https://www.modb.pro/db/81349

操作系统版本：centos7.6
数据库版本：mogdb2.0.1

## 一、安装pgloader工具

### 0.准备工作

下载pgloader安装包：
[pgloader-3.6.2.tar.gz](https://github.com/dimitri/pgloader/releases)

修改数据库参数：

```
gs_guc reload -D $PGDATA -c "password_encryption_type=1" 
```

设置数据库白名单：

```
gs_guc reload -D $PGDATA -h "host all all 192.168.0.0/16 md5" 
```

### 1.生成rmp包

a.Install the EPEL repo.

```
 # yum install https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm 
```

b.Install rpmbuild dependencies:

```
 # yum -y install yum-utils rpmdevtools @"Development Tools"
```

c.Install pgloader build dependencies:

```
 # tar-zxvf pgloader-3.6.2.tar.gz
 
 # cd pgloader-3.6.2

 # yum-builddep pgloader.spec
```

d.Download pgloader source:

```
 # spectool -g -R pgloader.spec 
```

此步骤如果下载文件失败，参照报错信息，手动创建目录，手动下载文件并改名：

```
# mkdir -p /root/rpmbuild/SOURCES/ # cd /root/rpmbuild/SOURCES/ # wget https://github.com/dimitri/pgloader/archive/v3.6.1.tar.gz  # mv pgloader-3.6.1.tar.gz v3.6.1.tar.gz 
```

e.Build the source and binary RPMs (see rpmbuild --help for other build options):

```
 # rpmbuild -ba pgloader.spec 
```

### 2.安装pgloader RPM包

```
# rpm -ivh  /root/rpmbuild/RPMS/x86_64/pgloader-3.6.1-22.el7.x86_64.rpm 
```

### 3.安装完成，查看pgloader 版本：

```
[root@og201 pgloader-3.6.2]# pgloader --version pgloader version "3.6.1" 
```

## 二、导入CSV格式数据

### 1.准备pgloader配置文件和csv数据文件

csv.load

```sql
LOAD CSV
     FROM 'path/to/file.csv' (x, y, a, b, c, d)
     INTO postgresql://<username>:<user_password>@<database_ip>:<port>/<db_name>?csv (a, b, d, c)

     WITH truncate,
          skip header = 1,
          fields optionally enclosed by '"',
          fields escaped by double-quote,
          fields terminated by ','

      SET client_encoding to 'latin1',
          work_mem to '12MB',
          standard_conforming_strings to 'on'

   BEFORE LOAD DO
    $$ drop table if exists csv; $$,
    $$ create table csv (
        a bigint,
        b bigint,
        c char(2),
        d text
       );
  $$;

```

file.csv

```sql
Header, with a © sign
"2.6.190.56","2.6.190.63","33996344","33996351","GB","United Kingdom"
"3.0.0.0","4.17.135.31","50331648","68257567","US","United States"
"4.17.135.32","4.17.135.63","68257568","68257599","CA","Canada"
"4.17.135.64","4.17.142.255","68257600","68259583","US","United States"
"4.17.143.0","4.17.143.15","68259584","68259599","CA","Canada"
"4.17.143.16","4.18.32.71","68259600","68296775","US","United States"

```

### 2.导入：

```sql
# pgloader csv.load
2021-07-09T16:50:22.013000+08:00 LOG pgloader version "3.6.1"
2021-07-09T16:50:22.026000+08:00 WARNING pgloader always talk to PostgreSQL in utf-8, client_encoding has been forced to 'utf8'.
2021-07-09T16:50:22.543000+08:00 LOG report summary reset
             table name     errors       rows      bytes      total time
-----------------------  ---------  ---------  ---------  --------------
                  fetch          0          0                     0.012s
            before load          0          2                     0.038s
-----------------------  ---------  ---------  ---------  --------------
             "pg"."csv"          0          6     0.2 kB          0.079s
-----------------------  ---------  ---------  ---------  --------------
        Files Processed          0          1                     0.036s
COPY Threads Completion          0          2                     0.099s
-----------------------  ---------  ---------  ---------  --------------
      Total import time          ✓          6     0.2 kB          0.135s

```

### 3.登录数据库查看导入数据：

```sql
pgloader=# \c - pg
Password for user pg:
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "pgloader" as user "pg".
pgloader=> \dt
                        List of relations
 Schema | Name | Type  | Owner |             Storage
--------+------+-------+-------+----------------------------------
 pg     | csv  | table | pg    | {orientation=row,compression=no}
(1 row)

pgloader=> table csv;
    a     |    b     | c  |       d
----------+----------+----+----------------
 33996344 | 33996351 | GB | United Kingdom
 50331648 | 68257567 | US | United States
 68257568 | 68257599 | CA | Canada
 68257600 | 68259583 | US | United States
 68259584 | 68259599 | CA | Canada
 68259600 | 68296775 | US | United States
(6 rows)

pgloader=>

```

### 4.导入数据存在错误时，错误信息会记录在/tmp/pgloader/csv目录下

```
# cat path/to/file.csv
Header, with a © sign
"2.6.190.56","2.6.190.63","33996344","33996351","GB","United Kingdom"
"3.0.0.0","4.17.135.31","50331648","68257567","US","United States"
"4.17.135.32","4.17.135.63","68257568","68257599","CA","Canada"
"4.17.135.64","4.17.142.255","68257600","68259583","US","United States"
"4.17.143.0","4.17.143.15","68259584","68259599","CA","Canada"
"4.17.143.16","4.18.32.71","68259600","68296775","US","United States"
"4.18.32.71","68259600","68296775","US","United States"
# pgloader csv.load
2021-07-14T08:25:45.025000+08:00 LOG pgloader version "3.6.1"
2021-07-14T08:25:45.123000+08:00 WARNING pgloader always talk to PostgreSQL in utf-8, client_encoding has been forced to 'utf8'.
2021-07-14T08:25:45.657000+08:00 ERROR PostgreSQL ["\"public\".\"csv\""] Database error 22P02: invalid input syntax for integer: "US"
CONTEXT: COPY csv, line 7, column b: "US"
2021-07-14T08:25:45.667000+08:00 LOG report summary reset
             table name     errors       rows      bytes      total time
-----------------------  ---------  ---------  ---------  --------------
                  fetch          0          0                     0.010s
            before load          0          2                     0.052s
-----------------------  ---------  ---------  ---------  --------------
         "public"."csv"          1          6     0.2 kB          0.072s
-----------------------  ---------  ---------  ---------  --------------
        Files Processed          0          1                     0.028s
COPY Threads Completion          0          2                     0.087s
-----------------------  ---------  ---------  ---------  --------------
      Total import time          1          6     0.2 kB          0.115s
[root@centos-7-pg12 pgloader]# ls -l /tmp/pgloader/csv/
total 8
-rw-r--r-- 1 root root  30 Jul 14 08:25 csv.dat
-rw-r--r-- 1 root root 103 Jul 14 08:25 csv.log
[root@centos-7-pg12 pgloader]# cat /tmp/pgloader/csv/csv.dat
68296775        US      \N      United States

[root@centos-7-pg12 pgloader]# cat /tmp/pgloader/csv/csv.log
Database error 22P02: invalid input syntax for integer: "US"
CONTEXT: COPY csv, line 7, column b: "US"
```
