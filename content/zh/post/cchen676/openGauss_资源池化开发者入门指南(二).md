+++
title = "openGauss资源池化开发者入门指南(二)" 
date = "2023-01-12" 
tags = ["openGauss使用增强"] 
archives = "2023-01" 
author = "cchen676" 
summary = "openGauss资源池化开发者入门指南"
img = "/zh/post/cchen676/title/img26.png" 
times = "16:30"
+++
# openGauss资源池化开发者入门指南(二)

### 一、内容简介

openGauss资源池化是openGauss推出的一种新型的集群架构.通过DMS和DSS组件,实现集群中多个节点的底层存储数据共享和节点间的内存实时共享

达到节省底层存储资源以及集群内部支持一写多读且可以实时一致性读的目的.

本系列的主旨在于帮助对资源池化开发感兴趣的开发者快速入门

以及提供一些对开发有帮助的经验总结

  
### 二、预备知识

开发者最好具备以下基础:
1. Linux的基础命令，比如dd命令，iscis等
2. 对磁阵有一定的了解
3. 对传统的openGauss编译方式十分熟悉

### 二、开发自验证编译安装指南

  1. 资源池化架构参考:
  ![图1](/content/zh/post/cchen676/title/dms1.JPG "图1")
  2. 在社区正式发布的版本中, 如果需要搭建资源池化架构, 硬件上需要准备磁阵, 服务器和光交换机.
  3. 在社区正式发布的版本中,  CM和OM是必选的组件
  4. 这里介绍一种可以用于开发者自己学习或开发的编译环境搭建方式, 不需要cm和om, 不需要磁阵, 仅需要一台普通的物理机就可以搭建出资源池化的环境.
  5. 需要注意的是, 因为没用到cm,  这种方式搭建的环境不能用于调试主备倒换或failover场景, 只能用于验证集群正常运行时的场景

### 三、独立编译安装指南

注意: 以下请勿用于生产环境

  1. 环境预备: 仅需要一台单独的物理机, 剩余磁盘空间最好足够大, 建议大于2T, 不低于1T
  2. 环境预备: 假设已经自行使用编译方式编译出了openGauss带资源池化代码的debug版本的安装包, 可以通过确认生成的bin目录下是否有dssserver, dsscmd, lib目录下是否有libdms.so, libdssapi.so , libdssaio.so, 来判断
   - 注意: 必须是debug版本,不能用release版本
   - 三方库版本可能不是最新，此时需要手动更新DMS/DSS组件。方法为 a.下载最新版本CBB代码，编译安装替换三方库中的CBB; b.下载最新版本的DMS/DSS代码，并根据src/gausskernel/ddes/ddes_commit_id内的版本号，回退DMS/DSS至指定版本; c.编译安装替换三方库中的DMS/DSS组件

