---
title: 'opengauss快速安装方法（docker）'

date: '2021-07-09'

tags: ['opengauss快速安装方法（docker）']
category: 'blog'
archives: '2021-10'

author: 'DSLS'

summary: 'opengauss快速安装方法（docker）'

img: '/zh/blogs/zhengwen2/img/img20.png'

times: '12:30'
---

# opengauss 实践总结学习心

### 放开安全组(可选)

云服务器需要开放端口以供外部连接。设置如下：

<img src="https://data.educoder.net/api/attachments/1595857" alt=" su ">

开放 22 端口，用于远程 SSH 的连接。开放 8887 端口，用于数据库的连接。
如果你闲麻烦，大可开放所有端口。
8887 端口不是固定的，可以任意设置，但不要和已占用的端口冲突。。
如果是本地的虚拟机，则不需要上述设置。顺便一提，如果你想让同一局域网的其他设备（比如你舍友的电脑）连接到你的数据库，请把 Windows 防火墙关闭。

<img src="https://data.educoder.net/api/attachments/1595858" alt=" f ">

### 登录服务器

使用 SSH 远程登录到服务器之后，即可开始之后的步骤。
执行命令 SSH 账户名@域名或 IP 地址连接到远程服务器，连接上之后输入密码登录。
如 `SSH root@db.example.cn`或 `SSH root@127.0.0.1`。
如果是本地虚拟机，请开机输入密码登录即可。

### 关闭防火墙

```
执行命令 systemctl stop firewalld.service 停止防火墙。
执行命令 systemctl disable firewalld.service 关闭防火墙。
之后 reboot 重启。
```

### 换源(可选)(耗时警告)

换国内源以加快程序包下载速度。注意系统版本：CentOS 7

```
执行命令：cp /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.bak 备份。
执行命令 wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo更换阿里源。
执行命令 yum clean all 清除缓存。
执行命令 yum makecache 生成缓存。
执行命令 yum -y update 更新 yum 源。
```

### 安装 dokcer

```
执行命令 yum -y install docker 安装 docker。
执行命令 systemctl start docker 启动 docker 服务。
执行命令 systemctl enable docker 开机启动 docker。(可选)
```

### docker 加速(可选)

为了 pull 镜像更快，可以配置镜像加速服务器。镜像加速地址可以百度，暂时可以用我的加速地址：https://8h88nptu.mirror.aliyuncs.com。
顺便一提：阿里云镜像获取地址：https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors，登陆后，左侧菜单选中镜像加速器就可以看到你的专属地址了
配置镜像地址，执行命令 `vi /etc/docker/daemon.json` 修改配置文件，如该文件不存在，则创建。

在其中加入内容：

```
{"registry-mirrors":["https://8h88nptu.mirror.aliyuncs.com"]}
```

加速地址仅供参考
依次执行命令 `systemctl daemon-reload` 和 `systemctl restart docker` 重新启动 docker。

### 拉取 openGauss 镜像并启动

```
执行 docker run --name opengauss --privileged=true -d -e GS_PASSWORD=Enmo@123 -p 8887:5432 enmotech/opengauss:latest 拉取镜像并创建容器。
其中，opengauss 为容器名，8887:5432 为容器内部的 5432 端口映射到外部 8887 端口，默认密码为 Enmo@123。
之后执行 docker start opengauss 启动 openGauss 镜像。
通过 docker update --restart=always opengauss 来设置 openGauss 镜像随着 docker 的启动而启动
```

至此 openGauss 安装完成

### 数据库的设置

```
执行命令 docker exec -it opengauss bash 进入容器。
执行命令 su - omm 切换到 omm 账户。
执行命令 gsql 进入数据库。
```

因为外部连接时，不允许使用初始账户 omm，所以新建一个账户。

```
执行语句 CREATE USER testuser WITH PASSWORD ‘Enmo@123’;创建一个名为 testuser，密码为 Enmo@123 的账户。
执行语句 GRANT ALL PRIVILEGES ON DATABASE omm testuser;给予 testuser 默认数据库 omm 权限。
执行语句 GRANT ALL PRIVILEGES ON all tables in schema public TO testuser;给予全部表权限给 testuser。
```

完成设置。

<!--
### 外部连接

这里使用开源软件 DBeaver 来连接数据库。

如下图所示，在左侧区域右键，创建-&gt;连接。

<img src="https://data.educoder.net/api/attachments/1595859" alt=" 1 ">

选择 PostgreSQL。

<img src="https://data.educoder.net/api/attachments/1595860" alt=" 2 ">

设置主机地址为你的服务器/虚拟机 IP 地址，端口设置为 8887。数据库为 omm，用户名和密码为刚才设置的用户名和密码。(testuser，Enmo@123)

<img src="https://data.educoder.net/api/attachments/1595862" alt=" 5 ">

进入 SQL 编辑器，输入语句 SELECT 1; 来测试可用性。

<img src="https://data.educoder.net/api/attachments/1595863" alt=" 6 "> -->

---

结束
