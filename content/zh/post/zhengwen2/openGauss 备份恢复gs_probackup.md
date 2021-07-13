+++

title = "openGauss 备份恢复gs_probackup" 

date = "2021-07-09" 

tags = ["openGauss 备份恢复gs_probackup"] 

archives = "2021-07" 

author = "Anacesthesia" 

summary = "openGauss 备份恢复gs_probackup"

img = "/zh/post/zhengwen2/img/img21.jpg" 

times = "12:30"

+++

# openGauss 备份恢复gs_probackup<a name="ZH-CN_TOPIC_0000001085018737"></a>

# openGauss 备份恢复之gs_probackup

机器数量：2 台
硬件环境：x86 虚拟机的内存4GB
软件环境：CentOS7.6 x64
数据库版本：opengauss2.0.0,数据库软件是通过编译安装
节点：node1 192.168.126.129
节点：node2 192.168.126.130
## 1.1.	背景信息
gs_probackup是一个用于管理openGauss数据库备份和恢复的工具。它对openGauss实例进行定期备份，以便在数据库出现故障时能够恢复服务器。
- 可用于备份单机数据库或者集群主节点数据库，为物理备份。
- 可备份外部目录的内容，如脚本文件、配置文件、日志文件、dump文件等。
- 支持增量备份、定期备份和远程备份。
- 可设置备份的留存策略。
## 1.2.	前提条件
- 备份必须由运行数据库服务器的用户执行。
- 备份和恢复的数据库服务器的主版本号必须相同。
- 如果要通过ssh在远程模式下备份数据库，需要在本地和远程主机安装相同主版本的数据库，并通过ssh-copy-id remote_user@remote_host命令设置本地主机备份用户和远程主机数据库用户的无密码ssh连接。
- 远程模式下只能执行add-instance、backup、restore子命令。
- 使用restore子命令前，应先停止gaussdb进程。
## 1.4.	gs_probackup本地备份恢复测试
### 1.4.1.打开参数enable_cbm_tracking,跟踪数据页的变化
在node2主执行：
```sql
postgres=# show enable_cbm_tracking;
 enable_cbm_tracking 
---------------------
 off
(1 row)
postgres=# alter system set enable_cbm_tracking=on;
ALTER SYSTEM SET
postgres=#
```
### 1.4.2.本地初始化备份目录
node2执行
```powershell
mkdir -p /opt/ogdata01
chown -R omm: /opt/ogdata01
chmod -R 700 /opt/ogdata01

cd /opt
mkdir opgaussbak
chown -R omm:dbgrp opgaussbak/
[omm@node2 ~]$ gs_probackup init  -B /opt/opgaussbak
INFO: Backup catalog '/opt/opgaussbak' successfully inited
[omm@node2 ~]$ 
[omm@node2 opgaussbak]$ ls
backups  wal
```
对目录的初始化操作实际是在备份目录下创建backups/和wal/子目录，分别用于存放备份文件和WAL文件。
打开数据库归档模式：修改postgres.conf

