---
title: 'openGauss建立用户及导入sql文本'

date: '2021-08-07'

category: 'blog'
tags: ['openGauss建立用户及导入sql文本']

archives: '2021-08'

author: 'Walrus'

summary: 'openGauss建立用户及导入sql文本'

img: '/zh/blogs/July/title/img2.png'

times: '12:30'
---

# openGauss 建立用户及导入 sql 文本<a name="ZH-CN_TOPIC_0000001173357385"></a>

## 建立用户同时赋予用户创建 database 权限：<a name="section163704101727"></a>

```
create user deity with createdb identified by 'Deityle---';
[omm@node1 tmp]$ gsql -p 15400 -d postgres -r
gsql ((openGauss 2.0.1 build d97c0e8a) compiled at 2021-06-02 19:37:17 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.
postgres=# select * from pg_user;
 usename | usesysid | usecreatedb | usesuper | usecatupd | userepl |  passwd  | valbegin | valuntil |   respool    | parent | spacelimit | useconfig | nodegroup | tempspacelimit | spillspacelimit | usemonitora
dmin | useoperatoradmin | usepolicyadmin
---------+----------+-------------+----------+-----------+---------+----------+----------+----------+--------------+--------+------------+-----------+-----------+----------------+-----------------+------------
-----+------------------+----------------
 omm     |       10 | t           | t        | t         | t       | ******** |          |          | default_pool |      0 |            |           |           |                |                 | t
     | t                | t
(1 row)


postgres=# create user deity with createdb identified by 'Deity----';
CREATE ROLE
postgres=# select * from pg_user;
 usename | usesysid | usecreatedb | usesuper | usecatupd | userepl |  passwd  | valbegin | valuntil |   respool    | parent | spacelimit | useconfig | nodegroup | tempspacelimit | spillspacelimit | usemonitora
dmin | useoperatoradmin | usepolicyadmin
---------+----------+-------------+----------+-----------+---------+----------+----------+----------+--------------+--------+------------+-----------+-----------+----------------+-----------------+------------
-----+------------------+----------------
 omm     |       10 | t           | t        | t         | t       | ******** |          |          | default_pool |      0 |            |           |           |                |                 | t
     | t                | t
 deity   |    24941 | t           | f        | f         | f       | ******** |          |          | default_pool |      0 |            |           |           |                |                 | f
     | f                | f
(2 rows)
```

## 使用新建用户创建数据库及 schema：<a name="section610214272218"></a>

```
create database chnbs encoding 'UTF8';
create schema jack;

create schema salene;

[omm@node1 tmp]$ gsql -p 15400 -d postgres -U deity -r
Password for user deity:
gsql ((openGauss 2.0.1 build d97c0e8a) compiled at 2021-06-02 19:37:17 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.


postgres=> \dn+
                 List of schemas
 Name  | Owner | Access privileges | Description
-------+-------+-------------------+-------------
 deity | deity |                   |
(1 row)


postgres=> \l
                         List of databases
   Name    | Owner | Encoding | Collate | Ctype | Access privileges
-----------+-------+----------+---------+-------+-------------------
 mydb      |       | GBK      | C       | C     |
 postgres  |       | UTF8     | C       | C     |
 template0 |       | UTF8     | C       | C     | =c/omm           +
           |       |          |         |       | omm=CTc/omm
 template1 |       | UTF8     | C       | C     | =c/omm           +
           |       |          |         |       | omm=CTc/omm
(4 rows)


postgres=> create database chnbs encoding 'UTF8';
CREATE DATABASE
postgres=> \l
                         List of databases
   Name    | Owner | Encoding | Collate | Ctype | Access privileges
-----------+-------+----------+---------+-------+-------------------
 chnbs     | deity | UTF8     | C       | C     |
 mydb      |       | GBK      | C       | C     |
 postgres  |       | UTF8     | C       | C     |
 template0 |       | UTF8     | C       | C     | =c/omm           +
           |       |          |         |       | omm=CTc/omm
 template1 |       | UTF8     | C       | C     | =c/omm           +
           |       |          |         |       | omm=CTc/omm
(5 rows)


postgres=> \c chnbs
Password for user deity:
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "chnbs" as user "deity".
chnbs=> \dn
List of schemas
 Name | Owner
------+-------
(0 rows)
chnbs=> create schema jack;
CREATE SCHEMA
chnbs=> \dn
List of schemas
 Name | Owner
------+-------
 jack | deity
(1 row)


chnbs=> \dn+
                List of schemas
 Name | Owner | Access privileges | Description
------+-------+-------------------+-------------
 jack | deity |                   |
(1 row)


chnbs=> create schema salene;
CREATE SCHEMA
chnbs=> \dn+
                 List of schemas
  Name  | Owner | Access privileges | Description
--------+-------+-------------------+-------------
 jack   | deity |                   |
 salene | deity |                   |
(2 rows)
```

## gsql 下执行 SQL 文件，导入表及数据<a name="section8702134320317"></a>

set search_path=jack; \#\#设置当前 schema

\\i home/omm/mydb.sql \#\#gsql 下使用\\i 导入 sql 文本

