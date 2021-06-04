+++

date = "2021-06-04" 

tags = ["openGauss核心技术"] 

archives = "2021-06" 

author = "贾军锋" 

summary = "初窥 openGauss 之索引推荐\(Index-advisor\)"

img = "/zh/post/jiajunfeng/title/img4.png" 

times = "12:30"

+++

# 初窥 openGauss 之索引推荐\(Index-advisor\)<a name="ZH-CN_TOPIC_0000001095702076"></a>

TPC-H 是一个面向分析型业务\(AP\)的基准测试，它由一系列热点查询组成，这些热点查询都是高度复杂的，因此执行时间往往都比较长。

在本次实验测试中，将手动向数据库加载TPC-H数据，并保存在名为 tpch 的数据库中。默认TPC-H数据库的表缺少索引，数据库的参数并没有做任何优化，因此执行效率会比较差。

本实验内容比较浅显，使用openGauss的索引推荐\(Index-advisor\)功能，对数据库进行性能优化，同时也让大家对Index-advisor功能有一个初步的了解。

## 环境信息<a name="section14753639202620"></a>

OS： CentOS Linux release 7.6.1810

openGauss：2.0.0

CPU：1core

Memory：4GB

测试数据脚本清单如下：

```
[omm@lab01 ~]$ ls -l ~/tpch-kit-back/
total 1076780
-rw------- 1 omm dbgrp  24196144 Apr 24 15:39 customer.tbl
-rw------- 1 omm dbgrp      3814 Apr 24 15:39 dss.ddl
-rw------- 1 omm dbgrp 753862072 Apr 24 15:39 lineitem.tbl
-rw------- 1 omm dbgrp       287 May 25 10:52 load.sh
-rw------- 1 omm dbgrp      2199 Apr 24 15:16 nation.tbl
-rw------- 1 omm dbgrp 170452161 Apr 24 15:16 orders.tbl
-rw------- 1 omm dbgrp  10553197 Apr 24 15:11 out0
-rw------- 1 omm dbgrp 118184616 Apr 24 15:10 partsupp.tbl
-rw------- 1 omm dbgrp  23935125 Apr 24 15:11 part.tbl
drwx------ 3 omm dbgrp      4096 Apr 24 15:39 queries
-rw------- 1 omm dbgrp       384 Apr 24 15:07 region.tbl
-rw------- 1 omm dbgrp   1399184 Apr 24 15:07 supplier.tbl
```

## 1. 创建数据库并导入数据<a name="section206021747172713"></a>

```
-- 创建数据库tpch
[omm@lab01 ~]$ gsql -d postgres -p 26000 -c "create database tpch with encoding='UTF-8';"
-- 创建测试表
[omm@lab01 ~]$ gsql -d tpch -p 26000 -f ~/tpch-kit-back/dss.ddl 
-- 加载测试数据并统计分析 
[omm@lab01 ~]$ vi load.sh
---------------------------------------
for i in `ls *.tbl`; do
  table=${i/.tbl/}
  echo "Loading $table..."
  sed 's/|$//' $i > /tmp/$i
  gsql -d tpch -p 26000 -c "TRUNCATE $table"
  gsql -d tpch -p 26000 -c "\\copy $table FROM '/home/omm/tpch-kit-back/$i' CSV DELIMITER '|'"
  gsql -d tpch -p 26000 -c "ANALYZE $table"
done
---------------------------------------
sh load.sh
```

## 2. 执行第一次查询测试\(耗时：106s\)<a name="section32631368297"></a>

```
[omm@lab01 ~]$ time gsql -d tpch -p 26000 -f /home/omm/tpch-kit-back/queries/queries.sql -o out0
total time: 105949  ms
real    1m46.063s
user    0m0.707s
sys     0m0.026s
```

## 3. 索引信息查询\(当前没有任何索引\)<a name="section16586219142911"></a>

```
[omm@lab01 ~]$ gsql -d tpch -p 26000 -r
tpch=# \d
                          List of relations
 Schema |   Name   | Type  | Owner |             Storage
--------+----------+-------+-------+----------------------------------
 public | customer | table | omm   | {orientation=row,compression=no}
 public | lineitem | table | omm   | {orientation=row,compression=no}
 public | nation   | table | omm   | {orientation=row,compression=no}
 public | orders   | table | omm   | {orientation=row,compression=no}
 public | part     | table | omm   | {orientation=row,compression=no}
 public | partsupp | table | omm   | {orientation=row,compression=no}
 public | region   | table | omm   | {orientation=row,compression=no}
 public | supplier | table | omm   | {orientation=row,compression=no}
(8 rows)
tpch=# \di
No relations found.
tpch=# select * from pg_indexes where schemaname='public';
 schemaname | tablename | indexname | tablespace | indexdef
------------+-----------+-----------+------------+----------
(0 rows)
```

