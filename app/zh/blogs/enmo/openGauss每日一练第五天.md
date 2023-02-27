---
title: 'openGauss每日一练第5天'

date: '2022-04-20'

category: 'blog'
tags: ['openGauss每日一练第5天']

archives: '2022-04'

author: '云和恩墨'

summary: 'openGauss每日一练第5天'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# openGauss 每日一练第 5 天

本文出处：https://www.modb.pro/db/193101

## 学习地址

https://www.modb.pro/course/133

## 学习目标

学习 openGauss 创建用户、修改用户属性、更改用户权限和删除用户

用户是用来登录数据库的，通过对用户赋予不同的权限，可以方便地管理用户对数据库的访问及操作

## 课程作业

过程中使用\du 或\du+查看用户信息

### **1.创建用户 user1、user2 和 user3，user1 具有 CREATEROLE 权限，user2 具有 CREATEDB 权限，要求使用两种不同的方法设置密码**

```
SQL文本：
create user user1 createrole password 'user1_123';
create user user2 createdb identified by 'user2_123';
create user user3 password 'user3_123';
\du+

omm=# create user user1 createrole password 'user1_123';
CREATE ROLE
omm=# create user user2 createdb identified by 'user2_123';
CREATE ROLE
omm=# create user user3 password 'user3_123';
CREATE ROLE
omm=# \du+
                                                                     List of roles
 Role name |                                                    Attributes                                                    | Member of | Description
-----------+------------------------------------------------------------------------------------------------------------------+-----------+-------------
 lizi      | Create role, Create DB, Replication, Administer audit, Sysadmin, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 omm       | Sysadmin, Create role, Create DB, Replication, Administer audit, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 user1     | Create role                                                                                                      | {}        |
 user2     | Create DB                                                                                                        | {}        |
 user3     |                                                                                                                  | {}        |

omm=#

```

### **2.修改用户 user1 的密码**

```
SQL文本：
alter user user1 identified by 'user1_456' replace 'user1_123';
或者
alter user user1 password 'user1_789' ;

omm=# alter user user1 identified by 'user1_456' replace 'user1_123';
ALTER ROLE
omm=# alter user user1 password 'user1_789' ;
ALTER ROLE
omm=# \du+
                                                                     List of roles
 Role name |                                                    Attributes                                                    | Member of | Description
-----------+------------------------------------------------------------------------------------------------------------------+-----------+-------------
 lizi      | Create role, Create DB, Replication, Administer audit, Sysadmin, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 omm       | Sysadmin, Create role, Create DB, Replication, Administer audit, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 user1     | Create role                                                                                                      | {}        |
 user2     | Create DB                                                                                                        | {}        |
 user3     |                                                                                                                  | {}        |

omm=#

```

### **3.重命名用户 user2**

```
SQL文本：
alter user user2 rename to user222;
\du+

omm=# alter user user2 rename to user222;
ALTER ROLE
omm=# \du+
                                                                     List of roles
 Role name |                                                    Attributes                                                    | Member of | Description
-----------+------------------------------------------------------------------------------------------------------------------+-----------+-------------
 lizi      | Create role, Create DB, Replication, Administer audit, Sysadmin, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 omm       | Sysadmin, Create role, Create DB, Replication, Administer audit, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 user1     | Create role                                                                                                      | {}        |
 user222   | Create DB                                                                                                        | {}        |
 user3     |                                                                                                                  | {}        |

omm=#

```

### **4.将用户 user1 的权限授权给用户 user3，再回收用户 user3 的权限**

```
SQL文本：
grant user1 to user3;
\du+
revoke all privilege from user3;
\du+

omm=# grant user1 to user3;
GRANT ROLE
omm=# \du+
                                                                     List of roles
 Role name |                                                    Attributes                                                    | Member of | Description
-----------+------------------------------------------------------------------------------------------------------------------+-----------+-------------
 lizi      | Create role, Create DB, Replication, Administer audit, Sysadmin, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 omm       | Sysadmin, Create role, Create DB, Replication, Administer audit, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 user1     | Create role                                                                                                      | {}        |
 user222   | Create DB                                                                                                        | {}        |
 user3     |                                                                                                                  | {user1}   |

omm=# revoke all privilege from user3;
ALTER ROLE
omm=# \du+
                                                                     List of roles
 Role name |                                                    Attributes                                                    | Member of | Description
-----------+------------------------------------------------------------------------------------------------------------------+-----------+-------------
 lizi      | Create role, Create DB, Replication, Administer audit, Sysadmin, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 omm       | Sysadmin, Create role, Create DB, Replication, Administer audit, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 user1     | Create role                                                                                                      | {}        |
 user222   | Create DB                                                                                                        | {}        |
 user3     |                                                                                                                  | {user1}   |

omm=#

```

### **5.删除所有创建用户**

```
SQL文本： drop user user1; drop user user222; drop user user3; \du+
omm=# drop user user1;
DROP ROLE
omm=# drop user user222;
DROP ROLE
omm=# drop user user3;
DROP ROLE
omm=# \du+
                                                                     List of roles
 Role name |                                                    Attributes                                                    | Member of | Description
-----------+------------------------------------------------------------------------------------------------------------------+-----------+-------------
 lizi      | Create role, Create DB, Replication, Administer audit, Sysadmin, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |
 omm       | Sysadmin, Create role, Create DB, Replication, Administer audit, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}        |

omm=#
```
