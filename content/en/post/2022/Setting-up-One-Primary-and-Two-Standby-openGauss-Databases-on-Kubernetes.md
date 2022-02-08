+++

title = "Setting up One Primary and Two Standby openGauss Databases on Kubernetes"

date = "2021-10-9"

tags = \[ "Setting up One Primary and Two Standby openGauss Databases on Kubernetes"\]

archives = "2021-10"

author = "Bin Zhou"

summary = "Setting up One Primary and Two Standby openGauss Databases on Kubernetes"

img = "/en/post/2022/title/img2.png"

times = "12:30"

+++

# Setting up One Primary and Two Standby openGauss Databases on Kubernetes<a name="ZH-CN_TOPIC_0000001206146728"></a>

Initialize the environment as the  **master**  or  **node**  role.

<a name="table20842162672317"></a>
<table><thead align="left"><tr id="row52731274237"><th class="cellrowborder" valign="top" width="40.40404040404041%" id="mcps1.1.4.1.1"><p id="p1627332718237"><a name="p1627332718237"></a><a name="p1627332718237"></a>IP</p>
</th>
<th class="cellrowborder" valign="top" width="30.303030303030305%" id="mcps1.1.4.1.2"><p id="p427312752314"><a name="p427312752314"></a><a name="p427312752314"></a>Hostname</p>
</th>
<th class="cellrowborder" valign="top" width="29.292929292929294%" id="mcps1.1.4.1.3"><p id="p15273727172310"><a name="p15273727172310"></a><a name="p15273727172310"></a>Role</p>
</th>
</tr>
</thead>
<tbody><tr id="row10273202782317"><td class="cellrowborder" valign="top" width="40.40404040404041%" headers="mcps1.1.4.1.1 "><p id="p527314272234"><a name="p527314272234"></a><a name="p527314272234"></a>192.168.0.1</p>
</td>
<td class="cellrowborder" valign="top" width="30.303030303030305%" headers="mcps1.1.4.1.2 "><p id="p1527382718233"><a name="p1527382718233"></a><a name="p1527382718233"></a>k8smaster</p>
</td>
<td class="cellrowborder" valign="top" width="29.292929292929294%" headers="mcps1.1.4.1.3 "><p id="p927317270237"><a name="p927317270237"></a><a name="p927317270237"></a>master</p>
</td>
</tr>
<tr id="row2273132713237"><td class="cellrowborder" valign="top" width="40.40404040404041%" headers="mcps1.1.4.1.1 "><p id="p02731527152311"><a name="p02731527152311"></a><a name="p02731527152311"></a>192.168.0.2</p>
</td>
<td class="cellrowborder" valign="top" width="30.303030303030305%" headers="mcps1.1.4.1.2 "><p id="p6273142782316"><a name="p6273142782316"></a><a name="p6273142782316"></a>k8snode01</p>
</td>
<td class="cellrowborder" valign="top" width="29.292929292929294%" headers="mcps1.1.4.1.3 "><p id="p8273727112319"><a name="p8273727112319"></a><a name="p8273727112319"></a>node</p>
</td>
</tr>
</tbody>
</table>

Disable  **firewalld**.

-   systemctl stop firewalld
-   systemctl disable firewalld

## 1. Update Docker.<a name="section1775074642916"></a>

```
rpm -qa|grep docker
yum remove docker
curl -fsSL https://get.docker.com/ | sh
systemctl start docker
systemctl enable docker
```

## 2. Prepare the Kubernetes source.<a name="section17293201183013"></a>

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

## 3. Check image names required by kubeadm.<a name="section164871814308"></a>

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

## 4. Install images required for Kubernetes.<a name="section16828194119304"></a>

```
docker pull registry.aliyuncs.com/google_containers/kube-apiserver:v1.21.1
docker pull registry.aliyuncs.com/google_containers/kube-controller-manager:v1.21.1
docker pull registry.aliyuncs.com/google_containers/kube-scheduler:v1.21.1
docker pull registry.aliyuncs.com/google_containers/kube-proxy:v1.21.1
docker pull registry.aliyuncs.com/google_containers/pause:3.4.1
docker pull registry.aliyuncs.com/google_containers/etcd:3.4.13-0
docker pull coredns/coredns:1.8.0
```

## 5. Modify the Docker tags to match those required by kubeadm.<a name="section1439257173014"></a>

