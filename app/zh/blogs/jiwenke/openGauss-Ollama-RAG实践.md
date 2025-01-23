# openGauss RAG实践：从0开始搭建私有本地知识库
# 前言
LLM（Large Language Model，大语言模型）是指使用大量文本数据训练的大规模深度学习模型。这些模型通过学习海量数据中的语法和语义关系，能够生成自然语言文本、回答问题、翻译语言和执行其他语言处理任务。
LLM存在如下问题：
- **幻觉**  大语言模型中的幻觉源于数据压缩（data compression）和不一致性（inconsistency）。由于许多数据集可能已经过时或不可靠，因此质量保证具有挑战性。
- **新鲜度** 规模越大（参数越多、tokens越多），大模型训练的成本越高。类似OpenAI的ChatGPT3.5，目前的数据新鲜度依然保留在2021年，对于之后的事情就不知道了。
- **数据安全** OpenAI已经遭到过几次隐私数据的投诉，而对于企业来说，如果把自己的经营数据、合同文件等机密文件和数据上传到互联网上的大模型，那想想都可怕。

RAG（Retrieval Augmented Generation）最初是为了解决LLM的各类问题的产生的，但后面大家发现在现阶段的很多企业痛点上，使用RAG好像是更好的解决方案。
RAG检索增强生成。它的主要作用是生成（最终的答案），但是它先做了对现有文档的检索，而不是任由LLM来发挥。
本文我们将利用openGauss和Ollama从0开始搭建一个本地化的RAG应用。
# 前期准备
本文实践操作系统为 **openEuler 22.03 LTS(x86_64)**。
为保证各组件互相兼容及顺利运行，我们使用 **python3.11.11**，安装如下：
```abap
[test@localhost ~]$ wget https://www.python.org/ftp/python/3.11.11/Python-3.11.11.tar.xz
[test@localhost ~]$ tar -xf Python-3.11.11.tar.xz
[test@localhost ~]$ cd Python-3.11.11; mkdir build
[test@localhost Python-3.11.11]$ ./configure --enable-optimizations --prefix=/home/test/Python-3.11.11/build/
[test@localhost Python-3.11.11]$ make -j; make install -j
```
至此python3已经安装完成，添加环境变量:
```abap
[test@localhost ~]$ echo "export PATH=/home/test/Python-3.11.11/build/bin:$PATH" >> ~/.bashrc
[test@localhost ~]$ echo "export LD_LIBRARY_PATH=/home/test/Python-3.11.11/build/lib:$LD_LIBRARY_PATH" >> ~/.bashrc
[test@localhost ~]$ source ~/.bashrc
[test@localhost ~]$ python3 --version
Python 3.11.11
```
# Ollama大模型
首先我们先下载ollama的pypi包，后续用于访问ollama服务：
```abap
[test@localhost ~]$ pip3 install ollama
```
然后开始部署ollama服务，ollama部署较为简单，官网给出了一键式部署脚本：
```abap
curl -fsSL https://ollama.com/install.sh | sh
```
顺利的话能够直接安装成功，直接启动ollama服务即可，如果遇到网络问题无法直接安装的情况可考虑如下手动方案：
```abap
[test@localhost ~]$ wget https://ollama.com/download/ollama-linux-amd64.tgz
[test@localhost ~]$ tar -zxvf ollama-linux-amd64.tgz -C /home/test/Python-3.11.11/build/
[test@localhost ~]$ which ollama
/home/test/Python-3.11.11/build/bin/ollama
```
注：arm下载地址为https://ollama.com/download/ollama-linux-arm64.tgz

安装成功后启动ollama服务：
```abap
[test@localhost ~]$ ollama serve &
```
RAG应用需要文本嵌入模型和文本生成模型，ollama提供了多种模型选择，本文我们采用**deepseek-r1**用于文本生成任务，**nomic-embed-text**用于嵌入任务。
```abap
[test@localhost ~]$ ollama --version
ollama version is 0.5.6
```
```abap
[test@localhost ~]$ ollama pull deepseek-r1
[test@localhost ~]$ ollama pull nomic-embed-text
```
# openGauss
首先下载依赖：
```abap
[test@localhost ~]$ pip3 install psycopg2
```

通过如下命令获取openGauss镜像：
```abap
[root@localhost ~]$ wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/latest/x86_openEuler/openGauss-Docker-7.0.0-RC1.tar
[root@localhost ~]$ docker load -i openGauss-Docker-7.0.0-RC1.tar
```
注：arm获取方式为`wget https://opengauss.obs.cn-south-1.myhuaweicloud.com/latest/arm/openGauss-Docker-7.0.0-RC1.tar`
镜像拉取完成后启动openGauss服务：
```abap
[root@localhost ~]$ docker run --name opengauss --privileged=true -d -e GS_PASSWORD=Test@123 -p 8888:5432 -v /home/test/opengauss:/var/lib/opengauss opengauss:7.0.0-RC1
```
至此，openGauss已经安装部署成功，通过psycopg2连接opengauss查看版本信息：
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

