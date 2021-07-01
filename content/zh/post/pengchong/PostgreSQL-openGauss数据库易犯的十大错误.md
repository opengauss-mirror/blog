title = "PostgreSQL/openGauss数据库易犯的十大错误" 

date = "2021-06-30" 

tags = ["PostgreSQL/openGauss数据库易犯的十大错误"] 

archives = "2021-06" 

author = "彭冲" 

summary = "PostgreSQL/openGauss数据库易犯的十大错误"

img = "/zh/post/lihongda/title/title.png" 

times = "10:30"

+++

# PostgreSQL/openGauss数据库易犯的十大错误<a name="ZH-CN_TOPIC_0000001171344149"></a>

总结十点PostgreSQL/openGauss数据库中容易犯的错误。

## 1.同时设置日志行前缀和csvlog格式<a name="section655520193120"></a>

比较常见大家同时配置下面这两个参数

```
log_line_prefix = '%m %u %d %p'
log_destination='csvlog'
```

-   %m是带毫秒的时间戳
-   %u是用户名
-   %d是数据库名
-   %p是进程ID

然后当我们配置为csvlog日志时，日志行的内容项是固定的，所以当我们需要配置日志前缀，精简日志行的内容项时，log\_destination不能配置为csvlog。下面是正确的配置：

```
log_destination='stderr'
log_line_prefix = '%m %u %d %p'
```

## 2.不符合预期的日志轮换策略<a name="section137107181319"></a>

日志轮换策略可以通过log\_rotation\_size参数按日志文件大小控制或者通过log\_rotation\_age参数按时间控制，但下面这四个参数需要合理组合使用。

```
log_filename
log_truncate_on_rotation
log_rotation_age
log_rotation_size
```

-   方案一：每天生成一个新的日志文件

    ```
    log_filename='postgresql-%Y-%m-%d.log'
    log_truncate_on_rotation=off
    log_rotation_age=1d
    log_rotation_size=0
    ```

-   方案二：写满固定大小（如10MB），则进行切换

    ```
    log_filename='postgresql-%Y-%m-%d_%H%M%S.log'
    log_truncate_on_rotation=off
    log_rotation_age=0
    log_rotation_size=10MB
    ```

    这种方案我们一般是为了根据时间去查看日志，文件名根据日志量可以设置到时分秒，但这里设置log\_rotation\_size并不能严格控制固定大小。

-   方案三：保留固定天数的日志并循环覆盖，例如固定一周或者固定一个月

    ```
    log_filename='postgresql-%u.log'
    log_truncate_on_rotation=on
    log_rotation_age=1d
    log_rotation_size=0
    ```


log\_filename常见的通配符变量

-   %u是星期的数字表示，范围是\[1,7\]，1代表星期一
-   %w也是星期的数字表示，范围是\[0,6\]，0代表星期天
-   %d是月份中的天数表示，范围是\[01,31\]

生产环境第三种方案更合适一些。

## 3.同步复制表的序列<a name="section102507139150"></a>

看看下面这个例子，我们创建test表使用serial自增序列类型，系统帮我们生成了test\_id\_seq序列。

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

当我们复制t\_test表时，test表的序列引用也同时复制过来了，可以使用虚拟生成列来解决这个问题。

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

openGauss对PG的这个问题做了修复，下面是openGauss复制t\_test时，序列按表名做了区分。

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

创建序列seq1，设置cache为10，session A获取下一个值为1.

```
postgres=# create sequence seq1 cache 10;
CREATE SEQUENCE
postgres=# select nextval('seq1');
 nextval 
---------
       1
(1 row)
```

session B查询获取下一个值为11

```
postgres=# select nextval('seq1');
 nextval 
---------
      11
(1 row)
```

序列值插入为了保证连续性，要设置cache为1。

## 5.从任意库查询pg\_stat\_statements模块统计信息<a name="section142441726131812"></a>

pg\_stat\_statements模块用来跟踪SQL语句的执行统计信息，我们如果把该模块安装到postgres数据库，就只能连到postgres数据库进行查询，除非其它数据库也安装了该模块，否则会提示报错找不到。

无论任何操作，都需要连接到一个数据库，即使我们只想创建一个全局的数据库用户，所以选对数据库特别重要。

## 6.truncate操作理解为DML语句<a name="section7659174131810"></a>

log\_statement参数控制日志记录级别，有4个选项：none、ddl、mod、all。开启ddl，它会记录 create、alter和drop相关的语句，但不记录truncate。

truncate在Oracle中属于DDL语句，在PostgreSQL中属于DML语句。因此，当我们使用DDL日志记录语句时，无法记录到Truncate。

## 7.认为数据库的owner可以管理其下所有对象<a name="section7852105011814"></a>

数据库、模式、表的都有自己的owner，他们都属于实例中的对象，数据库owner只是具有数据库这个对象的CTc权限。数据库的默认权限为：

-   允许public角色连接，即允许任何人连接。
-   不允许除了超级用户和owner之外的任何人在数据库中创建schema。
-   会自动创建名为public的schema，这个schema的所有权限已经赋予给public角色，即允许任何人在里面创建对象。

schema使用注意事项：

schema的owner默认是该schema下的所有对象的owner，但是允许用户在别人的schema下创建对象，所以一个对象的owner和schema的owner可能不同，都有drop对象的权限。

## 8.认为public模式下的对象可以互相访问<a name="section15118172831910"></a>

public模式只是允许任何人在里面创建对象并管理自己的对象，并不能查看别人创建的对象。

## 9.创建索引时起名为表名称<a name="section184121338191919"></a>

单个数据库里，索引和表的名称不能重复，因为他们都属于relation。

```
postgres=# create index a on a(id);
ERROR:  relation "a" already exists
```

## 10.把walsender当作主库<a name="section12862857111916"></a>

通常我们从操作系统层查看主库有walsender，备库有walreceiver，并且walsender信息中可以看到备库的IP地址，可以初步判断主备状态正常。

但请注意有walsender或者数据库中能查到pg\_stat\_replication视图并不能断定是主库，仅在一主一备环境可以这样简单判断，下面的图可以看出，虽然有walsender，但它也是个备库。

![](figures/20210603-9b70ba89-658c-4902-818a-099c359808b4.png)

