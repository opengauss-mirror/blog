---
title: 'DataKit数据迁移-2实例搭建步骤'
date: '2024-04-26'
category: 'blog'
tags: ['openGauss技术文章征集','openGauss','DataKit','数据迁移']
archives: '2024-04'
author: 'duanguoqiang'
summary: '使用DataKit进行MySQL到openGauss数据迁移教程-2'
img: ''
times: '16:40'
---


说明：此文档仅包含使用DataKit进行数据迁移时，搭建迁移任务相关教程，不包含一些必须的前置配置步骤，和环境要求等，请优先学习“**DataKit数据迁移-1使用说明**”文档。

# 数据迁移实例搭建步骤

## 1 离线模式迁移步骤

- 创建源端数据库用例，并初始化数据

  详细说明，参考“迁移各步骤详细说明”目录下：“1 创建源端数据库用例，并初始化数据”，下同。

- 创建目标端数据库B库

  详细说明：“2 创建目标端数据库B库”

- 使用B库连接openGauss数据库，并在目标端创建与mysql对象definer同名的用户，并赋权

  详细说明：“3 在目标端创建与MySQL对象definer同名的用户，并赋权”

- DataKit新增目标端和源端数据源

  详细说明：“4 DataKit新增目标端和源端数据源”

- 创建迁移任务

  详细说明：“5 创建迁移任务步骤”

- 启动迁移任务，查看任务详情

  详细说明：“6 启动迁移任务，查看任务详情”

- 解决前置校验失败

  详细说明：“7 解决前置校验失败”

- 重置迁移任务， 查看任务详情

  详细说明：“8 重置迁移任务， 查看任务详情”

- 等待迁移任务完成，手动校验迁移结果

  详细说明：“9 校验全量迁移结果”

## 2 在线模式迁移步骤

- 创建源端数据库用例，并初始化数据

  同离线模式步骤

- 创建目标端数据库B库

  同离线模式步骤

- 使用B库连接openGauss数据库，并在目标端创建与mysql对象definer同名的用户，并赋权

  同离线模式步骤

- DataKit新增目标端和源端数据源

  同离线模式步骤

- 创建迁移任务

  同离线模式步骤

- 启动迁移任务，查看任务详情

  同离线模式步骤

- 解决前置校验失败

  同离线模式步骤

- 重置迁移任务， 查看任务详情

  同离线模式步骤

- 校验全量迁移结果

  同离线模式“校验迁移结果”步骤

- 修改源端数据库数据，校验增量迁移结果

  详细说明：“10 修改源端数据库数据，校验增量迁移结果”

- 结束增量迁移，启动反向迁移

  详细说明：“11 结束增量迁移，启动反向迁移”

- 修改目标端数据库数据，检验反向迁移结果

  详细说明：“12 修改目标端数据库数据，检验反向迁移结果”

- 结束迁移任务

- 详细说明：“13 结束在线模式迁移任务”

# 迁移各步骤详细说明

## 1 创建源端数据库用例，并初始化数据

连接MySQL数据库，并执行如下sql语句，在源端创建source_db数据库，作为迁移的源端数据库用例。

```sql
DROP DATABASE IF EXISTS source_db;

CREATE DATABASE source_db;
USE source_db;

CREATE TABLE table1(id INT, name VARCHAR(10), col VARCHAR(20), PRIMARY KEY(id));
INSERT INTO table1 VALUES(1,'data', 'data1');
INSERT INTO table1 VALUES(2,'data', 'data2');
INSERT INTO table1 VALUES(3,'data', 'data3');
INSERT INTO table1 VALUES(4,'data', 'data4');
INSERT INTO table1 VALUES(5,'data', 'data5');
INSERT INTO table1 VALUES(6,'data', 'data6');

CREATE VIEW view1 AS SELECT * FROM table1;

CREATE FUNCTION mysql_func1(s CHAR(20)) RETURNS CHAR(50) DETERMINISTIC RETURN CONCAT('mysql_func1, ',s,'!');

CREATE TRIGGER trigger1 BEFORE INSERT ON table1 FOR EACH ROW SET new.col = CONCAT(new.name, new.id);

CREATE PROCEDURE procedure1() SELECT * FROM table1;
```

## 2 创建目标端数据库B库

连接openGauss数据库，并执行如下sql语句，创建B库。

```sql
create database target_db with dbcompatibility = 'b';
```

## 3 在目标端创建与MySQL对象definer同名的用户，并赋权

当源端数据库中有视图（view），触发器（trigger）或存储过程（procedure）的对象时，需要在目标端创建与其对象definer同名的用户。

**查询MySQL端对象definer**

```sql
-- 查询MySQL对象definer的sql语句
show create view view1;
```

查询结果类似如下：

```tex
View	Create View	character_set_client	collation_connection
view1	CREATE ALGORITHM=UNDEFINED DEFINER=`test`@`%` SQL SECURITY DEFINER VIEW `view1` AS select `table1`.`id` AS `id`,`table1`.`name` AS `name`,`table1`.`col` AS `col` from `table1`	utf8mb3	utf8mb3_general_ci
```

