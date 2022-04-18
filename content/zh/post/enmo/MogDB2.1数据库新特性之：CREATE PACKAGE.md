+++

title = "MogDB2.1数据库新特性之：CREATE PACKAGE" 

date = "2022-04-15" 

tags = ["MogDB2.1数据库新特性之：CREATE PACKAGE"] 

archives = "2022-04" 

author = "云和恩墨" 

summary = "MogDB2.1数据库新特性之：CREATE PACKAGE"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# MogDB2.1数据库新特性之：CREATE PACKAGE

本文出处：https://www.modb.pro/db/390543

<br/>

MogDB2.1版本开始支持创建PACKAGE。

### 使用PACKAGE的注意事项：

- 由于升级的限制，即使在不同的Package间，也无法创建同名同参的存储过程。
- package只支持集中式，无法在分布式中使用。
- 在package specification中声明过的函数或者存储过程，必须在package body中找到定义。
- 在实例化中，无法调用带有commit/rollback的存储过程。
- 不能在Trigger中调用package函数。
- 不能在外部SQL中直接使用package当中的变量。
- 不允许在package外部调用package的私有变量和存储过程。
- 不支持其它存储过程不支持的用法，例如，在function中不允许调用commit/rollback，则package的function中同样无法调用commit/rollback。
- 不支持schema与package同名。
- 只支持A风格的存储过程和函数定义。
- 不支持package内有同名变量，包括包内同名参数。
- package的全局变量为session级，不同session之间package的变量不共享。
- package中调用自治事务的函数，不允许使用公有变量，以及递归的使用公有变量的函数。
- package中不支持声明ref cursor类型。

### CREATE PACKAGE语法：

**CREATE PACKAGE SPECIFICATION语法格式**

```sql
CREATE [ OR REPLACE ] PACKAGE [ schema ] package_name
    [ invoker_rights_clause ] { IS | AS } item_list_1 END package_name;

```

invoker_rights_clause可以被声明为AUTHID DEFINER或者AUTHID INVOKER，分别为定义者权限和调用者权限。
item_list_1可以为声明的变量或者存储过程以及函数。
PACKAGE SPECIFICATION(包规格)声明了包内的公有变量、函数、异常等，可以被外部函数或者存储过程调用。在PACKAGE SPECIFICATION中只能声明存储过程，函数，不能定义存储过程或者函数。

**CREATE PACKAGE BODY语法格式。**

```sql
CREATE [ OR REPLACE ] PACKAGE BODY [ schema ] package_name
    { IS | AS } declare_section [ initialize_section ] END package_name;
```

PACKAGE BODY(包体内)定义了包的私有变量，函数等。如果变量或者函数没有在PACKAGE SPECIFICATION中声明过，那么这个变量或者函数则为私有变量或者函数。
PACKAGE BODY也可以声明实例化部分，用来初始化package

### 测试：

#### 1.创建PACKAGE：

```plsql
CREATE OR REPLACE PACKAGE package1 IS
  O_SQLERROR varchar2(2000);
  FUNCTION func1(num1 int,num2 int) RETURN int;
  PROCEDURE proc1(i_num1 IN int,i_num2 IN int, O_RESULT OUT int, O_ERRCODE OUT varchar, O_ERROR OUT varchar) ;
end package1;
/
CREATE OR REPLACE PACKAGE BODY package1 IS
    FUNCTION func1(num1 int,num2 int) RETURN int iS
     func_result int;
     BEGIN
              func_result:= num1+num2;
              O_SQLERROR :='00000';
              RETURN func_result;
     EXCEPTION
       WHEN OTHERS THEN
         RETURN NULL;
   END ;
   PROCEDURE proc1(i_num1 IN int,i_num2 IN int, O_RESULT OUT int, O_ERRCODE OUT varchar, O_ERROR OUT varchar)  IS
   BEGIN
     o_result := i_num1 + i_num2;
     O_ERRCODE := '0000';
     O_ERROR := 'successful completion';
     O_SQLERROR :='11111';
      EXCEPTION
       WHEN OTHERS THEN
         O_ERRCODE := SQLSTATE;
         O_ERROR := SQLERRM;
   END ;
  end package1;
/

```

测试执行包中的存储过程和函数：

```sql
  测试结果：
ora_proc=> call package1.proc1(1,2,a,b,c);
 o_result | o_errcode |        o_error        
----------+-----------+-----------------------
        3 | 0000      | successful completion
(1 row)
ora_proc=> select package1.func1(1,2);
 func1 
-------
     3
(1 row)

```

#### 2.已在PACKAGE中定义的存储过程/函数，不能和在其他PACKAGE中定义的存储过程/函数同名且同参数,也不能和不是在PACKAGE中定义的存储过程/函数同名且同参数。

```plsql
ora_proc=>        create or replace FUNCTION func1(num1 int,num2 int) RETURN int package IS
ora_proc$>      func_result int;
ora_proc$>      BEGIN
ora_proc$>               func_result:= num1+num2;
ora_proc$>               RETURN func_result;
ora_proc$>      EXCEPTION
ora_proc$>        WHEN OTHERS THEN
ora_proc$>          RETURN NULL;
ora_proc$>    END ;
ora_proc$> /
ERROR:  Due to upgrade mode,Do not allow different package have same function name with same parameter,please drop package by oid 17309 first
ora_proc=>     create or replace FUNCTION func1(num1 int,num2 int,num3 int) RETURN int iS
ora_proc$>      func_result int;
ora_proc$>      BEGIN
ora_proc$>               func_result:= num1+num2 +num3;
ora_proc$>               RETURN func_result;
ora_proc$>      EXCEPTION
ora_proc$>        WHEN OTHERS THEN
ora_proc$>          RETURN NULL;
ora_proc$>    END ;
ora_proc$> /
CREATE FUNCTION
```
