**+++**
**title="openGauss社区入门(opengauss-行存表与列存表)"**
**date="2022-08-26"**
**tags=["openGauss社区开发入门"]**
**archives=“2022-08”**
**author=“wangrururu”**
**summary="openGauss社区开发入门"**
**img="/zh/post/wzr/title/title.jpg"**
**times="21:15"**
**+++**
1.行式存储和列式存储的区别：
（1）行式存储倾向于结构固定，列式存储倾向于结构弱化。
（2）行式存储一行数据仅需要一个主键，列式存储一行数据需要多份主键。
（3）行式存储的是业务数据，而列式存储除了业务数据之外，还需要存储列名。
（4）行式存储更像是一个Java Bean，所有的字段都提前定义好，且不能改变；列式存储更像是一个Map，不提前定义，随意往里面添加key/value。
2.列存表
（1）列存表支持的数据类型：

| 类别 | 类型 | 长度 |
| --- | --- | --- |
| Numeric Types | smallint | 2 |
|  | integer | 4 |
|  | bigint | 8 |
|  | decimal | -1 |
|  | numeric | -1 |
|  | real | 4 |
|  | double precision | 8 |
|  | smallserial | 2 |
|  | serial | 4 |
|  | bigserial | 8 |
|  | largeserial | -1 |
| Monetary Types | money | 8 |
| Character Types | character varying(n), varchar(n) | -1 |
|  | character(n), char(n) | n |
|  | character、char | 1 |
|  | text | -1 |
|  | nvarchar | -1 |
|  | nvarchar2 | -1 |
| Date/Time Types | timestamp with time zone | 8 |
|  | timestamp without time zone | 8 |
|  | date | 4 |
|  | time without time zone | 8 |
|  | time with time zone | 12 |
|  | interval | 16 |
| big object | clob | -1 |

