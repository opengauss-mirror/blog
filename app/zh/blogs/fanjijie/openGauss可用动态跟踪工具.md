---
title: 'openGauss可用动态跟踪工具'

date: '2022-04-06'

category: 'blog'
tags: ['openGauss可用动态跟踪工具']

archives: '2022-04'

author: '范计杰'

summary: 'openGauss可用动态跟踪工具'

img: '/zh/blogs/fanjijie/title/img20.png'

times: '11:37'
---

# openGauss 可用动态跟踪工具

分析疑难问题时，掌握数据库之外的一些动态跟踪工具可以事半功倍。

## openGauss 获取 OS 线程 ID

```
omm=# select pg_backend_pid();
 pg_backend_pid
-----------------
 140535517730560
(1 row)

omm=# \d pg_os_threads
           View "pg_catalog.pg_os_threads"
    Column     |           Type           | Modifiers
---------------+--------------------------+-----------
 node_name     | text                     |
 pid           | bigint                   |
 lwpid         | integer                  |
 thread_name   | text                     |
 creation_time | timestamp with time zone |

select lwpid from pg_os_threads where pid=pg_backend_pid();

omm=# select lwpid from pg_os_threads where pid=pg_backend_pid();
 lwpid
-------
  3565
(1 row)
```

## gstrace

gstrace 是 openGauss 提供的用来跟踪内核代码执行路径，记录内核数据结构，分析代码性能的工具。Trace 的有限点位和数据在版本中被固化，无法动态添加和删除。

```
omm=# select lwpid from pg_os_threads where pid=pg_backend_pid();

 lwpid
-------

  3565
(1 row)

[root@centos7 ~]# ps -ef |grep openGauss
omm       1783     1  2 18:48 pts/0    00:00:22 /opt/openGauss/app/bin/openGauss -D primary -M primary

gstrace不能只针对某个Thread收集trace数据
gstrace start -p 1783
gstrace config -p 1783

---做vacuum操作
omm=# vacuum t;
VACUUM


gstrace dump -p 1783 -o gstrace.log
gstrace codepath -f  gstrace.log  -o codepath.txt

vi codepath.txt 查找tid: 3565

pid: 1783  tid: 3565

45       StartTransaction ENTRY
46       StartTransaction EXIT 26.000000
47       PortalStart ENTRY
48       PortalStart EXIT 7.000000
49       PortalRun ENTRY
50       | vacuum_rel ENTRY
51       | | StartTransaction ENTRY
52       | | StartTransaction EXIT 7.000000
53       | | lazy_vacuum_rel ENTRY
54       | | | lazy_scan_heap ENTRY
55       | | | | heap_page_prune ENTRY
56       | | | | | heap_prune_chain ENTRY
57       | | | | | heap_prune_chain EXIT 2.000000
58       | | | | | heap_prune_chain ENTRY
59       | | | | | heap_prune_chain EXIT 1.000000
60       | | | | | heap_prune_chain ENTRY
61       | | | | | heap_prune_chain EXIT 1.000000
62       | | | | | heap_prune_chain ENTRY
63       | | | | | heap_prune_chain EXIT 17.000000
64       | | | | | heap_prune_chain ENTRY
65       | | | | | heap_prune_chain EXIT 1.000000
```

gstrace analyze -f gstrace.log -o analyze.txt

<img src='https://oss-emcsprod-public.modb.pro/image/editor/20211231-51a12427-664d-4add-9289-5053b41956d5.png'><img src='https://www.modb.pro/db/openGauss%E5%8F%AF%E7%94%A8%E5%8A%A8%E6%80%81%E8%B7%9F%E8%B8%AA%E5%B7%A5%E5%85%B7.assets/image-20211209192219550.png'>

gstrace detail -f gstrace.log -o detail.txt

