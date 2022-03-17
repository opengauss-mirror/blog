+++

title = "Compilation Guide for openGauss Under Heterogeneous Conditions"

date = "2021-07-07"

tags = [ "Compilation Guide for openGauss Under Heterogeneous Conditions"]

archives = "2021-07"

author = "Yansong LI"

summary = "Compilation Guide for openGauss Under Heterogeneous Conditions"

img = "/en/post/2022/title/img1.png"

times = "12:30"

+++

# Compilation Guide for openGauss Under Heterogeneous Conditions<a name="ZH-CN_TOPIC_0000001206146732"></a>

## **Download**<a name="section957631212574"></a>

opengauss-openGauss-server-v2.0.0.tar.gz \(openGauss source code package\)

**Download link:**

https://gitee.com/opengauss/openGauss-server/repository/archive/v2.0.0?ref=v2.0.0&sha=78689da92cdc811cad2458dc213d007e96864062&format=tar.gz&captcha\_type=yunpian

opengauss-openGauss-third\_party-2.0.0.zip \(source code package of all third-party libraries on which openGauss-server depends\)

**Download link:**

https://gitee.com/opengauss/openGauss-third\_party/repository/archive/v2.0.0.zip?ref=v2.0.0&sha=3a38c6c134e5b2e39d0557d575ec04302a83584a&format=zip&captcha\_type=yunpian

openGauss-third\_party\_binarylibs.tar.gz \(medium packages of all third-party libraries on which openGauss-server depends\)

**Download link:**

https://opengauss.obs.cn-south-1.myhuaweicloud.com/2.0.0/openGauss-third\_party\_binarylibs.tar.gz

Note: This document is compiled by referring to the following official compilation document:

https://opengauss.org/en/docs/2.0.0/docs/Quickstart/Quickstart.html

## **Precautions**<a name="section5439234155711"></a>

Currently, 64-bit executable programs are generated.

## **Environment Information**<a name="section3432134111586"></a>

The compilation is performed on Phytium Kirin V10. The detailed information is as follows:

```
Linux localhost.localdomain 4.19.90-vhulk2001.1.0.0026.ns7.15.aarch64 #1 SMP Sun Apr 19 22:34:29 CST 2020 aarch64 aarch64 aarch64 GNU/Linux

 
NAME="Kylin Linux Advanced Server"

VERSION="V10 (Azalea)"
ID="kylin"

ID_LIKE="fedora"
VARIANT="Server"

VARIANT_ID="server"
VERSION_ID="V10"

PRETTY_NAME="Kylin Linux Advanced Server V10 (Azalea)"
ANSI_COLOR="0;31"

CPE_NAME="cpe:/o:kylin:enterprise_linux:V10:GA:server"
HOME_URL="https://www.kylinos.cn/"

BUG_REPORT_URL="https://bugzilla.kylinos.cn/bugzilla/"
KYLIN_BUGZILLA_PRODUCT="Kylin Linux Advanced Server 10"

KYLIN_BUGZILLA_PRODUCT_VERSION=V10
KYLIN_SUPPORT_PRODUCT="Kylin Linux Advanced Server"

KYLIN_SUPPORT_PRODUCT_VERSION="V10"
```

## **Compilation**<a name="section152519515593"></a>

-   **openGauss-third\_party**

    This repository is used to compile all open-source third-party software on which the openGauss depends.

    There are four directories.

    a. The  **build**  directory contains all third-party scripts on which the compilation depends.

    b. The  **buildtools**  directory contains build tools for compiling these opensources and openGauss servers.

    c. The  **dependency**  directory contains all open-source components on which the openGauss server depends.

    d. The  **platform**  directory contains open-source software such as OpenJDK.

-   **Dependencies**

    The following lists the software requirements for compiling openGauss.

    \(CMake, GCC, and Python must be installed. You are advised to install other components. You can try to compile the code even if the installation is not complete.\)

    ```
    libaio-devel
    ncurses-devel
    
    pam-devel
    libffi-devel
    
    libtool
    libtool-devel
    
    libtool-ltdl
    python-devel
    
    openssl-devel
    lsb_release (The medium package name in Phytium-Kylin is neokylin-lsb.)
    
    bison
    cmake
    
    gcc
    ```

    Note: CMake and GCC have strict version requirements. The CMake version must be later than 3.16.5, and the GCC version must be 7.3.0.

    Compile Python 3 and set environment variables. The installation of CMake and GCC will be described later. Run the  **yum install**  command to install other dependencies. For network limitations, mount the Kylin ISO file for installation.

    Before installing CMake and GCC, install Python 3 and the preceding software.


