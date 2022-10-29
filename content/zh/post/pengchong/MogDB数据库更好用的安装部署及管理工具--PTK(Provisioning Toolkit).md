+++

title = "MogDB数据库更好用的安装部署及管理工具--PTK(Provisioning Toolkit)" 

date = "2022-10-19" 

tags = ["MogDB"] 

archives = "2022-10" 

author = "彭冲" 

summary = "MogDB数据库更好用的安装部署及管理工具--PTK(Provisioning Toolkit)"

img = "/zh/post/pengchong/title/img9.png" 

times = "10:20"
+++

# MogDB数据库更好用的安装部署及管理工具--PTK(Provisioning Toolkit)

本文出处：[https://www.modb.pro/db/468987](https://www.modb.pro/db/468987)

本文将使用PTK工具演示如何快速安装部署一套MogDB集群、缩容删除一个节点及扩容增加一个节点。

### 一、PTK简介

PTK是针对MogDB数据库开发的软件安装和运维工具，旨在帮助用户更便捷地安装部署MogDB数据库。

PTK的唯一官方地址为：[https://docs.mogdb.io/zh/ptk/v0.3/overview](https://docs.mogdb.io/zh/ptk/v0.3/overview)

熟悉openGauss的朋友应该知道gs_om工具，它依赖python3，安装配置有些复杂，主要分为root预安装和omm安装两个子操作。

root用户预安装使用gs_preinstall命令

```
gs_preinstall -U omm -G dbgrp -X clusterconfig.xml 
```

omm用户安装使用gs_preinstall命令

```
gs_install -X /opt/software/clusterconfig.xml \
--gsinit-parameter="--encoding=UTF8" \
--gsinit-parameter="--dbcompatibility=PG" \
--gsinit-parameter="--pwpasswd=Admin@1234"
```

初次接触使用om安装的人可能会遇到不少问题…

在此背景下，PTK应时而生，通过ptk --help命令可以看到它支持的主要功能：

第一部分是安装前的命令，包括打印支持的操作系统版本、在线下载合适的安装包、检查操作系统依赖包、加密配置文件项、显示参考的配置模板

```
Pre Install Commands:
  candidate   Print software version list which PTK supported
  download    Download MogDB package online
  checkos     Check cluster servers os dependencies
  encrypt     Provides a convenient way to encrypt your text/password
  template    Print template of configuration
```

第二部分是正式安装或者卸载命令

```
Install Commands:
  install     Install the MogDB database cluster based on topology configuration
  uninstall   Uninstall a MogDB database cluster
```

第三部分是安装后的集群列表查询及集群管理（服务启停、查看状态、安装插件、扩缩容）

```
Post Install Commands:
  ls          List MogDB clusters
  cluster     Operations for manage database cluster
```

### 二、PTK安装

PTK软件并不需要安装到数据库服务器本地，可以独立安装并管理多套集群。

PTK的安装可以参考 [https://docs.mogdb.io/zh/ptk/v0.3/quick-start](https://docs.mogdb.io/zh/ptk/v0.3/quick-start)

本文通过离线下载，解压安装到/opt/ptk

```
# /opt/ptk/ptk --version
PTK Version: v0.3.2
Go Version: go1.17.1
Build Date: 2022-08-05T09:11:42Z
Git Hash: a1358c6
```

本文环境使用两节点虚机192.168.137.131和192.168.137.132，1G内存+1CPU，PTK直接使用其中一台机器。

生产环境推荐采用独立的服务器安装PTK。

### 三、PTK安装卸载

PTK的使用需要root用户操作，需要做一些系统依赖及操作系统参数调优等工作。

由于之前安装过MogDB集群，可以通过ls命令查看

```
# /opt/ptk/ptk ls 
  cluster_name |      instances       | user |      data_dir      |          db_version          |     create_time      
---------------+----------------------+------+--------------------+------------------------------+----------------------
  mymogdb      | 192.168.137.131:3000 | omm  | /opt/mogdb301/data | MogDB 3.0.1 (build 1a363ea9) | 2022-08-16 15:57:17  
               | 192.168.137.132:3000 |      |                    |                              |                      
```

操作之前也应该优先使用ls命令进行检查

#### 测试卸载

之前已安装过MogDB集群，先测试卸载

注意：卸载之前先需要关闭集群服务

```
# /opt/ptk/ptk uninstall -n mymogdb
=============================
global:
  cluster_name: mymogdb
  user: omm
  group: dbgrp
  app_dir: /opt/mogdb301/app
  data_dir: /opt/mogdb301/data
  log_dir: /opt/mogdb301/log
  tool_dir: /opt/mogdb301/tool
  tmp_dir: /opt/mogdb301/tmp
  cm_server_port: 15300
db_servers:
- host: 192.168.137.131
  db_port: 3000
  role: primary
  az_name: AZ1
  az_priority: 1
- host: 192.168.137.132
  db_port: 3000
  role: standby
  az_name: AZ1
  az_priority: 1

=============================
Do you really want to uninstall this cluster? Please confirm carefully[Y|Yes](default=N) 
```

根据操作交互提示进行操作，即可顺利完成卸载。

#### 测试安装

安装一主一备

##### checkos

```
[root@mogdb1 ~]# /opt/ptk/ptk checkos
...                    
# Check Results
                Item                |  Level    
------------------------------------+-----------
  A1.Check_OS_Version               | OK        
  A2.Check_Kernel_Version           | OK        
  A3.Check_Unicode                  | OK        
  A4.Check_TimeZone                 | OK        
  A5.Check_Swap_Memory_Configure    | Warning   
  A6.Check_SysCtl_Parameter         | OK        
  A7.Check_FileSystem_Configure     | OK        
  A8.Check_Disk_Configure           | OK        
  A9.Check_BlockDev_Configure       | OK        
  A9.Check_Logical_Block            | OK        
  A10.Check_IO_Request              | Warning   
  A10.Check_Asynchronous_IO_Request | OK        
  A10.Check_IO_Configure            | OK        
  A11.Check_Network_Configure       | OK        
  A12.Check_Time_Consistency        | OK        
  A13.Check_Firewall_Service        | OK        
  A14.Check_THP_Service             | OK        
  A15.Check_Dependent_Package       | OK        
  A16.Check_CPU_Instruction_Set     | Abnormal  
  A17.Check_Port                    | OK        
Total count 20, abnormal count 1, warning count 2

Failed to check os, can’t perform installation unless fix all the abnormal items
You can use 'ptk checkos -i ITEM --detail' to see detail message
Please check root_fix_os.[TIMESTAMP].sh for commands to resolve.
```

生产环境需要根据fix脚本把Warning和Abnormal项修复成功之后，再进行安装。

本文虚拟机暂时不执行操作系统参数fix的脚本，重点关注A16项：

```
# /opt/ptk/ptk checkos -i A16 --detail
...
...                    
# Check Results
              Item              |  Level   |                               Message                                 
--------------------------------+----------+-----------------------------------------------------------------------
  A16.Check_CPU_Instruction_Set | Abnormal | [192.168.137.131] [PTK-508001] not found cpu instruction set: [bmi2]  
Total count 1, abnormal count 1, warning count 0

Failed to check os, can’t perform installation unless fix all the abnormal items
You can use 'ptk checkos -i ITEM --detail' to see detail message
Please check root_fix_os.[TIMESTAMP].sh for commands to resolve.
```

提示是缺bmi2指令集，bmi2是做位操作的CPU指令集，需要安装。

生产环境对checkos检查发现的问题应该逐个修复再进行安装，本文主要演示PTK功能，下面安装时通过参数临时忽略。

##### 生成模板配置文件

如果已有模板配置文件，可以直接使用

```
 /opt/ptk/ptk template \
--base-dir=/opt/mogdb301 \
--cluster-name=mymogdb \
--user=omm \
--group=dbgrp \
--port=3000 \
−−cluster > config.yaml 
```

对config.yaml 可以进行敏感内容加密，比如数据库初始用户密码、SSH密码等。

```
# /opt/ptk/ptk encrypt admin
admin: pTk6Y2Q4MzNmYmQ8RD1FPTxAPTgzSDBzTGdrY1VuVmVhd0s0LUhrTzNyNW5qNFhKaTFRNDI4RnN5VW52YWM=
```

编辑好的配置文件config.yaml 如下：

```
global:
  cluster_name: "mymogdb"
  user: "omm"
  group: "dbgrp"
  user_password: "pTk6NDM4Yjk3NjA8RDxCPUQ8RDVYd2VfVDFfNzU3WEtWUkV2YU5YRHFSVlVCZFBwLV8ybkZabFY3VjJUTjA="
  db_password: "pTk6MDE1ZmQ3ZTg8RDxCPUM/RVNKUzQtNE10S2h0NGZ3eXRpMXlTWURDWGdVSUtNeDZvRzNwRHk0M09lUEk="
  db_port: 3000
  cm_server_port: 15300
  base_dir: "/opt/mogdb301"
  app_dir: "/opt/mogdb301/app"
  log_dir: "/opt/mogdb301/log"
  data_dir: "/opt/mogdb301/data"
  tool_dir: "/opt/mogdb301/tool"
  cm_dir: "/opt/mogdb301/cm"
  # tmp_dir: "/tmp"
  # core_file_dir: ""
  ssh_option:
      port: 22
      user: root
      password: "pTk6ZDA2NmFmOTQ8RDxCPUNBP19NSnVKVFV1eFJ6SG5wOElmVC1uS3pqbWNDSGh1bFJzNEZqSHlGQTRuRWs="
      conn_timeout: "5s"
      exec_timeout: "1m"
db_servers:
  - host: "192.168.137.131"
    db_port: 3000
    ha_port: 3001
    role: "primary"
    replication_type: 1
    gs_initdb_opts:
    - "--encoding=UTF-8"
    - "--dbcompatibility=PG"
  - host: "192.168.137.132"
    db_port: 3000
    ha_port: 3001
    role: "standby"
    replication_type: 1
```

##### 安装

```
/opt/ptk/ptk install --assumeyes \
--pkg /opt/software/MogDB-3.0.1-CentOS-x86_64.tar.gz \
--skip-check-distro --skip-check-os --skip-create-user \
--file=config.yaml
```

本文使用–skip-check-distro --skip-check-os参数做了临时跳过，生产环境应该逐个处理修复。
–skip-create-user跳过创建用户，因为做了手工创建。

安装过程简略如下：

```
...
INFO[2022-08-19T10:55:02.420] Time elapsed: 1m45s                          
  cluste_name |      host       | user | port | stage  |    status     | message  
--------------+-----------------+------+------+--------+---------------+----------
  mymogdb     | 192.168.137.131 | omm  | 3000 | launch | start_success | success  
              | 192.168.137.132 | omm  | 3000 | launch | start_success | success  
```

##### 查看状态

安装完查看状态正常

```
# /opt/ptk/ptk cluster status -n mymogdb
[   Cluster State   ]
database_version			: MogDB-MogDB
cluster_name				: mymogdb
cluster_state   			: Normal
current_az      			: AZ_ALL

[  Datanode State   ]
   id  |       ip        | port | user | instance | db_role | state   
-------+-----------------+------+------+----------+---------+---------
  6001 | 192.168.137.131 | 3000 | omm  | dn_6001  | primary | Normal  
  6002 | 192.168.137.132 | 3000 | omm  | dn_6002  | standby | Normal  
```

### 四、PTK扩缩容

扩缩容使用scale-in、scale-out命令进行操作，操作前先使用cluster status查看确认集群，参考上一步。

#### 测试缩容

对刚才安装的一主一备进行节点删除，删除备节点缩容后将变成单机。

使用scale-in指定要删除备机的IP进行缩容

```
# /opt/ptk/ptk cluster -n mymogdb scale-in -H 192.168.137.132 
...
Would you want delete directory(AppDir,DataDir,ToolDir,LogDir)?[Y|Yes](default=N) y
Would you want clear the env?[Y|Yes](default=N) y
Would you want delete the user?[Y|Yes](default=N) n
...
Scale success.
```

缩容完查看集群状态已经变为单机

```
# /opt/ptk/ptk cluster status -n mymogdb
[   Cluster State   ]
database_version			: MogDB-MogDB
cluster_name				: mymogdb
cluster_state   			: Normal
current_az      			: AZ_ALL

[  Datanode State   ]
   id  |       ip        | port | user | instance | db_role | state   
-------+-----------------+------+------+----------+---------+---------
  6001 | 192.168.137.131 | 3000 | omm  | dn_6001  | Normal  | Normal  
```

#### 测试扩容

使用scale-out接着对单机扩容，增加一个备节点，扩容成一主一备。

scale-out需要接收一个新增节点配置的文件，使用–gen-template生产，然后修改为具体的配置

```
/opt/ptk/ptk cluster -n mymogdb scale-out --gen-template > add.yaml
```

修改完的add.yaml文件内容如下：

```
- host: 192.168.137.132
  db_port: 3000
  role: standby
  ssh_option:
    host: 192.168.137.132
    port: 22
    user: root
    password: "pTk6ZDA2NmFmOTQ8RDxCPUNBP19NSnVKVFV1eFJ6SG5wOElmVC1uS3pqbWNDSGh1bFJzNEZqSHlGQTRuRWs="
```

使用scale-out命令进行缩容

```
# /opt/ptk/ptk cluster -n mymogdb --skip-check-os --skip-create-user scale-out -c add.yaml 
scale [stage=preCheck]
...
Scale success.
```

注意这里进行扩容时会联网去下载MogDB安装包，本文是在离线环境进行，可以在.ptk目录的cache子目录把安装包提前拷贝进去。

```
# ll /root/.ptk/cache/
total 136004
-rw-r--r-- 1 omm dbgrp 139264406 Aug  6 11:30 MogDB-3.0.1-CentOS-x86_64.tar.gz
```

拷贝时需要覆盖，可能会存在一个零字节的文件，因为联网下载没有成功。

缩容完检查状态

```
# /opt/ptk/ptk cluster status -n mymogdb
[   Cluster State   ]
database_version			: MogDB-MogDB
cluster_name				: mymogdb
cluster_state   			: Normal
current_az      			: AZ_ALL

[  Datanode State   ]
   id  |       ip        | port | user | instance | db_role | state   
-------+-----------------+------+------+----------+---------+---------
  6001 | 192.168.137.131 | 3000 | omm  | dn_6001  | primary | Normal  
  6002 | 192.168.137.132 | 3000 | omm  | dn_6002  | standby | Normal  
```

### 总结

PTK进行安装、卸载、扩缩容非常便捷，期待下一版本支持数据库升级的功能。
