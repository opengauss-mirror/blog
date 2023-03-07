+++

title = "MogDB 3.1.0 使用DBMind SQL Rewriter进行SQL自动改写" 

date = "2023-03-07" 

tags = ["MogDB"] 

archives = "2023-03" 

author = "云和恩墨-罗海雄" 

summary = "MogDB 3.1.0 使用DBMind SQL Rewriter进行SQL自动改写"

img = "/zh/post/luohaixiong/title/img.png" 

times = "10:20"
+++

本文出处：[https://www.modb.pro/db/611073](https://www.modb.pro/db/611073)

# SQL Rewriter

SQL Rewriter是一个SQL改写工具，根据预先设定的规则，将查询语句转换为更为高效或更为规范的形式，使得查询效率得以提升。

## 说明：

本功能不适用包含子查询的语句；
本功能只支持SELECT语句和DELETE对整个表格删除的语句；
本功能包含11个改写规则，对不符合改写规则的语句，不会进行处理；
本功能会对原始查询语句和改写后语句进行屏幕输出，不建议对包含涉敏感信息的SQL语句进行改写；
union转union all规则避免了去重，从而提升了查询性能，所得结果有可能存在冗余；
语句中如包含‘order by’+ 指定列名或‘group by’+ 指定列名，无法适用SelfJoin规则。

## 初始环境

- 1, MogDB 3.1.1缺少 constant 文件
  cat >> $GAUSSHOME/bin/constant <<EOF
  MIN_PYTHON_VERSION="(3,6)"
  MAX_PYTHON_VERSION="(3,9)"
  EOF
- 2, 安装一堆Python依赖包

$GAUSSHOME/bin/dbmind/requirements-aarch64.txt
配置PIP环境

```
mkdir -p ~/.pip
cat > ~/.pip/pip.conf <<EOF
[global]

index-url = https://repo.huaweicloud.com/repository/pypi/simple

[install]

trusted-host = https://repo.huaweicloud.com

EOF
```

安装依赖包

```
python3 -m pip  install --upgrade pip --user

python3 -m pip install -r $GAUSSHOME/bin/dbmind/requirements-aarch64.txt  --trusted-host repo.huaweicloud.com -i http://repo.huaweicloud.com/repository/pypi/simple --user


 python3 -m pip  install psycopg2 --user
如果报错，换成
 python3 -m pip  install psycopg2-binary --user
```

## 正式测试

语法：
gs_dbmind component sql_rewriter [PORT] [DBNAME] [SQLFILE] --db-host [default socketfile] --db-user [default init user] --schema [default public]

- 如有必要，创建数据库用户及相关表格
- 可选RULE
  class Delete2Truncate(Rule):
  class Star2Columns(Rule):
  class Having2Where(Rule):
  class AlwaysTrue(Rule):
  class DistinctStar(Rule):
  class UnionAll(Rule):
  class OrderbyConst(Rule):
  class Or2In(Rule):
  class OrderbyConstColumns(Rule):
  class ImplicitConversion(Rule):
  class SelfJoin(Rule):
- 准备 可改写SQL语句
  此处使用最简单的select * 替换成具体字段的案例

```
 cat > queries.sql  <<EOF
 select * from pg_class;
EOF
```

- 开始测试

```
gs_dbmind component sql_rewriter $PGPORT postgres queries.sql --db-user tpcc --db-host 127.0.0.1 
Password for database user: <输入密码>

+-------------------------+--------------------------+
| Raw SQL                 | Rewritten SQL            |
+-------------------------+--------------------------+
| select * from pg_class; | SELECT relname,          |
|                         |        relnamespace,     |
|                         |        reltype,          |
|                         |        reloftype,        |
|                         |        relowner,         |
|                         |        relam,            |
|                         |        relfilenode,      |
|                         |        reltablespace,    |
|                         |        relpages,         |
|                         |        reltuples,        |
|                         |        relallvisible,    |
|                         |        reltoastrelid,    |
|                         |        reltoastidxid,    |
|                         |        reldeltarelid,    |
|                         |        reldeltaidx,      |
|                         |        relcudescrelid,   |
|                         |        relcudescidx,     |
|                         |        relhasindex,      |
|                         |        relisshared,      |
|                         |        relpersistence,   |
|                         |        relkind,          |
|                         |        relnatts,         |
|                         |        relchecks,        |
|                         |        relhasoids,       |
|                         |        relhaspkey,       |
|                         |        relhasrules,      |
|                         |        relhastriggers,   |
|                         |        relhassubclass,   |
|                         |        relcmprs,         |
|                         |        relhasclusterkey, |
|                         |        relrowmovement,   |
|                         |        parttype,         |
|                         |        relfrozenxid,     |
|                         |        relacl,           |
|                         |        reloptions,       |
|                         |        relreplident,     |
|                         |        relfrozenxid64,   |
|                         |        relbucket,        |
|                         |        relbucketkey,     |
|                         |        relminmxid        |
|                         | FROM pg_class;           |
+-------------------------+--------------------------+
 
```

测试成功。

## 完整11个RULE测试用例

```
--建立测试表
create table test1 (id int primary key,name varchar(100));
create table test2 (id int primary key,name varchar(100));
```

生成.sql文件

```
cat > rewrite_example.sql <<EOF
delete /* 无条件的delete转换成truncate */ 
from test1;
select /* 星号替换成具体列名 */ * 
from test1;
select /*Union替换成 Union All*/id,name 
from test1
union 
select id,name 
from test2;
select /*order by 列号替换成具体列名 */id,name 
from test1 order by 1;
select /*返回单行的去掉order by */ id 
from test1 where id=1 order by id;
select /*Or 改为 in */id,name 
from test1 where id = 0 or id = 1;
select /* Having 列不属于聚合函数的改成Where */ id,count(*) 
from test1 group by id having id > 0 ;
select /*去掉恒为True的表达式*/id,name 
from test1 where 1=1;
select  /*预计算转换*/ id,name 
from test1 where id + 1 < 2 ;
select /*自连接非等式连接改为等式连接*/ a.id,b.name 
from test1 a , test1 b
 where a.id - b.id <= 20 and a.id > b.id;
select /*distinct 带主键去掉distinct */  distinct * 
from test1;
EOF
```

进行改写测试

```
gs_dbmind component sql_rewriter $PGPORT postgres rewrite_example.sql --db-user tpcc  --db-host 127.0.0.1
+-------------------------------------------------------+----------------------------------------------------+
| Raw SQL                                               | Rewritten SQL                                      |
+-------------------------------------------------------+----------------------------------------------------+
| delete                                                | TRUNCATE TABLE test1;                              |
| /* 无条件的delete转换成truncate */                    |                                                    |
| from test1;                                           |                                                    |
| select                                                | SELECT id,                                         |
| /* 星号替换成具体列名 */ *                            |        name                                        |
| from test1;                                           | FROM test1;                                        |
| select                                                | SELECT id,                                         |
| /*Union替换成 Union All*/id,name                      |        name                                        |
| from test1                                            | FROM test1                                         |
| union                                                 | UNION ALL                                          |
| select id,name                                        | SELECT id,                                         |
| from test2;                                           |        name                                        |
|                                                       | FROM test2;                                        |
| select                                                | SELECT id,                                         |
|  /*order by 列号替换成具体列名 */id,name              |        name                                        |
| from test1 order by 1;                                | FROM test1                                         |
|                                                       | ORDER BY id;                                       |
| select                                                | SELECT id                                          |
|  /*返回单行的去掉order by */ id                       | FROM test1                                         |
| from test1 where id=1 order by id;                    | WHERE id = 1;                                      |
| select                                                | SELECT id,                                         |
|  /*Or 改为 in */id,name                               |        name                                        |
| from test1 where id = 0 or id = 1;                    | FROM test1                                         |
|                                                       | WHERE id IN (0,                                    |
|                                                       |              1);                                   |
| select                                                | SELECT id,                                         |
| /* Having 列不属于聚合函数的改成Where */ id,count(*)  |        COUNT(*)                                    |
| from test1 group by id having id > 0 ;                | FROM test1                                         |
|                                                       | WHERE id > 0                                       |
|                                                       | GROUP BY id;                                       |
| select                                                | SELECT id,                                         |
| /*去掉恒为True的表达式*/id,name                       |        name                                        |
| from test1 where 1=1;                                 | FROM test1;                                        |
| select                                                | SELECT id,                                         |
| /*预计算转换*/ id,name                                |        name                                        |
| from test1 where id + 1 < 2 ;                         | FROM test1                                         |
|                                                       | WHERE id < 1;                                      |
| select                                                | SELECT *                                           |
| /*自连接非等式连接改为等式连接*/ a.id,b.name          | FROM                                               |
| from test1 a , test1 b                                |   (SELECT a.id,                                    |
|  where a.id - b.id <= 20 and a.id > b.id;             |           b.name                                   |
|                                                       |    FROM test1 AS a,                                |
|                                                       |         test1 AS b                                 |
|                                                       |    WHERE TRUNC((a.id) / 20) = TRUNC(b.id / 20)     |
|                                                       |      AND a.id > b.id                               |
|                                                       |    UNION ALL SELECT a.id,                          |
|                                                       |                     b.name                         |
|                                                       |    FROM test1 AS a,                                |
|                                                       |         test1 AS b                                 |
|                                                       |    WHERE TRUNC((a.id) / 20) = TRUNC(b.id / 20 + 1) |
|                                                       |      AND a.id - b.id <= 20);                       |
| select                                                | SELECT id,                                         |
| /*distinct * 带主键去掉distinct */  distinct *        |        name                                        |
| from test1;                                           | FROM test1;                                        |
+-------------------------------------------------------+----------------------------------------------------+
```