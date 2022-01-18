+++

title =  "CentOs虚拟机下opengauss的配置使用" 

date = "2021-12-11" 

tags = [ "CentOs虚拟机下opengauss的配置使用"] 

archives = "2021-12" 

author = "parker" 

summary = "CentOs虚拟机下opengauss的配置使用"

img = "/zh/post/2022/title/img3.png" 

times = "12:30"

+++

# CentOs虚拟机下opengauss的配置使用<a name="ZH-CN_TOPIC_0000001232774723"></a>

## 环境说明<a name="section22781535123119"></a>

虚拟机平台 VMware

服务器端 CentOS 7.9

本机系统 Windows 10

部署版本 OpenGauss 1.1.0

## 安装详细步骤<a name="section465174803112"></a>

-   虚拟机VMware

    本机已配置，该部分省略


-   CentOS 7.9 安装

    下载镜像源CentOS-7-x86\_64-DVD-2009.iso

    ![](figures/2c62c125feb04ff89234abf76991601e.png)

-   虚拟机中选中镜像进行安装

    ![](figures/7294465883ce45ac80a371f63dfe9659.png)

    ![](figures/356c385d615b442e951be7d27f00702e.png)

-   设置

    内存设置为2GB

    处理器设置为2

    网络默认即可

    声卡和打印机不使用直接进行了移除


启动后进入系统安装，注意的点如下:

-   分区

    选择系统-安装位置-手动分区进行分区如下:

    ![](figures/5d3d9f82ce164b08a6866a606fd7e03d.png)

    ![](figures/f569229a746940cba90ed0cda6fd1d2f.png)

-   网络和主机名

    选择系统-网络和主机名进行设置如下:

    ![](figures/0bacb67d8b9d4ff6b786b2b734458b10.png)

    ![](figures/5e12f329abe74ed38ae99d8828adaa5d.png)

    记录ip和主机名，之后配置需要用到

    ```
    ip 192.168.201.131
    主机名 db1
    ```

-   软件选择

    选择软件-软件选择设置如下:

    ![](figures/721e491c70e948abadf18b2eda7ce76f.png)

-   用户设置

    上述设置完成后点击开始安装，该期间根据提示完成用户设置即可

    ![](figures/22b37a0e95ea4472b4d331064192382c.png)

    安装完成进行重启，登录系统完成安装

    ![](figures/1e1aea950edc44d99adc91c658a9e14a.png)

-   上网测试

    ![](figures/0feab0d29d324acc9c4e87ffc7a3e826.png)

-   修改操作系统版本\(CentOS 7.6可省略\)

    通过

    vi /etc/redhat-releas打开编辑文件，修改内容如下\(请使用su root切换至root用户进行操作\)

    ![](figures/c726f71fc88c4015b1d89f4586dfe290.png)

-   关闭防火墙

    执行以下命令关闭防火墙

    ```
    systemctl stop firewalld.service
    
    systemctl disable firewalld.service
    ```

    ![](figures/614036c6b5d84a0c86de61b3cbf88b78.png)

-   设置字符集及环境变量

    ![](figures/ba1ea7c4485b4830b21538d56ecac309.png)

-   关闭swap交换内存

    ![](figures/2775a3f24eb44c02931d63e302a4bf9c.png)

-   yum环境配置

    备份yum配置文件

    ![](figures/27b944a22e1d45b39a0167b83e4d55a0.png)

-   下载可用源的repo文件

    ![](figures/3507d173b3e24d9f94dd543947ae33ef.png)

-   查看repo文件是否正确

    ![](figures/1e185faf72d14f6bb07e527d753614ed.png)

-   yum安装相关包

    ```
    yum install -y libaio-devel flex bison ncurses-devel glibc.devel patch lsb_release wget python3
    ```

    ![](figures/dc1c632c7c0f49f2ab7ebd57f78915d6.png)

    设置python版本为3.x

    ![](figures/641abf7f6c9642b188ade66b1c8d25ee.png)

