+++
title = "gcc编译指导"
date = "2021-02-23"
tags = ["gcc编译指导"]
archives = "2021-02-23"
author = "xingchen"
summary = "gcc编译指导"
img = "/zh/post/xingchen/title/img1.png"
times = "19:30"
+++

## 概述

openGauss的编译依赖gcc，目前官方推荐使用gcc7.3版本来编译。 但是三方库中未给出gcc的编译指导。本文档介绍如何编译gcc。


## 步骤

以openEuler20.03 LTS系统，arm架构，gcc7.3版本为例 (其他版本的gcc也与此相同)。
Gcc的编译依赖 `gmp` `isl` `mpc` `mpfr` ，需要先编译这四个库。

三方库依赖以及下载地址如下：

<table>
<tbody>
    <tr>
        <td>gcc7.3</td>
        <td>http://ftp.gnu.org/gnu/gcc/gcc-7.3.0/</td>
    </tr>
    <tr>
        <td>gmp</td>
        <td>http://ftp.gnu.org/gnu/gmp/gmp-6.1.1.tar.xz</td>
    </tr>
    <tr>
        <td>mpc</td>
        <td>http://ftp.gnu.org/gnu/mpc/mpc-1.1.0.tar.gz</td>
    </tr>
    <tr>
        <td>isl</td>
        <td>https://gcc.gnu.org/pub/gcc/infrastructure/isl-0.18.tar.bz2</td>
    </tr>
</tbody>
</table>

将这几个三方库上传到服务器上面，按照如下顺序进行编译：

## 1. 编译gmp

解压：`tar -xf gmp-6.1.1.tar.xz`

编译：
***prefix路径可以自己指定，表示编译结果存放路径。***

```
./configure --prefix=/usr2/zxb/compile/target/gmp      
make –j
make install –j
```

## 2. 编译mpfr

解压: `tar –xf mpfr-4.0.2.tar.gz`

编译：
***--prefix路径自己指定，--with-gmp路径为上一步gmp编译的prefix路径。下面与此相同。***

```
./configure --prefix=/usr2/zxb/compile/target/mpfr --with-gmp=/usr2/zxb/compile/target/gmp 
make –j
make install -j
```

## 3. 编译mpc

解压: `tar –xf mpc-1.1.0.tar.gz`

编译:

```
./configure --prefix=/usr2/zxb/compile/target/mpc --with-gmp=/usr2/zxb/compile/target/gmp --with-mpfr=/usr2/zxb/compile/target/mpfr
make –j
make install -j
```

## 4. 编译isl

解压: `tar –xf isl-0.18.tar.bz2`

编译：

```
./configure --prefix=/usr2/zxb/compile/target/isl --with-gmp-prefix=/usr2/zxb/compile/target/gmp
make –j
make install -j
```

## 5. 编译gcc

1. 先安装编译gcc需要的依赖

```
yum install gcc-c++ glibc-devel
```

2. 注释 `sys/ustat.h `相关信息

在 `glibc>=2.28` 的系统，去掉了 `ustat.h` 文件，gcc源码需要删除相关信息。(可以通过 `yum list | grep glibc` 查看当前系统的 `glibc` 版本)

```
vim ./libsanitizer/sanitizer_common/sanitizer_platform_limits_posix.cc
```

注释掉如下内容：

```
第157行 //#include <sys/ustat.h>
第250行 //unsigned struct_ustat_sz = sizeof(struct ustat);
```


(参照： https://stackoverflow.com/questions/56096060/how-to-fix-the-gcc-compilation-error-sys-ustat-h-no-such-file-or-directory-i)

3. 导入环境变量

```
export LD_LIBRARY_PATH=/usr2/zxb/compile/target/gmp/lib:/usr2/zxb/compile/target/mpfr/lib:/usr2/zxb/compile/target/mpc/lib:/usr2/zxb/compile/target/isl/lib:${LD_LIBRARY_PATH}
export C_INCLUDE_PATH=/usr2/zxb/compile/target/gmp/include:/usr2/zxb/compile/target/mpfr/include:/usr2/zxb/compile/target/mpc/include:/usr2/zxb/compile/target/isl/include:${C_INCLUDE_PATH}
```

***环境变量中的路径，为上面编译的几个三方库各自的prefix路径。***

4. 编译gcc

***环境变量中的路径，为上面编译的几个三方库各自的prefix路径。***

```
./configure CFLAGS='-fstack-protector-strong -Wl,-z,noexecstack -Wl,-z,relro,-z,now ' --prefix=/usr2/zxb/compile/target/gcc --with-gmp=/usr2/zxb/compile/target/gmp --with-mpfr=/usr2/zxb/compile/target/mpfr --with-mpc=/usr2/zxb/compile/target/mpc --with-isl=/usr2/zxb/compile/target/isl --disable-multilib --enable-languages=c,c++
make –j
make install –j
```


## 6. 编译cmake

下载cmake源码 `https://github.com/Kitware/CMake/releases`

解压后进入到源码根目录

```
./configure --prefix=/usr2/zxb/compile/cmake3.18   ##prefix为编译结果路径
make –j
make install -j
```


## 拷贝gcc到三方库中

编译完后，将 `/usr2/zxb/compile/target` 下的 `gmp mpfr mpc isl gcc` 拷贝到三方库二进制的 `buildtools/${platform}/gcc7.3` 下面，即可用来编译openGauss数据库。






