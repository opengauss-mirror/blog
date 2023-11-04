#!/bin/bash

user=${USER}
pwd=${PWD}

function usage()
{
        echo "
Usage: sh $0 -w password
Arguments:
        -w                   login password
        -h, --help           Show this help, then exit
        "
}

default_DSS_NODES_LIST1=17457
default_dms_url_port1=1644
default_port1=12830

default_DSS_NODES_LIST2=17458
default_dms_url_port2=1645
default_port2=13830
declare password
declare default_vg_name=$USER

function info()
{
    echo -e "\033[32m$1\033[0m"
}
 
function error() {
    echo -e "\033[31m$1\033[0m"
}

function CheckVersion()
{
	curdir=$PWD
	cd $GAUSSHOME
	cd ..
	code_base=$PWD
        cd $curdir/DSS
        current_dss_version=$(git rev-parse HEAD)
        #echo $current_dss_version
        path=$code_base/src/gausskernel/ddes/ddes_commit_id
        flags1=$(grep $current_dss_version $path | wc -l)
   
        if [ $flags1 -eq 0 ];then
                echo "The DSS version does not match, please refer to the documentation to roll back the DSS version" && exit 1
        fi
	cd ..
	cd $PWD/DMS
	current_dms_version=$(git rev-parse HEAD)
        #echo $current_dsm_version
        flags2=$(grep $current_dms_version $path | wc -l)

        if [ $flags2 -eq 0 ];then
                echo "The DMS version does not match, please refer to the documentation to roll back the DMS version" && exit 1
        fi
	cd ..
}

function CheckPort3()
{
        port_status=`netstat -ntl|grep $default_DSS_NODES_LIST1 |wc -l`
        if [ $port_status -ge 1 ];then
                echo $default_DSS_NODES_LIST1
                default_DSS_NODES_LIST1=`expr $default_DSS_NODES_LIST1 + 10`
                CheckPort3
        fi
}

function CheckPort4()
{
        port_status=`netstat -ntl|grep $default_DSS_NODES_LIST2 |wc -l`
        if [ $port_status -ge 1 ];then
                echo $default_DSS_NODES_LIST2
                default_DSS_NODES_LIST2=`expr $default_DSS_NODES_LIST2 + 10`
                CheckPort4
        fi
}

function CheckPort5()
{
        port_status=`netstat -ntl|grep $default_dms_url_port1 |wc -l`
        if [ $port_status -ge 1 ];then
                echo $default_dms_url_port1
                default_dms_url_port1=`expr $default_dms_url_port1 + 10`
                CheckPort5
        fi
}

function CheckPort6()
{
        port_status=`netstat -ntl|grep $default_dms_url_port2 |wc -l`
        if [ $port_status -ge 1 ];then
                echo $default_dms_url_port2
                default_dms_url_port2=`expr $default_dms_url_port2 + 10`
                CheckPort6
        fi
}

function CheckPort7()
{
        port_status=`netstat -ntl|grep $default_port1 |wc -l`
        if [ $port_status -ge 1 ];then
                echo $default_port1
                default_port1=`expr $default_port1 + 10`
                CheckPort7
        fi
}

function CheckPort8()
{
        port_status=`netstat -ntl|grep $default_port2 |wc -l`
        if [ $port_status -ge 1 ];then
                echo $default_port2
                default_port2=`expr $default_port2 + 10`
                CheckPort8
        fi
}

function CheckPort()
{
        CheckPort3
        CheckPort4
        CheckPort5
        CheckPort6
        CheckPort7
        CheckPort8
}

function check_os() {
    # check shm
    local shared_buffers=1073741824  # 1G
    local shmmax=$(cat /proc/sys/kernel/shmmax)
    env test $shared_buffers -gt $shmmax && echo "Shared_buffers must be less than shmmax. Please check it." && exit 1

    local shmall=$(cat /proc/sys/kernel/shmall)
    local pagesize=$(getconf PAGESIZE)
    if [ $(($shmall/1024/1024/1024*$pagesize)) -ne 0 ]; then
      if [ $(($shared_buffers/1024/1024/1024-$shmall/1024/1024/1024*$pagesize)) -gt 0 ]; then
        echo "The usage of the device [Shared_buffers] space cannot be greater than shmall*PAGESIZE." && exit 1
      fi
    fi

    # check cpu instruction
    CPU_BIT=$(uname -m)
    if [ X"$CPU_BIT" == X"x86_64" ]; then
        if [ X"$(cat /proc/cpuinfo | grep rdtscp | uniq)" == X"" ]; then
            echo "The cpu instruction rdtscp is missing." && exit 1
        fi
    fi
}

