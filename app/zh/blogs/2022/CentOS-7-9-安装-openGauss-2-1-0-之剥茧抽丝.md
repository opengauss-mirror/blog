---
title: 'CentOS 7.9 安装 openGauss 2.1.0 之剥茧抽丝'

date: '2021-12-23'

category: 'blog'
tags: ['CentOS 7.9 安装 openGauss 2.1.0 之剥茧抽丝']

archives: '2021-12'

author: '问天的天问'

summary: 'CentOS 7.9 安装 openGauss 2.1.0 之剥茧抽丝'

img: '/zh/blogs/2022/title/img2.png'

times: '12:30'
---

# CentOS 7.9 安装 openGauss 2.1.0 之剥茧抽丝<a name="ZH-CN_TOPIC_0000001187373552"></a>

问天的天问 2021/12/23

本文是在参考官方的安装文档后，提取总结出的关键安装步骤。

## \[1\] 基础环境安装<a name="section1894925119522"></a>

```
# timedatectl set-timezone Asia/Shanghai
# hostnamectl set-hostname gauss01

# nmcli con mod enp0s3 ipv4.method manual ipv4.address 192.168.2.131/24
# nmcli con mod enp0s3 ipv4.gateway 192.168.2.1
# nmcli con mod enp0s3 ipv4.dns 192.168.1.1
# nmcli con mod enp0s3 connection.autoconnect yes
```

## \[2\] Disable SElinux<a name="section184611422536"></a>

```
# sed -i 's@\(^SELINUX=\).*@\1disabled@g' /etc/selinux/config
```

## \[3\] Disable Firewall<a name="section8744614195312"></a>

```
# systemctl disable firewalld
```

## \[4\] Disable Transparent HugePages<a name="section13132328165318"></a>

```
# sed -i '/linux16.*$/s//& transparent_hugepage=never/g' /boot/grub2/grub.cfg

Reboot and Confirm
# cat /sys/kernel/mm/transparent_hugepage/enabled
always madvise [never]
```

## \[5\] 文件句柄设置<a name="section1419943913533"></a>

```
# cat >> /etc/security/limits.conf << EOF

*`echo -e "\t"`soft`echo -e "\t"`nofile`echo -e "\t"`1000000
*`echo -e "\t"`hard`echo -e "\t"`nofile`echo -e "\t"`1000000
EOF

```

## \[6\] 网卡设置<a name="section12207124812535"></a>

在网卡配置文件中最后一行添加 MTU=8192

```
# cat /etc/sysconfig/network-scripts/ifcfg-enp0s3
……
MTU=8192
```

## \[7\] 修改默认版本号<a name="section57265115543"></a>

```
# cat /etc/redhat-release
CentOS Linux release 7.9.2009 (Core)
修改为
CentOS Linux release 7.6.1810 (Core)
```

## \[8\] 系统参数<a name="section11893181025420"></a>

在内核方面，官方给出的建议值基本上与系统 CentOS 7.9 的默认值相同，不相同的只有 4 项，如下：

- net.ipv4.tcp_retries1
- net.ipv4.tcp_syn_retries
- net.ipv4.ip_local_port_range
- vm.overcommit_ratio

根据实际情况判定是否需要修改。

## \[9\] 安装 python<a name="section1791862211547"></a>

```
# yum install -y python36
```

## \[10\] 安装软件包<a name="section161190465547"></a>

官方建议软件包

```
# yum install -y libaio-devel flex bison ncurses-devel glibc-devel patch redhat-lsb readline-devel
```

个人建议软件包

```
# yum install -y bzip2 net-tools lrzsz
```

## \[11\] 关闭 RemoveIPC<a name="section12648124115519"></a>

CentOS 默认关闭，无需要配置。

## \[12\] 创建组和用户<a name="section1649415436523"></a>

组和用户都可以不用提前创建，在安装时会自动创建。

## \[13\] 解压安装包<a name="section96612377521"></a>

```
# mkdir -p /opt/software/openGauss
# chmod 755 -R /opt/software
# cd /opt/software/openGauss

上传源码 openGauss-2.1.0-CentOS-64bit-all.tar.gz 并解压
# tar -zxvf openGauss-2.1.0-CentOS-64bit-all.tar.gz
# tar -zxvf openGauss-2.1.0-CentOS-64bit-om.tar.gz
```

## \[14\] 编辑配置脚本<a name="section17911102415556"></a>

```
# cp script/gspylib/etc/conf/cluster_config_template.xml cluster_config.xml
# vi /opt/software/openGauss/cluster_config.xml
<?xml version="1.0" encoding="utf-8"?>
<ROOT>
<CLUSTER>
<PARAM name="clusterName" value="dbCluster" />
<PARAM name="nodeNames" value="gauss01"/>
<PARAM name="gaussdbAppPath" value="/opt/huawei/install/app" />
<PARAM name="gaussdbLogPath" value="/var/log/omm" />
<PARAM name="tmpMppdbPath" value="/opt/huawei/tmp"/>
<PARAM name="gaussdbToolPath" value="/opt/huawei/install/om" />
<PARAM name="corePath" value="/opt/huawei/corefile"/>
<PARAM name="backIp1s" value="192.168.1.171"/>
</CLUSTER>

<DEVICELIST>
<DEVICE sn="node1_hostname">
<PARAM name="name" value="gauss01"/>
<PARAM name="azName" value="AZ1"/>
<PARAM name="azPriority" value="1"/>
<PARAM name="backIp1" value="192.168.1.171"/>
<PARAM name="sshIp1" value="192.168.1.171"/>
<!-- dn -->
<PARAM name="dataNum" value="1"/>
<PARAM name="dataPortBase" value="15400"/>
<PARAM name="dataNode1" value="/opt/huawei/install/data/dn1"/>
<PARAM name="dataNode1_syncNum" value="0"/>
</DEVICE>

</DEVICELIST>
</ROOT>
```

根据实际情况进行相应修改。

## \[15\] 执行安装和初始化<a name="section7733152845219"></a>

以 root 用户安装，安装脚本自行创建 dbgrp 组和 omm 用户

```
# cd script
# python3 gs_preinstall -U omm -G dbgrp -X /opt/software/openGauss/cluster_config.xml
```

以 omm 用户初始化数据库

```
# chown -R omm:dbgrp /opt/software/openGauss
# su - omm
$ gs_install -X /opt/software/openGauss/cluster_config.xml
```

初始化成功后连接数据库

```
$ gsql -d postgres -p 15400
gsql ((openGauss 2.1.0 build 590b0f8e) compiled at 2021-09-30 14:29:04 commit 0 last mr )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=#
```

其中，postgres 为需要连接的数据库名称，15400 为数据库节点的端口号，即 cluster_config.xml 配置文件中的 dataPortBase 的值。

## \[16\] 卸载 openGauss<a name="section534318204529"></a>

```
# su - omm
$ gs_uninstall --delete-data
命令卸载并不全面，还需要手工删除，也可不经命令卸载直接手工删除。
# userdel -r omm
# groupdel dbgrp
# rm -rf /opt/software /opt/huawei
# rm -rf /var/log/omm
```
