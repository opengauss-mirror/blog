+++
title = "A-FOT工具自动反馈优化openGauss教程" 
date = "2023-06-1" 
tags = ["优化"] 
archives = "2023-06" 
author = "罗梓浩" 
summary = "指导如何安装、使用A-FOT工具自动反馈优化openGauss性能"
img = "/zh/post/luozihao/title/img.png" 
times = "21:30"

+++

## 概要

本文档旨在指导用户如何使用A-FOT工具实现openGauss自动反馈调优。

## 前置条件

服务器端按照[版本编译](https://docs.opengauss.org/zh/docs/5.0.0/docs/CompilationGuide/%E7%89%88%E6%9C%AC%E7%BC%96%E8%AF%91.html)的指导编译一个openGauss数据库即可。客户端不做限制，可以安装一个benchmark，也可以安装一个sysbench，A-FOT是一个自动化的定向优化，只针对具体的业务进行优化，所以如果你是要用benchmark跑性能结果，就给客户端安装benchmark。
## 安装autofdo和A-FOT

如果所使用的系统为openEuler 22.03以上的版本，可以直接使用yum安装A-FOT工具及其依赖的工具autofdo：

```
yum install -y autofdo a-fot
```

如果不是，则按照如下步骤安装autofdo以及A-FOT

1. 首先需要安装autofdo，在安装之前，我们需要使用yum下载如下的依赖：
```shell
yum install -y cmake gcc-c++ protobuf protobuf-devel libtool autoconf automake git elfutils-libelf-devel openssl-devel pkg-config libunwind-devel gflags-devel
```
2. git clone 下载autofdo的源代码：
```shell
git clone --recursive https://github.com/google/autofdo.git
```
3. 执行如下命令进行安装：

```shell
cd autofdo/
mkdir build
cd build/
cmake -G "Unix Makefiles" -DCMAKE_INSTALL_PREFIX=. ../
make -j && make install
```
4. 安装完成之后，可以尝试使用如下命令将autofdo中的create_gcov等工具加入到路径中，如下所示（假设我的源码路径是/tmp/autofdo）：

```shell
export PATH=/tmp/autofdo/build:$PATH
```
当你使用create_gcov --version时，打印如下所示就代表安装成功了：

![create_gcov安装完成后的效果](.\image\17aca41c_7898503.png)

5. 通过如下命令下载A-FOT工具
```shell
git clone https://gitee.com/openeuler/A-FOT.git
```
该工具目前有一些小问题，导致在使用上会有一些小错误，所以下载完成之后需要修改一些代码，
首先是a-fot文件：
```
#!/bin/bash
current_path=$(cd "$(dirname "$0")";pwd)
config_file=${current_path}/a-fot.ini

# Profile名字
profile_name="profile.data"
# gcov名字
gcov_name="profile.gcov"

# 解析配置文件配置项
function parse_config() {
  if [[ ! -f ${config_file} ]]; then
    echo "[ERROR] Could not load config file at: ${config_file}, please check!"
    exit 1
  fi
  while read line; do
    if [[ ! ${line} =~ "#" ]]; then
      key=$(echo ${line} | awk -F "=" '{print $1}')
      value=$(echo ${line} | awk -F "=" '{print $2}')
      eval "${key}=${value}"
    fi
  done <${config_file}
}

# 解析输入的参数
function parse_input_params() {
  if [[ $# == 1 ]]; then
    suggest_info
    exit 1
  fi
  while [ $# -ge 2 ]; do
    case $1 in
    --opt_mode)
      opt_mode=$2
      shift 2
      ;;
    --perf_time)
      perf_time=$2
      shift 2
      ;;
    --app_name)
      application_name=$2
      shift 2
      ;;
    --bin_file)
      bin_file=$2
      shift 2
      ;;
    --build_script)
      build_script=$2
      shift 2
      ;;
    --work_path)
      work_path=$2
      shift 2
      ;;
    --run_script)
      run_script=$2
      shift 2
      ;;
    --max_waiting_time)
      max_waiting_time=$2
      shift 2
      ;;
    --gcc_path)
      gcc_path=$2
      shift 2
      ;;
    --config_file)
      config_file=$2
      shift 2
      ;;
    --check_success)
      check_success=$2
      shift 2
      ;;
    --build_mode)
      build_mode=$2
      shift 2
      ;;
    --user_name)
      user_name=$2
      shift 2
      ;;
    *)
      suggest_info
      exit 1
      ;;
    esac
  done
}

function check_config_item() {
  if [[ -z ${application_name} ]]; then
    echo "[ERROR] The configuration item 'application_name' is missing, please check!"
    exit 1
  fi
  if [[ -z ${bin_file} ]]; then
    echo "[ERROR] The configuration item 'bin_file' is missing, please check!"
    exit 1
  fi

  if [[ -z ${work_path} ]]; then
    echo "[ERROR] The configuration item 'work_path' is missing, please check!"
    exit 1
  fi
    if [[ -z ${build_script} ]]; then
    echo "[ERROR] The configuration item 'build_script' is missing, please check!"
    exit 1
  fi
  if [[ -z ${run_script} ]]; then
    echo "[ERROR] The configuration item 'run_script' is missing, please check!"
    exit 1
  fi
  if [[ -z ${max_waiting_time} ]]; then
    echo "[ERROR] The configuration item 'max_waiting_time' is missing, please check!"
    exit 1
  fi
  if [[ -z ${opt_mode} ]]; then
    echo "[ERROR] The configuration item 'opt_mode' is missing, please check!"
    exit 1
  fi
  if [[ -z ${perf_time} ]]; then
    echo "[ERROR] The configuration item 'perf_time' is missing, please check!"
    exit 1
  fi
  if [[ -z ${gcc_path} ]]; then
    echo "[ERROR] The configuration item 'gcc_path' is missing, please check!"
    exit 1
  fi
  if [[ -z ${check_success} ]]; then
    echo "[ERROR] The configuration item 'check_success' is missing, please check!"
    exit 1
  fi
  if [[ -z ${build_mode} ]]; then
    echo "[ERROR] The configuration item 'build_mode' is missing, please check!"
    exit 1
  fi
}

function suggest_info() {
  echo """
Usage: a-fot [OPTION1 ARG1] [OPTION2 ARG2] [...]

--config_file       Path of configuration file
--opt_mode          Optimization modes (AutoFDO/AutoPrefetch/AutoBOLT)
--perf_time         Perf sampling duration (unit: seconds)
--gcc_path          Compiler gcc path
--app_name          Application process name
--bin_file          Executable binary file path
--build_script      Application build script path
--work_path         Script working directory (used to compile the application and store the profile)
--run_script        Script path for run application
--max_waiting_time  Maximum binary startup time (unit: seconds)
--check_success     Check optimization result
--build_mode        Execute build scrip mode (Wrapper/Bear)
"""
}

# 根据模式加载不同的优化脚本
function load_script() {
  case ${opt_mode} in
  "AutoFDO")
    source ${current_path}/auto_fdo.sh
    ;;
  "AutoPrefetch")
    source ${current_path}/auto_prefetch.sh
    ;;
  "AutoBOLT")
    source ${current_path}/auto_bolt.sh
    ;;
  *)
    echo "[ERROR] Optimization mode ${opt_mode} is not supported, Check the configuration item: opt_mode"
    exit 1
    ;;
  esac
}

# 公共依赖检查项
function check_common_dependency() {
  get_arch=`arch`
  if [[ ${get_arch} =~ "x86_64" || ${get_arch} =~ "aarch64" ]];then
    echo "[INFO] Current arch: ${get_arch}"
  else
    echo "[ERROR] Unsupport arch: ${get_arch}"
    exit 1
  fi
  if ! type perf &>/dev/null; then
    echo "[ERROR] Optimization mode ${opt_mode} but perf is missing, try 'yum install perf'"
    exit 1
  fi
  is_file_exist ${build_script}
  is_file_exist ${run_script}
  is_file_exist "${gcc_path}/bin/gcc"
}

# 拆分编译数据库
function split_option() {
  if [ "$bear_prefix" ];then
        python3 $current_path/split_json.py -i $PWD/compile_commands.json
        mv $PWD/compile_commands.json $PWD/compile_commands_$1.json
        mv $PWD/compile_commands.fail.json $PWD/compile_commands.fail_$1.json
  fi
}

# 使用原始编译选项进行编译
function first_compilation() {
  echo "[INFO] Start raw compilation"
  is_file_exist ${build_script} "build_script"
  if [[ $build_mode =~ "Bear" ]]; then
      bear_prefix="bear -- "
      echo "[INFO] Build in Bear mode"
  else
      echo "[INFO] Build in Wrapper mode"
  fi
  $bear_prefix /bin/bash ${build_script} >> ${log_file} 2>&1
  split_option first
  is_file_exist ${bin_file}
  is_success $?
}

# 创建wrapper之后的操作
function post_create_wrapper() {
  chmod 755 ${gcc_wrapper}/gcc
  chmod 755 ${gcc_wrapper}/g++

  export CC=${gcc_wrapper}/gcc
  export CXX=${gcc_wrapper}/g++
  export LD_LIBRARY_PATH=${gcc_path}/lib64:${LD_LIBRARY_PATH}

  export PATH=${gcc_wrapper}:${PATH}
}

# 执行应用程序执行脚本
function execute_run_script() {
  echo "[INFO] Start to execute the run_script: ${run_script}"
  process_id=$(pgrep -u ${user_name} ${application_name})
  if [[ -n ${process_id} ]]; then
    echo "[ERROR] Application: ${application_name} process already exists. The run_script will not be executed. Please check"
    exit 1
  fi
  is_file_exist ${run_script} "run_script"
  /bin/bash ${run_script}  >> ${log_file} 2>&1 &
  is_success $?
}

# 探测应用进程是否存在
function detect_process() {
  echo "[INFO] Start to detect whether process ${application_name} is started"
  detect_time=0
  while [ -z $(pgrep -u ${user_name} ${application_name}) ]; do
    sleep 1
    ((detect_time = ${detect_time} + 1))
    echo "[INFO] Finding ${application_name}"
    if [[ ${detect_time} -gt ${max_waiting_time} ]]; then
      echo "[ERROR] Process ${application_name} is not found after ${max_waiting_time}. Please check"
      exit 1
    fi
  done
  echo "[INFO] Found Process ${application_name}: $(pgrep -u ${user_name} ${application_name})"
}

# 使用新的编译选项编译，同时判断优化结果.
# 需注意此检查依赖wrapper中编译器后添加第一个编译选项，
# 因此需保证编译器后添加第一个编译选项为优化选项而非通用选项
function second_compilation() {
  echo "[INFO] Try compiling with the new compilation options"
  if [[ ${check_success} -eq 1 ]]; then
    $bear_prefix /bin/bash ${build_script} >> ${log_file} 2>&1 & build_id=$!
    echo "[INFO] Found build id: ${build_id}"
    add_opt=$(cat ${gcc_wrapper}/gcc | awk -F " " '{print $2}')
    build_status=`ps -p ${build_id} | grep -c ${build_id}`
    opt_success=0
    while [[ ${build_status} -ne 0 ]]; do
      if [[ ${opt_success} -eq 0 ]]; then
        # 使用:1去除编译选项左边的'-'
        if [[ $(ps aux | grep -c "${add_opt:1}") -gt 1 ]]; then
          opt_success=1
          break
        fi
      fi
      build_status=`ps -p ${build_id} | grep -c ${build_id}`
    done
    wait
  else
    $bear_prefix /bin/bash ${build_script} >> ${log_file} 2>&1
  fi
  echo "[INFO] Finish compiling with new compilation options"
  split_option second
  is_success $?
}

# 判断上一步执行是否成功
function is_success() {
  pre_result=$1
  if [[ ${pre_result} -eq 1 ]]; then
    echo "[ERROR] Execution failed, please check the log: ${log_file}"
    exit 1
  fi
}

# 检查配置文件脚本是否存在
function is_file_exist() {
  file=$1
  config_item=$2
  if [[ ! -f ${file} ]]; then
    if [[ -n ${config_item} ]]; then
      echo "[ERROR] The file ${file} does not exist. Check the configuration item: ${config_item}"
    else
      echo "[ERROR] The file ${file} does not exist"
    fi
    exit 1
  fi
}

#初始化profile文件夹和log文件
function init_profile_and_log() {
  # Profile和log所在路径
  now_time=$(date '+%Y%m%d-%H%M%S')
  profile_data_path=${work_path}/${now_time}
  log_file=${work_path}/${now_time}/opt.log
  if [[ ! -d ${profile_data_path} ]]; then
    mkdir -p ${profile_data_path}
  fi
  echo "[INFO] Create profile dir: ${profile_data_path}"

  touch ${log_file}
  echo "[INFO] Init log file: ${log_file}"

  # 创建Wrapper所在路径
  gcc_wrapper="${work_path}/${now_time}/gcc_wrapper/"
  mkdir -p ${gcc_wrapper}
}

#检测是否优化成功
function is_opt_success() {
  if [[ ${check_success} -eq 1 ]]; then
    if [[ ${opt_success} -eq 0 ]]; then
      echo "[WARNING] Optimization may fail or the build process is too short, please check!"
      echo "[WARNING] Please try gcc/g++ at: ${gcc_wrapper} instead of the original compiler"
      exit 1
    else
      echo "[INFO] Optimization may success!"
    fi
  fi
  exit 0
}

#执行入口，部分函数为加载不同优化脚本中得到
function main() {
  parse_input_params "$@"
  parse_config
  parse_input_params "$@"
  check_config_item
  init_profile_and_log
  load_script

  check_dependency
  prepare_env
  first_compilation
  execute_run_script
  detect_process
  perf_record

  prepare_new_env
  second_compilation
  is_opt_success
  exit "$?"
}

main "$@"
exit "$?"

```
然后是auto_fdo.sh文件：
```
#!/bin/bash

# 检测依赖软件是否已经安装
function check_dependency() {
  check_common_dependency
  if ! type create_gcov &>/dev/null; then
    echo "[ERROR] Optimization mode ${opt_mode} but autofdo is missing, try 'yum install autofdo'"
    exit 1
  fi
}

# 根据模式选择Wrapper或者Bear模式构建
function  prepare_env() {
  case ${build_mode} in
  "Wrapper")
    create_wrapper
    ;;
  "Bear")
    export COMPILATION_OPTIONS="-g"
    export LINK_OPTIONS="-g"
    ;;
  *)
    echo "[ERROR] Build mode ${build_mode} is not supported, the value is : Wrapper/Bear"
    exit 1
    ;;
  esac
}

# 创建原始wrapper
function create_wrapper() {
  echo "[INFO] Start generating the original wrapper"
  echo "${gcc_path}/bin/gcc -g \"\$@\"" >${gcc_wrapper}/gcc
  echo "${gcc_path}/bin/g++ -g \"\$@\"" >${gcc_wrapper}/g++
  post_create_wrapper
}

# 执行perf采样，生成profile文件
function perf_record() {
  echo "[INFO] Start perf record by ${opt_mode} and generate a profile file"
  process_id=$(pgrep -u ${user_name} ${application_name})
  if [[ ${get_arch} =~ "x86_64" ]];then
    perf_event="br_inst_retired.near_taken:u"
    use_lbr=1
  elif [[ ${get_arch} =~ "aarch64" ]];then
    perf_event="inst_retired:u"
    use_lbr=0
  else
    echo "[ERROR] Unsupport arch: ${get_arch}"
    exit 1
  fi
  perf record -e ${perf_event} -o ${profile_data_path}/${profile_name} -p ${process_id} -- sleep ${perf_time} >> ${log_file} 2>&1
  is_file_exist "${profile_data_path}/${profile_name}"
  create_gcov --binary=${bin_file} --profile=${profile_data_path}/${profile_name} --gcov=${profile_data_path}/${gcov_name} --gcov_version=1 --use_lbr=${use_lbr} >> ${log_file} 2>&1
  is_file_exist "${profile_data_path}/${gcov_name}"
  kill -9 ${process_id}
}

# 根据模式选择Wrapper或者Bear模式构建
function  prepare_new_env() {
  case ${build_mode} in
  "Wrapper")
    create_new_wrapper
    ;;
  "Bear")
    export COMPILATION_OPTIONS="-fauto-profile=${profile_data_path}/${gcov_name}"
    ;;
  *)
    echo "[ERROR] Build mode ${build_mode} is not supported, the value is : Wrapper/Bear"
    exit 1
    ;;
  esac
}

#生成新的wrapper
function create_new_wrapper() {
  echo "[INFO] Start to generate a new wrapper"
  echo "${gcc_path}/bin/gcc -fauto-profile=${profile_data_path}/${gcov_name} \"\$@\"" >${gcc_wrapper}/gcc
  echo "${gcc_path}/bin/g++ -fauto-profile=${profile_data_path}/${gcov_name} \"\$@\"" >${gcc_wrapper}/g++
}

```
### 开始使用
1. 编辑应用构建脚本，A-FOT的目录下创建名为build.sh的文件，写下下面的内容即可
```shell
cd /tmp/openGauss-server
make distclean -sj
./configure --gcc-version=10.3.1 --prefix=$GAUSSHOME --3rd=$BINARYLIBS --enable-thread-safety --with-readline --without-readline CFLAGS="-O2 -g3 -D__USE_NUMA -D__ARM_LSE" --enable-mot CC=g++
make -sj
make install -sj
```
2. 编辑运行脚本，A-FOT的目录下创建名为run.sh的文件，该脚本的写法并不固定，取决于你要怎么运行你的程序并进行采样。一般分为启动数据库、跑tpcc这两部分。
```shell
gs_ctl start -D $GAUSSHOME/data_node #启动数据库
sh /benchmark路径/runBenchmark.sh props.pg #通知客户端跑tpcc
```
以下我贴一下我自己常用的一个运行脚本
```
echo "reset the datanode"
sh /data1/luozihao/reset_env.sh #重置tpcc的环境，即清除现有环境，并用已有的备份进行替换
echo "run start"
numactl -C 1-28,32-60,64-92,96-124 gs_ctl start -D /data1/luozihao/data #用numa启动数据库，如果没有numactl就用yum install -y numactl下载一个
sshpass -p '用户密码' ssh 用户名@客户端ip "sh /benchmark路径/runBenchmark.sh props.pg" #用ssh命令让客户端运行benchmark
echo "run end"
```
其中sshpass是一个用于扩展ssh命令的工具，它可以直接给ssh输入密码从而避免手动输入密码，用root用户下载安装的方法如下所示：
```
wget http://sourceforge.net/projects/sshpass/files/sshpass/1.05/sshpass-1.05.tar.gz 
tar xvzf sshpass-1.05.tar.gz 
cd sshpass-1.05.tar.gz 
./configure 
make 
make install
```
3. 编辑配置文件a-fot.ini文件，如下所示
```
# 应用进程名
application_name=gaussdb
# 二进制安装后可执行文件
bin_file=/tmp/openGauss-server/dest/bin/gaussdb
# 脚本工作目录（用来编译应用程序/存放profile）
work_path=/tmp/a-fot_test/work_path
# 应用构建脚本路径
build_script=/tmp/A-FOT/build.sh
# Benhmark路径及运行命令
run_script=/tmp/A-FOT/run.sh
# 最大二进制启动时间(单位：秒)
max_waiting_time=1000
# 优化模式（AutoFDO、AutoPrefetch、AutoBOLT）
opt_mode=AutoFDO
# Perf采样时长(单位：秒)
perf_time=150
# gcc路径，gcc版本以自己当前三方包中的gcc版本为基准
gcc_path=/tmp/openGauss-third_party_binarylibs_openEuler_arm/buildtools/gcc10.3/gcc
# 检测是否优化成功(1=启用，0=禁用)
check_success=1
# 构建模式 （Bear、Wrapper）
build_mode=Wrapper
# 结束行勿删
```
4. 开始运行
```
./afot --user_name 用户名 --config_file /tmp/A-FOT/a-fot.ini
```