---
title: 'MogDB/openGauss 生态工具-MTK对glibc版本的解决'

date: '2022-05-24'

category: 'blog'
tags: ['MogDB/openGauss 生态工具-MTK对glibc版本的解决']

archives: '2022-05'

author: '云和恩墨-阎书利'

summary: 'MogDB/openGauss 生态工具-MTK对glibc版本的解决'

img: '/zh/blogs/ysl/title/img39.png'

times: '10:20'
---

# MogDB/openGauss 生态工具-MTK 对 glibc 版本的解决

本文出处：[https://www.modb.pro/db/176906](https://www.modb.pro/db/176906)

使用 MogDB/openGauss 生态工具-MTK(Migration ToolKit) 数据库迁移工具时候，发现报错
**libc.so.6: version `GLIBC_2.14’ not found**
<img src='./figures/20211124-4c0ac902-474e-4fd6-ad4a-9d60029bf2e1.png'>
出现这种错误表明程序运行需要 GLIBC_2.14，但是系统中却并不存在，因此可以先用 strings 命令查看下系统中的 GLIBC 版本

有问题环境为 centos6 的环境，最初在 centos7 环境部署使用时候，并未出现此问题。
查看有问题的 centos6 的系统 glibc 支持的版本，发现只支持到 2.12
<img src='./figures/20211124-f8c9b45c-63c2-4445-8c6e-b4de961d9a09.png'>

而之前没问题的 centos7 环境的系统 glibc 支持的版本是到 2.17，满足了要使用的 GLIBC_2.14
<img src='./figures/20211124-29242326-2407-49cc-80e8-95e826d7f540.png'>

该问题是由于 Linux 系统的 glibc 版本太低，而软件编译时使用了较高版本的 glibc 引起的。
因此，需要升级 glibc 支持的版本。

如下为升级 glibc 版本到 2.18 过程，已验证过。

```
# wget http://ftp.gnu.org/gnu/glibc/glibc-2.18.tar.gz
# tar -xvf glibc-2.18.tar.gz
# cd glibc-2.18
# mkdir build && cd build && ../configure --prefix=/usr && make -j4 && make install

```

升级之后，mtk 可以正常使用