## 4. 单条SQL查询索引推荐<a name="section17913393298"></a>

```
-- 未添加索引的查询效率(约4.9s)
[omm@lab01 ~]$ time gsql -d tpch -p 26000 -c "select * from lineitem where l_orderkey < 100 and l_suppkey > 50;"
real    0m4.916s
user    0m0.014s
sys     0m0.001s

-- 使用索引推荐函数(gs_index_advise)获取优化建议
tpch=# select *from gs_index_advise('select * from lineitem where l_orderkey < 100 and l_suppkey > 50;');
  table   |    column
----------+--------------
 lineitem | (l_orderkey)

-- 创建索引
tpch=# create index idx1 on lineitem(l_orderkey);

-- 查看优化结果(约2.3s)
[omm@lab01 ~]$ time gsql -d tpch -p 26000 -c "select * from lineitem where l_orderkey < 100 and l_suppkey > 50;"
real    0m2.337s
user    0m0.009s
sys     0m0.007s
```

## 5. Workload级别索引推荐\(针对一批SQL语句的索引推荐\)<a name="section11671853163019"></a>

```
-- 获取推荐索引
[omm@lab01 ~]$ cd /gauss/app/bin/dbmind/index_advisor/
[omm@lab01 index_advisor]$ python3 ./index_advisor_workload.py 26000 tpch ~/queries/queries.sql   -- 端口：26000  数据库：tpch
####################################### Generate candidate indexes #######################################
table:  lineitem columns:  l_returnflag,l_linestatus
table:  part columns:  p_partkey,p_size
table:  supplier columns:  s_suppkey,s_nationkey
table:  partsupp columns:  ps_partkey,ps_suppkey
table:  nation columns:  n_nationkey,n_regionkey
table:  orders columns:  o_orderkey,o_custkey
table:  customer columns:  c_custkey,c_nationkey
table:  orders columns:  o_custkey,o_orderkey
table:  lineitem columns:  l_orderkey,l_suppkey
table:  customer columns:  c_custkey
table:  part columns:  p_partkey,p_type
table:  supplier columns:  s_suppkey
table:  lineitem columns:  l_suppkey,l_partkey,l_orderkey
table:  part columns:  p_partkey
table:  lineitem columns:  l_orderkey,l_partkey,l_suppkey
table:  orders columns:  o_orderkey
table:  partsupp columns:  ps_suppkey
table:  lineitem columns:  l_shipdate,l_receiptdate,l_commitdate,l_orderkey
table:  lineitem columns:  l_partkey
######################################## Determine optimal indexes ########################################
create index ind0 on lineitem(l_shipdate,l_receiptdate,l_commitdate,l_orderkey);
create index ind1 on lineitem(l_returnflag,l_linestatus);
create index ind2 on lineitem(l_suppkey,l_partkey,l_orderkey);
create index ind3 on orders(o_orderkey,o_custkey);
create index ind4 on partsupp(ps_partkey,ps_suppkey);
create index ind5 on part(p_partkey,p_size);
create index ind6 on part(p_partkey,p_type);
create index ind7 on customer(c_custkey,c_nationkey);
create index ind8 on supplier(s_suppkey,s_nationkey);
create index ind9 on nation(n_nationkey,n_regionkey);

-- 创建推荐的索引
[omm@lab01 ~]$ gsql -d tpch -p 26000 -r
tpch=# create index ind0 on lineitem(l_shipdate,l_receiptdate,l_commitdate,l_orderkey);
tpch=# create index ind1 on lineitem(l_returnflag,l_linestatus);
tpch=# create index ind2 on lineitem(l_suppkey,l_partkey,l_orderkey);
tpch=# create index ind3 on orders(o_orderkey,o_custkey);
tpch=# create index ind4 on partsupp(ps_partkey,ps_suppkey);
tpch=# create index ind5 on part(p_partkey,p_size);
tpch=# create index ind6 on part(p_partkey,p_type);
tpch=# create index ind7 on customer(c_custkey,c_nationkey);
tpch=# create index ind8 on supplier(s_suppkey,s_nationkey);
tpch=# create index ind9 on nation(n_nationkey,n_regionkey);

-- 测试查询脚本时间(耗时：77s，SQL查询相比之前快了29s)
[omm@lab01 ~]$ time gsql -d tpch -p 26000 -f /home/omm/tpch-kit-back/queries/queries.sql -o out0
total time: 77200  ms
real    1m17.233s
user    0m0.665s
sys     0m0.020s
```

