## 介绍

自 2023 年 07 月起，v2 分支 替代 master，作为 openGauss 官方博客仓库。

## 准备

1. 参考 http://git.mydoc.io/?t=179267 注册 Gitee 账号。

2. 在 Gitee 个人设置中设置主邮箱地址，在此 https://gitee.com/profile/emails。

3. 签署贡献者协议，https://www.opengauss.org/zh/contribution/。

4. 参考 http://git.mydoc.io/?t=180692 准备你的 git 环境

## 理解博客格式

openGauss 是用 markdown 格式写博客的。

文件头需要包含如下信息：

```
---
title: "Sample Post"
date: '2020-03-03'
category: 'blog'
tags: ['openGauss']
archives: '2020-03'
author:'openGaussBlog Maintainer'
summary: "Just about everything you'll need to style in the theme：headings, paragraphs, blockquotes, tables, code blocks, and more."
---

Here you can edit your blog.
```

小提示：你可以复制 [https://gitee.com/opengauss/website/blob/v2/app/zh/blogs/blog_example/20220901-sample-post.md](https://gitee.com/opengauss/website/blob/v2/app/zh/blogs/blog_example/20220901-sample-post.md) 到你的工作路径下然后继续编辑。

### 关于格式

**站点使用了 vitepress 框架提供了更好的 SEO，及更快的加载速度,但也有更严格的打包规则，以下规则非常重要我们建议你花几分钟阅读：**

- md 文件的文件名中禁止包含 **+** 号。
- 图片命名禁止 **空格** 、且大小写敏感，建议统一使用小写命名加中划线连接。如 blog-example.png。
- &lt;font&gt; &lt;/font&gt; &lt;center&gt; &lt;/center&gt; 属于已弃用标签，vitepress 将不再支持，如有需要可以使用 &lt;div align=center&gt; &lt;/div&gt;。
- md 中如需使用 HTML 标签，该标签需要闭合，如&lt;div&gt; &lt;/div&gt;。
- 暂不支持 c++ 语言代码块，如果你有 c++代码需要展示，请不要指定代码块语言，而是采用默认语言。
- 如果您的博客中包含代码、文件路径、键名、命令请使用代码块将其包裹。

## 提交博客

博客的提交利用了 Gitee 的 PR(Pull Request)。

1. Fork openGauss 博客项目 <https://gitee.com/opengauss/blog/tree/v2> 到你自己的 Gitee 上。如果需要具体指导请参考 <http://git.mydoc.io/?t=153749> 。

2. Clone 代码

```
git clone https://gitee.com/<your-gitee-id>/openGauss-blog
```

3. 创建分支

```
git checkout -b <branch-name>
```

4. 创建工作路径

如果你发表中文博客，工作路径是 `app/zh/blogs` 。
假设你要写一个中文博客：

```
cd app/zh/blogs
mkdir <your-gitee-id>
cd <your-gitee-id>
touch YEAR-MONTH-DAY-title.md
```

你可以以你的 md 文档名来命名你的资源文件，方便使用。例如：

```
YEAR-MONTH-DAY-title-NN.MARKUP
```

其中，YEAR, MONTH, DAY, 和 title 和你的博客 md 文件名一致。NN 是 01、02、03 这样的序号。MARKUP 文件扩展名。如下例子：

```
2020-01-01-new-years-is-coming.md
2020-01-01-new-years-is-coming-01.png
2020-01-01-new-years-is-coming-02.gif
2020-01-01-new-years-is-coming-03.pdf
```

使用 HTML \<img\> 标签嵌入图片， 但你的图片资源需要放入当前目录下（即 your-gitee-id 目录下），输入图片名称作为 src 值：

```
<img src = "./2020-01-01-new-years-is-coming-01.png">
```

1. Commit 你的博客

```
git add <file-path>
git commit -m "<message>"
git push origin <branch-name>:<branch-name>
```

2. 参考 <http://git.mydoc.io/?t=153749> 提交你的 PR

3. 等待评审和合入。
