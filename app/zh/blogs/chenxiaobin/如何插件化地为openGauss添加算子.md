---
title: '如何插件化地为openGauss添加算子'
date: '2021-08-17'
category: 'blog'
tags: ['openGauss插件化架构']
archives: '2021-08'
author: 'chenxiaobin'
summary: '如何插件化地为openGauss添加算子'
img: '/zh/blogs/chenxiaobin/title/img.png'
times: '16:30'
---

# 1. openGauss 算子概述

## 1.1 openGauss 执行算子汇总

openGauss 的算子按类型可分为四类：控制算子、连接算子、扫描算子和物化算子。下面汇总了当前（openGauss2.0.0）已有的算子。

| 算子            | 文件                    | 类型         |
| --------------- | ----------------------- | ------------ |
| Agg             | nodeAgg.cpp             | 物化算子     |
| Append          | nodeAppend.cpp          | 控制算子     |
| BitmapAnd       | nodeBitmapAnd.cpp       | 控制算子     |
| BitmapHeapscan  | nodeBitmapHeapscan.cpp  | 扫描算子     |
| BitmapIndexscan | nodeBitmapIndexscan.cpp | 扫描算子     |
| BitmapOr        | nodeBitmapOr.cpp        | 控制算子     |
| Ctescan         | nodeCtescan.cpp         | 扫描算子     |
| Foreignscan     | nodeForeignscan.cpp     | 扫描算子     |
| Functionscan    | nodeFunctionscan.cpp    | 扫描算子     |
| Group           | nodeGroup.cpp           | 物化算子     |
| Hash            | nodeHash.cpp            | 物化算子     |
| Hashjoin        | nodeHashjoin.cpp        | 连接算子     |
| Indexonlyscan   | nodeIndexonlyscan.cpp   | 扫描算子     |
| Indexscan       | nodeIndexscan.cpp       | 扫描算子     |
| Limit           | nodeLimit.cpp           | 物化算子     |
| LockRows        | nodeLockRows.cpp        | 控制算子     |
| Material        | nodeMaterial.cpp        | 物化算子     |
| MergeAppend     | nodeMergeAppend.cpp     | 控制算子     |
| Mergejoin       | nodeMergejoin.cpp       | 连接算子     |
| ModifyTable     | nodeModifyTable.cpp     | 控制算子     |
| Nestloop        | nodeNestloop.cpp        | 连接算子     |
| PartIterator    | nodePartIterator.cpp    | 连接算子     |
| Recursiveunion  | nodeRecursiveunion.cpp  | 控制算子     |
| Result          | nodeResult.cpp          | 控制算子     |
| Samplescan      | nodeSamplescan.cpp      | 扫描算子     |
| Seqscan         | nodeSeqscan.cpp         | 扫描算子     |
| SetOp           | nodeSetOp.cpp           | 物化算子     |
| Sort            | nodeSort.cpp            | 物化算子     |
| Stub            | nodeStub.cpp            | 控制算子     |
| Subplan         | nodeSubplan.cpp         | 控制算子     |
| Subqueryscan    | nodeSubqueryscan.cpp    | 扫描算子     |
| Tidscan         | nodeTidscan.cpp         | 扫描算子     |
| Unique          | nodeUnique.cpp          | 物化算子     |
| Valuesscan      | nodeValuesscan.cpp      | 扫描算子     |
| WindowAgg       | nodeWindowAgg.cpp       | 物化算子     |
| Worktablescan   | nodeWorktablescan.cpp   | 扫描算子     |
| Extensible      | nodeExtensible.cpp      | 用于扩展算子 |

## 1.2 PG 新增算子汇总

下面列出 PG（14devel）相比于 openGauss 多了哪些算子。

| 算子                | 文件                      | 类型 |
| ------------------- | ------------------------- | ---- |
| Custom              | nodeCustom.c              |      |
| Gather              | nodeGather.c              |      |
| GatherMerge         | nodeGatherMerge.c         |      |
| IncrementalSort     | nodeIncrementalSort.c     |      |
| Namedtuplestorescan | nodeNamedtuplestorescan.c |      |
| ProjectSet          | nodeProjectSet.c          |      |
| TableFuncscan       | nodeTableFuncscan.c       |      |
| Tidrangescan        | nodeTidrangescan.c        |      |

