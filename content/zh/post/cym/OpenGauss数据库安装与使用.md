+++

title = "openGauss数据库安装与使用"
date = "2021-11-30"
tags = ["openGauss社区开发入门"]
archives = "2021-11"
author = "chen-yiming-cs"
summary = "openGauss社区开发入门" 
times = "17:30"

+++

# 一、相关说明
  使用VMware虚拟机，安装CentOS7.9 64位系统（因为找不到7.6的安装包了），设置此系统的基础参数如下（这里内存需要设置大一点，不然可能会无法运行OpenGauss）：

![img](./image/1.png "#left")

  此外，还需要修改/etc/redhat-release文件中系统的版本为：CentOS Linux release 7.6(Core)，这是因为不安装7.6，可能出现gauss与os不匹配的问题，但是目前已经没有7.6的包了。所以选择了7.9，然后吧版本号改掉。



# 二、具体安装步骤


## 1．准备操作
（1）配置yum源
  删除自带的yum源

```bash
rm -rf /etc/yum.repos.d/* 
```
    
  下载阿里云的yum源

```bash
wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
```
 
   然后更新缓存
```bash
yum makecache
```
（2）安装一些依赖项

```
yum clean all
yum install -y lksctp*
yum install -y java-1.8.0-openjdk* psmisc bzip2 python3 python3-devel
yum install -y libaio-devel flex bison ncurses-devel glibc-devel patch redhat-lsb-core
```



（3）配置ip和hostname

```
hostname && ifconfig |grep broadcast|awk '{print $2}'
sed -i '/MasterG/d' /etc/hosts
echo "192.168.2.131 MasterG ##Gauss OM IP Hosts Mapping" >> /etc/hosts
cat /etc/hosts|grep Gauss



```
（4）关闭防火墙然后重启

```
systemctl status firewalld
systemctl disable firewalld.service
systemctl stop firewalld.service
sed -i '/SELINUX=/d' /etc/selinux/config
echo "SELINUX=disabled" >> /etc/selinux/config
cat /etc/selinux/config|grep -v ^#|grep -v '^$'
reboot


```

（5）配置时区

```
echo "export LANG=en_US.UTF-8" >> ~/.bash_profile
source ~/.bash_profile
env|grep LANG
rm -fr /etc/localtime
ln -s /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
ll /etc/localtime


```

（6）关闭SWAP

```
swapoff -a


```

（7）关闭透明页并重启

```
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
sed -i '/^GRUB_CMDLINE_LINUX/d' /etc/default/grub
echo "GRUB_CMDLINE_LINUX=\"rhgb quiet transparent_hugepage=never\"" >> /etc/default/grub
grub2-mkconfig -o /boot/grub2/grub.cfg

reboot


```

（8）修改系统资源限制

```
echo "* soft stack 3072" >> /etc/security/limits.conf
echo "* hard stack 3072" >> /etc/security/limits.conf
echo "* soft nofile 1000000" >> /etc/security/limits.conf
echo "* hard nofile 1000000" >> /etc/security/limits.conf
echo "* soft nproc unlimited" >> /etc/security/limits.d/90-nproc.conf
tail -n 4 /etc/security/limits.conf
tail -n 1 /etc/security/limits.d/90-nproc.conf


```

## 2．详细安装

（1）下载安装包、创建用户组和目录

```
groupadd dbgrp
useradd -g dbgrp -d /home/omm  -m -s /bin/bash omm
 echo "omm" | passwd  -‐stdin omm
mkdir -p /opt/software/openGauss
chmod 755 -R /opt/software
chown -R omm:dbgrp  /opt/software/openGauss 
cd /opt/software/openGauss/
wgethhttps://opengauss.obs.cn-south-1.myhuaweicloud.com/2.0.0/x86/openGauss-2.0.0-CentOS-64bit-all.tar.gz
tar -zxvf openGauss-2.0.0-CentOS-64bit-all.tar.gz 
tar -zxvf openGauss-2.0.0-CentOS-64bit-om.tar.gz 


```
（2）配置XML文件

