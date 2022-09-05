+++

title = "Wget命令使用介绍" 

date = "2022-07-12" 

tags = ["Wget命令使用介绍"] 

archives = "2022-04" 

author = "张翠娉" 

summary = "Wget命令使用介绍"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "10:20"

+++

# Wget命令使用介绍



## **介绍**

Linux系统中的wget是一个下载文件的工具，它用在命令行下。对于Linux用户是必不可少的工具，我们经常要下载一些软件或从远程服务器恢复备份到本地服务器。wget支持HTTP，HTTPS和FTP协议，可以使用HTTP代理。所谓的自动下载是指，wget可以在用户退出系统之后在后台执行。这意味这你可以登录系统，启动一个wget下载任务，然后退出系统，wget将在后台执行直到任务完成，相对于其它大部分浏览器在下载大量数据时需要用户一直的参与，这省去了极大的麻烦。

wget 非常稳定，它在带宽很窄的情况下和不稳定网络中有很强的适应性。如果是由于网络的原因下载失败，wget会不断的尝试，直到整个文件下载完毕。如果是服务器打断下载过程，它会再次联到服务器上从停止的地方继续下载。这对从那些限定了链接时间的服务器上下载大文件非常有用。

## 命令格式

wget [参数] [URL地址]

## 常用下载命令举例

下面以 http://example.com 为例。

1. 使用wget下载单个文件

   ```
   wget http://example.com
   ```

2. 使用wget FTP下载

   ```
   wget --ftp-user=USERNAME --ftp-password=PASSWORD http://example.com
   ```

3.  使用wget -c断点续传，即当网络不稳定或突然断网，可以使用如下命令进行下载

   ```
   wget -c http://example.com
   ```

4. 使用wget -b后台下载

   ```
   wget -b http://example.com
   ```

5. 使用wget -o把下载信息存入日志文件

   ```
   wget -o download.log http://example.com
   ```

6. 使用wget -C使用服务器中的高速缓存中的数据 (默认是使用的)

   ```
   wget -C http://example.com
   ```

## 相关链接

更多详情，请访问[wget命令详解](https://www.jianshu.com/p/2e2ba8ecc22a)。