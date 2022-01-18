+++

title =  "MogDB/openGauss关于PL/SQL匿名块调用测试" 

date = "2021-12-24" 

tags = [ "MogDB/openGauss关于PL/SQL匿名块调用测试"] 

archives = "2021-12" 

author = "lmj" 

summary = "MogDB/openGauss关于PL/SQL匿名块调用测试"

img = "/zh/post/2022/title/img7.png" 

times = "12:30"

+++

# MogDB/openGauss关于PL/SQL匿名块调用测试<a name="ZH-CN_TOPIC_0000001187213638"></a>

## 一、原理介绍<a name="section049118253466"></a>

PL/SQL\(Procedure Language/Structure Query Language\)是标准SQL语言添加了过程化功能的一门程序设计语言。

单一的SQL语句只能进行数据操作，没有流程控制，无法开发复杂的应用。PL/SQL语言是结合了结构化查询与数据库自身过程控制为一体的强大语言。

-   1.PL/SQL原理

    PL/SQL是一种块结构的语言，它将一组语句放在一个块中，一次性发送给服务器。

    PL/SQL引擎分析收到PL/SQL语句块中的内容，把其中的过程控制语句由PL/SQL引擎自身去执行,把PL/SQL块中的SQL语句交给服务器的SQL语句执行器执行。

    PL/SQL块发送给服务器后，先被编译然后执行，对于有名称的PL/SQL块（如子程序）可以单独编译，永久的存储在数据库中，随时准备执行。

    PL/SQL是一种块结构的语言，一个PL/SQL程序包含了一个或者多个逻辑块，逻辑块中可以声明变量，变量在使用之前必须先声明。

-   2.PL/SQL特点

    –与SQL紧密结合

    –支持面向对象编程

    –更好的性能

    –可移植性

    –安全性

-   3.语法结构

    除了正常的执行程序外，PL/SQL还提供了专门的异常处理部分进行异常处理

    ```
    [DECLARE
         --declaration statements]  ①
    BEGIN
         --executable statements   ②
    [EXCEPTION
         --exception statements]   ③
    END;
    ```

    **语法解析**

    ①声明部分：声明部分包含了变量和常量的定义。在此声明PL/SQL用到的变量,类型及游标，以及局部的存储过程和函数，

    这个部分由关键字DECLARE开始，如果不声明变量或者常量，可以省略这部分。

    ②执行部分：执行部分是 PL/SQL块的指令部分，由关键字BEGIN开始，关键字END结尾。

    所有的可执行PL/SQL语句都放在这一部分，该部分执行命令并操作变量。其他的PL/SQL块可以作为子块嵌套在该部分。

    PL/SQL块的执行部分是必选的。注意END关键字后面用分号结尾。

    ③异常处理部分：该部分是可选的，该部分用EXCEPTION关键字把可执行部分分成两个小部分，之前的程序是正常运行的程序，

    一旦出现异常就跳转到异常部分执行。

-   4.PL/SQL语句块的类型

    1、匿名块

    2、命名块

    –①procedure 存储过程

    –②function 函数

    –③package 包

    –④trigger 触发器

    原本大家可能一提到PL/SQL就会想到ORACLE，ORACLE的PL/SQL很强大，它的匿名块调用以及有名块调用可以解决很多问题，在MOGDB/openGauss中，其实也有这样的功能，如下，是我针对MOGDB/openGauss匿名块的一些测试。


## 二、匿名块测试<a name="section2070643814614"></a>

-   1.普通匿名块调用

    ```
    openGauss=# create table t1(a int ,b text);
    CREATE TABLE
    
    openGauss=# DECLARE
    openGauss-# PRAGMA AUTONOMOUS_TRANSACTION;
    openGauss-# BEGIN
    openGauss$# raise notice 'Normal anonymous block printing.';
    openGauss$# insert into t1 values(1,'I am lmj!');
    openGauss$# END;
    openGauss$# /
    NOTICE:  Normal anonymous block printing.
    
    ANONYMOUS BLOCK EXECUTE
    openGauss=# select * from t1;
     a |     b
    ---+-----------
     1 | I am lmj!
    (1 row)
    ```


-   2.匿名块和事务影响

    启动一个事务后，执行一个自治事务匿名块，如果事务回滚，则匿名块不回滚。

    ```
    openGauss=# truncate table t1;
    TRUNCATE TABLE
    
    openGauss=# START TRANSACTION;
    START TRANSACTION
    openGauss=# DECLARE
    openGauss-# PRAGMA AUTONOMOUS_TRANSACTION;
    openGauss-# BEGIN
    openGauss$# raise notice 'an autonomous transaction anonymous block.';
    openGauss$# insert into t1 values(1,'it will commit!');
    openGauss$# END;
    openGauss$# /
    NOTICE:  an autonomous transaction anonymous block.
    
    ANONYMOUS BLOCK EXECUTE
    openGauss=# insert into t1 values(1,'you will rollback!');
    INSERT 0 1
    openGauss=# rollback;
    ROLLBACK
    openGauss=# select * from t1;
     a |        b
    ---+-----------------
     1 | it will commit!
    (1 row)
    ```

-   3.外部匿名块和内部匿名块

    其中外部匿名块是一个公共匿名块，而内部匿名块是一个自治事务匿名块，可以根据如下例子和第二个例子对比事务回滚和匿名块回滚

    ```
    openGauss=# truncate table t1;
    TRUNCATE TABLE
    
    openGauss=# DECLARE
    openGauss-# BEGIN
    openGauss$# DECLARE
    openGauss$# PRAGMA AUTONOMOUS_TRANSACTION;
    openGauss$# BEGIN
    openGauss$# raise notice 'just use call.';
    openGauss$# insert into t1 values(1,'can you rollback!');
    openGauss$# END;
    openGauss$# insert into t1 values(2,'I will rollback!');
    openGauss$# rollback;
    openGauss$# END;
    openGauss$# /
    NOTICE:  just use call.
    ANONYMOUS BLOCK EXECUTE
    openGauss=# select * from t1;
     a | b
    ---+---
    (0 rows)
    ```

-   4.匿名块直接执行自治事务匿名块并引发异常

    ```
    openGauss=# DECLARE
    openGauss-# PRAGMA AUTONOMOUS_TRANSACTION;
    openGauss-# res int := 0;
    openGauss-# res2 int := 1;
    openGauss-# BEGIN
    openGauss$# raise notice 'just use call.';
    openGauss$# res2 = res2/res;
    openGauss$# END;
    openGauss$# /
    NOTICE:  just use call.
    
    ERROR:  ERROR:  division by zero
    CONTEXT:  PL/pgSQL function inline_code_block line 7 at assignment
    ```

    匿名块执行错误，会报出异常

-   5.异常捕获

    在执行期间引发异常后，将捕获匿名块，如下所示，在执行错误后，抛出autonomous throw exception提示

    ```
    openGauss=# DECLARE
    openGauss-# PRAGMA AUTONOMOUS_TRANSACTION;
    openGauss-# res int := 0;
    openGauss-# res2 int := 1;
    openGauss-# BEGIN
    openGauss$# raise notice 'error catch.';
    openGauss$# res2 = res2/res;
    openGauss$# EXCEPTION
    openGauss$# WHEN division_by_zero THEN
    openGauss$#     raise notice 'autonomous throw exception.';
    openGauss$# END;
    openGauss$# /
    NOTICE:  error catch.
    
    NOTICE:  autonomous throw exception.
    ANONYMOUS BLOCK EXECUTE
    ```


