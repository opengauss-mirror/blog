+++  
title = "gs_restore导入数据"  
date = "2022-08-30"  
tags = ["gs_restore导入数据"]  
archives = "2022-08"  
author = "wllove"  
img = "/zh/post/wllove/title/title.png"  
summary = "gs_restore导入数据"  
times = "15:30"  
+++  

gs_restore命令基本用法 
gs_restore具备如下两种功能。 

1.导入至数据库  

如果指定了数据库，则数据将被导入到指定的数据库中。其中，并行导入必须指定连接数据库的密码。导入时生成列会自动更新，并像普通列一样保存。

2.导入至脚本文件  

如果未指定导入数据库，则创建包含重建数据库所需的SQL语句脚本，并将其写入至文件或者标准输出。该脚本文件等效于gs_dump导出的纯文本格式文件。
gs_restore工具在导入时，允许用户选择需要导入的内容，并支持在数据导入前对等待导入的内容进行排序。

gs_restore示例

```
gs_restore -U jack /home/omm/backup/MPPDB_backup.tar -p 8000 -d backupdb -s -e -c
```

常用参数说明

-U 连接数据库的用户名。

-W 指定用户连接的密码。
如果主机的认证策略是trust，则不会对数据库管理员进行密码验证，即无需输入-W选项；
如果没有-W选项，并且不是数据库管理员，会提示用户输入密码。

-d 连接数据库dbname，并直接将数据导入到该数据库中。

-p 指定服务器所侦听的TCP端口或本地Unix域套接字后缀，以确保连接。

-e 当发送SQL语句到数据库时如果出现错误，则退出。默认状态下会忽略错误任务并继续执行导入，且在导入后会显示一系列错误信息。

-c 在重新创建数据库对象前，清理（删除）已存在于将要导入的数据库中的数据库对象。

-s 只导入模式定义，不导入数据。当前的序列值也不会被导入。

gs_restore常见用法

示例一：执行gs_restore，导入指定MPPDB_backup.dmp文件（自定义归档格式）中postgres数据库的数据和对象定义。

```
gs_restore backup/MPPDB_backup.dmp -p 8000 -d backupdb
Password:
gs_restore[2017-07-21 19:16:26]: restore operation successful
gs_restore: total time: 13053  ms
```

示例二：执行gs_restore，导入指定MPPDB_backup.tar文件（tar归档格式）中postgres数据库的数据和对象定义。

```
gs_restore backup/MPPDB_backup.tar -p 8000 -d backupdb 
gs_restore[2017-07-21 19:21:32]: restore operation successful
gs_restore[2017-07-21 19:21:32]: total time: 21203  ms
```

示例三：执行gs_restore，导入指定MPPDB_backup目录文件（目录归档格式）中postgres数据库的数据和对象定义。

```
gs_restore backup/MPPDB_backup -p 8000 -d backupdb
gs_restore[2017-07-21 19:26:46]: restore operation successful
gs_restore[2017-07-21 19:26:46]: total time: 21003  ms
```


示例四：执行gs_restore，将postgres数据库的所有对象的定义导入至backupdb数据库。导入前，数据库存在完整的定义和数据，导入后，backupdb数据库只存在所有对象定义，表没有数据。

```
gs_restore /home/omm/backup/MPPDB_backup.tar -p 8000 -d backupdb -s -e -c 
Password:
gs_restore[2017-07-21 19:46:27]: restore operation successful
gs_restore[2017-07-21 19:46:27]: total time: 32993  ms
```

示例五：执行gs_restore，导入MPPDB_backup.dmp文件中hr模式下表hr.staffs的定义。在导入之前，hr.staffs表不存在，需要确保存在hr的schema。

```
gs_restore backup/MPPDB_backup.dmp -p 8000 -d backupdb -e -c -s -n hr -t staffs
gs_restore[2017-07-21 19:56:29]: restore operation successful
gs_restore[2017-07-21 19:56:29]: total time: 21000  ms
```



