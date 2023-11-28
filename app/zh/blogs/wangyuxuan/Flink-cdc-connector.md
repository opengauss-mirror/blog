+++
title = "如何使用Flink连接openGauss数据库（flink-cdc-connector）"
date = "2023-11-20"
tags = ["openGauss社区开发入门","flink","cdc"]
archives = "2023-11"
author = "wangyuxuan"
summary = "如何使用Flink连接openGauss数据库（flink-cdc-connector）"
times = "15:30"
+++

## 什么是flink-cdc-connector

*本文会在最后附上代码修改的git patch*

首先简单介绍下flink，Apache Flink是由Apache软件基金会开发的开源流处理框架，其核心是用Java和Scala编写的分布式流数据流引擎。Flink以数据并行和管道方式执行任意流数据程序，Flink的流水线运行时系统可以执行批处理和流处理程序。此外，Flink的运行时本身也支持迭代算法的执行。Flink提供高吞吐量、低延迟的流数据引擎以及对事件-时间处理和状态管理的支持。Flink应用程序在发生机器故障时具有容错能力，并且支持exactly-once语义。程序可以用Java、Scala、Python和SQL等语言编写，并自动编译和优化到在集群或云环境中运行的数据流程序。

常见的场景是，flink将从事件流中获取到的数据进行计算并写入外部的存储系统中以待进一步查询分析。涉及到openGauss这类事务数据库的常见应用场景是，flink任务监听事务数据库（比如MySQL，postgreSQL）的变化数据，实时写入到分析型数据库中以便分析查询可以高效利用分析型数据库性能的同时，也获得数据的实时性。

上面的场景中提到了“变化数据”，那么如果应用如何捕获数据库的变化数据呢？这里要引入一个概念叫做change data capture（CDC）。开源项目debezium实现了大量主流数据库的CDC，虽然没有openGauss的对应实现，不过得益于openGauss对postgreSQL优秀的兼容性，我们可以在postgreSQL实现的基础进行少量修改。但是我们有了CDC后，如何把CDC接入flink呢？这就需要用到另一个项目，也是这篇文章将重点介绍的flink-cdc-connectors。

flink-cdc-connectors这个项目包括多个flink source connector，即把事务数据库作为flink source的connector，而且他依赖了debezium并做了些许修改，我们可以直接在flink-cdc-connectors修改兼容openGauss而不再需要修改debezium了。利用flink-cdc-connectors，就可以通过写SQL来让flink监听openGauss的变化数据，并实时写入ElasticSearch中加速分析查询。

看起来一切都已就绪，但是……

## 测试使用postgres-connector连接openGauss

