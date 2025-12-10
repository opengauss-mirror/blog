---
title: 'DataKit数据迁移-1使用说明'
date: '2024-04-26'
category: 'blog'
tags: ['openGauss技术文章征集','openGauss','DataKit','数据迁移']
archives: '2024-04'
author: 'duanguoqiang'
summary: '使用DataKit进行MySQL到openGauss数据迁移教程-1'
img: ''
times: '16:40'
---

## 1 环境准备

- DataKit服务

  要求：成功加载data-migration插件

  DataKit安装教程，请参考码云仓库（`https://gitee.com/opengauss/openGauss-workbench `）

- openGauss企业版服务

  要求：可以被DataKit服务所在服务器访问

  openGauss企业版安装请参考官方社区（`https://opengauss.org/zh/ `）教程，也可使用DataKit base-ops插件的“集群安装-安装部署”功能进行安装。

- MySQL服务

  要求：可以被DataKit服务所在服务器访问

- CentOS或openEuler系统服务器

  要求：可以被DataKit服务所在服务器访问；JDK 11+环境

  用途：用于安装迁移插件（portal）

## 2 迁移前配置

### 2.1 openGauss配置

#### 2.1.1 参数配置

修改配置文件`pg_hba.conf`和`postgresql.conf`相关参数，以支持迁移过程。

配置白名单，以支持通过openGauss用户进行远程连接，配置命令如下：

```sh
-- 修改pg_hba.conf文件
gs_guc set -D <datanode> -h "host all all 0.0.0.0/0 sha256"
-- 修改postgresql.conf文件
gs_guc set -D <datanode> -c "listen_addresses = '*'"
-- 其中，“<datanode>”为数据库节点路径，请替换为实际值，如“/opt/huawei/install/data/dn”，此文档中后续此参数含义不变。
```

配置日志参数及复制权限，以支持反向迁移，配置命令如下：

```sh
-- 修改pg_hba.conf文件
gs_guc set -D <datanode> -h "host replication all 0.0.0.0/0 sha256"
-- 修改postgresql.conf文件
gs_guc set -D <datanode> -c "wal_level = logical"
```

配置完成后，重启数据库，重启命令如下：

```sh
gs_ctl restart -D <datanode>
```

#### 2.1.2 创建管理员用户

连接数据库

```sh
gsql -d postgres -p <port> -r
-- 其中，“<port>”请替换为实际端口，如“5432”，此文档中后续此参数含义不变。
```

创建用户并赋予管理员权限

```sql
create user opengauss_test with password '******';
grant all privileges to opengauss_test;
-- 其中，“opengauss_test”为用户名，可自定义，后续此文档中涉及到连接openGauss的用户，便使用此用户。
--       “******”为用户密码，可自定义。
```

## 3 执行迁移任务

请参考文档："DataKit数据迁移-2实例搭建步骤"

##  4 DataKit安装Portal教程

### 4.1 DataKit安装Portal注意事项

- root用户下安装依赖

  ```sh
  yum install mysql-devel mysql5-devel mariadb-devel python3-devel python-devel
  ```

  注：如果mysql5-devel与mariadb-devel冲突，保留一个即可。其他包如果未找到，则可忽略。

- 请确保安装用户的~/.bashrc已经配置java环境变量，并且版本满足11+。

- 安装6.0.0-RC1的portal包，并确认在线安装的安装包是否匹配对应主机架构。

  可能存在DataKit未成功获取目标执行机系统及机构信息的情况，导致在线安装给出的包是默认的centos-x86的安装包。遇到此情况，请自行前往portal仓库，下载匹配目标执行机系统及架构的安装包，然后使用datakit的portal离线安装，上传下载的安装包进行安装。

  ```sh
  # portal码云仓库地址
  https://gitee.com/opengauss/openGauss-migration-portal
  ```

- 安装目录尽量不要再用户的home目录下，即~目录下，并确保安装用户对安装目录有操作权限。因此建议使用安装用户创建目录，供安装portal使用。

- 请确保第三方工具的三个端口未被占用，如果默认端口已被占用，支持自定义端口。

### 4.2 DataKit安装Portal步骤


