+++

title = "mogdb里xlog相关的几个参数" 

date = "2022-06-27" 

tags = ["mogdb里xlog相关的几个参数"] 

archives = "2022-06" 

author = "云和恩墨" 

summary = "mogdb里xlog相关的几个参数"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# openGauss/MogDB 3.0闪回恢复测试

本文出处：[https://www.modb.pro/db/411368](https://www.modb.pro/db/411368)

### 介绍

闪回恢复功能是数据库恢复技术的一环，可以有选择性的撤销一个已提交事务的影响，将数据从人为不正确的操作中进行恢复。在采用闪回技术之前，只能通过备份恢复、PITR等手段找回已提交的数据库修改，恢复时长需要数分钟甚至数小时。采用闪回技术后，恢复已提交的数据库修改前的数据，只需要秒级，而且恢复时间和数据库大小无关。

### 闪回支持两种恢复模式：

1. 基于MVCC多版本的数据恢复（仅支持Ustore）：适用于误删除、误更新、误插入数据的查询和恢复，用户通过配置旧版本保留时间，并执行相应的查询或恢复命令，查询或恢复到指定的时间点或CSN点。
2. 基于数据库回收站的恢复（仅支持Ustore）：适用于误DROP、误TRUNCATE的表的恢复。用户通过配置回收站开关，并执行相应的恢复命令，可以将误DROP、误TRUNCATE的表找回。
   说明： 回收站暂不支持Astore引擎（闪回DROP/TRUNCATE）。

### 测试环境

```
操作系统：centos7.6 x86
数据库版本：openGauss 3.0
数据库环境：单机
```

（在这里数据库安装过程省略），根据上述提到的两种恢复模式下面分别进行测试。

### 闪回查询和表

闪回查询可以查询过去某个时间点表的某个snapshot数据，这一特性可用于查看和逻辑重建意外删除或更改的受损数据。闪回查询基于MVCC多版本机制，通过检索查询旧版本，获取指定老版本数据。

#### 前置条件

数据库配置文件postgresql.conf参数配置

```
enable_default_ustore_table=on  ###开启默认支持Ustore存储引擎
undo_zone_count=16384  ###内存中可分配的undo zone数量，0代表禁用undo和Ustore表，建议取值为max_connections*4
undo_retention_time=2000  ###用于设置undo旧版本的保留时间，默认为0，单位s。
```

#### 测试过程

```sql
---创建测试表并插入两条数据
openGauss=# create table u_tb (id int,c1 varchar(10));
CREATE TABLE

openGauss=# insert into  u_tb values (1,'Aso'),(2,'Hocx');
INSERT 0 2

openGauss=# select clock_timestamp();
        clock_timestamp        
-------------------------------
 2022-06-02 16:21:38.123874+08
(1 row)
---再插入新数据
openGauss=# insert into  u_tb values (3,'Ysad');
INSERT 0 1

openGauss=# select clock_timestamp();
        clock_timestamp        
-------------------------------
 2022-06-02 16:21:52.773089+08
(1 row)
---基于timestamp的闪回查询
openGauss=# SELECT * FROM u_tb TIMECAPSULE TIMESTAMP to_timestamp ('2022-06-02 16:21:38.123874', 'YYYY-MM-DD HH24:MI:SS.FF');
 id |  c1  
----+------
  1 | Aso
  2 | Hocx
(2 rows)

openGauss=# select clock_timestamp();
        clock_timestamp        
-------------------------------
 2022-06-02 16:22:36.596661+08
(1 row)
---修改一行数据
openGauss=# update u_tb set id = 4 where id =3;
UPDATE 1

openGauss=# select * from u_tb;
 id |  c1  
----+------
  1 | Aso
  2 | Hocx
  4 | Ysad
(3 rows)
---查询timestamp对应的CSN
openGauss=# select snptime,snpcsn from gs_txn_snapshot where snptime between '2022-06-02 16:21:52.773089' and '2022-06-02 16:22:36.596661';
            snptime            | snpcsn 
-------------------------------+--------
 2022-06-02 16:22:36.330093+08 |  45012
 2022-06-02 16:22:33.306022+08 |  45011
 2022-06-02 16:22:30.279709+08 |  45010
 2022-06-02 16:22:27.256441+08 |  45009
 2022-06-02 16:22:24.232027+08 |  45008
 2022-06-02 16:22:21.208859+08 |  45007
 2022-06-02 16:22:18.181382+08 |  45006
 2022-06-02 16:22:15.15771+08  |  45005
 2022-06-02 16:22:12.132989+08 |  45004
 2022-06-02 16:22:09.109973+08 |  45003
 2022-06-02 16:22:06.086961+08 |  45002
 2022-06-02 16:22:03.064702+08 |  45001
 2022-06-02 16:22:00.042871+08 |  45000
 2022-06-02 16:21:57.009696+08 |  44999
 2022-06-02 16:21:53.985716+08 |  44998
(15 rows)
---基于CSN的闪回查询
openGauss=# SELECT * FROM u_tb TIMECAPSULE CSN 45009;
 id |  c1  
----+------
  1 | Aso
  2 | Hocx
  3 | Ysad
(3 rows)
---基于CSN的闪回表
openGauss=# TIMECAPSULE TABLE u_tb TO CSN 45009;
TimeCapsule Table

openGauss=# select * from u_tb;
 id |  c1  
----+------
  1 | Aso
  2 | Hocx
  3 | Ysad
(3 rows)
---基于timestamp的闪回表
openGauss=# TIMECAPSULE TABLE u_tb TO TIMESTAMP to_timestamp ('2022-06-02 16:21:38', 'YYYY-MM-DD HH24:MI:SS.FF');
TimeCapsule Table

openGauss=# SELECT * FROM u_tb;
 id |  c1  
----+------
  1 | Aso
  2 | Hocx
(2 rows)
```

### 闪回drop/truncate

闪回DROP：可以恢复意外删除的表，从回收站（recycle bin）中恢复被删除的表及其附属结构如索引、表约束等。闪回drop是基于回收站机制，通过还原回收站中记录的表的物理文件，实现已drop表的恢复。

闪回TRUNCATE：可以恢复误操作或意外被进行truncate的表，从回收站中恢复被truncate的表及索引的物理数据。闪回truncate基于回收站机制，通过还原回收站中记录的表的物理文件，实现已truncate表的恢复。

#### 前置条件

```
enable_recyclebin=on  ###启用回收站。 recyclebin_retention_time=30min  ###参数用于设置回收站对象保留时间，超过该时间的回收站对象将被自动清理。 
```

#### 测试过程

```
---创建测试表
openGauss=# create table u_tb2 (id int,c1 varchar(10));
CREATE TABLE

openGauss=# insert into  u_tb2 values (1,'Aso'),(2,'Hocx');
INSERT 0 2

openGauss=# select * from u_tb2;
 id |  c1  
----+------
  1 | Aso
  2 | Hocx
(2 rows)
---truncate表
openGauss=# truncate u_tb2;
TRUNCATE TABLE

openGauss=# select * from u_tb2;
 id | c1 
----+----
(0 rows)
---闪回truncate操作
openGauss=# timecapsule table u_tb2 to before truncate;
TimeCapsule Table

openGauss=# select * from u_tb2;
 id |  c1  
----+------
  1 | Aso
  2 | Hocx
(2 rows)
---误drop表
openGauss=# drop table u_tb2;
DROP TABLE
---查看回收站
openGauss=# SELECT rcyname,rcyoriginname,rcytablespace FROM GS_RECYCLEBIN;
            rcyname            | rcyoriginname | rcytablespace 
-------------------------------+---------------+---------------
 BIN$3C774EBC071$23FB27078==$0 | u_tb2         |             0
(1 row)
---闪回drop表并且rename
openGauss=# timecapsule table u_tb2 to before drop rename to u_tb2_bak;
TimeCapsule Table

openGauss=# select * from u_tb2_bak;
 id |  c1  
----+------
  1 | Aso
  2 | Hocx
(2 rows)
---删除表时不放到回收站
openGauss=# drop table u_tb2_bak purge;
DROP TABLE
---检查回收站
openGauss=# SELECT rcyname,rcyoriginname,rcytablespace FROM GS_RECYCLEBIN;
 rcyname | rcyoriginname | rcytablespace 
---------+---------------+---------------
(0 rows)
```

总结3.0和2.1的区别

如果是2.1版本测试闪回查询和闪回表则需要配置参数version_retention_age（设置旧版本保留的事务数，超过该事务数的旧版本将被回收清理），不是配置undo_retention_time；在3.0版本中version_retention_age参数已被弃用，使用的参数就是undo_retention_time（undo旧版本保留时间）做闪回查询。回收站在2.1版本中对Astore表支持，在3.0中不再支持Astore表，而是ustore表才支持。
