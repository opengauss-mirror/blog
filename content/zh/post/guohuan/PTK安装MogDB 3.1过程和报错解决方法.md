+++

title = "PTK安装MogDB 3.1过程和报错解决方法" 

date = "2022-11-30" 

tags = ["MogDB"] 

archives = "2022-11" 

author = "云和恩墨-郭欢" 

summary = "PTK安装MogDB 3.1过程和报错解决方法"

img = "/zh/post/guohuan/title/img.png" 

times = "10:20"

+++

# PTK安装MogDB 3.1过程和报错解决方法

安装系统：openEuler arm64

1.将安装包MogDB-3.1.0-openEuler-arm64.tar.gz上传至/opt/3.1.0beta1
2.编辑配置文件

```
#config.yaml
global:
  cluster_name: mogdb310beta1
  user: omm310beta1
  group: omm310beta1
  base_dir: /opt/mogdb3.1.0beta1
db_servers:
  - host: 127.0.0.1
    db_port: 27007
```

3.进行系统检查

```
ptk checkos -f config.yaml
```

4.执行安装

```
ptk install -f config.yaml --pkg ./MogDB-3.1.0-openEuler-arm64.tar.gz
```

**此时遇到以下报错：**
![image.png](./images/20221129-439696a6-ec32-46c9-aa81-66201b7e9b03.png)

**报错原因**：经过咨询，报错是因为ptk版本太低，MogDB 3.1包目录结构有所变化。
**解决办法**：升级ptk到0.5以上

```
ptk self upgrade
```

![image.png](./images/20221129-b499627d-a25d-4b05-a620-6079c4768295.png)

ptk升级成功后，再次执行ptk install命令进行安装即可。安装结束后即可登录MogDB 3.1.0体验beta版功能。

![image.png](./images/20221129-9fa55943-0b09-400c-8c1e-e5ad20e6ce94.png)

更多信息请参考以下页面：[https://docs.mogdb.io/zh/ptk/v0.5/quick-start](https://docs.mogdb.io/zh/ptk/v0.5/quick-start)
