+++
title = "openGauss一些常用操作命令整理"
date = "2022-05-27"
tags = ["openGauss基本操作"]
archives = "2022-05"
author = "peixk"
summary = "openGauss基本操作"
img = "/zh/post/xingchen/title/title.jpg"
times = "15:52"
+++

整理了一些openGauss/MogDB的常用操作

### 1、启停服务
```shell
su - omm
--启动服务
gs_om -t start 
--重启服务   
gs_om -t restart  
--关闭服务
gs_om -t stop   
```

### 2、查询实例状态
该命令也可查看同主备环境下，其他实例的状态
```shell
gs_om -t status --detail
```

### 3、检查数据库性能
```shell
--简要模式
gs_checkperf -i pmk -U omm 
--详细模式
gs_checkperf -i pmk -U omm --detail
```

### 4、查看数据库端口号
不确定端口的情况，可以到postgresql.conf 或者安装数据库时的xml中找一下
```shell
cat /mogdb/data/db1/postgresql.conf | grep port
```

### 5、列出所有数据库
```sql
su - omm
gsql -d postgres -p 26000 -l 
```

postgres为openGauss安装完成后默认生成的数据库。初始可以连接到此数据库进行新数据库的创建。

### 6、登陆数据库
```sql
--登陆默认数据库postgres
gsql -d postgres -p 36000

--登陆自建数据库
gsql -d 数据库名 -p 36000 -U 用户名 -W 密码  -r
```

### 7、数据库内的一些操作命令
```sql
--查看帮助
postgres=# \?

--切换数据库
postgres=# \c dbname

--列举数据库
postgres=# \l
或
select datname from pg_database;

--列举表
postgres=# \dt
postgres=# \d

--列举所有表、视图和索引
postgres=# \d+

--查询表的属性
postgres=# \d tablename

--列举schema
postgres=# \dn

--查看索引
postgres=# \di

--查看表空间
postgres=# \db
或
select spcname from pg_tablespace;

--查看数据库用户列表
postgres=# select * from pg_user;

--要查看用户属性
postgres=# select * from pg_authid;

--查看所有角色
postgres=# select * from PG_ROLES;

--切换用户
postgres=# \c – username

--退出数据库
postgres=# \q
```
