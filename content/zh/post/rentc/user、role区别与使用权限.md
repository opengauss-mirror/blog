+++

title = "user/role 区别与使用权限"

date = "2022-09-30"

tags = ["user/role 区别与使用权限"]

archives = "2022-09-30"

author = "Rentc"

summary = "user/role 区别与使用权限"

img = "/zh/post/Rentc/title/title.jpg"

times = "10:40"

+++

定义 <br />角色是拥有数据库对象和权限的实体。在不同的环境中角色可以认为是一个用户，一个组或者兼顾两者。<br />从创建用户和角色的语义（create user/role）上看也没有区别，唯一的区别就是用户默认带有login权限。  <br />查询用户相关信息可以查看视图pg_user，查看角色相关信息可以查看pg_roles，但如果你查看pg_user和pg_roles的视图定义，会发现这两个视图都来源于基表pg_authid。<br />**所以我们可以理解用户就是带有login属性的角色。**
#### 私有用户
角色的属性有很多，可以通过\h create user/role来查看，也可以直接在pg_authid系统表中查看。<br />这里主要介绍一个比较重要的属性：**INDEPENDENT**，即在非三权分立模式下，创建具有INDEPENDENT属性的私有用户，<br />针对该私有用户的对象，系统管理员和拥有CREATEROLE属性的安全管理员在未经其授权前，只能进行控制操作（DROP、ALTER、TRUNCATE），无权进行INSERT、DELETE、SELECT、UPDATE、COPY、GRANT、REVOKE、ALTER OWNER操作。
