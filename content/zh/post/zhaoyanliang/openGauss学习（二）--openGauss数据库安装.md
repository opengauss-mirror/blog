```
+++
title = "openGauss学习（二）--openGauss数据库安装"
date = "2021-11-27"
tags = ["openGauss社区开发入门"]
archives = "2021-11"
author = "zhaoyanliang"
summary = "openGauss社区开发入门"
img = "/zh/post/zhaoyanliang/title/title.jpg"
times = "17:30"
+++
```



## opengauss安装教程（二）

前面我们已经完成了虚拟机centos的安装和环境配置，接下来我们要进入opengauss的安装了



#### 一、操作系统环境准备

1. **修改系统版本**

   

   先使用su指令切换到root用户：

   ![image-20211108162752916](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211108162752916.png)

   如果CentOS版本不是7.6的需要进行修改，如果是7.6则无需修改，

   先vi /etc/redhat-releas 打开编辑文件，然后将内容改为CentOS Linux release 7.6.2003 (Core)。输入”i”切换到编辑模式，移动鼠标到修改位置修改内容，然后按下ESC键退出编辑模式，然后输入”:wq”退出并进行保存，具体如下：

   ![image-20211110161157466](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211110161157466.png)

2. **关闭防火墙**

​	执行以下二个命令将防火墙关闭，

​	systemctl stop firewalld.service

​	systemctl disable firewalld.service，具体如下

​	![image-20211108163254936](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211108163254936.png)

3. **设置字符集及环境变量**

   

   ![image-20211108163954650](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211108163954650.png)

   验证变量是否生效：

   ![image-20211108165054078](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211108165054078.png)

   

4.  **关闭swap内存**

    swapoff -a

   ![image-20211108165558448](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211108165558448.png)

5.  **准备yum环境**

   备份原有的yum配置文件：

    mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.bak

   

   ![image-20211108165833119](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211108165833119.png)

   

   下载可用源的repo文件,可通过以下二种方式下载：

   方式一：

   curl -o /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo

   方式二：

   curl -o /etc/yum.repos.d/CentOS-Base.repo https://mirrors.huaweicloud.com/repository/conf/CentOS-7-anon.repo

   如图：

   ![image-20211108170027609](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211108170027609.png)

   查看repo文件内容是否正确，如果显示的内容不正确，请选择另一种方式下载可用源的repo文件。

   ![image-20211108170353485](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211108170353485.png)

   

