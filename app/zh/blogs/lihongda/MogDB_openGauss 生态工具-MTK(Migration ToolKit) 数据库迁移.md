---
title: 'MogDB_openGauss 生态工具-MTK(Migration ToolKit) 数据库迁移'

date: '2021-07-09'

category: 'blog'
tags: ['MogDB_openGauss 生态工具-MTK(Migration ToolKit) 数据库迁移接']

archives: '2021-07'

author: '李宏达'

summary: 'MogDB_openGauss 生态工具-MTK(Migration ToolKit) 数据库迁移'

img: '/zh/blogs/lihongda/title/title.png'

times: '12:30'
---

# MogDB_openGauss 生态工具-MTK(Migration ToolKit) 数据库迁移<a name="ZH-CN_TOPIC_0000001085018737"></a>

## 一、准备环境

### 1. 源库创建（Oracle）

- 创建 Oracle 11.2.0.4

```
ocker pull registry.cn-hangzhou.aliyuncs.com/lhrbest/oracle_11g_ee_lhr_11.2.0.4:1.0
docker run -itd --name oracle -h oracle --privileged=true -p 1521:1521 -p 222:22 -p 1158:1158 lhrbest/oracle_11g_ee_lhr_11.2.0.4:1.0 init
```

**MTK 程序迁移 Oracle 需要安装 Oracle 客户端**

- 安装 Oracle 客户端

```
wget https://download.oracle.com/otn_software/linux/instantclient/211000/oracle-instantclient-basic-21.1.0.0.0-1.x86_64.rpm
wget https://download.oracle.com/otn_software/linux/instantclient/211000/oracle-instantclient-sqlplus-21.1.0.0.0-1.x86_64.rpm
rpm -ivh oracle-instantclient-basic-21.1.0.0.0-1.x86_64.rpm oracle-instantclient-sqlplus-21.1.0.0.0-1.x86_64.rpm
export LD_LIBRARY_PATH=/usr/lib/oracle/21/client64/lib
```

### 2. 目标库创建（MogDB）

参考<a href="https://www.modb.pro/db/70779" target="_blank">MogDB/openGauss 手动部署(非 OM 工具)单机，主备，主备级联架构</a>

## 二、迁移

### 1. 上传程序，编写配置文件

**迁移为 Oracle 下的 scott 用户**

- 编写配置文件

```
[root@mogdb-kernel-0005 mtk]# cat mtk_config.json
{
  "source": {
    "type": "oracle",
    "connect": {
      "version": "",
      "host": "172.16.0.176",
      "user": "system",
      "port": 1521,
      "password": "system",
      "dbName": "LHR11G",
      "dsn": ""
    },
    "parameter": {
      "debugTest": false
    }
  },
  "target": {
    "type": "openGauss",
    "connect": {
      "version": "",
      "host": "172.16.0.106",
      "user": "mogdb",
      "port": 26000,
      "password": "Enmo@123",
      "dbName": "mtk",
      "dsn": ""
    },
    "parameter": {
      "dropExistingObject": true,
      "truncTable": true,
      "ignoreTableDDLCompErr": true,
      "parallelInsert": 1
    }
  },
  "limit": {
    "parallel": 2
  },
  "object": {
    "schemas": [
      "SCOTT"
    ]
  },
  "dataOnly": false ,
  "schemaOnly": false,
  "reportFile": "./report_Oracle2OpenGauss_all.html"
}
```

### 迁移

- 执行迁移命令

