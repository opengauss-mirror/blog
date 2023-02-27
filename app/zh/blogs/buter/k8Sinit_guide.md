---
title: '在K8S上面搭建一主两备openGauss'
date: '2021-09-10'
category: 'blog'
tags: ['openGauss分布式解决方案']
archives: '2021-03'
author: 'buter'
summary: 'openGauss分布式解决方案'
times: '17:30'
---

# 在 K8S 上面搭建一主两备 openGauss

## 初始化环境（以下操作需在 master 和 node 节点执行）

| IP            | Hostname  | Role   |
| ------------- | --------- | ------ |
| 192.168.0.87  | k8smaster | master |
| 192.168.0.161 | k8snode01 | node   |

```
关闭firewalld
systemctl stop firewalld
systemctl disable firewalld
```

## 1. 更新 docker

```
rpm -qa|grep docker

yum remove docker

curl -fsSL https://get.docker.com/ | sh

systemctl start docker

systemctl enable docker

```

## 2. 准备 kubernetes 源

```
vim /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg


yum install -y kubeadm kubectl etcd
```

## 3. 查看 kubeadm 所需镜像名字

```
[root@ecs-66cc dockerimages]# kubeadm config images list

k8s.gcr.io/kube-apiserver:v1.21.1
k8s.gcr.io/kube-controller-manager:v1.21.1
k8s.gcr.io/kube-scheduler:v1.21.1
k8s.gcr.io/kube-proxy:v1.21.1
k8s.gcr.io/pause:3.4.1
k8s.gcr.io/etcd:3.4.13-0
k8s.gcr.io/coredns/coredns:v1.8.0
```

## 4. 安装 K8S 所需镜像

```
docker pull registry.aliyuncs.com/google_containers/kube-apiserver:v1.21.1
docker pull registry.aliyuncs.com/google_containers/kube-controller-manager:v1.21.1
docker pull registry.aliyuncs.com/google_containers/kube-scheduler:v1.21.1
docker pull registry.aliyuncs.com/google_containers/kube-proxy:v1.21.1
docker pull registry.aliyuncs.com/google_containers/pause:3.4.1
docker pull registry.aliyuncs.com/google_containers/etcd:3.4.13-0
docker pull coredns/coredns:1.8.0
```

## 5.修改 docker Tag 使其与 kubeadm 所需匹配

- 用国内源下载镜像

```
docker tag registry.aliyuncs.com/google_containers/kube-apiserver:v1.21.1 k8s.gcr.io/kube-apiserver:v1.21.1
docker tag registry.aliyuncs.com/google_containers/kube-controller-manager:v1.21.1 k8s.gcr.io/kube-controller-manager:v1.21.1
docker tag registry.aliyuncs.com/google_containers/kube-scheduler:v1.21.1 k8s.gcr.io/kube-scheduler:v1.21.1
docker tag registry.aliyuncs.com/google_containers/kube-proxy:v1.21.1 k8s.gcr.io/kube-proxy:v1.21.1
docker tag registry.aliyuncs.com/google_containers/pause:3.4.1 k8s.gcr.io/pause:3.4.1
docker tag registry.aliyuncs.com/google_containers/etcd:3.4.13-0 k8s.gcr.io/etcd:3.4.13-0
docker tag docker.io/coredns/coredns:1.8.0 k8s.gcr.io/coredns/coredns:v1.8.0
```

- 删除无效镜像

```
docker rmi registry.aliyuncs.com/google_containers/kube-apiserver:v1.21.1
docker rmi registry.aliyuncs.com/google_containers/kube-controller-manager:v1.21.1
docker rmi registry.aliyuncs.com/google_containers/kube-scheduler:v1.21.1
docker rmi registry.aliyuncs.com/google_containers/kube-proxy:v1.21.1
docker rmi registry.aliyuncs.com/google_containers/pause:3.4.1
docker rmi registry.aliyuncs.com/google_containers/etcd:3.4.13-0
docker rmi coredns/coredns:1.8.0
```

