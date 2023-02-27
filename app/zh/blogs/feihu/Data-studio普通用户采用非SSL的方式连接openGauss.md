---
title: 'Data studio普通用户采用非SSL的方式连接openGauss'

date: '2021-01-12'

category: 'blog'
tags: ['openGauss客户端连接']

archives: '2021-01'

author: 'feihu'

summary: 'Data studio普通用户采用非SSL的方式连接openGauss'

img: '/zh/blogs/feihu/title/img122.png'

times: '18:30'
---

# Data studio 普通用户采用非 SSL 的方式连接 openGauss<a name="ZH-CN_TOPIC_0000001072332759"></a>

## 关闭 SSL 认证<a name="section1832710915110"></a>

由于 openGauss 默认开启 SSL 认证，且配置认证较为麻烦，个人开发测试并不需要它。因此关闭 openGauss 的远程用户登录 SSL 认证模式。

1.找到 postgresql.conf。

```
cd /gaussdb/data/openGaussTest1/
```

2.修改 postgresql.conf 文件，关闭 SSL。

```
disabled
ssl = off                               # (change requires restart)
#ssl_ciphers = 'ALL'                    # allowed SSL ciphers
```

3.修改 postgresql.conf 文件，增加要访问的端口号。

```
gs_guc reload -N feihu -I all -c "listen_addresses='localhost,x.x.x.x(数据库所在服务器IP)'"
```

4.修改 pg_hba.conf 文件，增加其他远程访问连接的许可。

```
gs_guc set -N all -I all -h "host all all 0.0.0.0/0 sha256"
```

5.重启数据库。

## 设置普通用户权限<a name="section14463142216521"></a>

Data studio 在连接 openGauss 数据库时，会访问数据库的 pg_roles 系统表。系统用户是有权限访问 pg_roles，但普通用户不行。因此若想使普通用户通过 Data studio 访问数据库，需赋予该用户查询 pg_roles 的权限。例如：

```
grant select on pg_roles to 用户（角色）;
```
