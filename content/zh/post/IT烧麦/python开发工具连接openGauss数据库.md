+++

title = "【我和openGauss的故事】—python开发工具连接openGauss数据库。"

date = "2022-11-12"

tags = ["python", "openGauss", "开发工具"]

archives = "2022-10"

author = "IT烧麦"

summary = "【我和openGauss的故事】—python开发工具连接openGauss数据库。"

+++

# 前言
本文主要内容
- python开发语言在linux和windows下的安装配置。
- 使用psycopg2包在linux下python连接openGauss。
- 开发工具PyCharm和Visual Studio Code使用psycopg2包连接openGauss。
# 一、python环境
版本使用python3.6
## 1.1 linux下的python环境
centos7.6环境下使用yum安装python3
### 1.1.1 系统如果可以上网。使用华为的源进行配置
```
wget -O /etc/yum.repos.d/CentOS-Base.repo https://repo.huaweicloud.com/repository/conf/CentOS-7-reg.repo
```
### 1.1.2 如果不能上网，使用安装系统时的CentOS-7-x86_64-DVD-1810.iso进行配置yum
```
cd /etc/yum.repos.d/
mkdir bak
mv *.repo bak
mount /dev/cdrom /media/
vi centos.repo
	[c7-media]
	name=CentOS-$releasever – Media
	baseurl=file:///media/
        file:///media/cdrom/
        file:///media/cdrecorder/
	gpgcheck=0
	enabled=1
```

### 1.1.3 配置好后，进行安装
```
yum -y install python3
```
这样python3 就安装成功
```
[root@master01 ~]# python3
Python 3.6.8 (default, Nov 16 2020, 16:55:22) 
[GCC 4.8.5 20150623 (Red Hat 4.8.5-44)] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> 
```
![image.png](/zh/post/IT烧麦/images/openGauss/1.1.3-1.png)


