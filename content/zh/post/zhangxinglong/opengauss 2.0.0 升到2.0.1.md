title = opengauss 2.0.0 升到2.0.1" 

date = "2021-06-29" 

tags = ["opengauss 2.0.0 升到2.0.1"] 

archives = "2021-07" 

author = "张兴龙" 

summary = "opengauss 2.0.0 升到2.0.1"

img = "/zh/post/lihongda/title/title.png" 

times = "19:30"

+++

# opengauss 2.0.0 升到2.0.1<a name="ZH-CN_TOPIC_0000001124544422"></a>

操作系统是openeuler 20.03 LTS sp1,4c4g,opengauss 2.0 是用贾军锋老师的一键安装脚本安装的。

```sql
[omm@openeuler ~]$ gs_om -V
gs_om (openGauss OM 2.0.0 build 7ef5c80a) compiled at 2021-03-31 21:16:05 commit 0 last mr
```

将2.0.1的包放在原安装目录/soft/openGauss下

```sql
ls
bin openGauss-2.0.1-openEuler-64bit-om.sha256
clusterconfig.xml openGauss-2.0.1-openEuler-64bit-om.tar.gz
etc openGauss-2.0.1-openEuler-64bit.sha256
include openGauss-2.0.1-openEuler-64bit.tar.bz2
jre openGauss-Package-bak_78689da9.tar.gz
lib openGauss-Package-bak_d97c0e8a.tar.gz
openGauss-2.0.0-openEuler-64bit-all.tar.gz script
openGauss-2.0.0-openEuler-64bit-om.sha256 share
openGauss-2.0.0-openEuler-64bit-om.tar.gz simpleInstall
openGauss-2.0.0-openEuler-64bit.sha256 upgrade_sql.sha256
openGauss-2.0.0-openEuler-64bit.tar.bz2 upgrade_sql.tar.gz
openGauss-2.0.1-openEuler-64bit-all.tar.gz version.cfg
```

进行安装前预检查

```sql
[root@openeuler openGauss]# script/gs_preinstall -X clusterconfig.xml -U omm -G dbgrp
Parsing the configuration file.
Successfully parsed the configuration file.
Installing the tools on the local node.
Successfully installed the tools on the local node.
Setting pssh path
Successfully set core path.
Are you sure you want to create the user[omm] and create trust for it (yes/no)? no
Preparing SSH service.
Successfully prepared SSH service.
Checking OS software.
Successfully check os software.
Checking OS version.
Successfully checked OS version.
Creating cluster's path.
Successfully created cluster's path.
Setting SCTP service.
Successfully set SCTP service.
Set and check OS parameter.
Setting OS parameters.
Successfully set OS parameters.
Warning: Installation environment contains some warning messages.
Please get more details by "/soft/openGauss/script/gs_checkos -i A -h openeuler --detail".
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
Set ARM Optimization.
No need to set ARM Optimization.
Fixing server package owner.
Setting finish flag.
Successfully set finish flag.
Preinstallation succeeded.
```
检查完后环境变量变化了，GAUSS_VERSION=2.0.1

```sql
cat .bashrc
# Source default setting
[ -f /etc/bashrc ] && . /etc/bashrc
```

```sql
# User environment PATH
PATH="$HOME/.local/bin:$HOME/bin:$PATH"
export GPHOME=/gaussdb/om
export PATH=$GPHOME/script/gspylib/pssh/bin:$GPHOME/script:$PATH
export LD_LIBRARY_PATH=$GPHOME/lib:$LD_LIBRARY_PATH
export PYTHONPATH=$GPHOME/lib
export GAUSSHOME=/gaussdb/app
export PATH=$GAUSSHOME/bin:$PATH
export LD_LIBRARY_PATH=$GAUSSHOME/lib:$LD_LIBRARY_PATH
export S3_CLIENT_CRT_FILE=$GAUSSHOME/lib/client.crt
export GAUSS_VERSION=2.0.1
export PGHOST=/gaussdb/om/omm_mppdb
export GAUSSLOG=/gaussdb/log/omm
umask 077
export GAUSS_ENV=2
export GS_CLUSTER_NAME=dbCluster
```


执行升级

```sql
[omm@openeuler openGauss]$ script/gs_upgradectl -t auto-upgrade --grey -X clusterconfig.xml
Static configuration matched with old static configuration files.
Successfully set upgrade_mode to 0.
omm@openeuler's password:
omm@openeuler's password:
Checking upgrade environment.
Successfully checked upgrade environment.
Start to do health check.
Successfully checked cluster status.
Upgrade all nodes.
Performing grey rollback.
omm@openeuler's password:
No need to rollback.
The directory /gaussdb/app_78689da9 will be deleted after commit-upgrade, please make sure there is no personal data.
Installing new binary.
Successfully backup hotpatch config file.
Sync cluster configuration.
Successfully synced cluster configuration.
Switch symbolic link to new binary directory.
Successfully switch symbolic link to new binary directory.
Switching all db processes.
Wait for the cluster status normal or degrade.
Successfully switch all process version
The nodes ['openeuler'] have been successfully upgraded to new version. Then do health check.
Start to do health check.
Successfully checked cluster status.
Waiting for the cluster status to become normal.
.
The cluster status is normal.
Upgrade main process has been finished, user can do some check now.
Once the check done, please execute following command to commit upgrade:
gs_upgradectl -t commit-upgrade -X /soft/openGauss/clusterconfig.xml
Successfully upgrade nodes.
```

有关软件版本

```sql
[omm@openeuler gaussdb]$ gs_om -V
gs_om (openGauss OM 2.0.1 build da8e0828) compiled at 2021-06-02 19:48:48 commit 0 last mr
[omm@openeuler gaussdb]$ gsql -V
gsql (openGauss 2.0.1 build d97c0e8a) compiled at 2021-06-02 19:37:16 commit 0 last mr
```
提交升级

```sql
gs_upgradectl -t commit-upgrade -X /soft/openGauss/clusterconfig.xml
Start to do health check.
Successfully checked cluster status.
Successfully cleaned old install path.
Commit upgrade succeeded.
```

连接测试
```sql
gsql -r -d postgres -p 26000
gsql ((openGauss 2.0.1 build d97c0e8a) compiled at 2021-06-02 19:37:16 commit 0 last mr )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.
```
升级完成。
