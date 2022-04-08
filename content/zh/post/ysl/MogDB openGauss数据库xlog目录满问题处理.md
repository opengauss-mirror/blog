+++

title = "MogDB/openGauss数据库xlog目录满问题处理" 

date = "2022-04-07" 

tags = ["MogDB/openGauss数据库xlog目录满问题处理"] 

archives = "2022-04" 

author = "阎书利" 

summary = "MogDB/openGauss数据库xlog目录满问题处理"

img = "/zh/post/ysl/title/img39.png" 

times = "10:20"

+++

# MogDB/openGauss数据库xlog目录满问题处理

MODGDB/openGauss数据库xlog满通常为以下几个原因：
1.主备状态不正常，存在网络问题，集群内有宕机的节点
2.xlog保留数量过多
3.逻辑复制槽失效，且未及时清理
4.开启归档，但归档失败导致xlog不清理

首先，确认数据库状态

```
gs_om -t query  
```

确认主备状态，是否存在宕机的节点。
查看是否存在down，Standby Need repair(WAL)或者unkown的状态。

如果数据库状态不正常，xlog目录100%
需要手动移走一部分xlog后，检查数据库状态后将库拉起，并排查相关问题。

如果数据库状态正常，仅xlog目录大，则继续排查其他问题。

清理：
1.找一个空间大的目录
例如:

```
su  - omm 
cd /mogdb_bak 
mkdir xlog_mv_0919 
```

2.移走部分xlog到xlog路径下

```
cd /ogdata/data/dn1/pg_xlog 
```

查看xlog数量,看是否xlog保留过多

```
ls | wc -l  
```

**！！！为了恢复环境，移动一小部分xlog，其余等处理之后，自己清理**

生成移动xlog语句，并检查（前1000条）

```
ls -ltr | head -n 1000 | awk '{print "mv "$9  " /mogdb_bak/xlog_mv_0919/"}' 
```

3.#实际执行移动操作

```
ls -ltr | head -n 1000 | awk '{print "mv "$9  " /mogdb_bak/xlog_mv_0919/"}' | sh 
```

4.移动之后df -Th看空间是否下来

5.gs_om -t query 查看数据库状态

如果不正常，需要先尝试拉起主数据库

```
gs_ctl start -D /ogdata/data/dn1 
```

然后依次拉起备机数据库

```
gs_ctl start -D /ogdata/data/dn1 -M standby 
```

备库拉不起来则先不处理，等找到xlog目录满源头后（例如主库删除失效逻辑复制后）,考虑做build(先尝试增量不行再用增量）

```sql
gs_ctl build -D /ogdata/data/dn1 -b incremental  gs_ctl build -D /ogdata/data/dn1 -b full 
```

6.登录主数据库查看逻辑复制槽状态，查看有无失效逻辑复制槽

```
select * from pg_replication_slots; 
```

7.在主库删除失效逻辑复制槽

```sql
select * from pg_drop_replication_slot('aohdoasdaoiodiandoan'); 
```

<!--aohdoasdaoiodiandoan-->为逻辑复制槽名字

删除失效的逻辑复制槽，主库和备库的xlog目录应该都会释放一部分空间

8.删除后 df -Th看空间是否下来

9.参数调整

```sql
（1）查看wal_keep_segments参数，该参数为Xlog日志文件段数量,“pg_xlog”目录下保留事务日志文件的最小数目。
（2）查看max_size_for_xlog_prune参数，在enable_xlog_prune打开时生效，如果有备机断连且xlog日志大小大于此阈值，则回收日志。
根据实际状况，可进行修改。
（3）如果是PG13版本，可考虑开启max_slot_wal_keep_size参数，他是允许replication slot 保留的wal文件的最大
大小，用于防止wal无限增大导致主库的文件系统空间被撑爆，设置该参数之后如果超过该参数值，PostgreSQL将开始删除最
早的WAL文件。默认值是-1，-1表示表示禁用本功能。单位是MB。
```

10.检查归档模式是否开启

```
show archive_mode;
到归档目录下，看开启归档参数时，是否有归档。并检查归档空间，排除归档相关问题。
```
