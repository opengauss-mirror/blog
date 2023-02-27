---
title: '在一台服务器上安装主备集群'
date: '2021-02-18'
category: 'blog'
tags: ['在一台服务器上安装主备集群']
archives: '2021-02-18'
author: 'xingchen'
summary: '在一台服务器上安装主备集群'
img: '/zh/blogs/xingchen/title/img1.png'
times: '14:30'
---

默认使用 openGauss 的 OM 工具去安装主备集群，是要求主备分别在不同的服务器上的，即一台服务器只能安装一个数据库实例。
可以在一台服务器上安装多个单机数据库，通过修改配置建立主备关系，以达到一个服务器上安装数据库集群的效果。

**_这种方式下，是不能通过 OM 工具来管理集群的。只能使用数据库内部工具操作。_**

以下步骤以一主一备为例，一主多备类似。

### 安装两个单机数据库

可以通过使用 OM 工具安装两个单机数据库，保证两个数据库端口不同，数据目录不同。

或者直接使用编译安装的方式，启动两个不同端口和数据目录的数据库。

**_注意： 两个数据库的端口不要挨得太近。_**

如下面，启动两个数据库，端口分别是 12000 和 22000

```
[opengauss@ecs-761c dn_22000]$ ps -ef | grep gauss | grep -v grep
root        9789    9532  0 10:49 pts/1    00:00:00 su - opengauss
opengau+   17649       1  2 11:06 pts/1    00:00:02 /usr/local/opengauss/1.1.0/bin/gaussdb -D /home/opengauss/datanode/dn_12000
opengau+   18357       1  2 11:08 pts/1    00:00:01 /usr/local/opengauss/1.1.0/bin/gaussdb -D /home/opengauss/datanode/dn_22000
```

```
[opengauss@ecs-761c dn_22000]$ netstat -nap | grep gauss
(Not all processes could be identified, non-owned process info
 will not be shown, you would have to be root to see it all.)
tcp        0      0 127.0.0.1:12000         0.0.0.0:*               LISTEN      17649/gaussdb
tcp        0      0 127.0.0.1:12001         0.0.0.0:*               LISTEN      17649/gaussdb
tcp        0      0 127.0.0.1:22000         0.0.0.0:*               LISTEN      18357/gaussdb
tcp        0      0 127.0.0.1:22001         0.0.0.0:*               LISTEN      18357/gaussdb
tcp6       0      0 ::1:12000               :::*                    LISTEN      17649/gaussdb
tcp6       0      0 ::1:12001               :::*                    LISTEN      17649/gaussdb
tcp6       0      0 ::1:22000               :::*                    LISTEN      18357/gaussdb
tcp6       0      0 ::1:22001               :::*                    LISTEN      18357/gaussdb
udp6       0      0 ::1:49528               ::1:49528               ESTABLISHED 17649/gaussdb
udp6       0      0 ::1:45521               ::1:45521               ESTABLISHED 18357/gaussdb
unix  2      [ ACC ]     STREAM     LISTENING     56069    18357/gaussdb        /tmp/.s.PGSQL.22000
unix  2      [ ACC ]     STREAM     LISTENING     56072    18357/gaussdb        /tmp/.s.PGSQL.22001
unix  2      [ ACC ]     STREAM     LISTENING     54146    17649/gaussdb        /tmp/.s.PGSQL.12000
unix  2      [ ACC ]     STREAM     LISTENING     54149    17649/gaussdb        /tmp/.s.PGSQL.12001

```

### 以主机或备机模式分别启动数据库

选择一个实例作为主机，以 primary 方式重启数据库。

以 dn_12000 为例，作为主机，重启：

```
gs_ctl restart -D /home/opengauss/datanode/dn_12000 -M primary
```

启动完成后查询：

```
gs_ctl query -D /home/opengauss/datanode/dn_12000
```

```
[2021-02-18 11:11:14.687][19947][][gs_ctl]: gs_ctl query ,datadir is /home/opengauss/datanode/dn_12000
 HA state:
        local_role                     : Primary
        static_connections             : 0
        db_state                       : Normal
        detail_information             : Normal

 Senders info:
No information
 Receiver info:
No information
```

local_role 为 Primary，即以 primary 方式启动成功。该机器作为主机。

同理，将另外一个实例 dn_22000 作为备机启动：

```
gs_ctl restart -D /home/opengauss/datanode/dn_22000 -M standby
```

查询状态：

