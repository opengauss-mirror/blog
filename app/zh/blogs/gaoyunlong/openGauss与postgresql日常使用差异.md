---
title: 'openGauss与postgresql日常使用差异'

date: '2020-11-17'

category: 'blog'
tags: ['openGauss与postgresql日常使用差异']

archives: '2020-11'

author: '高云龙'

summary: 'openGauss与postgresql日常使用差异'

img: '/zh/blogs/gaoyunlong/title/img21.png'

times: '12:40'
---

# openGauss 与 postgresql 日常使用差异<a name="ZH-CN_TOPIC_0291959506"></a>

## 密码加密<a name="section6186205418215"></a>

- postgresql 默认密码加密方式是 md5。

- openGauss 默认密码加密方式是 sha256。
- 使用 navicate、pgadmin3 等客户端开发工具访问 og，需要修改加密方式。
- 如果在本地用用户名密码登陆数据库没问题。
- 但是用其他工具连接数据库报用户或密码错误。
- 可能是密码加密方式不对，需要看 pg_hba.conf 及 参数。

```
password_encryption_type = 0		#Password storage type, 0 is md5 for PG, 1 is sha256 + md5, 2 is sha256 only
```

## 字符串存储<a name="section1177545618615"></a>

在 postgresql 里，char\(n\)、varchar\(n\) n 代表是字符；最多存储 1GB。

在 openGauss 里，char\(n\)、varcahr\(n\) n 代表的是字节，nvarchar2\(n\) n 代表是字符；最多存储 100MB。

```
---
---postgresql字符测试
---
postgres=# \d dt
                       Table "public.dt"
 Column |         Type         | Collation | Nullable | Default
--------+----------------------+-----------+----------+---------
 id     | integer              |           |          |
 col1   | character varying(8) |           |          |

postgres=# insert into dt values(3,'中文字符长度测试');
INSERT 0 1
postgres=# insert into dt values(4,'yingwen8');
INSERT 0 1
postgres=# insert into dt values(4,'yingwen88');
ERROR:  value too long for type character varying(8)

---
---openGauss字符测试
---
mydb=# \d+ dt
                                 Table "public.dt"
 Column |         Type         | Modifiers | Storage  | Stats target | Description
--------+----------------------+-----------+----------+--------------+-------------
 id     | integer              |           | plain    |              |
 col1   | character varying(8) |           | extended |              |
 col2   | nvarchar2(8)         |           | extended |              |
Has OIDs: no
Options: orientation=row, compression=no

mydb=# insert into dt(id,col1) values(3,'yingwen8');
INSERT 0 1
mydb=# insert into dt(id,col1) values(3,'yingwen88');
ERROR:  value too long for type character varying(8)
CONTEXT:  referenced column: col1
mydb=# insert into dt(id,col1) values(3,'中文测试');
ERROR:  value too long for type character varying(8)
CONTEXT:  referenced column: col1
mydb=# insert into dt(id,col1) values(3,'中文测');
ERROR:  value too long for type character varying(8)
CONTEXT:  referenced column: col1

mydb=# insert into dt(id,col2) values(4,'中文字符长度测试');
INSERT 0 1
mydb=# insert into dt(id,col2) values(4,'yingwen8');
INSERT 0 1
mydb=# insert into dt(id,col2) values(4,'yingwen88');
ERROR:  value too long for type nvarchar2(8)
CONTEXT:  referenced column: col2
mydb=#
```

## null 与 空字符<a name="section81541742111210"></a>

- 在 postgresql 里 null != ‘’

- 在 openGauss 里‘’转换成 null，没有‘’

----+------

```
---
---postgresql测试
---
postgres=# create table dt(id int,col1 varchar(8));
CREATE TABLE
postgres=# insert into dt values(1,null);
INSERT 0 1
postgres=# insert into dt values(2,'');
INSERT 0 1
postgres=# select * from dt;
 id | col1
----+------
  1 |
  2 |
(2 rows)

postgres=# select * from dt where col1 is null;
 id | col1
----+------
  1 |
(1 row)

postgres=# select * from dt where col1='';
 id | col1
----+------
  2 |
(1 row)

postgres=#
---
---openGauss测试
---
mydb=# create table dt(id int,col1 varchar(8));
CREATE TABLE
mydb=# insert into dt values(1,null);
INSERT 0 1
mydb=# insert into dt values(1,'');
INSERT 0 1
mydb=# select * from dt;
 id | col1
----+------
  1 |
  1 |
(2 rows)

mydb=# select * from dt where col1 is null;
 id | col1
----+------
  1 |
  1 |
(2 rows)

mydb=# select * from dt where col1='';
 id | col1
----+------
(0 rows)

mydb=#
```
