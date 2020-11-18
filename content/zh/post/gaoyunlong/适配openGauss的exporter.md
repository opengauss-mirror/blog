+++

title = "适配openGauss的exporter" 

date = "2020-11-17" 

tags = ["适配openGauss的exporter"] 

archives = "2020-11" 

author = "高云龙" 

summary = "适配openGauss的exporter"

img = "/zh/post/gaoyunlong/title/title.PNG" 

times = "13:30"

+++

# 适配openGauss的exporter<a name="ZH-CN_TOPIC_0291959509"></a>

基于postgres\_exporter-0.8.0 适配 openGauss。

针对postgres\_exporter.go文件做修改。

## 数据库用户<a name="section82326216206"></a>

新建一个exporter的数据库用户，需要**sysadmin**权限，否则有些系统视图无法获取数据。

新建用户之前，需要修改加密参数，由sha256 改成md5。

password\_encryption\_type = 0

## 版本号适配<a name="section1570064418206"></a>

```
//var versionRegex = regexp.MustCompile(`^\w+ ((\d+)(\.\d+)?(\.\d+)?)`)
//var lowestSupportedVersion = semver.MustParse("9.1.0")

//opengauss
var versionRegex = regexp.MustCompile(`^\(?\w+ ((\d+)(\.\d+)?(\.\d+)?)`)
var lowestSupportedVersion = semver.MustParse("1.0.0")
```

## 系统视图适配<a name="section1664515378225"></a>

pg\_stat\_archiveropengauss 不支持该系统视图，去掉。

```
//	"pg_stat_archiver": {
//		map[string]ColumnMapping{
//			"archived_count":     {COUNTER, "Number of WAL files that have been successfully archived", nil, nil},
//			"last_archived_wal":  {DISCARD, "Name of the last WAL file successfully archived", nil, nil},
//			"last_archived_time": {DISCARD, "Time of the last successful archive operation", nil, nil},
//			"failed_count":       {COUNTER, "Number of failed attempts for archiving WAL files", nil, nil},
//			"last_failed_wal":    {DISCARD, "Name of the WAL file of the last failed archival operation", nil, nil},
//			"last_failed_time":   {DISCARD, "Time of the last failed archival operation", nil, nil},
//			"stats_reset":        {DISCARD, "Time at which these statistics were last reset", nil, nil},
//			"last_archive_age":   {GAUGE, "Time in seconds since last WAL segment was successfully archived", nil, nil},
//		},
//		true,
//		0,
//	},


//	"pg_stat_archiver": {
//		{
//			semver.MustParseRange(">=0.0.0"),
//			`
//			SELECT *,
//				extract(epoch from now() - last_archived_time) AS last_archive_age
//			FROM pg_stat_archiver
//			`,
//		},
//	},
```

pg\_stat\_activity 系统视图。

```
//semver.MustParseRange(">=9.2.0"),
semver.MustParseRange(">=1.0.0"),


//		{
//			semver.MustParseRange("<9.2.0"),
//			`
//			SELECT
//				datname,
//				'unknown' AS state,
//				COALESCE(count(*),0) AS count,
//				COALESCE(MAX(EXTRACT(EPOCH FROM now() - xact_start))::float,0) AS max_tx_duration
//			FROM pg_stat_activity GROUP BY datname
//			`,
//		},
```

pg\_stat\_replication 系统视图。

```
//		map[string]ColumnMapping{
//			"procpid":          {DISCARD, "Process ID of a WAL sender process", nil, semver.MustParseRange("<9.2.0")},
//			"pid":              {DISCARD, "Process ID of a WAL sender process", nil, semver.MustParseRange(">=9.2.0")},
//			"usesysid":         {DISCARD, "OID of the user logged into this WAL sender process", nil, nil},
//			"usename":          {DISCARD, "Name of the user logged into this WAL sender process", nil, nil},
//			"application_name": {LABEL, "Name of the application that is connected to this WAL sender", nil, nil},
//			"client_addr":      {LABEL, "IP address of the client connected to this WAL sender. If this field is null, it indicates that the client is connected via a Unix socket on the server machine.", nil, nil},
//			"client_hostname":  {DISCARD, "Host name of the connected client, as reported by a reverse DNS lookup of client_addr. This field will only be non-null for IP connections, and only when log_hostname is enabled.", nil, nil},
//			"client_port":      {DISCARD, "TCP port number that the client is using for communication with this WAL sender, or -1 if a Unix socket is used", nil, nil},
//			"backend_start": {DISCARD, "with time zone	Time when this process was started, i.e., when the client connected to this WAL sender", nil, nil},
//			"backend_xmin":             {DISCARD, "The current backend's xmin horizon.", nil, nil},
//			"state":                    {LABEL, "Current WAL sender state", nil, nil},
//			"sent_location":            {DISCARD, "Last transaction log position sent on this connection", nil, semver.MustParseRange("<10.0.0")},
//			"write_location":           {DISCARD, "Last transaction log position written to disk by this standby server", nil, semver.MustParseRange("<10.0.0")},
//			"flush_location":           {DISCARD, "Last transaction log position flushed to disk by this standby server", nil, semver.MustParseRange("<10.0.0")},
//			"replay_location":          {DISCARD, "Last transaction log position replayed into the database on this standby server", nil, semver.MustParseRange("<10.0.0")},
//			"sent_lsn":                 {DISCARD, "Last transaction log position sent on this connection", nil, semver.MustParseRange(">=10.0.0")},
//			"write_lsn":                {DISCARD, "Last transaction log position written to disk by this standby server", nil, semver.MustParseRange(">=10.0.0")},
//			"flush_lsn":                {DISCARD, "Last transaction log position flushed to disk by this standby server", nil, semver.MustParseRange(">=10.0.0")},
//			"replay_lsn":               {DISCARD, "Last transaction log position replayed into the database on this standby server", nil, semver.MustParseRange(">=10.0.0")},
//			"sync_priority":            {DISCARD, "Priority of this standby server for being chosen as the synchronous standby", nil, nil},
//			"sync_state":               {DISCARD, "Synchronous state of this standby server", nil, nil},
//			"slot_name":                {LABEL, "A unique, cluster-wide identifier for the replication slot", nil, semver.MustParseRange(">=9.2.0")},
//			"plugin":                   {DISCARD, "The base name of the shared object containing the output plugin this logical slot is using, or null for physical slots", nil, nil},
//			"slot_type":                {DISCARD, "The slot type - physical or logical", nil, nil},
//			"datoid":                   {DISCARD, "The OID of the database this slot is associated with, or null. Only logical slots have an associated database", nil, nil},
//			"database":                 {DISCARD, "The name of the database this slot is associated with, or null. Only logical slots have an associated database", nil, nil},
//			"active":                   {DISCARD, "True if this slot is currently actively being used", nil, nil},
//			"active_pid":               {DISCARD, "Process ID of a WAL sender process", nil, nil},
//			"xmin":                     {DISCARD, "The oldest transaction that this slot needs the database to retain. VACUUM cannot remove tuples deleted by any later transaction", nil, nil},
//			"catalog_xmin":             {DISCARD, "The oldest transaction affecting the system catalogs that this slot needs the database to retain. VACUUM cannot remove catalog tuples deleted by any later transaction", nil, nil},
//			"restart_lsn":              {DISCARD, "The address (LSN) of oldest WAL which still might be required by the consumer of this slot and thus won't be automatically removed during checkpoints", nil, nil},
//			"pg_current_xlog_location": {DISCARD, "pg_current_xlog_location", nil, nil},
//			"pg_current_wal_lsn":       {DISCARD, "pg_current_xlog_location", nil, semver.MustParseRange(">=10.0.0")},
//			"pg_current_wal_lsn_bytes": {GAUGE, "WAL position in bytes", nil, semver.MustParseRange(">=10.0.0")},
//			"pg_xlog_location_diff":    {GAUGE, "Lag in bytes between master and slave", nil, semver.MustParseRange(">=9.2.0 <10.0.0")},
//			"pg_wal_lsn_diff":          {GAUGE, "Lag in bytes between master and slave", nil, semver.MustParseRange(">=10.0.0")},
//			"confirmed_flush_lsn":      {DISCARD, "LSN position a consumer of a slot has confirmed flushing the data received", nil, nil},
//			"write_lag":                {DISCARD, "Time elapsed between flushing recent WAL locally and receiving notification that this standby server has written it (but not yet flushed it or applied it). This can be used to gauge the delay that synchronous_commit level remote_write incurred while committing if this server was configured as a synchronous standby.", nil, semver.MustParseRange(">=10.0.0")},
//			"flush_lag":                {DISCARD, "Time elapsed between flushing recent WAL locally and receiving notification that this standby server has written and flushed it (but not yet applied it). This can be used to gauge the delay that synchronous_commit level remote_flush incurred while committing if this server was configured as a synchronous standby.", nil, semver.MustParseRange(">=10.0.0")},
//			"replay_lag":               {DISCARD, "Time elapsed between flushing recent WAL locally and receiving notification that this standby server has written, flushed and applied it. This can be used to gauge the delay that synchronous_commit level remote_apply incurred while committing if this server was configured as a synchronous standby.", nil, semver.MustParseRange(">=10.0.0")},
//		},
		map[string]ColumnMapping{
			"pid":              {DISCARD, "Process ID of a WAL sender process", nil, semver.MustParseRange(">=1.0.0")},
			"usesysid":         {DISCARD, "OID of the user logged into this WAL sender process", nil, nil},
			"usename":          {DISCARD, "Name of the user logged into this WAL sender process", nil, nil},
			"application_name": {LABEL, "Name of the application that is connected to this WAL sender", nil, nil},
			"client_addr":      {LABEL, "IP address of the client connected to this WAL sender. If this field is null, it indicates that the client is connected via a Unix socket on the server machine.", nil, nil},
			"client_hostname":  {DISCARD, "Host name of the connected client, as reported by a reverse DNS lookup of client_addr. This field will only be non-null for IP connections, and only when log_hostname is enabled.", nil, nil},
			"client_port":      {DISCARD, "TCP port number that the client is using for communication with this WAL sender, or -1 if a Unix socket is used", nil, nil},
			"backend_start": 	{DISCARD, "with time zone	Time when this process was started, i.e., when the client connected to this WAL sender", nil, nil},
			"backend_xmin":     {DISCARD, "The current backend's xmin horizon.", nil, nil},
			"state":            {LABEL, "Current WAL sender state", nil, nil},
			"sender_sent_location":            	 {DISCARD, "Last transaction log position sent on this connection", nil, semver.MustParseRange(">=1.0.0")},
			"receiver_write_location":           {DISCARD, "Last transaction log position written to disk by this standby server", nil, semver.MustParseRange(">=1.0.0")},
			"receiver_flush_location":           {DISCARD, "Last transaction log position flushed to disk by this standby server", nil, semver.MustParseRange(">=1.0.0")},
			"receiver_replay_location":          {DISCARD, "Last transaction log position replayed into the database on this standby server", nil, semver.MustParseRange(">=1.0.0")},
			"sync_priority":            {DISCARD, "Priority of this standby server for being chosen as the synchronous standby", nil, nil},
			"sync_state":               {DISCARD, "Synchronous state of this standby server", nil, nil},
			"slot_name":                {LABEL, "A unique, cluster-wide identifier for the replication slot", nil, nil},
			"plugin":                   {DISCARD, "The base name of the shared object containing the output plugin this logical slot is using, or null for physical slots", nil, nil},
			"slot_type":                {DISCARD, "The slot type - physical or logical", nil, nil},
			"datoid":                   {DISCARD, "The OID of the database this slot is associated with, or null. Only logical slots have an associated database", nil, nil},
			"database":                 {DISCARD, "The name of the database this slot is associated with, or null. Only logical slots have an associated database", nil, nil},
			"active":                   {DISCARD, "True if this slot is currently actively being used", nil, nil},
			"active_pid":               {DISCARD, "Process ID of a WAL sender process", nil, nil},
			"xmin":                     {DISCARD, "The oldest transaction that this slot needs the database to retain. VACUUM cannot remove tuples deleted by any later transaction", nil, nil},
			"catalog_xmin":             {DISCARD, "The oldest transaction affecting the system catalogs that this slot needs the database to retain. VACUUM cannot remove catalog tuples deleted by any later transaction", nil, nil},
			"restart_lsn":              {DISCARD, "The address (LSN) of oldest WAL which still might be required by the consumer of this slot and thus won't be automatically removed during checkpoints", nil, nil},
			"pg_current_xlog_location": {DISCARD, "pg_current_xlog_location", nil, nil},
			"pg_xlog_location_diff":    {GAUGE, "Lag in bytes between master and slave", nil, semver.MustParseRange(">=1.0.0")},
			"confirmed_flush_lsn":      {DISCARD, "LSN position a consumer of a slot has confirmed flushing the data received", nil, nil},
		},

//		{
//			semver.MustParseRange(">=10.0.0"),
//			`
//			SELECT *,
//				(case pg_is_in_recovery() when 't' then null else pg_current_wal_lsn() end) AS pg_current_wal_lsn,
//				(case pg_is_in_recovery() when 't' then null else pg_wal_lsn_diff(pg_current_wal_lsn(), pg_lsn('0/0'))::float end) AS pg_current_wal_lsn_bytes,
//				(case pg_is_in_recovery() when 't' then null else pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn)::float end) AS pg_wal_lsn_diff
//			FROM pg_stat_replication
//			`,
//		},

		{
			semver.MustParseRange(">=1.0.0"),
			`
			SELECT *,
				(case pg_is_in_recovery() when 't' then null else pg_current_xlog_location() end) AS pg_current_xlog_location,
				(case pg_is_in_recovery() when 't' then null else pg_xlog_location_diff(pg_current_xlog_location(), receiver_replay_location)::float end) AS pg_xlog_location_diff
			FROM pg_stat_replication
			`,
		},

//		{
//			semver.MustParseRange("<9.2.0"),
//			`
//			SELECT *,
//				(case pg_is_in_recovery() when 't' then null else pg_current_xlog_location() end) AS pg_current_xlog_location
//			FROM pg_stat_replication
//			`,
//		},
```

