---
title: 'MogDB stack之mgo-client安装'

date: '2022-08-26'

category: 'blog'
tags: ['MogDB']

archives: '2022-08'

author: '云和恩墨-阎书利'

summary: 'MogDB stack之mgo-client安装'

img: '/zh/blogs/ysl/title/img39.png'

times: '10:20'
---

# MogDB stack 之 mgo-client 安装

# 一.安装 mgo 客户端

获取 mgo 的安装脚本

```
 wget https://cdn-mogdb.enmotech.com/mogdb-stack/v1.0.0/client-setup.sh --no-check-certificate
```

<img src='./figures/20220719-f0b657f7-1b3a-45ab-aa1c-ff778dcaf052.png'>
安装 mgo 客户端

```
chmod +x client-setup.sh
./client-setup.sh
```

<img src='./figures/20220719-50679076-aab7-4b85-a9a0-382fb8cb2d69.png'>

添加环境变量

```
cat <<EOF >> ~/.bashrc
export PATH=/root/.mgo:$PATH
export MGOUSER=/root/.mgo/mgouser
export MGO_CA_CERT=/root/.mgo/client.crt
export MGO_CLIENT_CERT=/root/.mgo/client.crt
export MGO_CLIENT_KEY=/root/.mgo/client.key
export MGO_APISERVER_URL='https://127.0.0.1:32444'
EOF

source ~/.bashrc
```

查看 mgo 版本

```
mgo version
```

<img src='./figures/20220719-d28099ab-9b7c-462f-b18a-c630f332ff9d.png'>

# 二、mgo 使用

创建 MogDB cluster

```
mgo create cluster cluster1
```

<img src='./figures/20220719-83127217-0872-4497-86dd-02bd57b5f7e1.png'>