# 2. 算子插件（TidRangeScan）

1.1 表格中的算子 Extensible 类似于 PG 的算子 Custom，其作用是允许插件向数据库增加新的扫描类型。主要分为三步：

首先，在路径规划期间生成插件增加的扫描路径（ExtensiblePath）；

然后，如果优化器选择该路径作为最优路径，那么需要生成对应的计划（ExtensiblePlan）；

最后，必须提供执行该计划的能力（ExtensiblePlanState）。

下面以 TidRangeScan 为示例，演示如何使用 Extensible 通过插件化的方式为 openGauss 新增一个执行算子。

## 2.1 功能介绍

openGauss 中堆表由一个个 page 组成，每个 page 包含若干个 tuple。tid 是 tuple 的寻址地址，由两个字段组成：（pageid,itemid），pageid 代表第几个数据块，itemid 代表这个 page 内的第几条记录。例如 tid=(10,1)表示第 11 个数据块中的第一条记录（pageid 从 0 开始，itemid 从 1 开始）。

PostgreSQL 14 devel 新增了算子 TidRangeScan，可以直接通过 tid 来范围访问某个 page 的全部数据。（带来的好处：如果需要更新一张表所有数据时，可以开启多个会话并行去更新不同的 page，提高效率。）

本次展示将该特性通过插件的方式移植到 openGauss，插件化的增加一个执行算子。

## 2.2 使用说明

tidrangescan 插件定义了一个 bool 类型的 guc 参数：enable_tidrangescan，控制优化器对 tidrangescan 扫描算子的使用，on 表示使用，off 表示不使用。

<img src='./images/usage.png'>

## 2.3 插件边界

本小节主要列举调用了哪些内核接口，当内核演进过程中修改了这些接口，有可能会影响插件的使用。

| 接口名                        | 文件             | 模块   |
| ----------------------------- | ---------------- | ------ |
| ExecInitExpr                  | execQual.cpp     | 优化层 |
| clauselist_selectivity        | clausesel.cpp    | 优化层 |
| cost_qual_eval                | costsize.cpp     | 优化层 |
| get_tablespace_page_costs     | spccache.cpp     | 优化层 |
| get_baserel_parampathinfo     | relnode.cpp      | 优化层 |
| add_path                      | pathnode.cpp     | 优化层 |
| extract_actual_clauses        | restrictinfo.cpp | 优化层 |
| heap_getnext                  | heapam.cpp       | 执行层 |
| ExecClearTuple                | execTuples.cpp   | 执行层 |
| ExecStoreTuple                | execTuples.cpp   | 执行层 |
| ExecScanReScan                | execScan.cpp     | 执行层 |
| heap_beginscan                | heapam.cpp       | 执行层 |
| heap_rescan                   | heapam.cpp       | 执行层 |
| ExecScan                      | execScan.cpp     | 执行层 |
| heap_endscan                  | heapam.cpp       | 执行层 |
| make_ands_explicit            | clauses.cpp      | 执行层 |
| deparse_context_for_planstate | ruleutils.cpp    | 执行层 |
| deparse_expression            | ruleutils.cpp    | 执行层 |
| ExplainPropertyText           | explain.cpp      | 执行层 |

## 2.4 设计实现

本节提到的 hook 在第 3 章《hook 点总述》会做详细说明。

附社区 PR：https://gitee.com/opengauss/Plugin/pulls/1

### 2.4.1 插件开发通用流程

#### 2.4.1.1 Makefile

在 openGauss 源码的 contrib 目录下新建开发插件的目录，这里为 tidrangescan。在该目录下新建 Makefile 文件。

```makefile
# contrib/tidrangescan/Makefile
MODULES = tidrangescan # 模块名
EXTENSION = tidrangescan # 扩展的名称
REGRESS = tidrangescan # 回归测试
REGRESS_OPTS = --dlpath=$(top_builddir)/src/test/regress -c 0 -d 1 --single_node # 回归测试相关的选项
DATA = tidrangescan--1.0.sql # 插件安装的SQL文件

override CPPFLAGS :=$(filter-out -fPIE, $(CPPFLAGS)) –fPIC # fPIC选项

# 以下是openGauss构建插件相关的命令，保留即可
ifdef USE_PGXS
PG_CONFIG = pg_config
PGXS := $(shell $(PG_CONFIG) --pgxs)
include $(PGXS)
else
subdir = contrib/tidrangescan
top_builddir = ../..
include $(top_builddir)/src/Makefile.global
include $(top_srcdir)/contrib/contrib-global.mk
endif
```

