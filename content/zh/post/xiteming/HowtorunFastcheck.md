+++
title = "如何跑各种check"
date = "2021-11-09"
tags = ["openGauss如何跑各种check"]
archives = "2021-11-09"
author = "xiteming, pengjiong"
summary = "如何跑各种check"
img = "/zh/post/xingchen/title/img1.png"

+++

## 如何进行Fastcheck？
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
需要准备好的文件有：testname.sql和testname.out；
第一步：将testname.sql放入/src/test/regress/sql路径下，同时将testname.out放入/src/test/regress/expected路径下。
Tip1：执行完本步后，需要注意两个问题：
（1） 文件权限问题，相关命令关键字：chmod，chown；
（2） 文件格式问题，相关命令关键字：dos2unix。
第二步：在/src/test/regress/parallel_schedule0中添加你的测试用例：
test：testname
第三步：进入源码根目录进行configure：
```
./configure --gcc-version=7.3.0 CC=g++ CFLAGS='-O0' --prefix=$GAUSSHOME --3rd=$BINARYLIBS --enable-debug --enable-cassert --enable-thread-safety --with-readline --without-zlib
```
第四步：在源码根目录下编译及安装
make -sj
make install –sj
第五步：在/src/test/regress目录下执行语句：
make fastcheck_single
经验技巧：
1.如何确定期望输出：对于期望输出，如果你的测试用例的输出是确定的，那么一个最简单的方法就是先创建一个parallel_scheduleYYY的临时文件，里面只包含你要添加的测试用例，然后运行一次make fastcheck_single，这样得到的diffs中就包含是你的期望输出。

## 如何进行memcheck？
memcheck并不是一个新的check，只是编译openGauss时，编译一个memcheck版的，然后通过跑fastcheck_single来发现代码中的内存问题。
编译方式和编译普通的openGauss基本一致，只是在configure时，添加一个 ```--enable-memory-check``` 参数，编译出来的就是memcheck版本的openGauss。
```
./configure --gcc-version=7.3.0 CC=g++ CFLAGS='-O0' --prefix=$GAUSSHOME --3rd=$BINARYLIBS --enable-debug --enable-cassert --enable-thread-safety --with-readline --without-zlib --enable-memory-check
```
跑memcheck之前，需要设置环境变量：
```shell
ulimit -v unlimited
```
设置完环境变量后，正常跑fastcheck_single即可，跑完后，会在 ```~/memchk/asan/```路径下生成文件名为runlog.xxx的memcheck报告。根据memcheck报告分析是否有内存问题。如何分析memcheck报告可自行网上搜索memcheck报告分析、asan报告分析等关键字。

## 如何进行hacheck？
hacheck是对openGauss主备功能进行测试的check，openGauss的编译方式同fastcheck，编译完成后，进入 ```src/test/ha```目录，修改standby_env.sh文件，在文件最前面新增一行
```shell
export prefix=$GAUSSHOME
```
脚本中将尝试通过ifconfig命令获取本机IP，如果本机网卡的名称不是eth0、eth1、ens4f0、enp2s0f0、enp2s0f1、enp125s0f0之一的话，获取IP将失败，此时可以在
```
enp125s0f0=`/sbin/ifconfig enp125s0f0|sed -n 2p |awk  '{ print $2 }'`
```
的下面手动添加本机IP地址：
```
enp125s0f0=`/sbin/ifconfig enp125s0f0|sed -n 2p |awk  '{ print $2 }'`
eth0ip=1.1.1.1
```
配置好脚本后，执行hacheck脚本：
```shell
sh run_ha_multi_single.sh
sh run_ha_single.sh
```
运行是否成功会在屏幕打印 ok/failed，运行日志在 ```src/test/ha/results```目录下。

## 如何进行发布订阅的check？
发布订阅是openGauss实现集群间数据实时同步的一个关键特性，由于该特性的测试需要部署多个集群，因此有独立的测试目录。openGauss的编译方式同fastcheck，编译完成后，进入```src\test\subscription```目录，执行
```shell
make check p={port}
```
port参数指定运行的端口号，该check会部署两个一主两备的集群，端口分别是port、port+3、port+6、port+9、port+12和port+15。运行是否成功会在屏幕打印 ok/failed，运行日志在```src\test\subscription\results```目录下，创建的数据库目录在```src\test\subscription\tmp_check```目录下。
