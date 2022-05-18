+++

title = "MogDB 2.1.1 初始化参数概要说明" 

date = "2022-05-18" 

tags = ["MogDB 2.1.1 初始化参数概要说明"] 

archives = "2022-05" 

author = "云和恩墨" 

summary = "MogDB 2.1.1 初始化参数概要说明"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# MogDB 2.1.1 初始化参数概要说明

本文出处：[https://www.modb.pro/db/394787](https://www.modb.pro/db/394787)

MogDB数据库安装完成后，官方文档提供了刷新参数的脚本，推荐执行脚本来进行初始化参数设置。

本文在官方提供脚本的基础上添加了简单说明，方便新学习的同学能大概了解参数作用。

- [CentOS7.7 下标准安装 MogDB 2.1.1](https://cdn.modb.pro/db/394547)
- [官方脚本链接](https://docs.mogdb.io/zh/mogdb/v2.1/7-recommended-parameter-settings)

### 一、注意

- 建议将shell内容拷贝到notepad++等文本阅读器中设置为shell语言阅读
- 刷新的参数都会写到配置文件/mogdb/data/db1/postgresql.conf中（按照官方文档标准安装是该路径）
- gs_guc set -I all -N all -c 是openGuass/MogDB设置参数的方法，说明见：https://www.modb.pro/db/30065
- 部分参数设置仅适合测试环境使用
- 在MogDB中查询参数级别及简单描述

```
\pset pager select context,name,short_desc from pg_settings order by context,category,name; 
```

- 想进一步了解参数详细，建议查询官方文档：https://opengauss.org/zh/docs/3.0.0/docs/BriefTutorial/BriefTutorial.html

### 二、脚本

```
#!/bin/bash

source ~/.bashrc

##获取当前机器的内存大小，单位KB
memory=`free|awk '{print $2}' |sed -n 2p`
##判断内存是否小于4G
if [[ $memory -lt 4*1024*1024 ]]
##内存小于4G，则设置max_process_memory为2G
then
	##max_process_memory 数据库可用的最大物理内存
    max_process_memory=2GB  
	##shared_buffers 共享内存大小
    shared_buffers=128MB
	##max_connections 最大连接数
    max_connections=500
	##work_mem 内部排序操作和Hash表在开始写入临时磁盘文件之前使用的内存大小
    work_mem=4MB
	##maintenance_work_mem 设置在维护性操作可使用的最大的内存
    maintenance_work_mem=256MB
	##应该是考虑到有物理内存本来就小于2G的情况，可以进一步减小max_process_memory和shared_buffers的值
    echo "If the database fails to start, lower the parameters max_process_memory and shared_buffers"
##判断内存大于4G小于等于8G，按下面的值刷参数
elif [[ $memory -gt 4*1024*1024 ]] && [[ $memory -lt 8*1024*1024 ]]
then
    max_process_memory=5GB
    shared_buffers=1GB
    max_connections=1000
    work_mem=16MB
    maintenance_work_mem=1GB
##大于8G的情况按如下公式计算得出
else
    max_process_memory=$((memory*6/10/1024/1024))GB
    shared_buffers=$((memory*3/10/1024/1024))GB
    max_connections=3000
    work_mem=64MB
    maintenance_work_mem=2GB
fi

##内存相关参数
gs_guc set -I all -N all -c "max_process_memory=${max_process_memory}"
gs_guc set -I all -N all -c "shared_buffers=${shared_buffers}"
gs_guc set -I all -N all -c "work_mem=${work_mem}"
gs_guc set -I all -N all -c "maintenance_work_mem=${maintenance_work_mem}"
##cstore_buffers 列存所使用的共享缓冲区的大小，对比O从12c起在SGA中也有类似区域,关于og列式存储的介绍：https://blog.csdn.net/GaussDB/article/details/116017248
gs_guc set -I all -N all -c "cstore_buffers=16MB"
##wal_buffers 用于存放WAL数据的共享内存空间的XLOG_BLCKSZ数,wal相当于O的redo，wal_buffers看样子类似于SGA中的redo log buffer，但是og的这个内存区域远大于o，可以研究下机制
gs_guc set -I all -N all -c "wal_buffers=1GB"
##local_syscache_threshold 控制session动态内存大小
gs_guc set -I all -N all -c "local_syscache_threshold=32MB"
##standby_shared_buffers_fraction 备库所在服务器使用shared_buffers内存缓冲区大小的比例，1代表100%
gs_guc set -I all -N all -c "standby_shared_buffers_fraction=1"

##连接访问相关参数
gs_guc set -I all -N all -c "max_connections=${max_connections}"
##max_prepared_transactions 同时处于"预备"状态的事务的最大数目
gs_guc set -I all -N all -c "max_prepared_transactions=${max_connections}"
##listen_addresses 远程客户端连接使用的数据库主节点ip或者主机名,参考：https://www.modb.pro/db/30200
gs_guc set -I all -N all -c "listen_addresses = '*'"
##远程连接的读取模式，当前设置为无验证
gs_guc set -I all -N all -c "remote_read_mode=non_authentication"
##password_encryption_type 加密算法设置，1代表采用sha256和md5方式对密码加密，参考：https://www.modb.pro/db/30252
gs_guc set -I all -N all -c "password_encryption_type=1"
##password_reuse_time 对新密码进行可重用天数检查
gs_guc set -I all -N all -c "password_reuse_time=0"
##password_lock_time 密码锁定时间，设置为0时表示即使超过密码错误次数限制导致帐户锁定，也会在短时间内自动解锁
gs_guc set -I all -N all -c "password_lock_time=0"
##password_effect_time 密码有效期，0表示不开启有效期限制功能,单位为天
gs_guc set -I all -N all -c "password_effect_time=0"
##session_timeout 开启自动断开功能，0为不开启
gs_guc set -I all -N all -c "session_timeout=0"

##wal相关参数
##wal_level 写入WAL信息量的级别(minimal、archive、hot_standby、logical)
gs_guc set -I all -N all -c "wal_level=logical"
##full_page_writes 在检查点之后对页面的第一次修改时，是否将每个磁盘页面的全部内容写到WAL日志中
gs_guc set -I all -N all -c "full_page_writes=off"
##wal_log_hints 检查点之后对页面的第一次修改为页面上元组hint bits的修改时，是否将整个页面的全部内容写到WAL日志中
gs_guc set -I all -N all -c "wal_log_hints=off"
##xloginsert_locks 并发写预写式日志锁的个数
gs_guc set -I all -N all -c "xloginsert_locks=48"
##advance_xlog_file_num 在后台周期性地提前初始化xlog文件的数目
gs_guc set -I all -N all -c "advance_xlog_file_num=10"

##复制相关参数
##synchronous_commit 当前事务的同步方式，说明：https://blog.csdn.net/Hehuyi_In/article/details/103449611
gs_guc set -I all -N all -c "synchronous_commit=on"
##wal_keep_segments Xlog日志文件段数量,“pg_xlog”目录下保留事务日志文件的最小数目
gs_guc set -I all -N all -c "wal_keep_segments=1024"
##max_wal_senders 事务日志发送进程的并发连接最大数量，不可大于等于max_connections
gs_guc set -I all -N all -c "max_wal_senders=16"
##recovery_max_workers 最大并行回放线程个数，关于什么是并行回放可查看：https://zhuanlan.zhihu.com/p/390307047
gs_guc set -I all -N all -c "recovery_max_workers=4"
##most_available_sync 在备机同步失败时，是否阻塞主机，on为启用，类似O的DG最大可用模式，正常是sync同步，当备库断异常时切换为async，在备库恢复时，切换回sync
gs_guc set -I all -N all -c "most_available_sync=on"
##max_size_for_xlog_prune xlog最大值的阈值，单位KB
gs_guc set -I all -N all -c "max_size_for_xlog_prune=104857600"
##catchup2normal_wait_time 单同步备机情况下，控制备机数据追赶（catchup）阻塞主机的最长时间，https://gitee.com/opengauss/openGauss-server/issues/I23SAM
gs_guc set -I all -N all -c "catchup2normal_wait_time=0"
##enable_slot_log 是否开启逻辑复制槽主备同步特性
gs_guc set -I all -N all -c "enable_slot_log=on"
##max_replication_slots 当前物理流复制槽数+所需的逻辑复制槽数
gs_guc set -I all -N all -c "max_replication_slots=32"
##wal_receiver_timeout 从主机接收数据的最大等待时间，中止处于非活动状态超过指定时间的复制连接
gs_guc set -I all -N all -c "wal_receiver_timeout=60s"
##sync_config_strategy 主机、备机和级联备之间配置文件的同步策略，主机配置为none_node时，表示不允许主机向任何备机主动同步配置文件
gs_guc set -I all -N all -c "sync_config_strategy=none_node"

##日志相关参数
##logging_collector 控制开启后端日志收集进程logger进行日志收集
gs_guc set -I all -N all -c "logging_collector=on"
##log_duration 记录每个已完成SQL语句的执行时间
gs_guc set -I all -N all -c "log_duration=on"
##log_line_prefix 每条日志信息的前缀格式
gs_guc set -I all -N all -c "log_line_prefix='%m %u %d %r %p %S'"
##log_checkpoints 在服务器日志中记录检查点和重启点的信息
gs_guc set -I all -N all -c "log_checkpoints=on"
##plog_merge_age 控制性能日志数据输出的周期，即多久进行一次性能日志汇聚，单位为毫秒，0是不启用
gs_guc set -I all -N all -c "plog_merge_age=0"

##性能统计相关参数
##vacuum_cost_limit 设置清理进程休眠的开销限制
gs_guc set -I all -N all -c "vacuum_cost_limit=1000"
##autovacuum_max_workers 能同时运行的自动清理线程的最大数量
gs_guc set -I all -N all -c "autovacuum_max_workers=10"
##autovacuum_naptime 两次自动清理操作的时间间隔
gs_guc set -I all -N all -c "autovacuum_naptime=20s"
##autovacuum_vacuum_cost_delay 自动VACUUM操作里使用的开销延迟数值
gs_guc set -I all -N all -c "autovacuum_vacuum_cost_delay=10"
##autovacuum_vacuum_scale_factor 触发一个VACUUM时增加到autovacuum_vacuum_threshold的表大小的缩放系数
gs_guc set -I all -N all -c "autovacuum_vacuum_scale_factor=0.05"
##autovacuum_analyze_scale_factor 触发一个ANALYZE时增加到autovacuum_analyze_threshold的表大小的缩放系数
gs_guc set -I all -N all -c "autovacuum_analyze_scale_factor=0.02"
##autovacuum_vacuum_threshold 触发VACUUM的阈值
gs_guc set -I all -N all -c "autovacuum_vacuum_threshold=200"
##autovacuum_analyze_threshold 触发ANALYZE操作的阈值
gs_guc set -I all -N all -c "autovacuum_analyze_threshold=200"
##autovacuum_io_limits 控制autovacuum进程每秒触发IO的上限
gs_guc set -I all -N all -c "autovacuum_io_limits=104857600"
##instr_unique_sql_count 系统中unique sql信息实时收集功能
gs_guc set -I all -N all -c "instr_unique_sql_count=20000"
##enable_save_datachanged_timestamp 确定是否收集insert/update/delete, exchange/truncate/drop partition操作对表数据改动的时间
gs_guc set -I all -N all -c "enable_save_datachanged_timestamp=off"
##track_sql_count 控制对每个会话中当前正在执行的SELECT、INSERT、UPDATE、DELETE、MERGE INTO语句进行计数的统计数据
gs_guc set -I all -N all -c "track_sql_count=off"
##enable_instr_rt_percentile 开启计算系统中80%和95%的SQL响应时间的功能
gs_guc set -I all -N all -c "enable_instr_rt_percentile=off"
##enable_instance_metric_persistent 开启实例资源监控转存功能
gs_guc set -I all -N all -c "enable_instance_metric_persistent=off"
##enable_logical_io_statistics 开启资源监控逻辑IO统计功能
gs_guc set -I all -N all -c "enable_logical_io_statistics=off"
##enable_user_metric_persistent 开启用户历史资源监控转存功能
gs_guc set -I all -N all -c "enable_user_metric_persistent=off"
##enable_mergejoin 优化器对融合连接规划类型的使用
gs_guc set -I all -N all -c "enable_mergejoin=on"
##enable_nestloop 优化器对内表全表扫描嵌套循环连接规划类型的使用
gs_guc set -I all -N all -c "enable_nestloop=on"
##enable_pbe_optimization 对以PBE（Parse Bind Execute）形式执行的语句进行查询计划的优化
gs_guc set -I all -N all -c "enable_pbe_optimization=off"
##enable_resource_track 是否开启资源实时监控功能，on表示打开资源监控；off表示关闭资源监控
gs_guc set -I all -N all -c "enable_resource_track=on"
##enable_wdr_snapshot 数据库监控快照功能
gs_guc set -I all -N all -c "enable_wdr_snapshot=on"
##instr_unique_sql_count 系统中unique sql信息实时收集功能
gs_guc set -I all -N all -c "instr_unique_sql_count=5000"

##客户端白名单
gs_guc set -I all -N all -h "host     all      all  0.0.0.0/0    md5"

##其他参数
##checkpoint_segments checkpoint_timeout周期内所保留的最少WAL日志段文件数量
gs_guc set -I all -N all -c "checkpoint_segments=1024"
##checkpoint_completion_target 检查点完成的目标，0.8表示每个checkpoint需要在checkpoints间隔时间的80%内完成。
gs_guc set -I all -N all -c "checkpoint_completion_target=0.8"
##pagewriter_sleep 设置用于增量检查点打开后，pagewrite线程每隔pagewriter_sleep的时间刷一批脏页下盘。
gs_guc set -I all -N all -c "pagewriter_sleep=200"
##enable_alarm 告警检测线程，检测数据库中可能的错误场景
gs_guc set -I all -N all -c "enable_alarm=off"
##enable_codegen 标识是否允许开启代码生成优化，目前代码生成使用的是LLVM优化
gs_guc set -I all -N all -c "enable_codegen=off"
##audit_enabled 审计进程的开启和关闭
gs_guc set -I all -N all -c "audit_enabled=off"
##没找到这个参数的说明
gs_guc set -I all -N all -c "enable_asp=off"
##lc_messages 信息显示的语言
gs_guc set -I all -N all -c "lc_messages='en_US.UTF-8'"
##lc_monetary 货币值的显示格式
gs_guc set -I all -N all -c "lc_monetary='en_US.UTF-8'"
##lc_numeric 数值的显示格式
gs_guc set -I all -N all -c "lc_numeric='en_US.UTF-8'"
##lc_time 时间和区域的显示格式
gs_guc set -I all -N all -c "lc_time='en_US.UTF-8'"
##update_lockwait_timeout 并发更新参数开启情况下，该参数控制并发更新同一行时单个锁的最长等待时间
gs_guc set -I all -N all -c "update_lockwait_timeout=1min"
##lockwait_timeout 单个锁的最长等待时间
gs_guc set -I all -N all -c "lockwait_timeout=1min"
##max_files_per_process 设置每个服务器进程允许同时打开的最大文件数目
gs_guc set -I all -N all -c "max_files_per_process=100000"
##behavior_compat_options 数据库兼容性行为配置项，该参数的值由若干个配置项用逗号隔开构成，display_leading_zero表示浮点数显示，不配置的话则0.25显示为.25
gs_guc set -I all -N all -c "behavior_compat_options='display_leading_zero'"
##enable_thread_pool 控制是否使用线程池功能
gs_guc set -I all -N all -c "enable_thread_pool=off"
```
