+++
sqltitle = "openGauss升级脚本撰写经验总结"
date = "2021-04-20"
tags = ["openGauss升级脚本撰写经验总结"]
archives = "2021-09-30"
author = "shirley_zhengx"
summary = "openGauss升级脚本撰写经验总结"
img = "/zh/post/zhengxue/title/img1.png"
times = "9:30"

+++

[TOC]



## 1. Function

正向

```sql
DROP FUNCTION IF EXISTS pg_catalog.gin_compare_jsonb(text, text) CASCADE;

SET LOCAL inplace_upgrade_next_system_object_oids = IUO_PROC, 3498;

CREATE FUNCTION pg_catalog.gin_compare_jsonb (
     text, text
) RETURNS integer LANGUAGE INTERNAL IMMUTABLE STRICT as 'gin_compare_jsonb';
```



反向

```
DROP FUNCTION IF EXISTS pg_catalog.gin_compare_jsonb(text, text) CASCADE;
```



语法： http://postgres.cn/docs/12/sql-createtype.html

系统表： http://postgres.cn/docs/12/catalog-pg-type.html

注意函数属性、函数参数，可以参考------升级脚本生成sql模板。

函数参数列表基本使用 \df 查看到的结果就可以。但是drop语句中的参数列表不可以带默认值。




## 2.Type

正向

```sql
--第一步：设置GUC参数，指定oid
SET LOCAL inplace_upgrade_next_system_object_oids = IUO_TYPE, 3838, 0, p; -- oid, 数组类型oid，type类型
--第二步：创建shell类型
CREATE TYPE pg_catalog.event_trigger;
-- 第三步：创建event_trigger类型的input、output、send、recv函数等，参考function
SET LOCAL inplace_upgrade_next_system_object_oids = IUO_PROC, 3594;
CREATE FUNCTION pg_catalog.event_trigger_in(cstring)… …
-- 第四步：再次创建该类型，完善所有信息
CREATE TYPE pg_catalog.event_trigger (input=event_trigger_in,output=event_trigger_out,internallength=4,passedbyvalue,CATEGORY=p);
```

反向

```sql
--第一步：删除输入输出函数
DROP FUNCTION IF EXISTS pg_catalog.event_trigger_in(cstring);
DROP FUNCTION IF EXISTS pg_catalog.event_trigger_out(pg_catalog.event_trigger);
--第二步：删除类型
DROP FUNCTION IF EXISTS pg_catalog.event_trigger;
```



语法： http://postgres.cn/docs/12/sql-createtype.html

系统视图： http://postgres.cn/docs/12/catalog-pg-type.html



## 3.Aggregate
正向

```sql
-- 第一步，创建agg的阶段函数，参考function
CREATE FUNCTION pg_catalog.json_object_agg_transfn…
-- 第二步，创建agg函数
drop aggregate if exists pg_catalog.json_object_agg("any", "any");
SET LOCAL inplace_upgrade_next_system_object_oids=IUO_PROC, 3403;
create aggregate pg_catalog.json_object_agg("any", "any") (SFUNC=json_object_agg_transfn, STYPE= internal, finalfunc = json_object_agg_finalfn);
```

反向

```
-- 第一步，删除agg函数
drop aggregate if exists pg_catalog.json_object_agg("any", "any");
-- 第二步，删除agg阶段函数，参考function
DROP FUNCTION IF EXISTS pg_catalog.json_object_agg_transfn…
```



语法： http://postgres.cn/docs/12/sql-createaggregate.html

系统表： http://postgres.cn/docs/12/catalog-pg-aggregate.html



## 4.通用对象插入函数模板：

```sql
CREATE OR REPLACE FUNCTION Insert_pg_opclass_temp(
IN icmethod integer,
IN icname text,
IN icnamespace integer,
IN icowner integer,
IN icfamily integer,
IN icintype integer,
IN icdefault boolean,
IN ickeytype integer
)
RETURNS void
AS $$
DECLARE
 row_name record;
 query_str_nodes text;
BEGIN
 query_str_nodes := 'select * from dbe_perf.node_name';
 FOR row_name IN EXECUTE(query_str_nodes) LOOP
 insert into pg_catalog.pg_opclass values (icmethod, icname, icnamespace, icowner, icfamily, icintype, icdefault, ickeytype);
 END LOOP;
 return;
END; $$
LANGUAGE 'plpgsql';
SET LOCAL inplace_upgrade_next_system_object_oids = IUO_GENERAL, 4033;
select Insert_pg_opclass_temp(403, 'jsonb_ops', 11, 10, 4033, 3802, true, 0);
DROP FUNCTION Insert_pg_opclass_temp();
```



## 5.通用对象删除函数模板：

```sql
CREATE OR REPLACE FUNCTION Delete_pg_opclass_temp()
RETURNS void
AS $$
DECLARE
row_name record;
query_str text;
query_str_nodes text;
BEGIN
 query_str_nodes := 'select * from dbe_perf.node_name';
 FOR row_name IN EXECUTE(query_str_nodes) LOOP
 delete from pg_catalog.pg_opclass where opcfamily in (4033, 4034, 4035, 4036, 4037);
 END LOOP;
return;
END;
$$ LANGUAGE 'plpgsql';
SELECT Delete_pg_opclass_temp();
DROP FUNCTION Delete_pg_opclass_temp();
```



## 6.升级脚本生成sql模板

```
create table addfuncs(name varchar(100)); insert into addfuncs values('gin_compare_jsonb'), …
SELECT format(
'DROP FUNCTION IF EXISTS pg_catalog.%s(%s) CASCADE;
SET LOCAL inplace_upgrade_next_system_object_oids = IUO_PROC, %s;
CREATE FUNCTION pg_catalog.%s (
%s
) RETURNS %s LANGUAGE INTERNAL %s %s as ''%s'';
%s',
 proname,
 pg_catalog.pg_get_function_arguments(oid),
 oid,
 proname,
 pg_catalog.pg_get_function_arguments(oid),
 pg_catalog.pg_get_function_result(oid),
 case when provolatile='i' then 'IMMUTABLE' when provolatile='s' then 'STABLE' when provolatile='v' then 'VOLATILE' END, 
 case when proisstrict = 't' then 'STRICT' else '' end, 
 prosrc,
 case when proisagg='t' or proiswindow='t' then '--ERROR: THIS FUNCTION ABOVE IS AN AGG OR WINDOW' end)
FROM pg_proc
WHERE proname in (select name from addfuncs);
```



