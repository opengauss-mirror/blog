---
title: 'Debezium Adapt openGauss'

date: '2020-12-25'

category: 'blog'
tags: ['openGauss安装部署']

archives: '2020-12'

author: '李宏达'

summary: 'Debezium Adapt openGauss'

img: '/zh/blogs/lihongda/title/img39.png'

times: '10:30'
---

# Debezium Adapt openGauss<a name="ZH-CN_TOPIC_0000001072732649"></a>

## What is Debezium<a name="section19607161914544"></a>

Debezium is a set of distributed services to capture changes in your databases so that your applications can see those changes and respond to them. Debezium records all row-level changes within each database table in a change event stream, and applications simply read these streams to see the change events in the same order in which they occurred.

## Introduction to Debezium<a name="section9540164411549"></a>

Debezium is a distributed platform that turns your existing databases into event streams, so applications can see and respond immediately to each row-level change in the databases.

Debezium is built on top of Apache Kafka and provides Kafka Connect compatible connectors that monitor specific database management systems. Debezium records the history of data changes in Kafka logs, from where your application consumes them. This makes it possible for your application to easily consume all of the events correctly and completely. Even if your application stops unexpectedly, it will not miss anything: when the application restarts, it will resume consuming the events where it left off.

Debezium includes multiple connectors.

- MongoDB
- MySQL
- PostgreSQL
- SQL Server
- Oracle \(Incubating\)
- Db2 \(Incubating\)
- Cassandra \(Incubating\)
- Vitess \(Incubating\)

## Debezium Features<a name="section12435181635510"></a>

Debezium is a set of source connectors for Apache Kafka Connect. Each connector ingests changes from a different database by using that database’s features for change data capture \(CDC\). Unlike other approaches, such as polling or dual writes, log-based CDC as implemented by Debezium:

- Ensures that all data changes are captured.
- Produces change events with a very low delay while avoiding increased CPU usage required for frequent polling. For example, for MySQL or PostgreSQL, the delay is in the millisecond range.
- Requires no changes to your data model, such as a “Last Updated” column.
- Can capture deletes.
- Can capture old record state and additional metadata such as transaction ID and causing query, depending on the database’s capabilities and configuration.

Five Advantages of Log-Based Change Data Capture is a blog post that provides more details.

Debezium connectors capture data changes with a range of related capabilities and options:

- Snapshots: optionally, an initial snapshot of a database’s current state can be taken if a connector is started and not all logs still exist. Typically, this is the case when the database has been running for some time and has discarded trannsaction logs that are no longer needed for transaction recovery or replication. There are different modes for performing snapshots. See the documentation for the connector that you are using.
- Filters: you can configure the set of captured schemas, tables and columns with include/exclude list filters.
- Masking: the values from specific columns can be masked, for example, when they contain sensitive data.
- Monitoring: most connectors can be monitored by using JMX.
- Ready-to-use message transformations for:
  - Message routing
  - Content-based routing
  - Extraction of new record state for relational connectors and for the MongoDB connector
  - Filtering
  - Routing of events from a transactional outbox table

## Adapt openGauss<a name="section1234417185610"></a>

**openGauss, postgreSQL, wal2json 的关系**

- openGauss 是一款开源关系型数据库管理系统，采用木兰宽松许可证 v2 发行。openGauss 内核源自 PostgreSQL，同时 openGauss 也是一个开源的数据库平台，鼓励社区贡献、合作。
- PostgreSQL 是一种特性非常齐全的自由软件的对象-关系型数据库管理系统（ORDBMS），是以加州大学计算机系开发的 POSTGRES，4.2 版本为基础的对象关系型数据库管理系统。另外，因为许可证的灵活，任何人都可以以任何目的免费使用、修改和分发 PostgreSQL。
- wal2json is an output plugin for logical decoding. It means that the plugin have access to tuples produced by INSERT and UPDATE. Also, UPDATE/DELETE old row versions can be accessed depending on the configured replica identity. Changes can be consumed using the streaming protocol \(logical replication slots\) or by a special SQL API.
  - format version 1 produces a JSON object per transaction. All of the new/old tuples are available in the JSON object. Also, there are options to include properties such as transaction timestamp, schema-qualified, data types, and transaction ids.
  - format version 2 produces a JSON object per tuple. Optional JSON object for beginning and end of transaction. Also, there are a variety of options to include properties.

openGauss 为开源数据库 PG for 9.2.4 基础上 deconding,wal2json 为 PG 的日志解析插件，将 wal 日志解析成 dml 语句以 json 的形式输出。云和恩墨基于 wal2json for pg 将该插件适配 openGauss 即 wal2json for openGauss.

- wal2json
## openGauss install wal2json<a name="section53491246709"></a>

关于 openGauss 的安装可参考