```
cat detail.txt |grep "Tid: 3565"|more
45     ENTRY, Pid: 1783, Tid: 3565, Function: StartTransaction MicroSecond:625972 Thu Dec  9 19:13:05 2021
46     EXIT, Pid: 1783, Tid: 3565, Function: StartTransaction MicroSecond:625998 Thu Dec  9 19:13:05 2021
47     ENTRY, Pid: 1783, Tid: 3565, Function: PortalStart MicroSecond:626117 Thu Dec  9 19:13:05 2021
48     EXIT, Pid: 1783, Tid: 3565, Function: PortalStart MicroSecond:626124 Thu Dec  9 19:13:05 2021
49     ENTRY, Pid: 1783, Tid: 3565, Function: PortalRun MicroSecond:626126 Thu Dec  9 19:13:05 2021
50     ENTRY, Pid: 1783, Tid: 3565, Function: vacuum_rel MicroSecond:637168 Thu Dec  9 19:13:05 2021
51     ENTRY, Pid: 1783, Tid: 3565, Function: StartTransaction MicroSecond:637172 Thu Dec  9 19:13:05 2021
52     EXIT, Pid: 1783, Tid: 3565, Function: StartTransaction MicroSecond:637179 Thu Dec  9 19:13:05 2021
53     ENTRY, Pid: 1783, Tid: 3565, Function: lazy_vacuum_rel MicroSecond:637211 Thu Dec  9 19:13:05 2021
54     ENTRY, Pid: 1783, Tid: 3565, Function: lazy_scan_heap MicroSecond:637280 Thu Dec  9 19:13:05 2021
55     ENTRY, Pid: 1783, Tid: 3565, Function: heap_page_prune MicroSecond:637329 Thu Dec  9 19:13:05 2021
```

## gdb 跟踪

UNIX 及 UNIX-like 下的调试工具

```
omm=# select lwpid from pg_os_threads where pid=pg_backend_pid();
 lwpid
-------
  8226
(1 row)


[omm@centos7 ~]$ ps -ef |grep openGauss
omm       8144     1  3 19:43 pts/0    00:00:01 /opt/openGauss/app/bin/openGauss -D primary -M primary


[omm@centos7 ~]$ gdb -p 8144
(gdb) info threads
  Id   Target Id         Frame
  35   Thread 0x7f96b73ff700 (LWP 8145) "jemalloc_bg_thd" 0x00007f96b89649f5 in pthread_cond_wait@@GLIBC_2.3.2 () from /lib64/libpthread.so.0
  34   Thread 0x7f968f5bf700 (LWP 8150) "openGauss" 0x00007f96b8968381 in sigwait () from /lib64/libpthread.so.0
  33   Thread 0x7f96860ff700 (LWP 8151) "syslogger" 0x00007f96b867ebed in poll () from /lib64/libc.so.6
  32   Thread 0x7f96850fe700 (LWP 8152) "alarm" 0x00007f96b867ebed in poll () from /lib64/libc.so.6
  31   Thread 0x7f96840fd700 (LWP 8153) "reaper" 0x00007f96b867ebed in poll () from /lib64/libc.so.6
  30   Thread 0x7f96779ff700 (LWP 8180) "checkpointer" 0x00007f96b867ebed in poll () from /lib64/libc.so.6
  29   Thread 0x7f96769fe700 (LWP 8181) "pagewriter" 0x00007f96b867ebed in poll () from /lib64/libc.so.6
  28   Thread 0x7f96759fd700 (LWP 8182) "pagewriter" 0x00007f96b867ebed in poll () from /lib64/libc.so.6
  27   Thread 0x7f96749fc700 (LWP 8183) "bgwriter" 0x00007f96b867ebed in poll () from /lib64/libc.so.6
...........
  3    Thread 0x7f96531cf700 (LWP 8211) "WalSender" 0x00007f96b867ebed in poll () from /lib64/libc.so.6
  2    Thread 0x7f96521ce700 (LWP 8226) "worker" 0x00007f96b8967aab in recv () from /lib64/libpthread.so.0
* 1    Thread 0x7f96c1212700 (LWP 8144) "openGauss" 0x00007f96b867ebed in poll () from /lib64/libc.so.6

(gdb) thread 2
[Switching to thread 2 (Thread 0x7f96521ce700 (LWP 8226))]
#0  0x00007f96b8967aab in recv () from /lib64/libpthread.so.0
(gdb) break fsm_vacuum_page thread 2
Breakpoint 1 at 0x55f536c547a4
(gdb)
Breakpoint 1 at 0x55f536c547a4
(gdb) info break
Num     Type           Disp Enb Address            What
1       breakpoint     keep y   0x000055f536c547a4 <fsm_vacuum_page(RelationData*, FSMAddress const&, bool*)+4> thread 36
        stop only in thread 36
(gdb) handle all nostop noprint  #####让gdb不要在收到信号时中断，不然会频繁中断
(gdb) c
Continuing.
[Switching to Thread 0x7f96521ce700 (LWP 10792)]


omm=# vacuum t;

Breakpoint 1, 0x000055f536c547a4 in fsm_vacuum_page(RelationData*, FSMAddress const&, bool*) ()
(gdb)

(gdb) bt
#0  0x000055f536c547a4 in fsm_vacuum_page(RelationData*, FSMAddress const&, bool*) ()
#1  0x000055f536c551dc in FreeSpaceMapVacuum(RelationData*) ()
#2  0x000055f53664c171 in lazy_vacuum_rel(RelationData*, VacuumStmt*, BufferAccessStrategyData*) ()
#3  0x000055f536647590 in vacuum_rel(unsigned int, VacuumStmt*, bool) ()
#4  0x000055f536648fd1 in vacuum(VacuumStmt*, unsigned int, bool, BufferAccessStrategyData*, bool) ()
#5  0x000055f53670d58c in DoVacuumMppTable(VacuumStmt*, char const*, bool, bool) ()
#6  0x000055f5367106ca in standard_ProcessUtility(Node*, char const*, ParamListInfoData*, bool, _DestReceiver*, bool, char*) ()
#7  0x00007f96ae686e7b in ?? ()
#8  0x00007f96521a4690 in ?? ()
#9  0x00007f96ae684bee in ?? ()
#10 0x0000000000000000 in ?? ()
(gdb) c
Continuing.
```

