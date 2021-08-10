+++

title =  "openGauss逻辑备份及恢复" 

date = "2021-08-07" 

tags = [ "openGauss逻辑备份及恢复"] 

archives = "2021-08" 

author = "Walrus" 

summary = "openGauss逻辑备份及恢复"

img = "/zh/post/July/title/img3.png" 

times = "12:30"

+++

# openGauss逻辑备份及恢复<a name="ZH-CN_TOPIC_0000001127157814"></a>

## gs\_dumpall<a name="section1969714812217"></a>

1.  背景信息

    -   gs\_dumpall是openGauss用于导出所有数据库相关信息工具，它可以导出openGauss数据库的所有数据，包括默认数据库postgres的数据、自定义数据库的数据、以及openGauss所有数据库公共的全局对象。
    -   gs\_dumpall工具由操作系统用户omm执行。
    -   gs\_dumpall工具在进行数据导出时，其他用户可以访问openGauss数据库（读或写）。
    -   gs\_dumpall工具支持导出完整一致的数据。例如，T1时刻启动gs\_dumpall导出openGauss数据库，那么导出数据结果将会是T1时刻该openGauss数据库的数据状态，T1时刻之后对openGauss的修改不会被导出。
    -   gs\_dumpall在导出openGauss所有数据库时分为两部分：
    -   gs\_dumpall自身对所有数据库公共的全局对象进行导出，包括有关数据库用户和组，表空间以及属性（例如，适用于数据库整体的访问权限）信息。
    -   gs\_dumpall通过调用gs\_dump来完成openGauss中各数据库的SQL脚本文件导出，该脚本文件包含将数据库恢复为其保存时的状态所需要的全部SQL语句。

    以上两部分导出的结果为纯文本格式的SQL脚本文件，使用gsql运行该脚本文件可以恢复openGauss数据库。

2.  实验过程

    ```
    gs_dumpall -p 15400 -f home/omm/opengauss_39_back.sql
    [omm@wzsy01 ~]$ gs_dumpall -p 15400 -f home/omm/opengauss_39_back.sql
    gs_dump[port='15400'][dbname='chnbs'][2021-07-27 15:38:06]: The total objects number is 1948.
    gs_dump[port='15400'][dbname='chnbs'][2021-07-27 15:38:07]: [100.00%] 1948 objects have been dumped.
    gs_dump[port='15400'][dbname='chnbs'][2021-07-27 15:38:29]: dump database dbname='chnbs' successfully
    gs_dump[port='15400'][dbname='chnbs'][2021-07-27 15:38:29]: total time: 25678  ms
    gs_dump[port='15400'][dbname='mydb'][2021-07-27 15:38:31]: The total objects number is 1166.
    gs_dump[port='15400'][dbname='mydb'][2021-07-27 15:38:31]: [100.00%] 1166 objects have been dumped.
    gs_dump[port='15400'][dbname='mydb'][2021-07-27 15:38:42]: dump database dbname='mydb' successfully
    gs_dump[port='15400'][dbname='mydb'][2021-07-27 15:38:42]: total time: 13215  ms
    gs_dump[port='15400'][dbname='postgres'][2021-07-27 15:38:43]: The total objects number is 434.
    gs_dump[port='15400'][dbname='postgres'][2021-07-27 15:38:43]: [100.00%] 434 objects have been dumped.
    gs_dump[port='15400'][dbname='postgres'][2021-07-27 15:38:43]: dump database dbname='postgres' successfully
    gs_dump[port='15400'][dbname='postgres'][2021-07-27 15:38:43]: total time: 584  ms
    gs_dump[port='15400'][dbname='vzoom'][2021-07-27 15:38:46]: The total objects number is 1947.
    gs_dump[port='15400'][dbname='vzoom'][2021-07-27 15:38:47]: [100.00%] 1947 objects have been dumped.
    gs_dump[port='15400'][dbname='vzoom'][2021-07-27 15:39:10]: dump database dbname='vzoom' successfully
    gs_dump[port='15400'][dbname='vzoom'][2021-07-27 15:39:10]: total time: 27453  ms
    gs_dumpall[port='15400'][2021-07-27 15:39:10]: dumpall operation successful
    gs_dumpall[port='15400'][2021-07-27 15:39:10]: total time: 67481  ms
    ```

    gs\_dumpall详细参数说请见官方文档：https://opengauss.org/zh/docs/1.1.0/docs/Toolreference/gs\_dumpall.html


## gs\_dump<a name="section2284839162317"></a>

1.  背景信息
    -   gs\_dump是openGauss用于导出数据库相关信息的工具，用户可以自定义导出一个数据库或其中的对象（模式、表、视图等）。支持导出的数据库可以是默认数据库postgres，也可以是自定义数据库。
    -   gs\_dump工具由操作系统用户omm执行。
    -   gs\_dump工具在进行数据导出时，其他用户可以访问openGauss数据库（读或写）。
    -   gs\_dump工具支持导出完整一致的数据。例如，T1时刻启动gs\_dump导出A数据库，那么导出数据结果将会是T1时刻A数据库的数据状态，T1时刻之后对A数据库的修改不会被导出。
    -   gs\_dump支持将数据库信息导出至纯文本格式的SQL脚本文件或其他归档文件中。
    -   纯文本格式的SQL脚本文件：包含将数据库恢复为其保存时的状态所需的SQL语句。通过gsql运行该SQL脚本文件，可以恢复数据库。即使在其他主机和其他数据库产品上，只要对SQL脚本文件稍作修改，也可以用来重建数据库。
    -   归档格式文件：包含将数据库恢复为其保存时的状态所需的数据，可以是tar格式、目录归档格式或自定义归档格式。该导出结果必须与gs\_restore配合使用来恢复数据库，gs\_restore工具在导入时，系统允许用户选择需要导入的内容，甚至可以在导入之前对等待导入的内容进行排序。

