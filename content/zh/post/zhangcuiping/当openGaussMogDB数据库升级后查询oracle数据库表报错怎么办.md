+++

title = "当openGauss/MogDB数据库升级后查询oracle数据库表报错怎么办" 

date = "2023-08-04" 

tags = ["当openGauss/MogDB数据库升级后查询oracle数据库表报错怎么办"] 

archives = "2023-08" 

author = "张翠娉" 

summary = "当openGauss/MogDB数据库升级后查询oracle数据库表报错怎么办"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "14:20"

+++

# 当openGauss/MogDB数据库升级后查询oracle数据库表报错怎么办？

**背景介绍**：

在3.0.5中创建oracle_fdw后，成功建立与oracle数据库的数据连接。当把3.0.5升级到5.0.0后，再次查询oracle数据库表时，报错。

**报错内容**：

```sql
MogDB=> select * from employee1;
ERROR:  Error: environment variable "$libdir/oracle_fdw" contain invaild symbol "$".
```

**报错原因**：发现数据库目录的/app/postgresql目录下无法找到oracle_fdw.so文件；/app/share/postgresql/extension目录下无法找到oracle_fdw.control以及oracle_fdw--1.1.sql文件，应该是个bug。

**解决办法**：

下载5.0.0 oracle_fdw插件，将oracle_fdw.so、oracle_fdw.control、oracle_fdw--1.1.sql文件拷贝到对应的数据库目录，即可成功查询oracle表数据。







