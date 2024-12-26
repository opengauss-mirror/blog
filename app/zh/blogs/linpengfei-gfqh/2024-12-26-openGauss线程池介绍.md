---
title: 'openGauss线程池介绍'
date: '2024-12-26'
category: 'blog'
tags: ['openGauss线程池介绍']
archives: '2024-12-26'
author: 'linpengfei@gf.com.cn'
summary: 'openGauss线程池介绍'
---

# openGauss线程池介绍
## 线程池介绍
### 线程池
由若干个功能相同或不同的线程组成。在PG中，一个进程对应一个会话（连接），容易造成资源浪费。
对比PG，openGauss将进程模型改为线程模型，线程池支持上万的并发，通过线程池实现session和thread之间的解耦，提高线程的利用率，高并发下不会导致线程的频繁切换。
简略模型图如下：
![image-20241226-1](.//images/image-20241226-1.png)

## openGauss线程池
由一下6个角色构成：
- 线程池控制线程
- 线程池调度线程
- 线程组控制线程
- 线程组监听线程
- 会话控制线程
- 工作线程
如图：
![image-20241226-2](.//images/image-20241226-2.png)

## openGauss中的线程池
![image-20241226-3](.//images/image-20241226-3.png)

## 线程池初始化
1、进行m_sessCtrl成员和m_groups成员的创建工作，根据绑核策略分配线程个数
2、在“ThreadPoolGroup::init”函数中，创建m_listener对象，启动listener线程，初始化每个worker的互斥量和条件变量
3、创建m_scheduler成员对象，并且调用“ThreadPoolScheduler::StartUp”函数启动线程池调度线程
![image-20241226-4](.//images/image-20241226-4.png)

## 线程池会话处理流程图
![image-20241226-5](.//images/image-20241226-5.png)

## 线程池会话处理流程-会话句柄创建
流程图如下：
![image-20241226-6](.//images/image-20241226-6.png)
1、client发起请求
2、postmaster接收到请求后（判断是否开启线程池enable_thread_pool），交给pool controller处理，pool controller会选择空闲worker最多的group
3、pool controller交给session controller，创建会话句柄
4、将会话的socket添加到group的listenr线程监听事件列表中

## 线程池会话处理流程-处理请求
流程图如下：
![image-20241226-7](.//images/image-20241226-7.png)
1、listener线程会根据创建好的epoll等待事件进入等待状态，等待客户端的任务请求
2、接收到请求，根据socket描述符找到事件对应的会话信息，将会话从空闲列表中删除，进行会话分配
3、如果有空闲的worker线程，通知worker线程进行处理;如果没有空闲的worker线程，则把会话挂到等待队列中。
4、worker线程被唤醒后，读取客户端连接上的请求，执行相应请求，并返回请求结果，worker处理完请求后重新将会话的socket放入listener的监听列表中，等待分配下一个任务。
worker线程返还会话后，检查会话等待队列；如果存在等待响应请求的会话，则直接从该队列中取出新的会话并继续工作；如果没有等待响应的session，则将自身标记为free（空闲）状态，等待listener线程唤醒。
对于worker的调度以事务为的单位，如果事务没有处理完，worker无法接收其他任务，如果判断事务没有完结，worker在处理完单个命令后，也不会将socket放回listener的监听列表

## 线程池扩容/缩容
group状态：
（1）hang：组内所有的worker均被占用
（2）非hang：有空闲worker可以提供服务
worker状态：
（1）THREAD_UNINT :初始态
（2）THREAD_RUN: 启动成功后变为此状态
（3）THREAD_PEDNING：若group处于空闲，将thread_run状态的线程改为thread_pending，此状态下的worker不会接收任务
（4）THREAD_EXIT：如果长期处于空闲状态，scheduler会将空闲的worker关闭

## 线程池扩容/缩容
扩容/缩容逻辑：
pool scheduler 线程每过1s调用DynamicAdjustThreadPool
![image-20241226-8](.//images/image-20241226-8.png)
