+++

title = "openGauss升级指导书" 

date = "2021-03-09" 

tags = ["openGauss升级指导书"] 

archives = "2021-03" 

author = "shine" 

summary = "openGauss升级指导书"

img = "/zh/post/shine/title/img28.png" 

times = "15:40"

+++

# 前  言<a name="ZH-CN_TOPIC_0305491363"></a>

## 概述<a name="section1881820588012"></a>

本文档详细的描述了版本升级、回滚流程、以及具体的操作指导，同时提供了常见的问题解答及故障处理方法。

## 读者对象<a name="section188237588014"></a>

本文档主要适用于升级的操作人员。操作人员必须具备以下经验和技能：

-   熟悉当前网络的组网和相关网元的版本信息。
-   有该设备维护经验，熟悉设备的操作维护方式。


# 升级前必读<a name="ZH-CN_TOPIC_0305491437"></a>


## 升级方案<a name="ZH-CN_TOPIC_0305491360"></a>

本节为指导用户选择升级方式。

用户根据openGauss提供的新特性和数据库现状，确定是否对现有系统进行升级。

当前支持的升级模式为就地升级和灰度升级。升级方式的策略又分为大版本升级和小版本升级。

用户挑选升级方式后，系统会自动判断并选择合适的升级策略。

就地升级：升级期间需停止业务进行，一次性升级所有节点。

灰度升级：灰度升级支持全业务操作，也是一次性升级所有节点。\(openGauss1.1.0版本之后的版本支持该功能\)

## 升级前的版本要求（升级路径）<a name="ZH-CN_TOPIC_0305491359"></a>

