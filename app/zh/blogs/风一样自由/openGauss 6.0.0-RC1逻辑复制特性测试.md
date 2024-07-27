---
title: 'openGauss 6.0.0-RC1逻辑复制特性测试'

date: '2024-05-24'

tags: ['openGauss技术文章征集', 'openGauss']

archives: '2024-05'
category: 'blog'
author: '风一样自由'

summary: 'openGauss 6.0.0-RC1逻辑复制特性测试'
---

# 一、环境部署

## 服务器信息

| | IP |主机名|版本|端口|
|---|---|---|---|---|
|发布端（源端）|192.168.59.149|6.0.0-RC1|15000|
|订阅端（目标端）|192.168.59.151|yf5|6.0.0-RC1|15000|
|

## 1.修改配置文件

```
发布端：

cat >> /opt/openGauss/install/data/dn1/postgresql.conf << "EOF"

wal_level=logical

max_replication_slots=8

EOF

wal_level：必须设置logical才支持逻辑复制

max_replication_slots>=每个节点所需的（物理流复制槽数+逻辑复制槽数）

cat >> /opt/openGauss/install/data/dn1/pg_hba.conf << "EOF"

host  replication  repl  0.0.0.0/0 sha256

EOF

订阅端：

cat >> /opt/openGauss/install/data/dn1/postgresql.conf << "EOF"

wal_level=logical

max_replication_slots=8

EOF

修改完发布端与订阅端参数文件，重启生效。

gs_om -t restart
```

## 2.发布端创建逻辑复制用户



```
gsql -d postgres -p 15000 -c "CREATE USER repl REPLICATION SYSADMIN LOGIN ENCRYPTED PASSWORD 'repl@123'"

[omm@yf4 opt]$ gsql -d postgres -p 15000 -c "CREATE USER repl REPLICATION SYSADMIN 
LOGIN ENCRYPTED PASSWORD 'repl@123'"
CREATE ROLE
```

注：用户需具有SYSADMIN、REPLICATION权限用户


## 3.发布端创建表

```
gsql -d postgres -p 15000 -c "CREATE TABLE logical_tb1(id int primary key,name varchar(10),create_time timestamp)"

[omm@yf4 opt]$ gsql -d postgres -p 15000 -c "CREATE TABLE logical_tb1(id int primary key,name
 varchar(10),create_time timestamp)"
NOTICE:  CREATE TABLE / PRIMARY KEY will create implicit index "logical_tb1_pkey" for table "logical_tb1"
CREATE TABLE
```

## 4.发布端创建发布

```
gsql -d postgres -p 15000 -c "CREATE PUBLICATION pub1 FOR ALL TABLES with(publish='insert,update,delete',ddl='table')"

[omm@yf4 opt]$ gsql -d postgres -p 15000 -c "CREATE PUBLICATION pub1 FOR ALL TABLES 
with(publish='insert,update,delete',ddl='table')"
CREATE PUBLICATION
```


查询发布信息

```
gsql -d postgres -p 15000 -c "select * from pg_publication"

[omm@yf4 opt]$ gsql -d postgres -p 15000 -c "select * from pg_publication"pubname | pubowner | puballtables | pubinsert | pubupdate | pubdelete | pubddl

---------+----------+--------------+-----------+-----------+-----------+-------

pub1    |       10 | t            | t         | t         | t         |      1

(1 row)
```

## 5.订阅端创建表

```
gsql -d postgres -p 15000 -c "CREATE TABLE logical_tb1(id int primary key,name varchar(10),create_time timestamp)"

[omm@yf5 ~]$ gsql -d postgres -p 15000 -c "CREATE TABLE logical_tb1(id int primary key,name
 varchar(10),create_time timestamp)"NOTICE:  CREATE TABLE / PRIMARY KEY will create implicit index "logical_tb1_pkey" for table "logical_tb1"
CREATE TABLE
```


## 6.订阅端创建加密文件

```
gs_ssh -c "gs_guc generate -S repl@123 -D $GAUSSHOME/bin -o subscription"

[omm@yf5 ~]$ gs_ssh -c "gs_guc generate -S repl@123 -D $GAUSSHOME/bin -o subscription"Successfully execute command on all nodes.

Output:[SUCCESS] yf5:
The gs_guc run with the following arguments: [gs_guc -S *** -D /opt/openGauss/install/app/bin -o subscription generate ].
gs_guc generate -S ***
```

