+++

title = "查询数据库状态时提示root用户没有sudo权限怎么办" 

date = "2023-07-07" 

tags = ["openGauss安装"] 

archives = "2023-07" 

author = "张翠娉" 

summary = "查询数据库状态时提示root用户没有sudo权限怎么办"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "14:20"

+++

# 查询数据库状态时提示root用户没有sudo权限怎么办？

**背景介绍**：

PTK (Provisioning Toolkit)是一款针对 MogDB 数据库开发的软件安装和运维工具，旨在帮助用户更便捷地安装部署MogDB数据库。

在使用PTK查询数据库集群状态时，提示root用户没有sudo权限。

**报错信息**：

```
[root@kylinos ~]# ptk cluster -n mogdb3 status
ERRO[2023-07-07T10:02:30.990] omm3@172.23.2.98: [PTK-50305] the user 'root@172.23.2.98' dose not have sudo privilege
failed to init following instance(s):
omm3@172.23.2.98: [PTK-50305] the user 'root@172.23.2.98' dose not have sudo privilege
```

**报错原因**：

root用户的sudo权限被错误的修改了。

**解决办法**：

在root用户下执行如下命令赋予root用户sudo权限。

```
chown -R root /etc
```

**解决思路**：

可以执行`sudo yum install vim`。通过报错信息可知/etc目录下的sudo配置文件目前属于uid为1019的用户。

**说明**：在root用户下执行`id root`查看，得知root用户的uid为0；执行`id omm2`得知omm2用户的uid为1019。即目前sudo配置文件权限属于omm2用户，而非root用户，所以才报错提示root用户没有sudo权限。因此，重新赋予root用户/etc目录权限后root用户就可以有sudo权限了。

```
[omm3@kylinos ~]$ sudo yum install vim
sudo: /etc/sudo.conf is owned by uid 1019, should be 0
sudo: /etc/sudo.conf is owned by uid 1019, should be 0
sudo: /etc/sudoers 属于用户 ID 1019，应为 0
sudo: 没有找到有效的 sudoers 资源，退出
sudo: 初始化审计插件 sudoers_audit 出错
```