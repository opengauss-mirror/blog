+++

title = "基于华为云鲲鹏弹性云服务器部署openGauss数据库-实验"

date = "2021-07-10"

tags = ["基于华为云鲲鹏弹性云服务器部署openGauss数据库-实验"] 

archives = "2021-07" 

author = "许玉冲" 

summary = "基于华为云鲲鹏弹性云服务器部署openGauss数据库-实验"

img = "/zh/post/zhengwen2/img/img38.jpg" 

times = "12:30"

+++

# 基于华为云鲲鹏弹性云服务器部署openGauss数据库-实验<a name="ZH-CN_TOPIC_0000001085018737"></a>

## 实验目标与基本要求

指导用户基于华为云鲲鹏云服务器，部署openGauss单机数据库。通过本实验，您能够：

 1. 使用openGauss的om工具成功安装openGauss单机数据库。
 2. 登录到openGauss数据库进行简单的增删改查操作。

## 实验步骤：
### 1. 购买鲲鹏云主机
购买弹性云服务器ECS选型时候，CPU架构需要选择鲲鹏计算。
操作系统选择：openEuler – openEuler 20.03 64bit with ARM(40GB)
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210706164107342.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
### 2. 登录云主机，下载openGauss镜像并解压。
```powershell
[root@ecs-opengauss ~]# cd /opt
[root@ecs-opengauss opt]# mkdir /opt/gauss
[root@ecs-opengauss opt]# cd /opt/gauss
[root@ecs-opengauss opt]#wget https://sandbox-experiment-resource-north-4.obs.cn-north-4.myhuaweicloud.com/opengauss-install/openGauss-1.1.0-openEuler-64bit-all.tar.gz
```
解压完整镜像，解压完整镜像：
```powershell
tar -zxvf openGauss-1.1.0-openEuler-64bit-all.tar.gz
tar -zxvf openGauss-1.1.0-openEuler-64bit-om.tar.gz
```
### 3. 创建集群的xml配置文件
```powershell
cd /opt/gauss
vi clusterconfig.xml
```
修改地点标红
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210706164202312.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
![在这里插入图片描述](https://img-blog.csdnimg.cn/2021070616422744.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
###  4. 安装数据库
```powershell
chmod -R 755 /opt/gauss
chmod -R 755 /opt/gauss/script
```
***
**说明**
对于openEuler系统，需要修改系统的performance.sh文件中min_free_kbytes的配置。
```powershell
vi /etc/profile.d/performance.sh
```
注释掉15行：
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210706164306554.png#pic_center)
***
1. 重新设置min_free_kbytes：
```powershell
/sbin/sysctl -w vm.min_free_kbytes=767846
```
2. 安装依赖包：
```powershell
yum install libaio libaio-devel -y
```
3. 预安装gs_preinstall
```powershell
cd /opt/gauss/script
./gs_preinstall -U omm -G dbgrp -X /opt/gauss/clusterconfig.xml
```
成功如下图所示：
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210706164344281.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
### 5. 安装gs_install
```powershell
su - omm
gs_install -X /opt/gauss/clusterconfig.xml
```
成功如下图所示：
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210706164422906.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
### 6. 安装完成
1. 检查数据库状态
```powershell
gs_om -t status --detail
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210706164500718.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
2. 使用gsql命令登录主机数据库
```powershell
gsql -d postgres -p 15400 -r
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210706164535169.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
3. 创建数据库和表，增删改查测试：

```sql
postgres=# create database mydb;
CREATE DATABASE
postgres=# c mydb
Non-SSL connection (SSL connection is recommended when requiring high-security)You are now connected to database "mydb" as user "omm".
mydb=# create table stu(id int, name varchar, age int);
CREATE TABLE
mydb=# d                        
List of relations Schema | Name | Type  | Owner |             Storage              
--------+------+-------+-------+---------------------------------- 
public | stu  | table | omm   | {orientation=row,compression=no}
(1 row)
mydb=# d stu           
Table "public.stu" 
Column |       Type        | Modifiers 
--------+-------------------+----------- id     | integer           |  
name   | character varying |  
age    | integer           | 
mydb=# insert into stu values(1,'xiaoming', 18);

INSERT 0 1mydb=# insert into stu values(2,'lihua', 24);
INSERT 0 1
mydb=# select * from stu; 
id |   name   | age
 ----+----------+-----  
1 | xiaoming |  18  
2 | lihua    |  24
(2 rows)
mydb=# update stu set age=20 where name='lihua';
UPDATE 1
mydb=# delete from stu where id=1;
DELETE 1
mydb=# 
```