## 7.订阅端创建订阅

```
gsql -d postgres -p 15000 -c "CREATE SUBSCRIPTION sub1 CONNECTION

 'host=192.168.59.149 port=15001 dbname=postgres user=repl password=repl@123' PUBLICATION pub1"

[omm@yf5 ~]$ gsql -d postgres -p 15000 -c "CREATE SUBSCRIPTION sub1 CONNECTION 'host=192.168.59.149 port=15001 dbname=postgres user=repl password=repl@123' PUBLICATION pub1"NOTICE:  created replication slot "sub1" on publisher
CREATE SUBSCRIPTION
```

注：端口号不能使用主端口，应该使用主端口+1端口，否则会与线程池冲突。

## 8.查看发布订阅信息

```
发布端：

查看发布信息

select * from pg_publication; 

openGauss=# select * from pg_publication; pubname | pubowner | puballtables | pubinsert | pubupdate | pubdelete | pubdd
---------+----------+--------------+-----------+-----------+-----------+------
pub1    |       10 | t            | t         | t         | t         |      1
(1 row)
```

发布端查看复制槽

```
SELECT slot_name,plugin,slot_type,database,active,restart_lsn FROM pg_replication_slots where slot_name='sub1';

openGauss=# SELECT slot_name,plugin,slot_type,database,active,restart_lsn FROM pg_replication_slots where slot_name='sub1';
 slot_name |  plugin  | slot_type | database | active | restart_lsn
-----------+----------+-----------+----------+--------+-------------
 sub1      | pgoutput | logical   | postgres | t      | 0/2493A48
(1 row)
```


订阅端：

查看订阅信息

```
select * from pg_subscription;

openGauss=# select * from pg_subscription;

 

subdbid | subname | subowner | subenabled |                                                                  
subconninfo                                              | subslotname | subsynccommit | subpublications | subbinary | subskiplsn | submatchddlowner

---------+---------+----------+------------+-----------------------------------------------------------------------------------------------------------------------------------------------+-------------+---------------+----------
-------+-----------+------------+------------------
15737 | sub1    |   10 | t     
| host=192.168.59.149 port=15001 dbname=postgres user=repl password=encryptOpty+wL5qbR/g1duD+0mVBEBTPUHu/DqESpg30CN6Bbh8go4hKEMAlGiKf8KtM6klUb
| sub1        | off           | {pub1}       | f         | 0/0        | t

(1 row)
```


# 二、逻辑复制测试

数据同步测试


## 1.发布端插入数据


```
insert into logical_tb1 values(1,'yyf','2024-05-24'),(2,'jjj','2024-05-24');
```


## 2.查看数据同步情况

```
发布端：

select * from logical_tb1;

openGauss=# select * from logical_tb1 ;
 id | name |     create_time
----+------+---------------------
  1 | yyf  | 2024-05-24 00:00:00
  2 | jjj  | 2024-05-24 00:00:00
(2 rows)
订阅端

select * from logical_tb1;

openGauss=# select * from logical_tb1;
 id | name |     create_time
----+------+---------------------
  1 | yyf  | 2024-05-24 00:00:00
  2 | jjj  | 2024-05-24 00:00:00
(2 rows)
DDL同步测试（6.0版本新增功能）
```


## 1.查看发布端与订阅端表

```
发布端：

\d+

openGauss=# \d+
               List of relations
 Schema |    Name     | Type  | Owner |    Size    |             Storage              | Description
--------+-------------+-------+-------+------------+----------------------------------+-------------
public | logical_tb1 | table | omm   | 8192 bytes | {orientation=row,compression=no} |
(1 row)
订阅端：

\d+

openGauss=# \d+
               List of relations
 Schema |    Name     | Type  | Owner |    Size    |             Storage              | Description
--------+-------------+-------+-------+------------+----------------------------------+------------
- public | logical_tb1 | table | omm   | 8192 bytes | {orientation=row,compression=no} |
(1 row)
```


## 2.发布端删除表

```
drop table logical_tb1;

\d+

openGauss=# drop table logical_tb1;
DROP TABLE
openGauss=# \d+
No relations found.
3.查看订阅端表

\d+

openGauss=# \d+
No relations found.
```

