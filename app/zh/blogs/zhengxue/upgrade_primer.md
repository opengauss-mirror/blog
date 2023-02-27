---
title: 'openGauss升级入门学习'
date: '2021-12-20'
category: 'blog'
tags: ['openGauss升级入门学习']
archives: '2021-12-20'
author: 'shirley_zhengx'
summary: 'openGauss升级入门学习'
img: '/zh/blogs/zhengxue/title/img1.png'
times: '9:30'
---

<!-- [TOC] -->

## 1. 升级前准备

**@~@ 升级前一些注意事项 @~@ **

```
1.建议在数据库系统空闲情况下进行升级，尽量避开业务繁忙的时间段（可按照经验判断，如节假日等）。
2.升级前尽可能保证数据库正常。可以通过gs_om -t status查询，查询结果的cluster_state为Normal代表数据库正常。
3.升级前保证数据库互信正常，可以在任意节点上，通过ssh hostname命令，连接另外一个节点进行验证。如果各机器间互连不用输入密码，说明互信正常（通常数据库状态正常时，互信一般都是正常的）。
4.升级前后，数据库的部署方式（配置文件）不能发生变化。升级前会对部署方式进行校验，如果改变，会报错。
5.升级前要保证操作系统处于健康状态，通过gs_checkos工具可以完成操作系统状态检查
6.数据库运行正常且主DN的数据完全同步到备DN。
7.升级需要guc参数enable_stream_replication=on，该参数为off时不允许升级。
8.若在openGauss2.1.0之前的版本中使用了MOT表，则不支持升级到openGauss2.1.0版本。
```

## 2. 升级操作

**@~@ 升级过程中一些注意事项 @~@ **

```
1.升级操作不能和扩容、缩容同时执行。
2.升级过程中，不允许对wal_level，max_connections，max_prepared_transactions，max_locks_per_transaction这四个GUC参数的值进行修改。如果修改，会导致回滚后实例启动异常。
3.升级过程中不允许打开kerberos开关。
4.请不要修改安装包中解压出来的version.cfg文件。
5.如果升级过程中出现异常导致升级失败，需用户手动回滚，并且必须回滚成功后才能进行下一次升级，下一次升级必须重新执行预安装。
6.如果升级回滚成功后，再次升级成功，未提交阶段设置的GUC参数将失效。
7.执行升级的过程中请不要手动设置GUC参数。
8.灰度升级中，升级的时候都会产生不超过10s的业务中断.
9.升级过程中，必须保持内核版本与om版本一致才可执行om操作。这里的一致是指，内核代码和om代码都来自同一个软件包。如果执行了升级包的前置脚本却没有升级，或者升级回滚后没有执行基线包的前置脚本，就会造成内核代码和om代码的不一致。
10.升级过程中如果系统表新增了字段，升级后通过\d命令将查看不到这些新增的字段。此时通过select命令可以查到这些新增的字段。
11.灰度升级中，业务并发要小于200并发读加200并发写的情况。
12.执行gs_upgradectl -t auto-upgrade 之后，没有提交之前，不能执行快照生成，即升级过程中不能执行快照生成。
```

**@~@ 升级策略 @~@ **

```
就地升级：
        升级期间需停止业务进行，一次性升级所有节点
灰度升级：
        灰度升级支持全业务操作，也是一次性升级所有节点,升级的时候都会产生不超过10s的业务中断。(openGauss1.1.0版本之后的版本支持该功能)
```

**@~@ 升级操作步骤 @~@ **

```
1.以root身份登录节点。
    创建新包目录：mkdir -p /opt/software/gaussdb_upgrade
    将需要更新的新包上传至目录“/opt/software/gaussdb_upgrade”并解压
    进入安装包解压出的script目录下:
    cd /opt/software/gaussdb_upgrade/script
2.在就地升级或灰度升级前执行前置脚本gs_preinstall
    ./gs_preinstall -U omm -G dbgrp  -X /opt/software/GaussDB_Kernel/clusterconfig.xml
3.切换至omm用户,执行升级命令
    su - omm
    source gauss_env
    数据库状态正常时，使用如下命令进行就地升级或者灰度升级
    示例一：使用gs_upgradectl脚本执行就地升级。
    gs_upgradectl -t auto-upgrade -X /opt/software/GaussDB_Kernel/clusterconfig.xml
    示例二：使用gs_upgradectl脚本执行灰度升级。
    gs_upgradectl -t auto-upgrade -X /opt/software/GaussDB_Kernel/clusterconfig.xml --grey
4.回滚
    如果不想升级，或者升级失败，执行回滚命令
    gs_upgradectl -t auto-rollback -X /opt/software/GaussDB_Kernel/clusterconfig.xml

    Notes:回滚之后，如果想再次升级，需从预安装开始
5.提交
    gs_upgradectl -t auto-commit -X /opt/software/GaussDB_Kernel/clusterconfig.xml

    Notes:提交之后，不能回滚

```

**@~@ 升级过程出现的问题 @~@ **

