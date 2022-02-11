+++

title = "Discussion on openGauss Memory Management"

date = "2021-9-13"

tags = [ "Discussion on openGauss Memory Management"]

archives = "2021-9"

author = "Shifu Li"

summary = "Discussion on openGauss Memory Management"

img = "/en/post/2022/title/img4.png"

times = "12:30"

+++

# Discussion on openGauss Memory Management<a name="ZH-CN_TOPIC_0000001251226655"></a>

Recently, a friend from the technical exchange group of openGauss asked how to allocate memory during code development. This article provides a preliminary answer to this question. The memory management of openGauss has been extended and reconstructed in many aspects to adapt to the multi-thread architecture and better meet enterprise application requirements. The openGauss memory management has been optimized in the following aspects:

-   Introduced the  **jemalloc**  open-source library to replace  **glibc**  for memory allocation and release, reducing memory fragments.
-   Introduced the logical memory management mechanism to control the memory usage of processes, preventing the OOM problem.
-   Introduced multiple memory contexts, such as shared memory context, stack memory context, and aligned memory context, to meet code development requirements in different scenarios.
-   Introduced the AddressSanitizer \(ASan\) open-source library, helping locate memory leakage and memory overwriting problems in the debug version. Various memory query views are provided, helping users observe memory usage and locate potential memory problems.

Based on the preceding functions and features, the following describes how to use the memory during coding and how to quickly locate problems from the perspectives of developers and users.

-   **1. Precautions for openGauss Memory Management Development**

    For the memory allocation and release interfaces in openGauss, the data structure and algorithm used by the general memory context do not change greatly. The new memory context is implemented by using the new data structure.

    By default, the AllocSetContextCreate function is used to create a memory context. Check whether the type of the memory context is specified. By default, the type is not specified. The STANDARD\_CONTEXT identifier is used to create a general memory context. The memory context is used only in a single thread. As the thread exits or the job is reset, the memory context needs to be cleared to prevent memory accumulation. The root node of the memory context in a thread is TopMemoryContext \(that is, t\_thrd.top\_mem\_cxt in the code\). Generally, memory application from TopMemoryContext is forbidden in the code. Subnodes are created from the corresponding memory context node based on the memory scope. Both the parent and child nodes are general memory contexts.

    Because openGauss is a multi-thread architecture, it usually uses shared memory to store key information for multi-thread access and update. When creating a memory context, you need to specify the SHARED\_CONTEXT identifier and ensure that the parent node is a shared memory context. The root node of the shared memory context is ProcessMemory \(that is, g\_instance.instance\_context in the code\). By default, no memory is allocated from the memory context. Generally, the memory that can be allocated from the shared memory context is limited. Because the memory is mainly used during job execution, developers need to limit the size of memory that can be allocated from the shared memory context \(by limiting the number of members or using the elimination mechanism\). It is recommended that the size be less than or equal to 200 MB. The operations of allocating or releasing memory in the shared memory context do not require extra locks. You can directly invoke palloc or pfree. However, you need to determine whether lock protection is required for subsequent operations of the pointer returned after the memory is allocated based on the invoking logic.

    The implementation mechanism of the stack memory context is simple. Different from the traditional memory context, the buddy algorithm is not used for alignment to the power of 2. Therefore, only 8-byte alignment is required during memory allocation, which saves a large amount of memory space. The stack memory context applies to the scenario where only palloc is called to allocate memory and the pfree operation is not required. When the memory context is not used, MemoryContextDelete or MemoryContextReset is performed for one time. For details, see the logic of using the memory by the hashjoin operator. The aligned memory context is used to align memory pages and applies to the ADIO scenario. It is seldom used in the current code.

    In addition to the scenario where the memory context is created by specifying MemoryContextCreate, the memory context can also be created implicitly when the hash\_create function is used to create a hash table. Therefore, hash tables created by hash\_create are classified into common hash tables \(used in a single thread\) and shared hash tables \(shared by the entire process\). When creating a shared hash table, you need to specify the  **HASH\_SHRCTX**  parameter, and the parent memory context specified by the parameter must be the shared memory context.

    The preceding describes the basic methods of creating and using the memory context. The requirements for allocating and releasing the memory context are as follows:

    Memory contexts are classified into thread-level contexts \(such as TopMemoryContext\), session-level contexts \(such as MessageMemoryContext\), job-level contexts \(such as ExecutorState\), and operator-level contexts \(such as HashJoin\). Memory cannot be allocated from high-level memory contexts during job execution.

    Do not frequently allocate and release the same memory context. Even for temporary memory contexts, ensure that each operator allocates and releases the memory context only once.

    Release the unused memory and memory context in a timely manner. After the operator is executed, release the operator memory context in a timely manner.

    In principle, the memory consumed by the non-high memory consumption operator \(hashjoin/hashagg/setop/material/windowsagg\) cannot exceed 10 MB. If the memory consumed exceeds 10 MB, evaluation criteria must be provided.

    The total size of the shared memory context must be controlled. In principle, the memory usage cannot exceed 200 MB. If the memory usage exceeds 200 MB, evaluation is required.

    The global variable pointer is set to null after the memory is released. That is, the pfree\_ext function is invoked to set the global variable pointer to null.

    When the array memory is allocated at a time and the memory corresponding to the array subscript is accessed and written, the Assert judgment is applied to the array subscript to prevent OOM problems.


