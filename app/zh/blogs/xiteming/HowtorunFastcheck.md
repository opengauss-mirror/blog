---
title: '如何跑各种check'
date: '2021-11-09'
category: 'blog'
tags: ['openGauss如何跑各种check']
archives: '2021-11-09'
author: 'xiteming, pengjiong'
summary: '如何跑各种check'
img: '/zh/blogs/xingchen/title/img1.png'
---

## 如何进行 Fastcheck？

首先，导入环境变量：

```
export CODE_BASE=/data/openGauss-server
export BINARYLIBS=/data/openGauss-third_party_binarylibs
export GAUSSHOME=$CODE_BASE/dest/
export GCC_PATH=$BINARYLIBS/buildtools/openeuler_aarch64/gcc7.3/
export CC=$GCC_PATH/gcc/bin/gcc
export CXX=$GCC_PATH/gcc/bin/g++
export LD_LIBRARY_PATH=$GAUSSHOME/lib:$GCC_PATH/gcc/lib64:$GCC_PATH/isl/lib:$GCC_PATH/mpc/lib/:$GCC_PATH/mpfr/lib/:$GCC_PATH/gmp/lib/:$LD_LIBRARY_PATH
export PATH=$GAUSSHOME/bin:$GCC_PATH/gcc/bin:$PATH
```

需要准备好的文件有：testname.sql 和 testname.out；
第一步：将 testname.sql 放入/src/test/regress/sql 路径下，同时将 testname.out 放入/src/test/regress/expected 路径下。
Tip1：执行完本步后，需要注意两个问题：
（1） 文件权限问题，相关命令关键字：chmod，chown；
（2） 文件格式问题，相关命令关键字：dos2unix。
第二步：在/src/test/regress/parallel_schedule0 中添加你的测试用例：
test：testname
第三步：进入源码根目录进行 configure：

```
./configure --gcc-version=7.3.0 CC=g++ CFLAGS='-O0' --prefix=$GAUSSHOME --3rd=$BINARYLIBS --enable-debug --enable-cassert --enable-thread-safety --with-readline --without-zlib
```

第四步：在源码根目录下编译及安装
make -sj
make install –sj
第五步：在/src/test/regress 目录下执行语句：
make fastcheck_single
经验技巧： 1.如何确定期望输出：对于期望输出，如果你的测试用例的输出是确定的，那么一个最简单的方法就是先创建一个 parallel_scheduleYYY 的临时文件，里面只包含你要添加的测试用例，然后运行一次 make fastcheck_single，这样得到的 diffs 中就包含是你的期望输出。

## 如何进行 memcheck？

memcheck 并不是一个新的 check，只是编译 openGauss 时，编译一个 memcheck 版的，然后通过跑 fastcheck_single 来发现代码中的内存问题。
编译方式和编译普通的 openGauss 基本一致，只是在 configure 时，添加一个 `--enable-memory-check` 参数，编译出来的就是 memcheck 版本的 openGauss。

```
./configure --gcc-version=7.3.0 CC=g++ CFLAGS='-O0' --prefix=$GAUSSHOME --3rd=$BINARYLIBS --enable-debug --enable-cassert --enable-thread-safety --with-readline --without-zlib --enable-memory-check
```

跑 memcheck 之前，需要设置环境变量：

```shell
ulimit -v unlimited
```

设置完环境变量后，正常跑 fastcheck_single 即可，跑完后，会在 `~/memchk/asan/`路径下生成文件名为 runlog.xxx 的 memcheck 报告。根据 memcheck 报告分析是否有内存问题。如何分析 memcheck 报告可自行网上搜索 memcheck 报告分析、asan 报告分析等关键字。

## 如何进行 hacheck？

hacheck 是对 openGauss 主备功能进行测试的 check，openGauss 的编译方式同 fastcheck，编译完成后，进入 `src/test/ha`目录，修改 standby_env.sh 文件，在文件最前面新增一行

```shell
export prefix=$GAUSSHOME
```

脚本中将尝试通过 ifconfig 命令获取本机 IP，如果本机网卡的名称不是 eth0、eth1、ens4f0、enp2s0f0、enp2s0f1、enp125s0f0 之一的话，获取 IP 将失败，此时可以在

```
enp125s0f0=`/sbin/ifconfig enp125s0f0|sed -n 2p |awk  '{ print $2 }'`
```

的下面手动添加本机 IP 地址：

```
enp125s0f0=`/sbin/ifconfig enp125s0f0|sed -n 2p |awk  '{ print $2 }'`
eth0ip=1.1.1.1
```

配置好脚本后，执行 hacheck 脚本：

```shell
sh run_ha_multi_single.sh
sh run_ha_single.sh
```

运行是否成功会在屏幕打印 ok/failed，运行日志在 `src/test/ha/results`目录下。

## 如何进行发布订阅的check？
发布订阅是openGauss实现集群间数据实时同步的一个关键特性，由于该特性的测试需要部署多个集群，因此有独立的测试目录。openGauss的编译方式同fastcheck，编译完成后，进入```src\test\subscription```目录，执行
```shell
make check p={port} dbcompatibility={dbcompatibility}
```
port参数指定运行的端口号，默认取值是25800，该check会部署两个一主两备的集群，端口分别是port、port+3、port+6、port+9、port+12和port+15。dbcompatibility参数指定database的兼容性，默认取值是A，可选范围是A、B、C、PG。运行是否成功会在屏幕打印 ok/failed，运行日志在```src\test\subscription\results```目录下，创建的数据库目录在```src\test\subscription\tmp_check```目录下。