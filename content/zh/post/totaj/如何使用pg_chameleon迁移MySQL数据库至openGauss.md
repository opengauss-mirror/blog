+++
title = "如何使用pg_chameleon迁移MySQL数据库至openGauss" 
date = "2021-06-16" 
tags = ["openGauss数据迁移"] 
archives = "2021-06" 
author = "彭炯" 
summary = "如何使用pg_chameleon迁移MySQL数据库至openGauss"
img = "/zh/post/totaj/title/img.png" 
times = "17:30"
+++

# pg\_chameleon介绍

pg\_chameleon是一个用Python 3编写的实时复制工具，经过内部适配，目前支持MySQL迁移到openGauss。工具使用mysql-replication库从MySQL中提取rowimages，这些rowimages将以jsonb格式被存储到openGauss中。在openGauss中会执行一个pl/pgsql函数，解码jsonb并将更改重演到openGauss。同时，工具通过一次初始化配置，使用只读模式，将MySQL的全量数据拉取到openGauss，使得该工具提供了初始全量数据的复制以及后续增量数据的实时在线复制功能。pg\_chameleon的特色包括：

- 通过读取MySQL的binlog，提供实时在线复制的功能。

- 支持从多个MySQL schema读取数据，并将其恢复到目标openGauss数据库中。源schema和目标schema可以使用不同的名称。

- 通过守护进程实现实时复制，包含两个子进程，一个负责读取MySQL侧的日志，一个负责在openGauss侧重演变更。

使用pg\_chameleon将MySQL数据库迁移至openGauss，通过pg\_chameleon的实时复制能力，可大大降低系统切换数据库时的停服时间。

# pg\_chameleon在openGauss上的使用注意事项

1. pg\_chameleon依赖psycopg2，psycopg2内部通过pg\_config检查PostgreSQL版本号，限制低版本PostgreSQL使用该驱动。而openGauss的pg\_config返回的是openGauss的版本号（当前是 openGauss 2.0.0），会导致该驱动报版本错误，&quot;Psycopg requires PostgreSQL client library (libpq) >= 9.1&quot;。解决方案为通过源码编译使用psycopg2，并去掉源码头文件 **psycopg/psycopg.h** 中的相关限制。

2. pg\_chameleon通过设置 **LOCK\_TIMEOUT** GUC参数限制在PostgreSQL中的等锁的超时时间。openGauss不支持该参数（openGauss支持类似的GUC参数 **lockwait\_timeout** ，但是需要管理员权限设置）。需要将pg\_chameleon源码中的相关设置去掉。

3. pg\_chameleon用到了upsert语法，用来指定发生违反约束时的替换动作。openGauss支持的upsert功能语法与PostgreSQL的语法不同。openGauss的语法是 **ON DUPLICATE KEY UPDATE { column\_name = { expression | DEFAULT } } [, ...]**。PostgreSQL的语法是 **ON CONFLICT [conflict\_target] DO UPDATE SET { column\_name = { expression | DEFAULT } }**。两者在功能和语法上略有差异。需要修改pg\_chameleon源码中相关的upsert语句。

4. pg\_chameleon用到了CREATE SCHEMA IF NOT EXISTS、CREATE INDEX IF NOT EXISTS语法。openGauss不支持SCHEMA和INDEX的IF NOT EXISTS选项。需要修改成先判断SCHEMA和INDEX是否存在，然后再创建的逻辑。

5. penGauss对于数组的范围选择，使用的是 column\_name[start, end] 的方式。而PostgreSQL使用的是 column\_name[start : end] 的方式。需要修改pg\_chameleon源码中关于数组的范围选择方式。

6. pg\_chameleon使用了继承表（INHERITS）功能，而当前openGauss不支持继承表。需要改写使用到继承表的SQL语句和表。

接下来我们将演示如何使用pg\_chameleon迁移MySQL数据库至openGauss。

# 配置pg\_chameleon

pg\_chameleon通过 **~/.pg\_chameleon/configuration** 下的配置文件config-example.yaml定义迁移过程中的各项配置。整个配置文件大约分成四个部分，分别是全局设置、类型重载、目标数据库连接设置、源数据库设置。全局设置主要定义log文件路径、log等级等。类型重载让用户可以自定义类型转换规则，允许用户覆盖已有的默认转换规则。目标数据库连接设置用于配置连接至openGauss的连接参数。源数据库设置定义连接至MySQL的连接参数以及其他复制过程中的可配置项目。

详细的配置项解读，可查看官网的说明：

