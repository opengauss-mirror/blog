---
title: '如何使用ODBC应用程序接口连接数据库'

date: '2023-03-24'
category: 'blog'
tags: ['如何使用ODBC应用程序接口连接数据库']

archives: '2023-03'

author: '张翠娉'

summary: '如何使用ODBC应用程序接口连接数据库'

img: '/zh/post/zhangcuiping/title/img.png'

times: '15:20'
---

# 如何使用 ODBC 应用程序接口连接数据库？

1. 安装 unixODBC。

   ```
   yum install -y unixODBC
   yum install -y unixODBC-devel
   ```

2. 下载并安装 openGauss ODBC 驱动。本文中使用 arm 架构为例。

   ```
   （ARM架构）
   wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/2.0.0/arm/openGauss-2.0.0-ODBC.tar.gz
   (X86_64架构)
   wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/2.0.0/x86/openGauss-2.0.0-ODBC.tar.gz
   ```

3. 解压 odbc 软件包

   ```
   tar -xf   openGauss-2.0.0-ODBC.tar.gz
   ```

4. 查看配置文件路径，发现为/usr/local/etc/。

   ```
   [root@mc0-0002 etc]# odbcinst -j
   unixODBC 2.3.7
   DRIVERS............: /usr/local/etc/odbcinst.ini
   SYSTEM DATA SOURCES: /usr/local/etc/odbc.ini
   FILE DATA SOURCES..: /usr/local/etc/ODBCDataSources
   USER DATA SOURCES..: /usr/local/etc/odbc.ini
   SQLULEN Size.......: 8
   SQLLEN Size........: 8
   SQLSETPOSIROW Size.: 8
   ```

5. 将新下载的 odbc 软件包中的 lib 文件夹及子目录拷贝到本机 odbc 配置文件目录下

   ```
   cp -pr lib/* /usr/local/etc/lib/

   cp -pr odbc/lib/* /usr/local/etc/lib/
   ```

6. 配置 unixODBC, 需要把**本机 IP**替换成实际 IP

   ```
   vi /usr/local/etc/odbcinst.ini
   [MogDB]
   Driver64=/usr/local/etc/lib/psqlodbcw.so
   setup=/usr/local/etc/lib/psqlodbcw.so

   vi /usr/local/etc/odbc.ini

    [MogDB]
    Driver=MogDB
    Servername=本机IP
    Database=postgres
    Username=user1
    Password=Enmo@123
    Port=26000

   vi ~/.bash_profile
   export LD_LIBRARY_PATH=/usr/local/etc/lib/:$LD_LIBRARY_PATH
   export ODBCSYSINI=/usr/local/etc
   export ODBCINI=/usr/local/etc/odbc.ini
   ```

7. 连接数据库

   ```
   [root@mc0-0002 ~]# isql -v MogDB
   +---------------------------------------+
   | Connected!                            |
   |                                       |
   | sql-statement                         |
   | help [tablename]                      |
   | quit                                  |
   |                                       |
   +---------------------------------------+
   SQL>
   ```
