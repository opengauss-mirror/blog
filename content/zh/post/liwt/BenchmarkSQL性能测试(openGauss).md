+++

title = "BenchmarkSQL性能测试(openGauss)"

date = "2024-02-28"

tags = ["openGauss"]

archives = "2024-02"

author = "liwt"

summary = "本文提供openGauss使用BenchmarkSQL进行性能测试的方法和测试数据报告"

+++



一、前言
本文提供openGauss使用BenchmarkSQL进行性能测试的方法和测试数据报告。
BenchmarkSQL，一个JDBC基准测试工具，内嵌了TPC-C测试脚本，支持很多数据库，如PostgreSQL、Oracle和Mysql等。

TPC-C是专门针对联机交易处理系统（OLTP系统）的规范，一般情况下我们也把这类系统称为业务处理系统。几乎所有在OLTP市场提供软硬平台的国外主流厂商都发布了相应的TPC-C测试结果，随着计算机技术的不断发展，这些测试结果也在不断刷新。

二、TPC-C 标准测试概述
1.模拟 5 种事务处理
1）新订单（New-Order）：事务内容：对于任意一个客户端,从固定的仓库随机选取 5-15 件商品,创建新订单.其中 1%的订单要由假想的用户操作失败而回滚。（主要特点：中量级、读写频繁、要求响应快）
2）支付操作(Payment)：事务内容：对于任意一个客户端,从固定的仓库随机选取一个辖区及其内用户,采用随机的金额支付一笔订单,并作相应历史纪录。（主要特点：轻量级，读写频繁，要求响应快）
3）订单状态查询(Order-Status)：事务内容：对于任意一个客户端,从固定的仓库随机选取一个辖区及其内用户,读取其最后一条订单,显示订单内每件商品的状态。（主要特点：中量级，只读频率低，要求响应快）
4）发货(Delivery): 事务内容：对于任意一个客户端,随机选取一个发货包,更新被处理订单的用户余额,并把该订单从新订单中删除。(主要特点：1-10 个批量，读写频率低，较宽松的响应时间)
5）库存状态查询(Stock-Level):事务内容：对于任意一个客户端,从固定的仓库和辖区随机选取最后 20 条订单,查看订单中所有的货物的库存,计算并显示所有库存低于随机生成域值的商品数量。（主要特点：重量级,只读频率低,较宽松的响应时间）
 
每个Warehouse数据量约为：76823.04KB
2.TPC-C 测试指标
TPC-C测试的结果主要有两个指标，即流量指标（Throughput,简称tpmC)和性价比（Price/Performance,简称Price/tpmC)。

1）流量指标(Throughput,简称tpmC)： 按照TPC组织的定义，流量指标描述了系统在执行支付操作、订单状态查询、发货和库存状态查询这4种交易的同时，每分钟可以处理多少个新订单交易。所有交易的响应时间必须满 足TPC-C测试规范的要求，且各种交易数量所占的比例也应该满足TPC-C测试规范的要求。在这种情况下，流量指标值越大说明系统的联机事务处理能力越高。
2）性价比（Price/Performance,简称Price/tpmc)： 即测试系统的整体价格与流量指标的比值，在获得相同的tpmC值的情况下，价格越低越好。

做TPC-C测试的目的主要有两点：
1）贴近生产环境进行实际操作（TPC-C可以提供类似这样的环境）。
2）通过TPC-C测试结果可以清晰的了解数据库的性能等信息。

三、环境介绍
1.服务器信息
主机IP	配置	操作系统	描述
192.168.52.3	1c/4GB/30GB	CentOS Linux release 7.6.1810 (Core)	DB服务器
192.168.52.4	1c/2GB/20GB	CentOS Linux release 7.9.2009 (Core)	BenchmarkSQL服务器

