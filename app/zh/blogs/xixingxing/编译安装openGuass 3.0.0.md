---
title: '编译安装openGauss 3.0.0'
date: '2022-05-16'
category: 'blog'
tags: ['编译安装openGauss 3.0.0']
archives: '2022-05'
author: 'xixingxing'
summary: '编译安装openGauss 3.0.0'
img: '/zh/blogs/xixingxing/title/title.jpg'
times: '17:30'
---

## 编译安装 openGauss 3.0.0

### 1. 环境检查

#### 1.1 检查 OS 版本

```c
openGauss支持的操作系统：

CentOS 7.6（x86 架构）
openEuler-20.03-LTS（aarch64 架构）
openEuler-20.03-LTS（x86 架构）
Kylin-V10（aarch64 架构）
```

```
[root@og3 ~]# cat /etc/redhat-release
CentOS Linux release 7.6.1810 (Core)
```

#### 1.2 修改主机名及/etc/hosts

```
hostnamectl set-hostname og
cat>>/etc/hosts<<EOF
192.168.137.129 og
EOF
```

1.3. 检查防火墙和 selinux
在 RHEL 7 中，防火墙 firewalld 取代了 iptables

```shell
systemctl status firewalld
systemctl stop firewalld
systemctl disable firewalld
systemctl is-enabled firewalld
/bin/sed -i s/SELINUX=enforcing/SELINUX=disabled/ /etc/selinux/config
cat /etc/selinux/config|grep SELINUX=
setenforce 0
```

#### 1.3 配置 yum 源并安装依赖包

上传操作系统 iso 到/soft 目录

```
[root@og3 ~]# mkdir -p /soft
[root@og3 ~]# cd /soft
[root@og3 soft]# ls -ltr
total 4481024
-rw-r--r--. 1 root root 4588568576 Apr 8 2019 CentOS-7-x86_64-DVD-1810.iso

cd /soft
mv CentOS-7-x86_64-DVD-1810.iso yum.iso
mount -o loop /soft/yum.iso /mnt
mkdir -p /etc/yum.repos.d/bak/
mv /etc/yum.repos.d/\*.repo /etc/yum.repos.d/bak/
cat>>/etc/yum.repos.d/rhel-source.repo <<EOF
[rhel-oracle-lib]
name=oracle
baseurl=file:///mnt
enabled=1
gpgcheck=0
EOF
yum clean all
yum makecache
yum list

yum -y install libaio-devel flex bison ncurses-devel glibc-devel patch redhat-lsb readline-devel unzip dos2unix vim git wget lrzsz net-tools bzip2 gcc tree zlib\*
```

#### 1.4 设置字符集参数

```
cat>>/etc/profile<<EOF
export LANG=zh_CN.UTF-8
EOF
```

#### 1.5 设置时区和时间

```
[root@og ~]# timedatectl set-timezone Asia/Shanghai
[root@og ~]# timedatectl status
```

使用 date -s 命令将各主机的时间设置为统一时间，举例如下。

`date -s "Sat Sep 27 16:00:07 CST 2020"`

#### 1.6 关闭 HISTORY 记录

```
cat>>/etc/profile<<EOF
HISTSIZE=0
EOF
```

2、安装 Python3 官方
建议安装 Python3.6

```
cd /soft/
wget -c https://www.python.org/ftp/python/3.6.5/Python-3.6.5.tgz
mkdir -p /usr/local/python3.6.5
tar -zxvf Python-3.6.5.tgz
cd Python-3.6.5
./configure --prefix=/usr/local/python3.6.5 --enable-shared CFLAGS=-fPIC && make && make install
rm -f /usr/bin/python
ln -s /usr/local/python3.6.5/bin/python3 /usr/bin/python
ln -s /usr/local/python3.6.5/bin/python3 /usr/bin/python3
ln -s /usr/local/python3.6.5/bin/pip3 /usr/bin/pip3

cp /usr/local/python3.6.5/lib/libpython3.6m.so.1.0 /usr/lib64/
python -V
```

### 3. 下载软件包

```
cd /soft/
git clone https://gitee.com/opengauss/openGauss-server.git openGauss-server -b 3.0.0
git clone https://gitee.com/opengauss/openGauss-OM.git
wget -c https://opengauss.obs.cn-south-1.myhuaweicloud.com/3.0.0/openGauss-third_party_binarylibs.tar.gz
```

### 4. 一键式脚本编译

```
tar -xf openGauss-third_party_binarylibs.tar.gz
mv openGauss-third_party_binarylibs binarylibs

cd openGauss-server/
sh build.sh -m debug -3rd /soft/binarylibs -pkg
```

