+++

title = "MogDB（3.0.3.6版本）测试oracle语法的DBLINK功能操作步骤" 

date = "2023-02-07" 

tags = ["MogDB"] 

archives = "2023-02" 

author = "DarkAthena" 

summary = "MogDB（3.0.3.6版本）测试oracle语法的DBLINK功能操作步骤"

img = "/zh/post/DarkAthena/title/img31.png" 

times = "10:20"

+++

# 安装POC版本MogDB

```
ptk install -f config.yaml -p https://cdn-mogdb.enmotech.com/mogdb-media/3.0.3.6/MogDB-3.0.3.6-CentOS-x86_64.tar.gz
```

# 添加插件

```
ptk cluster install-plugin -n xxx -p https://cdn-mogdb.enmotech.com/mogdb-media/3.0.3.6/Plugins-3.0.3-CentOS-x86_64.tar.gz --skip-check-version
```

# 切换到数据库用户

```
su - omm
```

# 手动下载oracle_fdw

oracle_fdw没有打到插件包里去，需要单独下载

```
wget https://cdn-mogdb.enmotech.com/mogdb-media/3.0.1.4/oracle_fdw_CentOS_x86.tar.gz
```

# 解压 并复制到对应目录

```
tar -xvf oracle_fdw_CentOS_x86.tar.gz
cd oracle_fdw_CentOS_x86
cp *.sql $GAUSSHOME/app/share/postgresql/extension/
cp *.control $GAUSSHOME/app/share/postgresql/extension/
cp *.so $GAUSSHOME/lib/postgresql
```

# 下载oracle客户端并配置环境变量

```
wget https://download.oracle.com/otn_software/linux/instantclient/218000/instantclient-basic-linux.x64-21.8.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-21.8.0.0.0dbru.zip
vi ~/.bash_profile
export LD_LIBRARY_PATH=/home/omm/instantclient_21_7:$LD_LIBRARY_PATH
export PATH=/home/omm/instantclient_21_7:$PATH
source ~/.bash_profile
```

# 重启数据库

```
gs_ctl restart
```

# 连接数据库并创建插件

```
gsql -r
create extension oracle_fdw;
```

# 创建服务器

```
create server ora_sv foreign data wrapper oracle_fdw options(dbserver 'xxx.xxx.xxx.xxx:1521/pdb1');
```

# 给服务器设置用户名和密码

```
create user mapping for mogdb的用户名 server ora_sv options(user 'oracle的用户名',password 'oracle的密码'); 
```

可能会报错

> ERROR: No key file usermapping.key.cipher
> Please create usermapping.key.cipher file with gs_guc and gs_ssh, such as :gs_ssh -c “gs_guc generate -S XXX -D $GAUSSHOME/bin -o usermapping”

先去操作系统输入以下命令，并输入密码

```
gs_guc generate -D $GAUSSHOME/bin -o usermapping
```

然后回来创建

```
create user mapping for mogdb的用户名 server ora_sv options(user 'oracle的用户名',password 'oracle的密码'); 
```

# 测试

```
select * from scott.emp@ora_sv
```