2.软件信息
软件名称	版本	描述
openGauss	3.1.1	关系型(开源)数据库
BenchmarkSQL	5.0	一个JDBC基准测试工具，内嵌了TPC-C测试脚本，支持很多数据库，如PostgreSQL、Oracle和Mysql等。
TPC-C是专门针对联机交易处理系统（OLTP系统）的规范，一般情况下我们也把这类系统称为业务处理系统。
几乎所有在OLTP市场提供软硬平台的国外主流厂商都发布了相应的TPC-C测试结果，
随着计算机技术的不断发展，这些测试结果也在不断刷新。
JDK	java-1.8.0-openjdk	Java开发工具包，它包含了Java开发所需的所有核心组件和工具。JDK是构建Java应用程序、Java平台和Java Web服务的基础。
R语言	3.6.3	R语言(generateReport.sh脚本需要) ，支持png报告图片生成
htop	3.3.0	htop 是一个交互式的进程监控工具，主要用于查看和管理运行中的进程。
它以用户友好的方式显示进程列表，包括进程的 CPU、内存和交换空间使用情况，以及进程树结构。
htop 允许你通过键盘快捷键来进行排序、搜索、终止进程等操作。
htop 提供了颜色和动态更新的界面，更直观地显示资源使用情况。
htop 适合实时查看和管理运行中的进程，特别是在终端环境中。
ant	Apache Ant(TM) version 1.9.4	一个用于自动化构建过程的工具。它主要用于Java应用程序，但也可以用于其他类型的项目。Ant使用XML文件（通常称为build.xml）来描述构建过程，包括编译源代码、运行测试、打包应用程序等任务。
python	2.7.5	数据库服务器，BenchmarkSQL对应的python版本不能过高，否则存在兼容性报错

四、配置BenchmarkSQL主机
1. 根据官方文档，安装必要的软件包
	配置YUM源
