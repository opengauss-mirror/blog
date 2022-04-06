+++

title = "OpenGauss数据库对象属主变更后会自动调整对象权限吗？" 

date = "2022-04-06" 

tags = ["OpenGauss数据库对象属主变更后会自动调整对象权限吗？"] 

archives = "2022-04" 

author = "tracy" 

summary = "OpenGauss数据库对象属主变更后会自动调整对象权限吗？"

img = "/zh/post/tracy/title/img20.png" 

times = "11:37"

+++

# OpenGauss数据库对象属主变更后会自动调整对象权限吗？

OpenGauss数据库创建了数据库对象之后，可以使用alter命令修改对象的属主。
以表为例，修改属主的命令如下：

```sql
ALTER TABLE <table_name> OWNER TO <role_name>;
```

接下来就测试一下修改表的属主，观察一下表的权限调整情况：
创建测试用户：

```sql
create user test password ‘xxxx’;
create user test1 password ‘xxxx’;
create user test5 password ‘xxxx’;
```


使用test用户登录数据库创建表t:

```sql
create table t (id int);
```

将表test.t的查询权限赋给test5用户：

```sql
grant usage on schema test to test5;
grant select on test.t to test5;
```

查看表t的权限分配情况：

```sql
\dp test.t
```

修改表t的属主为test1:

```sql
ALTER TABLE test.t OWNER TO test1;
```

再次查看表t的权限分配情况：

```sql
\dp test.t
```

在OpenGauss中修改表属主的测试结果：

 ![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20220111-9e35cdfa-1cf6-467f-a17b-80c4b6559869.png)

**这里我们注意到，表修改属主前后，表的访问权限的被赋权者/赋权者会被自动调整，被赋权者/赋权者如果是之前的属主会改为当前的属主**
