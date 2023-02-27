---
title: '冷备方式建openGauss测试库'

date: '2021-02-09'

category: 'blog'
tags: ['openGauss安装部署']

archives: '2021-02'

author: 'lqkitten'

summary: '冷备方式建openGauss测试库'

img: '/zh/blogs/lqkitten/title/img39.png'

times: '12:30'
---

# 冷备方式建 openGauss 测试库<a name="ZH-CN_TOPIC_0000001116618881"></a>

准备 openGauss 测试库，原库主机名 gdb1，IP 地址为 192.168.56.26，测试机主机名 gsdb，IP 地址为 192.168.56.9。

在 gsdb 上新建 omm 用户，并设定相应环境变量，同时将原机的 openGauss 克隆过来。

```
scp -r gdb1:/opt/huawei /opt/
```

试试启动。

```
[omm@gsdb bin]$ gs_om -t start
[GAUSS-50204] : Failed to read /opt/huawei/install/app_392c0438/bin/cluster_static_config. Error:
The content is not correct.
```

文件 cluster_static_config 内容不正确。尝试直接手动修改。

```
[omm@gsdb bin]$ sed -i 's/gdb1/gsdb/g' cluster_static_config
[omm@gsdb bin]$ sed -i 's/192.168.56.26/192.168.56.9/g' cluster_static_config
```

启动。

```
[omm@gsdb bin]$ gs_om -t start
[GAUSS-50204] : Failed to read /opt/huawei/install/app_392c0438/bin/cluster_static_config. Error:
The content is not correct.
```

看来手动改不行。试试自动生成配置文件。

```
[omm@gsdb huawei]$ gs_om -t generateconf -X  /opt/huawei/install/om/script/cls.xml
Generating static configuration files for all nodes.
Creating temp directory to store static configuration files.
Successfully created the temp directory.
Generating static configuration files.
Successfully generated static configuration files.
Static configuration files for all nodes are saved in /opt/huawei/install/om/script/static_config_files
```

覆盖原来的配置文件。

```
cd /opt/huawei/install/app_392c0438/bin/
rm -fr cluster_static_config
cp /opt/huawei/install/om/script/static_config_files/cluster_static_config_gsdb cluster_static_config
```

启动。

```
[omm@gsdb bin]$ gs_om -t start
Starting cluster.
=========================================
=========================================
Successfully started.
[omm@gsdb bin]$ gs_om -t status --detail
[ Cluster State ]
cluster_state : Normal
redistributing : No
current_az : AZ_ALL
[ Datanode State ]
node node_ip instance state
--------------------------------------------------------------------------------
1 gsdb 192.168.56.9 6001 /opt/huawei/install/data/dn P Primary Normal
```
