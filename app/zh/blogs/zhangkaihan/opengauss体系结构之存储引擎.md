---
title: 'opengauss体系结构之存储引擎'
date: '2022-10-18'
tags: ['openGauss技术文章征集']
archives: '2022-10'
category: 'blog'
author: 'zhangkaihan'
summary: '存储引擎概述'
times: '16:20'
---

# 存储引擎概述

存储引擎顾名思义就是数据的存放方式，比如 mysql 有 myisam 和 innodb 存储引擎，他们都是行存，只是 myisam 不支持事务。另外存储引擎还有列模式、行模式、内存数据库等等，openguass 的存储引擎关系可以用以下图来表示：

![](https://fileserver.developer.huaweicloud.com/FileServer/getFile/cmtybbs/4b4/9b2/97b/e97de91d5b4b49b297bcdc90b5809ed2.20221104132456.28043051289216648016857533562900:20221105020914:2400:3658AA61E7E49F7BBBC9313FA18C722E424A21B0FEDCF69FD9CA0C90DC8CF6C5.png)

下面分别介绍以下这几种存储引擎的区别：

## 磁盘存储引擎

顾名思义是数据按照一定格式存放在物理磁盘的数据块中，opengauss 的最小存储单位是 page 页，类似于 Oracle 的最小存储单位 block，写入磁盘则把 page 页里的内容写入到物理磁盘 block 中。

## 内存存储引擎

与磁盘存储引擎相反，数据是存放到内存中的，内存中的数据没有办法想磁盘一样进行持久化，但是内存数据库节省了物理磁盘到内存的 IO 处理，效率会更高。为了满足数据的持久化不至于重启以后数据就丢失了，目前很多数据库也会把内存里的数据按照一定条件进行落盘进行持久化处理，每次重新启动以后把物理文件内容重新加载到内存中。类似于 opengauss 的 MOT。

## 行存储引擎

属于磁盘存储引擎，数据按照行的格式存储在物理磁盘中，行存储引擎适合 OLTP 交易类系统，opengauss 默认的也是行存储引擎。

## 列存储引擎

属于磁盘存储引擎，数据按照列的格式存储在物理磁盘中，行存储引擎适合 OLAP 交易类系统。

## 行存列存区别

opengauss 既支持行存也支持列存，也就是目前所说的 HTAP 交易分析类系统，据我所知目前有部分厂商虽然都支持行存和列寸，但是需要额外的付费。用两张图展示一下一个表在行存和列存模式在物理磁盘上的存储形式：

| id  | name | age |
| --- | ---- | --- |
| 1   | 张三 | 32  |
| 2   | 李四 | 22  |
| 4   | 王五 | 42  |
| 5   | 赵六 | 52  |

行存磁盘存储格式如下：
![](https://fileserver.developer.huaweicloud.com/FileServer/getFile/cmtybbs/4b4/9b2/97b/e97de91d5b4b49b297bcdc90b5809ed2.20221104132529.36868928272142565720973439885414:20221105020914:2400:97CD7280C51329F4F02401C741C986E7923B221FADDCFA51D312DDE949C43E26.png)

列存磁盘存储格式如下：
![](https://fileserver.developer.huaweicloud.com/FileServer/getFile/cmtybbs/4b4/9b2/97b/e97de91d5b4b49b297bcdc90b5809ed2.20221104132543.83988437154148413332454435784234:20221105020914:2400:83D05CF7191B84F3D0AD356047A7A7543184FF5F77884D7F1D04A02842B6DDBD.png)

可见列寸更适合统计分析类交易，比如 max、min 等等，另外更便于压缩存放。

## Ustroe 存储引擎

Ustore 是原地更新(in-place update)设计，支持 MVCC(Multi- Version Concurrency Control，多版本并发控制)，类似于 Oracle 的设计，最新的数据（已提交）与前版本数据（undo）分开存储，支持闪回查询等操作。但是现在这个存储引擎不是 opengauss 的默认存储引擎，估计后续版本稳定以后会默认此存储引擎。
![](https://fileserver.developer.huaweicloud.com/FileServer/getFile/cmtybbs/4b4/9b2/97b/e97de91d5b4b49b297bcdc90b5809ed2.20221104132608.06559355574627220447118702457397:20221105020914:2400:3F2EA25C8F08CE0615A997B4D70E86B8CFC776552124A19C6A522B30A4313618.png)

## Astroe 存储引擎

采用追加更新模式，及同一个 page 页中既存在前映像也存在当前值，只是前映像会被标记为删除，当前是 opengauss 的默认存储引擎，Astroe 存储引擎由于同一个块中包含太多的前映像，如果频繁的更新操作会导致大量的磁盘“垃圾”，因为在执行查询操作的时候即使标记了删除也会扫描，所以大大的降低性能，建议定期执行 VACUUM 或者 VACUUM full 进行清理。
![](https://fileserver.developer.huaweicloud.com/FileServer/getFile/cmtybbs/4b4/9b2/97b/e97de91d5b4b49b297bcdc90b5809ed2.20221104132617.65399143963934781683477916064580:20221105020914:2400:4896D903DE1A19E1EA504D3E1279DCF78EF8F0EA61AEADC415983E5584DF5323.png)

# 和存储引擎相关的参数

## 概述

正常情况下在执行一条 sql 查询的时候数据库从物理磁盘读取整个数据块到内存，然后在内存中进行过滤返回满足条件的行，当然在某些情况下可以把算子下推，来减少加载到内存的数据块数量，因此就需要在内存中开辟一块区域来存放从磁盘读取出来的块，这个类似于 oracle 的块高速缓冲区 mysql 的 innodb_buffer_pool 等，几乎所有的 RDBMS 数据库在内存中都有一块这样的区域。

## 磁盘存储引擎

磁盘存储引擎的参数主要存放在 postgresql.conf 配置文件中，默认路径在 DATADIR 中，主要通过两个参数控制 buffer 的大小，主要有 shared_buffers 及 cstore_buffers 两个参数，shared_buffers 是行存储引擎使用的内存，cstore_buffers 主要控制列存储引擎使用的内存，如果是 OLTP 类系统可以把 cstore_buffers 调小，如果是 OLAP 类系统可以把 cstor_buffers 调大避免浪费内存，如果是 HTAP 类系统则都可以调大。

## MOT 存储引擎

MOT 是通过内存存储引擎管理的内存表，支持事务的 ACID 特性，由于内存是易丢失的，所以如果想保证数据的持久性，需要把 MOT 的数据同步到磁盘中，MOT 是通过 WAL 重做日志和 MOT 检查点实现了数据的持久性。
MOT 的参数不在 postgresql.conf 中进行定义，它的参数主要在 mot.conf 中，这里不在详细转述，请参考官方文档。也可以参考我之前些的一篇关于 mot 测试的笔记《[MogDB 学习笔记-从 9 开始(存储引擎和闪回)](https://www.modb.pro/db/467296)》

# 创建基于不同存储引擎的表

## 创建基于 Astore 的行存表

在 Mogdb 中默认创建的 Astore 的表，通过设置 enable_default_ustore_table 参数为 on 可以修改为默认创建 Ustore 的表，当然在创建表的时候可以指定 storage_parameter 参数选择存储引擎。

```sql
CREATE TABLE astore_table (
id character varying(2) NOT NULL,
name character varying(50),
saler numeric(10,2),
dept_no character varying(2)
)
WITH (STORAGE_TYPE=ASTORE);
```

## 创建基于 Ustore 的行存表

```sql
CREATE TABLE astore_table (
id character varying(2) NOT NULL,
name character varying(50),
saler numeric(10,2),
dept_no character varying(2)
)
WITH (STORAGE_TYPE=USTORE);
```

## 创建列存表

```sql
CREATE TABLE column_table (
id character varying(2) NOT NULL,
name character varying(50),
saler numeric(10,2),
dept_no character varying(2)
)
WITH (ORIENTATION = COLUMN);
```

## 创建 MOT 内存表

```sql
create FOREIGN TABLE mot_table (
id character varying(2) NOT NULL,
name character varying(50),
saler numeric(10,2),
dept_no character varying(2)
);
```
