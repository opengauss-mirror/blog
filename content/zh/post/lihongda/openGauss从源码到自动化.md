+++

title = "openGauss从源码到自动化" 

date = "2020-12-18" 

tags = ["openGauss源码编译"] 

archives = "2020-12" 

author = "李宏达" 

summary = "openGauss从源码到自动化"

img = "/zh/post/lihongda/title/title.png" 

times = "10:30"

+++

# openGauss从源码到自动化<a name="ZH-CN_TOPIC_0000001071668158"></a>

## openGauss<a name="section85221128162617"></a>

openGauss是一款开源关系型数据库管理系统，采用木兰宽松许可证v2发行。openGauss内核源自PostgreSQL，深度融合华为在数据库领域多年的经验，结合企业级场景需求，持续构建竞争力特性。同时openGauss也是一个开源的数据库平台，鼓励社区贡献、合作。

官网地址：[https://opengauss.org/zh/](https://opengauss.org/zh/)

社区地址：[https://gitee.com/opengauss/openGauss-server](https://gitee.com/opengauss/openGauss-server)

openGauss Support Release-2020/12/01

-   centos\_x86\_64
-   openeuler\_aarch64
-   openeuler\_x86\_64
-   asianux\_x86\_64

因客户需求对红旗系统进行适配。

## Adapted Asianux System<a name="section18493154410283"></a>

编译openGauss需要openGauss-server和binarylibs两个组件。

-   openGauss-server：openGauss的主要代码。可以从开源社区获取。

-   binarylibs：openGauss依赖的第三方开源软件，你可以直接编译openGauss-third\_party代码获取，也可以从开源社区下载已经编译好的并上传的一个副本。


openGauss对于操作系统的限制在于openGauss-third\_party，和OM工具的限制，内核本身没有操作系统限制；所以修改OM工具和和三方库进行适配。

主要修改文件

<a name="table1878352516352"></a>
<table><thead align="left"><tr id="row2784102573517"><th class="cellrowborder" valign="top" width="50%" id="mcps1.1.3.1.1"><p id="p1378432513355"><a name="p1378432513355"></a><a name="p1378432513355"></a>openGauss-third_party</p>
</th>
<th class="cellrowborder" valign="top" width="50%" id="mcps1.1.3.1.2"><p id="p6784192503520"><a name="p6784192503520"></a><a name="p6784192503520"></a>openGauss-server</p>
</th>
</tr>
</thead>
<tbody><tr id="row137841725183513"><td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.1 "><p id="p141431555113614"><a name="p141431555113614"></a><a name="p141431555113614"></a>README.md</p>
</td>
<td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.2 "><p id="p1814345511362"><a name="p1814345511362"></a><a name="p1814345511362"></a>build.sh</p>
</td>
</tr>
<tr id="row117851225133515"><td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.1 "><p id="p1914310553365"><a name="p1914310553365"></a><a name="p1914310553365"></a>build/get_PlatForm_str.sh</p>
</td>
<td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.2 "><p id="p2143555173617"><a name="p2143555173617"></a><a name="p2143555173617"></a>package/package.sh</p>
</td>
</tr>
<tr id="row1678515251358"><td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.1 "><p id="p0143655173617"><a name="p0143655173617"></a><a name="p0143655173617"></a>dependency/c-ares/build.sh</p>
</td>
<td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.2 "><p id="p51433551362"><a name="p51433551362"></a><a name="p51433551362"></a>src/get_PlatForm_str.sh</p>
</td>
</tr>
<tr id="row1978542533512"><td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.1 "><p id="p121441755113620"><a name="p121441755113620"></a><a name="p121441755113620"></a>dependency/openssl/build.sh</p>
</td>
<td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.2 "><p id="p314485517369"><a name="p314485517369"></a><a name="p314485517369"></a>src/manager/om/script/local/LocalCheckOS.py</p>
</td>
</tr>
</tbody>
</table>

详细修改内容

-   openGauss-third\_party：  [https://gitee.com/opengauss/openGauss-third\_party/pulls/31](https://gitee.com/opengauss/openGauss-third_party/pulls/31)

-   openGauss-server：  [https://gitee.com/opengauss/openGauss-server/pulls/448/files](https://gitee.com/opengauss/openGauss-server/pulls/448/files)


## Compile openGauss-third\_party<a name="section11413134410376"></a>

**拉取源码**

```
[root@asianux] git clone https://gitee.com/opengauss/openGauss-third_party.git
[root@asianux openGauss-third_party]# ls
build  buildtools  CONTRIBUTING.md  dependency  platform  README.md  Third_Party_Open_Source_Software_Notice
```

-   build directory includes scripts that can build all of the third-party that we depend on.

-   buildtools includes the build tools used to compile these opensources and openGauss-server.

-   dependency includes all depended opensource files of openGauss-server.

-   platform includes the opensource software from Huawei company


**下载gcc，放在如下位置**

```
[root@asianux gcc]# pwd
/opt/openGauss-third_party/buildtools/gcc
[root@asianux gcc]# ls
build.sh  config.ini  gcc-8.2.0.tar.gz 
```

gcc下载链接  [gcc-8.2.0.zip](https://github.com/gcc-mirror/gcc/archive/releases/gcc-8.2.0.zip)  or  [gcc-8.2.0.tar.gz](https://github.com/gcc-mirror/gcc/archive/releases/gcc-8.2.0.tar.gz)

**安装依赖包**

```
[root@asianux] yum install -y libaio-devel ncurses-devel pam-devel libffi-devel python3-devel glibc-devel libtool autoconf flex patch bison dkms rsync gcc-c++
```

**执行编译**

该环境为16c/64g,对内存要求32g及以上。

```
[root@asianux build]# pwd
/opt/openGauss-third_party/build
[root@asianux build]# nohup sh build_all.sh &
[root@asianux build]# cat nohup.out 
[BUILD] buildtools .................... OK [1471.33s]
[BUILD] dependency .................... OK [1383.96s]
[BUILD] platform ...................... OK [   5.34s]
total time:2860.64
```

**binarylibs**

```
在openGauss-third_party上层目录生成binarylibs文件夹。
[root@asianux opt]# tree -L 2 binarylibs/
binarylibs/
├── buildtools
│   └── asianux_x86_64
├── dependency
│   └── asianux_x86_64
└── platform
    └── asianux_x86_64

6 directories, 0 files
```

**日志及排错**

对应的模块和组件：

-   openGauss-third\_party/build
-   openGauss-third\_party/module/build
-   openGauss-third\_party/module/components
-   module和components

相应的日志：

```
[root@asianux openGauss-third_party]# ls build/
build_all.sh  buildtools_build.log  common.sh  dependency_build.log  get_PlatForm_str.sh  nohup.out  platform_build.log  requirements.txt
[root@asianux openGauss-third_party]# ls buildtools/build/
build_buildtools.sh  cmake_build.log  gcc_build.log  gmp_build.log  isl_build.log  mpc_build.log  mpfr_build.log
[root@asianux openGauss-third_party]# ls buildtools/gcc/
build_libstd.log  build.sh  config.ini  gcc-8.2.0  gcc-8.2.0.tar.gz  install_comm  install_comm_dist
```

编译依赖python3环境，多数报错是由于缺少依赖包所致，可通过上述日志Troubleshooting。

## Compile openGauss-server<a name="section19102192011470"></a>

**拉取源码**

```
[root@asianux openGauss-server]# git clone https://gitee.com/opengauss/openGauss-server.git
[root@asianux openGauss-server]# ls
aclocal.m4  binarylibs.tar.gz  config      config.status  contrib          COPYRIGHT  docker       GNUmakefile.in  make_compile.log  package       README.md      src          Third_Party_Open_Source_Software_Notice
build.sh           config.log  configure      CONTRIBUTING.md  doc        GNUmakefile  License         Makefile          README.en.md  simpleInstall  third_party
```

**binarylibs**

将编译好的binarylibs文件夹放入openGauss-server的子目录。

```
[root@asianux openGauss-server]# ls
aclocal.m4  binarylibs.tar.gz  config      config.status  contrib          COPYRIGHT  docker       GNUmakefile.in  make_compile.log  package       README.md      src          Third_Party_Open_Source_Software_Notice
binarylibs  build.sh           config.log  configure      CONTRIBUTING.md  doc        GNUmakefile  License         Makefile          README.en.md  simpleInstall  third_party
```

**build.sh**

openGauss-server中的build.sh是编译过程中的重要脚本工具。该工具集成了软件安装编译和产品安装包编译功能，可快速进行代码编译和打包。。

参数说明请见以下表格。

<a name="zh-cn_topic_0283136302_table1575410358472"></a>
<table><thead align="left"><tr id="zh-cn_topic_0283136302_row1975463519471"><th class="cellrowborder" valign="top" width="14.84148414841484%" id="mcps1.1.5.1.1"><p id="zh-cn_topic_0283136302_p27541635104712"><a name="zh-cn_topic_0283136302_p27541635104712"></a><a name="zh-cn_topic_0283136302_p27541635104712"></a>功能选项</p>
</th>
<th class="cellrowborder" valign="top" width="34.87348734873487%" id="mcps1.1.5.1.2"><p id="zh-cn_topic_0283136302_p272091325813"><a name="zh-cn_topic_0283136302_p272091325813"></a><a name="zh-cn_topic_0283136302_p272091325813"></a>缺省值</p>
</th>
<th class="cellrowborder" valign="top" width="7.520752075207521%" id="mcps1.1.5.1.3"><p id="zh-cn_topic_0283136302_p493319175413"><a name="zh-cn_topic_0283136302_p493319175413"></a><a name="zh-cn_topic_0283136302_p493319175413"></a>参数</p>
</th>
<th class="cellrowborder" valign="top" width="42.76427642764276%" id="mcps1.1.5.1.4"><p id="zh-cn_topic_0283136302_p1675513514716"><a name="zh-cn_topic_0283136302_p1675513514716"></a><a name="zh-cn_topic_0283136302_p1675513514716"></a>功能</p>
</th>
</tr>
</thead>
<tbody><tr id="zh-cn_topic_0283136302_row107551359472"><td class="cellrowborder" valign="top" width="14.84148414841484%" headers="mcps1.1.5.1.1 "><p id="zh-cn_topic_0283136302_p117551135124713"><a name="zh-cn_topic_0283136302_p117551135124713"></a><a name="zh-cn_topic_0283136302_p117551135124713"></a>-h</p>
</td>
<td class="cellrowborder" valign="top" width="34.87348734873487%" headers="mcps1.1.5.1.2 "><p id="zh-cn_topic_0283136302_p117201513155810"><a name="zh-cn_topic_0283136302_p117201513155810"></a><a name="zh-cn_topic_0283136302_p117201513155810"></a>不使用此选项</p>
</td>
<td class="cellrowborder" valign="top" width="7.520752075207521%" headers="mcps1.1.5.1.3 "><p id="zh-cn_topic_0283136302_p169341617443"><a name="zh-cn_topic_0283136302_p169341617443"></a><a name="zh-cn_topic_0283136302_p169341617443"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="42.76427642764276%" headers="mcps1.1.5.1.4 "><p id="zh-cn_topic_0283136302_p157551835144710"><a name="zh-cn_topic_0283136302_p157551835144710"></a><a name="zh-cn_topic_0283136302_p157551835144710"></a>帮助菜单。</p>
</td>
</tr>
<tr id="zh-cn_topic_0283136302_row0188244165818"><td class="cellrowborder" valign="top" width="14.84148414841484%" headers="mcps1.1.5.1.1 "><p id="zh-cn_topic_0283136302_p51882044145810"><a name="zh-cn_topic_0283136302_p51882044145810"></a><a name="zh-cn_topic_0283136302_p51882044145810"></a>-m</p>
</td>
<td class="cellrowborder" valign="top" width="34.87348734873487%" headers="mcps1.1.5.1.2 "><p id="zh-cn_topic_0283136302_p718894410584"><a name="zh-cn_topic_0283136302_p718894410584"></a><a name="zh-cn_topic_0283136302_p718894410584"></a>release</p>
</td>
<td class="cellrowborder" valign="top" width="7.520752075207521%" headers="mcps1.1.5.1.3 "><p id="zh-cn_topic_0283136302_p1993418171411"><a name="zh-cn_topic_0283136302_p1993418171411"></a><a name="zh-cn_topic_0283136302_p1993418171411"></a>[debug | release | memcheck]</p>
</td>
<td class="cellrowborder" valign="top" width="42.76427642764276%" headers="mcps1.1.5.1.4 "><p id="zh-cn_topic_0283136302_p5188184405812"><a name="zh-cn_topic_0283136302_p5188184405812"></a><a name="zh-cn_topic_0283136302_p5188184405812"></a>选择编译目标版本。</p>
</td>
</tr>
<tr id="zh-cn_topic_0283136302_row1675515357477"><td class="cellrowborder" valign="top" width="14.84148414841484%" headers="mcps1.1.5.1.1 "><p id="zh-cn_topic_0283136302_p6755235114711"><a name="zh-cn_topic_0283136302_p6755235114711"></a><a name="zh-cn_topic_0283136302_p6755235114711"></a>-3rd</p>
</td>
<td class="cellrowborder" valign="top" width="34.87348734873487%" headers="mcps1.1.5.1.2 "><p id="zh-cn_topic_0283136302_p1772010136588"><a name="zh-cn_topic_0283136302_p1772010136588"></a><a name="zh-cn_topic_0283136302_p1772010136588"></a>${代码路径}/binarylibs</p>
</td>
<td class="cellrowborder" valign="top" width="7.520752075207521%" headers="mcps1.1.5.1.3 "><p id="zh-cn_topic_0283136302_p1493614171349"><a name="zh-cn_topic_0283136302_p1493614171349"></a><a name="zh-cn_topic_0283136302_p1493614171349"></a>[binarylibs path]</p>
</td>
<td class="cellrowborder" valign="top" width="42.76427642764276%" headers="mcps1.1.5.1.4 "><p id="zh-cn_topic_0283136302_p1755173520474"><a name="zh-cn_topic_0283136302_p1755173520474"></a><a name="zh-cn_topic_0283136302_p1755173520474"></a>指定binarylibs的路径，需绝对路径。</p>
</td>
</tr>
<tr id="zh-cn_topic_0283136302_row1875543594716"><td class="cellrowborder" valign="top" width="14.84148414841484%" headers="mcps1.1.5.1.1 "><p id="zh-cn_topic_0283136302_p475523515475"><a name="zh-cn_topic_0283136302_p475523515475"></a><a name="zh-cn_topic_0283136302_p475523515475"></a>-pkg</p>
</td>
<td class="cellrowborder" valign="top" width="34.87348734873487%" headers="mcps1.1.5.1.2 "><p id="zh-cn_topic_0283136302_p372131325815"><a name="zh-cn_topic_0283136302_p372131325815"></a><a name="zh-cn_topic_0283136302_p372131325815"></a>不使用此功能</p>
</td>
<td class="cellrowborder" valign="top" width="7.520752075207521%" headers="mcps1.1.5.1.3 "><p id="zh-cn_topic_0283136302_p693619174418"><a name="zh-cn_topic_0283136302_p693619174418"></a><a name="zh-cn_topic_0283136302_p693619174418"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="42.76427642764276%" headers="mcps1.1.5.1.4 "><p id="zh-cn_topic_0283136302_p13756143512476"><a name="zh-cn_topic_0283136302_p13756143512476"></a><a name="zh-cn_topic_0283136302_p13756143512476"></a>将代码编译结果压缩封装成安装包。</p>
</td>
</tr>
<tr id="zh-cn_topic_0283136302_row1271210213485"><td class="cellrowborder" valign="top" width="14.84148414841484%" headers="mcps1.1.5.1.1 "><p id="zh-cn_topic_0283136302_p3713112184817"><a name="zh-cn_topic_0283136302_p3713112184817"></a><a name="zh-cn_topic_0283136302_p3713112184817"></a>-nopt</p>
</td>
<td class="cellrowborder" valign="top" width="34.87348734873487%" headers="mcps1.1.5.1.2 "><p id="zh-cn_topic_0283136302_p11982718195610"><a name="zh-cn_topic_0283136302_p11982718195610"></a><a name="zh-cn_topic_0283136302_p11982718195610"></a>不使用此功能</p>
</td>
<td class="cellrowborder" valign="top" width="7.520752075207521%" headers="mcps1.1.5.1.3 "><p id="zh-cn_topic_0283136302_p12969132175620"><a name="zh-cn_topic_0283136302_p12969132175620"></a><a name="zh-cn_topic_0283136302_p12969132175620"></a>-</p>
</td>
<td class="cellrowborder" valign="top" width="42.76427642764276%" headers="mcps1.1.5.1.4 "><p id="zh-cn_topic_0283136302_p371302154814"><a name="zh-cn_topic_0283136302_p371302154814"></a><a name="zh-cn_topic_0283136302_p371302154814"></a>如果使用此功能，则对鲲鹏平台的相关CPU不进行优化。</p>
</td>
</tr>
</tbody>
</table>

>**说明：** 
>-   **-m \[debug | release | memcheck\]**表示有三个目标版本可以选择：
>    -   **release**：生成release版本的二进制程序。此版本编译时，通过配置GCC高级优化选项，去除内核调试代码。此选项通常在生成环境或性能测试环境中使用。
>    -   **debug**：表示生成debug版本的二进制程序。此版本编译时，增加了内核代码调试功能，一般用于开发自测环境。
>    -   **memcheck**：表示生成memcheck版本的二进制程序。此版本编译时，在debug版本的基础上增加了ASAN功能，用于定位内存问题。
>-   **-3rd \[binarylibs path\]为binarylibs**的路径。默认设置为当前代码文件夹下存在**binarylibs**，因此如果**binarylibs**被移至**openGauss-server**中，或者在**openGauss-server**中创建了到**binarylibs**的软链接，则不需要指定此参数。但请注意，这样做的话，该文件很容易被**git clean**命令删除。

**执行编译**

```
[root@asianux openGauss-server]# nohup sh build.sh &
[root@asianux openGauss-server]# ls package/
make_package.log                             openGauss-1.0.1-asianux-64bit-Libpq.tar.gz   openGauss-1.0.1-asianux-64bit.tar.gz  separate_debug_information.sh
openGauss-1.0.1-asianux-64bit-kernel.tar.gz  openGauss-1.0.1-asianux-64bit-symbol.tar.gz  package.sh
```

## Install openGauss<a name="section1309192625810"></a>

脚本下载链接  [enmo\_install.zip](http://www.lihongda.club/wp-content/uploads/2020/12/enmo_install.zip)

**OM tool Installation**

-   OM安装为官方推荐安装方式。

-   详细安装方式见官网  [https://opengauss.org/zh/docs/1.0.1/docs/installation/installation.html](https://opengauss.org/zh/docs/1.0.1/docs/installation/installation.html)


**Automatic Installation**

-   openGauss目前最多节点支持一主四备四级联库。

-   通过shell脚本和批量化工具实现自动化安装。


<a name="table48813357116"></a>
<table><thead align="left"><tr id="row178821435019"><th class="cellrowborder" valign="top" width="50%" id="mcps1.1.3.1.1"><p id="p2882835314"><a name="p2882835314"></a><a name="p2882835314"></a>选项</p>
</th>
<th class="cellrowborder" valign="top" width="50%" id="mcps1.1.3.1.2"><p id="p288203517113"><a name="p288203517113"></a><a name="p288203517113"></a>说明</p>
</th>
</tr>
</thead>
<tbody><tr id="row88821635615"><td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.1 "><p id="p1889819299420"><a name="p1889819299420"></a><a name="p1889819299420"></a>1，11，111 …</p>
</td>
<td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.2 "><p id="p138988292410"><a name="p138988292410"></a><a name="p138988292410"></a>xml模板</p>
</td>
</tr>
<tr id="row108831935812"><td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.1 "><p id="p178982297420"><a name="p178982297420"></a><a name="p178982297420"></a>common.sh</p>
</td>
<td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.2 "><p id="p68984294410"><a name="p68984294410"></a><a name="p68984294410"></a>公共命令</p>
</td>
</tr>
<tr id="row08831635610"><td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.1 "><p id="p48981291245"><a name="p48981291245"></a><a name="p48981291245"></a>install.sh</p>
</td>
<td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.2 "><p id="p19898229242"><a name="p19898229242"></a><a name="p19898229242"></a>简化安装主程序</p>
</td>
</tr>
<tr id="row148831335615"><td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.1 "><p id="p489882912413"><a name="p489882912413"></a><a name="p489882912413"></a>uninstall.sh</p>
</td>
<td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.2 "><p id="p7899142916419"><a name="p7899142916419"></a><a name="p7899142916419"></a>卸载</p>
</td>
</tr>
<tr id="row1888318351111"><td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.1 "><p id="p1989962915415"><a name="p1989962915415"></a><a name="p1989962915415"></a>filename</p>
</td>
<td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.2 "><p id="p1589952916418"><a name="p1589952916418"></a><a name="p1589952916418"></a>记录节点信息</p>
</td>
</tr>
<tr id="row727719551433"><td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.1 "><p id="p13899142918414"><a name="p13899142918414"></a><a name="p13899142918414"></a>one.sh</p>
</td>
<td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.2 "><p id="p198994291848"><a name="p198994291848"></a><a name="p198994291848"></a>通过预配置命令一键安装</p>
</td>
</tr>
<tr id="row132781355436"><td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.1 "><p id="p1189942914419"><a name="p1189942914419"></a><a name="p1189942914419"></a>school.sql</p>
</td>
<td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.2 "><p id="p1089952915416"><a name="p1089952915416"></a><a name="p1089952915416"></a>学校数据模型展示数据库</p>
</td>
</tr>
<tr id="row827985511318"><td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.1 "><p id="p1289918291745"><a name="p1289918291745"></a><a name="p1289918291745"></a>finance.sql</p>
</td>
<td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.2 "><p id="p490018291547"><a name="p490018291547"></a><a name="p490018291547"></a>金融数据模型展示数据库</p>
</td>
</tr>
<tr id="row182790553317"><td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.1 "><p id="p190052918418"><a name="p190052918418"></a><a name="p190052918418"></a>README.MD</p>
</td>
<td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.2 "><p id="p79001291414"><a name="p79001291414"></a><a name="p79001291414"></a>参考文档</p>
</td>
</tr>
</tbody>
</table>

使用方法

```
[root@asianux simpleInstall]# ./install.sh --help
Usage: ./install.sh [OPTION]
    -?|--help                         show help information
    -U|--user_name                    cluster user
    -G|--user_grp                     group of the cluster user
    -P|--host_port                    database server port
    -D|--install_location             installation directory of the openGauss program
    -M|--mode                         installation mode ...
    -F|--file                         list of hostname and ip
```

**表2**  安装脚本清单

<a name="table2111454062"></a>
<table><thead align="left"><tr id="row8111554463"><th class="cellrowborder" valign="top" width="50%" id="mcps1.1.3.1.1"><p id="p19114541866"><a name="p19114541866"></a><a name="p19114541866"></a>参数</p>
</th>
<th class="cellrowborder" valign="top" width="50%" id="mcps1.1.3.1.2"><p id="p91119541666"><a name="p91119541666"></a><a name="p91119541666"></a>默认值</p>
</th>
</tr>
</thead>
<tbody><tr id="row1312654564"><td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.1 "><p id="p4681171114719"><a name="p4681171114719"></a><a name="p4681171114719"></a>user_name</p>
</td>
<td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.2 "><p id="p106811911077"><a name="p106811911077"></a><a name="p106811911077"></a>omm</p>
</td>
</tr>
<tr id="row12123541964"><td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.1 "><p id="p17681121112715"><a name="p17681121112715"></a><a name="p17681121112715"></a>user_grp</p>
</td>
<td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.2 "><p id="p1968101113712"><a name="p1968101113712"></a><a name="p1968101113712"></a>dbgrp</p>
</td>
</tr>
<tr id="row412175416615"><td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.1 "><p id="p16821911479"><a name="p16821911479"></a><a name="p16821911479"></a>host_port</p>
</td>
<td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.2 "><p id="p26821411873"><a name="p26821411873"></a><a name="p26821411873"></a>26000</p>
</td>
</tr>
<tr id="row11121954860"><td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.1 "><p id="p66822111718"><a name="p66822111718"></a><a name="p66822111718"></a>install_location</p>
</td>
<td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.2 "><p id="p196821111975"><a name="p196821111975"></a><a name="p196821111975"></a>/opt/gaussdb</p>
</td>
</tr>
<tr id="row012195415617"><td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.1 "><p id="p9682711071"><a name="p9682711071"></a><a name="p9682711071"></a>mode</p>
</td>
<td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.2 "><p id="p6682191117718"><a name="p6682191117718"></a><a name="p6682191117718"></a>1-single node 11- 1primary,1standby 111- 1primary,1standby,1cascade</p>
</td>
</tr>
<tr id="row513754467"><td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.1 "><p id="p66831011275"><a name="p66831011275"></a><a name="p66831011275"></a>file</p>
</td>
<td class="cellrowborder" valign="top" width="50%" headers="mcps1.1.3.1.2 "><p id="p1768314111775"><a name="p1768314111775"></a><a name="p1768314111775"></a>list of hostname and ip</p>
</td>
</tr>
</tbody>
</table>

**Command Install**

更改primary1\_hostname和primary1\_ip为实际值。

```
[root@asianux simpleInstall]# cat filename 
M1:primary1_hostname:primary1_ip
S1:standby1_hostname:standby1_ip
S2:standby2_hostname:standby2_ip
S3:standby3_hostname:standby3_ip
S4:standby4_hostname:standby4_ip
C1:cascade1_hostname:cascade1_ip
C2:cascade2_hostname:cascade2_ip
C3:cascade3_hostname:cascade3_ip
C4:cascade4_hostname:cascade4_ip
[root@asianux simpleInstall]# sh install.sh -M 1 -F filename
```

**One Button Install**

password为数据库密码，rootpasswd为主机密码。

```
[root@asianux simpleInstall]# cat one.sh 
#!/bin/bash
password="********"
rootpasswd="="********""
/usr/bin/expect <<EOF
    set timeout  600
    spawn  sh install.sh -M 1 -F filename
    expect {
        "New password:" { send "$password\r"; exp_continue }
        "Retype new password:" { send "$password\r"; exp_continue }
        "*create trust for root (yes/no)?" { send "yes\r"; exp_continue }
        "*Password:" { send "$rootpasswd\r"; exp_continue }
        "*create trust for it (yes/no)?" { send "yes\r"; exp_continue }
        "Password:" { send "$password\r"; exp_continue }
        "Please enter password for database:" { send "$password\r"; exp_continue }
        "Please repeat for database:" { send "$password\r"; exp_continue }
        "*create a demo database (yes/no)?" { send "no\r"; exp_continue }
        eof
    }
EOF
[root@asianux simpleInstall]# sh one.sh 
```

