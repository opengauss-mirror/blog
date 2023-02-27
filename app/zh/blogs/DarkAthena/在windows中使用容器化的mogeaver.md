---
title: '在windows中使用容器化的mogeaver'

date: '2022-09-09'

tags: ['openGauss']

archives: '2022-09'

author: 'DarkAthena'

summary: '在windows中使用容器化的mogeaver'

img: '/zh/post/DarkAthena/title/img.png'

times: '10:20'
category: 'blog'
---

# 【openGauss】在 windows 中使用容器化的 mogeaver

## 前言

这是一个对目前某些暂时在 linux 专享的功能，在 windows 上实现的探索，不建议在生产中使用。

## 思路

1. 目前 windows10/11 上支持搭建 docker 环境，而不需要使用 linux 虚拟机
2. windows 上的 docker 可以借用 VcXsrv 或 xming 等 X11 工具，来将容器中的图形化界面显示到 windows 上
3. mogeaver 的 linux 版本是用的 gtk 做的 GUI

所以，理论上，我们可以找个操作系统的 docker 镜像，装好 gtk 和 jdk 环境,把 linux 版本的 mogeaver 放进去，然后在 windows 上用 VcXsrv 设置一个显示器，启动容器，把容器的 dispaly 设置到 windows 上，就能在 windows 上使用 linux 版本的 mogeaver 了。

## 需要解决的问题

1. 最好能找到一个带 gtk 环境的 docker 镜像，这样就不需要自己从头开始构建了（之前没接触过 gtk 开发，为了省时间。。。）
2. 一般精简的 docker 镜像是没有中文字体支持的，因此 mogeaver 就也不能显示中文字体，而国内的 windows 的用户应该还是更愿意使用中文界面
3. 默认在 mogeaver 中设置好 gs_dump/gsql 等客户端工具的目录，减少用户配置环境的操作
4. 用户配置文件信息需要持久化到宿主机上，防止下次启动容器配置丢失
5. 最好每次在用 mogeaver 时创建容器，关闭的时候自动删除容器，节约资源
6. 默认 yum 仓库源有时候无法连接，需要有个备用源，否则可能构建镜像失败

## 半成品

项目地址：
https://gitee.com/darkathena/mogeaver-docker

---

#### 使用说明

1. 先确保本地 windows 已安装 docker-desktop,并已经启动该服务

> https://www.docker.com/get-started/

2. 下载 VcXsrv

> https://sourceforge.net/projects/vcxsrv/

3. 安装 VcXsrv，一路下一步，然后打开 XLaunch，一路下一步
4. 下载 mogdb 和 mogeaver 压缩包，放到本文件夹

```
wget https://cdn-mogdb.enmotech.com/mogeaver/22.1.5/mogeaver-ce-22.1.5-linux.gtk.x86_64.tar.gz
wget https://cdn-mogdb.enmotech.com/mogdb-media/3.0.1/MogDB-3.0.1-CentOS-x86_64.tar.gz
```

5. 进入本目录，执行构建镜像命令

```
docker build -t mogeaver-docker:latest .
```

6. 构建完成后，执行 run_mogeaver.bat 即可启动 mogeaver

## 个性化修改说明

1. 默认用户配置路径在 d:\MogeaverData ，可以通过修改 run_mogeaver.bat 文件变更
2. 默认 gs_dump 导出文件路径在 d:\dump_data ，可以通过修改 run_mogeaver.bat 文件变更
3. 如果需要中文字体支持，请取消 dockerfile 中关于“Chinese font support”部分的注释
4. 如果需要更换国内 yum 源，请取消 dockerfile 中关于“change yum repo”部分的注释

#### 特点

1. 已集成 openGauss 客户端命令行工具，比如 gsql/gs_dump 等，可以通过 mogeaver 相关功能调用
2. 关闭程序即删除容器，节省内存资源

## 使用截图

1. 构建

   ![image-1662550269020](./images/16bcc5b476ab328016746560d331ea19.png)

2. 软件打开界面
   ![image-1662550350017](./images/e9f0ab7b1e4c1b98f58b42333b74f5db.png)
3. 执行备份
   ![image-1662550519565](./images/f21188242d4b9e58f48df77806eb5cd0.png)
   ![image-1662550700045](./images/c5d256000aacb55e4f5989d04614d52d.png)
4. 生成的文件
   ![image-1662550744841](./images/bb6a266ced83afa526b54732382aaccf.png)

## 遗留问题

由于不明原因，一段时间不操作，容器版本的程序就会闪退。。。

## 后记

在做这个东西的时候，了解到了目前很多东西都可以容器化，后来又想到了，能不能封装一个 gs_dump.exe 调用 linux 容器中的 gs_dump，这样就能用 windows 版本的 mogeaver 来调用 gs_dump 了。以后有时间再看怎么弄吧。

> - **本文作者：** [DarkAthena](https://www.darkathena.top/)
> - **本文链接：** https://www.darkathena.top/archives/mogeaver-on-docker
> - **版权声明：** 本博客所有文章除特别声明外，均采用[CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) 许可协议。转载请注明出处！
