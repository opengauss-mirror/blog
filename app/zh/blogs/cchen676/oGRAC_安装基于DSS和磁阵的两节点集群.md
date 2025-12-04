---
title: 'oGRAC_安装基于DSS和磁阵的两节点集群'
date: '2025-12-1'
category: 'blog'
tags: ['oGRAC使用入门']
archives: '2025-12'
author: 'cchen676'
summary: 'oGRAC_安装基于DSS和磁阵的两节点集群'
img: '/zh/blogs/cchen676/title/img26.png'
times: '16:30'
---

# oGRAC_安装基于DSS和磁阵的两节点集群

## 一、准备工作

1. oGRAC的release版本的安装包
2. 两个数据库服务器，1个集中式存储阵列（后面简称磁阵）
3. 服务器和磁阵之间已经连通，磁阵上已经划分了4个LUN，大小分别为5GB、2TB、2TB、4TB
4. 两个数据库服务器上都可以识别到磁阵上创建的4个LUN（走iscsi协议的话，可以使用`lsscsi -is`命令确认）

## 二、安装步骤

### 准备lun

1. 建立对应到4个LUN设备的软链接，对应关系是，gcc的对应gcc，disk2对应5T的那个, 对应实际安装的vg2，对应redo目录，剩下2个对应2T的，要确定好对应的盘符，两个节点都操作
2. 
```
## disk2是最大的那个
ln -s /dev/sdc gcc-disk
ln -s /dev/sdd dss-disk2
ln -s /dev/sde dss-disk1 
ln -s /dev/sdf dss-disk3
```

对应关系如下：

| 软链接       | 使用类型  | dss卷名         | 大小 |
|-----------|-------|---------------|----|
| gcc-disk  | gcc使用 | dsscmd查不到，不管理 | 5G |
| dss-disk1 | page  | vg1           | 2T |
| dss-disk2 | redo  | vg2           | 4T |
| dss-disk3 | 归档    | vg3           | 2T |

### 执行安装

无论是安装前还是卸载后，最好检查下时间是否一致，以及磁阵的LUN是否已经去注册了（没有注册信息，没有LUX锁信息，用sg_persist查询）
1. 基本全程root操作，不涉及切换用户， **安装前一定一定将两个节点的时间调整成一样的（建议用ntp服务器同步）** ,如果安装过程中修改了系统时间，建议重头再来
2. 先建一个安装用的用户（不是ograc用户名的用户）, 比如ogracdba
3. 解压安装包, 修改config_params_lun.json文件（节点0操作，node_id是0，节点1操作时，node_id是1，先装节点0，后装节点1，再起节点0，再起节点1）
对应目录 参考下面的命令
```bash
# cd /home/ograc_install/
# ls -l
total 270076
drwxr-xr-x. 8 root root      4096 Aug 15 14:11 ograc_connector
-rw-r--r--. 1 root root 276553107 Aug 15 14:15 openGauss_oGRAC_aarch64_RELEASE.tgz
# cd ograc_connector/
action/       common/       config/       dss/          repo/         versions.yml  zlogicrep/
# cd ograc_connector/action/
# cat config_params_lun.json
{
    "deploy_mode": "dss",
    "deploy_user": "ogracdba:ogracdba",
    "node_id": "0",
    "cms_ip": "x.0.x.xx7;x.0.x.xx9",
    "mysql_in_container": "1",
    "db_type": "1",
    "mes_ssl_switch": false,
    "MAX_ARCH_FILES_SIZE": "300G",
    "redo_num": "3",
    "redo_size": "256G",
    "ctsql_read_write": true
  }

```
4. 安装加启动（先装节点0，后装节点1，再起节点0，再起节点1）
```bash
(节点0)
# sh appctl.sh install config_params_lun.json
(节点1，注意修改config_params_lun.json中的node_id为1)
# sh appctl.sh install config_params_lun.json
(节点0)
# sh appctl.sh start
(节点1)
# sh appctl.sh start
```
