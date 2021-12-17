+++

title =  "openGauss数据库SQL模块源码分析" 

date = "2021-12-09" 

tags = [ "openGauss数据库SQL模块源码分析"] 

archives = "2021-12" 

author = "…" 

summary = "openGauss数据库SQL模块源码分析"

img = "/zh/post/July/title/img9.png" 

times = "12:30"

+++

# openGauss数据库SQL模块源码分析<a name="ZH-CN_TOPIC_0000001187088776"></a>

## 一、词法分析：<a name="section105041940183911"></a>

文件位置：

src/common/backend/parser/scan.l  定义词法结构，采用Lex编译后生成scan.cpp文件

原理：根据SQL语言标准对SQL语言中的关键字、标识符、操作符、常量、终结符进行了定义和识别。并且能够进行更精确的检查和操作。词法分析将一个SQL划分成多个不同的token，每个token会有自己的词性

代码如下：

-   **1.       定义的形式如下：**

    ![](figures/zh-cn_image_0000001232729629.jpg)

-   **2.       检查的形式如下：**

    ![](figures/zh-cn_image_0000001186931494.jpg)

    可以看到 当遇到identifier类型的时候，会进行更进一步的检查和操作。首先调用函数确定它是否是从关键字表中查找关键字，如果是则返回关键字的类型。否则调用函数将大写转换成小写。

    用到的函数有：

    1、char\* downcase\_truncate\_identifier\(const char\* ident, int len, bool warn\)

    将字符都转化成小写，利用大写字母和小写字母之间的差值

    ![](figures/zh-cn_image_0000001232611073.jpg)

    2、bool scanner\_isspace\(char ch\)

    如果找到的是空格，则返回true

    ![](figures/zh-cn_image_0000001232489561.jpg)

    3、void truncate\_identifier\(char\* ident, int len, bool warn\)

    截断标识符

    ![](figures/zh-cn_image_0000001187091472.jpg)


## 二 、语法分析<a name="section6524133310409"></a>

-   文件位置：

    src/common/backend/parser/scan.l  定义语法结构，采用Yacc编译后生成gram.cpp文件

    原理：根据SQL语言的不同定义了一系列表达Statement的结构体（这些结构体通常以Stmt作为命名后缀），用来保存语法分析结果。


-   结构体如下：

    ![](figures/zh-cn_image_0000001232811117.jpg)

    结构体中的每一项都对应一个子结构，程序根据不同的情况对其赋值：

    情况有：

    ![](figures/zh-cn_image_0000001187250036.jpg)

    ![](figures/zh-cn_image_0000001187409942.jpg)

    这些形式会进一步的递归处理，最终转换为基本的simple\_select形式。代码如下：simple\_select语法分析结构可以看出，一条简单的查询语句由以下子句组成：去除行重复的distinctClause、目标属性targetList、SELECT INTO子句intoClause、FROM子句fromClause、WHERE子句whereClause、GROUP BY子句groupClause、HAVING子句havingClause、窗口子句windowClause和plan\_hint子句。在成功匹配simple\_select语法结构后，将会创建一个Statement结构体，将各个子句进行相应的赋值。

    simple\_select的其他子句，如distinctClause、groupClause、havingClause等，语法分析方式类似。而其他SQL命令，如CREATE、INSERT、UPDATE、DELETE等，处理方式与SELECT命令类似

-   使用的函数：

    ![](figures/zh-cn_image_0000001232729631.jpg)


逻辑：创建SelectStmt结构体后，向结构体中填充参数。语法分析树

它产生的函数在在文件src/common/backend/parser/parser.cpp文件中的row\_parser中被调用：

![](figures/zh-cn_image_0000001186931496.jpg)

最后返回，用于后面的语义分析、查询重写等步骤，该List中的每个ListCell包含一个语法树。

![](figures/zh-cn_image_0000001232611075.jpg)

## 三、语义分析<a name="section74671548154119"></a>

-   文件位置

主入口文件src/common/backend/parser/analyze.cpp，入口函数是parse\_analyze

-   原理：语义分析模块在词法分析和语法分析之后执行，用于检查SQL命令是否符合语义规定，能否正确执行。负责语义分析的是parse\_analyze函数，位于analyze.cpp下。parse\_analyze会根据词法分析和语法分析得到的语法树，生成一个ParseState结构体用于记录语义分析的状态，再调用transformStmt函数，根据不同的命令类型进行相应的处理，最后生成查询树。
-   ParseState保存了许多语义分析的中间信息，如原始SQL命令、范围表、连接表达式、原始WINDOW子句、FOR UPDATE/FOR SHARE子句等。该结构体在语义分析入口函数parse\_analyze下被初始化，在transformStmt函数下根据不同的Stmt存储不同的中间信息，完成语义分析后再被释放。ParseState结构如下。

![](figures/zh-cn_image_0000001232489563.jpg)

