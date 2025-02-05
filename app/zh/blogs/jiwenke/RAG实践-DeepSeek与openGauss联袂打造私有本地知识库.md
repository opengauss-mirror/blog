# RAG 实践：openGauss基于DeepSeek打造私有本地知识库

## 引言：LLM 的辉煌与困境
在当今蓬勃发展的人工智能领域，大语言模型（LLM，Large Language Model）无疑是那颗最为璀璨的明星，吸引着全球研究者和开发者的目光。LLM 凭借其对海量文本数据的深度学习，掌握了语法和语义的复杂关系，从而具备了生成自然语言文本、精准回答各类问题、进行多语言翻译以及执行其他复杂语言任务的卓越能力。

然而，在 LLM 看似辉煌的应用背后，却隐藏着一系列不容忽视的问题，这些问题如同潜藏在深海中的暗礁，阻碍着 LLM 在实际场景中的广泛应用。

### 幻觉问题：数据质量的阴影
大语言模型中的幻觉现象，其根源主要在于数据压缩（data compression）和数据的不一致性（inconsistency）。在模型训练过程中，大量的数据集由于其本身的过时性或不可靠性，给模型的质量保障带来了巨大挑战。这就如同在建造一座大厦时，使用了质量参差不齐的建筑材料，最终导致大厦的结构出现不稳定因素。在这种情况下，模型可能会生成看似合理，但实际上却与事实严重不符的信息，极大地影响了其可靠性和实用性。

### 新鲜度问题：数据时效性的桎梏
一般而言，LLM 的规模与训练成本呈正相关，即参数数量越多、处理的 tokens 越多，训练成本就越高。以 OpenAI 的 ChatGPT 3.5 为例，尽管它在诸多方面展现出了令人瞩目的性能，但截至目前，其数据的新鲜度仍停留在 2021 年。这就意味着，当面对 2021 年之后发生的各种事件和信息时，ChatGPT 3.5 往往无法给出准确且及时的回应。在这个信息瞬息万变的时代，LLM 因数据陈旧而无法提供实时有效的信息，无疑成为了其发展的一大瓶颈。

### 数据安全问题：隐私保护的警钟
OpenAI 多次因隐私数据问题而遭到投诉，这无疑给整个行业敲响了警钟。对于企业来说，经营数据、合同文件等机密信息是其核心资产，如同企业的生命线。如果将这些机密文件和数据上传到互联网上的大模型中，其潜在的风险是难以估量的。一旦发生数据泄露事件，企业可能会遭受沉重的打击，包括巨大的经济损失、声誉受损等。

## RAG 技术：破局之道
为了有效解决 LLM 存在的上述问题，检索增强生成（RAG，Retrieval Augmented Generation）技术应运而生。RAG 最初的设计初衷是为了解决 LLM 的各类问题，但在实际应用中，人们发现它在现阶段的许多企业痛点上都能提供更为有效的解决方案。

RAG 的核心在于检索增强生成，即在生成最终答案之前，先对现有的文档进行检索，而不是完全依赖 LLM 的自由发挥。这种方式使得 RAG 能够充分利用已有的文档信息，极大地提高了答案的准确性和可靠性，同时也在一定程度上避免了 LLM 可能出现的幻觉问题。

## 实践准备：搭建基础环境
### 操作系统与 Python 环境配置
本文实践所采用的操作系统为 **openEuler 22.03 LTS(x86_64)**。为了确保各个组件之间能够实现无缝兼容并顺利运行，我们选择使用 **python3.11**。

## DeepSeek推理模型部署：解锁强大文本生成能力
### 安装Ollama服务
首先，我们需要下载 ollama 的 pypi 包，以便后续访问 ollama 服务：

```abap
[test@localhost ~]$ pip3 install ollama
```

然后，我们可以使用官网提供的一键式部署脚本来部署 ollama 服务：

```abap
curl -fsSL https://ollama.com/install.sh | sh
```

