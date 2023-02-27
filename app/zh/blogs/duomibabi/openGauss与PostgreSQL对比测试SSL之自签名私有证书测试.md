---
title: 'openGauss与PostgreSQL对比测试SSL之自签名私有证书测试'

date: '2021-03-29'

category: 'blog'
tags: ['openGauss与PostgreSQL对比']

archives: '2021-03'

author: '多米爸比'

summary: 'openGauss与PostgreSQL对比测试SSL之自签名私有证书测试'

img: '/zh/blogs/duomibabi/title/img31.png'

times: '16:30'
---

# openGauss 与 PostgreSQL 对比测试 SSL 之自签名私有证书测试<a name="ZH-CN_TOPIC_0000001116618885"></a>

## SSL 传输加密简介<a name="section769717573617"></a>

SSL 认证通过使用 SSL 证书确保客户端检查服务端证书或者服务器检查客户端证书，SSL 认证除了加密数据，也可以识别目标端的真伪，防止网络中间人的伪装攻击。

## 单向认证与双向认证<a name="section17668612077"></a>

**单向认证**

单向认证一般是指客户端只验证服务器证书的有效性，而服务端不验证客户端证书的有效性。服务器加载服务端证书信息并发送给客户端，客户端使用根证书来验证服务器端证书的有效性。

**双向认证**

双向认证是指客户端验证服务器证书的有效性，同时服务器端也要验证客户端证书的有效性，只有两端都认证成功，连接才能建立。

客户端验证服务器证书有如下两种模式：

1.  客户端连接参数 SSLMODE 设置为 verify-ca 仅校验数据库证书真伪。
2.  客户端连接参数 SSLMODE 设置为 verify-full 校验数据库证书真伪及。

通用名 CN 匹配数据库连接的 hostname

服务端验证客户端证书有如下三种模式：

1.  数据库认证文件 pg_hba.conf 配置认证选项 clientcert=verify-ca 仅验证客户端证书真伪，认证方法可选。
2.  数据库认证文件 pg_hba.conf 配置认证选项 clientcert=verify-full 验证客户端证书真伪及 CN 匹配数据库连接用户名或映射匹配，认证方法可选。
3.  数据库认证文件 pg_hba.conf 配置认证方法 cert，免密验证客户端证书真伪及 CN 匹配数据库连接用户名或映射匹配。

cert 认证实际是基于 clientcert=verify-full 认证选项的 trust 方法认证。

## SSL 编译支持<a name="section74893414133"></a>

PostgreSQL 编译需打开如下选项，同时需要安装 openssl。

```
--with-openssl
--with-includes=/usr/include/openssl
```

openGauss 源码编译时不需要打开上面两个选项，否则编译会报错。

客户端 psql 或者 gsql 需要检查 libpq 是否有 ssl 动态库的调用。

```
$ ldd /opt/pgsql/lib/libpq.so |grep libssl
	libssl.so.10 => /usr/lib64/libssl.so.10 (0x00007f7f29cc4000)
$ ldd /opt/og/lib/libpq.so |grep libssl
	libssl.so.1.1 => /opt/og/lib/libssl.so.1.1 (0x00007f9d39dd2000)
```

## 自签名私有证书测试<a name="section1432163671811"></a>

测试环境下可以使用自签名私有证书，只用于测试传输加密，不验证身份，也可使用自签名 CA 证书来进行加密及身份验证。实际生产环境需要使用权威的 CA 认证中心签发的数字证书。

本文先测试最简单的自签名私有证书。

**生成私钥**

```
$ openssl genrsa -out server.key 2048
```

**生成证书请求文件**

```
$ openssl req -new \
-config openssl.cnf \
-key server.key \
-subj "/CN=foo" \
-out server.csr
```

注意 openGauss 需要使用-config 指定 openssl.cnf 文件，centos7 下默认路径为/etc/pki/tls/openssl.cnf，PostgreSQL 不需要使用-config 选项。

**证书自签名**

```
$ openssl x509 -req -in server.csr -days 365 \
-extfile openssl.cnf \
-extensions v3_ca \
-signkey server.key \
-out server.crt
```

PostgreSQL 不需要使用-config 选项。

**传输证书及密钥文件至服务器名**

```
$ chmod 0600 server.crt server.key
$ cp server.crt server.key $PGDATA
```

PGDATA 为实际 openGauss 或 PostgreSQL 数据目录。

**数据库配置**

pg_hba.conf 文件配置 hostssl 条目，认证方法可选。

```
hostssl  all  all  0.0.0.0/0  md5
```

postgreql.conf 文件配置如下参数。

```
ssl=on
ssl_cert_file= 'server.crt'
ssl_key_file= 'server.key'
```

重启数据库服务，然后进行测试。

先测试 openGauss，可以看到建立了 SSL 连接。

```
$ gsql -h 192.168.137.5 -p6432 -Upostgres postgres
Password for user postgres:
gsql ((GaussDB Kernel V500R001C20 build ) compiled at 2021-03-09 18:30:51 commit 0 last mr  )
SSL connection (cipher: DHE-RSA-AES128-GCM-SHA256, bits: 128)
Type "help" for help.
postgres=>
```

再测试 PostgreSQL。

```
$ psql -h192.168.137.11
Password for user postgres:
psql (12.6)
SSL connection (protocol: TLSv1.2, cipher: ECDHE-RSA-AES256-GCM-SHA384, bits: 256, compression: off)
Type "help" for help.
postgres=#
```

## 总结<a name="section20719915101411"></a>

1.PostgreSQL 需要编译支持 openssl 而 openGauss 已经内置支持。

2.openGauss 不会识别操作系统层的 openssl 默认配置文件，需要拷贝指定参数，否则会报错找不到配置文件。
