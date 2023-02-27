---
title: 'VMware下CentOS7.6安装openGauss'

date: '2021-10-26'

category: 'blog'
tags: ['VMware下CentOS7.6安装openGauss']

archives: '2021-10'

author: '这白开水咋没味啊'

summary: 'VMware下CentOS7.6安装openGauss'

img: '/zh/blogs/July/title/img5.png'

times: '12:30'
---

# VMware 下 CentOS7.6（7.9）安装 openGauss<a name="ZH-CN_TOPIC_0000001219190147"></a>

## 1. centos 安装<a name="zh-cn_topic_0000001219239773_section12385132019222"></a>

这里我使用的是 vmware workstation Pro 15 虽然官网了解了一下 openGauss 最适合的 centos 版本为 centos7.6
<img src='./figures/zh-cn_image_0000001174518146.png'>

但是因为 centos7.6 版本已经停更，所以我这里下载的是 7.9 版本的镜像文件

<img src='./figures/zh-cn_image_0000001219597955.png'>

下载完成后打开 vmware，创建新的虚拟机

<img src='./figures/zh-cn_image_0000001219439443.png'>

自定义配置，选择下一步。

<img src='./figures/zh-cn_image_0000001174039688.png'>

直接下一步

<img src='./figures/zh-cn_image_0000001174199664.png'>

选择稍后安装操作系统，下一步

<img src='./figures/zh-cn_image_0000001219518015.png'>

客户机操作系统选 Linux，版本选 CentOS7 64 位

<img src='./figures/zh-cn_image_0000001219319491.png'>

命名随意

<img src='./figures/zh-cn_image_0000001174358206.png'>

处理器配置默认全 1（这里可以根据自己电脑配置自行选择）

<img src='./figures/zh-cn_image_0000001174518148.png'>

虚拟机内存我选的是 2GB（这里也是根据自己电脑内存选择的）PS：据同学说这里虚拟机内存选 8GB 可以直接使用 openGauss 的简易安装模式，但我的电脑只有 8GB 所以没有尝试。

<img src='./figures/zh-cn_image_0000001219597957.png'>

网络连接选 NAT

<img src='./figures/zh-cn_image_0000001219439445.png'>

后面两项默认推荐

<img src='./figures/zh-cn_image_0000001174039690.png'>

<img src='./figures/zh-cn_image_0000001174199666.png'>

创建新虚拟磁盘

<img src='./figures/zh-cn_image_0000001219518017.png'>

最大磁盘大小选 20GB，选将虚拟磁盘拆分成多个文件

<img src='./figures/zh-cn_image_0000001219319493.png'>

默认下一步

<img src='./figures/zh-cn_image_0000001174358208.png'>

<img src='./figures/zh-cn_image_0000001174518150.png'>

右键 CentOS 点设置，点 CD/DVD，使用 ISO 映像文件，选之前下载的镜像

<img src='./figures/zh-cn_image_0000001219597959.png'>

然后开启虚拟机，这里我遇到了第一个问题，一开启虚拟机，宿主机就蓝屏死机。一开始我以为我后台开了什么东西内存占用太大，但关闭后台进程后依旧存在这个问题，查了一下，大多解释是说 VMware 的鲁棒性很差，在 win10 某次更新后 VMware 就存在这个蓝屏的问题。解决方法是更新至最新的 VMware16 Pro 版本。我试了一下，确实可行，而且覆盖更新不用重新配置虚拟机，上面的工作也没有白费。接下来继续安装。 打开虚拟机，选择 Install CentOS Linux7 ，enter。

<img src='./figures/zh-cn_image_0000001219439447.png'>

语言就看个人情况选择了，不过中文可能会有些乱码问题。

<img src='./figures/zh-cn_image_0000001174039692.png'>

这里配置一些基本信息 1、点击安装源，进入之后直接选择 done，警告符号随即消失。 2、软件选择：GNOME 桌面，一个友好的图形化界面 3、根据需要禁用 Kdump 4、自动分区，一般化为 4 个分区，如图所示

<img src='./figures/zh-cn_image_0000001174199668.png'>

<img src='./figures/zh-cn_image_0000001219518019.png'>

<img src='./figures/zh-cn_image_0000001219319495.png'>

<img src='./figures/zh-cn_image_0000001174358212.png'>

<img src='./figures/zh-cn_image_0000001174518152.png'>

<img src='./figures/zh-cn_image_0000001219597961.png'>

在安装过程中设置用户和密码

<img src='./figures/zh-cn_image_0000001219439453.png'>

<img src='./figures/zh-cn_image_0000001174039694.png'>

安装后点重启，看到如下界面

<img src='./figures/zh-cn_image_0000001174199670.png'>

接受许可并配置网络

<img src='./figures/zh-cn_image_0000001219518021.png'>

<img src='./figures/zh-cn_image_0000001219319497.png'>

登录后就可进入图形界面 右上角打开有线设置

<img src='./figures/zh-cn_image_0000001174358214.png'>

