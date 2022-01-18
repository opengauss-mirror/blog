+++

title =  "openGauss/MogDB大对象LargeObject存取测试" 

date = "2021-12-17" 

tags = [ "openGauss/MogDB大对象LargeObject存取测试"] 

archives = "2021-12" 

author = "多米爸比" 

summary = "openGauss/MogDB大对象LargeObject存取测试"

img = "/zh/post/2022/title/img14.png" 

times = "12:30"

+++

# openGauss/MogDB大对象LargeObject存取测试<a name="ZH-CN_TOPIC_0000001232774727"></a>

openGauss/MogDB数据库里bytea二进制类型受segment size编译参数限制，默认不能超过1GB，如果字段存储数据超过1GB可以使用lo（Large Object）扩展类型。

## lo类型需要先创建lo extension<a name="section126953512333"></a>

```
$ gsql -p5432 -Uomm postgres -r
gsql ((MogDB 2.0.1 build f892ccb7) compiled at 2021-07-09 16:15:21 commit 0 last mr  )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

postgres=# create extension lo;
CREATE EXTENSION
```

创建完lo扩展，我们新建test\_lo表，info字段使用lo类型。

```
postgres=# create table test_lo(id int,info lo);
CREATE TABLE
```

创建test\_lo表管理触发器，对update和delete操作使用lo\_manage函数管理，不然会产生孤立大对象。

```
postgres=# create trigger test_lo before UPDATE OR DELETE ON test_lo FOR EACH ROW EXECUTE procedure lo_manage(info);
WARNING:  Trigger function with non-plpgsql type is not recommended.
DETAIL:  Non-plpgsql trigger function are not shippable by default.
HINT:  Unshippable trigger may lead to bad performance.
CREATE TRIGGER
```

使用dd生成2GB文件

```
postgres=#  \! dd if=/dev/zero of=test_lo bs=1M count=2048 && sync
记录了2048+0 的读入
记录了2048+0 的写出
2147483648字节（2.1 GB，2.0 GiB）已复制，0.805435 s，2.7 GB/s
```

## 测试lo\_import函数导入数据到数据表<a name="section7375536163413"></a>

```
postgres=# insert into test_lo values(1,lo_import('/home/omm/test_lo'));
INSERT 0 1
```

可以看到数据可以正常导入，如果不使用lo类型，使用bytea类型会提示下面的报错。

```
ERROR:  requested length too large
```

## 测试lo\_export函数导出数据表数据到文件<a name="section8447154411343"></a>

```
postgres=# select lo_export(test_lo.info,'/home/omm/test_ext_lo') from test_lo where id=1;
 lo_export 
-----------
         1
(1 row)
```

可以看到数据正常导出。

查看导入导出的数据文件，也可以使用diff命令进行比对。

```
postgres=# \! ls -lh test_*
-rw-r--r-- 1 omm dbgrp 2.0G 12月 17 13:00 test_ext_lo
-rw------- 1 omm dbgrp 2.0G 12月 17 12:58 test_lo
```

## 查看数据表大对象字段大小<a name="section5287165915349"></a>

分两步进行，首先查大对象字段的oid（lo类型字段在用户表里面只存储一个oid引用指针，并不实际存数据）

```
postgres=# select * from test_lo;
 id | info  
----+-------
  1 | 16392
(1 row)
```

实际数据使用多条bytea记录存储在pg\_largeobject表，可以根据oid查询统计字段的大小

```
postgres=# select loid,pg_size_pretty(sum(octet_length(data)))
from pg_largeobject 
where loid =16392  
group by loid;
 loid  | pg_size_pretty 
-------+----------------
 16392 | 2048 MB
(1 row)
```

也可以使用如下函数来查询

```
create or replace function get_lo_size(oid)
returns bigint
volatile strict
as $function$
declare
    fd integer;
    sz bigint;
begin
    fd := lo_open($1, x'40000'::int);
	perform lo_lseek64(fd, 0, 2);
    sz := lo_tell64(fd);
    perform lo_close(fd);
    return sz;
end;
$function$ language plpgsql;
```

查询结果如下

```
postgres=# select pg_size_pretty(get_lo_size(16392));
 pg_size_pretty 
----------------
 2048 MB
(1 row)
```

再来测试JDBC应用层的使用

## JDBC-Java文件入库<a name="section156801915143711"></a>

```
	public static void main(String[] args) throws Exception{ 
		Class.forName("org.postgresql.Driver");

		Connection conn = DriverManager.getConnection("jdbc:postgresql://ip:port/dbname","username","password");
		
		conn.setAutoCommit(false);
		
		LargeObjectManager lobj = conn.unwrap(org.postgresql.PGConnection.class).getLargeObjectAPI();

		long oid = lobj.createLO(LargeObjectManager.READ | LargeObjectManager.WRITE);

		LargeObject obj = lobj.open(oid, LargeObjectManager.WRITE);

		File file = new File("c:/work/test_lo");
		FileInputStream fis = new FileInputStream(file);

		byte buf[] = new byte[10*1024*1024];
		int s, tl = 0;
		while ((s = fis.read(buf, 0, 2048)) > 0)
		{
		    obj.write(buf, 0, s);
		    tl += s;
		}

		obj.close();

		PreparedStatement ps = conn.prepareStatement("INSERT INTO test_lo VALUES (?, ?)");
		ps.setInt(1, 100);
		ps.setLong(2, oid);
		ps.executeUpdate();
		ps.close();
		fis.close();

		conn.commit();
		conn.close();
		
	}
```

## JDBC-Java读数据输出到文件<a name="section1422319466371"></a>

```
	public static void main(String[] args) throws Exception{ 
		Class.forName("org.postgresql.Driver");

		Connection conn = DriverManager.getConnection("jdbc:postgresql://ip:port/dbname","username","password");

		conn.setAutoCommit(false);

		LargeObjectManager lobj = conn.unwrap(org.postgresql.PGConnection.class).getLargeObjectAPI();

		PreparedStatement ps = conn.prepareStatement("SELECT info FROM test_lo WHERE id = ?");
		ps.setInt(1, 100);
		ResultSet rs = ps.executeQuery();
		
		File file = new File("c:/work/test_out_lo");
		FileOutputStream fos = new FileOutputStream(file);
		
		while (rs.next())
		{
		    long oid = rs.getLong(1);
		    LargeObject obj = lobj.open(oid, LargeObjectManager.READ);

			byte buf[] = new byte[10*1024*1024];
			int s, tl = 0;
			while ((s = obj.read(buf, 0, 2048)) > 0)
			{
				fos.write(buf, 0, s);
			    tl += s;
			}

		    obj.close();
		}
		rs.close();
		ps.close();
		fos.close();

		conn.commit();
		conn.close();
		
	}
```

