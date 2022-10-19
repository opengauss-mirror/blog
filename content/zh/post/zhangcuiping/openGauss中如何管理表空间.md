+++

title = "openGauss中如何管理表空间" 

date = "2022-07-20" 

tags = ["数据库入门"] 

archives = "2022-10" 

author = "张翠娉" 

summary = "openGauss中如何管理表空间"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "14:20"

+++

# openGauss中如何管理表空间

在openGauss中，表空间是一个目录，在物理数据和逻辑数据间提供了抽象的一层，为所有的数据库对象分配存储空间，里面存储的是它所包含的数据库的各种物理文件。由于表空间是一个目录，仅是起到了物理隔离的作用，其管理功能依赖于文件系统。

表空间可以存在多个，创建好之后，创建数据库对象时可以指定该对象所属的表空间。

- 创建表空间

  1. 执行如下命令创建用户jack。

     ```sql
     openGauss=#CREATE USER jack IDENTIFIED BY 'Bigdata@123';
     NOTICE:  The encrypted password contains MD5 ciphertext, which is not secure.
     CREATE ROLE
     ```

  2. 执行如下命令创建表空间。

     ```sql
     openGauss=#CREATE TABLESPACE fastspace RELATIVE LOCATION 'tablespace/tablespace_1';
     CREATE TABLESPACE
     ```

  3. 数据库系统管理员执行如下命令将“fastspace”表空间的访问权限赋予数据用户jack。

     ```sql
     openGauss=#GRANT CREATE ON TABLESPACE fastspace TO jack;
     GRANT
     ```

- 在表空间中创建对象

  如果用户拥有表空间的CREATE权限，就可以在表空间上创建数据库对象，比如：表和索引等。

  以创建表为例。

  执行如下命令在指定表空间创建表。

  ```sql
  openGauss=# CREATE TABLE foo(i int) TABLESPACE fastspace;
  CREATE TABLE
  ```

- 查询表空间

  检查pg_tablespace系统表。如下命令可查到系统和用户定义的全部表空间。

  ```sql
  openGauss=# SELECT spcname FROM pg_tablespace;
    spcname   
  ------------
   pg_default
   pg_global
   fastspace
  (3 rows)
  ```

- 修改表空间

  ```sql
  openGauss=# ALTER TABLESPACE fastspace RENAME TO fspace;
  ALTER TABLESPACE
  ```

- 删除表空间

  **注意**：表空间下存在对象（表）时，无法删除。

  ```sql
  openGauss=# DROP TABLESPACE fspace;
  ERROR:  tablespace "fspace" is not empty
  openGauss=# drop table foo;
  DROP TABLE
  openGauss=# drop tablespace fspace;
  DROP TABLESPACE
  ```