- [容器安装](https://github.com/enmotech/enmotech-docker-opengauss)

**修改参数 wal_level,添加 hba**

```
postgres=# alter system set wal_level = logical;
NOTICE:  please restart the database for the POSTMASTER level parameter to take effect.
ALTER SYSTEM SET
[omm@0f0ce5be9d04 ~]$ echo "host replication gaussdb 0.0.0.0/0 md5" >> /var/lib/opengauss/data/pg_hba.conf
[omm@0f0ce5be9d04 ~]$ gs_ctl restart -D /var/lib/opengauss/data/
[2020-12-07 03:51:12.500][293][][gs_ctl]: gs_ctl restarted ,datadir is -D "/var/lib/opengauss/data"
waiting for server to shut down...
```

**上传 wal2json**

```
[omm@0f0ce5be9d04 ~]$ cd $GAUSSHOME/lib/postgresql
[omm@0f0ce5be9d04 postgresql]$ ls wal2json.so
wal2json.so
```

**测试 wal2json**

session 1

```
[omm@0f0ce5be9d04 data]$ pg_recvlogical --help
pg_recvlogical receives logical change stream.

Usage:
  pg_recvlogical [OPTION]...

Options:
  -f, --file=FILE        receive log into this file. - for stdout
  -n, --no-loop          do not loop on connection lost
  -v, --verbose          output verbose messages
  -V, --version          output version information, then exit
  -?, --help             show this help, then exit

Connection options:
  -d, --dbname=DBNAME    database to connect to
  -h, --host=HOSTNAME    database server host or socket directory
  -p, --port=PORT        database server port number
  -U, --username=NAME    connect as specified database user
  -w, --no-password      never prompt for password
  -W, --password         force password prompt (should happen automatically)

Replication options:
  -F  --fsync-interval=INTERVAL
                         frequency of syncs to the output file (in seconds, defaults to 10)
  -o, --option=NAME[=VALUE]
                         Specify option NAME with optional value VAL, to be passed
                         to the output plugin
  -P, --plugin=PLUGIN    use output plugin PLUGIN (defaults to mppdb_decoding)
  -s, --status-interval=INTERVAL
                         time between status packets sent to server (in seconds, defaults to 10)
  -S, --slot=SLOT        use existing replication slot SLOT instead of starting a new one
  -I, --startpos=PTR     Where in an existing slot should the streaming start

Action to be performed:
      --create           create a new replication slot (for the slotname see --slot)
      --start            start streaming in a replication slot (for the slotname see --slot)
      --drop             drop the replication slot (for the slotname see --slot)

[omm@0f0ce5be9d04 data]$ pg_recvlogical -d postgres -S test_wal2json --create -U gaussdb -h 172.24.0.2 -P wal2json
Password:
```

保持 session1 终端

```
[omm@0f0ce5be9d04 data]$ pg_recvlogical -d postgres -S test_wal2json --start  -U gaussdb -h 172.24.0.2 -o pretty-print=1 -f -
Password:
{
        "change": [
                {
                        "kind": "insert",
                        "schema": "gaussdb",
                        "table": "test",
                        "columnnames": ["id", "name"],
                        "columntypes": ["integer", "character varying(20)"],
                        "columnvalues": [4, "Beijing"]
                }
        ]
}
{
        "change": [
                {
                        "kind": "update",
                        "schema": "gaussdb",
                        "table": "test",
                        "columnnames": ["id", "name"],
                        "columntypes": ["integer", "character varying(20)"],
                        "columnvalues": [4, "keji"],
                        "oldkeys": {
                                "keynames": ["id", "name"],
                                "keytypes": ["integer", "character varying(20)"],
                                "keyvalues": [4, "Beijing"]
                        }
                }
        ]
}
{
        "change": [
                {
                        "kind": "delete",
                        "schema": "gaussdb",
                        "table": "test",
                        "oldkeys": {
                                "keynames": ["id", "name"],
                                "keytypes": ["integer", "character varying(20)"],
                                "keyvalues": [4, "keji"]
                        }
                }
        ]
}
```

session 2 执行 dml

```
[omm@0f0ce5be9d04 postgresql]$ gsql -d postgres -p5432 -r -Ugaussdb
Password for user gaussdb:
gsql ((openGauss 1.0.1 build 13b34b53) compiled at 2020-10-12 02:00:59 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

postgres=> \d
                          List of relations
 Schema  | Name | Type  |  Owner  |             Storage
---------+------+-------+---------+----------------------------------
 gaussdb | test | table | gaussdb | {orientation=row,compression=no}
(1 row)

postgres=> select * from test;
 id | name
----+------
  1 | yun
  2 | he
  3 | enmo
(3 rows)

postgres=> insert into test values(4,'Beijing');
INSERT 0 1
postgres=> update test set name='keji' where id=4;
UPDATE 1
postgres=> delete test where id=4;
DELETE 1
postgres=>
```

可以看到 session1 分别记录了三条 dml 语句。

## Debeziun for openGauss adaptation process<a name="section1818302518717"></a>

<!-- > <img src='public_sys-resources/icon-note.gif'>  -->

**说明：**

> 本步骤为手动适配 connect 容器和配置文件过程（可不做）。

**替换 jar 文件**

- debezium-connector-postgres-1.4.0-SNAPSHOT.jar
- [postgres.jar](https://opengauss.obs.cn-south-1.myhuaweicloud.com/1.0.1/x86/openGauss-1.0.1-JDBC.tar.gz)

```
[root@asianux debezium]# git clone https://github.com/debezium/debezium-examples.git
[root@asianux debezium]# cd debezium-examples/tutorial
[root@asianux debezium]# export DEBEZIUM_VERSION=1.3
[root@asianux debezium]# docker-compose -f docker-compose-openGauss.yaml up -d
[root@asianux tutorial]# docker cp /root/debezium-connector-postgres-1.4.0-SNAPSHOT.jar tutorial_connect_1:/kafka/connect/debezium-connector-postgres
[root@asianux tutorial]# docker cp /root/postgres.jar tutorial_connect_1:/kafka/connect/debezium-connector-postgres
[root@asianux tutorial]# docker exec -it tutorial_connect_1 bash
[kafka@c452fffba4a8 debezium-connector-postgres]$ rm -f /kafka/connect/debezium-connector-postgres/postgresql-42.2.14.jar
[root@asianux tutorial]# docker restart tutorial_connect_1
```

**编写配置文件**

```
[root@asianux tutorial]# pwd
/opt/debezium/debezium-examples/tutorial

[root@asianux tutorial]# cat docker-compose-opengauss.yaml
version: '2'
services:
  zookeeper:
    image: debezium/zookeeper:${DEBEZIUM_VERSION}
    ports:
     - 2181:2181
     - 2888:2888
     - 3888:3888
  kafka:
    image: debezium/kafka:${DEBEZIUM_VERSION}
    ports:
     - 9092:9092
    links:
     - zookeeper
    environment:
     - ZOOKEEPER_CONNECT=zookeeper:2181
  opengauss:
    image: swr.cn-east-3.myhuaweicloud.com/enmotech/debezium/enmo_opengauss:1.3
    privileged : true
    ports:
     - 5432:5432
    environment:
     - GS_PASSWORD=Enmo@123
  connect:
    image: debezium/connect:${DEBEZIUM_VERSION}
    ports:
     - 8083:8083
    links:
     - kafka
     - postgres
    environment:
     - BOOTSTRAP_SERVERS=kafka:9092
     - GROUP_ID=1
     - CONFIG_STORAGE_TOPIC=my_connect_configs
     - OFFSET_STORAGE_TOPIC=my_connect_offsets
     - STATUS_STORAGE_TOPIC=my_connect_statuses



[root@asianux tutorial]# cat register-opengauss.json
{
    "name": "inventory-connector1",
    "config": {
        "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
        "tasks.max": "1",
        "database.hostname": "opengauss",
        "database.port": "5432",
        "database.user": "gaussdb",
        "database.password": "Enmo@123",
        "database.dbname" : "postgres",
        "database.server.name": "dbserver1_opengauss",
        "schema.include.list": "gaussdb",
        "plugin.name": "wal2json",
        "slot.name": "wal2json2"
    }
}
```

## Debeziun for openGauss Installtion<a name="section83961014141117"></a>

**下载 debeziun-example**

git clone https://gitee.com/lee1002/debezium-examples

```
[root@asianux opt]# git clone https://gitee.com/lee1002/debezium-examples
Cloning into 'debezium-examples'...
remote: Enumerating objects: 3850, done.
remote: Counting objects: 100% (3850/3850), done.
remote: Compressing objects: 100% (1446/1446), done.
remote: Total 3850 (delta 1466), reused 3850 (delta 1466), pack-reused 0
Receiving objects: 100% (3850/3850), 5.59 MiB | 0 bytes/s, done.
Resolving deltas: 100% (1466/1466), done.
```

**Start Container**

docker-compose -f docker-compose-opengauss.yaml up -d

```
[root@asianux opt]# cd debezium-examples/tutorial/
[root@asianux tutorial]# docker-compose -f docker-compose-opengauss.yaml up -d
Creating tutorial_kafka_1     ... done
Creating tutorial_zookeeper_1 ...
Creating tutorial_kafka_1     ...
Creating tutorial_connect_1   ... done
```

**Start openGauss connector**

```
curl -i -X POST -H “Accept:application/json” -H “Content-Type:application/json” http://localhost:8083/connectors/ -d @register-opengauss.json

[root@asianux tutorial]# curl -i -X POST -H "Accept:application/json" -H  "Content-Type:application/json" http://localhost:8083/connectors/ -d @register-opengauss.json
HTTP/1.1 201 Created
Date: Mon, 07 Dec 2020 06:30:40 GMT
Location: http://localhost:8083/connectors/inventory-connector1
Content-Type: application/json
Content-Length: 453
Server: Jetty(9.4.24.v20191120)
{"name":"inventory-connector1","config":{"connector.class":"io.debezium.connector.postgresql.PostgresConnector","tasks.max":"1","database.hostname":"opengauss","database.port":"5432","database.user":"gaussdb","database.password":"Enmo@123","database.dbname":"postgres","database.server.name":"dbserver1_opengauss","schema.include.list":"gaussdb","plugin.name":"wal2json","slot.name":"wal2json2","name":"inventory-connector1"},"tasks":[],"type":"source"}
```

**Consume messages from a Debezium topic**

docker-compose -f docker-compose-postgres.yaml exec kafka /kafka/bin/kafka-console-consumer.sh

–bootstrap-server kafka:9092

–from-beginning

–property print.key=true

–topic dbserver1_opengauss.gaussdb.test

```
[root@asianux tutorial]# docker-compose -f docker-compose-postgres.yaml exec kafka /kafka/bin/kafka-console-consumer.sh \
>     --bootstrap-server kafka:9092 \
>     --from-beginning \
>     --property print.key=true \
>     --topic dbserver1_opengauss.gaussdb.test

"payload":{"before":null,"after":{"id":1,"name":"yun"}
"payload":{"before":null,"after":{"id":2,"name":"he"}
"payload":{"before":null,"after":{"id":3,"name":"enmo"}
```

**DML Test**

session 1

```
[omm@a731769e567f ~]$ gsql -d postgres -p5432 -Ugaussdb -r
Password for user gaussdb:
gsql ((openGauss 1.0.1 build 13b34b53) compiled at 2020-10-12 02:00:59 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

postgres=> ALTER TABLE test REPLICA IDENTITY FULL;
ALTER TABLE

postgres=> \d test
            Table "gaussdb.test"
 Column |         Type          | Modifiers
--------+-----------------------+-----------
 id     | integer               | not null
 name   | character varying(20) |
Indexes:
    "test_pkey" PRIMARY KEY, btree (id) TABLESPACE pg_default
Replica Identity: FULL

postgres=> select * from test;
 id | name
----+------
  1 | yun
  2 | he
  3 | enmo
(3 rows)

postgres=> insert into test values (4,'Beijing');
INSERT 0 1
postgres=> update test set name='keji' where id=4;
UPDATE 1
postgres=> delete test where id=4;
DELETE 1
```

session 2

```
[root@asianux tutorial]# docker-compose -f docker-compose-postgres.yaml exec kafka /kafka/bin/kafka-console-consumer.sh \
>     --bootstrap-server kafka:9092 \
>     --from-beginning \
>     --property print.key=true \
>     --topic dbserver1_opengauss.gaussdb.test

"payload":{"before":null,"after":{"id":1,"name":"yun"}
"payload":{"before":null,"after":{"id":2,"name":"he"}
"payload":{"before":null,"after":{"id":3,"name":"enmo"}
"payload":{"before":null,"after":{"id":4,"name":"Beijing"}                        --insert
"payload":{"before":{"id":4,"name":"Beijing"},"after":{"id":4,"name":"keji"}      --update
"payload":{"before":{"id":4,"name":"keji"},"after":null                           --delete
```

**Shut down the cluster**

docker-compose -f docker-compose-opengauss.yaml down

```
[root@asianux tutorial]# docker-compose -f docker-compose-opengauss.yaml down
Stopping tutorial_connect_1   ... done
Stopping tutorial_kafka_1     ... done
Stopping tutorial_zookeeper_1 ... done
Stopping tutorial_opengauss_1 ... done
Removing tutorial_connect_1   ... done
Removing tutorial_kafka_1     ... done
Removing tutorial_zookeeper_1 ... done
Removing tutorial_opengauss_1 ... done
Removing network tutorial_default
```

- debezium 官网：[https://debezium.io/](https://debezium.io/)
- debezium github：[https://github.com/debezium](https://github.com/debezium)
- 容器安装：[https://github.com/enmotech/enmotech-docker-opengauss](https://github.com/enmotech/enmotech-docker-opengauss)
- connect 组件 debezium-connector-postgres-1.4.0-SNAPSHOT.jar
- connect 组件 postgres.jar：[https://opengauss.obs.cn-south-1.myhuaweicloud.com/1.0.1/x86/openGauss-1.0.1-JDBC.tar.gz](https://opengauss.obs.cn-south-1.myhuaweicloud.com/1.0.1/x86/openGauss-1.0.1-JDBC.tar.gz)
