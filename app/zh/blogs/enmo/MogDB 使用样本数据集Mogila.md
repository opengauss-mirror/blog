---
title: 'MogDB 使用样本数据集Mogila'

date: '2022-06-27'

category: 'blog'
tags: ['MogDB 使用样本数据集Mogila']

archives: '2022-06'

author: '云和恩墨'

summary: 'MogDB 使用样本数据集Mogila'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# MogDB 使用样本数据集 Mogila

MogDB 提供了一个样本数据集 Mogila，本数据集借鉴了适用于 MySQL 的[Sakila 示例数据库](https://dev.mysql.com/doc/sakila/en/)。**Sakila**最初由 MySQL AB 文档团队的 Mike Hillyer 开发，其目的是提供一个可用于书籍、教程、文章、样本等示例的标准 schema。

Mogila 数据集是一个关于 DVD 出租店信息的数据库，包含有关电影（如标题、类别、女演员）、出租店（如地址、工作人员、客户）和出租的信息。您可以使用 Mogila 数据库进行各种功能测试。

Mogila 适用于 MogDB 2.1 及更高版本。

## 实体-关系模型图

下图展示了 Mogila 数据库表和视图的概览。您可以查看不同表之间如何通过各个字段相互关联。例如，`film`表具有`title`和`description`列。它还通过列`language_id`和`original_language_id`与`language`表相关联。因此您可以联结这两个表来获取每部电影的语言，或者列出特定语言的所有电影。

<img src='./images/mogila-erm.png'>

## 在 MogDB 容器版中使用 Mogila

MogDB 容器版本已经内置了 Mogila 样本数据库，无需额外安装。

1. [安装 MogDB 容器版](https://docs.mogdb.io/zh/mogdb/v2.1/container-based-installation)。

2. 使用样本数据库 Mogila：

   ```
   docker exec -it mogdb bash
   omm@eb7aef3f860f:~$ gsql -d mogila -p5432
   gsql ((MogDB x.x.x build 56189e20) compiled at 2022-01-07 18:47:53 commit 0 last mr  )
   Non-SSL connection (SSL connection is recommended when requiring high-security)
   Type "help" for help.

   mogila=# \dt
                             List of relations
    Schema |     Name      | Type  | Owner |             Storage
   --------+---------------+-------+-------+----------------------------------
    public | actor         | table | mogdb | {orientation=row,compression=no}
    public | address       | table | mogdb | {orientation=row,compression=no}
    public | category      | table | mogdb | {orientation=row,compression=no}
    public | city          | table | mogdb | {orientation=row,compression=no}
    public | country       | table | mogdb | {orientation=row,compression=no}
    public | customer      | table | mogdb | {orientation=row,compression=no}
    public | film          | table | mogdb | {orientation=row,compression=no}
    public | film_actor    | table | mogdb | {orientation=row,compression=no}
    public | film_category | table | mogdb | {orientation=row,compression=no}
    public | inventory     | table | mogdb | {orientation=row,compression=no}
    public | language      | table | mogdb | {orientation=row,compression=no}
    public | payment       | table | mogdb | {orientation=row,compression=no}
    public | rental        | table | mogdb | {orientation=row,compression=no}
    public | staff         | table | mogdb | {orientation=row,compression=no}
    public | store         | table | mogdb | {orientation=row,compression=no}
   (15 rows)

   mogila=#
   ```

## 在 MogDB 企业版中使用 Mogila

1. [安装 MogDB 企业版](https://docs.mogdb.io/zh/mogdb/v3.0/installation-on-a-single-node)。

2. 创建样本数据库 mogila 及 mogdb 用户，然后登出：

   ```
   # 切换到omm用户
   [root@test ~]# su - omm
   # 登录postgres数据库，根据实际情况填写端口号
   [omm@test ~]$ gsql -d postgres -p5432 -r
   gsql ((MogDB x.x.x build 56189e20) compiled at 2022-01-07 18:47:53 commit 0 last mr  )
   Non-SSL connection (SSL connection is recommended when requiring high-security)
   Type "help" for help.
   MogDB=#create database mogila DBCOMPATIBILITY='PG';
   CREATE DATABASE
   MogDB=#create user mogdb password 'Enmo@123';
   CREATE ROLE
   MogDB=#\q
   [omm@test ~]$
   ```

3. [下载 mogila](https://gitee.com/enmotech/mogila)，并上传至服务器中，进入 mogila 所在目录。

4. 创建模式对象，然后手动插入数据：

   - 4.1 创建所有模式对象（表等）：

   `gsql -d mogila -p5432 -f mogila-schema.sql `

   - 4.2 插入所有数据：

   ```
   gsql -d mogila -p5432 -f mogila-data.sql

   复制
   ```

   **或者通过 1 个脚本创建模式对象并插入数据，如果您已经完成步骤 4.1 和 4.2，则无需执行步骤 5。**

5. 创建所有模式对象（表等）并插入所有数据：

   ```
   gsql -d mogila -p5432 -f mogila-insert-data.sql
   ```

6. 使用样本数据库 Mogila：

   ```
   [omm@test ~]$ gsql -d mogila -p5432 -r
   gsql ((MogDB x.x.x build 56189e20) compiled at 2022-01-07 18:47:53 commit 0 last mr  )
   Non-SSL connection (SSL connection is recommended when requiring high-security)
   Type "help" for help.

   mogila=# \dt
                             List of relations
    Schema |     Name      | Type  | Owner |             Storage
   --------+---------------+-------+-------+----------------------------------
    public | actor         | table | mogdb | {orientation=row,compression=no}
    public | address       | table | mogdb | {orientation=row,compression=no}
    public | category      | table | mogdb | {orientation=row,compression=no}
    public | city          | table | mogdb | {orientation=row,compression=no}
    public | country       | table | mogdb | {orientation=row,compression=no}
    public | customer      | table | mogdb | {orientation=row,compression=no}
    public | film          | table | mogdb | {orientation=row,compression=no}
    public | film_actor    | table | mogdb | {orientation=row,compression=no}
    public | film_category | table | mogdb | {orientation=row,compression=no}
    public | inventory     | table | mogdb | {orientation=row,compression=no}
    public | language      | table | mogdb | {orientation=row,compression=no}
    public | payment       | table | mogdb | {orientation=row,compression=no}
    public | rental        | table | mogdb | {orientation=row,compression=no}
    public | staff         | table | mogdb | {orientation=row,compression=no}
    public | store         | table | mogdb | {orientation=row,compression=no}
   (15 rows)

   mogila=#
   ```

## 示例查询

本节通过一些查询来展示如何使用样本数据库 Mogila。所有查询结果仅展示前 10 项。

- 按长度排序列出所有电影

  `select film_id, title, length from film order by length desc; `

  ```
  |film_id|title             |length|
  |-------|------------------|------|
  |426    |HOME PITY         |185   |
  |690    |POND SEATTLE      |185   |
  |609    |MUSCLE BRIGHT     |185   |
  |991    |WORST BANGER      |185   |
  |182    |CONTROL ANTHEM    |185   |
  |141    |CHICAGO NORTH     |185   |
  |349    |GANGS PRIDE       |185   |
  |212    |DARN FORRESTER    |185   |
  |817    |SOLDIERS EVOLUTION|185   |
  |872    |SWEET BROTHERHOOD |185   |
  ```

- 列出每个电影类别中有多少部电影

  `select category.name, count(category.name) category_count from category left join film_category on category.category_id = film_category.category_id left join film on film_category.film_id = film.film_id group by category.name order by category_count desc; `

  ```
  |name       |category_count|
  |-----------|--------------|
  |Sports     |74            |
  |Foreign    |73            |
  |Family     |69            |
  |Documentary|68            |
  |Animation  |66            |
  |Action     |64            |
  |New        |63            |
  |Drama      |62            |
  |Sci-Fi     |61            |
  |Games      |61            |
  ```

- 显示按出演电影的数量排序的演员

  `select actor.first_name, actor.last_name, count(actor.first_name) featured_count from actor left join film_actor on actor.actor_id = film_actor.actor_id group by actor.first_name, actor.last_name order by featured_count desc; `

  ```
  |first_name|last_name|featured_count|
  |----------|---------|--------------|
  |SUSAN     |DAVIS    |54            |
  |GINA      |DEGENERES|42            |
  |WALTER    |TORN     |41            |
  |MARY      |KEITEL   |40            |
  |MATTHEW   |CARREY   |39            |
  |SANDRA    |KILMER   |37            |
  |SCARLETT  |DAMON    |36            |
  |VIVIEN    |BASINGER |35            |
  |VAL       |BOLGER   |35            |
  |GROUCHO   |DUNST    |35            |
  ```

- 获取所有活跃客户的列表，按其姓名排序

  `select first_name, last_name from customer where active = 1 order by first_name asc; `

  ```
  |first_name|last_name|
  |----------|---------|
  |MARY      |SMITH    |
  |PATRICIA  |JOHNSON  |
  |LINDA     |WILLIAMS |
  |BARBARA   |JONES    |
  |ELIZABETH |BROWN    |
  |JENNIFER  |DAVIS    |
  |MARIA     |MILLER   |
  |SUSAN     |WILSON   |
  |MARGARET  |MOORE    |
  |DOROTHY   |TAYLOR   |
  ```

- 查看租 DVD 数量最多的客户，以及租借次数

  `select customer.first_name, customer.last_name, count(customer.first_name) rentals_count from customer left join rental on customer.customer_id = rental.customer_id group by customer.first_name, customer.last_name order by rentals_count desc; `

  ```
  |first_name|last_name|rentals_count|
  |----------|---------|-------------|
  |ELEANOR   |HUNT     |46           |
  |KARL      |SEAL     |45           |
  |CLARA     |SHAW     |42           |
  |MARCIA    |DEAN     |42           |
  |TAMMY     |SANDERS  |41           |
  |WESLEY    |BULL     |40           |
  |SUE       |PETERS   |40           |
  |MARION    |SNYDER   |39           |
  |RHONDA    |KENNEDY  |39           |
  |TIM       |CARY     |39           |
  ```

- 查看每个出租店的总收入

  `select store.store_id, sum(payment.amount) as "total revenue" from store left join inventory on inventory.store_id = store.store_id left join rental on rental.inventory_id = inventory.inventory_id left join payment on payment.rental_id = rental.rental_id where payment.amount is not null group by store.store_id order by sum(payment.amount) desc; `

  ```
  |store_id|total revenue|
  |--------|-------------|
  |       2|     33726.77|
  |       1|     33689.74|
  ```

- 按总收入列出前 5 个电影类型

  `select category.name, film.title, sum(payment.amount) as "gross revenue" from film left join film_category on film_category.film_id = film.film_id left join category on film_category.category_id = category.category_id left join inventory on inventory.film_id = film.film_id left join rental on rental.inventory_id = inventory.inventory_id left join payment on payment.rental_id = rental.rental_id where payment.amount is not null group by category.name, film.title order by sum(payment.amount) desc limit 5; `

  ```
  |   name     |       title       | gross revenue|
  |------------|-------------------|--------------|
  |Music       | TELEGRAPH VOYAGE  |        231.73|
  |Documentary | WIFE TURN         |        223.69|
  |Comedy      | ZORRO ARK         |        214.69|
  |Sci-Fi      | GOODFELLAS SALUTE |        209.69|
  |Sports      | SATURDAY LAMBS    |        204.72|
  ```

- `film.description` 的数据类型为 `text` ，支持全文搜索查询，搜索所有包含`documentary`和`robot`的描述

  `select film.title, film.description from film where to_tsvector(film.description) @@ to_tsquery('documentary & robot'); `

  ```
  |  title          |                                                    description                                                     |
  |-----------------|--------------------------------------------------------------------------------------------------------------------|
  |CASPER DRAGONFLY | A Intrepid Documentary of a Boat And a Crocodile who must Chase a Robot in The Sahara Desert                       |
  |CHAINSAW UPTOWN  | A Beautiful Documentary of a Boy And a Robot who must Discover a Squirrel in Australia                             |
  |CONTROL ANTHEM   | A Fateful Documentary of a Robot And a Student who must Battle a Cat in A Monastery                                |
  |CROSSING DIVORCE | A Beautiful Documentary of a Dog And a Robot who must Redeem a Womanizer in Berlin                                 |
  |KANE EXORCIST    | A Epic Documentary of a Composer And a Robot who must Overcome a Car in Berlin                                     |
  |RUNNER MADIGAN   | A Thoughtful Documentary of a Crocodile And a Robot who must Outrace a Womanizer in The Outback                    |
  |SOUTH WAIT       | A Amazing Documentary of a Car And a Robot who must Escape a Lumberjack in An Abandoned Amusement Park             |
  |SWEDEN SHINING   | A Taut Documentary of a Car And a Robot who must Conquer a Boy in The Canadian Rockies                             |
  |VIRGIN DAISY     | A Awe-Inspiring Documentary of a Robot And a Mad Scientist who must Reach a Database Administrator in A Shark Tank |

  复制
  ```

## 清理

如需清理环境并删除样本数据库，请运行以下命令：

```
\c postgres;
DROP DATABASE mogila;
```
