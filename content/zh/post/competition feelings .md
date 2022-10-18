**我们是参与的是关于openGauss赛道，我们做的是关于基于openGuass全密态数据库相关的内容。**

收获有很多，从openGauss在本地的部署，再到对openGauss源码的学习，再到对openGauss全密态能力的了解，对openGauss的了解越来越深，也越发感觉他的丰富的功能特性。

1.openGauss的本地部署，我使用的是这个教程 地址 https://mp.weixin.qq.com/s/fRZ-p9TJOLfiEaGYZIAs6w

由于开始对linux命令的不熟悉，从而导致使用openGauss的一键部署脚本的使用出了很多问题，所以没出一次问题，linux环境就出了很多问题，导致无法继续下去，因此只能选择重装系统，再无数次重装系统重新跑脚本，改配置下，终于成功在本地部署了openGauss数据库。

主要有以下几个问题：

`（1）.虚拟机的硬盘分配过小，导致openGauss安装部署失败，最开始我只分配了20G硬盘和1G内存，导致openGauss的最后一步python运行脚本安装部署openGauss报错，后来使用的是60G硬盘和4G内存，就能部署成功了。`

`（2）.由于在本地虚拟机使用的是centos 7.6操作系统，这个系统上的python默认版本是python2，而安装部署openGauss脚本的要使用python3版本，因此需要重新安装python版本，但是脚本那一步在部署的时候会导致python命令和yum命令都没办法使用，因此只需要使用。`

**yum install python3 并且使用python3 执行最后的python文件脚本就行。 不用改配置的bak内容，改了反而更容易报错。**

（3）.`要保住虚拟机能联网，由于教程会在线下载内容，因此不联网，也会导致安装部署不成功，而且要改教程脚本里的ip地址。`

2.对openGauss源码的学习，主要是对openGauss的安全特性源码进行学习，包括密态等值大小比较。

目前还在学习过程中，包括openGauss的全密态数据库特性也在学习中，等后续学了内容再更新。
