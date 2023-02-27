---
title: 'PostgreSQL/openGauss数据库易犯的十大错误'

date: '2021-06-30'

category: 'blog'
tags: ['PostgreSQL/openGauss数据库易犯的十大错误']

archives: '2021-06'

author: '彭冲'

summary: 'PostgreSQL/openGauss数据库易犯的十大错误'

img: '/zh/blogs/pengchong/title/img9.png'

times: '10:30'
---

# PostgreSQL/openGauss 数据库易犯的十大错误<a name="ZH-CN_TOPIC_0000001171344149"></a>

总结十点 PostgreSQL/openGauss 数据库中容易犯的错误。

## 1.同时设置日志行前缀和 csvlog 格式<a name="section655520193120"></a>

比较常见大家同时配置下面这两个参数

```
log_line_prefix = '%m %u %d %p'
log_destination='csvlog'
```

- %m 是带毫秒的时间戳
- %u 是用户名
- %d 是数据库名
- %p 是进程 ID

然后当我们配置为 csvlog 日志时，日志行的内容项是固定的，所以当我们需要配置日志前缀，精简日志行的内容项时，log_destination 不能配置为 csvlog。下面是正确的配置：

```
log_destination='stderr'
log_line_prefix = '%m %u %d %p'
```

## 2.不符合预期的日志轮换策略<a name="section137107181319"></a>

日志轮换策略可以通过 log_rotation_size 参数按日志文件大小控制或者通过 log_rotation_age 参数按时间控制，但下面这四个参数需要合理组合使用。

```
log_filename
log_truncate_on_rotation
log_rotation_age
log_rotation_size
```

- 方案一：每天生成一个新的日志文件

  ```
  log_filename='postgresql-%Y-%m-%d.log'
  log_truncate_on_rotation=off
  log_rotation_age=1d
  log_rotation_size=0
  ```

- 方案二：写满固定大小（如 10MB），则进行切换

  ```
  log_filename='postgresql-%Y-%m-%d_%H%M%S.log'
  log_truncate_on_rotation=off
  log_rotation_age=0
  log_rotation_size=10MB
  ```

  这种方案我们一般是为了根据时间去查看日志，文件名根据日志量可以设置到时分秒，但这里设置 log_rotation_size 并不能严格控制固定大小。

- 方案三：保留固定天数的日志并循环覆盖，例如固定一周或者固定一个月

  ```
  log_filename='postgresql-%u.log'
  log_truncate_on_rotation=on
  log_rotation_age=1d
  log_rotation_size=0
  ```

log_filename 常见的通配符变量

- %u 是星期的数字表示，范围是\[1,7\]，1 代表星期一
- %w 也是星期的数字表示，范围是\[0,6\]，0 代表星期天
- %d 是月份中的天数表示，范围是\[01,31\]

生产环境第三种方案更合适一些。

## 3.同步复制表的序列<a name="section102507139150"></a>

看看下面这个例子，我们创建 test 表使用 serial 自增序列类型，系统帮我们生成了 test_id_seq 序列。

```
postgres=# create table test(id serial primary key,name varchar unique);
CREATE TABLE
postgres=# \d test
                                 Table "public.test"
 Column |       Type        | Collation | Nullable |             Default
--------+-------------------+-----------+----------+----------------------------------
 id     | integer           |           | not null | nextval('test_id_seq'::regclass)
 name   | character varying |           |          |
Indexes:
    "test_pkey" PRIMARY KEY, btree (id)
    "test_name_key" UNIQUE CONSTRAINT, btree (name)
```

当我们复制 t_test 表时，test 表的序列引用也同时复制过来了，可以使用虚拟生成列来解决这个问题。

```
postgres=# create table t_test(like test including all);
CREATE TABLE
postgres=# \d t_test
                                Table "public.t_test"
 Column |       Type        | Collation | Nullable |             Default
--------+-------------------+-----------+----------+----------------------------------
 id     | integer           |           | not null | nextval('test_id_seq'::regclass)
 name   | character varying |           |          |
Indexes:
    "t_test_pkey" PRIMARY KEY, btree (id)
    "t_test_name_key" UNIQUE CONSTRAINT, btree (name)
```

