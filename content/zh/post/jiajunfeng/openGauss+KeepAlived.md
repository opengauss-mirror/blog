+++

title = "openGauss+KeepAlived" 

date = "2021-03-08" 

tags = ["openGauss+KeepAlived"] 

archives = "2021-03" 

author = "贾军锋" 

summary = "openGauss+KeepAlived"

img = "/zh/post/jiajunfeng/title/img33.jpg" 

times = "12:30"

+++

# openGauss+KeepAlived<a name="ZH-CN_TOPIC_0000001116503043"></a>

## 实验环境<a name="section14185208151"></a>

操作系统：     CentOS 7.6

数据库版本： openGauss 1.1.0Primary

主机/IP：  opengaussdb1/192.168.1.11  \(openGauss主备已部署完毕\)

Standby 主机/IP： opengaussdb2/192.168.1.12   \(openGauss主备已部署完毕\)

>![](public_sys-resources/icon-note.gif) **说明：** 
>不建议在云环境\(如：华为云\)下搭建Keepalived进行测试，本人在云环境下测试发现，Keepalived的VIP无法在云环境下与其他主机通信，云环境下如何使用该VIP建议咨询云服务厂商。在踩坑之后，选择使用本地的VMWare workstation进行简单测试。

## 安装KeepAlived软件<a name="section194046238188"></a>

```
## 在所有节点执行安装
yum install keepalived -y
```

## 配置keepalived<a name="section072725123311"></a>

>![](public_sys-resources/icon-note.gif) **说明：** 
>采用nopreempt不抢占VIP，主备节点的state均设置为BACKUP。

-   主节点配置文件。

```
# vi /etc/keepalived/keepalived.conf
--------------------------------------------
! Configuration File for keepalived
## 全局定义
global_defs {
  router_id Keepalived_openGauss          #运行 keepalived 服务器的一个标识
  script_user root                        #执行脚本的用户
}

## VRRP实例定义
## 通常如果master服务Down掉后backup会变成master，但是当master服务又好了的时候 master此时会抢占VIP，这样就会发生两次数据库切换。
## 建议使用nopreempt参数设置为非抢占模式，此时主库从故障中恢复后，不会从新的主库抢回VIP，但这需要将master和backup的state都设置成backup。
vrrp_instance VI_1 {
  state BACKUP                            #指定Keepalived的角色(BACKUP需大写)
  interface eth0                          #指定 HA 监测的网络接口
  virtual_router_id 59                    #虚拟路由的数字标识，同一个 vrrp_instance 下，MASTER 和 BACKUP 一致
  nopreempt                               #非抢占模式，主库从故障中恢复后，不会从新的主库抢回VIP
  priority 100                            #优先级，备节点需要适当降低优先级 
  advert_int 1                            #MASTER 和 BACKUP 负载均衡器同步检查的时间间隔（秒）
  authentication {                        #设置验证码和验证类型
      auth_type PASS
      auth_pass 1111
  }
  virtual_ipaddress {                     #设置虚拟 IP 地址，可以设置多个，每个一行
      192.168.1.10
  }
}

## 虚拟服务器定义
virtual_server 192.168.1.10 26000 {        #设置虚拟服务器的 IP 和端口，用空格隔开
  delay_loop 6                             #设置运行情况检查时间，单位是秒
# lb_algo rr                               #负载调度算法(轮询)
# lb_kind DR                               #负载均衡机制(NAT、TUN、DR)
  persistence_timeout 50                   #会话保持时间(秒)
  protocol TCP                             #转发协议类型
   real_server 192.168.1.11 26000 {        #配置服务节点
          weight 100                       #配置服务节点的权重
          notify_down /gauss/failoverdb.sh #故障响应脚本     
          TCP_CHECK {                      #使用TCP_CHECK方式进行健康检查
              connect_timeout 10           #10秒无响应即超时
              delay_before_retry 3         #重试间隔时间
          }
      }
}
```

-   主节点故障切换脚本（仅适用openGauss进程崩溃故障处理，不适用Primary操作系统宕机故障处理）。

```
vi /gauss/failoverdb.sh
--------------------------------------------
#!/bin/bash
echo "Start to failover openGauss database."
pkill keepalived
ssh 192.168.1.12 "su - omm -c 'gs_ctl failover -D /gauss/data/db1'"
ssh 192.168.1.12 "su - omm -c 'gs_om -t refreshconf'"
echo 'Failover operation is completed.'
--------------------------------------------
chmod 764 /gauss/failoverdb.sh
```

-   备节点配置文件。

