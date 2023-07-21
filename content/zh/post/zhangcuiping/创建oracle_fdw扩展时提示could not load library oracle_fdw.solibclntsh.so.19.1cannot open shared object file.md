+++

title = "创建oracle_fdw扩展时提示could not load library "oracle_fdw.so":libclntsh.so.19.1:cannot open shared object file" 

date = "2023-07-20" 

tags = ["openGauss/MogDB"] 

archives = "2023-07" 

author = "张翠娉" 

summary = "创建oracle_fdw扩展时提示could not load library "oracle_fdw.so":libclntsh.so.19.1:cannot open shared object file"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "10:20"
+++

# 创建oracle_fdw扩展时提示could not load library "oracle_fdw.so":libclntsh.so.19.1:cannot open shared object file?

## 简介

oracle_fdw 用于Oracle的外部数据包装器，是一款开源插件。换句话说，oracle_fdw可用于通过MogDB数据库来访问Oracle数据库中的表，并执行相关增删改查等操作。

安装完oracle_fdw后，登录到数据库，执行`create extension oracle_fdw;`提示error。

## 报错信息

```
MogDB=# create extension oracle_fdw;
ERROR: could not load library "oracle_fdw.so":libclntsh.so.19.1:cannot open shared object file:No such file or directory
```

## 报错原因

该插件依赖的环境变量配置有问题。

## 解决办法

1. 下载instantclient-basic-linux.x64-21.9.0.0.0dbru.zip包获取libclntsh.so.19.1文件。

2. 查看下载的库文件路径。

   ```
   [omm5@localhost ~]$ which libclntsh.so.19.1
   /data/mogdb500/instantclient_21_9/libclntsh.so.19.1
   ```

3. 修改配置文件，配置如下内容：

   ```
   vim /home/omm5/.ptk_mogdb_env
   ```

   **说明**：omm5为mogdb数据库的操作系统用户名。请根据实际情况替换

   ```
   export ORACLE_HOME=/data/mogdb500/instantclient_21_9
   export PATH=$GPHOME/ptk_tool/bin:$GAUSSHOME/bin:$GPHOME/script:$ORACLE_HOME:$PATH
   export LD_LIBRARY_PATH=$ORACLE_HOME:$GAUSSHOME/lib:$GPHOME/lib:$GPHOME/script/gspylib/clib:$LD_LIBRARY_PATH
   ```

   **说明**：新增为`export ORACLE_HOME=/data/mogdb500/instantclient_21_9`、PATH中的`:$ORACLE_HOME`，以及LD_LIBRARY_PATH中的`$ORACLE_HOME:`。

4. 配置完成后，执行 `source ~/.ptk_mogdb_env  `  使配置文件生效。