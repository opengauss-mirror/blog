+++

title =  "openGauss安装与JDBC连接（企业版）" 

date = "2021-12-09" 

tags = [ "openGauss安装与JDBC连接（企业版）"] 

archives = "2021-12" 

author = "awei" 

summary = "openGauss安装与JDBC连接（企业版）"

img = "/zh/post/July/title/img8.png" 

times = "12:30"

+++

# openGauss安装与JDBC连接（企业版）<a name="ZH-CN_TOPIC_0000001187407244"></a>

## 一、 openGauss安装（企业版）<a name="section1471711422815"></a>

**1. 获取安装包**

-   **1.1. 从openGauss开源社区下载对应平台的安装包。**

    通过[https://opengauss.org/zh/download.html](https://opengauss.org/zh/download.html)  登录openGauss开源社区，选择 2.0.0版本对应平台企业版安装包（openGauss-2.0.0-CentOS-64bit-all.tar.gz）。 单击“下载”。


-   **1.2. 检查安装包。**

    解压安装包，检查安装目录及文件是否齐全。在安装包所在目录执行以下命令：

    ```
    tar -zxvf openGauss-2.0.0-CentOS-64bit-all.tar.gz ls -1b
    ```

    执行ls命令，显示类似如下信息：

    ![](figures/zh-cn_image_0000001232608885.png)

    ----结束


**2. 修改操作系统配置**

-   **2.1. 修改文件**

    如果安装的不是Centos7.6，则要修改/etc/rehat-release文件，将 CentOS Linux release 7.9.2003 \(Core\)修改为CentOS Linux release 7.6 \(Core\)

    ![](figures/zh-cn_image_0000001232808939.png)

-   **2.2. 关闭操作系统防火墙**

    **步骤1 **修改/etc/selinux/config文件中的“SELINUX”值为“disabled”。 使用VIM打开config文件。 vim /etc/selinux/config 修改“SELINUX”的值“disabled”，执行:wq保存并退出修改。 SELINUX=disabled![](figures/zh-cn_image_0000001186929314.png)

    **步骤2**  重新启动操作系统。

    ```
    reboot
    ```

    **步骤3**  检查防火墙是否关闭。

    ```
    systemctl status firewalld
    ```

    若防火墙状态显示为active \(running\)，则表示防火墙未关闭，请执行步骤4； 若防火墙状态显示为inactive \(dead\)，则无需再关闭防火墙。

    **步骤4 **关闭防火墙。

    systemctl disable firewalld.service systemctl stop firewalld.service

    ![](figures/zh-cn_image_0000001232727451.png)

    **步骤5**  在其他主机上重复步骤1到步骤4。

    ----结束

-   **2.3. 设置字符集参数**

    将各数据库节点的字符集设置为相同的字符集，可以在/etc/profile文件中添加"export LANG=XXX"（XXX为Unicode编码）。 vim /etc/profile


-   **2.4. 设置时区和时间**

    在各数据库节点上，确保时区和时间一致。

    **步骤1**  执行如下命令检查各数据库节点时间和时区是否一致。如果不一致，请执行步骤2\~步骤3。

    date

    **步骤2**  使用如下命令将各数据库节点/usr/share/zoneinfo/目录下的时区文件拷贝为/etc/localtime文件。

    cp /usr/share/zoneinfo/$地区/$时区/etc/localtime 说明: $地区/$时区为需要设置时区的信息，例如：Asia/Shanghai。

    **步骤3**  使用date -s命令将各数据库节点的时间设置为统一时间，举例如下。

    ```
    date -s "Sat Sep 27 16:00:07 CST 2020"
    ```

    ----结束

-   **2.5. 设置网卡MTU 值**

    将各数据库节点的网卡MTU值设置为相同大小。

    **步骤1**  执行如下命令查询服务器的网卡名称

    ifconfig 如下图所示：

    ![](figures/zh-cn_image_0000001187247856.png)

    **步骤2 **使用如下命令将各数据库节点的网卡MTU值设置为相同大小。 对于X86，MTU值推荐1500；对于ARM，MTU值推荐8192。

    ifconfig 网卡名称 mtu mtu值

    ----结束


**3. 安装openGauss**

-   **3.1. 创建XML配置文件**

    安装openGauss前需要创建cluster\_config.xml文件。cluster\_config.xml文件包含部署 openGauss的服务器信息、安装路径、IP地址以及端口号等。用于告知openGauss如何 部署。用户需根据不同场景配置对应的XML文件。

    配置数据库节点名称时，请通过hostname命令获取数据库节点的主机名称。

    ![](figures/zh-cn_image_0000001187407766.png)

    单节点配置文件如下：

    ![](figures/zh-cn_image_0000001232487371.png)

-   **3.2.初始化安装环境**
-   **3.2.1. 准备安装用户及环境**

    **步骤1**  以root用户登录待安装openGauss的任意主机，并按规划创建存放安装包的目录。

    ![](figures/zh-cn_image_0000001187089296.png)

    **步骤2**  将安装包“openGauss-2.0.0-CentOS-64bit-all.tar.gz”和配置文件“cluster\_config.xml”都上传至上一步所创建的目录中。

    **步骤3**  在安装包所在的目录下，解压安装包openGauss-2.0.0-CentOS-64bit-all.tar.gz。安装包解压后，会有OM安装包和Server安装包。继续解压OM安装包，会在/opt/software/openGauss路径下自动生成script子目录，并且在script目录下生成gs\_preinstall等各种OM工具脚本。

    **步骤4**  进入到工具脚本存放目录下。 cd /opt/software/openGauss/script

    **步骤5**  为确保成功安装，执行命令检查 hostname 与 /etc/hostname 是否一致。 hostname cat /etc/hostname

    ![](figures/zh-cn_image_0000001232608887.png)

    **步骤6**  使用gs\_preinstall需要python3.6的环境，一般自带的是python2.7。

    安装CentOS开发工具 【用于允许您从源代码构建和编译软件】 sudo yum -y “groupinstall development”

    下载epel

    sudo yum install epel-release

    安装python3

    sudo yum install python36

    ![](figures/zh-cn_image_0000001232808941.png)

    更改默认python

    ![](figures/zh-cn_image_0000001186929316.png)

    **步骤7**  使用gs\_preinstall准备好安装环境

    采用交互模式执行前置，并在执行过程中自动创建root用户互信和openGauss用 户互信： ./gs\_preinstall -U omm -G dbgrp -X /opt/software/openGauss/cluster\_config.xml

    ![](figures/zh-cn_image_0000001232727453.png)

    ![](figures/zh-cn_image_0000001187247858.png)


-   **3.2.2. 建立互信（使用脚本建立互信）**

    **步骤1**  创建一个执行互信脚本所需要的输入文本，并在此文件中添加openGauss中所有主机 IP。 vim hostfile

    **步骤2**  以需要创建互信的用户执行下面脚本建立互信。 ./gs\_sshexkey -f /opt/software/hostfile -W wangjingwei1

    运行成功截图如下

    ![](figures/zh-cn_image_0000001187407768.png)

-   **3.3.执行安装**

    **步骤1 **登录到openGauss的主机，并切换到omm用户。

    ```
    su - omm
    ```

    **步骤2**  使用gs\_install安装openGauss。

    gs\_install -X /opt/software/openGauss/cluster\_config.xml 在执行过程中，用户需根据提示输入数据库用户的密码，密码应具有一定的复杂度.![](figures/zh-cn_image_0000001232487373.png)![](figures/zh-cn_image_0000001187089298.png)

    **步骤3**  安装执行成功之后，需要手动删除主机root用户的互信，即删除openGauss数据库各 节点上的互信文件。 rm -rf \~/.ssh

    安装完成

-   4. 安装验证

    **步骤1**  以omm用户身份登录服务器。

    **步骤2**  执行如下命令检查数据库状态是否正常，“cluster\_state ”显示“Normal”表示数据 库可正常使用。 gs\_om -t status

    **步骤3**  数据库安装完成后，默认生成名称为postgres的数据库。第一次连接数据库时可以连接到此数据库。其中postgres为需要连接的数据库名称，26000为数据库主节点的端口号，即XML配置.文件中的dataPortBase的值。请根据实际情况替换。

    gsql -d postgres -p 26000 连接成功后，系统显示类似如下信息表示数据库连接成功。 gsql \(\(openGauss x.x.x build 290d125f\) compiled at 2021-03-08 02:59:43 commit 2143 last mr 131 Non-SSL connection \(SSL connection is recommended when requiring high-security\) Type "help" for help.

    ![](figures/zh-cn_image_0000001232608889.png)

    **步骤4**  建立表，并插入内容进行查询

    ![](figures/zh-cn_image_0000001232808943.png)

    ![](figures/zh-cn_image_0000001186929318.png)


## 二、使用jdbc连接数据库<a name="section1480597163516"></a>

-   **1. 确认连接信息**

    **步骤1**  以操作系统用户omm登录数据库主节点。

    **步骤2**  使用“gs\_om -t status --detail”命令查询openGauss各实例情况。

    ![](figures/zh-cn_image_0000001232727455.png)

-   **2. 配置服务端远程连接**

    **步骤1**  以操作系统用户omm登录数据库主节点。

    **步骤2**  配置客户端认证方式

    需先本地连接数据库，并在数据库中使用如下语句建立“jack”用户：

    ```
    postgres=# CREATE USER jack PASSWORD 'Test@123';
    ```

    允许客户端以“jack”用户连接到本机，此处远程连接禁止使用

    “omm”用户（即数据库初始化用户）。下面示例中配置允许IP地址为10.27.1.209的客户端访问本机。

    ![](figures/zh-cn_image_0000001187247860.png)

    **步骤3**  配置listen\_addresses，listen\_addresses即远程客户端连接使用的数据库主节点ip或者主机名。

    使用如下命令查看数据库主节点目前的listen\_addresses配置。

    ```
    gs_guc check -I all -c "listen_addresses"
    ```

    使用如下命令把要添加的IP追加到listen\_addresses后面，多个配置项之间用英文逗号分隔。例如，追加IP地址10.11.12.13。

    ```
    gs_guc set -I all -c"listen_addresses='localhost,192.168.0.100,10.11.12.13'"
    ```

    **步骤4**  执行如下命令重启openGauss。

    ```
    gs_om -t stop && gs_om -t start
    ```

    ![](figures/zh-cn_image_0000001187407770.png)

    **3. JDBC 包、驱动类和环境类**

    在openGauss官网下载JDBC包，openGauss-2.0.0-JDBC.tar.gz，解压获得驱动jar包postgresql.jar。

    在创建数据库连接之前，需要加载数据库驱动类“org.postgresql.Driver”。

    终端输入“java -version”，查看JDK版本，确认为JDK1.8版本。

    ![](figures/zh-cn_image_0000001232487375.png)

    **4. 驱动加载**

    在代码中创建连接之前任意位置隐含装载：Class.forName\("org.postgresql.Driver"\);

    在windows下运行代码进行连接时，使用eclipse装载驱动即可。

    ![](figures/zh-cn_image_0000001187089300.png)

    在centos系统下连接数据库时，要将postgresql.jar驱动包设置到java的classpath环境变量中。

    将postgresql.jar类库文件拷贝到...\\Java\\jdk1.7.0\\jre\\lib\\ext目录下。（这个路径根据JDK的版本和安装路径确定，下同）

    将postgresql.jar类库文件拷贝到...\\Java\\jre7\\lib\\ext目录下（ 最好是，只要是jre文件夹，都复制一个postgresql.jar到jre7\\lib\\ext里去）

    **5. 连接数据库**

    JDBC提供了三个方法，用于创建数据库连接。

    DriverManager.getConnection\(String url\)

    DriverManager.getConnection\(String url, Properties info\);

    DriverManager.getConnection\(String url, String user, String password\);

    连接数据库代码如下：

    ![](figures/zh-cn_image_0000001232608893.png)

    ![](figures/zh-cn_image_0000001232808945.png)

    运行截图

    ![](figures/zh-cn_image_0000001186929320.png)

    连接数据库并在表中插入数据

    连接时会以某一用户访问某一表，要先在数据库中对该用户进行授权。

    ![](figures/zh-cn_image_0000001232727457.png)

    代码如下：

    ![](figures/zh-cn_image_0000001187247862.png)

    运行截图：

    ![](figures/zh-cn_image_0000001187407772.png)

    查询此表进行验证：

    ![](figures/zh-cn_image_0000001232487377.png)


## 三、 遇到的问题<a name="section785613287388"></a>

刚开始安装的极简版，发现有一个命令使用不了，后来改安装企业版就没遇到这个问题。

centos版本问题：在网上没有找到centos7.6，只找到7.9，运行时会报错，要修改/etc/rehat-release文件，将 CentOS Linux release 7.9.2003 \(Core\)修改为CentOS Linux release 7.6 \(Core\)。

安装python3

安装CentOS开发工具 【用于允许您从源代码构建和编译软件】 sudo yum -y “groupinstall development”

下载epel sudo yum install epel-release

安装python3 sudo yum install python36

更改默认python

![](figures/zh-cn_image_0000001187089302.png)

连接问题

连接windows主机时，远程连接也配置了，互信也建立了，总是报连接错误问题。后来选择连接虚拟机，连接虚拟机要先配jdk，直接使用yum安装比较方便：

搜索jdk安装包

\# yum search java|grep jdk

下载jdk1.8，下载后默认目录为：/uer/lib/jvm/

\# yum install java-1.8.0-openjdk

验证安装

后面要进行驱动加载，不加载的话使用不了下载的文件。要将postgresql.jar驱动包设置到java的classpath环境变量中。

将postgresql.jar类库文件拷贝到...\\Java\\jdk1.7.0\\jre\\lib\\ext目录下。（这个路径根据JDK的版本和安装路径确定，下同）

将postgresql.jar类库文件拷贝到...\\Java\\jre7\\lib\\ext目录下（ 最好是，只要是jre文件夹，都复制一个postgresql.jar到jre7\\lib\\

