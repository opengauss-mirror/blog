---
title: "在vm中安装openEuler及使用yum安装openGauss"
date: '2023-07-27'
category: 'blog'
tags: ['openGauss']
archives: '2023-07'
author: 'zhangjie'
summary: "本文将通过使用vm+openEuale环境安装一个openGauss,作为我在学习openGauss道路上的一个总结."
---




1.前言
--------------
随着互联网时代对数据库的新要求,以PostgreSQL为基础的开源数据库openGauss应运而生。openGauss在保持PostgreSQL接口兼容的前提下,对其查询优化器、高可用特性等进行了全面优化,实现了超高性能。同时,openGauss作为社区项目,新增功能持续丰富。优点是查询性能高、可靠性好、扩展性强,已经应用于多家大型企业的核心业务系统。但由于发展时间不长,生态建设还需进一步完善,对比成熟商业数据库,可视化和自动化管理还有差距。经过几年高速成长,openGauss已成功吸引广大开源社区参与,拥有活跃用户群体。
本文将通过使用vm+openEuale环境安装一个openGauss,作为我在学习openGauss道路上的一个总结.

2.安装openGauss实践
---------------

####     一) 安装openEuler操作系统

#####         为什么要选择openEuler当作操作系统?

*   开源协同。openEuler和openGauss都是华为主导的开源项目,两者具有共同的开源背景和理念。选择openEuler可以加强开源社区的技术协作和资源整合。
*   技术优势。openEuler在性能、安全性、稳定性等方面具备诸多优势,可以为openGauss提供高效可靠的运行支撑。
*   可扩展性。openEuler具备强大的可扩展性,可以更好地支撑openGauss的功能扩展和个性化定制。
*   云原生方向。openEuler和openGauss均注重云原生支持,有助于实现技术融合和创新,推动云数据库技术的进步。
*    统一平台。使用openEuler有助于openGauss用户实现IT系统的标准化和统一,降低维护成本。
*   丰富生态。openEuler拥有活跃的开源社区及丰富的解决方案,可为openGauss提供持续的支持。
*   战略协同。两者战略方向一致,有利于共同推动开源事业的蓬勃发展

#####         在ｖｍ中安装openEuler
	在官网[下载](https://www.openeuler.org/zh/download/archive/)openEuler系统包,最后选择20.03 LTS对应的版本
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-8adefcb1-4806-45d2-83a1-270f4bcd5265.png)

	打开vm,点击创建虚拟机,然后选择自定义
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-e53f547d-3cc6-47e2-84cd-41661035d8e7.png)

	点击下一步，这个兼容性保持默认就行，点击下一步
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-9fd7d13c-29d5-42b8-a944-c28e634ea12f.png)

	稍后安装操作系统，点击下一步
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-1472cebc-a3fc-4b2a-ba39-1bd2441aacf5.png)

	选linux -centos7 64位就行，点击下一步，事实上openEuler和Centos用起来差不多，不过openEuler是华为基于linux内核做的开源系统
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-caca4a05-611e-4cf9-8f34-a2cb1e964443.png)

	虚拟机名称和位置自己选,下一步	
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-eeec31c0-9554-421a-87a5-00f2d2656b31.png)

	配置参数 选个2-2一般就够了,下一步
	![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-cdbaf2e8-9494-43cf-80da-d9b83077cf87.png)
	
	设置内存
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-51d48cd7-8e63-4be0-b68f-410cc31c7c63.png)

	网络连接类型
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-dd02603e-b526-44ae-a591-e4940b4312d1.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-633556cb-337d-4a3a-b90c-be3dc35718ac.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-2691e2c3-979f-47bc-9af6-ccf0d805bf3c.png)

	选择创建新的虚拟磁盘，一般情况也是默认选项，不需要改，下一步

![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-992ddb0d-2c50-4013-a008-2d93ef40052c.png)

![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-300116af-8fe2-4ad1-98c8-ed729cda6915.png)

![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-444a3d09-b216-4fd1-ad02-7b50a701517c.png)

	最后一步，注意选自定义硬件，有些配置需要修改
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-92f29eb2-d9f1-496d-a2e7-147672bf36e3.png)

	打印机移除，然后选择“新CD/DVD”那里
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-d5340b24-7de6-49c0-a72c-b7893a6c83f2.png)

	选择“使用ISO镜像文件”，把最上面说的下载好的系统镜像文件添加上

![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-52226ade-388c-4316-a670-e2b424736de2.png)

	然后关闭，再点击“完成”即可

	开机启动vm 
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-ab95e332-0571-4767-a682-e865dd0d3bc2.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-10d44dd6-f1ad-4d3c-a7c4-055f7bae2cb7.png)

	设置密码	

![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-d358d7f8-f64d-4e95-a5dd-26af2a3ccf03.png)

	选择支持中文之外的英文
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-49281729-a618-4896-bccc-f3632ecf4da7.png)

	设置网络连接,打开网络开关
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-d075e186-b5e8-4520-9708-ce2f1f4d3c0a.png)

	创建一个用户
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-ee2284dc-adb9-43d4-a6b9-4981d3b58ba7.png)

	磁盘
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-883648fa-8180-46ae-9e51-6bbb88a250de.png)

	最后点击安装,等待重启就行了


####     二) 安装openGauss

	如果是在虚拟机上安装,需要配置一个静态的ip和网卡
  
	执行安装脚本: yum install opengauss -y

  	脚本安装完成后 切换openGauss用户 
	
	su - opengauss

  	登录数据库 gsql -d postgres -r

![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-ba705f26-2a59-49dd-a1c0-8cf3f4cb45a1.png)

	显示已经有的db: openGauss=# \l  提示需要先进行密码的修改

![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-65312ca2-bc8e-4edd-a3fb-5705a98c650a.png)

	openGauss=# ALTER ROLE opengauss PASSWORD 'xxxxxxx';

![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20230727-c8baefb0-ab32-449e-8a69-9617f2612e70.png)

	退出数据库: Ctrl+D 或 \q
	
	这样 一次安装的实践就完成了.

## 3.总结
openGauss作为一个由华为发起的开源数据库,具有性能优异、兼容MySQL、适用于OLTP等特点。相比商业闭源数据库,openGauss为用户提供了免费的使用,降低了使用成本。同时它拥有活跃的开源社区和良好的生态,使得数据库的可扩展性和兼容性都非常好。展望未来,openGauss有望在云原生数据库领域取得更大的进展。它可以结合Kubernetes等容器编排平台,实现高可用和自动化运维。还可以进行Serverless架构的改造,真正做到按需使用和弹性扩展。这些都会提升openGauss的易用性和降低使用成本。通过这个安装过程,让我对开源数据库的安装部署流程有了直接的经验。从准备环境,上传安装包,配置参数到启动服务,每一步都让我对数据库运行原理加深了理解。同时也练习了Linux系统的命令行操作。这是一次非常 Precise的学习过程。我会继续深入学习openGauss的功能特性,以及数据库运维方面的知识。
