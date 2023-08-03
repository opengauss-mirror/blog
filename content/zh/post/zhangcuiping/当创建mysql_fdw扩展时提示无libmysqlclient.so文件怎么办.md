+++

title = "当创建mysql_fdw扩展时提示无libmysqlclient.so文件怎么办" 

date = "2023-08-03" 

tags = ["当创建mysql_fdw扩展时提示无libmysqlclient.so文件怎么办"] 

archives = "2023-08" 

author = "张翠娉" 

summary = "当创建mysql_fdw扩展时提示无libmysqlclient.so文件怎么办"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "14:20"

+++

# 当创建mysql_fdw扩展时提示无libmysqlclient.so文件怎么办？

**背景介绍**：

在创建mysql_fdw扩展时提示无法找到libmysqlclient.so文件。

**报错内容**：

```sql
MogDB=# create extension mysql_fdw;
ERROR:  failed to load the mysql query:
libmysqlclient.so: cannot open shared object file: No such file or directory
HINT:  Export LD_LIBRARY_PATH to locate the library.
```

**解决办法**：

1. 访问[MySQL官网](https://downloads.mysql.com/archives/community/)下载MySQL安装包，例如mysql-8.0.33-linux-glibc2.28-x86_64.tar.gz。

2. 将解压后获得的libmysqlclient.so文件放在数据库的`/app/lib`目录下。

3. 再次登录数据库，执行 `create extension mysql_fdw` 即可成功。

   

   