2.  实验过程

    -   二进制备份chnbs数据库

        ```
        gs_dump -p 15400 chnbs -F c -f home/omm/chnbs.binary
        ```

    -   sql文本导出chnbs数据库

        ```
        gs_dump -p 15400 chnbs -f home/omm/chnbs.sql
        ```

    -   tar包备份chnbs数据库

        ```
        gs_dump -p 15400 chnbs -F t -f home/omm/chnbs.tar
        ```

    -   文件夹备份chnbs数据库

        ```
        gs_dump -p 15400 chnbs -F d -f home/omm/chnbs
        ```

    -   sql文本导出chnbs数据库下名为salene的schema

        ```
        gs_dump -p 15400 chnbs -n salene -f home/omm/chnbs_salene.sql
        ```

    -   二进制备份chnbs数据库下名为salene的schema

        ```
        gs_dump -p 15400 chnbs -n salene -F c -f home/omm/chnbs_salene.binary
        ```

    综合备份出的文件，二进制备份压缩比最高，实验过程中最高达到1:13，tar包备份和sql文本备份无压缩。

    ```
    [omm@wzsy01 ~]$ gs_dump -p 15400 chnbs -F c -f home/omm/chnbs.binary
    gs_dump[port='15400'][chnbs][2021-07-27 15:40:26]: The total objects number is 1948.
    gs_dump[port='15400'][chnbs][2021-07-27 15:40:27]: [100.00%] 1948 objects have been dumped.
    gs_dump[port='15400'][chnbs][2021-07-27 15:40:51]: dump database chnbs successfully
    gs_dump[port='15400'][chnbs][2021-07-27 15:40:51]: total time: 27629  ms
    [omm@wzsy01 ~]$ ls -lh
    -rw-------  1 omm dbgrp  72M Jul 27 15:40 chnbs.binary
    [omm@wzsy01 ~]$ gs_dump -p 15400 chnbs -f home/omm/chnbs.sql
    gs_dump[port='15400'][chnbs][2021-07-27 15:41:25]: The total objects number is 1948.
    gs_dump[port='15400'][chnbs][2021-07-27 15:41:26]: [100.00%] 1948 objects have been dumped.
    gs_dump[port='15400'][chnbs][2021-07-27 15:41:46]: dump database chnbs successfully
    gs_dump[port='15400'][chnbs][2021-07-27 15:41:46]: total time: 24089  ms
    [omm@wzsy01 ~]$ ls -lh
    -rw-------  1 omm dbgrp  72M Jul 27 15:40 chnbs.binary
    -rw-------  1 omm dbgrp 904M Jul 27 15:41 chnbs.sql
    [omm@wzsy01 ~]$ gs_dump -p 15400 chnbs -F t -f home/omm/chnbs.tar
    gs_dump[port='15400'][chnbs][2021-07-27 15:42:54]: The total objects number is 1948.
    gs_dump[port='15400'][chnbs][2021-07-27 15:42:56]: [100.00%] 1948 objects have been dumped.
    gs_dump[port='15400'][chnbs][2021-07-27 15:43:17]: dump database chnbs successfully
    gs_dump[port='15400'][chnbs][2021-07-27 15:43:17]: total time: 25627  ms
    [omm@wzsy01 ~]$ ls -lh
    -rw-------  1 omm dbgrp  72M Jul 27 15:40 chnbs.binary
    -rw-------  1 omm dbgrp 904M Jul 27 15:41 chnbs.sql
    -rw-------  1 omm dbgrp 907M Jul 27 15:43 chnbs.tar
    [omm@wzsy01 ~]$ gs_dump -p 15400 chnbs -F d -f home/omm/chnbs
    gs_dump[port='15400'][chnbs][2021-07-27 15:44:12]: The total objects number is 1948.
    gs_dump[port='15400'][chnbs][2021-07-27 15:44:13]: [100.00%] 1948 objects have been dumped.
    gs_dump[port='15400'][chnbs][2021-07-27 15:44:34]: dump database chnbs successfully
    gs_dump[port='15400'][chnbs][2021-07-27 15:44:34]: total time: 24484  ms
    [omm@wzsy01 ~]$ ls -lh
    drwx------  2 omm dbgrp  12K Jul 27 15:44 chnbs
    -rw-------  1 omm dbgrp  72M Jul 27 15:40 chnbs.binary
    -rw-------  1 omm dbgrp 904M Jul 27 15:41 chnbs.sql
    -rw-------  1 omm dbgrp 907M Jul 27 15:43 chnbs.tar
    [omm@wzsy01 ~]$ du -sh chnbs
    92M  chnbs
    [omm@wzsy01 ~]$ cd chnbs/
    [omm@wzsy01 chnbs]$ ls
    7292.dat.gz  7324.dat.gz  7356.dat.gz  7388.dat.gz  7420.dat.gz  7452.dat.gz  7485.dat.gz  7517.dat.gz  7549.dat.gz  7581.dat.gz  7613.dat.gz  7645.dat.gz  7677.dat.gz  7710.dat.gz  7742.dat.gz
    7293.dat.gz  7325.dat.gz  7357.dat.gz  7389.dat.gz  7421.dat.gz  7453.dat.gz  7486.dat.gz  7518.dat.gz  7550.dat.gz  7582.dat.gz  7614.dat.gz  7646.dat.gz  7678.dat.gz  7711.dat.gz  7743.dat.gz
    7294.dat.gz  7326.dat.gz  7358.dat.gz  7390.dat.gz  7422.dat.gz  7454.dat.gz  7487.dat.gz  7519.dat.gz  7551.dat.gz  7583.dat.gz  7615.dat.gz  7647.dat.gz  7679.dat.gz  7712.dat.gz  7744.dat.gz
    7295.dat.gz  7327.dat.gz  7359.dat.gz  7391.dat.gz  7423.dat.gz  7455.dat.gz  7488.dat.gz  7520.dat.gz  7552.dat.gz  7584.dat.gz  7616.dat.gz  7648.dat.gz  7680.dat.gz  7713.dat.gz  7745.dat.gz
    7296.dat.gz  7328.dat.gz  7360.dat.gz  7392.dat.gz  7424.dat.gz  7456.dat.gz  7489.dat.gz  7521.dat.gz  7553.dat.gz  7585.dat.gz  7617.dat.gz  7649.dat.gz  7681.dat.gz  7714.dat.gz  7746.dat.gz
    7297.dat.gz  7329.dat.gz  7361.dat.gz  7393.dat.gz  7425.dat.gz  7457.dat.gz  7490.dat.gz  7522.dat.gz  7554.dat.gz  7586.dat.gz  7618.dat.gz  7650.dat.gz  7682.dat.gz  7715.dat.gz  7747.dat.gz
    7298.dat.gz  7330.dat.gz  7362.dat.gz  7394.dat.gz  7426.dat.gz  7458.dat.gz  7491.dat.gz  7523.dat.gz  7555.dat.gz  7587.dat.gz  7619.dat.gz  7651.dat.gz  7683.dat.gz  7716.dat.gz  7748.dat.gz
    7299.dat.gz  7331.dat.gz  7363.dat.gz  7395.dat.gz  7427.dat.gz  7459.dat.gz  7492.dat.gz  7524.dat.gz  7556.dat.gz  7588.dat.gz  7620.dat.gz  7652.dat.gz  7684.dat.gz  7717.dat.gz  7749.dat.gz
    7300.dat.gz  7332.dat.gz  7364.dat.gz  7396.dat.gz  7428.dat.gz  7460.dat.gz  7493.dat.gz  7525.dat.gz  7557.dat.gz  7589.dat.gz  7621.dat.gz  7653.dat.gz  7685.dat.gz  7718.dat.gz  7750.dat.gz
    7301.dat.gz  7333.dat.gz  7365.dat.gz  7397.dat.gz  7429.dat.gz  7462.dat.gz  7494.dat.gz  7526.dat.gz  7558.dat.gz  7590.dat.gz  7622.dat.gz  7654.dat.gz  7686.dat.gz  7719.dat.gz  7751.dat.gz
    7302.dat.gz  7334.dat.gz  7366.dat.gz  7398.dat.gz  7430.dat.gz  7463.dat.gz  7495.dat.gz  7527.dat.gz  7559.dat.gz  7591.dat.gz  7623.dat.gz  7655.dat.gz  7687.dat.gz  7720.dat.gz  7752.dat.gz
    7303.dat.gz  7335.dat.gz  7367.dat.gz  7399.dat.gz  7431.dat.gz  7464.dat.gz  7496.dat.gz  7528.dat.gz  7560.dat.gz  7592.dat.gz  7624.dat.gz  7656.dat.gz  7688.dat.gz  7721.dat.gz  7753.dat.gz
    7304.dat.gz  7336.dat.gz  7368.dat.gz  7400.dat.gz  7432.dat.gz  7465.dat.gz  7497.dat.gz  7529.dat.gz  7561.dat.gz  7593.dat.gz  7625.dat.gz  7657.dat.gz  7689.dat.gz  7722.dat.gz  7754.dat.gz
    7305.dat.gz  7337.dat.gz  7369.dat.gz  7401.dat.gz  7433.dat.gz  7466.dat.gz  7498.dat.gz  7530.dat.gz  7562.dat.gz  7594.dat.gz  7626.dat.gz  7658.dat.gz  7690.dat.gz  7723.dat.gz  7755.dat.gz
    7306.dat.gz  7338.dat.gz  7370.dat.gz  7402.dat.gz  7434.dat.gz  7467.dat.gz  7499.dat.gz  7531.dat.gz  7563.dat.gz  7595.dat.gz  7627.dat.gz  7659.dat.gz  7691.dat.gz  7724.dat.gz  7756.dat.gz
    7307.dat.gz  7339.dat.gz  7371.dat.gz  7403.dat.gz  7435.dat.gz  7468.dat.gz  7500.dat.gz  7532.dat.gz  7564.dat.gz  7596.dat.gz  7628.dat.gz  7660.dat.gz  7692.dat.gz  7725.dat.gz  7757.dat.gz
    7308.dat.gz  7340.dat.gz  7372.dat.gz  7404.dat.gz  7436.dat.gz  7469.dat.gz  7501.dat.gz  7533.dat.gz  7565.dat.gz  7597.dat.gz  7629.dat.gz  7661.dat.gz  7693.dat.gz  7726.dat.gz  7758.dat.gz
    7309.dat.gz  7341.dat.gz  7373.dat.gz  7405.dat.gz  7437.dat.gz  7470.dat.gz  7502.dat.gz  7534.dat.gz  7566.dat.gz  7598.dat.gz  7630.dat.gz  7662.dat.gz  7694.dat.gz  7727.dat.gz  7759.dat.gz
    7310.dat.gz  7342.dat.gz  7374.dat.gz  7406.dat.gz  7438.dat.gz  7471.dat.gz  7503.dat.gz  7535.dat.gz  7567.dat.gz  7599.dat.gz  7631.dat.gz  7663.dat.gz  7696.dat.gz  7728.dat.gz  dir.lock
    7311.dat.gz  7343.dat.gz  7375.dat.gz  7407.dat.gz  7439.dat.gz  7472.dat.gz  7504.dat.gz  7536.dat.gz  7568.dat.gz  7600.dat.gz  7632.dat.gz  7664.dat.gz  7697.dat.gz  7729.dat.gz  toc.dat
    7312.dat.gz  7344.dat.gz  7376.dat.gz  7408.dat.gz  7440.dat.gz  7473.dat.gz  7505.dat.gz  7537.dat.gz  7569.dat.gz  7601.dat.gz  7633.dat.gz  7665.dat.gz  7698.dat.gz  7730.dat.gz
    7313.dat.gz  7345.dat.gz  7377.dat.gz  7409.dat.gz  7441.dat.gz  7474.dat.gz  7506.dat.gz  7538.dat.gz  7570.dat.gz  7602.dat.gz  7634.dat.gz  7666.dat.gz  7699.dat.gz  7731.dat.gz
    7314.dat.gz  7346.dat.gz  7378.dat.gz  7410.dat.gz  7442.dat.gz  7475.dat.gz  7507.dat.gz  7539.dat.gz  7571.dat.gz  7603.dat.gz  7635.dat.gz  7667.dat.gz  7700.dat.gz  7732.dat.gz
    7315.dat.gz  7347.dat.gz  7379.dat.gz  7411.dat.gz  7443.dat.gz  7476.dat.gz  7508.dat.gz  7540.dat.gz  7572.dat.gz  7604.dat.gz  7636.dat.gz  7668.dat.gz  7701.dat.gz  7733.dat.gz
    7316.dat.gz  7348.dat.gz  7380.dat.gz  7412.dat.gz  7444.dat.gz  7477.dat.gz  7509.dat.gz  7541.dat.gz  7573.dat.gz  7605.dat.gz  7637.dat.gz  7669.dat.gz  7702.dat.gz  7734.dat.gz
    7317.dat.gz  7349.dat.gz  7381.dat.gz  7413.dat.gz  7445.dat.gz  7478.dat.gz  7510.dat.gz  7542.dat.gz  7574.dat.gz  7606.dat.gz  7638.dat.gz  7670.dat.gz  7703.dat.gz  7735.dat.gz
    7318.dat.gz  7350.dat.gz  7382.dat.gz  7414.dat.gz  7446.dat.gz  7479.dat.gz  7511.dat.gz  7543.dat.gz  7575.dat.gz  7607.dat.gz  7639.dat.gz  7671.dat.gz  7704.dat.gz  7736.dat.gz
    7319.dat.gz  7351.dat.gz  7383.dat.gz  7415.dat.gz  7447.dat.gz  7480.dat.gz  7512.dat.gz  7544.dat.gz  7576.dat.gz  7608.dat.gz  7640.dat.gz  7672.dat.gz  7705.dat.gz  7737.dat.gz
    7320.dat.gz  7352.dat.gz  7384.dat.gz  7416.dat.gz  7448.dat.gz  7481.dat.gz  7513.dat.gz  7545.dat.gz  7577.dat.gz  7609.dat.gz  7641.dat.gz  7673.dat.gz  7706.dat.gz  7738.dat.gz
    7321.dat.gz  7353.dat.gz  7385.dat.gz  7417.dat.gz  7449.dat.gz  7482.dat.gz  7514.dat.gz  7546.dat.gz  7578.dat.gz  7610.dat.gz  7642.dat.gz  7674.dat.gz  7707.dat.gz  7739.dat.gz
    7322.dat.gz  7354.dat.gz  7386.dat.gz  7418.dat.gz  7450.dat.gz  7483.dat.gz  7515.dat.gz  7547.dat.gz  7579.dat.gz  7611.dat.gz  7643.dat.gz  7675.dat.gz  7708.dat.gz  7740.dat.gz
    7323.dat.gz  7355.dat.gz  7387.dat.gz  7419.dat.gz  7451.dat.gz  7484.dat.gz  7516.dat.gz  7548.dat.gz  7580.dat.gz  7612.dat.gz  7644.dat.gz  7676.dat.gz  7709.dat.gz  7741.dat.gz
    
    
    [omm@wzsy01 ~]$ gs_dump -p 15400 chnbs -n salene -f home/omm/chnbs_salene.sql
    gs_dump[port='15400'][chnbs][2021-07-27 15:48:34]: The total objects number is 1158.
    gs_dump[port='15400'][chnbs][2021-07-27 15:48:35]: [100.00%] 1158 objects have been dumped.
    gs_dump[port='15400'][chnbs][2021-07-27 15:48:45]: dump database chnbs successfully
    gs_dump[port='15400'][chnbs][2021-07-27 15:48:45]: total time: 12182  ms
    [omm@wzsy01 ~]$ gs_dump -p 15400 chnbs -n salene -F c -f home/omm/chnbs_salene.binary
    gs_dump[port='15400'][chnbs][2021-07-27 15:49:05]: The total objects number is 1158.
    gs_dump[port='15400'][chnbs][2021-07-27 15:49:05]: [100.00%] 1158 objects have been dumped.
    gs_dump[port='15400'][chnbs][2021-07-27 15:49:15]: dump database chnbs successfully
    gs_dump[port='15400'][chnbs][2021-07-27 15:49:15]: total time: 12375  ms
    [omm@wzsy01 ~]$ ls -l chnbs*
    -rw------- 1 omm dbgrp  74573357 Jul 27 15:40 chnbs.binary
    -rw------- 1 omm dbgrp  34597228 Jul 27 15:49 chnbs_salene.binary
    -rw------- 1 omm dbgrp 456398816 Jul 27 15:48 chnbs_salene.sql
    -rw------- 1 omm dbgrp 947593784 Jul 27 15:41 chnbs.sql
    -rw------- 1 omm dbgrp 950491648 Jul 27 15:43 chnbs.tar
    ```


