+++

title = "MogDB数据库导出指定schema数据并恢复到其他数据库" 

date = "2022-04-12" 

tags = ["MogDB数据库导出指定schema数据并恢复到其他数据库"] 

archives = "2022-04" 

author = "tracy" 

summary = "MogDB数据库导出指定schema数据并恢复到其他数据库"

img = "/zh/post/tracy/title/img20.png" 

times = "10:20"
+++

# MogDB数据库导出指定schema数据并恢复到其他数据库

本文出处：https://www.modb.pro/db/76290



## 1.环境概述

MogDB版本：1.1.0
操作系统版本：Centos7.6

## 2.备份及恢复步骤

### 2.1. 备份OA业务数据

**1.omm用户，使用gs_dump备份数据：**

```sql
–执行命令前，先确认omm用户对目录/opt/dump_oa/具有写权限
$ ll /opt/|grep dump
drwxr-xr-x 2 omm dbgrp 4096 May 28 15:16 dump_oa
–执行如下命令进行数据导出：
$ nohup gs_dump mogdb -n oa -n schema2 -F c -f /opt/dump_oa/schema_2.dmp > /opt/dump_oa/schema_2.log 2>&1 &
```

–查看日志,出现如下字样，表示导出成功：

```sql
$ tail schema_2.log
nohup: ignoring input
gs_dump[port=‘5432’][mogdb][2021-05-28 15:07:56]: The total objects number is 1516.
gs_dump[port=‘5432’][mogdb][2021-05-28 15:07:57]: [100.00%] 1516 objects have been dumped.
gs_dump[port=‘5432’][mogdb][2021-05-28 15:12:39]: dump database mogdb successfully
gs_dump[port=‘5432’][mogdb][2021-05-28 15:12:39]: total time: 285166 ms
```

**2.导出创建同义词SQL脚本**

```sql
$gsql -d mogdb -t -c “select ‘create synonym ‘||n.nspname||’.’||s.synname||’ for ||s.synobjschema||’.’||s.synobjname||’;’ from pg_synonym s,pg_namespace n,pg_user u where u.usesysid=s.synowner and n.oid=s.synnamespace and n.nspname in( ‘oa’,‘schema2’);” > /opt/dump_oa/create_synonym.sql
```

### 2.2. 创建恢复数据库

```sql
$gsql -d mogdb -r
mogdb=# CREATE DATABASE dump_oa DBCOMPATIBILITY ‘PG’ OWNER oa;
CREATE DATABASE
```

### 2.3. 恢复数据

**1.使用gs_restore命令导入数据：**

```sql
$ nohup gs_restore -d dump_oa -v /opt/dump_oa/schema_2.dmp > /opt/dump_oa/out_restore_schema.log 2>&1 &
```

–查看日志,出现如下字样，表示导出成功：

```sql
[omm@DC8VDJNK2-R730 dump_oa]$ tail out_restore_schema.log
setting owner and privileges for FK CONSTRAINT “oa.fk_myoa_approve_rule_param_1”
setting owner and privileges for FK CONSTRAINT “oa.fk_myoa_approve_task_node”
setting owner and privileges for FK CONSTRAINT “oa.fk_myoa_cussystem_bus_type_1”
setting owner and privileges for FK CONSTRAINT “oa.fk_myoa_handle_group_1”
setting owner and privileges for FK CONSTRAINT “oa.fk_myoa_movement_1”
setting owner and privileges for FK CONSTRAINT “oa.fk_myoa_procedure_1”
setting owner and privileges for FK CONSTRAINT “oa.fk_um_organ__parent_id”
setting owner and privileges for FK CONSTRAINT “oa.groupid”
restore operation successful
total time: 703605 ms
```

**2.导入同义词：**

```sql
$ gsql -d dump_oa -U oa -f /ulic/soft/mogdb/mtk/oa_create_synonym.sql
Password for user oa:
…
CREATE SYNONYM
CREATE SYNONYM
total time: 481 ms
```

