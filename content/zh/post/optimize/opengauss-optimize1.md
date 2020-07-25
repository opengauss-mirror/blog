+++
title = "openGauss数据库性能调优"
date = "2020-07-25"
tags = ["openGauss数据库性能调优"]
archives = "2020-07"
author = "zhijing"
summary = "openGauss数据库性能调优"
img = "/zh/post/xingchen/title/title.jpg"
times = "19:30"
+++


### 概述

本文描述了opengauss数据库内核基于Taishan服务器，在openEuler操作系统上，为了达到数据库的极致性能，所依赖的关键系统级调优配置。

**硬件规格：** \
CPU:	Kunpen-920 ARM aarch64 96核/128核 两路socket NUMA node 0-23,24-47,48-71,72-95 \
内存:	256G \
磁盘:	3T SSD * 4 \
网卡:	1000Mb/s version: 1.9.37.2 Huawei Technologies Co., Ltd. HiSilicon PCI-PCI Bridge (rev 20) (prog-if 00 [Normal decode])

**软件规格：** \
操作系统:	openEuler 20.03 (LTS) \
数据库: openGauss 1.0.0 \
Benchmark: benchmarksql-5.0 \
jdk:	jdk1.8.0_212 \
ant: apache-ant-1.9.15 



文章通过配置BIOS、操作系统、文件系统、网络、绑核，构造TPCC测试数据等几个方面来对数据库进行调优。
- 依赖三方工具 `jdk ant benchmark`
- linux工具 `htop iostat`

benchmark htop iostat工具的安装使用请参照：[benchmark使用](/zh/post/optimize/opengauss-tpcc/)

### 操作参考顺序

配置bois -> 格式化磁盘 -> 安装数据库 -> 安装Java -> 安装ant -> 安装benchmark -> 修改中断优化 -> 修改benchmark内配置文件（建表，建索引，运行配置文件） -> 修改数据库GUC配置参数 -> 创建表空间-> 分盘 -> 安装htop，安装iostat -> 启动benchmark生成数据 -> 备份数据库gaussdata目录（拷贝过程分盘软连接也会跟着备份）-> 启动一次压力测试，查看iostat和htop效果，等待tpmc结果 -> stop数据库 -> 清空缓存 -> gaussdata数据恢复

如上步骤完成一轮测试。修改GUC参数后，可重新启动进行下一轮测试

### BIOS配置

重启服务器进入BIOS界面，修改配置并重启 (服务器管理系统以实际为准，本文章以huawei IBMC系统为例)

**1. 通过浏览器（推荐Chrome）登录BMC系统** \
**2. 进入服务器远程控制台（例如 BMC）**
![](../images/loginibmc.png)
**3. 通过远程控制台重启服务器**

> 对于已经安装操作系统的机器 

<1>  使用root账号登录到操作系统 \
<2>   停止opengauss数据库服务 \
<3>  执行命令重启操作系统 
```shell

[root@localhost ~]# sync; sync
[root@localhost ~]# reboot

```

> 对于未安装操作系统情况

强制下电再上电
![](../images/stopvm.png)

**4. 重启后登录BIOS**

<1> 机器自检后，会提示启动选项
![](../images/bios1.png)
<2> 按“Del”键，进入BIOS
![](../images/bios2.png)
<3> 输入BIOS密码
![](../images/bios3.png)
<4> 恢复出厂设置

按下“F9”，恢复出厂设置  
*重要：因为现有的BIOS可能被改动过诸多默认设置，为保险起见，建议首先恢复出厂设置*

**5. 修改相关BIOS设置**

修改包括下面三项配置
```

# BIOS->Advanced->MISC Config，配置Support Smmu为Disabled
# BIOS->Advanced->MISC Config，配置CPU Prefetching Configuration为Disabled
# BIOS->Advanced->Memory Config，配置Die Interleaving为Disable

```

![](../images/bios4.png)
![](../images/bios5.png)

**6. 保存相关BIOS设置，并重启**

按“F10”保存并退出，重新启动系统
![](../images/bios6.png)

### 操作系统配置

**1. 优化操作系统相关配置**

关闭Irq balance：opengauss数据库抢占客户端的CPU，导致CPU使用不均衡；
如果`htop`呈现出部分CPU压力很大，部分CPU很空闲时需要考虑是否关闭了irqbalance
![](../images/os3.png)

