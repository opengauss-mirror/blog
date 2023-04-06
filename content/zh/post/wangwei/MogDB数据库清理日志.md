+++

title = "MogDB数据库清理日志" 

date = "2023-03-07" 

tags = ["MogDB"] 

archives = "2023-03" 

author = "云和恩墨-王维" 

summary = "MogDB数据库清理日志"

img = "/zh/post/wangwei/title/img37.png" 

times = "15:30"

+++

本文出处：[https://www.modb.pro/db/617624](https://www.modb.pro/db/617624)



测试环境发现根目录磁盘空间使用率100%，导致mogdb数据库挂起无法连接，顾需清理磁盘空间。

#### 1. 清理数据库操作日志

**操作日志：**指数据库管理员使用工具操作数据库时以及工具被MogDB调用时产生的日志。如果MogDB发生故障，可以通过这些日志信息跟踪用户对数据库进行了哪些操作，重现故障场景。

```
找到操作日志所在目录，转移或者删除可清理的日志。
[omm@rcy-mogdb dn_6001]$ cd $GAUSSLOG/pg_log/dn_6001
[omm@rcy-mogdb dn_6001]$ rm -rf postgresql-2022-08-*
```

####  2. 清理WAL日志

**预写式日志WAL**（Write Ahead Log，也称为Xlog）：是实现事务日志的标准方法，对数据文件（表和索引的载体）持久化修改之前必须先持久化相应的日志。如果要修改数据文件，必须是在这些修改操作已经记录到日志文件之后才能进行修改，即在描述这些变化的日志记录刷新到永久存储器之后。在系统崩溃时，可以使用WAL日志对MogDB进行恢复操作。也可称为REDO日志。
WAL日志文件以段文件的形式存储的，每个段为16MB，并分割成若干页，每页8KB。因为WAL日志的重要性，一般情况下不建议清理改日志，可以通过磁盘扩容来解决磁盘空间问题。本环境为测试环境所以本操作仅做方法参考！

**wal_keep_segments** : wal文件保留数量，每个文件16MB，增大此值，在重做备库过程中可有效避免wal被移除的错误
（下列操作将WAL日志保留数量从1024改成512个）

```
[omm@rcy-mogdb dn_6001]$ gs_guc check -I all -c "wal_keep_segments"
expected guc information: rcy-mogdb: wal_keep_segments=NULL: [/mogdb/data/db1/postgresql.conf]
gs_guc check: rcy-mogdb: wal_keep_segments=1024: [/mogdb/data/db1/postgresql.conf]

Total GUC values: 1. Failed GUC values: 0.
The value of parameter wal_keep_segments is same on all instances.
wal_keep_segments=1024

[omm@rcy-mogdb dn_6001]$ gs_guc set -I all -N all -c "wal_keep_segments=512"
NOTICE: When the server is turned on or archive log recovery from the checkpoint, the number of reserved log files may be larger than the set value wal_keep_segments. If this parameter is set too low, at the
time of the transaction log backup requests, the new transaction log may have been produced coverage request fails, disconnect the master and slave relationship.
Begin to perform the total nodes: 1.
Popen count is 1, Popen success count is 1, Popen failure count is 0.
Begin to perform gs_guc for datanodes.
Command count is 1, Command success count is 1, Command failure count is 0.

Total instances: 1. Failed instances: 0.
ALL: Success to perform gs_guc!

[omm@rcy-mogdb dn_6001]$ gs_guc check -I all -c "wal_keep_segments"
expected guc information: rcy-mogdb: wal_keep_segments=NULL: [/mogdb/data/db1/postgresql.conf]
gs_guc check: rcy-mogdb: wal_keep_segments=512: [/mogdb/data/db1/postgresql.conf]

Total GUC values: 1. Failed GUC values: 0.
The value of parameter wal_keep_segments is same on all instances.
wal_keep_segments=512

注：修改wal_keep_segments参数后等待MogDB自动清理WAL日志！
```

#### 3. 清理WAL归档日志

通过如下命令查看MogDB是否开启归档和归档路径：

```
[omm@rcy-mogdb dn_6001]$ gs_guc check -I all -c "archive_mode"
expected guc information: rcy-mogdb: archive_mode=NULL: [/mogdb/data/db1/postgresql.conf]
gs_guc check: rcy-mogdb: archive_mode=off: [/mogdb/data/db1/postgresql.conf]

Total GUC values: 1. Failed GUC values: 0.
The value of parameter archive_mode is same on all instances.
archive_mode=on

[omm@rcy-mogdb dn_6001]$ gs_guc check -I all -c "archive_dest"
expected guc information: rcy-mogdb: archive_dest=NULL: [/mogdb/data/db1/postgresql.conf]
gs_guc check: rcy-mogdb: archive_dest='/ogarchive': [/mogdb/data/db1/postgresql.conf]

Total GUC values: 1. Failed GUC values: 0.
The value of parameter archive_dest is same on all instances.
archive_dest='/ogarchive'
```

如下按需清理WAL归档日志：

```
[omm@rcy-mogdb dn_6001]$ cd /ogarchive/
[omm@rcy-mogdb ogarchive]$ rm -rf 0000000100000015000000CB
```
