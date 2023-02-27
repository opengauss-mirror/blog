---
title: 'MogDB学习笔记之 -- 了解pagewriter线程'

date: '2022-04-13'

category: 'blog'
tags: ['MogDB学习笔记之 -- 了解pagewriter线程']

archives: '2022-04'

author: '李真旭'

summary: 'MogDB学习笔记之 -- 了解pagewriter线程'

img: '/zh/blogs/lizhenxu/title/img6.png'

times: '10:20'
---

# MogDB 学习笔记之 -- 了解 pagewriter 线程

本文出处：https://www.modb.pro/db/183172

在前面的 MogDB 学习系列中，我们了解了核心的 bgwriter 进程，今天继续来学习另外一个主要的线程，即 pagewriter；首先来看下数据库相关的参数设置：

```
postgres=# select name,setting,category,context from pg_settings where name like '%pagewrit%';
         name          | setting |              category               |  context
-----------------------+---------+-------------------------------------+------------
 log_pagewriter        | off     | Reporting and Logging / What to Log | sighup
 pagewriter_sleep      | 2000    | Write-Ahead Log / Checkpoints       | sighup
 pagewriter_thread_num | 2       | Write-Ahead Log / Checkpoints       | postmaster
(3 rows)
```

从上面的参数来看，我们可以知道 pagewriter 线程的数量由参数 pagewriter_thread_num 来控制；默认情况下一共有 2 个 pagewriter 线程。
其中一个是 master 主线程。从 MogDB 官方文档来看，pagewriter 主要负责从全局脏页队列中获取脏页，然后将其写入 double write 文件。由于有多个 pagewriter 线程，
那么是如何工作和协调的呢？ 毫无疑问，是主线程扫描到需要写入的脏页后，将其分发个其他 pagewriter 线程，最终写入文件系统落盘。

其次从另外一个参数 pagewriter_sleep 参数来看，表示 pagewriter 线程的唤醒睡眠时间，单位是 ms。这跟增量检查点有关。也就是说该参数
设置后，pagewirter 线程会间隔 2s（默认值）开始扫描脏页并进行刷新，这同时也推进了数据库检查点。

不过这里需要注意的是，如果当 shared_buffers 中的脏页过多，页比例达到 dirty_page_percent_max 设置时，每次刷新脏页的的数量将会更大；
将会根据 max_io_capacity 来进行计算。

接下来我们简单做一下测试，跟踪一下 pagewriter 线程，观察一下相关的操作，是否如上面所讲：

```

[omm@mogdb ~]$ ps -ef|grep mogdb|grep -v grep
avahi      9129      1  0 01:02 ?        00:00:03 avahi-daemon: running [mogdb.local]
omm       14421      1 99 05:05 pts/1    00:05:46 /data/mogdb/bin/mogdb -D /data/mogdb_b75b585a/data/db1
[omm@mogdb ~]$ ps -T -p 14421
   PID   SPID TTY          TIME CMD
 14421  14421 pts/1    00:00:02 mogdb
 14421  14422 pts/1    00:00:00 jemalloc_bg_thd
 14421  14425 pts/1    00:00:00 mogdb
 14421  14426 pts/1    00:00:00 syslogger
 14421  14427 pts/1    00:00:00 jemalloc_bg_thd
 14421  14428 pts/1    00:00:00 alarm
 14421  14429 pts/1    00:00:00 jemalloc_bg_thd
 14421  14430 pts/1    00:00:00 reaper
 14421  14431 pts/1    00:00:00 jemalloc_bg_thd
 14421  14456 pts/1    00:00:00 checkpointer
 14421  14457 pts/1    00:00:01 pagewriter
 14421  14460 pts/1    00:00:00 pagewriter
 14421  14461 pts/1    00:00:00 bgwriter
 14421  14462 pts/1    00:00:00 bgwriter
 14421  14463 pts/1    00:00:00 CBMwriter
 14421  14464 pts/1    00:04:20 WALwriter
 14421  14465 pts/1    00:00:00 WALwriteraux
 14421  14466 pts/1    00:00:00 AVClauncher
 14421  14467 pts/1    00:00:00 Jobscheduler
 14421  14468 pts/1    00:00:00 statscollector
 14421  14469 pts/1    00:00:00 snapshotworker
 14421  14470 pts/1    00:01:24 percentworker
 14421  14471 pts/1    00:00:02 ashworker
 14421  14472 pts/1    00:00:00 TrackStmtWorker
 14421  14473 pts/1    00:00:00 auditor
 14421  14474 pts/1    00:00:00 2pccleaner
 14421  14475 pts/1    00:00:00 faultmonitor
 14421  14487 pts/1    00:00:00 worker

```

