---
title: '数据迁移至openGauss'

date: '2022-10-01'

tags: ['openGauss有奖征文', 'openGauss', '数据迁移']
category: 'blog'
archives: '2022-10'

author: '小薛同学'

summary: '数据迁移至openGauss.'
---

前言

openGauss 是华为旗下的国产数据库，我对着这个数据库的了解要从今年 8 月份开始说起，这个数据库我刚开始使用的时候还头疼了很久，感觉搭建的过程还是比较复杂的，但是熟悉之后发现是真的很香！

<!-- ![输入图片说明](../../../../data/img/%E5%9B%BE%E7%89%87.png) -->

## 一、openGauss 介绍

官方介绍： openGauss 是一款全面友好开放，携手伙伴共同打造的企业级开源关系型数据库。openGauss 采用木兰宽松许可证 v2 发行，提供面向多核架构的极致性能、全链路的业务、数据安全、基于 AI 的调优和高效运维的能力。openGauss 内核源自 PostgreSQL，深度融合华为在数据库领域多年的研发经验，结合企业级场景需求，持续构建竞争力特性。同时，openGauss 也是一个开源、免费的数据库平台，鼓励社区贡献、合作。

个人理解： 基于 linux 为内核的国产数据库，安全性大大提高

## 二、MySQL 数据迁移到 openGauss

### 1.全量迁移

- （1）介绍

  官方介绍 chameleon 是一个用 Python3 编写的将 MySQL 迁移至 openGauss 的实时复制工具，支持初始全量数据的复制以及后续增量数据的实时在线复制功能。chameleon 通过一次初始化配置，使用只读模式，将 MySQL 的数据全量拉取到 openGauss。支持在同一快照下，表间数据并行迁移。全量迁移支持的功能：支持表及表数据、视图、触发器、自定义函数、存储过程的全量迁移

  个人理解 也就是说，将数据库中的数据通过工具全量复制到 openGauss 里面，这是最简单易懂的解释。

  <!-- ![输入图片说明](../../../../data/%E5%9B%BE%E7%89%87.png) -->

  和上图其实原理很类似，就是对大量数据进行批量复制，从 MySQL 复制到 openGauss，只不过中间开始利用工具进行操作。

- （2）优势

  官方解释： 基于 sysbench 测试模型，在 Kunpeng-920 2p 服务器上，MySQL 数据库 10 张表单表数据量在 300 万以上时，chameleon 使用 10 并发迁移数据至 openGauss，整体全量迁移性能可达 300M/S 以上。

  个人理解 也就是说，在大量数据的迁移的时候，通常会出现两种问题难以解决，第一数据量过于庞大，第二迁移速度太慢，openGauss 很好的解决了这两点问题。

- （3）chameleon 工具

  下载地址：<https://opengauss.obs.cn-south-1.myhuaweicloud.com/latest/chameleon/chameleon-1.0.0-py3-none-any.whl>

  `pip3 install ./chameleon-1.0.0-py3-none-any.whl`（安装 chameleon 命令）

- （4）安装

  ```
  git clone git@gitee.com:opengauss/openGauss-tools-chameleon.git #（下载源码）

  python3 -m venv venv #（创建环境）

  source venv/bin/activate #（激活环境）

  cd openGauss-tools-chameleon #（进入指定目录）

  python3 setup.py install #（安装）
  ```

- （5）迁移

  ```
  chameleon set_configuration_files （创建目录）

  cd ~/.pg_chameleon/configuration （进入目录）

  cp config-example.yml default.yml （配置default.yml）
  ```

  ** 修改 default.yml 配置文件 **

  ```
  global settings
  pid_dir: '~/.pg_chameleon/pid/'

  log_dir: '~/.pg_chameleon/logs/'

  log_dest: file

  log_level: info

  log_days_keep: 10

  rollbar_key: ''

  rollbar_env: ''

  # type_override allows the user to override the default type conversion

  # into a different one.

  type_override:

  "tinyint(1)":

  override_to: boolean

  override_tables:

  - "*"

  # postgres destination connection

  pg_conn:

  host: "1.1.1.1"

  port: "5432"

  user: "opengauss_test"

  password: "password_123"

  database: "opengauss_database"

  charset: "utf8"

  sources:

  mysql:

  readers: 4

  writers: 4

  db_conn:

  host: "1.1.1.1"

  port: "3306"

  user: "mysql_test"

  password: "password123"

  charset: 'utf8'

  connect_timeout: 10

  schema_mappings:

  mysql_database:sch_mysql_database

  limit_tables:

  skip_tables:

  grant_select_to:

  - usr_migration

  lock_timeout: "120s"

  my_server_id: 1

  replica_batch_size: 10000

  replay_max_rows: 10000

  batch_retention: '1 day'

  copy_max_memory: "300M"

  copy_mode: 'file'

  out_dir: /tmp

  sleep_loop: 1

  on_error_replay: continue

  on_error_read: continue

  auto_maintenance: "disabled"

  gtid_enable: false

  type: mysql

  keep_existing_schema: No

  migrate_default_value: Yes

  初始化

  chameleon create_replica_schema --config default

  chameleon add_source --config default --source mysql

  迁移数据

  chameleon init_replica --config default --source mysql

  chameleon start_view_replica --config default --source mysql --debug

  chameleon start_trigger_replica --config default --source mysql --debug

  chameleon start_func_replica --config default --source mysql --debug

  chameleon start_proc_replica --config default --source mysql --debug

  结束迁移

  chameleon stop_replica --config default --source mysql

  chameleon detach_replica --config default --source mysql

  chameleon drop_replica_schema --config default
  ```

