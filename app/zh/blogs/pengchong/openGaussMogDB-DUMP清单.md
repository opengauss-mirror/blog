---
title: 'openGauss/MogDB DUMP清单'

date: '2022-10-19'

tags: ['MogDB', 'openGauss']
category: 'blog'
archives: '2022-10'

author: '彭冲'

summary: 'openGauss/MogDB DUMP清单'

img: '/zh/post/pengchong/title/img9.png'

times: '10:20'
---

# openGauss/MogDB DUMP 清单

本文出处：[https://www.modb.pro/db/509150](https://www.modb.pro/db/509150)

当我们使用 gs_dump 和 gs_restore 工具做逻辑备份恢复时可以通过开关项来区分出特定的数据库对象，例如函数、表、数据等。 但我们区分对象时需要使用非常复杂的参数，本文将介绍另外一种方式：dump 清单。

## 清单介绍

dump 备份时不仅仅是备份结构和数据，还有关于备份描述的元数据，我们可以生成 dump 清单文件。它是一个文本文件，每行详细描述一个对象，清单文件行就像指针一样，引用 dump 中已经存在的内容。我们可以删除整行来编辑清单，但不能随意添加新行或者更改行内容。

## 清单产生过程

首先需要使用-Fc 格式来 dump 生成逻辑备份

```
gs_dump -Fc mydb -f mydatabase.db
```

创建 dump 文件之后，使用 gs_restore 工具和-l 开关生成清单，内容会输出到标准输出。

```
gs_restore -l mydatabase.db > mydatabase_manifest.ini
```

随后我们可以按照清单文件进行恢复：

```
gs_restore -L mydatabase_manifest.ini -d mydb2 mydatabase.db
```

## 清单内容

上面的清单文件内容如下：

```
$ cat mydatabase_manifest.ini
;
; Archive created at Sat Sep 10 19:49:15 2022
;     dbname: mydb
;     TOC Entries: 27
;     Compression: -1
;     Dump Version: 1.12-0
;     Format: CUSTOM
;     Integer: 4 bytes
;     Offset: 8 bytes
;     Dumped from database version: 9.2.4
;     Dumped by gs_dump version: 9.2.4
;
;
; Selected TOC Entries:
;
5011; 1262 15940 DATABASE - mydb omm
5012; 1262 15940 COMMENT - mydb omm
8; 2615 2200 SCHEMA - public omm
5014; 0 0 COMMENT - SCHEMA public omm
5015; 0 0 ACL - public omm
571; 1259 40974 TABLE public t omm
570; 1259 32825 TABLE public tab1 omm
567; 1259 24602 TABLE public tab_rec omm
569; 1259 32809 TABLE public table2_with_pk omm
568; 1259 32807 SEQUENCE public table2_with_pk_a_seq omm
5016; 0 0 LARGE SEQUENCE OWNED BY public table2_with_pk_a_seq omm
4631; 2604 32812 DEFAULT public a omm
5005; 0 40974 TABLE DATA public t omm
5004; 0 32825 TABLE DATA public tab1 omm
5001; 0 24602 TABLE DATA public tab_rec omm
5003; 0 32809 TABLE DATA public table2_with_pk omm
5017; 0 0 SEQUENCE SET public table2_with_pk_a_seq omm
4636; 2606 32829 CONSTRAINT public tab1_pkey omm
4634; 2606 32814 CONSTRAINT public table2_with_pk_pkey omm
4632; 1259 24609 INDEX public tab_rec_id_idx omm
...
```

前面分号开头的是注释，后面每行是一个对象描述，比如创建数据库、注释、模式、权限、表、数据、约束、外键、物化视图等，恢复时按顺序进行恢复。

## 清单定制

gs_restore 在生成清单并读取清单进行恢复之前，我们可以编辑清单然后再进行恢复。

例如我们定制清单：仅恢复表 tab_rec

```
GREP="TABLE public tab_rec | TABLE DATA public tab_rec"

gs_restore  -l mydatabase.db | grep -E "$GREP" > mydb2_manifest.ini
```

下面我们使用定制清单进行恢复，首先重建一下准备恢复的目标数据库 mydb2：

```
drop database mydb2 ;

create database mydb2;
```

使用动态生成的清单进行快速恢复

```
gs_restore -1 -L mydb2_manifest.ini -d mydb2 mydatabase.db
```

最后进行确认

```
$ gsql mydb2 -c '\dt+'
                                      List of relations
 Schema |  Name   | Type  | Owner |  Size   |             Storage              | Description
--------+---------+-------+-------+---------+----------------------------------+-------------
 public | tab_rec | table | omm   | 4336 kB | {orientation=row,compression=no} |
(1 row)
```
