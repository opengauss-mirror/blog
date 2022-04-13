+++

title = "MogDB报错 - ERROR: role cannot be dropped because some objects depend on it DETAIL: 1 object in database处理" 

date = "2022-04-13" 

tags = ["MogDB报错 - ERROR: role cannot be dropped because some objects depend on it DETAIL: 1 object in database处理"] 

archives = "2022-04" 

author = "云和恩墨" 

summary = "MogDB报错 - ERROR: role cannot be dropped because some objects depend on it DETAIL: 1 object in database处理"

img = "/zh/post/enmo/title/img6.png" 

times = "10:20"
+++

# MogDB报错 - ERROR: role cannot be dropped because some objects depend on it DETAIL: 1 object in database处理

本文出处：https://www.modb.pro/db/336198

版本：MogDB V2.0.1

**删除用户时，报错：**

```sql
postgres=# \dg
                                                              List of roles
 Role name |                                                    Attributes                                                    | Member of 
-----------+------------------------------------------------------------------------------------------------------------------+-----------
 itsm      | Create DB, Cannot login                                                                                          | {}
 omm       | Sysadmin, Create role, Create DB, Replication, Administer audit, Monitoradmin, Operatoradmin, Policyadmin, UseFT | {}

postgres=# drop role itsm;
ERROR:  role "itsm" cannot be dropped because some objects depend on it
DETAIL:  1 object in database itsm
```

**检查业务进程，是否存在用户进程，如果有的话，断连进程**

```sql
postgres=# select datname,usename,state,count(*) 
   from pg_stat_activity 
   group by datname,usename,state order by 4 desc;

 datname  | usename | state  | count 
----------+---------+--------+-------
 postgres | omm     | active |     3
 postgres | omm     | idle   |     2
 itsm     | omm     | active |     1
(3 rows)
```

**检查itsm角色的对象**

```sql
--检查表属主
select relname,relnamespace,relkind from pg_class 
  where relowner=(select oid from pg_roles where rolname='itsm')
  order by 3 desc;
  
--检查用户的系统权限
SELECT * FROM pg_roles WHERE rolname='itsm';

--检查用户的表权限
select * from information_schema.table_privileges 
  where grantee='itsm';

--检查用户的usage权限
select * from information_schema.usage_privileges 
  where grantee='itsm';

--检查用户在存储过程函数的执行权限
select * from information_schema.routine_privileges 
  where grantee='itsm';

--检查用户在表的列上的权限
select * from information_schema.column_privileges 
  where grantee='itsm';

--检查用户自定义类型上授予的USAGE权限	
select * from information_schema.udt_privileges 
  where grantee='itsm';
```

**针对删除用户权限后，有时需要重连数据库生效：**

```sql
postgres=# revoke all on database itsm from itsm;
REVOKE
postgres=# \c itsm
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "itsm" as user "omm".
itsm=# drop user itsm;
DROP ROLE
```

总结：删除用户首先需要断连所有业务连接如果不清楚对象具体的权限，可以使用“revoke all on [schema]/[database] from rolename;”取消对象上所有权限的赋权