```shell

service irqbalance stop
echo 0 > /proc/sys/kernel/numa_balancing
echo 'never' > /sys/kernel/mm/transparent_hugepage/enabled
echo 'never' > /sys/kernel/mm/transparent_hugepage/defrag
echo none > /sys/block/nvme*n*/queue/scheduler  ## 针对nvme磁盘io队列调度机制设置

```

### 文件系统配置

**1. 修改xfs文件系统blocksize为8K**

<1> 确认nvme盘对应加载点的现有blocksize
下面命令查看当前挂载的nvme盘

```shell

df -h | grep nvme

```

```
/dev/nvme0n1                3.7T  2.6T  1.2T  69% /data1
/dev/nvme1n1                3.7T  1.9T  1.8T  51% /data2
/dev/nvme2n1                3.7T  2.2T  1.6T  59% /data3
/dev/nvme3n1                3.7T  1.4T  2.3T  39% /data4
```
`xfs_info`命令可以查看nvme盘的信息

```shell

xfs_info /data1

```
![](../images/fs1.png)

上图中block的大小正好为8K, 不需要修改。若不满足8k块大小的要求, 需要重新格式, 格式化前注意数据的备份。

<2> 针对需要格式化的磁盘，备份所需的数据

用户注意根据需要，将所需数据备份至其他磁盘或其他机器

<3> 重新格式化磁盘，设置block大小8k

以/dev/nvme0n1盘，加载点为/data1为例，相关参考命令如下

```shell

umount /data1
mkfs.xfs -b size=8192 /dev/nvme0n1 -f
mount /dev/nvme0n1 /data1

```

<4> 再次用`xfs_info`命令确认blocksize是否修改正确

### 网络配置

**1. 多中断队列设置**

针对泰山单核能力不足，核数又较多的情况，产品需要在服务器端，客户端均使用网卡多队列（默认16队列）的规格。 \
当前推荐的配置为：服务器端网卡配置16中断队列，客户端网卡配置48中断队列。 

多中断队列设置工具(1822-FW) \
Hi1822网卡发布版本可以从如下链接获取，IN500 solution 5.1.0.SPC401及之后正式支持设置多队列：
https://support.huawei.com/enterprise/zh/intelligent-accelerator-components/in500-solution-pid-23507369/software 

<1> 解压Hi1822-NIC-FW.zip, 进入目录，在root用户下安装hinicadm
![](../images/netcf1.1.png)
<2> 确定当前连接的物理端口是哪个网卡的，不同硬件平台这个网口和网卡名有差别。以如下示例机器为例，当前使用enp3s0的小网网口，属于hinic0网卡
![](../images/netcf1.2.png)
![](../images/netcf1.3.png)
    
<3> 进入config目录， 利用配置工具`hinicconfig`配置中断队列FW配置文件；
    
```
64队列配置文件：std_sh_4x25ge_dpdk_cfg_template0.ini；
16队列配置文件：std_sh_4x25ge_nic_cfg_template0.ini； 
对hinic0卡配置为不同队列数（默认16队列，可以按需要调整）
```

```shell

./hinicconfig hinic0 -f std_sh_4x25ge_dpdk_cfg_template0.ini

```
重启生效，输入命令ethtool -l enp3s0查看（比如下图表示修改为32）
![](../images/netcf1.4.png)

修改combined的值，输入命令`ethtool -L enp3s0 combined 48`（不同平台，不同应用的优化值可能不同，当前96核和128核平台，服务器端调优值为16，客户端调优值为48）

**2. 中断调优**

在openGauss数据库满跑的情况下（CPU占比90%以上），CPU成为瓶颈，开启offloading，将网络分片offloading到网卡上
```shell

ethtool –K enp3s0 tso on
ethtool –K enp3s0 lro on
ethtool –K enp3s0 gro on
ethtool –K enp3s0 gso on

```
以1620平台为例，网卡中断绑定每个numa node中最后4个core，每个core绑定3个中断。绑核中断脚本如下所示，此脚本将在openGauss安装的时候在gs_preinstall被调用，具体执行步骤请查看产品安装说明书：
![](../images/netcf2.1.png)

```shell

sh bind_net_irq.sh  16

```

**3. 网卡固件确认与更新**
    
> 确认当前环境的小网网卡固件版本是否为2.5.0.0
```shell

ethtool -i enp3s0

```
```
driver: hinic                                
version: 2.3.2.11                            
firmware-version: 2.5.0.0                    
expansion-rom-version:                       
bus-info: 0000:03:00.0 
```

如果是2.5.0.0，建议更换为2.4.1.0，以获得更佳性能

> 网卡固件更新步骤

