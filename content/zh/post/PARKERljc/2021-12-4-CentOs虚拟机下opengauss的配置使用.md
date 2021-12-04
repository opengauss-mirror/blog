+++

title = "CentOS虚拟机下openGauss的配置使用"

date = "2021-12-04"

tags = ["CentOS", "openGauss", "配置"]

archives = "2021-12"

author = "parker"

summary = "个人配置openGauss的过程总结"

+++

# 实验环境说明
### 虚拟机平台 `VMware`
### 服务器端 `CentOS 7.9`
### 本机系统 `Windows 10`
### 部署版本 `OpenGauss 1.1.0`
# 安装详细步骤
### 虚拟机`VMware`
本机已配置，该部分省略

### `CentOS 7.9` 安装

下载镜像源`CentOS-7-x86_64-DVD-2009.iso`

![avatar](pic/openGauss安装/1.PNG)

虚拟机中选中镜像进行安装

![avatar](pic/openGauss安装/2.PNG)

![avatar](pic/openGauss安装/3.PNG)

设置

    内存设置为2GB 
    处理器设置为2
    网络默认即可
    声卡和打印机不使用直接进行了移除

启动后进入系统安装，注意的点如下:

#### 分区

选择`系统`-`安装位置`-`手动分区`进行分区如下:

![avatar](pic/openGauss安装/分区.PNG)

![avatar](pic/openGauss安装/分区2.PNG)

#### 网络和主机名

选择`系统`-`网络和主机名`进行设置如下:

![avatar](pic/openGauss安装/网络和主机名.PNG)

![avatar](pic/openGauss安装/网络和主机名2.PNG)

记录ip和主机名，之后配置需要用到

`ip`  `192.168.201.131`

`主机名`  `db1`

#### 软件选择

选择`软件`-`软件选择`设置如下:

![avatar](pic/openGauss安装/软件选择.PNG)

#### 用户设置

上述设置完成后点击`开始安装`，该期间根据提示完成用户设置即可

![avatar](pic/openGauss安装/5.PNG)


#### 安装完成进行重启，登录系统完成安装

![avatar](pic/openGauss安装/8.PNG)

##### 上网测试

![avatar](pic/openGauss安装/上网测试.PNG)

##### 修改操作系统版本(CentOS 7.6可省略)
通过
```vi /etc/redhat-releas```打开编辑文件，修改内容如下(请使用`su root`切换至root用户进行操作)

![avatar](pic/openGauss安装/修改操作系统版本.PNG)

#### 关闭防火墙

执行以下命令关闭防火墙
```systemctl stop firewalld.service```

```systemctl disable firewalld.service```

![avatar](pic/openGauss安装/关闭防火墙.PNG)

#### 设置字符集及环境变量

![avatar](pic/openGauss安装/设置字符集及环境变量.PNG)

#### 关闭swap交换内存

![avatar](pic/openGauss安装/关闭swap交换内存.PNG)

#### yum环境配置

备份yum配置文件

![avatar](pic/openGauss安装/备份yum配置文件.PNG)

下载可用源的repo文件

![avatar](pic/openGauss安装/下载可用源的repo文件.PNG)

查看repo文件是否正确

![avatar](pic/openGauss安装/查看repo文件是否正确.PNG)

yum安装相关包

```yum install -y libaio-devel flex bison ncurses-devel glibc.devel patch lsb_release wget python3```

![avatar](pic/openGauss安装/yum安装相应的包.PNG)

设置python版本为3.x

![avatar](pic/openGauss安装/python版本.PNG)

修改完成后，确认yum是否使用，若不能使用，如本例中。修改`/usr/bin/yum`文件，修改`#!/usr/bin/python`为`#!/usr/bin/python2.7`

![avatar](pic/openGauss安装/yum使用验证并修改为python2.7.PNG)

### 数据库安装

创建存放数据库安装目录

![avatar](pic/openGauss安装/创建存放数据库安装目录.PNG)

下载数据库安装包

![avatar](pic/openGauss安装/下载数据库安装包.PNG)

