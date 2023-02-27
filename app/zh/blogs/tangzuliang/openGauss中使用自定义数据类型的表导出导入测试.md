---
title: 'openGauss中使用自定义数据类型的表导出导入测试'

date: '2021-01-28'

category: 'blog'
tags: ['openGauss功能测试']

archives: '2021-01'

author: '唐祖亮'

summary: 'openGauss中使用自定义数据类型的表导出导入测试'

img: '/zh/blogs/tangzuliang/title/img6.png'

times: '16:30'
---

# openGauss 中使用自定义数据类型的表导出导入测试<a name="ZH-CN_TOPIC_0000001116618867"></a>

在 opengauss 中使用了自定义的数据类型的表是可以导出的，但是在导入到其他数据库时会提示没有原表使用到的自定义数据类型。

下面做一个简单的测试。首先在 school 数据库下创建了一个自定义类型 bug_status。

```
school=# CREATE TYPE bug_status AS ENUM ('new', 'open', 'closed');
CREATE TYPE
```

然后创建表 bug 并且使用上创建的自定义类型。

```
school=# CREATE TABLE bug (
school(#     id int,
school(#     description text,
school(#     status bug_status
school(# );
CREATE TABLE
```

导出创建的表 bug。

```
[omm@opengauss1 tmp]$ gs_dump -p26000 -f /tmp/bug.dmp school -t bug -F d
gs_dump[port='26000'][school][2021-01-14 16:55:43]: The total objects number is 374.
gs_dump[port='26000'][school][2021-01-14 16:55:43]: [100.00%] 374 objects have been dumped.
gs_dump[port='26000'][school][2021-01-14 16:55:43]: dump database school successfully
gs_dump[port='26000'][school][2021-01-14 16:55:43]: total time: 217  ms
```

把表导入到 postgres 数据库中。

```
[omm@opengauss1 tmp]$ gs_restore /tmp/bug.dmp -p 26000 -d postgres
start restore operation ...
Error while PROCESSING TOC:
Error from TOC entry 9; 1259 17171 TABLE bug omm
could not execute query: ERROR:  type "bug_status" does not exist
LINE 4:     status bug_status
                   ^
    Command was: CREATE TABLE bug (
    id integer,
    description text,
    status bug_status
)
WITH (orientation=row, compression=no);
could not execute query: ERROR:  relation "public.bug" does not exist
    Command was: ALTER TABLE public.bug OWNER TO omm;
Error from TOC entry 3598; 0 17171 TABLE DATA bug omm
could not execute query: ERROR:  relation "bug" does not exist
    Command was: COPY bug (id, description, status) FROM stdin;

Finish reading 4 SQL statements!
end restore operation ...
WARNING: errors ignored on restore: 3
restore operation successful
total time: 130  ms
```

可以看到在第五行报错提示"bug_status"这个数据类型不存在。我们现在在 postgres 数据库中创建同名的自定义数据类型，测试导入是否能够成功。

```
school=# \c postgres
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "postgres" as user "omm".
postgres=# CREATE TYPE bug_status AS ENUM ('yes', 'no', 'unknown');
CREATE TYPE
```

执行导入。

```
[omm@opengauss1 tmp]$ gs_restore /tmp/bug.dmp -p 26000 -d postgres
start restore operation ...
table bug complete data imported !
Finish reading 4 SQL statements!
end restore operation ...
restore operation successful
total time: 30  ms
```

查看 postgres 数据库下是否已经导入 bug 表了。

```
postgres=# \d
                        List of relations
 Schema | Name | Type  | Owner |             Storage
--------+------+-------+-------+----------------------------------
 public | bug  | table | omm   | {orientation=row,compression=no}
(1 row)

postgres=# \d+ bug
                              Table "public.bug"
   Column    |    Type    | Modifiers | Storage  | Stats target | Description
-------------+------------+-----------+----------+--------------+-------------
 id          | integer    |           | plain    |              |
 description | text       |           | extended |              |
 status      | bug_status |           | plain    |              |
Has OIDs: no
Options: orientation=row, compression=no
```

可以看到 bug 表确实是导入进来了，这是因为在 postgres 数据库中创建了同名的自定义数据类型，但是创建的自定义类型和原表使用的自定义数据类型定义不同，如果导入过来的表中存在数据那么也是可能会报错的。在原表中自定义数据类型"bug_status"指定输入三个值，分别为’new’, ‘open’, ‘closed’，而在 postgres 数据库中创建的"bug_status"类型指定的三个值为’yes’, ‘no’, ‘unknown’。这时原 bug 表中的值在导入到 postgres 数据库中不满足 status 列上"bug_status"指定的值，因此是会报错的。

下面可以测试一下，对 school 数据库中的 bug 表插入数据，再导出然后导入到 postgre 数据库中，看看结果如何。

```
school=# insert into bug values(1,'windows','open');
INSERT 0 1
school=# select * from bug;
 id | description | status
----+-------------+--------
  1 | windows     | open
(1 row)
```

导出然后导入到 postgres 数据中。

先删除 postgres 中的 bug 表。

```
school=# \c postgres
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "postgres" as user "omm".
postgres=# \d
                        List of relations
 Schema | Name | Type  | Owner |             Storage
--------+------+-------+-------+----------------------------------
 public | bug  | table | omm   | {orientation=row,compression=no}
(1 row)

postgres=# drop table bug;
DROP TABLE

导出然后导入到postgres数据。

[omm@opengauss1 tmp]$  gs_dump -p26000 -f /tmp/bug.dmp school -t bug -F d
gs_dump[port='26000'][school][2021-01-14 17:25:46]: The total objects number is 374.
gs_dump[port='26000'][school][2021-01-14 17:25:46]: [100.00%] 374 objects have been dumped.
gs_dump[port='26000'][school][2021-01-14 17:25:46]: dump database school successfully
gs_dump[port='26000'][school][2021-01-14 17:25:46]: total time: 218  ms
[omm@opengauss1 tmp]$ gs_restore /tmp/bug.dmp -p 26000 -d postgres
start restore operation ...
Error while PROCESSING TOC:
Error from TOC entry 3598; 0 17171 TABLE DATA bug omm
COPY failed for table "bug": ERROR:  invalid input value for enum bug_status: "open"
CONTEXT:  COPY bug, line 1, column status: "open"
table bug complete data imported !
Finish reading 4 SQL statements!
end restore operation ...
WARNING: errors ignored on restore: 1
restore operation successful
total time: 126  ms
```

可以看到在导入时报错提示输入的值"open"无效，因为在 postgres 数据库中自定义数据类型"bug_status"指定输入三个值为’yes’, ‘no’, ‘unknown’，而导入的值为’open’，所以会报错。查看是否导入到 postgres 数据库中：

```
postgres=# \d
                        List of relations
 Schema | Name | Type  | Owner |             Storage
--------+------+-------+-------+----------------------------------
 public | bug  | table | omm   | {orientation=row,compression=no}
(1 row)

postgres=# select * from bug;
 id | description | status
----+-------------+--------
(0 rows)
```

可以看到只导入了 bug 表的定义，数据没有成功导入进来。从上面的这些测试中总结，在做表的导入导出时确定表中是否使用了自定义数据类型，导入的对应数据库中有没有和原表使用的自定义数据类型定义一致的自定义数据类型，这些都是影响导入是否成功的因素。
