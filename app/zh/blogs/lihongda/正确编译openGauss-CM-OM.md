---
title: '正确编译openGauss&CM&OM'

date: '2022-09-28'

tags: ['openGauss技术文章征集', 'CM', 'OM']

archives: '2022-9'

author: '李宏达'

summary: '本文从实际场景出发记录了openGauss，CM，OM整体编译流程，用户只需要选取干净的CentOS 7.6环境，配置好yum源，即可按照文中操作。'

img: '/zh/post/lihongda/title/title.png'

times: '17:40'
---

# 前言

---

本文从实际场景出发记录了 openGauss，CM，OM 整体编译流程，用户只需要选取干净的 CentOS 7.6 环境，配置好 yum 源，即可按照文中操作。

# 一、 编译 openGauss

## 1. 下载源码及依赖环境

- 安装依赖包

```
[root@ecs-lee ~]# yum install git libaio-devel flex bison ncurses-devel glibc-devel patch lsb_release readline-devel -y

```

- 下载源码

```
[root@ecs-lee lee]# git clone https://gitee.com/opengauss/openGauss-server.git
Cloning into 'openGauss-server'...
remote: Enumerating objects: 65231, done.
remote: Counting objects: 100% (19426/19426), done.
remote: Compressing objects: 100% (7501/7501), done.
remote: Total 65231 (delta 13941), reused 15163 (delta 11811), pack-reused 45805
Receiving objects: 100% (65231/65231), 202.18 MiB | 1.41 MiB/s, done.
Resolving deltas: 100% (45609/45609), done.
```

- 下载三方库

```
[root@ecs-lee openGauss-server]# wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/latest/binarylibs/openGauss-third_party_binarylibs_Centos7.6_x86_64.tar.gz
--2022-09-18 18:47:11--  https://opengauss.obs.cn-south-1.myhuaweicloud.com/latest/binarylibs/openGauss-third_party_binarylibs_Centos7.6_x86_64.tar.gz
Resolving opengauss.obs.cn-south-1.myhuaweicloud.com (opengauss.obs.cn-south-1.myhuaweicloud.com)... 139.159.208.230, 121.37.63.33, 121.37.63.38, ...
Connecting to opengauss.obs.cn-south-1.myhuaweicloud.com (opengauss.obs.cn-south-1.myhuaweicloud.com)|139.159.208.230|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 872769145 (832M) [application/gzip]
Saving to: ‘openGauss-third_party_binarylibs_Centos7.6_x86_64.tar.gz’

100%[=====================================================================================================================================================================================================================================>] 872,769,145 1.27MB/s   in 10m 35s

2022-09-18 18:57:46 (1.31 MB/s) - ‘openGauss-third_party_binarylibs_Centos7.6_x86_64.tar.gz’ saved [872769145/872769145]
```

- 解压

```
[root@ecs-lee openGauss-server]#  tar -xf openGauss-third_party_binarylibs_Centos7.6_x86_64.tar.gz
[root@ecs-lee openGauss-server]# ls
aclocal.m4  cmake           config.sh     contrib          dependency.xml         doc        GNUmakefile.in                      License   openGauss-third_party_binarylibs_Centos7.6_x86_64         README.md      Third_Party_Open_Source_Software_Notice
build       CMakeLists.txt  configure     CONTRIBUTING.md  distribute_errmsg.txt  docker     GNUmakefile.in_for_llt              liteom    openGauss-third_party_binarylibs_Centos7.6_x86_64.tar.gz  simpleInstall  Tools
build.sh    config          configure.in  COPYRIGHT        distribute_escan.txt   escan.txt  hw_partition_interval_exchange.out  Makefile  README.en.md                                              src
[root@ecs-lee openGauss-server]# mv openGauss-third_party_binarylibs_Centos7.6_x86_64 binarylibs
```

## 2. 编译代码解读

