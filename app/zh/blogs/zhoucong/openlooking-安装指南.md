---
title: 'openGauss分布式与openLooKeng部署指南'
date: '2023-11-22'
tags: ['openGauss分布式与openLooKeng部署指南']
archives: '2023-11'
author: 'zhoucong'
category: 'blog'
summary: 'openGauss分布式与openLooKeng部署指南'
img: ''
times: '11:00'
---

# openGauss分布式与openLooKeng部署指南

## 1 摘要
介绍介绍openGauss协同openLooKeng和ShardingSphere，实现数据库分布式OLAP能力的环境部署说明。

缩略语清单：

| 缩略语   | 英文全名                     | 中文解释                                                     |
| -------- | ---------------------------- | ------------------------------------------------------------ |
| og       | openGauss                    | 开源数据库引擎                                               |
| olk      | openLooKeng                  | 大数据分析引擎                                               |
| ss-proxy | shardingsphere-Proxy         | 定位为透明化的数据库代理端，提供封装了数据库二进制协议的服务端版本，用于完成对异构语言的支持。 目前提供 MySQL 和 PostgreSQL（兼容 openGauss 等基于 PostgreSQL 的数据库）版本，它可以使用任何兼容 MySQL/PostgreSQL 协议的访问客户端（如：MySQL Command Client, MySQL Workbench, Navicat 等）操作数据，对 DBA 更加友好。 |
| ZK       | zookeeper                    | ZooKeeper 是 Apache 软件基金会的一个软件项目，它为大型分布式计算提供开源的分布式配置服务、同步服务和命名注册。 |
| OLAP     | Online Analytical Processing | 联机分析处理，大数据分析的应用技术，提供复杂的分析操作、侧重决策支持。 |

## 2 下载安装包
| 软件名称             | 软件版本                                | 备注                                                         |
| -------------------- | --------------------------------------- | ------------------------------------------------------------ |
| openLooKeng          | 1.8.0及以上版本                         | openLooKeng官网发布二进制包地址：https://openlookeng.io/zh/download/ |
| shardingsphere-Proxy | ShardingSphere版本必须是5.2.0及以上版本 | ShardingSphere-5.2.0官网发布二进制包地址：https://archive.apache.org/dist/shardingsphere/5.2.0/apache-shardingsphere-5.2.0-shardingsphere-proxy-bin.tar.gz |
| openGauss            | 3.1.0                                   | https://opengauss.org/zh/download.html                       |
| zookeeper            | 3.6.0及以上版本                         | https://zookeeper.apache.org/releases.html#download          |

## 3 环境配置
xxx为自定义服务器ip，建议

| 应用                 | IP:PORT            |
| -------------------- | ------------------ |
| zookeeper            | xxx.xxx.x.11:2181  |
| opengauss1           | xxx.xxx.x.22:16000 |
| opengauss2           | xxx.xxx.x.33:16000 |
| shardingsphere-proxy | xxx.xxx.x.11:13000 |
| openlookeng          | xxx.xxx.x.44:8080  |

## 4 安装openGauss分布式集群
### 4.1 安装openGauss数据库
请参考opengauss官网部署文档；由于验证分片场景，至少安装2个数据库。
### 4.2 配置启动zookeeper
（1）解压tar包

```
tar -zxf apache-zookeeper-3.7.0-bin.tar.gz
```

（2）然后进入解压后文件夹的conf目录下，复制zoo_sample.cfg，重命名为zoo.cfg文件，并修改配置如下信息：

```
dataDir=/home/zookeeper
clientPort=2181
admin.serverPort=8888
```

备注：dataDir的目录需要自己创建。两个端口号自由配置不冲突即可，但切记不要使已经被别人占用的端口。

（3）启动zookeeper，bin目录下运行zkServer.sh。

```
 sh ./apache-zookeeper-3.7.0-bin/bin/zkServer.sh start
```

### 4.3 配置启动shardingsphere-proxy
（1）解压tar包

```
tar -zxf apache-shardingsphere-5.2.0-shardingsphere-proxy-bin.tar.gz
```

（2）修改server.yaml配置信息：

```
vim ./apache-shardingsphere-5.2.0-shardingsphere-proxy-bin/conf/server.yaml
```

配置信息如下：