下面是以2个节点为例

  3. 配置好环境变量/home/cctest/envfile, 参考示例, 其中DSS_HOME是dn实例1的dssserver运行时需要的目录, 需要手动新建

  ```shell
export GAUSSHOME=/home/test/openGauss-server/dest/
export LD_LIBRARY_PATH=$GAUSSHOME/lib:$LD_LIBRARY_PATH
export PATH=$GAUSSHOME/bin:$PATH
export DSS_HOME=/home/test/dss/dss0/dssdba
  ```
  4. 需要注意的是一台服务器上建多个dn(数据库)节点, ip是相同的, 服务使用的端口号不同
  5. 新建dsssever需要的目录:
  ```shell
  cd /home/test
  mkdir -p dss/dss0/dssdba/cfg
  mkdir -p dss/dss0/dssdba/log
  mkdir -p dss/dss1/dssdba/cfg
  mkdir -p dss/dss1/dssdba/log
  mkdir -p dss/dev
  ```
  6. 用dd命令创建一个模拟的块设备文件(执行时间依赖于磁盘的性能), 下面的命令是建2T的命令
   - 请不要直接拷贝, 请务必根据自己需要的大小自己调整下bs和count的值, 否则磁盘会爆
  ```shell
  dd if=/dev/zero of=/home/test/dss/dev/dss-dba bs=2M count=1024000 >/dev/null 2>&1
  ```
  7. 创建2个dn节点需要的dss实例1和dss实例0的配置:
  
  实例1配置:
  ```shell
  vim /home/test/dss/dss0/dssdba/cfg/dss_inst.ini
  ```
  dss实例1的内容如下:
  ```shell
  INST_ID=0
  _LOG_LEVEL=255
  DSS_NODES_LIST=0:127.0.0.1:17102, 1:127.0.0.1:18102
  DISK_LOCK_FILE_PATH=/home/test/dss/dss0
  LSNR_PATH=/home/test/dss/dss0
  _LOG_MAX_FILE_SIZE=20M
  _LOG_BACKUP_FILE_COUNT=128
  ```

  dss卷配置:
  ```shell
  vim /home/test/dss/dss0/dssdba/cfg/dss_vg_conf.ini
  ```
  dss实例1的内容如下, 里面就是卷名加dd模拟出来的设备名字:
  ```shell
  data:/home/test/dss/dev/dss-dba
  ```
  
  实例2配置:
  ```shell
  vim /home/test/dss/dss1/dssdba/cfg/dss_inst.ini
  ```
  dss实例2的内容如下, 注意DISK_LOCK_FILE_PATH配置的与1一致:
  ```shell
  INST_ID=1
  _LOG_LEVEL=255
  DSS_NODES_LIST=0:127.0.0.1:17102, 1:127.0.0.1:18102
  DISK_LOCK_FILE_PATH=/home/test/dss/dss0
  LSNR_PATH=/home/test/dss/dss1
  _LOG_MAX_FILE_SIZE=20M
  _LOG_BACKUP_FILE_COUNT=128
  ```

  dss卷配置:
  ```shell
  vim /home/test/dss/dss1/dssdba/cfg/dss_vg_conf.ini
  ```
  dss实例2的内容如下, 里面就是卷名加dd模拟出来的设备名字:
  ```shell
  data:/home/test/dss/dev/dss-dba
  ```

  8. 建dssserver需要的卷, 起dssserver

  ```shell
  ##这里是步骤3中配好的环境变量
  source /home/cctest/envfile
  dsscmd cv -g data -v /home/test/dss/dev/dss-dba
  dssserver -D /home/test/dss/dss0/dssdba &
  #上个命令显示DSS SERVER STARTED即为成功
  dssserver -D /home/test/dss/dss1/dssdba &
  #上个命令显示DSS SERVER STARTED即为成功

  #创建完可以通过如下命令确认是否建卷成功
  dsscmd lsvg -U UDS:/home/test/dss/dss0/.dss_unix_d_socket
  dsscmd ls -m M -p +data -U UDS:/home/test/dss/dss0/.dss_unix_d_socket
  ```
   - 注意: dss不支持启动后修改卷组配置，如涉及修改请重新执行上述步骤

  9. 手动执行多节点的initdb

  ```shell
mkdir -p /home/test/data
rm -rf node1 node2

gs_intdb -D /home/test/data/node1 --nodename=node1 -U tester -w Pasword --vgname=+data --enable-dss --dms_url="0:127.0.0.1:1613,1:127.0.0.1:1614" -I 0 --socketpath='UDS:/home/test/dss/dss0/.dss_unix_d_socket'

echo "ss_enable_ssl = off
listen_addresses = '*'
port=12210
ss_enable_reform = off
ss_work_thread_count = 32
enable_segment = on
ss_log_level = 255
ss_log_backup_file_count = 100
ss_log_max_file_size = 1GB
" >> /home/test/data/node1/postgresql.conf

sed '91 ahost       all        all         0.0.0.0/0        sha256' -i /home/test/data/node1/postgresql.conf

gs_intdb -D /home/test/data/node2 --nodename=node2 -U tester -w Pasword --vgname=+data --enable-dss --dms_url="0:127.0.0.1:1613,1:127.0.0.1:1614" -I 1 --socketpath='UDS:/home/test/dss/dss1/.dss_unix_d_socket'

echo "ss_enable_ssl = off
listen_addresses = '*'
port=13210
ss_enable_reform = off
ss_work_thread_count = 32
enable_segment = on
ss_log_level = 255
ss_log_backup_file_count = 100
ss_log_max_file_size = 1GB
" >> /home/test/data/node2/postgresql.conf

sed '91 ahost       all        all         0.0.0.0/0        sha256' -i /home/test/data/node2/postgresql.conf
  ```

  10. 依次启动节点1和节点2
```shell
 gs_ctrl start -D /home/test/data/node1
 gs_ctrl start -D /home/test/data/node2
```

  11. 部分补充说明:
  
  - ss_log_level参数用于控制日志中打印DMS和DSS相关的日志, 日志目录在pg_log/DMS里面
  - 17102和18102是dssserver要用的端口
  - 1613和1614是dms通信要用的端口
  - 12210和13210是openGauss数据库提供服务需要用的端口
  - dssserver配置中INST_ID不能有冲突, 比如多个dssserver配置成相同的ID
  - 该方式搭建出来的环境不支持高可用, 不能测试倒换和failover
  - 如果启动时报错，提示如“dms library version is not matched”等报错，表示DMS/DSS组件版本号错误，请参考第三章步骤2重新编译
  - 非CM环境下，限制了0节点为主节点，因此需要确保initdb阶段0节点创建成功
