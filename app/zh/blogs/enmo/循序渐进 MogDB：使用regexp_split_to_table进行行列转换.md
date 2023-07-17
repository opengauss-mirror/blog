---
title: '循序渐进 MogDB：使用regexp_split_to_table进行行列转换'

date: '2022-07-14'

category: 'blog'
tags: ['循序渐进 MogDB：使用regexp_split_to_table进行行列转换']

archives: '2022-07'

author: '云和恩墨'

summary: '循序渐进 MogDB：使用regexp_split_to_table进行行列转换'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# 循序渐进 MogDB：使用 regexp_split_to_table 进行行列转换


在数据库的数据处理中，进行行列转换是常见的需求。在 MogDB 中，可以通过 regexp_split_to_table 将数据项按照特定字符，切分成数据表形式，便于特定属性的数据提取；类似的 regexp_split_to_array 可以将特定数据转换成数组，从而可以通过数组进行特定偏移量的数据提取。

看一个测试用例，使用的是 MogDB 3.0 版本数据库。

```
MogDB=#select * from v$version;
                      banner
--------------------------------------------------
 MogDB 3.0.0 build 945141ad
 compiled at 2022-05-28 16:20:01
 Platform architecture: aarch64-unknown-linux-gnu
(3 rows)
```

首先创建一个 专家列表，每个专家具备不同的技术技能：

```
MogDB=#CREATE TABLE expertlist
(
    user_name varchar2(20) NOT NULL,
    skillarea varchar2(200),
    CONSTRAINT pkey_uname PRIMARY KEY (user_name)
);
NOTICE:  CREATE TABLE / PRIMARY KEY will create implicit index "pkey_uname" for table "expertlist"
```

创建测试数据：

```
MogDB=#INSERT INTO expertlist(user_name, skillarea) VALUES ('盖国强', 'MogDB,openGauss,Oracle,MySQL');
INSERT INTO expertlist(user_name, skillarea) VALUES ('杨廷琨', 'Oracle,Exadata,zData,MogDB,DB2');
INSERT INTO expertlist(user_name, skillarea) VALUES ('李真旭', 'Oracle,Exadata,zData,zCloud,DB2,MogDB');
INSERT INTO expertlist(user_name, skillarea) VALUES ('张乐奕', 'MogDB,Oracle,Exadata,zCloud');
INSERT INTO expertlist(user_name, skillarea) VALUES ('熊军', 'zCloud,zData,SQM,Oracle');
INSERT INTO expertlist(user_name, skillarea) VALUES ('云和恩墨', 'MogDB,zData,zCloud,SQM,Bethune');
```

以逗号为分隔符，regexp_split_to_table 能够将数据转换为多行输出形式：

```
MogDB=#select user_name, regexp_split_to_table(skillarea, ',') as skillarea from expertlist;
  user_name   | skillarea
--------------+-----------
 盖国强    | MogDB
 盖国强    | openGauss
 盖国强    | Oracle
 盖国强    | MySQL
 杨廷琨    | Oracle
 杨廷琨    | Exadata
 杨廷琨    | zData
 杨廷琨    | MogDB
 杨廷琨    | DB2
 李真旭    | Oracle
 李真旭    | Exadata
 李真旭    | zData
 李真旭    | zCloud
 李真旭    | DB2
 李真旭    | MogDB
 张乐奕    | MogDB
 张乐奕    | Oracle
 张乐奕    | Exadata
 张乐奕    | zCloud
 熊军       | zCloud
 熊军       | zData
 熊军       | SQM
 熊军       | Oracle
 云和恩墨 | MogDB
 云和恩墨 | zData
 云和恩墨 | zCloud
 云和恩墨 | SQM
 云和恩墨 | Bethune
(28 rows)
```

对表数据进行限定筛选查询，我们就找到了具备 MogDB 技能的专家和组织：

```
MogDB=#select
    t.user_name,
    t.skillarea
from (
    select user_name, regexp_split_to_table(skillarea, ',') as skillarea from expertlist
) t
where t.skillarea = 'MogDB';######
  user_name   | skillarea
--------------+-----------
 盖国强    | MogDB
 杨廷琨    | MogDB
 李真旭    | MogDB
 张乐奕    | MogDB
 云和恩墨 | MogDB
(5 rows)
```

通过 regexp_split_to_array 则可以将数据转换为数组：

```
MogDB=#select user_name, regexp_split_to_array(skillarea, ',') as arr_skill from expertlist;
  user_name   |                arr_skill
--------------+-----------------------------------------
 盖国强    | {MogDB,openGauss,Oracle,MySQL}
 杨廷琨    | {Oracle,Exadata,zData,MogDB,DB2}
 李真旭    | {Oracle,Exadata,zData,zCloud,DB2,MogDB}
 张乐奕    | {MogDB,Oracle,Exadata,zCloud}
 熊军       | {zCloud,zData,SQM,Oracle}
 云和恩墨 | {MogDB,zData,zCloud,SQM,Bethune}
(6 rows)
```

以下查询则是找到了每个专家的第一技能：

```
MogDB=#select
    t.user_name,
    t.arr_skill[1]
from (
    select user_name, regexp_split_to_array(skillarea, ',') as arr_skill from expertlist
) t#####;
  user_name   | arr_skill
--------------+-----------
 盖国强    | MogDB
 杨廷琨    | Oracle
 李真旭    | Oracle
 张乐奕    | MogDB
 熊军       | zCloud
 云和恩墨 | MogDB
(6 rows)
```