```
mode:
  type: Cluster
  repository:
    type: ZooKeeper
    props:
      namespace: governance_ds
      server-lists: xxx.xxx.x.11:2181   #Zookeeper应用IP:port
      retryIntervalMilliseconds: 5000
      timeToLiveSeconds: 60
      maxRetries: 3
      operationTimeoutMilliseconds: 5000
  overwrite: true

rules:
  - !AUTHORITY
    users:
      - root@%:root
      - sharding@:sharding
    provider:
      type: ALL_PRIVILEGES_PERMITTED
```

（3）配置opengauss数据库分片信息，新增./apache-shardingsphere-5.2.0-shardingsphere-proxy-bin/conf/config-sharding.yaml文件

备注：如下配置信息，t_order表按照user_id%2结果进行分库至ds_0或ds_1库；按照order_id%2结果进行分表（每个库下2张分表）；

```
schemaName: sharding_db   #逻辑数据源，可自定义
dataSources:
  ds_0:
    url: jdbc:opengauss://xxx.xxx.x.22:16000/test?loggerLevel=OFF #数据库1 IP:port
    connectionTimeoutMilliseconds: 30000
    idleTimeoutMilliseconds: 60000
    maxLifetimeMilliseconds: 1800000
    maxPoolSize: 260
    minPoolSize: 1
    password: Test@123
    username: test
  ds_1:
    url: jdbc:opengauss://xxx.xxx.x.33:16000/test?loggerLevel=OFF  #数据库2 IP:port
    connectionTimeoutMilliseconds: 30000
    idleTimeoutMilliseconds: 60000
    maxLifetimeMilliseconds: 1800000
    maxPoolSize: 260
    minPoolSize: 1
    password: Test@123
    username: test

rules:
- !SHARDING
  tables:
    t_order:
      actualDataNodes: ds_${0..1}.t_order_${0..1}
      tableStrategy:
        standard:
          shardingColumn: order_id
          shardingAlgorithmName: t_order_inline
      keyGenerateStrategy:
        column: order_id
        keyGeneratorName: snowflake
  defaultDatabaseStrategy:
    standard:
      shardingColumn: user_id
      shardingAlgorithmName: database_inline
  defaultTableStrategy:
    none:

  shardingAlgorithms:
    database_inline:
      type: INLINE
      props:
        algorithm-expression: ds_${user_id % 2}
    t_order_inline:
      type: INLINE
      props:
        algorithm-expression: t_order_${order_id % 2}

  keyGenerators:
    snowflake:
      type: SNOWFLAKE
```

（4）启动shardingsphere-proxy，bin目录下运行start.sh，启动端口为13000

```
 sh ./apache-shardingsphere-5.2.0-shardingsphere-proxy-bin/bin/start.sh 13000
```

（5）gsql客户端连接shardingsphere-proxy，进行分片表创建及数据插入

```
gsql -d sharding_db -p 13000 -h xxx.xxx.x.11 -U sharding -W sharding -r   #连接shardingsphere-proxy指令

create table t_order (
  user_id       int,
  order_name    varchar(30),
  order_value   varchar(50),
  order_id int default 0
);--建表语句
insert into t_order values(1,'test1','values1',1),(1,'test1','values12',2),(2,'test2','values2',1),(2,'test2','values22',2);
```

## 5 部署openLooKeng
### 5.1 openLooKeng解压
在一个合适的目录作为openLookeng的安装目录，解压openLookeng的包
```
tar -zxvf hetu-server-1.8.0.tar.gz
```

将解压出来的包改名（可选，只是为了后续配置方便）

```
mv hetu-server-1.8.0 hetu-server
```

### 5.2 openlookeng配置
在hetu-server目录下创建etc目录

```
mkdir etc
cd etc
```

需要在该目录下创建config.properties、jvm.config、node.properties三个文件，**详细配置项说明及步骤参见：6.1  openLookeng部署文档  章节**

（1）node.properties包含每个节点特有的配置。节点是机器上已安装的openLooKeng的单个实例。下面是最基本的etc/node.properties：

```
node.environment=openlookeng
node.launcher-log-file=****/hetu-server/log/launch.log    ## 这里****需要配置为hetu-server所在实际路径
node.server-log-file=****/hetu-server/log/server.log
catalog.config-dir=****/hetu-server/etc/catalog
node.data-dir=****/hetu-server/data
plugin.dir=****/hetu-server/plugin
```

备注：启动时需要修改bin/launcher.py文件才能按照指定路径生成日志，否则日志默认生成在./hetu-server/data/var/log路径下，详见5.1  openLookeng部署文档，“ 运行openLooKeng”章节。

