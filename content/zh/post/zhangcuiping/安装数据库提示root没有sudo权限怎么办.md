+++

title = "安装数据库提示root没有sudo权限怎么办？" 

date = "2023-09-20" 

tags = ["安装数据库提示root没有sudo权限怎么办？"] 

archives = "2023-09" 

author = "张翠娉" 

summary = "安装数据库提示root没有sudo权限怎么办？"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "16:50"
+++

# 安装数据库提示root没有sudo权限怎么办？



**背景介绍**：

PTK (Provisioning Toolkit)是一款针对 MogDB 数据库开发的软件安装和运维工具，旨在帮助用户更便捷地安装部署MogDB数据库。

如果用户想要运行 MogDB 或者 MogDB 的相关组件时，仅需要执行一行命令即可实现。

PTK 支持安装 MogDB 的操作系统众多，后期还会不断增多。

本次在安装数据库时遇到如下报错。

报错内容：

```bash
[root@mogdv-kernel-001 mogdb5test]# ptk checkos -f config.yaml
ERRO[2023-09-20T10:49:06.685] omm5@172.23.1.181: [PTK-50305] the user 'root@172.23.1.181' dose not have sudo privilege
failed to init following instance(s):
omm5@172.23.1.181: [PTK-50305] the user 'root@172.23.1.181' dose not have sudo privilege
```

**解决办法**：

1. 打开/etc/sudoers文件，增加如下内容：

   ```
   root  ALL=(ALL)  ALL
   sysadm  ALL=(ALL)  ALL
   ```

2. 检验权限是否添加成功，执行如下命令：

   ```
   [root@mogdv-kernel-001 mogdb5test]# service network restart
   
   Restarting network (via systemctl):  [  OK  ]
   ```

