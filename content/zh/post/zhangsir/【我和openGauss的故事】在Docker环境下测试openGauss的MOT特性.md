+++
title = "【我和openGauss的故事】在Docker环境下测试openGauss的MOT特性"
date = "2022-10-18"
tags = ["openGauss技术文章征集"]
archives = "2022-10"
author = "zhangsir"
summary = "在Docker环境下测试openGauss的MOT特性"
times = "16:20"
+++
前言：
     随着pg在国内越来越热，我也想赶紧的学习学习，pg的挺多语法跟mysql和oracle不太一样，光看书还是不太行，还是得多动手。前面实践了下mogdb，这次借着机会学习学习openGauss。本次实践的是opengauss的MOT表，我们都知道现在数据库的瓶颈都在IO上，内存操作的速度是极快的，MOT特性就是建立在内存中的存储引擎。根据官档介绍MOT是openGauss数据库最先进的生产级特性，看起来好处多多啊，这次主要是尝尝鲜。这次实践是基于docker的，之前对docker不太感冒，每次做个实验都要弄一套不同版本的数据库环境，太费事了，自从用了docker以后，感觉不要太爽，不用再在自己电脑上弄一个个虚拟机了，直接装个docker环境，撸镜像得了。
一、利用docker拉起openGuass
1、配置好docker环境，这里就不再细讲了，网上都有保姆教程。
文本

../images/docker_info.jpg

2、恩墨制作了opengauss 3.0的镜像，直接从网上拉镜像就可以。

../images/docker_pull.jpg

3、确认镜像已经拉下来，总共480M，不大也不小。

../images/docker_iamge.jpg

4、启动镜像，指定下密码就行，如果密码太简单会报错。
docker run --name myopengauss --privileged=true -d -e GS_PASSWORD=Gauss@123 enmotech/opengauss:3.0.0

../images/docker_run.jpg

二、测试MOT表
1、新建一个普通用户test

../images/test_user.jpg

2、创建MOT，在创建表的时候加关键词foreign。

../images/mot_create.jpg

在创建的时候可能会报，无法创建，这是因为如果postgresql.conf中开启了增量检查点，则无法创建MOT。因此请在创建MOT前将enable_incremental_checkpoint设置为off。

../images/mot_create_error.jpg

解决方案如下：  

a.找到镜像的postgresql.conf配置文件

../images/find.jpg

 b.修改enable_incremental_checkpoint=off

 c.基于现有镜像生成新镜像

../images/commit_image.jpg

 d.启动新镜像

../images/docker_start.jpg

三、测试将磁盘表转换成MOT表
根据官方手册的说法，目前还不能一键实现磁盘表到MOT表的转换，需要利用导入导出的方法。转换步骤如下：

            a、停应用，做的时候不能有写入。

            b、利用gs_dump导出数据，必须使用data only

            c、重命名原表

            d、新建mot表，与原表同名。

            e、使用gs_restore导入数据

            f、恢复应用。

1、新建普通测试表，确认相关字段MOT都能支持。

../images/mot_test.jpg

2、导出表数据

../images/gs_dump.jpg

3、重命名原表

../images/rename.jpg

4、新建同名MOT表

../images/mot_new.jpg

5、导入数据

../images/gs_restore.jpg

6、确认数据

../images/confirm.jpg
