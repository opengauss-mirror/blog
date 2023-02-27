---
title: 'openGauss gsql 常用元命令 一'

date: '2022-01-10'

category: 'blog'
tags: ['openGauss gsql 常用元命令 一']

archives: '2022-01'

author: '晨辉'

summary: 'openGauss gsql 常用元命令 一'

img: '/zh/blogs/2022/title/img12.png'

times: '12:30'
---

# openGauss gsql 常用元命令 一<a name="ZH-CN_TOPIC_0000001243697053"></a>

## 连接数据库 使用 -E 参数可以显示元命令具体执行的 SQL 信息<a name="section91657271219"></a>

```
[omm@og1 ~]$ gsql -d postgres -p15400 -E
gsql ((openGauss 2.1.0 build 590b0f8e) compiled at 2021-09-30 14:29:04 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.
```

## \\l 显示数据库中数据库信息<a name="section21517444219"></a>

```
openGauss=# \l
********* QUERY **********
SELECT d.datname as "Name",
       pg_catalog.pg_get_userbyid(d.datdba) as "Owner",
       pg_catalog.pg_encoding_to_char(d.encoding) as "Encoding",
       d.datcollate as "Collate",
       d.datctype as "Ctype",
       pg_catalog.array_to_string(d.datacl, E'\n') AS "Access privileges"
FROM pg_catalog.pg_database d
ORDER BY 1;
**************************

                             List of databases
   Name    | Owner | Encoding |  Collate   |   Ctype    | Access privileges
-----------+-------+----------+------------+------------+-------------------
 mydb      | omm   | UTF8     | en_US.utf8 | en_US.utf8 |
 postgres  | omm   | UTF8     | en_US.utf8 | en_US.utf8 |
 studentdb | omm   | UTF8     | en_US.utf8 | en_US.utf8 |
 template0 | omm   | UTF8     | en_US.utf8 | en_US.utf8 | =c/omm           +
           |       |          |            |            | omm=CTc/omm
 template1 | omm   | UTF8     | en_US.utf8 | en_US.utf8 | =c/omm           +
           |       |          |            |            | omm=CTc/omm
(5 rows)
```

## \\du 同\\dg 显示数据库中所有用户和角色<a name="section144791417202213"></a>

```
openGauss=# \du
********* QUERY **********
SELECT r.rolname, r.rolsuper, r.rolinherit,
  r.rolcreaterole, r.rolcreatedb, r.rolcanlogin,
  r.rolconnlimit, r.rolvalidbegin, r.rolvaliduntil,
  ARRAY(SELECT b.rolname
        FROM pg_catalog.pg_auth_members m
        JOIN pg_catalog.pg_roles b ON (m.roleid = b.oid)
        WHERE m.member = r.oid) as memberof
, r.rolreplication
, r.rolauditadmin
, r.rolsystemadmin
, r.rolmonitoradmin
, r.roloperatoradmin
, r.rolpolicyadmin
, r.roluseft
, r.rolkind
FROM pg_catalog.pg_roles r
WHERE r.rolname not in ('gs_role_copy_files', 'gs_role_signal_backend', 'gs_role_tablespace', 'gs_role_replication', 'gs_role_account_lock', 'gs_role_pldebugger')
ORDER BY 1;
**************************

                                                              List of roles
 Role name |                                                    Attributes                                                    | Member of
-----------+------------------------------------------------------------------------------------------------------------------+-----------
 omm       | Sysadmin, Create role, Create DB, Replication, Administer audit, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}
 student   | Sysadmin                                                                                                         | {}

openGauss=# \dg
********* QUERY **********
SELECT r.rolname, r.rolsuper, r.rolinherit,
  r.rolcreaterole, r.rolcreatedb, r.rolcanlogin,
  r.rolconnlimit, r.rolvalidbegin, r.rolvaliduntil,
  ARRAY(SELECT b.rolname
        FROM pg_catalog.pg_auth_members m
        JOIN pg_catalog.pg_roles b ON (m.roleid = b.oid)
        WHERE m.member = r.oid) as memberof
, r.rolreplication
, r.rolauditadmin
, r.rolsystemadmin
, r.rolmonitoradmin
, r.roloperatoradmin
, r.rolpolicyadmin
, r.roluseft
, r.rolkind
FROM pg_catalog.pg_roles r
WHERE r.rolname not in ('gs_role_copy_files', 'gs_role_signal_backend', 'gs_role_tablespace', 'gs_role_replication', 'gs_role_account_lock', 'gs_role_pldebugger')
ORDER BY 1;
**************************

                                                              List of roles
 Role name |                                                    Attributes                                                    | Member of
-----------+------------------------------------------------------------------------------------------------------------------+-----------
 omm       | Sysadmin, Create role, Create DB, Replication, Administer audit, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}
 student   | Sysadmin                                                                                                         | {}
```

