---
title: 'openGauss2.1.0在openEuler 20.03 LTS SP2 安装后，yum无法使用的问题解决'

date: '2021-12-10'

category: 'blog'
tags: ['openGauss2.1.0在openEuler 20.03 LTS SP2 安装后，yum无法使用的问题解决']

archives: '2021-12'

author: '姜殿斌'

summary: 'openGauss2.1.0在openEuler 20.03 LTS SP2 安装后，yum无法使用的问题解决'

img: '/zh/blogs/July/title/img5.png'

times: '12:30'
---

# openGauss2.1.0 在 openEuler 20.03 LTS SP2 安装后，yum 无法使用的问题解决<a name="ZH-CN_TOPIC_0000001186895098"></a>

## 一、环境描述<a name="section183915141583"></a>

操作系统：

openEuler 20.03 LTS

openEuler 20.03 LTS SP2

数据库：

openGauss2.1.0

软件包：

openGauss-2.1.0-openEuler-64bit-all.tar.gz

## 二、安装过程<a name="section19262162417587"></a>

安装过程自动创建初始用户 omm。

## 三、问题<a name="section960382995817"></a>

数据库安装使用正常，但是使用 yum，会报错：

```
[root@node1 ~]# yum list
Traceback (most recent call last):
  File "/usr/lib64/python3.7/site-packages/libdnf/common_types.py", line 14, in swig_import_helper
    return importlib.import_module(mname)
  File "/usr/lib64/python3.7/importlib/__init__.py", line 127, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
  File "<frozen importlib._bootstrap>", line 1006, in _gcd_import
  File "<frozen importlib._bootstrap>", line 983, in _find_and_load
  File "<frozen importlib._bootstrap>", line 967, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 670, in _load_unlocked
  File "<frozen importlib._bootstrap>", line 583, in module_from_spec
  File "<frozen importlib._bootstrap_external>", line 1043, in create_module
  File "<frozen importlib._bootstrap>", line 219, in _call_with_frames_removed
ImportError: /lib64/libcurl.so.4: symbol SSLv3_client_method version OPENSSL_1_1_0 not defined in file libssl.so.1.1 with link time reference

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/usr/bin/yum", line 57, in <module>
    from dnf.cli import main
  File "/usr/lib/python3.7/site-packages/dnf/__init__.py", line 30, in <module>
    import dnf.base
  File "/usr/lib/python3.7/site-packages/dnf/base.py", line 29, in <module>
    import libdnf.transaction
  File "/usr/lib64/python3.7/site-packages/libdnf/__init__.py", line 3, in <module>
    from . import common_types
  File "/usr/lib64/python3.7/site-packages/libdnf/common_types.py", line 17, in <module>
    _common_types = swig_import_helper()
  File "/usr/lib64/python3.7/site-packages/libdnf/common_types.py", line 16, in swig_import_helper
    return importlib.import_module('_common_types')
  File "/usr/lib64/python3.7/importlib/__init__.py", line 127, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
ModuleNotFoundError: No module named '_common_types'
[root@node1 ~]#
```

## 四、问题分析<a name="section22127536585"></a>