### 2.增量迁移

- （1）介绍

  官方解释: 基于开源三方件 mysql-binlog-connector-java 解析 mysql 的 binlog，并根据 mysql 主备并行复制的原理，对可并行的事务在 openGauss 端采用多线程进行并行回放，以实现 MySQL 到 openGauss 端的在线迁移。其中并行事务的判断规则为：如果所有正在回放的事务的最小 sequence_number 大于该事务的 last_committed，那么该事务就可以并行执行。该方案可以严格保证事务的顺序和一致性。

  个人理解 也就是传输工程中的一种类似协议的东西，加固迁移过程的稳定性

  <!-- ![输入图片说明](../../../../data/img/1.png) -->

- （2）迁移代码

```
  git clone https://gitee.com/opengauss/openGauss-tools-onlineMigration-mysql.git（下载源码）
```

改动配置文件

```
#openGauss config

openGauss_conn:

host: "127.0.0.1"

port: "5432"

user: "opengauss"

password: "password123"

database: "postgres"

#mysql config

mysql_conn:

host: "127.0.0.1"

port: "3306"

user: "mysql"

password: "password123"

database: "mysql"

cd openGauss-tools-onlineMigration-mysql/mysql2openGauss/

mvn clean package（编译）

java -jar ./target/online-migration-mysql-3.1.0.jar （运行）

numactl -C 0-31 -m 0 java -Xms15G -Xmx25G -jar ./target/online-migration-mysql-3.1.0.jar （执行）
```

### 3.数据校验

- （1）介绍

  <!-- ![输入图片说明](../../../../data/img/2.png) -->

  官方介绍 全量校验： 在全量数据迁移完成后，由 extract 服务对 MySQL 源端和 openGauss 目标端数据抽取然后规整，并将数据推送到 kafka 中。最后由 check 服务提取 kafka 中的数据，并进行校验且输出校验结果。 增量校验： 由 debezium 服务侦听源端 MySQL 数据库的增量数据，到指定 topic。再由源端 extract 服务处理该 topic 增量数据，触发 check 增量校验。

  个人理解：就是在全量数据迁移之后，正对数据迁移的准确性做一个调查，查看数据库信息是否在迁移过程中有丢失等等情况

  <!-- ![输入图片说明](../../../../data/img/4.png) -->

