---
title: '循序渐进MogDB：通过 copy 加载 CSV 文件到数据库'

date: '2022-10-07'
category: 'blog'
tags: ['循序渐进MogDB：通过 copy 加载 CSV 文件到数据库']

archives: '2022-10'

author: '盖国强'

summary: '循序渐进MogDB：通过 copy 加载 CSV 文件到数据库'

img: ''

times: '10:20'
---

# 循序渐进 MogDB：通过 copy 加载 CSV 文件到数据库

通过 copy 命令可以将 csv 文件中的数据，导入到 MogDB 数据库中。

可以先建立临时表，类似如下命令，可以完成数据加载。

```
copy target_table_name (field_1, field_2, field_3)
from '/tmp/imp_csv_data.csv'
with (
FORMAT csv,
DELIMITER ',',
escape '\',
header true,
quote '"',
encoding 'UTF8')
```

其中：

format 指定导入的文件格式为 csv 格式 delimiter 指定了字段之间的分隔符号位逗号 escape 指定了在引号中的转义字符为反斜杠，这样即使在引号字串中存在引号本身，也可以用该字符进行转义，变为一般的引号字符，而不是字段终结 header true：指定文件中存在表头。

如果没有的话，则设置为 falsequote 指定了以双引号作为字符串字段的引号，这样它会将双引号内的内容作为一个字段值来进行处理 encoding 指定了文件的编码格式为 utf8, 如果是别的格式则修改为适当的编码格式.
