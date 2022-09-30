+++

title = "奇思妙想——通过Go语言自制安装openGauss二进制程序"

date = "2022-09-29"

tags = ["openGauss技术文章征集", "Go", "OM"]

archives = "2022-09"

author = "李宏达"

summary = "奇思妙想——通过Go语言自制安装openGauss二进制程序"

img = "/zh/post/lihongda/title/title.png"

times = "13:00"

+++


# 前言
---
**巧妙利用go语言自制openGauss安装二进制程序，经测试15s即可安装完成**


# 一、安装go语言环境
## 1. 下载解压go

```s
[root@node1 ~]# wget https://golang.google.cn/dl/go1.19.1.linux-amd64.tar.gz
```

```s
[root@node1 ~]# tar -zxvf go1.19.1.linux-amd64.tar.gz -C /usr/local
```

## 2. 添加环境变量
```s
export PATH=$PATH:/usr/local/go/bin
```
## 3. 测试运行


```go
package main

import fmt

func main(){

fmt.Println("hello,world！")

}
```


```s
[root@node1 ~]# go run test.go
hello,world！
```


# 二、 openGauss安装 **（15s安装完成）**


## 1. 源代码
```s
[root@node1 ~]# cat gaussdb.go
package main

import (
	"fmt"
	"io/ioutil"
	"os/exec"
)

func main() {
	cmd := exec.Command("/bin/bash", "-c", `useradd omm ;echo "Enmo@123" | passwd --stdin omm > /dev/null ;mkdir -p /opt/mogdb/software;chown -R omm:omm /opt/;tar -xf  openGauss-3.1.0-CentOS-64bit.tar.bz2 -C /opt/mogdb/software; su - omm -c "echo 'export GAUSSHOME=/opt/mogdb/software'  >> /home/omm/.bashrc ;echo 'export PATH=\$GAUSSHOME/bin:\$PATH' >> /home/omm/.bashrc ;echo 'export LD_LIBRARY_PATH=\$GAUSSHOME/lib:\$LD_LIBRARY_PATH' >> /home/omm/.bashrc;source /home/omm/.bashrc;gs_initdb --pgdata=/opt/mogdb/data --nodename=primary --pwpasswd=Enmo@123 --encoding=UTF-8 --locale=en_US.UTF-8 > /dev/null ;echo \"port=26000\" >> /opt/mogdb/data/postgresql.conf;echo \"listen_addresses = '0.0.0.0'\" >> /opt/mogdb/data/postgresql.conf;echo \"password_encryption_type = 0\" >> /opt/mogdb/data/postgresql.conf;echo \"log_directory = 'pg_log'\" >> /opt/mogdb/data/postgresql.conf;echo \"remote_read_mode=non_authentication\" >> /opt/mogdb/data/postgresql.conf;echo \"host all all 0.0.0.0/0 md5\" >> /opt/mogdb/data/pg_hba.conf;gs_ctl start -D /opt/mogdb/data > /dev/null ;gsql -d postgres -p 26000 -c'select version();select pg_postmaster_start_time();';echo -e 'data_user is omm ! \ndata_port is 26000 ! \ndata_path is /opt/mogdb/data ! \ndata_soft is /opt/mogdb/software !'"`)
//	cmd := exec.Command("/bin/bash", "-c", `df -h;ls`)
	//创建获取命令输出管道
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		fmt.Printf("Error:can not obtain stdout pipe for command:%s\n", err)
		return
	}

	//执行命令
	if err := cmd.Start(); err != nil {
		fmt.Println("Error:The command is err,", err)
		return
	}

	//读取所有输出
	bytes, err := ioutil.ReadAll(stdout)
	if err != nil {
		fmt.Println("ReadAll Stdout:", err.Error())
		return
	}

	if err := cmd.Wait(); err != nil {
		fmt.Println("wait:", err.Error())
		return
	}
	fmt.Printf("stdout:\n\n %s", bytes)
}
```


## 2. go run 测试运行

- 准备安装包
```s
[root@node1 ~]# ls openGauss-3.1.0-CentOS-64bit.tar.bz2 gaussdb.go
gaussdb.go  openGauss-3.1.0-CentOS-64bit.tar.bz2
```


- go run

```s
[root@node1 ~]# go run gaussdb.go
stdout:

                                                                        version
------------------------------------------------------------------------------------------------------------------------------------------------------
 (openGauss 3.1.0 build 2c0ccaf9) compiled at 2022-09-25 19:32:58 commit 0 last mr   on x86_64-unknown-linux-gnu, compiled by g++ (GCC) 7.3.0, 64-bit
(1 row)

   pg_postmaster_start_time
-------------------------------
 2022-09-28 13:38:28.550462+08
(1 row)

data_user is omm !
data_port is 26000 !
data_path is /opt/mogdb/data !
data_soft is /opt/mogdb/software !
```

- 连接测试
```s
[root@node1 ~]# su - omm
Last login: Wed Sep 28 13:39:38 CST 2022
[omm@node1 ~]$ gsql -d postgres -p26000 -r
gsql ((openGauss 3.1.0 build 2c0ccaf9) compiled at 2022-09-25 19:32:58 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=# select version();
                                                                       version
------------------------------------------------------------------------------------------------------------------------------------------------------
 (openGauss 3.1.0 build 2c0ccaf9) compiled at 2022-09-25 19:32:58 commit 0 last mr   on x86_64-unknown-linux-gnu, compiled by g++ (GCC) 7.3.0, 64-bit
(1 row)

openGauss=# \q
[omm@node1 ~]$ logout
```

- go build 二进制


```s
[root@node1 ~]# go build gaussdb.go
[root@node1 ~]# ls gaussdb openGauss-3.1.0-CentOS-64bit.tar.bz2 gaussdb.go
gaussdb  gaussdb.go  openGauss-3.1.0-CentOS-64bit.tar.bz2
```

- 清理环境

```s
[root@node1 ~]# cat a.sh
pkill -9 gaussdb
rm -rf /opt/mogdb/*
userdel -r omm
[root@node1 ~]# sh a.sh
```

- 安装
```s
[root@node1 ~]# date;./gaussdb;date
Wed Sep 28 13:53:12 CST 2022
stdout:

                                                                        version
------------------------------------------------------------------------------------------------------------------------------------------------------
 (openGauss 3.1.0 build 2c0ccaf9) compiled at 2022-09-25 19:32:58 commit 0 last mr   on x86_64-unknown-linux-gnu, compiled by g++ (GCC) 7.3.0, 64-bit
(1 row)

   pg_postmaster_start_time
-------------------------------
 2022-09-28 13:53:27.034021+08
(1 row)

data_user is omm !
data_port is 26000 !
data_path is /opt/mogdb/data !
data_soft is /opt/mogdb/software !
Wed Sep 28 13:53:27 CST 2022

```

- 连接测试

```s
[root@node1 ~]# su - omm
Last login: Wed Sep 28 13:53:19 CST 2022
[omm@node1 ~]$ gsql -d postgres -p26000 -r
gsql ((openGauss 3.1.0 build 2c0ccaf9) compiled at 2022-09-25 19:32:58 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=# select version();
                                                                       version
------------------------------------------------------------------------------------------------------------------------------------------------------
 (openGauss 3.1.0 build 2c0ccaf9) compiled at 2022-09-25 19:32:58 commit 0 last mr   on x86_64-unknown-linux-gnu, compiled by g++ (GCC) 7.3.0, 64-bit
(1 row)

openGauss=# \q
```

