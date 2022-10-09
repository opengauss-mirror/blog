+++

title = "优化openGauss官方容器源码"

date = "2022-10-09"

tags = ["openGauss技术文章征集", "container", "容器"]

archives = "2022-10"

author = "李宏达"

summary = "优化openGauss官方容器源码"

img = "/zh/post/lihongda/title/title.png"

times = "17:00"

+++


# 一、 下载源码

```s
[root@node3 ~]# git clone https://gitee.com/opengauss/openGauss-server.git
Cloning into 'openGauss-server'...
remote: Enumerating objects: 67538, done.
remote: Counting objects: 100% (21733/21733), done.
remote: Compressing objects: 100% (7802/7802), done.
remote: Total 67538 (delta 15955), reused 17513 (delta 13814), pack-reused 45805
Receiving objects: 100% (67538/67538), 203.25 MiB | 9.94 MiB/s, done.
Resolving deltas: 100% (47623/47623), done.

```

# 二、原容器镜像制作

## 1. 下载介质
```s
[root@node3 dockerfiles]# cd 3.0.0/
[root@node3 3.0.0]# ls
dockerfile_amd  dockerfile_arm  entrypoint.sh  gosu-amd64  gosu-arm64  openEuler_aarch64.repo  sha256_file_amd64  sha256_file_arm64
[root@node3 3.0.0]# wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/3.0.0/x86/openGauss-3.0.0-CentOS-64bit.tar.bz2
```

## 2. 安装docker

- yum
```s
[root@node3 dockerfiles]# yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
Loaded plugins: fastestmirror, langpacks
adding repo from: https://download.docker.com/linux/centos/docker-ce.repo
grabbing file https://download.docker.com/linux/centos/docker-ce.repo to /etc/yum.repos.d/docker-ce.repo
repo saved to /etc/yum.repos.d/docker-ce.repo
[root@node3 dockerfiles]# yum install docker-ce docker-ce-cli containerd.io -y
```
- 国内加速

```s
[root@node3 dockerfiles]# cat /etc/docker/daemon.json
{
    "registry-mirrors":[
        "https://9cpn8tt6.mirror.aliyuncs.com",
        "https://registry.docker-cn.com"
    ]
}
[root@node3 dockerfiles]# systemctl restart docker

```

## 3. buildDockerImage.sh


