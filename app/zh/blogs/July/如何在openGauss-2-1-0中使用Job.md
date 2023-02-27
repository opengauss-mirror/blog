---
title: '如何在openGauss 2.1.0中使用Job'

date: '2021-10-31'

category: 'blog'
tags: ['如何在openGauss 2.1.0中使用Job']

archives: '2021-10'

author: '刘旭'

summary: '如何在openGauss 2.1.0中使用Job'

img: '/zh/blogs/July/title/img11.png'

times: '12:30'
---

# 如何在 openGauss 2.1.0 中使用 Job<a name="ZH-CN_TOPIC_0000001219296195"></a>

## 如何在 openGauss 2.1.0 中使用 Job<a name="section7578185116363"></a>

Job 类似 unix 中的 crontab,有定时执行的功能，可以在指定的时间点或每天的某个时间点等自行执行任务。在各类系统使用运行过程中，经常会遇到需要定时完成的任务，比如定时更新数据，定时统计数据生成报表等等，这些工作都可以使用 Job 来完成。在 openGauss 2.1.0 中，提供了以下接口来实现管理 Job：

## 接口描述<a name="section1390026193714"></a>

<a name="table6179162218368"></a>

<table><thead ><tr id="row1447318229366"><th class="cellrowborder"  width="50%" id="mcps1.1.3.1.1"><p id="p19473192219366"><a name="p19473192219366"></a><a name="p19473192219366"></a>接口名称</p>
</th>
<th class="cellrowborder"  width="50%" id="mcps1.1.3.1.2"><p id="p12473222153617"><a name="p12473222153617"></a><a name="p12473222153617"></a>描述</p>
</th>
</tr>
</thead>
<tbody><tr id="row3473142263611"><td class="cellrowborder"  width="50%" headers="mcps1.1.3.1.1 "><p id="p10473102218366"><a name="p10473102218366"></a><a name="p10473102218366"></a>PKG_SERVICE.JOB_CANCEL</p>
</td>
<td class="cellrowborder"  width="50%" headers="mcps1.1.3.1.2 "><p id="p154735221365"><a name="p154735221365"></a><a name="p154735221365"></a>通过任务ID来删除定时任务。</p>
</td>
</tr>
<tr id="row114736225369"><td class="cellrowborder"  width="50%" headers="mcps1.1.3.1.1 "><p id="p547312214364"><a name="p547312214364"></a><a name="p547312214364"></a>PKG_SERVICE.JOB_FINISH</p>
</td>
<td class="cellrowborder"  width="50%" headers="mcps1.1.3.1.2 "><p id="p34737228361"><a name="p34737228361"></a><a name="p34737228361"></a>禁用或者启用定时任务。</p>
</td>
</tr>
<tr id="row447382214365"><td class="cellrowborder"  width="50%" headers="mcps1.1.3.1.1 "><p id="p10473122103616"><a name="p10473122103616"></a><a name="p10473122103616"></a>PKG_SERVICE.JOB_SUBMIT</p>
</td>
<td class="cellrowborder"  width="50%" headers="mcps1.1.3.1.2 "><p id="p547312224368"><a name="p547312224368"></a><a name="p547312224368"></a>提交一个定时任务。作业号由系统自动生成或由用户指定。</p>
</td>
</tr>
<tr id="row84731722143619"><td class="cellrowborder"  width="50%" headers="mcps1.1.3.1.1 "><p id="p174731622173611"><a name="p174731622173611"></a><a name="p174731622173611"></a>PKG_SERVICE.JOB_UPDATE</p>
</td>
<td class="cellrowborder"  width="50%" headers="mcps1.1.3.1.2 "><p id="p10473122219361"><a name="p10473122219361"></a><a name="p10473122219361"></a>修改定时任务的属性，包括任务内容、下次执行时间、执行间隔。</p>
</td>
</tr>
<tr id="row94736225367"><td class="cellrowborder"  width="50%" headers="mcps1.1.3.1.1 "><p id="p64749226369"><a name="p64749226369"></a><a name="p64749226369"></a>PKG_SERVICE.SUBMIT_ON_NODES</p>
</td>
<td class="cellrowborder"  width="50%" headers="mcps1.1.3.1.2 "><p id="p54747220366"><a name="p54747220366"></a><a name="p54747220366"></a>提交一个任务到所有节点，作业号由系统自动生成。</p>
</td>
</tr>
<tr id="row3474182253615"><td class="cellrowborder"  width="50%" headers="mcps1.1.3.1.1 "><p id="p34748227365"><a name="p34748227365"></a><a name="p34748227365"></a>PKG_SERVICE.ISUBMIT_ON_NODES</p>
</td>
<td class="cellrowborder"  width="50%" headers="mcps1.1.3.1.2 "><p id="p1647472211366"><a name="p1647472211366"></a><a name="p1647472211366"></a>提交一个任务到所有节点，作业号由用户指定</p>
</td>
</tr>
</tbody>
</table>

## 接口定义和使用示例<a name="section8274222173710"></a>

