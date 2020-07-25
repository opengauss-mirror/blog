# blog

#### 介绍

欢迎来到openGauss官方博客仓库。

#### 怎么在官网写博客

需要将自己写的博客合入到opengauss/blog工程里面，发布后就可以在官网看到

1. fork opengauss/blog工程到自己的仓库里面，基于自己的仓库写博客并提交Pull Request即可

2. 在 `content/zh/post/` 目录下建立自己的博客目录，里面就可以撰写博客了。博客一般为markdown文件格式

3. 图片都可以放到自己的博客目录下，对于博客内容引用的图片，使用相对路径，比如在自己的博客目录下 images/pic.png , 博客内容中则引用为 `../images/pic.png`；博客首页有每一项博客的概览图片，对于该图片路径，使用绝对路径，例如 `/zh/post/blogname/images/title.jpg`

#### 怎么预览

写完博客了怎么看写的博客的格式是否正确，图片展示是否正常

> 博客都为markdown文件，借助一些markdown的预览工具即可查看博客的格式

> blog工程是个web服务，可以在本地运行起来后看看效果

1. blog工程使用go语言的hugo框架，在本地配置好该框架即可运行

2. windows下安装go：https://studygolang.com/dl 下载go的sdk，安装完后控制台使用 `go version` 查看是否安装成功

3. windows下安装hugo：https://github.com/gohugoio/hugo/releases 下载hugo版本，推荐使用 hugo_extended_0.74.3_Windows-64bit.zip

4. 配置hugo： 将hugo解压，并把路径配置到windows的环境变量里面。例如解压到D:\software\hugo目录下，在windows环境变量新增一项，添加D:\software\hugo即可。重新打开控制台CMD，输入hugo version，查看hugo是否安装成功

5. 启动web服务：在blog根目录下，打开控制台CMD，输入 `hugo server`，即可启动服务，浏览器输入 http://localhost:1313/zh/ 就能看到已经正常运行的blog服务了