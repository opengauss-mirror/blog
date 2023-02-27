---
title: 'Oracle数据表搬迁到openGauss'

date: '2021-05-10'

category: 'blog'
tags: ['openGauss数据迁移']

archives: '2021-05'

author: '多米爸比'

summary: 'Oracle数据表搬迁到openGauss'

img: '/zh/blogs/duomibabi/title/img31.png'

times: '12:30'
---

# Oracle 数据表搬迁到 openGauss<a name="ZH-CN_TOPIC_0000001142022051"></a>

## 搬迁方法<a name="section33641343132316"></a>

Oracle 数据表搬迁到 openGauss 数据库比较容易想到的两个工具是 oracle_fdw 及 Ora2Pg。

### **oracle_fdw**

oracle_fdw 是嵌入在目标端数据库里的一个扩展插件，允许在目标端数据库里访问其他异构数据库的表，openGauss 数据库目前也支持这一插件。

oracle_fdw 在 openGauss 数据库的使用可以参考我写的这篇文章：[<<opengauss1.0.1 支持 oracle_fdw 和 mysql_fdw\>\>](https://www.modb.pro/db/37650)

如下所示，目标端建立了到源端数据表的映射，可以在目标端用 create table as select 方式进行拷贝。

```
CREATE FOREIGN TABLE public.f_oracle_test (
    id int,
    info character varying
)
SERVER server_ora
OPTIONS (
    schema 'scott',
    "table" 'AA'
);
```

### **Ora2Pg**

Ora2Pg 是一个开源的迁移转换工具，它可以连接 Oracle 数据库并进行扫描，自动提取结构或数据，然后生成可加载到 PostgreSQL 数据库中的 SQL 脚本。

本文介绍使用 Ora2Pg 工具先搬迁数据表及数据到 PostgreSQL，然后再从 PostgreSQL 搬迁到 openGauss。

Ora2Pg 工具的安装可以参考附录一，搬迁前常见的操作命令可以参考附录二。

下面演示具体操作步骤：

**1.初始一个搬迁目录**

在 postgres 用户下操作

```
ora2pg --init_project project20210507  \
--project_base /home/postgres/data
```

该目录用于分类存放源端不同的对象类型，如 table、view、package、function 等，以及 Oracle 端原生的 SQL 脚本及 Ora2Pg 转换后的脚本等。

**2.定制 Ora2Pg 配置文件**

在 postgres 用户下操作 vi project20210507/config/ora2pg.conf

```
NO_HEADER
ORACLE_DSN  dbi:Oracle:host=x.x.x.x;port=1521;sid=xxx
ORACLE_USER xxx
ORACLE_PWD  xxx
PG_VERSION  12
PG_DSN  dbi:Pg:host=127.0.0.1;port=6000;dbname=xxx
PG_USER        xxx
PG_PWD         xxx
SCHEMA         xxx
ALLOW          T_.* UL_.*
EXCLUDE        TMP_.* .*_BACKUP
DATA_TYPE VARCHAR2:character varying
SKIP  fkeys,indexes
COMPILE_SCHEMA  0
DISABLE_COMMENT 1
DROP_FKEY 1
```

注意参数值大小写问题，上面配置 Oracle 及 PG 连接参数值可以为小写，SCHEMA 配置 Oracle 端的模式名称需要配置为大写。ALLOW 与 EXCLUDE 一般只使用一种，不要同时配置。上面 ALLOW 配置白名单，只搬迁以“T\_”开头和“UL\_”开头的表，EXCLUDE 配置黑名单，不搬迁以“TMP\_”开头及以“\_BACKUP”结尾的表。

**3.使用 Ora2Pg 导出 oracle 端指定列表的表结构文件**

如果我们要完整搬迁所有的对象，包括 table、view、package、function 等，可以使用脚本文件 export_schema.sh 进行导出，并对导出的脚本进行导入测试修正。

多数情况下我们先需要按对象类型逐一手工操作一遍，手工配置处理不兼容性，多次处理完成后最后使用脚本一次性把所有对象导出。

这里演示只导出部分表，我们使用 allow 参数直接指定，参数值之间使用逗号分割。在 postgres 用户下操作。

```
ora2pg --conf config/ora2pg.conf \
--basedir ./schema/tables \
--type TABLE \
--allow "T_TAB1,T_TAB2,UL_TAB1,UL_TAB2..." \
--plsql \
--out table.sql \
--jobs 10 --copies 10 --parallel 10
```

最后的三个并行参数代表 ora2pg 并行处理表的任务数，每个任务从 Oracle 端传输数据的并行数及每个任务 ora2pg 传输到 PostgreSQL 的并行数，可根据实际环境进行修改。

**4.使用 psql 工具导入表结构文件到 PG**

下面是导入到 PostgreSQL 的操作，在 postgres 用户下操作

```
/opt/pg12/bin/psql -Umogdb mogdb -f ./schema/tables/table.sql
```

上面的操作需要先提前创建用户及数据库，参见如下步骤

```
/opt/pg12/bin/psql
create user mogdb password 'xxx';
drop database if exists mogdb;
create database mogdb owner mogdb;
\c mogdb postgres
drop schema public;
\c mogdb mogdb
create schema mogdb authorization mogdb;
create schema pkg1 authorization mogdb;
create schema pkg2 authorization mogdb;
```

上面的模式 pkg1 和 pkg2 用于 package 包的存储。

**5.使用 gsql 工具导入表结构文件到 openGauss**

导入到 openGauss 的操作与上面导入到 PG 类似，openGauss 使用 gsql 工具进行导入。

```
su - omm
gsql -U mogdb -f ./schema/tables/table.sql
```

如果有分区表语法需要单独处理下，openGauss 与 PostgreSQL 分区表的语法差异可以参考：[openGauss 与 PostgreSQL 分区策略语法测试](https://www.modb.pro/db/49865)

**6.使用 ora2pg 传输 oracle 表数据到 PG**

先从 oracle 端查询下数据条数最大的十个表，在 postgres 用户下操作

```
ora2pg --conf config/ora2pg.conf \
--allow "T_TAB1,T_TAB2,UL_TAB1,UL_TAB2..." \
--type SHOW_TABLE
```

上一步输出结果如下：

```
[1] TABLE T_TAB1 (owner: XXX, 2869 rows)
[2] TABLE T_TAB2 (owner: XXX, 785412 rows)
[3] TABLE UL_TAB1 (owner: XXX, 4153778 rows)
[4] TABLE UL_TAB2 (owner: XXX, 140 rows)
...
[x] TABLE xx (owner: XXX, 125793 rows)
----------------------------------------------------------
Total number of rows: 1873163888

Top 10 of tables sorted by number of rows:
        [1] TABLE xx has 395364413 rows
        [2] TABLE xx has 379561355 rows
        [3] TABLE xx has 363704131 rows
        [4] TABLE xx has 237709148 rows
        [5] TABLE xx has 105294544 rows
        [6] TABLE xx has 99877964 rows
        [7] TABLE xx has 54815152 rows
        [8] TABLE xx has 49803085 rows
        [9] TABLE xx has 45016399 rows
        [10] TABLE xx has 25595242 rows
```

我们可以排除上面最大的 10 个表来提升整体的搬迁效率，大表可以单独配置任务来处理。提前使用–oracle_speed 和–ora2pg_speed 参数可以用来测试速度而并不实际搬迁数据，以便预估时间。

下面使用 COPY 方式搬迁数据，并修改了每次内存中缓存的数据条数为 10 万。

```
ora2pg --conf config/ora2pg.conf \
--type COPY \
--allow "T_TAB1,T_TAB2,UL_TAB1,UL_TAB2..." \
--limit 100000 \
--jobs 10 --copies 10 --parallel 10
```

**7.使用 pg_dumpall 导出文本 SQL 数据文件**

在 postgres 用户下操作

```
/opt/pg12/bin/pg_dumpall \
--username mogdb \
--data-only \
--exclude-database=template0,template1,postgres \
--file pg_mogdb.sql
```

**8.使用 gsql 导入数据文件到 openGauss**

导入前先删除下文件里的 set 语句，比如 row_security 等参数，这些参数再 openGauss 里不兼容。

```
su - omm
gsql -U mogdb -f pg_mogdb.sql
```

至此我们批量把 oracle 中部分表搬迁至 openGauss 数据，中间借助 PostgreSQL 数据库转储表数据。

如果要搬迁 package 包，可以按包名使用 ora2pg 进行批量转换，在 postgres 用户下操作。

```
ora2pg --conf config/ora2pg.conf \
--basedir ./schema/packages \
--type PACKAGE \
--allow "PKG_XX1,PKG_XX2,..." \
--plsql \
--out package.sql
```

使用 ora2pg 对 oracle 端的 package 包进行转换后，我们进行到转换后的包目录，然后可以直接在 openGauss 中进行修改调试。

```
cd schema/packages/pkg_xx1
cd schema/packages/pkg_xx2 ...
```

## 附录一 Ora2Pg 安装<a name="section43766875211"></a>

**安装 Perl**

```
# yum install -y perl perl-ExtUtils-CBuilder perl-ExtUtils-MakeMaker
```

**安装 DBI**

```
$ wget https://cpan.metacpan.org/authors/id/T/TI/TIMB/DBI-1.643.tar.gz
$ tar -zxvf DBI-1.643.tar.gz
$ cd DBI-1.643
$ perl Makefile.PL
$ make && make install
```

**安装 oracle 客户端**

```
# yum localinstall oracle-instantclient-basic-10.2.0.5-1.x86_64.rpm
# yum localinstall oracle-instantclient-devel-10.2.0.5-1.x86_64.rpm
```

**安装 DBD-Oracle**

注意配置 oracle 客户端动态库，例如：

```
export LD_LIBRARY_PATH=/usr/lib/oracle/10.2.0.5/client64/lib:/usr/local/lib
$ wget https://cpan.metacpan.org/authors/id/M/MJ/MJEVANS/DBD-Oracle-1.80.tar.gz
$ tar -zxvf DBD-Oracle-1.80.tar.gz
$ cd DBD-Oracle-1.80
$ perl Makefile.PL
$ make && make install
```

**安装 DBD-PG**

需要先安装并配置好 PostgreSQL 环境变量，如果本机没有安装 PostgreSQL，请参考[源码编译安装 PostgreSQL 12](https://www.modb.pro/db/13514)

确保环境变量配置正确，例如：

```
export PATH=$PATH:/opt/pgsql/bin
$ wget https://cpan.metacpan.org/authors/id/T/TU/TURNSTEP/DBD-Pg-3.14.2.tar.gz
$ tar -zxvf DBD-Pg-3.14.2.tar.gz
$ cd DBD-Pg-3.14.2
$ perl Makefile.PL
$ make && make install
```

**安装 Ora2Pg**

```
$ wget https://github.com/darold/ora2pg/archive/refs/tags/v21.1.tar.gz
$ tar zxvf v21.1.tar.gz
$ cd ora2pg-21.1
$ perl Makefile.PL
$ make  # sudo make install
```

**检查版本**

```
$ cd ~
$ ./perl5/bin/ora2pg --version
Ora2Pg v21.1
```

## 附录二 Ora2Pg 迁移前常见操作<a name="section1314418328521"></a>

**查看源端 Oracle 服务器版本**

```
ora2pg --conf config/ora2pg.conf \
--type SHOW_VERSION
```

**查看有哪些 schema 模式（需要 dba 权限）**

```
ora2pg --conf config/ora2pg.conf \
--type SHOW_SCHEMA
```

**查看表信息\(每个表的 owner 和行数以及表行 top10\)**

```
ora2pg --conf config/ora2pg.conf \
--type SHOW_TABLE
```

结果会输出表的数量及所有表的记录总数以及记录数最多的 top10。

**查看列映射信息**

```
ora2pg --conf config/ora2pg.conf \
--type SHOW_COLUMN  > check_colum.txt
```

观察日志是否有错误警告等信息，找出对应的错误进行配置处理，例如 Oracle 端有关键字命中，可以在 ora2pg.conf 文件进行转换处理，使用配置参数 REPLACE_COLS 。

```
REPLACE_COLS  SCOTT.T_DEPT(isnull:isnulls)
REPLACE_COLS  SCOTT.T_PERSON(using:usings)
```

上面 SCOTT 模式下 T_DEPT 表的 isnull 我们映射到 PostgreSQL 改为 isnulls。同理 T_PERSON 表的 using 字段我们改为 usings。

**生成迁移报告\(HTML\)**

```
ora2pg --conf config/ora2pg.conf \
--estimate_cost --dump_as_html \
--parallel 8 --jobs 2 \
--type SHOW_REPORT > html_report.html
```

**迁移后验证**

迁移测试，验证源端与目标端的表数据行数是否一致

```
ora2pg --conf config/ora2pg.conf \
--parallel 8 --jobs 2 \
--count_rows \
--type TEST > check_tables_count.txt
```
