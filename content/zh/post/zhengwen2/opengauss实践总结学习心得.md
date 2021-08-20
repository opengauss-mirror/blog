+++

title = "opengauss实践总结学习心得" 

date = "2021-07-09" 

tags = ["opengauss实践总结学习心"] 

archives = "2021-07" 

author = "poohanyuzuru" 

summary = "opengauss实践总结学习心"

img = "/zh/post/zhengwen2/img/img22.jpg" 

times = "12:30"

+++

# opengauss实践总结学习心<a name="ZH-CN_TOPIC_0000001085018737"></a>

<p>实验一   在ECS上安装部署openGauss数据库</p>
<p>一、实验内容<br />
1、实验内容：本实验主要内容为弹性云服务器（openEuler）上安装部署openGauss数据库，并进行简单的数据库相关操作。</p>
<p>2、实验概览：<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-08c193d8-a1bb-49f9-ada0-a916496df448.png" alt="5C4402A4232F43A2BCE5E70BDC6C3D72.png" /><br />
实验概览图</p>
<p>二、实验过程<br />
1.进入华为官网，购买弹性云服务器ECS（openEuler ARM 操作系统）。购买时需自定义购买进行基础配置、网路配置、高级配置等。<br />
2.修改操作系统配置。使用SSH工具（比如：PuTTY等）从本地电脑通过配置弹性云服务器的弹性公网IP地址（如:124.70.36.251）来连接ECS，并使用ROOT用户来登录。<br />
3.设置字符集参数。<br />
[root@ecs-c9bf ~]# cat &gt;&gt;/etc/profile&lt;&lt;EOF<br />
export LANG=en_US.UTF‐8<br />
EOF<br />
[root@ecs-c9bf ~]# source /etc/profile<br />
4.修改python版本<br />
[root@ecs-c9bf ~]# cd /usr/bin<br />
[root@ecs-c9bf bin] # mv python python.bak<br />
[root@ecs-c9bf bin] # ln -s python3 /usr/bin/python<br />
[root@ecs-c9bf bin] # python -V<br />
[root@ecs-c9bf ~]# yum install libaio* -y<br />
5.下载数据库安装包<br />
[root@ecs-c9bf bin]# mkdir -p /opt/software/openGauss[root@ecs-c9bf bin]# chmod 755 -R /opt/software<br />
[root@ecs-c9bf bin]# cd /opt/software/openGauss<br />
[root@ecs-c9bf openGauss]# wget  https://opengauss.obs.cn-south-1.myhuaweicloud.com/1.1.0/arm/openGauss-1.1.0-openEuler-64bit-all.tar.gz<br />
6.创建XML配置文件<br />
[root@ecs-c9bf bin]# cd /opt/software/openGauss<br />
[root@ecs-c9bf openGauss]# vi  clusterconfig.xml<br />
输入”i”进入INSERT模式，添加文本如下</p>

​    


```
<DEVICELIST> 
    
    <DEVICE sn="1000001"> 
        <PARAM name="name" value="ecs-c9bf"/> 
        <PARAM name="azName" value="AZ1"/> 
        <PARAM name="azPriority" value="1"/> 
        <PARAM name="backIp1" value="192.168.0.58"/> 
        <PARAM name="sshIp1" value="192.168.0.58"/> 
         
    <!--dbnode--> 
    <PARAM name="dataNum" value="1"/> 
    <PARAM name="dataPortBase" value="26000"/> 
    <PARAM name="dataNode1" value="/gaussdb/data/db1"/> 
    </DEVICE> 
</DEVICELIST> 
```

