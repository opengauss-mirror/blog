---
title: 'openGauss数据库的安装运行'

date: '2021-12-09'

category: 'blog'
tags: ['openGauss数据库的安装运行']

archives: '2021-12'

author: '匿名'

summary: 'openGauss数据库的安装运行'

img: '/zh/blogs/July/title/img10.png'

times: '12:30'
---

# openGauss 数据库的安装运行<a name="ZH-CN_TOPIC_0000001219574667"></a>

## 安装 CentOS 7.6 操作系统（可用虚拟机）<a name="section338153705714"></a>

- 下载安装 openGauss 之前，需要先在虚拟机上安装 centOS 系统，注意版本要限制为 7.6。可以选择在主机上安装软件 MobaXterm，该软件适用于在主机和虚拟机之间传输文件
- 安装 centOS:选择 VMware 作为虚拟机，需自行下载。启动 Vmware，进入其主页面。

  <img src='./figures/20211210-bdbc7405-0da5-40c5-a551-7f80d62a6bee.png'>

  点击“创建新的虚拟机”，进入虚拟机设置向导界面，选择“自定义（高级）”。

  <img src='./figures/20211210-9293d8e6-3a8c-4d77-998a-5836c1668a33.png'>

  点击“下一步”，进入“安装操作系统”界面，下载 CentOS-7-x86_64-DVD-1810.iso 映像文件，并通过“浏览”按钮找到文件位置

  <img src='./figures/20211210-a5afea0f-957e-4043-9eb6-c14c1f59c069.png'>

  点击“下一步”，进入“选择客户机操作系统”，选择“Linux”，并在“版本”下拉列表框中选择要安装的对应的 Linux 版本，这里选择 CentOS 7 64 位。

  <img src='./figures/20211210-74432ea4-1267-4ff5-954b-14eb8af1cdea.png'>

  继续“下一步”，进入“命名虚拟机”界面，给虚拟机起一个名字，然后单击“浏览”按钮，选择虚拟机系统安装文件的保存位置，建议选择 C 盘以外的盘。

  <img src='./figures/20211210-28d6263f-8c33-47ea-ae52-defe7ee5ecd0.png'>

  继续“下一步”,进入“处理器配置”界面，选择处理器数量和每个处理器的内核数量，可以按图配置，具体以自己电脑的配置为准。

  <img src='./figures/20211210-63337a88-2942-4254-8e7d-5df49d059915.png'>

  继续“下一步”,进入“此虚拟机的内存”界面，这里建议内存选择 4GB 到 8GB 最佳。

  <img src='./figures/20211210-3cc8da73-a3f5-4ba6-9563-99b3ef34820f.png'>

  继续“下一步”，直到“指定磁盘容量”界面，由于 OpenGauss 源代码较大，最大磁盘大小建议 40GB 以上，之后选择将虚拟磁盘拆分成多个文件。

  <img src='./figures/20211210-ea06bee8-b0b7-44f7-a656-f4e9eddea98e.png'>

  点击“下一步”，直至完成。完成后将进入下图的界面，点击开启此虚拟机。

  <img src='./figures/20211210-106af296-2dc6-4b45-a794-6dce76a12901.png'>

  选择 Install CentOS 7。

  <img src='./figures/20211210-66d6be04-870c-45e6-8a61-684e41032431.png'>

  进入安装引导界面，在安装引导过程中可以使用中文。

  <img src='./figures/20211210-8a062cb0-cb96-485c-b2da-1d1cb5cd0b0b.png'>

  随后进入“安装信息摘要”界面，其中安装源选择“本地介质” 。

  <img src='./figures/20211210-7bf5f3c6-2b6a-4ab9-9b6d-90a0ed0aea41.png'>

  点击软件选择。勾选左侧“带 GUI 的服务器”，加选项可以选择“FTP 服务器”、“Java 平台”、“PostgreSQL 数据库服务器”、“开发工具”等。点击完成。

  <img src='./figures/20211210-d5e22e70-6156-4350-800e-2ffb897830dc.png'>

  其他默认选择，点击开始安装。设置 ROOT 密码和创建用户即可。

  <img src='./figures/20211210-848ee9f8-263a-4376-9fc4-f9543764687d.png'>

  成功后点击重启，同意协议，登录即可。使用语言请选择英文。得到下图页面即成功

  <img src='./figures/20211210-5a69bbef-d423-4705-a2ed-9065d2e288a9.png'>

- MobaXterm 的使用

  <img src='./figures/20211210-1940ef8d-5cc8-433a-9eaf-41462282a702.png'>

  下载 MobaXterm_Personal_20.3.exe 文件并打开，这是可以直接使用的版本

  <img src='./figures/20211210-aac434b7-9ca3-4120-b309-99aa2e9e21a9.png'>

  点击右上角 Session-\>SSH，与刚刚创建好的虚拟机建立 SSH 连接，其中 Remote host 为虚拟机的 IP，得到下图的界面并且可以运行即可。

- 源码下载地址：https://gitee.com/opengauss/openGauss-server

  下载完成之后，将整个 openGauss-server 通过 MobaXterm 上传到 centos 上。本例将其放在/sda 下。

  <img src='./figures/20211210-db3fb345-411f-4db3-8560-7a01dbecd324.png'>

## 编译<a name="section146264211585"></a>

- 在 centos 中预先配置编译 openGauss 所需的环境。

  一键执行环境初始化脚本：

  https://www.modb.pro/db/48909

  注意事项：需要将脚本文件中的 IP 地址该为个人虚拟机的 ip。

  （通过 ifconfig 命令查看虚拟机 ip）

  <img src='./figures/20211210-96bb7e65-c7eb-4e31-aeef-84b891971183.png'>

  <img src='./figures/20211210-bbf89f72-abb0-4f41-a03f-d15eb662944f.png'>

