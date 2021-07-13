+++

title = "openGauss数据库维护管理.md" 

date = "2021-07-09" 

tags = ["openGauss数据库维护管理.md"] 

archives = "2021-07" 

author = "七月" 

summary = "openGauss数据库维护管理.md"

img = "/zh/post/zhengwen2/img/img25.jpg" 

times = "12:30"

+++

# openGauss数据库维护管理.md<a name="ZH-CN_TOPIC_0000001085018737"></a>

1 操作系统参数检查<br />
1.1 实验介绍<br />
1.1.1 关于本实验<br />
gs_checkos工具用来帮助检查操作系统、控制参数、磁盘配置等内容，并对系统控制参数、I/O配置、网络配置和THP服务等信息进行配置。<br />
本实验主要是通过gs_checkos工具来检查操作系统参数设置是否合理。先进行场景设置，然后根据检查结果进行参数调整。<br />
1.1.2 实验目的<br />
掌握gs_checkos工具的基本使用；<br />
1.2 场景设置及操作步骤<br />
步骤 1用ROOT用户登录装有openGauss数据库服务的操作系统，登录后信息如下：</p>

<p>Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64<br />
System information as of time: 	Mon Jul 20 16:41:11 CST 2020<br />
System load: 	0.00<br />
Processes: 	113<br />
Memory used: 	7.0%<br />
Swap used: 	0.0%<br />
Usage On: 	15%<br />
IP address: 	192.168.0.96<br />
Users online: 	2<br />
[root@ecs-e1b3 ~]#</p>
<p>步骤 2在ROOT用户下执行gs_checkos先对系统参数进行检查。<br />
[root@ecs-e1b3 ~]# gs_checkos -i A<br />
Checking items:<br />
A1. [ OS version status ]                                   : Normal<br />
A2. [ Kernel version status ]                               : Normal<br />
A3. [ Unicode status ]                                      : Normal<br />
A4. [ Time zone status ]                                    : Normal<br />
A5. [ Swap memory status ]                                  : Normal<br />
A6. [ System control parameters status ]                    : Warning<br />
A7. [ File system configuration status ]                    : Normal<br />
A8. [ Disk configuration status ]                           : Normal<br />
A9. [ Pre-read block size status ]                          : Normal<br />
A10.[ IO scheduler status ]                                 : Normal<br />
BondMode Null<br />
A11.[ Network card configuration status ]                   : Warning<br />
A12.[ Time consistency status ]                             : Warning<br />
A13.[ Firewall service status ]                             : Normal<br />
A14.[ THP service status ]                                  : Normal<br />
Total numbers:14. Abnormal numbers:0. Warning numbers:3.<br />
说明事项：<br />
Normal 为正常项，Abnormal为必须处理项，Warning可以不处理。<br />
Total numbers:14. Abnormal numbers:0. Warning numbers:3。<br />
表示：总共检查14项，其中Abnormal必须处理项为0，Warning告警项为3。</p>
<p>步骤 3调整系统参数值。<br />
在参数配置文件（/etc/sysctl.conf）中将参数 vm.min_free_kbytes(表示：内核内存分配保留的内存量) 的值调整为3488。输入“i”进入INSERT模式，进行修改。<br />
[root@ecs-e1b3 ~]# vi /etc/sysctl.conf<br />
net.ipv4.conf.default.accept_redirects=0<br />
net.ipv4.conf.all.secure_redirects=0<br />
net.ipv4.conf.default.secure_redirects=0<br />
net.ipv4.icmp_echo_ignore_broadcasts=1<br />
net.ipv4.icmp_ignore_bogus_error_responses=1<br />
…………<br />
net.ipv4.tcp_rmem = 8192 250000 16777216<br />
net.ipv4.tcp_wmem = 8192 250000 16777216<br />
vm.min_free_kbytes = 3488<br />
net.core.netdev_max_backlog = 65535<br />
net.ipv4.tcp_max_syn_backlog = 65535<br />
net.core.somaxconn = 65535<br />
参数值修改好后，按” ESC”键退出编辑模式，然后输入” :wq”后回车进行保存。接着通过执行sysctl -p 命令使刚才修改的参数生效，具体如下：<br />
[root@ecs-e1b3 ~]# sysctl -p<br />
kernel.sysrq = 0<br />
net.ipv4.ip_forward = 0<br />
net.ipv4.conf.all.send_redirects = 0<br />
net.ipv4.conf.default.send_redirects = 0<br />
net.ipv4.conf.all.accept_source_route = 0<br />
net.ipv4.conf.default.accept_source_route = 0<br />
net.ipv4.conf.all.accept_redirects = 0<br />
net.ipv4.conf.default.accept_redirects = 0<br />
……………<br />
net.core.rmem_default = 21299200<br />
net.sctp.sctp_mem = 94500000 915000000 927000000<br />
net.sctp.sctp_rmem = 8192 250000 16777216<br />
net.sctp.sctp_wmem = 8192 250000 16777216<br />
kernel.sem = 250 6400000 1000 25600<br />
net.ipv4.tcp_rmem = 8192 250000 16777216<br />
net.ipv4.tcp_wmem = 8192 250000 16777216<br />
vm.min_free_kbytes = 3488<br />
net.core.netdev_max_backlog = 65535<br />
net.ipv4.tcp_max_syn_backlog = 65535<br />
net.core.somaxconn = 65535<br />
kernel.shmall = 1152921504606846720<br />
kernel.shmmax = 18446744073709551615</p>
<p>步骤 4再执行gs_checkos 对系统参数进行检查。<br />
[root@ecs-e1b3 ~]# gs_checkos -i A<br />
Checking items:<br />
A1. [ OS version status ]                                   : Normal<br />
A2. [ Kernel version status ]                               : Normal<br />
A3. [ Unicode status ]                                      : Normal<br />
A4. [ Time zone status ]                                    : Normal<br />
A5. [ Swap memory status ]                                  : Normal<br />
A6. [ System control parameters status ]                    : Abnormal<br />
A7. [ File system configuration status ]                    : Normal<br />
A8. [ Disk configuration status ]                           : Normal<br />
A9. [ Pre-read block size status ]                          : Normal<br />
A10.[ IO scheduler status ]                                 : Normal<br />
BondMode Null<br />
A11.[ Network card configuration status ]                   : Warning<br />
A12.[ Time consistency status ]                             : Warning<br />
A13.[ Firewall service status ]                             : Normal<br />
A14.[ THP service status ]                                  : Normal<br />
Total numbers:14. Abnormal numbers:1. Warning numbers:2.<br />
Do checking operation finished. Result: Abnormal.<br />
此时A6. [ System control parameters status ]  的状态为Abnormal为必须处理项；<br />
Total numbers:14. Abnormal numbers:1. Warning numbers:2。<br />
表示：总共检查14项，其中Abnormal必须处理项为1，Warning告警项为2。</p>
<p>步骤 5通过执行gs_checkos -i A --detail 查看更详细的信息。<br />
[root@ecs-e1b3 ~]# gs_checkos -i A --detail<br />
Checking items:<br />
A1. [ OS version status ]                                   : Normal<br />
[ecs-e1b3]<br />
openEuler_20.03_64bit<br />
A2. [ Kernel version status ]                               : Normal<br />
The names about all kernel versions are same. The value is “4.19.90-2003.4.0.0036.oe1.aarch64”.<br />
A3. [ Unicode status ]                                      : Normal<br />
The values of all unicode are same. The value is “LANG=en_US.UTF-8”.<br />
A4. [ Time zone status ]                                    : Normal<br />
The informations about all timezones are same. The value is “+0800”.<br />
A5. [ Swap memory status ]                                  : Normal<br />
The value about swap memory is correct.<br />
A6. [ System control parameters status ]                    : Abnormal<br />
[ecs-e1b3]<br />
Abnormal reason: variable ‘vm.min_free_kbytes’ RealValue ‘3488’ ExpectedValue ‘348844’.<br />
Warning reason: variable ‘net.ipv4.tcp_retries1’ RealValue ‘3’ ExpectedValue ‘5’.<br />
Warning reason: variable ‘net.ipv4.tcp_syn_retries’ RealValue ‘6’ ExpectedValue ‘5’.<br />
Warning reason: variable ‘net.sctp.path_max_retrans’ RealValue ‘5’ ExpectedValue ‘10’.<br />
Warning reason: variable ‘net.sctp.max_init_retransmits’ RealValue ‘8’ ExpectedValue ‘10’.<br />
Check_SysCtl_Parameter failed.<br />
A7. [ File system configuration status ]                    : Normal<br />
Both soft nofile and hard nofile are correct.<br />
A8. [ Disk configuration status ]                           : Normal<br />
The value about XFS mount parameters is correct.<br />
A9. [ Pre-read block size status ]                          : Normal<br />
The value about Logical block size is correct.<br />
A10.[ IO scheduler status ]                                 : Normal<br />
The value of IO scheduler is correct.<br />
BondMode Null<br />
A11.[ Network card configuration status ]                   : Warning<br />
[ecs-e1b3]<br />
BondMode Null<br />
Warning reason: Failed to obtain the network card speed value. Maybe the network card “eth0” is not working.<br />
A12.[ Time consistency status ]                             : Warning<br />
[ecs-e1b3]<br />
The NTPD not detected on machine and local time is “2020-07-20 17:16:41”.<br />
A13.[ Firewall service status ]                             : Normal<br />
The firewall service is stopped.<br />
A14.[ THP service status ]                                  : Normal<br />
The THP service is stopped.<br />
Total numbers:14. Abnormal numbers:1. Warning numbers:2.<br />
Do checking operation finished. Result: Abnormal.<br />
在详细信息中，可以明确看出那些参数设置有问题，并给出了问题参数要求修改的参考值，如下：<br />
A6. [ System control parameters status ]                    : Abnormal<br />
[ecs-e1b3]<br />
Abnormal reason: variable ‘vm.min_free_kbytes’ RealValue ‘3488’ ExpectedValue ‘348844’.<br />
Warning reason: variable ‘net.ipv4.tcp_retries1’ RealValue ‘3’ ExpectedValue ‘5’.<br />
Warning reason: variable ‘net.ipv4.tcp_syn_retries’ RealValue ‘6’ ExpectedValue ‘5’.<br />
Warning reason: variable ‘net.sctp.path_max_retrans’ RealValue ‘5’ ExpectedValue ‘10’.<br />
Warning reason: variable ‘net.sctp.max_init_retransmits’ RealValue ‘8’ ExpectedValue ‘10’.<br />
Check_SysCtl_Parameter failed.</p>
<p>步骤 6按详细信息中的修改说明对系统参数进行修改。<br />
vm.min_free_kbytes的值由3488调整为348844<br />
net.ipv4.tcp_retries1的值由3调整为5.<br />
net.ipv4.tcp_syn_retries的值由6调整为5.<br />
net.sctp.path_max_retrans的值由5调整为10<br />
net.sctp.max_init_retransmits的值由8调整为10<br />
具体设置如下：<br />
vm.min_free_kbytes = 348844<br />
net.ipv4.tcp_retries1 = 5<br />
net.ipv4.tcp_syn_retries = 5<br />
net.sctp.path_max_retrans = 10<br />
net.sctp.max_init_retransmits = 10<br />
在系统参数文件中进行修改（输入“i”进入INSERT模式，进行修改。）：<br />
[root@ecs-e1b3 ~]# vi /etc/sysctl.conf</p>
<h1><a id="sysctl_settings_are_defined_through_files_in_178"></a>sysctl settings are defined through files in</h1>
<h1><a id="usrlibsysctld_runsysctld_and_etcsysctld_179"></a>/usr/lib/sysctl.d/, /run/sysctl.d/, and /etc/sysctl.d/.</h1>
<h1><a id="_180"></a></h1>
<h1><a id="Vendors_settings_live_in_usrlibsysctld_181"></a>Vendors settings live in /usr/lib/sysctl.d/.</h1>
<h1><a id="To_override_a_whole_file_create_a_new_file_with_the_same_in_182"></a>To override a whole file, create a new file with the same in</h1>
<h1><a id="etcsysctld_and_put_new_settings_there_To_override_183"></a>/etc/sysctl.d/ and put new settings there. To override</h1>
<h1><a id="only_specific_settings_add_a_file_with_a_lexically_later_184"></a>only specific settings, add a file with a lexically later</h1>
<h1><a id="name_in_etcsysctld_and_put_new_settings_there_185"></a>name in /etc/sysctl.d/ and put new settings there.</h1>
<h1><a id="_186"></a></h1>
<h1><a id="For_more_information_see_sysctlconf5_and_sysctld5_187"></a>For more information, see sysctl.conf(5) and sysctl.d(5).</h1>
<p>kernel.sysrq=0<br />
net.ipv4.ip_forward=0<br />
net.ipv4.conf.all.send_redirects=0<br />
net.ipv4.conf.default.send_redirects=0<br />
net.ipv4.conf.all.accept_source_route=0<br />
net.ipv4.conf.default.accept_source_route=0<br />
net.ipv4.conf.all.accept_redirects=0</p>
<h1><a id="etcsysctld_and_put_new_settings_there_To_override_195"></a>/etc/sysctl.d/ and put new settings there. To override</h1>
<h1><a id="only_specific_settings_add_a_file_with_a_lexically_later_196"></a>only specific settings, add a file with a lexically later</h1>
<h1><a id="name_in_etcsysctld_and_put_new_settings_there_197"></a>name in /etc/sysctl.d/ and put new settings there.</h1>
<h1><a id="_198"></a></h1>
<h1><a id="For_more_information_see_sysctlconf5_and_sysctld5_199"></a>For more information, see sysctl.conf(5) and sysctl.d(5).</h1>
<p>kernel.sysrq=0<br />
net.ipv4.ip_forward=0<br />
net.ipv4.conf.all.send_redirects=0<br />
net.ipv4.conf.default.send_redirects=0<br />
net.ipv4.conf.all.accept_source_route=0</p>
<h1><a id="etcsysctld_and_put_new_settings_there_To_override_205"></a>/etc/sysctl.d/ and put new settings there. To override</h1>
<h1><a id="only_specific_settings_add_a_file_with_a_lexically_later_206"></a>only specific settings, add a file with a lexically later</h1>
<h1><a id="name_in_etcsysctld_and_put_new_settings_there_207"></a>name in /etc/sysctl.d/ and put new settings there.</h1>
<h1><a id="_208"></a></h1>
<h1><a id="For_more_information_see_sysctlconf5_and_sysctld5_209"></a>For more information, see sysctl.conf(5) and sysctl.d(5).</h1>
<p>kernel.sysrq=0<br />
net.ipv4.ip_forward=0<br />
net.ipv4.conf.all.send_redirects=0<br />
net.ipv4.conf.default.send_redirects=0<br />
net.ipv4.conf.all.accept_source_route=0<br />
net.ipv4.conf.default.accept_source_route=0<br />
……………<br />
net.sctp.sctp_rmem = 8192 250000 16777216<br />
net.sctp.sctp_wmem = 8192 250000 16777216<br />
kernel.sem = 250 6400000 1000 25600<br />
net.ipv4.tcp_rmem = 8192 250000 16777216<br />
net.ipv4.tcp_wmem = 8192 250000 16777216<br />
vm.min_free_kbytes = 348844<br />
net.core.netdev_max_backlog = 65535<br />
net.ipv4.tcp_max_syn_backlog = 65535<br />
net.core.somaxconn = 65535<br />
kernel.shmall = 1152921504606846720<br />
kernel.shmmax = 18446744073709551615<br />
net.ipv4.tcp_retries1 = 5<br />
net.ipv4.tcp_syn_retries = 5<br />
net.sctp.path_max_retrans = 10<br />
net.sctp.max_init_retransmits = 10<br />
参数值修改好后，按”ECS”键退出编辑模式，然后输入”:wq”后回车进行保存。接着通过执行sysctl -p 命令使刚才修改的参数生效，具体如下：<br />
[root@ecs-e1b3 ~]# sysctl -p<br />
kernel.sysrq = 0<br />
net.ipv4.ip_forward = 0<br />
net.ipv4.conf.all.send_redirects = 0<br />
net.ipv4.conf.default.send_redirects = 0<br />
net.ipv4.conf.all.accept_source_route = 0<br />
net.ipv4.conf.default.accept_source_route = 0<br />
net.ipv4.conf.all.accept_redirects = 0<br />
net.ipv4.conf.default.accept_redirects = 0<br />
net.ipv4.conf.all.secure_redirects = 0<br />
net.ipv4.conf.default.secure_redirects = 0<br />
net.ipv4.icmp_echo_ignore_broadcasts = 1<br />
net.ipv4.icmp_ignore_bogus_error_responses = 1<br />
net.ipv4.conf.all.rp_filter = 1<br />
net.ipv4.conf.default.rp_filter = 1<br />
net.ipv4.tcp_syncookies = 1<br />
kernel.dmesg_restrict = 1<br />
net.ipv6.conf.all.accept_redirects = 0<br />
net.ipv6.conf.default.accept_redirects = 0<br />
vm.swappiness = 0<br />
net.ipv4.tcp_max_tw_buckets = 10000<br />
net.ipv4.tcp_tw_reuse = 1<br />
…………….<br />
net.ipv4.tcp_rmem = 8192 250000 16777216<br />
net.ipv4.tcp_wmem = 8192 250000 16777216<br />
vm.min_free_kbytes = 348844<br />
net.core.netdev_max_backlog = 65535<br />
net.ipv4.tcp_max_syn_backlog = 65535<br />
net.core.somaxconn = 65535<br />
kernel.shmall = 1152921504606846720<br />
kernel.shmmax = 18446744073709551615<br />
net.ipv4.tcp_retries1 = 5<br />
net.ipv4.tcp_syn_retries = 5<br />
net.sctp.path_max_retrans = 10<br />
net.sctp.max_init_retransmits = 10</p>
<p>步骤 7再次通过执行gs_checkos -i A 查看系统参数检查是否能通过。<br />
[root@ecs-e1b3 ~]# gs_checkos -i A<br />
Checking items:<br />
A1. [ OS version status ]                                   : Normal<br />
A2. [ Kernel version status ]                               : Normal<br />
A3. [ Unicode status ]                                      : Normal<br />
A4. [ Time zone status ]                                    : Normal<br />
A5. [ Swap memory status ]                                  : Normal<br />
A6. [ System control parameters status ]                    : Normal<br />
A7. [ File system configuration status ]                    : Normal<br />
A8. [ Disk configuration status ]                           : Normal<br />
A9. [ Pre-read block size status ]                          : Normal<br />
A10.[ IO scheduler status ]                                 : Normal<br />
BondMode Null<br />
A11.[ Network card configuration status ]                   : Warning<br />
A12.[ Time consistency status ]                             : Warning<br />
A13.[ Firewall service status ]                             : Normal<br />
A14.[ THP service status ]                                  : Normal<br />
Total numbers:14. Abnormal numbers:0. Warning numbers:2.<br />
从检查结果可以看出，系统参数检查已经通过。其中A6. [ System control parameters status ]的状态由原来的Abnormal变为了Normal。<br />
操作系统参数检查实验结束。</p>
<p>2 openGauss运行健康状态检查<br />
2.1 实验介绍<br />
2.1.1 关于本实验<br />
gs_check能够帮助用户在openGauss运行过程中，全量的检查openGauss运行环境，操作系统环境，网络环境及数据库执行环境，也有助于在openGauss重大操作之前对各类环境进行全面检查，有效保证操作执行成功。<br />
本实验主要是通过gs_check工具来检查openGauss数据库运行状态。先进行场景设置，然后根据检查结果进行数据库调整。<br />
语法如下：<br />
单项检查：<br />
gs_check -i ITEM […] [-U USER] [-L] [-l LOGFILE] [-o OUTPUTDIR] [–skip-root-items][–set][–routing]<br />
场景检查：<br />
gs_check -e SCENE_NAME [-U USER] [-L] [-l LOGFILE] [-o OUTPUTDIR] [–hosts] [–skip-root-items] [–time-out=SECS][–set][–routing][–skip-items]<br />
场景检查项。默认的场景有inspect（例行巡检）、upgrade（升级前巡检）、binary_upgrade（就地升级前巡检）、health（健康检查巡检）、install(安装)，等，用户可以根据需求自己编写场景。<br />
显示帮助信息。<br />
gs_check -? | --help<br />
2.1.2 实验目的<br />
掌握gs_check工具的基本使用；</p>
<p>2.2 场景设置及操作步骤<br />
步骤 1用ROOT用户登录装有openGauss数据库服务的操作系统然后用 su – omm命令切换至OMM用户环境，登录后信息如下。<br />
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64<br />
System information as of time: 	Tue Jul 21 09:21:11 CST 2020<br />
System load: 	0.01<br />
Processes: 	109<br />
Memory used: 	6.7%<br />
Swap used: 	0.0%<br />
Usage On: 	15%<br />
IP address: 	192.168.0.96<br />
Users online: 	1<br />
[root@ecs-e1b3 ~]# su - omm<br />
Last login: Fri Jul 10 19:05:39 CST 2020 on pts/0<br />
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64<br />
System information as of time: 	Tue Jul 21 09:21:25 CST 2020<br />
System load: 	0.01<br />
Processes: 	111<br />
Memory used: 	7.0%<br />
Swap used: 	0.0%<br />
Usage On: 	15%<br />
IP address: 	192.168.0.96<br />
Users online: 	1<br />
[omm@ecs-e1b3 ~]$</p>
<h2><a id="_2openGauss
ommecse1b3__gs_om_t_status_331"></a>步骤 2确认openGauss数据库服务是否启动。<br />
[omm@ecs-e1b3 ~]$ gs_om -t status;</h2>
<h2><a id="cluster_state____Normal
redistributing___No_334"></a>cluster_state   : Normal<br />
redistributing  : No</h2>
<p>cluster_state   : Normal  表示已启动，可以正常使用。如果状态为非Normal表示不可用<br />
为了实验场景设置，如果数据库服务已经启动，请执行步骤3先关闭服务。</p>
<h1><a id="_3openGauss
ommecse1b3__gs_om_t_stop
Stopping_cluster_340"></a>步骤 3关闭openGauss数据库服务。<br />
[omm@ecs-e1b3 ~]$ gs_om -t stop;<br />
Stopping cluster.</h1>
<h1><a id="Successfully_stopped_cluster_344"></a>Successfully stopped cluster.</h1>
<p>End stop cluster.</p>
<p>步骤 4检查openGauss实例连接。<br />
[omm@ecs-e1b3 ~]$ gs_check -i CheckDBConnection<br />
Parsing the check items config file successfully<br />
Distribute the context file to remote hosts successfully<br />
Start to health check for the cluster. Total Items:1 Nodes:1</p>
<p>Checking…               [=========================] 1/1<br />
Start to analysis the check result<br />
CheckDBConnection…NG<br />
The item run on 1 nodes.  ng: 1<br />
The ng[ecs-e1b3] value:<br />
The database can not be connected.</p>
<p>Analysis the check result successfully<br />
Failed.	All check items run completed. Total:1     NG:1<br />
For more information please refer to /opt/huawei/wisequery/script/gspylib/inspection/output/CheckReport_2020072139449163171.tar.gz<br />
说明：<br />
CheckDBConnection…NG    表示连接检查项无用；<br />
The database can not be connected.   表示实例不能连接；<br />
Failed.	All check items run completed. Total:1  NG:1  表示共检查1项并且检查结果未通过。</p>
<h1><a id="_5openGauss
ommecse1b3__gs_om_t_start
Starting_cluster_369"></a>步骤 5启动openGauss数据库服务。<br />
[omm@ecs-e1b3 ~]$ gs_om -t start;<br />
Starting cluster.</h1>
<p>=========================================<br />
Successfully started.<br />
[omm@ecs-e1b3 ~]$</p>
<h2><a id="_6openGauss
ommecse1b3__gs_om_t_status_377"></a>步骤 6确认openGauss数据库服务已启动。<br />
[omm@ecs-e1b3 ~]$ gs_om -t status;</h2>
<h2><a id="cluster_state____Normal
redistributing___No_380"></a>cluster_state   : Normal<br />
redistributing  : No</h2>
<p>[omm@ecs-e1b3 ~]$</p>
<p>步骤 7再次检查openGauss实例连接。<br />
[omm@ecs-e1b3 ~]$ gs_check -i CheckDBConnection<br />
Parsing the check items config file successfully<br />
Distribute the context file to remote hosts successfully<br />
Start to health check for the cluster. Total Items:1 Nodes:1</p>
<p>Checking…               [=========================] 1/1<br />
Start to analysis the check result<br />
CheckDBConnection…OK<br />
The item run on 1 nodes.  success: 1</p>
<p>Analysis the check result successfully<br />
Success.	All check items run completed. Total:1   Success:1<br />
For more information please refer to /opt/huawei/wisequery/script/gspylib/inspection/output/CheckReport_2020072140672174672.tar.gz</p>
<p>说明：<br />
CheckDBConnection…OK  表示连接检查项正常；<br />
Success.	All check items run completed. Total:1   Success:1  表示共检查1项并且检查结果成功。<br />
openGauss数据库运行健康状态检查实验结束。</p>
<p>3 数据库性能检查<br />
3.1 实验介绍<br />
3.1.1 关于本实验<br />
openGauss 不仅提供了gs_checkperf工具来帮助用户了解openGauss的负载情况。<br />
本实验主要是通过gs_checkperf工具来检查openGauss数据库性能以及通过EXPLAIN来进行SQL语句优化。<br />
3.1.2 实验目的<br />
掌握gs_checkperf工具的基本使用；<br />
3.2 通过gs_checkperf工具来检查数据库性能<br />
说明：<br />
gs_checkperf可以对以下级别进行检查：<br />
openGauss级别（主机CPU占用率、Gauss CPU占用率、I/O使用情况等）、<br />
节点级别（CPU使用情况、内存使用情况、I/O使用情况）、<br />
会话/进程级别（CPU使用情况、内存使用情况、I/O使用情况）、<br />
SSD性能（写入、读取性能）<br />
其中检查SSD性能要用root用户执行，检查openGauss性能要用openGauss安装用户执行<br />
本实验为检查openGauss性能。</p>
<p>步骤 1用ROOT用户登录装有openGauss数据库服务的操作系统然后用 su – omm命令切换至OMM用户环境，登录后信息如下。<br />
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64<br />
System information as of time: 	Tue Jul 21 09:21:11 CST 2020<br />
System load: 	0.01<br />
Processes: 	109<br />
Memory used: 	6.7%<br />
Swap used: 	0.0%<br />
Usage On: 	15%<br />
IP address: 	192.168.0.96<br />
Users online: 	1<br />
[root@ecs-e1b3 ~]# su - omm<br />
Last login: Fri Jul 10 19:05:39 CST 2020 on pts/0<br />
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64<br />
System information as of time: 	Tue Jul 21 09:21:25 CST 2020<br />
System load: 	0.01<br />
Processes: 	111<br />
Memory used: 	7.0%<br />
Swap used: 	0.0%<br />
Usage On: 	15%<br />
IP address: 	192.168.0.96<br />
Users online: 	1<br />
[omm@ecs-e1b3 ~]$</p>
<h1><a id="_2gs_checkperfgsqlpostgres26000
ommecse1b3__gs_om_t_start
Starting_cluster_445"></a>步骤 2先启动数据库服务，再用gs_checkperf检查下，再使用gsql客户端以管理员用户身份连接postgres数据库，假设端口号为26000。<br />
先启动数据库服务。<br />
[omm@ecs-e1b3 ~]$ gs_om -t start;<br />
Starting cluster.</h1>