```
cp script/gspylib/etc/conf/cluster_config_template.xml .
具体配置文件为（标红的地方要设置成自己的）：
<?xml version="1.0" encoding="UTF-8"?>
<ROOT>    <!-- openGauss整体信息 -->    
<CLUSTER>        <!-- 数据库名称 -->        
<PARAM name="clusterName" value="singlenode" />     <!-- 数据库节点名称(hostname) -->        
<PARAM name="nodeNames" value="node1" />  <!-- 数据库安装目录-->        
<PARAM name="gaussdbAppPath" value="/opt/huawei/install/app" />   <!-- 日志目录-->        
<PARAM name="gaussdbLogPath" value="/opt/huawei/log" />      <!-- 临时文件目录-->        
<PARAM name="tmpMppdbPath" value="/opt/huawei/tmp" />     <!-- 数据库工具目录-->        
<PARAM name="gaussdbToolPath" value="/opt/huawei/install/om" /> <!-- 数据库core文件目录-->        
<PARAM name="corePath" value="/opt/huawei/corefile" />  <!-- 节点IP，与数据库节点名称列表一一对应 -->
<PARAM name="clusterType" value="single-inst"/>        
<PARAM name="backIp1s" value="192.168.17.129"/>     
</CLUSTER>    <!-- 每台服务器上的节点部署信息 -->    
<DEVICELIST>        <!-- 节点1上的部署信息 -->        
<DEVICE sn="1000001">            <!-- 节点1的主机名称 -->           
 <PARAM name="name" value="node1"/>   <!-- 节点1所在的AZ及AZ优先级 -->            
<PARAM name="azName" value="AZ1"/>            
<PARAM name="azPriority" value="1"/>  <!-- 节点1的IP，如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->            
<PARAM name="backIp1" value="192.168.2.131"/>            
<PARAM name="sshIp1" value="192.168.2.131"/>  <!--dbnode-->        
<PARAM name="dataNum" value="1"/>        
<PARAM name="dataPortBase" value="26000"/>        
<PARAM name="dataNode1" value="/opt/huawei/install/data/db1"/>            
<PARAM name="dataNode1_syncNum" value="0"/>        
</DEVICE>    
</DEVICELIST>
</ROOT>


```

（3）添加lib库
在 .bashrc文件中添加如下：

```
export GPHOME=/opt/huawei/install/om
export PATH=$GPHOME/script/gspylib/pssh/bin:$GPHOME/script:$PATH
export LD_LIBRARY_PATH=$GPHOME/lib:$LD_LIBRARY_PATH
export PYTHONPATH=$GPHOME/lib
export GAUSSHOME=/opt/huawei/install/app
export PATH=$GAUSSHOME/bin:$PATH
export LD_LIBRARY_PATH=$GAUSSHOME/lib:$LD_LIBRARY_PATH
export S3_CLIENT_CRT_FILE=$GAUSSHOME/lib/client.crt
export GAUSS_VERSION=2.0.0
export PGHOST=/opt/huawei/tmp
export GAUSSLOG=/opt/huawei/log/omm
umask 077
export GAUSS_ENV=2
export GS_CLUSTER_NAME=singlenode



```
（4）交互式安装
首先是预安装：

