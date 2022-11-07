+++

title = "我眼中的openGauss数据库十大尬点" 

date = "2022-11-07" 

tags = ["我眼中的openGauss数据库十大尬点"] 

archives = "2022-11" 

author = "彭冲" 

summary = "我眼中的openGauss数据库十大尬点"

img = "/zh/post/pengchong/title/img9.png" 

times = "10:20"
+++

# 我眼中的openGauss数据库十大尬点

本文出处：[https://www.modb.pro/db/545567](https://www.modb.pro/db/545567)

写过几篇标题带"十大"关键字的文章，阅读量较高，比如昨天这篇[PG数据库十大经典案例解说](https://www.modb.pro/db/544144)浏览量接近一千，于是本文以"十大尬点"作为关键字吐槽一下openGauss。

吐槽有两方面的原因，首先是为了留念本人之前处理和分析问题的过程，其次也是为了让大家更好的使用openGauss，就如小时候我老爸揍我一样，那也是满满的爱。

## 一、剪不断的SSL依赖

本以为pg_hba.conf不使用SSL认证就可以不依赖它，后来发现内部工具也有依赖，是我想简单了。

## 二、娇气的OM工具

初次安装openGauss时容易遇到OM工具相关的问题，比如XML文件格式配置问题，python3小版本等问题，最后经过preInstall和Install两大高手的挑战之后能感受到超级玛丽通关的体验。

## 三、过度的安全机制

首次接触1.0版本，安装数据库时没有设置初始用户的密码，发现gsql登录之后无法做任何操作，因为必须要修改初始用户的密码。

但这确实有点尴尬，或许应该仔细先看看文档，就明白系统预设了一个轩辕代号。

```
postgres=# ALTER ROLE omm IDENTIFIED BY 'XXXX' REPLACE 'XuanYuan@2012';
```

该问题很快就得到了完善，不过在2.0时也遇到了新的挑战，管理用户不能帮普通用户重置密码，必须知道普通用户的原密码才能进行修改，后面的版本也快速优化了这个问题。

## 四、不可大意的启动模式

使用gs_ctl启动服务时在单机场景下不需要关注启动模式，主备环境下需要注意区分。

启动主库：

```
$ gs_ctl start -D data -M primary
```

启动备库：

```
$ gs_ctl start -D data -M standby
```

主库和备库需要以各自的模式启动，如果备库我们忘记了使用启动模式，除了主备关系会失败之外，也无法简单地通过关闭服务来重新操作，只能使用build操作来重建备库。

因此主备环境下启动备库一定要注意使用standby模式启动，切记！

## 五、public模式的硬依赖

不可否认openGauss对public模式增强了安全性，但我们不能强制删除它，不然备份恢复等场景会遇到一些小麻烦。

## 六、内卷的模板库

PG里默认模板库是template1，openGauss里轮换到了template0。

```
openGauss# create database mydb template template1;
ERROR:  template1 is not supported for using here, just support template0
```

## 七、步调不一致的LSN

主备环境查询xlog接收LSN不同阶段的两个函数返回类型不一致，如果有相关计算，不能运算，需要做一下转换处理。

![image.png](./images/20221105-2954bc74-7a1c-4d34-a952-76e8c27ce1d0.png)

## 八、当自定义表空间遇上外部参数配置

在做增量备份时，自定义表空间tablespace-mapping与外部参数配置external-mapping遇上之后会产生什么化学反应呢？对比测试请参考：[pg_probackup包含新建表空间的备份及恢复](https://www.modb.pro/db/404169)

## 九、被吞噬的0x00

遇到一个从MySQL数据库迁移过来的应用程序解压数据不一致，最终发现openGauss吞掉了零字节，案例参考：[openGauss/MogDB零字节问题处理](https://www.modb.pro/db/196647)

## 十、元数据版本不碰撞

PG里通过catalog_version_no进行系统元数据碰撞，检测数据库的二进制与初始化的PGDATA是否匹配来避免可能隐藏的不兼容性问题。openGauss目前不管是低启高，还是高启低都不会BUMP。
