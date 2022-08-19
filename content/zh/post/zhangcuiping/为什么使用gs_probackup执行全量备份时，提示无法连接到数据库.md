+++

title = "为什么使用gs_probackup执行全量备份时，提示无法连接到数据库？" 

date = "2022-08-16" 

tags = ["为什么使用gs_probackup执行全量备份时，提示无法连接到数据库？"] 

archives = "2022-08" 

author = "张翠娉" 

summary = "为什么使用gs_probackup执行全量备份时，提示无法连接到数据库？"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "16:30"

+++

# 为什么使用gs_probackup执行全量备份时，提示无法连接到数据库？



**背景介绍**：

在使用gs_probackup执行全量备份时，提示无法连接到数据库。

**报错内容**：

```bash
[ommdoc@hostname]$ gs_probackup backup -B /opt/mogdb/backup_dir --instance cluster_doc -b FULL
INFO: Backup start, gs_probackup version: 2.4.2, instance: cluster_doc, backup ID: RGOU8R, backup mode: FULL, wal mode: STREAM, remote: false, compress-algorithm: none, compress-level: 1
LOG: Backup destination is initialized
ERROR: could not connect to database ommdoc: connect to server failed: No such file or directory

WARNING: Backup RGOU8R is running, setting its status to ERROR
```

**报错原因**：

1. 参数--instance意思是需要用户自定义一个实例名称。在执行ptk ls时发现系统中存在如下实例，因此错误的将--instance 指定为cluster_doc.

   ```bash
   [root@hostname]# ptk ls
     cluster_name |     instances      |  user   |      data_dir      | db_version   
   ---------------+--------------------+---------+--------------------+--------------
     mogdb1       | 172.16.0.127:27000 | ommdoc1 | /opt/mogdbpoc/data | MogDB-3.0.1  
     cluster_doc  | 172.16.0.127:28000 | ommdoc  | /opt/mogdb/data    | MogDB-3.0.0  
   ```

2. 未指定数据库连接信息。（如果数据库端口不是默认端口，需要设置数据库连接信息）

**解决办法**：

1. 指定一个数据库实例名。例如instance1.

   ```bash
   [ommdoc@hostname]$ gs_probackup backup -B /opt/mogdb/backup_dir --instance instance1 -b FULL
   ```

2. 设置数据库连接信息，例如数据库为postgres，数据库端口为28000

   ```bash
   [ommdoc@hostname]$ gs_probackup set-config --instance=instance1 -B /opt/mogdb/backup_dir -d postgres -p 28000
   ```