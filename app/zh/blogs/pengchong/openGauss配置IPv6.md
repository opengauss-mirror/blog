---
title: 'openGauss配置IPv6'

date: '2022-04-02'

category: 'blog'
tags: ['openGauss配置IPv6']

archives: '2022-04'

author: '彭冲'

summary: 'openGauss配置IPv6'

img: '/zh/blogs/pengchong/title/img9.png'

times: '11:29'
---

# openGauss 配置 IPv6

openGauss/MogDB 支持多种网络接口，假如我们想在支持 IPv6 的网络上部署使用，只需简单操作即可，本文将介绍在 Centos 上如何配置使用。

### 关于 IPv6

IPv6(Internet Protocol Version 6)，是 Internet Engineering Task Force (IETF)设计用于替代 IPv4 的下一代 IP 协议，使用 IPv6 能解决网络地址资源数量的问题。

我们使用 ipconfig /all 命令查看 windows 网络接口，会看到 IPv6 地址。

```
以太网适配器 以太网 7:

   本地链接 IPv6 地址. . . . . . . . : fe80::828a:5e20:53cb:7719%6(首选)
   IPv4 地址 . . . . . . . . . . . . : 192.168.137.68(首选)
```

Centos 下使用 ip addr 命令查看 linux 网络接口，也会看到 IPv6 地址。

```
# ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:b5:54:32 brd ff:ff:ff:ff:ff:ff
    inet 192.168.137.101/24 brd 192.168.137.255 scope global enp0s3
       valid_lft forever preferred_lft forever
    inet6 fe80::a00:27ff:feb5:5432/64 scope link
       valid_lft forever preferred_lft forever
```

### IPv6 分类

#### 1.本地关联 IPv6

本地关联的 IPv6，是以 fe80 开头,与网卡的物理地址(MAC 地址)有关，不需要通过 DHCP 自动分配或者手工设置。

#### 2.全局 IPv6

如果需要跨网络或者跨路由器进行通信，则需要使用全局的 IPv6。

### 创建全局 IPv6

创建全局 IPv6 有多种的方式，例如 DHCPv6、Stateless address autoconfiguration (SLAAC) 以及手工配置。

手工配置可以使用 ip 命令来配置：

```
# ip -6 addr add 2022:1:0:0::db1/64 dev enp0s3
```

或者使用 ifconfig 命令来配置：

```
# ifconfig enp0s3 inet6 add 2022:1:0:0::db1/64
```

通过上面任意一种方式配置后，可以看到 enp0s3 网络接口将增加一个 inet6，并且是 global 属性的。

```
# ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:b5:54:32 brd ff:ff:ff:ff:ff:ff
    inet 192.168.137.101/24 brd 192.168.137.255 scope global enp0s3
       valid_lft forever preferred_lft forever
    inet6 2022:1::db1/64 scope global
       valid_lft forever preferred_lft forever
    inet6 fe80::a00:27ff:feb5:5432/64 scope link
       valid_lft forever preferred_lft forever
```

注意：上面 IPv6 字符串配置中有 db1，这符合 HEX 字符规则，非 HEX 字符则不允许设置，比如我们把 db 换成 dx，则会提示下面的错误信息。

```
# ifconfig enp0s3 inet6 add 2022:1:0:0::dx1/64
2022:1:0:0::dx1: Resolver Error 0 (no error)
```

### IPv6 连通性测试

在本地使用 ping6 进行连通性测试，先使用全局 IPv6 进行测试

```
# ping6 2022:1::db1 -c3
PING 2022:1::db1(2022:1::db1) 56 data bytes
64 bytes from 2022:1::db1: icmp_seq=1 ttl=64 time=0.027 ms
64 bytes from 2022:1::db1: icmp_seq=2 ttl=64 time=0.047 ms
64 bytes from 2022:1::db1: icmp_seq=3 ttl=64 time=0.028 ms

--- 2022:1::db1 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2000ms
rtt min/avg/max/mdev = 0.027/0.034/0.047/0.009 ms
```

再使用本地关联 IPv6 进行测试，此时需要带上网络接口名称

