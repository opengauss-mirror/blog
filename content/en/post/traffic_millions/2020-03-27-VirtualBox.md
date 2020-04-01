+++
title = "初试openGauss（二）：windows下使用VirtualBox安装openGauss(这是英文)"
date = "2020-03-27"
tags = ["安装openGauss"]
archives = "2020-03"
author = "traffic_millions"
summary = "windows下使用VirtualBox安装openGauss虚拟机."

+++

### 【背景】
今天华为开发者大会上，openGauss开源社区发布了最新的LTS版本，手上只有一台windows机器，考虑使用VirtualBox安装openGauss虚拟机.

### 【环境准备】

- Windows10 64位
- Oracle VM VirtualBox 6.1.4
- openGauss开源社区下载：[openGauss-20.03-LTS-x86_64-dvd.iso](https://repo.openGauss.org/openGauss-20.03-LTS/ISO/x86_64/openGauss-20.03-LTS-x86_64-dvd.iso)  （X86）

![index-x86](../2020-03-27-VirtualBox-media/index-x86.png "index-x86.png")

### 【安装步骤】

##### 一、下载安装Virtual Box

在[VirtualBox官网](https://www.virtualbox.org/wiki/Downloads)下载安装程序

![VirtualBox-main](../2020-03-27-VirtualBox-media/VirtualBox-main.png "VirtualBox-main.png")

安装的时候可以自定义安装路径如（D:\software\Oracle\VirtualBox），然后一路next即可;

![route](../2020-03-27-VirtualBox-media/route.png "route.png")

安装结束之后，使用Ctrl+G打开全局设置，修改默认虚拟电脑位置如（D:\myVM），方便之后查找;

![global](../2020-03-27-VirtualBox-media/global.png "global.png")

##### 二、创建虚拟机

选择 【控制】-->【新建】，填写虚拟机的配置信息，示例如下

名称：openGauss，类型：Linux，由于没有openGauss，所以版本选择Other Linux(64-bit)，下一步

![config-virtual-machine](../2020-03-27-VirtualBox-media/config-virtual-machine.png "config-virtual-machine.png")

设置虚拟机的内存，此内存即为虚拟机所占用的系统内存，这里将虚拟内存设置为4G

![4G](../2020-03-27-VirtualBox-media/4G.png "4G.png")

选择【现在创建虚拟硬盘(c)】

![hard](../2020-03-27-VirtualBox-media/hard.png "hard.png")

虚拟硬盘文件类型，选择默认的【VDI（VirtualBox磁盘映像）】，下一步

![virtual_file](../2020-03-27-VirtualBox-media/virtual_file.png "virtual_file.png")

选择【动态分配】，下一步

分配给虚拟机的内存空间较大，使用时逐渐占用磁盘空间，闲置时自动缩减比较合理

![dynamic](../2020-03-27-VirtualBox-media/dynamic.png "dynamic.png")

这里选择设置虚拟机硬盘大小为64G 

![64G](../2020-03-27-VirtualBox-media/64G.png "64G.png")

虚拟机创建完成，openGauss所需的硬件资源准备完毕 

![virtual_done](../2020-03-27-VirtualBox-media/virtual_done.png "virtual_done.png")

##### 三、安装openGauss

启动上一步创建好的虚拟机 

![start](../2020-03-27-VirtualBox-media/start.png "start.png")

点击右侧“文件夹图标”

![file_icon](../2020-03-27-VirtualBox-media/file_icon.png "file_icon.png")

点击注册，选择准备阶段下载好的**openGauss-20.03-LTS-x86_64-dvd.iso**

![select_iso](../2020-03-27-VirtualBox-media/select_iso.png "select_iso.png")

选择【启动】，进入到安装界面

![select_start](../2020-03-27-VirtualBox-media/select_start.png "select_start")

选择 【Install openGauss 20.03-LTS】回车，进行安装  

![install_lts](../2020-03-27-VirtualBox-media/install_lts.png "install_lts.png")

选择Continue

![continue](../2020-03-27-VirtualBox-media/continue.png "continue.png")

选择Installation Destination

![install_destination](../2020-03-27-VirtualBox-media/install_destination.png "install_destination.png")

选择要安装的磁盘，Done

![select_disk](../2020-03-27-VirtualBox-media/select_disk.png "select_disk.png")

选择Begin Installation

![begin_install](../2020-03-27-VirtualBox-media/begin_install.png "begin_install.png")

安装状态如下

![install_status](../2020-03-27-VirtualBox-media/install_status.png "install_status.png")

选择Root Password 设置root用户的密码（后面登录要用到！~）

![set_pass](../2020-03-27-VirtualBox-media/set_pass.png "set_pass.png")

安装完成后，选择Reboot重启虚拟机

![reboot](../2020-03-27-VirtualBox-media/reboot.png "reboot.png")

显示重新回到了安装界面

![return](../2020-03-27-VirtualBox-media/return.png "return.png")

关闭虚拟机，选择【设置】选中openGauss-20.03-LTS-x86_64-dvd.iso，鼠标右键，删除盘片，保存退出

![save](../2020-03-27-VirtualBox-media/save.png "save.png")

重新启动虚拟机，显示如下界面，直接回车

![reboot_start](../2020-03-27-VirtualBox-media/reboot_start.png "reboot_start.png")

输入用户（root）密码（安装阶段设置的密码），进入openGauss虚拟机

![install_over](../2020-03-27-VirtualBox-media/install_over.png "install_over.png")

到这里openGauss虚拟机已经安装完成了~