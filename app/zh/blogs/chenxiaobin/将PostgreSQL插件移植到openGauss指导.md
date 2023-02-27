---
title: '将PostgreSQL插件移植到openGauss指导'
date: '2021-08-10'
category: 'blog'
tags: ['openGauss插件化架构']
archives: '2021-08'
author: 'chenxiaobin'
summary: '将PostgreSQL插件移植到openGauss指导'
img: '/zh/blogs/chenxiaobin/title/img.png'
times: '16:30'
---

## 1 概述

PostgreSQL 社区提供了丰富的插件，但由于 openGauss 和 PostgreSQL 存在一定的差异，如线程/进程模型、系统表和视图等，无法直接为 openGauss 所用，不可避免的需要在插件上做整改。

本文档主要对 Postgresql 插件移植到 openGauss 的过程提供指导说明，旨在让开发人员对 PG 插件所需要的修改有一个具体的了解，基于该文档，可基本实现 PG 插件移植到 openGauss。

## 2 约束

由于 openGauss 与 PostgreSQL 在内核上存在不少差异，这篇文档未能覆盖所有这些差异，因此仅依赖该文档有可能无法实现 PG 插件的完全迁移，部分差异需要开发者深入内核源码识别，然后可将识别出来的差异补充到该博客的第 9 章对应小节的表格中（博客对应的 gitee 地址：[将 PostgreSQL 插件移植到 openGauss 指导](https://gitee.com/opengauss/blog/blob/master/content/zh/post/chenxiaobin/%E5%B0%86PostgreSQL%E6%8F%92%E4%BB%B6%E7%A7%BB%E6%A4%8D%E5%88%B0openGauss%E6%8C%87%E5%AF%BC.md)，具体操作可见 blog 仓库的`README.md`），有任何问题可在博客下方留言讨论。

## 3 移植步骤

1. 将 PG 插件的代码拷贝到 openGauss 源码的 contrib 目录下

2. 配置环境变量，需要将数据库的 bin 和 lib 加在操作系统的环境变量 PATH 和 LD_LIBRARY_PATH 中

3. 到插件目录下，执行`make && make install`，编译安装插件。

4. 编译成功后，到数据库中执行`create extension extension_name`即可使用。

通常步骤 3 和 4 不会直接成功，需要一些必须的修改。下面分类别说明移植 PG 插件所需要做的修改。

## 4 Makefile 文件

1. 当前有两种方式支持插件编译，一种是依赖源码编译，一种是用 pgxs 的方式编译，支持插件在一个已经安装的数据库服务上进行编译。建议选择前者的方式，如果采用后者，需要定义 USE_PGXS，但是可能出现部分头文件找不到的问题，这时候需要到源码拷贝头文件到目标目录。

```makefile
ifdef USE_PGXS
PG_CONFIG = pg_config
PGXS := $(shell $(PG_CONFIG) --pgxs)
include $(PGXS)
else
subdir = contrib/pg_freespacemap
top_builddir = ../..
include  $(top_builddir)/src/Makefile.global
include  $(top_srcdir)/contrib/contrib-global.mk
endif
```

2. -fPIC 作用于编译阶段，告诉编译器产生与位置无关代码(Position-Independent Code)。使用-fPIC，可以使得动态库可以被多个程序共享。不加 fPIC 加载的 so，要在加载时根据加载到的位置再次重定位。

```makefile
override CPPFLAGS :=$(filter-out -fPIE,  $(CPPFLAGS)) -fPIC
```

## 5 类型转换

1. ANSI C 规定，void 指针可以复制给其他任意类型的指针，其他任意类型的指针也可以复制给 void 指针，他们之间复制不需要强制类型转换。但是 c++不支持，需要做强制类型转换。

```
buffer = palloc(MAX_LINESIZE);  ->  buffer = (char*)palloc(MAX_LINESIZE);
```

2.  部分 c++编译器不支持 const char\*到 char\*的隐式转换，需要做强制类型转换。

## 6 函数声明

1. C 语言中并没有重载和类这些特性，编译出的符号与 C++不同，例如 print(int i)，不会被编译为\_print_int，而是直接编译为\_print 等。因此如果直接在 C++中调用 C 的函数会失败，例如调用 print(3)，c++中实际上会去找\_print_int(3)，这样就会找不到。加上 extern “C”，指示编译器这部分代码按 C 语言来进行编译，而不是 C++。

```
extern PGDLLEXPORT Datum  orafce_to_char_timestamp(PG_FUNCTION_ARGS);  ->
extern  "C" PGDLLEXPORT Datum  orafce_to_char_timestamp(PG_FUNCTION_ARGS);
```

可以通过 nm -D so 文件查看生成的符号。

## 7 安全函数整改

1. 推荐使用安全函数（可见 securec.h），并对安全函数的返回值作检查，openGauss 定义了几个常用的检查宏，如下。

```
#define check_memcpy_s(r)  securec_check_c((r), "", "")
#define check_memmove_s(r)  securec_check_c((r), "", "")
#define check_memset_s(r)  securec_check_c((r), "", "")
#define check_strcpy_s(r)  securec_check_c((r), "", "")
#define check_strncpy_s(r)  securec_check_c((r), "", "")
#define check_strcat_s(r)  securec_check_c((r), "", "")
#define check_strncat_s(r)  securec_check_c((r), "", "")
#define check_gets_s(r)  securec_check_ss_c((r), "", "")
#define check_sprintf_s(r)  securec_check_ss_c((r), "", "")
#define check_snprintf_s(r)  securec_check_ss_c((r), "", "")
#define check_scanf_s(r)  securec_check_ss_c((r), "", "")
```

下面是安全函数整改的示例。

```
memcpy(d, u, clen);  ->  check_memcpy_s(memcpy_s(d, strlen(d), u, clen));
```

为了方便和完全地作安全函数整改，这里提供一个查找危险函数的正则表达式。

```
(wmemcpy\()|(wmemove\()|(memmove\()|(wcscpy\()|(wcsncpy\()|(strcat\()|(wcscat\()|(strncat\()|(wcsncat\()|(strtok\()|(wcstok\()|(sprintf\()|(swprintf\()|(vsprintf\()|(vswprintf\()|(snprintf\()|(vsnprintf\()|(vsnprintf_truncated\()|(snprintf_truncated\()|(scanf\()|(wscanf\()|(vscanf\()|(vwscanf\()|(fscanf\()|(fwscanf\()|(vfscanf\()|(vfwscanf\()|(sscanf\()|(swscanf\()|(vsscanf\()|(vswscanf\()|(gets\()|(strcpy\()|(strcpy\()|(strncpy\()|(strncpy\()|(strcat\()|(strncat\()|(memcpy\()|(memcpy\()|(memset\()|(memset\()
```

## 8 变量转换

1. 对比 PostgreSQL，openGauss 收集了原有的全局变量，将其收集在了 g_instance、t_thrd、u_sess（分别是全局变量、线程变量和会话变量）等结构体内，因此需要作相应替换（通过编译报错体现，需要到内核代码层面查看变量具体存放位置）。插件的全局变量可通过 nm -D so | grep ‘B’排查。（具体见 7.7）

```
econtext = error_context_stack;  ->  econtext = t_thrd.log_cxt.error_context_stack;
```

2.  PG 采用进程模型，用户会话进来时会创建一个独立的进程去处理，此时插件定义的全局变量在该进程内就是唯一的会话变量。而 openGauss 采用线程模型，所有会话共享同一份全局变量，因此需要将全局变量修改为会话变量。对于只读的全局变量，保持原样即可，而对于多次修改的变量，需要作如下修改。

a. 如果不考虑在线程池模式下使用插件，将全局变量修改为 THR_LOCAL 变量，即线程变量，因为用户会话进来会创建一个独立的线程。

b. 如果需要线程池，就需要作额外的修改。线程池模式下，一个用户会话可能会切换多个线程，单纯的将全局变量改为线程变量，在切换线程时会丢失对该变量的修改。openGauss 提供了插件自定义会话变量的方式，具体实现如下。（以 dblink 为例）

1. 内核侧在 u_sess 中定义一个指针数组`extension_session_vars_array`，和标识数组大小的变量`extension_session_vars_array_size`，数组用于存放插件会话变量的结构体。

```
typedef struct knl_session_attr_common {
    …
    uint32 extension_session_vars_array_size;
    void** extension_session_vars_array;
} knl_session_attr_common;
```

2. 插件侧需定义一个全局的下标变量，用于获取数组元素，并且提供`set_extension_index`函数，内核侧会调用该函数来设置下标。示例如下。

```
static uint32 dblink_index;
void set_extension_index(uint32 index) {
    dblink_index = index;
}
```

3. 此外，插件侧还需要定义步骤 1 提到的会话变量结构体，存放该插件自身所有的会话变量，以及提供函数 init_session_vars，主要是初始化该结构体，并把指针存放在数组的对应下标位置。示例如下。

```
#include "commands/extension.h"
typedef struct dblink_session_context {
    remoteConn* pconn;
    HTAB* remoteConnHash;
} dblink_session_context;

void init_session_vars(void)
{
    RepallocSessionVarsArrayIfNecessary();
    dblink_session_context* psc = (dblink_session_context*)MemoryContextAllocZero(u_sess->self_mem_cxt, sizeof(dblink_session_context));
    u_sess->attr.attr_common.extension_session_vars_array[dblink_index] = psc;
    psc->pconn = NULL;
    psc->remoteConnHash = NULL;
}
```

4. 最终，在插件使用会话变量时，根据下标到数组中获取对应的结构体指针即可。

```
dblink_session_context* get_session_context()
{
    if (u_sess->attr.attr_common.extension_session_vars_array[dblink_index] == NULL) {
        init_session_vars();
    }
    return  (dblink_session_context*)u_sess->attr.attr_common.extension_session_vars_array[dblink_index];
}
void example()
{
    remoteConn* pconn = get_session_context()->pconn;
}
```

具体方案实现可见社区 PR（https://gitee.com/opengauss/openGauss-server/pulls/1101），插件整改可参考其中对dblink的整改。

## 9 其他

除了上述修改点，还存在很多一些较为细节的地方，其中包括有 C 和 C++的差异，例如在 C++中 new 关键字不能作标识符等；大多数还是 openGauss 和 PostgreSQL 内核上的差异，下文会对这些差异作详细说明。此外，有些插件可能是基于 PG 内核新特性开发的，openGauss 并不支持，可以考虑将特性整合到插件，必要时修改内核。

下面列举 openGauss 和 PostgreSQL（REL_13_STABLE）内核上的差异，第 2 章中提到该部分需要不断更新完善，目前仅列出极少部分。

### 9.1 API

| 序号           | API_01                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| **PostgreSQL** | void table_close(Relation relation, LOCKMODE lockmode);                                                |
| **openGauss**  | #define heap_close(r,l) relation_close(r,l) void relation_close(Relation relation, LOCKMODE lockmode); |
| **作用**       | close any relation                                                                                     |
| **差异**       | 名称不同                                                                                               |

| **序号**       | API_02                                                                   |
| -------------- | ------------------------------------------------------------------------ |
| **PostgreSQL** | Relation table_open(Oid relationId, LOCKMODE lockmode)                   |
| **openGauss**  | Relation heap_open(Oid relationId, LOCKMODE lockmode, int2 bucketid=-1); |
| **作用**       | open a heap relation by relation OID                                     |
| **差异**       | 名称不同；openGauss 的 heap_open 增加了一个可选参数 bucketid             |

### 9.2 系统表

| <div style="width: 150pt">**序号**</div> | SYSTAB_01                                                                                                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **系统表**                               | pg_class                                                                                                                                                                                                           |
| **差异**                                 | openGauss 新增字段：reltoastidxid, reldeltarelid, reldeltaidx, relcudescrelid, relcudescidx, relhasoids, relhaspkey, relcmprs, relhasclusterkey, relrowmovement, parttype, relfrozenxid64, relbucket, relbucketkey |

PostgreSQL 新增字段：relrowsecurity, relforcerowsecurity, relispopulated, relispartition, relrewrite , relminmxid , relpartbound relkind
字段可选值差异：PostgreSQL 中用 p 和 I 表示分区表和分区索引，openGauss 用字段 parttype 表示。 |
| **备注** | 具体描述可见《开发者指南》-系统表和系统视图-系统表-PG_CLASS |

### 9.3 系统视图

| **序号**   | SYSVIEW_01                                                                                |
| ---------- | ----------------------------------------------------------------------------------------- |
| **系统表** | pg_tables                                                                                 |
| **差异**   | openGauss 新增字段：tablecreator, created, last_ddl_time PostgreSQL 新增字段：rowsecurity |
| **备注**   | 具体描述可见《开发者指南》-系统表和系统视图-系统视图-PG_TABLES                            |

### 9.4 系统函数

### 9.5 LOCK

### 9.6 Memory Context

### 9.7 全局变量

| **PostgreSQL**      | **openGauss**                        | **作用域**     |
| ------------------- | ------------------------------------ | -------------- |
| error_context_stack | t_thrd.log_cxt.error_context_stack   | Thread         |
| WalSndCaughtUp      | t_thrd.walsender_cxt.walSndCaughtUp  | Thread         |
| disable_cost        | g_instance.cost_cxt.disable_cost     | Instance       |
| cpu_tuple_cost      | u_sess->attr.attr_sql.cpu_tuple_cost | cpu_tuple_cost |

## 10 常见错误信息

1. 编译安装时报错：dangerous relocation: unsupported relocation

解决方法：参考 4.2，在 Makefile 中添加下面一句。

override CPPFLAGS :=$(filter-out -fPIE, $(CPPFLAGS)) -fPIC

2. 编译安装时报错：error: invalid conversion from ‘void’ to ‘char’ [-fpermissive]

解决方法：参考 5 类型转换

3. create extension 时报错：could not find function "xxx" in file "xxx.so"

解决方法：参考 6 函数声明。