## \\db 显示数据库中所有表空间信息<a name="section199772782220"></a>

```
openGauss=# \db
********* QUERY **********
SELECT spcname AS "Name",
  pg_catalog.pg_get_userbyid(spcowner) AS "Owner",
  pg_catalog.pg_tablespace_location(oid) AS "Location"
FROM pg_catalog.pg_tablespace
ORDER BY 1;
**************************

             List of tablespaces
    Name    | Owner |        Location
------------+-------+------------------------
 pg_default | omm   |
 pg_global  | omm   |
 student_ts | omm   | tablespace/student_ts1
(3 rows)
```

## \\dn 显示数据库中所有 schema 信息<a name="section13383535221"></a>

```
openGauss=# \dn
********* QUERY **********
SELECT n.nspname AS "Name",
  pg_catalog.pg_get_userbyid(n.nspowner) AS "Owner"
FROM pg_catalog.pg_namespace n
WHERE n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'
ORDER BY 1;
**************************

     List of schemas
      Name      |  Owner
----------------+---------
 blockchain     | omm
 cstore         | omm
 db4ai          | omm
 dbe_perf       | omm
 dbe_pldebugger | omm
 pkg_service    | omm
 pmk            | omm
 public         | omm
 snapshot       | omm
 sqladvisor     | omm
 student        | student
(11 rows)
```

## \\d 显示当前数据库下相关数据库对象信息\(包含表、视图、物化视图、序列、外部表、stream\\ contview\)<a name="section16802210102312"></a>

```
openGauss=# \d
********* QUERY **********
SELECT n.nspname as "Schema",
  c.relname as "Name",
  CASE c.relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' WHEN 'i' THEN 'index' WHEN 'I' THEN 'global partition index' WHEN 'S' THEN 'sequence' WHEN 's' THEN 'special' WHEN 'f' THEN 'foreign table' WHEN 'm' THEN 'materialized view'  WHEN 'e' THEN 'stream' WHEN 'o' THEN 'contview' END as "Type",
  pg_catalog.pg_get_userbyid(c.relowner) as "Owner",
  c.reloptions as "Storage"
FROM pg_catalog.pg_class c
     LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r','v','m','S','f','e','o','')
      AND n.nspname <> 'pg_catalog'
      AND n.nspname <> 'db4ai'
      AND n.nspname <> 'information_schema'
      AND n.nspname !~ '^pg_toast'
      AND c.relname not like 'matviewmap_%'
      AND c.relname not like 'mlog_%'
  AND pg_catalog.pg_table_is_visible(c.oid)
ORDER BY 1,2;
**************************

                         List of relations
 Schema |  Name  | Type  | Owner |             Storage
--------+--------+-------+-------+----------------------------------
 public | test   | table | omm   | {orientation=row,compression=no}
 public | v_test | view  | omm   |
(2 rows)
```

## \\d tablename 查看某个表的详细信息<a name="section3865423172312"></a>