#### 2.4.1.2 control 文件

新建控制文件，这里为 tidrangescan.control。内容如下：

```
# tidrangescan extension
comment = 'example implementation for custom-scan-provider interface'  default_version = '1.0'  # 与Makefile里DATA属性的sql文件名的版本保持一致  module_pathname = '$libdir/tidrangescan'
relocatable = true
```

#### 2.4.1.3 sql 文件

sql 文件命名格式为*extensionName*--_version_.sql，*version*即为上述版本号，这里为`tidrangescan--1.0.sql`。在这里编写所需的函数。

```
-- complain if script is sourced in psql, rather than via CREATE EXTENSION
\echo Use "CREATE EXTENSION tidrangescan" to load this file. \quit

CREATE FUNCTION pg_catalog.tidrangescan_invoke() RETURNS VOID AS '$libdir/tidrangescan','tidrangescan_invoke' LANGUAGE C STRICT;
```

#### 2.4.1.4 回归测试用例

创建 sql 和 expected 目录，分别存放测试用例的 sql 脚本和预期输出，例如这里为 tidrangescan.sql 和 tidrangescan.out。

#### 2.4.1.5 源文件及插件目录总览

创建插件的头文件和 cpp 文件，这是实现插件的核心,下文主要介绍该插件代码层的设计与实现。

至此插件总体目录概览如下。

<img src='./images/extension_directory.png'>

### 2.4.2 优化器

#### 2.4.2.1 添加路径

将 set_rel_pathlist_hook 赋值为 SetTidRangeScanPath，该函数解析扫描表的查询条件，当存在 tid 范围查询时调用 add_path 添加 ExtensiblePath，计算代价，并将创建计划的接口 tidrangescan_path_methods 存入 path 中。

```cpp
static void SetTidRangeScanPath(PlannerInfo *root, RelOptInfo *baserel, Index rtindex, RangeTblEntry *rte)
{
    ...
    tidrangequals = TidRangeQualFromRestrictInfoList(baserel->baserestrictinfo, baserel);
    ...
    if (tidrangequals != NIL) {
        cpath = (ExtensiblePath*)palloc0(sizeof(ExtensiblePath));
        cpath->path.type = T_ExtensiblePath;
        cpath->path.pathtype = T_ExtensiblePlan;
        cpath->path.parent = baserel;
        cpath->extensible_private = tidrangequals;
        cpath->methods = &tidrangescan_path_methods;

        cost_tidrangescan(&cpath->path, root, baserel, tidrangequals, cpath->path.param_info);
        add_path(root, baserel, &cpath->path);
    }
}

static ExtensiblePathMethods  tidrangescan_path_methods = {
    "tidrangescan",        /* ExtensibleName */
    PlanTidRangeScanPath,    /* PlanExtensiblePath */
};
```

#### 2.4.2.2 创建计划

上述的 tidrangescan_path_methods 定义了创建计划函数 PlanTidRangeScanPath，根据最优路径生成计划 ExtensiblePlan，同时将创建计划状态节点接口 tidrangescan_scan_methods 存入 plan。

```cpp
static Plan *PlanTidRangeScanPath(PlannerInfo *root, RelOptInfo *rel, ExtensiblePath *best_path, List *tlist, List *clauses, List *custom_plans)
{
    ExtensiblePlan *node = makeNode(ExtensiblePlan);
    Plan    *plan = &node->scan.plan;
    List    *tidrangequals = best_path->extensible_private;
    ...
    node->extensible_exprs = tidrangequals;
    node->scan.plan.startup_cost = best_path->path.startup_cost;
    node->scan.plan.total_cost = best_path->path.total_cost;
    node->scan.plan.plan_rows = best_path->path.rows;
    node->scan.plan.plan_width = rel->width;
    node->methods = &tidrangescan_scan_methods;
    return plan;
}

static ExtensiblePlanMethods tidrangescan_scan_methods = {
    "tidrangescan",        /* ExtensibleName */
    CreateTidRangeScanState,  /* CreateExtensiblePlanState */
};
```