```
1.升级步骤中预安装gs_preinstall出错
    问题：报错安装目录不为空
    原因：om预安装如果没有环境变量分离，环境变量会默认写预安装-U参数后面的用户的/home/omm/.bashrc。旧包中环境变量分离，因此会将环境变量写入用户指定的文件中，而当新包升级步骤中预安装没有环境变量分离，系统会自动去找用户下面的/home/omm/.bashrc，此时这里没有GAUSS_ENV变量，环境默认此次预安装是第一次，预安装会检查如果是第一次预安装则安装目录必须为空，但是在旧包安装的时候，安装目录就已经有东西，因此此时会报错。
    解决：如果旧包预安装的时候环境变量分离，升级步骤中的预安装操作也必须要环境变量分离，这样就可以在用户指定的环境变量文件中发现参数是GAUSS_ENV=1，此时可继续执行预安装。

2.gs_upgradectl出错
    问题：新包和旧包commitID一样
       Failed to upgrade strategy: New cluster commitid cannot be same with old cluster commitid
    原因：包有问题，新包没有最新的提交
    解决：检车并替换新包

3.gs_upgradectl -t auto-upgrade
    问题：升级执行未提交状态，快照无法生成
    原因：内核快照线程会判断upgrade_mode这个参数，如果upgrade_mode!=0,也就是在升级过程中，快照线程防止数据错误，所欲会退出线程，不生成快照

4.升级过程中开发线程池参数，导致升级失败
    问题：enable_thread_pool=on,灰度升级时报错
    原因：线程池开启的情况下，用于主备复制的端口只能是数据库监听端口+1。监听端口号即postgresql.conf里面的replconninfoX对应的localport(localport = port + 1)。如果线程池模式开启的情况下，localport不是port+1得到，日志会报错replication should connect HA port in thread pool。
    解决：开启线程池，就将localport设置为port + 1，如果线程池关闭，则localport可以设置为其他数字

```

## 3. 升级后

**@~@ 一些注意事项 @~@ **

```
1.查看数据库状态是否正常
    gs_om -t status --detail
2.连接数据库，测试新增功能是否支持
```

## 4. 升级脚本介绍

**重要提示**:

升级过程通过执行升级 sql 脚本实现系统表变更，这些脚本必须由开发人员在修改系统表的同时一并提供升级 sql 脚本，请将这些脚本代码提交至 openGauss-server/src/include/catalog/upgrade_sql 目录下，该目录结构如下所示。

### 1.1.升级目录介绍

```
src/include/catalog/upgrade_sql/
├── upgrade_catalog_maindb/                  -- 1.存放在首个数据库上执行的系统表变更sql文件（一般指postgres数据库）
	│├── upgrade_catalog_maindb_92_308.sql        -- 前置脚本
	│├── upgrade-post_catalog_maindb_92_308.sql   -- 后置脚本
├── upgrade_catalog_otherdb/                 -- 2.存放其它数据库系统上执行的系统表变更sql文件（一般指除postgres数据库之外的数据库）
	│├── upgrade_catalog_otherdb_92_308.sql       -- 前置脚本
	│├── upgrade-post_catalog_otherdb_92_308.sql  -- 后置脚本
├── rollback_catalog_maindb/                 -- 3.存放在首个数据库上执行的系统表变更失败回退所用sql文件
	│├── rollback_catalog_maindb_92_308.sql
	│├── rollback-post_catalog_maindb_92_308.sql
├── rollback_catalog_otherdb/                -- 4.存放其它数据库系统上执行的系统表变更失败回退所用sql文件
	│├── rollback_catalog_otherdb_92_308.sql
	│├── rollback-post_catalog_otherdb_92_308.sql
├── check_upgrade/                           -- 5.存放系统表变更完成之后校验变更是否成功的sql文件
	│├── check_upgrade_67_014.sql


```

<**问题集合**>

- 目录中的 5 类脚本分别是什么？

​ 第 1、第 2 类脚本是系统表变更脚本，第 3、第 4 类脚本是系统表变更的回退脚本，第 5 类是系统表变更的检查脚本，检查脚本由开发根据需要提交。

​ **切记切记切记！！！** 前 4 类必须要有

- 前置脚本和后置脚本的区别？

​ 执行对象不同，前置脚本在旧版本数据库上执行，后置脚本在新版本上执行

- 变更和回退脚本都各有两类，一类是 maindb，一类是 otherdb？

​ 是因为当要创建共享系统表或共享对象时，我们只需要在对第一个库执行变更脚本的过程中创建物理表文件或共享对象即可。我们通过 GUC 参数控制是否创建共享系统表的物理文件；我们只在第一个库的系统表变更脚本中添加共享对象的创建语句。因此，对于第一个库（maindb）和剩余的库（otherdb），系统表变更脚本会略有不同。除此以外，没有其它差别。对于回退脚本，亦是如此。

### 1.2.升级脚本文件命名规则

- 类型前缀为 upgrade_catalog_maindb、upgrade_catalog_oterdb、rollback_catalog_maindb、rollback_catalog_otherdb、check_upgrade、upgrade-post_catalog_maindb、upgrade-post_catalog_oterdb、rollback-post_catalog_maindb、rollback-post_catalog_otherdb 之一

