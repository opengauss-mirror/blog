+++

title = "在MogDB-openGauss中创建索引" 

date = "2022-07-20" 

tags = ["MogDB"] 

archives = "2022-07" 

author = "云和恩墨-郭欢" 

summary = "在MogDB-openGauss中创建索引"

img = "/zh/post/guohuan/title/img.png" 

times = "10:20"

+++

# 在MogDB/openGauss中创建索引

为了提升数据的查询性能，可以为基本表创建索引。索引实际上是对基本表中的一列或多列数据进行预处理，例如创建B树索引是对数据进行排序之后，按照顺序创建基于磁盘的B树，从而提高访问效率。常见的索引有B树索引、哈希索引、位图索引等。

创建索引使用的是CREATE INDEX语句，它需要制定索引的名称以为要创建索引的基本表和基本表上的候选列。具体语句如下。

```sql
CREATE INDEX <索引名> ON <基本表名> (<列名1>, <列名2>,...);
```

为warehouse基本表创建一个基于w_id列的索引，默认是B树索引。具体语句如下。

```sql
MogDB=# CREATE INDEX warehouse_index ON warehouse(w_id);
CREATE INDEX
```

可以通过UNIQUE关键字来指定创建的索引是否具有唯一性。

为new_orders基本表创建一个基本全部列的索引。具体语句如下。

```sql
MogDB=# CREATE TABLE new_orders(
    no_o_id INTEGER NOT NULL,
    no_d_id SMALLINT NOT NULL,
    no_w_id SMALLINT NOT NULL
    );
CREATE TABLE
MogDB=# CREATE UNIQUE INDEX new_orders_index ON new_orders(no_o_id, no_d_id, no_w_id);
CREATE INDEX
```

UNIQUE关键字指定的唯一性和主键的唯一性有一些不同。主键中的所有列不能有NULL值，而UNIQUE关键字创建的唯一索引可以允许有NULL值，由于NULL值在SQL中代表的是不确定的值，无法做等值比较，所以UNIQUE索引的唯一性表现在可以具有NULL值，而且可以有多组NULL值。



