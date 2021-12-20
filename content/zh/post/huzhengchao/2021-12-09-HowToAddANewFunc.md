+++
title = "openGauss系统函数添加指导"
date = "2021-12-09"
tags = ["openGauss系统函数添加指导"]
archives = "021-12-09"
author = "gentle_hu"
summary = "openGauss系统函数添加指导"
img = "/zh/post/huzhengchao/title/img1.png"
times = "9:30"
+++

[TOC]

# openGauss系统函数添加指导

## 1、函数架构简介

openGauss内函数的可以分为两个部分：

- ​	身份注册声明：openGauss中存在一个系统表 pg_proc，这个表存放了所有函数的基本元信息，相当于函数的“户口本”，只有在其中可以查到的函数，才可以在SQL语句中进行调用，才有“数据库函数”的身份。常见的注册方式有：builtin、升级脚本、CREATE FUNCTION语句、EXTENSION。
- ​	底层功能实现：实现其功能的具体逻辑代码，可以根据其所用的语言分为四类：INTERNAL, SQL, PLPGSQL、C。



四中常见的函数注册创建方式，分别对应着着不同的场景：

- **builtin**：源代码中存在一个名为builtin_funcs.ini的文件，存放着一系列内置函数的元信息，在初始化安装数据库时，会通过某些方式，全量扫描此文件，将里面罗列的函数批量注册到pg_proc系统表。
- **升级脚本**：数据库由老版本升级到新版本的场景下，不会也不能遍历重刷builtin_funcs.ini到pg_proc，因此若新版本有新增函数，就需要编写一个升级脚本，在升级过程中通过升级脚本将新增函数注册到pg_proc之中。
- **CREATE FUNCTION**： 通过`CREATE FUNCTION ... BEGIN ... END`语句，一把完成注册和实现。
- **EXTENSION**：随着extension进行注册和加载。



四类语言实现方案分别有不同的注册声明方式以及实现特征：

-  **INTERNAL**:  通过builtin或升级脚本进行注册，底层功能通过C语言实现的函数，也是数据库最常见的内置函数，如pg_sleep()。其底层功能函数函数名可以再pg_proc的prosrc列查到。
-  **SQL**: 通过builtin或者升级脚本进行注册，底层功能通过一句SQL实现的函数，也是数据库内置函数的一种。如to_char() ，在数据库底层会转换为一句`select CAST(... AS VARCHAR2);`，这一句在pg_proc的prosrc列可以查到，通常是为了复用已有功能模块来适配新接口而采用这种实现方案。
- **PLPGSQL**: 这个就是我们所熟知的，使用plpgsql进行编写创建的函数了，通过语句一次完成声明与实现。pg_proc的prosrc列存放了这个语句的源代码。
- **C**: 出现在各种extension之中，内部功能使用C语言实现。这个和INTERNAL比较类似，区别在于其具体注册方式为通过extension进行注册，并且底层代码是在外部lib之中，而INTERNAL是在gaussdb二进制内的。可以在pg_proc的prosrc、probin列查到其lib路径以及函数符号信息。

其中INTERNAL、SQL类的函数，因为都可以通过builtin的方式整，因此也都常被统称为builtin函数。



一个普通函数调用流程大致为：

1、解析SQL语句，获取到函数名以及参数值与类型等信息。

2、根据以上信息，在pg_proc中检索到这个函数的元数据，元数据中包含默认值、实现语言、底层函数、估算代价等所有信息。

3、根据其实现语言，调用其具体底层接口模块。如：INTERNAL类型会直接调用其元数据中的底层C语言代码函数；C类型会根据元数据信息加载相关lib后调用lib中的C语言代码函数；SQL类型会直接转而执行元数据prosrc中存放的sql语句；PLPGSQL类型会转而走过程语言模块解释执行prosrc中存放的源代码。



另外还有一种稍微特殊的函数——聚集函数，它其实是在普通函数的架构基础上做的功能变更与扩展，其架构和添加流程与普通函数有些差异。我们分两章介绍如何添加普通的INTERNAL函数和聚集函数。



## 2、如何添加一个普通的INTERNAL函数

了解了上面的架构与流程后，不难得出，添加一个普通的INTERNAL函数，可分为四个步骤：