function check_param() {
    if [ X$password == X'' ]; then
        echo "ERROR: The parameter '-w' can not be empty\n"
        usage
        exit 1
    fi

    local -i num=0
    if [ -n "$(echo $password | grep -E --color '^(.*[a-z]+).*$')" ]; then
      let num=$num+1
    fi
    if [ -n "$(echo $password | grep -E --color '^(.*[A-Z]).*$')" ]; then
      let num=$num+1
    fi
    if [ -n "$(echo $password | grep -E --color '^(.*\W).*$')" ]; then
      let num=$num+1
    fi
    if [ -n "$(echo $password | grep -E --color '^(.*[0-9]).*$')" ]; then
      let num=$num+1
    fi
    if [ ${#password} -lt 8 ] || [ $num -lt 3 ]
    then
        echo "Error:passworr must be at least 8 character and at least three kinds"
        exit 1
    fi

    if [ X$user == X"root" ]; then
        echo "Error: can not install openGauss with root"
        exit 1
    fi
    if [ X$port == X"" ]; then
        port=$default_port
    fi
    if [ X$mode == X"master_standby" ]; then
        let slave_port=$port+200
    fi
}

function get_param() {
    ARGS=$(getopt -a -o w:p:h -l multinode,help -- "$@")
    [ $? -ne 0 ] && usage
    eval set -- "${ARGS}"
    while [ $# -gt 0 ]
    do
        case "$1" in
        -w)
            password="$2"
            shift
            ;;
        -p)
            port="$2"
            shift
            ;;
        --multinode)
            mode="master_standby"
            ;;
        -h|--help)
            usage
            exit
            ;;
        --)
            shift
            break
            ;;
        esac
    shift
    done
}


function check()
{
        if [ $? -eq 0 ];then
                echo $(date +%F%n%R) "Execute success"
        else
                echo "Execution of the previous command failed"
                exit 1
        fi
}

function SetEnvironment()
{
        echo $(date +%F%n%R) "Create File $PWD/env and set environment variables"
        local gs_home_env='export GAUSSHOME='$PWD'/openGauss-server/mppdb_temp_install'
        local path_env='export PATH=$GAUSSHOME/bin:$PATH'
        local ld_env='export LD_LIBRARY_PATH=$GAUSSHOME/lib:$LD_LIBRARY_PATH'
        local dss_home_env='export DSS_HOME='$PWD'/dss/dss0/dssdba'
        rm -rf $PWD/env

        touch $PWD/env
        echo $gs_home_env >> $PWD/env
        echo $path_env >> $PWD/env
        echo $ld_env >> $PWD/env
        echo $dss_home_env >> $PWD/env
        echo $(date +%F%n%R) "environment set ...success"
}

function CreateVolume()
{
        echo $(date +%F%n%R) 'Start create block device'
        dd if=/dev/zero of=$PWD/dss/dev/dss-dba bs=2M count=10240 >/dev/null 2>&1
	check
        echo "Create block device，default bs=2M count=10240 size=20G"
}


function ConfigDatabaseNode()
{
        ##创建两个节点
        echo $(date +%F%n%R) 'Start Create Node...'
        rm -rf $PWD/dss/dss0/dssdba/cfg/dss_inst.ini
        rm -rf $PWD/dss/dss1/dssdba/cfg/dss_inst.ini
	rm -rf $PWD/dss/dss0/dssdba/cfg/dss_vg_conf.ini
	rm -rf $PWD/dss/dss1/dssdba/cfg/dss_vg_conf.ini

        touch $PWD/dss/dss0/dssdba/cfg/dss_inst.ini
        echo "INST_ID=0
        _LOG_LEVEL=255
        DSS_NODES_LIST=0:***.***.***.***:$default_DSS_NODES_LIST1,1:***.***.***.***:$default_DSS_NODES_LIST2
        DISK_LOCK_FILE_PATH=$PWD/dss/dss0
        LSNR_PATH=$PWD/dss/dss0
       _LOG_MAX_FILE_SIZE=20M
       _LOG_BACKUP_FILE_COUNT=128" >> $PWD/dss/dss0/dssdba/cfg/dss_inst.ini

       touch $PWD/dss/dss0/dssdba/cfg/dss_vg_conf.ini
       echo "$default_vg_name:$PWD/dss/dev/dss-dba" >> $PWD/dss/dss0/dssdba/cfg/dss_vg_conf.ini

       touch $PWD/dss/dss1/dssdba/cfg/dss_inst.ini
        echo "INST_ID=1
        _LOG_LEVEL=255
        DSS_NODES_LIST=0:***.***.***.***:$default_DSS_NODES_LIST1,1:***.***.***.***:$default_DSS_NODES_LIST2
        DISK_LOCK_FILE_PATH=$PWD/dss/dss0
        LSNR_PATH=$PWD/dss/dss1
       _LOG_MAX_FILE_SIZE=20M
       _LOG_BACKUP_FILE_COUNT=128" >> $PWD/dss/dss1/dssdba/cfg/dss_inst.ini

       touch $PWD/dss/dss1/dssdba/cfg/dss_vg_conf.ini
       echo "$default_vg_name:$PWD/dss/dev/dss-dba" >> $PWD/dss/dss1/dssdba/cfg/dss_vg_conf.ini

}

