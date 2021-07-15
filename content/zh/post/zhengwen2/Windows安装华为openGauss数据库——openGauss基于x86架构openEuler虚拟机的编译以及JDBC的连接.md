+++

title = "Windows安装华为openGauss数据库——openGauss基于x86架构openEuler虚拟机的编译以及JDBC的连接" 

date = "2021-07-09" 

tags = ["Windows安装华为openGauss数据库——openGauss基于x86架构openEuler虚拟机的编译以及JDBC的连接"] 

archives = "2021-07" 

author = "安徽大学计算机科学与技术学院 何迪亚，顾宇轩" 

summary = "Windows安装华为openGauss数据库——openGauss基于x86架构openEuler虚拟机的编译以及JDBC的连接"

img = "/zh/post/zhengwen2/img/img29.jpg" 

times = "12:30"

+++

# Windows安装华为openGauss数据库——openGauss基于x86架构openEuler虚拟机的编译以及JDBC的连接<a name="ZH-CN_TOPIC_0000001085018737"></a>

## 1、Hype-V虚拟机安装openEuler

虚拟机平台有很多，像`vmware`、`Hype-V`、`VirtualBox`等等，考虑到与wsl2的兼容，这里选用Hype-V来安装x86架构的`openEuler`

1. 开启 `hype-v`虚拟机
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707111105364.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707111117739.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707111127315.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
2. 下载x86架构openEuler镜像
打开openEuler官网，我们这里打算使用openEuler-20.03-LTS长期支持版
依次打开`openEuler-20.03-LTS-ISO-x86-64`，选择`openEuler-20.03-LTS-x86_64-dvd.iso)`进行下载
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707111806805.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
3. 打开`Hyper-V`，这里配置镜像流程不再累赘
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707111905895.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
4. 配置完成后，就可以进入安装系统的页面了这里选择`Install openEuler`就好
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707112103893.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
5. 这里进入到我们非常熟悉的类似与centOS的安装页面，按照步骤安装就行
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707112146184.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
6. 这里我们打算直接用root用户登录，设置一下root密码就行，不需要创建用户了，这里等待安装好就行，安装完成后会提示你重启，这里先关键，拔掉镜像（`DVD驱动设置为无`，不让会进入安装页面）后启动
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707112309231.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707112346173.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
7. OK这里启动成功，输入一下root账号和密码，便可以成功进入openEuler页面了，这里没有图像画页面只有命令行（精简的openEuler系统应该大部分人都喜欢吧，实在不行可以安装图像画页面但是不建议）
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707112421827.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
## 2、openEuler虚拟系统的配置(支持图形化)

1. 首先添加一下软件源，官方提供的openEuler镜像（20.03版本）是没有自带软件源的，这里yum -install是没有任何东西的
step1：cd /etc/yum.repos.d/
step2：sudo vi openEuler_x86_64.repo
step3：在最下方添加如下代码
```
[base]
name=base
baseurl=https://repo.openeuler.org/openEuler-20.03-LTS/OS/x86_64/
enabled=1
gpgcheck=0
```

step4：退出vim，逐行键入如下命令
```powershell
yum repolist all
sudo yum-config-manager --enable base
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707112646396.png#pic_center)
如果你的openEuler版本或平台不同，做相应的更改即可。至此yum应该已经可以正常使用了。

2. 利用`windows powershell`连接`hype-v`，并关闭防火墙，键入如下命令

```powershell
yum install -y net-tools
yum install -y vim
```

然后查看一下ip，`ifconfig`
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707112931508.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
我们可以打开Windows powershell，操作如下
命令ssh root@（ifconfig网卡的地址）输入一下密码就行了，这里也可以配置密钥进行免密连接，具体不再说了，这里也可以用xshell之类的工具进行连接，不连接都行，怎么方便怎么来
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707113017647.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
接下来我们关闭虚拟机防火墙，为了后续端口的开放方便，但是在服务器上不建议这么做

```
systemctl stop firewalld.service
systemctl disable firewalld.service
```

如下
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707113056958.png#pic_center)
这里也可以开启openGauss的图形化页面，具体操作如下，这里没什么作用，但是对于不熟悉命令行的小伙伴应该更友好

```
yum install ukui 

