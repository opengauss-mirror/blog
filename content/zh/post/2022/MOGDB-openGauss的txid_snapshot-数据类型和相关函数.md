+++

title =  "MOGDB/openGauss的txid\_snapshot 数据类型和相关函数" 

date = "2021-12-20" 

tags = [ "MOGDB/openGauss的txid\_snapshot 数据类型和相关函数"] 

archives = "2021-12" 

author = "阎书利" 

summary = "MOGDB/openGauss的txid\_snapshot 数据类型和相关函数"

img = "/zh/post/2022/title/img5.png" 

times = "12:30"

+++

# MOGDB/openGauss的txid\_snapshot 数据类型和相关函数<a name="ZH-CN_TOPIC_0000001232693241"></a>

txid\_snapshot的文本表示为：xmin:xmax:xip\_list。

```
    名称      	描述                                      
    xmin    	最早的事务ID（txid）仍然活动。所有较早事务将是已经提交可见的，或者是直接回滚。
    xmax    	作为尚未分配的txid。所有大于或等于此txids的都是尚未开始的快照时间，因此不可见。
    xip_list	当前快照中活动的txids。这个列表只包含在xmin和xmax之间活动的txids；有可能活动的txids高于xmax。 介于大于等于xmin、小于xmax，并且不在这个列表中的txid，在这个时间快照已经完成的，因此按照提交状态查看他是可见还是回滚。这个列表不包含子事务的txids。
```

示例：10:20:10,13,15意思为：xmin=10, xmax=20, xip\_list=10, 13, 15。

测试如下：

## 1.通过设置强制对临时对象使用COMMIT而不是2PC<a name="section835218144017"></a>

```
SET enforce_two_phase_commit TO off; 
```

## 2.正常案例演示<a name="section14409816184012"></a>

```
 postgres=# select '12:13:'::txid_snapshot;
    ##  txid_snapshot
     12:13:
    (1 row)

    postgres=# select '12:18:14,16'::txid_snapshot;
    ##  txid_snapshot
     12:18:14,16
    (1 row)
```

## 3.错误案例演示<a name="section1231172884020"></a>

```
 postgres=# select '31:12:'::txid_snapshot;
    ERROR:  invalid input for txid_snapshot: "31:12:"
    LINE 1: select '31:12:'::txid_snapshot;
                   ^
    CONTEXT:  referenced column: txid_snapshot
-------------------------------------------------------------------------------
 postgres=# select '0:1:'::txid_snapshot;
    ERROR:  invalid input for txid_snapshot: "0:1:"
    LINE 1: select '0:1:'::txid_snapshot;
                   ^
    CONTEXT:  referenced column: txid_snapshot
-------------------------------------------------------------------------------
postgres=# select '12:13:0'::txid_snapshot;
   ERROR:  invalid input for txid_snapshot: "12:13:0"
   LINE 1: select '12:13:0'::txid_snapshot;
                  ^
   CONTEXT:  referenced column: txid_snapshot
-------------------------------------------------------------------------------
 postgres=# select '12:16:14,13'::txid_snapshot;
    ERROR:  invalid input for txid_snapshot: "12:16:14,13"
    LINE 1: select '12:16:14,13'::txid_snapshot;
                   ^
    CONTEXT:  referenced column: txid_snapshot
-------------------------------------------------------------------------------
postgres=# select '12:16:14,14'::txid_snapshot;
    ERROR:  invalid input for txid_snapshot: "12:16:14,14"
    LINE 1: select '12:16:14,14'::txid_snapshot;
                   ^
    CONTEXT:  referenced column: txid_snapshot
```

通过测试看出xmax应该大于xmin，不可为0，tixds应该按增序排列，且不为0，并且不能有重复的tixds，在使用的时候应当尽量避免。

## 4.创建测试表及测试数据导入<a name="section811543154019"></a>

```
postgres=# insert into snapshot_test values (4, '100:150:101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131');
postgres=# create temp table snapshot_test(nr integer,snap txid_snapshot);
    CREATE TABLE
    postgres=# insert into snapshot_test values (1, '12:13:');
    INSERT 0 1
    postgres=# insert into snapshot_test values (2, '12:20:13,15,18');
    INSERT 0 1
    postgres=# insert into snapshot_test values (3, '100001:100009:100005,100007,100008');
    INSERT 0 1
    postgres=# insert into snapshot_test values (4, '100:150:101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131');
    INSERT 0 1
```

