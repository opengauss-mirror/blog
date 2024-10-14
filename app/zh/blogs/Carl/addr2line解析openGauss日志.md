---
title: 'addr2line解析openGauss日志'
date: '2024-10-21'
category: 'blog'
tags: ['addr2line解析openGauss日志']
archives: '2024-10-21'
author: 'Carl'
summary: 'addr2line解析openGauss日志'
times: '9:30'
---

## addr2line解析openGauss日志

#  使用方法

我们经常可以在openGauss的日志中看到类似如下的错误：

```
2024-10-09 09:31:35.807 6705270c.6535 [unknown] 281439526236064 dn_6002 0 dn_6001_6002_6003 42809  0 [BACKEND] BACKTRACELOG:  tid[1289346]'s backtrace:
        /usr1/hmm/openGauss/cluster/gauss/app/bin/gaussdb(+0xd8e2e8) [0xaaad448de2e8]
        /usr1/hmm/openGauss/cluster/gauss/app/bin/gaussdb(_Z9errfinishiz+0x4a4) [0xaaad448d1214]
        /usr1/hmm/openGauss/cluster/gauss/app/bin/gaussdb(_Z17UpdateControlFilev+0x454) [0xaaad4526f174]
        /usr1/hmm/openGauss/cluster/gauss/app/bin/gaussdb(_Z16CreateCheckPointi+0x118c) [0xaaad4528df30]
        /usr1/hmm/openGauss/cluster/gauss/app/bin/gaussdb(_Z12ShutdownXLOGim+0x174) [0xaaad4528ef54]
        /usr1/hmm/openGauss/cluster/gauss/app/bin/gaussdb(_Z16CheckpointerMainv+0x7c0) [0xaaad44e2cff0]
        /usr1/hmm/openGauss/cluster/gauss/app/bin/gaussdb(_Z17GaussDbThreadMainIL15knl_thread_role38EEiP14knl_thread_arg+0x3ec) [0xaaad44e15aac]
        /usr1/hmm/openGauss/cluster/gauss/app/bin/gaussdb(+0x129e850) [0xaaad44dee850]
        /lib64/libpthread.so.0(+0x88cc) [0xfffe92e888cc]
        /lib64/libc.so.6(+0xd954c) [0xfffe92dc954c]
        Use addr2line to get pretty function name and line
```

首先我们利用c++filt解析函数的原始签名，包括函数名、参数类型和返回类型等信息。   
例如我们想分析下面这个函数：

```
[czk@openGauss135]$ echo "_Z17UpdateControlFilev+0x454" | c++filt
UpdateControlFile()+0x454 // 函数名+偏移量
```

再使用nm命令获取函数在可执行文件中的地址。
```
[czk@openGauss135]$ which gaussdb
/usr1/hmm/openGauss/cluster/gauss/app/bin/gaussdb
[czk@openGauss135]$ nm -C /usr1/hmm/openGauss/cluster/gauss/app/bin/gaussdb | grep UpdateControlFile
0000000001fffd5c T UpdateControlFile()
```

我们可以使用addr2line命令来解析出错的函数和行号。

```
[czk@openGauss135]$ addr2line -e /usr1/hmm/openGauss/cluster/gauss/app/bin/gaussdb 0x1fffd5c
/usr1/hmm/openGauss-server/src/gausskernel/storage/access/transam/xlog.cpp:6423
```

这将给出UpdateControlFile的起始行号，我们也可以通过日志里记录的函数偏移来计算具体的行号。

```
[czk@openGauss135]$ addr2line -e /usr1/hmm/openGauss/cluster/gauss/app/bin/gaussdb 0x20001b0  // 0x1fffd5c + 0x454
/usr1/hmm/openGauss-server/src/gausskernel/storage/access/transam/xlog.cpp:6458 (discriminator 5)
```
这样我们就可以轻松定位到出错的代码具体在哪了。


***作者：Carl***
