+++

title = "MogDB备机处于standby need-repair(WAL)状态" 

date = "2022-05-18" 

tags = ["MogDB备机处于standby need-repair(WAL)状态"] 

archives = "2022-05" 

author = "云和恩墨" 

summary = "MogDB备机处于standby need-repair(WAL)状态"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# MogDB备机处于standby need-repair(WAL)状态

本文出处：[https://www.modb.pro/db/402820](https://www.modb.pro/db/402820)

## 问题现象

Mogdb主备环境，备机检查发现Standby Need repair(WAL)故障。

## 原因分析

因网络故障、磁盘满等原因造成主备实例连接断开，主备日志不同步，导致数据库集群在启动时异常。

## 处理分析

通过gs_ctl build -D 命令对故障节点进行重建，具体的操作方法请参见Mogdb工具参考中的build参数。

## 主备状态检查

![img](../images/20220512-6b05767d-e69a-450b-89e2-ef3a98cc24dd.png)

## 修复后结果展示

![img](../images/20220512-e61af498-f6ce-4dd2-a96b-3b57e1500d96.png)
