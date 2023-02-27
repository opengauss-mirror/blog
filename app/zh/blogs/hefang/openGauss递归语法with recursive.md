---
title: 'openGauss递归语法with recursive'

date: '2022-04-06'

category: 'blog'
tags: ['openGauss递归语法with recursive']

archives: '2022-04'

author: '何放'

summary: 'openGauss递归语法with recursive'

img: '/zh/blogs/hefang/title/img6.png'

times: '11:37'
---

# openGauss 递归语法 with recursive

最近学习了 openGauss 使用 with recursive 做递归查询，这种用法在 openGauss 中实现 Oracle 的 start with connect by 语法，下面有用户发的语法报错，并介绍几种递归正确写法。

#### 报错信息

```
ERROR:  relation "test" does not exist
LINE 4: ....COLUMN1,a.COLUMN2 from tablename a,test b...
                                               ^
DETAIL:  There is a WITH item named "test", but it cannot be referenced from this part of the query.
HINT:  Use WITH RECURSIVE, or re-order the WITH items to remove forward references.
```

##### 需在 with 后添加 recursive

```
--报错SQL with test(COLUMN1,COLUMN2) as(  select COLUMN1,COLUMN2 from tablename where COLUMN1 ='11' and COLUMN2 = '1'  union all  select a.COLUMN1,a.COLUMN2 from tablename a,test b where b.COLUMN1=a.COLUMN3 and COLUMN2 = '1' ) select COLUMN1,COLUMN2 from test order by COLUMN1; --正确语法 with RECURSIVE test(COLUMN1,COLUMN2) as(  select COLUMN1,COLUMN2 from tablename where COLUMN1 ='11' and COLUMN2 = '1'  union all  select a.COLUMN1,a.COLUMN2 from tablename a,test b where b.COLUMN1=a.COLUMN3 and COLUMN2 = '1' ) select COLUMN1,COLUMN2 from test order by COLUMN1;
```

#### 1. 递归查询一

##### 1.1 创建测试表 1

```
create table city
(no  int, no1 int, name varchar(20));

insert into city values(1,null,'北京');
insert into city values(2,null,'广州');
insert into city values(11,1,'天安门');
insert into city values(12,1,'鸟巢');
insert into city values(13,1,'国家体育场');
insert into city values(21,2,'白云山');
insert into city values(22,2,'动物园');
insert into city values(23,2,'天河城');
```

##### 1.2 递归查询北京的下一级

```
--SQL语句
with recursive cte as(
    select a.* from city a
    where a.no = 1
    union all
    select b.* from city b
    join cte c on c.no = b.no1
)select * from cte;
--查询结果
 no | no1 |    name
----+-----+------------
  1 |     | 北京
 11 |   1 | 天安门
 12 |   1 | 鸟巢
 13 |   1 | 国家体育场
(4 rows)
```

##### 1.3 递归查询广州的下一级

```
--SQL语句
with recursive cte as(
    select a.* from city a
    where a.no = 2
    union all
    select b.* from city b
    join cte c on c.no = b.no1
)select * from cte;
--查询结果
 no | no1 |  name
----+-----+--------
  2 |     | 广州
 21 |   2 | 白云山
 22 |   2 | 动物园
 23 |   2 | 天河城
(4 rows)
```

##### 1.4 递归查询白云山的上一级

```
with recursive cte as(
    select a.* from city a
    where a.no = 21
    union all
    select b.* from city b
    join cte c on c.no1 = b.no
)select * from cte;
 no | no1 |  name
----+-----+--------
 21 |   2 | 白云山
  2 |     | 广州
(2 rows)
```

##### 1.5 递归查询天安门的上一级

```
with recursive cte as(
    select a.* from city a
    where a.no = 11
    union all
    select b.* from city b
    join cte c on c.no1 = b.no
)select * from cte;
 no | no1 |  name
----+-----+--------
 11 |   1 | 天安门
  1 |     | 北京
(2 rows)
```

#### 2. 递归查询二

##### 2.1 创建测试表 2

