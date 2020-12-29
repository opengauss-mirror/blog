+++

title = "openGauss的索引组织表" 

date = "2020-12-25" 

tags = ["openGauss核心技术"] 

archives = "2020-12" 

author = "贾军锋" 

summary = "openGauss的索引组织表"

img = "/zh/post/jiajunfeng/title/img4.png" 

times = "12:30"

+++

# openGauss的索引组织表<a name="ZH-CN_TOPIC_0000001072944639"></a>

## 概述<a name="section1375918510525"></a>

今天有位小伙伴问我，Oracle数据库可以通过索引组织表\(IOT\)将数据按照主键排序存储，有序的数据存储可以有效提高数据库缓冲区的命中率，减少SQL查询的IO消耗，提升查询效率。而openGauss的建表语句中并没有看到索引组织表的相关语法。openGauss目前是不是不支持索引组织表？

我觉得暂时是这样的\(说不定后期版本会新添加\)，在openGauss的官方文档中有关建表操作中确实没有看到对索引组织表的描述，但是与索引组织表效果类似的操作确是可以看到，那就是cluster操作，个人认为这个功能与索引组织表的主要功能类似：数据按照索引顺序进行有序存储。

使用cluster操作可以根据表的索引对数据进行聚簇排序，将数据基于索引信息进行物理存储。但在openGauss中，这种聚簇排序操作是一次性的，即：当表被更新之后， 更改的内容不会自动被聚簇排序后存储。也就是说，系统不会试图按照索引顺序对新的存储内容及更新记录进行重新聚簇排序存储。

当一个表聚簇\(CLUSTER操作\)之后，openGauss会记录在哪个索引上建立了聚簇。用户可以通过**CLUSTER**操作在之前的同一个索引的表上重新聚簇排序，也可以用**ALTER TABLE CLUSTER**或**SET WITHOUT CLUSTER**形式来设置索引来用于后续的聚簇操作或清除任何之前的设置。

表的聚簇操作\(CLUSTER\)大致分为以下几步：

1.  检查堆表和索引是否满足聚簇要求;
2.  获取目标表和索引的排它锁\(exclusive lock\);
3.  标记指定的索引为聚簇依据;
4.  根据目标表的数据和索引，拷贝数据并创建一个有序存储的临时表;
5.  交换临时表和目标表的relfilenode，以确保目标表的OID不会发生变化\(数据库根据OID管理对象\);
6.  调用reindex重建目标表的索引;
7.  反馈vacuum full状态给统计线程;
8.  清除表的CLUSTER操作状态。

## 语法格式<a name="section57964065219"></a>

-   对一个表进行聚簇排序

    ```
    CLUSTER [ VERBOSE ] table_name [ USING index_name ];  
    ```

-   对一个分区进行聚簇排序

    ```
    CLUSTER [ VERBOSE ] table_name PARTITION ( partition_name ) [ USING index_name ];  
    ```

-   对已做过聚簇的表重新进行聚簇

    ```
    CLUSTER [ VERBOSE ];
    ```


>![](public_sys-resources/icon-note.gif) **说明：** 
>不含参数的CLUSTER会将当前用户所拥有的数据库中的先前做过聚簇的所有表重新处理。

## 测试示例<a name="section7365171115551"></a>

**创建测试表和索引**

```
postgres=> create tablespace tbs1 relative location 'tablespace/tbs1' ;
CREATE TABLESPACE
postgres=> create table test tablespace tbs1 
	   as 
	   select relname,relnamespace,relowner,relfilenode from pg_class;
INSERT 0 648
postgres=> create index test_idx on test(relfilenode) tablespace tbs1;
CREATE INDEX
```

**查询表信息**

```
postgres=> \d test
       Table "public.test"
    Column    | Type | Modifiers
--------------+------+-----------
 relname      | name |
 relnamespace | oid  |
 relowner     | oid  |
 relfilenode  | oid  |
Indexes:
    "test_idx" btree (relfilenode) TABLESPACE tbs1, tablespace "tbs1"
Tablespace: "tbs1"

postgres=> select oid,relname,relpages,reltablespace,relfilenode 
	   from pg_class 
	   where relname like '%test%';
  oid  | relname  | relpages | reltablespace | relfilenode
-------+----------+----------+---------------+-------------
 17187 | test     |        9 |         16385 |       17187
 17190 | test_idx |        4 |         16385 |       17190


postgres=> select ctid,* from test 
	   order by relfilenode desc 
	   limit 10;
  ctid  |       relname        | relnamespace | relowner | relfilenode
--------+----------------------+--------------+----------+-------------
 (2,8)  | test                 |         2200 |       10 |       17187
 (1,40) | emp1_empno_idx       |         2200 |       10 |       17169
 (1,12) | emp1                 |         2200 |       10 |       17166
 (0,30) | t3                   |         2200 |       10 |       17154
 (0,29) | t2                   |         2200 |       10 |       17150
 (0,28) | t2_id_seq            |         2200 |       10 |       17148
 (0,27) | seq01                |         2200 |       10 |       17147
 (0,26) | seq02                |         2200 |       10 |       17145
 (0,25) | pg_toast_17129_index |           99 |       10 |       17142
 (0,24) | pg_toast_17129       |           99 |       10 |       17140

备注：ctid表示数据记录的物理行位置信息，格式为(blockid,offset)
```

