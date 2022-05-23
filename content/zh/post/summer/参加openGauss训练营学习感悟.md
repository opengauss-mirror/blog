+++

title = "参加openGauss训练营学习"

date = "2020-05-18"

tags = ["参加openGauss训练营学习"]

archives = "2022-05"

author = "夏日晴空"

summary = "参加openGauss训练营学习"

img = "/zh/post/xingchen/title/title.jpg"

times = "17:30"

+++
周末参加了由 openGauss 社区、Gauss 松鼠会、云和恩墨联合主办的 “8小时玩转 openGauss 训练营” 第三期培训！受益匪浅！
从学习中我们了解到openGauss是一款全面友好开放，携手伙伴共同打造的企业级开源关系型数据库。openGauss提供面向多核架构的极致性能、全链路的业务、数据安全、基于AI的调优和高效运维的能力。openGauss深度融合华为在数据库领域多年的研发经验，结合企业级场景需求，持续构建竞争力特性。
聊一下openGauss的关键特性吧。

一、openGauss 执行引擎

关系数据库本身是对关系集合Relation的运算操作，执行引擎作为运算的控制逻辑主要是围绕着关系运算来实现的，算子可以分成以下几类：

1. 扫描算子（Scan Plan Node）

扫描节点负责从底层数据来源抽取数据，数据来源可能是来自文件系统，也可能来自网络。一般而言扫描节点都位于执行树的叶子节点，作为执行的数据输入来源，典型代表SeqScan、IndexScan、SubQueryScan

关键特征：输入数据、叶子节点、表达式过滤

2. 控制算子（Control Plan Node）

控制算子一般不映射代数运算符，是为了执行器完成一些特殊的流程引入的算子，例如Limit、RecursiveUnion、Union

关键特征：用于控制数据流程

3. 物化算子（Materialize Plan Node）

物化算子一般指算法要求，在做算子逻辑处理的时候，要求把下层的数据进行缓存处理，因为对于下层算子返回的数据量不可提前预知，因此需要在算法上考虑数据无法全部放置到内存的情况，例如Agg、Sort

关键特征：需要扫描所有数据之后才返回

4. 连接算子（Join Plan Node）

这类算子是为了应对数据库中最常见的关联操作，根据处理算法和数据输入源的不同分成MergeJoin,SortJoin,HashJoin。

关键特征：多个输入

二、openGauss 存储引擎

当前openGauss存储引擎有以下3种：
（1） 行存储引擎。主要面向OLTP（online transaction processing，在线交易处理）场景设计，例如订货发货，银行交易系统。
（2） 列存储引擎。主要面向OLAP场景设计，例如数据统计报表分析。
（3） 内存引擎。主要面向极致性能场景设计，例如银行风控场景。

三、openGauss 查询优化

物理优化的技术点：

1、统计信息模型 Table/Column-Level statistics

描述基表数据的特征包括唯一值、MCV值等，用于行数估算

2、行数估算 Row Estimation

估算基表baserel、Join中间结果集joinrel、Aggregation中结果集大小，为代价估算做准备

3. 代价估算 Cost Estimation

根据数据量估算不同算子执行代价，各算子代价之和即为计划总代价

4. 路径搜索 Access Path Generation

通过求解路径最优算法（e.g. 动态规划、遗传算法）处理连接路径搜索过程，以最小搜索空间找到最优连接路径
\ No newline at end of file