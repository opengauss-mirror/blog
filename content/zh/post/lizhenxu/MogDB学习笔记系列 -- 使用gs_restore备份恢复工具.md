+++

title = "MogDB学习笔记系列 -- 使用gs_restore备份恢复工具" 

date = "2022-04-18" 

tags = ["MogDB学习笔记系列 -- 使用gs_restore备份恢复工具"] 

archives = "2022-04" 

author = "李真旭" 

summary = "MogDB学习笔记系列 -- 使用gs_restore备份恢复工具"

img = "/zh/post/lizhenxu/title/img6.png" 

times = "10:20"
+++

# MogDB学习笔记系列 -- 使用gs_restore备份恢复工具

本文出处：https://www.modb.pro/db/183831

前面学习了MogDB的备份工具gs_dump，主要用于逻辑备份，其中还有对应的逻辑恢复工具gs_restore。这里来跟大家一起学习。

```sql
[omm@mogdb bin]$ ./gs_restore --help
gs_restore restores a MogDB database from an archive created by gs_dump.

Usage:
  gs_restore [OPTION]... FILE

General options:
  -d, --dbname=NAME                       connect to database name
  -f, --file=FILENAME                     output file name
  -F, --format=c|d|t                      backup file format (should be automatic)
  -l, --list                              print summarized TOC of the archive
  -v, --verbose                           verbose mode
  -V, --version                           output version information, then exit
  -?, --help                              show this help, then exit

Options controlling the restore:
  -a, --data-only                       restore only the data, no schema
  -c, --clean                           clean (drop) database objects before recreating
  -C, --create                          create the target database
  -e, --exit-on-error                   exit on error, default is to continue
  -I, --index=NAME                      restore named index(s)
  -j, --jobs=NUM                        use this many parallel jobs to restore
  -L, --use-list=FILENAME               use table of contents from this file for
                                        selecting/ordering output
  -n, --schema=NAME                     restore only objects in this schema(s)
  -O, --no-owner                        skip restoration of 
  object ownership
  -P, --function=NAME(args)             restore named function(s)
  -s, --schema-only                     restore only the schema, no data
  -S, --sysadmin=NAME                   system admin user name to use for disabling triggers
  -t, --table=NAME                      restore named table(s)
  -T, --trigger=NAME                    restore named trigger(s)
  -x, --no-privileges/--no-acl          skip restoration of access privileges (grant/revoke)
  -1, --single-transaction              restore as a single transaction
  --disable-triggers                    disable triggers during data-only restore
  --no-data-for-failed-tables           do not restore data of tables that could not be
                                        created
  --no-security-labels                  do not restore security labels
  --no-tablespaces                      do not restore tablespace assignments
  --section=SECTION                     restore named section (pre-data, data, or post-data)
  --use-set-session-authorization       use SET SESSION AUTHORIZATION commands instead of
                                        ALTER OWNER commands to set ownership

Connection options:
  -h, --host=HOSTNAME                   database server host or socket directory
  -p, --port=PORT                       database server port number
  -U, --username=NAME                   connect as specified database user
  -w, --no-password                     never prompt for password
  -W, --password=PASSWORD               the password of specified database user
  --role=ROLENAME                       do SET ROLE before restore
  --rolepassword=ROLEPASSWORD           the password for role
[omm@mogdb bin]$   

```

从上面的介绍信息来看，gs_restore 也支持多种粒度的还原操作。这里来进行相关测试。

#### 准备测试表

```sql
[omm@mogdb ~]$ gsql -d enmotech -p26000
gsql ((MogDB 2.0.0 build b75b585a) compiled at 2021-05-28 17:20:47 commit 0 last mr  )
NOTICE : The password has been expired, please change the password. 
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

enmotech=# select count(1) from db2mogdb;
 count 
-------
     4
(1 row)

enmotech=# 

```

#### 备份整个database

```sql
[omm@mogdb ~]$ gs_dump -p 26000 -U test -W test@1234 enmotech -f enmotech_20211201.tar -F t
gs_dump[port='26000'][enmotech][2021-12-01 16:24:15]: The total objects number is 388.
gs_dump[port='26000'][enmotech][2021-12-01 16:24:15]: [100.00%] 388 objects have been dumped.
gs_dump[port='26000'][enmotech][2021-12-01 16:24:15]: dump database enmotech successfully
gs_dump[port='26000'][enmotech][2021-12-01 16:24:15]: total time: 384  ms
[omm@mogdb ~]$
```

#### 模拟误删除表

```sql
[omm@mogdb ~]$ gsql -d enmotech -p26000
gsql ((MogDB 2.0.0 build b75b585a) compiled at 2021-05-28 17:20:47 commit 0 last mr  )
NOTICE : The password has been expired, please change the password. 
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

enmotech=# drop table db2mogdb;
DROP TABLE
enmotech=# \q
```

#### 通过gs_restore进行还原操作

```sql
[omm@mogdb ~]$ gs_restore enmotech_20211201.tar  -d enmotech -p26000 -Utest -W test@1234 
start restore operation ...
table db2mogdb complete data imported !
Finish reading 8 SQL statements!
end restore operation ...
restore operation successful
total time: 13  ms
[omm@mogdb ~]$ 
[omm@mogdb ~]$ 
```

#### 检查数据恢复是否成功

