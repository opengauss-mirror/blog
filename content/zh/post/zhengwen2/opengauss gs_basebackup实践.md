+++

title = "opengauss gs_basebackup实践" 

date = "2021-07-09" 

tags = ["opengauss gs_basebackup实践"] 

archives = "2021-07" 

author = "邹阳" 

summary = "opengauss gs_basebackup实践"

img = "/zh/post/zhengwen2/img/img38.jpg" 

times = "12:30"

+++

# opengauss gs_basebackup实践<a name="ZH-CN_TOPIC_0000001085018737"></a> 

<html data-n-head-ssr>
  <body >

<div class="emcs-page-content" data-v-229ac844><div class="main-box" data-v-229ac844><div class="db-detail-content emcs-table" data-v-229ac844><div class="editor-content-styl" data-v-229ac844><p>详细参考 https://gitee.com/opengauss/docs  中的备份与恢复篇</p>
<p>https://gitee.com/opengauss/docs/blob/master/content/zh/docs/Administratorguide/%E5%A4%87%E4%BB%BD%E4%B8%8E%E6%81%A2%E5%A4%8D.md</p>
<p>以下文字摘至官方文档。</p>
<p>openGauss部署成功后，在数据库的运行过程中，往往会遇到各种问题及异常状态。</p>
<p>openGauss提供了gs_basebackup工具用作基础的物理备份。它可以实现对数据文件的二进制拷贝备份，其实现原理使用了复制协议。</p>
<p>远程执行gs_basebackup时，需要使用系统管理员账户。</p>
<p>Ø<strong>备份的前提条件</strong></p>
<p>1.备份客户端可以正常连接openGauss数据库；</p>
<p>2.pg_hba.conf中需要配置允许复制链接，且该连接必须由一个系统管理员建立；</p>
<p>3.如果xlog传输模式为stream模式，则需要配置max_wal_senders的数量, 至少有一个可用；</p>
<p>4.如果xlog传输模式为fetch模式，则需要把wal_keep_segments参数设置得足够高，确保在备份完毕之前日志不会被移除；</p>
<p><strong>Tips</strong> ：</p>
<p>1.gs_basebackup 支持全量备份，不支持增量；</p>
<p>2.gs_basebackup 支持简单备份格式和压缩备份格式；</p>
<p>3.gs_basebackup 在备份包含绝对路径的表空间时，不能在同一台机器上进行备份，会产生冲突；</p>
<p>4.若打开增量检测点功能且打开双写, gs_basebackup也会备份双写文件；</p>
<p>5.若pg_xlog目录为软链接，备份时将不会建立软链接，会直接将数据备份到目的路径的pg_xlog目录下；</p>
<p>6.备份过程中收回用户的备份权限，可能导致备份失败，或者备份数据不可用。</p>

#####  一、环境简介
<p>两台主机分别为 node01  node02   分别安装opengauss 2.0   opengauss2.0.1 数据库</p>

