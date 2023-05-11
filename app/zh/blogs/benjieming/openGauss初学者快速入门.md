---
title: 'openGauss初学者快速入门'
category: 'blog'
date: '2022-09-28'

tags: ['openGauss征稿活动', 'openGauss']

archives: '2022-09'

author: '本杰明'

summary: 'openGauss初学者快速入门.'
---

前言

我第一次接触 openGauss 是再 2022 年 8 月份，当时有一个鲲鹏应用大赛，我对于 openGauss 很陌生，在网上看了很多有关 openGauss 的视频，

我在 bilibili 上看到松鼠会发布的 openGauss 讲解是最多的，然后我就对着视频搭建 openGauss，当时还好我电脑上一直有 centos7 的虚拟环境，

所以我直接利用 centos 搭建 openGauss，这里给大家分享一下我入门的学习是怎么样的。

<!-- ![输入图片说明](../../../../data/img/1.png) -->

## 一、openGauss 是什么？

官方解释：openGauss 是一款全面友好开放，携手伙伴共同打造的企业级开源关系型数据库。openGauss 提供面向多核架构的极致性能、

全链路的业务、数据安全、基于 AI 的调优和高效运维的能力。openGauss 深度融合华为在数据库领域多年的研发经验，结合企业级场景需求，

持续构建竞争力特性。openGauss 网站 (<https://opengauss.org/zh/>) 提供了有关 openGauss 软件的最新信息。

个人理解：我认为是一个基于 Linux 的一款国内数据库，其实和 Mysql 等数据库一样，但是主要还是觉得这是我们骄傲的民族企业华为开发的，

安全方面我会更放心。最主要的原因是 openGauss 属于开源数据库，对我们开发者来说是很有好的，学习起来也很方便。

## 二、openGauss 软件架构

下面这张图也是我从官方的资料中找到的：

<!-- ![输入图片说明](../../../../data/img/2.png) -->

这张图片，我们可以很明显的看到，在 openGauss 数据库中，是有一个单独的备份机制存在，也是对数据防止丢失做的一种机制吧。其中图片中的名词下面附上官方解释：

### OM

运维管理模块（Operation Manager）。提供数据库日常运维、配置管理的管理接口、工具。个人理解：方便维护的管理员模块

### CM

数据库管理模块（Cluster Manager）。管理和监控数据库系统中各个功能单元和物理资源的运行情况，确保整个系统的稳定运行。个人理解：针对数据库的管理模块

### 客户端驱动

客户端驱动（Client Driver）。负责接收来自应用的访问请求，并向应用返回执行结果。客户端驱动负责与 openGauss 实例通信，发送应用的 SQL 命令，接收 openGauss 实例的执行结果。

### openGauss（主备）

openGauss 主备（Datanode）。负责存储业务数据、执行数据查询任务以及向客户端返回执行结果。

openGauss 实例包含主、备两种类型，支持一主多备。建议将主、备 openGauss 实例分散部署在不同的物理节点中。个人理解：安全机制的考虑

### Storage

服务器的本地存储资源，持久化存储数据。个人理解：就是长久的本地资源

## 三、openGauss 特点

特点 针对特点解释

高性能 通过列存储、向量化执行引擎、融合引擎等关键技术，实现百亿数据量查询秒级响应

高可用 同城跨 AZ（Available Zone）容灾，数据不丢失，分钟级恢复

高安全性 支持访问控制、加密认证、数据库审计、动态数据脱敏等安全特性，提供全方位端到端的数据安全保护

可维护性好 支持 WDR 诊断、慢 SQL 诊断、Session 诊断等多种维护手段，准确快速定位问题。具备 AI4DB 能力，能够通过 AI 算法实现数据库自调优、自监控、自诊断等

我个人认为最大的特点就是，高安全性，但是目前还在发展阶段，openGauss 的开发人员真的是需要加把劲了，之前我在学习 openGauss 的时候，

就发现网站是存在漏洞的，而且很多，如果不更加细致的去处理好的话，对于数据的安全真的是不敢恭维！！！！ 希望官方大大还是更加注意开发质量

## 四、个人学习

1.下载

我个人选择的是极简版，也是为了方便，在文章开始我也说了，我主要还是搭建在 centos7 上面

<!-- ![输入图片说明](../../../../data/img/4.png) -->

2.安装环境

centos7

<!-- ![输入图片说明](../../../../data/img/5.png) -->

3.基础配置

解压之后，我们按照顺序输入下面的命令，

```
使用VIM打开config文件。
vim /etc/selinux/config

修改“SELINUX”的值“disabled”，这里用的是vim编辑器，如果不懂的话请自学一下
SELINUX=disabled

重启centos。
reboot

检查防火墙状态。
systemctl status firewalld

在没有关闭的情况下，关闭防火墙
systemctl disable firewalld.service
systemctl stop firewalld.service
```

4.其他配置

```
设置编码，/etc/profile文件下添加“export LANG=Unicode
vim /etc/profile
设置时间
date #查看时间
将/usr/share/zoneinfo/目录下的时区文件复制为/etc/localtime文件下面
cp /usr/share/zoneinfo/配置的时间地点 /etc/localtime

```

基本上因为 centos7 很多配置是已经默认的，所以相对而言搭建很简单。

## 五、建议

- 1.推广形式可以加强，首先，我了解到推广的形式，主要还是比赛，活动，我认为可以发布会，公众号视频，还可以找博主在一些平台上，撰写一个月，效果可能会更好。

- 2.建议可以出版 openGauss 的书籍，出版，推广书籍（这个我看到捉虫活动有这样的书籍）

- 3.另外是，我个人感觉对于 openGauss 的学习视频资料太少了，可以联合直播，扩展了解的人群。

- 4.可以在行业中找到突破口，目前大厂数据库更换的话太昂贵，可以先占领中小型公司的市场。

最后，支持华为，支持松鼠会，支持 openGauss
