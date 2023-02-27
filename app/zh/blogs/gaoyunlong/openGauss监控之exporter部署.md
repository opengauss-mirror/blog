---
title: 'openGauss监控之exporter部署'

date: '2021-03-31'

category: 'blog'
tags: ['openGauss工具']

archives: '2021-03'

author: '高云龙'

summary: 'openGauss监控之exporter部署'

img: '/zh/blogs/gaoyunlong/title/img38.png'

times: '16:30'
---

# openGauss 监控之 exporter 部署<a name="ZH-CN_TOPIC_0000001095342200"></a>

## 概述<a name="section15081758493"></a>

opengauss_exporter 是为 openGauss 数据库量身打造的数据采集工具，配合当前最受欢迎的监控报警框架 prometheus + grafana 组合实时展示数据库信息，为 openGauss 数据库的平稳运行保驾护航。opengauss_exporter 同 openGauss 数据库一样是开源的，源码下载地址：https://gitee.com/enmotech/opengauss_exporter。

## 提示<a name="section1490792234915"></a>

- opengauss_exporter 目前只能通过 md5 的加密方式访问 openGauss 数据库。
- openGauss 出于安全考虑，某些数据非管理员账号无法访问。
- opengauss_exporter 直接建立连接到你关注的的数据库，否则会获取不到数据。

## 参数介绍<a name="section14881554194919"></a>

```
# ./opengauss_exporter --help
usage: opengauss_exporter_0318 [<flags>]

Flags:
  --help                        Show context-sensitive help (also try --help-long and --help-man).
  --version                     Show application version.
  --url=""                      openGauss database target url
  --config=""                   path to config dir or file.
  --constantLabels=""           A list of label=value separated by comma(,).
  --disable-cache               force not using cache
  --auto-discover-databases     Whether to discover the databases on a server dynamically.
  --exclude-databases="template0,template1"
                                A list of databases to remove when autoDiscoverDatabases is enabled
  --namespace="pg"              prefix of built-in metrics, (og) by default
  --web.listen-address=":9187"  Address to listen on for web interface and telemetry.
  --web.telemetry-path="/metrics"
                                Path under which to expose metrics.
  --time-to-string              convert database timestamp to date string.
  --dry-run                     dry run and print default configs and user config
  --disable-settings-metrics    Do not include pg_settings metrics.
  --explain                     explain server planned queries
  --parallel=5                  Specify the parallelism. the degree of parallelism is now useful query database thread
  --log.level="info"            Only log messages with the given severity or above. Valid levels: [debug, info, warn, error, fatal]
  --log.format="logger:stderr"  Set the log target and format. Example: "logger:syslog?appname=bob&local=7" or "logger:stdout?json=true"
```

## 数据库配置<a name="section14611142625313"></a>

**修改参数**

openGauss 默认加密方式是 sha256，需要改成 md5 的密码加密方式。

方式一：直接修改 postgresql.conf 参数文件

```
password_encryption_type=1
```

重新加载数据库

```
gsql -p $port postgres -r -c “select pg_reload_conf();”
```

方式二：使用集群管理工具

```
gs_guc reload -I all -N all -c "password_encryption_type=1"
```

**创建数据库**

数据库兼容 PG 模式，在 PG 数据库中’’ != null

```
create database ogexporter DBCOMPATIBILITY='PG';
```

**创建用户**

- 1.0.1 版本的数据库，创建用户需要带有 sysadmin 权限。
- 1.1.0 版本的数据库，创建用户需要带有 monadmin 权限的。
- 密码复杂度需要符合数据库密码策略。

```
CREATE USER opengauss_exporter WITH PASSWORD 'opengauss_exporter123' MONADMIN;
```

**赋权**

根据需要采集数据所在的表或视图，给相应的访问权限。

```
grant usage on schema dbe_perf to opengauss_exporter;
grant select on pg_stat_replication to opengauss_exporter;
```

**访问控制**

将 opengauss_exporter 部署服务器的 ip 地址以 md5 的加密方式加入白名单；

如果是部署在本地服务器，需要以 md5 的方式添加在 host all all 127.0.0.1/32 trust 前面，

否则会有 FATAL：Forbid remote connection with trust method! 报错

方式一：直接修改 pg_hba.conf 文件，不需要加载

```
host dbname opengauss_exporter x.x.x.x/32 md5
```

方式二：使用管理工具

```
gs_guc reload -I all -N all -h "host dbname opengauss_exporter x.x.x.x/32 md5"
```

## 安装部署<a name="section07391814145615"></a>

**配置环境变量**

将以下配置添加到～/.bashrc 文件，也可以在每次执行命令前执行。

```
export DATA_SOURCE_NAME="host=x.x.x.x user=opengauss_exporter password=opengauss_exporter123 port=9832 dbname=og_pg sslmode=disable"
```

**启动 opengauss_exporter**

将编译好的二进制文件 opengauss_exporter 放到目录/opt/opengauss_exporter/下，以 nohup 的方式启动。

```
nohup /opt/opengauss_exporter/opengauss_exporter --config="/opt/opengauss_exporter/default_queries.yaml" --log.level=debug &
```

## 检验<a name="section1892612334577"></a>

确保防火墙关闭，如果防火墙打开，则需要开通 9187 端口。

在浏览器输入服务器 ip 及 exporter 端口号，如：http://127.0.0.1:9187//metrics

展示效果如下：

<img src='./figures/20210318-61e29181-afd4-44aa-beb1-66959513adef.png'>
