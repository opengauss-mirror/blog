+++

title = "openGauss数据库的安装运行（openGauss2.0.1）"
date = "2021-12-06"
tags = ["openGauss数据库的安装运行"]
archives = "2021-12"
author = "mqq"
summary = "openGauss数据库的安装运行"
img = "/zh/post/mqq/title/title.png"

+++

# 环境准备
<br/>


## 硬件要求
- 内存 >= 32GB

- CPU >= 8核 2.0GHZ

- 硬盘 >= 40GB

## 软件要求
- 操作系统：CentOS 7.6 x86_64

- Python：Python 3.6.X

- 虚拟机：VMware：16.1.2



# 配置CentOS7.6
![](https://img-blog.csdnimg.cn/d2d3fe5be58b46a5952b06a0b25133e4.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAcXFfNDQzNjExMzY=,size_20,color_FFFFFF,t_70,g_se,x_16)
安装完成CentOS7.6后进入系统，开始配置。

## 设置语言，时区：
![在这里插入图片描述](https://img-blog.csdnimg.cn/8740d1fb5ed64b3bba4855c531784e90.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAcXFfNDQzNjExMzY=,size_20,color_FFFFFF,t_70,g_se,x_16)
## 设置网络连接：

![在这里插入图片描述](https://img-blog.csdnimg.cn/b11f73c4ac074eeea847d46389ca9963.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAcXFfNDQzNjExMzY=,size_20,color_FFFFFF,t_70,g_se,x_16)

设置完成后，来到设备选项界面按照如下配置即可。
![在这里插入图片描述](https://img-blog.csdnimg.cn/a58114e33f1642c7918e897222ae1bc0.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAcXFfNDQzNjExMzY=,size_20,color_FFFFFF,t_70,g_se,x_16)
## 设置用户名和密码
![在这里插入图片描述](https://img-blog.csdnimg.cn/e25dfce8d3ef47b19b8945b59c8e5c7e.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAcXFfNDQzNjExMzY=,size_20,color_FFFFFF,t_70,g_se,x_16)
###安装net-tools工具


![在这里插入图片描述](https://img-blog.csdnimg.cn/ff4b631155754420b539f442bcb3afe4.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAcXFfNDQzNjExMzY=,size_20,color_FFFFFF,t_70,g_se,x_16)
安装完成后可以看到 “complete！”
![在这里插入图片描述](https://img-blog.csdnimg.cn/4b7c5e21866649048b9cac39e195a3bc.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAcXFfNDQzNjExMzY=,size_20,color_FFFFFF,t_70,g_se,x_16)
## 使用SSH连接并设置相关
![在这里插入图片描述](https://img-blog.csdnimg.cn/efbb700cf55d4f90819df39b48eca339.png)


_可能遇到的问题：过程试图写入的管道不存在_
![在这里插入图片描述](https://img-blog.csdnimg.cn/8e01856f87264150a96042e9a6e106de.png)

_解决方法：重新检查Host地址是否变更，每次输入的Host可能会发生变化_

## yum源更新
![在这里插入图片描述](https://img-blog.csdnimg.cn/b931bb98ec5a4bf3990207f0d567ecec.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAcXFfNDQzNjExMzY=,size_20,color_FFFFFF,t_70,g_se,x_16)
## 安装python3.6
![在这里插入图片描述](https://img-blog.csdnimg.cn/41aa77d1bbf74b99a933880df7f65952.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAcXFfNDQzNjExMzY=,size_20,color_FFFFFF,t_70,g_se,x_16)
## 安装其他相关文件
![在这里插入图片描述](https://img-blog.csdnimg.cn/900ea56cf36049df862dba1b154aab78.png)
# 开始安装
<br/>

## 关闭防火墙和Selinux
命令如下：
```
systemctl disable firewalld.service
systemctl stop firewalld.service
sed -i 's/^SELINUX=.*/SELINUX=disabled/' /etc/selinux/config
setenforce 0
```
设置字符集参数并检查设置时区：
![在这里插入图片描述](https://img-blog.csdnimg.cn/57aa4acc8cfa4df0af61deee08fd9922.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAcXFfNDQzNjExMzY=,size_20,color_FFFFFF,t_70,g_se,x_16)
## 创建用户组与用户
创建用户组dbgrp、用户omm，将该用户添加至root组,并修改用户omm的密码
![在这里插入图片描述](https://img-blog.csdnimg.cn/66d95285e77b450dab0d48a9d0727d59.png)
## 解压
![在这里插入图片描述](https://img-blog.csdnimg.cn/7cabd2989f9749fa99479fccab82daa5.png)
_可能遇到的问题：解压不成功_
![在这里插入图片描述](https://img-blog.csdnimg.cn/9de721393c0d4431bb8c7109e66a8f27.png)
_解决方案：尝试重新安装VMware Tools_
![在这里插入图片描述](https://img-blog.csdnimg.cn/f4aa88d607de4efb9084ec13b9d8d922.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAcXFfNDQzNjExMzY=,size_20,color_FFFFFF,t_70,g_se,x_16)

## 安装脚本：
命令格式：`sh install.sh -w xxxx`
![在这里插入图片描述](https://img-blog.csdnimg.cn/ff8c2cefb38a45f29e67d5a4d86e6816.png)
由于openGauss端口号默认为5432默认生成名称为postgres的数据库：
![在这里插入图片描述](https://img-blog.csdnimg.cn/4d3f3788652c4628bc1319a4d46447b3.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAcXFfNDQzNjExMzY=,size_20,color_FFFFFF,t_70,g_se,x_16)
使用ps和gs_ctl查看进程是否正常：
![在这里插入图片描述](https://img-blog.csdnimg.cn/18e941ec7eea4345bb9269d587e79270.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAcXFfNDQzNjExMzY=,size_20,color_FFFFFF,t_70,g_se,x_16)
## 命令行访问数据库
*以下以默认数据库里的school数据库为例*

查看数据库school的class表结构：
![在这里插入图片描述](https://img-blog.csdnimg.cn/0327a25726284e2aa1a2dc0651686145.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAcXFfNDQzNjExMzY=,size_20,color_FFFFFF,t_70,g_se,x_16)
school数据库相关信息：
![在这里插入图片描述](https://img-blog.csdnimg.cn/c6f52563079a46ffa568c1736ff3ca57.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAcXFfNDQzNjExMzY=,size_20,color_FFFFFF,t_70,g_se,x_16)
# 以JDBC的方式访问数据库并查找
*以查找school数据库中的class表为例，查找其中的 cla_id, cla_name, cla_teacher并输出：*

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

class openGaussTest {
  public static void main(String[] args) {
    Connection conn = getConnect("mqq", "Mqq123123");

    Statement stmt = null;
    try {
      stmt = conn.createStatement();
      ResultSet rs = null;
      try {
        rs = stmt.executeQuery(
            "select cla_id, cla_name, cla_teacher from class;");
        while (rs.next()) {
          int cla_id = rs.getInt(1);
          String cla_name = rs.getString(2);
          int cla_teacher = rs.getInt(3);
          System.out.println(cla_id +" "+ cla_name + " "+cla_teacher);
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
    String sourceURL = "jdbc:postgresql://192.168.195.129:5432/school";
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

*查询结果如下：*
![在这里插入图片描述](https://img-blog.csdnimg.cn/ac49acca2f72474abe7c997e8b79fc83.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAcXFfNDQzNjExMzY=,size_20,color_FFFFFF,t_70,g_se,x_16)



