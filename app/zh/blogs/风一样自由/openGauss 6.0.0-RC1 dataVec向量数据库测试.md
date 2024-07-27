---
title: 'openGauss 6.0.0-RC1 dataVec向量数据库测试'

date: '2024-05-27'

tags: ['openGauss技术文章征集', 'openGauss']

archives: '2024-05'
category: 'blog'
author: '风一样自由'

summary: 'openGauss 6.0.0-RC1 dataVec向量数据库测试'
---

# 一、datavec概述

 openGauss提供datavec Extension（版本为datavec-0.4.4）。datavec是一个基于openGauss的向量扩展，目前支持的向量功能有：精确和近似的最近邻搜索、L2距离&余弦距离&内积、向量索引、向量操作函数和操作符。作为openGauss的扩展，datavec 使用熟悉的SQL语法操作向量，简化了用户使用向量数据库的过程。

# 环境部署


## 环境信息

|IP | 主机名 |版本|端口|
|---|---|---|---|
|192.168.59.149 |yf4|6.0.0-RC1|15000|
|

### 部署方式1：

<br/>

1.编译安装openGauss。

2.将datavec源码拷贝到openGauss-server源码的contrib目录下。

3.进入datavec目录执行make install

4.创建扩展extension


### 部署方式2：(本文选取方式2部署)


1.om安装的openGauss。

2.拷贝插件所需文件到指定路径下：datavec.so：app/lib/postgresql/。datavec.control和datavec--0.4.4.sql路径：app/share/postgresql/extension。

```
ll /opt/openGauss/install/app/lib/postgresql/datavec.so

[omm@yf4 ~]$ ll /opt/openGauss/install/app/lib/postgresql/datavec.so
-rw------- 1 omm dbgroup 75664 Mar 30 21:13 /opt/openGauss/install/app/lib/postgresql/datavec.so
ll /opt/openGauss/install/app/share/postgresql/extension/datavec*

[omm@yf4 ~]$ ll /opt/openGauss/install/app/share/postgresql/extension/datavec*
-rw------- 1 omm dbgroup 9153 Mar 30 21:11 /opt/openGauss/install/app/share/postgresql/extension/datavec--0.4.4.sql
-rw------- 1 omm dbgroup  136 Mar 30 21:11 /opt/openGauss/install/app/share/postgresql/extension/datavec.control

```


3.创建扩展extension

```
create extension datavec;

openGauss=# create extension datavec;
CREATE EXTENSION
```


4.查看扩展datavec

```
select * from pg_extension where extname='datavec';

openGauss=# select * from pg_extension where extname='datavec';

 extname | extowner | extnamespace | extrelocatable | extversion | extconfig | extcondition

---------+----------+--------------+----------------+------------+-----------+--------------

 datavec |       10 |         2200 | t              | 0.4.4      |           |

(1 row)
```


# 三、dataVec向量数据库测试


## 1.创建一个有三维向量的表

```
CREATE TABLE items (id bigserial PRIMARY KEY, embedding vector(3));

openGauss=# CREATE TABLE items (id bigserial PRIMARY KEY, embedding vector(3));
NOTICE:  CREATE TABLE will create implicit sequence "items_id_seq" for serial column "items.id"
NOTICE:  CREATE TABLE / PRIMARY KEY will create implicit index "items_pkey" for table "items"
CREATE TABLE

```

## 2.插入向量数据

```

INSERT INTO items (embedding) VALUES ('[1,2,3]'), ('[4,5,6]'), ('[7,8,9]'), ('[10,11,12]'), ('[13,14,15]');

openGauss=# INSERT INTO items (embedding) VALUES ('[1,2,3]'), ('[4,5,6]'), ('[7,8,9]'), ('[10,11,12]'), ('[13,14,15]');
INSERT 0 5
```



## 3.更新向量数据

```
UPDATE items SET embedding = '[1,2,3]' WHERE id = 1;

openGauss=# UPDATE items SET embedding = '[1,2,3]' WHERE id = 1;
UPDATE 1
```


## 4.删除向量数据


```
DELETE FROM items WHERE id = 1;

openGauss=# DELETE FROM items WHERE id = 1;
DELETE 1
```


## 5.获取最近邻

```
SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 5;

openGauss=# SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 5;
 id | embedding----+------------
  2 | [4,5,6]
  3 | [7,8,9]
  4 | [10,11,12]
  5 | [13,14,15]
(4 rows)
```


## 6.获取距离

```
SELECT embedding <-> '[3,1,2]' AS distance FROM items;

openGauss=# SELECT embedding <-> '[3,1,2]' AS distance FROM items;
     distance

------------------
 5.74456264653803
 10.6770782520313
 15.7797338380595
 20.9284495364563
```


## 7.平均矢量


```
SELECT AVG(embedding) FROM items;

openGauss=# SELECT AVG(embedding) FROM items;
      avg

----------------
 [8.5,9.5,10.5]
(1 row)
```

# 四、限制

暂时仅支持Create extension命令方式加载插件。

暂时仅支持ivfflat索引。

只支持行存表。

索引WAL日志功能待完善，可能出现重启索引失效。


# 五、总结

    datavec是一款轻量级，低耦合，便于安装的向量数据库插件，作为为专有大模型的向量数据存储和检索的底座，支持向量数据的存储、 相似度计算，支持针对向量数据建立索引（IVFFLAT），加速查询且支持大多向量计算，是向量数据存储与计算不错的选择。

    

