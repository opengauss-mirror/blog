+++

title = "step by step系列之：install docker版本opengauss1.0.1主备机群" 

date = "2021-01-12" 

tags = ["openGauss step by step系列"] 

archives = "2021-01" 

author = "姜殿斌" 

summary = "step by step系列之：install docker版本opengauss1.0.1主备机群"

img = "/zh/post/jiangdianbin/title/img33.png" 

times = "16:30"

+++

# step by step之：install docker版本opengauss1.0.1主备机群<a name="ZH-CN_TOPIC_0000001072944641"></a>

参考文档：[https://www.modb.pro/db/34668](https://www.modb.pro/db/34668)

**实验环境说明**：OS：2颗8核心 8GB内存。

1.流程：

先安装docker软件，下载Docker镜像，在创建启动主备容器数据库，进入数据库，进行主备切换试验。

2.安装docker软件

```
[root@node1 ~]# 
yum -y install docker
```

\#检查docker的版本：

```
docker -v
Docker version 1.13.1, build 64e9980/1.13.1
```

3.启动docker服务

```
# 查看docker是否启动：
systemctl status docker
   docker.service - Docker Application Container Engine
   Loaded: loaded (/usr/lib/systemd/system/docker.service; disabled; vendor preset: disabled)
   Active: inactive (dead)
   Docs: http://docs.docker.com
[root@node1 ~]# 
#启动Docker
systemctl start docker 
```

检查启动是否正常：

```
[root@node1 ~]# systemctl status docker
docker.service - Docker Application Container Engine
   Loaded: loaded (/usr/lib/systemd/system/docker.service; disabled; vendor preset: disabled)
   Active: active (running) since Thu 2020-10-15 09:01:06 CST; 5s ago
     Docs: http://docs.docker.com
 Main PID: 11215 (dockerd-current)
    Tasks: 30
   CGroup: /system.slice/docker.service
           ├─11215 /usr/bin/dockerd-current --add-runtime docker-runc=/usr/libexec/do...
           └─11225 /usr/bin/docker-containerd-current -l unix:///var/run/docker/libco...
 
Oct 15 09:01:05 node1.localdomain dockerd-current[11215]: time="2020-10-15T09:01:05.0...
Oct 15 09:01:06 node1.localdomain dockerd-current[11215]: time="2020-10-15T09:01:06.0...
Oct 15 09:01:06 node1.localdomain dockerd-current[11215]: time="2020-10-15T09:01:06.1...
Oct 15 09:01:06 node1.localdomain dockerd-current[11215]: time="2020-10-15T09:01:06.1...
Oct 15 09:01:06 node1.localdomain dockerd-current[11215]: time="2020-10-15T09:01:06.1...
Oct 15 09:01:06 node1.localdomain dockerd-current[11215]: time="2020-10-15T09:01:06.2...
Oct 15 09:01:06 node1.localdomain dockerd-current[11215]: time="2020-10-15T09:01:06.2...
Oct 15 09:01:06 node1.localdomain dockerd-current[11215]: time="2020-10-15T09:01:06.2...
Oct 15 09:01:06 node1.localdomain dockerd-current[11215]: time="2020-10-15T09:01:06.2...
Oct 15 09:01:06 node1.localdomain systemd[1]: Started Docker Application Container ...e.
Hint: Some lines were ellipsized, use -l to show in full.
[root@node1 ~]# 
```

对docker进行简单设置

```
systemctl enable docker #开机启动docker
systemctl status docker #查看docker状态
 
[root@node1 ~]# systemctl enable docker 
Created symlink from /etc/systemd/system/multi-user.target.wants/docker.service to /usr/lib/systemd/system/docker.service.
[root@node1 ~]# systemctl status docker
● docker.service - Docker Application Container Engine
   Loaded: loaded (/usr/lib/systemd/system/docker.service; enabled; vendor preset: disabled)
   Active: inactive (dead)
     Docs: http://docs.docker.com
[root@node1 ~]# 
```

4.搜索opengauss镜像

```
# docker search opengauss
[root@node1 ~]# docker search opengauss
INDEX       NAME                                    DESCRIPTION                                   STARS     OFFICIAL   AUTOMATED
docker.io   docker.io/enmotech/opengauss            openGauss latest images created by Enmotech   6                    
docker.io   docker.io/aff123/opengauss              aff学习opengauss                                0                    
docker.io   docker.io/blueapple/opengauss           opengauss 1.0.0 CentOS 7.8.2003               0                    
docker.io   docker.io/fibird/opengauss                                                            0                    
docker.io   docker.io/gaobo1997/opengauss_compile   OpenGauss Compile Environment                 0                    
docker.io   docker.io/travelliu/opengauss                                                         0       
```

5.拉取oceanbase docker 镜像

```
#docker pull enmotech/opengauss:1.0.1
 docker pull enmotech/opengauss:1.0.1
Trying to pull repository docker.io/enmotech/opengauss ... 
1.0.1: Pulling from docker.io/enmotech/opengauss
ac9208207ada: Pull complete 
2bedb2e83de5: Pull complete 
db7ef826320f: Pull complete 
2e41de1b5de7: Pull complete 
d528682a66c4: Pull complete 
88163b222086: Pull complete 
7ea9446096be: Pull complete 
2a10ad7221b8: Pull complete 
Digest: sha256:d1aa6c3b5062a03b6f8ec3f7bae8a388e027df443a2c992c60e8e909ac91101b
Status: Downloaded newer image for docker.io/enmotech/opengauss:1.0.1
```

6.查看镜像

```
# docker images
#[root@node1 ~]# docker images
REPOSITORY                     TAG                 IMAGE ID            CREATED             SIZE
docker.io/enmotech/opengauss   1.0.1               80711c4eb80a        5 weeks ago         485 MB
[root@node1 ~]#
```

7.检查  docker是否启动

```
# docker ps 
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES
# 
```

没有启动，启动数据库容器。

8.启动数据库容器\(这里我们使用enmotech/opengauss:latest的镜像\)

创建主节点：

```
[root@node1 ~]# docker run --name op_master --network myNetwork --ip 172.18.0.10 --privileged=true --hostname op_master --detach --env GS_PORT=6432 --env OG_SUBNET=172.18.0.0/16 --env GS_PASSWORD=Enmotech@2020 --env NODE_NAME=op_master --env REPL_CONN_INFO="replconninfo1 = 'localhost=172.18.0.10 localport=6439 localservice=6432 remotehost=172.18.0.11 remoteport=6439 remoteservice=6432 '\n" --cpuset-cpus="1,3" enmotech/opengauss:1.0.1 -M primary
775afac757803a51f9e40886a00e8c3014301cd328823e716ec1c1fe39e4f85d
[root@node1 ~]# 
```

创建备节点：

```
docker run --name op_slave_one \
--network myNetwork --ip 172.18.0.11 --privileged=true \
--hostname op_slave_one --detach \
--env GS_PORT=6432 \
--env OG_SUBNET=172.18.0.0/16 \
--env GS_PASSWORD=Enmotech@2020 \
--env NODE_NAME=op_slave_one \
--env REPL_CONN_INFO="replconninfo1 = 'localhost=172.18.0.11 localport=6439 localservice=6432 remotehost=172.18.0.10 remoteport=6439 remoteservice=6432 '\n" \
--cpuset-cpus="2,4" \
enmotech/opengauss:1.0.1 -M standby
b1562b7253a6746c1093e6412c6c8f768b93a4ec3c6941ed3c7a38cc2da10782
[root@node1 ~]# 
```

9.进入容器，

在另一个窗口检查容器ID：

```
[root@node1 ~]# docker ps -a
CONTAINER ID        IMAGE                       COMMAND                  CREATED             STATUS              PORTS               NAMES
794d54eaa87c        enmotech/opengauss:latest   "entrypoint.sh gau..."   3 minutes ago       Up 3 minutes        5432/tcp            opengauss
[root@node1 ~]# 
[root@node1 ~]# docker ps -a
CONTAINER ID        IMAGE                      COMMAND                  CREATED             STATUS                      PORTS               NAMES
b1562b7253a6        enmotech/opengauss:1.0.1   "entrypoint.sh -M ..."   7 minutes ago       Exited (1) 6 minutes ago                        op_slave_one
775afac75780        enmotech/opengauss:1.0.1   "entrypoint.sh -M ..."   15 minutes ago      Exited (0) 11 minutes ago                       op_master
[root@node1 ~]# 
```

启动已经停止的Docker：

```
[root@node1 ~]# docker start op_master
op_master
 
[root@node1 ~]# docker start op_slave_one
op_slave_one
```

进入容器

在使用 -d 参数时，容器启动后会进入后台。此时想要进入容器，可以通过以下指令进入：

```
docker attach
docker exec：推荐大家使用 docker exec 命令，因为此退出容器终端，不会导致容器的停止。
[root@node1 ~]#  docker exec -it  op_master  bash
[root@op_master /]# 
```

10.查询主备角色状态

主库状态：

```
[root@op_master /]# su - omm
[omm@op_master ~]$ gs_ctl query -D /var/lib/opengauss/data/
[2020-11-13 06:29:40.733][121][][gs_ctl]: gs_ctl query ,datadir is -D "/var/lib/opengauss/data"  
 HA state:           
     local_role                     : Primary
     static_connections             : 1
     db_state                       : Normal
     detail_information             : Normal
 
 Senders info:       
     sender_pid                     : 103
     local_role                     : Primary
     peer_role                      : Standby
     peer_state                     : Normal
     state                          : Streaming
     sender_sent_location           : 0/3000130
     sender_write_location          : 0/3000130
     sender_flush_location          : 0/3000130
     sender_replay_location         : 0/3000130
     receiver_received_location     : 0/3000130
     receiver_write_location        : 0/3000130
     receiver_flush_location        : 0/3000130
     receiver_replay_location       : 0/3000130
     sync_percent                   : 100%
     sync_state                     : Sync
     sync_priority                  : 1
     sync_most_available            : On
     channel                        : 172.18.0.10:6439-->172.18.0.11:52798
 
 Receiver info:      
No information 
[omm@op_master ~]$ 
```

备库状态：

进入备库

```
[root@node1 ~]# docker exec -it op_slave_one bash
[root@op_slave_one /]# su - omm
[omm@op_slave_one ~]$  gs_ctl query -D /var/lib/opengauss/data/
[2020-11-13 06:31:07.922][324][][gs_ctl]: gs_ctl query ,datadir is -D "/var/lib/opengauss/data"  
 HA state:           
     local_role                     : Standby
     static_connections             : 1
     db_state                       : Normal
     detail_information             : Normal
 
 Senders info:       
No information 
 Receiver info:      
     receiver_pid                   : 291
     local_role                     : Standby
     peer_role                      : Primary
     peer_state                     : Normal
     state                          : Normal
     sender_sent_location           : 0/3000238
     sender_write_location          : 0/3000238
     sender_flush_location          : 0/3000238
     sender_replay_location         : 0/3000238
     receiver_received_location     : 0/3000238
     receiver_write_location        : 0/3000238
     receiver_flush_location        : 0/3000238
     receiver_replay_location       : 0/3000238
     sync_percent                   : 100%
     channel                        : 172.18.0.11:52798<--172.18.0.10:6439
 
[omm@op_slave_one ~]$ 
```

说明：先启动主库，在启动备库

11.主备读写及切换测试

主库op\_master写测试

```
[omm@op_master ~]$ gsql -p6432
gsql ((openGauss 1.0.1 build e9da9fb9) compiled at 2020-10-01 20:21:42 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.
 
omm=# create table t(id json);
CREATE TABLE
omm=# insert into t values('{"name":"Mr.D"}');
INSERT 0 1
```

备库op\_slave\_one读测试

```
[omm@op_slave_one ~]$ gsql -p6432
gsql ((openGauss 1.0.1 build e9da9fb9) compiled at 2020-10-01 20:21:42 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.
 
omm=# select * from t;
       id        
-----------------
 {"name":"Mr.D"}
(1 row)
 
omm=# delete from t;
ERROR:  cannot execute DELETE in a read-only transaction
```

切换测试：将op\_slave\_one 切换为主库，op\_master 切换为备库

op\_slave\_one执行switchover

```
[omm@op_slave_one ~]$ gs_ctl switchover -D /var/lib/opengauss/data/
[2020-10-20 13:57:02.877][504][][gs_ctl]: gs_ctl switchover ,datadir is -D "/var/lib/opengauss/data"  
[2020-10-20 13:57:02.877][504][][gs_ctl]: switchover term (1)
[2020-10-20 13:57:02.888][504][][gs_ctl]: waiting for server to switchover.........
[2020-10-20 13:57:08.920][504][][gs_ctl]: done
[2020-10-20 13:57:08.920][504][][gs_ctl]: switchover completed (/var/lib/opengauss/data)
```

op\_slave\_one查询状态

```
[omm@op_slave_one ~]$ gs_ctl query -D /var/lib/opengauss/data/
[2020-10-20 13:58:13.340][555][][gs_ctl]: gs_ctl query ,datadir is -D "/var/lib/opengauss/data"  
 HA state:           
     local_role                     : Primary
     static_connections             : 1
     db_state                       : Normal
     detail_information             : Normal
 
 Senders info:       
     sender_pid                     : 523
     local_role                     : Primary
     peer_role                      : Standby
     peer_state                     : Normal
     state                          : Streaming
     sender_sent_location           : 0/5004A10
     sender_write_location          : 0/5004A10
     sender_flush_location          : 0/5004A10
     sender_replay_location         : 0/5004A10
     receiver_received_location     : 0/5004A10
     receiver_write_location        : 0/5004A10
     receiver_flush_location        : 0/5004A10
     receiver_replay_location       : 0/5004A10
     sync_percent                   : 100%
     sync_state                     : Sync
     sync_priority                  : 1
     sync_most_available            : On
     channel                        : 172.18.0.11:6439-->172.18.0.10:39314
 
 Receiver info:      
No information   
```

op\_master查询状态

```
[omm@op_master ~]$ gs_ctl query -D /var/lib/opengauss/data/
[2020-10-20 13:58:42.827][743][][gs_ctl]: gs_ctl query ,datadir is -D "/var/lib/opengauss/data"  
 HA state:           
     local_role                     : Standby
     static_connections             : 1
     db_state                       : Normal
     detail_information             : Normal
 
 Senders info:       
No information 
 Receiver info:      
     receiver_pid                   : 739
     local_role                     : Standby
     peer_role                      : Primary
     peer_state                     : Normal
     state                          : Normal
     sender_sent_location           : 0/5004A10
     sender_write_location          : 0/5004A10
     sender_flush_location          : 0/5004A10
     sender_replay_location         : 0/5004A10
     receiver_received_location     : 0/5004A10
     receiver_write_location        : 0/5004A10
     receiver_flush_location        : 0/5004A10
     receiver_replay_location       : 0/5004A10
     sync_percent                   : 100%
     channel                        : 172.18.0.10:39314<--172.18.0.11:6439
```

可以看到 op\_master变为备库，op\_slave\_one变为主库，切换成功。

数据读写验证

主库op\_slave\_one做写入验证

```
[omm@op_slave_one ~]$ gsql -p6432
gsql ((openGauss 1.0.1 build e9da9fb9) compiled at 2020-10-01 20:21:42 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.
 
omm=# select * from t;
       id        
-----------------
 {"name":"Mr.D"}
(1 row)
 
omm=# insert into t values('{"name":"insert from op_slave_one "}');
INSERT 0 1
```

备库op\_master做读取验证

```
[omm@op_master ~]$ gsql -p6432
gsql ((openGauss 1.0.1 build e9da9fb9) compiled at 2020-10-01 20:21:42 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.
 
omm=# select * from t;
                  id                  
--------------------------------------
 {"name":"Mr.D"}
 {"name":"insert from op_slave_one "}
(2 rows)
 
omm=# delete from t;
ERROR:  cannot execute DELETE in a read-only transaction
```

修改docker ip：

[https://www.cnblogs.com/zhangyongli2011/p/12981754.html](https://www.cnblogs.com/zhangyongli2011/p/12981754.html)

gsql -d enmotech -U enmotech -W'Enm0t3ch' -h 192.168.1.94 -p 8888

DOcker cpu设置说明：

[https://www.cnblogs.com/sharesdk/p/10110946.html](https://www.cnblogs.com/sharesdk/p/10110946.html)

openGauss docker的说明：

[https://hub.docker.com/r/enmotech/opengauss](https://hub.docker.com/r/enmotech/opengauss)

Docker的基本操作：

[https://www.runoob.com/docker/docker-container-usage.html](https://www.runoob.com/docker/docker-container-usage.html)