​	1、**声明函数身份**。将我们已经提前设计好的函数的各种属性，如参数数量类型、返回值类型、稳定性等等，按照特定的格式添加进buitin_funcs.ini文件之中。

​	2、**实现功能代码**。在内核代码合适位置，实现一个C语言的函数，来实现对应的功能。

​	3、**关联声明实现**。将上一个步骤编写函数的函数名，添加到builtin_funcs.ini对应条目的对应位置。

​	4、**编写升级脚本**。用于在升级流程之中注册SQL函数身份。



### 2.1 声明函数身份

在这之前我们需要已经提前设计好自己的函数属性以及功能，如参数数量类型、返回值类型、稳定性等等，将这些信息按照特定的格式和顺序填写到`./src/common/backend/catalog/builtin_funcs.ini` 文件之中。

这个文件中需要按照如下结构进行书写：

    AddFuncGroup(
        "pg_sleep", 1,
        AddBuiltinFunc(_0(2626), _1("pg_sleep"), _2(1), _3(true), _4(false), _5(pg_sleep), _6(2278), _7(PG_CATALOG_NAMESPACE), _8(BOOTSTRAP_SUPERUSERID), _9(INTERNALlanguageId), _10(1), _11(0), _12(0), _13(0), _14(false), _15(false), _16(false), _17(false), _18('v'), _19(0), _20(1, 701), _21(NULL), _22(NULL), _23(NULL), _24(NULL), _25("pg_sleep"), _26(NULL), _27(NULL), _28(NULL), _29(0), _30(false), _31(NULL), _32(false), _33(NULL), _34('f'), _35(NULL),  _36(0), _37(false))
    ),
可以看到其有内外两层组成。

外层为`AddFuncGroup("pg_sleep", 1, AddBuiltinFunc(...))`，其第一个成员变量为函数名，第二个成员变量为重载数量，后面的AddBuiltinFunc结构为函数元信息。这个结构会匹配内核代码中的结构体`struct FuncGroup`。**需要十分注意的是，这个结构需要按照第一个成员也就是函数名的ASCII大小升序，添加到对应的位置**。

内层`AddBuiltinFunc`为函数元信息，其目前一共含有38个属性，与内核代码结构体`struct Builtin_func`和系统表pg_proc都有对应关系。我们根据如下表每个属性含义，完善AddBuiltinFunc结构(可暂不关注属性5与25)。

