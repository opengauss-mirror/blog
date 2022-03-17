+++

title =  "openGauss gsql 常用元命令 二" 

date = "2022-01-10" 

tags = ["openGauss gsql 常用元命令 二"] 

archives = "2022-01" 

author = "晨辉" 

summary = "openGauss gsql 常用元命令 二"

img = "/zh/post/2022/title/img11.png" 

times = "12:30"

+++

# openGauss gsql 常用元命令 二<a name="ZH-CN_TOPIC_0000001198457208"></a>

## \\df 查看当前数据库函数信息<a name="section3401122112379"></a>

```
openGauss=# \df
********* QUERY **********
SELECT n.nspname as "Schema",
  p.proname as "Name",
  pg_catalog.pg_get_function_result(p.oid) as "Result data type",
  pg_catalog.pg_get_function_arguments(p.oid) as "Argument data types",
 CASE
  WHEN p.proisagg THEN 'agg'
  WHEN p.proiswindow THEN 'window'
  WHEN p.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype THEN 'trigger'
  ELSE 'normal'
END as "Type" ,
 fencedmode as "fencedmode"
 ,
 propackage as "propackage"
 ,
 prokind as "prokind"

FROM pg_catalog.pg_proc p
     LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE pg_catalog.pg_function_is_visible(p.oid)
      AND n.nspname <> 'pg_catalog'
      AND n.nspname <> 'db4ai'
      AND n.nspname <> 'information_schema'
ORDER BY 1, 2, 4;
**************************

                                                           List of functions
 Schema |   Name    | Result data type |               Argument data types                |  Type  | fencedmode | propackage | prokind 
--------+-----------+------------------+--------------------------------------------------+--------+------------+------------+---------
 public | fuc_worth | numeric          | price numeric, amount integer, OUT worth numeric | normal | f          | f          | f
(1 row)
```

## \\dx 查看已安装的扩展程序信息<a name="section48735304370"></a>

```
openGauss=# \dx
********* QUERY **********
SELECT e.extname AS "Name", e.extversion AS "Version", n.nspname AS "Schema", c.description AS "Description"
FROM pg_catalog.pg_extension e LEFT JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace LEFT JOIN pg_catalog.pg_description c ON c.objoid = e.oid AND c.classoid = 'pg_catalog.pg_extension'::pg_catalog.regclass
ORDER BY 1;
**************************

                               List of installed extensions
      Name       | Version |   Schema   |                   Description                    
-----------------+---------+------------+--------------------------------------------------
 dist_fdw        | 1.0     | pg_catalog | foreign-data wrapper for distfs access
 file_fdw        | 1.0     | pg_catalog | foreign-data wrapper for flat file access
 hdfs_fdw        | 1.0     | pg_catalog | foreign-data wrapper for flat file access
 hstore          | 1.1     | pg_catalog | data type for storing sets of (key, value) pairs
 log_fdw         | 1.0     | pg_catalog | Foreign Data Wrapper for accessing logging data
 mot_fdw         | 1.0     | pg_catalog | foreign-data wrapper for MOT access
 plpgsql         | 1.0     | pg_catalog | PL/pgSQL procedural language
 security_plugin | 1.0     | pg_catalog | provides security functionality
(8 rows)
```

## \\x 语法 \\x\[on|off|auto\] 设置语句的输出模式，模式为行的方式输出，执行 \\x on 切换为以列的方式来显示<a name="section17327185573712"></a>

```
openGauss=# \x 
Expanded display is on.
openGauss=# \dx
********* QUERY **********
SELECT e.extname AS "Name", e.extversion AS "Version", n.nspname AS "Schema", c.description AS "Description"
FROM pg_catalog.pg_extension e LEFT JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace LEFT JOIN pg_catalog.pg_description c ON c.objoid = e.oid AND c.classoid = 'pg_catalog.pg_extension'::pg_catalog.regclass
ORDER BY 1;
**************************

List of installed extensions
-[ RECORD 1 ]-------------------------------------------------
Name        | dist_fdw
Version     | 1.0
Schema      | pg_catalog
Description | foreign-data wrapper for distfs access
-[ RECORD 2 ]-------------------------------------------------
Name        | file_fdw
Version     | 1.0
Schema      | pg_catalog
Description | foreign-data wrapper for flat file access
-[ RECORD 3 ]-------------------------------------------------
```