gs\_dump其他详细参数请参看官方文档：https://opengauss.org/zh/docs/1.1.0/docs/Toolreference/gs\_dump.html

## gs\_restore<a name="section1351020719272"></a>

1.  背景信息

    gs\_restore是openGauss提供的针对gs\_dump导出数据的导入工具。通过此工具可将由gs\_dump生成的导出文件进行导入。

    gs\_restore工具由操作系统用户omm执行。

    主要功能包含：

    -   导入到数据库

        如果连接参数中指定了数据库，则数据将被导入到指定的数据库中。其中，并行导入必须指定连接的密码。

    -   导入到脚本文件

        如果未指定导入数据库，则创建包含重建数据库所必须的SQL语句脚本并写入到文件或者标准输出。等效于直接使用gs\_dump导出为纯文本格式。

2.  实验过程

-   删除schema

    ```
    drop schema salene cascade;
    
    [omm@wzsy01 ~]$ gsql -p 15400 -d chnbs -r -U deity -W Deityl---
    gsql ((openGauss 2.0.1 build d97c0e8a) compiled at 2021-06-02 19:37:17 commit 0 last mr  )
    Non-SSL connection (SSL connection is recommended when requiring high-security)
    Type "help" for help.
    
    
    chnbs=> show search_path;
      search_path   
    ----------------
     "$user",public
    (1 row)
    
    
    chnbs=> set search_path='salene';
    SET
    chnbs=> show search_path;
     search_path 
    -------------
     salene
    (1 row)
    
    
    chnbs=> \dn
    List of schemas
      Name  | Owner 
    --------+-------
     jack   | deity
     salene | deity
    (2 rows)
    
    
    chnbs=> \d
                                           List of relations
     Schema |              Name              |   Type   | Owner |             Storage              
    --------+--------------------------------+----------+-------+----------------------------------
     salene | bank_balance_loan              | table    | deity | {orientation=row,compression=no}
     salene | bi_authentication              | table    | deity | {orientation=row,compression=no}
     salene | bi_bank_product                | table    | deity | {orientation=row,compression=no}
     salene | bi_bank_rate                   | table    | deity | {orientation=row,compression=no}
     salene | bi_compatible                  | table    | deity | {orientation=row,compression=no}
     ......
     ......
     ......
     salene | bi_credit_feedback             | table    | deity | {orientation=row,compression=no}
     salene | bi_customer                    | table    | deity | {orientation=row,compression=no}
     salene | bi_disburse_detail             | table    | deity | {orientation=row,compression=no}
     salene | fahai_sifa_info                | table    | deity | {orientation=row,compression=no}
    chnbs=> \dn
    List of schemas
      Name  | Owner 
    --------+-------
     jack   | deity
     salene | deity
    (2 rows)
    
    
    chnbs=> drop schema salene cascade;
    NOTICE:  drop cascades to 236 other objects
    DETAIL:  drop cascades to function p_zcfzblrb_tb()
    drop cascades to table bank_balance_loan
    drop cascades to table bi_authentication
    drop cascades to table bi_bank_product
    drop cascades to table bi_bank_rate
    drop cascades to table bi_compatible
    drop cascades to table bi_credit_feedback
    drop cascades to table bi_customer
    drop cascades to table bi_disburse_detail
    drop cascades to table bi_finance_transaction
    drop cascades to table bi_flow
    drop cascades to table bi_flow_define
    drop cascades to table bi_flow_node
    drop cascades to table bi_monitor_history_record
    drop cascades to table bi_monitor_record
    drop cascades to table bi_mutual_excls
    drop cascades to table bi_order
    drop cascades to table bi_order_audit
    drop cascades to table bi_order_collateral
    drop cascades to table bi_order_collateral_owner
    drop cascades to table bi_order_push
    drop cascades to table bi_order_veritify
    drop cascades to table bi_orglist
    drop cascades to table bi_pay_repay
    drop cascades to table bi_pre_credit
    drop cascades to table bi_reason_rule
    drop cascades to table bi_reconl_record
    drop cascades to table bi_schedule_job
    drop cascades to table bi_schedule_record
    drop cascades to table bi_tax_organization
    drop cascades to table bi_transaction_flow
    drop cascades to table bi_transaction_node_detail
    ......
    ......
    ......
    drop cascades to table hsj_lawsuit_detail_bgt
    drop cascades to table hsj_lawsuit_detail_cpws
    and 136 other objects (see server log for list)
    DROP SCHEMA
    chnbs=> \dn
    List of schemas
     Name | Owner 
    ------+-------
     jack | deity
    (1 row)
    
    
    chnbs=> select * from pg_tables where schemaname='salene';
     schemaname | tablename | tableowner | tablespace | hasindexes | hasrules | hastriggers | tablecreator | created | last_ddl_time 
    ------------+-----------+------------+------------+------------+----------+-------------+--------------+---------+---------------
    (0 rows)
    ```


