---
title: '【我与openGauss的故事】如何管理数据库安全(第一部分)'

date: '2022-11-15'

category: 'blog'

tags: ['openGauss', '数据库', '安全']

archives: '2022-11'

author: 'Red_havk'

summary: "Just about everything you'll need to style in the theme: headings, paragraphs, blockquotes, tables, code blocks, and more."
---

# 前言

2021 年 6 月 10 日国家颁布数据安全法对我们国家来说具有重大意义

<img src="./1.png" alt='信息安全法' />

梳理几点重要意义：

(一) 对数据的有效监管实现了有法可依，填补了数据安全保护立法的空白，完善了网络空间安全治理的法律体系。

(二) 提升了国家数据安全保障能力。

(三) 激活数字经济创新，提升数据利用价值。

(四) 扩大了数据保护范围。

(五) 鼓励数据产业发展和商业利用。

# 一、openGauss 数据库在安全方面做了什么

> 客户端接入认证

管理用户及权限

设置数据库审计

设置密态等值查询

设置账本数据库

设置透明数据加密（TDE）

那么我们就逐个进行分析吧

## 1.客户端接入认证

### （1）配置客户端接入认证

支持如下三种认证方式，这三种方式都需要配置“pg_hba.conf”文件。

    > 基于主机的认证：服务器端根据客户端的IP地址、用户名及要访问的数据库来查看配置文件从而判断用户是否通过认证。

      口令认证：包括远程连接的加密口令认证和本地连接的非加密口令认证。

      SSL加密：使用OpenSSL（开源安全通信库）提供服务器端和客户端安全连接的环境。

```sql

#配置允许IP地址为192.168.0.0的客户端访问本机

gs_guc set -N all -I all -h "host all jack 192.168.0.0/24 sha256"

# 建立用户

CREATE USER hack PASSWORD 'Test@123';

#N all表示openGauss的所有主机。

#-I all表示主机的所有实例。

#-h表示指定需要在“pg_hba.conf”增加的语句。

#all表示允许客户端连接到任意的数据库。

#hack表示连接数据库的用户。

#192.168.0.0/24表示只允许这个IP地址主机连接。此处的IP地址不能为openGauss内的IP，在使用过程中，请根据用户的网络进行配置修改。32表示子网掩码为1的位数，即255.255.255.255。

#sha256表示连接时jack用户的密码使用sha256算法加密。

```

### （2）用 SSL 进行安全的 TCP/IP 连接

从 CA 认证中心申请到客户端默认证书，私钥，根证书以及私钥密码加密文件。假设证书、私钥和根证书都放在“/home/omm”目录。

配置如下：

```sql

#双向认证

export PGSSLCERT="/home/omm/client.crt"

export PGSSLKEY="/home/omm/client.key"

export PGSSLMODE="verify-ca"

export PGSSLROOTCERT="/home/omm/cacert.pem"


#单向认证

export PGSSLMODE="verify-ca"

export PGSSLROOTCERT="/home/omm/cacert.pem"

#修改客户端密钥的权限

chmod 600 client.key

chmod 600 client.crt

chmod 600 client.key.cipher

chmod 600 client.key.rand

chmod 600 cacert.pem

```

**加密算法套件**

| OpenSSL 套件名                | IANA 套件名                             | 安全程度 |
| ----------------------------- | --------------------------------------- | -------- |
| ECDHE-RSA-AES128-GCM-SHA256   | TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256   | HIGH     |
| ECDHE-RSA-AES256-GCM-SHA384   | TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384   | HIGH     |
| ECDHE-ECDSA-AES128-GCM-SHA256 | TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256 | HIGH     |
| ECDHE-ECDSA-AES256-GCM-SHA384 | TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384 | HIGH     |
| DHE-RSA-AES128-GCM-SHA256     | TLS_DHE_RSA_WITH_AES_128_GCM_SHA256     | HIGH     |
| DHE-RSA-AES256-GCM-SHA384     | TLS_DHE_RSA_WITH_AES_256_GCM_SHA384     | HIGH     |

### （3）用 SSH 隧道进行安全的 TCP/IP 连接

**以 OpenSSH 为例介绍配置 SSH 隧道，对于如何配置基于密钥的安全验证不作赘述，OpenSSH 提供了多种配置适应网络的各种限制**

```sql

#从本地主机建立到服务器的SSH隧道

ssh -L 63333:localhost:8000 username@hostIP

```

### （4）SSL 证书生成

