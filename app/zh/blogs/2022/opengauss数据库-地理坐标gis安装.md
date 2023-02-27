---
title: 'pengauss数据库-地理坐标gis安装'

date: '2021-12-31'

category: 'blog'
tags: ['pengauss数据库-地理坐标gis安装']

archives: '2021-12'

author: '周琦放'

summary: 'pengauss数据库-地理坐标gis安装'

img: '/zh/blogs/2022/title/img19.png'

times: '12:30'
---

# opengauss 数据库-地理坐标 gis 安装<a name="ZH-CN_TOPIC_0000001187213636"></a>

如无特殊说明，请在所有节点执行，执行用户为 root

## 组件下载<a name="section18245122612010"></a>

下载 gis 组件：Yukon-1.0-Alpha-openGauss2.1.0-CentOS_x64.tar.gz,请注意下载的组件版本一定要和数据库版本严格一致

下载地址https://gitee.com/opengauss/Yukon/releases/v1.0-alpha

## 环境配置要求<a name="section14660203817208"></a>

本次安装使用的是 root 用户进行安装，而 opengauss 数据库的系统用户为 omm，需要把 omm 用户的环境变量配置到 root 下的/etc/profile 中，

如下：加粗部分为 omm 的环境变量，请根据实际情况修改，omm 用户的环境变量一般在/home/omm/.bashrc

```
more /etc/profile
......
export ORACLE_HOME=/root/ora2pg/instantclient_11_2
export PATH=$PATH:$ORACLE_HOME
export LD_LIBRARY_PATH=$ORACLE_HOME:$LD_LIBRARY_PATH
export TNS_ADMIN=$ORACLE_HOME
export PYTHON_HOME=/usr/local/python3
export PATH=$PATH:$PYTHON_HOME/bin
export PATH=/root/gauss_om/omm/script:$PATH
export GPHOME=/opt/huawei/install/om
export PATH=$GPHOME/script/gspylib/pssh/bin:$GPHOME/script:$PATH
export LD_LIBRARY_PATH=$GPHOME/lib:$LD_LIBRARY_PATH
export PYTHONPATH=$GPHOME/lib
export GAUSSHOME=/opt/huawei/install/app
export PATH=$GAUSSHOME/bin:$PATH
export LD_LIBRARY_PATH=$GAUSSHOME/lib:$LD_LIBRARY_PATH
export S3_CLIENT_CRT_FILE=$GAUSSHOME/lib/client.crt
export GAUSS_VERSION=2.1.0
export PGHOST=/opt/huawei/tmp
export GAUSSLOG=/var/log/omm/omm
umask 077
export GAUSS_ENV=2
export GS_CLUSTER_NAME=Cluster01
```

## 安装 Yukon gis 组件<a name="section17571321162213"></a>

```
tar -zxvf Yukon-1.0-Alpha-openGauss2.1.0-CentOS_x64.tar.gz
cd Yukon-1.0-Alpha-openGauss2.1.0/Yukon-1.0/
sh install_yukon.sh -i
```

## 验证测试<a name="section158540540228"></a>

```
[omm@ogpri ~]$ gsql -d postgres -p 26000
gsql ((openGauss 2.1.0 build 590b0f8e) compiled at 2021-09-30 14:29:04 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=# create database test;
CREATE DATABASE
openGauss=# \c test;
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "test" as user "omm".
test=# create extension postgis;
CREATE EXTENSION
test=#
```
