---
title: 'MogDB插件之高速灌数'

date: '2022-05-12'

category: 'blog'
tags: ['MogDB插件之高速灌数']

archives: '2022-05'

author: '彭冲'

summary: 'MogDB插件之高速灌数'

img: '/zh/blogs/pengchong/title/img9.png'

times: '10:20'
---

# MogDB 插件之高速灌数

本文出处：[https://www.modb.pro/db/336694](https://www.modb.pro/db/336694)

对于写密集型系统，我们一般有如下方式来进行加速：

1. 使用批量插入代替单条 insert 语句插入
2. 更好的处理方式是使用 copy 语句代替 insert 语句
3. 同时也可以使用多个 session 并行代替单个 session 的语句操作

相比直接使用 copy，只要数据出现错误，它会中止所有的工作。假如我们最后一条记录有问题，我们前面大量的数据插入都会失效，这通常是我们不能接受的。

因而从外部数据源导入数据，应该考虑导入操作可以持续工作，然后把因为错误拒绝插入的数据另外保存起来。pgloader 工具其实可以做到这点，虽然它不如 copy 速度快，但对于外部数据格式并不那么严格时，这是较好的方式。

对于像外部灌数这样的特定场景，使用 pg_bulkload 工具有时甚至比 copy 还要快，这得意于它采取积极的高性能特性，能够跳过 shared buffer 以及绕过写 WAL 文件，另外它也可以处理坏的数据行。

本文将在 Centos 平台演示 pg_bulkload 插件的使用方法：

### pg_bulkload 插件准备

注意：插件包的下载请参考[MogDB 插件之跨库访问](https://www.modb.pro/db/336337)

将官网下载的 plugins-CentOS-x86-2.1.0.tar.gz 上传到服务器后，解压

```
$ tar zxvf plugins-CentOS-x86-2.1.0.tar.gz
```

将插件相关文件安装到 MogDB 数据库：

- 方式一：使用脚本进行安装

```
$ ./gs_install_plugin_local -X clusterconfig.xml --pg_bulkload
```

- 方式二：手工拷贝安装

```
$ cd plugins/pg_bulkload
$ cp pg_bulkload.so pg_timestamp.so /opt/mogdb210/lib/postgresql/
$ cp pg_bulkload.control pg_bulkload.sql pg_bulkload--1.0.sql pg_bulkload--unpackaged--1.0.sql uninstall_pg_bulkload.sql /opt/mogdb210/share/postgresql/extension/
$ /usr/bin/mkdir -p /opt/mogdb210/share/postgresql/contrib
$ cp uninstall_pg_timestamp.sql pg_timestamp.sql /opt/mogdb210/share/postgresql/contrib
$ cp pg_bulkload /opt/mogdb210/bin/
```

本文使用第二种方式。

### 创建 pg_bulkload 扩展

创建扩展的用户需要具有 sysadmin 权限，本文使用 moguser 用户

```
MogDB=# \du moguser
           List of roles
 Role name | Attributes | Member of
-----------+------------+-----------
 moguser   | Sysadmin   | {}

```

下面使用 moguser 创建 pg_bulkload 扩展，并进行后续测试

```
$ gsql -U moguser postgres -r
gsql ((MogDB 2.1.0 build 56189e20) compiled at 2022-01-07 18:47:53 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

MogDB=> create extension pg_bulkload with schema public;
CREATE EXTENSION

```

查看 pg_bulkload 扩展

```
MogDB=> \dx pg_bulkload
                                   List of installed extensions
    Name     | Version | Schema |                           Description
-------------+---------+--------+-----------------------------------------------------------------
 pg_bulkload | 1.0     | public | pg_bulkload is a high speed data loading utility for PostgreSQL
(1 row)

```

### pg_bulkload 测试

##### 直接使用参数测试

先创建表

```
create table test_bulkload(id int, name varchar(128));
```

再创建一个 txt 文件，写 10W 条数据

```
$ seq 100000| awk '{print $0"|bulkload"}' > bulkload_output.txt
```

使用下面的命令导入数据

```
$ pg_bulkload -i ./bulkload_output.txt -O test_bulkload -l test_bulkload.log -o "TYPE=csv" -o "DELIMITER=|"  -d postgres -U moguser
```

执行结果如下：

```
NOTICE: BULK LOAD START
NOTICE: BULK LOAD END
	0 Rows skipped.
	100000 Rows successfully loaded.
	0 Rows not loaded due to parse errors.
	0 Rows not loaded due to duplicate errors.
	0 Rows replaced with new rows.

```

连接数据库，查看数据是否导入成功：

```
MogDB=> select count(1) from test_bulkload ;
 count
--------
 100000
(1 row)

```

##### 使用控制文件测试

先创建表

```
CREATE TABLE foo (a bigint, b text);
```

创建模拟导入数据文件 foo.csv

```
$ more foo.csv
1,one
2
3,three,111
four,4
5,five

```

创建控制文件

```
$ more sample_csv.ctl
OUTPUT = moguser.foo
INPUT = /home/omm/foo.csv
LOGFILE=/home/omm/pg_bulkload.log
LIMIT = INFINITE
TYPE = CSV
DELIMITER = ","
QUOTE = "\""
ESCAPE = "\""
WRITER = DIRECT
MULTI_PROCESS = NO
PARSE_ERRORS = -1
PARSE-BADFILE=/home/omm/pg_bulkload_bad.log
DUPLICATE_ERRORS = 0
ON_DUPLICATE_KEEP = NEW
TRUNCATE = YES

```

控制文件 OUTPUT 描述数据导入的目标表，INPUT 描述输入的数据文件，LOGFILE 描述导入过程的日志，DELIMITER 描述数据分割符， PARSE_BADFILE 描述解析失败的记录文件，其他参数可以参考字面含义。

然后使用下面的命令

```
$ pg_bulkload sample_csv.ctl -d postgres -U moguser
```

执行结果如下

```
NOTICE: BULK LOAD START
NOTICE: BULK LOAD END
	0 Rows skipped.
	2 Rows successfully loaded.
	3 Rows not loaded due to parse errors.
	0 Rows not loaded due to duplicate errors.
	0 Rows replaced with new rows.
WARNING: some rows were not loaded due to errors.

```

上面命令执行完成之后，错误数据我们可以从 pg_bulkload_bad.log 文件进行查看

```
$ more pg_bulkload_bad.log
2
3,three,111
four,4
```

正常的数据记录可以从 foo 表中查看

```
MogDB=> select * from foo;
 a |  b
---+------
 1 | one
 5 | five
(2 rows)
```
