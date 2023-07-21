+++

title = "如何使用ODBC连接数据库" 

date = "2023-07-21" 

tags = ["数据库入门"] 

archives = "2023-07" 

author = "张翠娉" 

summary = "如何使用ODBC连接数据库"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "15:20"

+++

# 如何使用ODBC连接数据库？

步骤一、安装unixODBC。

```
yum install -y unixODBC

yum install -y unixODBC-devel
```

步骤二、下载并安装openGauss ODBC驱动。

```
wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/2.0.0/x86/openGauss-2.0.0-ODBC.tar.gz

--解压安装包
tar -xf openGauss-2.0.0-ODBC.tar.gz
```

步骤三、查看配置文件路径，发现为/etc/。

```
--执行如下命令查看配置文件路径。

odbcinst -j

--将 lib 文件目录连同子文件拷贝到 odbc 配置文件目录中，即/etc/目录

cp -pr lib/* /etc/lib/

cp -pr odbc/lib/* /etc/lib/
```

步骤四、配置 unixODBC, 需要把“本机 IP”替换成实际 IP，如 172.23.2.98。

```
vi /etc/odbcinst.ini

[MogDB]

Driver64=/etc/lib/psqlodbcw.so

setup=/etc/lib/psqlodbcw.so

 

vi /etc/odbc.ini

[MogDB]

Driver=MogDB

Servername=172.23.2.98

Database=postgres 

Username=omm2

Password=Enmo@123

Port=27000



vi ~/.bash_profile 

export LD_LIBRARY_PATH=/etc/lib/:$LD_LIBRARY_PATH 

export ODBCSYSINI=/etc 

export ODBCINI=/etc/odbc.ini
```

步骤五、连接数据库

```
isql -v MogDB
```

步骤六、执行sql语句。

```
Drop table if exists t_odbc; 

create table t_odbc(id int,name text);

insert into t_odbc values(1,'a'); update t_odbc set name='b' where id=1; 

select * from t_odbc;
```