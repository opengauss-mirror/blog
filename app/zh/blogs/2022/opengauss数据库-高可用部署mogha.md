---
title: 'opengauss数据库-高可用部署mogha'

date: '2021-12-31'

category: 'blog'
tags: ['opengauss数据库-高可用部署mogha']

archives: '2021-12'

author: '周琦放'

summary: 'opengauss数据库-高可用部署mogha'

img: '/zh/blogs/2022/title/img21.png'

times: '12:30'
---

# opengauss 数据库-高可用部署 mogha<a name="ZH-CN_TOPIC_0000001232453173"></a>

## 高可用<a name="section12163152763419"></a>

- 组件下载

  如无特殊说明，请在所有节点执行，执行用户为 root

  下载高可用组件 mogha-2.3.0-CentOS-x86_64.tar.gz

  下载地址：https://docs.mogdb.io/zh/mogha/v2.3/release-notes/

## 环境配置要求<a name="section1429219113513"></a>

由于 MogHA 需要自动挂虚拟 IP 的操作，内部需要通过 ifconfig 指令来操作网卡，MogHA 是通过数据库安装用户进行启动的，要想执行网卡操作就需要 sudo 权限，在安装期间脚本会检查 /etc/sudoers 配置中是否配置了运行用户的权限，如果存在就跳过配置，如果没有，会尝试自动的将 omm 用户添加到 /etc/sudoers 中，并赋予 ifconfig 的权限。

所以建议在部署 MogHA 服务之前，先检查一下 /etc/sudoers 中是否成功配置了 运行用户的 sudo 权限,配置参考如下：

```
# 追加下列 1 行到文件末尾
omm     ALL=(ALL)       NOPASSWD: /usr/sbin/ifconfig
```

数据库配置要求

数据库要求至少为一主一备，数据库模式为同步。postgresql.conf 中参数要求如下：

```
synchronous_commit = on
```

## 安装 mogha<a name="section828365823518"></a>

建议存放在用户的家目录下，如 omm 用户，建议存放在/home/omm 目录下

```
su - root
tar -zxvf mogha-2.3.0-CentOS-x86_64.tar.gz
cd mogha/
./install.sh omm /opt/huawei/install/data/dn
```

## 配置文件<a name="section1442111833615"></a>

安装完成后，会生成一个 node.conf 文件，修改此配置文件

请注意需要修改的内容

