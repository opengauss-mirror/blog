# <font size=4>存储引擎概述</font>
<font size=2>&emsp;&emsp;存储引擎顾名思义就是数据的存放方式，比如mysql有myisam和innodb存储引擎，他们都是行存，只是myisam不支持事务。另外存储引擎还有列模式、行模式、内存数据库等等，openguass的存储引擎关系可以用以下图来表示：
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221104-f4b2cb1c-045d-4a3c-82ed-1d8e32e947da.png)
下面分别介绍以下这几种存储引擎的区别：</font>
## <font size=3>磁盘存储引擎</font>
<font size=2>&emsp;&emsp;顾名思义是数据按照一定格式存放在物理磁盘的数据块中，opengauss的最小存储单位是page页，类似于Oracle的最小存储单位block，写入磁盘则把page页里的内容写入到物理磁盘block中。</font>
## <font size=3>内存存储引擎</font>
<font size=2>&emsp;&emsp;与磁盘存储引擎相反，数据是存放到内存中的，内存中的数据没有办法想磁盘一样进行持久化，但是内存数据库节省了物理磁盘到内存的IO处理，效率会更高。为了满足数据的持久化不至于重启以后数据就丢失了，目前很多数据库也会把内存里的数据按照一定条件进行落盘进行持久化处理，每次重新启动以后把物理文件内容重新加载到内存中。类似于opengauss的MOT。</font>
## <font size=3>行存储引擎</font>
<font size=2>&emsp;&emsp;属于磁盘存储引擎，数据按照行的格式存储在物理磁盘中，行存储引擎适合OLTP交易类系统，opengauss默认的也是行存储引擎。</font>
## <font size=3>列存储引擎</font>
<font size=2>&emsp;&emsp;属于磁盘存储引擎，数据按照列的格式存储在物理磁盘中，行存储引擎适合OLAP交易类系统。</font>
## <font size=3>行存列存区别</font>
<font size=2>&emsp;&emsp;opengauss既支持行存也支持列存，也就是目前所说的HTAP交易分析类系统，据我所知目前有部分厂商虽然都支持行存和列寸，但是需要额外的付费。用两张图展示一下一个表在行存和列存模式在物理磁盘上的存储形式：</font>
|id|name|age|
|--|--|--|
|1|张三|32|
|2|李四|22|
|4|王五|42|
|5|赵六|52|
<font size=2>行存磁盘存储格式如下：</font>
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221104-8d29de7c-9363-4e3b-8498-2ba32e591d4c.png)
<font size=2>列存磁盘存储格式如下：</font>
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221104-a514f468-e890-4971-9843-1e5ebf83865f.png)
<font size=2>可见列寸更适合统计分析类交易，比如max、min等等，另外更便于压缩存放。
## <font size=3>Ustroe存储引擎</font>
<font size=2>&emsp;&emsp;Ustore是原地更新(in-place update)设计，支持 MVCC(Multi- Version Concurrency Control，多版本并发控制)，类似于Oracle的设计，最新的数据（已提交）与前版本数据（undo）分开存储，支持闪回查询等操作。但是现在这个存储引擎不是opengauss的默认存储引擎，估计后续版本稳定以后会默认此存储引擎。
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221104-75ced743-c389-475c-9701-d0bec96a1193.png)
## <font size=3>Astroe存储引擎</font>
<font size=2>&emsp;&emsp;采用追加更新模式，及同一个page页中既存在前映像也存在当前值，只是前映像会被标记为删除，当前是opengauss的默认存储引擎，Astroe存储引擎由于同一个块中包含太多的前映像，如果频繁的更新操作会导致大量的磁盘“垃圾”，因为在执行查询操作的时候即使标记了删除也会扫描，所以大大的降低性能，建议定期执行VACUUM或者VACUUM full进行清理。
![image.png](https://oss-emcsprod-public.modb.pro/image/editor/20221104-5cf6e1bd-469b-40c8-8983-96400560591e.png)
# <font size=4>和存储引擎相关的参数</font>
## <font size=3>概述</font>
<font size=2>&emsp;&emsp;正常情况下在执行一条sql查询的时候数据库从物理磁盘读取整个数据块到内存，然后在内存中进行过滤返回满足条件的行，当然在某些情况下可以把算子下推，来减少加载到内存的数据块数量，因此就需要在内存中开辟一块区域来存放从磁盘读取出来的块，这个类似于oracle的块高速缓冲区mysql的innodb_buffer_pool等，几乎所有的RDBMS数据库在内存中都有一块这样的区域。</font>
## <font size=3>磁盘存储引擎</font>
<font size=2>&emsp;&emsp;磁盘存储引擎的参数主要存放在postgresql.conf配置文件中，默认路径在DATADIR中，主要通过两个参数控制buffer的大小，主要有shared_buffers及cstore_buffers两个参数，shared_buffers是行存储引擎使用的内存，cstore_buffers主要控制列存储引擎使用的内存，如果是OLTP类系统可以把cstore_buffers调小，如果是OLAP类系统可以把cstor_buffers调大避免浪费内存，如果是HTAP类系统则都可以调大。
## <font size=3>MOT存储引擎</font>
<font size=2>&emsp;&emsp;MOT是通过内存存储引擎管理的内存表，支持事务的ACID特性，由于内存是易丢失的，所以如果想保证数据的持久性，需要把MOT的数据同步到磁盘中，MOT是通过WAL重做日志和MOT检查点实现了数据的持久性。
&emsp;&emsp;MOT的参数不在postgresql.conf中进行定义，它的参数主要在mot.conf中，这里不在详细转述，请参考官方文档。也可以参考我之前些的一篇关于mot测试的笔记《[MogDB学习笔记-从9开始(存储引擎和闪回)](https://www.modb.pro/db/467296)》
# <font size=4>创建基于不同存储引擎的表</font>
## <font size=3>创建基于Astore的行存表</font>
<font size=2>&emsp;&emsp;在Mogdb中默认创建的Astore的表，通过设置enable_default_ustore_table参数为on可以修改为默认创建Ustore的表，当然在创建表的时候可以指定storage_parameter参数选择存储引擎。</font>
```sql
CREATE TABLE astore_table (
id character varying(2) NOT NULL,
name character varying(50),
saler numeric(10,2),
dept_no character varying(2)
)
WITH (STORAGE_TYPE=ASTORE);
```
## <font size=3>创建基于Ustore的行存表</font>
```sql
CREATE TABLE astore_table (
id character varying(2) NOT NULL,
name character varying(50),
saler numeric(10,2),
dept_no character varying(2)
)
WITH (STORAGE_TYPE=USTORE);
```
## <font size=3>创建列存表</font>
```sql
CREATE TABLE column_table (
id character varying(2) NOT NULL,
name character varying(50),
saler numeric(10,2),
dept_no character varying(2)
)
WITH (ORIENTATION = COLUMN);
```
## <font size=3>创建MOT内存表</font>
```sql
create FOREIGN TABLE mot_table (
id character varying(2) NOT NULL,
name character varying(50),
saler numeric(10,2),
dept_no character varying(2)
);
```