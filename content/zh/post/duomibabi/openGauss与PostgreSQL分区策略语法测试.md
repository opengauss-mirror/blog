+++

title = "openGauss与PostgreSQL分区策略语法测试" 

date = "2021-04-19" 

tags = ["openGauss与PostgreSQL对比"] 

archives = "2021-04" 

author = "多米爸比" 

summary = "openGauss与PostgreSQL分区策略语法测试"

img = "/zh/post/duomibabi/title/img26.png" 

times = "16:30"

+++

# openGauss与PostgreSQL分区策略语法测试<a name="ZH-CN_TOPIC_0000001142261997"></a>

## 父子继承表<a name="section989019386429"></a>

目前openGauss还不支持inherits继承特性。

```
omm=# CREATE TABLE tab_t2(age int) inherits(tab_t1);
ERROR:  CREATE TABLE ... INHERITS is not yet supported.
```

PostgreSQL支持继承，版本10之前的分区表都是通过继承特性来实现，每个分区实际上都是一个独立的表。数据更新可通过触发器trigger或者规则rule来实现

下面演示PostgreSQL中的继承特性：

```
CREATE TABLE tab_t1(id int primary key,name varchar(20) not null);
CREATE TABLE tab_t2(age int) inherits(tab_t1);
```

对父表增加字段

```
alter table tab_t1 add create_date date;
```

查看表结构

```
postgres=# \d tab_t1
                        Table "public.tab_t1"
   Column    |         Type          | Collation | Nullable | Default 
-------------+-----------------------+-----------+----------+---------
 id          | integer               |           | not null | 
 name        | character varying(20) |           | not null | 
 create_date | date                  |           |          | 
Indexes:
    "tab_t1_pkey" PRIMARY KEY, btree (id)
Number of child tables: 1 (Use \d+ to list them.)

postgres=# \d tab_t2
                        Table "public.tab_t2"
   Column    |         Type          | Collation | Nullable | Default 
-------------+-----------------------+-----------+----------+---------
 id          | integer               |           | not null | 
 name        | character varying(20) |           | not null | 
 age         | integer               |           |          | 
 create_date | date                  |           |          | 
Inherits: tab_t1
```

我们不通过触发器或者规则路由数据，直接插入数据

```
INSERT INTO tab_t1 VALUES (1,'data 1 in tab_t1',now());
INSERT INTO tab_t1 VALUES (2,'data 2 in tab_t1',now());
INSERT INTO tab_t2 VALUES (3,'data 3 in tab_t2',18,now());
INSERT INTO tab_t2 VALUES (4,'data 4 in tab_t2',20,now());
```

从父表中查询数据将显示父表及子表的所有数据

```
postgres=# SELECT * from tab_t1;
id |       name       | create_date 
----+------------------+-------------
  1 | data 1 in tab_t1 | 2021-04-11
  2 | data 2 in tab_t1 | 2021-04-11
  3 | data 3 in tab_t2 | 2021-04-11
  4 | data 4 in tab_t2 | 2021-04-11
(4 rows)
```

通过ONLY关键字实现只对父表的查询

```
postgres=#  SELECT * from ONLY tab_t1;
 id |       name       | create_date 
----+------------------+-------------
  1 | data 1 in tab_t1 | 2021-04-11
  2 | data 2 in tab_t1 | 2021-04-11
(2 rows)
```

从子表中查询只显示子表中的数据

```
postgres=# select * from tab_t2;
 id |       name       | age | create_date 
----+------------------+-----+-------------
  3 | data 3 in tab_t2 |  18 | 2021-04-11
  4 | data 4 in tab_t2 |  20 | 2021-04-11
(2 rows)
```

继承特性使用注意点：

-   子表并不能完全继承父表的所有属性，比如唯一约束、主键、外键，检查约束与非空约束可以继承。
-   修改父表的结构，子表结构同时被修改。
-   父表不存数据时，不建议在父表上创建索引和或唯一约束，应该在每个子表上分别创建。

## 声明式分区：范围分区<a name="section236993854415"></a>

将数据基于范围映射到每一个分区，这个范围是由创建分区表时指定的分区键决定的。这种分区方式较为常用，并且分区键经常采用日期。

