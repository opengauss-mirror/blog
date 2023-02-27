---
title: 'openGauss社区入门（openGauss-服务配置）'

date: '2022-09-25'

tags: ['openGauss社区开发入门']

archives: '2022-09'
category: 'blog'
author: 'z-qw'

summary: 'openGauss社区开发入门'

img: '/zh/post/z-qw/title/title.jpg'

times: '19:00'
---

## **1 配置参数**

配置参数在 postgresql.conf 文件中集中管理，这个文件位于数据库实例的目录下( $PGDATA)。此文件中的每个参数配置项的格式都是“参数名=参数值”，例如配置项:

```
check_function_bodies = on
#default_transaction_isolation = 'read committed'
#default_transaction_read_only = off
```

配置文件中可以使用“#” 注释。 所有配置项的参数名都是大小写不敏感的，参数值有以下五种类型： 1）布尔：布尔值都是大小写无关的，on/off、true/false、yes/no、1/0。 2）整数：数值可以指定单位。如一些内存配置的参数可以指定 KB、MB、GB 等单位。 3）浮点数 4）字符串 5）枚举 还可以使用 include 'filename' 指令包含文件中的配置内容。如果不是绝对路径，就是当前配置文件所在目录的相对路径。 配置参数查看：pg_settings

```
openGauss=# \x  -- 显示为列：内容
openGauss=# select * from pg_settings where name = 'allow_system_table_mods';
-[ RECORD 1 ]----------------------------------------------------------------
name       |allow_system_table_mods
setting    |off
unit       |
category   |Developer Options
short_desc |Allows modifications of the structure of system tables.
extra_desc |
context    |postmaster
vartype    |bool
source     |default
min_val    |
max_val    |
enumvals   |
boot_val   |off
reset_val  |off
sourcefile |
sourceline |
openGauss=# \x  -- 恢复
```

枚举类型配置参数可选项查看：

```
openGauss=# select enumvals from pg_settings where name = 'client_min_messages';
                      enumvals
-------------------------------------------------------------
{debug5,debug4,debug3,debug2,debug1,log,notice,warning,error}
(1 row)
```

context 字段为参数访问类型，分为以下几类： 1）internal :只读参数，这类参数值不能配置在 postgresql.conf 中，因为它们是由 postgres 程序和在初始化实例时写死的。 2）postmaster :改变这些参数的值需要重启 PostgreSQL 实例才能生效。 3）sighup :改变这些参数的值，不需要重启数据库，只需要向 postmaster 进程发送 SIGHUP 信号，让其重启装载配置新的参数值就可以了。postmaster 进程接收到 SIGHUP 信号后，也会向它的子进程发送 SIGHUP 信号，让新的参数值在所有的进程中都生效。 4）backend :更改这些设置无须重新启动服务器，只需要 postmaster 发送一个 SIGHUP 信号，但新的配置值只会出现在这之后的新连接中，在已有的连接中，这些参数的值不会改变。 5）Superuser :可以由超级用户使用 set 来改变，而超级用户改变此参数值时，只会影响自身的 sesssion 配置，不会影响其他用户。向 postmaster 进程发送 SIGHUP 信号，也只会影响后续建的连接，不会影响现有的连接。 6）user :普通用户可使用 set 命令改变本连接中的配置值。

## **2 连接配置**

连接数据库相关的配置有以下几种。 1）listen\_ addresses : string 类型。声明服务器监听客户端连接的 TCP/IP 地址，改变这个参数需要重启数据库服务。通常把此项配置为“_"，表示在本机的所有 IP 上监听。当配置成“0.0.0.0”，与“_”相同。如果这个列表是空的，那么服务器不会监听任何 IP 地址，这种情况下，只有 UNIX 域套接字可以连接到。 2）port: integer 类型。指定服务器监听的 TCP 端口，默认为 5432。改变这个参数需要重 启数据库服务。同一个端口号用于服务器监听的所有 IP 地址。 3）max_connections: integer 类型。允许和数据库连接的最大并发连接数。改变这个参数 需要重启数据库服务。默认值通常是 100，但是如果内核设置不支持这么大的值(在 initdb 时判断)，可能就会小于 100。这个参数只能在服务器启动的时候设置。 4）superuser_reserved_connections: integer 类型。为超级用户连接而保留的连接数。改变这个参数需要重启数据库服务。默认值是 3。这个值必须小于 max_connections 的值。 5）unix_socket_directory: string 类型。声明服务器监听客户端连接的 UNIX 域套接字目录。 6）unix_socket_group: string 类型。设置 UNIX 域套接字的所属组。 7）unix_socket_permissions: integer 类型，设置 UNIX 域套接字的访问权限。 8）bonjour: boolean 类型。 9）bonjour_name: string 类型，声明 Bonjour 服务名称。 10）tcp \_keepalives_idle: integer 类型。表示在一个 TCP 连接中空闲多长时间后会发送一个 keepalive 报文。 11）tcp_keepalives_interval: integer 类型。在一个空闲 TCP 连接中，定义在发送第一个 TCP keepalive 包后如果在该参数给定的时间间隔内没有收到对端的回包，则开始发送第二 TCP keepalive 包，直到达到 tcp_keepalives_count 次后仍没有收到回包，则认为连接已中断，关闭连接。 12）tcp_keepalives_count: integer 类型。

## **3 内存配置**

shared_buffers : 设置数据库服务器将使用的共享内存缓冲区数量，此缓冲区为缓存数据块所用。此缓冲区是放在共享内存中的。每个缓冲区大小的典型值是 8K 字节。这个数值必须大于 16，并且至少是 max_connections 数值的两倍。一个合理的 shared_buffers 开始值可以是物理内存的 25%。增大这个参数可能导致 PostgreSQL 要求更多 System V 共享内存，可能超出操作系统共享内存配置参数允许的大小。 temp_buffers : 设置每个数据库会话使用的临时缓冲区的最大数目。此本地缓冲区只用于访问临时表。每个会话可以使用 SET 命令改变此设置值，但必须是在会话第一次使用临时表前设置，一旦使用临时表之后，再改变该数值将是无效的。 work_mem : 声明内部排序操作和 Hash 表在开始使用临时磁盘文件之前可使用的内存数目。
