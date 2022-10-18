# openGauss的WDR报告解读

本文出处：[https://www.modb.pro/db/500742](https://www.modb.pro/db/500742)

在Oralce数据库中，遇到性能问题，我们通常会查看有无对应时间段的快照，生成awr报告并进一步分析（AWR是Automatic Workload Repository的简称，中文叫着自动工作量资料档案库。是Oracle数据库用于收集、管理和维护数据库整个运行期间和性能相关统计数据的存储仓库，是Oracle数据库性能调整和优化的基础。awr收集到的数据会被定期保存到磁盘，可以从数据字典查询以及生成性能报告。）。AWR报告整个数据库在运行期间的现状或者说真实状态只有在被完整记录下来，才是可查，可知，可比较，可推测或者说为未来性能优化调整提供支撑建议的基础。

在opengauss数据库中，也有着这样的“awr”，它叫做——wdr。WDR是(Workload Diagnosis Report)负载诊断报告，是openGauss的工作负载诊断报告，常用于判断openGauss长期性能问题。

# 前提：

生成WDR报告的前提条件是，打开参数enable_wdr_snapshot。确认当前已按照的openGauss数据库是否打开WDR报告的参数，需要通过下图登录数据库进行查询。enable_wdr_snapshot的值为on表示打开，off表示关闭