- **PKG_SERVICE.JOB_CANCEL**

  存储过程 CANCEL 删除指定的定时任务。

  PKG_SERVICE.JOB_CANCEL 函数原型为：

  PKG_SERVICE.JOB_CANCEL\( job IN INTEGER\);

  <a name="table61911522103617"></a>
  <table><thead ><tr id="row154741322113613"><th class="cellrowborder"  width="20%" id="mcps1.1.6.1.1"><p id="p1347472273615"><a name="p1347472273615"></a><a name="p1347472273615"></a>参数</p>
  </th>
  <th class="cellrowborder"  width="20%" id="mcps1.1.6.1.2"><p id="p8474182233615"><a name="p8474182233615"></a><a name="p8474182233615"></a>类型</p>
  </th>
  <th class="cellrowborder"  width="20%" id="mcps1.1.6.1.3"><p id="p8474132214363"><a name="p8474132214363"></a><a name="p8474132214363"></a>入参/出参</p>
  </th>
  <th class="cellrowborder"  width="20%" id="mcps1.1.6.1.4"><p id="p18474182213362"><a name="p18474182213362"></a><a name="p18474182213362"></a>是否可以为空</p>
  </th>
  <th class="cellrowborder"  width="20%" id="mcps1.1.6.1.5"><p id="p1047432233613"><a name="p1047432233613"></a><a name="p1047432233613"></a>描述</p>
  </th>
  </tr>
  </thead>
  <tbody><tr id="row12474422193613"><td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.1 "><p id="p0474192243613"><a name="p0474192243613"></a><a name="p0474192243613"></a>id</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.2 "><p id="p17474222163614"><a name="p17474222163614"></a><a name="p17474222163614"></a>integer</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.3 "><p id="p24742022143612"><a name="p24742022143612"></a><a name="p24742022143612"></a>IN</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.4 "><p id="p147422203611"><a name="p147422203611"></a><a name="p147422203611"></a>否</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.5 "><p id="p1447432213616"><a name="p1447432213616"></a><a name="p1447432213616"></a>指定的作业号。</p>
  </td>
  </tr>
  </tbody>
  </table>

  示例：

  ```
  CALL PKG_SERVICE.JOB_CANCEL(101);
  ```

- **PKG_SERVICE.JOB_FINISH**

  存储过程 FINISH 禁用或者启用定时任务。

  PKG_SERVICE.JOB_FINISH 函数原型为：

  ```
  PKG_SERVICE.JOB_FINISH( id IN INTEGER, broken IN BOOLEAN, next_time IN TIMESTAMP DEFAULT sysdate);
  ```

  <a name="table1420042263615"></a>
  <table><thead ><tr id="row7475182263614"><th class="cellrowborder"  width="10.18%" id="mcps1.1.6.1.1"><p id="p947511221366"><a name="p947511221366"></a><a name="p947511221366"></a>参数</p>
  </th>
  <th class="cellrowborder"  width="11.65%" id="mcps1.1.6.1.2"><p id="p1247514224364"><a name="p1247514224364"></a><a name="p1247514224364"></a>类型</p>
  </th>
  <th class="cellrowborder"  width="10.86%" id="mcps1.1.6.1.3"><p id="p1647552243616"><a name="p1647552243616"></a><a name="p1647552243616"></a>入参/出参</p>
  </th>
  <th class="cellrowborder"  width="12.44%" id="mcps1.1.6.1.4"><p id="p84755221364"><a name="p84755221364"></a><a name="p84755221364"></a>是否可以为空</p>
  </th>
  <th class="cellrowborder"  width="54.87%" id="mcps1.1.6.1.5"><p id="p1547532283610"><a name="p1547532283610"></a><a name="p1547532283610"></a>描述</p>
  </th>
  </tr>
  </thead>
  <tbody><tr id="row5475192211363"><td class="cellrowborder"  width="10.18%" headers="mcps1.1.6.1.1 "><p id="p547572214366"><a name="p547572214366"></a><a name="p547572214366"></a>id</p>
  </td>
  <td class="cellrowborder"  width="11.65%" headers="mcps1.1.6.1.2 "><p id="p154750228366"><a name="p154750228366"></a><a name="p154750228366"></a>integer</p>
  </td>
  <td class="cellrowborder"  width="10.86%" headers="mcps1.1.6.1.3 "><p id="p20475722123614"><a name="p20475722123614"></a><a name="p20475722123614"></a>IN</p>
  </td>
  <td class="cellrowborder"  width="12.44%" headers="mcps1.1.6.1.4 "><p id="p947514223367"><a name="p947514223367"></a><a name="p947514223367"></a>否</p>
  </td>
  <td class="cellrowborder"  width="54.87%" headers="mcps1.1.6.1.5 "><p id="p1947519225369"><a name="p1947519225369"></a><a name="p1947519225369"></a>指定的作业号。</p>
  </td>
  </tr>
  <tr id="row1547572293613"><td class="cellrowborder"  width="10.18%" headers="mcps1.1.6.1.1 "><p id="p747510223367"><a name="p747510223367"></a><a name="p747510223367"></a>broken</p>
  </td>
  <td class="cellrowborder"  width="11.65%" headers="mcps1.1.6.1.2 "><p id="p20475322153616"><a name="p20475322153616"></a><a name="p20475322153616"></a>Boolean</p>
  </td>
  <td class="cellrowborder"  width="10.86%" headers="mcps1.1.6.1.3 "><p id="p547512212365"><a name="p547512212365"></a><a name="p547512212365"></a>IN</p>
  </td>
  <td class="cellrowborder"  width="12.44%" headers="mcps1.1.6.1.4 "><p id="p16475192215363"><a name="p16475192215363"></a><a name="p16475192215363"></a>否</p>
  </td>
  <td class="cellrowborder"  width="54.87%" headers="mcps1.1.6.1.5 "><p id="p247613224367"><a name="p247613224367"></a><a name="p247613224367"></a>状态标志位，true代表禁用，false代表启用。根据true或false值更新当前job；如果为空值，则不改变原有job的状态。</p>
  </td>
  </tr>
  <tr id="row1947682212367"><td class="cellrowborder"  width="10.18%" headers="mcps1.1.6.1.1 "><p id="p84761922183615"><a name="p84761922183615"></a><a name="p84761922183615"></a>next_time</p>
  </td>
  <td class="cellrowborder"  width="11.65%" headers="mcps1.1.6.1.2 "><p id="p14767228369"><a name="p14767228369"></a><a name="p14767228369"></a>timestamp</p>
  </td>
  <td class="cellrowborder"  width="10.86%" headers="mcps1.1.6.1.3 "><p id="p13476162210365"><a name="p13476162210365"></a><a name="p13476162210365"></a>IN</p>
  </td>
  <td class="cellrowborder"  width="12.44%" headers="mcps1.1.6.1.4 "><p id="p14768222366"><a name="p14768222366"></a><a name="p14768222366"></a>是</p>
  </td>
  <td class="cellrowborder"  width="54.87%" headers="mcps1.1.6.1.5 "><p id="p147692211366"><a name="p147692211366"></a><a name="p147692211366"></a>下次运行时间，默认为当前系统时间。如果参数broken状态为true，则更新该参数为’4000-1-1’；如果参数broken状态为false，且如果参数next_time不为空值，则更新指定job的next_time值，如果next_time为空值，则不更新next_time值。该参数可以省略，为默认值。</p>
  </td>
  </tr>
  </tbody>
  </table>

