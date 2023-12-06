---
title: 'gs_probackup全量恢复流程简化脚本'
date: '2023-11-20'
category: 'blog'
tags: ['openGauss使用增强']
archives: '2023-07'
author: 'liuzhanfeng'
summary: 'gs_probackup全量恢复流程简化脚本'
img: ''
times: '20:37'
---

# gs\_probackup

### 简介

gs_probackup是一个用于管理openGauss数据库备份和恢复的工具。可以对openGauss数据库进行备份，以便在数据库出现故障时能够恢复服务器。

**说明：** 工具详细的介绍与使用情况请参考官方文档。

在资源池化模式下进行全量恢复时，由于步骤繁琐，很容易出现问题，因此编写脚本简化全量恢复的流程。

### 脚本如下

**说明：** 脚本中未添加异常情况检验，使用时可自行添加。

1. 在关闭集群后，主节点执行脚本做恢复前的准备工作。

   ```
   #!/bin/bash

    config_path=$DSS_HOME/cfg/dss_vg_conf.ini

    echo "cleaning volumn"
    while IFS=':' read -r vgname diskname
    do
            dd if=/dev/zero of=$diskname bs=2048 count=1000 > /dev/null 2>&1
    done < "$config_path"
    echo "successfully clean volumn"

    echo "creating volumn"
    while IFS=':' read -r vgname diskname
    do
            dsscmd cv -g $vgname -v $diskname -D $DSS_HOME
    done < "$config_path"
    echo "successfully create volumn"

    echo "deleting PGDATA"
    rm -rf $PGDATA
    echo "successfully delete PGDATA"

    echo "starting dssserver"
    dssserver -M -D $DSS_HOME &
    echo "successfully start dssserver"
   ```

2. 在主机执行恢复操作。

   ```
   gs_probackup restore -B backup-path --instance instance_name -D pgdata-path -i backup_id
   ```

3. 关闭dssserver。

   ```
   kill -9 xxx(dssserver的pid)  或  dsscmd stopdss
   ```

4. 在备节点执行脚本。

    ```
    #!/bin/bash

    echo "copy PGDATA"
    cd $PGDATA
    cd ..
    path=$(pwd)
    dn=$(basename "$PGDATA")
    mv ${dn} ${dn}_bak
    echo "successfully copy PGDATA"

    echo "starting dssserver"
    dssserver -M -D $DSS_HOME &
    sleep 3
    echo "successfully start dssserver"

    echo "starting initdb"
    cd $GAUSSLOG/om
    initdb_str=$(grep gs_init *)
    initdb_str2=$(echo "$initdb_str" | grep -o 'gs_initdb.*')
    eval "${initdb_str2}"
    echo "successfully initdb"

    echo "restore PGDATA"
    rm -rf $PGDATA
    cd $path
    mv ${dn}_bak ${dn}
    echo "successfully restore PGDATA"
    ```

5. 关闭备节点的dssserver

   ```
   kill -9 xxx(dssserver的pid)  或  dsscmd stopdss
   ```

6. 在主节点启动集群

   ```
   cm_ctl start
   ```
