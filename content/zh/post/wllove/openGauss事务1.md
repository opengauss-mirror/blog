+++  
title = "openGauss事务部分参数介绍"   
date = "2022-10-14"   
tags = ["openGauss3.0.0"]   
archives = "2020-10"   
author = "wllove"   
summary = "OpenGauss3.0.0"   
img = "/zh/post/wllove/title/title.png"    
times = "16:10"    
+++  

openGauss事务
介绍openGauss事务隔离、事务只读、最大prepared事务数、维护模式目的参数设置及取值范围等内容。

transaction_isolation
参数说明：设置当前事务的隔离级别。

该参数属于USERSET类型参数，请参考表1中对应设置方法进行设置。

取值范围：字符串，只识别以下字符串，大小写空格敏感：

serializable：openGauss中等价于REPEATABLE READ。
read committed：只能读取已提交的事务的数据（缺省），不能读取到未提交的数据。
repeatable read：仅能读取事务开始之前提交的数据，不能读取未提交的数据以及在事务执行期间由其它并发事务提交的修改。
default：设置为defualt_transaction_isolation所设隔离级别。
默认值：read committed

transaction_read_only
参数说明：设置当前事务是只读事务。该参数在数据库恢复过程中或者在备机里，固定为on；否则，固定为default_transaction_read_only的值。

该参数属于USERSET类型参数，请参考表1中对应设置方法进行设置。

取值范围：布尔型

on表示设置当前事务为只读事务。
off表示该事务可以是非只读事务。
默认值：off

xc_maintenance_mode
参数说明：设置系统进入维护模式。
默认值：off

allow_concurrent_tuple_update
参数说明：设置是否允许并发更新。

该参数属于USERSET类型参数，请参考表1中对应设置方法进行设置。

取值范围：布尔型

on表示该功能启用。
off表示该功能被禁用。
默认值：on


该参数属于SUSET类型参数，仅支持表1中的方式三进行设置。

取值范围：布尔型

on表示该功能启用。
off表示该功能被禁用。