```
create table city2 (id int,pid int,name varchar(20));

insert into city2 values('001',0,'四川省');
insert into city2 values('002',0,'重庆市');
insert into city2 values('003','001','成都市');
insert into city2 values('004','001','绵阳市');
insert into city2 values('005','003','武侯区');
insert into city2 values('006','003','成华区');
insert into city2 values('007','003','锦江区');
insert into city2 values('008','002','江北区');
insert into city2 values('009','002','渝中区');
insert into city2 values('010','002','南岸区');
insert into city2 values('011','002','沙坪坝区');
```

##### 2.2 向下递归查询

```
with RECURSIVE cte as
(
select a.id,cast(a.name as varchar(100)) from city2 a where id='001'
union all
select k.id,cast(c.name||'>'||k.name as varchar(100)) as name from city2 k inner join cte c on c.id = k.pid
)select id,name from cte;
 id |         name
----+----------------------
  1 | 四川省
  3 | 四川省>成都市
  4 | 四川省>绵阳市
  5 | 四川省>成都市>武侯区
  6 | 四川省>成都市>成华区
  7 | 四川省>成都市>锦江区
(6 rows)
```

##### 2.3 向下递归查询

```
with RECURSIVE cte as
(
select a.id,cast(a.name as varchar(100)) from city2 a where id='002'
union all
select k.id,cast(c.name||'>'||k.name as varchar(100)) as name from city2 k inner join cte c on c.id = k.pid
)select id,name from cte;
 id |      name
----+-----------------
  2 | 重庆市
  8 | 重庆市>江北区
  9 | 重庆市>渝中区
 10 | 重庆市>南岸区
 11 | 重庆市>沙坪坝区
(5 rows)
```

#### 3. 递归计算

##### 3.1 使用递归计算 1-100 的加法

```
WITH RECURSIVE t(n) AS (
    VALUES (1)
  UNION ALL
    SELECT n+1 FROM t WHERE n < 100
)SELECT sum(n) FROM t;
 sum
------
 5050
(1 row)
```

##### 3.2 使用递归计算 100-200 之间的偶数平均数

```
with recursive t(n) as(
   values(100)
    union all
    select n+2 from t where n<200
)select avg(n) from t;
         avg
----------------------
 150.0000000000000000
(1 row)
```

#### 4. with recursive 语句对表操作

##### 4.1 创建测试表 4

```
create table company (
 id int ,
 salary int
);
insert into company values(1,20000);
insert into company values(2,15000);
insert into company values(3,20000);
insert into company values(4,65000);
insert into company values(5,85000);
insert into company values(6,45000);
insert into company values(7,10000);
```

##### 4.2 计算 salary 小于 20000 的总和

```
WITH RECURSIVE t(n) AS (
   VALUES (0)
  UNION ALL
   SELECT salary FROM company WHERE salary < 20000
)SELECT SUM(n) FROM t;
  sum
-------
 25000
(1 row)
```

##### 4.3 表进行操作

```
--创建表结构
create table company20000 (
 id int ,
 salary int
);
--删除指定行数，RETURNING子句返回它们的内容，读取输出并将其插入到COMPANY1表
WITH recursive a AS (
    DELETE FROM COMPANY
    WHERE
        SALARY >= 20000
    RETURNING *
)INSERT INTO COMPANY20000 (SELECT * FROM a);
--查看删除插入的数据
select * from COMPANY20000;
 id | salary
----+--------
  1 |  20000
  3 |  20000
  4 |  65000
  5 |  85000
  6 |  45000
(5 rows)

select * from COMPANY;
 id | salary
----+--------
  2 |  15000
  7 |  10000
(2 rows)

```

#### 5. 多个递归调用例子

语法格式：

```
WITH RECURSIVE
  cte1 AS (...)         -- 可以为非递归语句
, cte2 AS (SELECT ...
           UNION ALL
           SELECT ...)  -- 递归语句
, cte3 AS (...)         -- 递归语句
SELECT ... FROM cte3 WHERE ...
```

#### 6.总结及注意事项

1. 有混合递归和非递归，都统一使用 WITH RECURSIVE。
2. 顺序问题，先写非递归语句，然后写递归语句。
3. PG 中 with 的用法在 openGauss 中同样适用。
