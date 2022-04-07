+++

title = "openGauss数据库维护相关命令" 

date = "2022-04-07" 

tags = ["openGauss数据库维护相关命令"] 

archives = "2022-04" 

author = "云和恩墨交付战队" 

summary = "openGauss数据库维护相关命令"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"

+++

# openGauss数据库维护常用命令

### 查看数据库版本:

select version();

### 查看数据库启动时间：

select pg_postmaster_start_time();

### 查看最后加载配置文件的时间：

select pg_conf_load_time();

### 查看数据库时区：

show timezone;

### 查看数据库当前时间：

select now();

### 查看当前会话pid:

select pg_backend_pid();

### 查看当前数据库会话信息：

select pid,datname,usename,application_name,client_addr,client_port,state,now()-query_start query_duration,query,waiting from pg_stat_activity;

### 终止一个后台服务进程：

select pg_terminate_backend(pid);

### 查看当前的WAL日志相关信息：

select pg_current_xlog_location(),pg_xlogfile_name(pg_current_xlog_location()),pg_xlogfile_name_offset(pg_current_xlog_location());

其中：
pg_current_xlog_location()：获得当前wal日志写入位置。
pg_xlogfile_name():转换wal日志位置为文件名。
pg_xlogfile_name_offset():返回转换后的wal日志文件名和偏移量。

### 查看WAL日志缓存有多少字节未写入磁盘：

select pg_xlog_location_diff(pg_current_xlog_insert_location(),pg_current_xlog_location());

其中：
pg_current_xlog_location()：获得当前预写式日志写入位置
pg_current_xlog_insert_location()：获得当前预写式日志插入位置
pg_xlog_location_diff(location pg_lsn, location pg_lsn)计算两个预写式日志位置间的差别

### 切换WAL日志文件：

select pg_switch_xlog();

### 手动产生一次checkpoint:

checkpoint;

### 切换数据库日志文件：

select pg_rotate_logfile();

### 停止数据库备份：

select pg_stop_backup();

### 查看数据库是否为备库：

select pg_is_in_recovery();

### 查看数据库大小：

select pg_size_pretty(pg_database_size(‘database_name’));

其中：
pg_size_pretty()函数，可以根据情况将字节转换为KB、MB、GB 或者 TB。

### 查看表数据大小：

select pg_size_pretty(pg_relation_size(‘table_name’));

### 查看表数据和表上索引的总大小：

select pg_size_pretty(pg_total_relation_size(‘table_name’));

### 查看表上所有索引的大小：

select pg_size_pretty(pg_indexes_size(‘table_name’));

### 查看表空间大小：

select pg_size_pretty(pg_tablespace_size(‘tablespace_name’));

### 查看表所在数据文件：

select pg_relation_filepath(‘table_name’);



（未完待续）
