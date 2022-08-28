+++

 title = "openGauss社区入门（openGauss-常用元命令）" 

date = "2022-08-28" 

tags = ["openGauss社区开发入门"] 

archives = "2022-08" 

author = "z-qw" 

summary = "openGauss社区开发入门" 

img = "" 

times = "17:30" 

+++

### 1、创建角色
create user user_name with superuser createdb createrole password 'xxx'; 
create user user_name password 'xx';
grant create on schema schema_name to user_name 
或create role name with option
option 包括：
superuser/nosuperuser
createdb/nocreatedb
createuser/nocreateuser
inherit/noinhert 角色权限
 login/nologin
connnection limit connlimit 并发连接数量，默认-1 无限制
password'xxxx'
valid until 'timestamp'   密码失效时间
in role role_name 成为哪些角色的成员
role role_name 成为新建角色的成员
admin role_name 新建角色的权限
创建用户u1并给创建数据库的权限
postgres=# CREATE ROLE u1 WITH CREATEDB PASSWORD "Bigdata@123";
### 2、赋予权限
数据库的权限  alter role
创建模式的权限  grant
grant role_name to role_name
grant select on table table_name to publi(role_name); 允许所有用户查询该表
revoke create on schema public from public; 回收public权限
grant user user_name with password'xxxx';
grant  usage on schema schema_name to user_name; 只读用户  
usage  对于一个表，必须要有schema权限
grant select on all tables in schema schema_name to user_name;
drop owned by readonly; 删除角色所拥有的所有对象
drop role readonly；删除角色
将模式 s1的权限赋给用户u1:
postgres=# GRANT USAGE ON SCHEMA s1 TO u1;
将表 tb1的select权限赋给用户u1:
postgres=# GRANT SELECT ON TABLE tb1 to joe;

 
