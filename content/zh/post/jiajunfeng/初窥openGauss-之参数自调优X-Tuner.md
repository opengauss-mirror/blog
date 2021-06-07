+++

date = "2021-06-04" 

tags = ["openGauss核心技术"] 

archives = "2021-06" 

author = "贾军锋" 

summary = "初窥openGauss 之参数自调优X-Tuner)"

img = "/zh/post/jiajunfeng/title/img2.png" 

times = "12:30"

+++



# **初窥openGauss 之参数自调优X-Tuner\**<a name="ZH-CN_TOPIC_0000001095662048"></a>

TPC-H 是一个面向分析型业务\(AP\)的基准测试，它由一系列热点查询组成，这些热点查询都是高度复杂的，因此执行时间往往都比较长。   在本次实验测试中，将手动向数据库加载TPC-H数据，并保存在名为 tpch 的数据库中。默认TPC-H数据库的表缺少索引，数据库的参数并没有做任何优化，因此执行效率会比较差。   本实验比较浅显，使用openGauss的参数自调优\(X-Tuner：gs\_xtuner\)功能，对数据库进行参数优化，以提升数据库运行性能，让大家对X-Tuner参数自调优有一个初步的了解。

## **环境信息**<a name="section1046225916813"></a>

OS：CentOS Linux release 7.6.1810

openGauss：2.0.0

CPU：1core

Memory：4GB

测试数据脚本清单如下：

```
[omm@lab01 ~]$ ls -l ~/tpch-kit-back/ 
total 1076780 
-rw------- 1 omm dbgrp  24196144 Apr 24 15:39 customer.tbl 
-rw------- 1 omm dbgrp      3814 Apr 24 15:39 dss.ddl 
-rw------- 1 omm dbgrp 753862072 Apr 24 15:39 lineitem.tbl 
-rw------- 1 omm dbgrp       287 May 25 10:52 load.sh 
-rw------- 1 omm dbgrp      2199 Apr 24 15:16 nation.tbl 
-rw------- 1 omm dbgrp 170452161 Apr 24 15:16 orders.tbl 
-rw------- 1 omm dbgrp  10553197 Apr 24 15:11 out0 
-rw------- 1 omm dbgrp 118184616 Apr 24 15:10 partsupp.tbl 
-rw------- 1 omm dbgrp  23935125 Apr 24 15:11 part.tbl 
drwx------ 3 omm dbgrp      4096 Apr 24 15:39 queries 
-rw------- 1 omm dbgrp       384 Apr 24 15:07 region.tbl 
-rw------- 1 omm dbgrp   1399184 Apr 24 15:07 supplier.tbl 
```

## 1. 配置pip，并安装setuptools-rust模块<a name="section123743019117"></a>

```
[root@lab01 ~]# wget https://bootstrap.pypa.io/get-pip.py 
[root@lab01 ~]# python3 get-pip.py 
[root@lab01 ~]# pip -V pip 21.1.2 from /usr/local/lib/python3.6/site-packages/
pip (python 3.6) 
[root@lab01 ~]# pip install setuptools-rust
```

## 2. 安装依赖包<a name="section12352152315124"></a>

```
[omm@lab01 xtuner]$ pip install joblib 
[omm@lab01 xtuner]$ pip install threadpoolctl
```

## 3. 创建数据库并导入数据<a name="section1123175131216"></a>

```
-- 创建数据库tpch
[omm@lab01 ~]$ gsql -d postgres -p 26000 -c "create database tpch with encoding='UTF-8';"  
-- 创建测试表
 [omm@lab01 ~]$ gsql -d tpch -p 26000 -f ~/tpch-kit-back/dss.ddl  
 -- 加载测试数据并统计分析 
[omm@lab01 ~]$ vi load.sh 
---------------------------------------
for i in `ls *.tbl`; do
table=${i/.tbl/}   
    echo "Loading $table..."
    sed 's/|$//' $i > /tmp/$i   
    gsql -d tpch -p 26000 -c "TRUNCATE $table"
    gsql -d tpch -p 26000 -c "\\copy $table FROM '/home/omm/tpch-kit-back/$i' CSV DELIMITER '|'"
    gsql -d tpch -p 26000 -c "ANALYZE $table"
done
 ---------------------------------------
sh load.sh 
```

## 4. 编辑requirements.txt文件<a name="section9136144991517"></a>

```
[omm@lab01 ~]$ cd /gauss/app/bin/dbmind/xtuner/ 
[omm@lab01 xtuner]$ vi requirements.txt 
---------------------------------------
删除: 
    tensorflow>=2.2.0   
    keras-rl2
 ---------------------------------------
```

