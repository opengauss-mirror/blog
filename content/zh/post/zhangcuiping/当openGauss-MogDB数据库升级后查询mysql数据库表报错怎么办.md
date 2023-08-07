+++

title = "当openGauss/MogDB数据库升级后查询mysql数据库表报错怎么办" 

date = "2023-08-07" 

tags = ["当openGauss/MogDB数据库升级后查询mysql数据库表报错怎么办"] 

archives = "2023-08" 

author = "张翠娉" 

summary = "当openGauss/MogDB数据库升级后查询mysql数据库表报错怎么办"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "14:20"

+++

# 当openGauss/MogDB数据库升级后查询mysql数据库表报错怎么办？

**背景介绍**：

在3.0.5中创建mysql_fdw后，成功建立与MySQL数据库的数据连接。当把3.0.5升级到5.0.0后，再次查询MySQL数据库表时，报错。

**报错内容**：

```sql
MogDB=> select * from t_test_a;
ERROR:  failed to load the mysql query:
/opt/mogdb305/app/lib/libmysqlclient.so: file too short
HINT:  Export LD_LIBRARY_PATH to locate the library.
```

**解决办法**：

在root用户下查询获得libmysqlclient.so文件所在的安装路径（/opt/mysql/mysql-8.0.33-linux-glibc2.28-x86_64/lib/libmysqlclient.so）后，为该文件做软链接，链接到数据库的lib目录（/opt/mogdb305/app/lib），即在root用户下执行以下命令：

```bash
[root@mogdb-kernel-002 lib]# find / -name libmysqlclient.so
/opt/mogdb305/app/lib/libmysqlclient.so
/opt/mysql/mysql-8.0.33-linux-glibc2.28-x86_64/lib/libmysqlclient.so

[root@mogdb-kernel-002 lib]# ln -s /opt/mysql/mysql-8.0.33-linux-glibc2.28-x86_64/lib/libmysqlclient.so   /opt/mogdb305/app/lib
```
