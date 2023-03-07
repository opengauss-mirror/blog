+++

title = "循序渐进 MogDB：如何显示SQL执行时间？" 

date = "2023-03-07" 

tags = ["MogDB"] 

archives = "2023-03" 

author = "盖国强" 

summary = "循序渐进 MogDB：如何显示SQL执行时间？"

img = "/zh/post/gaiguoqiang/title/img29.png" 

times = "15:30"

+++

本文出处：[https://www.modb.pro/db/617639](https://www.modb.pro/db/617639)

在 云和恩墨 的 MogDB 数据库中，可以通过 timing on 设置开启 SQL 执行的时间回显，这和 Oracle 类似。

```
MogDB=>\timing on

Timing is on.
```

通过 timing off 关闭：

```
MogDB=>\timing off
Timing is off.
```

以下是一个测试：
通过 copy 加载1100万行记录，大约126秒：

```
MogDB=>copy temp (name,number,jguan,jhr,phone,tzz,cqxia,banj,dxx)
from '/home/omm/z.txt'
with (
FORMAT csv,
DELIMITER ',',
quote '"');
#####
COPY 11229468
Time: 126344.964 ms
```

测试数据表占用空间 2GB，大约 16MB每秒的加载速度：

```
MogDB=>select owner,segment_type,bytes/1024/1024 MB,blocks from dba_segments where segment_name='TEMP';
 owner | segment_type |      mb      | blocks 
-------+--------------+--------------+--------
 EYGLE | TABLE        | 1999.7421875 | 255967
(1 row)
```

测试环境是个人 MacBook 电脑上的 Docker 容器环境。
