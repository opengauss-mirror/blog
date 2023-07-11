+++

title = "使用JDBC连接数据库提示“找不到或无法加载主类 JDBCPerfTest”怎么办" 

date = "2023-07-11" 

tags = ["使用JDBC连接数据库提示“找不到或无法加载主类 JDBCPerfTest”怎么办"] 

archives = "2023-07" 

author = "张翠娉" 

summary = "使用JDBC连接数据库提示“找不到或无法加载主类 JDBCPerfTest”怎么办"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "10:20"

+++

# 使用JDBC连接数据库提示“找不到或无法加载主类 JDBCPerfTest”怎么办？



## 背景介绍

在使用jdbc连接数据库时，提示找不到或无法加载主类。

## 报错信息

```bash
[omm2@kylinos ~]$ java -cp .:opengauss-jdbc-3.1.0.jar -DJDBCUrl="jdbc:opengauss://172.23.2.98:27000/postgres" -DJDBCUser=jdbc_user -DJDBCPa     ssword=Enmo@123 JDBCPerfTest 10000 10000
错误: 找不到或无法加载主类 JDBCPerfTest
```

## 问题分析

已有目录下的主类为MogDBJDBCTest.class、MogDBJDBCTest.java，与jdbc 3.1.0驱动不匹配，需要获取与之匹配的JDBCPerfTest.class以及JDBCPerfTest.java。

**注意**：需要根据实际情况将JDBCPerfTest.java配置文件中的用户名和密码进行替换，例如用户名为jdbc_user，密码为Enmo@123。

## 解决办法

1. 联系开发获取JDBCPerfTest.class以及JDBCPerfTest.java，并将其放入指定目录，如/data/mogdb1/jdbc。

2. 在/data/mogdb1/jdbc目录下，执行测试连接操作。

   ```bash
   [root@kylinos jdbc]# pwd
   /data/mogdb1/jdbc
   [root@kylinos jdbc]# ls -l
   总用量 11748
   -rw-r--r-- 1 omm2 root   11429  7月 11 16:13 JDBCPerfTest.class
   -rw-r--r-- 1 omm2 root   13261  7月 11 17:16 JDBCPerfTest.java
   -rw-r--r-- 1 omm2 root 1604339  7月  6 15:13 openGauss-3.1.1-JDBC.tar.gz
   -rw------- 1 omm2 omm2  847462  1月  6  2023 opengauss-jdbc-3.1.0.jar
   -rw------- 1 omm2 omm2  848499  1月  6  2023 postgresql.jar
   -rw------- 1 omm2 omm2    6925  1月  6  2023 README_cn.md
   -rw------- 1 omm2 omm2    8998  1月  6  2023 README_en.md
   [root@kylinos jdbc]# java -cp .:opengauss-jdbc-3.1.0.jar -DJDBCUrl="jdbc:opengauss://172.23.2.98:27000/postgres" -DJDBCUser=jdbc_user -DJDBCPassword=Enmo@123 JDBCPerfTest 10000 10000
   Usage: java [-cp .:opengauss.jar] [-D JDBCDriver=org.opengauss.Driver] -D JDBCUrl="jdbc connect String,qutoed" -D username=JDBCUser -D password=JDBCPassword JDBCPerfTest [tablesize,default 10000] [row count per test,default 10000]
   七月 11, 2023 6:31:45 下午 org.opengauss.core.v3.ConnectionFactoryImpl openConnectionImpl
   信息: [56bc869a-b55a-45d1-bd3d-665b2ca32138] Try to connect. IP: 172.23.2.98:27000
   七月 11, 2023 6:31:45 下午 org.opengauss.core.v3.ConnectionFactoryImpl openConnectionImpl
   信息: [172.23.2.98:36332/172.23.2.98:27000] Connection is established. ID: 56bc869a-b55a-45d1-bd3d-665b2ca32138
   七月 11, 2023 6:31:45 下午 org.opengauss.core.v3.ConnectionFactoryImpl openConnectionImpl
   信息: Connect complete. ID: 56bc869a-b55a-45d1-bd3d-665b2ca32138
   Connection succeed!
   Elapsed 0.00, Begin Init table with tablesize:10000
   Elapsed 0.08, Finish Init table
   Elapsed 0.00, Begin Select By PK for 10000 times
   Elapsed 0.82, Finish Select By PK, success count:10000
   Elapsed 0.00, Begin Select Large Data for 10000 times, file:jdbctestresult_tmp972.txt
   Elapsed 0.07, Finish Select Large data, success count:10000
   Elapsed 0.00, Begin Insert Row by Row for 10000 times
   Elapsed 0.98, Finish Insert Row by Row, success count:10000
   Elapsed 0.00, Begin Insert Batched for 10000 rows
   Elapsed 0.44, Finish Insert Batched, success count:10000
   Elapsed 0.00, Begin Insert using Copy 10000 rows
   Elapsed 0.04, Finish Insert using Copy, success count:10000
   Elapsed 0.00, Begin Update By PK for 10000 times
   Elapsed 0.99, Finish Update By PK, success count:9999
   Elapsed 0.00, Begin Update Batched for 10000 rows
   Elapsed 0.48, Finish Update Batched, success count:10000
   Elapsed 0.00, Begin Merge By PK for 10000 times
   Elapsed 3.45, Finish Merge By PK, success count:10000
   Elapsed 0.00, Begin Merge Batched for 10000 rows
   Elapsed 2.41, Finish Merge Batched, success count:10000
   close connection
   ```

   
