+++

title =  "openGauss索引查询和索引规则实验" 

date = "2021-07-09" 

tags = ["openGauss索引查询和索引规则实验"] 

archives = "2021-07" 

author = "滋味" 

summary = "openGauss索引查询和索引规则实验"

img = "/zh/post/zhengwen2/img/img28.png" 

times = "12:30"

+++

# openGauss索引查询和索引规则实验<a name="ZH-CN_TOPIC_0000001085018737"></a> 

<html data-n-head-ssr>
  <body >

 <div class="emcs-page-content" data-v-229ac844><div class="main-box" data-v-229ac844><div class="db-detail-content emcs-table" data-v-229ac844><div class="editor-content-styl" data-v-229ac844><p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;建立索引是提高数据库访问速度的重要手段之一。本文将对openGauss2.0.0的4个主要索引方式进行实验，验证建立索引前后查询性能的差异和部分索引规则。</p>
<h2><a id="_2"></a>实验环境</h2>
<p>软件：openGauss2.0.0, openEuler20.03, VirtualBox6.1.16，虚拟机配置2处理器，4G内存<br />
硬件：CPU: Intel i5-8265U</p>
<h2><a id="openGauss_8"></a>openGauss索引介绍</h2>
<p>根据openGauss2.0.0手册，openGauss有四种索引和根据一个索引对表做一次性聚集操作的CLUSTER语句。</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210707-0483a87c-ecae-4637-b79e-fa5c59a81783.PNG" alt="4种索引.PNG" /></p>
<div class="hljs-center">
<p>表1 openGauss的4种索引方式（截图自openGauss2.0.0手册《创建和管理索引》章节）</p>
</div>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210707-0d9a5f52-1cc0-4192-865e-17db88eb48bc.PNG" alt="CLUSTER语句.PNG" /></p>
<div class="hljs-center">
<p>图1 openGauss的CLUSTER语句描述（截图自openGauss2.0.0手册《CLUSTER》章节）</p>
</div>
<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;据此可以推测，前3类索引（唯一索引、多字段索引、部分索引）都是在对应的属性（集合）上创建B树的辅助索引，不改变表中条目的物理存储顺序；且这些索引都是稠密的，因为辅助索引均为稠密索引。而CLUSTER就指定一个索引，根据索引排序表的条目，被指定的索引成为聚集索引，其他索引仍为辅助索引。</p>
<h2><a id="1_30"></a>实验1：索引查询实验</h2>
<h4><a id="_32"></a>建表和插入数据</h4>
<p>建立phi表，有pno, pname, location, healthstatus4个属性，具体建表代码如下。</p>

```sql
create table phi(
pno varchar(18) primary key,
pname varchar(20),
location varchar(20),
healthstatus varchar(20));
```

<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;随后建立函数插入数据。通过随机数函数生成大整数并cast到varchar作为pno主码插入数据。但是如果插入主码相同的数据，会产生错误和回滚，导致之前插入的数据也丢失。因此可以采用以下两种方法。</p>
<p><strong>方案1</strong>：查重法。每生成一个新pno，就在已插入的表中的pno中查找有没有重复的。一开始对pgSQL的变量作用域不太熟悉，在微信群中的华为工程师帮忙调试了部分代码，函数可以运行（代码见附录1）。但是复杂度O(n^2)，插入10万条数据要超过1小时，插入100万条的时间是无法接受的。</p>
<p><strong>方案2</strong>：双随机数法。生成一个18位整型随机数(ran)和另一个12位整型随机数(ran2)，令ran-ran2作为pno主码，不进行查重检验，直接插入（代码见附录2）。实际操作中主码重合的概率极低。插入效率大约是每秒钟1万条数据，比较高效。</p>
<p>分别建立了有5000、10000、100000、1000000个数据条目的表进行索引实验。</p>
<h4><a id="_50"></a>建立索引</h4>
<p>每个数量级的表均会建立5个索引和2次CLUSTER操作。</p>
索引1：建立pno上的普通索引

```sql
create index index_uni_pno on phi(pno);
```

索引2：建立pname上的普通索引
```sql
create index index_uni_pna on phi(pname);
```

索引3：建立(pname,pno)的多值索引
```sql
create index index_mul_pna_pno on phi(pname,pno);
```

索引4：建立部分索引
```sql
create index index_par_loc on phi(location) 
where location='Shanghai' and healthstatus='Health';
```

索引5：建立表达式索引
```sql
create index index_exp_pno on phi(substr(pno,1,4)); 
```

聚集操作1：对pno聚集操作
```sql
cluster verbose phi using index_uni_pno;
```

聚集操作2：对pno,location做聚集操作
```sql
create index index_mul_pno_loc on phi(pno,location);
cluster verbose phi using index_mul_pno_loc;
```

查询执行
每个数量级的表均会执行15条查询语句，查询语句和执行的条件如下。

