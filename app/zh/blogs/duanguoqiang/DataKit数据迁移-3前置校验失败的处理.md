---
title: 'DataKit数据迁移-3前置校验失败的处理'
date: '2024-04-26'
category: 'blog'
tags: ['openGauss技术文章征集','openGauss','DataKit','数据迁移']
archives: '2024-04'
author: 'duanguoqiang'
summary: '使用DataKit进行MySQL到openGauss数据迁移教程-3'
img: ''
times: '16:40'
---

## 前置校验项目及不通过的处理

### 1、Kafka服务可用性检查：

>使用jps在portal执行机上执行查看，保证以下三个服务进程存在
>
>```sh
>[test@dev-openeuler-arm ~]$ jps
>3757401 SchemaRegistryMain
>3757072 SupportedKafka
>3756341 QuorumPeerMain
>```
>
>如果在portal以正常安装的情况下，三个服务进程异常终止，可使用如下命令启动三个服务进程。
>
>```shell
>-- 可以先执行停止kafka的命令，确保Kafka进程已停止，避免启动时出错，停止kafka的命令如下
>java -Dpath=/{portal_path}/portal/ -Dorder=stop_kafka -Dskip=true -jar /{portal_path}/portal/portalControl-*-exec.jar
>
>-- 启动kafka进程的命令
>java -Dpath=/{portal_path}/portal/ -Dorder=start_kafka -Dskip=true -jar /{portal_path}/portal/portalControl-*-exec.jar
>
>-- 出现类似如下日志信息，表示启动kafka成功
>```
>
>```tex
>log4j: reset attribute= "false".
>log4j: Threshold ="null".
>log4j: Level value for root is  [debug].
>log4j: root level set to DEBUG
>log4j: Class name: [org.apache.log4j.ConsoleAppender]
>log4j: Parsing layout of class: "org.apache.log4j.PatternLayout"
>log4j: Setting property [conversionPattern] to [%d{HH:mm:ss,SS} %-5p (%C{1}:%M) - %m%n].
>log4j: Setting property [levelMin] to [INFO].
>log4j: Setting property [levelMax] to [ERROR].
>log4j: Setting property [acceptOnMatch] to [true].
>log4j: Adding filter of type [class org.apache.log4j.varia.LevelRangeFilter] to appender named [log.console].
>log4j: Adding appender named [log.console] to category [root].
>log4j: Class name: [org.apache.log4j.DailyRollingFileAppender]
>log4j: Setting property [file] to [/data/test/portal/portal//logs/portal_.log].
>log4j: Setting property [append] to [true].
>log4j: Setting property [datePattern] to [yyyy-MM-dd].
>log4j: Parsing layout of class: "org.apache.log4j.PatternLayout"
>log4j: Setting property [conversionPattern] to [%d{HH:mm:ss,SS} %-5p (%C{1}:%M) - %m%n].
>log4j: Setting property [levelMin] to [INFO].
>log4j: Setting property [levelMax] to [ERROR].
>log4j: Setting property [acceptOnMatch] to [true].
>log4j: Adding filter of type [class org.apache.log4j.varia.LevelRangeFilter] to appender named [log.file].
>log4j: setFile called: /data/test/portal/portal//logs/portal_.log, true
>log4j: setFile ended
>log4j: Appender [log.file] to be rolled at midnight.
>log4j: Adding appender named [log.file] to category [root].
>19:35:00,492 INFO  (ParamsUtils:initMigrationParamsFromProps) - properties = {awt.toolkit=sun.awt.X11.XToolkit, java.specification.version=11, sun.cpu.isalist=, sun.jnu.encoding=UTF-8, java.class.path=/data/test/portal/portal/portalControl-6.0.0rc1-exec.jar, java.vm.vendor=BiSheng, sun.arch.data.model=64, path=/data/test/portal/portal/, java.vendor.url=https://gitee.com/openeuler/bishengjdk-11/, user.timezone=Asia/Shanghai, os.name=Linux, java.vm.specification.version=11, sun.java.launcher=SUN_STANDARD, user.country=US, order=start_kafka, sun.boot.library.path=/data/test/env/java/bisheng-jdk-11.0.20/lib, sun.java.command=/data/test/portal/portal/portalControl-6.0.0rc1-exec.jar, jdk.debug=release, sun.cpu.endian=little, user.home=/home/test, user.language=en, java.specification.vendor=Oracle Corporation, java.version.date=2023-07-18, java.home=/data/test/env/java/bisheng-jdk-11.0.20, file.separator=/, java.vm.compressedOopsMode=Zero based, line.separator=
>, java.specification.name=Java Platform API Specification, java.vm.specification.vendor=Oracle Corporation, java.awt.graphicsenv=sun.awt.X11GraphicsEnvironment, java.protocol.handler.pkgs=org.springframework.boot.loader, sun.management.compiler=HotSpot 64-Bit Tiered Compilers, java.runtime.version=11.0.20+11, user.name=test, skip=true, path.separator=:, os.version=4.19.90-2110.8.0.0119.oe1.aarch64, java.runtime.name=OpenJDK Runtime Environment, file.encoding=UTF-8, java.vm.name=OpenJDK 64-Bit Server VM, java.vendor.version=BiSheng, java.vendor.url.bug=https://gitee.com/openeuler/bishengjdk-11/issues/, java.io.tmpdir=/tmp, java.version=11.0.20, user.dir=/data/test/portal, os.arch=aarch64, java.vm.specification.name=Java Virtual Machine Specification, java.awt.printerjob=sun.print.PSPrinterJob, sun.os.patch.level=unknown, java.library.path=/data/test/portal/portal/tools/chameleon/chameleon-6.0.0rc1:/data/test/portal/portal/tools/chameleon/chameleon-5.1.1:/data/test/portal/portal/tools/chameleon/chameleon-6.0.0rc1:/data/test/portal/portal/tools/chameleon/chameleon-6.0.0rc1:/data/test/portal/portal/tools/chameleon/chameleon-6.0.0rc1:/data/test/portal/portal/tools/chameleon/chameleon-6.0.0:/data/xz_u2/base/opt/huawei/install/om/lib:/data/xz_u2/base/opt/huawei/install/om/script/gspylib/clib::/usr/java/packages/lib:/lib:/usr/lib:/usr/lib64:/lib64, java.vm.info=mixed mode, java.vendor=BiSheng, java.vm.version=11.0.20+11, java.specification.maintenance.version=2, sun.io.unicode.encoding=UnicodeLittle, java.class.version=55.0}
>19:35:00,567 INFO  (MigrationConfluentInstanceConfig:getSystemParamAndParseEntity) - get MigrationConfluentInstanceConfig from system param = MigrationConfluentInstanceConfig(id=null, zookeeperPort=null, kafkaPort=null, zkIp=null, kafkaIp=null, installDir=null, bindPortalId=null, zkIpPort=null, kafkaIpPort=null, schemaRegistryIpPort=null, schemaRegistryIp=null, schemaRegistryPort=null, bindPortalHost=null, thirdPartySoftwareConfigType=null)
>19:35:00,569 INFO  (KafkaUtils:changeConfluentDirFromSysParam) - no need change param
>19:35:00,576 INFO  (FileUtils:createFile) - File /data/test/portal/portal/portal.portId.lock already exists.
>19:35:00,587 INFO  (FileUtils:createFile) - File /data/test/portal/portal/workspace/1 already exists.
>19:35:00,587 INFO  (FileUtils:createFile) - File /data/test/portal/portal/workspace/1/tmp/ already exists.
>19:35:00,592 INFO  (FileUtils:createFile) - File /data/test/portal/portal/workspace/1/logs already exists.
>19:35:00,631 INFO  (FileUtils:createFile) - File /data/test/portal/portal/workspace/1/status/ already exists.
>19:35:00,632 INFO  (FileUtils:createFile) - File /data/test/portal/portal/workspace/1/status/incremental/ already exists.
>19:35:00,632 INFO  (FileUtils:createFile) - File /data/test/portal/portal/workspace/1/status/portal.txt already exists.
>19:35:00,632 INFO  (FileUtils:createFile) - File /data/test/portal/portal/workspace/1/status/full_migration.txt already exists.
>19:35:00,632 INFO  (FileUtils:createFile) - File /data/test/portal/portal/workspace/1/status/incremental_migration.txt already exists.
>19:35:00,632 INFO  (FileUtils:createFile) - File /data/test/portal/portal/workspace/1/status/reverse_migration.txt already exists.
>19:35:00,632 INFO  (FileUtils:createFile) - File /data/test/portal/portal/workspace/1/logs/debezium/ already exists.
>19:35:00,633 INFO  (FileUtils:createFile) - File /data/test/portal/portal/workspace/1/logs/datacheck/ already exists.
>19:35:00,650 INFO  (ParamsUtils:changeDatacheckLogLevel) - global log level param is empty
>19:35:00,796 INFO  (MigrationConfluentInstanceConfig:getSystemParamAndParseEntity) - get MigrationConfluentInstanceConfig from system param = MigrationConfluentInstanceConfig(id=null, zookeeperPort=null, kafkaPort=null, zkIp=null, kafkaIp=null, installDir=null, bindPortalId=null, zkIpPort=null, kafkaIpPort=null, schemaRegistryIpPort=null, schemaRegistryIp=null, schemaRegistryPort=null, bindPortalHost=null, thirdPartySoftwareConfigType=null)
>19:35:00,851 INFO  (RuntimeExecUtils:executeStartOrder) - start command = /data/test/portal//portal/tools/debezium/confluent-5.5.1/bin/zookeeper-server-start -daemon /data/test/portal//portal/tools/debezium/confluent-5.5.1/etc/kafka/zookeeper.properties
>19:35:00,938 INFO  (RuntimeExecUtils:executeStartOrder) - Start zookeeper.
>19:35:02,964 INFO  (MqTool:start) - kafkaOrder====/data/test/portal//portal/tools/debezium/confluent-5.5.1/bin/kafka-topics --list --bootstrap-server 192.168.0.118:9092
>19:35:03,07 INFO  (RuntimeExecUtils:executeStartOrder) - start command = /data/test/portal//portal/tools/debezium/confluent-5.5.1/bin/kafka-server-start -daemon /data/test/portal//portal/tools/debezium/confluent-5.5.1/etc/kafka/server.properties
>19:35:03,93 INFO  (RuntimeExecUtils:executeStartOrder) - Start kafka.
>19:35:05,102 INFO  (RuntimeExecUtils:removeFile) - Remove file /data/test/portal/portal/tmp/test_.txt finished.
>19:35:07,108 INFO  (RuntimeExecUtils:removeFile) - Remove file /data/test/portal/portal/tmp/test_.txt finished.
>19:35:07,174 INFO  (RuntimeExecUtils:executeStartOrder) - start command = /data/test/portal//portal/tools/debezium/confluent-5.5.1/bin/schema-registry-start -daemon /data/test/portal//portal/tools/debezium/confluent-5.5.1/etc/schema-registry/schema-registry.properties
>19:35:07,181 INFO  (RuntimeExecUtils:executeStartOrder) - Start kafka schema registry.
>19:35:10,281 INFO  (MqTool:start) - Start kafka success.
>```

