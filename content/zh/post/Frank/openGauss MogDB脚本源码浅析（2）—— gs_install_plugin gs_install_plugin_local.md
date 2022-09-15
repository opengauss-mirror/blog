# openGauss/MogDB脚本源码浅析（2）—— gs\_install\_plugin/gs\_install\_plugin\_local
# 摘要
> openGauss提供了gs\_install\_plugin/gs\_install\_plugin\_local工具用于安装插件，目前支持安装的插件包括pg\_repack、pg\_trgm、dblink、wal2json、orafce、pg\_bulkload、pg\_prewarm等。gs\_install\_plugin适用于一主多备部署的MogDB,gs\_install\_plugin\_local适用于单机部署的MogDB。

这两个工具是python编写的脚本，直接可以看到源码实现。本文通过对两个工具的源码进行分析，希望从底层了解插件安装的原理，掌握原理后可以在安装出现问题或者手动安装时对整个安装流程有所帮助。



# 整体流程
主要流程有如下几个步骤：

## 1 解析参数
根据命令行传入参数进行解析，并设置相关变量，如：要安装哪些插件、是否强制覆盖、指定安装包路径、是否开启调试信息等。

![image](images/edUqM-zFoCgSLuhswp5lMJc9cd2xffXoZYJ4sAHx8bQ.png)

* \-h, --help

显示帮助信息

* \-p

指定plugins安装包位置，默认在\$GPHOME/script/static寻找plugins安装包

* \--all

安装全部插件

* \--force

指定覆盖旧的插件

* \--plugins

可安装多个插件，--plugins后跟插件名

* \--PLUGIN\_NAME

指定安装某一个插件，如：--dblink

* \--debug

输出debug信息

**详细请参考“****官方文档****”**

## 2 初始化Deploy类
将解析好的参数赋值给Deploy类的成员变量。

![image](images/pkFcRKjQtiMkENwnjalIv9aeJrr4wQV1bj7rRz9oUkU.png)

几处关键代码：

* 环境变量和关键目录

```python
GAUSSHOME = os.getenv("GAUSSHOME")
GPHOME = os.getenv('GPHOME')
LIB_POSTGRESQL_DIR = f'{GAUSSHOME}/lib/postgresql'
EXTENSION_DIR = f'{GAUSSHOME}/share/postgresql/extension'
CONTRIB_DIR = f'{GAUSSHOME}/share/postgresql/contrib'
```
主要是得到下载插件包的目录和安装openGauss插件的系统目录。

* 插件包目录

如果没有设置-p选型，则使用默认目录

```cpp
self.plugin_pkg = f"{GPHOME}/script/static/Plugins-*.tar.gz"
```
* 解压插件包的目录

```python
self._plugins_temp_dir = f"{GPHOME}/script/static/plugins/"
self.executor(f'mkdir -p {self._plugins_temp_dir}')
logger.debug(f"deconpress plugin package to {self._plugins_temp_dir}")
self.local_execute(f"tar -xf {self.plugin_pkg} -C {self._plugins_temp_dir}")
```
* 集群相关

```bash
-X                        Specify the XML file path
```
如果是集群安装（使用gs\_install\_plugin工具），需要指定cluster\_config.xml的位置，通过下面方法获得具体node的ip地址并检查链接：

```python
self.nodenames = self.read_cluster_hosts(self.xml)
self.ssh_tool = SshTool(self.nodenames)
```
* 读取desc.json文件

解压MogDB插件包后，文件夹下面有desc.json文件，文件中包含了版本信息，插件名称和安装的目标路径。插件名称对应同级目录下插件目录的名称，files节点对应了插件目录中的文件。

![image](images/zHvEfkd3q_7XwpdH2aqUWOFH_XsNM8OdYE_WyuOdHCI.png)

