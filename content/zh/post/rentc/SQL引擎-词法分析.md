+++

title = "SQL引擎-词法分析"

date = "2022-09-09"

tags = ["SQL引擎-词法分析"]

archives = "2022-09"

author = "海量数据"

summary = "SQL引擎-词法分析"

img = "/zh/post/Rentc/title/title.jpg"

times = "18:40"

+++<br />前言：是数据库重要的子系统之一。SQL引擎负责对用户输入的SQL语言进行编译，生成可执行的执行计划，然后将执行计划交给执行引擎进行执行。<br />SQL引擎包括：<br />1.解析器，根据SQL语句生成一棵语法解析树（parse tree）。<br />2. 分析器 ， 对语法解析树进行语义分析 ，生成一 棵查询树（ query tree）。<br />3.重写器，按照规则系统中存在的规则对查询树进行改写。<br />4.计划器，基于查询树生成一棵执行效率最高的计划树（plan tree）。<br />5.执行器，按照计划树中的顺序访问表和索引，执行相应查询。<br />SQL解析对输入的SQL语句进行词法分析、语法分析、语义分析，获得查询解析树或者逻辑计划。这篇文章主要是介绍词法分析。<br />词法分析：从查询语句中识别出系统支持的关键字、标识符、操作符、终结符等，每个词确定自己固有的词性。<br />1.词法结构和语法结构分别由scan.l和gram.y文件定义，并通过lex和yacc分别编译成scan.cpp和gram.cpp文件。<br />2.raw_parser:Lex ( Lexical Analyzar)    词法分析工具,在文件 scan.l里定义。负责识别标识符，SQL 关键字等，对于发现的每个关键字或者标识符都会生成一个记号并且传递给分析器;Yacc (Yet Another Compiler Compiler)  语法分析器,在文件 gram.y里定义。包含一套语法规则和触发规则时执行的动作.<br />3.由lex工具进行词法分析。lex工具通过对已经定义好的词法文件进行编译，生成词法分析的代码。 词法文件是scan.l，它根据SQL语言标准对SQL语言中的关键字、标识符、操作符、常量、终结符进行了定义和识别<br />4.词法分析将一个SQL划分成多个不同的token，每个token会有自己的词性。由三部分组成，分别是名字、Token值、类别。名字是字符串原型，Token值是一个int型的数。kwlist.h中定义了大量的关键字<br />举例说明：<br />![image.png](https://cdn.nlark.com/yuque/0/2022/png/29767082/1662717423884-bd4f2443-185d-4b97-a74b-b63f5a62d7b6.png#clientId=u8068a7c7-6502-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=26&id=u264c2ec0&margin=%5Bobject%20Object%5D&name=image.png&originHeight=32&originWidth=537&originalType=binary&ratio=1&rotation=0&showTitle=false&size=6780&status=done&style=none&taskId=u3ab17660-b27d-4d6e-a2cb-c171d350b52&title=&width=429.6)<br />![image.png](https://cdn.nlark.com/yuque/0/2022/png/29767082/1662717437491-343f2d6a-8734-47d3-b720-553c47dd2c15.png#clientId=u8068a7c7-6502-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=258&id=u3b341ec7&margin=%5Bobject%20Object%5D&name=image.png&originHeight=322&originWidth=353&originalType=binary&ratio=1&rotation=0&showTitle=false&size=14853&status=done&style=none&taskId=u48f58901-1c19-4b4e-8ab4-b721d9b105d&title=&width=282.4)