```
gs_ctl query -D /home/opengauss/datanode/dn_22000

[2021-02-18 11:15:57.003][21884][][gs_ctl]: gs_ctl query ,datadir is /home/opengauss/datanode/dn_22000
 HA state:
        local_role                     : Standby
        static_connections             : 0
        db_state                       : Need repair
        detail_information             : Disconnected

 Senders info:
No information
 Receiver info:
No information
```

### 修改主备实例的配置

使用如下命令，分别修改主备实例的配置：

```
gs_guc set -D {dn} -c "replconninfo1='localhost={localhost} localport={localport} localheartbeatport={localeHeartPort} localservice={localservice} remotehost={remoteNode} remoteport={remotePort} remoteheartbeatport={remoteHeartPort} remoteservice={remoteservice}'"
gs_guc set -D {dn} -c 'remote_read_mode=off';
gs_guc set -D {dn} -c 'replication_type=1';
```

{dn} 数据目录
{localhost} 本地数据库绑定的 ip 地址
{localport} 一般为 port 地址+1
{localeHeartPort} 设置为 port+4，不冲突即可
{localservice} 设置为 port+5，不冲突即可
{remoteNode} 远端数据库绑定的 ip 地址。因为同一台机器，地址与 localhost 相同
{remotePort} 远端 port 地址+1

示例：
主机实例 dn_12000 设置：

```
gs_guc set -D /home/opengauss/datanode/dn_12000 -c "replconninfo1='localhost=127.0.0.1 localport=12001 localheartbeatport=12004 localservice=12005 remotehost=127.0.0.1 remoteport=22001 remoteheartbeatport=22004 remoteservice=22005'"
gs_guc set -D /home/opengauss/datanode/dn_12000 -c 'remote_read_mode=off';
gs_guc set -D /home/opengauss/datanode/dn_12000 -c 'replication_type=1';
```

备机实例 dn_22000 设置：

```
gs_guc set -D /home/opengauss/datanode/dn_22000 -c "replconninfo1='localhost=127.0.0.1 localport=22001 localheartbeatport=22004 localservice=22005 remotehost=127.0.0.1 remoteport=12001 remoteheartbeatport=12004 remoteservice=12005'"
gs_guc set -D /home/opengauss/datanode/dn_22000 -c 'remote_read_mode=off';
gs_guc set -D /home/opengauss/datanode/dn_22000 -c 'replication_type=1';
```

### 重建备机

重启备机：

```
gs_ctl restart -D /home/opengauss/datanode/dn_22000 -M standby
```

重建备机：

```
gs_ctl build -D /home/opengauss/datanode/dn_22000 -M standby
```

重建成功后，主备安装成功。

### 查询主备状态

使用 gs_ctl 指定主机的数据库目录查询状态：

```
gs_ctl query -D /home/opengauss/datanode/dn_12000
```

如下，表示主备建立成功：

```
[2021-02-18 11:58:29.295][54782][][gs_ctl]: gs_ctl query ,datadir is /home/opengauss/datanode/dn_12000
 HA state:
        local_role                     : Primary
        static_connections             : 0
        db_state                       : Normal
        detail_information             : Normal

 Senders info:
        sender_pid                     : 44560
        local_role                     : Primary
        peer_role                      : Standby
        peer_state                     : Normal
        state                          : Streaming
        sender_sent_location           : 0/4001720
        sender_write_location          : 0/4001720
        sender_flush_location          : 0/4001720
        sender_replay_location         : 0/4001720
        receiver_received_location     : 0/4001720
        receiver_write_location        : 0/4001720
        receiver_flush_location        : 0/4001720
        receiver_replay_location       : 0/4001720
        sync_percent                   : 100%
        sync_state                     : Sync
        sync_priority                  : 1
        sync_most_available            : Off
        channel                        : 127.0.0.1:12001-->127.0.0.1:51698

 Receiver info:
No information
```

### 验证

登录主机并建立表：

```
[opengauss@ecs-761c dn_12000]$ gsql -d postgres -p 12000 -r
gsql ((openGauss 1.1.0 build 392c0438) compiled at 2020-12-31 20:08:06 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

postgres=# create table t1(id int);
CREATE TABLE
postgres=# \q

```

登录备机查询表是否存在：

```
[opengauss@ecs-761c dn_12000]$ gsql -d postgres -p 22000 -r
gsql ((openGauss 1.1.0 build 392c0438) compiled at 2020-12-31 20:08:06 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

postgres=# \d
                          List of relations
 Schema | Name | Type  |   Owner   |             Storage
--------+------+-------+-----------+----------------------------------
 public | t1   | table | opengauss | {orientation=row,compression=no}
(1 row)

postgres=#

```