其中：“`'test'@'%'`”即为MySQL对象definer

**使用B库连接openGauss数据库**

```shell
-- 通过gsql连接B库
gsql -d target_db -p 5680 -r
-- 或，在gsql已连接情况下切换至B库
\c target_db
```

**在目标端创建与mysql对象definer同名的用户，并赋权**

```sql
-- 创建与mysql对象definer同名的用户，并赋权的sql语句
-- 设置b_compatibility_user_host_auth参数值为on
set b_compatibility_user_host_auth to on;
-- 创建同名用户
create user 'username'@'%' with password 'Sample@123';
-- 给新增用户赋权
grant all privileges to 'username'@'%';
```

## 4 DataKit新增目标端和源端数据源

请按照如下步骤，分别添加源端MySQL数据源和目标端openGauss数据源。

1. 访问DataKit服务，点击进入“资源中心->实例管理”目录下
2. 点击“创建”按钮，弹出“新增数据源”窗口
3. 进行新增数据源配置
    - 集群名称可忽略，也可自定义
    - 数据库类型选择“MYSQL”或“OPENGAUSS”
    - 准确配置数据库服务的ip地址，端口，用户名，密码信息
    - 连接拓展属性，及使用jdbc连接数据库服务时，做的一些时区，字符集限制等，可忽略
    - 连接地址，即通过上述配置的连接信息拼出的jdbc连接数据库的url
4. 配置完成后，点击“测试连通性”
    - “待检测”显示为“可用”，说明可以成功建立连接
    - “待检测”显示为“不可用”，说明存在网络问题，或配置信息有误，请校验后重试。
5. “测试连通性”可用后，点击“确认”按钮，成功添加数据库实例

## 5 创建迁移任务步骤

1. Datakit成功加载data-migration插件

2. 点击进入DataKit服务“数据迁移 -> 迁移任务中心”目录下

3. 点击“创建数据迁移任务”按钮

4. 开始“选择迁移源库和目的库”步骤

    - 选择源端数据库（MySQL端），选择目的端数据库（openGauss端），并点击“添加子任务”按钮，支持添加多条子任务。
    - 成功添加子任务后，在页面下方选择对应子任务的“迁移过程模式”，支持选择“在线模式”和“离线模式”。
    - “选择迁移源库和目的库”配置成功，点击下一步。

   **注：**

    - 如果无数据源，点击“新增数据源”，输入所需参数进行新增，或参考目录“4 DataKit新增目标端和源端数据源”。

    - 目的端选择目录“2 创建目标端数据库B库”已创建好的B库。

    - 迁移过程模式，支持在线模式和离线模式。

      离线模式：自动执行全量迁移 + 全量校验，完成后自动结束。

      在线模式：可执行全量迁移 + 全量校验 + 增量迁移 + 增量校验 + 反向迁移。其中portal自动执行全量迁移 + 全量校验 + 增量迁移 + 增量校验，然后一直处于增量迁移状态（此时增量迁移和增量校验同时运行）。用户需要手动停止增量迁移，然后手动启动反向迁移，此后一直处于反向迁移状态。如果需要结束任务，需要用户手动结束迁移。

5. 开始“配置迁移过程参数”步骤

   直接使用默认参数即可，点击“下一步”。

6. 开始“分配执行机资源”步骤

   页面会展示所有的执行机列表信息，页面左侧复选框，勾选一台已安装迁移套件（portal）的执行机，点击完成，创建迁移任务成功。

   **注：**

    - 执行机，是指安装有portal（portal时具体执行迁移任务的插件）的服务器。即，迁移任务实际上是在安装portal的服务器上，使用portal插件执行的，DataKit这里只是作为一个集中管理迁移任务的客户端。
    - 如果没有已安装迁移套件的执行机，详细见文档“**DataKit数据迁移-1使用说明**”中，目录：“DataKit安装Portal教程”。

7. 查看迁移任务

   点击进入目录“数据迁移 -> 迁移任务中心”下，可以看到已创建成功的迁移任务列表信息。

8. 修改迁移任务配置

   迁移任务列表中，字段“执行状态”为未启动的任务，点击对应数据行右侧“详请”，可以看到上述“创建迁移任务步骤”的过程配置信息，并支持修改配置。

## 6 启动迁移任务，查看任务详情

1. 点击进入DataKit服务“数据迁移 -> 迁移任务中心”目录下
2. 找到上述创建的迁移任务记录，点击记录右侧的“启动”，迁移任务启动成功
3. 点击记录右侧的“详情”，进入迁移任务详情页
4. 点击对应子任务右侧的“详情”，可查看子任务迁移的详细过程数据
5. “在线/离线迁移过程记录”中，会展示详细的迁移情况
6. 其中全量迁移会展示表，视图，函数，触发器和存储过程的迁移情况，迁移状态为绿色“√”图标时，说明迁移成功，为橙色“×”图标时，说明迁移失败。
7. 全量校验则只校验拥有主键的表，同样校验状态为绿色“√”图标时，说明迁移成功，为橙色“×”图标时，说明校验失败。
8. 当存在失败的情况时，点击对应子任务右侧的“日志”，可以选择下载所需日志，查看日志中的报错信息并解决。