一般导入前需要对 sql 文本做响应的修改，其他数据库导出的文本，schema、用户名称都需要替换。

```
chnbs=> show search_path;
  search_path
----------------
 "$user",public
(1 row)

chnbs=> set search_path=jack;
SET
chnbs=> show search_path;
 search_path
-------------
 jack
(1 row)
chnbs=> \i home/omm/mydb.sql
SET
SET
SET
SET
SET
SET
SET
CREATE PROCEDURE
ALTER FUNCTION
SET
SET
CREATE TABLE
ALTER TABLE
......
......
......


COMMENT
COMMENT
 setval
--------
      1
(1 row)




ALTER TABLE
ALTER TABLE
ALTER TABLE
ALTER TABLE
ALTER TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
REVOKE
REVOKE
GRANT
GRANT


chnbs=> \dn
List of schemas
  Name  | Owner
--------+-------
 jack   | deity
 salene | deity
(2 rows)


chnbs=> \d
                                       List of relations
 Schema |              Name              |   Type   | Owner |             Storage
--------+--------------------------------+----------+-------+----------------------------------
 jack   | bank_balance_loan              | table    | deity | {orientation=row,compression=no}
 jack   | bi_authentication              | table    | deity | {orientation=row,compression=no}
 jack   | bi_bank_product                | table    | deity | {orientation=row,compression=no}
 jack   | bi_bank_rate                   | table    | deity | {orientation=row,compression=no}
 jack   | bi_compatible                  | table    | deity | {orientation=row,compression=no}
 jack   | bi_credit_feedback             | table    | deity | {orientation=row,compression=no}
 jack   | bi_customer                    | table    | deity | {orientation=row,compression=no}
 jack   | bi_disburse_detail             | table    | deity | {orientation=row,compression=no}
 jack   | bi_finance_transaction         | table    | deity | {orientation=row,compression=no}
 jack   | bi_flow                        | table    | deity | {orientation=row,compression=no}
 jack   | bi_flow_define                 | table    | deity | {orientation=row,compression=no}
 jack   | bi_flow_node                   | table    | deity | {orientation=row,compression=no}
 jack   | bi_monitor_history_record      | table    | deity | {orientation=row,compression=no}
 jack   | bi_monitor_record              | table    | deity | {orientation=row,compression=no}
 jack   | bi_mutual_excls                | table    | deity | {orientation=row,compression=no}
 jack   | bi_order                       | table    | deity | {orientation=row,compression=no}
 jack   | bi_order_audit                 | table    | deity | {orientation=row,compression=no}
 jack   | bi_order_collateral            | table    | deity | {orientation=row,compression=no}
 jack   | bi_order_collateral_owner      | table    | deity | {orientation=row,compression=no}
 jack   | bi_order_push                  | table    | deity | {orientation=row,compression=no}
 jack   | bi_order_veritify              | table    | deity | {orientation=row,compression=no}
 jack   | bi_orglist                     | table    | deity | {orientation=row,compression=no}
 jack   | bi_pay_repay                   | table    | deity | {orientation=row,compression=no}
 jack   | bi_pre_credit                  | table    | deity | {orientation=row,compression=no}
 jack   | bi_reason_rule                 | table    | deity | {orientation=row,compression=no}
 jack   | bi_reconl_record               | table    | deity | {orientation=row,compression=no}
 jack   | bi_schedule_job                | table    | deity | {orientation=row,compression=no}
 jack   | bi_schedule_record             | table    | deity | {orientation=row,compression=no}
 jack   | bi_tax_organization            | table    | deity | {orientation=row,compression=no}
 jack   | bi_transaction_flow            | table    | deity | {orientation=row,compression=no}
 jack   | bi_transaction_node_detail     | table    | deity | {orientation=row,compression=no}
 jack   | bi_warm_result                 | table    | deity | {orientation=row,compression=no}
 jack   | bi_whitelist                   | table    | deity | {orientation=row,compression=no}
 jack   | credit_parse_record            | table    | deity | {orientation=row,compression=no}
 jack   | data_anti_fraud                | table    | deity | {orientation=row,compression=no}
 jack   | data_blacklist                 | table    | deity | {orientation=row,compression=no}
 jack   | data_msg_record                | table    | deity | {orientation=row,compression=no}
 jack   | data_nosuitable_loan           | table    | deity | {orientation=row,compression=no}
 jack   | data_record                    | table    | deity | {orientation=row,compression=no}
 jack   | data_rule_decisions            | table    | deity | {orientation=row,compression=no}
 jack   | data_sample_credit             | table    | deity | {orientation=row,compression=no}
 jack   | dm_hydl                        | table    | deity | {orientation=row,compression=no}
 jack   | dm_hyml                        | table    | deity | {orientation=row,compression=no}
 jack   | dm_hymx                        | table    | deity | {orientation=row,compression=no}
 jack   | dm_hyzl                        | table    | deity | {orientation=row,compression=no}
 jack   | dm_xzqh_wen                    | table    | deity | {orientation=row,compression=no}
 jack   | er_basic                       | table    | deity | {orientation=row,compression=no}
chnbs=> select count(*) from bi_order;
 count
-------
   407
(1 row)
```
