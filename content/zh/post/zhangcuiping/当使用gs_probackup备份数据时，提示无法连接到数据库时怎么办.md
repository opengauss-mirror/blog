+++

title = "当使用gs_probackup备份数据时，提示无法连接到数据库时怎么办?" 

date = "2022-04-18" 

tags = ["当使用gs_probackup备份数据时，提示无法连接到数据库时怎么办?"] 

archives = "2022-04" 

author = "张翠娉" 

summary = "当使用gs_probackup备份数据时，提示无法连接到数据库时怎么办?"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "10:20"
+++

# 当使用gs_probackup备份数据时，提示无法连接到数据库时怎么办?

本文出处：https://www.modb.pro/db/124909

gs_probackup是一个用于管理MogDB数据库备份和恢复的工具。它对MogDB实例进行定期备份，以便在数据库出现故障时能够恢复服务器。

- 可用于备份单机数据库或者集群主节点数据库，为物理备份。
- 可备份外部目录的内容，如脚本文件、配置文件、日志文件、dump文件等。
- 支持增量备份、定期备份和远程备份。
- 可设置备份的留存策略。

## 备份步骤

1、初始化备份目录。执行如下命令在指定的目录下创建backups/和wal/子目录，分别用于存放备份文件和WAL文件,例如指定目录为/opt/software/mogdb/backup_dir。

[root@mogdb-kernel-0005 backup_dir]#gs_probackup init -B /opt/software/mogdb/backup_dir
INFO: Backup catalog '/opt/software/mogdb/backup_dir' successfully inited

2、添加一个新的备份实例。gs_probackup可以在同一个备份目录下存放多个数据库实例的备份。例如数据目录为/cd opt/mogdb/data/db1。

```
[root@mogdb-kernel-0005 backup_dir]#gs_probackup add-instance -B /opt/software/mogdb/backup_dir -D /opt/mogdb/data/db1 --instance instance1
INFO: Instance 'instance1' successfully inited
```

3、创建指定实例的备份。在进行增量备份之前，必须至少创建一次全量备份。

```
[root@mogdb-kernel-0005 instance1]# gs_probackup backup -B /opt/software/mogdb/backup_dir --instance instance1 -b FULL
INFO: Backup start, gs_probackup version: 2.4.2, instance: instance1, backup ID: R08KCK, backup mode: FULL, wal mode: STREAM, remote: false, compress-algorithm: none, compress-level: 1
LOG: Backup destination is initialized
ERROR: could not connect to database root: connect to server failed: No such file or directory
```

**注意：当创建指定实例的备份时，系统上报如上错误，提示不能连接到数据库。这是因为没有在pg_probackup.conf配置文件中添加数据库连接信息。此时执行如下命令建立数据库连接后，必须切换到omm用户后再次执行备份，即可成功。如果直接在root用户下执行备份，仍然会报错提示无法连接到数据库。**

```
[root@mogdb-kernel-0005 instance1]#gs_probackup set-config -B /opt/software/mogdb/backup_dir --instance=instance1 -d postgres -p 26000
[root@mogdb-kernel-0005 instance1]#su - omm

[omm@mogdb-kernel-0005 instance1]#gs_probackup backup -B /opt/software/mogdb/backup_dir --instance instance1 -b FULL
INFO: Syncing backup files to disk
INFO: Backup files are synced, time elapsed: 5s
INFO: Validating backup R08LWJ
INFO: Backup R08LWJ data files are valid
INFO: Backup R08LWJ resident size: 686MB
INFO: Backup R08LWJ completed
```

4、从指定实例的备份中恢复数据。

```
gs_probackup restore -B /opt/software/mogdb/backup_dir --instance instance1 -D /opt/mogdb/data/db1 -i R08LWJ
INFO: Backup files are restored. Transfered bytes: 686MB, time elapsed: 1s
INFO: Restore incremental ratio (less is better): 102% (686MB/670MB)
INFO: Syncing restored files to disk
INFO: Restored backup files are synced, time elapsed: 5s
INFO: Restore of backup R08LWJ completed.
```
