+++

title = "openGauss社区入门（openGauss-条件语句）" 

date = "2022-09-09" 

tags = ["openGauss社区开发入门"] 

archives = "2022-09" 

author = "z-qw" 

summary = "openGauss社区开发入门" 

img = "" 

times = "19:30" 

+++

## 条件语句
判断参数/语句是否满足给定的条件，根据判定结果，执行对应的操作。<br />条件语句可在存储过程中，自定义函数中，与循环语句结合等情况下使用。
### 1.IF...THEN
若果条件为真，语句被执行，否则，忽略该语句。<br />举例1：<br />创建存储过程<br />
`CREATE OR REPLACE PROCEDURE prc1(n int) as
BEGIN
IF n>10 THEN
raise info 'this is %. ', n; 
END IF;
END;
//<br />调用存储过程<br />`CALL prc1(15);
CALL prc1(1);`<br />显示信息<br />`INFO: this is 15.
prc1
(1 row)
prc1
(1 row)`

举例2：<br />创建存储过程中带有循环函数<br />CREATE OR REPLACE PROCEDURE prc2(n in int,a out int) as<br />i int:=0;<br />BEGIN<br />label: loop<br />n=n-1;<br />i=i+1;<br />raise info '循环进行 %次. ', i; <br />IF n<3 then<br />leave label;<br />END IF;<br />END LOOP;<br />a=n;<br />END;<br />/<br />调用存储过程<br />CALL prc2(6,1);<br />显示信息<br />INFO:循环进行1次.<br />INFO:循环进行2次.<br />INFO:循环进行3次.<br />INFO:循环进行4次.<br />a<br />2<br />(1 row)
### 2.IF...THEN...ELSE
增加了ELSE的分支，可以声明在条件为假的时候执行的语句。<br />举例：<br />创建存储过程中包含事务commit、rollback<br />CREATE OR REPLACE PROCEDURE prc3(n in int,a out int) as<br />i int:=0;<br />BEGIN<br />WHILE n>3 LOOP <br />n=n-1;<br />i=i+1;<br />IF  n<5 then<br />raise info '循环进行 %次. ', i; <br />commit; <br />ELSE<br />rollback;<br />END IF;<br />END LOOP;<br />a=n;<br />END;<br />/<br />调用存储过程<br />CALL prc3(6,1);<br />显示信息<br />INFO:循环进行2次.<br />INFO:循环进行3次.<br />a<br />3<br />(1 row)
### 3.IF...THEN...ELSE IF
一个IF语句的ELSE部分嵌套了另一个IF语句。因此需要一个END IF语句给每个嵌套的IF，另外还需要一个END IF语句结束父IF-ELSE。<br />举例:<br />创建一个函数<br />CREATE FUNCTION func4(a int) return text<br />as<br />BEGIN<br />IF a=1 THEN<br />return 'female';<br />ELSE <br />IF a=0 THEN<br />return 'male';<br />END IF;<br />END IF;<br />END;<br />/<br />调用存储过程<br />CALL func4(1);<br />显示信息<br />func4<br />female<br />(1 row)
### 4.IF...THEN...ELSIF...ELSE
有多个选项，可使用该种形式。<br />举例:<br />创建一个函数（同上，但可能存在输入错误的形式）<br />CREATE FUNCTION func5(a int) return text<br />as<br />BEGIN<br />IF a=1 THEN<br />return 'female';<br />ELSIF a=0 THEN<br />return 'male';<br />ELSE<br />return 'WRONG!';<br />END IF;<br />END;<br />/<br />调用存储过程<br />CALL func5(15);<br />显示信息<br />func5<br />WRONG!<br />(1 row)
### 5.IF...THEN...ELSE IF...ELSE
ELSEIF是ELSIF的别名。与IF...THEN...ELSIF...ELSE用法相同。有多个选项，可使用该种形式。<br />举例:<br />创建一个存储过程，比较a,b的大小<br />CREATE OR REPLACE PROCEDURE prc6(a int,b int) <br />AS<br />BEGIN<br />IF a>b THEN<br />raise info 'a is greater than b. %>%',a,b; <br />ELSIF a<b THEN<br />raise info 'b is greater than a. %>%',b,a; <br />ELSE<br />raise info 'a is equal to b. %=%',a,b; <br />END IF;<br />RETURN;<br />END;<br />/<br />调用存储过程<br />CALL prc6(4,8);<br />CALL prc6(11,2);<br />CALL prc6(33,33);<br />显示信息<br />INFO: b is greater than a. 8>4<br />prc6<br />(1 row)<br />INFO: a is greater than b. 11> 2<br />prc6<br />------<br />(1 row)<br />INFO: a is equal to b. 33=33<br />prc6<br />------<br />(1 row)