查询数据情况：

```
postgres=# select snap from snapshot_test order by nr;
                                                                    snap
    -------------------------------------------------------------------------------------------------------
    ------------------------------
     12:13:
     12:20:13,15,18
     100001:100009:100005,100007,100008
     100:150:101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,12
    4,125,126,127,128,129,130,131
    (4 rows)
```

## 5.函数测试<a name="section1997755711412"></a>

txid\_snapshot\_xmin\(\)为会返回快照的xmin，

txid\_snapshot\_xmax\(\)会返回快照的xmax，

txid\_snapshot\_xip\(\)获取正在进行的事务ip，即txids。

```
postgres=# select  txid_snapshot_xmin(snap),
    postgres-# txid_snapshot_xmax(snap),
    postgres-# txid_snapshot_xip(snap)
    postgres-# from snapshot_test order by nr, 1, 2, 3;
     txid_snapshot_xmin | txid_snapshot_xmax | txid_snapshot_xip
    --------------------+--------------------+-------------------
                     12 |                 20 |                13
                     12 |                 20 |                15
                     12 |                 20 |                18
                 100001 |             100009 |            100005
                 100001 |             100009 |            100007
                 100001 |             100009 |            100008
                    100 |                150 |               101
                    100 |                150 |               102
                    100 |                150 |               103
                    100 |                150 |               104
                    100 |                150 |               105
```

txid\_visible\_in\_snapshot\(\)会查看在快照中事务ID是否可见\(不使用子事务ID\)

```
postgres=# select id, txid_visible_in_snapshot(id, snap)
    postgres-# from snapshot_test, generate_series(11, 21) id
    postgres-# where nr = 2;
     id | txid_visible_in_snapshot
    ----+--------------------------
     11 | t
     12 | t
     13 | f
     14 | t
     15 | f
     16 | t
     17 | t
     18 | f
     19 | t
     20 | f
     21 | f
    (11 rows)
```

## 6.其他测试<a name="section167942387421"></a>

-   测试二分查找

    ```
        postgres=# select id, txid_visible_in_snapshot(id, snap)
        postgres-# from snapshot_test, generate_series(90, 160) id
        postgres-# where nr = 4;
         id  | txid_visible_in_snapshot
        -----+--------------------------
          90 | t
          91 | t
          92 | t
          93 | t
          94 | t
          95 | t
          96 | t
          97 | t
          98 | t
          99 | t
         100 | t
         101 | f
    ```


-   测试当前值

    ```
        postgres=# select txid_current() >= txid_snapshot_xmin(txid_current_snapshot());
        ##  ?column?
         t
        (1 row)
    ```

    我们不能假设当前值总是小于xmax

    ```
        postgres=# select txid_visible_in_snapshot(txid_current(), txid_current_snapshot());
        ##  txid_visible_in_snapshot
         f
        (1 row)
    ```

    测试64bitness（MOGDB/openGauss将transactionid由int32改为了int64,64位的xid永远不可能耗尽，虽然xid改为了64位,但是过期的xid依旧需要freeze清理，只是永远不用担心会发生xid回卷宕机的风险。 ）

    ```
        postgres=# select txid_snapshot '1000100010001000:1000100010001100:1000100010001012,1000100010001013';
    
        ##   txid_snapshot
         1000100010001000:1000100010001100:1000100010001012,1000100010001013
        (1 row)
    
        postgres=# select txid_visible_in_snapshot('1000100010001012', '1000100010001000:1000100010001100:1000100010001012,1000100010001013');
    
        ##  txid_visible_in_snapshot
    
         f
        (1 row)
    
    
    
        postgres=# select txid_visible_in_snapshot('1000100010001015', '1000100010001000:1000100010001100:1000100010001012,1000100010001013');
    
        ##  txid_visible_in_snapshot
    
         t
        (1 row)
    ```

    测试溢出64bit，9223372036854775807是是263-1，是乘方 也就是63位的最大二进制数字 。

    ```
        postgres=# SELECT txid_snapshot '1:9223372036854775807:3';
        ##       txid_snapshot
         1:9223372036854775807:3
        (1 row)
    
        postgres=# SELECT txid_snapshot '1:9223372036854775808:3';
        ERROR:  invalid input for txid_snapshot: "1:9223372036854775808:3"
        LINE 1: SELECT txid_snapshot '1:9223372036854775808:3';
                                     ^
        CONTEXT:  referenced column: txid_snapshot
    ```


