---
title: 'openGauss3.1.0 版本的gs_stack功能解密'

date: '2022-11-07'
category: 'blog'
tags: ['gs_stack']

archives: '2022-11'

author: '王天庆'

summary: 'gs_stack'

times: '12:30'
---

# openGauss3.1.0 版本的 gs_stack 功能解密

不管是测试还是研发，工作中总有遇到各种各样的问题。比如，你有没有遇到过在数据库中执行某个 SQL，却一直不返回结果，这时候的你是不是非常想看一下代码执行到了哪个函数？或者是数据库不响应连接，需要查看数据库当前线程的执行情况呢？

在实际生产中，获取生产系统进程堆栈比较麻烦，需要在服务端后台执行 gstack 命令。本期主要介绍内置 gs_stack 工具，可以通过函数调用的方式输出指定线程的堆栈，用于解决现网环境缺少 gs_stack 工具，无法获取调用栈的问题。

# 内置 gs_stack 工具介绍

​ 在 openGauss 的很多客户场景中，gdb、gstack 等工具都是无法使用的，当系统出现 hang、慢等问题时，无法通过调用栈进行进一步的定位。还有一种情况就是登录客户数据库的流程非常繁杂，需要经过层层审批，这时通过 gsql 等工具连接数据库就相对容易一些。针对以上痛点，通过复用 openGauss 未使用操作系统信号，并在信号处理函数中获取调用栈的方式开发了调用栈工具，以获得服务端 openGauss 的调用栈。

获取调用栈主要包含两种方式，一种是通过执行 SQL 语句获取，另一种是通过 gs_ctl 工具执行命令获取~

## 1、在客户端工具执行 gs_stack([tid])函数

使用具有**monadmin**或者**sysadmin**用户权限的用户，通过 gsql 或者其他工具连接数据库；

执行命令：

```
openGuass=# select * from gs_stack();
```

返回当前 openGauss 所有线程的调用栈：

```
        tid      | lwtid |  stack
  ---------------+------ +------------------------------------------------------------------
  14026731434848 | 2626  | _poll + 0x2d                                                    +
                 |       | WaitLatch0rSocket(Latch volatile*,int,int,long) + 0x29f         +
                 |       | WaitLatch(Latch voatile*,int,long) + 0x2e                       +
                 |       | start_thread +oxc5                                              +
                 |       | clone + OXC5                                                    +
  140116075071232| 23864 |__poll + 0x2d                                                    +                  |       | poll + 0x81                                                     +
                 |       | WaitLatchOrSocket(Latch volatile*, int, int, long) + 0x6af      +
                 |       | WaitLatch(Latch volatile*, int, long) + 0x2e                    +
                 |       | ckpt_pagewriter_sub_thread_loop() + 0x284                       +
                 |       | ckpt_pagewriter_main() + 0x92e                                  +
                 |       | int GaussDbAuxiliaryThreadMain<(knl_thread_role)46>(knl_thread_arg*) + 0x482                                                                  +
                 |       | int GaussDbThreadMain<(knl_thread_role)46>(knl_thread_arg*)     + 0x854                                                                                      +
                 |       | InternalThreadFunc(void*) + 0x5c                                +
                 |       | ThreadStarterFunc(void*) + 0xa4                                 +
                 |       | start_thread + 0xc5                                             +
                 |       | clone + 0x6d                                                    +

```

只需要查看某一个线程的调用栈时，执行命令：

```
openGuass=# select gs_stack(xxx);
```

xxx 为为某个线程的 thread_id，能够返回 thread_id 为 xxx 的线程的调用栈：

