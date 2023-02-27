---
title: 'MogDB 设置透明加密'

date: '2022-06-27'

category: 'blog'
tags: ['MogDB 设置透明加密']

archives: '2022-06'

author: '云和恩墨'

summary: 'MogDB 设置透明加密'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# MogDB 设置透明加密

本文出处：[https://www.modb.pro/db/419959](https://www.modb.pro/db/419959)

## 概述

透明数据加密（Transparent Data Encryption），是数据库在将数据写入存储介质时对数据进行加密，从存储介质中读取数据时自动解密，防止攻击者绕过数据库认证机制直接读取数据文件中的数据，以解决静态数据泄露问题。该功能对于应用层几乎透明无感知，用户可根据需要决定是否启用透明数据加密功能。

## 前提条件

- 需要由密钥管理服务 KMS 对数据加密密钥提供保护，数据库可以正常访问 KMS 服务。KMS 服务可在[华为云数据加密服务 DEW](https://www.huaweicloud.com/product/dew.html)申请开通。
- 需要将 GUC 参数[enable_tde](https://docs.mogdb.io/zh/mogdb/v3.0/27.1-security-configuration#enable_tde)设置为 on，开启数据库透明数据加密开关。同时需正确设置数据库实例主密钥 ID 参数[tde_cmk_id](https://docs.mogdb.io/zh/mogdb/v3.0/27.1-security-configuration#tde_cmk_id)。

## 背景信息

当前版本主要实现对接华为云 KMS 服务，支持表级密钥存储，实现对行存表加密，规格约束如下：

- 支持 heap 存储行存表加密。
- 不支持列存表加密，不支持物化视图加密，不支持 ustore 存储引擎加密。
- 不支持索引和 Sequence 加密，不支持 XLOG 日志加密，不支持 MOT 内存表加密，不支持系统表加密。
- 用户在创建表时可以指定加密算法，加密算法一旦指定不可更改。如果创建表时设置 enable_tde 为 on，但是不指定加密算法 encrypt_algo，则默认使用 AES_128_CTR 加密算法。
- 如果在创建表时未开启加密功能或指定加密算法，后续无法再切换为加密表。
- 对于已分配加密密钥的表，切换表的加密和非加密状态，不会更换密钥和加密算法。
- 数据密钥轮转只有开启表加密功能时才支持轮转。
- 不支持单数据库实例跨 region 的多副本主备同步，不支持单数据库实例跨 region 的扩容，不支持跨 region 的备份恢复、数据库实例容灾和数据迁移场景。
- 混合云场景如果使用华为云 KMS 和管控面功能，则可以支持透明数据加密，其他 KMS 服务如果接口不兼容则无法支持。
- 加密表的查询性能比不加密时会有所劣化，对于性能有较高要求的情况下需谨慎开启加密功能。

## 密钥管理机制

透明数据加密功能中数据的加密和解密都依赖于安全可靠的密钥管理机制。本功能采用三层密钥结构实现密钥管理机制，即根密钥（RK）、主密钥（CMK）和数据加密密钥（DEK）。主密钥由根密钥加密保护，数据加密密钥由主密钥加密保护。数据加密密钥用于对用户数据进行加密和解密，每个表对应一个数据加密密钥。根密钥和主密钥保存在 KMS 服务中，数据加密密钥通过向 KMS 服务申请创建，创建成功可同时返回密钥明文和密文。数据加密密钥明文在内存中会使用 hash 表进行缓存减少访问 KMS 频次以提升性能，密钥明文只存在内存中使用不会落盘，并且支持自动淘汰机制删除不常使用的密钥明文，只保存最近 1 天内使用的密钥明文。数据加密密钥密文保存在数据库中并落盘持久化。对用户表数据加解密时，如果内存中没有对应密钥明文则需向 KMS 申请对数据密钥解密后再使用。

## 表级加密方案

允许用户在创建表时指定是否对表进行加密和使用的加密算法，加密算法支持 AES_128_CTR 和 SM4_CTR 两种算法，算法一旦指定不可更改。对于创建表时指定为加密的表，数据库会自动为该表申请创建数据加密密钥，并将加密算法、密钥密文和对应主密钥 ID 等参数使用”keyword=value”格式保存在 pg_class 系统表中的 reloptions 字段中。

对于加密表，允许用户切换表的加密状态，即将加密表切换为非加密表，或将非加密表切换为加密表。如果在创建表时未使能加密功能，后续无法再切换为加密表。

对于加密表，支持数据加密密钥轮转。密钥轮转后，使用旧密钥加密的数据仍使用旧密钥解密，新写入的数据使用新密钥加密。密钥轮转时不更换加密算法。

对于行存表，每次加解密的最小数据单元为一个 8K 大小的 page 页面，每次对 page 页面加密时会通过安全随机数接口生成 IV 值，并将 IV 值和密钥密文、主密钥 ID 等信息保存在页面中一起写入存储介质。对于加密表由于 page 页面中需要保存加密密钥信息，相比不加密时占用存储空间膨胀约 2.5%。

## 创建加密表

登录数据库，创建加密表 tde_test1，加密状态为开启，指定加密算法为 AES_128_CTR：

```
MogDB=# CREATE TABLE tde_test (a int, b text) with (enable_tde = on, encrypt_algo = 'AES_128_CTR');
```

创建加密表 tde_test2，加密状态为开启，不指定加密算法，则加密算法默认为 AES_128_CTR：

```
MogDB=# CREATE TABLE tde_test2 (a int, b text) with (enable_tde = on);
```

创建加密表 tde_test3，加密状态为关闭，指定加密算法为 SM4_CTR：

```
MogDB=# CREATE TABLE tde_test3 (a int, b text) with (enable_tde = off, encrypt_algo = 'SM4_CTR');
```

## 切换加密表加密开关

登录数据库，将加密表 tde_test1 的加密开关置为 off：

```
MogDB=# ALTER TABLE tde_test1 SET (enable_tde=off);
```

将加密表 tde_test1 的加密开关置为 on：

```
MogDB=# ALTER TABLE tde_test1 SET (enable_tde=on);
```

## 对加密表进行密钥轮转

登录数据库，对加密表 tde_test1 进行密钥轮转：

```
MogDB=# ALTER TABLE tde_test1 ENCRYPTION KEY ROTATION;
```