## 6.编写 K8S 初始化配置&&初始化(在 master 节点执行)

kubeadm.yaml

```
apiVersion: kubeadm.k8s.io/v1beta2
clusterName: kubernetes
kind: ClusterConfiguration
kubernetesVersion: v1.21.1
controllerManager:
  extraArgs:
    horizontal-pod-autoscaler-use-rest-clients: "true"
    horizontal-pod-autoscaler-sync-period: "10s"
    node-monitor-grace-period: "10s"
apiServer:
  extraArgs:
    runtime-config: "api/all=true"
```

拷贝配置文件至 kubernetes 并初始化时指定。

` cp kubeadm.yaml /etc/kubernetes/manifests/`

` kubeadm init --config kubeadm.yaml`

成功后保留如下信息，后面会使用到：

```
kubeadm join 192.168.0.35:6443 --token ru2883.u4rhwkx5oqrol9at \
        --discovery-token-ca-cert-hash sha256:f2dbe7ce49b322e8145b6e9b4303e56468ad1352daabecb797f7bd161a64e018
```

初始化

```
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

安装网络插件

`kubectl apply -f "https://cloud.weave.works/k8s/net?k8s-version=$(kubectl version | base64 | tr -d '\n')"`

## 7. Node 节点 join

Node 节点执行完安装后无需初始化，执行`kubeadm join`命令加入主节点

```
kubeadm join 192.168.0.35:6443 --token ru2883.u4rhwkx5oqrol9at \
        --discovery-token-ca-cert-hash sha256:f2dbe7ce49b322e8145b6e9b4303e56468ad1352daabecb797f7bd161a64e018
```

## 8. 导入镜像(master 和 node 节点)

```
docker load < opengauss.tar.gz
```

## 9. 创建 service(svc)（master 节点）

给 pod 创建对应的 svc：kubectl create -f opengauss-svc.yaml

```
apiVersion: v1
kind: Service
metadata:
  name: opengauss-service-1
spec:
  ports:
  - port: 5432
    protocol: TCP
    targetPort: 5432
    name: gsql
  - port: 5434
    protocol: TCP
    targetPort: 5434
    name: localport
  - port: 2380
    protocol: TCP
    targetPort: 2380
    name: etcd1-service
  - port: 2379
    protocol: TCP
    targetPort: 2379
    name: etcd1-local
  selector:
    app: opengauss-1
  clusterIP: None

---


apiVersion: v1
kind: Service
metadata:
  name: opengauss-service-2
spec:
  ports:
  - port: 5432
    protocol: TCP
    targetPort: 5432
    name: gsql
  - port: 5434
    protocol: TCP
    targetPort: 5434
    name: localport
  - port: 2380
    protocol: TCP
    targetPort: 2380
    name: etcd1-service
  - port: 2379
    protocol: TCP
    targetPort: 2379
    name: etcd1-local
  selector:
    app: opengauss-2
  clusterIP: None


---


apiVersion: v1
kind: Service
metadata:
  name: opengauss-service-3
spec:
  ports:
  - port: 5432
    protocol: TCP
    targetPort: 5432
    name: gsql
  - port: 5434
    protocol: TCP
    targetPort: 5434
    name: localport
  - port: 2380
    protocol: TCP
    targetPort: 2380
    name: etcd1-service
  - port: 2379
    protocol: TCP
    targetPort: 2379
    name: etcd1-local
  selector:
    app: opengauss-3
  clusterIP: None

```

## 10.创建 pod（master 节点）

创建 openGauss 主备 pod：kubectl create -f opengauss-pod.yaml

```
apiVersion: v1
kind: Pod
metadata:
  name: opengauss-1
  labels:
    app: opengauss-1