-   sql文本导入恢复salene的schema

    ```
     \i home/omm/chnbs_salene.sql
    chnbs=> \i home/omm/chnbs_salene.sql 
    SET
    SET
    SET
    SET
    SET
    SET
    CREATE SCHEMA
    ALTER SCHEMA
    SET
    CREATE PROCEDURE
    ALTER FUNCTION
    SET
    SET
    CREATE TABLE
    ......
    ......
    ......
    COMMENT
    COMMENT
    COMMENT
     setval 
    --------
         51
    (1 row)
    ALTER TABLE
    ALTER TABLE
    ALTER TABLE
    CREATE INDEX
    CREATE INDEX
    CREATE INDEX
    CREATE INDEX
    CREATE INDEX
    REVOKE
    REVOKE
    GRANT
    GRANT
    chnbs=> \dn
    List of schemas
      Name  | Owner 
    --------+-------
     jack   | deity
     salene | deity
    (2 rows)
    
    
    chnbs=> select * from pg_tables where schemaname='salene';
     schemaname |           tablename            | tableowner | tablespace | hasindexes | hasrules | hastriggers | tablecreator |            created            |         last_ddl_time         
    ------------+--------------------------------+------------+------------+------------+----------+-------------+--------------+-------------------------------+-------------------------------
     salene     | bank_balance_loan              | deity      |            | f          | f        | f           | deity        | 2021-07-27 16:01:11.467086+08 | 2021-07-27 16:01:11.523697+08
     salene     | bi_authentication              | deity      |            | f          | f        | f           | deity        | 2021-07-27 16:01:11.524193+08 | 2021-07-27 16:01:11.536608+08
    ......
    ......
    ......
     salene     | er_basic                       | deity      |            | f          | f        | f           | deity        | 2021-07-27 16:01:12.24948+08  | 2021-07-27 16:01:12.254199+08
    ```

