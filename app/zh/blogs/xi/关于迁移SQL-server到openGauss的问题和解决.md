---
title: '关于迁移SQL server到openGauss的问题和解决'

date: '2021-01-12'

category: 'blog'
tags: ['迁移SQL server到openGauss']

archives: '2021-01'

author: 'xi'

summary: '关于迁移SQL server到openGauss的问题和解决'

img: '/zh/blogs/xi/title/img6.png'

times: '14:30'
---

# 关于迁移 SQL server 到 openGauss 的问题和解决<a name="ZH-CN_TOPIC_0000001073690542"></a>

## 背景<a name="section77987435915"></a>

2020 年 9 月份，在将 SQL server 内容迁移到 openGauss 数据库的过程中，由于 openGauss 开源不久，我在迁移的过程中遇到了许多问题。通过对源码的阅读和实际调试，最后逐个解决。在这里，我对两个数据库之间的不同和相同分别做对比，提供一个实际参考。（之所以列出相同，是为了更放心地使用）

- openGauss 版本：1.0.1
- SQL server 版本：2008

## 对比<a name="section1726992701010"></a>

以下所有内容均基于具体使用，因此将涵盖使用中较基本方面。

**整体结构**

- 相同

SQL server 和 openGauss 同为关系型数据库，创建数据库和使用基本相同，当然 openGauss 数据库相比其他开源数据库主要有复合应用场景、高性能和高可用等产品特点，在不同之处基本可以解决。

- 相异

<a name="table20961827495"></a>

<table><thead ><tr id="row15262102710911"><th class="cellrowborder"  width="33.333333333333336%" id="mcps1.1.4.1.1"><p id="p726282718913"><a name="p726282718913"></a><a name="p726282718913"></a>SQL server</p>
</th>
<th class="cellrowborder"  width="33.333333333333336%" id="mcps1.1.4.1.2"><p id="p02622271996"><a name="p02622271996"></a><a name="p02622271996"></a>openGauss</p>
</th>
<th class="cellrowborder"  width="33.333333333333336%" id="mcps1.1.4.1.3"><p id="p182625275920"><a name="p182625275920"></a><a name="p182625275920"></a>解决</p>
</th>
</tr>
</thead>
<tbody><tr id="row92621527497"><td class="cellrowborder"  width="33.333333333333336%" headers="mcps1.1.4.1.1 "><p id="p7262202716916"><a name="p7262202716916"></a><a name="p7262202716916"></a>跨数据库执行表操作和存储过程调用</p>
</td>
<td class="cellrowborder"  width="33.333333333333336%" headers="mcps1.1.4.1.2 "><p id="p3262192719911"><a name="p3262192719911"></a><a name="p3262192719911"></a>无法跨数据库操作</p>
</td>
<td class="cellrowborder"  width="33.333333333333336%" headers="mcps1.1.4.1.3 "><p id="p6263112711915"><a name="p6263112711915"></a><a name="p6263112711915"></a>基本可以用openGauss中的多模式实现多数据库，跨模式可以实现跨库</p>
</td>
</tr>
<tr id="row1926314276913"><td class="cellrowborder"  width="33.333333333333336%" headers="mcps1.1.4.1.1 "><p id="p152634279911"><a name="p152634279911"></a><a name="p152634279911"></a>同一数据库可以直接用表名调用操作</p>
</td>
<td class="cellrowborder"  width="33.333333333333336%" headers="mcps1.1.4.1.2 "><p id="p52635271395"><a name="p52635271395"></a><a name="p52635271395"></a>若直接调用会报不相关错误</p>
</td>
<td class="cellrowborder"  width="33.333333333333336%" headers="mcps1.1.4.1.3 "><p id="p132631327897"><a name="p132631327897"></a><a name="p132631327897"></a>将包括系统表在内的所有表，一切采用显示调用：模式名+数据库名+表名</p>
</td>
</tr>
<tr id="row526315279918"><td class="cellrowborder"  width="33.333333333333336%" headers="mcps1.1.4.1.1 "><p id="p112631327994"><a name="p112631327994"></a><a name="p112631327994"></a>临时数据库TempDB自动存储临时表</p>
</td>
<td class="cellrowborder"  width="33.333333333333336%" headers="mcps1.1.4.1.2 "><p id="p026417271390"><a name="p026417271390"></a><a name="p026417271390"></a>无临时数据库</p>
</td>
<td class="cellrowborder"  width="33.333333333333336%" headers="mcps1.1.4.1.3 "><p id="p1926410271898"><a name="p1926410271898"></a><a name="p1926410271898"></a>openGauss在pg_temp开头的schema中有系统临时表，当然也有全局和本地两种临时表，创建时指定TEMP或TEMPORARY关键字，可创建为临时表</p>
</td>
</tr>
</tbody>
</table>

