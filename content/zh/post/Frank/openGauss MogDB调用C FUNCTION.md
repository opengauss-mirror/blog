+++

title = "openGauss/MogDB调用C FUNCTION"

date = "2022-05-16"

tags = ["openGauss/MogDB调用C FUNCTION"]

archives = "2020-05"

author = "xingchen"

summary = "openGauss/MogDB调用C FUNCTION"

img = "/zh/post/xingchen/title/8f11c785-f027-47b5-a1ba-726edaacb2f2.png"

times = "18:40"

+++
# openGauss/MogDB调用C FUNCTION
# 摘要
> 之前写过一篇关于[postgresql自定义函数实现，通过contrib模块进行扩展](https://blog.csdn.net/xk_xx/article/details/123011397 "postgresql自定义函数实现，通过contrib模块进行扩展")的帖子，今天和恩墨工程师进行了一些交流，在MogDB中也可以实现同样的功能，原以为需要完整的openGauss的源码才能完成，但在恩墨工程师的指点下，了解到，通过既有官网版本的安装包就可以进行插件开发。而且，使用postgres的C FUNCTION要比开发插件更加容易些。也感谢恩墨专家提供的线索和思路:+1: :+1:

# 环境准备
* 安装MogDB
参考官方文档，写的已经很详细了。
* 服务器环境
本地虚拟机 centos 7.9

***注意：尽量进入******omm******用户下进行编译，可以避免一些不必要的环境问题***

# 代码
* C代码
基本与postgres插件开发一样，关键是4,5,6三行。

```cpp
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
* CMakeLists.txt

```makefile
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

```Plain Text
[omm@vmpc funcs]$ pg_config --includedir
/opt/mogdb/app/include
```
所需头文件路径：\`pg\_config --includedir\`/postgresql/server

***要点1：c函数安装路径***

```Plain Text
[omm@vmpc funcs]$ pg_config --pkglibdir
/opt/mogdb/app/lib/postgresql
```
安装路径：\`pg\_config --pkglibdir\`/proc\_srclib/



# 编译 & 安装
```Plain Text
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

```Plain Text
mkdir build
cd build
cmake ../
make
make install
```
**确认安装**

```Plain Text
[omm@vmpc build]$ ll /opt/mogdb/app/lib/proc_srclib/libgs_plug.so
-rwxr-xr-x. 1 omm dbgrp 215696 Apr  2 00:17 /opt/mogdb/app/lib/proc_srclib/libgs_plug.so

```
# 验证
* 链接mogdb

```Plain Text
[omm@vmpc ~]$ pgcli -p 26000 -d postgres
Server: PostgreSQL 9.2.4
Version: 3.4.1
Home: http://pgcli.com
postgres>
```
* 创建C FUNCTION

```sql
postgres> CREATE FUNCTION add_ab(a int ,b int ) RETURNS integer
 AS 'testfunc.so', 'add_ab'
 LANGUAGE C STRICT;
CREATE FUNCTION
Time: 0.039s
```
* 查看函数

![image](images/8f11c785-f027-47b5-a1ba-726edaacb2f2.png)

* 调用函数

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