PostgreSQL从版本10开始支持，范围分区声明式语法分两步：

1.通过指定PARTITION BY子句把表创建为分区表，包括分区方法以及用作分区键的column列表。

```
CREATE TABLE measurement (
    city_id         int not null,
    logdate         date not null,
    peaktemp        int,
    unitsales       int
) PARTITION BY RANGE (logdate)
```

2.创建分区，每个分区的定义必须指定对应于父表的分区方法和分区键的边界。

```
CREATE TABLE measurement_y2006m02 PARTITION OF measurement
    FOR VALUES FROM ('2006-02-01') TO ('2006-03-01');

CREATE TABLE measurement_y2006m03 PARTITION OF measurement
    FOR VALUES FROM ('2006-03-01') TO ('2006-04-01');
...
```

openGauss范围分区声明式语法可以一步完成，范围分区从句语法有两种格式

-   VALUES LESS THAN语法格式\(范围分区策略的分区键最多支持4列\)
-   START END语法格式\(范围分区策略的分区键仅支持1列\)

注意上面两种从句语法不能混用，START END语法格式使用gs\_dump时会转变为VALUES LESS THAN语法格式。

openGauss范围分区例子

```
CREATE TABLE tab_part (
    id int not null,
    create_date date not null
) PARTITION BY RANGE(create_date) 
(
PARTITION p_20210401 VALUES LESS THAN(to_date('2021-04-01','yyyy-mm-dd')),
PARTITION p_20210402 VALUES LESS THAN(to_date('2021-04-02','yyyy-mm-dd')),
PARTITION p_max VALUES LESS THAN(MAXVALUE)
);
```

查看系统表可看到分区策略为“r”，range分区。

```
omm=# select relname,partstrategy from pg_partition where relname='tab_part';
 relname  | partstrategy 
----------+--------------
 tab_part | r
(1 row)
```

查看分区及边界

```
select relname,parttype,parentid,boundaries 
from pg_partition 
where parentid in(select oid from pg_class where relname='tab_part');
  relname   | parttype | parentid |       boundaries        
------------+----------+----------+-------------------------
 tab_part   | r        |    16412 | 
 p_20210401 | p        |    16412 | {"2021-04-01 00:00:00"}
 p_20210402 | p        |    16412 | {"2021-04-02 00:00:00"}
 p_max      | p        |    16412 | {NULL}
(4 rows)
```

接下来插入三条数据

```
insert into tab_part values(1,'2021-03-31');
insert into tab_part values(2,'2021-04-01');
insert into tab_part values(3,'9999-12-31');
```

查询分区，按分区名p\_20210402，也可以按分区边界值（PARTITION FOR）

```
omm=# select * from tab_part PARTITION (p_20210402);
 id |     create_date     
----+---------------------
  2 | 2021-04-01 00:00:00
(1 row)
```

## 声明式分区：列表分区<a name="section948813844716"></a>

通过显式地列出每一个分区中出现的键值来划分表。

与前面范围分区一样，PostgreSQL列表分区声明式语法也是两步，从版本10开始支持，openGauss只需一步完成，从版本1.1.0开始支持。

openGauss列表分区例子

```
CREATE TABLE tab_list(
    dept_no number,
    part_no varchar2(20),
    country varchar2(20),
    dtime date,
    amount number
)
PARTITION BY LIST(country)(
    PARTITION europe VALUES('FRANCE', 'ITALY'),
    PARTITION asia VALUES('INDIA', 'PAKISTAN'),
    PARTITION americas VALUES('US', 'CANADA')
);
```

查看系统表可看到分区策略为“l”，list分区。

```
omm=# select relname,partstrategy from pg_partition where relname='tab_list';
 relname  | partstrategy 
----------+--------------
 tab_list | l
(1 row)
```

查看分区及边界

```
select relname,parttype,parentid,boundaries 
from pg_partition 
where parentid in(select oid from pg_class where relname='tab_list');
 relname  | parttype | parentid |    boundaries    
----------+----------+----------+------------------
 tab_list | r        |    16389 | 
 americas | p        |    16389 | {US,CANADA}
 asia     | p        |    16389 | {INDIA,PAKISTAN}
 europe   | p        |    16389 | {FRANCE,ITALY}
(4 rows)
```