无索引时，进行如下查询，编号为1-6。
```sql
explain analyze select * from phi where pno>'500000000000000000';
explain analyze select * from phi where pname>'p678900000000';
explain analyze select * from phi where pno>'500000000000000000' and pname>'p678900000000';
explain analyze select * from phi where location='Shanghai' and healthstatus='Health';
explain analyze select * from phi where pno like '5678%';
explain analyze select healthstatus,count(*) from phi where location='Shanghai' group by healthstatus;
```

建立索引1-5后，进行如下查询，编号为7-11。
```sql
explain analyze select * from phi where pno>'500000000000000000';
explain analyze select * from phi where pname>'p678900000000';
explain analyze select * from phi where pno>'500000000000000000' and pname>'p678900000000';
explain analyze select * from phi where location='Shanghai' and healthstatus='Health';
explain analyze select * from phi where pno like '5678%';
```

对pno聚集操作后，进行如下查询，编号为12、13。
```sql
explain analyze select * from phi where pno>'500000000000000000';
explain analyze select healthstatus,count(*) from phi where location='Shanghai' group by healthstatus;
```

对location,pno聚集操作后，进行如下查询，编号14。
```sql
explain analyze select healthstatus,count(*) from phi where location='Shanghai' group by healthstatus;
```

<h4><a id="_124"></a>实验结果</h4>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210707-9b6c466a-6cec-47b5-9ca5-024914d6a748.png" alt="114查询时间.png" /></p>
<div class="hljs-center">
<p>表2 各查询语句的执行用时（单位：毫秒）</p>
</div>
<p><strong>结论1</strong>：对比运行时间1、7、12，查询pno上特定范围的数据。建立pno上的索引后、或者对该索引聚集后，访问pno&gt;’500000000000000000’的速度略微加快；explain analyze显示添加索引后仍是遍历访问。<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210707-6d5b473d-0b32-4873-9fad-9b96b386c554.png" alt="pno顺序_100w.png" /></p>
<div class="hljs-center">
<p>图2 100万条数据时查询12的结果</p>
</div>
<p><strong>结论2</strong>：对比运行时间2、8，查询pname上特定范围的数据。建立pname上的索引后，访问pname&gt;’p678900000000’的速度略微加快。同样，explain analyze显示添加索引后对pname仍是遍历访问。</p>
<p><strong>结论3</strong>：对比运行时间3、9，查询pno和pname都在特定范围内的数据。建立索引1-5后，查询pname&gt;’p678900000000’ and pno&gt;’500000000000000000’的速度明显加快，基本节省一半时间。但是看explain analyze的信息，发现查询过程是在满足pno条件后用pname的普通索引找的。<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210707-140e23da-e216-4988-b67b-5e31efde0ed4.png" alt="8_100w.png" /></p>
<div class="hljs-center">
<p>图3 100万条数据时查询9的结果</p>
</div>
<p><strong>结论4</strong>：对比运行时间4、10，查找位于上海的健康人。可以发现使用对应的部分索引可以明显加快访问，因为已经把要的数据建成树了。</p>
<p><strong>结论5</strong>：对比运行时间5、11，查找pno开头是5678的人。发现表达式索引作用尚不显著，可能本身用时就比较快。</p>
<p><strong>结论6</strong>：对比运行时间6、13、14，该查询要求显示在上海的各healthsatus的人数。显然6是遍历的时间（因为6的用时和1、3接近）；13根据pno聚集后，用时小幅缩短；14按(location,pno)聚集后，用时减少超过一半。据此可以从查询策略上猜想，6、13都是遍历；14根据(location,pno)索引准确找到了location=’Shanghai’的位置并只遍历上海的数据，因此最快。</p>
<h2><a id="2_154"></a>实验2：索引规则实验</h2>
<h4><a id="_156"></a>表达式索引</h4>
<p>表2中编号5和11的查询没有收到预期效果（11应远远快于5）。查询手册发现openGauss要求表达式索引只有在查询时使用与创建时相同的表达式才有效，下面进行验证。</p>
<p>查询指令</p>

```sql
select * from phi where substr(pno,1,4)='2345';
```

