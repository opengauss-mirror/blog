---

title : "MogDB 全文搜索-分词器"

date : "2022-09-29"

tags : ["MogDB 全文搜索-分词器"]

archives : "2022-09"

author : "由迪"

summary : "MogDB 全文搜索-分词器"

img : "/zh/post/liuxu/title/img.png"

times : "10:20"
category: 'blog'

---

# MogDB 全文搜索-分词器

全文检索功能还可以做更多事情：忽略索引某个词（停用词），处理同义词和使用复杂解析，例如：不仅基于空格的解析。这些功能通过文本搜索分词器控制。MogDB 支持多语言的预定义的分词器，并且可以创建分词器（gsql 的\dF 命令显示了所有可用分词器）。

在安装期间选择一个合适的分词器，并且在 postgresql.conf 中相应的设置 default_text_search_config。如果为了 MogDB 使用同一个文本搜索分词器可以使用 postgresql.conf 中的值。如果需要在 MogDB 中使用不同分词器，可以使用 ALTER DATABASE … SET 在任一数据库进行配置。用户也可以在每个会话中设置 default_text_search_config。

每个依赖于分词器的文本搜索函数有一个可选的配置参数，用以明确声明所使用的分词器。仅当忽略这个参数的时候，才使用 default_text_search_config。

为了更方便的建立自定义文本搜索分词器，可以通过简单的数据库对象建立分词器。 MogDB 文本搜索功能提供了四种类型与分词器相关的数据库对象：

文本搜索解析器将文档分解为 token，并且分类每个 token（例如：词和数字）。
文本搜索词典将 token 转换成规范格式并且丢弃停用词。
文本搜索模板提供潜在的词典功能：一个词典指定一个模板，并且为模板设置参数。
文本搜索分词器选择一个解析器，并且使用一系列词典规范化语法分析器产生的 token。

[mogdb](https://www.modb.pro/tag/mogdb?type=knowledge)[分词](https://www.modb.pro/tag/分词?type=knowledge)[文本分类](https://www.modb.pro/tag/文本分类?type=knowledge)[全文搜索](https://www.modb.pro/tag/全文搜索?type=knowledge)
