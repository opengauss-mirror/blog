+++

title = "当使用git出现冲突提示时如果解决？" 

date = "2022-09-01" 

tags = ["当使用git出现冲突提示时如果解决"] 

archives = "2022-09" 

author = "张翠娉" 

summary = "当使用git出现冲突提示时如果解决"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "14:20"

+++

# 当使用git出现冲突提示时如果解决？

**背景介绍**：

在使用git工具时，遇到如下错误。

**报错内容**：

```bash
error: Your local changes to 'c/environ.c' would be overwritten by merge.  Aborting.
Please, commit your changes or stash them before you can merge.

```

**报错原因**：多人编辑了同一个文件，并提交即会产生冲突

**解决办法**：

1. 拉取远程分支

   ```
   git fetch upstream
   ```

2. 寻找冲突文件

   ```
   git rebase upstream/master
   ```

3. 修改冲突文档。

4. 修改完成后，执行如下命令

   ```
   git rebase --continue
   ```

5. 添加更新后的文档到缓存区。

   ```
   git add .
   ```

6. 将文件推送到远程仓库

   ```
   git push 或 git push --force
   ```