```s
[root@node3 dockerfiles]# sh buildDockerImage.sh -v 3.0.0
Checking Docker version.
Checking if required packages are present and valid...
openGauss-3.0.0-CentOS-64bit.tar.bz2: OK
==========================
DOCKER info:
Client:
 Context:    default
 Debug Mode: false
 Plugins:
  app: Docker App (Docker Inc., v0.9.1-beta3)
  buildx: Docker Buildx (Docker Inc., v0.9.1-docker)
  scan: Docker Scan (Docker Inc., v0.17.0)

Server:
 Containers: 0
  Running: 0
  Paused: 0
  Stopped: 0
 Images: 0
 Server Version: 20.10.18
 Storage Driver: overlay2
  Backing Filesystem: xfs
  Supports d_type: true
  Native Overlay Diff: true
  userxattr: false
 Logging Driver: json-file
 Cgroup Driver: cgroupfs
 Cgroup Version: 1
 Plugins:
  Volume: local
  Network: bridge host ipvlan macvlan null overlay
  Log: awslogs fluentd gcplogs gelf journald json-file local logentries splunk syslog
 Swarm: inactive
 Runtimes: io.containerd.runc.v2 io.containerd.runtime.v1.linux runc
 Default Runtime: runc
 Init Binary: docker-init
 containerd version: 9cd3357b7fd7218e4aec3eae239db1f68a5a6ec6
 runc version: v1.1.4-0-g5fd4c4d
 init version: de40ad0
 Security Options:
  seccomp
   Profile: default
 Kernel Version: 3.10.0-957.el7.x86_64
 Operating System: CentOS Linux 7 (Core)
 OSType: linux
 Architecture: x86_64
 CPUs: 4
 Total Memory: 7.62GiB
 Name: node3
 ID: RPLL:AKDC:SMRS:XLID:E2UB:Y6WU:HAUI:FX66:IKXO:TNZD:SRNY:TDDL
 Docker Root Dir: /var/lib/docker
 Debug Mode: false
 Registry: https://index.docker.io/v1/
 Labels:
 Experimental: false
 Insecure Registries:
  127.0.0.0/8
 Live Restore Enabled: false

==========================
Building image 'opengauss:3.0.0' ...
Sending build context to Docker daemon  101.2MB
Step 1/14 : FROM centos:7.6.1810
7.6.1810: Pulling from library/centos
ac9208207ada: Downloading [======>                                            ]  9.104MB/75.16MB
^C
[root@node3 dockerfiles]# vi /etc/docker/daemon.json
[root@node3 dockerfiles]# systemctl restart docker
[root@node3 dockerfiles]# cat /etc/docker/daemon.json
{
    "registry-mirrors":[
        "https://9cpn8tt6.mirror.aliyuncs.com",
        "https://registry.docker-cn.com"
    ]
}
[root@node3 dockerfiles]# systemctl restart docker
[root@node3 dockerfiles]# sh buildDockerImage.sh -v 3.0.0
Checking Docker version.
Checking if required packages are present and valid...
openGauss-3.0.0-CentOS-64bit.tar.bz2: OK
==========================
DOCKER info:
Client:
 Context:    default
 Debug Mode: false
 Plugins:
  app: Docker App (Docker Inc., v0.9.1-beta3)
  buildx: Docker Buildx (Docker Inc., v0.9.1-docker)
  scan: Docker Scan (Docker Inc., v0.17.0)

Server:
 Containers: 0
  Running: 0
  Paused: 0
  Stopped: 0
 Images: 0
 Server Version: 20.10.18
 Storage Driver: overlay2
  Backing Filesystem: xfs
  Supports d_type: true
  Native Overlay Diff: true
  userxattr: false
 Logging Driver: json-file
 Cgroup Driver: cgroupfs
 Cgroup Version: 1
 Plugins:
  Volume: local
  Network: bridge host ipvlan macvlan null overlay
  Log: awslogs fluentd gcplogs gelf journald json-file local logentries splunk syslog
 Swarm: inactive
 Runtimes: runc io.containerd.runc.v2 io.containerd.runtime.v1.linux
 Default Runtime: runc
 Init Binary: docker-init
 containerd version: 9cd3357b7fd7218e4aec3eae239db1f68a5a6ec6
 runc version: v1.1.4-0-g5fd4c4d
 init version: de40ad0
 Security Options:
  seccomp
   Profile: default
 Kernel Version: 3.10.0-957.el7.x86_64
 Operating System: CentOS Linux 7 (Core)
 OSType: linux
 Architecture: x86_64
 CPUs: 4
 Total Memory: 7.62GiB
 Name: node3
 ID: RPLL:AKDC:SMRS:XLID:E2UB:Y6WU:HAUI:FX66:IKXO:TNZD:SRNY:TDDL
 Docker Root Dir: /var/lib/docker
 Debug Mode: false
 Registry: https://index.docker.io/v1/
 Labels:
 Experimental: false
 Insecure Registries:
  127.0.0.0/8
 Registry Mirrors:
  https://9cpn8tt6.mirror.aliyuncs.com/
  https://registry.docker-cn.com/
 Live Restore Enabled: false

==========================
Building image 'opengauss:3.0.0' ...
Sending build context to Docker daemon  101.2MB
Step 1/14 : FROM centos:7.6.1810
7.6.1810: Pulling from library/centos
ac9208207ada: Pull complete
Digest: sha256:62d9e1c2daa91166139b51577fe4f4f6b4cc41a3a2c7fc36bd895e2a17a3e4e6
Status: Downloaded newer image for centos:7.6.1810
 ---> f1cb7c7d58b7
Step 2/14 : COPY openGauss-3.0.0-CentOS-64bit.tar.bz2 .
 ---> 1d0cbd868984
Step 3/14 : COPY gosu-amd64 /usr/local/bin/gosu
 ---> 928758582360
Step 4/14 : ENV LANG en_US.utf8
 ---> Running in 9aa647847dd5
Removing intermediate container 9aa647847dd5
 ---> e221f4ad7757
Step 5/14 : RUN set -eux;     yum install -y bzip2 bzip2-devel curl libaio&&     groupadd -g 70 omm;      useradd -u 70 -g omm -d /home/omm omm;      mkdir -p /var/lib/opengauss &&     mkdir -p /usr/local/opengauss &&     mkdir -p /var/run/opengauss  &&     mkdir /docker-entrypoint-initdb.d &&     tar -jxf openGauss-3.0.0-CentOS-64bit.tar.bz2 -C /usr/local/opengauss &&     chown -R omm:omm /var/run/opengauss && chown -R omm:omm /usr/local/opengauss && chown -R omm:omm /var/lib/opengauss &&  chown -R omm:omm /docker-entrypoint-initdb.d &&     chmod 2777 /var/run/opengauss &&     rm -rf openGauss-3.0.0-CentOS-64bit.tar.bz2 && yum clean all
 ---> Running in c24660db34d1
+ yum install -y bzip2 bzip2-devel curl libaio
Loaded plugins: fastestmirror, ovl
Determining fastest mirrors
 * base: mirrors.bupt.edu.cn
 * extras: mirrors.bupt.edu.cn
 * updates: mirrors.bupt.edu.cn
Resolving Dependencies
--> Running transaction check
---> Package bzip2.x86_64 0:1.0.6-13.el7 will be installed
---> Package bzip2-devel.x86_64 0:1.0.6-13.el7 will be installed
---> Package curl.x86_64 0:7.29.0-51.el7 will be updated
---> Package curl.x86_64 0:7.29.0-59.el7_9.1 will be an update
--> Processing Dependency: libcurl = 7.29.0-59.el7_9.1 for package: curl-7.29.0-59.el7_9.1.x86_64
---> Package libaio.x86_64 0:0.3.109-13.el7 will be installed
--> Running transaction check
---> Package libcurl.x86_64 0:7.29.0-51.el7 will be updated
---> Package libcurl.x86_64 0:7.29.0-59.el7_9.1 will be an update
--> Processing Dependency: libssh2(x86-64) >= 1.8.0 for package: libcurl-7.29.0-59.el7_9.1.x86_64
--> Running transaction check
---> Package libssh2.x86_64 0:1.4.3-12.el7 will be updated
---> Package libssh2.x86_64 0:1.8.0-4.el7 will be an update
--> Finished Dependency Resolution

Dependencies Resolved

================================================================================
 Package            Arch          Version                  Repository      Size
================================================================================
Installing:
 bzip2              x86_64        1.0.6-13.el7             base            52 k
 bzip2-devel        x86_64        1.0.6-13.el7             base           218 k
 libaio             x86_64        0.3.109-13.el7           base            24 k
Updating:
 curl               x86_64        7.29.0-59.el7_9.1        updates        271 k
Updating for dependencies:
 libcurl            x86_64        7.29.0-59.el7_9.1        updates        223 k
 libssh2            x86_64        1.8.0-4.el7              base            88 k

Transaction Summary
================================================================================
Install  3 Packages
Upgrade  1 Package  (+2 Dependent packages)

Total download size: 876 k
Downloading packages:
Delta RPMs disabled because /usr/bin/applydeltarpm not installed.
warning: /var/cache/yum/x86_64/7/base/packages/bzip2-devel-1.0.6-13.el7.x86_64.rpm: Header V3 RSA/SHA256 Signature, key ID f4a80eb5: NOKEY
Public key for bzip2-devel-1.0.6-13.el7.x86_64.rpm is not installed
Public key for curl-7.29.0-59.el7_9.1.x86_64.rpm is not installed
--------------------------------------------------------------------------------
Total                                              2.3 MB/s | 876 kB  00:00
Retrieving key from file:///etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-7
Importing GPG key 0xF4A80EB5:
 Userid     : "CentOS-7 Key (CentOS 7 Official Signing Key) <security@centos.org>"
 Fingerprint: 6341 ab27 53d7 8a78 a7c2 7bb1 24c6 a8a7 f4a8 0eb5
 Package    : centos-release-7-6.1810.2.el7.centos.x86_64 (@CentOS)
 From       : /etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-7
Running transaction check
Running transaction test
Transaction test succeeded
Running transaction
  Updating   : libssh2-1.8.0-4.el7.x86_64                                   1/9
  Updating   : libcurl-7.29.0-59.el7_9.1.x86_64                             2/9
  Updating   : curl-7.29.0-59.el7_9.1.x86_64                                3/9
  Installing : libaio-0.3.109-13.el7.x86_64                                 4/9
  Installing : bzip2-1.0.6-13.el7.x86_64                                    5/9
  Installing : bzip2-devel-1.0.6-13.el7.x86_64                              6/9
  Cleanup    : curl-7.29.0-51.el7.x86_64                                    7/9
  Cleanup    : libcurl-7.29.0-51.el7.x86_64                                 8/9
  Cleanup    : libssh2-1.4.3-12.el7.x86_64                                  9/9
  Verifying  : bzip2-devel-1.0.6-13.el7.x86_64                              1/9
  Verifying  : curl-7.29.0-59.el7_9.1.x86_64                                2/9
  Verifying  : libssh2-1.8.0-4.el7.x86_64                                   3/9
  Verifying  : bzip2-1.0.6-13.el7.x86_64                                    4/9
  Verifying  : libcurl-7.29.0-59.el7_9.1.x86_64                             5/9
  Verifying  : libaio-0.3.109-13.el7.x86_64                                 6/9
  Verifying  : curl-7.29.0-51.el7.x86_64                                    7/9
  Verifying  : libssh2-1.4.3-12.el7.x86_64                                  8/9
  Verifying  : libcurl-7.29.0-51.el7.x86_64                                 9/9

Installed:
  bzip2.x86_64 0:1.0.6-13.el7           bzip2-devel.x86_64 0:1.0.6-13.el7
  libaio.x86_64 0:0.3.109-13.el7

Updated:
  curl.x86_64 0:7.29.0-59.el7_9.1

Dependency Updated:
  libcurl.x86_64 0:7.29.0-59.el7_9.1        libssh2.x86_64 0:1.8.0-4.el7

Complete!
+ groupadd -g 70 omm
+ useradd -u 70 -g omm -d /home/omm omm
+ mkdir -p /var/lib/opengauss
+ mkdir -p /usr/local/opengauss
+ mkdir -p /var/run/opengauss
+ mkdir /docker-entrypoint-initdb.d
+ tar -jxf openGauss-3.0.0-CentOS-64bit.tar.bz2 -C /usr/local/opengauss
+ chown -R omm:omm /var/run/opengauss
+ chown -R omm:omm /usr/local/opengauss
+ chown -R omm:omm /var/lib/opengauss
+ chown -R omm:omm /docker-entrypoint-initdb.d
+ chmod 2777 /var/run/opengauss
+ rm -rf openGauss-3.0.0-CentOS-64bit.tar.bz2
+ yum clean all
Loaded plugins: fastestmirror, ovl
Cleaning repos: base extras updates
Cleaning up list of fastest mirrors
Removing intermediate container c24660db34d1
 ---> f4ae499280cf
Step 6/14 : RUN set -eux;     echo "export GAUSSHOME=/usr/local/opengauss"  >> /home/omm/.bashrc &&     echo "export PATH=\$GAUSSHOME/bin:\$PATH " >> /home/omm/.bashrc &&     echo "export LD_LIBRARY_PATH=\$GAUSSHOME/lib:\$LD_LIBRARY_PATH" >> /home/omm/.bashrc
 ---> Running in 2476e733860c
+ echo 'export GAUSSHOME=/usr/local/opengauss'
+ echo 'export PATH=$GAUSSHOME/bin:$PATH '
+ echo 'export LD_LIBRARY_PATH=$GAUSSHOME/lib:$LD_LIBRARY_PATH'
Removing intermediate container 2476e733860c
 ---> d3ef4604a117
Step 7/14 : ENV GOSU_VERSION 1.12
 ---> Running in f9651ff17661
Removing intermediate container f9651ff17661
 ---> 09120578b30d
Step 8/14 : RUN set -eux;      chmod +x /usr/local/bin/gosu
 ---> Running in f3e98497815c
+ chmod +x /usr/local/bin/gosu
Removing intermediate container f3e98497815c
 ---> 49ea79f289ca
Step 9/14 : ENV PGDATA /var/lib/opengauss/data
 ---> Running in 8904d7dd69f7
Removing intermediate container 8904d7dd69f7
 ---> e7bd16787dd3
Step 10/14 : COPY entrypoint.sh /usr/local/bin/
 ---> a76ddb916acd
Step 11/14 : RUN chmod 755 /usr/local/bin/entrypoint.sh;ln -s /usr/local/bin/entrypoint.sh / # backwards compat
 ---> Running in f9d0c641357b
Removing intermediate container f9d0c641357b
 ---> ddd27afee5a5
Step 12/14 : ENTRYPOINT ["entrypoint.sh"]
 ---> Running in f5b70bbdc217
Removing intermediate container f5b70bbdc217
 ---> cd3a184c91ad
Step 13/14 : EXPOSE 5432
 ---> Running in 82b77be1ebe9
Removing intermediate container 82b77be1ebe9
 ---> 1ebed742aefc
Step 14/14 : CMD ["gaussdb"]
 ---> Running in 66fc27eca766
Removing intermediate container 66fc27eca766
 ---> 18f4347e4d04
Successfully built 18f4347e4d04
Successfully tagged opengauss:3.0.0


  openGauss Docker Image  3.0.0 is ready to be extended:

    --> opengauss:3.0.0

  Build completed in 90 seconds.
```

