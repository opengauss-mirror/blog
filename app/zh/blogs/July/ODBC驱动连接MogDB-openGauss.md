---
title: 'ODBC驱动连接MogDB/openGauss'

date: '2021-12-01'

category: 'blog'
tags: ['ODBC驱动连接MogDB/openGauss']

archives: '2021-12'

author: '张凡'

summary: 'ODBC驱动连接MogDB/openGauss'

img: '/zh/blogs/July/title/img4.png'

times: '12:30'
---

# ODBC 驱动连接 MogDB/openGauss<a name="ZH-CN_TOPIC_0000001232774721"></a>

## 一、环境说明<a name="section16629161617165"></a>

```
[root@node1 ~]# cat /etc/redhat-release
CentOS Linux release 7.6.1810 (Core)
```

## 二、unixODBC 安装<a name="section118701630121617"></a>

有网络安装\(可直接跳至三\)

```
yum install -y unixODBC.x86_64
```

无网络安装

1.下载软件包并解压

```
wget https://sourceforge.net/projects/unixodbc/files/unixODBC/2.3.7/unixODBC-2.3.7pre.tar.gz/download --no-check-certificate
tar -zxvf unixODBC-2.3.7pre.tar.gz
```

2.编译 odbc

修改 configure 文件，找到 LIB_VERSION,将它的值修改为"1:0:0"，这样将编译出\*.so.1 的动态库，与 psqlodbcw.so 的依赖关系相同

```
cd unixODBC-2.3.7pre/
./configure --enable-gui=no
make
make install
```

## 三、替换客户端 MogDB 程序<a name="section1987773661612"></a>

```
wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/2.0.1/x86/openGauss-2.0.0-ODBC.tar.gz
tar -zxvf openGauss-2.0.0-ODBC.tar.gz
```

将解压得到的 lib 包下的文件和 odbc 文件夹下的 lib 拷贝到/usr/local/lib/

## 四、配置数据源<a name="section83343161614"></a>

```
[root@node1 ~]# cat /usr/local/etc/odbc.ini
[MGODBC]
Driver=TEST
Servername=8.131.53.xxx (数据库IP)
Database=test_db        (数据库名)
Username=test_usr       (数据库用户)
Password=test@123      （数据库密码）
Port=26000              (数据端口)
Sslmode=allow

[root@node1 ~]# tail -3 /usr/local/etc/odbcinst.ini
[TEST]
Driver64=/usr/local/lib/psqlodbcw.so
setup=/usr/local/lib/psqlodbcw.so
```

## 五、数据库配置说明<a name="section1287174819162"></a>

这里使用简单的方式配置（也可采用 guc 参数进行设置）

```
[omm@node1 data]$ tail -5 postgresql.conf
port=26000
listen_addresses = '0.0.0.0'
password_encryption_type = 0
log_directory = 'pg_log'
remote_read_mode=non_authentication
[omm@node1 data]$ tail -1 pg_hba.conf
host all all 0.0.0.0/0 md5
```

重启数据库

```
gs_om -t stop
gs_om -t start
```

## 六、客户端配置环境变量<a name="section1147885331610"></a>

```
[root@node1 ~]# tail -3 .bashrc
export LD_LIBRARY_PATH=/usr/local/lib/:$LD_LIBRARY_PATH
export ODBCSYSINI=/usr/local/etc
export ODBCINI=/usr/local/etc/odbc.ini
```

## 七、测试数据源<a name="section17821175819169"></a>

```
[root@node1 ~]# isql -v MGODBC
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

即连接成功

## 八、总结<a name="section78925318174"></a>

上述文档描述的是如何通过 ODBC 连接 MogDB，更多细节可以参考官网 ODBC 数据源配置https://docs.mogdb.io/zh/mogdb/v2.0.1/1-development-based-on-odbc-overview
