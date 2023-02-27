---
title: 'openGauss数据库将磁盘表转换为MOT'

date: '2022-04-06'

category: 'blog'
tags: ['openGauss数据库将磁盘表转换为MOT']

archives: '2022-04'

author: 'tracy'

summary: 'openGauss数据库将磁盘表转换为MOT'

img: '/zh/blogs/tracy/title/img20.png'

times: '11:37'
---

# openGauss 数据库将磁盘表转换为 MOT

一、将磁盘表转换为 MOT 方法

磁盘表直接转换为 MOT 尚不能实现，这意味着尚不存在将基于磁盘的表转换为 MOT 的 ALTER TABLE 语句。目前 MOT 表也不支持 rename，create as select 以及 insert select（普通表）的操作。将基于磁盘的表转换为 MOT 方法，可以使用 gs_dump 工具导出数据，再使用 gs_restore 工具导入数据的方法。

步骤如下： 1.暂停应用程序活动。 2.使用 gs_dump 工具将表数据转储到磁盘的物理文件中。请确保使用 data only。 3.重命名原始基于磁盘的表。 4.创建同名同模式的 MOT。 5.使用 gs_restore 将磁盘文件的数据加载/恢复到数据库表中。 6.浏览或手动验证所有原始数据是否正确导入到新的 MOT 中。 7.恢复应用程序活动。

二、操作示例：将表 enmo.customer_t1 转换为 MOT 表

1.确认 MOT 表支持表 customer_t1 所有列的数据类型

```
enmo=> \d
List of relations
Schema | Name | Type | Owner | Storage
--------+--------------+-------+-------+----------------------------------
enmo | all_data | table | enmo | {orientation=row,compression=no}
enmo | customer_t1 | table | enmo | {orientation=row,compression=no}
enmo | cux_setting | table | enmo | {orientation=row,compression=no}
enmo | data_studio1 | table | enmo | {orientation=row,compression=no}
enmo | table2 | table | enmo | {orientation=row,compression=no}
public | table1 | table | enmo | {orientation=row,compression=no}
(6 rows)

enmo=> \d+ customer_t1
Table "enmo.customer_t1"
Column | Type | Modifiers | Storage | Stats target | Description
-----------------+-----------------------+-----------+----------+--------------+-------------
c_customer_sk | integer | | plain | |
c_customer_name | character varying(32) | | extended | |
Has OIDs: no
Options: orientation=row, compression=no

enmo=>
```

2.暂停表 customer_t1 相关的应用程序操作后，使用 gs_dump 命令导出表数据（仅数据）:

```
$ gs_dump -U enmo -h 192.168.229.52 -p 15400 enmo -a --table customer_t1 -F c -f /home/omm/dump/customer_t1_data_only.bak
Password:
gs_dump[port='15400'][enmo][2021-03-28 10:11:42]: dump database enmo successfully
gs_dump[port='15400'][enmo][2021-03-28 10:11:42]: total time: 8732 ms
```

3.重命名原表 customer_t1 为 customer

```
enmo=> alter table customer_t1 rename to customer;
ALTER TABLE
```

4.创建与原表相同数据格式的 MOT 表 customer_t1

```
--首先给enmo用于赋予创建和访问MOT（DDL、DML、SELECT）权限：
enmo=> GRANT USAGE ON FOREIGN SERVER mot_server TO enmo;
GRANT
--创建外部表
enmo=> CREATE foreign TABLE customer_t1(c_customer_sk INTEGER, c_customer_name VARCHAR(32));
CREATE FOREIGN TABLE
Time: 9.408 ms
enmo=> \d+
List of relations
Schema | Name | Type | Owner | Size | Storage | Description
--------+--------------+---------------+-------+------------+----------------------------------+-------------
enmo | all_data | table | enmo | 8192 bytes | {orientation=row,compression=no} |
enmo | customer | table | enmo | 8192 bytes | {orientation=row,compression=no} |
enmo | customer_t1 | foreign table | enmo | 16 kB | |
enmo | cux_setting | table | enmo | 160 kB | {orientation=row,compression=no} |
enmo | data_studio1 | table | enmo | 8192 bytes | {orientation=row,compression=no} |
enmo | table2 | table | enmo | 8192 bytes | {orientation=row,compression=no} |
public | table1 | table | enmo | 8192 bytes | {orientation=row,compression=no} |
(7 rows)

enmo=> \d+ customer_t1
Foreign table "enmo.customer_t1"
Column | Type | Modifiers | FDW Options | Storage | Stats target | Description
-----------------+-----------------------+-----------+-------------+----------+--------------+-------------
c_customer_sk | integer | | | plain | |
c_customer_name | character varying(32) | | | extended | |
Server: mot_server
FDW permition: read/write
Has OIDs: no

enmo=> select * from customer_t1;
c_customer_sk | c_customer_name
---------------+-----------------
(0 rows)

Time: 0.782 ms
enmo=>
```

5.使用 gs_restore 将磁盘文件的数据加载/恢复到数据库表中

```
$ gs_restore -U enmo -h 192.168.229.52 -p 15400 -d enmo /home/omm/dump/customer_t1_data_only.bak
Password:
start restore operation ...
table customer_t1 complete data imported !
Finish reading 3 SQL statements!
end restore operation ...
restore operation successful
total time: 3697 ms
```

6.浏览或手动验证所有原始数据是否正确导入到新的 MOT 中

```
enmo=> select * from customer_t1;
c_customer_sk | c_customer_name
---------------+-----------------
0 | data 0
2 | data 2
1 | new Data
(3 rows)

Time: 0.587 ms
enmo=>
```
