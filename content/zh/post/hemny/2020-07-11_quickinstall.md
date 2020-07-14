+++
title = "openGauss入门（快速安装）"
date = "2020-07-11"
tags = ["openGauss入门"]
archives = "2020-07"
author = "hemny"
summary = "openGauss入门"
img = "/zh/post/hemny/img/openGauss_logo.png"
times = "22:30"
+++

### 前言

最近看到openGauss开源了，试用了一下，总感觉安装时要配置XML太麻烦，所以用了简单的安装办法，绿色最小化安装，作为尝鲜者试用方便。

### 系统环境
	硬件：X86平台，4GB内存
	系统：CentOS7  minimal

### 安装软件步骤
---

1. root用户 安装wget、bzip2
```
yum -y install wget bzip2
```


2. 创建gauss用户
```
useradd -m gauss
su - gauss
```

3. 解压安装openGauss

```
# 设置环境变量
export GS_HOME=/home/gauss/opengauss
export LD_LIBRARY_PATH=$GS_HOME/lib:$LD_LIBRARY_PATH
export PGDATA=/home/gauss/data
export PATH=$GS_HOME/bin:$PATH

# 安装openGauss，两次加压是由于官网下载的安装包是为官方安装工具准备的，经过两次压缩。
mkdir tmp && cd tmp
wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/1.0.0/x86/openGauss-1.0.0-CentOS-64bit.tar.gz
tar xf openGauss-1.0.0-CentOS-64bit.tar.gz
mkdir -p $GS_HOME && cd $GS_HOME
tar xf /home/gauss/tmp/openGauss-1.0.0-CentOS-64bit.tar.bz2

# 此时可以删除临时目录/home/gauss/tmp
rm -rf /home/gauss/tmp
```

### 初始化数据库

这里直接采用gs_initdb命令初始化。
```
gs_initdb -w Aa123456 --nodename='sgnode'

# 配置数据库
# vi $PGDATA/postgresql.conf 追加
listen_addresses = '*' 
local_bind_address = '0.0.0.0'
port = 5432 

# 配置hba文件
# vi $PGDATA/pg_hba.conf  追加以下内容 
host    all             all             0.0.0.0/0               sha256

```

### 启动数据库
```
gs_ctl start -l logfile
```

#初始化用户
PS：初始化数据库的用户，是不能通过IP远程连接的哦，所以需要创建另外一个用户才能远程连接，不知道有没有其他参数可以解除初始化用户的远程连接限制。
```
# openGauss是源于PostgreSQL的数据库，默认初始化postgres数据库不变，如果当前用户不是postgres就要指定数据库名登录
gsql -dpostgres

# 修改初始化用户的密码（若需要），openGauss 加强安全，如果需要修改初始化数据库用户的密码，需要用REPLACE哦！
postgres=#  ALTER ROLE gauss IDENTIFIED BY 'Aa1234567' REPLACE 'Aa123456';

# 创建用户(初始化数据库的用户不能进行远程连接，需要重新创建用户)
postgres=# create user user1 with password 'Aa123456';
postgres=# grant all PRIVILEGES to user1; 

```

### 验证远程登录数据库
gsql -dpostgres -h192.168.1.67 -Uuser1

### 总结
openGauss数据库安装也可以参考postgresql的安装方式进行绿色安装。需要注意的是，openGauss对安全性进行了增强，所以在初始化数据库是需要数据密码，并且初始化数据库的用户是不能远程登录的，后面需要重新初始化一个远程登录使用的用户。