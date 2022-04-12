+++

title = "MogDB/openGauss数据完整性约束简介" 

date = "2022-04-12" 

tags = ["MogDB/openGauss数据完整性约束简介"] 

archives = "2022-04" 

author = "郭欢" 

summary = "MogDB/openGauss数据完整性约束简介"

img = "/zh/post/guohuan/title/img.png" 

times = "10:20"
+++

# MogDB/openGauss数据完整性约束简介

创建基本表的同时，还可以指定表中数据完整性约束，例如在创建warehouse基本表时，通过分析可以得到如下结论：

1. 不同仓库必须有不同的w_id，且w_id不能为NULL。
2. 仓库必须有具体的名称，不能为NULL。
3. 仓库所在的街区地址长度不能为0。
4. 仓库所在国家默认为“CN”。

因此可以在创建warehouse基本表时指定这些约束。

例1：创建带有完整性约束的基本表，语句如下：

```sql
CREATE TABLE warehouse
(
  w_id SMALLINT PRIMARY KEY,
  w_name VARCHAR(10) NOT NULL,
  w_street_1 VARCHAR(20) CHECK(LENGTH(w_street_1)<>0),
  w_street_2 VARCHAR(20) CHECK(LENGTH(w_street_1)<>0),
  w_city VARCHAR(20),
  w_state CHAR(2) DEFAULT 'CN',
  w_zip CHAR(9),
  w_tax DECIMAL(4,2),
  w_ytd DECIMAL(12,2)
);
```

如果向warehouse基本表中写入不符合完整性约束的值，那么数据不能被写入，数据库会提示错误。

例2：向w_name列中写入NULL值，不符合完整性约束，写入数据时会报错，数据写入不成功，语句如下：

```sql
INSERT INTO warehouse VALUES(1,NULL,'','',NULL,'CN',NULL,1.0,1.0);
ERROR:  null value in column "w_name" violates not-null constraint
DETAIL:  Failing row contains (1, null, null, null, null, CN, null, 1.00, 1.00).
```

除了在列定义之后指定完整性约束之外，还可以使用表级的完整性约束来指定。

例3：在表定义上指定完整性约束，NULL约束只能在列定义上指定：

```sql
CREATE TABLE warehouse
(
  w_id SMALLINT,
  w_name VARCHAR(10) NOT NULL, --设置NULL约束
  w_street_1 VARCHAR(20),
  w_street_2 VARCHAR(20),
  w_city VARCHAR(20),
  w_state CHAR(2) DEFAULT 'CN',  --设置默认值
  w_zip CHAR(9),
  w_tax DECIMAL(4,2),
  w_ytd DECIMAL(12,2),
  CONSTRAINT w_id_pkey PRIMARY KEY(w_id),  --增加主键约束
  CONSTRAINT w_street_1_chk CHECK(LENGTH(w_street_1) < 100),  --增加CHECK约束
  CONSTRAINT w_street_2_chk CHECK(LENGTH(w_street_2) < 100),  --增加CHECK约束
);
```

当一个表中的某一列或多列恰好引用的是另一个表的主键（或具有唯一性）时，可以将其定义为外键，外键表示两个表之间相互的关联关系。外键的定义可以直接在属性上定义，也可以在基本表的创建语句中定义。

例4：在新订单表new_orders中引用仓库表warehouse的列称为外键，语句如下：

```sql
CREATE TABLE new_orders (  no_o_id INTEGER NOT NULL,  no_d_id SMALLINT NOT NULL,  no_w_id SMALLINT NOT NULL REFERENCE warehouse(w_id) ); 
```

还可以通过ALTER TABLE语句对完整性约束进行修改。

例5：在warehouse表中增加主键列：

```sql
ALTER TABLE warehouse ADD PRIMARY KEY(w_id); 
```

例6：在warehouse表中增加CHECK约束：

```sql
ALTER TABLE warehouse ADD CHECK(LENGTH(w_street_1) < 100); 
```

例7：在warehouse表中增加外键引用：

```sql
ALTER TABLE warehouse ADD FOREIGN KEY(no_w_id) REFERENCES warehouse(w_id); 
```

例8：在new_orders表中增加唯一列：

```sql
ALTER TABLE new_orders ADD UNIQUE(no_o_id, no_d_id, no_w_id);
```
