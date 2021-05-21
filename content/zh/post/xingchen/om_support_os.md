+++
title = "openGauss-OM修改来适配其他操作系统的安装"
date = "2021-05-21"
tags = ["openGauss-OM修改来适配其他操作系统的安装"]
archives = "2021-05-21"
author = "xingchen"
summary = "OM修改来适配其他操作系统的安装"
img = "/zh/post/xingchen/title/img1.png"
times = "19:30"
+++

## 概述

openGauss官方发布的镜像(https://opengauss.org/zh/download.html), 企业版镜像的安装支持如下系统：
```
centos7.6          x86_64
openEuler20.03LTS  arm | x86_64
kylin v10          arm | x86_64
```
此外其他的系统，在使用OM工具进行安装的时候，提示不支持该操作系统。

但是也有很多系统，比如说上面这些系统的发行版，在操作系统内核方面与以上并没有多少区别，但是由于修改了os-release的信息，导致在安装openGauss数据库时候被识别为不支持的系统，安装不上。

## 解决方案

可以通过两种方式来解决： 1.修改OM代码，增加对操作系统适配   2.修改操作系统os-release信息

#### 1.修改OM代码，增加对操作系统适配 

OM工具安装(也就是企业版的安装)，在安装过程中，会对操作系统进行校验，我们修改相关的python文件，添加我们的系统信息。

获取当前操作系统的脚本：
```
source /etc/os-release; echo $ID
```
获取当前cpu系统架构：
```
uname -p
```

在如下文件中添加系统信息，可以参照代码已有的系统修改：

`script/gspylib/os/gsplatform.py` 文件：

> 80 - 13行左右，增加操作系统平台信息和对应的版本。

> 1472行，getPackageFile 函数，增加对应的包名称。

`script/local/LocalCheckOS.py` 文件：

> CheckPlatformInfo函数，增加操作系统平台与对应版本信息。

#### 2.修改操作系统os-release信息

安装的脚本代码会校验操作系统的版本，是否在支持的列表中。 我们也可以通过修改操作系统的版本标识为已有的这些系统，来骗过安装的脚本校验。

操作系统版本相关的信息，在 /etc目录下的release文件中：
```
[root@ecs-6ac8 ~]# ll /etc | grep release
-rw-r--r--   1 root root       37 Apr  6 15:52 centos-release
-rw-r--r--   1 root root       51 Nov 23 23:08 centos-release-upstream
drwxr-xr-x.  2 root root     4096 Dec 13 00:27 lsb-release.d
lrwxrwxrwx   1 root root       21 Apr  1 14:32 os-release -> ../usr/lib/os-release
lrwxrwxrwx   1 root root       14 Apr  1 14:32 redhat-release -> centos-release
lrwxrwxrwx   1 root root       14 Apr  1 14:32 system-release -> centos-release
-rw-r--r--   1 root root       23 Nov 23 23:08 system-release-cpe
```

我们修改这些文件，将其中内容改为对应的openEuler的或者centos的信息。

例如在centos7.4系统下，使用官方发布的包安装不上，可以修改`/etc/os-release`，改版本为7.6，即可正常安装。
