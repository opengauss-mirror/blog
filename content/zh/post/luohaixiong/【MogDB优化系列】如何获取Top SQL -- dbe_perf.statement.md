+++

title = "【MogDB优化系列】如何获取Top SQL -- dbe_perf.statement" 

date = "2023-01-30" 

tags = ["mogdb"] 

archives = "2023-01" 

author = "云和恩墨-罗海雄" 

summary = "【MogDB优化系列】如何获取Top SQL -- dbe_perf.statement"

img = "/zh/post/luohaixiong/title/img.png" 

times = "10:20"
+++

MogDB(其实也包括Opengauss, 以后如果不特意说明，Opengauss也同理)中，SQL的相关统计信息保存在 dbe_perf.statement表中。

值得注意的是，dbe_perf这个schema在一个实例的所有数据库中都可以访问到，且对应同一份数据。但权限控制比较严格，只有具有MonitorAdmin的用户有权限访问。甚至连授予了Sysadmin的用户都没有权限。当然，初始用户是有权限的，以至于有时用惯了初始用户，往往会忽略访问dbe_perf.*是需要额外权限的。
其他用户如果要访问，需要被授予MonitorAdmin权限。

```sql
create user xxx monadmin ....
```

或者

```sql
alter user xxx monadmin ....
```

dbe_perf.statement(后面提及可能会略去"dbe_perf."前缀）可以类比Oracle的vsql或者vsqlstat, 但有一点比较特殊，就是它记录的是“归一化”之后的SQL, 所谓的归一化，就是替换掉SQL文本里面的常量位和变量位为占位符？。这样就算没有使用绑定变量，统计的也是同样的SQL.

我经常使用的获取Top SQL的脚本是：

```sql
select unique_sql_id,round(total_elapse_time/1e6,1) "总执行时间",n_calls "执行次数",round(total_elapse_time/n_calls/1e3,2) "单次时间"
,round(cpu_time/n_calls/1e3,2) "单次CPU时间" ,round(data_io_time/n_calls/1e3,1) "单次IO时间"
,round(n_blocks_fetched/n_calls,1) "单次内存块",round((n_blocks_fetched-n_blocks_hit)/n_calls,1) "单次物理块"
,round(n_tuples_fetched/n_calls,1) "单次访问行数",round(n_tuples_returned/n_calls,1) "单次返回行数"
,substr(query,1,1024) "SQL文本"
from dbe_perf.statement  
where n_calls>0
order by  2 desc limit 30;
```

使用中文别名的原因是为了省去解释各个字段名称的篇幅。如果需要进一步了解，可以访问 [https://docs.mogdb.io/zh/mogdb/v3.0/STATEMENT](https://docs.mogdb.io/zh/mogdb/v3.0/STATEMENT)

此SQL取出的是根据总执行时间排序的前30条，当然，根据需要，你可以添加其他的列，也可以使用其他的排序规则，以获取自己需要的Top SQL.

有几个参数可以调节dbe_perf.statement里面的相关信息，主要是

- instr_unique_sql_count，设置数据库内statement记录的最大条数，默认100，根据需要可以调整的更大。
- track_stmt_details_size，设置statement里面query这一列的最大长度，默认4096，超过会截断。如果你的数据库中经常出现很大的SQL, 且你需要通过statement表获取准确的SQL文本，可以考虑改大一些。
  当然，改大这两个参数，会消耗更大的内存。