+++

title = "MogDB 系统表和系统视图概述" 

date = "2022-06-27" 

tags = ["MogDB 系统表和系统视图概述"] 

archives = "2022-06" 

author = "云和恩墨" 

summary = "MogDB 系统表和系统视图概述"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# MogDB 系统表和系统视图概述

本文出处：[https://www.modb.pro/db/420826](https://www.modb.pro/db/420826)

系统表是MogDB存放结构元数据的地方，它是MogDB数据库系统运行控制信息的来源，是数据库系统的核心组成部分。

系统视图提供了查询系统表和访问数据库内部状态的方法。

系统表和系统视图要么只对管理员可见，要么对所有用户可见。下面的系统表和视图有些标识了需要管理员权限，这些系统表和视图只有管理员可以查询。

用户可以删除后重新创建这些表、增加列、插入和更新数值，但是用户修改系统表会导致系统信息的不一致，从而导致系统控制紊乱。正常情况下不应该由用户手工修改系统表或系统视图，或者手工重命名系统表或系统视图所在的模式，而是由SQL语句关联的系统表操作自动维护系统表信息。

> **须知：** 用户应该禁止对系统表进行增删改等操作，人为对系统表的修改或破坏可能会导致系统各种异常情况甚至MogDB不可用。

## 支持updatable-views

视图可更新指的是用户可以通过视图对视图对应的基表进行INSERT/UPDATE/DELETE操作来更新基表的数据。

为了使视图可更新，视图中的行与基表中的数据行必须要有一一对应的关系，具体来说，视图中存在以下内容的时候，则该视图不可更新：

- 聚合函数或者窗口函数，比如sum、count、min、max、avg等
- DISTINCT语句
- HAVING、GROUP BY、START WITH、CONNECT BY
- UNION、UNION ALL、INTERSECT、EXCEPT
- 选择列中有子查询
- FROM子句中有不可更新的视图
- WHERE子句中的字子查询引用了FROM子句中的表
- 视图定义中的列由函数或者表达式产生，例如`decode(...)`
- 对于JOIN视图
  - 多表连接的视图做DML的时候必须存在不少于1张带有唯一键或者主键的基表
  - 多表连接的视图上的任何INSERT、UPDATE或DELETE操作一次只能修改一个基表

## 示例

### INSERT VIEW

```
CREATE TABLE IF NOT EXISTS table1(id int, a char(6), b varchar(6), c varchar(6));

INSERT INTO table1 VALUES(1, reverse('123A78'), '123A78', '1sdfBB');
INSERT INTO table1 VALUES(2, reverse('E3gw78'), 'E3g78', 'lkoier');
INSERT INTO table1 VALUES(3, reverse('HHiiw6'), 'Hiw6', '23fdsg');

CREATE VIEW test_view AS SELECT * FROM table1 WHERE id > 1;

INSERT INTO test_view VALUES(4, '2sdafd', '23ata', 'dstsee'); 

SELECT * FROM table1 WHERE id = 4;
 id |   a    |   b   |   c    
----+--------+-------+--------
  4 | 2sdafd | 23ata | dstsee
(1 row)

DROP VIEW IF EXISTS test_view;
DROP TABLE IF EXISTS table1;

```

### UPDATE VIEW

```
CREATE TABLE IF NOT EXISTS table1(id int, a char(6), b varchar(6), c varchar(6));
INSERT INTO table1 VALUES(1, reverse('123A78'), '123A78', '1sdfBB');
INSERT INTO table1 VALUES(2, reverse('E3gw78'), 'E3g78', 'lkoier');
INSERT INTO table1 VALUES(3, reverse('HHiiw6'), 'Hiw6', '23fdsg');

CREATE VIEW test_view AS SELECT * FROM table1 WHERE id > 1;

UPDATE test_view SET a = '2222' WHERE id = 2;

SELECT * FROM table1;
 id |   a    |   b    |   c    
----+--------+--------+--------
  1 | 87A321 | 123A78 | 1sdfBB
  3 | 6wiiHH | Hiw6   | 23fdsg
  2 | 2222   | E3g78  | lkoier
(3 rows)

DROP VIEW IF EXISTS test_view;
DROP TABLE IF EXISTS table1;

```

### DELETE VIEW

```
CREATE TABLE IF NOT EXISTS table1(id int, a char(6), b varchar(6), c varchar(6));

INSERT INTO table1 VALUES(1, reverse('123A78'), '123A78', '1sdfBB');
INSERT INTO table1 VALUES(2, reverse('E3gw78'), 'E3g78', 'lkoier');
INSERT INTO table1 VALUES(3, reverse('HHiiw6'), 'Hiw6', '23fdsg');

CREATE VIEW test_view AS SELECT * FROM table1 WHERE id > 1;

DELETE FROM test_view WHERE id = 2; 

SELECT * FROM table1 WHERE id > 1;
 id |   a    |  b   |   c    
----+--------+------+--------
  3 | 6wiiHH | Hiw6 | 23fdsg
(1 row)

DROP VIEW IF EXISTS test_view;
DROP TABLE IF EXISTS table1;

```

