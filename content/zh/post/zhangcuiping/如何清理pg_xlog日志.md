+++

title = "如何清理pg_xlog日志？" 

date = "2023-09-20" 

tags = ["如何清理pg_xlog日志"] 

archives = "2023-09" 

author = "张翠娉" 

summary = "如何清理pg_xlog日志"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "16:50"
+++

# 如何清理pg_xlog日志？

**介绍**：

$PGDATA/pg_xlog是数据库的事务日志。 这是一些二进制日志文件的集合，文件名类似00000001000000000000008E，它包含最近事务的一些描述数据。这些日志也被用于二进制复制。如果复制、归档或者PITR失败了，当归档正在恢复时，这个目录保存的数据库日志可能会膨胀数据库。这可能会导致你用完你的磁盘空间。不像pg_log，你不能自由地删除、移动或者压缩这个目录的文件。你甚至不能在没有符号链接到该目录的情况下移动这个目录。删除pg_xlog的文件可能会导致不可恢复的数据库损坏。

**清理步骤**

1. 关闭数据库。

2. 在数据库操作系统用户下，进入数据库目录$PGDATA， 执行如下命令查看版本控制信息：

   注意如下两个参数：

   Latest checkpoint's NextXID: 0/ **1888**
   Latest checkpoint's NextOID: **65595**

   ```
   [postgres@localhost ~]$ pg_controldata
   pg_control version number:            903
   Catalog version number:               201105231
   Database system identifier:           5741432812849707775
   Database cluster state:               shut down
   pg_control last modified:             Thu 10 Jan 2013 07:56:36 AM CST
   Latest checkpoint location:           2/38000020
   Prior checkpoint location:            2/34009190
   Latest checkpoint's REDO location:    2/38000020
   Latest checkpoint's TimeLineID:       4
   Latest checkpoint's NextXID:          0/1888
   Latest checkpoint's NextOID:          65595
   Latest checkpoint's NextMultiXactId:  1
   Latest checkpoint's NextMultiOffset:  0
   Latest checkpoint's oldestXID:        1792
   Latest checkpoint's oldestXID's DB:   1
   Latest checkpoint's oldestActiveXID:  0
   Time of latest checkpoint:            Thu 10 Jan 2013 07:56:35 AM CST
   ```

3. 重置，删除pg_xlog。

   ```
   [postgres@localhost ~]$ pg_resetxlog -o 65595 -x1888 -f /database/pgdata/
   Transaction log reset
   ```

4. 查看各文件占用磁盘空间情况，重启数据库。

   发现xlog日志已清理，磁盘空间释放成功，数据库正常启动。

   ```
   [postgres@localhost pgdata]$ du -sh pg_xlog/
   193M    pg_xlog/
    
   [postgres@localhost pg_xlog]$ ll
   total 196620
   -rw-------. 1 postgres postgres      290 Nov 10 22:24 00000004000000010000003C.00000020.backup
   -rw-------. 1 postgres postgres 67108864 Jan 10 08:02 00000004000000020000000F
   -rw-------. 1 postgres postgres      113 Jun 17  2012 00000004.history
   drwxrwxr-x. 2 postgres postgres     4096 Jan 10 08:02 archive_status
   -rw-------. 1 postgres postgres 67108864 Nov 17 08:09 xlogtemp.1461
   -rw-------. 1 postgres postgres 67108864 Jan  3 09:35 xlogtemp.1518
    
   [postgres@localhost 12780]$ pg_start
   server starting
   [postgres@localhost 12780]$ psql
   Password: 
   psql (9.1.3)
   Type "help" for help.
    
   postgres=# \q
   ```

   **注意**： 可执行 `du -sh ./*` 查看当前目录下各文件占用磁盘空间情况。