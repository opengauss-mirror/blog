+++

title = "使用ODBC接口连接数据库提示禁止使用初始用户进行远程连接" 

date = "2023-07-30" 

tags = ["openGauss安装"] 

archives = "2023-07" 

author = "张翠娉" 

summary = "使用ODBC接口连接数据库提示禁止使用初始用户进行远程连接"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "14:20"

+++

# 使用ODBC接口连接数据库提示禁止使用初始用户进行远程连接？

**背景介绍**：

使用ODBC接口连接数据库时，提示禁止使用初始用户进行远程连接。

**报错内容**：

```bash
[root@mogdv-kernel-001 data]# isql -v MogDB
[08001][unixODBC]FATAL:  Forbid remote connection with initial user.

[ISQL]ERROR: Could not SQLConnect
```

**解决办法**：

1、登录数据库，创建测试用户。

```sql
create user odbc_user identified by xxxxxx;
```

2、在odbc.ini配置文件中，将username改为odbc_user。

odbc.ini配置文件内容如下：

```bash
[MogDB]
Driver=openGauss
Servername=192.23.0.171
Database=postgres 
Username=odbc_user
Password=xxxxxx
Port=29000
```

**注意**：使用odbc接口连接数据库时，不能使用初始用户连接数据库。