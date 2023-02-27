---
title: 'openGauss与PostgreSQL对比测试SSL之自签名CA证书双向认证测试'

date: '2021-03-31'

category: 'blog'
tags: ['openGauss与PostgreSQL对比']

archives: '2021-03'

author: '多米爸比'

summary: 'openGauss与PostgreSQL对比测试SSL之自签名CA证书双向认证测试'

img: '/zh/blogs/duomibabi/title/img27.png'

times: '16:30'
---

# openGauss 与 PostgreSQL 对比测试 SSL 之自签名 CA 证书双向认证测试<a name="ZH-CN_TOPIC_0000001142022017"></a>

本文测试自签名 CA 证书的双向认证： 客户端验证服务器证书的有效性，同时服务器端也要验证客户端证书的有效性，只有认证成功，连接才能建立。

## 服务端证书的客户端认证模式<a name="section12884775415"></a>

1.客户端 SSLMODE 设置为 verify-ca 仅校验数据库证书真伪。

2.客户端 SSLMODE 设置为 verify-full 校验数据库证书真伪及通用名 CN 匹配数据库连接的 hostname。

## 客户端证书的服务器认证模式<a name="section1340911994119"></a>

1.数据库认证文件 pg_hba.conf 配置认证选项 clientcert=verify-ca 仅验证客户端证书真伪，认证方法可选。

2.数据库认证文件 pg_hba.conf 配置认证选项 clientcert=verify-full 验证客户端证书真伪及 CN 匹配数据库连接用户名或映射匹配，认证方法可选。

3.数据库认证文件 pg_hba.conf 配置认证方法 cert，免密验证客户端证书真伪及 CN 匹配数据库连接用户名或映射匹配

## 自签名 CA 证书双向认证测试<a name="section20967103284117"></a>

**1.创建 CA 证书**

用于给数据库服务器证书签名的 CA 证书：ca_server.crt

```
$ openssl req -new -x509 -days 365 -nodes \
-config openssl.cnf \
-out ca_server.crt -keyout ca_server.key -subj "/CN=FooServerCA"
```

用于给客户端证书签名的 CA 证书：ca_client.crt

```
$ openssl req -new -x509 -days 365 -nodes \
-config openssl.cnf \
-out ca_client.crt -keyout ca_client.key -subj "/CN=FooClientCA"
```

**2.生成数据库服务器证书请求文件并签名**

```
$ openssl req -new -nodes -text \
-config openssl.cnf \
-out server.csr \
-keyout server.key \
-subj "/CN=192.168.137.5"
```

将证书请求文件\(包含用户信息\)和证书签名分开操作，证书请求文件可重用，因为后面可能需要重新生成证书。

使用 ca_server.crt 对证书请求文件签名

```
$ openssl x509 -req -in server.csr -text -days 5 \
-CA ca_server.crt \
-CAkey ca_server.key \
-CAcreateserial \
-out server.crt
```

这里设置有效期为 5 天，可以观察在服务器证书有效期小于 7 天的时候，连接登录后会在日志中产生告警提醒。

**3.生成客户端证书请求文件并签名**

```
$ openssl req -new -nodes -text \
-config openssl.cnf \
-out client.csr \
-keyout client.key \
-subj "/CN=dbuser1"
```

将证书请求文件\(包含用户信息\)和证书签名分开操作，证书请求文件可重用，因为后面可能需要重新生成证书。

使用 ca_client.crt 对证书请求文件签名

```
$ openssl x509 -req -in client.csr -text -days 30 \
-CA ca_client.crt \
-CAkey ca_client.key \
-CAcreateserial \
-out client.crt
```

**4.传输数据库服务器证书及未加密的私钥文件至数据库服务器**

修改文件权限以符合安全设置

```
$ chmod 0600 ca_client.crt server.crt server.key
```

传输文件到数据库服务器 PGDATA 目录

```
$ cp ca_client.crt server.crt server.key $PGDATA
```

注意：如果 PostgreSQL 使用-g, --allow-group-access

开启了组访问权限，则需要拷贝文件到 PGDATA 目录之外以符合安全设置。

**5.数据库 SSL 参数配置**

postgreql.conf 文件配置参数

