+++

title = "OpenGauss解析器"
date = "2021-12-05"
tags = ["OpenGauss解析器"]
archives = "2021-12"
author = "zhou-yuxiang"
summary = "openGauss社区开发入门"
times = "17:30"

+++

openGauss解析器实验报告

 

 

一、词法分析：

 

 

l 文件位置：

 

src/common/backend/parser/scan.l 定义词法结构，采用Lex编译后生成scan.cpp文件

 

 

l 原理：根据SQL语言标准对SQL语言中的关键字、标识符、操作符、常量、终结符进行了定义和识别。并且能够进行更精确的检查和操作。词法分析将一个SQL划分成多个不同的token，每个token会有自己的词性

 

 

l 代码如下：

 

\1.    定义的形式如下：

 

![img](../img/01/clip_image002.jpg)

 

 

\2.    检查的形式如下：

 

![img](../img/01/clip_image004.jpg)

可以看到 当遇到identifier类型的时候，会进行更进一步的检查和操作。首先调用函数确定它是否是从关键字表中查找关键字，如果是则返回关键字的类型。否则调用函数将大写转换成小写。

 

 

l 用到的函数有：

1、**char*** **downcase_truncate_identifier**(**const** **char*** ident, **int** len, **bool** warn)

 

将字符都转化成小写，利用大写字母和小写字母之间的差值

![img](../img/01/clip_image006.jpg)

 

 

2、**bool** **scanner_isspace**(**char** ch)

 

如果找到的是空格，则返回true

 

![img](../img/01/clip_image008.jpg)

 

 

3、**void** **truncate_identifier**(**char*** ident, **int** len, **bool** warn)

 

截断标识符

![img](../img/01/clip_image010.jpg)

 

 

二 、语法分析

 

l 文件位置：

 

src/common/backend/parser/scan.l 定义语法结构，采用Yacc编译后生成gram.cpp文件

 

 

l 原理：根据SQL语言的不同定义了一系列表达Statement的结构体（这些结构体通常以Stmt作为命名后缀），用来保存语法分析结果。

 

l 结构体如下：

![img](../img/01/clip_image012.jpg)

 

 

结构体中的每一项都对应一个子结构，程序根据不同的情况对其赋值：

情况有：

![img](../img/01/clip_image014.jpg)

 

![img](../img/01/clip_image016.jpg)

 

 

![img](../img/01/clip_image018.jpg)

 

 

 

这些形式会进一步的递归处理，最终转换为基本的simple_select形式。代码如下：simple_select语法分析结构可以看出，一条简单的查询语句由以下子句组成：去除行重复的distinctClause、目标属性targetList、SELECT INTO子句intoClause、FROM子句fromClause、WHERE子句whereClause、GROUP BY子句groupClause、HAVING子句havingClause、窗口子句windowClause和plan_hint子句。在成功匹配simple_select语法结构后，将会创建一个Statement结构体，将各个子句进行相应的赋值。

 

simple_select的其他子句，如distinctClause、groupClause、havingClause等，语法分析方式类似。而其他SQL命令，如CREATE、INSERT、UPDATE、DELETE等，处理方式与SELECT命令类似

 

l 使用的函数：

 

 

![img](../img/01/clip_image020.jpg)

 

逻辑：创建SelectStmt结构体后，向结构体中填充参数。语法分析树

 

它产生的函数在在文件src/common/backend/parser/parser.cpp文件中的row_parser中被调用：

![img](../img/02/clip_image022.jpg)

 

 

最后返回，用于后面的语义分析、查询重写等步骤，该List中的每个ListCell包含一个语法树。

![img](../img/02/clip_image024.jpg)

 

三、语义分析

 

l 文件位置

 

主入口文件src/common/backend/parser/analyze.cpp，入口函数是parse_analyze

 

 

