+++

title = "PHP unixODBC Apache openGauss实现数据库的连接" 

date = "2021-01-12" 

tags = ["openGauss ODBC连接"] 

archives = "2021-01" 

author = "手机用户8927" 

summary = "PHP unixODBC Apache openGauss实现数据库的连接"

img = "/zh/post/user8927/title/img22.png" 

times = "15:30"

+++

# PHP unixODBC Apache openGauss实现数据库的连接<a name="ZH-CN_TOPIC_0000001072602343"></a>

环境：openEuler20.03 LTS

数据库：openGauss1.0.1

PHP：5.6.30

unixODBC：2.3.0Apache:2.4.3

## 安装unixODBC<a name="section182315341545"></a>

具体请参考官方文档[基于ODBC开发](https://opengauss.org/zh/docs/1.0.1/docs/Developerguide/%E5%9F%BA%E4%BA%8EODBC%E5%BC%80%E5%8F%91.html)

注意，这里请将unixODBC的lib文件权限修改为755，否则可能无法在浏览器上通过PHP访问openGauss。特别是“psqlodbcw.la”和“psqlodbcw.so”文件。

如果openGauss和unixODBC在同一台设备时需在数据库主节点配置文件中增加一条认证规则。

不再同一台设备时需配置SSL，也可以关闭SSL设置，具体请参考[Data studio普通用户采用非SSL的方式连接openGauss](https://www.modb.pro/db/43087)。增加的认证规则是

```
host all all x.x.x.x/x sha256  
```

如果测试时报错\[UnixODBC\]connect to server failed: no such file or directory，也有可能是未增加认证规则或错误增加认证规则导致的。

## Apache安装<a name="section84107493543"></a>

这里是使用EulerOS的yum源直接安装Apache和Apache-devel，Apache-devel是必须安装的，不然无法使用PHP。

EulerOSyum源配置（在/etc/yum.repos.d/openEuler.repo上）

```
[eulerosrepo]
name=EulerOS-2.0SP8 base
baseurl=http://mirrors.huaweicloud.com/euler/2.8/os/aarch64/
enabled=1
gpgcheck=1
gpgkey=http://mirrors.huaweicloud.com/euler/2.8/os/RPM-GPG-KEY-EulerOS
```

## PHP安装<a name="section1137515125513"></a>

首先，找到apxs文件夹所在路径，这个文件夹的路径在接下来的配置中会用到。

```
find / -name apxs 
```

其次，在PHP安装包解压路径下，进行./configure配置，配置语句如下：

```
./configure --host=arm-linux --prefix=/usr/local/php --with-apxs2=[刚才的路径] --with-config-file-path=/usr/local/php/etc --with-unixODBC=[unixODBC路径] --enable-fpm --with-libxml-dir --with-gd --with-jpeg-dir --with-png-dir --with-freetype-dir --with-iconv-dir --with-zlib-dir --with-bz2 --with-readline --enable-soap --enable-gd-native-ttf --enable-mbstring --enable-sockets --enable-exif 
```

这里配置时，缺哪个文件安装哪个文件。

完成截图如下：

![](../figures/11.png)

配置时可能会报错config.guess和config.sub错误,修改unixODBC的这两个文件时间戳同openEuler的时间一样即可。

随后进行make和make install。完成截图如下：

![](../figures/22.png)

复制php.ini到PHP安装路径下。

```
cp php.ini-production /usr/local/php/etc/php.ini 
```

修改Apache配置文件，在对应的位置添加以下内容。

```
AddType application/x-httpd-php .php AddType application/x-httpd-php-source .phps 
```

重启Apache，PHP安装完成。

## PHP-FPM安装<a name="section122804182552"></a>

找到php安装文件。

```
find / -name php 
```

到php目录下etc文件内。

将php-fpm.conf.default复制为php-fpm.conf文件

```
cp php-fpm.conf.default php-fpm.conf 
```

到php目录下sbin文件。

运行php-fpm。

```
./php-fpm 
```

修改Apache配置文件，在其中增加以下语句。

```
LoadModule proxy_module modules/mod_proxy.so LoadModule proxy_fcgi_module modules/mod_proxy_fcgi.so  ProxyRequests Off ProxyPassMatch "^/(.*\.php(/.*)?)$" "fcgi://127.0.0.1:9000/[php文件的路径]/$1" 
```

调用phpinfo\(\)显示如下：

![](../figures/33.png)

PHP-FPM安装完成。

## 配置PHP-FPM内unixODBC环境变量<a name="section6339193745510"></a>

找到php-fpm.conf文件

```
find / -name php-fpm.conf 
```

打开php-fpm.conf文件，找到存在大量env的文件段落，在其中加入unixODBC的环境变量（根据自己的配置路径来填写）

其中env表示配置fpm内的环境变量，\[\]内填写环境变量名，=后填写系统环境变量名（在系统环境变量名前加$）或填写路径，例如下图：

![](../figures/44.png)

之后，重启PHP-FPM，即可使用浏览器通过PHP访问openGauss数据库。

