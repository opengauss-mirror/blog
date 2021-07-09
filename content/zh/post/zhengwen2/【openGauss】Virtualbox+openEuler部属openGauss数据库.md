title = "【openGauss】Virtualbox+openEuler部属openGauss数据库" 

date = "2021-07-09" 

tags = ["【openGauss】Virtualbox+openEuler部属openGauss数据库"] 

archives = "2021-07" 

author = "SonK1997" 

summary = "【openGauss】Virtualbox+openEuler部属openGauss数据库接"

img = "/zh/post/zhengwen2/img/img20.jpg" 

times = "12:30"

+++

# 【openGauss】Virtualbox+openEuler部属openGauss数据库<a name="ZH-CN_TOPIC_0000001085018737"></a>
<div class="toc">
 <h3>Virtualbox&#43;openEuler部属openGauss数据库指导手册</h3>
 <ul><li><ul><li><a href="#___2">前 言</a></li><li><ul><li><a href="#_3">简介</a></li><li><a href="#_6">内容描述</a></li><li><a href="#_8">前置条件</a></li><li><a href="#_10">实验环境说明</a></li><li><a href="#_19">单机安装概览</a></li></ul>
   </li><li><a href="#openGauss_22">openGauss数据库安装</a></li><li><ul><li><a href="#11__23">1.1 实验介绍</a></li><li><ul><li><a href="#_24">关于本实验</a></li><li><a href="#_26">实验目的</a></li></ul>
    </li><li><a href="#12_VirtualBox_29">1.2 虚拟机VirtualBox下载及安装</a></li><li><a href="#13_openEuler2003LTS_38">1.3 openEuler-20.03-LTS镜像文件下载</a></li><li><a href="#14_VirtualBoxopenEuler2003LTS_42">1.4 VirtualBox下安装openEuler-20.03-LTS操作系统</a></li><li><a href="#15__57">1.5 操作系统环境准备</a></li><li><a href="#16_openGauss_96">1.6 安装openGauss数据库</a></li></ul>
   </li><li><a href="#_97">数据库使用</a></li><li><ul><li><a href="#17__99">1.7 前提条件</a></li><li><a href="#18__102">1.8 操作步骤</a></li></ul>
  </li></ul>
 </li></ul>
</div>
<p></p> 
<h2><a id="___2"></a>前 言</h2> 
<h3><a id="_3"></a>简介</h3> 
<blockquote> 
 <p>openGauss是关系型数据库&#xff0c;采用客户端/服务器&#xff0c;单进程多线程架构&#xff0c;支持单机和一主多备部署方式&#xff0c;备机可读&#xff0c;支持双机高可用和读扩展。<br /> 本实验主要描述openGauss数据库在openEuler 20.03-LTS上的单机安装部署。</p> 
</blockquote> 
<h3><a id="_6"></a>内容描述</h3> 
<blockquote> 
 <p>本实验主要内容为在openEuler 20.03-LTS上安装部署openGauss数据库&#xff0c;并进行简单的数据库相关操作。</p> 
</blockquote> 
<h3><a id="_8"></a>前置条件</h3> 
<blockquote> 
 <p>由于本实验主要是在openEuler操作系统上进行openGauss数据库的部署&#xff0c;需要掌握Linux系统的基本操作和系统命令&#xff0c;详细请参见附录一。</p> 
</blockquote> 
<h3><a id="_10"></a>实验环境说明</h3> 
<blockquote> 
 <p>组网说明<br /> 本实验环境为虚拟机VirtualBox 6.1.14 &#43; openEuler 20.03-LTS &#43; openGauss 1.1.0。<br /> 设备介绍<br /> 为了满足openGauss安装部署实验需要&#xff0c;建议每套实验环境采用以下配置&#xff1a;<br /> Linux操作系统 openEuler 20.03-LTS<br /> windows操作系统 win10 x86 64位<br /> 虚拟机 VirtualBox 6.1.14<br /> Python Python 3.7.X</p> 
</blockquote> 
<h3><a id="_19"></a>单机安装概览</h3> 
<p><img src="https://img-blog.csdnimg.cn/2021041422391612.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /></p> 
<h2><a id="openGauss_22"></a>openGauss数据库安装</h2> 
<h3><a id="11__23"></a>1.1 实验介绍</h3> 
<h4><a id="_24"></a>关于本实验</h4> 
<blockquote> 
 <p>本实验主要描述openGauss数据库在虚拟机VirtualBox&#43;openEuler上的安装配置。</p> 
</blockquote> 
<h4><a id="_26"></a>实验目的</h4> 
<blockquote> 
 <p>掌握虚拟机VirtualBox的安装配置方法&#xff1b;<br /> 掌握openGauss数据库安装部署方法。</p> 
