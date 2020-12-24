+++

title = "PostgreSQL与openGauss之数据类型" 

date = "2020-12-17" 

tags = ["openGauss与postgresql对比"] 

archives = "2020-12" 

author = "高云龙" 

summary = "PostgreSQL与openGauss之数据类型"

img = "/zh/post/gaoyunlong/title/title1.png" 

times = "18:00"

+++

# PostgreSQL与openGauss之数据类型<a name="ZH-CN_TOPIC_0000001070670275"></a>

openGauss是基于PostgreSQL 9.2.4 内核版本开发的，且openGauss的兼容性很强，包括兼容oracle、mysql、tidb及PostgreSQL,如果习惯了PostgreSQL的用法再来维护openGauss数据库，在日常维护使用过程中经常会出现不支持或者语法错误，现在整理一下两个数据库常用数据类型的差异，可快速在PostgreSQL 和 openGauss 两个数据库之间进行切换，减少出错的概率。

数据库对比版本如下：

-   PostgreSQL版本 12.2
-   openGauss 版本 1.0.1

## 数字类型<a name="section12747627142013"></a>

<a name="table62281647101210"></a>
<table><thead align="left"><tr id="row2022924721218"><th class="cellrowborder" valign="top" width="20%" id="mcps1.1.6.1.1">&nbsp;&nbsp;</th>
<th class="cellrowborder" valign="top" width="15.260000000000002%" id="mcps1.1.6.1.2"><p id="p152307479127"><a name="p152307479127"></a><a name="p152307479127"></a>PostgreSQL</p>
</th>
<th class="cellrowborder" valign="top" width="18.22%" id="mcps1.1.6.1.3"><p id="p923044712124"><a name="p923044712124"></a><a name="p923044712124"></a>openGauss</p>
</th>
<th class="cellrowborder" valign="top" width="19.97%" id="mcps1.1.6.1.4"><p id="p172304474120"><a name="p172304474120"></a><a name="p172304474120"></a>存储尺寸</p>
</th>
<th class="cellrowborder" valign="top" width="26.55%" id="mcps1.1.6.1.5"><p id="p723019473129"><a name="p723019473129"></a><a name="p723019473129"></a>备注</p>
</th>
</tr>
</thead>
<tbody><tr id="row923064711128"><td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.1 "><p id="p864066265"><a name="p864066265"></a><a name="p864066265"></a>tinyint</p>
</td>
<td class="cellrowborder" valign="top" width="15.260000000000002%" headers="mcps1.1.6.1.2 "><p id="p136402061466"><a name="p136402061466"></a><a name="p136402061466"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="18.22%" headers="mcps1.1.6.1.3 "><p id="p156401960610"><a name="p156401960610"></a><a name="p156401960610"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="19.97%" headers="mcps1.1.6.1.4 "><p id="p76401617614"><a name="p76401617614"></a><a name="p76401617614"></a>1字节</p>
</td>
<td class="cellrowborder" valign="top" width="26.55%" headers="mcps1.1.6.1.5 "><p id="p464086364"><a name="p464086364"></a><a name="p464086364"></a>0 ～ 255</p>
</td>
</tr>
<tr id="row22314477124"><td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.1 "><p id="p17640561968"><a name="p17640561968"></a><a name="p17640561968"></a>smallint</p>
</td>
<td class="cellrowborder" valign="top" width="15.260000000000002%" headers="mcps1.1.6.1.2 "><p id="p06417615616"><a name="p06417615616"></a><a name="p06417615616"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.22%" headers="mcps1.1.6.1.3 "><p id="p106411061360"><a name="p106411061360"></a><a name="p106411061360"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="19.97%" headers="mcps1.1.6.1.4 "><p id="p56411860618"><a name="p56411860618"></a><a name="p56411860618"></a>2字节</p>
</td>
<td class="cellrowborder" valign="top" width="26.55%" headers="mcps1.1.6.1.5 "><p id="p176413611610"><a name="p176413611610"></a><a name="p176413611610"></a>-32,768 ~ +32,767</p>
</td>
</tr>
<tr id="row823244712123"><td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.1 "><p id="p3641161065"><a name="p3641161065"></a><a name="p3641161065"></a>integer</p>
</td>
<td class="cellrowborder" valign="top" width="15.260000000000002%" headers="mcps1.1.6.1.2 "><p id="p564220619617"><a name="p564220619617"></a><a name="p564220619617"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.22%" headers="mcps1.1.6.1.3 "><p id="p1164276265"><a name="p1164276265"></a><a name="p1164276265"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="19.97%" headers="mcps1.1.6.1.4 "><p id="p8642060614"><a name="p8642060614"></a><a name="p8642060614"></a>4字节</p>
</td>
<td class="cellrowborder" valign="top" width="26.55%" headers="mcps1.1.6.1.5 "><p id="p156422613612"><a name="p156422613612"></a><a name="p156422613612"></a>-2,147,483,648 ~ +2,147,483,647</p>
</td>
</tr>
<tr id="row1023264715126"><td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.1 "><p id="p19642769618"><a name="p19642769618"></a><a name="p19642769618"></a>binary_integer</p>
</td>
<td class="cellrowborder" valign="top" width="15.260000000000002%" headers="mcps1.1.6.1.2 ">&nbsp;&nbsp;</td>
<td class="cellrowborder" valign="top" width="18.22%" headers="mcps1.1.6.1.3 "><p id="p464256764"><a name="p464256764"></a><a name="p464256764"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="19.97%" headers="mcps1.1.6.1.4 "><p id="p106424614617"><a name="p106424614617"></a><a name="p106424614617"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="26.55%" headers="mcps1.1.6.1.5 "><p id="p11643106863"><a name="p11643106863"></a><a name="p11643106863"></a>integer别名</p>
</td>
</tr>
<tr id="row9233104718126"><td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.1 "><p id="p96431761662"><a name="p96431761662"></a><a name="p96431761662"></a>bigint</p>
</td>
<td class="cellrowborder" valign="top" width="15.260000000000002%" headers="mcps1.1.6.1.2 "><p id="p26431561161"><a name="p26431561161"></a><a name="p26431561161"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.22%" headers="mcps1.1.6.1.3 "><p id="p2643156561"><a name="p2643156561"></a><a name="p2643156561"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="19.97%" headers="mcps1.1.6.1.4 "><p id="p964314618620"><a name="p964314618620"></a><a name="p964314618620"></a>8字节</p>
</td>
<td class="cellrowborder" valign="top" width="26.55%" headers="mcps1.1.6.1.5 "><p id="p56431061165"><a name="p56431061165"></a><a name="p56431061165"></a>-9,223,372,036,854,775,808 ~ +9,223,372,036,854,775,807</p>
</td>
</tr>
<tr id="row1923494771216"><td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.1 "><p id="p664486966"><a name="p664486966"></a><a name="p664486966"></a>decimal[(p[,s])]</p>
</td>
<td class="cellrowborder" valign="top" width="15.260000000000002%" headers="mcps1.1.6.1.2 "><p id="p11644861369"><a name="p11644861369"></a><a name="p11644861369"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.22%" headers="mcps1.1.6.1.3 "><p id="p16644560611"><a name="p16644560611"></a><a name="p16644560611"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="19.97%" headers="mcps1.1.6.1.4 "><p id="p3644161464"><a name="p3644161464"></a><a name="p3644161464"></a>可变字节</p>
</td>
<td class="cellrowborder" valign="top" width="26.55%" headers="mcps1.1.6.1.5 "><p id="p46441161862"><a name="p46441161862"></a><a name="p46441161862"></a>最高小数点前131072位，以及小数点后16383位</p>
</td>
</tr>
<tr id="row5234947161218"><td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.1 "><p id="p13644146963"><a name="p13644146963"></a><a name="p13644146963"></a>numeric[(p[,s])]</p>
</td>
<td class="cellrowborder" valign="top" width="15.260000000000002%" headers="mcps1.1.6.1.2 "><p id="p56445618614"><a name="p56445618614"></a><a name="p56445618614"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.22%" headers="mcps1.1.6.1.3 "><p id="p6644368618"><a name="p6644368618"></a><a name="p6644368618"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="19.97%" headers="mcps1.1.6.1.4 "><p id="p146451166613"><a name="p146451166613"></a><a name="p146451166613"></a>可变字节</p>
</td>
<td class="cellrowborder" valign="top" width="26.55%" headers="mcps1.1.6.1.5 "><p id="p96451661163"><a name="p96451661163"></a><a name="p96451661163"></a>最高小数点前131072位，以及小数点后16383位</p>
</td>
</tr>
<tr id="row3679358181217"><td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.1 "><p id="p196457615619"><a name="p196457615619"></a><a name="p196457615619"></a>number[(p[,s])]</p>
</td>
<td class="cellrowborder" valign="top" width="15.260000000000002%" headers="mcps1.1.6.1.2 "><p id="p36453610616"><a name="p36453610616"></a><a name="p36453610616"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="18.22%" headers="mcps1.1.6.1.3 "><p id="p1864519614612"><a name="p1864519614612"></a><a name="p1864519614612"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="19.97%" headers="mcps1.1.6.1.4 "><p id="p46452618617"><a name="p46452618617"></a><a name="p46452618617"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="26.55%" headers="mcps1.1.6.1.5 "><p id="p126451761163"><a name="p126451761163"></a><a name="p126451761163"></a>numeric别名</p>
</td>
</tr>
<tr id="row3682125881218"><td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.1 "><p id="p1764516612615"><a name="p1764516612615"></a><a name="p1764516612615"></a>real</p>
</td>
<td class="cellrowborder" valign="top" width="15.260000000000002%" headers="mcps1.1.6.1.2 "><p id="p2645116360"><a name="p2645116360"></a><a name="p2645116360"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.22%" headers="mcps1.1.6.1.3 "><p id="p36456618615"><a name="p36456618615"></a><a name="p36456618615"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="19.97%" headers="mcps1.1.6.1.4 "><p id="p964556166"><a name="p964556166"></a><a name="p964556166"></a>4字节</p>
</td>
<td class="cellrowborder" valign="top" width="26.55%" headers="mcps1.1.6.1.5 "><p id="p14646166761"><a name="p14646166761"></a><a name="p14646166761"></a>6位十进制数字精度</p>
</td>
</tr>
<tr id="row18685175817126"><td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.1 "><p id="p176461361062"><a name="p176461361062"></a><a name="p176461361062"></a>float4</p>
</td>
<td class="cellrowborder" valign="top" width="15.260000000000002%" headers="mcps1.1.6.1.2 "><p id="p9646261164"><a name="p9646261164"></a><a name="p9646261164"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="18.22%" headers="mcps1.1.6.1.3 "><p id="p186461461767"><a name="p186461461767"></a><a name="p186461461767"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="19.97%" headers="mcps1.1.6.1.4 "><p id="p19646136268"><a name="p19646136268"></a><a name="p19646136268"></a>4字节</p>
</td>
<td class="cellrowborder" valign="top" width="26.55%" headers="mcps1.1.6.1.5 "><p id="p0647186067"><a name="p0647186067"></a><a name="p0647186067"></a>6位十进制数字精度</p>
</td>
</tr>
<tr id="row0686858141213"><td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.1 "><p id="p9647261263"><a name="p9647261263"></a><a name="p9647261263"></a>double precision</p>
</td>
<td class="cellrowborder" valign="top" width="15.260000000000002%" headers="mcps1.1.6.1.2 "><p id="p86479616616"><a name="p86479616616"></a><a name="p86479616616"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.22%" headers="mcps1.1.6.1.3 "><p id="p1664714612611"><a name="p1664714612611"></a><a name="p1664714612611"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="19.97%" headers="mcps1.1.6.1.4 "><p id="p106473613618"><a name="p106473613618"></a><a name="p106473613618"></a>8字节</p>
</td>
<td class="cellrowborder" valign="top" width="26.55%" headers="mcps1.1.6.1.5 "><p id="p186474611615"><a name="p186474611615"></a><a name="p186474611615"></a>15位十进制数字精度</p>
</td>
</tr>
<tr id="row068745817120"><td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.1 "><p id="p5648961864"><a name="p5648961864"></a><a name="p5648961864"></a>binary_double</p>
</td>
<td class="cellrowborder" valign="top" width="15.260000000000002%" headers="mcps1.1.6.1.2 "><p id="p464815613616"><a name="p464815613616"></a><a name="p464815613616"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="18.22%" headers="mcps1.1.6.1.3 "><p id="p1364896669"><a name="p1364896669"></a><a name="p1364896669"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="19.97%" headers="mcps1.1.6.1.4 "><p id="p1164856961"><a name="p1164856961"></a><a name="p1164856961"></a>8字节</p>
</td>
<td class="cellrowborder" valign="top" width="26.55%" headers="mcps1.1.6.1.5 "><p id="p15648161266"><a name="p15648161266"></a><a name="p15648161266"></a>double precision别名</p>
</td>
</tr>
<tr id="row1268811588128"><td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.1 "><p id="p1264806465"><a name="p1264806465"></a><a name="p1264806465"></a>float8</p>
</td>
<td class="cellrowborder" valign="top" width="15.260000000000002%" headers="mcps1.1.6.1.2 "><p id="p2648196163"><a name="p2648196163"></a><a name="p2648196163"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="18.22%" headers="mcps1.1.6.1.3 "><p id="p86482061861"><a name="p86482061861"></a><a name="p86482061861"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="19.97%" headers="mcps1.1.6.1.4 "><p id="p106491468614"><a name="p106491468614"></a><a name="p106491468614"></a>8字节</p>
</td>
<td class="cellrowborder" valign="top" width="26.55%" headers="mcps1.1.6.1.5 "><p id="p126491161666"><a name="p126491161666"></a><a name="p126491161666"></a>15位十进制数字精度</p>
</td>
</tr>
<tr id="row2068845871214"><td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.1 "><p id="p206491661462"><a name="p206491661462"></a><a name="p206491661462"></a>float[(p )]</p>
</td>
<td class="cellrowborder" valign="top" width="15.260000000000002%" headers="mcps1.1.6.1.2 "><p id="p4649561368"><a name="p4649561368"></a><a name="p4649561368"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="18.22%" headers="mcps1.1.6.1.3 "><p id="p66491562613"><a name="p66491562613"></a><a name="p66491562613"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="19.97%" headers="mcps1.1.6.1.4 "><p id="p96498619610"><a name="p96498619610"></a><a name="p96498619610"></a>4字节或8字节</p>
</td>
<td class="cellrowborder" valign="top" width="26.55%" headers="mcps1.1.6.1.5 "><p id="p164917620618"><a name="p164917620618"></a><a name="p164917620618"></a>-</p>
</td>
</tr>
<tr id="row211514121314"><td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.1 "><p id="p865066966"><a name="p865066966"></a><a name="p865066966"></a>dec[(p,[s])]</p>
</td>
<td class="cellrowborder" valign="top" width="15.260000000000002%" headers="mcps1.1.6.1.2 "><p id="p8650561612"><a name="p8650561612"></a><a name="p8650561612"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="18.22%" headers="mcps1.1.6.1.3 "><p id="p4650146869"><a name="p4650146869"></a><a name="p4650146869"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="19.97%" headers="mcps1.1.6.1.4 "><p id="p1465018619617"><a name="p1465018619617"></a><a name="p1465018619617"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="26.55%" headers="mcps1.1.6.1.5 "><p id="p206501066619"><a name="p206501066619"></a><a name="p206501066619"></a>最高小数点前131072位，以及小数点后16383位</p>
</td>
</tr>
<tr id="row201291431313"><td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.1 "><p id="p18650146663"><a name="p18650146663"></a><a name="p18650146663"></a>integer[(p,[s])]</p>
</td>
<td class="cellrowborder" valign="top" width="15.260000000000002%" headers="mcps1.1.6.1.2 "><p id="p136501763611"><a name="p136501763611"></a><a name="p136501763611"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="18.22%" headers="mcps1.1.6.1.3 "><p id="p46511561610"><a name="p46511561610"></a><a name="p46511561610"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="19.97%" headers="mcps1.1.6.1.4 "><p id="p19651766616"><a name="p19651766616"></a><a name="p19651766616"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="26.55%" headers="mcps1.1.6.1.5 "><p id="p196511169620"><a name="p196511169620"></a><a name="p196511169620"></a>最高小数点前131072位，以及小数点后16383位</p>
</td>
</tr>
<tr id="row161313149134"><td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.1 "><p id="p7651261366"><a name="p7651261366"></a><a name="p7651261366"></a>smallserial</p>
</td>
<td class="cellrowborder" valign="top" width="15.260000000000002%" headers="mcps1.1.6.1.2 "><p id="p56511668612"><a name="p56511668612"></a><a name="p56511668612"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.22%" headers="mcps1.1.6.1.3 "><p id="p176521668613"><a name="p176521668613"></a><a name="p176521668613"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="19.97%" headers="mcps1.1.6.1.4 "><p id="p15652146862"><a name="p15652146862"></a><a name="p15652146862"></a>2字节</p>
</td>
<td class="cellrowborder" valign="top" width="26.55%" headers="mcps1.1.6.1.5 "><p id="p465256861"><a name="p465256861"></a><a name="p465256861"></a>1 ~ 32,767</p>
</td>
</tr>
<tr id="row913181441313"><td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.1 "><p id="p206521961269"><a name="p206521961269"></a><a name="p206521961269"></a>serial</p>
</td>
<td class="cellrowborder" valign="top" width="15.260000000000002%" headers="mcps1.1.6.1.2 "><p id="p14652161864"><a name="p14652161864"></a><a name="p14652161864"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.22%" headers="mcps1.1.6.1.3 "><p id="p4652569614"><a name="p4652569614"></a><a name="p4652569614"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="19.97%" headers="mcps1.1.6.1.4 "><p id="p136528619615"><a name="p136528619615"></a><a name="p136528619615"></a>4字节</p>
</td>
<td class="cellrowborder" valign="top" width="26.55%" headers="mcps1.1.6.1.5 "><p id="p96521265612"><a name="p96521265612"></a><a name="p96521265612"></a>1 ~ 2,147,483,647</p>
</td>
</tr>
<tr id="row3151314141310"><td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.1 "><p id="p76523612619"><a name="p76523612619"></a><a name="p76523612619"></a>bigserial</p>
</td>
<td class="cellrowborder" valign="top" width="15.260000000000002%" headers="mcps1.1.6.1.2 "><p id="p0652161567"><a name="p0652161567"></a><a name="p0652161567"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.22%" headers="mcps1.1.6.1.3 "><p id="p1865286666"><a name="p1865286666"></a><a name="p1865286666"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="19.97%" headers="mcps1.1.6.1.4 "><p id="p86537616615"><a name="p86537616615"></a><a name="p86537616615"></a>8字节</p>
</td>
<td class="cellrowborder" valign="top" width="26.55%" headers="mcps1.1.6.1.5 "><p id="p9653146864"><a name="p9653146864"></a><a name="p9653146864"></a>1 ~ 9,223,372,036,854,775,807</p>
</td>
</tr>
</tbody>
</table>