yum groupinstall fonts -y

systemctl set-default graphical.target

reboot
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707113141499.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
3. 接下来我们准备openGauss的安装依赖，键入如下命令

```
yum install libaio-devel ncurses-devel pam-devel libffi-devel libtool readline-devel 
zlib-devel python3-devel autoconf flex gcc gcc-c++ patch byacc bison -y
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707113243812.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
4. 修改一下python的版本，
首先看一下python的版本
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707113659687.png#pic_center)
请将Python默认版本指向Python 3.x，具体操作如下：

```
rm -rf /usr/bin/python
ln -s /usr/bin/python3.7 /usr/bin/python
```

接下来再看一下python的版本，如下
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707113811356.png#pic_center)
5. 设置字符集及环境变量
依次输入如下命令

```
cat >>/etc/profile<<EOF
export LANG=en_US.UTF‐8
EOF
-------------------------------------------命令分割线
cat >>/etc/profile<<EOF
export packagePath=/opt/software/openGauss
EOF
-------------------------------------------命令分割线
source /etc/profile
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707113858293.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
接着如下

```
cat >>/etc/profile<<EOF
export LD_LIBRARY_PATH=$packagePath/script/gspylib/clib:$LD_LIBRARY_PATH
EOF
----------------------------------------命令分割线
source /etc/profile
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707113942425.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
可以来验证一下结果是否正确

```
echo $LD_LIBRARY_PATH
```

若如下，则结果无问题
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707114026647.png#pic_center)
6. 对swap分区的设置

```
linux系统会用内存做很 多的buffer和cache，所以经常会看到内存用完了，其实这里面可能只有很少的一部分是程序用到的。当内存不足的时候，系统有两种选择，一是减少缓存的量，另一种是把部分程序使用的内存换到swap中。如果是openGauss使用的内存被转移到swap中了，会对性能有很大的影响，所以应该尽量保持 openGauss使用的部分在内存中不被转移出去。
```

一般mysql可以使用memlock启动mysql是mysqld保持在内存中，不过使用这个选项需要以 root运行服务器，在openGuass上还没有用过。

还可以使用关闭swap，可以使用swapoff或者umount分区，不过当内存不够大的时候（比如只有1G）系统不太稳定，可能 会导致openGauss内存不足出错。

也可以设置系统变量vm.swappiness，修改 /etc/sysctl.conf 添加 vm.swappiness = 0，并执行 sysctl -p 或 sysctl -w vm.swappiness=0。这个变量的范围是0至100，默认值60，当内存不足时，此变量的值小则系统偏向于减少缓存，反之则转移程序内存到 swap。但即使将它设为0了，系统仍然有可能使用swap。

一般来说，数据库和能够自带缓存的程序，都不希望系统把内存页置换出去。最简单的“阻止”swap的策略是修改系统参数，参考：

```
sysctl -w vm.swappiness=0

echo 1>/proc/sys/vm/drop_caches

第一条语句是建议系统不要使用swap，

第二条语句是让系统清理cache，以便释放更多内存。但第一条并不能够绝对阻止swap（因为只是建议）。
这里我们采用最粗暴简单的方法，关闭swap交换内存
```

```
 [root@db1 ~]# swapoff -a
```

7. 接下来我们调整系统参数

```
[root@db1 ~]# vi /etc/profile.d/performance.sh
```

如图，按i进入编辑模式，用#注释掉`sysctl -w vm.min_free_kbytes=112640 &> /dev/null`，按`Esc`后:`wq`保存退出。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707114252352.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
8. 接下来下载源到/etc/yum.repos.d/openEuler_x86_64.repo
输入命令

```
curl -o /etc/yum.repos.d/openEuler_x86_64.repo https://mirrors.huaweicloud.com/repository/conf/openeuler_x86_64.repo
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707114342639.png#pic_center)
再输入