-   修改完成后，确认yum是否使用，若不能使用，如本例中。修改/usr/bin/yum文件，修改\#!/usr/bin/python为\#!/usr/bin/python2.7

    ![](figures/61364d2741cc46f7802cb48cc75571fe.png)


## 数据库安装<a name="section181542455445"></a>

-   创建存放数据库安装目录

    ![](figures/cd094375c2b44a8383694267e492fc63.png)

-   下载数据库安装包

    ![](figures/a6d0fc02a8c948f2b43e4ef47cecd731.png)


-   创建xml配置文件，用于数据库安装

    在openGauss文件夹下

    vi clusterconfig.xml编辑以下内容

    ```
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

    其中ip设置为之前的192.168.201.131,主机名为db1，如下:

    ![](figures/d21813079e7b40a1b9edde6b9298d2f3.png)


-   解压安装包

    ![](figures/7a7b1fc98317411a9a18982e944ba5c2.png)


-   解压后查看并修改文件权限

    ![](figures/128f20b65c554c85bbcda62acad5616e.png)

-   执行初始化脚本

    ```
    cd /opt/software/openGauss/script
    
    python gs_preinstall -U omm -G dbgrp -X /opt/software/openGauss/clusterconfig.xml 
    ```

    返回Preinstallation succeeded内容时,初始化完成

    ![](figures/ee22045a1dca446b925881137106db5c.png)

-   初始化数据库

    重启虚拟机后使用omm用户进行数据库初始化

    ```
    gs_install -X /opt/software/openGauss/clusterconfig.xml --gsinit-parameter="--encoding=UTF8" --dn-guc="max_process_memory=2GB" --dn-guc="shared_buffers=128MB" --dn-guc="bulk_write_ring_size=128MB" --dn-guc="cstore_buffers=16MB"
    ```

    其中对应的参数内存大小须根据虚拟机情况进行设置

    ![](figures/816de1e0a8c04796a4f3478eff37baed.png)

-   安装完成后清理软件安装包

    ![](figures/387c8fc827e34000936c977270c10f22.png)


## 连接数据库<a name="section7184172713538"></a>

![](figures/faa8002b28d94f5b9408f0e251daebc7.png)

-   JDBC配置

    从官方网站选取对应版本的jar包并解压，在eclipse上配置加载驱动类。

    第一次连接后操作数据库需要修改omm用户密码

    ![](figures/0497eb639cb14b5182dc5b2aff97a757.png)

    根据官方文档提供的demo程序修改后进行连接测试，连接成功如下:

    ![](figures/cb8039252a6b45e99d8ff682fb9df992.png)

-   demo程序:

    ```
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


## 安装中遇到的问题与解决过程<a name="section856721735711"></a>

-   初始化脚本失败报错

    ![](figures/a662d9a9a96b40d089a6d9c68788bf3d.png)

    ![](figures/dbc89373c5734638a51add74523f640c.png)

-   CentOS上配置JAVA

    自带的java路径寻找:

    ![](figures/480ae4bbdd664652af43663f061aae84.png)

    配置CentOS环境变量:

    ![](figures/17fb09d479354307b7e2a8b27cbd2f7e.png)

    而后期验证javac时发现CentOS其自带的java仅有运行环境，改用windows作为客户端。

-   也可以自行下载java环境配置进行解决配置:

    ![](figures/05476910e9e44c9fb0723d26b0f467f4.png)

-   数据库连接问题

    修改后ip未放行错误

    ![](figures/591c2725601c492cbccf312e9b2a7a11.png)

    放行ip命令\(在官方文档客户端接入验证处可以查询\)如下

    ```
    gs_guc set -N all -I all -h "host all parker 192.168.201.1/32 sha256"
    ```

    具体的接入ip若不清楚可以通过报错信息或本地的ipconfig进行查看


