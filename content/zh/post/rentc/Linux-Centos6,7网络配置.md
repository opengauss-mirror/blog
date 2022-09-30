+++

title = "Linux(Centos6,7)网络配置"

date = "2022-09-09"

tags = ["Linux(Centos6,7)网络配置"]

archives = "2022-09"

author = "海量数据"

summary = "Linux(Centos6,7)网络配置"

img = "/zh/post/Rentc/title/title.jpg"

times = "18:30"

+++

背景：在安装数据库前很多很多人会选择安装一台虚拟机，安装虚拟机在非常重要的是配置网络，这里介绍两种配置网络的方法。<br />1.首先我们介绍一下一些常用的关于网络的linux命令 ，我们可以通过下面的命令来查看我们的网卡信息，选择我们需要配置的网卡。<br />ifconfig：查看活动的网卡信息，仅限于活动的网卡<br />ifconfig  eth[0-9]：后面跟某个网卡则可以直接查看某个网卡的信息<br />ifconfig –a ：则是查看所有的网卡信息，包括活动或非活动的网卡信息<br />2.⑴、命令配置法：ifconfig和ip <br /> <br />      Ifconfig ethx:x IP/netmask <br /> <br />      ip addr add IP dev ethx label ethX:X <br /> <br />      利用命令配置的只是暂时的IP地址，如果重启网络服务和系统都会失效的。 <br /> <br />⑵、配置文件配置法： <br /> <br />    修改/etc/sysconfig/network-scripts/ifcfg-ethx:x <br /> <br />      DEVICE=ethx:x <br /> <br />      BOOTPROTO=static  <br /> <br />      IPIPADDR=   IP地址 <br /> <br />      NETMASK=  子网掩码 <br /> <br />      GATEWAY=  网关 <br /> <br />      ONBOOT=YES   是否开机启用 <br /> <br />      HWADDR=...... MAC <br /> 参考文档：[https://blog.51cto.com/chrinux/1188108](https://blog.51cto.com/chrinux/1188108)

