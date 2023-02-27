---
title: 'MogDB/openGauss访问控制简介'

date: '2022-07-28'

category: 'blog'
tags: ['MogDB']

archives: '2022-07'

author: '云和恩墨-郭欢'

summary: 'MogDB/openGauss访问控制简介'

img: '/zh/blogs/guohuan/title/img.png'

times: '10:20'
---

# MogDB/openGauss 访问控制简介

SQL 可以针对不同的数据库对象赋予不同的权限，这样就可以限制用户对数据的不必要访问，提高数据访问的安全性。常见的 SQL 权限如下：

- SELECT/UPDATE/DELETE/INSERT：访问、修改基本表或视图的权限
- REFERENCES：在基本表上创建外键约束的权限
- TRIGGER：在基本表上创建触发器的权限
- EXECUTE：存储过程的执行权限
- GRANT：用户可以通过 GRANT 语句来授予权限

将 warehouse 表的 SELECT 权限授予用户 U1，具体语句如下：

```
MogDB=# create user U1 password 'Enmo@123';
NOTICE:  The encrypted password contains MD5 ciphertext, which is not secure.
CREATE ROLE
MogDB=# GRANT SELECT ON TABLE warehouse TO U1;
GRANT
```

将 warehouse 表的(w_id, w_name)列的 SELECT 权限授予用户 U1，具体语句如下：

```
MogDB=# GRANT SELECT (w_id, w_name) ON TABLE warehouse TO U1;
GRANT
```

- REVOKE：用户可以通过 REVOKE 语句来收回权限

将 warehouse 表的 SELECT 权限从用户 U1 收回，具体语句如下：

```
MogDB=# REVOKE SELECT ON TABLE warehouse FROM U1;
REVOKE
```

将 warehouse 表的(w_id, w_name)列的 SELECT 权限从用户 U1 收回，具体语句如下：

```
MogDB=# REVOKE SELECT (w_id, w_name) ON TABLE warehouse FROM U1;
REVOKE
```
