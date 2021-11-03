+++

title =  "openGauss2.0.1的安装步骤" 

date = "2021-10-21" 

tags = [ "openGauss2.0.1的安装步骤"] 

archives = "2021-10" 

author = "吴毅" 

summary = "openGauss2.0.1的安装步骤"

img = "/zh/post/July/title/img5.png" 

times = "12:30"

+++

# openGauss2.0.1的安装步骤<a name="ZH-CN_TOPIC_0000001200514123"></a>



openGauss的安装，测试环境：操作系统版本：CentOS7.6  x86\_64，硬件配置：2C4G  1台，服务器名称：kafka1.wuyi.com， IP地址: 172.16.32.5。

-   1 关闭防火墙和关闭SELinux

    ```
    systemctl disable firewalld
    
    systemctl stop firewalld
    
    sed -i s/SELINUX=.*/SELINUX=disabled/ /etc/selinux/config
    
    cat /etc/selinux/config
    
    getenforce
    
    setenforce 0
    
    getenforce
    ```

-   2 设置操作系统字符集编码和设置操作系统时区

    ```
    echo $LANG
    ```


-   3 关闭SWAP分区 \[对于2G内存的设备，建议待安装完毕后再打开SWAP以间接 “扩容内存容量”\]
-   4 配置SSH服务，关闭Banner，允许root远程登录

    ```
    sed -i '/Banner/s/^/#/'  /etc/ssh/sshd_config
    
    sed -i '/PermitRootLogin/s/^/#/'  /etc/ssh/sshd_config
    
    echo -e "\n" >> /etc/ssh/sshd_config
    
    echo "Banner none " >> /etc/ssh/sshd_config
    
    echo "PermitRootLogin yes" >> /etc/ssh/sshd_config
    
    cat /etc/ssh/sshd_config |grep -v ^#|grep -E 'PermitRoot|Banner'
    ```

-   5 配置YUM源、安装依赖包、修改默认Python3版本

    ```
    mkdir /etc/yum.repos.d/bak
    
    mv /etc/yum.repos.d/*.repo  /etc/yum.repos.d/bak/                            */
    
    wget -O /etc/yum.repos.d/CentOS-Base.repo https://repo.huaweicloud.com/repository/conf/CentOS-7-reg.repo
    
    yum clean all
    
    yum install -y bzip2 python3
    
    yum install -y libaio-devel flex bison ncurses-devel glibc-devel patch redhat-lsb-core readline-devel net-tools tar
    
    mv /usr/bin/python  /usr/bin/python2_bak
    
    ln -s /usr/bin/python3 /usr/bin/python
    
    python -V
    ```

-   6 配置 sysctl.conf 和 performance.sh

    ```
    cat >> /etc/sysctl.conf << EOF
    
    net.ipv4.tcp_retries1 = 5
    
    net.ipv4.tcp_syn_retries = 5
    
    net.sctp.path_max_retrans = 10
    
    net.sctp.max_init_retransmits = 10
    
    EOF
    
    sysctl -p
    ```

-   7 配置资源限制

    ```
    echo "* soft stack 3072" >> /etc/security/limits.conf
    
    echo "* hard stack 3072" >> /etc/security/limits.conf
    
    echo "* soft nofile 1000000" >> /etc/security/limits.conf
    
    echo "* hard nofile 1000000" >> /etc/security/limits.conf
    
    echo "* soft nproc unlimited" >> /etc/security/limits.d/90-nproc.conf
    
    tail -n 4 /etc/security/limits.conf
    
    tail -n 1 /etc/security/limits.d/90-nproc.conf
    ```

-   8 关闭透明大页\[Only for CentOS\]

    ```
    cat >>/etc/rc.d/rc.local<<EOF
    
    if test -f /sys/kernel/mm/transparent_hugepage/enabled; then
    
       echo never > /sys/kernel/mm/transparent_hugepage/enabled
    
    fi
    
    if test -f /sys/kernel/mm/transparent_hugepage/defrag; then
    
       echo never > /sys/kernel/mm/transparent_hugepage/defrag
    
    fi
    
    EOF
    
    chmod +x /etc/rc.d/rc.local
    
    /usr/bin/sh /etc/rc.d/rc.local
    
    cat /sys/kernel/mm/transparent_hugepage/enabled
    
    cat /sys/kernel/mm/transparent_hugepage/defrag
    
    *************
    ```