```sql

#搭建CA环境

--假设用户为omm已存在,搭建CA的路径为test

--以root用户身份登录Linux环境,切换到用户omm

mkdir test

cd /etc/pki/tls

--copy 配置文件openssl.cnf到test下

cp openssl.cnf ~/test

cd ~/test

--到test文件夹下，开始搭建CA环境

--创建文件夹demoCA./demoCA/newcerts./demoCA/private

mkdir ./demoCA ./demoCA/newcerts ./demoCA/private

chmod 700 ./demoCA/private

--创建serial文件,写入01

echo '01'>./demoCA/serial

--创建文件index.txt

touch ./demoCA/index.txt

--修改openssl.cnf配置文件中的参数

dir  = ./demoCA

default_md      = sha256

--至此CA环境搭建完成



#生成根私钥

--生成CA私钥

openssl genrsa -aes256 -out demoCA/private/cakey.pem 2048

Generating RSA private key, 2048 bit long modulus

.................+++

..................+++

e is 65537 (0x10001)

--设置根私钥的保护密码，假设为Test@123

Enter pass phrase for demoCA/private/cakey.pem:

--再次输入私钥密码 Test@123

Verifying - Enter pass phrase for demoCA/private/cakey.pem:


#生成根证书请求文件

--生成CA根证书申请文件careq.pem

openssl req -config openssl.cnf -new -key demoCA/private/cakey.pem -out demoCA/careq.pem

Enter pass phrase for demoCA/private/cakey.pem:

--输入根私钥密码 Test@123

You are about to be asked to enter information that will be incorporated

into your certificate request.

What you are about to enter is what is called a Distinguished Name or a DN.

There are quite a few fields but you can leave some blank

For some fields there will be a default value,

If you enter '.', the field will be left blank.

-----

--以下名称请牢记，生成服务端证书和客户端证书时填写的信息需要与此处的一致

Country Name (2 letter code) [AU]:CN

State or Province Name (full name) [Some-State]:shanxi

Locality Name (eg, city) []:xian

Organization Name (eg, company) [Internet Widgits Pty Ltd]:Abc

Organizational Unit Name (eg, section) []:hello

--Common Name可以随意命名

Common Name (eg, YOUR name) []:world

--Email可以选择性填写

Email Address []:

Please enter the following 'extra' attributes

to be sent with your certificate request

A challenge password []:

An optional company name []:



#生成自签发根证书

--生成根证书时，需要修改openssl.cnf文件，设置basicConstraints=CA:TRUE

vi openssl.cnf

--生成CA自签发根证书

openssl ca -config openssl.cnf -out demoCA/cacert.pem -keyfile demoCA/private/cakey.pem -selfsign -infiles demoCA/careq.pem
Using configuration from openssl.cnf

Enter pass phrase for demoCA/private/cakey.pem:

--输入根私钥密码 Test@123

Check that the request matches the signature

Signature ok

Certificate Details:

        Serial Number: 1 (0x1)

        Validity

            Not Before: Feb 28 02:17:11 2017 GMT

            Not After : Feb 28 02:17:11 2018 GMT

        Subject:

            countryName               = CN

            stateOrProvinceName       = shanxi

            organizationName          = Abc

            organizationalUnitName    = hello

            commonName                = world

        X509v3 extensions:

            X509v3 Basic Constraints:

                CA:FALSE

            Netscape Comment:

                OpenSSL Generated Certificate

            X509v3 Subject Key Identifier:

                F9:91:50:B2:42:8C:A8:D3:41:B0:E4:42:CB:C2:BE:8D:B7:8C:17:1F

            X509v3 Authority Key Identifier:

                keyid:F9:91:50:B2:42:8C:A8:D3:41:B0:E4:42:CB:C2:BE:8D:B7:8C:17:1F

Certificate is to be certified until Feb 28 02:17:11 2018 GMT (365 days)

Sign the certificate? [y/n]:y


1 out of 1 certificate requests certified, commit? [y/n]y

Write out database with 1 new entries

Data Base Updated

--至此CA根证书自签发完成，根证书demoCA/cacert.pem。

#生成服务端证书私钥

--生成服务端私钥文件server.key

openssl genrsa -aes256 -out server.key 2048

Generating a 2048 bit RSA private key

.......++++++

..++++++

e is 65537 (0x10001)

Enter pass phrase for server.key:

--服务端私钥的保护密码，假设为Test@123

Verifying - Enter pass phrase for server.key:

--再次确认服务端私钥的保护密码，即为Test@123


#生成服务端证书请求文件

--生成服务端证书请求文件server.req

openssl req -config openssl.cnf -new -key server.key -out server.req

Enter pass phrase for server.key:

You are about to be asked to enter information that will be incorporated
into your certificate request.

What you are about to enter is what is called a Distinguished Name or a DN.

There are quite a few fields but you can leave some blank

For some fields there will be a default value,

If you enter '.', the field will be left blank.

-----

--以下填写的信息与创建CA时的信息一致

Country Name (2 letter code) [AU]:CN

State or Province Name (full name) [Some-State]:shanxi

Locality Name (eg, city) []:xian

Organization Name (eg, company) [Internet Widgits Pty Ltd]:Abc

Organizational Unit Name (eg, section) []:hello

--Common Name可以随意命名

Common Name (eg, YOUR name) []:world

Email Address []:

--以下信息可以选择性填写

Please enter the following 'extra' attributes

to be sent with your certificate request

A challenge password []:

An optional company name []:


#生成服务端证书

--生成服务端/客户端证书时，修改openssl.cnf文件，设置basicConstraints=CA:FALSE

vi openssl.cnf

--修改demoCA/index.txt.attr中属性为no。

vi demoCA/index.txt.attr

--对生成的服务端证书请求文件进行签发，签发后将生成正式的服务端证书server.crt

openssl ca  -config openssl.cnf -in server.req -out server.crt -days 3650 -md sha256

Using configuration from /etc/ssl/openssl.cnf

Enter pass phrase for ./demoCA/private/cakey.pem:

Check that the request matches the signature

Signature ok

Certificate Details:

        Serial Number: 2 (0x2)

        Validity

            Not Before: Feb 27 10:11:12 2017 GMT

            Not After : Feb 25 10:11:12 2027 GMT

        Subject:

            countryName               = CN

            stateOrProvinceName       = shanxi

            organizationName          = Abc

            organizationalUnitName    = hello

            commonName                = world

        X509v3 extensions:

            X509v3 Basic Constraints:

                CA:FALSE

            Netscape Comment:

                OpenSSL Generated Certificate

            X509v3 Subject Key Identifier:

                EB:D9:EE:C0:D2:14:48:AD:EB:BB:AD:B6:29:2C:6C:72:96:5C:38:35

            X509v3 Authority Key Identifier:

                keyid:84:F6:A1:65:16:1F:28:8A:B7:0D:CB:7E:19:76:2A:8B:F5:2B:5C:6A

Certificate is to be certified until Feb 25 10:11:12 2027 GMT (3650 days)

--选择y对证书进行签发

Sign the certificate? [y/n]:y

--选择y，证书签发结束

1 out of 1 certificate requests certified, commit? [y/n]y

Write out database with 1 new entries

Data Base Updated


#客户端证书，私钥的生成

--生成客户端私钥

openssl genrsa -aes256 -out client.key 2048

--生成客户端证书请求文件

openssl req -config openssl.cnf -new -key client.key -out client.req

--对生成的客户端证书请求文件进行签发，签发后将生成正式的客户端证书client.crt

openssl ca -config openssl.cnf -in client.req -out client.crt -days 3650 -md sha256



#吊销证书列表的生成

--首先创建crlnumber文件

echo '00'>./demoCA/crlnumber

--吊销服务端证书

openssl ca -config openssl.cnf -revoke server.crt

--生成证书吊销列表sslcrl-file.crl

openssl ca -config openssl.cnf -gencrl -out sslcrl-file.crl

```

### （5）SSL 证书替换

> 服务端各个配置文件名称约定：

    证书名称约定：server.crt。

    私钥名称约定：server.key。

    私钥密码加密文件约定：server.key.cipher、server.key.rand。

客户端各个配置文件名称约定：

    证书名称约定：client.crt。

    私钥名称约定：client.key。

    私钥密码加密文件约定：client.key.cipher、client.key.rand。

    根证书名称约定：cacert.pem。

    吊销证书列表文件名称约定：sslcrl-file.crl。

压缩包名称约定：db-cert-replacement.zip。

压缩包格式约定：ZIP。

```sql

#调用接口，执行替换

gs_om -t cert --cert-file=/home/xxxx/db-cert-replacement.zip

#重启服务

gs_om -t stop

gs_om -t start

```

### 本次第一章节完，作者将准备分为六篇进行讲些，欢迎各位支持
