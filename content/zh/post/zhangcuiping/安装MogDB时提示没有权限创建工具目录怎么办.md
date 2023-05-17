+++

title = "安装MogDB时提示没有权限创建工具目录怎么办" 

date = "2023-04-30" 

tags = ["openGauss安装"] 

archives = "2023-04" 

author = "张翠娉" 

summary = "安装MogDB时提示没有权限创建工具目录怎么办"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "14:20"

+++

# 安装MogDB时提示没有权限创建工具目录怎么办？

**背景介绍**：

使用PTK安装MogDB时，提示没有权限创建工具目录。

配置文件内容：

```
#config.yaml

global:
    cluster_name: mogdb-z
    user: omm-z
    group: omm-z
    base_dir: /opt/mogdb
db_servers:

   - host: 127.0.0.1
     db_port: 26007
```

**报错内容及原因**：

根据报错信息可知，配置文件中指定的用户名omm-z没有数据库目录/opt/mogdb/的权限。

```
[root@hostname mogdb]# ptk install -f config.yaml --pkg MogDB-3.0.0-openEuler-arm64.tar.gz
INFO[2023-05-17T10:16:48.511] PTK Version: 0.7.9 release                   
INFO[2023-05-17T10:16:48.511] load config from config.yaml                 
? 如果您选择继续安装软件,
就代表您接受该软件的许可协议.

  [Y]: 接受并继续安装
  [C]: 显示协议内容
  [N]: 终止安装并退出

请输入 (默认 [Y]):  y
Cluster Name: "mogdb-z"
+--------------+--------------+--------------+-------+---------+-----------------+----------+
| az(priority) |      ip      | user(group)  | port  |  role   |    data dir     | upstream |
+--------------+--------------+--------------+-------+---------+-----------------+----------+
| AZ1(1)       | 172.16.0.245 | omm-z(omm-z) | 26007 | primary | /opt/mogdb/data | -        |
+--------------+--------------+--------------+-------+---------+-----------------+----------+
? 集群配置是否正确(default=N) Yes
INFO[2023-05-17T10:16:53.487] start check os ...                           
INFO[2023-05-17T10:16:53.497] prechecking dependent tools...               
INFO[2023-05-17T10:16:53.549] [172.16.0.245][omm-z] platform: kylin_V10_64bit 
INFO[2023-05-17T10:16:53.552] [172.16.0.245][omm-z] kernel version: 4.19.90-23.8.v2101.ky10.aarch64 
WARN[2023-05-17T10:16:53.564] [172.16.0.245][omm-z] not found network conf file for enp4s0 in dir /etc/sysconfig/network-scripts, skip check bonding 
INFO[2023-05-17T10:16:53.584] [172.16.0.245][omm-z] locale: LANG=en_US.UTF-8 
INFO[2023-05-17T10:16:56.022] [172.16.0.245][omm-z] timezone: +0800        
WARN[2023-05-17T10:16:56.081] [172.16.0.245][omm-z] vm.min_free_kbytes=3270976, expect 3281248 
INFO[2023-05-17T10:16:56.120] [172.16.0.245][omm-z] check kernel.core_pattern 
INFO[2023-05-17T10:16:56.126] [172.16.0.245][omm-z] check removeIPC value  
WARN[2023-05-17T10:16:56.142] [172.16.0.245][omm-z] device(/dev/vda) readahead value=8192, expect 16384. 
WARN[2023-05-17T10:16:56.142] [172.16.0.245][omm-z] device(/dev/vdb) readahead value=8192, expect 16384. 
WARN[2023-05-17T10:16:56.162] [172.16.0.245][omm-z] device(dm-0) 'IO Request'=128, expect 256 
WARN[2023-05-17T10:16:56.162] [172.16.0.245][omm-z] device(dm-1) 'IO Request'=128, expect 256 
INFO[2023-05-17T10:16:56.169] [172.16.0.245][omm-z] swap memory 4194240kB, total memory 65624960kB 
INFO[2023-05-17T10:16:56.173] [172.16.0.245][omm-z] check port 26007       
INFO[2023-05-17T10:16:56.186] [172.16.0.245][omm-z] port 26007 is free     
INFO[2023-05-17T10:16:56.186] all checkers finished                        
INFO[2023-05-17T10:16:56.186] time elapsed: 3s                             
INFO[2023-05-17T10:16:56.186] check os success                             
INFO[2023-05-17T10:16:56.186] start check distro ...                       
INFO[2023-05-17T10:16:56.186] check distro success                         
INFO[2023-05-17T10:16:56.186] start check user ...                         
INFO[2023-05-17T10:16:56.192] check user success                           
INFO[2023-05-17T10:16:56.192] start check port ...                         
INFO[2023-05-17T10:16:56.219] check port success                           
INFO[2023-05-17T10:16:56.219] [172.16.0.245][omm-z] create os user omm-z, group omm-z 
INFO[2023-05-17T10:16:56.933] [172.16.0.245][omm-z] set ulimit configs     
INFO[2023-05-17T10:16:56.936] [172.16.0.245][omm-z] make user omm-z's dir(s): /opt/mogdb 
INFO[2023-05-17T10:16:57.404] start prepare installation package ...       
INFO[2023-05-17T10:16:57.404] installation package is ready                
INFO[2023-05-17T10:16:57.404] start validate installation package ...      
INFO[2023-05-17T10:17:00.630] db product: MogDB, version: 3.0.0, number: 92.605, commit_id: 62408a0f 
INFO[2023-05-17T10:17:00.630] validate installation package success        
INFO[2023-05-17T10:17:00.630] start complete the configuration ...         
? 请输出数据库密码(8~15 个字符, 3 种类型):  [/ for help] ********
? 请再次输入数据库初始密码:  ********
INFO[2023-05-17T10:17:08.748] complete the configuration success           
INFO[2023-05-17T10:17:08.750] start distribute installation package ...    
> upload MogDB-3.0.0-openEule...: 128.13 MiB / 128.13 MiB [-----------------] 100.00% 237.64 MiB p/s 700ms
INFO[2023-05-17T10:17:09.613] distrubite packages success                  
INFO[2023-05-17T10:17:09.613] start setup db ...                           
INFO[2023-05-17T10:17:09.694] [172.16.0.245][omm-z] set user omm-z profiles 
INFO[2023-05-17T10:17:10.054] [172.16.0.245][omm-z] make user omm-z's dir(s): /opt/mogdb/tool,/opt/mogdb/tool/ptk_tool/bin 
ERRO[2023-05-17T10:17:10.297] [172.16.0.245][omm-z] task execute failed
Host: 172.16.0.245
Task: make user omm-z's dir(s): /opt/mogdb/tool,/opt/mogdb/tool/ptk_tool/bin
Error: [PTK-50000] execute error: mkdir /opt/mogdb/tool: Process exited with status 1: mkdir: cannot create directory ‘/opt/mogdb/tool’: Permission denied 
ERRO[2023-05-17T10:17:10.297] [PTK-50000] execute error: mkdir /opt/mogdb/tool: Process exited with status 1: mkdir: cannot create directory ‘/opt/mogdb/tool’: Permission denied 
INFO[2023-05-17T10:17:10.297] start rollback ...                           
INFO[2023-05-17T10:17:10.752] rollback success                             
INFO[2023-05-17T10:17:10.753] time elapsed: 21s                            

  cluste_name |     host     | user  | port  |      status      |                                                                        message                                                                         
--------------+--------------+-------+-------+------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------
  mogdb-z     | 172.16.0.245 | omm-z | 26007 | rollback_success | [PTK-50000] execute error: mkdir /opt/mogdb/tool: Process exited with status 1: mkdir: cannot create directory ‘/opt/mogdb/tool’: Permission denied  
[PTK-50000] execute error: mkdir /opt/mogdb/tool: Process exited with status 1: mkdir: cannot create directory ‘/opt/mogdb/tool’: Permission denied
```

**解决办法**：

将配置文件的base_dir设置为/home/omm-z/mogdb，重新执行安装即可解决问题。