如果遇到网络问题无法直接安装，我们可以考虑采用手动方案：

```abap
[test@localhost ~]$ wget https://ollama.com/download/ollama-linux-amd64.tgz
[test@localhost ~]$ tar -zxvf ollama-linux-amd64.tgz -C /usr/
[test@localhost ~]$ which ollama
/usr/bin/ollama
```

注：arm 架构的下载地址为 https://ollama.com/download/ollama-linux-arm64.tgz

安装成功后，我们可以启动 ollama 服务：

```abap
[test@localhost ~]$ ollama serve &
```

### 选择关键模型：DeepSeek与nomic-embed-text的协同
在RAG应用中，文本嵌入模型和文本生成模型是至关重要的组成部分。ollama为我们提供了丰富多样的模型选择，而在本次实践中，我们着重引入了DeepSeek家族中的**deepseek-r1**模型来承担文本生成这一核心任务。

**deepseek-r1** 模型是基于先进的深度学习技术开发的，它具有独特的架构和训练方式，能够更好地捕捉文本中的语义信息，从而为文本生成带来更出色的效果。同时，我们选用**nomic-embed-text**模型用于嵌入任务，该模型能够将文本转换为高维向量表示，为后续的检索和匹配提供了强有力的支持。二者协同工作，共同助力我们基于DeepSeek与openGauss打造的私有本地知识库，使其能够更高效、更精准地为用户提供服务。

```abap
[test@localhost ~]$ ollama --version
ollama version is 0.5.6
```

```abap
[test@localhost ~]$ ollama pull deepseek-r1
[test@localhost ~]$ ollama pull nomic-embed-text
```

## openGauss安装部署：构建可靠数据存储基石
### 下载依赖
首先，我们需要下载 psycopg2 依赖：

```abap
[test@localhost ~]$ pip3 install psycopg2
```

### 获取镜像
通过如下命令获取 openGauss 镜像：

```abap
[root@localhost ~]$ wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/latest/x86_openEuler/openGauss-Docker-7.0.0-RC1.tar
[root@localhost ~]$ docker load -i openGauss-Docker-7.0.0-RC1.tar
```

注：arm 架构的获取方式为 `wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/latest/arm/openGauss-Docker-7.0.0-RC1.tar`

### 启动服务
镜像拉取完成后，我们可以启动openGauss服务：

```abap
[root@localhost ~]$ docker run --name opengauss --privileged=true -d -e GS_PASSWORD=Test@123 -p 8888:5432 -v /home/test/opengauss:/var/lib/opengauss opengauss:7.0.0-RC1
```

至此，openGauss已经成功安装部署，我们可以通过psycopg2连接openGauss查看版本信息：

```python
import psycopg2

conn = psycopg2.connect(
    database="postgres",
    user="gaussdb",
    password="Test@123",
    host="127.0.0.1",
    port="8888"
)

cur = conn.cursor()
cur.execute("select version();")
rows = cur.fetchall()
print(rows)
```

```python
[('(openGauss 7.0.0-RC1 build 3fb58c89) compiled at 2025-01-20 00:24:26 commit 0 last mr   on x86_64-unknown-linux-gnu, compiled by g++ (GCC) 10.3.0, 64-bit',)]
```

## 构建RAG应用：实现知识的高效检索与生成
### 准备数据
本文以 openGauss 部分语料数据作为私域知识，下载文件：

```python
[test@localhost ~]$ wget https://gitee.com/opengauss/website/raw/v2/app/zh/faq/index.md
```

对语料进行预处理：

```python
file_path = '/home/test/index.md'

with open(file_path, 'r', encoding='utf-8') as file:
    content = file.read()

paragraphs = content.split('##')

for i, paragraph in enumerate(paragraphs):
    print(f'段落 {i + 1}:\n{paragraph}\n')
    print('-' * 20)
```

### 语料嵌入
在前述章节里，我们已经准备好了**nomic-embed-text**嵌入模型。这里进行简单测试如下：

