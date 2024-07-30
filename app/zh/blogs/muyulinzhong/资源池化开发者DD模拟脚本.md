## 一、具体概述：
为了方便广大开发者们方便在单机环境部署和调试openGauss资源池化架构，特总结一件生成式脚本来进行简易部署。

总体脚本分为两大部分：
- 编译安装部分：安装资源池化基本架构，包含创建基础目录、拉取每日构建包、设置环境变量和联合编译几大部分；
- 环境配置部署：在编译安装结束后，可利用该脚本进行一键编译安装，可重复执行清理残余环境重新安装；

## 二、编译安装脚本：
利用该脚本可以进行安装，所有路径与仓源配置在该文件头部，可以按照所需进行定制化更改。脚本流程较为简单，具体代码如下：
```bash
#!/bin/bash
code=/usr1/songshixuan_dd/workspace/dd_dir
dd_home=/usr1/songshixuan_dd/workspace/dd_home
rm -rf $code
rm -rf $dd_home
mkdir -p $code
mkdir -p $dd_home
touch $dd_home/dd_env
cd $code
wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/latest/binarylibs/gcc10.3/openGauss-third_party_binarylibs_openEuler_arm.tar.gz
tar -xzvf openGauss-third_party_binarylibs_openEuler_arm.tar.gz
mv openGauss-third_party_binarylibs_openEuler_arm binarys
git clone https://gitee.com/muyulinzhong/openGauss-server_test.git
mv openGauss-server_test openGauss-server
git clone https://gitee.com/opengauss/CBB.git
git clone https://gitee.com/opengauss/DSS.git
git clone https://gitee.com/opengauss/DMS.git
server_code=$code/openGauss-server
dms_code=$code/DMS
dss_code=$code/DSS
cbb_code=$code/CBB

echo "export CODE_BASE=$code/openGauss-server" >> $dd_home/dd_env
echo "export BINARYLIBS=$code/binarys" >> $dd_home/dd_env
echo "export GAUSSHOME=\$CODE_BASE/dest/" >> $dd_home/dd_env
echo "export GCC_PATH=\$BINARYLIBS/buildtools/gcc10.3" >> $dd_home/dd_env
echo "export CC=\$GCC_PATH/gcc/bin/gcc" >> $dd_home/dd_env
echo "export CXX=\$GCC_PATH/gcc/bin/g++" >> $dd_home/dd_env
echo "export LD_LIBRARY_PATH=\$GAUSSHOME/lib:\$GCC_PATH/gcc/lib64:\$GCC_PATH/isl/lib:\$GCC_PATH/mpc/lib/:\$GCC_PATH/mpfr/lib/:\$GCC_PATH/gmp/lib/:\$LD_LIBRARY_PATH" >> $dd_home/dd_env
echo "export PATH=\$GAUSSHOME/bin:\$GCC_PATH/gcc/bin:\$PATH" >> $dd_home/dd_env
echo "export DSS_HOME=$dd_home/dss/dss0/dssdba" >> $dd_home/dd_env
echo "export CM_CONFIG_PATH=$dd_home/cm_config.ini" >> $dd_home/dd_env
source $dd_home/dd_env
source $server_code/src/gausskernel/ddes/ddes_commit_id

ps -ux| grep 'dssserver -D '$dsspath | grep -v grep | awk '{print $2}' | xargs kill -9
ps -ux| grep 'gaussdb' | grep -v grep | awk '{print $2}' | xargs kill -9
ps -ux| grep 'gsql -d' | grep -v grep | awk '{print $2}' | xargs kill -9

echo "============= compile cbb ============="
cd $cbb_code
git clean -xdf
git checkout .
git pull
git reset --hard $cbb_commit_id
cd $cbb_code/build/linux/opengauss
sh build.sh -3rd $BINARYLIBS -m Debug

echo "============= compile dss ============="
cd $dss_code
git clean -xdf
git checkout .
git pull
git reset --hard $dss_commit_id
cd $dss_code/build/linux/opengauss
sh build.sh -3rd $BINARYLIBS -m DebugDsstest

echo "============= compile dms ============="
cd $dms_code
git clean -xdf
git checkout .
git pull
git reset --hard $dms_commit_id
cd $dms_code/build/linux/opengauss
sh build.sh -3rd $BINARYLIBS -m DMSTest

echo "============= compile openGauss-server ============="
cd $server_code
./configure --gcc-version=10.3.1 CC=g++ CFLAGS='-O0' --prefix=$GAUSSHOME --3rd=$BINARYLIBS --enable-debug --enable-cassert --enable-thread-safety --with-readline --without-zlib
make -s -j128
make install -s -j128
```

## 三、环境清理与重安装：
在进行安装编译结束或者需要重新安装时，可以利用该脚本进行一键重装。该脚本默认安装一主一备配置，其中值得注意的是：
1. 需要注意inst id要不同于同机器节点的其他DD模拟环境，避免产生冲突；
2. 该脚本可以根据自己的要求进行多节点配置，若想添加多备，可自行按照流程进行相应拓展；