## \\timing 语法 \\timing \[on|off\] 控制显示SQL的执行时间，默认为off, on 为显示SQL语句的执行时间<a name="section2194756173810"></a>

```
openGauss=# select * from test;
 id 
----
  1
(1 row)

openGauss=# \timing on
Timing is on.
openGauss=# select * from test;
 id 
----
  1
(1 row)

Time: 0.352 ms
```

## \\h 用于获取SQL语句的帮助，例如 \\h merge<a name="section72572395263"></a>

```
openGauss=# \h merge
Command:     MERGE
Description: insert, update, or delete rows of a table based upon source data
Syntax:
MERGE [/*+ plan_hint */] INTO table_name [ [ AS ] alias ]
USING { { table_name | view_name } | subquery } [ [ AS ] alias ]
ON ( condition )
[
  WHEN MATCHED THEN
  UPDATE SET { column_name = { expression | DEFAULT } |
          ( column_name [, ...] ) = ( { expression | DEFAULT } [, ...] ) } [, ...]
  [ WHERE condition ]
]
[
  WHEN NOT MATCHED THEN 
  INSERT { DEFAULT VALUES |
  [ ( column_name [, ...] ) ] VALUES ( { expression | DEFAULT } [, ...] ) [, ...] [ WHERE condition ] }
];
```

## ? 获取gsql的元命令的帮助<a name="section755464719262"></a>

```
openGauss=# \?
General
  \copyright             show openGauss usage and distribution terms
  \g [FILE] or ;         execute query (and send results to file or |pipe)
  \h(\help) [NAME]              help on syntax of SQL commands, * for all commands
  \parallel [on [num]|off] toggle status of execute (currently off)
  \q                     quit gsql

Query Buffer
  \e [FILE] [LINE]       edit the query buffer (or file) with external editor
  \ef [FUNCNAME [LINE]]  edit function definition with external editor
  \p                     show the contents of the query buffer
  \r                     reset (clear) the query buffer
  \w FILE                write query buffer to file

Input/Output
  \copy ...              perform SQL COPY with data stream to the client host
  \echo [STRING]         write string to standard output
  \i FILE                execute commands from file
  \i+ FILE KEY           execute commands from encrypted file
  \ir FILE               as \i, but relative to location of current script
  \ir+ FILE KEY          as \i+, but relative to location of current script
  \o [FILE]              send all query results to file or |pipe
  \qecho [STRING]        write string to query output stream (see \o)
```

## ! os\_command 用于执行操作系统命令，同oracle的 ！，mysql的 system<a name="section17282316182717"></a>

```
openGauss-# \! pwd
/home/omm
openGauss-# \! ls
1.sh  create_db_tables.sql  test.sql
```

## \\o filename 用于重定向输出到文件，注意这个不是简单的将屏幕的内容输出到文本，而是将SQL语句正确执行的结果输出到文本<a name="section14556021132710"></a>

```
openGauss-# \o test.out
openGauss-# select * from test;
WARNING:  Session unused timeout.
FATAL:  terminating connection due to administrator command
could not send data to server: Broken pipe
The connection to the server was lost. Attempting reset: Succeeded.
openGauss=# select * from test;
openGauss=# \! cat test.out
 id 
----
  1
(1 row)

openGauss=# select * from pg_tables;
openGauss=#  \! cat test.out
 id 
----
  1
(1 row)

     schemaname     |           tablename           | tableowner | tablespace | hasindexes | hasrules | hastriggers | tablecreator |            created            |         last_ddl_time         
--------------------+-------------------------------+------------+------------+------------+----------+-------------+--------------+-------------------------------+-------------------------------
 pg_catalog         | pg_statistic                  | omm        |            | t          | f        | f           |              |                               | 

\i file.sql
```

## \\conninfo 显示gsql中显示会话的连接信息<a name="section56126539279"></a>

## \\c\[onnect\] \[DBNAME\] 切换数据库<a name="section156734474276"></a>

```
openGauss=# \conninfo
You are connected to database "postgres" as user "omm" via socket in "/opt/huawei/tmp" at port "15400".
openGauss=# \c mydb
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "mydb" as user "omm".
mydb=# \conninfo
You are connected to database "mydb" as user "omm" via socket in "/opt/huawei/tmp" at port "15400".
```

## \\echo \[string\] 打印字符串<a name="section765219710281"></a>

```
mydb=# \echo Hello World!
Hello World!
```

## \\q 退出gsql<a name="section213351982819"></a>

