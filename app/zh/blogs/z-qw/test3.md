---
title: 'openGauss社区入门（openGauss-定时任务）'

date: '2022-09-02'

category: 'blog'
tags: ['openGauss社区开发入门']

archives: '2022-09'

author: 'z-qw'

summary: 'openGauss社区开发入门'

img: ''

times: '18:30'
---

<a name="ozA43"></a>

## 为什么要使用定时任务

在一个固定的时间点活间隔一段时间需要频繁触发某一动作，为了使用便捷，有了定时任务，极大的减少了工作的重复性，提高了效率。

## 定时任务的内容

基于定时任务产生的背景，定时任务内容包括：定时任务的创建、任务到达时间点自动执行、删除任务、任务内容的修改（任务 id、任务的关闭开启、任务的触发时间、触发时间间隔、任务内容等）。

## 定时任务

### 1.创建表

`CREATE TABLE tb_test(insert_date timestamp default null,id int default null);`

显示信息

CREATE TABLE

创建表成功

### 2.创建定时任务

定时内容为：每间隔一分钟执行一次向表 tb_test 中插入(当前系统时间,1)

```
SELECT pkg_service.job_submit(1,'insert into tb_test values(sysdate,1);',sysdate,'''1min''::interval');
显示信息
job_submit
-------------
1
(1 row)
创建定时任务成功
间隔三分钟，查看表中信息
SELECT \* FROM tb_test;
显示信息
 insert_date | id
2022-09-02 17:50:04 | 1
2022-09-02 17:51: 04 | 1
2022-09-02 17:52:04 | 1
(3 rows)
```

定时任务执行成功

### 3.定时任务停止

```
SELECT pkg_service.job_finish(1，true);
显示信息
job_finish
-------------
(1 row)
定时任务停止
```

### 4.定时任务启动

```
SELECT pkg_service.job_finish(1，false);
显示信息
job_finish
-------------
(1 row)
定时任务启动
```

### 5.删除定时任务

```
SELECT pkg_service.job_cancel(1);
显示信息
job_cancel
-------------
(1 row)
删除定时任务
```
