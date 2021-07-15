+++

title = "【openGauss】gsql客户端工具（一）实验介绍&&gsql客户端工具.md" 

date = "2021-07-09" 

tags = ["【openGauss】gsql客户端工具（一）实验介绍&&gsql客户端工具.md"] 

archives = "2021-07" 

author = "SogK1997" 

summary = "【openGauss】gsql客户端工具（一）实验介绍&&gsql客户端工具.md"

img = "/zh/post/zhengwen2/img/img4.jpg" 

times = "12:30"

+++

# 【openGauss】gsql客户端工具（一）实验介绍&&gsql客户端工具.md<a name="ZH-CN_TOPIC_0000001085018737"></a>
<p><h3>gsql客户端工具</h3><ul><ul><li><a href="#___2">前  言</a></li><ul><li><a href="#_6">简介</a></li><li><a href="#_10">内容描述</a></li><li><a href="#_14">前置条件</a></li></ul></ul><li><a href="#_24">客户端工具</a></li><ul><li><a href="#11__26">1.1 实验介绍</a></li><ul><li><a href="#111__28">1.1.1 关于本实验</a></li><li><a href="#112__32">1.1.2 实验目的</a></li></ul><li><a href="#12_gsql_39">1.2 gsql客户端工具</a></li><ul><li><a href="#121_gsql_43">1.2.1 gsql连接数据库</a></li><li><a href="#1211__47">1.2.1.1 确认连接信息</a></li><ul><li><a href="#1212__78">1.2.1.2 本地连接数据库</a></li></ul><li><a href="#122_gsql_111">1.2.2 gsql获取帮助</a></li><ul><li><a href="#1222__113">1.2.2.2 连接数据库时，可以使用如下命令获取帮助信息</a></li><li><a href="#1223__128">1.2.2.3 连接到数据库后，可以使用如下命令获取帮助信息</a></li></ul><li><a href="#123_gsql_182">1.2.3 gsql命令使用</a></li><ul><li><a href="#1231__184">1.2.3.1 前提条件</a></li><li><a href="#1232__192">1.2.3.2 执行一条字符串命令</a></li><li><a href="#1233__200">1.2.3.3 使用文件作为命令源而不是交互式输入</a></li><li><a href="#1234_lllist_240">1.2.3.4 列出所有可用的数据库（\l的l表示list）</a></li><li><a href="#1235_gsqlNAMEVALUE_v_248">1.2.3.5 设置gsql变量NAME为VALUE 关键字:`-v`</a></li><li><a href="#1236_gsql_271">1.2.3.6 打印gsql版本信息。</a></li><li><a href="#1237__L_279">1.2.3.7 使用文件作为输出源 关键字:`-L`</a></li><li><a href="#1238_FILENAME_o_333">1.2.3.8 将所有查询输出重定向到文件FILENAME 关键字:`-o`</a></li><li><a href="#1239__q_373">1.2.3.9 安静模式 关键字:`-q`</a></li><li><a href="#12310__S_399">1.2.3.10 单行运行模式 关键字:`-S`</a></li><li><a href="#12311__r_429">1.2.3.11 编辑模式 关键字:`-r`</a></li><li><a href="#12312__460">1.2.3.12 远程使用用户名和密码连接数据库</a></li></ul><li><a href="#124_gsql_481">1.2.4 gsql元命令使用</a></li><ul><li><a href="#1241__483">1.2.4.1 前提条件</a></li><li><a href="#1242__499">1.2.4.2 打印当前查询缓冲区到标准输出</a></li><li><a href="#1243__539">1.2.4.3 导入数据</a></li><li><a href="#1244__618">1.2.4.4 查询表空间</a></li><li><a href="#1245__d_628">1.2.4.5 查询表的属性 关键字:`\d+`</a></li><li><a href="#1246__di_655">1.2.4.6 查询索引信息 关键字:`\di+`</a></li><li><a href="#1247__c_db_679">1.2.4.7 切换数据库 关键字:`\c db`</a></li></ul></ul></ul></ul></p>
<h2><a id="___2"></a>
<h2><a id="___2"></a>前  言</h2>
<p><a href="https://docs.tigergraph.com/dev/gsql-ref" target="_blank">gsql命令参考官方文档</a></p>
<h3><a id="_6"></a>简介</h3>
<p>本指导书适用于对数据库开发调试工具的使用，通过该指导书可以使用gsql数据库开发调试工具连接openGauss数据库。</p>
<h3><a id="_10"></a>内容描述</h3>
<p>本实验指导书主要内容为使用gsql数据库开发调试工具连接openGauss数据库。</p>
<h3><a id="_14"></a>前置条件</h3>
<ul>
<li>由于本实验主要是在openEuler操作系统上进行gsql开发调试工具连接数据库，需要掌握Linux系统的基本操作和系统命令，详细请参见附录一。</li>
<li>连接数据库后可以使用gsql元命令管理和使用数据库，需要掌握openGauss数据库的基本操作，数据库基本操作参见附录二。<br />
实验环境说明</li>
<li>组网说明<br />
本实验环境为openGauss数据库管理系统，安装在本机virtualbox的openEuler服务器上。</li>
</ul>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-4dee67a7-3adb-4939-8dfe-40aedb1ee4ed.png" alt="image.png" /></p>
<h1><a id="_24"></a>客户端工具</h1>
<h2><a id="11__26"></a>1.1 实验介绍</h2>
<h3><a id="111__28"></a>1.1.1 关于本实验</h3>
<p>本实验主要描述openGauss数据库的客户端工具的使用和连接数据库的方法。</p>
<h3><a id="112__32"></a>1.1.2 实验目的</h3>
<ul>
<li>掌握gsql客户端工具本地连接数据库的方法;</li>
<li>掌握gsql客户端工具远程连接数据库的方法;</li>
<li>掌握gsql客户端工具使用方法；</li>
<li>掌握图形化界面客户端工具Data Studio的安装及使用方法。</li>
</ul>
<h2><a id="12_gsql_39"></a>1.2 gsql客户端工具</h2>
<p>gsql是openGauss提供在命令行下运行的数据库连接工具，可以通过此工具连接服务器并对其进行操作和维护，除了具备操作数据库的基本功能，gsql还提供了若干高级特性，便于用户使用。</p>
<h3><a id="121_gsql_43"></a>1.2.1 gsql连接数据库</h3>
<p>gsql是openGauss自带的客户端工具。使用gsql连接数据库，可以交互式地输入、编辑、执行SQL语句。</p>
<h3><a id="1211__47"></a>1.2.1.1 确认连接信息</h3>
<p>客户端工具通过数据库主节点连接数据库。因此连接前，需获取数据库主节点所在服务器的IP地址及数据库主节点的端口号信息。</p>
<ul>
<li>步骤 1切换到omm用户，以操作系统用户omm登录数据库主节点。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">[root@db1 script]<span class="hljs-comment"># su - omm </span>
</code></div></pre>
<ul>
<li>步骤 2使用<code>gs_om -t status --detail</code>命令查询openGauss各实例情况。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">[omm@db1 ~]$ gs_om -t status --detail
</code></div></pre>
<p>情况显示如下：<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-032bd0af-c03b-48df-95d5-bcdd1d30df83.png" alt="image.png" /><br />
如上部署了数据库主节点实例的服务器IP地址为<code>192.168.56.101</code>。数据库主节点数据路径为<code>“/gaussdb/data/db1997</code>。</p>
<ul>
<li>步骤 3确认数据库主节点的端口号。<br />
在步骤2查到的数据库主节点数据路径下的postgresql.conf文件中查看端口号信息。示例如下：<br />
要根据自己的主节点<strong>修改路径</strong></li>
</ul>
<pre><div class="hljs"><code class="lang-bash">[omm@db1 ~]$ cat /gaussdb/data/db1997/postgresql.conf | grep port
</code></div></pre>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-41c513f4-65e0-4946-8c98-dc236ac804e0.png" alt="image.png" /><br />
<code>26000</code>为数据库主节点的端口号。<br />
请在实际操作中记录<strong>数据库主节点实例的服务器IP地址</strong>，<strong>数据路径和端口号</strong>，并在之后操作中<strong>按照实际情况进行替换</strong>。</p>
<h4><a id="1212__78"></a>1.2.1.2 本地连接数据库</h4>
<ul>
<li>步骤 1切换到omm用户，以操作系统用户omm登录数据库主节点。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">su - omm
</code></div></pre>
<ul>
<li>步骤 2启动数据库服务</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">gs_om -t start
</code></div></pre>
<ul>
<li>步骤 3连接数据库。<br />
执行如下命令连接数据库。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">[omm@db1 ~]$ gsql -d postgres -p 26000 -r 
</code></div></pre>
<p>其中postgres为需要连接的数据库名称，26000为数据库主节点的端口号。请根据实际情况替换。<br />
连接成功后，系统显示类似如下信息：<br />
<img src="https://img-blog.csdnimg.cn/20210602013401103.png" alt="在这里插入图片描述" /><br />
omm用户是管理员用户，因此系统显示<code>DBNAME=#</code>。若使用普通用户身份登录和连接数据库，系统显示<code>DBNAME=&gt;</code><br />
<code>Non-SSL connection</code>表示未使用SSL方式连接数据库。如果需要高安全性时，请用<strong>SSL进行安全的TCP/IP连接</strong>。</p>
<ul>
<li>步骤 4退出数据库。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \q       </span>
</code></div></pre>
<h3><a id="122_gsql_111"></a>1.2.2 gsql获取帮助</h3>
<h4><a id="1222__113"></a>1.2.2.2 连接数据库时，可以使用如下命令获取帮助信息</h4>
<p>切换到omm用户。</p>
<pre><div class="hljs"><code class="lang-bash">su - omm
</code></div></pre>
<p>使用如下命令获取帮助信息</p>
<pre><div class="hljs"><code class="lang-bash">gsql --<span class="hljs-built_in">help</span>
</code></div></pre>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-32284d91-33f3-4c13-b42f-f0059cf6a39e.png" alt="image.png" /></p>
<h4><a id="1223__128"></a>1.2.2.3 连接到数据库后，可以使用如下命令获取帮助信息</h4>
<ul>
<li>步骤 1使用如下命令连接数据库。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">gsql -d postgres -p 26000 -r 
</code></div></pre>
<ul>
<li>步骤 2输入help指令。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># help</span>
</code></div></pre>
<p><img src="https://img-blog.csdnimg.cn/20210602013648235.png" alt="在这里插入图片描述" /></p>
<ul>
<li>步骤 3查看版权信息。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \copyright</span>
</code></div></pre>
<p><img src="https://img-blog.csdnimg.cn/20210602013835701.png" alt="在这里插入图片描述" /></p>
<ul>
<li>步骤 4查看openGauss支持的所有SQL语句。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \h</span>
</code></div></pre>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-7b7b2bc1-7c65-41d4-8b3d-ef52f87cb278.png" alt="image.png" /></p>
<ul>
<li>步骤 5查看CREATE DATABASE命令的参数可使用下面的命令。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \help CREATE DATABASE</span>
</code></div></pre>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-86f3ca18-8d0d-4e9f-9343-20881feaa12a.png" alt="image.png" /></p>
<ul>
<li>步骤 6查看gsql支持的命令。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \? </span>
</code></div></pre>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-096afa72-8840-4499-8375-6c7069c6f0c6.png" alt="image.png" /></p>
<ul>
<li>步骤 7退出数据库</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \q</span>
</code></div></pre>
<h3><a id="123_gsql_182"></a>1.2.3 gsql命令使用</h3>
<h4><a id="1231__184"></a>1.2.3.1 前提条件</h4>
<p>以下操作在openGauss的数据库主节点所在主机上执行（本地连接数据库），切换到omm用户。</p>
<pre><div class="hljs"><code class="lang-bash">su - omm
</code></div></pre>
<h4><a id="1232__192"></a>1.2.3.2 执行一条字符串命令</h4>
<p>gsql命令直接执行一条显示版权信息的字符串命令</p>
<pre><div class="hljs"><code class="lang-bash">gsql -d postgres -p 26000 -c <span class="hljs-string">"\copyright"</span>
</code></div></pre>
<h4><a id="1233__200"></a>1.2.3.3 使用文件作为命令源而不是交互式输入</h4>
<ul>
<li>步骤 1创建文件夹存放相关文档。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">mkdir /home/omm/openGauss
</code></div></pre>
<ul>
<li>步骤 2创建文件，例如文件名为“mysql.sql”，并写入可执行sql语句“select * from pg_user;”。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">vi /home/omm/openGauss/mysql.sql
</code></div></pre>
<p>文件打开输入i，进入INSERT模式，输入<code> select * from pg_user;</code></p>
<pre><div class="hljs"><code class="lang-bash">select * from pg_user;
</code></div></pre>
<ul>
<li>步骤 3执行如下命令使用文件作为命令源。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">gsql -d postgres -p 26000 -f  /home/omm/openGauss/mysql.sql     
</code></div></pre>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-3a553449-c3de-473c-ab44-cd5832631944.png" alt="image.png" /></p>
<ul>
<li>步骤 4如果FILENAME是-（连字符），则从标准输入读取。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">gsql -d postgres -p 26000 -f -
postgres=<span class="hljs-comment"># select * from pg_user;</span>
</code></div></pre>
<ul>
<li>步骤 5退出数据库连接。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \q   </span>
</code></div></pre>
<h4><a id="1234_lllist_240"></a>1.2.3.4 列出所有可用的数据库（\l的l表示list）</h4>
<pre><div class="hljs"><code class="lang-bash">gsql -d postgres -p 26000 -l   
</code></div></pre>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-03c09784-9129-4847-a8ea-8394bce5ef8a.png" alt="image.png" /></p>
<h4><a id="1235_gsqlNAMEVALUE_v_248"></a>1.2.3.5 设置gsql变量NAME为VALUE 关键字:<code>-v</code></h4>
<ul>
<li>步骤 1设置foo的值为bar。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">gsql -d postgres -p 26000 -v foo=bar       
</code></div></pre>
<ul>
<li>步骤 2在数据库能够显示foo的值。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \echo :foo</span>
bar
</code></div></pre>
<p><img src="https://img-blog.csdnimg.cn/20210602171031627.png" alt="在这里插入图片描述" /></p>
<ul>
<li>步骤 3退出数据库连接。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=&gt; \q
</code></div></pre>
<h4><a id="1236_gsql_271"></a>1.2.3.6 打印gsql版本信息。</h4>
<pre><div class="hljs"><code class="lang-bash">gsql -V
</code></div></pre>
<p><img src="https://img-blog.csdnimg.cn/20210602014558673.png" alt="在这里插入图片描述" /></p>
<h4><a id="1237__L_279"></a>1.2.3.7 使用文件作为输出源 关键字:<code>-L</code></h4>
<ul>
<li>步骤 1创建文件，例如文件名为“output.txt”。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">touch  /home/omm/openGauss/output.txt
</code></div></pre>
<p><img src="https://img-blog.csdnimg.cn/20210602170612857.png" alt="在这里插入图片描述" /></p>
<ul>
<li>步骤 2执行如下命令，除了正常的输出源之外，把所有查询输出记录到文件中。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">gsql -d postgres -p 26000 -L /home/omm/openGauss/output.txt
</code></div></pre>
<p><img src="https://img-blog.csdnimg.cn/20210602171104963.png" alt="在这里插入图片描述" /></p>
<p>进入gsql环境，输入以下语句：</p>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># create table mytable (firstcol int);</span>
</code></div></pre>
<p>CREATE TABLE<br />
<img src="https://img-blog.csdnimg.cn/20210602171142536.png" alt="在这里插入图片描述" /></p>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># insert into mytable values(100);</span>
</code></div></pre>
<p>INSERT 0 1<br />
<img src="https://img-blog.csdnimg.cn/20210602171153902.png" alt="在这里插入图片描述" /></p>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># select * from mytable ;</span>
</code></div></pre>
<p><img src="https://img-blog.csdnimg.cn/20210602171229460.png" alt="在这里插入图片描述" /><br />
退出数据库</p>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \q</span>
</code></div></pre>
<ul>
<li>步骤 3查看“output.txt”文档中的内容如下：</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">cat /home/omm/openGauss/output.txt
</code></div></pre>
<p>显示如下：<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-25863942-4445-4dc9-87e3-b84990d2edbf.png" alt="image.png" /></p>
<h4><a id="1238_FILENAME_o_333"></a>1.2.3.8 将所有查询输出重定向到文件FILENAME 关键字:<code>-o</code></h4>
<ul>
<li>步骤 1创建文件，例如文件名为“outputOnly.txt”。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">touch /home/omm/openGauss/outputOnly.txt
</code></div></pre>
<p><img src="https://img-blog.csdnimg.cn/20210602172023589.png" alt="在这里插入图片描述" /></p>
<ul>
<li>步骤 2执行如下命令。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">gsql -d postgres -p 26000 -o /home/omm/openGauss/outputOnly.txt 
</code></div></pre>
<p><img src="https://img-blog.csdnimg.cn/20210602172037717.png" alt="在这里插入图片描述" /></p>
<ul>
<li>步骤 3进入gsql环境，输入以下语句：</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># drop table mytable;</span>
postgres=<span class="hljs-comment"># create table mytable (firstcol int);</span>
postgres=<span class="hljs-comment"># insert into mytable values(100);</span>
postgres=<span class="hljs-comment"># select * from mytable;</span>
postgres=<span class="hljs-comment"># \q </span>
</code></div></pre>
<p><img src="https://img-blog.csdnimg.cn/2021060217210833.png" alt="在这里插入图片描述" /></p>
<p>所有操作都没有回显。</p>
<ul>
<li>步骤 4查看“outputOnly.txt”文档中的内容如下：</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">cat /home/omm/openGauss/outputOnly.txt
</code></div></pre>
<p><img src="https://img-blog.csdnimg.cn/20210602172118455.png" alt="在这里插入图片描述" /></p>
<h4><a id="1239__q_373"></a>1.2.3.9 安静模式 关键字:<code>-q</code></h4>
<p><strong>安静模式：执行时不会打印出额外信息</strong></p>
<pre><div class="hljs"><code class="lang-bash">gsql -d postgres -p 26000 -q
</code></div></pre>
<p>进入gsql环境，输入以下语句：</p>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># create table t_test (firstcol int);</span>
postgres=<span class="hljs-comment"># insert into t_test values(200);</span>
postgres=<span class="hljs-comment"># select * from t_test;</span>
 firstcol 