在语义分析过程中，语法树parseTree使用Node节点进行包装。Node结构只有一个类型为NodeTag枚举变量的字段，用于识别不同的处理情况。比如SelectStmt 对应的NodeTag值为T\_SelectStmt。Node结构如下。

![](figures/zh-cn_image_0000001187091474.jpg)

transformStmt函数会根据NodeTag的值，将语法树转化为不同的Stmt结构体，调用对应的语义分析函数进行处理。

![](figures/zh-cn_image_0000001232811119.jpg)

openGauss在语义分析阶段处理的NodeTag情况有九种

<a name="zh-cn_topic_0000001232802815_table153mcpsimp"></a>
<table><tbody><tr id="zh-cn_topic_0000001232802815_row158mcpsimp"><td class="cellrowborder" valign="top" width="43%"><p id="zh-cn_topic_0000001232802815_p160mcpsimp"><a name="zh-cn_topic_0000001232802815_p160mcpsimp"></a><a name="zh-cn_topic_0000001232802815_p160mcpsimp"></a>T_InsertStmt</p>
</td>
<td class="cellrowborder" valign="top" width="56.99999999999999%"><p id="zh-cn_topic_0000001232802815_p162mcpsimp"><a name="zh-cn_topic_0000001232802815_p162mcpsimp"></a><a name="zh-cn_topic_0000001232802815_p162mcpsimp"></a>transformInsertStmt</p>
</td>
</tr>
<tr id="zh-cn_topic_0000001232802815_row163mcpsimp"><td class="cellrowborder" valign="top" width="43%"><p id="zh-cn_topic_0000001232802815_p165mcpsimp"><a name="zh-cn_topic_0000001232802815_p165mcpsimp"></a><a name="zh-cn_topic_0000001232802815_p165mcpsimp"></a>T_DeleteStmt</p>
</td>
<td class="cellrowborder" valign="top" width="56.99999999999999%"><p id="zh-cn_topic_0000001232802815_p167mcpsimp"><a name="zh-cn_topic_0000001232802815_p167mcpsimp"></a><a name="zh-cn_topic_0000001232802815_p167mcpsimp"></a>transformDeleteStmt</p>
</td>
</tr>
<tr id="zh-cn_topic_0000001232802815_row168mcpsimp"><td class="cellrowborder" valign="top" width="43%"><p id="zh-cn_topic_0000001232802815_p170mcpsimp"><a name="zh-cn_topic_0000001232802815_p170mcpsimp"></a><a name="zh-cn_topic_0000001232802815_p170mcpsimp"></a>T_UpdateStmt</p>
</td>
<td class="cellrowborder" valign="top" width="56.99999999999999%"><p id="zh-cn_topic_0000001232802815_p172mcpsimp"><a name="zh-cn_topic_0000001232802815_p172mcpsimp"></a><a name="zh-cn_topic_0000001232802815_p172mcpsimp"></a>transformUpdateStmt</p>
</td>
</tr>
<tr id="zh-cn_topic_0000001232802815_row173mcpsimp"><td class="cellrowborder" valign="top" width="43%"><p id="zh-cn_topic_0000001232802815_p175mcpsimp"><a name="zh-cn_topic_0000001232802815_p175mcpsimp"></a><a name="zh-cn_topic_0000001232802815_p175mcpsimp"></a>T_MergeStmt</p>
</td>
<td class="cellrowborder" valign="top" width="56.99999999999999%"><p id="zh-cn_topic_0000001232802815_p177mcpsimp"><a name="zh-cn_topic_0000001232802815_p177mcpsimp"></a><a name="zh-cn_topic_0000001232802815_p177mcpsimp"></a>transformMergeStmt</p>
</td>
</tr>
<tr id="zh-cn_topic_0000001232802815_row178mcpsimp"><td class="cellrowborder" valign="top" width="43%"><p id="zh-cn_topic_0000001232802815_p180mcpsimp"><a name="zh-cn_topic_0000001232802815_p180mcpsimp"></a><a name="zh-cn_topic_0000001232802815_p180mcpsimp"></a>T_SelectStmt</p>
</td>
<td class="cellrowborder" valign="top" width="56.99999999999999%"><p id="zh-cn_topic_0000001232802815_p182mcpsimp"><a name="zh-cn_topic_0000001232802815_p182mcpsimp"></a><a name="zh-cn_topic_0000001232802815_p182mcpsimp"></a>transformSelectStmt</p>
</td>
</tr>
<tr id="zh-cn_topic_0000001232802815_row183mcpsimp"><td class="cellrowborder" valign="top" width="43%"><p id="zh-cn_topic_0000001232802815_p185mcpsimp"><a name="zh-cn_topic_0000001232802815_p185mcpsimp"></a><a name="zh-cn_topic_0000001232802815_p185mcpsimp"></a>T_DeclareCursorStmt</p>
</td>
<td class="cellrowborder" valign="top" width="56.99999999999999%"><p id="zh-cn_topic_0000001232802815_p187mcpsimp"><a name="zh-cn_topic_0000001232802815_p187mcpsimp"></a><a name="zh-cn_topic_0000001232802815_p187mcpsimp"></a>transformDeclareCursorStmt</p>
</td>
</tr>
<tr id="zh-cn_topic_0000001232802815_row188mcpsimp"><td class="cellrowborder" valign="top" width="43%"><p id="zh-cn_topic_0000001232802815_p190mcpsimp"><a name="zh-cn_topic_0000001232802815_p190mcpsimp"></a><a name="zh-cn_topic_0000001232802815_p190mcpsimp"></a>T_ExplainStmt</p>
</td>
<td class="cellrowborder" valign="top" width="56.99999999999999%"><p id="zh-cn_topic_0000001232802815_p192mcpsimp"><a name="zh-cn_topic_0000001232802815_p192mcpsimp"></a><a name="zh-cn_topic_0000001232802815_p192mcpsimp"></a>transformExplainStmt</p>
</td>
</tr>
<tr id="zh-cn_topic_0000001232802815_row193mcpsimp"><td class="cellrowborder" valign="top" width="43%"><p id="zh-cn_topic_0000001232802815_p195mcpsimp"><a name="zh-cn_topic_0000001232802815_p195mcpsimp"></a><a name="zh-cn_topic_0000001232802815_p195mcpsimp"></a>T_CreateTableAsStmt</p>
</td>
<td class="cellrowborder" valign="top" width="56.99999999999999%"><p id="zh-cn_topic_0000001232802815_p197mcpsimp"><a name="zh-cn_topic_0000001232802815_p197mcpsimp"></a><a name="zh-cn_topic_0000001232802815_p197mcpsimp"></a>transformCreateTableAsStmt</p>
</td>
</tr>
<tr id="zh-cn_topic_0000001232802815_row198mcpsimp"><td class="cellrowborder" valign="top" width="43%"><p id="zh-cn_topic_0000001232802815_p200mcpsimp"><a name="zh-cn_topic_0000001232802815_p200mcpsimp"></a><a name="zh-cn_topic_0000001232802815_p200mcpsimp"></a>T_CreateModelStmt</p>
</td>
<td class="cellrowborder" valign="top" width="56.99999999999999%"><p id="zh-cn_topic_0000001232802815_p202mcpsimp"><a name="zh-cn_topic_0000001232802815_p202mcpsimp"></a><a name="zh-cn_topic_0000001232802815_p202mcpsimp"></a>transformCreateModelStmt</p>
</td>
</tr>
</tbody>
</table>

