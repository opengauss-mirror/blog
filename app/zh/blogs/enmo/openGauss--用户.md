---
title: 'openGauss--用户'

date: '2022-05-24'

category: 'blog'
tags: ['openGauss--用户']

archives: '2022-05'

author: '云和恩墨'

summary: 'openGauss--用户'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# openGauss--用户

本文出处：[https://www.modb.pro/db/40627](https://www.modb.pro/db/40627)

### 用户

使用 CREATE USER 和 ALTER USER 可以创建和管理数据库用户。openGauss 包含一个或多个已命名数据库。用户和角色在整个 openGauss 范围内是共享的，但是其数据并不共享。即用户可以连接任何数据库，但当连接成功后，任何用户都只能访问连接请求里声明的那个数据库。

非三权分立下，openGauss 用户帐户只能由系统管理员或拥有 CREATEROLE 属性的安全管理员创建和删除。三权分立时，用户帐户只能由初始用户和安全管理员创建。

在用户登录 openGauss 时会对其进行身份验证。用户可以拥有数据库和数据库对象（例如表），并且可以向用户和角色授予对这些对象的权限以控制谁可以访问哪个对象。除系统管理员外，具有 CREATEDB 属性的用户可以创建数据库并授予对这些数据库的权限。

### 创建、修改和删除用户

- 要创建用户，请使用 SQL 语句 CREATE USER。
  例如：创建用户 joe，并设置用户拥有 CREATEDB 属性。

```
postgres=# CREATE USER joe WITH CREATEDB PASSWORD "Bigdata@123"; CREATE ROLE
```

- 要创建系统管理员，请使用带有 SYSADMIN 选项的 CREATE USER 语句 。
- 要删除现有用户，请使用 DROP USER。
- 要更改用户帐户（例如，重命名用户或更改密码），请使用 ALTER USER。
- 要查看用户列表，请查询视图 PG_USER：

```
SELECT * FROM pg_user;
```

要查看用户属性，请查询系统表 PG_AUTHID：

```
SELECT * FROM pg_authid;
```

### 私有用户

对于有多个业务部门，各部门间使用不同的数据库用户进行业务操作，同时有一个同级的数据库维护部门使用数据库管理员进行维护操作的场景下，业务部门可能希望在未经授权的情况下，管理员用户只能对各部门的数据进行控制操作（DROP、ALTER、TRUNCATE），但是不能进行访问操作（INSERT、DELETE、UPDATE、SELECT、COPY）。即针对管理员用户，表对象的控制权和访问权要能够分离，提高普通用户数据安全性。

三权分立情况下，管理员对其他用户放在属于各自模式下的表无权限。但是，这种无权限包含了无控制权限，因此不能满足上面的诉求。为此，openGauss 提供了私有用户方案。即在非三权分立模式下，创建具有 INDEPENDENT 属性的私有用户。

```
CREATE USER user_independent WITH INDEPENDENT IDENTIFIED BY "1234@abc";
```

针对该用户的对象，系统管理员和拥有 CREATEROLE 属性的安全管理员在未经其授权前，只能进行控制操作（DROP、ALTER、TRUNCATE），无权进行 INSERT、DELETE、SELECT、UPDATE、COPY、GRANT、REVOKE、ALTER OWNER 操作。