```json
{
    "version": "3.0.1",
    "plugins": [
        {
            "name": "pg_trgm",
            "files": {
                "pg_trgm.so": "lib/postgresql",
                "pg_trgm.control": "share/postgresql/extension",
                "pg_trgm--1.0.sql": "share/postgresql/extension",
                "pg_trgm--unpackaged--1.0.sql": "share/postgresql/extension"
            }
        },
        {
            "name": "dblink",
            "files": {
                "dblink.so": "lib/postgresql",
                "dblink.control": "share/postgresql/extension",
                "dblink--1.0.sql": "share/postgresql/extension",
                "dblink--unpackaged--1.0.sql": "share/postgresql/extension"
            }
        },
        {
            "name": "orafce",
            "files": {
                "orafce.so": "lib/postgresql",
                "orafce.control": "share/postgresql/extension",
                "orafce--3.17.sql": "share/postgresql/extension"
            }
        },
        {
            "name": "wal2json",
            "files": {
                "wal2json.so": "lib/postgresql"
            }
        },
        {
            "name": "pg_repack",
            "files": {
                "pg_repack": "bin",
                "pg_repack.so": "lib/postgresql",
                "pg_repack.control": "share/postgresql/extension",
                "pg_repack--1.4.6.sql": "share/postgresql/extension"
            }
        },
        {
            "name": "pg_bulkload",
            "files": {
                "pg_bulkload": "bin",
                "pg_bulkload.so": "lib/postgresql",
                "pg_bulkload.control": "share/postgresql/extension",
                "pg_bulkload--1.0.sql": "share/postgresql/extension",
                "pg_bulkload.sql": "share/postgresql/extension",
                "pg_bulkload--unpackaged--1.0.sql": "share/postgresql/extension",
                "uninstall_pg_bulkload.sql": "share/postgresql/extension",
                "pg_timestamp.so": "lib/postgresql",
                "pg_timestamp.sql": "share/postgresql/contrib",
                "postgresql": "bin",
                "uninstall_pg_timestamp.sql": "share/postgresql/contrib"
            }
        },
        {
            "name": "pg_prewarm",
            "files": {
                "pg_prewarm.so": "lib/postgresql",
                "pg_prewarm.control": "share/postgresql/extension",
                "pg_prewarm--1.1.sql": "share/postgresql/extension"
            }
        },
        {
            "name": "dolphin",
            "files": {
                "dolphin.so": "lib/postgresql",
                "dolphin.control": "share/postgresql/extension",
                "dolphin--1.0.sql": "share/postgresql/extension"
            }
        },
        {
            "name": "whale",
            "files": {
                "whale.so": "lib/postgresql",
                "whale.control": "share/postgresql/extension",
                "whale--1.0.sql": "share/postgresql/extension"
            }
        },
        {
            "name": "postgis",
            "files": {
                "libjson-c.so.2": "lib",
                "libgeos_c.so.1": "lib",
                "libproj.so.9": "lib",
                "libgeos-3.6.2.so": "lib",
                "libgdal.so.1": "lib",
                "liblwgeom-2.4.so.0": "lib",
                "postgis-2.4.so": "lib/postgresql",
                "rtpostgis-2.4.so": "lib/postgresql",
                "postgis_topology-2.4.so": "lib/postgresql",
                "postgis.control": "share/postgresql/extension",
                "postgis--2.4.2.sql": "share/postgresql/extension",
                "postgis_raster--2.4.2.sql": "share/postgresql/extension",
                "postgis_raster.control": "share/postgresql/extension",
                "postgis_topology--2.4.2.sql": "share/postgresql/extension",
                "postgis_topology.control": "share/postgresql/extension"
            }
        }
    ]
}
```
## 3 执行部署
![image](images/hnflVLcPNAr3tYz6tImWv7ATq03s1gUimTuoXpFbkDk.png)

* 解析desc.json文件，将解析结果存到datas\[\]中

```python
        datas = []
        # json file to obtain plugin information, add to datas
        with open(desc_path, 'r', encoding='utf-8') as f:
            result = json.load(f)
        if "all" in para:
            datas = result.get("plugins")
        else:                 
            for plugin in result.get("plugins", {}):
                if plugin.get("name") in para:
                    datas.append(plugin)
        if not datas:
            raise Exception("Invalid plugins: %s" % para)
```
* 遍历datas\[\]中插件信息，进行文件copy，完成安装

```python
# plugin file copy
for data in datas:
    name = data.get("name")
    if not name:
        continue
    for file, path in data.get("files").items():
        source_path = '/'.join([self.plugins_dir, name, file])
        target_dir = '/'.join([GAUSSHOME, path])
        self.copy_file(source_path, target_dir)
    print("SUCCESS: %s" % name)
```
* 文件copy过程