### 2、检查源端和目标端数据库是否可连接

>MySQL: mysql -h ip -P port -u user -ppassword -S /~/mysql.sock\
>OpenGauss: gsql -r -d database -p port -U user -W password

### 3、权限检查

**Mysql连接用户权限要求**如下：

为确认数据的顺利迁移，源端数据库（Mysql）的数据源添加时，请按照迁移需要添加所需权限，也可以直接给all权限；

1）全量迁移： select 、reload、 lock tables 、replication client

2）增量迁移： select 、replication client 、replication slave

3）反向迁移： select 、update 、insert 、delete

查询和修改用户权限的命令如下，如果连接用户权限不满足，请修改对应权限值。

```sql
-- 查询用户权限的命令
SELECT * FROM mysql.user WHERE USER = '{用户名}';
-- 修改用户权限的命令语法格式如下，其中privileges：用户的操作权限，如SELECT，INSERT，UPDATE等，如果要授予所的权限则使用ALL；databasename：数据库名；tablename：表名，如果要授予该用户对所有数据库和表的相应操作权限则可用*表示，如*.*。
GRANT privileges ON databasename.tablename TO '{用户名}';
-- 赋予用户全量迁移权限的命令
GRANT SELECT, RELOAD, LOCK TABLES, REPLICATION CLIENT ON *.* TO '{用户名}';
-- 赋予用户增量迁移权限的命令
GRANT SELECT, REPLICATION CLIENT, REPLICATION SLAVE ON *.* TO '{用户名}';
-- 赋予用户反向迁移权限的命令
GRANT SELECT, UPDATE, INSERT, DELETE ON *.* TO '{用户名}';
-- 赋予所有权限的命令
GRANT ALL ON *.* TO '{用户名}';
-- 在赋权后，确保刷新权限以使更改生效
FLUSH PRIVILEGES;
```

