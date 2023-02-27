---
title: 'find命令的基本用法'

date: '2022-07-28'

category: 'blog'
tags: ['find命令的基本用法']

archives: '2022-07'

author: '张翠娉'

summary: 'find命令的基本用法'

img: '/zh/blogs/zhangcuiping/title/img.png'

times: '14:20'
---

# find 命令的基本用法

linux 中，find 命令一般用来按特定条件查找文件，生产环境中也常用其来过滤文件

**名称**：

find -搜索目录层次结构中的文件

**格式**：

find 【目录】{【选项】【参数】}......

**常见选项**：

- -type：指定要查找的文件类型（常用的有 1.f 普通文件 2.d 目录文件）
- -name：指定要查找的文件名 （文件名称可用通配符模糊匹配）
- ！：取反，在选项名称前加！可取反选项匹配的内容
- -exec：对查找到的内容执行相关操作，命令后要加“\;”为特定格式
- -and：与匹配，find 多条件查找时默认使用与匹配
- -or：或匹配
- -maxdepth：查找深度，1 个目录则为 1 层深度

**扩展**：

|：通过管道把 find 查找的内容传下去以完成一些不为人知的事情

xargs：将管道接收过来的内容进行整合成想要的形式以和其他命令配合使用

**简单用法**：

1. 查看当前目录的所有文件

   ```
   find .
   ```

2. 查看/test/目录下的常规文件

   ```
   find /test/ -type f
   ```

3. 查看/test/目录下名为 abc 的目录文件

   ```
   find /test/ -type d -name abc
   ```

4. 查看/test/目录下除了 abc 文件的其他常规文件

   ```
   find /test/ -type f! -name abc
   ```

5. 查看/test/目录下以.log 结尾的文件

   ```
   find /test/ -name *.log
   ```

6. 查看/test/目录下以.log 结尾的文件和 abc 文件

   ```
   find /test/ *.log -or -name abc
   ```

7. 查看/test/目录下 2 层目录内的文件

   ```
   find /test/ -maxdepth 2
   ```

8. 查找到/test/目录下以.log 结尾的文件并删除

   ```
   find /test/-type f -name *.log$ -exec rm {}\;
   或
   find /test/ -type f -name *.log | xargs rm
   ```