```
# ping6 fe80::a00:27ff:feb5:5432%enp0s3 -c3
PING fe80::a00:27ff:feb5:5432%enp0s3(fe80::a00:27ff:feb5:5432%enp0s3) 56 data bytes
64 bytes from fe80::a00:27ff:feb5:5432%enp0s3: icmp_seq=1 ttl=64 time=0.040 ms
64 bytes from fe80::a00:27ff:feb5:5432%enp0s3: icmp_seq=2 ttl=64 time=0.041 ms
64 bytes from fe80::a00:27ff:feb5:5432%enp0s3: icmp_seq=3 ttl=64 time=0.022 ms

--- fe80::a00:27ff:feb5:5432%enp0s3 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2000ms
rtt min/avg/max/mdev = 0.022/0.034/0.041/0.010 ms
```

### openGauss/MogDB 配置 IPv6

编辑 postgresql.conf 文件，修改监听参数

```
listen_addresses = '*'
```

修改完后重启服务，数据库将监听本机所有的网络接口。

编辑 pg_hba.conf 文件，添加数据库客户端连接的 IPv6 认证条目

```
host    all             all             fe80::a00:27ff:feb5:5432/128           md5
host    all             all             2022:1::db1/128         md5
```

### 使用 gsql 客户端进行测试

1.使用本地关联 IPv6 进行测试，此时需要带上网络接口名称

```
$ gsql -h fe80::a00:27ff:feb5:5432%enp0s3 -Umoguser postgres -r -p6432

postgres=> \conninfo
You are connected to database "postgres" as user "moguser" on host "fe80::a00:27ff:feb5:5432%enp0s3" at port "6432".
postgres=> SELECT datname,usename, client_addr FROM pg_stat_activity where usename='moguser';
 datname  | usename |       client_addr
----------+---------+--------------------------
 postgres | moguser | fe80::a00:27ff:feb5:5432
(1 row)
```

2.使用全局 IPv6 进行测试

```
$ gsql -h 2022:1::db1 -Umoguser postgres -r -p6432

postgres=> \conninfo
You are connected to database "postgres" as user "moguser" on host "2022:1::db1" at port "6432".
postgres=> SELECT datname,usename, client_addr FROM pg_stat_activity where usename='moguser';
 datname  | usename | client_addr
----------+---------+-------------
 postgres | moguser | 2022:1::db1
(1 row)
```

### 使用 java jdbc 进行测试

通过 java 程序 test.jar 包进行测试，test.jar 需要三个入参，分别是 jdbc url、jdbc username、jdbc password。

1.使用普通的 IPv4 进行测试

```
$ java -jar test.jar jdbc:postgresql://192.168.137.101:6432/postgres moguser Admin@1234
```

执行结果如下，可以看到数据库连接测试成功

```
Input jdbc url:jdbc:postgresql://192.168.137.101:6432/postgres
Input jdbc username:moguser
Connection test successfully.
```

2.使用本地关联 IPv6 进行测试，进行测试

```
$ java -jar test.jar jdbc:postgresql://fe80::a00:27ff:feb5:5432:6432/postgres moguser Admin@1234
```

执行结果如下，可以看到数据库连接测试成功

```
Input jdbc url:jdbc:postgresql://fe80::a00:27ff:feb5:5432:6432/postgres
Input jdbc username:moguser
Connection test successfully
```

3.使用全局 IPv6 进行测试

```
$ java -jar test.jar jdbc:postgresql://2022:1::db1:6432/postgres moguser Admin@1234
```

执行结果如下，可以看到数据库连接测试成功

```
Input jdbc url:jdbc:postgresql://2022:1::db1:6432/postgres
Input jdbc username:moguser
Connection test successfully.
```

### 总结

1.openGauss/MogDB 配置 IPv6 只需简单修改 listen_addresses = ‘\*’ 即可。 2.使用 gsql 客户端进行连接时，本地关联 IPv6 还需要使用网络接口名进行访问，全局 IPv6 不需要。 3.使用 jdbc 客户端进行连接时，无论是本地关联 IPv6 还是全局 IPv6，直接使用地址即可。
