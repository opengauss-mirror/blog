+++

title = "OpenGauss数据库SQL解析模块源码分析"

date = "2021-11-29"

tags = ["OpenGauss数据库SQL解析模块"]

archives = "2021-11"

author = "罗宇辰"

summary = "OpenGauss数据库安装与使用"

img = "/zh/post/louie/title/1.png"

times = "12:45"

+++

# OpenGauss数据库SQL解析模块源码分析

## 一.概述

经过对openGauss安装使用后发现openGauss依然采用sql语言进行数据库操作。于是我对openGauss如何使用sql的语法进行数据库操作进行了探索。
通过学习已有博客分析和源码的阅读，我发现这个过程在SQL引擎中算作SQL解析，SQL语句在数据库管理系统中的编译过程符合编译器实现的常规过程，需要进行词法分析、语法分析和语义分析。
（1） 词法分析：从查询语句中识别出系统支持的关键字、标识符、操作符、终结符等，确定每个词自己固有的词性。常用工具如flex。
（2） 语法分析：根据SQL语言的标准定义语法规则，使用词法分析中产生的词去匹配语法规则，如果一个SQL语句能够匹配一个语法规则，则生成对应的抽象语法树（abstract synatax tree，AST）。常用工具如Bison。
（3） 语义分析：对抽象语法树进行有效性检查，检查语法树中对应的表、列、函数、表达式是否有对应的元数据，将抽象语法树转换为查询树。
所以个人感觉内容和编译原理实验差不多。
openGauss采用flex和bison两个工具来完成词法分析和语法分析的主要工作。对于用户输入的每个SQL语句，它首先交由flex工具进行词法分析。flex工具通过对已经定义好的词法文件进行编译，生成词法分析的代码。

![1.png](../figures/1.png "1")

## 二.SQL解析的具体实现分析

###1.代码结构

![2.png](../figures/2.png "2")
词法结构和语法结构分别由scan.l和gram.y文件定义，并通过flex和bison分别编译成scan.cpp和gram.cpp文件。
###2.词法分析
openGauss中的词法文件是scan.l，它根据SQL语言标准对SQL语言中的关键字、标识符、操作符、常量、终结符进行了定义和识别。
词法分析将一个SQL划分成多个不同的token，每个token会有自己的词性。
####（1）函数声明
![3.png](../figures/3.png "3")
![4.png](../figures/4.png "4")
![5.png](../figures/5.png "5")

####（2）flex文件构成
Flex文件由三个部分组成。或者说三个段。三个段之间用两个%%分隔。
定义段(definitions)
%%
规则段(rules)
%%
用户代码段（usercode）

####（3）定义段分析（token定义）
1）空格，换行，注释
![6.png](../figures/6.png "6")
2）op tokens是单个char还是具有特殊操作的识别（看op tokens后面还有更多字符）
![7.png](../figures/7.png "7")
3）数据类型定义
![8.png](../figures/8.png "8")

4）其他
还有关于括号识别确定sql语句开始或结束（包括{ }double quote和$ $style quote），注释识别（c style）等。

####（4）规则段分析（识别token后的操作）
1）只有空格则什么都不做
![9.png](../figures/9.png "9")
![10.png](../figures/10.png "10")
2）sql单语句操作时，将分号前的所有字符视为一条sql操作语句存储起来。（识别单语句取决于是否在括号里）
![11.png](../figures/11.png "11")
![12.png](../figures/12.png "12")

####（5）用户代码段分析

1）Report a lexer or grammar error cursor position（光标位置错误处理）
![13.png](../figures/13.png "13")

###3.语法分析
openGuass中定义了bison工具能够识别的语法文件gram.y，同样在Makefile中可以通过bison工具对gram.y进行编译，生成gram.cpp文件。
openGauss中，根据SQL语言的不同定义了一系列表达Statement的结构体（stmt），用来保存语法分析结果（如SELECT，DELETE，CREATE）。

源码分析gram.y openGauss/openGauss-server - Gitee IDE
####（1）Bison 语法文件内容的布局
Bison 语法文件内容的分布如下（四个部分）：
%{
序言
%}
Bison 声明
%%
语法规则
%%
结尾

