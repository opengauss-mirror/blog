+++

title = "openGauss/MogDB数据库服务启动模式分析" 

date = "2022-04-11" 

tags = ["openGauss/MogDB数据库服务启动模式分析"] 

archives = "2022-04" 

author = "恩墨交付团队" 

summary = "openGauss/MogDB数据库服务启动模式分析"

img = "/zh/post/enmo/title/img6.png" 

times = "10:20"

+++

# openGauss/MogDB数据库服务启动模式分析

## SERVERMODE参数

我们查看gs_ctl命令的帮助，可以看到-M选项，也就是SERVERMODE服务启动模式

```
  -M                     the database start as the appointed  mode 
```

后面可以看到SERVERMODE参数的四种值

```sql
SERVERMODE are:
  primary         database system run as a primary server, send xlog to standby server
  standby         database system run as a standby server, receive xlog from primary server
  cascade_standby database system run as a cascade standby server, receive xlog from standby server
  pending         database system run as a pending server, wait for promoting to primary or demoting to standby

```

比较常见的是在搭建主备时使用primary及standby这两个值，本文只讨论这两种值，其它值的后续文章会探讨。

## 默认启动模式

如果我们使用gs_ctl启动服务时不指定SERVERMODE，默认会使用primary模式启动服务，这个在单机模式下是合适的。

## primary及standby模式

相比PostgreSQL主备搭建的方式，MogDB并不是在备库单独创建一个standby的触发文件，然后启动服务。

MogDB需要在主库和备库以不同的模式启动，主库是primary模式启动，备库是standby启动。

主库启动命令：

```
$ gs_ctl start -D data -M primary 
```

启动完成之后查看进程可以看到启动模式为primary
![](./images/20211124-cc72a2d2-2d38-4bba-b79a-0e3b8ddbc7ff.png)

备库启动命令：

```
$ gs_ctl start -D data -M standby
启动完成之后查看进程可以看到启动模式为standby
```

如果备库我们没有使用-M启动模式，或者启动模式不是standby，则不会建立主备关系，此时我们不能简单通过关闭，重新以standby模式来恢复主备关系，只能使用build操作来重建备库。所以在主备环境下启动备库一定要注意使用standby模式启动。