<img src='./figures/zh-cn_image_0000001174518154.png'>

<img src='./figures/zh-cn_image_0000001219597963.png'>

<img src='./figures/zh-cn_image_0000001219439455.png'>

到此，CentOS 的安装就完成了。

## 2.openGauss 安装<a name="zh-cn_topic_0000001219239773_section9941818192612"></a>

2.1 准备工作 查看 ip ifconfig

<img src='./figures/zh-cn_image_0000001174039696.png'>

vi /etc/profile 编辑/etc/profile 文件，在末尾加上 ulimit -c unlimited,然后重新加载该文件 source /etc/profile

<img src='./figures/zh-cn_image_0000001174199672.png'>

<img src='./figures/zh-cn_image_0000001219518023.png'>

关闭防火墙，禁用 SWAP，SELINUX（为了后面安装避免过多验证以及避免连接失败）

<img src='./figures/zh-cn_image_0000001219319499.png'>

继续执行 yum install python3.6\*命令（我这里由于之前已经安装过 python3.6 了，因此得到的结果如下图）

<img src='./figures/zh-cn_image_0000001174358216.png'>

没安装过的话效果是这样的

<img src='./figures/zh-cn_image_0000001174518156.png'>

然后进行其他软件包的安装

<img src='./figures/zh-cn_image_0000001219597965.png'>

linux 中权限最大的用户是 root，Gauss 数据库官方默认以 dbgrp 为用户组，omm 为用户，所以需要进行用户创建。

<img src='./figures/zh-cn_image_0000001219439457.png'>

然后我们为 openGauss 建一个目录，用来存放 openGauss 的压缩包以及该压缩包解压后的文件。这里我在/opt/software 下新建了一个 openGauss 的文件夹。执行 chmod -R 755 /opt/software/openGauss 命令给予 openGauss 文件夹读写权限。

<img src='./figures/zh-cn_image_0000001174039698.png'>

2.2 下载 openGauss 安装包

在官网下载 openGauss 的安装包，我这里选择的是 2.0.1 企业版。

<img src='./figures/zh-cn_image_0000001174199674.png'>

然后设置 VMware 的共享文件夹用于在宿主机和虚拟机之间传递文件。 设置共享文件夹一般有自动和手动两种方式 因为未知原因，我的安装 vmware tools 的按键灰色不可用

<img src='./figures/zh-cn_image_0000001219518025.png'>

尝试了很多解决办法也没有作用，只能选择手动设置共享文件夹。 右键 centos 选择设置，进入选项界面 .

<img src='./figures/zh-cn_image_0000001219319501.png'>

选择共享文件夹，总是启用，并在宿主机上设置共享文件夹。 设置完成后，使用 vmhgfs-fuse .host:/ /mnt/hgfs 指令完成共享文件夹的挂载 .

<img src='./figures/zh-cn_image_0000001174358218.png'>

cd 进根目录/mnt/hgfs，可以看到先前设置的主机共享文件夹 不过这种方法配置共享文件夹需要每次开机后重新进行挂载，比较麻烦。 然后将宿主机中的安装包放入共享文件夹中，再通过 mv 指令将安装包放入 openGauss 文件夹下.

<img src='./figures/zh-cn_image_0000001174518158.png'>

然后进入 openGauss 文件夹解压安装包

<img src='./figures/zh-cn_image_0000001219597967.png'>

然后执行命令 ls -l，显示类似如下信息即可

<img src='./figures/zh-cn_image_0000001219439459.png'>

## 3. 配置 XML 文件<a name="zh-cn_topic_0000001219239773_section1730910183116"></a>

进入刚刚解压产生的 script 文件夹，查看是否有预安装脚本：

<img src='./figures/zh-cn_image_0000001174039700.png'>

在 openGauss 目录下执行 vim clusterconfig.xml 命令。然后将下面内容右键粘贴到新建的 xml 文件中，然后按 esc 退出插入模式，输入:wq！保存并退出。