```
openGauss=# \d test
********* QUERY **********
SELECT c.oid,
  n.nspname,
  c.relname
FROM pg_catalog.pg_class c
     LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname ~ '^(test)$'
  AND pg_catalog.pg_table_is_visible(c.oid)
ORDER BY 2, 3;
**************************

********* QUERY **********
SELECT c.relchecks, c.relkind, c.relhasindex, c.relhasrules, c.relhastriggers, c.relhasoids, '', c.reltablespace, CASE WHEN c.reloftype = 0 THEN '' ELSE c.reloftype::pg_catalog.regtype::pg_catalog.text END, c.relpersistence,c.relhasclusterkey, c.relreplident, (select count(1) as haspolicy from pg_catalog.pg_class WHERE relname = 'pg_rlspolicy')
FROM pg_catalog.pg_class c
 LEFT JOIN pg_catalog.pg_class tc ON (c.reltoastrelid = tc.oid)
WHERE c.oid = '16575';
**************************

********* QUERY **********
SELECT * FROM pg_catalog.pg_class WHERE relname = 'gs_encrypted_columns' AND relnamespace = 11;
**************************

********* QUERY **********
SELECT a.attname,
  pg_catalog.format_type(a.atttypid, a.atttypmod),
  (SELECT substring(pg_catalog.pg_get_expr(d.adbin, d.adrelid) for 176)
   FROM pg_catalog.pg_attrdef d
   WHERE d.adrelid = a.attrelid AND d.adnum = a.attnum AND a.atthasdef),
  a.attnotnull, a.attnum,
  (SELECT c.collname FROM pg_catalog.pg_collation c, pg_catalog.pg_type t
   WHERE c.oid = a.attcollation AND t.oid = a.atttypid AND a.attcollation <> t.typcollation) AS attcollation,
  NULL AS indexdef,
  NULL AS attfdwoptions,
 (SELECT pg_catalog.format_type (a.atttypmod, g.data_type_original_mod) AS clientlogic_original_type FROM  gs_encrypted_columns g WHERE g.column_name = a.attname  AND g.rel_id = 16575group by g.data_type_original_oid, g.data_type_original_mod),
(SELECT g.data_type_original_oid AS clientlogic_original_type_oid FROM  gs_encrypted_columns g WHERE g.column_name = a.attname  AND g.rel_id = 16575group by g.data_type_original_oid, g.data_type_original_mod),
 (SELECT  h.adgencol
   FROM pg_catalog.pg_attrdef h
   WHERE h.adrelid = a.attrelid AND h.adnum = a.attnum AND a.atthasdef) AS generated_column
FROM pg_catalog.pg_attribute a
WHERE a.attrelid = '16575' AND a.attnum > 0 AND NOT a.attisdropped AND a.attkvtype != 4 AND a.attname <> 'tableoid' AND a.attname <> 'tablebucketid'
ORDER BY a.attnum;
**************************

********* QUERY **********
SELECT c2.relname, i.indisprimary, i.indisunique, i.indisclustered, i.indisvalid, pg_catalog.pg_get_indexdef(i.indexrelid, 0, true),
  pg_catalog.pg_get_constraintdef(con.oid, true), contype, condeferrable, condeferred, i.indisreplident, c2.reltablespace, i.indisusable
FROM pg_catalog.pg_class c, pg_catalog.pg_class c2, pg_catalog.pg_index i
  LEFT JOIN pg_catalog.pg_constraint con ON (conrelid = i.indrelid AND conindid = i.indexrelid AND contype IN ('p','u','x'))
WHERE c.oid = '16575' AND c.oid = i.indrelid AND i.indexrelid = c2.oid
ORDER BY i.indisprimary DESC, i.indisunique DESC, c2.relname;
**************************

********* QUERY **********
SELECT pol.policyname, pol.policypermissive, trim(pol.policyroles::text, '{}'), pol.policyqual, pol.policycmd
FROM pg_catalog.pg_rlspolicies pol
LEFT JOIN pg_catalog.pg_namespace N on (N.nspname = pol.schemaname)
LEFT JOIN pg_catalog.pg_class C on (pol.tablename = C.relname and C.relnamespace = N.oid)
WHERE C.oid = '16575' ORDER BY 1;
**************************

********* QUERY **********
SELECT c.oid::pg_catalog.regclass FROM pg_catalog.pg_class c, pg_catalog.pg_inherits i WHERE c.oid=i.inhparent AND i.inhrelid = '16575' ORDER BY inhseqno;
**************************

********* QUERY **********
SELECT c.oid::pg_catalog.regclass FROM pg_catalog.pg_class c, pg_catalog.pg_inherits i WHERE c.oid=i.inhrelid AND i.inhparent = '16575' ORDER BY c.oid::pg_catalog.regclass::pg_catalog.text;
**************************

********* QUERY **********
select partkey,partstrategy from pg_partition where parentid = 16575 order by partkey
**************************

     Table "public.test"
 Column |  Type   | Modifiers
--------+---------+-----------
 id     | integer |
Indexes:
    "idx_id_test" btree (id) TABLESPACE pg_default

openGauss=#
```

## \\dt 显示当前数据库中所有的表<a name="section984353212413"></a>