## 4. 启动容器

- image
```s
[root@node3 dockerfiles]# docker image ls
REPOSITORY   TAG        IMAGE ID       CREATED          SIZE
opengauss    3.0.0      18f4347e4d04   11 seconds ago   663MB
centos       7.6.1810   f1cb7c7d58b7   3 years ago      202MB
```
- run

```s
[root@node3 dockerfiles]# docker run --name opengauss_3.0.0 --privileged=true -d -e GS_PASSWORD=GaussDB@123 opengauss:3.0.0
77e79f91e71082fd0fff3376adb8de2dbfc4eb257ec0fd5c60d4b110c79e8d9f
[root@node3 dockerfiles]# docker logs opengauss_3.0.0 -f

                        Message: The supplied GS_PASSWORD is meet requirements.

The files belonging to this database system will be owned by user "omm".
This user must also own the server process.

The database cluster will be initialized with locale "en_US.utf8".
The default database encoding has accordingly been set to "UTF8".
The default text search configuration will be set to "english".

fixing permissions on existing directory /var/lib/opengauss/data ... ok
creating subdirectories ... ok
selecting default max_connections ... 100
selecting default shared_buffers ... 32MB
creating configuration files ... ok
Begin init undo subsystem meta.
[INIT UNDO] Init undo subsystem meta successfully.
creating template1 database in /var/lib/opengauss/data/base/1 ... The core dump path is an invalid directory
2022-10-09 01:40:26.710 [unknown] [unknown] localhost 140475676310592 0[0:0#0]  [BACKEND] WARNING:  macAddr is 578/2886795266, sysidentifier is 37923857/137466, randomNum is 593369338
ok
initializing pg_authid ... ok
setting password ... ok
initializing dependencies ... ok
loading PL/pgSQL server-side language ... ok
creating system views ... ok
creating performance views ... ok
loading system objects' descriptions ... ok
creating collations ... ok
creating conversions ... ok
creating dictionaries ... ok
setting privileges on built-in objects ... ok
initialize global configure for bucketmap length ... ok
creating information schema ... ok
loading foreign-data wrapper for distfs access ... ok
loading foreign-data wrapper for hdfs access ... ok
loading foreign-data wrapper for log access ... ok
loading hstore extension ... ok
loading foreign-data wrapper for MOT access ... ok
loading security plugin ... ok
update system tables ... ok
creating snapshots catalog ... ok
vacuuming database template1 ... ok
copying template1 to template0 ... ok
copying template1 to postgres ... ok
freezing database template0 ... ok
freezing database template1 ... ok
freezing database postgres ... ok

...
...


[0:0#0]  0 [EXECUTOR] ACTION:  Please refer to backend log for more details.

```

- gsql

```s
[root@node3 dockerfiles]# docker exec -it opengauss_3.0.0 bash
[root@77e79f91e710 /]# su - omm
[omm@77e79f91e710 ~]$ gsql -d postgres -p5432 -r
gsql ((openGauss 3.0.0 build 02c14696) compiled at 2022-04-01 18:12:34 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=# select version();
                                                                       version
------------------------------------------------------------------------------------------------------------------------------------------------------
 (openGauss 3.0.0 build 02c14696) compiled at 2022-04-01 18:12:34 commit 0 last mr   on x86_64-unknown-linux-gnu, compiled by g++ (GCC) 7.3.0, 64-bit
(1 row)


```


# 三、新容器镜像制作


## 1. clone目录

```s
[root@node3 dockerfiles]# cp -r 3.0.0/ 3.1.0
[root@node3 dockerfiles]# cd 3.1.0/
[root@node3 3.1.0]# ll
total 98812
-rw-r--r-- 1 root root     1373 Oct  9 09:43 dockerfile_amd
-rw-r--r-- 1 root root     1457 Oct  9 09:43 dockerfile_arm
-rw-r--r-- 1 root root    17730 Oct  9 09:43 entrypoint.sh
-rw-r--r-- 1 root root  2404352 Oct  9 09:43 gosu-amd64
-rw-r--r-- 1 root root  2490368 Oct  9 09:43 gosu-arm64
-rw-r--r-- 1 root root     1688 Oct  9 09:43 openEuler_aarch64.repo
-rw-r--r-- 1 root root 96246093 Oct  9 09:43 openGauss-3.0.0-CentOS-64bit.tar.bz2
-rw-r--r-- 1 root root      103 Oct  9 09:43 sha256_file_amd64
-rw-r--r-- 1 root root      106 Oct  9 09:43 sha256_file_arm64
[root@node3 3.1.0]# rm -f openGauss-3.0.0-CentOS-64bit.tar.bz2

```

## 2. 修改配置文件

- dockerfile_amd

```s
[root@ecs-lee 3.1.0]# cat dockerfile_amd
FROM centos:7.6.1810 as builder
RUN set -eux; \
    yum install -y \
    wget && \
    wget https://github.com/tianon/gosu/releases/download/1.14/gosu-amd64 && \
    wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/3.1.0/x86/openGauss-3.1.0-CentOS-64bit.tar.bz2

FROM centos:7.6.1810
COPY --from=builder /gosu-amd64  /usr/local/bin/gosu
#COPY gosu-amd64 /usr/local/bin/gosu
COPY --from=builder /openGauss-3.1.0-CentOS-64bit.tar.bz2 /tmp
#COPY openGauss-3.1.0-CentOS-64bit.tar.bz2 /tmp
COPY entrypoint.sh /usr/local/bin/

ENV LANG en_US.utf8
ENV PGDATA /var/lib/opengauss/data

RUN set -eux; \
    yum install -y \
    bzip2 \
    bzip2-devel \
    libaio-devel && \
    groupadd -g 70 omm;  \
    useradd -u 70 -g omm -m -s /bin/bash omm;  \
    mkdir -p /var/lib/opengauss && \
    mkdir -p /usr/local/opengauss && \
    mkdir -p /var/run/opengauss  && \
    mkdir /docker-entrypoint-initdb.d && \
    tar -xf /tmp/openGauss-3.1.0-CentOS-64bit.tar.bz2 -C /usr/local/opengauss && \
    chown -R omm:omm /var/lib/opengauss /home/omm /var/run/opengauss /docker-entrypoint-initdb.d /usr/local/opengauss/ && \
    chmod 755 -R /usr/local/opengauss && \
    rm -f /tmp/openGauss-3.1.0-CentOS-64bit.tar.bz2 && \
    yum clean all && \
    echo "export GAUSSHOME=/usr/local/opengauss"  >> /home/omm/.bashrc && \
    echo "export PATH=\$GAUSSHOME/bin:\$PATH " >> /home/omm/.bashrc && \
    echo "export LD_LIBRARY_PATH=\$GAUSSHOME/lib:\$LD_LIBRARY_PATH" >> /home/omm/.bashrc && \
    echo "export GAUSSLOG=/var/lib/opengauss/data/pg_log" >> /home/omm/.bashrc && \
    echo "export PGDATA=/var/lib/opengauss/data" >> /home/omm/.bashrc && \
    echo "\set PROMPT1 'openGauss%R%#'" >> /home/omm/.gsqlrc && \
    echo "\set PROMPT2 '#'" >> /home/omm/.gsqlrc && \
    echo "\set PROMPT3 '>'" >> /home/omm/.gsqlrc && \
    chown -R omm:omm /home/omm && \
    chmod +x /usr/local/bin/gosu && \
    chmod 755 /usr/local/bin/entrypoint.sh && \
    ln -s /usr/local/bin/entrypoint.sh /

ENTRYPOINT ["entrypoint.sh"]
EXPOSE 5432
CMD ["gaussdb"]

```

- entrypoint.sh

