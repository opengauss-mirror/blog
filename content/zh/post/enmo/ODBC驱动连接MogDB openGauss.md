+++

title = "ODBC驱动连接MogDB/openGauss" 

date = "2022-04-07" 

tags = ["ODBC驱动连接MogDB/openGauss"] 

archives = "2022-04" 

author = "云和恩墨交付战队" 

summary = "ODBC驱动连接MogDB/openGauss"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"

+++

# ODBC驱动连接MogDB/openGauss

## 一、环境说明

```sql
[root@node1 ~]# cat /etc/redhat-release
CentOS Linux release 7.6.1810 (Core) 
```

## 二、unixODBC安装

### 有网络安装(可直接跳至三)

```sql
yum install -y unixODBC.x86_64
```

### 无网络安装

#### 1.下载软件包并解压

```sql
wget https://sourceforge.net/projects/unixodbc/files/unixODBC/2.3.7/unixODBC-2.3.7pre.tar.gz/download --no-check-certificate
tar -zxvf unixODBC-2.3.7pre.tar.gz
```

#### 2.编译odbc

```sql
修改configure文件，找到LIB_VERSION,将它的值修改为"1:0:0"，这样将编译出*.so.1的动态库，与psqlodbcw.so的依赖关系相同
cd unixODBC-2.3.7pre/
./configure --enable-gui=no 
make
make install
```

## 三、替换客户端MogDB程序

```sql
wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/2.0.1/x86/openGauss-2.0.0-ODBC.tar.gz
tar -zxvf openGauss-2.0.0-ODBC.tar.gz
将解压得到的lib包下的文件和odbc文件夹下的lib拷贝到/usr/local/lib/
```

## 四、配置数据源

```sql
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

## 五、数据库配置说明

```sql
这里使用简单的方式配置（也可采用guc参数进行设置）
[omm@node1 data]$ tail -5 postgresql.conf
port=26000
listen_addresses = '0.0.0.0'
password_encryption_type = 0
log_directory = 'pg_log'
remote_read_mode=non_authentication
[omm@node1 data]$ tail -1 pg_hba.conf
host all all 0.0.0.0/0 md5
重启数据库
gs_om -t stop
gs_om -t start
```

## 六、客户端配置环境变量

```sql
[root@node1 ~]# tail -3 .bashrc
export LD_LIBRARY_PATH=/usr/local/lib/:$LD_LIBRARY_PATH
export ODBCSYSINI=/usr/local/etc
export ODBCINI=/usr/local/etc/odbc.ini
```

## 七、测试数据源

```sql
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
即连接成功
```

## 八、总结

```sql
上述文档描述的是如何通过ODBC连接MogDB，更多细节可以参考官网ODBC数据源配置https://docs.mogdb.io/
```