## 字符类型<a name="section11860205110218"></a>

<a name="table83761136313"></a>
<table><thead align="left"><tr id="row10376153935"><th class="cellrowborder" valign="top" width="20.05%" id="mcps1.1.6.1.1">&nbsp;&nbsp;</th>
<th class="cellrowborder" valign="top" width="17.44%" id="mcps1.1.6.1.2"><p id="p2377123334"><a name="p2377123334"></a><a name="p2377123334"></a>PostgreSQL</p>
</th>
<th class="cellrowborder" valign="top" width="16.74%" id="mcps1.1.6.1.3"><p id="p173772031832"><a name="p173772031832"></a><a name="p173772031832"></a>openGauss</p>
</th>
<th class="cellrowborder" valign="top" width="18.4%" id="mcps1.1.6.1.4"><p id="p1437711314319"><a name="p1437711314319"></a><a name="p1437711314319"></a>存储尺寸</p>
</th>
<th class="cellrowborder" valign="top" width="27.37%" id="mcps1.1.6.1.5"><p id="p18377153631"><a name="p18377153631"></a><a name="p18377153631"></a>备注</p>
</th>
</tr>
</thead>
<tbody><tr id="row163771531312"><td class="cellrowborder" valign="top" width="20.05%" headers="mcps1.1.6.1.1 "><p id="p24394562319"><a name="p24394562319"></a><a name="p24394562319"></a>char(n)</p>
</td>
<td class="cellrowborder" valign="top" width="17.44%" headers="mcps1.1.6.1.2 "><p id="p13439256834"><a name="p13439256834"></a><a name="p13439256834"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="16.74%" headers="mcps1.1.6.1.3 "><p id="p143920561315"><a name="p143920561315"></a><a name="p143920561315"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.4%" headers="mcps1.1.6.1.4 "><p id="p3439165610318"><a name="p3439165610318"></a><a name="p3439165610318"></a>pg中最大为1GB，og中最大为10MB</p>
</td>
<td class="cellrowborder" valign="top" width="27.37%" headers="mcps1.1.6.1.5 "><p id="p16439056537"><a name="p16439056537"></a><a name="p16439056537"></a>pg中n指字符数量，og中n指字节数量</p>
</td>
</tr>
<tr id="row53811235311"><td class="cellrowborder" valign="top" width="20.05%" headers="mcps1.1.6.1.1 "><p id="p54399561637"><a name="p54399561637"></a><a name="p54399561637"></a>nchar(n)</p>
</td>
<td class="cellrowborder" valign="top" width="17.44%" headers="mcps1.1.6.1.2 "><p id="p64398561132"><a name="p64398561132"></a><a name="p64398561132"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="16.74%" headers="mcps1.1.6.1.3 "><p id="p164390561039"><a name="p164390561039"></a><a name="p164390561039"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.4%" headers="mcps1.1.6.1.4 "><p id="p1343915561531"><a name="p1343915561531"></a><a name="p1343915561531"></a>最大为10MB</p>
</td>
<td class="cellrowborder" valign="top" width="27.37%" headers="mcps1.1.6.1.5 "><p id="p11440135614313"><a name="p11440135614313"></a><a name="p11440135614313"></a>n指字节数量</p>
</td>
</tr>
<tr id="row438216318310"><td class="cellrowborder" valign="top" width="20.05%" headers="mcps1.1.6.1.1 "><p id="p144095611314"><a name="p144095611314"></a><a name="p144095611314"></a>varchar(n)</p>
</td>
<td class="cellrowborder" valign="top" width="17.44%" headers="mcps1.1.6.1.2 "><p id="p644095610312"><a name="p644095610312"></a><a name="p644095610312"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="16.74%" headers="mcps1.1.6.1.3 "><p id="p744075618316"><a name="p744075618316"></a><a name="p744075618316"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.4%" headers="mcps1.1.6.1.4 "><p id="p744015562319"><a name="p744015562319"></a><a name="p744015562319"></a>pg中最大为1GB，og中最大为10MB</p>
</td>
<td class="cellrowborder" valign="top" width="27.37%" headers="mcps1.1.6.1.5 "><p id="p1744020560312"><a name="p1744020560312"></a><a name="p1744020560312"></a>pg中n指字符数量，og中n指字节数量</p>
</td>
</tr>
<tr id="row53831531139"><td class="cellrowborder" valign="top" width="20.05%" headers="mcps1.1.6.1.1 "><p id="p1944045617318"><a name="p1944045617318"></a><a name="p1944045617318"></a>varchar2(n)</p>
</td>
<td class="cellrowborder" valign="top" width="17.44%" headers="mcps1.1.6.1.2 "><p id="p134413561834"><a name="p134413561834"></a><a name="p134413561834"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="16.74%" headers="mcps1.1.6.1.3 "><p id="p94413561832"><a name="p94413561832"></a><a name="p94413561832"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.4%" headers="mcps1.1.6.1.4 "><p id="p9441656935"><a name="p9441656935"></a><a name="p9441656935"></a>最大为10MB</p>
</td>
<td class="cellrowborder" valign="top" width="27.37%" headers="mcps1.1.6.1.5 "><p id="p1244117561536"><a name="p1244117561536"></a><a name="p1244117561536"></a>varchar(n)别名</p>
</td>
</tr>
<tr id="row3384736318"><td class="cellrowborder" valign="top" width="20.05%" headers="mcps1.1.6.1.1 "><p id="p6441165618311"><a name="p6441165618311"></a><a name="p6441165618311"></a>nvarchar2(n)</p>
</td>
<td class="cellrowborder" valign="top" width="17.44%" headers="mcps1.1.6.1.2 "><p id="p194410569311"><a name="p194410569311"></a><a name="p194410569311"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="16.74%" headers="mcps1.1.6.1.3 "><p id="p1544113562031"><a name="p1544113562031"></a><a name="p1544113562031"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.4%" headers="mcps1.1.6.1.4 "><p id="p194428561436"><a name="p194428561436"></a><a name="p194428561436"></a>最大为10MB</p>
</td>
<td class="cellrowborder" valign="top" width="27.37%" headers="mcps1.1.6.1.5 "><p id="p16442135610320"><a name="p16442135610320"></a><a name="p16442135610320"></a>n指字符数量</p>
</td>
</tr>
<tr id="row113851834315"><td class="cellrowborder" valign="top" width="20.05%" headers="mcps1.1.6.1.1 "><p id="p38319411448"><a name="p38319411448"></a><a name="p38319411448"></a>text</p>
</td>
<td class="cellrowborder" valign="top" width="17.44%" headers="mcps1.1.6.1.2 "><p id="p158318414412"><a name="p158318414412"></a><a name="p158318414412"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="16.74%" headers="mcps1.1.6.1.3 "><p id="p2083641149"><a name="p2083641149"></a><a name="p2083641149"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.4%" headers="mcps1.1.6.1.4 "><p id="p68314412413"><a name="p68314412413"></a><a name="p68314412413"></a>1GB - 1</p>
</td>
<td class="cellrowborder" valign="top" width="27.37%" headers="mcps1.1.6.1.5 "><p id="p1084134110410"><a name="p1084134110410"></a><a name="p1084134110410"></a>-</p>
</td>
</tr>
<tr id="row738593539"><td class="cellrowborder" valign="top" width="20.05%" headers="mcps1.1.6.1.1 "><p id="p68411411444"><a name="p68411411444"></a><a name="p68411411444"></a>clob</p>
</td>
<td class="cellrowborder" valign="top" width="17.44%" headers="mcps1.1.6.1.2 "><p id="p198464111412"><a name="p198464111412"></a><a name="p198464111412"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="16.74%" headers="mcps1.1.6.1.3 "><p id="p284541442"><a name="p284541442"></a><a name="p284541442"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.4%" headers="mcps1.1.6.1.4 "><p id="p198494112417"><a name="p198494112417"></a><a name="p198494112417"></a>1GB - 1</p>
</td>
<td class="cellrowborder" valign="top" width="27.37%" headers="mcps1.1.6.1.5 "><p id="p384341342"><a name="p384341342"></a><a name="p384341342"></a>text别名</p>
</td>
</tr>
</tbody>
</table>