```python
def copy_file(self, source, target_dir):
    file_name = os.path.basename(source)

    if self.local_mode:
        if os.path.exists(f"{target_dir}/{file_name}") and not self.force:
            print("Warning: file %s already exists, skip copy" % (file_name))
            return
        return shutil.copy2(source, target_dir)
    for host in self.nodenames:
        if not self.force:
            _, output = self.ssh_tool.getSshStatusOutput(f"test -f {target_dir}/{file_name} && echo 1 || echo 0", hostList=[host])
            output = output.split(':')[-1]
            if int(output) == 1:
                print("Warning: [%s]: file %s already exists, skip copy" % (host, file_name))
                continue
        self.ssh_tool.scpFiles(source, target_dir, hostList=[host])
```
如果是本地安装则直接copy：`shutil.copy2(source, target_dir)`

如果是集群按照则使用scp进行copy：`self.ssh_tool.scpFiles(source, target_dir, hostList=[host])`



# 使用gs\_install\_plugin\_local一直openGauss插件
## 准备环境
* 下载，安装插件包

```bash
[omm@host-10-208-76-194 script]$ cd /opt/mogdb/tool/script/
[omm@host-10-208-76-194 script]$ mkdir static
[omm@host-10-208-76-194 script]$ cd static
[omm@host-10-208-76-194 static]$ wget https://cdn-mogdb.enmotech.com/mogdb-media/3.0.1/Plugins-3.0.1-openEuler-arm64.tar.gz
[omm@host-10-208-76-194 script]$ ./gs_install_plugin_local
SUCCESS: pg_trgm
SUCCESS: dblink
SUCCESS: orafce
SUCCESS: wal2json
SUCCESS: pg_repack
SUCCESS: pg_bulkload
SUCCESS: pg_prewarm
SUCCESS: dolphin
SUCCESS: whale
SUCCESS: postgis

```
* 安装插件（默认全部安装）

![image](images/0VHoHHjvJv3SbUbRClBO96vF9era1KSfM4JABrhNqCI.png)

* 创建插件

```sql
MogDB=# create extension orafce;
CREATE EXTENSION
MogDB=#

```
* 下载编译openGauss插件

参见“MogDB秘籍 之 乾坤大挪移”中的关于编译安装openGauss插件章节。

## 迁移插件
> 以lo插件为例，进行迁移

* 创建lo目录

```bash
[omm@host-10-208-76-194 plugins]$ cd  /opt/mogdb/tool/script/static/plugins/plugins
[omm@host-10-208-76-194 plugins]$ ls
dblink  desc.json  dolphin  orafce  pg_bulkload  pg_prewarm  pg_repack  pg_trgm  postgis  wal2json  whale
[omm@host-10-208-76-194 plugins]$ mkdir lo
[omm@host-10-208-76-194 plugins]$ ls
dblink  desc.json  dolphin  lo  orafce  pg_bulkload  pg_prewarm  pg_repack  pg_trgm  postgis  wal2json  whale
[omm@host-10-208-76-194 plugins]$
```
* 将openGauss插件复制到MogDB插件目录，并修改属组

```bash
[root@host-10-208-76-194 lo]# cp lo.so lo.control lo--1.0.sql /opt/mogdb/tool/script/static/plugins/plugins/lo
[root@host-10-208-76-194 lo]# chown -R omm:omm /opt/mogdb/tool/script/static/plugins/plugins/lo
```
* 修改desc.json

![image](images/CIqNKVJAIA0bRKmbhN87vkvw3u9GVIU1dqvtk3C6oAU.png)

* 重新打包

```bash
tar -zcvf Plugins-3.0.1-openEuler-arm64.tar.gz plugins/
```
注：这里重新打包有点麻烦，也可以修改代码，注释掉解压的步骤，或者优雅一点，则可以增加参数控制是否重新解压，如果不重新打包则解压是desc.json会被覆盖成老版本的，导致安装新插件失败。



# 总结
总的来说这两个工具还是比较好用的，代码实现也比较简单。了解原理之后可以根据几个关键路径手动安装，或者在遇到安装问题的时候可以通过本文的分析继续排查解决。