```
                                          gs_stack
  ------------------------------------------------------------------------------------------
 pthread_sigmask + 0x2a                                                                    +
 gs_signal_recover_mask(__sigset_t) + 0x17                                                 +
 gs_signal_send(unsigned long, int, int) + 0x2f9                                           +
 signal_child(unsigned long, int, int) + 0x36                                              +
 get_stack_according_to_tid(unsigned long, StringInfoData*) + 0x191                        +
 gs_stack(FunctionCallInfoData*) + 0xcb                                                    +
 unsigned long ExecMakeFunctionResult<false, false, true>(FuncExprState*, ExprContext*, bool*, ExprDoneCond*) + 0x554                                                              +
 ExecEvalFunc(FuncExprState*, ExprContext*, bool*, ExprDoneCond*) + 0x147                  +
 ExecTargetList(List*, ExprContext*, unsigned long*, bool*, ExprDoneCond*, ExprDoneCond*)  + 0x15d                                                                                      +
 ExecProject(ProjectionInfo*, ExprDoneCond*) + 0x40f                                       +
 ExecResult(ResultState*) + 0x1da                                                          +
 ExecResultWrap(PlanState*) + 0x18                                                         +
 ExecProcNode(PlanState*) + 0xde                                                           +
 ExecutePlan(EState*, PlanState*, CmdType, bool, long, ScanDirection, _DestReceiver*)      + 0x1a6                                                                                      +
 standard_ExecutorRun(QueryDesc*, ScanDirection, long) + 0x3d9                             +
 explain_ExecutorRun(QueryDesc*, ScanDirection, long) + 0x109                              +
 ExecutorRun(QueryDesc*, ScanDirection, long) + 0x1ad                                      +
 PortalRunSelect(PortalData*, bool, long, _DestReceiver*) + 0x294                          +
 PortalRun(PortalData*, long, bool, _DestReceiver*, _DestReceiver*, char*) + 0x62e         +
 exec_simple_query(char const*, MessageType, StringInfoData*) + 0x12b0                     +
 PostgresMain(int, char**, char const*, char const*) + 0x2e10                              +
 BackendRun(Port*) + 0x327                                                                 +
 int GaussDbThreadMain<(knl_thread_role)1>(knl_thread_arg*) + 0x5a8                        +
 InternalThreadFunc(void*) + 0x2d                                                          +
 ThreadStarterFunc(void*) + 0xa4                                                           +
 start_thread + 0xc5                                                                       +
 clone + 0x6d                                                                              +

```

```
openGauss=# select gs_stack(140115727259392);
                                          gs_stack
--------------------------------------------------------------------------------------------
 __select + 0x33                                                                           +
 pg_usleep(long) + 0xa1                                                                    +
 pg_sleep(FunctionCallInfoData*) + 0xeb                                                    +
 unsigned long ExecMakeFunctionResultNoSets<false, false>(FuncExprState*, ExprContext*, bool*, ExprDoneCond*) + 0x206f                                                             +
 ExecEvalFunc(FuncExprState*, ExprContext*, bool*, ExprDoneCond*) + 0x622                  +
 ExecTargetList(List*, ExprContext*, unsigned long*, bool*, ExprDoneCond*, ExprDoneCond*) + 0x45d                                                                                      +
 ExecProject(ProjectionInfo*, ExprDoneCond*) + 0xc2d                                       +
 ExecResult(ResultState*) + 0x79b                                                          +
 ExecResultWrap(PlanState*) + 0x18                                                         +
 ExecProcNode(PlanState*) + 0x2db                                                          +
 ExecutePlan(EState*, PlanState*, CmdType, bool, long, ScanDirection, _DestReceiver*) + 0x765                                                                                      +
 standard_ExecutorRun(QueryDesc*, ScanDirection, long) + 0xbb5                             +
 explain_ExecutorRun(QueryDesc*, ScanDirection, long) + 0x1f7                              +
 ExecutorRun(QueryDesc*, ScanDirection, long) + 0x947                                      +
 PortalRunSelect(PortalData*, bool, long, _DestReceiver*) + 0x7d2                          +
 PortalRun(PortalData*, long, bool, _DestReceiver*, _DestReceiver*, char*) + 0xe11         +
 exec_simple_query(char const*, MessageType, StringInfoData*) + 0x3929                     +
 PostgresMain(int, char**, char const*, char const*) + 0x61f8                              +
 BackendRun(Port*) + 0x64d                                                                 +
 int GaussDbThreadMain<(knl_thread_role)1>(knl_thread_arg*) + 0x9c7                        +
 InternalThreadFunc(void*) + 0x5c                                                          +
 ThreadStarterFunc(void*) + 0xa4                                                           +
 start_thread + 0xc5                                                                       +
 clone + 0x6d                                                                              +

```

