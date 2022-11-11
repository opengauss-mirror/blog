+++

title = "使用VMworkstation安装docker版的MogDB" 

date = "2022-07-11" 

tags = ["使用VMworkstation安装docker版的MogDB"] 

archives = "2022-07" 

author = "云和恩墨" 

summary = "使用VMworkstation安装docker版的MogDB"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# 使用VMworkstation安装docker版的MogDB

本文出处：[https://www.modb.pro/db/425251](https://www.modb.pro/db/425251)

## 1安装环境

虚拟化版本：VM Workstation 12 Pro
系统版本：Centos 7.6
数据库版本：Mogdb V 2.1.1 - Docker
DOCKER版本：20.10.9

## 2安装docker工具(二进制)

使用二进制方式安装docker软件，也可以直接使用yum源方式安装：

### 下载地址

[https://download.docker.com/linux/static/stable/x86_64/](https://download.docker.com/linux/static/stable/x86_64/)
![图片.png](./images/20220629-4cddba36-0f3c-4381-99e5-e78aaa73378e.png)

### 解压缩

```
# cd /opt/software # tar -xvf docker-20.10.9.tgz # cp docker/* /usr/bin/ # which docker 
```

![图片.png](./images/20220629-4d70d1a3-b479-4231-b0c8-a8793f9a4190.png)

### 配置sytemctl服务

```
# vi /usr/lib/systemd/system/docker.service
##输入以下内容
[Unit]
Description=Docker Application Container Engine
Documentation=https://docs.docker.com
After=network-online.target firewalld.service
Wants=network-online.target

[Service]
Type=notify
ExecStart=/usr/bin/dockerd
ExecReload=/bin/kill -s HUP $MAINPIDLimitNOFILE=infinity
LimitNPROC=infinity
TimeoutStartSec=0
Delegate=yes
KillMode=process
Restart=on-failure
StartLimitBurst=3
StartLimitInterval=60s

[Install]
WantedBy=multi-user.target
##保存
```

### 启动docker服务

```
# systemctl daemon-reload
# systemctl start docker.service
# systemctl enable docker.service

# systemctl status docker
# ps -ef|grep docker
# docker version
```

![图片.png](./images/20220628-fcb7bef6-b296-4286-a030-fcbe7af05e95.png)

## 搭建数据库

### 拉取Mogdb docker镜像

```
# docker pull swr.cn-north-4.myhuaweicloud.com/mogdb/mogdb:2.1.1 # docker images 
```

![图片.png](./images/20220628-d2ca51b3-3e6c-43d7-9869-829591f70c4c.png)

![图片.png](./images/20220628-c7f47465-86db-4180-a90a-63892577a4b5.png)

### 单节点数据库

```
##docker run 参数说明
--name       - 容器名称
--privileged - 额外的权限
-d           - 后台运行，并打印容器ID
-e           - 环境参数      
  -- GS_PASSWORD ： 设置了MogDB数据库的超级用户omm以及测试用户mogdb的密码。MogDB安装时默认会创建omm超级用户，该用户名暂时无法修改
  -- GS_NODENAME ： 指定数据库节点名称，默认为mogdb
  -- GS_USERNAME ： 指定数据库连接用户名，默认为mogdb。
  -- GS_PORT     ： 指定数据库端口，默认为5432。
-v           - 绑定挂载点
-p           - 映射服务器的port

##创建镜像挂载目录
# mkdir /dbdata/mogdb_docker

##创建单节点容器
# docker run --name mogdb --privileged=true \
-d -e GS_PASSWORD=Mogdb@1234 \
-v /dbdata/mogdb_docker:/var/lib/mogdb \ 
-p 15432:5432  swr.cn-north-4.myhuaweicloud.com/mogdb/mogdb:2.1.1

# docker ps
```

![图片.png](./images/20220629-ccf529f2-e1d3-4ea7-8683-dbff12741680.png)

### 修改数据库登录参数

```
# docker exec -it mogdb bash
##以下为容器操作
su - omm

gs_guc set -D /var/lib/mogdb/data -c "listen_addresses = '0.0.0.0'"
gs_guc set -D /var/lib/mogdb/data -c "port=5432"
gs_guc set -D /var/lib/mogdb/data -h "host     all      all  0.0.0.0/0    md5"
gs_guc set -D /var/lib/mogdb/data -c "password_encryption_type=1"
gs_ctl reload -D /var/lib/mogdb/data

gsql -d postgres -p 5432 -r
create user test with sysadmin password 'Test@1234';
```

![图片.png](./images/20220629-6e52948e-efd7-4d3f-a2f0-915fe5dfa918.png)

容器内使用gsql命令进行验证

```
gsql -d postgres -U test -W Test@1234 -h127.0.0.1 -p 5432 -r 
```

![图片.png](./images/20220629-f5599c04-808a-40b7-9b10-3c0bdda1078c.png)

容器外使用第三方工具链接
![图片.png](./images/20220629-118f8a9c-c15a-4480-aa4c-654740d2d382.png)

### 搭建主从节点数据库

```
##创建虚拟网络
# docker network create --subnet=192.168.18.0/24 myNetwork
# docker network list

##主节点
# docker run --name mogdb_master \
 --network myNetwork --ip 192.168.18.10 --privileged=true \
 --hostname mogdb_master --detach \
 --env GS_PORT=51000 \
 --env OG_SUBNET=192.168.18.0/24 \
 --env GS_PASSWORD=Enmo@1234 \
 --env NODE_NAME=mogdb_master \
 --env REPL_CONN_INFO="replconninfo1 = 'localhost=192.168.18.10 localport=51000  localservice=51000 remotehost=192.168.18.11 remoteport=51000 remoteservice=51000 '\n" \
 --volume /dbdata/mogdb_docker:/var/lib/mogdb_master \
 --publish 51001:51000 \
swr.cn-north-4.myhuaweicloud.com/mogdb/mogdb:2.1.1 -M primary

##从节点
# docker run --name mogdb_slave_one \
 --network myNetwork --ip 192.168.18.11 --privileged=true \
 --hostname mogdb_slave_one --detach \
 --env GS_PORT=51000 \
 --env OG_SUBNET=192.168.18.0/24 \
 --env GS_PASSWORD=Enmo@1234 \
 --env NODE_NAME=mogdb_slave \
 --env REPL_CONN_INFO="replconninfo1 = 'localhost=192.168.18.11 localport=51000 localservice=51000 remotehost=192.168.18.10 remoteport=51000 remoteservice=51000 '\n" \
 --volume /dbdata/mogdb_docker:/var/lib/mogdb_standby \
 --publish 51002:51000 \
swr.cn-north-4.myhuaweicloud.com/mogdb/mogdb:2.1.1 -M standby
```

![图片.png](./images/20220628-0a807cce-5f1c-4f0b-9d94-81334f889ff3.png)

![图片.png](./images/20220629-fb47c6a5-5e84-49ed-95b5-0da3c28fdb58.png)

使用命令验证主从同步

```
##主节点容器操作
# docker exec -it mogdb_master bash
  
su - omm

gs_guc set -D /var/lib/mogdb/data -c "listen_addresses = '0.0.0.0'"
gs_guc set -D /var/lib/mogdb/data -c "port=51000"
gs_guc set -D /var/lib/mogdb/data -h "host     all      all  0.0.0.0/0    md5"

gs_ctl reload -D /var/lib/mogdb/data

##主库建立测试表
gsql -d postgres -p 51000 -r
create table t1 (remark varchar);
insert into t1 select 'mogdb docker master-slave build scuess';

##从节点容器操作
# docker exec -it mogdb_slave_one bash

gs_guc set -D /var/lib/mogdb/data -c "listen_addresses = '0.0.0.0'"
gs_guc set -D /var/lib/mogdb/data -c "port=51000"
gs_guc set -D /var/lib/mogdb/data -h "host     all      all  0.0.0.0/0    md5"

gs_ctl reload -D /var/lib/mogdb/data

##备库检查测试表
su - omm             
gsql -d postgres -p 51000 -r
select * from t1;
```

主节点输出
![图片.png](./images/20220629-ed985715-0ebf-49bf-9165-442a68f47680.png)

从节点输出
![图片.png](./images/20220629-7416d9fb-0aaf-4837-baaf-3c3239161757.png)

## docker常用命令

```
##查看docker镜像
docker image ls

##查看docker网络
docker network ls

##查看正在运行的docker容器信息
docker ps 
docker ps -a

##镜像创建新容器
docker run --name docker_name image_name

##启动容器
docker start docker_name

##停止容器
docker stop docker_name

##进入容器
docker attach docker_name 
docker exec -it docker_name bash

##查看应用日志
docker logs -f docker_name

##删除容器
docker rm -f docker_name

##上传下载文件
docker cp docker_name:/file_path/file_name /file_path/file_name
docker cp /file_path/file_name docker_name:/file_path/file_name

##修改容器配置
##方法1：将container推入image中，删除并新建container
docker stop con_name
docker commit con_name image_name
docker rm con_name
docker run -d -P --name con_name -p xxx:yyy image_name

##方法2：修改配置文件
docker stop con_name
cd　/var/lib/docker/containers/[container_id]/hostconfig.json
systemctl restart docker
docker start con_name

##帮助
docker --help
docker command --help
```

## 故障问题整理

### 1、故障现象：容器创建时，提示WARNING: IPv4 forwarding is disabled. Networking will not work.

故障原因：一般由于服务器多块网卡及network服务导致
处理方法：systemctl restart network && systemctl restart docker

### 2、故障现象：容器创建时，如果带-v参数，在容器删除时，无法删除容器文件

故障原因：怀疑跟docker缓存处理机制有关
处理方法：手动清理容器挂载目录即可，如果容器创建时，不带-v，则不会出现此问题3、故障现象：建立mogdb容器时，如果设置过多的数据库参数，容器会自动关闭
故障原因：怀疑跟GS_*等一系列参数设置有关
处理方法：mogdb容器建立后，进入容器，手动修改相关数据库参数