```python
import ollama

def embedding(text):
    vector = ollama.embeddings(model="nomic-embed-text", prompt=text)
    return vector["embedding"]

text = "openGauss 是一款开源数据库"
emb = embedding(text)
dimensions = len(emb)
print("text : {}, embedding dim : {}, enbedding : {} ...".format(text, dimensions, emb[:10]))
```

```python
text : openGauss 是一款开源数据库, embedding dim : 768, enbedding : [-0.5359194278717041, 1.3424185514450073, -3.524909734725952, -1.0017194747924805, -0.1950572431087494, 0.28160029649734497, -0.473337858915329, 0.08056074380874634, -0.22012852132320404, -0.9982725977897644] ...
```

### 数据导入
根据事先启动的openGauss docker服务连接信息建立连接：

```python
import psycopg2

table_name = "opengauss_data"

conn = psycopg2.connect(
    database="postgres",
    user="gaussdb",
    password="Test@123",
    host="127.0.0.1",
    port="8888"
)
```

创建包含文本数据和向量数据的table：

```python
# 建表
cur = conn.cursor()
cur.execute("DROP TABLE IF EXISTS {};".format(table_name))
cur.execute("CREATE TABLE {} (id INT PRIMARY KEY, content TEXT, emb vector({}));".format(table_name, dimensions))
conn.commit()
```

将处理好的语料数据向量化后导入到openGauss数据库中，并创建索引：

```python
# 插入数据
for i, paragraph in enumerate(paragraphs):
    emb = embedding(paragraph)
    insert_data_sql = f'''INSERT INTO {table_name} (id, content, emb) VALUES (%s, %s, %s);'''
    cur.execute(insert_data_sql, (i, paragraph, emb))
conn.commit()

# 创建索引
cur.execute("CREATE INDEX ON {} USING hnsw (emb vector_l2_ops);".format(table_name))
conn.commit()
```

### 查询检索
我们尝试询问如下问题：

```abap
question = "openGauss 发布了哪些版本？"
```

在openGauss中检索该问题以获取之前导入数据库中的相关文档：

```python
emb_data = embedding(question)
dimensions = len(emb_data)

cur = conn.cursor()
cur.execute("select content from {} order by emb <-> '{}' limit 1;".format(table_name, emb_data))
conn.commit()

rows = cur.fetchall()
print(rows)

cur.close()
conn.close()
```

查询结果如下：

```abap
[(' 3. openGauss 有哪些版本？\n\nopenGauss 社区每两年发布一个 LTS 版本，LTS 版本作为长期支持版本，可规模上线使用。半年发布一个创新版本，创新版本供用户联创测试使用；涉及重大问题修复时，会按需发布补丁版本。同时按照不同场景分为以下版本：\n\n1. openGauss 企业版:具备更齐全的集群管理功能,适合企业用户；\n2. openGauss 极简版:安装配置简单,解压可用,适合个人开发者；\n3. openGauss 轻量版:精简功能,缩减安装包大小,内存占用更少；\n4. openGauss 分布式镜像:基于 ShardingSphere 和 k8s 的分布式容器化镜像。\n\n详情参考 openGauss 官网[“学习”->“文档”](https://docs-opengauss.osinfra.cn)区域。\n\n',)]
```

### 结合LLM实现RAG
首先，为对比RAG前后效果，我们直接询问大模型得到如下答案，结果并不理想：

