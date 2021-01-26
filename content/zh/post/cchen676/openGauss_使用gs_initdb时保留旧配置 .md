+++
title = "openGauss中使用gs_initdb时保留旧配置" 
date = "2021-01-26" 
tags = ["openGauss使用增强"] 
archives = "2021-01" 
author = "cchen676" 
summary = "openGauss中使用gs_initdb时保留旧配置"
img = "/zh/post/cchen676/title/img26.png" 
times = "16:30"
+++
# openGauss中使用gs_initdb时保留旧配置
## 一、使用场景
该需求来源于社区issue: [重建库脚本](https://gitee.com/opengauss/openGauss-server/issues/I26TPF?from=project-issue)。
> 在开发过程中，可能会修改系统表，或者各种debug情况下导致的库坏掉的情况，建议增加一种重建数据库的脚本。

当前可以通过重新安装或gs_initdb建一个新库解决该问题，但用户觉得重装比较麻烦，而使用gs_initdb的话因为需要指定一个全新的空目录作为新的数据目录，如果原始是用OM安装的数据库，默认启用了SSL，这时用gs_initdb新建的库目录下没有SSL相关配置，启动就会失败，需要手动把原来的SSL相关证书文件再拷贝过来。

为方便有该需求的用户使用，写了一个脚本，可以指定旧的数据目录，调用gs_initdb后，自动把旧数据目录下的配置文件拷贝到新目录下面

## 二、脚本说明

使用说明如下：
1. 上传到数据库用户的目录下，比如/home/omm
2. 添加执行权限 chmod +x gs_initdb_withconf.sh
3. 执行前导一下环境变量，确保gs_initdb可以正常执行，如果是环境变量分离安装的方式，也需要source一下，比如source ~/.bashrc或自定义的环境变量
4. 执行方式为 ***./gs_initdb_withconf.sh -o old_data_dir new_data_dir --nodename=example_node***
5. 其实在-o old_data_dir之后的参数即gs_initdb的参数，会直接传给gs_initdb

[脚本链接](./gs_initdb_withconf.sh)

