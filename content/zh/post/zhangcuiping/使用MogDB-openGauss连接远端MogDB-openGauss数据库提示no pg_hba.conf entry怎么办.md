+++

title = "使用MogDB/openGauss连接远端MogDB/openGauss数据库提示no pg_hba.conf entry怎么办" 

date = "2023-08-02" 

tags = ["使用MogDB/openGauss连接远端MogDB/openGauss数据库提示no pg_hba.conf entry怎么办"] 

archives = "2023-08" 

author = "张翠娉" 

summary = "使用MogDB/openGauss连接远端MogDB/openGauss数据库提示no pg_hba.conf entry怎么办"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "10:20"

+++

# 使用MogDB/openGauss连接远端MogDB/openGauss数据库提示no pg_hba.conf entry怎么办？



## 背景介绍

在使用MogDB查询远端MogDB数据库中的表时，提示no pg_hba.conf entry。

## 报错信息

```bash
MogDB=> select * from employee;
ERROR:  could not connect to server "db_link_to_db_postgres_1_182"
DETAIL:  FATAL:  no pg_hba.conf entry for host "192.3.1.161".
FATAL:  no pg_hba.conf entry for host "192.3.1.161".
```

## 问题分析

表employee所在的远端数据库的pg_hba.conf文件中未配置正确，不允许其他主机对其表进行访问。

## 解决办法

进入数据库的data目录下，找到pg_hba.conf文件，增加如下内容，放在文件最后即可。

```
host   all   all  0.0.0.0/0  md5
```

说明：该设置表示本数据库允许被远程访问。