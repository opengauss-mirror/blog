---
title: '在虚拟机上安装部署openGauss数据库指导手册'
date: '2021-11-13'
category: 'blog'
tags: ['在虚拟机上安装部署openGauss数据库指导手册']
archives: '2021-11-13'
author: 'opengauss_deploy'
summary: '在虚拟机上安装部署openGauss数据库指导手册'
img: '/zh/blogs/xingchen/title/img1.png'
times: '19:30'
---

### 前言

本文介绍了如何在虚拟机上安装部署 openGauss 数据库，分别使用 Centos7.6 系统和 openEuler20.03LTS 操作系统进行实验。

包含了在华为云上 ECS(弹性云服务器)以及通过本地 windows 系统上虚拟化一个 linux 系统进行安装。

### 资源下载

文档中使用到了 VirtualBox 客户端进行 linux 虚拟化，以及使用到的 Centos7.6 和 openEuler20.03LTS 操作系统镜像，提供如下地址可供下载：

#### VirtualBox

- 官网下载地址
  ```
    https://download.virtualbox.org/virtualbox/
    https://download.virtualbox.org/virtualbox/6.1.14/VirtualBox-6.1.14-140239-Win.exe
  ```
- 归档
  ```
  https://opengauss-beta.obs.cn-north-4.myhuaweicloud.com/iso/VirtualBox-6.1.14-140239-Win.exe
  ```

#### Centos7.6 x86_64 操作系统 ISO 镜像

- 官网下载地址
  ```
  https://mirrors.huaweicloud.com/centos-vault/7.8.2003/isos/x86_64/
  https://mirrors.huaweicloud.com/centos-vault/7.8.2003/isos/x86_64/CentOS-7-x86_64-DVD-2003.iso
  ```
- 归档
  ```
  https://opengauss-beta.obs.cn-north-4.myhuaweicloud.com/iso/CentOS-7-x86_64-DVD-2003.iso
  ```

#### openEuler-20.03-LTS x86_64 操作系统 ISO 镜像

- 官网下载地址
  ```
  https://mirrors.huaweicloud.com/openeuler/openEuler-20.03-LTS/ISO/x86_64/
  https://mirrors.huaweicloud.com/openeuler/openEuler-20.03-LTS/ISO/x86_64/openEuler-20.03-LTS-x86_64-dvd.iso
  ```
- 归档
  ```
  https://opengauss-beta.obs.cn-north-4.myhuaweicloud.com/iso/openEuler-20.03-LTS-x86_64-dvd.iso
  ```

### 虚拟机部署文档

1. 在华为云 ECS 上安装部署 openGauss 数据库指导手册

   文档下载：
   wps: [在 ECS 上安装部署 openGauss 数据库指导手册.docx](../docs/在ECS上安装部署openGauss数据库指导手册.docx)
   pdf: [在 ECS 上安装部署 openGauss 数据库指导手册.pdf](../docs/在ECS上安装部署openGauss数据库指导手册.pdf)

2. 在虚拟机+CentOS 上安装部署 openGauss 数据库指导手册

   文档下载：
   wps: [在虚拟机+CentOS 上安装部署 openGauss 数据库指导手册.docx](../docs/在虚拟机+CentOS上安装部署openGauss数据库指导手册.docx)
   pdf: [在虚拟机+CentOS 上安装部署 openGauss 数据库指导手册.pdf](../docs/在虚拟机+CentOS上安装部署openGauss数据库指导手册.pdf)

3. 在虚拟机+openEuler 上安装部署 openGauss 数据库指导手册

   文档下载：
   wps: [在虚拟机+openEuler 上安装部署 openGauss 数据库指导手册.docx](../docs/在虚拟机+openEuler上安装部署openGauss数据库指导手册.docx)
   pdf: [在虚拟机+openEuler 上安装部署 openGauss 数据库指导手册.pdf](../docs/在虚拟机+openEuler上安装部署openGauss数据库指导手册.pdf)

4. 使用虚拟机镜像文件导入部署 CentOS+openGauss 指导手册

   文档下载：
   wps: [使用虚拟机镜像文件导入部署 CentOS+openGauss 指导手册.docx](../docs/使用虚拟机镜像文件导入部署CentOS+openGauss指导手册.docx)
   pdf: [使用虚拟机镜像文件导入部署 CentOS+openGauss 指导手册.pdf](../docs/使用虚拟机镜像文件导入部署CentOS+openGauss指导手册.pdf)

5. 使用虚拟机镜像文件导入部署 openEuler+openGauss 指导手册

   文档下载:
   wps: [使用虚拟机镜像文件导入部署 openEuler+openGauss 指导手册.docx](../docs/使用虚拟机镜像文件导入部署openEuler+openGauss指导手册.docx)
   pdf: [使用虚拟机镜像文件导入部署 openEuler+openGauss 指导手册.pdf](../docs/使用虚拟机镜像文件导入部署openEuler+openGauss指导手册.pdf)