transformSelectStmt：

![](figures/zh-cn_image_0000001187250038.jpg)调用关系

![](figures/zh-cn_image_0000001187409944.jpg)

![](figures/zh-cn_image_0000001232729635.jpg)

处理对应句子的流程。

以处理基本SELECT命令的transformSelectStmt函数为例，其处理流程如下。

（1） 创建一个新的Query节点，设置commandType为CMD\_SELECT。

（2） 检查SelectStmt是否存在WITH子句，存在则调用transformWithClause处理。

（3） 调用transformFromClause函数处理FROM子句。

（4） 调用transformTargetList函数处理目标属性。

（5） 若存在操作符“+”则调用transformOperatorPlus转为外连接。

（6） 调用transformWhereClause函数处理WHERE子句和HAVING子句。

（7） 调用transformSortClause函数处理ORDER BY子句。

（8） 调用transformGroupClause函数处理GROUP BY子句。

（9）  调用transformDistinctClause函数或者transformDistinctOnClause函数处理DISTINCT             子句。

（10）调用transformLimitClause函数处理LIMIT和OFFSET子句。

（11）调用transformWindowDefinitions函数处理WINDOWS子句。

（12）调用resolveTargetListUnknowns函数将其他未知类型作为text处理。

（13）调用transformLockingClause函数处理FOR UPDATE子句。

（14）处理其他情况，如insert语句、foreign table等。

（15）返回查询树。

## 四、总体的入口函数：<a name="section36911719114219"></a>

![](figures/zh-cn_image_0000001186931498.jpg)

l  位置：\\src\\gausskernel\\process\\tcop\\postgres.cpp

1、调用 pg\_parse\_query 函数，参数 用户输入的命令，生成 parsetree\_list

![](figures/zh-cn_image_0000001232611077.jpg)

2、再调用 pg\_analyze\_and\_rewrite 函数，参数 语法树链表，返回 查询树链表。进行语义分析。

![](figures/zh-cn_image_0000001232489565.jpg)

3、pg\_analyze\_and\_rewrite 函数调用parse\_analyze 函数进行语义分析。

![](figures/zh-cn_image_0000001187091476.jpg)

调用流程图

![](figures/zh-cn_image_0000001232811121.png)

