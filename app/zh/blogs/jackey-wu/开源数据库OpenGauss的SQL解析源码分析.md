---
title: '开源数据库OpenGauss的SQL解析源码分析'
date: '2021-12-06'
category: 'blog'
tags: ['OpenGauss入门']
archives: '2021-12'
author: 'Jackey WU'
summary: '开源数据库OpenGauss的SQL解析源码分析'
---

# 开源数据库 OpenGauss 的 SQL 解析源码分析

## OpenGauss 数据库体系概述

openGauss 是关系型数据库，采用客户端/服务器，单进程多线程架构；支持单机和一主多备部署方式，同时支持备机可读、双机高可用等特性。

从代码结构体系结构的角度来说，oepnGauss 的第一个组成部分是通信管理。

openGauss 查询响应是使用“单个用户对应一个服务器线程”的简单客户端/服务器模型实现的。由于我们无法预先知道需要建立多少连接，所以必须使用主进程（GaussMaster）来监听指定 TCP/IP（传输控制协议/网际协议）端口上的传入连接，只要连接请求 检测到，主进程将生成一个新的服务器线程。服务器线程使用信号量和共享内存相互通信，以确保整个并发数据访问期间的数据完整性。

除开通信管理之外，OpenGauss 的一大组成部分就是 SQL 引擎，承担着查询解析、查询分流、查询重写、查询优化和查询执行等任务，之后剩下的就是存储引擎了。

**SQL 组成**

<img src='./figures/2-1.png'>

## SQL 模块简介

SQL 引擎作为数据库系统的入口，主要承担了对 SQL 语言进行解析、优化、生成执行计划的作用。对于用户输入的 SQL 语句，SQL 引擎会对语句进行语法/语义上的分析以判断是否满足语法规则等，之后会对语句进行优化以便生成最优的执行计划给执行器执行。故 SQL 引擎在数据库系统中承担着“接收信息，下达命令”的作用，是数据库系统的“脊柱神经”。

SQL 引擎负责对用户输入的 SQL 语言进行编译，在编译的过程中需要对输入的 SQL 语言进行词法分析、语法分析、语义分析，从而生成逻辑执行计划，逻辑执行计划经过代数优化和代价优化之后，产生物理执行计划，然后将执行计划交给执行引擎进行执行。

就 SQL 引擎的组成而言，SQL 引擎可以分为两部分。

1. **SQL 解析（查询解析）**

   SQL 解析对输入的 SQL 语句进行词法分析、语法分析、语义分析，获得查询解析树或者逻辑计划。SQL 查询语句解析的解析器（parser）阶段包括如下：

   **a. 词法分析**：从查询语句中识别出系统支持的关键字、标识符、操作符、终结符等，每个词确定自己固有的词性。

   **b. 语法分析**：根据 SQL 语言的标准定义语法规则，使用词法分析中产生的词去匹配语法规则，如果一个 SQL 语句能够匹配一个语法规则，则生成对应的语法树（Abstract Synatax Tree，AST）。

   **c. 语义分析**：对语法树（AST）进行检查与分析，检查 AST 中对应的表、列、函数、表达式是否有对应的元数据（指数据库中定义有关数据特征的数据，用来检索数据库信息）描述，基于分析结果对语法树进行扩充，输出查询树。主要检查的内容包括：
   ① 检查关系的使用：FROM 子句中出现的关系必须是该查询对应模式中的关系或视图。
   ② 检查与解析属性的使用：在 SELECT 句中或者 WHERE 子句中出现的各个属性必须是 FROM 子句中某个关系或视图的属性。
   ③ 检查数据类型：所有属性的数据类型必须是匹配的。

   openGauss 中参照 SQL 语言标准实现了大部分 SQL 的主要语法功能，并结合应用过程中的具体实践对 SQL 语言进行了扩展。

2. **查询优化**

   优化器(optimizer)的任务是创建最佳执行计划。一个给定的 SQL 查询（以及一个查询树）实际上可以以多种不同的方式执行，每种方式都会产生相同的结果集。如果在计算上可行，则查询优化器将检查这些可能的执行计划中的每一个，最终选择预期运行速度最快的执行计划。

   优化主要分成了逻辑优化和物理优化两个部分，从关系代数和物理执行两个角度对 SQL 进行优化，进而结合自底向上的动态规划方法和基于随机搜索的遗传算法对物理路径进行搜索，从而获得较好的执行计划。

## SQL 解析源码解读

**SQL 解析主流程**

<img src='./figures/2-2.png'>

### 代码文件

```
src/common/backend/parser/scan.l		定义词法结构，采用Lex编译后生成scan.cpp文件
src/common/backend/parser/gram.y		定义语法结构，采用Yacc编译后生成gram.cpp文件
src/common/backend/parser/scansup.cpp		提供词法分析的常用函数
src/common/backend/parser/parser.cpp		词法、语法分析的主入口文件，入口函数是raw_parser
src/common/backend/parser/analyze.cpp		语义分析的主入口文件，入口函数是parse_analyze
```

### 词法分析

1. **parser.cpp**
   openGauss 采用 flex 和 bison 两个工具来完成词法分析和语法分析的主要工作。对于用户输入的每个 SQL 语句，它首先交由 flex 工具进行词法分析。flex 工具通过对已经定义好的词法文件进行编译，生成词法分析的代码。

