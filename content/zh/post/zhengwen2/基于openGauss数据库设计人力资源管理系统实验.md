+++

title = "基于openGauss数据库设计人力资源管理系统实验" 

date = "2021-07-10" 

tags = ["基于openGauss数据库设计人力资源管理系统实验"] 

archives = "2021-07" 

author = "瓜西西" 

summary = "基于openGauss数据库设计人力资源管理系统实验"

img = "/zh/post/zhengwen2/img/img33.jpg" 

times = "12:30"

+++

# 基于openGauss数据库设计人力资源管理系统实验<a name="ZH-CN_TOPIC_0000001085018737"></a> 

<html data-n-head-ssr>
  <body >

<div class="info-item flex" data-v-229ac844><i class="cs-eye" data-v-229ac844></i> <span class="ml4" data-v-229ac844></span></div></div></div> <div class="emcs-page-content" data-v-229ac844><div class="main-box" data-v-229ac844><div class="db-detail-content emcs-table" data-v-229ac844><div class="editor-content-styl" data-v-229ac844><p><span style="font-size: 1em;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;本文主要面向openGauss数据库初学者，帮助初学者完成一些简单的数据库管理以及GUI，设计一个简单的人力资源管理系统。本文只包含部分代码，读者需要结合自己的数据库弹性公网、数据库用户及其密码等自身信息做出相应的修改。</span><br></p><h1>一、实验环<span style="font-weight: normal;"></span>境</h1><p>使用程序：putty.exe；
</p><p>IntelliJ IDEA 2021.1.1；
</p><p>apache-tomcat-9.0.46
</p><p>服务器名称：ecs-d8b3
</p><p>弹性公网：121.36.79.196
</p><p>端口号：26000
</p><p>表空间名：human_resource_space
</p><p>数据库名称：human_resource
</p><p>员工、部门经理登录账号：其员工ID
</p><p>员工、部门经理登录密码：123456
</p><p>人事经理登录账号：hr001
</p><p>人事经理登录密码：hr001
</p><p>登录入口（需在tomcat启动之后才能运行）：http://localhost:8080/gaussdb2_war/login.jsp
</p><h1>二、创建和管理openGauss数据库
</h1><p> 进行以下步骤前，需预先购买弹性云服务器 ECS ，并把需要的软件以及需要调用的包预先下载好。
</p><h2>2.1 数据库存储管理
</h2><h2>2.1.1 连接弹性云服务器
</h2><p>     我们使用 SSH 工具PuTTY，从本地电脑通过配置弹性云服务器的弹性公网 IP地址来连接 ECS，并使用 ROOT 用户来登录。 
</p><p>（1）点击putty.exe,打开putty
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-91f7f344-2fbf-468e-ade6-48dcab5166db.png" style="max-width:100%;"><br></p><p>（2）输入弹性公网IP，点击open，连接弹性云服务器
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-24486cb1-ca2c-437c-92a9-38f7d68fd7da.png" style="max-width:100%;"><br></p><p><span style="color: inherit; font-family: inherit; font-size: 1.17em;">2.1.2 启动、停止和连接数据库</span><br></p><h4>2.1.1.1 启动数据库
</h4><p>（1）使用root登录
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-8ca88de2-745e-4b7a-a36d-4f331aeccf41.png" style="max-width:100%;"><br></p><p>（2）切换至omm操作系统用户环境
</p><p>使用语句切换至omm操作系统用户环境
</p><blockquote><p>su - omm&nbsp;<br></p></blockquote><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-a24121e0-c128-4387-8861-a484ecd614e9.png" style="max-width:100%;"><br></p><p>（3）启动数据库
</p><p>使用语句启动数据库
</p><blockquote><p>gs_om -t start&nbsp;<br></p></blockquote><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-2a1bff3e-851b-4c1e-ac64-6d8a4d5ed3c5.png" style="max-width:100%;"><br></p><p>
</p><h4>2.1.1.2 停止数据库
</h4><p>如有需要，可以使用语句停止数据库
</p><blockquote><p>&nbsp;gs_om -t stop&nbsp;<br></p></blockquote><p><br></p><h4>2.1.1.3 连接数据库
</h4><p>使用 语句连接数据库。
</p><blockquote><p>gsql -d dbname -p port -U username -W password -r&nbsp;<br></p></blockquote><p><br></p><p>其中,  -d 数据库名   -p  端口名   -U 用户名    -W 密码     -r 开启客户端操作历史记录功能 
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-69a5ea51-2237-47a0-9e89-91be1dc9bdae.png" style="max-width:100%;"><br></p><p>图中使用 gsql -d postgres -p 26000 -r 连接postgres数据库。postgres 为 openGauss 安装完成后默认生成的数据库，初始可以连接到此数据库进行新数据库的创建。26000 为数据库主节点的端口号。
</p><h3>2.1.3 创建和管理用户、表空间、数据库和模式
</h3><h4>2.1.3.1 创建用户
</h4><p>使用以下语句创建用户。请牢记设置的用户名以及密码，之后需要多次使用。建议将密码都设置为相同的简单密码，方便之后的操作。
</p><blockquote><p>CREATE USER user_name PASSWORD pass_word<br></p></blockquote><p><br></p><h4>2.1.3.2 管理用户
</h4><p>可以使用以下语句对用户进行操作：
</p><p>修改密码：</p><blockquote><p>ALTER USER a IDENTIFIED BY 'Abcd@123' REPLACE ‘Guass@123';&nbsp;<br></p></blockquote><p><br></p><p>删除用户：</p><blockquote><p>DROP USER a CASCADE;<br></p></blockquote><p><br></p><p>
</p><h4>2.1.3.3 创建表空间
</h4><p>使用以下语句创建表空间。(路径需使用单引号)
</p><blockquote><p>&nbsp;CREATE TABLESPACE human_resource_space RELATIVE LOCATION 'tablespace/tablespace_2';&nbsp;</p></blockquote><p>创建表空间 human_resource_space，表空间路径为：tablespace/tablespace_2
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-cc70c5d3-98ba-45fe-807c-cb198baa9079.png" style="max-width:100%;"><br></p><p>
</p><h4>2.1.3.4 管理表空间
</h4><p><b>（1）赋予用户表空间访问权限</b>
</p><p>使用以下语句，数据库系统管理员将human_resource_space表空间的访问权限赋予数据用户 a
</p><blockquote><p>&nbsp;GRANT CREATE ON TABLESPACE human_resource_space TO a;&nbsp;<br></p></blockquote><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-026cc5cc-86d8-427b-b209-8a728feb15a7.png" style="max-width:100%;"><br></p><p>
</p><p>（2）管理表空间
</p><p>如有需要，可以使用如下语句 或 \db 语句查询表空间。
</p><blockquote><p>SELECT spcname FROM pg_tablespace;<br></p></blockquote><p><br></p><p>可使用以下语句删除表空间 
</p><blockquote><p>DROP TABLESPACE tablespace_1；<br></p></blockquote><p><br></p><p>
</p><h4>2.1.3.5 创建数据库
</h4><p>为用户a在表空间human_resource_space上创建数据库human_resource
</p><blockquote><p>&nbsp;CREATE DATABASE human_resource WITH TABLESPACE = human_resource_space OWNER a;&nbsp;<br></p></blockquote><p><br></p><p>
</p><h4>2.1.3.6 管理数据库
</h4><p>可以使用以下语句管理数据库：
</p><blockquote><p>SELECT datname FROM pg_database;&nbsp;</p></blockquote><p>或 \l 查看数据库<br></p><blockquote><p>DROP DATABASE testdb；</p></blockquote><p>删除数据库<br></p><h4>2.1.3.7 创建模式
</h4><p>输入 \q 退出postgres数据库。
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-61b2509b-d263-4d0c-a13f-9947d822bf6d.png" style="max-width:100%;"><br></p><blockquote><p>&nbsp;gsql -d human_resource -p 26000 -U a -W aaa. -r</p></blockquote><p><br></p><p>连接数据库human_resource。出现如下信息则连接成功：
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-67a3e24f-0285-4dfe-bd55-f6d270dc82e9.png" style="max-width:100%;"><br></p><p>
</p><p>使用语句</p><blockquote><p>&nbsp;CREATE SCHEMA a AUTHORIZATION a;&nbsp;</p></blockquote><p>&nbsp;为用户创建同名模式a
</p><p>
</p><h4>2.1.3.8 管理模式</h4><blockquote><p>&nbsp;SET SEARCH_PATH TO a,public;&nbsp;</p></blockquote><p>设置模式a为默认查询模式（设置中第一个为默认模式）
</p><p>如有需要，可以使用语句  \dn  查看模式 ，SHOW SEARCH_PATH;   查看模式搜索路径
</p><h2>2.2 数据库对象管理实验
</h2><h3>2.2.1 创建表
</h3><p>使用以下语句，在数据库human_resource_space，创建人力资源库的8个基本表。
</p><blockquote><p>CREATE TABLE table_name
</p><p> ( col1  datatype   constraint, 
</p><p>  col2  datatype   constraint, 
</p><p>  …    
</p><p>coln  datatype   constraint )； 
</p></blockquote><p><br></p><p>我们为了完成人力资源管理系统，创建雇佣历史表  employment_history 、部门表  sections、创建工作地点表  places、创建区域表 areas 、大学表 college、雇佣表 employments  、国家及地区表  states 、员工表 staffs这8个基本表。
</p><p>以员工表为例：
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-628c25c7-10a5-42db-9af6-db6b008ecc35.png" style="max-width:100%;"><br></p><h3>2.2.2 删除表
</h3><p>如有需要，可以使用</p><blockquote><p>DROP TABLE sections；</p></blockquote><p>或&nbsp;</p><blockquote><p>&nbsp;DROP TABLE sections CASCADE ；</p></blockquote><p>语句删除表。
</p><h2>2.3 数据初始化
</h2><h3>2.3.1 初始化数据表
</h3><p>我们这里方便操作，根据给定的txt文件初始化数据表，如果不嫌麻烦，也可以使用insert语句一条一条地插入。这两种方法本质上是一样的。
</p><p>使用&nbsp;</p><blockquote><p>&nbsp;INSERT INTO table_name \i /a.sql&nbsp;</p></blockquote><p>&nbsp;语句初始化数据表（其中， a.sql是指定路径，执行给定的SQL脚本 ）
</p><p>使用&nbsp;</p><blockquote><p>SELECT * from table_name;&nbsp;</p></blockquote><p>&nbsp;语句查看数据表信息。
</p><p>以雇佣表 employments为例：
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-3815668c-fb6d-4586-a8e7-c772ddb05502.png" style="max-width:100%;"><br></p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-293960e0-670d-4ba7-97f3-cbb1a5a87d97.png" style="max-width:100%;"><br></p><p>
</p><h1>三、数据库应用程序开发
</h1><p>常见的数据库应用程序开发步骤为:
</p><p>(1) 加载驱动
</p><p>(2) 连接数据库
</p><p>(3) 执行SQL语句
</p><p>(4) 处理结果集
</p><p>(5) 关闭连接
</p><p>我们根据这5个步骤，实现人力资源管理系统。
</p><h2><b>3.1 项目框架</b>
</h2><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-d0c32cb8-9da4-4126-b2b2-ec9246229ddf.png" style="max-width:100%;"><br></p><h3>3.1.1 BLL
</h3><p>业务逻辑层，实现各项操作模块与servlet的接口，对传送数据进行逻辑判断分折，并进行传送正确的值。
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-9125f3e9-b3b0-4cf2-9461-f998ad6e9d4d.png" style="max-width:100%;"><br></p><h3>3.1.2 Model
</h3><p>存放数据库表字段。在程序中，使用到的表有员工历史雇佣信息表、工作地点表、工作部门表、员工表。
</p><p>这些java文件主要作用是定义各表的set和get函数
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-f64d285c-d6d1-468b-a5b5-86cc166cba5f.png" style="max-width:100%;"><br></p><h3>3.1.3 cn.UI
</h3><p>实现用户界面
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-cd7430fb-a6da-48c1-8e2a-05ce5256d966.png" style="max-width:100%;"><br></p><h3>3.1.4 Dao
</h3><p>实现具体的对数据库的操作，其中包含具体操作的函数以及SQL语句
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-015b8390-0059-4cab-92d5-a582e15c9659.png" style="max-width:100%;"><br></p><h3>3.1.4 Util
</h3><p>实现获得参数并传递参数以及连接数据库的功能
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-11a1e33f-81fa-45b9-88a4-5261d3925837.png" style="max-width:100%;"><br></p><h3>3.1.4 webapp
</h3><p>存放.jsp代码，生成具体页面。其中WEB-INF中存放web.xml文件
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-b5dd6d7f-3d6b-4b26-aed8-20ad9d40ac08.png" style="max-width:100%;"><br></p><p>登录页面：
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-84756b3e-69cc-4973-8f7c-2086b1be3a60.png" style="max-width:100%;"><br></p><p>
</p><p>HRmanager页面：
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-59edabad-2411-42a7-a682-6bf9c19154c4.png" style="max-width:100%;"><br></p><p>
</p><p>manager页面：
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-29582a37-ad04-4f31-8ca4-56879bd6c210.png" style="max-width:100%;"><br></p><p>
</p><p>staff页面：
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-bfd36724-86ef-4715-921e-35363e1b258b.png" style="max-width:100%;"><br></p><p>
</p><h2>6.2 修改表staffs
</h2><p>为了实现登录功能，我们需要在员工表staffs中增加一列password，为了方便起见，我们设置密码都为123456，当然也可以自己设置差异化的密码。
</p><blockquote><p>ALTER TABLE staffs ADD password varchar2(20);
</p></blockquote><p><br></p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-915e7ae9-5e31-4e4f-a687-ce504a9e809c.png" style="max-width:100%;"><br></p><blockquote><p>UPDATE staffs SET password = 123456;
</p></blockquote><p><br></p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-8c3d1436-5c2d-4ade-b108-7ec196e50131.png" style="max-width:100%;"><br></p><p>设置hr登录账号为hr001,密码为hr001
</p><p>
</p><h2>6.3 加载驱动&amp;连接数据库
</h2><p>JDBC为JAVA中用来访问数据库的程序接口，我们使用JDBC连接。
</p><p>文件路径为：
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-2ce558b0-3e46-4ecb-b9b4-b897555e4bea.png" style="max-width:100%;"><br></p><p>源码：
</p><blockquote><pre><code><p>package Util;
</p><p>
</p><p>import java.sql.Connection;
</p><p>import java.sql.DriverManager;
</p><p>import java.sql.PreparedStatement;
</p><p>import java.sql.SQLException;
</p><p>import java.sql.Statement;
</p><p>
</p><p>public class connect { <i>//根据用户名与密码，进行数据库的连接以及关闭连接</i>
</p><p><i>    </i>private static String <i>DBDriver</i>="org.postgresql.Driver";
</p><p>    private static String <i>url</i>="jdbc:postgresql://121.36.79.196:26000/human_resource";
</p><p>    private static String <i>user</i>="a";
</p><p>    private static String <i>password</i>="aaa";
</p><p>    static Connection <i>con</i>=null;
</p><p>    static Statement <i>sta</i>=null;
</p><p>    static PreparedStatement <i>pst </i>=null;
</p><p>    <i>//创建数据库的连接</i>
</p><p><i>    </i>public static Connection getConnection()
</p><p>    {
</p><p>        try {
</p><p>            Class.<i>forName</i>(<i>DBDriver</i>);
</p><p>            try {
</p><p>                <i>con </i>= DriverManager.<i>getConnection</i>(<i>url</i>, <i>user</i>, <i>password</i>);
</p><p>                return <i>con</i>;
</p><p>            } catch (SQLException e) {
</p><p>                <i>// TODO Auto-generated catch block</i>
</p><p><i>                </i>e.printStackTrace();
</p><p>            }
</p><p>        } catch (ClassNotFoundException e1) {
</p><p>            <i>// TODO Auto-generated catch block</i>
</p><p><i>            </i>e1.printStackTrace();
</p><p>        }
</p><p>
</p><p>        return null;
</p><p>    }
</p><p>
</p><p>    public static Statement createStatement()
</p><p>    {
</p><p>        try {
</p><p>            <i>sta</i>=<i>getConnection</i>().createStatement();
</p><p>            return <i>sta</i>;
</p><p>        } catch (SQLException e) {
</p><p>            <i>// TODO Auto-generated catch block</i>
</p><p><i>            </i>e.printStackTrace();
</p><p>        }
</p><p>        return null;
</p><p>    }
</p><p>
</p><p>    <i>//创造预处理对象</i>
</p><p><i>    </i>public static PreparedStatement createPreparedStatement(String sql)
</p><p>    {
</p><p>        try {
</p><p>            <i>pst </i>= <i>getConnection</i>().prepareStatement(sql);
</p><p>            return <i>pst</i>;
</p><p>        } catch (SQLException e) {
</p><p>            <i>// TODO Auto-generated catch block</i>
</p><p><i>            </i>e.printStackTrace();
</p><p>        }
</p><p>        return <i>pst</i>;
</p><p>    }
</p><p>
</p><p>    <i>//关闭所有打开的资源</i>
</p><p><i>    </i>public static void closeOperation()
</p><p>    {
</p><p>        if(<i>pst </i>==null)
</p><p>        {
</p><p>            try {
</p><p>                <i>pst</i>.close();
</p><p>            } catch (SQLException e) {
</p><p>                <i>// TODO Auto-generated catch block</i>
</p><p><i>                </i>e.printStackTrace();
</p><p>            }
</p><p>        }
</p><p>        if(<i>sta</i>==null)
</p><p>        {
</p><p>            try {
</p><p>                <i>sta</i>.close();
</p><p>            } catch (SQLException e) {
</p><p>                <i>// TODO Auto-generated catch block</i>
</p><p><i>                </i>e.printStackTrace();
</p><p>            }
</p><p>        }
</p><p>        if(<i>con</i>==null)
</p><p>        {
</p><p>            try {
</p><p>                <i>con</i>.close();
</p><p>            } catch (SQLException e) {
</p><p>                <i>// TODO Auto-generated catch block</i>
</p><p><i>                </i>e.printStackTrace();
</p><p>            }
</p><p>        }
</p><p>
</p><p>    }
</p><p>
</p><p>}
</p></code></pre></blockquote><p><br></p><h2>
</h2><h2>6.4 实现具体功能
</h2><p>文件路径：
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-061131b9-51f4-4c17-b3e1-88a16b8d03ed.png" style="max-width:100%;"><br></p><p>
</p><p>完整源码：
</p><blockquote><pre><code><p>package Dao;
</p><p>
</p><p>import java.sql.ResultSet;
</p><p>import java.sql.SQLException;
</p><p>import java.util.ArrayList;
</p><p>import java.util.List;
</p><p>
</p><p>import Model.*;
</p><p>import Util.getInformation;
</p><p>
</p><p>public class operate {
</p><p>
</p><p><i>//********************************登录**************************************</i>
</p><p><i>    //实现登录操作,登录成功返回true</i>
</p><p><i>    </i>public String login(String staff_id,String password){
</p><p>        if(staff_id.equals("hr001")){
</p><p>            if (password.equals("hr001")){
</p><p>                return staff_id;
</p><p>            }else {
</p><p>                return null;
</p><p>            }
</p><p>
</p><p>        }else {
</p><p>            String sql="select staff_id,password from staffs ";
</p><p>            ResultSet rs=Util.getInformation.<i>executeQuery</i>(sql);
</p><p>            try {
</p><p>                while(rs.next()){ <i>//用户输入的账号密码和数据库中的信息做比较，判断输入是否正确；</i>
</p><p><i>                    </i>Integer id = rs.getInt("staff_id");
</p><p>                    String pwd = rs.getString("password");
</p><p>                    if(id.equals(new Integer(staff_id)) &amp;&amp; pwd.equals(password)){
</p><p>                        return staff_id;
</p><p>                    }
</p><p>                }
</p><p>                rs.close();
</p><p>            } catch (Exception e) {
</p><p>                <i>// TODO Auto-generated catch block</i>
</p><p><i>                </i>e.printStackTrace();
</p><p>            }
</p><p>        }
</p><p>        return null;
</p><p>    }
</p><p>
</p><p>    <i>//判断该员工是否为部门经理，返回部门编号</i>
</p><p><i>    </i>public String isManager(String staff_id){
</p><p>
</p><p>        String sql="select section_id,manager_id from sections";
</p><p>        ResultSet rs=Util.getInformation.<i>executeQuery</i>(sql);
</p><p>        try {
</p><p>            while(rs.next()){ <i>//用户输入的账号密码和数据库中的信息做比较，判断输入是否正确；</i>
</p><p><i>                </i>Integer id = rs.getInt("manager_id");
</p><p>                String section_id = rs.getString("section_id");
</p><p>                if(id.equals(new Integer(staff_id))){
</p><p>                    return section_id;
</p><p>                }
</p><p>            }
</p><p>            rs.close();
</p><p>        } catch (Exception e) {
</p><p>            <i>// TODO Auto-generated catch block</i>
</p><p><i>            </i>e.printStackTrace();
</p><p>        }
</p><p>        return "null";
</p><p>    }
</p><p>
</p><p>
</p><p>
</p><p>
</p><p>
</p><p><i>//**********************************员工操作***********************************</i>
</p><p>
</p><p><i>    //修改电话号码</i>
</p><p><i>    </i>public void updatePhoneNumber(String phone_number,String staff_id){
</p><p>        String sql = "update staffs set phone_number=? where staff_id=? ";
</p><p>        Util.getInformation.<i>executeUpdate</i>(sql, phone_number, new Integer(staff_id));
</p><p>    }
</p><p>
</p><p>
</p><p><i>//**********************************部门经理**********************************</i>
</p><p><i>    //查询部门所有员工信息(按员工编号升序排列)</i>
</p><p><i>    </i>public List QuerySectionStaffsOrderByStaffId(Integer section_id)
</p><p>    {
</p><p>        List<staffs> list=new ArrayList<staffs>();   <i>//最终返回整个list集合</i>
</staffs></staffs></p><p><i>        </i>String sql="select * from staffs where section_id=? order by staff_id asc";
</p><p>        ResultSet rs=getInformation.<i>executeQuery</i>(sql,section_id);
</p><p>        try {
</p><p>            while(rs.next())
</p><p>            {
</p><p>                <i>//保存取出来的每一条记录</i>
</p><p><i>                </i>staffs staff =new staffs();
</p><p>                staff.setStaff_id(rs.getInt("staff_id"));
</p><p>                staff.setFirst_name(rs.getString("first_name"));
</p><p>                staff.setLast_name(rs.getString("last_name"));
</p><p>                staff.setEmail(rs.getString("email"));
</p><p>                staff.setPhone_number(rs.getString("phone_number"));
</p><p>                staff.setHire_date(rs.getDate("hire_date"));
</p><p>                staff.setEmployment_id(rs.getString("employment_id"));
</p><p>                staff.setSalary(rs.getInt("salary"));
</p><p>                staff.setCommission_pct(rs.getInt("commission_pct"));
</p><p>                staff.setManager_id(rs.getInt("manager_id"));
</p><p>                staff.setSection_id(rs.getInt("section_id"));
</p><p>                staff.setGraduated_name(rs.getString("graduated_name"));
</p><p>                staff.setPassword(rs.getString("password"));
</p><p>                list.add(staff);
</p><p>            }
</p><p>        } catch (SQLException e) {
</p><p>            <i>// TODO Auto-generated catch block</i>
</p><p><i>            </i>e.printStackTrace();
</p><p>        }
</p><p>        return list;
</p><p>    }
</p><p>
</p><p>    <i>//查询部门所有员工信息(按工资降序排列)</i>
</p><p><i>    </i>public List QuerySectionStaffsOrderBySalary(Integer section_id)
</p><p>    {
</p><p>        List<staffs> list=new ArrayList<staffs>();   <i>//最终返回整个list集合</i>
</staffs></staffs></p><p><i>        </i>String sql="select * from staffs where section_id=? order by salary desc";
</p><p>        ResultSet rs=getInformation.<i>executeQuery</i>(sql,section_id);
</p><p>        try {
</p><p>            while(rs.next())
</p><p>            {
</p><p>                <i>//保存取出来的每一条记录</i>
</p><p><i>                </i>staffs staff =new staffs();
</p><p>                staff.setStaff_id(rs.getInt("staff_id"));
</p><p>                staff.setFirst_name(rs.getString("first_name"));
</p><p>                staff.setLast_name(rs.getString("last_name"));
</p><p>                staff.setEmail(rs.getString("email"));
</p><p>                staff.setPhone_number(rs.getString("phone_number"));
</p><p>                staff.setHire_date(rs.getDate("hire_date"));
</p><p>                staff.setEmployment_id(rs.getString("employment_id"));
</p><p>                staff.setSalary(rs.getInt("salary"));
</p><p>                staff.setCommission_pct(rs.getInt("commission_pct"));
</p><p>                staff.setManager_id(rs.getInt("manager_id"));
</p><p>                staff.setSection_id(rs.getInt("section_id"));
</p><p>                staff.setGraduated_name(rs.getString("graduated_name"));
</p><p>                staff.setPassword(rs.getString("password"));
</p><p>                list.add(staff);
</p><p>            }
</p><p>        } catch (SQLException e) {
</p><p>            <i>// TODO Auto-generated catch block</i>
</p><p><i>            </i>e.printStackTrace();
</p><p>        }
</p><p>        return list;
</p><p>    }
</p><p>
</p><p>    <i>//根据员工号查询部门内员工，然后返回该员工信息</i>
</p><p><i>    </i>public staffs QuerySectionStaffByStaff_id(Integer staff_id,Integer section_id)
</p><p>    {
</p><p>        staffs staff =new staffs();
</p><p>        String sql="select * from staffs where staff_id=? and section_id=?";
</p><p>        ResultSet rs=getInformation.<i>executeQuery</i>(sql, staff_id,section_id);
</p><p>        try {
</p><p>            if(rs.next())
</p><p>            {
</p><p>                staff.setStaff_id(rs.getInt("staff_id"));
</p><p>                staff.setFirst_name(rs.getString("first_name"));
</p><p>                staff.setLast_name(rs.getString("last_name"));
</p><p>                staff.setEmail(rs.getString("email"));
</p><p>                staff.setPhone_number(rs.getString("phone_number"));
</p><p>                staff.setHire_date(rs.getDate("hire_date"));
</p><p>                staff.setEmployment_id(rs.getString("employment_id"));
</p><p>                staff.setSalary(rs.getInt("salary"));
</p><p>                staff.setCommission_pct(rs.getInt("commission_pct"));
</p><p>                staff.setManager_id(rs.getInt("manager_id"));
</p><p>                staff.setSection_id(rs.getInt("section_id"));
</p><p>                staff.setGraduated_name(rs.getString("graduated_name"));
</p><p>                staff.setPassword(rs.getString("password"));
</p><p>            }
</p><p>        } catch (NumberFormatException | SQLException e) {
</p><p>            <i>// TODO Auto-generated catch block</i>
</p><p><i>            </i>e.printStackTrace();
</p><p>        }
</p><p>        return staff;
</p><p>    }
</p><p>
</p><p>    <i>//根据员工姓名查询部门内员工，然后返回该员工信息</i>
</p><p><i>    </i>public staffs QuerySectionStaffByFirstName(String first_name,Integer section_id)
</p><p>    {
</p><p>        staffs staff =new staffs();
</p><p>        String sql="select * from staffs where first_name=? and section_id=?";
</p><p>        ResultSet rs=getInformation.<i>executeQuery</i>(sql, first_name,section_id);
</p><p>        try {
</p><p>            if(rs.next())
</p><p>            {
</p><p>                staff.setStaff_id(rs.getInt("staff_id"));
</p><p>                staff.setFirst_name(rs.getString("first_name"));
</p><p>                staff.setLast_name(rs.getString("last_name"));
</p><p>                staff.setEmail(rs.getString("email"));
</p><p>                staff.setPhone_number(rs.getString("phone_number"));
</p><p>                staff.setHire_date(rs.getDate("hire_date"));
</p><p>                staff.setEmployment_id(rs.getString("employment_id"));
</p><p>                staff.setSalary(rs.getInt("salary"));
</p><p>                staff.setCommission_pct(rs.getInt("commission_pct"));
</p><p>                staff.setManager_id(rs.getInt("manager_id"));
</p><p>                staff.setSection_id(rs.getInt("section_id"));
</p><p>                staff.setGraduated_name(rs.getString("graduated_name"));
</p><p>                staff.setPassword(rs.getString("password"));
</p><p>            }
</p><p>        } catch (NumberFormatException | SQLException e) {
</p><p>            <i>// TODO Auto-generated catch block</i>
</p><p><i>            </i>e.printStackTrace();
</p><p>        }
</p><p>        return staff;
</p><p>    }
</p><p>
</p><p>
</p><p>
</p><p>
</p><p>    public List SectionStatistics(String section_id)
</p><p>    {
</p><p>        ArrayList<integer> list =new ArrayList<integer>(); <i>// 初始化</i>
</integer></integer></p><p><i>        </i>String sql="select avg(salary),min(salary),max(salary) from staffs where section_id = ?;";
</p><p>        ResultSet rs=getInformation.<i>executeQuery</i>(sql,section_id);
</p><p>        try {
</p><p>            while(rs.next())
</p><p>            {
</p><p>                <i>//保存取出来的每一条记录</i>
</p><p><i>                </i>list.add(rs.getInt("avg"));
</p><p>                list.add(rs.getInt("max"));
</p><p>                list.add(rs.getInt("min"));
</p><p>            }
</p><p>        } catch (SQLException e) {
</p><p>            <i>// TODO Auto-generated catch block</i>
</p><p><i>            </i>e.printStackTrace();
</p><p>        }
</p><p>        return list;
</p><p>    }
</p><p>
</p><p>
</p><p>
</p><p>
</p><p>    <i>//******************************人事经理操作*****************************************</i>
</p><p><i>    //根据员工号查询员工，然后返回该员工信息</i>
</p><p><i>    </i>public staffs QueryStaffByStaff_id(Integer staff_id)
</p><p>    {
</p><p>        staffs staff =new staffs();
</p><p>        String sql="select * from staffs where staff_id=?";
</p><p>        ResultSet rs=getInformation.<i>executeQuery</i>(sql, staff_id);
</p><p>        try {
</p><p>            if(rs.next())
</p><p>            {
</p><p>                staff.setStaff_id(rs.getInt("staff_id"));
</p><p>                staff.setFirst_name(rs.getString("first_name"));
</p><p>                staff.setLast_name(rs.getString("last_name"));
</p><p>                staff.setEmail(rs.getString("email"));
</p><p>                staff.setPhone_number(rs.getString("phone_number"));
</p><p>                staff.setHire_date(rs.getDate("hire_date"));
</p><p>                staff.setEmployment_id(rs.getString("employment_id"));
</p><p>                staff.setSalary(rs.getInt("salary"));
</p><p>                staff.setCommission_pct(rs.getInt("commission_pct"));
</p><p>                staff.setManager_id(rs.getInt("manager_id"));
</p><p>                staff.setSection_id(rs.getInt("section_id"));
</p><p>                staff.setGraduated_name(rs.getString("graduated_name"));
</p><p>                staff.setPassword(rs.getString("password"));
</p><p>            }
</p><p>        } catch (NumberFormatException | SQLException e) {
</p><p>            <i>// TODO Auto-generated catch block</i>
</p><p><i>            </i>e.printStackTrace();
</p><p>        }
</p><p>        return staff;
</p><p>    }
</p><p>
</p><p>    <i>//根据员工姓名查询员工，然后返回该员工信息</i>
</p><p><i>    </i>public staffs QueryStaffByFirstName(String first_name)
</p><p>    {
</p><p>        staffs staff =new staffs();
</p><p>        String sql="select * from staffs where first_name=?";
</p><p>        ResultSet rs=getInformation.<i>executeQuery</i>(sql, first_name);
</p><p>        try {
</p><p>            if(rs.next())
</p><p>            {
</p><p>                staff.setStaff_id(rs.getInt("staff_id"));
</p><p>                staff.setFirst_name(rs.getString("first_name"));
</p><p>                staff.setLast_name(rs.getString("last_name"));
</p><p>                staff.setEmail(rs.getString("email"));
</p><p>                staff.setPhone_number(rs.getString("phone_number"));
</p><p>                staff.setHire_date(rs.getDate("hire_date"));
</p><p>                staff.setEmployment_id(rs.getString("employment_id"));
</p><p>                staff.setSalary(rs.getInt("salary"));
</p><p>                staff.setCommission_pct(rs.getInt("commission_pct"));
</p><p>                staff.setManager_id(rs.getInt("manager_id"));
</p><p>                staff.setSection_id(rs.getInt("section_id"));
</p><p>                staff.setGraduated_name(rs.getString("graduated_name"));
</p><p>                staff.setPassword(rs.getString("password"));
</p><p>            }
</p><p>        } catch (NumberFormatException | SQLException e) {
</p><p>            <i>// TODO Auto-generated catch block</i>
</p><p><i>            </i>e.printStackTrace();
</p><p>        }
</p><p>        return staff;
</p><p>    }
</p><p>
</p><p>    <i>//查询所有员工信息(按员工编号升序排列)</i>
</p><p><i>    </i>public List QueryAllStaffsOrderByStaffId()
</p><p>    {
</p><p>        List<staffs> list=new ArrayList<staffs>();   <i>//最终返回整个list集合</i>
</staffs></staffs></p><p><i>        </i>String sql="select * from staffs order by staff_id asc";
</p><p>        ResultSet rs=getInformation.<i>executeQuery</i>(sql);
</p><p>        try {
</p><p>            while(rs.next())
</p><p>            {
</p><p>                <i>//保存取出来的每一条记录</i>
</p><p><i>                </i>staffs staff =new staffs();
</p><p>                staff.setStaff_id(rs.getInt("staff_id"));
</p><p>                staff.setFirst_name(rs.getString("first_name"));
</p><p>                staff.setLast_name(rs.getString("last_name"));
</p><p>                staff.setEmail(rs.getString("email"));
</p><p>                staff.setPhone_number(rs.getString("phone_number"));
</p><p>                staff.setHire_date(rs.getDate("hire_date"));
</p><p>                staff.setEmployment_id(rs.getString("employment_id"));
</p><p>                staff.setSalary(rs.getInt("salary"));
</p><p>                staff.setCommission_pct(rs.getInt("commission_pct"));
</p><p>                staff.setManager_id(rs.getInt("manager_id"));
</p><p>                staff.setSection_id(rs.getInt("section_id"));
</p><p>                staff.setGraduated_name(rs.getString("graduated_name"));
</p><p>                staff.setPassword(rs.getString("password"));
</p><p>                list.add(staff);
</p><p>            }
</p><p>        } catch (SQLException e) {
</p><p>            <i>// TODO Auto-generated catch block</i>
</p><p><i>            </i>e.printStackTrace();
</p><p>        }
</p><p>        return list;
</p><p>    }
</p><p>
</p><p>    <i>//查询所有员工信息(按工资降序排列)</i>
</p><p><i>    </i>public List QueryAllStaffsOrderBySalary()
</p><p>    {
</p><p>        List<staffs> list=new ArrayList<staffs>();   <i>//最终返回整个list集合</i>
</staffs></staffs></p><p><i>        </i>String sql="select * from staffs order by salary desc";
</p><p>        ResultSet rs=getInformation.<i>executeQuery</i>(sql);
</p><p>        try {
</p><p>            while(rs.next())
</p><p>            {
</p><p>                <i>//保存取出来的每一条记录</i>
</p><p><i>                </i>staffs staff =new staffs();
</p><p>                staff.setStaff_id(rs.getInt("staff_id"));
</p><p>                staff.setFirst_name(rs.getString("first_name"));
</p><p>                staff.setLast_name(rs.getString("last_name"));
</p><p>                staff.setEmail(rs.getString("email"));
</p><p>                staff.setPhone_number(rs.getString("phone_number"));
</p><p>                staff.setHire_date(rs.getDate("hire_date"));
</p><p>                staff.setEmployment_id(rs.getString("employment_id"));
</p><p>                staff.setSalary(rs.getInt("salary"));
</p><p>                staff.setCommission_pct(rs.getInt("commission_pct"));
</p><p>                staff.setManager_id(rs.getInt("manager_id"));
</p><p>                staff.setSection_id(rs.getInt("section_id"));
</p><p>                staff.setGraduated_name(rs.getString("graduated_name"));
</p><p>                staff.setPassword(rs.getString("password"));
</p><p>                list.add(staff);
</p><p>            }
</p><p>        } catch (SQLException e) {
</p><p>            <i>// TODO Auto-generated catch block</i>
</p><p><i>            </i>e.printStackTrace();
</p><p>        }
</p><p>        return list;
</p><p>    }
</p><p>
</p><p>    public List statistics( )
</p><p>    {
</p><p>        ArrayList<integer> list =new ArrayList<integer>(); <i>// 初始化</i>
</integer></integer></p><p><i>        </i>String sql="select avg(salary),min(salary),max(salary),section_id from staffs group by section_id;";
</p><p>        ResultSet rs=getInformation.<i>executeQuery</i>(sql);
</p><p>        try {
</p><p>            while(rs.next())
</p><p>            {
</p><p>                <i>//保存取出来的每一条记录</i>
</p><p><i>                </i>list.add(rs.getInt("section_id"));
</p><p>                list.add(rs.getInt("avg"));
</p><p>                list.add(rs.getInt("max"));
</p><p>                list.add(rs.getInt("min"));
</p><p>            }
</p><p>        } catch (SQLException e) {
</p><p>            <i>// TODO Auto-generated catch block</i>
</p><p><i>            </i>e.printStackTrace();
</p><p>        }
</p><p>        return list;
</p><p>    }
</p><p>
</p><p>    <i>//查询所有部门信息</i>
</p><p><i>    </i>public List QuerySectionOrderBySectionId()
</p><p>    {
</p><p>        List<sections> list=new ArrayList<sections>();   <i>//最终返回整个list集合</i>
</sections></sections></p><p><i>        </i>String sql="select * from sections order by section_id asc";
</p><p>        ResultSet rs=getInformation.<i>executeQuery</i>(sql);
</p><p>        try {
</p><p>            while(rs.next())
</p><p>            {
</p><p>                <i>//保存取出来的每一条记录</i>
</p><p><i>                </i>sections sections =new sections();
</p><p>                sections.setSection_id(rs.getInt("section_id"));
</p><p>                sections.setSection_name(rs.getString("section_name"));
</p><p>                sections.setManager_id(rs.getInt("manager_id"));
</p><p>                sections.setPlace_id(rs.getInt("place_id"));
</p><p>                list.add(sections);
</p><p>            }
</p><p>        } catch (SQLException e) {
</p><p>            <i>// TODO Auto-generated catch block</i>
</p><p><i>            </i>e.printStackTrace();
</p><p>        }
</p><p>        return list;
</p><p>    }
</p><p>
</p><p>    <i>//查询所有工作地点信息</i>
</p><p><i>    </i>public List QueryPlaces()
</p><p>    {
</p><p>        List<places> list=new ArrayList<places>();   <i>//最终返回整个list集合</i>
</places></places></p><p><i>        </i>String sql="select * from places";
</p><p>        ResultSet rs=getInformation.<i>executeQuery</i>(sql);
</p><p>        try {
</p><p>            while(rs.next())
</p><p>            {
</p><p>                <i>//保存取出来的每一条记录</i>
</p><p><i>                </i>places places = new places();
</p><p>                places.setPlace_id(rs.getInt("place_id"));
</p><p>                places.setStreet_address(rs.getString("street_address"));
</p><p>                places.setPostal_code(rs.getString("postal_code"));
</p><p>                places.setCity(rs.getString("city"));
</p><p>                places.setState_province(rs.getString("state_province"));
</p><p>                places.setState_id(rs.getString("state_id"));
</p><p>                list.add(places);
</p><p>            }
</p><p>        } catch (SQLException e) {
</p><p>            <i>// TODO Auto-generated catch block</i>
</p><p><i>            </i>e.printStackTrace();
</p><p>        }
</p><p>        return list;
</p><p>    }
</p><p>
</p><p>    <i>//修改部门名称</i>
</p><p><i>    </i>public void updateSectionName(String section_name,Integer section_id){
</p><p>        String sql = "update sections set section_name=? where section_id=? ";
</p><p>        Util.getInformation.<i>executeUpdate</i>(sql, section_name, section_id);
</p><p>    }
</p><p>
</p><p>    <i>//实现添加新工作地点</i>
</p><p><i>    </i>public void addPlace(places place)
</p><p>    {
</p><p>        String sql="insert into places (place_id, street_address, postal_code, city, state_province,state_id) values (?,?,?,?,?,?)";
</p><p>        Util.getInformation.<i>executeUpdate</i>(sql, place.getPlace_id(),place.getStreet_address(), place.getPostal_code(), place.getCity(), place.getState_province(), place.getState_id());
</p><p>    }
</p><p>
</p><p>    <i>// 查询员工工作信息</i>
</p><p><i>    </i>public List QueryStaffEmployment(String staff_id)
</p><p>    {
</p><p>        List<string> list=new ArrayList<string>();   <i>//最终返回整个list集合</i>
</string></string></p><p><i>        </i>String sql="SELECT staff_id,employment_id,section_id\n" +
</p><p>                "FROM staffs\n" +
</p><p>                "WHERE staff_id = ?\n" +
</p><p>                "\n" +
</p><p>                "UNION\n" +
</p><p>                "\n" +
</p><p>                "SELECT staff_id,employment_id,section_id\n" +
</p><p>                "FROM employment_history\n" +
</p><p>                "WHERE staff_id = ?;";
</p><p>        Integer id = new Integer(staff_id);
</p><p>        ResultSet rs=getInformation.<i>executeQuery</i>(sql,id,id);
</p><p>        try {
</p><p>            while(rs.next())
</p><p>            {
</p><p>                <i>//保存取出来的每一条记录</i>
</p><p><i>                </i>list.add(rs.getString("staff_id"));
</p><p>                list.add(rs.getString("employment_id"));
</p><p>                list.add(rs.getString("section_id"));
</p><p>            }
</p><p>        } catch (SQLException e) {
</p><p>            <i>// TODO Auto-generated catch block</i>
</p><p><i>            </i>e.printStackTrace();
</p><p>        }
</p><p>        return list;
</p><p>    }
</p><p>
</p><p>}
</p></code></pre></blockquote><p><br></p><h1>四、结果展示
</h1><p>运行login.jsp进入登录界面
</p><h2>4.1 以员工身份登录
</h2><p>1）输入staff_id  和 正确的密码，进入员工主页面；
</p><p>输入staff_id=104，密码123456，进入员工页面
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-c5e6720a-fa5b-49ac-9781-a534b5d63802.png" style="max-width:100%;"><br></p><p>
</p><p>2）在员工主页面，可以选择查看员工自己基本信息；
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-80d1f604-bed6-4d8e-b22e-64095d1e2ec5.png" style="max-width:100%;"><br></p><p>3）在员工主页面，修改员工自己的电话号码； 
</p><p>选择修改电话号码，填入590.423.4567
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-cffb9486-68aa-4ee5-b40d-127d596a2d38.png" style="max-width:100%;"><br></p><p>可以重新查询，电话号码改变
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-6d5704bf-d30d-4c58-b2b5-55333c78f58a.png" style="max-width:100%;"><br></p><p>
</p><h2>4.2 以部门经理身份登录
</h2><p>1）输入staff_id 和 正确的密码，进入部门经理主页面；
</p><p>输入staff_id=103，密码123456，进入经理页面
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-e3eef48b-93e7-489a-a5fb-5b2d5156d17c.png" style="max-width:100%;"><br></p><p>
</p><p>2）在部门经理主页面，可以查看本部门所有员工基本信息（选择按员工编号升序排列，或者按工资降序排列）；
</p><p>查看本部门所有员工基本信息：
</p><p>按员工编号升序排列：
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-15eecbd6-3dae-44ed-b429-35b42e18fbf2.png" style="max-width:100%;"><br></p><p>按工资降序排列：
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-48e55f8d-61fa-455e-ba92-0529a0a2392f.png" style="max-width:100%;"><br></p><p>
</p><p>3）在部门经理主页面，可以按员工编号查询员工基本信息；
</p><p>
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-ff09575e-36d0-484a-ba54-ca95c98e080a.png" style="max-width:100%;"><br></p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-759f5be5-b4fd-4270-a37a-5d68748231f2.png" style="max-width:100%;"><br></p><p>
</p><p>4）在部门经理主页面，可以按员工姓名查询员工基本信息；
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-9213a03a-dc8b-4ec2-88ed-d30543d0fdfe.png" style="max-width:100%;"><br></p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-01bf6e25-4b34-4c65-b2dd-fb559c42a2de.png" style="max-width:100%;"><br></p><p>
</p><p>5）在部门经理主页面，可以统计查询本部门员工最高工资，最低工资以及平均工资；
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-0fbbafd6-d00c-4bb2-b5a1-d4d92e40bb3a.png" style="max-width:100%;"><br></p><p>
</p><h2>4.3 以人事经理身份登录
</h2><p>1）输入特定编号hr001  和 特定密码，进入人事经理主页面；
</p><p>输入staff_id=hr001，密码hr001，进人事经理主页面
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-bf1a5560-227c-4fdf-9d4f-55f51e0b7caf.png" style="max-width:100%;"><br></p><p>
</p><p>2）在人事经理主页面，可以查看所有员工基本信息（选择按员工编号升序排列，或者按工资降序排列）；
</p><p>按员工编号升序排列:
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-7b00ba5a-88cf-4221-b19d-82d1f0c862a5.png" style="max-width:100%;"><br></p><p>
</p><p>按工资降序排列:
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-69f49eca-13fd-4ff9-9d77-b3186162e1cc.png" style="max-width:100%;"><br></p><p>
</p><p>3）在人事经理主页面，可以按员工编号查询员工基本信息；
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-5e780e4f-ea4c-41b3-a7f4-bd84ceeb5ac8.png" style="max-width:100%;"><br></p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-900e0350-f00c-47a0-a4fc-368e27d82780.png" style="max-width:100%;"><br></p><p>
</p><p>4）在人事经理主页面，可以按员工姓名查询员工基本信息；
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-676b3028-b551-477b-82ca-4916cde5da3b.png" style="max-width:100%;"><br></p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-3c36bada-7192-481e-9fac-0dde8fe09c6f.png" style="max-width:100%;"><br></p><p>
</p><p>5）在人事经理主页面，可以统计各部门员工最高工资，最低工资以及平均工资；
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-07dad7e5-6ad2-4930-96a1-59a1843179b1.png" style="max-width:100%;"><br></p><p>
</p><p>6）在人事经理主页面，可以查询各部门基本信息，并可以根据部门编号修改部门名称；
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-e15ae84c-7c11-4f36-9856-a58b0d6160bc.png" style="max-width:100%;"><br></p><p>修改名称：
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-095d279c-783d-4b8d-a4b2-84c31c0f2b7e.png" style="max-width:100%;"><br></p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-f252f59d-6359-4861-880d-02ea025f18c5.png" style="max-width:100%;"><br></p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-4e213b2c-2376-4a2c-b568-8bf508bd5960.png" style="max-width:100%;"><br></p><p>
</p><p>7）在人事经理主页面，可以各工作地点基本信息，并可以增加新的工作地点；
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-dde4f4b4-076a-4738-853a-2543e96d86f6.png" style="max-width:100%;"><br></p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-5b1e1bee-e9ab-4e7c-a4c8-adbe975729f8.png" style="max-width:100%;"><br></p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-f1c706c4-2736-4c64-ab82-c18093897570.png" style="max-width:100%;"><br></p><p>
</p><p>8）在人事经理主页面，可以按员工编号查询员工工作信息，包括其历史工作信息，返回员工编号，职位编号和部门编号； 
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-3093824a-2e7f-4f24-b0de-b1d1ff511939.png" style="max-width:100%;"><br></p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-37a1eb8e-09f7-41a3-a0d4-5ddb91cc40fa.png" style="max-width:100%;"><br></p><p>
</p><h1>五、可能遇到的问题
</h1><h2>5.1 Java开发工具不同：IntelliJ IDEA  V.S. Eclipse
</h2><p>笔者一开始使用过Eclipse，但是在后期转而使用IntelliJ IDEA，这是因为Eclipse有一些缺陷，比如报错不明显，这对于初学者而言很可能是致命的。IntelliJ IDEA的优势之一是能在右侧Database处直接连接openGauss数据库（需选择PostgreSQL数据库）。而需要注意IntelliJ IDEA只能免费试用一个月。
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-f00e7513-74cc-4169-a187-ae5a41ba09a8.png" style="max-width:100%;"><br></p><p>
</p><h2>5.2 连接openGauss数据库报错
</h2><p>第一步连接数据库时，Eclipse出现以下报错，但是它并没有指明究竟是哪里出错。一般出现如下错误，是因为连接openGauss数据库失败，原因可能为以下几点：
</p><p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-5e903874-c751-418d-8293-9015a851f05f.png" style="max-width:100%;"><br></p><p>（1）url使用错误
</p><p>这里121.36.79.196为弹性公网ip，26000为端口号，human_resource为数据库名称。如果url错误，则会导致数据库无法连接。
</p><p><i>url</i>="jdbc:postgresql://121.36.79.196:26000/human_resource";
</p><p>（2）数据库用户或者密码错误
</p><p>数据库用户或密码错误也会导致连接出错。所以必须牢记用户名及密码，否则容易使用错误。
</p><blockquote><pre><code><p>    private static String <i>user</i>="a";
</p><p>    private static String <i>password</i>="aaa";
</p></code></pre></blockquote><p><br></p><p>（3）java版本错误
</p><p>openGauss适用于java的版本为1.8，其他版本可能会报错。
</p><p>（4）调包出错
</p><p>
</p><p>连接数据库需要调用postgresql.jar包，建议提前配置jar包到项目中。 </p></div>
<script src="https://cdn.modb.pro/_nuxt/modb.2.210.2.js" defer></script><script src="https://cdn.modb.pro/_nuxt/modb.2.210.0.js" defer></script>
  </body>
</html>

