+++

title = "PostgreSQL与openGauss之关键字" 

date = "2020-12-17" 

tags = ["openGauss与postgresql对比"] 

archives = "2020-12" 

author = "高云龙" 

summary = "PostgreSQL与openGauss之关键字"

img = "/zh/post/gaoyunlong/title/img25.png" 

times = "16:40"

+++

# PostgreSQL与openGauss之关键字<a name="ZH-CN_TOPIC_0000001071508200"></a>

日常数据库运维的过程中可能对数据库关键字关注点并不是很高，但在程序开发的过程中，数据库对象建模要尽可能的避开数据库关键字的使用，否则在后续开发过程中需要用到各种转译的方法来将关键字转换为普通字符，会非常的麻烦。最近在openGauss上执行date函数后报语法错误，经查询openGauss是支持date函数的，但却用不了，真对这个问题，分别在PostgreSQL12.2数据库和openGauss（1.0.1）数据库进行问题复现并问题分析。

在openGauss执行结果如下：

![](../figures/11.png)

在PostgreSQL执行date函数结果如下：

![](../figures/22.png)

经调查发现是date关键字的问题。

在openGauss的关键字列表中,虽然不是保留关键字，但是不允许是函数或者类型。

![](../figures/33.png)

在PostgreSQL的关键字列表中，是一个普通字符。

![](../figures/44.png)

由此问题进行深入思考，对比PostgreSQL与openGauss数据库中哪些关键字做了差异化说明，避免在日常使用中再次遇到类似问题。

<a name="table549323145418"></a>
<table><thead align="left"><tr id="row8493103115414"><th class="cellrowborder" valign="top" width="33.33333333333333%" id="mcps1.1.4.1.1">&nbsp;&nbsp;</th>
<th class="cellrowborder" valign="top" width="33.33333333333333%" id="mcps1.1.4.1.2"><p id="p24941313545"><a name="p24941313545"></a><a name="p24941313545"></a>PostgreSQL</p>
</th>
<th class="cellrowborder" valign="top" width="33.33333333333333%" id="mcps1.1.4.1.3"><p id="p749433118547"><a name="p749433118547"></a><a name="p749433118547"></a>openGauss</p>
</th>
</tr>
</thead>
<tbody><tr id="row0494183110547"><td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.1 "><p id="p2049423112541"><a name="p2049423112541"></a><a name="p2049423112541"></a>DATE</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.2 "><p id="p549413317542"><a name="p549413317542"></a><a name="p549413317542"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.3 "><p id="p04951831125418"><a name="p04951831125418"></a><a name="p04951831125418"></a>非保留（不能是函数或类型）</p>
</td>
</tr>
<tr id="row5495731105416"><td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.1 "><p id="p1649583119546"><a name="p1649583119546"></a><a name="p1649583119546"></a>IS</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.2 "><p id="p1149573117543"><a name="p1149573117543"></a><a name="p1149573117543"></a>reserved (can be function or type)</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.3 "><p id="p549513195416"><a name="p549513195416"></a><a name="p549513195416"></a>保留</p>
</td>
</tr>
<tr id="row949573115544"><td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.1 "><p id="p4496173125417"><a name="p4496173125417"></a><a name="p4496173125417"></a>ISNULL</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.2 "><p id="p34971731195411"><a name="p34971731195411"></a><a name="p34971731195411"></a>reserved (can be function or type)</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.3 "><p id="p15497163175419"><a name="p15497163175419"></a><a name="p15497163175419"></a>非保留</p>
</td>
</tr>
<tr id="row249713317542"><td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.1 "><p id="p0497231105418"><a name="p0497231105418"></a><a name="p0497231105418"></a>LATERAL</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.2 "><p id="p194971631165417"><a name="p194971631165417"></a><a name="p194971631165417"></a>reserved</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.3 "><p id="p15497203117541"><a name="p15497203117541"></a><a name="p15497203117541"></a>-</p>
</td>
</tr>
<tr id="row249715314543"><td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.1 "><p id="p249723135415"><a name="p249723135415"></a><a name="p249723135415"></a>MAXVALUE</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.2 "><p id="p14984311549"><a name="p14984311549"></a><a name="p14984311549"></a>non-reserved</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.3 "><p id="p1498163115547"><a name="p1498163115547"></a><a name="p1498163115547"></a>保留</p>
</td>
</tr>
<tr id="row14498231145413"><td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.1 "><p id="p1749811318547"><a name="p1749811318547"></a><a name="p1749811318547"></a>NUMBER</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.2 "><p id="p12498193110544"><a name="p12498193110544"></a><a name="p12498193110544"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.3 "><p id="p12498163118543"><a name="p12498163118543"></a><a name="p12498163118543"></a>非保留（不能是函数或类型）</p>
</td>
</tr>
<tr id="row4498133117544"><td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.1 "><p id="p1549813316548"><a name="p1549813316548"></a><a name="p1549813316548"></a>PROCEDURE</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.2 "><p id="p149853115410"><a name="p149853115410"></a><a name="p149853115410"></a>non-reserved</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.3 "><p id="p54981831125410"><a name="p54981831125410"></a><a name="p54981831125410"></a>保留</p>
</td>
</tr>
<tr id="row1430554415416"><td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.1 "><p id="p183064449548"><a name="p183064449548"></a><a name="p183064449548"></a>TABLESAMPLE</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.2 "><p id="p143068441545"><a name="p143068441545"></a><a name="p143068441545"></a>reserved (can be function or type)</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.3 "><p id="p530694425418"><a name="p530694425418"></a><a name="p530694425418"></a>-</p>
</td>
</tr>
<tr id="row153071444185415"><td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.1 "><p id="p1230717445545"><a name="p1230717445545"></a><a name="p1230717445545"></a>XMLNAMESPACES</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.2 "><p id="p1630716446546"><a name="p1630716446546"></a><a name="p1630716446546"></a>non-reserved (cannot be function or type)</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.3 "><p id="p1530710441543"><a name="p1530710441543"></a><a name="p1530710441543"></a>-</p>
</td>
</tr>
<tr id="row13072443542"><td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.1 "><p id="p18308134414540"><a name="p18308134414540"></a><a name="p18308134414540"></a>XMLTABLE</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.2 "><p id="p33086444543"><a name="p33086444543"></a><a name="p33086444543"></a>non-reserved (cannot be function or type)</p>
</td>
<td class="cellrowborder" valign="top" width="33.33333333333333%" headers="mcps1.1.4.1.3 "><p id="p203084442549"><a name="p203084442549"></a><a name="p203084442549"></a>-</p>
</td>
</tr>
</tbody>
</table>

通过对比两个数据库的保留关键字，在openGauss中"date"和"number" 虽然不是保留关键字，但是不可用于函数或类型操作，"isnull"和"LATERAL"变为非保留关键字，"maxvalue"和"procedure"变为保留关键字，“TABLESAMPLE”、“XMLNAMESPACES"及"XMLTABLE”不再做限制。

