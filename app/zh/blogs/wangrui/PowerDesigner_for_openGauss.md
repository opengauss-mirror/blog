---
title: 'PowerDesigner使用JDBC连接openGauss指导'
date: '2021-03-16'
category: 'blog'
tags: ['PowerDesigner使用JDBC连接openGauss指导']
archives: '2021-03-16'
author: 'wangrui'
summary: 'PowerDesigner使用JDBC连接openGauss指导'
img: '/zh/blogs/xingchen/title/img1.png'
times: '9:30'
---

# PowerDesigner 简介

PowerDesigner 是 Sybase 的企业建模和设计解决方案，采用模型驱动方法，将业务与 IT 结合起来，可帮助部署有效的企业体系架构，并为研发生命周期管理提供强大的分析与设计技术。
在部分业务场景下，没有数据库 PDM 文件，数据库中表之间的各种关系无法直观地看清楚，此时可以使用 PowerDesigner 进行逆向工程，从已有的数据库生成 PDM 文件。

# 环境准备

(1)下载并安装 PowerDesigner 16.6 版本，进入{PowerDesigner_insatll_dir}/Resource Files/DBMS，导入 opengauss.xdb 文件；

[openGauss 配置文件下载](./images/opengauss.xdb)

(2)输入 cmd 命令“java –version”确认本地 JDK 版本在 1.5 以上，低于 1.5 需要在系统环境变量中配置 JAVA_HOME 和 CLASSPATH；

(3)进入 openGauss 官网https://opengauss.org/ ，下载对应的 JDBC 版本到本地；

# PowerDesigner 配置

(1)打开 PowerDesigner 软件，“File”->“Reverse Engineer”->“Database…”
<img src='./images/image002.jpg'>

(2)选择“General”页签，输入自定义 Model name，在 DBMS 下拉框中选择数据库类型 openGauss；
<img src='./images/image003.jpg'>

(3)选择“Using a data source”，点击右侧按编辑数据库连接信息；
<img src='./images/image004.jpg'>

(4)选择“Connection profile”，首次连接需点击“Configure”进行配置；
<img src='./images/image005.jpg'>

(5)新增连接配置文件，配置项如下所示：
Connection profile name: 配置文件名称
Directory: 配置文件本地保存路径
Description:配置文件描述，可根据实际用途填写
Connection type：连接方式，此处选择 JDBC
DBMS type：数据库类型，提供大部分主流数据库选择，此处选择 PostgreSQL
User name：登录数据库的用户名，此处可以不填
JDBC driver class：指定驱动类，使用默认的 org.postgresql.Driver
JDBC connection URL：连接 URL，格式 jdbc:postgresql://{host}:{port}/{database}
JDBC driver jar files：指定 jar 包路径，点击右侧选择下载的 opengauss 驱动
<img src='./images/image006.jpg'>

(6)点击左下方的“Test Connection”测试连接，注意需要在数据库服务端将客户端 IP 写入白名单，同时使用普通用户连接；
<img src='./images/image007.jpg'>

(7)出现提示“Connection test successful”时，测试连接成功。

# 常见问题

(1)Non SQL Error : Could not load class com.postgresql.jdbc.Drive.
错误原因：无法找到 JDBC 驱动；
解决方法：可以在系统环境变量中配置 CLASSPATH，将 jar 包路径写入，并重启 PowerDesigner；
<img src='./images/image008.jpg'>

(2)Fatal Error. Unable to initialize DatabaseMetaData class.
错误原因：本地 JAVA 环境错误；
解决方法：在任务管理器中查看 PowerDesigner 版本为 32 位，需要 32 位的 JDK 环境，重新安装 32 位 JDK 并重启 PowerDesigner；
<img src='./images/image009.jpg'>

(3)Connection to 90.90.52.60:5432 refused. Check that the hostname and port are correct and that the postmaster is accepting TCP/IP connections.
错误原因：数据库拒绝连接；
解决方法：
1、确认 URL 中 IP 和 port 是否填写正确；
2、确认数据库监听地址是否正确；
3、确认服务器防火墙是否关闭。
