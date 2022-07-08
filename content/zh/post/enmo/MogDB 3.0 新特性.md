+++

title = "MogDB 3.0 新特性" 

date = "2022-06-27" 

tags = ["MogDB 3.0 新特性"] 

archives = "2022-06" 

author = "云和恩墨" 

summary = "MogDB 3.0 新特性"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# MogDB 3.0 新特性

本文出处：[https://www.modb.pro/db/418412](https://www.modb.pro/db/418412)

## 1. 版本说明

MogDB 3.0.0版本于2022年6月30日发布。3.0.0版本基于2.1版本进一步增强，并合入了openGauss 3.0.0版本的新增特性。

## 2. 新增特性

### 2.1 集成openGauss 3.0.0版本新增特性

- 行存转向量化
- 延迟进入最大可用模式
- 并行逻辑解码
- CM（Cluster Manager）
- global syscache
- 发布订阅
- 外键锁增强
- 行存表压缩
- Data Studio工具开源
- MySQL到openGauss的迁移工具chameleon
- 支持使用中间件shardingSphere构建分布式数据库
- 支持kubernetes部署分布式数据库
- 支持ANY权限管理
- DBMind组件化
- 库内AI算法支持XGBoost、multiclass和PCA

### 2.2 Cluster Manager （CM）

- 提供了数据库主备的状态监控、网络通信故障监控、文件系统故障监控能力；
- 提供了故障时自动主备切换能力；
- 使用Paxos算法来进行多数派投票，选主；
- 要求至少有三台服务器安装CM组件；
- 数据库服务器可以是一主一备两台机器。

### 2.3 性能增强

#### 2.3.1 事务异步提交

- 将事务执行和事务日志落盘拆分为CPU bound和IO bound两个阶段，分别由不同线程执行，避免执行IO操作时，CPU资源闲置，进而提升CPU资源利用率；
- 事务异步提交的优化，可以让事务吞吐量提升20%-50%，TPCC整体性能提升10%~20%；

#### 2.3.2 日志持久化优化

- 提高高数据更新负载下执行性能，降低执行延迟。

#### 2.3.3 索引并行创建并行度定义

- MogDB额外提供了参数控制并行度，可以手动制定并行度，更加灵活

#### 2.3.4 COPY导入SIMD加速

- 利用CPU的指令集，对COPY命令中的数据解析阶段进行加速，进而提升COPY导入性能；（目前仅限x86 CPU）

#### 2.3.5 动态分区裁剪

- 新增支持了动态分区裁减。在prepare-execute执行方式，以及分区约束表达式中包含子查询的场景下，在执行阶段根据参数或子查询结果对分区进行裁减，提升分区表查询性能；

### 2.4 故障诊断

#### 2.4.1 监控Session级别SQL运行状态

- 对Session级别SQL运行状态进行收集执行计划树并动态采样执行算子

#### 2.4.2 OM故障诊断能力增强

- gstrace增强：通过增加模块切换（component switch）来获得更有针对性的执行路径，用于提升debug效率。
- gs_check增强：原有的场景检查基础上，实现检测结果保存，以及对不同时间做的两个检测结果进行差异比较。
- gs_watch：当MogDB发生故障时，使用此工具收集OS信息、日志信息以及配置文件等信息，来定位问题。
- gs_gucquery：实现MogDB GUC值自动收集整理导出和差异比较。

### 2.5 兼容性增强

#### 2.5.1 Oracle兼容增强

- 更多函数支持，更多内置包支持：dbms_random, dbms_lob, dbms_metadata等
- 支持connect by语法
- 降低Oracle应用迁移到MogDB的代码修改量。

#### 2.5.2 MySQL兼容增强

- 更多语法支持：timestamp on update等；更多数据类型兼容；更多函数兼容
- 降低迁移MySQL应用到MogDB的代码修改量。

#### 2.5.3 PostgreSQL兼容增强

##### 2.5.3.1 新增BRIN INDEX（PostgreSQL 9.5开始支持）

- 数据块范围的索引，相比于精准的BTREE索引，BRIN INDEX提供了一个以较小空间消耗获得一个相对较快查询速度的平衡
- 1GB的表，无索引，查询单条4s；BTREE索引200MB空间，查询4ms；BRIN索引800K，查询58ms；

##### 2.5.3.2 新增BLOOM INDEX（PostgreSQL 9.6开始支持）

- 布隆过滤：真的不一定为真，假的一定为假；存在误算率，需要recheck（算法实现，不是要用户recheck）
- 适用于表中拥有大量字段，而且查询条件也可能会使用大量字段的组合；仅支持等值查询
- 普通索引应对此类场景，需要创建多个索引，对于空间占用和插入更新速度都会有较大影响
- 此时可以在所有这些可能用于查询的字段上统一创建一个BLOOM索引，获得空间和查询速度的平衡，10GB表的扫描可以1s左右完成

## 3. 修复缺陷

### 3.1 集成openGauss 3.0.0版本修复缺陷

- [I4VUXG](https://gitee.com/opengauss/openGauss-server/issues/I4VUXG?from=project-issue) 修复unlogged table 数据丢失问题
- [I4SF5P](https://gitee.com/opengauss/openGauss-server/issues/I4SF5P?from=project-issue) release版本编译安装数据库，且dblink模块编译安装后，create extension dblink导致数据库core
- [I4S74D](https://gitee.com/opengauss/openGauss-server/issues/I4S74D?from=project-issue) 使用Jmeter工具向行存压缩表插入数据，数据量1G以上时必现失败（5/5），compresstype=2
- [I4N81J](https://gitee.com/opengauss/openGauss-server/issues/I4N81J?from=project-issue) update/delete操作无法同步到订阅端
- [I4YPJQ](https://gitee.com/opengauss/openGauss-server/issues/I4YPJQ?from=project-issue) Inserting varchar constant into MOT table using JDBC fails
- [I4PF6G](https://gitee.com/opengauss/openGauss-server/issues/I4PF6G?from=project-issue) 外键锁增强-2.0.0.灰度升级至2.2.0不提交，执行tpcc失败
- [I4WPD1](https://gitee.com/opengauss/openGauss-server/issues/I4WPD1?from=project-issue) 简化安装模块获取安装包后解压openGauss-2.1.0-CentOS-64bit.tar.bz2缺少simpleinstall目录 无法执行极简安装
- [I4L268](https://gitee.com/opengauss/openGauss-server/issues/I4L268?from=project-issue) 分区表多次truncate后，再进行vacuum freeze pg_partition，系统表pg_partition索引不准确
- [I3HZJN](https://gitee.com/opengauss/openGauss-server/issues/I3HZJN?from=project-issue) copy命令DATE_FORMAT缺少时分秒时，未按格式复制
- [I4HUXD](https://gitee.com/opengauss/openGauss-server/issues/I4HUXD?from=project-issue) jsonb类型查询报错
- [I4QDN9](https://gitee.com/opengauss/openGauss-server/issues/I4QDN9?from=project-issue) select 1.79E +308*2,cume_dist() over(order by 1.0E128*1.2)返回超出范围
- [I4PAVO](https://gitee.com/opengauss/openGauss-server/issues/I4PAVO?from=project-issue) start with connect by record子查询识别失败
- [I4UY9A](https://gitee.com/opengauss/openGauss-server/issues/I4UY9A?from=project-issue) opengauss列表分区创建default分区失败
- [I4W3UB](https://gitee.com/opengauss/openGauss-server/issues/I4W3UB?from=project-issue) 创建并使用自定义类型创建视图，重命名该自定义类型后，无法获取视图定义
- [I4WRMX](https://gitee.com/opengauss/openGauss-server/issues/I4WRMX?from=project-issue) 重启数据库且enable_stmt_track参数关闭时，查询statement_history表记录应该无记录，实际有记录，statement_history表的数据未清空
- [I4WOBH](https://gitee.com/opengauss/openGauss-server/issues/I4WOBH?from=project-issue) GUC设置pagewriter_sleep为360000后恢复默认值2000，重启库失败

## 4. 兼容性

本版本支持以下操作系统及CPU架构组合：

| 操作系统              | CPU架构                                       |
| :-------------------- | :-------------------------------------------- |
| CentOS 7.x            | X86_64（Intel，AMD，海光，兆芯）              |
| Redhat 7.x            | X86_64（Intel，AMD，海光，兆芯）              |
| openEuler 20.03LTS    | ARM（鲲鹏）、X86_64（Intel，AMD，海光，兆芯） |
| 银河麒麟V10           | ARM（鲲鹏）、X86_64（Intel，AMD，海光，兆芯） |
| 统信UOS V20-D / V20-E | ARM（鲲鹏）、X86_64（Intel，AMD，海光，兆芯） |
| 统信UOS V20-A         | X86_64（Intel，AMD，海光，兆芯）              |
