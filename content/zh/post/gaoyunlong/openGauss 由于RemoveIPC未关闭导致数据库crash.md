+++

title = "openGauss 由于RemoveIPC未关闭导致数据库crash" 

date = "2022-04-07" 

tags = ["openGauss 由于RemoveIPC未关闭导致数据库crash"] 

archives = "2022-04" 

author = "高云龙" 

summary = "openGauss 由于RemoveIPC未关闭导致数据库crash"

img = "/zh/post/gaoyunlong/title/img21.png" 

times = "10:20"

+++

# openGauss 由于RemoveIPC未关闭导致数据库crash

## semop 引发的数据库crash

```sql
--主库

FATAL：semop(id=xxxxx) failed: Identifier removed

FATAL： semctl(xxxxxx,11,SETVAL,0) failed: Invalid argument

--备库

FATAL： semctl(xxxxxx,11,SETVAL,0) failed: Invalid argument

LOG: server process (ThreadId xxxxxx) was terminated by signal 1: Hangup

LOG: terminating any other active server processess

LOG: server process (THREADId xxxx) exited with exit code 0

LOG: the server process exits

--原因
在centos7.2中，systemd-logind 服务引入了一个新特性，该新特性是：当一个user 完全退出os之后，remove掉所有的IPC objects。该特性由/etc/systemd/logind.conf，参数文件中RemoveIPC选项来控制。在centos7.2中，RemoveIPC的默认值为yes，因此，当最后一个MogDB/openGauss用户退出时，操作系统会remove 掉这个user的shared memory segments and semaphores
```

## 解决方法

```
echo "RemoveIPC=no" >> /etc/systemd/logind.conf
systemctl restart systemd-logind
```

