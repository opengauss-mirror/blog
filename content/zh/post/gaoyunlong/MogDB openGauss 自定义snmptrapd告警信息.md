+++

title = "MogDB/openGauss 自定义snmptrapd告警信息" 

date = "2022-05-23" 

tags = ["MogDB/openGauss 自定义snmptrapd告警信息"] 

archives = "2022-05" 

author = "云和恩墨" 

summary = "MogDB/openGauss 自定义snmptrapd告警信息"

img = "/zh/post/gaoyunlong/title/img24.png" 

times = "10:20"
+++

# MogDB/openGauss 自定义snmptrapd告警信息

本文出处：[https://www.modb.pro/db/232391](https://www.modb.pro/db/232391)

在之前的文章[MogDB/openGauss 监控告警配置](https://www.modb.pro/db/190643)介绍了如何通过alertmanager模块将报警通过snmp推送出去，但是在实际使用中，默认的报警规则信息并不能很好的满足snmp服务端的需求，需要定制化报警信息，这里以添加ip为例，看似一个简单的将IP一行信息单独在报警展示出来，涉及到的配置文件修改还是挺多的。
![image.png](../figures/20220106-03097507-8fce-424c-8c74-969e1fb06f16.png)

#### 修改prometheus.yml文件

首先需要修改prometheus.yml文件，在对应的实例下添加ip标签
![image.png](../figures/20220106-36068d2a-eccf-45ff-89df-c994c6331802.png)

#### 修改规则报警文件

对应的报警规则文件也同样需要修改，我这里使用的是服务器磁盘使用率做报警测试，所以直接修改node_rules.yml文件，添加ip信息
![image.png](../figures/20220106-a00fdef7-cefb-4775-bd75-f6bfb0952b8d.png)

#### 查看alertmanager web界面

现在我们就可以在alertmanager的界面上看到我们新添加的ip标签了，同时报警信息里也带了ip
![image.png](../figures/20220106-fec3c37b-f253-4aa9-a986-96012785126a.png)

#### 修改snmp_notifier模版

alertmanager模块将报警消息推送到snmp_notifier后，还需要需改snmp_notifier的描述模版description-template.tpl
![image.png](../figures/20220106-e39ed7ff-add2-4ef5-9b4a-45edddfe74ff.png)

#### snmptrapd服务器接受报警信息

![image.png](../figures/20220106-02524930-39ff-4c6d-898e-4070ab278009.png)

#### 添加额外的模版

默认情况下，snmptrapd只会输出三行模版信息，要添加额外的版本信息需要使用–snmp.extra-field-template参数，比如添加第4行模版则在snmp_notifier启动时指定参数–snmp.extra-field-template=4=/opt/snmp_notifier/extra-field-template.tpl，模版extra-field-template.tpl可以参考description-template.tpl的格式

```
{{- if .Alerts -}} {{- range $severity, $alerts := (groupAlertsByLabel .Alerts "severity") -}} {{- range $index, $alert := $alerts }} {{ $alert.Annotations.ip }} {{ end }} {{ end }} {{- end -}} 
```

**启动snmp_notifier**

```
nohup /opt/snmp_notifier/snmp_notifier --snmp.trap-description-template=/opt/snmp_notifier/description-template.tpl --snmp.extra-field-template=4=/opt/snmp_notifier/extra-field-template.tpl > /opt/snmp_notifier/snmp_notifier.log 2>&1 &

```

再次查看snmptrapd服务器接受报警信息

![image.png](../figures/20220106-a510566b-e8dc-4b21-b5df-974e4bac5cd4.png)
