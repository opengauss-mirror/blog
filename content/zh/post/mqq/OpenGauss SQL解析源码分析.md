+++
title = "OpenGauss SQL解析源码分析"
date = "2021-11-27"
tags = ["OpenGauss SQL解析源码分析"]
archives = "2021-11"
author = "mqq"
summary = "OpenGauss SQL解析源码分析"
img = "/zh/post/mqq/title/title.png"
+++

# OpenGauss SQL解析源码分析


## SQL 引擎简介：

SQL引擎整个编译的过程如下图所示，在编译的过程中需要对输入的SQL语言进行词法分析、语法分析、语义分析，从而生成逻辑执行计划，逻辑执行计划经过代数优化和代价优化之后，产生物理执行计划。

SQL解析通常包含词法分析、语法分析、语义分析几个子模块。SQL是介于关系演算和关系代数之间的一种描述性语言，它吸取了关系代数中一部分逻辑算子的描述，而放弃了关系代数中"过程化"的部分，SQL解析主要的作用就是将一个SQL语句编译成为一个由关系算子组成的逻辑执行计划。![](https://img-blog.csdnimg.cn/20c9730d6b754a57b2e145a25fc8b47d.png?x-oss-process,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAcXFfNDQzNjExMzY=,size_15,color_FFFFFF,t_70,g_se,x_16)

数据库的SQL引擎是数据库重要的子系统之一，它对上负责承接应用程序发送过来的SQL语句，对下则负责指挥执行器运行执行计划。其中优化器作为SQL引擎中最重要、最复杂的模块，被称为数据库的"大脑"，优化器产生的执行计划的优劣直接决定数据库的性能。右图为SQL引擎的各个模块的响应过程。下图的绿色部分代表解析树的生成，；蓝色部分代表查询树的生成部分。

![](https://img-blog.csdnimg.cn/c5e36efb9b22452c9aed5f746586897d.png?x-oss-process,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAcXFfNDQzNjExMzY=,size_19,color_FFFFFF,t_70,g_se,x_16)


## 理论分析
**SQL解析各模块功能介绍：**

 假设要在student表里找到查找序号为1的学生姓名，其SQL语句如下：

> Select name
> 
>from student
>where no=1

1.  **词法分析:**

> 从查询语句中识别出系统支持的关键字、标识符、运算符、终结符等，确定每个词固有的词性。分析结果如下图所示，可以看到一个SQL语句按一个一个的字词或符号分开，形成可以被解读语义的字符。

 | **词性**       |  **内容** |
 | ------------   | --------- |
 | **关键字**     |  **Select、from、where** |
 | **标识符**     |  **name、student、no** |
 | **操作符**     |  **=** |
 | **常量**       |  **1** |

###### **（2）语法分析:**

根据SQL的标准定义语法规则，使用词法分析中产生的词去匹配语法规则，如果一个SQL语句能够匹配一个语法规则，则生成对应的抽象语法树（AST）。

下图中的\<projection>代表投影，\<relation>代表关系，即查询来源那些表，\<condition>代表条件，一般是一些表达式。

![](https://img-blog.csdnimg.cn/74294d0fa82b455fa7dea8305ca0e55b.png?x-oss-process,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAcXFfNDQzNjExMzY=,size_20,color_FFFFFF,t_70,g_se,x_16)


###### **（3）语义分析:**

对语法树进行有效性检查，检查语法树中对应的表、列、函数、表达式是否有对应的元数据，将抽象语法树转换为逻辑执行计划(关系代数表达式)。在SQL标准中，确定了SQL的关键字以及语法规则信息，对语法树进行有效性检查，检查语法树中对应的表、列、函数、表达式是否有对应的元数据，将抽象语法树转换为逻辑执行计划(关系代数表达式)，即查询树。可由右图的关系表达式来呈现：![在这里插入图片描述](https://img-blog.csdnimg.cn/8efad4ba77db41bc8572776fff2dbd62.png)


## 代码分析

### 3.1总体流程
![在这里插入图片描述](https://img-blog.csdnimg.cn/8c67c66f177142ba98ac57849f6db27a.png)



exec_simple_query函数是整个过程的主函数，调渡解析中的所有过程,主函数调用函数pg_parse_query进入词法分析和语法分析的主过程，函数pg_parse_query再调用词法分析和语法分析的入口函数raw_parser生成分析树；之后返回分析树(raw_parsetree_list)给exec_simple_query函数；exec_simple_query函数调用查询与重写函数，查询与重写函数再调用paser_analyze函数进行语义分析返回查询树链表query，最后将查询树链表传递给查询重写模块，最后返回给exec_simple_query主函数。

### 3.2词法分析

（1）openGauss中的词法文件是scan.l，它根据SQL语言标准对SQL语言中的关键字、标识符、操作符、常量、终结符进行了定义和识别。代码如下图：

![](https://img-blog.csdnimg.cn/fb71b61d3b3e4bc8bf293e5a51294327.png)


（2）下图是词法分析涉及到的关键字原型，由三部分组成，分别是名字、Token值、类别。名字是字符串原型，Token值是一个int型的数。openGauss在kwlist.h中定义了大量的关键字，按照字母的顺序排列，方便在查找关键字时通过二分法进行查找。

![](https://img-blog.csdnimg.cn/103d9351b5e14e66a682fb587e161983.png)


### 3.3语法分析：

解析树的节点定义如下：

（1）仅在叶节点出现的的一些基本属性（一些常见的属性会在后面介绍）

![](https://img-blog.csdnimg.cn/1358e54e68784a7e947bbc51b52f85f4.png)


（2）下图的属性不仅用于叶节点还能用于更上层的非叶子节点

![](https://img-blog.csdnimg.cn/3a89a6715dc542a9aaf07d8202672c75.png)


（3）下图部分的属性值及用于非叶子节点

![](https://img-blog.csdnimg.cn/e45863803bd04af6ae637b2e3e7a5ed3.png)


#### 原始解析树的生成（完成语法和词法分析后生成的多叉树）：

对于下面的SQL查询语句：
![在这里插入图片描述](https://img-blog.csdnimg.cn/cc1bd07c4b1f4766a6fee3101fd20f63.png)

完成语法分析后生成的原始解析树如下（蓝色部分分别于上述语句各部分相对应）：

![](https://img-blog.csdnimg.cn/39b455c8c19d407699a0bc98f50743c1.png)



- targetList：最后查询完成显示的目标列

- fromClause：from子句，标识该查询来自某个或某些表。

- whereClause：where子句，一般接一些条件表达式，表示查询条件

- sortClause：sort by子句节点，如果需要按照某一列排序时会用到。

*需要注意的是，由于解析器仅在生成解析树时检查输入的语法，因此只有在查询中出现语法错误时才会返回错误。解析器不检查输入查询的语义。例如，即使查询包含不存在的表名，解析器也不会返回错误。语义检查由分析器（analyse.cpp）完成。*

### 3.4语义分析

（1）总体流程：进入到analyze.cpp进行语义分析，将所有语句转换为查询树供重写器和计划器进一步处理。

输入：原始语法解析树parseTree和源语句sourceText

输出：查询树query

![](https://img-blog.csdnimg.cn/758de674b1804aebb7564fd82128fb32.png)


（2）查询树节点的定义：

![\[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-XZA5s16z-1638013803029)(./images/media/image14.png)\]](https://img-blog.csdnimg.cn/169dff7e9d574e28b47707007096237a.png)


上图是查询树节点的基础属性部分，也是大部分语句都共有的部分，表示SQL语句的类型（增删改查），来源和标识号等等；

![\[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-RzIMf1Ri-1638013803029)(./images/media/image15.png)\]](https://img-blog.csdnimg.cn/43792a6e6cbe4ff4b260afd4af827785.png)


上图为查询树节点的第二部分定义bool类型的变量，表示该查询的相关属性，例如有无子语句，是否需要去重等等。
![](https://img-blog.csdnimg.cn/b24c8403347c498a9f27761098084946.png)

上图为查询树节点的第三部分定义。主要用于表示目标列表，from子句，where子句等的节点或链表。

### 3.5查询树的生成和可视化

第一步，修改/opt/software/openGauss/data/single_node目录下的配置文件postgresql.conf中的配置项debug_print_parse
即可在日志文件中打印查询树

![在这里插入图片描述](https://img-blog.csdnimg.cn/deef654c2a2b4bf4a7fe86aabb36c694.png)


第二步，修改client_min_messages为log（如下图），以便可以在客户端输出语法树。

![\[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-eVdcTUmO-1638013803031)(./images/media/image18.png)\]](https://img-blog.csdnimg.cn/56c210614e96424693ab82cb4d200222.png)


之后我们可以看到客户端生成的输出语法树如下：

![\[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-ZqbDJRxd-1638013803032)(./images/media/image19.png)\]](https://img-blog.csdnimg.cn/d93be651f52940bfbb93d8ac19d274a6.png)


最后，利用开源工具（https://github.com/shenyuflying/pgNodeGraph）可以把客户端输出的查询树可视化，如下图：
![在这里插入图片描述](https://img-blog.csdnimg.cn/ca0457a13f034c42a633ea581203a33d.png)


对比语法分析后所生成的解析树（下图1）和语义分析后生成的查询树（下图2，已简化）不难看出其节点结构的变化，

-   红框部分是目标列表，对应查询语句中的select子句，即查询完成后需要显示的某一或某几属性列。

-   绿框部分代表查询来源的表，主要对应的是查询语句中的from子句，在查询树生成时候还会附带表的别名和其他信息。

-   黄框部分在解析树时候主要对应where子句的节点，其中A_Expr代表运算符号，ColumnRef是该属性（id）源自哪张表，A_CONST代表的比较子句的常量；而在查询树时from子句和where子句会合并为一个jointree节点。

-   蓝框部分主要是一些其他的sort，having等子句的节点主要做排序等作用。

**图一**

![在这里插入图片描述](https://img-blog.csdnimg.cn/0d44f584d75c4e728a68662a53b5250b.png)

**图二**

![在这里插入图片描述](https://img-blog.csdnimg.cn/5a49c04825784806b7ff29f7fbdfbfe2.png)