下面创建一些测试表来进行一些探索。

```
enmotech=# create table test1123 as select * from pg_settings;
INSERT 0 601
enmotech=# insert into test1123 select * from test1123;
INSERT 0 601
enmotech=# insert into test1123 select * from test1123;
INSERT 0 1202
enmotech=# insert into test1123 select * from test1123;
INSERT 0 2404
enmotech=# insert into test1123 select * from test1123;
INSERT 0 4808
enmotech=# insert into test1123 select * from test1123;
INSERT 0 9616
enmotech=# insert into test1123 select * from test1123;
INSERT 0 19232
enmotech=# insert into test1123 select * from test1123;
INSERT 0 38464
enmotech=# select pg_relation_filepath('test1123');
 pg_relation_filepath
----------------------
 base/16423/16453
(1 row)

enmotech=# insert into test1123 select * from test1123;
INSERT 0 76928
enmotech=#
enmotech=# vacuum test1123;
VACUUM
enmotech=# vacuum test1123;
VACUUM
enmotech=# vacuum test1123;
VACUUM
enmotech=#   SELECT OID,relname FROM pg_class where OID=16456;
  oid  |    relname
-------+----------------
 16456 | pg_toast_16453
(1 row)


复制
```

这时候我们打开 strace 对 page write 线程做一个跟踪。

```

[omm@mogdb ~]$ strace -fr -o /tmp/14457.log -p 14457
strace: Process 14457 attached with 28 threads
strace: Process 14625 attached
strace: Process 14626 attached
strace: Process 14627 attached
strace: Process 14628 attached
strace: Process 14637 attached
strace: Process 14638 attached
 strace: Process 14639 attached
^Cstrace: Process 14457 detached
strace: Process 14421 detached
strace: Process 14422 detached
strace: Process 14425 detached
strace: Process 14426 detached
strace: Process 14427 detached
strace: Process 14428 detached
strace: Process 14429 detached
strace: Process 14430 detached
strace: Process 14431 detached
strace: Process 14456 detached
strace: Process 14460 detached
strace: Process 14461 detached
strace: Process 14462 detached
strace: Process 14463 detached
strace: Process 14464 detached
strace: Process 14465 detached
strace: Process 14466 detached
strace: Process 14467 detached
strace: Process 14468 detached
strace: Process 14469 detached
strace: Process 14470 detached
strace: Process 14471 detached
strace: Process 14472 detached
strace: Process 14473 detached
strace: Process 14474 detached
strace: Process 14475 detached
strace: Process 14487 detached
```

这里我跟踪了多次，包括在进行 vcauum 操作时。

获取相关操作文件的句柄信息：

