+++
title = "opengauss-jdbc问题整理"
date = "2023-02-08"
tags = ["opengauss-jdbc问题整理"]
archives = "2023-02"
author = "zhoucong"
summary = "opengauss-jdbc问题整理"
img = "/zh/post/xingchen/title/img1.png"
times = "16:00"

+++

# opengauss-jdbc问题整理

## 问题1 jdbc批量执行insert语句时返回结果不符合Spring jpa预期

**问题描述：**

jdbc执行查询时，可以使用`preparestatment.executeBatch()`方法批量执行一组sql语句，该方法返回为`int[]`int型数组变量，含义是批量执行的每个sql语句更新的数据行数。通过spiring jpa批量执行相同格式的语句时（例如`insert into table1 values (?, ?, ? , ?)`，批量执行5次 ），预期返回的int型数组值为`[1, 1, 1, 1, 1]`，实际返回结果为`[5, 0, 0, 0, 0]`，与预期部分，导致如下报错：

```
Caused by: org.springframework.orm.jpa.JpaSystemException: Batch update returned unexpected row count from update [0]; actual row count: XX; expected: 1; nested exception is org.hibernate.jdbc.BatchedTooManyRowsAffectedException: Batch update returned unexpected row count from update [0]; actual row count: XX; expected: 1
 at org.springframework.orm.jpa.vendor.HibernateJpaDialect.convertHibernateAccessException(HibernateJpaDialect.java:331)
```

**问题原因：**

jdbc自身的优化机制，使用executeBatch批量执行sql时，如果批量执行sql格式相同，jdbc默认会将多个sql合成一个执行，所以返回结果为`[5, 0, 0, 0, 0]`。

**解决办法：**

在连接串配置`batchMode=off`，所有sql分别执行，返回结果为`[1, 1, 1, 1, 1]`。