- 脚本类型后缀是(文件 version.cfg 内核版本号的整数位)\_(文件 version.cfg 内核版本号的小数位).sql

  ```
  例如：文件version.cfg内容
       2.0.0                  --写入发布版本号
       92.298                 --内核版本号
       68362709               --最后一次提交号
  ```

  ```
  脚本命名：upgrade_catalog_maindb_92_298.sql
  ```

<**问题集合**>

- 想一想文件 version.cfg 从何而来？

  很神奇的是从内核源码打包生成 verion.cfg 文件。version.cfg 为开发合入本次代码之后的产品版本号，存在 build/script/package_internal.sh 的 read_mpp_version()函数中。

  < **不容易看到的额外扩展哦！！！**>：打包主要过程为 build.sh ---> package_internal.sh ---> read_mpp_version[写入发布版本号 2.0.0] ---> read_mpp_number[写入内核版本号 92.298] --->

- 什么时候 version.cfg 的内核版本号会修改？

​ 如果开发本次合入的代码不涉及系统表修改，那么不用修改内核版本号，继而打包的时候 version.cfg 文件中的内核版本号也不会改变；
​ 如果开发本次合入的代码修改了系统表，并且遵循升级约束，那么需要修改内核版本号(在内核源码中对内核版本号数值增加 0.001)，继而打包的时候 version.cfg 的数值会被修改，同时，请提交上述至少 4 类的系统表变更和回退脚本，打包的时候会以新的 version.cfg 来进行命名。

​ < **思维很混乱，需要急救，那开发到底需要做些什么呢！！！**>：如果开发本次合入的代码不涉及系统表修改，那么开发会很窃喜，因为什么都不用做@开发者。如果开发本次合入的代码修改了系统表，开发者可得长点心了，天降大任于你，必先使其暴跳如雷。此时是需要适配升级的，主要要做三件事，第 1，修改内核版本号，第 2，添加升级脚本，第 3，验证升级。

​ 预知更多，突破自己，请看下节分享-----------内核版本号

---

## 5.升级版本控制

### 5.1.内核版本号

在 openGauss-server/src/backend/utils/init/globals.cpp 中，定义常量 GRAND_VERSION_NUM 的定义值，该版本号标示内核代码实际对应的版本，该版本号为 uint32 型。

**￥-￥- 敲黑板，划重点啦@新秀开发者 -￥-￥**

首先，gaussdb 进程运行中，有一个全局变量 WorkingGrandVersionNum，用于标志 gaussdb 进程实际应该遵循的版本行为。

在正常情况下， WorkingGrandVersionNum 等于 GRAND_VERSION_NUM，

在升级过程中， WorkingGrandVersionNum 等于老版本的版本号（此时，应小于或等于新版本的 GRAND_VERSION_NUM ）。对于每一个后台线程，在启动时会将当时的 WorkingGrandVersionNum 赋值给 t_thrd.proc->workingVersionNum，表示数据库当前运行版本是什么。

<**后期通过内核代码详解版本号，这里会有新发现，敬请关注 shirley_zhengx**>

### 5.2 内核版本号前向兼容

内核版本号用于内核前向兼容时使用。主要使用的方法和场景如下：
1、**给系统表新增列**：假设包版本 2.0.0(内核版本号 29.298)，在 2.0.1 版本中（内核版本号 29.299）在系统表 pg_authid 后新增 1 列 parentid，通过 heap_open 和 heap_getattr 函数读取新增的列，如下 GetUserDataFromCatalog 函数中：

```c
/* Before GrandVersionNum 29298, pg_authid does not have following columns */
if (t_thrd.proc->workingVersionNum >= 29298) {
    Datum authidparentidDatum = heap_getattr(tup, Anum_pg_authid_rolparentid), pg_authid_des, &isNull);
}
```

2、**新增系统表**：通过内核版本号来避免在老版本模式下对新增系统的访问。例如新版本开发的定时任务功能中新增 pg_job 系统表，在老版本模式下，我们需要通过禁止定时任务特性的开启，以避免对新增系统表的访问。

```c
/* Before GrandVersionNum 29298, we do not support scheduled job */
if (IS_PGXC_COORDINATOR && PgJobSchdPID == 0 && pmState == PM_RUN && (job_queue_processes||start_job_scheduler) && t_thrd.proc->workingVersionNum >= 29298) {
    PgJobSchdPID = StartJobScheduler();
    if (PgjobSchdPID != 0) {
        start_job_scheduler = false;
        elog(LOG, "job scheduler started, pid=%lu", PgJobSchdPID)
    }
```

- [ ] **武林秘笈之内核版本号**：内核版本号保证新增系统表修改的前向兼容性

## 6.系统表变更--升级脚本撰写

麻烦小伙伴们移步至 shirley_zhengx 先生呕心沥血的升级脚本撰写：[升级脚本撰写](https://opengauss.org/zh/blogs/blogs.html?post/zhengxue/upgrade_script/)

**@~@ 一些注意事项 @~@ **
