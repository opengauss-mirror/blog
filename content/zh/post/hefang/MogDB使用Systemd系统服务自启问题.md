+++

title = "MogDB使用Systemd系统服务自启问题" 

date = "2022-05-24" 

tags = ["MogDB使用Systemd系统服务自启问题"] 

archives = "2022-05" 

author = "云和恩墨-何放" 

summary = "MogDB使用Systemd系统服务自启问题"

img = "/zh/post/hefang/title/img.png" 

times = "10:20"
+++

# MogDB使用Systemd系统服务自启问题

本文出处：[https://www.modb.pro/db/228477](https://www.modb.pro/db/228477)

问题由来是我们发现MogDB数据库日志频频出现的报错：

```
[BACKEND] LOG:  out of file descriptors: Too many open files; release and retry
[BACKEND] LOG:  could not open temporary statistics file "pg_stat_tmp/pgstat.stat": Too many open files
[BACKEND] LOG:  out of file descriptors: Too many open files; release and retry
[BACKEND] LOG:  could not open temporary statistics file "pg_stat_tmp/pgstat.stat": Too many open files
[BACKEND] LOG:  count not accept new connection: Too many open files
```

字面意思理解就是，打开文件过多，要求释放再尝试。日志报上述情况，是从最近的一次服务器重启之后，数据库以开机自启动的方式运行，启动脚本通过Systemctl服务配置的。

让我们想到查看文件最大open file限制，和数据库进程打开文件数。

```
[omm@node1 ~]$ ps -ef|grep mogdb
omm        1298      1  2 13:15 ?        00:03:52 /dbdata/app/mogdb/bin/mogdb -D /dbdata/data
[omm@node1 ~]$ lsof -p 1298 |wc -l
1038
[omm@node1 ~]$ ulimit -a
core file size          (blocks, -c) unlimited
data seg size           (kbytes, -d) unlimited
scheduling priority             (-e) 0
file size               (blocks, -f) unlimited
pending signals                 (-i) 62936
max locked memory       (kbytes, -l) 64
max memory size         (kbytes, -m) unlimited
open files                      (-n) 1000000
pipe size            (512 bytes, -p) 8
POSIX message queues     (bytes, -q) 819200
real-time priority              (-r) 0
stack size              (kbytes, -s) 8192
cpu time               (seconds, -t) unlimited
max user processes              (-u) unlimited
virtual memory          (kbytes, -v) unlimited
file locks                      (-x) unlimited
```

通过进程号查询得出，当前MogDB进程真实使用的大小为1038，ulimit -a中open files为1000000，其中肯定有问题，同时查看临时文件数和临时文件大小。

```
postgres=# select temp_files,temp_bytes/1024/1024/1024 from dbe_perf.stat_database;
 temp_files |  temp_bytes 
------------+--------------
          0 |            0
          0 |            0
      85195 | 120819658163
          0 |            0
(4 rows)
postgres=# show temp_file_limit;
 temp_file_limit 
-----------------
 -1
(1 row)
postgres=# show max_files_per_process;
 max_files_per_process 
-----------------------
 100000
(1 row)
检查/etc/security/limits.conf,参数均已设置正确。
```

这些均已排查，不存在问题，但更根据同样的MogHA自启脚本，发现设置有所不同。

```
[Unit]
Description=High Avilable service for MogDB or openGuass
After=network.target remote-fs.target nss-lookup.target

[Service]
Environment=GAUSSHOME=/dbdata/app/mogdb
Environment=PGDATA=/dbdata/data
Environment=LD_LIBRARY_PATH=/dbdata/app/mogdb/lib:/dbdata/app/tools/lib:
LimitAS=infinity
LimitRSS=infinity
LimitCORE=infinity
LimitNOFILE=1000000
LimitNPROC=65536
Type=simple
User=omm
WorkingDirectory=/dbdata/app/mogha
ExecStart=/dbdata/app/mogha/prod_venv/bin/supervisord -c /dbdata/app/mogha/supervisord.conf
KillSignal=SIGTERM
TimeoutStopSec=5
KillMode=process
PrivateTmp=false
[Install]
WantedBy=multi-user.target
```

自启脚本中添加了LimitNOFILE=1000000，同样的MogDB自启脚本却没设置，进而注意力转向查看进程limits数。

```
[omm@node1 ~]$ ps -ef|grep mogdb
omm        1298      1  2 13:15 ?        00:03:52 /dbdata/app/mogdb/bin/mogdb -D /dbdata/data
omm       11922  11786  0 15:39 pts/0    00:00:00 grep --color=auto mogdb
[omm@node1 ~]$ cat /proc/1298/limits 
Limit                     Soft Limit           Hard Limit           Units     
Max cpu time              unlimited            unlimited            seconds   
Max file size             unlimited            unlimited            bytes     
Max data size             unlimited            unlimited            bytes     
Max stack size            8388608              unlimited            bytes     
Max core file size        unlimited            unlimited            bytes     
Max resident set          unlimited            unlimited            bytes     
Max processes             62906                62906                processes 
Max open files            1024                 524288               files     
Max locked memory         65536                65536                bytes     
Max address space         unlimited            unlimited            bytes     
Max file locks            unlimited            unlimited            locks     
Max pending signals       62906                62906                signals   
Max msgqueue size         819200               819200               bytes     
Max nice priority         0                    0                    
Max realtime priority     0                    0                    
Max realtime timeout      unlimited            unlimited            us   
```

上述Max open files，Soft Limit为1024，Hard Limit为524288。打开文件数超过Hard Limit值就会影响数据库进程。

如果使用init脚本手动启动数据库，则数据库进程将继承修改后限制，但如果数据库是在boot时启动或由类似systemd的程序启动，则不会。对于有“/etc/default/service”文件的Debian系统，有“/etc/sysconfig/service”文件的RedHat系统。在运行守护程序之前，这些文件由init脚本获取。将ulimit-s unlimit或类似这样的内容添加到这些文件中。这些限制将应用于init脚本外壳，并将影响数据库进程。数据库恢复正常得手动重启。

```
gs_om -t restart 
```

获取MogDB进程，查询使用大小

```language
[omm@node1 ~]$ ps -ef|grep mogdb
omm        57142       1  5 14:06 pts/1    00:06:54 /dbdata/app/mogdb/bin/mogdb -D /dbdata/data
omm        66867   54676  0 16:21 pts/1    00:00:00 grep mogdb
[omm@node1 ~]$ cat /proc/57142/limits 
Limit                     Soft Limit           Hard Limit           Units     
Max cpu time              unlimited            unlimited            seconds   
Max file size             unlimited            unlimited            bytes     
Max data size             unlimited            unlimited            bytes     
Max stack size            8388608              unlimited            bytes     
Max core file size        unlimited            unlimited            bytes     
Max resident set          unlimited            unlimited            bytes     
Max processes             unlimited            unlimited            processes 
Max open files            1000000              1000000              files     
Max locked memory         65536                65536                bytes     
Max address space         unlimited            unlimited            bytes     
Max file locks            unlimited            unlimited            locks     
Max pending signals       62926                62926                signals   
Max msgqueue size         819200               819200               bytes     
Max nice priority         0                    0                    
Max realtime priority     0                    0                    
Max realtime timeout      unlimited            unlimited            us 
```

MogDB进程最大打开文件数1000000及正常。
