---
title: '如何在openGauss中使用zhparser'
date: '2021-11-05'
category: 'blog'
tags: ['如何在openGauss中使用zhparser']
archives: '2021-11-05'
author: 'gentle_hu'
summary: '如何在openGauss中使用zhparser'
img: '/zh/blogs/huzhengchao/title/img1.png'
times: '9:30'
---

<!-- [TOC] -->

# 如何在 openGauss 中使用 zhparser

## 准备

1. 一个装有 openGauss 数据库的环境
2. 下载 scws 代码到任意位置: https://github.com/hightman/scws master
3. 下载 zhparser 代码到任意位置: https://github.com/amutu/zhparser master

## 步骤

1. 登录环境并 source openGauss 的环境变量
2. 编译安装 scws
   1. 解压并进入文件夹： `unzip scws-master.zip && cd scws-master`
   2. 生成 configure 文件并执行编译： `./acprep && ./configure && make`
   3. 安装 scws 到相关 lib 目录(需要 root 权限)：`make install`
   4. 修改刚刚安装的 scws lib 的到合适的权限(需要 root 权限)：`chmod 777 /usr/local/include/scws -R`
3. 编译安装 zhparser
   1. 解压并进入文件夹：`unzip zhparser-master.zip && cd zhparser-master`
   2. 按照下文 patch 修改 zhparser 代码。
   3. 编译安装(若报错见 Q&A)：`make && make install`

## PATCH

```
diff --git a/zhparser-master/Makefile b/zhparser-master/Makefile
index ae048c3..20b1830 100644
--- a/zhparser-master/Makefile
--- b/zhparser-master/Makefile
@@ -12,7 +12,7 @@ DATA_TSEARCH = dict.utf8.xdb rules.utf8.ini
 REGRESS = zhparser

 SCWS_HOME ?= /usr/local
-PG_CPPFLAGS = -I$(SCWS_HOME)/include/scws
+PG_CPPFLAGS = -I$(SCWS_HOME)/include/scws -fpic
 SHLIB_LINK = -lscws -L$(SCWS_HOME)/lib -Wl,-rpath -Wl,$(SCWS_HOME)/lib

 PG_CONFIG ?= pg_config
diff --git a/zhparser-master/zhparser.c b/zhparser-master/zhparser.c
index 527cef0..6212533 100644
--- a/zhparser-master/zhparser.c
--- b/zhparser-master/zhparser.c
@@ -57,16 +57,16 @@ static void init_type(LexDescr descr[]);
  * prototypes
  */
 PG_FUNCTION_INFO_V1(zhprs_start);
-Datum          zhprs_start(PG_FUNCTION_ARGS);
+extern "C" Datum zhprs_start(PG_FUNCTION_ARGS);

 PG_FUNCTION_INFO_V1(zhprs_getlexeme);
-Datum          zhprs_getlexeme(PG_FUNCTION_ARGS);
+extern "C" Datum zhprs_getlexeme(PG_FUNCTION_ARGS);

 PG_FUNCTION_INFO_V1(zhprs_end);
-Datum          zhprs_end(PG_FUNCTION_ARGS);
+extern "C" Datum zhprs_end(PG_FUNCTION_ARGS);

 PG_FUNCTION_INFO_V1(zhprs_lextype);
-Datum          zhprs_lextype(PG_FUNCTION_ARGS);
+extern "C" Datum               zhprs_lextype(PG_FUNCTION_ARGS);

 static scws_t scws = NULL;
 static ParserState parser_state;
@@ -213,7 +213,7 @@ static void init(){
        }

        snprintf(dict_path, MAXPGPATH, "%s/base/%u/zhprs_dict_%s.txt",
-                       DataDir, MyDatabaseId, get_database_name(MyDatabaseId));
+                       t_thrd.proc_cxt.DataDir, u_sess->proc_cxt.MyDatabaseId, get_database_name(u_sess->proc_cxt.MyDatabaseId));
        if(scws_add_dict(scws, dict_path, load_dict_mem_mode | SCWS_XDICT_TXT) != 0 ){
                ereport(NOTICE,
                            (errcode(ERRCODE_INTERNAL_ERROR),

```

## Q&A

1、编译 zhparser 时报错 error: access/ustore/undo/knl_uundotype.h: No such file or directory

​ 解决方法：将 openGauss-server/src/include/access/ustore/undo/knl_uundotype.h 拷贝到 $GAUSSHOME/include/postgresql/server/access/ustore/undo/中，若没有目标位置没有这个文件夹，需要自行创建。

2、编译 zhparser 时报错 error: communication/commproxy_basic.h: No such file or directory

​ 参考上一个。