- **PKG_SERVICE.JOB_SUBMIT**

  存储过程 JOB_SUBMIT 提交一个系统提供的定时任务。

  PKG_SERVICE.JOB_SUBMIT 函数原型为：

  PKG_SERVICE.JOB_SUBMIT\( id IN BIGINT DEFAULT, content IN TEXT, next_date IN TIMESTAMP DEFAULT sysdate, interval_time IN TEXT DEFAULT ‘null’, job OUT INTEGER\);

  当创建一个定时任务（JOB）时，系统默认将当前数据库和用户名与当前创建的定时任务绑定起来。该接口函数可以通过 call 或 select 调用，如果通过 select 调用，可以不填写出参。如果在存储过程中，则需要通过 perform 调用该接口函数。如果提交的 sql 语句任务使用到非 public 的 schema，应该指定表或者函数的 schema，或者在 sql 语句前添加 set current_schema = xxx;语句。

  <a name="table1213822113611"></a>
  <table><thead ><tr id="row1847612210368"><th class="cellrowborder"  width="11.65%" id="mcps1.1.6.1.1"><p id="p5476192210363"><a name="p5476192210363"></a><a name="p5476192210363"></a>参数</p>
  </th>
  <th class="cellrowborder"  width="13.61%" id="mcps1.1.6.1.2"><p id="p144761922193617"><a name="p144761922193617"></a><a name="p144761922193617"></a>类型</p>
  </th>
  <th class="cellrowborder"  width="10.870000000000001%" id="mcps1.1.6.1.3"><p id="p1947792223614"><a name="p1947792223614"></a><a name="p1947792223614"></a>入参/出参</p>
  </th>
  <th class="cellrowborder"  width="14.99%" id="mcps1.1.6.1.4"><p id="p1447792216367"><a name="p1447792216367"></a><a name="p1447792216367"></a>是否可以为空</p>
  </th>
  <th class="cellrowborder"  width="48.88%" id="mcps1.1.6.1.5"><p id="p174771922173615"><a name="p174771922173615"></a><a name="p174771922173615"></a>描述</p>
  </th>
  </tr>
  </thead>
  <tbody><tr id="row11477022143614"><td class="cellrowborder"  width="11.65%" headers="mcps1.1.6.1.1 "><p id="p54777224360"><a name="p54777224360"></a><a name="p54777224360"></a>id</p>
  </td>
  <td class="cellrowborder"  width="13.61%" headers="mcps1.1.6.1.2 "><p id="p547722283617"><a name="p547722283617"></a><a name="p547722283617"></a>bigint</p>
  </td>
  <td class="cellrowborder"  width="10.870000000000001%" headers="mcps1.1.6.1.3 "><p id="p8477172214365"><a name="p8477172214365"></a><a name="p8477172214365"></a>IN</p>
  </td>
  <td class="cellrowborder"  width="14.99%" headers="mcps1.1.6.1.4 "><p id="p1347722212365"><a name="p1347722212365"></a><a name="p1347722212365"></a>否</p>
  </td>
  <td class="cellrowborder"  width="48.88%" headers="mcps1.1.6.1.5 "><p id="p1047792243611"><a name="p1047792243611"></a><a name="p1047792243611"></a>作业号。如果传入id为NULL，则内部会生成作业ID。</p>
  </td>
  </tr>
  <tr id="row1047717221361"><td class="cellrowborder"  width="11.65%" headers="mcps1.1.6.1.1 "><p id="p74776228361"><a name="p74776228361"></a><a name="p74776228361"></a>context</p>
  </td>
  <td class="cellrowborder"  width="13.61%" headers="mcps1.1.6.1.2 "><p id="p15477192218361"><a name="p15477192218361"></a><a name="p15477192218361"></a>text</p>
  </td>
  <td class="cellrowborder"  width="10.870000000000001%" headers="mcps1.1.6.1.3 "><p id="p2477622113620"><a name="p2477622113620"></a><a name="p2477622113620"></a>IN</p>
  </td>
  <td class="cellrowborder"  width="14.99%" headers="mcps1.1.6.1.4 "><p id="p19477162215364"><a name="p19477162215364"></a><a name="p19477162215364"></a>否</p>
  </td>
  <td class="cellrowborder"  width="48.88%" headers="mcps1.1.6.1.5 "><p id="p1947742210364"><a name="p1947742210364"></a><a name="p1947742210364"></a>要执行的SQL语句。支持一个或多个‘DML’，‘匿名块’，‘调用存储过程的语句’或3种混合的场景。</p>
  </td>
  </tr>
  <tr id="row1447732273615"><td class="cellrowborder"  width="11.65%" headers="mcps1.1.6.1.1 "><p id="p2047710220366"><a name="p2047710220366"></a><a name="p2047710220366"></a>next_time</p>
  </td>
  <td class="cellrowborder"  width="13.61%" headers="mcps1.1.6.1.2 "><p id="p9477112215361"><a name="p9477112215361"></a><a name="p9477112215361"></a>timestamp</p>
  </td>
  <td class="cellrowborder"  width="10.870000000000001%" headers="mcps1.1.6.1.3 "><p id="p13477172215369"><a name="p13477172215369"></a><a name="p13477172215369"></a>IN</p>
  </td>
  <td class="cellrowborder"  width="14.99%" headers="mcps1.1.6.1.4 "><p id="p1347722210362"><a name="p1347722210362"></a><a name="p1347722210362"></a>否</p>
  </td>
  <td class="cellrowborder"  width="48.88%" headers="mcps1.1.6.1.5 "><p id="p174773220360"><a name="p174773220360"></a><a name="p174773220360"></a>下次作业运行时间。默认值为当前系统时间（sysdate）。如果是过去时间，在提交作业时表示立即执行。</p>
  </td>
  </tr>
  <tr id="row6477122217365"><td class="cellrowborder"  width="11.65%" headers="mcps1.1.6.1.1 "><p id="p16477322143614"><a name="p16477322143614"></a><a name="p16477322143614"></a>interval_time</p>
  </td>
  <td class="cellrowborder"  width="13.61%" headers="mcps1.1.6.1.2 "><p id="p194771122113610"><a name="p194771122113610"></a><a name="p194771122113610"></a>text</p>
  </td>
  <td class="cellrowborder"  width="10.870000000000001%" headers="mcps1.1.6.1.3 "><p id="p124781622153615"><a name="p124781622153615"></a><a name="p124781622153615"></a>IN</p>
  </td>
  <td class="cellrowborder"  width="14.99%" headers="mcps1.1.6.1.4 "><p id="p1847832263610"><a name="p1847832263610"></a><a name="p1847832263610"></a>是</p>
  </td>
  <td class="cellrowborder"  width="48.88%" headers="mcps1.1.6.1.5 "><p id="p347882213365"><a name="p347882213365"></a><a name="p347882213365"></a>用来计算下次作业运行时间的时间表达式，可以是interval表达式，也可以是sysdate加上一个numeric值（例如：sysdate+1.0/24）。如果为空值或字符串"null"表示只执行一次，执行后JOB状态STATUS变成’d’ 不再执行。</p>
  </td>
  </tr>
  <tr id="row347802243613"><td class="cellrowborder"  width="11.65%" headers="mcps1.1.6.1.1 "><p id="p164782022113616"><a name="p164782022113616"></a><a name="p164782022113616"></a>job</p>
  </td>
  <td class="cellrowborder"  width="13.61%" headers="mcps1.1.6.1.2 "><p id="p1247812213364"><a name="p1247812213364"></a><a name="p1247812213364"></a>integer</p>
  </td>
  <td class="cellrowborder"  width="10.870000000000001%" headers="mcps1.1.6.1.3 "><p id="p1478172273613"><a name="p1478172273613"></a><a name="p1478172273613"></a>OUT</p>
  </td>
  <td class="cellrowborder"  width="14.99%" headers="mcps1.1.6.1.4 "><p id="p1247802273614"><a name="p1247802273614"></a><a name="p1247802273614"></a>否</p>
  </td>
  <td class="cellrowborder"  width="48.88%" headers="mcps1.1.6.1.5 "><p id="p447810222360"><a name="p447810222360"></a><a name="p447810222360"></a>作业号。范围为1～32767。当使用select调用pkg_service.job_submit时，该参数可以省略。</p>
  </td>
  </tr>
  </tbody>
  </table>

  示例：

  ```
  SELECT PKG_SERVICE.JOB_SUBMIT(NULL, 'call pro_xxx();', to_date('20180101','yyyymmdd'),'sysdate+1'); SELECT PKG_SERVICE.JOB_SUBMIT(NULL, 'call pro_xxx();', to_date('20180101','yyyymmdd'),'sysdate+1.0/24'); CALL PKG_SERVICE.JOB_SUBMIT(NULL, 'INSERT INTO T_JOB VALUES(1); call pro_1(); call pro_2();', add_months(to_date('201701','yyyymm'),1), 'date_trunc(''day'',SYSDATE) + 1 +(8*60+30.0)/(24*60)' ,:jobid); SELECT PKG_SERVICE.JOB_SUBMIT (101, 'insert_msg_statistic1;', sysdate, 'sysdate+3.0/24');
  ```

