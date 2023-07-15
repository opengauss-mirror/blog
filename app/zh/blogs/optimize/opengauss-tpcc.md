---
title: 'benchmark使用'
date: '2020-07-25'
category: 'blog'
tags: ['benchmark使用']
archives: '2020-07'
author: 'zhijing'
summary: 'benchmark使用'
img: '/zh/blogs/optimize/title/img6.png'
times: '19:30'
---

### 概述

TPC-C 是一种衡量联机事务处理 OLTP 能力的测试标准，模拟了在线订单处理系统应用环境，可以通过 benchmark 工具，来测试数据库的性能指标。\
TPC-C 测试指标为 tpmC，每分钟处理订单交易的数量。值越大表示数据库性能越优。\
本文介绍使用 benchmark 来跑 opengauss 数据库步骤，以及`htop iostat`两个服务器性能监控工具。

### java 安装配置

下载 jdk 到服务器并解压(例如解压到目录/usr/share/java/jdk1.8.0_232)；\
`vim /etc/profile` 增加环境变量：

```shell

export JAVA_HOME=/usr/share/java/jdk1.8.0_232
export JRE_HOME=${JAVA_HOME}/jre
export CLASSPATH=.:${JAVA_HOME}/lib:${JRE_HOME}/jre
export PATH=${PATH}:${JAVA_HOME}/bin
export JAVA_TOOL_OPTIONS=-Dfile.encoding=UTF8

```

导入环境变量 `source /etc/profile`
输入 `java -version` 查看是否配置成功

### ant 安装配置

下载 ant 并解压（解压路径例如 /usr/share/ant/apache-ant-1.10.8），
`vim /etc/profile` 增加环境变量：

```shell

export ANT_HOME=/usr/share/ant/apache-ant-1.10.8
export PATH=${PATH}:${ANT_HOME}/bin

```

导入环境变量 `source /etc/profile`
输入 `ant -version` 查看是否配置成功

### benchmark 安装使用

下载 benchmark

[点击benchmark 下载](./images/benchmarksql-5.0.zip)，在linux服务器上解压。

**1. 替换 jdbc 驱动 jar 包**

进入到解压后的目录`benchmarksql-5.0/lib/postgres`下，从官网下载对应的 jdbc 驱动解压出来后放到该目录下：

<img src='./images/tpcc1.png'>

**2. 使用 ant 编译 benchmark**

进入到 benchmark 安装的根目录下，输入 ant，进行编译：

```shell

cd /opt/benchmark/benchmarksql-5.0/
ant

```

<img src='./images/tpcc2.png'>

**3. 创建 tpcc 数据库以及数据库用户**

登录到目标数据库里面：

```

create database tpccdb;
create user tpcc with password '<password>';
grant all privilege to tpcc;

```

**4. 配置 benchmark 的 props.pg**

进入到`benchmarksql-5.0/run`目录下，修改 props.pg 文件数据库配置内容：

```
db=tpccdb
driver=org.postgresql.Driver
conn=jdbc:postgresql://<hostip>:<dbport>/tpccdb
user=tpcc
password=<password>
```

**5. 运行 benchmark**

```shell

sh runDatabaseBuild.sh props.pg  ## 生成测试数据
sh runBenchmark.sh props.pg      ## TPCC测试

```

### htop 工具

htop 是 linux 上面一个监控工具,可以认为是加强版的 top，tpcc 运行过程中，推荐使用 htop 进行监控资源状态

htop 安装，使用 yum 源一键安装

```shell

yum install htop

```

使用的时候，输入 `htop` 就可以进入到 htop 监控窗口

<img src='./images/htop.png'>

### iostat 工具

iostat 工具对系统磁盘进行监控，分析磁盘的读写状态\
安装：

```shell

yum install sysstat

```

使用时候，输入 `iostat` 就可以查看磁盘读写状态