-   **Installing CMake**

    The version of CMake is cmake-3.17.1, and the installation path is  **/home/opengauss/3rd/cmake**. \(Related dependencies are installed in  **/home/opengauss/3rd**.\) To install the CMake, run the following commands:

    ```
    tar –zxvf cmake-3.17.1.tar.gz
    ./bootstrap --prefix=/home/opengauss/3rd/cmake-3.17.1
    
    make –j4
    make install
    ```

-   **Installing GCC**

    The GCC installation depends on GMP 6.2.0, MPFR 4.0.2, and MPC 1.1.0. To install the GCC, run the following commands:

    ```
    gmp
    tar –zxvf gmp-6.2.0.tar.gz
    
    cd gmp-6.2.0
    ./configure --prefix=/home/opengauss/3rd/gmp-6.2.0 --build=x86 CFLAGS=-fPIC
    
    make –j4
    make install
    
     
    mpfr
    
    tar –zxvf mpfr-4.0.2.tar.gz
    cd mpfr-4.0.2
    
    ./configure --prefix=/home/opengauss/3rd/mpfr-4.0.2 --with-gmp=/home/opengauss/3rd/gmp-6.2.0
    make –j4
    
    make install
     
    
    mpc
    tar –zxvf mpc-1.1.0.tar.gz
    
    cd mpc-1.1.0
    ./configure --prefix=/home/opengauss/3rd/mpc-1.1.0 --with-gmp=/home/opengauss/3rd/gmp-6.2.0 --with-mpfr=/home/opengauss/3rd/mpfr-4.0.2
    
    make –j4
    make install
    
     
    gcc
    
    tar –zxvf gcc-7.3.0
    cd gcc-7.3.0
    
    export LD_LIBRARY_PATH=/home/opengauss/3rd/gmp-6.2.0/lib:/home/opengauss/3rd/mpfr-4.0.2/lib:/home/opengauss/3rd/mpc-1.1.0/lib:$ LD_LIBRARY_PATH
    ./configure --prefix=/home/opengauss/3rd/gcc-7.3.0 --with-gmp=/home/opengauss/3rd/gmp-6.2.0 --with-mpfr=/home/opengauss/3rd/mpfr-4.0.2 --with-mpc=/home/opengauss/3rd/mpc-1.1.0
    
    make –j4
    make install
    ```

-   **Compiling openGauss-third\_party**

    Save the  **opengauss-openGauss-third\_party-2.0.0.zip**  package to  **/home/opengauss**  and decompress it.

    ```
    cd openGauss-third_party
    ```

    By default, compilation commands are executed concurrently, which occupies a large amount of memory. If the memory is insufficient, run the  **find. -name "\*.sh" | xargs grep "make" | grep j**  command to find all MAKE statements, delete  **-sj**,  **-sj$\{cpus\_num\}**, or  **–sj 8**, and run the statements in single-thread mode. You can also change the value based on the number of cores and memory size of the host.

    Set the environment variables.

    ```
    export CMAKEROOT=/home/opengauss/3rd/cmake-3.17.1
    export GCC_PATH=/home/opengauss/3rd/gcc-7.3.0
    
    export CC=$GCC_PATH/bin/gcc
    export CXX=$GCC_PATH/bin/g++
    
    export LD_LIBRARY_PATH=$GCC_PATH/lib64:/home/opengauss/3rd/mpc-1.1.0/lib:/home/opengauss/3rd/mpfr-4.0.2/lib:/home/opengauss/3rd/gmp-6.2.0/lib:$CMAKEROOT/lib:$LD_LIBRARY_PATH
    export PATH=$CMAKEROOT/bin:$PATH
    ```

    The compilation procedure is as follows:

    ```
    1. Run cd /home/opengauss/openGauss-third_party/build.
    2. Run sh build_all.sh.
    ```

    After the compilation is complete, the result is exported to  **/home/opengauss/openGauss-third\_party/output**.

    ```
    /home/opengauss/openGauss-third_party/output is the third-party medium directory on which openGauss-server depends.
    ```


