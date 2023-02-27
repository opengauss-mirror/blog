---
title: 'openGauss每日一练第四天'

date: '2022-04-19'

category: 'blog'
tags: ['openGauss每日一练第四天']

archives: '2022-04'

author: '云和恩墨'

summary: 'openGauss每日一练第四天'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# openGauss 每日一练第四天

本文出处：[https://www.modb.pro/db/193083](https://www.modb.pro/db/193083)

## 学习地址

[https://www.modb.pro/course/133](https://www.modb.pro/course/133)

## 学习目标

学习 openGauss 创建角色、修改角色属性、更改角色权限和删除角色
角色是用来管理权限的，从数据库安全的角度考虑，可以把所有的管理和操作权限划分到不同的角色上

## 课后作业

过程中使用\du 或\du+查看角色信息

### **1.创建角色 role1 为系统管理员, role2 指定生效日期, role3 具有 LOGIN 属性**

```
SQL文本：
create role role1 sysadmin identified by 'role1_123';
create role role2 identified by 'role2_123' vaild begein '2021-11-11';
create role role3 login identified by 'role3_123';
\du+

omm=# create role role1 sysadmin identified by 'role1_123';
CREATE ROLE
omm=# create role role2 identified by 'role2_123' valid begin '2021-11-11';
CREATE ROLE
omm=# create role role3 login identified by 'role3_123';
CREATE ROLE
omm=# \du+
                                                                     List of roles
 Role name |                                                    Attributes                                                    | Member of | Description
-----------+------------------------------------------------------------------------------------------------------------------+-----------+-------------
 lizi      | Create role, Create DB, Replication, Administer audit, Sysadmin, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 omm       | Sysadmin, Create role, Create DB, Replication, Administer audit, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 role1     | Cannot login, Sysadmin                                                                                           | {}        |
 role2     | Cannot login                                                                                                    +| {}        |
           | Role valid begin 2021-11-11 00:00:00+08                                                                          |           |
 role3     |                                                                                                                  | {}        |

omm=#

```

### **2.重命名 role1**

```
SQL文本：
alter role role1 rename to role111;
\du+

omm=# alter role role1 rename to role111;
ALTER ROLE
omm=# \du+
                                                                     List of roles
 Role name |                                                    Attributes                                                    | Member of | Description
-----------+------------------------------------------------------------------------------------------------------------------+-----------+-------------
 lizi      | Create role, Create DB, Replication, Administer audit, Sysadmin, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 omm       | Sysadmin, Create role, Create DB, Replication, Administer audit, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 role111   | Cannot login, Sysadmin                                                                                           | {}        |
 role2     | Cannot login                                                                                                    +| {}        |
           | Role valid begin 2021-11-11 00:00:00+08                                                                          |           |
 role3     |                                                                                                                  | {}        |

omm=#

```

### **3.修改 role2 密码**

```
SQL文本：
alter role role2 identified by 'role2_456' replace 'role2_123'
或者
alter role role2 identified by 'role2_789';

omm=# alter role role2 identified by 'role2_456' replace 'role2_456';
ALTER ROLE
omm=# alter role role2 identified by 'role2_789';
ALTER ROLE
omm=# \du+
                                                                     List of roles
 Role name |                                                    Attributes                                                    | Member of | Description
-----------+------------------------------------------------------------------------------------------------------------------+-----------+-------------
 lizi      | Create role, Create DB, Replication, Administer audit, Sysadmin, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 omm       | Sysadmin, Create role, Create DB, Replication, Administer audit, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 role111   | Cannot login, Sysadmin                                                                                           | {}        |
 role2     | Cannot login                                                                                                    +| {}        |
           | Role valid begin 2021-11-11 00:00:00+08                                                                          |           |
 role3     |                                                                                                                  | {}        |

omm=#
```

### **4.将 omm 权限授权给 role3,再回收 role3 的权限**

```
SQL文本：
grant omm to role3;
\du+
revoke all privilege from role3;
\du+


omm=# grant omm to role3;
GRANT ROLE
omm=# \du+
                                                                     List of roles
 Role name |                                                    Attributes                                                    | Member of | Description
-----------+------------------------------------------------------------------------------------------------------------------+-----------+-------------
 lizi      | Create role, Create DB, Replication, Administer audit, Sysadmin, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 omm       | Sysadmin, Create role, Create DB, Replication, Administer audit, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 role111   | Cannot login, Sysadmin                                                                                           | {}        |
 role2     | Cannot login                                                                                                    +| {}        |
           | Role valid begin 2021-11-11 00:00:00+08                                                                          |           |
 role3     |                                                                                                                  | {omm}     |
 utest     |                                                                                                                  | {}        |

omm=# revoke all privilege from role3;
ALTER ROLE
omm=# \du+
                                                                     List of roles
 Role name |                                                    Attributes                                                    | Member of | Description
-----------+------------------------------------------------------------------------------------------------------------------+-----------+-------------
 lizi      | Create role, Create DB, Replication, Administer audit, Sysadmin, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 omm       | Sysadmin, Create role, Create DB, Replication, Administer audit, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 role111   | Cannot login, Sysadmin                                                                                           | {}        |
 role2     | Cannot login                                                                                                    +| {}        |
           | Role valid begin 2021-11-11 00:00:00+08                                                                          |           |
 role3     |                                                                                                                  | {omm}     |

omm=#

```

### 5.删除所有创建角色

```
SQL文本：
drop role role1;
drop role role2;
drop role role3;
\du+

omm=# drop role role111;
DROP ROLE
omm=# drop role role2;
drop role role3;
DROP ROLE
omm=# drop role role3;
DROP ROLE
omm=# \du+
                                                                     List of roles
 Role name |                                                    Attributes                                                    | Member of | Description
-----------+------------------------------------------------------------------------------------------------------------------+-----------+-------------
 lizi      | Create role, Create DB, Replication, Administer audit, Sysadmin, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 omm       | Sysadmin, Create role, Create DB, Replication, Administer audit, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |

omm=#
```