```s
[root@ecs-lee 3.1.0]# cat entrypoint.sh
#!/usr/bin/env bash
set -Eeo pipefail

# usage: file_env VAR [DEFAULT]
#    ie: file_env 'XYZ_DB_PASSWORD' 'example'
# (will allow for "$XYZ_DB_PASSWORD_FILE" to fill in the value of
#  "$XYZ_DB_PASSWORD" from a file, especially for Docker's secrets feature)

export GAUSSHOME=/usr/local/opengauss
export PATH=$GAUSSHOME/bin:$PATH
export LD_LIBRARY_PATH=$GAUSSHOME/lib:$LD_LIBRARY_PATH
export LANG=en_US.UTF-8
export PGDATA=/var/lib/opengauss/data

file_env() {
        local var="$1"
        local fileVar="${var}_FILE"
        local def="${2:-}"
        if [ "${!var:-}" ] && [ "${!fileVar:-}" ]; then
                echo >&2 "error: both $var and $fileVar are set (but are exclusive)"
                exit 1
        fi
        local val="$def"
        if [ "${!var:-}" ]; then
                val="${!var}"
        elif [ "${!fileVar:-}" ]; then
                val="$(< "${!fileVar}")"
        fi
        export "$var"="$val"
        unset "$fileVar"
}

# check to see if this file is being run or sourced from another script
_is_sourced() {
        [ "${#FUNCNAME[@]}" -ge 2 ] \
                && [ "${FUNCNAME[0]}" = '_is_sourced' ] \
                && [ "${FUNCNAME[1]}" = 'source' ]
}

# used to create initial opengauss directories and if run as root, ensure ownership belong to the omm user
docker_create_db_directories() {
        local user; user="$(id -u)"

        mkdir -p "$PGDATA"
        chmod 700 "$PGDATA"

        # ignore failure since it will be fine when using the image provided directory;
        mkdir -p /var/run/opengauss || :
        chmod 775 /var/run/opengauss || :

        # Create the transaction log directory before initdb is run so the directory is owned by the correct user
        if [ -n "$POSTGRES_INITDB_XLOGDIR" ]; then
                mkdir -p "$POSTGRES_INITDB_XLOGDIR"
                if [ "$user" = '0' ]; then
                        find "$POSTGRES_INITDB_XLOGDIR" \! -user postgres -exec chown postgres '{}' +
                fi
                chmod 700 "$POSTGRES_INITDB_XLOGDIR"
        fi

        # allow the container to be started with `--user`
        if [ "$user" = '0' ]; then
                find "$PGDATA" \! -user omm -exec chown omm '{}' +
                find /var/run/opengauss \! -user omm -exec chown omm '{}' +
        fi
}

# initialize empty PGDATA directory with new database via 'initdb'
# arguments to `initdb` can be passed via POSTGRES_INITDB_ARGS or as arguments to this function
# `initdb` automatically creates the "postgres", "template0", and "template1" dbnames
# this is also where the database user is created, specified by `GS_USER` env
docker_init_database_dir() {
        # "initdb" is particular about the current user existing in "/etc/passwd", so we use "nss_wrapper" to fake that if necessary
        if ! getent passwd "$(id -u)" &> /dev/null && [ -e /usr/lib/libnss_wrapper.so ]; then
                export LD_PRELOAD='/usr/lib/libnss_wrapper.so'
                export NSS_WRAPPER_PASSWD="$(mktemp)"
                export NSS_WRAPPER_GROUP="$(mktemp)"
                echo "postgres:x:$(id -u):$(id -g):PostgreSQL:$PGDATA:/bin/false" > "$NSS_WRAPPER_PASSWD"
                echo "postgres:x:$(id -g):" > "$NSS_WRAPPER_GROUP"
        fi



        eval $cmdbase

        # unset/cleanup "nss_wrapper" bits
        if [ "${LD_PRELOAD:-}" = '/usr/lib/libnss_wrapper.so' ]; then
                rm -f "$NSS_WRAPPER_PASSWD" "$NSS_WRAPPER_GROUP"
                unset LD_PRELOAD NSS_WRAPPER_PASSWD NSS_WRAPPER_GROUP
        fi
}

# print large warning if GS_PASSWORD is long
# error if both GS_PASSWORD is empty and GS_HOST_AUTH_METHOD is not 'trust'
# print large warning if GS_HOST_AUTH_METHOD is set to 'trust'
# assumes database is not set up, ie: [ -z "$DATABASE_ALREADY_EXISTS" ]
docker_verify_minimum_env() {

# set param

        cmdbase="gs_initdb "

                   echo -e "                        ********************************************************************************"
        if [ -n "$GS_XLOGDIR" ]; then
                cmdbase="$cmdbase --xlogdir=$GS_XLOGDIR"
                   echo -e "                        Message: GS_XLOGDIR is ${PGDATA}/xlog."
        else
                cmdbase="$cmdbase --xlogdir=$GS_XLOGDIR"
                GS_XLOGDIR=${PGDATA}/xlog
                   echo -e "                        Message: Default GS_XLOGDIR is ${PGDATA}/xlog."
        fi

        if [ -n "$GS_NODENAME" ]; then
                cmdbase="$cmdbase --nodename=$GS_NODENAME"
                   echo -e "                        Message: GS_NODENAME is ${GS_NODENAME}"
        else
                cmdbase="$cmdbase --nodename=opengauss"
                GS_NODENAME=opengauss
                   echo -e "                        Message: Default GS_NODENAME is ${GS_NODENAME}."
        fi

        if [ -n "$ENCODING" ]; then
                cmdbase="$cmdbase --encoding=$ENCODING"
                   echo -e "                        Message: ENCODING is ${ENCODING}"
        else
                cmdbase="$cmdbase --encoding=UTF-8"
                ENCODING=UTF-8
                   echo -e "                        Message: Default ENCODING is ${ENCODING}."
        fi

        if [ -n "$LOCALE" ]; then
                cmdbase="$cmdbase --locale=$LOCALE"
                   echo -e "                        Message: LOCALE is ${LOCALE}"
        else
                cmdbase="$cmdbase --no-locale"
                LOCALE=--no-locale
                   echo -e "                        Message: Default LOCALE is ${LOCALE}."
        fi

        if [ -n "$DBCOMPATIBILITY" ]; then
                cmdbase="$cmdbase --dbcompatibility=$DBCOMPATIBILITY"
                   echo -e "                        Message: DBCOMPATIBILITY is ${DBCOMPATIBILITY}"
        else
                cmdbase="$cmdbase --dbcompatibility=PG"
                DBCOMPATIBILITY=PG
                   echo -e "                        Message: Default DBCOMPATIBILITY is ${DBCOMPATIBILITY}."
        fi

        if [ -n "$GS_PASSWORD" ]; then
                cmdbase="$cmdbase --pwpasswd=$GS_PASSWORD"
                   echo -e "                        Message: GS_PASSWORD is ${GS_PASSWORD}"
        else
                randpw(){ < /dev/urandom tr -dc '^(.*[#?!@$%^&*-]).*$_A-Z-a-z-0-9' | head -c${1:-4};echo;}
                GS_PASSWORD=`randpw`"Aa1!"

                cmdbase="$cmdbase --pwpasswd=$GS_PASSWORD"
                   echo -e "                        Message: Default GS_PASSWORD is "${GS_PASSWORD}"."
        fi

                   echo -e "                        ********************************************************************************"

        cmdbase="$cmdbase -D $PGDATA"

        # check password first so we can output the warning before postgres
        # messes it up
        if [[ "$GS_PASSWORD" =~  ^(.{8,}).*$ ]] &&  [[ "$GS_PASSWORD" =~ ^(.*[a-z]+).*$ ]] && [[ "$GS_PASSWORD" =~ ^(.*[A-Z]).*$ ]] &&  [[ "$GS_PASSWORD" =~ ^(.*[0-9]).*$ ]] && [[ "$GS_PASSWORD" =~ ^(.*[#?!@$%^&*-+]).*$ ]]; then

                   echo -e "                        Message: The supplied GS_PASSWORD $GS_PASSWORD is meet requirements."

        else
                   echo -e "                                                Error: The supplied GS_PASSWORD $GS_PASSWORD is not meet requirements."
                 cat >&2 <<-'EOWARN'

                        Please Check if the password contains uppercase, lowercase, numbers, special characters, and password length(8).
                        At least one uppercase, lowercase, numeric, special character.
                        Example: Enmo@123
EOWARN
       exit 1
        fi
        if [ -z "$GS_PASSWORD" ] && [ 'trust' != "$GS_HOST_AUTH_METHOD" ]; then
                # The - option suppresses leading tabs but *not* spaces. :)
                cat >&2 <<-'EOE'
                        Error: Database is uninitialized and superuser password is not specified.
                               You must specify GS_PASSWORD to a non-empty value for the
                               superuser. For example, "-e GS_PASSWORD=password" on "docker run".

                               You may also use "GS_HOST_AUTH_METHOD=trust" to allow all
                               connections without a password. This is *not* recommended.

EOE
                exit 1
        fi
        if [ 'trust' = "$GS_HOST_AUTH_METHOD" ]; then
                cat >&2 <<-'EOWARN'
                        ********************************************************************************
                        WARNING: GS_HOST_AUTH_METHOD has been set to "trust". This will allow
                                 anyone with access to the opengauss port to access your database without
                                 a password, even if GS_PASSWORD is set.
                                 It is not recommended to use GS_HOST_AUTH_METHOD=trust. Replace
                                 it with "-e GS_PASSWORD=password" instead to set a password in
                                 "docker run".
                        ********************************************************************************
EOWARN
        fi
}

# usage: docker_process_init_files [file [file [...]]]
#    ie: docker_process_init_files /always-initdb.d/*
# process initializer files, based on file extensions and permissions
docker_process_init_files() {
        # gsql here for backwards compatiblilty "${gsql[@]}"
        gsql=( docker_process_sql )

        echo
        local f
        for f; do
                case "$f" in
                        *.sh)
                                if [ -x "$f" ]; then
                                        echo "$0: running $f"
                                        "$f"
                                else
                                        echo "$0: sourcing $f"
                                        . "$f"
                                fi
                                ;;
                        *.sql)    echo "$0: running $f"; docker_process_sql -f "$f"; echo ;;
                        *.sql.gz) echo "$0: running $f"; gunzip -c "$f" | docker_process_sql; echo ;;
                        *.sql.xz) echo "$0: running $f"; xzcat "$f" | docker_process_sql; echo ;;
                        *)        echo "$0: ignoring $f" ;;
                esac
                echo
        done
}

# Execute sql script, passed via stdin (or -f flag of pqsl)
# usage: docker_process_sql [gsql-cli-args]
#    ie: docker_process_sql --dbname=mydb <<<'INSERT ...'
#    ie: docker_process_sql -f my-file.sql
#    ie: docker_process_sql <my-file.sql
docker_process_sql() {
        local query_runner=( gsql -v ON_ERROR_STOP=1 --username "$GS_USER" --dbname postgres)

        echo "Execute SQL: ${query_runner[@]} $@"
        "${query_runner[@]}" "$@"
}

# create initial database
# uses environment variables for input: GS_DB
docker_setup_db() {
                 docker_process_sql --set passwd="$GS_PASSWORD" <<-'EOSQL'
                        create user opengauss with login password :"passwd" ;
                        CREATE DATABASE opengauss;
                        grant all privileges to opengauss;
                        ALTER USER opengauss MONADMIN;

EOSQL
}




docker_setup_user() {
        if [ -n "$GS_USERNAME" ]; then
                GS_DB= docker_process_sql  --set passwd="$GS_PASSWORD" --set user="$GS_USERNAME" <<-'EOSQL'
                        create user :"user" with login password :"passwd" ;
EOSQL
        else
                echo " default user is opengauss"
                   echo -e "                        Message: Default GS_USERNAME is ${GS_USERNAME}."
        fi
}


docker_setup_rep_user() {
        if [ -n "$SERVER_MODE" ] && [ "$SERVER_MODE" = "primary" ]; then
                GS_DB= docker_process_sql  --set passwd="$GS_PASSWORD" --set user="repuser" <<-'EOSQL'
                        create user :"user" SYSADMIN REPLICATION password :"passwd" ;
EOSQL
        else
                echo " default no repuser created"
        fi
}

# Loads various settings that are used elsewhere in the script
# This should be called before any other functions
docker_setup_env() {

        # default authentication method is md5
        : "${GS_HOST_AUTH_METHOD:=md5}"

        declare -g DATABASE_ALREADY_EXISTS
        # look specifically for OG_VERSION, as it is expected in the DB dir
        if [ -s "$PGDATA/PG_VERSION" ]; then
                DATABASE_ALREADY_EXISTS='true'
        fi
}

# append GS_HOST_AUTH_METHOD to pg_hba.conf for "host" connections
opengauss_setup_hba_conf() {
        {
                echo
                if [ 'trust' = "$GS_HOST_AUTH_METHOD" ]; then
                        echo '# warning trust is enabled for all connections'
                fi
                echo "host all all 0.0.0.0/0 $GS_HOST_AUTH_METHOD"
                if [ -n "$SERVER_MODE" ]; then
                    echo "host replication repuser $OG_SUBNET trust"
                fi
        } >> "$PGDATA/pg_hba.conf"
}

# append parameter to postgres.conf for connections
opengauss_setup_postgresql_conf() {
        {
                echo
                if [ -n "$GS_PORT" ]; then
                    echo "password_encryption_type = 1"
                    echo "port = $GS_PORT"
                    echo "wal_level = logical"
                else
                    echo '# use default port 5432'
                    echo "password_encryption_type = 1"
                    echo "wal_level = logical"
                fi

                if [ -n "$SERVER_MODE" ]; then
                    echo "listen_addresses = '0.0.0.0'"
                    echo "most_available_sync = on"
                    echo "remote_read_mode = non_authentication"
                    echo "pgxc_node_name = '$NODE_NAME'"
                    # echo "application_name = '$NODE_NAME'"
                    if [ "$SERVER_MODE" = "primary" ]; then
                        echo "max_connections = 100"
                    else
                        echo "max_connections = 100"
                    fi
                    echo -e "$REPL_CONN_INFO"
                    if [ -n "$SYNCHRONOUS_STANDBY_NAMES" ]; then
                        echo "synchronous_standby_names=$SYNCHRONOUS_STANDBY_NAMES"
                    fi
                else
                    echo "listen_addresses = '*'"
                fi

                if [ -n "$OTHER_PG_CONF" ]; then
                    echo -e "$OTHER_PG_CONF"
                fi
        } >> "$PGDATA/postgresql.conf"
}

opengauss_setup_mot_conf() {
         echo "enable_numa = false" >> "$PGDATA/mot.conf"
}

# start socket-only postgresql server for setting up or running scripts
# all arguments will be passed along as arguments to `postgres` (via pg_ctl)
docker_temp_server_start() {
        if [ "$1" = 'gaussdb' ]; then
                shift
        fi

        # internal start of server in order to allow setup using gsql client
        # does not listen on external TCP/IP and waits until start finishes
        set -- "$@" -c listen_addresses='127.0.0.1' -p "${PGPORT:-5432}"

        PGUSER="${PGUSER:-$GS_USER}" \
        gs_ctl -D "$PGDATA" \
                -o "$(printf '%q ' "$@")" \
                -w start
}

# stop postgresql server after done setting up user and running scripts
docker_temp_server_stop() {
        PGUSER="${PGUSER:-postgres}" \
        gs_ctl -D "$PGDATA" -m fast -w stop

}

docker_slave_full_backup() {
        gs_ctl build -D "$PGDATA" -b full
}

# check arguments for an option that would cause opengauss to stop
# return true if there is one

_opengauss_want_help() {
        local arg
        count=1
        for arg; do
                case "$arg" in
                        # postgres --help | grep 'then exit'
                        # leaving out -C on purpose since it always fails and is unhelpful:
                        # postgres: could not access the server configuration file "/var/lib/postgresql/data/postgresql.conf": No such file or directory
                        -'?'|--help|--describe-config|-V|--version)
                                return 0
                                ;;
                esac
                if [ "$arg" == "-M" ]; then
                        SERVER_MODE=${@:$count+1:1}
                        echo "openGauss DB SERVER_MODE = $SERVER_MODE"
                        shift
                fi
                count=$[$count + 1]
        done
        return 1
}

_main() {
        # if first arg looks like a flag, assume we want to run postgres server
        if [ "${1:0:1}" = '-' ]; then
                set -- gaussdb "$@"
        fi

        if [ "$1" = 'gaussdb' ] && ! _opengauss_want_help "$@"; then
                docker_setup_env
                # setup data directories and permissions (when run as root)
                docker_create_db_directories
                if [ "$(id -u)" = '0' ]; then
                        # then restart script as postgres user
                        exec gosu omm "$BASH_SOURCE" "$@"
                fi

                # only run initialization on an empty data directory
                if [ -z "$DATABASE_ALREADY_EXISTS" ]; then
                        docker_verify_minimum_env

                        # check dir permissions to reduce likelihood of half-initialized database
                        ls /docker-entrypoint-initdb.d/ > /dev/null

                        docker_init_database_dir
                        opengauss_setup_hba_conf
                        opengauss_setup_postgresql_conf
                        opengauss_setup_mot_conf

                        # PGPASSWORD is required for gsql when authentication is required for 'local' connections via pg_hba.conf and is otherwise harmless
                        # e.g. when '--auth=md5' or '--auth-local=md5' is used in POSTGRES_INITDB_ARGS
                        export PGPASSWORD="${PGPASSWORD:-$GS_PASSWORD}"
                        docker_temp_server_start "$@"
                        if [ -z "$SERVER_MODE" ] || [ "$SERVER_MODE" = "primary" ]; then

                        docker_setup_user
                        docker_setup_rep_user
                        docker_setup_db
                        docker_process_init_files /docker-entrypoint-initdb.d/*
                        fi

                        if [ -n "$SERVER_MODE" ] && [ "$SERVER_MODE" != "primary" ]; then
                            docker_slave_full_backup
                        fi
                        docker_temp_server_stop
                        unset PGPASSWORD

                        echo
                        echo 'openGauss  init process complete; ready for start up.'
                        echo
                else
                        echo
                        echo 'openGauss Database directory appears to contain a database; Skipping initialization'
                        echo
                fi
        fi
        exec "$@"
}

if ! _is_sourced; then
        _main "$@"
fi

```