## systemtap 跟踪

systemtap 是 Linux 下一个非常有用的调试（跟踪/探测）工具，常用于 Linux 内核或者应用程序的信息采集，比如：获取一个函数里面运行时的变量、调用堆栈，甚至可以直接修改变量的值，对诊断性能或功能问题非常有帮助

```
获取变量信息，可能编译时优化级别较高，没办法拿到变量信息
stap -vL 'process("/opt/openGauss/app/bin/openGauss").function("*vacuum*")'

stap -ve 'probe process("/opt/openGauss/app/bin/openGauss").function("*vacuum*"){if(tid()==$1)printf("%s\n",ppfunc())}' -x 1783 3565

----做vacuum操作
vacuum t;

-----跟踪出来的函数都带加了其它字符，而且比gstrace跟踪出来的少。
_Z6vacuumP10VacuumStmtjbP24BufferAccessStrategyDatab
_Z18pgstat_vacuum_statv
_ZL10vacuum_reljP10VacuumStmtb
_Z15lazy_vacuum_relP12RelationDataP10VacuumStmtP24BufferAccessStrategyData
_Z21vacuum_set_xid_limitsP12RelationDatallPmS1_S1_
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_Z18vacuum_delay_pointv
_ZL15fsm_vacuum_pageP12RelationDataRK10FSMAddressPb
_ZL15fsm_vacuum_pageP12RelationDataRK10FSMAddressPb
_ZL15fsm_vacuum_pageP12RelationDataRK10FSMAddressPb
_ZL15fsm_vacuum_pageP12RelationDataRK10FSMAddressPb
_ZL15fsm_vacuum_pageP12RelationDataRK10FSMAddressPb
_Z20pgstat_report_vacuumjjbl
```

## perf