openGauss升级版本要求如[表1](#table7961729)所示。

**表 1**  升级前的版本要求（升级路径）

<a name="table7961729"></a>

<table><tbody><tr id="row48398424"><td class="cellrowborder" valign="top" width="41.410000000000004%"><p id="p27958252"><a name="p27958252"></a><a name="p27958252"></a>版本</p>
</td>
<td class="cellrowborder" valign="top" width="58.589999999999996%"><p id="p50025933"><a name="p50025933"></a><a name="p50025933"></a>升级说明</p>
</td>
</tr>
<tr id="row5917164"><td class="cellrowborder" valign="top" width="41.410000000000004%"><p id="p138378421424"><a name="p138378421424"></a><a name="p138378421424"></a>openGauss1.0.1版本之前的版本</p>
</td>
<td class="cellrowborder" valign="top" width="58.589999999999996%"><p id="p33594135"><a name="p33594135"></a><a name="p33594135"></a>可以升级到openGauss1.0.1之前的任意版本</p>
</td>
</tr>
<tr id="row1699043202811"><td class="cellrowborder" valign="top" width="41.410000000000004%"><p id="p16990230282"><a name="p16990230282"></a><a name="p16990230282"></a>openGauss1.0.1版本</p>
</td>
<td class="cellrowborder" valign="top" width="58.589999999999996%"><p id="p89903322814"><a name="p89903322814"></a><a name="p89903322814"></a>可以升级到openGauss1.1.0版本</p>
</td>
</tr>
<tr id="row10729745336"><td class="cellrowborder" valign="top" width="41.410000000000004%"><p id="p473019455316"><a name="p473019455316"></a><a name="p473019455316"></a>openGauss1.1.0版本之后的版本</p>
</td>
<td class="cellrowborder" valign="top" width="58.589999999999996%"><p id="p207301045037"><a name="p207301045037"></a><a name="p207301045037"></a>可以升级到openGauss1.1.0之后的任意版本</p>
</td>
</tr>
</tbody>
</table>



>![](public_sys-resources/icon-note.gif) **说明：** 
>升级前版本，可以通过执行如下工具查看。
>
>```
>gsql -V | --version
>```

## 升级影响和升级约束<a name="ZH-CN_TOPIC_0305491361"></a>

升级过程需要注意以下事项。

-   升级操作不能和扩容、缩容同时执行。
-   不支持虚拟IP。
-   升级过程中，不允许对wal\_level，max\_connections，max\_prepared\_transactions，max\_locks\_per\_transaction这四个GUC参数的值进行修改。如果修改，会导致回滚后实例启动异常。
-   建议在数据库系统空闲情况下进行升级，尽量避开业务繁忙的时间段（可按照经验判断，如节假日等）。
-   升级前尽可能保证数据库正常。可以通过gs\_om -t status查询，查询结果的cluster\_state为Normal代表数据库正常。
-   升级前保证数据库互信正常，可以在任意节点上，通过ssh hostname命令，连接另外一个节点进行验证。如果各机器间互连不用输入密码，说明互信正常（通常数据库状态正常时，互信一般都是正常的）。
-   升级前后，数据库的部署方式（配置文件）不能发生变化。升级前会对部署方式进行校验，如果改变，会报错。
-   升级前要保证操作系统处于健康状态，通过gs\_checkos工具可以完成操作系统状态检查。
-   就地升级需要停止业务，灰度升级支持全业务操作。
-   数据库运行正常且主DN的数据完全同步到备DN。
-   升级过程中不允许打开kerberos开关。
-   请不要修改安装包中解压出来的version.cfg文件。
-   如果升级过程中出现异常导致升级失败，需用户手动回滚，并且必须回滚成功后才能进行下一次升级。
-   如果升级回滚成功后，再次升级成功，未提交阶段设置的GUC参数将失效。
-   执行升级的过程中请不要手动设置GUC参数。
-   灰度升级中，升级的时候都会产生不超过10s的业务中断
-   升级过程中，必须保持内核版本与om版本一致才可执行om操作。这里的一致是指，内核代码和om代码都来自同一个软件包。如果执行了升级包的前置脚本却没有升级，或者升级回滚后没有执行基线包的前置脚本，就会造成内核代码和om代码的不一致。
-   升级过程中如果系统表新增了字段，升级后通过**\\d**命令将查看不到这些新增的字段。此时通过**select**命令可以查到这些新增的字段。
-   升级需要guc参数enable\_stream\_replication=on，该参数为off时不允许升级。
-   灰度升级中，业务并发要小于200并发读加200并发写的情况。
-   若在openGauss2.0.0之前的版本中使用了MOT表，则不支持升级到openGauss2.0.0版本。

# # 升级<a name="ZH-CN_TOPIC_0305491357"></a>


## 升级流程<a name="ZH-CN_TOPIC_0305491444"></a>

本章介绍升级到该版本的主要升级过程。

**图 1**  升级流程图<a name="fig1492165721411"></a>  
<img src="../figures/升级流程图.png" title="升级流程图" style="zoom: 25%;" />

>![](public_sys-resources/icon-note.gif) **说明：** 
>本文档中描述的时间仅供参考，实际操作时间以现场情况为准。

**表 1**  升级流程执行效率估计

<a name="toc218487219"></a>
<table><thead align="left"><tr id="row39004066"><th class="cellrowborder" valign="top" width="25.477452254774523%" id="mcps1.2.6.1.1"><p id="p5212777"><a name="p5212777"></a><a name="p5212777"></a>步骤</p>
</th>
<th class="cellrowborder" valign="top" width="16.95830416958304%" id="mcps1.2.6.1.2"><p id="p19581784"><a name="p19581784"></a><a name="p19581784"></a>建议起始时间</p>
</th>
<th class="cellrowborder" valign="top" width="24.937506249375062%" id="mcps1.2.6.1.3"><p id="p42620696"><a name="p42620696"></a><a name="p42620696"></a>耗时（天/小时/分钟）</p>
</th>
<th class="cellrowborder" valign="top" width="19.408059194080593%" id="mcps1.2.6.1.4"><p id="p2555950173311"><a name="p2555950173311"></a><a name="p2555950173311"></a>业务中断时长</p>
</th>
<th class="cellrowborder" valign="top" width="13.218678132186781%" id="mcps1.2.6.1.5"><p id="p29724369"><a name="p29724369"></a><a name="p29724369"></a>备注</p>
</th>
</tr>
</thead>
<tbody><tr id="row11609170133510"><td class="cellrowborder" valign="top" width="25.477452254774523%" headers="mcps1.2.6.1.1 "><p id="p760372118397"><a name="p760372118397"></a><a name="p760372118397"></a>升级前准备与检查</p>
</td>
<td class="cellrowborder" valign="top" width="16.95830416958304%" headers="mcps1.2.6.1.2 "><p id="p1377213012205"><a name="p1377213012205"></a><a name="p1377213012205"></a>升级操作前一天</p>
</td>
<td class="cellrowborder" valign="top" width="24.937506249375062%" headers="mcps1.2.6.1.3 "><p id="p1772193042017"><a name="p1772193042017"></a><a name="p1772193042017"></a>约2～3小时。</p>
</td>
<td class="cellrowborder" valign="top" width="19.408059194080593%" headers="mcps1.2.6.1.4 "><p id="p1846295453213"><a name="p1846295453213"></a><a name="p1846295453213"></a>对业务无影响。</p>
</td>
<td class="cellrowborder" valign="top" width="13.218678132186781%" headers="mcps1.2.6.1.5 "><p id="zh-cn_topic_0059783606_p40357438145645"><a name="zh-cn_topic_0059783606_p40357438145645"></a><a name="zh-cn_topic_0059783606_p40357438145645"></a>升级前检查和备份数据、校验软件包等操作。</p>
</td>
</tr>
<tr id="row1335165713413"><td class="cellrowborder" valign="top" width="25.477452254774523%" headers="mcps1.2.6.1.1 "><p id="p5668190164016"><a name="p5668190164016"></a><a name="p5668190164016"></a>升级操作</p>
</td>
<td class="cellrowborder" valign="top" width="16.95830416958304%" headers="mcps1.2.6.1.2 "><p id="p7772163012012"><a name="p7772163012012"></a><a name="p7772163012012"></a>业务空闲期</p>
</td>
<td class="cellrowborder" valign="top" width="24.937506249375062%" headers="mcps1.2.6.1.3 "><p id="p3772163015202"><a name="p3772163015202"></a><a name="p3772163015202"></a>耗时主要集中在数据库的启动和停止以及每个database的系统表修改处。升级操作耗时一般不会超过30分钟。</p>
</td>
<td class="cellrowborder" valign="top" width="19.408059194080593%" headers="mcps1.2.6.1.4 "><p id="p1946215493216"><a name="p1946215493216"></a><a name="p1946215493216"></a>与操作时长一致，一般不会超过30分钟。</p>
</td>
<td class="cellrowborder" valign="top" width="13.218678132186781%" headers="mcps1.2.6.1.5 "><p id="zh-cn_topic_0059783606_p7684821145645"><a name="zh-cn_topic_0059783606_p7684821145645"></a><a name="zh-cn_topic_0059783606_p7684821145645"></a>依据指导书开始升级。</p>
</td>
</tr>
<tr id="row786055223420"><td class="cellrowborder" valign="top" width="25.477452254774523%" headers="mcps1.2.6.1.1 "><p id="p744624011202"><a name="p744624011202"></a><a name="p744624011202"></a>升级验证</p>
</td>
<td class="cellrowborder" valign="top" width="16.95830416958304%" headers="mcps1.2.6.1.2 "><p id="p187730309208"><a name="p187730309208"></a><a name="p187730309208"></a>业务空闲期</p>
</td>
<td class="cellrowborder" valign="top" width="24.937506249375062%" headers="mcps1.2.6.1.3 "><p id="p7773163020208"><a name="p7773163020208"></a><a name="p7773163020208"></a>约30分钟。</p>
</td>
<td class="cellrowborder" valign="top" width="19.408059194080593%" headers="mcps1.2.6.1.4 "><p id="p134621754163213"><a name="p134621754163213"></a><a name="p134621754163213"></a>与操作时长一致，约30分钟。</p>
</td>
<td class="cellrowborder" valign="top" width="13.218678132186781%" headers="mcps1.2.6.1.5 "><p id="p1388215313512"><a name="p1388215313512"></a><a name="p1388215313512"></a>-</p>
</td>
</tr>
<tr id="row1657334683411"><td class="cellrowborder" valign="top" width="25.477452254774523%" headers="mcps1.2.6.1.1 "><p id="zh-cn_topic_0059783606_p32199356145645"><a name="zh-cn_topic_0059783606_p32199356145645"></a><a name="zh-cn_topic_0059783606_p32199356145645"></a>提交升级</p>
</td>
<td class="cellrowborder" valign="top" width="16.95830416958304%" headers="mcps1.2.6.1.2 "><p id="p1077323018209"><a name="p1077323018209"></a><a name="p1077323018209"></a>业务空闲期</p>
</td>
<td class="cellrowborder" valign="top" width="24.937506249375062%" headers="mcps1.2.6.1.3 "><p id="p67739300203"><a name="p67739300203"></a><a name="p67739300203"></a>提交升级耗时一般不超过10分钟。</p>
</td>
<td class="cellrowborder" valign="top" width="19.408059194080593%" headers="mcps1.2.6.1.4 "><p id="p1246216544325"><a name="p1246216544325"></a><a name="p1246216544325"></a>与操作时长一致，一般不超过10分钟。</p>
</td>
<td class="cellrowborder" valign="top" width="13.218678132186781%" headers="mcps1.2.6.1.5 "><p id="p1877303017202"><a name="p1877303017202"></a><a name="p1877303017202"></a>-</p>
</td>
</tr>
<tr id="row198573237207"><td class="cellrowborder" valign="top" width="25.477452254774523%" headers="mcps1.2.6.1.1 "><p id="zh-cn_topic_0059783606_p56729805145645"><a name="zh-cn_topic_0059783606_p56729805145645"></a><a name="zh-cn_topic_0059783606_p56729805145645"></a>升级版本回滚</p>
</td>
<td class="cellrowborder" valign="top" width="16.95830416958304%" headers="mcps1.2.6.1.2 "><p id="p177731930112014"><a name="p177731930112014"></a><a name="p177731930112014"></a>业务空闲期</p>
</td>
<td class="cellrowborder" valign="top" width="24.937506249375062%" headers="mcps1.2.6.1.3 "><p id="p577333052014"><a name="p577333052014"></a><a name="p577333052014"></a>版本回滚耗时一般不会超过30分钟。</p>
</td>
<td class="cellrowborder" valign="top" width="19.408059194080593%" headers="mcps1.2.6.1.4 "><p id="p8463195443215"><a name="p8463195443215"></a><a name="p8463195443215"></a>与操作时长一致，一般不会超过30分钟。</p>
</td>
<td class="cellrowborder" valign="top" width="13.218678132186781%" headers="mcps1.2.6.1.5 "><p id="zh-cn_topic_0059783606_p46680835145645"><a name="zh-cn_topic_0059783606_p46680835145645"></a><a name="zh-cn_topic_0059783606_p46680835145645"></a>-</p>
</td>
</tr>
</tbody>
</table>




## 升级前准备与检查<a name="ZH-CN_TOPIC_0305491450"></a>


### 升级前准备与检查清单<a name="ZH-CN_TOPIC_0305491442"></a>

**表 1**  升级前准备清单

<a name="toc218487220"></a>

<table><tbody><tr id="row32107897"><td class="cellrowborder" valign="top" width="6.29%"><p id="p09921330173014"><a name="p09921330173014"></a><a name="p09921330173014"></a>序号</p>
</td>
<td class="cellrowborder" valign="top" width="21.42%"><p id="p9992930193018"><a name="p9992930193018"></a><a name="p9992930193018"></a>升级准备项目项目</p>
</td>
<td class="cellrowborder" valign="top" width="32.29%"><p id="p999253013304"><a name="p999253013304"></a><a name="p999253013304"></a>准备内容</p>
</td>
<td class="cellrowborder" valign="top" width="20%"><p id="p199233017302"><a name="p199233017302"></a><a name="p199233017302"></a>建议起始时间</p>
</td>
<td class="cellrowborder" valign="top" width="20%"><p id="p39921430143016"><a name="p39921430143016"></a><a name="p39921430143016"></a>耗时（天/小时/分钟）</p>
</td>
</tr>
<tr id="row49544030"><td class="cellrowborder" valign="top" width="6.29%"><p id="p17992330193012"><a name="p17992330193012"></a><a name="p17992330193012"></a>1</p>
</td>
<td class="cellrowborder" valign="top" width="21.42%"><p id="p599243013301"><a name="p599243013301"></a><a name="p599243013301"></a>收集节点信息</p>
</td>
<td class="cellrowborder" valign="top" width="32.29%"><p id="p1799215303302"><a name="p1799215303302"></a><a name="p1799215303302"></a>收集到数据库涉及节点的名称、IP地址，root、omm用户密码等环境信息。</p>
</td>
<td class="cellrowborder" valign="top" width="20%"><p id="p899353023018"><a name="p899353023018"></a><a name="p899353023018"></a>升级前一天</p>
</td>
<td class="cellrowborder" valign="top" width="20%"><p id="p39931530173020"><a name="p39931530173020"></a><a name="p39931530173020"></a>1小时</p>
</td>
</tr>
<tr id="row48569804"><td class="cellrowborder" valign="top" width="6.29%"><p id="p193771747164311"><a name="p193771747164311"></a><a name="p193771747164311"></a>2</p>
</td>
<td class="cellrowborder" valign="top" width="21.42%"><p id="p13453193594318"><a name="p13453193594318"></a><a name="p13453193594318"></a>设置root用户远程登录</p>
</td>
<td class="cellrowborder" valign="top" width="32.29%"><p id="p12454193511439"><a name="p12454193511439"></a><a name="p12454193511439"></a>设置配置文件，允许root用户远程登录。</p>
</td>
<td class="cellrowborder" valign="top" width="20%"><p id="p1580510489499"><a name="p1580510489499"></a><a name="p1580510489499"></a>升级前一天</p>
</td>
<td class="cellrowborder" valign="top" width="20%"><p id="p1080634812491"><a name="p1080634812491"></a><a name="p1080634812491"></a>2小时</p>
</td>
</tr>
<tr id="row10345152973019"><td class="cellrowborder" valign="top" width="6.29%"><p id="p7377194712436"><a name="p7377194712436"></a><a name="p7377194712436"></a>3</p>
</td>
<td class="cellrowborder" valign="top" width="21.42%"><p id="p8993153053014"><a name="p8993153053014"></a><a name="p8993153053014"></a>备份数据</p>
</td>
<td class="cellrowborder" valign="top" width="32.29%"><p id="p189939306304"><a name="p189939306304"></a><a name="p189939306304"></a>参考《管理员指南》中的“备份与恢复”章节进行。</p>
</td>
<td class="cellrowborder" valign="top" width="20%"><p id="p17993143018306"><a name="p17993143018306"></a><a name="p17993143018306"></a>升级前一天</p>
</td>
<td class="cellrowborder" valign="top" width="20%"><p id="p79931230123014"><a name="p79931230123014"></a><a name="p79931230123014"></a>备份数据量和方案不同，耗时也不同</p>
</td>
</tr>
<tr id="row1360191311596"><td class="cellrowborder" valign="top" width="6.29%"><p id="p1061292910599"><a name="p1061292910599"></a><a name="p1061292910599"></a>4</p>
</td>
<td class="cellrowborder" valign="top" width="21.42%"><p id="p19668321165913"><a name="p19668321165913"></a><a name="p19668321165913"></a>获取并校验升级包</p>
</td>
<td class="cellrowborder" valign="top" width="32.29%"><p id="p13668182145913"><a name="p13668182145913"></a><a name="p13668182145913"></a>获取升级软件包，进行完整性校验。</p>
</td>
<td class="cellrowborder" valign="top" width="20%"><p id="p166816214595"><a name="p166816214595"></a><a name="p166816214595"></a>升级前一天</p>
</td>
<td class="cellrowborder" valign="top" width="20%"><p id="p11669221115916"><a name="p11669221115916"></a><a name="p11669221115916"></a>0.5小时</p>
</td>
</tr>
<tr id="row12711526143011"><td class="cellrowborder" valign="top" width="6.29%"><p id="p961292910598"><a name="p961292910598"></a><a name="p961292910598"></a>5</p>
</td>
<td class="cellrowborder" valign="top" width="21.42%"><p id="p799383019308"><a name="p799383019308"></a><a name="p799383019308"></a>健康检查</p>
</td>
<td class="cellrowborder" valign="top" width="32.29%"><p id="p299312304302"><a name="p299312304302"></a><a name="p299312304302"></a>使用gs_checkos工具完成操作系统状态检查。</p>
</td>
<td class="cellrowborder" valign="top" width="20%"><p id="p6993193013309"><a name="p6993193013309"></a><a name="p6993193013309"></a>升级前一天</p>
</td>
<td class="cellrowborder" valign="top" width="20%"><p id="p399433083016"><a name="p399433083016"></a><a name="p399433083016"></a>0.5小时</p>
</td>
</tr>
<tr id="row2049422216308"><td class="cellrowborder" valign="top" width="6.29%"><p id="p6612102995913"><a name="p6612102995913"></a><a name="p6612102995913"></a>6</p>
</td>
<td class="cellrowborder" valign="top" width="21.42%"><p id="p999473010306"><a name="p999473010306"></a><a name="p999473010306"></a>检查数据库节点磁盘使用率</p>
</td>
<td class="cellrowborder" valign="top" width="32.29%"><p id="p699412308302"><a name="p699412308302"></a><a name="p699412308302"></a>使用df命令查看磁盘使用率。</p>
</td>
<td class="cellrowborder" valign="top" width="20%"><p id="p1199414300302"><a name="p1199414300302"></a><a name="p1199414300302"></a>升级前一天</p>
</td>
<td class="cellrowborder" valign="top" width="20%"><p id="p99941830113013"><a name="p99941830113013"></a><a name="p99941830113013"></a>0.5小时</p>
</td>
</tr>
<tr id="row13252584"><td class="cellrowborder" valign="top" width="6.29%"><p id="p29464423430"><a name="p29464423430"></a><a name="p29464423430"></a>7</p>
</td>
<td class="cellrowborder" valign="top" width="21.42%"><p id="p1267316503111"><a name="p1267316503111"></a><a name="p1267316503111"></a>检查数据库状态</p>
</td>
<td class="cellrowborder" valign="top" width="32.29%"><p id="p1367145173117"><a name="p1367145173117"></a><a name="p1367145173117"></a>使用gs_om工具完成数据库状态检查。</p>
</td>
<td class="cellrowborder" valign="top" width="20%"><p id="p91307043217"><a name="p91307043217"></a><a name="p91307043217"></a>升级前一天</p>
</td>
<td class="cellrowborder" valign="top" width="20%"><p id="p121309023213"><a name="p121309023213"></a><a name="p121309023213"></a>0.5小时</p>
</td>
</tr>
</tbody>
</table>


>![](public_sys-resources/icon-note.gif) **说明：** 
>“耗时”依不同环境（包括现场数据量、服务器性能等原因）会存在一定差异。

### 收集节点信息<a name="ZH-CN_TOPIC_0305491433"></a>

联系数据库系统管理员，获取数据库涉及节点的节点名称、节点IP地址。节点的root、omm用户密码等环境信息。如[表1](#toc218487220)。

**表 1**  节点信息

<a name="toc218487220"></a>
<table><thead align="left"><tr id="row32107897"><th class="cellrowborder" valign="top" width="6.34%" id="mcps1.2.7.1.1"><p id="p50602835"><a name="p50602835"></a><a name="p50602835"></a>序号</p>
</th>
<th class="cellrowborder" valign="top" width="15.18%" id="mcps1.2.7.1.2"><p id="p5188953"><a name="p5188953"></a><a name="p5188953"></a>节点名称</p>
</th>
<th class="cellrowborder" valign="top" width="34.72%" id="mcps1.2.7.1.3"><p id="p17652085"><a name="p17652085"></a><a name="p17652085"></a>节点IP</p>
</th>
<th class="cellrowborder" valign="top" width="18.12%" id="mcps1.2.7.1.4"><p id="p52539912"><a name="p52539912"></a><a name="p52539912"></a>root用户密码</p>
</th>
<th class="cellrowborder" valign="top" width="18.12%" id="mcps1.2.7.1.5"><p id="p27874513"><a name="p27874513"></a><a name="p27874513"></a>omm用户密码</p>
</th>
<th class="cellrowborder" valign="top" width="7.5200000000000005%" id="mcps1.2.7.1.6"><p id="p1635924414169"><a name="p1635924414169"></a><a name="p1635924414169"></a>备注</p>
</th>
</tr>
</thead>
<tbody><tr id="row49544030"><td class="cellrowborder" valign="top" width="6.34%" headers="mcps1.2.7.1.1 "><p id="p53643460"><a name="p53643460"></a><a name="p53643460"></a>1</p>
</td>
<td class="cellrowborder" valign="top" width="15.18%" headers="mcps1.2.7.1.2 "><p id="p50153003"><a name="p50153003"></a><a name="p50153003"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="34.72%" headers="mcps1.2.7.1.3 "><p id="p35861434"><a name="p35861434"></a><a name="p35861434"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="18.12%" headers="mcps1.2.7.1.4 "><p id="p3196531"><a name="p3196531"></a><a name="p3196531"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="18.12%" headers="mcps1.2.7.1.5 "><p id="p57592428"><a name="p57592428"></a><a name="p57592428"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="7.5200000000000005%" headers="mcps1.2.7.1.6 "><p id="p3359114421610"><a name="p3359114421610"></a><a name="p3359114421610"></a>-</p>
</td>
</tr>
</tbody>
</table>

### 备份数据<a name="ZH-CN_TOPIC_0305491448"></a>

升级一旦失败，有可能会影响到业务的正常开展。提前备份数据，就可以在风险发生后，尽快的恢复业务。

请参考《管理员指南》中的“备份与恢复”章节，完成数据的备份。

### 获取升级包<a name="ZH-CN_TOPIC_0305491428"></a>

https://opengauss.org/zh/download.html 在该网站获取想要升级的升级包。

### 健康检查<a name="ZH-CN_TOPIC_0305491441"></a>

通过gs\_checkos工具可以完成操作系统状态检查。

#### 前提条件<a name="section16375145913200"></a>

-   当前的硬件和网络环境正常。
-   各主机间root互信状态正常。
-   只能使用root用户执行gs\_checkos命令。

#### 操作步骤<a name="section1990781914214"></a>

1.  以root用户身份登录服务器。
2.  执行如下命令对服务器的OS参数进行检查。

    ```
    gs_checkos -i A
    ```

    检查服务器的OS参数的目的是为了保证数据库正常通过预安装，并且在安装成功后可以安全高效的运行。详细的检查项目请参见《工具参考》中的“服务端工具 \> gs\_checkos”工具的“表1 操作系统检查项”。


### 检查数据库节点磁盘使用率<a name="ZH-CN_TOPIC_0305491447"></a>

建议数据库节点磁盘使用率低于80%时再执行升级操作。

### 检查数据库状态<a name="ZH-CN_TOPIC_0305491426"></a>

本节介绍数据库状态查询的具体操作。

#### 验证步骤<a name="section117172026191017"></a>

1.  以数据库用户（如omm）登录节点，source环境变量。
2.  执行如下命令查看数据库状态。

    ```
    gs_om -t status
    ```

3.  保证数据库状态正常。

## 升级操作

介绍就地升级和灰度升级的详细操作。

#### 操作步骤<a name="section17506731105516"></a>

1.  以root身份登录节点。
2.  创建新包目录。

    ```
    mkdir -p /opt/software/gaussdb_upgrade
    ```

3.  将需要更新的新包上传至目录“/opt/software/gaussdb\_upgrade”并解压。
4.  进入安装包解压出的script目录下:

    ```
    cd /opt/software/gaussdb_upgrade/script
    ```

5.  在就地升级或灰度升级前执行前置脚本gs\_preinstall。

    ```
    ./gs_preinstall -U omm -G dbgrp  -X /opt/software/GaussDB_Kernel/clusterconfig.xml
    ```

6.  切换至omm用户。

    ```
    su - omm
    ```

7.  数据库状态正常时，使用如下命令进行就地升级或者灰度升级。

    示例一：使用gs\_upgradectl脚本执行就地升级。

    ```
    gs_upgradectl -t auto-upgrade -X /opt/software/GaussDB_Kernel/clusterconfig.xml
    ```

    示例二：使用gs\_upgradectl脚本执行灰度升级。

    ```
    gs_upgradectl -t auto-upgrade -X /opt/software/GaussDB_Kernel/clusterconfig.xml --grey
    ```


## 升级验证<a name="ZH-CN_TOPIC_0305491432"></a>

本章介绍升级完成后的验证操作。给出验证的用例和详细操作步骤。


### 验证项目的检查表<a name="ZH-CN_TOPIC_0305491358"></a>

**表 1**  验证项目的检查表

<a name="toc218487221"></a>

<table><tbody><tr id="row35302572"><td class="cellrowborder" valign="top" width="11.219999999999999%"><p id="p40936059"><a name="p40936059"></a><a name="p40936059"></a>序号</p>
</td>
<td class="cellrowborder" valign="top" width="20.41%"><p id="p27486471"><a name="p27486471"></a><a name="p27486471"></a>验证项目</p>
</td>
<td class="cellrowborder" valign="top" width="48.980000000000004%"><p id="p11811639"><a name="p11811639"></a><a name="p11811639"></a>检查标准</p>
</td>
<td class="cellrowborder" valign="top" width="19.39%"><p id="p17218675"><a name="p17218675"></a><a name="p17218675"></a>检查结果</p>
</td>
</tr>
<tr id="row20750354"><td class="cellrowborder" valign="top" width="11.219999999999999%"><p id="p3057100"><a name="p3057100"></a><a name="p3057100"></a>1</p>
</td>
<td class="cellrowborder" valign="top" width="20.41%"><p id="p530184212110"><a name="p530184212110"></a><a name="p530184212110"></a>版本查询</p>
</td>
<td class="cellrowborder" valign="top" width="48.980000000000004%"><p id="p83018421413"><a name="p83018421413"></a><a name="p83018421413"></a>查询升级后版本是否正确</p>
</td>
<td class="cellrowborder" valign="top" width="19.39%"><p id="p30183838"><a name="p30183838"></a><a name="p30183838"></a>-</p>
</td>
</tr>
<tr id="row3219094"><td class="cellrowborder" valign="top" width="11.219999999999999%"><p id="p59420070"><a name="p59420070"></a><a name="p59420070"></a>2</p>
</td>
<td class="cellrowborder" valign="top" width="20.41%"><p id="p43016423117"><a name="p43016423117"></a><a name="p43016423117"></a>健康检查</p>
</td>
<td class="cellrowborder" valign="top" width="48.980000000000004%"><p id="p1680714524343"><a name="p1680714524343"></a><a name="p1680714524343"></a>使用gs_checkos工具完成操作系统状态检查。</p>
</td>
<td class="cellrowborder" valign="top" width="19.39%"><p id="p51381840"><a name="p51381840"></a><a name="p51381840"></a>-</p>
</td>
</tr>
<tr id="row59783377"><td class="cellrowborder" valign="top" width="11.219999999999999%"><p id="p10615408"><a name="p10615408"></a><a name="p10615408"></a>3</p>
</td>
<td class="cellrowborder" valign="top" width="20.41%"><p id="p54541752"><a name="p54541752"></a><a name="p54541752"></a>数据库状态</p>
</td>
<td class="cellrowborder" valign="top" width="48.980000000000004%"><p id="p345815107386"><a name="p345815107386"></a><a name="p345815107386"></a>使用gs_om工具完成数据库状态检查。</p>
</td>
<td class="cellrowborder" valign="top" width="19.39%"><p id="p23973984"><a name="p23973984"></a><a name="p23973984"></a>-</p>
</td>
</tr>
</tbody>
</table>

### 升级版本查询<a name="ZH-CN_TOPIC_0305491429"></a>

本节介绍版本查询的具体操作。

#### 验证步骤<a name="section117172026191017"></a>

1.  以数据库用户（如omm）登录节点，source环境变量。
2.  执行如下命令查看所有节点的版本信息。

    ```
    gs_ssh -c "gsql -V"
    ```


### 检查升级数据库状态<a name="ZH-CN_TOPIC_0305491435"></a>

本节介绍数据库状态查询的具体操作。

#### 验证步骤<a name="section117172026191017"></a>

1.  以数据库用户（如omm）登录节点。
2.  执行如下命令查看数据库状态。

    ```
    gs_om -t status
    ```

    查询结果的cluster\_state为Normal代表数据库正常。


## 提交升级<a name="ZH-CN_TOPIC_0305491456"></a>

升级完成后，如果验证也没问题。接下来就可以提交升级。

>![](public_sys-resources/icon-note.gif) **说明：** 
>一旦提交操作完成，则不能再执行回滚操作。

#### 操作步骤<a name="section779219132168"></a>

1.  以数据库用户（如omm）登录节点。
2.  执行如下命令完成升级提交。

    ```
    gs_upgradectl -t commit-upgrade  -X /opt/software/GaussDB_Kernel/clusterconfig.xml
    ```


## 升级版本回滚<a name="ZH-CN_TOPIC_0305491438"></a>

本章介绍版本回滚方法。

#### 操作步骤<a name="section779219132168"></a>

1.  以数据库用户（如omm）登录节点。
2.  执行如下命令完成版本回滚（回滚内核代码）。回滚完成，如果需要保持内核和om代码的版本一致，可以执行一下旧包的前置命令（参见[执行前置脚本gs\_preinstall。](#升级操作)）。

    ```
    gs_upgradectl -t auto-rollback  -X /opt/software/GaussDB_Kernel/clusterconfig.xml
    ```

    >![](public_sys-resources/icon-note.gif) **说明：** 
    >-   如果数据库异常，需要强制回滚，可以使用如下命令。
    >    ```
    >    gs_upgradectl -t auto-rollback -X /opt/software/GaussDB_Kernel/clusterconfig.xml   --force
    >    ```

3.  查看回滚之后的版本号。

    ```
    gs_om -V | --version
    ```


# 异常处理<a name="ZH-CN_TOPIC_0305491443"></a>

如果升级失败，请按照如下方式进行处理：

1.  排查是否有环境问题。

    如磁盘满、网络故障等，或者升级包、升级版本号是否正确。排除问题后，可以尝试重入升级。

2.  如果没有发现环境问题，或者重入升级失败，需要收集相关日志，找技术支持工程师定位。

    收集日志命令：

    **gs\_collector --begin-time=**'_20200724 00:00_'  **--end-time=**'_20200725 00:00_'

    如果条件允许，建议保留环境。