| 编号 | 含义                                                         | 对应Builtin_func            |
| :--- | ------------------------------------------------------------ | --------------------------- |
| 0    | oid，函数的唯一标识id，需要小于10000且不可以和已有函数重复。 | Oid foid;                   |
| 1    | 函数名                                                       | const char* funcName        |
| 2    | 参数数量                                                     | int2 nargs                  |
| 3    | 是否STRICT ( NULL IN NULL OUT，即若入参有NULL，则不执行，直接返回一个NULL) | bool strict                 |
| 4    | 是否返回一个集合，就是返回多行的意思。                       | bool retset                 |
| 5    | 底层C语言功能代码函数名。                                    | PGFunction func             |
| 6    | 返回值类型oid                                                | Oid rettype                 |
| 7    | 所属schema                                                   | Oid pronamespace            |
| 8    | owner                                                        | Oid proowner                |
| 9    | 内部实现语言，填 INTERNALlanguageId或SQLlanguageId           | Oid prolang                 |
| 10   | 如果返回一个集合的话，估算的每行执行代价，否则是0；          | float4 procost              |
| 11   | 如果返回一个集合的话，估算的返回行数，否则是0；              | float4 prorows              |
| 12   | 存在变长参数，这里是变长参数oid                              | Oid provariadic             |
| 13   | 此函数的简化调用方式。                                       | regproc protransform        |
| 14   | 是否是一个聚集参数。                                         | bool proisagg               |
| 15   | 是否是一个窗口函数。                                         | bool proiswindow            |
| 16   | 是否是一个安全定义器（也就是一个“setuid”函数）               | bool prosecdef              |
| 17   | 函数没副作用。如果函数没有对参数进行防泄露处理，则会抛出错误 | bool proleakproof           |
| 18   | 函数稳定性。描述该函数的结果是否只依赖于它的输入参数。<br />i：最稳（immutable），对于相同的输入总是产生相同的结果。<br />s：较稳（stable），对于相同的输入其结果在一次扫描里不变。<br />v：不稳（volatile），其结果可能在任何时候变化，也用于那些有副作用的函数。 | char provolatile            |
| 19   | 默认参数数量                                                 | int2 pronargdefaults        |
| 20   | 入参数量以及类型，仅包含IN、INOUT、VARIADIC参数。<br />格式如：_20(count, typeoid1, typeoid2, typeoid3...) | ArrayOid proargtypes        |
| 21   | 所有参数的数量以及类型。<br />格式如：_21(count, typeoid1, typeoid2, ...) | ArrayOid* proallargtypes    |
| 22   | 所有参数的数量以及模式，要和21对应。模式含义i-IN,  o-OUT,  b-INOUT,  v-VARIADIC<br />格式如：_22(count, 'i', 'o', 'v',...)。<br />注意，若所有参数都是i，这个域为空。 | ArrayChar* proargmodes      |
| 23   | 所有参数的数量以及名字，要和21对应。若没有参数有名字，则这个域为空。<br />格式如：_23(count,  name1, name2, name3....) | ArrayCStr* proargnames      |
| 24   | 若含有默认参数，则这里是默认值的表达式树（按照`nodeToString()`的表现方式），不含则为空 | const char* proargdefaults  |
| 25   | 对于INTERNAL这里是底层函数名，对于SQL这里是一句sql，对于PLPGSQL这里是其源码。 | const char* prosrc;         |
| 26   | 关于如何调用函数的附加信息。                                 | const char* probin;         |
| 27   | 函数针对运行时配置变量的本地设置                             | ArrayCStr* proconfig;       |
| 28   | 访问权限                                                     | ArrayAcl* proacl            |
| 29   | 函数具有默认值的入参的位置。                                 | ArrayInt2* prodefaultargpos |
| 30   | 函数的执行模式，表示函数是在fence还是not fence模式下执行，如果是fence执行模式，函数的执行会在重新fork的进程中执行。分布式属性，单机不涉及，false即可。 | bool* fencedmode            |
| 31   | 表示该函数是否可以下推到DN上执行。分布式属性，单机不涉及，false即可。 | bool* proshippable          |
| 32   | 是否支持重载。                                               | bool* propackage            |
| 33   | 函数描述注释。                                               | const char* descr           |
| 34   | 函数类型。builtin_funcs中都是f类型。                         | char prokind                |
| 35   | function\procdure的入参字符串。                              | const char* proargsrc       |
| 36   | 如果属于某个package的话，这里填package的oid，不属于的话填0.  | Oid propackageid            |
| 37   | 是否是一个私有函数。                                         | bool proisprivate           |
|      |                                                              |                             |

> 诀窍：builtin_funcs.ini内已经有三千多个函数，总有那么一些与自己要加的比较像，可以找出来对照着进行填写添加。



**函数重载**

一个函数可以有多个重载，以generate_series为例，外层的第二个参数填写重载数量，后面对每一种重载都正常写一个AddBuiltinFunc，其中我们可以看到属性5都是不一样的，每一个重载版本，都对应不同的底层实现函数。入参肯定也是不一样的。

    AddFuncGroup(
        "generate_series", 8,
        AddBuiltinFunc(_0(938), _1("generate_series"), ..., _5(generate_series_timestamp), ..., _20(3, 1114, 1114, 1186), ..., _25("generate_series_timestamp"), ...),
        AddBuiltinFunc(_0( 939), _1("generate_series"),..., _5(generate_series_timestamptz),  ..._20(3, 1184, 1184, 1186), ..., _25("generate_series_timestamptz"), ...),
        AddBuiltinFunc(_0(1066), _1("generate_series"),...,_5(generate_series_step_int4),..., _20(3, 23, 23, 23), ..., _25("generate_series_step_int4"),...),
        ...
    ),




**变长参数**

含有变长参数的函数，我们需要注意属性2、12、20、21、22。

2为入参数量，变长参数算一个；12为变长参数oid；20、21、22照常填写，注意22中变长参数模式为'v'

可通过 \df 元命令快速查看，参数前面有 VARIADIC表示变长。例如concat_ws

```
openGauss=# \df concat_ws
                                               List of functions
   Schema   |   Name    | Result data type | Argument data types  |  Type  | fencedmode | propackage | prokind
------------+-----------+------------------+----------------------+--------+------------+------------+---------
 pg_catalog | concat_ws | text             | text, VARIADIC "any" | normal | f          | f          | f
(1 row)
```



