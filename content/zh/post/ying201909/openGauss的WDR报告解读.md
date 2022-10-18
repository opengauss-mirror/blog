+++

title = "openGauss的WDR报告解读" 

date = "2022-10-18" 

tags = ["我和openGauss的故事", "openGauss"]

archives = "2022-10" 

author = "怕晒的太阳" 

summary = "openGauss的WDR报告解读"

img = "/zh/post/ying201909/title/img.png" 

times = "10:15"

+++

# openGauss的WDR报告解读

本文出处：[https://www.modb.pro/db/500742](https://www.modb.pro/db/500742)

在Oralce数据库中，遇到性能问题，我们通常会查看有无对应时间段的快照，生成awr报告并进一步分析（AWR是Automatic Workload Repository的简称，中文叫着自动工作量资料档案库。是Oracle数据库用于收集、管理和维护数据库整个运行期间和性能相关统计数据的存储仓库，是Oracle数据库性能调整和优化的基础。awr收集到的数据会被定期保存到磁盘，可以从数据字典查询以及生成性能报告。）。AWR报告整个数据库在运行期间的现状或者说真实状态只有在被完整记录下来，才是可查，可知，可比较，可推测或者说为未来性能优化调整提供支撑建议的基础。

在opengauss数据库中，也有着这样的“awr”，它叫做——wdr。WDR是(Workload Diagnosis Report)负载诊断报告，是openGauss的工作负载诊断报告，常用于判断openGauss长期性能问题。

# 前提：

生成WDR报告的前提条件是，打开参数enable_wdr_snapshot。确认当前已按照的openGauss数据库是否打开WDR报告的参数，需要通过下图登录数据库进行查询。enable_wdr_snapshot的值为on表示打开，off表示关闭

**以下介绍WDR报告的参数：**

| 序号 | 参数                          | 参数说明                                                                          | 取值范围                                                 |
|----|-----------------------------|-------------------------------------------------------------------------------|------------------------------------------------------|
| 1  | enable_wdr_snapshot         | 是否开启数据库监控快照功能                                                                 | 取值范围：布尔型 on: 打开数据库监控快照功能。 off: 关闭数据库监控快照功能。 默认值: off |
| 2  | wdr_snapshot_interval       | 后台线程Snapshot自动对数据库监控数据执行快照操作的时间间隔                                             | 取值范围: 整型，10～60（分钟） 默认值: 1h                           |
| 3  | wdr_snapshot_query_timeout  | 系统执行数据库监控快照操作时，设置快照操作相关的sql语句的执行超时时间。如果语句超过设置的时间没有执行完并返回结果，则本次快照操作失败          | 取值范围: 整型，100～INT_MAX（秒） 默认值: 100s                    |
| 4  | wdr_snapshot_retention_days | 系统中数据库监控快照数据的保留天数，超过设置的值之后，系统每隔wdr_snapshot_interval时间间隔，清理snapshot_id最小的快照数据 | 取值范围: 整型，1～8 默认值: 8                                  |

# 操作步骤：

- 1.执行以下SQL命令,查询已经生成的快照信息。

    ```
    select * from snapshot.snapshot;
    ```

    - snapshot.snapshot 【记录当前系统中存储的WDR快照信息】

- 2.生成WDR报告。执行如下步骤，生成节点node级别wdr报告。

    - 1）查询 pgxc_node_name参数值，或者使用查询视图：pg_node_env。

    - 2） \a \t \o 服务器文件路径生成格式化性能报告

    ```
    \a \t \o /home/opengauss/wdrTest.html
    ```

    **上述命令涉及参数说明如下：**

    ```
    \a：切换非对齐模式。
    \t：切换输出的字段名的信息和行计数脚注。
    \o：把所有的查询结果发送至服务器文件里。
    服务器文件路径：生成性能报告文件存放路径。用户需要拥有此路径的读写权限。
    ```

    **如果不退出当前登录gsql客户端，进行执行其他SQL，关闭格式化输出命令：**

    ```
    \o \a \t
    ```

- 3）向性能报告wdrTest.html中写入数据，从snapshot.snapshot视图中选取要生成WDR报告的时间点。例如：127和128两个时间点。

    ```
    gsql -d postgres -p 6000 -r -c"select generate_wdr_report(快照id1,快照id2,‘all’,‘node’,‘pgxc_node_name参数值’);"
   
    select generate_wdr_report(127,128,'all','node','dn_6001');
    ```

    **函数说明：generate_wdr_report**

    > **语法:**
    >
    > select generate_wdr_report(begin_snap_id bigint, end_snap_id bigint, report_type cstring, report_scope cstring, node_name cstring);
    >
    > **选项：**
    >
    > begin_snap_id：查询时间段开始的snapshot的id（表snapshot.snaoshot中的snapshot_id）
    >
    > end_snap_id： 查询时间段结束snapshot的id。默认end_snap_id大于begin_snap_id（表snapshot.snaoshot中的snapshot_id）
    >
    > report_type： 指定生成report的类型。例如，summary/detail/all，其中：summary\[汇总数据\]/detail\[明细数据\]/all\[包含summary和detail\]
    >
    > report_scope： 指定生成report的范围，可以为cluster或者node，其中：cluster是数据库级别的信息，node是节点级别的信息。
    >
    > node_name： 当report_scope指定为node时，需要把该参数指定为对应节点的名称。当report_scope为cluster时，该值可以省略或者指定为空或NULL。node[节点名称]、cluster[省略/空/NULL]

4)目录下生成对应的wdr报告，cd /home/opegauss生成报告的指定路径进行查看。