spec:
  restartPolicy: Never
  containers:
  - name: opengauss-1
    image: opengauss:1.0.5
    imagePullPolicy: Never
    securityContext:
      runAsUser: 0
    volumeMounts:
    - mountPath: /var/lib/opengauss/data/
      name: openGauss-volume
    ports:
    - containerPort: 5432
      name: opengauss
    env:
    - name: HOST_NAME
      value: opengauss-1
    - name: HOST_IP
      valueFrom:
        fieldRef:
          fieldPath: status.podIP
    - name: PEER_IPS
      value: opengauss-service-2,opengauss-service-3
    - name: PEER_HOST_NAMES
      value: opengauss-2,opengauss-3
    - name: PORT
      value: "5432"
    - name: GS_PASSWORD
      value: "Test@56789"
    - name: SERVER_MODE
      value: primary
    - name: db_config
      value:
  volumes:
  - name: openGauss-volume
    hostPath:
      path: /data/opengauss-1/
      type: DirectoryOrCreate

---

apiVersion: v1
kind: Pod
metadata:
  name: opengauss-2
  labels:
    app: opengauss-2
spec:
  restartPolicy: Never
  containers:
  - name: opengauss-2
    image: opengauss:1.0.5
    imagePullPolicy: Never
    securityContext:
      runAsUser: 0
    volumeMounts:
    - mountPath: /var/lib/opengauss/data/
      name: openGauss-volume
    ports:
    - containerPort: 5432
      name: opengauss
    env:
    - name: HOST_NAME
      value: opengauss-2
    - name: HOST_IP
      valueFrom:
        fieldRef:
          fieldPath: status.podIP
    - name: PEER_IPS
      value: opengauss-service-1,opengauss-service-3
    - name: PEER_HOST_NAMES
      value: opengauss-1,opengauss-3
    - name: PORT
      value: "5432"
    - name: GS_PASSWORD
      value: "Test@56789"
    - name: SERVER_MODE
      value: standby
    - name: db_config
      value:
  volumes:
  - name: openGauss-volume
    hostPath:
      path: /data/opengauss-2/
      type: DirectoryOrCreate

---

apiVersion: v1
kind: Pod
metadata:
  name: opengauss-3
  labels:
    app: opengauss-3
spec:
  restartPolicy: Never
  containers:
  - name: opengauss-3
    image: opengauss:1.0.5
    imagePullPolicy: Never
    securityContext:
      runAsUser: 0
    volumeMounts:
    - mountPath: /var/lib/opengauss/data/
      name: openGauss-volume
    ports:
    - containerPort: 5432
      name: opengauss
    env:
    - name: HOST_NAME
      value: opengauss-3
    - name: HOST_IP
      valueFrom:
        fieldRef:
          fieldPath: status.podIP
    - name: PEER_IPS
      value: opengauss-service-1,opengauss-service-2
    - name: PEER_HOST_NAMES
      value: opengauss-1,opengauss-2
    - name: PORT
      value: "5432"
    - name: GS_PASSWORD
      value: "Test@56789"
    - name: SERVER_MODE
      value: standby
    - name: db_config
      value:
  volumes:
  - name: openGauss-volume
    hostPath:
      path: /data/opengauss-3/
      type: DirectoryOrCreate
```

## 11. 测试数据库（master 节点）

```
1.进入数据库主节点：kubectl exec -it opengauss-1 -- /bin/bash
2.切换用户：su omm
3.进入数据库：gsql
```

## 12. 常用命令

所有命令在 master 节点执行

```
查看集群节点：kubectl get node
查看集群pod：kubectl get pod --all-namespaces
查看集群服务：kubectl get svc --all-namespaces
进入容器：kubectl exec -it 容器名（单个容器的话为pod名） -n opengauss -- /bin/bash
查看pod/svc详情：kubectl describe pod/svc pod/svc名称 -n pod/svc的namespaces
查看日志信息：kubectl logs pod pod名称 -n pod的namespaces
```