## **openGauss-server**<a name="section17248203633"></a>

This repository is used to compile GaussDB binary executable files.

-   **Dependencies**

    The following lists the software requirements for compiling openGauss.

    You are advised to use the default installation packages of the following dependency software obtained from the operating system installation CD-ROM or installation source. If the following software does not exist, refer to the recommended software versions. \(You can try compilation even if the installation is not complete.\)

    ```
    libaio-devel  0.3.109-13
    flex    2.5.31 or later
    bison   2.7-4
    ncurses-devel  5.9-13.20130511
    glibc-devel     2.17-111
    patch   2.7.1-10
    readline-devel  7.0-13
    ```


-   **Compiling openGauss-server**

    Save the  **opengauss-openGauss-server-v2.0.0.tar.gz**  package to  **/home/opengauss**  and decompress it.

    ```
    cd openGauss-server
    ```

    By default, compilation commands are executed concurrently, which occupies a large amount of memory. If the memory is insufficient, run the  **find. -name "\*.sh" | xargs grep "make" | grep j**  command to find all MAKE statements, delete  **-sj**,  **-sj$\{cpus\_num\}**, or  **–sj 8**, and run the statements in single-thread mode. You can also change the value based on the number of cores and memory size of the host.

    Set the environment variables.

    ```
    export CODE_BASE=`pwd`
    export BINARYLIBS=`pwd`/../openGauss-third_party/output
    export GAUSSHOME=$CODE_BASE/dest
    export GCC_PATH=/home/opengauss/3rd/gcc-7.3.0
    export CC=$GCC_PATH/bin/gcc
    export CXX=$GCC_PATH/bin/g++
    export LD_LIBRARY_PATH=$GCC_PATH/lib64:/home/opengauss/3rd/mpc-1.1.0/lib:/home/opengauss/3rd/mpfr-4.0.2/lib:/home/opengauss/3rd/gmp-6.2.0/lib:$LD_LIBRARY_PATH
    export PATH=$GCC_PATH/bin:$PATH
    ```

    The compilation procedure is as follows:

    ```
    Run the following commands: ./configure --gcc-version=7.3.0 CC=g++ CFLAGS="-O2 -g3" --prefix=$GAUSSHOME --3rd=$BINARYLIBS --enable-thread-safety --with-readline --without-zlib
    make –j4
    make install
    Errors may be reported during the compilation. After the errors are rectified, the compilation result is exported to the $GAUSSHOME directory.
    ```

