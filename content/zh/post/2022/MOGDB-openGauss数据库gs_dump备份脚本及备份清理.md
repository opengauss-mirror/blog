+++

title =  "MOGDB/openGauss数据库gs dump备份脚本及备份清理" 

date = "2022-1-7" 

tags = [ "MOGDB/openGauss数据库gs dump备份脚本及备份清理"] 

archives = "2022-1" 

author = "阎书利" 

summary = "MOGDB/openGauss数据库gs dump备份脚本及备份清理"

img = "/zh/post/2022/title/img8.png" 

times = "12:30"

+++

# MOGDB/openGauss数据库gs\_dump备份脚本及备份清理<a name="ZH-CN_TOPIC_0000001244017055"></a>

需要对MOGDB/openGauss进行每天逻辑备份。如下脚本分享给大家。

## 一、备份脚本<a name="section426911175616"></a>

-   1.脚本

    ```
    c.sh (可以改名字)
    
    # database dump shell
    # you should change the GAUSSHOME GAUSSPORT GAUSSDATA DUMP_USER DUMP_PASSWORD
    #!/bin/bash
    source /etc/profile
    source /home/omm/.bash_profile
    export GAUSSHOME=/opt/gaussdb/app
    export GAUSSPORT=26000
    export GAUSSDATA=/gaussdb/data/dn1
    export PATH=$PGHOME/bin:$PATH
    DUMP_USER=ysla
    DUMP_PASSWORD='1qaz@WSX'
    CUR_DATE=`date "+%Y-%m-%d-%H%M"`
    dbnamelist=`cat oo.txt`
    
    #Loading DBLIST
    gsql -p ${GAUSSPORT} postgres -c "select datname from pg_database where datname not in ('template1','template0','postgres')" -t | grep -v '^$' >oo.txt
    
    #save directory
    SAVE_BASE_DIR="/gaussdb/dump_dir"
    DAT_FILE_DIR="${SAVE_BASE_DIR}/${CUR_DATE}"
    if [ -d ${DAT_FILE_DIR} ]
     then :
     else
     mkdir -p ${DAT_FILE_DIR}
    fi
    # The real backup step!
    echo "`date "+%Y-%m-%d-%H%M"` begin backup db "
    for dbname in ${dbnamelist}
    do
    gs_dump -E UTF8 ${dbname} -U ${DUMP_USER} -W ${DUMP_PASSWORD} -p ${GAUSSPORT} -F p -f ${DAT_FILE_DIR}/${dbname}_${CUR_DATE}.sql
    gs_dumpall -l ${dbname} -U ${DUMP_USER} -W ${DUMP_PASSWORD} -p ${GAUSSPORT} -g -f ${DAT_FILE_DIR}/global_data_${dbname}_${CUR_DATE}.sql
    done
    tar -cjvf ${DAT_FILE_DIR}.tar.gz /${DAT_FILE_DIR} --remove-files
    echo "`date "+%Y-%m-%d-%H%M"` end backup db "
    ```

    这个脚本需要修改GAUSSHOME GAUSSPORT GAUSSDATA DUMP\_USER DUMP\_PASSWORD这几个（数据库家目录，端口，数据目录，做dump的用户，以及密码），之后直接执行就可以。脚本会自动查询数据库，并把’template1’,'template0’和’postgres’数据库排除掉，然后把其他数据库的数据和全局对象各自备份一份，最后把备份的.sql文件进行压缩。

-   2，脚本执行

    执行结果如下：

    ![](figures/20220107-39368262-8b82-4c5d-973d-c268dab99042.png)

    去备份保存的目录下

    ![](figures/20220107-154aa7ec-6a24-41aa-8fe4-0eee137d0982.png)

    解压一个文件

    ![](figures/20220107-2073c9b3-0749-4d3d-a577-cf9467225d37.png)

    如下数据库的数据保存的文件名格式为（数据库名\_日期时间.sql）

    全局对象保存的文件名格式为（global\_data\_数据库名\_日期时间.sql）

    ![](figures/20220107-6c96183e-8ed2-4eac-840d-6de2b6c9e746.png)

    ![](figures/20220107-62164f26-2335-4465-ad23-47148ecae8a1.png)

    查看数据库对应的数据备份

    ```
    [omm@node1 2022-01-07-1634]$ vim ysla_2022-01-07-1634.sql
    ```

    ![](figures/20220107-ee45e332-8e56-4b07-a765-b1e5ce6df6b9.png)

    查看数据库对应的全局对象备份

    ```
    [omm@node1 2022-01-07-1634]$ vim global_data_ysla_2022-01-07-1634.sql
    ```

    ![](figures/20220107-7b9036fd-66fb-44ff-9ad6-61a878d5940b.png)


## 二、备份脚本加到crontab<a name="section94362416578"></a>

将如下一行加入crontab，让脚本每天凌晨12：30执行，这里的flock是为了防止一个脚本没执行完就到了这个脚本下一次执行的周期，可能会导致并发问题，严重时会导致出现脏数据性能瓶颈等恶性循环，所以使用flock建立排它锁

```
-x 独占锁 -n 直接失败 如发现被锁如就失败不等待，除非解锁
```

```
30 00 * * * /usr/bin/flock -xn /tmp/test.lock -c 'sh /home/omm/c.sh >> c.log'
```

## 三、备份保留，清理<a name="section17174101417017"></a>

每天都进行备份，如果备份天数过多不清理，可能使目录打满，因此需要添加备份清理策略，我这里用的是crontab的方式，每天凌晨3：30清理过期数据。

如下一行加入到crontab里边，也是用了flock，这一行命令会找备份目录下的文件，排除掉隐藏文件，并把30天之前的.tar.gz文件删除。

```
30 03 * * * /usr/bin/flock -xn /tmp/test1.lock -c "find /gaussdb/dump_dir  -not -path '*/\.*' -mtime +30  -type f -name *.tar.gz -exec rm -rf {} \;"
```

