+++

title = "使用yum安装unixODBC时报错怎么办" 

date = "2023-03-23" 

tags = ["使用yum安装unixODBC时报错怎么办"] 

archives = "2023-03" 

author = "张翠娉" 

summary = "使用yum安装unixODBC时报错怎么办"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "10:20"

+++

# 使用yum安装unixODBC时报错怎么办



## 背景介绍

在使用yum安装unixODBC时，上报如下错误：

```bash
[root@mc0-0002 odbc_connection]# yum install -y unixODBC
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
ImportError: /lib64/libcurl.so.4: symbol SSLv3_client_method version OPENSSL_1_1_0 not defined in

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
```

## 问题分析

```bash
[root@mc0-0002 openssl-1.1.1a]# ldd /lib64/libcurl.so.4
        linux-vdso.so.1 (0x0000fffde7080000)
        libnghttp2.so.14 => /lib64/libnghttp2.so.14 (0x0000fffde6f70000)
        libidn2.so.0 => /lib64/libidn2.so.0 (0x0000fffde6f30000)
        libssh.so.4 => /lib64/libssh.so.4 (0x0000fffde6e90000)
        libpsl.so.5 => /lib64/libpsl.so.5 (0x0000fffde6e60000)
        libssl.so.1.1 => /usr/local/lib/libssl.so.1.1 (0x0000fffde6db0000)
        libcrypto.so.1.1 => /usr/local/lib/libcrypto.so.1.1 (0x0000fffde6b00000)
        libgssapi_krb5.so.2 => /lib64/libgssapi_krb5.so.2 (0x0000fffde6a90000)
        libkrb5.so.3 => /lib64/libkrb5.so.3 (0x0000fffde6990000)
        libk5crypto.so.3 => /lib64/libk5crypto.so.3 (0x0000fffde6950000)
        libcom_err.so.2 => /lib64/libcom_err.so.2 (0x0000fffde6920000)
        libldap-2.4.so.2 => /lib64/libldap-2.4.so.2 (0x0000fffde68b0000)
        liblber-2.4.so.2 => /lib64/liblber-2.4.so.2 (0x0000fffde6880000)
        libbrotlidec.so.1 => /lib64/libbrotlidec.so.1 (0x0000fffde6850000)
        libz.so.1 => /lib64/libz.so.1 (0x0000fffde6810000)
        libpthread.so.0 => /lib64/libpthread.so.0 (0x0000fffde67d0000)
        libc.so.6 => /lib64/libc.so.6 (0x0000fffde6640000)
        /lib/ld-linux-aarch64.so.1 (0x0000fffde7090000)
        libunistring.so.2 => /lib64/libunistring.so.2 (0x0000fffde64a0000)
        librt.so.1 => /lib64/librt.so.1 (0x0000fffde6470000)
        libdl.so.2 => /lib64/libdl.so.2 (0x0000fffde6440000)
        libkrb5support.so.0 => /lib64/libkrb5support.so.0 (0x0000fffde6410000)
        libkeyutils.so.1 => /lib64/libkeyutils.so.1 (0x0000fffde63e0000)
        libresolv.so.2 => /lib64/libresolv.so.2 (0x0000fffde63a0000)
        libsasl2.so.3 => /lib64/libsasl2.so.3 (0x0000fffde6360000)
        libm.so.6 => /lib64/libm.so.6 (0x0000fffde6290000)
        libbrotlicommon.so.1 => /lib64/libbrotlicommon.so.1 (0x0000fffde6250000)
        libselinux.so.1 => /lib64/libselinux.so.1 (0x0000fffde6200000)
        libcrypt.so.1 => /lib64/libcrypt.so.1 (0x0000fffde61a0000)
        libsecurity.so.0 => /lib64/libsecurity.so.0 (0x0000fffde6170000)
        libpcre2-8.so.0 => /lib64/libpcre2-8.so.0 (0x0000fffde60d0000)

[root@mc0-0002 openssl-1.1.1a]# nm libssl.so.1.1 | grep SSLv3_client_method

确实没有SSLv3_client_method
```

## 解决办法

1. 下载openssl-1.1.1a进行编译。

   ```bash
   [root@mc0-0002 etc]# wget https://www.openssl.org/source/openssl-1.1.1a.tar.gz
   
   tar -zxvf openssl-1.1.1a.tar.gz
   
   cd openssl-1.1.1a/
   
   ./config --prefix=/usr/local/openssl shared enable-ssl3 enable-sslib
   
   make install
   ```

