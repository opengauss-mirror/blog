---
title: 'MogDB/openGauss视图与物化视图'

date: '2022-07-28'

category: 'blog'
tags: ['MogDB']

archives: '2022-07'

author: '云和恩墨-郭欢'

summary: 'MogDB/openGauss视图与物化视图'

img: '/zh/blogs/guohuan/title/img.png'

times: '10:20'
---

# MogDB/openGauss 视图与物化视图

一个数据库通常分成外模式、模式和内模式三种模式：

- 外模式：也叫用户模式，是用户所能访问的一组数据视图，和某一应用的逻辑结构有关，是从模式中导出的一个子集，针对某一具体应用控制访问的可见性。
- 模式：数据库内所包含的逻辑结构，包括基本表的定义等。
- 内模式：数据库内部数据的存储方式，包括数据是否加密、压缩等。

数据库中的视图属于数据库的外模式，可以在不暴露整个数据库逻辑模型的基础上，让用户访问所需的数据。

创建一个与 warehouse 表相关的视图，只能显示仓库的名称，具体语句如下：

```
CREATE VIEW warehouse_name AS SELECT w_name FROM warehouse;
```

创建一个与 warehouse 表相关的视图，只显示编号小于 10 的仓库的名称和地址，具体语句如下：

```
CREATE VIEW warehouse_idlt10 AS SELECT w_name, w_street_1 FROM warehouse WHERE w_id < 10;
```

访问视图的方法和访问基本表完全一样，因此可以直接使用 SELECT 语句来访问视图。由于视图本身是一个“虚表”，是由模式映射出来的一种外模式，本身不保存数据，因此当基本表的数据发生变化时，视图中的数据也会同时发生变化。

视图本身不保存数据，这种特质也决定了无法对所有视图进行 INSERT、UPDATE、DELETE 操作，通常数据库只支持针对比较简单的视图做增删改的操作，但不同的数据库，其实现方法不同。

通过视图修改 warehouse 表中仓库的名称。具体语句如下：

```
CREATE VIEW warehouse_view AS SELECT * FROM warehouse;
UPDATE warehouse_view SET w_name = 'bj' WHERE w_name = 'if';
```

除了普通视图之外，还有一种物化视图。物化视图本身是保存数据的，它和普通视图的区别是在 DML 操作中，对普通视图的操作会映射到基本表，而对物化视图的操作则直接作用到物化视图本身。

当基本表中的数据发生变化时，物化视图中的数据也会同步发生相同的变化。由于物化视图通常是基本表的子集，因此如果要查询的数据在物化视图中时，直接访问物化视图会提高访问效率，但是同时也会带来维护开销。如果一个基本表频繁地被增删改语句操作数据，那么物化视图同步更新带来的开销可能就会大于访问性能提升带来的好处，因此需要根据应用的具体情况决定是否使用物化视图。

创建一个 warehouse name 相关的物化视图，具体语句如下：

```
CREATE MATERIALIZED VIEW warehouse_name AS SELECT w_name FROM warehouse;
```