-   Download images from Chinese sources.

    ```
    docker tag registry.aliyuncs.com/google_containers/kube-apiserver:v1.21.1 k8s.gcr.io/kube-apiserver:v1.21.1       
    docker tag registry.aliyuncs.com/google_containers/kube-controller-manager:v1.21.1 k8s.gcr.io/kube-controller-manager:v1.21.1
    docker tag registry.aliyuncs.com/google_containers/kube-scheduler:v1.21.1 k8s.gcr.io/kube-scheduler:v1.21.1
    docker tag registry.aliyuncs.com/google_containers/kube-proxy:v1.21.1 k8s.gcr.io/kube-proxy:v1.21.1
    docker tag registry.aliyuncs.com/google_containers/pause:3.4.1 k8s.gcr.io/pause:3.4.1
    docker tag registry.aliyuncs.com/google_containers/etcd:3.4.13-0 k8s.gcr.io/etcd:3.4.13-0
    docker tag docker.io/coredns/coredns:1.8.0 k8s.gcr.io/coredns/coredns:v1.8.0
    ```

-   Delete invalid images.

    ```
    docker rmi registry.aliyuncs.com/google_containers/kube-apiserver:v1.21.1
    docker rmi registry.aliyuncs.com/google_containers/kube-controller-manager:v1.21.1
    docker rmi registry.aliyuncs.com/google_containers/kube-scheduler:v1.21.1
    docker rmi registry.aliyuncs.com/google_containers/kube-proxy:v1.21.1
    docker rmi registry.aliyuncs.com/google_containers/pause:3.4.1
    docker rmi registry.aliyuncs.com/google_containers/etcd:3.4.13-0
    docker rmi coredns/coredns:1.8.0
    ```


## 6. Write Kubernetes initialization configurations and initialize Kubernetes as  **master**.<a name="section1716594242"></a>

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

Copy the configuration file to Kubernetes and specify it during initialization.

```
cp kubeadm.yaml /etc/kubernetes/manifests/
kubeadm init --config kubeadm.yaml
```

After the operation is successful, retain the following information for later use:

```
kubeadm join 192.168.0.35:6443 --token ru2883.u4rhwkx5oqrol9at \
        --discovery-token-ca-cert-hash sha256:f2dbe7ce49b322e8145b6e9b4303e56468ad1352daabecb797f7bd161a64e018
```

Perform initialization.

```
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

Install the network plugin.

```
kubectl apply -f "https://cloud.weave.works/k8s/net?k8s-version=$(kubectl version | base64 | tr -d '\n')"
```

## 7. Join nodes.<a name="section5423203652514"></a>

After the node is installed, it does not need to be initialized. Run the  **kubeadm join**  command to add the node to the primary node.

```
kubeadm join 192.168.0.35:6443 --token ru2883.u4rhwkx5oqrol9at \
        --discovery-token-ca-cert-hash sha256:f2dbe7ce49b322e8145b6e9b4303e56468ad1352daabecb797f7bd161a64e018
```

## 8. Import images as  **master**  and  **node**.<a name="section791535972619"></a>

```
docker load < opengauss.tar.gz
```

## 9. Create a service \(SVC\) as  **master**.<a name="section634154152716"></a>

Create an SVC for pods:kubectl create -f opengauss-svc.yaml

The content of the  **opengauss-svc.yaml**  file is as follows:

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

## 10. Create a pod as  **master**.<a name="section1240984242913"></a>

Create the primary and standby pods of openGauss.

kubectl create -f opengauss-pod.yaml

The content of the  **opengauss-pod.yaml**  file is as follows:

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
      name: openguass-volume
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
  - name: openguass-volume
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
      name: openguass-volume
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
  - name: openguass-volume
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
      name: openguass-volume
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
  - name: openguass-volume
    hostPath:
      path: /data/opengauss-3/
      type: DirectoryOrCreate
```

## 11. Test the database as  **master**.<a name="section28891639163012"></a>

```
1. Access the primary node of the database.
 
kubectl exec -it opengauss-1 -- /bin/bash
2. Switch the user.
su omm
3. Access the database.
gsql
```

## 12. Common Commands<a name="section1536313743118"></a>

All commands are executed as  **master**.

```
View cluster nodes.
kubectl get node
View cluster pods.
kubectl get pod --all-namespaces
Check the cluster service.
kubectl get svc --all-namespaces
Access the container.
kubectl exec -it Container name (pod name for a single container) -n opengauss -- /bin/bash
Run the following command to view pod or SVC details:
kubectl describe pod/svc pod/SVC name -n pod/SVC namespaces
View the log information.
kubectl logs pod Pod name -n Pod namespaces
```

