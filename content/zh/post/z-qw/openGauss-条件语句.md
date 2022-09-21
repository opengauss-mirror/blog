+++

title = "openGauss社区入门（openGauss-条件语句）" 

date = "2022-09-09" 

tags = ["openGauss社区开发入门"] 

archives = "2022-09" 

author = "z-qw" 

summary = "openGauss社区开发入门" 

img = "/zh/post/z-qw/title/title.jpg" 

times = "19:30" 

+++

## 条件语句
判断参数/语句是否满足给定的条件，根据判定结果，执行对应的操作。<br />条件语句可在存储过程中，自定义函数中，与循环语句结合等情况下使用。
### 1.IF...THEN
若果条件为真，语句被执行，否则，忽略该语句。<br />举例1：
```
CREATE OR REPLACE PROCEDURE prc1(n int) as
BEGIN
IF n>10 THEN
raise info 'this is %. ', n; 
END IF;
END;
/
```
```
CALL prc1(15);
CALL prc1(1);
```
```
INFO: this is 15.
prc1
------
(1 row)
prc1
-----
(1 row)
```

举例2：
```
CREATE OR REPLACE PROCEDURE prc2(n in int,a out int) as
i int:=0;
BEGIN
label: loop
n=n-1;
i=i+1;
raise info '循环进行 %次. ', i; 
IF n<3 then
leave label;
END IF;
END LOOP;
a=n;
END;
/
```
```
CALL prc2(6,1);
```
```
INFO:循环进行1次.
INFO:循环进行2次.
INFO:循环进行3次.
INFO:循环进行4次.
a
--
2
(1 row)
```
### 2.IF...THEN...ELSE
增加了ELSE的分支，可以声明在条件为假的时候执行的语句。<br />举例：
```
CREATE OR REPLACE PROCEDURE prc3(n in int,a out int) as
i int:=0;
BEGIN
WHILE n>3 LOOP 
n=n-1;
i=i+1;
IF  n<5 then
raise info '循环进行 %次. ', i; 
commit; 
ELSE
rollback;
END IF;
END LOOP;
a=n;
END;
/
```
```
CALL prc3(6,1);
显示信息
INFO:循环进行2次.
INFO:循环进行3次.
a
--
3
(1 row)
```
### 3.IF...THEN...ELSE IF
一个IF语句的ELSE部分嵌套了另一个IF语句。因此需要一个END IF语句给每个嵌套的IF，另外还需要一个END IF语句结束父IF-ELSE。<br />举例:
```
CREATE FUNCTION func4(a int) return text
as
BEGIN
IF a=1 THEN
return 'female';
ELSE 
IF a=0 THEN
return 'male';
END IF;
END IF;
END;
/
```
```
CALL func4(1);
```
```
func4
------
female
(1 row)
```
### 4.IF...THEN...ELSIF...ELSE
有多个选项，可使用该种形式。<br />举例:
```
CREATE FUNCTION func5(a int) return text
as
BEGIN
IF a=1 THEN
return 'female';
ELSIF a=0 THEN
return 'male';
ELSE
return 'WRONG!';
END IF;
END;
/
```
```
CALL func5(15);
```
```
func5
-----
WRONG!
(1 row)
```
### 5.IF...THEN...ELSE IF...ELSE
ELSEIF是ELSIF的别名。与IF...THEN...ELSIF...ELSE用法相同。有多个选项，可使用该种形式。<br />举例:
```
CREATE OR REPLACE PROCEDURE prc6(a int,b int) 
AS
BEGIN
IF a>b THEN
raise info 'a is greater than b. %>%',a,b; 
ELSIF a<b THEN
raise info 'b is greater than a. %>%',b,a; 
ELSE
raise info 'a is equal to b. %=%',a,b; 
END IF;
RETURN;
END;
/
```
```
CALL prc6(4,8);
CALL prc6(11,2);
CALL prc6(33,33);
```
```
INFO: b is greater than a. 8>4
prc6
------
(1 row)
INFO: a is greater than b. 11> 2
prc6
------
(1 row)
INFO: a is equal to b. 33=33
prc6
------
(1 row)
```





