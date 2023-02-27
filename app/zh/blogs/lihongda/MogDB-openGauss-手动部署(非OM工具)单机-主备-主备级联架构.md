---
title: 'MogDB/openGauss 手动部署(非OM工具)单机，主备，主备级联架构'

date: '2021-06-29'

category: 'blog'
tags: ['MogDB/openGauss 手动部署(非OM工具)单机，主备，主备级联架构']

archives: '2021-06'

author: '李宏达'

summary: 'MogDB/openGauss 手动部署(非OM工具)单机，主备，主备级联架构'

img: '/zh/blogs/lihongda/title/title.png'

times: '19:30'
---

# **MogDB/openGauss 手动部署(非 OM 工具)单机，主备，主备级联架构**<a name="ZH-CN_TOPIC_0000001142262039"></a>

## 一、前期准备<a name="section1235751411246"></a>

1.  关闭防火墙，selinux

    ```
    systemctl disable firewalld.service
    systemctl stop firewalld.service
    setenforce=0
    sed -i '/^SELINUX=/c'SELINUX=disabled /etc/selinux/config
    ```

2.  安装依赖包

    ```
    yum install libaio-devel -y
    ```

3.  创建相关目录，用户，组

    ```
    groupadd dbgrp -g 2000
    useradd omm -g 2000
    -u 2000 echo "Enmo@123" | passwd --stdin omm
    mkdir -p /opt/mogdb/software
    chown -R omm:dbgrp /opt/
    ```

4.  上传并解压二进制文件

    ```
    [root@mogdb-kernel-0001 software]# pwd
    /opt/mogdb/software
    [root@mogdb-kernel-0001 software]# ls -lrt
    total 90236
    -r-------- 1 root root 92401412 Jun 13 06:14 MogDB-2.0.0-openEuler-64bit.tar.bz2
    chown omm:dbgrp MogDB-2.0.0-openEuler-64bit.tar.bz2
    su - omm
    cd /opt/mogdb/software/
    tar -xf MogDB-2.0.0-openEuler-64bit.tar.bz2
    ```

## 二、初始化数据库（单机）<a name="section443955117268"></a>

1.  配置环境变量

    ```
    echo "export GAUSSHOME=/opt/mogdb/software"  >> /home/omm/.bashrc &&
    \ echo "export PATH=\$GAUSSHOME/bin:\$PATH " >> /home/omm/.bashrc &&
    \ echo "export LD_LIBRARY_PATH=\$GAUSSHOME/lib:\$LD_LIBRARY_PATH" >> /home/omm/.bashrc
    source /home/omm/.bashrc
    ```

2.  init 数据库

    ```
    bin/gs_initdb --pgdata=/opt/mogdb/data --nodename=primary --pwpasswd=Enmo@123 --encoding=UTF-8 --locale=en_US.UTF-8
    ```

3.  修改初始化参数

    ```
    echo "port=26000" >> /opt/mogdb/data/postgresql.conf
    echo "listen_addresses = '0.0.0.0'" >> /opt/mogdb/data/postgresql.conf
    echo "password_encryption_type = 0" >> /opt/mogdb/data/postgresql.conf
    echo "log_directory = 'pg_log'" >> /opt/mogdb/data/postgresql.conf
    echo "remote_read_mode=non_authentication" >> /opt/mogdb/data/postgresql.conf
    echo "host all all 0.0.0.0/0 md5" >> /opt/mogdb/data/pg_hba.conf
    ```

4.  启动数据库

    ```
    gs_ctl start -D /opt/mogdb/data
    ```

**至此单机安装完成**

## 三、主备安装<a name="section126411406302"></a>

1.  主库操作

    - 配置连接通道

      ```
      echo "replconninfo1='localhost=172.16.0.106 localport=26001 localheartbeatport=26005 localservice=26004 remotehost=172.16.0.245 remoteport=26001 remoteheartbeatport=26005 remoteservice=26004'	 " >> /opt/mogdb/data/postgresql.conf
      ```

    **localhost 为主库 IP,remotehost 为备库 IP**

    - 将主库以 primary 方式启动

      ```
      gs_ctl restart -D /opt/mogdb/data/ -M primary
      ```