- **PKG_SERVICE.JOB_UPDATE**

  存储过程 UPDATE 修改定时任务的属性，包括任务内容、下次执行时间、执行间隔。

  PKG_SERVICE.JOB_UPDATE 函数原型为：

  PKG_SERVICE.JOB_UPDATE\( id IN BIGINT, next_time IN TIMESTAMP, interval_time IN TEXT, content IN TEXT\);

  <a name="table22331722193617"></a>
  <table><thead ><tr id="row947812293619"><th class="cellrowborder"  width="12.53%" id="mcps1.1.6.1.1"><p id="p147816228363"><a name="p147816228363"></a><a name="p147816228363"></a>参数</p>
  </th>
  <th class="cellrowborder"  width="12.540000000000001%" id="mcps1.1.6.1.2"><p id="p20478122217365"><a name="p20478122217365"></a><a name="p20478122217365"></a>类型</p>
  </th>
  <th class="cellrowborder"  width="11.84%" id="mcps1.1.6.1.3"><p id="p24781822103612"><a name="p24781822103612"></a><a name="p24781822103612"></a>入参/出参</p>
  </th>
  <th class="cellrowborder"  width="16.470000000000002%" id="mcps1.1.6.1.4"><p id="p15478022143618"><a name="p15478022143618"></a><a name="p15478022143618"></a>是否可以为空</p>
  </th>
  <th class="cellrowborder"  width="46.62%" id="mcps1.1.6.1.5"><p id="p14781322143617"><a name="p14781322143617"></a><a name="p14781322143617"></a>描述</p>
  </th>
  </tr>
  </thead>
  <tbody><tr id="row6478202211361"><td class="cellrowborder"  width="12.53%" headers="mcps1.1.6.1.1 "><p id="p19478132217366"><a name="p19478132217366"></a><a name="p19478132217366"></a>id</p>
  </td>
  <td class="cellrowborder"  width="12.540000000000001%" headers="mcps1.1.6.1.2 "><p id="p9478172223611"><a name="p9478172223611"></a><a name="p9478172223611"></a>integer</p>
  </td>
  <td class="cellrowborder"  width="11.84%" headers="mcps1.1.6.1.3 "><p id="p194781222173616"><a name="p194781222173616"></a><a name="p194781222173616"></a>IN</p>
  </td>
  <td class="cellrowborder"  width="16.470000000000002%" headers="mcps1.1.6.1.4 "><p id="p1247812243620"><a name="p1247812243620"></a><a name="p1247812243620"></a>否</p>
  </td>
  <td class="cellrowborder"  width="46.62%" headers="mcps1.1.6.1.5 "><p id="p447802263618"><a name="p447802263618"></a><a name="p447802263618"></a>指定的作业号。</p>
  </td>
  </tr>
  <tr id="row114791229362"><td class="cellrowborder"  width="12.53%" headers="mcps1.1.6.1.1 "><p id="p1247913226365"><a name="p1247913226365"></a><a name="p1247913226365"></a>next_time</p>
  </td>
  <td class="cellrowborder"  width="12.540000000000001%" headers="mcps1.1.6.1.2 "><p id="p12479422153618"><a name="p12479422153618"></a><a name="p12479422153618"></a>timestamp</p>
  </td>
  <td class="cellrowborder"  width="11.84%" headers="mcps1.1.6.1.3 "><p id="p347910222367"><a name="p347910222367"></a><a name="p347910222367"></a>IN</p>
  </td>
  <td class="cellrowborder"  width="16.470000000000002%" headers="mcps1.1.6.1.4 "><p id="p104793220360"><a name="p104793220360"></a><a name="p104793220360"></a>是</p>
  </td>
  <td class="cellrowborder"  width="46.62%" headers="mcps1.1.6.1.5 "><p id="p64795224365"><a name="p64795224365"></a><a name="p64795224365"></a>下次运行时间。如果该参数为空值，则不更新指定job的next_time值，否则更新指定job的next_time值。</p>
  </td>
  </tr>
  <tr id="row54791722123618"><td class="cellrowborder"  width="12.53%" headers="mcps1.1.6.1.1 "><p id="p8479102283619"><a name="p8479102283619"></a><a name="p8479102283619"></a>interval_time</p>
  </td>
  <td class="cellrowborder"  width="12.540000000000001%" headers="mcps1.1.6.1.2 "><p id="p64791223365"><a name="p64791223365"></a><a name="p64791223365"></a>text</p>
  </td>
  <td class="cellrowborder"  width="11.84%" headers="mcps1.1.6.1.3 "><p id="p14791622123620"><a name="p14791622123620"></a><a name="p14791622123620"></a>IN</p>
  </td>
  <td class="cellrowborder"  width="16.470000000000002%" headers="mcps1.1.6.1.4 "><p id="p1747932253618"><a name="p1747932253618"></a><a name="p1747932253618"></a>是</p>
  </td>
  <td class="cellrowborder"  width="46.62%" headers="mcps1.1.6.1.5 "><p id="p1847918228361"><a name="p1847918228361"></a><a name="p1847918228361"></a>用来计算下次作业运行时间的时间表达式。如果该参数为空值，则不更新指定job的interval_time值；如果该参数不为空值，会校验interval_time是否为有效的时间类型或interval类型，则更新指定job的interval_time值。如果为字符串"null"表示只执行一次，执行后JOB状态STATUS变成’d’ 不再执行。</p>
  </td>
  </tr>
  <tr id="row1547972213362"><td class="cellrowborder"  width="12.53%" headers="mcps1.1.6.1.1 "><p id="p647932203611"><a name="p647932203611"></a><a name="p647932203611"></a>content</p>
  </td>
  <td class="cellrowborder"  width="12.540000000000001%" headers="mcps1.1.6.1.2 "><p id="p3479162233619"><a name="p3479162233619"></a><a name="p3479162233619"></a>text</p>
  </td>
  <td class="cellrowborder"  width="11.84%" headers="mcps1.1.6.1.3 "><p id="p9479102218367"><a name="p9479102218367"></a><a name="p9479102218367"></a>IN</p>
  </td>
  <td class="cellrowborder"  width="16.470000000000002%" headers="mcps1.1.6.1.4 "><p id="p4479132212361"><a name="p4479132212361"></a><a name="p4479132212361"></a>是</p>
  </td>
  <td class="cellrowborder"  width="46.62%" headers="mcps1.1.6.1.5 "><p id="p247932212369"><a name="p247932212369"></a><a name="p247932212369"></a>执行的存储过程名或者sql语句块。如果该参数为空值，则不更新指定job的content值，否则更新指定job的content值。</p>
  </td>
  </tr>
  </tbody>
  </table>

  示例：

  ```
  CALL PKG_SERVICE.JOB_UPDATE(101, 'call userproc();', sysdate, 'sysdate + 1.0/1440'); CALL PKG_SERVICE.JOB_UPDATE(101, 'insert into tbl_a values(sysdate);', sysdate, 'sysdate + 1.0/1440');
  ```

