+++

title = "用PTK单机安装opengauss 5.0.0企业版" 

date = "2023-07-21" 

tags = ["ptk"] 

archives = "2023-07" 

author = "云和恩墨-郭欢" 

summary = "用PTK单机安装opengauss 5.0.0企业版"

img = "/zh/post/guohuan/title/img31.png" 

times = "10:20"

+++

PTK (Provisioning Toolkit)是云和恩墨针对 MogDB 数据库开发的软件安装和运维工具，旨在帮助用户更便捷地安装部署MogDB数据库，同时也支持安装openguass。

本文介绍如何在**x86架构的CentOS机器**上通过PTK单机安装opengauss 5.0.0企业版。

1. 安装PTK

```
curl --proto '=https' --tlsv1.2 -sSf https://cdn-mogdb.enmotech.com/ptk/install.sh | sh
```

2. 创建opengauss目录，编辑配置文件

```
mkdir /data/opengauss500
cd /data/opengauss500
vim config500.yaml
```

配置文件内容如下：

```
# config500.yaml
global:
    cluster_name: opengauss
    user: omm
    group: omm
    base_dir: /data/opengauss500
db_servers:
  - host: 127.0.0.1
    db_port: 15433
```

3. 检查操作系统配置

```
ptk checkos -f config500.yaml
```

确保结果中没有abnormal项

```
# Check Results
                Item                |  Level
------------------------------------+----------
  A1.Check_OS_Version               | OK
  A2.Check_Kernel_Version           | OK
  A3.Check_Unicode                  | OK
  A4.Check_TimeZone                 | OK
  A5.Check_Swap_Memory_Configure    | OK
  A6.Check_SysCtl_Parameter         | Warning
  A7.Check_FileSystem_Configure     | OK
  A8.Check_Disk_Configure           | OK
  A9.Check_BlockDev_Configure       | Warning
  A9.Check_Logical_Block            | OK
  A10.Check_Asynchronous_IO_Request | OK
  A10.Check_IO_Configure            | Warning
  A10.Check_IO_Request              | OK
  A11.Check_Network_Configure       | OK
  A12.Check_Time_Consistency        | OK
  A13.Check_Firewall_Status         | OK
  A14.Check_THP_Status              | OK
  A15.Check_Dependent_Package       | OK
  A16.Check_CPU_Instruction_Set     | OK
  A17.Check_Port                    | OK
  A18.Check_Selinux                 | OK
  A19.Check_User_Ulimit             | OK
Total count 22, abnormal count 0, warning count 3
```

如果有 `Abnormal` 检查项，ptk 会自动生成一个`root_fix_***.sh`文件，可通过 `sh root_fix_***.sh` 命令快速修正系统参数。

4. 进行安装（其他cpu架构及操作系统需替换下载路径）

```
ptk install -f config500.yaml -p https://opengauss.obs.cn-south-1.myhuaweicloud.com/5.0.0/x86/openGauss-5.0.0-CentOS-64bit-all.tar.gz
```

安装成功显示如下信息

```
cluste_name |    host    | user | port  |    status     | message
--------------+------------+------+-------+---------------+----------
  opengauss   | xxx.xx.x.x | omm  | 15433 | start_success | success
```

5. 登录数据库

```
[root@localhost opengauss500]# su - omm
[omm@localhost ~]$ gsql -r
gsql ((openGauss 5.0.0 build a07d57c3) compiled at 2023-03-29 03:07:56 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=#
```

通过PTK安装openGauss比gs_om方式安装更简单快捷，更多关于ptk的信息请参考官方文档：https://docs.mogdb.io/zh/ptk/v0.8/overview