1. 访问Datakit服务，点击进入“数据迁移->迁移任务中心”目录下
2. 点击“创建数据迁移任务”按钮
3. 开始“选择迁移源库和目的库”步骤，分别选择源端数据库（database），选择目的端数据库（database），并点击“添加子任务”按钮。如果无数据源，点击“新增数据源”，输入所需参数进行新增。\
   添加子任务成功后，在页面下方选择对应子任务的“迁移过程模式”，支持在线模式和离线模式。离线模式：自动执行全量迁移，完成后自动结束，释放资源。 在线模式：自动执行全量迁移+增量迁移，用户手动启动反向迁移，需要用户操作结束迁移，释放资源。 \
   “选择迁移源库和目的库”配置成功，点击下一步。
4. 进入“配置迁移过程参数”步骤，可直接使用默认参数，直接点击“下一步”。
5. 进入“分配执行机资源”步骤，页面会展示所有的执行机列表信息，选择对应执行机点击“开始安装”，进入“迁移套件安装”步骤。\
   此处如果无执行机信息显示，请前往“资源中心->服务器管理”添加服务器资源，注意添加服务器时需要勾选“记住密码”，添加服务器成功后，页面会显示添加成功的服务器记录。\
   点击所需服务器记录右侧的“用户管理”，添加普通用户。至此，此服务器可作为安装portal的执行机。
6. 进行portal安装,\
   “安装用户”选择上述添加的服务器的普通用户。“安装目录”选择使用“安装用户”创建的已有目录，不建议使用默认的“安装用户”的home目录。“第三方工具配置方式”选择“本机新安装”，选择后会出现“zookeeper 端口”，“kafka 端口”，“schema_registry 端口”三条配置项，请确保配置的三个端口未被占用，如默认端口被占用，支持自定义端口。“第三方工具安装目录”使用默认的即可，支持自定义，但同样请配置到使用“安装用户”创建的目录下。\
   选择安装方式，“在线安装”是在线下载安装包，完成安装，需要确保对应的服务器网络正常。“离线安装”支持手动上传portal安装包进行安装，注意自行下载时请下载匹配对应服务器系统及架构的安装包。“导入安装”支持导入对应服务器上已安装的portal，但要求已安装的portal成功安装了所有的mysql迁移插件，否则导入安装无法成功。
7. “安装包名称”建议选用最新版本的安装包。至此“迁移套件安装”步骤配置成功，点击“确认”按钮，开始portal安装。
8. 进行portal安装时，“分配执行机资源”页面的对应执行机的“是否安装迁移套件”字段会显示为“安装中”，安装成功则显示为“已安装”。如果安装失败，可下载“安装日志”，排除故障后，点击“清理环境”，然后再次安装即可。

### 4.3 DataKit安装Portal可能出现的问题

无论遇到任何问题，请先按照“DataKit安装Portal注意事项”进行排查后，再次尝试安装。

#### 4.3.1 kafka启动失败的问题

**问题描述：**

安装portal，所有迁移工具安装成功，但是启动kafka失败，报错类似如下：

```tex
Socket server failed to bind to 10.126.28.177:9089: Cannot assign requested address
```

**问题原因：**

网络问题，使用外网ip连接服务器时，本机无法感知，导致kafka无法成功启动，修改ip为本机ip，如192.168.0.123后，停止残留的zookeeper kafka等进程，重新启动kafka，启动kafka成功。

**解决方式：**

修改了配置文件的listeners属性中的ip地址为本机ip地址，配置文件位置：`/portalpath/portal/tools/debezium/confluent-5.5.1/etc/kafka/server.properties`。修改成功后，执行如下命令重启kafka：

```sh
-- 可以先执行停止kafka的命令，确保Kafka进程已停止，避免启动时出错，停止kafka的命令如下
java -Dpath=/data/dgq/portal/portal/ -Dorder=stop_kafka -Dskip=true -jar /data/dgq/portal/portal/portalControl-6.0.0rc1-exec.jar
-- 启动kafka进程的命令
java -Dpath=/data/dgq/portal/portal/ -Dorder=start_kafka -Dskip=true -jar /data/dgq/portal/portal/portalControl-6.0.0rc1-exec.jar
```

## 5 DataKit数据迁移常见问题

### 5.1 在线模式，任务长时间卡顿在全量迁移过程中的问题

**问题描述：**

成功创建在线迁移任务后，点击启动，无前置校验失败，任务状态长时间卡顿在全量迁移进行中，页面无报错，后台full_migration.log无报错。

查看portal中对应任务workspace.id的log日志，可以看到报错类似如下：