# 构建RAG
## 准备数据
本文以openGauss部分语料数据作为私域知识，下载文件
```python
[test@localhost ~]$ wget https://gitee.com/opengauss/website/raw/v2/app/zh/faq/index.md
```
对语料进行预处理:
```python
file_path = '/home/test/index.md'
  
with open(file_path, 'r', encoding='utf-8') as file:
    content = file.read()

paragraphs = content.split('##')

for i, paragraph in enumerate(paragraphs):
    print(f'段落 {i + 1}:\n{paragraph}\n')
    print('-' * 20)
```
## 语料嵌入
在前述章节里，我们已经准备好了**nomic-embed-text**嵌入模型。这里进行简单测试如下：
```python
import ollama
  
def embedding(text):
    vector = ollama.embeddings(model="nomic-embed-text", prompt=text)
    return vector["embedding"]

text = "openGauss是一款开源数据库"
emb = embedding(text)
dimensions = len(emb)
print("text : {}, embedding dim : {}, enbedding : {} ...".format(text, dimensions, emb[:10]))
```
```python
text : openGauss是一款开源数据库, embedding dim : 768, enbedding : [-0.5359194278717041, 1.3424185514450073, -3.524909734725952, -1.0017194747924805, -0.1950572431087494, 0.28160029649734497, -0.473337858915329, 0.08056074380874634, -0.22012852132320404, -0.9982725977897644] ...
```
## 数据导入
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
创建包含文本数据和向量数据的table:
```
#建表
cur = conn.cursor()
cur.execute("DROP TABLE IF EXISTS {};".format(table_name))
cur.execute("CREATE TABLE {} (id INT PRIMARY KEY, content TEXT, emb vector({}));".format(table_name, dimensions))
conn.commit()
```
将处理好的语料数据向量化后倒入到openGauss数据库中，并创建索引：
```
#插入数据
for i, paragraph in enumerate(paragraphs):
    emb = embedding(paragraph)
    insert_data_sql = f'''INSERT INTO {table_name} (id, content, emb) VALUES (%s, %s, %s);'''
    cur.execute(insert_data_sql, (i, paragraph, emb))
conn.commit()

#创建索引
cur.execute("CREATE INDEX ON {} USING hnsw (emb vector_l2_ops);".format(table_name))
conn.commit()
```
## 查询检索
我们尝试询问如下问题：
```abap
question = "openGauss发布了哪些版本？"
```
在openGauss中检索该问题以获取之前导入数据库中的相关文档：
```
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
## 结合LLM实现RAG
首先，为对比RAG前后效果，我们直接询问大模型得到如下答案，结果并不理想：
```abap
嗯，我现在想了解一下openGauss有哪些发布版本。我之前对这个软件不太熟悉，但听说它是一个用于关系型数据库的高可用性云原生解决方案，可能和 PostgreSQL 类似。首先，我应该确认一下什么是openGauss，它的主要用途是什么，以及它在市场上的地位。

然后，关于发布版本的部分，用户想知道有哪些具体的版本号。我记得有时候软件会有主版本（major version）和次版本（minor version），还有内部版本（微内核）。例如，PostgreSQL的版本通常以9.x、10.x这样的命名，所以openGauss可能也有类似的结构。

我需要查一下最新的信息，看看官方或者可靠的第三方网站有没有发布过的版本列表。可能的话，还可以查看社区讨论或开发者文档，了解不同版本之间的区别和新增的功能。

另外，开放源代码项目通常会记录所有已发布的版本，甚至包括一些内部版本。所以，我应该考虑访问项目官网的版本历史部分，或者是相关的GitHub仓库，看看是否有详细的发布日志。

还有一点是，有时候软件会在不同地区或国家有不同的本地版本，这可能影响到发布的名称和编号。例如，在中国，可能会有本地化的版本，比如openGauss-GA-1.x这样的命名方式。
```
借助openGauss检索结果作为上下文，将文档进行格式化处理，并为大模型制定PROMPT：
```abap
context = "\n".join(row[0] for row in rows)

SYSTEM_PROMPT = "你作为一个对话AI助手，结合上下文信息简练高效的回答用户提出的问题"
USER_PROMPT = f"请结合{context}信息来回答{question}的问题，不需要额外的无用回答"

```
使用ollama的**deepseek-r1**大模型进行知识问答：
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
</think>

openGauss 社区发布的主要版本类型包括：

1. **企业版**：适合企业用户，提供全面的集群管理功能。
2. **极简版**：适用于个人开发者，安装配置简单且解压即可使用。
3. **轻量版**：精简功能，适合需要小而精的应用场景。
4. **分布式镜像**：基于 ShardingSphere 和 k8s 的分布式容器化镜像。

这些版本根据不同的应用场景提供定制化的解决方案。LTS 版本作为长期支持版本，创新版本则供用户进行联创测试使用。当出现重大问题时，会发布补丁版本进行修复。更多信息可参考 openGauss 官网。
```
最后，我们已经成功利用openGauss和Ollama搭建了一个简易的RAG应用，获取到了想要的知识数据。