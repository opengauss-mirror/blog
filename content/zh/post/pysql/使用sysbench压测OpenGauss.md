+++
title = "使用sysbench压测OpenGauss3.0"
date = "2022-05-18"
tags = ["openGauss性能测试"]
archives = "2022-05"
author = "xingchen"
summary = "openGauss性能测试基础"
img = "/zh/post/pysql/title/title1.jpg"
times = "12:30"
+++

#使用sysbench压测OpenGauss3.0

非生产正式环境，只是在虚拟机上部署完OpenGauss3.0一主一备想获取WDR报告，但是没有相关业务数据和负载，想起sysbench之前可以压测PostgreSQL，想想应该是兼容OpenGauss的，于是实验了一把。


### 服务器端环境
[omm@node115 ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Unavailable
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

    node   node_ip         port      instance                                 state
---------------------------------------------------------------------------------------------------
1  node115 192.168.205.115 26000      6001 /apps3/opengauss/install/data/dn   P Down    Manually stopped
2  node116 192.168.205.116 26000      6002 /apps3/opengauss/install/data/dn   S Down    Manually stopped


在OpenGauss数据库中新建测试用户和测试库：
openGauss=# create user benchuser WITH PASSWORD 'Bench_8899';
CREATE ROLE
openGauss=# create database sysbench owner benchuser;
CREATE DATABASE
openGauss=# GRANT ALL PRIVILEGES ON DATABASE sysbench to benchuser;
GRANT
openGauss=# GRANT ALL ON schema public TO benchuser;
GRANT

并加入访问认证：使用md5
/apps2/opengauss/install/data/dn/pg_hba.conf
新增
host    all    benchuser    192.168.205.110/32    md5


###客户端环境
IP：192.168.205.110 安装sysbench和psql客户端

[root@node110 ~]# sysbench --version
sysbench 1.0.17

[root@node110 ~]# psql -V
psql (PostgreSQL) 10.21


使用客户端测试连接OpenGauss

[root@node110 ~]# psql -h 192.168.205.115 -d sysbench -U benchuser -p 26000
psql: fe_sendauth: invalid authentication request from server: AUTH_REQ_SASL_CONT without AUTH_REQ_SASL

查阅资料：默认安装openGauss后，创建的用户和密码是采用默认密码加密password_encryption_type=2
于是按实验环境修改：
password_encryption_type = 2           
#Password storage type, 0 is md5 for PG, 1 is sha256 + md5, 2 is sha256 only
改为0

同时用户密码也更新一下：
openGauss=# alter user benchuser with password 'Bench_889';
NOTICE:  The encrypted password contains MD5 ciphertext, which is not secure.
ALTER ROLE

客户端连接正常：

[root@node110 ~]# psql -h 192.168.205.115 -d sysbench -U benchuser -p 26000
Password for user benchuser: 
psql (10.21, server 9.2.4)
SSL connection (protocol: TLSv1.2, cipher: ECDHE-RSA-AES256-GCM-SHA384, bits: 256, compression: off)
Type "help" for help.

sysbench=> 


### 准备压测数据：

sysbench  --db-driver=pgsql  --pgsql-host=192.168.205.115 --pgsql-user=benchuser  --pgsql-password=Bench_889  --pgsql-db=sysbench --pgsql-port=26000 --oltp-test-mode=complex --oltp-tables-count=12  --oltp-table-size=20000  --threads=50 --time=1800 --report-interval=10 /usr/share/sysbench/tests/include/oltp_legacy/oltp.lua prepare

执行压测：

sysbench  --db-driver=pgsql  --pgsql-host=192.168.205.115 --pgsql-user=benchuser  --pgsql-password=Bench_889  --pgsql-db=sysbench --pgsql-port=26000 --oltp-test-mode=complex --oltp-tables-count=12  --oltp-table-size=20000  --threads=50 --time=1800 --report-interval=10 /usr/share/sysbench/tests/include/oltp_legacy/oltp.lua run

后续进一步使用sysbench探索OpenGauss性能指标。