**openGauss连接用户权限要求**如下：

通过Datakit平台安装的目标端数据库（openGauss）可以直接迁移，导入的数据库以及在创建任务时添加的自定义openGauss数据源，需要提前将用户权限改为SYSADMIN角色；


>反向迁移需要将rolreplication设置为true
>
>```sql
>-- 首先使用连接用户连接openGauss
>-- 查询rolreplication权限的命令
>select rolreplication from pg_roles;
>-- 修改权限的命令
>alter role '{用户名}' replication;
>```

修改openGauss用户权限的方式如下：

*方式一：（推荐，符合最小权限）*

```shell
#给要迁移的目标库target_source赋all权限给迁移用户openGauss_test
grant all on database target_source to openGauss_test;
```

*方式二：（不推荐）*

```shell
#修改用户角色为SYSADMIN
alter user {用户名} SYSADMIN;
#查询用户角色，字段值为t时说明具有sysadmin角色，f时则没有
select rolsystemadmin from PG_ROLES where rolname='{用户名}';
```

> 有sysadmin角色权限：查询结果为t；

> 无sysadmin角色权限：查询结果为f；

### 4、日志参数检查

*增量迁移时，源数据库Mysql需要开启复制功能，在配置中增加以下配置参数，并重启*

> log_bin=ON
>
> binlog_format= ROW
>
> binlog_row_image=FULL

