**分区表**
分区表是把逻辑上的一张表根据某种方案分成几张物理块进行存储，这张逻辑上的表称之为分区表，物理块称之为分区。分区表是一张逻辑表，不存储数据，数据实际是存储在分区上的。常见的分区方案有范围分区（Range Partitioning）、间隔分区（Interval Partitioning）、哈希分区（Hash Partitioning）、列表分区（List Partitioning）、数值分区（Value Partition）等。目前行存表支持范围分区、间隔分区、哈希分区、列表分区，列存表仅支持范围分区。
范围分区是根据表的一列或者多列，将要插入表的记录分为若干个范围，这些范围在不同的分区里没有重叠。为每个范围创建一个分区，用来存储相应的数据。
间隔分区是一种特殊的范围分区，相比范围分区，新增间隔值定义，当插入记录找不到匹配的分区时，可以根据间隔值自动创建分区。间隔分区只支持基于表的一列分区，并且该列只支持TIMESTAMP[(p)] [WITHOUT TIME ZONE]、TIMESTAMP[(p)] [WITH TIME ZONE]、DATE数据类型。
哈希分区是根据表的一列，为每个分区指定模数和余数，将要插入表的记录划分到对应的分区中，每个分区所持有的行都需要满足条件：分区键的值除以为其指定的模数将产生为其指定的余数。
列表分区是根据表的一列，将要插入表的记录通过每一个分区中出现的键值划分到对应的分区中，这些键值在不同的分区里没有重叠。为每组键值创建一个分区，用来存储相应的数据。
分区数最大值为1048575个，一般情况下业务不可能创建这么多分区，这样会导致内存不足。
1.创建一个带压缩的列存范围分区表。
CREATE TABLE tp1
(
WR_RETURNED_DATE_SK       INTEGER                       ,
WR_ITEM_SK                INTEGER               NOT NULL,
WR_ORDER_NUMBER           BIGINT                NOT NULL,
WR_NET_LOSS               DECIMAL(7,2)
)WITH (ORIENTATION = COLUMN,COMPRESSION=MIDDLE)
PARTITION BY RANGE(WR_RETURNED_DATE_SK)
(
PARTITION P1 VALUES LESS THAN(2450815),
PARTITION P2 VALUES LESS THAN(2451179),
PARTITION P3 VALUES LESS THAN(MAXVALUE)
);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700550903-241c9862-cbab-4dd5-9541-8c5dd490266f.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=142&id=u7fe1a0bd&margin=%5Bobject%20Object%5D&name=image.png&originHeight=177&originWidth=554&originalType=binary&ratio=1&rotation=0&showTitle=false&size=100061&status=done&style=none&taskId=ubb995a8f-4e3a-4b8d-a3b0-1506cb0c6ac&title=&width=443.2)
--删除分区3
ALTER TABLE tp1 DROP PARTITION P3;
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700574355-091c1cc0-7189-48eb-a034-f9009ed3826d.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=104&id=ua39522d5&margin=%5Bobject%20Object%5D&name=image.png&originHeight=130&originWidth=417&originalType=binary&ratio=1&rotation=0&showTitle=false&size=64884&status=done&style=none&taskId=u73e93e3f-036e-43f8-96ba-12dfcee73c0&title=&width=333.6)
--增加分区WR_RETURNED_DATE_SK介于2451179和2453105之间。
ALTER TABLE tp1 ADD PARTITION P3 VALUES LESS THAN (2453105);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700589339-32f6d461-8804-4715-932f-3e7777059052.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=102&id=u0889200a&margin=%5Bobject%20Object%5D&name=image.png&originHeight=127&originWidth=392&originalType=binary&ratio=1&rotation=0&showTitle=false&size=65322&status=done&style=none&taskId=ub8565f97-a71e-4166-adfb-058368bad87&title=&width=313.6)
--增加分区WR_RETURNED_DATE_SK介于2453105和MAXVALUE间。
ALTER TABLE tp1 ADD PARTITION P4 VALUES LESS THAN (MAXVALUE);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700600692-8fe7bd65-3604-4490-aa7e-880ff65b2bd2.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=102&id=u06d9f6a4&margin=%5Bobject%20Object%5D&name=image.png&originHeight=128&originWidth=414&originalType=binary&ratio=1&rotation=0&showTitle=false&size=67630&status=done&style=none&taskId=ufbcc3330-ee8f-48a2-ba74-eb1eb50a18f&title=&width=331.2)
--删除分区P3
ALTER TABLE tp1 DROP PARTITION FOR (2453005);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700607726-2e599fcd-b97f-432f-aa38-8db6b9f1a32f.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=70&id=u570b3359&margin=%5Bobject%20Object%5D&name=image.png&originHeight=88&originWidth=554&originalType=binary&ratio=1&rotation=0&showTitle=false&size=60510&status=done&style=none&taskId=u248cf1aa-dc92-4d3a-bdb9-081b702a2a2&title=&width=443.2)
--分区P4重命名为P6
ALTER TABLE tp1 RENAME PARTITION P4 TO P6;
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700616162-ec04f547-e089-46de-99b8-57d953c58c99.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=70&id=u67d30de2&margin=%5Bobject%20Object%5D&name=image.png&originHeight=88&originWidth=554&originalType=binary&ratio=1&rotation=0&showTitle=false&size=59534&status=done&style=none&taskId=uaf05ef7d-acc0-4c71-ac00-f86c9db321c&title=&width=443.2)
--分区P2重命名为P4
ALTER TABLE tp1 RENAME PARTITION FOR (2451178) TO P4;
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700624611-7a7552f4-1e78-4b4e-872d-13511c963b5c.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=71&id=u644cd7e6&margin=%5Bobject%20Object%5D&name=image.png&originHeight=89&originWidth=554&originalType=binary&ratio=1&rotation=0&showTitle=false&size=63508&status=done&style=none&taskId=u2786cfa6-67ca-4423-939d-3553efe7c8b&title=&width=443.2)
--查询分区6的行数
SELECT count(*) FROM tp1 PARTITION (P6);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700633157-2db7f7b2-7e5b-425d-ac38-a0836a3b4a78.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=52&id=ua6ecdbd4&margin=%5Bobject%20Object%5D&name=image.png&originHeight=65&originWidth=451&originalType=binary&ratio=1&rotation=0&showTitle=false&size=8585&status=done&style=none&taskId=uf5152200-8cda-4377-a913-c000346c4c1&title=&width=360.8)
--查询分区4的行数
SELECT COUNT(*) FROM tp1 PARTITION FOR (2450815);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700640996-e080e9e2-0820-41b8-8fd5-ce5d5fa7c66c.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=57&id=u46782b17&margin=%5Bobject%20Object%5D&name=image.png&originHeight=71&originWidth=486&originalType=binary&ratio=1&rotation=0&showTitle=false&size=10155&status=done&style=none&taskId=u42ff2652-9255-4e11-9e6c-50791defe44&title=&width=388.8)
2.创建范围分区表，指定分区表的表空间以及各分区的表空间
--创建表空间
CREATE TABLESPACE example1 RELATIVE LOCATION 'tablespace1/tablespace_1';
CREATE TABLESPACE example2 RELATIVE LOCATION 'tablespace2/tablespace_2';
CREATE TABLESPACE example3 RELATIVE LOCATION 'tablespace3/tablespace_3';
CREATE TABLESPACE example4 RELATIVE LOCATION 'tablespace4/tablespace_4';
--创建分区表
CREATE TABLE tp2
(
    WR_RETURNED_DATE_SK       INTEGER                       ,
    WR_ORDER_NUMBER           BIGINT                NOT NULL,
    WR_RETURN_QUANTITY        INTEGER                       ,
    WR_RETURN_AMT             DECIMAL(7,2)                  ,
    WR_NET_LOSS               DECIMAL(7,2)
)TABLESPACE example1
PARTITION BY RANGE(WR_RETURNED_DATE_SK)
(
        PARTITION P1 VALUES LESS THAN(2450815),
        PARTITION P2 VALUES LESS THAN(2451179),
        PARTITION P3 VALUES LESS THAN(2451544),
        PARTITION P4 VALUES LESS THAN(MAXVALUE) TABLESPACE example2
)ENABLE ROW MOVEMENT;
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700689914-ab6fca95-df48-4b07-9eac-809aa94847a9.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=119&id=u7913d7c5&margin=%5Bobject%20Object%5D&name=image.png&originHeight=149&originWidth=430&originalType=binary&ratio=1&rotation=0&showTitle=false&size=75776&status=done&style=none&taskId=u386f9d72-4691-4403-810e-e18d5e4c9d6&title=&width=344)
--以like方式创建一个分区表。
CREATE TABLE tp3 (LIKE tp2 INCLUDING PARTITION);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700692574-f934af4f-987c-4fc8-b520-d069dccb6205.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=110&id=u60e4b9d6&margin=%5Bobject%20Object%5D&name=image.png&originHeight=137&originWidth=419&originalType=binary&ratio=1&rotation=0&showTitle=false&size=75172&status=done&style=none&taskId=u69ca8a90-c937-4b8a-9a39-323c7b5067b&title=&width=335.2)
--修改分区P1的表空间为example2。
ALTER TABLE tp2 MOVE PARTITION P1 TABLESPACE example2;
--以2451550为分割点切分P4。
ALTER TABLE tp2 SPLIT PARTITION P4 AT (2451550) INTO
(
        PARTITION P5,
        PARTITION P6
); 
 ![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700706458-acfebe38-1145-4984-a170-8bf611d76bdb.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=128&id=uf5ade92b&margin=%5Bobject%20Object%5D&name=image.png&originHeight=160&originWidth=410&originalType=binary&ratio=1&rotation=0&showTitle=false&size=79829&status=done&style=none&taskId=uf17de61e-4d2c-402b-8866-acc0285cceb&title=&width=328)
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700722176-d97e1312-9470-43c6-8912-ac84561ca19c.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=86&id=u6fffa6ca&margin=%5Bobject%20Object%5D&name=image.png&originHeight=108&originWidth=384&originalType=binary&ratio=1&rotation=0&showTitle=false&size=62168&status=done&style=none&taskId=ud8bdb022-a98f-4f29-bd50-41dd2e4ef45&title=&width=307.2)
--将P2，P3合并为一个分区。
ALTER TABLE tp2 MERGE PARTITIONS P2, P3 INTO PARTITION P4;
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700764668-553d22c2-d1eb-4b26-a477-cf326e08527f.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=49&id=ub10e9e96&margin=%5Bobject%20Object%5D&name=image.png&originHeight=61&originWidth=357&originalType=binary&ratio=1&rotation=0&showTitle=false&size=38383&status=done&style=none&taskId=u405781b3-422e-4f57-835d-8fef5623255&title=&width=285.6)
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700773995-c4bd276b-cf2c-4ecd-8995-d90ce8ffacd0.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=87&id=ub1192773&margin=%5Bobject%20Object%5D&name=image.png&originHeight=109&originWidth=357&originalType=binary&ratio=1&rotation=0&showTitle=false&size=44451&status=done&style=none&taskId=u23df0211-f182-4b38-aef1-d327d91d2d5&title=&width=285.6)
--修改分区表迁移属性。
ALTER TABLE tp2 DISABLE ROW MOVEMENT;
3. START END语法创建、修改范围分区表
--创建表空间，后面的路径为空目录
CREATE TABLESPACE st1 LOCATION '/home/wzr0824/st1';
CREATE TABLESPACE st2 LOCATION '/home/wzr0824/st2';
CREATE TABLESPACE st3 LOCATION '/home/wzr0824/st3';
CREATE TABLESPACE st4 LOCATION '/home/wzr0824/st4';
--创建分区表
CREATE TABLE tp4(c1 INT, c2 INT)
PARTITION BY RANGE (c2) (
    PARTITION p1 START(1) END(1000) EVERY(200) TABLESPACE st2,
    PARTITION p2 END(2000),
    PARTITION p3 START(2000) END(2500) TABLESPACE st3,
    PARTITION p4 START(2500),
    PARTITION p5 START(3000) END(5000) EVERY(1000) TABLESPACE st4
)ENABLE ROW MOVEMENT;
--查看分区表信息
SELECT relname, boundaries, spcname FROM pg_partition p JOIN pg_tablespace t ON p.reltablespace=t.oid and p.parentid='tp4'::regclass ORDER BY 1;
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700790439-af101ecd-187d-407a-9120-a3deb94f4e66.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=103&id=u92c48ed2&margin=%5Bobject%20Object%5D&name=image.png&originHeight=129&originWidth=182&originalType=binary&ratio=1&rotation=0&showTitle=false&size=30070&status=done&style=none&taskId=u3899a7df-f779-4484-baa8-79294590166&title=&width=145.6)
--导入数据，查看分区数据量
INSERT INTO tp4 VALUES (GENERATE_SERIES(0, 4999), GENERATE_SERIES(0, 4999));
SELECT COUNT(*) FROM tp4 PARTITION FOR (0);
SELECT COUNT(*) FROM tp4 PARTITION (p3);
-- 增加分区: [5000, 5300), [5300, 5600), [5600, 5900), [5900, 6000)
ALTER TABLE tp4 ADD PARTITION p6 START(5000) END(6000) EVERY(300) TABLESPACE st4;
-- 增加MAXVALUE分区: p7
ALTER TABLE tp4 ADD PARTITION p7 END(MAXVALUE);
-- 重命名分区p7为p8
ALTER TABLE tp4 RENAME PARTITION p7 TO p8;
-- 删除分区p8
ALTER TABLE tp4 DROP PARTITION p8;
-- 重命名5950所在的分区为：p16
ALTER TABLE tp4 RENAME PARTITION FOR(5950) TO p16;
-- 分裂4500所在的分区[4000, 5000)
ALTER TABLE tp4 SPLIT PARTITION FOR(4500) INTO(PARTITION q1 START(4000) END(5000) EVERY(250) TABLESPACE st3);
-- 修改分区p2的表空间为st4
ALTER TABLE tp4 MOVE PARTITION p2 TABLESPACE st4;
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700828382-b282143a-de16-4b1c-9915-241513c2fc54.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=177&id=u69085060&margin=%5Bobject%20Object%5D&name=image.png&originHeight=221&originWidth=217&originalType=binary&ratio=1&rotation=0&showTitle=false&size=53950&status=done&style=none&taskId=u4429d206-6658-401c-add0-ebc6b561616&title=&width=173.6)
4.创建间隔分区表tp5，初始包含2个分区，分区键为DATE类型。
CREATE TABLE tp5
(prod_id NUMBER(6),
 time_id DATE,
 channel_id CHAR(1)
)
PARTITION BY RANGE (time_id)
INTERVAL('1 day')
( PARTITION p1 VALUES LESS THAN ('2019-02-01 00:00:00'),
  PARTITION p2 VALUES LESS THAN ('2019-02-02 00:00:00')
);
-- 数据插入分区p1
INSERT INTO tp5 VALUES(1, '2019-01-10 00:00:00', 'a');
-- 数据插入分区p2
INSERT INTO tp5 VALUES(1,'2019-02-01 00:00:00', 'a');
-- 插入数据没有匹配的分区，新创建一个分区，并将数据插入该分区
INSERT INTO tp5 VALUES(1, '2019-02-05 00:00:00', 'a');
-- 查看分区信息
SELECT t1.relname, partstrategy, boundaries FROM pg_partition t1, pg_class t2 WHERE t1.parentid = t2.oid AND t2.relname = 'tp5' AND t1.parttype = 'p';
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700841326-31d30061-5e3b-4f19-8778-730dd9154a99.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=85&id=ud1c855ba&margin=%5Bobject%20Object%5D&name=image.png&originHeight=106&originWidth=428&originalType=binary&ratio=1&rotation=0&showTitle=false&size=52008&status=done&style=none&taskId=u078e4fa4-011c-46f7-8991-9f80cffca41&title=&width=342.4)
5. 创建LIST分区表tp6，初始包含4个分区，分区键为INT类型。4个分区的范围分别为：2000，3000，4000，5000。
--创建表tp6
create table tp6 (col1 int, col2 int)
partition by list(col1)
(
partition p1 values (2000),
partition p2 values (3000),
partition p3 values (4000),
partition p4 values (5000)
);
-- 数据插入
INSERT INTO tp6 VALUES(2000, 2000);
-- 插入数据没有匹配到分区，报错处理
INSERT INTO tp6 VALUES(6000, 6000);
-- 添加分区
alter table tp6 add partition p5 values (6000);
-- 分区表和普通表交换数据
create table t1 (col1 int, col2 int);
select * from tp6 partition (p1);
alter table tp6 exchange partition (p1) with table t1;
select * from tp6 partition (p1);
select * from t1;
-- truncate分区
INSERT INTO tp6 VALUES(3000, 3000);
select * from tp6 partition (p2);
alter table tp6 truncate partition p2;
select * from tp6 partition (p2);
-- 删除分区
alter table tp6 drop partition p5;
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700901632-45798708-ce91-46f9-b4e2-c39222d3c919.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=81&id=u265d994a&margin=%5Bobject%20Object%5D&name=image.png&originHeight=101&originWidth=281&originalType=binary&ratio=1&rotation=0&showTitle=false&size=28712&status=done&style=none&taskId=u55cba824-9364-4dce-ab03-49bfb3f622c&title=&width=224.8)
6. 创建HASH分区表tp7，初始包含2个分区，分区键为INT类型。
--创建表tp7
create table tp7 (col1 int, col2 int)
partition by hash(col1)
(
partition p1,
partition p2
);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1662700901671-b1bf0115-f59a-4f1e-b266-04f6cbf43349.png#clientId=u24ec4e76-42f0-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=60&id=u94cb3d42&margin=%5Bobject%20Object%5D&name=image.png&originHeight=75&originWidth=241&originalType=binary&ratio=1&rotation=0&showTitle=false&size=19385&status=done&style=none&taskId=uebfdaaa0-ff1f-4751-89a8-412ecb14c25&title=&width=192.8)
-- 数据插入
INSERT INTO tp7 VALUES(1, 1),(2,2),(3,3),(4,4);
-- 查看数据
select * from tp7 partition (p1);
-- 分区表和普通表交换数据
alter table tp7 exchange partition (p1) with table t1;
select * from tp7 partition (p1);
select * from t1;
-- truncate分区
select * from tp7 partition (p2);
alter table tp7 truncate partition p2;
select * from tp7 partition (p2);
 

修改表分区，包括增删分区、切割分区、合成分区，以及修改分区属性等。
总结：
范围分区表可以进行切割分区；合并分区；增加分区；删除分区；重命名分区；分裂分区；修改分区表空间。
间隔分区表可以进行自动创建分区。
List分区表可以进行添加分区；与普通表交换数据；truncate分区；删除分区。
Hash分区表可以进行与普通表交换数据；truncate分区
