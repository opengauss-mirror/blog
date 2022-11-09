+++

title = "MogDB/openGauss数据库package关键字的两种用法" 

date = "2022-04-13" 

tags = ["MogDB/openGauss数据库package关键字的两种用法"] 

archives = "2022-04" 

author = "彭冲" 

summary = "MogDB/openGauss数据库package关键字的两种用法"

img = "/zh/post/pengchong/title/img9.png" 

times = "10:20"
+++

# MogDB/openGauss数据库package关键字的两种用法

本文出处：https://www.modb.pro/db/237701

package关键字在MogDB数据库里有两种用法：

- package包，分为Package Specification和Package Body。
  注意：需要在Oracle兼容下(dbcompatibility=‘A’)
- package属性，用于存储过程重载。

下面演示这两种用法。

## 一、package包

创建一个员工表

```sql
create table emp(
empno bigserial,               
name varchar,				 
job varchar,				 
mgr numeric,					 
hiredate timestamp without time zone,						
sal numeric,						 
comm numeric,                
deptno numeric
);
```

创建package包接口，用于客户端接口调用

```sql
create package employee_management as
    c_empno numeric = 9999;	
    function hire_emp (name varchar, job varchar,
                       mgr numeric, hiredate timestamp,
                       sal numeric, comm numeric,
                       deptno numeric) return numeric;		
    procedure fire_emp (emp_id numeric);			   
end employee_management;
/
```

创建package body包实现，可用于后端修改

```sql
create package body employee_management as
    function hire_emp (name varchar, job varchar,
	    mgr numeric, hiredate timestamp, sal numeric,
		comm numeric,  deptno numeric) 
	return numeric  as 
	declare
		new_empno numeric;
	begin
		select nextval('emp_empno_seq') into new_empno;
        insert into emp values (new_empno, name, job, 
		     mgr,hiredate, sal, comm, deptno);
		return new_empno;
	end;
	
	procedure fire_emp(emp_id in number) 
	as
    begin
        delete from emp where empno = emp_id;
    end;	
end employee_management;
/
```

接下来我们可以通过员工管理接口来进行调用，命令如下。

```
call employee_management.hire_emp('tom','teacher',1,localtimestamp,1,1,1); 
```

![image.png](./images/20220113-26ad3133-6232-463a-babd-c0199c1cb88e.png)
通过上面示例，我们可以看到第一种用法，创建package包接口，里面可以创建不同的程序体，包括变量、函数、存储过程等。

## 二、package属性

#### PostgreSQL测试

首先我们来看PG数据库里的这个测试

```plsql
create or replace procedure myproc(
in p1 varchar,
in p2 varchar, 
out p3 varchar) 
as $$
begin
    p3 = p1;
    raise notice 'procedure parameter: %', p1 ;
end ;
$$
language plpgsql;

create or replace procedure myproc(
in p1 varchar,
in p2 varchar) 
as $$
begin
    raise notice 'procedure parameter: %', p1 ;
end ;
$$
language plpgsql;
```

第二个同名的myproc存储过程创建会失败，提示信息如下：

```
ERROR:  cannot change whether a procedure has output parameters HINT:  Use DROP PROCEDURE myproc(character varying,character varying) first. 
```

测试截图如下
![image.png](./images/20220113-9b619d9d-d87c-4b6e-aaa4-a5472f95b7ea.png)

上面的测试在MogDB数据库里也是同样的效果，不能通过输出参数来对存储过程进行重载，上面第一个myproc是有输出参数，第二个myproc没有输出参数。

#### MogDB测试

接下来我们在MogDB数据库里，不使用out输出参数，但我们改变in输入参数的类型，测试重载。

```sql
create or replace procedure myproc2(
in p1 varchar,
in p2 varchar) 
as 
begin
    raise notice 'procedure parameter: %', p1 ;
end ;
/

create or replace procedure myproc2(
in p1 integer,
in p2 integer) 
as 
begin
    raise notice 'procedure parameter: %', p1 ;
end ;
/
```

最终我们的结果是只能看到最后一个两个输入参数为integer类型的myproc2，截图如下。
![image.png](./images/20220113-cd0cf621-d2ff-41e4-b01f-aabce51fbe44.png)

接下面我们对第一个输入参数为varchar类型的myproc2使用package属性进行重载(加到as关键字前面)

```sql
create or replace procedure myproc2(
in p1 varchar,
in p2 varchar) 
package as 
begin
    raise notice 'procedure parameter: %', p1 ;
end ;
/
```

可以看到下面的提示：

```
ERROR:  Do not allow package function overload not package function. 
```

![image.png](./images/20220113-52ebc3c8-4185-4422-b3c7-4caf1ee2e52e.png)
可以看出我们不能使用后加package属性的myproc2(输入参数类型为varchar)去重载非package属性的myproc2(输入参数类型为integer)。

最后测试正确的示例：

```
create or replace procedure myproc3(
in p1 varchar,
in p2 varchar) 
package as 
begin
    raise notice 'procedure parameter: %', p1 ;
end ;
/

create or replace procedure myproc3(
in p1 integer,
in p2 integer) 
package as 
begin
    raise notice 'procedure parameter: %', p1 ;
end ;
/


```

下面的截图可以看到符合我们的预期。

![image.png](./images/20220113-7d865eca-1576-4443-9d09-a0859b736b9b.png)

## 三、结论

MogDB数据库里package关键字有两种用法，一种是package包，另一种package属性用于存储过程重载。函数的重载不需要使用package属性，存储过程重载需要显式使用package属性。
