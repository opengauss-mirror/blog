+++

title = "OpenGauss/MogDB TPCH性能测试步骤" 

date = "2022-05-24" 

tags = ["OpenGauss/MogDB TPCH性能测试步骤"] 

archives = "2022-05" 

author = "云和恩墨" 

summary = "OpenGauss/MogDB TPCH性能测试步骤"

img = "/zh/post/enmo/title/img.png" 

times = "10:20"
+++

# OpenGauss/MogDB TPCH性能测试步骤

本文出处：[https://www.modb.pro/db/226169](https://www.modb.pro/db/226169)

TPCH官网直接下载的包无法直接兼容OpenGauss/MogDB/Postgresql，为了兼容pg/og的语法，总结了测试步骤供大家参考

1. 建表

```
gsql -p 26000 -d postgres -U tpch < createtab_og.sql 
```

1. 生成数据

例：
生成100G数据

```
./dbgen -s 100 
```

例：
8线程生成500G数据

```
#!/bin/sh
./dbgen -vf -s 500 -S 1 -C 8 &
./dbgen -vf -s 500 -S 2 -C 8 &
./dbgen -vf -s 500 -S 3 -C 8 &
./dbgen -vf -s 500 -S 4 -C 8 &
./dbgen -vf -s 500 -S 5 -C 8 &
./dbgen -vf -s 500 -S 6 -C 8 &
./dbgen -vf -s 500 -S 7 -C 8 &
./dbgen -vf -s 500 -S 8 -C 8 &
```

1. 数据转换
   生成的数据文件格式为tbl，转为csv格式

```
for i in `ls .tbl`;do sed 's/|$//' $i > ${i/tbl/csv};echo $i;done; 
```

1. 导入数据

```
dir=/TPCH/TPCH_gs/TPCH/dbgen/data
opts='-p 26000 -d postgres'
gsql $opts -c "COPY tpch.region FROM '$dir/region.csv' WITH (FORMAT csv,DELIMITER '|')"
gsql $opts -c "COPY tpch.nation FROM '$dir/nation.csv' WITH (FORMAT csv,DELIMITER '|')"
gsql $opts -c "COPY tpch.part FROM '$dir/part.csv' WITH (FORMAT csv,DELIMITER '|')"
gsql $opts -c "COPY tpch.supplier FROM '$dir/supplier.csv' WITH (FORMAT csv,DELIMITER '|')"
gsql $opts -c "COPY tpch.customer FROM '$dir/customer.csv' WITH (FORMAT csv,DELIMITER '|')"
gsql $opts -c "COPY tpch.partsupp FROM '$dir/partsupp.csv' WITH (FORMAT csv,DELIMITER '|')"
gsql $opts -c "COPY tpch.orders FROM '$dir/orders.csv' WITH (FORMAT csv,DELIMITER '|')"
gsql $opts -c "COPY tpch.lineitem FROM '$dir/lineitem.csv' WITH (FORMAT csv,DELIMITER '|')"
```

1. 创建所需函数

```
create or replace function NUMTOYMINTERVAL(float8, text) returns interval as $$ select ($1||' '||$2)::interval;  
$$ language sql strict immutable;

create or replace function NUMTODSINTERVAL(float8, text) returns interval as $$ select ($1||' '||$2)::interval;  
$$ language sql strict immutable;
```

1. 执行SQL文件夹下sql

```
#!/bin/bash
opts='-p 26000 -d postgres -U tpch -W 'password''
for i in `seq 10 22`
do
echo $i"'s  result"
gsql ${opts} -f ${i}.sql
done
```

TPCH包及建表语句，执行SQL语句见网盘：
链接: [https://pan.baidu.com/s/1Cg7neIxXGjDYS7BfZxl2IQ](https://pan.baidu.com/s/1Cg7neIxXGjDYS7BfZxl2IQ) 密码: urkt