```
[root@mogdb fd]# ls -ltr
total 0
l-wx------. 1 omm dbgrp 64 Nov 23 05:09 2 -> pipe:[130481]
lrwx------. 1 omm dbgrp 64 Nov 23 05:11 97 -> /data/mogdb_b75b585a/data/db1/base/16423/14707
lrwx------. 1 omm dbgrp 64 Nov 23 05:11 96 -> /data/mogdb_b75b585a/data/db1/base/16423/14706
lrwx------. 1 omm dbgrp 64 Nov 23 05:11 95 -> /data/mogdb_b75b585a/data/db1/base/16423/16458
lrwx------. 1 omm dbgrp 64 Nov 23 05:11 94 -> /data/mogdb_b75b585a/data/db1/base/16423/16456
lrwx------. 1 omm dbgrp 64 Nov 23 05:11 93 -> /data/mogdb_b75b585a/data/db1/base/16423/14737
lrwx------. 1 omm dbgrp 64 Nov 23 05:11 92 -> /data/mogdb_b75b585a/data/db1/base/16423/14737_fsm
lrwx------. 1 omm dbgrp 64 Nov 23 05:11 91 -> /data/mogdb_b75b585a/data/db1/base/16423/14692
lrwx------. 1 omm dbgrp 64 Nov 23 05:11 90 -> /data/mogdb_b75b585a/data/db1/base/16423/14692_fsm
lrwx------. 1 omm dbgrp 64 Nov 23 05:11 9 -> socket:[130470]
lrwx------. 1 omm dbgrp 64 Nov 23 05:11 89 -> /data/mogdb_b75b585a/data/db1/base/16423/14703_fsm
......
lr-x------. 1 omm dbgrp 64 Nov 23 05:11 41 -> pipe:[129754]
lr-x------. 1 omm dbgrp 64 Nov 23 05:11 40 -> pipe:[130495]
l-wx------. 1 omm dbgrp 64 Nov 23 05:11 4 -> /var/log/mogdb/omm/bin/gs_obs/gs_obs.interface.log
lr-x------. 1 omm dbgrp 64 Nov 23 05:11 39 -> pipe:[130490]
l-wx------. 1 omm dbgrp 64 Nov 23 05:11 38 -> pipe:[129753]
lr-x------. 1 omm dbgrp 64 Nov 23 05:11 37 -> pipe:[129753]
l-wx------. 1 omm dbgrp 64 Nov 23 05:11 36 -> pipe:[129752]
l-wx------. 1 omm dbgrp 64 Nov 23 05:11 35 -> pipe:[129756]
lr-x------. 1 omm dbgrp 64 Nov 23 05:11 34 -> pipe:[129756]
l-wx------. 1 omm dbgrp 64 Nov 23 05:11 33 -> pipe:[130486]
l-wx------. 1 omm dbgrp 64 Nov 23 05:11 32 -> pipe:[129751]
lr-x------. 1 omm dbgrp 64 Nov 23 05:11 31 -> pipe:[129751]
lr-x------. 1 omm dbgrp 64 Nov 23 05:11 30 -> pipe:[130486]
l-wx------. 1 omm dbgrp 64 Nov 23 05:11 3 -> /data/mogdb_b75b585a/data/db1/pg_ctl.lock
lr-x------. 1 omm dbgrp 64 Nov 23 05:11 29 -> pipe:[129752]
lrwx------. 1 omm dbgrp 64 Nov 23 05:11 28 -> /data/mogdb_b75b585a/data/db1/pg_cbm/pg_xlog_1_0000000009000258_0000000000000000.cbm
lrwx------. 1 omm dbgrp 64 Nov 23 05:11 27 -> /data/mogdb_b75b585a/data/db1/global/pg_dw_single
lrwx------. 1 omm dbgrp 64 Nov 23 05:11 26 -> /data/mogdb_b75b585a/data/db1/global/pg_dw


[root@mogdb tmp]# cat 14457_2.log |grep 14457|grep "pwrite64(" |awk '{print $3}'|sort|uniq
pwrite64(26,
pwrite64(74,
pwrite64(77,
[root@mogdb tmp]#
[root@mogdb tmp]# cat 14457.log |grep 14457|grep "pwrite64(" |awk '{print $3}'|sort|uniq
pwrite64(26,
pwrite64(77,
[root@mogdb tmp]# cat 14457.log |grep 14460|grep "pwrite64(" |awk '{print $3}'|sort|uniq
pwrite64(77,
pwrite64(94,
[root@mogdb tmp]# cat 14457_2.log |grep 14460|grep "pwrite64(" |awk '{print $3}'|sort|uniq
pwrite64(77,
pwrite64(96,
[root@mogdb tmp]#
```

其中 26 号文件是 double writer 文件。另外发现 pagewriter 线程还会写其他文件，比如 94 号文件，查下发现是如下对象：

```
enmotech=#   SELECT OID,relname FROM pg_class where OID=16456;
  oid  |    relname
-------+----------------
 16456 | pg_toast_16453
(1 row)
```

看到这个 pg_toast 表还是非常奇怪，查询了相关材料发现，这是 PostgreSQL 特有的机制之一。对于 PostgreSQL 而言，页是数据在文件存储中的基本单位，默认大小为 8192 byte。同时，PostgreSQL 不允许一行数据跨页存储，那么对于超长的行数据，就会启动 TOAST，具体就是采用压缩和切片的方式。如果启用了切片，实际数据存储在另一张系统表的多个行中，
这就叫 TOAST 表，这种存储方式叫行外存储。由于 MogDB 沿用了 opengauss 内核，而 openGauss 内核又是基于 PostgreSQL 9.2.4 进化而来，因此不难看出，这仍然是用了原生 PostgreSQL 的一些机制。最后简单总结一下 pagewriter 线程的作用：1、扫描 share_buffers 中的脏页链表，获取脏页，同时将脏页写入到 double write 文件。
2、推进检查点（实际上是增量检查点).
