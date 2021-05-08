+++

title = "openGauss数据动态脱敏" 

date = "2021-04-19" 

tags = ["openGauss核心技术"] 

archives = "2021-04" 

author = "贾军锋" 

summary = "openGauss数据动态脱敏"

img = "/zh/post/jiajunfeng/title/img20.png" 

times = "15:30"

+++

# openGauss数据动态脱敏<a name="ZH-CN_TOPIC_0000001142142009"></a>

## 常见脱敏路线<a name="section1474294910113"></a>

结果集解析： 不改写发给数据库的语句，需要提前获悉数据表结构，待数据库返回结果后再根据表结构判断集合内哪些数据需要脱敏，并逐条改写结果数据。

语句改写： 将包含敏感字段查询的语句改写，对于查询中涉及的敏感字段（表列）通过外层嵌套函数的方式改写，使得数据库运行查询语句时返回不包含敏感数据的结果集。

openGauss采用了语句改写的方式实现数据脱敏，无论对于性能还是准确性来说都是较为优秀的脱敏方案。基于语句改写的思想，在查询解析获取查询树后，根据用户定义的脱敏策略识别查询树目标结点\(Node\)，并对待脱敏结点进行改写构造“脱敏查询树”，再交由数据库内核执行最终返回脱敏后数据，10万条敏感数据脱敏的性能损耗低于5%。openGauss从1.1.0版本定义了一套完整的内置安全策略模型，基于该模型用户可以定义资源标签来标识敏感数据，针对不同的资源标签类别和内容可定义相关的安全策略机制。

## 内置安全策略<a name="section660112266147"></a>

-   openGauss中的动态数据脱敏是以内置安全插件（security plugin）的方式与数据库部署在一起的，业务方面无需额外适配就可使用内置安全策略。
-   SQL的解析与脱敏策略匹配交由openGauss安全策略模块负责，业务在配置脱敏策略后即可生效。
-   安全策略（Security Policy）模型，是指通过配置一系列安全策略来对用户行为进行识别和保护，提供了包括保护用户敏感数据的能力。
-   资源标签（Resource Label）是Security Policy的基础，它的本质是一系列数据库资源集合。通过归类数据库资源，将这些资源统一地投入到各种安全策略中去管理。
-   动态数据脱敏特性便是利用资源标签去识别敏感数据，然后匹配脱敏策略，实现对敏感数据的屏蔽。

**脱敏策略内容:**

脱敏方式\(Masking Function\)，是指该脱敏策略使用何种方式对目标字段进行脱敏，目前openGauss预置了7种脱敏方式：creditcardmasking、 basicemailmasking、fullemailmasking、alldigitsmasking、shufflemasking、randommasking、maskall，分别适用于不同的脱敏场景。

脱敏对象\(Resource Label\)，是指脱敏策略生效时作用的对象集合（LABEL），若查询目标字段存在于LABEL中，则该字段将会根据脱敏策略进行敏感数据脱敏，openGauss动态数据脱敏特性支持对仅包含数据列的LABEL进行脱敏。

过滤器，指出脱敏策略在何种用户场景下生效，主要涉及USER（用户名）、APP（用户登录客户端名称）、IP（用户所处的ip）。当查询用户同时满足Masking Filter所指定的阈值时，数据脱敏策略才会生效。

## 触发脱敏策略<a name="section13155123971510"></a>

当系统接收到查询命令时，security\_plugin将在解析器中拦截语义分析生成的查询树（Query），首先根据用户登录信息（用户名、客户端、IP）筛选出满足用户场景的脱敏策略。由于脱敏策略是基于（仅包含表列的）资源标签配置的，因此需要判断查询树的目标节点是否属于某个资源标签，然后将识别到的资源标签与脱敏策略相匹配，根据策略内容将查询树目标节点改写，最终将查询树返还给解析器。

security\_plugin模块由于内置查询树脱敏方式，数据访问者不会感知内置安全策略重写查询树的过程，如同执行普通查询一样去访问数据，同时保护数据隐私。