**默认值参数**

含有默认值的参数，我们需要注意2、19、24、29

2为入参数量，有默认值的参数算一个

19为默认参数的数量。

24为默认参数的值，里面存放放内核中的nodeToString打出来的字符串表达式。

29为默认参数的位置，填写格式与20、21等差不多，_29(num, pos)，其中pos表示参数下标。

可通过\df元命令快速查看，变量后有个DEFAULT，如

```
openGauss=# \df pg_start_backup
                                                             List of functions
   Schema   |      Name       | Result data type |             Argument data types             |  Type  | fencedmode | propackage | prokind
------------+-----------------+------------------+---------------------------------------------+--------+------------+------------+---------
 pg_catalog | pg_start_backup | text             | label text, fast boolean DEFAULT false      | normal | f          | f          | f
 pg_catalog | pg_start_backup | text             | label text, fast boolean, exclusive boolean | normal | f          | f          | f
(2 rows)
```



### 2.2 实现功能代码

在内核代码合适的.cpp文件中，使用一些约定的接口，实现一个函数来完成相关功能。以pg_terminate_session为例

    Datum pg_terminate_session(PG_FUNCTION_ARGS)
    {
        ThreadId tid = PG_GETARG_INT64(0);
        uint64 sid = PG_GETARG_INT64(1);
        int r = -1;
    
        if (tid == sid) {
            r = kill_backend(tid);
        } else if (ENABLE_THREAD_POOL) {
            ThreadPoolSessControl *sess_ctrl = g_threadPoolControler->GetSessionCtrl();
            int ctrl_idx = sess_ctrl->FindCtrlIdxBySessId(sid);
            r = sess_ctrl->SendSignal((int)ctrl_idx, SIGTERM);
        }
    
        PG_RETURN_BOOL(r == 0);
    }
函数返回类型都需要为Datum。

入参必须为FunctionCallInfo fcinfo，但为了简化书写以及保持接口形式统一，我们将其define成了一个宏PG_FUNCTION_ARGS。

获取实际参数则需要使用专门的宏接口来获取，例如 PG_GETARG_INT64(0) ，这一套接口一般都以PG_GETARG_为前缀，之后为数据类型，宏参数为函数参数下标。例如假如函数第三个参数为bool，则需要使用 PG_GETARG_BOOL(2)来获取。

return语句也有封装好的接口，一般都以PG_RETURN_为前缀，后面紧跟类型，宏参数为实际值。



上面是一个返回一行单列的函数，有时候我们还有返回多行多列的函数，以gs_threadpool_status为例，以下是部分简化代码：

    Datum gs_threadpool_status(PG_FUNCTION_ARGS)
    {
        FuncCallContext* funcctx = NULL;   // 函数调用上下文
        ThreadPoolStat* entry = NULL;      // 用于保存单行的值
        ...
        
        // 第一次调用需要提前初始化函数调用上下文的相关信息。
    	if (SRF_IS_FIRSTCALL()) {
    		// 在fcinfo中创建函数调用上下文
        	funcctx = SRF_FIRSTCALL_INIT();
    
        	// 初始化列描述信息，并保存到函数调用上下文。
        	TupleDesc tupdesc = CreateTemplateTupleDesc(NUM_THREADPOOL_STATUS_ELEM, false, TAM_HEAP);
        	TupleDescInitEntry(tupdesc, (AttrNumber)1, "nodename", TEXTOID, -1, 0);
        	TupleDescInitEntry(tupdesc, (AttrNumber)2, "groupid", INT4OID, -1, 0);
        	....
        	funcctx->tuple_desc = BlessTupleDesc(tupdesc);
    
        	/* 计算总行数，并获取所有源数据 */
            funcctx->user_fctx = (void*)g_threadPoolControler->GetThreadPoolStat(&(funcctx->max_calls));
    	}
    	
    	// 在fcinfo中找到函数调用上下文。
    	funcctx = SRF_PERCALL_SETUP();
    
    	// 调用计数 < 总行数
    	if (funcctx->call_cntr < funcctx->max_calls) {
        	Datum values[NUM_THREADPOOL_STATUS_ELEM];
        	bool nulls[NUM_THREADPOOL_STATUS_ELEM] = {false};
    		
    		// 在上下文中找到当前行的源数据
    		entry = (((ThreadPoolStat*)funcctx->user_fctx) + funcctx->call_cntr);
    		
    		// 将当前行源数据填充到values、nulls数组中，并form成一个tuple。
        	values[0] = CStringGetTextDatum(g_instance.attr.attr_common.PGXCNodeName);
        	nulls[0] = false;
        	values[1] = Int32GetDatum(entry->groupId);
        	...
        	HeapTuple tuple = heap_form_tuple(funcctx->tuple_desc, values, nulls);
        	
        	// 返回当前行，并标注还会有下一行，同时将调用计数加一。后续还会继续调用此函数获取数据。
        	SRF_RETURN_NEXT(funcctx, HeapTupleGetDatum(tuple));
    	} else {
        	// 返回空，并标注当前已经返回所有行了。后续不会再调用此函数获取数据了
        	SRF_RETURN_DONE(funcctx);
    	}
    }
