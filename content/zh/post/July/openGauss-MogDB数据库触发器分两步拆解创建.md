+++

title =  "openGauss/MogDB数据库触发器分两步拆解创建" 

date = "2021-12-05" 

tags = [ "openGauss/MogDB数据库触发器分两步拆解创建"] 

archives = "2021-12" 

author = "彭冲" 

summary = "openGauss/MogDB数据库触发器分两步拆解创建"

img = "/zh/post/July/title/img7.png" 

times = "12:30"

+++

# openGauss/MogDB数据库触发器分两步拆解创建<a name="ZH-CN_TOPIC_0000001187055078"></a>

## Oracle触发器参考例子<a name="section149851748154314"></a>

```
CREATE OR REPLACE TRIGGER ora_trigger AFTER UPDATE OR INSERT OR DELETE ON tab_x FOR each row
declare
  ...
begin
  ...
  insert into tab_x ...;
end;
/
```

针对上面的例子，PostgreSQL里需要分两步来操作

## 1.先创建“触发器函数”<a name="section1872152864419"></a>

“触发器函数”是返回类型为trigger的函数，把上面的业务逻辑提取到下面的函数里面。

```
CREATE FUNCTION tigger_fun() RETURNS trigger AS $$ 
declare
  ...
begin 
  ...
  insert into tab_x ...;
end; 
$$ language plpgsql;
```

## 2.创建触发器<a name="section14228183744414"></a>

下面procedure关键字后面指定上一步创建的触发器函数名。

```
create trigger tab_x_trigger 
    AFTER UPDATE OR INSERT OR DELETE on tab_x
	for each row execute procedure tigger_fun(); 
```

## 3.触发器的查看<a name="section17262195284411"></a>

方式一：使用gsql工具连接后，通过表的定义上可以查看

```
\d+ tab_x
```

方式二：通过sql语句查询pg\_trigger系统表

```
select *  from pg_trigger where tgname='tab_x';
```

