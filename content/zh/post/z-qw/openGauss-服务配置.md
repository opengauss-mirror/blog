+++

title = "openGauss社区入门（openGauss-服务配置）" 

date = "2022-09-25" 

tags = ["openGauss社区开发入门"] 

archives = "2022-09" 

author = "z-qw" 

summary = "openGauss社区开发入门" 

img = "/zh/post/z-qw/title/title.jpg" 

times = "19:00" 

+++
## **1 配置参数**
配置参数在postgresql.conf文件中集中管理，这个文件位于数据库实例的目录下( $PGDATA)。此文件中的每个参数配置项的格式都是“参数名=参数值”，例如配置项:
```
check_function_bodies = on
#default_transaction_isolation = 'read committed'
#default_transaction_read_only = off
```
配置文件中可以使用“#” 注释。<br />所有配置项的参数名都是大小写不敏感的，参数值有以下五种类型：<br />1）布尔：布尔值都是大小写无关的，on/off、true/false、yes/no、1/0。<br />2）整数：数值可以指定单位。如一些内存配置的参数可以指定KB、MB、GB等单位。<br />3）浮点数<br />4）字符串<br />5）枚举<br />还可以使用include 'filename' 指令包含文件中的配置内容。如果不是绝对路径，就是当前配置文件所在目录的相对路径。<br />配置参数查看：pg_settings
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
context字段为参数访问类型，分为以下几类：<br />1）internal :只读参数，这类参数值不能配置在postgresql.conf中，因为它们是由postgres 程序和在初始化实例时写死的。<br />2）postmaster :改变这些参数的值需要重启PostgreSQL实例才能生效。<br />3）sighup :改变这些参数的值，不需要重启数据库，只需要向postmaster进程发送SIGHUP信号，让其重启装载配置新的参数值就可以了。postmaster进程接收到SIGHUP信号后，也会向它的子进程发送SIGHUP信号，让新的参数值在所有的进程中都生效。<br />4）backend :更改这些设置无须重新启动服务器，只需要postmaster发送一个SIGHUP信号，但新的配置值只会出现在这之后的新连接中，在已有的连接中，这些参数的值不会改变。<br />5）Superuser :可以由超级用户使用set来改变，而超级用户改变此参数值时，只会影响自身的sesssion配置，不会影响其他用户。向postmaster进程发送SIGHUP信号，也只会影响后续建的连接，不会影响现有的连接。<br />6）user :普通用户可使用set命令改变本连接中的配置值。
## **2 连接配置**
连接数据库相关的配置有以下几种。<br />1）listen_ addresses : string类型。声明服务器监听客户端连接的TCP/IP地址，改变这个参数需要重启数据库服务。通常把此项配置为“*"，表示在本机的所有IP上监听。当配置成“0.0.0.0”，与“*”相同。如果这个列表是空的，那么服务器不会监听任何IP地址，这种情况下，只有UNIX域套接字可以连接到。<br />2）port: integer 类型。指定服务器监听的TCP端口，默认为5432。改变这个参数需要重<br />启数据库服务。同一个端口号用于服务器监听的所有IP地址。<br />3）max_connections: integer 类型。允许和数据库连接的最大并发连接数。改变这个参数<br />需要重启数据库服务。默认值通常是100，但是如果内核设置不支持这么大的值(在<br />initdb时判断)，可能就会小于100。这个参数只能在服务器启动的时候设置。<br />4）superuser_reserved_connections: integer 类型。为超级用户连接而保留的连接数。改变这个参数需要重启数据库服务。默认值是3。这个值必须小于max_connections的值。<br />5）unix_socket_directory: string 类型。声明服务器监听客户端连接的UNIX域套接字目录。<br />6）unix_socket_group: string 类型。设置UNIX域套接字的所属组。<br />7）unix_socket_permissions: integer 类型，设置UNIX域套接字的访问权限。<br />8）bonjour: boolean类型。<br />9）bonjour_name: string 类型，声明Bonjour服务名称。<br />10）tcp _keepalives_idle: integer 类型。表示在一个TCP连接中空闲多长时间后会发送一个keepalive报文。<br />11）tcp_keepalives_interval: integer 类型。在一个空闲TCP连接中，定义在发送第一个TCP keepalive包后如果在该参数给定的时间间隔内没有收到对端的回包，则开始发送第二TCP keepalive包，直到达到tcp_keepalives_count 次后仍没有收到回包，则认为连接已中断，关闭连接。<br />12）tcp_keepalives_count: integer 类型。
## **3 内存配置**
shared_buffers : 设置数据库服务器将使用的共享内存缓冲区数量，此缓冲区为缓存数据块所用。此缓冲区是放在共享内存中的。每个缓冲区大小的典型值是8K字节。这个数值必须大于16，并且至少是max_connections 数值的两倍。一个合理的shared_buffers开始值可以是物理内存的25%。增大这个参数可能导致PostgreSQL要求更多System V共享内存，可能超出操作系统共享内存配置参数允许的大小。<br />temp_buffers : 设置每个数据库会话使用的临时缓冲区的最大数目。此本地缓冲区只用于访问临时表。每个会话可以使用SET命令改变此设置值，但必须是在会话第一次使用临时表前设置，一旦使用临时表之后，再改变该数值将是无效的。<br />work_mem : 声明内部排序操作和Hash表在开始使用临时磁盘文件之前可使用的内存数目。