> 诀窍：INTERNAL函数已经有三千多个，总有那么一些与自己要加的比较像，可以找出来对照着进行编写，如变长参数的获取等。
>
> 这里的底层功能实现函数与我们要加的数据库函数名称是可以不一样的，例如重载的时候，一个数据库函数，对应好几个内部实现函数，每个都是不一样的。但一般为了便于开发与调试，能命名一样就尽量一样。



### **2.3 关联声明实现**

我们需要找一个builtin_funcs.ini能访问到的合适的 .h 头文件，将我们写的c功能函数声明进去。

在builtin_funcs.ini 的属性5和25中, 将我们第二步实现的功能函数名写进去。



### 2.4 编写升级脚本

1：占用小版本号

打开 ./src/common/backend/utils/init/globals.cpp，找到如下代码：

```
/* hard-wired binary version number */
const uint32 GRAND_VERSION_NUM = 92423;
```

这个值就是小版本号，每次提交之中若有涉及到需要版本升级差异的动作，都需要占用一个版本号。

如我们现在需要使用升级脚本来完成注册函数，需要将这个值修改加一到92424，而这个92424就是我们占用的版本号。



2：编写upgrade脚本

进入src/include/catalog/upgrade_sql/upgrade_catalog_maindb文件夹。

可以发现里面有类似upgrade_catalog_maindb_92_000.sql与upgrade-post_catalog_maindb_92_000.sql两种文件，主要区别在一个带`-post`，一个不带。区别在于在升级流程中，我们必然会将旧的gaussdb二进制文件更新为新的，而带post的在新的上执行，不带的在旧的上执行。

我们新增了INTERNAL函数，其底层实现函数肯定在新版二进制上，因此我们用我们占用的版本号创建一个文件：upgrade-post_catalog_maindb_92_424.sql

对于每个新增的函数(以new_function_name为例)，都按照如下三句的形式，添加到新建的文件中。

```
-- 首先需要先DROP一下，防止例如我们第一次升级意外失败，残留数据没回滚干净又升了第二次等函数早就存在了的情况
DROP FUNCTION IF EXISTS pg_catalog.new_function_name(text, text) CASCADE;

-- 设置下一个创建对象的OID，此处0000要替换成我们这个函数的oid。
SET LOCAL inplace_upgrade_next_system_object_oids=IUO_PROC, 0000;

-- 创建函数。
-- 类似通过PLPGSQL创建函数语法，但区别在于AS后并不是类似 "$$...begin...end $$"的函数体，而直接直接指定了其底层功能实现函数的函数名，同时LANGUAGE也不是plpgsql, 而是设置为internal。
-- 其余的部分与plpgsql就一致了，如returns、各种属性指定方式等。
CREATE FUNCTION pg_catalog.new_function_name(text, text)
RETURNS int8
as 'cfunc_of_new_function'
LANGUAGE INTERNAL 
IMMUTABLE COST 10000 STRICT;
```

可以看到其实升级脚本的功能其实就是利用create语句在升级流程中对函数进行声明注册，添加到pg_proc的过程。



最后还需要将这个文件复制到src/include/catalog/upgrade_sql/upgrade_catalog_otherdb文件夹下，并重命名为upgrade-post_catalog_otherdb_92_424.sql



3：编写rollback脚本

