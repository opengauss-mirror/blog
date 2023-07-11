+++

title = "使用JDBC连接数据库提示“未找到命令”怎么办" 

date = "2023-07-11" 

tags = ["使用JDBC连接数据库提示“未找到命令”怎么办"] 

archives = "2023-07" 

author = "张翠娉" 

summary = "使用JDBC连接数据库提示“未找到命令”怎么办"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "10:20"

+++

# 使用JDBC连接数据库提示“未找到命令”怎么办？



## 背景介绍

在使用jdbc连接数据库时，root用户下执行java -version可显示java版本，普通用户omm2下提示“未找到命令”。

## 报错信息

```bash
[root@kylinos jdbc]# java -version
openjdk version "1.8.0_312"
OpenJDK Runtime Environment BiSheng (build 1.8.0_312-b12)
OpenJDK 64-Bit Server VM BiSheng (build 25.312-b12, mixed mode)

[omm2@kylinos ~]$ java -version
-bash: java：未找到命令
```

## 问题分析

java环境变量配置不正确。缺少`export CLASSPATH=.:$JAVA_HOME/lib:$JAVA_HOME/lib`数据。

```bash
[root@kylinos ~]$ more ~/.bashrc
# Source default setting
[ -f /etc/bashrc ] && . /etc/bashrc

# User environment PATH
PATH="$HOME/.local/bin:$HOME/bin:$PATH"
export PATH
[ -f /home/omm2/.ptk_mogdb_env ] && . /home/omm2/.ptk_mogdb_env # ptk add

# Source global definitions
if [ -f /etc/bashrc ]; then
          . /etc/bashrc
fi
export JAVA_HOME=/data/mogdb1/java/jdk-1.8/jdk
export PATH=$PATH:$JAVA_HOME/bin
export PATH=/data/dbmind:$PATH
```

**注意**：必须确保环境变量中有如下三条数据，同时java包不能位于root用户下。

```bash
export JAVA_HOME=/data/mogdb1/java/jdk-1.8/jdk
export PATH=$PATH:$JAVA_HOME/bin
export CLASSPATH=.:$JAVA_HOME/lib:$JAVA_HOME/lib
```

## 解决办法

1. 打开环境变量配置文件，增加`export CLASSPATH=.:$JAVA_HOME/lib:$JAVA_HOME/lib`。

   ```
   vi ~/.bashrc
   ```

2. 执行如下命令使环境变量生效。

   ```
   source ~/.bashrc
   ```

3. 赋予omm2用户/data/mogdb1/java/jdk-1.8/jdk目录权限。

   ```
   chown -R omm2 /data/mogdb1/java/jdk-1.8/jdk
   ```

4. 切换到omm2普通用户下，打开环境变量配置文件，同样增加`export CLASSPATH=.:$JAVA_HOME/lib:$JAVA_HOME/lib`，并执行`source ~/.bashrc`使环境变量生效。

5. 在omm2用户下执行`java -version` ，java版本正确显示。

   ```
   [omm2@kylinos ~]$ java -version
   openjdk version "1.8.0_312"
   OpenJDK Runtime Environment BiSheng (build 1.8.0_312-b12)
   OpenJDK 64-Bit Server VM BiSheng (build 25.312-b12, mixed mode)
   ```