<1> 上传附件至服务器
Hi1822_nic_prd_1h_4x25G.bin

<2> 使用root执行如下命令
```` shell

hinicadm updatefw -i <物理网卡设备名> -f <固件文件路径>

````
其中，“物理网卡设备名”为网卡在系统中的名称，例如“hinic0”表示第一张网卡，“hinic1”表示第二张网卡，查找方法参见前文“多中断队列设置”。
例如：
```

Please do not remove driver or network device 
Loading... 
[>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>]  [100%] [\] 
Loading firmware image succeed. 
Please reboot OS to take firmware effect.

```
<3> 重启服务器，再确认小网网卡固件版本成功更新为2.4.1.0
```shell

ethtool -i enp3s0  

```
```
driver: hinic                                
version: 2.3.2.11                            
firmware-version: 2.4.1.0                    
expansion-rom-version:                       
bus-info: 0000:03:00.0 
```
确认小网网卡固件版本成功更新成功

### 数据库服务端及客户端绑核

安装数据库, 具体参考openGauss安装文档。
这一节简单的说就是： \
1、停止数据库 \
2、修改postgresql.conf文件，在最后添加业务场景/生产场景/极限场景配置，之后修改thread_pool_attr参数。 \
3、以绑核方式启动数据库 ：`numactl -C 0-27,32-59,64-91,96-123 gaussdb --single_node -D /data1/gaussdata  -p 3625 &` 按照各自的路径和thread_pool_attr配置修改该启动命令 \
4、修改启动benchmark的启动命令：`numactl -C 28-31,60-63,92-95,124-127 ./runBenchmark.sh 108_zzj_props.pg ` 按照自己的绑核配置和benchmark配置文件执行此命令。这里的绑核参数是在数据库绑核参数的空隙。 \
5、安装htop工具  https://www.cnblogs.com/paul8339/p/5802423.html \
6、`iostat –xm 1` 1s显示一次磁盘io状态 \
7、每经过一次测试，为保证下次数据可靠性进行一次清空缓存的操作，如下： \
```shell

free -g
ipcs -m | awk '$2 ~/[0-9]+/ {print $2}' | while read s; do ipcrm -m $s; done
echo 3 > /proc/sys/vm/drop_caches    ##清空缓存（更多的用内存，降低io压力）
free -g

```

**1. 服务器端绑核设置**

<1> 业务进程在运行过程中，硬件上报的网络中断会导致频繁的上下文切换，严重影响效率，因此需要将网络中断和业务分开绑定在不同的核上运行，网络中断绑核请查看上一节

<2> 当前openGauss中引入了线程池机制，即数据库启动时，线程池将创建指定数目的线程来服务，线程在创建时会进行绑核，因此需要将网卡的绑核信息通过 GUC 参数传入，方便运行期间绑核设置。以128核为例，对应参数如下图
![](../images/core1.png)
其中线程总数为（cpu总数128 - 处理网络的cpu数目16）* 每个核上线程数（经验值推荐7.25） = (128-16)*7.25 = 812，numa节点数为4，处理中断的核数为16。

如下为辅助分配绑定CPU：

```shell

numactl -C 0-27,32-59,64-91,96-123 gaussdb --single_node -D /data1/gaussdata  -p 3625 &
或者：
numactl --interleave=all gaussdb --single_node -D /data1/gaussdata -p 3625 &

```

<!-- ```shell

numactl --interleave=all 
numactl -C 0-27,32-59,64-91,96-123 gaussdb --single_node -D /ssd/ommd/gaussdata  -p 3629 &
numactl -C 0-25,32-57,64-89,96-121 gaussdb --single_node -D /ssd/omm108/gaussdata  -p 3630 &

```
```
0-25,32-57,64-89,96-121  gaussdb
26-31,58-63,90-95,122-127  tpcc
0-23,32-55,64-87,96-119  gaussdb   （最高103W）
24-31,56-63,88-95,120-127  tpcc
0-24,32-56,64-88,96-120  gaussdb   （102W）
25-31,57-63,89-95,121-127  tpcc
``` -->

**2. 服务器端参数设置**

