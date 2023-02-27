---
title: 'FATAL: Connection to database failed: SCRAM authentication requires libpq version 10 or above'

date: '2022-05-24'

category: 'blog'
tags:
  [
    'FATAL: Connection to database failed: SCRAM authentication requires libpq version 10 or above',
  ]

archives: '2022-05'

author: '云和恩墨交付'

summary: 'FATAL: Connection to database failed: SCRAM authentication requires libpq version 10 or above'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# FATAL: Connection to database failed: SCRAM authentication requires libpq version 10 or above

本文出处：[https://www.modb.pro/db/249933](https://www.modb.pro/db/249933)

## 问题描述：

在自定义安装好 mogdb2.1 的版本之后，使用 sysbench(sysbench 1.0.17)进行压测 mogdb 数据库时，出现一下的问题

```
[root@mogdb001 ~]# sysbench /usr/share/sysbench/oltp_common.lua --db-driver=pgsql --pgsql-host=localhost --pgsql-user=user1 --pgsql-password=root123.xxx --pgsql-db=sbtest --tables=16 --table_size=100000 --threads=4 prepare
```

- sysbench 1.0.17 (using system LuaJIT 2.0.4)
- Initializing worker threads…
- FATAL: Connection to database failed: SCRAM authentication requires libpq version 10 or above
- FATAL: `sysbench.cmdline.call_command’ function failed: /usr/share/sysbench/oltp_common.lua:83: connection creation failed
- **FATAL: Connection to database failed: SCRAM authentication requires libpq version 10 or above**

进过查询 modb.pro 和 google 发现基本没有该类问题的解决方案，以前遇到过 postgresql 数据库这样的问题，当时是安装了 postgresql-devel 来解决这个问题了，但是现在对 mogdb 还是有点没有思路。

猜测是 mogdb 的密码加密方式和验证方式发生了改变，后来提问回答也确实证实了，mogdb 现在的验证方式已经和 postgresql 的验证方式不一样了，前者是 sha256，后者是 md5 的验证方式。

## 解决办法：

修改 postgresql.conf 文件里面的密码验证参数 password_encryption_type 参数。
该参数有 3 个值：
0：纯纯的 MD5 验证，和 postgresql 的验证方式是一样的，使用 md5 方式创建新用户的时候，会出现一个 notice(注意)，The encrypted password contains MD5 ciphertext, which is not secure.
1：是 md5 和 sha256 的一种结合方式，及支持 md5 也支持 sha256，如果存在 md5 和 sha256 都有的场景中，可以使用该中认证方式。
2：纯纯的 sha256 的验证方式，默认的验证方式，也是最安全的验证方式。

修改参数 password_encryption_type=0。
重新更新一下业务用户的密码，我这边是 user1，replace 密码的语句
alter user moguser IDENTIFIED BY ‘root123.xxxx’ **REPLACE** ‘root123.xxxx1’;
修改 pg_hba.conf 文件，这个文件要想当清楚，需要在(IPv4 local connections)增添一条为
IPv4 local connections:

- host all all 172.24.78.107/32 md5
  最后重启 mogdb 实例(视情况而定)或者 gsql 执行 pg_reload_conf()函数

昨晚以上的所有步骤，就可以通过 sysbench 来连接 mogdb 数据库。

```
root@mogdb001 ~]# sysbench /usr/share/sysbench/oltp_common.lua --db-driver=pgsql --pgsql-host=172.24.78.107 --pgsql-user=user1 --pgsql-password=root123.xxxx --pgsql-db=sbtest --tables=16 --table_size=1000000000 --threads=64 prepare
sysbench 1.0.17 (using system LuaJIT 2.0.4)

Initializing worker threads…

Creating table ‘sbtest4’…
Inserting 1000000000 records into ‘sbtest4’
Creating table ‘sbtest3’…
Creating table ‘sbtest1’…
Creating table ‘sbtest2’…
Inserting 1000000000 records into ‘sbtest3’
```

同时也发现在解决这个问题的时候发现还有 3 种不同的错误，可以参考一下，因为我觉得这 2 个错误都比较简单，可以自己解决。

- FATAL: `sysbench.cmdline.call_command’ function failed: /usr/share/sysbench/oltp_common.lua:83: connection creation failed
  -FATAL: Connection to database failed: **authentication method 11 not supported**
- FATAL: Connection to database failed: **FATAL: no pg_hba.conf entry for host “172.24.78.xx”, user “user1”, database “xxx”, SSL off**
- FATAL: Connection to database failed: FATAL: **Forbid remote connection with trust method!**
