---
title: 'MogDB/openGauss学习笔记-获取对象DDL'

date: '2022-05-18'

category: 'blog'
tags: ['MogDB/openGauss学习笔记-获取对象DDL']

archives: '2022-05'

author: '云和恩墨-范计杰'

summary: 'MogDB/openGauss学习笔记-获取对象DDL'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# MogDB/openGauss 学习笔记-获取对象 DDL

本文出处：[https://www.modb.pro/db/399230](https://www.modb.pro/db/399230)

## 内置函数

```
omm2=# \df *def                                                                      List of functions   Schema   |         Name         | Result data type |                   Argument data types                    |  Type  | fencedmode | propackage | prokind ------------+----------------------+------------------+----------------------------------------------------------+--------+------------+------------+--------- pg_catalog | pg_get_constraintdef | text             | oid                                                      | normal | f          | f          | f pg_catalog | pg_get_constraintdef | text             | oid, boolean                                             | normal | f          | f          | f pg_catalog | pg_get_functiondef   | record           | funcid oid, OUT headerlines integer, OUT definition text | normal | f          | f          | f pg_catalog | pg_get_indexdef      | text             | oid                                                      | normal | f          | f          | f pg_catalog | pg_get_indexdef      | text             | oid, boolean                                             | normal | f          | f          | f pg_catalog | pg_get_indexdef      | text             | oid, integer, boolean                                    | normal | f          | f          | f pg_catalog | pg_get_ruledef       | text             | oid                                                      | normal | f          | f          | f pg_catalog | pg_get_ruledef       | text             | oid, boolean                                             | normal | f          | f          | f pg_catalog | pg_get_tabledef      | text             | regclass                                                 | normal | f          | f          | f pg_catalog | pg_get_triggerdef    | text             | oid                                                      | normal | f          | f          | f pg_catalog | pg_get_triggerdef    | text             | oid, boolean                                             | normal | f          | f          | f pg_catalog | pg_get_viewdef       | text             | oid                                                      | normal | f          | f          | f pg_catalog | pg_get_viewdef       | text             | oid, boolean                                             | normal | f          | f          | f pg_catalog | pg_get_viewdef       | text             | oid, integer                                             | normal | f          | f          | f pg_catalog | pg_get_viewdef       | text             | text                                                     | normal | f          | f          | f pg_catalog | pg_get_viewdef       | text             | text, boolean                                            | normal | f          | f          | f (16 rows)
```

## 示例

### 获取表的 DDL

```
omm2=# select pg_get_tabledef('t');
                    pg_get_tabledef
--------------------------------------------------------
 SET search_path = public;                             +
 CREATE TABLE t (                                      +
         id numeric,                                   +
         c character varying(100)                      +
 )                                                     +
 WITH (orientation=row, fillfactor=50, compression=no);
(1 row)

omm2=# \x
Expanded display is on.
omm2=# select pg_get_tabledef('t');
-[ RECORD 1 ]---+-------------------------------------------------------
pg_get_tabledef | SET search_path = public;
                | CREATE TABLE t (
                |         id numeric,
                |         c character varying(100)
                | )
                | WITH (orientation=row, fillfactor=50, compression=no);
```

### 获取索引 DDL

```
omm2=# select pg_get_indexdef('idx_t_id'::regclass);
                          pg_get_indexdef
-------------------------------------------------------------------
 CREATE INDEX idx_t_id ON t USING btree (id) TABLESPACE pg_default
(1 row)

还可以直接查询视图
omm2=# \x
Expanded display is on.
omm2=# select * from pg_indexes where indexname='idx_t_id';
-[ RECORD 1 ]-----------------------------------------------------------------
schemaname | public
tablename  | t
indexname  | idx_t_id
tablespace |
indexdef   | CREATE INDEX idx_t_id ON t USING btree (id) TABLESPACE pg_default
```

## 通过 gs_dump 生成 ddl

这样还可以生成表及表上的索引定义等
$ gs_dump -t t –section pre-data omm2

```
$ gs_dump -t t --section pre-data omm2

SET statement_timeout = 0;
SET xmloption = content;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

SET search_path = public;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: t; Type: TABLE; Schema: public; Owner: omm2; Tablespace:
--

CREATE TABLE t (
    id numeric,
    c character varying(100)
)
WITH (orientation=row, fillfactor=50, compression=no);


ALTER TABLE public.t OWNER TO omm2;
```

$ gs_dump -t t –section post-data omm2

```
$ gs_dump -t t --section post-data omm2

SET statement_timeout = 0;
SET xmloption = content;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

SET search_path = public;

SET default_tablespace = '';

--
-- Name: idx_t_id; Type: INDEX; Schema: public; Owner: omm2; Tablespace:
--

CREATE INDEX idx_t_id ON t USING btree (id) TABLESPACE pg_default;
```