----------
      200
(1 row)

postgres=<span class="hljs-comment"># \q</span>
</code></div></pre>

<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-fed68d46-5a4a-4e16-ba40-ac80c59cbd6e.png" alt="image.png" /></p>
<p>连接上数据库，<strong>创建数据库和插入数据等都没有回显信息</strong>。</p>
<h4><a id="12310__S_399"></a>1.2.3.10 单行运行模式 关键字:<code>-S</code></h4>
<p><strong>单行运行模式：这时每个命令都将由换行符结束，像分号那样</strong></p>
<pre><div class="hljs"><code class="lang-bash">gsql -d postgres -p 26000 -S
</code></div></pre>
<p>进入gsql环境，输入以下语句：</p>
<pre><div class="hljs"><code class="lang-bash">postgres^<span class="hljs-comment"># select * from t_test;</span>
 firstcol 
----------
      200
(1 row)

postgres^<span class="hljs-comment"># select * from t_test</span>
 firstcol 
----------
      200
(1 row)

postgres=<span class="hljs-comment"># \q</span>
</code></div></pre>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-f94bb3c7-eebb-48ec-8939-404699839b3f.png" alt="image.png" /></p>
<p>语句最后结尾有<code>;</code>号和没有<code>;</code>号，效果都<strong>一样</strong>。</p>
<h4><a id="12311__r_429"></a>1.2.3.11 编辑模式 关键字:<code>-r</code></h4>
<ul>
<li>步骤 1如下命令连接数据库，开启在客户端操作中可以进行编辑的模式。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">gsql -d postgres -p 26000 -r
</code></div></pre>
<ul>
<li>步骤 2进入gsql环境，输入以下语句：</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">select * from t_test;
</code></div></pre>
<p><img src="https://img-blog.csdnimg.cn/20210602172804475.png" alt="在这里插入图片描述" /></p>
<ul>
<li>
<p>步骤 3写完后不要按回车，光标在最后闪烁。<br />
<img src="https://img-blog.csdnimg.cn/20210602172807553.png" alt="在这里插入图片描述" /></p>
</li>
<li>
<p>步骤 4按“向左”键讲光标移动到“<em>”，将“</em>”修改为“firstcol”。<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-87216cae-af05-4676-8d31-8a125475ff19.png" alt="image.png" /><br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-65449b7e-d663-43c0-89be-b71ae4b7c98f.png" alt="image.png" /></p>
</li>
</ul>
<p>编辑模式“上下左右键”，“删除键”和“退格键”都可以使用，并且按下“向上”、“向下”键可以切换输入过的命令。</p>
<ul>
<li>步骤 5退出数据库连接</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \q</span>
</code></div></pre>
<h4><a id="12312__460"></a>1.2.3.12 远程使用用户名和密码连接数据库</h4>
<p>远程使用jack用户连接ip地址为192.168.0.58端口号为26000的数据库</p>
<ul>
<li>步骤 1登录客户端主机(192.168.0.58)，使用以下命令远程登录数据库。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">gsql -d postgres -h 192.168.0.58 -U jack -p 26000 -W Bigdata@123;
</code></div></pre>
<p>-d参数指定目标数据库名、-U参数指定数据库用户名、-h参数指定主机名、-p参数指定端口号信息,-W参数指定数据库用户密码。<br />
进入gsql环境，显示如下：</p>
<pre><div class="hljs"><code class="lang-bash">gsql ((openGauss 1.0 build ec0e781b) compiled at 2020-04-27 17:25:57 commit 2144 last mr 131 )
SSL connection (cipher: DHE-RSA-AES256-GCM-SHA384, bits: 256)
Type <span class="hljs-string">"help"</span> <span class="hljs-keyword">for</span> <span class="hljs-built_in">help</span>.

