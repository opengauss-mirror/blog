+++

title = "openGauss1.0.0 用户被锁" 

date = "2022-05-24" 

tags = ["openGauss1.0.0 用户被锁"] 

archives = "2022-05" 

author = "云和恩墨" 

summary = "openGauss1.0.0 用户被锁"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# openGauss1.0.0 用户被锁

本文出处：[https://www.modb.pro/db/27536](https://www.modb.pro/db/27536)

openGauss1.0.0 用户被锁

对于openGuass用户被锁，感觉很纳闷，基于pg的内核，pg早就没有锁用户这一说法，openGauss应该是修改了，今天遇到了，只是修改了下hba配置文件，配置远程连接，重启后居然用户被锁了，原因没找到，索性把问题先留在这里吧。。

问题原因找到！

问题原因：
归根结底还是密码认证方式的原因。默认openGauss安装后，使用sha256密码认证策略，为了让数据库远程连接，我在hba配置文件里，添加的是md5策略。然后多次远程连接登录失败，导致用户被锁定。

```
[omm@gsdb01 db1]$ gsql -d testdb -U aps2 -p 40000
Password for user aps2: 
gsql: FATAL:  The account has been locked.
[omm@gsdb01 db1]$
[omm@gsdb01 db1]$ gsql -d postgres -p 40000
gsql ((openGauss 1.0.0 build 0bd0ce80) compiled at 2020-06-30 18:19:27 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

postgres=# select * from pg_user;
 usename | usesysid | usecreatedb | usesuper | usecatupd | userepl |  passwd  | valbegin | valuntil |   respool    | parent | spacelimit | useconfig | nodegroup | tempspacelimit | spillspacelimit 
---------+----------+-------------+----------+-----------+---------+----------+----------+----------+--------------+--------+------------+-----------+-----------+----------------+-----------------
 omm     |       10 | t           | t        | t         | t       | ******** |          |          | default_pool |      0 |            |           |           |                | 
 aps2    |    16385 | t           | f        | f         | f       | ******** |          |          | default_pool |      0 |            |           |           |                | 
(2 rows)

postgres=# select * from pg_locks;
  locktype  | database | relation | page | tuple | bucket | virtualxid | transactionid | classid | objid | objsubid | virtualtransaction |       pid       |    sessionid    |      mode       | granted | fastpat
h 
------------+----------+----------+------+-------+--------+------------+---------------+---------+-------+----------+--------------------+-----------------+-----------------+-----------------+---------+--------
--
 relation   |    14790 |    11733 |      |       |        |            |               |         |       |          | 6/28               | 140253751932672 | 140253751932672 | AccessShareLock | t       | t
 virtualxid |          |          |      |       |        | 6/28       |               |         |       |          | 6/28               | 140253751932672 | 140253751932672 | ExclusiveLock   | t       | t
(2 rows)

postgres=# 
```

解决办法：
alter … account unlock；解锁
然后重置密码

```
postgres=# alter user aps2 account unlock;
ALTER ROLE
postgres=#
postgres=# alter user aps2 password 'aps2#12345';
ALTER ROLE
postgres=# \q
[omm@gsdb01 db1]$ 
[omm@gsdb01 db1]$ gsql -d testdb -U aps2 -p 40000
Password for user aps2: 
gsql ((openGauss 1.0.0 build 0bd0ce80) compiled at 2020-06-30 18:19:27 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

testdb=>
```