```
openGauss=# \dt
********* QUERY **********
SELECT n.nspname as "Schema",
  c.relname as "Name",
  CASE c.relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' WHEN 'i' THEN 'index' WHEN 'I' THEN 'global partition index' WHEN 'S' THEN 'sequence' WHEN 's' THEN 'special' WHEN 'f' THEN 'foreign table' WHEN 'm' THEN 'materialized view'  WHEN 'e' THEN 'stream' WHEN 'o' THEN 'contview' END as "Type",
  pg_catalog.pg_get_userbyid(c.relowner) as "Owner",
  c.reloptions as "Storage"
FROM pg_catalog.pg_class c
     LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r','')
      AND n.nspname <> 'pg_catalog'
      AND n.nspname <> 'db4ai'
      AND n.nspname <> 'information_schema'
      AND n.nspname !~ '^pg_toast'
      AND c.relname not like 'matviewmap_%'
      AND c.relname not like 'mlog_%'
  AND pg_catalog.pg_table_is_visible(c.oid)
ORDER BY 1,2;
**************************

                        List of relations
 Schema | Name | Type  | Owner |             Storage
--------+------+-------+-------+----------------------------------
 public | test | table | omm   | {orientation=row,compression=no}
(1 row)
```

## \\dt+ 以扩展方式显示当前数据库所有表信息，比起\\dt 多了最后一列描述信息<a name="section1320115418259"></a>

```
openGauss=# \dt+
********* QUERY **********
SELECT n.nspname as "Schema",
  c.relname as "Name",
  CASE c.relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' WHEN 'i' THEN 'index' WHEN 'I' THEN 'global partition index' WHEN 'S' THEN 'sequence' WHEN 's' THEN 'special' WHEN 'f' THEN 'foreign table' WHEN 'm' THEN 'materialized view'  WHEN 'e' THEN 'stream' WHEN 'o' THEN 'contview' END as "Type",
  pg_catalog.pg_get_userbyid(c.relowner) as "Owner",
  pg_catalog.pg_size_pretty(pg_catalog.pg_table_size(c.oid)) as "Size",
  c.reloptions as "Storage",
  pg_catalog.obj_description(c.oid, 'pg_class') as "Description"
FROM pg_catalog.pg_class c
     LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r','')
      AND n.nspname <> 'pg_catalog'
      AND n.nspname <> 'db4ai'
      AND n.nspname <> 'information_schema'
      AND n.nspname !~ '^pg_toast'
      AND c.relname not like 'matviewmap_%'
      AND c.relname not like 'mlog_%'
  AND pg_catalog.pg_table_is_visible(c.oid)
ORDER BY 1,2;
**************************

                                    List of relations
 Schema | Name | Type  | Owner |  Size   |             Storage              | Description
--------+------+-------+-------+---------+----------------------------------+-------------
 public | test | table | omm   | 0 bytes | {orientation=row,compression=no} |
(1 row)
```

## \\di 查看当前数据库中索引信息<a name="section16259017142614"></a>

```
openGauss=# \di
********* QUERY **********
SELECT n.nspname as "Schema",
  c.relname as "Name",
  CASE c.relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' WHEN 'i' THEN 'index' WHEN 'I' THEN 'global partition index' WHEN 'S' THEN 'sequence' WHEN 's' THEN 'special' WHEN 'f' THEN 'foreign table' WHEN 'm' THEN 'materialized view'  WHEN 'e' THEN 'stream' WHEN 'o' THEN 'contview' END as "Type",
  pg_catalog.pg_get_userbyid(c.relowner) as "Owner",
 c2.relname as "Table",
  c.reloptions as "Storage"
FROM pg_catalog.pg_class c
     LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
     LEFT JOIN pg_catalog.pg_index i ON i.indexrelid = c.oid
     LEFT JOIN pg_catalog.pg_class c2 ON i.indrelid = c2.oid
WHERE c.relkind IN ('i','I','')
      AND n.nspname <> 'pg_catalog'
      AND n.nspname <> 'db4ai'
      AND n.nspname <> 'information_schema'
      AND n.nspname !~ '^pg_toast'
      AND c.relname not like 'matviewmap_%'
      AND c.relname not like 'mlog_%'
  AND pg_catalog.pg_table_is_visible(c.oid)
ORDER BY 1,2;
**************************

                   List of relations
 Schema |    Name     | Type  | Owner | Table | Storage
--------+-------------+-------+-------+-------+---------
 public | idx_id_test | index | omm   | test  |
(1 row)
```