## 5. 生成gs\_xtuner参数调优工具\(需要连接外网\)<a name="section19680115871615"></a>

```
[omm@lab01 ~]$ cd /gauss/app/bin/dbmind/xtuner
[omm@lab01 xtuner]$ python3 setup.py install --user 
```

## 6. 执行快速推荐命令（基于已经作业执行的信息进行推荐，信息来源pg\_stat\_database等）<a name="section1425514315174"></a>

```
[omm@lab01 xtuner]$ gs_xtuner recommend --db-name tpch --db-user omm --host 192.168.0.99 --host-user omm --port 26000 
Please input the password of database: 
Please input the password of host: 
Start to recommend knobs. Just a moment, please. 
************************************* Knob Recommendation Report **************************************** 
INFO: 
+---------------------------------------+----------------------+ 
|                 Metric                |        Value         |
 +---------------------------------------+----------------------+ 
|             workload_type             |          ap          | 
|         dirty_background_bytes        |          0           |
|          current_locks_count          |         0.0          |
|      current_prepared_xacts_count     |         0.0          | 
|         rollback_commit_ratio         |         0.0          | 
|         average_connection_age        |       0.004575       | 
| checkpoint_proactive_triggering_ratio | 0.00863557858376511  | 
|         fetched_returned_ratio        | 0.055316264644388206 | 
|             cache_hit_rate            |  0.5028061903026831  | 
|              os_cpu_count             |          1           | 
|          current_connections          |         1.0          | 
|        checkpoint_avg_sync_time       |   1.07037996545769   | 
|            write_tup_speed            |   101.161719229361   | 
|                used_mem               |     131846656.0      | 
|           all_database_size           |   2292057.41015625   | 
|      shared_buffer_heap_hit_rate      |  25.917067253117217  | 
|            current_free_mem           |       3270760        | 
|             temp_file_size            |   3573.07285767967   | 
|                 uptime                |   38.3688171772222   | 
|              os_mem_total             |       3879956        | 
|  checkpoint_dirty_writing_time_window |        450.0         | 
|            read_write_ratio           |  47.82294541597867   | 
|             read_tup_speed            |   4837.86775193848   | 
|             max_processes             |         503          | 
|          track_activity_size          |        503.0         | 
|          search_modify_ratio          |  658741.9884425476   | 
|                ap_index               |         7.5          | 
|      shared_buffer_toast_hit_rate     |   76.6304347826087   | 
|               block_size              |         8.0          | 
|      shared_buffer_tidx_hit_rate      |   82.7893175074184   | 
|       shared_buffer_idx_hit_rate      |   97.6601060219748   | 
|           enable_autovacuum           |         True         |
|                is_64bit               |         True         | 
|                 is_hdd                |         True         | 
|              load_average             |  [1.19, 0.82, 0.8]   | 
+---------------------------------------+----------------------+ 
p.s: The unit of storage is kB. 
WARN: 
[0].
    The number of CPU cores is a little small. Please do not run too high concurrency.
    You are recommended to set max_connections based on the number of CPU cores.
    If your job does not consume much CPU, you can also increase it. 
[1]. 
    The value of wal_buffers is a bit high. Generally, an excessively large value does not bring better performance.  
    You can also set this parameter to -1.  
    The database automatically performs adaptation.
*********************************** Recommended Knob Settings ********************************************** 
+---------------------------+-----------+--------+---------+---------+ 
|            name           | recommend |  min   |   max   | restart | 
+---------------------------+-----------+--------+---------+---------+ 
|       shared_buffers      |   121256  | 72752  |  139448 |   True  |
|      max_connections      |    134    |   15   |   269   |   True  | 
|    effective_cache_size   |  2909967  | 121256 | 2909967 |  False  | 
|        wal_buffers        |    3789   |  2048  |   3789  |   True  | 
|      random_page_cost     |    3.0    |  2.0   |   3.0   |  False  | 
| default_statistics_target |    1000   |  100   |   1000  |  False  | 
+---------------------------+-----------+--------+---------+---------+ 
注意：修改该推荐值之前，请确保硬件条件满足，否则可能会造成数据库无法启动的问题。 
```

## 7. \[可选\]迭代推荐命令（全局搜索算法，迭代式执行，每轮执行约2分钟）<a name="section17445141719396"></a>

-   1\> 修改配置文件