postgres=&gt; 
</code></div></pre>
<h3><a id="124_gsql_481"></a>1.2.4 gsql元命令使用</h3>
<h4><a id="1241__483"></a>1.2.4.1 前提条件</h4>
<p>以下操作在openGauss的数据库主节点<strong>所在主机上执行</strong>（本地连接数据库），使用gsql连接到openGauss数据库。</p>
<ul>
<li>步骤 1切换到omm用户，以操作系统用户omm登录数据库主节点。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">su - omm
</code></div></pre>
<ul>
<li>步骤 2gsql连接数据库。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">gsql -d postgres -p 26000 -r 
</code></div></pre>
<h4><a id="1242__499"></a>1.2.4.2 打印当前查询缓冲区到标准输出</h4>
<ul>
<li>步骤 1创建“outputSQL.txt”文件。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">touch ./home/omm/openGauss/outputSQL.txt
</code></div></pre>
<p>下图经历了一段切换目录的过程<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-503b5275-f280-4d1a-8a0a-0b0bfcc50592.png" alt="image.png" /></p>
<ul>
<li>步骤 2连接数据库。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">gsql -d postgres -p 26000 -r
</code></div></pre>
<ul>
<li>步骤 3输入以下语句。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># select * from pg_roles;</span>
</code></div></pre>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-ed78ac3f-9e41-4310-a4af-d7b056a5b65c.png" alt="image.png" /></p>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \w /home/omm/openGauss/outputSQL.txt</span>
postgres=<span class="hljs-comment"># \q</span>
</code></div></pre>
<p><img src="https://img-blog.csdnimg.cn/20210602200326168.png" alt="在这里插入图片描述" /></p>
<ul>
<li>步骤 4打开文件“outputSQL.txt”文件，查看其中内容。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">cat /home/omm/openGauss/outputSQL.txt
</code></div></pre>
<p>显示如下：<br />
<img src="https://img-blog.csdnimg.cn/20210602200342569.png" alt="在这里插入图片描述" /></p>
<h4><a id="1243__539"></a>1.2.4.3 导入数据</h4>
<ul>
<li>步骤 1连接数据库。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">gsql -d postgres -p 26000 -r
</code></div></pre>
<ul>
<li>步骤 2创建目标表a。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># CREATE TABLE a(a int);</span>
</code></div></pre>
<p><img src="https://img-blog.csdnimg.cn/20210602200448921.png" alt="在这里插入图片描述" /></p>
<ul>
<li>步骤 3导入数据，从stdin拷贝数据到目标表a。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \copy a from stdin;</span>
</code></div></pre>
<p><img src="https://img-blog.csdnimg.cn/20210602200505478.png" alt="在这里插入图片描述" /></p>
<p>出现&gt;&gt;符号提示时，输入数据，输入<code>\.</code>时结束。<br />
<img src="https://img-blog.csdnimg.cn/202106022005449.png" alt="在这里插入图片描述" /></p>
<pre><div class="hljs"><code class="lang-bash">&gt;&gt; 1 
&gt;&gt; 2 
&gt;&gt; \.
</code></div></pre>
<ul>
<li>步骤 4查询导入目标表a的数据。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># SELECT * FROM a; </span>
</code></div></pre>
<p><img src="https://img-blog.csdnimg.cn/2021060220062158.png" alt="在这里插入图片描述" /><br />
退出数据库：</p>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \q</span>
</code></div></pre>
<ul>
<li>步骤 5从本地文件拷贝数据到目标表a，创建文件/home/omm/openGauss/2.csv。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">vi /home/omm/openGauss/2.csv
</code></div></pre>
<ul>
<li>步骤 6输入i，切换到INSERT模式，插入数据如下:<br />
3<br />
4<br />
5<br />
如果有多个数据，分隔符为<code>，</code>。<br />
在导入过程中，若数据源文件比外表定义的列数多，则忽略行尾多出来的列。</li>
<li>步骤 7按下Esc键，输入<code>:wq</code>后回车，保存并退出。</li>
<li>步骤 8连接数据库。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">gsql -d postgres -p 26000 -r
</code></div></pre>
<ul>
<li>步骤 9如下命令拷贝数据到目标表。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \copy a FROM '/home/omm//openGauss/2.csv' WITH (delimiter',',IGNORE_EXTRA_DATA 'on');</span>
</code></div></pre>
<ul>
<li>步骤 10查询导入目标表a的数据。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># SELECT * FROM a; </span>
</code></div></pre>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-262a17fd-c3e9-44e5-bf94-36fc05b7695c.png" alt="image.png" /></p>
<h4><a id="1244__618"></a>1.2.4.4 查询表空间</h4>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \db</span>
</code></div></pre>
<p>显示如下：</p>
<p><img src="https://img-blog.csdnimg.cn/20210602200915517.png" alt="在这里插入图片描述" /></p>
<h4><a id="1245__d_628"></a>1.2.4.5 查询表的属性 关键字:<code>\d+</code></h4>
<ul>
<li>步骤 1创建表customer_t1。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># DROP TABLE IF EXISTS customer_t1;</span>
postgres=<span class="hljs-comment"># CREATE TABLE customer_t1 </span>
</code></div></pre>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-58538114-779f-4de0-80eb-80e3997ed034.png" alt="image.png" /></p>
<ul>
<li>步骤 2查询表的属性。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \d+;</span>
</code></div></pre>
<p>显示如下：			<br />
<img src="https://img-blog.csdnimg.cn/20210602201422706.png" alt="在这里插入图片描述" /></p>
<ul>
<li>步骤 3查询表customer_t1的属性。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \d+ customer_t1;</span>
</code></div></pre>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210706-746460e0-c095-41e0-bd46-de60a6efb3e2.png" alt="image.png" /></p>
<h4><a id="1246__di_655"></a>1.2.4.6 查询索引信息 关键字:<code>\di+</code></h4>
<ul>
<li>步骤 1在表customer_t1上创建索引。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">create index customer_t1_index1 on customer_t1(c_customer_id);
</code></div></pre>
<ul>
<li>步骤 2查询索引信息。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \di+；</span>
</code></div></pre>
<p><img src="https://img-blog.csdnimg.cn/20210602201558311.png" alt="在这里插入图片描述" /></p>
<ul>
<li>步骤 3查询customer_t1_index1索引的信息。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \di+ customer_t1_index1</span>
</code></div></pre>
<p><img src="https://img-blog.csdnimg.cn/20210602201619413.png" alt="在这里插入图片描述" /></p>
<h4><a id="1247__c_db_679"></a>1.2.4.7 切换数据库 关键字:<code>\c db</code></h4>
<ul>
<li>步骤 1创建数据库。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">DROP DATABASE IF EXISTS db_tpcc02;
CREATE DATABASE db_tpcc02;
</code></div></pre>
<ul>
<li>步骤 2切换数据库。</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \c db_tpcc02;</span>
</code></div></pre>
<p>显示如下：</p>
<p><img src="https://img-blog.csdnimg.cn/20210602201744146.png" alt="在这里插入图片描述" /></p>
<ul>
<li>步骤 3退出数据库：</li>
</ul>
<pre><div class="hljs"><code class="lang-bash">postgres=<span class="hljs-comment"># \q</span>