- **PKG_SERVICE.SUBMIT_ON_NODES**

  存储过程 SUBMIT_ON_NODES 创建一个所有 CN/DN 上的定时任务，仅 sysadmin 有此权限。

  PKG_SERVICE.SUBMIT_ON_NODES 函数原型为：

  ```
  PKG_SERVICE.SUBMIT_ON_NODES( node_name IN TEXT, database IN TEXT what IN TEXT, next_date IN TIMESTAMP DEFAULT sysdate, job_interval IN TEXT DEFAULT 'null', job OUT INTEGER);
  ```

  <a name="table16252182253614"></a>
  <table><thead ><tr id="row164795221368"><th class="cellrowborder"  width="20%" id="mcps1.1.6.1.1"><p id="p12479192273612"><a name="p12479192273612"></a><a name="p12479192273612"></a>参数</p>
  </th>
  <th class="cellrowborder"  width="20%" id="mcps1.1.6.1.2"><p id="p64809226368"><a name="p64809226368"></a><a name="p64809226368"></a>类型</p>
  </th>
  <th class="cellrowborder"  width="20%" id="mcps1.1.6.1.3"><p id="p948042218362"><a name="p948042218362"></a><a name="p948042218362"></a>入参/出参</p>
  </th>
  <th class="cellrowborder"  width="20%" id="mcps1.1.6.1.4"><p id="p448011227363"><a name="p448011227363"></a><a name="p448011227363"></a>是否可以为空</p>
  </th>
  <th class="cellrowborder"  width="20%" id="mcps1.1.6.1.5"><p id="p13480202213362"><a name="p13480202213362"></a><a name="p13480202213362"></a>描述</p>
  </th>
  </tr>
  </thead>
  <tbody><tr id="row20480722123611"><td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.1 "><p id="p174806225367"><a name="p174806225367"></a><a name="p174806225367"></a>node_name</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.2 "><p id="p2480122163610"><a name="p2480122163610"></a><a name="p2480122163610"></a>text</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.3 "><p id="p1048072213612"><a name="p1048072213612"></a><a name="p1048072213612"></a>IN</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.4 "><p id="p5480222133618"><a name="p5480222133618"></a><a name="p5480222133618"></a>否</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.5 "><p id="p1848022217364"><a name="p1848022217364"></a><a name="p1848022217364"></a>指定作业的执行节点，当前仅支持值为’ALL_NODE’（在所有节点执行）与’CCN’（在central coordinator执行）。</p>
  </td>
  </tr>
  <tr id="row9480102253612"><td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.1 "><p id="p1448015224362"><a name="p1448015224362"></a><a name="p1448015224362"></a>database</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.2 "><p id="p184803222364"><a name="p184803222364"></a><a name="p184803222364"></a>text</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.3 "><p id="p164801229361"><a name="p164801229361"></a><a name="p164801229361"></a>IN</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.4 "><p id="p8480162211366"><a name="p8480162211366"></a><a name="p8480162211366"></a>否</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.5 "><p id="p548032273612"><a name="p548032273612"></a><a name="p548032273612"></a>集群作业所使用的database，节点类型为’ALL_NODE’时仅支持值为’postgres’。</p>
  </td>
  </tr>
  <tr id="row048032219368"><td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.1 "><p id="p34809221361"><a name="p34809221361"></a><a name="p34809221361"></a>what</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.2 "><p id="p6480122223616"><a name="p6480122223616"></a><a name="p6480122223616"></a>text</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.3 "><p id="p6480922163619"><a name="p6480922163619"></a><a name="p6480922163619"></a>IN</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.4 "><p id="p5480142219364"><a name="p5480142219364"></a><a name="p5480142219364"></a>否</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.5 "><p id="p19480222163618"><a name="p19480222163618"></a><a name="p19480222163618"></a>要执行的SQL语句。支持一个或多个‘DML’，‘匿名块’，‘调用存储过程的语句’或3种混合的场景。</p>
  </td>
  </tr>
  <tr id="row144801922203613"><td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.1 "><p id="p194801522183614"><a name="p194801522183614"></a><a name="p194801522183614"></a>nextdate</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.2 "><p id="p5480172217366"><a name="p5480172217366"></a><a name="p5480172217366"></a>timestamp</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.3 "><p id="p548122214363"><a name="p548122214363"></a><a name="p548122214363"></a>IN</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.4 "><p id="p20481162218364"><a name="p20481162218364"></a><a name="p20481162218364"></a>否</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.5 "><p id="p54811322153612"><a name="p54811322153612"></a><a name="p54811322153612"></a>下次作业运行时间。默认值为当前系统时间（sysdate）。如果是过去时间，在提交作业时表示立即执行。</p>
  </td>
  </tr>
  <tr id="row2481142214363"><td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.1 "><p id="p648112213364"><a name="p648112213364"></a><a name="p648112213364"></a>job_interval</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.2 "><p id="p7481132217369"><a name="p7481132217369"></a><a name="p7481132217369"></a>text</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.3 "><p id="p84811022123616"><a name="p84811022123616"></a><a name="p84811022123616"></a>IN</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.4 "><p id="p1848142263614"><a name="p1848142263614"></a><a name="p1848142263614"></a>否</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.5 "><p id="p4481182214367"><a name="p4481182214367"></a><a name="p4481182214367"></a>用来计算下次作业运行时间的时间表达式，可以是interval表达式，也可以是sysdate加上一个numeric值（例如：sysdate+1.0/24）。如果为空值或字符串"null"表示只执行一次，执行后JOB状态STATUS变成’d’不再执行。</p>
  </td>
  </tr>
  <tr id="row174811822203618"><td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.1 "><p id="p17481142293612"><a name="p17481142293612"></a><a name="p17481142293612"></a>job</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.2 "><p id="p0481182215361"><a name="p0481182215361"></a><a name="p0481182215361"></a>integer</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.3 "><p id="p20481122183615"><a name="p20481122183615"></a><a name="p20481122183615"></a>OUT</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.4 "><p id="p3481192211366"><a name="p3481192211366"></a><a name="p3481192211366"></a>否</p>
  </td>
  <td class="cellrowborder"  width="20%" headers="mcps1.1.6.1.5 "><p id="p14814226361"><a name="p14814226361"></a><a name="p14814226361"></a>作业号。范围为1～32767。当使用select调用dbms.submit_on_nodes时，该参数可以省略。</p>
  </td>
  </tr>
  </tbody>
  </table>

  示例：

  ```
  select pkg_service.submit_on_nodes('ALL_NODE', 'postgres', 'select capture_view_to_json(''dbe_perf.statement'', 0);', sysdate, 'interval ''60 second'''); select pkg_service.submit_on_nodes('CCN', 'postgres', 'select capture_view_to_json(''dbe_perf.statement'', 0);', sysdate, 'interval ''60 second''');
  ```