```
cat /etc/yum.repos.d/openEuler_x86_64.repo
```

若出现以下结果，则正确
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210707114616151.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center)
然后安装依赖

```
yum install libaio* -y
yum install libnsl* -y
```
<h1><a id="3openEuleropenGauss_200"></a>3、openEuler虚拟机安装openGauss</h1>
<p>这里使用opengauss:1.0.1版本进行配置安装，下载地址如下，可以下载完成传到openEuler，也可以直接通过<code>wget</code>下载</p>
<p><a href="https://gitee.com/opengauss/openGauss-server/repository/archive/v1.0.1" target="_blank">https://gitee.com/opengauss/openGauss-server/repository/archive/v1.0.1</a></p>
<p><a href="https://gitee.com/opengauss/openGauss-server/repository/archive/v1.0.1" target="_blank">https://gitee.com/opengauss/openGauss-server/repository/archive/v1.0.1</a></p>
<p>还需要下载gcc-8.2.0，低版本opengauss不支持gcc-7*</p>
<p><a href="http://mirror.koddos.net/gcc/releases/gcc-8.2.0/gcc-8.2.0.tar.gz" target="_blank">http://mirror.koddos.net/gcc/releases/gcc-8.2.0/gcc-8.2.0.tar.gz</a></p>
<p>下载完成后，全部放入<code>/root/</code>目录下，即<code>cd /root/</code>如下<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210704-c6de9b4f-e413-459a-b602-19996fd96755.png" alt="image.png" /><br />
安装依赖</p>
<pre><div class="hljs"><code class="lang-bash">yum install zlib-devel python3-devel autoconf flex gcc gcc-c++ patch byacc bison -y
</code></div></pre>
<p>将<code>gcc</code>拷贝到<code>/root/openGauss-third_party/buildtools/gcc/</code></p>
<pre><div class="hljs"><code class="lang-bash">cp gcc-releases-gcc-8.2.0.tar.gz /root/openGauss-third_party/buildtools/gcc/
</code></div></pre>
<p>当前openGauss官方支持ARM架构的openEuler，这里支持x86架构的openEuler需要修改get_PlatForm_str.sh文件。</p>
<pre><div class="hljs"><code class="lang-bash"><span class="hljs-built_in">cd</span> /root/openGauss-third_party/build/
vi get_PlatForm_str.sh
</code></div></pre>
<p>添加这样一行</p>
<pre><div class="hljs"><code class="lang-bash"><span class="hljs-keyword">elif</span> [ <span class="hljs-string">&quot;<span class="hljs-variable">$os_name</span>&quot;</span>x = <span class="hljs-string">&quot;openEuler&quot;</span>x -a <span class="hljs-string">&quot;<span class="hljs-variable">$cpu_arc</span>&quot;</span>x = <span class="hljs-string">&quot;x86_64&quot;</span>x ]; <span class="hljs-keyword">then</span>
        os_str=openeuler_x86_64
</code></div></pre>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210704-b2ce7524-84d1-4911-a430-09b0cfee3081.png" alt="image.png" /><br />
保存退出</p>
<p>开始编译第三方软件</p>
<pre><div class="hljs"><code class="lang-bash">

```
sh build_all.sh

若报错：You should download gcc-8.2.0.tar.gz or gcc-8.2.0.zip and put it <span class="hljs-keyword">in</span> /root/openGauss-third_party/build/../buildtools/gcc/如下解决

<span class="hljs-built_in">cd</span> /root/openGauss-third_party/buildtools/
mv gcc-releases-gcc-8.2.0.tar.gz gcc-8.2.0.tar.gz
<span class="hljs-built_in">cd</span> /root/openGauss-third_party/build/
再重新执行命令
```