l 原理：语义分析模块在词法分析和语法分析之后执行，用于检查SQL命令是否符合语义规定，能否正确执行。负责语义分析的是parse_analyze函数，位于analyze.cpp下。parse_analyze会根据词法分析和语法分析得到的语法树，生成一个ParseState结构体用于记录语义分析的状态，再调用transformStmt函数，根据不同的命令类型进行相应的处理，最后生成查询树。

 

l ParseState保存了许多语义分析的中间信息，如原始SQL命令、范围表、连接表达式、原始WINDOW子句、FOR UPDATE/FOR SHARE子句等。该结构体在语义分析入口函数parse_analyze下被初始化，在transformStmt函数下根据不同的Stmt存储不同的中间信息，完成语义分析后再被释放。ParseState结构如下。

 

![img](../img/02/clip_image026.jpg)

 

在语义分析过程中，语法树parseTree使用Node节点进行包装。Node结构只有一个类型为NodeTag枚举变量的字段，用于识别不同的处理情况。比如SelectStmt 对应的NodeTag值为T_SelectStmt。Node结构如下。

 

![img](../img/02/clip_image028.jpg)

 

transformStmt函数会根据NodeTag的值，将语法树转化为不同的Stmt结构体，调用对应的语义分析函数进行处理。

 

![img](../img/02/clip_image030.jpg)

 

 

 

openGauss在语义分析阶段处理的NodeTag情况有九种

 

| T_InsertStmt        | transformInsertStmt        |
| ------------------- | -------------------------- |
| T_DeleteStmt        | transformDeleteStmt        |
| T_UpdateStmt        | transformUpdateStmt        |
| T_MergeStmt         | transformMergeStmt         |
| T_SelectStmt        | transformSelectStmt        |
| T_DeclareCursorStmt | transformDeclareCursorStmt |
| T_ExplainStmt       | transformExplainStmt       |
| T_CreateTableAsStmt | transformCreateTableAsStmt |
| T_CreateModelStmt   | transformCreateModelStmt   |

transformSelectStmt：

![img](../img/02/clip_image032.jpg) 调用关系

 

![img](../img/02/clip_image034.jpg)

 

处理对应句子的流程。

 

 

以处理基本SELECT命令的transformSelectStmt函数为例，其处理流程如下。

（1） 创建一个新的Query节点，设置commandType为CMD_SELECT。

（2） 检查SelectStmt是否存在WITH子句，存在则调用transformWithClause处理。

（3） 调用transformFromClause函数处理FROM子句。

（4） 调用transformTargetList函数处理目标属性。

（5） 若存在操作符“+”则调用transformOperatorPlus转为外连接。

（6） 调用transformWhereClause函数处理WHERE子句和HAVING子句。

（7） 调用transformSortClause函数处理ORDER BY子句。

（8） 调用transformGroupClause函数处理GROUP BY子句。

（9） 调用transformDistinctClause函数或者transformDistinctOnClause函数处理DISTINCT       子句。

（10）调用transformLimitClause函数处理LIMIT和OFFSET子句。

（11）调用transformWindowDefinitions函数处理WINDOWS子句。

（12）调用resolveTargetListUnknowns函数将其他未知类型作为text处理。

（13）调用transformLockingClause函数处理FOR UPDATE子句。

（14）处理其他情况，如insert语句、foreign table等。

（15）返回查询树。

 

 

四、总体的入口函数：

 

![img](../img/02/clip_image036.jpg)

 

l 位置：\src\gausskernel\process\tcop\postgres.cpp

 

 

1、调用 pg_parse_query 函数，参数 用户输入的命令，生成 parsetree_list

 

![img](../img/02/clip_image038.jpg)

 

 

pg_parse_query部分代码：

![img](../img/02/clip_image040.jpg)

 

2、再调用 pg_analyze_and_rewrite 函数，参数 语法树链表，返回 查询树链表。进行语义分析。

 

 

![img](../img/03/clip_image042.jpg)

 

 

 

3、pg_analyze_and_rewrite 函数调用parse_analyze 函数进行语义分析。

 

![img](../img/03/clip_image044.jpg)

 

调用流程图

 

![img](../img/03/clip_image046.png)

 

 

 