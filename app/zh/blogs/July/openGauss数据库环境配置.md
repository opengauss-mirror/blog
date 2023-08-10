---
title: 'openGauss数据库环境配置'

date: '2021-12-09'

category: 'blog'
tags: ['openGauss数据库环境配置']

archives: '2021-12'

author: '…'

summary: 'openGauss数据库环境配置'

img: '/zh/blogs/July/title/img11.png'

times: '12:30'
---

# openGauss 数据库环境配置<a name="ZH-CN_TOPIC_0000001187247432"></a>

## 一、首先在虚拟机装入 centos 系统<a name="section164181721104316"></a>

创建用户

<img src='./figures/zh-cn_image_0000001187252632.png'>

安装好后查看系统的版本

<img src='./figures/zh-cn_image_0000001232813719.png'>

## 二、网络配置<a name="section155869320439"></a>

点一下安装位置然后点完成退出来，默认设置就行，再点 “网络和主机名”，打开以太网的开关

主机名字自己定一个，ip 地址也要记住，两个信息都要记住。

<img src='./figures/zh-cn_image_0000001187412548.png'>

<img src='./figures/zh-cn_image_0000001187094074.png'>

<img src='./figures/zh-cn_image_0000001186934098.png'>

问题一：虚拟机能够 ping 通过主机、主机 ping 不通虚拟机。

参考链接：

https://blog.csdn.net/weixin\_43837229/article/details/94733475?utm\_medium=distribute.pc\_relevant.none-task-blog-2\~default\~baidujs\_title\~default-1.control&spm=1001.2101.3001.4242

虚拟机能够 ping 通过主机

<img src='./figures/zh-cn_image_0000001232732233.png'>

本机 ping 虚拟机 ip，无法通信

<img src='./figures/zh-cn_image_0000001232613679.png'>

解决方式：

在本机查看虚拟机 ip，和虚拟机本身的 ip 不符合

<img src='./figures/zh-cn_image_0000001232492169.png'>

以 win10 为例，打开电脑设置=》网络和 lnelnternet=》网络和共享中心=》更高适配器设置，找到如下虚拟机

<img src='./figures/zh-cn_image_0000001187252634.png'>

右键点击属性，找到

<img src='./figures/zh-cn_image_0000001232813721.png'>

右键点击属性，找到

<img src='./figures/zh-cn_image_0000001187412550.png'>

这时不管是主机 ping 虚拟机还是虚拟机 ping 主机都通了

实验结果：

<img src='./figures/zh-cn_image_0000001187094076.png'>

问题二 ：ssh 连接不了

失败：

<img src='./figures/zh-cn_image_0000001186934100.png'>

经过查询资料问题解决，主要是使用 ssh 命令并不代表开启了 ssh 服务器，我们通常在 powershell 中直接使用的 ssh 命令其实是 win10 专业版默认开启了 OpenSSH 客户端（OpenSSH Client），而现在想要远程 ssh 登录到 win10，则需要开启 ssh 服务端。

解决步骤：

1、打开设置——应用，找到可选功能，点击进入

<img src='./figures/zh-cn_image_0000001232732235.png'>

2、在可选功能页面，点击添加功能，找到 OpenSSH 服务器并安装

<img src='./figures/zh-cn_image_0000001232613681.png'>

3、接下来启动 sshserver 服务，按 win+r 打开运行，输入 services.msc，并回车键打开

<img src='./figures/zh-cn_image_0000001232492171.png'>

4、在服务中找到 OpenSSH SSH Server 和 OpenSSH Authentication Agent 两个服务，启动它们并右键——属性，设置为自动启动

<img src='./figures/zh-cn_image_0000001187252636.png'>

成功

<img src='./figures/zh-cn_image_0000001232813723.png'>

问题三：ssh 服务器拒绝了密码，请再试一次

<img src='./figures/zh-cn_image_0000001187412552.jpg'>

虚拟机用 ssh 连接自己可以连接上，但是主机的 ssh 连接不上虚拟机。并且密码正确。

在查找多种解决办法，经过多次尝试都没有用处的情况下，我准备换一种方式。

最终解决办法：

利用容器安装 OpenGauss 数据库：

1、安装 curl

sudo apt install curl

2、安装 docker

curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun

3、运行 opengauss 镜像

sudo docker run --name opengauss --privileged=true -d -p 5432:5432 -e GS_PASSWORD=Enmo@123 enmotech/opengauss:latest

4、进入容器

sudo docker exec -it opengauss bash

5、连接数据库 ,切换到 omm 用户 ，用 gsql 连接到数据库

<img src='./figures/zh-cn_image_0000001187094078.png'>

第二次启动镜像.

先启动容器，然后进入 shell

1、必须先启动容器

sudo docker start “容器 ID”

2、然后使用下边的命令进入 shell

sudo docker exec -it “容器 ID” bash

3、将主机的文件复制到容器里

sudo docker cp 主机目录 容器 ID:容器目录

如果要编辑里边的配置文件，例如编辑 nginx 的配置文件，docker 容器里没有默认的编辑工具，需要安装

sudo apt-get update

sudo apt-get install vim

也可以通过替换的方式，编辑文件

sudo docker cp :/path/to/file.ext . // 复制出来修改

sudo docker cp file.ext :/path/to/file.ext //修改完复制回去

4、编辑完容器之后，将改动嵌入到镜像里，因为下次更新站点的话，是首先更新镜像，然后创建新容器的

sudo docker commit 容器 ID 镜像名称

<img src='./figures/zh-cn_image_0000001186934102.png'>

使用：

连接成功

<img src='./figures/zh-cn_image_0000001232732237.png'>

创建用户

<img src='./figures/zh-cn_image_0000001232613683.png'>

创建数据库

<img src='./figures/zh-cn_image_0000001232492173.png'>

<img src='./figures/zh-cn_image_0000001187252638.png'>

效果：

<img src='./figures/zh-cn_image_0000001232813725.png'>

还能够容器外部连接。

创建 SCHEMA

<img src='./figures/zh-cn_image_0000001187412554.jpg'>

创建表

<img src='./figures/zh-cn_image_0000001187094080.jpg'>

插入数据

<img src='./figures/zh-cn_image_0000001186934104.png'>

结果

<img src='./figures/zh-cn_image_0000001232732239.png'>
