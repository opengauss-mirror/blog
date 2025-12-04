---
title: 'oGRAC_编译安装基于本地盘的单节点环境'
date: '2025-12-1'
category: 'blog'
tags: ['oGRAC使用入门']
archives: '2025-12'
author: 'cchen676'
summary: 'oGRAC_编译安装基于本地盘的单节点环境'
img: '/zh/blogs/cchen676/title/img26.png'
times: '16:30'
---

# oGRAC_编译安装基于本地盘的单节点环境

## 一、编译安装

1. 下载oGRAC源码：`git clone https://gitcode.com/opengauss/oGRAC.git`
2. 安装依赖protobuf-devel：`yum install protobuf-devel`
3. 执行如下命令编译：
```
cd build
sh local_install.sh compile
# 执行sh local_install.sh compile默认的安装用户名是ogracdba，如果用户不存在会自动创建，如果已存在会复用，但是复用时默认用户的家目录是/home/ogracdba，如果不是该目录，建议提前修改
# 也可以使用sh local_install.sh compile -u tester 指定其他安装用户名
# 编译过程中会自动下载依赖的三方库的源码并编译，会编译protobuf，需要提前安装protobuf-devel包，不然会提示缺少头文件
# 如果第一次编译已经编好三方库了，再次编译不想重编三方库的话，可以注释掉build/Makefile.sh中的调用func_prepare_dependency的地方，跳过三方库的下载和编译
```
4. 执行如下命令安装：
```
cd build
sh local_install.sh install
```

5. 安装完成后使用如下命令登陆：
```
su - ogracdba
ogsql / as sysdba -q
```

## 二、单节点本地盘性能压测指导

压测单节点本地盘性能的话，在安装的基础上主要有两个诉求：
1. redo文件分盘
2. 使用性能压测的默认配置参数，即集群安装时的配置参数

可以参考如下操作：

1. 需要先提前创建好目录，并赋好权限
```
mkdir -p /usr2/ogractest/ograc_data
chown -R ogracdba:ogracdba /usr2/ogractest/
```
2. 编译好源码后，改oGRAC/oGRAC-DATABASE-CENTOS-64bit下面的install.py
修改单节点安装时的redo文件安装到其他盘的位置（redo分盘）, 添加redoPath，和sed替换redoPath的代码
修改`get_database_file`函数

```
        else:
            dbDataPath = os.path.join(self.data, "data").replace('/', '\/')
            redoPath = os.path.join("/usr2/cctest/cantian_data", "redo").replace('/', '\/')
            self._sed_file("dbfiles2\/redo", redoPath, create_database_sql)
            self._sed_file("dbfiles1", dbDataPath, create_database_sql)
            self._sed_file("dbfiles2", dbDataPath, create_database_sql)
            self._sed_file("dbfiles3", dbDataPath, create_database_sql)
        return create_database_sql

```

主要是`redoPath = os.path.join("/usr2/cctest/cantian_data", "redo").replace('/', '\/')`和`self._sed_file("dbfiles2\/redo", redoPath, create_database_sql)` 两行

3. 修改单节点默认安装使用的配置为集群默认安装使用的配置

修改oGRAC/oGRAC-DATABASE-CENTOS-64bit下面的funclib.py文件，把安装时的判断 `else DefaultConfigValue.OGRACD_DBG_CONFIG`改成` else DefaultConfigValue.OGRACD_CONFIG`
```
# grep OGRACD_DBG_CONFIG *
funclib.py:    OGRACD_DBG_CONFIG = {
funclib.py:        cantiand_cfg = DefaultConfigValue.OGRACD_CONFIG if not in_container else DefaultConfigValue.OGRACD_DBG_CONFIG
funclib.py:        cantiand_cfg = DefaultConfigValue.OGRACD_CONFIG if not in_container else DefaultConfigValue.OGRACD_DBG_CONFIG
funclib.py:        cantiand_cfg = DefaultConfigValue.OGRACD_CONFIG if not in_container else DefaultConfigValue.OGRACD_DBG_CONFIG
```

修改oGRAC/oGRAC-DATABASE-CENTOS-64bit下面的funclib.py文件， 把OGRACD_CONFIG的这三行换掉
```bash
        "INTERCONNECT_ADDR": "", #input by user in command line parameter
        "LSNR_ADDR": "", #input by user in command line parameter
        "SHARED_PATH": "+vg1",
 替换成：
         "INTERCONNECT_ADDR": "127.0.0.1",
        "LSNR_ADDR": "127.0.0.1",
        "SHARED_PATH": "", #generate by installer
```
