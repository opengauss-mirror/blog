+++

title = "MPT自动化测试工具实践" 

date = "2023-02-07" 

tags = ["MogDB"] 

archives = "2023-02" 

author = "DarkAthena" 

summary = "MPT自动化测试工具实践"

img = "/zh/post/DarkAthena/title/img31.png" 

times = "10:20"

+++

# 创建测试环境目录及用户

```
mkdir  /opt/mpt_test -r
useradd mpt_test
chown mpt_test /opt/mpt_test
```

# 下载mpt并解压

最新版本地址下载地址见wiki
http://wiki.enmotech.com:8090/pages/viewpage.action?pageId=29361193

```
su - mpt_test
cd /opt/mpt_test
wget https://cdn-mogdb.enmotech.com/mpt/v1.3.0/mpt_x86_64_v1.3.0.zip
unzip mpt_x86_64_v1.3.0.zip
```

# 下载配置文件

http://wiki.enmotech.com:8090/pages/viewpage.action?pageId=29361193

```
cd mpt_x86_64_v1.3.0
# 下载测试配置文件至此目录 ，比如 MPT_TMPL_NORMAL_v1.1_20230109.xlsx
```

# 申请license ,会收到邮件，手动上传到服务器上

```
./mpt_x86_64 --apply-license
cat > license.json
```

# 创建PTK安装配置文件

```
exit ## 切换回root
cd /opt/mpt_test
cat > /opt/mpt_test/config.yaml

global:
  # # cluster name (required)
  cluster_name: "mpt_test"
  # # system user for running db
  user: "mpt_test"
  # # system user group, same as username if not given
  # group: "omm"
  # # base directory for install MogDB server,
  # # if any of app_dir, data_dir, log_dir and tool_dir not config,
  # # PTK will create corresponding directory under base_dir
  base_dir: "/opt/mpt_test/mogdb"
  # # default password ：Enmo@123
  db_password: "pTk6NDk0MjZiOGQ8PTxFPT8/QkZiR0dlOFo2bWd3a2pxb3BrQXdKTHpHNXJLUFVUckNHNDRoemg5SE05RDQ="

db_servers:
  - host: "127.0.0.1"
    # # database port
    db_port: 26100
    db_conf:      
        checkpoint_segments: 64
        wal_keep_segments: 64

ctrl+d ## 保存文件
```

# 安装PTK

```
curl --proto '=https' --tlsv1.2 -sSf https://cdn-mogdb.enmotech.com/ptk/install.sh | sh
ptk checkos -f /opt/mpt_test/config.yaml
```

# 安装数据库 (如果重新测试，则从这一步开始,主要是为了释放空间，以及避免测试用例编写遗漏了清理环境)

```
ptk cluster stop -n mpt_test  ## 这里为了删库重测
ptk uninstall -n mpt_test    ## y y n  --删除数据库但保留用户
ptk install -f /opt/mpt_test/config.yaml --skip-create-user -y
ptk cluster install-plugin -n mpt_test
```

# 安装数据库兼容性提高组件

```
su - mpt_test
gsql -r
create extension whale;
create extension orafce;
\q

cd /opt/mpt_test

wget https://gitee.com/enmotech/compat-tools/repository/archive/master.zip
unzip master.zip
cd compat-tools-master
gsql -f runMe.sql
```

# 执行测试（对于测试时间长的，建议nohup执行）

```
cd /opt/mpt_test/mpt_x86_64_v1.3.0
nohup ./mpt_x86_64 -H localhost -P $PGPORT -U $PGUSER -c MPT_TMPL_NORMAL_v1.1_20230109.xlsx -r MPT_Report-$(date +%Y%m%d-%H%M%S).docx --cmd-spliter=xxxxxxx -T W &

ctrl+c 
```

# 观察日志

```
tail -f nohup.out
```

# 注意

## 测试需要预留足够的磁盘空间， 其中pg_log可能会占很大的空间，如果空间紧张,需要手动清理

```
# 查看目录大小
du -h --max-depth=1 /opt/mpt_test/mogdb
```
