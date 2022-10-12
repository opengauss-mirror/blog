+++

title = "安装openGauss执行安装命令时提示没有gs_install怎么办" 

date = "2022-09-30" 

tags = ["openGauss安装"] 

archives = "2022-09" 

author = "张翠娉" 

summary = "安装openGauss执行安装命令时提示没有gs_install怎么办"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "14:20"

+++

# 安装openGauss执行安装命令时提示没有gs_install怎么办？

**背景介绍**：

安装openGauss数据库时，成功执行环境初始化后，执行数据库安装时，提示如下错误。

**报错内容**：

```bash
[root@mogdb-kernel-0002 software]# /opt/software/opengauss1/script/gs_preinstall -U omm -G dbgrp -X /opt/software/opengauss1/clusterconfig.xml
Parsing the configuration file.
Successfully parsed the configuration file.
Installing the tools on the local node.
Successfully installed the tools on the local node.
Setting host ip env
Successfully set host ip env.
Are you sure you want to create the user[omm] (yes/no)? no
Preparing SSH service.
Successfully prepared SSH service.
Checking OS software.
Successfully check os software.
Checking OS version.
Successfully checked OS version.
Creating cluster's path.
Successfully created cluster's path.
Set and check OS parameter.
Setting OS parameters.
Successfully set OS parameters.
Warning: Installation environment contains some warning messages.
Please get more details by "/opt/software/opengauss1/script/gs_checkos -i A -h mogdb-kernel-0002 --detail".
Set and check OS parameter completed.
Preparing CRON service.
Successfully prepared CRON service.
Setting user environmental variables.
Successfully set user environmental variables.
Setting the dynamic link library.
Successfully set the dynamic link library.
Setting Core file
Successfully set core path.
Setting pssh path
Successfully set pssh path.
Setting Cgroup.
Successfully set Cgroup.
Set ARM Optimization.
Successfully set ARM Optimization.
Fixing server package owner.
Setting finish flag.
Successfully set finish flag.
Preinstallation succeeded.
[omm@mogdb-kernel-0002 ~]$ gs_install -X /opt/software/opengauss1/clusterconfig.xml --gsinit-parameter="--locale=en_US.UTF-8" --gsinit-parameter="--encoding=UTF-8"
-bash: gs_install：未找到命令
```

**报错原因**：

因为环境变量里的 GAUSSHOME值为/opt/software/opengauss，但是执行安装时，命令所指定的路径为opengauss1，完整命令为：gs_install -X /opt/software/opengauss1/clusterconfig.xml --gsinit-parameter="--locale=en_US.UTF-8" --gsinit-parameter="--encoding=UTF-8"。出现了不一致，就容易导致此种错误。

**解决办法**：

删除环境变量中的GAUSSHOME配置后，重新执行安装命令gs_install -X /opt/software/opengauss1/clusterconfig.xml --gsinit-parameter="--locale=en_US.UTF-8" --gsinit-parameter="--encoding=UTF-8"即可解决问题。
