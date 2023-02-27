---
title: 'openGauss1.0.1支持oracle-fdw和mysql-fdw'

date: '2020-11-19'

category: 'blog'
tags: ['openGauss1.0.1支持oracle-fdw和mysql-fdw']

archives: '2020-11'

author: '多米爸比'

summary: 'openGauss1.0.1支持oracle-fdw和mysql-fdw'

img: '/zh/blogs/duomibabi/title/img27.png'

times: '18:30'
---

# openGauss1.0.1 支持 oracle-fdw 和 mysql-fdw<a name="ZH-CN_TOPIC_0291959517"></a>

FDW\(Foreign Data Wrappers\)插件允许在 openGauss 里访问其他异构数据库的表，openGauss 支持 Foreign Data Wrappers for oracle （oracle_fdw），Foreign Data Wrappers for MySQL（mysql_fdw）和 Foreign Data Wrappers for PostgreSQL（Postgres_fdw），从而支持在 openGauss 中访问异构其他数据库。

使用 postgres_fdw 插件不需要重新编译 openGauss，具有系统管理员权限用户直接使用 create extension 创建扩展组件，普通用户即可 create server 配置异构数据库连接参数，create user mapping 创建异构用户映射关系，CREATE FOREIGN TABLE 创建指定数据库的外表。

使用 oracle_fdw 和 mysql_fdw 插件需要安装相应数据库的客户端包，同时需要重新编译 openGauss，在 configure 时配置 enable_mysql_fdw 和 enable_oracle_fdw。数据库里创建扩展与上面使用 postgres_fdw 类似。

## 数据库客户端包安装<a name="ZH-CN_TOPIC_0292870896"></a>

### mysql\(mariadb\)头文件<a name="section1110445413510"></a>

openGauss 源码编译开启 enable_mysql_fdw 需要依赖头文件 mariadb_com.h。

查找资料得知 mariadb_com.h 在这个包下：

