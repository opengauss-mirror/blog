+++

title = "过程化SQL以及openGauss存储过程、函数、触发器" 

date = "2021-07-09" 

tags = ["过程化SQL以及openGauss存储过程、函数、触发器"] 

archives = "2021-07" 

author = "CR7" 

summary = "过程化SQL以及openGauss存储过程、函数、触发器"

img = "/zh/post/zhengwen2/img/img33.jpg" 

times = "12:30"

+++

# 过程化SQL以及openGauss存储过程、函数、触发器<a name="ZH-CN_TOPIC_0000001085018737"></a>

# 一、 过程化SQL

基本的SQL是高度非过程化的语言。嵌入式SQL将SQL语句嵌入程序设计语言，借助高级语言的控制功能实现过程化。过程化SQL是对SQL的扩展，使其增加了过程化语句功能。

简单来说，从标准SQL语句到嵌入式SQL再到过程化SQL，就是使SQL功能不断增强的过程。标准SQL语句相当于是可以操纵数据库的一些“武器”，嵌入式SQL相当于给程序设计语言（如java，C语言等）装备了这些“武器”，而过程化SQL相当于给这些“武器”予以血肉，通过自身带有的流程控制语句操纵数据库。

过程化SQL程序的基本结构是块。所有的过程化SQL程序都是由块组成的。这些块之间可以相互嵌套，每个块完成一个逻辑操作。学会用过程化SQL书写存储过程和触发器就会像写C语言代码一样随心所欲。

## 1、变量和常量的定义
# （1）变量定义
变量名 数据类型 [[NOT NULL] :=初值表达式] 或
变量名 数据类型 [[NOT NULL] 初值表达式]

## （2）常量定义
常量名 数据类型 CONSTANT:=常量表达式

【注】常量必须要给一个值，并且该值在存在期间或常量的作用域内不能改变。如果试图修改它，过程化SQL将返回一个异常。

## （3）赋值语句
变量名 :=表达式

## 2、选择控制语句
## （1）IF语句

```
IF  condition  THEN
    Sequence_of_statements;     /*条件为真时才执行该条语句*/
END IF      /*条件为假或NULL时什么也不做，控制转移至下一个语句*/
```

## （2）IF-ELSE语句

```
IF  condition  THEN
    Sequence_of_statements1;     /*条件为真时语句序列才被执行*/
ELSE
    Sequence_of_statements2;     /*条件为假或NULL时才被执行*/  
END IF
```

## （3）嵌套的IF语句
在THEN和ELSE子句中还可以包含IF语句，IF语句可以嵌套，如：

```
IF  condition  THEN
    IF  condition  THEN
    	Sequence_of_statements1;    
    END IF     
ELSE
    IF  condition  THEN
    	Sequence_of_statements2;     
    ELSE
    	Sequence_of_statements3;    
    END IF
END IF
```

## 3、循环控制语句
### （1）LOOP循环语句

```
LOOP
    Sequence_of_statements；    /*循环体，一组过程化SQL语句*/
END LOOP;
```

该循环必须要结合EXIT使用，否则将陷入死循环。

举例：

```
CREATE OR REPLACE PROCEDURE proc_loop(IN i integer, OUT count integer) 
IS BEGIN 
count:=0; 
LOOP 
	IF count > i THEN 
		raise info 'count is %. ', count;
		EXIT; 
	ELSE 
		count:=count+1; 
	END IF; 
END LOOP; 
END; 
/

CALL proc_loop(10,5);
```

### （2）WHERE-LOOP循环语句

```
WHERE condition LOOP
    Sequence_of_statements；    /*条件为真时执行循环体内的语句序列*/
END LOOP;
```

每次执行循环体语句之前首先对条件进行求值，如果条件为真则执行循环体内的语句序列，如果条件为假则跳过循环并把控制传递给下一个语句。

举例：

```
CREATE OR REPLACE PROCEDURE proc_while_loop(IN maxval integer) 
IS DECLARE 
i int :=1;
BEGIN 
WHILE i < maxval LOOP 
	INSERT INTO integertable VALUES(i); 
	i:=i+1; 
END LOOP; 
END; 
/
```

### （3）FOR-LOOP循环语句

```
FOR count IN [REVERSE] bound1...bound2  LOOP
     Sequence_of_statements；
END LOOP;
```

