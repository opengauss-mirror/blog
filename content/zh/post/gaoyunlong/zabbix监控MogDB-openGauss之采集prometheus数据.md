+++

title = "zabbix 监控 MogDB/openGauss 之 采集prometheus数据" 

date = "2022-05-05" 

tags = ["zabbix 监控 MogDB/openGauss 之 采集prometheus数据"] 

archives = "2022-05" 

author = "高云龙" 

summary = "zabbix 监控 MogDB/openGauss 之 采集prometheus数据"

img = "/zh/post/gaoyunlong/title/img33.png" 

times = "10:20"
+++

# zabbix监控MogDB/openGauss之采集prometheus数据

本文出处：[https://www.modb.pro/db/187462](https://www.modb.pro/db/187462)

### 前言

市场上比较的监控方式有两种：zabbix和prometheus架构，对于MogDB/openGauss数据库来说，已经通过[grafana + prometheus + opengauss_exporter](https://www.modb.pro/db/173483)的方式完成了监控部署，如何通过zabbix完成对MogDB/openGauss数据库完成监控呢，通过zabbix官网我们知道从zabbix 4.2版本开始支持了Prometheus 数据源,那本篇文章先实现通过zabbix采集prometheus数据，zabbix底层的数据存储采用MogDB数据库。

### 软件信息

OS: CentOS 7.9 on x86
database:MogDB 2.0.1
prometheus:2.31.1
opengauss_exporter: 0.0.9
本环境已经安装好MogDB数据库、prometheus和opengauss_exporter，这里主要介绍zabbix安装及与prometheus适配。

```
--安装依赖包 yum -y install gcc gcc-c++ curl curl-devel net-snmp net-snmp-devel readline.x86_64 readline-devel.x86_64 zlib.x86_64 zlib-devel.x86_64 libevent.x86_64 libevent-devel.x86_64 postgresql-devel.x86_64 golang.x86_64 libmcrypt-devel mhash-devel libxslt-devel libjpeg libjpeg-devel libpng libpng-devel freetype freetype-devel libxml2 libxml2-devel zlib zlib-devel glibc glibc-devel glib2 glib2-devel bzip2 bzip2-devel ncurses ncurses-devel curl curl-devel e2fsprogs e2fsprogs-devel krb5 krb5-devel libidn libidn-devel openssl openssl-devel sqlite-devel.x86_64 sqlite.x86_64 oniguruma-devel oniguruma 
```

### zabbix安装部署

[参考zabbix官网快速部署](https://www.zabbix.com/cn/download?zabbix=5.0&os_distribution=centos&os_version=7&db=postgresql&ws=nginx)

#### 安装准备

```
--安装zabbix源
# rpm -Uvh https://repo.zabbix.com/zabbix/5.0/rhel/7/x86_64/zabbix-release-5.0-1.el7.noarch.rpm
# yum clean all

--安装zabbix server 和 agent
# yum install zabbix-server-pgsql zabbix-agent

--配置Zabbix前端
# yum install centos-release-scl

--编辑zabbix.repo
vim /etc/yum.repos.d/zabbix.repo
[zabbix-frontend]
...
enabled=1
...
Install Zabbix frontend packages.

--安装pgsql和nginx
# yum install zabbix-web-pgsql-scl zabbix-nginx-conf-scl

--为Zabbix前端配置PHP
vim /etc/opt/rh/rh-nginx116/nginx/conf.d/zabbix.conf

listen 80;
server_name 172.16.3.90;

***
vim /etc/opt/rh/rh-php72/php-fpm.d/zabbix.conf

listen.acl_users = apache,nginx
php_value[date.timezone] = Europe/Riga

```

#### MogDB数据库配置

```
--创建数据库
postgres=# create database zabbix DBCOMPATIBILITY='PG';

--创建用户
postgres=# \c zabbix
abbix=# create user zabbix encrypted password 'zabbix@123';create user zabbix encrypted password 'zabbix@123';

--修改pg_hba.conf
host    all          zabbix             172.16.3.90/32 md5

--导入数据
$ zcat /usr/share/doc/zabbix-server-pgsql*/create.sql.gz | gsql -h 172.16.3.90 -U zabbix zabbix -f

```

#### 启动Zabbix server和agent进

```
--启动Zabbix server和agent进程，并为它们设置开机自启：

# systemctl restart zabbix-server zabbix-agent rh-nginx116-nginx rh-php72-php-fpm
# systemctl enable zabbix-server zabbix-agent rh-nginx116-nginx rh-php72-php-fpm

```

#### 展示Zabbix前端

连接到新安装的Zabbix前端，直接浏览器输入:172.16.3.90 ,如有下图展示说明zabbix启动成功，配置完前段界面后，zabbix初始账号是：Admin，密码：zabbix

![image.png](../figures/20211203-7294cdd5-5b8a-41dd-9558-468c56d0e49d.png)

![image.png](../figures/20211203-8632d683-5aa7-4e1f-907c-3952796968f4.png)

### zabbix配置prometheus

#### 配置监控项

在zabbix界面：Configuration --> Hosts --> Items --> Create Item

![image.png](../figures/20211216-cd0ca2d6-dd3c-41d5-9643-775edc3e9035.png)

**添加监控项信息**

![image.png](../figures/20211216-05611555-f74d-47d5-8057-a86a6fd5e38f.png)

![image.png](../figures/20211216-2e9cd439-b92e-4fcd-8180-ef7096c80a16.png)

**查看监控项**

![image.png](../figures/20211216-b9c6b9ce-6a77-4ce0-a064-291015801db2.png)