## 7 解决前置校验失败

如果未出现“前置校验失败”的状态，则不需要解决，跳过此步骤即可。

当出现前置校验失败时，鼠标悬浮于对应子任务“前置校验失败”提示的右侧橙色“×”图标上，即可查看校验失败的详细信息，根据详细信息中提示的校验失败项，参考文档“**DataKit数据迁移-3前置校验失败的处理**”，对失败项进行解决。

## 8 重置迁移任务， 查看任务详情

如果未出现“前置校验失败”的状态，则不需要此操作，跳过此步骤即可。

当解决完成“前置校验失败”的项目后，在页面的标签页栏中关闭此任务的“任务详情”页面，点击回到“迁移任务中心”页面，找到对应迁移任务记录，点击对应页面右侧的“结束迁移”，然后点击“重置”，再点击“启动”，重新启动此迁移任务，再次点击“详情”，即可查看迁移任务详细的过程信息。

## 9 校验全量迁移结果

当离线模式迁移任务完成，或在线模式全量校验完成后，可以手动连接到迁移的目标端数据库，通过如下sql语句，手动查看并校验库中数据是否于源端数据库中数据相同。

```sh
-- 使用B库连接openGauss数据库
gsql -d target_db -p 5680 -r
```

```sql
-- 或在已连接的情况下，切换到目标端B库
\c target_db

-- 设置默认的schema
SET CURRENT_SCHEMA TO source_db;

-- 查看表格和视图
SHOW TABLES;

-- 查询触发器
SHOW TRIGGERS;

-- 查看函数
SHOW FUNCTION STATUS WHERE Db = 'source_db';

-- 查看存储过程
SHOW PROCEDURE STATUS WHERE Db = 'source_db';

-- 查询表中数据
SELECT * FROM table1;
```

**注：**此处设置默认的schema，是由于数据迁移会默认在目标端数据库中创建与源端数据库同名的的schema，并将源端数据库中的数据迁移到此schema中。

## 10 修改源端数据库数据，校验增量迁移结果

在源端依次执行增删改和创建表格等操作，可以查看对应迁移任务详情中，“累计增量迁移对象数”会随着操作逐次增加，当“剩余待写入数据”条数为0时，说明所有数据库操作均已增量迁移成功。

也可以每次源端做出操作后，在目标端手动校验数据是否同步，以验证增量迁移情况。

**修改源端数据库数据**

```sql
-- 增删改操作
-- 插入数据
INSERT INTO table1 VALUES(7, 'data', 'data7');
-- 修改数据
UPDATE table1 SET NAME = 'new_data' WHERE id = 7;
-- 删除数据
DELETE FROM table1 WHERE id = 7;

-- DDL操作
-- 创建表
CREATE TABLE table2 (
    id INT, 
    NAME VARCHAR(10)
);
-- 删除表
DROP TABLE table2;
```

**手动校验增量迁移结果**

```sql
-- 增删改操作校验
-- 查询表中修改的数据是否同步
select * from table1;

-- DDL操作校验
-- 查询目标端表格的增删情况
SHOW TABLES;

-- 查询目标端表结构，与新增表结构是否一致
SHOW CREATE TABLE table2;
```

## 11 结束增量迁移，启动反向迁移

点击对应子任务右侧的“停止增量”，点击“确认”按钮，等待增量迁移停止。

增量迁移成功停止后，对应子任务右侧的“启动反向”，点击查看详情，可以查看反向迁移详细过程。

## 12 修改目标端数据库数据，检验反向迁移结果

在目标端依次执行增删改操作，可以查看对应迁移任务详情中，“累计反向迁移对象数”会随着操作逐次增加，当“剩余待写入数据”条数为0时，说明所有数据库操作均已反向迁移成功。

也可以每次目标端做出操作后，在源端手动校验数据是否同步，以验证反向迁移情况。

**修改目标端数据库数据**

```sql
-- 增删改操作
-- 插入数据
INSERT INTO table1 VALUES(7, 'data', 'data7');
-- 修改数据
UPDATE table1 SET NAME = 'new_data' WHERE id = 7;
-- 删除数据
DELETE FROM table1 WHERE id = 7;
```

**手动校验反向迁移结果**

```sql
-- 增删改操作校验
-- 依次查询修改是否同步
select * from table1;
```

## 13 结束在线模式迁移任务

在线模式迁移任务不同与离线模式，当不手动进行停止操作时，会始终处于反向迁移状态下。

点击对应子任务右侧“结束迁移”，等待迁移任务停止，则此在线模式迁移任务完成。