```abap
嗯，我现在想了解一下 openGauss 有哪些发布版本。我之前对这个软件不太熟悉，但听说它是一个用于关系型数据库的高可用性云原生解决方案，可能和 PostgreSQL 类似。首先，我应该确认一下什么是 openGauss，它的主要用途是什么，以及它在市场上的地位。

然后，关于发布版本的部分，用户想知道有哪些具体的版本号。我记得有时候软件会有主版本（major version）和次版本（minor version），还有内部版本（微内核）。例如，PostgreSQL 的版本通常以 9.x、10.x 这样的命名，所以 openGauss 可能也有类似的结构。

我需要查一下最新的信息，看看官方或者可靠的第三方网站有没有发布过的版本列表。可能的话，还可以查看社区讨论或开发者文档，了解不同版本之间的区别和新增的功能。

另外，开放源代码项目通常会记录所有已发布的版本，甚至包括一些内部版本。所以，我应该考虑访问项目官网的版本历史部分，或者是相关的 GitHub 仓库，看看是否有详细的发布日志。

还有一点是，有时候软件会在不同地区或国家有不同的本地版本，这可能影响到发布的名称和编号。例如，在中国，可能会有本地化的版本，比如 openGauss - GA - 1.x 这样的命名方式。
```

借助openGauss检索结果作为上下文，将文档进行格式化处理，并为大模型制定PROMPT：

```abap
context = "\n".join(row[0] for row in rows)

SYSTEM_PROMPT = "你作为一个对话 AI 助手，结合上下文信息简练高效的回答用户提出的问题"
USER_PROMPT = f"请结合{context}信息来回答{question}的问题，不需要额外的无用回答"
```

基于ollama平台，我们采用**deepseek-r1**大模型进行知识问答：

```abap
response: ChatResponse = chat(
    model="deepseek-r1",
    messages=[
        {"role": "user", "content": SYSTEM_PROMPT},
        {"role": "user", "content": USER_PROMPT}
    ],
)

print(response["message"]["content"])
```

```abap
好的，我现在要解决用户关于openGauss发布版本的问题。根据提供的上下文信息，openGauss每两年发布一个LTS版本，并且半年发布创新版本，当有重大问题修复时会发布补丁版本。

首先，我需要整理已知的版本类型：

1. **企业版**：面向企业用户，功能齐全。
2. **极简版**：适合个人开发者，安装配置简单，解压即可使用。
3. **轻量版**：精简功能，安装包小，占用内存少。
4. **分布式镜像**：基于ShardingSphere和k8s的分布式容器化镜像。

接下来，LTS版本是长期支持版本，创新版本供联创测试。此外，还有补丁版本用于修复问题。

用户的问题是询问openGauss发布了哪些版本？因此，我需要总结这些信息，列出所有已知版本类型，并说明每个版本的目标用户和功能特点。

最后，确保回答简练、高效，避免任何无用内容。

openGauss 社区发布的主要版本类型包括：

1. **企业版**：适合企业用户，提供全面的集群管理功能。
2. **极简版**：适用于个人开发者，安装配置简单且解压即可使用。
3. **轻量版**：精简功能，适合需要小而精的应用场景。
4. **分布式镜像**：基于 ShardingSphere 和 k8s 的分布式容器化镜像。

这些版本根据不同的应用场景提供定制化的解决方案。LTS 版本作为长期支持版本，创新版本则供用户进行联创测试使用。当出现重大问题时，会发布补丁版本进行修复。更多信息可参考 openGauss 官网。
```
可见，使用 deepseek 结合 openGauss 搭建的 RAG 应用，不仅能借助 deepseek 强大的文本生成能力和精准的文本嵌入功能，还能依托 openGauss 出色的向量数据库高效存储和快速检索向量数据，从而显著提升答案的准确性、可靠性，有效避免大语言模型的幻觉问题，为企业提供更优质的本地化知识服务。
# 结语
最后，我们基于ollama，成功利用openGauss和DeepSeek从零搭建起了简易的 RAG 应用，如愿获取到了所需的知识数据。在这个过程中，我们对 RAG 技术有了更深入的理解，也切实体会到了它在解决 LLM 实际应用问题上的作用。这个简易应用只是一个开端，你可以依据自身需求对相关环节进行灵活调整和优化，以更好地满足不同场景的需要。希望本文能帮助你加深对 RAG 技术应用实践的认识。