-   **2. Locating openGauss Memory Faults**
    -   1 \> The error message "memory is temporarily unavailable" is displayed.

        Check whether the log contains "reaching the database memory limitation". If yes, the fault is caused by the logical memory management mechanism of the database. In this case, you need to analyze the database view. Check whether the log contains "reaching the OS memory limitation". If yes, the fault is caused by the memory allocation failure of the operating system. In this case, you need to check the parameter configuration of the operating system and the memory hardware.

        To protect the logical memory of the database, you need to check the following views:

        - Run the  **pg\_total\_memory\_detail**  command to check the memory usage of the internal modules of the database. When the value of  **dynamic\_used\_memory**  is greater than that of  **max\_dynamic\_memory**, a message is displayed indicating that the memory is insufficient. If the value of  **dynamic\_used\_memory**  is smaller than that of  **max\_dynamic\_memory**  and the value of  **dynamic\_peak\_memory**  is greater than that of  **max\_dynamic\_memory**, the memory was insufficient. If the value of  **other\_used\_memory**  is larger, replace the debug version to further locate the fault. The SQL statement used is  **Select \* from pg\_total\_memory\_detail**.

        - If the value of  **dynamic\_used\_shrctx**  is larger, query the  **gs\_shared\_memory\_detail**  view to check which memory context uses much memory. The SQL statement used is  **Select \* from gs\_shared\_memory\_detail**.

        - If the value of  **dynamic\_used\_shrctx**  is not large, query the  **gs\_session\_memory\_detail**  view to check which memory context uses much memory. The SQL statement used is  **Select \* from gs\_session\_memory**.

        \_detail order by totalsize desc limit 20;

        - If any fault is found in the memory context and it is difficult to locate the fault, use  **memory\_tracking\_mode**  in the debug version to further locate the file and line number.

        - If no fault is found in the memory context, check whether the number of threads is large. The possible cause is CacheMemoryContext.

        - In the debug version, run the  **gdb**  script to print the allocation information in the memory context.

    -   2 \> The RES of the database node is high or the node breaks down, and the message "Out of Memory" is displayed.

        Read the information in  **/var/log/messages**  to check which process causes the fault. Generally, the fault is caused by the GaussDB process. If the fault is caused by the GaussDB process memory, check whether the  **max\_process\_memory**  parameter is correctly configured.

        If the configuration is proper, check whether the memory usage of  **Other**  in the  **pg\_total\_memory\_detail**  view is too high.

        If the memory usage increases rapidly and is mainly used by the memory context, you can use jemalloc profiling to quickly locate the process to which the memory is allocated.

        High  **Other**  memory usage may be caused by the malloc memory of a third-party component or libpq. In this case, use the ASan tool to further locate the fault. If the fault cannot be located, disable parameters \(such as  **ssl**  and  **llvm**\) one by one and locate the fault


-   **3 Appendix**
    -   1 \> Usage of jemalloc:

        In the debug version, run the following command to set environment variables:

        In  **export MALLOC\_CONF=prof:true,prof\_final:false,prof\_gdump:true,lg\_prof\_sample:20**, the last  **20**  indicates that a heap file is generated every 2^20 bytes \(1 MB\). The value can be changed. However, after the value is increased, the number of heap files decreases, but some memory application information is lost.

        Run the  **source**  command to set environment variables and start the cluster.

        Use the  **jeprof**  to process heap files and generate PDF files. You can obtain the  **jeprof**  file from the open-source third-party binary directory  **binarylibs/**_$\{platForm\}_**/jemalloc/debug/bin**. To use the binary file, you need to run the  **yum install graphviz**  command to install graphviz.

        To generate a PDF file, run the following command:

        Full: jeprof –show\_bytes –pdf gaussdb \*.heap \> out.pdf

        Incremental: jeprof –pdf gaussdb –base=start.heap end.heap \> out.pdf

    -   2 \> Usage of ASan:

        Check the operating system configuration: The value of  **ulimit -v unlimited && vm.overcommit\_memory**  is not  **0**.

        Stop the cluster and add the following environment variable to the .bashrc file in standalone deployment:  **export ASAN\_OPTIONS=halt\_on\_error=0:alloc\_dealloc\_mismatch=0:log\_path=/tmp/memcheck/memcheck**. In the environment variable,  **log\_path**  specifies the error information output location. The directory is  **/tmp/memcheck/**, and the file name prefix is  **memcheck**.