- sha256_file_amd64

```s
[root@ecs-lee 3.1.0]# cat sha256_file_amd64
9cf6f2762664d67889b4cd8d879c14a7f1dae70cff0552e4a7263a301b336115  openGauss-3.1.0-CentOS-64bit.tar.bz2
```

## 3. buildDockerImage.sh

```s
[root@ecs-lee dockerfiles]# sh buildDockerImage.sh -v 3.1.0 -i
...
...

==========================
Building image 'opengauss:3.1.0' ...
Sending build context to Docker daemon  24.58kB
Step 1/12 : FROM centos:7.6.1810 as builder
 ---> f1cb7c7d58b7
Step 2/12 : RUN set -eux;     yum install -y     wget &&     wget https://github.com/tianon/gosu/releases/download/1.14/gosu-amd64 &&     wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/3.1.0/x86/openGauss-3.1.0-CentOS-64bit.tar.bz2
 ---> Running in 81f2e272d525
+ yum install -y wget
Loaded plugins: fastestmirror, ovl
Determining fastest mirrors
 * base: mirrors.bupt.edu.cn
 * extras: mirrors.tuna.tsinghua.edu.cn
 * updates: mirrors.bupt.edu.cn
Resolving Dependencies
--> Running transaction check
---> Package wget.x86_64 0:1.14-18.el7_6.1 will be installed
--> Finished Dependency Resolution

Dependencies Resolved

================================================================================
 Package        Arch             Version                   Repository      Size
================================================================================
Installing:
 wget           x86_64           1.14-18.el7_6.1           base           547 k

Transaction Summary
================================================================================
Install  1 Package

Total download size: 547 k
Installed size: 2.0 M
Downloading packages:
warning: /var/cache/yum/x86_64/7/base/packages/wget-1.14-18.el7_6.1.x86_64.rpm: Header V3 RSA/SHA256 Signature, key ID f4a80eb5: NOKEY
Public key for wget-1.14-18.el7_6.1.x86_64.rpm is not installed
Retrieving key from file:///etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-7
Importing GPG key 0xF4A80EB5:
 Userid     : "CentOS-7 Key (CentOS 7 Official Signing Key) <security@centos.org>"
 Fingerprint: 6341 ab27 53d7 8a78 a7c2 7bb1 24c6 a8a7 f4a8 0eb5
 Package    : centos-release-7-6.1810.2.el7.centos.x86_64 (@CentOS)
 From       : /etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-7
Running transaction check
Running transaction test
Transaction test succeeded
Running transaction
  Installing : wget-1.14-18.el7_6.1.x86_64                                  1/1
install-info: No such file or directory for /usr/share/info/wget.info.gz
  Verifying  : wget-1.14-18.el7_6.1.x86_64                                  1/1

Installed:
  wget.x86_64 0:1.14-18.el7_6.1

Complete!
+ wget https://github.com/tianon/gosu/releases/download/1.14/gosu-amd64
--2022-10-09 07:43:31--  https://github.com/tianon/gosu/releases/download/1.14/gosu-amd64
Resolving github.com (github.com)... 20.205.243.166
Connecting to github.com (github.com)|20.205.243.166|:443... connected.
HTTP request sent, awaiting response... 302 Found
Location: https://objects.githubusercontent.com/github-production-release-asset-2e65be/19708981/82f5cda4-dad5-4537-ace2-fb61e8c1a25a?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIWNJYAX4CSVEH53A%2F20221009%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20221009T074332Z&X-Amz-Expires=300&X-Amz-Signature=9b00f8879f4fa6823a42ab5aa0ccfb0c261ca849c281eb0460eb2b4022cc2a51&X-Amz-SignedHeaders=host&actor_id=0&key_id=0&repo_id=19708981&response-content-disposition=attachment%3B%20filename%3Dgosu-amd64&response-content-type=application%2Foctet-stream [following]
--2022-10-09 07:43:32--  https://objects.githubusercontent.com/github-production-release-asset-2e65be/19708981/82f5cda4-dad5-4537-ace2-fb61e8c1a25a?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIWNJYAX4CSVEH53A%2F20221009%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20221009T074332Z&X-Amz-Expires=300&X-Amz-Signature=9b00f8879f4fa6823a42ab5aa0ccfb0c261ca849c281eb0460eb2b4022cc2a51&X-Amz-SignedHeaders=host&actor_id=0&key_id=0&repo_id=19708981&response-content-disposition=attachment%3B%20filename%3Dgosu-amd64&response-content-type=application%2Foctet-stream
Resolving objects.githubusercontent.com (objects.githubusercontent.com)... 185.199.109.133, 185.199.111.133, 185.199.108.133, ...
Connecting to objects.githubusercontent.com (objects.githubusercontent.com)|185.199.109.133|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 2289664 (2.2M) [application/octet-stream]
Saving to: 'gosu-amd64'

     0K .......... .......... .......... .......... ..........  2%  200K 11s
    50K .......... .......... .......... .......... ..........  4%  231K 10s
   100K .......... .......... .......... .......... ..........  6%  256K 9s
   ...
   ...
  2100K .......... .......... .......... .......... .......... 96%  172K 0s
  2150K .......... .......... .......... .......... .......... 98%  133K 0s
  2200K .......... .......... .......... ......               100%  128K=12s

2022-10-09 07:43:45 (183 KB/s) - 'gosu-amd64' saved [2289664/2289664]

+ wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/3.1.0/x86/openGauss-3.1.0-CentOS-64bit.tar.bz2
--2022-10-09 07:43:45--  https://opengauss.obs.cn-south-1.myhuaweicloud.com/3.1.0/x86/openGauss-3.1.0-CentOS-64bit.tar.bz2
Resolving opengauss.obs.cn-south-1.myhuaweicloud.com (opengauss.obs.cn-south-1.myhuaweicloud.com)... 139.159.208.230, 139.159.208.64, 121.37.63.38, ...
Connecting to opengauss.obs.cn-south-1.myhuaweicloud.com (opengauss.obs.cn-south-1.myhuaweicloud.com)|139.159.208.230|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 89822788 (86M) [application/x-bzip2]
Saving to: 'openGauss-3.1.0-CentOS-64bit.tar.bz2'

     0K .......... .......... .......... .......... ..........  0%  622K 2m21s
    50K .......... .......... .......... .......... ..........  0% 1.67M 96s
 ...
 ...

 87600K .......... .......... .......... .......... .......... 99% 1.81M 0s
 87650K .......... .......... .......... .......... .......... 99% 1.73M 0s
 87700K .......... .......                                    100% 5.79M=61s

2022-10-09 07:44:47 (1.40 MB/s) - 'openGauss-3.1.0-CentOS-64bit.tar.bz2' saved [89822788/89822788]

Removing intermediate container 81f2e272d525
 ---> 4b6c7c242126
Step 3/12 : FROM centos:7.6.1810
 ---> f1cb7c7d58b7
Step 4/12 : COPY --from=builder /gosu-amd64  /usr/local/bin/gosu
 ---> 5a697e587c2a
Step 5/12 : COPY --from=builder /openGauss-3.1.0-CentOS-64bit.tar.bz2 /tmp
 ---> 4e3b98ce48f4
Step 6/12 : COPY entrypoint.sh /usr/local/bin/
 ---> dcea341c1684
Step 7/12 : ENV LANG en_US.utf8
 ---> Running in 0f5406729bd9
Removing intermediate container 0f5406729bd9
 ---> 42975b6f1ad0
Step 8/12 : ENV PGDATA /var/lib/opengauss/data
 ---> Running in 75cfae77f1a9
Removing intermediate container 75cfae77f1a9
 ---> bcf8821abff1
Step 9/12 : RUN set -eux;     yum install -y     bzip2     bzip2-devel     libaio-devel &&     groupadd -g 70 omm;      useradd -u 70 -g omm -m -s /bin/bash omm;      mkdir -p /var/lib/opengauss &&     mkdir -p /usr/local/opengauss &&     mkdir -p /var/run/opengauss  &&     mkdir /docker-entrypoint-initdb.d &&     tar -xf /tmp/openGauss-3.1.0-CentOS-64bit.tar.bz2 -C /usr/local/opengauss &&     chown -R omm:omm /var/lib/opengauss /home/omm /var/run/opengauss /docker-entrypoint-initdb.d /usr/local/opengauss/ &&     chmod 755 -R /usr/local/opengauss &&     rm -f /tmp/openGauss-3.1.0-CentOS-64bit.tar.bz2 &&     yum clean all &&     echo "export GAUSSHOME=/usr/local/opengauss"  >> /home/omm/.bashrc &&     echo "export PATH=\$GAUSSHOME/bin:\$PATH " >> /home/omm/.bashrc &&     echo "export LD_LIBRARY_PATH=\$GAUSSHOME/lib:\$LD_LIBRARY_PATH" >> /home/omm/.bashrc &&     echo "export GAUSSLOG=/var/lib/opengauss/data/pg_log" >> /home/omm/.bashrc &&     echo "export PGDATA=/var/lib/opengauss/data" >> /home/omm/.bashrc &&     echo "\set PROMPT1 'openGauss%R%#'" >> /home/omm/.gsqlrc &&     echo "\set PROMPT2 '#'" >> /home/omm/.gsqlrc &&     echo "\set PROMPT3 '>'" >> /home/omm/.gsqlrc &&     chown -R omm:omm /home/omm &&     chmod +x /usr/local/bin/gosu &&     chmod 755 /usr/local/bin/entrypoint.sh &&     ln -s /usr/local/bin/entrypoint.sh /
 ---> Running in ca8ec1b08a8b
+ yum install -y bzip2 bzip2-devel libaio-devel
Loaded plugins: fastestmirror, ovl
Determining fastest mirrors
 * base: mirrors.bupt.edu.cn
 * extras: mirrors.tuna.tsinghua.edu.cn
 * updates: mirrors.bupt.edu.cn
Resolving Dependencies
--> Running transaction check
---> Package bzip2.x86_64 0:1.0.6-13.el7 will be installed
---> Package bzip2-devel.x86_64 0:1.0.6-13.el7 will be installed
---> Package libaio-devel.x86_64 0:0.3.109-13.el7 will be installed
--> Processing Dependency: libaio(x86-64) = 0.3.109-13.el7 for package: libaio-devel-0.3.109-13.el7.x86_64
--> Running transaction check
---> Package libaio.x86_64 0:0.3.109-13.el7 will be installed
--> Finished Dependency Resolution

Dependencies Resolved

================================================================================
 Package              Arch           Version                 Repository    Size
================================================================================
Installing:
 bzip2                x86_64         1.0.6-13.el7            base          52 k
 bzip2-devel          x86_64         1.0.6-13.el7            base         218 k
 libaio-devel         x86_64         0.3.109-13.el7          base          13 k
Installing for dependencies:
 libaio               x86_64         0.3.109-13.el7          base          24 k

Transaction Summary
================================================================================
Install  3 Packages (+1 Dependent package)

Total download size: 307 k
Installed size: 510 k
Downloading packages:
warning: /var/cache/yum/x86_64/7/base/packages/bzip2-1.0.6-13.el7.x86_64.rpm: Header V3 RSA/SHA256 Signature, key ID f4a80eb5: NOKEY
Public key for bzip2-1.0.6-13.el7.x86_64.rpm is not installed
--------------------------------------------------------------------------------
Total                                              1.1 MB/s | 307 kB  00:00
Retrieving key from file:///etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-7
Importing GPG key 0xF4A80EB5:
 Userid     : "CentOS-7 Key (CentOS 7 Official Signing Key) <security@centos.org>"
 Fingerprint: 6341 ab27 53d7 8a78 a7c2 7bb1 24c6 a8a7 f4a8 0eb5
 Package    : centos-release-7-6.1810.2.el7.centos.x86_64 (@CentOS)
 From       : /etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-7
Running transaction check
Running transaction test
Transaction test succeeded
Running transaction
  Installing : libaio-0.3.109-13.el7.x86_64                                 1/4
  Installing : libaio-devel-0.3.109-13.el7.x86_64                           2/4
  Installing : bzip2-1.0.6-13.el7.x86_64                                    3/4
  Installing : bzip2-devel-1.0.6-13.el7.x86_64                              4/4
  Verifying  : bzip2-devel-1.0.6-13.el7.x86_64                              1/4
  Verifying  : libaio-0.3.109-13.el7.x86_64                                 2/4
  Verifying  : libaio-devel-0.3.109-13.el7.x86_64                           3/4
  Verifying  : bzip2-1.0.6-13.el7.x86_64                                    4/4

Installed:
  bzip2.x86_64 0:1.0.6-13.el7              bzip2-devel.x86_64 0:1.0.6-13.el7
  libaio-devel.x86_64 0:0.3.109-13.el7

Dependency Installed:
  libaio.x86_64 0:0.3.109-13.el7

Complete!
+ groupadd -g 70 omm
+ useradd -u 70 -g omm -m -s /bin/bash omm
+ mkdir -p /var/lib/opengauss
+ mkdir -p /usr/local/opengauss
+ mkdir -p /var/run/opengauss
+ mkdir /docker-entrypoint-initdb.d
+ tar -xf /tmp/openGauss-3.1.0-CentOS-64bit.tar.bz2 -C /usr/local/opengauss
+ chown -R omm:omm /var/lib/opengauss /home/omm /var/run/opengauss /docker-entrypoint-initdb.d /usr/local/opengauss/
+ chmod 755 -R /usr/local/opengauss
+ rm -f /tmp/openGauss-3.1.0-CentOS-64bit.tar.bz2
+ yum clean all
Loaded plugins: fastestmirror, ovl
Cleaning repos: base extras updates
Cleaning up list of fastest mirrors
+ echo 'export GAUSSHOME=/usr/local/opengauss'
+ echo 'export PATH=$GAUSSHOME/bin:$PATH '
+ echo 'export LD_LIBRARY_PATH=$GAUSSHOME/lib:$LD_LIBRARY_PATH'
+ echo 'export GAUSSLOG=/var/lib/opengauss/data/pg_log'
+ echo 'export PGDATA=/var/lib/opengauss/data'
+ echo '\set PROMPT1 '\''openGauss%R%#'\'''
+ echo '\set PROMPT2 '\''#'\'''
+ echo '\set PROMPT3 '\''>'\'''
+ chown -R omm:omm /home/omm
+ chmod +x /usr/local/bin/gosu
+ chmod 755 /usr/local/bin/entrypoint.sh
+ ln -s /usr/local/bin/entrypoint.sh /
Removing intermediate container ca8ec1b08a8b
 ---> 0e364541b2f6
Step 10/12 : ENTRYPOINT ["entrypoint.sh"]
 ---> Running in dcda8e469e67
Removing intermediate container dcda8e469e67
 ---> af95fbd45f53
Step 11/12 : EXPOSE 5432
 ---> Running in 466dbb3f7d47
Removing intermediate container 466dbb3f7d47
 ---> b3bdd285b2c7
Step 12/12 : CMD ["gaussdb"]
 ---> Running in 692f1ab11a8a
Removing intermediate container 692f1ab11a8a
 ---> b1953c88b748
Successfully built b1953c88b748
Successfully tagged opengauss:3.1.0


  openGauss Docker Image  3.1.0 is ready to be extended:

    --> opengauss:3.1.0

  Build completed in 144 seconds.

```

