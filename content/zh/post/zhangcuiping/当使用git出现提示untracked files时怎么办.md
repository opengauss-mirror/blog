+++

title = "当使用git出现提示untracked files时怎么办？" 

date = "2022-09-01" 

tags = ["当使用git出现提示untracked files时怎么办"] 

archives = "2022-09" 

author = "张翠娉" 

summary = "当使用git出现提示untracked files时怎么办"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "14:20"

+++

# 当使用git出现提示untracked files时怎么办？

**背景介绍**：

在使用git工具时，遇到如下错误。

**报错内容**：

```bash
$ git status
On branch master

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)

        docs/

nothing added to commit but untracked files present (use "git add" to track)

```

**报错原因**：未进入到正确目录下，要进入到untracked file的文件夹下即可

**解决办法**：

执行如下命令进入docs文件夹。

```bash
$ cd d:/opengauss/docs
$ git status
On branch z110
Your branch is up to date with 'upstream/master'.

nothing to commit, working tree clean
```