+++
title = "openGauss支持国密SM3和SM4算法"
date = "2021-09-26"
tags = ["国密算法"]
archives = "2021-09"
author = "douxin"
summary = "openGauss社区开发入门"
img="/zh/post/douxin/title/img1.png"
times = "17:30"

+++

## 1. 国密算法介绍

国密即国家密码局认定的国产密码算法，主要有SM1，SM2，SM3，SM4。密钥长度和分组长度均为128位。针对银行客户对数据库安全能力的诉求以及提高产品安全竞争力的要求，进行数据库企业级安全能力增强，openGauss 自2.0.0版本支持了国密算法，主要包括用户认证支持国密SM3算法[sm3算法](http://www.gmbz.org.cn/main/viewfile/20180108023812835219.html)，支持SM4国密算法加解密函数[sm4算法](http://www.gmbz.org.cn/main/viewfile/20180108015408199368.html)。

## 2. 国密SM3算法——用户认证

## 2.1 使用方法

openGauss现支持四种用户认证方式，其通过postgresql.conf文件中的参数password_encryption_type确定，认证方式与该参数的对应关系如下表所示：

| 认证方式   | 参数                       |
| ---------- | -------------------------- |
| md5        | password_encryption_type=0 |
| sha256+md5 | password_encryption_type=1 |
| sha256     | password_encryption_type=2 |
| sm3        | password_encryption_type=3 |

其中SM3认证算法目前只支持gsql、 JDBC、 ODBC三种连接方式。

创建SM3认证方式的用户的步骤：

（1）在postgresql.conf文件中配置password_encryption_type=3，并重启数据库使该参数生效

![image-20210922104810991](../image/sm3/image1.png)

（2）创建用户

如下示例中，创建了test用户，通过系统表pg_authid的rolpassword字段可以查看用户创建时对应的加密方式，图示即对应sm3加密

![image-20210922102744761](../image/sm3/image2.png)

（3）在pg_hba.conf文件中配置认证方式为sm3

![image-20210922103113193](../image/sm3/image3.png)

此时test用户远程登录方可认证通过

![image-20210922104158312](../image/sm3/image4.png)

对于创建其他认证方式的用户，过程与SM3类似，此处不再赘述，需注意加密方式与认证方式对应即可。

## 2.2 实现原理

openGauss使用RFC5802口令认证方案

- 用户秘钥生成

  RFC5802秘钥衍生过程如下图所示：

  ![image-20210922105633941](../image/sm3/image5.png)

  ```
  SaltedPassword := PBKDF2 (password, salt, i)
  ClientKey := HMAC(SaltedPassword, "Client Key")
  StoredKey := Hash(ClientKey)
  ```

  服务器端存的是StoredKey和ServerKey:

  1）StoredKey是用来验证Client客户身份的

  服务端认证客户端通过计算ClientSignature与客户端发来的ClientProof进行异或运算，从而恢复得到ClientKey，然后将其进行hash运算，将得到的值与StoredKey进行对比。如果相等，证明客户端验证通过。

  2）ServerKey是用来向客户端表明自己身份的

  类似的，客户端认证服务端，通过计算ServerSignature与服务端发来的值进行比较，如果相等，则完成对服务端的认证。

  3）在认证过程中，服务端可以计算出来ClientKey，验证完后直接丢弃不必存储。

  要做到合法的登录，必须知道Password、SaltedPassword或者ClientKey。如果StoryKey和ServerKey泄露，无法做到合法登录。

- 认证流程

  标准RFC5802口令认证流程如下图所示：

  ![image-20210922110211249](../image/sm3/image6.png)                               

  1、客户端发送username给服务端。

  2、服务端返回给客户端AuthMessage 和计算出来的ServerSignature。

  3、客户端收到信息后，首先利用认证信息AuthMessage中的salt和iteration-count(迭代次数)，从password计算得到SaltedPassword，然后计算得到下层所有的key。计算HMAC(ServerKey, AuthMessage) == ServerSignature是否相等，如果相等，则client完成对服务端的认证。

  4、客户端将计算得到的ClientProof发送给服务端。

  5、服务端使用其保存的StoredKey和AuthMessage计算HMAC，在和接收的client发送的ClientProof进行异或，得到ClientKey，在对ClientKey进行哈希，和其保存的StoredKey进行比较是否一致。如果一致，则客户端的认证通过。

  服务器端收到客户端请求后，根据pg_hba.conf 配置的认证方式，与客户端进行相应的认证交互。

## 3. 国密SM4算法——数据加解密

SM4国密算法可用于对表中的某一列数据进行加解密。参考gs_encrypt_aes128加密函数、gs_decrypt_aes128解密函数，新增的加密函数gs_encrypt，解密函数gs_decrypt支持aes128、sm4的加解密，可以兼容aes128。其中SM4算法调用openssl中的EVP_sm4_cbc()接口。

gs_encrypt_aes128和gs_decrypt_aes128函数示意：

![image-20210922144545491](../image/sm3/image10.png)

gs_encrypt和gs_decrypt函数示意：

![image-20210922144124180](../image/sm3/image11.png)

利用SM4算法对表中数据进行加解密示意图：

![1632817246028](../image/sm3/image12.png)

![1632817344288](../image/sm3/image13.png)

至此，openGauss支持使用国密SM3算法进行用户认证，SM4算法进行数据加解密。