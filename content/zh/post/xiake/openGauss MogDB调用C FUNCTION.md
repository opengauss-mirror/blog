+++

title = "openGauss/MogDB调用C FUNCTION" 

date = "2022-04-08" 

tags = ["openGauss/MogDB调用C FUNCTION"] 

archives = "2022-04" 

author = "夏克" 

summary = "openGauss/MogDB调用C FUNCTION"

img = "/zh/post/xiake/title/img6.png" 

times = "10:20"

+++

# openGauss/MogDB调用C FUNCTION

## 环境准备

- 安装openGauss/MogDB
  可参考官方文档
- 服务器环境
  本地虚拟机 centos 7.9

**注意：尽量进入omm用户下进行编译，可以避免一些不必要的环境问题**

## 代码

- C代码
  基本与postgres插件开发一样，关键是4,5,6三行。

```
#include "postgres.h"
#include "fmgr.h"

PG_MODULE_MAGIC;
extern "C" Datum add_ab(PG_FUNCTION_ARGS);
PG_FUNCTION_INFO_V1(add_ab);

Datum
add_ab(PG_FUNCTION_ARGS)
{
          int32 arg_a = PG_GETARG_INT32(0);
          int32 arg_b = PG_GETARG_INT32(1);

          PG_RETURN_INT32(arg_a + arg_b);
}
```

- CMakeLists.txt

```sql
cmake_minimum_required (VERSION 2.8)

project (gs_plug)
set(CMAKE_CXX_FLAGS "-Wall -std=c++11 -Wall")
set(CMAKE_CXX_FLAGS_DEBUG "-g3")
set(CMAKE_CXX_FLAGS_RELEASE "-O2")
set(CMAKE_BUILD_TYPE Debug)

set(MOG_INCLUDE /opt/mogdb/app/include/postgresql/server)
set(MOG_LIBPATH /opt/mogdb/app/lib/postgresql/proc_srclib)
include_directories(${MOG_INCLUDE})

aux_source_directory(. DIR_SRCS)
add_library (${PROJECT_NAME} SHARED ${DIR_SRCS})

install(TARGETS ${PROJECT_NAME} DESTINATION ${MOG_LIBPATH})
```

***要点1：获取包含头文件的目录***

```
[omm@vmpc funcs]$ pg_config --includedir /opt/mogdb/app/include 
```

所需头文件路径：`pg_config --includedir`/postgresql/server

***要点1：c函数安装路径***

```
[omm@vmpc funcs]$ pg_config --pkglibdir /opt/mogdb/app/lib/postgresql 
```

安装路径：`pg_config --pkglibdir`/proc_srclib/

## 编译 & 安装

```
[omm@vmpc funcs]$ mkdir build
[omm@vmpc funcs]$ cd build/
[omm@vmpc build]$ cmake ../
CMake Deprecation Warning at CMakeLists.txt:1 (cmake_minimum_required):
  Compatibility with CMake < 2.8.12 will be removed from a future version of
  CMake.

  Update the VERSION argument <min> value or use a ...<max> suffix to tell
  CMake that the project does not need compatibility with older versions.


-- The C compiler identification is GNU 4.8.5
-- The CXX compiler identification is GNU 4.8.5
-- Detecting C compiler ABI info
-- Detecting C compiler ABI info - done
-- Check for working C compiler: /bin/cc - skipped
-- Detecting C compile features
-- Detecting C compile features - done
-- Detecting CXX compiler ABI info
-- Detecting CXX compiler ABI info - done
-- Check for working CXX compiler: /bin/c++ - skipped
-- Detecting CXX compile features
-- Detecting CXX compile features - done
-- Configuring done
-- Generating done
-- Build files have been written to: /opt/mogdb/funcs/build
[omm@vmpc build]$ make
[ 50%] Building CXX object CMakeFiles/gs_plug.dir/testfunc.cpp.o
[100%] Linking CXX shared library libgs_plug.so
[100%] Built target gs_plug
[omm@vmpc build]$ make install
Consolidate compiler generated dependencies of target gs_plug
[100%] Built target gs_plug
Install the project...
-- Install configuration: "Debug"
-- Installing: /opt/mogdb/app/lib/proc_srclib/libgs_plug.so
```

**依次执行如下命令**

```
mkdir build
cd build
cmake ../
make
make install
```

**确认安装**

```
[omm@vmpc build]$ ll /opt/mogdb/app/lib/proc_srclib/libgs_plug.so -rwxr-xr-x. 1 omm dbgrp 215696 Apr  2 00:17 /opt/mogdb/app/lib/proc_srclib/libgs_plug.so 
```

## 验证

- 链接mogdb

```
[omm@vmpc ~]$ pgcli -p 26000 -d postgres
Server: PostgreSQL 9.2.4
Version: 3.4.1
Home: http://pgcli.com
postgres>
```

- 创建C FUNCTION

```sql
postgres> CREATE FUNCTION add_ab(a int ,b int ) RETURNS integer
 AS 'testfunc.so', 'add_ab'
 LANGUAGE C STRICT;
CREATE FUNCTION
Time: 0.039s
```

- 查看函数

![image.png](./images/20220406-a79f0a2a-ab08-44e7-9e1c-e9724aef0293.png)

- 调用函数

```sql
postgres> select add_ab(a := 4, b := 2);
+--------+
| add_ab |
|--------|
| 6      |
+--------+
SELECT 1
Time: 0.033s
postgres>
```
