---
title: 'openGauss/MogDB-3.0.0 dcf测试(非om安装)'

date: '2022-05-18'

category: 'blog'
tags: ['openGauss/MogDB-3.0.0 dcf测试(非om安装)']

archives: '2022-05'

author: '阎书利'

summary: 'openGauss/MogDB-3.0.0 dcf测试(非om安装)'

img: '/zh/blogs/ysl/title/img39.png'

times: '10:20'
---

# openGauss/MogDB-3.0.0 dcf 测试(非 om 安装)

本文出处：https://www.modb.pro/db/402037

**IP 地址**

```
172.20.10.6 LERDER
172.20.10.7 FOLLOWER
172.20.10.8 FOLLOWER
```

## 一、安装 openGauss

安装依赖包

```
yum install -y bzip2 bzip2-devel curl libaio
```

创建用户、组并创建目录

```
groupadd omma -g 20001
useradd omma -g 20001 -u 20001
echo "Enmo@123" | passwd --stdin omma

mkdir -p /opengauss/{soft,data}
tar xf openGauss-3.0.0-CentOS-64bit-all.tar.gz -C /opengauss/soft
```

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-96e1af01-b32a-4da7-a2ff-68b4c8ef3ff8.png'>

配置环境变量

```
echo "export GAUSSHOME=/opengauss/soft"  >> /home/omma/.bashrc && \
echo "export PATH=\$GAUSSHOME/bin:\$PATH " >> /home/omma/.bashrc && \
echo "export LD_LIBRARY_PATH=\$GAUSSHOME/lib:\$LD_LIBRARY_PATH" >> /home/omma/.bashrc
```

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-89fdcc06-30bf-434c-8557-3ed4453434ba.png'>

解压数据库软件包

```
cd /opengauss/soft
tar -xf openGauss-3.0.0-CentOS-64bit.tar.bz2
```

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-e6c12c12-3bac-48f4-b0f2-1636adb55ffb.png'>

初始化数据库
后续所有操作均使用 omma 用户,初始化需要加-c 参数，会生成 dcf 相关文件(注意 nodename)

```
gs_initdb --nodename=gaussdb1 -w Enmo@123 -D /opengauss/data/ -c
```

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-73f1aeed-0295-4a65-9a95-d66a7e14637a.png'>
<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-dc679f07-28f9-4714-8679-07e212a72f1f.png'>

## 二、配置 dcf 参数

### 1.配置白名单

在 pg_hba.conf 里添加白名单
<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-9372b97c-7ab8-4598-9c78-2435a75c479e.png'>

### 2.配置 dcf 参数与 replconninfo

因为在初始化时加了-c，会自动打开 enable_dcf 参数
<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-635d151a-9a8b-4100-a018-4cf9d54086e2.png'>
在节点一的 postgresql.conf 里添加

```
port=21000
dcf_node_id = 1
dcf_ssl=off
dcf_data_path = '/opengauss/data/dcf_data'
dcf_log_path= '/opengauss/data/dcf_log'
dcf_config='[{"stream_id":1,"node_id":1,"ip":"172.20.10.6","port":21000,"role":"LEADER"},{"stream_id":1,"node_id":2,"ip":"172.20.10.7","port":21000,"role":"FOLLOWER"},{"stream_id":1,"node_id":3,"ip":"172.20.10.8","port":21000,"role":"FOLLOWER"}]'
replconninfo1 = 'localhost=172.20.10.6 localport=21001 localheartbeatport=21005 localservice=21004 remotehost=172.20.10.7 remoteport=21001 remoteheartbeatport=21005 remoteservice=21004'
replconninfo2 = 'localhost=172.20.10.6 localport=21001 localheartbeatport=21005 localservice=21004 remotehost=172.20.10.8 remoteport=21001 remoteheartbeatport=21005 remoteservice=21004'
```

类似得，在其他两个备机添加
节点二：

```
port=21000
dcf_node_id = 2
dcf_ssl=off
dcf_data_path = '/opengauss/data/dcf_data'
dcf_log_path= '/opengauss/data/dcf_log'
dcf_config='[{"stream_id":1,"node_id":1,"ip":"172.20.10.6","port":21000,"role":"LEADER"},{"stream_id":1,"node_id":2,"ip":"172.20.10.7","port":21000,"role":"FOLLOWER"},{"stream_id":1,"node_id":3,"ip":"172.20.10.8","port":21000,"role":"FOLLOWER"}]'
replconninfo1 = 'localhost=172.20.10.7 localport=21001 localheartbeatport=21005 localservice=21004 remotehost=172.20.10.6 remoteport=21001 remoteheartbeatport=21005 remoteservice=21004'
replconninfo2 = 'localhost=172.20.10.7 localport=21001 localheartbeatport=21005 localservice=21004 remotehost=172.20.10.8 remoteport=21001 remoteheartbeatport=21005 remoteservice=21004'
```

