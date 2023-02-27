---
title: 'openGauss资源池化开发者入门指南(一)'
date: '2023-01-12'
category: 'blog'
tags: ['openGauss使用增强']
archives: '2023-01'
author: 'cchen676'
summary: 'openGauss资源池化开发者入门指南'
img: '/zh/post/cchen676/title/img26.png'
times: '16:30'
---
# openGauss资源池化开发者入门指南(一)

### 一、内容简介

openGauss 资源池化是 openGauss 推出的一种新型的集群架构.通过 DMS 和 DSS 组件,实现集群中多个节点的底层存储数据共享和节点间的内存实时共享

达到节省底层存储资源以及集群内部支持一写多读且可以实时一致性读的目的.

本系列的主旨在于帮助对资源池化开发感兴趣的开发者快速入门

以及提供一些对开发有帮助的经验总结

### 二、预备知识

开发者最好具备以下基础:

1. Linux 的基础命令，比如 dd 命令，iscis 等
2. 对磁阵有一定的了解
3. 对传统的 openGauss 编译方式十分熟悉

### 二、安装指南

1. 资源池化架构参考:
   ![图1](./title/dms1.jpg '图1')
2. 在社区正式发布的版本中, 如果需要搭建资源池化架构, 硬件上需要准备磁阵, 服务器和光交换机.
3. 在社区正式发布的版本中, CM 和 OM 是必选的组件
4. 因为使用 OM 的安装过程和传统的基本一致, 即先执行 gs_preinstall 然后执行 gs_install, 通过 xml 中的配置项控制是否开启 dss 和 dms. 所以在资料中只是对 xml 内容进行了修改和说明, 对其他内容没有详细的说明, 这里对 xml 的内容中进行一些补充性的说明

| 选项                 | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| enable_dss           | 共享存储模式开关，取值范围 on/off，默认为 off，共享存储不支持 dcf 模式. 开启后, 表示数据文件/xlog 文件/双写/pg_clog/pg_csnlog/pg_multixact 会写入到底层的共享存储中                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| dss_home             | dss 实例目录，enable_dss 为 on 时必选。dsssever 启动时需要的存放 dss 配置项以及 dssserver 的运行日志等相关必须文件的目录, 在 OS 的文件系统中, 每个节点都会有一份                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ss_dss_vg_name       | dss 共享卷名，enable_dss 为 on 时必选. 这是个逻辑名称, 即 dssserver 使用的卷名, 可以命名为 data, data1, data2, mydata 均可, 配置后 dss 访问文件的路径即为 +data/base, +data/pg_xlog0 这种                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| dss_vg_info          | dss 挂载卷组信息，包含一个共享卷组，其余为日志卷组，日志卷组的数量和 dn 的数量保持一致，集中式每个节点最多有一个 dn。卷组形如“data:/dev/sdb”，卷组和卷组之间以“，”隔开，enable_dss 为 on 时必选。日志卷组磁盘大小需要大于 dn 参数 max_size_for_xlog_prune 的值. 这里说明一下这个格式"data:/dev/sdb" , data 表示数据的卷名, 和上一个 ss_dss_vg_name 的配置一致, /dev/sdb 表示 OS 中可识别的设备名称, 即对应磁阵映射到 OS 中的 LUN 显示的设备名称, 实际使用中也可以用自己做的软链接, 链接到实际的设备名称上, 方便识别, 比如 "data:/dev/forcitest", /dev/forcitest 实际是一个指向/dev/sdb 的软链接, 这种也是可以的. 依此类推理解 p0:/dev/sde, p0 就是节点 1 的 xlog 存放的卷名, /dev/sde 就是块设备名称. 一套集群中只有一个 data 卷, 然后每个节点都有一个 xlog 卷, 即 p0, p1, p2 等, 对应节点 0,1,2 的 xlog 卷. data 卷和 xlog 卷的大小均建议最少 1TB 起步 |
| votingDiskPath       | cm 的投票卷，enable_dss 为 on 时必选。 给 CM 用的, 没有特别需要注意的, 大小可以不用太大                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| shareDiskDir         | cm 的共享卷，enable_dss 为 on 时必选。给 CM 用的, 没有特别需要注意的, 大小可以不用太大                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ss_interconnect_type | mes 通信协议类型，默认值 TCP，取值范围 TCP/RDMA，默认为 TCP。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ss_rdma_work_config  | rdma 用户态 poll 占用起止 cpu，ss_interconnect_type 为 RDMA 时有效，形如"10 15"，中间以空格分隔。RDMA 和 TCP 是二选一的, RDMA 需要网卡和交换机层面支持                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

对于安装环境的准备, 除了传统的 openGauss 中需要准备的内容之外, 需要注意的就是要提前配置好磁阵对应的 LUN, 不同厂商的磁阵可能有一些不同的配置方式, 按照自己的需求选择是否配置多路径(openEuler 20.03 目前只支持 linux 自带的 multipath 服务)等, 如果配置了多路径,上面的/dev/sdx 注意配成多路径映射后的名字

