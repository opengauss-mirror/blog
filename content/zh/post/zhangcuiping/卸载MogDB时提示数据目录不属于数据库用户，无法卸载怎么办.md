+++

title = "卸载MogDB时提示数据目录不属于数据库用户，无法卸载怎么办" 

date = "2022-07-14" 

tags = ["数据库入门"] 

archives = "2022-07" 

author = "张翠娉" 

summary = "卸载MogDB时提示数据目录不属于数据库用户，无法卸载怎么办"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "14:20"

+++

# 卸载MogDB时提示数据目录不属于数据库用户，无法卸载怎么办

**背景介绍**：

PTK (Provisioning Toolkit)是一款针对 MogDB 数据库开发的软件安装和运维工具，旨在帮助用户更便捷地安装部署MogDB数据库。

如果用户想要运行 MogDB 或者 MogDB 的相关组件时，仅需要执行一行命令即可实现。

PTK 支持安装 MogDB 的操作系统众多，达到22个，后期还会不断增多。

使用ptk卸载MogDB时，遇到如下错误。

**报错内容**：

```bash
[root@hostname opt]# ptk uninstall -f config.yaml
=============================
global:
  cluster_name: mogdb2
  user: ommdoc
  group: ommdoc
  app_dir: /opt/mogdb/app
  data_dir: /opt/mogdb/data
  log_dir: /opt/mogdb/log
  tool_dir: /opt/mogdb/tool
  tmp_dir: /opt/mogdb/tmp
db_servers:
- host: 172.16.0.127
  db_port: 28000
  role: primary
  az_name: AZ1
  az_priority: 1

=============================
Do you really want to uninstall this cluster? Please confirm carefully[Y|Yes](default=N) y
Do you want to delete db data '/opt/mogdb/data'?[Y|Yes](default=N) y
Do you want to delete user 'ommdoc'?[Y|Yes](default=N) y
INFO[2022-10-13T15:50:28.762] check db dirs owner                           host=172.16.0.127
[172.16.0.127] [PTK-50304] the file/dir path '/opt/mogdb/data' not belongs to ommdoc
[root@hostname opt]#

```

**解决办法**：

1. 打开/opt/mogdb目录，删除data文件。

   ```
   cd /opt/mogdb
   rm -rf data
   ```

2. 重新执行卸载命令

   ```bash
   [root@hostname opt]# ptk uninstall -f config.yaml
   =============================
   global:
     cluster_name: mogdb2
     user: ommdoc
     group: ommdoc
     app_dir: /opt/mogdb/app
     data_dir: /opt/mogdb/data
     log_dir: /opt/mogdb/log
     tool_dir: /opt/mogdb/tool
     tmp_dir: /opt/mogdb/tmp
   db_servers:
   - host: 172.16.0.127
     db_port: 28000
     role: primary
     az_name: AZ1
     az_priority: 1
   
   =============================
   Do you really want to uninstall this cluster? Please confirm carefully[Y|Yes](default=N) y
   Do you want to delete db data '/opt/mogdb/data'?[Y|Yes](default=N) y
   Do you want to delete user 'ommdoc'?[Y|Yes](default=N) y
   INFO[2022-10-13T15:51:06.643] check db dirs owner                           host=172.16.0.127
   INFO[2022-10-13T15:51:06.648] check db process status                       host=172.16.0.127
   INFO[2022-10-13T15:51:06.659] clean crontab                                 host=172.16.0.127
   INFO[2022-10-13T15:51:06.719] kill ommdoc's processes                       host=172.16.0.127
   INFO[2022-10-13T15:51:06.822] remove files /opt/mogdb/app,/opt/mogdb/tool,/opt/mogdb/cm,/opt/mogdb/tmp,/opt/mogdb/data,/opt/mogdb/log  host=172.16.0.127
   INFO[2022-10-13T15:51:06.904] delete os user ommdoc                         host=172.16.0.127
   INFO[2022-10-13T15:51:07.088] clearing /etc/cron.allow                      host=172.16.0.127
   INFO[2022-10-13T15:51:07.092] clearing /etc/security/limits.conf            host=172.16.0.127
   ```

