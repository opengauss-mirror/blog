+++

title = "FATAL: Connection to database failed: SCRAM authentication requires libpq version 10 or above" 

date = "2022-05-24" 

tags = ["FATAL: Connection to database failed: SCRAM authentication requires libpq version 10 or above"] 

archives = "2022-05" 

author = "云和恩墨交付" 

summary = "FATAL: Connection to database failed: SCRAM authentication requires libpq version 10 or above"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# FATAL: Connection to database failed: SCRAM authentication requires libpq version 10 or above

本文出处：[https://www.modb.pro/db/249933](https://www.modb.pro/db/249933)

## 问题描述：

在自定义安装好mogdb2.1的版本之后，使用sysbench(sysbench 1.0.17)进行压测mogdb数据库时，出现一下的问题

```
[root@mogdb001 ~]# sysbench /usr/share/sysbench/oltp_common.lua --db-driver=pgsql --pgsql-host=localhost --pgsql-user=user1 --pgsql-password=root123.xxx --pgsql-db=sbtest --tables=16 --table_size=100000 --threads=4 prepare
```

- sysbench 1.0.17 (using system LuaJIT 2.0.4)
- Initializing worker threads…
- FATAL: Connection to database failed: SCRAM authentication requires libpq version 10 or above
- FATAL: `sysbench.cmdline.call_command’ function failed: /usr/share/sysbench/oltp_common.lua:83: connection creation failed
- **FATAL: Connection to database failed: SCRAM authentication requires libpq version 10 or above**

进过查询modb.pro和google发现基本没有该类问题的解决方案，以前遇到过postgresql数据库这样的问题，当时是安装了postgresql-devel来解决这个问题了，但是现在对mogdb还是有点没有思路。

猜测是mogdb的密码加密方式和验证方式发生了改变，后来提问回答也确实证实了，mogdb现在的验证方式已经和postgresql的验证方式不一样了，前者是sha256，后者是md5的验证方式。

## 解决办法：

修改postgresql.conf文件里面的密码验证参数password_encryption_type参数。
该参数有3个值：
0：纯纯的MD5验证，和postgresql的验证方式是一样的，使用md5方式创建新用户的时候，会出现一个notice(注意)，The encrypted password contains MD5 ciphertext, which is not secure.
1：是md5和sha256的一种结合方式，及支持md5也支持sha256，如果存在md5和sha256都有的场景中，可以使用该中认证方式。
2：纯纯的sha256的验证方式，默认的验证方式，也是最安全的验证方式。

修改参数password_encryption_type=0。
重新更新一下业务用户的密码，我这边是user1，replace密码的语句
alter user moguser IDENTIFIED BY ‘root123.xxxx’ **REPLACE** ‘root123.xxxx1’;
修改pg_hba.conf文件，这个文件要想当清楚，需要在(IPv4 local connections)增添一条为
IPv4 local connections:

- host all all 172.24.78.107/32 md5
  最后重启mogdb实例(视情况而定)或者gsql执行pg_reload_conf()函数

昨晚以上的所有步骤，就可以通过sysbench来连接mogdb数据库。

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

同时也发现在解决这个问题的时候发现还有3种不同的错误，可以参考一下，因为我觉得这2个错误都比较简单，可以自己解决。

- FATAL: `sysbench.cmdline.call_command’ function failed: /usr/share/sysbench/oltp_common.lua:83: connection creation failed
  -FATAL: Connection to database failed: **authentication method 11 not supported**
- FATAL: Connection to database failed: **FATAL: no pg_hba.conf entry for host “172.24.78.xx”, user “user1”, database “xxx”, SSL off**
- FATAL: Connection to database failed: FATAL: **Forbid remote connection with trust method!**