### 2.4.3 执行器

#### 2.4.3.1 创建计划状态节点

上述的 tidrangescan_scan_methods 定义了创建 PlanState 函数 CreateTidRangeScanState，根据传入的 plan 返回 PlanState，同样将后续执行器执行的若干方法结构体 tidrangescan_exec_methods 存入 PlanState。

```cpp
Node *CreateTidRangeScanState(ExtensiblePlan *custom_plan)
{
    TidRangeScanState *tidrangestate;
    /*
     * create state structure
     */
    tidrangestate = (TidRangeScanState*)palloc0(sizeof(TidRangeScanState));
    NodeSetTag(tidrangestate, T_ExtensiblePlanState);
    tidrangestate->css.methods = &tidrangescan_exec_methods;
    /*
     * mark scan as not in progress, and TID range as not computed yet
     */
    tidrangestate->trss_inScan = false;
    return (Node*)&tidrangestate->css;
}

static ExtensibleExecMethods tidrangescan_exec_methods = {
    "tidrangescan",        /* ExtensibleName */
    BeginTidRangeScan,      /* BeginExtensiblePlan */
    ExecTidRangeScan,      /* ExecExtensiblePlan */
    EndTidRangeScan,      /* EndExtensiblePlan */
    ExecReScanTidRangeScan,      /* ReScanExtensiblePlan */
    ExplainTidRangeScan       /* ExplainExtensiblePlan */
};
```

#### 2.4.3.2 执行层 hook

tidrangescan_exec_methods 定义了五个接口，分别是执行层各个阶段的主函数：BeginTidRangeScan、ExecTidRangeScan、EndTidRangeScan、ExecReScanTidRangeScan、ExplainTidRangeScan。

```cpp
static void BeginTidRangeScanScan(ExtensiblePlanState *node, EState *estate, int eflags)
{
    TidRangeScanState *ctss = (TidRangeScanState *) node;
    ExtensiblePlan    *cscan = (ExtensiblePlan *) node->ss.ps.plan;
    ctss->css.ss.ss_currentScanDesc = NULL;  /* no table scan here */
    /*
     * initialize child expressions
     */
    ctss->css.ss.ps.qual = (List*)ExecInitExpr((Expr*)cscan->scan.plan.qual, (PlanState *)ctss);
    TidExprListCreate(ctss);
}

static TupleTableSlot * ExecTidRangeScan(ExtensiblePlanState *pstate)
{
    return ExecScan(&pstate->ss, (ExecScanAccessMtd) TidRangeNext, (ExecScanRecheckMtd) TidRangeRecheck);
}

static void EndTidRangeScan(ExtensiblePlanState *node)
{
    TableScanDesc scan = node->ss.ss_currentScanDesc;
    if (scan != NULL)
        heap_endscan(scan);
    /*
     * Free the exprcontext
     */
    ExecFreeExprContext(&node->ss.ps);

    /*
     * clear out tuple table slots
     */
    if (node->ss.ps.ps_ResultTupleSlot)
        ExecClearTuple(node->ss.ps.ps_ResultTupleSlot);
    ExecClearTuple(node->ss.ss_ScanTupleSlot);
}

static void ExecReScanTidRangeScan(ExtensiblePlanState *node)
{
    /* mark scan as not in progress, and tid range list as not computed yet */
    ((TidRangeScanState*)node)->trss_inScan = false;
    /*
     * We must wait until TidRangeNext before calling table_rescan_tidrange.
     */
    ExecScanReScan(&node->ss);
}

static void ExplainTidRangeScan(ExtensiblePlanState *node, List *ancestors, ExplainState *es)
{
    TidRangeScanState *ctss = (TidRangeScanState *) node;
    ExtensiblePlan    *cscan = (ExtensiblePlan *) ctss->css.ss.ps.plan;
    /* logic copied from show_qual and show_expression */
    if (cscan->extensible_exprs) {
        bool  useprefix = es->verbose;
        Node  *qual;
        List  *context;
        char  *exprstr;
        /* Convert AND list to explicit AND */
        qual = (Node *) make_ands_explicit(cscan->extensible_exprs);
        /* Set up deparsing context */
        context = deparse_context_for_planstate((Node*)ctss, ancestors, es->rtable);
        /* Deparse the expression */
        exprstr = deparse_expression(qual, context, useprefix, false);
        /* And add to es->str */
        ExplainPropertyText("tid range quals", exprstr, es);
  }
}
```

