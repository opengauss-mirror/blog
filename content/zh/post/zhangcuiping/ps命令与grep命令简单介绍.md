title = "ps命令与grep命令简单介绍" 

date = "2022-07-21" 

tags = ["ps命令与grep命令简单介绍"] 

archives = "2022-07" 

author = "张翠娉" 

summary = "ps命令与grep命令简单介绍"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "14:20"

+++

# ps命令与grep命令简单介绍

## **ps命令介绍**

ps命令用于显示进程信息。ps命令包含以下参数：

- -e : 显示所有进程 
- -f : 全格式 
- -h : 不显示标题 
- -l : 长格式 
- -w : 宽输出 
- a ：显示终端上的所有进程，包括其他用户的进程。 
- r ：只显示正在运行的进程。 
- u ：以用户为主的格式来显示程序状况。 
- x ：显示所有程序，不以终端机来区分。

**ps命令举例**

- ps -ef: 查询所有进程，以全格式显示。

```
[omm@hostname]$ ps -ef
UID          PID    PPID  C STIME TTY          TIME CMD
root           1       0  0 6月06 ?       00:00:40 /usr/lib/systemd/systemd --switched-root --system
root           2       0  0 6月06 ?       00:00:00 [kthreadd]
root           3       2  0 6月06 ?       00:00:00 [rcu_gp]
root           4       2  0 6月06 ?       00:00:00 [rcu_par_gp]
root           6       2  0 6月06 ?       00:00:00 [kworker/0:0H-kblockd]
root           7       2  0 6月06 ?       00:00:00 [kworker/u32:0-netns]
root           9       2  0 6月06 ?       00:00:00 [mm_percpu_wq]
```

- ps -eh：查询所有进程，不显示标题

```
[omm@hostname]$ ps -eh
 442551 pts/1    S+     0:00 -bash SHELL=/bin/bash PATH=/usr/local/bin:/usr/bin HOME=/home/omm USER=o
 443703 pts/0    S      0:00 -bash SHELL=/bin/bash PATH=/usr/local/bin:/usr/bin HOME=/home/omm USER=o
 446659 pts/0    R+     0:00 ps -eh SHELL=/bin/bash HISTCONTROL=ignoredups HISTSIZE=1000 HOSTNAME=mog
```

- ps -l：长格式显示进程

```
[omm@hostname]$ ps -l
F S   UID     PID    PPID  C PRI  NI ADDR SZ WCHAN  TTY          TIME CMD
4 S  2010  443703  443702  0  80   0 -  3518 do_wai pts/0    00:00:00 bash
0 R  2010  446686  443703  0  80   0 -  3414 -      pts/0    00:00:00 ps
```

## grep命令介绍

很多时候，我们并不需要列出文件的全部内容，而是从文件中找到包含指定信息的那些行，要实现这个目的，可以使用 grep 命令。grep命令是一个强大的文本搜索工具，它能使用正则表达式搜索文本，并把匹配的行打印出来。正则表达式是描述一组字符串的一个模式，正则表达式可以是一些纯文本文字，也可以是用来产生模式的一些特殊字符。为了进一步定义一个搜索模式，grep 命令支持如下表所示的这几种正则表达式的元字符（也就是通配符）。

| 通配符 | 功能                                    |
| ------ | --------------------------------------- |
| c*     | 将匹配 0 个或多个字符 c（c 为任一字符） |
| .      | 将匹配任何一个字符，且只能是一个字符    |
| [xyz]  | 匹配方括号中的任意一个字符              |
| [^xyz] | 匹配除方括号中字符外的所有字符          |
| ^a     | 匹配以a开头的行                         |
| $a     | 匹配以a结尾的行                         |

grep命令的基本格式如下：

```
[root@localhost ~]# grep [选项] 模式 文件名
```

这里的模式，要么是字符串，要么是正则表达式，而此命令常用的选项以及各自的含义如下表所示：

| 选项 | 含义                                                         |
| ---- | ------------------------------------------------------------ |
| -c   | 仅列出文件中包含模式的行数                                   |
| -i   | 忽略模式中的字母大小写                                       |
| -l   | 列出带有匹配行的文件名，**不列出具体的匹配行**               |
| -n   | 列出所有的匹配行，并显示行号                                 |
| -v   | 列出没有匹配模式的行，可以使用该选项，来排除关键字           |
| -w   | 把表达式当做一个完整的单字符来搜寻，忽略那些部分匹配的行(匹配整词) |
| -r   | 递归搜索                                                     |

**注意**: 果是搜索多个文件，grep 命令的搜索结果会显示文件名+匹配模式的行。

**grep命令举例**

- 搜索postgresql.conf文件，搜索其中包含’5432’的数据行，执行命令如下

```
[omm@hostname]$ grep 5432 postgresql.conf
#port = 5432                            # (change requires restart)
[omm@mogdb-kernel-0002 single_node]$
```

- 搜索postgresql.conf文件，搜索包含port的数据行数。

```
[omm@hostname]$ grep -c port postgresql.conf
20
[omm@mogdb-kernel-0002 single_node]$ 
```

- 搜索postgresql.conf文件，搜索包含port的数据行，并显示行号。

```
[omm@hostname]$ grep -n port postgresql.conf
73:#port = 5432                         # (change requires restart)
91:#ssl_renegotiation_limit = 0         # amount of data between renegotiations, no longer supported
204:                                    # supported by the operating system:
268:                                            # The heartbeat thread will not start if not set localheartbeatport and remoteheartbeatport.
269:                                            # e.g. 'localhost=10.145.130.2 localport=12211 localheartbeatport=12214 remotehost=10.145.130.3 remoteport=12212 remoteheartbeatport=12215, localhost=10.145.133.2 localport=12213 remotehost=10.145.133.3 remoteport=12214'
272:                                            # e.g. 'localhost=10.145.130.2 localport=12311 localheartbeatport=12214 remotehost=10.145.130.4 remoteport=12312 remoteheartbeatport=12215, localhost=10.145.133.2 localport=12313 remotehost=10.145.133.4 remoteport=12314'
[omm@hostname]$
```

## ps命令和grep命令同时使用举例

命令格式如下：

```
command 1 | command 2
```

| 是管道命令。管道命令的作用是将command 1执行的结果，交给command 2处理。例如，执行以下命令，查询名称为nginx的进程。

```
[omm@hostname /]$ ps -ef | grep nginx
omm       448182  443703  0 11:48 pts/0    00:00:00 grep nginx
[omm@mogdb-kernel-0002 /]$
```

