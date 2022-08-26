+++

title = "openGauss之定时任务简单管理" 

date = "2022-08-26" 

tags = ["MogDB"] 

archives = "2022-08" 

author = "周波" 

summary = "openGauss之定时任务简单管理"

img = "/zh/post/zhoubo/title/img.png" 

times = "10:20"

+++

# openGauss之定时任务简单管理

### 零、概述

  本文主要介绍定时任务涉及到的接口函数，并对函数中重要参数做简单说明，最后通过简单的实践来演示openGauss中定时任务的简单管理，关于相关函数的详细介绍请点击如下链接：[PKG_SERVICE](https://opengauss.org/zh/docs/3.0.0/docs/Developerguide/PKG_SERVICE.html)

### 一、定时任务涉及到的函数：

#### 1、删除指定的定时任务

```
PKG_SERVICE.JOB_CANCEL(
job  IN  INTEGER);  //指定作业号
```

#### 2、禁用或启用定时任务

```
PKG_SERVICE.JOB_FINISH(
id          IN   INTEGER,
broken       IN   BOOLEAN,  //true：禁用，false:启用
next_time    IN   TIMESTAMP  DEFAULT  sysdate);  //下一次运行时间
```

#### 3、提交一个系统提供的定时任务

```
PKG_SERVICE.JOB_SUBMIT(
id            IN   BIGINT DEFAULT,
content       IN   TEXT,
next_date     IN   TIMESTAMP DEFAULT sysdate, 
interval_time IN   TEXT  DEFAULT 'null',  //默认只执行一次
job           OUT  INTEGER);
```

#### 4、修改定时任务的属性

包括任务内容、下次执行时间、执行间隔。

```
PKG_SERVICE.JOB_UPDATE(
id             IN   BIGINT,
next_time      IN   TIMESTAMP,
interval_time  IN   TEXT,
content        IN   TEXT);
```

### 二、实践操作

```
//创建一张表
openGauss=# create table test3(id int);
CREATE TABLE

//创建一个序列，用于向表test3中插入数据
openGauss=# create sequence seq2 start with 1 increment 1 nomaxvalue;
CREATE SEQUENCE

//创建一个存储过程作为定时任务的内容
openGauss=# create or replace procedure job_test
as
begin 
insert into test3 values(seq2.nextval);
end;
openGauss$# /
CREATE PROCEDURE

//获取函数或存储过程的定义,通过系统表pg_proc查看，或通过函数pg_get_functiondef(oid)查看
openGauss=# select oid from pg_proc where proname='job_test';
  oid  
-------
 16919
(1 row)

openGauss=# select * from pg_get_tabledef(16919);
ERROR:  cache lookup failed for table 16919.
openGauss=# select * from pg_get_functiondef(16919);
 headerlines |                  definition                   
-------------+-----------------------------------------------
           1 | CREATE OR REPLACE PROCEDURE public.job_test()+
             | AS  DECLARE                                  +
             | begin                                        +
             | insert into test3 values(seq2.nextval);      +
             | end;                                         +
             | /                                            +
             | 
(1 row)


//创建一个定时任务
openGauss=# select pkg_service.job_submit(1,'select job_test()',sysdate,'sysdate+1/(24*60)');
 job_submit 
------------
          1
(1 row)
//第一个参数指定定时任务的作业号，如果传入的第一个参数为null值系统会自动为其生成一个作业号。
//上面的定时任务表示一分钟执行一次。
//通过系统表pg_job可以查看当前有哪些定时任务
select * from pg_job;

//检验定时任务是否成功
//1.查看表test3中是否有数据插入
openGauss=# select * from test3;
 id 
----
  1
  2
  3
  4
(4 rows)
//2.查看日志文件
/var/log/omm/omm/pg_log/dn_6001/postgresql-2022-05-07_085229.log
随着定时任务的开启，该日志文件会变得越来越大，记得定期清理。

//让定时任务失效，第三个参数可以省略，表示作业下一次执行的时间
openGauss=# select pkg_service.job_finish(1,true);
 job_finish 
------------
 
(1 row)
//执行过后，该定时任务的job_status会变成d，next_run_date字段会变成：4000-01-01 00:00:00
openGauss=# select * from pg_job;
-[ RECORD 1 ]--------+---------------------------
job_id               | 1
current_postgres_pid | -1
log_user             | omm
priv_user            | omm
dbname               | postgres
node_name            | dn_6001
job_status           | d
start_date           | 2022-05-07 12:41:50.469699
next_run_date        | 4000-01-01 00:00:00
failure_count        | 0
interval             | sysdate+1/(24*60)
last_start_date      | 2022-05-07 12:48:54.693115
last_end_date        | 2022-05-07 12:48:54.69783
last_suc_date        | 2022-05-07 12:48:54.693115
this_run_date        | 2022-05-07 12:48:54.693115
nspname              | public
job_name             | 
end_date             | 
enable               | 
failure_msg          | 

//修改定时任务为一天执行一次，(注意：修改之前记得启动该定时任务pkg_service.job_finish)
openGauss=# select pkg_service.job_update(1,sysdate,'sysdate+1',null);
-[ RECORD 1 ]
job_update | 

//删除定时任务，（如下显示是预先在gsql客户端执行了\x元命令）
openGauss=# select pkg_service.job_cancel(1);
-[ RECORD 1 ]
job_cancel | 
```

本次实践中，设置的定时任务只是做了一个简单的工作，并不是特别的复杂。通过本次实践可以初步了解定时任务的创建、修改和删除过程。
