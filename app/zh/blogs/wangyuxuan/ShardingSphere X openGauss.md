---
title: 'ShardingSphere X openGauss'
date: '2023-04-18'
category: 'blog'
tags: ['openGauss社区开发入门']
archives: '2023-04'
author: 'wangyuxuan'
summary: 'ShardingSphere X openGauss'
img: '/zh/post/wangyuxuan/title/img.jpg'
times: '15:30'
---

## ShardingSphere X openGauss

openGauss 数据库是单机事务型数据库，不具备分布式能力，无法横向扩展。随着业务的增长，单节点的性能终会成为瓶颈，所以 openGauss 数据库需要补足自己的分布式能力。

单机数据库补足分布式能力有三条路径：

1. 配置读写分离的主从架构，读请求由从节点响应，而写请求由主节点响应，这样可以一定程度提升数据库的并发能力，但是由于写请求是单点的，仍然不能支撑更大规模的业务。
2. 对数据表进行分片，业务代码请求的表我们称为逻辑表，根据分片规则映射到底层数据库的数据表称为真实表，这样我们可以将对逻辑表的请求路由到涉及到的真实表所在的数据库，而这些真实表分布在不同的数据库上，以此来将单机数据库扩展为分布式数据库。
3. 改造数据库为存储计算分离的架构，将存储资源池化，根据负载弹性扩缩容计算资源，这种方案实现难度高，可能需要依赖特殊硬件。

公有云厂商一般会选择第三种方案。而 openGauss 数据库根据自身的能力和用户需求，选了第二种更为成熟的分库分表方案。业界已经有许多成熟、开源的分库分表中间件，不过 openGauss 数据库基于 openGauss 协议实现，对中间件的 SQL 语法兼容性有一定要求，而 ShardingSphere 自己实现了多种 SQL 语法的解析，对 openGauss 协议的兼容性最友好，最终 openGauss 数据库选择了基于 ShardingSphere 来补足自身的分布式能力，并且增强读写分离的易用性。

## Apache ShardingSphere 是什么？

> Apache ShardingSphere 是一款分布式的数据库生态系统，可以将任意数据库转换为分布式数据库，并通过数据分片、弹性伸缩、加密等能力对原有数据库进行增强。

_社区官网对于 ShardingSphere 的定义。_

Apache ShardingSphere 遵循 Apache 2.0 许可证开源，现在是 Apache 开源基金会下的顶级开源项目，拥有开放、活跃的社区。

Apache ShardingSphere 由 Sharding-JDBC 框架发展而来，该应用框架最早起源于当当网内部，并于 2017 年初正式开源，在 2018 年改名 ShardingSphere 并加入 Apache 开源基金会孵化器，最终于 2020 年从孵化器毕业成为 Apache 下的顶级项目。

## Sharding-Proxy 是什么？

ShardingSphere 在 Sharding-JDBC 的基础上提出了 Sharding-Proxy 组件，该组件的定位是透明的数据库代理端，客户端可以在不感知分片表、多数据库的的前提下，通过该组件实现对分片表的请求。同时由于该组件代理了所有的客户端请求，我们还可以在其之上实现诸如读写分离、数据加密、脱敏等数据库管理的功能。

**openGauss 数据库选择基于 Sharding-Proxy 组件来扩展其自身的能力。**
![](./images/01.png)

## Sharding-Proxy 如何实现？

Sharding-Proxy 本身是一个无状态的数据库代理服务，主要分为 bootstrap、前端、后端三个模块，其中 bootstrap 负责启动 netty 服务器，前端负责接受客户端请求并处理认证，后端负责根据分片规则处理请求、转发请求到数据库并处理返回结果，而无状态这一特性要求 Proxy 将一些状态信息（配置、分片规则等）存储到 Zookeeper 等中间件中。

Proxy 拥有很强的兼容性，前后端支持众多主流数据库例如 MySQL、postgreSQL、openGauss 等，这些数据库的客户端可以直接连接到 Proxy 上，Proxy 会支持这些数据库通信协议和认证请求，并将请求发送给后端模块。

后端模块实现了对这些数据库协议、SQL 语法的支持，考虑到 Proxy 本身不会对 SQL 进行计算（只会处理少量需要聚合计算的结果），因此 Proxy 不需要完全解析并理解 SQL 语法，而是对其采取了半理解的解析方式，依赖 antrl 实现语法解析，然后遍历 TOKEN 取出分片算法关心的 TOKEN（如 where 条件等），根据分片算法改写 SQL 并路由到对应的数据库，在所有结果返回后进行合并并处理，最后将结果返回给请求的客户端。

