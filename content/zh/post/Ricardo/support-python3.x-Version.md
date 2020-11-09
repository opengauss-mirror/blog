+++
title = "兼容多版本Python的第三方库编译说明"
date = "2020-11-9"
tags = ["兼容多版本Python的第三方库编译说明"]
archives = "2020-11"
author = "Ricardo.Cui"
summary = "兼容多版本Python的第三方库编译说明"
img = "/zh/post/lijun/title/title.png" 
times = "19:30"
+++


### 概述

本文描述了openGauss数据库的第三方库，如何在CentOS系统上编译出支持多版本python环境的第三方库。

**硬件规格：**  
CPU:	Intel(R) Xeon(R) Gold 6266C CPU @ 3.00GHz 7核  
内存:	32G

**软件规格：**   
操作系统:	CentOS Linux release 7.6.1810 (Core)  
数据库: openGauss 1.0.1  
Python版本：3.7.7

---

### 编译步骤

若希望编译出的支持多版本安装的第三方库，只需在所需环境下单独编译CFFI模组，并将其放入openGauss-third_party_binartlibs//dependency/centos7.6_x86_64/install_tools目录下即可，下面为详细过程。

**1.环境准备**

首先确定所用系统为CentOS x86_64, 接着安装编译所需组件：  
>openSSL  
openSSL-devel  
libaio-devel  
ncurses-devel  
pam-devel  
libffi-devel  
python3-devel  
libtool

建议采用yum install *** 方式安装。

**2.编译安装Python3.X.X**  
官网下载所需的Python3.X.X源代码并解压。进入解压出来的python目录用运行如下命令：  
>`vi Modules/Setup.dist`  

搜索SSL并且取消注释如下代码：  

>`# Socket module helper for socket(2)`  
`_socket socketmodule.c`  
>
>`# Socket module helper for SSL support; you must comment out the other`  
`# socket line above, and possibly edit the SSL variable:`  
`#SSL=/usr/local/ssl`  
`_ssl _ssl.c `  
`        -DUSE_SSL -I$(SSL)/include -I$(SSL)/include/openssl`  
`        -L$(SSL)/lib -lssl -lcrypto`  

如果SSL不是在默认路径，则需修改SSL路径为安装目录。  

编译安装python到指定目录： 
>`./configure --prefix=/usr/local/python3.x.x/ --enable-shared`  
`make && make install`  

安装成功后运行`python -V`命令查看python版本是否为所需版本，若不是请去/usr/bin目录修改python软链接使其指向正确的python安装目录。

**3.编译第三方库**  
从社区下载的第三方编译源码openGauss-third_party, 
进入openGauss-third_party/dependency/build，打开build_dependency.sh脚本，注释掉不需要编译的第三方组件：  
>...  
`function build_pylib()`
`{`
`#    build_item six`  
`#    build_item pycparser`  
`    build_item cffi`  
`#    build_item bcrypt`  
`#    build_item idna`  
`#    build_item ipaddress`  
`#    build_item netifaces`  
`#    build_item pynacl`  
`#    build_item asn1crypto`  
`#    build_item cryptography`  
`#    build_item pyOpenSSL`  
`#    build_item paramiko`  
`#    build_item psutil`  
`#    build_item pyasn1`  
`    if [ -d $BUILD_SCRIPT_PATH/../install_comm ];then`  
`        rm -rf $BUILD_SCRIPT_PATH/../install_comm`  
`    fi`  
`}`  
...

注释掉Main函数中的  
>...  
`#    build_first`  
`#    build_second`   
`    build_pylib`  
...  

再进入openGauss-third_party/build文件夹下，打开build_all.sh脚本,在最下方注释掉以下几行：
>`#    build_item buildtools`  
    `build_item dependency`  
`#    build_item platform`  

在build目录下运行脚本：  
>`cd ..`  
`sh build_all.sh`

binarylibs会生成到openGauss-third_party同级目录下，名为binarylibs。如果部分组件构建失败，可以检查日志。
将binarylibs拷贝至openGauss-third_party_binarylibs：
>`\cp -r binarylibs/ openGauss-third_party_binarylibs/`  

如果希望在binarylibs中支持多个python版本，则需在多个版本python中重复以上步骤，编译对应版本的cffi，并将编译出的文件，放入openGauss-third_party_binarylibs/dependency/centos7.6_x86_64/install_tools目录下

```
drwxr-xr-x 2 root root   4096 Nov  3 15:24 bcrypt  
drwxr-xr-x 2 root root   4096 Nov  3 15:24 cffi  
-rw-r--r-- 1 root root    289 Nov  3 15:24 _cffi_backend.py
-rwxr-xr-x 1 root root 189816 Nov  3 15:24 _cffi_backend.so_UCS2_3.6
-rwxr-xr-x 1 root root 189816 Nov  4 09:21 _cffi_backend.so_UCS2_3.7
-rwxr-xr-x 1 root root 189816 Nov  3 15:24 _cffi_backend.so_UCS4_3.6
-rwxr-xr-x 1 root root 189816 Nov  4 09:21 _cffi_backend.so_UCS4_3.7
drwxr-xr-x 4 root root   4096 Nov  3 15:26 cryptography
drwxr-xr-x 4 root root   4096 Nov  3 15:26 nacl
drwxr-xr-x 2 root root   4096 Nov  3 15:25 netifaces
drwxr-xr-x 2 root root   4096 Nov  3 15:26 psutil
```









