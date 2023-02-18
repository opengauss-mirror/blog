+++
title = "openGauss共享存储对接Ceph-单机openGauss-Ceph"
date = "2023-02-18"
tags = ["共享存储", "Ceph"]
archives = "2023-02-18"
author = "zhangxb"
summary = "openGauss共享存储对接Ceph(单机openGauss + Ceph)"
img = "/zh/post/zhangxb/title/img.png"
times = "19:30"
+++

### openGauss + DSS + Ceph部署操作步骤

本文档介绍单机版openGauss+DSS+Ceph集群部署方式。后续提供主备下的步骤。

服务器：

| Hostname | IP | 系统 | 规格 |	磁盘 |
| ---- | ---- | ---- | ---- | ----| 
| Ceph1 | 192.168.0.2 |	openEuler20.03 x86_64 | 8核16GB | 2 * 100GB |
| Ceph2 | 192.168.0.3 |	openEuler20.03 x86_64 | 8核16GB	| 2 * 100GB |

![](../ddes/disk.png)
>- /dev/sdb 格式化为文件系统，用来部署数据库
>- /dev/sdc 按照块设备使用，提供给ceph部署OSD节点。

### 1. 部署Ceph

Ceph集群推荐服务端3台机器，客户端按需部署。我们这次部署单机版，ceph服务端用几台机器都可以，客户端也可以和服务端公用机器。

目前将这两台机器都部署上ceph。

#### (1) 每台节点都执行以下操作：

##### 关闭防火墙
```
systemctl stop firewalld
systemctl disable firewalld
systemctl status firewalld
```

##### 关闭selinux 
```
setenforce 0
```

##### 修改节点名称
```
# 建议修改节点名称。ceph集群服务端改为ceph1,ceph2,client节点改为client1,client2等
hostnamectl --static set-hostname ceph1
hostnamectl --static set-hostname ceph2
```

##### ntp配置
需要保证这几台服务器节点的时间同步。可以通过配置ntp保证时间同步。

##### 安装Ceph
```
yum install ceph -y
pip install prettytable
# 这里安装的是openeuler系统自带的12.2.8。 如果需要其他版本，可以自行安装。
```

##### 建立这几个节点互信

ceph-deploy部署时候需要保证几个节点之间root用户免密连通，即需要建立root用户的互信。
可以使用openGauss的OM工具gs_sshexkey来建立互信。
```
./gs_sshexkey -f ./hostfile  # hosffile里面所有节点ip，每行一个
```

#### (2) 选择ceph1节点上执行部署ceph操作：

##### 安装ceph-deploy部署工具
```
pip install ceph-deploy
```
openEuler上需要适配修改：
```
vim /lib/python2.7/site-packages/ceph_deploy/hosts/__init__.py
```
添加一行对openeuler的支持。 \
![](../ddes/oel_deploy.png)

ceph -v 查询是否安装成功。 \
![](../ddes/cephv.png)

##### 部署MON节点

Ceph Monitor,负责监视Ceph集群，维护Ceph集群的健康状态。

只用在ceph1节点执行
```
cd /etc/ceph
ceph-deploy new ceph1 ceph2 #所有的客户端和服务端节点都要
ceph-deploy mon create-initial
ceph-deploy --overwrite-conf admin ceph1 ceph2 #所有的客户端和服务端节点都要
```

部署完成后，可以使用 ceph -s 查看状态

##### 部署MGR节点

提供外部监测和管理系统的接口。

只用在ceph1节点执行
```
ceph-deploy mgr create ceph1 ceph2 #只需要给服务端部署
```

##### 部署OSD节点

osd（Object Storage Device）主要用于存储数据，一般将一块数据盘对应一个osd，也可以把一个分区作为一个osd。

查看数据盘是否有分区 \
使用 lsblk查看，需要部署osd的数据盘如果之前被做了分区，可以用如下命令清除。
```
ceph-volume lvm zap /dev/sdb --destroy #/dev/sdb 为要清除分区的数据盘
```

##### 部署OSD
```
ceph-deploy osd create ceph1 --data /dev/sdc
ceph-deploy osd create ceph2 --data /dev/sdc
```

ceph1为当前服务器名称， `/dev/sdc` 为对应服务器要部署osd的数据盘盘符。

完成后使用ceph -s 查看状态

##### MDS部署

MDS（Metadata Server）即元数据Server主要负责Ceph FS集群中文件和目录的管理。
我们使用ceph的块设备，不用cephfs文件系统。可以不需要部署MDS服务。
```
cd /etc/ceph
ceph-deploy mds create ceph1 ceph2
```

状态查看
```
集群状态： ceph -s  
集群健康信息： ceph health detail
OSD信息： ceph osd tree
各个服务状态：
systemctl status ceph-mon@ceph1
systemctl status ceph-mgr@ceph1
systemctl status ceph-osd@ceph1
```

### 2. 部署DSS

