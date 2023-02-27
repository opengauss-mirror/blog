---
title: 'MogDB单实例安装，初始化脚本解析xml文件报错'

date: '2022-05-23'

category: 'blog'
tags: ['MogDB单实例安装，初始化脚本解析xml文件报错']

archives: '2022-05'

author: '云和恩墨'

summary: 'MogDB单实例安装，初始化脚本解析xml文件报错'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# MogDB 单实例安装，初始化脚本解析 xml 文件报错

本文出处：[https://www.modb.pro/db/337297](https://www.modb.pro/db/337297)

安装标准版单实例 MogDB 时，执行初始化脚本 xml 解析操作

```
[root@mog mogdb]#/opt/software/mogdb/script/gs_preinstall -U omm -G dbgrp -X /opt/software/mogdb/clusterconfig.xml
```

报错：

[GAUSS-51632] : Failed to do python3 '/opt/software/mogdb/script/local/LocalCheckOS.py' -t Check_Firewall_Service -l '/var/log/mogdb/omm/om/gs_local.log' . Error:

'ascii' codec can't decode byte 0xe2 in position 0: ordinal not in range(128).

解决方式：

将操作系统的字符集改成 UTF-8

```
[root@mog mogdb]#export LANG=en_US.UTF-8
```

之后再执行初始化脚本解析，发现执行成功，不再报错，问题解决。