```xml
wal_level = hot_standby
archive_mode = on
archive_dest = '/opt/archive6543'
logging_collector = on   										
log_directory = 'pg_log'		
log_filename = 'postgresql.log'	#
log_file_mode = 0600
```
### 1.4.3.添加本地备份实例
Node2执行：
```powershell
su - omm
[omm@node2 ~]$ gs_probackup   add-instance -B /opt/opgaussbak -D /opt/ogdata --instance node2bak
INFO: Instance 'node2bak' successfully inited
```
查看备份集
```powershell
[omm@node2 ~]$ gs_probackup show -B /opt/opgaussbak/
```
### 1.4.4.本地执行一次全量备份
```powershell
[omm@node2 ~]$ gs_probackup backup -B /opt/opgaussbak/ --instance node2bak -b full -D /opt/ogdata  -d postgres -p 6543 --progress  --log-filename=full_postgres_log --retention-redundancy=2 --compress --note='This is full backup set.'

INFO: Progress: (2044/2044). Validate file "database_map"
INFO: Backup QSDACN data files are valid
INFO: Backup QSDACN resident size: 702MB
INFO: Backup QSDACN completed
[omm@node2 ~]$
```
### 1.4.5.查看本地全备备份集
```powershell
gs_probackup show  -B /opt/opgaussbak/
```
![](https://img-blog.csdnimg.cn/img_convert/cc70e6a0416aaa64af04d7cd97066d2f.png)

#### 1.4.6.第一次执行增量备份
增量之前创建测试数据
创建测试数据在postgres中

```powershell
postgres=# create table t4(id number);
CREATE TABLE
postgres=# select * from t4;
 id 
----
(0 rows)
postgres=# insert into t4 values('4');
INSERT 0 1
postgres=# 
postgres=# select * from t4;
 id 
----
  4
(1 row)
```

本地node2执行：

```powershell
gs_probackup backup -B /opt/opgaussbak/ --instance node2bak -b PTRACK -D /opt/ogdata -d postgres -p 6543  --progress    --log-filename=incr1.log --delete-expired --delete-wal --retention-redundancy=2 --compress  --note='This is the first incremental backup set.'
INFO: Backup QSDAT3 data files are valid
INFO: Backup QSDAT3 resident size: 290MB
INFO: Backup QSDAT3 completed
LOG: REDUNDANCY=2
INFO: Evaluate backups by retention
INFO: Backup QSDAT3, mode: PTRACK, status: OK. Redundancy: 1/2, Time Window: 0d/0d. Active
INFO: Backup QSDACN, mode: FULL, status: OK. Redundancy: 1/2, Time Window: 0d/0d. Active
INFO: Backup QSDA67, mode: FULL, status: ERROR. Redundancy: 2/2, Time Window: 0d/0d. Expired
INFO: Backup QSD7SD, mode: FULL, status: ERROR. Redundancy: 3/2, Time Window: 0d/0d. Expired
INFO: Backup QSD7K2, mode: FULL, status: ERROR. Redundancy: 4/2, Time Window: 0d/0d. Expired
INFO: Backup QSD7DS, mode: FULL, status: ERROR. Redundancy: 5/2, Time Window: 0d/0d. Expired
LOG: Consider backup QSDA67 for purge
WARNING: Process 21875 which used backup QSDA67 no longer exists
INFO: Delete: QSDA67 1970-01-01 08:00:00+08
INFO: Progress: (1/4). Delete file "/opt/opgaussbak/backups/node2bak/QSDA67/database"
INFO: Progress: (2/4). Delete file "/opt/opgaussbak/backups/node2bak/QSDA67/backup.pid"
INFO: Progress: (3/4). Delete file "/opt/opgaussbak/backups/node2bak/QSDA67/backup.control"
INFO: Progress: (4/4). Delete file "/opt/opgaussbak/backups/node2bak/QSDA67"
LOG: Consider backup QSD7SD for purge
WARNING: Process 20898 which used backup QSD7SD no longer exists
INFO: Delete: QSD7SD 1970-01-01 08:00:00+08
INFO: Progress: (1/4). Delete file "/opt/opgaussbak/backups/node2bak/QSD7SD/database"
INFO: Progress: (2/4). Delete file "/opt/opgaussbak/backups/node2bak/QSD7SD/backup.pid"
INFO: Progress: (3/4). Delete file "/opt/opgaussbak/backups/node2bak/QSD7SD/backup.control"
INFO: Progress: (4/4). Delete file "/opt/opgaussbak/backups/node2bak/QSD7SD"
LOG: Consider backup QSD7K2 for purge
WARNING: Process 20728 which used backup QSD7K2 no longer exists
INFO: Delete: QSD7K2 1970-01-01 08:00:00+08
INFO: Progress: (1/4). Delete file "/opt/opgaussbak/backups/node2bak/QSD7K2/database"
INFO: Progress: (2/4). Delete file "/opt/opgaussbak/backups/node2bak/QSD7K2/backup.pid"
INFO: Progress: (3/4). Delete file "/opt/opgaussbak/backups/node2bak/QSD7K2/backup.control"
INFO: Progress: (4/4). Delete file "/opt/opgaussbak/backups/node2bak/QSD7K2"
LOG: Consider backup QSD7DS for purge
WARNING: Process 20645 which used backup QSD7DS no longer exists
INFO: Delete: QSD7DS 1970-01-01 08:00:00+08
INFO: Progress: (1/4). Delete file "/opt/opgaussbak/backups/node2bak/QSD7DS/database"
INFO: Progress: (2/4). Delete file "/opt/opgaussbak/backups/node2bak/QSD7DS/backup.pid"
INFO: Progress: (3/4). Delete file "/opt/opgaussbak/backups/node2bak/QSD7DS/backup.control"
INFO: Progress: (4/4). Delete file "/opt/opgaussbak/backups/node2bak/QSD7DS"
INFO: There are no backups to merge by retention policy
INFO: Purging finished
INFO: There is no WAL to purge by retention policy
```

### 1.4.7.查看本地增量备份集

```powershell
gs_probackup show -B /opt/opgaussbak/
```
![](https://img-blog.csdnimg.cn/img_convert/4cc1d23c1abf758be22be83ed608a8a6.png)


### 1.4.8.第二次执行增量备份
创建测试表t5
```powershell
postgres=# create table t5(id number);
insert into t5 values('5');
select * from t5;
CREATE TABLE
postgres=# INSERT 0 1
postgres=#  id 
----
  5
(1 row)

postgres=# 
postgres=# 
postgres=# select * from t5;
 id 
----
  5
(1 row)

[omm@node2 opgaussbak]$gs_probackup backup -B /opt/opgaussbak/ --instance node2bak -b PTRACK -D /opt/ogdata -d postgres -p 6543  --progress    --log-filename=incr1.log --delete-expired --delete-wal --retention-redundancy=2 --compress  --note='This is the first incremental backup set.'
.....................
INFO: Backup QSER8W data files are valid
INFO: Backup QSER8W resident size: 305MB
INFO: Backup QSER8W completed
LOG: REDUNDANCY=2
INFO: Evaluate backups by retention
INFO: Backup QSER8W, mode: PTRACK, status: OK. Redundancy: 1/2, Time Window: 0d/0d. Active
INFO: Backup QSDAT3, mode: PTRACK, status: OK. Redundancy: 1/2, Time Window: 0d/0d. Active
INFO: Backup QSDACN, mode: FULL, status: OK. Redundancy: 1/2, Time Window: 0d/0d. Active
INFO: There are no backups to merge by retention policy
INFO: There are no backups to delete by retention policy
INFO: There is no WAL to purge by retention policy
```
### 1.4.9.查看本地第二次增量备份集
![](https://img-blog.csdnimg.cn/img_convert/176a09e6e3051a07567376f7c74fbddb.png)

#### 1.4.10.删除数据库并进行全量恢复

```powershell
gs_ctl stop 
rm -rf /opt/ogdata
```
![](https://img-blog.csdnimg.cn/img_convert/4e641ee29e3a34946891a8f9371b89f9.png)

```powershell
[omm@node2 ~]$ gs_probackup restore  -B /opt/opgaussbak/ -D /opt/ogdata -i QSDACN --instance node2bak
LOG: Restore begin.
LOG: there is no file tablespace_map
LOG: check tablespace directories of backup QSDACN
LOG: check external directories of backup QSDACN
WARNING: Process 22144 which used backup QSDACN no longer exists
INFO: Validating backup QSDACN
INFO: Backup QSDACN data files are valid
LOG: Thread [1]: Opening WAL segment "/opt/opgaussbak/backups/node2bak/QSDACN/database/pg_xlog/00000001000000000000009C"
INFO: Backup QSDACN WAL segments are valid
INFO: Backup QSDACN is valid.
INFO: Restoring the database from backup at 2021-04-30 16:02:47+08
LOG: there is no file tablespace_map
LOG: Restore directories and symlinks...
INFO: Start restoring backup files. PGDATA size: 1296MB
LOG: Start thread 1
INFO: Backup files are restored. Transfered bytes: 1312MB, time elapsed: 21s
INFO: Restore incremental ratio (less is better): 101% (1312MB/1296MB)
INFO: Syncing restored files to disk
INFO: Restored backup files are synced, time elapsed: 0
INFO: Restore of backup QSDACN completed.
```
启动数据库查看数据库：
```powershell
gs_ctl start
gssql postgres –p 6543
```
![](https://img-blog.csdnimg.cn/img_convert/e8f4971bf2d6705a5c61d58102bec40c.png)
可以看到全量的恢复并没有包含我们第一次增量和第二次增量的数据。我们进行第一次增量恢复。

### 1.4.11.执行全量+第一次增量恢复测试并验证数据。
查看需要恢复数据的增量点：我们恢复数据库到ID为QSDAT3。这个点有我们新创建的表T4.
![](https://img-blog.csdnimg.cn/img_convert/d583637749e9e2c6c8ae76b0f9861294.png)
执行恢复：
```powershell
gs_probackup restore  -B /opt/opgaussbak/ -D /opt/ogdata01 -i QSDAT3 --instance node2bak
gs_ctl start -D /opt/ogdata01/
gsql postgres -p 6543
```
我们可以查到这个备份集的表T4。
![](https://img-blog.csdnimg.cn/img_convert/40cabc54bb039bddbda839e853468f36.png)


### 1.4.12.执行全量+第二次增量恢复测试并验证数据。
查看需要恢复数据的增量点：我们恢复数据库到ID为QSDAT3。这个点有我们新创建的表T5.
![](https://img-blog.csdnimg.cn/img_convert/5c5d0da9ba07ff1ac7f35ec9f3b6bd85.png)
```powershell
gs_probackup restore  -B /opt/opgaussbak/ -D /opt/ogdata -i QSERBG --instance node2bak  
gs_ctl start -D /opt/ogdata01
gsql postgres -p 6543
```
![](https://img-blog.csdnimg.cn/img_convert/d448648d2a1ce38dc84db1aae8f49b79.png)
### 1.4.13.gs_probackup配置文件解析
pg_probackup.conf文件，设置备份配置策略前的配置：

```powershell
[root@node2 node2bak]# pwd
/opt/opgaussbak/backups/node2bak
[root@node2 node2bak]# cat pg_probackup.conf 
# Backup instance information
pgdata = /opt/ogdata
system-identifier = 3422924873445789
```
设置后
```powershell
gs_probackup set-config  -B /opt/opgaussbak/  --instance node2bak --retention-redundancy=2  --compress-algorithm=zlib --compress-level=6
cd /opt/opgaussbak/backups/node2bak
[root@node2 node2bak]# cat pg_probackup.conf 
# Backup instance information
pgdata = /opt/ogdata
system-identifier = 3422924873445789
# Retention parameters
retention-redundancy = 2
# Compression parameters
compress-algorithm = zlib
compress-level = 6
```
备份集目录下的backup.control文件(描述备份集的属性信息)
```powershell
[omm@node2 QSEVBS]$ cat backup.control
#Configuration
backup-mode = FULL
stream = true
compress-alg = zlib
compress-level = 1
from-replica = false

#Compatibility
block-size = 8192
xlog-block-size = 8192
checksum-version = 0
program-version = 2.4.2
server-version = 9.2

#Result backup info
timelineid = 1
start-lsn = 0/A8000028
stop-lsn = 0/A80002F8
start-time = '2021-05-01 12:33:28+08'
merge-time = '2021-05-01 12:36:05+08'
end-time = '2021-05-01 12:36:33+08'
recovery-xid = 14835
recovery-time = '2021-05-01 12:33:29+08'
recovery-name = 'backup QSEV3L'
data-bytes = 1152575411
wal-bytes = 16777216
uncompressed-bytes = 2429062395
pgdata-bytes = 1342753913
status = OK
note = 'This is the first incremental backup set.'
```
修改备份信息后

```powershell
gs_probackup set-backup -B /opt/opgaussbak/ --instance  node2bak -i QSEVBS --note 'backup.control setting' --ttl 20d
INFO: Backup QSEVBS is pinned until '2021-05-21 12:33:29+08'
INFO: Adding note to backup QSEVBS: 'backup.control setting'

[root@node2 QSEVBS]# cat backup.control 
#Configuration
backup-mode = FULL
stream = true
compress-alg = zlib
compress-level = 1
from-replica = false

#Compatibility
block-size = 8192
xlog-block-size = 8192
checksum-version = 0
program-version = 2.4.2
server-version = 9.2

#Result backup info
timelineid = 1
start-lsn = 0/A8000028
stop-lsn = 0/A80002F8
start-time = '2021-05-01 12:33:28+08'
merge-time = '2021-05-01 12:36:05+08'
end-time = '2021-05-01 12:36:33+08'
recovery-xid = 14835
recovery-time = '2021-05-01 12:33:29+08'
expire-time = '2021-05-21 12:33:29+08'
recovery-name = 'backup QSEV3L'
data-bytes = 1152575411
wal-bytes = 16777216
uncompressed-bytes = 2429062395
pgdata-bytes = 1342753913
status = OK
note = 'backup.control setting'
content-crc = 1707874668
```
### 1.4.14.其他常用命令
#### 1.4.14.1.	查看备份集详细信息。

```powershell
[omm@node2 ~]$ gs_probackup show -B /opt/opgaussbak/ --instance  node2bak -i  QSERBG 
#Configuration
backup-mode = PTRACK
stream = true
compress-alg = zlib
compress-level = 1
from-replica = false
#Compatibility
block-size = 8192
xlog-block-size = 8192
checksum-version = 0
program-version = 2.4.2
server-version = 9.2
#Result backup info
timelineid = 1
start-lsn = 0/A2000028
stop-lsn = 0/A20002F8
start-time = '2021-05-01 11:06:52+08'
end-time = '2021-05-01 11:07:03+08'
recovery-xid = 14544
recovery-time = '2021-05-01 11:06:53+08'
recovery-name = 'backup QSERBG'
data-bytes = 285557584
wal-bytes = 16777216
uncompressed-bytes = 268780252
pgdata-bytes = 1342696865
status = OK
parent-backup-id = 'QSER8W'
note = 'This is the second incremental backup set.'
content-crc = 2279034550
[omm@node2 ~]$
```

#### 1.4.14.2.	删除备份实例

```powershell
[omm@node2 ~]$ gs_probackup del-instance  -B /opt/opgaussbak/ --instance node2bak
WARNING: Process 24149 which used backup QSDACN no longer exists
WARNING: Process 24149 which used backup QSDAT3 no longer exists
WARNING: Process 24149 which used backup QSER8W no longer exists
WARNING: Process 24149 which used backup QSERBG no longer exists
INFO: Delete: QSERBG 2021-05-01 11:06:53+08
INFO: Delete: QSER8W 2021-05-01 11:05:22+08
INFO: Delete: QSDAT3 2021-04-30 16:12:47+08
INFO: Delete: QSDACN 2021-04-30 16:04:26+08
INFO: Instance 'node2bak' successfully deleted
[omm@node2 ~]$
```

#### 1.4.14.3.	合并备份集
查看当被备份集： 
![](https://img-blog.csdnimg.cn/img_convert/3c25bb844474169b46e8035dc1786f22.png)
```powershell
[omm@node2 ~]$ gs_probackup merge -B /opt/opgaussbak/ -i QSEVBS --instance node2bak
INFO: Merge started
WARNING: Process 24783 which used backup QSEV3L no longer exists
WARNING: Process 24839 which used backup QSEV8K no longer exists
WARNING: Process 24869 which used backup QSEVBS no longer exists
INFO: Merging backup QSEVBS with parent chain
INFO: Validate parent chain for backup QSEVBS
INFO: Validating backup QSEV3L
INFO: Backup QSEV3L data files are valid
INFO: Validating backup QSEV8K
INFO: Backup QSEV8K data files are valid
INFO: Validating backup QSEVBS
INFO: Backup QSEVBS data files are valid
LOG: Restore directories and symlinks...
INFO: Start merging backup files
LOG: Creating page header map "/opt/opgaussbak/backups/node2bak/QSEV3L/page_header_map_tmp"
INFO: Backup files are successfully merged, time elapsed: 27s
INFO: Delete: QSEV8K 2021-05-01 12:31:33+08
INFO: Delete: QSEVBS 2021-05-01 12:33:29+08
LOG: Rename /opt/opgaussbak/backups/node2bak/QSEV3L to /opt/opgaussbak/backups/node2bak/QSEVBS
INFO: Rename merged full backup QSEV3L to QSEVBS
INFO: Validating backup QSEVBS
INFO: Backup QSEVBS data files are valid
INFO: Merge of backup QSEVBS completed
```
查看合并后的备份集：
```powershell
gs_probackup show -B /opt/opgaussbak/
```
![](https://img-blog.csdnimg.cn/img_convert/abbc38843cdb30fa2a5b597f2db03272.png)
大致流程：
1. 校验备份集
2. 合并备份集
3. 删除备份集
4. 重命名QSEV3L为QSEVBS  (将原先全备的备份ID重命名为最近的刚被删除的那个增备ID：QSEVBS)
5. 校验新的备份集QSEVBS数据文件是否有效。
#### 1.4.14.4.	验证合并后的备份集

```powershell
[omm@node2 ~]$ gs_probackup validate -B /opt/opgaussbak/ -i QSEVBS --instance node2bak
LOG: Validate begin.
INFO: Validating backup QSEVBS
INFO: Backup QSEVBS data files are valid
LOG: Thread [1]: Opening WAL segment "/opt/opgaussbak/backups/node2bak/QSEVBS/database/pg_xlog/0000000100000000000000A8"
INFO: Backup QSEVBS WAL segments are valid
INFO: Backup QSEVBS is valid.
INFO: Validate of backup QSEVBS completed.
[omm@node2 ~]$
```

## 1.5.	gs_probackup异地备份恢复测试
### 1.5.1.配置远程复制用户

```sql
postgres=# create user rep1 with sysadmin replication identified by 'asdfg.1314';
NOTICE:  The encrypted password contains MD5 ciphertext, which is not secure.
CREATE ROLE
```
rep1权限：sysadmin+replication
ssh互信配置
1. 第一步:在本地机器上使用ssh-keygen产生公钥私钥对 
```powershell
$ ssh-keygen
```
2. 第二步:用ssh-copy-id将公钥复制到远程机器中
```powershell
ssh-copy-id -i .ssh/id_rsa.pub omm@192.168.126.130
```
```bash
注意:
ssh-copy-id 将key写到远程机器的 ~/ .ssh/authorized_key.文件中
```
3. 第三步: 登录到远程机器不用输入密码。

### 1.5.2.打开参数enable_cbm_tracking,跟踪数据页的变化
在node2主执行：
```sql
postgres=# show enable_cbm_tracking;
 enable_cbm_tracking 
---------------------
 off
(1 row)
postgres=# alter system set enable_cbm_tracking=on;
ALTER SYSTEM SET
postgres=#
```
### 1.5.3.异机初始化备份目录
Node1执行
```powershell
mkdir -p /opt/ogdata01
chown -R omm: /opt/ogdata01
chmod -R 700 /opt/ogdata01

cd /opt
mkdir opgaussbak
chown -R omm:dbgrp opgaussbak/
[omm@node1 ~]$ gs_probackup init  -B /opt/opgaussbak
INFO: Backup catalog '/opt/opgaussbak' successfully inited
```
#对目录的初始化操作实际是在备份目录下创建backups/和wal/子目录，分别用于存放备份文件和WAL文件。
### 1.5.4.添加异机备份实例
node1执行：
```powershell
[omm@node1 ~]$ gs_probackup   add-instance -B /opt/opgaussbak -D /opt/ogdata --instance node1bak --remote-proto=ssh --remote-host=192.168.126.130  --remote-port=22 --remote-path=/opt/og/bin --remote-user=omm 
```
报错1：
```powershell
LOG: Start SSH client process, pid 20743
ERROR: Agent error: /opt/og/bin/gs_probackup: error while loading shared libraries: libssl.so.1.1: cannot open shared object file: No such file or directory
```
解决方法：
默认情况下，可执行文件运行时只会去lib和/usr/lib中寻找，如果库安装在别的地方，则需要更新ld.so.conf文件
```powershell
vi /etc/ld.so.conf
```
在该文件中，追加lib的路径如下(不要加include):
```powershell
[root@node1 ~]# cat /etc/ld.so.conf
include ld.so.conf.d/*.conf
/opt/og/lib
```
然后运行ldconfig命令让修改生效：
```powershell
sudo /sbin/ldconfig –v
```
node1再次执行：
```powershell
[omm@node1 ~]$ /opt/og/bin/gs_probackup add-instance -B /opt/opgaussbak -D /opt/ogdata --instance node1bak --remote-proto=ssh --remote-host=192.168.126.130  --remote-port=22 --remote-path=/opt/og/bin --remote-user=omm 
LOG: Start SSH client process, pid 23822
INFO: Instance 'node1bak' successfully inited
[omm@node1 ~]$
```
### 1.5.5.异地执行全量备份

node1执行：

```powershell
gs_probackup backup –B /opt/opgaussbak  --instance=node1 -b full -D /opt/ogdata -h 192.168.126.130 -p 6543 -d postgres -U rep1 -W asdfg.1314 --remote-host=192.168.126.130 --remote-proto=ssh --remote-port=22 --remote-user=omm --remote-path=/opt/og/bin
```
报错如下：
```powershell
remote-proto=ssh --remote-port=22 --remote-user=omm --remote-path=/opt/og/bin
INFO: Backup start, gs_probackup version: 2.4.2, instance: node1bak, backup ID: QSIXPL, backup mode: FULL, wal mode: STREAM, remote: true, compress-algorithm: none, compress-level: 1
LOG: Backup destination is initialized
WARNING: This openGauss instance was initialized without data block checksums. gs_probackup have no way to detect data block corruption without them. Reinitialize PGDATA with option '--data-checksums'.
LOG: Start SSH client process, pid 23937
LOG: Database backup start
ERROR: could not connect to database postgres: FATAL:  no pg_hba.conf entry for replication connection from host "192.168.126.129", user "rep1", SSL off
WARNING: backup in progress, stop backup
INFO: wait for pg_stop_backup()
INFO: pg_stop backup() successfully executed
WARNING: Backup QSIXPL is running, setting its status to ERROR
```
解决如下：
添加 192.168.126.129 node1 可以访问node2进行备份。
```powershell
host    replication     rep1           192.168.126.129/32            md5
```
再次执行日志如下：
```powershell
LOG: SSH process 24102 is terminated with status 0
INFO: Data files are transferred, time elapsed: 1m:38s
INFO: wait for pg_stop_backup()
INFO: pg_stop backup() successfully executed
LOG: stop_lsn: 0/C10002F8
LOG: Looking for LSN 0/C10002F8 in segment: 0000000100000000000000C1
LOG: Found WAL segment: /opt/opgaussbak/backups/node1bak/QSIYFH/database/pg_xlog/0000000100000000000000C1
LOG: Thread [0]: Opening WAL segment "/opt/opgaussbak/backups/node1bak/QSIYFH/database/pg_xlog/0000000100000000000000C1"
LOG: Found LSN: 0/C10002F8
[2021-05-03 17:33:07]:(null): not renaming "/opt/opgaussbak/backups/node1bak/QSIYFH/database/pg_xlog/0000000100000000000000C2", segment is not complete.
LOG: finished streaming WAL at 0/C2000140 (timeline 1)
LOG: Getting the Recovery Time from WAL
LOG: Thread [0]: Opening WAL segment "/opt/opgaussbak/backups/node1bak/QSIYFH/database/pg_xlog/0000000100000000000000C1"
INFO: Syncing backup files to disk
INFO: Backup files are synced, time elapsed: 4s
INFO: Validating backup QSIYFH
INFO: Backup QSIYFH data files are valid
INFO: Backup QSIYFH resident size: 1314MB
INFO: Backup QSIYFH completed
```
1.5.6.	查看异机全量备份
```powershell
[omm@node1 ~]$ gs_probackup show -B /opt/opgaussbak
```
![](https://img-blog.csdnimg.cn/img_convert/737a5c65f20891ee24a3ad4ce9806fb1.png)
### 1.5.7.异机增量备份
Node2主库查看数据本身t4只有1条。

```sql
postgres=# \d t4;
      Table "public.t4"
 Column |  Type   | Modifiers 
--------+---------+-----------
 id     | numeric | 

postgres=# select *from t4;
 id 
----
  4
(1 row)
```
我们插入3条数据并进行增量备份
```sql
postgres=#  insert into t4 values('4');
INSERT 0 1
postgres=# 
postgres=# select * from t4;
 id 
----
  4
  4
  4
(3 rows)
```

```powershell
[omm@node1 ~]$ gs_probackup backup -B /opt/opgaussbak  --instance=node1bak -b PTRACK -D /opt/ogdata -h 192.168.126.130 -p 6543 -d postgres -U rep1 -W asdfg.1314 --remote-host=192.168.126.130 --remote-proto=ssh --remote-port=22 --remote-user=omm --remote-path=/opt/og/bin
```
日志如下：

```powershell
INFO: Backup start, gs_probackup version: 2.4.2, instance: node1bak, backup ID: QSIZ0I, backup mode: PTRACK, wal mode: STREAM, remote: true, compress-algorithm: none, compress-level: 1
LOG: Backup destination is initialized
WARNING: This openGauss instance was initialized without data block checksums. gs_probackup have no way to detect data block corruption without them. Reinitialize PGDATA with option '--data-checksums'.
LOG: Start SSH client process, pid 24279
LOG: Database backup start
LOG: Latest valid FULL backup: QSIYFH
INFO: Parent backup: QSIYFH
LOG: started streaming WAL at 0/C3000000 (timeline 1)
[2021-05-03 17:44:02]: check identify system success                                                
[2021-05-03 17:44:02]: send START_REPLICATION 0/C3000000 success                                    
[2021-05-03 17:44:02]: keepalive message is received    

.......

..........                                            
INFO: wait for pg_stop_backup()
[2021-05-03 17:44:25]: keepalive message is received                                                
INFO: pg_stop backup() successfully executed
LOG: stop_lsn: 0/C30002F8
LOG: Looking for LSN 0/C30002F8 in segment: 0000000100000000000000C3
LOG: Found WAL segment: /opt/opgaussbak/backups/node1bak/QSIZ0I/database/pg_xlog/0000000100000000000000C3
LOG: Thread [0]: Opening WAL segment "/opt/opgaussbak/backups/node1bak/QSIZ0I/database/pg_xlog/0000000100000000000000C3"
LOG: Found LSN: 0/C30002F8
[2021-05-03 17:44:30]:(null): not renaming "/opt/opgaussbak/backups/node1bak/QSIZ0I/database/pg_xlog/0000000100000000000000C4", segment is not complete.
LOG: finished streaming WAL at 0/C4000140 (timeline 1)
LOG: Getting the Recovery Time from WAL
LOG: Thread [0]: Opening WAL segment "/opt/opgaussbak/backups/node1bak/QSIZ0I/database/pg_xlog/0000000100000000000000C3"
INFO: Syncing backup files to disk
INFO: Backup files are synced, time elapsed: 3s
INFO: Validating backup QSIZ0I
INFO: Backup QSIZ0I data files are valid
INFO: Backup QSIZ0I resident size: 290MB
INFO: Backup QSIZ0I completed
[omm@node1 ~]$
```

### 1.5.8.查看异机增量备份
```powershell
[omm@node1 ~]$ gs_probackup show -B /opt/opgaussbak
```
![](https://img-blog.csdnimg.cn/img_convert/5925103dab2e4c34524b258eccfb4ef6.png)
### 1.5.9.执行全量恢复异机恢复
```powershell
 [omm@node1 ~]$ gs_probackup restore  -B /opt/opgaussbak/ -D /opt/ogdata01 -i QSIYFH --instance  QSIYFH
WARNING: Failed to access directory "/opt/opgaussbak/backups/QSIYFH": No such file or directory
ERROR: Instance 'QSIYFH' does not exist in this backup catalog
[omm@node1 ~]$ gs_probackup restore  -B /opt/opgaussbak/ -D /opt/ogdata01 -i QSIYFH --instance node1bak
LOG: Restore begin.
LOG: there is no file tablespace_map
LOG: check tablespace directories of backup QSIYFH
LOG: check external directories of backup QSIYFH
WARNING: Process 24097 which used backup QSIYFH no longer exists
INFO: Validating backup QSIYFH
INFO: Backup QSIYFH data files are valid
LOG: Thread [1]: Opening WAL segment "/opt/opgaussbak/backups/node1bak/QSIYFH/database/pg_xlog/0000000100000000000000C1"
INFO: Backup QSIYFH WAL segments are valid
INFO: Backup QSIYFH is valid.
INFO: Restoring the database from backup at 2021-05-03 17:30:53+08
LOG: there is no file tablespace_map
LOG: Restore directories and symlinks...
INFO: Start restoring backup files. PGDATA size: 1297MB
LOG: Start thread 1
INFO: Backup files are restored. Transfered bytes: 1313MB, time elapsed: 41s
INFO: Restore incremental ratio (less is better): 101% (1313MB/1297MB)
INFO: Syncing restored files to disk
INFO: Restored backup files are synced, time elapsed: 6s
INFO: Restore of backup QSIYFH completed.
```
----
注意：恢复之前需要创建恢复目录，启动数据库进行数据验证。
![](https://img-blog.csdnimg.cn/img_convert/040b4a3782d9b1858946bcd0595eee9b.png)



