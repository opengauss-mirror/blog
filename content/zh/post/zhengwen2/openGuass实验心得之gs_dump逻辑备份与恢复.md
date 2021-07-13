+++

title =  “openGuass实验心得之gs_dump逻辑备份与恢复" 

date = "2021-07-10" 

tags = ["openGuass实验心得之gs_dump逻辑备份与恢复"] 

archives = "2021-07" 

author = "Mia" 

summary = "openGuass实验心得之gs_dump逻辑备份与恢复"

img = "/zh/post/zhengwen2/img/img24.jpg" 

times = "12:30"

+++

# openGuass实验心得之gs_dump逻辑备份与恢复<a name="ZH-CN_TOPIC_0000001085018737"></a>

&nbsp;2021年4月份开始接触openGuass并做openGuass的有关实验，今天记下gs_dump逻辑备份的实验经历，以免未来忘记。（部分内容可能有疏漏，望包容和指出）<br />
注：实验的设计思路参考于华为openGauss的指导手册。</p>

<h2><a id="1_2"></a>1，数据库逻辑备份介绍</h2>
<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;数据库逻辑备份指将数据库对象和文件导出到文件的格式。那么物理备份和逻辑备份的区别在哪呢？做过物理备份实验gs_basebackup（在小编的上一篇文章也有哦）不难发现物理备份是将数据库关键文件转储，在恢复数据库时利用转储文件和cp命令进行恢复。而此次的逻辑备份指的是对数据库对象进行文件导出。逻辑备份是对象级备份，可移植性会更高，而且在逻辑备份中导出的文件格式可以自己指定哦。<br />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;本实验的关键在于一些逻辑命令参数的指定，参数表在华为官方文章有哦（网址：<a href="https://www.modb.pro/db/30875" target="_blank">华为gs_dump文章</a>），以下主要以实例进行说明～</p>
<h2><a id="2gs_dump_5"></a>2，gs_dump逻辑备份实验</h2>
<h3><a id="21__6"></a>2.1 导出数据库全量信息，导出文件为纯文本格式</h3>
<p>（1）以操作系统用户omm登录数据库主节点。</p>
<pre><code class="lang-linux">Ssh root@弹性公网ip //并输入密码
cd /opt/software/openGauss/script
su - omm
</code></pre>
<p>成功登入的截图如下：<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-68b83bac-154b-4812-a986-a08a38a55693.png" alt="21.png" /><br />
创建存储备份文件的文件夹。</p>
<pre><code class="lang-linux">mkdir -p /home/omm/logical/backup
</code></pre>
<p>执行gs_dump，导出的MPPDB_backup.sql文件格式为纯文本格式。</p>
<pre><code class="lang-linux">gs_dump -U omm -W Bigdata@123 -f /home/omm/logical/backup/MPPDB_backup.sql -p 26000 postgres -F p
</code></pre>
<p>其中-U表示用户，-W用于指定用户连接的密码，-f表示指定输出文件，-p表示指定端口，-F表示表示输出格式，p表示纯文本格式<br />
执行后结果为：</p>
<pre><code class="lang-linux">gsql ((openGauss 1.1.0 build 392c0438) compiled at 2020-12-31 20:08:06 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type &quot;help&quot; for help.
postgres=# \q
[omm@ecs-a560 ~]$ gs_dump -U omm -W Bigdata@123 -f /home/omm/logical/backup/MPPDB_backup.sql -p 26000 postgres -F p
gs_dump[port='26000'][postgres][2021-07-06 09:38:53]: The total objects number is 443.
gs_dump[port='26000'][postgres][2021-07-06 09:38:53]: [100.00%] 443 objects have been dumped.
gs_dump[port='26000'][postgres][2021-07-06 09:38:53]: dump database postgres successfully
gs_dump[port='26000'][postgres][2021-07-06 09:38:53]: total time: 378  ms
切换到backup文件夹，查看MPPDB_backup.sql文件。
ll /home/omm/logical/backup/
total 112K
-rw------- 1 omm dbgrp 109K Jul  6 09:38 MPPDB_backup.sql
末尾部分内容显示如下：
CREATE INDEX ix_pmk_snapshot_time ON pmk_snapshot USING btree (current_snapshot_time DESC) TABLESPACE pg_default;
SET search_path = public;
--
-- Name: inx_stu01; Type: INDEX; Schema: public; Owner: omm; Tablespace: 
--
CREATE INDEX inx_stu01 ON student USING btree (std_name) TABLESPACE pg_default;
--
-- Name: public; Type: ACL; Schema: -; Owner: omm
--
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM omm;
GRANT CREATE,USAGE ON SCHEMA public TO omm;
GRANT USAGE ON SCHEMA public TO PUBLIC;
--
-- PostgreSQL database dump complete
--
</code></pre>
<h3><a id="22_tar_67"></a>2.2 导出数据库全量信息，导出文件格式为tar格式。</h3>
<p>首先以操作系统用户omm登录数据库主节点。（操作步骤如上哦）<br />
执行gs_dump，导出的MPPDB_backup.tar文件格式为tar格式。</p>
<pre><code class="lang-linux">gs_dump -U omm -W Bigdata@123 -f  /home/omm/logical/backup/MPPDB_backup.tar -p 26000 postgres -F t
</code></pre>
<p>其中-t表示输出格式为tar<br />
结果显示如下：</p>
<pre><code class="lang-linux">gs_dump[port='26000'][postgres][2021-07-06 09:45:05]: The total objects number is 443.
gs_dump[port='26000'][postgres][2021-07-06 09:45:05]: [100.00%] 443 objects have been dumped.
gs_dump[port='26000'][postgres][2021-07-06 09:45:05]: dump database postgres successfully
gs_dump[port='26000'][postgres][2021-07-06 09:45:05]: total time: 311  ms
</code></pre>
<p>查看生成的文件信息。</p>
<pre><code class="lang-linux">ll /home/omm/logical/backup/
</code></pre>
<p>结果显示如下：</p>
<pre><code class="lang-linux">total 356K
-rw------- 1 omm dbgrp 109K Jul  6 09:38 MPPDB_backup.sql
-rw------- 1 omm dbgrp 241K Jul  6 09:45 MPPDB_backup.tar
</code></pre>
<h3><a id="23__91"></a>2.3 导出数据库全量信息，导出文件格式为自定义归档格式。</h3>
<p>首先以操作系统用户omm登录数据库主节点。（操作步骤同上哦）<br />
执行gs_dump，导出的MPPDB_backup.dmp文件格式为自定义归档格式。</p>
<pre><code class="lang-linux">gs_dump -U omm -W Bigdata@123 -f  /home/omm/logical/backup/MPPDB_backup.dmp -p 26000 postgres -F c
</code></pre>
<p>其中c表示文件格式为自定义格式。<br />
结果显示如下：</p>
<pre><code class="lang-linux">gs_dump[port='26000'][postgres][2021-07-06 09:47:44]: The total objects number is 443.
gs_dump[port='26000'][postgres][2021-07-06 09:47:44]: [100.00%] 443 objects have been dumped.
gs_dump[port='26000'][postgres][2021-07-06 09:47:44]: dump database postgres successfully
gs_dump[port='26000'][postgres][2021-07-06 09:47:44]: total time: 312  ms
</code></pre>
<p>查看生成的文件信息。</p>
<pre><code class="lang-">ll /home/omm/logical/backup/
//以下为显示结果
total 468K
-rw------- 1 omm dbgrp 110K Jul  6 09:47 MPPDB_backup.dmp
-rw------- 1 omm dbgrp 109K Jul  6 09:38 MPPDB_backup.sql
-rw------- 1 omm dbgrp 241K Jul  6 09:45 MPPDB_backup.tar
</code></pre>
<h3><a id="24__114"></a>2.4 导出数据库全量信息，导出文件格式为目录格式。</h3>
<p>首先以操作系统用户omm登录数据库主节点。（操作步骤同上哦）<br />
执行gs_dump，导出的MPPDB_backup文件格式为目录格式。</p>
<pre><code class="lang-linux">gs_dump -U omm -W Bigdata@123 -f /home/omm/logical/backup/MPPDB_backup -p 26000  postgres -F d
</code></pre>
<p>其中d指定为目录格式<br />
显示结果如下：</p>
<pre><code class="lang-linux">gs_dump[port='26000'][postgres][2021-07-06 09:52:12]: The total objects number is 443.
gs_dump[port='26000'][postgres][2021-07-06 09:52:12]: [100.00%] 443 objects have been dumped.
gs_dump[port='26000'][postgres][2021-07-06 09:52:12]: dump database postgres successfully
gs_dump[port='26000'][postgres][2021-07-06 09:52:12]: total time: 312  ms
</code></pre>
<p>（3）查看生成的文件信息。</p>
<pre><code class="lang-linux">ll /home/omm/logical/backup/
</code></pre>
<p>显示结果如下：</p>
<pre><code class="lang-linux">total 472K
drwx------ 2 omm dbgrp 4.0K Jul  6 09:52 MPPDB_backup
-rw------- 1 omm dbgrp 110K Jul  6 09:47 MPPDB_backup.dmp
-rw------- 1 omm dbgrp 109K Jul  6 09:38 MPPDB_backup.sql
-rw------- 1 omm dbgrp 241K Jul  6 09:45 MPPDB_backup.tar
</code></pre>
<p>进一步查看目录内部内容</p>
<pre><code class="lang-linux">cd /home/omm/logical/backup/MPPDB_backup
ls
</code></pre>
<p>结果显示如下：</p>
<pre><code class="lang-linux">4522.dat.gz  4524.dat.gz  4526.dat.gz  4528.dat.gz  dir.lock
4523.dat.gz  4525.dat.gz  4527.dat.gz  4529.dat.gz  toc.dat
</code></pre>
<h3><a id="25__150"></a>2.5 导出数据库的表（或视图、或序列、或外表）对象。</h3>
<p>以操作系统用户omm登录数据库主节点。(步骤如上面哦)<br />
执行gs_dump，导出的表customer_t1</p>
<pre><code class="lang-linux">gs_dump -U omm -W Bigdata@123 -f /home/omm/logical/backup/bkp_shl2.sql -t public.customer_t1 -p 26000 postgres
</code></pre>
<p>其中customer_t1为事先建立好的表,bkp_shl2,sql为导出的文件<br />
运行结果如下：</p>
<pre><code class="lang-linux">gs_dump[port='26000'][postgres][2021-07-06 09:57:45]: The total objects number is 379.
gs_dump[port='26000'][postgres][2021-07-06 09:57:45]: [100.00%] 379 objects have been dumped.
gs_dump[port='26000'][postgres][2021-07-06 09:57:45]: dump database postgres successfully
gs_dump[port='26000'][postgres][2021-07-06 09:57:45]: total time: 178  ms
</code></pre>
<p>查看生成的文件信息</p>
<pre><code class="lang-">ll /home/omm/logical/backup/
cat /home/omm/logical/backup/bkp_shl2.sql 
</code></pre>
<p>显示的结果部分如下：</p>
<pre><code class="lang-linux">--
-- PostgreSQL database dump
--
SET statement_timeout = 0;
SET xmloption = content;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET search_path = public;
SET default_tablespace = '';
SET default_with_oids = false;
--
-- Name: customer_t1; Type: TABLE; Schema: public; Owner: omm; Tablespace: 
--
CREATE TABLE customer_t1 (
    c_customer_sk integer,
    c_customer_id character(5),
    c_first_name character(6),
    c_last_name character(8)
)
WITH (orientation=row, compression=no);
ALTER TABLE public.customer_t1 OWNER TO omm;
--
-- Data for Name: customer_t1; Type: TABLE DATA; Schema: public; Owner: omm
--
COPY customer_t1 (c_customer_sk, c_customer_id, c_first_name, c_last_name) FROM stdin;
3769	hello	\N	\N
6885	maps 	Joes  	\N
4321	tpcds	Lily  	\N
9527	world	James 	\N
\.
;
--
-- PostgreSQL database dump complete
--
</code></pre>
<h2><a id="3__219"></a>3, 实验小结</h2>
<p>逻辑备份实验的步骤大体上为登录数据库主节点—进行逻辑备份—查看逻辑文件，总体上比较简单。逻辑备份对于数据库的恢复非常重要，是数据库安全机制重要的一环。openGauss逻辑备份可以指定文件格式的机制也非常灵活。</p>
<p>注：本篇文章为原创文章，转载请注明出处哦～</p>
</div>
<script src="https://cdn.modb.pro/_nuxt/386d4c40ac7324fcc146.js" defer></script><script src="https://cdn.modb.pro/_nuxt/modb.2.210.2.js" defer></script><script src="https://cdn.modb.pro/_nuxt/modb.2.210.0.js" defer></script>
  </body>
</html>