- **PKG_SERVICE.ISUBMIT_ON_NODES**

  ISUBMIT_ON_NODES 与 SUBMIT_ON_NODES 语法功能相同，但其第一个参数是入参，即指定的作业号，SUBMIT 最后一个参数是出参，表示系统自动生成的作业号。仅 sysadmin 有此权限。

## JOB 的使用示例<a name="section158829112412"></a>

- 创建测试表

  ```
  gaussdb@postgres> create table t_job (value TIMESTAMP);
  CREATE TABLE

  gaussdb@postgres> insert into t_job values(sysdate);
  INSERT 0 1

  gaussdb@postgres> select * from t_job;
  +---------------------+| value               ||---------------------|
  | 2021-10-09 04:36:20 |+---------------------+
  SELECT 1
  ```

- 创建任务，每一分钟插入一条记录

  ```
  gaussdb@postgres> select pkg_service.job_submit(null, 'insert into t_job values(sysdate);',sysdate,'sysdate + 1/1440');
  +--------------+| job_submit   ||--------------|| 15566        |+--------------+
  SELECT 1
  ```

- 检查 JOB 运行结果

  ```
  gaussdb@postgres> select * from t_job;
  +---------------------+| value               ||---------------------|
  | 2021-10-09 04:36:20 || 2021-10-09 04:40:54 || 2021-10-09 04:41:54 || 2021-10-09 04:42:54 |+---------------------+
  SELECT 4
  ```

