+++
title = "JDBC使用及源码编译"
date = "2021-12-18"
tags = ["JDBC"]
archives = "2021-12"
author = "douxin"
summary = "openGauss社区开发入门"
img="/zh/post/douxin/title/img1.png"
times = "17:30"

+++

# JDBC使用及源码编译

## 1. JDBC简介

- JDBC是Java DataBase Connectivity的缩写，它是Java程序访问数据库的标准接口。

- JDBC接口是Java标准库自带的，具体的JDBC驱动是由数据库厂商提供的，JDBC驱动也是由Java语言编写的，为一个jar包，真正实现JDBC接口中的类。

- openGauss数据库源自postgres，openGauss JDBC以PostgreSQL JDBC Driver 42.2.5为基准，适配openGauss数据库，增加新特性。

- openGauss JDBC下载地址：

  - Jar包下载路径：

    （1）[官网下载](https://opengauss.org/zh/download.html)

    （2）[华为鲲鹏maven仓库](https://repo.huaweicloud.com/kunpeng/maven/org/opengauss/opengauss-jdbc/)

    （3）[maven中央仓库](https://mvnrepository.com/artifact/org.opengauss/opengauss-jdbc)

  - 源码下载路径：

    [源码下载](https://gitee.com/opengauss/openGauss-connector-jdbc)

## 2. JDBC使用

- 参考链接

  openGauss JDBC源码中的API可以参考：[API链接](https://jdbc.postgresql.org/documentation/publicapi/)

  用户指导手册可参考：[用户手册](https://impossibl.github.io/pgjdbc-ng/docs/current/user-guide/)

- 执行流程

  通过JDBC对数据库进行操作，执行流程大体如下：
  （1）连接数据源
  （2）为数据库传递查询和更新指令
  （3）处理数据库相应并返回结果

- 完整示例

  ```
  import java.sql.Connection;
  import java.sql.DriverManager;
  import java.sql.PreparedStatement;
  import java.sql.ResultSet;
  import java.sql.Statement;
  
  public class Main {
  
      public static void main(String[] args) {
          String driver = "org.postgresql.Driver";
          String sourceURL = "jdbc:postgresql://127.0.0.1:5432/postgres";
          String userName = "tpcc";
          String password = "password";
  
          try {
              // 1. 加载驱动程序
              Class.forName(driver);
             
              // 2. 获得数据库连接
              Connection conn = DriverManager.getConnection(sourceURL, userName, password);
  
              // 3. 创建表
              String sql = "create table test(id int, name varchar);";
              Statement statement = conn.createStatement();
              statement.execute(sql);
  
              // 4. 插入数据，预编译SQL,减少SQL执行，
              String insertSql = "insert into test values (?, ?)";
              PreparedStatement ps = conn.prepareStatement(insertSql);
              ps.setInt(1, 10);
              ps.setString(2, "test10");
              ps.execute();
  
              // 5. 查询结果集
              String selectSql = "select * from test";
              PreparedStatement psSelect = conn.prepareStatement(selectSql);
              ResultSet rs = psSelect.executeQuery();
              while (rs.next()) {
                  System.out.println("id = " + rs.getInt(1));
                  System.out.println("name = " + rs.getString(2));
              }
          } catch (SQLException e) {
              e.printStackTrace();
          }
      }
  }
  ```

- 引入JDBC驱动

  （1）通过java工程引入依赖库Referenced Libaries
  将openGauss JDBC jar包放置于工程路径下，并通过Build Path -> Add to Build Path引入至依赖库中
  （2）通过maven工程引入依赖dependency

  openGauss JDBC驱动已经上传至华为鲲鹏仓库和maven中央仓库，包含1.1.0，2.0.0，2.0.1-compatibility三个版本，依赖配置如下：

  ```
  <dependencies>
  	<dependency>
  		<groupId>org.opengauss</groupId>
  		<artifactId>opengauss-jdbc</artifactId>
  		<version>version_num</version>
  	</dependency>
  </dependencies>
  ```

  若添加华为鲲鹏maven镜像，可将仓库配置在`<Maven安装目录>/conf/setting.xml`文件或者Maven工程的pom.xml文件中

  [华为鲲鹏-Maven镜像](https://mirrors.huaweicloud.com/home)

  仓库配置如下：

  ```
  <repositories>
      <repository>
          <id>kunpengmaven</id>
          <name>kunpeng maven</name>
          <url>https://repo.huaweicloud.com/kunpeng/maven</url>
      </repository>
  </repositories>
  ```

## 3. JDBC源码编译

- linux下编译Jar包

  从码云上下载openGauss JDBC源码，linux下可一键式编译，生成jar包

  编译命令为

  ```
  sh build.sh -3rd $openGauss-connector-jdbc/open-source
  ```

  其中$openGauss-connector-jdbc为JDBC源码路径，生成的Jar包位于$openGauss-connector-jdbc/output路径下

  ![image-20211218161436265](../image/jdbc/png0.png)

  上面的两个jar包虽名称不同，但本质上是两个相同的Jar包。

- windows下编译Jar包

  通过maven对源码进行打包，打包命令为：

  ```
  mvn clean package -Dmaven.test.skip=true
  ```

  直接执行上面的命令会报如下的错误，下面给出常见问题及解决方案：

  - 问题1：Child module does not exist

    ![image-20211218153454262](../image/jdbc/png1.png)

    解决方案：修改根目录下的pom.xml文件中jdbc为pgjdbc

    ```
    <module>jdbc</module>
    修改为
    <module>pgjdbc</module> 
    ```

  - 问题2：缺少com.huawei:demo-0.0.1-SNAPSHOT.pom

    解决方案：在仓库中增加demo-0.0.1-SNAPSHOT包

    方法1：将linux编译成功生成的demo-0.0.1-SNAPSHOT-0.0.1.jar包拷贝至用户本地maven仓库中即可

    方法2：执行下面的脚本可生成demo-0.0.1-SNAPSHOT-0.0.1.jar包

    ```
    sh prepare_maven.sh
    sh prepare_demo.sh
    ```

  - 问题3：编码GBK的不可映射字符

    ![image-20211218153845040](../image/jdbc/png2.png)

    解决方案：

    maven-compiler-plugin插件增加<encoding>UTF-8</encoding>，共两个文件
    (1) pgjdbc/pom.xml
    (2) pom.xml

    ```
    <plugin>
    	<artifactId>maven-compiler-plugin</artifactId>
    	<version>3.1</version>
    	<configuration>
            <source>1.8</source>
            <target>1.8</target>
            <encoding>UTF-8</encoding>
            <showWarnings>true</showWarnings>
            <compilerArgs>
            	<arg>-Xlint:all</arg>
            </compilerArgs>
    	</configuration>
    </plugin>
    ```

  - 问题4：程序包javax.xml.bind不存在

    ![image-20211218154319533](../image/jdbc/png3.png)

    解决方案：pgjdbc/pom.xml中增加如下依赖

    ```
    <dependency>
        <groupId>javax.xml.bind</groupId>
        <artifactId>jaxb-api</artifactId>
        <version>2.3.0</version>
    </dependency>
    <dependency>
        <groupId>com.sun.xml.bind</groupId>
        <artifactId>jaxb-core</artifactId>
        <version>2.3.0</version>
    </dependency>
    <dependency>
        <groupId>com.sun.xml.bind</groupId>
        <artifactId>jaxb-impl</artifactId>
        <version>2.3.0</version>
    </dependency>
    ```

  - 问题5：StreamWrapper.java未报告的异常错误java.lang.Throwable

    ![image-20211218154522156](../image/jdbc/png4.png)

    解决方案：修改StreamWrapper.java文件，抛出Throwable异常

    ![image-20211218154605098](../image/jdbc/png5.png)

  - 问题6：隐藏的包找不到

    程序包com.huawei.shade.org.slf4j不存在

    ![image-20211218154854549](../image/jdbc/png6.png)

    解决方案：删掉本地com.huawei.demo-0.0.1-SNAPSHOT.jar包，重新进行打包

    打包方法：

    ```
    sh prepare_maven.sh
    sh prepare_demo.sh
    ```

  - 问题7：zip工具找不到

    通过问题6中的两个sh脚本编译生成com.huawei.demo-0.0.1-SNAPSHOT.jar包时，zip工具必需处于环境变量中，可下载zip、unzip工具[zip/unzip下载链接](http://www.stahlworks.com/dev/index.php?tool=zipunzip)并添加至环境变量中即可。

- 执行测试用例

  - pgjdbc/pom.xml增加junit依赖

    ```
    <dependency>
        <groupId>junit</groupId>
        <artifactId>junit</artifactId>
        <version>4.12</version>
        <scope>test</scope>
    </dependency>
    ```

  - 增加配置文件build.local.properties

    ![image-20211218155542929](../image/jdbc/png7.png)

    在根目录下增加配置文件build.local.properties，并配置数据库相关的信息（ip，port，user，password），即可在本地执行测试用例