## 实操示例<a name="section37157714166"></a>

**1. 打开内置安全策略\[ 默认off \]**

```
[omm@lab01 ~]$ gs_guc reload -N all -I all -c "enable_security_policy=on"
[omm@lab01 ~]$ gsql -d postgres -p 26000 -c "show enable_security_policy ;"
 enable_security_policy
------------------------
 on
```

**2. 创建测试表及数据**

创建测试表person

```
create table person(id int primary key,name varchar(20),creditcard varchar(20),address varchar(50));
insert into person values(1,'张三','1234-4567-7890-0123','huoyue Mansion, No. 98, 1st Fuhua Street');
insert into person values(2,'李四','1111-2222-3333-4444','Futian District, Shenzhen City');
select * from person;
+----+------+---------------------+------------------------------------------+
| id | name |     creditcard      |                 address                  |
+----+------+---------------------+------------------------------------------+
|  1 | 张三 | 1234-4567-7890-0123 | huoyue Mansion, No. 98, 1st Fuhua Street |
|  2 | 李四 | 1111-2222-3333-4444 | Futian District, Shenzhen City           |
+----+------+---------------------+------------------------------------------+
```

创建测试表orders

```
create table orders(id int primary key,pid int,customername varchar(20),order_no int,email varchar(50));
insert into orders values(1,1,'李雷',13002345,'654321@qq.com');
insert into orders values(2,1,'韩梅',13001234,'testdb@huawei.com');
insert into orders values(3,2,'Jerry',13009876,'test123@google.com');
select * from orders;
+----+-----+--------------+----------+
| id | pid | customername | order_no |
+----+-----+--------------+----------+
|  1 |   1 | 李雷         | 13002345 |
|  2 |   1 | 韩梅         | 13001234 |
|  3 |   2 | Jerry        | 13009876 |
+----+-----+--------------+----------+
```

**3. 策略配置**

创建资源标签【对表的敏感字段添加资源标签\(需要拥有poladmin权限\)】

```
create resource label creditcard_label add column(person.creditcard);
create resource label customer_label   add column(orders.customername);
create resource label email_label      add column(orders.email);
create resource label id_label         add column(orders.id);
create resource label order_no_label   add column(orders.order_no);
create resource label pid_label        add column(orders.pid);
```

创建脱敏策略

```
-- 语法：
CREATE MASKING POLICY policy_name masking_clause [, ... ] [ policy_filter_clause ] [ ENABLE | DISABLE ];
where masking_clause can be:
masking_function ON LABEL(label_name [, ... ],*)
where masking_function can be:
{ maskall | randommasking | creditcardmasking | basicemailmasking | fullemailmasking | shufflemasking | alldigitsmasking }
where policy_filter_clause can be:
FILTER ON { ( FILTER_TYPE ( filter_value [, ... ],* ) ) [, ... ],* }
where FILTER_TYPE can be:
{ APP | ROLES | IP }

-- 创建策略一【脱敏方式：maskall】
策略名：mask_card_pol
针对用户：user1
针对IP：192.168.0.99
针对应用：gsql
脱敏方式：creditcardmasking
create masking policy mask_card_pol
       creditcardmasking on label (creditcard_label)
       filter on roles('user1') ,IP('192.168.0.99'),APP('gsql');     
-- 小缺陷：测试发现应用程序无法识别"Data Studio"，这个APP列表待完善,或者使用方法待说明

-- 创建策略二：【脱敏方式：maskall】
create masking policy mask_name_pol maskall on label(customer_label);

-- 创建策略三：【脱敏方式：randommasking】   
create masking policy mask_id_pol randommasking on label(id_label);

-- 创建策略四：【脱敏方式：basicemailmasking】   
create masking policy mask_email_pol basicemailmasking on label(email_label);

-- 创建策略五：【脱敏方式：alldigitsmasking 】  
create masking policy mask_order_no_pol alldigitsmasking on label(order_no_label);

-- 创建策略六：【脱敏方式：shufflemasking 】  
create masking policy mask_pid_pol shufflemasking on label(pid_label);
```

