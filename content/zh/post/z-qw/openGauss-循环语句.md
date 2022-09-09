+++

title = "openGauss社区入门（openGauss-循环语句）" 

date = "2022-09-09" 

tags = ["openGauss社区开发入门"] 

archives = "2022-09" 

author = "z-qw" 

summary = "openGauss社区开发入门" 

img = "" 

times = "17:30" 

+++
## LOOP语句
1.与label标签名连用，可使用continue或者iterate + label标签名跳出本次循环，重新开始下一次循环；可使用exit/leave + label标签名 退出循环<br />创建循环，使用iterate + label标签名跳出本次循环；leave + label标签名 退出循环<br />CREATE OR REPLACE PROCEDURE prc_loop(i in integer, count out integer)<br />AS <br />BEGIN <br />count:=0; <br />label1:<br />LOOP <br /> IF count > i THEN <br />raise info 'count is %. ', count; <br />LEAVE label1;<br />ELSE<br />count:=count+1; <br />END IF; <br />IF count < 7 THEN <br />ITERATE label1;<br />ELSE<br />raise info 'greater than 7'; <br />END IF; <br />END LOOP label1; <br />END;<br />/<br />调用存储过程<br />CALL prc_loop(10,5);<br />显示信息<br />INFO: greater than 7<br />INFO: greater than 7<br />INFO: greater than 7<br />INFO: greater than 7<br />INFO: greater than 7<br />INFO: count is 11.<br />count<br />11<br />(1 row)

2.可用于存储过程带有自治事务、自定义函数、游标、触发器等环境中<br />举例：创建自定义函数<br />CREATE FUNCTION func_loop(a int,b int,i int) return int<br />AS<br />	BEGIN<br />		LOOP<br />		i=i-1;<br />		IF i>4 then<br />			CONTINUE;<br />		END IF;<br />		a=a+b;<br />		IF i<2 then<br />			EXIT;<br />		END IF;<br />		END LOOP;<br />		RETURN a;<br />	END;<br />/<br />--2.调用函数<br />CALL func_loop(1,2,7); <br />--显示信息<br />func_loop<br />9<br />(1 row)
## WHILE_LOOP 语句
在每次循环开始判断，若为真值，继续循环，反之，退出循环。<br />举例：<br />CREATE OR REPLACE PROCEDURE proc_while_loop(a int,b out int) <br />AS <br />DECLARE <br />i int :=1;  <br />BEGIN<br />WHILE i <a LOOP <br />raise info '循环%次. ', i; <br />i:=i+1; <br />END LOOP; <br />raise info 'i is %. ', i; <br />b=i;<br />END; <br />/<br />调用函数<br />CALL proc_while_loop(5,6);<br />显示信息<br />INFO:  循环1次.<br />INFO:  循环2次.<br />INFO:  循环3次.<br />INFO:  循环4次.<br />INFO:  i is 5.<br />b<br />5<br />(1 row)
## FOR_LOOP 语句
### 1.int类型变量
变量指定起始位置min，遍历到达指定终点位置max，其中max>=min.<br />举例：从5到10进行循环<br />CREATE OR REPLACE PROCEDURE proc_for_loop(sum out int)<br />AS<br />BEGIN<br />sum:=0;<br />FOR a IN 5..15 LOOP<br />sum=a+sum;<br />raise info '循环%次,和为%.', a-4,sum; <br />END LOOP;<br />END;<br />/	<br />调用函数<br />CALL proc_for_loop();<br />显示信息<br />INFO:  循环1次,和为5.<br />INFO:  循环2次,和为11.<br />INFO:  循环3次,和为18.<br />INFO:  循环4次,和为26.<br />INFO:  循环5次,和为35.<br />INFO:  循环6次,和为45.<br />INFO:  循环7次,和为56.<br />INFO:  循环8次,和为68.<br />INFO:  循环9次,和为81.<br />INFO:  循环10次,和为95.<br />INFO:  循环11次,和为110.<br />sum<br />110<br />(1 row)
### 2.查询语句变量
变量会自动定义，类型和查询结果的类型一致，并且只在此循环中有效。target的取值就是查询结果。<br />创建查询表<br />CREATE TABLE tb_select(id int,name text);<br />INSERT INTO tb_select VALUES(1,'lili'),(2,'kiko'),(3,'MING');<br />CREATE OR REPLACE PROCEDURE proc_for_loop_query(count out int)<br />AS <br />record text;<br />BEGIN<br />count=0;<br />FOR record IN SELECT name FROM tb_select LOOP<br />count=count+1;<br />raise info '名字是%.',record; <br />END LOOP; <br />END; <br />/<br />调用函数<br />CALL proc_for_loop_query(9);<br />显示信息<br />INFO:  名字是lili.<br />INFO:  名字是kiko.<br />INFO:  名字是MING.<br />count<br />3<br />(1 row)

