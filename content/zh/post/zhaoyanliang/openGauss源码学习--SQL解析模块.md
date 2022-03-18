+++

title = "openGauss源码学习--SQL解析模块"
date = "2021-11-30"
tags = ["openGauss社区开发入门"]
archives = "2021-11"
author = "zhaoyanliang"
summary = "openGauss社区开发入门"
times = "13:30"

+++

## openGauss源码解析	------ SQL语句解析模块



#### 一、概述

openGauss数据库是华为深度融合在数据库领域多年经验，结合企业级场景要求推出的新一代企业级开源数据库。openGauss是关系型数据库，采用客户端/服务器，单进程多线程架构；支持单机和一主多备部署方式，同时支持备机可读、双机高可用等特性。

openGauss是基于postgresql数据库开发的。

开源地址：[openGauss/openGauss-server - 码云 - 开源中国 (gitee.com)](https://gitee.com/opengauss/openGauss-server?_from=gitee_search)



#### 二、SQL解析

数据库的SQL引擎作为SQL解析模块是数据库重要的子系统之一，它对上负责承接应用程序发送的SQL语句，对下负责指挥执行器运行执行计划，是整个数据库的第一个执行的模块。具体而言，就是讲用户输入的SQL语句转换为具体的能被机器识别的要求从而被执行，类似与各种编程语言的编译器。

完整过程：

![img](https://img-blog.csdnimg.cn/d31a28994415490dbaec2fde6d09ec1e.png#pic_center)

本文主要讲解前两部分：词法解析和语法解析。

源码文件夹：/src/common/backend/parser



#### 三、SQL解析总体功能

1. 当openGauss的后台服务进程openGuass收到前台发来的查询语句后，首先将其传递到查询分析模块，进行词法分析，语法分析和语义分析。
2. 若是功能性命令(例如create table,create user和backup命令等)则将其分配到功能性命令处理模块；
3. 对于查询处理命令(SELECT/INSERT/DELETE/UPDATE)则为其构建查询语法树，交给查询重写模块。

总的来说流程如下：

SQL命令 --(词法和语法分析)--> 分析树 --(语义分析)--> 查询树

在代码里的调用路径如下(方框内为函数，数字显示了调用顺序)

![img](https://images2015.cnblogs.com/blog/579102/201611/579102-20161108231520936-605686873.png)

#### 四、源码文件及作用：

| parser.cpp              | **解析主程序**                           |
| ----------------------- | ---------------------------------------- |
| scan.l                  | 词法分析，分解查询成token                |
| scansup.cpp             | 处理查询语句转义符                       |
| kwlookup.cpp            | 将关键词转化为具体的token                |
| keywords.cpp            | 标准关键词列表                           |
| analyze.cpp             | 语义分析                                 |
| gram.y                  | 语法分析，解析查询tokens并产生原始解析树 |
| parse_agg.cpp           | 处理聚集操作，比如SUM(col1)，AVG(col2)   |
| parse_clause.cpp        | 处理子句，比如WHERE，ORDER BY            |
| parse_compatibility.cpp | 处理数据库兼容语法和特性支持             |
| parse_coerce.cpp        | 处理表达式数据类型强制转换               |
| parse_collate.cpp       | 对完成表达式添加校对信息                 |
| parse_cte.cpp           | 处理公共表格表达式（WITH 子句）          |
| parse_expr.cpp          | 处理表达式，比如col, col+3, x = 3        |
| parse_func.cpp          | 处理函数，table.column和列标识符         |
| parse_node.cpp          | 对各种结构创建解析节点                   |
| parse_oper.cpp          | 处理表达式中的操作符                     |
| parse_param.cpp         | 处理参数                                 |
| parse_relation.cpp      | 支持表和列的关系处理程序                 |
| parse_target.cpp        | 处理查询解析的结果列表                   |
| parse_type.cpp          | 处理数据类型                             |
| parse_utilcmd.cpp       | 处理实用命令的解析分析                   |



#### 五、词法解析部分

**对于字符串流的输入，根据词表，将关键字、变量等转化成自定义逻辑结构，用于下一步的语法分析**

分为三部分：定义段、规则段、用户程序段

- 定义段：

  这一部分一般是一些声明及选项设置等；

  C语言的注释、头文件包含等一般就放在%{%}之间，这一部分的内容会被直接复制到生成的C文件中,还有一些参数项通过%option来设置；

  采用正则表达式定义词法规范；

  只有符合规范的关键词才允许接受，否则报错。

- 规则段：

  规则段为一系列匹配模式和动作，模式一般使用正则表达式书写，动作部分为C代码；

  规则段模板：

   模式1

   {

     动作1 （C代码）

   }

  在输入和模式1匹配的时候，执行动作部分的代码

- 用户程序段：

  用户自定义的程序，无固定模式·



#### 六、词法解析代码举例

##### 定义段：

头文件、宏定义等：

![image-20211113113829772](../typora-user-images/image-20211113113829772.png)

%option 此部分是Flex（词法工具）支持的一些参数，通过%option 来设置

![image-20211113113850972](../typora-user-images/image-20211113113850972.png)

![image-20211113114005056](../typora-user-images/image-20211113114005056.png)

%option reentrant 可重入词法分析器：传统词法分析器只能一次处理一个输入流，所以很多变量都定义的为静态变量这样分析器才能记住上次分析的地方继而可以继续分析。但是不能同时处理多个输入流。为了解决这个问题引入了可重入词法分析器。通过参数reentrant来控制。

%option bison-bridge ：bison桥模式

bison的发展和flex的发展沟通并不是很密切，导致二者对yyles的调用参数不一致。所以在flex中提拱了桥模式，如果按%option bison-bridge做了声明，那么在flex中yylex将被声明为int yylex(YYSTYPE* lvalp, yyscan_t scaninfo)，这样就兼容了bison。

其它的读者可自行搜索。



词法规则制定：采用正则表达式规定可接受的字符组合

![image-20211113114229404](../typora-user-images/image-20211113114229404.png)



##### 规则段：

表示匹配到了某字符组合该执行什么动作：

![image-20211113114352188](../typora-user-images/image-20211113114352188.png)



#### 七、语法解析部分：

**以词法分析器生成的单词符号序列作为输入,根据语言的语法规则识别出各种语法成分(如表达式、语句、程序段乃至整个程序等),并在分析过程中进行语法检查,检查所给单词符号序列是否是该语言的文法的一个句子。**

同样分为三段，定义段，规则段和代码段。也是通过%%做三个段的分割。源码文件为gram.y, 最后通过Bison 编译源文件生成 gram.c

- 定义段：{% ... %}中的代码将被原样copy到生成的文件gram.c中.其中包含头文件包含，结构体定义和函数声明等，与词法分析一致
- 规则段：主要是文法产生式，规定规约的规则，对于输入的SQL语句只要能规约到文法产生式顶层非终结符，则判断该SQL语句是语法合法的。在规约过程中顺便构建起语法分析树，为后面的语义分析做铺垫。

**总体流程**：

![image-20211113115728294](../typora-user-images/image-20211113115728294.png)

**具体流程**：

![image-20211113115755438](../typora-user-images/image-20211113115755438.png)



#### 八、语法解析代码举例：

##### 定义段：

基本设置：

![image-20211113115919830](../typora-user-images/image-20211113115919830.png)



%pure-parser 声明此语法分析器是纯语法分析器。这样可以实现可重入。

%expect 0 ,意思是期待0个冲突。即不希望有任何冲突出现。

%name-prefix="base_yy" 代表生成的函数和变量名从yy改成base_yy，同flex，为了在一个产品里使用多个语法分析器，分析不同的数据类。

 %locations 声明使用位置信息。

union表示联合体：

![image-20211113120551288](../typora-user-images/image-20211113120551288.png)

%union{} 定义yylval类型，在flex中通过yylval的返回匹配的值。

type表示非终结符：

![image-20211113120618565](../typora-user-images/image-20211113120618565.png)

非终结符用于文法产生式，为生成语法分析树服务

优先级定义：

![image-20211113120715393](../typora-user-images/image-20211113120715393.png)

优先级和左右结合的定义可以解决一些语法上的矛盾。

具体文法产生式：

![image-20211113120741461](../typora-user-images/image-20211113120741461.png)

Opengauss总的文法产生式极其复杂，这里只节选。



#### 九、具体案例

**SQL语句：**

INSERT INTO films (code, title, did, date_prod, kind) VALUES ('T_601', 'Yojimbo', 106, '1961-06-16', 'Drama’);

**产生的函数调用：**

PostgresMain->exec_simple_query->pg_parse_query->raw_parser->base_yyparse(yyscanner)



词法匹配（SCAN.I)：

![image-20211113120940437](../typora-user-images/image-20211113120940437.png)

Identifier可以匹配到insert。

根据规则执行动作：

![image-20211113121016189](../typora-user-images/image-20211113121016189.png)

代码中keywordopengauss内置的关键字，像insert就是一个关键字keyword。

可以看到一个判断是keyword非空即检测到关键字时，根据关键字不同类型执行动作。

在yylex返回INSERT 这个token.然后分析gram.y中这个token 对应的规则 由于flex 默认向前查看一个token, 根据第二部可知第二个token 为INTO.在规则段中找到如下规则：

![image-20211113121303515](../typora-user-images/image-20211113121303515.png)

opt_with_clause 可以为空，并且后面跟着一个INSERT INTO, 所以即匹配上这个规则。

**类似上面方法继续分析剩下的SQL语句**

结果放到InsertStmt中，后面继续根据以下规则做规约处理，由于在规则段中第一个出现的非终结符号，stmtblock是我们要的结果。通过不断的规约即reduce,最后的分析结果即剩下stmtblock这一个符号即开始符号，所以是匹配成功的。

![image-20211113121416459](../typora-user-images/image-20211113121416459.png)

