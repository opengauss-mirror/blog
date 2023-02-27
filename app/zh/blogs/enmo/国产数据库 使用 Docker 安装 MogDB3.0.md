---
title: '国产数据库|使用 Docker 安装 MogDB3.0'

date: '2022-07-14'

category: 'blog'
tags: ['国产数据库|使用 Docker 安装 MogDB3.0']

archives: '2022-07'

author: '云和恩墨'

summary: '国产数据库|使用 Docker 安装 MogDB3.0'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# 国产数据库|使用 Docker 安装 MogDB3.0

前段时间闲逛 openGauss 时发现 MogDB 官网(mogdb.io)上使用 Docker 容器安装安装 MogDB,非常简单，就想着有机会尝试尝试。刚好 2022 年 6 月 30 日，MogDB3.0 版本发布了，那么就来尝试下，顺便先搭建一个 Docker 容器环境。

## 一、Docker 安装与使用

Docker 容器是资源分割和调度的基本单位，封装整个服务的运行时环境，用于构建、发布和运行分布式应用的一个框架。它是一个跨平台、可移植并且简单易用的容器解决方案。Docker 的源代码托管在 GitHub 上，基于 Go 语言开发并遵从 Apache 2.0 协议。

Docker 容器可以快速自动化地部署应用，并通过操作系统内核技术(namespaces、cgroups 等)为容器提供资源隔离与安全保障。Docker 作为轻量级的虚拟化方式，实现了 PaaS 平台的高效部署、运行和维护。

Docker 当前有两个版本可供选择：社区版（Community Edition，CE）和企业版（Enterprise Edition，EE)。
Docker CE 是免费的，并且是接下来示例中将要使用的版本。
Docker EE 包含 Docker CE 中的全部功能，还包括了商业支持以及与其他 Docker 产品的集成，比如 Docker 可信镜像库和通用控制面板。

**Docker 三大基本概念；**

**image(镜像)
Container(容器)
Reository（仓库）**

> 官方文档链接：https://docs.docker.com/engine/install/centos/

### 使用 root 添加 docker 用户

```
useradd docker passwd docker
```

### 配置 docker 用户使用 sudo

```
chmod u+w /etc/sudoers
vi /etc/sudoers
```

找到这行 root ALL=(ALL) ALL,在他下面添加 docker ALL=(ALL) ALL (注：这里 docker 是用户名)

可以根据实际需要在 sudoers 文件中按照下面四行格式中任意一条进行添加：

```
youuser ALL=(ALL) ALL
%youuser ALL=(ALL) ALL
youuser ALL=(ALL) NOPASSWD: ALL
%youuser ALL=(ALL) NOPASSWD: ALL
```

第一行：允许用户 youuser 执行 sudo 命令(需要输入密码)。
第二行：允许用户组 youuser 里面的用户执行 sudo 命令(需要输入密码)。
第三行：允许用户 youuser 执行 sudo 命令,并且在执行的时候不输入密码。
第四行：允许用户组 youuser 里面的用户执行 sudo 命令,并且在执行的时候不输入密码。

**撤销 sudoers 文件写权限,命令:**

```
chmod u-w /etc/sudoers
```

### 卸载旧版本的 docker

```
sudo yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
```

### 使用存储库安装 Docker

在新主机上首次安装 Docker Engine 之前，您需要设置 Docker 存储库。之后，您可以从存储库安装和更新 Docker。

#### 设置存储库

安装 yum-utils 包（提供 yum-config-manager 实用程序）并设置存储库。

```
$sudo yum install-y yum-utils
```

出现上图这个错误的原因也很简单，这是由于之前将 base yum 源做了修改，忘记改会原来的名字导致的，这里将其改回来即可。

```
mv  CentOS-Base.repo_bak  CentOS-Base.repo
$sudo yum-config-manager \
    --add-repo\
    https://download.docker.com/linux/centos/docker-ce.repo
```

### 安装 Docker 引擎

1.安装最新版本的 Docker Engine、containerd 和 Docker Compose 或进入下一步安装特定版本：