查询参数值是否设置成功的命令如下：

```sql
SHOW VARIABLES LIKE 'log_bin';
SHOW VARIABLES LIKE 'binlog_format';
SHOW VARIABLES LIKE 'binlog_row_image';
```

*反向迁移时，需要在openGauss数据库增加如下配置，并重启*

> 调整pg_hba.conf以允许复制
>
> ```sql
> -- 根据连接用户和实际网络配置命令
> gs_guc set -D /opt/datakit/opengauss/datanode/dn1 -h "host replication {connected username} {ip/port} sha256"
> -- 直接允许所有用户和网络配置命令
> gs_guc set -D /opt/datakit/opengauss/datanode/dn1 -h "host replication all 0.0.0.0/0 sha256"
> ```
>
> 调整日志参数wal_level的命令：
>
> ```sql
> -- 修改参数的sql语句
> alter system set wal_level to logical;
> -- 或直接修改配置文件中的参数，其中“/opt/datakit/opengauss/datanode/dn1”为实际数据库节点目录
> gs_guc set -D /opt/datakit/opengauss/datanode/dn1 -c "wal_level = logical"
> ```

查询日志参数wal_level是否设置成功的命令如下：

```sql
-- 查询是否允许复制的参数，为1表示设置成功
select rolreplication from pg_roles where rolname='{用户名}'
-- 查询wal_level参数
show variables like 'wal_level';
```

