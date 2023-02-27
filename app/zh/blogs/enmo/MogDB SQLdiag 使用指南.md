---
title: 'MogDB SQLdiag 使用指南'

date: '2022-06-27'

category: 'blog'
tags: ['MogDB SQLdiag 使用指南']

archives: '2022-06'

author: '云和恩墨'

summary: 'MogDB SQLdiag 使用指南'

img: '/zh/blogs/enmo/title/img.png'

times: '10:20'
---

# MogDB SQLdiag 使用指南

本文出处：[https://www.modb.pro/db/411957](https://www.modb.pro/db/411957)

## 前提条件

- 需要保证用户提供训练数据。
- 如果用户通过提供的工具收集训练数据，则需要启用 WDR 功能，涉及到的参数为 track_stmt_stat_level 和 log_min_duration_statement，具体情况见下面小节。
- 为保证预测准确率，用户提供的历史语句日志应尽可能全面并具有代表性。
- 按照要求配置 python 3.6+环境及其依赖。

## 环境配置

本功能运行环境要求 Python 3.6 版本及以上，需要的第三方依赖包记录在 requirements.txt 文件中，可以通过 pip install 命令安装依赖，如：

```
pip install requirements.txt
```

## SQL 流水采集方法

本工具需要用户提前准备数据，训练数据格式如下，每个样本通过换行符分隔：

```
SQL,EXECUTION_TIME
```

预测数据格式如下：

```
SQL
```

其中 SQL 表示**SQL 语句的文本**，EXECUTION_TIME 表示**SQL 语句的执行时间**，样例数据见 sample_data 中的 train.csv 和 predict.csv。

用户可以按照要求格式自己收集训练数据，工具也提供了脚本自动采集（load_sql_from_rd），该脚本基于 WDR 报告获取 SQL 信息，涉及到的参数有 log_min_duration_statement 和 track_stmt_stat_level：

- 其中 log_min_duration_statement 表示慢 SQL 阈值，如果为 0 则全量收集，时间单位为毫秒；
- track_stmt_stat_level 表示信息捕获的级别，建议设置为 track_stmt_stat_level=‘L0,L0’

参数开启后，可能占用一定的系统资源，但一般不大。持续的高并发场景可能产生 5%以内的损耗，数据库并发较低的场景，性能损耗可忽略。

```
使用脚本获取训练集方式：
load_sql_from_wdr.py [-h] --port PORT --start_time START_TIME
                            --finish_time FINISH_TIME [--save_path SAVE_PATH]
例如：
    python load_sql_from_wdr.py --start_time "2021-04-25 00:00:00" --finish_time "2021-04-26 14:00:00" --port 5432  --save_path ./data.csv

```

## 操作步骤

1. 提供历史日志以供模型训练

2. 进行训练与预测操作：

   ```
   基于模板法的训练与预测：
       python main.py [train, predict] -f FILE --model template --model-path template_model_path
   基于DNN的训练与预测：
       python main.py [train, predict] -f FILE --model dnn --model-path dnn_model_path
   ```

## 使用方法示例

在本工具的根目录中，执行下列语句可以实现对应功能。

使用提供的测试数据进行模板化训练：

```
python main.py train -f ./sample_data/train.csv --model template --model-path ./template
```

使用提供的测试数据进行模板化预测：

```
python main.py predict -f ./sample_data/predict.csv --model template --model-path ./template --predicted-file ./result/t_result
```

使用提供的测试数据进行模板化模型更新：

```
python main.py finetune -f ./sample_data/train.csv --model template --model-path ./template
```

使用提供的测试数据进行 DNN 训练：

```
python main.py train -f ./sample_data/train.csv --model dnn --model-path ./dnn_model
```

使用提供的测试数据进行 DNN 预测：

```
python main.py predict -f ./sample_data/predict.csv --model dnn --model-path ./dnn_model --predicted-file
```

使用提供的测试数据进行 DNN 模型更新：

```
python main.py finetune -f ./sample_data/train.csv --model dnn --model-path ./dnn_mo
```