postgresql.conf中新增如下参数：
- `advance_xlog_file_num = 10` \
此参数表示后台线程BackgroundWALWriter周期性地提前检测并初始化未来10个XLog文件，避免事务提交时才去执行XLog文件初始化，从而降低事务提交时延。只有在性能压力测试时作用才会体现出来，一般不用配置。默认为0，即不进行提前初始化。
- `numa_distribute_mode = 'all'` \
此参数目前有all和none两个取值。all表示启用NUMA优化，将工作线程和对应的PGPROC、WALInsertlock进行统一分组，分别绑定到对应的NUMA Node下，以减少关键路径上的CPU远端访存。默认取值为none，表示不启用NUMA分布特性。只有在涉及到多个NUMA节点，且远端访存代价明显高于本地访存时使用。当前建议在性能压力测试情况下开启。

**3. TPCC客户端绑核设置**

客户端通过 numactl 将客户端绑定在除网卡外的核上，下图以 128 核环境举例，共80个核用于处理业务逻辑，剩余48个核处理网络中断。

![](../images/core2.png)

对应tpmc程序应该使用为：

```

numactl -C 0-27,32-59,64-91,96-123 ./runBenchmark.sh props.pg ## 26-31,58-63,90-95,122-127 这些核用来处理网络中断
或者
numactl --interleave=all

```

### 构建TPCC初始数据

benchmark的安装和使用参照文档：[benchmark使用](/zh/post/optimize/opengauss-tpcc/)

**1. 修改benchmark配置**

复制props.pg并重命名为props.opengauss.1000w，编辑该文件，将如下配置覆盖到文件里面
```shell

cp props.pg props.opengauss.1000w
vim props.opengauss.1000w

```

```

db=postgres
driver=org.postgresql.Driver
// 修改连接字符串, 包含ip, 端口号, 数据库
conn=jdbc:postgresql://ip:port/tpcc1000?prepareThreshold=1&batchMode=on&fetchsize=10
// 设置数据库登录用户和密码
user=user
password=******

warehouses=1000
loadWorkers=200

// 设置最大并发数量, 跟服务端最大work数对应
terminals=812
//To run specified transactions per terminal- runMins must equal zero
runTxnsPerTerminal=0
//To run for specified minutes- runTxnsPerTerminal must equal zero
runMins=5
//Number of total transactions per minute
limitTxnsPerMin=0

//Set to true to run in 4.x compatible mode. Set to false to use the
//entire configured database evenly.
terminalWarehouseFixed=false

//The following five values must add up to 100
//The default percentages of 45, 43, 4, 4 & 4 match the TPC-C spec
newOrderWeight=45
paymentWeight=43
orderStatusWeight=4
deliveryWeight=4
stockLevelWeight=4

// Directory name to create for collecting detailed result data.
// Comment this out to suppress.
resultDirectory=my_result_%tY-%tm-%td_%tH%tM%tS
osCollectorScript=./misc/os_collector_linux.py
osCollectorInterval=1
// 收集OS负载信息
//osCollectorSSHAddr=osuer@10.44.133.78
//osCollectorDevices=net_enp3s0 blk_nvme0n1 blk_nvme1n1 blk_nvme2n1 blk_nvme3n1

```

**2. TPCC导入数据前准备**

<1> 替换tableCreats.sql文件
[tableCreates.sql](../images/tableCreates.sql)
使用该文件替换benchmarkSQL中的文件, 路径为
benchmarksql-5.0/run/sql.common/ \
*该文件主要增加了两个表空间和一些附加数据属性*

<2> 修改索引indexCreates.sql
修改run/sql.common/indexCreates.sql文件
![](../images/index1.png) \
修改上图中红框中的内容如下： \
![](../images/index2.png)

同时，该文件中添加红色内容，可以在benchmark自动生成数据的时候自动生成到不同的数据表空间，如果未添加可以在benchmark生成数据之后再数据库端修改。用于分盘。
![](../images/index3.png)

<3> 修改runDatabaseBuild.sh文件
修改下图内容可避免生产数据时候的外键不支持错误
![](../images/index4.png)

**3. 导入数据**

运行runDatabaseBuild.sh导入数据

**4. 数据备份**

为了方便多次测试, 减少导数据的时间, 可以将导好的数据备份, 一种常用的做法是: 停止数据库, 将整个数据目录做一次拷贝。 恢复时参考脚本如下
```shell

#!/bin/bash
rm -rf /ssd/omm108/gaussdata
rm -rf /usr1/omm108dir/tablespace2
rm -rf /usr2/omm108dir/tablespace3
rm -rf /usr3/omm108dir/pg_xlog
cp -rf /ssd/omm108/gaussdatabf/gaussdata /ssd/omm108/ &
job0=$!
cp -rf /usr1/omm108dir/tablespace2bf/tablespace2 /usr1/omm108dir/ &
job1=$!
cp -rf /usr2/omm108dir/tablespace3bf/tablespace3 /usr2/omm108dir/ &
job2=$!
cp -rf /usr3/omm108dir/pg_xlogbf/pg_xlog /usr3/omm108dir/ &
job3=$!
wait $job1 $job2 $job3 $job0

```
**5. 数据分盘**