-   gs\_restore从gs\_dump备份出的二进制文件恢复名为salene的schema

    ```
    gs_restore -p 15400 -d chnbs -n salene -F c /home/omm/chnbs_salene.binary 
    chnbs=> \dn
    List of schemas
      Name  | Owner 
    --------+-------
     jack   | deity
     salene | deity
    (2 rows)
    
    
    chnbs=> drop schema salene cascade;
    DROP SCHEMA
    chnbs=> \dn
    List of schemas
     Name | Owner 
    ------+-------
     jack | deity
    (1 row)
    
    
    chnbs=> select * from pg_tables where schemaname='salene';
     schemaname | tablename | tableowner | tablespace | hasindexes | hasrules | hastriggers | tablecreator | created | last_ddl_time 
    ------------+-----------+------------+------------+------------+----------+-------------+--------------+---------+---------------
    (0 rows)
    
    
    chnbs=> \q
    [omm@wzsy01 ~]$ gs_restore -p 15400 -d chnbs -n salene -F c /home/omm/chnbs_salene.binary 
    start restore operation ...
    100 SQL statements read in !
    200 SQL statements read in !
    300 SQL statements read in !
    400 SQL statements read in !
    500 SQL statements read in !
    600 SQL statements read in !
    700 SQL statements read in !
    800 SQL statements read in !
    900 SQL statements read in !
    1000 SQL statements read in !
    1100 SQL statements read in !
    1200 SQL statements read in !
    1300 SQL statements read in !
    1400 SQL statements read in !
    1500 SQL statements read in !
    1600 SQL statements read in !
    1700 SQL statements read in !
    1800 SQL statements read in !
    1900 SQL statements read in !
    2000 SQL statements read in !
    2100 SQL statements read in !
    2200 SQL statements read in !
    2300 SQL statements read in !
    2400 SQL statements read in !
    2500 SQL statements read in !
    2600 SQL statements read in !
    2700 SQL statements read in !
    2800 SQL statements read in !
    2900 SQL statements read in !
    3000 SQL statements read in !
    3100 SQL statements read in !
    3200 SQL statements read in !
    3300 SQL statements read in !
    3400 SQL statements read in !
    3500 SQL statements read in !
    3600 SQL statements read in !
    table bank_balance_loan complete data imported !
    table bi_authentication complete data imported !
    table bi_bank_product complete data imported !
    table bi_bank_rate complete data imported !
    ......
    ......
    ......
    table zx_nsrjcxx complete data imported !
    table zx_sbxx complete data imported !
    table zx_sbzsxx complete data imported !
    table zx_tzfxx complete data imported !
    table zx_wfwzxx complete data imported !
    table zx_ybnsr complete data imported !
    table zx_zcfzbxx complete data imported !
    3900 SQL statements read in !
    Finish reading 3925 SQL statements!
    end restore operation ...
    restore operation successful
    total time: 26888  ms
    [omm@wzsy01 ~]$ gsql -p 15400 -d chnbs -r -U deity -W Deitylee1983
    gsql ((openGauss 2.0.1 build d97c0e8a) compiled at 2021-06-02 19:37:17 commit 0 last mr  )
    Non-SSL connection (SSL connection is recommended when requiring high-security)
    Type "help" for help.
    
    
    chnbs=> \dn
    List of schemas
      Name  | Owner 
    --------+-------
     jack   | deity
     salene | deity
    (2 rows)
    
    
    chnbs=> select count(*) from pg_tables where schemaname='salene';
     count 
    -------
       233
    ```