```tex
16:56:15,851 ERROR (ThreadExceptionHandler:uncaughtException) - thread main occur excetion: 
java.lang.reflect.InvocationTargetException
	at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
	at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
	at java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
	at java.base/java.lang.reflect.Method.invoke(Method.java:566)
	at org.springframework.boot.loader.MainMethodRunner.run(MainMethodRunner.java:49)
	at org.springframework.boot.loader.Launcher.launch(Launcher.java:108)
	at org.springframework.boot.loader.Launcher.launch(Launcher.java:58)
	at org.springframework.boot.loader.JarLauncher.main(JarLauncher.java:88)
Caused by: java.lang.StringIndexOutOfBoundsException: begin 0, end -1, length 0
	at java.base/java.lang.String.checkBoundsBeginEnd(String.java:3319)
	at java.base/java.lang.String.substring(String.java:1874)
	at org.opengauss.portalcontroller.tools.mysql.IncrementalMigrationTool.changeGtidSet(IncrementalMigrationTool.java:165)
	at org.opengauss.portalcontroller.tools.mysql.IncrementalMigrationTool.findOffset(IncrementalMigrationTool.java:139)
	at org.opengauss.portalcontroller.tools.mysql.IncrementalMigrationTool.init(IncrementalMigrationTool.java:302)
	at org.opengauss.portalcontroller.task.Plan.execPlan(Plan.java:448)
	at org.opengauss.portalcontroller.PortalControl.startPlan(PortalControl.java:384)
	at org.opengauss.portalcontroller.command.mysql.StartCommandReceiver.action(StartCommandReceiver.java:41)
	at org.opengauss.portalcontroller.command.ConcreteCommand.execute(ConcreteCommand.java:24)
	at org.opengauss.portalcontroller.PortalControl.main(PortalControl.java:181)
	... 8 more
16:56:16,599 INFO  (ChangeStatusTools:reduceDiskSpace) - isReduced:false,Plan.stopPlan:false,PortalControl.status:2
16:56:18,654 INFO  (ChangeStatusTools:reduceDiskSpace) - isReduced:false,Plan.stopPlan:false,PortalControl.status:2
```

**问题原因：**

直接原因：查询openGauss的t_gtid_set为空所致

```sql
-- 查询openGauss的t_gtid_set的sql
select t_binlog_name,i_binlog_position,t_gtid_set from sch_chameleon.t_replica_batch;
```

根本原因：查询MySQL的Executed_Gtid_Set为空所致

```sql
-- 查询MySQL的Executed_Gtid_Set的sql，其中字段Executed_Gtid_Set对应的值就是Executed_Gtid_Set
SHOW MASTER STATUS;
```

**问题解决：**

设置gtid_mode=on，设置的sql如下：

```sql
-- 逐行执行如下sql语句，完成设置
SET GLOBAL ENFORCE_GTID_CONSISTENCY = ON;
SET GLOBAL gtid_mode=OFF;
SET GLOBAL gtid_mode=OFF_PERMISSIVE;
SET GLOBAL gtid_mode=ON_PERMISSIVE;
SET GLOBAL gtid_mode=ON;
```

设置完成后，通过如下sql查询是否设置成功：

```sql
-- 查询gitid_mode状态的sql语句
SHOW GLOBAL VARIABLES LIKE 'gtid_mode';
```

设置成功后，执行一条sql语句后，再次查询Executed_Gtid_Set，发现不再为空。问题解决。

### 5.2 全量校验失败的问题

**问题描述：**

成功创建迁移任务，并成功执行全量迁移，迁移校验失败，报错提示类似如下：

```tex
failed (insert=0 update=6 delete=0)If you want to repair data.please read the following files:/data/dgq/portal/portal/workspace/25/check_result/result/repair_source_db_table1_0_0.txt
```

`repair_source_db_table1_0_0.txt`中内容如下:

```sql
update `source_db`.`table1` set name='data' , col='data1'  where id=1 ;
update `source_db`.`table1` set name='data' , col='data2'  where id=2 ;
update `source_db`.`table1` set name='data' , col='data3'  where id=3 ;
update `source_db`.`table1` set name='data' , col='data4'  where id=4 ;
update `source_db`.`table1` set name='data' , col='data5'  where id=5 ;
update `source_db`.`table1` set name='data' , col='data6'  where id=6 ;
```

然而手动校验迁移后table1表中的数据，数据正确。

**问题原因：**

MySQL创建表table1时，字段`NAME`的字段名使用的是大写，建表语句如下：

```sql
CREATE TABLE table1 (
    id INT, 
    NAME VARCHAR(10), 
    col VARCHAR(20), 
    PRIMARY KEY(id)
);
```

