+++

title = "MogDB数据库中使用UUID函数" 

date = "2022-05-24" 

tags = ["MogDB数据库中使用UUID函数"] 

archives = "2022-05" 

author = "云和恩墨交付" 

summary = "MogDB数据库中使用UUID函数"

img = "/zh/post/hefang/title/img.png" 

times = "10:20"
+++

# MogDB数据库中使用UUID函数

本文出处：[https://www.modb.pro/db/176888](https://www.modb.pro/db/176888)

在MySQL迁移到MogDB过程中遇到个问题，由于客户需要使用uuid生成和转换功能，MogDB本身不支持uuid生成和转换功能。解决的办法是在MogDB数据库中，创建MySQL函数兼容性脚本，才能生成uuid函数及转换函数。

## 一.MySQL_Functions.sql文件下载

[下载地址](https://gitee.com/enmotech/compat-tools)

## 二.MogDB安装MySQL兼容性脚本

> **执行MySQL_Functions.sql创建函数**

```
gsql -p 26000 -U omm postgres -r -f MySQL_Functions.sql 
```

然后得到我们需要的函数

- uuid()
- uuid_to_bin(uuid, int4)
- bin_to_uuid(bytea, int4)

## 三.验证函数

首先创建表，插入数据

```
create table t2(id uuid,               username varchar(10)               ); insert into t2(id,username) values(uuid(),'zhangsan'),(uuid(),'lisi'),(uuid(),'wangwu'); 
```

> **MogDB函数uuid使用测试**

```
select uuid(id) from t2;
```

> **MogDB函数uuid_to_bin使用测试**

```
select uuid_to_bin(uuid(id)) from t2; 
```

> **MogDB函数bin_to_uuid使用测试**

```
select bin_to_uuid(uuid_to_bin(uuid(id))) from t2;
```

注意： MogDB与MySQL不是完全一对一的兼容，MogDB中uuid基于时间戳和随机值的哈希值计算得出。
