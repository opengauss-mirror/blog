---
title: '使用gsql进行SSL连接测试'
date: '2024-05-29'
category: 'blog'
tags: ['openGauss-ssl连接测试']
archives: '2024-05'
author: 'ningyali'
summary: 'openGauss客户端接入认证'
times: '09:48'
---

# openGauss使用gsql进行SSL连接测试

## 1.配置参数，开启SSL认证模式

gs_guc set -N all -I all -c "ssl=on" -c "require_ssl=on"

gs_om -t restart

## 2.配置客户端接入认证参数，IP为所要连接的主机IP

(pg_hba.conf文件)(注意将ip修改为数据库主机ip)

gs_guc reload -N all -I all -h "hostssl all all IP/32 cert"

## 3.配置SSL认证相关的数字证书参数

gs_guc set -N all -I all -c "ssl_cert_file='server.crt'" -c "ssl_key_file='server.key'" -c "ssl_ca_file='cacert.pem'"

gs_om -t restart

## 4.数据库创建用户和密码，并赋予权限

（后续使用该用户和密码进行ssl连接）

create user u_ssl password '******';

grant all privileges to u_ssl;

## 5.生成证书(可用开源文件create_ca.sh或自己生成),并将压缩包db_cert_replacement.zip发送到数据库主机的数据库初始用户(omm)下的人员路径，如/home/omm/

开源文件create_ca.sh：https://gitee.com/opengauss/Yat/blob/master/openGaussBase/testcase/script/create_ca.sh

注意：生成证书使用的用户名和密码应与第4步一致。如使用create_ca.sh生成证书，username为数据库初始用户，如omm；login_user为ssl连接用户，与第4步一致；userpwd为ssl连接用户连接密码，与第4步一致。

chown omm:omm /home/omm/db_cert_replacement.zip

## 6.替换证书

gs_om -t cert --cert-file=/home/omm/db_cert_replacement.zip

gs_om -t restart

## 7.发送压缩包db-cert-replacement.zip到数据库主机数据库用户家目录下，并解压

chown omm:omm /home/omm/db_cert_replacement.zip

## 8.指定客户端证书文件

export PGSSLCERT='/home/omm/client.crt'

export PGSSLKEY='/home/omm/client.key'

export PGSSLMODE='verify-ca'

export PGSSLROOTCERT='/home/omm/cacert.pem'

## 9.gsql连接

gsql -d tpccdb -U u_ssl -W "**********" -h 数据库主机ip