rollback脚本是用来在升级前进行环境清理、预升级完成后但又不想升了，进行回滚操作用到的脚本。

进入src/include/catalog/upgrade_sql/rollback_catalog_maindb文件夹，与upgrade类似，我们也创建一个rollback-post_catalog_maindb_92_424.sql文件

对每个函数都按照如下格式进行添加

```
-- 删除。
DROP FUNCTION IF EXISTS pg_catalog.new_function_name(text, text) CASCADE;
```



同理，我们也需要将其拷贝到src/include/catalog/upgrade_sql/rollback_catalog_otherdb并重命名。



## 3、如何添加一个INTERNAL聚集函数

### 3.1 聚集函数的架构

聚集函数与普通函数不同，其执行并非直接调用底层功能代码实现，而是分成了好几个环节，每个环节各对应一个功能代码。

其可以分为三个执行环节：

- transition：收集值计算中间变量。
- collectition：这个步骤不是必须的，在分布式或者并行查询下用，用于收集多个中间变量，总合成一个中间变量
- final：将中间变量计算为结果。

其中每个环节都由一个功能函数来进行。

例如 avg(int4) 函数由int4_avg_accum、 int8_avg_collect、int8_avg来完成，其中间变量为一个长度为2的int8数组，用来记录sum与count。

其执行流程为：

- int4_avg_accum函数依次接收每一行的值，并计算sum，增加count

- int8_avg_collect函数将分布式每个节点，或者并行查询的多线程下，所有的sum、count收集起来，计算出一个总的sum和count
- int8_avg函数计算sum / count得到最终结果。

其所有信息都在系统表pg_aggregate能查到。

```
openGauss=# select * from pg_aggregate where aggfnoid=2101;
    aggfnoid    |   aggtransfn   |   aggcollectfn   | aggfinalfn | aggsortop | aggtranstype | agginitval | agginitcollect | aggkind | aggnumdirectargs
----------------+----------------+------------------+------------+-----------+--------------+------------+----------------+---------+------------------
 pg_catalog.avg | int4_avg_accum | int8_avg_collect | int8_avg   |         0 |         1016 | {0,0}      | {0,0}          | n       |   0
(1 row)
```

当然并非所有聚集函数都需要上述三步，例如median函数，无法计算中间值，因此也没有collectition函数。count()函数中间值就是结果值，因此不需要final函数。



### 3.2 如何添加

1、首先我们需要设计好聚集函数的功能，还需根据其功能按需设计三个阶段函数以及中间变量。因此我们最多一共需要设计四个函数，一聚集三普通。



2、对于三个阶段函数，按照添加正常INTERNAL普通函数一样一样的流程，将其添加成普通的INTERNAL函数。



3、编写聚集函数的builtin

 	聚集函数也需要有函数身份，因此我们需要像普通函数一样通过builtin_funcs.ini将其注册到pg_proc。但填写时需要注意如下几个值。以avg为例：

    AddFuncGroup(
        "avg", 8,
        AddBuiltinFunc(_0(2100), _1("avg"), _2(1), _3(false), _4(false), _5(aggregate_dummy), _6(1700), _7(PG_CATALOG_NAMESPACE), _8(BOOTSTRAP_SUPERUSERID), _9(INTERNALlanguageId), _10(1), _11(0), _12(0), _13(0), _14(true), _15(false), _16(false), _17(false), _18('i'), _19(0), _20(1, 20), _21(NULL), _22(NULL), _23(NULL), _24(NULL), _25("aggregate_dummy"), _26(NULL), _27(NULL), _28(NULL), _29(0), _30(false), _31(NULL), _32(false), _33(NULL), _34('f'), _35(NULL),  _36(0), _37(false)),
        ...
    )
属性5的底层功能代码函数名，但聚集函数并没有单一的底层代码，因此这里写啥都不会被执行，但为了格式形式等的统一与错误场景下调试，我们在这里用一个没啥用的假的函数 aggregate_dummy。

属性14表示是否是一个聚集函数，这里一定是true。

属性25保持统一，填假的函数的函数名。



4、添加pg_aggregate聚集函数元信息

​    我们需要在./src/include/catalog/pg_aggregate.h，按照如下格式将聚集函数与三个阶段函数关联起来，并设置中间变量。