## 时间日期类型<a name="section198401744195811"></a>

<a name="table1369118537584"></a>
<table><thead align="left"><tr id="row3692125314585"><th class="cellrowborder" valign="top" width="20.05%" id="mcps1.1.6.1.1">&nbsp;&nbsp;</th>
<th class="cellrowborder" valign="top" width="17.44%" id="mcps1.1.6.1.2"><p id="p196925538583"><a name="p196925538583"></a><a name="p196925538583"></a>PostgreSQL</p>
</th>
<th class="cellrowborder" valign="top" width="16.74%" id="mcps1.1.6.1.3"><p id="p17692105335811"><a name="p17692105335811"></a><a name="p17692105335811"></a>openGauss</p>
</th>
<th class="cellrowborder" valign="top" width="18.4%" id="mcps1.1.6.1.4"><p id="p166921653155818"><a name="p166921653155818"></a><a name="p166921653155818"></a>存储尺寸</p>
</th>
<th class="cellrowborder" valign="top" width="27.37%" id="mcps1.1.6.1.5"><p id="p18692175311582"><a name="p18692175311582"></a><a name="p18692175311582"></a>备注</p>
</th>
</tr>
</thead>
<tbody><tr id="row1569316536589"><td class="cellrowborder" valign="top" width="20.05%" headers="mcps1.1.6.1.1 "><p id="p205787430593"><a name="p205787430593"></a><a name="p205787430593"></a>timestamp[(p )][without time zone]</p>
</td>
<td class="cellrowborder" valign="top" width="17.44%" headers="mcps1.1.6.1.2 "><p id="p1857854325910"><a name="p1857854325910"></a><a name="p1857854325910"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="16.74%" headers="mcps1.1.6.1.3 "><p id="p165781043145919"><a name="p165781043145919"></a><a name="p165781043145919"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.4%" headers="mcps1.1.6.1.4 "><p id="p125781543105914"><a name="p125781543105914"></a><a name="p125781543105914"></a>8字节</p>
</td>
<td class="cellrowborder" valign="top" width="27.37%" headers="mcps1.1.6.1.5 "><p id="p105789431592"><a name="p105789431592"></a><a name="p105789431592"></a>4713 BC - 294276 AD</p>
</td>
</tr>
<tr id="row1069320530585"><td class="cellrowborder" valign="top" width="20.05%" headers="mcps1.1.6.1.1 "><p id="p105792043185913"><a name="p105792043185913"></a><a name="p105792043185913"></a>timestamp[(p )][with time zone]</p>
</td>
<td class="cellrowborder" valign="top" width="17.44%" headers="mcps1.1.6.1.2 "><p id="p1457934325912"><a name="p1457934325912"></a><a name="p1457934325912"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="16.74%" headers="mcps1.1.6.1.3 "><p id="p1557911435594"><a name="p1557911435594"></a><a name="p1557911435594"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.4%" headers="mcps1.1.6.1.4 "><p id="p19579104317595"><a name="p19579104317595"></a><a name="p19579104317595"></a>8字节</p>
</td>
<td class="cellrowborder" valign="top" width="27.37%" headers="mcps1.1.6.1.5 "><p id="p4579174375915"><a name="p4579174375915"></a><a name="p4579174375915"></a>4713 BC - 294276 AD</p>
</td>
</tr>
<tr id="row123015195911"><td class="cellrowborder" valign="top" width="20.05%" headers="mcps1.1.6.1.1 "><p id="p8579114325919"><a name="p8579114325919"></a><a name="p8579114325919"></a>date</p>
</td>
<td class="cellrowborder" valign="top" width="17.44%" headers="mcps1.1.6.1.2 "><p id="p7579943165911"><a name="p7579943165911"></a><a name="p7579943165911"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="16.74%" headers="mcps1.1.6.1.3 "><p id="p757918430592"><a name="p757918430592"></a><a name="p757918430592"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.4%" headers="mcps1.1.6.1.4 "><p id="p857934311593"><a name="p857934311593"></a><a name="p857934311593"></a>4字节</p>
</td>
<td class="cellrowborder" valign="top" width="27.37%" headers="mcps1.1.6.1.5 "><p id="p1957934365918"><a name="p1957934365918"></a><a name="p1957934365918"></a>4713 BC - 5874897 AD (og实际存储空间大小为8字节)</p>
</td>
</tr>
<tr id="row163141135919"><td class="cellrowborder" valign="top" width="20.05%" headers="mcps1.1.6.1.1 "><p id="p15791143185910"><a name="p15791143185910"></a><a name="p15791143185910"></a>time[(p )][without time zone]</p>
</td>
<td class="cellrowborder" valign="top" width="17.44%" headers="mcps1.1.6.1.2 "><p id="p158074395920"><a name="p158074395920"></a><a name="p158074395920"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="16.74%" headers="mcps1.1.6.1.3 "><p id="p1580114316598"><a name="p1580114316598"></a><a name="p1580114316598"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.4%" headers="mcps1.1.6.1.4 "><p id="p125801443115912"><a name="p125801443115912"></a><a name="p125801443115912"></a>8字节</p>
</td>
<td class="cellrowborder" valign="top" width="27.37%" headers="mcps1.1.6.1.5 "><p id="p35801143175915"><a name="p35801143175915"></a><a name="p35801143175915"></a>00:00:00 - 24:00:00</p>
</td>
</tr>
<tr id="row14684162114597"><td class="cellrowborder" valign="top" width="20.05%" headers="mcps1.1.6.1.1 "><p id="p10580134315594"><a name="p10580134315594"></a><a name="p10580134315594"></a>time[(p )][with time zone]</p>
</td>
<td class="cellrowborder" valign="top" width="17.44%" headers="mcps1.1.6.1.2 "><p id="p10580543145914"><a name="p10580543145914"></a><a name="p10580543145914"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="16.74%" headers="mcps1.1.6.1.3 "><p id="p1558113432596"><a name="p1558113432596"></a><a name="p1558113432596"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.4%" headers="mcps1.1.6.1.4 "><p id="p45816439598"><a name="p45816439598"></a><a name="p45816439598"></a>12字节</p>
</td>
<td class="cellrowborder" valign="top" width="27.37%" headers="mcps1.1.6.1.5 "><p id="p1358144320599"><a name="p1358144320599"></a><a name="p1358144320599"></a>00:00:00+1459 - 24:00:00-1459</p>
</td>
</tr>
<tr id="row86851213592"><td class="cellrowborder" valign="top" width="20.05%" headers="mcps1.1.6.1.1 "><p id="p12581164385918"><a name="p12581164385918"></a><a name="p12581164385918"></a>interval[fields][(p )]</p>
</td>
<td class="cellrowborder" valign="top" width="17.44%" headers="mcps1.1.6.1.2 "><p id="p20581144315592"><a name="p20581144315592"></a><a name="p20581144315592"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="16.74%" headers="mcps1.1.6.1.3 "><p id="p958164319592"><a name="p958164319592"></a><a name="p958164319592"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.4%" headers="mcps1.1.6.1.4 "><p id="p1958104314595"><a name="p1958104314595"></a><a name="p1958104314595"></a>16字节</p>
</td>
<td class="cellrowborder" valign="top" width="27.37%" headers="mcps1.1.6.1.5 "><p id="p4581154365914"><a name="p4581154365914"></a><a name="p4581154365914"></a>-178000000年 - 178000000年</p>
</td>
</tr>
<tr id="row166851221115915"><td class="cellrowborder" valign="top" width="20.05%" headers="mcps1.1.6.1.1 "><p id="p9365526404"><a name="p9365526404"></a><a name="p9365526404"></a>smalldatetime</p>
</td>
<td class="cellrowborder" valign="top" width="17.44%" headers="mcps1.1.6.1.2 ">&nbsp;&nbsp;</td>
<td class="cellrowborder" valign="top" width="16.74%" headers="mcps1.1.6.1.3 "><p id="p19365182614010"><a name="p19365182614010"></a><a name="p19365182614010"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.4%" headers="mcps1.1.6.1.4 "><p id="p113665261603"><a name="p113665261603"></a><a name="p113665261603"></a>8字节</p>
</td>
<td class="cellrowborder" valign="top" width="27.37%" headers="mcps1.1.6.1.5 "><p id="p1836618266017"><a name="p1836618266017"></a><a name="p1836618266017"></a>日期和时间，不带时区,精确到分钟，秒位大于等于30秒进一位</p>
</td>
</tr>
<tr id="row168642175917"><td class="cellrowborder" valign="top" width="20.05%" headers="mcps1.1.6.1.1 "><p id="p56865218599"><a name="p56865218599"></a><a name="p56865218599"></a>interval day(1) to second(p )</p>
</td>
<td class="cellrowborder" valign="top" width="17.44%" headers="mcps1.1.6.1.2 ">&nbsp;&nbsp;</td>
<td class="cellrowborder" valign="top" width="16.74%" headers="mcps1.1.6.1.3 "><p id="p15465591514"><a name="p15465591514"></a><a name="p15465591514"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.4%" headers="mcps1.1.6.1.4 "><p id="p746515912113"><a name="p746515912113"></a><a name="p746515912113"></a>16字节</p>
</td>
<td class="cellrowborder" valign="top" width="27.37%" headers="mcps1.1.6.1.5 "><p id="p76872021155915"><a name="p76872021155915"></a><a name="p76872021155915"></a>-</p>
</td>
</tr>
<tr id="row236415288597"><td class="cellrowborder" valign="top" width="20.05%" headers="mcps1.1.6.1.1 "><p id="p163651928105912"><a name="p163651928105912"></a><a name="p163651928105912"></a>reltime</p>
</td>
<td class="cellrowborder" valign="top" width="17.44%" headers="mcps1.1.6.1.2 ">&nbsp;&nbsp;</td>
<td class="cellrowborder" valign="top" width="16.74%" headers="mcps1.1.6.1.3 "><p id="p647653918119"><a name="p647653918119"></a><a name="p647653918119"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="18.4%" headers="mcps1.1.6.1.4 "><p id="p1747673911117"><a name="p1747673911117"></a><a name="p1747673911117"></a>4字节</p>
</td>
<td class="cellrowborder" valign="top" width="27.37%" headers="mcps1.1.6.1.5 "><p id="p1236572816596"><a name="p1236572816596"></a><a name="p1236572816596"></a>-</p>
</td>
</tr>
</tbody>
</table>