openGauss 对 PG 的这个问题做了修复，下面是 openGauss 复制 t_test 时，序列按表名做了区分。

```
omm=# \d t_test
                              Table "public.t_test"
 Column |       Type        |                      Modifiers
--------+-------------------+-----------------------------------------------------
 id     | integer           | not null default nextval('t_test_id_seq'::regclass)
 name   | character varying |
Indexes:
    "t_test_pkey" PRIMARY KEY, btree (id) TABLESPACE pg_default
    "t_test_name_key" UNIQUE CONSTRAINT, btree (name) TABLESPACE pg_default
```

## 4.跳变的序列值<a name="section9891139101618"></a>

创建序列 seq1，设置 cache 为 10，session A 获取下一个值为 1.

```
postgres=# create sequence seq1 cache 10;
CREATE SEQUENCE
postgres=# select nextval('seq1');
 nextval
---------
       1
(1 row)
```

session B 查询获取下一个值为 11

```
postgres=# select nextval('seq1');
 nextval
---------
      11
(1 row)
```

序列值插入为了保证连续性，要设置 cache 为 1。

## 5.从任意库查询 pg_stat_statements 模块统计信息<a name="section142441726131812"></a>

pg_stat_statements 模块用来跟踪 SQL 语句的执行统计信息，我们如果把该模块安装到 postgres 数据库，就只能连到 postgres 数据库进行查询，除非其它数据库也安装了该模块，否则会提示报错找不到。

无论任何操作，都需要连接到一个数据库，即使我们只想创建一个全局的数据库用户，所以选对数据库特别重要。

## 6.truncate 操作理解为 DML 语句<a name="section7659174131810"></a>

log_statement 参数控制日志记录级别，有 4 个选项：none、ddl、mod、all。开启 ddl，它会记录 create、alter 和 drop 相关的语句，但不记录 truncate。

truncate 在 Oracle 中属于 DDL 语句，在 PostgreSQL 中属于 DML 语句。因此，当我们使用 DDL 日志记录语句时，无法记录到 Truncate。

## 7.认为数据库的 owner 可以管理其下所有对象<a name="section7852105011814"></a>

数据库、模式、表的都有自己的 owner，他们都属于实例中的对象，数据库 owner 只是具有数据库这个对象的 CTc 权限。数据库的默认权限为：

- 允许 public 角色连接，即允许任何人连接。
- 不允许除了超级用户和 owner 之外的任何人在数据库中创建 schema。
- 会自动创建名为 public 的 schema，这个 schema 的所有权限已经赋予给 public 角色，即允许任何人在里面创建对象。

schema 使用注意事项：

schema 的 owner 默认是该 schema 下的所有对象的 owner，但是允许用户在别人的 schema 下创建对象，所以一个对象的 owner 和 schema 的 owner 可能不同，都有 drop 对象的权限。

## 8.认为 public 模式下的对象可以互相访问<a name="section15118172831910"></a>

public 模式只是允许任何人在里面创建对象并管理自己的对象，并不能查看别人创建的对象。

## 9.创建索引时起名为表名称<a name="section184121338191919"></a>

单个数据库里，索引和表的名称不能重复，因为他们都属于 relation。

```
postgres=# create index a on a(id);
ERROR:  relation "a" already exists
```

## 10.把 walsender 当作主库<a name="section12862857111916"></a>

通常我们从操作系统层查看主库有 walsender，备库有 walreceiver，并且 walsender 信息中可以看到备库的 IP 地址，可以初步判断主备状态正常。

但请注意有 walsender 或者数据库中能查到 pg_stat_replication 视图并不能断定是主库，仅在一主一备环境可以这样简单判断，下面的图可以看出，虽然有 walsender，但它也是个备库。

<!-- <img src='./figures/20210603-9b70ba89-658c-4902-818a-099c359808b4.png'> -->
