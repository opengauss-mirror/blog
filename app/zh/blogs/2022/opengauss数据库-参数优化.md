---
title: 'opengauss数据库-参数优化'

date: '2021-12-31'

category: 'blog'
tags: ['opengauss数据库-参数优化']

archives: '2021-12'

author: '周琦放'

summary: 'opengauss数据库-参数优化'

img: '/zh/blogs/2022/title/img18.png'

times: '12:30'
---

# opengauss 数据库-参数优化<a name="ZH-CN_TOPIC_0000001187055082"></a>

2021/12/31

## 参数调整<a name="section16738113123213"></a>

```
cat opt_params.sh
#!/bin/bash
source ~/.bashrc
memory=`free|awk '{print $2}' |sed -n 2p`
if [[ $memory -lt 10*1024*1024 ]]
then
max_process_memory=2GB
shared_buffers=128MB
max_connections=500
work_mem=4MB
maintenance_work_mem=256MB
echo "If the database fails to start, lower the parameters max_process_memory and shared_buffers"
elif [[ $memory -gt 4*1024*1024 ]] && [[ $memory -lt 8*1024*1024 ]]
then
max_process_memory=5GB
shared_buffers=1GB
max_connections=1000
work_mem=16MB
maintenance_work_mem=1GB
else
max_process_memory=$((memory*6/10/1024/1024))
shared_buffers=$((memory*3/10/1024/1024))
max_connections=3000
work_mem=64MB
maintenance_work_mem=2GB
fi

##内存相关参数
gs_guc set -I all -N all -c "max_process_memory=${max_process_memory}"
gs_guc set -I all -N all -c "shared_buffers=${shared_buffers}"
gs_guc set -I all -N all -c "work_mem=${work_mem}"
gs_guc set -I all -N all -c "maintenance_work_mem=${maintenance_work_mem}"
gs_guc set -I all -N all -c "cstore_buffers=16MB"
gs_guc set -I all -N all -c "wal_buffers=1GB"
gs_guc set -I all -N all -c "local_syscache_threshold=32MB"
gs_guc set -I all -N all -c "standby_shared_buffers_fraction=1"

##连接访问相关参数
gs_guc set -I all -N all -c "max_connections=${max_connections}"
gs_guc set -I all -N all -c "max_prepared_transactions=${max_connections}"
gs_guc set -I all -N all -c "listen_addresses = '*'"
gs_guc set -I all -N all -c "remote_read_mode=non_authentication"
gs_guc set -I all -N all -c "password_encryption_type=1"
gs_guc set -I all -N all -c "password_reuse_time=0"
gs_guc set -I all -N all -c "password_lock_time=0"
gs_guc set -I all -N all -c "password_effect_time=0"
gs_guc set -I all -N all -c "session_timeout=0"

##wal相关参数
gs_guc set -I all -N all -c "wal_level=logical"
gs_guc set -I all -N all -c "full_page_writes=off"
gs_guc set -I all -N all -c "wal_log_hints=off"
gs_guc set -I all -N all -c "xloginsert_locks=48"
gs_guc set -I all -N all -c "advance_xlog_file_num=10"

##复制相关参数
gs_guc set -I all -N all -c "synchronous_commit=on"
gs_guc set -I all -N all -c "wal_keep_segments=1024"
gs_guc set -I all -N all -c "max_wal_senders=16"
gs_guc set -I all -N all -c "recovery_max_workers=4"
gs_guc set -I all -N all -c "most_available_sync=on"
gs_guc set -I all -N all -c "max_size_for_xlog_prune=104857600"
gs_guc set -I all -N all -c "catchup2normal_wait_time=0"
gs_guc set -I all -N all -c "enable_slot_log=on"
gs_guc set -I all -N all -c "max_replication_slots=32"
gs_guc set -I all -N all -c "wal_receiver_timeout=60s"
gs_guc set -I all -N all -c "sync_config_strategy=none_node"

##日志相关参数
gs_guc set -I all -N all -c "logging_collector=on"
gs_guc set -I all -N all -c "log_duration=on"
gs_guc set -I all -N all -c "log_line_prefix='%m %u %d %r %p %S'"
gs_guc set -I all -N all -c "log_checkpoints=on"
gs_guc set -I all -N all -c "plog_merge_age=0"

gs_guc set -I all -N all -c "archive_dest='/ogarchive'"



##性能统计相关参数
gs_guc set -I all -N all -c "vacuum_cost_limit=1000"
gs_guc set -I all -N all -c "autovacuum_max_workers=10"
gs_guc set -I all -N all -c "autovacuum_naptime=20s"
gs_guc set -I all -N all -c "autovacuum_vacuum_cost_delay=10"
gs_guc set -I all -N all -c "autovacuum_vacuum_scale_factor=0.05"
gs_guc set -I all -N all -c "autovacuum_analyze_scale_factor=0.02"
gs_guc set -I all -N all -c "autovacuum_vacuum_threshold=200"
gs_guc set -I all -N all -c "autovacuum_analyze_threshold=200"
gs_guc set -I all -N all -c "autovacuum_io_limits=104857600"
gs_guc set -I all -N all -c "instr_unique_sql_count=20000"
gs_guc set -I all -N all -c "enable_save_datachanged_timestamp=off"
gs_guc set -I all -N all -c "track_sql_count=off"
gs_guc set -I all -N all -c "enable_instr_rt_percentile=off"
gs_guc set -I all -N all -c "enable_instance_metric_persistent=off"
gs_guc set -I all -N all -c "enable_logical_io_statistics=off"
gs_guc set -I all -N all -c "enable_user_metric_persistent=off"
gs_guc set -I all -N all -c "enable_mergejoin=on"
gs_guc set -I all -N all -c "enable_nestloop=on"
gs_guc set -I all -N all -c "enable_pbe_optimization=off"
gs_guc set -I all -N all -c "enable_resource_track=on"
gs_guc set -I all -N all -c "enable_wdr_snapshot=on"
gs_guc set -I all -N all -c "instr_unique_sql_count=5000"

##客户端白名单
gs_guc set -I all -N all -h "host all all 0.0.0.0/0 md5"

##其他参数
gs_guc set -I all -N all -c "checkpoint_segments=1024"
gs_guc set -I all -N all -c "checkpoint_completion_target=0.8"
gs_guc set -I all -N all -c "pagewriter_sleep=200"

gs_guc set -I all -N all -c "enable_alarm=off"
gs_guc set -I all -N all -c "enable_codegen=off"
gs_guc set -I all -N all -c "audit_enabled=on"
gs_guc set -I all -N all -c "enable_asp=off"

gs_guc set -I all -N all -c "lc_messages='en_US.UTF-8'"
gs_guc set -I all -N all -c "lc_monetary='en_US.UTF-8'"
gs_guc set -I all -N all -c "lc_numeric='en_US.UTF-8'"
gs_guc set -I all -N all -c "lc_time='en_US.UTF-8'"

gs_guc set -I all -N all -c "update_lockwait_timeout=1min"
gs_guc set -I all -N all -c "lockwait_timeout=1min"

gs_guc set -I all -N all -c "max_files_per_process=100000"
gs_guc set -I all -N all -c "behavior_compat_options='display_leading_zero'"
gs_guc set -I all -N all -c "enable_thread_pool=off"
```

## 重启生效<a name="section1193117366329"></a>

```
gs_om -t stop && gs_om -t start
```
