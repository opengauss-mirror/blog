+++

title = "什么是coredump" 

date = "2022-08-24" 

tags = ["什么是coredump"] 

archives = "2022-08" 

author = "张翠娉" 

summary = "什么是coredump"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "15:20"

+++

# 什么是coredump



## **介绍**

在Linux开发中，我们经常听到程序员说我的程序core掉了，通常出现这类的问题是低级bug中的内存访问越界、使用空指针、堆栈溢出等情况。使程序运行过程中异常退出或者终止，满足这些条件就会产生core的文件。

## 为什么会发生Coredump

Core是内存的意思，这个词源自很早以前制造内存的材料，一直延用到现在，当程序运行过程中检测到异常程序异常退出时, 系统把程序当前的内存状况存储在一个core文件中, 叫core dumped，也就**信息转储**，操作系统检测到当前进程异常时将通过信号的方式通知目标进程相应的错误信息，常见的信号有SIGSEGV,SIGBUS等，默认情况下进程接收到相应的信号都有相应的处理机制。

## coredump文件的存储位置

我们知道在Linux系统中，如果进程崩溃了，系统内核会捕获到进程崩溃信息，然后将进程的coredump 信息写入到文件中，这个文件名默认是core 。存储位置与对应的可执行程序在同一目录下，文件名是core，大家可以通过下面的命令看到core文件的存在位置：

```
cat  /proc/sys/kernel/core_pattern|/usr/libexec/abrt-hook-ccpp %s %c %p %u %g %t e %P %I %h 
```

Core_pattern的格式：

- ％p 转储过程的PID
- ％u （数字）转储进程的实际UID
- ％G （数字）转储过程的实际GID
- ％s 引起转储的信号数
- ％t 转储时间，表示为自1970年1月1日00:00:00 +0000（UTC）以来的秒数
- ％H 主机名（与uname（2）返回的节点名相同）
- ％e 可执行文件名（无路径前缀）
- ％E 可执行文件的路径名，用斜杠（’/’）替换为感叹号（’！’）。
- ％C 崩溃过程的核心文件大小软资源限制（自Linux 2.6.24开始）