## 4. 启动测试

- 大小
```s
[root@ecs-lee 3.1.0]# docker image ls
REPOSITORY                                                        TAG                 IMAGE ID       CREATED         SIZE
opengauss                                                         3.1.0               b1953c88b748   4 minutes ago   633MB
```

- run

```s
[root@ecs-lee dockerfiles]# docker run --name opengauss --privileged=true -d opengauss:3.1.0
149952b8dca92dd08c9795da196aba92751badc3aa7b0aced0727cd8c0f4ca57
[root@ecs-lee dockerfiles]# docker logs -f opengauss
                        ********************************************************************************
                        Message: Default GS_XLOGDIR is /var/lib/opengauss/data/xlog.
                        Message: Default GS_NODENAME is opengauss.
                        Message: Default ENCODING is UTF-8.
                        Message: Default LOCALE is --no-locale.
                        Message: Default DBCOMPATIBILITY is PG.
                        Message: Default GS_PASSWORD is sHZ3Aa1!.
                        ********************************************************************************
                        Message: The supplied GS_PASSWORD sHZ3Aa1! is meet requirements.
The files belonging to this database system will be owned by user "omm".
This user must also own the server process.

The database cluster will be initialized with locale "C".
The default text search configuration will be set to "english".

fixing permissions on existing directory /var/lib/opengauss/data ... ok
creating subdirectories ... ok
selecting default max_connections ... 100
selecting default shared_buffers ... 32MB
creating configuration files ... ok
Begin init undo subsystem meta.
[INIT UNDO] Init undo subsystem meta successfully.
creating template1 database in /var/lib/opengauss/data/base/1 ... The core dump path is an invalid directory
2022-10-09 07:46:18.999 [unknown] [unknown] localhost 140028811486336 0[0:0#0]  [BACKEND] WARNING:  macAddr is 578/2886795267, sysidentifier is 37923857/208181, randomNum is 2805673269
ok
initializing pg_authid ... ok
setting password ... ok
initializing dependencies ... ok
loading PL/pgSQL server-side language ... ok
creating system views ... ok
creating performance views ... ok
loading system objects' descriptions ... ok
creating collations ... ok
creating conversions ... ok
creating dictionaries ... ok
setting privileges on built-in objects ... ok
initialize global configure for bucketmap length ... ok
creating information schema ... ok
loading foreign-data wrapper for distfs access ... ok
loading foreign-data wrapper for log access ... ok

...
...

ACTION:  Please refer to backend log for more details.
^C
```

