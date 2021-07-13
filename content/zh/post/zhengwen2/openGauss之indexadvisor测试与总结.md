+++

title = "openGauss之indexadvisor测试与总结" 

date = "2021-07-09" 

tags = ["openGauss之indexadvisor测试与总结"] 

archives = "2021-07" 

author = "三五七言" 

summary = "openGauss之indexadvisor测试与总结"

img = "/zh/post/zhengwen2/img/img29.jpg" 

times = "12:30"

+++

# openGauss之indexadvisor测试与总结<a name="ZH-CN_TOPIC_0000001085018737"></a>

# 测试种类：单query索引推荐、虚拟索引推荐（由于数据限制没有进行workload测试）

# 1. 测试的表数据量如下：在test数据库下的aka_name、customer表。
aka_name为60多万条数据（取自imdb数据集数据中一个表的数据）、customer为4条数据（自己创建的）。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210702172226929.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70)

# 2.单query索引推荐：gs_index_advise 用于针对单挑查询语句生成推荐索引
（1）where语句只有一个属性的情况
 ![在这里插入图片描述](https://img-blog.csdnimg.cn/20210702172241119.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70)

（2）where语句有多个属性的情况
① 两个属性，范围查找.只推荐了id，没有推荐person_id。发现哪个属性在前面就推荐谁。
 ![在这里插入图片描述](https://img-blog.csdnimg.cn/20210702172247553.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70)

②三个属性，两个范围查找，一个=精准查找.推荐id与=的属性。
③四个属性，两个like模糊查询。 like属性不给推荐。
④五个属性，两个like模糊查询。 like属性不给推荐。
⑤五个属性，一个like模糊查询，一个=。 like不给于推荐，=给予推荐。
⑥五个属性，一个like精准查询，一个=。 like依旧不给于推荐索引。
⑦五个属性，两个=。 =的属性全部给予推荐索引。
 ![在这里插入图片描述](https://img-blog.csdnimg.cn/20210702172254508.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70)

（3）order by 与 group by

# 3.虚拟索引
①hypopg_create_index：创建虚拟索引。
 ![在这里插入图片描述](https://img-blog.csdnimg.cn/20210702172310447.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70)

②hypopg_display_index：显示所有创建的虚拟索引信息。
hypopg_drop_index：删除指定的虚拟索引。
hypopg_reset_index：清除所有虚拟索引。
hypopg_estimate_size：估计指定索引创建所需的空间大小。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210702172316460.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70)

# 总结如下：
目前对gauss的单索引推荐和虚拟索引推荐进行了测以及结果情况如下：

 - 单索引推荐：适用于表中数据量大的情况，数据量过小不会进行推荐。

（1）当where中的查询条件只有一个的时候，推荐单一索引，如只有id在where中，只推荐id为索引；当where中的查询条件有多个的时候推荐多重索引，如id，name在where中被当做条件，则一起被推荐为联合索引，但是如果同时存在id、person_id则默认推荐id（ 目前不知道原因）
（2）当query中除了where这个语句时，还存在order by 和 group by等条件时，将where、order by、group by中的属性全部作为联合索引进行推荐。
（3）使用like模糊查询时或精准查询都不对该属性进行索引建立，并且=属性一定给予索引推荐建立。
（4）当query中的条件过多时存在的属性也超过三个时，依旧推荐联合属性是在三个以上，会不会导致推荐索引过多从而性能下降，这个有待商榷，最好推荐索引中的属性在三个以内最好。不过这个可能需要通过DRL来学习，判断究竟选择一条query中的哪几个属性来建立索引。

 - 虚拟索引

（1）通过使用hypopg这个建立虚拟索引可以加快查询速度，具体可以通过explain命令发现cost得到了很大程度上的减少，并且会显示在什么地方建立虚拟索引达到这种效果的。
（2）同时发现openGuass的index_advior在虚拟索引上和论文中的索引推荐都使用到hypopg这个工具，都是用于创建虚拟索引，进行索引推荐，不同的地方可能在于论文中使用了DRL进行学习以及建立了DQN模型，论文中找到全部能够建立的索引候选项，都是可以在一定程度上减少cost的，但是具体上不知道是哪一种的索引候选项能够使cost最小，然后通过DQN来学习，但是通过学习最终的Q-value不一定是全局最优的，但一定是局部最优的。所以就是gauss可能就是更加hypopg进行虚拟的创建得到一个索引，然后通过改索引在一定程度上对query进行了优化，而论文中则是先获取所有可能建立索引的索引候选项，然后通过学习来从所有的索引候选项里面找到一个最优的索引。

 - workload级别索引推荐

暂未测试。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210409150842510.jpg?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0dhdXNzREI=,size_16,color_FFFFFF,t_70#pic_center,  =200x200 )
<center>Gauss松鼠会是汇集数据库爱好者和关注者的大本营，</center>

<center>大家共同学习、探索、分享数据库前沿知识和技术，</center>

<center>互助解决问题，共建数据库技术交流圈。</center>

<center>
<a href=https://opengauss.org>openGauss官网</a>
</center>