[https://pgchameleon.org/documents\_v2/configuration\_file.html](https://pgchameleon.org/documents_v2/configuration_file.html)

下面是一份配置文件示例：
```
# global settings
pid_dir: '~/.pg_chameleon/pid/'
log_dir: '~/.pg_chameleon/logs/'
log_dest: file
log_level: info
log_days_keep: 10
rollbar_key: ''
rollbar_env: ''

# type_override allows the user to override the default type conversion
# into a different one.
type_override:
"tinyint(1)":
    override_to: boolean
    override_tables:
    - "*"

# postgres  destination connection
pg_conn:
  host: "1.1.1.1"
  port: "5432"
  user: "opengauss_test"
  password: "password_123"
  database: "opengauss_database"
  charset: "utf8"

sources:
  mysql:
    db_conn:
      host: "1.1.1.1"
      port: "3306"
      user: "mysql_test"
      password: "password123"
      charset: 'utf8'
      connect_timeout: 10
    schema_mappings:
      mysql_database:sch_mysql_database
    limit_tables:
    skip_tables:
    grant_select_to:
      - usr_migration
    lock_timeout: "120s"
    my_server_id: 1
    replica_batch_size: 10000
    replay_max_rows: 10000
    batch_retention: '1 day'
    copy_max_memory: "300M"
    copy_mode: 'file'
    out_dir: /tmp
    sleep_loop: 1
    on_error_replay: continue
    on_error_read: continue
    auto_maintenance: "disabled"
    gtid_enable: false
    type: mysql
keep_existing_schema: No
```
以上配置文件的含义是，迁移数据时，MySQL侧使用的用户名密码分别是 **mysql\_test**  和 **password123** 。MySQL服务器的IP和port分别是 **1.1.1.1** 和 **3306**，待迁移的数据库是 **mysql\_database** 。

openGauss侧使用的用户名密码分别是 **opengauss\_test** 和 **password\_123** 。openGauss服务器的IP和port分别是 **1.1.1.1** 和 **5432** ，目标数据库是 **opengauss\_database**，同时会在 **opengauss\_database**下创建 **sch\_mysql\_database** schema，迁移的表都将位于该schema下。

需要注意的是，这里使用的用户需要有远程连接MySQL和openGauss的权限，以及对对应数据库的读写权限。同时对于openGauss，运行pg\_chameleon所在的机器需要在openGauss的远程访问白名单中。对于MySQL，用户还需要有RELOAD、REPLICATION CLIENT、REPLICATION SLAVE的权限。

下面开始介绍整个迁移的步骤。

# 创建用户及database

在openGauss侧创建迁移时需要用到的用户以及database。

![](../images/chameleon_create_database.png)

在MySQL侧创建迁移时需要用到的用户并赋予相关权限。

![](../images/chameleon_create_mysql_user.png)

# 开启MySQL的复制功能

修改MySQL的配置文件，一般是/etc/my.cnf或者是 /etc/my.cnf.d/ 文件夹下的cnf配置文件。在[mysqld] 配置块下修改如下配置（若没有mysqld配置块，新增即可）：
```
[mysqld]
binlog_format= ROW
log_bin = mysql-bin
server_id = 1
binlog_row_image=FULL
expire_logs_days = 10
```
修改完毕后需要重启MySQL使配置生效。

# 运行pg\_chameleon进行数据迁移

创建python虚拟环境并激活:

 **python3 -m venv venv** 
 **source venv/bin/activate** 

下载安装psycopg2和pg\_chameleon:

更新pip：  **pip install pip --upgrade** 

将openGauss的 pg\_config 工具所在文件夹加入到 $PATH 环境变量中。例如：

 **export PATH={openGauss-server}/dest/bin:$PATH** 

下载psycopg2源码(https://github.com/psycopg/psycopg2 )，去掉检查PostgreSQL版本的限制，使用  **python setup.py install** 编译安装。

下载pg\_chameleon源码(https://github.com/the4thdoctor/pg_chameleon )，修改前面提到的在openGauss上的问题，使用  **python setup.py install** 编译安装。

创建pg\_chameleon配置文件目录:

 **chameleon set\_configuration\_files** 

修改pg\_chameleon配置文件:

 **cd ~/.pg\_chameleon/configuration** 

 **cp config-example.yml default.yml** 

根据实际情况修改 default.yml 文件中的内容。重点修改pg\_conn和mysql中的连接配置信息，用户信息，数据库信息，schema映射关系。前面已给出一份配置文件示例供参考。

初始化复制流:

**chameleon create\_replica\_schema --config default** 

**chameleon add\_source --config default --source mysql** 

此步骤将在openGauss侧创建用于复制过程的辅助schema和表。

复制基础数据:

**chameleon init\_replica --config default --source mysql** 

做完此步骤后，将把MySQL当前的全量数据复制到openGauss。

可以在openGauss侧查看全量数据复制后的情况。

![](../images/chameleon_init_replica.png)

开启在线实时复制:

**chameleon start\_replica --config default --source mysql**

开启实时复制后，在MySQL侧插入一条数据：

![](../images/chameleon_mysql_start_replica.png)

在openGauss侧查看 test\_decimal 表的数据：

![](../images/chameleon_start_replica.png)

可以看到新插入的数据在openGauss侧成功被复制过来了。

停止在线复制:

**chameleon stop\_replica --config default --source mysql**

**chameleon detach\_replica --config default --source mysql**

**chameleon drop\_replica\_schema --config default**