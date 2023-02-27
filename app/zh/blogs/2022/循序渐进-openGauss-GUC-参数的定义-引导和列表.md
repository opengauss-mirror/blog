---
title: '循序渐进 openGauss ：GUC 参数的定义、引导和列表'

date: '2021-12-24'

category: 'blog'
tags: ['循序渐进 openGauss ：GUC 参数的定义、引导和列表']

archives: '2021-12'

author: 'eygle'

summary: '循序渐进 openGauss ：GUC 参数的定义、引导和列表'

img: '/zh/blogs/2022/title/img16.png'

times: '12:30'
---

# 循序渐进 openGauss ：GUC 参数的定义、引导和列表<a name="ZH-CN_TOPIC_0000001198777162"></a>

在添加 GUC 参数时，需要注意你添加的参数属于什么类别的参数。

例如如果你想让普通用户能随时修改它，那么你需要将参数级别设置为 PGC_USERSET。如果你想让超级用户能在线修改它，那么你需要将它设置为 PGC_SUSET。如果你想让它能够在修改配置参数并通过信号生效，那么需要设置为 PGC_SIGHUP。

在 openGauss 中，GUC 参数相关的代码如下

[src/common/backend/utils/misc/guc.cpp](https://gitee.com/opengauss/openGauss-server/blob/master/src/common/backend/utils/misc/guc.cpp)

## 参数级别介绍<a name="section1299610194150"></a>

```
/*
 * Displayable names for context types (enum GucContext)
 *
 * Note: these strings are deliberately not localized.
 */
const char* const GucContext_Names[] = {
    /* PGC_INTERNAL */ "internal",
    /* PGC_POSTMASTER */ "postmaster",
    /* PGC_SIGHUP */ "sighup",
    /* PGC_BACKEND */ "backend",
    /* PGC_SUSET */ "superuser",
    /* PGC_USERSET */ "user"};
```

以下是这些参数品类的说明：

- PGC_INTERNAL：参数只能通过内部设定，用户不能设定。
- PGC_POSTMASTER：参数只能在 Postmaster 启动时通过读配置文件或处理命令行参数来配置。
- PGC_SIGHUP：参数只能在 Postmaster 启动时配置，或当我们改变了配置文件并发送信号 SIGUP 通知 Postmaster 或 Postgres 的时候进行配置。
- PGC_BACKEND：参数只能在 Postmaster 启动时读配置文件设置，或由客户端在进行连接请求时设置。已经启动的后台进程会忽略此类参数的改变。
- PGC_SUSET：参数只能在 Postmaster 启动时或由超级用户通过 SQL 语言（SET 命令）进行设置。
- PGC_USERSET：可以用用户在任何时候进行配置。

## 参数来源定义<a name="section26388111614"></a>

在 [master/src/include/utils/guc.h](https://gitee.com/opengauss/openGauss-server/blob/master/src/include/utils/guc.h) 中，以下数据结构定义了 GUC 参数的来源：

```
typedef enum {
    PGC_S_DEFAULT,         /* hard-wired default ("boot_val") */
    PGC_S_DYNAMIC_DEFAULT, /* default computed during initialization */
    PGC_S_ENV_VAR,         /* postmaster environment variable */
    PGC_S_FILE,            /* postgresql.conf */
    PGC_S_ARGV,            /* postmaster command line */
    PGC_S_DATABASE,        /* per-database setting */
    PGC_S_USER,            /* per-user setting */
    PGC_S_DATABASE_USER,   /* per-user-and-database setting */
    PGC_S_CLIENT,          /* from client connection request */
    PGC_S_OVERRIDE,        /* special case to forcibly set default */
    PGC_S_INTERACTIVE,     /* dividing line for error reporting */
    PGC_S_TEST,            /* test per-database or per-user setting */
    PGC_S_SESSION          /* SET command */
} GucSource;
```

## 参数的引导<a name="section070913399315"></a>

在数据库启动时，初始化参数的引导分为三个步骤

- **初始化 GUC 参数**

  Postmaster 将首先调用 InitializeGUCOptions 函数将参数设置为默认值：

  1）首先调用 build_guc_variables 函数来统计参数个数并分配相应的 config_generic 类型的全局指针数组 guc_variables 以保存每个参数结构体的地址，并且对该数组进行排序。由于参数是通过全局静态数组 ConfigureNamesBool、ConfigureNamesInt、ConfigureNamesReal、ConfigureNamesString、ConfigureNamesEnum 存储的，因此在 build_guc_variables 函数中只需要遍历相应的数组，统计参数的个数并将参数结构体中 config_generic 域的参数 vartype 设置为相应的参数类型。当遍历完所有参数后，根据总的参数个数分配 config_generic 指针数组 guc_vars，然后再次遍历静态参数数组，将每个参数结构的首地址保存到 guc_vars 数组中（这里分配的数组个数为当前参数总数的 1.25 倍，主要是为了方便以后参数的扩充）。接着将全局变量 guc_variables 也指向 guc_vars 数组。最后通过快速排序法把 guc_variables 按照参数名进行排序。

  2）接下来将每个参数设置为默认值。对于 guc_variables 中的每个参数，initializeGUCOptions 函数先将其 config_generic 域中的 status 设置为 0，将 reset_source、tentative_source、source 设置为 PGC_S_DEFAULT 表示默认；stack、sourcefile 设置为 NULL；然后根据参数值 vartype 的不同类型分别调用相应的 assign_hook 函数（如果该参数设置了该函数），assign_hook 函数用来设置 boot_val，最后将 boot_val 赋值给 reset_val 和 variable 指向的变量，通过这样一系列的步骤就将参数设置为了默认值。

  3）通过系统调用 getenv 来获得环境变量 PGPORT、PGDATESTYLE、PGCLIENTENCODING 的值，不为空则调用 SetConfigOption 函数来设置这三个变量对应的参数的值。

  4）最后，检测系统的最大安全栈深度，如果这个深度值大于 100KB 且不超过 2MB，则用它设置 max_stack_depth 参数。

- **配置 GUC 参数**

  如果用户启动 Postmaster 进程时通过命令行参数指定了一些 GUC 的参数值，那么 Postmaster 需要从命令行参数中将这些 GUC 参数的值解析出来并且设置到相应的 GUC 参数中。根据命令行设置参数主要是通过 getopt 和 SetConfigOption 这两个函数来完成的。

  对于 getopt 返回的每一个参数选项及其参数值，通过一个 switch 语句根据参数选项的不同分别调用 SetConfigOption 函数设置相应的参数。

  SetConfigOption 函数的第一个参数为参数名；第二个参数为参数值，其值存放在 getopt 函数返回的 optarg 字符串中；第三个参数为参数类型最后一个参数为参数来源。由于在这里 Postmaster 只在处理，命令行参数，所以这里的参数类型和参数来源分别设置为 PGC_POSTMASTER 和 PGC_S_ARGV。

  SetConfigOption 函数是通过调用 set_config_option\(const char \*name, const char \* value, GucContext context, GucSource source, bool isLocal, bool changeVal\)函数来实现的，其中最后两个参数统一设置为 false 和 true。该函数首先从 guc_variables 指向的参数数组中搜索参数名为 name 的参数，如果没有找到则出错；否则将找到的参数的结构体中 GucContext 的值与传过来的参数 context 比较，判断在当前的上下文中参数是否可以设置，如果不能设置的话就报错，否则再将参数结构体中的 GucSource 与传过来的参数 source 进行比较，判断当前操作的优先级是否大于或者等于先前的优先级，如果大于或者等于先前的优先级则根据具体参数值的类型将 value 转化为相应的数据，然后设置参数结构体中的相应数据项即可。

- **读取配置文件**

  当完成了命令行参数的设置之后，接着读配置文件重新配置参数。需要注意的是，在配置文件中设置的参数都不能修改之前通过命令行已经设置的参数，因为其优先级没有通过命令行设置的优先级高。

  这个过程主要是调用 SelectConfigFiles\(const char \* userDoption, const char \* progname\)函数来实现的，其中第一个参数是通过命令行设置的用户的数据目录，如果没有设置会通过环境变量 PGDATA 找到；第二个参数为程序名，主要用于错误处理。

  该函数首先在数据目录下找到配置文件，然后调用词法分析程序解析文件。对于解析到的每个参数及其参数值，调用 SetConfigOption 来完成参数的修改。

  通过上述三个步骤设置完参数后还要检验参数的合法性。比如，数据目录的用户 ID 应该等于当前进程的有效用户 ID、数据目录应该禁止组用户和其他用户的一切访问、缓冲区的数量至少是允许连接的进程数的两倍并且至少为 16，等等。如果一切合法，则将当前目录转入数据目录，然后进行后续的操作。

## 如何查看所有参数级别<a name="section45761843143713"></a>

```
omm=# \pset pager
Pager usage is off.
omm=# select context,name,short_desc from pg_settings order by context,category,name;
  context   |                  name                  |                                                                                                                                                                         short_desc
------------+----------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 backend    | local_preload_libraries                | Lists shared libraries to preload into each backend.
 backend    | remotetype                             | Sets the type of Postgres-XC remote connection
 backend    | ignore_system_indexes                  | Disables reading from system indexes.
 backend    | post_auth_delay                        | Waits N seconds on connection startup after authentication.
 backend    | log_connections                        | Logs each successful connection.
 backend    | log_disconnections                     | Logs end of a session, including duration.
 internal   | lc_collate                             | Shows the collation order locale.
 internal   | lc_ctype                               | Shows the character classification and case conversion locale.
 internal   | server_encoding                        | Sets the server (database) character set encoding.
 internal   | instr_unique_sql_track_type            | unique sql track type
 internal   | block_size                             | Shows the size of a disk block.
 internal   | integer_datetimes                      | Datetimes are integer based.
 internal   | percentile                             | Sets the percentile of sql responstime that DBA want to know.
 internal   | enable_adio_function                   | Enable adio function.
 internal   | max_function_args                      | Shows the maximum number of function arguments.
 internal   | max_identifier_length                  | Shows the maximum identifier length.
 internal   | max_index_keys                         | Shows the maximum number of index keys.
 internal   | segment_size                           | Shows the number of pages per disk file.
 internal   | server_version                         | Shows the server version.
 internal   | server_version_num                     | Shows the server version as an integer.
 internal   | wal_block_size                         | Shows the block size in the write ahead log.
 internal   | wal_segment_size                       | Shows the number of pages per write ahead log segment.
 internal   | update_process_title                   | Updates the process title to show the active SQL command.
 internal   | current_logic_cluster                  | Shows current logic cluster.
 internal   | sql_compatibility                      | Choose which SQL format to adapt.
 postmaster | audit_data_format                      | Sets the data format for audit files.
 postmaster | audit_directory                        | Sets the destination directory for audit files.
 postmaster | available_zone                         | Sets the available zone of current instance.
 postmaster | elastic_search_ip_addr                 | Controls elastic search IP address in the system.
 postmaster | use_elastic_search                     | Enables elastic search in the system.
 postmaster | autovacuum_freeze_max_age              | Age at which to autovacuum a table.
 postmaster | autovacuum_max_workers                 | Sets the maximum number of simultaneously running autovacuum worker processes.
 postmaster | comm_tcp_mode                          | Whether use tcp commucation mode for stream
 postmaster | enable_global_plancache                | enable to use global plan cache.
 postmaster | enable_thread_pool                     | enable to use thread pool.
 postmaster | thread_pool_attr                       | Spare Cpu that can not be used in thread pool.
 postmaster | cn_send_buffer_size                    | Sets the send buffer size used in CN, unit in KB.
 postmaster | asp_sample_num                         | Sets the active session profile max sample nums in buff
 postmaster | comm_control_port                      | Sets the stream control port the server listens on.
 postmaster | comm_max_receiver                      | Maximum number of internal receiver threads.
 postmaster | comm_memory_pool                       | Sets the memory pool size for communication(in kB).
 postmaster | comm_memory_pool_percent               | Sets the percent of comm_memory_pool for dynamic workload.
 postmaster | comm_quota_size                        | Sets the stream quota size in kB.
 postmaster | comm_sctp_port                         | Sets the STCP port the server listens on.
 postmaster | comm_usable_memory                     | Sets the total usable memory for communication(in kB).
 postmaster | listen_addresses                       | Sets the host name or IP address(es) to listen to.
 postmaster | local_bind_address                     | Sets the host name or IP address(es) to connect to for sctp.
 postmaster | max_connections                        | Sets the maximum number of concurrent connections for clients.
 postmaster | max_inner_tool_connections             | Sets the maximum number of concurrent connections for inner tools.
 postmaster | port                                   | Sets the TCP port the server listens on.
 postmaster | unix_socket_group                      | Sets the owning group of the Unix-domain socket.
 postmaster | unix_socket_permissions                | Sets the access permissions of the Unix-domain socket.
 postmaster | enableSeparationOfDuty                 | Enables the user's separation of privileges.
 postmaster | sysadmin_reserved_connections          | Sets the number of connection slots reserved for system admin.
 postmaster | unix_socket_directory                  | Sets the directory where the Unix-domain socket will be created.
 postmaster | ssl                                    | Enables SSL connections.
 postmaster | ssl_ca_file                            | Location of the SSL certificate authority file.
 postmaster | ssl_cert_file                          | Location of the SSL server certificate file.
 postmaster | ssl_ciphers                            | Sets the list of allowed SSL ciphers.
 postmaster | ssl_crl_file                           | Location of the SSL certificate revocation list file.
 postmaster | ssl_key_file                           | Location of the SSL server private key file.
 postmaster | pgxc_node_name                         | The Coordinator or Datanode name.
 postmaster | enable_stateless_pooler_reuse          | Pooler stateless reuse mode.
 postmaster | allow_system_table_mods                | Allows modifications of the structure of system tables.
 postmaster | comm_sender_buffer_size                | The libcomm sender's buffer size in every interaction between DN and CN, or DN and DN, unit(KB)
 postmaster | lastval_supported                      | Enable functionality of lastval() function.
 postmaster | support_extended_features              | Enables unofficial supported extended features.
 postmaster | data_sync_retry                        | Whether to continue running after a failure to sync data files.
 postmaster | config_file                            | Sets the server's main configuration file.
 postmaster | data_directory                         | Sets the server's data directory.
 postmaster | enable_default_cfunc_libpath           | Enable check for c function lib path.
 postmaster | external_pid_file                      | Writes the postmaster PID to the specified file.
 postmaster | hba_file                               | Sets the server's "hba" configuration file.
 postmaster | ident_file                             | Sets the server's "ident" configuration file.
 postmaster | mot_config_file                        | Sets mot main configuration file.
 postmaster | job_queue_processes                    | Number of concurrent jobs, optional: [1...1000], default: 10.
 postmaster | max_locks_per_transaction              | Sets the maximum number of locks per transaction.
 postmaster | max_pred_locks_per_transaction         | Sets the maximum number of predicate locks per transaction.
 postmaster | enable_delta_store                     | Enable delta for column store.
 postmaster | string_hash_compatible                 | Enables the hash compatibility of char() and varchar() datatype
 postmaster | enable_orc_cache                       | Enable orc metadata cache.
 postmaster | enable_mix_replication                 | All the replication log sent by the wal streaming.
 postmaster | data_replicate_buffer_size             | Sets the buffer size of data replication.
 postmaster | max_replication_slots                  | Sets the maximum number of simultaneously defined replication slots.
 postmaster | max_wal_senders                        | Sets the maximum number of simultaneously running WAL sender processes.
 postmaster | catchup2normal_wait_time               | The maximal allowed duration for waiting from catchup to normal state.
 postmaster | hot_standby                            | Allows connections and queries during recovery.
 postmaster | wal_receiver_buffer_size               | Sets the buffer size to receive data from master.
 postmaster | asp_log_directory                      | Sets the destination directory for asp log files.
 postmaster | event_source                           | Sets the application name used to identify PostgreSQL messages in the event log.
 postmaster | logging_collector                      | Starts a subprocess to capture stderr output and/or csvlogs into log files.
 postmaster | perf_directory                         | Sets the destination directory for perf json files.
 postmaster | query_log_directory                    | Sets the destination directory for slow query log files.
 postmaster | numa_distribute_mode                   | Sets the NUMA node distribution mode.
 postmaster | max_files_per_process                  | Sets the maximum number of simultaneously open files for each server process.
 postmaster | shared_preload_libraries               | Lists shared libraries to preload into server.
 postmaster | cstore_buffers                         | Sets the number of CStore buffers used by the server.
 postmaster | enable_memory_limit                    | Using memory protect feature.
 postmaster | local_syscache_threshold               | Sets the maximum threshold for cleaning cache.
 postmaster | max_compile_functions                  | max compile results in postmaster
 postmaster | max_prepared_transactions              | Sets the maximum number of simultaneously prepared transactions.
 postmaster | max_process_memory                     | Sets the maximum number of memory used by the process.
 postmaster | memorypool_enable                      | Using memory pool.
 postmaster | memorypool_size                        | Sets the number of memory pool used by the server.
 postmaster | shared_buffers                         | Sets the number of shared memory buffers used by the server.
 postmaster | track_activity_query_size              | Sets the size reserved for pg_stat_activity.query, in bytes.
 postmaster | udf_memory_limit                       | Sets the maximum number of memory used by UDF Master and UDF Workers.
 postmaster | UDFWorkerMemHardLimit                  | Sets the hard memory limit to be used for fenced UDF.
 postmaster | walsender_max_send_size                | Size of walsender max send size.
 postmaster | recovery_max_workers                   | The max number of recovery threads allowed to run in parallel.
 postmaster | recovery_parallelism                   | The actual number of recovery threads running in parallel.
 postmaster | recovery_parse_workers                 | The number of recovery threads to do xlog parse.
 postmaster | recovery_redo_workers                  | The number belonging to one parse worker to do xlog redo.
 postmaster | bbox_blanklist_items                   | List of names of bbox blanklist items.
 postmaster | enable_ffic_log                        | Enables First Failure Info Capture.
 postmaster | max_concurrent_autonomous_transactions | Maximum number of concurrent autonomous transactions processes.
 postmaster | alarm_component                        | Sets the component for alarm function.
 postmaster | enable_alarm                           | Enables alarm or not.
 postmaster | enable_nonsysadmin_execute_direct      | Enables non-sysadmin users execute direct on CN/DN.
 postmaster | max_cached_tuplebufs                   | how many memory reorderbuffer can use.
 postmaster | max_changes_in_memory                  | how many memory a transaction can use in reorderbuffer.
 postmaster | max_resource_package                   | The maximum number of the resource package(RP) for DN in the compute pool.
 postmaster | remote_read_mode                       | decide way of remote read
 postmaster | transparent_encrypted_string           | The encrypted string to test the transparent encryption key.
 postmaster | transparent_encrypt_kms_region         | The region to get transparent encryption key.
 postmaster | transparent_encrypt_kms_url            | The URL to get transparent encryption key.
 postmaster | enable_page_lsn_check                  | Enable check page lsn when redo
 postmaster | force_promote                          | Enable master update min recovery point.
 postmaster | bgwriter_thread_num                    | Sets the number of background writer threads with incremental checkpoint on.
 postmaster | enable_double_write                    | Enable master double write.
 postmaster | enable_incremental_checkpoint          | Enable master incremental checkpoint.
 postmaster | pagewriter_thread_num                  | Sets the number of page writer threads.
 postmaster | advance_xlog_file_num                  | Sets the number of xlog files to be initialized in advance.
 postmaster | replication_type                       | Sets the dn's HA mode.
 postmaster | sync_config_strategy                   | Synchronization strategy for configuration files between host and standby.
 postmaster | wal_buffers                            | Sets the number of disk-page buffers in shared memory for WAL.
 postmaster | wal_file_init_num                      | Sets the number of xlog segment files that WAL writer auxiliary thread creates at one time.
 postmaster | wal_level                              | Sets the level of information written to the WAL.
 postmaster | wal_log_hints                          | Writes full pages to WAL when first modified after a checkpoint, even for a non-critical modifications.
 postmaster | wal_writer_cpu                         | Sets the binding CPU number for the WAL writer thread.
 postmaster | xlog_idle_flushes_before_sleep         | Number of idle xlog flushes before xlog flusher goes to sleep.
 postmaster | xloginsert_locks                       | Sets the number of locks used for concurrent xlog insertions.
 sighup     | audit_copy_exec                        | audit copy execution.
 sighup     | audit_database_process                 | audit database start, stop, recover and switchover.
 sighup     | audit_dml_state                        | audit DML operation.
 sighup     | audit_dml_state_select                 | audit DML select operation.
 sighup     | audit_enabled                          | Starts a subprocess to capture audit output into audit files.
 sighup     | audit_file_remain_threshold            | audit file remain threshold.
 sighup     | audit_file_remain_time                 | the days of the audit files can be remained
 sighup     | audit_function_exec                    | audit function execution.
 sighup     | audit_grant_revoke                     | audit grant and revoke privilege.
 sighup     | audit_login_logout                     | audit user login logout.
 sighup     | audit_resource_policy                  | the policy is used to determine how to cleanup the audit files; True means to cleanup the audit files based on space limitation and False means to cleanup the audit files when the remained time is arriving.
 sighup     | audit_rotation_interval                | Automatic audit file rotation will occur after N minutes.
 sighup     | audit_rotation_size                    | Automatic audit file rotation will occur after N kilobytes.
 sighup     | audit_set_parameter                    | audit set operation.
 sighup     | audit_space_limit                      | audit data space limit in MB unit
 sighup     | audit_system_object                    | audit DDL operation on system object.
 sighup     | audit_user_locked                      | audit lock and unlock user.
 sighup     | audit_user_violation                   | audit user violation.
 sighup     | autoanalyze_timeout                    | Sets the timeout for auto-analyze action.
 sighup     | autovacuum                             | Starts the autovacuum subprocess.
 sighup     | autovacuum_analyze_scale_factor        | Number of tuple inserts, updates, or deletes prior to analyze as a fraction of reltuples.
 sighup     | autovacuum_analyze_threshold           | Minimum number of tuple inserts, updates, or deletes prior to analyze.
 sighup     | autovacuum_mode                        | Sets the behavior of autovacuum
 sighup     | autovacuum_naptime                     | Time to sleep between autovacuum runs.
 sighup     | autovacuum_vacuum_cost_delay           | Vacuum cost delay in milliseconds, for autovacuum.
 sighup     | autovacuum_vacuum_cost_limit           | Vacuum cost amount available before napping, for autovacuum.
 sighup     | autovacuum_vacuum_scale_factor         | Number of tuple updates or deletes prior to vacuum as a fraction of reltuples.
 sighup     | autovacuum_vacuum_threshold            | Minimum number of tuple updates or deletes prior to vacuum.
 sighup     | enable_router                          | enable to use router.
 sighup     | track_stmt_retention_time              | The longest retention time of full SQL and slow query in statement_ history
 sighup     | support_batch_bind                     | Sets to use batch bind-execute for PBE.
 sighup     | max_cn_temp_file_size                  | Sets the maximum tempfile size used in CN, unit in MB.
 sighup     | asp_flush_rate                         | every Nth sample to disk, MOD(sample_id, N) = 0 will flush to dist
 sighup     | asp_retention_days                     | set max retention days for pg_asp
 sighup     | asp_sample_interval                    | Sets the active session profile max sample nums in buff
 sighup     | enable_asp                             | Enable active session profile
 sighup     | enable_instr_cpu_timer                 | Enables instruments cpu timer functionality.
 sighup     | enable_instr_rt_percentile             | Calculate percentile info of sql responstime.
 sighup     | enable_instr_track_wait                | Collects information about wait status.
 sighup     | enable_slow_query_log                  | Write slow query log.
 sighup     | enable_stmt_track                      | Enable full/slow sql feature
 sighup     | enable_wdr_snapshot                    | Enable wdr snapshot
 sighup     | instr_rt_percentile_interval           | Sets the interval for calculating percentile in pgstat thread, in seconds
 sighup     | instr_unique_sql_count                 | Sets the number of entries collected in gs_instr_unique_sql.
 sighup     | track_stmt_session_slot                | Sets the number of entries collected for full sql/slow sql in each session.
 sighup     | wdr_snapshot_interval                  | Sets the interval for wdr snapshot in snapshot thread, in min
 sighup     | wdr_snapshot_query_timeout             | Sets the timeout for wdr snapshot query, in seconds
 sighup     | wdr_snapshot_retention_days            | Sets the max time span for wdr snapshot, in seconds
 sighup     | authentication_timeout                 | Sets the maximum allowed time to complete client authentication.
 sighup     | auth_iteration_count                   | The iteration count used in RFC5802 authenication.
 sighup     | failed_login_attempts                  | max number of login attempts.
 sighup     | krb_srvname                            | Sets the name of the Kerberos service.
 sighup     | krb_caseins_users                      | Sets whether Kerberos and GSSAPI user names should be treated as case-insensitive.
 sighup     | krb_server_keyfile                     | Sets the location of the Kerberos server key file.
 sighup     | password_encryption_type               | The encryption method of password.
 sighup     | password_lock_time                     | password lock time
 sighup     | modify_initial_password                | modify the initial password of the initial user.
 sighup     | password_effect_time                   | password effective time.
 sighup     | password_max_length                    | max length of password.
 sighup     | password_min_digital                   | min number of digital character in password.
 sighup     | password_min_length                    | min length of password.
 sighup     | password_min_uppercase                 | min number of upper character in password.
 sighup     | password_notify_time                   | password deadline notice time.
 sighup     | password_policy                        | The password complexity-policy of the database system.
 sighup     | password_reuse_max                     | max times password can reuse.
 sighup     | password_reuse_time                    | max days password can reuse.
 sighup     | password_min_lowercase                 | min number of lower character in password.
 sighup     | password_min_special                   | min number of special character in password.
 sighup     | require_ssl                            | Requires SSL connections.
 sighup     | ssl_cert_notify_time                   | Alarm days before ssl cert expires.
 sighup     | pre_auth_delay                         | Waits N seconds on connection startup before authentication.
 sighup     | trace_recovery_messages                | Enables logging of recovery-related debugging information.
 sighup     | wait_dummy_time                        | Wait for dummy starts or bcm file list received when catchup.
 sighup     | enable_debug_vacuum                    | This parameter is just used for logging some vacuum info.
 sighup     | restart_after_crash                    | Reinitializes server after backend crashes.
 sighup     | defer_csn_cleanup_time                 | Sets the interval time to push cut off csn num.
 sighup     | enable_prevent_job_task_startup        | enable control whether the job task thread can be started.
 sighup     | enable_security_policy                 | enable security policy features.
 sighup     | most_available_sync                    | Enables master to continue when sync standbys failure.
 sighup     | synchronous_standby_names              | List of names of potential synchronous standbys.
 sighup     | vacuum_defer_cleanup_age               | Number of transactions by which VACUUM and HOT cleanup should be deferred, if any.
 sighup     | recovery_time_target                   | The target redo time in seconds for recovery
 sighup     | replconninfo2                          | Sets the replconninfo2 of the HA to listen and authenticate.
 sighup     | replconninfo3                          | Sets the replconninfo3 of the HA to listen and authenticate.
 sighup     | replconninfo1                          | Sets the replconninfo1 of the HA to listen and authenticate.
 sighup     | replconninfo4                          | Sets the replconninfo4 of the HA to listen and authenticate.
 sighup     | replconninfo5                          | Sets the replconninfo5 of the HA to listen and authenticate.
 sighup     | replconninfo6                          | Sets the replconninfo6 of the HA to listen and authenticate.
 sighup     | replconninfo7                          | Sets the replconninfo7 of the HA to listen and authenticate.
 sighup     | replconninfo8                          | Sets the replconninfo8 of the HA to listen and authenticate.
 sighup     | time_to_target_rpo                     | The time to the target recovery point in seconds
 sighup     | wal_keep_segments                      | Sets the number of WAL files held for standby servers.
 sighup     | wal_sender_timeout                     | Sets the maximum time to wait for WAL replication.
 sighup     | enable_incremental_catchup             | Enable incremental searching bcm files when catchup.
 sighup     | enable_stream_replication              | Allows stream replication to standby or secondary.
 sighup     | hot_standby_feedback                   | Allows feedback from a hot standby to the primary that will avoid query conflicts.
 sighup     | max_standby_archive_delay              | Sets the maximum delay before canceling queries when a hot standby server is processing archived WAL data.
 sighup     | recovery_min_apply_delay               | Sets the minimum delay for applying changes during recovery.
 sighup     | wal_receiver_connect_retries           | Sets the maximum retries to connect master.
 sighup     | max_standby_streaming_delay            | Sets the maximum delay before canceling queries when a hot standby server is processing streamed WAL data.
 sighup     | primary_slotname                       | Set the primary slot name.
 sighup     | wal_receiver_connect_timeout           | Sets the maximum wait time to connect master.
 sighup     | wal_receiver_status_interval           | Sets the maximum interval between WAL receiver status reports to the primary.
 sighup     | wal_receiver_timeout                   | Sets the maximum wait time to receive data from master.
 sighup     | debug_print_parse                      | Logs each query's parse tree.
 sighup     | debug_print_plan                       | Logs each query's execution plan.
 sighup     | debug_print_rewritten                  | Logs each query's rewritten parse tree.
 sighup     | log_autovacuum_min_duration            | Sets the minimum execution time above which autovacuum actions will be logged.
 sighup     | log_checkpoints                        | Logs each checkpoint.
 sighup     | log_hostname                           | Logs the host name in the connection logs.
 sighup     | log_line_prefix                        | Controls information prefixed to each log line.
 sighup     | log_pagewriter                         | Logs pagewriter thread.
 sighup     | log_timezone                           | Sets the time zone to use in log messages.
 sighup     | asp_flush_mode                         | Sets the active session profile flush mode:file/table/all.
 sighup     | asp_log_filename                       | Sets the file name pattern for asp data files.
 sighup     | bbox_dump_path                         | Sets the path of core dump created by bbox_handler.
 sighup     | log_destination                        | Sets the destination for server log output.
 sighup     | log_filename                           | Sets the file name pattern for log files.
 sighup     | log_rotation_age                       | Automatic log file rotation will occur after N minutes.
 sighup     | log_rotation_size                      | Automatic log file rotation will occur after N kilobytes.
 sighup     | log_directory                          | Sets the destination directory for log files.
 sighup     | log_file_mode                          | Sets the file permissions for log files.
 sighup     | log_truncate_on_rotation               | Truncates existing log files of same name during log rotation.
 sighup     | syslog_ident                           | Sets the program name used to identify PostgreSQL messages in syslog.
 sighup     | query_log_file                         | Sets the file name pattern for slow query log files.
 sighup     | syslog_facility                        | Sets the syslog "facility" to be used when syslog enabled.
 sighup     | cache_connection                       | pooler cache connection
 sighup     | bgwriter_delay                         | Background writer sleep time between rounds.
 sighup     | bgwriter_flush_after                   | Number of pages after which previously performed writes are flushed to disk.
 sighup     | bgwriter_lru_maxpages                  | Background writer maximum number of LRU pages to flush per round.
 sighup     | bgwriter_lru_multiplier                | Multiple of the average buffer usage to free per round.
 sighup     | candidate_buf_percent_target           | Sets the candidate buffers percent.
 sighup     | dirty_page_percent_max                 | Sets the dirty buffers percent.
 sighup     | enable_memory_context_control          | check the max space size of memory context.
 sighup     | session_history_memory                 | Sets the maximum number of session history memory used by the process.
 sighup     | standby_shared_buffers_fraction        | The max fraction of shared_buffers usage to standby.
 sighup     | autovacuum_io_limits                   | Sets io_limit for autovacum.
 sighup     | session_statistics_memory              | Sets the maximum number of session statistics memory used by the process.
 sighup     | cpu_collect_timer                      | Sets the maximum cpu collect time.
 sighup     | enable_bbox_dump                       | Enables bbox_handler to create core dump.
 sighup     | enable_instance_metric_persistent      | enable instance resource info persistent function.
 sighup     | enable_logical_io_statistics           | enable logical io statistics function.
 sighup     | enable_resource_record                 | enable insert the session info into the user table.
 sighup     | enable_resource_track                  | enable resources tracking and recording functionality in the system.
 sighup     | enable_user_metric_persistent          | enable user resource info persistent function.
 sighup     | instance_metric_retention_time         | the instance resource info retention time.
 sighup     | io_control_unit                        | Sets the io control unit for reading or writing row tuple.
 sighup     | topsql_retention_time                  | the retention time of TopSql
 sighup     | unique_sql_retention_time              | the retention time of unique sql text
 sighup     | user_metric_retention_time             | the user resource info retention time.
 sighup     | use_workload_manager                   | Enables workload manager in the system.
 sighup     | fault_mon_timeout                      | how many miniutes to monitor lwlock. 0 will disable that
 sighup     | stats_temp_directory                   | Writes temporary statistics files to the specified directory.
 sighup     | alarm_report_interval                  | Sets the interval time between two alarm report.
 sighup     | connection_alarm_rate                  | Reports alarm if connection rate overload.
 sighup     | enable_access_server_directory         | enable sysadmin to create directory
 sighup     | enable_copy_server_files               | enable sysadmin to copy from/to file
 sighup     | enable_online_ddl_waitlock             | Enable ddl wait advisory lock in online expansion.
 sighup     | operation_mode                         | Sets the operation mode.
 sighup     | upgrade_mode                           | Indicate the upgrade mode: inplace upgrade mode, grey upgrade mode or not in upgrade.
 sighup     | enable_cbm_tracking                    | Turn on cbm tracking function.
 sighup     | enable_xlog_prune                      | Enable xlog prune when not all standys connected and xlog size is largger than max_xlog_size
 sighup     | max_io_capacity                        | The I/O upper limit of batch flush dirty page every second.
 sighup     | max_redo_log_size                      | max redo log size.
 sighup     | max_size_for_xlog_prune                | This param set by user is used for xlog to be recycled when not all are connected and the param enable_xlog_prune is on.
 sighup     | archive_command                        | Sets the shell command that will be called to archive a WAL file.
 sighup     | archive_dest                           | Sets the path that will be used to archive a WAL file.
 sighup     | archive_mode                           | Allows archiving of WAL files using archive_command.
 sighup     | archive_timeout                        | Forces a switch to the next xlog file if a new file has not been started within N seconds.
 sighup     | checkpoint_completion_target           | Time spent flushing dirty buffers during checkpoint, as fraction of checkpoint interval.
 sighup     | checkpoint_flush_after                 | Number of pages after which previously performed writes are flushed to disk.
 sighup     | checkpoint_segments                    | Sets the maximum distance in log segments between automatic WAL checkpoints.
 sighup     | checkpoint_timeout                     | Sets the maximum time between automatic WAL checkpoints.
 sighup     | checkpoint_wait_timeout                | Sets the maximum wait timeout for checkpointer to start.
 sighup     | checkpoint_warning                     | Enables warnings if checkpoint segments are filled more frequently than this.
 sighup     | datanode_heartbeat_interval            | Sets the heartbeat interval of the standby nodes.
 sighup     | incremental_checkpoint_timeout         | Sets the maximum time between automatic WAL checkpoints.
 sighup     | pagewriter_sleep                       | PageWriter sleep time.
 sighup     | fsync                                  | Forces synchronization of updates to disk.
 sighup     | full_page_writes                       | Writes full pages to WAL when first modified after a checkpoint.
 sighup     | wal_sync_method                        | Selects the method used for forcing WAL updates to disk.
 sighup     | wal_writer_delay                       | WAL writer sleep time between WAL flushes.
 superuser  | lc_messages                            | Sets the language in which messages are displayed.
 superuser  | dynamic_library_path                   | Sets the path for dynamically loadable modules.
 superuser  | session_replication_role               | Sets the session's behavior for triggers and rewrite rules.
 superuser  | pljava_vmoptions                       | Options sent to the JVM when it is created
 superuser  | enable_adio_debug                      | Enable log debug adio function.
 superuser  | ignore_checksum_failure                | Continues processing after a checksum failure.
 superuser  | zero_damaged_pages                     | Continues processing past damaged page headers.
 superuser  | exit_on_error                          | Terminates session on any error.
 superuser  | deadlock_timeout                       | Sets the time to wait on a lock before checking for deadlock.
 superuser  | lockwait_timeout                       | Sets the max time to wait on a lock acquire.
 superuser  | update_lockwait_timeout                | Sets the max time to wait on a lock acquire when concurrently update same tuple.
 superuser  | enable_extrapolation_stats             | Enable extrapolation stats for date datatype.
 superuser  | enable_fast_numeric                    | Enable numeric optimize.
 superuser  | enable_global_stats                    | Enable global stats for analyze.
 superuser  | enable_kill_query                      | Enables cancelling a query that locks some relations owned by a user when the user is dropped.
 superuser  | enable_change_hjcost                   | Enable change hash join cost
 superuser  | enable_csqual_pushdown                 | Enables colstore qual push down.
 superuser  | log_duration                           | Logs the duration of each completed SQL statement.
 superuser  | log_error_verbosity                    | Sets the verbosity of logged messages.
 superuser  | log_lock_waits                         | Logs long lock waits.
 superuser  | log_statement                          | Sets the type of statements logged.
 superuser  | log_temp_files                         | Logs the use of temporary files larger than this number of kilobytes.
 superuser  | raise_errors_if_no_files               | raise errors if no files to be imported.
 superuser  | backtrace_min_messages                 | Sets the message levels for print backtrace that are logged.
 superuser  | log_min_duration_statement             | Sets the minimum execution time above which statements will be logged.
 superuser  | log_min_error_statement                | Causes all statements generating error at or above this level to be logged.
 superuser  | log_min_messages                       | Sets the message levels that are logged.
 superuser  | temp_file_limit                        | Limits the total size of all temporary files used by each session.
 superuser  | fast_extend_file_size                  | Set fast extend file size used by async dirct IO interface for row store.
 superuser  | max_stack_depth                        | Sets the maximum stack depth, in kilobytes.
 superuser  | autoanalyze                            | Enable auto-analyze when querying tables with no statistic.
 superuser  | enable_analyze_check                   | Enable check if table is analyzed when querying.
 superuser  | log_executor_stats                     | Writes executor performance statistics to the server log.
 superuser  | log_parser_stats                       | Writes parser performance statistics to the server log.
 superuser  | log_planner_stats                      | Writes planner performance statistics to the server log.
 superuser  | log_statement_stats                    | Writes cumulative performance statistics to the server log.
 superuser  | track_activities                       | Collects information about executing commands.
 superuser  | track_counts                           | Collects statistics on database activity.
 superuser  | track_functions                        | Collects function-level statistics on database activity.
 superuser  | track_io_timing                        | Collects timing statistics for database I/O activity.
 superuser  | track_sql_count                        | Collects query info on database activity.
 superuser  | track_thread_wait_status_interval      | Sets the interval for collecting thread status in pgstat thread, in minute
 superuser  | enable_fast_allocate                   | enable fallocate to improve file extend performance, make sure filesystem support it, ep:XFS
 superuser  | lo_compat_privileges                   | Enables backward compatibility mode for privilege checks on large objects.
 superuser  | max_keep_log_seg                       | Sets the threshold for implementing logical replication flow control.
 superuser  | enable_light_proxy                     | Turns on light proxy on coordinator.
 superuser  | enable_pbe_optimization                | Turns on pbe optimization: force to reuse generic plan.
 superuser  | enforce_two_phase_commit               | Enforces the use of two-phase commit on transactions thatmade use of temporary objects.
 superuser  | xc_maintenance_mode                    | Turns on XC maintenance mode.
 user       | router                                 | set send node router for sql before unrouter.
 user       | client_encoding                        | Sets the client's character set encoding.
 user       | DateStyle                              | Sets the display format for date and time values.
 user       | default_text_search_config             | Sets default text search configuration.
 user       | extra_float_digits                     | Sets the number of digits displayed for floating-point values.
 user       | IntervalStyle                          | Sets the display format for interval values.
 user       | lc_monetary                            | Sets the locale for formatting monetary amounts.
 user       | lc_numeric                             | Sets the locale for formatting numbers.
 user       | lc_time                                | Sets the locale for formatting date and time values.
 user       | TimeZone                               | Sets the time zone for displaying and interpreting time stamps.
 user       | timezone_abbreviations                 | Selects a file of time zone abbreviations.
 user       | gin_fuzzy_search_limit                 | Sets the maximum allowed result for exact search by GIN.
 user       | tcp_keepalives_count                   | Maximum number of TCP keepalive retransmits.
 user       | tcp_keepalives_idle                    | Time between issuing TCP keepalives.
 user       | tcp_keepalives_interval                | Time between TCP keepalive retransmits.
 user       | analysis_options                       | enable/disable sql dfx option.
 user       | bytea_output                           | Sets the output format for bytea.
 user       | check_function_bodies                  | Checks function bodies during CREATE FUNCTION.
 user       | client_min_messages                    | Sets the message levels that are sent to the client.
 user       | current_schema                         | Sets the schema search order for names that are not schema-qualified.
 user       | default_tablespace                     | Sets the default tablespace to create tables and indexes in.
 user       | default_transaction_deferrable         | Sets the default deferrable status of new transactions.
 user       | default_transaction_isolation          | Sets the transaction isolation level of each new transaction.
 user       | default_transaction_read_only          | Sets the default read-only status of new transactions.
 user       | enforce_a_behavior                     | GUC parameter of enforcing adapting to A db.
 user       | gin_pending_list_limit                 | Sets the maximum size of the pending list for GIN index.
 user       | max_query_retry_times                  | Sets the maximum sql retry times.
 user       | max_user_defined_exception             | GUC parameter of max_user_defined_exception.
 user       | nls_timestamp_format                   | defines the default timestamp format to use with the TO_TIMESTAMP functions.
 user       | omit_encoding_error                    | Omits encoding convert error.
 user       | search_path                            | Sets the schema search order for names that are not schema-qualified.
 user       | session_timeout                        | Set the maximum allowed duration of any unused session.
 user       | statement_timeout                      | Sets the maximum allowed duration of any statement.
 user       | transaction_deferrable                 | Whether to defer a read-only serializable transaction until it can be executed with no possible serialization failures.
 user       | transaction_isolation                  | Sets the current transaction's isolation level.
 user       | temp_tablespaces                       | Sets the tablespace(s) to use for temporary tables and sort files.
 user       | transaction_read_only                  | Sets the current transaction's read-only status.
 user       | vacuum_freeze_min_age                  | Minimum age at which VACUUM should freeze a table row.
 user       | vacuum_freeze_table_age                | Age at which VACUUM should scan whole table to freeze tuples.
 user       | vacuum_gtt_defer_check_age             | The defer check age of GTT, used to check expired data after vacuum.
 user       | xmlbinary                              | Sets how binary values are to be encoded in XML.
 user       | xmloption                              | Sets whether XML data in implicit parsing and serialization operations is to be considered as documents or content fragments.
 user       | ssl_renegotiation_limit                | SSL renegotiation is no longer supported, no matter what value is set.
 user       | application_type                       | application distribute type(perfect sharding or not) in gtm free mode.
 user       | allow_concurrent_tuple_update          | Allows concurrent tuple update.
 user       | track_stmt_details_size                | the maximum bytes of statement details to be gathered.
 user       | track_stmt_stat_level                  | specify which level statement's statistics to be gathered.
 user       | comm_debug_mode                        | Whether use libcomm debug mode for print debug information
 user       | comm_no_delay                          | Whether set NO_DELAY option for libcomm socket
 user       | comm_stat_mode                         | Whether use libcomm stat mode for print stat data
 user       | comm_timer_mode                        | Whether use libcomm timer debug mode for print timer data
 user       | debug_assertions                       | Turns on various assertion checks.
 user       | enable_beta_features                   | Enable features that ever supported in former version .
 user       | enable_show_any_tuples                 | This parameter is just valid when it's a read-only transction, just for analyse.The default_transaction_read_only and transaction_read_only should be true.You'd better keep enable_indexscan and enable_bitmapscan  be false to keep seqscan occurs.When enable_show_any_tuples is true, all versions of the tuples are visible, including dirty versions.
 user       | ha_module_debug                        | debug ha module.
 user       | trace_notify                           | Generates debugging output for LISTEN and NOTIFY.
 user       | trace_sort                             | Emits information about resource usage in sorting.
 user       | minimum_pool_size                      | Initial pool size.
 user       | pooler_maximum_idle_time               | Maximum idle time of the pooler links.
 user       | partition_lock_upgrade_timeout         | Sets the timeout for partition lock upgrade, in seconds
 user       | codegen_strategy                       | Choose whether it is allowed to call C-function in codegen.
 user       | comm_ackchk_time                       | Send ack check package to stream sender periodically.
 user       | query_dop                              | User-defined degree of parallelism.
 user       | resource_track_log                     | Sets resource track log level
 user       | rewrite_rule                           | Sets the rewrite rule.
 user       | sql_beta_feature                       | Sets the beta feature for SQL engine.
 user       | geqo                                   | Enables genetic query optimization.
 user       | geqo_effort                            | GEQO: effort is used to set the default for other GEQO parameters.
 user       | geqo_generations                       | GEQO: number of iterations of the algorithm.
 user       | geqo_pool_size                         | GEQO: number of individuals in the population.
 user       | geqo_seed                              | GEQO: seed for random path selection.
 user       | geqo_selection_bias                    | GEQO: selective pressure within the population.
 user       | geqo_threshold                         | Sets the threshold of FROM items beyond which GEQO is used.
 user       | constraint_exclusion                   | Enables the planner to use constraints to optimize queries.
 user       | cost_param                             | Bitmap controls the use of alternative cost model.
 user       | cursor_tuple_fraction                  | Sets the planner's estimate of the fraction of a cursor's rows that will be retrieved.
 user       | default_statistics_target              | Sets the default statistics target.
 user       | enable_upgrade_merge_lock_mode         | If true, use Exclusive Lock mode for deltamerge.
 user       | from_collapse_limit                    | Sets the FROM-list size beyond which subqueries are not collapsed.
 user       | hashagg_table_size                     | Sets the number of slot in the hash table.
 user       | join_collapse_limit                    | Sets the FROM-list size beyond which JOIN constructs are not flattened.
 user       | max_recursive_times                    | max recursive times when execute query with recursive-clause.
 user       | plan_cache_mode                        | Controls the planner's selection of custom or generic plan.
 user       | schedule_splits_threshold              | The Max count of splits which can be scheduled in memory.
 user       | td_compatible_truncation               | Enable string automatically truncated during insertion.
 user       | allocate_mem_cost                      | Sets the planner's estimate of the cost of allocate memory.
 user       | codegen_cost_threshold                 | Decided to use LLVM optimization or not.
 user       | cost_weight_index                      | Sets the planner's discount when evaluating index cost.
 user       | cpu_index_tuple_cost                   | Sets the planner's estimate of the cost of processing each index entry during an index scan.
 user       | cpu_operator_cost                      | Sets the planner's estimate of the cost of processing each operator or function call.
 user       | cpu_tuple_cost                         | Sets the planner's estimate of the cost of processing each tuple (row).
 user       | default_limit_rows                     | Sets the planner's default estimation when limit rows is unknown.Negative value means using percentage of the left tree rows, whereas positive value sets the estimation directly.
 user       | dngather_min_rows                      | minimum rows worth do dn gather, 0 meas always, -1 means disable
 user       | seq_page_cost                          | Sets the planner's estimate of the cost of a sequentially fetched disk page.
 user       | acceleration_with_compute_pool         | If true, agg/scan may run in compute pool.
 user       | default_storage_nodegroup              | Default storage group for create table.
 user       | effective_cache_size                   | Sets the planner's assumption about the size of the disk cache.
 user       | random_page_cost                       | Sets the planner's estimate of the cost of a nonsequentially fetched disk page.
 user       | enable_absolute_tablespace             |  Enable tablespace using absolute location.
 user       | enable_beta_opfusion                   | Enables beta opfusion features.
 user       | enable_bitmapscan                      | Enables the planner's use of bitmap-scan plans.
 user       | enable_bloom_filter                    | Enable bloom filter check
 user       | enable_broadcast                       | Enables the planner's use of broadcast stream plans.
 user       | enable_codegen                         | Enable llvm for executor.
 user       | enable_codegen_print                   | Enable dump() for llvm function.
 user       | enable_compress_hll                    | Enables hll use less memory on datanode.
 user       | enable_compress_spill                  | Enables spilling compress.
 user       | enable_constraint_optimization         | Enable optimize query by using informational constraint.
 user       | enable_hashagg                         | Enables the planner's use of hashed aggregation plans.
 user       | enable_hashjoin                        | Enables the planner's use of hash join plans.
 user       | enable_dngather                        | Enables the planner's use of dngather plans.
 user       | enable_force_vector_engine             | Forces to enable the vector engine.
 user       | enable_hadoop_env                      |  Enable hadoop enviroment.
 user       | enable_index_nestloop                  | Enables the planner's use of index-nested join plans.
 user       | enable_hdfs_predicate_pushdown         | Enable hdfs predicate pushdown.
 user       | enable_hypo_index                      | Enable hypothetical index for explain.
 user       | enable_indexonlyscan                   | Enables the planner's use of index-only-scan plans.
 user       | enable_indexscan                       | Enables the planner's use of index-scan plans.
 user       | enable_material                        | Enables the planner's use of materialization.
 user       | enable_mergejoin                       | Enables the planner's use of merge join plans.
 user       | enable_nestloop                        | Enables the planner's use of nested-loop join plans.
 user       | enable_nodegroup_debug                 | Enables the planner's node group debug mode.
 user       | enable_opfusion                        | Enables opfusion.
 user       | enable_parallel_ddl                    | Allow user to implement DDL parallel without dead lock.
 user       | enable_partition_opfusion              | Enables partition opfusion features.
 user       | enable_partitionwise                   | Enables the planner's use of partitionwise join plans.
 user       | enable_seqscan                         | Enables the planner's use of sequential-scan plans.
 user       | enable_slot_log                        | Enables create slot log
 user       | enable_sonic_hashagg                   | Enable Sonic hashagg.
 user       | enable_sonic_hashjoin                  | Enable Sonic hashjoin.
 user       | enable_sonic_optspill                  | Enable Sonic optimized spill.
 user       | enable_sort                            | Enables the planner's use of explicit sort steps.
 user       | enable_tidscan                         | Enables the planner's use of TID-scan plans.
 user       | enable_trigger_shipping                | Ship a trigger to DN if possible.
 user       | enable_valuepartition_pruning          | Enable optimization for partitioned DFS table to be staticly/dynamically-pruned when possible.
 user       | enable_vector_engine                   | Enables the vector engine.
 user       | expected_computing_nodegroup           | Computing node group mode or expected node group for query processing.
 user       | force_bitmapand                        | Force the planner's use of bitmap-and plans.
 user       | opfusion_debug_mode                    | opfusion debug mode.
 user       | plan_mode_seed                         | Specify which plan mode and seed the optimizer generation used.
 user       | qrw_inlist2join_optmode                | Specify inlist2join opimitzation mode.
 user       | enable_data_replicate                  | Allows data replicate.
 user       | RepOriginId                            | RepOriginId.
 user       | application_name                       | Sets the application name to be reported in statistics and logs.
 user       | connection_info                        | Sets the connection info to be reported in statistics and logs.
 user       | debug_pretty_print                     | Indents parse and plan tree displays.
 user       | logging_module                         | enable/disable module logging.
 user       | gds_debug_mod                          | Enable GDS-related troubleshoot-logging.
 user       | plog_merge_age                         | how long to aggregate profile logs.
 user       | explain_dna_file                       | Sets the destination file for explain performance data.
 user       | backend_flush_after                    | Number of pages after which previously performed writes are flushed to disk.
 user       | vacuum_cost_limit                      | Vacuum cost amount available before napping.
 user       | vacuum_cost_page_dirty                 | Vacuum cost for a page dirtied by vacuum.
 user       | effective_io_concurrency               | Number of simultaneous requests that can be handled efficiently by the disk subsystem.
 user       | vacuum_cost_delay                      | Vacuum cost delay in milliseconds.
 user       | vacuum_cost_page_hit                   | Vacuum cost for a page found in the buffer cache.
 user       | vacuum_cost_page_miss                  | Vacuum cost for a page not found in the buffer cache.
 user       | sql_use_spacelimit                     | Limit the single sql used space on a single DN.
 user       | backwrite_quantity                     | Sets the IO quantity of backwrite buffers used by async dirct IO interface.
 user       | bulk_read_ring_size                    | Size of bulk read buffer ring.
 user       | bulk_write_ring_size                   | Size of bulk write buffer ring.
 user       | cstore_backwrite_max_threshold         | Cu cache threshold for cstore when do insert by async dirct IO
 user       | cstore_backwrite_quantity              | Each column write threshold for cstore when do insert by async dirct IO
 user       | cstore_prefetch_quantity               | Sets the IO quantity of prefetch CUs used by async dirct IO interface for column store.
 user       | disable_memory_protect                 | disable memory protect for query execution.
 user       | FencedUDFMemoryLimit                   | Sets the maximum memory to be used for fenced UDF by user.
 user       | maintenance_work_mem                   | Sets the maximum memory to be used for maintenance operations.
 user       | enable_early_free                      | Using memory early free policy.
 user       | max_loaded_cudesc                      | Sets the number of loaded cudesc per column.
 user       | memory_detail_tracking                 | Sets the operator name and peak size for triggering the memory logging in that time.
 user       | memory_tracking_mode                   | Choose which style to track the memory usage.
 user       | partition_max_cache_size               | The max partition cache size for cstore when do insert
 user       | partition_mem_batch                    | Number of partition in-memory batch
 user       | prefetch_quantity                      | Sets the IO quantity of prefetch buffers used by async dirct IO interface.
 user       | psort_work_mem                         | Sets the maximum memory to be used for partial sort.
 user       | query_max_mem                          | Sets the max memory to be reserved for a statement.
 user       | uncontrolled_memory_context            | Sets the white list of MemoryContext allocation.
 user       | query_mem                              | Sets the memory to be reserved for a statement.
 user       | temp_buffers                           | Sets the maximum number of temporary buffers used by each session.
 user       | work_mem                               | Sets the maximum memory to be used for query workspaces.
 user       | auto_explain_level                     | auto_explain_level.
 user       | bbox_dump_count                        | Sets the maximum number of core dump created by bbox_handler.
 user       | cgroup_name                            | Sets the cgroup name to control the queries resource.
 user       | enable_auto_explain                    | enable auto explain plans.
 user       | io_limits                              | Sets io_limit  for each query.
 user       | io_priority                            | Sets the IO priority for queries.
 user       | query_band                             | Sets query band.
 user       | resource_track_level                   | Choose which level info to be collected.
 user       | session_respool                        | Sets the session resource pool to control the queries resource.
 user       | resource_track_cost                    | Sets the minimum cost to do resource track.
 user       | resource_track_duration                | Sets the minimum duration to record history session info.
 user       | transaction_pending_time               | Sets pend_time for transaction or Stored Procedure.
 user       | table_skewness_warning_rows            | Sets the number of rows returned by DN to enable warning of table skewness.
 user       | table_skewness_warning_threshold       | table skewness threthold
 user       | ngram_gram_size                        | N-value for N-gram parser
 user       | ngram_grapsymbol_ignore                | Enables N-gram ignore grapsymbol.
 user       | check_implicit_conversions             | check whether there is an implicit conversion on index column
 user       | convert_string_to_digit                | Convert string to digit when comparing string and digit
 user       | ngram_punctuation_ignore               | Enables N-gram ignore punctuation.
 user       | acce_min_datasize_per_thread           | Used to estimate whether pushdown the plan to the compute pool.
 user       | cstore_insert_mode                     | decide destination of data inserted
 user       | dfs_partition_directory_length         | The max length of the value partition directory.
 user       | enable_save_datachanged_timestamp      | If true, save the timestamp when the data of the table changes.
 user       | explain_perf_mode                      | Choose which style to print the explain info.
 user       | hll_default_expthresh                  | Set parameter expthresh in hll.
 user       | hll_default_log2m                      | Set parameter log2m in hll.
 user       | hll_default_regwidth                   | Set parameter regwidth in hll.
 user       | hll_default_sparseon                   | Set parameter sparseon for hll.
 user       | hll_max_sparse                         | Set parameter max_sparse for hll
 user       | max_active_global_temporary_table      | max active global temporary table.
 user       | show_acce_estimate_detail              | If true, show details whether plan is pushed down to the compute pool.
 user       | skew_option                            | Choose data skew optimization strategy.
 user       | behavior_compat_options                | compatibility options
 user       | transform_null_equals                  | Treats "expr=NULL" as "expr IS NULL".
 user       | array_nulls                            | Enables input of NULL elements in arrays.
 user       | backslash_quote                        | Sets whether "\'" is allowed in string literals.
 user       | default_with_oids                      | Creates new tables with OIDs by default.
 user       | escape_string_warning                  | Warn about backslash escapes in ordinary string literals.
 user       | quote_all_identifiers                  | When generating SQL fragments, quotes all identifiers.
 user       | sql_inheritance                        | Causes subtables to be included by default in various commands.
 user       | standard_conforming_strings            | Causes '...' strings to treat backslashes literally.
 user       | synchronize_seqscans                   | Enables synchronized sequential scans.
 user       | basebackup_timeout                     | Sets the timeout in seconds for a reponse from gs_basebackup.
 user       | commit_delay                           | Sets the delay in microseconds between transaction commit and flushing WAL to disk.
 user       | commit_siblings                        | Sets the minimum concurrent open transactions before performing commit_delay.
 user       | synchronous_commit                     | Sets the current transaction's synchronization level.
 user       | retry_ecode_list                       | Set error code list for CN Retry.
 user       | enable_twophase_commit                 | Enable two phase commit when gtm free is on.
(601 rows)
```
