+++

title = "openGauss1.0.1支持docker主备搭建" 

date = "2020-11-19" 

tags = ["openGauss1.0.1支持docker主备搭建"] 

archives = "2020-11" 

author = "多米爸比" 

summary = "openGauss1.0.1支持docker主备搭建"

img = "/zh/post/duomibabi/title/img26.png" 

times = "17:30"

+++

# openGauss1.0.1支持docker主备搭建<a name="ZH-CN_TOPIC_0291959531"></a>

目前已经支持x86-64和ARM64两种架构。

x86-64架构的openGuass运行在CentOS 7.6操作系统中。

ARM64架构的openGauss运行在openEuler 20.03 LTS操作系统中。

## 快速搭建环境<a name="ZH-CN_TOPIC_0292876855"></a>

### pull镜像文件<a name="section241153503312"></a>

```
docker pull enmotech/opengauss:1.0.1
```

### 创建自定义网络，创建容器便于使用固定IP<a name="section827385053313"></a>

```
docker network create --subnet=172.18.0.0/16 myNetwork
```

### 创建主库容器并运行<a name="section18401141113349"></a>

```
docker run --name op_master \
--network myNetwork --ip 172.18.0.10 --privileged=true \
--hostname op_master --detach \
--env GS_PORT=6432 \
--env OG_SUBNET=172.18.0.0/16 \
--env GS_PASSWORD=Enmotech@2020 \
--env NODE_NAME=op_master \
--env REPL_CONN_INFO="replconninfo1 = 'localhost=172.18.0.10 localport=6439 localservice=6432 remotehost=172.18.0.11 remoteport=6439 remoteservice=6432 '\n" \
--cpuset-cpus="1,3" \
opengauss:1.0.1 -M primary
```

### 创建备库容器并运行<a name="section17112739193013"></a>

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
opengauss:1.0.1 -M standby
```

说明：可以参考[官方镜像脚本](https://hub.docker.com/r/enmotech/opengauss)来创建localport与localservice端口间隔要大于2，对外映射端口为localservice。

## 查询主备角色状态<a name="ZH-CN_TOPIC_0292876856"></a>

### 查询命令<a name="section89192717352"></a>

```
gs_ctl query -D /var/lib/opengauss/data/
```

### 主库op\_master查询<a name="section1237916165365"></a>

```
docker exec -it op_master bash

[omm@op_master ~]$ gs_ctl query -D /var/lib/opengauss/data/
[2020-10-20 13:50:39.163][666][][gs_ctl]: gs_ctl query ,datadir is -D "/var/lib/opengauss/data"  
 HA state:           
	local_role                     : Primary
	static_connections             : 1
	db_state                       : Normal
	detail_information             : Normal

 Senders info:       
	sender_pid                     : 637
	local_role                     : Primary
	peer_role                      : Standby
	peer_state                     : Normal
	state                          : Streaming
	sender_sent_location           : 0/5000238
	sender_write_location          : 0/5000238
	sender_flush_location          : 0/5000238
	sender_replay_location         : 0/5000238
	receiver_received_location     : 0/5000238
	receiver_write_location        : 0/5000238
	receiver_flush_location        : 0/5000238
	receiver_replay_location       : 0/5000238
	sync_percent                   : 100%
	sync_state                     : Sync
	sync_priority                  : 1
	sync_most_available            : On
	channel                        : 172.18.0.10:6439-->172.18.0.11:55440

 Receiver info:      
No information 
```

### 备库op\_slave\_one查询<a name="section15682842183712"></a>

```
docker exec -it op_slave_one bash

[omm@op_slave_one ~]$ gs_ctl query -D /var/lib/opengauss/data/
[2020-10-20 13:51:24.640][460][][gs_ctl]: gs_ctl query ,datadir is -D "/var/lib/opengauss/data"  
 HA state:           
	local_role                     : Standby
	static_connections             : 1
	db_state                       : Normal
	detail_information             : Normal

 Senders info:       
No information 
 Receiver info:      
	receiver_pid                   : 401
	local_role                     : Standby
	peer_role                      : Primary
	peer_state                     : Normal
	state                          : Normal
	sender_sent_location           : 0/5000238
	sender_write_location          : 0/5000238
	sender_flush_location          : 0/5000238
	sender_replay_location         : 0/5000238
	receiver_received_location     : 0/5000238
	receiver_write_location        : 0/5000238
	receiver_flush_location        : 0/5000238
	receiver_replay_location       : 0/5000238
	sync_percent                   : 100%
	channel                        : 172.18.0.11:55440<--172.18.0.10:6439
```

说明：从上面主库Senders信息和备库Receiver可以看到主备状态正常。

## 读写及切换测试<a name="ZH-CN_TOPIC_0292876857"></a>

### 主库op\_master写测试<a name="section7258313549"></a>

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

### 备库op\_slave\_one读测试<a name="section12810194412546"></a>

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

### 切换测试：将op\_slave\_one 切换为主库，op\_master 切换为备库<a name="section20524191625210"></a>

**op\_slave\_one执行switchover**

```
[omm@op_slave_one ~]$ gs_ctl switchover -D /var/lib/opengauss/data/
[2020-10-20 13:57:02.877][504][][gs_ctl]: gs_ctl switchover ,datadir is -D "/var/lib/opengauss/data"  
[2020-10-20 13:57:02.877][504][][gs_ctl]: switchover term (1)
[2020-10-20 13:57:02.888][504][][gs_ctl]: waiting for server to switchover.........
[2020-10-20 13:57:08.920][504][][gs_ctl]: done
[2020-10-20 13:57:08.920][504][][gs_ctl]: switchover completed (/var/lib/opengauss/data)
```

**op\_slave\_one查询状态**

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

**op\_master查询状态**

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

**数据读写验证**

主库op\_slave\_one做写入验证。

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

备库op\_master做读取验证。

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
