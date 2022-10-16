+++  
title = "openGauss事务部分参数介绍"   
date = "2022-10-14"   
tags = ["openGauss3.0.0"]   
archives = "2020-10"   
author = "wllove"   
summary = "OpenGauss3.0.0"   
img = "/zh/post/wllove/title/title.png"    
times = "17:10"    
+++  

openGauss事务
介绍openGauss事务隔离、事务只读、最大prepared事务数、维护模式目的参数设置及取值范围等内容。

pgxc_node_name
参数说明：指定节点名称。

该参数属于POSTMASTER类型参数，请参考表1中对应设置方法进行设置。

取值范围：字符串。

默认值：当前节点名称。

transaction_deferrable
参数说明：指定是否允许一个只读串行事务延迟执行，使其不会执行失败。该参数设置为on时，当一个只读事务发现读取的元组正在被其他事务修改，则延迟该只读事务直到其他事务修改完成。目前，openGauss暂时未用到这个参数。与该参数类似的还有一个default_transaction_deferrable，设置它来指定一个事务是否允许延迟。

该参数属于USERSET类型参数，请参考表1中对应设置方法进行设置。

取值范围：布尔型

on表示允许执行。
off表示不允许执行。
默认值：off

enforce_two_phase_commit
参数说明：强制使用两阶段提交，为了兼容历史版本功能保留该参数，当前版本设置无效。

该参数属于SUSET类型参数，请参考表1中对应设置方法进行设置。

取值范围：布尔型

on表示强制使用两阶段提交。
off表示不强制使用两阶段提交。
默认值：on

enable_show_any_tuples
参数说明：该参数只有在只读事务中可用，用于分析。当这个参数被置为on/true时，表中元组的所有版本都会可见。

该参数属于USERSET类型参数，请参考表1中对应设置方法进行设置。

取值范围：布尔型

on/true表示表中元组的所有版本都会可见。
off/false表示表中元组的所有版本都不可见。
默认值：off

replication_type
参数说明：标记当前HA模式是主备从模式还是一主多备模式。

该参数属于POSTMASTER类型参数，请参考表1中对应设置方法进行设置。

该参数是内部参数，用户不能自己去设置参数值。

取值范围：0~2

1 表示使用一主多备模式。
0 表示主备从模式。
默认值：1