```
<?xml version="1.0" encoding="UTF-8"?>
<ROOT>
<!-- 整体信息 -->
<CLUSTER>
<!-- 数据库名称 -->
<PARAM name="clusterName" value="opengauss" />
<!-- 数据库节点名称(hostname) -->
<PARAM name="nodeNames" value="localhost.localdomain" />
<!-- 节点IP，与nodeNames一一对应 -->
<PARAM name="backIp1s" value="192.168.100.129"/>
<!-- 数据库安装目录-->
<PARAM name="gaussdbAppPath" value="/opt/huawei/install/app" />
<!-- 日志目录-->
<PARAM name="gaussdbLogPath" value="/var/log/omm" />
<!-- 临时文件目录-->
<PARAM name="tmpMppdbPath" value="/opt/huawei/tmp" />
<!--数据库工具目录-->
<PARAM name="gaussdbToolPath" value="/opt/huawei/install/om" />
<!--数据库core文件目录-->
<PARAM name="corePath" value="/opt/huawei/corefile"/>
<!-- openGauss类型，此处示例为单机类型，“single-inst”表示单机一主多备部署形态-->
<PARAM name="clusterType" value="single-inst"/>
</CLUSTER>
<!-- 每台服务器上的节点部署信息 -->
<DEVICELIST>
<!-- node1上的节点部署信息 -->
<DEVICE sn="1000001">
<!-- node1的hostname -->
<PARAM name="name" value="localhost.localdomain"/>
<!-- node1所在的AZ及AZ优先级 -->
<PARAM name="azName" value="AZ1"/>
<PARAM name="azPriority" value="1"/>
<!-- node1的IP，如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
<PARAM name="backIp1" value="192.168.100.129"/>
<PARAM name="sshIp1" value="192.168.100.129"/>
<!--DBnode-->
<PARAM name="dataNum" value="1"/>
<!--DBnode端口号-->
<PARAM name="dataPortBase" value="26000"/>
<!--DBnode主节点上数据目录，及备机数据目录-->
<PARAM name="dataNode1" value="/opt/huawei/install/data/db1"/>
<!--DBnode节点上设定同步模式的节点数-->
<!--><PARAM name="dataNode1_syncNum" value="0"/><-->
</DEVICE>
</DEVICELIST>
</ROOT>
```

<img src='./figures/zh-cn_image_0000001174199676.png'>

<img src='./figures/zh-cn_image_0000001219518027.png'>

这里的节点名称和 IP 要改成自己的，这些在准备工作中已经查看了。 执行 vi /etc/profile 命令打开 profile 文件，添加如下命令：

<img src='./figures/zh-cn_image_0000001219319503.png'> <img src='./figures/zh-cn_image_0000001174358220.png'>

退出插入模式，输入:wq!保存并退出。然后需要 source 一下

<img src='./figures/zh-cn_image_0000001174518160.png'>

## 4. 预安装<a name="zh-cn_topic_0000001219239773_section54920442414"></a>

在/opt/software/openGauss/script 文件夹下，执行命令 ./gs_preinstall -U omm -G dbgrp -X /opt/software/openGauss/clusterconfig.xml 正常情况下会出现以下反馈

<img src='./figures/zh-cn_image_0000001219597969.png'>

<img src='./figures/zh-cn_image_0000001219439461.png'>

但是可能是因为我的 xml 文件配置错误，又或者是其他原因，导致我的预安装指令没有反馈，不论成功还是报错都没有。这里我就犯了个错误，在没有反馈的情况下反复执行预安装指令，没有反馈重启终端再执行；还没有反馈重启虚拟机再执行。反复操作下我的 centos 开启过程开始报错 piix4_smbus: Host SMBus controller not enabled!；输入密码后从登录界面又跳回登录界面没法进入系统。 在尝试了诸多解决方法之后，我发现这时我的 centos 重启后会丢失数据，按照网上的解决方法更改的文件无法保存，所以都没有发挥作用。在进行了一个下午的尝试后我放弃了，我选择重新配置一个新的虚拟机，按照上述步骤重来一次。现在想来可能是反复执行预安装命令产生大量重复的 root 用户和 openGauss 用户的互信信息导致磁盘占用率接近满值导致出现该问题。在重新配置虚拟机后我再次开始预安装，这次出现了报错反馈 Exception: \[GAUSS-51900\] The current OS is not supported. The current system is: centos7.9 这里提示我们 CentOS7.9 不支持 openGauss，所以我们需要降级到 7.6 版本，但 7.6 版本的镜像我在网上没能找到，据说 openGauss 相关书籍里会提供 7.6 版本镜像。但我这里使用的是 wget http://vault.centos.org/7.6.1810/os/x86\_64/Packages/centos-release-7-6.1810.2.el7.centos.x86\_64.rpm 指令来下载 centos7.6 版本 rpm 包

安装下载的 7.6 rpm 包

```
rpm -ivh centos-release-7-6.1810.2.el7.centos.x86_64.rpm –force
```

这时重新运行 rpm -qa | grep -i centos-release 就可以看到两个发行版本

<img src='./figures/zh-cn_image_0000001174039702.png'>

卸载掉 7.7 版本

```
 rpm -ev centos-release-7-7.1908.0.el7.centos.x86_64
```

之后再次进行预安装，这次成功进行了预安装。 通过 openGauss 提供的 gs_checkos 工具来检查系统状态。注意需要切换到/opt 目录下执行命令。

<img src='./figures/zh-cn_image_0000001174199678.png'>

## 5. 正式安装<a name="zh-cn_topic_0000001219239773_section159665435439"></a>

切换到 omm 用户,进行安装。

<img src='./figures/zh-cn_image_0000001219518029.png'>

执行过程中需要用户设定密码，最后出现 completed 就完成了。

在 omm 用户下，执行 gs_om -t start 命令和 gs_om -t stop 命令启动或关闭数据库 <img src='./figures/zh-cn_image_0000001219319505.png'>

<img src='./figures/zh-cn_image_0000001174358222.png'>
