---
title: '使用BenchmarkSQL压测openGauss'

date: '2021-02-05'

category: 'blog'
tags: ['使用BenchmarkSQL压测openGauss']

archives: '2021-02'

author: '金立新'

summary: '使用BenchmarkSQL压测openGauss'

img: '/zh/blogs/jinlixin/title/img5.png'

times: '12:30'
---

# 使用 BenchmarkSQL 压测 openGauss<a name="ZH-CN_TOPIC_0000001116618879"></a>

## 安装配置 JDK<a name="section85726294162"></a>

1.  官方网站下载 JDK：https://www.oracle.com/technetwork/java/javase/downloads/index.html
2.  配置 JDK 环境解压到 JDK 到指定路径。

    ```
    # 解压到JDK到指定路径
    tar -xvf jdk-8u231-linux-x64.tar.gz -C /usr/local
    # 配置系统环境变量
    /etc/profile末尾添加内容如下：
    export JAVA_HOME=/usr/local/jdk1.8.0_231
    export CLASSPATH=$JAVA_HOME/lib/
    export PATH=$PATH:$JAVA_HOME/bin
    # 配置成功测试
    source /etc/profile
    java -version
    ```

## 安装配置 R 语言环境<a name="section5654174518182"></a>

1.  下载 R。

    ```
    wget http://lib.stat.cmu.edu/R/CRAN/src/base/R-3/R-3.0.0.tar.gz
    ```

2.  编译安装 R。

    ```
    a、解压到R到指定路径
    tar -xvf R-3.0.0.tar.gz /opt/software/R
    编译安装R
    cd /opt/software/R
    ./configure --prefix=/usr/R --with-pcre1
    b、配置系统环境变量
    /etc/profile末尾添加内容如下：
    export R_HOME=/usr/R/
    export PATH=$PATH:$R_HOME/bin
    c、配置成功测试
    source /etc/profile
    R -version
    ```

    <!-- > <img src='public_sys-resources/icon-note.gif'>  -->

    **说明：**

    > 编译 R 语言之前需要安装 gcc，gcc-gfortran，libXt-devel 等包，yum 安装需要配置如下 yum 源：否者会导致依赖缺失。内网无 yum 环境建议使用源码安装，需要安装的依赖包较少。

    - base: mirrors.ustc.edu.cn
    - centos-sclo-rh: mirrors.aliyun.com
    - epel: mirrors.ustc.edu.cn
    - extras: mirrors.aliyun.com
    - updates: mirrors.aliyun.com

## 安装 ant<a name="section1516041013322"></a>

1.  官方网站下载 Ant 工程：

    http://ant.apache.org/

2.  配置安装解压 Ant 到指定路径。

    ```
    tar -xvf apache-ant-1.10.7-bin.tar.gz -C /usr/local/ant
    ```

3.  配置环境变量与 JDK 配置方式相同，/etc/profile 末尾添加内容如下：

    ```
    export ANT_HOME=/usr/local/ant
    export PATH=$PATH:$ANT_HOME/bin
    ```

4.  配置测试。

    ```
    source /etc/profile
    ant -version
    ```

## 配置使用 BenchmarkSQL<a name="section9177114113513"></a>

1.  下载官方工程（当前最新版本为 5.0）：

    https://sourceforge.net/projects/benchmarksql/

2.  解压到合适的目录。

    ```
    unzip benchmarksql-5.0.zip
    ```

3.  使用 Ant 进行工程编译。

    ```
    cd benchmarksql-5.0/ //进入benchmarksql根目录
    ant //执行ant命令，ant工具通过根目录下build.xml文件对源码进行编译并打包到/dist目录下
    ```

4.  配置 BenchmarkSQL。

    ```
    a、配置props文件
    进入run目录，会看到多个不同后缀名的props文件，不同的文件配置不同的数据库，由于我们需要压测postgresql和openGauss，openGauss兼容postgresql，需要配置props.pg文件。cp props.pg props.opengauss在配置文件中需要修改的包括conn,user, password(这三项用于连接指定的数据库，因此需要提前在postgresql中创建好对应的DB以及用户) 。配置项具体如下：
    db=postgres
    driver=org.postgresql.Driver
    conn=jdbc:postgresql://192.168.1.155:5432/tpcc
    user=
    password= //以上为数据库连接信息
    warehouses=100 //数据仓库数量，每个仓库大概为100M，数据量50W。压测并发数量最多为该值的10倍，需要提前规划好
    loadWorkers=8 //导入数据时，同时导入数据的进程数量
    terminals=1000 //并发数，不超过造数时warehouses值的10倍
    runMins=3 //压测时间，分钟为单位
    terminalWarehouseFixed=true //指定每个终端是否绑定固定数仓，值为布尔型
    resultDirectory=my_result_%tY-%tm-%td_%tH%tM%tS //报告路径格式
    b、在opengauss社区下载与openGauss实例版本相匹配的的官方驱动，放入benchmarksql/lib/postgres目录下，替换postgresql的驱动，使用官方驱动适配性更好，表现更好。
    ```

5.  运行测试。

    ```
    cd run //进入run目录
    ./runDatabaseBuild.sh props.opengauss //进行测试库创建，数据导入
    ./runBenchmark.sh props.opengauss //执行配置好的测试
    ./runDatabaseDestroy.sh props.opengauss //清理数据
    ```

6.  生成报告。

    测试结束后，run 目录下会生成一个新目录，它的命名格式为 my_result\_%tY-%tm-%td\_%tH%tM%tS。

    使用 generateReport.sh 脚本创建具有图形的 HTML 文件：./generateReport.sh my_result_2020-11-02_221047 随后会在 my_result\_\* 目录下生成一个 html 文件和数张图片，下载到本地，在浏览器中打开 report.html，可以看到 tpmc 的曲线和系统硬件监控信息。