2.  备库操作

    - 前期准备工作如上（一）
    - 配置环境变量

      ```
      echo "export GAUSSHOME=/opt/mogdb/software"  >> /home/omm/.bashrc && \
      echo "export PATH=\$GAUSSHOME/bin:\$PATH " >> /home/omm/.bashrc && \
      echo "export LD_LIBRARY_PATH=\$GAUSSHOME/lib:\$LD_LIBRARY_PATH" >> /home/omm/.bashrc
      source /home/omm/.bashrc
      - 将主库的配置文件传到备库
      scp /opt/mogdb/data/pg_hba.conf /opt/mogdb/data/postgresql.conf 172.16.0.245:/opt/mogdb/data/
      ```

    - 配置连接通道,将 localhost 和 remotehost 对调

      ```
      .sed -i “/^replconninfo1/creplconninfo1=‘localhost=172.16.0.245 localport=26001 localheartbeatport=26005 localservice=26004 remotehost=172.16.0.106 remoteport=26001 remoteheartbeatport=26005 remoteservice=26004’” /opt/mogdb/data/postgresql.conf
      ```

    **localhost 为备库 IP,remotehost 为主库 IP**

    - 构建主备关系

      ```
      gs_ctl build -D /opt/mogdb/data/ -b full -M standby
      ```

    - 查询主备状态

      - 主库

        ```
        [omm@mogdb-kernel-0001 data]$ gs_ctl query -D /opt/mogdb/data/
        [2021-06-13 07:51:41.119][159054][][gs_ctl]: gs_ctl query ,datadir is /opt/mogdb/data
         HA state:
                local_role                     : Primary
                static_connections             : 1
                db_state                       : Normal
                detail_information             : Normal

         Senders info:
                sender_pid                     : 159041
                local_role                     : Primary
                peer_role                      : Standby
                peer_state                     : Normal
                state                          : Streaming
                sender_sent_location           : 0/14000258
                sender_write_location          : 0/14000258
                sender_flush_location          : 0/14000258
                sender_replay_location         : 0/14000258
                receiver_received_location     : 0/14000258
                receiver_write_location        : 0/14000258
                receiver_flush_location        : 0/14000258
                receiver_replay_location       : 0/14000258
                sync_percent                   : 100%
                sync_state                     : Sync
                sync_priority                  : 1
                sync_most_available            : Off
                channel                        : 172.16.0.106:26001-->172.16.0.245:60856

         Receiver info:
        No information
        ```

      - 备库

        ```
        [omm@mogdb-kernel-0002 data]$ gs_ctl query -D /opt/mogdb/data/
        [2021-06-13 07:51:32.743][123204][][gs_ctl]: gs_ctl query ,datadir is /opt/mogdb/data
         HA state:
                local_role                     : Standby
                static_connections             : 1
                db_state                       : Normal
                detail_information             : Normal

         Senders info:
        No information
         Receiver info:
                receiver_pid                   : 123194
                local_role                     : Standby
                peer_role                      : Primary
                peer_state                     : Normal
                state                          : Normal
                sender_sent_location           : 0/14000140
                sender_write_location          : 0/14000140
                sender_flush_location          : 0/14000140
                sender_replay_location         : 0/14000140
                receiver_received_location     : 0/14000140
                receiver_write_location        : 0/14000140
                receiver_flush_location        : 0/14000140
                receiver_replay_location       : 0/14000140
                sync_percent                   : 100%
                channel                        : 172.16.0.245:60856<--172.16.0.106:26001
        ```

**至此主备已安装完成**

## 四、主备级联安装<a name="section13243193343216"></a>

1.  主备安装如上\(一，二，三\)
2.  添加复制通道

    - 主库操作

      ```
      gsql -d postgres -p26000 -c “alter system set replconninfo2 to ‘localhost=172.16.0.106 localport=26001 localheartbeatport=26005 localservice=26004 remotehost=172.16.0.127 remoteport=26001 remoteheartbeatport=26005 remoteservice=26004 iscascade=true’;”
      ```

    - 备库操作

      ```
      gsql -d postgres -p26000 -c “alter system set replconninfo2 to ‘localhost=172.16.0.245 localport=26001 localheartbeatport=26005 localservice=26004 remotehost=172.16.0.127 remoteport=26001 remoteheartbeatport=26005 remoteservice=26004 iscascade=true’;”
      ```

3.  级联库操作

    - 前期准备工作如上（一）
    - 配置环境变量

      ```
      echo "export GAUSSHOME=/opt/mogdb/software"  >> /home/omm/.bashrc && \
      echo "export PATH=\$GAUSSHOME/bin:\$PATH " >> /home/omm/.bashrc && \
      echo "export LD_LIBRARY_PATH=\$GAUSSHOME/lib:\$LD_LIBRARY_PATH" >> /home/omm/.bashrc
      source /home/omm/.bashrc
      ```

    - 将备库的配置文件传到备库

      ```
      scp /opt/mogdb/data/pg_hba.conf /opt/mogdb/data/postgresql.conf 172.16.0.245:/opt/mogdb/data/
      ```

    - 配置连接通道

      ```
      sed -i "/^replconninfo1/creplconninfo1='localhost=172.16.0.127 localport=26001 localheartbeatport=26005 localservice=26004 remotehost=172.16.0.106 remoteport=26001 remoteheartbeatport=26005 remoteservice=26004'" /opt/mogdb/data/postgresql.conf
      sed -i "/replconninfo2/creplconninfo2='localhost=172.16.0.127 localport=26001 localheartbeatport=26005 localservice=26004 remotehost=172.16.0.245 remoteport=26001 remoteheartbeatport=26005 remoteservice=26004'" /opt/mogdb/data/postgresql.conf
      ```

    **localhost 为级联 IP，remotehost 为主库 IP 和备库 IP。**

    - 构建主备关系

      ```
      gs_ctl build -D /opt/mogdb/data/ -b full -M cascade_standby
      ```

