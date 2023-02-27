---
title: 'openGauss社区入门（opengauss-高可用学习总结)'

date: '2022-08-22'

category: 'blog'
tags: ['openGauss社区开发入门']

archives: '2022-08'

author: 'rentc'

summary: 'openGauss社区开发入门'

img: '/zh/blogs/Rentc/title/title.jpg'

times: '8:50'
---

openGauss 高可用架构包括一主一备(主备 HA)、一主多备（最多 8 个备）、主备级联备。主备复制是通过 WAL（redo）日志物理复制的形式从主库传送到备库。
openGauss 在局域网高带宽同网段建议采用一主一备或者一主多备的模式。结合高可用的需求和传输方式，可输出多种组合复制传输方式。

1 异步方式
对于主机的性能要求很高的 OLTP 系统，备库可以采用异步同步的模式，配置参数默认 synchronous_commit=on，如果为 off,可能会发生主库日志未完全落库的情况。主库 Primary 日志数据写入缓存，并向备库发送 WAL 日志，不需要等待备库反馈，主库日志写入磁盘完成，反馈给客户端事务提交完成，保证了主库最大性能。高速局域网内，几乎可以保证 RPO=0，RTO<10s。
异步模式，参数 synchronous_standby_names 不需要配置备机名称。

2 日志收到
对于既要保证主机性能，又不想丢失数据 RPO=0 的情况下,可以通过备机日志收到的模式，配置参数 synchronous_commit= remote_receive，主库 Primary 日志数据写入缓存，备机 WalReceiver 接收到日志数据，写入 WalDataWriterQueue 中，并反馈给主库，已收到数据，主库日志写入磁盘完成，反馈给客户端事务提交完成，保证了最大可用。高速局域网内，保证 RPO=0，RTO<10s。
如果备机故障，并且不影响主机提交事务，需要设置参数 most_available_sync=on，在有同步备机故障时，主机事务不因同步备机故障而被阻塞。
配置参数 synchronous_standby_names 配置同步备机的名称。

3 日志落盘
对于主机性能要求不是很高的信息系统，对数据的可靠性要求极高，可采用备库日志罗盘的模式，配置参数 synchronous_commit= remote_write 或者 on，主库 Primary 日志数据写入缓存，备机 WalReceiver 接收到日志数据，写入 WalDataWriterQueue 中，并将日志写入到备库磁盘后，反馈给主库，已收到数据，主库日志写入磁盘完成，反馈给客户端事务提交完成，保证了最大保护。高速局域网内，保证 RPO=0，RTO<10s。
为了保证数据的安全可靠，主机备机存储建议使用不同型号存储。
参数 most_available_sync=off，表示备机全部故障，将无法提交事务。配置参数 synchronous_standby_names 配置同步备机的名称。
注意，复制模式的选择是灵活的，根据信息系统的需要灵活设置，例如如果信息系统对事务的并发要求不高，synchronous_commit=on ，most_available_sync=on ，既保证了主机故障时，及时切换备机的高可用，同时备机故障，又不影响业务。

4 日志应用
在日志落盘模式的基础上，WAL 日志落到磁盘后，并通过专用线程回放日志后，反馈主库，已收到数据，反馈给客户端事务提交完成。配置参数 synchronous_commit= remote_apply,备库可以实时直接读取和主库一致的数据，该模式对主库的性能影响是最大。
当发生灾难时，为了保证业务连续性，企业用户需要考虑系统级和数据级两地三中心模式，openGauss 主备 HA 两地三中心所示，在数据中心 AZ1、数据中心 AZ2 和数据中心 AZ3 建立复制模式。数据中心内部参照主备 HA 架构，跨数据中心配置采用异步模式。异步模式，参数 synchronous_standby_names 不需要配置备库主机名称。