<h2><a id="
Successfully_started
gs_checkperf
ommecse1b3__gs_checkperf
Cluster_statistics_information
____Host_CPU_busy_time_ratio_________________________72________
____MPPDB_CPU_time__in_busy_time____________________33________
____Shared_Buffer_Hit_ratio__________________________9733______
____Inmemory_sort_ratio_____________________________0
____Physical_Reads___________________________________466
____Physical_Writes__________________________________175
____DB_size__________________________________________47_________MB
____Total_Physical_writes____________________________175
____Active_SQL_count_________________________________3
Session_count____________________________________4
openGauss
ommecse1b3__gs_om_t_status_450"></a>=========================================<br />
Successfully started.<br />
用gs_checkperf检查下。<br />
[omm@ecs-e1b3 ~]$ gs_checkperf<br />
Cluster statistics information:<br />
Host CPU busy time ratio                     :    .72        %<br />
MPPDB CPU time % in busy time                :    .33        %<br />
Shared Buffer Hit ratio                      :    97.33      %<br />
In-memory sort ratio                         :    0<br />
Physical Reads                               :    466<br />
Physical Writes                              :    175<br />
DB size                                      :    47         MB<br />
Total Physical writes                        :    175<br />
Active SQL count                             :    3<br />
Session count                                :    4<br />
确认openGauss数据库服务是否正常。<br />
[omm@ecs-e1b3 ~]$ gs_om -t status;</h2>
<h2><a id="cluster_state____Unavailable
redistributing___No_468"></a>cluster_state   : Unavailable<br />
redistributing  : No</h2>
<h1><a id="cluster_state___Normal__Unavailable