## json类型<a name="section13327856165514"></a>

<a name="table286853175514"></a>
<table><thead align="left"><tr id="row1869153120556"><th class="cellrowborder" valign="top" width="20.05%" id="mcps1.1.6.1.1">&nbsp;&nbsp;</th>
<th class="cellrowborder" valign="top" width="19.950000000000003%" id="mcps1.1.6.1.2"><p id="p14869203195517"><a name="p14869203195517"></a><a name="p14869203195517"></a>PostgreSQL</p>
</th>
<th class="cellrowborder" valign="top" width="20%" id="mcps1.1.6.1.3"><p id="p11870143195512"><a name="p11870143195512"></a><a name="p11870143195512"></a>openGauss</p>
</th>
<th class="cellrowborder" valign="top" width="20%" id="mcps1.1.6.1.4"><p id="p13870123111559"><a name="p13870123111559"></a><a name="p13870123111559"></a>存储尺寸</p>
</th>
<th class="cellrowborder" valign="top" width="20%" id="mcps1.1.6.1.5"><p id="p987083125516"><a name="p987083125516"></a><a name="p987083125516"></a>备注</p>
</th>
</tr>
</thead>
<tbody><tr id="row287020317558"><td class="cellrowborder" valign="top" width="20.05%" headers="mcps1.1.6.1.1 "><p id="p165852495565"><a name="p165852495565"></a><a name="p165852495565"></a>json</p>
</td>
<td class="cellrowborder" valign="top" width="19.950000000000003%" headers="mcps1.1.6.1.2 "><p id="p858511495565"><a name="p858511495565"></a><a name="p858511495565"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.3 "><p id="p7586164915615"><a name="p7586164915615"></a><a name="p7586164915615"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.4 "><p id="p423433811568"><a name="p423433811568"></a><a name="p423433811568"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.5 "><p id="p18230738125615"><a name="p18230738125615"></a><a name="p18230738125615"></a>-</p>
</td>
</tr>
<tr id="row57671013195612"><td class="cellrowborder" valign="top" width="20.05%" headers="mcps1.1.6.1.1 "><p id="p290419575"><a name="p290419575"></a><a name="p290419575"></a>jsonb</p>
</td>
<td class="cellrowborder" valign="top" width="19.950000000000003%" headers="mcps1.1.6.1.2 "><p id="p179091125719"><a name="p179091125719"></a><a name="p179091125719"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.3 "><p id="p16221183810565"><a name="p16221183810565"></a><a name="p16221183810565"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.4 "><p id="p92180387569"><a name="p92180387569"></a><a name="p92180387569"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.5 "><p id="p13215538105611"><a name="p13215538105611"></a><a name="p13215538105611"></a>-</p>
</td>
</tr>
</tbody>
</table>

