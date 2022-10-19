+++

title = "一种可能是目前最快的从ORACLE同步数据到MogDB(openGauss)的方式" 

date = "2022-09-15" 

tags = ["openGauss"] 

archives = "2022-09" 

author = "DarkAthena" 

summary = "一种可能是目前最快的从ORACLE同步数据到MogDB(openGauss)的方式"

img = "/zh/post/DarkAthena/title/img.png" 

times = "18:41"

+++

# 一种可能是目前最快的从ORACLE同步数据到MogDB(openGauss)的方式

## 一、前言
目前openGauss支持oracle中的绝大部分数据类型，基本上不用考虑类型转换的问题。所以从oracle到MogDB(openGauss)的数据同步无非就是从oracle里查出来再插入到MogDB(openGauss)中，只是查出来的结果是存成文件还是放内存而已。
用文件的形式，oracle端有sqluldr2可以快速导出，MogDB(openGauss)端可以用copy命令快速载入；
如果是放内存，则需要一定量的代码开发，而且目前通用的数据同步工具在导入时，大多用的是逐行insert命令，效率很低。
所以，是否存在一种可能，只利用现有的工具，就能实现数据的高速同步且不需要存文件？

在说这个方案前，先简单说明一下这个方案的几个知识点。
## 二、知识点
### 1.sqluldr2
sqluldr2是楼方鑫针对Oracle数据库开发的数据快速导出工具，应该绝大多数oracle用户都用过，因为它依旧是目前从oracle中导出文本数据最快的方式了,速度远超oracle官方的sqlplus spool导出。但是大多数人基本上都只使用其导出文件的功能，而不知道这个工具还可以导出标准输出（所谓标准输出即不生成文件，直接打印在屏幕上）
sqluldr2完整文档：[https://www.doc88.com/p-6522591706862.html](https://www.doc88.com/p-6522591706862.html)

### 2.gsql/psql(\copy 元命令)
gsql/psql的"\copy"元命令
（注意区别于sql命令中的"copy"，"copy"是服务器端的,"\copy"是客户端的）,
常用于和表和文件之间的导入和导出，效率很快，因为已经指定了表，不需要再进行字段类型的识别，绕开了sql解析引擎，直接写入表中。
但大多数人很少用到 stdin和stdout（除非是基于其他高级语言进行数据导入导出的开发），这里的stdin即为标准输入，如果执行"\copy 表名 from stdin",则会让你继续输入数据，然后客户端会把数据保存到对应的表中。

### 3.gsql/psql （-c参数）
gsql/psql 的 "-c"参数，可以在连接数据库后马上执行sql命令然后断开登录

### 4.linux ( | 管道符)
linux的管道符"|"，可以用于输入的重定向，即把前面一条命令的输出，作为后面一条命令的输入

## 三、方案说明
通过以上内容，很自然的可以联想到一种方式，即使用sqluldr2的标准输出，直接作为gsql \copy的标准输入。所谓的两点之间直线最短，用最快的导出加上最快的导入，且省去中间存储文件的阶段，理想状态下，这个速度仅受限于源端或目标端最慢的那一端，比如导出7分钟，导入8分钟，一般总计传输时间就是15分钟，但是用本文的方案，这个传输时间可能就只有8分钟了，因为它是导入导出同时进行的！

## 四、操作步骤
1. 需要有个服务器能同时连接oracle及MogDB(openGauss)，当然直接用这两个服务器之一也可以，只是注意要安装另一个数据的客户端,本文测试是在mogdb数据库的服务器上执行的
- oracle客户端下载链接
https://www.oracle.com/cn/database/technologies/instant-client/linux-x86-64-downloads.html
- MogDB(openGauss)没有提供单独的客户端压缩包，客户端在数据库的安装包中对应的tools压缩包，比如
MogDB-3.0.1-CentOS-64bit-tools.tar.gz
https://mogdb.io/downloads/mogdb/

2. 安装客户端，这两个客户端的安装方式差不多，就是解压，然后配置环境变量LD_LIBRARY_PATH,比如配置连接Oracle的环境变量如下(如果需要永久配置则要修改对应的配置文件)
```bash
export LD_LIBRARY_PATH=/opt/mogdb/instantclient_21_7:$LD_LIBRARY_PATH
```
3. 下载sqluldr2程序
这个就自己在网上搜吧，基本下载下来是一个压缩包，里面有两个windows版的和两个linux版的，我们需要的是"sqluldr2_linux64_10204.bin"这个文件，下完后可以把文件名改短点，比如"sqluldr2"

4. 先找个小表测试下sqluldr2能否导出文件,文件正常生成，说明oracle客户端配置正确
```bash
./sqluldr2 scott/tiger@192.168.163.108/orcl query=emp quote=0x22 field="," degree=8 file=123.csv
```
```
[omm@MiWiFi-R3G-srv mogdb]$ cat 123.csv
7369,"SMITH","CLERK",7902,"1980-12-17 00:00:00",800,,20
7499,"ALLEN","SALESMAN",7698,"1981-02-20 00:00:00",1600,300,30
7521,"WARD","SALESMAN",7698,"1981-02-22 00:00:00",1250,500,30
7566,"JONES","MANAGER",7839,"1981-04-02 00:00:00",2975,,20
7654,"MARTIN","SALESMAN",7698,"1981-09-28 00:00:00",1250,1400,30
7698,"BLAKE","MANAGER",7839,"1981-05-01 00:00:00",2850,,30
7782,"CLARK","MANAGER",7839,"1981-06-09 00:00:00",2450,,10
7788,"SCOTT","ANALYST",7566,"1987-04-19 00:00:00",3000,,20
7839,"KING","PRESIDENT",,"1981-11-17 00:00:00",5000,,10
7844,"TURNER","SALESMAN",7698,"1981-09-08 00:00:00",1500,0,30
7876,"ADAMS","CLERK",7788,"1987-05-23 00:00:00",1100,,20
7900,"JAMES","CLERK",7698,"1981-12-03 00:00:00",950,,30
7902,"FORD","ANALYST",7566,"1981-12-03 00:00:00",3000,,20
7934,"MILLER","CLERK",7782,"1982-01-23 00:00:00",1300,,10
```

5. 在目标端建立一个同样的表
```bash
gsql -d postgres -r -p 26000
```
```sql
create schema scott;
create table SCOTT.EMP
(
  empno    NUMBER(4) not null,
  ename    VARCHAR2(10),
  job      VARCHAR2(9),
  mgr      NUMBER(4),
  hiredate DATE,
  sal      NUMBER(7,2),
  comm     NUMBER(7,2),
  deptno   NUMBER(2)
);
```

6. ★测试通过管道传输数据，没有报错
```bash
./sqluldr2 scott/tiger@192.168.163.108/orcl query=emp quote=0x22 field="," degree=8 file=- |gsql -d postgres -Umogdb -WEnmo@123 -hlocalhost -p26000 -c "\copy scott.emp from stdin DELIMITER ',' quote '\"' csv"
```

7. 在目标端查询scott.emp表，数据和源端一致

```
MogDB=# select * from scott.emp;
 empno | ename  |    job    | mgr  |      hiredate       |   sal   |  comm   | deptno 
-------+--------+-----------+------+---------------------+---------+---------+--------
  7369 | SMITH  | CLERK     | 7902 | 1980-12-17 00:00:00 |  800.00 |         |     20
  7499 | ALLEN  | SALESMAN  | 7698 | 1981-02-20 00:00:00 | 1600.00 |  300.00 |     30
  7521 | WARD   | SALESMAN  | 7698 | 1981-02-22 00:00:00 | 1250.00 |  500.00 |     30
  7566 | JONES  | MANAGER   | 7839 | 1981-04-02 00:00:00 | 2975.00 |         |     20
  7654 | MARTIN | SALESMAN  | 7698 | 1981-09-28 00:00:00 | 1250.00 | 1400.00 |     30
  7698 | BLAKE  | MANAGER   | 7839 | 1981-05-01 00:00:00 | 2850.00 |         |     30
  7782 | CLARK  | MANAGER   | 7839 | 1981-06-09 00:00:00 | 2450.00 |         |     10
  7788 | SCOTT  | ANALYST   | 7566 | 1987-04-19 00:00:00 | 3000.00 |         |     20
  7839 | KING   | PRESIDENT |      | 1981-11-17 00:00:00 | 5000.00 |         |     10
  7844 | TURNER | SALESMAN  | 7698 | 1981-09-08 00:00:00 | 1500.00 |    0.00 |     30
  7876 | ADAMS  | CLERK     | 7788 | 1987-05-23 00:00:00 | 1100.00 |         |     20
  7900 | JAMES  | CLERK     | 7698 | 1981-12-03 00:00:00 |  950.00 |         |     30
  7902 | FORD   | ANALYST   | 7566 | 1981-12-03 00:00:00 | 3000.00 |         |     20
  7934 | MILLER | CLERK     | 7782 | 1982-01-23 00:00:00 | 1300.00 |         |     10
(14 rows)
```

## 五、简单性能测试
由于硬盘空间不够，测试数据库也是虚拟机和docker中的，就不做详细的测试了，只做个简单的100万数据测试
```sql
SQL> select count(1) from  scott.T_TEST1;

  COUNT(1)
----------
   1000000
```
直接管道传输，用时7s
```bash
[omm@MiWiFi-R3G-srv mogdb]$ echo $(date)
Thu Sep 15 04:24:23 EDT 2022
[omm@MiWiFi-R3G-srv mogdb]$ ./sqluldr2 scott/tiger@192.168.163.108/orcl query=SCOTT.T_TEST1 quote=0x22 field="," degree=8 file=- |gsql -d postgres -Umogdb -WEnmo@123 -hlocalhost -p26000 -c "\copy SCOTT.T_TEST1 from stdin DELIMITER ',' quote '\"' csv"
[omm@MiWiFi-R3G-srv mogdb]$ echo $(date)
Thu Sep 15 04:24:30 EDT 2022
```
在目标端删除测试表，重建，然后用导出文件再导入的方式,导出5s,导入7s，一共12s
```bash
[omm@MiWiFi-R3G-srv mogdb]$ echo $(date)
Thu Sep 15 04:20:00 EDT 2022
[omm@MiWiFi-R3G-srv mogdb]$ ./sqluldr2 scott/tiger@192.168.163.108/orcl query=SCOTT.T_TEST1 quote=0x22 field="," degree=8 file=1234.csv
           0 rows exported at 2022-09-15 04:20:00, size 0 MB.
     1000000 rows exported at 2022-09-15 04:20:05, size 48 MB.
         output file 1234.csv closed at 1000000 rows, size 48 MB.
[omm@MiWiFi-R3G-srv mogdb]$ echo $(date)
Thu Sep 15 04:20:05 EDT 2022
```
```bash
[omm@MiWiFi-R3G-srv mogdb]$ echo $(date)
Thu Sep 15 04:23:03 EDT 2022
[omm@MiWiFi-R3G-srv mogdb]$ gsql -d postgres -Umogdb -WEnmo@123 -hlocalhost -p26000 -c "\copy SCOTT.T_TEST1 from '/opt/mogdb/1234.csv' DELIMITER ',' quote '\"' csv"
[omm@MiWiFi-R3G-srv mogdb]$ echo $(date)
Thu Sep 15 04:23:10 EDT 2022
```
大致判断，这次测试的速度上限受导入影响，如果再优化一下数据库相关参数，耗时可以更低，但这里主要是提供一个可行的快速传输数据的思路，就不去做参数调整了。

## 六、总结
了解了这个原理，完全可以写一个程序或者shell脚本，通过把配置进行参数化处理，来制作一个Oracle到openGauss的通用高速数据传输工具。
> -   **本文作者：** [DarkAthena](https://www.darkathena.top)
> -   **本文链接：** [https://www.darkathena.top/archives/transport-data-from-oracle-to-opengauss-faster](https://www.darkathena.top/archives/transport-data-from-oracle-to-opengauss-faster)
> -   **版权声明：** 本博客所有文章除特别声明外，均采用[CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) 许可协议。转载请注明出处！