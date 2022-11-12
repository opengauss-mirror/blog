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
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-5c37d790-139c-4728-bba4-625562336fd4.png)


## 1.2 window下的python环境
### 1.2.1 下载软件
下载Anaconda3-5.2.0-Windows-x86_64对应的python3.6.5
[Anaconda3-5.2.0-Windows-x86_6下载地址](https://mirrors.bfsu.edu.cn/anaconda/archive/Anaconda3-5.2.0-Windows-x86_64.exe)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-81b7dc64-2398-4953-a767-40874502df3d.png)
### 1.2.2 开始安装配置
点击一步一步安装完成即可。
安装完成
win+r或开始点右键 出来运行，输入cmd 回车
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-0f5e8201-0fe5-480f-a57e-43bcdc43653b.png)
出来这个界面
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-65dacfb2-12fd-4dfa-8ce0-09233f609ca7.png)
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
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-24cff202-c1af-441c-8fa9-6bf9a32b0510.png)
上传到服务器
### 3.1.2 解压并配置
- 解压
```
tar -xzvf openGauss-3.1.0-CentOS-x86_64-Python.tar.gz
```
解压后的文件如下
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-95684a21-3394-4013-8621-c52a27e1ba38.png)
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

![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-ff872657-e202-4dfa-b644-fb28ccfee6ad.png)

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
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-ca477b30-e654-440f-8eb8-00fd9dd7af82.png)
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-ed4f8648-cec3-4b87-a354-ca3028a81f62.png)
# 四、PyCharm开发工具的使用
## 4.1 下载安装
https://www.jetbrains.com/pycharm/download/#section=windows
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-7e377a95-19c9-4b25-973b-b41fd2edb5db.png)
- 有2个版本
一个Professional版本，免费使用30天，然后收费，功能多。
一个Community版本，免费的。相对来说功能少。
> 说明：
我选择了Community版本。所以Tools->Deployment->Browse Remote Host 这个功能不能用。
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-86b9667c-b17d-4f3c-aa00-5b17d541e917.png)
然后安装。
点击一步一步安装即可。
安装完成
## 4.2  开始连接openGauss
### 4.2.1 配置
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-576c29a2-261b-4180-a9dd-3099bb518f4c.png)
- 新建projects
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-80e8453b-9565-49cb-b77c-d7e2b0ef1668.png)

![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-f23fc9af-d77d-4e8a-af5c-f59faa769774.png)
- 创建包
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-a62c7e84-77ec-4cb9-99d3-481af1e87bf8.png)
- 创建python文件
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-404d92be-20b2-458e-9569-74aec3bb4f7f.png)
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
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-e0b54d23-a733-4c84-a767-ee725a3de325.png)
- 执行
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-f9a1fd81-2f4b-4d72-a10a-94125c4c86b5.png)
- 结果
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-f24fb8bc-5d14-4f90-a388-bad13add14da.png)
- 完成。
# 五、Visual Studio Code开发工具的使用
## 5.1  下载
下载地址：https://code.visualstudio.com/Download
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-cc9f12d3-cd82-4807-abbd-6a103b170845.png)
选择自己合适的操作系统
这个软件是免费的。一些功能需要下载对应的插件
```
VSCodeSetup-x64-1.73.0.exe
```
## 5.2 安装
点击软件一步一步安装即可。
安装完后，打开是这样的。
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-84fbf7b9-d067-4128-ba0c-df4a44276bc7.png)
 

## 5.3  远程连接到Linux的python开发环境。
### 5.3.1 下载远程插件和python插件
- 下载Remote Development插件
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-fad09885-b671-43ff-b94a-605b0d077eac.png)
下载安装成功后，出现这个图标
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-95a241ca-3669-4d52-9092-ca76b9eb6024.png)
- 下载python插件
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-afd9d7a7-7cbd-4c03-82ec-5517efc358bb.png)
### 5.3.2 配置远程服务器
在SSH TARGETS配置远程服务器，具体步骤如下：
- 点击远程资源管理器
- 点击齿轮图标
- 打开弹出的config文件，分别配置Host、Hostname、User
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-88562410-0486-4e17-8d12-ca45b871835b.png)

- 选择SSH Targets
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-243e81d2-f262-4a5a-8f70-a66e62a4395e.png)
- 可以配置多个远程
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-791977d5-0282-4710-a058-4de3303bd653.png)

- 配置文件
host随便写，把hostname后面写上ip地址，user写操作系统的用户名
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-ea3b7546-4797-4424-84fd-52085e1ebd58.png)
- 设置
打开VS Code设置，搜索Show Login Terminal，勾选下方"Always reveal the SSH login terminal"，记得一定要操作这一步，不然会一直提示报错。
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-c857ebd7-8ea5-4304-8883-492cb7de763c.png)
- 打开远程窗口
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-c54ea7ca-23ae-49d9-b99d-271ddecf5940.png)
过程中需要输入root的密码。

- 左下角可以看到远程连接
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-55a942f4-dcd3-4cc8-855b-f4ff28663c72.png)
- 打开远程文件夹
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-676c9c95-b097-42cf-a869-399b6d94865b.png)
- 要求输入密码
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-6840917d-6102-4026-8277-e9f5a77219de.png)
输入密码后，远程成功
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-c2c243e1-80fa-4057-aeb1-1a2b396e1c87.png)
### 5.3.3 开始使用远程环境进行开发
- 新建python开发文件open11.py
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-a1446223-10a2-46fc-8a1d-aaf1541251ec.png)
- 这样就可以开始开发了。
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-9f22d286-2123-4f33-85e5-533eee4e24e1.png)
- 点击执行
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221112-877c5d1d-b718-47ee-a84b-58108834e423.png)
结果输出正确。
- 配置完成。
# 总结
- 如果使用pip安装psycopg2，密码加密方式只能使用MD5方式。不然PyCharm连接不上openGauss。
- Visual Studio Cod免费使用，需要自己安装对应的插件，在做远程连接centos时，可以做成免密登录，网友自行百度操作。
- PyCharm想用远程连接centos，需要收费版本。
- 使用pip安装psycopg2的包也是可以连接到openGauss的。