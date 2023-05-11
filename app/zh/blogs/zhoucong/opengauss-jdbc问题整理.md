---
title: 'opengauss-jdbc问题整理'
date: '2023-02-08'
tags: ['opengauss-jdbc问题整理']
archives: '2023-02'
author: 'zhoucong'
category: 'blog'
summary: 'opengauss-jdbc问题整理'
img: ''
times: '16:00'
---

# opengauss-jdbc 问题整理

## 问题 1 jdbc 批量执行 insert 语句时返回结果不符合 Spring jpa 预期

**问题描述：**

jdbc 执行查询时，可以使用`preparestatment.executeBatch()`方法批量执行一组 sql 语句，该方法返回为`int[]`int 型数组变量，含义是批量执行的每个 sql 语句更新的数据行数。通过 spiring jpa 批量执行相同格式的语句时（例如`insert into table1 values (?, ?, ? , ?)`，批量执行 5 次 ），预期返回的 int 型数组值为`[1, 1, 1, 1, 1]`，实际返回结果为`[5, 0, 0, 0, 0]`，与预期部分，导致如下报错：

```
Caused by: org.springframework.orm.jpa.JpaSystemException: Batch update returned unexpected row count from update [0]; actual row count: XX; expected: 1; nested exception is org.hibernate.jdbc.BatchedTooManyRowsAffectedException: Batch update returned unexpected row count from update [0]; actual row count: XX; expected: 1
 at org.springframework.orm.jpa.vendor.HibernateJpaDialect.convertHibernateAccessException(HibernateJpaDialect.java:331)
```

**问题原因：**

jdbc 自身的优化机制，使用 executeBatch 批量执行 sql 时，如果批量执行 sql 格式相同，jdbc 默认会将多个 sql 合成一个执行，所以返回结果为`[5, 0, 0, 0, 0]`。

**解决办法：**

在连接串配置`batchMode=off`，所有 sql 分别执行，返回结果为`[1, 1, 1, 1, 1]`。