创建xml配置文件，用于数据库安装
在`openGauss`文件夹下
`vi clusterconfig.xml`编辑以下内容
```javascript
<?xml version="1.0" encoding="UTF-8"?> 
<ROOT> 
    <!-- openGauss整体信息 --> 
    <CLUSTER> 
        <PARAM name="clusterName" value="dbCluster" /> 
        <PARAM name="nodeNames" value="db1" /> 
        <PARAM name="backIp1s" value="10.0.3.15"/> 
        <PARAM name="gaussdbAppPath" value="/opt/gaussdb/app" /> 
        <PARAM name="gaussdbLogPath" value="/var/log/gaussdb" /> 
        <PARAM name="gaussdbToolPath" value="/opt/huawei/wisequery" /> 
        <PARAM name="corePath" value="/opt/opengauss/corefile"/> 
        <PARAM name="clusterType" value="single-inst"/> 
    </CLUSTER> 
    <!-- 每台服务器上的节点部署信息 --> 
    <DEVICELIST> 
        <!-- node1上的节点部署信息 --> 
        <DEVICE sn="1000001"> 
            <PARAM name="name" value="db1"/> 
            <PARAM name="azName" value="AZ1"/> 
            <PARAM name="azPriority" value="1"/> 
            <!-- 如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP --> 
            <PARAM name="backIp1" value="10.0.3.15"/> 
            <PARAM name="sshIp1" value="10.0.3.15"/> 
             
	    <!--dbnode--> 
	    <PARAM name="dataNum" value="1"/> 
	    <PARAM name="dataPortBase" value="26000"/> 
	    <PARAM name="dataNode1" value="/gaussdb/data/db1"/> 
        </DEVICE> 
    </DEVICELIST> 
</ROOT>
```
其中ip设置为之前的`192.168.201.131`,主机名为`db1`，如下:
![avatar](pic/openGauss安装/openGauss配置文件.PNG)

解压安装包

![avatar](pic/openGauss安装/解压安装包.PNG)

解压后查看并修改文件权限

![avatar](pic/openGauss安装/更改权限.PNG)

执行初始化脚本
``` cd /opt/software/openGauss/script```

```  python gs_preinstall -U omm -G dbgrp -X /opt/software/openGauss/clusterconfig.xml ```
返回`Preinstallation succeeded`内容时,初始化完成

![avatar](pic/openGauss安装/初始化脚本执行完成.PNG)

初始化数据库

重启虚拟机后使用omm用户进行数据库初始化
``` gs_install -X /opt/software/openGauss/clusterconfig.xml --gsinit-parameter="--encoding=UTF8" --dn-guc="max_process_memory=2GB" --dn-guc="shared_buffers=128MB" --dn-guc="bulk_write_ring_size=128MB" --dn-guc="cstore_buffers=16MB"```

其中对应的参数内存大小须根据虚拟机情况进行设置

![avatar](pic/openGauss安装/数据库初始化.PNG)

安装完成后清理软件安装包

![avatar](pic/openGauss安装/数据库安装结束.PNG)

#### 连接数据库

![avatar](pic/openGauss安装/数据库使用步骤1-3.PNG)

### JDBC配置
从官方网站选取对应版本的jar包并解压，在eclipse上配置加载驱动类。

![avatar](pic/jdbc连接/windows配置jdbc包.PNG)

第一次连接后操作数据库需要修改omm用户密码

![avatar](pic/jdbc连接/第一次连接后操作需要修改omm用户密码.PNG)

根据官方文档提供的demo程序修改后进行连接测试，连接成功如下:

![avatar](pic/jdbc连接/连接成功.PNG)

