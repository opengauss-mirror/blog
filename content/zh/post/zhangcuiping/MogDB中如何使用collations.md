+++

title = "MogDB中如何使用collations" 

date = "2022-07-21" 

tags = ["MogDB中如何使用collations"] 

archives = "2022-07" 

author = "张翠娉" 

summary = "MogDB中如何使用collations"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "14:20"

+++

# MogDB中如何使用collations？

与Oracle相比，MogDB对collation的支持依赖于操作系统。

以下是基于麒麟v10的测试结果

```bash
[ommdoc@hostname ~]$ env | grep LANG
LANG=zh_CN.UTF-8
```

使用initdb初始化集群的时候，就会使用这些操作系统的配置。

```sql
MogDB=# \l
                               List of databases
   Name    | Owner  | Encoding |   Collate   |    Ctype    | Acce
ss privileges 
-----------+--------+----------+-------------+-------------+-----
--------------
 postgres  | ommdoc | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 | 
 template0 | ommdoc | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 | =c/o
mmdoc        +
           |        |          |             |             | ommd
oc=CTc/ommdoc
 template1 | ommdoc | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 | =c/o
mmdoc        +
           |        |          |             |             | ommd
oc=CTc/ommdoc
(3 rows)
```

在新建数据库的时候，可以指定数据库的默认的collation：

```sql
MogDB=# CREATE DATABASE abce with LC_COLLATE ='en_US.UTF-8';
CREATE DATABASE
```

但是，指定的collation必须是与template库兼容的。或者，使用template0作为模板。

如果想看看操作系统支持哪些collations，可以执行：

```bash
[ommdoc@hostname ~]$ localectl list-locales
C.UTF-8
aa_DJ.UTF-8
aa_ER.UTF-8
aa_ER.UTF-8@saaho
aa_ET.UTF-8
af_ZA.UTF-8
agr_PE.UTF-8
ak_GH.UTF-8
am_ET.UTF-8
an_ES.UTF-8
anp_IN.UTF-8
ar_AE.UTF-8
ar_BH.UTF-8
ar_DZ.UTF-8
```

**补充：POSTGRESQL 自定义排序规则**

#### 业务场景

平时我们会遇到某种业务，例如：超市里统计哪一种水果最好卖，并且优先按地区排序，以便下次进货可以多进些货。

这种业务就需要我们使用自定义排序规则(当然可以借助多字段多表实现类似需求，但这里将使用最简单的方法--无需多表和多字段，自定义排序规则即可实现)

#### 创建表

id为数据唯一标识，area为区域，area_code为区域代码，code为水果代码，sale_num为销量，price价格

```
MogDB=# CREATE TABLE sale_fruit_count (
 id INTEGER primary key,
 name VARCHAR(50),
 code VARCHAR(10),
 area VARCHAR(50),
    area_code VARCHAR(10),
 sale_num INTEGER,
 price INTEGER
)MogDB(# MogDB(# MogDB(# MogDB(# MogDB(# MogDB(# MogDB(# MogDB(# ;
NOTICE:  CREATE TABLE / PRIMARY KEY will create implicit index "sale_fruit_count_pkey" for table "sale_fruit_count"
CREATE TABLE
MogDB=#
```

#### 表中插入数据

```
MogDB=# select * from sale_fruit_count;
 id |  name  |   code   | area | area_code | sale_num | price 
----+--------+----------+------+-----------+----------+-------
  1 | 菠萝   | boluo    | 云南 | YN        |       32 |     8
  2 | 哈密瓜 | hamigua  | 新疆 | XJ        |       66 |    10
  3 | 苹果   | pingguo  | 陕西 | SX        |      113 |     3
  4 | 西瓜   | xigua    | 新疆 | XJ        |      305 |     2
  5 | 蜜桃   | mitao    | 四川 | SC        |      164 |     4
  6 | 香蕉   | hainan   | 海南 | HN        |      281 |     3
  7 | 葡萄   | putao    | 新疆 | XJ        |      210 |     5
  8 | 猕猴桃 | mihoutao | 陕西 | SX        |      912 |     9
(8 rows)
```

#### 自定义排序规则

同时依据地区、销售数量排序(地区自定义排序规则)

海南>陕西>四川>云南>新疆 (ps:距离优先原则)

#### 按排序规则查询

如果按照以往排序直接进行area_code排会发现跟我们预期效果不一样：

```
MogDB=# select * from sale_fruit_count order by area_code, sale_num desc;
 id |  name  |   code   | area | area_code | sale_num | price 
----+--------+----------+------+-----------+----------+-------
  6 | 香蕉   | hainan   | 海南 | HN        |      281 |     3
  5 | 蜜桃   | mitao    | 四川 | SC        |      164 |     4
  8 | 猕猴桃 | mihoutao | 陕西 | SX        |      912 |     9
  3 | 苹果   | pingguo  | 陕西 | SX        |      113 |     3
  4 | 西瓜   | xigua    | 新疆 | XJ        |      305 |     2
  7 | 葡萄   | putao    | 新疆 | XJ        |      210 |     5
  2 | 哈密瓜 | hamigua  | 新疆 | XJ        |       66 |    10
  1 | 菠萝   | boluo    | 云南 | YN        |       32 |     8
(8 rows)
```

我们看到地域排序是按照字母编码排序的，因此需要改造排序规则：

```
MogDB=# select * 
 from sale_fruit_count
 order by case area_code
     when 'HN' then 1
     when 'SX' then 2
  when 'SC' then 3
  when 'YN' then 4
  when 'XJ' then 5
  end asc
 , sale_num descMogDB-# MogDB-# MogDB-# MogDB-# MogDB-# MogDB-# MogDB-# MogDB-# MogDB-# ;
 id |  name  |   code   | area | area_code | sale_num | price 
----+--------+----------+------+-----------+----------+-------
  6 | 香蕉   | hainan   | 海南 | HN        |      281 |     3
  8 | 猕猴桃 | mihoutao | 陕西 | SX        |      912 |     9
  3 | 苹果   | pingguo  | 陕西 | SX        |      113 |     3
  5 | 蜜桃   | mitao    | 四川 | SC        |      164 |     4
  1 | 菠萝   | boluo    | 云南 | YN        |       32 |     8
  4 | 西瓜   | xigua    | 新疆 | XJ        |      305 |     2
  7 | 葡萄   | putao    | 新疆 | XJ        |      210 |     5
  2 | 哈密瓜 | hamigua  | 新疆 | XJ        |       66 |    10
(8 rows)
```

此时即实现了自定义排序。