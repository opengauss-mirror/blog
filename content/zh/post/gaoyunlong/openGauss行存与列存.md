+++

title = "openGauss行存与列存" 

date = "2020-11-17" 

tags = ["openGauss行存与列存"] 

archives = "2020-11" 

author = "高云龙" 

summary = "openGauss行存与列存"

img = "/zh/post/gaoyunlong/title/img24.png" 

times = "12:30"

+++

# openGauss行存与列存<a name="ZH-CN_TOPIC_0291959499"></a>

## 列存表限制<a name="section46133367719"></a>

-   列存表不支持数组。
-   列存表的数量建议不超过1000个。
-   列存表的表级约束只支持PARTIAL CLUSTER KEY，不支持主外键等表级约束。
-   列存表的字段约束只支持NULL、NOT NULL和DEFAULT常量值。
-   列存表不支持alter命令修改字段约束。
-   列存表支持delta表，受参数enable\_delta\_store 控制是否开启，受参数deltarow\_threshold控制进入delta表的阀值。

## 列存相关参数<a name="section176073412819"></a>

-   cstore\_buffers

    列存所使用的共享缓冲区的大小，默认值：32768KB。


-   partition\_mem\_batch

    指定缓存个数，为了优化对列存分区表的批量插入，在批量插入过程中会对数据进行缓存后再批量写盘。默认值：256 。


-   partition\_max\_cache\_size

    指定数据缓存区大小，为了优化对列存分区表的批量插入，在批量插入过程中会对数据进行缓存后再批量写盘。默认值：2GB。


-   enable\_delta\_store

    为了增强列存单条数据导入的性能和解决磁盘冗余问题，是否需要开启列存delta表功能，与参数DELTAROW\_THRESHOLD 配合使用。默认值：off。


## 建表语法<a name="section6216163918816"></a>

openGauss 创建普通表默认是未压缩的行存表。

```
mydb=# \dt
No relations found.
mydb=# create table test_t(id serial primary key ,col1 varchar(8),col2 decimal(6,2),create_time timestamptz not null default now());
NOTICE:  CREATE TABLE will create implicit sequence "test_t_id_seq" for serial column "test_t.id"
NOTICE:  CREATE TABLE / PRIMARY KEY will create implicit index "test_t_pkey" for table "test_t"
CREATE TABLE
mydb=# \dt+
                                     List of relations
 Schema |  Name  | Type  | Owner |  Size   |             Storage              | Description
--------+--------+-------+-------+---------+----------------------------------+-------------
 public | test_t | table | omm   | 0 bytes | {orientation=row,compression=no} |
(1 row)

mydb=# 
```

创建列存表，需要指定**orientation=column**，默认压缩级别是low。

```
mydb=# create table column_t(id serial,col1 varchar(8),col2 decimal(6,2),create_time timestamptz not null default now()) with (orientation=column );
NOTICE:  CREATE TABLE will create implicit sequence "column_t_id_seq" for serial column "column_t.id"
CREATE TABLE
mydb=# \dt+
                                        List of relations
 Schema |   Name   | Type  | Owner |  Size   |               Storage                | Description
--------+----------+-------+-------+---------+--------------------------------------+-------------
 public | column_t | table | omm   | 16 kB   | {orientation=column,compression=low} |
 public | test_t   | table | omm   | 0 bytes | {orientation=row,compression=no}     |
(2 rows)

mydb=#mydb=# \d+ column_t
                                                        Table "public.column_t"
   Column    |           Type           |                       Modifiers                       | Storage  | Stats target | Description
-------------+--------------------------+-------------------------------------------------------+----------+--------------+-------------
 id          | integer                  | not null default nextval('column_t_id_seq'::regclass) | plain    |              |
 col1        | character varying(8)     |                                                       | extended |              |
 col2        | numeric(6,2)             |                                                       | main     |              |
 create_time | timestamp with time zone | not null default now()                                | plain    |              |
Has OIDs: no
Options: orientation=column, compression=low
```

列存表添加局部聚簇存储列。