```
vi /home/omm/.local/lib/python3.6/site-packages/openGauss_xtuner-2.0.0-py3.6.egg/tuner/xtuner.conf 
 ------------------------------------------------- 
修改如下行：
    max_iterations = 3 （从100轮改为3）
    benchmark_path = /home/omm/queries 
------------------------------------------------ 
```

-   2\> 执行命令，观察Reward数值变化，粉色输出的轮次为当前较优数值

```
[omm@lab01 ~]$ time gs_xtuner tune --db-name tpch --db-user omm --host localhost --host-user omm --port 26000 
Please input the password of database: 
Please input the password of host: 
Start to recommend knobs. Just a moment, please. 
WARN: The database may restart several times during tuning, continue or not [yes|no]:yes 
2021-05-26 11:09:12,710: Recorder is starting. 
|   iter    |  target   | random... | 
------------------------------------- 
2021-05-26 11:10:58,017: [0] Current reward is -102.935543, knobs: {'random_page_cost': '2.64'}. 
2021-05-26 11:10:58,018: [0] Best reward is -102.935543, knobs: {'random_page_cost': '2.64'}. 
2021-05-26 11:10:58,018: [1] Database metrics: [0.6400000000000001, 0.6007798155874045, 0.65]. 
2021-05-26 11:10:58,018: [1] Benchmark score: -102.899098, used mem: 36444544 kB, reward: -102.935543. 
|  1        | -102.9    |  0.6426   | 
2021-05-26 11:12:30,939: [1] Current reward is -91.541441, knobs: {'random_page_cost': '2'}. 
2021-05-26 11:12:30,941: [1] Best reward is -91.541441, knobs: {'random_page_cost': '2'}. 
2021-05-26 11:12:30,941: [2] Database metrics: [0.0, 0.6107552017890537, 2.6]. 
2021-05-26 11:12:30,942: [2] Benchmark score: -91.504996, used mem: 36444544 kB, reward: -91.541441. 
|  2        | -91.54    |  0.003251 | 
2021-05-26 11:13:38,617: [2] Current reward is -66.684871, knobs: {'random_page_cost': '2.46'}. 
2021-05-26 11:13:38,618: [2] Best reward is -66.684871, knobs: {'random_page_cost': '2.46'}. 
2021-05-26 11:13:38,618: [3] Database metrics: [0.45999999999999996, 0.621014394376401, 3.47]. 
2021-05-26 11:13:38,618: [3] Benchmark score: -66.648426, used mem: 36444544 kB, reward: -66.684871. 
|  3        | -66.68    |  0.4565   | 
2021-05-26 11:14:53,250: [3] Current reward is -73.748742, knobs: {'random_page_cost': '2.9'}. 
2021-05-26 11:14:53,252: [3] Best reward is -66.684871, knobs: {'random_page_cost': '2.46'}. 
2021-05-26 11:14:53,252: [4] Database metrics: [0.8999999999999999, 0.6286889335789447, 3.65]. 
2021-05-26 11:14:53,252: [4] Benchmark score: -73.712297, used mem: 36444544 kB, reward: -73.748742. 
|  4        | -73.75    |  0.9016   | 
2021-05-26 11:15:58,798: [4] Current reward is -64.467620, knobs: {'random_page_cost': '2.45'}. 
2021-05-26 11:15:58,799: [4] Best reward is -64.467620, knobs: {'random_page_cost': '2.45'}. 
2021-05-26 11:15:58,799: [5] Database metrics: [0.4500000000000002, 0.633784310797396, 3.45]. 
2021-05-26 11:15:58,799: [5] Benchmark score: -64.431175, used mem: 36444544 kB, reward: -64.467620. 
|  5        | -64.47    |  0.4544   | 
2021-05-26 11:16:59,097: [5] Current reward is -59.161970, knobs: {'random_page_cost': '2.43'}.
2021-05-26 11:16:59,099: [5] Best reward is -59.161970, knobs: {'random_page_cost': '2.43'}. 
2021-05-26 11:16:59,099: [6] Database metrics: [0.43000000000000016, 0.6393591990442545, 3.91]. 
2021-05-26 11:16:59,099: [6] Benchmark score: -59.125525, used mem: 36444544 kB, reward: -59.161970.
|  6        | -59.16    |  0.4304   | 
2021-05-26 11:18:08,157: [6] Current reward is -67.964937, knobs: {'random_page_cost': '2.39'}. 
2021-05-26 11:18:08,158: [6] Best reward is -59.161970, knobs: {'random_page_cost': '2.43'}. 
2021-05-26 11:18:08,158: [7] Database metrics: [0.3900000000000001, 0.6445245622485726, 4.05]. 
2021-05-26 11:18:08,158: [7] Benchmark score: -67.928493, used mem: 36444544 kB, reward: -67.964937. 
|  7        | -67.96    |  0.3854   | 
2021-05-26 11:19:11,917: [7] Current reward is -62.842104, knobs: {'random_page_cost': '2.43'}. 
2021-05-26 11:19:11,918: [7] Best reward is -59.161970, knobs: {'random_page_cost': '2.43'}. 
2021-05-26 11:19:11,918: [8] Database metrics: [0.43000000000000016, 0.6489102035318035, 3.5]. 
2021-05-26 11:19:11,918: [8] Benchmark score: -62.805659, used mem: 36444544 kB, reward: -62.842104.
 |  8        | -62.84    |  0.4301   | 
===================================== 
2021-05-26 11:19:11,926: The tuning process is complete. The best reward is -59.161970, best knobs are: 
{'random_page_cost': '2.43'}.
 ****************************************** Knob Recommendation Report ************************************* 
INFO: 
+---------------------------------------+-----------------------+ 
|                 Metric                |         Value         | 
+---------------------------------------+-----------------------+ 
|             workload_type             |           ap          | 
|         dirty_background_bytes        |           0           | 
|          current_locks_count          |          0.0          | 
|      current_prepared_xacts_count     |          0.0          | 
|         rollback_commit_ratio         | 0.0002477694554770677 | 
|         average_connection_age        |        0.004734       | 
| checkpoint_proactive_triggering_ratio |  0.00938967136150235  | 
|         fetched_returned_ratio        |  0.09276922373936373  | 
|                 uptime                |   0.224322521666667   | 
|             cache_hit_rate            |   0.6006356117493342  | 
|              os_cpu_count             |           1           | 
|          current_connections          |          1.0          | 
|        checkpoint_avg_sync_time       |    1.06359368331199   | 
|          search_modify_ratio          |   1007080.6984163317  | 
|             max_processes             |          137          | 
|          track_activity_size          |         137.0         | 
|           all_database_size           |    2292057.41015625   | 
|             temp_file_size            |    2694.18229367111   | 
|            current_free_mem           |        3298680        | 
|      shared_buffer_heap_hit_rate      |   36.42339765350299   | 
|                used_mem               |       36444544.0      | 
|              os_mem_total             |        3879956        | 
|  checkpoint_dirty_writing_time_window |         450.0         | 
|                ap_index               |          7.5          | 
|      shared_buffer_toast_hit_rate     |   74.11273486430062   | 
|             read_tup_speed            |    7942.47638202933   | 
|               block_size              |          8.0          | 
|            read_write_ratio           |   80.26596656844558   | 
|      shared_buffer_tidx_hit_rate      |   84.41330998248687   | 
|       shared_buffer_idx_hit_rate      |   96.54182833084825   | 
|            write_tup_speed            |    98.9516516216125   | 
|           enable_autovacuum           |          True         | 
|                is_64bit               |          True         | 
|                 is_hdd                |          True         | 
|              load_average             |   [0.62, 1.08, 1.13]  |
 +---------------------------------------+-----------------------+ 
p.s: The unit of storage is kB.
WARN: 
[0]. The number of CPU cores is a little small. Please do not run too high concurrency. You are recommended to set max_connections based on the number of CPU cores. If your job does not consume much CPU, you can also increase it.
BAD: 
[0]. The value of wal_buffers is too high. Generally, a large value does not bring better performance. ********************************************* Recommended Knob Settings ********************************************
+---------------------------+-----------+--------+---------+---------+
|            name           | recommend |  min   |   max   | restart | 
+---------------------------+-----------+--------+---------+---------+ 
|      random_page_cost     |    2.43   |  2.0   |   3.0   |  False  | 
|       shared_buffers      |   121256  | 72752  |  139448 |   True  |
|      max_connections      |    134    |   15   |   269   |   True  | 
|    effective_cache_size   |  2909967  | 121256 | 2909967 |  False  | 
|        wal_buffers        |    3789   |  1894  |   3789  |   True  | 
| default_statistics_target |    1000   |  100   |   1000  |  False  | 
+---------------------------+-----------+--------+---------+---------+ 
real    10m12.961s user    0m6.827s sys     0m1.076s 
```

![](figures/20210526-2330b2f9-8cb1-4739-8c62-ee6ed6621ba4.png)