<p>分别在无和有索引5的情况下运行（图4、图5），时间分别为0.544ms和848.343ms，可以看到差别巨大。也表明表达式索引在大数据量时非常有用，但使用条件非常苛刻，要求表达式相同。</p>
<p>如果表达式不同（图4、图6），那么在查询执行时就不会用到表达式索引。不过有趣的是不用索引5的运行时间比用索引还短那么一点点。</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210707-63f3b52d-493d-438e-803e-4e84137a867b.png" alt="pic4.png" /></p>
<div class="hljs-center">
<p>图4 有索引5时的查询select * from phi where substr(pno,1,4)=‘2345’;</p>
</div>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210707-77722e97-8f91-4ed6-9407-971f81292286.png" alt="pic5.png" /></p>
<div class="hljs-center">
<p>图5 无索引5时的查询select * from phi where substr(pno,1,4)=‘2345’;</p>
</div>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210707-f20fc89c-135c-4e3b-996b-ca4ab4a6d359.png" alt="pic6.png" /></p>
<div class="hljs-center">
<p>图6 有索引5时的查询select * from phi where pno like ‘2345%’;</p>
</div>
<h4><a id="_184"></a>主键索引</h4>
<p>可以看到建表时openGauss默认创建的索引phi_pkey和我创建的在pno上的普通索引index_uni_pno大小一致，猜测他们都是关于pno的普通索引。分别对两个索引进行cluster操作并查看数据，发现两者都是按pno按字典序排列。因此认为openGauss的表的主键索引{tablename}_pkey是建立在表主码上的B树索引。</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210707-549b9512-88b7-4c86-a770-170acb2b76ed.png" alt="pic7.png" /></p>
<div class="hljs-center">
<p>图7 表的所有索引</p>
</div>
<h2><a id="_194"></a>附录</h2>
<h4><a id="1_195"></a>附录1：插入数据的函数（查重方法）</h4>

```sql
create or replace function insert_data(numb integer) returns void
as $$
begin
  declare counter integer :=1;
  declare ran integer := random()*1000000000 as integer;
  declare pn varchar(18) := cast( ran as varchar(18));
  declare pna varchar(20) :=concat('p',pn);
  declare loc varchar(20) := 'China';
  declare hs varchar(20) := 'Health';
  TYPE var20_array IS VARRAY(5) OF varchar(20);
  loc_arr var20_array := var20_array();
  hs_arr var20_array := var20_array();
  begin
    loc_arr[1] :='Shanghai';
    loc_arr[2] :='Beijing';
    loc_arr[3] :='Guangzhou';
    loc_arr[4] :='Wuhan';
    hs_arr[1] :='Health';
    hs_arr[2] :='Uncertain';
    hs_arr[3] :='Diagnosis';
    hs_arr[4] :='Cure';
    begin raise notice 'start at %',statement_timestamp(); end;
    while counter<=numb 
      loop
      ran := random()*1000000000 as integer;
      pn := cast( ran as varchar(18));
      begin
        while pn in (select pno from phi)
          loop
          ran := random()*1000000000 as integer;
          pn := cast( ran as varchar(18));
          end loop;
      end;
      pna :=concat('p',pn);
      ran :=floor(1 + (random() * 4));
      loc := loc_arr[ran];
      ran :=floor(1 + (random() * 4));
      hs := hs_arr[ran];
      begin
        insert into phi(pno,pname,location,healthstatus) values(pn,pna,loc,hs);
      end;
      begin
        if counter % 1000=0
        then 
          begin raise notice 'counter: % at %',counter, statement_timestamp(); end;
        end if;
      end;
      counter :=counter+1;
    end loop;
  end;
end;
$$ language plpgsql;
```

<h4><a id="2_251"></a>附录2：插入数据的函数（双随机数方法）</h4>

```sql
create or replace function insert_data2(numb integer) returns void
as $$
begin
  declare counter integer :=1;
  declare ran bigint := random()*1000000000000000000 as bigint;
  declare ran2 bigint := random()*1000000000000 as bigint;
  declare pn varchar(18) := cast( ran as varchar(18));
  declare pna varchar(20) :=concat('p',pn);
  declare loc varchar(20) := 'China';
  declare hs varchar(20) := 'Health';
  TYPE var20_array IS VARRAY(5) OF varchar(20);
  loc_arr var20_array := var20_array();
  hs_arr var20_array := var20_array();
  begin
    loc_arr[1] :='Shanghai';
    loc_arr[2] :='Beijing';
    loc_arr[3] :='Guangzhou';
    loc_arr[4] :='Wuhan';
    hs_arr[1] :='Health';
    hs_arr[2] :='Uncertain';
    hs_arr[3] :='Diagnosis';
    hs_arr[4] :='Cure';
    begin raise notice 'start at %',statement_timestamp(); end;
    while counter<=numb 
      loop
      ran := random()*1000000000000000000 as bigint;
      ran2 := random()*1000000000000 as bigint;
      ran := ran-ran2;
      pna :=concat('p',pn);
      pn := cast( ran as varchar(18));
      ran :=floor(1 + (random() * 4));
      loc := loc_arr[ran];
      ran :=floor(1 + (random() * 4));
      hs := hs_arr[ran];
      begin
        insert into phi(pno,pname,location,healthstatus) values(pn,pna,loc,hs);
      end;
      begin
        if counter % 10000=0
        then 
          begin raise notice 'counter: % at %',counter, statement_timestamp(); end;
        end if;
      end;
      counter :=counter+1;
    end loop;
  end;
end;
$$ language plpgsql;
```

<script src="https://cdn.modb.pro/_nuxt/386d4c40ac7324fcc146.js" defer></script><script src="https://cdn.modb.pro/_nuxt/modb.2.210.2.js" defer></script><script src="https://cdn.modb.pro/_nuxt/modb.2.210.0.js" defer></script>
  </body>
</html>

