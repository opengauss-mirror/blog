+++

title = "新手安装PTK工具遇到relocation error怎么办？" 

date = "2022-07-08" 

tags = ["新手安装PTK工具遇到relocation error怎么办？"] 

archives = "2022-07" 

author = "张翠娉" 

summary = "新手安装PTK工具遇到relocation error怎么办？"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "16:50"
+++

# 新手安装PTK工具遇到relocation error怎么办？



**背景介绍**：

PTK (Provisioning Toolkit)是一款针对 MogDB 数据库开发的软件安装和运维工具，旨在帮助用户更便捷地安装部署MogDB数据库。

如果用户想要运行 MogDB 或者 MogDB 的相关组件时，仅需要执行一行命令即可实现。

PTK 支持安装 MogDB 的操作系统众多，达到22个，后期还会不断增多。

本次再安装PTK时遇到如下报错。

报错内容：

```
[root@hostname~]# curl --proto '=https' --tlsv1.2 -sSf https://cdn-mogdb.enmotech.com/ptk/install.sh | sh
curl: relocation error: /lib64/libcurl.so.4: symbol SSLv3_client_method version OPENSSL_1_1_0 not defined in file libssl.so.1.1 with link time reference
```

**报错原因**：

机器上原始mogdb环境变量对此有影响

**解决办法**：

执行unset LD_LIBRARY_PATH重置环境变量，重新执行安装命令。