-   9 下载openGauss软件包

    ```
    mkdir -p /soft/
    
    cd /soft/
    
    wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/2.0.1/x86/openGauss-2.0.1-CentOS-64bit-all.tar.gz
    
    # /soft/clusterconfig.xml
    ```

-   10 配置XML文件

    ```
    cat >> /soft/clusterconfig.xml <<EOF
    
    <?xml version="1.0" encoding="UTF-8"?>
    
    <ROOT>
    
        <!-- openGauss整体信息 -->
    
        <CLUSTER>
    
            <PARAM name="clusterName" value="dbCluster" />
    
            <PARAM name="nodeNames" value="kafka1.wuyi.com" />
    
            <PARAM name="backIp1s" value="172.16.32.5"/>
    
            <PARAM name="gaussdbAppPath" value="/gaussdb/app" />
    
            <PARAM name="gaussdbLogPath" value="/gaussdb/log" />
    
            <PARAM name="gaussdbToolPath" value="/gaussdb/om" />
    
            <PARAM name="corePath" value="/gaussdb/corefile"/>
    
            <PARAM name="clusterType" value="single-inst"/>
    
        </CLUSTER>
    
        <!-- 每台服务器上的节点部署信息 -->
    
        <DEVICELIST>
    
            <!-- node1上的节点部署信息 -->
    
            <DEVICE sn="1000001">
    
                <PARAM name="name" value="kafka1.wuyi.com"/>
    
                <PARAM name="azName" value="AZ1"/>
    
                <PARAM name="azPriority" value="1"/>
    
                <!-- 如果服务器只有一个网卡可用，将backIP1和sshIP1配置成同一个IP -->
    
                <PARAM name="backIp1" value="172.16.32.5"/>
    
                <PARAM name="sshIp1" value="172.16.32.5"/>
    
    
    
                 <!--dbnode-->
    
                 <PARAM name="dataNum" value="1"/>
    
                 <PARAM name="dataPortBase" value="26000"/>
    
                 <PARAM name="dataNode1" value="/gaussdb/data/db1"/>
    
            </DEVICE>
    
        </DEVICELIST>
    
    </ROOT>
    
    EOF
    
    cat /soft/clusterconfig.xml
    ```

-   11 解压安装包并修改目录权限

    ```
    cd /soft
    
    tar -zxvf *all.tar.gz
    
    tar -zxvf *om.tar.gz
    
    chmod -R 777 *
    ```

-   12 执行 gs\_preinstall

    ```
    python script/gs_preinstall -U omm -G dbgrp -X clusterconfig.xml
    
    ***???***
    ```

-   13 检查预安装环境

    ```
    /soft/script/gs_checkos -i A -h kafka1.wuyi.com --detail
    ```


-   14 执行 gs\_install

    ```
    touch /home/omm/install_db
    
    cat >> /home/omm/install_db <<EOF
    
    source ~/.bashrc
    
    gs_install -X  /soft/clusterconfig.xml --gsinit-parameter="--encoding=UTF8"  --dn-guc="max_process_memory=3GB" --dn-guc="shared_buffers=128MB" --dn-guc="cstore_buffers=16MB"
    
    EOF
    
    chown -R omm:dbgrp /home/omm/install_db
    
    su - omm -c "sh /home/omm/install_db"
    
    su - omm
    
    gsql -d postgres -p 26000 -r
    gs_om -t status --detail
    ```


-   15 如果不想使用openGauss，要卸载：

    gs\_uninstall --delete-data

    -   一键式环境清理

        在openGauss卸载完成后，如果不需要在环境上重新部署openGauss，可以运行脚本

        gs\_postuninstall对openGauss服务器上环境信息做清理。openGauss环境清理是对环

        境准备脚本gs\_preinstall所做设置的清理。

    -   前提条件

        \(1\)openGauss卸载执行成功。

        \(2\)只能使用root用户执行gs\_postuninstall命令。

        以root用户登录openGauss服务器。进入解压缩的目录：/soft/script路径下。

        ./gs\_postuninstall -U omm -X /soft /clusterconfig.xml --delete-user --delete-group



