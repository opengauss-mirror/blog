---
title: 'openGauss学习（一）--centos安装'
date: '2021-11-30'
category: 'blog'
tags: ['openGauss社区开发入门']
archives: '2021-11-30'
author: 'zhaoyanliang'
summary: 'openGauss社区开发入门'
times: '13:30'
---

在 centos 上安装 opengauss 教程

#### 一、opengauss 介绍

openGauss 是一款开源关系型数据库管理系统，采用木兰宽松许可证 v2 发行。openGauss 早期版本内核源自 PostgreSQL，深度融合华为在数据库领域多年的经验，结合企业级场景需求，持续构建竞争力特性。

openGauss 目前支持在 centos 及 openEuler 系统上运行

#### 二、centos 安装教程

1. ##### 环境配置

   VMware Workstation Pro 虚拟机软件，centos7.9（最好是 7.6 及以上版本，因为之后会手动修改版本号到 7.6，如果 7.6 以下版本可能不能向上兼容）

2. ##### 虚拟机软件 VMware Workstation Pro 安装

   下载链接：[下载 VMware Workstation Pro | CN](https://www.vmware.com/cn/products/workstation-pro/workstation-pro-evaluation.html)

   该软件安装较为简单，按照普通软件安装即可，如遇问题网上也有很多教程

3. ##### centos 镜像下载

   我使用的是校园网，可以直接到清华源、中科大源等网站下载；如果是非校园网，到官网下载速度偏慢

   清华源链接：[清华大学开源软件镜像站 | Tsinghua Open Source Mirror](https://mirrors.tuna.tsinghua.edu.cn/)

   步骤一：点击“获取下载链接”

   <img src='./typora-user-images/image-20211011110017529.png'>

   步骤二：选择 centos 及版本号为 7 的 DVD 镜像文件，点击即可下载（下载为 7.9 版本）

   <img src='./typora-user-images/image-20211011110243320.png'>

4. ##### centos 虚拟机配置

   1. 启动 VMware Workstation Pro，点击创建新的虚拟机

   <img src='./typora-user-images/image-20211011110532504.png'>

   2. 选择“自定义”，点击下一步

      <img src='./typora-user-images/image-20211011111105402.png'>

   3. 保持默认，点击下一步

      <img src='./typora-user-images/image-20211011111152764.png'>

   4. 选择“稍后安装”

      <img src='./typora-user-images/image-20211011112527795.png'>

   5. 选择图中选项

      <img src='./typora-user-images/image-20211011112604966.png'>

   6. 给虚拟机随便起个名称和选择安装位置，均可自定义

      <img src='./typora-user-images/image-20211011112641119.png'>

   7. 配置处理器，图中为我的设置，可根据自己电脑性能配置，如果决定不妥后面可在虚拟机设置更改

      <img src='./typora-user-images/image-20211011112912990.png'>

   8. 设置内存大小（建议保持默认推荐的设置）

      <img src='./typora-user-images/image-20211011113011613.png'>

   9. 选择网络类型，这里选择“网络地址转换”

      <img src='./typora-user-images/image-20211011114156879.png'>

   10. 以下几步保持默认

       <img src='./typora-user-images/image-20211011114220394.png'>

       <img src='./typora-user-images/image-20211011114251134.png'>

       <img src='./typora-user-images/image-20211011114306010.png'>

   11. 磁盘分配，选择“拆分多个文件”，磁盘容量建议保持默认

       <img src='./typora-user-images/image-20211011114348393.png'>

   12. 以下保持默认，之后点击“完成”即可

       <img src='./typora-user-images/image-20211011114445675.png'>

   13. 点击“编辑虚拟机设置”

       <img src='./typora-user-images/image-20211011114558025.png'>

   14. 选择镜像 iso 文件

       <img src='./typora-user-images/image-20211011114657689.png'>

   15. 移除打印机这个不存在的设备，之后点击“确定”保存

       <img src='./typora-user-images/image-20211011114813694.png'>

   16. 添加第二张网卡和修改模式（重要步骤）

       <img src='./typora-user-images/image-20211103160714362.png'>

       <img src='./typora-user-images/image-20211103160845726.png'>

   17. 启动 centos

       启动安装第一界面，直接按下“Enter“键后就会进入自检界面。

       ​ <img src='./typora-user-images/image-20211011120425966.png'>

       在自检界面按下“Esc“键跳过自检，然后进入如下界面

   18. 选择语言

       <img src='./typora-user-images/image-20211011120501686.png'>

   19. 选择安装位置进行分区

       <img src='./typora-user-images/image-20211011120618314.png'>

       <img src='./typora-user-images/image-20211011120648928.png'>

   20. 手动配置分区，下拉选择标准分区

       <img src='./typora-user-images/image-20211011120857291.png'>

       点击“点这里创建它们”

       <img src='./typora-user-images/image-20211011120945745.png'>

       <img src='./typora-user-images/image-20211011121025609.png'>

       接受更改

   21. 在安装信息摘要页面，点击“网络和主机名“进行网络和主机名设置，具体如下：

       <img src='./typora-user-images/image-20211011121053125.png'>

   22. 安装信息摘要页面，点击“网络和主机名“进行网络和主机名设置，具体如下：

       选择第一张网卡：

       <img src='./typora-user-images/image-20211103162822965.png'>

       如以太网（enpOs3）网卡，先点击“关闭“边上的按钮把网卡打开。设置主机名（如：db1），并点击“应用（A）”，然后点击“配置“。

       ​ <img src='./typora-user-images/image-20211103163644877.png'>

       说明：设置主机名时一定要注意，如果在同一网段内有多位学员按此文档来安装，请尽量把主机名设成不一样

       <img src='./typora-user-images/image-20211103163927741.png'>

       在配置页中，选择“常规“，然后勾选”可用时自动链接到这个网络“，接着点击”保存“。

       接着照着第一张网卡设置进行第二张网卡的设置：

       <img src='./typora-user-images/image-20211103164056986.png'>

       <img src='./typora-user-images/image-20211103164127187.png'>

       点击完成进行保存：

       <img src='./typora-user-images/image-20211103165558378.png'>

   23. 在安装信息摘要页面，点击“软件选择 “进行软件安装设置，具体如下：

       1. 2. <img src='./typora-user-images/image-20211103165736561.png'>

          在此页面选择“GNOME 桌面“，并在右边勾选”GNOME 应用程序“、”开发工具“、”安全性工具“、”系统管理工具“。然后点击完成。

          ​ <img src='./typora-user-images/image-20211103170212856.png'>

          点击“开始安装”：

          <img src='./typora-user-images/image-20211103170442514.png'>

   24. 安装界面设置：

       <img src='./typora-user-images/image-20211103171515916.png'>

       点击“ROOT 密码“，给 ROOT 用户设置密码（如：openGauss@123）。

       <img src='./typora-user-images/image-20211103171533677.png'>

       点击“创建用户“，在此新创建一个用户（如：用户 test，密码 openGauss@123）,具体如下：

       ​ <img src='./typora-user-images/image-20211103171544484.png'>

       ​

       点击“完成配置“，系统安装中，等待数分钟后会出现如下界面：

       ​ <img src='./typora-user-images/image-20211103171600132.png'>

       出现此界面表示，系统安装完成，然后点击“重启“。

       <img src='./typora-user-images/image-20211103171632754.png'>

   25. 接受许可证

       <img src='./typora-user-images/image-20211103172432749.png'>

       点击完成配置：

       <img src='./typora-user-images/image-20211103172510280.png'>

   26. 点击用户和输入密码进入系统：

       <img src='./typora-user-images/image-20211103172630663.png'>

       其他的有一些语言设置，直接选择和跳过就好，不赘诉。

       <img src='./typora-user-images/image-20211103172944323.png'>

   27. 在 Linux 操作系统上，通过 ifconfig 来查看二张网卡是否都正常启动，具体如下：

       <img src='./typora-user-images/image-20211103173057702.png'>

       通过 ping baidu.com 确认是否能上网，具体如下：

       <img src='./typora-user-images/image-20211103173156715.png'>

       出现上述页面则一切正常（按 ctrl+c 可停止）。

至此，centos 完全安装完成，运行 opengauss 的环境全部配置完成