```
[root@node1 lib64]# ldd /lib64/libcurl.so.4
  linux-vdso.so.1 (0x00007fff98577000)
  libnghttp2.so.14 (0x00007f06c3221000)
  libidn2.so.0 (0x00007f06c3201000)
  libssh.so.4 (0x00007f06c3180000)
  libpsl.so.5 (0x00007f06c316d000)
  libssl.so.1.1 => /opt/software/openGauss/script/gspylib/clib/libssl.so.1.1 (0x00007f06c30db000)
  libcrypto.so.1.1 => /opt/software/openGauss/script/gspylib/clib/libcrypto.so.1.1 (0x00007f06c2e14000)
  libgssapi_krb5.so.2 (0x00007f06c2dc4000)
  libkrb5.so.3 (0x00007f06c2ce4000)
  libk5crypto.so.3 (0x00007f06c2cc9000)
  libcom_err.so.2 (0x00007f06c2cc3000)
  libldap-2.4.so.2 (0x00007f06c2c76000)
  liblber-2.4.so.2 (0x00007f06c2c63000)
  libbrotlidec.so.1 (0x00007f06c2c54000)
  libz.so.1 (0x00007f06c2c3a000)
  libpthread.so.0 (0x00007f06c2c19000)
  libc.so.6 (0x00007f06c2a58000)
  libunistring.so.2 (0x00007f06c28d4000)
  librt.so.1 (0x00007f06c28c7000)
  /lib64/ld-linux-x86-64.so.2 (0x00007f06c32d9000)
  libdl.so.2 (0x00007f06c28c2000)
  libkrb5support.so.0 (0x00007f06c28b2000)
  libkeyutils.so.1 (0x00007f06c28ac000)
  libresolv.so.2 (0x00007f06c2894000)
  libsasl2.so.3 (0x00007f06c2873000)
  libm.so.6 (0x00007f06c26f0000)
  libbrotlicommon.so.1 (0x00007f06c26cd000)
  libselinux.so.1 (0x00007f06c26a1000)
  libcrypt.so.1 (0x00007f06c2666000)
  libpcre2-8.so.0 (0x00007f06c25d4000)
[root@node1 lib64]# nm  /opt/software/openGauss/script/gspylib/clib/libssl.so.1.1| grep SSLv3_client_method
```

确实没有 SSLv3_client_method

## 五、解决<a name="section88923214593"></a>

1 、下载 openssl-1.1.1l，编译：

编译 openssl 增加 enable-ssl3 与 enable-ssl3-method 选项

```
#
tar -zxvf openssl-1.1.1l.tar.gz
 cd openssl-1.1.1l
./config shared enable-ssl3 enable-ssl3-method
make
make install
```

检查新编译的文件是否包含 SSLv3_client_method：

```
[root@node1 lib64]# nm /usr/local/lib64/libssl.so.1.1 | grep SSLv3_client_method
00000000000214f0 T SSLv3_client_method
```

编译完成后是有 SSLv3_client_method

编译好的库拷贝替换原来的 libssl.so.1.1：

```
[root@node1 lib64]# cp /usr/local/lib64/libssl.so.1.1 /opt/software/openGauss/script/gspylib/clib/
cp: overwrite '/opt/software/openGauss/script/gspylib/clib/libssl.so.1.1'? y
[root@node1 lib64]#
```

检查：

```
[root@node1 lib64]# nm  /opt/software/openGauss/script/gspylib/clib/libssl.so.1.1| grep SSLv3_client_method
00000000000214f0 T SSLv3_client_method
```

至此，该文件正常。

```
yum测试：
[root@node1 lib64]# yum install -y tree
Last metadata expiration check: 0:29:30 ago on Tue 23 Nov 2021 11:15:02 AM CST.
Package tree-1.7.0-18.oe1.x86_64 is already installed.
Dependencies resolved.
Nothing to do.
Complete!
```

修复完成，yum 正常使用

## 六、深入问题<a name="section2022912114014"></a>

```
[root@node1 lib64]# ldd /lib64/libcurl.so.4
  linux-vdso.so.1 (0x00007fff98577000)
  libnghttp2.so.14 (0x00007f06c3221000)
  libidn2.so.0 (0x00007f06c3201000)
  libssh.so.4 (0x00007f06c3180000)
  libpsl.so.5 (0x00007f06c316d000)
  **libssl.so.1.1 => /opt/software/openGauss/script/gspylib/clib/libssl.so.1.1 (0x00007f06c30db000)**
```

操作系统默认 libssl.so.1.1 链接到/lib64 目录中，但是安装数据库后

发现 libssl.so.1.1 链接到/opt/software/openGauss/script/gspylib/clib/libssl.so.1.1 ，

怀疑安装脚本有问题。

这里参考曾庆峰老师的解决方案：

“先创建 omm 用户 dbgrp 组，预安装时就不再创建 omm”，安装后，yum 可以使用。

## 七、最简单方法<a name="section1749511379011"></a>

按照官方文档正常安装，yum 报错，只需要：

```
vim /etc/profile
#export LD_LIBRARY_PATH=/opt/software/openGauss/script/gspylib/clib:
#export PATH=/root/gauss_om/omm/script:$PATH
```

重启即可。

原因：

估计是安装脚本有问题。