```
DATA(insert ( 2101 int4_avg_accum int8_avg_collect int8_avg 0 1016 "{0,0}" "{0,0}" n 0));
```

其共有10列，和系统表pg_aggregate一一对应，第一列是聚集函数oid，后三列是三个阶段函数，在之后是中间变量以及其初始化值等，具体含义可以参照官网文档pg_aggregate的说明。

​    同builtin一样，这些数据也只会在初始化安装数据库时被统一导入到系统表pg_aggregate，升级时并不会重刷，因此我们还需要额外写升级脚本。



5、添加升级脚本

​	三个阶段函数按照正常普通INTERNAL的格式添加至upgrade、rollback脚本之中。聚集函数我们使用create aggregate语法和drop aggregate语法添加删除。例如：

upgrade.sql

```
-- 先创建阶段函数。json_agg的阶段函数只有两个。
DROP FUNCTION IF EXISTS pg_catalog.json_agg_finalfn(internal) CASCADE;
SET LOCAL inplace_upgrade_next_system_object_oids = IUO_PROC, 3125;
CREATE FUNCTION pg_catalog.json_agg_finalfn ...;
DROP FUNCTION IF EXISTS pg_catalog.json_agg_transfn(internal, anyelement) CASCADE;
SET LOCAL inplace_upgrade_next_system_object_oids = IUO_PROC, 3126;
CREATE FUNCTION pg_catalog.json_agg_transfn ...;

-- 同样先执行drop清理环境，之后设置oid，最后使用CREATE AGGREGATE语句注册聚集函数。
drop aggregate if exists pg_catalog.json_agg(anyelement);
SET LOCAL inplace_upgrade_next_system_object_oids=IUO_PROC, 3124;
create aggregate pg_catalog.json_agg(anyelement)
(SFUNC=json_agg_transfn, STYPE= internal, finalfunc = json_agg_finalfn);
```

rollback.sql

```
-- 先drop聚集函数，在drop阶段函数。
drop aggregate if exists pg_catalog.json_object_agg("any", "any");
DROP FUNCTION IF EXISTS pg_catalog.json_object_agg_finalfn(internal) CASCADE;
DROP FUNCTION IF EXISTS pg_catalog.json_object_agg_transfn(internal, "any", "any") CASCADE;
```



## 5、如何添加一个SQL\PLPGSQL\C函数

SQL语言的函数和INTERNAL的比较类似，但添加起来更简单。不需要便携具体的底层实现，直接将builtin_funcs.ini文件的属性5置为NULL，属性9填写SQLlanguageId，属性25填写对应的SQL查询，升级脚本函数体写成对应的SQL就好了。可以参考to_char()。

PLPGSQL语言实现的函数，就是CREATE FUNCTION ... BEGIN ... END方式，大家都会，不再赘述。

C实现的函数，主要是作为EXTENSION的一部分，参考EXTENSION的写作方式。

聚集函数也差不多按照聚集函数的规则与实现语言的规则综合来就可以了。



## 6、如何验证功能的正确

对于我们添加的builtin函数或者在system_views.sql之中使用plpgsql添加的函数等，都算是我们数据库的系统函数，出问题都算是数据可的责任，因此我们需要去进行测试。至于数据库运行期间我们通过plpgsql或者extension添加的用户自己的函数就不用了。

builtin函数分两种注册方式，builtin与升级脚本，对应的也是正常安装与版本升级两种场景，因此我们业主要针对两种场景入手测试。

### 6.1 验证功能的正确

​	（1）编译安装启动数据库，自行编写测试用例测试功能正确。

​    （2）执行fastcheck测试集，测试数据库其他功能正常。若有失败用例，需要分析是否是改坏了，若不是则可修改用力预期，例如有些用例维护了一个全量函数列表，因此新增函数的话，这个用例一定会失败，可以修改预期。

​	（3）推荐将自身编写的测试集添加到fastcheck测试集，方便功能看护。



### 6.2 验证升级正确性

​	(1)安装一个老版本数据库。

​	(2)使用自己代码编译出一个安装包。

​	(3)使用自己的安装包，将老版本数据库预升级到新版本，并验证函数功能正确，数据库正常

​	(4)回滚版本到老版本，验证回滚完全无残留，数据库正常。

​	(5)重新执行升级，并提交升级。验证功能正确，数据库正常。

 升级流程指导参照官网相关wiki与文档。

