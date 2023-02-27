---
title: 'Discussion on openGauss Memory Management'

category: 'blog'
date: 2021-09-17

tags: ['Discussion on openGauss Memory Management']

archives: '2021-9'

author: 'Mengen Xue'

summary: 'Discussion on openGauss Memory Management'

img: '/en/post/2022/title/img5.png'

times: '12:30'
---

# Basic Principles of the Patroni for openGauss HA Solution<a name="ZH-CN_TOPIC_0000001206626668"></a>

## 1. Introduction to Patroni<a name="section12588579198"></a>

Patroni is an open-source product developed in Python by Zalando. It can use the distributed configuration system \(DCS\) to detect the status and configuration of each node in the storage database cluster, and perform automatic management and failover for the database cluster.

## 2. Working Principles of Patroni<a name="section17968171210201"></a>

An HA cluster consists of Patroni, DCS, and databases. This solution uses editable text configuration daemon \(ETCD\) as DCS and openGauss as the database.

ETCD is a distributed key-value pair store. It is designed to reliably and quickly store key data and provide access services. It uses distributed locks, leader election, and write barriers to implement reliable distributed collaboration. ETCD clusters are prepared for HA and persistent data storage and retrieval.

Patroni connects to ETCD through an API and inserts key-value pairs to record Patroni parameters, database parameters, primary/standby information, and connection information. Generally, ETCD is used to detect heartbeats of other nodes. The primary/standby information stored in the key-value pairs is obtained from ETCD to determine the status of each node and automatically manage the cluster. The following figure shows the basic principle.

![](./figures/zh-cn_image_0000001208491336.png)

As shown in the preceding figure, only one Patroni node can become the leader at a time. That is, only one Patroni node can hold the leader lock. This prevents split-brain. Currently, patroni-for-openGauss can rectify the following faults:

- 1. If the primary database stops unexpectedly but can be recovered by restarting, it can be automatically started immediately.
- 2. If the primary database is faulty and cannot be started, the current primary database releases the leader lock and is demoted to standby. Then, the system automatically selects the most healthy standby database, that is, the standby database whose synchronization status is closest to that of the primary database, and promotes it to primary.
- 3. If the standby database is hung up unexpectedly and can be recovered and connected to the primary database immediately after being restarted, restart the standby database immediately.
- 4. If the standby database is faulty unexpectedly and can be started properly but it is later than the primary database after startup, rebuild the standby database to restore its status.
