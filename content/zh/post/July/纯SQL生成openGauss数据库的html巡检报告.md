+++

title =  "纯SQL生成openGauss数据库的html巡检报告" 

date = "2021-10-26" 

tags = [ "纯SQL生成openGauss数据库的html巡检报告"] 

archives = "2021-10" 

author = "小麦苗" 

summary = "纯SQL生成openGauss数据库的html巡检报告"

img = "/zh/post/July/title/img4.png" 

times = "12:30"

+++



# 纯SQL生成openGauss数据库的html巡检报告<a name="ZH-CN_TOPIC_0000001154714468"></a>



## 1、巡检脚本简介<a name="section2355912161920"></a>

该套巡检脚本为纯SQL脚本开发，如下所示：

![](figures/巡检脚本为纯SQL脚本开发.png)

目前一共包含13个脚本，若脚本的扩展名为“.sql”则表示该脚本为sql脚本；若脚本的扩展名为“.pl”则表示该脚本为perl脚本；若脚本的扩展名为“.sh”则表示该脚本为shell脚本。

对于Oracle的SQL脚本而言，脚本DB\_Oracle\_HC\_lhr\_v7.0.0\_10g.sql适用于Oracle 10g数据库，脚本DB\_Oracle\_HC\_lhr\_v7.0.0\_11g.sql适用于Oracle 11g的数据库，脚本DB\_Oracle\_HC\_lhr\_v7.0.0\_12c.sql适用于Oracle 12c及其以上版本，这3个脚本都是只读版本，这3个脚本只会对数据库做查询操作，不会做DML和DDL操作，这也是很多朋友所期待的功能。

脚本DB\_OS\_HC\_lhr\_v7.0.0.pl是perl脚本，执行后会对OS的信息进行收集，并且输出到html中。脚本DB\_OS\_HC\_lhr\_v7.0.0.sh是shell脚本，执行后会对OS的信息进行收集。

脚本DB\_MySQL\_HC\_lhr\_v7.0.0.sql是MySQL脚本，执行后会产生MySQL的健康检查html报告，该脚本为只读脚本。

脚本DB\_MSSQL\_HC\_lhr\_v7.0.0\_2005.sql和DB\_MSSQL\_HC\_lhr\_v7.0.0\_2008R2.sql是SQL Server脚本，存在部分DDL和DML操作，执行后会产生SQL Server的健康检查html报告。脚本DB\_MSSQL\_HC\_lhr\_v7.0.0\_2005.sql最低支持2005版本，而脚本DB\_MSSQL\_HC\_lhr\_v7.0.0\_2008R2.sql最低支持2008R2版本。

脚本DB\_PG\_HC\_lhr\_v7.0.0.sql是PG数据库脚本，执行后会产生PostgreSQL数据库的健康检查html报告。

脚本DB\_DM\_HC\_lhr\_v7.0.0是达梦数据库脚本，执行后会产生达梦数据库的健康检查html报告。

脚本DB\_TiDB\_HC\_lhr\_v7.0.0.sql是TiDB数据库脚本，执行后会产生TiDB数据库的健康检查html报告。

脚本DB\_openGauss\_HC\_lhr\_v7.0.0.sql是openGauss数据库脚本，执行后会产生openGauss数据库的健康检查html报告。

## 2、巡检脚本特点<a name="section194931250182011"></a>

1、可以巡检Oracle、MySQL、SQL Server、PostgreSQL、TiDB、openGauss和国产达梦等7个数据库，也可以巡检Linux操作系统（后续会免费逐步增加MongoDB、db2、OceanBase、PolarDB、TDSQL、GBase、人大金仓等数据库）

2、脚本为绿色版、免安装、纯SQL文本

3、跨平台，只要有SQL\*Plus（Oracle）、mysql（MySQL、TiDB）、MSSQL客户端（SSMS、Navicat皆可）、psql（PG、openGauss）、gisql（国产达梦）、gsql（openGauss）环境即可运行脚本

4、脚本内容可视化，可以看到脚本内容，因此可供学习数据库使用

5、兼容Oracle 10g、11g、12c、18c、19c、20c、21c等高版本Oracle数据库

6、对Oracle 10g、11g、12c、18c、19c、20c、21c等版本分别提供了只读版（只对数据库查询，不做DDL和DML操作）

7、MySQL最低支持5.5版本

8、SQL Server最低支持2005版本

9、增删监控项非常方便，只需要提供相关SQL即可

10、一次购买，所有脚本终身免费升级

11、检查内容非常全面

12、针对每种数据库，只有1个SQL脚本，不存在嵌套调用脚本等其它问题

13、最终生成html文件格式的健康检查结果

14、对结果进行过滤，列出了数据库有问题的内容

15、对OS的信息提供了收集（单独脚本）

## 3、openGauss数据库运行方式<a name="section1443177172119"></a>

需要有华为的gsql客户端，或PostgreSQL数据库的psql客户端都可以，运行方式如下：

若是openGauss或华为的GaussDB数据库的gsql客户端，则执行：

```
gsql -U gaussdb -h 192.168.66.35 -p 15432 -d postgres -W'lhr@123XXT' -H -f D:\DB_openGauss_HC_lhr_v7.0.0.sql > d:\a.html
```

若是PostgreSQL数据库的psql客户端，则执行：

```
psql -U gaussdb -h 192.168.66.35 -p 54324 -d postgres -W -H -f D:\DB_openGauss_HC_lhr_v7.0.0.sql > d:\a.html
```

## 4、html巡检结果<a name="section3752341182113"></a>

这里只列出部分结果，其它的详细内容可以参考：https://share.weiyun.com/5lb2U2M

![](figures/html巡检结果.png)

![](figures/html巡检结果1.jpg)

其它不再列举。

