---
title: 'MogDB/opengauss触发器简介（2）'

date: '2022-08-12'

category: 'blog'
tags: ['MogDB']

archives: '2022-08'

author: '云和恩墨-郭欢'

summary: 'MogDB/opengauss触发器简介（2）'

img: '/zh/blogs/guohuan/title/img.png'

times: '10:20'
---

# MogDB/opengauss 触发器简介（2）

针对触发对象的触发事件一旦发生，就会激活触发器，触发器首先会检查触发条件，只有在满足触发条件的情况下，才会被真正地执行。其中元组级的触发器可以将更新前后的值嵌入到触发器的触发条件中。

- NEW.column_name：UPDATE 或 INSERT 事件对应“新”元组，column_name 对应新元组上的对应的列值

- OLD.column_name：UPDATE 或 DELETE 事件对应“老”元组，column_name 对应老元组上的列值

触发条件中包含 NEW 元组对应的列值。具体语句如下：

```
CREATE TRIGGER after_insert
 AFTER INSERT
 ON warehouse
 FOR EACH ROW
 WHEN (NEW.w_id>10)
 ...
```

触发器的动作主要是执行一个函数，在创建触发器之前，需要创建一个函数，如果返回值是 Trigger，那么该函数就是触发器函数，否则是普通函数。同一个触发器可以指定多个触发事件，每个事件发生时都能激活触发器来执行触发器的动作。

在 warehouse 表上创建一个完整的触发器，触发器的工作是在 wh_log 表中记录 DELETE/UPDATE/INSERT 操作的具体信息，实现语句如下：

```
CREATE TABLE wh_log
(
    event VARCHAR(10),
    time_stamp TIMESTAMP,
    w_id SMALLINT,
    w_name VARCHAR(10)
);

CREATE FUNCTION record_warehouse_log()
RETURNS TRIGGER AS $warehouse_log$
BEGIN
IF (TG_OP ='DELETE') THEN
INSERT INTO wh_log SELECT 'D', now(), OLD.w_id, OLD.w_name;
RETURN OLD;
ELSEIF (TG_OP ='UPDATE') THEN
INSERT INTO wh_log SELECT 'U', now(), NEW.w_id, NEW.w_name;
RETURN NEW;
ELSEIF (TG_OP ='INSERT') THEN
INSERT INTO wh_log SELECT 'I', now(), NEW.w_id, NEW.w_name;
RETURN NEW;
END IF;
RETURN NULL;
END;
$warehouse_log$ LANGUAGE plpgsql;

CREATE TRIGGER warehouse_log
AFTER INSERT OR UPDATE OR DELETE ON warehouse
FOR EACH ROW EXECUTE PROCEDURE record_warehouse_log();
```

如果需要删除触发器，可以使用 SQL 中的 DROP TRIGGER 命令。

```
DROP TRIGGER warehouse_log;
```
