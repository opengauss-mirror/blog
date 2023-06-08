+++
title = "资源池化支持同城dorado双集群部署(三)----磁阵搭建"
date = "2023-05-18"
tags = ["资源池化支持同城dorado双集群部署(三)----磁阵搭建"]
archives = "2023-05-18"
author = "shirley_zhengx"
summary = "资源池化支持同城dorado双集群部署(三)----磁阵搭建"
img = "/zh/post/zhengxue/title/img1.png"
times = "9:30"
+++


<!-- TOC -->
- [1. 环境描述](#1.环境描述)
  - [1.1.组网方式](#1.1.组网方式)
  - [1.2.环境配置](#1.2.环境配置)
- [2. 环境搭建](#2.环境搭建)
  - [2.1.创建lun](#2.1.创建lun)
  - [2.2.下载源码编译](#2.2.下载源码编译)
  - [2.3.环境变量](#2.3.环境变量) 
  - [2.4.dss配置-磁阵搭建](#2.4.dss配置-磁阵搭建)
  - [2.5.数据库部署](#2.5.数据库部署)

<!-- /TOC -->



# 资源池化支持同城dorado双集群部署(三)----磁阵搭建

资源池化支持同城dorado双集群部署方式：
(一) dd模拟(手动部署 + 无cm)
(二) cm模拟(手动部署dd模拟 + 有cm)
(三) 磁阵搭建(手动部署)
(四) 集群管理工具部署(om + cm)
          

## 1.环境描述

    针对磁阵搭建(手动部署)作出指导，环境描述如下：

### &nbsp;&nbsp;1.1.组网方式
<table>
<tbody>
    <tr>
        <td rowspan='2'>生产中心</td>
        <td rowspan='2'>主端</td>
        <td>业务计算节点0</td>
        <td rowspan='2'>主存储节点</td>
        <td rowspan='2'>Dorado</td>
    </tr>
        <td>业务计算节点1</td>
    <tr>
        <td rowspan='2'>容灾中心</td>
        <td rowspan='2'>备端</td>
        <td>业务计算节点0</td>
        <td rowspan='2'>备存储节点</td>
        <td rowspan='2'>Dorado</td>
    </tr>
        <td>业务计算节点1</td>
</tbody>
</table>

&emsp;** 缺个图，后面补充哈！！！**
### &nbsp;&nbsp;1.2.环境配置

&emsp;支持存储远程复制


## 2. 环境搭建

针对资源池化双集群部署之《资源池化磁阵搭建(手动部署) + dorado同步复制》作出指导，无cm部署，环境搭建如下：

### &nbsp;&nbsp;2.1.创建lun

(1) 主存储创建lun组和lun
&emsp;主存储管控平台(DeviceManager)登录：https://主存储ip:8088
&emsp;在管控平台上创建lun组和lun，并映射到主机之后，在业务节点上查看挂好的lun
(1.1)创建主机
(1.2)创建lun组
(1.3)创建lun
如下图所示:
![](../images/磁阵搭建/创建lun.jpg)
步骤：Services -> LUN Groups -> LUN -> Create

(2) 主存储对应的业务计算节点上查看挂好的lun
```
rescan-scsi-bus.sh       upadmin show vlun         lsscsi -is
```

![](../images/磁阵搭建/lun查询.jpg)

lun说明：  zx_mpp_doradoxlog 指dorado同步复制需要的lun(可以理解为共享盘，盘符/dev/sdh)，zx_mpp_dssdata是资源池化主集群的数据盘(盘符/dev/sdn)，zx_mpp_dssxlog0是资源池化主集群节点0对应的xlog盘(盘符/dev/sdo)

修改盘符属组
```
chown mpp:mpp /dev/sdh
chown mpp:mpp /dev/sdn
chown mpp:mpp /dev/sdo
```

### &nbsp;&nbsp;2.2.下载源码编译
&emsp;如果用已打包好的openGauss-server包则跳过该步骤，进行2.3，如果修改代码开发中，则进行代码更新并编译，如下步骤：

(1) 下载三方库
&emsp;根据平台操作系统下载对应三方库，三方库下载地址：https://gitee.com/opengauss/openGauss-server 主页上README.md中查找需要的三方库binarylibs

获取master分支openEuler_x86系统对应的三方库
```
wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/latest/binarylibs/openGauss-third_party_binarylibs_openEuler_x86_64.tar.gz
```
(2) 下载cbb并编译
```
git clone https://gitee.com/opengauss/CBB.git -b master cbb
cd CBB/build/linux/opengauss
sh build.sh -3rd $binarylibsDir -m Debug
```
&emsp;编译成功会自动将二进制放入三方库openGauss-third_party_binarylibs_openEuler_x86_64/kernel/component目录下
(3) 下载dss并编译
```
git clone https://gitee.com/opengauss/DSS.git -b master dss
cd CBB/build/linux/opengaussDSS
sh build.sh -m Debug -3rd $binarylibsDir
```

(4) 下载dms并编译
```
git clone https://gitee.com/opengauss/DMS.git -b master dms
cd CBB/build/linux/opengauss
sh build.sh -m Debug -3rd $binarylibsDir
```

(5) 下载openGauss-server并编译
&emsp;编译过程需要cbb、dss、dms的二进制，会从openGauss-third_party_binarylibs_openEuler_x86_64/kernel/component中获取
```
git clone https://gitee.com/opengauss/openGauss-server.git -b master openGauss-server
sh build.sh -3rd $binarylibsDir -m Debug
```
&emsp;编译完之后的二进制存放在openGauss-server/mppdb_temp_install/目录下


### &nbsp;&nbsp;2.3.环境准备
由于机器资源不足，这里以一个业务计算服务器上部署一主为例
(1) 二进制准备
创建一个自己用户的目录，例如/opt/mpp，将已编好的openGauss-server/mppdb_temp_install/拷贝放至/opt/mpp目录下，即/opt/mpp/mppdb_temp_install
(2) 提权
sudo setcap CAP_SYS_RAWIO+ep /opt/mpp/mppdb_temp_install/bin/perctrl
(3) 主集群主节点对应的环境变量ss_env0

```
export HOME=/opt/mpp
export GAUSSHOME=${HOME}/mppdb_temp_install/
export GAUSSLOG=${HOME}/cluster/gausslog0
export SS_DATA=${HOME}/cluster/ss_data
export DSS_HOME=${HOME}/cluster/ss_data/dss_home0
export LD_LIBRARY_PATH=$GAUSSHOME/lib:$LD_LIBRARY_PATH
export PATH=$GAUSSHOME/bin:$PATH
```
`Tips`: 环境变量里面一定要写export，即使`echo $GCC_PATH`存在，也要写export才能真正导入路径

参数说明：
HOME 为用户自己创建的工作目录；
GAUSSHOME 为编译完成的目标文件路径，包含openGauss的bin、lib等；
GAUSSLOG 为运行时的日志目录，包含dss、dms等日志
SS_DATA 为共享存储的根目录，即dss相关配置的根目录
DSS_HOME 为dssserver配置对应的目录


### &nbsp;&nbsp;2.4.dss配置-磁阵搭建
配置脚本dss_autoscript.sh如下：

dss_autoscript.sh
```
#!/bin/bash

source /opt/mpp/ss_env0

DSS_HOME_ONE=${SS_DATA}/dss_home0
# 如果部署一个节点，则删除DSS_HOME_TWO
DSS_HOME_TWO=${SS_DATA}/dss_home1

function clean_dir()
{
    ps ux | grep 'dssserver -D /opt/mpp/cluster/ss_data/dss_home0' | grep -v grep | awk '{print $2}' | xargs kill -9
    ps ux | grep 'dssserver -D /opt/mpp/cluster/ss_data/dss_home1' | grep -v grep | awk '{print $2}' | xargs kill -9
    rm -rf ${SS_DATA}
}

function create_one_device()
{
    mkdir -p ${SS_DATA}
    mkdir -p ${DSS_HOME_ONE}
    mkdir -p ${DSS_HOME_ONE}/cfg
    mkdir -p ${DSS_HOME_ONE}/log
    echo "data:/dev/sdn" > ${DSS_HOME_ONE}/cfg/dss_vg_conf.ini
    echo "log0:/dev/sdo" >> ${DSS_HOME_ONE}/cfg/dss_vg_conf.ini
    # 如果部署一个节点，则删除log1这一行
    echo "log1:/dev/sdz" >> ${DSS_HOME_ONE}/cfg/dss_vg_conf.ini 
    echo "INST_ID = 0" > ${DSS_HOME_ONE}/cfg/dss_inst.ini
    echo "_LOG_BACKUP_FILE_COUNT = 128" >> ${DSS_HOME_ONE}/cfg/dss_inst.ini
    echo "_LOG_MAX_FILE_SIZE = 20M" >> ${DSS_HOME_ONE}/cfg/dss_inst.ini
    echo "LSNR_PATH = ${DSS_HOME_ONE}" >> ${DSS_HOME_ONE}/cfg/dss_inst.ini
    echo "STORAGE_MODE = RAID" >> ${DSS_HOME_ONE}/cfg/dss_inst.ini
    echo "_SHM_KEY=42" >> ${DSS_HOME_ONE}/cfg/dss_inst.ini
    echo "_log_LEVEL = 255" >> ${DSS_HOME_ONE}/cfg/dss_inst.ini
}

# 如果部署一个节点，则不需要执行create_two_device
function create_two_device()
{
    mkdir -p ${DSS_HOME_TWO}
    mkdir -p ${DSS_HOME_TWO}/cfg
    mkdir -p ${DSS_HOME_TWO}/log
    echo "data:/dev/sdn" > ${DSS_HOME_TWO}/cfg/dss_vg_conf.ini
    echo "log0:/dev/sdo" >> ${DSS_HOME_TWO}/cfg/dss_vg_conf.ini
    echo "log1:/dev/sdz" >> ${DSS_HOME_TWO}/cfg/dss_vg_conf.ini
    echo "INST_ID = 1" > ${DSS_HOME_TWO}/cfg/dss_inst.ini
    echo "_LOG_BACKUP_FILE_COUNT = 128" >> ${DSS_HOME_TWO}/cfg/dss_inst.ini
    echo "_LOG_MAX_FILE_SIZE = 20M" >> ${DSS_HOME_TWO}/cfg/dss_inst.ini
    echo "LSNR_PATH = ${DSS_HOME_TWO}" >> ${DSS_HOME_TWO}/cfg/dss_inst.ini
    echo "STORAGE_MODE = RAID" >> ${DSS_HOME_TWO}/cfg/dss_inst.ini
    echo "_SHM_KEY=42" >> ${DSS_HOME_TWO}/cfg/dss_inst.ini
    echo "_log_LEVEL = 255" >> ${DSS_HOME_TWO}/cfg/dss_inst.ini
}

# 无论部署几个节点，都只在第一个节点执行一次create_vg
function create_vg()
{
    dd if=/dev/zero bs=2048 count=100000 of=/dev/sdn
    dd if=/dev/zero bs=2048 count=100000 of=/dev/sdo
    # 如果部署一个节点，则删除log1对应的盘符/dev/sdz这一行
    dd if=/dev/zero bs=2048 count=100000 of=/dev/sdz
    ${GAUSSHOME}/bin/dsscmd cv -g data -v /dev/sdn -s 2048 -D ${DSS_HOME_ONE}
    ${GAUSSHOME}/bin/dsscmd cv -g log0 -v /dev/sdo -s 65536 -D ${DSS_HOME_ONE}
    # 如果部署一个节点，则删除log1这一行
    ${GAUSSHOME}/bin/dsscmd cv -g log1 -v /dev/sdz -s 65536 -D ${DSS_HOME_ONE}
}

function start_dssserver()
{
    #dssserver -D /opt/mpp/cluster/ss_data/dss_home0/ &
    dssserver -D ${DSS_HOME_ONE} &
    if [ $? -ne 0 ]; then
        echo "dssserver startup failed."
        exit 1
    fi
    sleep 3
}

function gs_initdb_dn()
{
    rm -rf /opt/mpp/cluster/dn0/*
    gs_initdb -D /opt/mpp/cluster/dn0 --nodename=node0 -U mpp -w Huawei@123 --vgname=+data,+log0 --enable-dss --dms_url="0:172.16.108.23:4411" -I 0 --socketpath='UDS:/opt/mpp/cluster/ss_data/dss_home0/.dss_unix_d_socket' -d -n -g /dev/sdh
}


function assign_parameter()
{
    gs_guc set -Z datanode -D /opt/mpp/cluster/dn0 -c "port = 44100"
    gs_guc set -Z datanode -D /opt/mpp/cluster/dn0 -c "listen_addresses = '*'"
    gs_guc set -Z datanode -D /opt/mpp/cluster/dn0 -c "ss_enable_reform = off"
    gs_guc set -Z datanode -D /opt/mpp/cluster/dn0 -c "xlog_file_path = '/dev/sdh'"
    gs_guc set -Z datanode -D /opt/mpp/cluster/dn0 -c "xlog_lock_file_path = '/opt/mpp/cluster/shared_lock_primary.lock'"
    gs_guc set -Z datanode -D /opt/mpp/cluster/dn0 -c "application_name = 'dn_master_0'"
    gs_guc set -Z datanode -D /opt/mpp/cluster/dn0 -c "cross_cluster_replconninfo1='localhost=10.10.10.10 localport=25400 remotehost=20.20.20.10 remoteport=25400'"
    gs_guc set -Z datanode -D /opt/mpp/cluster/dn0 -c "cross_cluster_replconninfo2='localhost=10.10.10.10 localport=25400 remotehost=20.20.20.20 remoteport=25400'"
    gs_guc set -Z datanode -D /opt/mpp/cluster/dn0 -c "cluster_run_mode = 'cluster_primary'"
    gs_guc set -Z datanode -D /opt/mpp/cluster/dn0 -c "ha_module_debug = off"
    gs_guc set -Z datanode -D /opt/mpp/cluster/dn0 -c "ss_log_level = 255"
    gs_guc set -Z datanode -D /opt/mpp/cluster/dn0 -c "ss_log_backup_file_count = 100"
    gs_guc set -Z datanode -D /opt/mpp/cluster/dn0 -c "ss_log_max_file_size = 1GB"
    gs_guc set -Z datanode -D /opt/mpp/cluster/dn0 -h "host    all             all             172.16.108.54/32        trust"
    gs_guc set -Z datanode -D /opt/mpp/cluster/dn0 -h "host    all             all             172.16.108.55/32        trust"
}


if [ "$1" == "first_create" ]; then
    clean_dir
    create_one_device
    # 如果部署一个节点，则不需要执行create_two_device
    create_two_device
    create_vg
    start_dssserver
    #gs_initdb_dn
    #assign_parameter
else
    echo "you can create vg"
    create_vg
fi

```
&emsp;<font color='red'>@Notice Thing!@</font>：主集群都执行dss_autoscript.sh脚本配置dss, 用户需要自行修改脚本中的/opt/mpp/ss_env0环境变量、DSS_HOME_ONE 和 DSS_HOME_TWO目录，将其配置成自己的目录。还需要修改create_one_device和create_two_device中data和xlog对应的盘符

ps x 查看dss进程，如下
```
[mpp@nodename dn0]$ ps x
    PID TTY      STAT   TIME COMMAND
  69160 pts/2    S      0:00 -bash
  80294 pts/2    Sl     5:56 dssserver -D /opt/mpp/cluster/ss_data/dss_home0
  80309 pts/2    S      0:00 perctrl 8 11
 345361 pts/2    R+     0:00 ps x
```

### &nbsp;&nbsp;2.5 数据库部署
#### &nbsp;&nbsp;&nbsp;2.5.1 主集群(生产中心)
&emsp;(1) 主集群主节点0初始化
&emsp;<font color='blue'>@Precondition!@</font>：节点0对应的dssserver必须提前拉起，即dsserver进程存在

使用dss的data数据卷、log0日志卷、dorado共享卷/dev/sdh 初始化主集群节点0

```
gs_initdb -D /opt/mpp/cluster/dn0 --nodename=node0 -U mpp -w Huawei@123 --vgname=+data,+log0 --enable-dss --dms_url="0:10.10.10.10:4411,1:10.10.10.10:4412" -I 0 --socketpath='UDS:/opt/mpp/cluster/ss_data/dss_home0/.dss_unix_d_socket' -d -n -g /dev/sdh
```
&emsp;参数解释：
+ --vgname     卷名，做了xlog分盘，数据卷是+data，节点0对应的日志卷是+log0
+ --dms_url    0表示0节点，10:10:10:10指节点ip，4411是端口，这是一组参数，表示0节点的dms节点信息，如果是两节点，以逗号为分割，后面是节点1的dms节点信息，如果没有cm部署，两个节点ip可以不一样也可以一样，即可以在同一个机器上部署两个数据库，也可在不同机器上部署两个数据库，如果有cm部署，两个节点ip必须不一样。
+ -g 指dorado同步复制共享xlog盘

(2)配置主集群主节点0
&emsp;<font color='red'>postgresql.conf文件</font>
```
port = 44100
listen_addresses = '*'
ss_enable_reform = off
ss_log_level = 255
ss_log_backup_file_count = 100
ss_log_max_file_size = 1GB
xlog_lock_file_path = '/opt/mpp/cluster/dn0/redolog.lock'
```
&emsp;参数解释：
+ ss_enable_reform     dms reform功能，没有cm的情况下，设置该参数为off


(3)主集群备节点1初始化
```
gs_initdb -D /opt/mpp/cluster/dn1 --nodename=node1 -U mpp -w Huawei@123 --vgname=+data,+log1 --enable-dss --dms_url="0:10.10.10.10:4411,1:10.10.10.10:4412" -I 0 --socketpath='UDS:/opt/mpp/cluster/ss_data/dss_home1/.dss_unix_d_socket'
```

主集群备节点1配置参数
port = 48100
listen_addresses = '*'
ss_enable_reform = off
ss_log_level = 255
ss_log_backup_file_count = 100
ss_log_max_file_size = 1GB
xlog_lock_file_path = '/opt/mpp/cluster/dn0/redolog.lock'

(4)主集群启动
```
主节点0启动
gs_ctl start -D /opt/mpp/cluster/dn0 -M primary


备节点1启动
gs_ctl start -D /opt/mpp/cluster/dn0
```
&emsp;<font color='red'>@important point@:</font> 没有部署cm的情况下，以-M primary启动主集群主节点

ps x 查看进程，如下所示：
```
[mpp@nodename dn0]$ ps x
    PID TTY      STAT   TIME COMMAND
  69160 pts/2    S      0:00 -bash
  80294 pts/2    Sl     5:56 dssserver -D /opt/mpp/cluster/ss_data/dss_home0
  80309 pts/2    S      0:00 perctrl 8 11
 141835 ?        Ssl   18:48 /opt/mpp/mppdb_temp_install/bin/gaussdb -D /opt/mpp/cluster/dn0 -M primary
 345361 pts/2    R+     0:00 ps x
 ```


***Notice:不推荐直接用于生产环境***
***作者：Shirley_zhengx***