# 三、逻辑复制发布及订阅其它相关操作

```
发布端：

--创建一个发布，发布两个表中所有更改。

CREATE PUBLICATION mypublication FOR TABLE users, departments;

--创建一个发布，发布所有表中的所有更改。

CREATE PUBLICATION alltables FOR ALL TABLES;

--创建一个发布，只发布一个表中的INSERT操作。

CREATE PUBLICATION insert_only FOR TABLE mydata WITH (publish = 'insert');

--修改发布的动作。

ALTER PUBLICATION insert_only SET (publish='insert,update,delete');

--向发布中添加表。

ALTER PUBLICATION insert_only ADD TABLE mydata2;

--删除发布。

DROP PUBLICATION insert_only;

--创建一个发布，发布所有的DDL操作

CREATE PUBLICATION ddl_all FOR ALL TABLES WITH (ddl='all');

--创建一个发布，发布类型为TABLE的DDL操作

CREATE PUBLICATION ddl_all FOR ALL TABLES WITH (ddl='table');

订阅端：

--创建一个到远程服务器的订阅，复制发布mypublication和insert_only中的表，并在提交时立即开始复制。

CREATE SUBSCRIPTION mysub CONNECTION 'host=192.168.1.50 port=15000 user=foo dbname=foodb password=xxxx' PUBLICATION mypublication, insert_only;

--创建一个到远程服务器的订阅，复制insert_only发布中的表， 并且不开始复制直到稍后启用复制。

CREATE SUBSCRIPTION mysub CONNECTION 'host=192.168.1.50 port=15000 user=foo dbname=foodb password=xxxx ' PUBLICATION insert_only WITH (enabled = false);

--修改订阅的连接信息。

ALTER SUBSCRIPTION mysub CONNECTION 'host=192.168.1.51 port=15000 user=foo dbname=foodb password=xxxx';

--激活订阅。

ALTER SUBSCRIPTION mysub SET(enabled=true);

--删除订阅。

DROP SUBSCRIPTION mysub;
```

# 四、限制

发布订阅基于逻辑复制实现，继承所有逻辑复制的限制，同时发布订阅还有下列额外的限制或者缺失的功能。

1.数据库模式和DDL命令不会被复制。初始模式可以手工使用gs_dump --schema-only进行拷贝。后续的模式改变需要手工保持同步。

2.序列数据不被复制。后台由序列支撑的serial或者标识列中的数据当然将被作为表的一部分复制，但是序列本身在订阅者上仍将显示开始值。如果订阅者被用作一个只读数据库，那么这通常不会是什么问题。不过，如果订阅者数据库预期有某种转换或者容错，那么序列需要被更新到最后的值，要么通过从发布者拷贝当前数据的防范（也许使用gs_dump），要么从表本身决定一个足够高的值。

3.只有表支持复制，包括分区表。试图复制其他类型的关系，例如视图、物化视图或外部表，将会导致错误。

4.同一数据库内的多个订阅不应当订阅内容重复的发布（指发布相同的表），否则会产生数据重复或者主键冲突。

5.如果被发布的表中包含不支持btree/hash索引的数据类型（如地理类型等），那么该表需要有主键，才能成功的复制UPDATE/DELETE操作到订阅端。否则复制会失败，同时订阅端会出现“FATAL: could not identify an equality operator for type xx”的日志。

6.当前gs_probackup工具已支持备份发布订阅的逻辑复制槽，因此可使用gs_probackup或gs_basebackup工具备份发布端。注意当恢复到非最新时间点时，由于订阅端复制源记录的remote_lsn可能大于发布端当前的wal日志插入位置，因此在这之间提交的事务无法被解码复制，在remote_lsn之后提交的事务才被解码。

7.产生列不会被复制，即如果发布端和订阅端的产生列计算定义不同，那么该列的值也会不一致


# 五、总结


 通过以上测试，opengauss 6.0版本较5.0版本逻辑复制新增DDL同步功能，仅支持部分DDL同步，如CREATE/DROP TABLE|TABLE PARTITION、CREATE/DROP INDEX，不支持ALTER TABLE操作，如遇到此需求，需手动操作，且逻辑复制本身限制比较多，带来使用不便。opengauss在逻辑复制功能方面不断冲破限制，提高功能的完整性，希望opengauss再接再厉，再创辉煌。


   



 





