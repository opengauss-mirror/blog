+++

title = "当创建Dolphin Extension提示can't create dolphin extension lib is not in shared_preload_libraries时怎么办" 

date = "2022-09-01" 

tags = ["当创建Dolphin Extension提示can't create dolphin extension lib is not in shared_preload_libraries时怎么办"] 

archives = "2023-06" 

author = "张翠娉" 

summary = "当创建Dolphin Extension提示can't create dolphin extension lib is not in shared_preload_libraries时怎么办"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "14:20"

+++

# 当创建Dolphin Extension提示can't create dolphin extension lib is not in shared_preload_libraries时怎么办？

**背景介绍**：

在安装好dolphin插件后，执行`create database my_test DBCOMPATIBILITY 'B';` 创建了MySQL兼容性数据库后，执行创建dolphin扩展报错。

**报错内容**：

```bash
my_test=# create extension dolphin;
ERROR:  Can't create dolphin extension lib is not in shared_preload_libraries
```

**报错原因**：参数shared_preload_libraries未修改。

**解决办法**：

1. 找到dolphin.so文件所在地址。

   ```
   # find / -name dolphin.so
   /data/mogdb/install/om/script/static/plugins/plugins/dolphin/dolphin.so
   /data/mogdb/install/app_1a363ea9/lib/postgresql/dolphin.so
   ```

2. 复制上面app的地址，修改postgresql.conf中的shared_preload_libraries参数。

   ```
   $ vim /data/mogdb/install/data/dn/postgresql.conf
   shared_preload_libraries = '/data/mogdb/install/app_1a363ea9/lib/postgresql/dolphin.so'         
   # (change requires restart)
   ```

3. 保存后需要重启数据库生效修改参数。

   ```
   [omm@amogdb ~]$ gs_om -t restart
   Stopping cluster.
   =========================================
   Successfully stopped cluster.
   =========================================
   End stop cluster.
   Starting cluster.
   =========================================
   [SUCCESS] amogdb
   2022-08-16 21:55:43.617 [unknown] [unknown] localhost 140643687024896 0[0:0#0] 0 [BACKEND] WARNING:  could not create any HA TCP/IP sockets
   2022-08-16 21:55:43.617 [unknown] [unknown] localhost 140643687024896 0[0:0#0] 0 [BACKEND] WARNING:  could not create any HA TCP/IP sockets
   2022-08-16 21:55:43.618 [unknown] [unknown] localhost 140643687024896 0[0:0#0] 0 [BACKEND] WARNING:  No explicit IP is configured for listen_addresses GUC.
   2022-08-16 21:55:43.619 [unknown] [unknown] localhost 140643687024896 0[0:0#0] 0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (16 Mbytes) or shared memory (3711 Mbytes) is larger.
   =========================================
   Successfully started.
   
   [omm@amogdb ~]$ gsql -d my_test -p 26000 -r
   gsql ((MogDB 3.0.1 build 1a363ea9) compiled at 2022-08-05 17:31:04 commit 0 last mr  )
   Non-SSL connection (SSL connection is recommended when requiring high-security)
   Type "help" for help.
   
   my_test=# show shared_preload_libraries ;
                     shared_preload_libraries                  
   ------------------------------------------------------------
    /data/mogdb/install/app_1a363ea9/lib/postgresql/dolphin.so
   (1 row)
   ```

4. 进入之前创建的MySQL兼容性数据库，执行如下命令创建dolphin扩展：

   ```
   my_test=# create extension dolphin;
   CREATE EXTENSION
   ```