```
cd /opt/software/openGauss/script
python3 gs_preinstall -U omm -G dbgrp -X 
/opt/software/openGauss/cluster_config_template.xml 



```
正常的话，会出现如下信息：
_Parsing the configuration file.
Successfully parsed the configuration file.
Installing the tools on the local node.
Successfully installed the tools on the local node.
Setting pssh path
Successfully set core path.
Are you sure you want to create the user[omm] and create trust for it (yes)? yes
Preparing SSH service.
Successfully prepared SSH service.
Checking OS software.
Successfully check os software.
Checking OS version.
Successfully checked OS version.
Creating cluster's path.
Successfully created cluster's path.
Setting SCTP service.
Successfully set SCTP service.
Set and check OS parameter.
Setting OS parameters.
Successfully set OS parameters.
Warning: Installation environment contains some warning messages.
Please get more details by "/opt/software/openGauss/script/gs_checkos -i A -h node1 --detail".
Set and check OS parameter completed.
Preparing CRON service.
Successfully prepared CRON service.
Setting user environmental variables.
Successfully set user environmental variables.
Setting the dynamic link library.
Successfully set the dynamic link library.
Setting Core file
Successfully set core path.
Setting pssh path
Successfully set pssh path.
Set ARM Optimization.
No need to set ARM Optimization.
Fixing server package owner.
Setting finish flag.
Successfully set finish flag.
Preinstallation succeeded.

到这里说明预安装完成。

然后是正式安装：

```
 cd script/
 gs_install -X /opt/software/openGauss/cluster_config_template.xml 



```
正常的话会出现如下信息：
Parsing the configuration file.
Check preinstall on every node.
Successfully checked preinstall on every node.
Creating the backup directory.
Successfully created the backup directory.
begin deploy..
Installing the cluster.
begin prepare Install Cluster..
Checking the installation environment on all nodes.
begin install Cluster..
Installing applications on all nodes.
Successfully installed APP.
begin init Instance..
encrypt cipher and rand files for database.
Please enter password for database:
Please repeat for database:
begin to create CA cert files
The sslcert will be generated in /opt/huawei/install/app/sslcert/om
Cluster installation is completed.
Configuring.
Deleting instances from all nodes.
Successfully deleted instances from all nodes.
Checking node configuration on all nodes.
Initializing instances on all nodes.
Updating instance configuration on all nodes.
Check consistence of memCheck and coresCheck on database nodes.
Configuring pg_hba on all nodes.
Configuration is completed.
Successfully started cluster.
Successfully installed application.
end deploy.

输入
```
gsql -d postgres -p 26000


```
使数据库在本地运行，没有出现报错信息即说明安装成功。


3．连接设置
（1）安装jdk1.8
（2）下载好jdbc压缩包后，解压至：

```
/usr/lib/jvm/java-1.8.0-openjdk-1.8.0.302.b08-0.el7_9.x86_64/jre/lib/ext


```
（3）登陆到omm用户上，然后登录数据库主节点，执行如下指令：
NodeName为当前节点名称，还要注意localhost改成对应的。

```
gs_guc reload -N node1-I all -c "listen_addresses='localhost,192.168.2.131’”


```
（4）执行下列指令，在数据库主节点配置文件中增加一条规则：

```
gs_guc reload -N all -I all -h "host all user 192.168.17.129/32 sha256"


```
（5）然后通过java程序就可以链接了。

```java
import java.sql.*;
public class java_connect_opengauss{
    public static Connection getConnect(String username, String passwd){
        String driver = "org.postgresql.Driver";
        String sourceURL = "jdbc:postgresql://127.0.0.1:26000/postgres";
        Connection conn = null;
        try{
            Class.forName(driver);
        }
        catch( Exception e ){
            e.printStackTrace();
            return null;
        }
        
        try{
            conn = DriverManager.getConnection(sourceURL, username, passwd);
            System.out.println("Connection succeed!");
        }
        catch(Exception e)
        {
            e.printStackTrace();
            return null;
        }
        
        return conn;
    };
    public static void main(String[] args) {
        //输入数据库的用户名和密码
        Connection conn = getConnect("username", "password");
        try {
            conn.close();  
        } catch (SQLException e) {    
            e.printStackTrace();  
        }
    }
}


```



```
Javac java_connect_opengauss.java
java java_connect_opengauss


```
然后会出出现Connection succeed! 
即代表连接成功
