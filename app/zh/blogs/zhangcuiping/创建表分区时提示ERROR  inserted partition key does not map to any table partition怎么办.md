---
title: '创建表分区时提示ERROR:  inserted partition key does not map to any table partition怎么办'

date: '2022-11-02'
category: 'blog'
tags: ['数据库入门']

archives: '2022-10'

author: '张翠娉'

summary: '创建表分区时提示ERROR:  inserted partition key does not map to any table partition怎么办'

img: ''

times: '14:20'
---

# 创建表分区时提示 ERROR: inserted partition key does not map to any table partition 怎么办

**背景介绍**

在创建普通表，并插入数据后。往范围分区表插入普通表数据时遇到如下错误。

**报错**

![img](./title/img1.png)

**解决办法**

创建范围分区表时，将最后分区的边界改为 maxvalue 就可以了。

![img](./title/img2.png)

![img](./title/img3.png)

![img](./title/img4.png)