### 5、大小写参数检查

需确保Mysql和OpenGauss的大小写参数一致，查询大小写参数的命令如下：

```sql
-- 查询Mysql的大小写参数
show variables like 'lower_case_table_names';
-- 查询openGauss的大小写参数
show dolphin.lower_case_table_names;
```

修改大小写参数，使两者保持一致，修改方式如下：

修改Mysql的大小写参数

```tex
更改数据库参数文件my.cnf
在mysqld下添加或修改 lower_case_table_names = 1 之后重启数据库
```

修改openGauss的大小写参数

```sql
alter user {用户名} set dolphin.lower_case_table_names to 0;
```

### 6、磁盘空间校验

迁移过程中会产生一些临时文件，需要占用一定的磁盘空间，要求磁盘满足---源端单表的最大数据量。

### 7、B库校验

迁移的目标数据库要求是B库，查询是否为B库的命令如下：

```sql
show sql_compatibility;
```

创建B库的命令

```sql
create database {dbname} with dbcompatibility = 'b';
```

### 8、Mysql加密方式校验

查询系统默认加密方式的命令

```sql
select @@default_authentication_plugin;
```

修改系统默认加密方式

```tex
更改数据库参数文件my.cnf
在mysqld下添加或修改 default-authentication-plugin=mysql_native_password 之后重启数据库
```

同时修改连接用户的加密方式为mysql_native_password，修改的sql语句如下：

```sql
ALTER USER '用户名'@'%' IDENTIFIED WITH mysql_native_password BY '新密码';
```

### 9、复制参数校验

启动反向迁移会占用逻辑复制槽位，需要确保openGauss有可使用的槽位。

```sql
-- 查询当前使用的槽位
select count(*) from pg_get_replication_slots();
-- 查询系统最大槽位
show max_replication_slots;
```

槽位很少出现被占满的情况，如若被占满，通过如下操作删除无用槽位。

```sql
-- 获取当前复制槽列表
select * from pg_get_replication_slots();
-- 删除流复制槽，其中slot_name为流复制槽名称
select pg_drop_replication_slot('slot_name');
```

获取复制槽列表的示例如下：

```sql
openGauss=# select * from pg_get_replication_slots();
 slot_name |     plugin     | slot_type | datoid | active | xmin | catalog_xmin | restart_lsn | dummy_standby | confirmed_flush
-----------+----------------+-----------+--------+--------+------+--------------+-------------+---------------+-----------------
 dn_s1     |                | physical  |      0 | t      |      |              | 0/23DB14E0  | f             |
 slot1     | mppdb_decoding | logical   |  16304 | f      |      |        60966 | 0/1AFA1BB0  | f             | 0/23DA5700
(2 rows)
```

**注：**

逻辑复制槽的占用会在增量迁移停止后创建，如果此时结束迁移任务，就会有槽位占用的残留。而如果正常进行反向迁移，然后停止迁移任务，则会自动删除占用的槽位。

可以将portal的`migrationConfig.properties`配置文件中的`drop.logical.slot.on.stop`参数设置为`true`，以保证迁移任务结束时，自动删除占用的槽位。

进一步学习，请参考openGauss社区，社区地址：https://opengauss.org/zh/。

10、迁移过程中，请勿关闭源数据库或目标数据库；

11、执行迁移任务的服务器应具备一定的性能和配置，以保证迁移过程的顺利执行；

12、迁移任务是在非root用户下执行，任务的执行机器来源于平台资源中心的设备管理，因此需要在设备管理的用户管理中添加非root用户。