（2）列存表的特性
•列存表不支持数组。
•列存表不支持生成列。
•列存表不支持创建全局临时表。
•创建列存表的数量建议不超过1000个。
•列存表的表级约束只支持PARTIAL CLUSTER KEY、UNIQUE、PRIAMRY KEY，不支持外键等表级约束。
•列存表的字段约束只支持NULL、NOT NULL和DEFAULT常量值、UNIQUE和PRIMARY KEY。
•列存表支持delta表，受参数enable_delta_store控制是否开启，受参数deltarow_threshold控制进入delta表的阀值。
（3）创建一个列存表
CREATE TABLE test1
(
W_WAREHOUSE_SK            INTEGER               NOT NULL,
W_WAREHOUSE_ID            CHAR(16)              NOT NULL,
W_WAREHOUSE_NAME          VARCHAR(20)                   ,
W_WAREHOUSE_SQ_FT         INTEGER                       ,
W_GMT_OFFSET              DECIMAL(5,2)
) WITH (ORIENTATION = COLUMN);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661518898335-3be220a1-69fb-4292-be7c-a115e34356f2.png#clientId=u743e9b88-5e6a-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=100&id=u28e8b84e&margin=%5Bobject%20Object%5D&name=image.png&originHeight=125&originWidth=513&originalType=binary&ratio=1&rotation=0&showTitle=false&size=64447&status=done&style=none&taskId=u8e8f7340-d58c-4894-9158-1791b3d8273&title=&width=410.4)
（4）创建局部聚簇存储的列存表。
CREATE TABLE test2
(
    W_WAREHOUSE_SK            INTEGER               NOT NULL,
    W_WAREHOUSE_ID            CHAR(16)              NOT NULL,
    W_WAREHOUSE_NAME          VARCHAR(20)                   ,
    W_GMT_OFFSET              DECIMAL(5,2),
    PARTIAL CLUSTER KEY(W_WAREHOUSE_SK, W_WAREHOUSE_ID)
) WITH (ORIENTATION = COLUMN);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661518908685-4ebee929-6238-4c75-a0eb-f148bf4505e8.png#clientId=u743e9b88-5e6a-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=98&id=u76be3295&margin=%5Bobject%20Object%5D&name=image.png&originHeight=122&originWidth=507&originalType=binary&ratio=1&rotation=0&showTitle=false&size=74437&status=done&style=none&taskId=ubecdf8a9-ed98-4d88-b92f-5937002847a&title=&width=405.6)
（5） 创建一个带压缩的列存表。
CREATE TABLE test3
(
    W_WAREHOUSE_SK            INTEGER               NOT NULL,
    W_WAREHOUSE_ID            CHAR(16)              NOT NULL,
    W_WAREHOUSE_NAME          VARCHAR(20)                   ,
    W_GMT_OFFSET              DECIMAL(5,2)
) WITH (ORIENTATION = COLUMN, COMPRESSION=HIGH);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661518921111-71682e07-237b-4372-bd16-fffde14ccab1.png#clientId=u743e9b88-5e6a-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=90&id=u5258b083&margin=%5Bobject%20Object%5D&name=image.png&originHeight=112&originWidth=554&originalType=binary&ratio=1&rotation=0&showTitle=false&size=66732&status=done&style=none&taskId=ud59e5c00-ad9b-46c3-8cf7-a07cc588b12&title=&width=443.2)
3.行存表
（1）创建一个行存表
CREATE TABLE test4
(
    W_WAREHOUSE_SK            INTEGER               NOT NULL,
    W_WAREHOUSE_ID            CHAR(16)              NOT NULL,
    W_WAREHOUSE_NAME          VARCHAR(20)                   ,
    W_GMT_OFFSET              DECIMAL(5,2)
);
（2）创建表，并指定W_STATE字段的缺省值为GA。
CREATE TABLE test5
(
    W_WAREHOUSE_SK            INTEGER               NOT NULL,
    W_WAREHOUSE_ID            CHAR(16)              NOT NULL,
    W_WAREHOUSE_NAME          VARCHAR(20)                   ,
    W_STATE                   CHAR(2)           DEFAULT 'GA',
    W_GMT_OFFSET              DECIMAL(5,2)
);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661518934802-145aa5b0-d075-4de6-a91a-e951ce8a4b73.png#clientId=u743e9b88-5e6a-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=106&id=uaaa13f31&margin=%5Bobject%20Object%5D&name=image.png&originHeight=133&originWidth=554&originalType=binary&ratio=1&rotation=0&showTitle=false&size=69257&status=done&style=none&taskId=u50bd89e0-f8ac-41ad-bf87-e8f1c399768&title=&width=443.2)
（3）创建表，并在事务结束时检查W_WAREHOUSE_NAME字段是否有重复。
CREATE TABLE test6
(
    W_WAREHOUSE_SK            INTEGER                NOT NULL,
    W_WAREHOUSE_ID            CHAR(16)               NOT NULL,
    W_WAREHOUSE_NAME          VARCHAR(20)   UNIQUE DEFERRABLE,
    W_WAREHOUSE_SQ_FT         INTEGER                        ,
    W_GMT_OFFSET              DECIMAL(5,2) 
);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661518945990-1646d8f8-3d1c-41e9-ba4c-bde07955e429.png#clientId=u743e9b88-5e6a-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=85&id=ue79da1ab&margin=%5Bobject%20Object%5D&name=image.png&originHeight=106&originWidth=466&originalType=binary&ratio=1&rotation=0&showTitle=false&size=51194&status=done&style=none&taskId=u2e6c541d-8c2a-4629-a0d0-c3cfc72a887&title=&width=372.8)
（4）创建一个带有70%填充因子的表
CREATE TABLE test7
(
    W_WAREHOUSE_SK            INTEGER                NOT NULL,
    W_WAREHOUSE_ID            CHAR(16)               NOT NULL,
    W_WAREHOUSE_NAME          VARCHAR(20)                    ,
    W_WAREHOUSE_SQ_FT         INTEGER                        ,
    W_GMT_OFFSET              DECIMAL(5,2),
    UNIQUE(W_WAREHOUSE_NAME) WITH(fillfactor=70)
);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661518956618-6ab138e9-0d76-4e5e-8fcc-9033e8d1c7c8.png#clientId=u743e9b88-5e6a-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=85&id=u746c5837&margin=%5Bobject%20Object%5D&name=image.png&originHeight=106&originWidth=514&originalType=binary&ratio=1&rotation=0&showTitle=false&size=51127&status=done&style=none&taskId=u24d96820-985d-43b6-b9d8-5ef323163d9&title=&width=411.2)
CREATE TABLE test8
(
    W_WAREHOUSE_SK            INTEGER                NOT NULL,
    W_WAREHOUSE_ID            CHAR(16)               NOT NULL,
    W_WAREHOUSE_NAME          VARCHAR(20)              UNIQUE,
    W_WAREHOUSE_SQ_FT         INTEGER                        ,
    W_GMT_OFFSET              DECIMAL(5,2)
) WITH(fillfactor=70);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661518966782-0fa0830e-71e3-4991-be34-131a9f0b407b.png#clientId=u743e9b88-5e6a-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=92&id=ud23cb1c4&margin=%5Bobject%20Object%5D&name=image.png&originHeight=115&originWidth=490&originalType=binary&ratio=1&rotation=0&showTitle=false&size=57819&status=done&style=none&taskId=ue723a32a-0442-4d0b-842b-2daace51f53&title=&width=392)
（5）创建表，并指定该表数据不写入预写日志
CREATE UNLOGGED TABLE test9
(
    W_WAREHOUSE_SK            INTEGER               NOT NULL,
    W_WAREHOUSE_ID            CHAR(16)              NOT NULL,
    W_WAREHOUSE_NAME          VARCHAR(20)                   ,
    W_GMT_OFFSET              DECIMAL(5,2)
);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661518984653-9ad83082-e5c6-425e-8c56-02a0d4c84dfc.png#clientId=u743e9b88-5e6a-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=92&id=ud8c796b0&margin=%5Bobject%20Object%5D&name=image.png&originHeight=115&originWidth=554&originalType=binary&ratio=1&rotation=0&showTitle=false&size=66341&status=done&style=none&taskId=u1c730ccb-8204-4f87-adab-6e646caf8dd&title=&width=443.2)
（6）创建临时表
CREATE TEMPORARY TABLE test10
(
    W_WAREHOUSE_SK            INTEGER               NOT NULL,
    W_WAREHOUSE_ID            CHAR(16)              NOT NULL,
    W_WAREHOUSE_NAME          VARCHAR(20)                   ,
    W_GMT_OFFSET              DECIMAL(5,2)
);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661518995881-7ba6164b-d0a2-4a1c-9eda-6260d04d7dd4.png#clientId=u743e9b88-5e6a-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=96&id=ud10793d3&margin=%5Bobject%20Object%5D&name=image.png&originHeight=120&originWidth=554&originalType=binary&ratio=1&rotation=0&showTitle=false&size=75111&status=done&style=none&taskId=u2760ff8e-9ef2-43f9-9011-3c7a07c1448&title=&width=443.2)
（7）创建本地临时表，并指定提交事务时删除该临时表数据
CREATE TEMPORARY TABLE test11
(
    W_WAREHOUSE_SK            INTEGER               NOT NULL,
    W_WAREHOUSE_ID            CHAR(16)              NOT NULL,
    W_WAREHOUSE_NAME          VARCHAR(20)                   ,
    W_GMT_OFFSET              DECIMAL(5,2)
) ON COMMIT DELETE ROWS;
（8）创建全局临时表，并指定会话结束时删除该临时表数据
CREATE GLOBAL TEMPORARY TABLE test12
(
    ID                        INTEGER               NOT NULL,
    NAME                      CHAR(16)              NOT NULL,
    ADDRESS                   VARCHAR(50)                   
) ON COMMIT PRESERVE ROWS;
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661519010652-ac7c8047-6cee-466c-acad-57c27b00940c.png#clientId=u743e9b88-5e6a-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=90&id=u5109164f&margin=%5Bobject%20Object%5D&name=image.png&originHeight=113&originWidth=554&originalType=binary&ratio=1&rotation=0&showTitle=false&size=63390&status=done&style=none&taskId=u64492ade-2c96-4012-a9d9-e2b49be9848&title=&width=443.2)
（9）创建表时，不希望因为表已存在而报错
CREATE TABLE IF NOT EXISTS test13
(
    W_WAREHOUSE_SK            INTEGER               NOT NULL,
    W_WAREHOUSE_ID            CHAR(16)              NOT NULL,
    W_WAREHOUSE_NAME          VARCHAR(20)                   ,
    W_GMT_OFFSET              DECIMAL(5,2)
);
（10）创建普通表空间
CREATE TABLESPACE DS_TABLESPACE1 RELATIVE LOCATION 'tablespace/tablespace_1';
（11）创建表时，指定表空间
CREATE TABLE test14
(
    W_WAREHOUSE_SK            INTEGER               NOT NULL,
    W_WAREHOUSE_ID            CHAR(16)              NOT NULL,
    W_WAREHOUSE_NAME          VARCHAR(20)                   ,
    W_GMT_OFFSET              DECIMAL(5,2)
) TABLESPACE DS_TABLESPACE1;
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661519039606-a8df8d5f-216f-4644-b01b-5121c79a5ec5.png#clientId=u743e9b88-5e6a-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=122&id=ud2149e44&margin=%5Bobject%20Object%5D&name=image.png&originHeight=153&originWidth=554&originalType=binary&ratio=1&rotation=0&showTitle=false&size=87174&status=done&style=none&taskId=ud52a0005-0219-4b84-bc3f-9ca4cd7f0e7&title=&width=443.2)
（12）创建表时，单独指定W_WAREHOUSE_NAME的索引表空间
CREATE TABLE test15
(
    W_WAREHOUSE_SK            INTEGER               NOT NULL,
    W_WAREHOUSE_ID            CHAR(16)              NOT NULL,
    W_WAREHOUSE_NAME        VARCHAR(20)  UNIQUE USING INDEX TABLESPACE DS_TABLESPACE1,
    W_GMT_OFFSET              DECIMAL(5,2)
);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661519048330-aaaacebb-f60e-42f0-82fe-5c65c09366fc.png#clientId=u743e9b88-5e6a-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=68&id=ufe700790&margin=%5Bobject%20Object%5D&name=image.png&originHeight=85&originWidth=479&originalType=binary&ratio=1&rotation=0&showTitle=false&size=39085&status=done&style=none&taskId=ud5977774-9979-4988-a13e-13d9cffb0f4&title=&width=383.2)
（13）创建一个有主键约束的表
CREATE TABLE test16
(
    W_WAREHOUSE_SK            INTEGER            PRIMARY KEY,
    W_WAREHOUSE_ID            CHAR(16)              NOT NULL,
    W_WAREHOUSE_NAME          VARCHAR(20)                   ,
    W_GMT_OFFSET              DECIMAL(5,2)
);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661519059383-3abf4ae2-08fb-4387-b78b-119aca96d583.png#clientId=u743e9b88-5e6a-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=83&id=u210de4a1&margin=%5Bobject%20Object%5D&name=image.png&originHeight=104&originWidth=416&originalType=binary&ratio=1&rotation=0&showTitle=false&size=45413&status=done&style=none&taskId=ud3daa046-5474-459f-9d4d-4415bbc6cfe&title=&width=332.8)
(14) 创建一个有复合主键约束的表
CREATE TABLE test17
(
    W_WAREHOUSE_SK            INTEGER               NOT NULL,
    W_WAREHOUSE_ID            CHAR(16)              NOT NULL,
    W_WAREHOUSE_NAME          VARCHAR(20)                   ,
    CONSTRAINT W_CSTR_KEY2 PRIMARY KEY(W_WAREHOUSE_SK,W_WAREHOUSE_ID)
);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661519068712-cfca0144-171c-4dd7-96f4-a0469386a831.png#clientId=u743e9b88-5e6a-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=99&id=uf589cf2c&margin=%5Bobject%20Object%5D&name=image.png&originHeight=124&originWidth=554&originalType=binary&ratio=1&rotation=0&showTitle=false&size=71994&status=done&style=none&taskId=u46facacf-96f6-456c-bc29-d654d054f6d&title=&width=443.2)
(15) 定义一个检查列约束
CREATE TABLE test18
(
    W_WAREHOUSE_SK        INTEGER       PRIMARY KEY CHECK (W_WAREHOUSE_SK > 0),
    W_WAREHOUSE_ID       CHAR(16)              NOT NULL,
    W_WAREHOUSE_NAME    VARCHAR(20)    CHECK (W_WAREHOUSE_NAME IS NOT NULL),
    W_GMT_OFFSET              DECIMAL(5,2)
);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661519080200-21a1f915-8e29-4a02-a206-69976fe06913.png#clientId=u743e9b88-5e6a-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=117&id=u7fcb107f&margin=%5Bobject%20Object%5D&name=image.png&originHeight=146&originWidth=554&originalType=binary&ratio=1&rotation=0&showTitle=false&size=80452&status=done&style=none&taskId=u45180761-22c0-4bc5-abe9-8b3cc5e23a1&title=&width=443.2)
(16) 创建一个有外键约束的表
CREATE TABLE tt
(
    W_CITY            VARCHAR(60)                PRIMARY KEY,
    W_ADDRESS       TEXT                     
);
CREATE TABLE test19
(
    W_WAREHOUSE_SK            INTEGER               NOT NULL,
    W_WAREHOUSE_ID            CHAR(16)              NOT NULL,
    W_CITY                    VARCHAR(60)                   ,
    FOREIGN KEY(W_CITY) REFERENCES tt (W_CITY)
);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661519092627-0efa89fe-8204-4324-ae3e-b42839914190.png#clientId=u743e9b88-5e6a-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=115&id=u675c96c7&margin=%5Bobject%20Object%5D&name=image.png&originHeight=144&originWidth=554&originalType=binary&ratio=1&rotation=0&showTitle=false&size=86683&status=done&style=none&taskId=u7b14ff45-96fd-4463-bbe4-5c47469836e&title=&width=443.2)
 