- 从系统视图中检查 JOB 运行情况

  ```
  gaussdb@postgres> select job_id,dbname,start_date,next_run_date,interval,failure_count from pg_job;
  +----------+----------+----------------------------+---------------------+------------------+-----------------+
  | job_id   | dbname   | start_date                 | next_run_date       | interval         | failure_count   |
  |----------+----------+----------------------------+---------------------+------------------+-----------------|
  | 15566    | postgres | 2021-10-09 04:40:54.072363 | 2021-10-09 04:56:54 | sysdate + 1/1440 | 0               |
  +----------+----------+----------------------------+---------------------+------------------+-----------------+
  SELECT 1Time: 0.089sgaussdb@postgres> select * from pg_catalog.pg_job_proc pjp where job_id=15566;
  +----------+------------------------------------+|
  job_id   | what                               |
  |----------+------------------------------------|
  | 15566    | insert into t_job values(sysdate);
  |+----------+------------------------------------+
  SELECT 1Time: 0.089s
  ```

- 修改为 2 分钟执行一次

  ```
  gaussdb@postgres> select pkg_service.job_update(15566,null,'sysdate + 2/1440',null);
  +--------------+| job_update   |
  |--------------||              |
  +--------------+SELECT 1
  ```

- 检查修改情况和运行结果

  ```
  [gaussdb@postgres> select job_id,interval from pg_job where job_id=15566;
  +----------+------------------+| job_id   | interval         ||----------+------------------|| 15566    | sysdate + 2/1440 |+----------+------------------+
  SELECT 1](<gaussdb@postgres%3E select * from t_job;
  +---------------------+| value               ||---------------------|| 2021-10-09 04:36:20 || 2021-10-09 04:40:54 || 2021-10-09 04:41:54 || 2021-10-09 04:42:54 || 2021-10-09 04:43:54 || 2021-10-09 04:44:54 || 2021-10-09 04:45:54 || 2021-10-09 04:46:54 || 2021-10-09 04:47:54 || 2021-10-09 04:48:54 || 2021-10-09 04:49:54 || 2021-10-09 04:50:54 || 2021-10-09 04:51:54 || 2021-10-09 04:52:54 || 2021-10-09 04:53:54 || 2021-10-09 04:54:54 || 2021-10-09 04:55:54 || 2021-10-09 04:56:54 || 2021-10-09 04:57:54 || 2021-10-09 04:58:54 || 2021-10-09 04:59:54 || 2021-10-09 05:00:55 || 2021-10-09 05:01:56 | <---| 2021-10-09 05:03:57 | <--- 开始间隔2分钟+---------------------+
  SELECT 24Time: 0.088sgaussdb@postgres> select job_id,interval,next_run_date from pg_job where job_id=15566;
  +----------+------------------+---------------------+| job_id   | interval         | next_run_date       ||----------+------------------+---------------------|| 15566    | sysdate + 2/1440 | 2021-10-09 05:05:57 |+----------+------------------+---------------------+
  SELECT 1Time: 0.078s>
  ```