参考[flink-cdc-connectors的postgres测试文档](https://github.com/ververica/flink-cdc-connectors/blob/master/docs/content/%E5%BF%AB%E9%80%9F%E4%B8%8A%E6%89%8B/mysql-postgres-tutorial-zh.md)，首先我们尝试直接使用openGauss来替换掉其中的postgres，看看是否会遇到问题。
测试环境的基本信息是：
```plain text
openGauss 5.0
Flink 1.17.0
flink-sql-connector-elasticsearch7 3.0.1-1.17
flink-sql-connector-mysql-cdc 2.4-SNAPSHOT (build from branch release-2.4)
flink-sql-connector-postgres-cdc 2.4-SNAPSHOT (build from branch release-2.4)
```
想在本地完成测试，需要对测试文档中flink client建表语句进行修改：
```sql
CREATE TABLE shipments (
   shipment_id INT,
   order_id INT,
   origin STRING,
   destination STRING,
   is_arrived BOOLEAN,
   PRIMARY KEY (shipment_id) NOT ENFORCED
 ) WITH (
   'connector' = 'postgres-cdc',
   'hostname' = 'localhost',
   'port' = 'YOUR_PORT',
   'username' = 'YOUR_USERNAME',
   'password' = 'YOUR_PASSWORD',
   'database-name' = 'postgres',
   'schema-name' = 'public',
   'table-name' = 'shipments',
   'slot.name' = 'your_slot_name',
   'decoding.plugin.name' = 'pgoutput',
   'debezium.publication.autocreate.mode' = 'filtered'
 );

```
主要是增加了slot.name，修改decoding.plugin.name插件为pgoutput，参考[Debezium connector for PostgreSQL](https://debezium.io/documentation/reference/stable/connectors/postgresql.html)中debezium的建议，修改publication.autocreate.mode为filtered避免权限问题。

为了使flink可以连接到openGauss，也需要修改openGauss的配置
```bash
gs_guc set -D ${PGDATA} -c "wal_level=logical"
gs_guc set -D ${PGDATA} -c "listen_addresses='*'"
gs_guc set -D ${PGDATA} -c "password_encryption_type=1"
```
给pg_hba.conf里增加(我这里的用户是gaussdb,根据实际情况修改)：
```
host    replication     gaussdb        0.0.0.0/0            sha256
host    all     all        0.0.0.0/0           sha256
```
openGauss的初始用户无法远程连接，必须新创建一个用户(我这里用户是gaussdb)：
```sql
create user gaussdb with login password "YOUR_PASSWORD";
grant all privileges to gaussdb;
```

为了方便测试，flink-sql-connector从源码的release-2.4分支编译，拷贝到flink的lib目录下后，按照文档操作，如果openGauss可以完全兼容postgres的话，我们可以得到和文档一样的结果，然而没有那么顺利。

## 问题定位

首先遇到的问题是版本判断小于postgres 9.4。对于这个问题，我们可以通过删掉版本检查的代码来绕过：
```java
// flink-connector-postgres-cdc/src/main/java/io/debezium/connector/postgresql/connection/PostgresConnection.java
    private static void validateServerVersion(Statement statement) throws SQLException {
        DatabaseMetaData metaData = statement.getConnection().getMetaData();
        int majorVersion = metaData.getDatabaseMajorVersion();
        int minorVersion = metaData.getDatabaseMinorVersion();
        if (majorVersion < 9 || (majorVersion == 9 && minorVersion < 4)) {
            // 删掉这个版本检查
            // throw new SQLException("Cannot connect to a version of Postgres lower than 9.4");
        }
    }
```
考虑到postgres和openGauss的差异，我们把jdbc的依赖也一并修改掉避免难以预料的错误：
*flink-connector-postgres-cdc/pom.xml*
```xml
 <dependency>
     <groupId>org.opengauss</groupId>
     <artifactId>opengauss-jdbc</artifactId>
     <version>5.0.0</version>
 </dependency>
```
同时修改*flink-sql-connector-postgres-cdc/pom.xml*里的shade插件增加：
```xml
<include>org.opengauss:*</include>
```
执行```mvn clean package -DskipTests```重新打包后，将postgres connector的jar包拷贝到flink的lib目录下重新测试，这次出现了新的问题，flink job的日志报错显示connector在与openGauss建立连接后没有收到openGauss返回的任何网络包：
```
(e29effdca01963c9b8c2fa1e2d1c9888_605b35e407e90cda15ad084365733fdd_0_0) switched from RUNNING to FAILED with failure cause:
io.debezium.jdbc.JdbcConnectionException: [127.0.0.1:47500/ocalhost/127.0.0.1:5432] socket is not closed; Urgent packet sent to backend successfully; An I/O error occured while sending to the backend.detail:EOF Exception; 
	at io.debezium.connector.postgresql.connection.PostgresReplicationConnection.initPublication(PostgresReplicationConnection.java:251) ~[flink-sql-connector-postgres-cdc-2.4-SNAPSHOT.jar:2.4-SNAPSHOT]
	at io.debezium.connector.postgresql.connection.PostgresReplicationConnection.createReplicationSlot(PostgresReplicationConnection.java:434) ~[flink-sql-connector-postgres-cdc-2.4-SNAPSHOT.jar:2.4-SNAPSHOT]
	at io.debezium.connector.postgresql.PostgresConnectorTask.start(PostgresConnectorTask.java:137) ~[flink-sql-connector-postgres-cdc-2.4-SNAPSHOT.jar:2.4-SNAPSHOT]
	at io.debezium.connector.common.BaseSourceTask.start(BaseSourceTask.java:133) ~[flink-sql-connector-mysql-cdc-2.4-SNAPSHOT.jar:2.4-SNAPSHOT]
	at io.debezium.embedded.EmbeddedEngine.run(EmbeddedEngine.java:760) ~[flink-sql-connector-mysql-cdc-2.4-SNAPSHOT.jar:2.4-SNAPSHOT]
	at io.debezium.embedded.ConvertingEngineBuilder$2.run(ConvertingEngineBuilder.java:192) ~[flink-sql-connector-mysql-cdc-2.4-SNAPSHOT.jar:2.4-SNAPSHOT]
	at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1128) ~[?:?]
	at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:628) ~[?:?]
	at java.lang.Thread.run(Thread.java:829) [?:?]
Caused by: org.postgresql.util.PSQLException: [127.0.0.1:47500/ocalhost/127.0.0.1:5432] socket is not closed; Urgent packet sent to backend successfully; An I/O error occured while sending to the backend.detail:EOF Exception; 
	at org.postgresql.core.v3.QueryExecutorImpl.execute(QueryExecutorImpl.java:369) ~[postgresql.jar:?]
	at org.postgresql.jdbc.PgStatement.runQueryExecutor(PgStatement.java:570) ~[postgresql.jar:?]
	at org.postgresql.jdbc.PgStatement.executeInternal(PgStatement.java:547) ~[postgresql.jar:?]
	at org.postgresql.jdbc.PgStatement.execute(PgStatement.java:405) ~[postgresql.jar:?]
	at org.postgresql.jdbc.PgStatement.executeWithFlags(PgStatement.java:347) ~[postgresql.jar:?]
	at org.postgresql.jdbc.PgStatement.executeCachedSql(PgStatement.java:333) ~[postgresql.jar:?]
	at org.postgresql.jdbc.PgStatement.executeWithFlags(PgStatement.java:310) ~[postgresql.jar:?]
	at org.postgresql.jdbc.PgStatement.executeQuery(PgStatement.java:250) ~[postgresql.jar:?]
	at io.debezium.connector.postgresql.connection.PostgresReplicationConnection.initPublication(PostgresReplicationConnection.java:182) ~[flink-sql-connector-postgres-cdc-2.4-SNAPSHOT.jar:2.4-SNAPSHOT]
	... 8 more
Caused by: java.io.EOFException: EOF Exception
	at org.postgresql.core.PGStream.receiveChar(PGStream.java:309) ~[postgresql.jar:?]
	at org.postgresql.core.v3.QueryExecutorImpl.processResults(QueryExecutorImpl.java:2401) ~[postgresql.jar:?]
	at org.postgresql.core.v3.QueryExecutorImpl.execute(QueryExecutorImpl.java:341) ~[postgresql.jar:?]
	at org.postgresql.jdbc.PgStatement.runQueryExecutor(PgStatement.java:570) ~[postgresql.jar:?]
	at org.postgresql.jdbc.PgStatement.executeInternal(PgStatement.java:547) ~[postgresql.jar:?]
	at org.postgresql.jdbc.PgStatement.execute(PgStatement.java:405) ~[postgresql.jar:?]
	at org.postgresql.jdbc.PgStatement.executeWithFlags(PgStatement.java:347) ~[postgresql.jar:?]
	at org.postgresql.jdbc.PgStatement.executeCachedSql(PgStatement.java:333) ~[postgresql.jar:?]
	at org.postgresql.jdbc.PgStatement.executeWithFlags(PgStatement.java:310) ~[postgresql.jar:?]
	at org.postgresql.jdbc.PgStatement.executeQuery(PgStatement.java:250) ~[postgresql.jar:?]
	at io.debezium.connector.postgresql.connection.PostgresReplicationConnection.initPublication(PostgresReplicationConnection.java:182) ~[flink-sql-connector-postgres-cdc-2.4-SNAPSHOT.jar:2.4-SNAPSHOT]
	... 8 more
```
而openGauss的日志(pg_logs)同样显示openGauss在建立连接后没有收到任何网络包：
```
walsender thread started
No message received from standby for maximum time
walsender thread shut down
```
双方都在等待对方发送请求，但双方都没发送任何请求，这是为什么呢？

仔细观察flink的异常栈，可以看到此时是flink发送了请求但是没有等到openGauss的返回，而openGauss显示没有收到请求。为了进一步排查openGauss究竟是否收到请求，我们修改配置
```bash
gs_guc set -D ${PGDATA} -c "log_statement = 'all'"
```
使得openGauss的日志会输出所有的SQL请求语句。再次跑测试流程，可以看到openGauss确实没有收到请求，所以我们继续调查flink这边。

看代码PostgresReplicationConnection.initPublication中，出错的代码是stmt.executeQuery(selectPublication)表示发送一个SQL请求，出错的原因是openGauss没有收到请求进而触发客户端超时。通过上面的配置我们可以在openGauss日志中看到flink的客户端ip发来了一些请求并正确处理，例如```select * from pg_replication_slots where slot_name = ? and database = ? and plugin = ?```这样的sql请求，那这些正确接收到的请求和异常栈中的请求有何不同呢？进一步阅读代码和对比日志我们可以发现，正确接收到的请求都是PostgresConnection类中发出的，其中使用的连接是debezium中的JdbcConnection，而错误的请求是PostgresReplicationConnection.initPublication发出的，使用的连接在构造时传入了replication的配置，如果我们在出错的地方同样使用JdbcConnection来发送请求会如何呢？

为此，我们需要修改PostgresReplicationConnection的构造函数，增加字段
```java
this.jdbcConnection = jdbcConnection;
```
这个jdbcConnection的生命周期是在调用构造函数的类中维护的，所以这里我们不需要close等管理他的生命周期，仅作赋值和直接使用即可。

然后在PostgresReplicationConnection.initPublication中修改获取连接的方式为：
```java
Connection conn = jdbcConnection.connection();
```
这样下面执行的SQL请求会通过JdbcConnection发送了。

重新测试，已经可以正确的在ES中查询到openGauss里的数据并实时更新了。

## 更进一步

为了支持参数'scan.incremental.snapshot.enabled' = 'true'，需要修改flink-connector-postgres-cdc/src/main/java/com/ververica/cdc/connectors/postgres/source/utils/PostgresQueryUtils.java做sql语法兼容
```diff
         // NOTE: it requires ANALYZE or VACUUM to be run first in PostgreSQL.
         final String query =
                 String.format(
-                        "SELECT reltuples::bigint FROM pg_class WHERE oid = to_regclass('%s')",
+                        "SELECT reltuples::bigint FROM pg_class WHERE oid = '%s'::regclass",
                         tableId.toString());
```
对于openGauss 3.0的版本，由于在Replicaion Connection建立后执行SQL命令，所以需要额外修改去掉pgConnection().getCatalog()避免发送sql请求
```diff
     private Set<TableId> determineCapturedTables() throws Exception {
         Set<TableId> allTableIds =
-                this.connect()
-                        .readTableNames(
-                                pgConnection().getCatalog(), null, null, new String[] {"TABLE"});
+                this.jdbcConnection.readTableNames(null, null, null, new String[] {"TABLE"});
```
如果要将openGauss作为sink端，那么还需要修改flink-connector-jdbc项目的代码并自己重新打包
branch: v3.1
flink-connector-jdbc/src/main/java/org/apache/flink/connector/jdbc/databases/postgres/dialect/PostgresDialect.java
```diff
@@ -71,14 +71,12 @@ public class PostgresDialect extends AbstractDialect {
                         .collect(Collectors.joining(", "));
         String updateClause =
                 Arrays.stream(fieldNames)
+                        .filter(s -> !uniqueColumns.contains(s))
                         .map(f -> quoteIdentifier(f) + "=EXCLUDED." + quoteIdentifier(f))
                         .collect(Collectors.joining(", "));
         return Optional.of(
                 getInsertIntoStatement(tableName, fieldNames)
-                        + " ON CONFLICT ("
-                        + uniqueColumns
-                        + ")"
-                        + " DO UPDATE SET "
+                        + " ON DUPLICATE KEY UPDATE "
                         + updateClause);
     }
```
如果要将flink-cdc-connectors中的jdbc替换为厂商提供的驱动jar包而非openGauss,无法从maven仓库拉取，那么需要修改maven的依赖为：
```xml
<dependency>
    <groupId>xxx.xxx</groupId>
    <artifactId>xxx</artifactId>
    <version>your_version</version>
    <scope>system</scope>
    <systemPath>/path/to/jdbc.jar</systemPath>
</dependency>
```
但是这样shade插件不会将类打包进connector的jar里，所以我们还需要在拷贝jar包到flink的同时把jdbc的jar包也一并拷过去。

另外，出错的Sql请求是为了创建replication slot和publication，如果我们提前手动创建好，也是可以避免这个问题而不用修改的代码
```sql
select pg_create_logical_replication_slot('your_slot_name','pgoutput');
create publication dbz_publication for all tables;
```


## 总结

经过对connector代码的修改，openGauss 3.0和5.0版本均可以作为flink的source端和sink端，融入flink的流式计算体系。

> branch: release-2.4 \
> commit: 823f5a1e21009e2e0ba36cd44ec15353e3cbcd67

```diff
commit 3d8924b37ed3d25764788b63ada1f48e00a97c4e
Author: WangYuxuan <wang.yuxuan.xinyu@foxmail.com>
Date:   Wed Aug 23 16:23:13 2023 +0800

    example commit

diff --git a/flink-connector-postgres-cdc/pom.xml b/flink-connector-postgres-cdc/pom.xml
index a9886dc8..d7637615 100644
--- a/flink-connector-postgres-cdc/pom.xml
+++ b/flink-connector-postgres-cdc/pom.xml
@@ -67,12 +67,18 @@ under the License.
             </exclusions>
         </dependency>
 
+				<!--
         <dependency>
-            <!-- fix CVE-2022-26520 https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-26520  -->
             <groupId>org.postgresql</groupId>
             <artifactId>postgresql</artifactId>
             <version>42.5.1</version>
         </dependency>
+				-->
+				<dependency>
+						<groupId>org.opengauss</groupId>
+						<artifactId>opengauss-jdbc</artifactId>
+						<version>5.0.0</version>
+				</dependency>
 
         <!-- test dependencies on Debezium -->
 
@@ -168,4 +174,4 @@ under the License.
 
     </dependencies>
 
-</project>
\ No newline at end of file
+</project>
diff --git a/flink-connector-postgres-cdc/src/main/java/com/ververica/cdc/connectors/postgres/source/utils/PostgresQueryUtils.java b/flink-connector-postgres-cdc/src/main/java/com/ververica/cdc/connectors/postgres/source/utils/PostgresQueryUtils.java
index 3d3fc996..e30443a8 100644
--- a/flink-connector-postgres-cdc/src/main/java/com/ververica/cdc/connectors/postgres/source/utils/PostgresQueryUtils.java
+++ b/flink-connector-postgres-cdc/src/main/java/com/ververica/cdc/connectors/postgres/source/utils/PostgresQueryUtils.java
@@ -67,7 +67,7 @@ public class PostgresQueryUtils {
         // NOTE: it requires ANALYZE or VACUUM to be run first in PostgreSQL.
         final String query =
                 String.format(
-                        "SELECT reltuples::bigint FROM pg_class WHERE oid = to_regclass('%s')",
+                        "SELECT reltuples::bigint FROM pg_class WHERE oid = '%s'::regclass",
                         tableId.toString());
 
         return jdbc.queryAndMap(
diff --git a/flink-connector-postgres-cdc/src/main/java/io/debezium/connector/postgresql/connection/PostgresConnection.java b/flink-connector-postgres-cdc/src/main/java/io/debezium/connector/postgresql/connection/PostgresConnection.java
index e728f3b4..1c21dfd6 100644
--- a/flink-connector-postgres-cdc/src/main/java/io/debezium/connector/postgresql/connection/PostgresConnection.java
+++ b/flink-connector-postgres-cdc/src/main/java/io/debezium/connector/postgresql/connection/PostgresConnection.java
@@ -636,7 +636,8 @@ public class PostgresConnection extends JdbcConnection {
         int majorVersion = metaData.getDatabaseMajorVersion();
         int minorVersion = metaData.getDatabaseMinorVersion();
         if (majorVersion < 9 || (majorVersion == 9 && minorVersion < 4)) {
-            throw new SQLException("Cannot connect to a version of Postgres lower than 9.4");
+            // throw new SQLException("Cannot connect to a version of Postgres lower than 9.4");
+            LOGGER.warn("wyx");
         }
     }
 
diff --git a/flink-connector-postgres-cdc/src/main/java/io/debezium/connector/postgresql/connection/PostgresReplicationConnection.java b/flink-connector-postgres-cdc/src/main/java/io/debezium/connector/postgresql/connection/PostgresReplicationConnection.java
index 364cb59b..eeb6a4e8 100644
--- a/flink-connector-postgres-cdc/src/main/java/io/debezium/connector/postgresql/connection/PostgresReplicationConnection.java
+++ b/flink-connector-postgres-cdc/src/main/java/io/debezium/connector/postgresql/connection/PostgresReplicationConnection.java
@@ -74,6 +74,7 @@ public class PostgresReplicationConnection extends JdbcConnection implements Rep
     private final MessageDecoder messageDecoder;
     private final TypeRegistry typeRegistry;
     private final Properties streamParams;
+    private final PostgresConnection jdbcConnection;
 
     private Lsn defaultStartingPos;
     private SlotCreationResult slotCreationInfo;
@@ -136,6 +137,7 @@ public class PostgresReplicationConnection extends JdbcConnection implements Rep
         this.statusUpdateInterval = statusUpdateInterval;
         this.messageDecoder =
                 plugin.messageDecoder(new MessageDecoderContext(config, schema), jdbcConnection);
+        this.jdbcConnection = jdbcConnection;
         this.typeRegistry = typeRegistry;
         this.streamParams = streamParams;
         this.slotCreationInfo = null;
@@ -171,7 +173,7 @@ public class PostgresReplicationConnection extends JdbcConnection implements Rep
             LOGGER.info("Initializing PgOutput logical decoder publication");
             try {
                 // Unless the autocommit is disabled the SELECT publication query will stay running
-                Connection conn = pgConnection();
+                Connection conn = jdbcConnection.connection();
                 conn.setAutoCommit(false);
 
                 String selectPublication =
@@ -255,9 +257,7 @@ public class PostgresReplicationConnection extends JdbcConnection implements Rep
 
     private Set<TableId> determineCapturedTables() throws Exception {
         Set<TableId> allTableIds =
-                this.connect()
-                        .readTableNames(
-                                pgConnection().getCatalog(), null, null, new String[] {"TABLE"});
+                this.jdbcConnection.readTableNames(null, null, null, new String[] {"TABLE"});
 
         Set<TableId> capturedTables = new HashSet<>();
 
diff --git a/flink-sql-connector-postgres-cdc/pom.xml b/flink-sql-connector-postgres-cdc/pom.xml
index 8beb8bc6..c8974e0e 100644
--- a/flink-sql-connector-postgres-cdc/pom.xml
+++ b/flink-sql-connector-postgres-cdc/pom.xml
@@ -65,6 +65,7 @@ under the License.
                                     <include>com.fasterxml.*:*</include>
                                     <!--  Include fixed version 30.1.1-jre-14.0 of flink shaded guava  -->
                                     <include>org.apache.flink:flink-shaded-guava</include>
+                                    <include>org.opengauss:*</include>
                                 </includes>
                             </artifactSet>
                             <filters>
@@ -107,4 +108,4 @@ under the License.
             </plugin>
         </plugins>
     </build>
-</project>
\ No newline at end of file
+</project>

```