-   gs\_restore从gs\_dump备份出的目录中恢复名为salene的schema

    ```
    gs_restore -p 15400 -d chnbs -n salene -F d /home/omm/chnbs
    chnbs=> drop schema salene cascade;
    NOTICE:  drop cascades to 236 other objects
    DETAIL:  drop cascades to function salene.p_zcfzblrb_tb()
    drop cascades to table salene.bank_balance_loan
    drop cascades to table salene.bi_authentication
    ......
    ......
    ......
    drop cascades to table salene.hsj_lawsuit_detail_bgt
    drop cascades to table salene.hsj_lawsuit_detail_cpws
    and 136 other objects (see server log for list)
    DROP SCHEMA
    chnbs=> select count(*) from pg_tables where schemaname='salene';
     count 
    -------
         0
    (1 row)
    
    
    chnbs=> \q
    [omm@wzsy01 ~]$ gs_restore -p 15400 -d chnbs -n salene -F d /home/omm/chnbs
    start restore operation ...
    100 SQL statements read in !
    ......
    ......
    ......
    7300 SQL statements read in !
    7400 SQL statements read in !
    table bank_balance_loan complete data imported !
    table bi_authentication complete data imported !
    7500 SQL statements read in !
    table bi_bank_product complete data imported !
    table bi_bank_rate complete data imported !
    table bi_compatible complete data imported !
    ......
    ......
    ......
    table zx_ybnsr complete data imported !
    table zx_zcfzbxx complete data imported !
    7800 SQL statements read in !
    Finish reading 7852 SQL statements!
    end restore operation ...
    restore operation successful
    total time: 26309  ms
    [omm@wzsy01 ~]$ gsql -p 15400 -d chnbs -r -U deity -W Deityl---
    gsql ((openGauss 2.0.1 build d97c0e8a) compiled at 2021-06-02 19:37:17 commit 0 last mr  )
    Non-SSL connection (SSL connection is recommended when requiring high-security)
    Type "help" for help.
    
    
    chnbs=> \dn
    List of schemas
      Name  | Owner 
    --------+-------
     jack   | deity
     salene | deity
    (2 rows)
    
    
    chnbs=> select count(*) from pg_tables where schemaname='salene';
     count 
    -------
       233
    ```

