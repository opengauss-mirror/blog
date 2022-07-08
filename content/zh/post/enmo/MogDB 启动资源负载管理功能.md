+++

title = "MogDB 启动资源负载管理功能" 

date = "2022-06-27" 

tags = ["MogDB 启动资源负载管理功能"] 

archives = "2022-06" 

author = "云和恩墨" 

summary = "MogDB 启动资源负载管理功能"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# MogDB 启动资源负载管理功能

本文出处：[https://www.modb.pro/db/423967](https://www.modb.pro/db/423967)

## 背景信息

使用资源负载管理功能前，需要参考本节完成参数配置。

## 前提条件

- 在MogDB中，如果需要对系统资源进行管理，用户需要拥有DBA权限。通过执行如下语法查询哪些用户拥有该权限：

  ```
  MogDB=# SELECT rolname FROM pg_roles WHERE rolsystemadmin = 't';
   rolname
  ---------
   omm
   Jack
  (2 rows)
  ```

- 如果想要将一个用户纳入资源负载管理的范围，则此用户必须具有login权限。通过执行如下语法查询哪些用户拥有该权限：

  ```
  MogDB=# SELECT rolname FROM pg_roles WHERE rolcanlogin = 't';
   rolname
  ---------
   omm
  (1 row)
  ```



## 操作步骤

DBA权限用户可以通过如下步骤启动基于资源池的资源负载管理。此处以omm用户为例进行描述。

1. 以操作系统用户omm登录MogDB主节点。

2. 开启Control Group功能。

   ```
   gs_guc reload -Z coordinator -Z datanode -N all -I all -c "enable_control_group=on"
   ```

3. 开启基于资源池的资源负载管理功能。

   ```
   gs_guc set -Z coordinator -Z datanode -N all -I all -c "use_workload_manager=on"
   ```

4. 开启对数据库的常驻后备线程的控制。

   ```
   gs_guc set -Z coordinator -Z datanode -N all -I all -c "enable_backend_control=on"
   ```

5. 开启对数据库的常驻后备线程中的autoVacuumWorker线程的控制。

   ```
   gs_guc set -Z coordinator -Z datanode -N all -I all -c "enable_vacuum_control=on"
   ```

6. 重启数据库使参数设置生效。

   ```
   gs_om -t stop && gs_om -t start
   ```
