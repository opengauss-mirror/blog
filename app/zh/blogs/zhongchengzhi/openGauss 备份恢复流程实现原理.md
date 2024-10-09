---
title: 'openGauss 备份恢复流程实现原理'

date: '2024-10-08'

category: 'blog'

tags: ['openGauss 备份恢复流程实现原理']

archives: '2024-10'

author: 'zhongchengzhi'

summary: 'openGauss 备份恢复流程实现原理'
---

##### 一. gs_probackup的简单介绍

本文出处：[https://docs-opengauss.osinfra.cn/zh/docs/latest/docs/ToolandCommandReference/gs_probackup.html](https://docs-opengauss.osinfra.cn/zh/docs/latest/docs/ToolandCommandReference/gs_probackup.html)

gs_probackup是一个用于管理openGauss数据库备份和恢复的工具。它对openGauss实例进行定期备份，以便在数据库出现故障时能够恢复服务器。

* 可用于备份单机数据库，也可对主机或者主节点数据库备机进行备份，为物理备份。
* 可备份外部目录的内容，如脚本文件、配置文件、日志文件、dump文件等。
* 支持增量备份、定期备份和远程备份。
* 可设置备份的留存策略。
* 支持MySQL兼容性。（仅限于3.0.0，3.1.0，3.1.1的MySQL兼容性需求）
* 支持备份到兼容S3协议的对象存储
gs_probackup目前支持进度打印，会分别在文件备份、文件验证阶段、文件同步阶段以及文件恢复阶段，根据已经完成的文件数比总文件数打印进度。

##### 二. gs_probackup的备份恢复流程
1.  新建备份目录并初始化: 
```python
gs_probackup init -B /home/zcz_ct/new
INFO: Backup catalog '/home/zcz_ct/new' successfully inited
``` 

2.  在备份路径内初始化一个新的备份实例:  
```python
gs_probackup add-instance -B /home/zcz_ct/new -D /usr1/zczct_install/omm/openGauss/dn1 --instance=pro1
INFO: Instance 'pro1' successfully inited
``` 

3.  进行全量备份：
```python
gs_probackup backup -B /home/zcz_ct/new -b full --stream --instance=pro1 --skip-block-validation --no-validate -p 24512 -d postgres
INFO: Backup start, gs_probackup version: 2.4.2, instance: pro1, backup ID:XXXXXX, backup mode: FULL
``` 

4.  连接数据库主节点并删除表:  
```python
gsql -d postgres -p 24512 -c "drop table if exists table;"
INFO: DROP TABLE
```

5.  停止数据库主节点：
```python
cm_ctl stop -n 1
INFO: stop success
```

6.  执行restore恢复流程:  
```python
gs_probackup restore -B /home/zcz_ct/new --instance=pro1 --incremental-mode=checksum -D /usr1/zczct_install/omm/openGauss/dn1;`
INFO: Restore of backip XXXXXX completed.
```

7.  启动数据库主节点:
```python
cm_ctl start -n 1
INFO: start success
```

##### 三. gs_probackup的备份恢复原理
1.  备份的基本原理:  
*   数据库备份的基本原理是将数据库中的数据复制到另一个设备或存储介质中，以便在数据丢失或损坏时进行恢复。备份可以分为完全备份和增量备份两种类型。
*   完全备份是指将整个数据库的所有数据和对象都备份到另一个设备或存储介质中，这种备份方式可以恢复所有数据和对象，但是备份和恢复的时间和空间成本较高。
*   增量备份是指只备份数据库中发生变化的数据和对象，这种备份方式可以节省备份和恢复的时间和空间成本，但是恢复时需要先恢复完全备份，再逐步恢复增量备份。
*   数据库备份的实现方式有多种，包括物理备份和逻辑备份。物理备份是指将数据库的物理文件直接复制到另一个设备或存储介质中，这种备份方式可以快速恢复整个数据库，但是备份文件较大。逻辑备份是指将数据
库中的数据和对象以逻辑方式导出到备份文件中，这种备份方式可以节省备份文件的空间，但是恢复速度较慢。  

2.  openGauss备份的基本功能：
*   gs_probackup工具采用物理备份的方式进行备份，支持全量备份、增量备份等备份方式，并且支持备份压缩。对数据库进行备份，可以增强数据库的抗风险能力。 

3.  openGauss备份流程的代码走读：
*   do_actual_operate（根据参数选择备份方式）——》do_backup（执行backup）——》do_backup_instance（备份数据函数）——》run_backup_threads（起备份线程）——》backup_files（备份文件）——》
backup_data_file（备份数据文件）——》send_pages（备份本地文件）——》compress_and_backup_page（压缩页面并写数据到备份目录文件）

4.  恢复的基本原理：  
*   数据库恢复的基本原理是在数据库发生故障或数据损坏时，通过一系列的步骤将数据库恢复到正常工作状态。通常，数据库恢复分为两种类型：物理恢复和逻辑恢复。
*   物理恢复是通过备份和日志文件来恢复数据库。在数据库发生故障或数据损坏时，可以使用备份文件将数据库恢复到最近的一个备份点。然后，通过应用日志文件中的更改，将数据库恢复到故障发生时的状态。可以
恢复所有的数据和表结构。
*   逻辑恢复是通过SQL语句来恢复数据库。当数据库中的数据发生错误或损坏时，可以使用SQL语句来修复或重建数据。这种方法可以恢复表结构和数据，但可能无法恢复所有的数据。
*   无论是物理恢复还是逻辑恢复，都需要在恢复过程中保证数据库的一致性和完整性。因此，在进行恢复操作之前，需要对数据库进行备份，并且在恢复过程中需要进行严格的控制和验证。

5.  openGauss恢复的基本功能：
*   gs_probackup工具支持全量恢复与增量恢复，提供将数据库恢复到之前状态的能力。gs_probackup工具提供的恢复能力，是数据库安全可靠的重要保证。

6.  openGauss恢复流程的代码走读：
    do_restore_or_validate（恢复流程入口）——》restore_chain（恢复主函数）——》threads_handle(起恢复线程)——》restore_files（恢复本地文件）——》restore_data_file（恢复数据文件）、
    RestoreCompressFile（恢复压缩文件）——》ConstructCompressedFile（写压缩文件数据）——》TranferIntoCompFile（转为压缩文件）——》CalRealWriteSize（写数据）


