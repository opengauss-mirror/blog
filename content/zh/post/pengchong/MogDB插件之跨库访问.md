+++

title = "MogDB插件之跨库访问" 

date = "2022-05-18" 

tags = ["MogDB插件之跨库访问"] 

archives = "2022-05" 

author = "彭冲" 

summary = "MogDB插件之跨库访问"

img = "/zh/post/pengchong/title/img9.png" 

times = "10:20"
+++

# MogDB插件之跨库访问

本文出处：[https://www.modb.pro/db/336337](https://www.modb.pro/db/336337)

MogDB数据库从2.1版本开始将插件和工具包进行了封装，我们可以随时方便的进行集成。从官网https://www.mogdb.io/downloads/mogdb/的这个页面可以进行下载：
![image.png](./images/20220301-fea20923-c6e0-4fa8-92c6-81979a109dcf.png)

本文将在Centos平台首先演示dblink插件的使用方法：

### dblink插件准备

将官网下载的plugins-CentOS-x86-2.1.0.tar.gz上传到服务器后，解压

```
$ tar zxvf plugins-CentOS-x86-2.1.0.tar.gz 
```

将插件相关文件安装到MogDB数据库：

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

### 创建dblink扩展

创建扩展的用户需要具有sysadmin权限，本文使用moguser用户

```
MogDB=# \du moguser
           List of roles
 Role name | Attributes | Member of 
-----------+------------+-----------
 moguser   | Sysadmin   | {}
```

下面使用moguser创建dblink扩展，并进行后续测试

```
$ gsql -U moguser postgres -r
gsql ((MogDB 2.1.0 build 56189e20) compiled at 2022-01-07 18:47:53 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

MogDB=> create extension dblink with schema public;
CREATE EXTENSION
```

查看dblink扩展

```
MogDB=> \dx dblink                               List of installed extensions  Name  | Version | Schema |                         Description                           --------+---------+--------+-------------------------------------------------------------- dblink | 1.0     | public | connect to other PostgreSQL databases from within a database (1 row) 
```

### dblink测试

##### 连接实例

```
MogDB=> \dx dblink
                               List of installed extensions
  Name  | Version | Schema |                         Description                          
--------+---------+--------+--------------------------------------------------------------
 dblink | 1.0     | public | connect to other PostgreSQL databases from within a database
(1 row)
```

上面使用远程用户dk连接到远程实例192.168.137.250的mydb。

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

insert、update、delete、truncate操作使用dblink_exec函数

insert测试

```
MogDB=> select  dblink_exec('mydblink', 'insert into t1 select generate_series(10,20), ''hello''');
 dblink_exec 
-------------
 INSERT 0 11
(1 row)

```

update测试

```
MogDB=> select  dblink_exec('mydblink', 'update t1 set info=''ten'' where id=10');
 dblink_exec 
-------------
 UPDATE 1
(1 row)

```

delete测试

```
MogDB=> select  dblink_exec('mydblink', 'delete from t1  where id=20');
 dblink_exec 
-------------
 DELETE 1
(1 row)

```

truncate测试

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