```
$sudo yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

如果提示接受 GPG 密钥，请验证指纹是否匹配 060A 61C5 1B55 8A7F 742B 77AA C52F EB6B 621E 9F35，如果是，则接受它。

此命令会安装 Docker，但不会启动 Docker。它还会创建一个 docker 组，但是默认情况下它不会将任何用户添加到该组中。

2.要安装特定版本的 Docker Engine，请在 repo 中列出可用版本，然后选择并安装：

列出并排序您的存储库中可用的版本。此示例按版本号从最高到最低对结果进行排序，并被截断：

```
$yum list docker-ce --showduplicates | sort-r
docker-ce.x86_64            3:20.10.9-3.el7                    docker-ce-stable
docker-ce.x86_64            3:20.10.8-3.el7                    docker-ce-stable
docker-ce.x86_64            3:20.10.7-3.el7                    docker-ce-stable
docker-ce.x86_64            3:20.10.6-3.el7                    docker-ce-stable
docker-ce.x86_64            3:20.10.5-3.el7                    docker-ce-stable
docker-ce.x86_64            3:20.10.4-3.el7                    docker-ce-stable
docker-ce.x86_64            3:20.10.3-3.el7                    docker-ce-stable
docker-ce.x86_64            3:20.10.2-3.el7                    docker-ce-stable
docker-ce.x86_64            3:20.10.17-3.el7                   docker-ce-stable
docker-ce.x86_64            3:20.10.17-3.el7                   @docker-ce-stable
docker-ce.x86_64            3:20.10.16-3.el7                   docker-ce-stable
docker-ce.x86_64            3:20.10.15-3.el7                   docker-ce-stable
docker-ce.x86_64            3:20.10.14-3.el7                   docker-ce-stable
docker-ce.x86_64            3:20.10.1-3.el7                    docker-ce-stable
docker-ce.x86_64            3:20.10.13-3.el7                   docker-ce-stable
docker-ce.x86_64            3:20.10.12-3.el7                   docker-ce-stable
docker-ce.x86_64            3:20.10.11-3.el7                   docker-ce-stable
docker-ce.x86_64            3:20.10.10-3.el7                   docker-ce-stable
docker-ce.x86_64            3:20.10.0-3.el7                    docker-ce-stable
docker-ce.x86_64            3:19.03.9-3.el7                    docker-ce-stable
```

返回的列表取决于启用了哪些存储库，并且特定于您的 CentOS 版本（.el7 在本例中由后缀表示)。

通过其完全限定的包名称安装特定版本，即包名称 ( docker-ce) 加上版本字符串（第 2 列），

从第一个冒号 (’:’) 开始，一直到第一个连字符，用连字符 ( -) 分隔。例如，docker-ce-18.09.1。

```
$sudo yum install docker-ce-<VERSION_STRING> docker-ce-cli-<VERSION_STRING> containerd.io docker-compose-plugin
```

此命令会安装 Docker，但不会启动 Docker。它还会创建一个 docker 组，
但是默认情况下它不会将任何用户添加到该组中。

3.启动 Docker

```
$sudo systemctl start docker
```

4.hello-world 通过运行映像来验证 Docker 引擎是否已正确安装。

```
$sudo docker run hello-world
```

此命令下载测试映像并在容器中运行它。当容器运行时，它会打印一条消息并退出。

这将安装并运行 Docker 引擎。用于 sudo 运行 Docker 命令。

继续 Linux 后安装以允许非特权用户运行 Docker 命令和其他可选配置步骤。

```
[docker@JiekeXu ~]$ docker ps      --查看容器 [docker@JiekeXu ~]$ docker version  --查看版本 [docker@JiekeXu ~]$ docker info     --查看版本
```

**Docker 基本信息**

```
[docker@JiekeXu ~]$ docker ps
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
[docker@JiekeXu ~]$ docker version
Client: Docker Engine - Community
 Version:           20.10.17
 API version:       1.41
 Go version:        go1.17.11
 Git commit:        100c701
 Built:             Mon Jun  6 23:05:12 2022
 OS/Arch:           linux/amd64
 Context:           default
 Experimental:      true

Server: Docker Engine - Community
 Engine:
  Version:          20.10.17
  API version:      1.41 (minimum version 1.12)
  Go version:       go1.17.11
  Git commit:       a89b842
  Built:            Mon Jun  6 23:03:33 2022
  OS/Arch:          linux/amd64
  Experimental:     false
 containerd:
  Version:          1.6.6
  GitCommit:        10c12954828e7c7c9b6e0ea9b0c02b01407d3ae1
 runc:
  Version:          1.1.2
  GitCommit:        v1.1.2-0-ga916309
 docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0
[docker@JiekeXu ~]$ docker info
Client:
 Context:    default
 Debug Mode: false
 Plugins:
  app: Docker App (Docker Inc., v0.9.1-beta3)
  buildx: Docker Buildx (Docker Inc., v0.8.2-docker)
  compose: Docker Compose (Docker Inc., v2.6.0)
  scan: Docker Scan (Docker Inc., v0.17.0)