</code></div></pre>
<p>用户执行以上命令之后，可以自动生成数据库编译所需的开源第三方软件，如果想单独的生成某个开源三方软件，可以进入对应的目录，执行build.sh脚本，如/root/openGauss-third_party/dependency/。最终编译构建出的结果会存放在openGauss-third_party同级的binarylibs目录。这些文件会在后面编译openGauss-server时用到。</p>
<p>PS：这一步需要好几长时间，我已经哭晕在厕所</p>
<p>编译好后如图所示<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210704-08529750-16c2-40e3-87df-b9056109da1d.png" alt="image.png" /><br />
接下来我们设置环境变量</p>
<pre><div class="hljs"><code class="lang-bash"><span class="hljs-built_in">

```
cd/root/
vi bashrc
```

</code></div></pre>
<p>在最底下加上下面这些，千万别错，一失足成千古恨</p>

```
export CODE_BASE=/root/openGauss-server    # Path of the openGauss-server file
export BINARYLIBS=$CODE_BASE/../binarylibs    # Path of the binarylibs file
export GAUSSHOME=/opt/opengauss/
export GCC_PATH=$BINARYLIBS/buildtools/openeuler_x86_64/gcc8.2
export CC=$GCC_PATH/gcc/bin/gcc
export CXX=$GCC_PATH/gcc/bin/g++
export LD_LIBRARY_PATH=$GAUSSHOME/lib:$GCC_PATH/gcc/lib64:$GCC_PATH/isl/lib:$GCC_PATH/mpc/lib/:$GCC_PATH/mpfr/lib/:$GCC_PATH/gmp/lib/:$LD_LIBRARY_PATH
export PATH=$GAUSSHOME/bin:$GCC_PATH/gcc/bin:$PATH
```

</code></div></pre>
<p>最后再更新一下环境变量</p>
<pre><div class="hljs"><code class="lang-bash"><span class="hljs-built_in">source</span> bashrc
</code></div></pre>
<p>设置Makefile</p>
<p>当前openGauss官方支持ARM架构的openEuler，这里支持x86架构的openEuler需要修改Makefile文件。</p>
<pre><div class="hljs"><code class="lang-bash"><span class="hljs-built_in">cd</span> openGauss-server
vi ./src/gausskernel/Makefile
</code></div></pre>
<p>修改内容如下图所示，将绿色部分插入如下内容</p>
<pre><div class="hljs"><code class="lang-python"><span class="hljs-keyword">else</span> ifeq( $(PLAT_FORM_STR), openeuler_x86_64)
	cp <span class="hljs-string">&#x27;$(LIBCURL_LIB PATH)/libcurl.so.4.6.0&#x27;</span> <span class="hljs-string">&#x27;$(DESTDIR)$(libdir)/libcurl.so.4.6.0&#x27;</span>