2. 检查新编译的文件是否包含SSLv3_client_method。

   ```bash
   [root@mc0-0002 openssl-1.1.1a]# nm libssl.so.1.1 | grep SSLv3_client_method
   0000000000020800 T SSLv3_client_method
   编译完成后是有SSLv3_client_method
   ```

3. 使用编译好的libssl.so.1.1替换原来的libssl.so.1.1。

   ```bash
   [root@mc0-0002 openssl-1.1.1a]# cp  /etc/openssl-1.1.1a/libssl.so.1.1  /usr/local/lib/
   cp: overwrite '/usr/local/lib/libssl.so.1.1'? y
   ```

   至此，位于原/usr/local/lib/目录下的/usr/local/lib/libssl.so.1.1 文件正常，可使用yum安装unixODBC了

4. 使用yum安装unixODBC。

   ```bash
   [root@mc0-0002 odbc_connection]# yum install unixODBC
   Last metadata expiration check: 0:12:31 ago on Thu 23 Mar 2023 05:33:19 PM CST.
   Dependencies resolved.
   ==================================================================================================
    Package              Architecture        Version                   Repository               Size
   ==================================================================================================
   Installing:
    unixODBC             aarch64             2.3.7-2.ky10              ks10-adv-os             389 k
   
   Transaction Summary
   ==================================================================================================
   Install  1 Package
   
   Total download size: 389 k
   Installed size: 2.4 M
   Is this ok [y/N]: y
   Downloading Packages:
   unixODBC-2.3.7-2.ky10.aarch64.rpm                                 4.8 MB/s | 389 kB     00:00
   --------------------------------------------------------------------------------------------------
   Total                                                             4.7 MB/s | 389 kB     00:00
   Running transaction check
   Transaction check succeeded.
   Running transaction test
   Transaction test succeeded.
   Running transaction
     Preparing        :                                                                          1/1
     Installing       : unixODBC-2.3.7-2.ky10.aarch64                                            1/1
     Running scriptlet: unixODBC-2.3.7-2.ky10.aarch64                                            1/1
   /sbin/ldconfig: /usr/local/lib/libkrb5support_gauss.so.0 is not a symbolic link
   
   /sbin/ldconfig: /usr/local/lib/libcom_err_gauss.so.3 is not a symbolic link
   
   /sbin/ldconfig: /usr/local/lib/libpq_ce.so.5 is not a symbolic link
   
   /sbin/ldconfig: /usr/local/lib/libk5crypto_gauss.so.3 is not a symbolic link
   
   /sbin/ldconfig: /usr/local/lib/libodbcinst.so.2 is not a symbolic link
   
   /sbin/ldconfig: /usr/local/lib/libpq.so.5 is not a symbolic link
   
   /sbin/ldconfig: /usr/local/lib/libgssapi_krb5_gauss.so.2 is not a symbolic link
   
   /sbin/ldconfig: /usr/local/lib/libkrb5_gauss.so.3 is not a symbolic link
   
   /sbin/ldconfig: /usr/local/lib/libgssrpc_gauss.so.4 is not a symbolic link
   
   
   /sbin/ldconfig: /usr/local/lib/libkrb5support_gauss.so.0 is not a symbolic link
   
   /sbin/ldconfig: /usr/local/lib/libcom_err_gauss.so.3 is not a symbolic link
   
   /sbin/ldconfig: /usr/local/lib/libpq_ce.so.5 is not a symbolic link
   
   /sbin/ldconfig: /usr/local/lib/libk5crypto_gauss.so.3 is not a symbolic link
   
   /sbin/ldconfig: /usr/local/lib/libodbcinst.so.2 is not a symbolic link
   
   /sbin/ldconfig: /usr/local/lib/libpq.so.5 is not a symbolic link
   
   /sbin/ldconfig: /usr/local/lib/libgssapi_krb5_gauss.so.2 is not a symbolic link
   
   /sbin/ldconfig: /usr/local/lib/libkrb5_gauss.so.3 is not a symbolic link
   
   /sbin/ldconfig: /usr/local/lib/libgssrpc_gauss.so.4 is not a symbolic link
   
   
     Verifying        : unixODBC-2.3.7-2.ky10.aarch64                                            1/1
   
   Installed:
     unixODBC-2.3.7-2.ky10.aarch64
   
   Complete!
   [root@mc0-0002 odbc_connection]#
   
   ```

