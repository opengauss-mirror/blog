---
title: '资源池化multipath多路径冗余配置'
date: '2024-1-2'
category: 'blog'
tags: ['资源池化multipath多路径冗余配置']
archives: '2024-1-2'
author: 'Carl'
summary: '资源池化multipath多路径冗余配置'
times: '9:30'
---

# 资源池化multipath多路径冗余配置

-   前置条件
    -   Dorado存储设备
    -   x86服务器两台
    -   所有设备处在同一网段

-   组网方式
    
    <table>
    <tbody>
    <tr>
        <td rowspan='2'>主机</td>
        <td>存储网络0</td>
        <td>30.0.0.35</td>
        <td rowspan='2'>Dorado存储设备</td>
        <td rowspan='2'>30.0.0.2</td>
    </tr>
        <td>存储网络1</td>
        <td>30.0.0.36</td>
    <tr>
        <td rowspan='2'>备机</td>
        <td>存储网络0</td>
        <td>30.0.0.24</td>
        <td rowspan='2'>Dorado存储设备</td>
        <td rowspan='2'>30.0.0.2</td>
    </tr>
        <td>存储网络1</td>
        <td>30.0.0.35</td>
    </tbody>
    </table>

-   操作步骤
    1. 安装需要的软件
        ```
        yum install -y open-iscsi
        yum install -y libvirt-daemon-driver-storage-iscsi
        ```

    2. 配置网络

        ```
        ip a
        1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
            link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
            inet 127.0.0.1/8 scope host lo
            valid_lft forever preferred_lft forever
            inet6 ::1/128 scope host 
            valid_lft forever preferred_lft forever
        2: enp2s0f0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc mq state DOWN group default qlen 1000
            link/ether 40:7d:0f:47:15:25 brd ff:ff:ff:ff:ff:ff
        3: enp2s0f1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
            link/ether 40:7d:0f:47:15:26 brd ff:ff:ff:ff:ff:ff
            inet 30.0.0.23/22 brd 30.0.3.255 scope global noprefixroute enp2s0f1
            valid_lft forever preferred_lft forever
            inet6 fe80::3aad:f391:9183:4e58/64 scope link noprefixroute 
            valid_lft forever preferred_lft forever
        4: enp2s0f2: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc mq state DOWN group default qlen 1000
            link/ether 40:7d:0f:47:15:27 brd ff:ff:ff:ff:ff:ff
        6: enp2s0f3: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc mq state DOWN group default qlen 1000
            link/ether 40:7d:0f:47:15:28 brd ff:ff:ff:ff:ff:ff
        7: enp129s0f1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
            link/ether 40:7d:0f:fd:d4:59 brd ff:ff:ff:ff:ff:ff
            inet 20.20.20.131/24 brd 20.20.20.255 scope global noprefixroute enp129s0f1
            valid_lft forever preferred_lft forever
            inet6 fe80::d721:e6a5:d76e:517c/64 scope link noprefixroute 
            valid_lft forever preferred_lft forever
        8: enp5s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
            link/ether 78:b4:6a:3f:fc:fe brd ff:ff:ff:ff:ff:ff
            inet 30.0.0.34/22 brd 30.0.3.255 scope global noprefixroute enp5s0
            valid_lft forever preferred_lft forever
            inet6 fe80::755e:4614:53e5:9f9b/64 scope link noprefixroute 
            valid_lft forever preferred_lft forever
        9: enp6s0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc mq state DOWN group default qlen 1000
            link/ether 78:b4:6a:3f:fc:ff brd ff:ff:ff:ff:ff:ff
        10: enp7s0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc mq state DOWN group default qlen 1000
            link/ether 78:b4:6a:3f:fd:00 brd ff:ff:ff:ff:ff:ff
        11: enp8s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
            link/ether 78:b4:6a:3f:fd:01 brd ff:ff:ff:ff:ff:ff
            inet 30.0.0.36/22 brd 30.0.3.255 scope global noprefixroute enp8s0
            valid_lft forever preferred_lft forever
            inet6 fe80::1665:d97d:9d81:85d3/64 scope link noprefixroute 
            valid_lft forever preferred_lft forever
        ```
        在这里我们使用的网卡为enp5s0和enp8s0
        从linux服务器测试下跟存储的连通性，发现只有一个网卡可以通
        ```
        ping 30.0.0.2 -I enp5s0
        ping 30.0.0.2 -I enp8s0
        ``` 
        这个是因为linux默认启用了反向路由检查，我们需要关闭反向路由检查
        ```
        echo 0 > /proc/sys/net/ipv4/conf/all/rp_filter
        echo 0 > /proc/sys/net/ipv4/conf/enp5s0/rp_filter
        echo 0 > /proc/sys/net/ipv4/conf/enp8s0/rp_filter
        ```
        这样操作是临时生效，重启会丢失，也可以通过写入/etc/sysctl.conf里并保存退出
        ```
        net.ipv4.conf.all.rp_filter = 0
        net.ipv4.conf.default.rp_filter = 0
        net.ipv4.conf.enp5s0.rp_filter = 0
        net.ipv4.conf.enp8s0.rp_filter = 0
        ```
        执行sysctl -p生效
        再次测试连通性，显示两个机器的四张网卡与存储已经互通

    3.  连接磁阵
        发现磁阵
        ```
        iscsiadm -m discovery -t sendtargets -p 30.0.0.2 -I enp5s0
        ```
        两张网卡分别登录磁阵
        ```
        iscsiadm -m node -T iqn.2006-08.com.huawei:oceanstor:2100eca1d135234b::22004:30.0.0.2 -p 30.0.0.2 -I enp5s0 -l
        iscsiadm -m node -T iqn.2006-08.com.huawei:oceanstor:2100eca1d135234b::22004:30.0.0.2 -p 30.0.0.2 -I enp8s0 -l
        ```
        启动multipath
        ```
        systemctl enable multipath
        systemctl start multipath
        ```
        这个时候我们在Dorado控制平台deveice manage上添加启动器和主机（这个时候我们会自动发现启动器），将启动器与主机绑定
        映射一块lun到机器进行测试
        映射完毕，在机器上使用脚本进行扫描
        ```
        rescan-scsi-bus.sh 
        ```
        没有做冗余的情况
        ```
        [root@bclinux131 ~]# multipath -ll
        ST4000NM0035-1V4107_ZC1ATF68 dm-3 ATA,ST4000NM0035-1V4
        size=3.6T features='0' hwhandler='0' wp=rw
        `-+- policy='service-time 0' prio=1 status=active
        `- 0:0:1:0  sdb 8:16 active ready running
        ST4000NM0035-1V4107_ZC1AKTMA dm-4 ATA,ST4000NM0035-1V4
        size=3.6T features='0' hwhandler='0' wp=rw
        `-+- policy='service-time 0' prio=1 status=active
        `- 0:0:2:0  sdc 8:32 active ready running
        36eca1d110035234b0262b30400000018 dm-5 HUAWEI,XSG1
        size=100G features='1 queue_if_no_path' hwhandler='0' wp=rw
        `-+- policy='service-time 0' prio=1 status=active
        `- 11:0:0:1 sdd 8:48 active ready running
        ```
        现在我们做了冗余之后查处的来的状态为
        ```
        [root@bclinux131 ~]# multipath -ll
        ST4000NM0035-1V4107_ZC1ATF68 dm-3 ATA,ST4000NM0035-1V4
        size=3.6T features='0' hwhandler='0' wp=rw
        `-+- policy='service-time 0' prio=1 status=active
        `- 0:0:1:0  sdb 8:16 active ready running
        ST4000NM0035-1V4107_ZC1AKTMA dm-4 ATA,ST4000NM0035-1V4
        size=3.6T features='0' hwhandler='0' wp=rw
        `-+- policy='service-time 0' prio=1 status=active
        `- 0:0:2:0  sdc 8:32 active ready running
        36eca1d110035234b028ecdd400000019 dm-7 HUAWEI,XSG1
        size=100G features='1 queue_if_no_path' hwhandler='0' wp=rw
        `-+- policy='service-time 0' prio=1 status=active
        |- 11:0:0:1 sdd 8:48 active ready running
        `- 12:0:0:1 sde 8:64 active ready running
        ```
        可以看出，我们的dm-7这个盘与磁阵连接有两条链路，出现了两个子盘符
        我们也可以使用iscsiadm来查看机器与存储的链路
        ```
        [root@bclinux131 ~]# iscsiadm -m discovery -t st -p 30.0.0.2
        30.0.0.2:3260,8197 iqn.2006-08.com.huawei:oceanstor:2100eca1d135234b::22004:30.0.0.2
        30.0.0.2:3260,8197 iqn.2006-08.com.huawei:oceanstor:2100eca1d135234b::22004:30.0.0.2
        ```
        在这里可以查询到两条链路
        
   
    4. 后续我们使用正常的openGauss资源池化安装流程即可，盘符填写为dm-*

***作者：Carl***