```
mydb=# \d+ column_t
                                                        Table "public.column_t"
   Column    |           Type           |                       Modifiers                       | Storage  | Stats target | Description
-------------+--------------------------+-------------------------------------------------------+----------+--------------+-------------
 id          | integer                  | not null default nextval('column_t_id_seq'::regclass) | plain    |              |
 col1        | character varying(8)     |                                                       | extended |              |
 col2        | numeric(6,2)             |                                                       | main     |              |
 create_time | timestamp with time zone | not null default now()                                | plain    |              |
Has OIDs: no
Options: orientation=column, compression=low

mydb=# alter table column_t add PARTIAL CLUSTER KEY(id);
ALTER TABLE
mydb=# \d+ column_t
                                                        Table "public.column_t"
   Column    |           Type           |                       Modifiers                       | Storage  | Stats target | Description
-------------+--------------------------+-------------------------------------------------------+----------+--------------+-------------
 id          | integer                  | not null default nextval('column_t_id_seq'::regclass) | plain    |              |
 col1        | character varying(8)     |                                                       | extended |              |
 col2        | numeric(6,2)             |                                                       | main     |              |
 create_time | timestamp with time zone | not null default now()                                | plain    |              |
Partial Cluster :
    "column_t_cluster" PARTIAL CLUSTER KEY (id)
Has OIDs: no
Options: orientation=column, compression=low

mydb=#
```

直接创建带局部聚簇存储的列存表。

```
NOTICE:  CREATE TABLE will create implicit sequence "column_c_id_seq" for serial column "column_c.id"
CREATE TABLE
mydb=# \d+ column_c
                                                        Table "public.column_c"
   Column    |           Type           |                       Modifiers                       | Storage  | Stats target | Description
-------------+--------------------------+-------------------------------------------------------+----------+--------------+-------------
 id          | integer                  | not null default nextval('column_c_id_seq'::regclass) | plain    |              |
 col1        | character varying(8)     |                                                       | extended |              |
 col2        | numeric(6,2)             |                                                       | main     |              |
 create_time | timestamp with time zone | not null default now()                                | plain    |              |
Partial Cluster :
    "column_c_cluster" PARTIAL CLUSTER KEY (id)
Has OIDs: no
Options: orientation=column, compression=low

mydb=#
```

## 列存与行存对比<a name="section2310652888"></a>

**磁盘使用空间**

-   列存表默认大小16K，low压缩级别。
-   行存表默认大小0bytes，非压缩级别。
-   分别向两个表中插入100万条数据，占用磁盘大小对比。

```
mydb=# \dt+
                                          List of relations
 Schema |   Name    | Type  | Owner |  Size   |                 Storage                 | Description
--------+-----------+-------+-------+---------+-----------------------------------------+-------------
 public | column_t  | table | omm   | 16 kB   | {orientation=column,compression=low}    |
 public | column_th | table | omm   | 16 kB   | {orientation=column,compression=high}   |
 public | column_tm | table | omm   | 16 kB   | {orientation=column,compression=middle} |
 public | row_tc    | table | omm   | 0 bytes | {orientation=row,compression=yes}       |
 public | test_t    | table | omm   | 0 bytes | {orientation=row,compression=no}        |
(5 rows)

mydb=# insert into column_t select generate_series(1,1000000),left(md5(random()::text),8),random()::numeric(6,2);
INSERT 0 1000000
Time: 11328.880 ms
mydb=# insert into column_th select generate_series(1,1000000),left(md5(random()::text),8),random()::numeric(6,2);
INSERT 0 1000000
Time: 10188.634 ms
mydb=# insert into column_tm select generate_series(1,1000000),left(md5(random()::text),8),random()::numeric(6,2);
INSERT 0 1000000
Time: 9802.739 ms
mydb=# insert into test_t select generate_series(1,1000000),left(md5(random()::text),8),random()::numeric(6,2);
INSERT 0 1000000
Time: 17404.945 ms
mydb=# insert into row_tc select generate_series(1,1000000),left(md5(random()::text),8),random()::numeric(6,2);
INSERT 0 1000000
Time: 12394.866 ms
mydb=# \dt+
                                           List of relations
 Schema |   Name    | Type  | Owner |   Size   |                 Storage                 | Description
--------+-----------+-------+-------+----------+-----------------------------------------+-------------
 public | column_t  | table | omm   | 12 MB    | {orientation=column,compression=low}    |
 public | column_th | table | omm   | 8304 kB  | {orientation=column,compression=high}   |
 public | column_tm | table | omm   | 10168 kB | {orientation=column,compression=middle} |
 public | row_tc    | table | omm   | 58 MB    | {orientation=row,compression=yes}       |
 public | test_t    | table | omm   | 58 MB    | {orientation=row,compression=no}        |
(5 rows)

mydb=#
```