将count设置为循环的下界bound1，检查它是否小于上界bound2。当指定REVERSE时则将count设置为循环的上界bound2，检查count是否大于下界bound1。如果越界则执行跳出循环，否则执行循环体，然后按照步长（+1或-1）更新count的值，重新判断条件。 有点像python中的for…in range(i,j)循环。

# 二、openGauss下的存储过程、函数、触发器书写
过程化SQL块主要有命名块和匿名块。匿名块每次执行时都要进行编译，它不能被存储到数据库中，也不能在其他过程化SQL块中调用。过程和函数是命名块，他们被编译后保存在数据库中，称为持久性存储模块（PSM），可以 被反复调用，运行速度较快。

## 1、存储过程
存储过程是由过程化SQL语句书写的过程，这个过程经编译和优化后存储在数据库服务器中，因此称它为存储过程，使用时只要调用即可。

### （1）存储过程的优点
1）由于存储过程不像解释执行的SQL语句那样在提出操作请求时才进行语法分析和优化工作，因而运行效率高，它提供了在服务器端快速执行SQL语句的有效途径。
2）存储过程降低了客户机和服务器之间的通信量。客户机上的应用程序只要通过网络向服务器发出调用存储过程的名字和参数，就可以让关系数据库管理系统执行其中的多条SQL语句并进行数据处理，只有最终的处理结果才返回客户端。
3）方便实施企业规则。可以把企业规则的运算程序写成存储过程放入数据库服务器中，由关系数据库管理系统管理，既有利于集中控制，又能够方便地进行维护。当企业规则发生变化时只要修改存储过程即可，无需修改其他应用程序。

### （2）创建存储过程

```
CREATE OR REPLACE PROCEDURE 存储过程名 ( [参数1模式 参数1名字 参数1类型] ,..)
IS
BEGIN
	<标准SQL或过程化SQL>
END;
/
（不要忘了最后一行的斜杠）

调用存储过程：

CALL 存储过程名(参数1,..);
```

举例:

```
CREATE OR REPLACE PROCEDURE update_num ( IN daily_id CHAR(4) )
IS
BEGIN
	UPDATE 代理商 
	SET 代理客户数 = 
	(SELECT count(*) FROM 客户 WHERE 代理商编号=daily_id  GROUP BY 代理商编号 )
	WHERE 代理商编号=daily_id;
END;
/

CALL update_num('01');
```

### (3)修改存储过程

```
ALTER PROCEDURE 过程名1 RENAME TO 过程名2；（重新命名一个存储过程）
ALTER PROCEDURE 过程名 COMPILEL;（重新编译一个存储过程）
```

### (4)删除存储过程

```
DROP PROCEDURE 过程名()；
```

## 2、函数以及触发器
函数必须指定返回的类型。openGauss中的触发器要先定义一个触发器函数，再利用这个函数，定义触发器。

### （1）创建函数及触发器
创建触发器函数:


```
CREATE OR REPLACE FUNCTION 触发器名称() 
RETURNS TRIGGER AS $$ DECLARE 
BEGIN 
	<标准SQL或过程化SQL>
RETURN <NEW或OLD>; 
END;
$$ LANGUAGE PLPGSQL;
```

创建触发器，其中调用上面创建的触发器函数:


```
CREATE TRIGGER 触发器名称
<BEFORE|AFTER|INSTEAD OF>  <INSERT|UPDATE|DELETE>  ON  表名
<FOR EACH ROW | FOR EACH STATEMENT>
EXECUTE PROCEDURE 触发器函数名();
```

BEFORE：触发器函数是在触发事件发生前执行。

AFTER：触发器函数是在触发事件发生后执行，约束触发器只能指定为AFTER。

INSTEAD OF：触发器函数直接替代触发事件。

FOR EACH ROW：指该触发器是受触发事件影响的每一行触发一次。

FOR EACH STATEMENT：指该触发器是每个SQL语句只触发一次。

（未指定时默认值为FOR EACH STATEMENT。约束触发器只能指定为FOR EACH ROW ）

举例：

```
CREATE OR REPLACE FUNCTION tri_insert_订货项目_func() 
RETURNS TRIGGER AS $$ DECLARE 
BEGIN 
UPDATE 产品 SET 产品订单数=产品订单数+1,库存量=库存量-NEW.订购数量 WHERE 产品编号=NEW.产品编号; 
RETURN NEW; 
END;
$$ LANGUAGE PLPGSQL;


CREATE TRIGGER after_insert_订货项目
AFTER insert ON 订货项目
FOR EACH ROW
EXECUTE PROCEDURE tri_insert_订货项目_func();
```

