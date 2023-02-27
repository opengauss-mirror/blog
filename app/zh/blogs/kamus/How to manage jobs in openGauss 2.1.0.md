---
title: 'How to manage jobs in openGauss 2.1.0'
date: '2021-10-12'
category: 'blog'
tags: ['openGauss 2.1.0']
archives: '2021-10'
author: 'Kamus'
summary: 'openGauss 2.1.0版本中新增了数据库任务创建，可以在数据库中设定和执行定时任务。'
img: '/zh/blogs/kamus/title/img-title.png'
times: '21:30'
---

## 创建测试表

```
gaussdb@postgres> create table t_job (value TIMESTAMP);
CREATE TABLE

gaussdb@postgres> insert into t_job values(sysdate);
INSERT 0 1

gaussdb@postgres> select * from t_job;
+---------------------+
| value               |
|---------------------|
| 2021-10-09 04:36:20 |
+---------------------+
SELECT 1
```

## 创建任务，每一分钟插入一条记录

```
gaussdb@postgres> select pkg_service.job_submit(null, 'insert into t_job values(sysdate);',sysdate,'sysdate + 1/1440');
+--------------+
| job_submit   |
|--------------|
| 15566        |
+--------------+
SELECT 1
```

## 检查 JOB 运行结果

```
gaussdb@postgres> select * from t_job;
+---------------------+
| value               |
|---------------------|
| 2021-10-09 04:36:20 |
| 2021-10-09 04:40:54 |
| 2021-10-09 04:41:54 |
| 2021-10-09 04:42:54 |
+---------------------+
SELECT 4
```

## 从系统视图中检查 JOB 运行情况

```
gaussdb@postgres> select job_id,dbname,start_date,next_run_date,interval,failure_count from pg_job;
+----------+----------+----------------------------+---------------------+------------------+-----------------+
| job_id   | dbname   | start_date                 | next_run_date       | interval         | failure_count   |
|----------+----------+----------------------------+---------------------+------------------+-----------------|
| 15566    | postgres | 2021-10-09 04:40:54.072363 | 2021-10-09 04:56:54 | sysdate + 1/1440 | 0               |
+----------+----------+----------------------------+---------------------+------------------+-----------------+
SELECT 1
Time: 0.089s
gaussdb@postgres> select * from pg_catalog.pg_job_proc pjp where job_id=15566;
+----------+------------------------------------+
| job_id   | what                               |
|----------+------------------------------------|
| 15566    | insert into t_job values(sysdate); |
+----------+------------------------------------+
SELECT 1
Time: 0.089s
```

## 修改为 2 分钟执行一次

```
gaussdb@postgres> select pkg_service.job_update(15566,null,'sysdate + 2/1440',null);
+--------------+
| job_update   |
|--------------|
|              |
+--------------+
SELECT 1
```

## 检查修改情况和运行结果

```
[gaussdb@postgres> select job_id,interval from pg_job where job_id=15566;
+----------+------------------+
| job_id   | interval         |
|----------+------------------|
| 15566    | sysdate + 2/1440 |
+----------+------------------+
SELECT 1](<gaussdb@postgres%3E select * from t_job;
+---------------------+
| value               |
|---------------------|
| 2021-10-09 04:36:20 |
| 2021-10-09 04:40:54 |
| 2021-10-09 04:41:54 |
| 2021-10-09 04:42:54 |
| 2021-10-09 04:43:54 |
| 2021-10-09 04:44:54 |
| 2021-10-09 04:45:54 |
| 2021-10-09 04:46:54 |
| 2021-10-09 04:47:54 |
| 2021-10-09 04:48:54 |
| 2021-10-09 04:49:54 |
| 2021-10-09 04:50:54 |
| 2021-10-09 04:51:54 |
| 2021-10-09 04:52:54 |
| 2021-10-09 04:53:54 |
| 2021-10-09 04:54:54 |
| 2021-10-09 04:55:54 |
| 2021-10-09 04:56:54 |
| 2021-10-09 04:57:54 |
| 2021-10-09 04:58:54 |
| 2021-10-09 04:59:54 |
| 2021-10-09 05:00:55 |
| 2021-10-09 05:01:56 | <---
| 2021-10-09 05:03:57 | <--- 开始间隔2分钟
+---------------------+
SELECT 24
Time: 0.088s
gaussdb@postgres> select job_id,interval,next_run_date from pg_job where job_id=15566;
+----------+------------------+---------------------+
| job_id   | interval         | next_run_date       |
|----------+------------------+---------------------|
| 15566    | sysdate + 2/1440 | 2021-10-09 05:05:57 |
+----------+------------------+---------------------+
SELECT 1
Time: 0.078s>
```

## 禁用和启用任务

禁用和启用都是同样的函数 pkg_service.job_finish，传入不同的参数表示是禁用还是启用。

```
gaussdb@postgres> select pkg_service.job_finish(15566,true,null);
+--------------+
| job_finish   |
|--------------|
|              |
+--------------+
SELECT 1
Time: 0.089s
gaussdb@postgres> select job_id,next_run_date,job_status from pg_job where job_id=15566;
+----------+---------------------+--------------+
| job_id   | next_run_date       | job_status   |
|----------+---------------------+--------------|
| 15566    | 4000-01-01 00:00:00 | d            |
+----------+---------------------+--------------+
SELECT 1
Time: 0.075s
gaussdb@postgres> select pkg_service.job_finish(15566,false,null);
+--------------+
| job_finish   |
|--------------|
|              |
+--------------+
SELECT 1
Time: 0.091s
gaussdb@postgres> select job_id,next_run_date,job_status from pg_job where job_id=15566;
+----------+---------------------+--------------+
| job_id   | next_run_date       | job_status   |
|----------+---------------------+--------------|
| 15566    | 4000-01-01 00:00:00 | s            |
+----------+---------------------+--------------+
SELECT 1
Time: 0.080s
```

可以看到如果重新启用任务的时候，没有指定下次运行时间，那么下次运行时间会始终保持在 4000 年，意味着仍然不会启动，所以如果禁用任务之后再重新启动，需要手动显式指定下次运行时间。

```
gaussdb@postgres> select pkg_service.job_finish(15566,false,sysdate);
+--------------+
| job_finish   |
|--------------|
|              |
+--------------+
SELECT 1
Time: 0.088s
gaussdb@postgres> select job_id,next_run_date,job_status from pg_job where job_id=15566;
+----------+---------------------+--------------+
| job_id   | next_run_date       | job_status   |
|----------+---------------------+--------------|
| 15566    | 2021-10-09 05:16:22 | s            |
+----------+---------------------+--------------+
SELECT 1
Time: 0.086s
```

## 删除任务

```
gaussdb@postgres> select pkg_service.job_cancel(15566);
+--------------+
| job_cancel   |
|--------------|
|              |
+--------------+
SELECT 1
Time: 0.082s
gaussdb@postgres> select job_id,next_run_date,job_status from pg_job where job_id=15566;
+----------+-----------------+--------------+
| job_id   | next_run_date   | job_status   |
|----------+-----------------+--------------|
+----------+-----------------+--------------+
SELECT 0
Time: 0.086s
gaussdb@postgres> select * from pg_catalog.pg_job_proc pjp where job_id=15566;
+----------+--------+
| job_id   | what   |
|----------+--------|
+----------+--------+
SELECT 0
Time: 0.087s
```