通过以上操作我们可以获得以下信息：

1.  当前创建的测试表和索引存储在同一个表空间\(16385\);
2.  表test的oid为17178且数据文件名为17178;
3.  索引test\_idx的oid为17190且数据文件名为17190;
4.  表test的数据存储物理位置并没有按照索引进行排序\(ctid\)，查询操作至少需要读取3个数据块的数据（默认堆表是无序存储）。

**执行cluster操作**

```
postgres=> cluster test using test_idx ; CLUSTER 
```

**查询表信息**

```
postgres=> \d test
       Table "public.test"
    Column    | Type | Modifiers
--------------+------+-----------
 relname      | name |
 relnamespace | oid  |
 relowner     | oid  |
 relfilenode  | oid  |
Indexes:
    "test_idx" btree (relfilenode) TABLESPACE tbs1 CLUSTER, tablespace "tbs1"
Tablespace: "tbs1"

postgres=> select oid,relname,relpages,reltablespace,relfilenode from pg_class where relname like '%test%';
  oid  | relname  | relpages | reltablespace | relfilenode
-------+----------+----------+---------------+-------------
 17187 | test     |        9 |         16385 |       17191
 17190 | test_idx |        4 |         16385 |       17194

postgres=> insert into test select relname,relnamespace,relowner,relfilenode from pg_class where relfilenode in (17154,17169);
INSERT 0 2

postgres=> select ctid,* from test order by relfilenode desc limit 10;
  ctid  |    relname     | relnamespace | relowner | relfilenode
--------+----------------+--------------+----------+-------------
 (8,48) | test           |         2200 |       10 |       17187
 (8,47) | emp1_empno_idx |         2200 |       10 |       17169
 (8,50) | emp1_empno_idx |         2200 |       10 |       17169
 (8,46) | emp1           |         2200 |       10 |       17166
 (8,45) | t3             |         2200 |       10 |       17154
 (8,49) | t3             |         2200 |       10 |       17154
 (8,44) | t2             |         2200 |       10 |       17150
 (8,43) | t2_id_seq      |         2200 |       10 |       17148
 (8,42) | seq01          |         2200 |       10 |       17147
 (8,41) | seq02          |         2200 |       10 |       17145
```

通过对表进行cluster操作，我们可以看到以下变化：

1.  test的索引test\_idx已经被标记为CLUSTER，openGauss已经记录在哪个索引上建立了聚簇;
2.  索引test\_idx、表test的OID和对应的表空间并没有发生变化，但是relfilenode却发生了变化，这说明在cluster操作过程中，数据文件本身已经发生了变化，不再是原先的那个数据文件。
3.  最明显的是表中的数据已经按照索引列relfilenode进行排序，查询的这10行数据都在同一个数据块\(blockid=8\)中存储，只需要读取一个数据块就可以获得目标数据。
4.  后插入的数据\(relfilenode=17169和17154\)并不会按照test\_idx索引进行聚簇排序存储。

## 小结<a name="section163514813565"></a>

通过对表的cluster操作，可以将堆表内的数据进行有序存储\(类似于oracle的索引组织表功能\)，在一定程度上可以降低SQL查询的IO消耗，但是让人头疼的是每次cluster操作时带来的表锁问题\(测试数据未显示\)使得该操作只能在业务空闲期由DBA手动执行，而且cluster操作所需的时间和空间的估算需要依据目标表和索引的具体量级和硬件环境而定。        另外，当数据进行有序存储后，表的统计信息可能与实际的情况差异较大，为了避免CBO优化器的误判，建议对目标表手动发起一次ANALYZE。

在官方文档中还指出：cluster操作不支持在事务中执行，且仅支持行存引擎的Btree索引，这两点也是需要注意的限制条件。

## TIPS<a name="section376165714560"></a>

关于数据有序存储，在列存引擎中可以使用Psort索引进行数据批量导入时的局部排序，减少CU之间的数据交集和误读现象，大幅降低SQL查询对磁盘IO的消耗。

关于MOT这个内存引擎，磁盘的IO应该不算是瓶颈问题，有序存储显得也不那么重要了，可以忽略。MOT更应该考虑的是并发访问的锁瓶颈和CPU、内存交互带来的延迟等问题。
