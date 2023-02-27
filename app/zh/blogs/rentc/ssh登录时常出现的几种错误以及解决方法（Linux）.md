---
title: 'ssh 登录时常出现的几种错误以及解决方法（Linux）'

date: '2022-09-01'

category: 'blog'
tags: ['ssh 登录时常出现的几种错误以及解决方法（Linux）']

archives: '2022-09'

author: '海量数据'

summary: 'ssh 登录时常出现的几种错误以及解决方法（Linux）'

img: '/zh/blogs/Rentc/title/title.jpg'

times: '09:50'
---

ssh 是 Linux 系统中常用的远程登陆的命令，我们在安装和使用数据库经常通过 mobaxterm 等远程连接软件使用 ssh 去登陆远程的服务器的时候，会遇到一些问题。下面是关于 ssh 远程登陆的问题解决方法的总结。

## 1.SSH 连接时出现 Connection refused,如下：报错如下：

`ssh: connect to host 123.123.123.111 port 22: Connection refused` 通常是由于 22 端口未打开、ssh 服务未启动或防火墙禁止 22 端口等原因引起的

解决方法：

1. 进入该服务器（本地登陆）
2. 查看 ssh 服务是否启动 systemctl status sshd 如未启动 systemctl start sshd
3. 查看端口是否打开 netstat -lnput |grep :22 如未打开,再次启动 sshd
4. 测试网络的联通性 `ping www.baidu.com` (ping 外网)如果 ping 不通，就检查 dns 如果 dns 无问题，就说明是网络原因，看服务器的网线是否连接或是否有问题
5. 如果能连接外网，就查看服务器的防火墙规则,并开放 ssh 服务的 22 号端口（如防火墙未放行 ssh 的端口）iptables -L[1]直接打开端口：`iptables -I INPUT -p tcp --dport 22 -j ACCEPT`
   [2]永久打开端口打开防火墙配置文件：`vim /etc/sysconfig/iptables` 在 iptables 文件内容中追加
   `-A RH-Firewall-1-INPUT -m state --state NEW -m tcp -p tcp --dport 22 -j ACCEPT `保存配置文件后，重启防火墙:`service iptables restart（centos6）systemctl restart iptables(centos7)`

## 2.SSH 连接时密码正确，登陆失败，出现 Permission denied, please try again

报错如下：
`Password authentication failed` 或 `Permission denied, please try again `通常是由于`/etc/ssh/sshd_config` 的 PasswordAuthentication 或 PermitRootLogin 参数的配置引起的解决方法：

### 【1】修改相关配置文件

1. 查看本服务器和电脑的防火墙设置，是否打开 ssh 服务，22 端口（一般都是打开的）如果服务不是打开的要将服务启动，防火墙开放 22 端口（配置规则看本文目录第 1 条中）
2. 编辑 sshd_config 文件 `vim /etc/ssh/sshd_config` 将 PasswordAuthentication 前面的#号去掉将 PasswordAuthentication 设为 yes
3. 重启 sshd 服务`/etc/init.d/sshd restart (centos6)systemctl restart sshd(centos7)`

### 【2】修改相关配置文件

1. 基本上与上一个方法相同，但编辑 sshd_config 文件的另一个参数 vim /etc/ssh/sshd_config 将 PermitRootLogin 前面的#号去掉将 PermitRootLogin 设为 yes
2. 重启 sshd 服务`/etc/init.d/sshd restart (centos6)systemctl restart sshd(centos7)`

## 3.SSH 连接时密码正确，登陆失败，出现 Permission denied, please try again

报错如下：`Host key verification failed` 通常是由于访问使用的公钥与服务器记录的差异引起的 ssh 服务会把每个曾经访问过计算机或服务器的公钥（public key），记录在`~/.ssh/known_hosts` 当下次访问曾经访问过的计算机或服务器时，ssh 就会核对公钥，如果和上次记录的不同，OpenSSH 会发出警告。而 ssh 对主机的 public_key 的检查是有等级的，根据等级执行不同的策略。（StrictHostKeyChecking 就是配置等级的参数）

- 1.`StrictHostKeyChecking=no` 最不安全的级别，提示最少，应在相对安全的内网测试时使用。（当连接的服务器的公钥在本地不存在，就会自动添加到文件（默认是 known_hosts）中，并且给出警告。
- 2.`StrictHostKeyChecking=ask` 默认的级别。如果连接的服务器的公钥和本地的 known_hosts 文件中不匹配，就给出提示（Host key verification failed），并拒绝登录。
- 3.`StrictHostKeyChecking=yes` 最安全的级别，如果连接的服务器的公钥和本地的 known_hosts 文件中的不匹配，就拒绝连接，不会提示详细信息。解决方法 :可更改安全选择最低的安全级别。在`.ssh/config` 或`/etc/ssh/ssh_config`）中配置：
  ```
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
  ```
  参考文章链接：[https://blog.csdn.net/GX_1_11_real/article/details/80423409](https://blog.csdn.net/GX_1_11_real/article/details/80423409)5
