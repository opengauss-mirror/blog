---
title: 'openGauss编译安装常见错误及解决'
date: '2021-12-20'
category: 'blog'
tags: ['openGauss使用增强']
archives: '2021-12'
author: 'cchen676'
summary: 'openGauss编译安装常见错误及解决'
img: '/zh/blogs/cchen676/title/img26.png'
times: '16:30'
---

# openGauss 编译安装常见错误及解决

### 一、编译安装流程

在编译安装 openGauss 中的遇到的问题大部分和环境和编译步骤相关, 下面先简单介绍下编译安装的步骤, 详细可参考 openGauss-server 仓的 readme

1. 准备环境: 主要分为下载社区代码, 三方库, 准备安装环境, 按要求准备操作系统, 软件包依赖
2. 配置环境变量: 配置 GAUSSHOME 路径, 三方库路径, GCC 路径, LD_LIBRARY_PATH 路径和 PATH 等
3. 执行编译命令: 执行 configure, make, make install

更详细的步骤可参考[openGauss 数据库编译指导
](https://opengauss.org/zh/blogs/blogs.html?post/xingchen/opengauss_compile/)

### 二、常见编译安装问题总结

**问题 1**: 缺少相关动态库依赖
比如常见报错 libreadline.so.7: cannot open shared object file: No such file or directory
解决办法: 安装对应的依赖软件包即可

| 软件           | 推荐版本          |
| -------------- | ----------------- |
| libaio-devel   | 0.3.109-13        |
| flex           | 2.5.31 及以上版本 |
| bison          | 2.7-4             |
| ncurses-devel  | 5.9-13.20130511   |
| glibc-devel    | 2.17-111          |
| patch          | 2.7.1-10          |
| lsb_release    | 4.1               |
| readline-devel | 7.0-13            |

有时 repo 仓库中默认的软件版本不是推荐的版本, 可以查询是否有相关版本, 然后 yum 安装指定版本, 比如:

```shell
yum --showduplicates list _软件包名称_ | expand
yum install flex-2.6.1-13.oe1
```

**问题 2** undefined reference to `core_yylex(core_YYSTYPE*, int*, void\*)'
这个报错一般是由于 flex 和 bison 的版本不匹配导致, 详细的原因可以参考:
[#I3NW7K:编译报错](https://gitee.com/opengaussorg/dashboard?issue_id=I3NW7K)

一般常见于在非安装指导中列出的操作系统和对应版本上安装

比如在 openEuler 20.03 LTS SP1 上安装, 红旗上安装, 等等

解决办法: 卸载原 flex 和 bison, 然后安装满足要求的 flex 和 bison 的版本, 删除已下载的源码, 重新下载后编译

> 这种错误可能是由于 flex 和 bison 版本引起的。 请先检查两个库是否安装，以及安装的版本。 建议两个版本不能距离太远。
> 例如像 flex-2.6.1 匹配 bison-3.5.3 就合适。
> 举例：
> centos7.6，默认安装的 flex-2.5.37 bison-3.0.5 是可以编译的；
> openEuler20.03 默认安装的 flex-2.6.1 bison-3.5 是可以编译的；
> ubuntu18.04 下，默认安装的 flex-2.6.4 bison-3.0.5，则编译会遇到这个问题。
> ubuntu18.04 下，手动安装 flex-2.6.1 bison-3.5.3，就可以编译成功。
> Euler2.9 下，flex 2.6.4 bison3.6.4 是有问题的。 bison 使用 3.5 的版本应该 ok。

**问题 3** 找不到 jni.h, jni_conn_cursor.cpp:26:10: fatal error: jni.h: No such file or directory

该问题比较少见, 一般是由于操作系统环境的其他环境变量影响, 导致编译程序找不到三方库目录中的 jni.h 文件导致
一种解决方案是手动把三方库目录中的 jni.h 文件所在的目录添加到 LD_LIBRARY_PATH 中, 比如加入$BINARYLIBS/platform/centos7.6_x86_64/openjdk8/jdk1.8.0_222/include 目录:

```shell
export LD_LIBRARY_PATH=$GAUSSHOME/lib:$GCC_PATH/gcc/lib64:$GCC_PATH/isl/lib:$GCC_PATH/mpc/lib:$GCC_PATH/mpfr/lib:$GCC_PATH/gmp/lib:$BINARYLIBS/platform/centos7.6_x86_64/openjdk8/jdk1.8.0_222/include:$LD_LIBRARY_PATH
```

**问题 4** gcc 版本不对

该问题一般是由于环境变量配置不对导致, 编译安装时需要使用的是三方库目录中带的 gcc 7.3 版本, 而不是操作系统中的版本
所以在编译时有环境变量 GCC_PATH 的路径配置

```shell
export GCC_PATH=$BINARYLIBS/buildtools/centos7.6_x86_64/gcc7.3/
```
