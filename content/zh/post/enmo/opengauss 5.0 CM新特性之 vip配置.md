+++

title = "opengauss 5.0 CM新特性之 vip配置" 

date = "2023-05-30" 

tags = ["opengauss"] 

archives = "2023-05" 

author = "云和恩墨-戚钰" 

summary = "opengauss 5.0 CM新特性之 vip配置"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"

+++

本文出处：[https://www.modb.pro/db/626823](https://www.modb.pro/db/626823)

节点信息

192.168.0.141 主节点
192.168.0.145 备节点
192.168.0.10 vip

# 一、数据库集群未安装的场景下配置VIP

## 1. 添加vip

```
ifconfig eth0:26000 192.168.0.10 netmask 255.255.255.0 up
```

## 2. ifconfig提权

修改权限文件/etc/sudoers，添加以下内容，为集群用户添加ifconfig权限。

```
# echo "Cmnd_Alias COMMAND_FLAG = /usr/sbin/ifconfig" >> sudoers
# echo "omm ALL=(root) NOPASSWD: COMMAND_FLAG" >> sudoers
```

## 3. xml文件中配置VIP相关配置项

示例文件如下

```
<?xml version="1.0" encoding="utf-8"?>
<ROOT>
  <CLUSTER>
   <PARAM name="clusterName" value="openGauss" />  
    <PARAM name="nodeNames" value="OPGS1COM,OPGS2COM" />
    <PARAM name="backIp1s" value="192.168.0.141,192.168.0.145"/>
    <PARAM name="floatIp1" value="192.168.0.10"/>
    <PARAM name="gaussdbAppPath" value="/gauss/openGauss/app" />
    <PARAM name="gaussdbLogPath" value="/gaussarch/log" />
    <PARAM name="tmpMppdbPath" value="/gauss/openGauss/tmp" />
    <PARAM name="gaussdbToolPath" value="/gauss/openGauss/om" />
    <PARAM name="corePath" value="/gaussarch/corefile"/>
    <PARAM name="clusterType" value="single-inst"/>
  </CLUSTER>
 <DEVICELIST>
    <DEVICE sn="1000001">
      <PARAM name="name" value="OPGS1COM"/>
      <PARAM name="azName" value="AZ1"/>
      <PARAM name="azPriority" value="1"/>
      <PARAM name="backIp1" value="192.168.0.141"/>
      <PARAM name="sshIp1" value="192.168.0.141"/>
      <!--CM节点部署信息--> 
      <PARAM name="cmsNum" value="1"/> 
      <PARAM name="cmServerPortBase" value="17000"/> 
      <PARAM name="cmServerPortStandby" value="18000"/> 
      <PARAM name="cmServerListenIp1" value="192.168.0.141,192.168.0.145"/> 
      <PARAM name="cmServerHaIp1" value="192.168.0.141,192.168.0.145"/> 
      <PARAM name="cmServerlevel" value="1"/> 
      <PARAM name="cmServerRelation" value="OPGS1COM,OPGS2COM "/> 
      <PARAM name="cmDir" value="/gauss/openGauss/cm"/>
      <!--dn-->
      <PARAM name="dataNum" value="1"/>
      <PARAM name="dataPortBase" value="26000"/>
      <PARAM name="dataNode1" value="/gaussdata/openGauss/db1,OPGS2COM,/gaussdata/openGauss/db1"/>
      <PARAM name="dataNode1_syncNum" value="1"/>
      <PARAM name="localStreamIpmap1" value="(192.168.0.141, 192.168.0.141),(192.168.0.145, 192.168.0.145)"/>
      <PARAM name="remotedataPortBase" value="26000"/>
      <PARAM name="dataListenIp1" value="192.168.0.141,192.168.0.145"/>
      <PARAM name="floatIpMap1" value="floatIp1,floatIp1"/>
     </DEVICE>
     <DEVICE sn="1000002">
      <PARAM name="name" value="OPGS2COM"/>
      <PARAM name="azName" value="AZ1"/>
      <PARAM name="azPriority" value="1"/>
      <PARAM name="backIp1" value="192.168.0.145"/>
      <PARAM name="sshIp1" value="192.168.0.145"/>
      <!--CM--> 
      <PARAM name="cmDir" value="/gauss/openGauss/cm"/>
     </DEVICE>
  </DEVICELIST>
</ROOT>
```

## 4. 使用xml进行安装

安装成功后VIP便会自动绑定到对应的主机上，可以使用cm_ctl show命令查看VIP状态

# 二、带CM的数据库集群已安装的场景下配置VIP

## 1. 添加vip

```
ifconfig eth0:26000 192.168.0.10 netmask 255.255.255.0 up
```

## 2. ifconfig提权

修改权限文件/etc/sudoers，添加以下内容，为集群用户添加ifconfig权限。

```
# echo "Cmnd_Alias COMMAND_FLAG = /usr/sbin/ifconfig" >> sudoers
# echo "omm ALL=(root) NOPASSWD: COMMAND_FLAG" >> sudoers
```

## 3. 新增floatIp资源

```
cm_ctl res --add --res_name="VIP_az1" --res_attr="resources_type=VIP,float_ip=192.168.0.10"
```

```
cm_ctl res --edit --res_name="VIP_az1" --add_inst="node_id=1,res_instance_id=6001" --inst_attr="base_ip=192.168.0.141" 
cm_ctl res --edit --res_name="VIP_az1" --add_inst="node_id=2,res_instance_id=6002" --inst_attr="base_ip=192.168.0.145" 
```

执行完成后，建议使用cm_ctl res –check命令进行检查。
自定义资源文件要求每个节点都要有且一致

```
cm_ctl res --check
```

执行check完成后，在cmdataPath/cm_agent/目录下会生成一个自定义资源配置文件cm_resource.json，检查完成没有错误后，需要手动scp将该文件分发到其他节点

分发完成后需要重启集群才能生效。该配置文件对格式要求比较严格，所以该操作不建议使用直接修改文件的方式配置，建议配置后使用cm_ctl res –check命令进行校验。

## 4. 配置pg_hba.conf

在数据库pg_hba.conf文件中以sha256方式添加floatIp

```
host    all    all    192.168.0.10/32     sha256
```

## 5. 检查vip是否绑定成功

```
cm_ctl show
```

主节点postgresql.conf文件中，listen_addresses会自动添加vip（切换为备节点会自动删除vip）

## 6. jdbc连接测试

```
url=jdbc:postgresql://192.168.0.10:26000/postgres?connectTimeout=5&targetServerType=master&tcpKeepAlive=true
```