2. **scan.l(词法分析)**
   openGauss 中的词法文件是 scan.l，它根据 SQL 语言标准对 SQL 语言中的关键字、标识符、操作符、常量、终结符进行了定义和识别。代码如下：

   **定义数值类型**

   <img src='./figures/2-3.png'>

   **定义操作符**

   <img src='./figures/2-4.png'>

   其中的 operator 即为操作符的定义，从代码中可以看出，operator 是由多个 op_chars 组成的，而 op_chars 则是[~!@#^&|`?+-*/%<>=]中的任意一个符号。但这样的定义还不能满足 SQL 的词法分析的需要，因为并非多个 op_chars 的组合就能形成一个合法的操作符，因此在 scan.l 中会对操作符进行更明确的定义（或者说检查）。

   **operator**

   <img src='./figures/2-5.png'>

   词法分析其实就是将一个 SQL 划分成多个不同的 token，每个 token 会有自己的词性，在 scan.l 中定义了如下词性。

   **词法分析词性说明**

   <img src='./figures/2-6.png'>

### 语法分析

1. **gram.y**

   在 openGauss 中，定义了一系列表达 Statement 的结构体，这些结构体通常以 Stmt 作为命名后缀，用来保存语法分析结果。

   以 SELECT 查询为例，它对应了一个 Statement 结构体，这个结构体可以看作一个多叉树，每个叶子节点都表达了 SELECT 查询语句中的一个语法结构，对应到 gram.y 中，它会有一个 SelectStmt，代码如图所示。

   **SelectStmt**

   <img src='./figures/2-7.png'>

   simple_select 除了上面的基本形式，还可以表示为其他形式，如 VALUES 子句、关系表达式、多个 SELECT 语句的集合操作等，这些形式会进一步的递归处理，最终转换为基本的 simple_select 形式。代码如图所示。

   **递归集合**

   <img src='./figures/2-8.png'>

   在成功匹配 simple_select 语法结构后，将会创建一个 Statement 结构体，将各个子句进行相应的赋值。对 simple_select 而言，目标属性、FROM 子句、WHERE 子句是最重要的组成部分。

   以目标属性为例分析，对应语法定义中的 target_list，由若干个 target_el 组成。target_el 可以定义为表达式、取别名的表达式和“\*”等。当成功匹配到一个 target_el 后，会创建一个 ResTarget 结构体，用于存储目标对象的全部信息。代码如图所示。

   **ResTarget**

   <img src='./figures/2-9.png'>

2. **parser.y**

   simple_select 的其他子句，如 distinctClause、groupClause、havingClause 等，语法分析方式类似。而其他 SQL 命令，如 CREATE、INSERT、UPDATE、DELETE 等，处理方式与 SELECT 命令类似。

   对于任何复杂的 SQL 语句，都可以拆解为多个基本的 SQL 命令执行。在完成词法分析和语法分析后，raw_parser 函数会将所有的语法分析树封装为一个 List 结构，名为 raw_parse_tree_list，返回给 exec_simple_query 函数，用于后面的语义分析、查询重写等步骤，该 List 中的每个 ListCell 包含一个语法树。

### 语义分析

在完成词法分析和语法分析后，parse_analyze 函数会根据语法树的类型调用 transformSelectStmt 将 parseTree 改写为查询树。在重写过程中，parse_analyze 不仅会检查 SQL 命令是否满足语义要求，还会根据语法树对象获取更利于执行的信息，如表的 OID、列数、 等等。在某一示实例中，查询树对应的内存组织结构如图所示。目标属性、FROM 子句和 WHERE 子句的语义分析结果将分别存储在结构 TargetEntry、RangeTblEntry、FromExpr 中。

**查询树内存组织结构图**

<img src='./figures/2-10.png'>

在完成语义分析后，SQL 解析过程也就完成，SQL 引擎开始执行查询优化。

1. **analyze.cpp（语义分析）**

   语义分析模块在词法分析和语法分析之后执行，用于检查 SQL 命令是否符合语义规定，能否正确执行。负责语义分析的是 parse_analyze 函数，位于 analyze.cpp 下。parse_analyze 会根据词法分析和语法分析得到的语法树，生成一个 ParseState 结构体用于记录语义分析的状态，再调用 transformStmt 函数，根据不同的命令类型进行相应的处理，最后生成查询树。

2. **ParseState 结构体**

   ParseState 保存了许多语义分析的中间信息，如原始 SQL 命令、范围表、连接表达式、原始 WINDOW 子句、FOR UPDATE/FOR SHARE 子句等。

   ParseState 结构体在语义分析入口函数 parse_analyze 下被初始化，在 transformStmt 函数下根据不同的 Stmt 存储不同的中间信息，完成语义分析后再被释放。ParseState 结构图所示。

   **ParseState**

   <img src='./figures/2-11.png'>

3. **ParseTree 语法树——Node 结构**

   在语义分析过程中，语法树 parseTree 使用 Node 节点进行包装。Node 结构只有一个类型为 NodeTag 枚举变量的字段，用于识别不同的处理情况。如图所示。

   **Node 结构体（nodes.h）**

   <img src='./figures/2-12.png'>

   以 SelectStmt 为例， 其对应的 NodeTag 值为 T_SelectStmt。

   transformStmt 函数会根据 NodeTag 的值，将语法树转化为不同的 Stmt 结构体，调用对应的语义分析函数进行处理。

   openGauss 在语义分析阶段处理的 NodeTag 情况有九种，参照着不同地 NodeTag 情况去调用 transformStmt 函数，继而完成语义分析工作。

## References & Thanks

<https://blog.csdn.net/GaussDB/article/details/116132257>;

<https://blog.csdn.net/GaussDB/article/details/119594313>;

<https://blog.csdn.net/GaussDB/article/details/119668883>.