```
ssl=on
ssl_cert_file= 'server.crt'
ssl_key_file= 'server.key'
ssl_ca_file='ca_client.crt'
```

然后重启数据库服务。

**6.配置数据库客户端**

客户端使用 linux 下 psql，证书文件的默认路径为$HOME/.postgresql/

```
chmod 0600 client.key client.crt
cp client.crt client.key  ~/.postgresql/
cat ca_server.crt > ~/.postgresql/root.crt
chmod 0600 ~/.postgresql/root.crt
```

**测试一**

pg_hba.conf 文件配置 hostssl 条目。

```
hostssl  all  all  0.0.0.0/0  md5
```

测试验证数据库服务器证书

openGauss 数据库

```
gsql "sslmode=verify-ca" -p6432 -h 192.168.137.5 -Upostgres
Password for user postgres:
gsql ((GaussDB Kernel V500R001C20 build ) compiled at 2021-03-09 18:30:51 commit 0 last mr  )
SSL connection (cipher: DHE-RSA-AES128-GCM-SHA256, bits: 128)
Type "help" for help.

postgres=>
```

PostgreSQL 数据库

```
psql "sslmode=verify-ca"  -h192.168.137.11
Password for user postgres:
psql (12.6)
SSL connection (protocol: TLSv1.2, cipher: ECDHE-RSA-AES256-GCM-SHA384, bits: 256, compression: off)
Type "help" for help.

postgres=# \q
```

使用 sslmode=verify-ca 仅验证服务器证书真伪，符合预期。

**测试二**

测试数据库服务器证书设置的通用名 CN 是否匹配客户端连接的 hostname

openGauss 数据库

```
gsql "sslmode=verify-full" -p6432 -h opengauss1 -Upostgres
gsql: server common name "192.168.137.5" does not match host name "opengauss1"
```

PostgreSQL 数据库

```
psql "sslmode=verify-full" -hnode11
psql: error: server certificate for "192.168.137.11" does not match host name "node11"
```

分别使用 ip 地址及主机名测试，与通用名 CN 匹配的 ip 地址可成功登录，使用主机名连接报错，报错提示如上，符合预期。

**测试三**

测试验证客户端证书

pg_hba.conf 文件配置 hostssl 条目。

```
hostssl  all  all  0.0.0.0/0  md5 clientcert=verify-ca
```

此时数据库连接使用 ip 地址或者 hostname 均可连接。

openGauss 数据库

```
gsql "sslcert=/home/omm/.postgresql/client.crt sslkey=/home/omm/.postgresql/client.key"
-h192.168.137.5 -p6432 -Upostgres
Password for user postgres:
Warning: The client certificate will expire in 29 days.
gsql ((GaussDB Kernel V500R001C20 build ) compiled at 2021-03-09 18:30:51 commit 0 last mr  )
SSL connection (cipher: DHE-RSA-AES128-GCM-SHA256, bits: 128)
Type "help" for help.

postgres=>
```

使用 hostname 也可连接

```
gsql "sslcert=/home/omm/.postgresql/client.crt sslkey=/home/omm/.postgresql/client.key"
-hopengauss1 -p6432 -Upostgres
```

如果使用不正确的客户端证书，比如手工修改 client.crt 内容，测试会失败。

PostgreSQL 数据库

```
psql "sslcert=/home/postgres/.postgresql/client.crt sslkey=/home/postgres/.postgresql/client.key" -h192.168.137.11
Password for user postgres:
psql (12.6)
SSL connection (protocol: TLSv1.2, cipher: ECDHE-RSA-AES256-GCM-SHA384, bits: 256, compression: off)
Type "help" for help.

postgres=# \q
```

使用 hostname 也可连接。

```
psql "sslcert=/home/postgres/.postgresql/client.crt sslkey=/home/postgres/.postgresql/client.key" -hnode11
Password for user postgres:
psql (12.6)
SSL connection (protocol: TLSv1.2, cipher: ECDHE-RSA-AES256-GCM-SHA384, bits: 256, compression: off)
Type "help" for help.

postgres=# \q
```

如果使用不正确的客户端证书，比如手工修改 client.crt 内容，测试会失败。