- 测试
```s
[root@ecs-lee dockerfiles]# docker exec -it opengauss bash
[root@149952b8dca9 /]# su - omm
[omm@149952b8dca9 ~]$ gsql -d postgres -p5432 -r
gsql ((openGauss 3.1.0 build 4e931f9a) compiled at 2022-09-29 14:19:24 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=#select version();
                                                                       version
------------------------------------------------------------------------------------------------------------------------------------------------------
 (openGauss 3.1.0 build 4e931f9a) compiled at 2022-09-29 14:19:24 commit 0 last mr   on x86_64-unknown-linux-gnu, compiled by g++ (GCC) 7.3.0, 64-bit
(1 row)

openGauss=#

```

## 5. 主备脚本测试


```s
[root@ecs-lee dockerfiles]# sh create_master_slave.sh
Please input OG_SUBNET (容器所在网段) [172.11.0.0/24]:
OG_SUBNET set 172.11.0.0/24
Please input GS_PASSWORD (定义数据库密码)[Enmo@123]:
GS_PASSWORD set Enmo@123
Please input MASTER_IP (主库IP)[172.11.0.101]:
MASTER_IP set 172.11.0.101
Please input SLAVE_1_IP (备库IP)[172.11.0.102]:
SLAVE_1_IP set 172.11.0.102
Please input MASTER_HOST_PORT (主库数据库服务端口)[5432]:
MASTER_HOST_PORT set 5432
Please input MASTER_LOCAL_PORT (主库通信端口)[5434]:
MASTER_LOCAL_PORT set 5434
Please input SLAVE_1_HOST_PORT (备库数据库服务端口)[6432]:
SLAVE_1_HOST_PORT set 6432
Please input SLAVE_1_LOCAL_PORT (备库通信端口)[6434]:
SLAVE_1_LOCAL_PORT set 6434
Please input MASTER_NODENAME [opengauss_master]:
MASTER_NODENAME set opengauss_master
Please input SLAVE_NODENAME [opengauss_slave1]:
SLAVE_NODENAME set opengauss_slave1
Please input openGauss VERSION [1.0.1]:
openGauss VERSION set 1.0.1
starting
41cc302ad46e9d13015684bbdfd28105cac7c1b0f3dd1ba3b73d95f87de45bb7
OpenGauss Database Network Created.
Unable to find image 'opengauss:1.0.1' locally
^C
[root@ecs-lee dockerfiles]# docker network rm opengaussnetwork
opengaussnetwork
[root@ecs-lee dockerfiles]# sh create_master_slave.sh
Please input OG_SUBNET (容器所在网段) [172.11.0.0/24]:
OG_SUBNET set 172.11.0.0/24
Please input GS_PASSWORD (定义数据库密码)[Enmo@123]:
GS_PASSWORD set Enmo@123
Please input MASTER_IP (主库IP)[172.11.0.101]:
MASTER_IP set 172.11.0.101
Please input SLAVE_1_IP (备库IP)[172.11.0.102]:
SLAVE_1_IP set 172.11.0.102
Please input MASTER_HOST_PORT (主库数据库服务端口)[5432]:
MASTER_HOST_PORT set 5432
Please input MASTER_LOCAL_PORT (主库通信端口)[5434]:
MASTER_LOCAL_PORT set 5434
Please input SLAVE_1_HOST_PORT (备库数据库服务端口)[6432]:
SLAVE_1_HOST_PORT set 6432
Please input SLAVE_1_LOCAL_PORT (备库通信端口)[6434]:
SLAVE_1_LOCAL_PORT set 6434
Please input MASTER_NODENAME [opengauss_master]:
MASTER_NODENAME set opengauss_master
Please input SLAVE_NODENAME [opengauss_slave1]:
SLAVE_NODENAME set opengauss_slave1
Please input openGauss VERSION [1.0.1]: 3.1.0
openGauss VERSION set 3.1.0
starting
aa0b66ab132d25d70c94e65641ea5cabb02f2ac3e56def4b65f9a4f07b848580
OpenGauss Database Network Created.
8f4a6be903997764b4bcf9f7d3117ed9f1ddd0c7e303d06b71657bb27386489d
OpenGauss Database Master Docker Container created.
845434cdb53f8c64b396ec46db2d83cbc9da0ade52389a65ad2b498016ebb3c5
OpenGauss Database Slave1 Docker Container created.
[root@ecs-lee dockerfiles]# docker exec -it opengauss_master bash
[root@opengauss_master /]# su - omm
Last login: Sun Oct  9 07:57:32 UTC 2022 on pts/0
[omm@opengauss_master ~]$ gs_ctl query -D /var/lib/opengauss/data/
[2022-10-09 07:58:03.329][429][][gs_ctl]: gs_ctl query ,datadir is /var/lib/opengauss/data
 HA state:
        local_role                     : Primary
        static_connections             : 1
        db_state                       : Normal
        detail_information             : Normal

 Senders info:
        sender_pid                     : 339
        local_role                     : Primary
        peer_role                      : Standby
        peer_state                     : Normal
        state                          : Streaming
        sender_sent_location           : 0/40001C8
        sender_write_location          : 0/40001C8
        sender_flush_location          : 0/40001C8
        sender_replay_location         : 0/40001C8
        receiver_received_location     : 0/40001C8
        receiver_write_location        : 0/40001C8
        receiver_flush_location        : 0/40001C8
        receiver_replay_location       : 0/40001C8
        sync_percent                   : 100%
        sync_state                     : Sync
        sync_priority                  : 1
        sync_most_available            : On
        channel                        : 172.11.0.101:5434-->172.11.0.102:51754

 Receiver info:
No information

```


