+++

title = "在MogDB中插入删除更新数据" 

date = "2022-07-08" 

tags = ["MogDB"] 

archives = "2022-07" 

author = "云和恩墨-郭欢" 

summary = "在MogDB中插入删除更新数据"

img = "/zh/post/guohuan/title/img31.png" 

times = "10:20"

+++

# 在MogDB中插入删除更新数据

基本表创建之后是一个空的集合，这时就可以对基本表做DML操作，如插入、删除以及更新基本表中的数据。

例1：向new_orders基本表中插入数据，具体语句如下：

```sql
INSERT INTO new_orders VALUES(1,1,1);
INSERT INTO new_orders VALUES(2,2,2);
```

例2：删除new_orders基本表中no_o_id=3的元组。具体语句如下：

```sql
INSERT INTO new_orders VALUES(3,3,3);
DELETE FROM new_orders WHERE no_o_id=3;
```

例3：更新new_orders基本表中no_w_id列的值为3。具体语句如下：

```sql
UPDATE new_orders SET no_w_id=3 WHERE no_o_id=2;
```

最基本的SQL查询结构通常由SELECT、FROM、WHERE构成，其中包含了关系代数中的投影（Projection）、选择（Selection）和连接（Join）。具体语句如下：

```sql
SELECT projection FROM join WHERE selection;
```

其中连接（Join）可以由一个基本表构成，也可以是多个基本表的连接结果，选择（Selection）操作是一组针对连接操作产生的结果的表达方式，这些表达式为BOOL类型，它们对连接产生的结果做过滤，过滤之后的元祖会组成新的中间关系，最后由投影（Projection）操作输出。

例4：获得warehouse基本表中的数据，具体语句如下：

```sql
SELECT w_name FROM warehouse WHERE w_id=1;
```