- （2）代码

  ```
  git clone https://gitee.com/opengauss/openGauss-tools-datachecker-performance.git（下载源码）

  mvn clean package -Dmvnen.test.skip=true（构建check 和 extract jar包）

  配置application.yml文件

  server:

  port: 9000

  spring:

  kafka:

  bootstrap-servers: 192.168.0.114:9092 # kafka 集群地址
  data:

  check:

  data-path: D:\code\tool  # 配置数据校验结果输出本地路径

  bucket-expect-capacity: 10 # 桶容量范围最小值为1

  source-uri: http://127.0.0.1:9002 # 配置源端服务地址和服务端口server.port

  sink-uri: http://127.0.0.1:9001 # 配置源端服务地址和服务端口server.port
  配置 application-source.yml文件

  server:

  port: 9002

  spring:

  check:

  server-uri: http://127.0.0.1:9000 # 数据校验服务地址
  extract:

  schema: test # 源端数据实例

  databaseType: MS  # 源端数据库类型 MS mysql

  debezium-enable: false #是否开启增量debezium配置 默认不开启

  debezium-topic:topic # debezium监听表增量数据，使用单一topic进行增量数据管理

  debezium-groupId: debezium-extract-group # d debezium增量迁移topic ，groupId消费Group设置

  debezium-topic-partitions: 1 # debezium监听topic 分区数量配置

  debezium-tables: # debezium-tables配置debezium监听的表名称列表; 该配置只在源端服务配置并生效

      table1,

      table2

  debezium-time-period: 1 # debezium增量迁移校验 时间周期 24*60 单位分钟

  debezium-num-period: 1000 #debezium增量迁移校验 统计增量变更记录数量阀值，默认值1000 阀值应大于100
  datasource:

  druid:


    dataSourceOne:

      driver-class-name: com.mysql.cj.jdbc.Driver

      url: jdbc:mysql://127.0.0.1:3306/test?useSSL=false&useUnicode=true&characterEncoding=utf-8&serverTimezone=UTC&allowPublicKeyRetrieval=true

      username: jack  # 源端mysql用于校验的用户名称

      password: test@123  # 源端mysql用于校验的用户名称密码
  配置 application-sink.yml文件

  server:

  port: 9001

  spring:

  check:

  server-uri: http://127.0.0.1:9000 # 数据校验服务地址
  extract:

  schema: test  # 宿端opengauss 用于校验数据schema

  databaseType: OG  # 宿端数据库类型 OG opengauss
  datasource:

  druid:

    dataSourceOne:

      driver-class-name: org.opengauss.Driver

      # 宿端opengauss用于校验数据库链接地址

      url: jdbc:opengauss://127.0.0.1:15432/test?useSSL=false&useUnicode=true&characterEncoding=utf-8&serverTimezone=UTC&batchMode=OFF

      username: jack # 宿端opengauss用于校验的用户名称

      password: test@123  # 宿端opengauss用于校验的用户名称密码
  校验前的准备工作

  cd /data/kafka/confluent-7.2.0

  bin/zookeeper-server-start -daemon etc/kafka/zookeeper.properties（启动服务）

  bin/kafka-server-start.sh -daemon etc/kafka/server.properties（启动服务）

  bin/connect-standalone -daemon etc/kafka/connect-standalone.properties etc/kafka/mysql-conect.properties（文件连接）

  校验

  sh extract-endpoints.sh stat|restart|stop（启动校验服务）

  sh check-endpoint.sh stat|restart|stop（启动校验服务）

  curl -X 'POST' 'http://localhost:9000/start/check?checkMode=FULL' -H 'accept: /' -d ''（全量校验）

  curl -X 'POST' 'http://localhost:9000/stop/clean/check' -H 'accept: /' -d ''（环境清理）

  debezium-enable: true（开始校验）

  ```

### 4.反向迁移

- 1.介绍

  官方解释： 反向迁移是指用户将源端数据库迁移到目标数据库，应用切到目标数据库后，再将目标端新产生的数据迁移回源端。反向迁移可满足用户业务迁移逃生的诉求，保持源端、目标端两个库并行运行，在目标端数据库出问题后应用能及时切回源端数据库。openGauss 提供 reverse-migration 工具，将 openGauss 数据库迁移至 MySQL 数据库，满足反向迁移要求。

  个人理解： 也就是从 openGauss 数据库迁移回 Mysql 数据库中的过程

- 2.代码

  ```
  配置config.yaml文件

  og_conn:

  host: "openGauss_ip"

  port: "5432"

  user: "user"

  password: "password"

  database: "postgres"

  charset: "utf8"

  driver: "org.opengauss.Driver"

  ASSUME_MIN_SERVER_VERSION: "9.4"//逻辑复制必备属性

  REPLICATION: "database" //逻辑复制必备属性

  PREFER_QUERY_MODE: "simple"//逻辑复制必备属性

  slot:

  name: "replication_slot"//逻辑复制槽名称

  include-xids: false//解码数据是否包含xid信息

  skip-empty-xacts: true//解码事务是否包含空事务

  waitLSN: ""//逻辑复制槽开启的lsn

  parallel-decode-num: 20//并行解码个数，最大20

  white-table-list: ""//库表白名单

  standby-connection: false//强制备机解码

  decode-style: "j"//解码格式

  decoding: "mppdb_decoding"//创建逻辑复制槽的工具

  runnable_num: 1//并行回放个数

  mysql:

  driver: "com.mysql.cj.jdbc.Driver"

  host: "mysql_ip"

  port: "3306"

  user: "user"

  password: "password"

  database: "database

  反项迁移

  mvn clean package（编译）

  java -jar ./reverse-migration-mysql-1.0-SNAPSHOT.jar start/create/drop（运行）

  numactl -c 0 -31 -m 0 java -Xms15G -Xmx25Gs -jar ./reverse-migration-mysql-1.0-SNAPSHOT.jar start/create/drop（执行）
  ```

## 三、小结

本次文章我准备写一个系列，主要针对 openGauss 数据库的各种讲解，希望各位小伙伴予以支持！
