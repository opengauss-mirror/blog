+++

title = "MogDB中表模式定义简介" 

date = "2022-07-08" 

tags = ["MogDB"] 

archives = "2022-07" 

author = "云和恩墨-郭欢" 

summary = "MogDB中表模式定义简介"

img = "/zh/post/guohuan/title/img.png" 

times = "10:20"

+++

# MogDB中表模式定义简介

SQL是一种基于关系代数和关系演算的非过程化语言，它指定用户对数据进行哪些操作，而不指定如何操作数据，具有非过程化、简单易学、易迁移、高度统一等特点。MogDB数据库支持标准SQL。

在关系模型中，每个关系是一个数据实体，在SQL中可以通过CREATE TABLE命令创建一个基本表来代表一个“关系”，具体语句如下：

```sql
CREATE TABLE 表名 (
  列名 列数据类型，
  列名 列数据类型，
  ......
);
```

例1：创建一个包含仓库信息的基本表，具体语句如下：

```sql
CREATE TABLE warehouse
(
  w_id SMALLINT,
  w_name VARCHAR(10),
  w_street_1 VARCHAR(20),
  w_street_2 VARCHAR(20),
  w_city VARCHAR(20),
  w_state CHAR(2),
  w_zip CHAR(9),
  w_tax DECIMAL(4,2),
  w_ytd DECIMAL(12,2),
);
```

其中CREATE TABLE语句指定了SQL语义是要创建一个保存仓库信息的基本表，warehouse是要创建的基本表的名称，warehouse基本表中有9个列（属性），每个列都有自己固有的数据类型，可以根据列的要求指定其对应的长度，精度等信息，例如w_id是仓库编号信息，通过SMALLINT类型表示编号，而w_name是仓库名称，为VARCHAR类型，其最大长度是10。

warehouse基本表建立后，在数据库内会建立一个模式，DML语句、DQL语句会根据这个模式来访问warehouse表中的数据。

基本表创建后，还可以通过ALTER TABLE语句来修改基本表的模式，可以增加新的列、删除已有的列、修改列的类型等。

例2：在warehouse基本表中增加一个mgr_id（管理员编号）列，具体语句如下：

```sql
ALTER TABLE warehouse ADD COLUMN mgr_id INTEGER;
```

如果基本表中已经存在数据，那么在增加了新的列之后，默认会将这个列中的值指定为NULL。

如果要删除基本表中的某个列，可以使用ALTER TABLE...DROP COLUMN...语句实现。

例3：在warehouse基本表中删除管理员编号，具体语句如下：

```sql
ALTER TABLE warehouse DROP COLUMN mgr_id;
```

如果要修改基本表中某个列的类型，可以通过ALTER TABLE...ALTER COLUMN...语句实现。

例4：修改warehouse基本表中w_id列的类型，具体语句如下：

```sql
ALTER TABLE warehouse ALTER COLUMN w_id TYPE INTEGER;
```

修改列的数据类型时会导致基本表种的数据类型同时被强制转换类型，因为需要数据库本身支持转换前的数据类型和转换后的数据类型满足“类型兼容”，如果将warehouse基本表中的w_city列转换为INTEGER类型，由于w_city列本身是字符串类型（且字符串内容为非数值型字符），这种转换有可能无法正常进行。

如果一个基本表已经没有用了，可以通过DROP TABLE语句将其删除。

例5：删除warehouse表，具体语句如下：

```sql
DROP TABLE warehouse;
```

基本表的删除分为两种模式：RESTRICTED模式和CASCADE模式。如果没有指定具体的模式，则使用默认的RESTRICTED模式，该模式只尝试删除基本表本身，如果基本表上有依赖项，例如视图、触发器、外键等，那么删除不成功。而CASCADE模式下，会同时删除基本表相关的所有依赖项。

例6：以CASCADE模式删除warehouse基本表，删除基本表的同时视图也会被删除，具体语句如下：

```sql
CREATE VIEW warehouse_view AS SELECT * FROM warehouse;
DROP TABLE warehouse CASCADE;
```