-   gs\_restore从gs\_dump备份出的tar文件恢复名为salene的schema

    ```
    gs_restore -p 15400 -d chnbs -n salene -F t /home/omm/chnbs.tar 
    chnbs=> drop schema salene cascade;
    NOTICE:  drop cascades to 236 other objects
    DETAIL:  drop cascades to function salene.p_zcfzblrb_tb()
    drop cascades to table salene.bank_balance_loan
    ......
    ......
    ......
    drop cascades to table salene.hsj_lawsuit_detail_cpws
    and 136 other objects (see server log for list)
    DROP SCHEMA
    chnbs=> \dn
    List of schemas
     Name | Owner 
    ------+-------
     jack | deity
    (1 row)
    
    
    chnbs=> \q   
    [omm@wzsy01 ~]$ gs_restore -p 15400 -d chnbs -n salene -F t /home/omm/chnbs.tar 
    start restore operation ...
    100 SQL statements read in !
    ......
    ......
    ......
    7400 SQL statements read in !
    table bank_balance_loan complete data imported !
    table bi_authentication complete data imported !
    7500 SQL statements read in !
    table bi_bank_product complete data imported !
    ......
    ......
    ......
    table zx_zcfzbxx complete data imported !
    7800 SQL statements read in !
    Finish reading 7852 SQL statements!
    end restore operation ...
    restore operation successful
    total time: 27971  ms
    [omm@wzsy01 ~]$ gsql -p 15400 -d chnbs -r -U deity -W Deityle---
    gsql ((openGauss 2.0.1 build d97c0e8a) compiled at 2021-06-02 19:37:17 commit 0 last mr  )
    Non-SSL connection (SSL connection is recommended when requiring high-security)
    Type "help" for help.
    
    
    chnbs=> \dn
    List of schemas
      Name  | Owner 
    --------+-------
     jack   | deity
     salene | deity
    (2 rows)
    
    
    chnbs=> select count(*) from pg_tables where schemaname='salene';
     count 
    -------
       233
    ```