```
# vi /etc/keepalived/keepalived.conf
--------------------------------------------
! Configuration File for keepalived
## 全局定义
global_defs {
  router_id Keepalived_openGauss          #运行 keepalived 服务器的一个标识
  script_user root                        #执行脚本的用户
}

## VRRP实例定义
## 通常如果master服务Down掉后backup会变成master，但是当master服务又好了的时候 master此时会抢占VIP，这样就会发生两次数据库切换。
## 建议使用nopreempt参数设置为非抢占模式，此时主库从故障中恢复后，不会从新的主库抢回VIP，但这需要将master和backup的state都设置成backup。
vrrp_instance VI_1 {
  state BACKUP                            #指定Keepalived的角色(BACKUP需大写)
  interface eth0                          #指定 HA 监测的网络接口
  virtual_router_id 59                    #虚拟路由的数字标识，同一个 vrrp_instance 下，MASTER 和 BACKUP 一致
  nopreempt                               #非抢占模式，主库从故障中恢复后，不会从新的主库抢回VIP
  priority 60                             #优先级，备节点需要适当降低优先级 
  advert_int 1                            #MASTER 和 BACKUP 负载均衡器同步检查的时间间隔（秒）
  authentication {                        #设置验证码和验证类型
      auth_type PASS
      auth_pass 1111
  }
  virtual_ipaddress {                     #设置虚拟 IP 地址，可以设置多个，每个一行
      192.168.1.10
  }
}

## 虚拟服务器定义
virtual_server 192.168.1.10 26000 {        #设置虚拟服务器的 IP 和端口，用空格隔开
  delay_loop 6                             #设置运行情况检查时间，单位是秒
# lb_algo rr                               #负载调度算法(轮询)
# lb_kind DR                               #负载均衡机制(NAT、TUN、DR)
  persistence_timeout 50                   #会话保持时间(秒)
  protocol TCP                             #转发协议类型
    real_server 192.168.1.12 26000 {       #配置服务节点
          weight 60                        #配置服务节点的权重
          notify_down /gauss/failoverdb.sh #虚拟服务故障响应脚本     
        MISC_CHECK {                       ## 使用 MISC_CHECK 方式自定义脚本做健康检查
            misc_path "/gauss/check.sh"    ## 检测脚本
            misc_timeout   10              ## 执行脚本的超时时间
            misc_dynamic                   ## 根据退出状态码动态调整服务器的权重
            }
      }
}
--------------------------------------------
## 备节点选择MISC_CHECK方式的原因：
##   测试发现，当主节点直接断电宕机后，Keepalived的VIP会漂移至备节点，此时如果使用TCP_CHECK方式做健康检查，会因为备机可读的原因使得VIP:26000连接正常，造成keepalived健康检查的误判。
##   最终导致主节点断电宕机后，备节点虽获取了VIP，但并没有执行openGauss的failover操作，备节点依旧只读，无法对外提供业务。
##   为了纠正这一点，建议使用MISC_CHECK方式自定义脚本，登录主节点做数据库健康检查(简单示例脚本：/gauss/check.sh)
```

-   备节点健康检查脚本\[ ssh登录主节点进行数据库连接检查 \]。

```
vi /gauss/check.sh
-------------------------------------------
ssh 192.168.1.11  "su - omm -c \"gsql -d postgres -p 26000 -t -A -c 'select 1;'\""
-------------------------------------------
```

-   备节点故障切换脚本。

```
vi /gauss/failoverdb.sh
--------------------------------------------
#!/bin/bash
echo "Start to failover openGauss database."
pkill keepalived
su - omm -c "gs_ctl failover -D /gauss/data/db1"
su - omm -c "gs_om -t refreshconf"
echo 'Failover operation is completed.'
--------------------------------------------
chmod 764 /gauss/failoverdb.sh
```

## openGauss配置<a name="section427512612407"></a>

-   修改openGauss侦听地址。

```
$ gs_guc set -I all -N all -c "listen_addresses = '0.0.0.0'"
$ gs_guc set -I all -N all -c "local_bind_address = '0.0.0.0'"
```

-   修改所有节点replconninfo参数（避免端口冲突）。

```
$ vi /gauss/data/db1/postgresql.conf
--------------------------------------------
修改：localport  --> 26011    
修改：remoteport --> 26011
--------------------------------------------
```

-   重启openGauss数据库,并检查服务器状态。