</blockquote> 
<h3><a id="12_VirtualBox_29"></a>1.2 虚拟机VirtualBox下载及安装</h3> 
<blockquote> 
 <p>步骤 1 进入官方网站下载页面。<br /> 网址&#xff1a;<a href="https://www.virtualbox.org/wiki/Downloads">https://www.virtualbox.org/wiki/Downloads</a><br /> 点击” window主机” 下载windows版本的VirtualBox。<br /> 步骤 2下载完成后&#xff0c;双击执行文件进行安装。<br /> 下载后&#xff0c;文件名为&#xff1a;VirtualBox-6.1.14-140239-Win.exe&#xff0c;双击此执行文件进行安装&#xff0c;安装过程中存放地址可以根据自己想法去设置下&#xff0c;其他所有选项都可以默认&#xff0c;直接按下一步就行&#xff0c;最后安装成功。<br /> <img src="https://img-blog.csdnimg.cn/20210414224131549.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /><img src="https://img-blog.csdnimg.cn/20210414224207655.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /></p> 
</blockquote> 
<h3><a id="13_openEuler2003LTS_38"></a>1.3 openEuler-20.03-LTS镜像文件下载</h3> 
<blockquote> 
 <p>步骤 1进入华为开源镜像站的下载页面。<br /> 网址&#xff1a;<a href="https://mirrors.huaweicloud.com/openeuler/openEuler-20.03-LTS/ISO/x86_64/">https://mirrors.huaweicloud.com/openeuler/openEuler-20.03-LTS/ISO/x86_64/</a>&#xff0c;具体如下&#xff1a;<img src="https://img-blog.csdnimg.cn/20210414224313835.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /></p> 
</blockquote> 
<h3><a id="14_VirtualBoxopenEuler2003LTS_42"></a>1.4 VirtualBox下安装openEuler-20.03-LTS操作系统</h3> 
<p>步骤 1新建虚拟电脑。<br /> 打开VirtualBox软件。<img src="https://img-blog.csdnimg.cn/20210414225339487.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /><img src="https://img-blog.csdnimg.cn/20210414225706765.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /><img src="https://img-blog.csdnimg.cn/20210414225953260.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /></p> 
<blockquote> 
 <p>遇到问题&#xff1a;<a href="https://www.cnblogs.com/wh201906/p/11219468.html">VirtualBox中重建Host-Only网卡后无法启动虚拟机(VERR_INTNET_FLT_IF_NOT_FOUND)</a><br /> <img src="https://img-blog.csdnimg.cn/20210414230753243.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /></p> 
</blockquote> 
<p><img src="https://img-blog.csdnimg.cn/20210414230553118.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /><br /> <img src="https://img-blog.csdnimg.cn/20210414231539461.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /></p> 
<p><img src="https://img-blog.csdnimg.cn/20210414234821630.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /></p> 
<h3><a id="15__57"></a>1.5 操作系统环境准备</h3> 
<blockquote> 
 <p>为了操作方便&#xff0c;可以使用SSH工具&#xff08;比如&#xff1a;PuTTY等&#xff09;从本地电脑通过配置<font color="red">enp0s3网卡</font>的IP地址&#xff08;如&#xff1a;192.168.56.123&#xff09;来连接虚拟机&#xff0c;并使用ROOT用户来登录。<br /> <img src="https://img-blog.csdnimg.cn/20210414235207268.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /></p> 
</blockquote> 
<blockquote> 
 <p>关闭防火墙注意命令中是<font color="red">firewalld</font>而不是firewall<br /> 步骤 1关闭防火墙。<br /> 执行以下二个命令将防火墙关闭&#xff0c;</p> 