**数据类型**

- 相同

1.  数值类型：INT、INTEGER、SAMALLINT、BIGINT 包括对应数组基本用法相同。
2.  货币类型和布尔类型使用基本相同。
3.  字符类型：定长和变长的 CHAER 和 VARCHAR 用法基本相同；TEXT、name 也可互通使用

- 相异

<a name="table511211271792"></a>

<table><thead ><tr id="row132653277918"><th class="cellrowborder"  width="33.333333333333336%" id="mcps1.1.4.1.1"><p id="p52651271918"><a name="p52651271918"></a><a name="p52651271918"></a>SQL server</p>
</th>
<th class="cellrowborder"  width="33.333333333333336%" id="mcps1.1.4.1.2"><p id="p19265127593"><a name="p19265127593"></a><a name="p19265127593"></a>openGauss</p>
</th>
<th class="cellrowborder"  width="33.333333333333336%" id="mcps1.1.4.1.3"><p id="p132652271597"><a name="p132652271597"></a><a name="p132652271597"></a>解决</p>
</th>
</tr>
</thead>
<tbody><tr id="row102651227194"><td class="cellrowborder"  width="33.333333333333336%" headers="mcps1.1.4.1.1 "><p id="p52651227295"><a name="p52651227295"></a><a name="p52651227295"></a>字符类型：nvarchar（n）用来存储大量中文</p>
</td>
<td class="cellrowborder"  width="33.333333333333336%" headers="mcps1.1.4.1.2 "><p id="p526511271790"><a name="p526511271790"></a><a name="p526511271790"></a>不存在对应nvarchar(n)的类型</p>
</td>
<td class="cellrowborder"  width="33.333333333333336%" headers="mcps1.1.4.1.3 "><p id="p226514277910"><a name="p226514277910"></a><a name="p226514277910"></a>openGauss中选择nvarchar2(n)存储大量中文，效果一致</p>
</td>
</tr>
</tbody>
</table>

**表操作**

- 相同

1.  创建表和删除表基本相同
2.  多表查询基本相同，如下：

    <img src='./figures/image_editor_6fd53aef-237d-4514-8722-7900c77c269b.png'>

3.  集函数用法基本一致

- 相异

主要是系统表的使用差别

<a name="table211712717919"></a>

<table><thead ><tr id="row72669271693"><th class="cellrowborder"  width="26.392639263926394%" id="mcps1.1.4.1.1"><p id="p4266827691"><a name="p4266827691"></a><a name="p4266827691"></a>SQL server</p>
</th>
<th class="cellrowborder"  width="29.382938293829387%" id="mcps1.1.4.1.2"><p id="p126714271399"><a name="p126714271399"></a><a name="p126714271399"></a>openGauss</p>
</th>
<th class="cellrowborder"  width="44.22442244224422%" id="mcps1.1.4.1.3"><p id="p11267227598"><a name="p11267227598"></a><a name="p11267227598"></a>解决</p>
</th>
</tr>
</thead>
<tbody><tr id="row7267112715914"><td class="cellrowborder"  width="26.392639263926394%" headers="mcps1.1.4.1.1 "><p id="p1426719271392"><a name="p1426719271392"></a><a name="p1426719271392"></a>sysobjects可用表名查询</p>
</td>
<td class="cellrowborder"  width="29.382938293829387%" headers="mcps1.1.4.1.2 "><p id="p13267132715913"><a name="p13267132715913"></a><a name="p13267132715913"></a>刚开始使用PG_OBJECT表，此表只能按id查询</p>
</td>
<td class="cellrowborder"  width="44.22442244224422%" headers="mcps1.1.4.1.3 "><p id="p191378212364"><a name="p191378212364"></a><a name="p191378212364"></a>代替：PG_TABLES中可用表名查询</p>
</td>
</tr>
<tr id="row2267172713911"><td class="cellrowborder"  width="26.392639263926394%" headers="mcps1.1.4.1.1 "><p id="p226716278915"><a name="p226716278915"></a><a name="p226716278915"></a>可用系统表sys.columns.object_id查询某表所有列名</p>
</td>
<td class="cellrowborder"  width="29.382938293829387%" headers="mcps1.1.4.1.2 "><p id="p526810271193"><a name="p526810271193"></a><a name="p526810271193"></a>openGauss中可用information_schema模式下的columns表得到某表所有列名</p>
</td>
<td class="cellrowborder"  width="44.22442244224422%" headers="mcps1.1.4.1.3 "><p id="p1466191917404"><a name="p1466191917404"></a><a name="p1466191917404"></a>sys.columns表结构</p>
<p id="p106158424409"><a name="p106158424409"></a><a name="p106158424409"></a><a name="image4615204244016"></a><a name="image4615204244016"></a><span><img id="image4615204244016" src="./figures/2.png" height="45.885000000000005" width="523.6875"></span></p>
<p id="p1226817271697"><a name="p1226817271697"></a><a name="p1226817271697"></a>information_schema.columns表结构</p>
<p id="p10801163312389"><a name="p10801163312389"></a><a name="p10801163312389"></a><a name="image11801173315381"></a><a name="image11801173315381"></a><span><img id="image11801173315381" src="./figures/3.png" height="36.9075" width="523.6875"></span></p>
</td>
</tr>
</tbody>
</table>

