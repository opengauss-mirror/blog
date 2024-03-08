~~~shell
title: 'datakit搭建部署'
date: '2024-3-7'
category: 'blog'
tags: ['datakit搭建部署']
archives: '2024-3-7'
author: 'xiaqi'
summary: 'datakit搭建部署'
times: '19:30'
~~~

## datakit搭建部署

### 1.数据库版本及配置

~~~shell
[root@hostname ~]# uname -a
Linux hostname 3.10.0-1160.53.1.el7.x86_64 #1 SMP Fri Jan 14 13:59:45 UTC 2022 x86_64 x86_64 x86_64 GNU/Linux
[root@hostname ~]# uanme -a
-bash: uanme: command not found
[root@hostname ~]# cat /etc/os-release
NAME="CentOS Linux"
VERSION="7 (Core)"
ID="centos"
ID_LIKE="rhel fedora"
VERSION_ID="7"
PRETTY_NAME="CentOS Linux 7 (Core)"
ANSI_COLOR="0;31"
CPE_NAME="cpe:/o:centos:centos:7"
HOME_URL="https://www.centos.org/"
BUG_REPORT_URL="https://bugs.centos.org/"

CENTOS_MANTISBT_PROJECT="CentOS-7"
CENTOS_MANTISBT_PROJECT_VERSION="7"
REDHAT_SUPPORT_PRODUCT="centos"
REDHAT_SUPPORT_PRODUCT_VERSION="7"

[root@hostname ~]# uname -a
Linux hostname 3.10.0-1160.53.1.el7.x86_64 #1 SMP Fri Jan 14 13:59:45 UTC 2022 x86_64 x86_64 x86_64 GNU/Linux

[xq_1127@hostname ~]$ gs_om -t status --detail
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

    node    node_ip         port      instance                                state
---------------------------------------------------------------------------------------------------
1  hostname 0.0.0.0    45678      6001 /data2/xiaqi/openGauss/data/dn1   P Primary Normal
[xq_1127@hostname ~]$ gaussdb -V
gaussdb (openGauss 3.0.5 build b54d05de) compiled at 2023-09-23 09:26:03 commit 0 last mr
~~~



### 2.创建所需要库和用户