ommecse1b3__gs_om_t_start
Starting_cluster_471"></a>cluster_state  : Normal  表示已启动，可以正常使用。如果状态为Unavailable表示不可用<br />
为了实验继续进行，请先启动数据库服务。<br />
启动数据库服务（如果数据库服务是正常的，此步骤可以不执行）。<br />
[omm@ecs-e1b3 ~]$ gs_om -t start;<br />
Starting cluster.</h1>
<p>=========================================<br />
Successfully started.<br />
然后连接postgres数据库。<br />
[omm@ecs-e1b3 ~]$ gsql -d postgres -p 26000 -r<br />
gsql ((openGauss 1.0.0 build 38a9312a) compiled at 2020-05-27 14:57:08 commit 472 last mr 549 )<br />
Non-SSL connection (SSL connection is recommended when requiring high-security)<br />
Type “help” for help.<br />
postgres=#</p>
<p>步骤 3对PMK模式下的表进行统计信息收集。<br />
postgres=# analyze pmk.pmk_configuration;<br />
ANALYZE<br />
postgres=# analyze pmk.pmk_meta_data;<br />
ANALYZE<br />
postgres=# analyze pmk.pmk_snapshot;<br />
ANALYZE<br />
postgres=# analyze pmk.pmk_snapshot_datanode_stat;<br />
ANALYZE<br />
postgres=#<br />
说明：<br />
gs_checkperf工具的监控信息依赖于pmk模式下的表的数据，如果pmk模式下的表未执行analyze操作，则可能导致gs_checkperf工具执行失败。</p>
<p>步骤 4执行简要性能检查。<br />
用 \q 先退出postgres数据库，然后在操作系统用户 omm 环境下去执行gs_checkperf检查工具，具体如下：<br />
postgres=#<br />
postgres=# \q<br />
[omm@ecs-e1b3 ~]$ gs_checkperf<br />
Cluster statistics information:<br />
Host CPU busy time ratio           :    1.66      % -----主机CPU占用率<br />
MPPDB CPU time % in busy time     :    2.51      % ----Gauss CPU占用率<br />
Shared Buffer Hit ratio             :    99.14    % ----共享内存命中率<br />
In-memory sort ratio                 :    0            —内存中排序比率<br />
Physical Reads                        :    504           —物理读次数<br />
Physical Writes                       :    162           —物理写次数<br />
DB size                                 :    57         MB —DB大小<br />
Total Physical writes               :    162         —总物理写次数<br />
Active SQL count                     :    4             —当前SQL执行数<br />
Session count                         :    5             —Session数量</p>
<p>步骤 5执行详细性能检查。<br />
[omm@ecs-e1b3 ~]$ gs_checkperf --detail<br />
Cluster statistics information:<br />
Host CPU usage rate:<br />
Host total CPU time                          :    45719980.000 Jiffies<br />
Host CPU busy time                           :    761060.000 Jiffies<br />
Host CPU iowait time                         :    6640.000   Jiffies<br />
Host CPU busy time ratio                     :    1.66       %<br />
Host CPU iowait time ratio                   :    .01        %<br />
MPPDB CPU usage rate:<br />
MPPDB CPU time % in busy time                :    5.12       %<br />
MPPDB CPU time % in total time               :    .09        %<br />
Shared buffer hit rate:<br />
Shared Buffer Reads                          :    1057<br />
Shared Buffer Hits                           :    139798<br />
Shared Buffer Hit ratio                      :    99.25      %<br />
In memory sort rate:<br />
In-memory sort count                         :    0<br />
In-disk sort count                           :    0<br />
In-memory sort ratio                         :    0<br />
I/O usage:<br />
Number of files                              :    106<br />
Physical Reads                               :    584<br />
Physical Writes                              :    362<br />
Read Time                                    :    5794       ms<br />
Write Time                                   :    4046       ms<br />
Disk usage:<br />
DB size                                      :    57         MB<br />
Total Physical writes                        :    362<br />
Average Physical write                       :    89471.08<br />
Maximum Physical write                       :    362<br />
Activity statistics:<br />
Active SQL count                             :    4<br />
Session count                                :    5<br />
Node statistics information:<br />
dn_6001:<br />
MPPDB CPU Time                               :    38960      Jiffies<br />
Host CPU Busy Time                           :    761060     Jiffies<br />
Host CPU Total Time                          :    45719980   Jiffies<br />
MPPDB CPU Time % in Busy Time                :    5.12       %<br />
MPPDB CPU Time % in Total Time               :    .09        %<br />
Physical memory                              :    7144341504 Bytes<br />
DB Memory usage                              :    14922285056 Bytes<br />
Shared buffer size                           :    1073741824 Bytes<br />
Shared buffer hit ratio                      :    99.25      %<br />
Sorts in memory                              :    0<br />
Sorts in disk                                :    0<br />
In-memory sort ratio                         :    0<br />
Number of files                              :    106<br />
Physical Reads                               :    584<br />
Physical Writes                              :    362<br />
Read Time                                    :    5794<br />
Write Time                                   :    4046<br />
Session statistics information(Top 10):<br />
Session CPU statistics:<br />
1 dn_6001-postgres-omm:<br />
Session CPU time                             :    2<br />
Database CPU time                            :    39020<br />
Session CPU time %                           :    .01        %<br />
……………<br />
Session Memory statistics:<br />
1 dn_6001-postgres-omm:<br />
Buffer Reads                                 :    1309<br />
Shared Buffer Hit ratio                      :    93.03<br />
In Memory sorts                              :    0<br />
In Disk sorts                                :    0<br />
In Memory sorts ratio                        :    0<br />
Total Memory Size                            :    7433136<br />
Used Memory Size                             :    6443268<br />
…………………<br />
Session IO statistics:<br />
1 dn_6001-postgres-omm:<br />
Physical Reads                               :    98<br />
Read Time                                    :    1069<br />
2 dn_6001-postgres-omm:<br />
Physical Reads                               :    13<br />
Read Time                                    :    173<br />
…………<br />
[omm@ecs-e1b3 ~]$<br />
gs_checkperf 检查实验结束。<br />
3.3 通过EXPLAIN进行SQL语句优化<br />
说明：<br />
使用explain能显示SQL语句的执行计划;<br />
执行计划将显示SQL语句所引用的表会采用什么样的扫描方式，如：简单的顺序扫描、索引扫描等。如果引用了多个表，执行计划还会显示用到的JOIN算法;<br />
执行计划的最关键的部分是语句的预计执行开销，这是计划生成器估算执行该语句将花费多长的时间;<br />
若指定了ANALYZE选项，则该语句模拟执行并形成最优的执行计划（并非真正执行），然后根据实际的运行结果显示统计数据，包括每个计划节点内时间总开销（毫秒为单位）和实际返回的总行数。这对于判断计划生成器的估计是否接近现实非常有用。</p>
<p>步骤 1用ROOT用户登录装有openGauss数据库服务的操作系统然后用 su – omm命令切换至OMM用户环境，登录后信息如下。<br />
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64<br />
System information as of time: 	Tue Jul 21 09:21:11 CST 2020<br />
System load: 	0.01<br />
Processes: 	109<br />
Memory used: 	6.7%<br />
Swap used: 	0.0%<br />
Usage On: 	15%<br />
IP address: 	192.168.0.96<br />
Users online: 	1<br />
[root@ecs-e1b3 ~]# su - omm<br />
Last login: Fri Jul 10 19:05:39 CST 2020 on pts/0<br />
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64<br />
System information as of time: 	Tue Jul 21 09:21:25 CST 2020<br />
System load: 	0.01<br />
Processes: 	111<br />
Memory used: 	7.0%<br />
Swap used: 	0.0%<br />
Usage On: 	15%<br />
IP address: 	192.168.0.96<br />
Users online: 	1<br />
[omm@ecs-e1b3 ~]$</p>
<h1><a id="_2gsqlpostgres26000

