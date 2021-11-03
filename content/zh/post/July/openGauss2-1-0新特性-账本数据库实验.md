+++

title =  "openGauss2.1.0新特性-账本数据库实验" 

date = "2021-10-21" 

tags = [ "openGauss2.1.0新特性-账本数据库实验"] 

archives = "2021-10" 

author = "姜殿斌" 

summary = "openGauss2.1.0新特性-账本数据库实验"

img = "/zh/post/July/title/img3.png" 

times = "12:30"

+++

# openGauss2.1.0新特性-账本数据库实验<a name="ZH-CN_TOPIC_0000001219416147"></a>



账本数据库融合了区块链思想，将用户操作记录至两种历史表中：用户历史表和全局区块表。当用户创建防篡改用户表时，系统将自动为该表添加一个hash列来保存每行数据的hash摘要信息，同时在blockchain模式下会创建一张用户历史表来记录对应用户表中每条数据的变更行为；而用户对防篡改用户表的一次修改行为将记录至全局区块表中。由于历史表具有只可追加不可修改的特点，因此历史表记录串联起来便形成了用户对防篡改用户表的修改历史。

下面，通过实验来理解账本数据库这一新特性：

## 1、创建防篡改模式： ledgernsp<a name="section12757256247"></a>

登录数据库：

```
[omm@node1 ~]$ gsql -d postgres -p 26000 -r

gsql ((openGauss 2.1.0 build 590b0f8e) compiled at 2021-09-30 14:29:04 commit 0 last mr )

openGauss=# create schema ledgernsp with blockchain;

CREATE SCHEMA
```

查看新建的模式 ledgernsp：

```
openGauss=# \dn
List of schemas
Name | Owner
----------------+-------
blockchain | omm
cstore | omm
db4ai | omm
dbe_perf | omm
dbe_pldebugger | omm
ledgernsp | omm
pkg_service | omm
public | omm
snapshot | omm
sqladvisor | omm
(10 rows)
```

## 2、在防篡改模式下创建防篡改用户表：<a name="section1369311372518"></a>

```
openGauss=# CREATE TABLE ledgernsp.usertable(id int, name text);
CREATE TABLE
```

查看防篡改用户表结构及其对应的用户历史表结构：

```
openGauss=# \d+ ledgernsp.usertable;
Table "ledgernsp.usertable"
Column | Type | Modifiers | Storage | Stats target | Description
--------+---------+-----------+----------+--------------+-------------
id | integer | | plain | |
name | text | | extended | |
hash | hash16 | | plain | |
Has OIDs: no
Options: orientation=row, compression=no

openGauss=# \d+ blockchain.ledgernsp_usertable_hist;
Table "blockchain.ledgernsp_usertable_hist"
Column | Type | Modifiers | Storage | Stats target | Description
----------+--------+-----------+---------+--------------+-------------
rec_num | bigint | | plain | |
hash_ins | hash16 | | plain | |
hash_del | hash16 | | plain | |
pre_hash | hash32 | | plain | |
Indexes:
"gs_hist_24788_index" PRIMARY KEY, btree (rec_num int4_ops) TABLESPACE pg_default
Has OIDs: no
Options: internal_mask=263
```

## 3、修改防篡改用户表数据，并查看hash值的相应变化：<a name="section03051040152517"></a>

1）插入数据：

```
openGauss=# INSERT INTO ledgernsp.usertable VALUES(1, 'alex'), (2, 'bob'), (3, 'peter');
INSERT 0 3
openGauss=# SELECT *, hash FROM ledgernsp.usertable ORDER BY id;
id | name | hash
----+-------+------------------
1 | alex | 1f2e543c580cb8c5
2 | bob | 8fcd74a8a6a4b484
3 | peter | f51b4b1b12d0354b
(3 rows)
```

2）更新数据：

```
openGauss=# UPDATE ledgernsp.usertable SET name = 'bob2' WHERE id = 2;
UPDATE 1
openGauss=# SELECT *, hash FROM ledgernsp.usertable ORDER BY id;
id | name | hash
----+-------+------------------
1 | alex | 1f2e543c580cb8c5
2 | bob2 | 437761affbb7c605
3 | peter | f51b4b1b12d0354b
(3 rows)
```

3）删除数据：

```
openGauss=# DELETE FROM ledgernsp.usertable WHERE id = 3;
DELETE 1
openGauss=# SELECT *, hash FROM ledgernsp.usertable ORDER BY id
openGauss-# ;
id | name | hash
----+------+------------------
1 | alex | 1f2e543c580cb8c5
2 | bob2 | 437761affbb7c605
(2 rows)
```

## 4、查询历史表记录：<a name="section1650149172619"></a>

```
openGauss=# select * from blockchain.ledgernsp_usertable_hist;
rec_num | hash_ins | hash_del | pre_hash
---------+------------------+------------------+----------------------------------
0 | 1f2e543c580cb8c5    |                                 | e45acf22fe042b2373d148f52903d29a
1 | 8fcd74a8a6a4b484    |                                 | af08f23d38ecfec2ad9c6f1c4685a837
2 | f51b4b1b12d0354b   |                                 | 69e2885fb802fbb2b191211623115f9d
3 | 437761affbb7c605     | 8fcd74a8a6a4b484 | fd61cb772033da297d10c4e658e898d7
4 |                                    | f51b4b1b12d0354b | 6475a497b7a272a92bab012d7f3d615b
(5 rows)
```

也可以通过查询gs\_global\_chain，查询全局区块表记录。：

```
openGauss=# SELECT * FROM gs_global_chain;
blocknum | dbname | username | starttime | relid | relnsp | relname | relhash |
globalhash | txcommand
----------+----------+----------+-------------------------------+-------+-----------+-----------+------------------+--------
0 | postgres | omm | 2021-10-29 16:52:29.929996+08 | 24788 | ledgernsp | usertable | a41714001181a294 | 84c0a24
3ed2def4580f74cec812732fa | INSERT INTO ledgernsp.usertable VALUES(1, 'alex'), (2, 'bob'), (3, 'peter');
1 | postgres | omm | 2021-10-29 16:53:09.009009+08 | 24788 | ledgernsp | usertable | b3a9ed0755131181 | 9571d5a
0595aaf528917a6fe23d6e80a | UPDATE ledgernsp.usertable SET name = 'bob2' WHERE id = 2;
2 | postgres | omm | 2021-10-29 16:54:17.525065+08 | 24788 | ledgernsp | usertable | 0ae4b4e4ed2fcab5 | aa016e1
c8768857857815684f36aa4b2 | DELETE FROM ledgernsp.usertable WHERE id = 3;
(3 rows)
```

查询用户表数据及hash校验列：

```
openGauss=# SELECT *, hash FROM ledgernsp.usertable;
id | name | hash
----+------+------------------
1 | alex | 1f2e543c580cb8c5
2 | bob2 | 437761affbb7c605

(2 rows)
```

## 【实验结论】：<a name="section1195612537277"></a>

查询结果显示，用户表中剩余2条数据，与全局区块表记录中的记录一致。

实验结束。

参考：《openGauss2.1.0开发者指南》

