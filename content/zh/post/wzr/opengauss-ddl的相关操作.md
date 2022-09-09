**+++**
**title="openGauss社区入门(opengauss-ddl相关操作)"**
**date="2022-08-31"**
**tags=["openGauss社区开发入门"]**
**archives=“2022-08”**
**author=“wangrururu”**
**summary="openGauss社区开发入门"**
**img="/zh/post/wzr/title/title.jpg"**
**times="12：08"**
**+++**
**1. 定义**
修改表，包括修改表的定义、重命名表、重命名表中指定的列、重命名表的约束、设置表的所属模式、添加/更新多个列、打开/关闭行访问控制开关。
**2. 注意事项**
•表的所有者、被授予表ALTER权限的用户或被授予ALTER ANY TABLE的用户有权限执行ALTER TABLE命令，系统管理员默认拥有此权限。但要修改表的所有者或者修改表的模式，当前用户必须是该表的所有者或者系统管理员，且该用户是新的所有者角色的成员。
•不能修改分区表的tablespace，但可以修改分区的tablespace。
•不支持修改存储参数ORIENTATION。
•SET SCHEMA操作不支持修改为系统内部模式，当前仅支持用户模式之间的修改。
•列存表只支持PARTIAL CLUSTER KEY、UNIQUE、PRIMARY KEY表级约束，不支持外键等表级约束。
•列存表只支持添加字段ADD COLUMN、修改字段的数据类型ALTER TYPE、设置单个字段的收集目标SET STATISTICS、支持更改表名称、支持更改表空间，支持删除字段DROP COLUMN。对于添加的字段和修改的字段类型要求是列存支持的数据类型。ALTER TYPE的USING选项只支持常量表达式和涉及本字段的表达式，暂不支持涉及其他字段的表达式。
•列存表支持的字段约束包括NULL、NOT NULL和DEFAULT常量值、UNIQUE和PRIMARY KEY；对字段约束的修改当前只支持对DEFAULT值的修改（SET DEFAULT）和删除（DROP DEFAULT），暂不支持对非空约束NULL/NOT NULL的修改。
•不支持增加自增列，或者增加DEFAULT值中包含nextval()表达式的列。
•不支持对外表、临时表开启行访问控制开关。
•通过约束名删除PRIMARY KEY约束时，不会删除NOT NULL约束，如果有需要，请手动删除NOT NULL约束。
•使用JDBC时，支持通过PrepareStatement对DEFAUTL值进行参数化设置。
**3. 语法**
ALTER TABLE [ IF EXISTS ] { table_name [*] | ONLY table_name | ONLY ( table_name ) }
action [, ... ];
**4. 参数说明**
IF EXISTS
如果不存在相同名称的表，不报错，而会发出一个通知，告知表不存在。
•table_name [*] | ONLY table_name | ONLY ( table_name )
table_name是需要修改的表名。若声明了ONLY选项，则只有该表被更改。若未声明，该表及其所有子表都会被更改。
**（1）给表增加一列**
alter table t1 add col3 varchar(30);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661918946872-a12828b2-5d13-4df9-aeee-e33a3b228b4a.png#clientId=u8bb98dc9-d849-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=81&id=u310f7ca7&margin=%5Bobject%20Object%5D&name=image.png&originHeight=101&originWidth=354&originalType=binary&ratio=1&rotation=0&showTitle=false&size=43294&status=done&style=none&taskId=u9595cacd-0279-4fde-af49-faa168c3018&title=&width=283.2)
**（2）给表增加一个检查约束**
alter table t1 add constraint w1 check (col1 is not null);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661918958169-d98c0dbf-fc94-494a-8cba-1b60bd7d4c18.png#clientId=u8bb98dc9-d849-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=90&id=ud9827424&margin=%5Bobject%20Object%5D&name=image.png&originHeight=113&originWidth=337&originalType=binary&ratio=1&rotation=0&showTitle=false&size=43393&status=done&style=none&taskId=u1b815fd4-822c-4378-97f2-8ea8ac07c00&title=&width=269.6)
**（3）在一个操作中改变两个现存字段的类型。**
alter table t1 alter column col1 type varchar(80),alter column col2 type varchar(100);
或
alter table t1 modify (col1 varchar(30), col2 varchar(60));
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661918967892-dabef134-38c7-4d69-ab0a-597b9baf5099.png#clientId=u8bb98dc9-d849-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=90&id=ubcbe5dea&margin=%5Bobject%20Object%5D&name=image.png&originHeight=113&originWidth=322&originalType=binary&ratio=1&rotation=0&showTitle=false&size=45460&status=done&style=none&taskId=u40308184-95fa-4b1e-9c26-6fced9aaa37&title=&width=257.6)
**（4）给一个已存在字段添加非空约束。**
alter table t1 alter column col3 set not null;
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661918977343-e841a668-9eb4-4d23-8043-c185a946fa80.png#clientId=u8bb98dc9-d849-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=82&id=u47eed9fd&margin=%5Bobject%20Object%5D&name=image.png&originHeight=102&originWidth=283&originalType=binary&ratio=1&rotation=0&showTitle=false&size=38979&status=done&style=none&taskId=ud8b6060c-fed1-4dd0-bf9e-6095a0d68ac&title=&width=226.4)
**（5）移除已存在字段的非空约束。**
alter table t1 alter column col3 drop not null;
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661918990278-947e5ab7-bf51-40c6-b6c6-084e3c51544c.png#clientId=u8bb98dc9-d849-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=82&id=u0fd9c3c8&margin=%5Bobject%20Object%5D&name=image.png&originHeight=102&originWidth=280&originalType=binary&ratio=1&rotation=0&showTitle=false&size=40426&status=done&style=none&taskId=ub3d7b183-a4fb-4607-829e-7332901198a&title=&width=224)
（6）在一个列存表中添加局部聚簇列。
alter table t2 add partial cluster key(col1);
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661919001947-3cdb90cb-3a6c-4030-bd33-72d45eeb9326.png#clientId=u8bb98dc9-d849-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=82&id=u42eefe75&margin=%5Bobject%20Object%5D&name=image.png&originHeight=102&originWidth=435&originalType=binary&ratio=1&rotation=0&showTitle=false&size=41740&status=done&style=none&taskId=u8afce973-683b-43d9-b93c-7edc011bce6&title=&width=348)
（7）删除一个列存表中的局部聚簇列。
alter table t2 drop constraint t2_cluster;
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661919011200-a5911aa8-44c1-45ef-9d91-5d8810220df3.png#clientId=u8bb98dc9-d849-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=68&id=u5927a8e8&margin=%5Bobject%20Object%5D&name=image.png&originHeight=85&originWidth=304&originalType=binary&ratio=1&rotation=0&showTitle=false&size=32101&status=done&style=none&taskId=u753671b4-9984-4ef8-9816-8b80e7537db&title=&width=243.2)
（8）将表移动到另一个表空间。
alter table t2 set tablespace example1; 
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661919019660-53acad63-758a-47e8-a2a8-c25d60575803.png#clientId=u8bb98dc9-d849-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=79&id=uce2ab77f&margin=%5Bobject%20Object%5D&name=image.png&originHeight=99&originWidth=339&originalType=binary&ratio=1&rotation=0&showTitle=false&size=37404&status=done&style=none&taskId=u57900c94-e41e-4134-8b19-7ac4cac288a&title=&width=271.2)
（9）创建模式wzr，将表移动到该模式中。
create schema wzr;
alter table t2 set schema wzr;
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661919028296-77b17688-9061-4780-9491-7a9af23b2bf5.png#clientId=u8bb98dc9-d849-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=76&id=u830b0662&margin=%5Bobject%20Object%5D&name=image.png&originHeight=95&originWidth=295&originalType=binary&ratio=1&rotation=0&showTitle=false&size=32604&status=done&style=none&taskId=u0a41d3ed-287d-452d-85aa-a6178faf7bc&title=&width=236)
（10）重命名已存在的表
alter table wzr.t2 rename to testwzr;
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661919038424-aa42867a-7d3e-4bdd-983a-77f577038182.png#clientId=u8bb98dc9-d849-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=98&id=u364debb4&margin=%5Bobject%20Object%5D&name=image.png&originHeight=123&originWidth=415&originalType=binary&ratio=1&rotation=0&showTitle=false&size=53738&status=done&style=none&taskId=uc39e6393-19ca-44be-aeec-38319d3d107&title=&width=332)
（11）从表中删除一个字段。
alter table wzr.testwzr drop column col3;
![image.png](https://cdn.nlark.com/yuque/0/2022/png/32435345/1661919051707-3c4718d7-c44b-43bf-967f-50e499bdde8f.png#clientId=u8bb98dc9-d849-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=86&id=ue0569f65&margin=%5Bobject%20Object%5D&name=image.png&originHeight=108&originWidth=350&originalType=binary&ratio=1&rotation=0&showTitle=false&size=46175&status=done&style=none&taskId=ucb3256a0-3b69-42ba-998b-f08ddbf0615&title=&width=280)
