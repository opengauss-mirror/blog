---
title: 'Bash与shell的区别'

date: '2022-07-14'

category: 'blog'
tags: ['Bash与shell的区别']

archives: '2022-04'

author: '张翠娉'

summary: 'Bash与shell的区别'

img: '/zh/blogs/zhangcuiping/title/img.png'

times: '10:20'
---

# Bash 与 shell 的区别

## **介绍**

常见的 shell 解释器有 sh、bash 这两种，其他的 ksh、csh 和 zsh 等是不常见的。Mac OS 中默认安装了以上所有类型，Windows 需要自行安装，Linux 更不用说了。就像上面说的，只要一门语言有解释器，就可以作为 shell 使用。比如 Java 有第三方解释器 Jshell，PHP 有 PHP Shell。如果你用过 windows，那你对 cmd 这个词一定不陌生，它是 windows shell，官方名称叫做 command interpreter。

## bash

Bash 是最常见的 shell，Mac 中默认 shell 就是 bash。
[bash 官网这篇文章]描述了唤起 bash shell 时加载的不同文件：login shell 加载 \~/.bash_profile ，而 non-login shell 加载 \~/.bashrc 。

## shell

shell 是一个命令行解释器，顾名思义就是机器外面的一层壳，用于人机交互，只要是人与电脑之间交互的接口，就可以称为 shell。表现为其作用是用户输入一条命令，shell 就立即解释执行一条。不局限于系统、语言等概念、操作方式和表现方式等。 比如我们平时在黑框框里输入命令，叫 command-line interface (CLI)；在屏幕上点点点，叫 graphical user interface (GUI)

## 扩展学习

### Interactive 和 Non-interactive

Interactive，如果你打开 terminal，在里面输入 bash 代码，回车得到输出，你就是在运行一个 Interactive shell，它的特征是可以让用户输入，然后直接把输出打到界面上；如果你运行一个包含了若干行的 shell 脚本，这些 shell 代码就运行在 Non-interactive shell 中。

### zsh

很多人的 mac 中会使用 zsh 而不是 bash，一大半是因为 oh-my-zsh 这个配置集，它兼容 bash，还有自动补全等好用的功能。zsh 的配置文件\~/.zshrc
