title =  ”【openGauss】gsql客户端工具（二）gsql客户端工具之Data Studio客户端工具" 

date = "2021-07-09" 

tags = ["【openGauss】gsql客户端工具（二）gsql客户端工具之Data Studio客户端工具"] 

archives = "2021-07" 

author = "SogK1997" 

summary = "【openGauss】gsql客户端工具（二）gsql客户端工具之Data Studio客户端工具"

img = "/zh/post/zhengwen2/img/img5.jpg" 

times = "12:30"

+++

# 【openGauss】gsql客户端工具（二）gsql客户端工具之Data Studio客户端工具<a name="ZH-CN_TOPIC_0000001085018737"></a>
<div class="toc">
 <h3>Data Studio客户端工具</h3>
 <ul><li><ul><li><a href="#_1">写在前面</a></li><li><a href="#13_Data_Studio_3">1.3 Data Studio客户端工具</a></li><li><ul><li><a href="#131__26">1.3.1 准备连接环境</a></li><li><a href="#132_26000_96">1.3.2 确定26000端口是否放开</a></li><li><a href="#font_colorred133_font_101"><font color="red">1.3.3 软件包下载及安装</font></a></li><li><a href="#134_Data_Studio_122">1.3.4 Data Studio用户界面</a></li><li><a href="#135__141">1.3.5 获取工具使用手册</a></li></ul>
  </li></ul>
 </li></ul>
</div>
<p></p> 
<h2><a id="_1"></a>写在前面</h2> 
<blockquote> 
 <p>因为博主并没有购买使用华为云的openGauss及openEurler。使用的是再VirtualBox上的镜像搭建起来的openGauss。因此对于1.3.2在华为云上配置安全策略&#xff0c;开放端口的操作等可以忽略。直接跳转到1.3.3软件包下载进行的后序操作。</p> 