# 四、pr提交

## 1. clone

```s
[root@ecs-lee lee]# git clone https://gitee.com/lee1002/openGauss-server.git
Cloning into 'openGauss-server'...
remote: Enumerating objects: 67552, done.
remote: Counting objects: 100% (20832/20832), done.
remote: Compressing objects: 100% (6840/6840), done.
remote: Total 67552 (delta 15061), reused 17403 (delta 13878), pack-reused 46720
Receiving objects: 100% (67552/67552), 207.48 MiB | 1.37 MiB/s, done.
Resolving deltas: 100% (47377/47377), done.
```

## 2. 添加你的代码

```s
[root@ecs-lee lee]# cd openGauss-server/docker/dockerfiles/
[root@ecs-lee dockerfiles]# ls
3.0.0  buildDockerImage.sh  create_master_slave.sh
[root@ecs-lee dockerfiles]# ls
3.0.0  3.1.0  buildDockerImage.sh  create_master_slave.sh
[root@ecs-lee dockerfiles]# ls 3.1.0/
dockerfile_amd  entrypoint.sh  sha256_file_amd64
```


## 3. add && commit && push

```s
[root@ecs-lee dockerfiles]# git add .
[root@ecs-lee dockerfiles]# git commit -m "add 3.1.0 amd container"
[master f3676fd] add 3.1.0 amd container
 3 files changed, 519 insertions(+)
 create mode 100644 docker/dockerfiles/3.1.0/dockerfile_amd
 create mode 100644 docker/dockerfiles/3.1.0/entrypoint.sh
 create mode 100644 docker/dockerfiles/3.1.0/sha256_file_amd64
[root@ecs-lee dockerfiles]# git push origin master
Username for 'https://gitee.com': ***********
Password for 'https://***********@gitee.com':
Counting objects: 11, done.
Delta compression using up to 4 threads.
Compressing objects: 100% (8/8), done.
Writing objects: 100% (8/8), 6.38 KiB | 0 bytes/s, done.
Total 8 (delta 2), reused 0 (delta 0)
remote: Powered by GITEE.COM [GNK-6.4]
To https://gitee.com/lee1002/openGauss-server.git
   6f87123..f3676fd  master -> master
```

## 4. 社区提交

- Pull Requests
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221009-82667024-4773-4f33-9951-0703238262e4.png)


- 创建 Pull Request
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221009-4e05fce3-e437-4b48-aa9a-bda54c6aebad.png)

- 等待commit审查合入
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221009-7cb7fc14-ebc6-4877-980e-7254cafb6876.png)


# 五 优化总结

- 提供openGauss 3.1.0版本amd容器打包方式
- 通过builder两阶段构建减少镜像大小
- 通过wget和builder方式优化了必须在本地存放相应安装包问题
- 删除部分无效代码
- 通过entrypoint.sh添加自定义参数并给予默认值

| 参数名       | 默认值      | 功能           |
| --------------- | -------------- | ---------------- |
| GS_XLOGDIR      | ${PGDATA}/xlog | xlog目录默认值为 |
| GS_NODENAME     | opengauss      | 安装时nodename |
| ENCODING        | UTF-8          | 字符集编码  |
| LOCALE          | --no-locale    | LOCALE           |
| DBCOMPATIBILITY | PG             | 数据库兼容性 |
| GS_PASSWORD     | 8 位数随机密码 | 密码           |