```
[root@mogdb-kernel-0005 mtk]# ./mtk -c mtk_config.json --reportFile mtk_report.html --logfile mtk_report.log --debug
'''''
-----------------------
ObjectName Type Summary
-----------------------

+--------------+---------------------+---------------------+------------+--------+-------------+------------+
|     Type     |      StartTime      |       EndTime       |    Time    | Status | Success Num | Failed Num |
+--------------+---------------------+---------------------+------------+--------+-------------+------------+
| Schema       | 2021-06-15 12:00:46 | 2021-06-15 12:00:46 | 18 ms      | finish |           1 |          0 |
| ObjectType   | 2021-06-15 12:00:46 | 2021-06-15 12:00:47 | 450 ms     | finish |           0 |          0 |
| Domain       | 2021-06-15 12:00:47 | 2021-06-15 12:00:47 | 0 ms       | finish |           0 |          0 |
| CustomType   | 2021-06-15 12:00:47 | 2021-06-15 12:00:47 | 0 ms       | finish |           0 |          0 |
| Sequence     | 2021-06-15 12:00:47 | 2021-06-15 12:00:47 | 5 ms       | finish |           0 |          0 |
| Queue        | 2021-06-15 12:00:47 | 2021-06-15 12:00:47 | 0 ms       | finish |           0 |          0 |
| Table        | 2021-06-15 12:00:47 | 2021-06-15 12:00:47 | 335 ms     | finish |           4 |          0 |
| TableDDLCom  | 2021-06-15 12:00:47 | 2021-06-15 12:00:47 | 0 ms       | finish |           0 |          0 |
| TableData    | 2021-06-15 12:00:47 | 2021-06-15 12:00:49 | 2 s 45 ms  | finish |           4 |          0 |
| Constraint   | 2021-06-15 12:00:49 | 2021-06-15 12:00:49 | 445 ms     | finish |           3 |          0 |
| Index        | 2021-06-15 12:00:49 | 2021-06-15 12:00:51 | 1 s 894 ms | finish |           0 |          0 |
| Trigger      | 2021-06-15 12:00:51 | 2021-06-15 12:00:51 | 0 ms       | finish |           0 |          0 |
| View         | 2021-06-15 12:00:51 | 2021-06-15 12:00:51 | 86 ms      | finish |           0 |          0 |
| TableDataCom | 2021-06-15 12:00:51 | 2021-06-15 12:00:52 | 39 ms      | finish |           4 |          0 |
+--------------+---------------------+---------------------+------------+--------+-------------+------------+

------------------
Table Data Summary
------------------

+----------------+----------------+---------------------+---------------------+-----------+---------+-------------+-------------+-------------+------+
|    SrcName     |    TgtName     |      StartTime      |       EndTime       |   Time    | Status  | Select Rows | Insert Rows | Ignore Rows | Size |
+----------------+----------------+---------------------+---------------------+-----------+---------+-------------+-------------+-------------+------+
| SCOTT.EMP      | SCOTT.EMP      | 2021-06-15 12:00:47 | 2021-06-15 12:00:48 | 1 s 18 ms | succeed |          14 |          14 |           0 |  773 |
| SCOTT.SALGRADE | SCOTT.SALGRADE | 2021-06-15 12:00:47 | 2021-06-15 12:00:48 | 1 s 29 ms | succeed |           5 |           5 |           0 |   44 |
| SCOTT.DEPT     | SCOTT.DEPT     | 2021-06-15 12:00:48 | 2021-06-15 12:00:49 | 1 s 17 ms | succeed |           4 |           4 |           0 |   68 |
| SCOTT.BONUS    | SCOTT.BONUS    | 2021-06-15 12:00:48 | 2021-06-15 12:00:49 | 1 s 16 ms | succeed |           0 |           0 |           0 |    0 |
+----------------+----------------+---------------------+---------------------+-----------+---------+-------------+-------------+-------------+------+

-----------------------------
Table Data Comparison Summary
-----------------------------

+----------------+----------------+---------------------+-------+---------+------------+------------+-------+
|    SrcName     |    TgtName     |      StartTime      | Time  | Status  | SourceRows | TargetRows | Error |
+----------------+----------------+---------------------+-------+---------+------------+------------+-------+
| SCOTT.EMP      | SCOTT.EMP      | 2021-06-15 12:00:51 | 1 ms  | succeed |         14 |         14 |       |
| SCOTT.SALGRADE | SCOTT.SALGRADE | 2021-06-15 12:00:51 | 39 ms | succeed |          5 |          5 |       |
| SCOTT.DEPT     | SCOTT.DEPT     | 2021-06-15 12:00:51 | 1 ms  | succeed |          4 |          4 |       |
| SCOTT.BONUS    | SCOTT.BONUS    | 2021-06-15 12:00:51 | 1 ms  | succeed |          0 |          0 |       |
+----------------+----------------+---------------------+-------+---------+------------+------------+-------+
```

### 日志截图

主界面

<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210615-c6b4c094-1613-4ff8-bac7-739b214fe370.png" alt="1.png" />

对象
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210615-052bc91a-875f-4a76-a3e4-28ae19ae9e20.png" alt="2.png" />

表数据
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210615-aa6ab68b-54d9-4b42-8fe4-612be03554f0.png" alt="3.png" />