```
[root@ecs-lee openGauss-server]# tree build
build
└── script
    ├── aarch64_lite_list
    ├── aarch64_opengauss_list
    ├── build_opengauss.sh
    ├── cmake_package_mini.sh
    ├── gaussdb.ver
    ├── make_win_odbc_vs2010.bat
    ├── opengauss_config_file_mini
    ├── opengauss_release_list_mini
    ├── opengauss_release_list_ubuntu_single
    ├── package_opengauss.sh
    ├── separate_debug_information.sh
    ├── utils
    │   ├── cmake_compile.sh
    │   ├── common.sh
    │   ├── internal_packages_lite.sh
    │   ├── internal_packages.sh
    │   └── make_compile.sh
    ├── x86_64_lite_list
    └── x86_64_opengauss_list

2 directories, 18 files


[root@ecs-lee openGauss-server]# ls -lrt
total 853988
drwxrwxr-x  5 mogdb mogdb      4096 Sep 15 14:57 binarylibs
-rw-r--r--  1 root  root  872769145 Sep 16 20:00 openGauss-third_party_binarylibs_Centos7.6_x86_64.tar.gz
-rw-r--r--  1 root  root       2834 Sep 18 18:43 COPYRIGHT
-rw-r--r--  1 root  root       2402 Sep 18 18:43 CONTRIBUTING.md
-rwxr-xr-x  1 root  root       3692 Sep 18 18:43 CMakeLists.txt
-rw-r--r--  1 root  root      26170 Sep 18 18:43 README.md
-rw-r--r--  1 root  root      27611 Sep 18 18:43 README.en.md
-rw-r--r--  1 root  root       1488 Sep 18 18:43 Makefile
-rw-r--r--  1 root  root       9216 Sep 18 18:43 License
-rw-r--r--  1 root  root       4950 Sep 18 18:43 GNUmakefile.in_for_llt
-rw-r--r--  1 root  root       7758 Sep 18 18:43 GNUmakefile.in
drwxr-xr-x  3 root  root       4096 Sep 18 18:43 Tools
-rw-r--r--  1 root  root     419527 Sep 18 18:43 Third_Party_Open_Source_Software_Notice
-rwxr-xr-x  1 root  root       3290 Sep 18 18:43 build.sh
drwxr-xr-x  3 root  root       4096 Sep 18 18:43 build
-rw-r--r--  1 root  root        385 Sep 18 18:43 aclocal.m4
-rw-r--r--  1 root  root        168 Sep 18 18:43 config.sh
drwxr-xr-x  3 root  root       4096 Sep 18 18:43 cmake
drwxr-xr-x  2 root  root       4096 Sep 18 18:43 config
-rw-r--r--  1 root  root      65000 Sep 18 18:43 configure.in
-rwxr-xr-x  1 root  root     870365 Sep 18 18:43 configure
-rw-r--r--  1 root  root          0 Sep 18 18:43 distribute_escan.txt
-rw-r--r--  1 root  root      97509 Sep 18 18:43 distribute_errmsg.txt
-rw-r--r--  1 root  root       2277 Sep 18 18:43 dependency.xml
drwxr-xr-x 66 root  root       4096 Sep 18 18:43 contrib
drwxr-xr-x  3 root  root       4096 Sep 18 18:43 doc
drwxr-xr-x  3 root  root       4096 Sep 18 18:43 docker
-rw-r--r--  1 root  root      13171 Sep 18 18:43 hw_partition_interval_exchange.out
-rw-r--r--  1 root  root      68486 Sep 18 18:43 escan.txt
drwxr-xr-x  2 root  root       4096 Sep 18 18:43 simpleInstall
drwxr-xr-x  2 root  root       4096 Sep 18 18:43 liteom
drwxr-xr-x 10 root  root       4096 Sep 18 18:43 src


```

## 3. 编译参数解读

```
[root@ecs-lee openGauss-server]# ./build.sh --help
Usage: ./build.sh [OPTION]
    -h|--help                         show help information
    -m|--version_mode                 this values of paramenter is debug, release, memcheck or mini, the default value is release
    -3rd|--binarylib_dir              the parent directory of binarylibs
    -pkg|--package                    (deprecated option)package the project,by default, only compile the project
    -wrap|--wrap_binaries             wrop up the project binaries. By default, only compile the project
    -nopt|--not_optimized             on kunpeng platform, like 1616 version, without LSE optimized
    -f|--config_file                  set postgresql.conf.sample from config_file when packing
```

## 4. 编译代码

```
[root@node1 openGauss-server]# nohup sh build.sh -m release -pkg -3rd /root/binarylibs/ &
[1] 20852
[root@node1 openGauss-server]# nohup: ignoring input and appending output to ‘nohup.out’

[root@node1 openGauss-server]#
[root@node1 openGauss-server]#
[root@node1 openGauss-server]#
[root@node1 openGauss-server]#
[root@node1 openGauss-server]#
[1]+  Done                    nohup sh build.sh -m release -pkg -3rd /root/binarylibs/
[root@node1 openGauss-server]# cat nohup.out
ROOT_DIR : /root/openGauss-server
[makegaussdb] 22-09-25 19:32:58: script dir : /root/openGauss-server/build/script
[makegaussdb] 22-09-25 19:32:58: Work root dir : /root/openGauss-server

...


...
openGauss installation complete.
now, all build has finished!
[makegaussdb] 22-09-25 19:40:09: script dir : /root/openGauss-server/build/script
[makegaussdb] 22-09-25 19:40:09: Work root dir : /root/openGauss-server
Start package opengauss.
./separate_debug_information.sh: line 13: lsb_release: command not found
entry.py is a script, do not separate symbol
...

...

Begin package server
/root/openGauss-server/mppdb_temp_install
make server(all) package success!
packaging libpq...
success!
packaging tools...
success!
Begin to install upgrade_sql files...
Successfully packaged upgrade_sql files.
End package opengauss.
now, all packages has finished!

```

