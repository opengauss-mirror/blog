+++

title = "如何在 MogDB / openGauss 中存储注册商标( ® )字符" 

date = "2022-04-12" 

tags = ["如何在 MogDB / openGauss 中存储注册商标( ® )字符"] 

archives = "2022-04" 

author = "eygle" 

summary = "如何在 MogDB / openGauss 中存储注册商标( ® )字符"

img = "/zh/post/gaiguoqiang/title/img28.png" 

times = "10:20"
+++

# 如何在 MogDB / openGauss 中存储注册商标( ® )字符

本文首发于墨天轮：https://www.modb.pro/db/164819



有朋友在 ”云和恩墨大讲堂“ 中提问，如何将 注册商标 ® 字符存入数据库，并能够正确显示。

之前我写过一篇文章：[MogDB 对于生僻字的存储和显示：㼆 㱔 䶮 𬎆(王莹)](https://www.modb.pro/db/130498) ,其实字符的存储主要就是和字符集相关。

我们来看看 MogDB 是否能够正确存储注册商标这个特殊字符，非常简单，在墨天轮的云市场花上一分钱，就买到一个[虚拟机实训环境](https://www.modb.pro/marketlist?type=1)。

```sql
omm=# select * from v$version;
                      banner                      
--------------------------------------------------
 MogDB 2.0.1 build f892ccb7
 compiled at 2021-07-09 16:15:21 
 Platform architecture: aarch64-unknown-linux-gnu
(3 rows)

omm=# create table mogdb (cname varchar2(10));
CREATE TABLE
omm=# insert into mogdb values('®');
INSERT 0 1
omm=# select * from mogdb;
 cname 
-------
 ®
(1 row)
```



数据库使用的试验环境缺省字符集 UTF8

```sql
omm=# show server_encoding;
 server_encoding 
-----------------
 UTF8
(1 row)omm=# select * from v$nls_parameters;
      parameter       |           value            |                                 description                                  
----------------------+----------------------------+------------------------------------------------------------------------------
 lc_collate           | en_US.UTF-8                | Shows the collation order locale.
 lc_ctype             | en_US.UTF-8                | Shows the character classification and case conversion locale.
 lc_messages          | en_US.UTF-8                | Sets the language in which messages are displayed.
 lc_monetary          | en_US.UTF-8                | Sets the locale for formatting monetary amounts.
 lc_numeric           | en_US.UTF-8                | Sets the locale for formatting numbers.
 lc_time              | en_US.UTF-8                | Sets the locale for formatting date and time values.
 nls_timestamp_format | DD-Mon-YYYY HH:MI:SS.FF AM | defines the default timestamp format to use with the TO_TIMESTAMP functions.
 NLS_CHARACTERSET     | UTF8                       | Database/Server encoding
```



通过如上测试，可以看到 ® 被正确显示，测试版本为 MogDB 2.0.1 。