节点三：

```
port=21000
dcf_node_id = 3
dcf_ssl=off
dcf_data_path = '/opengauss/data/dcf_data'
dcf_log_path= '/opengauss/data/dcf_log'
dcf_config='[{"stream_id":1,"node_id":1,"ip":"172.20.10.6","port":21000,"role":"LEADER"},{"stream_id":1,"node_id":2,"ip":"172.20.10.7","port":21000,"role":"FOLLOWER"},{"stream_id":1,"node_id":3,"ip":"172.20.10.8","port":21000,"role":"FOLLOWER"}]'
replconninfo1 = 'localhost=172.20.10.8 localport=21001 localheartbeatport=21005 localservice=21004 remotehost=172.20.10.7 remoteport=21001 remoteheartbeatport=21005 remoteservice=21004'
replconninfo2 = 'localhost=172.20.10.8 localport=21001 localheartbeatport=21005 localservice=21004 remotehost=172.20.10.6 remoteport=21001 remoteheartbeatport=21005 remoteservice=21004'
```

## 三、启动 openGauss

全部以备机身份拉起

```
gs_ctl start -D /opengauss/data -M standby
```

手动设置存活节点为少数派模式运行，在主节点执行（即 LEADER）

```
gs_ctl setrunmode -D /opengauss/data  -v 1 -x minority
```

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-7bfd9ef0-2a16-4995-9525-3b989a1dfc5f.png'>
集群其他节点主动重建拉起，在所有备节点执行（即 FOLLOWER）
gs_ctl build -b full -D /opengauss/data
<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-e3d33419-25e1-4274-b24b-42e8d5efe790.png'>
...
<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-f861d126-b513-4ca6-806b-ba5baddff793.png'>
存活节点重回多数派，在主节点执行（即 LEADER）

```
gs_ctl setrunmode -D /opengauss/data -x normal
```

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-d226541c-a32a-475f-9943-986bc18c9da6.png'>
全部节点查看状态

```
gs_ctl query -D /opengauss/data
```

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-a6678fdc-7775-41d6-8a9f-d87597a18511.png'>
<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-de7e468f-5d72-4a4b-a587-b66eaeb37b57.png'>
<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-a9d56fbf-98db-4e52-80e0-e8c7331228ee.png'>

## 四、数据同步测试

主节点

```
[omma@localhost ~]$ gsql -p 21000 postgres -r
gsql ((openGauss 3.0.0 build 02c14696) compiled at 2022-04-01 18:12:34 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=# create table ysl (id int);
CREATE TABLE
openGauss=# insert into ysl values(1);
INSERT 0 1
openGauss=# select * from ysl;
 id
----
  1
(1 row)
```

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-ea1da809-b0cc-41e7-baad-512ada988f7d.png'>

备机
<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-33b86471-4522-4cc5-86c7-40f0859c3428.png'>

## 五、故障切换测试

主节点进行停数据库
gs_ctl stop -D /opengauss/data/
<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-15b877a7-5f2e-4693-b313-680801d8d4e9.png'>

可以看到我们的 node2 变成了主节点，身份是 leader，而我们的原主变成了它的 follower
<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-2d766935-ee11-4e98-8a6d-a95314105d5b.png'>

拉起原主库，以 standby 方式启动，查看当前状态，原主节点依旧是新主节点的 follower
gs_ctl start -D /opengauss/data -M standby
<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-8b2951fd-f5ce-41e4-97cb-81fa9c3f9a87.png'>

## 六、switchover 切换测试

在节点 1 进行 switchover 操作，之前节点 1 为 follower，执行完切换之后，可以看到我们的节点 1 又重新恢复成主节点。
<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-9432b980-0a46-4189-a463-b76d460f18c8.png'>

此时查看节点 2，也就是我们 switchover 之前的主节点，发现节点 2 已经 shutdown 了，需要手动再加入集群
<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-21bdac8b-3261-4ede-a6b5-e05d9f17ab74.png'>

## 总结：

1.openGauss-3.0.0 版本的 dcf 对于 switchover，在进行切换之后会把原主节点 shutdown，而不会重启为 follower，需要手动重启。 2.此外 dcf 不像 om 工具这种部署的主备，dcf 在主节点 pg_stat_replication 视图里查询不到复制信息。
<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220511-d375e84b-0f46-41a5-b80e-d8c38c828945.png'>
数据复制流程区别：
<img src='https://oss-emcsprod-public.modb.pro/image/editor/20220512-e5ad8bcb-e996-40b0-9acb-3392e89c1cd6.png'>
