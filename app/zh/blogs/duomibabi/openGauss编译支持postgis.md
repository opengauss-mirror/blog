---
title: 'openGauss编译支持postgis'

date: '2021-01-12'

category: 'blog'
tags: ['openGauss编译指导']

archives: '2021-01'

author: '多米爸比'

summary: 'openGauss编译支持postgis'

img: '/zh/blogs/duomibabi/title/img31.png'

times: '16:30'
---

# openGauss 编译支持 postgis<a name="ZH-CN_TOPIC_0000001073212652"></a>

之前写过 openGauss 支持 oracle_fdw 和 mysql_fdw 插件的文章：[《opengauss1.0.1 支持 oracle_fdw 和 mysql_fdw》](https://www.modb.pro/db/37650)

本文介绍 openGauss 如何支持 postgis 扩展。

本文参考链接：https://gitee.com/opengauss/openGauss-server/tree/master/

## 系统环境<a name="section17436151614393"></a>

Centos7.6 x86_64

## openGauss 源码编译<a name="section1788914219380"></a>

openGauss 源码编译的过程请参考文章：[《抢鲜体验 2：openGauss 从源码到主备》](https://www.modb.pro/db/27601)

## 编译 postgis\(2.4.2\)<a name="section1169735173913"></a>

[《安装依赖》](http://postgis.net/docs/manual-2.4/postgis_installation.html#install_requirements)

## 设置环境变量<a name="section985417285407"></a>

```
su - omm
export GAUSSHOME=/opt/og
export PATH=$GAUSSHOME/bin:/usr/local/bin:/bin:/usr/bin:/usr/local/sbin:/usr/sbin
export LD_LIBRARY_PATH=$GAUSSHOME/lib:/usr/local/lib:/usr/local/lib64:/usr/lib64
export toolhome=$GAUSSHOME/pggis_tools
```

## 下载 postgis 及相关依赖包<a name="section560933294219"></a>

```
cd /opt/openGauss-server/third_party/dependency/postgis
wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/dependency/postgis-xc-master-2020-09-17.tar.gz
tar zxvf postgis-xc-master-2020-09-17.tar.gz
mv postgis-xc-master postgis-xc
```

## 先编译安装 postgis 依赖包<a name="section15309286433"></a>

```
cd postgis-xc/proj-4.9.2
chmod +x ./configure
./configure --prefix=$GAUSSHOME/pggis_tools/proj
make && make install
ldd $GAUSSHOME/pggis_tools/proj/lib/libproj.so

cd ../geos-3.6.2
chmod +x ./configure
./configure --prefix=$GAUSSHOME/pggis_tools/geos
make && make install
ldd $GAUSSHOME/pggis_tools/geos/lib/libgeos.so

cd ../json-c-json-c-0.12.1-20160607
chmod +x ./configure
./configure --prefix=$GAUSSHOME/pggis_tools/json
make && make install

cd ../libxml2-2.7.1
chmod +x ./configure
./configure --prefix=$GAUSSHOME/pggis_tools/libxml2
make && make install
ldd /opt/og/pggis_tools/libxml2/lib/libxml2.so

cd ../gdal-1.11.0
chmod +x ./configure
./configure --prefix=$GAUSSHOME/pggis_tools/gdal
make && make install
ldd /opt/og/pggis_tools/gdal/lib/libgdal.so
```

## 应用 patch 包，否则编译 postgis 会报错<a name="section15856203914449"></a>

```
cd $CODE_BASE
cd /opt/openGauss-server/
patch -p1 < third_party/dependency/postgis/postgis.patch
```

## 缺失两个文件及需要固定的路径的处理<a name="section23731027124517"></a>

```
mkdir -p /home/carrot/data/openGauss-server/third_party/buildtools/gcc/res/lib64
mkdir -p /home/carrot/data/openGauss-server/third_party/buildtools/gcc/res/lib64
chmod 755  /home/carrot/data/openGauss-server/third_party/buildtools/gcc/res/lib64

cd /opt/openGauss-server/
cp ./binarylibs/buildtools/centos7.6_x86_64/gcc8.2/gcc/lib64/libstdc++.la /home/carrot/data/openGauss-server/third_party/buildtools/gcc/res/lib64
cp ./binarylibs/buildtools/centos7.6_x86_64/gcc8.2/gcc/lib64/libstdc++.so /home/carrot/data/openGauss-server/third_party/buildtools/gcc/res/lib64
```

## 如果不加上面的处理 make 可能出现下面的错误（后续更新的版本可能没这个 bug 了）<a name="section68871437174615"></a>

```
/bin/grep: /home/carrot/data/openGauss-server/third_party/buildtools/gcc/res/lib/../lib64/libstdc++.la: No such file or directory
/bin/sed: can't read /home/carrot/data/openGauss-server/third_party/buildtools/gcc/res/lib/../lib64/libstdc++.la: No such file or directory
libtool:   error: '/home/carrot/data/openGauss-server/third_party/buildtools/gcc/res/lib/../lib64/libstdc++.la' is not a valid libtool archive
make[1]: *** [liblwgeom.la] Error 1
make: *** [all] Error 1
```

## 编译 postgis<a name="section0301525154719"></a>

```
cd /opt/openGauss-server/third_party/dependency/postgis/postgis-xc/postgis-2.4.2

./configure --prefix=$toolhome/pggis2.4.2 \
--with-pgconfig=$GAUSSHOME/bin/pg_config \
--with-projdir=$toolhome/proj \
--with-geosconfig=$toolhome/geos/bin/geos-config \
--with-jsondir=$toolhome/json \
--with-xml2config=$toolhome/libxml2/bin/xml2-config \
--with-raster \
--with-gdalconfig=$toolhome/gdal/bin/gdal-config \
--with-topology \
--without-address-standardizer \
CFLAGS="-fPIC -O2 -fpermissive -DPGXC -pthread -D_THREAD_SAFE -D__STDC_FORMAT_MACROS -DMEMORY_CONTEXT_CHECKING -w -I$CODE_BASE/contrib/postgis/ -I$BINARYLIBS/dependency/____/cjson/comm/include/ -I$BINARYLIBS/dependency/____/openssl/comm/include/ -I$BINARYLIBS/dependency/____/kerberos/comm/include/ -I$BINARYLIBS/dependency/____/libobs/comm/include/" CPPFLAGS="-I$CODE_BASE/contrib/postgis/ -I$BINARYLIBS/dependency/____/cjson/comm/include -I$BINARYLIBS/dependency/____/libobs/comm/include/ -fpermissive -w -DMEMORY_CONTEXT_CHECKING -D__STDC_FORMAT_MACROS" CC=g++ -q

make && make install
```

## 拷贝动态库文件及扩展文件到 openGauss 相应位置<a name="section134085264819"></a>

```
cp $toolhome/json/lib/libjson-c.so.2 $GAUSSHOME/lib/libjson-c.so.2
cp $toolhome/geos/lib/libgeos_c.so.1 $GAUSSHOME/lib/libgeos_c.so.1
cp $toolhome/proj/lib/libproj.so.9 $GAUSSHOME/lib/libproj.so.9
cp $toolhome/geos/lib/libgeos-3.6.2.so $GAUSSHOME/lib/libgeos-3.6.2.so
cp $toolhome/pggis2.4.2/lib/liblwgeom-2.4.so.0 $GAUSSHOME/lib/liblwgeom-2.4.so.0
cp $PGGIS_DIR/postgis-xc/postgis-2.4.2/postgis.control $GAUSSHOME/share/postgresql/extension/
cp $PGGIS_DIR/postgis-xc/postgis-2.4.2/postgis--2.4.2.sql $GAUSSHOME/share/postgresql/extension/
```

## gsql 连接创建扩展并测试<a name="section0670123265119"></a>

```
create extension postgis;
create extension postgis_topology;
create extension fuzzystrmatch;
create extension postgis_tiger_geocoder;

SELECT na.address,na.streetname,na.streettypeabbrev,na.zip FROM normalize_address('1 Devonshire Place,Boston, MA 02109') as na;
```
