---
title: 'openGauss社区入门（openGauss-循环语句）'

date: '2022-09-30'

tags: ['openGauss社区开发入门']

archives: '2022-09'

author: 'z-qw'

summary: 'openGauss社区开发入门'

img: '/zh/post/z-qw/title/title.jpg'

times: '17:30'
---

## LOOP 语句

1.与 label 标签名连用，可使用 continue 或者 iterate + label 标签名跳出本次循环，重新开始下一次循环；可使用 exit/leave + label 标签名 退出循环

```
CREATE OR REPLACE PROCEDURE prc_loop(i in integer, count out integer)
AS
BEGIN
count:=0;
label1:
LOOP
 IF count > i THEN
raise info 'count is %. ', count;
LEAVE label1;
ELSE
count:=count+1;
END IF;
IF count < 7 THEN
ITERATE label1;
ELSE
raise info 'greater than 7';
END IF;
END LOOP label1;
END;
/
```

```
CALL prc_loop(10,5);
```

```
INFO: greater than 7
INFO: greater than 7
INFO: greater than 7
INFO: greater than 7
INFO: greater than 7
INFO: count is 11.
count
-----
11
(1 row)
```

2.可用于存储过程带有自治事务、自定义函数、游标、触发器等环境中 举例：

```
CREATE FUNCTION func_loop(a int,b int,i int) return int
AS
	BEGIN
		LOOP
		i=i-1;
		IF i>4 then
			CONTINUE;
		END IF;
		a=a+b;
		IF i<2 then
			EXIT;
		END IF;
		END LOOP;
		RETURN a;
	END;
/
```

```
CALL func_loop(1,2,7);
```

```
func_loop
--------
9
(1 row)
```

## WHILE_LOOP 语句

在每次循环开始判断，若为真值，继续循环，反之，退出循环。 举例：

```
CREATE OR REPLACE PROCEDURE proc_while_loop(a int,b out int)
AS
DECLARE
i int :=1;
BEGIN
WHILE i <a LOOP
raise info '循环%次. ', i;
i:=i+1;
END LOOP;
raise info 'i is %. ', i;
b=i;
END;
/
```

```
CALL proc_while_loop(5,6);
```

```
INFO:  循环1次.
INFO:  循环2次.
INFO:  循环3次.
INFO:  循环4次.
INFO:  i is 5.
b
--
5
(1 row)
```

## FOR_LOOP 语句

### 1.int 类型变量

变量指定起始位置 min，遍历到达指定终点位置 max，其中 max>=min. 举例：

```
CREATE OR REPLACE PROCEDURE proc_for_loop(sum out int)
AS
BEGIN
sum:=0;
FOR a IN 5..15 LOOP
sum=a+sum;
raise info '循环%次,和为%.', a-4,sum;
END LOOP;
END;
/
```

```
CALL proc_for_loop();
```

```
INFO:  循环1次,和为5.
INFO:  循环2次,和为11.
INFO:  循环3次,和为18.
INFO:  循环4次,和为26.
INFO:  循环5次,和为35.
INFO:  循环6次,和为45.
INFO:  循环7次,和为56.
INFO:  循环8次,和为68.
INFO:  循环9次,和为81.
INFO:  循环10次,和为95.
INFO:  循环11次,和为110.
sum
---
110
(1 row)
```

### 2.查询语句变量

变量会自动定义，类型和查询结果的类型一致，并且只在此循环中有效。target 的取值就是查询结果。

```
CREATE TABLE tb_select(id int,name text);
INSERT INTO tb_select VALUES(1,'lili'),(2,'kiko'),(3,'MING');
CREATE OR REPLACE PROCEDURE proc_for_loop_query(count out int)
AS
record text;
BEGIN
count=0;
FOR record IN SELECT name FROM tb_select LOOP
count=count+1;
raise info '名字是%.',record;
END LOOP;
END;
/
```

```
CALL proc_for_loop_query(9);
```

```
INFO:  名字是lili.
INFO:  名字是kiko.
INFO:  名字是MING.
count
-----
3
(1 row)
```