3.手工创建快照信息
当在openGauss数据库执行性能测试，数据库默认每小时自动执行一次snapshot操作。生成指定时间段内的WDR报告，查询快照视图后选取指定开始时间的快照id，结束时间的快照id。通过函数generate_wdr_report生成wdr报告。但是有些情况，固定时间段的WDR报告，就需要使用具有sysadmin权限用户手工创建快照信息，需要执行两次。具体操作步骤如下：

1）首先确认一下，当前的快照信息视图snapshot.snapshot中的时间节点。



2）执行函数create_wdr_snapshot()创建快照

手工创建wdr报告快照执行语句：

select create_wdr_snapshot();



3）等待10分钟以后再次执行函数create_wdr_snapshot()，手工创建结束快照。



4）执行操作步骤第二步：生成WDR报告，执行如下图步骤，生成节点node级别wdr报告（其中dn_6001客户端gsql登录数据show pgxc_node_name查询的结果）。



4.WDR涉及的数据表

说明：WDR的数据表保存在snapshot这个schema下以snap_开头的表，其数据来源于dbe_perf这个schema内的视图，总共61张视图。





5.WDR报告解读
说明：为了使得WDR报告内容不空洞，本次在测试环境使用BenchmarkSQL5.0对openGauss数据库进行100warehouse，100并发压力测试。 本次的WDR报告样例来自于此时手工创建的快照数据。

手工生成WDR报告后，通过浏览器查看。opengauss的wdr报告类似于oracle的awr，拥有资源消耗、等待事件、TOPSQL，以及参数设置等。

1）下图是执行前tpcc表信息：



2）以下是手工创建的快照开始时间点：



3）开始执行benchmarksql，运行10分钟完成后。手工再次生成wdr报告的结束快照。



4）生成wdr报告如下图：



5）以下是解读WDR报告

开头介绍了一下当前wdr报告概况信息：

信息分类	信息描述
报告采集类型	Summary + Detail，即汇总数据+明细数据
Snapshot信息	使用snapshot_id为24和25的快照采集2022-10-09(15:28 ~ 15:39)的运行信息
硬件配置	X*Xc/GB
节点名	dn_6001
openGauss版本	openGauss 3.0.0


类别	分类明细	作用
Summary	Instance Efficiency Percentages	实例的效率百分比
Top 10 Events by Total Wait Time	事件等待时间排名前10
Wait Classes by Total Wait Time	按照等待类型分类
Host_CPU	主机CPU的负载情况
IO Profile	描述了openGauss在快照期间的IO负载情况
Memory_Statistics	描述了节点内存的变化信息
Report Details	Time Model	描述了数据库各种状态所消耗的时间
SQL Statistics	从SQL执行时间、SQL消耗CPU的时间、SQL返回的行数、SQL扫描的行数、SQL执行的次数、SQL物理读的次数、SQL逻辑读的次数等多维度对两次快照期间的SQL执行情况进行统计
Wait Events	从等待时长、等待次数这两个维度对等待事件进行统计
Cache IO Stats	根据Heap block的命中率排序统计用户表的IO活动状态
Utility status	描述的是后台写操作的统计信息
Object stats	描述用户表状态的统计信息
Configuration settings	描述的是数据库参数配置信息
SQL Detail	描述的是SQL语句的详细信息
