+++

title = "当使用git出现错误 fatal: 'upstream' does not appear to be a git repository时怎么办？" 

date = "2022-08-30" 

tags = ["当使用git出现错误 fatal: 'upstream' does not appear to be a git repository时怎么办"] 

archives = "2022-08" 

author = "张翠娉" 

summary = "当使用git出现错误 fatal: 'upstream' does not appear to be a git repository时怎么办"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "14:20"

+++

# 当使用git出现错误 fatal: 'upstream' does not appear to be a git repository时怎么办？

**背景介绍**：

在使用git工具时，遇到如下错误。

**报错内容**：

```bash
$ git fetch upstream
fatal: 'upstream' does not appear to be a git repository
fatal: Could not read from remote repository.
```

**解决办法**：

1. 执行如下命令添加openGauss 社区blog仓为upstream。

   ```bash
   git remote add upstream https://gitee.com/opengauss/blog.git
   ```

2. 执行如下命令查看是否origin和远程upstream都已添加。

   ```bash
   $ git remote -v
   origin  https://gitee.com/zcp100_zcp100/blog.git (fetch)
   origin  https://gitee.com/zcp100_zcp100/blog.git (push)
   upstream        https://gitee.com/opengauss/blog.git (fetch)
   upstream        https://gitee.com/opengauss/blog.git (push)
   ```

   如果显示以上结果 ，表明都已添加。可执行commit提交文档。