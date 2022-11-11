+++

title = "openGauss/MOGDB Copy支持容错机制" 

date = "2022-05-23" 

tags = ["openGauss/MOGDB Copy支持容错机制"] 

archives = "2022-05" 

author = "云和恩墨-阎书利" 

summary = "openGauss/MOGDB Copy支持容错机制"

img = "/zh/post/ysl/title/img39.png" 

times = "10:20"
+++

# openGauss/MOGDB Copy支持容错机制

本文出处：[https://www.modb.pro/db/374246](https://www.modb.pro/db/374246)

# 一、COPY容错机制相关选项

MOGDB/openGauss允许用户在使用Copy From指令时指定容错选项，使得Copy From语句在执行过程中部分解析、数据格式、字符集等相关的报错不会报错中断事务、而是被记录至错误表中，使得在Copy From的目标文件即使有少量数据错误也可以完成入库操作。用户随后可以在错误表中对相关的错误进行定位以及进一步排查。

主要包括三个主要的选项:

- **LOG ERRORS**
  若指定，则开启对于COPY FROM语句中数据类型错误的容错机制

- LOG ERRORS DATA

  LOG ERRORS DATA和LOG ERRORS的区别:

  1. LOG ERRORS DATA会填充容错表的rawrecord字段。
  2. 只有supper权限的用户才能使用LOG ERRORS DATA参数选项。

- **REJECT LIMIT 'limit’**
  与LOG ERROR选项共同使用，对COPY FROM的容错机制设置数值上限，一旦此COPY FROM语句错误数据超过选项指定条数，则会按照原有机制报错。
  取值范围：正整数（1-INTMAX），‘unlimited’（无最大值限制）

![1646888448378.png](./figures/20220310-b33187c2-172b-4972-b6c9-711860ae28f7.png)

# 二、Copy错误表创建函数

MOGDB/openGauss里已经给用户提供了封装好的Copy错误表创建函数 pg_catalog.copy_error_log_create()。执行就可以创建相应的错误表public.pgxc_copy_error_log。当然这个函数也可以手动移除重建。如下是重建的函数。

```
CREATE OR REPLACE FUNCTION pg_catalog.copy_error_log_create()
RETURNS bool
AS $$
DECLARE
	query_str_create_table text;
	query_str_create_index text;
	query_str_do_revoke text;
	BEGIN
		query_str_create_table := 'CREATE TABLE public.pgxc_copy_error_log 
							(relname varchar, begintime timestamptz, filename varchar, lineno int8, rawrecord text, detail text)';
		EXECUTE query_str_create_table;
		
		query_str_create_index := 'CREATE INDEX copy_error_log_relname_idx ON public.pgxc_copy_error_log(relname)';
		EXECUTE query_str_create_index;
		
		query_str_do_revoke := 'REVOKE ALL on public.pgxc_copy_error_log FROM public';
		EXECUTE query_str_do_revoke;
		
		return true;
	END; $$
LANGUAGE 'plpgsql' NOT FENCED;

REVOKE ALL on FUNCTION pg_catalog.copy_error_log_create() FROM public;
如果不创建copy错误表，仅仅带上容错选项的话，会有如下相关提示。
执行 pg_catalog.copy_error_log_create()创建copy错误表

```

## 三、COPY FROM存在错误的数据

再执行copy命令，报错的copy数据会被记录到public.pgxc_copy_error_log 里而不会影响其他正确的数据的导入。

![1646890609603.png](./figures/20220310-f2d4d537-1f04-42d2-ab98-7fa5a28cd118.png)
![1646890472876.png](./figures/20220310-e345ddf5-9928-4bc7-92e3-e83709d835ce.png)

**注意要指定REJECT LIMIT ‘limit’,且limit的值要足够大，否则当COPY FROM语句错误数据超过选项指定条数，则会按照原有机制报错。**

表里记录的内容，是通过Log_copy_error_spi函数读取缓存文件中的每一行，并组装spi要执行的查询字符串,把将错误记录插入带有spi的copy_error_Log表中。
![1646896503427.png](./figures/20220310-601f8ccb-9c12-43a5-82f5-59c779123d57.png)