-   **Rectifying Errors**

    Save  **openGauss-third\_party\_binarylibs.tar.gz**  to  **/home/opengauss**.

    ```
    cd /home/opengauss
    tar –zxvf openGauss-third_party_binarylibs.tar.gz
    ```

    Most compilation errors are caused by the lack of some dynamic libraries and header files in the third-party software compiled in section 4.2.4. The following solutions are available:

    -   1. Run  **cd openGauss-third\_party/dependency**  to go to the corresponding library directory, and perform compilation by referring to  **README.md**. The compilation result is output to  **openGauss-third\_party/output/dependency/kylin\_aarch64**.
    -   2. Copy the corresponding library in the  **openGauss-third\_party\_binarylibs/dependency/openeuler\_aarch64**  directory to the  **openGauss-third\_party/output/dependency/kylin\_aarch64**  directory. \(In this method, some libraries cannot be used after being copied, because some function symbols are missing.\)

        Note: Select the first solution if possible, unless the first solution is busy and the second solution can solve the problem.

    The following analyzes and rectifies possible errors one by one:

    -   ../../../../../src/include/access/obs/obs\_am.h:33:10: fatal error: eSDKOBS.h: The file or directory does not exist.

        Cause: The  **libobs**  library is missing in  **openGauss-third\_party/output**.

        Solution: If the  **libobs**  source code does not exist in  **openGauss-third\_party/dependency**, use the second solution.

        cp -r openGauss-third\_party\_binarylibs/dependency/openeuler\_aarch64/libobs openGauss-third\_party/output/dependency/kylin\_aarch64

    -   ../../../../src/include/gs\_policy/gs\_string.h:32:10: fatal error: boost/functional/hash.hpp: The file or directory does not exist.

        Cause: The  **boost**  library is missing in  **openGauss-third\_party/output**.

        Solution: Add the  **boost**  source code to  **openGauss-third\_party/dependency**. However, the compilation process is complex. In addition, it is verified that the  **boost**  library in  **openGauss-third\_party\_binarylibs**  can be used normally. Therefore, the second solution is selected.

        cp -r openGauss-third\_party\_binarylibs/dependency/openeuler\_aarch64/boost openGauss-third\_party/output/dependency/kylin\_aarch64

    -   Cipherfn.cpp:1231:5: error: 'krb5\_set\_profile\_path' has not been declared in this scope.

        Cause: The  **kerberos**  library is missing in  **openGauss-third\_party/output**.

        Solution: If the  **kerberos**  library in  **openGauss-third\_party\_binarylibs/dependency**  is unavailable, select the first solution.

        cd openGauss-third\_party/dependency/kerberos

        python build.py -m all -f krb5-1.17.1.tar.gz -t "comm|llt"

        Compilation error:

        /home/opengauss/3rd/gcc-7.3.0/lib/gcc/aarch64-unknown-linux-gnu/7.3.0/include-fixed/openssl/bn.h:138:11: fatal error: openssl/e\_os2.h: The file or directory does not exist.

        Solution:

        export C\_INCLUDE\_PATH=/home/opengauss/openGauss-third\_party/output/dependency/kylin\_aarch64/openssl/comm/include

        Run the  **python build.py -m all -f krb5-1.17.1.tar.gz -t "comm|llt"**  command.

        Continue to report the following error:

        make\[2\]: \*\*\* There is no rule to create the target libcom\_err\_gauss.exports required by binutils.versions. \(Several similar errors occur. Rectify the errors before continuing the compilation.\)

        Solution:

        cd /home /opengauss/openGauss-third\_party/dependency/kerberos/krb5-1.17.1/src/util/et/

        cp –r libcom\_err.exports libcom\_err\_gauss.exports

        cd /home /opengauss/openGauss-third\_party/dependency/kerberos/krb5-1.17.1/src/lib/krb5

        cp –r libkrb5.exports libkrb5\_gauss.exports

        cd /home /opengauss/openGauss-third\_party/dependency/kerberos/krb5-1.17.1/src/lib/crypto

        cp –r libk5crypto.exports libk5crypto\_gauss.exports

        cd /home /opengauss/openGauss-third\_party/dependency/kerberos/krb5-1.17.1/src/lib/rpc

        cp –r libgssrpc.exports libgssrpc\_gauss.exports

        cd /home /opengauss/openGauss-third\_party/dependency/kerberos/krb5-1.17.1/src/lib/gssapi

        cp –r libgssapi\_krb5.exports libgssapi\_krb5\_gauss.exports

        Run the  **python build.py -m all -f krb5-1.17.1.tar.gz -t "comm|llt"**  command.

        Continue to report the following error:

        openssl.so: In the 'unmarshal\_w' function:

        openssl.c:\(.text+0x330\): undefined reference to'BN\_set\_flags'

        openssl.so: In the 'ossl\_hash' function:

        openssl.c:\(.text+0x8b8\): undefined reference to 'EVP\_MD\_CTX\_new'

        openssl.c:\(.text+0x9ac\): undefined reference to 'EVP\_MD\_CTX\_free'

        Solution:

        cp /home/opengauss/openGauss-third\_party\_binarylibs/dependency/kylin\_aarch64/openssl/comm/lib/libcrypto.so /home/opengauss/openGauss-third\_party/dependency/kerberos/krb5-1.17.1/src/lib

        cp /home/opengauss/openGauss-third\_party\_binarylibs/dependency/kylin\_aarch64/openssl/comm/lib/libssl.so /home/opengauss/openGauss-third\_party/dependency/kerberos/krb5-1.17.1/src/lib

        Run the  **python build.py -m all -f krb5-1.17.1.tar.gz -t "comm|llt"**  command.

        Note: After a problem is solved, a message similar to the following is displayed:

        The next patch would create the file src/lib/crypto/libk5crypto\_gauss.exports,which already exists!  Assume -R? \[n\]

        If you enter  **y**, the system automatically deletes the  **libcom\_err\_gauss.exports**,  **ibkrb5\_gauss.exports**,  **libk5crypto\_gauss.exports**,  **libgssrpc\_gauss.exports**  and  **libgssapi\_krb5\_gauss.exports**  files. Therefore, you need to copy the five files immediately after you enter  **y**.

        Suggestion: Solve the preceding problems before continuing the compilation.

    -   ../../../../src/include/gs\_policy/curl\_utils.h:17:10: fatal error: curl/curl.h: The file or directory does not exist.

        Cause: The  **libcurl**  library is missing in  **openGauss-third\_party/output**.

        Solution: The  **libcurl**  source code exists in  **openGauss-third\_party/dependency**, but the compilation process is complex. In addition, it is verified that the  **libcurl**  library in  **openGauss-third\_party\_binarylibs**  can be used normally. Therefore, the second solution is selected.

        cp -r openGauss-third\_party\_binarylibs/dependency/openeuler\_aarch64/libcurl openGauss-third\_party/output/dependency/kylin\_aarch64

    -   client\_logic.cpp:50:10: fatal error: MurmurHash3.h: The file or directory does not exist.

        costsize.cpp:94:10: fatal error: hll.h: The file or directory does not exist.

        Cause: The  **postgresql-hll**  library is missing in  **openGauss-third\_party/output**.

        Solution: If the  **postgresql-hll**  source code exists in  **openGauss-third\_party/dependency**, use the first solution.

        cd openGauss-third\_party/dependency/postgresql-hll

        sh build.sh –m all

        After the compilation is complete, only the  **lib**  folder exists and the  **include**  folder is missing. Copy the  **lib**  folder from  **openGauss-third\_party\_binarylibs**.

        cp -r openGauss-third\_party\_binarylibs/dependency/openeuler\_aarch64/postgresql-hll /comm/include openGauss-third\_party/output/dependency/kylin\_aarch64/postgresql-hll/comm

    -   ../../../../src/include/access/dfs/dfs\_query.h:29:10: fatal error: orc/Exceptions.hh: The file or directory does not exist.

        Cause: The  **liborc**  library is missing in  **openGauss-third\_party/output**.

        Solution: If the  **liborc**  source code does not exist in  **openGauss-third\_party/dependency**, use the second solution.

        cp -r openGauss-third\_party\_binarylibs/dependency/openeuler\_aarch64/liborc openGauss-third\_party/output/dependency/kylin\_aarch64

    -   remote\_read.pb.h:10:10: fatal error: google/protobuf/port\_def.inc: The file or directory does not exist.

        Cause: The  **protobuf**  library is missing in  **openGauss-third\_party/output**.

        Solution: If the  **protobuf**  source code exists in  **openGauss-third\_party/dependency**, use the first solution.

        cd openGauss-third\_party/dependency/protobuf

        python build.py -m all -f protobuf-3.11.3.zip -t "comm|llt"

    -   remote\_read.grpc.pb.h:10:10: fatal error: grpc/impl/codegen/port\_platform.h: The file or directory does not exist.

        Cause: The  **grpc**  library is missing in  **openGauss-third\_party/output**.

        Solution: The  **grpc**  source code exists in  **openGauss-third\_party/dependency**, but the compilation process is complex. In addition, it is verified that the  **grpc**  library in  **openGauss-third\_party\_binarylibs**  can be used properly. Therefore, the second solution is selected.

        cp -r openGauss-third\_party\_binarylibs/dependency/openeuler\_aarch64/grpc openGauss-third\_party/output/dependency/kylin\_aarch64

    -   parquet\_file\_reader.h:27:10: fatal error: parquet/api/reader.h: The file or directory does not exist.

        Cause: The  **libparquet**  library is missing in  **openGauss-third\_party/output**.

        Solution: If the  **libparquet**  source code does not exist in  **openGauss-third\_party/dependency**, use the second solution.

        cp -r openGauss-third\_party\_binarylibs/dependency/openeuler\_aarch64/libparquet openGauss-third\_party/output/dependency/kylin\_aarch64

    -   /usr/bin/ld: Cannot find  **–lthrift**.

        Cause: The  **libthrift**  library is missing in  **openGauss-third\_party/output**.

        Solution: If the  **libthrift**  source code exists in  **openGauss-third\_party/dependency**, use the first solution.

        cd openGauss-third\_party/dependency/libthrift

        sh ./build.sh

    -   /usr/bin/ld: Cannot find  **-lsnappy**.

        Cause: The  **snappy**  library is missing in  **openGauss-third\_party/output**.

        Solution: If the  **snappy**  source code exists in  **openGauss-third\_party/dependency**, use the first solution.

        cd openGauss-third\_party/dependency/snappy

        sh ./build.sh

    -   /usr/bin/ld: Cannot find  **-lzstd**.

        Cause: The  **zstd**  library is missing in  **openGauss-third\_party/output**.

        Solution: If the  **zstd**  source code exists in  **openGauss-third\_party/dependency**, use the first solution.

        cd openGauss-third\_party/dependency/zstd

        sh ./build.sh

    -   /home/opengauss/openGauss-server/../openGauss-third\_party/output/dependency/kylin\_aarch64/libobs/comm/lib/libxml2.so: undefined reference to 'fcntl64@GLIBC\_2.28'

        Cause: During the compilation, the  **libxml2.so**  file in the  **openGauss-third\_party/output/dependency/ kylin\_aarch64/libobs**  directory is found, which lacks 'fcntl64@GLIBC\_2.28'.

        Solution: The  **libxml2**  source code exists in  **openGauss-third\_party/dependency**. However, during the compilation, the  **libxml2-2.9.9.tar.gz**  package cannot be decompressed. In addition,  **libobs**  is copied from  **openGauss-third\_party\_binarylibs**. Therefore, neither the first solution nor the second solution can solve this problem.

        Run the  **find / -name "libxml2\*"**  command. You can find the  **libxm12.so\***  library in  **/usr/lib64**.

        cp –r /usr/lib64/libxml2.so.2.9.1 openGauss-third\_party/output/dependency/kylin\_aarch64/libobs/comm/lib

        cd openGauss-third\_party/output/dependency/kylin\_aarch64/libobs/comm/lib

        ln –s libxml2.so.2.9.1 libxml2.so.2

        ln –s libxml2.so.2.9.1 libxml2.so

        If the  **libxml2.so\***  file already exists in  **openGauss-third\_party/output/dependency/kylin\_aarch64/libobs/comm/lib**, back up the file.

    The following error information is displayed when you run the  **make install**  command:

    -   ./zic: error while loading shared libraries: libssl.so.1.1: cannot open shared object file: No such file or directory

        Cause:  **libssl.so.1.1**  cannot be found.

        Solution: Run the  **find / -name "libssl.so.1.1"**  command.

        You can find it in  **/home/opengauss/openGauss-third\_party/output/dependency/kylin\_aarch64/openssl/comm/lib**. Set the environment variable.

        export LD\_LIBRARY\_PATH=/home/opengauss/openGauss-third\_party/output/dependency/kylin\_aarch64/openssl/comm/lib:$LD\_LIBRARY\_PATH

    -   cp: Failed to obtain the file status \(stat\) of "/home/opengauss/openGauss-server/../openGauss-third\_party/output/buildtools/kylin\_aarch64/gcc7.3/gcc/lib64/libstdc++.so.6": The file or directory does not exist.

        Cause: The  **gcc**  folder is missing in  **openGauss-third\_party/output/buildtools**.

        Solution: Copy the compiled  **gcc**  folder to the directory.

        cd openGauss-third\_party/output/buildtools

        mkdir -p kylin\_aarch64/gcc7.3

        cd kylin\_aarch64/gcc7.3

        cp –r /home/opengauss/3rd/gcc-7.3.0 .

        mv gcc-7.3.0 gcc

    -   cp: Failed to obtain the file status \(stat\) of "/home/opengauss/openGauss-server/../openGauss-third\_party/output/dependency/kylin\_aarch64/pljava/comm/lib/\*": The file or directory does not exist.

        Cause: The  **pljava**  library is missing in  **openGauss-third\_party/output**.

        Solution: The  **pljava**  source code exists in  **openGauss-third\_party/dependency**, but the compilation process is complex. In addition, it is verified that the  **pljava**  library in  **openGauss-third\_party\_binarylibs**  can be used properly. Therefore, the second solution is selected.

        cp -r openGauss-third\_party\_binarylibs/dependency/openeuler\_aarch64/pljava openGauss-third\_party/output/dependency/kylin\_aarch64



