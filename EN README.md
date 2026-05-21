# blog

## Introduction

Welcome to the official openGauss blog repository.

## How to Write a Blog on the Official Website

To publish your blog on the official website, you need to merge your content into the `opengauss/blog` project.

1. Fork the `opengauss/blog` project to your own repository, write your blog, and submit a Pull Request.

2. Create your own blog directory under `content/en/post/`. Blogs are generally written in Markdown format.

3. Store all images within your blog directory. For in-content images, use relative paths. For example, if an image is stored in `images/pic.png` within your directory, reference it as `../images/pic.png`. For the summary image displayed on the blog home page, use an absolute path, such as `/en/post/blogname/images/title.jpg`.

## How to Preview

To verify the blog format and ensure images are displayed properly:

> Blogs are Markdown files. You can use standard Markdown preview tools to check formatting.
> The blog project is a web service that you can run locally to see the final effect.

1. The blog project uses the Hugo framework (Go language). You must configure Hugo on your local machine.

2. Install Go (Windows): Download the Go SDK from studygolang.com/dl. Verify by running `go version` in your console.

3. Install Hugo (Windows): Download the appropriate version from <https://github.com/gohugoio/hugo/releases>. `hugo_extended_0.74.3_Windows-64bit.zip` is recommended.

4. Configure Hugo: Extract the Hugo package and add the path, for example, `D:\software\hugo` to your Windows Environment Variables. Restart the CMD console and run `hugo version` to confirm.

5. Start the Web Service: Open CMD in the blog root directory and enter `hugo server`. Once the service starts, visit `http://localhost:1313/en/` in your browser to preview the blog.
