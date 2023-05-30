+++

title = "opengauss 5.0 CM新特性之只读检测能力增强" 

date = "2023-05-30" 

tags = ["opengauss"] 

archives = "2023-05" 

author = "云和恩墨-戚钰" 

summary = "opengauss 5.0 CM新特性之只读检测能力增强"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"

+++

本文出处：[https://www.modb.pro/db/631091](https://www.modb.pro/db/631091)

# 一、 功能说明

只读状态从数据库获取，保证准确性； 
只读仲裁只仲裁当前超过阈值的实例，其他节点不受影响； 
主机只读保护后自动主备切换，选可用备机升主保证集群能正常提供工作。

# 二、 相关参数设置

1. 设置数据库只读模式的磁盘占用阈值为95%

```
$cm_ctl set --param --server -k datastorage_threshold_value_check=95
```

2. reload server参数

```
$ cm_ctl reload --param --server
```

3. 查看参数是否生效

```
$cm_ctl list --param --server|grep datastorage_threshold_value_check
```

# 三、 对比测试

## （1）3.0.0版本测试

初始集群状态（A为主）

![image.png](./images/20230519-b31cd3c8-26ef-4dfc-aec6-2b7c0e22bcaa.png)

使用混沌工具模拟数据目录占用95%

```
./blade create disk fill --path /gaussdata --percent 95 --retain-handle
```

![image.png](./images/20230519-5e4c3247-e8c1-48a0-950d-053aa1a936ce.png)

CMS主发送命令开启只读模式

![image.png](./images/20230519-ac9227d2-dc05-4321-b047-9b4cc8c19f9a.png)

查看集群状态，各实例为read only状态

![image.png](./images/20230519-8487b27e-3106-4f71-8c4b-afd6ccff757b.png)

销毁混沌实验后，CMS发送命令，关闭只读模式

![image.png](./images/20230519-a56788a9-3bd8-4506-963c-93be7ee16218.png)

集群状态正常

![image.png](./images/20230519-e859f69e-e346-4021-881c-b4e726dbde9e.png)

## （2） 5.0.0版本测试

### ① 主库数据目录超阈值

初始集群状态

![image.png](./images/20230519-f740d960-2da1-478b-9e4f-18be79b53dbc.png)

模拟主节点数据目录占96%

![image.png](./images/20230519-31152568-cf2e-4559-8764-2c5b5ae3417a.png)

主备切换，且新备库为只读

![image.png](./images/20230519-912e5d67-9a42-4c62-a9ae-498eb0eb3978.png)

cm_server key_event日志显示主备switchover

![image.png](./images/20230519-9761be95-6f5b-46f4-87f1-6740571fcd1f.png)

cm_agent–current.log日志显示开启只读模式

![image.png](./images/20230519-5c261440-fd75-4dab-8302-603dea78db86.png)

### ② 备节点数据目录超阈值

初始集群状态

![image.png](./images/20230519-1b525df4-0243-4850-9a03-45b6fc828caa.png)

模拟备节点数据目录95%

![image.png](./images/20230519-40041768-487b-438f-a50b-2802e4733789.png)

备库变为只读

![image.png](./images/20230519-28583a57-5a56-4cf9-84e0-1471986cfc18.png)