```
# docs: https://docs.mogdb.io/zh/mogha/v2.3/overview
[config]

# 数据库端口

db_port=26000

# 数据库的操作系统用户，通常为omm
db_user=omm
# 数据库的数据目录
db_datadir=/opt/huawei/install/data/dn
# 本地主库元数据存储路径
# primary_info=/root/mogha/primary_info
# 本地备库元数据存储路径
# standby_info=/root/mogha/standby_info
# 是否使用 lite 模式，可选值：True / False
lite_mode=True
# HA节点之间通信端口，如果有防火墙，需要配置互通
agent_port=8081
# [2.3.0新增]
# HA节点间HTTP API 请求超时时间(秒)
# http_req_timeout=3
# 心跳间隔时间
# heartbeat_interval=3
# 主库丢失的探测时间
# primary_lost_timeout=10
# 主库的孤单时间
# primary_lonely_timeout=10
# 双主确认超时时间
# double_primary_timeout=10
# 本地元数据文件类型，支持 json/bin
# meta_file_type=json
# 是否为数据库实例进程限制cpu
# taskset=False
# 设置输出的日志格式
# logger_format=%(asctime)s %(levelname)s [%(filename)s:%(lineno)d]: %(message)s
# [2.3.0新增]设置日志存储目录
# log_dir=/root/mogha
# [2.3.0新增] 日志文件最大字节数（接近该值时，将发生日志滚动）
# 支持的单位：KB, MB, GB (忽略大小写)
# log_max_size=512MB
# [2.3.0新增] 日志保留的文件个数
# log_backup_count=10
# 设置除了主备相关的机器，允许可以访问到web接口的IP列表, 多个IP时逗号分隔
# allow_ips=
# [2.1新增] 主实例进程未启动时，是否需要 HA 进行拉起或切换
# 搭配 primary_down_handle_method 使用
# handle_down_primary=True
# [2.1新增] 备库进程未启动时，是否需要 HA 进行拉起
# handle_down_standby=True
# [2.1新增] 主库实例进程未启动时，如何处理
# 支持两种处理方式：
# - restart: 尝试重启，尝试次数在 restart_strategy 参数中设定
# - failover: 直接切换
# primary_down_handle_method=restart
# [2.1新增] 重启实例最大尝试条件: times/minutes
# 例如： 10/3 最多尝试10次或者3分钟，任何一个条件先满足就不再尝试。
# restart_strategy=10/3
# [2.1.1新增] UCE(uncorrected error)故障感知功能，默认开启
# uce_error_detection=True
# [2.1.1新增] UCE检查时，读取最后多少行日志数据进行判断
# uce_detect_max_lines=200
# [2.2.1新增]
# debug_mode=False
# (选填) 元数据库的连接参数（openGauss类数据库）
# [meta]
# ha_name=            # HA集群的名称，全局唯一，禁止两套HA集群共用一个名字
# host=               # 机器IP
# port=               # 端口
# db=                 # 数据库名
# user=               # 用户名
# password=           # 密码
# connect_timeout=3   # 连接超时，单位秒
# host1-9，每个代表一个机器（最多支持1主8备）
# （lite模式需仅配置 host1 和 host2 即可，）
# - ip: 业务IP
# - heartbeat_ips： 心跳网络ip，允许配置多个心跳网络，以逗号隔开
[host1]
ip=192.168.56.227
heartbeat_ips=
[host2]
ip=192.168.56.228
heartbeat_ips=
# [host3]
# ip=
# heartbeat_ips=
# [host4]
# ip=
# heartbeat_ips=
# [host5]
# ip=
# heartbeat_ips=
# [host6]
# ip=
# heartbeat_ips=
# [host7]
# ip=
# heartbeat_ips=
# [host8]
# ip=
# heartbeat_ips=
# [host9]
# ip=
# heartbeat_ips=

# zone1~3 用于定义机房，不同机房配置独立虚拟IP，
# 切换不会切过去，作为异地保留项目
# - vip: 机房虚拟IP (没有不填)
# - hosts: 本机房内机器列表, 填写机器在配置文件中对应的配置模块名 host1~9，示例：host1,host2

# - ping_list: 用于检查网络是否通畅的仲裁节点，例如网关，支持填写多个IP (逗号分隔)

# - cascades: 机房内的级联机器列表 (配置方式同 hosts, 没有不填)
# - arping: (选填) 机房的 arping 地址

[zone1]
## 该VIP为虚拟ip地址，请根据实际情况填写
vip=192.168.56.229

hosts=host1,host2
ping_list=192.168.56.1
cascades=
arping=
# [zone2]
# vip=
# hosts=
# ping_list=
# cascades=
# arping=
# [zone3]
# vip=
# hosts=
# ping_list=
# cascades=
# arping=
```

## 启动<a name="section037421215419"></a>

```
systemctl start mogha.service
```

## 查看日志信息<a name="section16131536174120"></a>

- 主库心跳日志信息

  ```
  2021-12-29 13:20:49,211 INFO [__init__.py:59]: ping result: {'192.168.56.1': True, '192.168.56.228': True}
  2021-12-29 13:20:49,323 INFO [__init__.py:84]: local instance is alive Primary, state: Normal
  2021-12-29 13:20:54,593 INFO [__init__.py:59]: ping result: {'192.168.56.1': True, '192.168.56.228': True}
  2021-12-29 13:20:54,719 INFO [__init__.py:84]: local instance is alive Primary, state: Normal
  ```

- 备库心跳日志信息

  ```
  2021-12-29 13:32:07,774 INFO [__init__.py:59]: ping result: {'192.168.56.1': True, '192.168.56.227': True}
  2021-12-29 13:32:07,890 INFO [__init__.py:84]: local instance is alive Standby, state: Normal
  2021-12-29 13:32:13,109 INFO [__init__.py:59]: ping result: {'192.168.56.1': True, '192.168.56.227': True}
  2021-12-29 13:32:13,219 INFO [__init__.py:84]: local instance is alive Standby, state: Normal
  ```
