+++

title =  "openGauss的 Helm Chart包编写探索" 

date = "2021-07-10" 

tags = ["openGauss的 Helm Chart包编写探索"] 

archives = "2021-07" 

author = "华军" 

summary = openGauss的 Helm Chart包编写探索"

img = "/zh/post/zhengwen2/img/img29.jpg" 

times = "12:30"

+++

# openGauss的 Helm Chart包编写探索<a name="ZH-CN_TOPIC_0000001085018737"></a> 

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Helm 是 Kubernetes 的包管理器,包管理器类似于我们在 Ubuntu 中使用的apt、Centos中使用的yum一样，能快速查找、下载和安装软件包,本篇文章探索编写openGauss的 Helm Chart的包,方便openGauss的在Kubernetes的快速部署.

##### 1.环境清单
#检查k8s运行环境

```powershell
[root@n-k8s-m ~]# kubectl get node
NAME       STATUS     ROLES    AGE    VERSION
n-k8s-m    Ready      master   349d   v1.18.0
```

#检查Helm运行环境

```powershell
[root@n-k8s-m ~]# helm version
version.BuildInfo{Version:"v3.6.0", GitCommit:"7f2df6467771a75f5646b7f12afb408590ed1755", GitTreeState:"clean", GoVersion:"go1.16.3"}
```

#查看存储类

```powershell
[root@n-k8s-m ~]#kubectl get sc
NAME                  PROVISIONER      RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE
managed-nfs-storage   fuseim.pri/ifs   Delete          Immediate           false                  157m
```

##### 2.创建openGauss的包管理模板

```powershell
[root@n-k8s-m helm]# helm create opengauss
Creating opengauss
```

##### 3.查看包管理模板

```powershell
[root@n-k8s-m helm]# tree opengauss
opengauss
├── charts
├── Chart.yaml
├── templates
│   ├── deployment.yaml
│   ├── _helpers.tpl
│   ├── hpa.yaml
│   ├── ingress.yaml
│   ├── NOTES.txt
│   ├── pvc.yaml
│   ├── serviceaccount.yaml
│   ├── service.yaml
│   └── tests
│       └── test-connection.yaml
└── values.yaml
```

##### 4.编写变量文件values.yaml

```powershell
[root@n-k8s-m helm]#cat values.yaml

# Default values for opengauss.
# This is a YAML-formatted file.
# Declare variables to be passed into your templates.

replicaCount: 1

image:
  repository: opengauss
  pullPolicy: IfNotPresent
  # Overrides the image tag whose default is the chart appVersion.
  tag: "2.0.0"

imagePullSecrets: []
nameOverride: ""
fullnameOverride: ""

## Specify password for root user#
## Default: random 10 character string
RootPassword: Gauss@123

## Persist data to a persistent volume
persistence:
  enabled: true
  ## database data Persistent Volume Storage Class
  ## If defined, storageClassName: <storageClass>
  ## If set to "-", storageClassName: "", which disables dynamic provisioning
  ## If undefined (the default) or set to null, no storageClassName spec is
  ##   set, choosing the default provisioner.  (gp2 on AWS, standard on
  ##   GKE, AWS & OpenStack)
  ##
  storageClass: "managed-nfs-storage"
  accessMode: ReadWriteOnce
  size: 4Gi
  annotations: {}

serviceAccount:
  # Specifies whether a service account should be created
  create: true
  # Annotations to add to the service account
  annotations: {}
  # The name of the service account to use.
  # If not set and create is true, a name is generated using the fullname template
  name: ""

podAnnotations: {}

podSecurityContext: {}
  # fsGroup: 2000

securityContext: {}
  # capabilities:
  #   drop:
  #   - ALL
  # readOnlyRootFilesystem: true
  # runAsNonRoot: true
  # runAsUser: 1000

service:
  type: NodePort
  port: 5432

ingress:
  enabled: false
  className: ""
  annotations: {}
    # kubernetes.io/ingress.class: nginx
    # kubernetes.io/tls-acme: "true"
  hosts:
    - host: chart-example.local
      paths:
        - path: /
          pathType: ImplementationSpecific
  tls: []
  #  - secretName: chart-example-tls
  #    hosts:
  #      - chart-example.local

resources: {}
  # We usually recommend not to specify default resources and to leave this as a conscious
  # choice for the user. This also increases chances charts run on environments with little
  # resources, such as Minikube. If you do want to specify resources, uncomment the following
  # lines, adjust them as necessary, and remove the curly braces after 'resources:'.
  # limits:
  #   cpu: 100m
  #   memory: 128Mi
  # requests:
  #   cpu: 100m
  #   memory: 128Mi

autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 100
  targetCPUUtilizationPercentage: 80
  # targetMemoryUtilizationPercentage: 80

nodeSelector: {}

tolerations: []

affinity: {}
```