-   列存表开启的压缩级别越高。
-   占用磁盘空间越少行存表开启压缩后，磁盘空间大小占比减少不明显。
-   列存表占用磁盘空间比行存表占用磁盘空间少近6倍。

**DML对比**

查找单列

```
---
---按范围查找，列存比行存快近20倍
---
mydb=# select col1 from test_t where id>=100010 and id<100020;
   col1
----------
 4257a3f3
 3d397284
 64343438
 6eb7bdb7
 d1c9073d
 6aeb037c
 1d424974
 223235ab
 329de235
 2f02adc1
(10 rows)

Time: 77.341 ms
mydb=# select col1 from column_t where id>=100010 and id<100020;
   col1
----------
 d4837c30
 87a46f7a
 2f42a9c9
 4481c793
 68800204
 613b9205
 9d8f4a0a
 5cc4ff9e
 f948cd10
 f2775cee
(10 rows)

Time: 3.884 ms

---
---随机查找，列存比行存快近35倍
---

mydb=# select col1 from test_t limit 10;
   col1
----------
 c2780d93
 294be14d
 4e53b761
 2c10f8a2
 ae776743
 7d683c66
 b3b40054
 7e56edf9
 a7b7336e
 ea3d47d9
(10 rows)

Time: 249.887 ms
mydb=# select col1 from column_t limit 10;
   col1
----------
 a745d77b
 4b6df494
 76fed9c1
 70c9664d
 3384de8a
 4158f3bf
 5d1c3b9f
 341876bb
 f396f4ed
 abfd78bb
(10 rows)

Time: 7.738 ms
```

select \*

```
---
---行存比列存查询快30%
---
mydb=# select * from test_t limit 10;
 id |   col1   | col2 |          create_time
----+----------+------+-------------------------------
  1 | c2780d93 |  .37 | 2020-10-26 14:27:33.304108+08
  2 | 294be14d |  .57 | 2020-10-26 14:27:33.304108+08
  3 | 4e53b761 |  .98 | 2020-10-26 14:27:33.304108+08
  4 | 2c10f8a2 |  .27 | 2020-10-26 14:27:33.304108+08
  5 | ae776743 |  .97 | 2020-10-26 14:27:33.304108+08
  6 | 7d683c66 |  .58 | 2020-10-26 14:27:33.304108+08
  7 | b3b40054 |  .44 | 2020-10-26 14:27:33.304108+08
  8 | 7e56edf9 |  .43 | 2020-10-26 14:27:33.304108+08
  9 | a7b7336e |  .31 | 2020-10-26 14:27:33.304108+08
 10 | ea3d47d9 |  .42 | 2020-10-26 14:27:33.304108+08
(10 rows)

Time: 6.822 ms

mydb=# select * from column_t limit 10;
 id |   col1   | col2 |          create_time
----+----------+------+-------------------------------
  1 | a745d77b |  .33 | 2020-10-26 14:28:20.633253+08
  2 | 4b6df494 |  .42 | 2020-10-26 14:28:20.633253+08
  3 | 76fed9c1 |  .73 | 2020-10-26 14:28:20.633253+08
  4 | 70c9664d |  .74 | 2020-10-26 14:28:20.633253+08
  5 | 3384de8a |  .48 | 2020-10-26 14:28:20.633253+08
  6 | 4158f3bf |  .59 | 2020-10-26 14:28:20.633253+08
  7 | 5d1c3b9f |  .63 | 2020-10-26 14:28:20.633253+08
  8 | 341876bb |  .97 | 2020-10-26 14:28:20.633253+08
  9 | f396f4ed |  .73 | 2020-10-26 14:28:20.633253+08
 10 | abfd78bb |  .30 | 2020-10-26 14:28:20.633253+08
(10 rows)

Time: 9.982 ms
```

update

```
---
---直接更新一个字段，列存比行存快近7倍
---
mydb=# update test_t set col1=col1;
UPDATE 1000000
Time: 19779.978 ms
mydb=# update column_t set col1=col1;
UPDATE 1000000
Time: 2702.339 ms
```

## 结论<a name="section46241214917"></a>

1.  列存表比行存表在磁盘空间占用上节省近6倍。
2.  查询指定字段，列存表比行存表快约20-35倍。
3.  select \* 的方式，列存表比行存表慢30%。
4.  默认压缩方式批量导入数据，列存表比行存表快40%。