（2）jvm.config包含用于启动Java虚拟机的命令行选项列表。文件的格式是一个选项列表，每行一个选项。这些选项不由shell解释，因此包含空格或其他特殊字符的选项不应被引用。 

```
-server
-Xmx16G
-XX:-UseBiasedLocking
-XX:+UseG1GC
-XX:G1HeapRegionSize=32M
-XX:+ExplicitGCInvokesConcurrent
-XX:+ExitOnOutOfMemoryError
-XX:+UseGCOverheadLimit
-XX:+HeapDumpOnOutOfMemoryError
-XX:+ExitOnOutOfMemoryError
```

参数中Xmx大小为服务器可用内存的70%（建议值，availableMem*70%）。

（3）config.properties包含openLooKeng服务器的配置。openLookeng集群分为负责调度SQL的coordinator和处理数据的worker，每个openLooKeng服务器都可以同时充当coordinator和worker，但是将一台机器专用于只执行协调工作可以在较大的集群上提供最佳性能。以下配置信息以coordinator和worker在同一台机器为例：

```
coordinator=true
node-scheduler.include-coordinator=true
http-server.http.port=8080    #自定义
query.max-memory=50GB
query.max-total-memory=50GB
query.max-memory-per-node=10GB
query.max-total-memory-per-node=10GB
discovery-server.enabled=true
discovery.uri=http://xxx.xxx.x.44:8080  #自定义
```

### 5.3  shardingsphere-connector的配置

**详细配置项说明及步骤参见：shardingsphere-connector配置说明 章节**

（1）在./hetu-server/etc目录下创建目录catalog

```
mkdir catalog
cd catalog
```

（2）配置ShardingSphere模式连接器

创建文件shardingsphere.properties (若要同时连接多个shardingsphere逻辑数据库，请使用不同的文件名，例shardingsphere0.properties、shardingsphere1.properties等)，shardingsphere.properties文件配置如下：

```
connector.name=singledata
singledata.mode=SHARDING_SPHERE
shardingsphere.database-name=sharding_db   #与2.3章节中，config-sharding.yaml中schemaName对应
shardingsphere.type=ZooKeeper
shardingsphere.namespace=governance_ds   #与2.3章节中，server.yaml中namespace配置信息对应
shardingsphere.server-lists=xxx.xxx.x.11:2181   #Zookeeper应用IP:port
```

（3）配置JDBC

将对应的jdbc驱动 `opengauss-jdbc-3.1.0.jar` 放到`***/hetu-server/plugin/hetu-singledata`目录下

（4）启动openLookeng

进入目录./hetu-server/bin，修改目录脚本权限：

```
chmod 777 *
```

启动openLookeng（后台启动为./launcher start， 停止为./launcher stop）

```
./launcher run
```

### 5.4  连接openLooKeng

（1）进入./hetu-server/bin目录，连接openlookeng：

```
java -jar hetu-cli-1.8.0-executable.jar --server xxx.xxx.x.44:8080 --catalog shardingsphere --schema public
```

（2）进行表查询

```
show tables;
select * from t_order;
```

说明：

--server：openlookeng的IP:PORT

--catalog：步骤3.2中配置Shardingsphere模式连接器的文件名称

--schema：默认值public

# 6 附件

## 6.1  openLookeng部署文档

- https://gitee.com/openlookeng/hetu-core/blob/master/hetu-docs/zh/installation/deployment.md

## 6.2  shardingsphere-connector配置说明

- https://gitee.com/openlookeng/hetu-core/blob/master/hetu-docs/zh/connector/singledata.md

## 6.3  其他资料

- openLooKeng支持数据类型文档：

  https://docs.openlookeng.io/zh/docs/docs/language/types.html

- openLooKeng支持SELECT语法文档：

  https://docs.openlookeng.io/zh/docs/docs/sql/select.html

- openLookeng数据类型转换文档：

  https://docs.openlookeng.io/zh/docs/docs/functions/vonversion.html

## 6.4   约束说明

（1）目前openLooKeng仅支持对openGauss的select语法，其他DDL、DML语法不支持；

（2）依赖shardingSphere+ZK注册中心+opengauss集群部署方式；shardingSphere版本限制5.2.0及以上；

（3）Java 8 Update 161或更高版本(8u161+) (64位)。同时支持Oracle JDK和Open JDK；AArch64 (Bisheng JDK 1.8.262 或者更高版本)；
