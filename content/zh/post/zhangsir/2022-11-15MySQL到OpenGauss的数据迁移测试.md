+++
title = "MySQL到OpenGauss的数据迁移测试"

date = "2022-11-15"

tags = ["openGauss技术文章征集"]

archives = "2022-11"

author = "zhangsir"

summary = "MySQL到OpenGauss的数据迁移测试"

times = "16:20"

+++

前言
       本文将测试利用chameleon工具从MySQL迁移数据到OpenGauss3.1.0。

环境
| 环境信息 | MYSQL          | OpenGauss    |
|------|----------------|--------------|
| 版本   | 5.7.36         | 3.1.0        |
| 系统版本 | docker19.03.15 | Centos 7.9   |
| IP   | 192.168.10.5   | 192.168.10.3 |



工具安装

1、下载chameleon工具

======》我只找到了源码安装包，没找到wheel的版本

2、解压/安装依赖包

解压：[root@opengauss01 /]# unzip openGauss-tools-chameleon-master.zip

创建python虚拟环境并激活

安装

(venv) [root@opengauss01 openGauss-tools-chameleon-master]# python3 setup.py install

如果缺包就挨个安装下：

(venv) [root@opengauss01 openGauss-tools-chameleon-master]# pip3 install geomet argparse daemonize mysql-replication py-opengauss PyYAML rollbar tabulate

注意需要安装：

(venv) [root@opengauss01 openGauss-tools-chameleon-master]# pip3 install PyMySQL==0.10.0

3、创建迁移配置文件

(venv) [root@opengauss01 openGauss-tools-chameleon-master]# su - omm

上一次登录：二 11月  8 22:39:38 CST 2022pts/0 上

[omm@opengauss01 ~]$ cd /openGauss-tools-chameleon-master/

[omm@opengauss01 openGauss-tools-chameleon-master]$ source venv/bin/activate

(venv) [omm@opengauss01 openGauss-tools-chameleon-master]$ chameleon set_configuration_files

creating directory /home/omm/.pg_chameleon

creating directory /home/omm/.pg_chameleon/configuration/

creating directory /home/omm/.pg_chameleon/logs/

creating directory /home/omm/.pg_chameleon/pid/

copying configuration  example in /home/omm/.pg_chameleon/configuration//config-example.yml

3、修改配置文件

(venv) [omm@opengauss01 configuration]$ cp config-example.yml default.yml 
vim default.yml
pg_conn:
  host: "localhost"                ===========》opengauss的ip
  port: "15400"                  ===========》opengauss的端口
  user: "opengauss"               ========== 》open gauss的用户
  password: "openGauss01"        ===========》opengauss的密码
  database: "mysql_test"           ===========》opengauss的目标数据库
  charset: "utf8"

sources:
  mysql:
    readers: 4
    writers: 4
    db_conn:
      host: "192.168.10.5"        ============》mysql的ip
      port: "33650"              ===========》mysql的端口
      user: "root"               ============》mysql的用户
      password: "root"           ============》mysql的密码
      charset: 'utf8'
      connect_timeout: 10
      schema_mappings:
      test: sch_mysql_database    ================》test是mysql中的库，sch_mysql_database====》是opengauss中的库

4、初始化迁移

(venv) [omm@opengauss01 configuration]$ chameleon create_replica_schema --config default

(venv) [omm@opengauss01 configuration]$ chameleon add_source --config default --source mysql

5、复制存量数据

(venv) [omm@opengauss01 configuration]$ chameleon init_replica --config default --source mysql

Init replica process for source mysql started.

=======》MySQL数据库test中的表：

mysql> use test
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed

mysql> show tables;
+----------------+
| Tables_in_test |
+----------------+
| big_table      |
| checksums      |
| hahaha         |
| test           |
| test1          |
| test2          |
+----------------+
6 rows in set (0.00 sec)

======》复制启动后，test库中的表都复制到sch_mysql_database下了。
  Name        |   Owner   
--------------------+-----------
 blockchain         | omm
 cstore             | omm
 db4ai              | omm
 dbe_perf           | omm
 dbe_pldebugger     | omm
 dbe_pldeveloper    | omm
 dbe_sql_util       | omm
 loxodonta_africana | opengauss
 pkg_service        | omm
 public             | omm
 sch_chameleon      | opengauss
 sch_mysql_database | opengauss
 snapshot           | omm
 sqladvisor         | omm
(14 rows)

mysql_test=# set current_schema to sch_mysql_database

mysql_test-# ;
SET
mysql_test=# \d
                                        List of relations
       Schema       |       Name       |   Type   |   Owner   |             Storage              
--------------------+------------------+----------+-----------+----------------------------------
 sch_mysql_database | big_table        | table    | opengauss | {orientation=row,compression=no}
 sch_mysql_database | big_table_id_seq | sequence | opengauss | 
 sch_mysql_database | checksums        | table    | opengauss | {orientation=row,compression=no}
 sch_mysql_database | test             | table    | opengauss | {orientation=row,compression=no}
 sch_mysql_database | test1            | table    | opengauss | {orientation=row,compression=no}
 sch_mysql_database | test1_id_seq     | sequence | opengauss | 
 sch_mysql_database | test2            | table    | opengauss | {orientation=row,compression=no}
 sch_mysql_database | test2_id_seq     | sequence | opengauss |

6、开启实时复制

(venv) [omm@opengauss01 configuration]$ chameleon start_replica --config default --source mysql

Starting the replica process for source mysql

7、在mysql中插入数据

Mysql中的数据

mysql> select * from test;
+----+--------+
| id | name   |
+----+--------+
|  2 | bbbb   |
|  5 | cccc   |
|  4 | dddd   |
|  3 | eeee   |
|  1 | hehehe |
+----+--------+
5 rows in set (0.00 sec)

Opengauss中的数据

mysql_test=# select * from test;
 id |  name  
----+--------
  2 | bbbb
  5 | cccc
  4 | dddd
  3 | eeee
  1 | hehehe
(5 rows)

Mysql中插入一条数据：

mysql> insert into test values(6,'fffff');
Query OK, 1 row affected (0.01 sec)

mysql> select * from test;
+----+--------+
| id | name   |
+----+--------+
|  2 | bbbb   |
|  5 | cccc   |
|  4 | dddd   |
|  3 | eeee   |
|  6 | fffff  |
|  1 | hehehe |
+----+--------+
6 rows in set (0.00 sec)

Opengauss中查看数据，可以看到新插入的（6，'fffff'）已经同步到了openGauss中。

mysql_test=# select * from test;
 id |  name  
----+--------
  2 | bbbb
  5 | cccc
  4 | dddd
  3 | eeee
  1 | hehehe
  6 | fffff
(6 rows)