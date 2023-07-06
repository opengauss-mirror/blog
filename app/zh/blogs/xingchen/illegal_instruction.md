---
title: '安装时报指令错误的处理'
date: '2023-06-17'
category: 'blog'
tags: ['安装时报指令错误的处理']
archives: '2023-06-17'
author: 'zhang_xubo'
summary: '安装时报指令错误的处理'
img: '/zh/post/xingchen/title/img1.png'
times: '10:30'
---

### 概述

在使用官网提供的镜像安装数据库，有时会遇到一些 `"非法指令" "illegal instruction"` 的问题，或者在一些本地搭建的虚拟机上，数据库启动失败，但是没有很明确的错误信息的问题。 这些往往是由于 CPU 指令集不兼容导致的。

常见的有 3 种：

1. arm CPU 下的 lse 指令
2. x86_64 CPU 下的 rdtscp 指令
3. x86_64 CPU 下的 avx 指令

### 1. arm 服务器下 LSE 指令

官网发布的 `openEuler_arm` 包，在编译的时候，打开了`ARM_LSE`指令集做了编译的优化。但是对于一些其他 arm 服务器，不一定支持。

构建脚本：

```
build\script\utils\make_compile.sh

# it may be risk to enable 'ARM_LSE' for all ARM CPU, but we bid our CPUs are not elder than ARMv8.1
```

实测在 **_鲲鹏 920_** 和 **_麒麟 990_** 的 cpu 芯片下是支持安装的。
cpu 可以通过 `lscpu` 名称查看。

对于其他不自持该指令的系统，需要去掉 `-D__ARM_LSE` 指令重新编译即可。

在编译脚本中 `build\script\utils\make_compile.sh`，删除掉所有的 `-D__ARM_LSE` ， 重新打包数据库。

```
sh build.sh -m release -3rd /sdb/binarylibs -pkg

# -3rd 是对应三方库二进制的目录
```

patch 如下图：

![](../images/compile/withoutlse.png)

### 2. x86 服务器下 rdtscp 指令

rdtscp 指令集用来检索 CPU 周期计数器,MOT 特性有用到

在 server 中位置如下：
`src\gausskernel\storage\mot\core\infra\synchronization\cycles.h`

```
/**
     * @brief Retrieve the CPU cycle counter using rdtscp instruction
     * @detail Force processor barrier and memory barrier
     * @return The CPU cycle counter value.
     */
    static __inline __attribute__((always_inline)) uint64_t Rdtscp()
    {
#if defined(__GNUC__) && (defined(__x86_64__) || defined(__i386__))
        uint32_t low, high;
        __asm__ __volatile__("rdtscp" : "=a"(low), "=d"(high) : : "%rcx");
        return (((uint64_t)high << 32) | low);
#elif defined(__aarch64__)
        unsigned long cval = 0;
        asm volatile("isb; mrs %0, cntvct_el0" : "=r"(cval) : : "memory");
        return cval;
#else
#error "Unsupported CPU architecture or compiler."
#endif
    }
```

有些自己搭建的虚拟机可能没有这个指令集，导致数据库无法启动。

**检测方式**

使用 lscpu 命令进行检测是否具有该指令集：
`lscpu | grep rdtscp`

**解决方法**
如果没有该指令集，需要开启 CPU 直通模式 (host-passthrough)

### x86 服务器下 avx 指令

avx 指令集用来进行加速计算，主要是 db4ai 在使用。该指令集从 **2.1.0** 版本开始引入，如果存在 2.1.0 之前版本可以运行数据库而 2.1.0 之后数据库启动失败，也有可能是没有该指令导致。

**检测方式**

使用 lscpu 命令进行检测是否具有该指令集：
`lscpu | grep avx`

**解决方法**
如果没有该指令集，从代码中删掉该指令集的引用，重新打包数据库。

该指令集的引用在 Makefile 里面，可以全局搜索 `-mavx` , 删掉如下编译选项里面加载-mavx 指令，然后重新打包构建即可。

```
ifeq ($(PLATFORM_ARCH),x86_64)
        override CPPFLAGS += -mavx
endif
```