- 禁用和启用任务

  禁用和启用都是同样的函数 pkg_service.job_finish，传入不同的参数表示是禁用还是启用。

  ```
  gaussdb@postgres> select pkg_service.job_finish(15566,true,null);
  +--------------+| job_finish   ||--------------||              |+--------------+
  SELECT 1Time: 0.089sgaussdb@postgres> select job_id,next_run_date,job_status from pg_job where job_id=15566;
  +----------+---------------------+--------------+| job_id   | next_run_date       | job_status   ||----------+---------------------+--------------|| 15566    | 4000-01-01 00:00:00 | d            |+----------+---------------------+--------------+
  SELECT 1Time: 0.075sgaussdb@postgres> select pkg_service.job_finish(15566,false,null);+--------------+| job_finish   ||--------------||              |+--------------+SELECT 1Time: 0.091sgaussdb@postgres> select job_id,next_run_date,job_status from pg_job where job_id=15566;+----------+---------------------+--------------+| job_id   | next_run_date       | job_status   ||----------+---------------------+--------------|| 15566    | 4000-01-01 00:00:00 | s            |+----------+---------------------+--------------+
  SELECT 1Time: 0.080s
  ```

  可以看到如果重新启用任务的时候，没有指定下次运行时间，那么下次运行时间会始终保持在 4000 年，意味着仍然不会启动，所以如果禁用任务之后再重新启动，需要手动显式指定下次运行时间。

  ```
  gaussdb@postgres> select pkg_service.job_finish(15566,false,sysdate);+--------------+| job_finish   ||--------------||              |+--------------+SELECT 1Time: 0.088sgaussdb@postgres> select job_id,next_run_date,job_status from pg_job where job_id=15566;+----------+---------------------+--------------+| job_id   | next_run_date       | job_status   ||----------+---------------------+--------------|| 15566    | 2021-10-09 05:16:22 | s            |+----------+---------------------+--------------+SELECT 1Time: 0.086s
  ```

- 删除任务

  ```
  gaussdb@postgres> select pkg_service.job_cancel(15566);+--------------+| job_cancel   ||--------------||              |+--------------+SELECT 1Time: 0.082sgaussdb@postgres> select job_id,next_run_date,job_status from pg_job where job_id=15566;+----------+-----------------+--------------+| job_id   | next_run_date   | job_status   ||----------+-----------------+--------------|+----------+-----------------+--------------+SELECT 0Time: 0.086sgaussdb@postgres> select * from pg_catalog.pg_job_proc pjp where job_id=15566;+----------+--------+| job_id   | what   ||----------+--------|+----------+--------+SELECT 0Time: 0.087s
  opengauss
  ```