## \\di indexname 查看当前数据库某个索引的信息<a name="section6690144592612"></a>

```
openGauss=# \di idx_id_test
********* QUERY **********
SELECT n.nspname as "Schema",
  c.relname as "Name",
  CASE c.relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' WHEN 'i' THEN 'index' WHEN 'I' THEN 'global partition index' WHEN 'S' THEN 'sequence' WHEN 's' THEN 'special' WHEN 'f' THEN 'foreign table' WHEN 'm' THEN 'materialized view'  WHEN 'e' THEN 'stream' WHEN 'o' THEN 'contview' END as "Type",
  pg_catalog.pg_get_userbyid(c.relowner) as "Owner",
 c2.relname as "Table",
  c.reloptions as "Storage"
FROM pg_catalog.pg_class c
     LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
     LEFT JOIN pg_catalog.pg_index i ON i.indexrelid = c.oid
     LEFT JOIN pg_catalog.pg_class c2 ON i.indrelid = c2.oid
WHERE c.relkind IN ('i','I','s','')
      AND n.nspname !~ '^pg_toast'
      AND c.relname not like 'matviewmap_%'
      AND c.relname not like 'mlog_%'
  AND c.relname ~ '^(idx_id_test)$'
  AND pg_catalog.pg_table_is_visible(c.oid)
ORDER BY 1,2;
**************************

                   List of relations
 Schema |    Name     | Type  | Owner | Table | Storage
--------+-------------+-------+-------+-------+---------
 public | idx_id_test | index | omm   | test  |
(1 row)
```

## \\dv 查看当前数据库视图信息<a name="section105538585269"></a>

```
openGauss=# \dv
********* QUERY **********
SELECT n.nspname as "Schema",
  c.relname as "Name",
  CASE c.relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' WHEN 'i' THEN 'index' WHEN 'I' THEN 'global partition index' WHEN 'S' THEN 'sequence' WHEN 's' THEN 'special' WHEN 'f' THEN 'foreign table' WHEN 'm' THEN 'materialized view'  WHEN 'e' THEN 'stream' WHEN 'o' THEN 'contview' END as "Type",
  pg_catalog.pg_get_userbyid(c.relowner) as "Owner",
  c.reloptions as "Storage"
FROM pg_catalog.pg_class c
     LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('v','')
      AND n.nspname <> 'pg_catalog'
      AND n.nspname <> 'db4ai'
      AND n.nspname <> 'information_schema'
      AND n.nspname !~ '^pg_toast'
      AND c.relname not like 'matviewmap_%'
      AND c.relname not like 'mlog_%'
  AND pg_catalog.pg_table_is_visible(c.oid)
ORDER BY 1,2;
**************************

            List of relations
 Schema |  Name  | Type | Owner | Storage
--------+--------+------+-------+---------
 public | v_test | view | omm   |
(1 row)
```

## \\ds 查看当前数据库序列信息<a name="section8587171216278"></a>

```
openGauss=# \ds
********* QUERY **********
SELECT n.nspname as "Schema",
  c.relname as "Name",
  CASE c.relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' WHEN 'i' THEN 'index' WHEN 'I' THEN 'global partition index' WHEN 'S' THEN 'sequence' WHEN 's' THEN 'special' WHEN 'f' THEN 'foreign table' WHEN 'm' THEN 'materialized view'  WHEN 'e' THEN 'stream' WHEN 'o' THEN 'contview' END as "Type",
  pg_catalog.pg_get_userbyid(c.relowner) as "Owner",
  c.reloptions as "Storage"
FROM pg_catalog.pg_class c
     LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('S','')
      AND n.nspname <> 'pg_catalog'
      AND n.nspname <> 'db4ai'
      AND n.nspname <> 'information_schema'
      AND n.nspname !~ '^pg_toast'
      AND c.relname not like 'matviewmap_%'
      AND c.relname not like 'mlog_%'
  AND pg_catalog.pg_table_is_visible(c.oid)
ORDER BY 1,2;
**************************

             List of relations
 Schema | Name |   Type   | Owner | Storage
--------+------+----------+-------+---------
 public | sq1  | sequence | omm   |
(1 row)
```