-   gs\_restore从gs\_dump备份出的tar文件恢复salene中的某一张表

    ```
    gs_restore -p 15400 -d chnbs -n salene -t zx_zcfzbxx -F t /home/omm/chnbs.tar
    chnbs=> set search_path='salene';
    SET
    
    
    chnbs=> select count(*) from zx_zcfzbxx;
      count  
    ---------
     1804672
    (1 row)
    
    
    chnbs=> drop table zx_zcfzbxx;
    DROP TABLE
    chnbs=> select count(*) from zx_zcfzbxx;
    ERROR:  relation "zx_zcfzbxx" does not exist on dn_6001_6002
    LINE 1: select count(*) from zx_zcfzbxx;
                                 ^
    chnbs=> \q
    [omm@wzsy01 ~]$ gs_restore -p 15400 -d chnbs -n salene -t zx_zcfzbxx -F t /home/omm/chnbs.tar 
    start restore operation ...
    100 SQL statements read in !
    200 SQL statements read in !
    300 SQL statements read in !
    400 SQL statements read in !
    500 SQL statements read in !
    600 SQL statements read in !
    700 SQL statements read in !
    800 SQL statements read in !
    900 SQL statements read in !
    1000 SQL statements read in !
    1100 SQL statements read in !
    1200 SQL statements read in !
    1300 SQL statements read in !
    1400 SQL statements read in !
    1500 SQL statements read in !
    1600 SQL statements read in !
    1700 SQL statements read in !
    1800 SQL statements read in !
    1900 SQL statements read in !
    2000 SQL statements read in !
    2100 SQL statements read in !
    2200 SQL statements read in !
    2300 SQL statements read in !
    2400 SQL statements read in !
    2500 SQL statements read in !
    2600 SQL statements read in !
    2700 SQL statements read in !
    2800 SQL statements read in !
    2900 SQL statements read in !
    3000 SQL statements read in !
    3100 SQL statements read in !
    3200 SQL statements read in !
    3300 SQL statements read in !
    3400 SQL statements read in !
    3500 SQL statements read in !
    3600 SQL statements read in !
    3700 SQL statements read in !
    3800 SQL statements read in !
    3900 SQL statements read in !
    4000 SQL statements read in !
    4100 SQL statements read in !
    4200 SQL statements read in !
    4300 SQL statements read in !
    4400 SQL statements read in !
    4500 SQL statements read in !
    4600 SQL statements read in !
    4700 SQL statements read in !
    4800 SQL statements read in !
    4900 SQL statements read in !
    5000 SQL statements read in !
    5100 SQL statements read in !
    5200 SQL statements read in !
    5300 SQL statements read in !
    5400 SQL statements read in !
    5500 SQL statements read in !
    5600 SQL statements read in !
    5700 SQL statements read in !
    5800 SQL statements read in !
    5900 SQL statements read in !
    6000 SQL statements read in !
    6100 SQL statements read in !
    6200 SQL statements read in !
    6300 SQL statements read in !
    6400 SQL statements read in !
    6500 SQL statements read in !
    6600 SQL statements read in !
    6700 SQL statements read in !
    6800 SQL statements read in !
    6900 SQL statements read in !
    7000 SQL statements read in !
    7100 SQL statements read in !
    7200 SQL statements read in !
    7300 SQL statements read in !
    7400 SQL statements read in !
    7500 SQL statements read in !
    7600 SQL statements read in !
    7700 SQL statements read in !
    table zx_zcfzbxx complete data imported !
    7800 SQL statements read in !
    Finish reading 7852 SQL statements!
    end restore operation ...
    restore operation successful
    total time: 14488  ms
    [omm@wzsy01 ~]$ gsql -p 15400 -d chnbs -r -U deity -W Deityle---
    gsql ((openGauss 2.0.1 build d97c0e8a) compiled at 2021-06-02 19:37:17 commit 0 last mr  )
    Non-SSL connection (SSL connection is recommended when requiring high-security)
    Type "help" for help.
    
    
    chnbs=> select count(*) from salene.zx_zcfzbxx;
      count  
    ---------
     1804672
    (1 row)
    ```


gs\_restore详细参数解释请参考官方文档：https://opengauss.org/zh/docs/1.1.0/docs/Toolreference/gs\_restore.html

