+++
title = "通过Docker安装openGauss"
date = "2022-02-19"
tags = ["通过Docker安装openGauss"]
archives = "2022-02-19"
author = "xiteming"
summary = "通过Docker安装openGauss"
img = "/zh/post/xiteming/title/img1.png"
times = "19:30"
+++

###通过Docker安装openGauss

#### Docker概述

Docker 是一个开源的应用容器引擎，让开发者可以打包他们的应用以及依赖包到一个可移植的容器中,然后发布到任何流行的Linux或Windows操作系统的机器上,也可以实现虚拟化,容器是完全使用沙箱机制,相互之间不会有任何接口。

#### 概述

本章节介绍通过Docker安装单机版openGauss。

以openGauss-server 2.1.0版本、openeuler-20.03版本和openGauss-server 2.1.0 版本openEuler系统安装包为例。

#### 前提准备

1. openGauss-server代码库。（下载地址：https://opengauss.obs.cn-south-1.myhuaweicloud.com/2.1.0/arm/openGauss-2.1.0-openEuler-64bit-all.tar.gz）

2. openeuler操作系统在docker环境下的镜像文件。（下载地址：https://repo.openeuler.org/openEuler-20.03-LTS/docker_img/aarch64/）

3. openGauss在openEuler平台的的软件安装包。（下载地址：https://opengauss.obs.cn-south-1.myhuaweicloud.com/2.1.0/arm/openGauss-2.1.0-openEuler-64bit-all.tar.gz）

4. openEuler_aarch64.repo文件。（下载地址：https://mirrors.huaweicloud.com/repository/conf/openeuler_aarch64.repo）

#### 上传软件包

1. 在Linux系统下，创建目录来放软件包
```
mkdir -p /opt/xxx
```
2. 通过ftp等工具，将openGauss-2.1.0-CentOS-64bit-all.tar.gz包放到/opt/xxx目录下

#### 安装docker
```
yum list |grep docker-engine.aarch64                        //查看版本信息
yum install -y docker
```

#### 验证docker安装是否成功
```
docker version
```

#### 加载openeuler docker镜像文件
```
docker load -i openEuler-docker.aarch64.tar.xz
```

#### 查看openeuler docker镜像是否加载成功
```
docker images
```
![](../image/docker_images.png)

#### 修改dockerfile_arm文件

进入到/opt/xxx/openGauss-server/docker/dockerfiles路径下，`cd /opt/xxx/openGauss-server/docker/dockerfiles`

将1.1.0文件夹名称修改为2.1.0，`mv 1.1.0 2.1.0`

进入该文件夹，`cd 2.1.0`

打开dockerfile_arm文件，`vim dockerfile_arm`

将openGauss版本名统一修改成2.1.0，如下图所示：

![](../image/name_fix.png)

#### 创建openGauss docker镜像

1. 进入存放软件安装包的路径下，将下载好的openGauss-2.1.0-openEuler-64bit-all.tar.gz安装包解压
```
tar –zxvf openGauss-2.1.0-openEuler-64bit-all.tar.gz
```

2. 将解压出来的openGauss-2.1.0-openEuler-64bit.tar.bz2移至/opt/xxx/openGauss-server/docker/dockerfiles/2.1.0
```
cp openGauss-2.1.0-openEuler-64bit.tar.bz2 /opt/xxx/openGauss-server/docker/dockerfiles/2.1.0
```

3.将openEuler_aarch64.repo文件并放到/opt/xxx/openGauss-server/docker/dockerfiles/2.1.0
```
mv openEuler_aarch64.repo /opt/xxx/openGauss-server/docker/dockerfiles/2.1.0
```

4.创建openGauss docker镜像，-v 后面的值为版本号，-i意为跳过MD5检查
```
sh buildDockerImage.sh –v 2.1.0 –i
```
#### 查看openGauss docker镜像是否创建成功，成功后如下图所示

```
docker images
```

![](../image/openGauss_iamges.png)

#### 开启openGauss实例

```
docker run --name OG1 --privileged=true -d -e GS_PASSWORD=huawei@123 –e GS_NODENAME= test –e GS_USERNAME=test –p 8888:5432 opengauss:2.1.0
```

#### 进入docker

```
docker exec-ti OG1 /bin/bash
```

#### 登录子用户并连接数据库，成功后如下图所示

```
su – omm
gsql –d postgres –p 5432 –r
```

![](../image/run.png)
