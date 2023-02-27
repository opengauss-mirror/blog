---
title: 'MogDB/openGauss存储过程的声明'

date: '2022-08-05'

category: 'blog'
tags: ['MogDB']

archives: '2022-08'

author: '云和恩墨-郭欢'

summary: 'MogDB/openGauss存储过程的声明'

img: '/zh/blogs/guohuan/title/img.png'

times: '10:20'
---

# MogDB/openGauss 存储过程的声明

存储过程是一组 SQL 语句和逻辑控制的集合。数据库系统需要支持创建、删除和修改存储过程的语法。存储过程相比普通的 SQL 命令，具有如下优点：

- 创建的存储过程保存在数据库系统中，在使用时被调出并且在数据库系统本地进行编译执行，一次编译，多次执行，具有很好的执行效率。

- 数据库系统和应用程序之间通常需要有大量的数据交互，而存储过程可以将应用的逻辑“下推”给数据库系统，降低数据的传输量。

- 存储过程还具有过程化的控制语句，可以实现固定的业务逻辑，并且通过存储过程的封装，应用程序只需要访问存储过程即可，从而可以使部分基本表对用户透明，提高了数据库系统的安全性。

简而言之，存储过程具有简单、安全、高性能等优点。

**存储过程的声明**

创建一个存储过程可以通过 CREATE PROCEDURE 命令来实现，其主要形式如下：

```
CREATE [ OR REPLACE ] PROCEDURE 存储过程名(
    [ IN | OUT ] 参数1 数据类型,
    [ IN | OUT ] 参数2 数据类型,
    ...
)
LANGUAGE lang_name
AS
DECLARE
    变量1 数据类型,
    变量2 数据类型,
    ...
BEGIN
    存储过程程序体
END；
```

下面定义一个存储过程。

统计 warehouse 表中元组的数量，具体语句如下：

```
MogDB=# CREATE PROCEDURE warehouse_count()
LANGUAGE SQL
AS
SELECT COUNT(*)
FROM warehouse;
```

存储过程可以带有参数，参数的类型就是 SQL 标准中的多种类型，在向存储过程传递参数时需要保证参数类型的一致，否则存储过程就无法正常执行。

存储过程的参数有 3 种不同的输入/输出模式：IN、OUT、INOUT。

- IN 参数是存储过程的输入参数，它将存储过程外部的值传递给存储过程使用。

- OUT 参数是存储过程的输出参数，存储过程在执行时，会将执行的中间结果赋值给 OUT 参数，存储过程执行完毕后，外部用户可以通过 OUT 参数获得存储过程
  的执行结果

- INOUT 参数则同时具有 IN 参数和 OUT 参数的性质，它既是存储过程的输入参数，同时在存储过程执行中也会通过 INOUT 参数将中间结果输出给外部用户

向 new_orders 基本表中插入数据。具体语句如下：

```
MogDB=# CCREATE PROCEDURE new_orders_insert(
    IN o_id INTEGER,
    IN d_id INTEGER,
    IN w_id INTEGER,
    )
LANGUAGE SQL
AS
INSERT INTO new_orders VALUES(o_id, d_id, w_id);
```

调用存储过程，具体语句如下：

```
MogDB=# CCALL new_orders_insert(1,1,1);
```

检查存储过程的效果，具体语句如下：

```
MogDB=# CSELECT * FROM new_orders;
no_o_id | no_d_id | no_w_id
---------+---------+---------
   1   |   1   |   1
(1 row)
```
