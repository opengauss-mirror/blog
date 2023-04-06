+++

title = "MogDB中实现管道函数的功能" 

date = "2023-02-07" 

tags = ["MogDB"] 

archives = "2023-02" 

author = "罗海雄" 

summary = "MogDB中实现管道函数的功能"

img = "/zh/post/luohaixiong/title/img.png" 

times = "10:20"

+++

Oracle中有一个piped line函数类型，可以把一个函数的返回值以管道的形式返回，使用类似于

```
create type typ_pipe is table of ..;
create function test_fun ( .. ) return typ_pipe 
 pipelined 
as 
...
pipe row(...);
end;
/

select * from table(test_fun (...));
```

在MogDB中也有类似的实现，主要是用到了函数定义中的return setof row;

基本语法如下：

```
create type typ_pipe is(...);
create function test_fun ( .. )
RETURNS SETOF typ_test_fun
as 
declare
rec typ_pipe ;
begin
...
rec := ...;
RETURN NEXT rec;
;
end;
/
```

其中的关键点在于定义中的 **RETURNS SETOF** 以及函数体中的 **RETURN NEXT** , 可以简单地认为就是 Oracle中 **PIPELINED** 和 **PIPE ROW**
另外，RETURN NEXT后面除了可以使用PLSQL中定义的变量，也可使用隐式游标for rec in (select … ) loop 中的rec.
下面来看两个例子，分别用定义的变量和for loop隐式游标来返回。

## 建立测试表和类型

```
drop table if exists test_table_fun;
create table test_table_fun(id int,name varchar(20));

insert into test_table_fun select generate_series(1,100), 'test '||generate_series(1,100);

drop type if exists typ_test_fun ;
create type typ_test_fun is(id int,name varchar(20));
```

## 返回定义的变量的形式

```
create or replace function pipe_rows2(n_rows int)
RETURNS SETOF typ_test_fun
 AS $$
 declare
 rec typ_test_fun;
  BEGIN
rec .id :=0 ;
rec.name :='line zero';
return NEXT rec;
for i in (select * from test_table_fun limit n_rows ) loop
rec.id = - i.id;
rec.name = 'line '||i.name;
RETURN NEXT rec;
end loop;
end;
$$ LANGUAGE plpgsql;
```

## 测试定义的变量的形式

```
MogDB=# select * from pipe_rows_test(3);
 id |    name     
----+-------------
  0 | line zero
 -1 | line test 1
 -2 | line test 2
 -3 | line test 3
(4 rows)
```

注意，这里不需要加 **table()** 关键字。后面版本，为了兼容Oracle语法，可能会加进来。

## 返回for loop隐式游标的形式

```
create or replace function pipe_rows_test_rec(n_rows int)
RETURNS SETOF typ_test_fun
 AS $$
declare
c_rows int default 0;
  BEGIN
for i in (select * from test_table_fun ) loop 
c_rows := c_rows+1;
RETURN NEXT i;
exit when c_rows >= n_rows;
end loop;
end;
$$ LANGUAGE plpgsql;
```

## 测试返回for loop隐式游标的形式

```
MogDB=# select * from pipe_rows_test_rec(5);
 id |  name  
----+--------
  1 | test 1
  2 | test 2
  3 | test 3
  4 | test 4
  5 | test 5
(5 rows)
```

当然，两种形式并不冲突，混用也是也可以的，大家只需要理解，**RETURN NEXT** 关键字就相当于往返回的结果集中追加记录就是了。
