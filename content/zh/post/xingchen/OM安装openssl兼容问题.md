+++
title = "OM安装后，linux命令报错openssl不兼容"
date = "2023-06-17"
tags = ["OM安装后，linux命令报错openssl不兼容"]
archives = "2023-06-17"
author = "zhang_xubo"
summary = "OM安装后，linux命令报错openssl不兼容"
img = "/zh/post/xingchen/title/img1.png"
times = "10:30"
+++

### 概述

在部分系统中，使用OM安装完成openGauss数据库后，会出现例如 **yum install** 不可用， 或者 **ssh** 不可用的问题。

**问题现象**

1. 在openeuler20.03系统上，使用openGauss 3.0.3之前的版本，OM安装完成后，切换到root下使用yum安装组件，会出现如下错误：
   ```
   symbol SSLv3_method version OPENSSL_1_1_0 not defined in file libssl.so.1.1 with link time reference
   ```

2. 在一些高版本系统中，如centos8以上。安装完成数据库后，使用ssh报错：
   ![](../images/opensslerror/ssherror.png) 


**问题原因**

为了保证兼容和稳定，openGauss在开源三方库里面引入了openssl组件进行管理和维护，这样依赖会导致openGauss使用的openssl版本和操作系统上自带openssl版本的可能存在不兼容的问题。

OM安装完成后，会再 `/etc/profile` 里面写入自身的环境变量，如下:
```
export GPHOME=/opt/huawei/install/om
export UNPACKPATH=/opt/software/openGauss
export PATH=$PATH:$GPHOME/script/gspylib/pssh/bin:$GPHOME/script
export LD_LIBRARY_PATH=$GPHOME/script/gspylib/clib:$LD_LIBRARY_PATH
export LD_LIBRARY_PATH=$GPHOME/lib:$LD_LIBRARY_PATH
export PYTHONPATH=$GPHOME/lib
export PATH=$PATH:/root/gauss_om/omm/script
```
其中的**LD_LIBRARY_PATH**会将openGauss包中lib目录下的so库文件优先级提前，在使用如yum命令时候，就会优先去加载openGauss lib目录下的二级制。  

而openGauss lib下放着 libssl.so 和 libcrypto.so ，这两个输入openssl的库文件。如果此时存在不兼容，那么在使用操作系统工具时候，如果工具依赖了openssl的相关不兼容函数，就会报错。

1. 编译选项不同导致不兼容

`symbol SSLv3_method` 就是由于编译选项引起的不兼容现象。早起openGauss-third-party中的openssl在编译时候并未开启sslv3-method，但是操作系统yum所依赖的二进制需要用到sslv3相关的函数，就导致报错sslv3-method symbol not found。


2. 系统上对openssl做修改导致接口不兼容

在 Centos 8 以及相关的发行版中，操作系统自身对openssl做了很大的patch改动，其中存在对接口函数的增加和删除。
`undefined symbol EVP_KDF_ctrl`报错就是场景之一。 在原始的openssl中具有该函数，但是在 Centos8 系统上却对该函数做了删除。 此时安装了openGauss后，在openGauss的环境变量下，部分工具必然会出现问题。


**处理方式**

1. 对于 `symbol SSLv3_method not found`， 可以更新下三方库，在构建openssl的时候开启编译选项 `enable-ssl3-method`。
   
   ![](../images/opensslerror/enable_sslv3.png)

2. 对于OM安装过程中出现 `undefined symbol EVP_KDF_ctrl` 问题，可以把系统上的 `libcrypto.so` 放到 `$TOOL/script/gspylib/clib `替换掉om包里面的lib文件

3. 同意对于OM安装过程中出现问题的场景，由于OM需要依赖一些开源组件如 psutil,paramiko等，这些组件编译的二进制文件依赖openssl进而产生了不兼容问题，可以在操作系统上手动安装如下四个组件:
    ```
    psutil
    netifaces
    cryptography
    paramiko
    ```
    然后OM安装时候， preinstall加上 --unused-third-party 即可使用系统的组件替代OM包中的组件，进而规避该问题。
    ```
    ./gs_preinstall -U xx -G xx -X /xx/single.xml --unused-third-party
    ```

4. 对于在安装后，使用 ssh 工具出现 `undefined symbol EVP_KDF_ctrl` 问题的场景； 可以再在使用ssh之前， 把系统的lib库库优先级放到前面，就不会影响ssh。
    ```
    export LD_LABRRRY_PATH=/usr/lib64:$LD_LABRRRY_PATH；ssh 192.168.0.100 command;
    ```
    这个问题由于系统自身对openssl做了修改，尤其在 Centos8 上， 删除openssl中的函数在openGauss中还继续使用，该兼容问题无法解决，只能通过加载环境变量的优先级方式来规避。