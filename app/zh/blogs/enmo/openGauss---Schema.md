---
title: 'openGauss--Schema'

date: '2022-05-24'

category: 'blog'
tags: ['openGauss--Schema']

archives: '2022-05'

author: '云和恩墨交付'

summary: 'openGauss--Schema'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# openGauss---Schema

本文出处：[https://www.modb.pro/db/40747](https://www.modb.pro/db/40747)

### Schema

Schema 又称作模式。通过管理 Schema，允许多个用户使用同一数据库而不相互干扰，可以将数据库对象组织成易于管理的逻辑组，同时便于将第三方应用添加到相应的 Schema 下而不引起冲突。

每个数据库包含一个或多个 Schema。数据库中的每个 Schema 包含表和其他类型的对象。数据库创建初始，默认具有一个名为 public 的 Schema，且所有用户都拥有此 Schema 的权限。可以通过 Schema 分组数据库对象。Schema 类似于操作系统目录，但 Schema 不能嵌套。

相同的数据库对象名称可以应用在同一数据库的不同 Schema 中，而没有冲突。例如，a_schema 和 b_schema 都可以包含名为 mytable 的表。具有所需权限的用户可以访问数据库的多个 Schema 中的对象。

在数据库创建用户时，系统会自动帮助用户创建一个同名 Schema。

数据库对象是创建在数据库搜索路径中的第一个 Schema 内的。有关默认情况下的第一个 Schema 情况及如何变更 Schema 顺序等更多信息，请参见搜索路径。

### 创建、修改和删除 Schema

- 要创建 Schema，请使用 CREATE SCHEMA。默认初始用户和系统管理员可以创建 Schema，其他用户需要具备数据库的 CREATE 权限才可以在该数据库中创建 Schema，赋权方式请参考 GRANT 中将数据库的访问权限赋予指定的用户或角色中的语法。
- 要更改 Schema 名称或者所有者，请使用 ALTER SCHEMA。Schema 所有者可以更改 Schema。
- 要删除 Schema 及其对象，请使用 DROP SCHEMA。Schema 所有者可以删除 Schema。
- 要在 Schema 内创建表，请以 schema_name.table_name 格式创建表。不指定 schema_name 时，对象默认创建到搜索路径中的第一个 Schema 内。
- 要查看 Schema 所有者，请对系统表 PG_NAMESPACE 和 PG_USER 执行如下关联查询。语句中的 schema_name 请替换为实际要查找的 Schema 名称。

```
SELECT s.nspname,u.usename AS nspowner FROM pg_namespace s, pg_user u WHERE nspname='schema_name' AND s.nspowner = u.usesysid;
```

- 要查看所有 Schema 的列表，请查询 PG_NAMESPACE 系统表。

```
SELECT * FROM pg_namespace;
```

- 要查看属于某 Schema 下的表列表，请查询系统视图 PG_TABLES。例如，以下查询会返回 Schema PG_CATALOG 中的表列表。

```
SELECT distinct(tablename),schemaname from pg_tables where schemaname = 'pg_catalog';
```

### 搜索路径

搜索路径定义在 search_path 参数中，参数取值形式为采用逗号分隔的 Schema 名称列表。如果创建对象时未指定目标 Schema，则将该对象会被添加到搜索路径中列出的第一个 Schema 中。当不同 Schema 中存在同名的对象时，查询对象未指定 Schema 的情况下，将从搜索路径中包含该对象的第一个 Schema 中返回对象。

- 要查看当前搜索路径，请使用 SHOW。

```
postgres=# SHOW SEARCH_PATH; search_path ---------------- "$user",public (1 row)
```

search_path 参数的默认值为：”user”，public。user 表示与当前会话用户名同名的 Schema 名，如果这样的模式不存在，$user 将被忽略。所以默认情况下，用户连接数据库后，如果数据库下存在同名 Schema，则对象会添加到同名 Schema 下，否则对象被添加到 Public Schema 下。

- 要更改当前会话的默认 Schema，请使用 SET 命令。

执行如下命令将搜索路径设置为 myschema、public，首先搜索 myschema。

```
postgres=# SET SEARCH_PATH TO myschema, public;
SET
```