4.  查看主备级联状态

    - 主库

    ```
    [omm@mogdb-kernel-0001 ~]$ gs_ctl query -D /opt/mogdb/data
    [2021-06-13 08:37:03.281][207069][][gs_ctl]: gs_ctl query ,datadir is /opt/mogdb/data
     HA state:
            local_role                     : Primary
            static_connections             : 2
            db_state                       : Normal
            detail_information             : Normal

     Senders info:
            sender_pid                     : 206143
            local_role                     : Primary
            peer_role                      : Standby
            peer_state                     : Normal
            state                          : Streaming
            sender_sent_location           : 0/1A000140
            sender_write_location          : 0/1A000140
            sender_flush_location          : 0/1A000140
            sender_replay_location         : 0/1A000140
            receiver_received_location     : 0/1A000140
            receiver_write_location        : 0/1A000140
            receiver_flush_location        : 0/1A000140
            receiver_replay_location       : 0/1A000140
            sync_percent                   : 100%
            sync_state                     : Sync
            sync_priority                  : 1
            sync_most_available            : Off
            channel                        : 172.16.0.106:26001-->172.16.0.245:34586

     Receiver info:
    No information
    ```

    - 备库

    ```
     [omm@mogdb-kernel-0002 ~]$ gs_ctl query -D /opt/mogdb/data
    [2021-06-13 08:37:09.128][147065][][gs_ctl]: gs_ctl query ,datadir is /opt/mogdb/data
     HA state:
            local_role                     : Standby
            static_connections             : 2
            db_state                       : Normal
            detail_information             : Normal

     Senders info:
            sender_pid                     : 147043
            local_role                     : Standby
            peer_role                      : Cascade Standby
            peer_state                     : Normal
            state                          : Streaming
            sender_sent_location           : 0/1A000140
            sender_write_location          : 0/1A000140
            sender_flush_location          : 0/1A000140
            sender_replay_location         : 0/1A000140
            receiver_received_location     : 0/1A000140
            receiver_write_location        : 0/1A000140
            receiver_flush_location        : 0/1A000140
            receiver_replay_location       : 0/1A000140
            sync_percent                   : 100%
            sync_state                     : Async
            sync_priority                  : 0
            sync_most_available            : Off
            channel                        : 172.16.0.245:26001-->172.16.0.127:49110

     Receiver info:
            receiver_pid                   : 146771
            local_role                     : Standby
            peer_role                      : Primary
            peer_state                     : Normal
            state                          : Normal
            sender_sent_location           : 0/1A000140
            sender_write_location          : 0/1A000140
            sender_flush_location          : 0/1A000140
            sender_replay_location         : 0/1A000140
            receiver_received_location     : 0/1A000140
            receiver_write_location        : 0/1A000140
            receiver_flush_location        : 0/1A000140
            receiver_replay_location       : 0/1A000140
            sync_percent                   : 100%
            channel                        : 172.16.0.245:34586<--172.16.0.106:26001
    ```

    - 级联库

    ```
    [omm@mogdb-kernel-0003 data]$ gs_ctl query -D /opt/mogdb/data
    [2021-06-13 08:36:56.223][273241][][gs_ctl]: gs_ctl query ,datadir is /opt/mogdb/data
     HA state:
            local_role                     : Cascade Standby
            static_connections             : 2
            db_state                       : Normal
            detail_information             : Normal

     Senders info:
    No information
     Receiver info:
            receiver_pid                   : 273237
            local_role                     : Cascade Standby
            peer_role                      : Standby
            peer_state                     : Normal
            state                          : Normal
            sender_sent_location           : 0/1A000140
            sender_write_location          : 0/1A000140
            sender_flush_location          : 0/1A000140
            sender_replay_location         : 0/1A000140
            receiver_received_location     : 0/1A000140
            receiver_write_location        : 0/1A000140
            receiver_flush_location        : 0/1A000140
            receiver_replay_location       : 0/1A000140
            sync_percent                   : 100%
            channel                        : 172.16.0.127:49110<--172.16.0.245:26001
    ```

    **至此主备级联安装完成**