- 打包文件

```
[root@node1 openGauss-server]# ls -lrt output/
total 425664
-rwxr-xr-x. 1 root root 336276142 Sep 25 19:41 openGauss-3.1.0-CentOS-64bit-symbol.tar.gz
-rw-r--r--. 1 root root  86018592 Sep 25 19:41 openGauss-3.1.0-CentOS-64bit.tar.bz2
-rw-r--r--. 1 root root        65 Sep 25 19:41 openGauss-3.1.0-CentOS-64bit.sha256
-rw-r--r--. 1 root root   5083721 Sep 25 19:41 openGauss-3.1.0-CentOS-64bit-Libpq.tar.gz
-rw-r--r--. 1 root root   8015868 Sep 25 19:41 openGauss-3.1.0-CentOS-64bit-tools.tar.gz
-rw-------. 1 root root    467678 Sep 25 19:41 upgrade_sql.tar.gz
-rw-------. 1 root root        65 Sep 25 19:41 upgrade_sql.sha256

```

# 二、编译 OM

## 1. clone 代码

```
[root@node1 ~]# git clone https://gitee.com/opengauss/openGauss-OM.git
Cloning into 'openGauss-OM'...
remote: Enumerating objects: 3925, done.
remote: Counting objects: 100% (1541/1541), done.
remote: Compressing objects: 100% (1069/1069), done.
remote: Total 3925 (delta 975), reused 794 (delta 467), pack-reused 2384
Receiving objects: 100% (3925/3925), 2.48 MiB | 0 bytes/s, done.
Resolving deltas: 100% (2551/2551), done.
```

## 2. 帮助

```
[root@node1 ~]# cd openGauss-OM/
[root@node1 openGauss-OM]# ls
build  build.sh  LICENSE  other  README.en.md  README.md  script  simpleInstall
[root@node1 openGauss-OM]# sh build.sh --help
ROOT_DIR : /root/openGauss-OM
Usage: build.sh [OPTION]
    -h|--help                         show help information
    -3rd|--binarylib_dir              the parent directory of binarylibs
```

## 3. 编译

```
./build.sh --help or ./build.sh -h
[root@node1 openGauss-OM]# sh build.sh -3rd /root/binarylibs
ROOT_DIR : /root/openGauss-OM
Everything is ready.
success!
```

## 4. 查看文件

```
[root@node1 openGauss-OM]# ls
build  build.log  build.sh  LICENSE  other  package  README.en.md  README.md  script  simpleInstall
[root@node1 openGauss-OM]# ls -lrt package/
total 11664
-rw-r--r--. 1 root root 11939685 Sep 25 19:45 openGauss-3.1.0-CentOS-64bit-om.tar.gz
-rw-r--r--. 1 root root       65 Sep 25 19:45 openGauss-3.1.0-CentOS-64bit-om.sha256


```

# 三、编译 CM

## 1. 编译 Cmake

- 安装依赖包

```
[root@node1 script]# yum install gcc-c++
```

- 下载 Cmake

```
[root@node1 ~]# wget https://github.com/Kitware/CMake/releases/download/v3.14.1/cmake-3.14.1.tar.gz

100%[==================================================================================================>] 8,849,712   5.19MB/s   in 1.6s

2022-09-25 19:52:02 (5.19 MB/s) - ‘cmake-3.14.1.tar.gz’ saved [8849712/8849712]


[root@node1 ~]# tar xvf cmake-3.14.1.tar.gz && cd cmake-3.14.1/
[root@node1 ~]# ./bootstrap && gmake && gmake install
[root@node1 ~]# /usr/local/bin/cmake --version
[root@node1 ~]# ln -s /usr/local/bin/cmake /usr/bin/

```

## 2. clone 代码

```
[root@node1 ~]# git clone https://gitee.com/opengauss/CM.git
Cloning into 'CM'...
remote: Enumerating objects: 809, done.
remote: Counting objects: 100% (809/809), done.
remote: Compressing objects: 100% (545/545), done.
remote: Total 809 (delta 379), reused 605 (delta 246), pack-reused 0
Receiving objects: 100% (809/809), 1.14 MiB | 0 bytes/s, done.
Resolving deltas: 100% (379/379), done.

```

## 3. 帮助

```
[root@node1 CM]# sh build.sh --help
/root/CM/build/build.sh [-m {release|debug|memcheck|cov}] [-3rd ${THIRD_BINARY_PATH}] [-o ${OUTPUT_PATH}] [--pkg] [--single]
        default: /root/CM/build/build.sh -m release -3rd "/root/CM/binarylibs" -o "/root/CM/output"

```

