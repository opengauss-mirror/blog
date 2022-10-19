+++

title = "gs_dump备份恢复实践" 

date = "2022-10-19" 

tags = ["openGauss"] 

archives = "2022-10" 

author = "彭冲" 

summary = "gs_dump备份恢复实践"

img = "/zh/post/pengchong/title/img9.png" 

times = "10:20"
+++

# gs_dump备份恢复实践

本文出处：[https://www.modb.pro/db/481502](https://www.modb.pro/db/481502)

gs_dump可以对单个database进行备份，支持备份不同的schema结构或数据。

下面进行示例演示：

首先使用omm用户创建一个业务库

```
create database mes;
```

然后连接mes库，创建测试表mes1并插入数据

```
\c mes
create table mes1(id int,info1 text,info2 text);
insert into mes1 values(100,null,'aaa');
insert into mes1 values(200,'中国',null);
\q
```

此时数据表创建在公共的public模式下，表的owner为omm用户。

```
mes=# \dt
                        List of relations
 Schema | Name | Type  | Owner |             Storage              
--------+------+-------+-------+----------------------------------
 public | mes1 | table | omm   | {orientation=row,compression=no}
(1 row)
```

### 一、使用文本格式进行备份恢复

我们创建一个新库mes2

```
create database mes;
```

使用gs_dump进行如下调整：

- 使用普通用户mes作为宿主
- 使用与普通用户mes同名的schema作为逻辑容器，不使用public

先使用omm管理用户导出，导入恢复到mes2数据库

导入操作命令如下：

```
gs_dump --file=mes_way1.sql --schema=public --no-privileges  --no-owner --username=omm mes
```

接着修改导出文件，将search_path = public修改为search_path = mes

在mes2数据库下创建mes模式：

```
gsql  -U mes mes2 -r

create schema mes authorization mes;
```

omm管理用户进行恢复

```
gsql --file=mes_way1.sql --username=omm mes2 
```

此时数据表都移到mes模式下，并且mes已经作为数据表的owner。

总结：文本格式方便我们对内容进行修改调整。

### 二、使用section子项进行备份处理

section子项的作用可以参考这篇文章：[pg_dump子项section的三种开关](https://www.modb.pro/db/239879)

为了处理索引表空间问题，分别按section子项进行备份
1.数据备份前结构预处理

```
gs_dump  --file=mes_way2_pre.sql  --section=pre-data --schema=mes --no-subscriptions --username=mes mes2 
```

2.数据备份

```
gs_dump  --file=mes_way2_data.sql  --section=data --schema=mes --no-subscriptions --username=mes mes2 
```

3.数据备份后逻辑处理

```
gs_dump  --file=mes_way2_post.sql  --section=post-data --schema=mes --no-subscriptions --username=mes mes2 
```

新建数据库mes3进行处理

```
create database mes;
```

mes用户恢复先恢复预处理结构和数据

```
gsql --file=mes_way2_pre.sql --username=mes mes3 
gsql --file=mes_way2_data.sql --username=mes mes3 
```

然后对mes_way2_post.sql索引结构进行手工处理，处理完毕再执行下面语句。

```
gsql --file=mes_way2_post.sql --username=mes mes3 
```

总结：使用section选项方便我们对数据备份前后过程进行干预。

### 三、使用二进制进行备份

使用二进制备份效率比文本格式高，普通用户可以对自己的数据库对象进行备份及恢复，需要注意全局逻辑订阅的影响。

备份命令如下：

```
gs_dump  --file=mes_way3.dmp --format=c --schema=mes --no-subscriptions --username=mes mes2 
```

恢复操作如下：

```
gs_restore --username=mes -d mes3  mes_way3.dmp 
```

注意操作之前需要先删除相关对象，下面直接级联删除模式。

```
gsql  -U mes mes3 -r --password='mes@1234'
drop schema if exists mes cascade;
\q
```

总结：使用二进制选项备份效率最高，需要保证源与目标的结构一致性。
