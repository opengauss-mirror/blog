---
title: 'openGauss容灾集群建立好了后修改密码'
date: '2024-11-16'
category: 'blog'
tags: ['openGauss容灾集群建立好了后修改密码']
archives: '2024-11-16'
author: 'zhangxb'
summary: 'openGauss容灾集群建立好了后修改密码'
img: '/zh/blogs/zhangxb/title/img.png'
times: '18:40'
---

# openGauss容灾集群建立好了后修改密码

## 前提

资料里面介绍灾备建立好了后不可以修改密码，如果要修改密码需要重新搭建灾备关系。 主要是在于该操作风险比较高，漏改等会导致灾备无法建联。

![image-20241116172253115](.//images/image-20241116172253115.png)

## 1. 搭建灾备集群

```
gsql -d postgres -p 2400 -c "create user sdru1 with replication password '******';"

 gs_sdr -t start -m primary -X /opt/sdrmain.xml --time-out=7200 -U 'sdru1' -W '******'
```

![image-20241116160530106](.//images/image-20241116160530106.png)

## 2. 直接修改密码（重启灾备后会导致无法建联）

![image-20241116164149089](.//images/image-20241116164149089.png)

修改密码完成后，删掉灾备节点数据库进程（模拟重启操作）

![image-20241116164406357](.//images/image-20241116164406357.png)

灾备无法拉起来，数据库日志报错walreceiver连接密码错误，尝试10次失败后sdr用户被锁定。 集群状态无法恢复。

![image-20241116164559596](.//images/image-20241116164559596.png)

![image-20241116164525914](.//images/image-20241116164525914.png)

![image-20241116164540158](.//images/image-20241116164540158.png)

## 3. 说明

om工具在搭建灾备涉及加密的如下几步：

1. 生成hadr加密需要的前缀（hadr.key.cipher 和 hadr.key.rand），放在 $GAUSSHOME/bin下（该操作不涉及用户密码）

   ```
   gs_guc generate -S default -o hadr -D /data2/zzzog/openGauss/app/bin/
   ```

   

2. 对用户和密码明文加密（需要借助上一步生产的hadr.key.*，会从 bin目录下查找）

   ```
   gs_encrypt -f 'hadr' "sdru1|test@123456"
   ```

   

3. 将加密的密文设置保存到CONFIGURATION系统表里面，walreceiver从这里获取进行连接认证

   ```
   select value from gs_global_config where name='hadr_user_info';
   ALTER GLOBAL CONFIGURATION with(hadr_user_info ='kPuk8ITNo1JKS3xrs/VgQhJim4sGVkGkj8hxxNBvtibC6Du26xdRe8N5WuYPITAGdeYxAgTnsAlAOjhsouB7/Q==');
   ```

   ![image-20241116173744831](.//images/image-20241116173744831.png)

## 4. 修改密码步骤

基于上面的说明，修改密码需要两步：

1. 在主节点修改sdr用户密码

   ```
   alter user sdru1 password '******';
   ```

2. 生成密码的密文，保存在系统表里面

```
gs_encrypt -f 'hadr' "sdru1|******"
ALTER GLOBAL CONFIGURATION with(hadr_user_info ='kPuk8ITNo1JKS3xrs/VgQhJim4sGVkGkj8hxxNBvtibC6Du26xdRe8N5WuYPITAGdeYxAgTnsAlAOjhsouB7/Q==');
```

**注意**

1. 修改密码时候必须保证当前主集群和灾备连接正常，保证主机修改后灾备可以同步修改。 如果灾备连接有问题，会导致两者不一致，后面就无法建立连接，只能重新搭建
2. 生成密码需要的前缀文件（hadr.key.cipher 和 hadr.key.rand），修改密码时候可以不需要重新生成。在密码生成密文后就不能再去改该文件，否则会导致密文解析失败，也会影响链接。

## 5. 修改密码后验证

1. 灾备重启可以正常连接

![image-20241116171607162](.//images/image-20241116171607162.png)

![image-20241116171615741](.//images/image-20241116171615741.png)

2. 灾备切换正常

![image-20241116171919192](.//images/image-20241116171919192.png)