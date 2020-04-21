+++
title = "Guidance to Post a Blog"

+++


## Preparation

1. Refer to <a href="http://git.mydoc.io/?t=179267" target="_blank">http: //git.mydoc.io/?t=179267</a> to register Gitee account.

2. Set your primary mail box in gitee settings <a href="https://gitee.com/profile/emails" target="_blank">https: //gitee.com/profile/emails</a>.

3. Sign your CLA in <a href="https://openeuler.org/zh/cla.html" target="_blank">https: //openeuler.org/zh/cla.html</a>.

4. Prepare your git environment refering to <a href="http://git.mydoc.io/?t=180692" target="_blank">http: //git.mydoc.io/?t=180692</a>.

## Understand blog format

The openEuler blog is written in markdown format.
You can read <a href="https://gitee.com/openeuler/blog/blob/master/design/content_posts.md" target="_blank">https: //gitee.com/openeuler/blog/blob/master/design/content_posts.md</a> to get understand how the blog is designed.

The head includes the following information:
```
+++
title = "Sample Post"
date = "2020-03-03"
tags = ["Sample", "ABC", "cccc"]
archives = "2020-03"
author = "openEuler Blog Maintainer"
summary = "Just about everything you'll need to style in the theme: headings, paragraphs, blockquotes, tables, code blocks, and more."
+++

Here you can edit your blog. 
```

Tips: you can copy content/_example/2020-03-03-sample-post.md to your folder and edit it.

## Post your blog

The blog posting follows the pull request of <a href="https://gitee.com" target="_blank">Gitee</a>.

1. Fork openEuler blog project <a href="https://gitee.com/openeuler/blog" target="_blank">https: //gitee.com/openeuler/blog</a> to your own gitee. Refer to <a href="http://git.mydoc.io/?t=153749" target="_blank">http: //git.mydoc.io/?t=153749</a>for detailed guidance.

2. Clone the code to your local environment.

```
git clone https://gitee.com/<your-gitee-id>/blog
```

4. Create a branch

```
git checkout -b <branch-name>
```

5. Create a folder in the blog floder
```
cd content\post
mkdir <your-gitee-id>
cd <your-gitee-id>
touch YEAR-MONTH-DAY-title.md
```

And You can put the resources in the same folder as your text file's, and name the resources as 
```
YEAR-MONTH-DAY-title-NN.MARKUP
```
Where the YEAR, MONTH, DAY, and title are the same as your blog file, and NN is the serial number of the pictures, like 01, 02 and so on. The MARKUP is the file extension, and for pictures it is recommended to use png.
The following are one example.
```
2020-01-01-new-years-is-coming.md
2020-01-01-new-years-is-coming-01.png
2020-01-01-new-years-is-coming-02.gif
2020-01-01-new-years-is-coming-03.pdf
```

6. Commit your post

```
git add <file-path>
git commit -m "<message>"
git push origin <branch-name>:<branch-name>
```

7. Refer to <a href="http://git.mydoc.io/?t=153749" target="_blank">http: //git.mydoc.io/?t=153749</a>to submit your Pull Request

8. Wait for reviewing and merging.
