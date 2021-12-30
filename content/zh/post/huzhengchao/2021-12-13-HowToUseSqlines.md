+++
title = "openGauss Sqlines 使用指导"
date = "2021-12-13"
tags = ["sqlines"]
archives = "2021-12-13"
author = "gentle_hu"
summary = "如何使用 Sqlines 向openGauss迁移SQL语句"
img = "/zh/post/huzhengchao/title/img1.png"
times = "9:30"
+++


# openGauss Sqlines 使用指导

[TOC]

## Sqlines简介

Sqlines是一款开源软件，支持多种数据库之间的SQL语句语法的的转换，openGauss将此工具修改适配，新增了openGauss数据库选项，目前可以支持PostgreSQL、MySQL、Oracle向openGauss的SQL语法转换。



## 如何获取和使用

1、在社区下载代码到任意位置：[openGauss/openGauss-tools-sqlines (gitee.com)](https://gitee.com/opengauss/openGauss-tools-sqlines)

2、进入代码根目录下, 执行脚本编译安装sqlines： 

```
[user@openGauss33 sqlines]$ sh build.sh -i
```

3、sqlines将安装到根目录下的/bin文件夹下，可将其添加到环境变量方便使用：

```
[user@openGauss33 sqlines]$ export PATH=$PATH:`pwd`/bin
```

4、使用sqlines

```
[user@openGauss33 sqlines]$ sqlines -?
SQLines 3.1.330 - SQL Assessment and Conversion Tool.
Portions Copyright (c) 2020 SQLines.
Portions Copyright (c) 2021 Huawei Technologies Co.,Ltd.
All Rights Reserved.

How to use:
    sqlines -option=value [...n]

Options:
   -s        - Source type
   -t        - Target type
   -in       - List of files (wildcards *.* are allowed)
   -out      - Output directory (the current directory by default)
   -log      - Log file (sqlines.log by default)
   -?        - Print how to use

Example:
Convert script.sql file from Oracle to openGauss
   ./sqlines -s=oracle -t=opengauss -in=script.sql
```

参数说明：

| **参数** | **值域**                          | **功能**                           |
| -------- | --------------------------------- | ---------------------------------- |
| **-?**   | -                                 | 帮助菜单                           |
| **-s**   | [ oracle \| mysql \| postgresql ] | Source数据库                       |
| **-t**   | [ opengauss ]                     | Target数据库                       |
| **-in**  | FILE_PATH                         | 输入文件                           |
| **-out** | [ FILE_PATH \| /*  empty */]      | 输出文件，不指定时输出在in文件夹， |
| **-log** | [ FILE_PATH \| /* empty */]       | 输出日志，不指定时输出在当前文件夹 |
|          |                                   |                                    |

 

5、执行脚本卸载sqlines：

```
[user@openGauss33 sqlines]$ sh build.sh -m
```



## PostgreSQL to openGauss

### 删除IF

```
Create table IF NOT EXISTS tb as select * from basetb;
Create table IF NOT EXISTS tb as execute p1();
Create index IF NOT EXISTS idx on tb(a);
Create sequence IF NOT EXISTS sqc;
Create schema IF NOT EXISTS schm;
```

openGauss中很多语法暂时不支持 if not exists判断，因此在转换时会给删掉。

如： `Create schema IF NOT EXISTS schm;`   =>  `Create schema schm;`



## MySQL to openGauss

### 数据类型

| MYSQL 数据类型 | openGauss 数据类型 | **备注** |
| -------------- | ------------------ | -------- |
| TINYINT        | SMALLINT           |          |
| MEDIUMINT      | INT                |          |
| DOUBLE         | DOUBLE PRECISION   |          |
| FLOAT          | DOUBLE PRECISION   |          |
| DATETIME       | TIMESTAMP          |          |
| TINYBLOB       | BYTEA              |          |
| BLOB           | BYTEA              |          |
| MEDIUNBLOB     | BYTEA              |          |
| LONGBLOB       | BYTEA              |          |
| TINYTEXT       | TEXT               |          |
| MEDIUMTEXT     | TEXT               |          |
| LONGTEXT       | TEXT               |          |
| BINARY         | BYTEA              |          |
| VARBINARY      | BYTEA              |          |

 Mysql中很多数据类型与openGauss有差别，对于表中的数据类型，可以进行转换成为openGauss的数据类型。



### CREATE TABLE

### 删除if

```
CREATE [TEMPORARY] TABLE [IF NOT EXISTS] tbl_name select_statement
```

对于create table as语句，openGauss不支持使用 if not exists 判断，因此会删除if判断。

 

#### 列约束

```
语法：column_definition:
  		col_name type [NOT NULL | NULL] [DEFAULT default_value] [AUTO_INCREMENT] [UNIQUE [KEY] | [PRIMARY] KEY] [COMMENT 'string'] [reference_definition]

举例：
Create table tb(a int NOT NULL, b text PRIMARY KEY, c int AUTO_INCREMENT……)括号内的部分。在创建表定义列时，可以立马为列指定很多的属性与约束，如NOT NULL等。
```

 转换时行为如下：

**AUTO_INCREMENT**：在前面添加一句创建序列SQL，并将auto_increment转换为defualt nextval(seq);

**COMMENT 'string'**：删除

  

#### 表属性

```
table_option:
  {ENGINE|TYPE} = engine_name
 | AUTO_INCREMENT = value
 | AVG_ROW_LENGTH = value
 | [DEFAULT] CHARACTER SET charset_name [COLLATE collation_name]
 | CHECKSUM = {0 | 1}
 | COMMENT = 'string'
 | CONNECTION = 'connect_string'
 | MAX_ROWS = value
 | MIN_ROWS = value
 | PACK_KEYS = {0 | 1 | DEFAULT}
 | PASSWORD = 'string'
 | DELAY_KEY_WRITE = {0 | 1}
 | ROW_FORMAT = {DEFAULT|DYNAMIC|FIXED|COMPRESSED|REDUNDANT|COMPACT}
 | UNION = (tbl_name[, tbl_name]...)
 | INSERT_METHOD = { NO | FIRST | LAST }
 | DATA DIRECTORY = 'absolute path to directory'
 | INDEX DIRECTORY = 'absolute path to directory'

举例：
Create table tb(a int) MAX_ROWS = 1000, CHECNSUM = 1, ……;中的MAX_ROWS等
```

 openGauss 并不支持这个地方添加这些语法用来指定一些属性，转换时全部删除处理。

  

### CREATE DATABASE

```
CREATE DATABASE [IF NOT EXISTS] db_name
    [create_specification [, create_specification] ...]
 
create_specification:
    [DEFAULT] CHARACTER SET charset_name
  | [DEFAULT] COLLATE = collation_name
```

1、openGauss 语法不支持 if 判断，转换时会删掉

2、对于创建参数，openGauss和mysql也不大一样。其行为如下：

 	**[DEFAULT] CHARACTER SET *charset_name***：  删除

​	 **[DEFAULT] COLLATE = *collation_name***： 将COLLATE转换为 LC_COLLATE

 

### CREATE FUNCTION/PROCDURE

若不存在or replace则自动添加。

在 AS后的函数体部分，前后自动添加 $$ 符号。

语言属性自动添加或修改为 language plpgsql;

SQL%NOTFOUND  =>  NOT FOUND

SQL%FOUND  =>  FOUND

SQL%ROWCOUNT  =>  V_SQLROWCOUNT

 

### CREATE INDEX

```
CREATE [UNIQUE | FULLTEXT | SPATIAL] INDEX index_name
    [USING index_type]
    ON tbl_name (index_col_name,...)
 
index_col_name:
    col_name [(length)] [ASC | DESC]
```

 openGauss 不支持FULLTEXT、SPATIAL类型的 index，因此若有这两种的话，转换时会删除这两个关键字。

 

### CREATE SCHEMA

```
CREATE SCHEMA [IF NOT EXISTS] db_name
[create_specification [, create_specification] ...]
 
create_specification:
    [DEFAULT] CHARACTER SET charset_name
  | [DEFAULT] COLLATE collation_name
```

1、openGauss 的语法不支持if判断，转换时会删掉

2、对于创建参数，openGauss 和mysql也不大一样。其行为如下：

​	**[DEFAULT] CHARACTER SET *charset_name***： 注释掉。

​	**[DEFAULT] COLLATE *collation_name***:  将COLLATE关键字转换为 LC_COLLATE

  

### ALTER TABLE

```
ALTER [IGNORE] TABLE tbl_name alter_specification [, alter_specification] ...
 
alter_specification:
    ADD [COLUMN] column_definition [FIRST | AFTER col_name ]
……
```

1、openGauss 不支持ignore选项，转换时会给删除。

 2、ADD COLUMN时，openGauss 不支持使用first、after来指定列的位置，会将其删除。

  

### DROP INDEX

```
DROP INDEX index_name ON tbl_name
```

openGauss 不支持on子句，如 drop index idxa on tba， 转换时会删掉ON子句。

 

### INSERT

```
INSERT [LOW_PRIORITY | DELAYED | HIGH_PRIORITY] [IGNORE]
    [INTO] tbl_name [(col_name,...)]     
    VALUES ({expr | DEFAULT},...),(...),...
    [ ON DUPLICATE KEY UPDATE col_name=expr, ... ]
```

 openGauss 的insert不支持 `LOW_PRIORITY / DELAYED / HIGH_PROPRITY / IGNORE`等选项，转换时会直接删掉这些选项。

 

### UPDATE

```
UPDATE [LOW_PRIORITY] [IGNORE] tbl_name
    SET col_name1=expr1 [, col_name2=expr2 ...]
    [WHERE where_definition]
    [ORDER BY ...]
    [LIMIT row_count]
```

 openGauss 不支持` LOW_PRIORITY  \  IGNORE` 选项，转换时会直接删除

 

### DELETE

```
single delete：
DELETE [LOW_PRIORITY] [QUICK] [IGNORE] FROM tbl_name
    [WHERE where_definition]
    [ORDER BY ...]
[LIMIT row_count]
 
muilty-delete：
DELETE [LOW_PRIORITY] [QUICK] [IGNORE]
    FROM tbl_name[.*] [, tbl_name[.*] ...]
    USING table_references
    [WHERE where_definition]
 
```

 openGauss 不支持 ` LOW_PRIORITY \ QUICK \ IGNORE ` 选项，转换时会直接删除。

  

### SELECT

```
SELECT
[ALL | DISTINCT | DISTINCTROW ] [HIGH_PRIORITY] [STRAIGHT_JOIN] [SQL_SMALL_RESULT] [SQL_BIG_RESULT] [SQL_BUFFER_RESULT] [SQL_CACHE | SQL_NO_CACHE] [SQL_CALC_FOUND_ROWS]
select_expr, ...
[INTO OUTFILE 'file_name' export_options | INTO DUMPFILE 'file_name']
[FROM table_references]
[WHERE where_definition]
[GROUP BY {col_name | expr | position} [ASC | DESC], ... [WITH ROLLUP]]
[HAVING where_definition]
[ORDER BY {col_name | expr | position}  [ASC | DESC] , ...]
[LIMIT {[offset,] row_count | row_count OFFSET offset}]
[FOR UPDATE | LOCK IN SHARE MODE]]
```

openGauss 不支持 DISTINCTROW 关键字，转换时会给删掉。

openGauss 不支持 [HIGH_PRIORITY] [STRAIGHT_JOIN] [SQL_SMALL_RESULT] [SQL_BIG_RESULT] [SQL_BUFFER_RESULT] [SQL_CACHE | SQL_NO_CACHE] [SQL_CALC_FOUND_ROWS]这些关键字，转换时都会给删除。

  

### RENAME

```
RENAME TABLE tbl_name TO new_tbl_name;
```

 支持将rename语法转换为 alter table rename语法

​     如： RENAME TABLE tba TO tbb； =>  ALTER TABLE tba RENAME TO tbb;





## Oracle to openGauss

### 数据类型

| **ORACLE**                     | **OPENGAUSS**             | 备注 |
| ------------------------------ | ------------------------- | ---- |
| BINARY_FLOAT                   | REAL                      |      |
| BINARY_DOUBLE                  | DOUBLE PRECISION          |      |
| BLOB                           | BYTEA                     |      |
| CLOB                           | TEXT                      |      |
| DATE                           | TIMESTAMP                 |      |
| FLOAT                          | DOUBLE PRECISION          |      |
| INTERVAL  YEAR(4) TO MONTH     | INTERVAL YEAR TO  MONTH   |      |
| INTERVAL  DAY(4) TO SECOND(8)  | INTERVAL DAY TO SECOND(8) |      |
| TIMESTAMP WITH LOCAL TIME ZONE | TIMESTAMP WITH TIME ZONE  |      |
| LONG                           | TEXT                      |      |
| LONG RAW                       | BYTEA                     |      |
| NCHAR(8)                       | CHAR(8)                   |      |
| NCHAR VARYING(7)               | VARCHAR(7)                |      |
| NCLOB                          | TEXT                      |      |
| NUMBER(8)                      | INT                       |      |
| NUMBER(1,0)                    | SMALLINT                  |      |
| NUMBER(4,0)                    | SMALLINT                  |      |
| NUMBER(8,0)                    | INT                       |      |
| NUMBER(12,0)                   | BIGINT                    |      |
| NUMBER(20,0)                   | DECIMAL(20,0)             |      |
| NUMBER(10,2)                   | DECIMAL(10,2)             |      |
| NUMBER                         | DOUBLE PRECISION          |      |
| NUMBER(\*)                     | DOUBLE PRECISION          |      |
| NVARCHAR2(12)                  | VARCHAR(12)               |      |
| RAW(8)                         | BYTEA                     |      |
| REAL                           | DOUBLE PRECISION          |      |
| SMALLINT                       | DECIMAL(38)               |      |
| UROWID(16)                     | VARCHAR(16)               |      |
| VARCHAR2(18)                   | VARCHAR(18)               |      |
| BFILE                          | VARCHAR(255)              |      |
| ROWID                          | CHAR(10)                  |      |
| SYS_REFCURSOR                  | REFCURSOR                 |      |
| XMLTYPE                        | XML                       |      |

 

### CREATE FUNCTION/PROCDURE

没有or replace时会给自动添加上。

在 AS后的函数体部分，前后自动添加 $$ 符号。

函数的语言属性自动修改或添加为 language plpgsql;

函数的 RETURN 关键字转换为 RETURNS

DBMS_OUTPUT.PUT_LINE('err');    =>    RAISE NOTICE '%','err';

调用传参操作符 => 会转换为 :=

EXISTS IF NOT FOUND => EXISTS

SQL%NOTFOUND  =>  NOT FOUND

SQL%FOUND  =>  FOUND

SQL%ROWCOUNT  =>  V_SQLROWCOUNT

SYS_REFCURSOR   =>   REFCURSOR



### CREATE TABLE

```
CREATE [ GLOBAL TEMPORARY | SHARDED | DUPLICATED ] TABLE
  [ schema. ] table
  [ SHARING = { METADATA | DATA | EXTENDED DATA | NONE } ]
  { relational_table | object_table | XMLType_table }
  [ PARENT [ schema. ] table ] ;
```

openGauss没有SHARDED、 DUPLICATED的表，转换时会删除此关键字。

openGauss没有SHARING参数选项，转换时会删除此参数。

这些存储参数全部删除： SEGMENT、PCTFREE、PCTUSED、INITRANS、MAXTRANS、COMPRESS、NOCOMPRESS、NOCACHE、LOGGING、NOLOGGING、NOPARALLEL、PARALLEL、NOMONITORING、TABLESPACE 、STORAGE、LOB、COMPUTE、ENABLE、REVERSE 





 ### CREATE VIEW

```
CREATE [OR REPLACE]
  [[NO] FORCE] [ EDITIONING | EDITIONABLE [ EDITIONING ] | NONEDITIONABLE ]
VIEW [schema.] view
  [ SHARING = { METADATA | DATA | EXTENDED DATA | NONE } ]
  [ ( { alias [ VISIBLE | INVISIBLE ] [ inline_constraint... ]
      | out_of_line_constraint
      }
        [, { alias [ VISIBLE | INVISIBLE ] [ inline_constraint...]
           | out_of_line_constraint
           }
        ]
    )
  | object_view_clause
  | XMLType_view_clause
  ]
  [ DEFAULT COLLATION collation_name ]
  [ BEQUEATH { CURRENT_USER | DEFINER } ]
AS subquery [ subquery_restriction_clause ]
  [ CONTAINER_MAP | CONTAINERS_DEFAULT ] ;
```

`CREATE OR REPLACE` 与`VIEW`关键词之间的参数，`[[NO] FORCE] [ EDITIONING | EDITIONABLE [ EDITIONING ] | NONEDITIONABLE ]` 转换时会被删除。

`[ SHARING = { METADATA | DATA | EXTENDED DATA | NONE } ]`转换时会被删除。



### CREATE SEQUENCE

```
CREATE SEQUENCE [ schema. ] sequence
  [ SHARING = { METADATA | DATA | NONE } ]
  [ { INCREMENT BY | START WITH } integer
  	| { MAXVALUE integer | NOMAXVALUE }
  	| { MINVALUE integer | NOMINVALUE }
 	| { CYCLE | NOCYCLE }
  	| { CACHE integer | NOCACHE }
  	| { ORDER | NOORDER }
  	| { KEEP | NOKEEP }
  	| { SESSION | GLOBAL }
  ]...
;
```

openGauss不支持`[ SHARING = { METADATA | DATA | NONE } ]`，转换时会删除。

openGauss不支持参数` NOCACHE， ORDER NOORDER，KEEP， NOKEEP， SESSION， GLOBAL `，转换时会删除



 ### ALTER INDEX

```
ALTER INDEX [ schema. ]index
  { { deallocate_unused_clause
    	| allocate_extent_clause
    	| shrink_clause
    	| parallel_clause
    	| physical_attributes_clause
    	| logging_clause
    	| partial_index_clause
    } ...
  	| rebuild_clause [ { DEFERRED | IMMEDIATE } INVALIDATION]
  	| PARAMETERS ( 'ODCI_parameters' )
  	| COMPILE
  	| { ENABLE | DISABLE }
  	| UNUSABLE [ ONLINE ] [ { DEFERRED | IMMEDIATE } INVALIDATION ]
  	| VISIBLE | INVISIBLE
  	| RENAME TO new_name
  	| COALESCE [ CLEANUP ] [ parallel_clause ]
  	| { MONITORING | NOMONITORING } USAGE
  	| UPDATE BLOCK REFERENCES
  	| alter_index_partitioning
  }
  ;
```

rebuild_clause 的三个参数，转换时会给删除。

​     如：` alter index idx rebuild immediate invalidation;   =>   alter index idx rebuild; `

ENABLE / VISABLE 关键字支持改为 `REBUILD`

​     如：`alter index idx enable;  =>  alter index idx rebuild;`

DISABLE / INVLSIBLE 支持改为 UNUSABLE

​     如：`alter index idx disable   =>   alter index idx unusable;`

openGauss的UNUSBALE后面没有参数，转换时给删除

​     如：`alter index idx ununsable online;   =>   alter index idx ununsable;`

 

### ALTER SEQUENCE

```
ALTER SEQUENCE [ schema. ] sequence
  { INCREMENT BY integer
  | { MAXVALUE integer | NOMAXVALUE }
  | { MINVALUE integer | NOMINVALUE }
  | { CYCLE | NOCYCLE }
  | { CACHE integer | NOCACHE }
  | { ORDER | NOORDER }
  | { KEEP | NOKEEP }
  | { SESSION | GLOBAL }
  } ...
;
```

openGauss不支持参数 ` { MINVALUE integer | NOMINVALUE }`，`{ CYCLE | NOCYCLE }`，`NOCACHE`， `{ ORDER | NOORDER }`， `{ KEEP | NOKEEP }`， `{ SESSION | GLOBAL }`，转换时会删掉。



### DROP INDEX

```
DROP INDEX [ schema. ] index [ ONLINE ] [ FORCE ] [ { DEFERRED | IMMEDIATE } INVALIDATION ];
```

openGauss仅支持 DROP INDEX name；后面的参数 ONLINE \ FORCE \ DEFERRED \ IMMEDIATE \ INVALIDATION 转换时都会删除。



### DROP MATERIALIZED VIEW

```
DROP MATERIALIZED VIEW [ schema. ] materialized_view
   [ PRESERVE TABLE ] ;
```

openGauss不支持加参数，后面的preserve table会被删掉。

 

### DROP TABLE

```
DROP TABLE [ schema. ] table [ CASCADE CONSTRAINTS ] [ PURGE ] ;
```

 后面的参数 cascade constraints、purge 会删掉。

  

### DROP TABLESPACE

```
DROP TABLESPACE tablespace
  [ { DROP | KEEP } QUOTA ]
  [ INCLUDING CONTENTS [ { AND | KEEP } DATAFILES ] [ CASCADE CONSTRAINTS ] ]
  ;
```

openGauss只支持 DROP TABLESPACE tablespace；

各种选项参数都会被删除。

 

### DROP TYPE

```
DROP TYPE [ schema. ] type_name [ FORCE | VALIDATE ] ;
```

openGauss不支持 FORCE \ VALIDATE参数，转换时会删除。

  

### DROP VIEW

```
DROP VIEW [ schema. ] view [ CASCADE CONSTRAINTS ] ;
```

 参数只保留cascade;

  

### ANALYZE 

```
ANALYZE
  { { TABLE [ schema. ] table
    | INDEX [ schema. ] index
    } [ partition_extension_clause ]
  | CLUSTER [ schema. ] cluster
  }
  { validation_clauses
  | LIST CHAINED ROWS [ into_clause ]
  | DELETE [ SYSTEM ] STATISTICS
  } ;
```

openGauss在analyze后面不支持添加 TABLE \ INDEX关键字，转换时会删除这两个关键字。

 

### SELECT

```
  [ with_clause ]
SELECT [ hint ] [ { { DISTINCT | UNIQUE } | ALL } ] select_list
FROM { table_reference | join_clause | ( join_clause ) }
         [ , { table_reference | join_clause | (join_clause) } ] ...
  [ where_clause ]
  [ hierarchical_query_clause ]
  [ group_by_clause ]
  [ model_clause ]
```

  

对于某些情况，oracle需要加FROM DUAL，我们不需要，转换时会给删除。

​    如： `select 1 from dual;  =>  select 1;`

 

我们不支持unique关键字，会转变为distinct

​     如：`select unique * from tb;  =>  select distinct * from tb;`

 

### EXECUTE

```
EXECUTE IMMEDIATE function();
```

我们不支持IMMEDIATE参数，会给删除。



### GRANT

```
GRANT USAGE ON LANGUAGE SPL TO …
```

openGauss 内叫做plpgsql，会将SPL关键字转换为 PLPGSQL；

 

### REVOKE

```
REVOKE USAGE ON LANGUAGE SPL FROM … 
```

openGauss 内叫做plpgsql，会将SPL关键字转换为 PLPGSQL；

 

### RENAME

```
RENAME old_name TO new_name ;
```

支持将rename修改为alter table rename

​     如： `rename oldname to newname;  =>  alter table oldname rename to newname;`

 

### TRUNCATE

```
TRUNCATE TABLE [schema.] table
  [ {PRESERVE | PURGE} MATERIALIZED VIEW LOG ]
  [ {DROP [ ALL ] | REUSE} STORAGE ] [ CASCADE ] ;
```

转换时最多仅会保留 truncate table name cascade；其他都会删除。



 

## 函数转换

 有一些系统函数、无参函数等，是有差异的，但语义基本一样，因此可支持做一些映射

| **Source**                | **openGauss**            | 备注 |
| ------------------------- | ------------------------ | ---- |
| Charindex（str1， str2）  | Position(str1 in  str2)  |      |
| CURRENT DATE              | CURRENT_DATE             |      |
| CURRENT  TIMESTAMP        | CURRENT_TIMESTAMP        |      |
| Convert(varchar,  source) | To_char(source)          |      |
| USER                      | CURRENT_USER             |      |
| Getdate()                 | Now()                    |      |
| ISNULL(expr,  replace)    | COALESCE(expr,  replace) |      |
| NVL(expr,  expr)          | COALESCE(expr, expr)     |      |
| SYSDATE()                 | CURRENT_TIMESTAMP()      |      |
| SYSTIMESTAMP              | CURRENT_TIMESTAMP        |      |