#####  二、主库中创建新数据库，并备份恢复至备库
<p>CREATE DATABASE mydb WITH ENCODING ‘GBK’ template = template0;</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-b8961141-3b40-4cca-ae2a-afec24cefe74.png" alt="image20210707182235155.png" /></p>
<p>使用该数据库并创建表空间、表</p>
<p>查看当前使用的数据库</p>
<p>select current_catalog,current_database();</p>
<p>列出所有的数据库</p>
<p>\l</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-54640699-567c-4b08-b644-cf934eca1e83.png" alt="image20210708163732041.png" /></p>
<p>\c  &lt;要使用的数据库名称&gt;   连接mydb</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-6e54ae5f-51b1-4618-b2fd-cba735ee0fb4.png" alt="image20210708163915384.png" /></p>
<p>\db 查询对应的数据库下的表空间</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-b9a442cf-d040-4338-9cd6-e98396173317.png" alt="image20210708164101815.png" /></p>
<p>创建表空间</p>
<p>create tablespace mytbs RELATIVE LOCATION  ‘tablespace/mytbs’;</p>
<p>创建测试表</p>
<p>create table table_in_mytbs_ts (col1 char(10)) tablespace mytbs;</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-268264dc-e973-4895-85bb-4ca5b194d824.png" alt="image20210708170539527.png" /></p>
<p><strong>gs_basebackup备份参数介绍</strong></p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-e50b2f31-8530-41e8-b261-8d425393efd4.png" alt="image20210710140932539.png" /></p>
<p>在主库修改pg_hba.conf 配置添加配置</p>
<p>host   replication  rep1    172.16.100.0/24     sha256</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-8d3ea828-e444-40b8-a713-4028b05e9e67.png" alt="image20210710141553860.png" /></p>
<p>修改参数后重启数据库</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-b1f440b1-a775-497d-837f-7216efa8ff1c.png" alt="image20210710142554436.png" /></p>
<p>创建复制用户</p>
<p><strong>–创建备份用户并放开权限</strong>(远程执行gs_basebackup时，需要使用系统管理员账户)</p>
<p>postgres=# create user rep1 with sysadmin identified by ‘huawei@1234’;</p>
<p>在备库创建备份</p>
<p>su - omm</p>
<p>gs_basebackup -D /home/omm/gs_bak -h 172.16.100.26 -p 26000 -U rep1 -W</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-37e47d0f-2b81-41de-9713-feaef570f475.png" alt="image20210710143331004.png" /></p>
<p>可以看到备份其实是将目录做了拷贝</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-088940ea-8c35-4062-aa85-70994121ca72.png" alt="image20210710143413887.png" /></p>
<p>本机恢复</p>
<p>首先删除mydb</p>
<p>drop database mydb</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-5b19d291-2ea8-49d2-83e2-6124d317cce0.png" alt="image20210710152158022.png" /></p>
<p>将备份从备机传至主机</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-760392ad-ac6d-4734-8d83-3ba59f6b623a.png" alt="image20210710152658230.png" /></p>
<p>将数据库原目录改名，并将备份目录改成原数据库目录的名字</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-02d7627b-8d2b-4834-bb53-819d1b5d505d.png" alt="image20210710152800332.png" /></p>
<p>启动数据库</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-7731b184-be99-4c3b-a59b-3722bffa38c3.png" alt="image20210710152910645.png" /></p>
<p>验证原数据库已经找回</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-779f7c5e-ae80-4048-8518-ce96bf803a9b.png" alt="image20210710152953781.png" /></p>
<p>备机恢复</p>
<p>修改备份文件中的postgresql.conf  IP地址</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-43d1be20-cbef-4151-bbfe-4b6e5f7dd3ee.png" alt="image20210710153241580.png" /><br />
备库停止数据库，并将主库的备份文件挪到数据库目录下</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-10aa2d1e-d823-4646-af12-4650294df5c0.png" alt="image20210710153418909.png" /></p>
<p>修改目录，将数据库原目录改名，将备份目录改名为数据库目录</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-c32ad3bc-3b76-4fc7-81d6-1bad7e89ce66.png" alt="image20210710153455102.png" /></p>
<p>启动数据库，验证成功</p>
<p><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210710-81f31736-ff90-4768-948a-e42b4c593a65.png" alt="image20210710153627215.png" /></p>
<p>小贴士，实践验证，opengauss 2.0 中创建的库，可以在opengauss 2.0.1 中正常打开。文中的node01 为2.0  node02 为 2.0.1</p>
</div> 
<script src="https://cdn.modb.pro/_nuxt/386d4c40ac7324fcc146.js" defer></script><script src="https://cdn.modb.pro/_nuxt/modb.2.210.2.js" defer></script><script src="https://cdn.modb.pro/_nuxt/modb.2.210.0.js" defer></script>
  </body>
</html>

