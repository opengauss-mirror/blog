---
title: 'MogDB/openGauss default privileges 使用方法'

date: '2022-11-25'

tags: ['MogDB/openGauss default privileges 使用方法']

archives: '2022-11'
category: 'blog'
author: '高云龙'

summary: 'MogDB/openGauss default privileges 使用方法'

img: ''

times: '13:30'
---

# MogDB/openGauss default privileges 使用方法

权限是用户访问数据库对象的首要条件，每个新增用户默认属于 PUBLIC 角色组成员，也就是具有 PUBLIC 角色组的权限，但在日常业务使用中，仅仅具有 PUBLIC 权限是远远不够的，还需要具有额外的权限，在 MogDB/openGauss 数据库支持的业务中经常需要一种具有只读权限的用户，这个用户不仅仅可以需要对已经存在的数据库对象具有只读权限，对未来的数据库也需要同样的权限，如果每添加一个数据库都要执行一遍 grant 赋权操作，这显然不是用户希望的，所以这里需要借助 alter default privileges 语法。

### 语法语义

目前支持表（包括视图）、 序列、函数、类型、密态数据库客户端主密钥和列加密密钥的权限更改。

```
AlterDafaultPrivileges ::= ALTER DEFAULT PRIVILEGES
    [ FOR { ROLE | USER } target_role [, ...] ]
    [ IN SCHEMA schema_name [, ...] ]
    abbreviated_grant_or_revoke;

  abbreviated_grant_or_revoke ::= grant_on_tables_clause
        | grant_on_sequences_clause
        | grant_on_functions_clause
        | grant_on_types_clause
        | grant_on_client_master_keys_clause
        | grant_on_column_encryption_keys_clause
        | revoke_on_tables_clause
        | revoke_on_sequences_clause
        | revoke_on_functions_clause
        | revoke_on_types_clause
        | revoke_on_client_master_keys_clause
        | revoke_on_column_encryption_keys_clause
```

但是在日常使用中，我们经常会遇到一种情况，就是我们已经执行了 alter default privileges 命令，而且已经执行成功了，但是只读用户去查询新增的数据库对象时依然提示 Permission denied，这是需要仔细看一下报错内容：

> ERROR: permission denied for schema xxx
> 这代表没有 schema 的使用权限，需要给用户 schema 赋权
> grant usage on schema xxx to xxx;

> ERROR: permission denied for relation xxx
> 这代表没有这个表的访问权限

对于 schema 我们应该很好理解，在 MogDB/openGauss 中每个逻辑层级的对象都有自己的权限，且都需要单独给权限。

但是第二个报错是什么原因呢？明明已经给了 default privileges 权限了呀？

我们现在有三个用户分别是 omm、u1 和 ur，其中 omm 是超户，u1 是读写用户，ur 是只读用户，s 是我们的 schema，u1 是 s 的 owner，我们想要用户 ur 可以访问 s 下所有的表，包括未来的表。

如果我们使用 u1 登陆数据库，并给 ur 赋权，我们需要执行

```
alter default privileges in schema s grant select on tables to ur;
```

如果我们使用 omm 登陆数据库，并给 ur 赋权，我们需要执行

```
alter default privileges for user u1 in schema s grant select on tables to ur;
```

我们发现执行 alter default privileges 权限生效与否，与执行的用户及其语法有关系了，主要是要不要添加**for user/role username**语法，如果是 schema owner 来执行不需要添加，而其他用户执行则需要添加此语法。

PS：PG14 添加了全局只读角色
