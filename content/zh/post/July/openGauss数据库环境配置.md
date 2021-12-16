+++

title =  "openGauss数据库环境配置" 

date = "2021-12-09" 

tags = [ "openGauss数据库环境配置"] 

archives = "2021-12" 

author = "…" 

summary = "openGauss数据库环境配置"

img = "/zh/post/July/title/img11.png" 

times = "12:30"

+++

# openGauss数据库环境配置<a name="ZH-CN_TOPIC_0000001187247432"></a>

## 一、首先在虚拟机装入centos系统<a name="section164181721104316"></a>

参考链接

[openGauss——VMware安装 | C1everF0x's Blog](https://c1everf0x.github.io/2021/04/10/openGauss%25E2%2580%2594%25E2%2580%2594VMware%25E5%25AE%2589%25E8%25A3%2585/)

创建用户

![](figures/zh-cn_image_0000001187252632.png)

安装好后查看系统的版本

![](figures/zh-cn_image_0000001232813719.png)

## 二、网络配置<a name="section155869320439"></a>

点一下安装位置然后点完成退出来，默认设置就行，再点 “网络和主机名”，打开以太网的开关

主机名字自己定一个，ip地址也要记住，两个信息都要记住。

![](figures/zh-cn_image_0000001187412548.png)

![](figures/zh-cn_image_0000001187094074.png)

![](figures/zh-cn_image_0000001186934098.png)

问题一：虚拟机能够ping通过主机、主机ping不通虚拟机。

参考链接：

https://blog.csdn.net/weixin\_43837229/article/details/94733475?utm\_medium=distribute.pc\_relevant.none-task-blog-2\~default\~baidujs\_title\~default-1.control&spm=1001.2101.3001.4242

虚拟机能够ping通过主机

![](figures/zh-cn_image_0000001232732233.png)

本机ping虚拟机ip，无法通信

![](figures/zh-cn_image_0000001232613679.png)

解决方式：

在本机查看虚拟机ip，和虚拟机本身的ip不符合

![](figures/zh-cn_image_0000001232492169.png)

以win10为例，打开电脑设置=》网络和lnelnternet=》网络和共享中心=》更高适配器设置，找到如下虚拟机

![](figures/zh-cn_image_0000001187252634.png)

右键点击属性，找到

![](figures/zh-cn_image_0000001232813721.png)

右键点击属性，找到

![](figures/zh-cn_image_0000001187412550.png)

这时不管是主机ping虚拟机还是虚拟机ping主机都通了

实验结果：

![](figures/zh-cn_image_0000001187094076.png)

问题二 ：ssh连接不了

失败：

![](figures/zh-cn_image_0000001186934100.png)

经过查询资料问题解决，主要是使用ssh命令并不代表开启了ssh服务器，我们通常在powershell中直接使用的ssh命令其实是win10专业版默认开启了OpenSSH客户端（OpenSSH Client），而现在想要远程ssh登录到win10，则需要开启ssh服务端。

解决步骤：

1、打开设置——应用，找到可选功能，点击进入

![](figures/zh-cn_image_0000001232732235.png)

2、在可选功能页面，点击添加功能，找到OpenSSH 服务器并安装

![](figures/zh-cn_image_0000001232613681.png)

3、接下来启动sshserver服务，按win+r打开运行，输入services.msc，并回车键打开

![](figures/zh-cn_image_0000001232492171.png)

4、在服务中找到OpenSSH SSH Server 和 OpenSSH Authentication Agent 两个服务，启动它们并右键——属性，设置为自动启动

![](figures/zh-cn_image_0000001187252636.png)

成功

![](figures/zh-cn_image_0000001232813723.png)

问题三：ssh服务器拒绝了密码，请再试一次

![](figures/zh-cn_image_0000001187412552.jpg)

虚拟机用ssh连接自己可以连接上，但是主机的ssh连接不上虚拟机。并且密码正确。

在查找多种解决办法，经过多次尝试都没有用处的情况下，我准备换一种方式。

最终解决办法：

利用容器安装OpenGauss数据库：

1、安装curl

sudo apt install curl

2、安装docker

curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun

3、运行 opengauss 镜像

sudo docker run --name opengauss --privileged=true -d -p 5432:5432 -e GS\_PASSWORD=Enmo@123 enmotech/opengauss:latest

4、进入容器

sudo docker exec -it opengauss bash

5、连接数据库 ,切换到omm用户 ，用gsql连接到数据库

![](figures/zh-cn_image_0000001187094078.png)

第二次启动镜像.

先启动容器，然后进入shell

1、必须先启动容器

sudo docker start “容器ID”

2、然后使用下边的命令进入shell

sudo docker exec -it “容器ID” bash

3、将主机的文件复制到容器里

sudo docker cp 主机目录 容器ID:容器目录

如果要编辑里边的配置文件，例如编辑nginx的配置文件，docker容器里没有默认的编辑工具，需要安装

sudo apt-get update

sudo apt-get install vim

也可以通过替换的方式，编辑文件

sudo docker cp :/path/to/file.ext . // 复制出来修改

sudo docker cp file.ext :/path/to/file.ext //修改完复制回去

4、编辑完容器之后，将改动嵌入到镜像里，因为下次更新站点的话，是首先更新镜像，然后创建新容器的

sudo docker commit 容器ID 镜像名称

![](figures/zh-cn_image_0000001186934102.png)

使用：

连接成功

![](figures/zh-cn_image_0000001232732237.png)

创建用户

![](figures/zh-cn_image_0000001232613683.png)

创建数据库

![](figures/zh-cn_image_0000001232492173.png)

![](figures/zh-cn_image_0000001187252638.png)

效果：

![](figures/zh-cn_image_0000001232813725.png)

还能够容器外部连接。

创建SCHEMA

![](figures/zh-cn_image_0000001187412554.jpg)

创建表

![](figures/zh-cn_image_0000001187094080.jpg)

插入数据

![](figures/zh-cn_image_0000001186934104.png)

结果

![](figures/zh-cn_image_0000001232732239.png)