### （2）善于用过程化SQL书写存储过程和函数
（往赛程表中插入一条比赛信息，若比分1大于比分2，则球队1的总场数、总胜场+1，球队2的总场数+1…）

C

```
REATE OR REPLACE FUNCTION insert_func2() 
RETURNS TRIGGER AS $$ DECLARE 
BEGIN 
if new.比分1>new.比分2 then
	update 球队 set 总场数=总场数+1,总胜场=总胜场+1 where 球队名称=new.球队1名称;
	update 球队 set 总场数=总场数+1 where 球队名称=new.球队2名称;
else
	if new.比分1<new.比分2 then
		update 球队 set 总场数=总场数+1 where 球队名称=new.球队1名称;
		update 球队 set 总场数=总场数+1,总胜场=总胜场+1 where 球队名称=new.球队2名称;
	else
		update 球队 set 总场数=总场数+1 where 球队名称=new.球队1名称;
		update 球队 set 总场数=总场数+1 where 球队名称=new.球队2名称;
	end if;
end if;
RETURN NEW; 
END;
$$ LANGUAGE PLPGSQL;

CREATE TRIGGER after_insert2
AFTER INSERT ON 赛程
FOR EACH ROW
EXECUTE PROCEDURE insert_func2() ;
```

（如果比赛类型为小组赛，且比分1大于比分2，那么意味着球队1胜，球队2负，然后更新球队有关属性信息…）

```
CREATE OR REPLACE FUNCTION insert_func() 
RETURNS TRIGGER AS $$ DECLARE 
BEGIN 
if new.比赛类型='小组赛' then
	if new.比分1>new.比分2 then
		update 球队 set 小组赛胜场=小组赛胜场+1,小组赛进球数=小组赛进球数+new.比分1,小组赛失球数=小组赛失球数+new.比分2,小组赛积分=小组赛积分+3 where 球队名称=new.球队1名称;
		update 球队 set 小组赛负场=小组赛负场+1,小组赛进球数=小组赛进球数+new.比分2,小组赛失球数=小组赛失球数+new.比分1 where 球队名称=new.球队2名称;
	else
		if new.比分1<new.比分2 then
			update 球队 set 小组赛负场=小组赛负场+1,小组赛进球数=小组赛进球数+new.比分1,小组赛失球数=小组赛失球数+new.比分2 where 球队名称=new.球队1名称;
			update 球队 set 小组赛胜场=小组赛胜场+1,小组赛进球数=小组赛进球数+new.比分2,小组赛失球数=小组赛失球数+new.比分1,小组赛积分=小组赛积分+3 where 球队名称=new.球队2名称;
		else
			update 球队 set 小组赛平场=小组赛平场+1,小组赛进球数=小组赛进球数+new.比分1,小组赛失球数=小组赛失球数+new.比分2,小组赛积分=小组赛积分+1 where 球队名称=new.球队1名称;
			update 球队 set 小组赛平场=小组赛平场+1,小组赛进球数=小组赛进球数+new.比分2,小组赛失球数=小组赛失球数+new.比分1,小组赛积分=小组赛积分+1 where 球队名称=new.球队2名称;
		end if;
	end if;
end if;
RETURN NEW; 
END;
$$ LANGUAGE PLPGSQL;

CREATE TRIGGER after_insert
AFTER INSERT ON 赛程
FOR EACH ROW
EXECUTE PROCEDURE insert_func() ;
```

### （3）修改触发器

```
ALTER TRIGGER trigger_name ON table_name RENAME TO new_name;
```

### （4）删除触发器

```
DROP TRIGGER [ IF EXISTS ] trigger_name ON table_name [ CASCADE | RESTRICT ];
```

1）删除触发器时，如果不指定触发器所在的表，则会报错

2）在openGauss中删除触发器时，先删触发器本身，再删触发器中所定义的函数，否则会报错

3）IF EXISTS：如果指定的触发器不存在，则发出一个notice而不是抛出一个错误。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210409150842510.jpg?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center,  =200x200 )
<center>Gauss松鼠会是汇集数据库爱好者和关注者的大本营，</center>

<center>大家共同学习、探索、分享数据库前沿知识和技术，</center>

<center>互助解决问题，共建数据库技术交流圈。</center>

<center>
<a href=https://opengauss.org>openGauss官网</a>
</center>



