---
title: 'MogDB/openGauss 人工智能之趋势预测'

date: '2022-06-27'

category: 'blog'
tags: ['MogDB/openGauss 人工智能之趋势预测']

archives: '2022-06'

author: '云和恩墨'

summary: 'MogDB/openGauss 人工智能之趋势预测'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# MogDB/openGauss 人工智能之趋势预测

本文出处：[https://www.modb.pro/db/405803](https://www.modb.pro/db/405803)

### 概述

趋势预测可以实现基于历史时序数据预测未来时序变化趋势，是 dbmind 功能中的一个服务，需要依赖 Prometheus 监控框架，基于 node_exporter、opengauss_exporter 和 reprocessing_exporter 进行监控指标收集及加工处理，默认预测时间是 3600s，由参数 forecasting_future_time 控制。

### 安装部署

#### 安装 python3

需要 python3.7 以上，我目前系统自带的版本是 3.6 的，所以需要升级

```
# yum erase -y python3

--下载python3.7的包
https://www.python.org/ftp/python/3.7.13/Python-3.7.13.tgz

--解压编译
# ./configure --prefix=/opt/python3 --enable-optimizations
# make -j 8
# make install -j 8

--修改yum文件,防止yum命令不可用
vi /usr/bin/yum
#!/usr/bin/python --> #!/usr/bin/python2

--替换默认python
rm -f /usr/bin/python
ln -s /usr/local/bin/python3 /usr/bin/python
```

#### 安装依赖

```
pip3 install -r requirements-x86.txt -i https://pypi.douban.com/simple

注：默认pip3安装是访问国外的镜像源，下载比较慢，可以通过-i 指定国内的镜像源
豆瓣：https://pypi.douban.com/simple
阿里云：https://mirrors.aliyun.com/pypi/simple
```

#### 启动 prometheus

参考 [Prometheus 部署](https://www.modb.pro/db/173483)

可以使用自己部署的 opengauss_exporter，需要做好 opengauss_exporter 与 reprocessing_exporter 的指标映射关系，这里直接使用数据库自带的 exporter 做展示。

#### 启动 opengauss_exporter

```
$ gs_dbmind component opengauss_exporter --url postgresql://opengauss_exporter:opengauss_exporter123@172.16.3.90:5432/postgres --web.listen-address 172.16.3.90 --disable-https
```

#### 启动 reprocessing_exporter

```
$ gs_dbmind component reprocessing_exporter 172.16.3.90 9090 --web.listen-address 172.16.3.90 --disable-https
```

#### 设置配置文件

```
--非交互模式
$ gs_dbmind service setup -c /home/og3/forecast_conf
You are not in the interactive mode so you must modify configurations manually.
The file you need to modify is '/home/og3/forecast_conf/dbmind.conf'.
After configuring, you should continue to set up and initialize the directory with --initialize option, e.g.,
 '... service setup -c /home/og3/forecast_conf --initialize'
Configure directory '/home/og3/forecast_conf' has been created successfully.
$
$ cd /home/og3/forecast_conf
$ ls -l
total 48
-rw-rw-r--. 1 og3 dbgrp  2983 May 23 16:28 dbmind.conf
-rw-rw-r--. 1 og3 dbgrp  1215 May 19 09:42 filter_label.conf
-rw-rw-r--. 1 og3 dbgrp 36449 May 19 09:42 metric_map.conf
-rw-rw-r--. 1 og3 dbgrp  1111 May 19 09:42 metric_value_range.conf
$

--编辑dbmind.conf
[TSDB]
name = prometheus # The type of time-series database. Options: prometheus.
host = 127.16.3.90 # Address of time-series database.
port = 9090 # Port to connect to time-series database.

[METADATABASE]
dbtype = opengauss # Database type. Options: sqlite, opengauss, postgresql.
host = 127.16.3.90 # Address of meta-data database.
port = 35432 # Port to connect to meta-data database.
username = dbminder # User name to connect to meta-data database.
password = Encrypted->h3kjDWVs+WaJb53Y3iI7Pg==  # Password to connect to meta-data database.
database = dbmind # Database name to connect to meta-data database.

```

#### 初始化服务

```
$ gs_dbmind service setup --initialize -c /home/og3/forecast_conf
WARN: default PostgreSQL connector (psycopg2-binary) does not support openGauss.
It would help if you compiled psycopg2 with openGauss manually or created a connection user after setting the GUC password_encryption_type to 1.
Starting to encrypt the plain-text passwords in the config file...
Starting to initialize and check the essential variables...
Starting to connect to meta-database and create tables...
The given database has duplicate tables. If you want to reinitialize the database, press [R]. If you want to keep the existent tables, press [K].
Press [R] to reinitialize; Press [K] to keep and ignore:K
Ignoring...
The setup process finished successfully.
```

### 预测展示

#### 启动/停止 forecast 服务

```
$ gs_dbmind service start -c /home/og3/forecast_conf --only-run forecast
The process has been started.

$ gs_dbmind service stop -c /home/og3/forecast_conf
Closing the process...
Cleaning opened resources...
Closing the process...
Closing the process...
```

#### 预测查询

```
--开始结束时间是以时间戳的形式，需要在数据库或者用其他方式转换，参考如下：
select extract(epoch from '2022-05-24 09:40:10'::timestamptz);
 date_part
------------
 1653356410
(1 row)

select extract(epoch from '2022-05-24 09:43:10'::timestamptz);
 date_part
------------
 1653356590
(1 row)

--时间戳转日期
select to_timestamp(1653356590);
      to_timestamp
------------------------
 2022-05-24 09:43:10+08
(1 row)

--查看当前时间
select now();
              now
-------------------------------
 2022-05-24 08:50:06.313773+08
(1 row)

--查看预测数据
$ gs_dbmind component forecast show -c /home/og3/forecast_conf --start-time 1653356410000 --end-time 1653356590000
There may be a lot of results because you did not use all filter conditions.
Press [A] to agree, press [Q] to quit:A
+-------+-------------------------+--------------------------+---------------+--------------+
| rowid |       metric_name       |         host_ip          |  metric_time  | metric_value |
+-------+-------------------------+--------------------------+---------------+--------------+
| 10309 |       os_cpu_usage      | 172.16.3.90              | 1653356410874 |     0.13     |
| 10310 |       os_cpu_usage      | 172.16.3.90              | 1653356425874 |     0.13     |
| 10311 |       os_cpu_usage      | 172.16.3.90              | 1653356440874 |     0.12     |
| 10312 |       os_cpu_usage      | 172.16.3.90              | 1653356455874 |     0.13     |
| 10313 |       os_cpu_usage      | 172.16.3.90              | 1653356470874 |     0.13     |
| 10314 |       os_cpu_usage      | 172.16.3.90              | 1653356485874 |     0.13     |
| 10315 |       os_cpu_usage      | 172.16.3.90              | 1653356500874 |     0.12     |
| 10316 |       os_cpu_usage      | 172.16.3.90              | 1653356515874 |     0.13     |
| 10317 |       os_cpu_usage      | 172.16.3.90              | 1653356530874 |     0.14     |
| 10318 |       os_cpu_usage      | 172.16.3.90              | 1653356545874 |     0.14     |
| 10319 |       os_cpu_usage      | 172.16.3.90              | 1653356560874 |     0.12     |
| 10320 |       os_cpu_usage      | 172.16.3.90              | 1653356575874 |     0.13     |
| 10549 |       os_mem_usage      | 172.16.3.90              | 1653356410874 |     0.46     |
| 10550 |       os_mem_usage      | 172.16.3.90              | 1653356425874 |     0.46     |
| 10551 |       os_mem_usage      | 172.16.3.90              | 1653356440874 |     0.46     |
| 10552 |       os_mem_usage      | 172.16.3.90              | 1653356455874 |     0.46     |
| 10553 |       os_mem_usage      | 172.16.3.90              | 1653356470874 |     0.46     |
| 10554 |       os_mem_usage      | 172.16.3.90              | 1653356485874 |     0.46     |
| 10555 |       os_mem_usage      | 172.16.3.90              | 1653356500874 |     0.46     |
| 10556 |       os_mem_usage      | 172.16.3.90              | 1653356515874 |     0.46     |
| 10557 |       os_mem_usage      | 172.16.3.90              | 1653356530874 |     0.46     |
| 10558 |       os_mem_usage      | 172.16.3.90              | 1653356545874 |     0.46     |
| 10559 |       os_mem_usage      | 172.16.3.90              | 1653356560874 |     0.46     |
| 10560 |       os_mem_usage      | 172.16.3.90              | 1653356575874 |     0.46     |
| 10788 | gaussdb_qps_by_instance | 172.16.3.90:5432         | 1653356410874 |     8.36     |
| 10789 | gaussdb_qps_by_instance | 172.16.3.90:5432         | 1653356425874 |     7.65     |
| 10790 | gaussdb_qps_by_instance | 172.16.3.90:5432         | 1653356440874 |     6.41     |
| 10791 | gaussdb_qps_by_instance | 172.16.3.90:5432         | 1653356455874 |     6.93     |
| 10792 | gaussdb_qps_by_instance | 172.16.3.90:5432         | 1653356470874 |     8.35     |
| 10793 | gaussdb_qps_by_instance | 172.16.3.90:5432         | 1653356485874 |     7.65     |
| 10794 | gaussdb_qps_by_instance | 172.16.3.90:5432         | 1653356500874 |     6.42     |
| 10795 | gaussdb_qps_by_instance | 172.16.3.90:5432         | 1653356515874 |     6.93     |
| 10796 | gaussdb_qps_by_instance | 172.16.3.90:5432         | 1653356530874 |     8.35     |
| 10797 | gaussdb_qps_by_instance | 172.16.3.90:5432         | 1653356545874 |     7.66     |
| 10798 | gaussdb_qps_by_instance | 172.16.3.90:5432         | 1653356560874 |     6.42     |
| 10799 | gaussdb_qps_by_instance | 172.16.3.90:5432         | 1653356575874 |     6.93     |
+-------+-------------------------+--------------------------+---------------+--------------+
(36 rows)
```

#### 清理预测结果

```
$ gs_dbmind component forecast clean -c confpath --retention-days DAYS
```

### 报错汇总

```
--密码加密类型
An error occurred probably due to database operations, please check database configurations. For details:
(psycopg2.OperationalError) connection to server at "127.16.3.90", port 35432 failed: none of the server's SASL authentication mechanisms are supported

处理方式：
you compiled psycopg2 with openGauss manually or created a connection user after setting the GUC password_encryption_type to 1.
```