</code></div></pre>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210704-bae0acbe-acae-4a0a-bb13-0f73e4d79cae.png" alt="image.png" /><br />
选择Release版本进行配置</p>
<pre><div class="hljs"><code class="lang-bash">./configure --gcc-version=8.2.0 CC=g++ CFLAGS=<span class="hljs-string">&quot;-O2 -g3&quot;</span> --prefix=<span class="hljs-variable">$GAUSSHOME</span> --3rd=<span class="hljs-variable">$BINARYLIBS</span> --enable-thread-safety --enable-thread-safety
</code></div></pre>
<p>开始编译</p>
<pre><div class="hljs"><code class="lang-bash">make -j
</code></div></pre>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210704-301535fb-b3a8-4d45-aa65-e2c1b5d95a99.png" alt="image.png" /></p>
<p>看到上述截图中的结果表明编译成功。</p>
<p>最后一步<code>make install</code><br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210704-4472303f-ed41-4f1b-8283-e4bb740fb55f.png" alt="image.png" /><br />
软件安装路径为：$GAUSSHOME</p>
<p>二进制放置路径为：$GAUSSHOME/bin</p>
<p>这样便在x86的openEuler虚拟机中可以使用openGauss了</p>
<p>启动openGauss服务直接使用</p>
<pre><div class="hljs"><code class="lang-bash">gs_om -t start
</code></div></pre>
<p>连接数据库使用</p>
<pre><div class="hljs"><code class="lang-bash">sudo  gsql
</code></div></pre>
<p>连接进入数据库，可以修改数据库的端口号，用户和密码</p>
<h1><a id="4JDBC_340"></a>4、JDBC的使用编写与连接</h1>
<ol>
<li>下载JDK。</li>
</ol>
<p><a href="https://www.oracle.com/java/technologies/javase/javase-jdk8-downloads.html" target="_blank">https://www.oracle.com/java/technologies/javase/javase-jdk8-downloads.html</a></p>
<p>这里安装JDK-8的开源版本尚可</p>
<ul>
<li>配置jdk环境变量</li>
</ul>
<p>右击“此电脑”选择“属性”，点击“高级系统设置”。<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210704-0f8e05f6-de81-4bbf-a2ef-a2fcd7c07240.png" alt="image.png" />、<br />
点击“环境变量”，新建系统变量“JAVA_HOME”，输入JDK安装目录。<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210704-d75aa95a-f86e-4663-9c44-a5c0a8d67fba.png" alt="image.png" /><br />
点击“环境变量”，新建系统变量“JAVA_HOME”，输入JDK安装目录<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210704-94865089-cf66-48c7-b527-d7ff8742456c.png" alt="image.png" /><br />
变量值填入jdk安装目录<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210704-a302eb9a-42b2-4c4c-b3e1-dd80482b71a1.png" alt="image.png" /><br />
编辑系统变量“path”。<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210704-98959266-0c0a-4ced-8ff9-09f43c6e26a7.png" alt="image.png" /><br />
在变量值最后输入<code> %JAVA_HOME%\bin;%JAVA_HOME%\jre\bin;</code><br />
新建系统变量“CLASSPATH”变量，输入“.”即可。<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210704-897207ad-801e-417a-b804-a6df3d590575.png" alt="image.png" /><br />
然后在打开<code>windows powershell</code>输入<code>java --version</code>，如果输出如下，则安装成功<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210704-13f2fb1c-fdf8-4b8f-b43a-952d26420853.png" alt="image.png" /></p>
<p>2.jdbc连接的编写</p>
这里使用`idea`工具插入数据库和连接数据库不再累赘，看jdbc的主要代码

```
import java.sql.*;
 
public class GaussDBMySQLDemo {

    static final String JDBC_DRIVER = "org.postgresql.Driver";  
    static final String DB_URL = "jdbc:postgresql://你的虚拟机IP地址:你的数据库占用端口号/要连接的数据库";
 
    // 数据库的用户名与密码，需要根据自己的设置
    static final String USER = "root";
    static final String PASS = "123456";
 
    public static void main(String[] args) {
        Connection conn = null;
        Statement stmt = null;
        try{
            // 注册 JDBC 驱动
            Class.forName(JDBC_DRIVER);
        
            // 打开链接
            System.out.println("connecting...");
            conn = DriverManager.getConnection(DB_URL,USER,PASS);
       		
            //实例化对象
            stmt = conn.createStatement();
            
            // 执行查询
            String sql;
            sql = "SELECT id, name, url FROM websites";
            ResultSet rs = stmt.executeQuery(sql);
            
            // 创建表
            sql = "CREATE TABLE COMPANY1 " +
                    "(ID INT PRIMARY KEY     NOT NULL," +
                    " NAME           TEXT    NOT NULL, " +
                    " AGE            INT     NOT NULL, " +
                    " ADDRESS        CHAR(50), " +
                    " SALARY         REAL)";
            rs = stmt.executeQuery(sql);
			  关闭脚本文件
            stmt.close();
//            结束连接
            c.close();
        } catch ( Exception e ) {
            System.err.println( e.getClass().getName()+": "+ e.getMessage() );
            System.exit(0);
        }
        System.out.println("Table created successfully");
    }
}
```