**函数对比**

- 相同

1.  while 函数、集函数、exist 函数等简单函数基本一致
2.  `left\(str text, n int\)、right\(str text, n int\)、length\(string bytea, encoding name \)replace\(string text, from text, to text\)ltrim\(string \[, characters\]\)、rtrim\(string text \[, characters text\]charindex` 函数

- 相异

<a name="table14132827491"></a>

<table><thead ><tr id="row18269152717914"><th class="cellrowborder"  width="50%" id="mcps1.1.3.1.1"><p id="p02696271393"><a name="p02696271393"></a><a name="p02696271393"></a>SQL server</p>
</th>
<th class="cellrowborder"  width="50%" id="mcps1.1.3.1.2"><p id="p102699279913"><a name="p102699279913"></a><a name="p102699279913"></a>openGauss解决</p>
</th>
</tr>
</thead>
<tbody><tr id="row42699277911"><td class="cellrowborder"  width="50%" headers="mcps1.1.3.1.1 "><p id="p727019271791"><a name="p727019271791"></a><a name="p727019271791"></a>if-else函数比较自由</p>
</td>
<td class="cellrowborder"  width="50%" headers="mcps1.1.3.1.2 "><p id="p927014271194"><a name="p927014271194"></a><a name="p927014271194"></a>完整的if-then-else-end if结构</p>
</td>
</tr>
<tr id="row62703274918"><td class="cellrowborder"  width="50%" headers="mcps1.1.3.1.1 "><p id="p192705279917"><a name="p192705279917"></a><a name="p192705279917"></a>替换子字符串函数stuff ( character_expression1 , start , length , character_expression2 )</p>
</td>
<td class="cellrowborder"  width="50%" headers="mcps1.1.3.1.2 "><p id="p92701027195"><a name="p92701027195"></a><a name="p92701027195"></a>overlay(string placing string FROM int [for int])完美替换stuff（）函数</p>
</td>
</tr>
<tr id="row112702271492"><td class="cellrowborder"  width="50%" headers="mcps1.1.3.1.1 "><p id="p02708271993"><a name="p02708271993"></a><a name="p02708271993"></a>自定义函数时比较自由</p>
</td>
<td class="cellrowborder"  width="50%" headers="mcps1.1.3.1.2 "><p id="p152701271898"><a name="p152701271898"></a><a name="p152701271898"></a>自定义函数格式注意加</p>
<p id="p751614710435"><a name="p751614710435"></a><a name="p751614710435"></a><a name="image1751664710439"></a><a name="image1751664710439"></a><span><img id="image1751664710439" src="./figures/4.png"></span></p>
</td>
</tr>
</tbody>
</table>

**存储过程**

- 相同

SQL server 和 openGauss 在存储过程中的相同点较少，基本上的逻辑基本相同。

1.  存储过程均支持输入\(in\)、输出（out）参数。
2.  存储过程答题逻辑相似。

- 相异

<a name="table713922718916"></a>

