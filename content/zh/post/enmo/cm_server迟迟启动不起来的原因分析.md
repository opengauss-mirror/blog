+++

title = "cm_server迟迟启动不起来的原因分析" 

date = "2022-06-27" 

tags = ["cm_server迟迟启动不起来的原因分析"] 

archives = "2022-06" 

author = "云和恩墨" 

summary = "cm_server迟迟启动不起来的原因分析"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# cm_server迟迟启动不起来的原因分析

本文出处：[https://www.modb.pro/db/424183](https://www.modb.pro/db/424183)

1. 场景
   在某个一主两备的环境下面(4G内存)，使用om部署了cm，发现在其中一个节点发现ca_server迟迟不能启动，查看cm里面关于ca_agent和ca_server的日志，发现报出了一个错误。
   错误如下：
   m_server: opendir failed!

```
write_log_file,log file is null now:2022-06-24 14:23:39.186 tid=31471 MAIN ERROR: read staticNodeConfig failed! errno = 12.

cm_server: opendir  failed! 
write_log_file,log file is null now:2022-06-24 14:23:39.186 tid=31471 MAIN ERROR: read_config_file_check failed!
```

从字面意思来看是读取节点配置文件失败，erno=12。

1. 原因分析：
   初步怀疑：操作系统的磁盘空间满了，检查发现磁盘空间还有大量剩余。
   系统的调用有问题，(后面会分析)
   权限的问题，检查权限也是ok的，属组和属主都是dbgrp和omm。
   所以磁盘占满了和权限都不是问题的原因，而最主要的原因是系统调用的问题。
2. 系统调用的原因
   咨询了mogdb 的内核开发关于cm的工程师，检查了cm的全部日志，他分析的结果是：
   原因是内存空间不够（cma拉起cms时候报错信息，时间再6.24日14：21分，文件操作提示错误，对应错误码12，errno =12是fopen接口的错误。
3. 解决办法：
   在确定准备同步一致的情况下面，对ca_server拉不起来的那台节点的mogdb实例重新启动一下，这边就很快发现ca_server以及拉起来了。