perf 是 Linux 下的一款性能分析工具。

```
---记录perf数据
[root@centos7 ~]# ps -ef |grep openGauss
omm      13739     1  8 12:24 pts/0    00:00:42 /opt/openGauss/app/bin/openGauss -D /opt/openGauss/data/db1
root     14953 12118  0 12:32 pts/3    00:00:00 grep --color=auto openGauss


omm=# select lwpid from pg_os_threads where pid=pg_backend_pid();
 lwpid
-------
  4448
(1 row)



-p 指定进程ID
-t 指定线程ID


[root@centos7 ~]# perf record -g -F 99 -a -p 13739
info: Using a maximum frequency rate of 100,000 Hz
Warning:
PID/TID switch overriding SYSTEM
^C[ perf record: Woken up 1 times to write data ]
[ perf record: Captured and wrote 0.024 MB perf.data (3 samples) ]





---离线分析
[root@centos7 ~]# perf report -i perf.data

Samples: 3  of event 'cpu-clock', Event count (approx.): 30000
  Children      Self  Command  Shared Object       Symbol
+   66.67%    66.67%  worker   [kernel.kallsyms]   [k] finish_task_switch
+   66.67%     0.00%  worker   libpthread-2.17.so  [.] __libc_recv
+   66.67%     0.00%  worker   [unknown]           [.] 0xffffffff9738bede
+   66.67%     0.00%  worker   [unknown]           [.] 0xffffffff9722f61e
+   66.67%     0.00%  worker   [unknown]           [.] 0xffffffff9722d668
+   66.67%     0.00%  worker   [unknown]           [.] 0xffffffff9722d4f5
+   66.67%     0.00%  worker   [unknown]           [.] 0xffffffff9730cb04
+   66.67%     0.00%  worker   [unknown]           [.] 0xffffffff9730c439
+   66.67%     0.00%  worker   [unknown]           [.] 0xffffffff9737cb51
+   66.67%     0.00%  worker   [unknown]           [.] 0xffffffff9737f1c9
+   66.67%     0.00%  worker   [unknown]           [.] 0xffffffff9737ec28
+   66.67%     0.00%  worker   [unknown]           [.] 0xffffffff96cd3f04
+   33.33%    33.33%  worker   openGauss               [.] errstart
+   33.33%     0.00%  worker   libpthread-2.17.so  [.] start_thread
+   33.33%     0.00%  worker   openGauss               [.] InternalThreadFunc
+   33.33%     0.00%  worker   openGauss               [.] GaussDbThreadMain<(knl_thread_role)1>
+   33.33%     0.00%  worker   openGauss               [.] BackendRun
+   33.33%     0.00%  worker   openGauss               [.] PostgresMain
+   33.33%     0.00%  worker   openGauss               [.] exec_simple_query
+   33.33%     0.00%  worker   openGauss               [.] PortalRun
+   33.33%     0.00%  worker   openGauss               [.] PortalRunMulti
+   33.33%     0.00%  worker   openGauss               [.] PortalRunUtility
+   33.33%     0.00%  worker   openGauss               [.] pgaudit_ProcessUtility
+   33.33%     0.00%  worker   security_plugin.so  [.] gsaudit_ProcessUtility_hook
+   33.33%     0.00%  worker   openGauss               [.] standard_ProcessUtility
+   33.33%     0.00%  worker   openGauss               [.] DoVacuumMppTable
+   33.33%     0.00%  worker   openGauss               [.] vacuum
+   33.33%     0.00%  worker   openGauss               [.] pgstat_vacuum_stat
+   33.33%     0.00%  worker   openGauss               [.] heap_getnext
+   33.33%     0.00%  worker   openGauss               [.] heapgettup
+   33.33%     0.00%  worker   openGauss               [.] HeapTupleSatisfiesVisibility
+   33.33%     0.00%  worker   openGauss               [.] HeapTupleSatisfiesNow

---perf script可以转换收集的数据为可读的文本
perf script -i perf.data > out.perf
```