## 1.2 window下的python环境
### 1.2.1 下载软件
下载Anaconda3-5.2.0-Windows-x86_64对应的python3.6.5
[Anaconda3-5.2.0-Windows-x86_6下载地址](https://mirrors.bfsu.edu.cn/anaconda/archive/Anaconda3-5.2.0-Windows-x86_64.exe)
![image.png](/zh/post/IT烧麦/images/openGauss/1.2.1-1.png)
### 1.2.2 开始安装配置
点击一步一步安装完成即可。
安装完成
win+r或开始点右键 出来运行，输入cmd 回车
![image.png](images/openGauss/1.2.2-1.png)
出来这个界面
![image.png](/zh/post/IT烧麦/images/openGauss/1.2.1-2.pngg)
### 1.2.3 使用pip安装psycopg2包
然后开始安装psycopg2,使用清华的源
```
pip install psycopg2 -i https://pypi.tuna.tsinghua.edu.cn/simple
```
安装完成
# 二、openGauss的配置
> 安装请看上一篇文章
[《手把手教你安装openGauss 3.1.0》](https://www.modb.pro/db/545504)

|环境|版本|
|-|-|
|数据库版本|openGauss 3.1.0|
|操作系统|centos 7.6|
|虚拟环境|VMware® Workstation 16 |

# 三、linux使用python3进行连接openGauss数据库
## 3.1 配置Python-psycopg2_3.1.0
### 3.1.1 下载
下载地址：https://www.opengauss.org/zh/download/
![image.png](/zh/post/IT烧麦/images/openGauss/3.1.1-1.png)
上传到服务器
### 3.1.2 解压并配置
- 解压
```
tar -xzvf openGauss-3.1.0-CentOS-x86_64-Python.tar.gz
```
解压后的文件如下
![image.png](/zh/post/IT烧麦/images/openGauss/3.1.2-1.png)
-  配置
把psycopg2报拷贝到/usr/lib/python3.6/site-packages目录下
```
cp -r psycopg2 /usr/lib/python3.6/site-packages
```
确保psycopg2目录权限至少为755，以免调用时提示文件由于权限问题无法访问
对于非数据库用户，需要将解压后的lib目录，配置在LD_LIBRARY_PATH环境变量中。
增加如下内容
```
vi ~/.bashrc

export LD_LIBRARY_PATH=/root/python/lib:$LD_LIBRARY_PATH
```

![image.png](/zh/post/IT烧麦/images/openGauss/3.1.2-2.png)

- 配置完成。
## 3.2  使用python连接openGauss数据库
```
[root@master01 python]# python3
Python 3.6.8 (default, Nov 16 2020, 16:55:22) 
[GCC 4.8.5 20150623 (Red Hat 4.8.5-44)] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import psycopg2
>>> conn = psycopg2.connect(database="postgres", user="gsname", password="gsname@123", host="192.168.204.16", port="15400")
>>> cur = conn.cursor()
>>> cur.execute("select * from  COMPANY3 ");
>>> rows = cur.fetchall()
>>> for row in rows:
...    print("ID = ", row[0])
...    print("NAME = ", row[1])
...    print("ADDRESS = ", row[2])
...    print("SALARY = ", row[3])
... 
输出内容
ID =  1
NAME =  Paul
ADDRESS =  32
SALARY =  California                                        
ID =  2
NAME =  Allen
ADDRESS =  25
SALARY =  Texas                                             
ID =  3
NAME =  Teddy
ADDRESS =  23
SALARY =  Norway                                            
ID =  4
NAME =  Mark
ADDRESS =  25
SALARY =  Rich-Mond                                         
>>> 

```
- 说明python连接openGauss成功，能够读取出数据。
![image.png](/zh/post/IT烧麦/images/openGauss/3.2-1.png)
![image.png](/zh/post/IT烧麦/images/openGauss/3.2-2.pngg)
# 四、PyCharm开发工具的使用
## 4.1 下载安装
https://www.jetbrains.com/pycharm/download/#section=windows
![image.png](/zh/post/IT烧麦/images/openGauss/4.1-1.png)
- 有2个版本
一个Professional版本，免费使用30天，然后收费，功能多。
一个Community版本，免费的。相对来说功能少。
> 说明：
我选择了Community版本。所以Tools->Deployment->Browse Remote Host 这个功能不能用。
![image.png](/zh/post/IT烧麦/images/openGauss/4.1-2.png)
然后安装。
点击一步一步安装即可。
安装完成
## 4.2  开始连接openGauss
### 4.2.1 配置
![image.png](/zh/post/IT烧麦/images/openGauss/4.2.1-1.png)
- 新建projects
![image.png](/zh/post/IT烧麦/images/openGauss/4.2.1-2.png)

![image.png](/zh/post/IT烧麦/images/openGauss/4.2.1-3.png)
- 创建包
![image.png](/zh/post/IT烧麦/images/openGauss/4.2.1-4.png)
- 创建python文件
![image.png](/zh/post/IT烧麦/images/openGauss/4.2.1-5.png)
创建完成后是这样的。
### 4.2.2 开始写代码
```
import psycopg2

conn = psycopg2.connect(database="postgres", user="pyuser", password="pyuser@123", host="192.168.204.16", port="15400")

cur = conn.cursor()


cur.execute("select * from  COMPANY3 ");
rows = cur.fetchall()
for row in rows:
   print("ID = ", row[0])
   print("NAME = ", row[1])
   print("ADDRESS = ", row[2])
   print("SALARY = ", row[3])
conn.commit()
conn.close()
```
![image.png](/zh/post/IT烧麦/images/openGauss/4.2.2-1.png)
- 执行
![image.png](/zh/post/IT烧麦/images/openGauss/4.2.2-2.png)
- 结果
![image.png](/zh/post/IT烧麦/images/openGauss/4.2.2-3.png)
- 完成。
# 五、Visual Studio Code开发工具的使用
## 5.1  下载
下载地址：https://code.visualstudio.com/Download
![image.png](/zh/post/IT烧麦/images/openGauss/5.1-1.png)
选择自己合适的操作系统
这个软件是免费的。一些功能需要下载对应的插件
```
VSCodeSetup-x64-1.73.0.exe
```
## 5.2 安装
点击软件一步一步安装即可。
安装完后，打开是这样的。
![image.png](/zh/post/IT烧麦/images/openGauss/5.2-1.png)
 

## 5.3  远程连接到Linux的python开发环境。
### 5.3.1 下载远程插件和python插件
- 下载Remote Development插件
![image.png](/zh/post/IT烧麦/images/openGauss/5.3.1-1.png)
下载安装成功后，出现这个图标
![image.png](/zh/post/IT烧麦/images/openGauss/5.3.1-2.png)
- 下载python插件
![image.png](/zh/post/IT烧麦/images/openGauss/5.3.1-3.png)
### 5.3.2 配置远程服务器
在SSH TARGETS配置远程服务器，具体步骤如下：
- 点击远程资源管理器
- 点击齿轮图标
- 打开弹出的config文件，分别配置Host、Hostname、User
![image.png](/zh/post/IT烧麦/images/openGauss/5.3.2-1.png)

- 选择SSH Targets
![image.png](/zh/post/IT烧麦/images/openGauss/5.3.2-2.png)
- 可以配置多个远程
![image.png](/zh/post/IT烧麦/images/openGauss/5.3.2-3.png)

- 配置文件
host随便写，把hostname后面写上ip地址，user写操作系统的用户名
![image.png](/zh/post/IT烧麦/images/openGauss/5.3.2-4.png)
- 设置
打开VS Code设置，搜索Show Login Terminal，勾选下方"Always reveal the SSH login terminal"，记得一定要操作这一步，不然会一直提示报错。
![image.png](/zh/post/IT烧麦/images/openGauss/5.3.2-5.png)
- 打开远程窗口
![image.png](/zh/post/IT烧麦/images/openGauss/5.3.2-6.png)
过程中需要输入root的密码。

- 左下角可以看到远程连接
![image.png](/zh/post/IT烧麦/images/openGauss/5.3.2-7.png)
- 打开远程文件夹
![image.png](/zh/post/IT烧麦/images/openGauss/5.3.2-8.png)
- 要求输入密码
![image.png](/zh/post/IT烧麦/images/openGauss/5.3.2-9.png)
输入密码后，远程成功
![image.png](/zh/post/IT烧麦/images/openGauss/5.3.2-10.png)
### 5.3.3 开始使用远程环境进行开发
- 新建python开发文件open11.py
![image.png](/zh/post/IT烧麦/images/openGauss/5.3.3-1.png)
- 这样就可以开始开发了。
![image.png](/zh/post/IT烧麦/images/openGauss/5.3.3-2.png)
- 点击执行
![image.png](/zh/post/IT烧麦/images/openGauss/5.3.3-3.png)
结果输出正确。
- 配置完成。
# 总结
- 如果使用pip安装psycopg2，密码加密方式只能使用MD5方式。不然PyCharm连接不上openGauss。
- Visual Studio Cod免费使用，需要自己安装对应的插件，在做远程连接centos时，可以做成免密登录，网友自行百度操作。
- PyCharm想用远程连接centos，需要收费版本。
- 使用pip安装psycopg2的包也是可以连接到openGauss的。