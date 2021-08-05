+++

title =  "openGauss在kubernetes集群环境上的部署" 

date = "2021-07-10" 

tags = ["openGauss在kubernetes集群环境上的部署"] 

archives = "2021-07" 

author = "华军" 

summary = "openGauss在kubernetes集群环境上的部署"

img = "/zh/post/zhengwen2/img/img21.png" 

times = "12:30"

+++

# opengauss实践总结学习心<a name="ZH-CN_TOPIC_0000001085018737"></a> 

openGauss是一款开源关系型数据库管理系统 ,  深度融合华为在数据库领域多年的经验，结合企业级场景需求，持续构建竞争力特性;kubernetes也是一个开源的，用于管理云平台中多个主机上的容器化的应用，Kubernetes的目标是让部署容器化的应用简单并且高效,Kubernetes提供了应用部署，规划，更新，维护的一种机制, 本篇文章将介绍openGauss在kubernetes集群环境上的部署探索。

# 1.检查k8s运行环境 

```
[root@n-k8s-m ~]# kubectl get node
>NAME       STATUS     ROLES    AGE    VERSION
n-k8s-m    Ready      master   349d   v1.18.0
```



# 2.查看准备好的openGauss的docker镜像<br />



```
[root@n-k8s-m ~]# docker images
REPOSITORY         TAG                 IMAGE ID            CREATED             SIZE
nginx             latest              4cdc5dd7eaad        36 hours ago        133MB
opengauss         2.0.0               757bf74560e3        5 weeks ago         639MB
```



#  3.安装NFS服务器存储<br />

```
#安装依赖包
[root@n-k8s-m ~]#yum -y install nfs-utils rpcbind
#开机启动
[root@n-k8s-m ~]#systemctl enable rpcbind.service
[root@n-k8s-m ~]#systemctl enable nfs-server.service
[root@n-k8s-m ~]#systemctl start rpcbind.service #端口是111
[root@n-k8s-m ~]#systemctl start nfs-server.service # 端口是 2049
#配置NFS
[root@n-k8s-m ~]#mkdir /home/pv1
[root@n-k8s-m ~]#chown nfsnobody:nfsnobody /home/pv1
[root@n-k8s-m ~]#cat /etc/exports</p>

<pre><code class="lang-">/home/pv1 192.168.137.0/24(rw,async,all_squash)  
</code></pre>
<p>[root@n-k8s-m ~]#exportfs -rv</p>
<pre><code class="lang-">exporting 192.168.137.0/24:/home/pv1
</code></pre>

/home/pv1 192.168.137.0/24(rw,async,all_squash)
>[root@n-k8s-m ~]#exportfs -rv
exporting 192.168.137.0/24:/home/pv1
```



#  4.创建openGauss所使用的存储pv<br />

```
#编写yaml文件
[root@n-k8s-m ~]# cat opengauss_pv.yml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: opengauss-pv
  labels:
    type: nfs001
spec:
  capacity:
    storage: 1Gi 
  accessModes:
    - ReadWriteMany 
  persistentVolumeReclaimPolicy: Recycle
  nfs:
    path: &quot;/home/pv1&quot;
    server: 192.168.137.61
    readOnly: false
    
#创建pv
    [root@n-k8s-m opengauss]# kubectl create -f opengauss_pv.yml
    persistentvolume/opengauss-pv created
#查看创建pv
    [root@n-k8s-m opengauss]# kubectl get pv
    NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM                            STORAGECLASS          REASON   AGE
opengauss-pv                               1Gi        RWX            Recycle          Available
```



#  5.创建openGauss所使用的存储pvc<br />

```
#编写yaml文件
[root@n-k8s-m ~]# cat opengauss_pvc.yml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: opengauss-pvc
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 1Gi
#创建pvc
    [root@n-k8s-m opengauss]# kubectl create -f opengauss_pvc.yml
    persistentvolumeclaim/opengauss-pv created
#查看创建pvc
    [root@n-k8s-m opengauss]# kubectl get pvc
    NAME                     STATUS   VOLUME                  CAPACITY   ACCESS MODES   STORAGECLASS          AGE
opengauss-pvc         Bound    opengauss-pv           1Gi        RWX                                  4s
```



#  6.创建openGauss的Deployment<br />