数据库和DSS都是部署在子用户下运行，需要有子用户调用ceph接口的权限。我们将/ec/ceph目录权限以及里面的文件权限改为755，保证子用户可读。
```
chmod -R 755 /etc/ceph
```

#### (1) 创建块设备

##### 创建存储池：
```
ceph osd pool create blkpool 64 64
```

##### 创建块设备
```
rbd create dssimage --size 50GB --pool blkpool --image-format 2 --image-feature layering
```
>- blkpool 存储池名称
>- dssimage 实际使用的块设备名称，类似于磁盘，在创建时候需要指定大小。

```
rbd map blkpool/dssimage
```
将ceph的块设备挂载到系统上。例如挂载为： `/dev/rbd0`

> 这一步无实际意义，仅是为了做个标识。对ceph的读写不会真正去打开/dev/rbd0，而是通过存储池> 名称blkpool和块设备名称dssimage调用rbd接口打开以及读写。

#### (2) DSS对接到Ceph块设备

##### 编译DSS
```
sh build.sh -m Release -3rd /xxx/openGauss-third_party_binarylibs_openEuler_x86_64 -t cmake -s ceph
```

下载最新的dss代码进行编译，编译命令后面加上 `-s ceph` 表明构建出的二级制支持ceph块设备。

编译需要安装rbd的依赖：
```
yum install librados-devel librbd-devel -y
```

##### 部署DSS

导入环境变量：
```
export DSSAPP=/data/ddes/code/DSS-zxb/output
export LD_LIBRARY_PATH=$DSSAPP/lib:$LD_LIBRARY_PATH
export PATH=$DSSAPP/bin:$PATH
export DSS_HOME=/data/ddes/app/dsshome
export DSSDATA=/dev/rbd0
```

>- DSSAPP目录为编译出来的dss二级制目录，下面为bin以及lib
>- DSS_HOME为dss的配置文件目录，指定一个目录并创建

创建配置以及日志目录：
```
mkdir -p ${DSS_HOME}/cfg
mkdir -p ${DSS_HOME}/log
```

写入DSS配置文件：
```
echo "VOLUME_TYPES=${DSSDATA}=1" > ${DSS_HOME}/cfg/dss_inst.ini
echo "POOL_NAMES=${DSSDATA}=blkpool" >> ${DSS_HOME}/cfg/dss_inst.ini
echo "IMAGE_NAMES=${DSSDATA}=dssimage" >> ${DSS_HOME}/cfg/dss_inst.ini
echo "CEPH_CONFIG=/etc/ceph/ceph.conf" >> ${DSS_HOME}/cfg/dss_inst.ini
echo "data:${DSSDATA}" > ${DSS_HOME}/cfg/dss_vg_conf.ini
```

>- DSSDATA=/dev/rbd0 为挂载ceph块设备，名称仅做标识。
>- POOL_NAMES为存储池配置，格式为 `/dev/rbd0=dsspool` 
>- IMAGE_NAMES为image配置，格式为 `/dev/rbd0=dssimage` 
>- CEPH_CONFIG为ceph集群配置文件，默认是`/etc/ceph/ceph.conf`

初始化DSS卷组
```
dsscmd cv -g data -v ${DSSDATA} -s 2048 -D ${DSS_HOME}
```

启动dssserver
```
nuhop dssserver &
```

查看dss卷组大小
```
dsscmd lsvg -m G
```
![](../ddes/lsvg.png)

查看dss目录
```
dsscmd ls -p +data
```
![](../ddes/lsp.png)

### 3. 部署openGauss

openGauss单机版本部署方式不变，自行编译或者取构建好的包就行。

#### 部署二级制
将opengauss内核的二进制包解压，导入环境变量：
```
export GAUSSHOME=/data/ddes/app/gauss
export LD_LIBRARY_PATH=$GAUSSHOME/lib:$LD_LIBRARY_PATH
export PATH=$GAUSSHOME/bin:$PATH
```
> GAUSSHOME 是解压的二级制目录。下面包含bin和lib

正常打包会把dss的`dsscmd/dssserve`r以及依赖库`libdss*.so`打包到openGauss的软件包里面。
加载了opengauss的环境变量后，会优先使用`$GAUSSHOME/bin`下的dss二级制以及依赖库。需要保证上面手动编译出来的dss的二进制文件、库文件和`$GAUSSHOME`下面的一致。

#### 初始化openGauss：
```
gs_initdb -d /data/ddes/datanode/dn1 --nodename=ss -w Test@123 --vgname="+data" --enable-dss --dms_url="0:127.0.0.1:1611,1:127.0.0.1:1711" -I 0 --socketpath="UDS:/tmp/.dss_unix_d_socket"
```

由于单机版本的不支持dms，在初始化完成后，修改下postgresql.conf，将`ss_enable_dms`置为`off`

![](../ddes/dmsoff.png)

#### 启动数据库
```
gs_ctl start -D /data/ddes/datanode/dn1
```