+++
title = "使用gs_dump导出数据库"
date = "2022-08-26"
tags = ["OpenGauss3.0.0"]
archives = "2020-08"
author = "wllovever"
summary = "OpenGauss3.0.0"
img = ""
times = "18:10"
+++

openGauss支持使用gs_dump工具导出某个数据库级的内容，包含数据库的数据和所有对象定义。可根据需要自定义导出如下信息：

导出数据库全量信息，包含数据和所有对象定义。

使用导出的全量信息可以创建一个与当前库相同的数据库，且库中数据也与当前库相同。

仅导出所有对象定义，包括：库定义、函数定义、模式定义、表定义、索引定义和存储过程定义等。

使用导出的对象定义，可以快速创建一个相同的数据库，但是库中并无原数据库的数据。

仅导出数据，不包含所有对象定义。

操作步骤
以操作系统用户omm登录数据库主节点。
使用gs_dump导出userdatabase数据库。
gs_dump -U jack -f /home/omm/backup/userdatabase_backup.tar -p 8000 postgres -F t 
Password:

常有参数说明：
-U  连接数据库的用户名。 不指定连接数据库的用户名时，默认以安装时创建的初始系统管理员连接。
-W 指定用户连接的密码。 如果主机的认证策略是trust，则不会对数据库管理员进行密码验证，即无需输入-W选项；如果没有-W选项，并且不是数据库管理员，会提示用户输入密码。
-f 将导出文件发送至指定目录文件夹。如果这里省略，则使用标准输出。
-p 指定服务器所侦听的TCP端口或本地Unix域套接字后缀，以确保连接。
dbname 需要导出的数据库名称。
-F 选择导出文件格式。-F参数值如下：
p：纯文本格式
c：自定义归档
d：目录归档格式
t：tar归档格式

示例一：执行gs_dump，导出postgres数据库全量信息，导出文件格式为sql文本格式。

复制代码gs_dump -f /home/omm/backup/postgres_backup.sql -p 8000 postgres -F p
Password:
gs_dump[port='8000'][postgres][2017-07-21 15:36:13]: dump database postgres successfully
gs_dump[port='8000'][postgres][2017-07-21 15:36:13]: total time: 3793  ms
示例二：执行gs_dump，仅导出postgres数据库中的数据，不包含数据库对象定义，导出文件格式为自定义归档格式。

复制代码gs_dump -f /home/omm/backup/postgres_data_backup.dmp -p 8000 postgres -a -F c
Password:
gs_dump[port='8000'][postgres][2017-07-21 15:36:13]: dump database postgres successfully
gs_dump[port='8000'][postgres][2017-07-21 15:36:13]: total time: 3793  ms
示例三：执行gs_dump，仅导出postgres数据库所有对象的定义，导出文件格式为sql文本格式。

复制代码gs_dump -f /home/omm/backup/postgres_def_backup.sql -p 8000 postgres -s -F p
Password:
gs_dump[port='8000'][postgres][2017-07-20 15:04:14]: dump database postgres successfully
gs_dump[port='8000'][postgres][2017-07-20 15:04:14]: total time: 472 ms
示例四：执行gs_dump，仅导出postgres数据库的所有对象的定义，导出文件格式为文本格式，并对导出文件进行加密。

复制代码gs_dump -f /home/omm/backup/postgres_def_backup.sql -p 8000 postgres --with-encryption AES128 --with-key 1234567812345678 -s -F p
Password:
gs_dump[port='8000'][postgres][2018-11-14 11:25:18]: dump database postgres successfully
gs_dump[port='8000'][postgres][2018-11-14 11:25:18]: total time: 1161  ms