</blockquote> 
<pre><code class="prism language-bash">systemctl stop firewalld.service
systemctl disable firewalld.service&#xff0c;具体如下&#xff1a;
<span class="token punctuation">[</span>root&#64;db1 ~<span class="token punctuation">]</span><span class="token comment"># systemctl stop firewalld.service</span>
<span class="token punctuation">[</span>root&#64;db1 ~<span class="token punctuation">]</span><span class="token comment"># systemctl disable firewalld.service</span>
Removed symlink /etc/systemd/system/multi-user.target.wants/firewalld.service.
Removed symlink /etc/systemd/system/dbus-org.fedoraproject.FirewallD1.service.
<span class="token punctuation">[</span>root&#64;db1 ~<span class="token punctuation">]</span><span class="token comment">#</span>
</code></pre> 
<p><img src="https://img-blog.csdnimg.cn/20210414235917969.png" alt="在这里插入图片描述" /><br /> 因为测试数据&#xff0c;导致了追加性写入。参考资料&#xff1a;<a href="https://blog.csdn.net/CREATE_17/article/details/89440045?utm_medium&#61;distribute.pc_relevant.none-task-blog-2~default~BlogCommendFromMachineLearnPai2~default-1.control&amp;dist_request_id&#61;1331645.13456.16184162149154181&amp;depth_1-utm_source&#61;distribute.pc_relevant.none-task-blog-2~default~BlogCommendFromMachineLearnPai2~default-1.control">shell实战&#xff08;二&#xff09;&#xff1a;cat EOF 追加与覆盖文件</a></p> 
<blockquote> 
 <p>cat &gt;/etc/profile&lt;&lt;EOF<br /> 注意这里输入错误之后&#xff0c;采用了一次覆盖读写。<br /> <img src="https://img-blog.csdnimg.cn/20210415002432768.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /><img src="https://img-blog.csdnimg.cn/20210415003924910.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /></p> 
</blockquote> 
<p><img src="https://img-blog.csdnimg.cn/20210415004347684.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /><img src="https://img-blog.csdnimg.cn/20210415123340894.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /></p> 
<p>步骤 6清理软件安装包。</p> 
<blockquote> 
 <p>这里并不支持ll命令&#xff0c;查询使用ls -l命令可以看到详细信息。</p> 
</blockquote> 
<pre><code class="prism language-bash"><span class="token punctuation">[</span>omm&#64;db1 openGauss<span class="token punctuation">]</span>$ <span class="token keyword">exit</span>
<span class="token function">logout</span>
<span class="token punctuation">[</span>root&#64;db1 /<span class="token punctuation">]</span><span class="token comment"># cd /root</span>
<span class="token punctuation">[</span>root&#64;db1 script<span class="token punctuation">]</span><span class="token comment"># cd /opt/software/openGauss/</span>
<span class="token punctuation">[</span>root&#64;db1 openGauss<span class="token punctuation">]</span><span class="token comment"># ll</span>
</code></pre> 
<p>成功删除安装包<br /> <img src="https://img-blog.csdnimg.cn/20210415123922850.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /></p> 
<h3><a id="16_openGauss_96"></a>1.6 安装openGauss数据库</h3> 
<h2><a id="_97"></a>数据库使用</h2> 
<h3><a id="17__99"></a>1.7 前提条件</h3> 
<blockquote> 
 <p>openGauss正常运行。由于本实验是对openGauss数据库的基本使用&#xff0c;需要掌握openGauss数据库的基本操作和SQL语法&#xff0c;openGauss数据库支持SQL2003标准语法&#xff0c;数据库基本操作参见附录二。</p> 
</blockquote> 
<h3><a id="18__102"></a>1.8 操作步骤</h3> 
<p>步骤 1以操作系统用户omm登录数据库主节点。<br /> <code>[root&#64;ecs-c9bf script]# su - omm</code></p> 
<blockquote> 
 <p>进入数据库成功<br /> <img src="https://img-blog.csdnimg.cn/20210415124158217.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /></p> 
</blockquote> 
<blockquote> 
 <p>psql在退出时并不是使用exit&#xff0c;而是使用<code>\q</code><br /> alter role omm identified by ‘bigdata&#64;1997’ replace ‘openguass&#64;1997’;<br /> 注意后面这个密码是初始设置的数据库database的密码。</p> 
 <p><img src="https://img-blog.csdnimg.cn/20210415150621559.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /><img src="https://img-blog.csdnimg.cn/20210415150714958.png" alt="在这里插入图片描述" /><br /> 如上创建了一个用户名为goku&#xff0c;密码为bigdata&#64;1997的用户。<br /> <img src="https://img-blog.csdnimg.cn/20210415150752304.png" alt="在这里插入图片描述" /><br /> 创建完db_test数据库后&#xff0c;就<code>\q</code>方法退出postgres数据库&#xff0c;使用新用户连接到此数据库执行接下来的创建表等操作。当然&#xff0c;也可以选择继续在默认的postgres数据库下做后续的体验。<br /> <img src="https://img-blog.csdnimg.cn/20210415150953485.png" alt="在这里插入图片描述" /></p> 
</blockquote> 
<blockquote> 
 <p>测试用goku用户连接db_test&#xff0c;并且创建SCHEMA&#xff0c;这里对SCHEMA的理解可以参考<a href="https://blog.csdn.net/u010429286/article/details/79022484">数据库中的Schema是什么?</a>&#xff0c;关于openGauss对SCHEMA的定义可以参考&#xff1a;<a href="https://www.modb.pro/db/30214">华为openGauss 创建和管理schema</a>。</p> 
</blockquote> 
<blockquote> 
 <p>那么<code>CREATE SCHEMA goku AUTHORIZATION goku;</code>实际上就是创建了一个名为goku的SCHEMA&#xff0c;而其访问权限仅限于goku。</p> 
 <p>创建一个名称为mytable&#xff0c;只有一列的表。字段名为firstcol&#xff0c;字段类型为integer。<code>CREATE TABLE mytable (firstcol int);</code><br /> 向表中插入数据&#xff1a;100 <code>INSERT INTO mytable values (100);</code></p> 
</blockquote> 
<p><img src="https://img-blog.csdnimg.cn/20210415151126623.png?x-oss-process&#61;image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2RpdmU2Njg&#61;,size_16,color_FFFFFF,t_70" alt="在这里插入图片描述" /></p> 
<pre><code class="prism language-bash"><span class="token punctuation">[</span>omm@db1997 ~]$ gsql -d db_test -p 26000 -U goku -W bigdata@1997  -r
gsql ((openGauss 1.1.0 build 392c0438) compiled at 2020-12-31 20:08:21 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.
db_test=> CREATE TABLE mytable (firstcol int);
CREATE TABLE
db_test=>  INSERT INTO mytable values (100);
INSERT 0 1
db_test=>  SELECT * from mytable;
 firstcol
----------
      100
(1 row)
————————————————