##### 5.编写deployment.yaml

```powershell
[root@n-k8s-m templates]# cat deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "opengauss.fullname" . }}
  labels:
    {{- include "opengauss.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "opengauss.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      {{- with .Values.podAnnotations }}
      annotations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      labels:
        {{- include "opengauss.selectorLabels" . | nindent 8 }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ include "opengauss.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: {{ .Chart.Name }}
          securityContext:
            {{- toYaml .Values.securityContext | nindent 12 }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          volumeMounts:
            - name: opengauss-persistent-storage
              mountPath: /var/lib/opengauss
          env:
           - name: GS_PASSWORD
             value: {{ .Values.RootPassword }}
          ports:
           - containerPort: 5432
          livenessProbe:
            httpGet:
              path: /
              port: http
          readinessProbe:
            httpGet:
              path: /
              port: http
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      volumes:
        - name: opengauss-persistent-storage
          persistentVolumeClaim:
            claimName: {{ include "opengauss.fullname" . }}
```

#####  6.编写Service.yaml

```powershell
[root@n-k8s-m helm]#vim Service.yaml

apiVersion: v1
kind: Service
metadata:
  name: {{ include "opengauss.fullname" . }}
  labels:
    {{- include "opengauss.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: 5432
      protocol: TCP
      name: http
  selector:
    {{- include "opengauss.selectorLabels" . | nindent 4 }}
```

##### 7.编写pvc.yaml

```powershell
[root@n-k8s-m templates]# cat pvc.yaml
{{- if and .Values.persistence.enabled (not .Values.persistence.existingClaim) }}
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: {{ template "opengauss.fullname" . }}
  namespace: {{ .Release.Namespace }}
{{- with .Values.persistence.annotations  }}
  annotations:
{{ toYaml . | indent 4 }}
{{- end }}
  labels:
    app: {{ template "opengauss.fullname" . }}
    chart: "{{ .Chart.Name }}-{{ .Chart.Version }}"
    release: "{{ .Release.Name }}"
    heritage: "{{ .Release.Service }}"
spec:
  accessModes:
    - {{ .Values.persistence.accessMode | quote }}
  resources:
    requests:
      storage: {{ .Values.persistence.size | quote }}
{{- if .Values.persistence.storageClass }}
{{- if (eq "-" .Values.persistence.storageClass) }}
  storageClassName: ""
{{- else }}
  storageClassName: "{{ .Values.persistence.storageClass }}"
{{- end }}
{{- end }}
{{- end }}
```

##### 8.通过helm安装openGauss数据库