## 声明式分区：哈希分区<a name="section1411513491483"></a>

将数据通过哈希映射到每一个分区，每一个分区中存储了具有相同哈希值的记录。

PostgreSQL哈希分区声明式语法也是两步，从版本11开始支持，openGauss只需一步完成，从版本1.1.0开始支持。

openGauss哈希分区例子

```
CREATE TABLE tab_hash(
    dept_no number,
    part_no varchar2(20),
    country varchar2(20),
    dtime date,
    amount number
)PARTITION BY HASH(part_no)(
    PARTITION p1,
    PARTITION p2,
    PARTITION p3
);
```

查看系统表可看到分区策略为“h”，hash分区。

```
omm=# select relname,partstrategy from pg_partition where relname='tab_hash';
 relname  | partstrategy 
----------+--------------
 tab_hash | h
(1 row)
```

查看分区及边界

```
select relname,parttype,parentid,boundaries 
from pg_partition 
where parentid in(select oid from pg_class where relname='tab_hash');
 relname  | parttype | parentid | boundaries 
----------+----------+----------+------------
 tab_hash | r        |    16405 | 
 p3       | p        |    16405 | {2}
 p2       | p        |    16405 | {1}
 p1       | p        |    16405 | {0}
(4 rows)
```

## 基于范围分区的自动扩展间隔分区<a name="section19928417497"></a>

间隔分区（Interval-Partition）是针对Range类型分区的一种功能拓展。对连续数据类型的Range分区，如果插入的新数据值与当前分区均不匹配，Interval-Partition特性可以实现自动的分区创建。分区字段必须是时间类型\(date或timestamp\)。

PostgreSQL目前还不支持该语法，openGauss从版本1.1.0开始支持。

openGauss间隔分区例子

```
CREATE TABLE tab_range_interval (
    id int not null,
    create_date date not null
) PARTITION BY RANGE(create_date) INTERVAL('1 month')
(
PARTITION p1 VALUES LESS THAN(to_date('2021-01-29','yyyy-mm-dd'))
);
```

查看系统表可看到分区策略为“i”，interval分区。

```
omm=# select relname,partstrategy,interval from pg_partition where relname='tab_range_interval';
 relname  | partstrategy | interval  
----------+--------------+-----------
 tab_part | i            | {"1 month"}
(1 row)
```

接下来插入三条数据

```
insert into tab_range_interval values(1,'2021-01-29');
insert into tab_range_interval values(2,'2021-02-28');
insert into tab_range_interval values(3,'2022-03-29');
```

插入数据后检查是否自动创建了相应的分区

```
omm=# select relname,parttype,parentid,boundaries 
from pg_partition 
where parentid in(select oid from pg_class where relname='tab_range_interval');
      relname       | parttype | parentid |  boundaries  
--------------------+----------+----------+--------------
 tab_range_interval | r        |    16572 | 
 p1                 | p        |    16572 | {2021-01-29}
 sys_p1             | p        |    16572 | {2021-02-28}
 sys_p2             | p        |    16572 | {2021-03-28}
 sys_p3             | p        |    16572 | {2022-04-28}
(5 rows)
```

可以看到sys\_p1，sys\_p2，sys\_p3为系统自动生成的分区，并且自动处理了月末问题。

注意：

1.上面是在opengauss 1.1.0版本上测试的，从2.0.0版本开始，模板库默认字符集由SQL\_ASCII改为了UTF8,同时数据库兼容性由ORACLE改为PG，对本测试的影响是date数据类型。

2.目前只支持INTERVAL-RANGE，其它方式不支持。

3.间隔分区字段必须是时间类型\(date或timestamp\)。

## 总结<a name="section173057461506"></a>

1.openGauss目前只支持声明式分区，支持范围分区、列表分区、哈希分区以及INTERVAL-RANGE的自动扩展间隔分区。PostgreSQL支持继承及声明式分区，不支持自动扩展间隔分区。

2.自动扩展间隔分区的分区字段目前只支持时间类型\(date或timestamp\)。

3.对于声明式分区的分区来说，分区必须具有和分区表正好相同的列集合，表结构必须严格一致，而在表继承中，子表可以有父表中没有出现过的额外列，同时表继承允许多继承。