脱敏效果测试

```
[omm@lab01 ~]$ gsql -d mydb -p 26000 -h 192.168.0.99 -U user1 -r
mydb=> select * from person;
 id | name |     creditcard      |                 address
----+------+---------------------+------------------------------------------
  1 | 张三 | xxxx-xxxx-xxxx-0123 | huoyue Mansion, No. 98, 1st Fuhua Street
  2 | 李四 | xxxx-xxxx-xxxx-4444 | Futian District, Shenzhen City

mydb=# select * from orders;
 id | pid | customername | order_no |       email
----+-----+--------------+----------+--------------------
  0 |   0 | xx           |        0 | xxxxxx@qq.com
  0 |   0 | xx           |        0 | xxxxxx@huawei.com
  0 |   0 | xxxxx        |        0 | xxxxxxx@google.com
```

相关数据字典

```
-- 查询脱敏策略
mydb=# select * from gs_masking_policy;
      polname      | polcomments |         modifydate         | polenabled
-------------------+-------------+----------------------------+------------
 mask_card_pol     |             | 2021-04-06 11:38:24.746857 | t
 mask_name_pol     |             | 2021-04-06 14:53:48.3176   | t
 mask_id_pol       |             | 2021-04-06 14:53:52.079475 | t
 mask_order_no_pol |             | 2021-04-06 14:55:50.421073 | t
 mask_pid_pol      |             | 2021-04-06 15:00:09.927095 | t
 mask_email_pol    |             | 2021-04-06 15:02:26.486597 | t

-- 查询策略label
mydb=# select * from gs_policy_label;
    labelname     | labeltype | fqdnnamespace | fqdnid |  relcolumn   | fqdntype
------------------+-----------+---------------+--------+--------------+----------
 creditcard_label | resource  |          2200 |  16404 | creditcard   | column
 customer_label   | resource  |          2200 |  16438 | customername | column
 email_label      | resource  |          2200 |  16438 | email        | column
 id_label         | resource  |          2200 |  16438 | id           | column
 order_no_label   | resource  |          2200 |  16438 | order_no     | column
 pid_label        | resource  |          2200 |  16438 | pid          | column

-- 查询策略Filter
mydb=# select * from gs_masking_policy_filters;
  filtertype  | filterlabelname | policyoid |        modifydate         |             logicaloperator
--------------+-----------------+-----------+---------------------------+-----------------------------------------
 logical_expr | logical_expr    |     16420 | 2021-04-06 11:38:24.74733 | **roles[16399]ip[192.168.0.99]app[gsql]
```

## 总结<a name="section73961317203010"></a>

关于脱敏方式的实测效果如下:

maskall                  --\> 实测效果：将所有数据内容设置为x;

creditcardmasking --\> 实测效果：保留连接符号\(-\)和末尾4位数字，其余全部设为x;

basicemailmasking --\> 实测效果：将@符号之前的所有数据内容设为x;

fullemailmasking    --\> 实测效果：仅保留@符号和邮箱dot结尾，其余全部设为x;

randommasking || shufflemasking || alldigitsmasking --\> 实测效果：将所有数据内容设置为0，这里仅测试了数值类型，没有测试其他数据类型的脱敏效果。

openGauss 的动态脱敏功能完全可以满足绝大多数的脱敏场景应用需求，但是从结果上面看，对数字类型的脱敏显得有些简单粗暴 \[ 将测试的主键列ID全部置0 \] 。

如果个人测试方法没有问题，那么这就存在应用的使用问题，在实际的测试环境中，如果动态脱敏后的数据丧失了其主键唯一性，这样的数据还需要做二次处理，无法直接使用。如果脱敏算法能够使用具有唯一特性的随机数对指定的数据进行动态脱敏，那就更好了，这一点期待进一步完善。