显示如下内容，表示编译成功。

```c
success!

生成的安装包会存放在./output目录下。
编译和打包日志为：./build/script/makemppdb_pkg.log。

```

### 4. openGauss-OM 编译

```
cd /soft/openGauss-OM
chmod +x build.sh
export BINARYLIBS_PATH=/soft/binarylibs (这里填写前面的第三方软件包解压后的目录)
./build.sh -3rd $BINARYLIBS_PATH
```

显示以下内容，表示 Gauss-OM 编译成功：

```c
ROOT_DIR: /soft/binarylibs
Everything is ready.
success!
```

### 5. 软件安装

#### 5.1 程序下载及解压

```
mkdir -p /opt/software/openGauss
mv /soft/openGauss-server/output/_ /opt/software/openGauss/
mv /soft/openGauss-OM/package/_ /opt/software/openGauss/
chmod 755 -R /opt/software
cd /opt/software/openGauss/

tar -jxf openGauss-3.0.0-CentOS-64bit.tar.bz2
tar -xf openGauss-3.0.0-CentOS-64bit-om.tar.gz
```

#### 5.2 创建用户

```
groupadd dbgrp
useradd omm -g dbgrp
echo "Root_1234"|passwd --stdin omm
```

#### 5.3 生成配置文件

`cat >> /opt/software/openGauss/cluster_config.xml <<-EOF`

```html
<?xml version="1.0" encoding="UTF-8"?>
<ROOT>
  <!-- openGauss整体信息 -->
  <CLUSTER>
    <!-- 数据库名称 -->
    <param name="clusterName" value="dbCluster" />
    <!-- 数据库节点名称(hostname) -->
    <param name="nodeNames" value="`hostname`" />
    <!-- 数据库安装目录-->
    <param name="gaussdbAppPath" value="/opt/huawei/install/app" />
    <!-- 日志目录-->
    <param name="gaussdbLogPath" value="/var/log/omm" />
    <!-- 临时文件目录-->
    <param name="tmpMppdbPath" value="/opt/huawei/tmp" />
    <!-- 数据库工具目录-->
    <param name="gaussdbToolPath" value="/opt/huawei/install/om" />
    <!-- 数据库core文件目录-->
    <param name="corePath" value="/opt/huawei/corefile" />
    <!-- 节点IP，与数据库节点名称列表一一对应 -->
    <param
      name="backIp1s"
      value="`cat /etc/hosts|grep \`hostname\`|awk '{print $1}'|head -1`"
    />
  </CLUSTER>
  <!-- 每台服务器上的节点部署信息 -->
  <DEVICELIST>
    <!-- 节点1上的部署信息 -->
    <DEVICE sn="node1_hostname">
      <!-- 节点1的主机名称 -->
      <param name="name" value="`hostname`" />
      <!-- 节点1所在的AZ及AZ优先级 -->
      <param name="azName" value="AZ1" />
      <param name="azPriority" value="1" />
      <!-- 节点1的IP，如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
      <param
        name="backIp1"
        value="`cat /etc/hosts|grep \`hostname\`|awk '{print $1}'|head -1`"
      />
      <param
        name="sshIp1"
        value="`cat /etc/hosts|grep \`hostname\`|awk '{print $1}'|head -1`"
      />

      <!--dbnode-->
      <param name="dataNum" value="1" />
      <param name="dataPortBase" value="15400" />
      <param name="dataNode1" value="/opt/huawei/install/data/dn" />
      <param name="dataNode1_syncNum" value="0" />
    </DEVICE>
  </DEVICELIST>
</ROOT>
```

EOF

#### 5.4 初始化安装环境

```
cd /opt/software/openGauss/script
./gs_preinstall -U omm -G dbgrp -L -X /opt/software/openGauss/cluster_config.xml
```

### 6. 执行安装

```
su - omm
gs_install -X /opt/software/openGauss/cluster_config.xml
```

### 7. 初始化数据库

```
[root@og openGauss]# su - omm
Last login: Mon May 9 19:28:07 CST 2022 on pts/1
```

#### 7.1 检查数据库状态

`[omm@og ~]$ gs_om -t status`

```shell
执行如下命令检查数据库状态是否正常，“cluster_state ”显示“Normal”表示数据库可正常使用。
```

```
[omm@og ~]$ gsql -d postgres -p 15400
openGauss=# CREATE DATABASE mydb WITH ENCODING 'GBK' template = template0;
CREATE DATABASE
openGauss=#
```
