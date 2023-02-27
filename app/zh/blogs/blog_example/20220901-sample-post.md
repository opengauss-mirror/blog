---
title: 'Sample Post'
date: '2021-09-26'
category: 'blog'
tags: ['openGauss']
archives: '2021-09'
author: 'openGauss'
summary: 'openGauss社区开发入门'
---

## HTML Elements

Below is just about everything you'll need to style in the blog.

# Heading 1

## Heading 2

### Heading 3

#### Heading 4

### Body text

This blog is about bla **This is strong**.

### Quotation

> The sites that have been chosen are listed and described next to each work, with encapsulating quotes or pieces of text narrating central themes for the groups.

## List Types

### Ordered Lists

1. Item one
   1. sub item one
   2. sub item two
   3. sub item three
2. Item two

### Unordered Lists

- Item one
- Item two
- Item three

## Tables

| Header1 | Header2 | Header3 |
| :------ | :-----: | ------: |
| cell1   |  cell2  |   cell3 |
| cell4   |  cell5  |   cell6 |

## Code

```
struct async_entry {
	struct list_head	domain_list;
	struct list_head	global_list;
	struct work_struct	work;
	async_cookie_t		cookie;
	async_func_t		func;
	void			*data;
	struct async_domain	*domain;
};
```