function StartDssserver()
{
        echo $(date +%F%n%R) 'Start dssserver'
	info "Create volume and volume group"
        dsscmd cv -g $default_vg_name -v $PWD/dss/dev/dss-dba
	check
	info "dss server1 "
        dssserver -D $PWD/dss/dss0/dssdba & > file.txt 2>&1
	flags1=$(grep failed $PWD/file.txt | wc -l)
	if [ $flags1 -ne 0 ];then
		error "Failed to start dss1" && exit 1
	fi
        #上个命令显示DSS SERVER STARTED即为成功
	info "dss server2"
        dssserver -D $PWD/dss/dss1/dssdba & > file.txt 2>&1
	flags2=$(grep failed $PWD/file.txt | wc -l)
        if [ $flags2 -ne 0 ];then
                error "Failed to start dss2" && exit 1
        fi
	check
	sleep 3
        #上个命令显示DSS SERVER STARTED即为成功
}


function InitDb()
{
        echo $(date +%F%n%R) "Init node1 and node2"
        mkdir -p $PWD/data
	info "start gs_initdb node1"
        gs_initdb -D $PWD/data/node1 --nodename=node1 -U $USER -w $password --vgname=+$USER --enable-dss --dms_url="0:***.***.***.***:$default_dms_url_port1,1:***.***.***.***:$default_dms_url_port2" -I 0 --socketpath='UDS:'$PWD'/dss/dss0/.dss_unix_d_socket'
	info "echo node1 information"
        echo "ss_enable_ssl = off
        listen_addresses = '*'
        port=$default_port1
        ss_enable_reform = off
        ss_work_thread_count = 32
        enable_segment = on
        ss_log_level = 255
        ss_log_backup_file_count = 100
        ss_log_max_file_size = 1GB
        " >> $PWD/data/node1/postgresql.conf

        sed '91 ahost       all        all         ***.***.***.***/0        sha256' -i $PWD/data/node1/pg_hba.conf
	info "gs_initdb node2"
        gs_initdb -D $PWD/data/node2 --nodename=node2 -U $USER -w $password --vgname=+$USER --enable-dss --dms_url="0:***.***.***.***:$default_dms_url_port1,1:***.***.***.***:$default_dms_url_port2" -I 1 --socketpath='UDS:'$PWD'/dss/dss1/.dss_unix_d_socket'
	check

        echo "ss_enable_ssl = off
        listen_addresses = '*'
        port=$default_port2
        ss_enable_reform = off
        ss_work_thread_count = 32
        enable_segment = on
        ss_log_level = 255
        ss_log_backup_file_count = 100
        ss_log_max_file_size = 1GB
        " >> $PWD/data/node2/postgresql.conf

        sed '91 ahost       all        all         ***.***.***.***/0        sha256' -i $PWD/data/node2/pg_hba.conf

}

function StartDb()
{
        echo $(date +%F%n%R) "Start node1 ans node2"
        gs_ctl start -D $PWD/data/node1
        gs_ctl start -D $PWd/data/node2
}

function main()
{
	rm -rf $PWD/dss
	rm -rf $PWD/data
	get_param $@
	check_param
	CheckPort
	check_os
	CheckVersion
        SetEnvironment
        mkdir -p dss/dss0/dssdba/cfg
        mkdir -p dss/dss0/dssdba/log
        mkdir -p dss/dss1/dssdba/cfg
        mkdir -p dss/dss1/dssdba/log
        mkdir -p dss/dev
        CreateVolume
        ConfigDatabaseNode
        source $PWD/env
        StartDssserver
	check
        InitDb
        #StartDb
}
main $@