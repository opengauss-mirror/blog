+++

title = "MogDB/opengauss触发器简介（1）" 

date = "2022-08-12" 

tags = ["MogDB"] 

archives = "2022-08" 

author = "云和恩墨-郭欢" 

summary = "MogDB/opengauss触发器简介（1）"

img = "/zh/post/guohuan/title/img.png" 

times = "10:20"

+++

# MogDB/opengauss触发器简介（1）

触发器是对应用动作的响应机制，当应用对一个对象发起DML操作时，就会产生一个触发事件（Event）。如果该对象上拥有该事件对应的触发器，那么就会检查触发器的触发条件（Condition）是否满足，如果满足触发条件，那么就会执行触发动作（Action）。

- 事件：触发器的触发事件,当对一个对象执行UPDATE/DELETE/INSERT等操作的时候，会激活触发器检查触发条件。

- 条件：触发条件可以是一个表达式或者是一个SQL查询语句，当触发条件的执行结果是FALSE、NULL或者空集的时候，代表触发条件不满足，触发器不会被触发。

- 动作：触发动作和存储过程相似，它的执行结合了触发器本身的特点，比如可以直接使用触发条件中的执行结果，或者是执行事件修改的元组中的值。

通过CREATE TRIGGER命令可以创建一个触发器，在CREATE TRIGGER命令中可以指定触发器的事件、条件和动作。

创建触发器具体语句如下：

```sql
CREATE [ CONSTRAINT ] TRIGGER trigger_name { BEFORE | AFTER | INSTEAD OF } { event [ OR '...'] }
    ON table_name
    [ FROM referenced_table_name ]
    { NOT DEFERRABLE | [ DEFERRABLE ] { INITIALLY IMMEDIATE | INITIALLY DEFERRED } }
    [ FOR [ EACH ] { ROW | STATEMENT } ]
    [ WHEN ( condition ) ]
    EXECUTE PROCEDURE function_name ( arguments );
```

触发事件满足时，还需要考虑触发器的执行时机，触发器语法中提供了两个触发时机：BEFORE和AFTER。顾名思义，BEFORE就是在触发器事件执行之前检查触
发条件以及执行触发动作，而AFTER则是在触发事件之后检查触发条件以及执行触发动作。

在UPDATE事件发生之前执行触发器，具体语句如下：

```sql
CREATE TRIGGER before_update
 BEFORE UPDATE
 ON ...
```

在INSERT事件发生之后执行触发器，具体语句如下：

```sql
CREATE TRIGGER after_insert
 AFTER INSERT
 ON ...
```

触发器可以对应到元组（一个SQL语句可以更新多个元组），也可以对应到SQL语句级，默认是SQL语句级。

针对SQL语句级的触发器，具体语句如下：

```sql
CREATE TRIGGER after_insert
 AFTER INSERT
 ON warehouse
 FOR EACH STATEMENT
 ...
```

针对元组级的触发器，具体语句如下：

```sql
CREATE TRIGGER after_insert
 AFTER INSERT
 ON warehouse
 FOR EACH ROW
 ...
```

