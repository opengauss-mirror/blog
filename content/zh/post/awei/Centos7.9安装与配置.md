+++

title = "***Centos7.9安装与配置***"
date = "2021-12-03"
tags = ["华为OpenGauss数据库安装与使用"]
archives = "2021-12"
author = "awei"
summary = "华为OpenGauss数据库安装：***Centos7.9安装与配置***"
times = "17:30"

+++

## ***Centos7.9安装与配置***

**一、** ***Vmware虚拟机安装（安装版本为VMware Workstation 16 Pro）***

1. 先去官网下载：https://www.vmware.com/cn/products/workstation-pro/workstation-pro-evaluation.html

2. 运行下载完成的Vmware Workstation虚拟机软件包。如下图：![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps27.jpg)![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps28.jpg)![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps29.jpg) ![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps30.jpg) 

3. 一切准备就绪后，单击“升级”按钮。进行安装![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps31.jpg)![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps32.jpg) 

4. 安装完成，重启电脑，输入软件激活序列号即可使用。![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps33.jpg) 

**二、** ***虚拟机上Centos操作系统安装（centos7.9）***

1. 先去官网下载centos安装包，指导书上说要安装centos7.6，没找到，安装的centos7.9，安装opengauss数据库前要改一个文件内容，不然会报错版本不匹配。下载的为everything版本（CentOS-7-x86_64-Everything-2009.iso）。![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps34.jpg) 

2. 下载完后打开刚安装的VMware Workstation点击文件->新建虚拟机，选择自定义，之后下一步。![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps35.jpg) ![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps36.jpg) 

3. 选择稍后安装操作系统，下一步，选择linux操作系统，版本Centos7 64位。![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps37.jpg) ![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps38.jpg) 

4. 下一步，虚拟机命名并选择位置。![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps39.jpg) 

5. 自己进行选择相关配置（内存尽量大一些，以防后面出现问题，网络连接选择NAT模式，其它可不变）![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps40.jpg) ![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps41.jpg) ![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps42.jpg) 

6. 继续相关配置![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps43.jpg) ![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps44.jpg)![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps45.jpg) 

7. 一直下一步，到已准备好创建虚拟机状态，选择自定义硬件![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps46.jpg) 使用已下载好的ISO映像文件。![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps47.jpg) 

8. 完成后打开此虚拟机，开启虚拟机后会出现以下选择:

   ```
   Install CentOS Linux 7 安装CentOS 7
   Test this media & install CentOS Linux 7 测试安装文件并安装CentOS 7
   Troubleshooting 修复故障
   ```

   选择第一项，直接安装CentOS 7，回车，进入下面的安装界面![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps48.jpg) 

9. 安装完成进入centos7（选择中文，简体中文，按顺序选择自己需要的配置就可以，软件选择GNOME桌面，便于操作；安装目的地进行磁盘划分；网络和主机名进行联网）![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps49.jpg) ![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps50.jpg) ![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps51.jpg) ![img](file:///C:\Users\DELL\AppData\Local\Temp\ksohtml2996\wps52.jpg) 之后可以添加用户，设置名字和密码。最后点击开始安装。

10. 安装成功后重启进入即可。

 