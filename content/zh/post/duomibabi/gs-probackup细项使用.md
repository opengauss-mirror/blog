+++

title = "gs-probackup细项使用" 

date = "2021-01-29" 

tags = ["openGauss备份与恢复"] 

archives = "2021-01" 

author = "多米爸比" 

summary = "gs-probackup细项使用"

img = "/zh/post/duomibabi/title/img27.png" 

times = "15:30"

+++

# gs-probackup细项使用

**gs\_probackup对gs\_basebackup的增强**

-   支持PTRACK增量备份。
-   支持增量恢复：基于页级增量恢复。
-   Merge合并：合并增量备份。
-   数据备份有效性自动检测，无需实际的数据恢复。
-   数据库实例checksum检测\(需要打开checksum）。
-   备份保留策略：按时间或数量保留WAL归档及备份。
-   多线程并行化：支持backup、restore、merge等命令。
-   支持远程操作：支持SSH方式远程备份或恢复实例。
-   支持从standby备份，避免主库额外负载压力。
-   数据存储在外部目录：与PGDATA保持独立。
-   备份元数据管理：命令配置持久化到文件。

**1.备份模式**

备份支持FULL全备和PTRACK增量备份两种模式。

```
$ gs_probackup backup --help|grep backup-mode
gs_probackup backup -B backup-path --instance=instance_name -b backup-mode
  -b, --backup-mode=backup-mode    backup mode=FULL|PTRACK
```

>**注意：** 
>如果实例做过恢复，需要重新做一次FULL全备，才能接着使用增量备份。

ptrack备份例子

```
$ gs_probackup backup \
--backup-path=/home/omm/ogdata_probackup \
--instance=og_6432 \
--backup-mode=ptrack \
--pguser=postgres \
--pgdatabase=postgres \
--pgport=6432 \
--password=XXX
```

>**注意：** 
>需要设置enable\_cbm\_tracking = on。

**2.恢复模式**

恢复支持none/checksum/lsn三种恢复模式。

```
$ gs_probackup restore --help|grep incremental
                 [--skip-external-dirs] [-I incremental_mode]
  -I, --incremental-mode=none|checksum|lsn
```

none为常规恢复，checksum和lsn是两种级别的增量恢复。

**3.表空间映射备份恢复**

**3.1 gs\_basebackup使用tablespace-mapping选项**

```
$ gs_basebackup --pgdata=/home/omm/ogdata_backup \
--port=6432 --username=omm \
--tablespace-mapping=/home/omm/tblsp1=/home/omm/tblsp2 \
--format=p \
--xlog-method=stream \
--verbose --progress
```

**3.2 gs\_probackup backup使用external-dirs选项指定创建表空间时的location**

```
$ gs_probackup backup \
--backup-path=/home/omm/ogdata_probackup \
--instance=og_6432 \
--backup-mode=full \
--external-dirs=/home/omm/tblsp1 \
--pguser=postgres \
--pgdatabase=postgres \
--pgport=6432 \
--password=XXX
```

external-dirs选项只能使用一次，可用分隔符号分割多个路径。

**3.3 gs\_probackup restore使用external-mapping选项指定恢复路径**

先使用gs\_probackup show命令查看上面备份id为QN7VUG的备份参数。

```
$ gs_probackup show \
--backup-path=/home/omm/ogdata_probackup \
--instance=og_6432 \
--backup-id=QN7VUG | grep external-dirs

external-dirs = '/home/omm/tblsp1'
```

下面恢复使用external-mapping和tablespace-mapping选项进行表空间内外映射。

```
$ gs_probackup restore \
--backup-path=/home/omm/ogdata_probackup \
--instance=og_6432 \
--pgdata=/home/omm/ogdata_backup2 \
--backup-id=QN7VUG \
--incremental-mode=checksum \
--tablespace-mapping='/home/omm/tblsp1=/home/omm/tblsp2' \
--external-mapping='/home/omm/tblsp1=/home/omm/tblsp2'
```

>**注意：** 
>1.gs\_probackup backup使用external-dirs选项，gs\_probackup restore使用external-mapping选项，不要混淆。
>2.gs\_probackup restore需要同时使用external-dirs和external-mapping选项。
>3.多个表空间选项可以使用多次，选项里面等号前后分别映射备份和恢复的表空间路径。

**4.Merge合并备份**

Merge合并备份指将增量备份合并至全备形成一个备份，加快恢复速度。

**4.1 查看备份列表**

```
$ gs_probackup show \
--backup-path=/home/omm/ogdata_probackup \
--instance=og_6432
```

**4.2 合并增量备份**

```
$ gs_probackup merge \ 
-B /home/omm/ogdata_probackup \ 
--instance og_6432 \ 
--backup-id=QN7V6J
```

**5.WAL传输模式**

备份数据过程中产生的WAL有两种传输模式，默认使用stream方式，如果使用archive方式需要配置archive\_mode参数。

```
$ gs_probackup backup \
--backup-path=/home/omm/ogdata_probackup \
--instance=og_6432 \
--backup-mode=full \
--stream --temp-slot \
--pguser=postgres \
--pgdatabase=postgres \
--pgport=6432 \
--password=XXX
```

**6.备份保留策略**

全局设置备份保留多少个。

```
$ gs_probackup set-config \
--backup-path=/home/omm/ogdata_probackup \
--instance=og_6432 \
--retention-redundancy=10
```

全局设置备份保留多少天。

```
$ gs_probackup set-config \ 
--backup-path=/home/omm/ogdata_probackup \ 
--instance=og_6432 \ 
--retention-window=30 
```

也可同时设置个数和天。

```
$ gs_probackup set-config \ 
--backup-path=/home/omm/ogdata_probackup \ 
--instance=og_6432 \ 
--retention-redundancy=10 \ 
--retention-window=30 
```

单个备份额外设置，比如某个特殊时间点备份额外设置，使用ttl按时间间隔保留或者expire-time到某个时间点。例如下面设置保留60天。

```
$ gs_probackup backup \ 
--backup-path=/home/omm/ogdata_probackup \ 
--instance=og_6432 \ 
--backup-mode=full \ 
--ttl='60d' \ 
--pguser=postgres \ 
--pgdatabase=postgres \ 
--pgport=6432 \ 
--password=XXX 
```

查看备份是否有设置保留策略，查看expire-time属性。

```
$ gs_probackup show \ 
--backup-path=/home/omm/ogdata_probackup \ 
--instance=og_6432 \ 
--backup-id=QN7ZR8 |grep expire-time
```

**7.多线程并行备份或恢复**

并行备份使用 -j或者 --threads选项。

```
$ gs_probackup backup --help|grep threads
                 [--backup-pg-log] [-j threads_num] [--progress]
  -j, --threads=threads_num        number of parallel threads
```

并行恢复使用 -j或者 --threads选项。

```
$ gs_probackup restore --help|grep threads
                 [-D pgdata-path] [-i backup-id] [-j threads_num] [--progress]
  -j, --threads=threads_num        number of parallel threads
```