### 三、提供一个简易的一键式安装脚本

下面提供一个可以一键式安装的 shell 脚本, 可以满足快速部署环境的需求

- 脚本主要分为 2 个
- 一个 om_pssh.sh 主要用于实现 ssh 时自动输入密码
- 一个 om_install.sh 主要用于实现自动安装
- 需要准备好的是一个集成了 om, cm 和数据库的安装包 (一般 release 的包会包含) , 如果没有的话, 可能需要自己做包, 在编译时带上-pkg 选项, 分别做出来 openGauss, OM 和 CM 的包,再放到一起压缩成集成的安装包
- 注意, 下面的脚本中以所有需要输入的密码都是"Password"为例
- 以下脚本请勿使用于生产环境
- 以下为纯手敲, 博主已经尽力了.
- 如使用中有错误, 建议自行定制修改

1. 先是 om_pssh.sh

```shell
#!/bin/bash

function auto_() {
	expect <<-EOF
		spawn $*
		set timeout -1
		expect {
			"yes/no" { send "yes\n"; exp_continue }
			"denied" { exit 1; }
			"*assword" { send "Password\n"; exp_continue }
			"anger*\n*yes*" { send "yes\n"; exp_continue }
			"Pdb" { interact }
			"pass phrase for*:" { send "Password\n"; exp_continue }
			"passphrase" { send "Password\n"; exp_continue }
			"database:" { send "Password\n"; exp_continue }
		}
EOF
}

auto_ $*
```

2. 再是 om_install.sh

```shell
#!/bin/sh

#节点ip, 以空格分割
IPS="1.2.3.4 1.2.3.5 1.2.3.6"
#安装用户名
user=omm
#存放分发安装包的路径, 要独用, 不能为根目录
om_path=/data/omm
#xml文件路径,xml需要保证配置正确
xlm_file=/data/install/1p2s.xml
cur_path=$(pwd)

if [ -z ${om_path} ] || [ ${om_path} == '/' ]; then
	echo "om_path can not be NULL and '/', please input valid parameter"
	exit 0;
fi

echo "=============================start om install now========================"

all_node_ssh_proc()
{
	for ip in IPS
	do
		sh ${cur_path}/om_pssh.sh ssh root@$ip $*
	done
}

clean_env()
{
	all_node_ssh_proc sudo pkill -9 -u ${user}
	all_node_ssh_proc sudo rm -rf ${om_path}/${user}
	all_node_ssh_proc sudo pkill -9 -u ${user}
	all_node_ssh_proc sudo cp /etc/usr_bashrc /home/${user}/.bashrc
	all_node_ssh_proc "su - ${user} -c 'ipcrm -a'"
	all_node_ssh_proc sudo rm -f ${om_path}/gauss_pack/script/ENVFILE
}

get_tar()
{
	all_node_ssh_proc sudo rm -rf ${om_path}/*
	if [! -d ${om_path}/gauss_pack ]; then
		mkdir -p ${om_path}/gauss_pack
	fi
	cd ${om_path}
	#这里自行替换成安装包的路径
	cp /home/pkg/openGauss-XXX.tar.gz .
	cd ${om_path}/gauss_pack
	rm -rf *
	#这里自行替换成安装包的名称
	tar -zxvf ../openGauss-XXX.tar.gz
	#这里自行替换成安装包中om包的名称
	tar -zxvf openGauss-3.0.0-openEuler-64bit-om.tar.gz
	#这里自行替换成安装包中cm包的名称
	tar -zxvf openGauss-3.0.0-openEuler-64bit-cm.tar.gz
	chmod 777 -R ${om_path}
	cp ${cur_path}/om_pssh.sh ${om_path}/
	chmod 777 -R ${om_path}
}

pre_install()
{
	chmod 777 -R ${om_path}
	cd ${om_path}/gauss_pack/script/
	${om_path}/om_pssh.sh ./gs_preinstall -U ${user} -G ${user} --sep-env-file=${om_path}/gauss_pack/script/ENVFILE -X ${xml_file}
	source ${om_path}/gauss_pack/script/ENVFILE
	chmod 777 -R ${om_path}
}

om_install()
{
	all_node_ssh_proc chmod 777 -R ${om_path}
	su - ${user}<<EOF
		cd ${om_path}/gauss_pack/script/
		source ${om_path}/gauss_pack/script/ENVFILE
		${om_path}/om_pssh.sh gs_install -X ${xml_file} --time-out=3600
		source ${om_path}/gauss_pack/script/ENVFILE
		cm_ctl query -Cvdip
EOF
}

function main() {
	echo "============================om install==========================="
	clean_env
	get_tar
	pre_install
	om_install
}

main
```

使用方法;

1. 把 om_pssh.sh 和 om_install.sh 放到一个目录下, 准备好 xml, 安装包, 用户名, 密码等之后
2. 执行 sh om_install.sh 即可, 都运行正常的话, 只需要等着就能安装成功