总体脚本代码如下所示：
```bash
#!/bin/bash
code=/usr1/songshixuan_dd/workspace/dd_dir
dd_home=/usr1/songshixuan_dd/workspace/dd_home
dsspath=$dd_home/dss
datapath=$dd_home/data
source $dd_home/dd_env
dbhost=127.0.0.1
database=my_test
dbuser=$(whoami)
password=Huawei@123
dbport1=19244
dbport2=19234
dmsurl="0:127.0.0.1:3604,1:127.0.0.1:3605"
dss_nodes_lists="4:127.0.0.1:16500,5:127.0.0.1:16600"

# 清理工作
ps -ux| grep 'dssserver -D '$dsspath | grep -v grep | awk '{print $2}' | xargs kill -9
ps -ux| grep 'gaussdb' | grep -v grep | awk '{print $2}' | xargs kill -9
ps -ux| grep 'gsql -d' | grep -v grep | awk '{print $2}' | xargs kill -9
rm -rf $dsspath
rm -rf $datapath

mkdir $dsspath
mkdir $datapath

mkdir -p $dsspath/dss0/dssdba/cfg
mkdir -p $dsspath/dss0/dssdba/log
mkdir -p $dsspath/dss1/dssdba/cfg
mkdir -p $dsspath/dss1/dssdba/log
mkdir -p $dsspath/dev

dd if=/dev/zero of=$dsspath/dev/dss-dba bs=2M count=10240 >/dev/null 2>&1

touch $dsspath/dss0/dssdba/cfg/dss_inst.ini
echo "INST_ID=4
_LOG_LEVEL=255
DSS_NODES_LIST=$dss_nodes_lists
DISK_LOCK_FILE_PATH=$dsspath/dss0
LSNR_PATH=$dsspath/dss0
_LOG_MAX_FILE_SIZE=20M
_LOG_BACKUP_FILE_COUNT=128
" >> $dsspath/dss0/dssdba/cfg/dss_inst.ini


touch $dsspath/dss0/dssdba/cfg/dss_vg_conf.ini
echo "data:$dsspath/dev/dss-dba" >> $dsspath/dss0/dssdba/cfg/dss_vg_conf.ini

touch $dsspath/dss1/dssdba/cfg/dss_inst.ini
echo "INST_ID=5
_LOG_LEVEL=255
DSS_NODES_LIST=$dss_nodes_lists
DISK_LOCK_FILE_PATH=$dsspath/dss0
LSNR_PATH=$dsspath/dss1
_LOG_MAX_FILE_SIZE=20M
_LOG_BACKUP_FILE_COUNT=128
" >> $dsspath/dss1/dssdba/cfg/dss_inst.ini

touch $dsspath/dss1/dssdba/cfg/dss_vg_conf.ini
echo "data:$dsspath/dev/dss-dba" >> $dsspath/dss1/dssdba/cfg/dss_vg_conf.ini
dsscmd cv -g data -v $dsspath/dev/dss-dba -s 2048 -D $dsspath/dss0/dssdba
if [ $? -ne 0 ]; then
    echo "dsscmd cv failed."
    exit 1
fi

dssserver -D $dsspath/dss0/dssdba &
sleep 2
dssserver -D $dsspath/dss1/dssdba &
sleep 2
mkdir -p $datapath

gs_initdb -D $datapath/node1 --nodename=node1  --vgname=+data --enable-dss --dms_url="${dmsurl}" -I 0 --socketpath='UDS:'$dsspath'/dss0/.dss_unix_d_socket'
if [ $? -ne 0 ]; then
    echo "gs_initdb db1 cv failed."
    exit 1
fi

echo "ss_enable_ssl = off
listen_addresses = '*'
port = $dbport1
log_statement='all'
ss_work_thread_count = 32
shared_buffers = 5GB
segment_buffers = 1GB
" >> $datapath/node1/postgresql.conf
sed '91 ahost    all             all             0.0.0.0/0           sha256' -i $datapath/node1/pg_hba.conf

gs_initdb -D $datapath/node2 --nodename=node2  --vgname=+data --enable-dss --dms_url="${dmsurl}" -I 1 --socketpath='UDS:'$dsspath'/dss1/.dss_unix_d_socket'
if [ $? -ne 0 ]; then
    echo "gs_initdb db2 cv failed."
    exit 1
fi


echo "ss_enable_ssl = off
listen_addresses = '*'
port = $dbport2
log_statement='all'
" >> $datapath/node2/postgresql.conf

sed '91 ahost    all             all             0.0.0.0/0           sha256' -i $datapath/node2/pg_hba.conf


echo "BITMAP_ONLINE = 3
REFORMER_ID = 0" > $CM_CONFIG_PATH

gs_ctl start -D $datapath/node1 & gs_ctl start -D $datapath/node2
gsql -d postgres -p 19244 -c "ALTER ROLE "$dbuser" PASSWORD '$password';"

```