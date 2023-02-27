---
title: 'openGauss Cluster Manager RTO Test'

date: '2022-09-28'
category: 'blog'
tags: ['openGauss技术文章征集', 'CM', 'RTO']

archives: '2022-9'

author: '李宏达'

summary: 'openGauss Cluster Manager RTO Test'

img: '/zh/post/lihongda/title/title.png'

times: '17:30'
---

# 一、环境介绍

## 1. 软件环境

| 类别         | 版本                  | 下载链接                                                                                                                                                                                                                                                                                                                                                                                                                                     | 备注                                         |
| ------------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| OS           | openEuler 20.03 (LTS) | [https://repo.openeuler.org/openEuler-20.03-LTS/ISO/aarch64/openEuler-20.03-LTS-aarch64-dvd.iso](https://repo.openeuler.org/openEuler-20.03-LTS/ISO/aarch64/openEuler-20.03-LTS-aarch64-dvd.iso)                                                                                                                                                                                                                                             | 操作系统                                     |
| BenchmarkSQL | 5.0                   | [https://sourceforge.net/projects/benchmarksql/files/latest/download](https://sourceforge.net/projects/benchmarksql/files/latest/download)驱动版本：postgresql-9.3-1102.jdbc41.jar                                                                                                                                                                                                                                                           | 模拟 TPCC 压力的程序驱动为程序自带的 pg 驱动 |
| Golang       | go1.18 linux/arm64    | [https://golang.google.cn/dl/go1.18.1.linux-arm64.tar.gz](https://golang.google.cn/dl/go1.18.1.linux-arm64.tar.gz) [https://gitee.com/opengauss/openGauss-connector-go-pq/blob/master/example/multi_ip/multi_ip.go](https://gitee.com/opengauss/openGauss-connector-go-pq/blob/master/example/multi_ip/multi_ip.go) [https://gitee.com/opengauss/openGauss-connector-go-pq/tags](https://gitee.com/opengauss/openGauss-connector-go-pq/tags) | 模拟应用连接的程序                           |
| openGauss    | 3.0.0                 | [https://opengauss.obs.cn-south-1.myhuaweicloud.com/3.0.0/arm/openGauss-3.0.0-openEuler-64bit-all.tar.gz](https://opengauss.obs.cn-south-1.myhuaweicloud.com/3.0.0/arm/openGauss-3.0.0-openEuler-64bit-all.tar.gz)                                                                                                                                                                                                                           | 数据库                                       |

## 2. 硬件环境

| 主机    | CPU                | 规格    | 硬盘       | 职责                       |
| ------- | ------------------ | ------- | ---------- | -------------------------- |
| node1   | Kunpeng-920 虚拟机 | 16c/64g | 通用型 SSD | 主库                       |
| node2   | Kunpeng-920 虚拟机 | 16c/64g | 通用型 SSD | 同步备库                   |
| go 程序 |
| node3   | Kunpeng-920 虚拟机 | 16c/64g | 通用型 SSD | 异步备库 BenchmarkSQL 程序 |

## 3. 架构图

![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20220928-b708e01e-446f-4faa-be92-a53a9ce566e6.png)

# 二、测试场景

## 1. go 程序多 IP 连接测试 RTO

> 原理：CM 检测主库发生故障，不可访问时会自动选新主，go 驱动通过 target_session_attrs=read-write 控制只连主库，通过 SQL
> select sysdate,pg_is_in_recovery(); 查询结果时间戳查看 RTO

- go 程序代码

```
[root@cloud001-0003 go]# cat 1.go
// Copyright © 2021 Bin Liu <bin.liu@enmotech.com>

package main

import (
        "database/sql"
        "fmt"
        _ "gitee.com/opengauss/openGauss-connector-go-pq"
        "log"
        "os"
        "os/signal"
        "syscall"
        "time"
)

/*
需要有访问dbe_perf.global_instance_time的权限
CREATE USER dbuser_monitor with login monadmin PASSWORD 'Mon@1234';
grant usage on schema dbe_perf to dbuser_monitor;
grant select on dbe_perf.global_instance_time to dbuser_monitor;
CGO_ENABLED=0 GOOS=linux GOARCH=arm64
*/

var (
        dsnExample = `DSN="postgres://gaussdb:secret@foo,bar,baz/mydb?sslmode=disable"
DSN="postgres://gaussdb:secret@foo:1,bar:2,baz:3/mydb?sslmode=disable"
DSN="user=gaussdb password=secret host=foo,bar,baz port=5432 dbname=mydb sslmode=disable"
DSN="user=gaussdb password=secret host=foo,bar,baz port=5432,5432,5433 dbname=mydb sslmode=disable"`
)

func main() {
 os.Setenv("DSN", "postgres://gaussdb:Enmo12345@172.16.0.65:26000,172.16.0.202:26000,172.16.0.193:26000/postgres?"+
"sslmode=disable&loggerLevel=debug&target_session_attrs=read-write")
        connStr := os.Getenv("DSN")
        if connStr == "" {
                fmt.Println("please define the env DSN. example:\n" + dsnExample)
                return
        }
        fmt.Println("DNS:", connStr)
        db, err := sql.Open("opengauss", connStr)
        if err != nil {
                log.Fatal(err)
        }
        var (
                newTimer = time.NewTicker(1 * time.Second)
                doClose  = make(chan struct{}, 1)
        )

        go func() {
                for {
                        select {
                        case <-newTimer.C:
                                if err := getNodeName(db); err != nil {
                                        fmt.Println(err)
                                }
                        case <-doClose:
                                newTimer.Stop()
                                return
                        }
                }
        }()

        sigChan := make(chan os.Signal, 2)
        signal.Notify(sigChan, syscall.SIGTERM, syscall.SIGINT, syscall.SIGKILL) //nolint:staticcheck
        defer signal.Stop(sigChan)
        <-sigChan
        doClose <- struct{}{}

}

func getNodeName(db *sql.DB) error {
        var err error
        // tx, err := db.Begin()
        // if err != nil {
        //      return err
        // }
        // defer tx.Commit()
        var sysdate string
        var pgIsInRecovery bool
        var nodeName string
        err = db.QueryRow("select sysdate,pg_is_in_recovery();").
                Scan(&sysdate, &pgIsInRecovery)
        if err != nil {
                return err
        }
        var channel string

        // err = db.QueryRow("select channel from pg_stat_get_wal_senders() limit 1 ").
        //      Scan(&channel)
        fmt.Println(sysdate, nodeName, pgIsInRecovery, channel)
        // if err != nil {
        //      return err
        // }
        return nil
}


```

- 模拟数据库故障

```
[omm@cloud001-0002 data]$ mv db1/ db1.bak
```

- go 程序连接数据库及重连时间

![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20220928-634f7416-a474-4207-a0fa-f7e82eb73d19.png)

![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20220928-14892178-7d5a-42fa-8566-54977fa28c5b.png)

- 时间差

```
2022/04/11 16:02:13.614273 connector.go:222:  info dialing server host 172.16.0.65 port 26000
2022/04/11 16:02:20.683716 connector.go:145: debug find instance host 172.16.0.202 port 26000

RTO时间7s
```

## 2. BenchmarkSQL 多 IP 连接测试 RTO

> 原理：CM 检测主库发生故障，不可访问时会自动选新主，jdbc 驱动通过 target_session_type=master 控制只连主库，通过 SQL
> 程序执行时间戳查看 RTO

**BenchmarkSQL 模拟负载及重连时间**

![1.png](https://oss-emcsprod-public.modb.pro/image/editor/20220928-5c42ba4a-47ac-48cb-9005-579a2aa09dae.png)

![2.png](https://oss-emcsprod-public.modb.pro/image/editor/20220928-68a8b2b7-5521-4b44-ac97-17bb9dc1ac39.png)

- 时间差

```
16:02:13,561 [Thread-8] ERROR  jTPCCTData : Unexpected SQLException in STOCK_LEVELsage: 153MB / 897MB
16:02:20,834 [Thread-57] FATAL  jTPCCTerminal : Unexpected SQLException on rollback: This connection has been closed.

RTO时间7.273s
```

## 3. 数据库端观测时间

- 数据库日志

![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20220928-6c2db59b-0422-4727-97af-fcdab184a91b.png)

![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20220928-015bf3ac-7fca-4d9f-8b05-8b26accae72e.png)

- 时间差

```
2022-04-11 16:02:13.253 tid=1795056 StartAndStop ERROR: data path disc writable test failed, /opt/mogdb/data/data/db1.
2022-04-11 16:02:20.438 tid=1815697  LOG: failover msg from cm_server, data_dir :/opt/mogdb/data/data/db1  nodetype is 2

RTO时间7.185s
```

# 总结

---

- 在有负载情况（tpcc 压测产生负载，数据库服务器 CPU 占用 50%左右）进行主库宕机测试，
- 以主库宕机为起始点，备库成功作为新主库启动成功为终止点 RTO 为 7.185s
- 以主库宕机为起始点，模拟 TPCC 压测的 benchmarkSQL 程序成功重新连接到新主库为终止点 RTO 为 7.273s
- 以主库宕机为起始点，模拟其它应用连接数据库的 go 程序成功重新连接到新主库为终止点 7s
- 由于 go 程序至精确到 s，猜测实际时间为 7.185s 以上
  > 综上所述 openGauss Cluster Manager RTO 约为 7s 左右