```powershell
[root@n-k8s-m helm]# helm install opengauss2 opengauss/

NAME: opengauss2
LAST DEPLOYED: Fri Jul  9 06:36:50 2021
NAMESPACE: default
STATUS: deployed
REVISION: 1
NOTES:
1. Get the application URL by running these commands:
  export NODE_PORT=$(kubectl get --namespace default -o jsonpath="{.spec.ports[0].nodePort}" services opengauss2)
  export NODE_IP=$(kubectl get nodes --namespace default -o jsonpath="{.items[0].status.addresses[0].address}")
  echo http://$NODE_IP:$NODE_PORT
  
#查看安装列表
[root@n-k8s-m helm]# helm list
NAME            NAMESPACE       REVISION        UPDATED                                 STATUS          CHART
APP VERSION
opengauss2      default         1               2021-07-09 06:36:50.181491555 -0400 EDT deployed        opengauss-0.1.0
1.16.0
```

##### 9.检查k8s的相关资源

```powershell
[root@n-k8s-m helm]# kubectl get pvc
NAME         STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS          AGE
opengauss2   Bound    pvc-5d7ae6f4-4b73-4bcc-a6ea-db1a9c232ba8   4Gi        RWO            managed-nfs-storage   8s
[root@n-k8s-m helm]# kubectl get pod
NAME                                      READY   STATUS    RESTARTS   AGE
ingress-86f59dc97d-d7nrw                  1/1     Running   5          3d
ingress-86f59dc97d-qjsjg                  1/1     Running   5          3d
nfs-client-provisioner-6b9dc8c7cb-nsr5l   1/1     Running   5          3d
opengauss2-6f5747d6dc-7ps4b               0/1     Running   0          11s
[root@n-k8s-m templates]# kubectl get svc
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
ingress      ClusterIP   10.98.109.186   <none>        80/TCP           336d
kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP          351d
opengauss2   NodePort    10.101.6.139    <none>        5432:30118/TCP   63m
```

##### 10.连接opengauss数据库

```powershell
[root@n-k8s-m helm]# kubectl exec -it opengauss2-6f5747d6dc-7ps4b sh
sh-4.2# ls
anaconda-post.log  dev                         entrypoint.sh  home  lib64  mnt  proc  run   srv  tmp  var
bin                docker-entrypoint-initdb.d  etc            lib   media  opt  root  sbin  sys  usr
sh-4.2# id omm
uid=70(omm) gid=70(omm) groups=70(omm)
sh-4.2# su - omm
[omm@opengauss2-6f5747d6dc-7ps4b ~]$ gsql
gsql ((openGauss 2.0.0 build 78689da9) compiled at 2021-03-31 21:04:03 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

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

omm=# \c
Non-SSL connection (SSL connection is recommended when requiring high-security)
You are now connected to database "omm" as user "omm".
```

##### 11.打包openGauss
```powershell
[root@n-k8s-m helm]# helm package opengauss
Successfully packaged chart and saved it to: /root/helm/opengauss-0.1.0.tgz
```

##### 12.通过helm卸载openGauss数据库

```powershell
[root@n-k8s-m helm]# helm uninstall opengauss2
release "opengauss2" uninstalled
```

##### 13.通过openGauss包安装数据库

```powershell
[root@n-k8s-m helm]# helm install opengauss3 opengauss-0.1.0.tgz
NAME: opengauss3
LAST DEPLOYED: Fri Jul  9 08:03:06 2021
NAMESPACE: default
STATUS: deployed
REVISION: 1
NOTES:
1. Get the application URL by running these commands:
  export NODE_PORT=$(kubectl get --namespace default -o jsonpath="{.spec.ports[0].nodePort}" services opengauss3)
  export NODE_IP=$(kubectl get nodes --namespace default -o jsonpath="{.items[0].status.addresses[0].address}")
  echo http://$NODE_IP:$NODE_PORT

[root@n-k8s-m helm]# helm list
NAME            NAMESPACE       REVISION        UPDATED                                 STATUS          CHART           APP VERSION
opengauss3      default         1               2021-07-09 08:03:06.589888037 -0400 EDT deployed        opengauss-0.1.0 1.16.0
```

##### 14.最后就可以把opengauss-0.1.0.tgz上传的Helm仓库,方便openGauss的在Kubernetes的快速部署.



