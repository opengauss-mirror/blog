---
title: 'openGauss部署中遇到的问题'

date: '2020-12-24'

category: 'blog'
tags: ['openGauss故障处理']

archives: '2020-12'

author: '三五七言'

summary: 'openGauss部署中遇到的问题'

img: '/zh/blogs/sanwuqiyan/title/img28.png'

times: '15:30'
---

# openGauss 部署中遇到的问题<a name="ZH-CN_TOPIC_0000001073050591"></a>

**1.主机名和 IP 地址设置**

```
最好同时修改三个地方:/etc/hosts、/etc/sysconfig/network-scripts/ifcfg-ens33、/etc/hostname
1). /etc/hosts ip地址与主机名相互映射
2).
① /etc/sysconfig/network-scripts/ifcfg-ens33  ifcfg-ens33为我的文件名，你需要在/etc/sysconfig/network-scripts下找到和这个文件名差不多的文件（通过ls命令查看文件），如ifcfg-设备名。
② 修改：  BOOTPROTO="static"、ONBOOT="yes"
③ 添加：  IPADDR=192.168.122.2、NETMAST=255.255.255.0、GATEWAY=192.168.6.2、BROADCAST=192.168.6.255。注意IPADDR为你的主机IP地址、NETMAST、GATEWAY可以在VMWare中的编辑–>虚拟网络编辑器->VMnet8->NAT设置->子网掩码和网关、BROADCAST 相当于网关的最后八位改为255）
3). /etc/hostname 下改为你自己的主机名
```

**2.当输入：gsql -d postgres -p 26000 -r 报错如下：failed to connect Unknown：26000**

```
解决方法：
1.查看数据库进程是否关闭：ps -ef |grep gauss
2.如果关闭，重新启动：gs_om -t start
```

**3. 当输入命令： ./gs_preinstall -U omm -G dbgrp -X /soft/openGauss/clusterconfig.xml 时出现错误如下：\[GAUSS-51100\]: Failed to verify SSH trust on these node：slave1。 （注：slave1 为主机名）**

```
解决办法：
命令改为（后面加了个-L）： ./gs_preinstall -U omm -G dbgrp -X /soft/openGauss/clusterconfig.xml -L
```

**4.在解决了 3 中问题可能出现如下问题：\[GAUSS-50300\]:User omm dose not exist.Detail msg:“getpwnam\(\):name not found:‘omm’”**

```
解决办法：
1.创建用户组：groupadd dbgrp
2.创建用户：useradd -g dbgrp -m omm -d /home/omm
3.输入用户密码：passwd omm
```

**5.当输入命令：gs_install -X /soft/openGauss/clusterconfig.xml 时出现错误如下：gs_install：command not found**

```
解决办法：source /etc/profile、source ~/.bashrc
```

**6.当输入命令：gsql -d postgres -p 26000 -r 出现如下错误：gsql：command not found…**

```
将gsql添加到环境变量中，可以在clusterconfig.xml看gsql文件的位置，默认在/gauss/app下，通过ls查看（注意app这个文件可能后面有一串字符，所以先进入/gauss下然后通过ls查看，再进入app下找到gsql文件），然后通过 /gauss/xxx/xx/gsql -d postgres这个命令添加环境变量（xxx是你具体的文件名）
如果上述中找不到文件，输入 ps -ef|grep gauss看下数据是否安装成功，如果没有装，就将/gauss下的文件全部删除，重新安装。
```

**7.部署 openGauss 的时候，输入命令： gs_install -X /soft/openGauss/clusterconfig.xml 出现错误如下：\[GAUSS-51400\]:Failed to excute the command：source /home/omm/.bashrc:python3 ‘/gauss/om/script/log/omm/om/gs_local.log -X…’、以及 Number of processor must be at least 1**

```
解决思路：
1. cd /gauss/om/script/log/omm/om 下，查看日志文件，查看所有的.log文件，根据.log提示来解决问题。
2. 如果上述log文件中提示的错误与问题中的一致，则查看下系统的基本配置，cat /proc/cpuinfo ，很有可能是系统基本配置不够引起的。
```

**8.在安装一主一从的过程中遇到的问题**

```
xml文件中的主机名和ip地址一定要改为主机和备机的，且只需要在主机进行安装部署openGauss，备机只需要配置好相关的运行环境，如java、python3等依赖包。
```

**9.安装一主两备过程中出现的问题**

```
命令： ./gs_preinstall -U omm -G dbgrp -X /soft/openGauss/clusterconfig.xml
出现问题：[GAUSS-51400]: Failed to execute the command: rm -rf '/tmp/step_preinstall_file.dat'. Result:{'MSlave2':'Failure','MSlave1':'Success','MMaster1':'Success'}。 主机MMaster1、备机MSlave1成功，但是还有一台MSlave2备机却失败了。
思路：
1. 查看om下的日志文件 ，/gauss/om/script/log/omm/om 这个文件夹下。根据日志来排除错误，如果提示错误与问题一致，则尝试别的方法。
2. 在主机通过命令 ping 备机名 或者 ping 备机ip地址，看下是否能够ping通
3. 通过 ssh 连接备机，命令 ssh 备机名 或者 ssh 备机IP地址，然后发现当ssh 备机MSlave2（出问题的那一台）的时候出现了要输入yes或者no来进行确认是否连接，则可以判断ssh认证没有弄好。
① 重新建立ssh认证，进行MMaster1 与 MSlave2 进行单独互信的操作。
② 将 /root/ssh/id_rsa（注：主机和备机都要） 复制到 /root/ssh/authorized_keys （authorized_keys这个没有就自己创建，这个也是主机和备机都要创建）
```
