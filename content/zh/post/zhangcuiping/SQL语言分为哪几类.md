+++

title = "SQL语言分为哪几类" 

date = "2022-08-11" 

tags = ["SQL语言分为哪几类"] 

archives = "2022-04" 

author = "张翠娉" 

summary = "SQL语言分为哪几类"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "10:20"

+++

# SQL语言分为哪几类



## **介绍**

SQL语言分为三类，包括DDL、DML和DCL。

## DDL

DDL（Data Definition Language，数据定义语言） 用来创建或者删除存储数据用的数据库以及数据库中的表等对象。DDL 包含以下几种指令。

CREATE TABLE：创建数据库表
ALTER TABLE：更改表结构、添加、删除、修改列长度
DROP TABLE：删除表
CREATE INDEX：在表上建立索引
DROP INDEX：删除索引

## DML

DML（Data Manipulation Language，数据操纵语言） 用来查询或者变更表中的记录。DML 包含以下几种指令。

INSERT：添加数据到数据库中
UPDATE：修改数据库中的数据
DELETE：删除数据库中的数据
SELECT：选择（查询）数据
SELECT是SQL语言的基础，最为重要。

## DCL

DCL（Data Control Language，数据控制语言） 用来确认或者取消对数据库中的数据进行的变更。除此之外，还可以对 RDBMS 的用户是否有权限操作数据库中的对象（数据库表等）进行设定。DCL 包含以下几种指令。

GRANT：授予访问权限
REVOKE：撤销访问权限
COMMIT：提交事务处理
ROLLBACK：事务处理回退
SAVEPOINT：设置保存点
LOCK：对数据库的特定部分进行锁定

**附：SQL基本书写规则：**

- SQL语句要以分号（ ; ）结尾

- SQL 不区分关键字的大小写，但是插入到表中的数据是区分大小写的

- win 系统默认不区分表名及字段名的大小写

-  linux / mac 默认严格区分表名及字段名的大小写

- 常数的书写方式是固定的

- 单词需要用半角空格或者换行来分隔
  