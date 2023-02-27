---
title: 'MogDB插件之跨库访问'

date: '2022-05-18'

category: 'blog'
tags: ['MogDB插件之跨库访问']

archives: '2022-05'

author: '彭冲'

summary: 'MogDB插件之跨库访问'

img: '/zh/blogs/pengchong/title/img9.png'

times: '10:20'
---

# MogDB 插件之跨库访问

本文出处：[https://www.modb.pro/db/336337](https://www.modb.pro/db/336337)

MogDB 数据库从 2.1 版本开始将插件和工具包进行了封装，我们可以随时方便的进行集成。从官网https://www.mogdb.io/downloads/mogdb/的这个页面可以进行下载：
<img src='./images/20220301-fea20923-c6e0-4fa8-92c6-81979a109dcf.png'>

本文将在 Centos 平台首先演示 dblink 插件的使用方法：

### dblink 插件准备

将官网下载的 plugins-CentOS-x86-2.1.0.tar.gz 上传到服务器后，解压

```
$ tar zxvf plugins-CentOS-x86-2.1.0.tar.gz
```

将插件相关文件安装到 MogDB 数据库：

- 方式一：使用脚本进行安装

```
$ ./gs_install_plugin_local -X clusterconfig.xml --dblink
```

- 方式二：手工拷贝安装

```
$ cd plugins/dblink
$ cp dblink.so /opt/mogdb210/lib/postgresql/
$ cp dblink--1.0.sql dblink.control dblink--unpackaged--1.0.sql \
/opt/mogdb210/share/postgresql/extension/
```

本文使用第二种方式。

### 创建 dblink 扩展

创建扩展的用户需要具有 sysadmin 权限，本文使用 moguser 用户

```
MogDB=# \du moguser
           List of roles
 Role name | Attributes | Member of
-----------+------------+-----------
 moguser   | Sysadmin   | {}
```

下面使用 moguser 创建 dblink 扩展，并进行后续测试

```
$ gsql -U moguser postgres -r
gsql ((MogDB 2.1.0 build 56189e20) compiled at 2022-01-07 18:47:53 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

MogDB=> create extension dblink with schema public;
CREATE EXTENSION
```

查看 dblink 扩展

```
MogDB=> \dx dblink                               List of installed extensions  Name  | Version | Schema |                         Description                           --------+---------+--------+-------------------------------------------------------------- dblink | 1.0     | public | connect to other PostgreSQL databases from within a database (1 row)
```

### dblink 测试

##### 连接实例

```
MogDB=> \dx dblink
                               List of installed extensions
  Name  | Version | Schema |                         Description
--------+---------+--------+--------------------------------------------------------------
 dblink | 1.0     | public | connect to other PostgreSQL databases from within a database
(1 row)
```

上面使用远程用户 dk 连接到远程实例 192.168.137.250 的 mydb。

##### 执行查询

```
MogDB=> select * from dblink('mydblink','select * from dk.t1;') as t(id int , info text);
 id | info
----+------
  1 | one
  2 | two
(2 rows)

```

##### 执行修改

insert、update、delete、truncate 操作使用 dblink_exec 函数

insert 测试

```
MogDB=> select  dblink_exec('mydblink', 'insert into t1 select generate_series(10,20), ''hello''');
 dblink_exec
-------------
 INSERT 0 11
(1 row)

```

update 测试

```
MogDB=> select  dblink_exec('mydblink', 'update t1 set info=''ten'' where id=10');
 dblink_exec
-------------
 UPDATE 1
(1 row)

```

delete 测试

```
MogDB=> select  dblink_exec('mydblink', 'delete from t1  where id=20');
 dblink_exec
-------------
 DELETE 1
(1 row)

```

truncate 测试

```
MogDB=> select  dblink_exec('mydblink', 'truncate t1');
  dblink_exec
----------------
 TRUNCATE TABLE
(1 row)

```

##### 断开实例

```
MogDB=> select dblink_disconnect('mydblink');
 dblink_disconnect
-------------------
 OK
(1 row)
```
