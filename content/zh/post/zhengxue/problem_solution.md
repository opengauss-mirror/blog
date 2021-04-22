+++
title = "ubuntu18.04_x86_64系统----openGauss数据库编译问题解决"
date = "2021-04-20"
tags = ["ubuntu18.04_x86_64系统----openGauss数据库编译问题解决"]
archives = "2021-04-20"
author = "shirley_zhengx"
summary = "ubuntu18.04_x86_64系统----openGauss数据库编译问题解决"
img = "/zh/post/zhengxue/title/img1.png"
times = "9:30"
+++


<!-- TOC -->
- [1. 编译三方库的问题解决](#1.编译三方库的问题解决)
- [2. 编译数据库的问题解决](#2.编译数据库的问题解决)


<!-- /TOC -->

# 1.编译三方库的问题解决
(1) python没有找到
![](../images/problem/1.1.0.png)
原因：输入命令`python`，发现是python2版本，需要python3

解决：
```
rm -rf /usr/bin/python
ln -s /usr/bin/python3 /usr/bin/python
```
(2) 编译libcgroup
![](../images/problem/1.1.1.png)
原因分析：去/data/openGauss-third_party/dependency/libcgroup下执行该命令，提示信息：
```
Command 'rpm2cpip' not found, but can be installed with:
apt install rpm2cpio
```
解决：apt install rpm2cpio

(3) 编译cJson

![](../images/problem/1.1.2.png)

原因分析：source 没有找到，可能是因为bash的问题，用命令ls -l `which sh` 查看发现是dash，不是bash，如下图：

![](../images/problem/1.1.3.png)

解决：sudo dpkg-reconfigure dash 重新配置dash，选择no则是bash

(4) 编译cffi

![](../images/problem/1.1.4.png)

解决：安装apt install libffi-dev，apt install libssl-dev，如果安装之后还报错误，换一个窗口执行

(5) 编译masstree

![](../images/problem/1.1.5.png) 

解决：apt install rename

(6) 编译libthrift

![](../images/problem/1.1.6.png) 

解决：apt install pkg-config

(7) 编译libthrift

![](../images/problem/1.1.7.png) 

原因分析：依赖的问题，boost要在libthrift之前编译，libthrift编译依赖boost

解决： 编译libthrift之前确保boost、openSSL已编译完成。

(8) 编译parquet

出现关于boost、zlib包的问题

解决：parquet依赖boost、zlib，编译arquet之前确保boost、zlib已编译完成

(9) 编译parquet

![](../images/problem/1.1.8.png) 

原因分析： 查看log，发现cmake问题

![](../images/problem/1.1.9.png) 

解决： 安装cmake3.16版本以上，并导入环境变量

(10) 编译libxml2

![](../images/problem/1.1.10.png)

原因分析：用file命令（辨识文件类型：file 文件名），执行 `file libxml2-2.9.9.tar.gz`，如下图，发现包类型不对，包与社区源码的大小不一样，是因为包没有下载好。

![](../images/problem/1.1.11.png)

解决：用root用户重新git clone，如果还是包大小不对，则去gitee仓库页面下载。

(11) 编译pljava

![](../images/problem/1.1.12.png)

原因分析：同(10)一样

解决：root用户重新git clone，如果还是包大小不对，则去gitee仓库页面下载。

(12) 编译pljava

![](../images/problem/1.1.13.png)

解决： apt install libkrb5-dev

(13) 

![](../images/problem/1.1.14.png)

解决： apt install libjsoncpp-dev

(14) 

![](../images/problem/1.1.15.png)

原因分析： 原因1：查看是不是python3
          原因2：查看：boost_1_72_0/tools/build/src/tools/python.jam，如下图：
          ![](../images/problem/1.1.16.png)

解决： 修改为includes ?= $(prefix)/include/python$(version)m


# 2.编译数据库的问题解决

(1)
 
![](../images/problem/1.1.17.png)

原因： felx和bison版本不一致引起
 
解决： 需安装flex和bison对应版本，安装flex2.6.1 和 bison3.5.3，并导入环境变量。
     此错误一旦出现，安装flex和bison之后，make distclean无法清除所有残留文件，再次编译会同样报错，建议重新下载源码编译。

(2) 

![](../images/problem/1.1.18.png)

去掉s，重新make，可以看到详细信息

![](../images/problem/1.1.19.png)

解决：安装apt install libstdc++-8-dev，一定要make clean之后再重新编译

(3)

![](../images/problem/1.1.20.png)

![](../images/problem/1.1.23.png)

原因分析：编译中需要usr/bin/flex
解决: apt install flex  apt install bison

(4) 

![](../images/problem/1.1.21.png)

原因分析： 查看config.log，如下图：

![](../images/problem/1.1.22.png)

解决：
```
cd /usr/include
ln -s x86_64-linux-gnu/asm asm
```
(5)

![](../images/problem/1.1.24.png)

解决：apt install libedit-dev