## 2、在服务器端使用 gs_ctl stack –D data_dir 命令

当线程池满，无法通过 gsql 连接数据库的时候，可以使用 gs_ctl 工具执行命令获取线程调用栈：

使用集群用户登录服务器，执行命令 gs_ctl stack –D data_dir，data_dir 是指定 gaussdb 的数据目录的绝对路径:

```
gs_ctl stack –D /path/to/install/data/
```

可以取 gaussdb 所有线程的调用栈。

```
[user@euler omm]$ gs_ctl stack -D /path/to/install/data/opengauss
[2022-11-03 20:17:59.288][19256][][gs_ctl]: gs_stack start:
Thread 0 tid<140120252633600> lwtid<23675>
__poll + 0x2d
poll + 0x81
CommWaitPollParam::caller(int (*)(pollfd*, unsigned long, int), unsigned long) + 0xb1
int comm_socket_call<CommWaitPollParam, int (*)(pollfd*, unsigned long, int)>(CommWaitPollParam*, int (*)(pollfd*, unsigned long, int)) + 0x28
comm_poll(pollfd*, unsigned long, int) + 0x388
ServerLoop() + 0xb77
PostmasterMain(int, char**) + 0x612e
main + 0xaeb
__libc_start_main + 0xf5
0x55feac9a9907

Thread 1 tid<140116236076800> lwtid<23848>
__poll + 0x2d
poll + 0x81
WaitLatchOrSocket(Latch volatile*, int, int, long) + 0x6af
SysLoggerMain(int) + 0x17c9
int GaussDbThreadMain<(knl_thread_role)17>(knl_thread_arg*) + 0x860
InternalThreadFunc(void*) + 0x5c
ThreadStarterFunc(void*) + 0xa4
start_thread + 0xc5
clone + 0x6d
```

只需要查看某一个线程的调用栈时，执行命令：

```
gs_ctl stack –D data_dir –I xx
```

data_dir 是指定 gaussdb 的数据目录的绝对路径，xxx 指的是线程的 lwpid(taskid)，可以通过 top –Hp 的方式获取线程的 lwpid, 也可以通过 cat /proc/yyyy/task 获取线程的 lwpid 。yyyy 指的是进程 id，可以通过 ps –ux | grep gaussdb 获取。

```
[uesr@euler omm]$ gs_ctl stack -D /path/to/install/data -I 23860
[2022-11-03 20:22:01.327][40608][][gs_ctl]: gs_stack start:
tid<140116142843648> lwtid<23860>
__poll + 0x2d
poll + 0x81
WaitLatchOrSocket(Latch volatile*, int, int, long) + 0x6af
WaitLatch(Latch volatile*, int, long) + 0x2e
ckpt_pagewriter_sub_thread_loop() + 0x284
ckpt_pagewriter_main() + 0x92e
int GaussDbAuxiliaryThreadMain<(knl_thread_role)46>(knl_thread_arg*) + 0x482
int GaussDbThreadMain<(knl_thread_role)46>(knl_thread_arg*) + 0x854
InternalThreadFunc(void*) + 0x5c
ThreadStarterFunc(void*) + 0xa4
start_thread + 0xc5
clone + 0x6d
```

# 总结

通过以上我们介绍的 openGauss 的 gs_stack 功能，我们可以很方便地定位某个 openGauss 线程正在做的事情，并可以根据这些函数调用情况判断当前 openGauss 任务是否出现了问题，以及发现性能瓶颈。后续，我们将会进一步在这个功能上进行演进，不断增强 openGauss 的核心竞争力。