~~~shell
[xq_1127@hostname ~]$ gsql -d postgres -p 45678 -r
gsql ((openGauss 3.0.5 build b54d05de) compiled at 2023-09-23 09:26:03 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=# create database datakit;
CREATE DATABASE
openGauss=# create user datakit identified by "db@123";
CREATE ROLE
openGauss=# grant all privileges to datakit;
ALTER ROLE
openGauss=# \q

~~~



### 3.查看该环境的JAVA版本

​     （如果版本低于 Java 11+ ，请下载高版本 ，下载链接： https://jdk.java.net/java-se-ri/11

​         下载完成后配置环境变量 ：

​          *export  JAVA_HOME=/data/../jdk-11.0.21*

​          *export  PATH=$JAVA_HOME/bin:$PATH*

​           ）

~~~shell
[xq_1127@hostname ~]$ java -version
openjdk version "11.0.21" 2023-10-17 LTS
OpenJDK Runtime Environment (Red_Hat-11.0.21.0.9-1.el7_9) (build 11.0.21+9-LTS)
OpenJDK 64-Bit Server VM (Red_Hat-11.0.21.0.9-1.el7_9) (build 11.0.21+9-LTS, mixed mode, sharing)

~~~



### 4.下载datakit包并解压

~~~shell
[xq_1127@hostname datakit]$ ll
total 548472
-rw-r--r-- 1 root root 561633710 Nov 27 15:06 Datakit-5.1.0.tar.gz
[xq_1127@hostname datakit]$ tar -zxvf Datakit-5.1.0.tar.gz
[xq_1127@hostname datakit]$ ll
total 640704
-rw------- 1 xq_1027 xq_1027       939 Sep 28 14:17 application-temp.yml
-rw-r--r-- 1 root    root    561633710 Nov 27 15:06 Datakit-5.1.0.tar.gz
drwx------ 2 xq_1027 xq_1027      4096 Sep 28 14:21 doc
-rw------- 1 xq_1027 xq_1027  94426176 Sep 28 14:17 openGauss-datakit-5.1.0.jar
drwx------ 2 xq_1027 xq_1027      4096 Sep 28 14:21 visualtool-plugin
[xq_1127@hostname datakit]$ cd doc/
[xq_1127@hostname doc]$ ll
total 224
-rw------- 1 xq_1027 xq_1027  24930 Sep 28 14:20 alert-monitor-README.md
-rw------- 1 xq_1027 xq_1027   6746 Sep 28 14:21 base-ops-README.md
-rw------- 1 xq_1027 xq_1027   1142 Sep 28 14:20 datakit-demo-plugin-README.md
-rw------- 1 xq_1027 xq_1027   7748 Sep 28 14:17 datakit-README.md
-rw------- 1 xq_1027 xq_1027   3752 Sep 28 14:20 data-migration-README.md
-rw------- 1 xq_1027 xq_1027 108473 Sep 28 14:20 data-studio-README.md
-rw------- 1 xq_1027 xq_1027     66 Sep 28 14:20 datasync-mysql-README.md
-rw------- 1 xq_1027 xq_1027  18249 Sep 28 14:21 observability-instance-README.md
-rw------- 1 xq_1027 xq_1027   8610 Sep 28 14:20 observability-log-search-README.md
-rw------- 1 xq_1027 xq_1027  16815 Sep 28 14:21 observability-sql-diagnosis-README.md
-rw------- 1 xq_1027 xq_1027   6474 Sep 28 14:18 openGauss-tools-monitor-README.md

~~~



### 5.创建相关配置文件

~~~shell
[xq_1127@hostname datakit]$ mkdir config  files ssl logs
[xq_1127@hostname datakit]$ ll
total 640720
-rw------- 1 xq_1027 xq_1027       939 Sep 28 14:17 application-temp.yml
drwx------ 2 xq_1027 xq_1027      4096 Nov 27 15:09 config
-rw-r--r-- 1 root    root    561633710 Nov 27 15:06 Datakit-5.1.0.tar.gz
drwx------ 2 xq_1027 xq_1027      4096 Sep 28 14:21 doc
drwx------ 2 xq_1027 xq_1027      4096 Nov 27 15:09 files
drwx------ 2 xq_1027 xq_1027      4096 Nov 27 15:09 logs
-rw------- 1 xq_1027 xq_1027  94426176 Sep 28 14:17 openGauss-datakit-5.1.0.jar
drwx------ 2 xq_1027 xq_1027      4096 Nov 27 15:09 ssl
drwx------ 2 xq_1027 xq_1027      4096 Sep 28 14:21 visualtool-plugin

~~~



### 6.移动配置文件并修改文件

​     netstat  -anp | grep  9494  检查端口是否被占用

​     fuser -v -n tcp   9494    查看占用端口的进程

​      kill   -9   进程号 

~~~shell
[xq_1127@hostname datakit]$ mv application-temp.yml  ./config/
[xq_1127@hostname datakit]$ cd config/
[xq_1127@hostname config]$ ll
total 4
-rw------- 1 xq_1027 xq_1027 939 Sep 28 14:17 application-temp.yml
[xq_1027@hostname config]$ vim  application-temp.yml
[xq_1027@hostname config]$ vi application-temp.yml
system:
  # File storage path
  defaultStoragePath: /home/datakit/files
  # Whitelist control switch
  whitelist:
    enabled: false
server:
   #(如果被占用可以自定义为其他端口号)
  port: 9494
  ssl:
    key-store: /home/datakit/ssl/keystore.p12
    key-store-password: 123456
    key-store-type: PKCS12
    enabled: true
  servlet:
    context-path: /
logging:
  file:
    path: /home/datakit/logs
spring:
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource
    driver-class-name: org.opengauss.Driver
    url: jdbc:opengauss://ip:45678/datakit?currentSchema=public&batchMode=off
    username: datakit
    password: ***
    druid:
      test-while-idle: true
      test-on-borrow: true
      validation-query: "select 1"
      validation-query-timeout: 10000
      connection-error-retry-attempts: 0
      break-after-acquire-failure: true
      max-wait: 6000
      keep-alive: true
      max-active: 30
      min-evictable-idle-time-millis: 600000
management:
  server:
    port: 9494

~~~



### 7.启动成功（*打印日志输出在当前路径 datakit.out中*）

~~~shell
[xq_1127@hostname datakit]$ nohup java -Xms2048m -Xmx4096m -jar openGauss-datakit-5.1.0.jar --spring.profiles.active=temp >datakit.out 2>&1 &
[xq_1127@hostname datakit]$ tail -f datakit.out
[org.springframework.boot.actuate.endpoint.web.EndpointLinksResolver]-[INFO] Exposing 1 endpoint(s) beneath base path ''
2023-11-27 15:31:58 [main] [org.springframework.boot.autoconfigure.web.servlet.WelcomePageHandlerMapping]-[INFO] Adding welcome page: class path resource [static/index.html]
2023-11-27 15:31:58 [Druid-ConnectionPool-Create-271422148] [org.opengauss.core.v3.ConnectionFactoryImpl]-[INFO] [dd84dd28-7dc2-46bd-942e-2b3145935be1] Try to connect. IP: 0.0.0.0:45678
2023-11-27 15:31:58 [Druid-ConnectionPool-Create-271422148] [org.opengauss.core.v3.ConnectionFactoryImpl]-[INFO] [0.0.0.0:35670/0.0.0.0:45678] Connection is established. ID: dd84dd28-7dc2-46bd-942e-2b3145935be1
2023-11-27 15:31:58 [Druid-ConnectionPool-Create-271422148] [org.opengauss.core.v3.ConnectionFactoryImpl]-[INFO] Connect complete. ID: dd84dd28-7dc2-46bd-942e-2b3145935be1
2023-11-27 15:31:59 [main] [org.springframework.security.web.DefaultSecurityFilterChain]-[INFO] Will secure any request with [org.springframework.security.web.context.request.async.WebAsyncManagerIntegrationFilter@1a0c5e9, org.springframework.security.web.context.SecurityContextPersistenceFilter@3cad68df, org.springframework.security.web.header.HeaderWriterFilter@5edc70ed, org.springframework.web.filter.CorsFilter@282308c3, org.springframework.security.web.authentication.logout.LogoutFilter@4693a9ef, org.springframework.web.filter.CorsFilter@282308c3, org.opengauss.admin.framework.security.filter.JwtAuthenticationTokenFilter@159e366, org.springframework.security.web.savedrequest.RequestCacheAwareFilter@2f3166a, org.springframework.security.web.servletapi.SecurityContextHolderAwareRequestFilter@770beef5, org.springframework.security.web.authentication.AnonymousAuthenticationFilter@123d7057, org.springframework.security.web.session.SessionManagementFilter@3337d04c, org.springframework.security.web.access.ExceptionTranslationFilter@61ab89b0, org.springframework.security.web.access.intercept.FilterSecurityInterceptor@2e17a321]
2023-11-27 15:31:59 [main] [org.apache.coyote.http11.Http11NioProtocol]-[INFO] Starting ProtocolHandler ["https-jsse-nio-9494"]
2023-11-27 15:32:00 [main] [org.springframework.boot.web.embedded.tomcat.TomcatWebServer]-[INFO] Tomcat started on port(s): 9494 (https) with context path ''
2023-11-27 15:32:00 [main] [springfox.documentation.swagger.readers.operation.OperationImplicitParameterReader]-[WARN] Unable to interpret the implicit parameter configuration with dataType: string, dataTypeClass: class java.lang.Void
2023-11-27 15:32:00 [main] [springfox.documentation.swagger.readers.operation.OperationImplicitParameterReader]-[WARN] Unable to interpret the implicit parameter configuration with dataType: string, dataTypeClass: class java.lang.Void
2023-11-27 15:32:00 [main] [springfox.documentation.swagger.readers.operation.OperationImplicitParameterReader]-[WARN] Unable to interpret the implicit parameter configuration with dataType: , dataTypeClass: class java.lang.Void
2023-11-27 15:32:00 [main] [springfox.documentation.swagger.readers.operation.OperationImplicitParameterReader]-[WARN] Unable to interpret the implicit parameter configuration with dataType: , dataTypeClass: class java.lang.Void
2023-11-27 15:32:00 [main] [springfox.documentation.swagger.readers.operation.OperationImplicitParameterReader]-[WARN] Unable to interpret the implicit parameter configuration with dataType: , dataTypeClass: class java.lang.Void
2023-11-27 15:32:00 [main] [springfox.documentation.swagger.readers.operation.OperationImplicitParameterReader]-[WARN] Unable to interpret the implicit parameter configuration with dataType: , dataTypeClass: class java.lang.Void
2023-11-27 15:32:00 [main] [com.gitee.starblues.loader.launcher.SpringMainProdBootstrap]-[INFO] Started SpringMainProdBootstrap in 8.649 seconds (JVM running for 11.772)
2023-11-27 15:32:00 [main] [com.gitee.starblues.integration.operator.DefaultPluginOperator]-[INFO] 插件加载环境: prod
2023-11-27 15:32:00 [main] [com.gitee.starblues.integration.operator.DefaultPluginOperator]-[INFO] 插件加载模式: isolation
2023-11-27 15:32:00 [main] [com.gitee.starblues.integration.operator.DefaultPluginOperator]-[INFO] 开始加载插件, 插件根路径为:
/home/xq_1027/datakit/visualtool-plugin
2023-11-27 15:32:00 [main] [com.gitee.starblues.spring.web.PluginStaticResourceConfig]-[INFO] 插件静态资源访问前缀配置为: /static-plugin/{pluginId}
2023-11-27 15:32:00 [main] [com.gitee.starblues.core.DefaultPluginManager]-[INFO] 插件[observability-sql-diagnosis@5.1.0]加载成功
2023-11-27 15:32:00 [main] [org.opengauss.admin.web.listener.MypluginListener]-[INFO] plugin [observability-sql-diagnosis] load success.
2023-11-27 15:32:00 [main] [com.gitee.starblues.core.DefaultPluginManager]-[INFO] 插件[monitor-tools@5.1.0]加载成功
2023-11-27 15:32:00 [main] [org.opengauss.admin.web.listener.MypluginListener]-[INFO] plugin [monitor-tools] load success.
2023-11-27 15:32:00 [main] [com.gitee.starblues.core.DefaultPluginManager]-[INFO] 插件[datakit-demo-plugin@5.1.0]加载成功
2023-11-27 15:32:00 [main] [org.opengauss.admin.web.listener.MypluginListener]-[INFO] plugin [datakit-demo-plugin] load success.
2023-11-27 15:32:00 [main] [com.gitee.starblues.core.DefaultPluginManager]-[INFO] 插件[observability-instance@5.1.0]加载成功
2023-11-27 15:32:00 [main] [org.opengauss.admin.web.listener.MypluginListener]-[INFO] plugin [observability-instance] load success.
2023-11-27 15:32:00 [main] [com.gitee.starblues.core.DefaultPluginManager]-[INFO] 插件[alert-monitor@5.1.0]加载成功
2023-11-27 15:32:00 [main] [org.opengauss.admin.web.listener.MypluginListener]-[INFO] plugin [alert-monitor] load success.
2023-11-27 15:32:00 [main] [com.gitee.starblues.core.DefaultPluginManager]-[INFO] 插件[datasync-mysql@5.1.0]加载成功
2023-11-27 15:32:00 [main] [org.opengauss.admin.web.listener.MypluginListener]-[INFO] plugin [datasync-mysql] load success.
2023-11-27 15:32:00 [main] [com.gitee.starblues.core.DefaultPluginManager]-[INFO] 插件[base-ops@5.1.0]加载成功
2023-11-27 15:32:00 [main] [org.opengauss.admin.web.listener.MypluginListener]-[INFO] plugin [base-ops] load success.
2023-11-27 15:32:00 [main] [com.gitee.starblues.core.DefaultPluginManager]-[INFO] 插件[data-migration@5.1.0]加载成功
2023-11-27 15:32:00 [main] [org.opengauss.admin.web.listener.MypluginListener]-[INFO] plugin [data-migration] load success.
2023-11-27 15:32:00 [main] [com.gitee.starblues.core.DefaultPluginManager]-[INFO] 插件[observability-log-search@5.1.0]加载成功
2023-11-27 15:32:00 [main] [org.opengauss.admin.web.listener.MypluginListener]-[INFO] plugin [observability-log-search] load success.
2023-11-27 15:32:00 [main] [com.gitee.starblues.core.DefaultPluginManager]-[INFO] 插件[webds-plugin@5.1.0]加载成功
2023-11-27 15:32:00 [main] [org.opengauss.admin.web.listener.MypluginListener]-[INFO] plugin [webds-plugin] load success.
2023-11-27 15:32:00 [main] [org.opengauss.admin.web.listener.MyPluginInitializerListener]-[INFO] My plugin init before.
2023-11-27 15:32:00 [main] [org.opengauss.admin.system.service.ops.impl.EncryptionUtils]-[INFO] encryption key not found, generate it.
2023-11-27 15:32:00 [main] [org.opengauss.admin.framework.config.AutoFillMetaObjectHandler]-[INFO] default user information not found, this is a new installation
Logging initialized using 'class org.apache.ibatis.logging.stdout.StdOutImpl' adapter.
2023-11-27 15:32:04.019  INFO 15894 --- [           main] c.n.o.sql.config.DataSourceIniter        : sqlite:/home/xq_1027/datakit/data/diagnosisTask.db
2023-11-27 15:32:04.091  INFO 15894 --- [           main] c.n.o.sql.config.DataSourceIniter        : sqlite:/home/xq_1027/datakit/data/diagnosisSources.db
2023-11-27 15:32:04.123  INFO 15894 --- [           main] c.n.o.s.config.history.HisDiagnosisInit  : sqlite:/home/xq_1027/datakit/data/diagnosisTaskV1.db
2023-11-27 15:32:04.129  INFO 15894 --- [           main] c.n.o.s.config.history.HisDiagnosisInit  : sqlite:/home/xq_1027/datakit/data/diagnosisResultV1.db
2023-11-27 15:32:04.134  INFO 15894 --- [           main] c.n.o.s.config.history.HisDiagnosisInit  : sqlite:/home/xq_1027/datakit/data/diagnosisThresholdV1.db
2023-11-27 15:32:04.223  INFO 15894 --- [           main] c.b.d.d.DynamicRoutingDataSource         : dynamic-datasource - add a datasource named [hisDiagnosisTask] success
2023-11-27 15:32:04.224  INFO 15894 --- [           main] c.b.d.d.DynamicRoutingDataSource         : dynamic-datasource - add a datasource named [hisDiagnosisResult] success
2023-11-27 15:32:04.225  INFO 15894 --- [           main] c.b.d.d.DynamicRoutingDataSource         : dynamic-datasource - add a datasource named [diagnosisSource] success
2023-11-27 15:32:04.225  INFO 15894 --- [           main] c.b.d.d.DynamicRoutingDataSource         : dynamic-datasource - add a datasource named [diagnosisTask] success
2023-11-27 15:32:04.225  INFO 15894 --- [           main] c.b.d.d.DynamicRoutingDataSource         : dynamic-datasource - add a datasource named [hisDiagnosisThreshold] success
2023-11-27 15:32:04.225  INFO 15894 --- [           main] c.b.d.d.DynamicRoutingDataSource         : dynamic-datasource - add a datasource named [primary] success
2023-11-27 15:32:04.225  WARN 15894 --- [           main] c.b.d.d.DynamicRoutingDataSource         : dynamic-datasource initial loaded [6] datasource,Please add your primary datasource or check your configuration
Registered plugin: 'com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor@660b1a9d'
Property 'mapperLocations' was not specified.
Creating a new SqlSession
SqlSession [org.apache.ibatis.session.defaults.DefaultSqlSession@467ef400] was not registered for synchronization because synchronization is not active
2023-11-27 15:32:04.728  INFO 15894 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
2023-11-27 15:32:04.738  INFO 15894 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Start completed.
JDBC Connection [HikariProxyConnection@1657624109 wrapping org.sqlite.jdbc4.JDBC4Connection@3d1c52f5] will not be managed by Spring
==>  Preparing: SELECT id,nodeId,key,value FROM dictionary_config
==> Parameters:
<==      Total: 0
Closing non transactional SqlSession [org.apache.ibatis.session.defaults.DefaultSqlSession@467ef400]
Can not find table primary key in Class: "com.nctigba.observability.sql.model.StatementHistory".
2023-11-27 15:32:04.854  WARN 15894 --- [           main] c.b.m.core.injector.DefaultSqlInjector   : class com.nctigba.observability.sql.model.StatementHistory ,Not found @TableId annotation, Cannot use Mybatis-Plus 'xxById' Method.
2023-11-27 15:32:04.894  INFO 15894 --- [           main] c.n.o.sql.config.ParamInfoInitConfig     : sqlite:/home/xq_1027/datakit/data/paramDiagnosisInfoV1.db
2023-11-27 15:32:05.001  INFO 15894 --- [           main] c.n.o.sql.config.ParamInfoInitConfig     : [SQLITE_ERROR] SQL error or missing database (near "旧封包": syntax error)
Can not find table primary key in Class: "com.nctigba.observability.sql.model.param.NctigbaParamInfo".
2023-11-27 15:32:05.163  WARN 15894 --- [           main] c.b.m.core.injector.DefaultSqlInjector   : class com.nctigba.observability.sql.model.param.NctigbaParamInfo ,Not found @TableId annotation, Cannot use Mybatis-Plus 'xxById' Method.
Creating a new SqlSession
SqlSession [org.apache.ibatis.session.defaults.DefaultSqlSession@1fbc63bf] was not registered for synchronization because synchronization is not active
2023-11-27 15:32:05.210  INFO 15894 --- [           main] 
~~~



### 8.打开浏览器输入地址访问dadakit

~~~
https://ip:9494
~~~

初次登录用户为admin 密码： admin123



### 9.参考文档

(https://gitee.com/opengauss/openGauss-workbench)