- 如何使用脚本文件：创建脚本文件，xxx.sh，将上一步的脚本内容更改后保存到文件中 sh xxx.sh。编译 openGauss 需要 openGauss-server 和 binarylibs 两个组件。openGauss-server：openGauss 的主要代码。binarylibs：openGauss 依赖的第三方开源软件。通过以下网站获取编译好的 binarylibs。下载后解压缩并重命名为 binarylibs。

  https://opengauss.obs.cn-south-1.myhuaweicloud.com/2.0.0/openGauss-third\_party\_binarylibs.tar.gz

- 已经拥有完整的 openGauss 代码，把它存储在以下目录中（以 sda 为例）。

  /sda/openGauss-server

  /sda/binarylibs

  <img src='./figures/20211210-c820f96b-328a-4d16-a45c-19cf5779a8a4.png'>

  执行以下脚本获取系统版本号：

  <img src='./figures/20211210-93bb4f52-7b28-48b6-a13c-0f864d518183.png'>

  命令回显信息即为 openGauss 支持的操作系统。目前 openGauss 支持的操作系统为 centos7.6_x86_64 和 openeuler_aarch64。

  如果显示 Failed 或其他版本，表示 openGauss 不支持当前操作系统。

- 配置环境变量，例如，在 CENTOS X86-64 平台上，binarylibs 目录被作为 openGauss-server 目录的兄弟目录。 在 openGauss-server 目录下执行以下命令。

  选择 debug 版本进行配置：

  <img src='./figures/20211210-685f5e8c-6074-4356-831e-a6354dc1d658.png'>

- 执行以下命令编译 openGauss

  <img src='./figures/20211210-0e476672-b5db-4ad6-9289-c10feb76f434.png'>

  <img src='./figures/20211210-557280d9-ad84-4d05-91fa-43c6feff40df.png'>

- 显示如下信息，则表示编译和安装成功。

  <img src='./figures/20211210-7c90cd31-2185-45ba-acb9-04d2bb079b14.png'>

  <img src='./figures/20211210-99750504-0e35-4b30-bf35-263e6c17640d.png'>

## 启动数据库<a name="section959795219514"></a>

- 启动数据库，首先需要创建 omm 用户：useradd omm

  切换至 omm 用户下（su - omm）

  运行：

  <img src='./figures/20211210-2110a0e7-93a5-4f25-b530-b193e48c6e21.png'>

- /opt/gaussdb 为安装后数目录，Bigdata@123 为数据库用户密码\(密码可以自己设\)。

注意：

只有 omm 用户才可以使用 gs_initdb 等命令

如果提示有.so 文件没有连接，则重新设置一遍环境变量

- 启动数据库

<img src='./figures/20211210-327c67fc-3a60-4737-b7c0-841cbccb8fce.png'>

出现以下信息为启动成功

<img src='./figures/20211210-7bc0bdbf-4577-42c5-99ff-3a5462e887d5.png'>

连接数据库

<img src='./figures/20211210-3d1d1b84-c4aa-4dc2-bf0b-b33629a87bf1.png'>

其中 5432 为端口号，可以通过/opt/gaussdbpostgresql.conf 文件查找。

<img src='./figures/20211210-b5e98799-1e5c-411a-a4b8-bc25c8187085.png'>

启动成功：

<img src='./figures/20211210-415b9d65-5d55-4ac2-a8c4-81a5205d6b6e.png'>

## 调试<a name="section744216881014"></a>

首先在 centos 虚拟机中安装调试工具 eclipse，安装 eclipse 前需要先安装 Java，进入命令行页面，查看 Java 是否已正常安装

<img src='./figures/20211210-31165906-62b2-4632-ac2c-25490d109830.png'>

若未安装 Java，执行如下命令

<img src='./figures/20211210-9fdeb2db-b7d4-49ee-8dd5-3a933ddf6bc8.png'>

如果出现类似如下信息，则说明 Java 已正常安装。

<img src='./figures/20211210-a86cee82-2d69-4306-bc33-be92507f0cf9.png'>

下载 eclipse 文件：

http://www.eclipse.org/downloads/packages/release/Luna/SR2

下载与操作系统版本对应的 Eclipse 软件

将下载好的 tar.gz 文件上传到 centos 上去，例如放在/opt 目录下。解压压缩包。

解压后进入 eclipse 文件夹，双击 eclipse 可执行文件或命令行中执行”./eclipse”即可运行 eclipse。

在 eclipse 中导入代码：File/Import，选择 C/C++下的 Existing as Makefile Project

<img src='./figures/20211210-ad5cc11c-fe1e-4905-b05d-5f7f5307c029.png'>

选择解压后的代码目录；language 复选框中把 C++去掉，因为 openGauss 是用 C 语言写的；toolchain 选择 linux GCC；

导入之后可以看到这样的信息：

<img src='./figures/20211210-a47a2b19-4bef-43d0-8c5d-b2e8da4715a3.png'>

首先需要启动 openGauss 数据库

<img src='./figures/20211210-5fb969ff-5bb1-46dc-bb8f-3587b9d4d0ca.png'>

Run/debug configunations 中，设置挂载进程的路径

<img src='./figures/20211210-4da5c7fb-32fd-4bf7-b359-9a1759f2b4eb.png'>

<img src='./figures/20211210-bd249bef-5603-499b-8379-2ef1d28d796f.png'>

Tips: 节约时间，可以选择 Disable auto build 从而避免每次开始调试时的 make 环节，事实上每次 make 的结果并不会用到

开始调试时，确保数据库的服务端已经启动，此时选择进程名 guassdb\(omm\)

在文件 execMain.cpp 中设置断点，开始调试.
