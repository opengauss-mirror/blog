---
title: 'MogDB 3.0 新特性'

date: '2022-06-27'

category: 'blog'
tags: ['MogDB 3.0 新特性']

archives: '2022-06'

author: '云和恩墨'

summary: 'MogDB 3.0 新特性'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# MogDB 3.0 新特性

本文出处：[https://www.modb.pro/db/418412](https://www.modb.pro/db/418412)

## 1. 版本说明

MogDB 3.0.0 版本于 2022 年 6 月 30 日发布。3.0.0 版本基于 2.1 版本进一步增强，并合入了 openGauss 3.0.0 版本的新增特性。

## 2. 新增特性

### 2.1 集成 openGauss 3.0.0 版本新增特性

- 行存转向量化
- 延迟进入最大可用模式
- 并行逻辑解码
- CM（Cluster Manager）
- global syscache
- 发布订阅
- 外键锁增强
- 行存表压缩
- Data Studio 工具开源
- MySQL 到 openGauss 的迁移工具 chameleon
- 支持使用中间件 shardingSphere 构建分布式数据库
- 支持 kubernetes 部署分布式数据库
- 支持 ANY 权限管理
- DBMind 组件化
- 库内 AI 算法支持 XGBoost、multiclass 和 PCA

### 2.2 Cluster Manager （CM）

- 提供了数据库主备的状态监控、网络通信故障监控、文件系统故障监控能力；
- 提供了故障时自动主备切换能力；
- 使用 Paxos 算法来进行多数派投票，选主；
- 要求至少有三台服务器安装 CM 组件；
- 数据库服务器可以是一主一备两台机器。

### 2.3 性能增强

#### 2.3.1 事务异步提交

- 将事务执行和事务日志落盘拆分为 CPU bound 和 IO bound 两个阶段，分别由不同线程执行，避免执行 IO 操作时，CPU 资源闲置，进而提升 CPU 资源利用率；
- 事务异步提交的优化，可以让事务吞吐量提升 20%-50%，TPCC 整体性能提升 10%~20%；

#### 2.3.2 日志持久化优化

- 提高高数据更新负载下执行性能，降低执行延迟。

#### 2.3.3 索引并行创建并行度定义

- MogDB 额外提供了参数控制并行度，可以手动制定并行度，更加灵活

#### 2.3.4 COPY 导入 SIMD 加速

- 利用 CPU 的指令集，对 COPY 命令中的数据解析阶段进行加速，进而提升 COPY 导入性能；（目前仅限 x86 CPU）

#### 2.3.5 动态分区裁剪

- 新增支持了动态分区裁减。在 prepare-execute 执行方式，以及分区约束表达式中包含子查询的场景下，在执行阶段根据参数或子查询结果对分区进行裁减，提升分区表查询性能；

### 2.4 故障诊断

#### 2.4.1 监控 Session 级别 SQL 运行状态

- 对 Session 级别 SQL 运行状态进行收集执行计划树并动态采样执行算子

#### 2.4.2 OM 故障诊断能力增强

- gstrace 增强：通过增加模块切换（component switch）来获得更有针对性的执行路径，用于提升 debug 效率。
- gs_check 增强：原有的场景检查基础上，实现检测结果保存，以及对不同时间做的两个检测结果进行差异比较。
- gs_watch：当 MogDB 发生故障时，使用此工具收集 OS 信息、日志信息以及配置文件等信息，来定位问题。
- gs_gucquery：实现 MogDB GUC 值自动收集整理导出和差异比较。

### 2.5 兼容性增强

#### 2.5.1 Oracle 兼容增强

- 更多函数支持，更多内置包支持：dbms_random, dbms_lob, dbms_metadata 等
- 支持 connect by 语法
- 降低 Oracle 应用迁移到 MogDB 的代码修改量。

#### 2.5.2 MySQL 兼容增强

- 更多语法支持：timestamp on update 等；更多数据类型兼容；更多函数兼容
- 降低迁移 MySQL 应用到 MogDB 的代码修改量。

#### 2.5.3 PostgreSQL 兼容增强

##### 2.5.3.1 新增 BRIN INDEX（PostgreSQL 9.5 开始支持）

- 数据块范围的索引，相比于精准的 BTREE 索引，BRIN INDEX 提供了一个以较小空间消耗获得一个相对较快查询速度的平衡
- 1GB 的表，无索引，查询单条 4s；BTREE 索引 200MB 空间，查询 4ms；BRIN 索引 800K，查询 58ms；

##### 2.5.3.2 新增 BLOOM INDEX（PostgreSQL 9.6 开始支持）

- 布隆过滤：真的不一定为真，假的一定为假；存在误算率，需要 recheck（算法实现，不是要用户 recheck）
- 适用于表中拥有大量字段，而且查询条件也可能会使用大量字段的组合；仅支持等值查询
- 普通索引应对此类场景，需要创建多个索引，对于空间占用和插入更新速度都会有较大影响
- 此时可以在所有这些可能用于查询的字段上统一创建一个 BLOOM 索引，获得空间和查询速度的平衡，10GB 表的扫描可以 1s 左右完成

## 3. 修复缺陷

### 3.1 集成 openGauss 3.0.0 版本修复缺陷

- [I4VUXG](https://gitee.com/opengauss/openGauss-server/issues/I4VUXG?from=project-issue) 修复 unlogged table 数据丢失问题
- [I4SF5P](https://gitee.com/opengauss/openGauss-server/issues/I4SF5P?from=project-issue) release 版本编译安装数据库，且 dblink 模块编译安装后，create extension dblink 导致数据库 core
- [I4S74D](https://gitee.com/opengauss/openGauss-server/issues/I4S74D?from=project-issue) 使用 Jmeter 工具向行存压缩表插入数据，数据量 1G 以上时必现失败（5/5），compresstype=2
- [I4N81J](https://gitee.com/opengauss/openGauss-server/issues/I4N81J?from=project-issue) update/delete 操作无法同步到订阅端
- [I4YPJQ](https://gitee.com/opengauss/openGauss-server/issues/I4YPJQ?from=project-issue) Inserting varchar constant into MOT table using JDBC fails
- [I4PF6G](https://gitee.com/opengauss/openGauss-server/issues/I4PF6G?from=project-issue) 外键锁增强-2.0.0.灰度升级至 2.2.0 不提交，执行 tpcc 失败
- [I4WPD1](https://gitee.com/opengauss/openGauss-server/issues/I4WPD1?from=project-issue) 简化安装模块获取安装包后解压 openGauss-2.1.0-CentOS-64bit.tar.bz2 缺少 simpleinstall 目录 无法执行极简安装
- [I4L268](https://gitee.com/opengauss/openGauss-server/issues/I4L268?from=project-issue) 分区表多次 truncate 后，再进行 vacuum freeze pg_partition，系统表 pg_partition 索引不准确
- [I3HZJN](https://gitee.com/opengauss/openGauss-server/issues/I3HZJN?from=project-issue) copy 命令 DATE_FORMAT 缺少时分秒时，未按格式复制
- [I4HUXD](https://gitee.com/opengauss/openGauss-server/issues/I4HUXD?from=project-issue) jsonb 类型查询报错
- [I4QDN9](https://gitee.com/opengauss/openGauss-server/issues/I4QDN9?from=project-issue) select 1.79E +308*2,cume_dist() over(order by 1.0E128*1.2)返回超出范围
- [I4PAVO](https://gitee.com/opengauss/openGauss-server/issues/I4PAVO?from=project-issue) start with connect by record 子查询识别失败
- [I4UY9A](https://gitee.com/opengauss/openGauss-server/issues/I4UY9A?from=project-issue) opengauss 列表分区创建 default 分区失败
- [I4W3UB](https://gitee.com/opengauss/openGauss-server/issues/I4W3UB?from=project-issue) 创建并使用自定义类型创建视图，重命名该自定义类型后，无法获取视图定义
- [I4WRMX](https://gitee.com/opengauss/openGauss-server/issues/I4WRMX?from=project-issue) 重启数据库且 enable_stmt_track 参数关闭时，查询 statement_history 表记录应该无记录，实际有记录，statement_history 表的数据未清空
- [I4WOBH](https://gitee.com/opengauss/openGauss-server/issues/I4WOBH?from=project-issue) GUC 设置 pagewriter_sleep 为 360000 后恢复默认值 2000，重启库失败

## 4. 兼容性

本版本支持以下操作系统及 CPU 架构组合：

| 操作系统               | CPU 架构                                      |
| :--------------------- | :-------------------------------------------- |
| CentOS 7.x             | X86_64（Intel，AMD，海光，兆芯）              |
| Redhat 7.x             | X86_64（Intel，AMD，海光，兆芯）              |
| openEuler 20.03LTS     | ARM（鲲鹏）、X86_64（Intel，AMD，海光，兆芯） |
| 银河麒麟 V10           | ARM（鲲鹏）、X86_64（Intel，AMD，海光，兆芯） |
| 统信 UOS V20-D / V20-E | ARM（鲲鹏）、X86_64（Intel，AMD，海光，兆芯） |
| 统信 UOS V20-A         | X86_64（Intel，AMD，海光，兆芯）              |