### 2.4.4 改造点

#### 2.4.4.1 无法调用内核 static 函数

在移植过程中，受限于插件实现的方式，无法调用内核的 static 函数，需要拷贝到插件侧或者对原有的代码作改造。

执行层获取单个 tuple 阶段，PG 在 heapam.c 中定义了一个函数 heap_getnextslot_tidrange，其中调用了 static 函数 heapgettup_pagemode 和 heapgettup。在将 heap_getnextslot_tidrange 搬到 openGauss 插件时，由于无法调用这两个 static 函数，需要将其改为调用 heap_getnext，通过 heap_getnext 访问 heapgettup_pagemode 和 heapgettup。

# 3. hook 点总述

## 3.1 优化器

### 3.1.1 添加路径

通常用来产生 ExtensiblePath 对象，并使用 add_path 把它们加入到 rel 中。

插入位置所在的函数：set_rel_pathlist

```cpp
typedef void (*set_rel_pathlist_hook_type) (PlannerInfo *root,
                                           RelOptInfo *rel,
                                           Index rti,
                                           RangeTblEntry *rte);
extern THR_LOCAL PGDLLIMPORT set_rel_pathlist_hook_type set_rel_pathlist_hook;
```

ExtensiblePath 定义如下。

```cpp
typedef struct ExtensiblePath {
    Path path;
    uint32 flags;           /* mask of EXTENSIBLEPATH_* flags */
    List* extensible_paths; /* list of child Path nodes, if any */
    List* extensible_private;
    const struct ExtensiblePathMethods* methods;
} ExtensiblePath;
```

- flags 是一个标识，如果该自定义的路径支持反向扫描，则它应该包括 EXTENSIBLEPATH_SUPPORT_BACKWARD_SCAN，如果支持标记和恢复则包括 EXTENSIBLEPATH_SUPPORT_MARK_RESTORE。

- extensible_paths 是这个自定义路径节点的子 Path 节点列表

- extensible_private 可用来存储该自定义路径的私有数据。

- methods 必须包含根据该路径生成计划的方法。ExtensiblePathMethods 结构如下，主要实现 PlanExtensiblePath。

```cpp
typedef struct ExtensiblePathMethods {
    const char* ExtensibleName;

    /* Convert Path to a Plan */
    struct Plan* (*PlanExtensiblePath)(PlannerInfo* root, RelOptInfo* rel, struct ExtensiblePath* best_path,
        List* tlist, List* clauses, List* extensible_plans);
} ExtensiblePathMethods;
```

### 3.1.2 添加连接路径

提供连接路径，同样创建 ExtensiblePath 路径。

插入位置所在的函数：add_paths_to_joinrel

```cpp
typedef void (*set_join_pathlist_hook_type) (PlannerInfo *root,
                                               RelOptInfo *joinrel,
                                               RelOptInfo *outerrel,
                                               RelOptInfo *innerrel,
                                               JoinType jointype,
                                               SpecialJoinInfo *sjinfo,
                                               Relids param_source_rels,
                                               SemiAntiJoinFactors *semifactors,
                                               List *restrictlist);
extern THR_LOCAL PGDLLIMPORT set_join_pathlist_hook_type set_join_pathlist_hook;
```

### 3.1.3 创建计划

调用上述 ExtensiblePath 中的 methods 定义的接口 PlanExtensiblePath，将自定义路径转换为一个完整的计划，返回 ExtensiblePlan。

插入位置所在的函数：create_scan_plan->create_extensible_plan

```cpp
typedef struct ExtensiblePlan {
    Scan scan;

    uint32 flags;                  /* mask of EXTENSIBLEPATH_* flags, see relation.h */

    List* extensible_plans;        /* list of Plan nodes, if any */

    List* extensible_exprs;        /* expressions that extensible code may evaluate */

    List* extensible_private;      /* private data for extensible code */

    List* extensible_plan_tlist;   /* optional tlist describing scan
                                    * tuple */
    Bitmapset* extensible_relids;  /* RTIs generated by this scan */

    ExtensiblePlanMethods* methods;
} ExtensiblePlan;
```

