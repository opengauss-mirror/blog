---
title: 'openGauss中使用gs_initdb时保留旧配置'
date: '2021-01-26'
category: 'blog'
tags: ['openGauss使用增强']
archives: '2021-01'
author: 'cchen676'
summary: 'openGauss中使用gs_initdb时保留旧配置'
img: '/zh/blogs/cchen676/title/img26.png'
times: '16:30'
---

# openGauss 中使用 gs_initdb 时保留旧配置

## 一、使用场景

该需求来源于社区 issue: [重建库脚本](https://gitee.com/opengauss/openGauss-server/issues/I26TPF?from=project-issue)。

> 在开发过程中，可能会修改系统表，或者各种 debug 情况下导致的库坏掉的情况，建议增加一种重建数据库的脚本。

当前可以通过重新安装或 gs_initdb 建一个新库解决该问题，但用户觉得重装比较麻烦，而使用 gs_initdb 的话因为需要指定一个全新的空目录作为新的数据目录，如果原始是用 OM 安装的数据库，默认启用了 SSL，这时用 gs_initdb 新建的库目录下没有 SSL 相关配置，启动就会失败，需要手动把原来的 SSL 相关证书文件再拷贝过来。

为方便有该需求的用户使用，写了一个脚本，可以指定旧的数据目录，调用 gs_initdb 后，自动把旧数据目录下的配置文件拷贝到新目录下面

## 二、脚本说明

使用说明如下：

1. 上传到数据库用户的目录下，比如`/home/omm`;

2. 添加执行权限 `chmod +x gs_initdb_withconf.sh`;

3. 执行前导一下环境变量，确保 gs_initdb 可以正常执行，如果是环境变量分离安装的方式，也需要 source 一下，比如 `source ~/.bashrc` 或自定义的环境变量;

4. 执行方式为 `_./gs_initdb_withconf.sh -o old_data_dir new_data_dir --nodename=example_node_`;

5. 其实在`-o old_data_dir` 之后的参数即 gs_initdb 的参数，会直接传给 gs_initdb;

```
#!/bin/bash
#-------------------------------------------------------------------------
#
# gs_initdb_withconf.sh
#    script to initdb with ability to backup and restore the old configuration files
#
#-------------------------------------------------------------------------
#######################################################################
## print help information
#######################################################################
function print_help()
{
    echo "Usage:
  gs_initdb_withconf [-o OLDDDATADIR] [OPTION]... [DATADIR]

Options:
  -A, --auth=METHOD         default authentication method for local connections
      --auth-host=METHOD    default authentication method for local TCP/IP connections
      --auth-local=METHOD   default authentication method for local-socket connections
 [-D, --pgdata=]DATADIR     location for this database cluster
      --nodename=NODENAME   name of single node initialized
  -E, --encoding=ENCODING   set default encoding for new databases
      --locale=LOCALE       set default locale for new databases
      --dbcompatibility=DBCOMPATIBILITY   set default dbcompatibility for new database
      --lc-collate=, --lc-ctype=, --lc-messages=LOCALE
      --lc-monetary=, --lc-numeric=, --lc-time=LOCALE
                            set default locale in the respective category for
                            new databases (default taken from environment)
      --no-locale           equivalent to --locale=C
      --pwfile=FILE         read password for the new system admin from file
  -T, --text-search-config=CFG
                            default text search configuration
  -U, --username=NAME       database system admin name
  -W, --pwprompt            prompt for a password for the new system admin
  -w, --pwpasswd=PASSWD     get password from command line for the new system admin
  -C, --enpwdfiledir=DIR    get encrypted password of AES128 from cipher and rand file
  -X, --xlogdir=XLOGDIR     location for the transaction log directory
  -S, --security            remove normal user's privilege on public schema in security mode

Less commonly used options:
  -d, --debug               generate lots of debugging output
  -L DIRECTORY              where to find the input files
  -n, --noclean             do not clean up after errors
  -s, --show                show internal settings
  -o, --olddir              set the old data directory for backup and restore the old configuration file and cert file

Other options:
  -H, --host-ip             node_host of Postgres-XC node initialized
  -V, --version             output version information, then exit
  -h, --help                show this help, then exit
"
}

if [ $# = 0 ] ; then
    echo "missing option"
    print_help
    exit 1
fi

para_for_initdb_t=$*
new_data_dir=""

while [ $# -gt 0 ]; do
    case "$1" in
        -h|--help)
            print_help
            exit 1
            ;;
        -o|--olddir)
            if [ "$2"X = X ]; then
                echo "no given the old data directory values"
                exit 1
            fi
            old_data_dir=$2
            shift 2
            ;;
        -D)
            if [ "$2"X = X ]; then
                echo "no given the new data directory values"
                exit 1
            fi
            new_data_dir=$2
            shift 2
            ;;
        --pgdata=*)
            tmp=$1
            if [ ${tmp/--pgdata=/}X = X ]; then
                echo "no given the new data directory values"
                exit 1
            fi
            new_data_dir=${tmp/--pgdata=/}
            shift 1
            ;;
        -X)
            if [ "$2"X = X ]; then
                echo "no given the new xlog directory values"
                exit 1
            fi
            shift 2
            ;;
        -C)
            if [ "$2"X = X ]; then
                echo "no given the new AES128 encrypted password directory values"
                exit 1
            fi
            shift 2
            ;;
        -L)
            if [ "$2"X = X ]; then
                echo "no given the new shared directory values"
                exit 1
            fi
            shift 2
            ;;
        /*)
            if [ "${new_data_dir}"X = X ]; then
                new_data_dir=$1
            fi
            shift 1
            ;;
        *)
            shift 1
    esac
done

if [ "${old_data_dir}"X = X ]; then
    echo "no given the old data directory values"
    exit 1
fi
if [ "${new_data_dir}"X = X ]; then
    echo "no given the new date directory values"
    exit 1
fi
if [ ! -d "${old_data_dir}" ]; then
    echo "the old data directory doesn't exist!"
    exit 1
fi

para_for_initdb=${para_for_initdb_t/-o ${old_data_dir}/}

if [ "${para_for_initdb}"X = X ]; then
    echo "no given the parameters of gs_initdb, exit"
    exit 1
fi

declare -a file_list=("cacert.pem" "server.crt" "server.key" "server.key.cipher" "server.key.rand" \
            "postgresql.conf" "mot.conf" "pg_ident.conf" "pg_hba.conf")
declare -a new_file_list

function check_file()
{
    for e in ${file_list[@]}
    do
        if [ ! -f "${old_data_dir}/$e" ]; then
            echo "${old_data_dir}/$e doesn't exist! Will not copy it!"
            continue
        fi
        new_file_list[${#new_file_list[*]}]=${old_data_dir}/$e
    done
}

function copy_file()
{
    for e in ${new_file_list[@]}
    do
        cp -p $e ${new_data_dir}
        if [ $? -ne 0 ]; then
            echo "copy $e to ${new_data_dir} failed."
        fi
    done
}

check_file
which gs_initdb >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "can't find gs_initdb command. please import the env first!"
fi
gs_initdb ${para_for_initdb}
if [ $? -ne 0 ]; then
    echo "gs_initdb failed! exit!"
    exit 1
fi
copy_file
echo "run gs_initdb_withconf finished!"

```
