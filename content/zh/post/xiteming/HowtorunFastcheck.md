+++
title = "如何跑Fastcheck"
date = "2021-11-09"
tags = ["openGauss如何跑Fastcheck"]
archives = "2021-11-09"
author = "xiteming"
summary = "如何跑Fastcheck"
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