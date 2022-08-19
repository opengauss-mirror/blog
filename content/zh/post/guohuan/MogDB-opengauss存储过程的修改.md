+++

title = "MogDB/openGauss存储过程的修改" 

date = "2022-08-05" 

tags = ["MogDB"] 

archives = "2022-08" 

author = "云和恩墨-郭欢" 

summary = "MogDB/openGauss存储过程的修改"

img = "/zh/post/guohuan/title/img.png" 

times = "10:20"

+++

# MogDB/openGauss存储过程的修改

SQL中没有提供显式的存储过程修改命令，通常需要通过REPLACE关键字来指定使用当前的存储过程替代之前的同名存储过程。

将前文定义的存储过程替换为按照地区分组的数量统计，具体语句如下：

```sql
MogDB=# CREATE OR REPLACE PROCEDURE warehouse_count()
LANGUAGE SQL
AS
SELECT w_state, w_city, COUNT(*)
FROM warehouse
GROUP BY w_state, w_city;
```

函数的使用方法和存储过程类似，具体语句如下：

```sql
CREATE [ OR REPLACE ] FUNCTION 函数名（
[IN | OUT] 参数1 数据类型;
[IN | OUT] 参数2 数据类型;
...
)
RETURNS 数据类型
LANGUAGE lang_name
AS
DECLARE
变量1 数据类型;
变量2 数据类型;
...
BEGIN
函数程序体
END;
```

但是函数可以应用在SQL语句中，而存储过程必须独立调用，另外函数必须指定返回值。

向new_orders表中插入数据，并将new_orders中的元组数作为返回值，具体语句如下：

```sql
MogDB=# CREATE FUNCTION new_orders_insert_func（
IN o_id INTEGER;
IN d_id INTEGER;
IN w_id INTEGER
)
RETURNS INTEGER
LANGUAGE lang_name
AS
$$
DECLARE
count INTEGER;
BEGIN
INSERT INTO new_orders VALUES(o_id, d_id, w_id);
SELECT COUNT(*) INTO count FROM new_orders;
RETURN count;
END;
$$ LANGUAGE plpgsql;
```

执行获得返回值：

```sql
MogDB=# SELECT new_orders_insert_func(1,1,1);
 new_orders_insert_func
-------------------------
              2
(1 row)
```