demo程序:
```java
package gaussjdbc;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.sql.CallableStatement;

public class Gaussjdbc {

	//创建数据库连接。
	  public static Connection GetConnection(String username, String passwd) {
	    String driver = "org.postgresql.Driver";
	    String sourceURL = "jdbc:postgresql://192.168.201.131:26000/postgres";
	    Connection conn = null;
	    try {
	      //加载数据库驱动。
	      Class.forName(driver).newInstance();
	    } catch (Exception e) {
	      e.printStackTrace();
	      return null;
	    }

	    try {
	      //创建数据库连接。
	      conn = DriverManager.getConnection(sourceURL, username, passwd);
	      System.out.println("Connection succeed!");
	    } catch (Exception e) {
	      e.printStackTrace();
	      return null;
	    }

	    return conn;
	  };

	  //执行普通SQL语句，创建customer_t1表。
	  public static void CreateTable(Connection conn) {
	    Statement stmt = null;
	    try {
	      stmt = conn.createStatement();

	      //执行普通SQL语句。
	      int rc = stmt
	          .executeUpdate("CREATE TABLE customer_t1(c_customer_sk INTEGER, c_customer_name VARCHAR(32));");

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
	  }

	  //执行预处理语句，批量插入数据。
	  public static void BatchInsertData(Connection conn) {
	    PreparedStatement pst = null;

	    try {
	      //生成预处理语句。
	      pst = conn.prepareStatement("INSERT INTO customer_t1 VALUES (?,?)");
	      for (int i = 0; i < 3; i++) {
	        //添加参数。
	        pst.setInt(1, i);
	        pst.setString(2, "data " + i);
	        pst.addBatch();
	      }
	      //执行批处理。
	      pst.executeBatch();
	      pst.close();
	    } catch (SQLException e) {
	      if (pst != null) {
	        try {
	          pst.close();
	        } catch (SQLException e1) {
	        e1.printStackTrace();
	        }
	      }
	      e.printStackTrace();
	    }
	  }

	  //执行预编译语句，更新数据。
	  public static void ExecPreparedSQL(Connection conn) {
	    PreparedStatement pstmt = null;
	    try {
	      pstmt = conn
	          .prepareStatement("UPDATE customer_t1 SET c_customer_name = ? WHERE c_customer_sk = 1");
	      pstmt.setString(1, "new Data");
	      int rowcount = pstmt.executeUpdate();
	      pstmt.close();
	    } catch (SQLException e) {
	      if (pstmt != null) {
	        try {
	          pstmt.close();
	        } catch (SQLException e1) {
	          e1.printStackTrace();
	        }
	      }
	      e.printStackTrace();
	    }
	  }


	//执行存储过程。
	  public static void ExecCallableSQL(Connection conn) {
	    CallableStatement cstmt = null;
	    try {
	      
	      cstmt=conn.prepareCall("{? = CALL TESTPROC(?,?,?)}");
	      cstmt.setInt(2, 50); 
	      cstmt.setInt(1, 20);
	      cstmt.setInt(3, 90);
	      cstmt.registerOutParameter(4, Types.INTEGER);  //注册out类型的参数，类型为整型。
	      cstmt.execute();
	      int out = cstmt.getInt(4);  //获取out参数
	      System.out.println("The CallableStatment TESTPROC returns:"+out);
	      cstmt.close();
	    } catch (SQLException e) {
	      if (cstmt != null) {
	        try {
	          cstmt.close();
	        } catch (SQLException e1) {
	          e1.printStackTrace();
	        }
	      }
	      e.printStackTrace();
	    }
	  }
	  

	  /**
	   * 主程序，逐步调用各静态方法。
	   * @param args
	  */
	  public static void main(String[] args) {
	    //创建数据库连接。
	    Connection conn = GetConnection("parker", "parker@123");

	    //创建表。
	    CreateTable(conn);

	    //批插数据。
	    BatchInsertData(conn);

	    //执行预编译语句，更新数据。
	    ExecPreparedSQL(conn);

	    //执行存储过程。
	    //ExecCallableSQL(conn);//这部分在运行时有问题，直接注释掉了

	    //关闭数据库连接。
	    try {
	      conn.close();
	    } catch (SQLException e) {
	      e.printStackTrace();
	    }

	  }

}

```

# 安装中遇到的问题与解决过程
### 初始化脚本失败报错
![avatar](pic/openGauss安装/脚本报错.PNG)

![avatar](pic/openGauss安装/报错解决.PNG)

### `CentOS`上配置`JAVA`

自带的java路径寻找:

![avatar](pic/jdbc连接/自带的java路径寻找.PNG)

配置`CentOS`环境变量:

![avatar](pic/jdbc连接/java环境变量配置.PNG)

而后期验证`javac`时发现`CentOS`其自带的java仅有运行环境，改用windows作为客户端。

也可以自行下载java环境配置进行解决配置:

![avatar](pic/jdbc连接/java开发环境配置结束.PNG)

### 数据库连接问题

地址错误

![avatar](pic/jdbc连接/运行demo报地址错误.PNG)

修改后ip未放行错误

![avatar](pic/jdbc连接/修改ip后未放行错误.PNG)

放行ip命令(在官方文档`客户端接入验证`处可以查询)如下

``` gs_guc set -N all -I all -h "host all parker 192.168.201.1/32 sha256"```

具体的接入ip若不清楚可以通过报错信息或本地的ipconfig进行查看

![avatar](pic/jdbc连接/放行ip.PNG)