![](./images/02.png)

用户需要在 Proxy 配置好分片表的规则和算法，然后 Proxy 会将客户端的 SQL 语句用上述流程计算并转发，最后归并结果并会返回。

从对于分片表的处理我们可以看出，Proxy 想要支持读写分离，只需要在 SQL 路由阶段根据配置的负载均衡规则来确定转发的真实数据库即可。通过 Proxy 实现的读写分离可以免去客户端配置主从节点和负载均衡规则的繁琐。

## Sharding-Proxy 如何使用/配置？

### Server 配置

[Proxy server 参考配置模板](https://github.com/apache/shardingsphere/blob/master/proxy/bootstrap/src/main/resources/conf/server.yaml)

### 分片规则配置

[分片规则参考](https://github.com/apache/shardingsphere/blob/master/proxy/bootstrap/src/main/resources/conf/config-sharding.yaml)

这里举一个简单的例子说明

```
databaseName: sharding_db
dataSources:
  ds_0:
    url: jdbc:opengauss://host:port/db_name
    username: USER
    password: PASSWD
    connectionTimeoutMilliseconds: 30000
    idleTimeoutMilliseconds: 60000
    maxLifetimeMilliseconds: 1800000
    maxPoolSize: 50
    minPoolSize: 1
  ds_1:
    url: jdbc:opengauss://host:port/db_name
    username: USER
    password: PASSWD
    connectionTimeoutMilliseconds: 30000
    idleTimeoutMilliseconds: 60000
    maxLifetimeMilliseconds: 1800000
    maxPoolSize: 50
    minPoolSize: 1
```

databaseName 表示逻辑数据库的名字，即客户端连接指定的数据库名，dataSources 配置后端连接的物理数据库连接配置。

```
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
        auditStrategy:
          auditorNames:
            - sharding_key_required_auditor
          allowHintDisable: true
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

这个配置的含义是，将表 t_order，按照 user_id 列用模 2 算法分库，按照 order_id 列用模 2 算法分表，其中分库的配置是利用了默认配置实现。
需要注意的是，Sharding-Proxy 仅仅管理分片规则，分片表还是需要用户或者 DBA 提前在底层数据库分别创建好。不过 5.x 版本的 ShardingSphere 已经引入了 DistSQL 和自动表的概念，可以通过 SQL 来配置分片规则，以及可以由 Sharding 来自动创建对应的分片表了。

### 读写分离配置

[规则模板参考](https://github.com/apache/shardingsphere/blob/master/proxy/bootstrap/src/main/resources/conf/config-readwrite-splitting.yaml)

```
databaseName: readwrite_splitting_db

dataSources:
  primary_ds:
    url: jdbc:postgresql://localhost:5432/demo_primary_ds
    username: postgres
    password: postgres
  replica_ds_0:
    url: jdbc:postgresql://localhost:5432/demo_replica_ds_0
    username: postgres
    password: postgres
  replica_ds_1:
    url: jdbc:postgresql://localhost:5432/demo_replica_ds_1
    username: postgres
    password: postgres
rules:
  - !READWRITE_SPLITTING
    dataSources:
      readwrite_ds:
        staticStrategy:
          writeDataSourceName: primary_ds
          readDataSourceNames:
            - replica_ds_0
            - replica_ds_1
        loadBalancerName: random
    loadBalancers:
      random:
        type: RANDOM
```

这个配置的含义是，对于逻辑数据库 readwrite_splitting_db，配置主从库的连接配置，并指定哪些是主哪些是从，以及负载均衡的规则。客户端在请求 Proxy 后，Proxy 服务会根据真是数据库的运行状态和负载均衡规则来决定将请求路由到哪个真实数据库节点。

## 未来发展

### 业务透明的数据加密、脱敏

利用 Sharding-Proxy 会代理所有数据库请求的能力，我们可以扩展出对用户透明的数据加密、脱敏的特性。通过配置加密规则和认证规则，可以实现在不修改业务代码的前提下，写出的数据自动加密，而只有通过认证的客户端才可以读取解密数据。

### 兼容多种 SQL 协议的异构数据库形态

Sharding-Proxy 基于 antlr 自己实现了多种 SQL 语法的解析，我们可以利用这一点在前后端接入不同协议的数据库，从而令 openGauss 数据库实现对更多 SQL 语法的兼容，进一步降低用户切换数据库的成本。

## 参考链接

- <https://shardingsphere.apache.org/document/current/cn/overview/>