## 货币类型<a name="section7479155214515"></a>

<a name="table134023175523"></a>
<table><thead align="left"><tr id="row1440321725214"><th class="cellrowborder" valign="top" width="20.05%" id="mcps1.1.6.1.1">&nbsp;&nbsp;</th>
<th class="cellrowborder" valign="top" width="19.950000000000003%" id="mcps1.1.6.1.2"><p id="p13404517145218"><a name="p13404517145218"></a><a name="p13404517145218"></a>PostgreSQL</p>
</th>
<th class="cellrowborder" valign="top" width="20%" id="mcps1.1.6.1.3"><p id="p3404917135212"><a name="p3404917135212"></a><a name="p3404917135212"></a>openGauss</p>
</th>
<th class="cellrowborder" valign="top" width="20%" id="mcps1.1.6.1.4"><p id="p540412177520"><a name="p540412177520"></a><a name="p540412177520"></a>存储尺寸</p>
</th>
<th class="cellrowborder" valign="top" width="20%" id="mcps1.1.6.1.5"><p id="p164041617195218"><a name="p164041617195218"></a><a name="p164041617195218"></a>备注</p>
</th>
</tr>
</thead>
<tbody><tr id="row64041917115219"><td class="cellrowborder" valign="top" width="20.05%" headers="mcps1.1.6.1.1 "><p id="p12969105685211"><a name="p12969105685211"></a><a name="p12969105685211"></a>money</p>
</td>
<td class="cellrowborder" valign="top" width="19.950000000000003%" headers="mcps1.1.6.1.2 "><p id="p39691156125212"><a name="p39691156125212"></a><a name="p39691156125212"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.3 "><p id="p11969165625211"><a name="p11969165625211"></a><a name="p11969165625211"></a>支持</p>
</td>
<td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.4 "><p id="p6969656135212"><a name="p6969656135212"></a><a name="p6969656135212"></a>8字节</p>
</td>
<td class="cellrowborder" valign="top" width="20%" headers="mcps1.1.6.1.5 "><p id="p840431711528"><a name="p840431711528"></a><a name="p840431711528"></a>-92233720368547758.08到+92233720368547758.07</p>
</td>
</tr>
</tbody>
</table>