Server:
 Containers: 2
  Running: 0
  Paused: 0
  Stopped: 2
 Images: 1
 Server Version: 20.10.17
 Storage Driver: overlay2
  Backing Filesystem: xfs
  Supports d_type: true
  Native Overlay Diff: true
  userxattr: false
 Logging Driver: json-file
 Cgroup Driver: cgroupfs
 Cgroup Version: 1
 Plugins:
  Volume: local
  Network: bridge host ipvlan macvlan null overlay
  Log: awslogs fluentd gcplogs gelf journald json-file local logentries splunk syslog
 Swarm: inactive
 Runtimes: io.containerd.runc.v2 io.containerd.runtime.v1.linux runc
 Default Runtime: runc
 Init Binary: docker-init
 containerd version: 10c12954828e7c7c9b6e0ea9b0c02b01407d3ae1
 runc version: v1.1.2-0-ga916309
 init version: de40ad0
 Security Options:
  seccomp
   Profile: default
 Kernel Version: 3.10.0-957.el7.x86_64
 Operating System: CentOS Linux 7 (Core)
 OSType: linux
 Architecture: x86_64
 CPUs: 2
 Total Memory: 2.72GiB
 Name: JiekeXu
 ID: PCJN:7USI:CYGM:IVBV:2FIE:2LJL:2YZQ:4KRL:M5BI:FXWX:EZGP:QNK6
 Docker Root Dir: /var/lib/docker
 Debug Mode: false
 Registry: https://index.docker.io/v1/
 Labels:
 Experimental: false
 Insecure Registries:
  127.0.0.0/8
 Live Restore Enabled: false
