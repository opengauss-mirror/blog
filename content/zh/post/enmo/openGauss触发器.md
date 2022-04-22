+++

title = "openGauss触发器" 

date = "2022-04-22" 

tags = ["openGauss触发器"] 

archives = "2022-04" 

author = "云和恩墨" 

summary = "openGauss触发器"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# openGauss触发器

本文出处：[https://www.modb.pro/db/222642](https://www.modb.pro/db/222642)

## 学习地址

[https://www.modb.pro/course/133](https://www.modb.pro/course/133)

## 学习目标

**学习openGauss触发器**

触发器是对应用动作的响应机制，当应用对一个对象发起DML操作时，就会产生一个触发事件（Event），如果该对象上拥有该事件对应的触发器，那么就会检查触发器的触发条件（Condition）是否满足，如果满足触发条件，那么就会执行触发动作（Action）

## 课后作业

### **1.创建源表和触发表，在源表上创建insert触发器，创建操作触发表的触发器函数**

```
omm=# CREATE TABLE test_trigger_src_tbl(id1 INT, id2 INT, id3 INT) ;
CREATE TABLE
omm=# CREATE TABLE test_trigger_des_tbl(id1 INT, id2 INT, id3 INT);
CREATE TABLE
omm=# CREATE OR REPLACE FUNCTION tri_insert_func() RETURNS TRIGGER AS
omm-# $$
omm$# DECLARE
omm$# BEGIN
omm$# INSERT INTO test_trigger_des_tbl VALUES(NEW.id1, NEW.id2, NEW.id3);
omm$# RETURN NEW;
omm$# END
omm$# $$ LANGUAGE PLPGSQL;
CREATE FUNCTION
omm=# CREATE TRIGGER insert_trigger
omm-# BEFORE INSERT ON test_trigger_src_tbl
omm-# FOR EACH ROW
omm-# EXECUTE PROCEDURE tri_insert_func();
CREATE TRIGGER
omm=# 
omm=# CREATE OR REPLACE FUNCTION tri_update_func() RETURNS TRIGGER AS
omm-# $$
omm$# DECLARE
omm$# BEGIN
omm$# UPDATE test_trigger_des_tbl SET id3 = NEW.id3 WHERE id1=OLD.id1;
omm$# RETURN OLD;
omm$# END
omm$# $$ LANGUAGE PLPGSQL;
CREATE FUNCTION
omm=# CREATE TRIGGER update_trigger
omm-# AFTER UPDATE ON test_trigger_des_tbl
omm-# FOR EACH ROW
omm-# EXECUTE PROCEDURE tri_update_func();
CREATE TRIGGER
omm=# CREATE OR REPLACE FUNCTION TRI_DELETE_FUNC() RETURNS TRIGGER AS
omm-# $$
omm$# DECLARE
omm$# BEGIN
omm$# DELETE FROM test_trigger_des_tbl WHERE id1=OLD.id1;
omm$# RETURN OLD;
omm$# END
omm$# $$ LANGUAGE PLPGSQL;
CREATE FUNCTION
omm=# CREATE TRIGGER delete_trigger
omm-# BEFORE DELETE ON test_trigger_des_tbl
omm-# FOR EACH ROW
omm-# EXECUTE PROCEDURE tri_delete_func();
CREATE TRIGGER
omm=# 
```

### **2.在源表上执行insert操作，查看触发操作是否生效；禁用触发器后，再次查看触发操作是否生效**

```
omm=# INSERT INTO test_trigger_src_tbl VALUES(100,200,300);
INSERT 0 1
omm=# SELECT * FROM test_trigger_src_tbl;
 id1 | id2 | id3 
-----+-----+-----
 100 | 200 | 300
(1 row)

omm=# SELECT * FROM test_trigger_des_tbl;
 id1 | id2 | id3 
-----+-----+-----
 100 | 200 | 300
(1 row)

omm=# 
omm=# ALTER TABLE test_trigger_src_tbl DISABLE TRIGGER insert_trigger;
ALTER TABLE
omm=# INSERT INTO test_trigger_src_tbl VALUES(100,200,300);
INSERT 0 1
omm=# SELECT * FROM test_trigger_src_tbl;
 id1 | id2 | id3 
-----+-----+-----
 100 | 200 | 300
 100 | 200 | 300
(2 rows)

omm=# SELECT * FROM test_trigger_des_tbl;
 id1 | id2 | id3 
-----+-----+-----
 100 | 200 | 300
(1 row)

omm=# 
```

### **3.使用系统表PG_TRIGGER和\dS+查看触发器**

```
omm=# INSERT INTO test_trigger_src_tbl VALUES(100,200,300);
INSERT 0 1
omm=# SELECT * FROM test_trigger_src_tbl;
 id1 | id2 | id3 
-----+-----+-----
 100 | 200 | 300
(1 row)

omm=# SELECT * FROM test_trigger_des_tbl;
 id1 | id2 | id3 
-----+-----+-----
 100 | 200 | 300
(1 row)

omm=# 
omm=# ALTER TABLE test_trigger_src_tbl DISABLE TRIGGER insert_trigger;
ALTER TABLE
omm=# INSERT INTO test_trigger_src_tbl VALUES(100,200,300);
INSERT 0 1
omm=# SELECT * FROM test_trigger_src_tbl;
 id1 | id2 | id3 
-----+-----+-----
 100 | 200 | 300
 100 | 200 | 300
(2 rows)

omm=# SELECT * FROM test_trigger_des_tbl;
 id1 | id2 | id3 
-----+-----+-----
 100 | 200 | 300
(1 row)

omm=# 
```

### **4.重命名触发器**

```
omm=# ALTER TRIGGER delete_trigger ON test_trigger_des_tbl RENAME TO delete_trigger_renamed;
ALTER TRIGGER
omm=# 
```

### **5.删除触发器**

```
omm=# DROP TRIGGER insert_trigger ON test_trigger_src_tbl;
DROP TRIGGER
omm=# DROP TRIGGER update_trigger ON test_trigger_des_tbl;
DROP TRIGGER
omm=# DROP TRIGGER delete_trigger_renamed ON test_trigger_des_tbl;
DROP TRIGGER
omm=# 
```
