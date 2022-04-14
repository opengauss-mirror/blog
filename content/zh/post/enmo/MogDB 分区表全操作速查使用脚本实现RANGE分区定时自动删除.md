+++

title = "MogDB 分区表全操作速查/使用脚本实现RANGE分区定时自动删除" 

date = "2022-04-14" 

tags = ["MogDB 分区表全操作速查/使用脚本实现RANGE分区定时自动删除"] 

archives = "2022-04" 

author = "云和恩墨" 

summary = "MogDB 分区表全操作速查/使用脚本实现RANGE分区定时自动删除"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# MogDB 分区表全操作速查/使用脚本实现RANGE分区定时自动删除

本文出处：https://www.modb.pro/db/237966

<br/>

**本文所有操作基于Mogdb 版本2.0.1** 



## 分区类型

- RANGE分区 按照范围值进行分区，生产环境最常用到的分区类型，特别适用于按照日期进行业务查询的系统。
- INTERVAL分区 可以理解为RANGE分区的加强版，在新数据插入时，按照partition key的取值，实时自动建立新分区，非常实用。
- LIST分区 按照枚举值进行分区，目前mogdb版本（2.0.1）不支持default分区，如果插入数据时，出现partition key中没有枚举到的值的话，SQL会执行失败。 
- HASH分区 一般作为子分区存在，很少单独使用。 
- SUB-PARTITION子分区 在分区的基础上，为分区添加下一级子分区，一般用于优化SQL语句的执行速度，如RANGE-HASH子分区。本文不对子分区做介绍。 



## 分区相关操作操作

### 创建分区表

***RANGE分区\***

- partition key支持多列分区 
- partition key为maxvalue的分区可以存放不符合其他分区的数值
- 注意partition key分区范围为[ )，分区不存储partition key的边界值，如partition p3 values less than('2021-10-01')，P3分区不存储'2021-10-01'的数据，该数据存放在下个分区中

```sql
--SQL语句
CREATE TABLE part_range (
    id int not null,
    remark varchar(8),
    db_insert_time date
) PARTITION BY RANGE (db_insert_time)
(
    partition p1 values less than('2021-04-01'),
    partition p2 values less than('2021-07-01'),
    partition p3 values less than('2021-10-01'),
    partition p4 values less than(maxvalue)
);
```

***INTERVAL分区\*** 

- 分隔间隔可以为，日，周，月，年，最小分隔单位为日。 

```sql
--SQL语句
create table part_interval(
  id serial,
  remark varchar(16),
  db_insert_time date
) partition by range(db_insert_time) interval('1 day')
(
  partition p1 values less than('2020-12-08'),
  partition p2 values less than('2020-12-09')
 );
```

***LIST分区\*** 

- 暂不支持default分区 如果插入的新数据不在所有分区取值范围内，SQL将会报错退出 
- 分区个数不能超过64个 
- 每个分区键键值不能超过1048575 

```sql
--SQL语句
CREATE TABLE part_list (
    id serial not null,
    remark varchar(16),
    province_name varchar(16)
) PARTITION BY LIST(province_name)
(
    PARTITION p1 values('harbin','shenyang','changchun'),
    PARTITION p2 values('beijing','shenzhen','tianjing')
);
```

***HASH分区\*** 

- 分区个数建议为power(2,N)个，分区个数在create table创建完毕之后，不再允许修改
- 分区个数不能超过1048575

```sql
--SQL语句
create table part_hash(
	id int not null,
	name varchar(16)
) partition by hash(id)
(
  partition p1,
	partition p2,
	partition p3,
	partition p4
);
```



### 查询分区表分区信息

```sql
--SQL语句
select rel_table.relname table_name, rel_partition.*
  from (select relname, parentid from pg_partition where parttype = 'r') rel_table,
       (select relname,
               parentid,
               relfilenode,
               parttype,
               partstrategy,
               boundaries,
               interval
          from pg_partition
         where parttype = 'p') rel_partition
 where rel_table.parentid = rel_partition.parentid
   and rel_table.relname in
       ('part_range', 'part_list', 'part_hash', 'part_interval')
 order by 1, 2;
```



### 重命名分区

***RANGE分区\***

```sql
--SQL语句 
alter table part_range rename partition p1 to p_1; 
```

***INTERVAL分区\***

```sql
--SQL语句 
alter table part_interval rename partition p1 to p_1;
```

***LIST分区\*** 

```sql
--SQL语句 
alter table part_list rename partition p1 to p_1; 
```

***HASH分区\*** 

```sql
--SQL语句 
alter table part_hash rename partition p1 to p_1; 
```



### 添加分区

***RANGE分区\*** 

- 如果创建了maxvalue分区，需要先删除maxvalues的分区/或直接使用split命令增加分区 
- 支持一次增加多个分区 

```sql
--SQL语句
alter table part_range drop partition p4; 
alter table part_range add partition p5 values less than('2022-02-01'),add partition p6 values less than('2022-02-02');
```

***INTERVAL分区\***

-  无需手动添加分区，数据插入时自动增加分区 

```
--SQL语句
insert into part_interval values(1,null,now());
```

--插入数据前

