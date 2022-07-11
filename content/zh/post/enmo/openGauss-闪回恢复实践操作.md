+++

title = "openGauss-闪回恢复实践操作" 

date = "2022-07-11" 

tags = ["openGauss-闪回恢复实践操作"] 

archives = "2022-07" 

author = "云和恩墨" 

summary = "openGauss-闪回恢复实践操作"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# openGauss-闪回恢复实践操作

本文出处：[https://www.modb.pro/db/427969](https://www.modb.pro/db/427969)

### 一、适用场景

  1）误删除表的场景；
  2）需要将表中的数据恢复到指定时间点或者CSN。

### 二、简单描述

  闪回恢复可以有选择的撤销已提交事务对数据库的影响，恢复速度快，只需要秒级，而且恢复速度与数据库大小无关。

### 三、实践操作

#### 0.配置闪回相关参数

```
 ## 旧版本保留的事务数，超过该事务数的旧版本将被回收清理
gs_guc set -N all -I all -c "version_retention_age=10000"    
 ## 打开回收站
gs_guc set -N all -I all -c "enable_recyclebin=on"           
## 置回收站对象保留时间，超过该时间的回收站对象将被自动清理
gs_guc set -N all -I all -c "recyclebin_retention_time=15min" 
gs_guc set -N all -I all -c "vacuum_defer_cleanup_age=10000" 
#重新加载使配置生效 
gs_ctl reload -D /data/og1
```

#### 1.闪回查询

描述：可以查询过去某个时间点表的snapshot（快照）数据，基于MVCC多版本控制机制，通过检索查询旧版本，获取指定老版本的数据。

```sql
#记录当前时间
test=# select current_timestamp;
        pg_systimestamp        
-------------------------------
 2022-03-03 11:00:46.075387+08
(1 row)

#插入数据
test=# insert into test_1 values(3);
INSERT 0 1

#记录插入数据之后的时间
test=# select current_timestamp;
        pg_systimestamp        
-------------------------------
 2022-03-03 11:00:58.635591+08
(1 row)

#查询timestamp对应的CSN
test=# select snptime,snpcsn from gs_txn_snapshot where snptime between '2022-03-03 11:00:43.075387+08' and
test-# '2022-03-03 11:00:58.635591';
            snptime            | snpcsn 
-------------------------------+--------
 2022-03-03 11:00:58.513917+08 |   3134
 2022-03-03 11:00:55.492238+08 |   3131
 2022-03-03 11:00:52.471618+08 |   3129
 2022-03-03 11:00:49.446113+08 |   3127
 2022-03-03 11:00:46.424361+08 |   3125
 2022-03-03 11:00:43.402865+08 |   3123
(6 rows)

#执行闪回查询命令，查看闪回结果
#基于timestamp闪回查询，注意：基于时间点的闪回查询，这个时间点可以不是对应到csn点的时间，
#可以是recylcebin_retention_time内的任意时间
test=# select * from test_1 timecapsule timestamp to_timestamp('2022-03-03 11:00:43.513917','YYYY-MM-DD HH24:
MI:SS.FF');
 id 
----
  1
   
  2
(3 rows)
此时3还没有插入

#基于csn闪回查询
test=# select * from test_1 timecapsule csn 3123;
 id 
----
  1
   
  2
(3 rows)
```

#### 2.闪回drop

闪回drop：可以恢复意外删除的表

```sql
#模拟删除表
[omm@OG1 ~]$ gsql -d test -p 15400 -r
test=# drop table test_1;
DROP TABLE

#查看回收站中的内容
test=# select rcyname,rcyoriginname,rcytablespace from gs_recyclebin;
           rcyname            | rcyoriginname | rcytablespace 
------------------------------+---------------+---------------
 BIN$61124EB6173$52489D18==$0 | test_1        |             0
#gs_recyclebin这个表属于pg_catalog,有很多列，
#暂时先关注到rcyname:表示对象被删除时，系统生成的名称
#rcyoriginname:表示被删除对象原来的名称

#闪回恢复刚刚删除的表test_1,并为其起了名字叫test_1_bak
test=# timecapsule table test_1 to before drop rename to test_1_bak;
TimeCapsule Table
test=# select * from test_1_bak;
 id 
----
  1
   
  2
  3
(4 rows)
#再次查看一下回收站中的内容
test=# select rcyname,rcyoriginname,rcytablespace from gs_recyclebin;
 rcyname | rcyoriginname | rcytablespace 
---------+---------------+---------------
(0 rows)
#可以发现，回收站中对于test_1的记录已经删除

#如果在删除表的时候加入了purge，那么表会被直接删除掉，而不是放到回收站中
test=# drop table test_1_bak purge;
DROP TABLE
test=# select rcyname,rcyoriginname,rcytablespace from gs_recyclebin;
 rcyname | rcyoriginname | rcytablespace 
---------+---------------+---------------
(0 rows)
```

#### 3.闪回truncate

闪回truncate：可以恢复误操作或意外truncate的表

```sql
#truncate表test_2,这个表中创建有索引
test=# truncate table test_2;
TRUNCATE TABLE
test=# select * from test_2;
 id | name 
----+------
(0 rows)
#可以发现truncate之后表中的数据没有了

#查看回收站中的内容
test=# select rcyname,rcyoriginname,rcytablespace from gs_recyclebin;
           rcyname            | rcyoriginname | rcytablespace 
------------------------------+---------------+---------------
 BIN$61124EB6168$524F90A8==$0 | test_2        |             0
 BIN$61124EB616C$524F9A58==$0 | id_uniq       |             0
(2 rows)

#利用回收站恢复truncate掉的数据
test=# timecapsule table test_2 to before truncate;
TimeCapsule Table
test=# select * from test_2;
 id |  name  
----+--------
  1 | XXX
  2 | XXX
  3 | haha
  4 | Zhang
  5 | Hua
  6 | AAA
  7 | heihei
  8 | Get
(8 rows)

test=# select rcyname,rcyoriginname,rcytablespace from gs_recyclebin;
           rcyname            | rcyoriginname | rcytablespace 
------------------------------+---------------+---------------
 BIN$61124EB616C$52548180==$0 | id_uniq       |             0
 BIN$61124EB6168$52548748==$0 | test_2        |             0
(2 rows)

#从上可以发现，恢复truncate掉的数据之后，回收站中还有相应的记录

#清空回收站中指定的表或索引信息
test=# purge table test_2;
PURGE TABLE
test=# select rcyname,rcyoriginname,rcytablespace from gs_recyclebin;
 rcyname | rcyoriginname | rcytablespace 
---------+---------------+---------------
(0 rows)
##由于索引id_uniq附属在表test_2上，所以purge掉表的同时，也会将相关索引给purge掉
```
