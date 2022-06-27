+++

title = "MogDB 操作系统优化指南" 

date = "2022-06-27" 

tags = ["MogDB 操作系统优化指南"] 

archives = "2022-06" 

author = "云和恩墨" 

summary = "MogDB 操作系统优化指南"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# MogDB 操作系统优化指南

本文出处：[https://www.modb.pro/db/413280](https://www.modb.pro/db/413280)

在性能调优过程中，可以根据实际业务情况修改关键操作系统（OS）配置参数，以提升MogDB数据库的性能。

## 前提条件

需要用户使用gs_check检查操作系统参数结果是否和建议值保持一致，如果不一致，用户可根据实际业务情况去手动修改。

## 内存相关参数设置

配置"sysctl.conf"文件，修改内存相关参数vm.extfrag_threshold为1000（参考值），如果文件中没有内存相关参数，可以手动添加。

```
vim /etc/sysctl.conf 
```

修改完成后，请执行如下命令，使参数生效。

```
sysctl -p 
```

## 网络相关参数设置

- 配置"sysctl.conf"文件，修改网络相关参数，如果文件中没有网络相关参数，可以手动添加。详细说明请参见[表1](https://docs.mogdb.io/zh/mogdb/v2.1/1-optimizing-os-parameters#1)。

  ```
  vim /etc/sysctl.conf
  ```
  
  在修改完成后，请执行如下命令，使参数生效。

  ```
  参数名参考值说明
  net.ipv4.tcp_timestamps1表示开启TCP连接中TIME-WAIT sockets的快速回收，默认为0，表示关闭，1表示打开。
  net.ipv4.tcp_mem94500000 915000000 927000000第一个数字表示，当tcp使用的page少于 94500000 时，kernel不对其进行任何的干预。第二个数字表示，当tcp使用的page超过 915000000 时，kernel会进入"memory pressure"压力模式。第三个数字表示，当tcp使用的pages超过 927000000 时，就会报: Out of socket memory。
  net.ipv4.tcp_max_orphans3276800最大孤儿套接字（orphan sockets）数。
  net.ipv4.tcp_fin_timeout60表示系統默认的TIMEOUT时间。
  net.ipv4.ip_local_port_range26000 65535TCP和UDP能够使用的port段。
  ```
  
- 设置10GE网卡最大传输单元（MTU），使用ifconfig命令设置。10GE网卡推荐设置为8192，可提升网络带宽利用率。

  示例:

  ```
    #ifconfig ethx mtu 8192
  #ifconfig ethx
    ethx   Link encap:Ethernet  HWaddr XX:XX:XX:XX:XX:XX
    inet addr:xxx.xxx.xxx.xxx  Bcast:xxx.xxx.xxx.xxx  Mask:xxx.xxx.xxx.0
    inet6 addr: fxxx::9xxx:bxxx:xxxa:1d18/64 Scope:Link
    UP BROADCAST RUNNING MULTICAST  MTU:8192  Metric:1
    RX packets:179849803 errors:0 dropped:0 overruns:0 frame:0
    TX packets:40492292 errors:0 dropped:0 overruns:0 carrier:0
    collisions:0 txqueuelen:1000
    RX bytes:17952090386 (17120.4 Mb)  TX bytes:171359670290 (163421.3 Mb)
  Copy说明:ethx为10GE数据库内部使用的业务网卡。第一条命令设置MTU，第二条命令验证是否设置成功，粗体部分为MTU的值。需使用root用户设置。
  ```

- 设置10GE网卡接收（rx）、发送队列（tx）长度，使用ethtool工具设置。10GE网卡推荐设置为4096，可提升网络带宽利用率。

  示例:

  ```
  # ethtool -G ethx rx 4096 tx 4096
  # ethtool -g ethx
  Ring parameters for ethx:
  Pre-set maximums:
  RX:             4096
  RX Mini:        0
  RX Jumbo:       0
  TX:             4096
  Current hardware settings:
  RX:             4096
  RX Mini:        0
  RX Jumbo:       0
  TX:             4096
  说明:ethx为10GE数据库内部使用的业务网卡。第一条命令设置网卡接收、发送队列长度，第二条命令验证是否设置成功，示例的输出表示设置成功。需使用root用户设置。
  ```

## I/O相关参数设置

设置hugepage属性。通过如下命令，关闭透明大页。。

```
echo never > /sys/kernel/mm/transparent_hugepage/enabled echo never > /sys/kernel/mm/transparent_hugepage/defrag 
```

修改完成后，请执行如下命令，使参数生效。

```
reboot
```
