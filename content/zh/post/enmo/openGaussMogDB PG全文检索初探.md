+++

title = "PG/openGauss/MogDB全文检索初探" 

date = "2022-05-24" 

tags = ["PG/openGauss/MogDB全文检索初探"] 

archives = "2022-05" 

author = "云和恩墨交付" 

summary = "PG/openGauss/MogDB全文检索初探"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# PG/openGauss/MogDB全文检索初探

本文出处：[https://www.modb.pro/db/336102](https://www.modb.pro/db/336102)

背景：大规模的全文检索通常使用专用的引擎，如ES，或基于SQL的Sphix，PG支持全文检索，对于规模不是很大的全文检查通常能满足

- #### tsvector类型

```
postgres@findb:select 'Hello,veelx,how are you? I am missing you!'::tsvector;
                         tsvector                         
----------------------------------------------------------
 'Hello,veelx,how' 'I' 'am' 'are' 'missing' 'you!' 'you?'
(1 row)

postgres@findb:select to_tsvector('english','Hello,veelx,how are you? I am missing you!');
         to_tsvector          
------------------------------
 'hello':1 'veelx':2 'miss':8
```

可以用::tsvector来转换字符串为tsvector类型，to_tsvector来做规范化处理去掉“non-normalized”的部分

- #### tsquery查询

```
postgres@findb:select 'hello&veelx'::tsquery;
      tsquery      
-------------------
 'hello' & 'veelx'
(1 row)
postgres@findb:select to_tsquery('hello&veelx');
    to_tsquery     
-------------------
 'hello' & 'veelx'
(1 row)
postgres@findb:select to_tsquery('hello|leadx');
    to_tsquery     
-------------------
 'hello' | 'veelx'
(1 row)
postgres@findb:select to_tsvector('english','how are you?,Hello,veelx,how are you? I am missing you!')@@to_tsquery('hello&you');
 ?column? 
----------
 t
(1 row)

postgres@findb:select to_tsvector('english','how are you?,Hello,veelx,how are you? I am missing you!')@@to_tsquery('hello&cat');
 ?column? 
----------
 f
(1 row)
postgres@findb:select to_tsvector('english','how are you?,Hello,veelx,how are you? I am missing you!')@@to_tsquery('hello|cat');
 ?column? 
----------
 t
(1 row)
```

tsquery为全文检索搜索条件，&表示and，|表示or

- #### 实战例子1

```
postgres@findb:create table test_search(id int4,name text);
CREATE TABLE
postgres@findb:insert into test_search(id,name) select n,n||'_veelx' from generate_series(1,2000000) n;
INSERT 0 2000000
postgres@findb:\timing on
Timing is on.
postgres@findb:explain analyze select * from test_search where name like '1_veelx';
                                                         QUERY PLAN                                                          
-----------------------------------------------------------------------------------------------------------------------------
 Gather  (cost=1000.00..28368.88 rows=200 width=17) (actual time=0.225..91.600 rows=1 loops=1)
   Workers Planned: 1
   Workers Launched: 1
   ->  Parallel Seq Scan on test_search  (cost=0.00..27348.88 rows=118 width=17) (actual time=43.506..88.621 rows=0 loops=2)
         Filter: (name ~~ '1_leadx'::text)
         Rows Removed by Filter: 1000000
 Planning Time: 0.114 ms
 Execution Time: 91.619 ms
(8 rows)

Time: 92.388 ms

postgres@findb:create index idx_test_search on test_search using gin (to_tsvector('english',name));
CREATE INDEX
Time: 11564.912 ms (00:11.565)

postgres@findb:\di+
                                     List of relations
 Schema |         Name          | Type  |  Owner   |     Table      |  Size  | Description 
--------+-----------------------+-------+----------+----------------+--------+-------------
 public | idx_test_search       | index | postgres | test_search    | 104 MB | 

postgres@findb:\dt+
                           List of relations
 Schema |      Name      | Type  |  Owner   |    Size    | Description 
--------+----------------+-------+----------+------------+-------------
 public | test_search    | table | postgres | 99 MB      | 

postgres@findb:select * from test_search where to_tsvector('english',name)@@to_tsquery('english','1_veelx');
 id |  name   
----+---------
  1 | 1_veelx
(1 row)

Time: 0.873 ms
postgres@findb:explain analyze select * from test_search where to_tsvector('english',name)@@to_tsquery('english','1_veelx');
                                                        QUERY PLAN                                                        
--------------------------------------------------------------------------------------------------------------------------
 Bitmap Heap Scan on test_search  (cost=36.39..240.08 rows=50 width=17) (actual time=0.090..0.090 rows=1 loops=1)
   Recheck Cond: (to_tsvector('english'::regconfig, name) @@ '''1'' & ''veelx'''::tsquery)
   Heap Blocks: exact=1
   ->  Bitmap Index Scan on idx_test_search  (cost=0.00..36.38 rows=50 width=0) (actual time=0.085..0.085 rows=1 loops=1)
         Index Cond: (to_tsvector('english'::regconfig, name) @@ '''1'' & ''veelx'''::tsquery)
 Planning Time: 0.225 ms
 Execution Time: 0.125 ms
(7 rows)

Time: 1.197 ms
#no-prefix testcase
postgres@findb:insert into test_search values(2000001,'noneprefix testcase');
INSERT 0 1
Time: 4.371 ms
postgres@findb:explain analyze select * from test_search where to_tsvector('english',name)@@to_tsquery('english','testcase');
                                                          QUERY PLAN                                                          
------------------------------------------------------------------------------------------------------------------------------
 Bitmap Heap Scan on test_search  (cost=113.50..15218.16 rows=10000 width=17) (actual time=0.052..0.052 rows=1 loops=1)
   Recheck Cond: (to_tsvector('english'::regconfig, name) @@ '''testcas'''::tsquery)
   Heap Blocks: exact=1
   ->  Bitmap Index Scan on idx_test_search  (cost=0.00..111.00 rows=10000 width=0) (actual time=0.013..0.013 rows=1 loops=1)
         Index Cond: (to_tsvector('english'::regconfig, name) @@ '''testcas'''::tsquery)
 Planning Time: 0.086 ms
 Execution Time: 0.071 ms
(7 rows)

Time: 0.557 ms
#not like 'LIKE'
postgres@findb:select * from test_search where to_tsvector('english',name)@@to_tsquery('english','testcas');
 id | name 
----+------
(0 rows)

Time: 0.484 ms
```

通过全文检索走索引大幅缩短了查询时间，但是全文检索与like不一样，like是字符匹配，全文检索是单词匹配，（no-prefix的情况通常的B树索引也不能支持）

- #### json/jsonb的全文检索

```
postgres@findb:\df *to_tsvector*
                                 List of functions
   Schema   |       Name        | Result data type |   Argument data types   | Type 
------------+-------------------+------------------+-------------------------+------
 pg_catalog | array_to_tsvector | tsvector         | text[]                  | func
 pg_catalog | json_to_tsvector  | tsvector         | json, jsonb             | func
 pg_catalog | json_to_tsvector  | tsvector         | regconfig, json, jsonb  | func
 pg_catalog | jsonb_to_tsvector | tsvector         | jsonb, jsonb            | func
 pg_catalog | jsonb_to_tsvector | tsvector         | regconfig, jsonb, jsonb | func
 pg_catalog | to_tsvector       | tsvector         | json                    | func
 pg_catalog | to_tsvector       | tsvector         | jsonb                   | func
 pg_catalog | to_tsvector       | tsvector         | regconfig, json         | func
 pg_catalog | to_tsvector       | tsvector         | regconfig, jsonb        | func
 pg_catalog | to_tsvector       | tsvector         | regconfig, text         | func
 pg_catalog | to_tsvector       | tsvector         | text                    | func
(11 rows)

postgres@findb:create or replace function random_range(int4,int4)
findb-# returns int4
findb-# language SQL
findb-# as $$
findb$# select ($1+floor(($2-$1+1)*random()))::int4;
findb$# $$;
CREATE FUNCTION

postgres@findb:create or replace function random_text_simple(length int4)
findb-# returns text
findb-# language PLPGSQL
findb-# as $$
findb$# DECLARE
findb$# possible_chars text:='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
findb$# output text :='';
findb$# i int4;
findb$# pos int4;
findb$# begin
findb$# for i in 1..length loop
findb$# pos :=random_range(1,length(possible_chars));
findb$# output:=output||substr(possible_chars,pos,1);
findb$# end loop;
findb$# return output;
findb$# end;
findb$# $$;
CREATE FUNCTION
postgres@findb:\df
                              List of functions
 Schema |        Name        | Result data type | Argument data types | Type 
--------+--------------------+------------------+---------------------+------
 public | random_range       | integer          | integer, integer    | func
 public | random_text_simple | text             | length integer      | func
(2 rows)
postgres@findb:select random_text_simple(5);
 random_text_simple 
--------------------
 GRWZ6
(1 row)
postgres@findb:truncate table user_ini;
TRUNCATE TABLE
postgres@findb:
postgres@findb:
postgres@findb:insert into user_ini(id,user_id,user_name) select r,round(random()*1000000),random_text_simple(6) from generate_series(1,1000000) as r ;
INSERT 0 1000000
postgres@findb:create table tbl_user_search_json(id serial,user_info json);
CREATE TABLE
postgres@findb:insert into tbl_user_search_json(user_info) select row_to_json(user_ini) from user_ini;
INSERT 0 1000000
postgres@findb:\timing on
Timing is on.
postgres@findb:select * from tbl_user_search_json where to_tsvector('english',user_info)@@to_tsquery('ENGLISH','GUNTVU');
 id |                                         user_info                                         
----+-------------------------------------------------------------------------------------------
  7 | {"id":7,"user_id":550209,"user_name":"GUNTVU","create_time":"2020-12-19T12:11:55.070116"}
(1 row)

Time: 2371.057 ms (00:02.371)

postgres@findb:create index idx_tbl_user_search_json on tbl_user_search_json using gin(to_tsvector('english',user_info));
CREATE INDEX
Time: 15754.502 ms (00:15.755)
postgres@findb:select * from tbl_user_search_json where to_tsvector('english',user_info)@@to_tsquery('ENGLISH','GUNTVU');
 id |                                         user_info                                         
----+-------------------------------------------------------------------------------------------
  7 | {"id":7,"user_id":550209,"user_name":"GUNTVU","create_time":"2020-12-19T12:11:55.070116"}
(1 row)

Time: 5.685 ms
```
