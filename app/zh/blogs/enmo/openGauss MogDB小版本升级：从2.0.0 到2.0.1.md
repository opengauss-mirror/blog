---
title: 'openGauss/MogDB小版本升级：从2.0.0 到2.0.1'

date: '2022-04-11'

category: 'blog'
tags: ['openGauss/MogDB小版本升级：从2.0.0 到2.0.1']

archives: '2022-04'

author: '恩墨交付团队'

summary: 'openGauss/MogDB小版本升级：从2.0.0 到2.0.1'

img: '/zh/blogs/enmo/title/img6.png'

times: '10:20'
---

# openGauss/MogDB 小版本升级：从 2.0.0 到 2.0.1

### 一、目的

openGauss/MogDB2.0.0 版本升级到 2.0.1

### 二、主要思想

替换对应的 app 包

### 三、环境

| 操作系统       | Centos X86                |
| -------------- | ------------------------- |
| 当前数据库版本 | 2.0.0 commit 号：78689da9 |
| 升级后版本     | 2.0.1 commit 号：d97c0e8a |

### 四、具体步骤

##### 4.1 压缩包准备

1. 创建目录

   ```
   mkdir /opengauss2.0.1
   ```

2. 将安装包上传至/opengauss2.0.1 目录下

3. 赋权

   ```
   chown -R omm:dbgrp /opengauss2.0.1
   ```

4. 解压压缩包

   ```
   su - omm
   cd /opengauss2.0.1
   tar -zxvf openGauss-2.0.1-CentOS-64bit-all.tar.gz
   # 目录下的文件有
   openGauss-2.0.1-CentOS-64bit-om.tar.gz
   openGauss-2.0.1-CentOS-64bit.tar.bz2
   openGauss-2.0.1-CentOS-64bit-om.sha256
   openGauss-2.0.1-CentOS-64bit.sha256
   upgrade_sql.tar.gz
   upgrade_sql.sha256

   # 解压 openGauss-2.0.1-CentOS-64bit.tar.bz2
   tar -xvf openGauss-2.0.1-CentOS-64bit.tar.bz2
   ```

##### 4.2 更换安装包（omm 用户）

1. 先在主库进行操作

   1. 进入数据库安装目录

      ```
      cd /opt/gaussdb/
      ```

   2. 创建新的 app 目录

      ```
      mkdir app\_2.0.1\_d97c0e8a
      ```

   3. 复制解压的那些文件到新的安装目录下

      ```
      cd app\_2.0.1\_d97c0e8a

      cp -r /opengauss2.0.1/bin/ /opengauss2.0.1/etc/ /opengauss2.0.1/include/ /opengauss2.0.1/jre/ /opengauss2.0.1/share/ /opengauss2.0.1/share/ /opengauss2.0.1/simpleInstall/  /opengauss2.0.1/version.cfg/ /opt/gaussdb/app\_2.0.1\_d97c0e8a/

      cp /opt/gaussdb/app\_392c0438/bin/cluster\_static\_config ./bin/

      cp /opt/gaussdb/app\_392c0438/bin/upgrade\_version ./bin/

      cp /opt/gaussdb/app\_392c0438/share/sslcert/grpc/cacertnew.pem ./share/sslcert/grpc/

      cp /opt/gaussdb/app\_392c0438/share/sslcert/grpc/servernew.crt ./share/sslcert/grpc/

      cp /opt/gaussdb/app\_392c0438/share/sslcert/grpc/servernew.key ./share/sslcert/grpc/
      ```

   4. 压缩包

      ```
      tar -cvjf openGauss-Package-bak\_d97c0e8a.tar.gz ./\*
      ```

   5. 软链

      ```
      cd /opt/gaussdb/
      # 删除之前的软链
      rm -rf app
      # 创建新的软链
      ln -s app\_2.0.1\_d97c0e8a ./app
      ```

2. 切换到备节点 omm 用户

   1. 进入数据库安装目录

      ```
      cd /opt/gaussdb
      ```

   2. 创建新的 app 目录

      ```
      mkdir app_2.0.1_d97c0e8a
      ```

   3. 复制压缩包

      ```
      scp 主机IP:/opt/gaussdb/app\_2.0.1\_d97c0e8a/openGauss-Package-bak\_d97c0e8a.tar.gz app\_2.0.1\_d97c0e8a/
      ```

   4. 解压压缩包

      ```
      cd app\_2.0.1\_d97c0e8a/
      tar -xvf openGauss-Package-bak\_d97c0e8a.tar.gz
      ```

   5. 软链

      ```
      cd /opt/gaussdb/
      # 删除之前的软链
      rm -rf app
      # 创建新的软链
      ln -s app\_2.0.1\_d97c0e8a ./app
      ```

##### 4.3 重启数据库

```
gs_om -t restart -D /gaussdb/data/dn1/
```

##### 4.4 查看数据库

- ```
  gsql -p 端口 postgres
  ```

- ```
  gaussdb --version
  ```
