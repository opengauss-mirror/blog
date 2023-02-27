---
title: 'openGauss开机自启动'

date: '2022-04-02'

category: 'blog'
tags: ['openGauss开机自启动']

archives: '2022-04'

author: '高云龙'

summary: 'openGauss开机自启动'

img: '/zh/blogs/gaoyunlong/title/img24.png'

times: '11:15'
---

# openGauss 开机自启动

在 centos7.6 操作系统上设置 openGauss 开机自启动，我们先来了解一下自定义服务的配置文件组成部分，共分为[Unit]、[Service]、[Install]三个部分。

```
[Unit]
Description= 当前服务的简单描述
Documentation= 服务配置文件的位置
Before= 在某服务之前启动
After= 在某服务之后启动
Wants= 与某服务存在“依赖”关系，依赖服务退出，不影响本服务运行
Requires= 与某服务存在“强依赖”关系，依赖服务故障，本服务也随之退出

[Service]
Type=
--simple（默认值）：ExecStart字段启动的进程为主进程。
--forking：ExecStart字段将以fork()方式启动，后台运行。
--oneshot：类似于simple，只执行一次，Systemd会等它执行完，才启动其他服务。
--dbus：类似于simple，等待D-Bus信号后在启动。
--notify：类似于simple，启动结束后会发出通知信号，Systemd再启动其他服务。
--idle：类似于simple，等其他任务都执行完，才会启动该服务。

User= 服务运行的用户
Group= 服务运行的用户组

ExecStart= 启动服务的命令，可以是可执行程序、系统命令或shell脚本，必须是绝对路径。
ExecReload= 重启服务的命令，可以是可执行程序、系统命令或shell脚本，必须是绝对路径。
ExecStop= 停止服务的命令，可以是可执行程序、系统命令或shell脚本，必须是绝对路径。
ExecStartPre= 启动服务之前执行的命令
ExecStartPost= 启动服务之后执行的命令
ExecStopPost= 停止服务之后执行的命令
PrivateTmp= True表示给服务分配独立的临时空间
KillSignal= 信号量，一般为SIGQUIT
TimeoutStartSec= 启动超时时间
TimeoutStopSec= 停止超时时间
TimeoutSec= 同时设置 TimeoutStartSec= 与 TimeoutStopSec= 的快捷方式
PIDFile= PID文件路径

KillMode= Systemd停止sshd服务方式
--control-group（默认值）：所有子进程，都会被杀掉。
--process：只杀主进程。
--mixed：主进程将收到SIGTERM信号，子进程收到SIGKILL信号。
--none：没有进程会被杀掉，只是执行服务的stop命令。

Restart=服务程序退出后，Systemd的重启方式
--no（默认值）：退出后不会重启。
--on-success：只有正常退出时（退出状态码为0），才会重启。
--on-failure：只有非正常退出时（退出状态码非0，包括被信号终止和超时），才会重启。
--on-abnormal：只有被信号终止和超时，才会重启。
--on-abort：只有在收到没有捕捉到的信号终止时，才会重启。
--on-watchdog：超时退出，才会重启。
--always：总是重启。

RestartSec= 重启服务之前，需要等待的秒数
RemainAfterExit= yes 进程退出以后，服务仍然保持执行


[Install]
WantedBy=multi-user.target
--WantedBy字段，表示该服务所在的 Targe，target的含义是服务组，表示一组服务
--multi-user.target，表示多用户命令行状态
--graphical.target，表示图形用户状态，它依赖于multi-user.target
```

### openGauss 单机自启动 模版

#### 配置自定义服务

```
--/usr/lib/systemd/system/opengauss.service

[Unit]
Description=openGauss
Documentation=openGauss Server
After=syslog.target
After=network.target


[Service]
Type=forking


User=omm
Group=dbgrp


Environment=PGDATA=/data/opengauss/data
Environment=GAUSSHOME=/data/opengauss/app
Environment=LD_LIBRARY_PATH=/data/opengauss/app/lib
ExecStart=/data/opengauss/app/bin/gaussdb
ExecReload=/bin/kill -HUP $MAINPID
KillMode=mixed
KillSignal=SIGINT
TimeoutSec=0


[Install]
WantedBy=multi-user.target
```

#### 添加到开机自启动

```
systemctl daemon-reload
systemctl enable opengauss
systemctl start opengauss
systemctl status opengauss
systemctl stop opengauss
```

### openGauss 集群自启动 模版

#### 配置自定义服务

```
--/usr/lib/systemd/system/opengauss_om.service

[Unit]
Description=openGauss
Documentation=openGauss Server
After=syslog.target
After=network.target


[Service]
Type=forking


User=omm
Group=dbgrp


Environment=GPHOME=/data/opengauss/gausstools
Environment=PGDATA=/data/opengauss/data
Environment=GAUSSHOME=/data/opengauss/app
Environment=LD_LIBRARY_PATH=/data/opengauss/app/lib
ExecStart=/data/opengauss/gausstools/script/gs_om -t start
ExecReload=/bin/kill -HUP $MAINPID
KillMode=mixed
KillSignal=SIGINT
TimeoutSec=0


[Install]
WantedBy=multi-user.target
```

#### 添加到开机自启动

```
systemctl daemon-reload
systemctl enable opengauss_om
systemctl start opengauss_om
systemctl status opengauss_om
systemctl stop opengauss_om
```