```
## 重启openGauss
[omm@prod db1]$ gs_om -t stop && gs_om -t start

## 检查openGauss状态
[root@opengaussdb1 ~]# su - omm -c "gs_om -t status --detail"
[   Cluster State   ]
cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL
[  Datanode State   ]
node            node_ip         instance                state         |
-----------------------------------------------------------------------
1  opengaussdb1 192.168.1.11    6001 /gauss/data/db1 P Primary Normal | 
2  opengaussdb2 192.168.1.12    6002 /gauss/data/db1 S Standby Normal

## 检查KeepAlived进程状态
[omm@opengaussdb1 ~]$ ps -ef|grep keep|grep -v grep
root      15664      1  0 16:15 ?        00:00:00 /usr/sbin/keepalived -D
root      15665  15664  0 16:15 ?        00:00:00 /usr/sbin/keepalived -D
root      15666  15664  0 16:15 ?        00:00:00 /usr/sbin/keepalived -D

## 检查VIP状态
[root@opengaussdb1 ~]# ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: ens33: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 00:0c:29:da:60:c0 brd ff:ff:ff:ff:ff:ff
    inet 192.168.1.11/24 brd 192.168.1.255 scope global noprefixroute ens33
       valid_lft forever preferred_lft forever
    inet 192.168.1.10/32 scope global ens33               ## VIP：192.168.1.10
       valid_lft forever preferred_lft forever
    inet6 2408:8270:237:ded0:c89c:adab:e7b:8bd6/64 scope global noprefixroute dynamic
       valid_lft 258806sec preferred_lft 172406sec
    inet6 fe80::c4f2:8ad1:200d:ce9b/64 scope link noprefixroute
       valid_lft forever preferred_lft forever
```

## 故障模拟测试<a name="section118145475428"></a>

-   主节点\[192.168.1.11\]操作。

```
## kill数据库进程
[root@opengaussdb1 ~]# ps -ef|grep gauss
omm       18115      1  4 16:30 ?        00:00:35 /gauss/app/bin/gaussdb -D /gauss/data/db1 -M primary
root      19254   9299  0 16:42 pts/0    00:00:00 grep --color=auto gauss
[root@opengaussdb1 ~]# kill -9 18115

## 检查message日志[检测到故障，执行notify_down脚本，并关闭keepalived服务]
# tail -fn 200 /var/log/messages 
Feb 19 16:42:57 opengaussdb1 Keepalived_healthcheckers[18816]: TCP connection to [192.168.1.11]:26000 failed.
Feb 19 16:43:00 opengaussdb1 Keepalived_healthcheckers[18816]: TCP connection to [192.168.1.11]:26000 failed.
Feb 19 16:43:00 opengaussdb1 Keepalived_healthcheckers[18816]: Check on service [192.168.1.11]:26000 failed after 1 retry.
Feb 19 16:43:00 opengaussdb1 Keepalived_healthcheckers[18816]: Removing service [192.168.1.11]:26000 from VS [192.168.1.10]:26000
Feb 19 16:43:00 opengaussdb1 Keepalived_healthcheckers[18816]: IPVS (cmd 1160, errno 2): No such destination
Feb 19 16:43:00 opengaussdb1 Keepalived_healthcheckers[18816]: Executing [/gauss/failoverdb.sh] for service [192.168.1.11]:26000 in VS [192.168.1.10]:26000
Feb 19 16:43:00 opengaussdb1 Keepalived_healthcheckers[18816]: Lost quorum 1-0=1 > 0 for VS [192.168.1.10]:26000
Feb 19 16:43:00 opengaussdb1 Keepalived[18815]: Stopping
Feb 19 16:43:00 opengaussdb1 Keepalived_healthcheckers[18816]: pid 19258 exited due to signal 15
Feb 19 16:43:00 opengaussdb1 Keepalived_vrrp[18817]: VRRP_Instance(VI_1) sent 0 priority
Feb 19 16:43:00 opengaussdb1 Keepalived_vrrp[18817]: VRRP_Instance(VI_1) removing protocol VIPs.
Feb 19 16:43:00 opengaussdb1 Keepalived_healthcheckers[18816]: IPVS (cmd 1156, errno 2): No such file or directory
Feb 19 16:43:00 opengaussdb1 Keepalived_healthcheckers[18816]: Stopped
Feb 19 16:43:01 opengaussdb1 Keepalived_vrrp[18817]: Stopped
Feb 19 16:43:01 opengaussdb1 Keepalived[18815]: Stopped Keepalived v1.3.5 (03/19,2017), git commit v1.3.5-6-g6fa32f2
```

-   备节点\[192.168.1.12\]检查。

```
## 检查VIP是否已漂移
[root@opengaussdb2 ~]# ip a|grep 192.168
    inet 192.168.1.12/24 brd 192.168.1.255 scope global noprefixroute ens33
    inet 192.168.1.10/32 scope global ens33

## 检查数据库状态[已failover成为Primary]
[omm@opengaussdb2 ~]$ gs_om -t status --detail
[   Cluster State   ]
cluster_state   : Degraded
redistributing  : No
current_az      : AZ_ALL
[  Datanode State   ]
node            node_ip         instance                state                   | 
---------------------------------------------------------------------------------
1  opengaussdb1 192.168.1.11    6001 /gauss/data/db1 P Down    Manually stopped | 
2  opengaussdb2 192.168.1.12    6002 /gauss/data/db1 S Primary Normal
```

