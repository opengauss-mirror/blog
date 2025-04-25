---
title: 'Guidance to Post a Blog'
category: 'blog'
---

## Preparation

- Refer to <https://docs.gitcode.com/docs/start/quick> to register GitCode account.

- et your primary mail box in GitCode settings <http://gitcode.com/setting/email>.

- Sign your CLA in <https://www.opengauss.org/en/contribution/>.

- Prepare your git environment refering to <https://docs.gitcode.com/docs/help/home/general-reference/git> .

## Understand blog format

The openGauss blog is written in markdown format. You can read <https://gitcode.com/opengauss/blog/blob/v2/app/zh/blogs/blog_example/20220901-sample-post.md> to get understand how the blog is designed.

The head includes the following information:

```
---
title: 'Sample Post'
date: '2020-03-03'
category: 'blog'
tags: ['openGauss']
archives: '2020-03'
author: 'openGaussBlog Maintainer'
summary: 'Just about everything you'll need to style in the theme：headings, paragraphs, blockquotes, tables, code blocks, and more.'
---

Here you can edit your blog.
```

Tips: you can copy <https://gitcode.com/opengauss/blog/blob/v2/app/zh/blogs/blog_example/20220901-sample-post.md> to your folder and edit it.

## Post your blog

The blog posting follows the pull request of GitCode.

- Fork openGauss blog project <https://gitcode.com/opengauss/blog/tree/v2> to your own GitCode. Refer to <https://docs.gitcode.com/docs/help/home/org_project/pullrequests/> for detailed guidance.

- Clone the code to your local environment.

  ```
  git clone https://gitcode.com/<your-gitcode-id>/openGauss-blog
  ```

- Create a branch

  ```
  git checkout -b <branch-name>
  ```

- Create a folder in the website floder If you are going to post a blog in English, the app/en/blog is your work path.

  And if you are going to post a blog in Chinese, the app/zh/blog is your work path.

  Assume that you are preparing an English blog.

  ```
  cd app/en/blogs
  mkdir <your-gitcode-id>
  cd <your-gitcode-id>
  touch YEAR-MONTH-DAY-title.md
  ```

  And You can put the resources in the same folder as your text file's, and name the resources as

  ```
  YEAR-MONTH-DAY-title-NN.MARKUP
  ```

  Where the YEAR, MONTH, DAY, and title are the same as your blog file, and NN is the serial number of the pictures, like 01, 02 and so on. The MARKUP is the file extension, and for pictures it is recommended to use png. The following are one example.

  ```
  2020-01-01-new-years-is-coming.md
  2020-01-01-new-years-is-coming-01.png
  2020-01-01-new-years-is-coming-02.gif
  2020-01-01-new-years-is-coming-03.pdf
  ```

- Commit your post

  ```
  git add <file-path>
  git commit -m "<message>"
  git push origin <branch-name>:<branch-name>
  ```

- Refer to <https://docs.gitcode.com/docs/help/home/org_project/pullrequests/pr-create> to submit your Pull Request

- Wait for reviewing and merging.
