---
title: 'openGauss数据库用copy命令操作文件'

date: '2022-04-07'

category: 'blog'
tags: ['openGauss数据库用copy命令操作文件']

archives: '2022-04'

author: '何放'

summary: 'openGauss数据库用copy命令操作文件'

img: '/zh/blogs/hefang/title/img6.png'

times: '10:20'
---

# openGauss 数据库用 copy 命令操作文件

最近项目上正好客户有提到 openGauss 怎么才能对文件进行操作，copy 命令是可以对文件进行操作，顺便解决完后发个文总结一下。

## copy 命令语法及解析

```
    COPY table_name [ ( column_name [, ...] ) ]
        FROM { 'filename' | PROGRAM 'command' | STDIN }
        [ [ WITH ] ( option [, ...] ) ]

    COPY { table_name [ ( column_name [, ...] ) ] | ( query ) }
        TO { 'filename' | PROGRAM 'command' | STDOUT }
    [ [ WITH ] ( option [, ...] ) ]
```

1. STDIN：指的是客户端程序的输入流。
2. STDOUT：指向是客户端的输出流。
3. OPTION：参数可以设置的有：FORMAT，OIDS，FREEZE，DELIMITER，NULL，HEADER，QUOTE，FORCE_QUOTE，FORCE_NOT_NULL，FORCE_NULL，ENCODING。

## copy 命令演示

copy 命令可以操作的文件类型有：txt、sql、csv、二进制格式。

**导入导出数据操作**

```
--copy导入','分割的字段
copy hould from '/home/omm/hould' delimiter ',';

--copy命令导入导出csv格式的文件
copy hould (id,name,time) to '/home/omm/hould.csv' csv header;
copy hould from '/home/omm/hould.csv';

--copy命令导入导出sql格式的文件
copy hould to '/home/omm/hould.sql';
copy hould from '/home/omm/hould.sql';

--copy命令导入导出txt格式的文件
copy hould to '/home/omm/hould.txt';
copy hould from '/home/omm/hould.txt';

--copy命令导入导出二进制格式文件
copy binary hould to '/home/omm/houldbinary';
copy binary hould from '/home/omm/houldbinary';
```

## \copy 与 copy 的区别

有时候会见到这两个相似的命令，会误导为是一个命令，这里区分一下：copy 是可以在远端操作数据文件，\copy 只能在本地的客户端操作。copy 命令只有超级用户能使用，\copy 命令一般用户就能操作。从性能上 copy 命令导入导出大数据文件比\copy 的性能都要高。