在性能测试过程中, 为了增加IO的吞吐量, 需要将数据分散到不同的存储介质上, 由于我们机器上有4块NVME盘, 可以将数据分散到不同的盘上. 我们主要将pg_xlog, tablespace2, tablespace3这三个目录放置在其他3个NVME盘上, 并在原有的位置给出指向真实位置的软连接. pg_xlog位于数据库目录下, tablespace2, tablespace3分别位于数据库目录pg_location下. 对tablespace2分盘的示例命令如下
```shell

mv $DATA_DIR/pg_location/tablespace2 $TABSPACE2_DIR/tablespace2
cd $DATA_DIR/pg_location/
ln -svf $TABSPACE2_DIR/tablespace2 ./

```
举例：
将数据库安装目录，pg_xlog，tablespace2，tablespace3分别链接到三个ssd盘。

1. 格式化ssd盘，见格式化ssd盘章节。

2. 进入tpcc数据库

3. 创建两个数据表空间
```sql

CREATE TABLESPACE example2 relative location 'tablespace2';
CREATE TABLESPACE example3 relative location 'tablespace3';

```
    
建立新表或删除原表的原索引再新建索引。参考以下：

```sql

\d+ bmsql_new_order  ##进入表
alter table bmsql_new_order drop constraint bmsql_new_order_pkey;  ##删除原有索引
alter table bmsql_new_order add constraint bmsql_new_order_pkey primary key(no_w_id, no_d_id, no_o_id)using index tablespace tablespace2;  ##新建索引
alter table 某表 add constraint 某表_pkey primary key (no_w_id, no_d_id, no_o_id) using index tablespace example2;
alter table 某表 constraint 某表_pkey primary key (no_w_id, no_d_id, no_o_id) using index tablespace example3

```
注*
针对下面第4步的重要标志（第4步分盘操作容易出现软连接错误，或在忘记关闭数据库的情况下进行分盘导致数据库崩溃，因此可以通过另外一种方式来实现：
1：为要分盘的目标路创建权限。\
2：针对pg_xlog的分盘，可通过在数据库初始化时添加 “-X 分盘后pg_xlog路径”参数来实现。`Eg：gs_initdb -w ****** -D /data/ommzzj/gaussdata --nodename='datanode' --dbcompatibility=A -X  /ssd2/sopengauss`  \
3：针对表空间分盘，可以通过在创建表空间时添加参数来实现，`eg：CREATE TABLESPACE example2 LOCATION '/ssd3/sopengauss1/tablespace2'; CREATE TABLESPACE example3 LOCATION '/ssd4/sopengauss1/tablespace3';）`。

4. 移动数据库目录/pg_xlog到要分盘到的目录/pg_xlog
```shell

cd 数据库目录/
ln –svf 要分盘到的目录/ pg_xlog  ./

mv 数据库目录/tablespace2  要分盘到的目录/tablespace2
cd 数据库目录/
ln –svf 要分盘到的目录/tablespace2  ./

mv 数据库目录/tablespace3  要分盘到的目录/tablespace3
cd 数据库目录/
ln –svf 要分盘到的目录/tablespace3  ./
    
```
创建完成后效果如下
![](../images/tpcc3.png)
![](../images/tpcc4.png)

**6. 运行TPCC程序**

```shell

numactl –C 0-19,32-51,64-83,96-115 ./runBenchmark.sh props.opengauss.1000w

```

**7. 性能监控**

使用`htop`监控数据库服务端和tpcc客户端CPU利用情况, 极限性能测试情况下, 各个业务CPU的占用率都非常高(> 90%), 若有CPU占用率没有达标, 可能是绑核方式不对, 需要进行调整
![](../images/monitor.png)
上图中黄线框中的是处理网络中断的CPU

数据库调优是一个繁琐的工作，需要不断去修改配置，运行TPCC，反复去调试以达到最优性能配置。

### 附

**针对128核服务器的绑核建议**

0-23,32-55,64-87,96-119      gaussdb   （最高103W） \
24-31,56-63,88-95,120-127      tpcc

0-24,32-56,64-88,96-120      gaussdb   （102W） \
25-31,57-63,89-95,121-127      tpcc