## 4. 编译

```
[root@node1 CM]# sh build.sh -m release -3rd "/root/binarylibs" --pkg
gcc set to 3rd path:[/root/binarylibs/buildtools/gcc7.3/]!
We well get dcc lib from 3rd[/root/binarylibs/kernel/component/dcc].
clean dcc libs[/root/CM/common_lib/dcc/]
********************************************************************
start build CM with <release>
    project_root_path=[/root/CM]
    3rd=[/root/binarylibs]
    gcc=[7.3]
    pkg=[yes]
    etcd=[OFF]
    hotpatch=[OFF]
    libpq=[ON]
    krb=[OFF]
    multiple_nodes=[OFF]
    cmake_def=[-DCMAKE_INSTALL_PREFIX=/root/CM/output -DENABLE_PRIVATEGAUSS=OFF -DCMAKE_BUILD_TYPE=Release  -DENABLE_MULTIPLE_NODES=OFF -DENABLE_ETCD=OFF -DENABLE_HOTPATCH=OFF -DENABLE_LIBPQ=ON -DENABLE_KRB=OFF -DENABLE_ALARM=ON]
    tmp_build_dir=[/root/CM/dist]
    pkg_name=[Package_ddes_cm_release.tar.gz]
    output to [/root/CM/output].
...


-- Installing: /root/CM/output/bin/cm_ctl
-- Installing: /root/CM/output/bin/om_monitor
-- Installing: /root/CM/output/bin/cm_server
-- Installing: /root/CM/output/share/config/cm_server.conf.sample
alarmConfig.conf is a config file, do not separate symbol
alarmItem.conf is a config file, do not separate symbol
Seperate debug symbol from cm_agent to /root/CM/output/symbols/bin/cm_agent.symbol ..... OK
Seperate debug symbol from cm_ctl to /root/CM/output/symbols/bin/cm_ctl00.symbol ..... OK
Seperate debug symbol from cm_server to /root/CM/output/symbols/bin/cm_server000.symbol ..... OK
Seperate debug symbol from om_monitor to /root/CM/output/symbols/bin/om_monitor00.symbol ..... OK
libcjson.so is a link, do not separate symbol!
libcjson.so.1 is a link, do not separate symbol!
Seperate debug symbol from libcjson.so.1.7.15 to /root/CM/output/symbols/lib/libcjson.so.1.7.1500.symbol ..... OK
libcrypto.so is a link, do not separate symbol!
Seperate debug symbol from libcrypto.so.1.1 to /root/CM/output/symbols/lib/libcrypto.so.1.1.symbol ..... OK
Seperate debug symbol from libdcc_driver.so to /root/CM/output/symbols/lib/libdcc_driver.so.symbol ..... OK
Seperate debug symbol from libdcc.so to /root/CM/output/symbols/lib/libdcc.so000.symbol ..... OK
Seperate debug symbol from libdcf.so to /root/CM/output/symbols/lib/libdcf.so000.symbol ..... OK
Seperate debug symbol from libgstor.so to /root/CM/output/symbols/lib/libgstor.so0.symbol ..... OK
Seperate debug symbol from liblz4.so to /root/CM/output/symbols/lib/liblz4.so000.symbol ..... OK
Seperate debug symbol from liblz4.so.1 to /root/CM/output/symbols/lib/liblz4.so.10.symbol ..... OK
Seperate debug symbol from liblz4.so.1.9.3 to /root/CM/output/symbols/lib/liblz4.so.1.9.30.symbol ..... OK
libssl.so is a link, do not separate symbol!
Seperate debug symbol from libssl.so.1.1 to /root/CM/output/symbols/lib/libssl.so.1.1000.symbol ..... OK
libz.so is a link, do not separate symbol!
libz.so.1 is a link, do not separate symbol!
Seperate debug symbol from libz.so.1.2.12 to /root/CM/output/symbols/lib/libz.so.1.2.1200.symbol ..... OK
libzstd.so is a link, do not separate symbol!
libzstd.so.1 is a link, do not separate symbol!
Seperate debug symbol from libzstd.so.1.5.2 to /root/CM/output/symbols/lib/libzstd.so.1.5.2.symbol ..... OK
pkg cm start
ALL SUCCESS!!!!

```

## 5. 查看文件

```
[root@node1 CM]# ls -lrt output/
total 26728
-rw-r--r--. 1 root root  6370191 Sep 25 20:03 Package_ddes_cm.tar.gz
-rw-r--r--. 1 root root 20993040 Sep 25 20:03 Symbols_ddes_cm.tar.gz
```

# 总结

---

文中所获得的安装包打包在一起即可获得最新版本的安装包
