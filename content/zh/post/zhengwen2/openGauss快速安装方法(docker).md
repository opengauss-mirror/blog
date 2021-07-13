+++

title =  “opengauss快速安装方法（docker）" 

date = "2021-07-09" 

tags = ["opengauss快速安装方法（docker）"] 

archives = "2021-10" 

author = "DSLS" 

summary = "opengauss快速安装方法（docker）"

img = "/zh/post/zhengwen2/img/img20.jpg" 

times = "12:30"

+++

# opengauss实践总结学习心<a name="ZH-CN_TOPIC_0000001085018737"></a> 

<b id="6jknk">放开安全组(可选)</b></h1>
云服务器需要开放端口以供外部连接。设置如下：

<p><img src="https://data.educoder.net/api/attachments/1595857" alt=" su "><br></p>
<p>开放22端口，用于远程SSH的连接。开放8887端口，用于数据库的连接。</p>
<p>如果你闲麻烦，大可开放所有端口。</p>
<p>8887端口不是固定的，可以任意设置，但不要和已占用的端口冲突。。</p>
<p>如果是本地的虚拟机，则不需要上述设置。顺便一提，如果你想让同一局域网的其他设备（比如你舍友的电脑）连接到你的数据库，请把Windows防火墙关闭。</p>
<p><img src="https://data.educoder.net/api/attachments/1595858" alt=" f "></p>
<h1><b id="trvbj">登录服务器</b></h1>
使用SSH远程登录到服务器之后，即可开始之后的步骤。
<p>执行命令SSH 账户名@域名或IP地址连接到远程服务器，连接上之后输入密码登录。</p>
<p>如SSH root@db.example.cn或SSH root@127.0.0.1。</p>
<p>如果是本地虚拟机，请开机输入密码登录即可。</p>
<h1><b id="nhku9">关闭防火墙</b></h1>
执行命令systemctl stop firewalld.service停止防火墙。
<p>执行命令systemctl disable firewalld.service关闭防火墙。</p>
<p>之后reboot重启。</p>
<h1><b id="1w425">换源(可选)(耗时警告)</b></h1>
换国内源以加快程序包下载速度。注意系统版本：CentOS 7
<p>执行命令：cp /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.bak备份。</p>
<p>执行命令wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo更换阿里源。</p>
<p>执行命令yum clean all清除缓存。</p>
<p>执行命令yum makecache生成缓存。</p>
<p>执行命令yum -y update更新yum源。</p>
<h1><b id="9hodi">安装dokcer</b></h1>
执行命令yum -y install docker安装docker。
<p>执行命令systemctl start docker启动docker服务。</p>
<p>执行命令systemctl enable docker开机启动docker。(可选)</p>
<h1><b id="ntcp6">docker加速(可选)</b></h1>
为了pull镜像更快，可以配置镜像加速服务器。镜像加速地址可以百度，暂时可以用我的加速地址：https://8h88nptu.mirror.aliyuncs.com。
<p>顺便一提：阿里云镜像获取地址：https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors，登陆后，左侧菜单选中镜像加速器就可以看到你的专属地址了</p>
<p>配置镜像地址，执行命令vi /etc/docker/daemon.json修改配置文件，如该文件不存在，则创建。在其中加入内容：</p>
<ol><li><code>{"registry-mirrors":["https://8h88nptu.mirror.aliyuncs.com"]}</code></li></ol><p>
加速地址仅供参考</p>
<p>依次执行命令systemctl daemon-reload和systemctl restart docker重新启动docker。</p>
<h1><b id="acy21">拉取openGauss镜像并启动</b></h1>
执行docker run --name opengauss --privileged=true -d -e GS_PASSWORD=Enmo@123 -p 8887:5432 enmotech/opengauss:latest拉取镜像并创建容器。
<p>其中，opengauss为容器名，8887:5432为容器内部的5432端口映射到外部8887端口，默认密码为Enmo@123。</p>
<p>之后执行docker start opengauss启动openGauss镜像。</p>
<p>通过docker update --restart=always opengauss来设置openGauss镜像随着docker的启动而启动</p>
<p>至此openGauss安装完成</p>
<h1><b id="v3vu7">数据库的设置</b></h1>
执行命令docker exec -it opengauss bash进入容器。
<p>执行命令su - omm切换到omm账户。</p>
<p>执行命令gsql进入数据库。</p>
<p>因为外部连接时，不允许使用初始账户omm，所以新建一个账户。</p>
<p>执行语句CREATE USER testuser WITH PASSWORD ‘Enmo@123’;创建一个名为testuser，密码为Enmo@123的账户。</p>
<p>执行语句GRANT ALL PRIVILEGES ON DATABASE omm testuser;给予testuser默认数据库omm权限。</p>
<p>执行语句GRANT ALL PRIVILEGES ON all tables in schema public TO testuser;给予全部表权限给testuser。</p>
<p>完成设置。</p>
<h1><b id="v27qt">外部连接</b></h1>
这里使用开源软件DBeaver来连接数据库。
<p>如下图所示，在左侧区域右键，创建-&gt;连接。</p>
<p><img src="https://data.educoder.net/api/attachments/1595859" alt=" 1 "><br></p>
<p>选择PostgreSQL。</p>
<p><img src="https://data.educoder.net/api/attachments/1595860" alt=" 2 "><br></p>
<p>设置主机地址为你的服务器/虚拟机IP地址，端口设置为8887。数据库为omm，用户名和密码为刚才设置的用户名和密码。(testuser，Enmo@123)</p>
<p><img src="https://data.educoder.net/api/attachments/1595862" alt=" 5 "><br></p>
<p>进入SQL编辑器，输入语句SELECT 1;来测试可用性。</p>
<p><img src="https://data.educoder.net/api/attachments/1595863" alt=" 6 "><br></p>
<h1><b id="5t0dw">结束</b></h1></div> 
<script src="https://cdn.modb.pro/_nuxt/386d4c40ac7324fcc146.js" defer></script><script src="https://cdn.modb.pro/_nuxt/modb.2.210.2.js" defer></script><script src="https://cdn.modb.pro/_nuxt/modb.2.210.0.js" defer></script>
  </body>
</html>

