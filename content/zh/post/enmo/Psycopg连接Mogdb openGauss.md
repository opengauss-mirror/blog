+++

title = "Psycopg连接Mogdb/opengauss" 

date = "2022-04-08" 

tags = ["Psycopg连接Mogdb/opengauss"] 

archives = "2022-04" 

author = "云和恩墨交付团队" 

summary = "Psycopg连接Mogdb/opengauss"

img = "/zh/post/enmo/title/img6.png" 

times = "10:20"

+++

# Psycopg连接Mogdb/opengauss

## 1.简介

Psycopg是一种用于执行SQL语句的PythonAPI，可以为PostgreSQL、GaussDB数据库提供统一访问接口，应用程序可基于它进行数据操作。Psycopg2是对libpq的封装，主要使用C语言实现，既高效又安全。它具有客户端游标和服务器端游标、异步通信和通知、支持“COPY TO/COPY FROM”功能。支持多种类型Python开箱即用，适配PostgreSQL数据类型；通过灵活的对象适配系统，可以扩展和定制适配。Psycopg2兼容Unicode和Python 3。MogDB数据库提供了对Psycopg2特性的支持，并且支持psycopg2通过SSL模式链接。

## 2.环境介绍

```
[root@mogdb-kernel-0004 Psycopg]# python3 Python 3.6.8 (default, Nov 16 2020, 16:55:22) [root@mogdb-kernel-0004 Psycopg]# cat /etc/os-release [root@mogdb-kernel-0004 Psycopg]# cat /etc/redhat-release CentOS Linux release 7.6.1810 (Core) [root@mogdb-kernel-0004 Psycopg]# lscpu Architecture:          x86_64 CPU op-mode(s):        32-bit, 64-bit 
```

## 3.下载python驱动

```
[root@mogdb-kernel-0004 Psycopg]# wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/2.1.0/x86/openGauss-2.1.0-CentOS-x86_64-Python.tar.gz [root@mogdb-kernel-0004 Psycopg]# ls openGauss-2.1.0-CentOS-x86_64-Python.tar.gz [root@mogdb-kernel-0004 Psycopg]# tar -xf openGauss-2.1.0-CentOS-x86_64-Python.tar.gz [root@mogdb-kernel-0004 Psycopg]# ls lib  openGauss-2.1.0-CentOS-x86_64-Python.tar.gz  psycopg2 [root@mogdb-kernel-0004 Psycopg]# 
```

注:这里驱动在https://opengauss.org/zh/download.html这里下载，可以根据操作系统版本下载对应的驱动

![image20220330140613272.png](https://oss-emcsprod-public.modb.pro/image/editor/20220330-26a4d82f-650b-49dc-a859-630df55c0aa2.png)

## 4.安装驱动

### (1)找到Python的安装位置

```
[root@mogdb-kernel-0004 Psycopg]# whereis python python: /usr/bin/python3.6 /usr/bin/python2.7 /usr/bin/python3.6m-config /usr/bin/python /usr/bin/python3.6m-x86_64-config /usr/bin/python2.7-config /usr/bin/python3.6-config /usr/bin/python3.6m /usr/lib/python3.6 /usr/lib/python2.7 /usr/lib64/python3.6 /usr/lib64/python2.7 /etc/python /usr/local/lib/python3.6 /usr/include/python2.7 /usr/include/python3.6m /usr/share/man/man1/python.1.gz 
```

### (2)将驱动拷贝到python下的site-packages目录

```
[root@mogdb-kernel-0004 Psycopg]# ls lib  openGauss-2.1.0-CentOS-x86_64-Python.tar.gz  psycopg2 [root@mogdb-kernel-0004 Psycopg]# cp -r psycopg2/ /usr/lib/python3.6/site-packages/ 
```

### (3)数据库创建连接用户

```sql
openGauss=# create database test_db;
CREATE DATABASE
openGauss=# create user test_usr password 'test@123';
NOTICE:  The encrypted password contains MD5 ciphertext, which is not secure.
CREATE ROLE
openGauss=# alter user test_usr sysadmin;
ALTER ROLE
```

### (4)编写python文件

```sql
import psycopg2
conn=psycopg2.connect(database="test_db",user="test_usr",password="test@123",host="本机ip",port=26000)
print("Conn database successfully")
cur=conn.cursor()
cur.execute("CREATE TABLE student(id integer,name varchar,sex varchar);")
cur.execute("INSERT INTO student(id,name,sex) VALUES(%s,%s,%s)",(1,'Aspirin','M'))
cur.execute("INSERT INTO student(id,name,sex) VALUES(%s,%s,%s)",(2,'Taxol','F'))
cur.execute('SELECT id,name,sex FROM student')
results=cur.fetchall()
print (results)
conn.commit()
cur.close()
conn.close()
```

(5)连接测试

```sql
[root@mogdb-kernel-0004 Psycopg]# python3 conn.py
Conn database successfully
[(1, 'Aspirin', 'M'), (2, 'Taxol', 'F')]
[root@mogdb-kernel-0004 Psycopg]#
```

## 4.常见报错

### (1)缺少依赖包

```sql
[root@node1 ~]# python3 conn.py
Traceback (most recent call last):
  File "conn.py", line 1, in <module>
    import psycopg2
  File "/root/psycopg2/__init__.py", line 51, in <module>
    from psycopg2._psycopg import (                     # noqa
ImportError: libpq.so.5: cannot open shared object file: No such file or directory
```

解决办法：

```
[root@mogdb-kernel-0004 ~]# yum install -y libpq.so.5* 
```

### (2)libpg的版本过低

```sql
[root@mogdb-kernel-0004 Psycopg]# python3 conn.py
Traceback (most recent call last):
  File "conn.py", line 2, in <module>
    conn=psycopg2.connect(database="test_db",user="test_usr",password="test@123",host="localhost",port=26000)
  File "/root/Psycopg/psycopg2/__init__.py", line 122, in connect
    conn = _connect(dsn, connection_factory=connection_factory, **kwasync)
psycopg2.OperationalError: SCRAM authentication requires libpq version 10 or above
```

解决办法:

```sql
大概意思是libpg的版本低了，但使用 yum install postgresql-devel 只能更新到 9.2.24版本,
1. 添加源
rpm -Uvh https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
[root@mogdb-kernel-0004 Psycopg]# rpm -Uvh https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
Retrieving https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
warning: /var/tmp/rpm-tmp.K5x7Bw: Header V4 DSA/SHA1 Signature, key ID 442df0f8: NOKEY
Preparing...                          ################################# [100%]
Updating / installing...
   1:pgdg-redhat-repo-42.0-24         ################################# [100%]
2. 安装新版本
yum install postgresql10-devel

```

### (3)身份验证失败

```sql
[root@mogdb-kernel-0004 Psycopg]# python3 conn.py
Traceback (most recent call last):
  File "conn.py", line 2, in <module>
    conn=psycopg2.connect(database="test_db",user="test_usr",password="test@123",host="localhost",port=26000)
  File "/root/Psycopg/psycopg2/__init__.py", line 122, in connect
    conn = _connect(dsn, connection_factory=connection_factory, **kwasync)
psycopg2.OperationalError: none of the server's SASL authentication mechanisms are supported
```

解决方法:

```
这里是host无法识别localhost,将其改为本机ip即可
conn=psycopg2.connect(database="test_db",user="test_usr",password="test@123",host="localhost",port=26000)
改正过后
conn=psycopg2.connect(database="test_db",user="test_usr",password="test@123",host="172.16.0.xxx",port=26000)
```