```

**查看容器存储目录**

```
[docker@JiekeXu ~]$ docker info | grep "Docker Root Dir" Docker Root Dir: /var/lib/docker
```

## 二、使用 Docker 安装 MogDB3.0

上面对 docker 容器大概有一个介绍和简单使用，下面将使用此容器安装 MogDB3.0。

MogDB 是 EnMotech openGauss DataBase Enterprise Edition 的缩写，是云和恩墨基于 openGauss 开源数据库进行定制、推出的企业发行版。它将围绕高可用、安全、自动化运维、数据库一体机和 SQL 审核优化等企业需求，解决企业用户落地。其核心价值是易用性、高性能、高可用等和全天候的企业支持。

### MogDB 与 openGauss 的关系

MogDB 是在 openGauss 开源内核的基础上封装和改善的对于企业应用更加友好的企业级数据库。在 openGauss 内核的基础上，MogDB 增加了 MogHA 组件，用于进行主备架构下高可用的自动化管理，这对于企业级应用来说是至关重要的。同时也同步研发了 MogDB Manager 管理软件，其中包括备份恢复，监控，自动化安装等等针对企业级易用性需求的组件。

MogDB 是一款商业产品，按照既定的 License 价格体系销售，同时享有云和恩墨的专业服务支持。

openGauss 是一款开源关系型数据库管理系统，openGauss 内核源自 PostgreSQL，采用木兰宽松许可证 v2 发行。openGauss 内核是开源的，任何人任何组织都可以自行下载源码进行编译安装使用，无需任何费用；openGauss 社区也会定期发布编译好的二进制安装文件，目前的发布策略是每年发布一个稳定常支持版本（每年 3 月底）和一个新功能激进版本（每年 9 月底）。openGauss 关系型数据库的基本功能，以及企业特性的增强功能。更多详情请访问 openGauss 官方网站：https://opengauss.org

### 容器化安装

MogDB 容器版安装过程说明，MogDB 容器版本不支持 MogHA 工具、OM 工具，目前最多支持一主八备。MogDB 3.0 容器版支持最新版的 compat-tools 和插件功能。由于考虑尽可能缩减容器镜像的大小，以方便快速下载和部署，从 2.0 版本开始，容器化 MogDB 在容器里运行的操作系统在 x86 和 ARM 架构下分别运行在 Ubuntu 和 Debian 之上。

**x86-64 架构的 MogDB 容器运行在 Ubuntu 18.04 操作系统中。**

**ARM64 架构的 MogDB 容器运行在 Debian 10 操作系统中。**

#### 安装步骤

1. 启动 Docker 服务。
2. 输入以下命令获取最新版 MogDB 镜像文件：

```
docker pull swr.cn-north-4.myhuaweicloud.com/mogdb/mogdb:3.0.0
```

说明：MogDB 镜像支持运行在 x86 和 ARM 架构中，会根据发起命令的服务器架构自动下载相应的镜像，无需手工指定。

1. 输入以下命令为 MogDB 创建运行目录，下文以“mogdb”为例：

```
mkdir /mogdb
```

1. 继续输入以下命令创建一个新的容器，将容器命名为“mogdb”，以启动 MogDB 实例：

```
docker run --name mogdb --privileged=true -d -e GS_PASSWORD=Enmo@123  -v /mogdb:/var/lib/mogdb  -p 15432:5432  swr.cn-north-4.myhuaweicloud.com/mogdb/mogdb:3.0.0
```

```
[docker@JiekeXu ~]$ docker ps
CONTAINER ID   IMAGE                                               COMMAND                CREATED              STATUS              PORTS                                         NAMES
16740a035d7e  swr.cn-north-4.myhuaweicloud.com/mogdb/mogdb:3.0.0   "entrypoint.sh mogdb"   About a minute ago   Up About a minute   0.0.0.0:15432->5432/tcp,
:::15432->5432/tcp   mogdb
```

**注意：**

- MogDB 的默认监听启动在容器内的 5432 端口上，如果想要从容器外部访问数据库，则需要在 docker run 的时候指定 -p 参数。比如以上命令将允许使用 15432 端口访问容器数据库。
- 容器一旦被删除，容器内的所有数据和配置也均会丢失，而从镜像重新运行一个容器的话，则所有数据又都是呈现在初始化状态，因此对于数据库容器来说，为了防止因为容器的消亡或者损坏导致的数据丢失，需要进行持久化存储数据的操作。通过在 docker run 的时候指定 -v 参数来实现。比如以上命令将会指定将 MogDB 的所有数据文件存储在宿主机的 /mogdb 下。

如果使用 podman，会有目标路径检查，需要预先创建宿主机目标路径（步骤 4）。

1. 进入容器终端：

```
docker exec -it mogdb bash
```

**至此，MogDB 容器版单实例安装完成。**

### 连接 MogDB 数据库

安装完成并进入容器后，通过 su - omm 切换为 omm 用户，即可通过 gsql 进行数据库访问以正常体验 MogDB 各项功能：

```
root@16740a035d7e:/# su – omm omm@16740a035d7e:~$ gsql -d postgres gsql ((MogDB 3.0.0 build 62408a0f) compiled at 2022-06-30 14:21:11 commit 0 last mr  ) Non-SSL connection (SSL connection is recommended when requiring high-security) Type "help" for help.
```

**DML 插入示例：**

```
omm@16740a035d7e:~$ gsql -d postgres
gsql ((MogDB 3.0.0 build 62408a0f) compiled at 2022-06-30 14:21:11 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

MogDB=#\l
                              List of databases
   Name    | Owner | Encoding |   Collate   |    Ctype    | Access privileges
-----------+-------+----------+-------------+-------------+-------------------
 mogdb     | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 |
 mogila    | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 |
 postgres  | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 |
 template0 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +
           |       |          |             |             | omm=CTc/omm
 template1 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +
           |       |          |             |             | omm=CTc/omm
(5 rows)

MogDB=#\c mogila
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "mogila" as user "omm".
MogDB=#\dt
                             List of relations
 Schema |     Name      | Type  | Owner |             Storage
--------+---------------+-------+-------+----------------------------------
 public | actor         | table | mogdb | {orientation=row,compression=no}
 public | address       | table | mogdb | {orientation=row,compression=no}
 public | category      | table | mogdb | {orientation=row,compression=no}
 public | city          | table | mogdb | {orientation=row,compression=no}
 public | country       | table | mogdb | {orientation=row,compression=no}
 public | customer      | table | mogdb | {orientation=row,compression=no}
 public | film          | table | mogdb | {orientation=row,compression=no}
 public | film_actor    | table | mogdb | {orientation=row,compression=no}
 public | film_category | table | mogdb | {orientation=row,compression=no}
 public | inventory     | table | mogdb | {orientation=row,compression=no}
 public | language      | table | mogdb | {orientation=row,compression=no}
 public | payment       | table | mogdb | {orientation=row,compression=no}
 public | rental        | table | mogdb | {orientation=row,compression=no}
 public | staff         | table | mogdb | {orientation=row,compression=no}
 public | store         | table | mogdb | {orientation=row,compression=no}
(15 rows)

MogDB=#create database jiekexu;
CREATE DATABASE
MogDB=#\l
                              List of databases
   Name    | Owner | Encoding |   Collate   |    Ctype    | Access privileges
-----------+-------+----------+-------------+-------------+-------------------
 jiekexu   | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 |
 mogdb     | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 |
 mogila    | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 |
 postgres  | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 |
 template0 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +
           |       |          |             |             | omm=CTc/omm
 template1 | omm   | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/omm           +
           |       |          |             |             | omm=CTc/omm
(6 rows)

MogDB=#\c jiekexu
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "jiekexu" as user "omm".
MogDB=#create table test (id int,name varchar(20));
CREATE TABLE
MogDB=#\dt
                        List of relations
 Schema | Name | Type  | Owner |             Storage
--------+------+-------+-------+----------------------------------
 public | test | table | omm   | {orientation=row,compression=no}
(1 row)

MogDB=#insert into test values (1,'jiekexu');
INSERT 0 1
MogDB=#select * from test;
 id |  name
----+---------
  1 | jiekexu
(1 row)
```
