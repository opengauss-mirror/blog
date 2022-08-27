+++
title = "SQL引擎插件开发指导"
date = "2022-08-12"
tags = ["SQL引擎插件开发指导"]
archives = "2022-08-12"
author = "ganyang"
summary = "SQL引擎插件开发指导"
img = "/zh/post/xiteming/title/img1.png"
times = "15:00"
+++


# **开发流程**

①   在openGauss社区Plugin仓进行兼容性相关开发(https://gitee.com/opengauss/Plugin)

②   通过fastcheck自测以及CI门禁

③   提供checkin测试报告和开发文档并通过SIG组评审

 

# **开发要点**

## 开放接口函数 DLL_PUBLIC PG_FUNCTION_INFO_V1_PUBLIC统一管理

为了避免插件与内核同名函数所产生的符号冲突，我们在makefile中使用-fvisibility=hidden参数，使得插件函数不会注册进符号表进而避免，但是这样内核就无法调用其中的函数，因此对于需要开放给内核调用的接口函数，我们需要添加一个DLL_PUBLIC关键字将其注册进符号表，还需用PG_FUNCTION_INFO_V1_PUBLIC添加函数，来避免API版本报错。

因此后续考虑使用一个头文件统一管理需要开放的接口函数。

如果写在builtin中的函数或者有同名重载函数需要开放或者供内部引用，extern 后面不能加“C”。

![](../image/DLL.png)

![](../image/INFO_V1.png)


## Makefile需要添加相对应.o

对于新增的cpp文件，需要在其对应模块的makefile和主目录下的makefile中分别添加其.o文件来生成so，使得其中函数能在插件中调用。



![](../image/MAKEFILE.png)

## 新增HOOK

对于新增的模块如果不在内核现存hook的引擎部分需要在内核加新的hook。

 

## 插件安装、使用方法

将whale文件夹放入数据库的contrib目录下，并使用make -sj && make install -sj完成编译安装，随后创建一个B兼容性的数据库，随后插件会自动完成加载，之后即可使用。

![](../image/CREATE.PNG)
![](../image/INSTALL.png)

## fastcheck自测方法

将测试用的.sql文件放入sql文件夹 预期结果放入expected文件夹。注意使用LF行尾序列避免格式问题。
![](../image/FASTCHECK.PNG)

通过make installcheck p=xxx或者make check p=xxx命令就能进行自测,如提示变量值不对需要手动修改pg_regress.cpp中相应值。
其中installcheck是使用现有的数据库，因此需要保证端口号p与当前开启的数据库一致，check则是会编译一个临时数据库用于测试，可以避免现有数据库的一些数据对结果产生的干扰，但速度会稍慢。
![](../image/PG_REGRESS1.png)

![](../image/PG_REGRESS2.png)

memcheck:memcheck并不是一个新的check，只是编译openGauss时，编译一个memcheck版的，然后通过跑fastcheck来发现代码中的内存问题。
编译方式和编译普通的openGauss基本一致，只是在configure时，添加一个 --enable-memory-check 参数，编译出来的就是memcheck版本的openGauss。
./configure --gcc-version=7.3.0 CC=g++ CFLAGS='-O0' --prefix=$GAUSSHOME --3rd=$BINARYLIBS --enable-debug --enable-cassert --enable-thread-safety --with-readline --without-zlib --enable-memory-check
installcheck需要自己设置asan option
export HOME=~
ulimit -v unlimited
export ASAN_OPTIONS=detect_leaks=1:halt_on_error=0:alloc_dealloc_mismatch=0:log_path=$HOME/memchk/memcheck
设置完环境变量后，正常跑fastcheck即可，跑完后，会在 $HOME/memchk/memcheck路径下生成文件名为runlog.xxx的memcheck报告。根据memcheck报告分析是否有内存问题。如何分析memcheck报告可自行网上搜索memcheck报告分析、asan报告分析等关键字。

## 升级

930为第一次正式版本，后续新增的写在SQL中的函数、类型等均需要同步写到升级脚本中。


## 新增函数

将与新类型无关的新方法添加到插件的builtin.ini中，builtin.ini指导：(https://mp.weixin.qq.com/s/UWHwhI4jHK6nxPSYeJPVfg)
而由于插件内部不附带pg_type.h

因此在创建新的兼容类型时，无法和之前内核开发一样直接写在头文件中，而是需要通过sql语句来create type，由于这样生成的类型OID是随机的，因此对于和该类型相关联的方法、CAST、操作符等均需要在SQL语句中生成，且SQL中调用的新增函数必须按上述开放接口函数，同时建议除了需要覆盖内核同名函数外，尽可能不要在builtin.ini中开发新函数，而是使用sql，因为这样可以避免和未来内核开发的函数OID冲突。

下面提供一些模板样例用于参考：

```sql

--对于可变长度可变类型的函数sql

create or replace function pg_catalog.gs_interval(variadic arr "any") returns int language C immutable as '$libdir/dolphin', 'gs_interval';

--CREATE TYPE

DROP TYPE IF EXISTS pg_catalog.year CASCADE;

DROP TYPE IF EXISTS pg_catalog._year CASCADE;

CREATE TYPE pg_catalog.year;

CREATE OR REPLACE FUNCTION pg_catalog.year_in (cstring) RETURNS year LANGUAGE C STABLE STRICT as '$libdir/whale', 'year_in';

CREATE OR REPLACE FUNCTION pg_catalog.year_out (year) RETURNS cstring LANGUAGE C STABLE STRICT as '$libdir/whale', 'year_out';

CREATE OR REPLACE FUNCTION pg_catalog.yeartypmodin (cstring[]) RETURNS integer LANGUAGE C IMMUTABLE STRICT as '$libdir/whale', 'yeartypmodin';

CREATE OR REPLACE FUNCTION pg_catalog.yeartypmodout (integer) RETURNS cstring LANGUAGE C IMMUTABLE STRICT as '$libdir/whale', 'yeartypmodout';

CREATE TYPE pg_catalog.year (input=year_in, output=year_out, internallength=2, passedbyvalue, alignment=int2, TYPMOD_IN=yeartypmodin, TYPMOD_OUT=yeartypmodout);

 

--CREATE OPERATOR

CREATE OPERATOR pg_catalog.=(leftarg = year, rightarg = year, procedure = year_eq, restrict = eqsel, join = eqjoinsel, MERGES);

 

CREATE OPERATOR pg_catalog.<>(leftarg = year, rightarg = year, procedure = year_ne, restrict = neqsel, join = neqjoinsel);

 

--ADD PG_OPFAMILY

CREATE OR REPLACE FUNCTION Insert_pg_opfamily_temp(

IN imethod integer,

IN iname text,

IN inamespace integer,

IN iowner integer

)

RETURNS void

AS $$

DECLARE

 row_name record;

 query_str_nodes text;

BEGIN

 query_str_nodes := 'select * from dbe_perf.node_name';

 FOR row_name IN EXECUTE(query_str_nodes) LOOP

   insert into pg_catalog.pg_opfamily values (imethod, iname, inamespace, iowner);

 END LOOP;

 return;

END; $$

LANGUAGE 'plpgsql';

select Insert_pg_opfamily_temp(403, 'year_ops', 11, 10);

DROP FUNCTION Insert_pg_opfamily_temp();

 

--ADD PG_CAST

DROP CAST IF EXISTS (integer AS year) CASCADE;

CREATE CAST(integer AS year) WITH FUNCTION int32_year(integer) AS IMPLICIT;

 

DROP CAST IF EXISTS (integer AS date) CASCADE;

CREATE CAST(integer AS date) WITH FUNCTION int32_b_format_date(integer);

 

--ADD PG_OPCLASS

CREATE OR REPLACE FUNCTION Insert_pg_opclass_temp(

IN icmethod integer,

IN icname text,

IN icnamespace integer,

IN icowner integer,

IN icfamily integer,

IN icintype integer,

IN icdefault boolean,

IN ickeytype integer

)

RETURNS void

AS $$

DECLARE

 row_name record;

 query_str_nodes text;

BEGIN

 query_str_nodes := 'select * from dbe_perf.node_name';

 FOR row_name IN EXECUTE(query_str_nodes) LOOP

   insert into pg_catalog.pg_opclass values (icmethod, icname, icnamespace, icowner, icfamily, icintype, icdefault, ickeytype);

 END LOOP;

 return;

END; $$

LANGUAGE 'plpgsql';

 

create or replace function insert_year(

IN opcmethod integer,

IN opcname character,

IN opcnamespace integer,

IN opcowner integer,

IN opcfamilyname character,

IN opcintypename character,

IN opcdefault boolean,

IN opckeytype integer

)

returns void

AS $$

DECLARE

 opfamily integer;

 opcintype integer;

BEGIN

select oid into opfamily from pg_opfamily where opfname = opcfamilyname;

select oid into opcintype from pg_type where typname = opcintypename;

 perform Insert_pg_opclass_temp(opcmethod, opcname, opcnamespace, opcowner, opfamily, opcintype, opcdefault, opckeytype);

 return;

END; 

$$ LANGUAGE 'plpgsql';

 

select insert_year(403, 'year_ops', 11, 10, 'year_ops', 'year', true, 0);

 

DROP FUNCTION insert_year;

DROP FUNCTION Insert_pg_opclass_temp();

 

-- add pg_amproc


CREATE OR REPLACE FUNCTION Insert_pg_amproc_temp(

IN iprocfamily  oid,

IN iproclefttype oid,

IN iprocrighttype oid,

IN iprocnum    smallint,

IN iproc     regproc

)

RETURNS void

AS $$

DECLARE

 row_name record;

 query_str_nodes text;

BEGIN

 query_str_nodes := 'select * from dbe_perf.node_name';

 FOR row_name IN EXECUTE(query_str_nodes) LOOP

   insert into pg_catalog.pg_amproc values (iprocfamily, iproclefttype, iprocrighttype, iprocnum, iproc);

 END LOOP;

 return;

END; $$

LANGUAGE 'plpgsql';

 

create or replace function insert_year(

IN opfamily     character,

IN left_type   character,

IN right_type   character,

IN funcname     character,

 

)

returns void

AS $$

DECLARE

 opfamilyoid integer;

 left_typeoid integer;

right_typeoid integer;

amprocnum integer;

func integer;

BEGIN

 

select oid into opfamilyoid from pg_opfamily where opfname = opcfamilyname;

select oid into left_type from pg_type where typname = left_type;

select oid into right_typeoid from pg_type where typname = right_type;

select oid into func from pg_proc where typname = funcname;

 perform Insert_pg_amproc_temp(opfamilyoid, left_typeoid, right_typeoid, amprocnum, func);

 return;

END; 

$$ LANGUAGE 'plpgsql';

 

select insert_year('year_ops'，'year'，'year'，1，'year_cmp');

select insert_year('year_ops'，'year'，'year'，2，' year_sortsupport ');

DROP FUNCTION insert_year();

DROP FUNCTION Insert_pg_amproc_temp();


-- add pg_amop


CREATE OR REPLACE FUNCTION Insert_pg_amop_temp(

IN iopfamily   integer,

IN ioplefttype  integer,

IN ioprighttype integer,

IN iopstrategy  integer,

IN ioppurpose  character,

IN iopopr    integer,

IN iopmethod   integer,

IN iopsortfamily integer

)

RETURNS void

AS $$

DECLARE

 row_name record;

 query_str_nodes text;

BEGIN

 query_str_nodes := 'select * from dbe_perf.node_name';

 FOR row_name IN EXECUTE(query_str_nodes) LOOP

   insert into pg_catalog.pg_amop values (iopfamily, ioplefttype, ioprighttype, iopstrategy, ioppurpose, iopopr, iopmethod, iopsortfamily);

 END LOOP;

 return;

END; $$

LANGUAGE 'plpgsql';

 

create or replace function insert_year(

 IN opfamily     character,

 IN iopstrategy   integer,

 IN left_type    character,

 IN right_type   character,

 IN iopopr     character

)

returns void

AS $$

DECLARE

 opfamilyoid integer;

 leftoid integer;

 rightoid integer;

 opoproid integer;

BEGIN

 select oid into opfamilyoid from pg_opfamily where opfname = opfamily;

 select oid into leftoid from pg_type where typname = left_type;

 select oid into rightoid from pg_type where typname = right_type;

 select oid into opoproid from pg_operator where oprname = iopopr and oprleft = leftoid and oprright = rightoid;

 perform Insert_pg_amop_temp(opfamilyoid, leftoid, rightoid, iopstrategy, 's', opoproid, 403, 0);

 return;

END; 

$$ LANGUAGE 'plpgsql';

 

select insert_year('year_ops', 1, 'year', 'year', '<');

select insert_year('year_ops', 2, 'year', 'year', '<=');

drop function Insert_pg_amop_temp();
```

# 终结符与非终结符相关

由于要开发表名、用户名大小写敏感且不影响其他的对象名，需要对一些终结符与非终结符进行改造，这种改造会与原openGauss产生一定的差异，容易引起后续开发者在开发过程中产生一定的不适应，因此发布文档对这些被改造的终结符、非终结符进行描述。

（详情见PR：[https://gitee.com/opengauss/Plugin/pulls/238](https://gitee.com/opengauss/Plugin/pulls/238)）

## 终结符

### IDENT

IDENT终结符是一个用于表示对象名称的字符串类型终结符。

在原来词法分析中，如果词法分析匹配到一个非关键字的标识符，就会将该字符串进行转小写、截断的操作，并将处理完成后的字符串绑定到yylval的str字段中，并借此传递到语法解析层面。

现在，如果词法分析匹配到一个非关键字的标识符，将不会进行转小写的操作，而是直接经历截断操作，并绑定到yylval的str中进行传递。

因此，如果在开发的过程中使用到这个终结符，可以通过如下所示的方法将其转换为小写：

```
normal_ident:		IDENT							{ $$ = downcase_str($1, is_quoted()); };
```

这里新建了一个名为downcase_str的函数对字符串类型的标识符进行小写转换，其实际的内容为：

```
#define is_quoted()  pg_yyget_extra(yyscanner)->core_yy_extra.ident_quoted
static char* downcase_str(char* ident, bool is_quoted)
{
	if (ident == NULL || is_quoted) {
		return ident;
	}
	int i;
	bool enc_is_single_byte = (pg_database_encoding_max_length() == 1);
	int len = strlen(ident);
	for (i = 0; i < len; i++) {
		ident[i] = (char)GetLowerCaseChar((unsigned char)ident[i], enc_is_single_byte);
	}

	return ident;
}
```

其中，is_quoted表示该字符串是否为引用，true则为引用，不进行强制转小写操作，false则为非引用，会进行转小写的操作。由于is_quoted()返回的内容是一个全局的变量，在同一个语句中前一个词的pg_yyget_extra(yyscanner)->core_yy_extra.ident_quoted会被后一个词覆盖，导致没有办法得到正确的结果。因此在使用的过程中，更推荐用normal_ident对IDENT进行替换，其内容如下所示：

```
normal_ident:		IDENT							{ $$ = downcase($1); };
```

这样的话就能够保证每次获取到的ident_quoted就是当前IDENT的，从而能够正确地识别该词是否被引用。

### 关键字

关键字在词法分析时是和IDENT终结符一起处理的，因为两者都能被同一个正则表达式匹配。

由于非保留关键字可以当做表名进行使用，所以也对关键字进行了大小写敏感处理，如果需要用到对应关键字的值，则需要对关键字进行转小写操作，如下所示：

```
ColId:		IDENT									{ $$ = downcase_str($1, is_quoted()); }
			| unreserved_keyword					{ $$ = downcase_str(pstrdup($1), is_quoted()); }
			| col_name_keyword						{ $$ = downcase_str(pstrdup($1), is_quoted()); }
```

可以看到，在ColId中，对unreserved_keyword和col_name_keyword的返回值都进行了转小写的处理，用于适配原来关键字的字符串必为小写的行为。值得注意的是，关键字其实并不会被引用，所以进行转换时可以让关键字的is_quoted直接置为false，如下所示：

```
ColId:		IDENT									{ $$ = downcase($1); }
			| unreserved_keyword					{ $$ = downcase_str(pstrdup($1), false); }
			| col_name_keyword						{ $$ = downcase_str(pstrdup($1), false); }
		;
```

## 非终结符

由于有些非终结符可以表示不同对象的标识符，所以对于非终结符，一般用替换的方式进行处理。

在替换的过程中可能会出现IDENT中所说的情况，在同一个语句中前一个词的pg_yyget_extra(yyscanner)->core_yy_extra.ident_quoted会被后一个词覆盖，所以使用了一个新的结构体去保留非关键字的值以及引用情况，如下所示：

```
typedef struct DolphinString
{
	Node* node;
	char* str;
	bool is_quoted;
} DolphinString;
```

node用来保存节点（主要是Value或者A_Indices类型的结点），str用于保存字符串的值，is_quoted（保存非Value类型的时候会直接置为false）则表示该词是否被引用。如果要生成一个DolphinString结点，可以通过以下函数生成：

```
static DolphinString* MakeDolphinString(char* str, Node* node, bool is_quoted)
{
	DolphinString* result = (DolphinString*)palloc(sizeof(DolphinString));
	result->str = str;
	result->node = node;
	result->is_quoted = is_quoted;
	return result;
}

static inline DolphinString* MakeDolphinStringByChar(char* str, bool is_quoted)
{
	return MakeDolphinString(str, (Node*)makeString(str), is_quoted);
}

static inline DolphinString* MakeDolphinStringByNode(Node* node, bool is_quoted)
{
	return MakeDolphinString(IsA(node, Value) ? strVal(node) : NULL, node, is_quoted);
}
```

具体的使用方法如下所示：

```
dolphin_indirection_el:
			'.' DolphinColLabel
				{
					$$ = $2;
				}
			| ORA_JOINOP
				{
					$$ = MakeDolphinStringByNode((Node *) makeString("(+)"), false);
				}
			| '.' '*'
				{
					$$ = MakeDolphinStringByNode((Node *) makeNode(A_Star), false);
				}
			| '[' a_expr ']'
				{
					A_Indices *ai = makeNode(A_Indices);
					ai->lidx = NULL;
					ai->uidx = $2;
					$$ = MakeDolphinStringByNode((Node *) ai, false);
				}
			| '[' a_expr ':' a_expr ']'
				{
					A_Indices *ai = makeNode(A_Indices);
					ai->lidx = $2;
					ai->uidx = $4;
					$$ = MakeDolphinStringByNode((Node *) ai, false);
				}
			| '[' a_expr ',' a_expr ']'
				{
					A_Indices *ai = makeNode(A_Indices);
					ai->lidx = $2;
					ai->uidx = $4;
					$$ = MakeDolphinStringByNode((Node *) ai, false);
				}
		;
```

### 替换情况

前面已经说了，针对非终结符一般采用在特定语法进行替换的方式实现区分，这里主要介绍一下新建的非终结符及其替换方案。

#### ColId -> DolphinColId

主要用于替换ColId，为DolphinString类型的非终结符，定义如下所示：

```
DolphinColId:		IDENT							{ $$ = MakeDolphinStringByChar($1, is_quoted()); }
					| unreserved_keyword			{ $$ = MakeDolphinStringByChar(pstrdup($1), is_quoted()); }
					| col_name_keyword				{ $$ = MakeDolphinStringByChar(pstrdup($1), is_quoted()); }
		;
```

#### ColLabel -> DolphinColLabel

用于替换DolphinColLabel，为DolphinString类型的非终结符，定义如下所示：

```
DolphinColLabel:	IDENT									{ $$ = MakeDolphinStringByChar($1, is_quoted()); }
					| unreserved_keyword					{ $$ = MakeDolphinStringByChar(pstrdup($1), is_quoted()); }
					| col_name_keyword						{ $$ = MakeDolphinStringByChar(pstrdup($1), is_quoted()); }
					| type_func_name_keyword				{ $$ = MakeDolphinStringByChar(pstrdup($1), is_quoted()); }
					| reserved_keyword
						{
							/* ROWNUM can not be used as alias */
							if (DolphinObjNameCmp($1, "rownum", is_quoted())) {
								const char* message = "ROWNUM cannot be used as an alias";
								InsertErrorMessage(message, u_sess->plsql_cxt.plpgsql_yylloc);
								ereport(errstate,
									(errcode(ERRCODE_SYNTAX_ERROR),
										errmsg("ROWNUM cannot be used as an alias"),
												parser_errposition(@1)));
							}
							$$ = MakeDolphinStringByChar(pstrdup($1), is_quoted());
						}
		;
```

#### indirection_el -> dolphin_indirection_el

用于在dolphin_indirection中对indirection_el进行替换，其为DolphinString类型，定义如下所示：

```
dolphin_indirection_el:
			'.' DolphinColLabel
				{
					$$ = $2;
				}
			| ORA_JOINOP
				{
					$$ = MakeDolphinStringByNode((Node *) makeString("(+)"), false);
				}
			| '.' '*'
				{
					$$ = MakeDolphinStringByNode((Node *) makeNode(A_Star), false);
				}
			| '[' a_expr ']'
				{
					A_Indices *ai = makeNode(A_Indices);
					ai->lidx = NULL;
					ai->uidx = $2;
					$$ = MakeDolphinStringByNode((Node *) ai, false);
				}
			| '[' a_expr ':' a_expr ']'
				{
					A_Indices *ai = makeNode(A_Indices);
					ai->lidx = $2;
					ai->uidx = $4;
					$$ = MakeDolphinStringByNode((Node *) ai, false);
				}
			| '[' a_expr ',' a_expr ']'
				{
					A_Indices *ai = makeNode(A_Indices);
					ai->lidx = $2;
					ai->uidx = $4;
					$$ = MakeDolphinStringByNode((Node *) ai, false);
				}
		;
```

#### index_name -> dolphin_index_name

这个替换主要是用于解决CLUSTER语法中索引名和表名的语法冲突，仍为字符串类型，定义如下所示：

```
dolphin_index_name: DolphinColId					{ $$ = downcase_str($1->str, $1->is_quoted); };
```

#### func_name -> dolphin_func_name

该替换主要用于处理a_expr处的语法冲突，类型与func_name一样为list类型，定义如下所示：

```
dolphin_func_name:	type_function_name
						{ $$ = list_make1(makeString($1)); }
					| DolphinColId dolphin_indirection
						{
							$$ = check_func_name(lcons(makeString(downcase_str($1->str, $1->is_quoted)),
													GetNameListFromDolphinString($2)), yyscanner);
						}
		;
```

#### qualified_name -> dolphin_qualified_name

该替换主要用于区分表名和索引名、快照名以及序列名等的标识符，相较于qualified_name，拥有大小写敏感的特性，且会根据是否开启大小写敏感、对应标识符是否引用、对应标识符是否为表名这几种情况决定是否对标识符进行小写转换，定义如下所示：

```
dolphin_qualified_name:
			DolphinColId
				{
					$$ = makeRangeVar(NULL, GetDolphinObjName($1->str, $1->is_quoted), @1);
				}
			| DolphinColId dolphin_indirection
				{
					check_dolphin_qualified_name($2, yyscanner);
					$$ = makeRangeVar(NULL, NULL, @1);
					const char* message = "improper qualified name (too many dotted names)";
					DolphinString* first = NULL;
					DolphinString* second = NULL;
					switch (list_length($2))
					{
						case 1:
							$$->catalogname = NULL;
							$$->schemaname = downcase_str($1->str, $1->is_quoted);
							first = (DolphinString*)linitial($2);
							$$->relname = strVal(first->node);
							break;
						case 2:
							$$->catalogname = downcase_str($1->str, $1->is_quoted);
							first = (DolphinString*)linitial($2);
							second = (DolphinString*)lsecond($2);
							$$->schemaname = downcase_str(strVal(first->node), first->is_quoted);
							$$->relname = strVal(second->node);
							break;
						default:
							InsertErrorMessage(message, u_sess->plsql_cxt.plpgsql_yylloc);
							ereport(errstate,
									(errcode(ERRCODE_SYNTAX_ERROR),
									 errmsg("improper qualified name (too many dotted names): %s",
											NameListToString(lcons(makeString($1->str), GetNameListFromDolphinString($2)))),
									 parser_errposition(@1)));
							break;
					}
				}
		;
```

get_dolphin_obj_name会根据lower_case_table_names是否为0决定需不需要调用小写转换函数，如果为0，则表示大小写敏感，不需要转小写，>0则大小写不敏感，需要调用小写转换函数。

#### name_list -> dolphin_name_list

用于替换name_list，为list类型，仅在drop user语法中替换使用，定义为：

```
dolphin_name_list:	RoleId
					{ $$ = list_make1(makeString($1)); }
			| dolphin_name_list ',' RoleId
					{ $$ = lappend($1, makeString($3)); }
		;
```

#### qualified_name_list -> dolphin_qualified_name_list

用于替换qualified_name_list ，是dolphin_qualified_name的链表，为list类型，定义如下所示：

```
dolphin_qualified_name_list:
			dolphin_qualified_name										{ $$ = list_make1($1); }
			| dolphin_qualified_name_list ',' dolphin_qualified_name	{ $$ = lappend($1, $3); }
		;
```

#### any_name -> dolphin_any_name

仅用于在COMMENT语法中替换any_name，为list类型，定义如下所示：

```
dolphin_any_name:	DolphinColId						{ $$ = list_make1(makeString(GetDolphinObjName($1->str, $1->is_quoted))); }
			| DolphinColId dolphin_attrs
			{
				List* list = $2;
				List* result = list_make1(makeString(downcase_str($1->str, $1->is_quoted)));
				ListCell * cell = NULL;
				int length = list_length($2);
				int count = 1;
				foreach (cell, list) {
					DolphinString* dolphinString = (DolphinString*)lfirst(cell);
					Value* value = (Value*)(dolphinString->node);
					char* str = strVal(value);
					bool is_quoted = dolphinString->is_quoted;
					if (length == 1 && count == 1) {
						/* schema_name.table_name */
						result = lappend(result, makeString(GetDolphinObjName(str, is_quoted)));
					} else if (count == 2) {
						/* category_name.schema_name.table_name */
						result = lappend(result, makeString(GetDolphinObjName(str, is_quoted)));
					} else {
						/* other_names */
						result = lappend(result, makeString(downcase_str(str, is_quoted)));
					}
					count++;
				}
				$$ = result;
			}
		;
```

#### any_name_list -> dolphin_any_name_list

仅用于在drop table语句中对any_name_list进行替换，为dolphin_any_name的链表，定义如下所示：

```
dolphin_any_name_list:
			dolphin_any_name										{ $$ = list_make1($1); }
			| dolphin_any_name_list ',' dolphin_any_name			{ $$ = lappend($1, $3); }
		;
```

#### attrs -> dolphin_attrs

用于在dolphin_any_name中对attrs进行替换，为list类型，定义如下所示：

```
dolphin_attrs:		'.' DolphinColLabel
						{ $$ = list_make1($2); }
					| dolphin_attrs '.' DolphinColLabel
						{ $$ = lappend($1, $3); }
		;
```

#### indirection -> dolphin_indirection

用于对dolphin_qualified_name以及dolphin_func_name中的indirection进行替换，类型为list，定义如下所示：

```
dolphin_indirection:
			dolphin_indirection_el									{ $$ = list_make1($1); }
			| dolphin_indirection dolphin_indirection_el			{ $$ = lappend($1, $2); }
		;
```

#### alias_clause -> dolphin_alias_clause

用于对表别名进行替换，类型为alias类型，定义如下所示：

```
dolphin_alias_clause:
			AS DolphinColId '(' name_list ')'
				{
					$$ = makeNode(Alias);
					$$->aliasname = GetDolphinObjName($2->str, $2->is_quoted);
					$$->colnames = $4;
				}
			| AS DolphinColId
				{
					$$ = makeNode(Alias);
					$$->aliasname = GetDolphinObjName($2->str, $2->is_quoted);
				}
			| DolphinColId '(' name_list ')'
				{
					$$ = makeNode(Alias);
					$$->aliasname = GetDolphinObjName($1->str, $1->is_quoted);
					$$->colnames = $3;
				}
			| DolphinColId
				{
					$$ = makeNode(Alias);
					$$->aliasname = GetDolphinObjName($1->str, $1->is_quoted);
				}
		;
```