</code></pre>
</ROOT>
点击“ESC”退出INSERT模式，然后输入“:wq”后回车退出编辑并保存文本。
7.修改performance.sh文件
[root@ecs-c9bf openGauss]# vi /etc/profile.d/performance.sh
输入”i”，进入INSERT模式。
CPUNO=`cat /proc/cpuinfo|grep processor|wc -l`
export GOMP_CPU_AFFINITY=0-$[CPUNO - 1]
<h1><a id="sysctl_w_vmmin_free_kbytes112640__devnull
sysctl_w_vmdirty_ratio60__devnull
sysctl_w_kernelsched_autogroup_enabled0__devnull
ESCINSERTwq
8lib
rootecsc9bf_openGauss_vi_etcprofile
iINSERT
export_packagePathoptsoftwareopenGauss
export_LD_LIBRARY_PATHpackagePathscriptgspylibclibLD_LIBRARY_PATH
rootecsc9bf_openGauss_source_etcprofile
9
rootecsc9bf_openGauss_cd_optsoftwareopenGauss
rootecsc9bf_openGauss_tar_zxvf__openGauss110openEuler64bitalltargz
rootecsc9bf_openGauss_tar_zxvf__openGauss110openEuler64bitomtargz
ls
rootecsc9bf_openGauss_ls
clusterconfigxml___________________________openGaussPackagebak_392c0438targz
lib_________________________________________script
openGauss110openEuler64bitalltargz__simpleInstall
openGauss110openEuler64bitomsha256___upgrade_sqlsha256
openGauss110openEuler64bitomtargz___upgrade_sqltargz
openGauss110openEuler64bitsha256______versioncfg
openGauss110openEuler64bittarbz2
gs_preinstallgs_preinstall
rootecsc9bf_openGauss_cd_optsoftwareopenGaussscript
rootecsc9bf_script_python_gs_preinstall_U_omm_G_dbgrp_X_optsoftwareopenGaussclusterconfigxml
Are_you_sure_you_want_to_create_trust_for_root_yesno_yes
Please_enter_password_for_root
Password__LINUX
Creating_SSH_trust_for_the_root_permission_user
ommommtrust
Are_you_sure_you_want_to_create_the_useromm_and_create_trust_for_it_yesno_yes
Please_enter_password_for_cluster_user
Password_
Please_enter_password_for_cluster_user_again
Password_
Successfully_created_omm_user_on_all_nodes
10
rootecsc9bf_script_chmod_R_755_optsoftwareopenGaussscript_
rootecsc9bf_script_su__omm
ommecsc9bf__gs_install_X_optsoftwareopenGaussclusterconfigxml_gsinitparameterencodingUTF8__dngucmax_process_memory4GB__dngucshared_buffers256MB_dngucbulk_write_ring_size256MB_dnguccstore_buffers16MB