<table><thead ><tr id="row1627118271399"><th class="cellrowborder"  width="49.27%" id="mcps1.1.3.1.1"><p id="p132715271197"><a name="p132715271197"></a><a name="p132715271197"></a>SQL server</p>
</th>
<th class="cellrowborder"  width="50.73%" id="mcps1.1.3.1.2"><p id="p5271102715915"><a name="p5271102715915"></a><a name="p5271102715915"></a>openGauss解决</p>
</th>
</tr>
</thead>
<tbody><tr id="row027120277919"><td class="cellrowborder"  width="49.27%" headers="mcps1.1.3.1.1 "><p id="p13271727496"><a name="p13271727496"></a><a name="p13271727496"></a>declare声明在begin-end体内</p>
</td>
<td class="cellrowborder"  width="50.73%" headers="mcps1.1.3.1.2 "><p id="p172717271290"><a name="p172717271290"></a><a name="p172717271290"></a>declare声明必须在存储过程begin-end体外统一声明</p>
</td>
</tr>
<tr id="row1627115271919"><td class="cellrowborder"  width="49.27%" headers="mcps1.1.3.1.1 "><p id="p427192715917"><a name="p427192715917"></a><a name="p427192715917"></a>由于SQL server的begin-end相当于‘{}’，所以根据使用的函数，或者事务相应添加结构begin-end</p>
</td>
<td class="cellrowborder"  width="50.73%" headers="mcps1.1.3.1.2 "><p id="p8271132718911"><a name="p8271132718911"></a><a name="p8271132718911"></a>由于begin-end是执行结构，因此，存储过程body中所有添加begin-end结构的都不需要再添加，即整个存储过程一套begin-end结构</p>
</td>
</tr>
<tr id="row32719276913"><td class="cellrowborder"  width="49.27%" headers="mcps1.1.3.1.1 "><p id="p2272927192"><a name="p2272927192"></a><a name="p2272927192"></a>存储过程中用表创建新表：SELECT * INTO tablename FROM tablename1</p>
</td>
<td class="cellrowborder"  width="50.73%" headers="mcps1.1.3.1.2 "><p id="p827292717917"><a name="p827292717917"></a><a name="p827292717917"></a>因为SELECT INTO不能在存储过程中使用，会报错tablename不存在。 解决：使用CREATE TABLE AS语法替代SELECT INTO</p>
</td>
</tr>
<tr id="row8272527495"><td class="cellrowborder"  width="49.27%" headers="mcps1.1.3.1.1 "><p id="p82721027192"><a name="p82721027192"></a><a name="p82721027192"></a>catch错误处理：在有事务时，仍可针对具体语句多次处理</p>
</td>
<td class="cellrowborder"  width="50.73%" headers="mcps1.1.3.1.2 "><p id="p72721276917"><a name="p72721276917"></a><a name="p72721276917"></a>openGauss中，存储过程begin-end就是一个整体事务，可以方便地在body体最后用others整体处理：</p>
<p id="p19295205374419"><a name="p19295205374419"></a><a name="p19295205374419"></a><a name="image1629595310442"></a><a name="image1629595310442"></a><span><img id="image1629595310442" src="./figures/5.png"></span></p>
</td>
</tr>
<tr id="row122723271690"><td class="cellrowborder"  width="49.27%" headers="mcps1.1.3.1.1 "><p id="p112724271397"><a name="p112724271397"></a><a name="p112724271397"></a>可用return返回参数</p>
</td>
<td class="cellrowborder"  width="50.73%" headers="mcps1.1.3.1.2 "><p id="p18272627592"><a name="p18272627592"></a><a name="p18272627592"></a>存储过程的入参和出参，默认IN，出参时（OUT name nametype）</p>
</td>
</tr>
<tr id="row1327216271699"><td class="cellrowborder"  width="49.27%" headers="mcps1.1.3.1.1 "><p id="p82727271199"><a name="p82727271199"></a><a name="p82727271199"></a>exec执行；@是变量必要格式</p>
</td>
<td class="cellrowborder"  width="50.73%" headers="mcps1.1.3.1.2 "><p id="p112721271598"><a name="p112721271598"></a><a name="p112721271598"></a>execute执行；并不需要@格式</p>
</td>
</tr>
<tr id="row132731027999"><td class="cellrowborder"  width="49.27%" headers="mcps1.1.3.1.1 "><p id="p1527312279912"><a name="p1527312279912"></a><a name="p1527312279912"></a>动态执行：exec sp_executesql</p>
</td>
<td class="cellrowborder"  width="50.73%" headers="mcps1.1.3.1.2 "><p id="p4273112713919"><a name="p4273112713919"></a><a name="p4273112713919"></a>动态执行： execute immediate</p>
</td>
</tr>
</tbody>
</table>

- 以上均为问题解决方法，具体语句可以看开源社区的格式[openGauss 社区](https://www.modb.pro/opengauss)

**总结**

SQL server 和 openGauss 由于都是关系型数据库，大体结构、基本数据类型、表操作和函数重合点很高，但是存储过程方面基本上需要全部仔细修改，逐渐调试并找到解决办法。以上所有都来自于实操，并成功迁移。