####（2）序言（prologue）分析

####（3）Bison 声明
1）通过 %pure_parser 来指定希望解析器是可重入的。（默认情况下 yyparse() 函数是没有参数的, 可以通过%parse-param {param} 来传递参数, 调用的时候也是 yyparse(param)的形式. %lex-param 是对 yylex() 函数增加参数.
![14.png](../figures/14.png "14")

2）Bison中默认将所有的语义值都定义为int类型，可以通过定义宏YYSTYPE来改变值的类型。如果有多个值类型，则需要通过在Bison声明中使用%union列举出所有的类型
![15.png](../figures/15.png "15")

3）非终结符使用%type来定义
![16.png](../figures/16.png "16")

4）终结符使用%token
![17.png](../figures/17.png "17")

5）操作符优先级（左结合，右结合）
![18.png](../figures/18.png "18")

####（4）语法规则（grammar rules）
1）编译目标
![19.png](../figures/19.png "19")
2）所有语法规则结构体
![20.png](../figures/20.png "20")

3）具体功能实现
![21.png](../figures/21.png "21")

####（5）结尾
![22.png](../figures/22.png "22")

###4.flex与bison的联系
用bison来做语法分析，首先要将分析对象做仔细的研究。分析工作的首要任务是分清楚什么是终结符，什么是非终结符。
终结符是一组原子性的单词，表达了语法意义中不可分割的一个标记。在具体的表现形式上，可能是一个字符串，也可能是一个整数，或者是一个空格，一个换行符等等。bison只给出每个终结符的名称，并不给出其定义。Bison为每个终结符名称分配一个唯一的数字代码。
终结符的识别由专门定义的函数yylex()执行。这个函数返回识别出来的终结符的编码，且已识别的终结符可以通过全局变量yytext指针，而这个终结符的长度则存储在全局变量yyleng中。来取得这种终结符的分析最好用flex工具通过对语法文件进行扫描来识别。有些终结符有不同的具体表示。
非终结符是一个终结符序列所构成的一个中间表达式的名字。实际上不存在这么一个原子性的标记。这种非终结符的构成方式则应该由Bison来表达。语法规则就是由终结符和非终结符一起构成的一种组成规则的表达。
Bison实际上也是一个自动化的文法分析工具，其利用词法分析函数yylex()返回的词法标记返回其ID，执行每一条文法规则后定义的动作。Bison是不能自动地生成词法分析函数的。一般简单的程序里，一般在文法规则定义文件的末尾添加该函数的定义。但是在较复杂的大型程序里，则利用自动词法生成工具flex生成yylex()的定义。
Bison与Flex联用时，Bison只定义标记的ID。Flex则需要知道这些词法标记的ID，才能在识别到一个词法标记时返回这个ID给Bison。Bison传递这些ID给Flex的方法，就是在调用bison命令时使用参数-d。使用这个参数后，Bison会生成一个独立的头文件，该文件的名称形式为name.tab.h。在Flex的词法规则文件中，在定义区段里包含这个头文件即可。
yylex()只需要每次识别出一个token就马上返回这个token的ID即可。上例中返回的token的ID就是TOK_NUMBER。此外，一个token的语义值可以由yylex()计算出来后放在全局变量yylval中。

##三.总结
对openGauss内核分析的任务，我选择了看起来较为熟悉的SQL解析模块。在博客文章的指引下成功找到了对应模块所在位置，之后便开始拜读大佬们的程序。因为之前也用flex和bison做过编译原理的实验作业，所以整个步骤大概还知道点。代码写的真好，注释啥的都很多，主要问题就是注释也全英文，看的那叫一个难受。由于里面有很多专业词汇，谷歌翻译的一团糟，很多看完大概知道什么意思，但不确定理解的对不对。感觉专业词汇可能见多了才能舒服的阅读，我现在明显还没这个功力。

##四.参考资料 
1.https://zhuanlan.zhihu.com/p/389174538
2.https://gitee.com/opengauss/openGauss-server/tree/master/src/common/backend/parser
3.https://www.cnblogs.com/me115/archive/2010/10/27/1862180.html
