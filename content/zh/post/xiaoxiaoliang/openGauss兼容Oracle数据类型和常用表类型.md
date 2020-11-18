+++

title = "openGauss兼容Oracle数据类型和常用表类型" 

date = "2020-11-17" 

tags = ["openGauss兼容Oracle数据类型和常用表类型"] 

archives = "2020-11" 

author = "小小亮" 

summary = "openGauss兼容Oracle数据类型和常用表类型"

img = "/zh/post/xiaoxiaoliang/title/title.PNG" 

times = "13:30"

+++

# openGauss兼容Oracle数据类型和常用表类型<a name="ZH-CN_TOPIC_0291959512"></a>

从Oracle数据库向其他数据库过度时，很多朋友会自然而然的寻找属性都过度方式，例如字典表。

openGauss可全面兼容Oracle所有数据类型，对于常见数据类型无需进行改造，对于少数非常用数据类型，需要进行少量代码改造，可采取下列替代方案进行替换。

![](../figures/图1.png)

openGauss兼容Oracle常用表类型，索引组织表需要用集群索引方式进行改造。对于少数非常用数据类型，需要进行少量代码改造，可采取下列替代方案进行替换。

![](../figures/图2.png)

