+++

title =  "MogDB/opengauss更改数据库目录位置建议测试环境" 

date = "2021-12-15" 

tags = [ "MogDB/opengauss更改数据库目录位置建议测试环境"] 

archives = "2021-12" 

author = "张凡" 

summary = "MogDB/opengauss更改数据库目录位置建议测试环境"

img = "/zh/post/2022/title/img6.png" 

times = "12:30"

+++

# MogDB/opengauss更改数据库目录位置\(建议测试环境\)<a name="ZH-CN_TOPIC_0000001232774725"></a>

有时我们部署完数据库，发现随着数据量的不断增加，数据目录所在的磁盘大小不能够满足我们的需求，需要更大的磁盘空间，这时选择重新部署数据库会很麻烦，之前所使用的数据库还需要重新导入，这里介绍将数据库目录更改到别的位置的方法，不建议生产环境使用，建议测试环境使用。

## 一、环境说明<a name="section693510499184"></a>

```
[root@node1 ~]# cat /etc/redhat-release
CentOS Linux release 7.6.1810 (Core)
```

## 二、查看数据目录位置<a name="section1195285912182"></a>

```
[omm@node1 ~]$ gsql -d postgres -p26000 -r
gsql ((MogDB 2.0.1 build f892ccb7) compiled at 2021-07-09 16:12:59 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

postgres=# show data_directory ;
 data_directory
-----------------
 /opt/mogdb/data
(1 row)
```

## 三、更改数据库位置<a name="section54899981912"></a>

```
postgres=# alter system set data_directory='/opt/data';		==>更改数据目录位置
NOTICE:  please restart the database for the POSTMASTER level parameter to take effect.
ALTER SYSTEM SET
postgres=# show data_directory ;			       ==>这个参数需要重启数据库生效
 data_directory
-----------------
 /opt/mogdb/data
(1 row)

postgres=#
```

## 四、停止数据库，拷贝数据目录<a name="section5675142071910"></a>

```
[omm@node1 ~]$ gs_ctl stop -D /opt/mogdb/data/	     ==>本机采取二进制方式部署，采用标准安装可的使用gs_om -t stop 停止
[2021-12-15 16:05:07.505][22522][][gs_ctl]: gs_ctl stopped ,datadir is /opt/mogdb/data
waiting for server to shut down........ done
server stopped
[omm@node1 mogdb]$ mkdir -p /opt/data			==>创建新的数据目录
[omm@node1 mogdb]$ cd /opt/data/
[omm@node1 data]$ cp -r /opt/mogdb/data/* /opt/data/    ==>将原来数据目录的数据拷贝到新的数据目录下
[omm@node1 data]$ chmod 0700 /opt/data		        ==>将新的数据目录赋予0700的权限，否则重启数据库会报错
```

## 五、启动数据库，查看数据目录位置<a name="section1072530161913"></a>

```
[omm@node1 data]$ gs_ctl start -D /opt/data
[2021-12-15 16:09:17.271][22740][][gs_ctl]: gs_ctl started,datadir is /opt/data
[2021-12-15 16:09:17.569][22740][][gs_ctl]: waiting for server to start...
.0 LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.
.......
.....
....
[2021-12-15 16:09:18.632][22740][][gs_ctl]:  done
[2021-12-15 16:09:18.632][22740][][gs_ctl]: server started (/opt/data)
[omm@node1 data]$ gsql -d postgres -p26000 -r
gsql ((MogDB 2.0.1 build f892ccb7) compiled at 2021-07-09 16:12:59 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

postgres=# show data_directory ;      ==>更改成功
 data_directory
----------------
 /opt/data
(1 row)
```

## 六、总结<a name="section77431842121916"></a>

以上是更改MogDB/opengauss数据库数据目录的方法，操作简单，不建议生产环境使用。

