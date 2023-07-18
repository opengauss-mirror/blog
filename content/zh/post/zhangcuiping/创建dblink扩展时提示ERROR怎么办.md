+++

title = "创建dblink扩展时提示ERROR怎么办?" 

date = "2023-07-18" 

tags = ["创建dblink扩展时提示ERROR怎么办?"] 

archives = "2023-07" 

author = "张翠娉" 

summary = "创建dblink扩展时提示ERROR怎么办?"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "10:20"
+++

# 创建dblink扩展时提示ERROR怎么办?

## 背景信息

安装好dblink插件，登录数据库创建dblink扩展，报错。

## 报错信息

```sql
MogDB=# create extension dblink;
ERROR:  could not load library "dblink.so": libltdl.so.7: cannot open shared object file: No such file or directory
```

## 解决思路

在另一台可以成功创建dblink扩展的机器上，发现libltdl.so.7依赖文件位于/usr/lib64目录下，将该目录下的libltdl.so.7文件复制到有问题的机器的/usr/lib64目录下即可成功创建dblink扩展。