rootecsc9bf_script_su__omm_
ommecsc9bf__gs_om_t_start
Starting_cluster_69"></a>#sysctl -w vm.min_free_kbytes=112640 &amp;&gt; /dev/null<br />
sysctl -w vm.dirty_ratio=60 &amp;&gt; /dev/null<br />
sysctl -w kernel.sched_autogroup_enabled=0 &amp;&gt; /dev/null<br />
点击“ESC”退出INSERT模式。输入“:wq”后回车，保存退出。<br />
8.执行预安装前加载安装包中lib库<br />
[root@ecs-c9bf openGauss]# vi /etc/profile<br />
输入i，进入INSERT模式<br />
export packagePath=/opt/software/openGauss<br />
export LD_LIBRARY_PATH=<span class="katex"><span class="katex-mathml"><math><semantics><mrow><mi>p</mi><mi>a</mi><mi>c</mi><mi>k</mi><mi>a</mi><mi>g</mi><mi>e</mi><mi>P</mi><mi>a</mi><mi>t</mi><mi>h</mi><mi mathvariant="normal">/</mi><mi>s</mi><mi>c</mi><mi>r</mi><mi>i</mi><mi>p</mi><mi>t</mi><mi mathvariant="normal">/</mi><mi>g</mi><mi>s</mi><mi>p</mi><mi>y</mi><mi>l</mi><mi>i</mi><mi>b</mi><mi mathvariant="normal">/</mi><mi>c</mi><mi>l</mi><mi>i</mi><mi>b</mi><mo>:</mo></mrow><annotation encoding="application/x-tex">packagePath/script/gspylib/clib:</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="strut" style="height:0.75em;"></span><span class="strut bottom" style="height:1em;vertical-align:-0.25em;"></span><span class="base"><span class="mord mathit">p</span><span class="mord mathit">a</span><span class="mord mathit">c</span><span class="mord mathit" style="margin-right:0.03148em;">k</span><span class="mord mathit">a</span><span class="mord mathit" style="margin-right:0.03588em;">g</span><span class="mord mathit">e</span><span class="mord mathit" style="margin-right:0.13889em;">P</span><span class="mord mathit">a</span><span class="mord mathit">t</span><span class="mord mathit">h</span><span class="mord mathrm">/</span><span class="mord mathit">s</span><span class="mord mathit">c</span><span class="mord mathit" style="margin-right:0.02778em;">r</span><span class="mord mathit">i</span><span class="mord mathit">p</span><span class="mord mathit">t</span><span class="mord mathrm">/</span><span class="mord mathit" style="margin-right:0.03588em;">g</span><span class="mord mathit">s</span><span class="mord mathit">p</span><span class="mord mathit" style="margin-right:0.03588em;">y</span><span class="mord mathit" style="margin-right:0.01968em;">l</span><span class="mord mathit">i</span><span class="mord mathit">b</span><span class="mord mathrm">/</span><span class="mord mathit">c</span><span class="mord mathit" style="margin-right:0.01968em;">l</span><span class="mord mathit">i</span><span class="mord mathit">b</span><span class="mrel">:</span></span></span></span>LD_LIBRARY_PATH<br />
[root@ecs-c9bf openGauss]# source /etc/profile<br />
9.解压安装包<br />
[root@ecs-c9bf openGauss]# cd /opt/software/openGauss<br />
[root@ecs-c9bf openGauss]# tar -zxvf  openGauss-1.1.0-openEuler-64bit-all.tar.gz<br />
[root@ecs-c9bf openGauss]# tar -zxvf  openGauss-1.1.0-openEuler-64bit-om.tar.gz<br />
用ls命令查看<br />
[root@ecs-c9bf openGauss]# ls<br />
clusterconfig.xml                           openGauss-Package-bak_392c0438.tar.gz<br />
lib                                         script<br />
openGauss-1.1.0-openEuler-64bit-all.tar.gz  simpleInstall<br />
openGauss-1.1.0-openEuler-64bit-om.sha256   upgrade_sql.sha256<br />
openGauss-1.1.0-openEuler-64bit-om.tar.gz   upgrade_sql.tar.gz<br />
openGauss-1.1.0-openEuler-64bit.sha256      version.cfg<br />
openGauss-1.1.0-openEuler-64bit.tar.bz2<br />
使用gs_preinstall准备好安装环境，切换到gs_preinstall命令所在目录。<br />
[root@ecs-c9bf openGauss]# cd /opt/software/openGauss/script/<br />
[root@ecs-c9bf script]# python gs_preinstall -U omm -G dbgrp -X /opt/software/openGauss/clusterconfig.xml<br />
Are you sure you want to create trust for root (yes/no)? yes<br />
Please enter password for root.<br />
Password:  --说明：此处输入密码时，屏幕上不会有任何反馈，不用担心，这是LINUX操作系统对密码的保护.<br />
Creating SSH trust for the root permission user.<br />
创建操作系统omm用户，并对omm创建trust，并设置密码<br />
Are you sure you want to create the user[omm] and create trust for it (yes/no)? yes<br />
Please enter password for cluster user.<br />
Password:<br />
Please enter password for cluster user again.<br />
Password:<br />
Successfully created [omm] user on all nodes.<br />
10、执行安装<br />
[root@ecs-c9bf script]# chmod -R 755 /opt/software/openGauss/script<br />
[root@ecs-c9bf script]# su - omm<br />
[omm@ecs-c9bf ~]$ gs_install -X /opt/software/openGauss/clusterconfig.xml --gsinit-parameter=&quot;–encoding=UTF8&quot;  --dn-guc=“max_process_memory=4GB”  --dn-guc=“shared_buffers=256MB” --dn-guc=“bulk_write_ring_size=256MB” --dn-guc=“cstore_buffers=16MB”<br />
数据库使用<br />
[root@ecs-c9bf script]# su - omm<br />
[omm@ecs-c9bf ~]$ gs_om -t start<br />
Starting cluster.</h1>
<p>=========================================<br />
Successfully started.<br />
[omm@ecs-c9bf ~]$ gsql -d postgres -p 26000 -r<br />
postgres=# alter role omm identified by ‘Bigdata@123’ replace ‘GaussDB@123’;<br />
postgres=# CREATE USER joe WITH PASSWORD “Bigdata@123”;<br />
postgres=# CREATE DATABASE db_tpcc OWNER joe;<br />
postgres=#  \q<br />
[omm@ecs-c9bf ~]$ gsql -d db_tpcc -p 26000 -U joe -W Bigdata@123  -r<br />
db_tpcc=&gt; CREATE SCHEMA joe AUTHORIZATION joe;<br />
db_tpcc=&gt;  CREATE TABLE mytable (firstcol int);<br />
CREATE TABLE<br />
db_tpcc=&gt; INSERT INTO mytable values (100);<br />
db_tpcc=&gt; SELECT * from mytable;  firstcol  ----------       100 (1 row)</p>
<p>三、实验结果<br />
1.启动服务。<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-aaa20e8e-abc0-49a4-91b1-983a2161a46f.png" alt="1B09116E7BBB4DEB85E8BC30F9A71F89.png" /></p>
<p>2.使用新用户连接到db_tpcc数据库。<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-fe5c4622-dfe4-4def-af2f-342255e11ccc.png" alt="77662B2147D448EAA5E67D4FFE24D8DE.png" /></p>
<p>3.查看表中数据。<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-fa26ebe1-b6eb-4444-89fd-3417e33dc9fb.png" alt="3C0F246CE2B544D19BEC15701B67B3A5.png" /></p>
<p>四、分析总结<br />
通过这个实验，我学习了弹性云服务器（openEuler）上安装部署openGauss数据库，并进行简单的数据库相关操作。<br />
这个实验做的过程中必须严格按照实验指导书上的步骤完成。当操作过程中遇到问题时可以认真查找错误，如果检查不出来就要重头开始做或者重新购买服务器。</p>
<p>参考文献：《数据库指导手册》华为技术有限公司</p>
<p>实验二  openGauss金融场景化实验</p>
<p>一、实验内容<br />
1、内容描述：本实验以金融行业为场景，设计数据库模型，并使用华为openGauss构建金融场景下的数据库。通过对数据库中的对象（表、约束、视图、索引等）创建，掌握基础SQL语法，并通过对表中数据的增删改查，模拟金融场景下的业务实现。<br />
2、实验概览：<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-0d16d170-a5eb-4add-94f6-abbccd7d50a4.png" alt="062A12550AB346879407798FA0F7ED77.png" /><br />
实验概览图</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-a4b0c4a4-e13a-4d00-8c33-6ecfe2f86b7f.jpeg" alt="F6D430E6CDA840CFB100CCC548CEB832.jpeg" /><br />
金融数据模型ER图</p>
<p>二、实验过程及结果</p>
<p>1.创建完所有表后，截图查询插入结果，例如select count(*) from bank_card;（挑选2个表）</p>
<p>①对client表进行数据初始化。执行insert操作。查询插入结果。<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-4e2248d0-6c2e-4876-b4d8-0496acc1b8c1.jpeg" alt="8ECFC9F225514F0B825AA68402959D85.jpeg" /></p>
<p>②对bank_card表进行数据初始化。执行insert操作。查询插入结果。<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-ea211f3b-105d-48f1-b2d7-eeb549aabc9b.jpeg" alt="3C2BEB41D16A49098F45535C1C3B6DC0.jpeg" /></p>
<p>2.截图重新命名索引的过程（重命名语句和成反馈的结果）。<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-440be173-28aa-43d5-854f-e3a8f4b3d6e6.jpeg" alt="BC54E29640264A7887AF40C140F7F989.jpeg" /></p>
<p>3.使用JDBC连接数据库的执行结果（查询到websites表中的数据）。<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-80ea8bf1-7541-4dfe-9741-ccbf8fcf812a.png" alt="6969C8B19F314849AA51E7B4BFB9AD96.png" /></p>
<p>三、分析总结<br />
这个实验的前两步比较简单，我在做第三步的时候遇到了很多困难。<br />
1.当我做到要使用gs_ctl将策略生效时，输入gs_ctl reload -D /gaussdb/data/db1/，此时服务器告诉我数据库里名为“postmaster.pid”的文件不存在，因此我只好购买了一个弹性公网IP地址为“124.70.111.125”的服务器重新安装后，再开始做实验二，顺利解决了问题。<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-55a301da-9fbe-4375-a0c1-84c8c359c989.png" alt="7900AF029BC1477EA8FB2E24FB866807.png" /><br />
2.接着往下做，我根据实验报告里提供的连接去下载安装了JDK，但等我安好并且配置完环境变量后，我发现本实验要求的是261版本，和我从官网下载的291版本不符合。因此我又花了一番功夫卸载掉JDK291，删掉注册表，并且修改环境变量，最终才把261版本安装好。</p>
<p>3.终于安好了JDK，当我要在cmd里对Java程序编译时，总是提醒我“错误：编码utf-8的不可映射字符”，我查询到这是因为我的程序里有中文才会这样，于是我将程序修改为“ANSI”编码，但依然提示错误。最后迫不得已，我将程序中的中文替换成英文，并将不必要的中文注释删除，最后编译成功。<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-b9ea7842-60bb-4d21-9f8a-46594e4870a8.png" alt="93EBB86EF59F412C9A640E26BE152CC1.png" /><br />
通过这次实验，我掌握了创建数据表、插入表数据、如何手工插入一条数据、添加约束、查询数据、数据的修改和删除、视图的使用、创建和重命名索引、创建新用户和授权、删除schema、用JDBC连接数据库等等这些操作方法。这都是这个实验本身带给我的一些非常实用的操作方法。<br />
同时，在做第三步时，我还额外学到了怎样把java卸载干净；在重新配置和安装服务器时，我体会到了做实验总是会出现很多意外，一定要有耐心；在编译java时，出现了问题也要尽量去解决，总会有办法的。</p>
<p>实验三  openGauss数据库维护管理</p>
<p>一、实验内容<br />
1、实验内容：本实验适用于 openGauss数据库，通过该实验可以顺利完成对数据库各项日常基本维护管理。本实验主要包括操作系统参数检查、openGauss健康状态检查、数据库性能检查、日志检查和清理、时间一致性检查、应用连接数检查、例行维护表等。<br />
2、实验概览：<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-cb3ff7b3-692b-4373-9ffe-60da780784c3.png" alt="274FC44D3F604DEAA933F57C8783BA26.png" /><br />
实验概览图</p>
<p>二、实验过程及结果</p>
<p>1.操作系统参数检查截图，在参数配置文件（/etc/sysctl.conf）中将参数 vm.min_free_kbytes(表示：内核内存分配保留的内存量) 的值调整为3488后，通过执行gs_checkos -i A --detail 查看更详细的信息。</p>
<p>①首先执行gs_checkos 对系统参数进行检查，可以看到A6为warning。<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-23cf4b2f-8ae6-4827-85f7-0776763357a8.png" alt="163A29E3665F4F50913A6B2BF35E1915.png" /></p>
<p>②修改vm.min_free_kbytes(表示：内核内存分配保留的内存量) 的值调整为3488后，通过执行gs_checkos -i A --detail 查看更详细的信息。<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-bb6bdc8c-e555-4255-88fc-9582d4739c61.png" alt="162461686DAB45D0A50A586D693C960D.png" /></p>
<p>③按详细信息中的修改说明对系统参数进行修改。<br />
vm.min_free_kbytes的值由3488调整为152444<br />
net.ipv4.tcp_retries1的值由3调整为5.<br />
net.ipv4.tcp_syn_retries的值由6调整为5.<br />
net.sctp.path_max_retrans的值由5调整为10<br />
net.sctp.max_init_retransmits的值由8调整为10<br />
执行sysctl -p 命令使刚才修改的参数生效后，再次通过执行gs_checkos -i A 查看系统参数检查是否能通过。可以看到此时A6为Normal。<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-3431f71d-701f-4e64-ac81-3bbfef541755.jpeg" alt="D282D0B702394126A371AC9077F5D289.jpeg" /></p>
<p>2.设置最大连接数，在omm 用户环境下通过gs_guc工具来增大参数值的过程（语句和反馈结果）。<br />
①语句和反馈结果<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-b6cd2aec-85dc-4a20-9a38-bb75ebbbd429.jpeg" alt="F0B67253D71448C08380B8DD7FF84CE4.jpeg" /></p>
<p>②验证是否为设置后的最大连接数<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-a14aabfa-19c4-42dd-b8a3-9e2d3f020bc5.jpeg" alt="BB4B64E1BA4E4DEFB3D2347F2B9E1316.jpeg" /></p>
<p>3.例行表、索引的维护，截图查看特定表的统计信息。(查询pg_stat_all_tables这张表的信息)<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-c717c3aa-581d-4293-aa65-0e88aa53f70e.jpeg" alt="B7AB12DA600B4005A4A6216493FCE40C.jpeg" /></p>
<p>三、分析总结<br />
通过这个实验，我掌握了操作系统参数检查、openGauss健康状态检查、数据库性能检查、日志检查、最大连接数的设置、例行表和索引的维护等等操作方法。<br />
我在这个实验中遇到的问题和收获有：<br />
1.在调整系统参数值时，直接复制了实验指导书中的“vm.min_free_kbytes = 348844”，因此在检查系统参数的调整能否通过时一直显示Abnormal，后来我通过执行“gs_checkos -i A --detail”查看更详细的信息，发现应当将“vm.min_free_kbytes”的值调整为152444，经过修改并且使修改的参数生效后，A6终于显示为Normal。

2.在进行openGauss健康状态检查、数据库性能检查实验时，要注意数据库服务什么时候该启动和关闭。分别使用“gs_om -t stop;”和“gs_om -t start;”来控制数据库的normal和unavailable状态。有的时候会提示你需要restart,此时需要用“gs_om -t restart;”来重启数据库。

3.在设置最大连接数时，我掌握了两种方法来设置。一种是在omm 用户环境下通过gs_guc工具来增大参数值，一种是用alter system set 语句来设置此参数。
