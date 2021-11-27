+++
title = "openGauss数据库的安装与使用"
date = "2021-11-27"
tags = ["openGauss安装部署"]
archives = "2021-11"
author = "luooofan"
summary = "VMware+CentOS7.6+OpenGauss2.0.1极简版安装过程记录，包括环境准备，安装以及JDBC连接使用"
img = "/zh/post/luooofan/title/openGauss.png"
+++

# VMware+CentOS7.6+OpenGauss2.0.1极简版安装

## 环境准备

Arch：x86-64

OS：Win11

VMware：16.1.2



### 安装CentOS 7.6

CentOS镜像：[CentOS-7.6.1810](https://archive.kernel.org/centos-vault/7.6.1810/isos/x86_64/)

VMware中创建新的虚拟机时：1CPU 2Core 4GB NAT 其他选择默认配置即可

CentOS引导安装：

- 语言选择英语

  <img src="http://img.luooofan.site/20210917-123957-image-20210916203132127.png" alt="image-20210916203132127" style="zoom:67%;" />

- 打开网络

  <img src="http://img.luooofan.site/20210917-125039-image-20210916202936433.png" alt="image-20210916202936433" style="zoom:67%;" />

- 设置时区

  <img src="http://img.luooofan.site/20210917-125041-image-20210916203102725.png" alt="image-20210916203102725" style="zoom:67%;" />

- 安装位置和分区

  <img src="http://img.luooofan.site/20210917-125042-image-20210916203224112.png" alt="image-20210916203224112" style="zoom:67%;" />

- 软件选择最小安装（也可以选带GUI安装）

  <img src="http://img.luooofan.site/20210917-125043-image-20210916203248690.png" alt="image-20210916203248690" style="zoom:67%;" />

- 开始安装

- 设置ROOT密码和新建用户

- 安装完成后重启



### 配置CentOS7.6

- 简单配置

  设置字体 `setfont lat4-19`

  [重新安装VMware Tools(Optional)](https://segmentfault.com/a/1190000038633985)（对于无GUI的应该没啥用，可以在本地ssh到vmware中就可以复制粘贴了）

  ![image-20210916204547163](http://img.luooofan.site/20210917-125044-image-20210916204547163.png)

  ![image-20210916204516274](http://img.luooofan.site/20210917-125044-image-20210916204516274.png)

- 使用MobaXterm SSH连接

- yum源更新 `yum update`

- 安装Python3.6 `yum install -y python36`

- 安装其他依赖`yum install -y bzip2 libaio-devel flex bison ncurses-devel glibc-devel patch`

- 关闭防火墙和SeLinux，然后重启，重连ssh

  ![image-20210916205823744](http://img.luooofan.site/20210917-125045-image-20210916205823744.png)

- 设置字符集参数：在/etc/profile文件中添加”export LANG=XXX”（XXX为Unicode编码）

  ![image-20210916210201985](http://img.luooofan.site/20210917-125045-image-20210916210201985.png)

- 检查设置时区

  ![image-20210916210325940](http://img.luooofan.site/20210917-125046-image-20210916210325940.png)

- 关闭swap交换内存（Optional） `swapoff -a`

- 关闭RemovelPC，CentOS操作系统默认为关闭




## 开始安装

- 创建用户组dbgrp、用户omm，将该用户添加至root组,并修改用户omm的密码

  ![image-20210916212750036](http://img.luooofan.site/20210917-125046-image-20210916212750036.png)

- 配置共享文件夹，把openGauss的安装包（2.0.1 极简版）放进去

- 以root用户创建软件目录，以omm用户登录解压

  ![image-20210916213043287](http://img.luooofan.site/20210917-125046-image-20210916213043287.png)

- 进入simpleInstall目录，执行安装脚本 `sh install.sh  -w xxxx`

  出现如下错误：

  ![image-20210916212452036](http://img.luooofan.site/20210917-125047-image-20210916212452036.png)

  解决办法：

  在/etc/sysctl.conf中加入语句`kernel.sem = 250 32000 100 999`，然后执行`sysctl -p`

  ![image-20210916213623749](http://img.luooofan.site/20210917-125047-image-20210916213623749.png)
  
  ![image-20210916213918471](http://img.luooofan.site/20210917-125048-image-20210916213918471.png)
  
- 执行完安装脚本之后：

  openGauss端口号默认为5432

  默认生成名称为postgres的数据库

  数据库目录安装路径/opt/software/openGauss/data/single_node,其中/opt/software/openGauss为解压包路径，data/single_node为新创建的数据库节点目录。

- 使用ps和gs_ctl查看进程是否正常（如果没有找到gs_ctl，配置环境变量即可 `export PATH=/opt/software/openGauss/bin:$PATH`，如果缺失lib则配置`LD_LIBRARY_PATH`）

  ![image-20210916220723579](http://img.luooofan.site/20210917-125048-image-20210916220723579.png)

  如果ps里没有的话可以先重启一下：

  `gs_ctl restart -D /opt/software/openGauss/data/single_node -Z single_node`



## 连接与使用

### Gsql方式

数据库安装完成后，默认生成名称为postgres的数据库，默认端口是5432。

因为omm用户是管理员用户，因此系统显示“DBNAME=#”。若使用普通用户身份登录和连接数据库，系统显示“DBNAME=>”。

“Non-SSL connection”表示未使用SSL方式连接数据库。如果需要高安全性时，请使用SSL连接。

![image-20210916224215117](http://img.luooofan.site/20210917-125049-image-20210916224215117.png)

查看对象操作：

- 查看帮助信息：\\?
- 列举数据库：\\l
- 列举表：\\dt
- 查看表结构：\\d tablename
- 切换数据库：\\c dbname
- 列举schema：\\dn
- 查看索引：\\di

![image-20210916225721959](http://img.luooofan.site/20210917-125049-image-20210916225721959.png)



### 远程连接前的准备

- 配置数据库用户和权限（omm不能用于远程连接）：

  ![image-20210917011415027](http://img.luooofan.site/20210917-125050-image-20210917011415027.png)

- 修改数据库的pg_hba.conf文件，**给要远程连接的主机/用户放行**（这里好像不能用gs_auc命令完成，直接编辑文件即可）：

  ![image-20210917014949550](http://img.luooofan.site/20210917-125050-image-20210917014949550.png)

- 使用gs_ctl将策略生效：`gs_ctl reload -D ./data/single_node`

- **修改postgresql.conf中的监听地址**：`listen_addresses = '*'`，默认只监听local，改后包括了要进行远程连接的ip地址就行

- 重启数据库生效：`gs_ctl restart -D ./data/single_node`

如果之后进行JDBC连接的时候出现如下图中的目标地址拒绝连接的异常，可能就是这一步出问题了

![image-20210917015658388](http://img.luooofan.site/20210917-125050-image-20210917015658388.png)



### ODBC/JDBC

根据文档JDBC应该是都支持，ODBC支持受限

<img src="http://img.luooofan.site/20210917-125051-image-20210917001738561.png" alt="image-20210917001738561" style="zoom:67%;" />

因为是在CentOS 7.6上装的openGauss，所以选择JDBC。

JDBC Connectors可以不用从源码构建，直接从官网下载页下载即可。

在Win上VSCode中配置好JAVA环境，需要Java11和Java8，配置该项目的JDK Runtime和Referenced Libraries（把下载解压得到的postgresql.jar加进去）

代码：

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.Properties;

class openGaussTest {
  public static void main(String[] args) {
    System.out.println("=====START TEST=====");

    Connection conn = getConnect("luooofan", "Luooofan1");

    Statement stmt = null;
    try {
      stmt = conn.createStatement();
      ResultSet rs = null;
      try {
        rs = stmt.executeQuery(
            "select pro_c_id, pro_id, pro_status, pro_quantity, pro_income, pro_purchase_time from property;");
        while (rs.next()) {
          int pro_c_id = rs.getInt(1);
          int pro_id = rs.getInt(2);
          String pro_status = rs.getString(3);
          int pro_quantity = rs.getInt(4);
          int pro_income = rs.getInt(5);
          Timestamp pro_pruchase_time = rs.getTimestamp("pro_purchase_time");
          System.out.printf("%4d %4d %4s %4d %4d ", pro_c_id, pro_id, pro_status, pro_quantity, pro_income);
          System.out.println(pro_pruchase_time);
        }
      } catch (SQLException e) {
        if (rs != null) {
          try {
            rs.close();
          } catch (SQLException e1) {
            e1.printStackTrace();
          }
        }
        e.printStackTrace();
      }

      stmt.close();
    } catch (SQLException e) {
      if (stmt != null) {
        try {
          stmt.close();
        } catch (SQLException e1) {
          e1.printStackTrace();
        }
      }
      e.printStackTrace();
    }

    try {
      conn.close();
    } catch (SQLException e) {
      e.printStackTrace();
    }
  }

  public static Connection getConnect(String username, String passwd) {
    // 驱动类
    String driver = "org.postgresql.Driver";
    // 数据库连接描述符
    String sourceURL = "jdbc:postgresql://192.168.193.129:5432/finance";
    Connection conn = null;

    try {
      // 加载驱动
      Class.forName(driver);
    } catch (Exception e) {
      e.printStackTrace();
      return null;
    }

    try {
      // 创建连接
      conn = DriverManager.getConnection(sourceURL, username, passwd);
      System.out.println("Connection succeed!");
    } catch (Exception e) {
      e.printStackTrace();
      return null;
    }

    return conn;
  }
}
```

NOTE：

- 要执行什么操作就要赋予用户什么权限，代码中要对property表查询，故：`grant select on table property to luooofan;`

- 因为CentOS没配置中文编码，所以直接在CentOS上查找的话应该无法显示中文，不过这并不影响在win 上远程连接然后查询并显示

  ![image-20210917121925894](http://img.luooofan.site/20210917-125051-image-20210917121925894.png)





## References

[openGauss Server&Connectors Official Download](https://opengauss.org/zh/download.html)

[官方文档-快速入门](https://opengauss.org/zh/docs/2.0.1/docs/Quickstart/Quickstart.html)

[官方文档-开发者指南](https://opengauss.org/zh/docs/2.0.1/docs/Developerguide/Developerguide.html)

[openGauss数据库部署Linux遇到的问题](https://blog.csdn.net/RANGO_CSDN/article/details/118761322)

[【数据库原理实验(openGauss)】 使用JDBC连接数据库](https://blog.csdn.net/BlacKingZ/article/details/117915010)

