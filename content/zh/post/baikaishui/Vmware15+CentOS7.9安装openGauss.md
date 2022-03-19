+++
title = "Vmware15+CentOS7.9安装openGauss"
date ="2021-12-01"
tags =["openGauss安装"]
archives ="2021-12"
author ="baikaishui"
summary ="Vmware15+CentOS7.9安装openGauss"
times ="19:20"
+++
# 1.	centos安装
这里我使用的是vmware workstation Pro 15
虽然官网了解了一下openGauss最适合的centos版本为centos7.6
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-a6a50103-ada8-47e6-9b8b-67e549907cb0.png)
但是因为centos7.6版本已经停更，所以我这里下载的是7.9版本的镜像文件
 ![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-afd3f661-5aa6-471b-bbcd-348df0cb5f8b.png)
下载完成后打开vmware，创建新的虚拟机
 ![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-761b80ef-2a71-4847-b2b5-2484be596cf9.png)
自定义配置，选择下一步。
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-509e08fb-fe6e-4780-ac8b-66dfd64e1298.png)
直接下一步
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-9fa6d835-4e4b-49aa-8d7a-4c72fff0e2a0.png)
选择稍后安装操作系统，下一步
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-26342b98-d470-469c-aaf3-ef1d92c5c7e5.png)
客户机操作系统选Linux，版本选CentOS7 64位
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-a2bbc16f-73ce-4f06-832f-3acb547fa6c4.png)
命名随意
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-687bd6a2-03d5-4be9-ae63-f703aa0ccb26.png)
处理器配置默认全1（这里可以根据自己电脑配置自行选择）
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-29542fd4-fad1-400a-9228-36c8e9091a21.png)
虚拟机内存我选的是2GB（这里也是根据自己电脑内存选择的）PS：据同学说这里虚拟机内存选8GB可以直接使用openGauss的简易安装模式，但我的电脑只有8GB所以没有尝试。
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-a83880a8-b691-4e5b-be49-5ac6ad1486da.png)
网络连接选NAT
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-f16115d9-ffed-4901-9d0a-1fc2d3c22e8f.png)
后面两项默认推荐
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-58ef519d-0fdf-4268-a965-9fd1202bc687.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-9b157160-f3cf-47ba-95f4-4b3ebff566a6.png)
创建新虚拟磁盘
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-336de266-3567-4a8c-9774-5ed2d20acc7e.png)
最大磁盘大小选20GB，选将虚拟磁盘拆分成多个文件
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-b40b3965-e8e1-421a-af60-111ed671d721.png)
默认下一步
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-9fc08dfe-373d-4cca-9c35-b9662d8f60e0.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-c19ba93f-b62b-4bec-b86c-8b1a6d2d9c7b.png)
右键CentOS点设置，点CD/DVD，使用ISO映像文件，选之前下载的镜像
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-bd77a466-0996-446e-9a0b-7ee3d9f72124.png)
然后开启虚拟机，这里我遇到了第一个问题，一开启虚拟机，宿主机就蓝屏死机。一开始我以为我后台开了什么东西内存占用太大，但关闭后台进程后依旧存在这个问题，查了一下，大多解释是说VMware的鲁棒性很差，在win10某次更新后VMware就存在这个蓝屏的问题。解决方法是更新至最新的VMware16 Pro版本。我试了一下，确实可行，而且覆盖更新不用重新配置虚拟机，上面的工作也没有白费。接下来继续安装。
打开虚拟机，选择Install CentOS Linux7 ，enter。
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-a9577981-cecb-41d3-be49-de06c1254f00.png)
语言就看个人情况选择了，不过中文可能会有些乱码问题。
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-056ea17d-e704-47a4-8cc9-39adad3b3725.png)
这里配置一些基本信息
1、点击安装源，进入之后直接选择done，警告符号随即消失。
2、软件选择：GNOME桌面，一个友好的图形化界面
3、根据需要禁用Kdump
4、自动分区，一般化为4个分区，如图所示
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-c58ec813-5513-4b9b-b39c-4e5b93e096c6.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-c6e79bdb-5ef7-4032-a73d-ac0ca9d60ba0.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-b505b663-c25f-41e4-b5c2-bef61a9f6b37.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-1915e9de-6812-4c2e-84a5-dc2923ec1a54.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-9086ab93-8c53-421b-a22d-3a0962d78d3f.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-ab3d2903-4b9b-4fb7-9471-0f7ac281e713.png)
在安装过程中设置用户和密码
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-57e3ac12-ece8-40d2-97e6-93817d3d2ee6.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-bbda861e-a48e-43db-becb-d9ef142092d9.png)
安装后点重启，看到如下界面
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-b21ea234-737b-4c98-9218-7670007800db.png)
接受许可并配置网络
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-7ad37229-535b-4b33-a753-d24cbf63ab90.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-3b214586-e402-4f17-80aa-5e4c0df67cd1.png)
登录后就可进入图形界面
右上角打开有线设置
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-a0b8e6e9-3f46-43cd-b849-23e11a1d05af.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-2f8d5ff2-05f7-460f-845c-5b0e98bd531c.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-64a7d3c3-3d0b-4f5b-af78-9c0956e92b01.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-97ea268b-5c3a-428e-9063-b6c8149a1a37.png)
到此，CentOS的安装就完成了。
# 2.	openGauss安装
2.1准备工作
查看ip   ifconfig
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-e934a54e-ed70-4f80-a78d-c0dea7344055.png)
vi /etc/profile编辑/etc/profile文件，在末尾加上ulimit -c unlimited,然后重新加载该文件
source /etc/profile
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-a2646262-5c43-4d36-891d-a2b18a969c16.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-9403d6ec-ff8a-4d8d-b2e4-02338fe00da0.png)
关闭防火墙，禁用SWAP，SELINUX（为了后面安装避免过多验证以及避免连接失败）
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-43835996-f37b-4849-b1db-849b7d035cc1.png)
继续执行yum install python3.6*命令（我这里由于之前已经安装过python3.6了，因此得到的结果如下图）
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-f49ab3f9-8a2d-42ac-9d63-6ceedbce4ab2.png)
没安装过的话效果是这样的
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-c8c5e0b9-78ef-4aff-ad2b-4e1c92bf9be0.png)
然后进行其他软件包的安装
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-928bdc29-2350-4227-9644-4279a3d6e53a.png)
linux中权限最大的用户是root，Gauss数据库官方默认以dbgrp为用户组，omm为用户，所以需要进行用户创建。
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-87f1d013-8d7e-4d2d-81c1-ad710c601fc2.png)
然后我们为openGauss建一个目录，用来存放openGauss的压缩包以及该压缩包解压后的文件。这里我在/opt/software下新建了一个openGauss的文件夹。执行chmod -R 755 /opt/software/openGauss命令给予openGauss文件夹读写权限。
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-781fd591-60f7-43aa-86e1-adc4b09165f0.png)
2.2下载openGauss安装包
在官网下载openGauss 的安装包，我这里选择的是2.0.1企业版。
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-e2d4bbc9-1c3b-46fb-bef9-176909559e15.png)
然后设置VMware的共享文件夹用于在宿主机和虚拟机之间传递文件。
设置共享文件夹一般有自动和手动两种方式
因为未知原因，我的安装vmware tools的按键灰色不可用
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-3d8cafff-c158-4fbc-8e64-8cb87698e2a1.png)
尝试了很多解决办法也没有作用，只能选择手动设置共享文件夹。
右键centos选择设置，进入选项界面
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-81e598ec-8bc2-4cb9-a614-0b9651b96411.png)
选择共享文件夹，总是启用，并在宿主机上设置共享文件夹。
设置完成后，使用vmhgfs-fuse .host:/ /mnt/hgfs指令完成共享文件夹的挂载
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-6e6350a3-4bec-4604-b586-d336618365f8.png)
cd进根目录/mnt/hgfs，可以看到先前设置的主机共享文件夹
不过这种方法配置共享文件夹需要每次开机后重新进行挂载，比较麻烦。
然后将宿主机中的安装包放入共享文件夹中，再通过mv指令将安装包放入openGauss文件夹下
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-79b89929-92a7-4a30-a202-1a7c321b56e5.png)
然后进入openGauss文件夹解压安装包
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-a5a81815-0ded-4f93-abb8-196d6034c8ba.png)
然后执行命令ls -l，显示类似如下信息即可
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-1db931d7-5e74-4dee-bc96-ed67eabafa40.png)
# 3.	配置XML文件
 进入刚刚解压产生的script文件夹，查看是否有预安装脚本：
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-15bdf36d-8159-47b4-b211-bf760de3ef9a.png)
在openGauss目录下执行vim clusterconfig.xml命令。然后将下面内容右键粘贴到新建的xml文件中，然后按esc退出插入模式，输入:wq！保存并退出。
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
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-28038b33-f321-46d4-82a1-9e0567371b03.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-e7909e4e-abfa-4411-af1d-6b1ebdc4ba56.png)
这里的节点名称和IP要改成自己的，这些在准备工作中已经查看了。
执行vi /etc/profile命令打开profile文件，添加如下命令：
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-222643e8-5859-44e2-aebb-fe0e8a238868.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-4a752f1f-43e2-41e0-af89-286b63dabc5a.png)
退出插入模式，输入:wq!保存并退出。然后需要source一下
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-f9aafbcf-580c-4b7d-b709-bc945b58cb3e.png)
# 4.	预安装
在/opt/software/openGauss/script文件夹下，执行命令
./gs_preinstall -U omm -G dbgrp -X /opt/software/openGauss/clusterconfig.xml
正常情况下会出现以下反馈
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-e9daf0ee-25bf-4428-81a2-2b7dd01f1899.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-9ab118b5-8063-4b1a-81e8-b3606e85cd4c.png)
但是可能是因为我的xml文件配置错误，又或者是其他原因，导致我的预安装指令没有反馈，不论成功还是报错都没有。这里我就犯了个错误，在没有反馈的情况下反复执行预安装指令，没有反馈重启终端再执行；还没有反馈重启虚拟机再执行。反复操作下我的centos开启过程开始报错piix4_smbus: Host SMBus controller not enabled!；输入密码后从登录界面又跳回登录界面没法进入系统。
在尝试了诸多解决方法之后，我发现这时我的centos重启后会丢失数据，按照网上的解决方法更改的文件无法保存，所以都没有发挥作用。在进行了一个下午的尝试后我放弃了，我选择重新配置一个新的虚拟机，按照上述步骤重来一次。现在想来可能是反复执行预安装命令产生大量重复的root用户和openGauss用户的互信信息导致磁盘占用率接近满值导致出现该问题。在重新配置虚拟机后我再次开始预安装，这次出现了报错反馈Exception: [GAUSS-51900] The current OS is not supported. The current system is: centos7.9这里提示我们CentOS7.9不支持openGauss，所以我们需要降级到7.6版本，但7.6版本的镜像我在网上没能找到，据说openGauss相关书籍里会提供7.6版本镜像。但我这里使用的是wget http://vault.centos.org/7.6.1810/os/x86_64/Packages/centos-release-7-6.1810.2.el7.centos.x86_64.rpm 指令来下载centos7.6版本rpm包
安装下载的7.6 rpm 包
rpm -ivh centos-release-7-6.1810.2.el7.centos.x86_64.rpm –force
这时重新运行 rpm -qa | grep -i centos-release 就可以看到两个发行版本
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-0842a449-c815-4a43-80f6-a564d0e4980e.png)
卸载掉7.7版本
rpm -ev centos-release-7-7.1908.0.el7.centos.x86_64
之后再次进行预安装，这次成功进行了预安装。
通过openGauss提供的gs_checkos工具来检查系统状态。注意需要切换到/opt目录下执行命令。
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-126222ef-e752-4ccb-897f-a7c1965002ad.png)
# 5.	正式安装
切换到omm用户,进行安装。
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-575c8328-0121-4f51-b4d9-ffff17afdb84.png)
执行过程中需要用户设定密码，最后出现completed就完成了。
在omm用户下，执行gs_om -t start命令和gs_om -t stop命令启动或关闭数据库
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-26622cc5-8c41-4076-a7f7-baf638b0b48f.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20210927-2c23e3a1-bf7b-4e75-ae1f-4235e85f3626.png)


参考文章：[openGauss安装](https://blog.csdn.net/qq_38029916/article/details/119136887?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522163270679216780262549001%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=163270679216780262549001&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduend~default-1-119136887.pc_search_ecpm_flag&utm_term=vmware+centos+opengauss&spm=1018.2226.3001.4187)
；[CentOS7安装](https://blog.csdn.net/tsundere_x/article/details/104263100?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522163270756416780357262837%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fall.%2522%257D&request_id=163270756416780357262837&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_ecpm_v1~rank_v29_ecpm-2-104263100.pc_search_ecpm_flag&utm_term=vmware安装centos&spm=1018.2226.3001.4187)