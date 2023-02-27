---
title: 'openGauss与PostgreSQL对比测试SSL之自签名CA证书单向认证测试'

date: '2021-03-31'

category: 'blog'
tags: ['openGauss与PostgreSQL对比']

archives: '2021-03'

author: '多米爸比'

summary: 'openGauss与PostgreSQL对比测试SSL之自签名CA证书单向认证测试'

img: '/zh/blogs/duomibabi/title/img26.png'

times: '16:30'
---

# openGauss 与 PostgreSQL 对比测试 SSL 之自签名 CA 证书单向认证测试<a name="ZH-CN_TOPIC_0000001141902081"></a>

本文测试自签名 CA 证书的单向认证： 客户端只验证服务器证书的有效性，而服务器端不验证客户端证书的有效性。服务器加载证书信息并发送给客户端，客户端使用根证书来验证服务器端证书的有效性。

## 服务端证书的客户端认证模式<a name="section88051349162917"></a>

客户端 SSLMODE 设置为 verify-ca 仅校验数据库证书真伪。

客户端 SSLMODE 设置为 verify-full 校验数据库证书真伪及通用名 CN 匹配数据库连接的 hostname。

## 自签名 CA 证书单向认证测试<a name="section20926144013015"></a>

**1.创建 CA 证书**

CA 证书用于给数据库服务器证书签名，同时需要把 CA 证书发送给数据库客户端，客户端使用 CA 证书验证数据库服务器证书。

```
$ openssl req -new -x509 -days 365 -nodes \
-config openssl.cnf \
-out ca.crt -keyout ca.key -subj "/CN=FooCA"
```

**2.生成数据库服务器证书请求文件**

```
$ openssl req -new -nodes -text \
-config openssl.cnf \
-out server.csr \
-keyout server.key \
-subj "/CN=192.168.137.5"
```

将证书请求文件\(包含用户信息\)和证书签名分开操作，证书请求文件可重用，因为后面可能需要重新生成签名信息。

**3.使用 CA 证书对证书请求文件签名**

```
$ openssl x509 -req -in server.csr -text -days 5 \
-CA ca.crt \
-CAkey ca.key \
-CAcreateserial \
-out server.crt
```

这里设置有效期为 5 天，可以观察在服务器证书有效期小于 7 天的时候，连接登录后会在日志中产生告警提醒。

**4.传输数据库服务器证书及未加密的私钥文件至数据库服务器**

修改文件权限以符合安全设置。

```
$ chmod 0600 server.crt server.key
```

传输文件到数据库服务器 PGDATA 目录。

```
$ cp server.crt server.key $PGDATA
```

注意：如果 PostgreSQL 使用-g, --allow-group-access

开启了组访问权限，则需要拷贝文件到 PGDATA 目录之外以符合安全设置。

**5.数据库 SSL 参数配置**

pg_hba.conf 文件配置 hostssl 条目，认证方法保持 md5 或者 scram 不变。

```
hostssl  all  all  0.0.0.0/0  md5
```

说明：也可以按原来的 host 连接类型，同时支持非 ssl 和 ssl 连接，配置为 hostssl 只支持 hostssl，这里配置为 hostssl。

postgreql.conf 文件配置参数

```
ssl=on
ssl_cert_file= 'server.crt'
ssl_key_file= 'server.key'
```

然后重启数据库服务。

**6.发送 CA 证书到数据库客户端**

本文数据库客户端使用 linux 下 psql，证书文件的默认路径为$HOME/.postgresql/root.crt。

```
cat ca.crt > ~/.postgresql/root.crt
chmod 0600 ~/.postgresql/root.crt
```

**测试一**

数据库客户端未配置证书测试，删除上面第 6 步的文件。

openGauss

```
gsql "sslmode=verify-ca" -p6432 -h 192.168.137.5 -Upostgres
gsql: root certificate file "/home/omm/.postgresql/root.crt" does not exist
Either provide the file or change sslmode to disable server certificate verification.
```

PostgreSQL

```
psql "sslmode=verify-ca" -h192.168.137.11
psql: error: root certificate file "/home/postgres/.postgresql/root.crt" does not exist
Either provide the file or change sslmode to disable server certificate verification.
```

可以看到设置 sslmode=verify-ca 后，客户端需要验证服务器证书，未配置默认 root.crt 问题，提示文件不存在，符合预期。

**测试二**

人为修改数据库客户端证书内容。

openGauss

```
gsql "sslmode=verify-ca" -p6432 -h 192.168.137.5 -Upostgres
gsql: could not read root certificate file "/home/omm/.postgresql/root.crt": too long
gsql "sslmode=verify-ca" -p6432 -h 192.168.137.5 -Upostgres
gsql: could not read root certificate file "/home/omm/.postgresql/root.crt": wrong tag
```

PostgreSQL

```
psql "sslmode=verify-ca" -h192.168.137.11
psql: error: could not read root certificate file "/home/postgres/.postgresql/root.crt":
bad base64 decode
psql "sslmode=verify-ca" -p7000 -h192.168.137.11
psql: error: could not read root certificate file "/home/postgres/.postgresql/root.crt": too long
```

可以看到 root.crt 证书文件内容如果被篡改也是有相应的报错提示，符合预期。

**测试三**

测试验证数据库服务器证书，将正确的证书文件发送至数据库客户端，参考上面第 6 步配置。

openGauss

```
gsql "sslmode=verify-ca" -p6432 -h 192.168.137.5 -Upostgres
Password for user postgres:
gsql ((GaussDB Kernel V500R001C20 build ) compiled at 2021-03-09 18:30:51 commit 0 last mr  )
SSL connection (cipher: DHE-RSA-AES128-GCM-SHA256, bits: 128)
Type "help" for help.

postgres=>
```

PostgreSQL

```
psql "sslmode=verify-ca"  -h192.168.137.11
Password for user postgres:
psql (12.6)
SSL connection (protocol: TLSv1.2, cipher: ECDHE-RSA-AES256-GCM-SHA384, bits: 256, compression: off)
Type "help" for help.

postgres=# \q
```

使用 sslmode=verify-ca 仅验证服务器证书真伪，符合预期。

**测试四**

测试数据库服务器证书设置的通用名 CN 是否匹配客户端连接的 hostname。

openGauss

```
gsql "sslmode=verify-full" -p6432 -h opengauss1 -Upostgres
gsql: server common name "192.168.137.5" does not match host name "opengauss1"
```

PostgreSQL

```
psql "sslmode=verify-full" -hnode11
psql: error: server certificate for "192.168.137.11" does not match host name "node11"
```

分别使用 ip 地址及主机名测试，与通用名 CN 匹配的 ip 地址可成功登录，使用主机名连接报错，报错提示如上，符合预期。

## 总结<a name="section175373743415"></a>

1.数据库服务器证书的客户端认证需要在客户端配置服务器证书签名的 CA 证书，服务器设置支持 hostssl 连接，客户端使用 sslmode 连接参数。

2.sslmode 连接参数设置为 verify-ca 仅校验数据库证书真伪，设置为 verify-full 校验数据库证书真伪及通用名 CN 匹配数据库连接的 hostname。
