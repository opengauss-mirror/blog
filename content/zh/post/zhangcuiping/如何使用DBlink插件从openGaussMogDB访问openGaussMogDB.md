+++

title = "如何使用DBlink插件从openGauss/MogDB访问openGauss/MogDB" 

date = "2023-07-18" 

tags = ["openGauss/MogDB"] 

archives = "2023-07" 

author = "张翠娉" 

summary = "如何使用DBlink插件从openGauss/MogDB访问openGauss/MogDB"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "10:20"
+++

# 如何使用DBlink插件从openGauss/MogDB访问openGauss/MogDB?

## 简介

DBlink插件用于在远程数据库中执行查询操作。

## 安装dblink

1. 停止数据库集群mogdb5。

   ```
   ptk cluster -n mogdb5 stop
   ```

2. 在omm5数据库安装用户下创建contrib目录，在此目录下下载dblink安装包并解压生成dblink目录。

   ```
   Wget -c https://cdn-mogdb.enmotech.com/mogdb-media/5.0.0/CentOS_x86_64/plugins/dblink-1.0-5.0.0-01-CentOS-x86_64.tar.gz
   ```

3. 进入contrib/dblink目录，执行如下命令安装dblink。

   ```
   Make install
   ```

4. 安装成功后，切换到root用户，执行如下命令启动数据库。

   ```
   ptk cluster -n mogdb5 start
   ```

## 使用dblink

1. 登录MogDB 3.0.0数据库，创建表、插入数据并查看表。

   ```
   gsql -d postgres -p 26000 -r
   
   create table t_dblink(a int, b int);
   
   insert into t_dblink values(1,2);
   
   Select * from t_dblink;
   ```

2. 登录MogDB5.0.0数据库创建dblink扩展。

   ```sql
   gsql -d postgres -p 27000 -r
   
   Create extension dblink;
   ```

3. 创建连接。

   ```sql
   select dblink_connect('dblink_conn','hostaddr=127.0.0.1 port=26000 dbname=postgres user=omm3 password=Enmo@123');
   ```

4. 连接远端数据库执行查询操作。

   ```sql
   select * from dblink('dbname=postgres host=127.0.0.1 port=26000 user=omm3 password=Enmo@123'::text, 'select * from t_dblink'::text)t(a int, b int);
   ```