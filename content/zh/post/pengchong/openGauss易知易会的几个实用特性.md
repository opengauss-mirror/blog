+++

title = "openGauss易知易会的几个实用特性" 

date = "2022-10-19" 

tags = ["openGauss"] 

archives = "2022-10" 

author = "彭冲" 

summary = "openGauss易知易会的几个实用特性"

img = "/zh/post/pengchong/title/img9.png" 

times = "10:20"
+++

# openGauss易知易会的几个实用特性

本文出处：[https://www.modb.pro/db/503983](https://www.modb.pro/db/503983)

使用openGauss已经有很长一段时间了，本文将介绍几个简单易用的数据库特性。

- 单列显示整行数据
- where比较列合并
- 独立写布尔列
- using关键字
- domain

### 单列显示整行数据

首先我们准备测试数据表：

```
create table users(id int,name text,email text,deleted_at timestamp,delete boolean);
insert into users values(1,'jerome','chong.peng@enmotech.com',null,false);
insert into users values(2,'sara','lynn.wood@poland.com','2001-09-11',true);
insert into users values(3,'dolores','th000@sky.com',null,false);
insert into users values(4,'evan','rachel.moore@hollywood.com',null,false);
```

通常我们使用如下语句进行查询

```
openGauss#  select * from users;
 id |  name   |           email            |     deleted_at      | delete 
----+---------+----------------------------+---------------------+--------
  1 | jerome  | chong.peng@enmotech.com    |                     | f
  2 | sara    | lynn.wood@poland.com       | 2001-09-11 00:00:00 | t
  3 | dolores | th000@sky.com              |                     | f
  4 | evan    | rachel.moore@hollywood.com |                     | f
(4 rows)
```

也可以使用下面的语句进行查询，尤其是列较多时

```
openGauss# select users from users;
                         users                         
-------------------------------------------------------
 (1,jerome,chong.peng@enmotech.com,,f)
 (2,sara,lynn.wood@poland.com,"2001-09-11 00:00:00",t)
 (3,dolores,th000@sky.com,,f)
 (4,evan,rachel.moore@hollywood.com,,f)
(4 rows)
```

上面是将所有列作为行类型返回单列，可以比较简洁的返回数据。

### where比较列合并

假设我们有以下查询：

```
select id, name, email
from users
where name = 'dolores'
  and email = 'th000@sky.com';
```

根据名称和邮箱查询用户，有的时候where条件后面可能会出现1=1

```
select id, name, email
from users
where 1=1
  and name = 'dolores'
  and email = 'th000@sky.com';
```

应用层需要比较方便进行where条件拼接。

其实可以去掉and，使用如下语句：

```
select id, name, email
from users
where (name, email) = ('dolores','th000@sky.com');
```

可以查询到同样的结果

```
 id |  name   |     email     
----+---------+---------------
  3 | dolores | th000@sky.com
(1 row)
```

我们还可以使用in来满足or条件，例如下面的查询：

```
select id, name, email
from users
where deleted_at is null
and (
     (name = 'dolores' and email = 'th000@sky.com')
     or
     (name = 'evan' and email = 'rachel.moore@hollywood.com')
);
```

可以将其缩短为：

```
select id, name, email
from users
where deleted_at is null
 and (name, email) 
 in (('dolores','th000@sky.com'),('evan','rachel.moore@hollywood.com'));
```

这可以使查询更短且更易于阅读。

### 独立写布尔列

接下来的查询，获取未删除的用户，比较常见的是这种写法：

```
select id, name, email
from users
where delete =  false;
```

多数人并不知道布尔值不需要与另一个布尔值进行比较,可以这样写：

```
select id, name, email
from users
where not delete;
```

这样阅读起来也更好，结果如下：

```
 id |  name   |           email            
----+---------+----------------------------
  1 | jerome  | chong.peng@enmotech.com
  3 | dolores | th000@sky.com
  4 | evan    | rachel.moore@hollywood.com
(3 rows)
```

### using关键字

当我们做多张表的join连接时，如果join字段的名称相同可以使用using关键字来简化语句

```
select ...
  from  t1 
  join  t2
    on  t1.id = t2.id;
```

可以改写为：

```
select ...
  from  t1 
  join  t2
 using  (id);
```

多个字段还可以使用逗号进行分隔：

```
on t1.a = t2.a and t1.b = t2.b
```

改写为

```
using (a,b);
```

### domain

domain也是比较有用的一个特性，例如可以很多需要进行相同限制的列创建自定义类型：

```
create domain my_addr varchar(100) not null default 'n/a';
```

或者是作为别名支持兼容性数据类型：

```
create domain binary_float as float; 
```

本文总结了几个有帮助的实用特性，大家在日常使用过程中可以进一步挖掘。
