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
