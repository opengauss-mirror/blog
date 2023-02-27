---
title: 'pg_probackup包含新建表空间的备份及恢复'

date: '2022-11-07'
category: 'blog'
tags: ['pg_probackup包含新建表空间的备份及恢复']

archives: '2022-11'

author: '彭冲'

summary: 'pg_probackup包含新建表空间的备份及恢复'

img: '/zh/post/pengchong/title/img9.png'

times: '10:20'
---

# pg_probackup 包含新建表空间的备份及恢复

本文出处：[https://www.modb.pro/db/404169](https://www.modb.pro/db/404169)

pg_probackup 是一个比较方便的备份管理工具，当前 2.5.5 版本支持 PostgreSQL 9.6, 10, 11, 12, 13, 14，pg_probackup 基本配置操作可以查看这篇文章：
[PostgreSQL 备份恢复管理器 pg_probackup](https://www.modb.pro/db/21780)

PostgreSQL 里大部分场景下并不需要新建表空间，当用户新建表空间之后，备份恢复需要做一些额外的设置。

## 一、pg_basebackup 与新建表空间

首先是 pg_basebackup 备份时需要做表空间映射，否则会出现如下错误

```
[postgres@pg ~]$ pg_basebackup --pgdata=datarec
pg_basebackup: error: directory "/home/postgres/test_spc1" exists but is not empty
pg_basebackup: removing data directory "datarec"
```

提示/home/postgres/test_spc1 路径非空，不能进行备份，其实是数据库有新建表空间，数据存放在/home/postgres/test_spc1 下。

```
postgres=# \db
               List of tablespaces
    Name    |  Owner   |         Location
------------+----------+--------------------------
 myspc1     | postgres | /home/postgres/test_spc1
 pg_default | postgres |
 pg_global  | postgres |
(3 rows)
```

pg_basebackup 做备份，拷贝 PGDATA 目录时也会把下面用户新建表空间这个符号链接拷贝到 datarec 目录，这在同一台机器上会有冲突。

```
$ ll pg_tblspc/172428
lrwxrwxrwx 1 postgres dba 24 May 17 15:19 pg_tblspc/172428 -> /home/postgres/test_spc1
```

所以需要使用–tablespace-mapping 来进行表空间映射：

```
$ pg_basebackup --pgdata=datarec \
--tablespace-mapping=/home/postgres/test_spc1=/home/postgres/test_spc2
```

备份完之后可以查看新的 PGDATA 目录表空间符号链接指向了新的目录：

```
$ ll datarec/pg_tblspc/172428
lrwxrwxrwx 1 postgres dba 24 May 17 17:59 datarec/pg_tblspc/172428 -> /home/postgres/test_spc2
```

如此就可以在本机进行恢复测试。

## 二、pg_probackup 备份新建表空间

不过当我们使用 pg_probackup 进行备份时，pg_probackup 会自动识别符号链接进行实际数据拷贝，并不需要像 pg_basebackup 那样进行映射。如下所示：pg_probackup 会正常备份

```
$ pg_probackup backup \
--backup-path=/home/postgres/pgdata_probackup \
--instance local_1402 \
--backup-mode=full \
--stream --temp-slot
```

## 三、pg_probackup 恢复新建表空间

但是在本机进行恢复时需要进行映射，pg_probackup 恢复不指定表空间映射会提示下面的错误：

```
$ pg_probackup restore  \
--backup-path=/home/postgres/pgdata_probackup \
--pgdata=/home/postgres/data1402_rec \
--instance local_1402
INFO: Tablespace 172428 will be restored using old path "/home/postgres/test_spc1"
ERROR: Restore tablespace destination is not empty: "/home/postgres/test_spc1"
```

下面则可以正常恢复

```
$ pg_probackup restore  \
--backup-path=/home/postgres/pgdata_probackup \
--tablespace-mapping='/home/postgres/test_spc1=/home/postgres/test_spc1_bak' \
--pgdata=/home/postgres/data1402_rec \
--instance local_1402
INFO: Tablespace 172428 will be remapped from "/home/postgres/test_spc1" to "/home/postgres/test_spc1_bak"
INFO: Validating backup RC0N61
INFO: Backup RC0N61 data files are valid
INFO: Backup RC0N61 WAL segments are valid
INFO: Backup RC0N61 is valid.
INFO: Restoring the database from backup at 2022-05-17 15:22:49+08
INFO: Start restoring backup files. PGDATA size: 117MB
INFO: Backup files are restored. Transfered bytes: 117MB, time elapsed: 4s
INFO: Restore incremental ratio (less is better): 100% (117MB/117MB)
INFO: Syncing restored files to disk
INFO: Restored backup files are synced, time elapsed: 10s
INFO: Restore of backup RC0N61 completed.
```

恢复之后进入数据库查看表空间路径已经修改为上面映射的新目录路径了。

```
postgres=# \db
                 List of tablespaces
    Name    |  Owner   |           Location
------------+----------+------------------------------
 myspc1     | postgres | /home/postgres/test_spc1_bak
 pg_default | postgres |
 pg_global  | postgres |
(3 rows)
```

用户新建表空间下的数据也可正常使用。

## 四、新建表空间与 PGDATA 路径的关系

- PostgreSQL 里新建表空间可以放在 PGDATA 的上层，也可以放在 PGDATA 里面(包括 PGDATA 目录)，其实没有限制。
- openGauss 里新建表空间可以放在 PGDATA 的上层，不能放在 PGDATA 里面(包括 PGDATA 目录)。

下面是在 openGauss 数据库里使用 PGDATA 目录或者 PGDATA 子目录来新建表空间都会提示报错(PostgreSQL 可以成功创建，会有警告提示):

```
postgres=# create tablespace my_tblspace2 location '/opt/data3000/';
ERROR:  tablespace cannot be created under data directory
postgres=#
postgres=# create tablespace my_tblspace3 location '/opt/data3000/test';
ERROR:  tablespace cannot be created under data directory
```

建议：新建表空间既不要放在 PGDATA 目录的上层或下层，尽量独立，否则一些备份工具可能不支持。

## 五、pg_probackup 与 gs_probackup 恢复对比

gs_probackup 全备与前面介绍 pg_probackup 备份一致，都不需要进行表空间映射。

gs_probackup 本机恢复需要先删除原 PGDATA 数据及新建表空间目录数据，pg_probackup 相对而言更灵活，可以指定新的 PGDATA 并对新建表空间进行路径映射(参考上面的第三节)。

下面是使用 gs_probackup 尝试恢复错误提示：

```
$ gs_probackup restore  \
--backup-path=/home/omm/pgdata_probackup \
--pgdata=/home/omm/datarec \
--instance local_3000
LOG: Restore begin.
LOG: check tablespace directories of backup RC0SW8
ERROR: restore tablespace destination is not empty: "/opt"
```

指定–tablespace-mapping

```
$ gs_probackup restore  \
--backup-path=/home/omm/pgdata_probackup \
--tablespace-mapping='/opt=/home/omm/mytblspac' \
--pgdata=/home/omm/datarec \
--instance local_3000
ERROR: If specify --tablespace-mapping option, you must specify --external-mapping option together
```

同时指定–tablespace-mapping 和–external-mapping

```
gs_probackup restore  \
--backup-path=/home/omm/pgdata_probackup \
--tablespace-mapping='/opt=/home/omm/mytblspac' \
--external-mapping='/opt=/home/omm/mytblspac' \
--pgdata=/home/omm/datarec \
--instance local_3000
ERROR: --external-mapping option's old directory doesn't have an entry in list of external directories of current backup: "/opt"
```

## 六、结论

1. 用户新建表空间 pg_probackup 可以自动处理，无需考虑 baseback 表空间映射问题。
2. pg_probackup 可以同时进行本机恢复测试，不会影响本地实例的正常运行。
