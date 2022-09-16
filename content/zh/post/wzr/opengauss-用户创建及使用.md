+++ title="openGauss社区入门(opengauss-用户创建及使用)"
date="2022-09-16"
tags=["openGauss社区开发入门"]
archives="2022-09"
author="wangrururu"
summary="openGauss社区开发入门"
img="/zh/post/wzr/title/title.jpg"
times="19：33"
+++
**1.超级用户：**超级用户可以在数据库中做任何操作，无任何限制。
初始化数据库会创建与操作系统名一样的超级用户，该高级用户可以建其它的超级用户或普通用户，所以一个数据库中可以有多个超级用户。
**2.创建用户：**create user命令和create role 是同义词。
（1）通过CREATE USER创建的用户，默认具有LOGIN权限。
（2）通过CREATE USER创建用户的同时，系统会在执行该命令的数据库中，为该用户创建一个同名的SCHEMA。
（3）系统管理员在普通用户同名schema下创建的对象，所有者为schema的同名用户（非系统管理员）。
语法如下：
CREATE USER user_name [ [ WITH ] option [ ... ] ] [ ENCRYPTED | UNENCRYPTED ] { PASSWORD | IDENTIFIED BY } { 'password' [EXPIRED] | DISABLE };
其中option子句用于设置权限及属性等信息，如下：
{SYSADMIN | NOSYSADMIN}     | {MONADMIN | NOMONADMIN}     | {OPRADMIN | NOOPRADMIN}     | {POLADMIN | NOPOLADMIN}     | {AUDITADMIN | NOAUDITADMIN}     | {CREATEDB | NOCREATEDB}     | {USEFT | NOUSEFT}     | {CREATEROLE | NOCREATEROLE}     | {INHERIT | NOINHERIT}     | {LOGIN | NOLOGIN}     | {REPLICATION | NOREPLICATION}     | {INDEPENDENT | NOINDEPENDENT}     | {VCADMIN | NOVCADMIN}     | {PERSISTENCE | NOPERSISTENCE}     | CONNECTION LIMIT connlimit     | VALID BEGIN 'timestamp'     | VALID UNTIL 'timestamp'     | RESOURCE POOL 'respool'     | PERM SPACE 'spacelimit'     | TEMP SPACE 'tmpspacelimit'     | SPILL SPACE 'spillspacelimit'     | IN ROLE role_name [, ...]     | IN GROUP role_name [, ...]     | ROLE role_name [, ...]     | ADMIN role_name [, ...]     | USER role_name [, ...]     | SYSID uid     | DEFAULT TABLESPACE tablespace_name     | PROFILE DEFAULT     | PROFILE profile_name     | PGUSER
**其中password**登录密码规则如下：
密码默认不少于8个字符。
不能与用户名及用户名倒序相同。
至少包含大写字母（A-Z），小写字母（a-z），数字（0-9），非字母数字字符（限定为~!@#$%^&*()-_=+\|[{}];:,<.>/?）四类字符中的三类字符。
密码也可以是符合格式要求的密文字符串，这种情况主要用于用户数据导入场景，不推荐用户直接使用。如果直接使用密文密码，用户需要知道密文密码对应的明文，并且保证明文密码复杂度，数据库不会校验密文密码复杂度，直接使用密文密码的安全性由用户保证。
创建用户时，应当使用双引号或单引号将用户密码括起来。
例子：
创建一个普通用户：
Create user userr1 password 'Aa@123456';
或
create user userr2 IDENTIFIED BY  'Aa@123456';
创建一个有创建数据库权限的用户：
create user userr3 CREATEDB PASSWORD 'Aa@123456';
创建一个有sysadmin权限的用户：
create user userr4 with sysadmin password 'Aa@123456';
**3.查看用户：**\du
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1663327380885-4fe8e94e-ae5a-4e8c-ae6a-235ada8010a3.png#clientId=u5f325479-2bb7-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=354&id=uc3d47ce8&margin=%5Bobject%20Object%5D&name=image.png&originHeight=443&originWidth=1498&originalType=binary&ratio=1&rotation=0&showTitle=false&size=253824&status=done&style=none&taskId=u18fe07a6-f20f-4dd7-8780-e69fd3101a5&title=&width=1198.4)
**4.切换用户：**
以当前用户进入数据库：gsql -U 用户名 -d 数据库名
切换到当前用户下：set role 用户名 password '******';
重置用户：reset role;
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1663327850446-73ea11b8-7d7d-403e-ae49-034b4ba3edf4.png#clientId=u5f325479-2bb7-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=298&id=uc6a467f5&margin=%5Bobject%20Object%5D&name=image.png&originHeight=372&originWidth=1029&originalType=binary&ratio=1&rotation=0&showTitle=false&size=236447&status=done&style=none&taskId=uea6ad442-5c9c-45eb-a028-ef427eb4589&title=&width=823.2)
**5.权限说明：**
**SELECT：**该权限用来查询表或是表上的某些列，或是视图，序列。
**INSERT：**该权限允许对表或是视图进行插入数据操作，也可以使用COPY FROM进行数据的插入
**UPDATE：**该权限允许对表或是表上特定的列或是视图进行更新操作。
**DELETE：**该权限允许对表或是视图进行删除数据的操作。
**TRUNCATE：**允许对表进行清空操作。
**REFERENCES：**允许给参照列和被参照列上创建外键约束。
**TRIGGER：**允许在表上创建触发器。
**CREATE：**对于数据库，允许在数据库上创建Schema；对于Schema，允许对Schema上创建数据库对象；对于表空间，允许把表或是索引指定到对应的表空间上。
**CONNECT：**允许用户连接到指定的数据库上。
**TEMPORARY或是TEMP：**允许在指定数据库的时候创建临时表。
**EXECUTE：**允许执行某个函数。
**USAGE：**对于程序语言来说，允许使用指定的程序语言创建函数；对于Schema来说，允许查找该Schema下的对象；对于序列来说，允许使用currval和nextval函数；对于外部封装器来说，允许使用外部封装器来创建外部服务器；对于外部服务器来说，允许创建外部表。
**ALL PRIVILEGES：**表示一次性给予所有可以授予的权限。
**6.权限赋予：**
读取权限：Grant select on 表名 to 用户名；
打开行访问控制策略开关：alter table 表名 enable row level security;
给用户指定角色，使其拥有角色所有权限：grant 角色名 to 用户名；
**7.public schema：**任何用户都有查询权限。
所有用户均可查询表：Grant select on table 表名 to public;
回收public权限：revoke create on schema public from public;
**8.删除用户或角色**
删除角色：Drop role 角色名；
删除角色所拥有的所有对象：Drop owned by 角色名；