(若仅使用华为云内网的YUM源(http://mirrors.myhuaweicloud.com/repo/CentOS-Base-7.repo)，会造成软件版本依赖问题)
## 配置华为YUM源
mkdir -p /etc/yum.repos.d/repo_bak/
mv /etc/yum.repos.d/*.repo /etc/yum.repos.d/repo_bak/
wget -O /etc/yum.repos.d/CentOS-Base.repo https://repo.huaweicloud.com/repository/conf/CentOS-7-reg.repo

## 配置Epel源
yum remove  -y  epel-release
yum install -y  https://repo.huaweicloud.com/epel/epel-release-latest-7.noarch.rpm
cd /etc/yum.repos.d/
rm -rf epel-testing.repo

sed -i "s/#baseurl/baseurl/g" /etc/yum.repos.d/epel.repo
sed -i "s/mirrorlist/#mirrorlist/g" /etc/yum.repos.d/epel.repo
sed -i "s@http://download.fedoraproject.org/pub@https://repo.huaweicloud.com@g" /etc/yum.repos.d/epel.repo

## 顺刷新缓存
yum clean all
yum makecache
yum repolist all

	安装依赖软件包
yum install gcc glibc-headers gcc-c++ gcc-gfortran readline-devel  libXt-devel pcre-devel libcurl libcurl-devel -y
yum install ncurses ncurses-devel autoconf automake zlib zlib-devel bzip2 bzip2-devel xz-devel -y
yum install java-1.8.0-openjdk  ant  -y

	安装R语言(generateReport.sh脚本需要)
yum install pango-devel pango libpng-devel cairo cairo-devel  ## 使R语言支持png图片，否则报告生成有问题
wget https://mirror.bjtu.edu.cn/cran/src/base/R-3/R-3.6.3.tar.gz
tar -zxf R-3.6.3.tar.gz
cd R-3.6.3
./configure && make && make install

## 如果需要重新安装，请参考以下步骤 ##
make uninstall
./configure
make
make install

	编译安装htop(服务器端和客户端都安装)
xz –d htop-3.3.0.tar.xz
tar xvf htop-3.3.0.tar
cd htop-3.0.5
./autogen.sh && ./configure && make && make install

	检查安装情况(java/ant/htop)
[root@localhost ~]# ant -version
Apache Ant(TM) version 1.9.4 compiled on November 5 2018

[root@localhost ~]# java -version
openjdk version "1.8.0_402"
OpenJDK Runtime Environment (build 1.8.0_402-b06)
OpenJDK 64-Bit Server VM (build 25.402-b06, mixed mode)

[root@localhost ~]# htop --version
htop 3.3.0

[root@localhost ~]# R --version
R version 3.6.0 (2019-04-26) -- "Planting of a Tree"
Copyright (C) 2019 The R Foundation for Statistical Computing
Platform: x86_64-redhat-linux-gnu (64-bit)

2. 准备软件
	解压软件及JDBC驱动（解压对应的软件包）
unzip benchmarksql-5.0.zip
tar -zxvf openGauss-1.1.0-JDBC.tar.gz

	替换默认的postgresql驱动
cd /root/soft/benchmarksql-5.0/lib/postgres/
mv postgresql-9.3-1102.jdbc41.jar postgresql-9.3-1102.jdbc41.jar.bak
mv /soft/postgresql.jar  .

	使用ant编译
cd /root/soft/benchmarksql-5.0/
[root@localhost benchmarksql-5.0]# ant
Buildfile: /root/soft/benchmarksql-5.0/build.xml

init:
    [mkdir] Created dir: /root/soft/benchmarksql-5.0/build

compile:
    [javac] Compiling 11 source files to /root/soft/benchmarksql-5.0/build

dist:
    [mkdir] Created dir: /root/soft/benchmarksql-5.0/dist
      [jar] Building jar: /root/soft/benchmarksql-5.0/dist/BenchmarkSQL-5.0.jar

BUILD SUCCESSFUL
Total time: 2 seconds

3. 配置软件
	配置props文件(配置文件切忌多余空格，否则会出现各种错误)
说明：进入run目录，会看到多个不同后缀名的props文件，不同的文件配置不同的数据库，由于我们需要压测postgresql和openGauss，openGauss兼容postgresql，需要配置props.pg文件。cp props.pg props.opengauss在配置文件中需要修改的包括conn,user, password(这三项用于连接指定的数据库，因此需要提前在postgresql中创建好对应的DB以及用户) 
cd /root/soft/benchmarksql-5.0/run
[root@localhost run]# cp props.pg props.openGauss
[root@localhost run]# vi props.openGauss
db=postgres
driver=org.postgresql.Driver
conn=jdbc:postgresql://192.168.52.3:26000/tpcc
user=benchmarksql
password=P@ssw0rdabc
warehouses=2
loadWorkers=4
terminals=2
runTxnsPerTerminal=0
runMins=5
limitTxnsPerMin=0
terminalWarehouseFixed=false
newOrderWeight=45
paymentWeight=43
orderStatusWeight=4
deliveryWeight=4
stockLevelWeight=4
resultDirectory=my_result_%tY-%tm-%td_%tH%tM%tS
osCollectorScript=./misc/os_collector_linux.py
osCollectorInterval=1
osCollectorSSHAddr=root@192.168.52.3
osCollectorDevices=net_ens33 blk_sda

注释：
db=postgres 指定数据库类型，当前类型为postgres
driver=org.postgresql.Driver postgres数据库的JDBC驱动
conn=jdbc:postgresql://192.168.1.71:5496/benchmarksql postgres的连接字符串，格式为：conn=jdbc:postgresql://IP:端口/库名
user=benchmarksql 连接postgres的用户名
password=PostgreSQL5432 连接postgres的用户名的密码
warehouses=1 仓库数量，每个warehouse数据量大概在100MB左右，那么数据库大小为1000MB左右，默认1个仓库
loadWorkers=4 数据库初始化数据时候的进程数，默认4个load加载进程
terminals=1 指定终端数量，默认1个终端
runTxnsPerTerminal=10 指定压测每个终端执行的事务数量。如果该参数配置为非0时，下面的runMins参数必须设置为0
runMins=0  指定压测的时长（单位：分钟）。如果该值设置为非0值时，runTxnsPerTerminal参数必须设置为0。
limitTxnsPerMin=300 每分钟事务总数限制，该参数主要控制每分钟处理的事务数，事务数受terminals参数的影响，limitTxnsPerMin/terminals的值必须是正整数。
terminalWarehouseFixed=true 终端和仓库的绑定模式，设置为true时可以运行4.x兼容模式，意思为每个终端都有一个固定的仓库。设置为false时可以均匀的使用数据库整体配置。TPCC规定每个终端都必须有一个绑定的仓库，所以一般使用默认值true。
下面五个值的总和必须等于100，默认值为：45, 43, 4, 4，4 ，与TPC-C测试定义的比例一致，实际操作过程中，可以调整比重来适应各种场景。
newOrderWeight=45  新订单事务占总事务的45%
paymentWeight=43    支付订单事务占总事务的43%
orderStatusWeight=4  订单状态事务占总事务的4%
deliveryWeight=4        到货日期事务占总事务的4%
stockLevelWeight=4    查看现存货品的事务占总事务的4%
 resultDirectory=my_result_%tY-%tm-%td_%tH%tM%tS 压测期间收集系统性能数据的目录（无需修改）
osCollectorScript=./misc/os_collector_linux.py 操作系统性能收集脚本（无需修改）
osCollectorInterval=1 操作系统收集操作间隔，默认为1秒
osCollectorSSHAddr=user@dbhost 需要收集系统性能的主机
osCollectorDevices=net_eth0 blk_sda 操作系统中被收集服务器的网卡名称和磁盘名称，根据个人环境进行调整

	配置tableCreates.sql脚本（可适当调整表的表空间分布，充分利用多块磁盘的IO)
cd /root/soft/benchmarksql-5.0/run/sql.common
[root@localhost sql.common]# cp tableCreates.sql tableCreates.sql.bak
[root@localhost sql.common]# vi tableCreates.sql
--CREATE TABLESPACE tbs1 location '/home/omm/data/tbs1';
--CREATE TABLESPACE tbs2 location '/home/omm/data/tbs2';

create table bmsql_config (
  cfg_name    varchar(30) primary key,
  cfg_value   varchar(50)
);

create table bmsql_warehouse (
  w_id        integer   not null,
  w_ytd       decimal(12,2),
  w_tax       decimal(4,4),
  w_name      varchar(10),
  w_street_1  varchar(20),
  w_street_2  varchar(20),
  w_city      varchar(20),
  w_state     char(2),
  w_zip       char(9)
);

create table bmsql_district (
  d_w_id       integer       not null,
  d_id         integer       not null,
  d_ytd        decimal(12,2),
  d_tax        decimal(4,4),
  d_next_o_id  integer,
  d_name       varchar(10),
  d_street_1   varchar(20),
  d_street_2   varchar(20),
  d_city       varchar(20),
  d_state      char(2),
  d_zip        char(9)
);

create table bmsql_customer (
  c_w_id         integer        not null,
  c_d_id         integer        not null,
  c_id           integer        not null,
  c_discount     decimal(4,4),
  c_credit       char(2),
  c_last         varchar(16),
  c_first        varchar(16),
  c_credit_lim   decimal(12,2),
  c_balance      decimal(12,2),
  c_ytd_payment  decimal(12,2),
  c_payment_cnt  integer,
  c_delivery_cnt integer,
  c_street_1     varchar(20),
  c_street_2     varchar(20),
  c_city         varchar(20),
  c_state        char(2),
  c_zip          char(9),
  c_phone        char(16),
  c_since        timestamp,
  c_middle       char(2),
  c_data         varchar(500)
);

create sequence bmsql_hist_id_seq;

create table bmsql_history (
  hist_id  integer,
  h_c_id   integer,
  h_c_d_id integer,
  h_c_w_id integer,
  h_d_id   integer,
  h_w_id   integer,
  h_date   timestamp,
  h_amount decimal(6,2),
  h_data   varchar(24)
);

create table bmsql_new_order (
  no_w_id  integer   not null,
  no_d_id  integer   not null,
  no_o_id  integer   not null
);

create table bmsql_oorder (
  o_w_id       integer      not null,
  o_d_id       integer      not null,
  o_id         integer      not null,
  o_c_id       integer,
  o_carrier_id integer,
  o_ol_cnt     integer,
  o_all_local  integer,
  o_entry_d    timestamp
);

create table bmsql_order_line (
  ol_w_id         integer   not null,
  ol_d_id         integer   not null,
  ol_o_id         integer   not null,
  ol_number       integer   not null,
  ol_i_id         integer   not null,
  ol_delivery_d   timestamp,
  ol_amount       decimal(6,2),
  ol_supply_w_id  integer,
  ol_quantity     integer,
  ol_dist_info    char(24)
);

create table bmsql_item (
  i_id     integer      not null,
  i_name   varchar(24),
  i_price  decimal(5,2),
  i_data   varchar(50),
  i_im_id  integer
);

create table bmsql_stock (
  s_w_id       integer       not null,
  s_i_id       integer       not null,
  s_quantity   integer,
  s_ytd        integer,
  s_order_cnt  integer,
  s_remote_cnt integer,
  s_data       varchar(50),
  s_dist_01    char(24),
  s_dist_02    char(24),
  s_dist_03    char(24),
  s_dist_04    char(24),
  s_dist_05    char(24),
  s_dist_06    char(24),
  s_dist_07    char(24),
  s_dist_08    char(24),
  s_dist_09    char(24),
  s_dist_10    char(24)
);

4. 配置与数据库服务器的ssh互信
执行如下命令行：
ssh-keygen -t rsa
ssh-copy-id root@192.168.52.3     #password：P@ssw0rd123


五、配置openGauss DB主机
1. 创建数据库及用户(与前面props.openGauss文件配置保持一致)
[root@node1 ~]# su omm
[omm@node1 root]$ gsql -d postgres -p 26000 -ar
openGauss=# create user benchmarksql with sysadmin identified by 'P@ssw0rdabc';
CREATE ROLE
openGauss=# create database tpcc owner =benchmarksql encoding='UTF8';
CREATE DATABASE

2. 配置pg_hba.conf
[omm@prod ~]$ gs_guc reload -N all -I all -h "host  tpcc  benchmarksql  192.168.52.4/32  sha256"

/gaussdb/data/db1/pg_hba.conf
 

3. 备份数据目录，测试完毕后可以快速恢复
[omm@node1 ~]$ gs_ctl stop -D /gaussdb/data/db1
[omm@node1 ~]$ cp -r /gaussdb/data/db1 /gaussdb/data/db1_bak
[omm@node1 ~]$ gs_ctl start -D /gaussdb/data/db1

六、BenchmarkSQL主机发起测试
1. 导入测试数据
cd  /root/soft/benchmarksql-5.0/run
[root@localhost run]#  ./runDatabaseBuild.sh props.openGauss    ## 执行前，请务必将props.openGauss文件中的所有注释和多余空格删除，否则可能报错
 

特别说明，上一步脚本执行后，请检查库表是否创建、数据是否加载成功，如过未成功，请查看.sh脚本及执行日志进行判断，如果有必要则请手工执行加载脚本，如下：
[root@localhost run]# ./runLoader.sh props.openGauss
2. 运行TPCC测试
[root@localhost run]# ./runBenchmark.sh props.openGauss
19:04:56,061 [main] INFO   jTPCC : Term-00, 
19:04:56,070 [main] INFO   jTPCC : Term-00, +-------------------------------------------------------------+
19:04:56,070 [main] INFO   jTPCC : Term-00,      BenchmarkSQL v5.0
19:04:56,070 [main] INFO   jTPCC : Term-00, +-------------------------------------------------------------+
19:04:56,070 [main] INFO   jTPCC : Term-00,  (c) 2003, Raul Barbosa
19:04:56,070 [main] INFO   jTPCC : Term-00,  (c) 2004-2016, Denis Lussier
19:04:56,072 [main] INFO   jTPCC : Term-00,  (c) 2016, Jan Wieck
19:04:56,072 [main] INFO   jTPCC : Term-00, +-------------------------------------------------------------+
19:04:56,072 [main] INFO   jTPCC : Term-00, 
19:04:56,072 [main] INFO   jTPCC : Term-00, db=postgres
19:04:56,072 [main] INFO   jTPCC : Term-00, driver=org.postgresql.Driver
19:04:56,072 [main] INFO   jTPCC : Term-00, conn=jdbc:postgresql://192.168.52.3:26000/tpcc
19:04:56,072 [main] INFO   jTPCC : Term-00, user=benchmarksql
19:04:56,072 [main] INFO   jTPCC : Term-00, 
19:04:56,072 [main] INFO   jTPCC : Term-00, warehouses=2
19:04:56,072 [main] INFO   jTPCC : Term-00, terminals=2
19:04:56,073 [main] INFO   jTPCC : Term-00, runMins=5
19:04:56,073 [main] INFO   jTPCC : Term-00, limitTxnsPerMin=0
19:04:56,073 [main] INFO   jTPCC : Term-00, terminalWarehouseFixed=false
19:04:56,073 [main] INFO   jTPCC : Term-00, 
19:04:56,073 [main] INFO   jTPCC : Term-00, newOrderWeight=45
19:04:56,073 [main] INFO   jTPCC : Term-00, paymentWeight=43
19:04:56,074 [main] INFO   jTPCC : Term-00, orderStatusWeight=4
19:04:56,074 [main] INFO   jTPCC : Term-00, deliveryWeight=4
19:04:56,074 [main] INFO   jTPCC : Term-00, stockLevelWeight=4
19:04:56,074 [main] INFO   jTPCC : Term-00, 
19:04:56,074 [main] INFO   jTPCC : Term-00, resultDirectory=my_result_%tY-%tm-%td_%tH%tM%tS
19:04:56,074 [main] INFO   jTPCC : Term-00, osCollectorScript=./misc/os_collector_linux.py
19:04:56,074 [main] INFO   jTPCC : Term-00, 
19:04:56,089 [main] INFO   jTPCC : Term-00, copied props.openGauss to my_result_2024-02-28_190456/run.properties
19:04:56,089 [main] INFO   jTPCC : Term-00, created my_result_2024-02-28_190456/data/runInfo.csv for runID 34
19:04:56,089 [main] INFO   jTPCC : Term-00, writing per transaction results to my_result_2024-02-28_190456/data/result.csv
19:04:56,090 [main] INFO   jTPCC : Term-00, osCollectorScript=./misc/os_collector_linux.py
19:04:56,090 [main] INFO   jTPCC : Term-00, osCollectorInterval=1
19:04:56,090 [main] INFO   jTPCC : Term-00, osCollectorSSHAddr=root@192.168.52.3
19:04:56,090 [main] INFO   jTPCC : Term-00, osCollectorDevices=net_ens33 blk_sda
19:04:56,169 [main] INFO   jTPCC : Term-00,
二月 28, 2024 7:04:56 下午 org.postgresql.core.v3.ConnectionFactoryImpl openConnectionImpl
信息: [93b50383-dbd7-400a-a99d-86f4ba0902a0] Try to connect. IP: 192.168.52.3:26000
二月 28, 2024 7:05:06 下午 org.postgresql.core.v3.ConnectionFactoryImpl openConnectionImpl
信息: [192.168.52.4:58872/192.168.52.3:26000] Connection is established. ID: 93b50383-dbd7-400a-a99d-86f4ba0902a0
二月 28, 2024 7:05:06 下午 org.postgresql.core.v3.ConnectionFactoryImpl openConnectionImpl
信息: Connect complete. ID: 93b50383-dbd7-400a-a99d-86f4ba0902a0
19:05:06,307 [main] INFO   jTPCC : Term-00, C value for C_LAST during load: 173
19:05:06,307 [main] INFO   jTPCC : Term-00, C value for C_LAST this run:    246
19:05:06,307 [main] INFO   jTPCC : Term-00,                                                                                    二月 28, 2024 7:05:06 下午 org.postgresql.core.v3.ConnectionFactoryImpl openConnectionImplMB          
信息: [f43d5730-4a2d-4679-bf40-8ca74c9a2498] Try to connect. IP: 192.168.52.3:26000
二月 28, 2024 7:05:16 下午 org.postgresql.core.v3.ConnectionFactoryImpl openConnectionImpl
信息: [192.168.52.4:58874/192.168.52.3:26000] Connection is established. ID: f43d5730-4a2d-4679-bf40-8ca74c9a2498
二月 28, 2024 7:05:16 下午 org.postgresql.core.v3.ConnectionFactoryImpl openConnectionImpl
信息: Connect complete. ID: f43d5730-4a2d-4679-bf40-8ca74c9a2498
二月 28, 2024 7:05:16 下午 org.postgresql.core.v3.ConnectionFactoryImpl openConnectionImpl
信息: [204511eb-81ef-4c16-a0ab-9f64a4b2fa55] Try to connect. IP: 192.168.52.3:26000
二月 28, 2024 7:05:26 下午 org.postgresql.core.v3.ConnectionFactoryImpl openConnectionImpl
信息: [192.168.52.4:58876/192.168.52.3:26000] Connection is established. ID: 204511eTerm-00, Running Average tpmTOTAL: 7005.81  19:10:26,411 [Thread-2] INFO   jTPCC : Term-00, / 29MB                                                                          19:10:26,412 [Thread-2] INFO   jTPCC : Term-00,                                                                                 19:10:26,412 [Thread-2] INFO   jTPCC : Term-00, Measured tpmC (NewOrders) = 3160.65                     
19:10:26,413 [Thread-2] INFO   jTPCC : Term-00, Measured tpmTOTAL = 7005.82
19:10:26,413 [Thread-2] INFO   jTPCC : Term-00, Session Start     = 2024-02-28 19:05:26
19:10:26,413 [Thread-2] INFO   jTPCC : Term-00, Session End       = 2024-02-28 19:10:26
19:10:26,413 [Thread-2] INFO   jTPCC : Term-00, Transaction Count = 35032

说明：执行前，请务必将props.openGauss.1000w文件的所有注释和多余空格删除，否则可能报错。 terminals参数设置有大小范围要求，太大会报错：ERROR  jTPCC : Term-00, Invalid number of terminals!y


重跑：./runDatabaseDestroy.sh props.opengauss  //清理数据。或将5.3中的备份恢复。

七、生成报告查看测试结果
1. 生成报告
测试结束后，run目录下会生成一个新目录：my_result_%tY-%tm-%td_%tH%tM%tS。使用 generateReport.sh脚本创建具有图形的 HTML 文件：
[root@localhost run]# ./generateReport.sh my_result_2024-02-28_190456/
Generating my_result_2024-02-28_190456//tpm_nopm.png ... OK
Generating my_result_2024-02-28_190456//latency.png ... OK
Generating my_result_2024-02-28_190456//cpu_utilization.png ... OK
Generating my_result_2024-02-28_190456//dirty_buffers.png ... OK
Generating my_result_2024-02-28_190456//blk_sda_iops.png ... OK
Generating my_result_2024-02-28_190456//blk_sda_kbps.png ... OK
Generating my_result_2024-02-28_190456//net_ens33_iops.png ... OK
Generating my_result_2024-02-28_190456//net_ens33_kbps.png ... OK
Generating my_result_2024-02-28_190456//report.html ... OK

随后会在my_result_* 目录下生成一个html文件和数张图片，下载到本地，在浏览器中打开report.html，可以看到tpmc的曲线和系统硬件监控信息
 
2. html报告查看
1. - 这里是列表文本