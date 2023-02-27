---
title: 'openGauss使用gdb进行开发调试'
date: '2021-12-27'
category: 'blog'
tags: ['openGauss使用进行开发调试']
archives: '2021-12-27'
author: 'zhangxb'
summary: 'openGauss使用gdb进行开发调试'
img: '/zh/blogs/zhangxb/title/img.png'
times: '19:30'
---

## 使用 gdb 工具对 openGauss 进行开发调试

### 概述

本文简单介绍了下如何使用 gdb 工具，在开发过程中对 opengauss 源码进行编译和调试。

数据库的编译可以在 root 和子用户下，但是数据库运行只在在子用户下，因此我们如下的操作都在子用户下进行。

如下命令：

```
groupadd omm
useradd -g omm -m omm
su - omm
mkdir -p /home/omm/ogcompile
cd /home/omm/ogcompile
```

### 前提准备

1. 下载 openGauss 源码到 Linux 服务器上面,此处以 2.1.0 版本为例。（推荐使用 `Centos7-x86_64`,或者` openEuler20.03LTS-arm`,或 `openEuler20.03LTS-x86_64`）。

   ```
   git clone https://gitee.com/opengauss/openGauss-server.git -b 2.1.0

   ```

2. 下载最新的三方库二进制包并解压。

   ```
   wget https://gitee.com/link?target=https%3A%2F%2Fopengauss.obs.cn-south-1.myhuaweicloud.com%2F2.1.0%2FopenGauss-third_party_binarylibs.tar.gz
   tar -zxf openGauss-third_party_binarylibs.tar.gz

   ```

3. 安装三方依赖

   ```
   sudo yum install libaio-devel flex bison ncurses-devel glibc-devel patch lsb_release readline-devel libaio-devel -y

   ```

### 编译数据库

1. 导入环境变量

```
export CODE_BASE=/home/omm/ogcompile/openGauss-server
export BINARYLIBS=/home/omm/ogcompile/openGauss-third_party_binarylibs
export GAUSSHOME=$CODE_BASE/dest/
export GCC_PATH=$BINARYLIBS/buildtools/centos7.6_x86_64/gcc7.3/
export CC=$GCC_PATH/gcc/bin/gcc
export CXX=$GCC_PATH/gcc/bin/g++
export LD_LIBRARY_PATH=$GAUSSHOME/lib:$GCC_PATH/gcc/lib64:$GCC_PATH/isl/lib:$GCC_PATH/mpc/lib/:$GCC_PATH/mpfr/lib/:$GCC_PATH/gmp/lib/:$LD_LIBRARY_PATH
export PATH=$GAUSSHOME/bin:$GCC_PATH/gcc/bin:$PATH

```

如上环境变量中，`centos7.6_x86_64`为当前系统平台信息。
以实际为准。可以通过在 `openGauss-server` 源码目录下执行命令 `sh src/get_PlatForm_str.sh` 查询。

2. 编译数据库

导入上面一步中的环境变量之后，进入到 openGauss-server 源码目录下，执行下面几步进行编译数据库.

配置：

```
./configure --gcc-version=7.3.0 CC=g++ CFLAGS='-O0' --prefix=$GAUSSHOME --3rd=$BINARYLIBS --enable-debug --enable-cassert --enable-thread-safety --with-readline --without-zlib

```

编译：

```
make -sj10
make install -sj\

```

等待编译成功后，编译的结果在该环境变量所示路径中`export GAUSSHOME=$CODE_BASE/dest/`，即在`/home/omm/ogcompile/openGauss-server/dest`目录下。

### 初始化和启动数据库

1. 初始化数据库目录

   ```
    gs_initdb -D /home/omm/ogcompile/datanode/dn1 --nodename=single -w openGauss@123

   ```

2. 拉起数据库

   ```
   gs_ctl start -D /home/omm/ogcompile/datanode/dn1

   ```

### 调试数据库

#### 调试数据库内核

1. 查看数据库实例进程

   ```
   ps -ef | grep gaussdb

   ```

   获取并记录进程号

2. 进入调试终端

   ```
   gdb attach <pid>

   ```

   `<pid>`为第一步记录的进程号。

3. 常用 gdb 命令

   - `b` 设置断点，例如 `b xlog.cpp:1021`，为 `xlog.cpp` 文件第 1021 行设置断点。

   - `n` 单步运行，不进入函数内部

   - `s` 单步运行，可以进入函数内部

   - `p` 打印变量值。 如 `p var1`

   - `bt` 打印堆栈

   - `info threads` 查看所有线程。openGauss 属于一进程+多线程的模型，通过该命令查询存在线程。

   - `q` 退出调试终端
