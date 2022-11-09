+++

title = "openGauss1.1.0测试：全量备份和恢复&增量备份和恢复" 

date = "2021-01-28" 

tags = ["openGauss备份与恢复"] 

archives = "2021-01" 

author = "阎书利" 

summary = "openGauss1.1.0测试：全量备份和恢复&增量备份和恢复"

img = "/zh/post/ysl/title/img39.png" 

times = "17:30"

+++

# openGauss1.1.0测试：全量备份和恢复&增量备份和恢复<a name="ZH-CN_TOPIC_0000001116618869"></a>

## 全量备份和恢复<a name="section1319723712219"></a>

**测试用例名称**：全量备份和恢复

**测试用例说明（方法、目的）**：是否支持在线备份全量备份，验证全量备份后数据恢复正确性和效率，备份期间对性能的影响。

**测试执行步骤**

1.执行备份命令，指定备份路径如/opt/enmo/openGauss/101/data/backup

```
[omm@enmo backup]$ gs_basebackup -D /opt/enmo/openGauss/101/data/backup/ -h 172.20.10.9 -p 15400
```

![](./figures/20210115-65cb7b06-83ab-4e3f-bf64-034abbb46312.png)

查看备份文件。

![](./figures/20210115-bfc74161-f1d3-4d0c-905e-47ac6e19d342.png)

2.停止openGauss数据库。

```
[omm@enmo backup]$gs_om -t stop
```

![](./figures/20210115-fc28f356-146a-478a-a36c-158cbf0fedac.png)

在备份路径启动数据库成功。

```
[omm@enmo backup]$ gs_ctl start -D /opt/enmo/openGauss/101/data/backup
```

![](./figures/04.png)

登录数据库。

```
[omm@enmo backup]$ gsql -d postgres -p 15400 -U omm -r
```

![](./figures/05.png)

或者可以把备份文件拷贝到原来数据目录，启动数据库成功. 如果数据库存在链接文件，备份后会失去，要重新链接。

**结论：支持全量备份和恢复**

## 增量备份和恢复<a name="section1359712403019"></a>

**测试用例名称**：增量备份和恢复

**测试用例说明（方法、目的）**：是否支持在线备份增量备份，验证增量备份后数据恢复正确性和效率，在线备份期间对性能的影响。

**前置条件**：主备环境搭建完成，全量备份已完成。

**测试执行步骤**

1.在postgresql.conf中手动添加参数“enable\_cbm\_tracking = on”。

初始化备份目录，使用openGauss的安装用户执行。

```
gs_probackup init -B /opt/backup/increment
```

![](./figures/06.png)

在备份路径backup\_dir内初始化一个新的备份实例，并生成pg\_probackup.conf配置文件，该文件保存了指定数据目录data\_dir的gs\_probackup设置。

```
gs_probackup add-instance -B /opt/backup/increment -D /opt/enmo/openGauss/101/data/dn --instance=dn1
```

![](./figures/07.png)

将指定的连接、压缩、冗余、日志相关设置和外部目录设置添加到pg\_probackup.conf配置文件中，或修改已设置的值。不推荐手动编辑pg\_probackup.conf配置文件。

```
gs_probackup set-config -B /opt/backup/increment --instance=dn1 -d postgres -p 15400 -U omm
```

![](./figures/08.png)

创建指定实例的备份。第一次创建全量备份，-b的参数FULL\(全量\)，PTRACK（增量备份）。

```
gs_probackup backup -B /opt/backup/increment --instance dn1 -b full
```

![](./figures/09.png)

![](./figures/10.png)

```
gs_probackup backup -B /opt/backup/increment --instance dn1 -b ptrack
```

![](./figures/11.png)

![](./figures/12.png)

查看备份内容

```
gs_probackup show -B /opt/backup/increment/
```

![](./figures/13.png)

**结论：支持增量与全量备份**

