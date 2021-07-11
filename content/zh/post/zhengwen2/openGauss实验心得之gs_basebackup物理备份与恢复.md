title = "openGauss实验心得之gs_basebackup物理备份与恢复" 

date = "2021-07-09" 

tags = ["openGauss实验心得之gs_basebackup物理备份与恢复"] 

archives = "2021-07" 

author = "Mia" 

summary = "openGauss实验心得之gs_basebackup物理备份与恢复"

img = "/zh/post/zhengwen2/img/img24.jpg" " 

times = "12:30"

+++

# openGauss实验心得之gs_basebackup物理备份与恢复<a name="ZH-CN_TOPIC_0000001085018737"></a>

2021年4月份开始接触openGauss并做openGauss的有关实验，今天记下gs_basebackup物理备份的实验经历:-D，以免未来忘记。（部分内容可能有疏漏，望包容和指出）
注：实验的设计思路参考于华为openGauss的指导手册。

## **1.数据库物理备份介绍**

数据库物理备份指的是对数据库一些关键文件如日志、配置文件、关键数据等进行备份在数据库遭到破坏时能从备份处进行恢复。同时gs_basebackup备份的是数据库的二进制文件，因此在恢复是可以直接拷贝替换原有的文件或者直接在备份的库启动数据库。



## 2.gs_basebackup实验


<h3><a id="21__5"></a>2.1 物理备份</h3>
<p>用ssh命令首先登入openGauss所在的弹性公网并切换到omm用户</p>
<pre><code class="lang-linux">ssh root@弹性公网地址 //并输入密码
cd /opt/software/openGauss/script
su - omm
</code></pre>
<p>成功登入的截图如下：<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-60dbb403-7bef-41da-82b5-165107630b27.png" alt="1.png" /><br />
创建存储备份文件的文件夹并用ls命令查看</p>
<pre><code class="lang-linux">ls
//第一次结果显示为collector.json  logical
mkdir -p /home/omm/physical/backup
//第二次结果显示为collector.json  logical  physical
</code></pre>
<p>为了进行对比在破坏数据库前先启动数据库</p>
<pre><code class="lang-linux">gs_om -t start
</code></pre>
<p>结果显示如下：</p>
<pre><code class="lang-linux">Starting cluster.
=========================================
=========================================
Successfully started.
</code></pre>
<p>将数据库进行物理备份(物理备份前一定要先启动数据库)</p>
<pre><code class="lang-linux">gs_basebackup -D /home/omm/physical/backup -p 26000
//参数-D directory表示备份文件输出的目录，是必选项。
</code></pre>
<p>结果显示如下：</p>
<pre><code class="lang-linux">INFO:  The starting position of the xlog copy of the full build is: 0/5000028. The slot minimum LSN is: 0/0.
begin build tablespace list
finish build tablespace list
begin get xlog by xlogstream
                                                                                 check identify system success
                                                                                 send START_REPLICATION 0/5000000 success
                                                                                 keepalive message is received
                                                                                 keepalive message is received
                                                                                 keepalive message is received
                                                                                 keepalive message is received
                                                                                 keepalive message is received
gs_basebackup: base backup  successfully

</code></pre>
<h3><a id="22__53"></a>2.2 数据库破坏</h3>
<p>停止数据库服务</p>
<pre><code class="lang-linux">gs_om -t stop
</code></pre>
<p>结果显示为：</p>
<pre><code class="lang-linux">Stopping cluster.
=========================================
Successfully stopped cluster.
=========================================
End stop cluster.
</code></pre>
<p>查看数据库文件</p>
<pre><code class="lang-linux">cd /gaussdb/data
ls
//此处结果显示为db1（不同数据库节点文件可能不一样）
cd db1
ls
</code></pre>
<p>结果显示如下：</p>
<pre><code class="lang-linux">backup_label.old    pg_ctl.lock       pg_replslot      postgresql.conf.bak
base                pg_errorinfo      pg_serial        postgresql.conf.lock
cacert.pem          pg_hba.conf       pg_snapshots     postmaster.opts
gaussdb.state       pg_hba.conf.bak   pg_stat_tmp      server.crt
global              pg_hba.conf.lock  pg_tblspc        server.key
gswlm_userinfo.cfg  pg_ident.conf     pg_twophase      server.key.cipher
mot.conf            pg_llog           PG_VERSION       server.key.rand
pg_clog             pg_multixact      pg_xlog
pg_csnlog           pg_notify         postgresql.conf
</code></pre>
<p>其中.conf文件为认证文件，log文件为日志文件<br />
破坏db1文件</p>
<pre><code class="lang-linux">rm -rf  *
ls
</code></pre>
<p>在破坏后该文件夹的内容应该为空<br />
尝试重新启动数据库</p>
<pre><code class="lang-linux">gs_om -t start
</code></pre>
<p>此时显示的结果如下：</p>
<pre><code class="lang-linux">Starting cluster.
=========================================
[GAUSS-53600]: Can not start the database, the cmd is source /home/omm/.bashrc; python3 '/opt/huawei/wisequery/script/local/StartInstance.py' -U omm -R /opt/gaussdb/app -t 300 --security-mode=off,  Error:
[FAILURE] ecs-a560:
[GAUSS-51607] : Failed to start instance. Error: Please check the gs_ctl log for failure details.
[2021-07-05 21:12:05.825][8792][][gs_ctl]: gs_ctl started,datadir is /gaussdb/data/db1 
[2021-07-05 21:12:05.904][8792][][gs_ctl]: /gaussdb/data/db1/postgresql.conf cannot be opened..
</code></pre>
<p>数据库服务启动失败</p>
<h3><a id="23__108"></a>2.3 数据库恢复</h3>
<p>利用cp命令恢复数据库</p>
<pre><code class="lang-linux"> cp -r /home/omm/physical/backup/.  /gaussdb/data/db1
</code></pre>
<p>备份完后查看db1中内容</p>
<pre><code class="lang-linux">cd /gaussdb/data/db1
ls
</code></pre>
<p>结果显示如下：</p>
<pre><code class="lang-linux">backup_label        pg_ctl.lock       pg_replslot      postgresql.conf.bak
backup_label.old    pg_errorinfo      pg_serial        postgresql.conf.lock
base                pg_hba.conf       pg_snapshots     server.crt
cacert.pem          pg_hba.conf.bak   pg_stat_tmp      server.key
global              pg_hba.conf.lock  pg_tblspc        server.key.cipher
gswlm_userinfo.cfg  pg_ident.conf     pg_twophase      server.key.rand
mot.conf            pg_llog           PG_VERSION
pg_clog             pg_multixact      pg_xlog
pg_csnlog           pg_notify         postgresql.conf
</code></pre>
<p>此时再次启动数据库服务</p>
<pre><code class="lang-linux">gs_om -t start
</code></pre>
<p>显示结果如下，数据库服务重新启动，备份恢复成功</p>
<pre><code class="lang-linux">Starting cluster.
=========================================
=========================================
Successfully started.
</code></pre>
<h2><a id="3_141"></a>3.实验心得</h2>
<p>（1）在做过实验后不难体会到物理备份就是将数据库的关键文件拷贝到指定目录，在数据库遭到破坏后将指定目录文件拷贝回去的方法。<br />
（2）总结该实验的步骤：创建用于存放备份的目录—使用gs_basebackup进行备份——利用rm模拟数据库的破坏——利用cp命令将备份文件复制回遭到破坏的目录。<br />
（3）openGauss有趣的命令很多，有待大家一起发掘探讨:-D</p>

注：本篇文章为原创文章，转载请注明出处哦～