- 和 ExtensiblePath 一样，flags 同样是一个标识。

- extensible_plans 可以用来存放子 Plan 节点

- extensible_exprs 用来存储需要由 setrefs.cpp 和 subselect.cpp 修整的表达式树。

- extensible_private 用来存储只有该自定义算子使用的私有数据。

- extensible_plan_tlist 描述目标列

- extensible_relids 为该扫描节点要处理的关系集合

- methods 必须包含生成该计划对应的计划节点 PlanState 的方法。ExtensiblePlanMethods 结构如下，主要实现 CreateExtensiblePlanState。

```cpp
typedef struct ExtensiblePlanMethods {
    char* ExtensibleName;

    /* Create execution state (ExtensiblePlanState) from a ExtensiblePlan plan node */
    Node* (*CreateExtensiblePlanState)(struct ExtensiblePlan* cscan);
} ExtensiblePlanMethods;
```

## 3.2 执行器

### 3.2.1 创建计划状态节点

调用上述 ExtensiblePlanMethods 中的 methods 定义的接口 CreateExtensiblePlanState,为这个 ExtensiblePlan 分配一个 ExtensiblePlanState。

插入位置所在的函数：ExecInitNodeByType->ExecInitExtensiblePlan

```cpp
typedef struct ExtensiblePlanState {
    ScanState ss;
    uint32 flags;        /* mask of EXTENSIBLEPATH_* flags, see relation.h */
    List* extensible_ps; /* list of child PlanState nodes, if any */
    const ExtensibleExecMethods* methods;
} ExtensiblePlanState;
```

- flags 含义同 ExtensiblePath 和 ExtensiblePlan 一样

- extensible_ps 为该计划节点的子节点。

- methods 为包含多个执行所需接口的结构体 ExtensibleExecMethods，在下文做具体介绍。

### 3.2.2 执行层 hook

上面 CustomScanState 的成员 CustomExecMethods 定义了几个 hook 点

```cpp
typedef struct ExtensibleExecMethods {
    const char* ExtensibleName;

    /* Executor methods: mark/restore are optional, the rest are required */
    void (*BeginExtensiblePlan)(struct ExtensiblePlanState* node, EState* estate, int eflags);
    TupleTableSlot* (*ExecExtensiblePlan)(struct ExtensiblePlanState* node);
    void (*EndExtensiblePlan)(struct ExtensiblePlanState* node);
    void (*ReScanExtensiblePlan)(struct ExtensiblePlanState* node);
    void (*ExplainExtensiblePlan)(struct ExtensiblePlanState* node, List* ancestors, struct ExplainState* es);
} ExtensibleExecMethods;
```

1.  BeginExtensiblePlan 完成所提供的 ExtensiblePlanState 的初始化。标准的域已经被 ExecInitExtensiblePlan 初始化，但是任何私有的域应该在这里被初始化。

插入位置所在的函数：ExecInitNodeByType->ExecInitExtensiblePlan

2.  ExecExtensiblePlan 执行扫描，取下一个扫描元组，如果还有任何元组剩余，它应该用当前扫描方向的下一个元组填充 ps_ResultTupleSlot，并且接着返回该元组槽。如果没有，则用 NULL 填充或者返回一个空槽。

插入位置所在的函数：ExecProcNode->ExecProcNodeByType

3.  EndExtensiblePlan 清除任何与 ExtensiblePlanState 相关的私有数据。这个方法是必需的，但是如果没有相关的数据或者相关数据将被自动清除，则它不需要做任何事情。

插入位置所在的函数：ExecEndNodeByType->ExecEndExtensiblePlan

4.  ReScanExtensiblePlan 把当前扫描倒回到开始处，并且准备重新扫描该关系。

插入位置所在的函数：ExecReScan->ExecReScanByType

5.  ExplainExtensiblePlan 为一个自定义扫描计划节点的 EXPLAIN 输出额外的信息。这个回调函数是可选的。即使没有这个回调函数，被存储在`ScanState 中的公共的数据（例如目标列表和扫描关系）也将被显示，但是该回调函数允许显示额外的信息（例如私有状态）。

插入位置所在的函数：ExplainNode->show_pushdown_qual