6.  **yum安装相关包。**

   3. 执行以下命令，安装所需的包

      yum install -y libaio-devel flex bison ncurses-devel glibc.devel patch lsb_release wget python3

      如下：

      ![image-20211110164431185](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211110164431185.png)

      此处可能你会出错：-bash: /usr/bin/yum: /usr/bin/python: bad interpreter: No such file or directory

      因为我也出错了。。。。

      解决方法：

      [-bash: /usr/bin/yum: /usr/bin/python: bad interpreter: No such file or directory_weixin_38169359的博客-CSDN博客](https://blog.csdn.net/weixin_38169359/article/details/101292719)

      根据你的路径决定修改后python数字是2.4还是2.7亦或是其它哦（我是2.7）

7. **设置默认Python版本为3.x。**

   ![image-20211110164207128](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211110164207128.png)

    修改完成后，需要确认yum是否能使用，如果不能使用需要修改/usr/bin/yum文件，把#!/usr/bin/python这行修改为#!/usr/bin/python2.7（或者对应的python 2.x的版本）。输入”i”切换到编辑模式，移动鼠标到修改位置修改内容，然后按下ESC键退出编辑模式，然后输入”:wq”退出并进行保存。如下：

   ![image-20211110164540792](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211110164540792.png)

   用yum --help命令来验证yum是否能使用：

   ![image-20211110164642691](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211110164642691.png)

8. **创建数据库存放安装目录：**

   ![image-20211110164843604](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211110164843604.png)

9. **下载数据库安装包**

   ![image-20211110164953102](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211110164953102.png)



#### 二、安装opengauss数据库

1. **创建XML配置文件，用于数据库安装**

   ![image-20211110165208487](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211110165208487.png)

   将以下内容添加进clusterconfig.xml文件中。输入”i”切换到编辑模式，复制内容黏贴到文档中，然后按下ESC键退出编辑模式，然后输入”:wq”退出并进行保存。

   ![image-20211110165401524](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211110165401524.png)

   ```
   <?xml version="1.0" encoding="UTF-8"?> 
   <ROOT> 
       <!-- openGauss整体信息 --> 
       <CLUSTER> 
           <PARAM name="clusterName" value="dbCluster" /> 
           <PARAM name="nodeNames" value="db1" /> 
           <PARAM name="backIp1s" value="10.0.3.15"/> 
           <PARAM name="gaussdbAppPath" value="/opt/gaussdb/app" /> 
           <PARAM name="gaussdbLogPath" value="/var/log/gaussdb" /> 
           <PARAM name="gaussdbToolPath" value="/opt/huawei/wisequery" /> 
           <PARAM name="corePath" value="/opt/opengauss/corefile"/> 
           <PARAM name="clusterType" value="single-inst"/> 
       </CLUSTER> 
       <!-- 每台服务器上的节点部署信息 --> 
       <DEVICELIST> 
           <!-- node1上的节点部署信息 --> 
           <DEVICE sn="1000001"> 
               <PARAM name="name" value="db1"/> 
               <PARAM name="azName" value="AZ1"/> 
               <PARAM name="azPriority" value="1"/> 
               <!-- 如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP --> 
               <PARAM name="backIp1" value="10.0.3.15"/> 
               <PARAM name="sshIp1" value="10.0.3.15"/> 
                
   	    <!--dbnode--> 
   	    <PARAM name="dataNum" value="1"/> 
   	    <PARAM name="dataPortBase" value="26000"/> 
   	    <PARAM name="dataNode1" value="/gaussdb/data/db1"/> 
           </DEVICE> 
       </DEVICELIST> 
   </ROOT>
   
   ```

   说明：其中标红的内容，需要根据自己实际的IP和主机名进行修改，如果其中的中文出现乱码时可以删除这些行。

2. **将下载好的安装包解压至存放目录**

   先解压openGauss-1.1.0-CentOS-64bit-all.tar.gz包

   ![image-20211110170430428](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211110170430428.png)

   再先解压openGauss-1.1.0-CentOS-64bit-om.tar.gz包。

   ![image-20211110170638586](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211110170638586.png)

   解压后如下，用ls命令查看如下：

   ![image-20211110170721864](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211110170721864.png)

   安装包解压后，会在/opt/software/openGauss路径下自动生成script子目录，并且在script目录下生成gs_preinstall等各种OM工具脚本。

   更改权限。

   ![image-20211110170828835](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211110170828835.png)

3. **执行初始化脚本**

   ![image-20211110171525896](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211110171525896.png)

   期间需要输入操作系统root用户的密码（如密码：openGauss@123）和创建操作系统omm用户及设置密码（如密码：openGauss@123）。密码依然不回显，直接输入密码并回车即可。

   当返回Preinstallation succeeded内容时，表明初始化完成。

4. **初始化数据库。**

   用init 6 重启下虚拟机（主要是为了释放一些内存资源）。

   ![image-20211110171651494](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211110171651494.png)

   更新权限：

   ![image-20211110173502716](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211110173502716.png)

   然后使用omm用户进行数据库初始化。

   注意：根据用户实际内存大小设置对应的共享内存的大小，如果对该参数进行了设置，会在数据库启动时候报错，本实验虚拟机总内存大小是2G。

   gs_install -X /opt/software/openGauss/clusterconfig.xml --gsinit-parameter="--encoding=UTF8" --dn-guc="max_process_memory=**2GB**" --dn-guc="shared_buffers=**128MB**" --dn-guc="bulk_write_ring_size=**128MB**" --dn-guc="cstore_buffers=**16MB**"

   具体如下：

   ![image-20211110173619641](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211110173619641.png)

   （我已经安装过一遍，和你的页面可能不太一样）

5. **清理软件安装包**

   ![image-20211110174019749](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211110174019749.png)

   （我同样已经删过一遍）

#### 三、数据库基础使用

   1. **切换用户到omm：**

      ![image-20211114002741385](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211114002741385.png)

   2. **启动服务**

      启动服务命令：**gs_om -t start**

      ![image-20211114002839042](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211114002839042.png)

   3. **连接数据库**

      连接指令：**gsql -d postgres -p 26000 -r**   

      当结果显示为如下信息，则表示连接成功。

      ![image-20211114003113627](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211114003113627.png)

      其中，postgres为openGauss安装完成后默认生成的数据库。初始可以连接到此数据库进行新数据库的创建。26000为数据库主节点的端口号，需根据openGauss的实际情况做替换，请确认连接信息获取。
      
      **引申信息：**
      
      使用数据库前，需先使用客户端程序或工具连接到数据库，然后就可以通过客户端程序或工具执行SQL来使用数据库了。gsql是openGauss数据库提供的命令行方式的数据库连接工具。
      
   4. **第一次连接数据库时，需要先修改omm用户密码，新密码修改为Bigdata@123（建议用户自定义密码）**
      

   **alter role omm identified by *'Bigdata@123*' replace *'openGauss@123'*;**
      
      显示“ALTER ROLE”则成功

5.  **创建数据库用户**。

   默认只有openGauss安装时创建的管理员用户可以访问初始数据库，您还可以创建其他数据库用户帐号。

   指令：**CREATE USER joe WITH PASSWORD "Bigdata@123";** 

   ![image-20211114004255316](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211114004255316.png)

    如上创建了一个用户名为joe，密码为Bigdata@123的用户。

6.  **创建数据库。**

   指令：**CREATE DATABASE db_tpcc OWNER joe;** 

   ![image-20211114004314410](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211114004314410.png)

   退出数据库：

   ![image-20211114004408389](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211114004408389.png)

   使用新用户连接到此数据库：

   指令： **gsql -d db_tpcc -p 26000 -U joe -W Bigdata@123  -r**

   显示如下内容表示成功：

   ![image-20211114004517198](C:\Users\赵小黑\AppData\Roaming\Typora\typora-user-images\image-20211114004517198.png)



**至此，opengauss数据库安装全部完成**





​		

