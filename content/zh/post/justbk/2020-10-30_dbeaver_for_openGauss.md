+++
title = "Dbeaver适配openGauss使用指导书"
date = "2020-10-30"
tags = ["openGauss社区开发入门"]
archives = "2020-10"
author = "justbk"
summary = "openGauss社区开发入门"
times = "17:30"

+++

## 一、Dbeaver简介

Dbeaver是一个跨平台的数据库开发者工具，包括SQL编程，数据库管理和分析。它支持任意适配JDBC驱动的数据库系统。同时该工具也支持一些非JDBC的数据源，如MongoDB, Cassandra, Redis, DynamoDB等。
⦁	该工具提供了许多强大的特性，诸如元数据编辑器、SQL编辑器、富文本数据编辑器、ERD、数据导入/导出/迁移，SQL执行计划等
⦁	该工具基于eclipse平台开发
⦁	适配的数据库有MySQL/MariaDB, PostgreSQL, Greenplum, Oracle, DB2 LUW, Exasol, SQL Server, Sybase/SAP ASE, SQLite, Firebird, H2, HSQLDB, Derby, Teradata, Vertica, Netezza, Informix等

## 二、Dbeaver下载

  Dbeaver是一款开源软件，代码托管在github上:
源代码下载:[下载](https://github.com/dbeaver/dbeaver). 
此处可以直接下载二进制文件:[下载](https://github.com/dbeaver/dbeaver/releases)

## 三、依赖包下载

1. Dbeaver依赖jre 1.8及以上 (请自行下载或前往[链接](https://adoptopenjdk.net/?variant=openjdk8&jvmVariant=hotspot))
    备注:免安装版必须安装jre, windows installer版本已经自带jre

   2.下载openGauss JDBC驱动到本地

​      从opengauss.org官网获取:[链接](https://opengauss.org/zh/download.html)

## 四、Dbeaver配置

### 1. 启动Dbeaver.exe，并选择菜单->数据库->驱动管理器，在弹出对话框中，选择新建:

![image-20201031160917008](D:\z00229791\openGauss\code\blog\content\zh\post\justbk\image\image-20201031160917008.png)

### 2. 添加JDBC驱动
#### a. 填写新建驱动名称->选择JDBC驱动文件->选择JDBC Driver类，如下图：

![image-20201031161118343](D:\z00229791\openGauss\code\blog\content\zh\post\justbk\image\image-20201031161118343.png)

#### b. 填写URL模板，值为: jdbc:postgresql://{host}:{port}/{database} ，然后勾选嵌入，其他复选框不选择，然后确认，添加驱动即完成，如下图:

![image-20201031161200535](D:\z00229791\openGauss\code\blog\content\zh\post\justbk\image\image-20201031161200535.png)

## 五、Dbeaver连接

### 1. 选择菜单->数据库->新建连接， 在弹出的框中搜索上一步中新建的JDBC驱动名,选择后点击下一步,如下图示:

![image-20201031161304090](D:\z00229791\openGauss\code\blog\content\zh\post\justbk\image\image-20201031161304090.png)

### 2. 在弹出框中填写openGauss 主机地址、端口、将要连接的数据库以及认证用户名和密码，点击测试链接验证是否可正确连接，如图示：

![image-20201031161348486](D:\z00229791\openGauss\code\blog\content\zh\post\justbk\image\image-20201031161348486.png)

### 3. 测试结果OK后点击确认，并点击完成，则连接成功

![image-20201031161423966](D:\z00229791\openGauss\code\blog\content\zh\post\justbk\image\image-20201031161423966.png)

### 4. 左边的导航栏即可见数据库已经连接成功

![image-20201031161451687](D:\z00229791\openGauss\code\blog\content\zh\post\justbk\image\image-20201031161451687.png)

## 六、Dbeaver使用

SQL编写:选中要使用的数据库，并按下F3(或使用菜单->SQL编辑器->SQL编辑器)即可打开SQL编写器，可以在编辑器中编写SQL和执行。

![image-20201031161524533](D:\z00229791\openGauss\code\blog\content\zh\post\justbk\image\image-20201031161524533.png)

其他功能使用和其他客户端工具相似，请自行探索。

## 七、常见问题

### 1. Javax.xml.bind.DatatypeConverter转换出错，如下图

![image-20201031161628317](D:\z00229791\openGauss\code\blog\content\zh\post\justbk\image\image-20201031161628317.png)

**解决方法 **: 本地安装的java版本无javax.xml.bind*.jar这个包， 可以在添加JDBC驱动jar包时额外增加此包:[链接](https://mvnrepository.com/artifact/javax.xml.bind/jaxb-api/2.2.2)。

也可以使用maven下载:

`<!-- https://mvnrepository.com/artifact/javax.xml.bind/jaxb-api -->
<dependency>
    <groupId>javax.xml.bind</groupId>
    <artifactId>jaxb-api</artifactId>
    <version>2.2.2</version>
</dependency>`

### 2. 提示No suitable driver found for jdbc:postgresql://xxx

![image-20201031164019085](D:\z00229791\openGauss\code\blog\content\zh\post\justbk\image\image-20201031164019085.png)

**解决方法**:在添加JDBC驱动时不要勾选 ‘Use legacy JDBC instantiation’:

![image-20201031164050597](D:\z00229791\openGauss\code\blog\content\zh\post\justbk\image\image-20201031164050597.png)