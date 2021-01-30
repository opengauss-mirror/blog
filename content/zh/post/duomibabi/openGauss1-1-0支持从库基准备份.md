+++

title = "openGauss1.1.0支持从库基准备份" 

date = "2021-01-29" 

tags = ["openGauss备份与恢复"] 

archives = "2021-01" 

author = "多米爸比" 

summary = "openGauss1.1.0支持从库基准备份"

img = "/zh/post/duomibabi/title/img26.png" 

times = "16:30"

+++

# openGauss1.1.0支持从库基准备份<a name="ZH-CN_TOPIC_0000001116618873"></a>

opengauss当前新版本支持从库使用gs\_basebackup做基准备份，同时也支持一台机器进行主从部署，源码搭建主从环境可以参考我之前写过的一篇文章[《openGauss从源码到主备》](https://www.modb.pro/db/27601)。

**主库postgresql.conf配置**

```
port=6432
listen_addresses = '0.0.0.0'
password_encryption_type = 0
remote_read_mode=non_authentication
replconninfo1 = 'localhost=192.168.1.23 localport=6439 localservice=6432 remotehost=192.168.1.23 remoteport=7439 remoteservice=7432'
```

**从库postgresql.conf配置**

```
port=7432
listen_addresses = '0.0.0.0'
password_encryption_type = 0
remote_read_mode=non_authentication
replconninfo1 = 'localhost=192.168.1.23 localport=7439 localservice=7432 remotehost=192.168.1.23 remoteport=6439 remoteservice=6432'
```

可以看到replconninfo1参数主从库都是同一个IP，主库连接端口为6432，从库连接端口为7432。

**pg\_hba.conf配置**

```
host all all 0.0.0.0/0 md5
host    replication    all        0.0.0.0/0           trust'
```

## 主从搭建过程<a name="section1647573112366"></a>

**1.先以单机模式启动数据目录ogdata**

```
$ gs_ctl start -D /opt/ogdata
```

**2.使用gs\_basebackup生成从库数据目录ogdata2**

```
$ gs_basebackup --pgdata=/opt/ogdata2 \
--host=192.168.1.23 \
--port=6431 \
--username=repuser
```

**3.修改从库数据目录ogdata2配置参数**

```
port=7432
replconninfo1 = 'localhost=192.168.1.23 localport=7439 localservice=7432 remotehost=192.168.1.23 remoteport=6439 remoteservice=6432'
```

**4.修改从库node\_name**

```
$ gs_guc set -D /opt/ogdata2 -c "pgxc_node_name='og_7432'"'
```

**5.关闭数据目录ogdata，以primary模式启动为主库**

```
$ gs_ctl stop -mi -D /opt/ogdata
$ gs_ctl start -D /opt/ogdata -M primary
```

**6.数据目录ogdata2以standby模式启动为从库**

```
$ gs_ctl start -D /opt/ogdata2 -M standby
```

**7.检查主从库状态**

```
$ gs_ctl query -D /opt/ogdata  
$ gs_ctl query -D /opt/ogdata2
```

**8.测试主从数据读写**

主库测试写

```
$ gsql -h192.168.1.23  -p6432 -Upostgres -r

postgres=> create table tab(id int,info varchar);
CREATE TABLE

postgres=> insert into tab values(100,now());
INSERT 0 1
```

从库测试读写

```
$ gsql -h192.168.1.23  -p7432 -Upostgres -r

postgres=> delete from tab;
ERROR:  cannot execute DELETE in a read-only transaction

postgres=> select * from tab;
 id  |             info              
-----+-------------------------------
 100 | 2021-01-13 11:02:49.777784+08
(1 row)
```

主从环境搭建完成。

## 从库基准备份<a name="section1446893854519"></a>

**1.提前创建备份目录**

PostgreSQL不需要提前创建备份目录，openGauss需要

```
$ mkdir data_backup
```

**2.执行基准备份**

```
$ gs_basebackup --pgdata=/home/omm/data_backup/ \
--verbose --progress \
--username=postgres \
--port=7432

...
gs_basebackup: waiting for background process to finish streaming...
gs_basebackup: base backup completed
gs_basebackup: base backup  successfully
```

