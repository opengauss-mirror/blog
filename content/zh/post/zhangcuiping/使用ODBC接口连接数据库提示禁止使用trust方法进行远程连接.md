+++

title = "使用ODBC接口连接数据库提示禁止使用trust方法进行远程连接" 

date = "2023-07-30" 

tags = ["openGauss安装"] 

archives = "2023-07" 

author = "张翠娉" 

summary = "使用ODBC接口连接数据库提示禁止使用trust方法进行远程连接"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "14:20"

+++

# 使用ODBC接口连接数据库提示禁止使用trust方法进行远程连接？

**背景介绍**：

使用ODBC接口连接数据库时，提示禁止使用trust方法进行远程连接。

**报错内容**：

```bash
[root@mogdv-kernel-001 data]# isql -v MogDB
[08001][unixODBC]FATAL:  Forbid remote connection with trust method!

[ISQL]ERROR: Could not SQLConnect
```

**解决办法**：

修改数据库安装环境/data/目录中的配置文件pg_hba.conf，将远程请求连接的客户端机器ip的认证方式由trust改为sha256的认证方式即可。

**更多**

1、MD5和sha256的区别是什么？

- 相同点：
  - 都是密码散列函数，加密不可逆；
  - 都可以实现对任何长度对象加密，都不能防止碰撞；

- 不同点：
  - 校验值的长度不同，MD5校验位的长度是16个字节（128位）；SHA256是32个字节（256位）
  - 运行速度不同，SHA256的运行速度比MD5慢。

2、MD5、SHA256安全性如何？

在安全性方面，SHA256的安全性高于MD5。虽然SHA256的安全性比较高，但是特别耗时。

3、md5、SHA256不能解密吗？

SHA256是目前比较流行的计算机算法之一，相对md5而言，SHA256很安全。SHA256是牢不可破的函数，它的256位密钥从未被泄露过。而MD5就不一样了，单纯使用比较容易遭到撞库攻击。通过预先计算知道MD5的对应关系，存在数据库中，然后使用的时候反查，MD5就可能被解密。