```
psql "sslcert=/home/postgres/.postgresql/client.crt sslkey=/home/postgres/.postgresql/client.key" -h192.168.137.11
psql: error: SSL error: tlsv1 alert unknown ca
FATAL:  no pg_hba.conf entry for host "192.168.137.11", user "postgres", database "postgres", SSL off
```

分别使用 ip 地址及主机名测试 clientcert=verify-ca 选项，测试结果符合预期。

**测试四**

测试验证客户端证书及 CN 匹配用户或用户映射。

pg_hba.conf 文件配置 hostssl 条目。

```
hostssl  all  all  0.0.0.0/0  md5 clientcert=verify-full
```

此时数据库连接用户必须配置 CN 中配置的名称 dbuser1

openGauss 数据库

```
gsql "dbname=postgres sslcert=/home/omm/.postgresql/client.crt sslkey=/home/omm/.postgresql/client.key" -h192.168.137.5 -p6432 -Udbuser1
```

上面使用 dbuser1 可以登录成功，如果使用其他用户也能登录成功。

PostgreSQL 数据库

```
psql "dbname=postgres sslcert=/home/postgres/.postgresql/client.crt sslkey=/home/postgres/.postgresql/client.key" -h192.168.137.11 -p6000 -Udbuser1
```

上面使用 dbuser1 可以登录成功，如果使用其他用户比如 postgres 则会出现下面的错误提示。

```
psql: error: FATAL:  password authentication failed for user "postgres"
FATAL:  no pg_hba.conf entry for host "192.168.137.11", user "postgres", database "postgres", SSL off
```

**测试五**

测试 cert 免密认证：验证客户端证书及 CN 匹配用户或用户映射

pg_hba.conf 文件配置 hostssl 条目。

```
hostssl  all  all  0.0.0.0/0  cert
```

此时数据库连接用户必须配置 CN 中配置的名称 dbuser1，同时不需要输入密码。

openGauss 数据库

```
gsql "dbname=postgres sslcert=/home/omm/.postgresql/client.crt sslkey=/home/omm/.postgresql/client.key" -h192.168.137.5 -p6432 -Udbuser1
Warning: The client certificate will expire in 29 days.
gsql ((GaussDB Kernel V500R001C20 build ) compiled at 2021-03-09 18:30:51 commit 0 last mr  )
SSL connection (cipher: DHE-RSA-AES128-GCM-SHA256, bits: 128)
Type "help" for help.

postgres=>
```

上面使用 dbuser1 用户可直接登录，不需要输入密码，如果使用其他用户比如 postgres 则会出现下面的错误提示。

```
Warning: The client certificate will expire in 29 days.
gsql: FATAL:  certificate authentication failed for user "postgres"
FATAL:  no pg_hba.conf entry for host "192.168.137.5", user "postgres", database "postgres", SSL off
```

PostgreSQL 数据库

```
psql "dbname=postgres sslcert=/home/postgres/.postgresql/client.crt sslkey=/home/postgres/.postgresql/client.key"
-h192.168.137.11 -Udbuser1
psql (12.6)
SSL connection (protocol: TLSv1.2, cipher: ECDHE-RSA-AES256-GCM-SHA384, bits: 256, compression: off)
Type "help" for help.

postgres=> \q
```

上面使用 dbuser1 用户可直接登录，不需要输入密码，如果使用其他用户比如 postgres 则会出现下面的错误提示。

```
psql: error: FATAL:  certificate authentication failed for user "postgres"
FATAL:  no pg_hba.conf entry for host "192.168.137.11", user "postgres", database "postgres", SSL off
```

## 总结<a name="section9842758113911"></a>

1.sslmode 连接参数设置为 verify-ca 仅校验数据库证书真伪，设置为 verify-full 校验数据库证书真伪及通用名 CN 匹配数据库连接的 hostname。

2.clientcert 认证选项设置为 verify-ca 仅校验客户端证书真伪，设置为 verify-full 校验客户端证书真伪及通用名 CN 匹配数据库用户或用户映射。

3.使用 clientcert 认证选项时，连接类型可以设置为 hostssl，但 host 类型也同时支持 hostssl 及 hostnossl。

4.使用 cert 认证方法只能设置连接类型为 hostssl。

5.客户端证书 clientcert=verify-full 认证方式，openGauss 与 PostgreSQL 有差异，参见测试四。