ommecse1b3__gs_om_t_start
Starting_cluster_626"></a>步骤 2先启动数据库服务，然后使用gsql客户端以管理员用户身份连接postgres数据库，假设端口号为26000。<br />
启动数据库服务。<br />
[omm@ecs-e1b3 ~]$ gs_om -t start;<br />
Starting cluster.</h1>
<p>=========================================<br />
Successfully started.<br />
然后连接postgres数据库。<br />
[omm@ecs-e1b3 ~]$ gsql -d postgres -p 26000 -r<br />
gsql ((openGauss 1.0.0 build 38a9312a) compiled at 2020-05-27 14:56:08 commit 472 last mr 549 )<br />
Non-SSL connection (SSL connection is recommended when requiring high-security)<br />
Type “help” for help.</p>
<p>postgres=#</p>
<p>步骤 3创建student表。<br />
postgres=# CREATE TABLE student<br />
(       std_id INT NOT NULL,<br />
std_name VARCHAR(20) NOT NULL,<br />
std_sex VARCHAR(6),<br />
std_birth DATE,<br />
std_in DATE NOT NULL,<br />
std_address VARCHAR(100)<br />
);</p>
<p>CREATE TABLE</p>
<p>步骤 4表数据插入。<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (1,‘张一’,‘男’,‘1993-01-01’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (2,‘张二’,‘男’,‘1993-01-02’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (3,‘张三’,‘男’,‘1993-01-03’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (4,‘张四’,‘男’,‘1993-01-04’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (5,‘张五’,‘男’,‘1993-01-05’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (6,‘张六’,‘男’,‘1993-01-06’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (7,‘张七’,‘男’,‘1993-01-07’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (8,‘张八’,‘男’,‘1993-01-08’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (9,‘张九’,‘男’,‘1993-01-09’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (10,‘李一’,‘男’,‘1993-01-10’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (11,‘李二’,‘男’,‘1993-01-11’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (12,‘李三’,‘男’,‘1993-01-12’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (13,‘李四’,‘男’,‘1993-01-13’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (14,‘李五’,‘男’,‘1993-01-14’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (15,‘李六’,‘男’,‘1993-01-15’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (16,‘李七’,‘男’,‘1993-01-16’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (17,‘李八’,‘男’,‘1993-01-17’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (18,‘李九’,‘男’,‘1993-01-18’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (19,‘王一’,‘男’,‘1993-01-19’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (20,‘王二’,‘男’,‘1993-01-20’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (21,‘王三’,‘男’,‘1993-01-21’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (22,‘王四’,‘男’,‘1993-01-22’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (23,‘王五’,‘男’,‘1993-01-23’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (24,‘王六’,‘男’,‘1993-01-24’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (25,‘王七’,‘男’,‘1993-01-25’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (26,‘王八’,‘男’,‘1993-01-26’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (27,‘王九’,‘男’,‘1993-01-27’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (28,‘钱一’,‘男’,‘1993-01-28’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (29,‘钱二’,‘男’,‘1993-01-29’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (30,‘钱三’,‘男’,‘1993-01-30’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (31,‘钱四’,‘男’,‘1993-02-01’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (32,‘钱五’,‘男’,‘1993-02-02’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (33,‘钱六’,‘男’,‘1993-02-03’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (34,‘钱七’,‘男’,‘1993-02-04’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (35,‘钱八’,‘男’,‘1993-02-05’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (36,‘钱九’,‘男’,‘1993-02-06’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (37,‘吴一’,‘男’,‘1993-02-07’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (38,‘吴二’,‘男’,‘1993-02-08’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (39,‘吴三’,‘男’,‘1993-02-09’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (40,‘吴四’,‘男’,‘1993-02-10’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (41,‘吴五’,‘男’,‘1993-02-11’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (42,‘吴六’,‘男’,‘1993-02-12’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (43,‘吴七’,‘男’,‘1993-02-13’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (44,‘吴八’,‘男’,‘1993-02-14’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (45,‘吴九’,‘男’,‘1993-02-15’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (46,‘柳一’,‘男’,‘1993-02-16’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (47,‘柳二’,‘男’,‘1993-02-17’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (48,‘柳三’,‘男’,‘1993-02-18’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (49,‘柳四’,‘男’,‘1993-02-19’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (50,‘柳五’,‘男’,‘1993-02-20’,‘2011-09-01’,‘江苏省南京市雨花台区’);</p>
<h2><a id="_5
postgres_select_count_from_student
_count_705"></a>步骤 5数据查询统计。。<br />
postgres=# select count(*) from student;<br />
count</h2>
<pre><code>50
</code></pre>
<p>(1 row)</p>
<p>postgres=# select * from student order by std_id;<br />
std_id | std_name | std_sex |      std_birth      |       std_in        |     std_address<br />
--------±---------±--------±--------------------±--------------------±---------------------<br />
1 | 张一     | 男      | 1993-01-01 00:00:00 | 2011-09-01 00:00:00 | 江苏省南京市雨花台区<br />
2 | 张二     | 男      | 1993-01-02 00:00:00 | 2011-09-01 00:00:00 | 江苏省南京市雨花台区<br />
3 | 张三     | 男      | 1993-01-03 00:00:00 | 2011-09-01 00:00:00 | 江苏省南京市雨花台区<br />
4 | 张四     | 男      | 1993-01-04 00:00:00 | 2011-09-01 00:00:00 | 江苏省南京市雨花台区<br />
………………</p>
<p>步骤 6查看表信息。<br />
postgres=# \d student<br />
Table “public.student”<br />
Column    |              Type              | Modifiers<br />
-------------±-------------------------------±----------<br />
std_id      | integer                        | not null<br />
std_name    | character varying(20)          | not null<br />
std_sex     | character varying(6)           |<br />
std_birth   | timestamp(0) without time zone |<br />
std_in      | timestamp(0) without time zone | not null<br />
std_address | character varying(100)         |</p>
<h2><a id="_7
postgres_ANALYZE_VERBOSE_student
INFO__analyzing_publicstudentdn_6001_pid48036
INFO__ANALYZE_INFO__student_scanned_1_of_1_pages_containing_50_live_rows_and_0_dead_rows_50_rows_in_sample_50_estimated_total_rowsdn_6001_pid48036
ANALYZE
ANALYZE_VERBOSE
_8
postgres_explain_select__from_student_where_std_id30
_______________________QUERY_PLAN_733"></a>步骤 7收集表的统计信息。<br />
postgres=# ANALYZE VERBOSE student;<br />
INFO:  analyzing “public.student”(dn_6001 pid=48036)<br />
INFO:  ANALYZE INFO : “student”: scanned 1 of 1 pages, containing 50 live rows and 0 dead rows; 50 rows in sample, 50 estimated total rows(dn_6001 pid=48036)<br />
ANALYZE<br />
使用ANALYZE VERBOSE语句更新统计信息，会同时输出表的相关信息。<br />
步骤 8查看语句的执行计划。<br />
postgres=# explain select * from student where std_id=30;<br />
QUERY PLAN</h2>
<p>Seq Scan on student  (cost=0.00…1.62 rows=1 width=62)<br />
Filter: (std_id = 30)<br />
(2 rows)<br />
Seq Scan on student  表示使用的是全表扫描。</p>
<p>步骤 9给表添加主键。<br />
postgres=# alter table student add primary key (std_id);<br />
NOTICE:  ALTER TABLE / ADD PRIMARY KEY will create implicit index “student_pkey” for table “student”<br />
ALTER TABLE</p>
<h2><a id="_10

postgres_d_student
__________________Table_publicstudent
___Column__________________Type_______________Modifiers_

_std_id_______integer_________________________not_null
_std_name_____character_varying20___________not_null
_std_sex______character_varying6____________
_std_birth____timestamp0_without_time_zone__
_std_in_______timestamp0_without_time_zone__not_null
_std_address__character_varying100__________
Indexes
____student_pkey_PRIMARY_KEY_btree_std_id_TABLESPACE_pg_default
student_pkey_
_11hint
hint
postgres_explain_select_indexscanstudent_student_pkey__from_student_where_std_id30
_________________________________QUERY_PLAN_753"></a>步骤 10再次查看表信息。<br />
确定主键是否建好。<br />
postgres=# \d student<br />
Table “public.student”<br />
Column    |              Type              | Modifiers<br />
-------------±-------------------------------±----------<br />
std_id      | integer                        | not null<br />
std_name    | character varying(20)          | not null<br />
std_sex     | character varying(6)           |<br />
std_birth   | timestamp(0) without time zone |<br />
std_in      | timestamp(0) without time zone | not null<br />
std_address | character varying(100)         |<br />
Indexes:<br />
“student_pkey” PRIMARY KEY, btree (std_id) TABLESPACE pg_default<br />
student_pkey 为主键名称。<br />
步骤 11通过hint来优化语句扫描方式。<br />
通过加hint来使查询语句进行索引扫描。<br />
postgres=# explain select /<em>+indexscan(student student_pkey)</em>/ * from student where std_id=30;<br />
QUERY PLAN</h2>

<p>[Bypass]<br />
Index Scan using student_pkey on student  (cost=0.00…8.27 rows=1 width=62)<br />
Index Cond: (std_id = 30)<br />
(3 rows)</p>
<p>postgres=#<br />
Index Scan using student_pkey on student 表示语句通过student表上的主键索引student_pkey进行了索引扫描。<br />
步骤 12退出数据库<br />
postgres=# \q<br />
EXPLAIN进行SQL优化实验结束。</p>
<p>4 日志检查<br />
4.1 实验介绍<br />
4.1.1 关于本实验<br />
数据库运行时，某些操作在执行过程中可能会出现错误，数据库依然能够运行。但是此时数据库中的数据可能已经发生不一致的情况。建议检查openGauss运行日志，及时发现隐患。<br />
当openGauss发生故障时，使用 gs_collector 此工具收集OS信息、日志信息以及配置文件等信息，来定位问题。<br />
本实验主要是先手工设置收集配置信息，然后通过gs_collector工具调整用配置来收集相关日志信息。<br />
4.1.2 实验目的<br />
掌握gs_collector工具的基本使用；<br />
4.2 通过gs_collector工具来收集日志信息<br />
步骤 1设置收集配置文件。<br />
[omm@ecs-e1b3 ~]$ pwd<br />
/home/omm<br />
[omm@ecs-e1b3 ~]$ vi collector.json<br />
在用vi collector.json创建配置文件后，输入”i”进入INSERT模式，并将以下文本内容添加至配置文件中，具体如下：<br />
{<br />
“Collect”:<br />
[<br />
{“TypeName”: “System”, “Content”:“RunTimeInfo, HardWareInfo”,“Interval”:“0”, “Count”:“1”},<br />
{“TypeName”: “Log”, “Content” : “Coordinator,DataNode,Gtm,ClusterManager”, “Interval”:“0”, “Count”:“1”},<br />
{“TypeName”: “Database”, “Content”: “pg_locks,pg_stat_activity,pg_thread_wait_status”,“Interval”:“0”, “Count”:“1”},<br />
{“TypeName”: “Config”, “Content”: “Coordinator,DataNode,Gtm”, “Interval”:“0”, “Count”:“1”}<br />
]<br />
}<br />
内容添加好后，按下“Esc”键，然后输入“:wq”进行保存文件退出。<br />
配置文件中<br />
利用TypeName指定需要收集的信息类型；<br />
利用Content指定每一类信息的具体内容；<br />
利用Count指定此类信息收集的次数；<br />
利用Interval指定收集间隔，单位为秒；<br />
TypeName和Content不允许缺失或者内容为空；<br />
Interval和Count可以不指定，如果没有指定Count，则默认收集一次；<br />
如果没有指定Interval则表示间隔为0秒，Interval和Count的值不能小于0；<br />
如果不指定则使用默认的配置文件；<br />
可以根据gs_collector内容收集对照表进行个性化定制配置；<br />
配置文件格式采用json格式。</p>
<h2><a id="_2
ommecse1b3__gs_om_t_status_820"></a>步骤 2确定数据库服务是否启动。<br />
[omm@ecs-e1b3 ~]$ gs_om -t status;</h2>
<h2><a id="cluster_state____Unavailable
redistributing___No_823"></a>cluster_state   : Unavailable<br />
redistributing  : No</h2>
<h1><a id="cluster_state___Normal__Unavailable


ommecse1b3__gs_om_t_start
Starting_cluster_826"></a>cluster_state  : Normal  表示已启动，可以正常使用。如果状态为Unavailable表示不可用<br />
为了实验继续进行，请先启动数据库服务。<br />
启动数据库服务（如果数据库服务是正常状态，此步骤可以不执行）。<br />
[omm@ecs-e1b3 ~]$ gs_om -t start;<br />
Starting cluster.</h1>
<p>=========================================<br />
Successfully started.<br />
步骤 3收集OS信息及日志信息。<br />
begin-time、end-time的值根据自己实际想收集的时间来设置。<br />
[omm@ecs-e1b3 ~]$ gs_collector --begin-time=“20200720 23:00” --end-time=“20200729 20:00”  -C /home/omm/collector.json<br />
Successfully parsed the configuration file.<br />
create Dir.<br />
Successfully create dir.<br />
do system check interval 0 : count 1<br />
Collecting OS information.<br />
Failed to collect OS information.<br />
do database check interval 0 : count 1<br />
Collecting catalog statistics.<br />
Successfully collected catalog statistics.<br />
do log check interval 0 : count 1<br />
Collecting Log files.<br />
Successfully collected Log files.<br />
do Config check 0:1<br />
Collecting Config files.<br />
Successfully collected Config files.<br />
Collecting files.<br />
Successfully collected files.<br />
All results are stored in /opt/huawei/wisequery/omm_mppdb/collector_20200727_094932.tar.gz.<br />
收集完后，所有的结果存放在/opt/huawei/wisequery/omm_mppdb/collector_20200727_094932.tar.gz包中，请注意自己生成的文件包名称，因为每次的文件包名不一样。<br />
步骤 4查看日志信息。<br />
先进入日志包所在的目录，然后将日志包进行解压。<br />
[omm@ecs-e1b3 omm_mppdb]$ cd /opt/huawei/wisequery/omm_mppdb/<br />
[omm@ecs-e1b3 omm_mppdb]$ ll<br />
total 48K<br />
-rw------- 1 omm dbgrp 46K Jul 27 09:49 collector_20200727_094932.tar.gz<br />
[omm@ecs-e1b3 omm_mppdb]$ tar -zxvf collector_20200727_094932.tar.gz<br />
collector_20200727_094932/<br />
collector_20200727_094932/ecs-e1b3.tar.gz<br />
collector_20200727_094932/Summary.log<br />
collector_20200727_094932/Detail.log<br />
接下来，进入解压后的文件夹collector_20200727_094932，并对ecs-e1b3.tar.gz包进一步解压。<br />
[omm@ecs-e1b3 omm_mppdb]$ cd collector_20200727_094932<br />
[omm@ecs-e1b3 collector_20200727_094932]$ ll<br />
total 24K<br />
-rw-------. 1 omm dbgrp  16K Feb  7 15:16 db1.tar.gz<br />
-rw-------. 1 omm dbgrp 2.7K Feb  7 15:16 Detail.log<br />
-rw-------. 1 omm dbgrp 1.1K Feb  7 15:16 Summary.log<br />
[omm@ecs-e1b3 collector_20200727_094932]$ tar -zxvf db1.tar.gz<br />
ecs-e1b3/<br />
ecs-e1b3/logfiles/<br />
ecs-e1b3/logfiles/log_20200727_094935975042.tar.gz<br />
ecs-e1b3/planSimulatorfiles/<br />
ecs-e1b3/catalogfiles/<br />
ecs-e1b3/catalogfiles/dn_6001_pg_thread_wait_status_20200727_094935303146.csv<br />
ecs-e1b3/catalogfiles/gs_clean_20200727_094935470508.txt<br />
…………………………<br />
ecs-e1b3/systemfiles/<br />
ecs-e1b3/systemfiles/OS_information_20200727_094933424734.txt<br />
ecs-e1b3/systemfiles/database_system_info_20200727_094933446671.txt<br />
[omm@ecs-e1b3 collector_20200727_094932]$<br />
在解压的db1（指的是服务器名，各自的不一样，请注意观察）下有各种定制收集的日志类型目录如下：<br />
[omm@ecs-e1b3 collector_20200727_094932]$ cd db1<br />
[omm@ecs-e1b3 ecs-e1b3]$ ll<br />
total 32K<br />
drwx------ 2 omm dbgrp 4.0K Jul 27 09:49 catalogfiles<br />
drwx------ 2 omm dbgrp 4.0K Jul 27 09:49 configfiles<br />
drwx------ 2 omm dbgrp 4.0K Jul 27 09:49 coreDumpfiles<br />
drwx------ 2 omm dbgrp 4.0K Jul 27 09:49 gstackfiles<br />
drwx------ 2 omm dbgrp 4.0K Jul 27 09:49 logfiles<br />
drwx------ 2 omm dbgrp 4.0K Jul 27 09:49 planSimulatorfiles<br />
drwx------ 2 omm dbgrp 4.0K Jul 27 09:49 systemfiles<br />
drwx------ 2 omm dbgrp 4.0K Jul 27 09:49 xlogfiles<br />
[omm@ecs-e1b3 ecs-e1b3]$ cd catalogfiles/<br />
[omm@ecs-e1b3 catalogfiles]$ ll<br />
total 16K<br />
-rw------- 1 omm dbgrp  389 Jul 27 09:49 dn_6001_pg_locks_20200727_094934961507.csv<br />
-rw------- 1 omm dbgrp 1.4K Jul 27 09:49 dn_6001_pg_stat_activity_20200727_094935134988.csv<br />
-rw------- 1 omm dbgrp  878 Jul 27 09:49 dn_6001_pg_thread_wait_status_20200727_094935303146.csv<br />
-rw------- 1 omm dbgrp  281 Jul 27 09:49 gs_clean_20200727_094935470508.txt<br />
步骤 5下载收集后的日志文件。<br />
根据自己需要比如可以通过WinSCP或者XFTP等SSH工具将日志文件下载至自己本地电脑。<br />
使用root用户和密码登录数据库服务器（主机名为ecs的弹性公网IP）：</p>
<p>点击“打开目录/书签”，输入目录路径“/opt/huawei/wisequery/omm_mppdb/”，点击确定后进入此目录：</p>
<p>逐层查找到“catalogfiles”文件夹，点击选中文件夹，然后点击“下载”，下载到Windows对应文件夹下：</p>
<p>查看下载后的文件夹内容：</p>
<p>图4-1日志文件下载</p>
<h2><a id="5__
51_
511_

512_

52_
_1ROOTopenGauss_su__ommOMM
Welcome_to_419902003400036oe1aarch64
System_information_as_of_time_	Mon_Jul_27_112246_CST_2020
System_load_	003
Processes_	154
Memory_used_	23
Swap_used_	00
Usage_On_	14
IP_address_	192168012
Users_online_	3
rootecse1b3__su__omm
Last_login_Mon_Jul_27_092344_CST_2020_on_pts0
Welcome_to_419902003400036oe1aarch64
System_information_as_of_time_	Mon_Jul_27_112337_CST_2020
System_load_	001
Processes_	156
Memory_used_	24
Swap_used_	00
Usage_On_	14
IP_address_	192168012
Users_online_	3
_2openGauss
ommecse1b3__gs_om_t_status_920"></a>5 最大连接数设置<br />
5.1 实验介绍<br />
5.1.1 关于本实验<br />
当应用程序与数据库的连接数超过最大值，则新的连接无法建立。建议对连接数进行监控，及时释放空闲的连接或者增加最大连接数。<br />
本实验主要是讲如何来设置数据库最大连接个数。<br />
5.1.2 实验目的<br />
掌握对数据库最大连接数的设置方法。<br />
5.2 场景设置及操作步骤<br />
步骤 1用ROOT用户登录装有openGauss数据库服务的操作系统然后用 su – omm命令切换至OMM用户环境，登录后信息如下。<br />
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64<br />
System information as of time: 	Mon Jul 27 11:22:46 CST 2020<br />
System load: 	0.03<br />
Processes: 	154<br />
Memory used: 	2.3%<br />
Swap used: 	0.0%<br />
Usage On: 	14%<br />
IP address: 	192.168.0.12<br />
Users online: 	3<br />
[root@ecs-e1b3 ~]# su - omm<br />
Last login: Mon Jul 27 09:23:44 CST 2020 on pts/0<br />
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64<br />
System information as of time: 	Mon Jul 27 11:23:37 CST 2020<br />
System load: 	0.01<br />
Processes: 	156<br />
Memory used: 	2.4%<br />
Swap used: 	0.0%<br />
Usage On: 	14%<br />
IP address: 	192.168.0.12<br />
Users online: 	3<br />
步骤 2确认openGauss数据库服务是否启动<br />
[omm@ecs-e1b3 ~]$ gs_om -t status;</h2>
<h2><a id="cluster_name_____dbCluster
cluster_state____Normal
redistributing___No_952"></a>cluster_name    : dbCluster<br />
cluster_state   : Normal<br />
redistributing  : No</h2>
<p>cluster_state   : Normal  表示已启动，可以正常使用。如果状态为非Normal表示不可用<br />
为了实验场景设置，如果数据库服务没有启动，请执行步gs_om -t start 命令启动服务。<br />
步骤 3登录数据库<br />
使用gsql客户端以管理员用户身份连接postgres数据库，假设端口号为26000。<br />
[omm@ecs-e1b3 ~]$ gsql -d postgres -p 26000 -r<br />
gsql ((openGauss 1.0.0 build 38a9312a) compiled at 2020-05-27 14:57:08 commit 472 last mr 549 )<br />
Non-SSL connection (SSL connection is recommended when requiring high-security)<br />
Type “help” for help.</p>
<h2><a id="postgres
_4
postgres_select_count1_from_pg_stat_activity	
_count_965"></a>postgres=#<br />
步骤 4查看当前数据库已使用的连接数<br />
postgres=# select count(1) from pg_stat_activity;	<br />
count</h2>
<pre><code>10
</code></pre>
<h2><a id="1_row
1010
_5
postgres_SHOW_max_connections
_max_connections_971"></a>(1 row)<br />
10表示当前有10个应用已连接到数据库<br />
步骤 5查看数据库设置的最大连接数<br />
postgres=# SHOW max_connections;<br />
max_connections</h2>
<p>5000<br />
(1 row)<br />
5000 表示数据库设置的最大连接个数为5000。如果当前数据库已使用的连接数快接近于最大连接数时，运维人员先要果断的增加最大连接数以防系统新的连接无法建立。<br />
步骤 6调整最大连接数参数<br />
参数修改方式一：<br />
先 \q 退出数据库，然后在omm 用户环境下通过gs_guc工具来增大参数值，如下：<br />
[omm@ecs-e1b3 ~]$ gs_guc reload -I all -c “max_connections= 6000”;<br />
expected instance path: [/gaussdb/data/db1/postgresql.conf]<br />
gs_guc reload: max_connections=6000: [/gaussdb/data/db1/postgresql.conf]<br />
server signaled<br />
Total instances: 1. Failed instances: 0.<br />
Success to perform gs_guc!<br />
参数修改方式二：<br />
也可以用alter system set 语句来设置此参数，如下：<br />
[omm@ecs-e1b3 ~]$ gsql -d postgres -p 26000 -r<br />
gsql ((openGauss 1.0.0 build 38a9312a) compiled at 2020-05-27 14:57:08 commit 472 last mr 549 )<br />
Non-SSL connection (SSL connection is recommended when requiring high-security)<br />
Type “help” for help.</p>
<h1><a id="postgres_alter_system_set_max_connections6000
NOTICE__please_restart_the_database_for_the_POSTMASTER_level_parameter_to_take_effect
ALTER_SYSTEM_SET
postgresq
_7
gs_om_t_stopgs_om_t_start
ommecse1b3__gs_om_t_stop
Stopping_cluster_996"></a>postgres=# alter system set max_connections=6000;<br />
NOTICE:  please restart the database for the POSTMASTER level parameter to take effect.<br />
ALTER SYSTEM SET<br />
postgres=#\q<br />
步骤 7重启数据库<br />
gs_om -t stop先关闭数据库,然后用gs_om -t start再启动数据库<br />
[omm@ecs-e1b3 ~]$ gs_om -t stop;<br />
Stopping cluster.</h1>
<h1><a id="Successfully_stopped_cluster_1005"></a>Successfully stopped cluster.</h1>
<h1><a id="End_stop_cluster
ommecse1b3__gs_om_t_start
Starting_cluster_1007"></a>End stop cluster.<br />
[omm@ecs-e1b3 ~]$ gs_om -t start;<br />
Starting cluster.</h1>
<p>=========================================<br />
Successfully started.<br />
步骤 8验证参数设置是否成功<br />
使用gsql客户端以管理员用户身份连接postgres数据库，然后查看参数值。<br />
[omm@ecs-e1b3 ~]$ gsql -d postgres -p 26000 -r<br />
gsql ((openGauss 1.0.0 build 38a9312a) compiled at 2020-05-27 14:57:08 commit 472 last mr 549 )<br />
Non-SSL connection (SSL connection is recommended when requiring high-security)<br />
Type “help” for help.</p>
<h2><a id="postgres_SHOW_max_connections
_max_connections_1020"></a>postgres=# SHOW max_connections;<br />
max_connections</h2>
<p>6000<br />
(1 row)<br />
这里显示max_connections 为 6000，说明前面参数的修改已经生效。<br />
步骤 9退出数据库<br />
postgres=#\q<br />
最大连接数设置实验结束。</p>
<h1><a id="6__
61_
611_
VACUUM_FULLANALYZE
VACUUM_FULL
VACUUM
ANALYZEPG_STATISTIC

VACUUMVACUUM_FULL_FULLANALYZE
612_
VACUUMVACUUM_FULL_FULLANALYZE
62_
_1ROOTopenGauss_su__ommOMM
Welcome_to_419902003400036oe1aarch64
System_information_as_of_time_	Tue_Jul_27_162111_CST_2020
System_load_	001
Processes_	109
Memory_used_	67
Swap_used_	00
Usage_On_	15
IP_address_	192168096
Users_online_	1
rootecse1b3__su__omm
Last_login_Fri_Jul__27_162211_CST_2020_on_pts0
Welcome_to_419902003400036oe1aarch64
System_information_as_of_time_	Tue_Jul_27_162111_CST_2020
System_load_	001
Processes_	111
Memory_used_	70
Swap_used_	00
Usage_On_	15
IP_address_	192168096
Users_online_	1
ommecse1b3_
_2gsqlpostgres26000

ommecse1b3__gs_om_t_start
Starting_cluster_1030"></a>6 例行表、索引的维护<br />
6.1 实验介绍<br />
6.1.1 关于本实验<br />
为了保证数据库的有效运行，数据库必须在插入/删除操作后，基于客户场景，定期做VACUUM FULL和ANALYZE，更新统计信息，以便获得更优的性能；<br />
VACUUM FULL可回收已更新或已删除的数据所占据的磁盘空间，同时将小数据文件合并；<br />
VACUUM对每个表维护了一个可视化映射来跟踪包含对别的活动事务可见的数组的页。一个普通的索引扫描首先通过可视化映射来获取对应的数组，来检查是否对当前事务可见。若无法获取，再通过堆数组抓取的方式来检查。因此更新表的可视化映射，可加速唯一索引扫描；<br />
ANALYZE可收集与数据库中表内容相关的统计信息。统计结果存储在系统表PG_STATISTIC中。查询优化器会使用这些统计数据，生成最有效的执行计划。<br />
数据库经过多次删除操作后，索引页面上的索引键将被删除，造成索引膨胀。例行重建索引，可有效的提高查询效率。<br />
本实验主要是通过使用VACUUM、VACUUM FULL FULL来收缩表，用ANALYZE来收集表的统计信息以及对表上的索引进行重建。<br />
6.1.2 实验目的<br />
掌握VACUUM、VACUUM FULL FULL、ANALYZE基本的使用及如何重建索引；<br />
6.2 场景设置及操作步骤<br />
步骤 1用ROOT用户登录装有openGauss数据库服务的操作系统然后用 su – omm命令切换至OMM用户环境，登录后信息如下。<br />
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64<br />
System information as of time: 	Tue Jul 27 16:21:11 CST 2020<br />
System load: 	0.01<br />
Processes: 	109<br />
Memory used: 	6.7%<br />
Swap used: 	0.0%<br />
Usage On: 	15%<br />
IP address: 	192.168.0.96<br />
Users online: 	1<br />
[root@ecs-e1b3 ~]# su - omm<br />
Last login: Fri Jul  27 16:22:11 CST 2020 on pts/0<br />
Welcome to 4.19.90-2003.4.0.0036.oe1.aarch64<br />
System information as of time: 	Tue Jul 27 16:21:11 CST 2020<br />
System load: 	0.01<br />
Processes: 	111<br />
Memory used: 	7.0%<br />
Swap used: 	0.0%<br />
Usage On: 	15%<br />
IP address: 	192.168.0.96<br />
Users online: 	1<br />
[omm@ecs-e1b3 ~]$<br />
步骤 2启动服务器后，然后使用gsql客户端以管理员用户身份连接postgres数据库，假设端口号为26000。<br />
启动数据库服务。<br />
[omm@ecs-e1b3 ~]$ gs_om -t start;<br />
Starting cluster.</h1>
<p>=========================================<br />
Successfully started.<br />
连接postgres数据库。<br />
[omm@ecs-e1b3 ~]$ gsql -d postgres -p 26000 -r<br />
gsql ((openGauss 1.0.0 build 38a9312a) compiled at 2020-05-27 14:56:08 commit 472 last mr 549 )<br />
Non-SSL connection (SSL connection is recommended when requiring high-security)<br />
Type “help” for help.</p>
<p>postgres=#<br />
步骤 3创建student表<br />
postgres=# drop table student;<br />
postgres=# CREATE TABLE student<br />
(       std_id INT NOT NULL,<br />
std_name VARCHAR(20) NOT NULL,<br />
std_sex VARCHAR(6),<br />
std_birth DATE,<br />
std_in DATE NOT NULL,<br />
std_address VARCHAR(100)<br />
);</p>
<h2><a id="CREATE_TABLE
_4
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_11993010120110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_21993010220110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_31993010320110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_41993010420110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_51993010520110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_61993010620110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_71993010720110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_81993010820110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_91993010920110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_101993011020110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_111993011120110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_121993011220110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_131993011320110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_141993011420110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_151993011520110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_161993011620110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_171993011720110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_181993011820110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_191993011920110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_201993012020110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_211993012120110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_221993012220110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_231993012320110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_241993012420110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_251993012520110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_261993012620110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_271993012720110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_281993012820110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_291993012920110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_301993013020110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_311993020120110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_321993020220110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_331993020320110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_341993020420110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_351993020520110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_361993020620110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_371993020720110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_381993020820110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_391993020920110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_401993021020110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_411993021120110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_421993021220110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_431993021320110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_441993021420110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_451993021520110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_461993021620110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_471993021720110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_481993021820110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_491993021920110901
INSERT_INTO_studentstd_idstd_namestd_sexstd_birthstd_instd_address_VALUES_501993022020110901
_5
postgres_select_count_from_student
_count_1089"></a>CREATE TABLE<br />
步骤 4表数据插入<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (1,‘张一’,‘男’,‘1993-01-01’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (2,‘张二’,‘男’,‘1993-01-02’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (3,‘张三’,‘男’,‘1993-01-03’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (4,‘张四’,‘男’,‘1993-01-04’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (5,‘张五’,‘男’,‘1993-01-05’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (6,‘张六’,‘男’,‘1993-01-06’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (7,‘张七’,‘男’,‘1993-01-07’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (8,‘张八’,‘男’,‘1993-01-08’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (9,‘张九’,‘男’,‘1993-01-09’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (10,‘李一’,‘男’,‘1993-01-10’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (11,‘李二’,‘男’,‘1993-01-11’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (12,‘李三’,‘男’,‘1993-01-12’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (13,‘李四’,‘男’,‘1993-01-13’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (14,‘李五’,‘男’,‘1993-01-14’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (15,‘李六’,‘男’,‘1993-01-15’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (16,‘李七’,‘男’,‘1993-01-16’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (17,‘李八’,‘男’,‘1993-01-17’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (18,‘李九’,‘男’,‘1993-01-18’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (19,‘王一’,‘男’,‘1993-01-19’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (20,‘王二’,‘男’,‘1993-01-20’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (21,‘王三’,‘男’,‘1993-01-21’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (22,‘王四’,‘男’,‘1993-01-22’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (23,‘王五’,‘男’,‘1993-01-23’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (24,‘王六’,‘男’,‘1993-01-24’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (25,‘王七’,‘男’,‘1993-01-25’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (26,‘王八’,‘男’,‘1993-01-26’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (27,‘王九’,‘男’,‘1993-01-27’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (28,‘钱一’,‘男’,‘1993-01-28’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (29,‘钱二’,‘男’,‘1993-01-29’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (30,‘钱三’,‘男’,‘1993-01-30’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (31,‘钱四’,‘男’,‘1993-02-01’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (32,‘钱五’,‘男’,‘1993-02-02’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (33,‘钱六’,‘男’,‘1993-02-03’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (34,‘钱七’,‘男’,‘1993-02-04’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (35,‘钱八’,‘男’,‘1993-02-05’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (36,‘钱九’,‘男’,‘1993-02-06’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (37,‘吴一’,‘男’,‘1993-02-07’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (38,‘吴二’,‘男’,‘1993-02-08’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (39,‘吴三’,‘男’,‘1993-02-09’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (40,‘吴四’,‘男’,‘1993-02-10’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (41,‘吴五’,‘男’,‘1993-02-11’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (42,‘吴六’,‘男’,‘1993-02-12’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (43,‘吴七’,‘男’,‘1993-02-13’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (44,‘吴八’,‘男’,‘1993-02-14’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (45,‘吴九’,‘男’,‘1993-02-15’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (46,‘柳一’,‘男’,‘1993-02-16’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (47,‘柳二’,‘男’,‘1993-02-17’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (48,‘柳三’,‘男’,‘1993-02-18’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (49,‘柳四’,‘男’,‘1993-02-19’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
INSERT INTO student(std_id,std_name,std_sex,std_birth,std_in,std_address) VALUES (50,‘柳五’,‘男’,‘1993-02-20’,‘2011-09-01’,‘江苏省南京市雨花台区’);<br />
步骤 5数据查询统计<br />
postgres=# select count(*) from student;<br />
count</h2>
<pre><code>50
</code></pre>
<p>(1 row)</p>
<p>postgres=# select * from student order by std_id;<br />
std_id | std_name | std_sex |      std_birth      |       std_in        |     std_address<br />
--------±---------±--------±--------------------±--------------------±---------------------<br />
1 | 张一     | 男      | 1993-01-01 00:00:00 | 2011-09-01 00:00:00 | 江苏省南京市雨花台区<br />
2 | 张二     | 男      | 1993-01-02 00:00:00 | 2011-09-01 00:00:00 | 江苏省南京市雨花台区<br />
3 | 张三     | 男      | 1993-01-03 00:00:00 | 2011-09-01 00:00:00 | 江苏省南京市雨花台区<br />
4 | 张四     | 男      | 1993-01-04 00:00:00 | 2011-09-01 00:00:00 | 江苏省南京市雨花台区<br />
5 | 张五     | 男      | 1993-01-05 00:00:00 | 2011-09-01 00:00:00 | 江苏省南京市雨花台区<br />
………………<br />
步骤 6查看表信息<br />
postgres=# \d student<br />
Table “public.student”<br />
Column    |              Type              | Modifiers<br />
-------------±-------------------------------±----------<br />
std_id      | integer                        | not null<br />
std_name    | character varying(20)          | not null<br />
std_sex     | character varying(6)           |<br />
std_birth   | timestamp(0) without time zone |<br />
std_in      | timestamp(0) without time zone | not null<br />
std_address | character varying(100)         |<br />
步骤 7使用VACUUM命令，进行磁盘空间回收<br />
postgres=# vacuum student;<br />
VACUUM<br />
步骤 8删除表中数据<br />
postgres=# delete from student where std_id&gt;30;<br />
DELETE 20<br />
步骤 9使用VACUUM FULL命令，进行磁盘空间回收<br />
postgres=# vacuum full student;<br />
VACUUM<br />
步骤 10使用ANALYZE语句更新统计信息<br />
postgres=# analyze student;<br />
ANALYZE<br />
步骤 11使用ANALYZE VERBOSE语句更新统计信息，并输出表的相关信息<br />
postgres=# analyze verbose student;<br />
INFO:  analyzing “public.student”(dn_6001 pid=37195)<br />
INFO:  ANALYZE INFO : “student”: scanned 1 of 1 pages, containing 30 live rows and 20 dead rows; 30 rows in sample, 30 estimated total rows(dn_6001 pid=37195)<br />
ANALYZE<br />
步骤 12执行VACUUM ANALYZE命令进行查询优化<br />
postgres=# vacuum analyze student;<br />
VACUUM<br />
步骤 13查看特定表的统计信息<br />
postgres=# select relname,n_tup_ins,n_tup_upd,n_tup_del,last_analyze,vacuum_count from PG_STAT_ALL_TABLES where relname=‘student’;<br />
relname | n_tup_ins | n_tup_upd | n_tup_del |         last_analyze         | vacuum_count<br />
---------±----------±----------±----------±-----------------------------±-------------<br />
student |         50 |         0 |        20 | 2020-07-27 17:07:19.17167+08 |            3<br />
(1 row)<br />
postgres=#<br />
PG_STAT_ALL_TABLES视图将包含当前数据库中每个表的一行统计信息，以上查询结果中各列分别表示：<br />
Relname        表名<br />
n_tup_ins       插入行数<br />
n_tup_upd      更新行数<br />
n_tup_del       删除行数<br />
last_analyze     上次手动分析该表的时间<br />
vacuum_count    这个表被手动清理的次数<br />
步骤 14索引维护<br />
说明：<br />
如果数据发生大量删除后，索引页面上的索引键将被删除，导致索引页面数量的减少，造成索引膨胀。重建索引可回收浪费的空间。<br />
新建的索引中逻辑结构相邻的页面，通常在物理结构中也是相邻的，所以一个新建的索引比更新了多次的索引访问速度要快。<br />
重建索引有以下两种方式：<br />
1、使用REINDEX语句重建索引；<br />
2、先删除索引（DROP INDEX），再创建索引（CREATE INDEX）。<br />
先在student表的std_name列上创建一个索引，如下：<br />
postgres=# create index inx_stu01 on student(std_name);<br />
CREATE INDEX<br />
postgres=#<br />
方式1：使用REINDEX语句重建索引，具体如下：<br />
postgres=# reindex table student;<br />
REINDEX<br />
postgres=#<br />
方式2：先删除索引（DROP INDEX），再创建索引（CREATE INDEX），具体如下：<br />
postgres=# drop index inx_stu01;<br />
DROP INDEX<br />
postgres=# create index inx_stu01 on student(std_name);<br />
CREATE INDEX<br />
postgres=#<br />
查看表结构信息，具体如下：<br />
postgres=# \d student;<br />
Table “public.student”<br />
Column    |              Type              | Modifiers<br />
-------------±-------------------------------±----------<br />
std_id      | integer                        | not null<br />
std_name    | character varying(20)          | not null<br />
std_sex     | character varying(6)           |<br />
std_birth   | timestamp(0) without time zone |<br />
std_in      | timestamp(0) without time zone | not null<br />
std_address | character varying(100)         |<br />
Indexes:<br />
“inx_stu01” btree (std_name) TABLESPACE pg_default<br />
步骤 15退出数据库<br />
postgres=#\q<br />
例行表、索引的维护实验结束。</p>
<p>实验结果：<br />
截图一：操作系参数检查截图<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-94212ef2-85e6-4e4c-8114-62b60aa8a00d.png" alt="图片1.png" /><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-cd3b1b2a-46b5-44d3-83ed-42e8e6b1c3fd.png" alt="图片2.png" /><br />
截图二：设置最大连接数<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-84bb372d-e900-4137-926b-6ec3fe6bd279.png" alt="图片3.png" /><img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-e03e3a3d-1a57-4ac5-9e80-4b0449e41719.png" alt="图片4.png" /><br />
截图三：<br />
<img src="https://oss-emcsprod-public.modb.pro/image/editor/20210705-4c443d78-a102-4d12-887a-6ee5223f6cf1.png" alt="图片5.png" /><br />
分析总结：
本次实验我掌握了系统参数检查、openGauss健康状态检查、数据库性能检查、日志检查和清理等操作。实验比较简单，没有遇到什么问题。