```
#编写yaml文件
apiVersion: apps/v1
kind: Deployment
metadata:
  name: opengauss-deployment
spec:
  selector:
    matchLabels:
      app: opengauss
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: opengauss
    spec:
      containers:
        - image: opengauss:2.0.0
          name: opengauss-service
          imagePullPolicy: IfNotPresent
          env:
            - name: GS_PASSWORD
              value: Gauss@123
          ports:
            - containerPort: 5432
              name: opengauss
          volumeMounts: # 挂载Pod上的卷到容器
            - name: opengauss-persistent-storage # Pod上卷的名字，与“volumes”名字匹配
              mountPath: /var/lib/opengauss  # 挂载的Pod的目录
      volumes:   # 挂载持久卷到Pod
        - name: opengauss-persistent-storage # 持久卷名字， 与“volumMounts”名字匹配
          persistentVolumeClaim: 
            claimName: opengauss-pvc  # 持久卷申请名字
 
 #创建Deployment<br />[root@n-k8s-m opengauss]# kubectl create -f opengauss_deploy.yaml
     deployment.apps/opengauss-deployment create
 #查看创建Deploymen
     [root@n-k8s-m opengauss]# kubectl get deploy
     NAME                            READY   UP-TO-DATE   AVAILABLE   AGEopengauss-deployment     1/1                 1            1           110s

#创建Deployment
[root@n-k8s-m opengauss]# kubectl create -f opengauss_deploy.yaml
deployment.apps/opengauss-deployment created

#查看创建Deployment
[root@n-k8s-m opengauss]# kubectl get deploy
NAME                            READY   UP-TO-DATE   AVAILABLE   AGE
opengauss-deployment     1/1                 1            1           110s​
```



#  7.创建openGauss的Service提供集群内部和外部的高可用访问<br />

```
#编写yaml文件
apiVersion: v1
kind: Service
metadata:
  name: opengauss-service
  labels:
    app: opengauss
spec:
  type: NodePort
  selector:
      app: opengauss
  ports:
  - protocol : TCP
    nodePort: 32222
    port: 5432
    targetPort: 5432
#创建openGauss的Service
    [root@n-k8s-m opengauss]# kubectl create -f opengauss_svc.yaml
    >service/opengauss-service created
#查看创建Service
   [root@n-k8s-m opengauss]# kubectl get svc
   NAME                        TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                        AGE
opengauss-service   NodePort    10.101.64.232    &lt;none&gt;        5432:32222/TCP                 6s
```



#  8.连接openGauss数据库<br />

```
#使用kubectl内部连接数据库
[root@n-k8s-m opengauss]# kubectl get pod
NAME      READY   STATUS        RESTARTS   AGE
opengauss-deployment-6b8b4645f8-bfk4w     1/1     Running       0          15m
[root@n-k8s-m opengauss]# kubectl exec -it opengauss-deployment-6b8b4645f8-bfk4w sh
kubectl exec [POD] [COMMAND] is DEPRECATED and will be removed in a future version. Use kubectl kubectl exec [POD] -- [COMMAND] instead.
sh-4.2# su - omm
[omm@opengauss-deployment-6b8b4645f8-bfk4w ~]$ gsql
gsql ((openGauss 2.0.0 build 78689da9) compiled at 2021-03-31 21:04:03 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type &quot;help&quot; for help.
omm=# \c
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database &quot;omm&quot; as user &quot;omm&quot;.
omm=# \l
                       List of databases
Name    | Owner | Encoding |  Collate   |   Ctype    | Access privileges
-----------+-------+----------+------------+------------+-------------------
 omm       | omm   | UTF8     | en_US.utf8 | en_US.utf8 |
 postgres  | omm   | UTF8     | en_US.utf8 | en_US.utf8 |
 template0 | omm   | UTF8     | en_US.utf8 | en_US.utf8 | =c/omm           +
     |       |          |            |            | omm=CTc/omm
 template1 | omm   | UTF8     | en_US.utf8 | en_US.utf8 | =c/omm           +
     |       |          |            |            | omm=CTc/omm
(4 rows)
```

<p>#使用pgadmin4外部连接数据库<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210708-eeb9b4f0-936e-4295-989c-77c424ce477c.png" alt="image.png" /><br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210708-64ac0911-3d04-42db-a229-c77d20e1acc6.png" alt="image.png" /></p>

