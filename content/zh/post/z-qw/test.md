+++

 title = "openGauss社区入门（openGauss-常用数据类型）" 

date = "2022-08-10" 

tags = ["openGauss社区开发入门"] 

archives = "2022-08" 

author = "z-qw" 

summary = "openGauss社区开发入门" 

img = "" 

times = "18:30" 

+++


## 常用数据类型
| 数据类型 | 说明 |
| --- | --- |
| 布尔类型 | boolean  true/'1'/'yes' false/'0'/'no' |
| 数值类型 | smallint 两字节
int 4字节
bigint 8字节
double/real浮点型
money 货币（两位小数 |
| 字符类型 | varchar(n 几位数)/char/text |
| 二进制 | bytea |
| 位串类型 | 一串0、1  bit(n)/bit varying(n) |
| 日期和时间 | data/time/timestamp |
| 枚举类型 | create type enum_name as enum
('apple','banana');
create table table_name
(id int, name enum_name); |
| 几何类型 | 点point 直线line 线段lseg 路径path
多边形polygon 圆cycle |
| 网络地址 | cidr inet macaddr |
| 数组类型 |  |
| 复合类型 |  |
| xml类型 | XML |
| JSON | JSON |
| range | 范围 |
| 对象标识符类型 | oid类型、regproc类型、regclass类型 |
| 伪类型 | 
 |
| 其他 | UUID |


### 1.函数类型转换
函数CAST类型转换
select cast('5' as int),cast('20114-0717' as date);
双冒号的方式
select '5'::int,'2014-07-17'::date;

### 2.布尔型
and/or/not
null表示未知
is 运算符
unknown

### 3.小数
精确的小数类型 numeric、numeric(m,n）、numeric(m)
numeric=decimal
numeric(perision,scale) persion精度，scale标度
numeric(persion)=numeric(percision,0)
声明标度，超过位数会四舍五入
声明精度的，小数点左右加起来的位数，超过该精度会报错
对于 numeric(3,3)因为精度和标度都是三位，因此，该数字只能小于1
浮点数类型不精确的变精度数字类型 double;real 
### 4. 序列类型 serial
### 5.货币类型
lc_monetary 其中，en_US.UTF-8 美国；zh_CN.UTF-8 中国
### 6. 位串类型
bit(n) bit varying(n) n 表示二进制的位数
bit(n)必须等于该位数，否则会报错
bit varying(n) 不能超过该位数,否则会报错
bit 默认一位
### 7. 日期和时间
### 8. 枚举
create type type_name as enum('a','b','c',);
查看枚举类型 \dT
### 9. 几何类型
### 10. 复合类型
筛选复合型的某个字段
range '[a,b]'   (a,b)  [a,b)  '['  ']'  包含该数  '('  ')' 不包含该数
### 11.数组类型
int[ ]一维数组
int[ ][ ] 二维数组 
