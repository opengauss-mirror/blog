+++

title = "怎么安装MySQL数据库" 

date = "2023-08-08" 

tags = ["怎么安装MySQL数据库"] 

archives = "2023-08" 

author = "张翠娉" 

summary = "怎么安装MySQL数据库"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "14:20"

+++

# 怎么安装MySQL数据库？

1. 访问[MySQL官网](https://downloads.mysql.com/archives/community/)下载MySQL安装包，例如mysql-8.0.33-linux-glibc2.28-x86_64.tar.gz。

2. 解压MySQL软件包到指定目录，例如/opt获得压缩包目录mysql-8.0.33-linux-glibc2.28-x86_64，将其改为mysql

   ```
   cd /opt
   tar -xvf mysql-8.0.33-linux-glibc2.28-x86_64.tar.gz
   mv mysql-8.0.33-linux-glibc2.28-x86_64 mysql
   ```

3. 在/opt/mysql/目录下，创建data目录。并赋予data目录权限。

   ```
   mkdir data
   chown -R mysql data
   ```

4. 在/opt/mysql/目录下，新建/etc/my.cnf文件，添加如下内容：

   ```
   [mysqld]
   bind_address= 0.0.0.0
   user=mysql
   datadir=/opt/mysql/data
   basedir=/opt/mysql
   ```

5. 在/opt/mysql目录下，执行如下命令初始化数据库

   ```
   bin/mysqld  --initialize  --user=mysql
   ```

   安装成功后，会生成一个临时密码，记录下该密码，登录数据库时会用到。

6. 启动数据库，并根据提示输入步骤5生成的临时密码。

   ```
   bin/mysql -p
   ```

7. 登录数据库后，修改临时密码。

   ```
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'Enmo@123'
   ```

**注意**：执行mysqld可以查看具体报错原因。