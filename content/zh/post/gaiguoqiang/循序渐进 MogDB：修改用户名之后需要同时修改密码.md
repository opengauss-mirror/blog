+++

title = "循序渐进 MogDB：修改用户名之后需要同时修改密码" 

date = "2023-03-07" 

tags = ["MogDB"] 

archives = "2023-03" 

author = "盖国强" 

summary = "循序渐进 MogDB：修改用户名之后需要同时修改密码"

img = "/zh/post/gaiguoqiang/title/img29.png" 

times = "15:30"

+++

本文出处：[https://www.modb.pro/db/611813](https://www.modb.pro/db/611813)



**有朋友问**：改了用户名。数据库名。表空间名。然后链接数据库提示用户或密码不正确是什么原因呢？

在云和恩墨的 MogDB 中，当修改了用户名之后，需要随后修改密码，以兼容 PG 客户端。

### 测试用例

连接数据库：

```
omm@876c51460fa2:~$ gsql -d mogdb -U omm
gsql ((MogDB 3.0.1 build 1a363ea9) compiled at 2022-08-05 18:01:26 commit 0 last mr  )
NOTICE : The password has been expired, please change the password. 
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.
```

创建用户：

```
MogDB=#create user mog password 'Mog@Enmo';
NOTICE:  The encrypted password contains MD5 ciphertext, which is not secure.
CREATE ROLE
```

修改用户名之后，提示修改密码（如果是通过某些远程客户端，可能无法捕获这个提示：

```
MogDB=#alter user mog rename to mogdb;
ERROR:  role "mogdb" already exists
MogDB=#alter user mog rename to enmomogdb;
WARNING:  Please alter the role's password after rename role name for compatible with PG client.
ALTER ROLE
MogDB=#
```

### 修改用户密码

然后可以恢复，正常连接访问数据库：

```
MogDB=#alter user enmomogdb password 'Enmo#1234';
NOTICE:  The encrypted password contains MD5 ciphertext, which is not secure.
ALTER ROLE
MogDB=#\q
omm@876c51460fa2:~$ gsql -d enmomogdb -U omm
gsql: FATAL:  database "enmomogdb" does not exist
omm@876c51460fa2:~$ gsql -d mogdb -U enmomogdb
Password for user enmomogdb: 
gsql ((MogDB 3.0.1 build 1a363ea9) compiled at 2022-08-05 18:01:26 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.
```
