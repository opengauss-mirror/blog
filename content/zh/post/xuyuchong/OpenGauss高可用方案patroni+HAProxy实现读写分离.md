+++

title = "OpenGauss高可用方案patroni+HAProxy实现读写分离" 

date = "2022-05-12" 

tags = ["OpenGauss高可用方案patroni+HAProxy实现读写分离"] 

archives = "2022-05" 

author = "XuYuchong" 

summary = "patroni+HAProxy实现读写分离"

img = "/zh/post/xuyuchong/title/img6.png" 

times = "10:0"
+++

# OpenGauss高可用方案



openGauss 3.0 支持kubernetes部署分布式数据库:支持一键式部署分布式数据库，通过patroni实现计划内switchover和故障场景自动failover, 通过haproxy实现openGauss主备节点读写负载均衡，通过shardingsphere实现分布式能力，所有功能打包至镜像并提供一键式部署脚本。



# 主要特性

通过patroni实现计划内switchover和故障场景自动failover, 通过haproxy实现openGauss主备节点读写负载均衡

 



# patroni 介绍

patroni基本原理：

img = "/zh/post/xuyuchong/images/patroni.png" 



patroni通过使用etcd，向其插入键值对记录patroni参数、数据库参数、主备信息以及连接信息，平常通过etcd对其它节点做心跳检测，通过从etcd获取键值对中存储的主备信息来判断各节点的状态对集群进行自动管理。



# haproxy介绍

- HAProxy是一个开源的项目，其代码托管在Github上，代码链接如下：[HAProxy代码链接](https://github.com/haproxy/haproxy)。
- HAProxy提供高可用性、负载均衡以及基于TCP和HTTP应用的代理，支持虚拟主机，它是免费、快速并且可靠的一种解决方案。
- HAProxy实现了一种事件驱动, 单一进程模型，此模型支持非常大的并发连接数



# 读写分离实现方式

```
listen master
    bind *:5000
        mode tcp
        option tcplog
        balance roundrobin
    option httpchk OPTIONS /master
    http-check expect status 200
    default-server inter 3s fall 3 rise 2 on-marked-down shutdown-sessions
        server node1 192.168.216.130:5432 maxconn 1000 check port 8008 inter 5000 rise 2 fall 2
        server node2 192.168.216.132:5432 maxconn 1000 check port 8008 inter 5000 rise 2 fall 2
listen replicas
    bind *:5001
        mode tcp
        option tcplog
        balance roundrobin
    option httpchk OPTIONS /replica
    http-check expect status 200
    default-server inter 3s fall 3 rise 2 on-marked-down shutdown-sessions
        server node1 192.168.216.130:5432 maxconn 1000 check port 8008 inter 5000 rise 2 fall 2
        server node2 192.168.216.132:5432 maxconn 1000 check port 8008 inter 5000 rise 2 fall 2


#########
(1) 由Patroni自身使用用以leader竞选；
(2) 由patronictl工具使用用以执行 failovers、switchovers、reinitialize、restarts、reloads操作；
(3) 由HAProxy或者其他负载均衡器进行HTTP健康监测，或者监控。
本文中HAProxy即利用Patroni中的REST API进行健康监测，进而识别集群中的主机，备机，以及各个节点的健康状态。
对于健康监测中的GET请求，Patroni返回一个包含节点状态、HTTP状态码的JSON文档。如果不需要复杂的JSON文档，
只保留一些关键信息，可以用OPTIONS代替GET。

对于下列的请求：当Patroni节点拥有leader锁，且作为primary节点running时，Patroni REST API将返回HTTP状态码200：
(1) GET /
(2) GET /master
(3) GET /primary
(4) GET /read-write

option httpchk相当于调用了GET /请求，
http-check expect status 200
相当于过滤出健康监测返回的状态码应为200，对于所配置的数据库，当为主机时，其状态码为200，
于是上面的配置即选出了数据库集群中的主机，用HAProxy的ip和5000端口号即可代理集群中的主机。


###对于GET /replica请求，当Patroni节点为running状态，角色为replica，未设置noloadbalance标签时，http返回状态码为200。
option httpchk OPTIONS /replica即调用了OPTIONS /replica请求，并以OPTIONS代替GET简化返回的信息，
http-check expect status 200相当于过滤出健康监测返回的状态码应为200，因此当所配置的数据库为集群中的备机时，
其状态码为200，于是上面的配置即选出了数据库集群中的备机，同时配置balance roundrobin，即定义负载均衡算法，
对于读请求，将轮询发送于各个运行中的备机，因此，上述的配置可以用HAProxy的ip和5001端口号代理集群中的备机，且实现负载均衡。

#https://patroni.readthedocs.io/en/latest/rest_api.html
* The following requests to Patroni REST API will return HTTP status code 200 only 
when the Patroni node is running as the primary with leader lock:
    * GET /
    * GET /master
    * GET /primary
    * GET /read-write

* GET /standby-leader: returns HTTP status code 200 only when the Patroni node is running as 
the leader in a standby cluster.

* GET /leader: returns HTTP status code 200 when the Patroni node has the leader lock. 
The major difference from the two previous endpoints is that it doesn’t take into account whether 
PostgreSQL is running as the primary or the standby_leader.

* GET /replica: replica health check endpoint. It returns HTTP status code 200 only when 
the Patroni node is in the state running, the role is replica and noloadbalance tag is not set.
```



