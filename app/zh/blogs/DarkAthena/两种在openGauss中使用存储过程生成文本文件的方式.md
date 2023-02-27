---
title: '两种在openGauss中使用存储过程生成文本文件的方式'

date: '2022-11-07'

tags: ['openGauss']
category: 'blog'
archives: '2022-11'

author: 'DarkAthena'

summary: '两种在openGauss中使用存储过程生成文本文件的方式'

img: '/zh/post/DarkAthena/title/img.png'

times: '10:20'
---

# 两种在 openGauss 中使用存储过程生成文本文件的方式

本文出处：[https://www.modb.pro/db/545619](https://www.modb.pro/db/545619)

## 前言

在很多使用 Oracle 数据库的业务应用系统中，尤其是涉及到多个系统需要进行大量数据交互的，如果使用 httpapi 直接传递表格数据，效率会极其的慢，且很耗应用的计算性能，所以往往会采取用文件的方式来传输大量数据。
Oracle 中有一个 utl_file 包，就适用于此场景，在数据库中直接查询出数据，然后写入文件，省去了应用的内存占用，也节省了应用到数据库之间的网络开销。

可是，在 openGauss 中并无 utl_file 包，那么在 openGauss 中该如何实现 utl_file 包的功能呢？

## 第三方解决方案

由于 openGauss 源自开源的 postgresql，而前面提到的这个场景，肯定有人考虑过。那么，秉着不重复造轮子的原则，先找一下有没有人在 postgresql 中做过类似的实现吧。

这一搜，就搜到了有名的 oracle 兼容插件 orafce。

[https://github.com/orafce/orafce](https://github.com/orafce/orafce)

在 orafce 中，提供了很多 oracle 兼容函数、视图，还有 dual 表，以及几个 oracle 内置包，比如 dbms_output、dbms_sql、utl_file、dbms_pipe、dbms_alert、DBMS_utility、DBMS_random。

在很多基于 postgresql 开发的数据库中，都可以见到这些包，也就是说这些数据库很可能都是用了 orafce 这个插件，或者是进行了移植。这些包里的函数，和 oracle 并非完全一致，所以可以根据那些不一致的函数，来识别是否为 orafce 的代码，关于这个就不再展开了。

同样，在 openGauss 中，虽然默认安装时是没有 orafce 插件的，但是社区提供了适配过的 orafce 源码: [https://gitee.com/opengauss/Plugin/tree/master/contrib/orafce](https://gitee.com/opengauss/Plugin/tree/master/contrib/orafce)

安装这个插件后，数据库中就有 utl_file 了，使用方式和 oracle 数据库差不多，但有几点区别需要注意

1. 原生 pg 没有 create directory 这个语法，所以也不存在像 oracle 当中的 DBA_DIRECTORY 这样的视图，所以 orafce 创建了一个表 utl_file_dir，当需要创建目录名和实际目录的对应关系时，插一行数据进去就行了，如果这个表中没有对应目录的记录，则不允许对访问操作系统上的目录。
2. 不支持 nchar/nvarchar 文本的读写，不过由于 PG 本身就没国家字符集这个东西，所以也没必要了
3. 不支持二进制(raw)的读写，虽然大多数时候一般是读写文本，但是在 oracle 中，经常会需要采集二进制的读写来确保数据的一致性，因为文本中的特殊字符往往容易出现由于没有转义而出现差异，而且还有字符集的问题。更别提有些 oracle 数据库中的确有管理二进制文件，比如图片、excel 表格、pdf 文档等。
4. utl_file.fclose 使用时的语法不一致，oracle 中为一个过程，但 orafce 中为一个带 return 值的函数

#### 针对 openGauss 进行改进

对于第 1 点，虽然 pg 没有目录管理，但是 openGauss 有。在 openGauss 中，是有 create directory 语法的，对应的表为 pg_directory

[https://docs.opengauss.org/zh/docs/3.0.0/docs/Developerguide/CREATE-DIRECTORY.html](https://docs.opengauss.org/zh/docs/3.0.0/docs/Developerguide/CREATE-DIRECTORY.html)

[https://docs.opengauss.org/zh/docs/3.0.0/docs/Developerguide/PG_DIRECTORY.html](https://docs.opengauss.org/zh/docs/3.0.0/docs/Developerguide/PG_DIRECTORY.html)

所以，我们可以借用 pg_directory 这个表，来创建一个 dba_directory 的兼容视图

```
create view public.dba_directories as
select 'SYS' OWNER,
dirname DIRECTORY_NAME,
dirpath DIRECTORY_PATH
FROM pg_catalog.pg_directory;
```

然后，在执行 create extension orafce 之前，修改 orafce 的 sql 脚本文件

把创建 utl_file_dir 表的 sql 注释掉，改成创建 utl_file_dir 视图，指向 pg_directory 表，像下面这样

```
/*CREATE TABLE utl_file.utl_file_dir(dir text, dirname text unique);*/
/*for openGauss*/
create view utl_file.utl_file_dir as
select dirpath dir,dirname from pg_catalog.pg_directory;
```

保存，然后再进数据库执行 create extension orafce，这样，就能像 oracle 数据库中一样，使用 create directory 创建目录，然后使用 utl_file 来进行读写文本的操作了。

不过需要注意，创建目录，需要对用户进行授权，并且还有在服务器上开启允许访问操作系统目录

```
grant gs_role_directory_create to username;
ALTER SYSTEM SET enable_access_server_directory TO on;
```

在 openGauss3.0 版本中，create directory 没有任何意义，因为这个是给 GaussDB(for openGauss)中的 DBE_FILE 包使用的，而开源的 openGauss 中并没有这个包。本文的这个操作，赋予了 create directory 新的价值

## 非第三方支持

很多时候，需求往往会被带偏，没有去了解用户的原始需求场景，而是直接默认了一条路径去进行分析，把问题复杂化了。

比如，我们在客户的 oracle 数据库中，经常有发现这个一个这样的存储过程(存储过程名称可能不一样)，传入目录/文件名/分割符/查询 sql,通过调用 dbms_Sql 和 utl_file 包来生成文件，代码和下面 2006 年的这篇文章中类似

https://blog.csdn.net/mxfhhh/article/details/606168

```
create or replace procedure UP_DATA_TO_TXT
(
p_query in varchar2,
--传入相关的SELECT 语句 严格按如下格式'select id from tablename where pp=ww'
p_dir in varchar2,  --utl_file允许的路径，请查看相关文档)
p_filename in varchar2  --要生成的文件名字(形如:aa而不必是aa.txt)名字就可以了
) is
l_cursor number;
l_row number; --执行行数
l_id varchar2(40);
l_name varchar2(80);
l_column_value varchar2(1000);
--
l_output utl_file.file_type;
l_line varchar2(4000):=null;
--
l_colcnt integer;
l_desctbl DBMS_SQL.DESC_TAB;
l_cnt number default 0;
first_column_value varchar2(1000);
begin
l_cursor:=dbms_sql.open_cursor;
dbms_sql.parse(l_cursor,p_query,dbms_sql.native); --分析语句
dbms_sql.describe_columns(l_cursor,l_colcnt,l_desctbl);--渲染列，以得到列数
----
for i in 1..l_colcnt loop--定义列，
DBMS_SQL.DEFINE_COLUMN(l_cursor,i,l_column_value,1000);
end loop;
-----
l_row:=dbms_sql.execute(l_cursor); --执行语句
--
l_output:=utl_file.fopen(p_dir,p_filename||'.txt','w',32760);
LOOP
   IF DBMS_SQL.FETCH_ROWS(l_cursor)>0 THEN
   -------------------
   l_line:=null;
   for i in 2..l_colcnt loop--得到此行列的值
   DBMS_SQL.COLUMN_VALUE(l_cursor,1,first_column_value);
   DBMS_SQL.COLUMN_VALUE(l_cursor,i,l_column_value);
    l_line:=l_line||'|'||l_column_value;
end loop;
    ------------------
    l_line:=first_column_value||l_line;
      utl_file.put_line(l_output,l_line);
   else
       exit;
   end if;
end loop ;
--
utl_file.fclose(l_output);
dbms_sql.close_cursor(l_cursor); --关闭光标
EXCEPTION
when no_data_found then
utl_file.fclose(l_output);
WHEN OTHERS THEN
IF DBMS_SQL.IS_OPEN(l_cursor) THEN
DBMS_SQL.CLOSE_CURSOR(l_cursor);
END IF;
RAISE;
end UP_DATA_TO_TXT;
```

因为 oracle 数据库中，没有提供一个函数或者语法，能直接用 sql 或者 plsql 命令来把一条 sql 的查询结果生成数据，所以需要借用 dbms_sql 来查询数据每行按字段循环，来拼接成字符串，再循环调用 utl_file，将每行字符串写入文件。

但是，mysql/sqlserver/postgresql 中都有把 sql 查询结果生成文件的语法，比如在 postgresql 中就是下面这个样子

```
copy (select * from table) to '/tmp/file_name.csv' with (delimiter E',');
```

copy to 是一个 sql 语法，就像 select /create 之类的 sql 一样，因此，它也可以使用在存储过程中。

但是，openGauss 加强了安全性，这种直接访问服务器操作系统文件风险太大，因此非初始用户是没有执行 copy to 的权限的。

然而，openGauss 参考 oracle,提供了存储过程使用创建者权限执行的方法（AUTHID definer），所以，我们可以用 openGauss 自己提供的方式来绕过 openGauss 的限制。

#### 操作步骤

1. 在数据库服务器上，用初始用户登录数据库
2. 开启允许访问服务器目录，并授权指定用户允许创建文件夹

```
ALTER SYSTEM SET enable_access_server_directory TO on;
grant gs_role_directory_create to username;
```

3. 创建存储过程

```
--使用初始用户创建存储过程（注意指定需要使用的schema）
create or replace procedure username.UP_DATA_TO_TXT(P_DIR       IN VARCHAR2, --oracle目录
                             P_FILENAME  IN VARCHAR2, --导出文件名
                             P_DELIMITER IN VARCHAR2, --分隔符
                             P_QUERY     IN VARCHAR2 --导数的sql语句
                             )
                             AUTHID definer
is
l_realpath text;
begin
        select dirpath into l_realpath
    from pg_catalog.pg_directory
    where dirname=P_DIR;
        execute 'COPY ('||P_QUERY||') TO '''||l_realpath||'/'||P_FILENAME||''' with (delimiter E'''||P_DELIMITER||''')';
end;
```

4. 创建文件夹

```
create directory tmpdir as '/tmp';
```

5. 切换用户，测试存储过程

```
begin
  UP_DATA_TO_TXT('tmpdir','test123.dat',',','select proname,1 b from pg_proc where rownum<=10');
end;
```

6. 检查操作系统对应目录下是否存在文件

```
cat /tmp/test123.dat

abbrev,1
abbrev,1
abort,1
abs,1
abs,1
abs,1
abs,1
abs,1
abs,1
abstime,1
```

可以看到，最后这个存储过程调用的效果完全满足客户的原始需求场景，而且效率更高，因为它实际上只需要执行一条 sql 命令，而不用像 oracle 中那样嵌套循环拼接字符串。

## 总结

在很多国产数据库适配的项目中，经常会跳过原始需求场景直接要求支持对应的功能，这是一种舍本逐末的表现。比如本文中的例子，如果仅仅是为了一个 sql 生成文本的功能，去开发 dbms_sql 和 utl_file 这两个包，而且还保留在 oracle 中那样复杂的逻辑，看上去高兼容度，迁移很顺，但实际上执行性能远远比不过数据库本身自带的一条命令。既然选择了要更换数据库，那么就应该使用目标数据库更合适的方式，代码该改还是得改，否则无法体会到国产数据库更强大的功能和更好的性能。

> - **本文作者：** [DarkAthena](https://www.darkathena.top/)
> - **本文链接：** [https://www.darkathena.top/archives/2way-write-file-with-procedure-in-opengauss](https://www.darkathena.top/archives/2way-write-file-with-procedure-in-opengauss)
> - **版权声明：** 本博客所有文章除特别声明外，均采用[CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) 许可协议。转载请注明出处！