[mariadb-connector-c-devel-3.0.10-1.el7.x86_64.rpm](http://repo.okay.com.mx/centos/7/x86_64/release/mariadb-connector-c-devel-3.0.10-1.el7.x86_64.rpm)

```
# rpm -ql mariadb-connector-c-devel-3.0.10-1.el7 |grep mariadb_com.h
/usr/include/mysql/mariadb_com.h
```

Centos7.6 下顺藤摸瓜按依赖安装。

```
# rpm -ivh MariaDB-common-5.5.68-1.el7.centos.x86_64.rpm
# rpm -ivh crypto-policies-20170816-1.git2618a6c.el7.noarch.rpm
# rpm -ivh openssl11-libs-1.1.0i-1.el7.x86_64.rpm
# rpm -ivh mariadb-connector-c-3.0.10-1.el7.x86_64.rpm
# rpm -ivh mariadb-connector-c-devel-3.0.10-1.el7.x86_64.rpm
```

### oracle 客户端包<a name="section16486454949"></a>

```
# yum install oracle-instantclient11.2-basic-11.2.0.4.0-1.x86_64.rpm
# yum install oracle-instantclient11.2-devel-11.2.0.4.0-1.x86_64.rpm
```

安装完上面两个包后，修改下动态库环境变量。

```
# vi /etc/ld.so.conf
include ld.so.conf.d/*.conf
/usr/lib/oracle/11.2/client64/lib

# ldconfig
```

## openGauss-sever 源码编译<a name="ZH-CN_TOPIC_0292870897"></a>

### configure 配置 enable_mysql_fdw 和 enable_oracle_fdw<a name="section639984215911"></a>

```
./configure  --prefix=/opt/og \
--gcc-version=8.2.0 \
--3rd=/opt/binarylibs \
--with-readline \
--with-zlib \
--with-libxml \
--enable-mysql-fdw \
--enable-oracle-fdw \
--enable-thread-safety \
CC=g++ CFLAGS="-O2 -g3"
```

### make<a name="section13604621205"></a>

```
make -sj
make -sj install
```

### 初始化<a name="section44331324516"></a>

```
/opt/og/bin/gs_initdb --nodename=og_6432 \
--pgdata=/opt/ogdata \
--encoding=UTF-8 \
--locale=en_US.UTF-8 \
--username=omm \
--pwpasswd=Enmotech@2020 \
--security

vi /opt/ogdata/postgresql.conf
port=6432
listen_addresses = '0.0.0.0'
password_encryption_type = 0
```

### 启动服务<a name="section32349302120"></a>

```
/opt/og/bin/gs_ctl start -D /opt/ogdata -l og_server.log &
```

### 创建用户<a name="section144840382117"></a>

```
create user postgres sysadmin IDENTIFIED BY 'Enmotech@2020';
create user opengauss IDENTIFIED BY 'Enmotech@2020';
```

postgres 用户具有管理权限，而已用来创建 extension 及分配普通用户使用 fdw 的权限 openGauss 普通用户可以创建 server 及使用外部表。

## FDW 测试<a name="ZH-CN_TOPIC_0292870898"></a>

### mysql_fdw 测试<a name="section7112312194912"></a>

创建扩展\(用户必须有 sysadmin 权限\)。

```
$ gsql -p6432 -Upostgres postgres

postgres=>  create extension mysql_fdw with schema public;
CREATE EXTENSION
```

查看扩展版本。

```
postgres=> select mysql_fdw_version();
 mysql_fdw_version
-------------------
             20503
(1 row)
```

postgres 用户\(有 sysadmin 管理权限\)赋予普通用户 openGauss 使用 mysql_fdw 权限。

```
postgres=> grant USAGE on FOREIGN data wrapper mysql_fdw to opengauss;
GRANT
```

普通用户 openGauss 操作创建 server。

```
postgres=> create server server_mysql foreign data wrapper mysql_fdw options(host'172.19.0.100',port '3306');
CREATE SERVER
```

普通用户 openGauss 操作创建用户映射。

```
postgres=> create user mapping for opengauss server server_mysql options(username 'root',password '123456');
CREATE USER MAPPING
```

普通用户 openGauss 创建外部表。

```
postgres=> create foreign table f_mysql_t1(
id int
)server server_mysql
options (dbname 'mysql',table_name 't1');
CREATE FOREIGN TABLE
```

通过外部表查询 mysql 数据库表数据。

```
postgres=> select * from f_mysql_t1;
  id
------
 1001
(1 row)
```

从 openGauss 端写入数据到 mysql。

```
postgres=> insert into f_mysql_t1 values(1002);
INSERT 0 1
```

注意 mysql 端表必须有主键或唯一索引，否则会报错。

```
postgres=> insert into f_mysql_t1 values(1002);
ERROR:  first column of remote table must be unique for INSERT/UPDATE/DELETE operation
```

再次查看数据。

```
postgres=> select * from f_mysql_t1;
  id
------
 1001
 1002
(2 rows)
```

### oracle_fdw 测试<a name="section5483540194816"></a>

与 mysql_fdw 类似，注意 LD_LIBRARY_PATH 配置了 oracle 的 lib 路径（/usr/lib/oracle/11.2/client64/lib）创建扩展\(用户必须有 sysadmin 权限\)。

```
$ gsql -p6432 -Upostgres postgres

postgres=#  create extension oracle_fdw with schema public;
CREATE EXTENSION
```

查看扩展版本。

```
postgres=> select oracle_diag();
                         oracle_diag
--------------------------------------------------------------
 oracle_fdw 2.2.0, PostgreSQL 9.2.4, Oracle client 11.2.0.4.0
(1 row)
```

postgres 用户\(有 sysadmin 管理权限\)赋予普通用户 opengauss 使用 oracle_fdw 权限。

```
postgres=> grant USAGE on FOREIGN data wrapper oracle_fdw to opengauss;
GRANT
```

普通用户 openGauss 操作创建 server。

```
$ gsql -p6432 -Uopengauss postgres

postgres=> create server server_oracle foreign data wrapper oracle_fdw options(dbserver '172.17.0.2:1521/lee');
CREATE SERVER
```

普通用户 openGauss 操作创建用户映射。

```
postgres=> create user mapping for opengauss server server_oracle options(user 'system',password 'admin');
CREATE USER MAPPING
```

普通用户 openGauss 创建外部表。

```
postgres=> create foreign table f_oracle_t2(
id int
)server server_oracle
OPTIONS (
    schema 'SYSTEM',
    "table" 'T2'
);
CREATE FOREIGN TABLE
```

通过外部表查询 oracle 数据库 t2 表数据。

```
postgres=> select * from f_oracle_t2;
  id
------
 2001
(1 row)
```

从 openGauss 端写入数据到 oracle 数据库 t2 表。

```
postgres=> insert into f_oracle_t2 values(2002);
INSERT 0 1
```

再次查看数据。

```
postgres=> select * from f_oracle_t2 ;
  id
------
 2001
 2002
(2 rows)
```