```sql
[omm@mogdb ~]$  gsql -d enmotech -p26000 -Utest -W test@1234
gsql ((MogDB 2.0.0 build b75b585a) compiled at 2021-05-28 17:20:47 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

enmotech=> \dt            
                          List of relations
 Schema |   Name   | Type  | Owner |             Storage              
--------+----------+-------+-------+----------------------------------
 public | db2mogdb | table | test  | {orientation=row,compression=no}
(1 row)

enmotech=> select count(1) from db2mogdb;
 count 
-------
     4
(1 row)

enmotech=> 
```

可以看到通过gs_restore成功恢复了我们前面模拟drop table的表。

那么对对于truncate table操作呢？已经存在的对象，数据被清空，恢复理论上一样，如下：

```sql
[omm@mogdb ~]$ gsql -d enmotech -p26000
gsql ((MogDB 2.0.0 build b75b585a) compiled at 2021-05-28 17:20:47 commit 0 last mr  )
NOTICE : The password has been expired, please change the password. 
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

enmotech=# truncate table db2mogdb;
TRUNCATE TABLE
enmotech=# \q
[omm@mogdb ~]$ gs_restore enmotech_20211201.tar  -d enmotech -p26000 -Utest -W test@1234
start restore operation ...
Error while PROCESSING TOC:
Error from TOC entry 468; 1259 16522 TABLE db2mogdb test
could not execute query: ERROR:  relation "db2mogdb" already exists
    Command was: CREATE TABLE db2mogdb (
    age integer
)
WITH (orientation=row, compression=no);



table db2mogdb complete data imported !
Finish reading 8 SQL statements!
end restore operation ...
WARNING: errors ignored on restore: 1
restore operation successful
total time: 17  ms
[omm@mogdb ~]$ 
[omm@mogdb ~]$ gsql -d enmotech -p26000
gsql ((MogDB 2.0.0 build b75b585a) compiled at 2021-05-28 17:20:47 commit 0 last mr  )
NOTICE : The password has been expired, please change the password. 
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

enmotech=# select count(1) from db2mogdb;
 count 
-------
     4
(1 row)

enmotech=# 
```

除了对于database级别备份恢复之外，gs_restore也支持schema级别、表级别的还原操作，如下再次进行一些测试：

#### 创建测试schema

```sql
enmotech=# create schema roger;
CREATE SCHEMA
enmotech=# 
enmotech=# create table roger.test1201 as select * from db2mogdb;
INSERT 0 4
enmotech=# insert into roger.test1201 select * from roger.test1201;
INSERT 0 4
......
enmotech=# insert into roger.test1201 select * from roger.test1201;
INSERT 0 32768
enmotech=# insert into roger.test1201 select * from roger.test1201;
INSERT 0 65536
enmotech=# insert into roger.test1201 select * from roger.test1201;
INSERT 0 131072
enmotech=# select count(1) from roger.test1201;
 count  
--------
 262144
(1 row)
```

#### 备份整个测试库enmotech

```sql

[omm@mogdb ~]$ gs_dump -p 26000 -U test -W test@1234 enmotech -f enmotech_all.tar -F t        
gs_dump[port='26000'][enmotech][2021-12-01 16:39:56]: The total objects number is 391.
gs_dump[port='26000'][enmotech][2021-12-01 16:39:56]: [100.00%] 391 objects have been dumped.
gs_dump[port='26000'][enmotech][2021-12-01 16:39:56]: dump database enmotech successfully
gs_dump[port='26000'][enmotech][2021-12-01 16:39:56]: total time: 430  ms
[omm@mogdb ~]$
```

#### 删除schema

```
enmotech=# drop schema roger CASCADE; NOTICE:  drop cascades to table roger.test1201 DROP SCHEMA enmotech=# \q 
```

#### 从整个database 备份中恢复单个schema

```sql

[omm@mogdb ~]$ gs_restore enmotech_all.tar -d enmotech -n roger -p26000 -Utest -W test@1234  
start restore operation ...
table test1201 complete data imported !
Finish reading 11 SQL statements!
end restore operation ...
restore operation successful
total time: 120  ms
[omm@mogdb ~]$ 


[omm@mogdb ~]$ gsql -d enmotech -p26000
gsql ((MogDB 2.0.0 build b75b585a) compiled at 2021-05-28 17:20:47 commit 0 last mr  )
NOTICE : The password has been expired, please change the password. 
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

enmotech=# \dn                        
   List of schemas
    Name     | Owner 
-------------+-------
 cstore      | omm
 dbe_perf    | omm
 pkg_service | omm
 public      | omm
 roger       | omm
 snapshot    | omm
(6 rows)

enmotech=# select count(1) from roger.test1201;
 count  
--------
 262144
(1 row)

enmotech=# 
```

#### 从整个database 备份中恢复单个表

```
[omm@mogdb ~]$ gs_restore enmotech_all.tar -d enmotech -n roger -t test1201 -p26000 -Utest -W test@1234 
start restore operation ...
table test1201 complete data imported !
Finish reading 11 SQL statements!
end restore operation ...
restore operation successful
total time: 166  ms
[omm@mogdb ~]$ 

```

最后简单总结一下gs_restore 恢复工具的主要功能点：

1、支持多种粒度的还原操作（database、schema、table等级别）
2、由于是逻辑备份，因此可以从全备中还原单个schema和单个表，操作灵活
3、支持并行操作
4、支持触发器等多种数据库对象；如果在还原数据时因为有trigger导致性能较低，可以关闭触发器，支持–disable-triggers参数。
