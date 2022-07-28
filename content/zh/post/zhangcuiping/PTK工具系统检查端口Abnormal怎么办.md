+++

title = "PTK工具系统检查端口Abnormal怎么办？" 

date = "2022-07-08" 

tags = ["PTK工具系统检查端口Abnormal怎么办？"] 

archives = "2022-07" 

author = "张翠娉" 

summary = "PTK工具系统检查端口Abnormal怎么办？"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "16:50"
+++

# PTK工具系统检查端口Abnormal怎么办？



**背景介绍**：

PTK (Provisioning Toolkit)是一款针对 MogDB 数据库开发的软件安装和运维工具，旨在帮助用户更便捷地安装部署MogDB数据库。

如果用户想要运行 MogDB 或者 MogDB 的相关组件时，仅需要执行一行命令即可实现。

PTK 支持安装 MogDB 的操作系统众多，达到22个，后期还会不断增多。

本次安装PTK时遇到如下报错。

**报错内容**：

```bash
[root@mogdb-kernel-0002 ~]# ptk checkos -f config.yaml
INFO[2022-07-27T09:14:49.863] local ip: 172.16.0.245                       
INFO[2022-07-27T09:14:49.879] prechecking dependent tools...               
INFO[2022-07-27T09:14:49.897] platform: kylin_V10_64bit                     host=172.16.0.245
INFO[2022-07-27T09:14:49.900] kernel version: 4.19.90-23.8.v2101.ky10.aarch64  host=172.16.0.245
INFO[2022-07-27T09:14:49.977] locale: LANG=zh_CN.UTF-8                      host=172.16.0.245
INFO[2022-07-27T09:14:49.981] timezone: +0800                               host=172.16.0.245
INFO[2022-07-27T09:14:49.984] swap memory 4194240kB, total memory 65624960kB  host=172.16.0.245
WARN[2022-07-27T09:14:50.028] vm.min_free_kbytes=3270976, expect 3281248    host=172.16.0.245
INFO[2022-07-27T09:14:50.070] check kernel.core_pattern                     host=172.16.0.245
INFO[2022-07-27T09:14:50.076] check removeIPC value                         host=172.16.0.245
WARN[2022-07-27T09:14:50.098] device(/dev/vda) readahead value=8192, expect 16384.  host=172.16.0.245
WARN[2022-07-27T09:14:50.098] device(/dev/vdb) readahead value=8192, expect 16384.  host=172.16.0.245
WARN[2022-07-27T09:14:50.115] device(dm-0) 'IO Request'=128, expect 256     host=172.16.0.245
WARN[2022-07-27T09:14:50.115] device(dm-1) 'IO Request'=128, expect 256     host=172.16.0.245
WARN[2022-07-27T09:14:50.130] not found network conf file for enp4s0 in dir /etc/sysconfig/network-scripts, skip check bonding  host=172.16.0.245
INFO[2022-07-27T09:14:52.788] check port 28000                              host=172.16.0.245
INFO[2022-07-27T09:14:53.013] port 28000 is occupied                            host=172.16.0.245
INFO[2022-07-27T09:14:53.013] all checkers finished                        
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
  A10.Check_IO_Configure            | OK       
  A10.Check_IO_Request              | Warning  
  A10.Check_Asynchronous_IO_Request | OK       
  A11.Check_Network_Configure       | OK       
  A12.Check_Time_Consistency        | OK       
  A13.Check_Firewall_Service        | OK       
  A14.Check_THP_Service             | OK       
  A15.Check_Dependent_Package       | OK       
  A16.Check_CPU_Instruction_Set     | OK       
  A17.Check_Port                    | Abnormal      
```

**报错原因**：

配置文件中的端口已被占用。

**解决办法**：

打开配置文件，更换可用端口后，重新执行系统检查，确保输出的检查结果均为 `OK` 或者 `Warning` 。