由于，迁移到openGauss端后，迁移过程创建的table1表格的建表语句如下：

```sql
CREATE TABLE table1 (
    id integer NOT NULL,
    "NAME" character varying(10),
    col character varying(20)
)
WITH (orientation=row, compression=no);
ALTER TABLE table1 ADD CONSTRAINT pk_table1_1712058063_0 PRIMARY KEY USING btree  (id);
```

可见大写的`NAME`被双引号括起来，因此导致全量校验的时候，由于双引号的问题，导致检验时无法匹配两边的`name`字段名，导致校验无法通过。

**问题解决：**

MySQL端创建表格时，字段名使用小写，问题解决。

### 5.3 全量检验未校验，便进行下一步骤增量迁移的问题

**问题原因：** 内存不够

**问题解决：** 释放服务器内存后，再次尝试

### 5.4 增量迁移删除拥有主键的表失败的问题

**问题原因：**

对于drop table操作，当表含有关联对象是，例如视图，MySQL端可以用drop table只删除表而保留视图，openGauss端用drop table仅删除表会失败，此问题属于内核兼容性问题。因此对于MySQL端的drop table语句，openGauss端将采用drop table cascade一并删除表及其关联的对象。

因此增量迁移源端删除有关联对象的表，目标端无法删除，导致此问题的出现。

**问题解决：**

删除表格关联对象后，再删除此表。

### 5.5 增量迁移创建view失败的问题

**问题原因：**

由于增量迁移解析出的创建view的语句语法类似如下：

```sql
CREATE ALGORITHM=UNDEFINED DEFINER=`test`@`%` SQL SECURITY DEFINER VIEW `view1` AS SELECT * FROM table1;
```

由于语句中包含`@`符号，而openGauss端执行此创建view的语句，会在`@`符号处报出语法错误。因此导致失败。

**问题解决：**

通过如下命令设置openGauss的`b_compatibility_user_host_auth`参数值为`on`使其支持此语法，问题便得到解决。

```sql
set b_compatibility_user_host_auth to on;
```

**b_compatibility_user_host_auth参数说明：**

**参数说明**：控制是否允许创建`'user'@'host'`之类的用户并兼容mysql的user@host认证鉴权，对兼容mysql的user@host进行认证时，需要在配置文件postgresql.conf中设为on。

**取值范围**：布尔型

**默认值**：off

**示例**：

```sql
openGauss=# show b_compatibility_user_host_auth;
 b_compatibility_user_host_auth
--------------------------------
 off
(1 row)
```

### 5.7 反向迁移成功启动，数据反向迁移未成功的问题

**问题描述：**

创建迁移任务，无前置校验问题，成功进行全量迁移，增量迁移，数据同步后，停止增量迁移，反向迁移成功启动，在openGauss端添加数据记录，反向迁移条数仍为0，且MySQL端未成功同步数据。

**问题原因：**

openGauss数据库未开启用户复制权限的支持，即使用户的权限管理中具有复制的权限，但是数据库也需要通过修改配置文件pg_hba.conf，在文件末尾配置`host replication {用户名} 0.0.0.0/0 sha256`，如此用户才能进行复制相关操作。其中，用户名也可以换成all，以支持所有用户的复制权限。

**个人理解：**用户虽然具有复制权限，但是数据库服务不支持用户使用复制权限进行复制相关操作，因此需要开启数据库对复制权限的管理。

就比如我有从仓库拿东西的权限，所以我可以往外拿东西，但是后来仓库管理员说所有东西都不可以往外拿东西，那么即使我有往外拿东西的权限，他也不让我往外拿东西。配置的目的便是，领导告诉仓库管理员，现在可以让我往外拿东西，那么我再往外拿东西的时候，便能拿出来了。相当于用户有用户的权限管理，然后仓库管理员有仓库管理员的权限管理，两层权限都有，我才能往外拿东西。

**问题解决：**

修改配置文件pg_hba.conf，在文件末尾配置`host replication {用户名} 0.0.0.0/0 sha256`。或通过如下命令配置，命令如下：

```shell
gs_guc set -D /opt/datakit/opengauss/datanode/dn1 -h "host replication {用户名} 0.0.0.0/0 sha256"
```

配置完成后重启数据库，使配置生效，重启数据库的命令如下：

```shell
gs_ctl restart -D /opt/datakit/opengauss/datanode/dn1
```