</blockquote> 
<h2><a id="13_Data_Studio_3"></a>1.3 Data Studio客户端工具</h2> 
<p>Data Studio是一个<strong>集成开发环境&#xff08;IDE&#xff09;</strong>&#xff0c;帮助数据库开发人员便捷地构建应用程序&#xff0c;以<strong>图形化界面形式提供数据库关键特性</strong>。<br /> 数据库开发人员仅需掌握少量的编程知识&#xff0c;即可使用该工具进行数据库对象操作。<br /> <strong>Data Studio提供丰富多样的特性&#xff0c;例如&#xff1a;</strong></p> 
<ul><li>创建和管理数据库对象</li><li>执行SQL语句/脚本</li><li>编辑和执行PL/SQL语句</li><li>图形化查看执行计划和开销</li><li>导出表数据等</li></ul> 
<p><strong>创建和管理数据库对象包括&#xff1a;</strong></p> 
<ul><li>数据库</li><li>模式</li><li>函数</li><li>过程</li><li>表</li><li>序列</li><li>索引</li><li>视图</li><li>表空间</li><li>同义词</li></ul> 
<p>Data Studio还提供<strong>SQL助手</strong>用于在<strong>SQL终端</strong>和<strong>PL/SQLViewer</strong>中<strong>执行各种查询/过程/函数</strong>。</p> 
<h3><a id="131__26"></a>1.3.1 准备连接环境</h3> 
<ul><li>步骤 1修改数据库的<code>pg_hba.conf</code>文件。</li></ul> 
<p>在GS_HOME中查找pg_hba.conf文件&#xff0c;本实验中数据库GS_HOME设置的为<code>/gaussdb/data/db1</code>(<font color="red">db1修改为自己的数据库名字&#xff0c;例如博主的db1997</font>)&#xff0c;实际操作中GS_HOME地址可以查看安装时的配置文件&#xff1a;<code>&lt;PARAM name&#61;&#34;dataNode1&#34; value&#61;&#34;/gaussdb/data/db1&#34;/&gt;</code>。</p> 
<pre><code class="prism language-bash"><span class="token punctuation">[</span>root&#64;db1 ~<span class="token punctuation">]</span><span class="token comment"># cd /gaussdb/data/db1</span>
<span class="token punctuation">[</span>root&#64;ecs-b5cb db1<span class="token punctuation">]</span><span class="token comment"># vi pg_hba.conf</span>
</code></pre> 
<p><img src="https://img-blog.csdnimg.cn/20210602202925172.png" alt="在这里插入图片描述" /></p> 
<p><img src="https://img-blog.csdnimg.cn/20210602202717477.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /></p> 
<p>将以下内容添加进pg_hba.conf文件。</p> 
<pre><code class="prism language-bash">host all all 0.0.0.0/0 sha256
</code></pre> 
<p>具体如下&#xff1a;</p> 
<p><img src="https://img-blog.csdnimg.cn/20210602202902385.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /><br /> 切换至omm用户环境&#xff0c;使用gs_ctl将策略生效。</p> 
<pre><code class="prism language-bash"><span class="token punctuation">[</span>root&#64;db1 db1<span class="token punctuation">]</span><span class="token comment">#su - omm</span>
<span class="token punctuation">[</span>omm&#64;db1 ~<span class="token punctuation">]</span><span class="token variable">$gs_ctl</span> reload -D /gaussdb/data/db1997/
</code></pre> 
<p>返回结果为&#xff1a;<br /> <img src="https://img-blog.csdnimg.cn/20210602203040589.png" alt="在这里插入图片描述" /></p> 
<ul><li>步骤 2登陆数据库并创建“dboper”用户&#xff0c;密码为“dboper&#64;123”&#xff08;密码可自定义&#xff09;&#xff0c;同时进行授权&#xff0c;并退出数据库。</li></ul> 
<pre><code class="prism language-bash"><span class="token punctuation">[</span>omm&#64;db1 ~<span class="token punctuation">]</span><span class="token variable">$gsql</span> -d postgres -p 26000 -r
postgres<span class="token operator">&#61;</span><span class="token comment">#CREATE USER dboper IDENTIFIED BY &#39;dboper&#64;123&#39;;</span>
CREATE ROLE
postgres<span class="token operator">&#61;</span><span class="token comment">#alter user dboper sysadmin;</span>
ALTER ROLE
postgres<span class="token operator">&#61;</span><span class="token comment"># \q</span>
</code></pre> 
<p><img src="https://img-blog.csdnimg.cn/20210602203720810.png" alt="在这里插入图片描述" /></p> 
<p>退出OMM用户环境</p> 
<pre><code class="prism language-bash"><span class="token punctuation">[</span>omm&#64;ecs-b5cb ~<span class="token punctuation">]</span>$ <span class="token keyword">exit</span>
</code></pre> 
<p><img src="https://img-blog.csdnimg.cn/20210602203732196.png" alt="在这里插入图片描述" /></p> 
<ul><li>步骤 3修改数据库监听地址。<br /> 在GS_HOME中&#xff0c;本实验中数据库GS_HOME设置的为<code>/gaussdb/data/db1997</code>。</li></ul> 
<pre><code class="prism language-bash"><span class="token punctuation">[</span>root&#64;ecs-b5cb ecs-b5cb<span class="token punctuation">]</span><span class="token comment"># cd /gaussdb/data/db1997</span>
<span class="token punctuation">[</span>root&#64;db1 ~<span class="token punctuation">]</span><span class="token comment"># vi postgresql.conf</span>
</code></pre> 
<p>将listen_addresses的值修改成为 <code>*</code></p> 
<pre><code class="prism language-bash">listen_addresses <span class="token operator">&#61;</span> <span class="token string">&#39;*&#39;</span>
</code></pre> 
<p><img src="https://img-blog.csdnimg.cn/20210602204350195.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /></p> 
<p>修改完成后切换至OMM用户环境重启数据库生效&#xff08;-D后面的数据库默认路径&#xff0c;需要根据<strong>自己的数据库名字的实际情况</strong>进行修改&#xff09;。</p> 
<pre><code class="prism language-bash"><span class="token punctuation">[</span>root&#64;db1 db1<span class="token punctuation">]</span><span class="token comment">#su - omm</span>
<span class="token punctuation">[</span>omm&#64;db1 ~<span class="token punctuation">]</span><span class="token variable">$gs_ctl</span> restart -D /gaussdb/data/db1997/
</code></pre> 
<p><img src="https://img-blog.csdnimg.cn/20210602204458377.png" alt="在这里插入图片描述" /></p> 
<h3><a id="132_26000_96"></a>1.3.2 确定26000端口是否放开</h3> 
<ul><li>步骤 1打开华为云首页&#xff0c;登录后进入“控制台”&#xff0c;点击“弹性云服务器ECS”进入ECS列表。</li><li>步骤 2在云服务器控制台找到安装数据库主机的ECS&#xff0c;点击查看基本信息&#xff0c;找到安全组。</li><li>步骤 3点击进入安全组&#xff0c;选择“入方向规则”并点“添加规则”&#xff0c;进行26000端口设置。</li></ul> 
<h3><a id="font_colorred133_font_101"></a><font color="red">1.3.3 软件包下载及安装</font></h3> 
<ul><li> <p>步骤 1下载软件包。<br /> 获取参考地址&#xff1a;<br /> <a href="https://opengauss.obs.cn-south-1.myhuaweicloud.com/1.0.1/DataStudio_win_64.zip">https://opengauss.obs.cn-south-1.myhuaweicloud.com/1.0.1/DataStudio_win_64.zip</a></p> </li><li> <p>步骤 2解压安装。<br /> 将下载的软件包&#xff08;DataStudio_win_64.zip&#xff09;解压到自己指定的位置&#xff0c;比如解压至D盘&#xff0c;具体如下&#xff1a;</p> </li></ul> 
<blockquote> 
 <p>名字是自己任意取<br /> 主机一定是openGauss数据库安装所在的主机ip<br /> 端口号是26000<br /> 数据库&#xff0c;用户名和密码是三者互相对应的。</p> 
</blockquote> 
<p><strong>注意不启用SSL</strong></p> 
<ul><li>步骤 3连接数据库。<br /> 在Data Studio工具界面上&#xff0c;点击“文件”下的“新建连接”&#xff0c;进入如下设置界面&#xff1a;<br /> <img src="https://img-blog.csdnimg.cn/20210602211924406.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /><br /> 连接成功后我们就可以看到了<br /> <img src="https://img-blog.csdnimg.cn/20210602212248406.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /><br /> <strong>下面是粗暴的截取了一个短的GIF。</strong><br /> <img src="https://img-blog.csdnimg.cn/20210602212810793.gif#pic_center" alt="在这里插入图片描述" /></li></ul> 
<h3><a id="134_Data_Studio_122"></a>1.3.4 Data Studio用户界面</h3> 
<p>Data Studio主界面包括&#xff1a;</p> 
<ol><li>主菜单&#xff1a;提供使用Data Studio的基本操作&#xff1b;</li><li>工具栏&#xff1a;提供常用操作入口&#xff1b;</li><li>“SQL终端”页签&#xff1a;在该窗口&#xff0c;可以执行SQL语句和函数/过程&#xff1b;</li><li>“PL/SQL Viewer”页签&#xff1a;显示函数/过程信息&#xff1b;</li><li>编辑区域用于进行编辑操作&#xff1b;</li><li>“调用堆栈”窗格&#xff1a;显示执行栈&#xff1b;<br /> 7.“断点“窗格&#xff1a;显示断点信息&#xff1b;</li><li>“变量”窗格&#xff1a;显示变量及其变量值&#xff1b;</li><li>“SQL助手”页签&#xff1a;显示“SQL终端”和“PL/SQL Viewer”页签中输入信息的建议或参考&#xff1b;</li><li>“结果”页签&#xff1a;显示所执行的函数/过程或SQL语句的结果&#xff1b;</li><li>“消息”页签&#xff1a;显示进程输出。显示标准输入、标准输出和标准错误&#xff1b;</li><li>“对象浏览器”窗格&#xff1a;显示数据库连接的层级树形结构和用户有权访问的相关数据库对象&#xff1b;除公共模式外&#xff0c;所有默认创建的模式均分组在“系统模式”下&#xff0c;用户模式分组在相应数据库的“用户模式”下&#xff1b;</li><li>“最小化窗口窗格”&#xff1a;用于打开“调用堆栈”和“变量”窗格。该窗格仅在“调用堆栈”、“变量”窗格中的一个或多个窗格最小化时显示。</li><li>搜索工具栏&#xff1a;用于在“对象浏览器”窗格中搜索对象。<br /> 有些项不可见&#xff0c;除非触发特定功能。下图以openGauss界面为例说明&#xff1a;<br /> <img src="https://img-blog.csdnimg.cn/20210602213123296.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /></li></ol> 
<h3><a id="135__141"></a>1.3.5 获取工具使用手册</h3> 
<p>在Data Studio主界面的主菜单上点击帮助下的用户手册&#xff0c;具体如下&#xff1a;<br /> <img src="https://img-blog.csdnimg.cn/20210602213133268.png" alt="在这里插入图片描述" /></p> 
<p>点击后即可得到使用手册&#xff0c;如下&#xff1a;<br /> <img src="https://img-blog.csdnimg.cn/20210602213142163.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /></p> 
<p>本实验结束。</p>