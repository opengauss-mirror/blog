---
title: '循序渐进 openGauss ：初始化参数的设置、查询和修改'

date: '2021-12-09'

category: 'blog'
tags: ['循序渐进 openGauss ：初始化参数的设置、查询和修改']

archives: '2021-12'

author: 'eygle'

summary: '循序渐进 openGauss ：初始化参数的设置、查询和修改'

img: '/zh/blogs/July/title/img12.png'

times: '12:30'
---

# 循序渐进 openGauss ：初始化参数的设置、查询和修改<a name="ZH-CN_TOPIC_0000001187373546"></a>

由于 openGauss 最早基于 PostgreSQL 创立，所以大多数接口完全兼容。在我们描述的文章中，以 openGauss 为入口，但是很多功能性实现是和 Pg 相一致的。

在 openGauss 中，可配置参数 被称为 GUC - Grand Unified Configuration，通常数据库安装后，会自动生成三个配置文件（postgresql.conf、pg_hba.conf 和 pg_ident.conf），并统一存放在数据目录（data）下。

对于 openGauss 来说，参数同样可以通过 pg_setttings 视图访问，在 openGauss 2.0 中，初始提供了 601 个参数：

```
omm=# select * from version();
                                                                                version

----------------------------------------------------------------------------------------------------------------------------------------------
PostgreSQL 9.2.4 (openGauss 2.0.0 build 78689da9) compiled at 2021-03-31 21:03:52 commit 0 last mr   on aarch64-unknown-linux-gnu, compiled b
y g++ (GCC) 7.3.0, 64-bit
(1 row)

omm=# select count(*) from pg_settings;
 count
-------
   601
(1 row)
```

展示具体参数值，可以通过 show 命令来实现：

```
omm=# show config_file;
               config_file
-----------------------------------------
 /var/lib/opengauss/data/postgresql.conf
(1 row)

omm=# show hba_file;
              hba_file
-------------------------------------
 /var/lib/opengauss/data/pg_hba.conf
(1 row)

omm=# show ident_file;
              ident_file
---------------------------------------
 /var/lib/opengauss/data/pg_ident.conf
(1 row)
```

通过单记录方式显示参数值：

```
omm=# \x
Expanded display is on.
omm=# select * from pg_settings where name='work_mem';
-[ RECORD 1 ]---------------------------------------------------------------------------------------------------------------------
name       | work_mem
setting    | 65536
unit       | kB
category   | Resource Usage / Memory
short_desc | Sets the maximum memory to be used for query workspaces.
extra_desc | This much memory can be used by each internal sort operation and hash table before switching to temporary disk files.
context    | user
vartype    | integer
source     | default
min_val    | 64
max_val    | 2147483647
enumvals   |
boot_val   | 65536
reset_val  | 65536
sourcefile |
sourceline |
```

注意，pg 的参数分为如下几个数据类型：

```
omm=# select distinct(vartype) from pg_settings;
 vartype
---------
 bool
 real
 int64
 string
 integer
 enum
(6 rows)
```

这些参数，根据不同的修改级别，分为以下六个类别：

```
omm=# select distinct(context) from pg_settings;
  context
------------
 internal
 user
 postmaster
 backend
 sighup
 superuser
(6 rows)
```

其中：

- internal：这类参数为只读参数，有的是 postgres 程序固定的，有的是在安装数据库时 intdb 时设置好的
- postmaster：这类参数需要重启数据库才能生效。
- sighup：不需要重启数据库，但要向 postmaster 进程发送 sighup 信号，即需要 pg_ctl reload 命令。
- backend：无需重启数据库，只需向 postmaster 进程发送 sighup 信号。但新的配置值只能在之后的新连接中生效，已有连接中这些参数值不会改变。
- superuser：这类参数可以由超级用户使用 set 修改。参数设置后只会影响超级用户自身的 session 配置，不会影响其他用户。
- user：普通用户使用 set 设置，这类参数修改后和 superuser 类参数一样，也是只影响自身 session。

例如以下查询显示 wal_level 是一个 postmaster 参数：

```
omm=# select name,context from pg_settings where name like 'wal_level';
   name    |  context
-----------+------------
 wal_level | postmaster
(1 row)
```

在 openGauss 2.0 中，支持了通过 alter system 进行参数修改，以下尝试修改 work_mem 收到一个错误提示，目前 alter system 仅仅支持 POSTMASTER-level, SIGHUP-level 和 BACKEND-level 级别的 guc 参数修改：

```
omm=# select name,context from pg_settings where name like 'work_mem';
   name   | context
----------+---------
 work_mem | user
(1 row)

omm=# show work_mem;
 work_mem
----------
 64MB
(1 row)
```

```
omm=# alter system set work_mem='16MB';
ERROR:  unsupport parameter: work_mem
ALTER SYSTEM SET only support POSTMASTER-level, SIGHUP-level and BACKEND-level guc variable,
and it must be allowed to set in postgresql.conf.
```

我们尝试修改：

```
omm=# select name,context from pg_settings where name='port';
 name |  context
------+------------
 port | postmaster
(1 row)
omm=# show port;
 port
------
 5432
(1 row)

omm=# alter system set port=8888;
NOTICE:  please restart the database for the POSTMASTER level parameter to take effect.
ALTER SYSTEM SET
omm=# show port;
 port
------
 5432
(1 row)
```

检查日志文件，日志提示需要重启参数才能生效：

```
[BACKEND] LOG:  received SIGHUP, reloading configuration files
[BACKEND] LOG:  parameter "port" cannot be changed without restarting the server
[BACKEND] LOG:  parameter "wal_level" cannot be changed without restarting the server
[BACKEND] LOG:  parameter "alarm_component" cannot be changed without restarting the server
[BACKEND] LOG:  parameter "pgxc_node_name" cannot be changed without restarting the server
[BACKEND] LOG:  parameter "listen_addresses" cannot be changed without restarting the server
[BACKEND] LOG:  configuration file "/var/lib/opengauss/data/postgresql.conf" contains errors; unaffected changes were applied
```

检查参数文件，可以发现该参数已经被写入：

```
omm@modb:pg_log$ grep 8888 /var/lib/opengauss/data/postgresql.conf
port = 8888                             # (change requires restart)
```
