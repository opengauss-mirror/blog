+++
title = "使用gs_dumpall导出所有数据库"
date = "2022-09-01"
tags = ["OpenGauss3.0.0"]
archives = "2020-09"
author = "wllovever"
summary = "OpenGauss3.0.0"
img = ""
times = "15:10"
+++

1.gs_dumpall命令介绍：
penGauss支持使用gs_dumpall工具导出所有数据库的全量信息，包含openGauss中每个数据库信息和公共的全局对象信息。可根据需要自定义导出如下信息：
导出所有数据库全量信息，包含openGauss中每个数据库信息和公共的全局对象信息（包含角色和表空间信息）。
使用导出的全量信息可以创建与当前主机相同的一个主机环境，拥有相同数据库和公共全局对象，且库中数据也与当前各库相同。
仅导出数据，即导出每个数据库中的数据，且不包含所有对象定义和公共的全局对象信息。
仅导出所有对象定义，包括：表空间、库定义、函数定义、模式定义、表定义、索引定义和存储过程定义等。
使用导出的对象定义，可以快速创建与当前主机相同的一个主机环境，拥有相同的数据库和表空间，但是库中并无原数据库的数据。

2.gs_dumpall命令详解：
gs_dumpall  -U omm -f /home/omm/backup/MPPDB_backup.sql -p 8000 
参数说明：
-U
连接数据库的用户名，需要是openGauss管理员用户。
-W
指定用户连接的密码。
如果主机的认证策略是trust，则不会对数据库管理员进行密码验证，即无需输入-W选项；
如果没有-W选项，并且不是数据库管理员，会提示用户输入密码。
-f
将导出文件发送至指定目录文件夹。如果这里省略，则使用标准输出
-p
指定服务器所监听的TCP端口或本地Unix域套接字后缀，以确保连接。

3.具体示例
示例一：执行gs_dumpall，导出所有数据库全量信息（omm用户为管理员用户），导出文件为文本格式。执行命令后，会有很长的打印信息，最终出现total time即代表执行成功。示例中将不体现中间的打印信息。
gs_dumpall -U omm -f /home/omm/backup/MPPDB_backup.sql -p 8000 
Password:
gs_dumpall[port='8000'][2017-07-21 15:57:31]: dumpall operation successful
gs_dumpall[port='8000'][2017-07-21 15:57:31]: total time: 9627  ms

示例二：执行gs_dumpall，仅导出所有数据库定义（omm用户为管理员用户），导出文件为文本格式。执行命令后，会有很长的打印信息，最终出现total time即代表执行成功。示例中将不体现中间的打印信息。
gs_dumpall  -U omm -f /home/omm/backup/MPPDB_backup.sql -p 8000 -s 
Password:
gs_dumpall[port='8000'][2018-11-14 11:28:14]: dumpall operation successful
gs_dumpall[port='8000'][2018-11-14 11:28:14]: total time: 4147  ms

示例三：执行gs_dumpall，仅导出所有数据库中数据，并对导出文件进行加密，导出文件为文本格式。执行命令后，会有很长的打印信息，最终出现total time即代表执行成功。示例中将不体现中间的打印信息。
gs_dumpall -f /home/omm/backup/MPPDB_backup.sql -p 8000 -a --with-encryption AES128 --with-key abcdefg_?1234567
gs_dumpall[port='8000'][2018-11-14 11:32:26]: dumpall operation successful
gs_dumpall[port='8000'][2018-11-14 11:23:26]: total time: 4147  ms