![img](https://oss-emcsprod-public.modb.pro/image/editor/20220209-1519ffcf-3086-4a81-bd90-0eba6592138f.png)

--插入数据后

![img](https://oss-emcsprod-public.modb.pro/image/editor/20220209-17160237-a0f1-4952-9072-2ec56ca3b6fd.png)

***LIST分区\***

- 支持一次增加多个分区

```sql
--SQL语句
alter table part_list add partition p3 values('taiwan'),add partition p4 values('aomen'),add partition p5 values('xiangguang');
```

***HASH分区\*** 

- 暂不支持添加分区 



### 删除分区

***RANGE分区\*** 

- 支持一次删除多个分区

```sql
--SQL语句
alter table part_range drop partition p5,drop partition p6;
```

***INTERVAL分区\*** 

- 参考分区自动删除脚本 

***LIST分区\***

- 支持一次删除多个分区

```sql
--SQL语句 
alter table part_list drop partition p3,drop partition p4,drop partition p5; 
```

***HASH分区\*** 

- 暂不支持删除分区 



### 切割分区

***RANGE分区\*** 

- split_point（分割点）需要位于前分区和分隔分区之间 ，且不能跨越多个分区

- 分区名不能重用 

```sql
--SQL语句
alter table part_range split partition p3 at ('2021-08-01') into (partition p_3,partition p_4);
```

***INTERVAL分区\***

-  同RANGE分区

***LIST分区\*** 

- 暂不支持切割分区

***HASH分区\*** 

- 暂不支持切割分区 



### 清空分区

***RANGE分区\***

```sql
--SQL语句
alter table part_range truncate partition p_1;
```

***INTERVAL分区\*** 

- 同RANGE分区 

***LIST分区\*** 

- 暂不支持清空分区 

***HASH分区\*** 

- 暂不支持清空



### 交换分区

**(普通表转换为表分区，分区表位普通表)**

- 需要列结构一致，索引/约束一致
- 普通表数据要在将替换的分区partition key范围之内 适用在变更时间较短，并且数据量较多的场合（考虑全局索引重建的因素） 

***RANGE分区\***

```sql
--创建普通表
CREATE TABLE t_exchange_range (
    id int not null,
    remark varchar(8),
    db_insert_time date
);

--普通表插入数据
insert into t_exchange_range values(3,null,date '2021-08-01'),(3,null,date '2021-08-15'),(3,null,date '2021-09-01'),(3,null,date '2021-09-15');

--交换分区
alter table part_range EXCHANGE partition (p_4) with table t_exchange_range;

--查询分区
select * from part_range partition(p_4);

--输出结果

```

***INTERVAL分区\***

- 同RANGE分区 

***LIST分区\***

- 暂不支持交换分区 

***HASH分区\*** 

- 暂不支持交换分区



## 自动删除分区脚本：

```
名称类型描述
oidoid行标识符（隐藏属性，必须明确选择）。
relnamename分区表、分区、分区上toast表和分区索引的名称。
parttype"char"对象类型: 
- 'r': partitioned table
- 'p': table partition
- 'x': index partition
- 't': toast table
parentidoid当对象为分区表或分区时，此字段表示分区表在PG_CLASS中的OID。当对象为index partition时，此字段表示所属分区表索引（partitioned index）的OID。
rangenuminteger保留字段。
intervalnuminteger保留字段。
partstrategy"char"分区表分区策略，现在仅支持: 
- 'r': 范围分区。
- 'v': 数值分区。
- 'i': 间隔分区。
- 'l'：list分区。
- 'h'：hash分区。
- 'n'：无效分区。
relfilenodeoidtable partition、index partition、分区上toast表的物理存储位置。
reltablespaceoidtable partition、index partition、分区上toast表所属表空间的OID。
relpagesdouble precision统计信息: table partition、index partition的数据页数量。
reltuplesdouble precision统计信息: table partition、index partition的元组数。
relallvisibleinteger统计信息: table partition、index partition的可见数据页数。
reltoastrelidoidtable partition所对应toast表的OID。
reltoastidxidoidtable partition所对应toast表的索引的OID。
indextblidoidindex partition对应table partition的OID。
indisusableBoolean分区索引是否可用。
reldeltarelidoidDelta表的OID。
reldeltaidxoidDelta表的索引表的OID。
relcudescrelidoidCU描述表的OID。
relcudescidxoidCU描述表的索引表的OID。
relfrozenxidxid32冻结事务ID号。
为保持前向兼容，保留此字段，新增relfrozenxid64用于记录此信息。
intspnuminteger间隔分区所属表空间的个数。
partkeyint2vector分区键的列号。
intervaltablespaceoidvector间隔分区所属的表空间，间隔分区以round-robin方式落在这些表空间内。
intervaltext[]间隔分区的间隔值。
boundariestext[]范围分区和间隔分区的上边界。
transittext[]间隔分区的跳转点。
reloptionstext[]设置partition的存储属性，与pg_class.reloptions的形态一样，用"keyword=value"格式的字符串来表示 ，目前用于在线扩容的信息搜集。
relfrozenxid64xid冻结事务ID号。
```
